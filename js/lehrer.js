import { icon, esc, ICON_NAMEN, MATERIAL_TYPEN, FARBEN } from './icons.js';

const REPO = 'stift-und-papier/wn-q-phase';
const PFAD = 'data/matrix.json';
const API = `https://api.github.com/repos/${REPO}/contents/${PFAD}`;
const SPEICHER = 'lernmatrix-token';

let token = '';
let D = null;       // Arbeitskopie der Daten
let sha = '';       // Version der Datei auf GitHub
let offen = 0;      // Zahl ungespeicherter Änderungen
let tab = 'begriffe';
let auswahl = null; // aktuell bearbeiteter Eintrag (id oder 'neu')

const $ = (s) => document.querySelector(s);

/* ---------- Hilfen ---------- */
function melden(text, fehler = false) {
  const m = $('#meldung');
  m.textContent = text; m.className = 'meldung' + (fehler ? ' fehler' : ''); m.hidden = false;
  clearTimeout(melden.t); melden.t = setTimeout(() => { m.hidden = true; }, fehler ? 7000 : 3500);
}
function geaendert() {
  offen++;
  $('#aenderungen').textContent = `${offen} ungespeicherte Änderung${offen === 1 ? '' : 'en'}`;
  $('#status').classList.add('offen');
  $('#veroeffentlichen').disabled = false;
}
function zuB64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function vonB64(b64) {
  return new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, '')), (c) => c.charCodeAt(0)));
}
function slug(text) {
  const s = text.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'eintrag';
  return s;
}
function neueId(text, vorhanden) {
  let id = slug(text), n = 2;
  while (vorhanden[id]) id = slug(text) + '-' + n++;
  return id;
}
function alleCluster() {
  const l = [];
  D.rahmenthemen.forEach((r) => r.cluster.forEach((c) => l.push({ r, c })));
  return l;
}
function clusterVon(bid) { return alleCluster().find(({ c }) => c.begriffe.includes(bid)); }
const api = (url, opt = {}) => fetch(url, { ...opt, headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', ...(opt.headers || {}) } });

/* ---------- Anmelden und Laden ---------- */
async function anmelden(t, merken) {
  token = t.trim();
  const r = await api(API + '?ref=main&t=' + Date.now());
  if (r.status === 401 || r.status === 403) throw new Error('Der Zugangsschlüssel wurde nicht akzeptiert. Prüfe, ob er für wn-q-phase gilt und „Contents: Read and write“ hat.');
  if (!r.ok) throw new Error('Die Daten konnten nicht geladen werden (Fehler ' + r.status + ').');
  const j = await r.json();
  sha = j.sha;
  D = JSON.parse(vonB64(j.content));
  if (merken) localStorage.setItem(SPEICHER, token); else localStorage.removeItem(SPEICHER);
  $('#login').hidden = true; $('#editor').hidden = false; $('#status').hidden = false; $('#ltabs').hidden = false;
  window.addEventListener('hashchange', () => { tab = location.hash.slice(1) || 'begriffe'; auswahl = null; zeichnen(); });
  tab = location.hash.slice(1) || 'begriffe';
  zeichnen();
}

async function veroeffentlichen() {
  const knopf = $('#veroeffentlichen');
  knopf.disabled = true; knopf.textContent = 'Wird gespeichert …';
  try {
    const jetzt = new Date();
    D.stand = jetzt.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    const r = await api(API, { method: 'PUT', body: JSON.stringify({
      message: `Lernmatrix bearbeitet (Lehrerbereich, ${jetzt.toLocaleString('de-DE')})`,
      content: zuB64(JSON.stringify(D, null, 1) + '\n'), sha, branch: 'main' }) });
    if (r.status === 409) throw new Error('Die Datei wurde inzwischen an anderer Stelle geändert. Lade die Seite neu und trage deine Änderung erneut ein.');
    if (!r.ok) throw new Error('Speichern fehlgeschlagen (Fehler ' + r.status + ').');
    sha = (await r.json()).content.sha;
    offen = 0;
    $('#aenderungen').textContent = 'Gespeichert. Die Schülerseite ist in etwa einer Minute aktuell.';
    $('#status').classList.remove('offen');
    melden('Veröffentlicht.');
  } catch (e) {
    melden(e.message, true);
    knopf.disabled = false;
  }
  knopf.textContent = 'Veröffentlichen';
}

/* ---------- Bausteine für Formulare ---------- */
function iconSelect(name, wert) {
  return `<div class="iconwahl"><span class="vorschau" data-vorschau="${name}">${icon(wert || 'info', 'ic gross')}</span>
    <select name="${name}">${Object.entries(ICON_NAMEN).map(([k, v]) => `<option value="${k}" ${k === wert ? 'selected' : ''}>${v}</option>`).join('')}</select></div>`;
}
function checkliste(name, eintraege, gewaehlt) {
  return `<input type="text" class="filter" placeholder="Filtern …" data-filter="${name}">
    <div class="auswahl" data-liste="${name}">${eintraege.map(([id, text]) =>
      `<label><input type="checkbox" name="${name}" value="${id}" ${gewaehlt.includes(id) ? 'checked' : ''}> ${esc(text)}</label>`).join('')}</div>`;
}
function materialZeile(m = { typ: 'ab', titel: '', url: '' }) {
  return `<div class="mrow">
    <select data-m="typ">${Object.entries(MATERIAL_TYPEN).map(([k, v]) => `<option value="${k}" ${k === m.typ ? 'selected' : ''}>${v}</option>`).join('')}</select>
    <input type="text" data-m="titel" placeholder="Anzeigename, z. B. AB Utilitarismus" value="${esc(m.titel)}">
    <input type="url" data-m="url" placeholder="Link (IServ, YouTube …)" value="${esc(m.url)}">
    <div class="knoepfe"><button type="button" class="knopf mini" data-mz="hoch" title="nach oben">${icon('hoch')}</button>
      <button type="button" class="knopf mini" data-mz="runter" title="nach unten">${icon('runter')}</button>
      <button type="button" class="knopf mini gefahr" data-mz="weg" title="entfernen">${icon('muell')}</button></div></div>`;
}
function materialEditor(liste) {
  return `<div class="mliste">${(liste || []).map(materialZeile).join('')}</div>
    <button type="button" class="knopf mini" data-mz="neu">${icon('pro')} Material oder Link hinzufügen</button>
    <p class="hinweis-klein">IServ: Datei im Kursordner öffnen und die Adresse aus der Adresszeile kopieren. Materialdateien selbst bitte nicht hier hochladen, sie bleiben in IServ.</p>`;
}
function materialAuslesen(form) {
  return [...form.querySelectorAll('.mrow')].map((z) => ({
    typ: z.querySelector('[data-m=typ]').value, titel: z.querySelector('[data-m=titel]').value.trim(), url: z.querySelector('[data-m=url]').value.trim(),
  })).filter((m) => m.titel && m.url);
}
function formularVerdrahten(form) {
  form.addEventListener('click', (e) => {
    const b = e.target.closest('[data-mz]'); if (!b) return;
    const z = b.closest('.mrow');
    if (b.dataset.mz === 'neu') form.querySelector('.mliste').insertAdjacentHTML('beforeend', materialZeile());
    if (b.dataset.mz === 'weg') z.remove();
    if (b.dataset.mz === 'hoch' && z.previousElementSibling) z.parentNode.insertBefore(z, z.previousElementSibling);
    if (b.dataset.mz === 'runter' && z.nextElementSibling) z.parentNode.insertBefore(z.nextElementSibling, z);
  });
  form.querySelectorAll('select').forEach((s) => s.addEventListener('change', () => {
    const v = form.querySelector(`[data-vorschau="${s.name}"]`); if (v) v.innerHTML = icon(s.value, 'ic gross');
  }));
  form.querySelectorAll('[data-filter]').forEach((f) => f.addEventListener('input', () => {
    const q = f.value.toLowerCase();
    form.querySelectorAll(`[data-liste="${f.dataset.filter}"] label`).forEach((l) => { l.hidden = !l.textContent.toLowerCase().includes(q); });
  }));
}
const werte = (form, name) => [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((i) => i.value);

/* ---------- Ansichten ---------- */
function zeichnen() {
  document.querySelectorAll('#ltabs .tab').forEach((t) => t.classList.toggle('aktiv', t.dataset.tab === tab));
  ({ begriffe: tabBegriffe, personen: tabPersonen, bereiche: tabBereiche, abitur: tabAbitur }[tab] || tabBegriffe)();
}

function tabBegriffe() {
  const e = $('#editor');
  const liste = D.rahmenthemen.filter((r) => r.cluster.length).map((r) => `<h3>${esc(r.name)}</h3>` + r.cluster.map((c) =>
    `<h3 style="margin-left:8px;text-transform:none;letter-spacing:0">${esc(c.name)}</h3>` + c.begriffe.map((b) =>
      `<button class="eintrag ${auswahl === b ? 'aktiv' : ''}" data-id="${b}">${icon(D.begriffe[b]?.icon)}${esc(D.begriffe[b]?.kurz || b)}</button>`).join('')).join('')).join('');
  e.innerHTML = `<div class="zweispalt">
    <div class="liste"><button class="knopf primaer" id="neuB" style="width:100%">${icon('pro')} Neuer Begriff</button>${liste}</div>
    <div class="panel" id="formular">${auswahl ? begriffFormular(auswahl) : '<p class="leerhinweis">Wähle links einen Begriff aus oder lege einen neuen an.</p>'}</div></div>`;
  e.querySelectorAll('.eintrag').forEach((b) => b.addEventListener('click', () => { auswahl = b.dataset.id; tabBegriffe(); }));
  $('#neuB').addEventListener('click', () => { auswahl = 'neu'; tabBegriffe(); });
  const f = $('#bform'); if (f) begriffVerdrahten(f);
}

function begriffFormular(id) {
  const neu = id === 'neu';
  const b = neu ? { name: '', kurz: '', icon: 'info', erkl: '', achtung: '', positionen: '', links: [], personen: [], material: [] } : D.begriffe[id];
  const lage = neu ? null : clusterVon(id);
  const cl = alleCluster();
  return `<form id="bform" data-id="${id}">
    <h2>${neu ? 'Neuer Begriff' : esc(b.name)}</h2>
    <div class="reihe">
      <label>Name (Überschrift der Karte)<input type="text" name="name" required value="${esc(b.name)}"></label>
      <label>Kurzname (Kachel und Verknüpfungen)<input type="text" name="kurz" value="${esc(b.kurz)}"></label>
    </div>
    <div class="reihe">
      <label>Bereich<select name="cluster">${cl.map(({ r, c }) => `<option value="${r.id}|${c.id}" ${lage && lage.c.id === c.id ? 'selected' : ''}>${esc(r.name + ' › ' + c.name)}</option>`).join('')}</select></label>
      <label>Piktogramm${iconSelect('icon', b.icon)}</label>
    </div>
    <label>Erklärung<textarea name="erkl" required>${esc(b.erkl)}</textarea></label>
    <label>Achtung / Abgrenzung<textarea name="achtung">${esc(b.achtung)}</textarea></label>
    <label>Positionen (optional, z. B. Pro und Contra)<textarea name="positionen" style="min-height:60px">${esc(b.positionen)}</textarea></label>
    <div class="reihe">
      <label>Hängt zusammen mit${checkliste('links', Object.entries(D.begriffe).filter(([k]) => k !== id).map(([k, v]) => [k, v.kurz || v.name]).sort((a, c) => a[1].localeCompare(c[1])), b.links || [])}</label>
      <label>Personen${checkliste('personen', Object.entries(D.personen).map(([k, v]) => [k, v.name]), b.personen || [])}</label>
    </div>
    <label>Material und Links</label>${materialEditor(b.material)}
    <div class="leiste">
      <button type="submit" class="knopf primaer">Übernehmen</button>
      ${neu ? '' : `<button type="button" class="knopf" data-akt="hoch">${icon('hoch')} nach oben</button>
      <button type="button" class="knopf" data-akt="runter">${icon('runter')} nach unten</button>
      <button type="button" class="knopf gefahr rechts" data-akt="loeschen">${icon('muell')} Begriff löschen</button>`}
    </div></form>`;
}

function begriffVerdrahten(f) {
  formularVerdrahten(f);
  const id = f.dataset.id;
  f.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const fd = new FormData(f);
    const name = fd.get('name').trim();
    if (!name || !fd.get('erkl').trim()) return melden('Name und Erklärung sind Pflichtfelder.', true);
    const neuId = id === 'neu' ? neueId(name, D.begriffe) : id;
    const vorher = D.begriffe[neuId] || {};
    D.begriffe[neuId] = { ...vorher, name, kurz: fd.get('kurz').trim() || name, icon: fd.get('icon'), erkl: fd.get('erkl').trim(),
      achtung: fd.get('achtung').trim(), positionen: fd.get('positionen').trim(), links: werte(f, 'links'), personen: werte(f, 'personen'), material: materialAuslesen(f) };
    // Bereich zuordnen
    const [rid, cid] = fd.get('cluster').split('|');
    const alt = clusterVon(neuId);
    const ziel = D.rahmenthemen.find((r) => r.id === rid).cluster.find((c) => c.id === cid);
    if (!alt || alt.c !== ziel) { if (alt) alt.c.begriffe = alt.c.begriffe.filter((x) => x !== neuId); ziel.begriffe.push(neuId); }
    // Verknüpfungen in beide Richtungen und Personen abgleichen
    Object.entries(D.begriffe).forEach(([k, v]) => {
      if (k === neuId) return;
      const soll = D.begriffe[neuId].links.includes(k);
      const hat = (v.links || []).includes(neuId);
      if (soll && !hat) v.links = [...(v.links || []), neuId];
    });
    Object.entries(D.personen).forEach(([k, p]) => {
      const soll = D.begriffe[neuId].personen.includes(k);
      p.begriffe = (p.begriffe || []).filter((x) => x !== neuId);
      if (soll) p.begriffe.push(neuId);
    });
    auswahl = neuId; geaendert(); melden('Übernommen. Zum Schluss oben auf „Veröffentlichen“ tippen.'); tabBegriffe();
  });
  f.addEventListener('click', (ev) => {
    const a = ev.target.closest('[data-akt]')?.dataset.akt; if (!a) return;
    const lage = clusterVon(id); const l = lage.c.begriffe; const i = l.indexOf(id);
    if (a === 'hoch' && i > 0) { [l[i - 1], l[i]] = [l[i], l[i - 1]]; geaendert(); tabBegriffe(); }
    if (a === 'runter' && i < l.length - 1) { [l[i + 1], l[i]] = [l[i], l[i + 1]]; geaendert(); tabBegriffe(); }
    if (a === 'loeschen' && confirm(`„${D.begriffe[id].name}“ wirklich löschen?`)) {
      lage.c.begriffe = l.filter((x) => x !== id);
      delete D.begriffe[id];
      Object.values(D.begriffe).forEach((b) => { b.links = (b.links || []).filter((x) => x !== id); });
      Object.values(D.personen).forEach((p) => { p.begriffe = (p.begriffe || []).filter((x) => x !== id); });
      auswahl = null; geaendert(); tabBegriffe();
    }
  });
}

function tabPersonen() {
  const e = $('#editor');
  const sortiert = Object.entries(D.personen).sort((a, b) => a[1].name.split(' ').pop().localeCompare(b[1].name.split(' ').pop()));
  e.innerHTML = `<div class="zweispalt">
    <div class="liste"><button class="knopf primaer" id="neuP" style="width:100%">${icon('pro')} Neue Person</button><h3>Personen</h3>
      ${sortiert.map(([id, p]) => `<button class="eintrag ${auswahl === id ? 'aktiv' : ''}" data-id="${id}">${icon('person')}${esc(p.name)}</button>`).join('')}</div>
    <div class="panel">${auswahl ? personFormular(auswahl) : '<p class="leerhinweis">Wähle links eine Person aus oder lege eine neue an.</p>'}</div></div>`;
  e.querySelectorAll('.eintrag').forEach((b) => b.addEventListener('click', () => { auswahl = b.dataset.id; tabPersonen(); }));
  $('#neuP').addEventListener('click', () => { auswahl = 'neu'; tabPersonen(); });
  const f = $('#pform'); if (!f) return;
  formularVerdrahten(f);
  f.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const fd = new FormData(f), name = fd.get('name').trim();
    if (!name) return melden('Bitte einen Namen eintragen.', true);
    const id = f.dataset.id === 'neu' ? neueId(name, D.personen) : f.dataset.id;
    const begriffe = werte(f, 'begriffe');
    D.personen[id] = { name, daten: fd.get('daten').trim(), idee: fd.get('idee').trim(), auch: fd.get('auch').trim(), begriffe };
    Object.entries(D.begriffe).forEach(([k, b]) => {
      b.personen = (b.personen || []).filter((x) => x !== id);
      if (begriffe.includes(k)) b.personen.push(id);
    });
    auswahl = id; geaendert(); melden('Übernommen.'); tabPersonen();
  });
  f.querySelector('[data-akt=loeschen]')?.addEventListener('click', () => {
    const id = f.dataset.id;
    if (!confirm(`„${D.personen[id].name}“ wirklich löschen?`)) return;
    delete D.personen[id];
    Object.values(D.begriffe).forEach((b) => { b.personen = (b.personen || []).filter((x) => x !== id); });
    auswahl = null; geaendert(); tabPersonen();
  });
}

