// ============================================
// EMM FRÉQUENCE — LOGIQUE PRINCIPALE v3
// ============================================

var currentUser = null;

function showSplash() {
  showScreen('splashScreen');
  setTimeout(function() {
    var sess = DB.get('session');
    if (sess) { currentUser = sess; appliquerSession(); showScreen('mainScreen'); }
    else { showScreen('loginScreen'); var inp = document.getElementById('loginUsername'); if (inp) inp.focus(); }
  }, 2500);
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); s.style.display = 'none'; });
  var el = document.getElementById(id);
  el.classList.add('active');
  el.style.display = (id === 'splashScreen' || id === 'loginScreen') ? 'flex' : 'block';
  window.scrollTo(0, 0);
}

function switchMainTab(name, btn) {
  document.querySelectorAll('.main-tab').forEach(function(t) { t.classList.remove('active'); });
  document.querySelectorAll('.main-tab-content').forEach(function(c) { c.classList.remove('active'); });
  btn.classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');
  if (name === 'general') afficherDashboard();
}

function login() {
  var nom = document.getElementById('loginUsername').value.trim().toLowerCase();
  var pass = document.getElementById('loginPassword').value.trim();
  var errBox = document.getElementById('loginError');
  if (!nom || !pass) { errBox.textContent = '❌ Entrez le nom et le mot de passe'; return; }
  var users = DB.get('users', []);
  var user = users.find(function(u) { return u.nom.toLowerCase() === nom && u.pass === pass; });
  if (!user) { errBox.textContent = '❌ Nom ou mot de passe incorrect'; return; }
  currentUser = user;
  DB.set('session', user);
  errBox.textContent = '';
  document.getElementById('loginUsername').value = '';
  document.getElementById('loginPassword').value = '';
  appliquerSession();
  showScreen('mainScreen');
}

function logout() {
  if (!confirm('Voulez-vous vraiment vous déconnecter ?')) return;
  currentUser = null;
  DB.set('session', null);
  showScreen('loginScreen');
  setTimeout(function() { var inp = document.getElementById('loginUsername'); if (inp) inp.focus(); }, 200);
}

