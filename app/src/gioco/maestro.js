// I consigli del maestro (game-design.md, sezione 7.4): un vecchio maestro di bonsai che a ogni stagione,
// e in alcuni momenti chiave, spiega in poche righe cosa chiedono le piante. Insegna la tecnica vera,
// con gentilezza, senza rimproveri né premi. Ogni consiglio si mostra una volta sola (stato.maestro.visti).
// Puro come il resto del motore: guarda solo lo stato e la vista.
import { vista } from './stato.js';

export const NOME_MAESTRO = 'Il maestro Ren';

// due consigli per stagione: negli anni dispari il primo, nei pari il secondo
const STAGIONE = [
  [
    'Le piante si svegliano e bevono di più, guarda il terriccio ogni giorno. L\'acero mette germogli lunghi: potali presto, così la chioma resta fitta. Il pino allunga le candele, il ginepro mette punte nuove da pizzicare con le dita.',
    'È di nuovo primavera, la stagione in cui la forma si costruisce. Pota l\'acero lasciando una o due coppie di foglie, cima le candele del pino quando sono chiare, pizzica il ginepro. Se le radici escono dal vaso, è anche il momento del rinvaso.',
  ],
  [
    'Il sole asciuga il terriccio in fretta, soprattutto quello dell\'acero. Annaffia quando è asciutto, mai quando è ancora umido. E guarda tra le foglie: con il caldo arrivano gli afidi.',
    'Le giornate lunghe fanno crescere tutto. Un po\' di concime aiuta l\'acero a irrobustirsi. Le conifere sopportano meglio il caldo, ma non dimenticarle: bevono anche loro, solo più piano.',
  ],
  [
    'L\'acero si accende di rosso, poi lascia cadere le foglie. Annaffia un po\' meno, la crescita rallenta. Togli gli aghi vecchi del pino, quelli gialli verso l\'interno: la luce tornerà ai rami.',
    'Le foglie cadono e mostrano i rami. Guarda la forma dell\'acero e pensa a dove servirà il filo. Niente concime forte adesso: le piante si preparano al riposo.',
  ],
  [
    'Le piante riposano e bevono poco, ma il terriccio non deve mai seccarsi del tutto. Con l\'acero spoglio i rami si vedono bene: è la stagione migliore per il filo. Non concimare.',
    'Il giardino dorme. Controlla il filo: quando ha fatto presa va tolto, prima che segni la corteccia. Alla fine dell\'inverno le gemme si gonfiano, ed è il momento giusto per rinvasare.',
  ],
];
const NOMI = { acero: 'l\'acero', pino: 'il pino', ginepro: 'il ginepro' };
const STAGIONI = ['Primavera', 'Estate', 'Autunno', 'Inverno'];

// i consigli dei momenti chiave, in ordine di importanza: id (con l'anno, se si ripetono) e testo, oppure null
const MOMENTI = [
  // si apre la finestra del rinvaso per una pianta che ne ha bisogno
  (v) => {
    const p = Object.keys(v.rinvaso).find(q => v.rinvaso[q].dovuto && v.rinvaso[q].finestra);
    return p && { id: `rinvaso-${v.anno}`, titolo: 'Il rinvaso',
      testo: `Le gemme si gonfiano: si apre la finestra del rinvaso, pochi giorni a cavallo della primavera. ${NOMI[p][0].toUpperCase() + NOMI[p].slice(1)} ha le radici strette: toccalo e scegli Rinvasa. Akadama per l'acero, un terriccio più drenante per le conifere.` };
  },
  // la prima volta che le radici marciscono per troppa acqua
  (v) => {
    const marcio = v.marciume || Object.values(v.conifere).some(c => c.marciume);
    return marcio && { id: 'ristagno', titolo: 'Troppa acqua',
      testo: 'Le radici hanno bisogno d\'aria quanto d\'acqua. Prima di annaffiare guarda il terriccio: se è ancora scuro e umido, aspetta. Saltando l\'acqua per qualche giorno, la pianta si riprende.' };
  },
];

// il consiglio della stagione in corso (anche già visto): per rileggerlo dal pulsante del maestro
export function consiglioStagione(stato) {
  const v = vista(stato);
  return { id: `stagione-${v.anno}-${v.stagione}`, titolo: STAGIONI[v.stagione], testo: STAGIONE[v.stagione][(v.anno - 1) % 2] };
}

// il consiglio da mostrare adesso (prima i momenti chiave, poi la stagione), oppure null se sono già visti
export function consiglioMaestro(stato) {
  const visti = stato.maestro.visti, v = vista(stato);
  for (const m of MOMENTI) { const c = m(v); if (c && !visti.includes(c.id)) return c; }
  const s = consiglioStagione(stato);
  return visti.includes(s.id) ? null : s;
}

// il giocatore ha letto il consiglio: non si mostra più (si tengono solo gli ultimi, per non far crescere il salvataggio)
export function segnaConsiglio(stato, id) {
  const visti = stato.maestro.visti;
  if (!visti.includes(id)) visti.push(id);
  // 'ristagno' resta per sempre; dei consigli con l'anno bastano gli ultimi
  const fissi = visti.filter(x => !/\d/.test(x)), datati = visti.filter(x => /\d/.test(x)).slice(-12);
  stato.maestro.visti = [...fissi, ...datati];
}
