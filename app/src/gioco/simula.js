// Simulazione dell'economia (game-design.md, sezione 7.3): un giocatore costante apre il gioco ogni giorno,
// fa la sfida del giorno, annaffia chi ha sete, toglie gli afidi, fotografa le piante una volta a stagione,
// toglie il filo al momento giusto e compra solo i prodotti che gli servono. Serve a controllare la regola
// di bilanciamento: una cosa piccola ogni 2-3 giorni, una grande ogni 3-4 settimane.
// Si usa nei test (stato.test.js) e a mano:  node src/gioco/simula.js
import { GIORNO, ORA } from './tempo.js';
import { nuovoStato, avanza, annaffia, pota, mettiFilo, togliFilo, togliAghi, rinvasa, usaProdotto, compraProdotto, fotografa, vista, POTABILE_DA } from './stato.js';

// giorni: quanti giorni simulare; inizio: ora della prima apertura (mezzogiorno)
export function simula(giorni = 56, inizio = new Date(2026, 9, 26, 12).getTime()) {
  const s = nuovoStato(inizio);
  s.meteo.attivo = false;
  s.guida.fatta = true;
  const voci = { guadagnati: 0, spesiInCure: 0 };
  let prima = s.semi;
  // i Semi guadagnati e spesi si contano guardando come cambia il conto dopo ogni azione
  const conta = (fn) => { const p = s.semi; fn(); const d = s.semi - p; if (d > 0) voci.guadagnati += d; else voci.spesiInCure -= d; };
  const serve = (id) => { if (!s.inventario[id]) conta(() => compraProdotto(s, id)); };
  const giornaliero = [];
  for (let g = 0; g < giorni; g++) {
    const t = inizio + g * GIORNO;
    avanza(s, t);
    const v = vista(s), sf = s.oggi.sfida;
    // la sfida del giorno
    if (sf && !sf.fatta) {
      const p = sf.pianta ?? 'acero', c = p === 'acero' ? s.albero : s.conifere[p];
      if (sf.tipo === 'acqua') conta(() => annaffia(s, t, p));
      else if (sf.tipo === 'pota' && (sf.tecnica === 'aghi' || sf.tecnica === 'fiori')) conta(() => togliAghi(s, t, c.vecchi[0].id, p));
      else if (sf.tipo === 'pota') { const x = c.germogli.find(q => q.lunghezza >= POTABILE_DA); if (x) conta(() => pota(s, t, x.id, p)); }
      else if (sf.tipo === 'filo') { const i = c.rami.findIndex(r => !r.filo); if (i >= 0) conta(() => mettiFilo(s, t, i, -.6, p)); }
      else if (sf.tipo === 'concime') { serve('concime-universale'); conta(() => usaProdotto(s, t, 'acero', 'concime-universale')); }
      else if (sf.tipo === 'rinvaso') { serve('akadama'); conta(() => rinvasa(s, t, p, 'akadama')); }
    }
    // le altre piante con sete, gli afidi, i fili pronti, i germogli lunghi, le foto di stagione
    for (const p of v.piante) {
      const c = p === 'acero' ? v : v.conifere[p];
      if (c.haSete) conta(() => annaffia(s, t + ORA, p));
      if (v.cura[p]?.parassiti?.visibili) { serve('sapone-molle'); conta(() => usaProdotto(s, t + ORA, p, 'sapone-molle')); }
      (c.rami ?? []).forEach((r, i) => { if (r.pronto) conta(() => togliFilo(s, t + ORA, i, p)); });
      const cc = p === 'acero' ? s.albero : s.conifere[p];
      for (const x of cc.germogli.filter(q => q.lunghezza >= .7)) conta(() => pota(s, t + 2 * ORA, x.id, p));
      conta(() => fotografa(s, t + 3 * ORA, p));
    }
    // la sfida della settimana avanza da sola con queste azioni; qui si contano solo i suoi Semi
    giornaliero.push(s.semi - prima);
    prima = s.semi;
  }
  return { stato: s, ...voci, netti: voci.guadagnati - voci.spesiInCure, alGiorno: (voci.guadagnati - voci.spesiInCure) / giorni, giornaliero };
}

// a mano: stampa il riassunto
if (typeof process !== 'undefined' && process.argv[1]?.endsWith('simula.js')) {
  const r = simula(Number(process.argv[2]) || 56);
  console.log(`giorni ${r.giornaliero.length}: guadagnati ${r.guadagnati}, spesi in cure ${r.spesiInCure}, netti ${r.netti} (${r.alGiorno.toFixed(1)} al giorno)`);
  console.log('serie', r.stato.serie.giorni, 'settimana', JSON.stringify(r.stato.settimana));
}