function appliquerSession() {
  if (!currentUser) return;
  var label = document.getElementById('userRoleLabel');
  if (label) label.textContent = (currentUser.role === 'admin' ? '👑 Admin' : '👤 ' + currentUser.nom);
  var wb = document.getElementById('welcomeBox');
  if (wb) wb.innerHTML = '<p style="font-size:14px">Connecté : <strong>' + echapper(currentUser.nom) + '</strong></p>' +
    '<p style="font-size:12px;color:#666;margin-top:4px">Rôle : ' + (currentUser.role === 'admin' ? '👑 Administrateur' : '👤 Utilisateur') + '</p>';
  refreshAll();
  afficherDashboard();
  afficherAnnonces();
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function fmtDate(d) { if (!d) return ''; return new Date(d).toLocaleDateString('fr-FR'); }
function echapper(s) {
  if (s === undefined || s === null) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function isAdmin() { return currentUser && currentUser.role === 'admin'; }

function filtrerListe(list, filtre) {
  if (filtre === 'archive') return list.filter(function(x) { return x.archived === true; });
  if (filtre === 'tous') return list;
  return list.filter(function(x) { return !x.archived; });
}

function afficherAnnonces() {
  var list = DB.get('annonces', []);
  var box = document.getElementById('announcementsBox');
  if (!box) return;
  if (!list.length) { box.innerHTML = '<p>Aucune annonce.</p>'; return; }
  var html = '';
  list.slice().reverse().forEach(function(a) {
    html += '<div class="item-list"' + (a.archived ? ' style="opacity:0.7;background:#f0f0f0"' : '') + '>';
    html += '<strong>📢 ' + a.date + '</strong><br>' + echapper(a.texte);
    if (isAdmin()) {
      html += '<div style="margin-top:6px">';
      html += '<button class="btn-mini orange" onclick="modifierAnnonce(\'' + a.id + '\')">✏️</button>';
      html += '<button class="btn-mini ' + (a.archived ? 'blue' : 'gray') + '" onclick="archiverAnnonce(\'' + a.id + '\')">' + (a.archived ? '↩️' : '📦') + '</button>';
      html += '<button class="btn-mini danger" onclick="supprimerAnnonce(\'' + a.id + '\')">🗑️</button>';
      html += '</div>';
    }
    html += '</div>';
  });
  box.innerHTML = html;
}

function publierAnnonce() {
  if (!isAdmin()) return alert('Réservé admin');
  var texte = document.getElementById('annonceText').value.trim();
  if (!texte) return alert('Écrivez une annonce');
  var list = DB.get('annonces', []);
  list.push({ id: uid(), texte: texte, date: new Date().toLocaleDateString('fr-FR'), auteur: currentUser.nom, archived: false });
  DB.set('annonces', list);
  reinitialiserFormAnnonce();
  afficherAnnonces();
  alert('✅ Annonce publiée');
}

function reinitialiserFormAnnonce() { var el = document.getElementById('annonceText'); if (el) el.value = ''; }
function modifierAnnonce(id) {
  if (!isAdmin()) return alert('Réservé admin');
  var list = DB.get('annonces', []);
  var a = list.find(function(x) { return x.id === id; });
  if (!a) return;
  var txt = prompt('Modifier l\'annonce :', a.texte);
  if (txt === null) return;
  a.texte = txt.trim(); DB.set('annonces', list); afficherAnnonces(); alert('✅ Modifiée');
}
function archiverAnnonce(id) {
  if (!isAdmin()) return alert('Réservé admin');
  var list = DB.get('annonces', []);
  var a = list.find(function(x) { return x.id === id; });
  if (!a) return;
  a.archived = !a.archived; DB.set('annonces', list); afficherAnnonces(); alert(a.archived ? '📦 Archivée' : '↩️ Restaurée');
}
function supprimerAnnonce(id) {
  if (!isAdmin()) return alert('Réservé admin');
  if (!confirm('⚠️ Supprimer cette annonce ?')) return;
  DB.set('annonces', DB.get('annonces', []).filter(function(a) { return a.id !== id; })); afficherAnnonces();
}

function ajouterEntite() {
  var type = document.getElementById('jTypeEntite').value;
  var nom = document.getElementById('jNomEntite').value.trim().toUpperCase();
  var resp = document.getElementById('jResponsable').value.trim();
  if (!nom || !resp) return alert('Remplissez tous les champs');
  var entites = DB.get('entites', []);
  if (entites.find(function(e) { return e.nom === nom && !e.archived; })) return alert('Cette entité existe déjà');
  entites.push({ id: uid(), type: type, nom: nom, responsable: resp, archived: false });
  DB.set('entites', entites); reinitialiserFormEntite(); refreshAll(); alert('✅ Entité ajoutée : ' + nom);
}
function reinitialiserFormEntite() {
  var a = document.getElementById('jNomEntite'); if (a) a.value = '';
  var b = document.getElementById('jResponsable'); if (b) b.value = '';
  var c = document.getElementById('jTypeEntite'); if (c) c.selectedIndex = 0;
}
function rafraichirEntites() {
  var entites = DB.get('entites', []).filter(function(e) { return !e.archived; });
  ['jEntiteSelect', 'mEntite'].forEach(function(id) {
    var sel = document.getElementById(id);
    if (!sel) return;
    var val = sel.value;
    var opts = '';
    entites.forEach(function(e) { opts += '<option value="' + e.id + '">' + e.type + ' - ' + e.nom + '</option>'; });
    sel.innerHTML = opts;
    if (val) sel.value = val;
  });
}
function getEntiteNom(id) {
  var e = DB.get('entites', []).find(function(x) { return x.id === id; });
  return e ? e.type + ' - ' + e.nom : 'Inconnu';
}
function afficherListeEntites() {
  var filtre = document.getElementById('filtreEntites') ? document.getElementById('filtreEntites').value : 'actif';
  var search = (document.getElementById('searchEntiteListe') ? document.getElementById('searchEntiteListe').value : '').toUpperCase();
  var entites = DB.get('entites', []);
  entites = filtrerListe(entites, filtre);
  if (search) entites = entites.filter(function(e) { return e.nom.indexOf(search) !== -1; });
  var box = document.getElementById('listeEntites');
  if (!box) return;
  if (!entites.length) { box.innerHTML = '<p>Aucune entité.</p>'; return; }
  var html = '';
  entites.forEach(function(e) {
    html += '<div class="item-list" style="padding:12px' + (e.archived ? ';opacity:0.7;background:#f0f0f0' : '') + '">';
    html += '<div style="font-size:14px;color:#0a6e2c;font-weight:600;margin-bottom:4px">🏛️ ' + echapper(e.type) + ' - ' + echapper(e.nom) + (e.archived ? ' <span class="badge badge-archive">📦 Archivée</span>' : '') + '</div>';
    html += '<div style="font-size:12px;color:#666;margin-bottom:8px">👤 ' + echapper(e.responsable) + '</div>';
    html += '<button class="btn-mini orange" onclick="modifierEntite(\'' + e.id + '\')">✏️ Modifier</button> ';
    html += '<button class="btn-mini ' + (e.archived ? 'blue' : 'gray') + '" onclick="archiverEntite(\'' + e.id + '\')">' + (e.archived ? '↩️ Désarchiver' : '📦 Archiver') + '</button> ';
    html += '<button class="btn-mini danger" onclick="supprimerEntite(\'' + e.id + '\')">🗑️ Supprimer</button>';
    html += '</div>';
  });
  box.innerHTML = html;
}
function modifierEntite(id) {
  var list = DB.get('entites', []);
  var e = list.find(function(x) { return x.id === id; });
  if (!e) return;
  var type = prompt('Type :', e.type); if (type === null) return;
  var nom = prompt('Nom :', e.nom); if (nom === null) return;
  var resp = prompt('Responsable :', e.responsable); if (resp === null) return;
  var nouveauNom = nom.trim().toUpperCase();
  if (!nouveauNom) return alert('Nom vide');
  var doublon = list.find(function(x) { return x.id !== id && x.nom === nouveauNom && !x.archived; });
  if (doublon) return alert('⚠️ Nom déjà utilisé');
  e.type = type.trim() || e.type; e.nom = nouveauNom; e.responsable = resp.trim();
  DB.set('entites', list); refreshAll(); alert('✅ Modifiée');
}
function archiverEntite(id) {
  var list = DB.get('entites', []);
  var e = list.find(function(x) { return x.id === id; });
  if (!e) return;
  if (!e.archived) { if (!confirm('📦 Archiver "' + e.nom + '" ?')) return; e.archived = true; } else { e.archived = false; }
  DB.set('entites', list); refreshAll(); alert(e.archived ? '📦 Archivée' : '↩️ Restaurée');
}
function supprimerEntite(id) {
  var e = DB.get('entites', []).find(function(x) { return x.id === id; });
  if (!e) return;
  var parts = DB.get('participations', []).filter(function(p) { return p.entiteId === id; });
  var msg = '⚠️ Supprimer "' + e.nom + '" ?';
  if (parts.length) msg += '\n\n' + parts.length + ' participation(s) liée(s) supprimée(s).';
  if (!confirm(msg)) return;
  DB.set('entites', DB.get('entites', []).filter(function(x) { return x.id !== id; }));
  DB.set('participations', DB.get('participations', []).filter(function(p) { return p.entiteId !== id; }));
  refreshAll(); alert('✅ Supprimée');
}

function enregistrerParticipation() {
  var entiteId = document.getElementById('jEntiteSelect').value;
  var date = document.getElementById('jDate').value;
  var m = parseInt(document.getElementById('jMembres').value) || 0;
  var s = parseInt(document.getElementById('jSympathisants').value) || 0;
  var n = parseInt(document.getElementById('jNouveaux').value) || 0;
  if (!entiteId) return alert('⚠️ Enregistrez d\'abord une entité');
  if (!date) return alert('Choisissez une date');
  var list = DB.get('participations', []);
  list.push({ id: uid(), entiteId: entiteId, date: date, m: m, s: s, n: n, createdAt: new Date().toISOString(), auteur: currentUser ? currentUser.nom : '', archived: false });
  DB.set('participations', list); reinitialiserFormParticipation(); afficherJournaliere(); alert('✅ Enregistrée');
}
function reinitialiserFormParticipation() {
  var a = document.getElementById('jDate'); if (a) a.value = '';
  var b = document.getElementById('jMembres'); if (b) b.value = 0;
  var c = document.getElementById('jSympathisants'); if (c) c.value = 0;
  var d = document.getElementById('jNouveaux'); if (d) d.value = 0;
}
function afficherJournaliere() {
  var filtre = document.getElementById('filtreParticipations') ? document.getElementById('filtreParticipations').value : 'actif';
  var allParts = DB.get('participations', []);
  var parts = filtrerListe(allParts, filtre);
  var box = document.getElementById('listeJournaliere');
  if (!box) return;
  if (!parts.length) { box.innerHTML = '<p>Aucune donnée.</p>'; return; }
  var parEntite = {};
  parts.forEach(function(p) { if (!parEntite[p.entiteId]) parEntite[p.entiteId] = []; parEntite[p.entiteId].push(p); });
  var html = '';
  Object.keys(parEntite).forEach(function(eid) {
    var lignes = parEntite[eid].slice().sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
    var tm = 0, ts = 0, tn = 0;
    lignes.forEach(function(p) { tm += p.m; ts += p.s; tn += p.n; });
    html += '<div class="entity-block">';
    html += '<h4>📍 ' + echapper(getEntiteNom(eid)) + '</h4>';
    html += '<div class="table-wrapper"><table class="data-table">';
    html += '<thead><tr><th>Date</th><th>M</th><th>S</th><th>NV</th><th>Actions</th></tr></thead><tbody>';
    lignes.forEach(function(p) {
      html += '<tr' + (p.archived ? ' style="opacity:0.6"' : '') + '><td>' + fmtDate(p.date) + '</td><td class="num">' + p.m + '</td><td class="num">' + p.s + '</td><td class="num">' + p.n + '</td>';
      html += '<td><button class="btn-mini orange" onclick="modifierParticipation(\'' + p.id + '\')">✏️</button>';
      html += '<button class="btn-mini ' + (p.archived ? 'blue' : 'gray') + '" onclick="archiverParticipation(\'' + p.id + '\')">' + (p.archived ? '↩️' : '📦') + '</button>';
      html += '<button class="btn-mini danger" onclick="supprimerParticipation(\'' + p.id + '\')">🗑️</button></td></tr>';
    });
    html += '</tbody><tfoot><tr><td>TOTAL</td><td class="num">' + tm + '</td><td class="num">' + ts + '</td><td class="num">' + tn + '</td><td></td></tr></tfoot>';
    html += '</table></div></div>';
  });
  box.innerHTML = html;
}
function modifierParticipation(id) {
  var list = DB.get('participations', []);
  var p = list.find(function(x) { return x.id === id; });
  if (!p) return;
  var date = prompt('Date (AAAA-MM-JJ) :', p.date); if (date === null) return;
  var m = prompt('Membres :', p.m); if (m === null) return;
  var s = prompt('Sympathisants :', p.s); if (s === null) return;
  var n = prompt('Nouveaux venus :', p.n); if (n === null) return;
  p.date = date.trim(); p.m = parseInt(m) || 0; p.s = parseInt(s) || 0; p.n = parseInt(n) || 0;
  DB.set('participations', list); afficherJournaliere(); alert('✅ Modifiée');
}
function archiverParticipation(id) {
  var list = DB.get('participations', []);
  var p = list.find(function(x) { return x.id === id; });
  if (!p) return;
  p.archived = !p.archived; DB.set('participations', list); afficherJournaliere(); alert(p.archived ? '📦 Archivée' : '↩️ Restaurée');
}
function supprimerParticipation(id) {
  if (!confirm('⚠️ Supprimer cette participation ?')) return;
  DB.set('participations', DB.get('participations', []).filter(function(x) { return x.id !== id; })); afficherJournaliere();
}

function enregistrerFicheMensuelle() {
  var numericIds = ['mEncadreurs','mMembresActifs','mSympathisants','mFMembres','mFSympathisants','mFNouveaux','mFoyersLumiere','mAvecGoshintai','mSansGoshintai','mFoyersSymp','mFleurs','mPotagers','mTotalPotagers','mMaisonsOuvertes','mTemoignages','mCandGoshintai','mConfInit','mConfReinit','mConfShoku','mConfKannon','mConfMitamaya','mAssistMembres','mAssistSymp','mConcessions','mTerrains','mCampagnes','mCoursEns','mCoursFleurs'];
  var f = {
    id: uid(), entiteId: document.getElementById('mEntite').value, mois: document.getElementById('mMois').value, annee: document.getElementById('mAnnee').value,
    responsable: document.getElementById('mResponsable').value, jourReunion: document.getElementById('mJourReunion').value,
    themes: document.getElementById('mThemes').value, graces: document.getElementById('mGraces').value, points: document.getElementById('mPoints').value,
    solutions: document.getElementById('mSolutions').value, objectifs: document.getElementById('mObjectifs').value, actions: document.getElementById('mActions').value,
    archived: false, dateCreation: new Date().toISOString()
  };
  numericIds.forEach(function(id) { var el = document.getElementById(id); f[id] = el ? (parseInt(el.value) || 0) : 0; });
  if (!f.entiteId) return alert('⚠️ Enregistrez d\'abord une entité');
  var list = DB.get('fichesMensuelles', []);
  list.push(f); DB.set('fichesMensuelles', list); alert('✅ Fiche enregistrée');
}
function reinitialiserFormFiche() {
  var ids = ['mResponsable','mThemes','mGraces','mPoints','mSolutions','mObjectifs','mActions'];
  ids.forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ''; });
  var nums = ['mEncadreurs','mMembresActifs','mSympathisants','mFMembres','mFSympathisants','mFNouveaux','mFoyersLumiere','mAvecGoshintai','mSansGoshintai','mFoyersSymp','mFleurs','mPotagers','mTotalPotagers','mMaisonsOuvertes','mTemoignages','mCandGoshintai','mConfInit','mConfReinit','mConfShoku','mConfKannon','mConfMitamaya','mAssistMembres','mAssistSymp','mConcessions','mTerrains','mCampagnes','mCoursEns','mCoursFleurs'];
  nums.forEach(function(id) { var el = document.getElementById(id); if (el) el.value = 0; });
}
function tableFicheMensuelle(f) {
  var h = '<div class="entity-block"' + (f.archived ? ' style="opacity:0.7;background:#f0f0f0"' : '') + '>';
  h += '<h4>📍 ' + echapper(getEntiteNom(f.entiteId)) + ' — ' + echapper(f.mois) + ' ' + echapper(f.annee);
  if (f.archived) h += ' <span class="badge badge-archive">📦 Archivée</span>';
  h += '</h4>';
  h += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0;padding:10px;background:#fff;border-radius:8px;border:1px dashed #0a6e2c">';
  h += '<button class="btn-mini orange" onclick="modifierFiche(\'' + f.id + '\')" style="padding:8px 12px;font-size:12px">✏️ Modifier</button>';
  if (f.archived) h += '<button class="btn-mini blue" onclick="archiverFiche(\'' + f.id + '\')" style="padding:8px 12px;font-size:12px">↩️ Désarchiver</button>';
  else h += '<button class="btn-mini gray" onclick="archiverFiche(\'' + f.id + '\')" style="padding:8px 12px;font-size:12px">📦 Archiver</button>';
  h += '<button class="btn-mini danger" onclick="supprimerFiche(\'' + f.id + '\')" style="padding:8px 12px;font-size:12px">🗑️ Supprimer</button>';
  h += '</div>';
  h += '<div class="table-wrapper"><table class="data-table"><tbody>';
  h += '<tr><td>Responsable</td><td>' + echapper(f.responsable) + '</td></tr>';
  h += '<tr><td>Encadreurs</td><td class="num">' + (f.mEncadreurs || 0) + '</td></tr>';
  h += '<tr><td>Membres actifs</td><td class="num">' + (f.mMembresActifs || 0) + '</td></tr>';
  h += '<tr><td>Sympathisants</td><td class="num">' + (f.mSympathisants || 0) + '</td></tr>';
  h += '<tr><td>Membres (culte)</td><td class="num">' + (f.mFMembres || 0) + '</td></tr>';
  h += '<tr><td>Symp. (culte)</td><td class="num">' + (f.mFSympathisants || 0) + '</td></tr>';
  h += '<tr><td>Nouv. venus</td><td class="num">' + (f.mFNouveaux || 0) + '</td></tr>';
  h += '<tr><td>Thèmes</td><td>' + echapper(f.themes) + '</td></tr>';
  h += '<tr><td>Grâces</td><td>' + echapper(f.graces) + '</td></tr>';
  h += '<tr><td>Points à améliorer</td><td>' + echapper(f.points) + '</td></tr>';
  h += '<tr><td>Solutions</td><td>' + echapper(f.solutions) + '</td></tr>';
  h += '<tr><td>Objectifs</td><td>' + echapper(f.objectifs) + '</td></tr>';
  h += '<tr><td>Actions</td><td>' + echapper(f.actions) + '</td></tr>';
  h += '</tbody></table></div></div>';
  return h;
}
function modifierFiche(id) {
  var list = DB.get('fichesMensuelles', []);
  var f = list.find(function(x) { return x.id === id; });
  if (!f) return;
  var resp = prompt('Responsable :', f.responsable); if (resp === null) return; f.responsable = resp.trim();
  var themes = prompt('Thèmes :', f.themes); if (themes === null) return; f.themes = themes;
  var graces = prompt('Grâces :', f.graces); if (graces === null) return; f.graces = graces;
  var points = prompt('Points :', f.points); if (points === null) return; f.points = points;
  var sol = prompt('Solutions :', f.solutions); if (sol === null) return; f.solutions = sol;
  var obj = prompt('Objectifs :', f.objectifs); if (obj === null) return; f.objectifs = obj;
  var act = prompt('Actions :', f.actions); if (act === null) return; f.actions = act;
  DB.set('fichesMensuelles', list); alert('✅ Modifiée'); rechercherFreqAvance();
}
function archiverFiche(id) {
  var list = DB.get('fichesMensuelles', []);
  var f = list.find(function(x) { return x.id === id; });
  if (!f) return;
  f.archived = !f.archived; DB.set('fichesMensuelles', list); alert(f.archived ? '📦 Archivée' : '↩️ Restaurée'); rechercherFreqAvance();
}
function supprimerFiche(id) {
  if (!confirm('⚠️ Supprimer cette fiche ?')) return;
  DB.set('fichesMensuelles', DB.get('fichesMensuelles', []).filter(function(x) { return x.id !== id; })); alert('✅ Supprimée'); rapportFreqDetaille();
}
function rechercherFreqAvance() {
  var q = (document.getElementById('searchFreq').value || '').toUpperCase().trim();
  var annee = (document.getElementById('searchFreqAnnee').value || '').trim();
  var mois = document.getElementById('searchFreqMois').value;
  var statut = document.getElementById('searchFreqStatut').value;
  var fiches = DB.get('fichesMensuelles', []); fiches = filtrerListe(fiches, statut);
  fiches = fiches.filter(function(f) {
    var nom = getEntiteNom(f.entiteId).toUpperCase();
    var okQ = !q || nom.indexOf(q) !== -1;
    var okA = !annee || String(f.annee) === annee;
    var okM = !mois || f.mois === mois;
    return okQ && okA && okM;
  });
  var html = '<h3>Résultats (' + fiches.length + ')</h3>';
  if (!fiches.length) html += '<p>Aucun résultat.</p>';
  else fiches.forEach(function(f) { html += tableFicheMensuelle(f); });
  document.getElementById('rapportFreqBox').innerHTML = html;
}
function reinitialiserRechercheFreq() {
  var a = document.getElementById('searchFreq'); if (a) a.value = '';
  var b = document.getElementById('searchFreqAnnee'); if (b) b.value = '';
  var c = document.getElementById('searchFreqMois'); if (c) c.selectedIndex = 0;
  var d = document.getElementById('searchFreqStatut'); if (d) d.selectedIndex = 0;
  document.getElementById('rapportFreqBox').innerHTML = '';
}

