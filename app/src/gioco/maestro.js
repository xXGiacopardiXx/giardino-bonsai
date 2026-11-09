// I consigli del maestro (game-design.md, sezione 7.4): un vecchio maestro di bonsai che a ogni stagione,
// e in alcuni momenti chiave, spiega cosa chiedono le piante. Per ogni pianta dice come si sente adesso
// (dal suo stato vero: sete, acqua in più, afidi, vaso stretto, chioma) e cosa fare, sempre col perché,
// così il giocatore capisce la pianta invece di seguire una regola. Tono gentile, senza rimproveri né premi.
// Ogni consiglio si mostra una volta sola (stato.maestro.visti). Puro come il resto del motore.
import { vista } from './stato.js';
import { STILI } from './stili.js';

export const NOME_MAESTRO = 'Il maestro Ren';
const STAGIONI = ['Primavera', 'Estate', 'Autunno', 'Inverno'];
const NOMI = { acero: 'Acero', ginepro: 'Ginepro', pino: 'Pino' };
const ORDINE = ['acero', 'ginepro', 'pino'];

// riflessione d'apertura di ogni stagione: due testi, alternati negli anni dispari e pari
const INTRO = [
  ['Senti come è cambiata l\'aria? La linfa risale dalle radici e le gemme si aprono. Per le piante è il momento della forza: tutto quello che fai adesso decide la forma dell\'anno.',
    'Un\'altra primavera. Le piante ricordano l\'inverno passato e ora hanno fretta di crescere. Accompagnale, senza lasciarle correre troppo.'],
  ['Le giornate sono lunghe e il sole è forte. Le piante lavorano tutto il giorno: fanno zuccheri con la luce, e per farlo bevono tanto.',
    'È piena estate. Le piante crescono meno in lunghezza e più in robustezza: il legno si indurisce, le riserve si accumulano.'],
  ['Le notti si fanno fresche. Le piante cominciano a mettere da parte: portano gli zuccheri dalle foglie ai rami e alle radici, per l\'inverno.',
    'L\'anno si chiude piano. È il momento di guardare quello che le piante hanno costruito, e di aiutarle a riposare bene.'],
  ['Il giardino dorme. Sembra tutto fermo, ma sotto il terriccio le radici sono vive e aspettano. Il riposo è cura, non abbandono.',
    'Un altro inverno di silenzio. Le piante risparmiano le forze per la primavera: noi facciamo poco, e lo facciamo bene.'],
];

