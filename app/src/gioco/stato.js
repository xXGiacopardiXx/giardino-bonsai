// Il motore del gioco, senza grafica: lo stato della partita e le regole che lo cambiano.
// Tutte le funzioni ricevono l'ora come parametro, così si possono provare con i test
// e con il cursore dei giorni senza aspettare davvero.
// La pianta non viene simulata ad app chiusa: all'apertura avanza() ricostruisce il tempo trascorso.
import { ORA, GIORNO, FATTORE_SETE, STAGIONI, calendario, giornoLocale, giorniTra, giornoDopo } from './tempo.js';
import { STILI, STILE_INIZIALE, COMPLETATO_DA, stileDi, stileAperto } from './stili.js';
import { PAGINE } from './quaderno.js';

export const VERSIONE = 30;

// Ricompense in Semi (game-design.md, sezione 7.3)
export const SEMI = { iniziali: 50, sfida: 10, serie7: 50, filo: 10, parassiti: 20, scoperti: 10, rinvaso: 40, foto: 5, settimana: 50, stagione: 30, rinascita: 50, malattia: 25 };

// I momenti belli di ogni pianta (sezione 7.3): la prima fioritura dell'anno (azalea, ciliegio) e i primi colori
// d'autunno (acero, ciliegio) valgono SEMI.stagione, una volta per anno e per pianta, se la pianta sta bene
// (chioma almeno CHIOMA_PER_PREMIO): è il premio di averla curata, non di aver aperto il gioco.
const CHIOMA_PER_PREMIO = 0.6;
// Sfida di rinascita (sezione 6.2): chi torna dopo una lunga assenza (una pianta in stress forte) riceve una sfida:
// riportare tutte le piante a una chioma piena almeno a CHIOMA_RINASCITA, senza sete. Completata, SEMI.rinascita.
const CHIOMA_RINASCITA = 0.8;

// Giorno di riposo (sezione 7.2): ogni 7 giorni di fila se ne guadagna uno (se ne tiene uno solo alla
// volta, così protegge la serie al massimo una volta a settimana). Se si salta un giorno, il giorno di
// riposo lo copre da solo: la serie non si dimezza.
export const RIPOSI_MASSIMI = 1;

// Sfida della settimana (sezione 7.1): ogni stagione di gioco (una settimana vera) un obiettivo da
// raggiungere a poco a poco, scelto tra quelli sempre possibili in quella stagione. Si sceglie la prima
// volta che si apre il gioco nella stagione, con un obiettivo che si fa in tempo a raggiungere nei giorni
// che restano. Completata, dà SEMI.settimana. n: l'obiettivo (singolare e plurale per i testi).
const SFIDE_SETTIMANA = {
  cure: (n) => n === 1 ? 'Cura il giardino anche oggi' : `Cura il giardino ${n} giorni`,
  pota: (n) => n === 1 ? 'Pota un germoglio dell\'acero' : `Pota ${n} germogli dell'acero`,
  candele: (n) => n === 1 ? 'Cima una candela del pino' : `Cima ${n} candele del pino`,
  pizzica: (n) => n === 1 ? 'Pizzica una punta del ginepro' : `Pizzica ${n} punte del ginepro`,
  aghi: (n) => n === 1 ? 'Togli un ciuffo di aghi vecchi' : `Togli ${n} ciuffi di aghi vecchi`,
  filo: (n) => n === 1 ? 'Metti il filo a un ramo' : `Metti il filo a ${n} rami`,
  foto: (n) => n === 1 ? 'Fotografa una pianta per il diario' : `Fotografa ${n} piante per il diario`,
  rinvaso: (n) => n === 1 ? 'Rinvasa una pianta in tempo' : `Rinvasa ${n} piante in tempo`,
};
// per stagione, in ordine: il primo anno arrivano le più semplici, poi si alternano
const SETTIMANE = [['cure', 'candele', 'pota'], ['pota', 'pizzica', 'foto'], ['aghi', 'foto', 'cure'], ['filo', 'cure']];
// la potatura di ogni pianta, per la sfida della settimana
const POTA_SETTIMANA = { acero: 'pota', pino: 'candele', ginepro: 'pizzica' };

// Attrezzi (sezione 7.3): si comprano una volta e servono per sempre. Aiutano a curare meglio, non
// fanno saltare l'attesa.
export const ATTREZZI = [
  { id: 'bastoncino', nome: 'Bastoncino di bambù', prezzo: 150, effetto: 'Dice quando annaffiare',
    descrizione: 'Infilato nel terriccio, resta scuro finché è umido: sull\'etichetta di ogni pianta vedi fra quanto annaffiarla.' },
  { id: 'tronchesino', nome: 'Tronchesino per filo', prezzo: 200, effetto: 'Filo senza segni',
    descrizione: 'Taglia il filo a pezzetti invece di svolgerlo: i segni sulla corteccia spariscono il doppio più in fretta, e il filo tolto con un po\' di ritardo vale ancora il premio.' },
  { id: 'forbici', nome: 'Forbici concave', prezzo: 250, effetto: 'Gemme più rapide',
    descrizione: 'Lasciano un taglio pulito e un po\' incavato che si chiude presto: dopo la potatura le gemme dell\'acero crescono più in fretta.' },
  { id: 'lente', nome: 'Lente del giardiniere', prezzo: 180, effetto: 'Malattie viste prima',
    descrizione: 'Guardando da vicino foglie e aghi, afidi e malattie si notano al primo segno: l\'avviso arriva in metà del tempo, quando sono ancora facili da curare.' },
];
// Ampliamento del giardino (sezione 8.5): il prato dell'isola si allarga tutto intorno, in tre passi a
// prezzo crescente, e c'è più posto per piante e decorazioni. crescita: di quanto si allarga il raggio
// dell'isola (che all'inizio è RAGGIO_ISOLA); dietro la staccionata non cambia niente.
export const RAGGIO_ISOLA = 5.3;
export const AMPLIAMENTI = [
  { prezzo: 600, crescita: .6 },
  { prezzo: 1000, crescita: .6 },
  { prezzo: 1600, crescita: .6 },
];
// di quanto è cresciuto il raggio dell'isola con n ampliamenti
const crescitaIsola = (n) => AMPLIAMENTI.slice(0, n).reduce((t, a) => t + a.crescita, 0);
const ampliamentiDi = (stato) => stato.giardino?.ampliamenti ?? 0;

const FORBICI_GEMME = 1.4;            // con le forbici concave le gemme crescono così più in fretta
const TRONCHESINO_SEGNO = 0.2;         // col tronchesino il premio del filo vale anche con un segno leggero
const ha = (stato, id) => (stato.attrezzi ?? []).includes(id);

// Sfida del giorno (sezione 7.1): sempre fattibile. Si sceglie la prima volta che si apre il gioco
// in quel giorno, guardando la pianta in quel momento: annaffiare se il terriccio è asciutto,
// altrimenti potare un germoglio (ogni giorno ne spunta uno); in inverno, a giorni alterni,
// mettere il filo, l'azione tipica della stagione (sezione 4.1).
export const SFIDE = { acqua: 'Annaffia l\'acero', pota: 'Pota un germoglio', filo: 'Metti il filo a un ramo', concime: 'Concima l\'acero' };
// sfide di potatura delle conifere, con la tecnica giusta per ognuna
const SFIDE_POTA = { candele: 'Cima le candele del pino', aghi: 'Togli gli aghi vecchi del pino', pizzica: 'Pizzica il ginepro',
  fiori: 'Togli i fiori appassiti dell\'azalea', azalea: 'Pota i germogli dell\'azalea',
  ciliegine: 'Togli le ciliegine del ciliegio', ciliegio: 'Pota i germogli del ciliegio' };

// Vasi del mini-negozio (sezione 14.1): il primo c'è già, gli altri si comprano con i Semi.
// Prezzi nella fascia della sezione 7.3: con l'acqua di ogni giorno e il bonus della serie
// il primo vaso arriva in meno di una settimana, l'ultimo in circa un mese.
export const VASI = [
  { id: 'blu', nome: 'Ovale blu smaltato', prezzo: 0 },
  { id: 'terracotta', nome: 'Tondo in terracotta', prezzo: 80 },
  { id: 'rettangolare', nome: 'Rettangolare in grès', prezzo: 120 },
  { id: 'celadon', nome: 'Ovale celadon', prezzo: 180 },
  { id: 'nuvola', nome: 'Crema con piedini a nuvola', prezzo: 250 },
  { id: 'rosso', nome: 'Ovale rosso smaltato', prezzo: 160 },
  { id: 'nero', nome: 'Esagonale nero', prezzo: 220 },
  // i vasi di partenza di pino, ginepro e azalea: ci sono già, gratis
  { id: 'cotto', nome: 'Tondo in cotto', prezzo: 0 },
  { id: 'bruno-rett', nome: 'Rettangolare bruno', prezzo: 0 },
  { id: 'bruno', nome: 'Tondo bruno', prezzo: 0 },
  { id: 'grigio', nome: 'Ovale grigio', prezzo: 0 },
];
// Ogni vaso comprato va bene per tutte le piante (la scena lo fa nella misura giusta); ognuna ha il suo.
// Il vaso di ogni pianta all'inizio:
export const VASI_INIZIALI = { acero: 'blu', pino: 'cotto', ginepro: 'bruno-rett', azalea: 'bruno', ciliegio: 'grigio' };
const vasiGratis = () => VASI.filter(v => !v.prezzo).map(v => v.id);
// il vaso di una pianta adesso (per l'acero è vasi.scelto, come nei salvataggi vecchi)
const vasoDi = (stato, p) => p === 'acero' ? stato.vasi.scelto : stato.vasi.piante?.[p] ?? VASI_INIZIALI[p];

// Decorazioni del giardino (sezione 8.2): ognuna si mette dove si vuole sul prato e si gira, così ogni
// giardino è diverso. posto: dove va appena comprata ([x, z, rotazione], coordinate dell'isola);
// raggio: il suo ingombro, per non sovrapporla alle piante e alle altre decorazioni.
export const DECORAZIONI = [
  { id: 'pietre', nome: 'Pietre impilate', prezzo: 50, raggio: .4, posto: [2.4, 4.45, .4], descrizione: 'Tre sassi tondi in equilibrio, vicino al sentiero.' },
  { id: 'panchina', nome: 'Panchina di legno', prezzo: 90, raggio: .65, posto: [-3.3, -2.85, .99], descrizione: 'Per sedersi a guardare la ghiaia rastrellata.' },
  { id: 'fontana', nome: 'Fontana di bambù', prezzo: 120, raggio: .7, posto: [-3.55, 1.75, .25], descrizione: 'Il bambù si riempie d\'acqua, si inclina e batte sulla pietra: toc.' },
  { id: 'gatto', nome: 'Gatto che dorme', prezzo: 150, raggio: .45, posto: [3.3, 3.05, -.6], descrizione: 'Un gatto rosso acciambellato al sole, accanto al pino.' },
  { id: 'ponte', nome: 'Ponticello rosso', prezzo: 200, raggio: 1, posto: [-2.3, 3.45, 0], sullAcqua: true, descrizione: 'Un ponte ad arco laccato sopra il laghetto delle carpe.' },
  // le decorazioni arrivate dopo (sezione 8.2): dalla più piccola alla più grande
  { id: 'rana', nome: 'Rana di pietra', prezzo: 60, raggio: .3, posto: [-.6, 5.2, .5], descrizione: 'Una ranocchia di pietra col muschio sulla schiena. In giapponese "kaeru" vuol dire anche "tornare": porta a casa chi è lontano.' },
  { id: 'lanterna-carta', nome: 'Lanterna di carta', prezzo: 90, raggio: .4, posto: [-4.1, .3, .3], descrizione: 'Una lanterna rossa di carta appesa a una canna di bambù: dondola piano col vento e di sera si accende.' },
  { id: 'tsukubai', nome: 'Vasca tsukubai', prezzo: 110, raggio: .5, posto: [3.9, 1.2, -.4], descrizione: 'La bassa vasca di pietra dove ci si lava le mani prima della cerimonia del tè, col mestolo di bambù.' },
  { id: 'ombrellone', nome: 'Ombrellone del tè', prezzo: 140, raggio: .75, posto: [-3.4, -.6, .6], descrizione: 'Un grande ombrello rosso sopra una panca col telo: il posto per bere il tè all\'aperto.' },
  { id: 'torii', nome: 'Piccolo torii', prezzo: 220, raggio: .8, posto: [1.2, 6.2, 0], descrizione: 'Il portale rosso dei santuari, in piccolo: segna l\'ingresso del giardino.' },
  // le decorazioni dei momenti speciali (sezione 7.5): si comprano solo durante il loro evento
  { id: 'picnic', nome: 'Telo dell\'hanami', prezzo: 120, raggio: .6, posto: [.6, 2.9, .3], evento: 'hanami', descrizione: 'Un telo rosso sul prato, con la scatola del pranzo e le tazze del tè: per guardare i fiori seduti.' },
  { id: 'barattolo', nome: 'Barattolo di lucciole', prezzo: 100, raggio: .3, posto: [-1.2, 4.6, 0], evento: 'hotaru', descrizione: 'Un barattolo di vetro con qualche lucciola dentro, che si accende quando fa buio.' },
  { id: 'dango', nome: 'Dango della luna', prezzo: 110, raggio: .4, posto: [2.6, 4.2, -.4], evento: 'tsukimi', descrizione: 'Un vassoio di legno con la piramide di dolcetti di riso e un vaso di erba susuki, per la luna d\'autunno.' },
  { id: 'pupazzo', nome: 'Pupazzo di neve', prezzo: 80, raggio: .4, posto: [-2.9, 2.3, .4], evento: 'hatsuyuki', descrizione: 'Un yukidaruma: due palle di neve, un secchiello in testa e due rametti per sopracciglia. Non si scioglie mai.' },
  { id: 'pagoda', nome: 'Pagoda di pietra', prezzo: 260, raggio: .5, posto: [-1.6, -4.2, 0], descrizione: 'Una torre di pietra a cinque tetti, coperta di muschio: sembra lì da secoli.' },
];

// Momenti speciali delle stagioni (sezione 7.5): piccoli eventi di qualche giorno che arrivano col calendario
// di gioco, ogni anno. La prima volta che si apre il gioco durante un evento arriva un piccolo regalo in Semi,
// e nel negozio c'è una decorazione che si può comprare solo in quei giorni (poi resta per sempre; chi non ce
// la fa la ritrova l'anno dopo: niente fretta e niente senso di colpa). da, a: giorni della stagione.
// La prima neve non ha giorni fissi: comincia il primo giorno d'inverno in cui nevica e dura tre giorni.
export const EVENTI = [
  { id: 'hanami', nome: 'Hanami', sottotitolo: 'Guardare i fiori', stagione: 0, da: 3, a: 5, premio: 15, decorazione: 'picnic',
    testo: 'È il tempo dei fiori di ciliegio: in Giappone ci si siede sotto gli alberi in fiore, si mangia insieme e si guardano i petali che volano. Durano pochi giorni, e per questo sono così belli.' },
  { id: 'hotaru', nome: 'Hotaru', sottotitolo: 'La notte delle lucciole', stagione: 1, da: 3, a: 5, premio: 15, decorazione: 'barattolo',
    testo: 'Nelle sere d\'inizio estate le lucciole si accendono sopra l\'acqua e sul prato. Stasera, quando fa buio, il giardino ne è pieno.' },
  { id: 'tsukimi', nome: 'Tsukimi', sottotitolo: 'Guardare la luna', stagione: 2, da: 4, a: 6, premio: 15, decorazione: 'dango',
    testo: 'In autunno la luna piena è la più bella dell\'anno. Si prepara un vassoio di dolcetti di riso, i dango, con qualche spiga d\'erba, e la si guarda salire. Stasera è grande e dorata.' },
  { id: 'hatsuyuki', nome: 'Hatsuyuki', sottotitolo: 'La prima neve', stagione: 3, giorni: 3, premio: 20, decorazione: 'pupazzo',
    testo: 'È caduta la prima neve dell\'inverno. Il giardino è silenzioso e le piante dormono sotto una coperta bianca. È il momento giusto per un pupazzo di neve.' },
];