// ========== LE RAPPORT GLOBAL FUSIONNÉ ==========
function rapportFreqGlobal() {
  var fiches = DB.get('fichesMensuelles', []).filter(function(f) { return !f.archived; });
  if (!fiches.length) { 
    document.getElementById('rapportFreqBox').innerHTML = '<p>Aucune fiche active pour générer un rapport global.</p>'; 
    return; 
  }

  var totaux = {
    mEncadreurs: 0, mMembresActifs: 0, mSympathisants: 0, mFMembres: 0, mFSympathisants: 0, mFNouveaux: 0,
    mFoyersLumiere: 0, mAvecGoshintai: 0, mSansGoshintai: 0, mFoyersSymp: 0, mFleurs: 0, mPotagers: 0,
    mTotalPotagers: 0, mMaisonsOuvertes: 0, mTemoignages: 0, mCandGoshintai: 0, mConfInit: 0,
    mConfReinit: 0, mConfShoku: 0, mConfKannon: 0, mConfMitamaya: 0, mAssistMembres: 0,
    mAssistSymp: 0, mConcessions: 0, mTerrains: 0, mCampagnes: 0, mCoursEns: 0, mCoursFleurs: 0
  };
  var textes = { themes: [], graces: [], points: [], solutions: [], objectifs: [], actions: [] };

  fiches.forEach(function(f) {
    Object.keys(totaux).forEach(function(key) {
      totaux[key] += (parseInt(f[key]) || 0);
    });
    var nomEntite = getEntiteNom(f.entiteId);
    if (f.themes && f.themes.trim()) textes.themes.push('<b>' + nomEntite + ' :</b> ' + echapper(f.themes));
    if (f.graces && f.graces.trim()) textes.graces.push('<b>' + nomEntite + ' :</b> ' + echapper(f.graces));
    if (f.points && f.points.trim()) textes.points.push('<b>' + nomEntite + ' :</b> ' + echapper(f.points));
    if (f.solutions && f.solutions.trim()) textes.solutions.push('<b>' + nomEntite + ' :</b> ' + echapper(f.solutions));
    if (f.objectifs && f.objectifs.trim()) textes.objectifs.push('<b>' + nomEntite + ' :</b> ' + echapper(f.objectifs));
    if (f.actions && f.actions.trim()) textes.actions.push('<b>' + nomEntite + ' :</b> ' + echapper(f.actions));
  });

  var html = '<div class="rapport-header"><h3>📊 FICHE MENSUELLE EMM KASAÏ CENTRAL</h3><p>Fusion globale de toutes les entités actives</p></div>';
  
  html += '<div class="entity-block">';
  html += '<h4>🌍 TOTAUX GLOBAUX (Toutes entités confondues)</h4>';
  html += '<div class="table-wrapper"><table class="data-table"><tbody>';
  
  html += '<tr><th colspan="2" style="background:#4caf50;">Présentation</th></tr>';
  html += '<tr><td>Nombre d\'Encadreurs</td><td class="num">' + totaux.mEncadreurs + '</td></tr>';
  html += '<tr><td>Membres actifs</td><td class="num">' + totaux.mMembresActifs + '</td></tr>';
  html += '<tr><td>Sympathisants</td><td class="num">' + totaux.mSympathisants + '</td></tr>';

  html += '<tr><th colspan="2" style="background:#4caf50;">Fréquentation culte mensuel</th></tr>';
  html += '<tr><td>Membres</td><td class="num">' + totaux.mFMembres + '</td></tr>';
  html += '<tr><td>Sympathisants</td><td class="num">' + totaux.mFSympathisants + '</td></tr>';
  html += '<tr><td>Nouveaux venus</td><td class="num">' + totaux.mFNouveaux + '</td></tr>';

  html += '<tr><th colspan="2" style="background:#4caf50;">Activités</th></tr>';
  html += '<tr><td>Foyers Lumière</td><td class="num">' + totaux.mFoyersLumiere + '</td></tr>';
  html += '<tr><td>Avec Goshintai</td><td class="num">' + totaux.mAvecGoshintai + '</td></tr>';
  html += '<tr><td>Sans Goshintai</td><td class="num">' + totaux.mSansGoshintai + '</td></tr>';
  html += '<tr><td>Foyers sympathisants</td><td class="num">' + totaux.mFoyersSymp + '</td></tr>';
  html += '<tr><td>Fleurs distribuées</td><td class="num">' + totaux.mFleurs + '</td></tr>';
  html += '<tr><td>Potagers</td><td class="num">' + totaux.mPotagers + '</td></tr>';
  html += '<tr><td>Total potagers</td><td class="num">' + totaux.mTotalPotagers + '</td></tr>';
  html += '<tr><td>Maisons ouvertes</td><td class="num">' + totaux.mMaisonsOuvertes + '</td></tr>';
  html += '<tr><td>Témoignages</td><td class="num">' + totaux.mTemoignages + '</td></tr>';

  html += '<tr><th colspan="2" style="background:#4caf50;">Confirmation</th></tr>';
  html += '<tr><td>Candidats Goshintai</td><td class="num">' + totaux.mCandGoshintai + '</td></tr>';
  html += '<tr><td>Confirmés initiation</td><td class="num">' + totaux.mConfInit + '</td></tr>';
  html += '<tr><td>Confirmés ré-initiation</td><td class="num">' + totaux.mConfReinit + '</td></tr>';
  html += '<tr><td>Confirmés Shoku</td><td class="num">' + totaux.mConfShoku + '</td></tr>';
  html += '<tr><td>Confirmés Kannon</td><td class="num">' + totaux.mConfKannon + '</td></tr>';
  html += '<tr><td>Confirmés Mitamaya</td><td class="num">' + totaux.mConfMitamaya + '</td></tr>';

  html += '<tr><th colspan="2" style="background:#4caf50;">Assistance religieuse</th></tr>';
  html += '<tr><td>Maisons membres</td><td class="num">' + totaux.mAssistMembres + '</td></tr>';
  html += '<tr><td>Maisons sympathisants</td><td class="num">' + totaux.mAssistSymp + '</td></tr>';
  html += '<tr><td>Concessions</td><td class="num">' + totaux.mConcessions + '</td></tr>';
  html += '<tr><td>Terrains</td><td class="num">' + totaux.mTerrains + '</td></tr>';
  html += '<tr><td>Campagnes</td><td class="num">' + totaux.mCampagnes + '</td></tr>';

  html += '<tr><th colspan="2" style="background:#4caf50;">Formation</th></tr>';
  html += '<tr><td>Cours enseignements</td><td class="num">' + totaux.mCoursEns + '</td></tr>';
  html += '<tr><td>Cours fleurs</td><td class="num">' + totaux.mCoursFleurs + '</td></tr>';

  html += '</tbody></table></div>';
  html += '</div>';

  html += '<div class="entity-block" style="border-left-color:#1976d2;">';
  html += '<h4 style="color:#1976d2;">📝 TEXTES RASSEMBLÉS (Toutes entités)</h4>';
  html += '<div class="table-wrapper"><table class="data-table"><tbody>';
  html += '<tr><th colspan="2" style="background:#1976d2;">Textes</th></tr>';
  html += '<tr><td style="vertical-align:top; width:30%"><b>Thèmes exploités</b></td><td>' + (textes.themes.length ? textes.themes.join('<br><br>') : '-') + '</td></tr>';
  html += '<tr><td style="vertical-align:top;"><b>Grâces reçues</b></td><td>' + (textes.graces.length ? textes.graces.join('<br><br>') : '-') + '</td></tr>';
  html += '<tr><td style="vertical-align:top;"><b>Points à améliorer</b></td><td>' + (textes.points.length ? textes.points.join('<br><br>') : '-') + '</td></tr>';
  html += '<tr><td style="vertical-align:top;"><b>Solutions proposées</b></td><td>' + (textes.solutions.length ? textes.solutions.join('<br><br>') : '-') + '</td></tr>';
  html += '<tr><td style="vertical-align:top;"><b>Objectifs</b></td><td>' + (textes.objectifs.length ? textes.objectifs.join('<br><br>') : '-') + '</td></tr>';
  html += '<tr><td style="vertical-align:top;"><b>Actions</b></td><td>' + (textes.actions.length ? textes.actions.join('<br><br>') : '-') + '</td></tr>';
  html += '</tbody></table></div>';
  html += '</div>';

  document.getElementById('rapportFreqBox').innerHTML = html;
}

