import { icon, iconPfad, esc, fmt, hell, mische, FARBEN, MATERIAL_TYPEN } from './icons.js';

let D = null;            // Daten aus data/matrix.json
let aktivRT = null;      // id des Rahmenthemas
let aktivCluster = null; // id des Clusters

const $ = (s) => document.querySelector(s);
const nr2 = (n) => String(n).padStart(2, '0');

async function laden() {
  const r = await fetch('data/matrix.json?v=' + Date.now());
  D = await r.json();
  $('#titel').textContent = D.titel;
  $('#untertitel').textContent = D.untertitel;
  $('#stand').textContent = 'Stand: ' + D.stand;
  navBauen();
  window.addEventListener('hashchange', route);
  window.matchMedia('(max-width: 640px)').addEventListener('change', () => { if (aktivRT && rt(aktivRT)?.aktiv && !$('#karte').open) zeigeRT(aktivRT, aktivCluster); });
  route();
}

function rt(id) { return D.rahmenthemen.find((r) => r.id === id); }
function clusterVon(bid) {
  for (const r of D.rahmenthemen) for (const c of r.cluster) if (c.begriffe.includes(bid)) return { r, c };
  return null;
}

/* ---------- Navigation ---------- */
function navBauen() {
  const n = $('#nav');
  n.innerHTML = D.rahmenthemen.map((r) =>
    `<a href="#${r.id}" data-id="${r.id}" class="tab ${r.aktiv ? '' : 'folgt'}" style="--f:${FARBEN[r.farbe][3]}">
       <span class="tabnr">${nr2(r.nr)}</span>${esc(r.name)}</a>`).join('') +
    `<a href="#personen" data-id="personen" class="tab neutral">${icon('person')}Personen</a>
     <a href="#abitur" data-id="abitur" class="tab neutral">${icon('buch')}Abitur</a>`;
}

function route() {
  const h = decodeURIComponent(location.hash.slice(1));
  const [teil, sub] = h.split('/');
  if (teil === 'begriff' && sub) { if (!aktivRT) zeigeRT(clusterVon(sub)?.r.id || ersteRT(), clusterVon(sub)?.c.id); oeffneBegriff(sub); return; }
  if (teil === 'person' && sub) { if (!aktivRT) zeigeRT(ersteRT()); oeffnePerson(sub); return; }
  $('#karte').open && $('#karte').close();
  if (teil === 'personen') return zeigePersonen();
  if (teil === 'abitur') return zeigeAbitur();
  zeigeRT(rt(teil) ? teil : ersteRT(), sub);
}
function ersteRT() { return (D.rahmenthemen.find((r) => r.aktiv) || D.rahmenthemen[0]).id; }

function markiereTab(id) {
  document.querySelectorAll('#nav .tab').forEach((t) => t.classList.toggle('aktiv', t.dataset.id === id));
}

