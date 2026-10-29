// Il motore del gioco, senza grafica: lo stato della partita e le regole che lo cambiano.
// Tutte le funzioni ricevono l'ora come parametro, così si possono provare con i test
// e con il cursore dei giorni senza aspettare davvero.
// La pianta non viene simulata ad app chiusa: all'apertura avanza() ricostruisce il tempo trascorso.
import { ORA, GIORNO, FATTORE_SETE, STAGIONI, calendario, giornoLocale, giorniTra } from './tempo.js';

export const VERSIONE = 10;

// Ricompense in Semi (game-design.md, sezione 7.3)
export const SEMI = { iniziali: 50, sfida: 5, serie7: 50, filo: 10, parassiti: 20, scoperti: 10 };

// Sfida del giorno (sezione 7.1): sempre fattibile. Si sceglie la prima volta che si apre il gioco
// in quel giorno, guardando la pianta in quel momento: annaffiare se il terriccio è asciutto,
// altrimenti potare un germoglio (ogni giorno ne spunta uno); in inverno, a giorni alterni,
// mettere il filo, l'azione tipica della stagione (sezione 4.1).
export const SFIDE = { acqua: 'Annaffia l\'acero', pota: 'Pota un germoglio', filo: 'Metti il filo a un ramo', concime: 'Concima l\'acero' };
// sfide di potatura delle conifere, con la tecnica giusta per ognuna
const SFIDE_POTA = { candele: 'Cima le candele del pino', aghi: 'Togli gli aghi vecchi del pino', pizzica: 'Pizzica il ginepro' };

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
// Ogni specie beve a modo suo (sezione 6.1.4): l'acero, foglie larghe e radici fini, asciuga il vaso
// in un giorno d'estate; pino nero e ginepro, aghi e squame che trattengono l'acqua, vogliono il
// terriccio quasi asciutto tra un'annaffiatura e l'altra: circa ogni 3-4 giorni d'estate, il doppio d'inverno.
// Le fasi della sete (FASI) sono le stesse: per le conifere arrivano solo più tardi.
export const SETE_SPECIE = { acero: 1, pino: 0.28, ginepro: 0.33 };
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
export const RAMI_SPECIE = { acero: RAMI, pino: 5, ginepro: 4 };
const PRESA_AL_GIORNO = 0.25;          // in estate: il ramo prende la forma in 4 giorni (più in fretta in primavera)
// il legno delle conifere è più duro e cresce più piano: il filo ci mette il doppio (o quasi) a fare presa
const PRESA_SPECIE = { acero: 1, pino: 0.5, ginepro: 0.6 };

// Potatura delle conifere (sezione 4.3), ognuna con la sua tecnica:
// - pino nero: in primavera e all'inizio dell'estate spuntano le "candele", getti chiari e dritti
//   da cimare; in autunno sui cuscinetti compaiono ciuffi di aghi vecchi, ingialliti, da togliere.
// - ginepro: in primavera ed estate le punte nuove escono dalla sagoma e si pizzicano con le dita
//   (le forbici imbrunirebbero le squame).
// Non lasciano gemme come l'acero: tengono la chioma compatta. D'inverno le conifere riposano.
const POSTI_VECCHI = 5;                // cuscinetti del pino dove possono esserci aghi vecchi
const VECCHI_MASSIMI = 3;
const GERMOGLI_CONIFERE = 4;           // candele o punte al massimo, finché non si potano
const TOLLERANZA_FILO = 2;             // giorni dopo la presa in cui il filo non fa ancora danni
const SEGNO_AL_GIORNO = 0.25;          // poi il segno sulla corteccia si fa pieno in 4 giorni
const SEGNO_SVANISCE = 0.05;           // tolto il filo, il segno sparisce in circa 20 giorni

const limita = (v) => Math.min(1, Math.max(0, v));

