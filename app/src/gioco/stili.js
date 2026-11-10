// Stili classici (game-design.md, sezione 5.2): l'obiettivo di lungo periodo di ogni albero.
// Ogni specie propone gli stili adatti al suo tronco. Uno stile è una sagoma (ellissoidi nelle coordinate
// del tronco: x a destra, y in alto, z verso chi guarda) più qualche regola vera dello stile.
// La valutazione è una funzione pura: riceve i ciuffi della chioma (dalla scena) e i rami (dal motore).
//
// Percentuale = 35% riempimento (i ciuffi che stanno dentro la sagoma ci sono ancora: non tagliati troppo,
// chioma sana) + 45% pulizia (pochi ciuffi fuori dalla sagoma: ogni ciuffo fuori conta il doppio, così
// senza forbice non si arriva al sigillo) + 20% regole rispettate.
//
// Stili sbloccati con l'età (sezione 5.3): anno = anno di gioco della pianta nel giardino da cui lo stile
// si può scegliere (1 = subito). Gli stili più difficili chiedono una pianta che abbia già vissuto qualche
// anno con te; perche spiega, con le parole del maestro, perché serve tempo.

const E = (x, y, z, rx, ry, rz) => ({ c: [x, y, z], r: [rx, ry, rz] });
const ramoGiu = (i, quanto = -0.2) => (v) => (v.rami[i]?.piega ?? 0) <= quanto;
const ramoSu = (i, quanto = 0.15) => (v) => (v.rami[i]?.piega ?? 0) >= quanto;
const sana = (v) => v.salute >= 0.8;