function rapportFreqDetaille() {
  var fiches = DB.get('fichesMensuelles', []).filter(function(f) { return !f.archived; });
  if (!fiches.length) { document.getElementById('rapportFreqBox').innerHTML = '<p>Aucune fiche active.</p>'; return; }
  var html = '<div class="rapport-header"><h3>📋 RAPPORT DÉTAILLÉ — FRÉQUENCES</h3></div>';
  fiches.forEach(function(f) { html += tableFicheMensuelle(f); });
  document.getElementById('rapportFreqBox').innerHTML = html;
}

function afficherDashboard() {
  var box = document.getElementById('dashboardBox');
  if (!box) return;
  var entites = DB.get('entites', []).filter(function(e) { return !e.archived; }).length;
  var parts = DB.get('participations', []).filter(function(p) { return !p.archived; });
  var totPart = parts.reduce(function(a, p) { return a + p.m + p.s + p.n; }, 0);
  var fiches = DB.get('fichesMensuelles', []).filter(function(f) { return !f.archived; }).length;
  var html = '<div class="table-wrapper"><table class="data-table"><tbody>';
  html += '<tr><th colspan="2">📈 MODULE I — FRÉQUENCES</th></tr>';
  html += '<tr><td>Entités actives</td><td class="num">' + entites + '</td></tr>';
  html += '<tr><td>Total présences</td><td class="num">' + totPart + '</td></tr>';
  html += '<tr><td>Fiches mensuelles</td><td class="num">' + fiches + '</td></tr>';
  html += '</tbody></table></div>';
  box.innerHTML = html;
}

