// Il motore del gioco, senza grafica: lo stato della partita e le regole che lo cambiano.
// Tutte le funzioni ricevono l'ora come parametro, così si possono provare con i test
// e con il cursore dei giorni senza aspettare davvero.
// La pianta non viene simulata ad app chiusa: all'apertura avanza() ricostruisce il tempo trascorso.
import { ORA, GIORNO, FATTORE_SETE, STAGIONI, calendario, giornoLocale, giorniTra } from './tempo.js';

export const VERSIONE = 7;

// Ricompense in Semi (game-design.md, sezione 7.3)
export const SEMI = { iniziali: 50, sfida: 5, serie7: 50, filo: 10, parassiti: 20, scoperti: 10 };

// Sfida del giorno (sezione 7.1): sempre fattibile. Si sceglie la prima volta che si apre il gioco
// in quel giorno, guardando la pianta in quel momento: annaffiare se il terriccio è asciutto,
// altrimenti potare un germoglio (ogni giorno ne spunta uno); in inverno, a giorni alterni,
// mettere il filo, l'azione tipica della stagione (sezione 4.1).
export const SFIDE = { acqua: 'Annaffia l\'acero', pota: 'Pota un germoglio', filo: 'Metti il filo a un ramo', concime: 'Concima l\'acero' };

// Vasi del mini-negozio (sezione 14.1): il primo c'è già, gli altri si comprano con i Semi.
// Prezzi nella fascia della sezione 7.3: con l'acqua di ogni giorno e il bonus della serie
// il primo vaso arriva in meno di una settimana, l'ultimo in circa un mese.
export const VASI = [
  { id: 'blu', nome: 'Ovale blu smaltato', prezzo: 0 },
  { id: 'terracotta', nome: 'Tondo in terracotta', prezzo: 80 },
  { id: 'rettangolare', nome: 'Rettangolare in grès', prezzo: 120 },
  { id: 'celadon', nome: 'Ovale celadon', prezzo: 180 },
  { id: 'nuvola', nome: 'Crema con piedini a nuvola', prezzo: 250 },
];

// Fasi della disidratazione (sezione 6.1). "da" è in giorni di sete, cioè giorni reali
// senza acqua pesati per la stagione (un giorno d'inverno vale mezzo giorno d'estate).
export const FASI = [
  { da: 0, nome: 'Sta bene' },
  { da: 1, nome: 'Ha sete' },
  { da: 2, nome: 'Stress lieve' },
  { da: 4, nome: 'Stress medio' },
  { da: 7, nome: 'Stress forte' },
  { da: 14, nome: 'Sopravvivenza' },
];

export const SETE_PER_ANNAFFIARE = 0.5; // sotto questa soglia il terriccio è ancora umido
const SETE_MASSIMA = 60;               // oltre non cambia più niente
const SALUTE_MINIMA = 0.2;             // tronco, rami principali e una gemma restano sempre
const PERDITA_AL_GIORNO = 0.08;        // quanto in fretta la chioma si dirada sotto stress
const RIPRESA_AL_GIORNO = 0.15;        // da quasi spoglia a piena in 5-6 giorni di cure

// Potatura (sezione 14.1): germogli sulle punte della chioma; tagliandone uno, sotto il taglio
// spuntano 2 gemme che crescono nei giorni successivi e rendono la chioma più fitta.
// La crescita segue il tempo compresso: forte in primavera, lenta in inverno, ferma sotto stress.
export const PUNTE = 10;               // posti della chioma dove può spuntare un germoglio (li disegna la scena)
export const POTABILE_DA = 0.25;       // lunghezza minima per poter tagliare un germoglio (1 = getto lungo)
const GERMOGLI_MASSIMI = 5;            // oltre, la pianta non ne mette di nuovi finché non si pota
const GEMME_PER_PUNTA = 6;             // poi la punta è già fitta: il taglio non aggiunge altre gemme
const LUNGHEZZA_INIZIALE = 0.3;        // un germoglio nuovo si può già cimare: serve alla serie di ogni giorno
const CRESCITA_GERMOGLIO = 0.3;        // al giorno, in estate: da cimabile a getto lungo in 2-3 giorni, così si vede crescere
const CRESCITA_GEMMA = 0.5;            // al giorno, in estate: una gemma diventa un ciuffo in 2 giorni
const VIGORE = [1.4, 1, 0.6, 0.5];     // primavera, estate, autunno, inverno