// cosa fare in ogni stagione, per ogni pianta: { fai, perche }
const AZIONI = {
  acero: [
    [{ fai: 'Pota i germogli lunghi, lasciando una o due coppie di foglie.', perche: 'L\'acero spinge tutta la forza verso le punte. Tagliandole, la linfa si ferma più in basso e sveglia gemme nuove vicino al tronco: la chioma diventa fitta e compatta invece di allungarsi.' },
      { fai: 'Annaffia appena il terriccio si asciuga.', perche: 'Le foglie nuove sono tenere e piene d\'acqua: se le radici restano a secco anche poco, si bruciano ai bordi.' }],
    [{ fai: 'Acqua anche ogni giorno quando fa caldo, ma solo a terriccio asciutto.', perche: 'Le foglie larghe e sottili dell\'acero perdono tanta acqua al sole. Però le radici sempre bagnate restano senz\'aria e marciscono: l\'acqua serve quando manca, non per abitudine.' },
      { fai: 'Un po\' di concime.', perche: 'Dopo la spinta della primavera la pianta deve fare legno e riserve per l\'inverno: il concime le dà il materiale.' },
      { fai: 'Guarda tra i germogli: col caldo arrivano gli afidi.', perche: 'Succhiano la linfa dolce delle punte tenere. Presi presto non fanno danni; lasciati lì, rallentano la crescita.' }],
    [{ fai: 'Annaffia meno.', perche: 'Con le giornate corte le foglie lavorano poco e consumano poca acqua: il terriccio resta umido più a lungo, e acqua in più ristagnerebbe.' },
      { fai: 'Lascia che le foglie cadano da sole.', perche: 'Prima di lasciarle l\'acero ne recupera gli zuccheri e li conserva nei rami: è da questo che nasce il rosso. Strapparle gli toglierebbe le riserve.' },
      { fai: 'Niente concime forte.', perche: 'Farebbe nascere germogli teneri proprio ora, e il primo freddo li brucerebbe.' }],
    [{ fai: 'Metti il filo ai rami da piegare.', perche: 'Senza foglie si vede tutta la struttura, e il ramo fermo si piega senza stress. In primavera, quando ingrossa, il filo andrà tolto prima che segni la corteccia.' },
      { fai: 'Acqua poca, ma il terriccio non deve mai seccarsi.', perche: 'Le radici sono vive anche nel riposo: se seccano adesso, in primavera le gemme non si aprono.' },
      { fai: 'Non concimare.', perche: 'La pianta dorme e non lo userebbe: resterebbe nel vaso, e i sali brucerebbero le radici.' }],
  ],
  ginepro: [
    [{ fai: 'Pizzica le punte nuove con le dita, quando si allungano.', perche: 'Le squame del ginepro tagliate con le forbici imbruniscono sul taglio. Con le dita si stacca solo la parte tenera e la fiammella resta verde; e la forza si divide tra più punte, così la chioma si infittisce.' },
      { fai: 'Annaffia quando il terriccio è quasi asciutto.', perche: 'Il ginepro viene dalle rocce e dai pendii: le sue radici vogliono aria. Nell\'acqua ferma soffocano.' }],
    [{ fai: 'Continua a pizzicare le punte che escono dalla forma.', perche: 'Il ginepro cresce per tutta la bella stagione. Pizzicando poco e spesso la chioma diventa una nuvola fitta, invece di ciuffi lunghi e vuoti dentro.' },
      { fai: 'Acqua a terriccio asciutto, un po\' più spesso col caldo.', perche: 'Le squame trattengono bene l\'acqua, ma il vaso piccolo al sole asciuga in fretta.' }],
    [{ fai: 'Smetti di pizzicare.', perche: 'Le punte nuove ora servono alla pianta: con quelle fa le riserve per l\'inverno.' },
      { fai: 'Annaffia meno.', perche: 'Col fresco il terriccio asciuga piano, e il ginepro teme più l\'acqua in più che la sete.' }],
    [{ fai: 'Lascialo riposare: il colore bronzeo è normale.', perche: 'Col freddo il ginepro produce pigmenti che lo proteggono dal gelo, come una coperta. In primavera torna verde da solo.' },
      { fai: 'Acqua rara, ma mai terriccio secco del tutto.', perche: 'Resta verde e beve ancora un poco anche d\'inverno.' }],
  ],
  pino: [
    [{ fai: 'Cima le candele quando sono allungate e chiare.', perche: 'Il pino cresce a scatti, dalle candele. Accorciandole la forza si divide tra più gemme: i ciuffi di aghi restano corti e i cuscinetti compatti, invece di rami lunghi e spogli.' },
      { fai: 'Annaffia solo quando il terriccio è quasi asciutto.', perche: 'Le radici del pino vivono insieme a un fungo amico che le aiuta a nutrirsi, e quel fungo ha bisogno di aria: nel terriccio zuppo muore.' }],
    [{ fai: 'Acqua a terriccio asciutto, anche se fa caldo.', perche: 'Gli aghi sono stretti e coperti di cera, perdono poca acqua: il pino resiste alla sete molto meglio dell\'acero, e soffre di più l\'acqua in eccesso.' },
      { fai: 'Concime con moderazione.', perche: 'Troppo nutrimento fa aghi lunghi e cuscinetti larghi: nel bonsai si cercano aghi corti.' }],
    [{ fai: 'Togli gli aghi vecchi, quelli gialli verso l\'interno.', perche: 'Gli aghi vivono qualche anno e poi la pianta li lascia. Toglierli fa entrare luce e aria dentro la chioma: così le gemme interne si svegliano invece di seccare.' },
      { fai: 'Annaffia ancora meno.', perche: 'Col fresco il terriccio asciuga piano, e il pino beve poco.' }],
    [{ fai: 'Acqua rara, nelle giornate miti.', perche: 'Il pino resta verde e beve anche d\'inverno, ma lentamente: poca acqua basta.' },
      { fai: 'Controlla il filo.', perche: 'I rami del pino ingrossano piano, ma un filo stretto lascia segni che restano per anni: meglio toglierlo appena ha fatto presa.' }],
  ],
};