function rapportGeneralConsolide() {
  var box = document.getElementById('rapportGeneralBox');
  var html = '<div class="rapport-header"><h3>🌍 RAPPORT GÉNÉRAL CONSOLIDÉ</h3><p>EMM FRÉQUENCE — Module I</p></div>';
  html += '<p style="text-align:center;font-size:12px;color:#666;margin-bottom:14px">Généré par <strong>' + echapper(currentUser ? currentUser.nom : '') + '</strong> le ' + new Date().toLocaleString('fr-FR') + '</p>';
  var entites = DB.get('entites', []).filter(function(e) { return !e.archived; }).length;
  var parts = DB.get('participations', []).filter(function(p) { return !p.archived; });
  var tm = 0, ts = 0, tn = 0;
  parts.forEach(function(p) { tm += p.m; ts += p.s; tn += p.n; });
  html += '<h4 style="color:#0a6e2c;margin:14px 0 8px">📈 MODULE I — FRÉQUENCES</h4>';
  html += '<div class="table-wrapper"><table class="data-table"><tbody>';
  html += '<tr><td>Entités</td><td class="num">' + entites + '</td></tr>';
  html += '<tr><td>Membres</td><td class="num">' + tm + '</td></tr>';
  html += '<tr><td>Sympathisants</td><td class="num">' + ts + '</td></tr>';
  html += '<tr><td>Nouveaux venus</td><td class="num">' + tn + '</td></tr>';
  html += '</tbody></table></div>';
  box.innerHTML = html;
}