// Filo (sezione 4.2): si avvolge un ramo e lo si piega; crescendo il ramo "prende" la posizione.
// Poi il filo va tolto: se resta troppo a lungo segna la corteccia (segno che sparisce piano).
// piega: da -1 (ramo abbassato al massimo) a 1 (alzato al massimo); l'angolo vero lo decide la scena.
export const RAMI = 6;                 // rami principali dell'acero, tutti legabili (li disegna la scena)
const PRESA_AL_GIORNO = 0.25;          // in estate: il ramo prende la forma in 4 giorni (più in fretta in primavera)
const TOLLERANZA_FILO = 2;             // giorni dopo la presa in cui il filo non fa ancora danni
const SEGNO_AL_GIORNO = 0.25;          // poi il segno sulla corteccia si fa pieno in 4 giorni
const SEGNO_SVANISCE = 0.05;           // tolto il filo, il segno sparisce in circa 20 giorni

const limita = (v) => Math.min(1, Math.max(0, v));

// Cura (sezione 4 e 6.4): concime e trattamento contro i parassiti.
// Il concime dura una stagione (7 giorni): la pianta cresce e si riprende più in fretta e i parassiti
// attaccano meno. D'inverno la pianta riposa e il concime non serve.
// I parassiti (afidi) arrivano a caso su un cuscinetto della chioma, più spesso in primavera ed estate
// e quando la pianta ha sete. Per mezza giornata sono piccoli e si vedono solo da vicino; poi compare
// l'avviso. Trattati entro un giorno danno Semi (di più se scoperti prima dell'avviso); dopo, rallentano
// la crescita e diradano un po' la chioma, mai sotto la metà: la pianta non muore.
const DURATA_CONCIME = 7;              // giorni
const SPINTA_CONCIME = 1.5;            // crescita e ripresa con il concime
export const POSTI_PARASSITI = 5;      // cuscinetti della chioma dove possono comparire (li sceglie la scena)
const PROBABILITA_PARASSITI = [0.12, 0.12, 0.06, 0]; // al giorno: primavera, estate, autunno, inverno
const ORE_NASCOSTI = 12;               // prima dell'avviso: si scoprono solo guardando da vicino
const ORE_IN_TEMPO = 24;               // trattati entro un giorno: nessun danno e Semi
const DANNO_PARASSITI = 0.06;          // chioma persa al giorno, dopo il primo giorno
const SALUTE_CON_PARASSITI = 0.5;      // i parassiti da soli non la diradano oltre la metà

// numero tra 0 e 1 sempre uguale per la stessa partita e lo stesso giorno: i test si ripetono
function caso(testo) {
  let h = 2166136261;
  for (let i = 0; i < testo.length; i++) h = Math.imul(h ^ testo.charCodeAt(i), 16777619);
  h = Math.imul(h ^ h >>> 15, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909);
  return ((h ^ h >>> 16) >>> 0) / 4294967296;
}
const concimeAttivo = (a, t) => !!a.concime && t < a.concime.fino;
const oreParassiti = (a, t) => a.parassiti ? (t - a.parassiti.da) / ORA : 0;

export function nuovoStato(ora) {
  return {
    versione: VERSIONE,
    inizio: ora,
    aggiornato: ora,
    semi: SEMI.iniziali,
    // si comincia con la pianta un po' assetata: la prima azione è annaffiarla
    albero: { sete: 1, salute: 1, ultimaAcqua: null, ...alberoGiovane() },
    serie: { giorni: 0, ultimoGiorno: null, interrotta: false },
    vasi: { posseduti: [VASI[0].id], scelto: VASI[0].id },
    // la guida dei primi passi si mostra una volta sola, alla prima partita
    guida: { fatta: false },
    // si comincia annaffiando, perché la pianta ha già sete
    oggi: { giorno: giornoLocale(ora), acqua: false, sfida: { tipo: 'acqua', fatta: false } },
    debug: { spostamento: 0 }, // tempo aggiunto dal pannello di prova
  };
}