// come vive ogni pianta in ogni stagione, quando sta bene
const STA_BENE = {
  acero: ['Si sta svegliando: la linfa sale e apre le gemme, le foglie nuove sono rosse e tenere. È pieno di energia.',
    'Lavora al sole tutto il giorno: le foglie larghe fanno zuccheri e il legno si irrobustisce. Ha sete spesso.',
    'Sta preparando il riposo: porta gli zuccheri nei rami, e per questo le foglie si accendono di rosso prima di cadere.',
    'Dorme spoglio. Non ha bisogno di quasi niente, ma le radici sono vive e aspettano la primavera.'],
  ginepro: ['Mette punte nuove, verde chiaro, su tutte le fiammelle. Cresce senza fretta, ma senza fermarsi.',
    'Sopporta bene il caldo: le squame trattengono l\'acqua. Continua a crescere per tutta l\'estate.',
    'Rallenta e fa scorta di forze. Le squame si induriscono per il freddo che arriva.',
    'Riposa, coperto del suo colore bronzeo contro il gelo. Beve poco.'],
  pino: ['Allunga le candele, le gemme nuove che diventeranno rami. È il suo unico scatto dell\'anno, e ci mette tutta la forza.',
    'Le candele sono diventate aghi nuovi. Ora irrobustisce i rami e beve poco: il caldo non lo spaventa.',
    'Gli aghi più vecchi, all\'interno, ingialliscono: la pianta li sta lasciando andare, è normale.',
    'Resta verde ma è quasi fermo. Il suo è un sonno leggero.'],
};

// come si sente adesso una pianta, dal suo stato: prima i problemi, poi la stagione
function sente(v, p) {
  const c = p === 'acero' ? v : v.conifere[p], cura = v.cura[p], vaso = v.rinvaso[p];
  if (c.marciume) return 'Le radici sono immerse nell\'acqua e non respirano: è come trattenere il fiato. Per questo le foglie si afflosciano, e la chioma si dirada un poco.';
  if (c.ristagno > 0) return 'Il terriccio è zuppo: le radici sono circondate d\'acqua e hanno poca aria. Non soffre ancora, ma sta scomoda.';
  if (c.fase >= 3) return 'Ha sete da giorni: per non perdere acqua chiude le foglie e smette di crescere. Le punte più esterne cominciano a seccare.';
  if (c.haSete) return 'Comincia ad avere sete: il terriccio si è asciugato e le radici cercano umidità.';
  if (cura.parassiti?.visibili) return 'Ha gli afidi sui germogli: le succhiano la linfa delle punte tenere, e si sente stanca.';
  if (vaso.stretto) return 'Le radici hanno riempito il vaso e girano in tondo: non trovano più spazio né nutrimento, e la crescita rallenta.';
  if (c.salute < .7) return 'La chioma si è diradata: sta ricostruendo i rametti persi, piano, con le forze che ha.';
  if (v.meteo.adesso === 'pioggia') return 'Beve la pioggia dalle radici e la sente sulle foglie: per oggi ha tutta l\'acqua che le serve.';
  if (v.meteo.adesso === 'neve') return 'Dorme sotto la neve, al riparo dal vento gelido. Non ha bisogno di niente.';
  if (v.meteo.piovutoOggi) return 'Oggi ha piovuto: il terriccio è ancora fresco e le radici hanno bevuto.';
  return STA_BENE[p][v.stagione];
}

