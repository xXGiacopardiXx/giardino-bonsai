// Musica di sottofondo (game-design.md, sezione 9.3): pianoforte leggero e un tappeto d'archi,
// nello spirito delle colonne sonore Ghibli. Non è un brano registrato: viene composta dal codice
// mentre si gioca, su giri di accordi in fa maggiore che cambiano con la stagione.
// Ogni melodia viene suonata due volte (la ripetizione la rende cantabile), poi resta solo
// l'accompagnamento per un giro, così la musica respira e non stanca.
// Usa il contesto audio dei suoni (suoni.js), che si sblocca al primo tocco.

import { contesto } from './suoni.js';

const CHIAVE = 'giardino-bonsai:musica';
const BATTITO = 60 / 62;            // un quarto, in secondi (62 battiti al minuto)
const OTTAVO = BATTITO / 2;
const SCALA = [5, 7, 9, 10, 0, 2, 4]; // fa maggiore, come classi di nota

// accordi: r = nota del basso (MIDI), t = terza (4 maggiore, 3 minore), s = settima (o niente)
const A = {
  F: { r: 41, t: 4, s: 11 }, Gm: { r: 43, t: 3, s: 10 }, Am: { r: 45, t: 3, s: 10 },
  Bb: { r: 46, t: 4, s: 11 }, C: { r: 48, t: 4, s: null }, Dm: { r: 50, t: 3, s: 10 },
};
// un giro di 8 battute per stagione (0 primavera … 3 inverno)
const GIRI = [
  [A.Bb, A.C, A.Am, A.Dm, A.Bb, A.C, A.F, A.F],
  [A.F, A.Am, A.Bb, A.C, A.Dm, A.Am, A.Bb, A.C],
  [A.Dm, A.Bb, A.F, A.C, A.Gm, A.Am, A.Bb, A.C],
  [A.Dm, A.Bb, A.Gm, A.Am, A.Dm, A.Bb, A.Gm, A.C],
];
// ritmi di una battuta per la melodia: [inizio, durata] in quarti
const RITMI = [
  [[0, 1.5], [1.5, .5], [2, 2]],
  [[0, 1], [1, 1], [2, 2]],
  [[0, 3], [3, 1]],
  [[.5, .5], [1, 1], [2, 2]],
  [[0, 2], [2, 1], [3, 1]],
];
const RITMI_INVERNO = [[[0, 3], [3, 1]], [[0, 2], [2, 2]], [[1, 3]]];

let ctx = null, uscita = null, pianoIn = null, padIn = null, timer = null;
let attiva = (() => { try { return localStorage.getItem(CHIAVE) !== 'no'; } catch (e) { return true; } })();
let stagione = 0, nuovaStagione = 0, prossimo = 0, passo = 0, giro = 0, melodia = null, ultimaNota = 69;

const freq = m => 440 * Math.pow(2, (m - 69) / 12);
const caso = a => a[Math.floor(Math.random() * a.length)];

// riverbero: una "stanza" fatta di rumore che si spegne piano
function riverbero() {
  const durata = 2.8, n = Math.floor(ctx.sampleRate * durata);
  const buf = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
  }
  const conv = ctx.createConvolver(); conv.buffer = buf;
  return conv;
}

function prepara() {
  ctx = contesto();
  if (!ctx) return false;
  uscita = ctx.createGain(); uscita.gain.value = 0; uscita.connect(ctx.destination);
  const eco = riverbero(), ecoG = ctx.createGain(); ecoG.gain.value = .45;
  eco.connect(ecoG).connect(uscita);
  // pianoforte: un po' ovattato, come suonato in un'altra stanza
  pianoIn = ctx.createBiquadFilter(); pianoIn.type = 'lowpass'; pianoIn.frequency.value = 2400; pianoIn.Q.value = .3;
  pianoIn.connect(uscita); pianoIn.connect(eco);
  // archi: tappeto morbidissimo
  padIn = ctx.createBiquadFilter(); padIn.type = 'lowpass'; padIn.frequency.value = 760; padIn.Q.value = .5;
  padIn.connect(uscita); padIn.connect(eco);
  return true;
}

// una nota di pianoforte: attacco netto e coda che si spegne da sola
function piano(t, m, vol, durata) {
  const f = freq(m), coda = Math.min(durata + 1.6, 4.5);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + .006);
  g.gain.exponentialRampToValueAtTime(vol * .35, t + .35);
  g.gain.exponentialRampToValueAtTime(.0001, t + coda);
  g.connect(pianoIn);
  [[f, 'triangle', 1], [f * 2.003, 'sine', .22], [f * 3.01, 'sine', .06]].forEach(([fr, tipo, v]) => {
    const o = ctx.createOscillator(); o.type = tipo; o.frequency.value = fr;
    const og = ctx.createGain(); og.gain.value = v;
    o.connect(og).connect(g); o.start(t); o.stop(t + coda + .05);
  });
}

// archi: le note dell'accordo, entrano e se ne vanno piano
function archi(t, accordo, durata, vol) {
  const note = [accordo.r + 12, accordo.r + 12 + accordo.t, accordo.r + 19];
  if (accordo.s) note.push(accordo.r + 12 + accordo.s);
  note.forEach(m => [-6, 6].forEach(cent => {
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = freq(m); o.detune.value = cent;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 1.4);
    g.gain.setValueAtTime(vol, t + durata);
    g.gain.linearRampToValueAtTime(0, t + durata + 1.6);
    o.connect(g).connect(padIn); o.start(t); o.stop(t + durata + 1.7);
  }));
}