const ramiNuovi = () => Array.from({ length: RAMI }, () => ({ piega: 0, filo: null, segno: 0 }));

// Germogli e gemme di una partita nuova: due germogli pronti, così Pota si prova subito
function alberoGiovane() {
  const a = { germogli: [], gemme: [], contatore: 0, rami: ramiNuovi(), concime: null, parassiti: null };
  spuntaGermoglio(a, 0.4); spuntaGermoglio(a, 0.55);
  return a;
}

// Porta un salvataggio di una versione precedente alla versione attuale (null se non si può)
export function migra(stato) {
  if (!stato || typeof stato !== 'object') return null;
  if (stato.versione === 1) { Object.assign(stato.albero, alberoGiovane()); stato.versione = 2; }
  if (stato.versione === 2) { stato.vasi = { posseduti: [VASI[0].id], scelto: VASI[0].id }; stato.versione = 3; }
  // chi stava già giocando conosce i comandi: niente guida (si può rivedere dal pannello di prova)
  if (stato.versione === 3) { stato.guida = { fatta: true }; stato.versione = 4; }
  if (stato.versione === 4) { stato.albero.rami = ramiNuovi(); stato.versione = 5; }
  // ora si legano tutti i rami principali: si aggiungono quelli che mancano, senza toccare gli altri
  if (stato.versione === 5) { while (stato.albero.rami.length < RAMI) stato.albero.rami.push({ piega: 0, filo: null, segno: 0 }); stato.versione = 6; }
  if (stato.versione === 6) { stato.albero.concime = null; stato.albero.parassiti = null; stato.versione = 7; }
  return stato.versione === VERSIONE ? stato : null;
}

// Fa spuntare un germoglio su una punta libera, scelta in modo prevedibile (niente Math.random: i test devono ripetersi)
function spuntaGermoglio(a, lunghezza = LUNGHEZZA_INIZIALE) {
  if (a.germogli.length >= GERMOGLI_MASSIMI) return null;
  const libere = [];
  for (let p = 0; p < PUNTE; p++) if (!a.germogli.some(g => g.punta === p)) libere.push(p);
  const id = ++a.contatore;
  const g = { id, punta: libere[(id * 7 + 3) % libere.length], lunghezza };
  a.germogli.push(g);
  return g;
}

// Quanto cresce la pianta: con la stagione, e meno quando ha sete (sezione 6.1: lo stress lieve rallenta, il medio ferma)
function vigore(stagione, sete) {
  return VIGORE[stagione] * (sete < 2 ? 1 : sete < 4 ? 0.4 : 0);
}
// la crescita vera: il concime la spinge, i parassiti non curati la frenano
function vigoreDi(a, stagione, t) {
  return vigore(stagione, a.sete) * (concimeAttivo(a, t) ? SPINTA_CONCIME : 1) * (oreParassiti(a, t) > ORE_IN_TEMPO ? 0.5 : 1);
}

// Fin dove può arrivare la chioma con una certa sete: a lungo senz'acqua si perdono i rametti periferici
function saluteMassima(sete) {
  const tratti = [[4, 1], [7, .85], [14, .45], [30, SALUTE_MINIMA]];
  if (sete <= tratti[0][0]) return 1;
  for (let i = 1; i < tratti.length; i++) {
    const [s0, v0] = tratti[i - 1], [s1, v1] = tratti[i];
    if (sete <= s1) return v0 + (v1 - v0) * (sete - s0) / (s1 - s0);
  }
  return SALUTE_MINIMA;
}