/* ---------- Halbkreis ---------- */
function polar(cx, cy, r, grad) {
  const a = (grad * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}
function segment(cx, cy, ri, ra, g0, g1) {
  const [x0, y0] = polar(cx, cy, ra, g0), [x1, y1] = polar(cx, cy, ra, g1);
  const [x2, y2] = polar(cx, cy, ri, g1), [x3, y3] = polar(cx, cy, ri, g0);
  const gross = g1 - g0 > 180 ? 1 : 0;
  return `M${x0} ${y0} A${ra} ${ra} 0 ${gross} 1 ${x1} ${y1} L${x2} ${y2} A${ri} ${ri} 0 ${gross} 0 ${x3} ${y3}Z`;
}

const schmal = () => window.matchMedia('(max-width: 640px)').matches;
const anzahl = (n) => `${n} ${n === 1 ? 'Begriff' : 'Begriffe'}`;

function halbkreis(r) {
  const cl = r.cluster, n = cl.length, farben = FARBEN[r.farbe];
  const mitText = !schmal();
  const H = 540, cx = 100, cy = H / 2, ri = 96, ra = 172, W = mitText ? 640 : cx + ra + 20;
  const schritt = 180 / n;
  // Pflichtmodul: kräftige, dunkle Töne der Themenfarbe. Wahlmodul: helle, volle Töne (Verlauf ohne Rand).
  const pf = cl.filter((c) => c.modul !== 'wahl'), wa = cl.filter((c) => c.modul === 'wahl');
  const skala = [hell(farben[0], 0.55), ...farben];
  const ton = (liste, c, von, bis) => {
    const k = liste.indexOf(c), m = Math.max(liste.length - 1, 1), p = liste.length > 1 ? von + (k / m) * (bis - von) : (von + bis) / 2;
    const u = Math.floor(p);
    return u >= skala.length - 1 ? skala[skala.length - 1] : mische(skala[u], skala[u + 1], p - u);
  };
  let s = `<svg class="halbkreis ${mitText ? '' : 'klein'}" viewBox="0 0 ${W} ${H}" role="list" aria-label="Themenbereiche ${esc(r.name)}">`;
  cl.forEach((c, i) => {
    const g0 = -90 + i * schritt + 0.8, g1 = -90 + (i + 1) * schritt - 0.8, gm = (g0 + g1) / 2;
    const wahl = c.modul === 'wahl';
    const farbe = wahl ? ton(wa, c, 0.4, 2) : ton(pf, c, 3.4, 6.2);
    const linie = '#fff';
    const [ix, iy] = polar(cx, cy, (ri + ra) / 2, gm);
    const [px, py] = polar(cx, cy, ra + 14, gm);
    const ly = n === 1 ? cy : 44 + i * ((H - 88) / (n - 1));
    const lx = 300;
    const aktiv = c.id === aktivCluster;
    s += `<g class="seg ${aktiv ? 'aktiv' : ''} ${wahl ? 'wahl' : 'pflicht'}" role="listitem" tabindex="0" data-cluster="${c.id}">
      <path class="flaeche" d="${segment(cx, cy, ri, ra, g0, g1)}" fill="${farbe}"/>
      <path class="markierung" d="${segment(cx, cy, ra + 3, ra + 9, g0, g1)}" fill="${farben[4]}"/>
      <svg x="${ix - 15}" y="${iy - 15}" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="${linie}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${iconPfad(c.icon)}</svg>
      ${mitText ? `<circle cx="${px}" cy="${py}" r="4" class="punkt"/>
      <polyline points="${px},${py} ${lx - 26},${ly} ${lx - 8},${ly}" class="leitung"/>
      <circle cx="${lx - 8}" cy="${ly}" r="3" class="punkt"/>
      <text x="${lx}" y="${ly - 4}" class="lnr" fill="${farben[3]}">${nr2(i + 1)}</text>
      <text x="${lx + 40}" y="${ly - 4}" class="lname">${esc(c.name.toUpperCase())}</text>
      <line x1="${lx}" y1="${ly + 4}" x2="${W - 6}" y2="${ly + 4}" class="unterstrich"/>
      <text x="${lx}" y="${ly + 22}" class="lmeta">${anzahl(c.begriffe.length)} · <tspan class="${wahl ? 'twahl' : 'tpflicht'}" fill="${farben[wahl ? 3 : 4]}">${wahl ? 'Wahlmodul' : 'Pflichtmodul'}</tspan></text>` : ''}
    </g>`;
  });
  s += `<circle cx="${cx}" cy="${cy}" r="${ri - 10}" class="mitte-ring"/>
        <circle cx="${cx}" cy="${cy}" r="${ri - 22}" class="mitte"/>
        <text x="${cx}" y="${cy - 2}" text-anchor="middle" class="mtitel">${esc(kurzname(r.name))}</text>
        <text x="${cx}" y="${cy + 18}" text-anchor="middle" class="msub">RAHMENTHEMA ${nr2(r.nr)}</text>
        <g>${farben.slice(0, 5).map((f, i) => `<rect x="${cx - 24 + i * 10}" y="${cy + 28}" width="8" height="5" fill="${f}"/>`).join('')}</g>`;
  return s + '</svg>';
}
function legende(r) {
  const f = FARBEN[r.farbe];
  return `<ol class="legende">${r.cluster.map((c, i) => `<li><a href="#${r.id}/${c.id}" class="${c.id === aktivCluster ? 'aktiv' : ''} ${c.modul === 'wahl' ? 'wahl' : 'pflicht'}">
    <span class="lnr2" style="color:${f[3]}">${nr2(i + 1)}</span><span><b>${esc(c.name)}</b><small>${anzahl(c.begriffe.length)} · ${c.modul === 'wahl' ? 'Wahl' : 'Pflicht'}</small></span></a></li>`).join('')}</ol>`;
}
function kurzname(n) { return n.length > 12 ? n.split(' ')[0].toUpperCase() : n.toUpperCase(); }

/* ---------- Ansichten ---------- */
function zeigeRT(id, clusterId) {
  const r = rt(id);
  aktivRT = id;
  markiereTab(id);
  document.documentElement.style.setProperty('--rt', FARBEN[r.farbe][3]);
  document.documentElement.style.setProperty('--rt-hell', FARBEN[r.farbe][0] + '22');
  document.documentElement.style.setProperty('--rt-wahl', FARBEN[r.farbe][1]);
  document.documentElement.style.setProperty('--rt-blass', hell(FARBEN[r.farbe][2], 0.93));
  document.documentElement.style.setProperty('--rt-dunkel', FARBEN[r.farbe][5]);
  const m = $('#main');
  if (!r.aktiv || !r.cluster.length) {
    m.innerHTML = `<section class="leer"><h2>${esc(r.name)}</h2><p>Dieses Rahmenthema wird noch ergänzt.</p></section>`;
    return;
  }
  aktivCluster = r.cluster.find((c) => c.id === clusterId) ? clusterId : null;
  m.innerHTML = `
    <section class="uebersicht">
      <div class="kopf">
        <h2><span class="nr">${nr2(r.nr)}</span>${esc(r.name)}</h2>
        <p class="module">${icon('buch')} <b>Pflichtmodul:</b> ${esc(r.pflichtmodul)}${r.wahlmodul ? ` · <b>Wahlmodul:</b> ${esc(r.wahlmodul)}` : ''}</p>
      </div>
      <div class="hk-wrap">${halbkreis(r)}${schmal() ? legende(r) : ''}</div>
      <p class="tipp">Tippe auf einen Bereich, um seine Begriffe zu sehen.</p>
    </section>
    <section id="clusterpanel" class="clusterpanel"></section>`;
  m.querySelectorAll('.seg').forEach((g) => {
    const go = () => { location.hash = `${id}/${g.dataset.cluster}`; };
    g.addEventListener('click', go);
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
  if (aktivCluster) zeigeCluster(r, aktivCluster);
}

function zeigeCluster(r, cid) {
  const i = r.cluster.findIndex((c) => c.id === cid), c = r.cluster[i];
  const p = $('#clusterpanel');
  p.className = 'clusterpanel ' + (c.modul === 'wahl' ? 'wahl' : 'pflicht');
  p.innerHTML = `
    <div class="ckopf">
      <span class="cnr">${nr2(i + 1)}</span>
      <div><h3>${esc(c.name)}</h3><span class="badge ${c.modul}">${c.modul === 'wahl' ? 'Wahlmodul: ' + esc(r.wahlmodul) : 'Pflichtmodul: ' + esc(r.pflichtmodul)}</span></div>
    </div>
    <div class="kacheln">${c.begriffe.map((b) => kachel(b)).join('')}</div>`;
  p.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function kachel(bid) {
  const b = D.begriffe[bid];
  if (!b) return '';
  const n = b.material?.length || 0;
  return `<a class="kachel" href="#begriff/${bid}">${icon(b.icon, 'ic gross')}<span class="ktext"><span class="kname">${trenne(esc(b.kurz || b.name))}</span>
    ${n ? `<span class="kmeta">${icon('ab')}${n} ${n === 1 ? 'Material' : 'Materialien'}</span>` : ''}</span></a>`;
}

// Weiche Trennstellen in langen Wörtern, falls der Browser keine deutsche Silbentrennung hat
const FUGEN = ['schafts', 'schutz', 'gesetz', 'forschung', 'abbruch', 'tugenden', 'theorie', 'gleichnis', 'freiheit', 'modell', 'mechanismus', 'erwartungen', 'biologie', 'unterschied', 'problem', 'reflexiv', 'determinismus', 'fehlschluss', 'editierung', 'argument', 'experiment', 'kultur'];
function trenne(s) {
  return s.replace(/[A-Za-zÄÖÜäöüß]{13,}/g, (w) => FUGEN.reduce((t, f) => t.replace(new RegExp('(.{3})(' + f + ')', 'i'), '$1­$2'), w));
}

function zeigePersonen() {
  aktivRT = aktivRT || ersteRT();
  markiereTab('personen');
  $('#main').innerHTML = `<section><h2 class="einfach">Philosoph:innen und Positionen</h2>
    <div class="personen">${Object.entries(D.personen).sort((a, b) => a[1].name.split(' ').pop().localeCompare(b[1].name.split(' ').pop()))
      .map(([id, p]) => `<a class="pkachel" href="#person/${id}"><span class="pkopf"><b>${esc(p.name)}</b><small>${esc(p.daten)}</small></span>
        <span class="tags">${(p.begriffe || []).filter((x) => D.begriffe[x]).map((x) => `<span class="tag" style="${tagStil(x)}">${esc(D.begriffe[x].kurz || D.begriffe[x].name)}</span>`).join('')}</span></a>`).join('')}</div></section>`;
}

// Tags in der Farbe des Rahmenthemas, zu dem der Begriff gehört
function tagStil(bid) {
  const lage = clusterVon(bid);
  const f = FARBEN[lage ? lage.r.farbe : 'blau'];
  return `--tf:${f[4]};--tb:${hell(f[0], 0.84)};--tr:${hell(f[2], 0.55)}`;
}

function zeigeAbitur() {
  markiereTab('abitur');
  $('#main').innerHTML = `<section><h2 class="einfach">Abitur allgemein</h2>
    <div class="infobox">${icon('info')}<p>Prüfungsaufgaben sind Text-, Thema- oder Gestaltungsaufgaben. Sie können mehrere Rahmenthemen verbinden. Achte auf die Operatoren: Sie zeigen dir, was du tun sollst und zu welchem Anforderungsbereich die Aufgabe gehört.</p></div>
    ${materialListe(D.allgemein)}</section>`;
}

function materialListe(liste) {
  if (!liste?.length) return '';
  return `<ul class="material">${liste.map((m) => `<li><a href="${esc(m.url)}" target="_blank" rel="noopener">${icon(m.typ, 'ic')}<span>${esc(m.titel)}</span><small>${MATERIAL_TYPEN[m.typ] || ''}</small></a></li>`).join('')}</ul>`;
}

/* ---------- Kartenfenster ---------- */
function dialogZeigen(html) {
  const d = $('#karte');
  d.innerHTML = html;
  d.querySelector('.zu').addEventListener('click', () => { d.close(); });
  if (!d.open) d.showModal();
  d.scrollTop = 0;
}

function oeffneBegriff(bid) {
  const b = D.begriffe[bid];
  if (!b) return;
  const lage = clusterVon(bid);
  const farbe = lage ? FARBEN[lage.r.farbe][3] : '#1e5d8c';
  const chips = (b.links || []).filter((x) => D.begriffe[x]).map((x) => `<a class="chip" href="#begriff/${x}">${icon(D.begriffe[x].icon)}${esc(D.begriffe[x].kurz || D.begriffe[x].name)}</a>`).join('');
  const pers = (b.personen || []).filter((x) => D.personen[x]).map((x) => `<a class="chip person" href="#person/${x}">${icon('person')}${esc(D.personen[x].name)}</a>`).join('');
  dialogZeigen(`
    <div class="dkopf" style="--f:${farbe}">
      ${icon(b.icon, 'ic riesig')}
      <div><small>${lage ? esc(lage.r.name + ' · ' + lage.c.name) : ''}${lage ? ` <span class="dmodul ${lage.c.modul === 'wahl' ? 'wahl' : 'pflicht'}">${lage.c.modul === 'wahl' ? 'Wahlmodul' : 'Pflichtmodul'}</span>` : ''}</small><h3>${esc(b.name)}</h3></div>
      <button class="zu" aria-label="Schließen">${icon('schliessen')}</button>
    </div>
    <div class="dinhalt">
      <div class="block erkl">${icon('info')}<p>${fmt(b.erkl)}</p></div>
      ${b.beispiel ? `<div class="block beispiel">${icon('beispiel')}<p><b>Beispiel:</b> ${fmt(b.beispiel)}</p></div>` : ''}
      ${b.achtung ? `<div class="block achtung">${icon('achtung')}<p><b>Achtung:</b> ${fmt(b.achtung)}</p></div>` : ''}
      ${b.positionen ? `<div class="block pos">${icon('pro')}<p><span class="btitel">Positionen und Kritik</span>${fmt(b.positionen)}</p></div>` : ''}
      ${chips ? `<h4>Hängt zusammen mit</h4><div class="chips">${chips}</div>` : ''}
      ${pers ? `<h4>Personen</h4><div class="chips">${pers}</div>` : ''}
      ${b.material?.length ? `<h4>Material</h4>${materialListe(b.material)}` : ''}
    </div>`);
}

function oeffnePerson(pid) {
  const p = D.personen[pid];
  if (!p) return;
  const chips = (p.begriffe || []).filter((x) => D.begriffe[x]).map((x) => `<a class="chip tag" style="${tagStil(x)}" href="#begriff/${x}">${icon(D.begriffe[x].icon)}${esc(D.begriffe[x].kurz || D.begriffe[x].name)}</a>`).join('');
  dialogZeigen(`
    <div class="dkopf" style="--f:#334155">
      ${icon('person', 'ic riesig')}
      <div><small>${esc(p.daten)}</small><h3>${esc(p.name)}</h3></div>
      <button class="zu" aria-label="Schließen">${icon('schliessen')}</button>
    </div>
    <div class="dinhalt">
      <div class="block erkl">${icon('info')}<p>${fmt(p.idee)}</p></div>
      ${p.achtung ? `<div class="block achtung">${icon('achtung')}<p><b>Achtung:</b> ${fmt(p.achtung)}</p></div>` : ''}
      ${p.auch ? `<div class="block quer">${icon('kette')}<p>${fmt(p.auch)}</p></div>` : ''}
      ${chips ? `<h4>Begriffe</h4><div class="chips">${chips}</div>` : ''}
    </div>`);
}

/* ---------- Suche ---------- */
function suchen(q) {
  q = q.trim().toLowerCase();
  const erg = $('#suchergebnis');
  if (q.length < 2) { erg.hidden = true; erg.innerHTML = ''; return; }
  const treffer = Object.entries(D.begriffe).filter(([, b]) => (b.name + ' ' + (b.kurz || '') + ' ' + b.erkl).replace(/\*\*/g, '').toLowerCase().includes(q))
    .sort((a, b) => (a[1].name.toLowerCase().includes(q) ? 0 : 1) - (b[1].name.toLowerCase().includes(q) ? 0 : 1)).slice(0, 12);
  const pt = Object.entries(D.personen).filter(([, p]) => (p.name + ' ' + p.idee).replace(/\*\*/g, '').toLowerCase().includes(q)).slice(0, 5);
  erg.innerHTML = (treffer.map(([id, b]) => `<a href="#begriff/${id}">${icon(b.icon)}<span>${esc(b.name)}</span></a>`).join('') +
    pt.map(([id, p]) => `<a href="#person/${id}">${icon('person')}<span>${esc(p.name)}</span></a>`).join('')) || '<p class="nix">Nichts gefunden.</p>';
  erg.hidden = false;
}

document.addEventListener('DOMContentLoaded', () => {
  const s = $('#suche');
  s.addEventListener('input', () => suchen(s.value));
  $('#suchergebnis').addEventListener('click', (e) => { if (e.target.closest('a')) { s.value = ''; suchen(''); } });
  $('#karte').addEventListener('close', () => {
    if (location.hash.startsWith('#begriff/') || location.hash.startsWith('#person/')) {
      history.replaceState(null, '', '#' + (aktivRT || '') + (aktivCluster ? '/' + aktivCluster : ''));
    }
  });
  $('#karte').addEventListener('click', (e) => { if (e.target.id === 'karte') $('#karte').close(); });
  laden().catch(() => { $('#main').innerHTML = '<p class="leer">Die Daten konnten nicht geladen werden.</p>'; });
});