// i consigli dei momenti chiave, in ordine di importanza; null se non è il momento
const MOMENTI = [
  // si apre la finestra del rinvaso per una o più piante che ne hanno bisogno
  (v) => {
    const piante = ORDINE.filter(q => v.rinvaso[q].dovuto && v.rinvaso[q].finestra);
    return piante.length ? { id: `rinvaso-${v.anno}`, titolo: 'Il rinvaso',
      intro: 'Le gemme si gonfiano: le radici si stanno svegliando. Per pochi giorni, a cavallo della primavera, si apre la finestra del rinvaso.',
      piante: piante.map(p => ({ id: p, nome: NOMI[p], sente: 'Le radici hanno riempito il vaso e girano in tondo: non trovano più spazio né nutrimento.', punti: [
        { fai: 'Rinvasa adesso: tocca la pianta e scegli Rinvasa.', perche: 'Si accorciano le radici più lunghe e si mette terriccio nuovo: la pianta ritrova spazio e cibo. Si fa ora perché le radici, appena sveglie, guariscono subito dai tagli.' },
        p === 'acero'
          ? { fai: 'Usa l\'akadama.', perche: 'È argilla cotta in granuli: trattiene l\'acqua dentro i granuli e lascia passare l\'aria tra uno e l\'altro. È proprio quello che vogliono le radici dell\'acero.' }
          : { fai: 'Usa un terriccio drenante, meglio la miscela per conifere.', perche: 'Asciuga in fretta e lascia tanta aria: le radici delle conifere stanno bene a lungo, e il rinvaso dopo si può aspettare di più.' },
      ] })) } : null;
  },
  // all'inizio di un anno nuovo si sbloccano stili più difficili
  (v) => {
    const piante = ORDINE.map(p => ({ p, nuovi: STILI[p].filter(s => (s.anno ?? 1) === v.anno && v.stile[p].aperti.includes(s.id)) })).filter(x => x.nuovi.length);
    return piante.length && v.anno > 1 ? { id: `stili-${v.anno}`, titolo: 'Stili nuovi',
      intro: `Le tue piante hanno vissuto ${v.anno - 1 === 1 ? 'un anno' : (v.anno - 1) + ' anni'} con te. Il tronco si è irrobustito, i rami hanno imparato la loro strada: ora possono provare forme più difficili.`,
      piante: piante.map(({ p, nuovi }) => ({ id: p, nome: NOMI[p], sente: sente(v, p), punti: nuovi.map(s => ({
        fai: `Ora puoi provare il ${s.nome} (${s.sottotitolo.toLowerCase()}): tocca la pianta, poi Stile e Cambia stile.`, perche: s.perche,
      })) })) } : null;
  },
  // la prima pioggia e la prima neve sulle piante
  (v) => {
    const tipo = v.meteo.adesso ?? (v.meteo.piovutoOggi ? 'pioggia' : null);
    const m = tipo && METEO[tipo];
    return m ? { id: tipo, titolo: m.titolo, intro: m.intro,
      piante: ORDINE.map(p => ({ id: p, nome: NOMI[p], sente: sente(v, p), punti: m.punti[p] })) } : null;
  },
  // la prima volta che le radici marciscono per troppa acqua
  (v) => {
    const piante = ORDINE.filter(q => (q === 'acero' ? v : v.conifere[q]).marciume);
    return piante.length ? { id: 'ristagno', titolo: 'Troppa acqua',
      intro: 'Le radici hanno bisogno d\'aria quanto d\'acqua. Nel terriccio, tra un granello e l\'altro, ci sono piccoli spazi: se sono pieni d\'acqua, l\'aria non c\'è più.',
      piante: piante.map(p => ({ id: p, nome: NOMI[p], sente: sente(v, p), punti: [
        { fai: 'Salta l\'acqua finché il terriccio non torna chiaro.', perche: 'Solo asciugando gli spazi tra i granelli si riempiono di nuovo d\'aria, e le radici ricominciano a respirare. La pianta si riprende da sola.' },
        { fai: 'Prima di annaffiare, guarda sempre il terriccio.', perche: 'Scuro vuol dire ancora umido: la pianta non ha sete. L\'acqua si dà quando serve, non a orario.' },
      ] })) } : null;
  },
];