// Porta lo stato all'ora indicata. Modifica e restituisce lo stesso oggetto.
export function avanza(stato, ora) {
  const a = stato.albero;
  let t = stato.aggiornato;
  while (t < ora) {
    const passo = Math.min(ORA, ora - t);
    const giorni = passo / GIORNO;
    const { stagione } = calendario(stato.inizio, t + passo / 2);
    a.sete = Math.min(SETE_MASSIMA, a.sete + giorni * FATTORE_SETE[stagione]);
    const max = saluteMassima(a.sete);
    if (a.salute > max) a.salute = Math.max(max, a.salute - giorni * PERDITA_AL_GIORNO);
    else if (a.sete < 2 && oreParassiti(a, t) <= ORE_IN_TEMPO) a.salute = Math.min(1, a.salute + giorni * RIPRESA_AL_GIORNO * (concimeAttivo(a, t) ? SPINTA_CONCIME : 1));
    if (oreParassiti(a, t) > ORE_IN_TEMPO && a.salute > SALUTE_CON_PARASSITI) a.salute = Math.max(SALUTE_CON_PARASSITI, a.salute - giorni * DANNO_PARASSITI);
    const v = giorni * vigoreDi(a, stagione, t);
    for (const g of a.germogli) g.lunghezza = Math.min(1, g.lunghezza + v * CRESCITA_GERMOGLIO);
    for (const g of a.gemme) g.crescita = Math.min(1, g.crescita + v * CRESCITA_GEMMA);
    for (const r of a.rami) {
      if (!r.filo) { r.segno = Math.max(0, r.segno - giorni * SEGNO_SVANISCE); continue; }
      // il ramo prende la forma crescendo: come i germogli, si ferma sotto stress
      if (r.filo.presa < 1) r.filo.presa = Math.min(1, r.filo.presa + v * PRESA_AL_GIORNO);
      else {
        r.filo.oltre += giorni;
        r.segno = Math.max(r.segno, limita((r.filo.oltre - TOLLERANZA_FILO) * SEGNO_AL_GIORNO));
      }
    }
    t += passo;
    // ogni giorno nuovo, anche quando si salta avanti di molti giorni in una volta
    if (giornoLocale(t) !== stato.oggi.giorno) nuovoGiorno(stato, t);
    // dopo molti giorni senz'acqua non cambia più niente: si salta alla fine
    if (a.sete >= SETE_MASSIMA && a.salute <= SALUTE_MINIMA) t = ora;
  }
  stato.aggiornato = Math.max(stato.aggiornato, ora);

  const oggi = giornoLocale(ora);
  if (stato.oggi.giorno !== oggi) nuovoGiorno(stato, ora);
  if (!stato.oggi.sfida) scegliSfida(stato, ora);
  // serie interrotta: si dimezza una volta sola invece di azzerarsi (sezione 7.2)
  const s = stato.serie;
  if (s.ultimoGiorno && !s.interrotta && giorniTra(s.ultimoGiorno, oggi) > 1) {
    s.giorni = Math.floor(s.giorni / 2);
    s.interrotta = true;
  }
  return stato;
}

// Inizio di un giorno del calendario: la sfida riparte e spunta almeno un germoglio da cimare
// (due in primavera), se la pianta non è sotto stress
function nuovoGiorno(stato, ora) {
  const a = stato.albero;
  const { stagione } = calendario(stato.inizio, ora);
  if (vigore(stagione, a.sete) > 0) for (let i = stagione === 0 ? 2 : 1; i > 0; i--) spuntaGermoglio(a);
  // parassiti: al massimo un attacco alla volta
  if (!a.parassiti) {
    const p = PROBABILITA_PARASSITI[stagione] * (a.sete >= 2 ? 2 : 1) * (concimeAttivo(a, ora) ? 0.5 : 1);
    const giorno = stato.inizio + ':' + giornoLocale(ora);
    if (caso(giorno) < p) a.parassiti = { posto: Math.floor(caso(giorno + ':posto') * POSTI_PARASSITI), da: ora };
  }
  if (a.concime && ora >= a.concime.fino) a.concime = null;
  // la sfida si sceglie quando il giocatore vede il giorno (alla fine di avanza)
  stato.oggi = { giorno: giornoLocale(ora), acqua: false, sfida: null };
}