function imprimerRapportFreq() { imprimerBox('rapportFreqBox'); }
function imprimerGeneral() { imprimerBox('rapportGeneralBox'); }
function imprimerBox(boxId) {
  var c = document.getElementById(boxId).innerHTML;
  if (!c) return alert('Rapport vide');
  var w = window.open('', '_blank');
  w.document.write('<html><head><meta charset="UTF-8"><title>Rapport</title><style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#0a6e2c;color:white;padding:8px}td{padding:7px;border-bottom:1px solid #ddd}td.num{text-align:right}</style></head><body><h1 style="text-align:center;color:#0a6e2c">EMM FRÉQUENCE</h1><hr>'+c+'</body></html>');
  w.document.close(); setTimeout(function() { w.print(); }, 600);
}
function exporterWordFreq() { exporterWordBox('rapportFreqBox','Frequence'); }
function exporterWordGeneral() { exporterWordBox('rapportGeneralBox','General'); }
function exporterWordBox(boxId, nom) {
  var contenu = document.getElementById(boxId).innerHTML;
  if (!contenu) return alert('Rapport vide');
  var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="UTF-8"></head><body>';
  html += '<h1 style="text-align:center;color:#0a6e2c">EMM FRÉQUENCE</h1><hr>' + contenu + '</body></html>';
  var blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = 'Rapport_' + nom + '_' + Date.now() + '.doc';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
}
function exporterPDFFreq() { exporterPDFBox('rapportFreqBox'); }
function exporterPDFGeneral() { exporterPDFBox('rapportGeneralBox'); }
function exporterPDFBox(boxId) {
  var contenu = document.getElementById(boxId).innerHTML;
  if (!contenu) return alert('Rapport vide');
  var w = window.open('', '_blank');
  w.document.write('<html><head><meta charset="UTF-8"><title>PDF</title><style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#0a6e2c;color:white;padding:8px}td{padding:7px;border-bottom:1px solid #ddd}td.num{text-align:right}</style></head><body><h1 style="text-align:center;color:#0a6e2c">EMM FRÉQUENCE</h1><hr>'+contenu+'</body></html>');
  w.document.close(); setTimeout(function() { w.print(); }, 800);
}
function partagerRapportFreq() { partagerBox('rapportFreqBox','Fréquences'); }
function partagerGeneral() { partagerBox('rapportGeneralBox','Général'); }
function partagerBox(boxId, nom) {
  var contenu = document.getElementById(boxId).innerHTML;
  if (!contenu) return alert('Rapport vide');
  var div = document.createElement('div'); div.innerHTML = contenu;
  var texte = div.innerText.substring(0, 2000);
  var msg = 'EMM FRÉQUENCE — Rapport ' + nom + '\n\n' + texte;
  if (navigator.share) { navigator.share({ title: 'Rapport EMM FRÉQUENCE', text: msg }).catch(function(err) { if (err.name !== 'AbortError') partagerFallback(msg); }); }
  else partagerFallback(msg);
}
function partagerFallback(msg) {
  var email = prompt('📧 Email (vide = WhatsApp) :', '');
  if (email === null) return;
  if (email.trim()) window.location.href = 'mailto:' + email.trim() + '?subject=Rapport EMM FRÉQUENCE&body=' + encodeURIComponent(msg);
  else window.location.href = 'https://wa.me/?text=' + encodeURIComponent(msg);
}

