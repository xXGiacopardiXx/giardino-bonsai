// Suoni del giardino (game-design.md, sezione 9.3): fruscio, forbici, acqua assorbita dal terriccio,
// più qualche piccolo suono dell'interfaccia. Sono generati dal codice con la Web Audio API:
// niente file audio da scaricare. Sull'iPhone l'audio parte solo dopo il primo tocco (sblocca()).
// La scelta "suoni sì/no" resta sul telefono.

const CHIAVE = 'giardino-bonsai:suoni';
let ctx = null, master = null, rumore = null;
let attivi = (() => { try { return localStorage.getItem(CHIAVE) !== 'no'; } catch (e) { return true; } })();

// da chiamare a ogni tocco: la prima volta crea l'audio, poi lo riprende se il telefono l'ha sospeso
export function sblocca() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = attivi ? 1 : 0; master.connect(ctx.destination);
    // due secondi di rumore bianco, da cui nascono acqua, vento, fruscio e forbici
    rumore = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = rumore.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    avviaVento();
  }
  if (ctx.state === 'suspended') ctx.resume();
}

export const suoniAttivi = () => attivi;
// il contesto audio condiviso, per la musica (musica.js)
export const contesto = () => ctx;
export function attivaSuoni(si) {
  attivi = si;
  try { localStorage.setItem(CHIAVE, si ? 'si' : 'no'); } catch (e) { /* niente da fare */ }
  if (master) master.gain.setTargetAtTime(si ? 1 : 0, ctx.currentTime, .05);
}

const pronto = () => ctx && attivi && ctx.state === 'running';

// rumore filtrato con un inviluppo: il mattone di quasi tutti i suoni
function soffio({ t = 0, durata = .3, tipo = 'bandpass', freq = 1000, q = 1, volume = .3, attacco = .01, freqFine }) {
  const ora = ctx.currentTime + t;
  const src = ctx.createBufferSource(); src.buffer = rumore; src.loop = true;
  const f = ctx.createBiquadFilter(); f.type = tipo; f.frequency.setValueAtTime(freq, ora); f.Q.value = q;
  if (freqFine) f.frequency.exponentialRampToValueAtTime(freqFine, ora + durata);
  const g = ctx.createGain(); g.gain.setValueAtTime(0, ora);
  g.gain.linearRampToValueAtTime(volume, ora + attacco);
  g.gain.exponentialRampToValueAtTime(.0001, ora + durata);
  src.connect(f).connect(g).connect(master);
  src.start(ora, Math.random() * 1.5); src.stop(ora + durata + .05);
}

// nota morbida (seno con un filo di armonica), per Semi e magia
function nota({ t = 0, freq = 880, durata = .4, volume = .15, tipo = 'sine' }) {
  const ora = ctx.currentTime + t;
  const o = ctx.createOscillator(); o.type = tipo; o.frequency.setValueAtTime(freq, ora);
  const g = ctx.createGain(); g.gain.setValueAtTime(0, ora);
  g.gain.linearRampToValueAtTime(volume, ora + .008);
  g.gain.exponentialRampToValueAtTime(.0001, ora + durata);
  o.connect(g).connect(master); o.start(ora); o.stop(ora + durata + .05);
}

// brezza leggerissima di sottofondo, che sale e scende piano
function avviaVento() {
  const src = ctx.createBufferSource(); src.buffer = rumore; src.loop = true;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420; f.Q.value = .4;
  const g = ctx.createGain(); g.gain.value = .022;
  const lfo = ctx.createOscillator(); lfo.frequency.value = .08;
  const lfoG = ctx.createGain(); lfoG.gain.value = .014;
  lfo.connect(lfoG).connect(g.gain);
  src.connect(f).connect(g).connect(master);
  src.start(); lfo.start();
}

// l'annaffiatoio versa: scroscio sottile che dura quanto l'animazione
export function acqua() {
  if (!pronto()) return;
  soffio({ t: .7, durata: 2, tipo: 'bandpass', freq: 2600, q: .7, volume: .16, attacco: .25 });
  soffio({ t: .7, durata: 2, tipo: 'highpass', freq: 5200, q: .5, volume: .05, attacco: .3 });
  // gocce che cadono sul terriccio
  for (let i = 0; i < 14; i++) {
    const t = .8 + Math.random() * 1.8, f = 900 + Math.random() * 900;
    nota({ t, freq: f, durata: .06, volume: .03 });
  }
}

// il terriccio beve: un gorgoglio basso che si spegne
export function assorbe() {
  if (!pronto()) return;
  soffio({ durata: 1.2, tipo: 'lowpass', freq: 700, freqFine: 160, q: 2, volume: .2, attacco: .08 });
  for (let i = 0; i < 4; i++) nota({ t: .1 + i * .18, freq: 220 - i * 25, durata: .12, volume: .05 });
}

// forbici da bonsai: due scatti metallici ravvicinati
export function forbici() {
  if (!pronto()) return;
  [0, .07].forEach((t, i) => {
    soffio({ t, durata: .06, tipo: 'highpass', freq: 4200, q: 1, volume: .32 - i * .1, attacco: .002 });
    nota({ t, freq: 3100 - i * 500, durata: .08, volume: .05, tipo: 'triangle' });
  });
}

// fruscio di foglie: quando si tocca la pianta o cade un germoglio tagliato
export function fruscio(volume = .14) {
  if (!pronto()) return;
  for (let i = 0; i < 3; i++) soffio({ t: i * .07, durata: .28, tipo: 'bandpass', freq: 3000 + i * 600, q: .9, volume: volume * (1 - i * .25), attacco: .04 });
}

// Semi guadagnati: due note che salgono
export function semi() {
  if (!pronto()) return;
  nota({ freq: 988, durata: .25, volume: .1 });
  nota({ t: .09, freq: 1319, durata: .4, volume: .1 });
}

// vaso nuovo: arpeggio luccicante, insieme alle stelline
export function magia() {
  if (!pronto()) return;
  [1047, 1319, 1568, 2093, 2637].forEach((f, i) => nota({ t: i * .07, freq: f, durata: .5, volume: .07 }));
  soffio({ t: .05, durata: .9, tipo: 'highpass', freq: 6000, q: .5, volume: .04, attacco: .2 });
}

// tocco su un pulsante: un piccolo "pop" di legno
export function tocco() {
  if (!pronto()) return;
  nota({ freq: 520, durata: .07, volume: .09, tipo: 'triangle' });
  soffio({ durata: .04, tipo: 'bandpass', freq: 1800, q: 2, volume: .06, attacco: .002 });
}