function scegliSfida(stato, ora) {
  const a = stato.albero;
  const { stagione, giornoStagione } = calendario(stato.inizio, ora);
  const tipo = a.sete >= SETE_PER_ANNAFFIARE ? 'acqua'
    : stagione === 3 && giornoStagione % 2 === 0 ? 'filo'
    : stagione === 2 && giornoStagione % 2 === 0 && !concimeAttivo(a, ora) ? 'concime'
    : a.germogli.some(g => g.lunghezza >= POTABILE_DA) ? 'pota' : 'filo';
  // salvataggi di prima della sfida variabile: se oggi ha già annaffiato, la sfida era l'acqua ed è fatta
  stato.oggi.sfida = stato.oggi.acqua ? { tipo: 'acqua', fatta: true } : { tipo, fatta: false };
}

// Un'azione completa la sfida del giorno se è quella richiesta. Restituisce i Semi guadagnati.
function completaSfida(stato, tipo) {
  const s = stato.oggi.sfida;
  if (!s || s.fatta || s.tipo !== tipo) return 0;
  s.fatta = true;
  stato.semi += SEMI.sfida;
  return SEMI.sfida;
}

// Un'azione di cura conta per la serie una volta al giorno. Restituisce i Semi del bonus.
function registraCura(stato, ora) {
  const s = stato.serie, oggi = giornoLocale(ora);
  if (s.ultimoGiorno === oggi) return 0;
  s.giorni += 1; s.ultimoGiorno = oggi; s.interrotta = false;
  if (s.giorni % 7 === 0) { stato.semi += SEMI.serie7; return SEMI.serie7; }
  return 0;
}

// esito: 'ok' oppure 'umido' (terriccio ancora bagnato, l'acqua non viene assorbita)
export function annaffia(stato, ora) {
  avanza(stato, ora);
  const a = stato.albero;
  if (a.sete < SETE_PER_ANNAFFIARE) return { esito: 'umido', semi: 0, bonusSerie: 0 };
  a.sete = 0; a.ultimaAcqua = ora;
  stato.oggi.acqua = true;
  const semi = completaSfida(stato, 'acqua');
  const bonusSerie = registraCura(stato, ora);
  return { esito: 'ok', semi, bonusSerie };
}

// Taglia un germoglio. esito: 'ok', 'piccolo' (non è ancora cresciuto abbastanza) o 'nessuno'.
// La potatura conta per la serie; dà Semi solo se la sfida del giorno è potare (sezione 7.1).
export function pota(stato, ora, id) {
  avanza(stato, ora);
  const a = stato.albero, i = a.germogli.findIndex(g => g.id === id);
  if (i < 0) return { esito: 'nessuno', gemme: 0, semi: 0, bonusSerie: 0 };
  const g = a.germogli[i];
  if (g.lunghezza < POTABILE_DA) return { esito: 'piccolo', gemme: 0, semi: 0, bonusSerie: 0 };
  a.germogli.splice(i, 1);
  const gemme = Math.max(0, Math.min(2, GEMME_PER_PUNTA - a.gemme.filter(x => x.punta === g.punta).length));
  for (let k = 0; k < gemme; k++) a.gemme.push({ punta: g.punta, crescita: 0 });
  const semi = completaSfida(stato, 'pota');
  const bonusSerie = registraCura(stato, ora);
  return { esito: 'ok', gemme, semi, bonusSerie };
}

// Avvolge il filo su un ramo e lo piega (piega da -1 a 1). Se c'era già un filo, lo rifà da capo.
// Conta per la serie. esito: 'ok' o 'nessuno'.
export function mettiFilo(stato, ora, ramo, piega) {
  avanza(stato, ora);
  const r = stato.albero.rami[ramo];
  if (!r) return { esito: 'nessuno', semi: 0, bonusSerie: 0 };
  r.filo = { piega: Math.max(-1, Math.min(1, piega)), presa: 0, oltre: 0 };
  const semi = completaSfida(stato, 'filo');
  return { esito: 'ok', semi, bonusSerie: registraCura(stato, ora) };
}