// Cura (sezioni 4, 6.4 e 6.5): concimi e trattamenti, comprati a confezioni nel negozio e tenuti
// nell'inventario. Si curano tutte e tre le piante: l'acero e le due conifere (pino e ginepro).
// Il concime dura una stagione (7 giorni): la pianta cresce e si riprende più in fretta e i parassiti
// attaccano meno. D'inverno la pianta riposa e il concime non serve.
// I parassiti (afidi) arrivano a caso su un cuscinetto della chioma, più spesso in primavera ed estate
// e quando la pianta ha sete. Per mezza giornata sono piccoli e si vedono solo da vicino; poi compare
// l'avviso. Trattati entro un giorno danno Semi (di più se scoperti prima dell'avviso); dopo, rallentano
// la crescita e diradano un po' la chioma, mai sotto la metà: la pianta non muore.
const DURATA_CONCIME = 7;              // giorni
const DURATA_PROTEZIONE = 7;           // giorni in cui l'olio di neem tiene lontani i parassiti
export const POSTI_PARASSITI = 5;      // cuscinetti della chioma dove possono comparire (li sceglie la scena)
const PROBABILITA_PARASSITI = [0.12, 0.12, 0.06, 0]; // al giorno: primavera, estate, autunno, inverno
const PROBABILITA_CONIFERE = 0.6;      // le conifere, robuste e sempre ben curate, ne prendono meno

export const PIANTE = { acero: 'Acero giapponese', pino: 'Pino nero', ginepro: 'Ginepro' };
// Prodotti di cura: alcuni specifici per una pianta (più efficaci), altri generali per tutte.
// tipo: 'concime' (spinta: crescita e ripresa) o 'trattamento' (toglie i parassiti; protezione: giorni senza)
export const DOSI_PER_CONFEZIONE = 3;
export const PRODOTTI = [
  { id: 'concime-acero', nome: 'Concime per aceri', tipo: 'concime', piante: ['acero'], spinta: 1.6, prezzo: 30,
    descrizione: 'Organico, ricco di ferro: foglie più vivaci e crescita forte.' },
  { id: 'concime-conifere', nome: 'Concime per conifere', tipo: 'concime', piante: ['pino', 'ginepro'], spinta: 1.6, prezzo: 30,
    descrizione: 'A lenta cessione, poco azoto: aghi corti e compatti.' },
  { id: 'concime-universale', nome: 'Concime universale', tipo: 'concime', piante: ['acero', 'pino', 'ginepro'], spinta: 1.3, prezzo: 20,
    descrizione: 'Va bene per tutti i bonsai, un po\' meno efficace.' },
  { id: 'sapone-molle', nome: 'Sapone molle', tipo: 'trattamento', piante: ['acero', 'pino', 'ginepro'], protezione: 0, prezzo: 20,
    descrizione: 'Spray delicato: toglie gli afidi.' },
  { id: 'olio-neem', nome: 'Olio di neem', tipo: 'trattamento', piante: ['acero', 'pino', 'ginepro'], protezione: DURATA_PROTEZIONE, prezzo: 35,
    descrizione: 'Toglie gli afidi e li tiene lontani per una stagione. Si può usare anche prima.' },
];
// il kit con cui si comincia
const INVENTARIO_INIZIALE = { 'concime-universale': 2, 'sapone-molle': 2 };
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
const spinta = (a, t) => concimeAttivo(a, t) ? a.concime.spinta ?? 1.5 : 1;
const protetta = (a, t) => !!a.protezione && t < a.protezione.fino;
const curaNuova = () => ({ concime: null, parassiti: null, protezione: null });
// pino e ginepro: cura e acqua (si comincia con il terriccio ancora un po' umido)
const coniferaNuova = (p) => ({ ...curaNuova(), sete: 0.3, ultimaAcqua: null, ...potaturaConifera(p) });
// germogli (candele o punte), aghi vecchi e rami da legare di una conifera
function potaturaConifera(p) {
  return { germogli: [], contatore: 0, vecchi: [], rami: Array.from({ length: RAMI_SPECIE[p] }, () => ({ piega: 0, filo: null, segno: 0 })) };
}
// la parte di stato che riguarda la cura di una pianta (per l'acero è l'albero stesso)
const curaDi = (stato, pianta) => pianta === 'acero' ? stato.albero : stato.conifere[pianta];
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
    // pino e ginepro: per ora si curano solo con concimi e trattamenti
    conifere: { pino: coniferaNuova('pino'), ginepro: coniferaNuova('ginepro') },
    inventario: { ...INVENTARIO_INIZIALE },
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
  const a = { germogli: [], gemme: [], contatore: 0, rami: ramiNuovi(), ...curaNuova() };
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
  // prodotti a confezioni nell'inventario e cura anche per le conifere: si parte con il kit iniziale
  if (stato.versione === 7) {
    stato.albero.protezione = null;
    stato.conifere = { pino: coniferaNuova('pino'), ginepro: coniferaNuova('ginepro') };
    stato.inventario = { ...INVENTARIO_INIZIALE };
    stato.versione = 8;
  }
  // pino e ginepro hanno la loro sete
  if (stato.versione === 8) {
    for (const p of ['pino', 'ginepro']) Object.assign(stato.conifere[p], { sete: 0.3, ultimaAcqua: null });
    stato.versione = 9;
  }
  // potatura e filo anche per le conifere
  if (stato.versione === 9) {
    for (const p of ['pino', 'ginepro']) if (!stato.conifere[p].germogli) Object.assign(stato.conifere[p], potaturaConifera(p));
    stato.versione = 10;
  }
  return stato.versione === VERSIONE ? stato : null;
}