function ajouterUtilisateur() {
  if (!isAdmin()) return alert('Réservé admin');
  var nom = document.getElementById('uNom').value.trim().toLowerCase();
  var pass = document.getElementById('uPass').value.trim();
  var role = document.getElementById('uRole').value;
  if (!nom || !pass) return alert('Remplissez tous les champs');
  var users = DB.get('users', []);
  if (users.find(function(u) { return u.nom === nom; })) return alert('Ce nom existe déjà');
  users.push({ id: uid(), nom: nom, pass: pass, role: role });
  DB.set('users', users); reinitialiserFormUtilisateur(); afficherUtilisateurs(); alert('✅ Utilisateur ajouté');
}
function reinitialiserFormUtilisateur() {
  var a = document.getElementById('uNom'); if (a) a.value = '';
  var b = document.getElementById('uPass'); if (b) b.value = '';
  var c = document.getElementById('uRole'); if (c) c.selectedIndex = 0;
}
function afficherUtilisateurs() {
  var users = DB.get('users', []);
  var box = document.getElementById('listeUtilisateurs');
  if (!box) return;
  var html = '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Nom</th><th>Rôle</th><th>Actions</th></tr></thead><tbody>';
  users.forEach(function(u) {
    html += '<tr><td>' + echapper(u.nom) + '</td><td>' + (u.role === 'admin' ? '👑 Admin' : '👤 Utilisateur') + '</td>';
    html += '<td>';
    if (u.nom !== 'admin') html += '<button class="btn-mini danger" onclick="supprimerUtilisateur(\'' + u.id + '\')">🗑️</button>';
    html += '</td></tr>';
  });
  html += '</tbody></table></div>';
  box.innerHTML = html;
}
function supprimerUtilisateur(id) {
  if (!isAdmin()) return alert('Réservé admin');
  if (!confirm('⚠️ Supprimer cet utilisateur ?')) return;
  DB.set('users', DB.get('users', []).filter(function(u) { return u.id !== id; })); afficherUtilisateurs();
}