function personFormular(id) {
  const neu = id === 'neu';
  const p = neu ? { name: '', daten: '', idee: '', auch: '', begriffe: [] } : D.personen[id];
  return `<form id="pform" data-id="${id}"><h2>${neu ? 'Neue Person' : esc(p.name)}</h2>
    <div class="reihe"><label>Name<input type="text" name="name" value="${esc(p.name)}"></label>
      <label>Lebensdaten<input type="text" name="daten" placeholder="1724 bis 1804" value="${esc(p.daten)}"></label></div>
    <label>Kernidee<textarea name="idee">${esc(p.idee)}</textarea></label>
    <label>Hinweis (optional, z. B. „Nicht verwechseln mit …“)<textarea name="auch" style="min-height:60px">${esc(p.auch)}</textarea></label>
    <label>Begriffe${checkliste('begriffe', Object.entries(D.begriffe).map(([k, v]) => [k, v.kurz || v.name]).sort((a, b) => a[1].localeCompare(b[1])), p.begriffe || [])}</label>
    <div class="leiste"><button type="submit" class="knopf primaer">Übernehmen</button>
      ${neu ? '' : `<button type="button" class="knopf gefahr rechts" data-akt="loeschen">${icon('muell')} Person löschen</button>`}</div></form>`;
}