// Fa spuntare un germoglio su una punta libera, scelta in modo prevedibile (niente Math.random: i test devono ripetersi)
function spuntaGermoglio(a, lunghezza = LUNGHEZZA_INIZIALE, massimi = GERMOGLI_MASSIMI) {
  if (a.germogli.length >= massimi) return null;
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
  return vigore(stagione, a.sete) * spinta(a, t) * (oreParassiti(a, t) > ORE_IN_TEMPO ? 0.5 : 1);
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
    for (const p of ['pino', 'ginepro']) {
      const c = stato.conifere[p];
      c.sete = Math.min(SETE_MASSIMA, c.sete + giorni * FATTORE_SETE[stagione] * SETE_SPECIE[p]);
    }
    const max = saluteMassima(a.sete);
    if (a.salute > max) a.salute = Math.max(max, a.salute - giorni * PERDITA_AL_GIORNO);
    else if (a.sete < 2 && oreParassiti(a, t) <= ORE_IN_TEMPO) a.salute = Math.min(1, a.salute + giorni * RIPRESA_AL_GIORNO * spinta(a, t));
    if (oreParassiti(a, t) > ORE_IN_TEMPO && a.salute > SALUTE_CON_PARASSITI) a.salute = Math.max(SALUTE_CON_PARASSITI, a.salute - giorni * DANNO_PARASSITI);
    const v = giorni * vigoreDi(a, stagione, t);
    for (const g of a.germogli) g.lunghezza = Math.min(1, g.lunghezza + v * CRESCITA_GERMOGLIO);
    for (const g of a.gemme) g.crescita = Math.min(1, g.crescita + v * CRESCITA_GEMMA);
    cresceFilo(a.rami, v * PRESA_AL_GIORNO, giorni);
    for (const p of ['pino', 'ginepro']) {
      const c = stato.conifere[p], vc = giorni * vigoreDi(c, stagione, t);
      for (const g of c.germogli) g.lunghezza = Math.min(1, g.lunghezza + vc * CRESCITA_GERMOGLIO);
      cresceFilo(c.rami, vc * PRESA_AL_GIORNO * PRESA_SPECIE[p], giorni);
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

// il ramo col filo prende la forma crescendo (presa: quanto ne prende in questo passo): come i germogli,
// si ferma sotto stress; a forma presa il filo comincia a segnare la corteccia
function cresceFilo(rami, presa, giorni) {
  for (const r of rami) {
    if (!r.filo) { r.segno = Math.max(0, r.segno - giorni * SEGNO_SVANISCE); continue; }
    if (r.filo.presa < 1) r.filo.presa = Math.min(1, r.filo.presa + presa);
    else {
      r.filo.oltre += giorni;
      r.segno = Math.max(r.segno, limita((r.filo.oltre - TOLLERANZA_FILO) * SEGNO_AL_GIORNO));
    }
  }
}

// Inizio di un giorno del calendario: la sfida riparte e spunta almeno un germoglio da cimare
// (due in primavera), se la pianta non è sotto stress
function nuovoGiorno(stato, ora) {
  const a = stato.albero;
  const { stagione, giornoStagione } = calendario(stato.inizio, ora);
  if (vigore(stagione, a.sete) > 0) for (let i = stagione === 0 ? 2 : 1; i > 0; i--) spuntaGermoglio(a);
  // conifere: candele del pino in primavera e nei primi giorni d'estate, punte del ginepro in primavera
  // ed estate, aghi vecchi del pino in autunno
  const pino = stato.conifere.pino, ginepro = stato.conifere.ginepro;
  if (vigore(stagione, pino.sete) > 0) {
    if (stagione === 0) { spuntaGermoglio(pino, LUNGHEZZA_INIZIALE, GERMOGLI_CONIFERE); spuntaGermoglio(pino, LUNGHEZZA_INIZIALE, GERMOGLI_CONIFERE); }
    if (stagione === 1 && giornoStagione <= 3) spuntaGermoglio(pino, LUNGHEZZA_INIZIALE, GERMOGLI_CONIFERE);
  }
  if (stagione === 2 && pino.vecchi.length < VECCHI_MASSIMI) {
    const liberi = []; for (let p = 0; p < POSTI_VECCHI; p++) if (!pino.vecchi.some(x => x.posto === p)) liberi.push(p);
    const id = ++pino.contatore;
    pino.vecchi.push({ id, posto: liberi[(id * 3 + 1) % liberi.length] });
  }
  if (vigore(stagione, ginepro.sete) > 0 && stagione <= 1) spuntaGermoglio(ginepro, LUNGHEZZA_INIZIALE, GERMOGLI_CONIFERE);
  // parassiti: al massimo un attacco alla volta per pianta; mai con l'olio di neem che fa effetto
  for (const pianta in PIANTE) {
    const c = curaDi(stato, pianta);
    if (c.concime && ora >= c.concime.fino) c.concime = null;
    if (c.protezione && ora >= c.protezione.fino) c.protezione = null;
    if (c.parassiti || protetta(c, ora)) continue;
    const p = PROBABILITA_PARASSITI[stagione] * (pianta === 'acero' ? (a.sete >= 2 ? 2 : 1) : PROBABILITA_CONIFERE) * (concimeAttivo(c, ora) ? 0.5 : 1);
    const giorno = stato.inizio + ':' + giornoLocale(ora) + (pianta === 'acero' ? '' : ':' + pianta);
    if (caso(giorno) < p) c.parassiti = { posto: Math.floor(caso(giorno + ':posto') * POSTI_PARASSITI), da: ora };
  }
  // la sfida si sceglie quando il giocatore vede il giorno (alla fine di avanza)
  stato.oggi = { giorno: giornoLocale(ora), acqua: false, sfida: null };
}

function scegliSfida(stato, ora) {
  const a = stato.albero;
  const { stagione, giornoStagione } = calendario(stato.inizio, ora);
  // se l'acero non beve, magari ha davvero sete una conifera (quella più asciutta): per lei la sfida
  // arriva solo quando ha sete, non appena il terriccio si asciuga, così restano anche le altre sfide
  const conifera = ['pino', 'ginepro'].filter(p => stato.conifere[p].sete >= FASI[1].da)
    .sort((x, y) => stato.conifere[y].sete - stato.conifere[x].sete)[0];
  if (a.sete < SETE_PER_ANNAFFIARE && conifera && !stato.oggi.acqua) { stato.oggi.sfida = { tipo: 'acqua', pianta: conifera, fatta: false }; return; }
  // se l'acero non ha niente da potare, la potatura del giorno può essere quella di una conifera
  const potaConifera = !a.germogli.some(g => g.lunghezza >= POTABILE_DA) && (
    stato.conifere.pino.vecchi.length ? { pianta: 'pino', tecnica: 'aghi' }
    : stato.conifere.pino.germogli.some(g => g.lunghezza >= POTABILE_DA) ? { pianta: 'pino', tecnica: 'candele' }
    : stato.conifere.ginepro.germogli.some(g => g.lunghezza >= POTABILE_DA) ? { pianta: 'ginepro', tecnica: 'pizzica' } : null);
  if (a.sete < SETE_PER_ANNAFFIARE && !stato.oggi.acqua && !(stagione === 3 && giornoStagione % 2 === 0) && !(stagione === 2 && giornoStagione % 2 === 0 && !concimeAttivo(a, ora)) && potaConifera) {
    stato.oggi.sfida = { tipo: 'pota', ...potaConifera, fatta: false }; return;
  }
  const tipo = a.sete >= SETE_PER_ANNAFFIARE ? 'acqua'
    : stagione === 3 && giornoStagione % 2 === 0 ? 'filo'
    : stagione === 2 && giornoStagione % 2 === 0 && !concimeAttivo(a, ora) ? 'concime'
    : a.germogli.some(g => g.lunghezza >= POTABILE_DA) ? 'pota' : 'filo';
  // salvataggi di prima della sfida variabile: se oggi ha già annaffiato, la sfida era l'acqua ed è fatta
  stato.oggi.sfida = stato.oggi.acqua ? { tipo: 'acqua', fatta: true } : { tipo, fatta: false };
}

// Un'azione completa la sfida del giorno se è quella richiesta. Restituisce i Semi guadagnati.
function completaSfida(stato, tipo, pianta = 'acero') {
  const s = stato.oggi.sfida;
  if (!s || s.fatta || s.tipo !== tipo || (s.pianta ?? 'acero') !== pianta) return 0;
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
// pianta: 'acero' (predefinita), 'pino' o 'ginepro'
export function annaffia(stato, ora, pianta = 'acero') {
  avanza(stato, ora);
  const a = pianta === 'acero' ? stato.albero : stato.conifere[pianta];
  if (!a) return { esito: 'nessuno', semi: 0, bonusSerie: 0 };
  if (a.sete < SETE_PER_ANNAFFIARE) return { esito: 'umido', semi: 0, bonusSerie: 0 };
  a.sete = 0; a.ultimaAcqua = ora;
  if (pianta === 'acero') stato.oggi.acqua = true;
  const semi = completaSfida(stato, 'acqua', pianta);
  const bonusSerie = registraCura(stato, ora);
  return { esito: 'ok', semi, bonusSerie };
}

// Taglia un germoglio. esito: 'ok', 'piccolo' (non è ancora cresciuto abbastanza) o 'nessuno'.
// La potatura conta per la serie; dà Semi solo se la sfida del giorno è potare (sezione 7.1).
// pianta: 'acero' (predefinita), 'pino' (cima una candela) o 'ginepro' (pizzica una punta)
export function pota(stato, ora, id, pianta = 'acero') {
  avanza(stato, ora);
  const a = pianta === 'acero' ? stato.albero : stato.conifere[pianta];
  const i = a ? a.germogli.findIndex(g => g.id === id) : -1;
  if (i < 0) return { esito: 'nessuno', gemme: 0, semi: 0, bonusSerie: 0 };
  const g = a.germogli[i];
  if (g.lunghezza < POTABILE_DA) return { esito: 'piccolo', gemme: 0, semi: 0, bonusSerie: 0 };
  a.germogli.splice(i, 1);
  // l'acero risponde al taglio con due gemme; le conifere restano compatte
  const gemme = pianta !== 'acero' ? 0 : Math.max(0, Math.min(2, GEMME_PER_PUNTA - a.gemme.filter(x => x.punta === g.punta).length));
  for (let k = 0; k < gemme; k++) a.gemme.push({ punta: g.punta, crescita: 0 });
  const semi = completaSfida(stato, 'pota', pianta);
  const bonusSerie = registraCura(stato, ora);
  return { esito: 'ok', gemme, semi, bonusSerie };
}

// Avvolge il filo su un ramo e lo piega (piega da -1 a 1). Se c'era già un filo, lo rifà da capo.
// Conta per la serie. esito: 'ok' o 'nessuno'.
// pianta: 'acero' (predefinita), 'pino' o 'ginepro'
export function mettiFilo(stato, ora, ramo, piega, pianta = 'acero') {
  avanza(stato, ora);
  const r = curaDi(stato, pianta)?.rami?.[ramo];
  if (!r) return { esito: 'nessuno', semi: 0, bonusSerie: 0 };
  r.filo = { piega: Math.max(-1, Math.min(1, piega)), presa: 0, oltre: 0 };
  // la sfida del filo vale su qualunque pianta
  const semi = completaSfida(stato, 'filo', stato.oggi.sfida?.pianta ?? 'acero');
  return { esito: 'ok', semi, bonusSerie: registraCura(stato, ora) };
}

// Toglie il filo. Il ramo resta piegato quanto ha preso: tolto presto, torna in parte indietro.
// Tolto al momento giusto (forma presa, corteccia senza segni) regala qualche Seme.
// esito: 'ok' o 'nessuno'; presa: quanto della piega è rimasto (da 0 a 1)
export function togliFilo(stato, ora, ramo, pianta = 'acero') {
  avanza(stato, ora);
  const r = curaDi(stato, pianta)?.rami?.[ramo];
  if (!r?.filo) return { esito: 'nessuno', semi: 0, presa: 0, bonusSerie: 0 };
  const { piega, presa } = r.filo;
  r.piega += (piega - r.piega) * presa;
  r.filo = null;
  const semi = presa >= 1 && r.segno < 0.05 ? SEMI.filo : 0;
  stato.semi += semi;
  return { esito: 'ok', semi, presa, bonusSerie: registraCura(stato, ora) };
}

// Toglie un ciuffo di aghi vecchi dal pino (autunno). esito: 'ok' o 'nessuno'. Conta come potatura.
export function togliAghi(stato, ora, id) {
  avanza(stato, ora);
  const pino = stato.conifere.pino, i = pino.vecchi.findIndex(x => x.id === id);
  if (i < 0) return { esito: 'nessuno', semi: 0, bonusSerie: 0 };
  pino.vecchi.splice(i, 1);
  const semi = completaSfida(stato, 'pota', 'pino');
  return { esito: 'ok', semi, bonusSerie: registraCura(stato, ora) };
}

// Compra una confezione di un prodotto di cura (DOSI_PER_CONFEZIONE dosi nell'inventario).
// esito: 'ok', 'pochi' (Semi insufficienti) o 'nessuno'
export function compraProdotto(stato, id) {
  const p = PRODOTTI.find(x => x.id === id);
  if (!p) return { esito: 'nessuno', mancano: 0 };
  if (stato.semi < p.prezzo) return { esito: 'pochi', mancano: p.prezzo - stato.semi };
  stato.semi -= p.prezzo;
  stato.inventario[id] = (stato.inventario[id] ?? 0) + DOSI_PER_CONFEZIONE;
  return { esito: 'ok', mancano: 0 };
}

// Usa una dose di un prodotto su una pianta. Conta per la serie.
// esito: 'ok', 'finito' (nessuna dose), 'non-adatto', 'nessuno' (pianta o prodotto sconosciuti),
// per i concimi 'attivo' (ce n'è ancora) e 'inverno' (la pianta riposa),
// per i trattamenti 'niente' (nessun parassita: il sapone molle non serve; il neem invece protegge).
// I parassiti tolti entro un giorno danno Semi, e qualcuno in più se scoperti prima dell'avviso.
export function usaProdotto(stato, ora, pianta, id) {
  avanza(stato, ora);
  const p = PRODOTTI.find(x => x.id === id), c = PIANTE[pianta] ? curaDi(stato, pianta) : null;
  const vuoto = { semi: 0, bonusSerie: 0, inTempo: false, presto: false, tolti: false };
  if (!p || !c) return { esito: 'nessuno', ...vuoto };
  if (!p.piante.includes(pianta)) return { esito: 'non-adatto', ...vuoto };
  if (!stato.inventario[id]) return { esito: 'finito', ...vuoto };
  let semi = 0, inTempo = false, presto = false, tolti = false;
  if (p.tipo === 'concime') {
    if (calendario(stato.inizio, ora).stagione === 3) return { esito: 'inverno', ...vuoto };
    if (concimeAttivo(c, ora)) return { esito: 'attivo', ...vuoto };
    c.concime = { fino: ora + DURATA_CONCIME * GIORNO, spinta: p.spinta, prodotto: id };
    if (pianta === 'acero') semi += completaSfida(stato, 'concime');
  } else {
    if (!c.parassiti && !p.protezione) return { esito: 'niente', ...vuoto };
    if (c.parassiti) {
      const ore = oreParassiti(c, ora);
      presto = ore < ORE_NASCOSTI; inTempo = ore <= ORE_IN_TEMPO; tolti = true;
      semi += (inTempo ? SEMI.parassiti : 0) + (presto ? SEMI.scoperti : 0);
      c.parassiti = null;
    }
    if (p.protezione) c.protezione = { fino: ora + p.protezione * GIORNO };
  }
  stato.inventario[id] -= 1;
  stato.semi += semi;
  return { esito: 'ok', semi, inTempo, presto, tolti, bonusSerie: registraCura(stato, ora) };
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


const DOVE = { pino: 'il pino', ginepro: 'il ginepro' };
const testoSfida = (s) => s.tipo === 'acqua' && s.pianta && s.pianta !== 'acero' ? 'Annaffia ' + DOVE[s.pianta]
  : s.tipo === 'pota' && s.tecnica ? SFIDE_POTA[s.tecnica] : SFIDE[s.tipo];
// i rami da legare di una pianta: piega attuale (col filo, quella voluta), stato del filo e segni sulla corteccia
function vistaRami(rami, ritmo) {
  return rami.map(r => ({
    piega: r.filo ? r.filo.piega : r.piega,
    filo: !!r.filo,
    presa: r.filo ? r.filo.presa : 1,
    pronto: !!r.filo && r.filo.presa >= 1,
    // giorni che mancano alla presa, con il ritmo di adesso (null se sotto stress non cresce)
    giorniAllaPresa: r.filo && r.filo.presa < 1 ? (ritmo > 0 ? Math.ceil((1 - r.filo.presa) / ritmo - 1e-9) : null) : 0,
    segno: r.segno,
  }));
}
// come sta una pianta con l'acqua, dalla sua sete
function vistaAcqua(sete) {
  let fase = 0;
  FASI.forEach((f, i) => { if (sete >= f.da) fase = i; });
  return {
    sete, fase, nomeFase: FASI[fase].nome,
    haSete: sete >= FASI[1].da,
    puoAnnaffiare: sete >= SETE_PER_ANNAFFIARE,
    acqua: limita(1 - sete / FASI[4].da),
    ingiallimento: limita((sete - .5) / 3.5),
    terriccio: limita(sete / 1.5),
  };
}
const giorniFino = (fino, t) => Math.ceil((fino - t) / GIORNO - 1e-9);
function vistaCura(c, t, stagione) {
  const ore = oreParassiti(c, t);
  return {
    // concime: attivo per altri N giorni; si può dare fuori dall'inverno se non ce n'è già
    concime: {
      attivo: concimeAttivo(c, t),
      giorni: concimeAttivo(c, t) ? giorniFino(c.concime.fino, t) : 0,
      prodotto: concimeAttivo(c, t) ? c.concime.prodotto ?? null : null,
      inverno: stagione === 3,
    },
    // parassiti: posto (cuscinetto), quanto sono cresciuti (0..1), se c'è già l'avviso, se fanno danno
    parassiti: c.parassiti ? {
      posto: c.parassiti.posto,
      grandezza: limita(ore / 48),
      visibili: ore >= ORE_NASCOSTI,
      danno: ore > ORE_IN_TEMPO,
      oreInTempo: Math.max(0, Math.ceil(ORE_IN_TEMPO - ore)),
    } : null,
    // olio di neem: giorni di protezione dai parassiti
    protezione: protetta(c, t) ? giorniFino(c.protezione.fino, t) : 0,
  };
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
    rami: vistaRami(a.rami, PRESA_AL_GIORNO * vigoreDi(a, cal.stagione, stato.aggiornato)),
    filoDaTogliere: a.rami.some(r => r.filo && r.filo.presa >= 1),
    // cura di ogni pianta: concime, parassiti e protezione (l'acero anche qui sotto, per comodità)
    cura: Object.fromEntries(Object.keys(PIANTE).map(p => [p, vistaCura(curaDi(stato, p), stato.aggiornato, cal.stagione)])),
    concime: vistaCura(a, stato.aggiornato, cal.stagione).concime,
    parassiti: vistaCura(a, stato.aggiornato, cal.stagione).parassiti,
    // inventario: tutti i prodotti del catalogo con le dosi che hai
    prodotti: PRODOTTI.map(p => ({ ...p, dosi: stato.inventario[p.id] ?? 0 })),
    nomiPiante: PIANTE,
    puoPotare: a.germogli.some(g => g.lunghezza >= POTABILE_DA),
    // oggi la serie ha già avuto la sua azione di cura (acqua o potatura)
    curatoOggi: stato.serie.ultimoGiorno === stato.oggi.giorno,
    annaffiatoOggi: stato.oggi.acqua,
    // sfida del giorno: tipo ('acqua', 'pota', 'filo'), testo da mostrare e se è già fatta
    sfida: stato.oggi.sfida ? { ...stato.oggi.sfida, testo: testoSfida(stato.oggi.sfida) } : null,
    // pino e ginepro: la loro acqua (stessi campi dell'acero qui sopra)
    // pino e ginepro: acqua (stessi campi dell'acero), potatura e rami da legare
    conifere: Object.fromEntries(['pino', 'ginepro'].map(p => {
      const c = stato.conifere[p];
      const rami = vistaRami(c.rami, PRESA_AL_GIORNO * PRESA_SPECIE[p] * vigoreDi(c, cal.stagione, stato.aggiornato));
      return [p, {
        ...vistaAcqua(c.sete),
        germogli: c.germogli.map(g => ({ ...g, potabile: g.lunghezza >= POTABILE_DA })),
        vecchi: c.vecchi.map(x => ({ ...x })),
        puoPotare: c.germogli.some(g => g.lunghezza >= POTABILE_DA) || c.vecchi.length > 0,
        rami, filoDaTogliere: rami.some(r => r.pronto),
      }];
    })),
  };
}
