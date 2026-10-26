// Il motore del gioco, senza grafica: lo stato della partita e le regole che lo cambiano.
// Tutte le funzioni ricevono l'ora come parametro, così si possono provare con i test
// e con il cursore dei giorni senza aspettare davvero.
// La pianta non viene simulata ad app chiusa: all'apertura avanza() ricostruisce il tempo trascorso.
import { ORA, GIORNO, FATTORE_SETE, STAGIONI, calendario, giornoLocale, giorniTra } from './tempo.js';

export const VERSIONE = 1;

// Ricompense in Semi (game-design.md, sezione 7.3)
export const SEMI = { iniziali: 50, acqua: 5, serie7: 50 };

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

export function nuovoStato(ora) {
  return {
    versione: VERSIONE,
    inizio: ora,
    aggiornato: ora,
    semi: SEMI.iniziali,
    // si comincia con la pianta un po' assetata: la prima azione è annaffiarla
    albero: { sete: 1, salute: 1, ultimaAcqua: null },
    serie: { giorni: 0, ultimoGiorno: null, interrotta: false },
    oggi: { giorno: giornoLocale(ora), acqua: false },
    debug: { spostamento: 0 }, // tempo aggiunto dal pannello di prova
  };
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
    else if (a.sete < 2) a.salute = Math.min(1, a.salute + giorni * RIPRESA_AL_GIORNO);
    t += passo;
    // dopo molti giorni senz'acqua non cambia più niente: si salta alla fine
    if (a.sete >= SETE_MASSIMA && a.salute <= SALUTE_MINIMA) t = ora;
  }
  stato.aggiornato = Math.max(stato.aggiornato, ora);

  const oggi = giornoLocale(ora);
  if (stato.oggi.giorno !== oggi) stato.oggi = { giorno: oggi, acqua: false };
  // serie interrotta: si dimezza una volta sola invece di azzerarsi (sezione 7.2)
  const s = stato.serie;
  if (s.ultimoGiorno && !s.interrotta && giorniTra(s.ultimoGiorno, oggi) > 1) {
    s.giorni = Math.floor(s.giorni / 2);
    s.interrotta = true;
  }
  return stato;
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
  let semi = 0;
  if (!stato.oggi.acqua) { semi = SEMI.acqua; stato.semi += semi; stato.oggi.acqua = true; }
  const bonusSerie = registraCura(stato, ora);
  return { esito: 'ok', semi, bonusSerie };
}

const limita = (v) => Math.min(1, Math.max(0, v));

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
    serie: stato.serie.giorni,
    sete: a.sete,
    salute: a.salute,
    fase,
    nomeFase: FASI[fase].nome,
    haSete,
    puoAnnaffiare: a.sete >= SETE_PER_ANNAFFIARE,
    // 0 = foglie sane, 1 = ingiallite: si vede dal primo giorno, è piena dal quarto
    ingiallimento: limita((a.sete - .5) / 3.5),
    // 0 = terriccio scuro e umido, 1 = chiaro e secco
    terriccio: limita(a.sete / 1.5),
    lungaAssenza: a.sete >= FASI[4].da,
    // sfida del giorno "annaffia": compare quando la pianta ha sete, resta spuntata dopo l'acqua
    sfida: haSete || stato.oggi.acqua ? { fatta: stato.oggi.acqua && !haSete } : null,
  };
}