// Toglie il filo. Il ramo resta piegato quanto ha preso: tolto presto, torna in parte indietro.
// Tolto al momento giusto (forma presa, corteccia senza segni) regala qualche Seme.
// esito: 'ok' o 'nessuno'; presa: quanto della piega è rimasto (da 0 a 1)
export function togliFilo(stato, ora, ramo) {
  avanza(stato, ora);
  const r = stato.albero.rami[ramo];
  if (!r?.filo) return { esito: 'nessuno', semi: 0, presa: 0, bonusSerie: 0 };
  const { piega, presa } = r.filo;
  r.piega += (piega - r.piega) * presa;
  r.filo = null;
  const semi = presa >= 1 && r.segno < 0.05 ? SEMI.filo : 0;
  stato.semi += semi;
  return { esito: 'ok', semi, presa, bonusSerie: registraCura(stato, ora) };
}

// Concima la pianta per una stagione. esito: 'ok', 'attivo' (ce n'è ancora) o 'inverno' (riposa).
// Conta per la serie.
export function concima(stato, ora) {
  avanza(stato, ora);
  const a = stato.albero, { stagione } = calendario(stato.inizio, ora);
  if (stagione === 3) return { esito: 'inverno', semi: 0, bonusSerie: 0 };
  if (concimeAttivo(a, ora)) return { esito: 'attivo', semi: 0, bonusSerie: 0 };
  a.concime = { fino: ora + DURATA_CONCIME * GIORNO };
  const semi = completaSfida(stato, 'concime');
  return { esito: 'ok', semi, bonusSerie: registraCura(stato, ora) };
}

// Tratta i parassiti. esito: 'ok' o 'nessuno'. In tempo (entro un giorno) danno Semi,
// e qualcuno in più se scoperti da vicino prima dell'avviso. Conta per la serie.
export function tratta(stato, ora) {
  avanza(stato, ora);
  const a = stato.albero;
  if (!a.parassiti) return { esito: 'nessuno', semi: 0, inTempo: false, presto: false, bonusSerie: 0 };
  const ore = oreParassiti(a, ora);
  const presto = ore < ORE_NASCOSTI, inTempo = ore <= ORE_IN_TEMPO;
  const semi = (inTempo ? SEMI.parassiti : 0) + (presto ? SEMI.scoperti : 0);
  stato.semi += semi;
  a.parassiti = null;
  return { esito: 'ok', semi, inTempo, presto, bonusSerie: registraCura(stato, ora) };
}

// Compra un vaso e lo mette subito all'albero. esito: 'ok', 'pochi' (Semi insufficienti), 'gia' (già tuo) o 'nessuno'.
export function compra(stato, id) {
  const vaso = VASI.find(v => v.id === id);
  if (!vaso) return { esito: 'nessuno', mancano: 0 };
  if (stato.vasi.posseduti.includes(id)) return { esito: 'gia', mancano: 0 };
  if (stato.semi < vaso.prezzo) return { esito: 'pochi', mancano: vaso.prezzo - stato.semi };
  stato.semi -= vaso.prezzo;
  stato.vasi.posseduti.push(id);
  stato.vasi.scelto = id;
  return { esito: 'ok', mancano: 0 };
}

// Mette all'albero un vaso già comprato. Restituisce false se il vaso non è tuo.
export function scegliVaso(stato, id) {
  if (!stato.vasi.posseduti.includes(id)) return false;
  stato.vasi.scelto = id;
  return true;
}