function tabBereiche() {
  const e = $('#editor');
  e.innerHTML = `<div class="panel"><h2>Rahmenthemen und Bereiche</h2>
    <p class="hinweis-klein">Jeder Bereich ist ein Segment im Halbkreis. Ein Rahmenthema erscheint für die Schüler:innen erst, wenn „sichtbar“ angehakt ist und es mindestens einen Bereich hat.</p>
    ${D.rahmenthemen.map((r, ri) => `<div class="rtblock" data-rt="${ri}">
      <div class="reihe"><label>Rahmenthema ${r.nr}<input type="text" data-f="name" value="${esc(r.name)}"></label>
        <label>Farbe<select data-f="farbe">${Object.keys(FARBEN).map((k) => `<option ${k === r.farbe ? 'selected' : ''}>${k}</option>`).join('')}</select></label></div>
      <div class="reihe"><label>Pflichtmodul<input type="text" data-f="pflichtmodul" value="${esc(r.pflichtmodul)}"></label>
        <label>Wahlmodul<input type="text" data-f="wahlmodul" value="${esc(r.wahlmodul)}"></label></div>
      <label class="check"><input type="checkbox" data-f="aktiv" ${r.aktiv ? 'checked' : ''}> für Schüler:innen sichtbar</label>
      <label>Bereiche</label>
      ${r.cluster.map((c, ci) => `<div class="crow" data-c="${ci}">
        <input type="text" data-c="name" value="${esc(c.name)}">
        <select data-c="icon">${Object.entries(ICON_NAMEN).map(([k, v]) => `<option value="${k}" ${k === c.icon ? 'selected' : ''}>${v}</option>`).join('')}</select>
        <select data-c="modul"><option value="pflicht" ${c.modul === 'pflicht' ? 'selected' : ''}>Pflichtmodul</option><option value="wahl" ${c.modul === 'wahl' ? 'selected' : ''}>Wahlmodul</option></select>
        <div class="knoepfe" style="display:flex;gap:2px"><button class="knopf mini" data-ca="hoch">${icon('hoch')}</button><button class="knopf mini" data-ca="runter">${icon('runter')}</button>
        <button class="knopf mini gefahr" data-ca="weg" title="Nur leere Bereiche lassen sich löschen">${icon('muell')}</button></div></div>`).join('')}
      <button class="knopf mini" data-ca="neu">${icon('pro')} Bereich hinzufügen</button></div>`).join('')}
    <div class="leiste"><button class="knopf primaer" id="bereicheSpeichern">Übernehmen</button></div></div>`;
  const lesen = () => {
    e.querySelectorAll('.rtblock').forEach((blk) => {
      const r = D.rahmenthemen[blk.dataset.rt];
      blk.querySelectorAll('[data-f]').forEach((i) => { r[i.dataset.f] = i.type === 'checkbox' ? i.checked : i.value.trim(); });
      blk.querySelectorAll('.crow').forEach((z) => {
        const c = r.cluster[z.dataset.c];
        c.name = z.querySelector('[data-c=name]').value.trim() || c.name;
        c.icon = z.querySelector('[data-c=icon]').value; c.modul = z.querySelector('[data-c=modul]').value;
      });
    });
  };
  e.firstElementChild.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-ca]'); if (!b) return;
    lesen();
    const r = D.rahmenthemen[b.closest('.rtblock').dataset.rt];
    const ci = Number(b.closest('.crow')?.dataset.c);
    if (b.dataset.ca === 'neu') { const n = prompt('Name des neuen Bereichs:'); if (!n) return; r.cluster.push({ id: neueId(n, Object.fromEntries(alleCluster().map(({ c }) => [c.id, 1]))), name: n, icon: 'info', modul: 'pflicht', begriffe: [] }); }
    if (b.dataset.ca === 'hoch' && ci > 0) [r.cluster[ci - 1], r.cluster[ci]] = [r.cluster[ci], r.cluster[ci - 1]];
    if (b.dataset.ca === 'runter' && ci < r.cluster.length - 1) [r.cluster[ci + 1], r.cluster[ci]] = [r.cluster[ci], r.cluster[ci + 1]];
    if (b.dataset.ca === 'weg') {
      if (r.cluster[ci].begriffe.length) return melden('Der Bereich enthält noch Begriffe. Verschiebe oder lösche sie zuerst.', true);
      r.cluster.splice(ci, 1);
    }
    geaendert(); tabBereiche();
  });
  $('#bereicheSpeichern').addEventListener('click', () => { lesen(); geaendert(); melden('Übernommen.'); tabBereiche(); });
}