export const STILI = {
  acero: [
    { id: 'moyogi', nome: 'Moyogi', sottotitolo: 'Eretto informale', premio: 300,
      descrizione: 'Tronco mosso e chioma a triangolo, fatta di cuscinetti piatti separati da spazi d\'aria.',
      sagoma: [E(-.95, 1.12, .1, .5, .2, .42), E(.9, 1.42, -.05, .48, .2, .42), E(-.42, 1.86, .17, .42, .18, .36),
        E(.18, 2.08, -.08, .44, .24, .4), E(.2, 1.6, -.52, .38, .18, .32), E(-.5, 1.47, -.3, .34, .17, .3), E(.45, 1.8, .3, .38, .18, .32)],
      regole: [
        { testo: 'Rami bassi un po\' abbassati col filo', ok: (v) => ramoGiu(0)(v) && ramoGiu(1)(v) },
        { testo: 'Chioma sana (almeno 80%)', ok: sana },
      ] },
    { id: 'hokidachi', nome: 'Hokidachi', sottotitolo: 'A scopa', premio: 350,
      descrizione: 'Tronco dritto che si apre a ventaglio in una chioma tonda e fitta, come una scopa rovesciata.',
      sagoma: [E(0, 1.75, 0, 1.05, .62, .82)],
      regole: [
        { testo: 'Rami bassi alzati col filo, verso l\'alto', ok: (v) => ramoSu(0)(v) && ramoSu(1)(v) },
        { testo: 'Chioma sana (almeno 80%)', ok: sana },
      ] },
    { id: 'bunjingi', nome: 'Bunjingi', sottotitolo: 'Letterato', premio: 600, anno: 2,
      descrizione: 'Tronco libero e nudo, e in cima pochi rami con una chioma piccola e leggera. L\'eleganza del poco.',
      perche: 'Il Bunjingi si ottiene togliendo, non aggiungendo: serve una pianta che abbia già un tronco con carattere e la forza di ricacciare dall\'alto.',
      sagoma: [E(.12, 2.02, -.02, .62, .26, .5), E(-.38, 1.84, .14, .32, .14, .28)],
      regole: [
        { testo: 'Rami bassi abbassati col filo, come piegati dagli anni', ok: (v) => ramoGiu(0)(v) && ramoGiu(1)(v) },
        { testo: 'Chioma sana (almeno 80%)', ok: sana },
      ] },
    { id: 'fukinagashi', nome: 'Fukinagashi', sottotitolo: 'Battuto dal vento', premio: 650, anno: 3,
      descrizione: 'Come cresciuto su un crinale ventoso: tutta la chioma corre verso destra, a sinistra il tronco resta nudo.',
      perche: 'Il vento modella un albero in molti anni: per imitarlo servono rami robusti, che reggano il filo a lungo senza spezzarsi.',
      sagoma: [E(.85, 1.3, 0, .62, .22, .45), E(.5, 1.85, .05, .55, .22, .42), E(.95, 1.02, -.05, .4, .17, .34)],
      regole: [
        { testo: 'Rami bassi abbassati col filo, come spinti dal vento', ok: (v) => ramoGiu(0)(v) && ramoGiu(1)(v) },
        { testo: 'Chioma sana (almeno 80%)', ok: sana },
      ] },
  ],
  pino: [
    { id: 'shakan', nome: 'Shakan', sottotitolo: 'Inclinato', premio: 400,
      descrizione: 'Il tronco pende da un lato; il ramo basso dall\'altra parte fa da contrappeso. Cuscinetti piatti a mensola.',
      sagoma: [E(-.6, .8, .1, .42, .16, .38), E(1.0, 1.14, -.05, .4, .16, .36), E(.1, 1.76, .1, .38, .16, .34),
        E(.55, 1.84, -.1, .34, .15, .3), E(.3, 1.29, .35, .27, .13, .24)],
      regole: [
        { testo: 'Ramo basso di contrappeso abbassato col filo', ok: ramoGiu(0) },
        { testo: 'Chioma sana (almeno 80%)', ok: sana },
      ] },
    { id: 'moyogi', nome: 'Moyogi', sottotitolo: 'Eretto informale', premio: 400,
      descrizione: 'Cuscinetti tondi e pieni, che salgono a triangolo verso l\'apice.',
      sagoma: [E(-.6, .85, .1, .46, .24, .42), E(1.0, 1.18, -.05, .44, .24, .4), E(.1, 1.8, .1, .42, .26, .38),
        E(.55, 1.88, -.1, .38, .24, .34), E(.3, 1.32, .35, .3, .2, .28)],
      regole: [
        { testo: 'Ramo apicale piegato verso il centro col filo', ok: ramoGiu(3, -0.15) },
        { testo: 'Chioma sana (almeno 80%)', ok: sana },
      ] },
    { id: 'bunjingi', nome: 'Bunjingi', sottotitolo: 'Letterato', premio: 600, anno: 2,
      descrizione: 'Il tronco sale nudo e sottile; in cima pochi cuscinetti, come un vecchio pino sulle rocce dipinto con l\'inchiostro.',
      perche: 'Il pino si lascia spogliare solo quando è forte: tolti i rami bassi, deve ricacciare dagli aghi in cima. Un pino giovane non ce la farebbe.',
      sagoma: [E(.3, 1.86, 0, .55, .2, .42), E(.75, 1.62, -.05, .3, .14, .26)],
      regole: [
        { testo: 'Ramo apicale piegato verso il centro col filo', ok: ramoGiu(3, -0.15) },
        { testo: 'Chioma sana (almeno 80%)', ok: sana },
      ] },
    { id: 'fukinagashi', nome: 'Fukinagashi', sottotitolo: 'Battuto dal vento', premio: 650, anno: 3,
      descrizione: 'Un pino delle scogliere: la chioma è tutta a destra, stesa dal vento del mare.',
      perche: 'I rami del pino si piegano piano e il filo deve restare a lungo: lo stile chiede una pianta matura e paziente.',
      sagoma: [E(1.0, 1.15, 0, .55, .2, .42), E(.65, 1.78, 0, .55, .2, .4)],
      regole: [
        { testo: 'Ramo basso abbassato col filo, come spinto dal vento', ok: ramoGiu(0) },
        { testo: 'Chioma sana (almeno 80%)', ok: sana },
      ] },
  ],
  ginepro: [
    { id: 'moyogi', nome: 'Moyogi', sottotitolo: 'Eretto informale', premio: 450,
      descrizione: 'Il tronco si torce salendo; cuscinetti a nuvola, separati da spazi d\'aria.',
      sagoma: [E(-.8, .84, .12, .44, .2, .4), E(.74, 1.07, -.05, .42, .2, .38), E(-.48, 1.37, .05, .36, .17, .32),
        E(.04, 1.78, 0, .42, .22, .36), E(.3, 1.42, .25, .27, .14, .24)],
      regole: [
        { testo: 'Rami bassi abbassati col filo', ok: (v) => ramoGiu(0)(v) && ramoGiu(1)(v) },
        { testo: 'Chioma sana (almeno 80%)', ok: sana },
      ] },
    { id: 'fukinagashi', nome: 'Fukinagashi', sottotitolo: 'Battuto dal vento', premio: 500,
      descrizione: 'Come piegato da un vento costante: tutta la chioma corre verso destra, a sinistra restano rami nudi.',
      sagoma: [E(.8, 1.05, -.05, .55, .2, .4), E(.3, 1.44, .2, .42, .17, .3), E(.35, 1.78, 0, .5, .2, .36)],
      regole: [
        { testo: 'Ramo basso di destra abbassato col filo, come spinto dal vento', ok: ramoGiu(1, -0.15) },
        { testo: 'Ramo di sinistra alzato verso destra col filo', ok: ramoSu(2, 0.1) },
        { testo: 'Chioma sana (almeno 80%)', ok: sana },
      ] },
    { id: 'bunjingi', nome: 'Bunjingi', sottotitolo: 'Letterato', premio: 600, anno: 2,
      descrizione: 'Il tronco che si torce resta in vista; in cima una sola nuvola di squame.',
      perche: 'Il ginepro ricaccia solo dove c\'è già verde: prima di spogliare il tronco bisogna che la cima sia piena e forte.',
      sagoma: [E(.08, 1.8, 0, .52, .24, .42)],
      regole: [
        { testo: 'Rami bassi abbassati col filo', ok: (v) => ramoGiu(0)(v) && ramoGiu(1)(v) },
        { testo: 'Chioma sana (almeno 80%)', ok: sana },
      ] },
  ],
};