// Tutto quello che serve per disegnare: calcolato dallo stato, senza modificarlo.
export function vista(stato) {
  const a = stato.albero;
  const cal = calendario(stato.inizio, stato.aggiornato);
  let fase = 0;
  FASI.forEach((f, i) => { if (a.sete >= f.da) fase = i; });
  const haSete = a.sete >= FASI[1].da;
  return {
    ...cal,
    nomeStagione: STAGIONI[cal.stagione],
    semi: stato.semi,
    vaso: stato.vasi.scelto,
    // catalogo del negozio con lo stato di ogni vaso
    vasi: VASI.map(v => ({ ...v, tuo: stato.vasi.posseduti.includes(v.id), inUso: stato.vasi.scelto === v.id })),
    serie: stato.serie.giorni,
    sete: a.sete,
    salute: a.salute,
    // riserva d'acqua nel terriccio: 1 appena annaffiata, 0 dopo una settimana senz'acqua (stress forte)
    acqua: limita(1 - a.sete / FASI[4].da),
    // 0..1: quanto la pianta sta soffrendo oltre la semplice sete (stress medio e oltre), per la scena
    appassimento: limita((a.sete - FASI[3].da) / (FASI[5].da - FASI[3].da)),
    fase,
    nomeFase: FASI[fase].nome,
    haSete,
    puoAnnaffiare: a.sete >= SETE_PER_ANNAFFIARE,
    // 0 = foglie sane, 1 = ingiallite: si vede dal primo giorno, è piena dal quarto
    ingiallimento: limita((a.sete - .5) / 3.5),
    // 0 = terriccio scuro e umido, 1 = chiaro e secco
    terriccio: limita(a.sete / 1.5),
    lungaAssenza: a.sete >= FASI[4].da,
    germogli: a.germogli.map(g => ({ ...g, potabile: g.lunghezza >= POTABILE_DA })),
    gemme: a.gemme.map(g => ({ ...g })),
    // rami da legare: piega attuale (col filo, quella voluta), stato del filo e segni sulla corteccia
    rami: a.rami.map(r => ({
      piega: r.filo ? r.filo.piega : r.piega,
      filo: !!r.filo,
      presa: r.filo ? r.filo.presa : 1,
      pronto: !!r.filo && r.filo.presa >= 1,
      // giorni che mancano alla presa, con il ritmo di adesso (null se sotto stress non cresce)
      giorniAllaPresa: r.filo && r.filo.presa < 1 ? (vigoreDi(a, cal.stagione, stato.aggiornato) > 0 ? Math.ceil((1 - r.filo.presa) / (PRESA_AL_GIORNO * vigoreDi(a, cal.stagione, stato.aggiornato)) - 1e-9) : null) : 0,
      segno: r.segno,
    })),
    filoDaTogliere: a.rami.some(r => r.filo && r.filo.presa >= 1),
    // concime: attivo per altri N giorni; si può dare fuori dall'inverno se non ce n'è già
    concime: {
      attivo: concimeAttivo(a, stato.aggiornato),
      giorni: concimeAttivo(a, stato.aggiornato) ? Math.ceil((a.concime.fino - stato.aggiornato) / GIORNO - 1e-9) : 0,
      inverno: cal.stagione === 3,
    },
    // parassiti: posto (cuscinetto), quanto sono cresciuti (0..1), se c'è già l'avviso, se fanno danno
    parassiti: a.parassiti ? {
      posto: a.parassiti.posto,
      grandezza: limita(oreParassiti(a, stato.aggiornato) / 48),
      visibili: oreParassiti(a, stato.aggiornato) >= ORE_NASCOSTI,
      danno: oreParassiti(a, stato.aggiornato) > ORE_IN_TEMPO,
      oreInTempo: Math.max(0, Math.ceil(ORE_IN_TEMPO - oreParassiti(a, stato.aggiornato))),
    } : null,
    puoPotare: a.germogli.some(g => g.lunghezza >= POTABILE_DA),
    // oggi la serie ha già avuto la sua azione di cura (acqua o potatura)
    curatoOggi: stato.serie.ultimoGiorno === stato.oggi.giorno,
    annaffiatoOggi: stato.oggi.acqua,
    // sfida del giorno: tipo ('acqua', 'pota', 'filo'), testo da mostrare e se è già fatta
    sfida: stato.oggi.sfida ? { ...stato.oggi.sfida, testo: SFIDE[stato.oggi.sfida.tipo] } : null,
  };
}