function exporterDonnees() {
  var data = {};
  ['users','entites','participations','fichesMensuelles','annonces'].forEach(function(k) { data[k] = DB.get(k, []); });
  var json = JSON.stringify(data, null, 2);
  try {
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'emm_frequence_' + Date.now() + '.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    alert('✅ Fichier téléchargé');
  } catch (e) { alert('Erreur export'); }
}
function restaurerTexte() {
  var txt = document.getElementById('importText').value.trim();
  if (!txt) return alert('Collez d\'abord un JSON');
  try {
    var data = JSON.parse(txt);
    Object.keys(data).forEach(function(k) { DB.set(k, data[k]); });
    alert('✅ Données restaurées'); refreshAll(); afficherDashboard(); document.getElementById('importText').value = '';
  } catch (e) { alert('❌ JSON invalide'); }
}
function importerDonnees(ev) {
  var file = ev.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var data = JSON.parse(e.target.result);
      Object.keys(data).forEach(function(k) { DB.set(k, data[k]); });
      alert('✅ Données restaurées'); refreshAll(); afficherDashboard();
    } catch (err) { alert('❌ Fichier invalide'); }
  };
  reader.readAsText(file);
}
function toutEffacer() {
  if (!isAdmin()) return alert('Réservé admin');
  if (!confirm('⚠️ Effacer TOUTES les données (sauf utilisateurs) ?')) return;
  var users = DB.get('users', []);
  localStorage.clear(); DB.set('users', users); initDB(); alert('✅ Effacé'); location.reload();
}

var deferredPrompt = null;
window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault(); deferredPrompt = e;
  var btn = document.getElementById('installBtn'); if (btn) btn.style.display = 'block';
});
function installApp() {
  if (!deferredPrompt) return alert('Menu navigateur → "Ajouter à l\'écran d\'accueil"');
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(function() {
    deferredPrompt = null;
    var btn = document.getElementById('installBtn'); if (btn) btn.style.display = 'none';
  });
}

function refreshAll() {
  rafraichirEntites(); afficherListeEntites(); afficherJournaliere(); afficherUtilisateurs();
}

window.addEventListener('load', function() { showSplash(); });