// la prima pioggia e la prima neve (una volta sola): perché quel giorno l'acqua non serve
const METEO = {
  pioggia: { titolo: 'La pioggia',
    intro: 'Oggi piove. Senti l\'odore della terra bagnata? La pioggia bagna il terriccio fino in fondo, piano e in modo uniforme, meglio di qualsiasi annaffiatoio.',
    punti: {
      acero: [{ fai: 'Oggi non annaffiare: ci ha pensato la pioggia.', perche: 'Il terriccio è pieno d\'acqua fino alle radici più basse. Acqua in più non servirebbe: uscirebbe dai fori del vaso, o resterebbe a togliere aria alle radici.' },
        { fai: 'Domani guarda di nuovo il terriccio.', perche: 'Con il cielo coperto le foglie traspirano poco e il vaso asciuga più piano del solito: la sete tornerà più tardi.' }],
      ginepro: [{ fai: 'Lascia sgocciolare il vaso, senza aggiungere acqua.', perche: 'Le conifere vogliono il terriccio quasi asciutto prima di bere di nuovo: dopo la pioggia ci vorrà qualche giorno.' }],
      pino: [{ fai: 'Lascia sgocciolare il vaso, senza aggiungere acqua.', perche: 'Il fungo amico delle radici del pino ha bisogno d\'aria: meglio che il terriccio torni asciutto prima della prossima acqua.' }],
    } },
  neve: { titolo: 'La neve',
    intro: 'Nevica. Il giardino si fa silenzioso e le piante dormono sotto una coperta bianca.',
    punti: {
      acero: [{ fai: 'Lascia la neve sui rami e sul vaso.', perche: 'La neve è una coperta: ripara le radici dal gelo più forte e, sciogliendosi piano, le bagna senza fretta.' },
        { fai: 'Non annaffiare mentre nevica.', perche: 'Sotto la neve il terriccio non si asciuga, e l\'acqua in più potrebbe gelare nel vaso.' }],
      ginepro: [{ fai: 'Non preoccuparti del colore bronzeo.', perche: 'È la sua difesa contro il freddo: con la neve e il gelo il ginepro si protegge da solo.' }],
      pino: [{ fai: 'Se la neve è tanta, scuotila via dai rami.', perche: 'I cuscinetti di aghi la trattengono: troppo peso potrebbe piegare i rami legati col filo.' }],
    } },
};

// il consiglio della stagione in corso (anche già visto): per rileggerlo dal pulsante del maestro
export function consiglioStagione(stato) {
  const v = vista(stato);
  return {
    id: `stagione-${v.anno}-${v.stagione}`, titolo: STAGIONI[v.stagione], intro: INTRO[v.stagione][(v.anno - 1) % 2],
    piante: ORDINE.map(p => ({ id: p, nome: NOMI[p], sente: sente(v, p), punti: AZIONI[p][v.stagione] })),
  };
}

// il consiglio da mostrare adesso (prima i momenti chiave, poi la stagione), oppure null se sono già visti.
// Un consiglio è { id, titolo, intro, piante: [{ id, nome, sente, punti: [{ fai, perche }] }] }
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