// le note dell'accordo e della scala nella zona della melodia (da fa4 a do6)
const tonoAccordo = (m, c) => [0, c.t, 7, c.s ?? 2].some(i => (m - c.r - i) % 12 === 0);
const nellaScala = m => SCALA.includes(((m % 12) + 12) % 12);
const ZONA = []; for (let m = 65; m <= 84; m++) if (nellaScala(m)) ZONA.push(m);

// sceglie la nota vicina alla precedente: sui tempi forti una nota dell'accordo, sugli altri un passo di scala
function prossimaNota(prec, accordo, forte) {
  if (forte) {
    const vicine = ZONA.filter(m => tonoAccordo(m, accordo) && Math.abs(m - prec) <= 5);
    return vicine.length ? caso(vicine) : ZONA.filter(m => tonoAccordo(m, accordo)).reduce((a, b) => Math.abs(b - prec) < Math.abs(a - prec) ? b : a);
  }
  const i = ZONA.indexOf(ZONA.reduce((a, b) => Math.abs(b - prec) < Math.abs(a - prec) ? b : a));
  const j = Math.max(0, Math.min(ZONA.length - 1, i + caso([-2, -1, -1, 1, 1, 2])));
  return ZONA[j];
}

// compone una melodia per il giro: due frasi di 4 battute, la seconda riprende l'inizio della prima
function componi(giroAccordi) {
  const ritmi = stagione === 3 ? RITMI_INVERNO : RITMI;
  const frase = [caso(ritmi), caso(ritmi), caso(ritmi)];
  const note = new Map();  // ottavo del giro → { m, durata in quarti }
  let prec = ultimaNota;
  for (let b = 0; b < 8; b++) {
    const accordo = giroAccordi[b];
    const fine = b === 3 || b === 7;
    if (b >= 4 && b < 6) {  // la seconda frase ripete le prime due battute della prima
      for (let k = 0; k < 8; k++) { const n = note.get((b - 4) * 8 + k); if (n) note.set(b * 8 + k, n); }
      prec = [...note.values()].at(-1)?.m ?? prec;
      continue;
    }
    // fine frase: una nota lunga che si posa (sulla tonica alla fine del giro, se l'accordo è fa)
    const ritmo = fine ? [[0, 4]] : frase[b % 4];
    for (const [inizio, durata] of ritmo) {
      let m = prossimaNota(prec, accordo, inizio % 2 === 0);
      if (b === 7 && accordo === A.F) m = 77;
      note.set(b * 8 + inizio * 2, { m, durata });
      prec = m;
    }
  }
  ultimaNota = prec;
  return note;
}

// un ottavo di musica, al tempo t
function suona(t) {
  if (passo === 0) stagione = nuovaStagione;  // la stagione cambia solo all'inizio di un giro
  const accordi = GIRI[stagione];
  const battuta = Math.floor(passo / 8), k = passo % 8, accordo = accordi[battuta];
  const umano = () => (Math.random() - .5) * .018;
  if (passo === 0) {
    // ogni tre giri: melodia nuova, poi la stessa ripetuta, poi solo accompagnamento
    const fase = giro % 3;
    if (fase === 0) melodia = componi(accordi);
    else if (fase === 2) melodia = null;
  }
  // accompagnamento: arpeggio che sale e scende, leggero (in inverno solo sui quarti)
  const arpeggio = [0, 7, 14, 12 + accordo.t, 19, 12 + accordo.t, 14, 7];
  if (stagione !== 3 || k % 2 === 0) piano(t + umano(), accordo.r + arpeggio[k], (k === 0 ? .05 : .03) * (.85 + Math.random() * .3), OTTAVO * 2);
  if (k === 0) archi(t, accordo, BATTITO * 4, stagione === 1 ? .011 : .008);
  const n = melodia?.get(passo);
  if (n) piano(t + umano(), n.m, .085 * (.9 + Math.random() * .2), n.durata * BATTITO);
  // ogni tanto un luccichio in alto, come un carillon
  if (k === 4 && Math.random() < .06) piano(t, caso(ZONA) + 12, .02, 1);
  passo = (passo + 1) % 64;
  if (passo === 0) giro++;
}

function programma() {
  if (!attiva || ctx.state !== 'running') return;
  const ora = ctx.currentTime;
  if (prossimo < ora) prossimo = ora + .1;  // dopo una pausa riparte da adesso
  while (prossimo < ora + .6) { suona(prossimo); prossimo += OTTAVO; }
}

// da chiamare dopo suoni.sblocca(): la prima volta prepara gli strumenti e attacca piano piano
export function avvia() {
  if (!ctx && !prepara()) return;
  if (timer) return;
  if (attiva) uscita.gain.setTargetAtTime(1, ctx.currentTime, 1.5);
  timer = setInterval(programma, 150);
  programma();
}

export const musicaAttiva = () => attiva;
export function attivaMusica(si) {
  attiva = si;
  try { localStorage.setItem(CHIAVE, si ? 'si' : 'no'); } catch (e) { /* niente da fare */ }
  if (!uscita) return;
  uscita.gain.setTargetAtTime(si ? 1 : 0, ctx.currentTime, si ? 1.2 : .3);
  if (si) { passo = 0; giro = 0; prossimo = 0; }
}

// la stagione del gioco (0 primavera … 3 inverno): il giro cambia alla fine di quello in corso,
// per non spezzare la frase
export function setStagione(s) { nuovaStagione = s; }