function tabAbitur() {
  const e = $('#editor');
  e.innerHTML = `<form class="panel" id="aform"><h2>Abitur allgemein</h2>
    <label>Titel der Seite<input type="text" name="titel" value="${esc(D.titel)}"></label>
    <label>Untertitel<input type="text" name="untertitel" value="${esc(D.untertitel)}"></label>
    <label>Material für alle Rahmenthemen (Operatoren, Hinweise …)</label>${materialEditor(D.allgemein)}
    <div class="leiste"><button type="submit" class="knopf primaer">Übernehmen</button></div></form>`;
  const f = $('#aform'); formularVerdrahten(f);
  f.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const fd = new FormData(f);
    D.titel = fd.get('titel').trim(); D.untertitel = fd.get('untertitel').trim(); D.allgemein = materialAuslesen(f);
    geaendert(); melden('Übernommen.'); tabAbitur();
  });
}

/* ---------- Start ---------- */
document.addEventListener('DOMContentLoaded', () => {
  $('#anmelden').addEventListener('click', async () => {
    $('#loginfehler').hidden = true;
    try { await anmelden($('#token').value, $('#merken').checked); }
    catch (e) { $('#loginfehler').textContent = e.message; $('#loginfehler').hidden = false; }
  });
  $('#veroeffentlichen').addEventListener('click', veroeffentlichen);
  $('#abmelden').addEventListener('click', () => {
    if (offen && !confirm('Es gibt ungespeicherte Änderungen. Trotzdem abmelden?')) return;
    localStorage.removeItem(SPEICHER); location.reload();
  });
  window.addEventListener('beforeunload', (e) => { if (offen) { e.preventDefault(); e.returnValue = ''; } });
  const t = localStorage.getItem(SPEICHER);
  if (t) anmelden(t, true).catch((e) => { $('#loginfehler').textContent = e.message; $('#loginfehler').hidden = false; });
});