// Elementi del giardino (sezione 8.4): ci sono fin dall'inizio e si spostano come le decorazioni; si
// possono anche togliere e rimettere (gratis). posto: dove stanno all'inizio ([x, z], coordinate dell'isola); raggio: l'ingombro.
// grande: pesa come una pianta (lanterna e pietra col muschio); bordo: può stare sul bordo dell'isola
// (i cespugli); acqua: il laghetto (ci va sopra solo il ponticello); cerchi: i cerchi rastrellati
// intorno, quando sta nella ghiaia; f: il nome è femminile (per i messaggi).
const CESPUGLI = [[-4.25, -1.6, .6], [4.45, .3, .55], [-4.05, 4.6, .5], [3.85, 4.7, .55], [4.25, -3.3, .5], [-.9, 6.1, .45]];
const SENTIERO = [[1.3, 5.7], [1.0, 4.9], [1.45, 4.15], [1.1, 3.4]];
export const ELEMENTI = [
  { id: 'lanterna', nome: 'Lanterna di pietra', raggio: .6, posto: [3.3, -2.4], grande: true, cerchi: .55, f: true },
  { id: 'sasso', nome: 'Pietra col muschio', raggio: .55, posto: [.95, 1.05], grande: true, cerchi: .45, f: true },
  { id: 'laghetto', nome: 'Laghetto delle carpe', raggio: 1.2, posto: [-2.3, 3.45], acqua: true },
  ...CESPUGLI.map(([x, z, r], i) => ({ id: 'cespuglio-' + (i + 1), nome: i === 3 ? 'Cespuglio rosso' : 'Cespuglio', raggio: r, posto: [x, z], bordo: true })),
  ...SENTIERO.map(([x, z], i) => ({ id: 'sentiero-' + (i + 1), nome: 'Pietra del sentiero', raggio: .33, posto: [x, z], f: true })),
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
export const SETE_SPECIE = { acero: 1, pino: 0.28, ginepro: 0.33, azalea: 0.8, ciliegio: 0.9 };
const SETE_MASSIMA = 60;               // oltre non cambia più niente

// Troppa acqua (sezione 6.3): con il terriccio ancora umido si può annaffiare lo stesso, ma l'acqua in più
// ristagna nel vaso. Il ristagno si misura come la sete, in giorni di asciugatura della specie: finché c'è,
// il terriccio non si asciuga (prima deve andarsene l'acqua in più). Così le conifere, che asciugano piano,
// restano fradice molto più a lungo dell'acero. Da 1 le foglie si afflosciano e la crescita rallenta;
// da 2 le radici cominciano a marcire: niente crescita e la chioma si dirada un po' (mai sotto RISTAGNO_SALUTE).
// Si guarisce saltando l'acqua finché il vaso si asciuga.
// annaffiando subito dopo l'ultima volta (meno se il terriccio era quasi asciutto): una volta di troppo lascia il
// terriccio fradicio, due afflosciano le foglie, tre fanno marcire le radici
const RISTAGNO_PER_ANNAFFIATURA = 0.8;
const RISTAGNO_MASSIMO = 3;
// l'acqua in più scola dai fori del vaso: anche nelle conifere se ne va in meno di una settimana
const SCOLO_MINIMO = 0.6;
export const FLOSCE_DA = 1, MARCIUME_DA = 2;
const RISTAGNO_SALUTE = 0.6;           // le radici fradice non diradano la chioma oltre questo punto
// ogni annaffiatura inutile costa subito un po' di chioma, sempre di più se si continua a sbagliare
// (4%, 8%, 12%, poi 15% ogni volta); il conto riparte con un'annaffiatura fatta al momento giusto.
// La chioma non scende mai sotto SALUTE_MINIMA: la pianta non muore.
const PERDITA_PER_ECCESSO = 0.04, PERDITA_ECCESSO_MASSIMA = 0.15;
const SALUTE_MINIMA = 0.2;             // tronco, rami principali e una gemma restano sempre
const PERDITA_AL_GIORNO = 0.08;        // quanto in fretta la chioma si dirada sotto stress
const RIPRESA_AL_GIORNO = 0.15;        // da quasi spoglia a piena in 5-6 giorni di cure
// le conifere perdono e rifanno la chioma alla metà del ritmo dell'acero: aghi e squame durano anni
const RITMO_CHIOMA = { acero: 1, pino: 0.5, ginepro: 0.5, azalea: 0.7, ciliegio: 0.9 };

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
export const RAMI_SPECIE = { acero: RAMI, pino: 5, ginepro: 4, azalea: 4, ciliegio: 4 };
const PRESA_AL_GIORNO = 0.25;          // in estate: il ramo prende la forma in 4 giorni (più in fretta in primavera)
// il legno delle conifere è più duro e cresce più piano: il filo ci mette il doppio (o quasi) a fare presa
const PRESA_SPECIE = { acero: 1, pino: 0.5, ginepro: 0.6, azalea: 0.8, ciliegio: 0.9 };

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
const DURATA_PROTEZIONE = 7;
const TONICO_RIPRESA = 2;              // col tonico alle alghe la chioma si riprende il doppio più in fretta
const MUSCHIO_SETE = 0.85;             // col muschio sul terriccio il vaso asciuga più piano           // giorni in cui l'olio di neem tiene lontani i parassiti
export const POSTI_PARASSITI = 5;      // cuscinetti della chioma dove possono comparire (li sceglie la scena)
const PROBABILITA_PARASSITI = [0.12, 0.12, 0.06, 0]; // al giorno: primavera, estate, autunno, inverno
const PROBABILITA_CONIFERE = 0.6;      // le conifere, robuste e sempre ben curate, ne prendono meno

// Malattie (sezione 6.6): ogni pianta ha la sua, un fungo che arriva nella sua stagione, il doppio delle volte
// quando trova le condizioni giuste (l'umidità dopo la pioggia o col terriccio zuppo; per l'oidio dell'acero
// la chioma fitta, con due o più germogli lunghi da potare). Al massimo una alla volta per pianta, insieme o
// no agli afidi. È più lenta degli afidi: per un giorno i segni sono piccoli e si vedono solo da vicino (o con
// la lente), poi arriva l'avviso; curata entro tre giorni dà Semi. Dopo rallenta la crescita e dirada la
// chioma, mai sotto il 60%: la pianta non muore. Si cura col rimedio specifico (che poi la tiene lontana per
// una stagione) o col bicarbonato, per tutte; il macerato di equiseto non cura ma previene.
export const MALATTIE = {
  acero: { id: 'oidio', nome: 'Oidio', breve: 'Ha l\'oidio', segni: 'una polvere bianca sulle foglie', stagioni: [0.05, 0.08, 0.02, 0], causa: 'fitta',
    descrizione: 'Il mal bianco: un fungo che copre le foglie di una polvere bianca, come farina. Arriva col caldo umido e l\'aria ferma, quando la chioma è troppo fitta.' },
  pino: { id: 'ruggine-pino', nome: 'Ruggine degli aghi', breve: 'Ha la ruggine', segni: 'puntini arancioni sugli aghi', stagioni: [0.04, 0.02, 0.05, 0], causa: 'umido',
    descrizione: 'Un fungo che fa piccole pustole arancioni sugli aghi, che poi ingialliscono. Arriva nelle settimane umide di primavera e d\'autunno.' },
  ginepro: { id: 'ruggine-ginepro', nome: 'Ruggine del ginepro', breve: 'Ha la ruggine', segni: 'galle arancioni tra le squame', stagioni: [0.08, 0, 0.02, 0], causa: 'umido',
    descrizione: 'Dopo le piogge di primavera, tra le squame spuntano galle arancioni e gelatinose, come piccole corna: sono le spore di un fungo.' },
  azalea: { id: 'galla', nome: 'Galla delle foglie', breve: 'Ha la galla', segni: 'foglie gonfie, bianco-rosa', stagioni: [0.06, 0.03, 0, 0], causa: 'umido',
    descrizione: 'Un fungo delle azalee: le foglie nuove si gonfiano, carnose e bianco-rosa. Arriva con l\'umidità, quando la pianta mette i germogli.' },
  ciliegio: { id: 'corineo', nome: 'Corineo', breve: 'Ha il corineo', segni: 'macchie rosso-brune sulle foglie', stagioni: [0.05, 0.02, 0.05, 0], causa: 'umido',
    descrizione: 'Il fungo dei ciliegi: macchioline rosso-brune sulle foglie, che poi seccano e lasciano dei buchini, come impallinate. Ama le piogge.' },
};
const ORE_MALATTIA_NASCOSTA = 24;      // prima dell'avviso: si scopre da vicino
const ORE_MALATTIA_IN_TEMPO = 72;      // curata entro tre giorni: nessun danno e Semi
const DANNO_MALATTIA = 0.04;           // chioma persa al giorno, dopo i tre giorni
const SALUTE_CON_MALATTIA = 0.6;       // da sola non la dirada oltre il 60%
const VIGORE_MALATA = 0.7;             // e la pianta cresce un po' meno
const UMIDO_ORE = 48;                  // per due giorni dopo la pioggia l'aria resta umida

// Azalea Satsuki (sezione 5.4): la quarta pianta, da comprare coi Semi. Vuole il terriccio sempre un po'
// umido (asciuga poco meno dell'acero) e acido (kanuma). A fine primavera fiorisce; all'inizio dell'estate
// i fiori appassiscono e vanno tolti, uno per uno ("vecchi", come gli aghi del pino): se restano, la pianta
// spende le forze a fare semi e l'anno dopo fiorisce la metà. Dopo la fioritura mette germogli da potare
// (d'estate e all'inizio dell'autunno): più tardi si taglierebbero le gemme dei fiori dell'anno dopo.
export const PIANTE_NEGOZIO = [
  { id: 'azalea', nome: 'Azalea Satsuki', prezzo: 400,
    descrizione: 'A fine primavera si copre di fiori rosa. Vuole terriccio acido e sempre un po\' umido; i fiori appassiti si tolgono a mano.' },
  { id: 'ciliegio', nome: 'Ciliegio giapponese', prezzo: 500,
    descrizione: 'A inizio primavera si copre di fiori rosa chiaro, d\'autunno si fa arancio. Beve quasi quanto l\'acero; le ciliegine si tolgono a mano.' },
];
export const POSTO_AZALEA = [3.4, -1.05];
// Ciliegio giapponese (sezione 5.5): la quinta pianta, da comprare coi Semi. Perde le foglie come l'acero e
// beve quasi quanto lui. All'inizio della primavera, prima delle foglie, si copre di fiori rosa chiaro che in
// pochi giorni perdono i petali; all'inizio dell'estate fa le ciliegine, che vanno tolte (come i fiori appassiti
// dell'azalea: se restano, l'anno dopo fiorisce la metà). Dopo la fioritura mette germogli da potare, fino
// all'inizio dell'autunno; d'inverno riposa spoglio.
export const POSTO_CILIEGIO = [-.4, 3.2];
// fioritura del ciliegio: boccioli il 1° giorno di primavera, fiori dal 2°, petali che cadono dal 5°
function fiorituraCiliegio({ stagione, giornoStagione: g }) {
  if (stagione !== 0) return { boccioli: 0, fiori: 0 };
  return { boccioli: g <= 2 ? 1 : 0, fiori: [0, 0, .5, 1, 1, .6, .25, 0][g] ?? 0 };
}      // dove sta sull'isola (la scena la mette lì)
const POSTI_SFIORITI = 8;                       // ciuffi della chioma dove possono esserci fiori appassiti
const SFIORITI_PER_FIORITURA = 6;
const POSTI_CILIEGINE = 8;                      // ciuffi del ciliegio dove possono pendere le ciliegine
const CILIEGINE_PER_FIORITURA = 6;
// fioritura dell'azalea con il calendario: boccioli dal 2° giorno di primavera, fiori aperti dal 4°,
// che appassiscono il primo giorno d'estate
function fiorituraDi({ stagione, giornoStagione: g }) {
  if (stagione === 0) return { boccioli: g >= 2 && g <= 4 ? Math.min(1, (g - 1) / 2) : 0, fiori: g >= 4 ? Math.min(1, (g - 3) / 2) : 0 };
  if (stagione === 1 && g === 1) return { boccioli: 0, fiori: 0.5 };
  return { boccioli: 0, fiori: 0 };
}

export const PIANTE = { acero: 'Acero giapponese', pino: 'Pino nero', ginepro: 'Ginepro', azalea: 'Azalea Satsuki', ciliegio: 'Ciliegio giapponese' };
// i prodotti per tutte le piante
const TUTTE = Object.keys(PIANTE);
// Prodotti di cura: alcuni specifici per una pianta (più efficaci), altri generali per tutte.
// tipo: 'concime' (spinta: crescita e ripresa) o 'trattamento' (toglie i parassiti; protezione: giorni senza)
export const DOSI_PER_CONFEZIONE = 3;
export const PRODOTTI = [
  { id: 'concime-acero', nome: 'Concime per aceri', tipo: 'concime', piante: ['acero'], spinta: 1.6, prezzo: 30,
    descrizione: 'Organico, ricco di ferro: foglie più vivaci e crescita forte.' },
  { id: 'concime-conifere', nome: 'Concime per conifere', tipo: 'concime', piante: ['pino', 'ginepro'], spinta: 1.6, prezzo: 30,
    descrizione: 'A lenta cessione, poco azoto: aghi corti e compatti.' },
  { id: 'concime-universale', nome: 'Concime universale', tipo: 'concime', piante: TUTTE, spinta: 1.3, prezzo: 20,
    descrizione: 'Va bene per tutti i bonsai, un po\' meno efficace.' },
  { id: 'sapone-molle', nome: 'Sapone molle', tipo: 'trattamento', piante: TUTTE, protezione: 0, prezzo: 20,
    descrizione: 'Spray delicato: toglie gli afidi.' },
  { id: 'olio-neem', nome: 'Olio di neem', tipo: 'trattamento', piante: TUTTE, protezione: DURATA_PROTEZIONE, prezzo: 35,
    descrizione: 'Toglie gli afidi e li tiene lontani per una stagione. Si può usare anche prima.' },
  { id: 'piretro', nome: 'Piretro naturale', tipo: 'trattamento', piante: TUTTE, protezione: 3, prezzo: 25,
    descrizione: 'Estratto dai fiori di crisantemo: toglie gli afidi e li tiene lontani per tre giorni.' },
  // concimi in più: liquido (veloce e breve) e per le azalee (acido)
  { id: 'concime-liquido', nome: 'Concime liquido', tipo: 'concime', piante: TUTTE, spinta: 1.8, giorni: 3, prezzo: 25,
    descrizione: "Si scioglie nell'acqua: fa effetto subito e forte, ma dura solo tre giorni." },
  { id: 'concime-azalee', nome: 'Concime per azalee', tipo: 'concime', piante: ['azalea'], spinta: 1.6, prezzo: 30,
    descrizione: 'Acido, con ferro e magnesio: foglie verdi e lucide e tanti boccioli.' },
  // tonico: aiuta la chioma a riprendersi, anche d'inverno
  { id: 'alghe', nome: 'Tonico alle alghe', tipo: 'tonico', piante: TUTTE, giorni: 7, prezzo: 35,
    descrizione: "Estratto di alghe marine: per una stagione la chioma diradata si riprende il doppio più in fretta. Va bene anche d'inverno." },
  // muschio: copre il terriccio fino al rinvaso, è bello e trattiene l'umidità
  { id: 'muschio', nome: 'Muschio per il vaso', tipo: 'muschio', piante: TUTTE, prezzo: 20,
    descrizione: "Un tappeto verde sul terriccio: trattiene l'umidità, così il vaso asciuga un po' più piano. Resta fino al rinvaso." },
  // contro le malattie (sezione 6.6): un rimedio specifico per ogni pianta, che cura la sua malattia e poi la
  // tiene lontana per una stagione; il bicarbonato cura tutte senza proteggere; l'equiseto previene soltanto
  { id: 'zolfo', nome: 'Zolfo bagnabile', tipo: 'fungicida', piante: ['acero'], malattie: ['oidio'], protezione: DURATA_PROTEZIONE, prezzo: 30,
    descrizione: "Il rimedio antico contro l'oidio dell'acero: lo cura e lo tiene lontano per una stagione." },
  { id: 'rame', nome: 'Ossicloruro di rame', tipo: 'fungicida', piante: ['pino', 'ginepro'], malattie: ['ruggine-pino', 'ruggine-ginepro'], protezione: DURATA_PROTEZIONE, prezzo: 30,
    descrizione: 'Polvere azzurra da sciogliere in acqua: cura la ruggine di pino e ginepro e la tiene lontana per una stagione.' },
  { id: 'propoli', nome: 'Spray alla propoli', tipo: 'fungicida', piante: ['azalea'], malattie: ['galla'], protezione: DURATA_PROTEZIONE, prezzo: 30,
    descrizione: "La resina delle api, delicata sui fiori: cura la galla dell'azalea e la tiene lontana per una stagione." },
  { id: 'poltiglia', nome: 'Poltiglia bordolese', tipo: 'fungicida', piante: ['ciliegio'], malattie: ['corineo'], protezione: DURATA_PROTEZIONE, prezzo: 30,
    descrizione: 'Rame e calce, la cura classica degli alberi da frutto: guarisce il corineo del ciliegio e lo tiene lontano per una stagione.' },
  { id: 'bicarbonato', nome: 'Bicarbonato di potassio', tipo: 'fungicida', piante: TUTTE, protezione: 0, prezzo: 20,
    descrizione: 'Cura la malattia di ogni pianta, ma non la tiene lontana: va bene per le emergenze.' },
  { id: 'equiseto', nome: 'Macerato di equiseto', tipo: 'fungicida', piante: TUTTE, cura: false, protezione: 5, prezzo: 25,
    descrizione: 'Rinforza foglie e aghi: per cinque giorni le malattie non attaccano. Non cura quelle già arrivate.' },
  // concime e tonici specifici
  { id: 'concime-ciliegio', nome: 'Concime per alberi da fiore', tipo: 'concime', piante: ['ciliegio'], spinta: 1.6, prezzo: 30,
    descrizione: 'Con potassio e fosforo: rami robusti e boccioli pieni per la primavera.' },
  { id: 'chelato', nome: 'Chelato di ferro', tipo: 'tonico', piante: ['acero', 'azalea', 'ciliegio'], giorni: 7, ripresa: 2.5, prezzo: 40,
    descrizione: 'Ferro che le radici assorbono subito: foglie di nuovo verdi e chioma che si riprende due volte e mezzo più in fretta, per una stagione.' },
  { id: 'ortica', nome: 'Macerato di ortica', tipo: 'tonico', piante: ['pino', 'ginepro'], giorni: 7, ripresa: 2.5, prezzo: 35,
    descrizione: 'Ricco di azoto e minerali: aghi e squame si rifanno due volte e mezzo più in fretta, per una stagione.' },
  // terricci per il rinvaso: durata = anni di gioco prima del rinvaso successivo, per specie
  { id: 'akadama', nome: 'Akadama', tipo: 'terriccio', piante: TUTTE, durata: { acero: 1, pino: 2, ginepro: 2, azalea: 1, ciliegio: 1 }, prezzo: 25,
    descrizione: 'Argilla giapponese in granuli: drena e trattiene il giusto. Va bene per tutti i bonsai.' },
  { id: 'kanuma', nome: 'Kanuma', tipo: 'terriccio', piante: ['azalea'], durata: { azalea: 3 }, prezzo: 30,
    descrizione: 'Pomice giallo-chiara e acida, leggera e piena d\'aria: il terriccio giusto per l\'azalea, che ci sta bene a lungo.' },
  { id: 'kiryu', nome: 'Kiryu', tipo: 'terriccio', piante: ['pino', 'ginepro', 'azalea'], durata: { pino: 3, ginepro: 3, azalea: 2 }, prezzo: 30,
    descrizione: 'Sabbia vulcanica gialla e dura, che non si sbriciola: piace a pino, ginepro e azalea.' },
  { id: 'miscela-conifere', nome: 'Miscela per conifere', tipo: 'terriccio', piante: ['pino', 'ginepro'], durata: { pino: 3, ginepro: 3 }, prezzo: 35,
    descrizione: 'Akadama, pomice e lapillo: molto drenante, le radici delle conifere ci stanno bene più a lungo.' },
];
// il kit con cui si comincia
const INVENTARIO_INIZIALE = { 'concime-universale': 2, 'sapone-molle': 2, bicarbonato: 1, akadama: 1 };

// Rinvaso (sezione 4.4): si fa tra la fine dell'inverno (dal 4° giorno) e l'inizio della primavera
// (fino al 3° giorno), quando le gemme si gonfiano. L'acero giovane ogni anno, le conifere ogni 2
// (3 con la miscela per conifere). "primavera" è l'anno della primavera che quella finestra apre.
// Se si salta la finestra il vaso resta stretto fino alla successiva: la pianta beve di più e cresce meno.
const SETE_VASO_STRETTO = 1.25, VIGORE_VASO_STRETTO = 0.8;

// Stile (sezione 5.2): i ciuffi della chioma tagliati con la forbice ricrescono piano nella stagione di
// crescita (circa 3 settimane d'estate sull'acero, il doppio sulle conifere): la forma va mantenuta.
const RICRESCITA_CIUFFO = 0.05;        // al giorno, con il vigore della pianta
const stileNuovo = (p) => ({ stile: { id: STILE_INIZIALE[p], sigilli: [] }, tagli: {} });
const DURATA_RINVASO = { acero: 1, pino: 2, ginepro: 2, azalea: 2, ciliegio: 2 };
// anno della primavera della finestra di rinvaso aperta adesso, oppure null
function finestraRinvaso({ anno, stagione, giornoStagione }) {
  if (stagione === 3 && giornoStagione >= 4) return anno + 1;
  if (stagione === 0 && giornoStagione <= 3) return anno;
  return null;
}
// anno dell'ultima primavera cominciata (o che sta per cominciare, a fine inverno)
const primaveraDi = ({ anno, stagione, giornoStagione }) => stagione === 3 && giornoStagione >= 4 ? anno + 1 : anno;
const rinvasoDovuto = (c, cal) => primaveraDi(cal) >= c.rinvaso.primavera + c.rinvaso.durata;
const vasoStretto = (c, cal) => rinvasoDovuto(c, cal) && finestraRinvaso(cal) === null;
const ORE_NASCOSTI = 12;               // prima dell'avviso: si scoprono solo guardando da vicino
const ORE_IN_TEMPO = 24;               // trattati entro un giorno: nessun danno e Semi
const DANNO_PARASSITI = 0.06;          // chioma persa al giorno, dopo il primo giorno
const SALUTE_CON_PARASSITI = 0.5;      // i parassiti da soli non la diradano oltre la metà

// numero tra 0 e 1 sempre uguale per la stessa partita e lo stesso giorno: i test si ripetono
// Meteo (sezione 3.4): ogni giorno del calendario del telefono può essere sereno, di pioggia o (in inverno)
// di neve, per qualche ora. Si decide con il caso prevedibile, diverso per ogni partita. La pioggia annaffia
// davvero tutte le piante, senza troppa acqua (i vasi hanno i fori); la neve copre i vasi: finché nevica il
// terriccio non si asciuga. Il meteo segue i giorni e le ore reali, come l'acqua.
const PIOGGIA_STAGIONE = [0.3, 0.15, 0.3, 0.25]; // probabilità di un giorno di pioggia (in inverno: neve)
const TEMPORALI = 0.4;                           // d'estate, quanti giorni di pioggia sono temporali
// neve a terra (0..1): si posa in qualche ora e si scioglie in un paio di giorni d'inverno, subito dopo;
// pozzanghere (0..1): si formano sotto la pioggia e si asciugano in mezza giornata (prima d'estate)
const NEVE_SI_POSA = 0.3, NEVE_SI_SCIOGLIE = [0.25, 0.25, 0.25, 0.02];
const POZZE_SI_FORMANO = 0.6, POZZE_SI_ASCIUGANO = [0.1, 0.2, 0.1, 0.1];
const PIOGGIA_ALL_ORA = 4;                       // giorni di sete che la pioggia toglie in un'ora: in un'ora il vaso è bagnato
export function meteoDelGiorno(stato, t) {
  if (!stato.meteo?.attivo) return { tipo: 'sereno', da: 0, a: 0 };
  const seme = stato.inizio + ':meteo:' + giornoLocale(t), { stagione } = calendario(stato.inizio, t);
  if (caso(seme) >= PIOGGIA_STAGIONE[stagione]) return { tipo: 'sereno', da: 0, a: 0 };
  const da = 6 + Math.floor(caso(seme + ':da') * 13);
  return { tipo: stagione === 3 ? 'neve' : 'pioggia', da, a: Math.min(24, da + 2 + Math.floor(caso(seme + ':durata') * 4)),
    // d'estate la pioggia può arrivare con lampi e tuoni (annaffia come la pioggia)
    temporale: stagione === 1 && caso(seme + ':temporale') < TEMPORALI };
}
const oraDelGiorno = (t) => { const d = new Date(t); return d.getHours() + d.getMinutes() / 60; };
// cosa sta cadendo all'ora t: 'pioggia', 'neve' o null
export function cadeAlle(stato, t) {
  const m = meteoDelGiorno(stato, t), h = oraDelGiorno(t);
  return m.tipo !== 'sereno' && h >= m.da && h < m.a ? m.tipo : null;
}

function caso(testo) {
  let h = 2166136261;
  for (let i = 0; i < testo.length; i++) h = Math.imul(h ^ testo.charCodeAt(i), 16777619);
  h = Math.imul(h ^ h >>> 15, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909);
  return ((h ^ h >>> 16) >>> 0) / 4294967296;
}
const concimeAttivo = (a, t) => !!a.concime && t < a.concime.fino;
// il tonico alle alghe: la chioma si riprende il doppio più in fretta
const tonicoAttivo = (a, t) => !!a.tonico && t < a.tonico.fino;
const tonico = (a, t) => tonicoAttivo(a, t) ? a.tonico.ripresa ?? TONICO_RIPRESA : 1;
const spinta = (a, t) => concimeAttivo(a, t) ? a.concime.spinta ?? 1.5 : 1;
const protetta = (a, t) => !!a.protezione && t < a.protezione.fino;
const curaNuova = () => ({ concime: null, parassiti: null, protezione: null, malattia: null, difesa: null });
// malattie: difesa attiva (rimedio specifico o equiseto), ore dall'arrivo, se fa già danno
const difesa = (a, t) => !!a.difesa && t < a.difesa.fino;
const oreMalattia = (a, t) => a.malattia ? (t - a.malattia.da) / ORA : 0;
const malata = (a, t) => oreMalattia(a, t) > ORE_MALATTIA_IN_TEMPO;
// con la lente afidi e malattie si notano in metà del tempo
const lente = (stato) => ha(stato, 'lente') ? 0.5 : 1;
// pino e ginepro: cura e acqua (si comincia con il terriccio ancora un po' umido)
const coniferaNuova = (p) => ({ ...curaNuova(), sete: 0.3, ristagno: 0, avvisatoUmido: false, ultimaAcqua: null, salute: 1, ...potaturaConifera(p), rinvaso: { primavera: 1, durata: DURATA_RINVASO[p], stretto: false }, ...stileNuovo(p) });
// germogli (candele o punte), aghi vecchi e rami da legare di una conifera
function potaturaConifera(p) {
  return { germogli: [], contatore: 0, vecchi: [], rami: Array.from({ length: RAMI_SPECIE[p] }, () => ({ piega: 0, filo: null, segno: 0 })) };
}
// la parte di stato che riguarda la cura di una pianta (per l'acero è l'albero stesso)
const curaDi = (stato, pianta) => pianta === 'acero' ? stato.albero : stato.conifere[pianta];
// le piante che ci sono nel giardino (l'azalea solo dopo averla comprata), e quelle oltre l'acero
const presenti = (stato) => Object.keys(PIANTE).filter(p => curaDi(stato, p));
const altre = (stato) => Object.keys(stato.conifere);
const oreParassiti = (a, t) => a.parassiti ? (t - a.parassiti.da) / ORA : 0;

export function nuovoStato(ora) {
  return {
    versione: VERSIONE,
    inizio: ora,
    aggiornato: ora,
    semi: SEMI.iniziali,
    // si comincia con la pianta un po' assetata: la prima azione è annaffiarla
    albero: { sete: 1, ristagno: 0, avvisatoUmido: false, salute: 1, ultimaAcqua: null, ...alberoGiovane(), rinvaso: { primavera: 1, durata: DURATA_RINVASO.acero, stretto: false }, ...stileNuovo('acero') },
    // serie di giorni con una cura; riposi: giorni di riposo pronti (sezione 7.2)
    serie: { giorni: 0, ultimoGiorno: null, interrotta: false, riposi: 0 },
    // sfida della settimana (la sceglie avanza)
    settimana: null,
    // attrezzi comprati
    attrezzi: [],
    // quante volte si è allargato il prato dell'isola
    giardino: { ampliamenti: 0 },
    // momenti speciali già festeggiati ("hanami-2": l'hanami del secondo anno)
    eventi: { festeggiati: [] },
    // premi dei momenti belli delle piante già dati ("acero-colori-2"), e la sfida di rinascita (o null)
    premiStagione: [],
    rinascita: null,
    // vasi comprati, quello dell'acero (scelto) e quello delle altre piante
    vasi: { posseduti: vasiGratis(), scelto: VASI[0].id, piante: { pino: 'cotto', ginepro: 'bruno-rett', azalea: 'bruno', ciliegio: 'grigio' } },
    // decorazioni comprate e quelle messe nel giardino
    // decorazioni comprate, quelle messe nel giardino e dove sono ({ x, z, r })
    decorazioni: { possedute: [], messe: [], posti: {} },
    // dove il giocatore ha spostato le piante ({ x, z, r }); quelle mai spostate stanno al loro posto
    piantePosti: {},
    // dove il giocatore ha spostato gli elementi del giardino (lanterna, laghetto, cespugli...)
    elementiPosti: {},
    // gli elementi che il giocatore ha tolto dal giardino (si rimettono dal negozio)
    elementiTolti: [],
    // pino e ginepro: per ora si curano solo con concimi e trattamenti
    conifere: { pino: coniferaNuova('pino'), ginepro: coniferaNuova('ginepro') },
    inventario: { ...INVENTARIO_INIZIALE },
    // la guida dei primi passi si mostra una volta sola, alla prima partita
    guida: { fatta: false },
    // consigli del maestro già letti (gioco/maestro.js)
    maestro: { visti: [] },
    // meteo (sezione 3.4): attivo (i test lo spengono per avere la sete prevedibile) e l'ultima pioggia
    meteo: { attivo: true, ultimaPioggia: null, neve: 0, pozze: 0 },
    // diario fotografico: per ogni pianta la stagione dell'ultima foto premiata ("anno-stagione")
    diario: {},
    // si comincia annaffiando, perché la pianta ha già sete
    oggi: { giorno: giornoLocale(ora), acqua: false, sfida: { tipo: 'acqua', fatta: false } },
    // quaderno del maestro (sezione 7.6): pagine aperte e quelle non ancora lette
    quaderno: { pagine: [], nuove: [] },
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
  // anche le conifere hanno la chioma che si dirada e si riprende
  if (stato.versione === 10) {
    for (const p of ['pino', 'ginepro']) stato.conifere[p].salute = 1;
    stato.versione = 11;
  }
  // rinvaso: si conta come appena rinvasate all'ultima primavera, e nel kit arriva un po' di akadama
  if (stato.versione === 11) {
    const primavera = primaveraDi(calendario(stato.inizio, stato.aggiornato));
    stato.albero.rinvaso = { primavera, durata: DURATA_RINVASO.acero, stretto: false };
    for (const p of ['pino', 'ginepro']) stato.conifere[p].rinvaso = { primavera, durata: DURATA_RINVASO[p], stretto: false };
    stato.inventario.akadama = (stato.inventario.akadama ?? 0) + 1;
    stato.versione = 12;
  }
  // stili: lo stile adatto alla pianta, nessun ciuffo tagliato
  if (stato.versione === 12) {
    Object.assign(stato.albero, stileNuovo('acero'));
    for (const p of ['pino', 'ginepro']) Object.assign(stato.conifere[p], stileNuovo(p));
    stato.versione = 13;
  }
  // troppa acqua: nessun vaso fradicio
  if (stato.versione === 13) {
    stato.albero.ristagno = 0;
    for (const p of ['pino', 'ginepro']) stato.conifere[p].ristagno = 0;
    stato.versione = 14;
  }
  // diario fotografico: nessuna foto ancora
  if (stato.versione === 14) { stato.diario = {}; stato.versione = 15; }
  // decorazioni: nessuna ancora
  if (stato.versione === 15) { stato.decorazioni = { possedute: [], messe: [] }; stato.versione = 16; }
  // decorazioni spostabili: quelle già comprate restano nel posto dove erano
  if (stato.versione === 16) {
    stato.decorazioni.posti = Object.fromEntries(stato.decorazioni.possedute.map(id => {
      const [x, z, r] = DECORAZIONI.find(d => d.id === id).posto; return [id, { x, z, r }];
    }));
    stato.versione = 17;
  }
  // consigli del maestro: nessuno ancora letto, così arriva subito quello della stagione
  if (stato.versione === 17) { stato.maestro = { visti: [] }; stato.versione = 18; }
  // meteo: da adesso può piovere e nevicare
  if (stato.versione === 18) { stato.meteo = { attivo: true, ultimaPioggia: null }; stato.versione = 19; }
  // neve a terra e pozzanghere: per ora niente
  if (stato.versione === 19) { Object.assign(stato.meteo, { neve: 0, pozze: 0 }); stato.versione = 20; }
  // piante spostabili: per ora tutte al loro posto
  if (stato.versione === 20) { stato.piantePosti = {}; stato.versione = 21; }
  // elementi del giardino spostabili: per ora tutti al loro posto
  if (stato.versione === 21) { stato.elementiPosti = {}; stato.elementiTolti = []; stato.versione = 22; }
  // giorni di riposo, sfida della settimana e attrezzi: niente ancora
  if (stato.versione === 22) { stato.serie.riposi = 0; stato.settimana = null; stato.attrezzi = []; stato.versione = 23; }
  // ampliamenti del giardino: l'isola com'era
  if (stato.versione === 23) { stato.giardino = { ampliamenti: 0 }; stato.versione = 24; }
  // vasi per tutte le piante: ognuna col vaso che aveva, e i vasi di partenza già posseduti
  if (stato.versione === 24) {
    stato.vasi.posseduti = [...new Set([...stato.vasi.posseduti, ...vasiGratis()])];
    stato.vasi.piante = { pino: 'cotto', ginepro: 'bruno-rett', azalea: 'bruno' };
    stato.versione = 25;
  }
  // ciliegio in vendita: il suo vaso di partenza è già tuo
  if (stato.versione === 25) {
    stato.vasi.posseduti = [...new Set([...stato.vasi.posseduti, ...vasiGratis()])];
    stato.vasi.piante = { ...stato.vasi.piante, ciliegio: 'grigio' };
    stato.versione = 26;
  }
  // momenti speciali: nessuno ancora festeggiato
  if (stato.versione === 26) { stato.eventi = { festeggiati: [] }; stato.versione = 27; }
  // premi della fioritura e dei colori d'autunno, sfida di rinascita: niente ancora
  if (stato.versione === 27) { stato.premiStagione = []; stato.rinascita = null; stato.versione = 28; }
  // malattie: nessuna ancora, e un bicarbonato nel kit per la prima
  if (stato.versione === 28) {
    for (const c of [stato.albero, ...Object.values(stato.conifere)]) Object.assign(c, { malattia: null, difesa: null });
    stato.inventario.bicarbonato = (stato.inventario.bicarbonato ?? 0) + 1;
    stato.versione = 29;
  }
  // quaderno del maestro: si aprono le pagine di quello che il giocatore ha già fatto
  // (il resto lo apre avanza: piante, stili, afidi, malattie...)
  if (stato.versione === 29) {
    stato.quaderno = { pagine: [], nuove: [] };
    const tutte = [stato.albero, ...Object.values(stato.conifere)];
    if (tutte.some(c => c.ultimaAcqua)) apriPagina(stato, 'acqua');
    if (stato.albero.gemme?.length) apriPagina(stato, 'potatura');
    if (tutte.some(c => c.rami?.some(r => r.filo || r.segno > 0))) apriPagina(stato, 'filo');
    if (tutte.some(c => c.muschio)) apriPagina(stato, 'muschio');
    stato.versione = 30;
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
  return vigore(stagione, a.sete) * fradicio(a) * spinta(a, t) * (oreParassiti(a, t) > ORE_IN_TEMPO ? 0.5 : 1) * (malata(a, t) ? VIGORE_MALATA : 1) * (a.rinvaso?.stretto ? VIGORE_VASO_STRETTO : 1);
}

// con le radici fradice la pianta cresce meno (foglie flosce) o niente (radici che marciscono)
const fradicio = (a) => (a.ristagno ?? 0) < FLOSCE_DA ? 1 : a.ristagno < MARCIUME_DA ? 0.5 : 0;
// fin dove può arrivare la chioma con le radici fradice: scende piano oltre il marciume
const saluteRistagno = (r) => r <= MARCIUME_DA ? 1 : Math.max(RISTAGNO_SALUTE, 1 - (r - MARCIUME_DA) * 0.4);
// la terra si asciuga: prima scola l'acqua in più (scolo: quanta in questo passo), poi torna la sete
function asciuga(c, quanto, scolo) {
  const via = Math.min(c.ristagno, scolo);
  c.ristagno -= via;
  c.sete = Math.min(SETE_MASSIMA, c.sete + quanto * (1 - via / scolo));
}
const scoloSpecie = (p) => Math.max(SETE_SPECIE[p], SCOLO_MINIMO);

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
    const cal = calendario(stato.inizio, t + passo / 2), { stagione } = cal;
    // vaso stretto: le radici riempiono il vaso, la terra trattiene meno acqua
    for (const p of presenti(stato)) { const c = curaDi(stato, p); c.rinvaso.stretto = vasoStretto(c, cal); }
    const cade = cadeAlle(stato, t + passo / 2), ore = passo / ORA, mt = stato.meteo;
    // la neve si posa e si scioglie, le pozzanghere si formano e si asciugano
    mt.neve = cade === 'neve' ? Math.min(1, (mt.neve ?? 0) + ore * NEVE_SI_POSA) : Math.max(0, (mt.neve ?? 0) - ore * NEVE_SI_SCIOGLIE[stagione]);
    mt.pozze = cade === 'pioggia' ? Math.min(1, (mt.pozze ?? 0) + ore * POZZE_SI_FORMANO) : Math.max(0, (mt.pozze ?? 0) - ore * POZZE_SI_ASCIUGANO[stagione]);
    for (const p of presenti(stato)) {
      const c = curaDi(stato, p);
      const k = giorni * FATTORE_SETE[stagione] * (c.rinvaso.stretto ? SETE_VASO_STRETTO : 1);
      // sotto la neve il terriccio non si asciuga
      // il muschio sul terriccio trattiene l'umidità: il vaso asciuga un po' più piano
      if (cade !== 'neve') asciuga(c, k * SETE_SPECIE[p] * (c.muschio ? MUSCHIO_SETE : 1), k * scoloSpecie(p));
      // la pioggia annaffia: se la sfida era annaffiare questa pianta, se ne sceglie un'altra
      if (cade === 'pioggia' && c.sete > 0) {
        c.sete = Math.max(0, c.sete - giorni * 24 * PIOGGIA_ALL_ORA);
        stato.meteo.ultimaPioggia = t + passo;
        const s = stato.oggi.sfida;
        if (s && s.tipo === 'acqua' && !s.fatta && (s.pianta ?? 'acero') === p && c.sete < SETE_PER_ANNAFFIARE) stato.oggi.sfida = null;
      }
    }
    const max = Math.min(saluteMassima(a.sete), saluteRistagno(a.ristagno));
    if (a.salute > max) a.salute = Math.max(max, a.salute - giorni * PERDITA_AL_GIORNO);
    else if (a.sete < 2 && a.ristagno < FLOSCE_DA && oreParassiti(a, t) <= ORE_IN_TEMPO && !malata(a, t)) a.salute = Math.min(1, a.salute + giorni * RIPRESA_AL_GIORNO * spinta(a, t) * tonico(a, t));
    if (oreParassiti(a, t) > ORE_IN_TEMPO && a.salute > SALUTE_CON_PARASSITI) a.salute = Math.max(SALUTE_CON_PARASSITI, a.salute - giorni * DANNO_PARASSITI);
    if (malata(a, t) && a.salute > SALUTE_CON_MALATTIA) a.salute = Math.max(SALUTE_CON_MALATTIA, a.salute - giorni * DANNO_MALATTIA);
    const v = giorni * vigoreDi(a, stagione, t);
    for (const g of a.germogli) g.lunghezza = Math.min(1, g.lunghezza + v * CRESCITA_GERMOGLIO);
    for (const g of a.gemme) g.crescita = Math.min(1, g.crescita + v * CRESCITA_GEMMA * (ha(stato, 'forbici') ? FORBICI_GEMME : 1));
    const svanisce = ha(stato, 'tronchesino') ? 2 : 1;
    cresceFilo(a.rami, v * PRESA_AL_GIORNO, giorni, svanisce);
    ricresce(a.tagli, v * RICRESCITA_CIUFFO);
    for (const p of altre(stato)) {
      const c = stato.conifere[p], vc = giorni * vigoreDi(c, stagione, t), k = RITMO_CHIOMA[p];
      // chioma: come l'acero (sete lunga e afidi la diradano, le cure la rifanno), ma più lenta
      const maxC = Math.min(saluteMassima(c.sete), saluteRistagno(c.ristagno));
      if (c.salute > maxC) c.salute = Math.max(maxC, c.salute - giorni * PERDITA_AL_GIORNO * k);
      else if (c.sete < 2 && c.ristagno < FLOSCE_DA && oreParassiti(c, t) <= ORE_IN_TEMPO && !malata(c, t)) c.salute = Math.min(1, c.salute + giorni * RIPRESA_AL_GIORNO * k * spinta(c, t) * tonico(c, t));
      if (oreParassiti(c, t) > ORE_IN_TEMPO && c.salute > SALUTE_CON_PARASSITI) c.salute = Math.max(SALUTE_CON_PARASSITI, c.salute - giorni * DANNO_PARASSITI * k);
      if (malata(c, t) && c.salute > SALUTE_CON_MALATTIA) c.salute = Math.max(SALUTE_CON_MALATTIA, c.salute - giorni * DANNO_MALATTIA * k);
      for (const g of c.germogli) g.lunghezza = Math.min(1, g.lunghezza + vc * CRESCITA_GERMOGLIO);
      cresceFilo(c.rami, vc * PRESA_AL_GIORNO * PRESA_SPECIE[p], giorni, svanisce);
      ricresce(c.tagli, vc * RICRESCITA_CIUFFO * k);
    }
    t += passo;
    // ogni giorno nuovo, anche quando si salta avanti di molti giorni in una volta
    if (giornoLocale(t) !== stato.oggi.giorno) nuovoGiorno(stato, t);
    // dopo molti giorni senz'acqua non cambia più niente: si salta alla fine
    if (a.sete >= SETE_MASSIMA && a.salute <= SALUTE_MINIMA) t = ora;
  }
  stato.aggiornato = Math.max(stato.aggiornato, ora);
  controllaRinascita(stato);

  const oggi = giornoLocale(ora);
  if (stato.oggi.giorno !== oggi) nuovoGiorno(stato, ora);
  if (!stato.oggi.sfida) scegliSfida(stato, ora);
  const cal = calendario(stato.inizio, ora);
  if (stato.settimana?.chiave !== cal.anno + '-' + cal.stagione) scegliSettimana(stato, cal);
  // serie interrotta: un giorno saltato lo copre il giorno di riposo, se c'è; altrimenti si dimezza
  // una volta sola invece di azzerarsi (sezione 7.2)
  const s = stato.serie;
  if (s.ultimoGiorno && !s.interrotta && giorniTra(s.ultimoGiorno, oggi) > 1) {
    if (giorniTra(s.ultimoGiorno, oggi) === 2 && (s.riposi ?? 0) > 0) {
      s.riposi -= 1;
      s.ultimoGiorno = giornoDopo(oggi, -1);
      s.avvisoRiposo = true;
    } else {
      s.giorni = Math.floor(s.giorni / 2);
      s.interrotta = true;
    }
  }
  guardaQuaderno(stato, cal);
  return stato;
}

// Quaderno del maestro (sezione 7.6): una pagina si apre quando la tecnica si incontra nel gioco, e resta.
// Le pagine aperte e non ancora lette stanno in nuove (il pallino giallo sul pulsante del maestro).
function apriPagina(stato, id) {
  const q = stato.quaderno;
  if (!q || q.pagine.includes(id) || !PAGINE.some(p => p.id === id)) return;
  q.pagine.push(id); q.nuove.push(id);
}
// quello che si vede nel giardino: le piante, il vaso zuppo, afidi e malattie che si notano, il rinvaso, gli stili
function guardaQuaderno(stato, cal) {
  if (!stato.quaderno) return;
  const t = stato.aggiornato, vede = lente(stato), finestra = finestraRinvaso(cal) !== null;
  for (const p of presenti(stato)) {
    const c = curaDi(stato, p);
    apriPagina(stato, 'pianta-' + p);
    if (c.ristagno > 0) apriPagina(stato, 'troppa-acqua');
    if (c.parassiti && oreParassiti(c, t) >= ORE_NASCOSTI * vede) apriPagina(stato, 'afidi');
    if (c.malattia && oreMalattia(c, t) >= ORE_MALATTIA_NASCOSTA * vede) apriPagina(stato, c.malattia.id);
    if (finestra && rinvasoDovuto(c, cal)) apriPagina(stato, 'rinvaso');
    for (const st of STILI[p]) if (stileAperto(st, cal.anno, c)) apriPagina(stato, 'stile-' + st.id);
  }
}
// il giocatore ha letto una pagina: non è più nuova
export function leggiPagina(stato, id) {
  const q = stato.quaderno;
  if (q) q.nuove = q.nuove.filter(x => x !== id);
}

// i ciuffi tagliati ricrescono; a crescita piena tornano parte della chioma
function ricresce(tagli, quanto) {
  if (quanto <= 0) return;
  for (const i in tagli) { tagli[i] += quanto; if (tagli[i] >= 1) delete tagli[i]; }
}

// il ramo col filo prende la forma crescendo (presa: quanto ne prende in questo passo): come i germogli,
// si ferma sotto stress; a forma presa il filo comincia a segnare la corteccia
function cresceFilo(rami, presa, giorni, svanisce = 1) {
  for (const r of rami) {
    if (!r.filo) { r.segno = Math.max(0, r.segno - giorni * SEGNO_SVANISCE * svanisce); continue; }
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
  if (vigore(stagione, a.sete) * fradicio(a) > 0) for (let i = stagione === 0 ? 2 : 1; i > 0; i--) spuntaGermoglio(a);
  // conifere: candele del pino in primavera e nei primi giorni d'estate, punte del ginepro in primavera
  // ed estate, aghi vecchi del pino in autunno
  const pino = stato.conifere.pino, ginepro = stato.conifere.ginepro;
  if (vigore(stagione, pino.sete) * fradicio(pino) > 0) {
    if (stagione === 0) { spuntaGermoglio(pino, LUNGHEZZA_INIZIALE, GERMOGLI_CONIFERE); spuntaGermoglio(pino, LUNGHEZZA_INIZIALE, GERMOGLI_CONIFERE); }
    if (stagione === 1 && giornoStagione <= 3) spuntaGermoglio(pino, LUNGHEZZA_INIZIALE, GERMOGLI_CONIFERE);
  }
  if (stagione === 2 && pino.vecchi.length < VECCHI_MASSIMI) {
    const liberi = []; for (let p = 0; p < POSTI_VECCHI; p++) if (!pino.vecchi.some(x => x.posto === p)) liberi.push(p);
    const id = ++pino.contatore;
    pino.vecchi.push({ id, posto: liberi[(id * 3 + 1) % liberi.length] });
  }
  if (vigore(stagione, ginepro.sete) * fradicio(ginepro) > 0 && stagione <= 1) spuntaGermoglio(ginepro, LUNGHEZZA_INIZIALE, GERMOGLI_CONIFERE);
  // azalea: i fiori appassiscono nei primi due giorni d'estate (metà per giorno); all'inizio dell'autunno
  // quelli rimasti cadono, e l'anno dopo fiorirà la metà. Dopo la fioritura mette germogli da potare.
  const az = stato.conifere.azalea;
  if (az) {
    if (stagione === 1 && giornoStagione <= 2) {
      const tutti = Math.round(SFIORITI_PER_FIORITURA * az.fiori * Math.min(1, az.salute + .2));
      for (let n = giornoStagione === 1 ? Math.ceil(tutti / 2) : Math.floor(tutti / 2); n > 0 && az.vecchi.length < POSTI_SFIORITI; n--) {
        const liberi = []; for (let p = 0; p < POSTI_SFIORITI; p++) if (!az.vecchi.some(x => x.posto === p)) liberi.push(p);
        const id = ++az.contatore;
        az.vecchi.push({ id, posto: liberi[(id * 5 + 2) % liberi.length] });
      }
    }
    if (stagione === 2 && giornoStagione === 1) { az.fiori = az.vecchi.length ? 0.5 : 1; az.vecchi = []; }
    if (vigore(stagione, az.sete) * fradicio(az) > 0 && (stagione === 1 || (stagione === 2 && giornoStagione <= 3))) spuntaGermoglio(az, LUNGHEZZA_INIZIALE, GERMOGLI_CONIFERE);
  }
  // ciliegio: le ciliegine arrivano nei primi due giorni d'estate (metà per giorno), dove c'erano i fiori; all'inizio
  // dell'autunno quelle rimaste cadono, e l'anno dopo fiorirà la metà. Germogli da potare dopo la fioritura.
  const ci = stato.conifere.ciliegio;
  if (ci) {
    if (stagione === 1 && giornoStagione <= 2) {
      const tutte = Math.round(CILIEGINE_PER_FIORITURA * ci.fiori * Math.min(1, ci.salute + .2));
      for (let n = giornoStagione === 1 ? Math.ceil(tutte / 2) : Math.floor(tutte / 2); n > 0 && ci.vecchi.length < POSTI_CILIEGINE; n--) {
        const liberi = []; for (let p = 0; p < POSTI_CILIEGINE; p++) if (!ci.vecchi.some(x => x.posto === p)) liberi.push(p);
        const id = ++ci.contatore;
        ci.vecchi.push({ id, posto: liberi[(id * 3 + 2) % liberi.length] });
      }
    }
    if (stagione === 2 && giornoStagione === 1) { ci.fiori = ci.vecchi.length ? 0.5 : 1; ci.vecchi = []; }
    if (vigore(stagione, ci.sete) * fradicio(ci) > 0 && ((stagione === 0 && giornoStagione >= 5) || stagione === 1 || (stagione === 2 && giornoStagione <= 2))) spuntaGermoglio(ci, LUNGHEZZA_INIZIALE, GERMOGLI_CONIFERE);
  }
  // parassiti: al massimo un attacco alla volta per pianta; mai con l'olio di neem che fa effetto
  for (const pianta of presenti(stato)) {
    const c = curaDi(stato, pianta);
    if (c.concime && ora >= c.concime.fino) c.concime = null;
    if (c.protezione && ora >= c.protezione.fino) c.protezione = null;
    if (c.tonico && ora >= c.tonico.fino) c.tonico = null;
    if (c.parassiti || protetta(c, ora)) continue;
    const p = PROBABILITA_PARASSITI[stagione] * (pianta === 'acero' ? (a.sete >= 2 ? 2 : 1) : PROBABILITA_CONIFERE) * (concimeAttivo(c, ora) ? 0.5 : 1);
    const giorno = stato.inizio + ':' + giornoLocale(ora) + (pianta === 'acero' ? '' : ':' + pianta);
    if (caso(giorno) < p) c.parassiti = { posto: Math.floor(caso(giorno + ':posto') * POSTI_PARASSITI), da: ora };
  }
  // malattie: ognuna nella sua stagione, il doppio quando trova le sue condizioni; mai con la difesa attiva
  const piovuto = stato.meteo?.ultimaPioggia != null && ora - stato.meteo.ultimaPioggia < UMIDO_ORE * ORA;
  for (const pianta of presenti(stato)) {
    const c = curaDi(stato, pianta), m = MALATTIE[pianta];
    if (c.difesa && ora >= c.difesa.fino) c.difesa = null;
    if (c.malattia || difesa(c, ora)) continue;
    const favorita = m.causa === 'fitta' ? c.germogli.filter(g => g.lunghezza >= POTABILE_DA).length >= 2 : piovuto || c.ristagno > 0;
    const seme = stato.inizio + ':malattia:' + giornoLocale(ora) + ':' + pianta;
    if (caso(seme) < m.stagioni[stagione] * (favorita ? 2 : 1)) {
      // su un cuscinetto diverso da quello degli afidi, se ci sono
      let posto = Math.floor(caso(seme + ':posto') * POSTI_PARASSITI);
      if (c.parassiti?.posto === posto) posto = (posto + 2) % POSTI_PARASSITI;
      c.malattia = { id: m.id, posto, da: ora };
    }
  }
  // la sfida si sceglie quando il giocatore vede il giorno (alla fine di avanza)
  stato.oggi = { giorno: giornoLocale(ora), acqua: false, sfida: null };
}

function scegliSfida(stato, ora) {
  const a = stato.albero;
  const cal = calendario(stato.inizio, ora), { stagione, giornoStagione } = cal;
  // nella finestra del rinvaso, la pianta che ne ha bisogno ha la precedenza (dopo l'acqua dell'acero)
  const daRinvasare = finestraRinvaso(cal) !== null && presenti(stato).find(p => rinvasoDovuto(curaDi(stato, p), cal));
  if (daRinvasare && a.sete < SETE_PER_ANNAFFIARE && !stato.oggi.acqua) { stato.oggi.sfida = { tipo: 'rinvaso', pianta: daRinvasare, fatta: false }; return; }
  // se l'acero non beve, magari ha davvero sete una conifera (quella più asciutta): per lei la sfida
  // arriva solo quando ha sete, non appena il terriccio si asciuga, così restano anche le altre sfide
  const conifera = altre(stato).filter(p => stato.conifere[p].sete >= FASI[1].da)
    .sort((x, y) => stato.conifere[y].sete - stato.conifere[x].sete)[0];
  if (a.sete < SETE_PER_ANNAFFIARE && conifera && !stato.oggi.acqua) { stato.oggi.sfida = { tipo: 'acqua', pianta: conifera, fatta: false }; return; }
  // se l'acero non ha niente da potare, la potatura del giorno può essere quella di una conifera
  const az = stato.conifere.azalea, ci = stato.conifere.ciliegio;
  const potaConifera = !a.germogli.some(g => g.lunghezza >= POTABILE_DA) && (
    az?.vecchi.length ? { pianta: 'azalea', tecnica: 'fiori' }
    : ci?.vecchi.length ? { pianta: 'ciliegio', tecnica: 'ciliegine' }
    : stato.conifere.pino.vecchi.length ? { pianta: 'pino', tecnica: 'aghi' }
    : stato.conifere.pino.germogli.some(g => g.lunghezza >= POTABILE_DA) ? { pianta: 'pino', tecnica: 'candele' }
    : stato.conifere.ginepro.germogli.some(g => g.lunghezza >= POTABILE_DA) ? { pianta: 'ginepro', tecnica: 'pizzica' }
    : az?.germogli.some(g => g.lunghezza >= POTABILE_DA) ? { pianta: 'azalea', tecnica: 'azalea' }
    : ci?.germogli.some(g => g.lunghezza >= POTABILE_DA) ? { pianta: 'ciliegio', tecnica: 'ciliegio' } : null);
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

// Un'azione di cura conta per la serie una volta al giorno. Restituisce i Semi del bonus. Ogni 7 giorni di fila arriva un giorno di riposo (se non ce n'è già uno).
function registraCura(stato, ora) {
  const s = stato.serie, oggi = giornoLocale(ora);
  if (s.ultimoGiorno === oggi) return 0;
  s.giorni += 1; s.ultimoGiorno = oggi; s.interrotta = false;
  contaSettimana(stato, 'cure');
  if (s.giorni % 7 === 0) {
    if ((s.riposi ?? 0) < RIPOSI_MASSIMI) { s.riposi = (s.riposi ?? 0) + 1; s.riposoGuadagnato = oggi; }
    stato.semi += SEMI.serie7; return SEMI.serie7;
  }
  return 0;
}

// Il giorno di riposo ha coperto un giorno saltato: true una volta sola, per dirlo al giocatore
export function leggiAvvisoRiposo(stato) {
  const si = !!stato.serie.avvisoRiposo;
  delete stato.serie.avvisoRiposo;
  return si;
}

// Sceglie la sfida della settimana per la stagione cal (vedi SFIDE_SETTIMANA)
function scegliSettimana(stato, cal) {
  const { anno, stagione, giornoStagione } = cal, rimasti = 8 - giornoStagione;
  const chiave = anno + '-' + stagione, nuova = (tipo, obiettivo) => ({ chiave, tipo, obiettivo: Math.max(1, obiettivo), fatti: 0, fatta: false, piante: [] });
  // d'inverno, se una pianta va rinvasata e c'è un terriccio adatto, la sfida è il rinvaso
  if (stagione === 3) {
    const finestra = { anno, stagione: 3, giornoStagione: 4 };
    const daRinvasare = presenti(stato).some(p => rinvasoDovuto(curaDi(stato, p), finestra)
      && PRODOTTI.some(t => t.tipo === 'terriccio' && t.piante.includes(p) && stato.inventario[t.id] > 0));
    if (daRinvasare) { stato.settimana = nuova('rinvaso', 1); return; }
  }
  const scelte = SETTIMANE[stagione], tipo = scelte[(anno - 1) % scelte.length];
  const obiettivo = {
    cure: Math.min(5, rimasti), pota: stagione === 0 ? Math.min(8, rimasti * 2) : Math.min(5, rimasti),
    candele: Math.min(6, rimasti * 2), pizzica: Math.min(4, rimasti), aghi: Math.min(4, rimasti),
    filo: 3, foto: Math.min(3, presenti(stato).length),
  }[tipo];
  stato.settimana = nuova(tipo, obiettivo);
}

// Un'azione conta per la sfida della settimana se è del tipo giusto (le foto: una per pianta).
// Completata, i Semi vanno subito nel conto: non sono nei risultati delle azioni, perché l'interfaccia
// li fa arrivare dal banner della sfida. Restituisce i Semi guadagnati.
function contaSettimana(stato, tipo, pianta) {
  const s = stato.settimana;
  if (!s || s.fatta || s.tipo !== tipo) return 0;
  if (tipo === 'foto') { if (s.piante.includes(pianta)) return 0; s.piante.push(pianta); }
  s.fatti += 1;
  if (s.fatti < s.obiettivo) return 0;
  s.fatta = true;
  stato.semi += SEMI.settimana;
  return SEMI.settimana;
}

// esito: 'ok'; 'umido' (terriccio ancora bagnato: la prima volta per ogni pianta non si annaffia e si avvisa,
// a meno di insistere con forza); 'troppa' (annaffiata col terriccio umido: l'acqua in più ristagna nel vaso,
// niente Semi né serie). Dopo il primo avviso i tempi di ogni pianta li ricorda il giocatore.
// pianta: 'acero' (predefinita), 'pino' o 'ginepro'
export function annaffia(stato, ora, pianta = 'acero', forza = false) {
  avanza(stato, ora);
  const a = pianta === 'acero' ? stato.albero : stato.conifere[pianta];
  if (!a) return { esito: 'nessuno', semi: 0, bonusSerie: 0 };
  if (a.sete < SETE_PER_ANNAFFIARE && !forza && !a.avvisatoUmido) {
    a.avvisatoUmido = true;
    return { esito: 'umido', semi: 0, bonusSerie: 0 };
  }
  if (a.sete < SETE_PER_ANNAFFIARE) {
    // più il terriccio era bagnato, più acqua resta nel vaso
    a.ristagno = Math.min(RISTAGNO_MASSIMO, a.ristagno + RISTAGNO_PER_ANNAFFIATURA * (1 - a.sete / SETE_PER_ANNAFFIARE));
    a.sete = 0; a.ultimaAcqua = ora;
    a.eccessi = (a.eccessi ?? 0) + 1;
    const prima = a.salute;
    a.salute = Math.max(SALUTE_MINIMA, a.salute - Math.min(PERDITA_ECCESSO_MASSIMA, PERDITA_PER_ECCESSO * a.eccessi));
    return { esito: 'troppa', semi: 0, bonusSerie: 0, perdita: prima - a.salute, eccessi: a.eccessi };
  }
  a.sete = 0; a.ultimaAcqua = ora; a.eccessi = 0;
  if (pianta === 'acero') stato.oggi.acqua = true;
  const semi = completaSfida(stato, 'acqua', pianta);
  apriPagina(stato, 'acqua');
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
  apriPagina(stato, { pino: 'candele', ginepro: 'pizzicatura' }[pianta] ?? 'potatura');
  contaSettimana(stato, POTA_SETTIMANA[pianta], pianta);
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
  contaSettimana(stato, 'filo');
  apriPagina(stato, 'filo');
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
  // col tronchesino il filo si taglia senza strappare: il premio vale anche con un segno leggero
  const semi = presa >= 1 && r.segno < (ha(stato, 'tronchesino') ? TRONCHESINO_SEGNO : 0.05) ? SEMI.filo : 0;
  stato.semi += semi;
  return { esito: 'ok', semi, presa, bonusSerie: registraCura(stato, ora) };
}

// Toglie un ciuffo di aghi vecchi dal pino (autunno). esito: 'ok' o 'nessuno'. Conta come potatura.
// toglie un ciuffo di aghi vecchi del pino, o (pianta 'azalea') un fiore appassito
export function togliAghi(stato, ora, id, pianta = 'pino') {
  avanza(stato, ora);
  const c = stato.conifere[pianta], i = c ? c.vecchi.findIndex(x => x.id === id) : -1;
  if (i < 0) return { esito: 'nessuno', semi: 0, bonusSerie: 0 };
  c.vecchi.splice(i, 1);
  const semi = completaSfida(stato, 'pota', pianta);
  apriPagina(stato, { pino: 'aghi-vecchi', azalea: 'fiori-appassiti', ciliegio: 'ciliegine' }[pianta]);
  if (pianta === 'pino') contaSettimana(stato, 'aghi');
  return { esito: 'ok', semi, bonusSerie: registraCura(stato, ora) };
}

// Rinvasa una pianta con un terriccio dell'inventario. Conta per la serie.
// esito: 'ok'; 'stagione' (fuori dalla finestra: giorniAllaFinestra dice quanto manca); 'presto' (le radici
// hanno ancora spazio: anniMancanti); 'finito', 'non-adatto' o 'nessuno' per il terriccio.
// Fatto quando serve dà Semi; il terriccio scelto decide fra quanti anni servirà di nuovo.
export function rinvasa(stato, ora, pianta, id) {
  avanza(stato, ora);
  const c = PIANTE[pianta] ? curaDi(stato, pianta) : null, p = PRODOTTI.find(x => x.id === id && x.tipo === 'terriccio');
  const vuoto = { semi: 0, bonusSerie: 0, giorniAllaFinestra: 0, anniMancanti: 0, anni: 0 };
  if (!c || !p) return { esito: 'nessuno', ...vuoto };
  const cal = calendario(stato.inizio, ora), finestra = finestraRinvaso(cal);
  if (!rinvasoDovuto(c, cal)) return { esito: 'presto', ...vuoto, anniMancanti: c.rinvaso.primavera + c.rinvaso.durata - primaveraDi(cal) };
  if (finestra === null) return { esito: 'stagione', ...vuoto, giorniAllaFinestra: giorniAllaFinestra(cal) };
  if (!p.piante.includes(pianta)) return { esito: 'non-adatto', ...vuoto };
  if (!stato.inventario[id]) return { esito: 'finito', ...vuoto };
  stato.inventario[id] -= 1;
  apriPagina(stato, 'rinvaso'); apriPagina(stato, 'terricci');
  c.rinvaso = { primavera: finestra, durata: p.durata[pianta], stretto: false };
  // col terriccio nuovo il muschio se ne va
  c.muschio = false;
  // terriccio nuovo e ben bagnato
  c.sete = 0;
  stato.semi += SEMI.rinvaso;
  const semi = SEMI.rinvaso + completaSfida(stato, 'rinvaso', pianta);
  contaSettimana(stato, 'rinvaso', pianta);
  return { esito: 'ok', ...vuoto, semi, anni: p.durata[pianta], bonusSerie: registraCura(stato, ora) };
}
// giorni che mancano alla prossima finestra di rinvaso (4° giorno d'inverno)
function giorniAllaFinestra({ stagione, giornoStagione }) {
  return (3 - stagione) * 7 + (4 - giornoStagione);
}

// Taglia con la forbice alcuni ciuffi della chioma (indici dei ciuffi della scena), per dare forma allo stile.
// Conta per la serie. esito: 'ok' o 'nessuno' (pianta sconosciuta o niente da tagliare)
export function tagliaCiuffi(stato, ora, pianta, indici) {
  avanza(stato, ora);
  const c = PIANTE[pianta] ? curaDi(stato, pianta) : null;
  const nuovi = c ? indici.filter(i => Number.isInteger(i) && i >= 0 && c.tagli[i] === undefined) : [];
  if (!nuovi.length) return { esito: 'nessuno', tagliati: 0, bonusSerie: 0 };
  for (const i of nuovi) c.tagli[i] = 0;
  return { esito: 'ok', tagliati: nuovi.length, bonusSerie: registraCura(stato, ora) };
}

// Sceglie lo stile da seguire tra quelli adatti alla pianta. Restituisce false se non è adatto
// o se la pianta non è ancora abbastanza vecchia (stile.anno, sezione 5.3).
export function scegliStile(stato, pianta, id) {
  const c = PIANTE[pianta] ? curaDi(stato, pianta) : null;
  const stile = c && stileDi(pianta, id);
  if (!stile || !stileAperto(stile, calendario(stato.inizio, stato.aggiornato).anno, c)) return false;
  c.stile.id = id;
  return true;
}

// Registra la percentuale raggiunta (la calcola valutaStile, con i ciuffi della scena): la prima volta
// che lo stile arriva a COMPLETATO_DA dà il sigillo e il premio in Semi.
export function sigillaStile(stato, pianta, percentuale) {
  const c = PIANTE[pianta] ? curaDi(stato, pianta) : null;
  const stile = c && stileDi(pianta, c.stile.id);
  if (!stile || percentuale < COMPLETATO_DA || c.stile.sigilli.includes(stile.id)) return { nuovo: false, premio: 0 };
  c.stile.sigilli.push(stile.id);
  stato.semi += stile.premio;
  return { nuovo: true, premio: stile.premio, nome: stile.nome };
}

// Diario fotografico (sezione 8.1): una foto di una pianta. Le immagini si salvano a parte (sono grandi);
// il motore dice solo quando è stata scattata, in tempo di gioco, e premia la prima foto di ogni pianta
// in ogni stagione con qualche Semi: un ricordo della stagione, non un obbligo.
// esito: 'ok' o 'nessuno' (pianta sconosciuta)
export function fotografa(stato, ora, pianta) {
  avanza(stato, ora);
  if (!PIANTE[pianta] || !curaDi(stato, pianta)) return { esito: 'nessuno', semi: 0, ricordo: false };
  const cal = calendario(stato.inizio, ora), chiave = cal.anno + '-' + cal.stagione;
  const ricordo = stato.diario[pianta] !== chiave;
  if (ricordo) { stato.diario[pianta] = chiave; stato.semi += SEMI.foto; }
  contaSettimana(stato, 'foto', pianta);
  return { esito: 'ok', ...cal, nomeStagione: STAGIONI[cal.stagione], ricordo, semi: ricordo ? SEMI.foto : 0 };
}

// Compra una confezione di un prodotto di cura (DOSI_PER_CONFEZIONE dosi nell'inventario).
// esito: 'ok', 'pochi' (Semi insufficienti) o 'nessuno'
export function compraProdotto(stato, id) {
  const p = PRODOTTI.find(x => x.id === id);
  if (!p) return { esito: 'nessuno', mancano: 0 };
  if (stato.semi < p.prezzo) return { esito: 'pochi', mancano: p.prezzo - stato.semi };
  stato.semi -= p.prezzo;
  stato.inventario[id] = (stato.inventario[id] ?? 0) + DOSI_PER_CONFEZIONE;
  if (p.tipo === 'terriccio') apriPagina(stato, 'terricci');
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
  // i terricci si usano rinvasando
  if (p.tipo === 'terriccio') return { ...vuoto, ...rinvasa(stato, ora, pianta, id) };
  if (!p.piante.includes(pianta)) return { esito: 'non-adatto', ...vuoto };
  if (!stato.inventario[id]) return { esito: 'finito', ...vuoto };
  let semi = 0, inTempo = false, presto = false, tolti = false;
  if (p.tipo === 'concime') {
    if (calendario(stato.inizio, ora).stagione === 3) return { esito: 'inverno', ...vuoto };
    if (concimeAttivo(c, ora)) return { esito: 'attivo', ...vuoto };
    // il concime liquido fa effetto subito e forte, ma per pochi giorni
    c.concime = { fino: ora + (p.giorni ?? DURATA_CONCIME) * GIORNO, spinta: p.spinta, prodotto: id };
    if (pianta === 'acero') semi += completaSfida(stato, 'concime');
  } else if (p.tipo === 'tonico') {
    // il tonico va bene anche d'inverno: aiuta la chioma a riprendersi, non spinge la crescita
    if (tonicoAttivo(c, ora)) return { esito: 'attivo', ...vuoto };
    c.tonico = { fino: ora + p.giorni * GIORNO, ripresa: p.ripresa ?? TONICO_RIPRESA };
  } else if (p.tipo === 'muschio') {
    // il muschio resta sul terriccio fino al prossimo rinvaso
    if (c.muschio) return { esito: 'gia', ...vuoto };
    c.muschio = true;
  } else if (p.tipo === 'fungicida') {
    // l'equiseto non cura: previene soltanto
    if (c.malattia && p.cura === false) return { esito: 'non-cura', ...vuoto };
    if (!c.malattia && !p.protezione) return { esito: 'niente', ...vuoto };
    if (c.malattia) {
      const ore = oreMalattia(c, ora);
      presto = ore < ORE_MALATTIA_NASCOSTA; inTempo = ore <= ORE_MALATTIA_IN_TEMPO; tolti = true;
      semi += (inTempo ? SEMI.malattia : 0) + (presto ? SEMI.scoperti : 0);
      c.malattia = null;
    }
    if (p.protezione) c.difesa = { fino: ora + p.protezione * GIORNO };
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
  apriPagina(stato, { concime: 'concime', tonico: 'tonici', muschio: 'muschio' }[p.tipo]);
  return { esito: 'ok', semi, inTempo, presto, tolti, bonusSerie: registraCura(stato, ora) };
}

// Allarga il prato dell'isola (il prossimo dei tre ampliamenti). esito: 'ok', 'pochi' o 'finiti'
export function compraAmpliamento(stato) {
  const n = ampliamentiDi(stato), a = AMPLIAMENTI[n];
  if (!a) return { esito: 'finiti', mancano: 0 };
  if (stato.semi < a.prezzo) return { esito: 'pochi', mancano: a.prezzo - stato.semi };
  stato.semi -= a.prezzo;
  stato.giardino = { ...stato.giardino, ampliamenti: n + 1 };
  return { esito: 'ok', mancano: 0, ampliamenti: n + 1 };
}

// I momenti belli delle piante di adesso, non ancora premiati: [{ pianta, tipo: 'fioritura' | 'colori', chiave }]
function momentiBelli(stato) {
  const cal = calendario(stato.inizio, stato.aggiornato), { anno, stagione } = cal, fatti = stato.premiStagione ?? [], m = [];
  const aggiungi = (pianta, tipo) => {
    const c = curaDi(stato, pianta), chiave = `${pianta}-${tipo}-${anno}`;
    if (c && c.salute >= CHIOMA_PER_PREMIO && !fatti.includes(chiave)) m.push({ pianta, tipo, chiave });
  };
  if (stagione === 2) { aggiungi('acero', 'colori'); aggiungi('ciliegio', 'colori'); }
  if (fiorituraCiliegio(cal).fiori >= .5 && stato.conifere.ciliegio?.fiori > 0) aggiungi('ciliegio', 'fioritura');
  if (fiorituraDi(cal).fiori >= .5 && stato.conifere.azalea?.fiori > 0) aggiungi('azalea', 'fioritura');
  return m;
}
// Dà i premi dei momenti belli di adesso e li restituisce ([{ pianta, tipo, semi }]): da chiamare all'apertura
export function premiaMomenti(stato) {
  const m = momentiBelli(stato);
  for (const x of m) { stato.premiStagione = [...(stato.premiStagione ?? []), x.chiave].slice(-20); stato.semi += SEMI.stagione; }
  return m.map(({ pianta, tipo }) => ({ pianta, tipo, semi: SEMI.stagione }));
}

// Sfida di rinascita (sezione 6.2): comincia quando una pianta arriva allo stress forte (una lunga assenza),
// finisce quando tutte le piante sono di nuovo senza sete e con la chioma piena; allora il premio.
function controllaRinascita(stato) {
  const piante = presenti(stato).map(p => curaDi(stato, p));
  const r = stato.rinascita;
  if (!r || r.fatta) {
    if (piante.some(c => c.sete >= FASI[4].da)) stato.rinascita = { fatta: false, avviso: false };
    return;
  }
  if (piante.every(c => c.sete < FASI[1].da && c.salute >= CHIOMA_RINASCITA)) {
    r.fatta = true; r.avviso = true;
    stato.semi += SEMI.rinascita;
  }
}
// La sfida di rinascita è appena finita: true una volta sola, per dirlo al giocatore
export function leggiAvvisoRinascita(stato) {
  const si = !!stato.rinascita?.avviso;
  if (si) stato.rinascita.avviso = false;
  return si;
}

// Il momento speciale di adesso (o null): { ...evento, anno, giorniRimasti }. t: un istante (di solito stato.aggiornato)
export function eventoDi(stato, t) {
  const cal = calendario(stato.inizio, t), { anno, stagione, giornoStagione: g } = cal;
  for (const e of EVENTI) {
    if (e.stagione !== stagione) continue;
    let da = e.da, a = e.a;
    if (e.id === 'hatsuyuki') {
      // il primo giorno di quest'inverno in cui nevica (il meteo di ogni giorno è già deciso)
      const inizioInverno = stato.inizio + ((anno - 1) * 28 + 21) * GIORNO;
      da = null;
      for (let d = 1; d <= 7 && da === null; d++) if (meteoDelGiorno(stato, inizioInverno + (d - .5) * GIORNO).tipo === 'neve') da = d;
      if (da === null) return null;
      a = Math.min(7, da + e.giorni - 1);
    }
    if (g >= da && g <= a) return { ...e, anno, giorniRimasti: a - g + 1 };
  }
  return null;
}
// Il momento speciale da festeggiare adesso (la prima volta che lo si vede quest'anno), oppure null
export function eventoDaFesteggiare(stato) {
  const e = eventoDi(stato, stato.aggiornato);
  return e && !(stato.eventi?.festeggiati ?? []).includes(e.id + '-' + e.anno) ? e : null;
}
// Festeggia il momento speciale di adesso: il regalo in Semi, una volta per anno. Restituisce i Semi (0 se già fatto)
export function festeggiaEvento(stato) {
  const e = eventoDaFesteggiare(stato);
  if (!e) return 0;
  stato.eventi ??= { festeggiati: [] };
  stato.eventi.festeggiati = [...stato.eventi.festeggiati, e.id + '-' + e.anno].slice(-8);
  stato.semi += e.premio;
  return e.premio;
}

// Compra un attrezzo (una volta sola, dura per sempre). esito: 'ok', 'pochi', 'gia' o 'nessuno'
export function compraAttrezzo(stato, id) {
  const a = ATTREZZI.find(x => x.id === id);
  if (!a) return { esito: 'nessuno', mancano: 0 };
  stato.attrezzi ??= [];
  if (stato.attrezzi.includes(id)) return { esito: 'gia', mancano: 0 };
  if (stato.semi < a.prezzo) return { esito: 'pochi', mancano: a.prezzo - stato.semi };
  stato.semi -= a.prezzo;
  stato.attrezzi.push(id);
  return { esito: 'ok', mancano: 0 };
}

// Compra un vaso e lo mette subito all'albero. esito: 'ok', 'pochi' (Semi insufficienti), 'gia' (già tuo) o 'nessuno'.
// pianta: a chi va subito il vaso comprato (l'acero, se non si dice)
export function compra(stato, id, pianta = 'acero') {
  const vaso = VASI.find(v => v.id === id);
  if (!vaso) return { esito: 'nessuno', mancano: 0 };
  if (stato.vasi.posseduti.includes(id)) return { esito: 'gia', mancano: 0 };
  if (stato.semi < vaso.prezzo) return { esito: 'pochi', mancano: vaso.prezzo - stato.semi };
  stato.semi -= vaso.prezzo;
  stato.vasi.posseduti.push(id);
  scegliVaso(stato, id, PIANTE[pianta] && curaDi(stato, pianta) ? pianta : 'acero');
  return { esito: 'ok', mancano: 0 };
}

// Il prato dell'isola, per decorazioni, piante ed elementi del giardino (coordinate dell'isola, come la
// scena). Le piante (sezione 8.3) si spostano con vaso e supporto: ognuna ha il suo posto iniziale e il
// suo ingombro. Tutto si sposta: dell'isola restano fermi solo la ghiaia, la staccionata e gli alberi
// dietro.
const ISOLA_ZS = 1.32;
export const POSTI_PIANTE = { acero: [0, -2.4], ginepro: [-2.3, .6], pino: [2.1, 2.0], azalea: POSTO_AZALEA, ciliegio: POSTO_CILIEGIO };
const RAGGI_PIANTE = { acero: 1.25, ginepro: 1.05, pino: 1.1, azalea: 1, ciliegio: 1.05 };
// dove sta una pianta adesso: { x, z, r }
const postoPianta = (stato, p) => stato.piantePosti?.[p] ?? { x: POSTI_PIANTE[p][0], z: POSTI_PIANTE[p][1], r: 0 };
// dove sta un elemento del giardino adesso: { x, z, r }
const postoElemento = (stato, id) => { const e = ELEMENTI.find(v => v.id === id); return stato.elementiPosti?.[id] ?? { x: e.posto[0], z: e.posto[1], r: 0 }; };
// ingombro di una pianta, una decorazione o un elemento del giardino (null se non esiste); grande: le
// piante, la lanterna e la pietra col muschio, che pesano di più
const ingombroDi = (id) => PIANTE[id] ? { raggio: RAGGI_PIANTE[id], grande: true } : DECORAZIONI.find(v => v.id === id) ?? ELEMENTI.find(v => v.id === id) ?? null;
const LAGO = 1.2;
const distanza = (x, z, a, b) => Math.hypot(x - a, z - b);
// un elemento tolto dal giardino non c'è e non ingombra
const tolto = (stato, id) => (stato.elementiTolti ?? []).includes(id);
// tutto quello che c'è nel giardino adesso, tranne id: { x, z, ...ingombro }
function ingombri(stato, id) {
  const tutti = [];
  for (const p of presenti(stato)) if (p !== id) tutti.push({ ...postoPianta(stato, p), ...ingombroDi(p) });
  for (const e of ELEMENTI) if (e.id !== id && !tolto(stato, e.id)) tutti.push({ ...postoElemento(stato, e.id), ...e });
  for (const altra of stato.decorazioni.messe) {
    const p = stato.decorazioni.posti[altra];
    if (altra !== id && p) tutti.push({ ...p, ...ingombroDi(altra) });
  }
  return tutti;
}

// Si può posare la pianta, la decorazione o l'elemento id in (x, z)? esito: 'ok', 'fuori' (oltre il
// prato o dietro la staccionata), 'acqua' (nel laghetto), 'occupato' (sopra qualcos'altro)
export function postoLibero(stato, id, x, z) {
  const d = ingombroDi(id);
  if (!d) return 'nessuno';
  // distanza dal centro misurata sull'isola ovale; sul retro c'è la staccionata; i cespugli possono
  // stare proprio sul bordo
  // col prato allargato (ampliamenti) c'è più posto tutto intorno, tranne dietro la staccionata
  const rho = Math.hypot(x, z / ISOLA_ZS), dietro = z < 0 && Math.abs(Math.atan2(x, -z / ISOLA_ZS)) < 1;
  if (rho + d.raggio * (dietro ? .5 : d.bordo ? 0 : .7) > (dietro ? 4.3 : (d.bordo ? 5.4 : 4.85) + crescitaIsola(ampliamentiDi(stato)))) return 'fuori';
  for (const q of ingombri(stato, id)) {
    const dist = distanza(x, z, q.x, q.z);
    // il laghetto: dentro ci va solo il ponticello (e il laghetto non va sopra le cose)
    if (q.acqua || d.acqua) {
      if (q.sullAcqua || d.sullAcqua) continue;
      if (dist < LAGO + (q.acqua ? d.raggio : q.raggio) * .6) return d.acqua ? 'occupato' : 'acqua';
      continue;
    }
    const soglia = d.grande && q.grande ? (d.raggio + q.raggio) * .82
      : d.grande ? d.raggio + q.raggio * .8 : q.grande ? q.raggio + d.raggio * .8 : (d.raggio + q.raggio) * .85;
    if (dist < soglia) return 'occupato';
  }
  return 'ok';
}

// un posto libero vicino a quello preferito (cercando a spirale), per mettere una decorazione nel giardino
function postoVicino(stato, id, x, z, r) {
  for (let i = 0; i < 160; i++) {
    const a = i * 2.39996, d = .18 * Math.sqrt(i);
    const px = +(x + Math.cos(a) * d).toFixed(3), pz = +(z + Math.sin(a) * d).toFixed(3);
    if (postoLibero(stato, id, px, pz) === 'ok') return { x: px, z: pz, r };
  }
  return { x, z, r };
}

// Compra una pianta nuova (l'azalea) e la mette al suo posto sull'isola: le decorazioni che ci stavano
// si spostano lì vicino. esito: 'ok', 'pochi', 'gia' o 'nessuno'
export function compraPianta(stato, ora, id) {
  avanza(stato, ora);
  const p = PIANTE_NEGOZIO.find(x => x.id === id);
  if (!p) return { esito: 'nessuno', mancano: 0 };
  if (stato.conifere[id]) return { esito: 'gia', mancano: 0 };
  if (stato.semi < p.prezzo) return { esito: 'pochi', mancano: p.prezzo - stato.semi };
  stato.semi -= p.prezzo;
  const nuova = coniferaNuova(id);
  nuova.rinvaso.primavera = primaveraDi(calendario(stato.inizio, ora));
  // al suo posto, o lì vicino se il giocatore ci ha spostato un'altra pianta (le decorazioni invece si
  // spostano loro, qui sotto: per ora non contano)
  const [px, pz] = POSTI_PIANTE[id], messe = stato.decorazioni.messe;
  stato.decorazioni.messe = [];
  const dove = postoLibero(stato, id, px, pz) === 'ok' ? null : postoVicino(stato, id, px, pz, 0);
  stato.decorazioni.messe = messe;
  stato.conifere[id] = Object.assign(nuova, { fiori: 1 });
  if (dove) stato.piantePosti[id] = dove;
  for (const d of stato.decorazioni.messe) {
    const q = stato.decorazioni.posti[d];
    if (q && postoLibero(stato, d, q.x, q.z) !== 'ok') stato.decorazioni.posti[d] = postoVicino(stato, d, q.x, q.z, q.r);
  }
  return { esito: 'ok', mancano: 0 };
}

// Compra una decorazione e la mette subito nel giardino, al suo posto o vicino se è occupato.
// esito: 'ok', 'pochi', 'gia' o 'nessuno'
export function compraDecorazione(stato, id) {
  const d = DECORAZIONI.find(x => x.id === id);
  if (!d) return { esito: 'nessuno', mancano: 0 };
  if (stato.decorazioni.possedute.includes(id)) return { esito: 'gia', mancano: 0 };
  // le decorazioni degli eventi si comprano solo durante il loro evento
  if (d.evento && eventoDi(stato, stato.aggiornato)?.id !== d.evento) return { esito: 'evento', mancano: 0 };
  if (stato.semi < d.prezzo) return { esito: 'pochi', mancano: d.prezzo - stato.semi };
  stato.semi -= d.prezzo;
  stato.decorazioni.possedute.push(id);
  stato.decorazioni.posti[id] = postoVicino(stato, id, ...d.posto);
  stato.decorazioni.messe.push(id);
  return { esito: 'ok', mancano: 0 };
}

// Mette (si = true) o toglie una decorazione già comprata. Rimessa, torna dov'era (o lì vicino, se
// intanto quel posto si è occupato). Restituisce false se non è tua.
export function mettiDecorazione(stato, id, si) {
  const dec = stato.decorazioni;
  if (!dec.possedute.includes(id)) return false;
  dec.messe = dec.messe.filter(x => x !== id);
  if (si) {
    const p = dec.posti[id] ?? (([x, z, r]) => ({ x, z, r }))(DECORAZIONI.find(d => d.id === id).posto);
    dec.posti[id] = postoLibero(stato, id, p.x, p.z) === 'ok' ? p : postoVicino(stato, id, p.x, p.z, p.r);
    dec.messe.push(id);
  }
  return true;
}

// Sposta e gira una pianta del giardino, con il suo vaso e il supporto (sezione 8.3).
// esito: 'ok', 'nessuno' (la pianta non c'è) o quello di postoLibero
export function posaPianta(stato, id, x, z, r) {
  if (!PIANTE[id] || !curaDi(stato, id)) return 'nessuno';
  const esito = postoLibero(stato, id, x, z);
  if (esito !== 'ok') return esito;
  stato.piantePosti ??= {};
  stato.piantePosti[id] = { x: +x.toFixed(3), z: +z.toFixed(3), r: +(((r % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)).toFixed(4) };
  return 'ok';
}

// Sposta e gira un elemento del giardino (sezione 8.4). Il laghetto porta con sé il ponticello, se ci sta
// sopra. esito: 'ok', 'nessuno' o quello di postoLibero
export function posaElemento(stato, id, x, z, r) {
  if (!ELEMENTI.some(e => e.id === id) || tolto(stato, id)) return 'nessuno';
  const esito = postoLibero(stato, id, x, z);
  if (esito !== 'ok') return esito;
  const prima = postoElemento(stato, id), dove = { x: +x.toFixed(3), z: +z.toFixed(3), r: +(((r % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)).toFixed(4) };
  const ponte = stato.decorazioni.messe.includes('ponte') && stato.decorazioni.posti.ponte;
  if (id === 'laghetto' && ponte && distanza(ponte.x, ponte.z, prima.x, prima.z) < LAGO) {
    // il ponte gira col laghetto intorno al suo centro
    const dr = dove.r - prima.r, dx = ponte.x - prima.x, dz = ponte.z - prima.z, c = Math.cos(dr), s = Math.sin(dr);
    stato.decorazioni.posti.ponte = { x: +(dove.x + dx * c + dz * s).toFixed(3), z: +(dove.z - dx * s + dz * c).toFixed(3), r: +(ponte.r + dr).toFixed(4) };
  }
  stato.elementiPosti ??= {};
  stato.elementiPosti[id] = dove;
  return 'ok';
}

// Toglie (si = false) o rimette un elemento del giardino. Rimesso, torna dov'era (o lì vicino, se
// intanto quel posto si è occupato). Restituisce false se l'elemento non esiste o è già così.
export function mettiElemento(stato, id, si) {
  if (!ELEMENTI.some(e => e.id === id) || tolto(stato, id) === !si) return false;
  stato.elementiTolti = (stato.elementiTolti ?? []).filter(x => x !== id);
  if (!si) { stato.elementiTolti.push(id); return true; }
  const p = postoElemento(stato, id);
  stato.elementiPosti ??= {};
  stato.elementiPosti[id] = postoLibero(stato, id, p.x, p.z) === 'ok' ? p : postoVicino(stato, id, p.x, p.z, p.r);
  return true;
}

// Sposta e gira una decorazione nel giardino. esito: 'ok', 'nessuno' (non è tua) o quello di postoLibero
export function posaDecorazione(stato, id, x, z, r) {
  if (!stato.decorazioni.possedute.includes(id)) return 'nessuno';
  const esito = postoLibero(stato, id, x, z);
  if (esito !== 'ok') return esito;
  stato.decorazioni.posti[id] = { x: +x.toFixed(3), z: +z.toFixed(3), r: +(((r % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)).toFixed(4) };
  if (!stato.decorazioni.messe.includes(id)) stato.decorazioni.messe.push(id);
  return 'ok';
}

// Mette all'albero un vaso già comprato. Restituisce false se il vaso non è tuo.
// Mette a una pianta (l'acero, se non si dice) un vaso già comprato. false se il vaso non è tuo.
export function scegliVaso(stato, id, pianta = 'acero') {
  if (!stato.vasi.posseduti.includes(id) || !PIANTE[pianta]) return false;
  if (pianta === 'acero') stato.vasi.scelto = id;
  else stato.vasi.piante = { ...stato.vasi.piante, [pianta]: id };
  return true;
}


const DOVE = { pino: 'il pino', ginepro: 'il ginepro', azalea: 'l\'azalea', ciliegio: 'il ciliegio' };
const RINVASA = { acero: 'Rinvasa l\'acero', pino: 'Rinvasa il pino', ginepro: 'Rinvasa il ginepro', azalea: 'Rinvasa l\'azalea', ciliegio: 'Rinvasa il ciliegio' };
const testoSfida = (s) => s.tipo === 'rinvaso' ? RINVASA[s.pianta]
  : s.tipo === 'acqua' && s.pianta && s.pianta !== 'acero' ? 'Annaffia ' + DOVE[s.pianta]
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
// come sta una pianta con l'acqua, dalla sua sete (e dall'acqua in più che ristagna nel vaso)
function vistaAcqua(sete, ristagno = 0, asciugaAlGiorno = 1) {
  let fase = 0;
  FASI.forEach((f, i) => { if (sete >= f.da) fase = i; });
  return {
    sete, fase, nomeFase: ristagno >= MARCIUME_DA ? 'Radici fradice' : ristagno >= FLOSCE_DA ? 'Troppa acqua' : ristagno > 0 ? 'Terriccio fradicio' : FASI[fase].nome,
    ...vistaRistagno(ristagno, asciugaAlGiorno),
    haSete: sete >= FASI[1].da,
    puoAnnaffiare: sete >= SETE_PER_ANNAFFIARE,
    acqua: limita(1 - sete / FASI[4].da),
    ingiallimento: limita((sete - .5) / 3.5),
    terriccio: limita(sete / 1.5),
  };
}
// troppa acqua: quanto (0 = niente), foglie flosce (0..1, per la scena), radici che marciscono,
// e fra quanti giorni il vaso torna asciutto se si salta l'acqua
function vistaRistagno(r, asciugaAlGiorno) {
  return {
    ristagno: r,
    troppaAcqua: r >= FLOSCE_DA,
    marciume: r >= MARCIUME_DA,
    flosce: limita((r - 0.5) / 1.5),
    giorniAsciutto: r > 0 ? Math.max(1, Math.ceil(r / asciugaAlGiorno - 1e-9)) : 0,
  };
}
// fra quanti giorni (con decimali) il terriccio di una pianta sarà da annaffiare, se il tempo resta sereno:
// prima scola l'acqua in più, poi la terra si asciuga
function giorniAllAcqua(c, p, stagione) {
  if (c.sete >= SETE_PER_ANNAFFIARE) return 0;
  const f = FATTORE_SETE[stagione] * (c.rinvaso.stretto ? SETE_VASO_STRETTO : 1);
  return (c.ristagno ?? 0) / (f * scoloSpecie(p)) + (SETE_PER_ANNAFFIARE - c.sete) / (f * SETE_SPECIE[p]);
}
// quanta acqua in più scola dal vaso di una pianta in un giorno, adesso
const asciugaAlGiorno = (c, p, stagione) => FATTORE_SETE[stagione] * scoloSpecie(p) * (c.rinvaso.stretto ? SETE_VASO_STRETTO : 1);
// giorni (interi, per eccesso) che mancano all'inizio dell'anno di gioco indicato
const giorniAllAnno = (stato, anno) => Math.max(1, Math.ceil(((anno - 1) * 28 * GIORNO - (stato.aggiornato - stato.inizio)) / GIORNO - 1e-9));
const giorniFino = (fino, t) => Math.ceil((fino - t) / GIORNO - 1e-9);
function vistaCura(c, t, stagione, vede = 1, pianta = 'acero') {
  const ore = oreParassiti(c, t), om = oreMalattia(c, t), m = MALATTIE[pianta];
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
      visibili: ore >= ORE_NASCOSTI * vede,
      danno: ore > ORE_IN_TEMPO,
      oreInTempo: Math.max(0, Math.ceil(ORE_IN_TEMPO - ore)),
    } : null,
    // malattia: quale, dove, quanto si è estesa (0..1), se c'è già l'avviso, se fa danno
    malattia: c.malattia ? {
      id: c.malattia.id, nome: m.nome, breve: m.breve, segni: m.segni,
      posto: c.malattia.posto,
      grandezza: limita(om / 96),
      visibili: om >= ORE_MALATTIA_NASCOSTA * vede,
      danno: om > ORE_MALATTIA_IN_TEMPO,
      oreInTempo: Math.max(0, Math.ceil(ORE_MALATTIA_IN_TEMPO - om)),
    } : null,
    // la malattia tipica della pianta e i giorni di difesa (rimedio specifico o equiseto)
    tipica: { id: m.id, nome: m.nome, descrizione: m.descrizione },
    difesa: difesa(c, t) ? giorniFino(c.difesa.fino, t) : 0,
    // olio di neem: giorni di protezione dai parassiti
    protezione: protetta(c, t) ? giorniFino(c.protezione.fino, t) : 0,
    // tonico alle alghe: giorni che restano; muschio sul terriccio
    tonico: tonicoAttivo(c, t) ? giorniFino(c.tonico.fino, t) : 0,
    muschio: !!c.muschio,
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
    // meteo di oggi (tipo, ore da/a), cosa cade adesso e se oggi ha già piovuto sulle piante
    meteo: { ...meteoDelGiorno(stato, stato.aggiornato), adesso: cadeAlle(stato, stato.aggiornato),
      piovutoOggi: !!stato.meteo?.ultimaPioggia && giornoLocale(stato.meteo.ultimaPioggia) === giornoLocale(stato.aggiornato),
      // neve a terra e pozzanghere (0..1), per la scena
      neve: stato.meteo?.neve ?? 0, pozze: stato.meteo?.pozze ?? 0 },
    semi: stato.semi,
    vaso: stato.vasi.scelto,
    // catalogo del negozio con lo stato di ogni vaso
    // inUso: sull'acero; su: le piante del giardino che lo hanno
    vasi: VASI.map(v => ({ ...v, tuo: stato.vasi.posseduti.includes(v.id), inUso: stato.vasi.scelto === v.id, su: presenti(stato).filter(p => vasoDi(stato, p) === v.id) })),
    // il vaso di ogni pianta (anche dell'azalea non ancora comprata, per la scena)
    vasiPiante: Object.fromEntries(Object.keys(PIANTE).map(p => [p, vasoDi(stato, p)])),
    // catalogo delle decorazioni: comprate (tua) e messe nel giardino (messa)
    // il momento speciale di adesso (o null)
    evento: eventoDi(stato, stato.aggiornato),
    // disponibile: si può comprare adesso (quelle degli eventi solo durante il loro evento)
    decorazioni: DECORAZIONI.map(d => ({ ...d, disponibile: !d.evento || eventoDi(stato, stato.aggiornato)?.id === d.evento, tua: stato.decorazioni.possedute.includes(d.id), messa: stato.decorazioni.messe.includes(d.id), dove: stato.decorazioni.posti[d.id] ? { ...stato.decorazioni.posti[d.id] } : null })),
    serie: stato.serie.giorni,
    // giorni di riposo pronti, e se oggi ne è arrivato uno nuovo
    riposi: stato.serie.riposi ?? 0,
    riposoNuovo: stato.serie.riposoGuadagnato === stato.oggi.giorno,
    // sfida della settimana: tipo, obiettivo, quanti fatti, testo, premio e giorni che restano
    settimana: stato.settimana ? { tipo: stato.settimana.tipo, obiettivo: stato.settimana.obiettivo, fatti: stato.settimana.fatti,
      fatta: stato.settimana.fatta, testo: SFIDE_SETTIMANA[stato.settimana.tipo](stato.settimana.obiettivo), premio: SEMI.settimana,
      giorniRimasti: 8 - cal.giornoStagione } : null,
    // ampliamenti del giardino: quanti fatti, il raggio dell'isola adesso e il prossimo in vendita (o null)
    ampliamenti: ampliamentiDi(stato),
    raggioIsola: RAGGIO_ISOLA + crescitaIsola(ampliamentiDi(stato)),
    prossimoAmpliamento: AMPLIAMENTI[ampliamentiDi(stato)] ? { ...AMPLIAMENTI[ampliamentiDi(stato)], numero: ampliamentiDi(stato) + 1, di: AMPLIAMENTI.length } : null,
    // attrezzi del negozio, con quelli già tuoi
    attrezzi:ATTREZZI.map(x => ({ ...x, tuo: ha(stato, x.id) })),
    // col bastoncino di bambù: fra quanti giorni (con decimali) ogni pianta vorrà acqua (0 = adesso)
    bastoncino: ha(stato, 'bastoncino') ? Object.fromEntries(presenti(stato).map(p => [p, giorniAllAcqua(curaDi(stato, p), p, cal.stagione)])) : null,
    sete: a.sete,
    salute: a.salute,
    // riserva d'acqua nel terriccio: 1 appena annaffiata, 0 dopo una settimana senz'acqua (stress forte)
    acqua: limita(1 - a.sete / FASI[4].da),
    // 0..1: quanto la pianta sta soffrendo oltre la semplice sete (stress medio e oltre), per la scena
    appassimento: limita((a.sete - FASI[3].da) / (FASI[5].da - FASI[3].da)),
    fase,
    ...vistaAcqua(a.sete, a.ristagno, asciugaAlGiorno(a, 'acero', cal.stagione)),
    haSete,
    puoAnnaffiare: a.sete >= SETE_PER_ANNAFFIARE,
    // 0 = foglie sane, 1 = ingiallite: si vede dal primo giorno, è piena dal quarto
    ingiallimento: limita((a.sete - .5) / 3.5),
    // 0 = terriccio scuro e umido, 1 = chiaro e secco
    terriccio: limita(a.sete / 1.5),
    lungaAssenza: a.sete >= FASI[4].da,
    // sfida di rinascita (o null): fatta, e quanto manca (la chioma più bassa tra le piante, da 0 a 1)
    rinascita: stato.rinascita ? { fatta: stato.rinascita.fatta, premio: SEMI.rinascita, obiettivo: CHIOMA_RINASCITA,
      chioma: Math.min(...presenti(stato).map(p => curaDi(stato, p).salute)),
      sete: presenti(stato).some(p => curaDi(stato, p).sete >= FASI[1].da) } : null,
    germogli: a.germogli.map(g => ({ ...g, potabile: g.lunghezza >= POTABILE_DA })),
    gemme: a.gemme.map(g => ({ ...g })),
    // rami da legare: piega attuale (col filo, quella voluta), stato del filo e segni sulla corteccia
    rami: vistaRami(a.rami, PRESA_AL_GIORNO * vigoreDi(a, cal.stagione, stato.aggiornato)),
    filoDaTogliere: a.rami.some(r => r.filo && r.filo.presa >= 1),
    // cura di ogni pianta: concime, parassiti e protezione (l'acero anche qui sotto, per comodità)
    // le piante del giardino (l'azalea solo se comprata) e quelle in vendita
    piante: presenti(stato),
    // dove sta ogni pianta del giardino ({ x, z, r }) e quanto ingombra
    piantePosti: Object.fromEntries(presenti(stato).map(p => [p, { ...postoPianta(stato, p), raggio: RAGGI_PIANTE[p] }])),
    // dove sta ogni elemento del giardino ({ x, z, r }) e quanto ingombra
    // (tolto: il giocatore l'ha tolto dal giardino)
    elementiPosti: Object.fromEntries(ELEMENTI.map(e => [e.id, { ...postoElemento(stato, e.id), raggio: e.raggio, tolto: tolto(stato, e.id) }])),
    // gli elementi messi da parte, da rimettere dal negozio
    elementiDaParte: ELEMENTI.filter(e => tolto(stato, e.id)).map(e => ({ id: e.id, nome: e.nome })),
    pianteNegozio: PIANTE_NEGOZIO.map(p => ({ ...p, tua: !!stato.conifere[p.id] })),
    cura: Object.fromEntries(presenti(stato).map(p => [p, vistaCura(curaDi(stato, p), stato.aggiornato, cal.stagione, lente(stato), p)])),
    // stile di ogni pianta: quello scelto, i compatibili, i sigilli già presi, i ciuffi tagliati che ricrescono
    stile: Object.fromEntries(presenti(stato).map(p => {
      const c = curaDi(stato, p);
      return [p, { id: c.stile.id, sigilli: [...c.stile.sigilli], tagli: { ...c.tagli }, compatibili: STILI[p].map(s => s.id),
        // stili che si possono scegliere adesso, e fra quanti giorni si sblocca ognuno degli altri
        aperti: STILI[p].filter(s => stileAperto(s, cal.anno, c)).map(s => s.id),
        sblocco: Object.fromEntries(STILI[p].filter(s => !stileAperto(s, cal.anno, c)).map(s => [s.id, giorniAllAnno(stato, s.anno)])) }];
    })),
    // rinvaso di ogni pianta: se serve, se la finestra è aperta, se il vaso è già stretto, quanto manca
    rinvaso: Object.fromEntries(presenti(stato).map(p => {
      const c = curaDi(stato, p), dovuto = rinvasoDovuto(c, cal), finestra = finestraRinvaso(cal) !== null;
      return [p, {
        dovuto, finestra, stretto: vasoStretto(c, cal),
        anniMancanti: dovuto ? 0 : c.rinvaso.primavera + c.rinvaso.durata - primaveraDi(cal),
        giorniAllaFinestra: finestra ? 0 : giorniAllaFinestra(cal),
      }];
    })),
    concime: vistaCura(a, stato.aggiornato, cal.stagione).concime,
    parassiti: vistaCura(a, stato.aggiornato, cal.stagione, lente(stato)).parassiti,
    // inventario: tutti i prodotti del catalogo con le dosi che hai
    prodotti: PRODOTTI.map(p => ({ ...p, dosi: stato.inventario[p.id] ?? 0 })),
    // quaderno del maestro: pagine aperte e quelle ancora da leggere
    quaderno: { pagine: [...(stato.quaderno?.pagine ?? [])], nuove: [...(stato.quaderno?.nuove ?? [])] },
    nomiPiante: PIANTE,
    puoPotare: a.germogli.some(g => g.lunghezza >= POTABILE_DA),
    // oggi la serie ha già avuto la sua azione di cura (acqua o potatura)
    curatoOggi: stato.serie.ultimoGiorno === stato.oggi.giorno,
    annaffiatoOggi: stato.oggi.acqua,
    // sfida del giorno: tipo ('acqua', 'pota', 'filo'), testo da mostrare e se è già fatta
    sfida: stato.oggi.sfida ? { ...stato.oggi.sfida, testo: testoSfida(stato.oggi.sfida), premio: SEMI.sfida } : null,
    // pino e ginepro: la loro acqua (stessi campi dell'acero qui sopra)
    // pino e ginepro: acqua (stessi campi dell'acero), potatura e rami da legare
    conifere: Object.fromEntries(altre(stato).map(p => {
      const c = stato.conifere[p];
      const rami = vistaRami(c.rami, PRESA_AL_GIORNO * PRESA_SPECIE[p] * vigoreDi(c, cal.stagione, stato.aggiornato));
      return [p, {
        ...vistaAcqua(c.sete, c.ristagno, asciugaAlGiorno(c, p, cal.stagione)),
        salute: c.salute,
        germogli: c.germogli.map(g => ({ ...g, potabile: g.lunghezza >= POTABILE_DA })),
        vecchi: c.vecchi.map(x => ({ ...x })),
        puoPotare: c.germogli.some(g => g.lunghezza >= POTABILE_DA) || c.vecchi.length > 0,
        rami, filoDaTogliere: rami.some(r => r.pronto),
        // azalea: boccioli e fiori aperti (0..1, meno se l'anno prima i fiori appassiti sono rimasti,
        // se la chioma è diradata o se ha sete da giorni) e quanto fiorirà
        ...(p === 'azalea' || p === 'ciliegio' ? (() => {
          const f = (p === 'azalea' ? fiorituraDi : fiorituraCiliegio)(cal), forza = c.fiori * Math.min(1, c.salute + .2) * (c.sete >= FASI[3].da ? .3 : 1);
          return { boccioli: f.boccioli * forza, fioritura: f.fiori * forza, forzaFiori: c.fiori };
        })() : {}),
      }];
    })),
  };
}