// l'azalea (sezione 5.4): tronco basso e mosso, chioma fitta di foglie piccole che si copre di fiori
STILI.azalea = [
  { id: 'moyogi', nome: 'Moyogi', sottotitolo: 'Eretto informale', premio: 350,
    descrizione: 'Cuscinetti tondi e pieni, a gradini, che in primavera diventano nuvole di fiori.',
    sagoma: [E(-.62, .78, .05, .44, .24, .4), E(.62, .95, -.05, .42, .24, .38), E(-.2, 1.25, .1, .42, .24, .36), E(.25, 1.5, 0, .4, .24, .36)],
    regole: [
      { testo: 'Rami bassi abbassati col filo', ok: (v) => ramoGiu(0)(v) && ramoGiu(1)(v) },
      { testo: 'Chioma sana (almeno 80%)', ok: sana },
    ] },
  { id: 'hokidachi', nome: 'Hokidachi', sottotitolo: 'A scopa', premio: 400,
    descrizione: 'Una cupola tonda e compatta: in fioritura sembra un unico grande mazzo di fiori.',
    sagoma: [E(0, 1.15, 0, .95, .58, .78)],
    regole: [
      { testo: 'Rami bassi alzati col filo, verso l\'alto', ok: (v) => ramoSu(0)(v) && ramoSu(1)(v) },
      { testo: 'Chioma sana (almeno 80%)', ok: sana },
    ] },
];

export const STILE_INIZIALE = { acero: 'moyogi', pino: 'shakan', ginepro: 'moyogi', azalea: 'moyogi' };
export const COMPLETATO_DA = 90;   // percentuale per il sigillo dello stile
export const stileDi = (pianta, id) => STILI[pianta]?.find(s => s.id === id) ?? null;
// uno stile si può scegliere dall'anno indicato; quello in corso e quelli già sigillati restano sempre scelti
export const stileAperto = (stile, anno, c) => (stile.anno ?? 1) <= anno || c?.stile.id === stile.id || !!c?.stile.sigilli.includes(stile.id);

// un punto è dentro la sagoma se sta in almeno uno degli ellissoidi (con un po' di tolleranza)
export function dentroSagoma(sagoma, x, y, z, margine = 1.08) {
  return sagoma.some(({ c, r }) => {
    const dx = (x - c[0]) / r[0], dy = (y - c[1]) / r[1], dz = (z - c[2]) / r[2];
    return dx * dx + dy * dy + dz * dz <= margine * margine;
  });
}

// ciuffi: [{ x, y, z, visibile }] (tutti i ciuffi della chioma, nella posizione attuale, rami piegati compresi)
// v: { rami, salute } dalla vista del motore. Restituisce percentuale (0..100), le regole con l'esito
// e l'elenco dei ciuffi visibili fuori dalla sagoma (da tagliare).
export function valutaStile(stile, ciuffi, v) {
  const dentro = ciuffi.map(q => dentroSagoma(stile.sagoma, q.x, q.y, q.z));
  const totDentro = dentro.filter(Boolean).length;
  const visibiliDentro = ciuffi.filter((q, i) => q.visibile && dentro[i]).length;
  const visibili = ciuffi.filter(q => q.visibile).length;
  const fuori = []; ciuffi.forEach((q, i) => { if (q.visibile && !dentro[i]) fuori.push(i); });
  const riempimento = totDentro ? visibiliDentro / totDentro : 0;
  const pulizia = visibili ? Math.max(0, 1 - 2 * fuori.length / visibili) : 0;
  const regole = stile.regole.map(r => ({ testo: r.testo, ok: !!r.ok(v) }));
  const quoteRegole = regole.length ? regole.filter(r => r.ok).length / regole.length : 1;
  const percentuale = Math.round(100 * (0.35 * riempimento + 0.45 * pulizia + 0.2 * quoteRegole));
  return { percentuale, riempimento, pulizia, regole, fuori };
}
