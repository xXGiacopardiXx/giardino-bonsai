# Giardino Bonsai: documento di game design

Ultimo aggiornamento: 13/11/2026
Stato: concept validato, prototipo di stile della homepage completato. Deciso l'MVP (sezione 14.1) e la tecnologia web (sezione 11.4); avviato il progetto dell'app in `app/`.

Questo documento raccoglie tutte le decisioni prese sul gioco. È la fonte di riferimento per design, grafica e sviluppo: quando una decisione cambia, si aggiorna qui.

---

## 1. Visione

Un gioco mobile rilassante in cui ci si prende cura di uno o più bonsai digitali: si annaffiano, si potano, si modellano col filo e si accompagnano nel cambio delle stagioni. Col tempo si costruisce un giardino giapponese personale con più specie e decorazioni.

**Il cuore del gioco:** la potatura è un gesto creativo, non solo manutenzione. Due giocatori con lo stesso albero ottengono risultati diversi.

**Tono:** calmo, curato, mai punitivo. La pianta chiede attenzione ma non muore mai.

**Ispirazioni di genere:** giochi rilassanti (Neko Atsume, Viridi, Grow a Garden, Finch), Tamagotchi senza sensi di colpa, app per le piante vere (PictureThis, Planta).

## 2. Piattaforma e pubblico

- Smartphone iOS e Android, orientamento verticale.
- Sessioni brevi e quotidiane (1–5 minuti), con sessioni più lunghe facoltative per potatura e decorazione.
- Pubblico: chi cerca un gioco rilassante, appassionati di piante e bonsai, chi vuole imparare la tecnica del bonsai.

## 3. Il tempo

### 3.1 Compressione

**4 settimane reali = 1 anno nel gioco.**

| Tempo reale | Tempo nel gioco |
|---|---|
| 1 settimana | 1 stagione |
| 1 giorno | circa 13 giorni |
| 1 ora | circa mezza giornata |

- Ogni settimana l'albero cambia aspetto in modo visibile: è un motivo per tornare.
- Un obiettivo di stile richiede 2–3 anni di gioco, cioè circa 2–3 mesi reali.
- Le stagioni seguono la logica reale: crescita forte in primavera, più bisogno d'acqua in estate, colori in autunno, riposo in inverno.

### 3.2 Eccezione: l'acqua segue i giorni reali

Il bisogno d'acqua si misura in **giorni reali**, non in giorni di gioco (altrimenti servirebbe annaffiare ogni ora). Crescita e stagioni seguono il tempo compresso.

### 3.3 Regole tecniche sul tempo

- L'orario di riferimento arriva **dal server**, mai dall'orologio del telefono, per impedire di imbrogliare. **Nell'MVP si usa l'orologio del telefono:** è un gioco per una persona sola e barare non danneggia nessuno. Il server arriverà con account e parte social.
- La pianta **non viene simulata ad app chiusa**. All'apertura si calcola il tempo trascorso e si ricostruisce lo stato in un solo passaggio.

### 3.4 Ora del giorno e meteo

Il giardino segue **l'ora vera del telefono** e ha un suo **meteo**, che come l'acqua segue i giorni e le ore reali.

- **Ora del giorno:** alba (dalle 5 alle 8), giorno, tramonto (dalle 17.30 alle 21) e notte. Cambiano piano il cielo, la nebbia, il colore e la direzione del sole, la luce del cielo e le nuvole; di notte la luna arriva dall'altra parte e **la lanterna di pietra si accende** davvero, illuminando il prato intorno. D'estate, nelle notti serene, sul prato vagano le **lucciole**.
- **Meteo:** ogni giorno del calendario del telefono può essere sereno o, per qualche ora (da 2 a 5, tra le 6 e le 19), di **pioggia** o, in inverno, di **neve**. Si decide con un caso prevedibile, diverso per ogni partita. Giorni di pioggia: 30% in primavera e autunno, 15% d'estate; neve: 25% d'inverno.
- **La pioggia annaffia davvero** tutte le piante (in un'ora il vaso è bagnato), senza troppa acqua: i vasi hanno i fori. Non conta per la serie né per i Semi, perché non è un'azione del giocatore; se la sfida del giorno era annaffiare una pianta che ha già bevuto la pioggia, la sfida cambia. Annaffiare subito dopo vale come annaffiare col terriccio umido (sezione 6.3).
- **La neve copre i vasi:** finché nevica il terriccio non si asciuga.
- **Neve a terra:** si posa in qualche ora (piena dopo circa 3 ore di neve) e si scioglie piano, in un paio di giorni d'inverno. Nella scena il prato, l'erba e i cespugli si imbiancano (i cespugli di più sulle punte esterne), i fiorellini spariscono e la lanterna ha un cappello di neve.
- **Pozzanghere:** sotto la pioggia si formano sulla ghiaia e accanto al sentiero, luccicano, e si asciugano in una decina d'ore (cinque d'estate).
- **Temporali:** d'estate il 40% dei giorni di pioggia è un temporale: pioggia più fitta, ogni 6–16 secondi un lampo (due bagliori ravvicinati) e qualche istante dopo il tuono, più o meno lontano. Per le piante è una pioggia come le altre.
- **Come si vede:** pioggia a trattini inclinati e cielo grigio; neve a fiocchi che ondeggiano e cielo bianco-azzurro; di notte il cielo coperto è più scuro. Accanto al nome della stagione un'icona: sole, luna, pioggia, temporale o neve.
- **Avvisi:** la prima pioggia e la prima neve le spiega il maestro (sezione 7.4: perché quel giorno l'acqua non serve, perché la neve protegge le radici); dopo, una scritta breve una volta al giorno ("Piove: la pioggia annaffia tutte le piante", "Oggi ha piovuto: le piante hanno già bevuto").
- Più avanti: la neve anche sulle chiome dei bonsai e sulle decorazioni, il laghetto ghiacciato, cerchi d'acqua nelle pozzanghere.

## 4. Azioni di cura

| Azione | Effetto | Frequenza |
|---|---|---|
| **Acqua** | Riporta il terriccio a umido | Ogni giorno reale in estate, ogni 2–3 giorni in inverno |
| **Pota** | Taglia un ramo o un germoglio; la pianta ricresce in base ai tagli | Quando c'è crescita nuova |
| **Filo** | Piega un ramo che col tempo resta in posizione | Soprattutto in inverno |
| **Cura** | Concime, trattamenti contro i parassiti | Concime in autunno, trattamenti quando compaiono i parassiti |
| **Rinvaso** | Cambio di vaso e terriccio | Una volta all'anno di gioco, a fine inverno |

### 4.1 L'azione quotidiana cambia con la stagione

Su un bonsai vero potare ogni giorno è dannoso. Per questo la serie quotidiana richiede **un'azione di cura al giorno**, che varia con la stagione:

| Stagione | Azione quotidiana tipica |
|---|---|
| Primavera | Cimatura dei germogli nuovi (piccola, si può fare ogni giorno) |
| Estate | Acqua più frequente, potatura dei getti lunghi |
| Autunno | Pulizia delle foglie secche, concimazione |
| Inverno | Filo, controllo dei rami, preparazione al rinvaso |

### 4.2 Filo

- Il ramo legato mantiene la nuova posizione dopo un certo tempo.
- Se il filo resta troppo a lungo segna la corteccia. Il segno si nota solo con lo zoom ravvicinato: è un avvertimento discreto.

#### 4.2.1 Come funziona nell'app (acero)

- **Rami:** sull'acero si possono legare tutti e 6 i rami principali: i due bassi, quello in alto a sinistra, quello davanti a destra, quello dietro e la cima. Con il ramo si muovono le sue foglie, i rametti e i germogli. I pallini sono disposti in modo da non sovrapporsi (quello della cima più in alto, quello del ramo dietro spostato a sinistra).
- **Gesto:** Filo (nella barra o nella tendina dell'acero) avvicina la telecamera e mostra un pallino di rame sulla punta di ogni ramo. Trascinandolo su o giù il ramo si alza o si abbassa (si abbassa di più: come nei bonsai veri, i rami bassi danno un'aria antica) e una spirale di filo di rame si avvolge sul ramo. Mettere il filo conta come cura del giorno per la serie.
- **Presa:** il ramo prende la forma crescendo, con lo stesso ritmo dei germogli: circa 3 giorni in primavera, 4 in estate, 7 in autunno, 8 in inverno; sotto stress medio non cresce e il filo lo tiene fermo. Toccando il pallino si vede quanto manca.
- **Togliere il filo:** a forma presa il pallino diventa verde e sul pulsante Filo compare il "!". Toccandolo si toglie il filo: il ramo resta piegato e arrivano 10 Semi. Si può togliere anche prima (con un secondo tocco), ma il ramo torna indietro in proporzione a quanto non ha ancora preso.
- **Segni:** dopo 2 giorni di tolleranza a forma presa, sotto il filo compare una spirale scura sulla corteccia, che si fa piena in 4 giorni; tolto il filo svanisce in circa 20 giorni. Togliendo un filo che ha già segnato la corteccia non si guadagnano Semi, senza rimproveri.

#### 4.2.2 Filo sulle conifere

Pino e ginepro si legano come l'acero: tutti i rami principali (5 sul pino, 4 sul ginepro), con il pallino di rame da trascinare. Il loro legno è più duro e cresce più piano: il filo fa presa in circa il doppio del tempo (pino 0,5, ginepro 0,6 rispetto all'acero), come nei bonsai veri, dove sulle conifere il filo resta mesi. Le altre regole (piega, segni, Semi a filo tolto in tempo) sono le stesse.

### 4.3 Potatura di ogni specie

Ogni specie si pota con la sua tecnica e nel suo momento dell'anno:

- **Acero:** germogli da cimare ogni giorno; sotto il taglio spuntano 2 gemme (sezione 6.1.2).
- **Pino nero:** in primavera e nei primi 3 giorni d'estate spuntano le **candele**: colonne chiare e argentate, gonfie alla base e appuntite, coperte dalle scaglie delle gemme, con gli aghi nuovi ancora stretti attorno e la guaina bruna alla base (2 al giorno in primavera, 1 all'inizio dell'estate, al massimo 4): si cimano con le forbici, e gli aghi nuovi restano corti e la chioma compatta. In **autunno** compaiono ciuffi di **aghi vecchi** ingialliti (uno al giorno, al massimo 3), da togliere a mano: luce e aria arrivano dentro la chioma.
- **Ginepro:** in primavera ed estate escono **punte nuove**, rametti morbidi di squame verde chiaro che escono dalla sagoma e si aprono a ventaglio (una al giorno, al massimo 4), che si **pizzicano con le dita**, senza forbici, così le squame non imbruniscono.
- Le conifere non lasciano gemme dopo il taglio: restano compatte. D'inverno riposano, e sotto stress medio non crescono.
- **Come si fa:** Pota dalla tendina della pianta (sul ginepro si chiama Pizzica), oppure dalla barra: se più piante hanno qualcosa da sistemare si tocca quella giusta. La telecamera si avvicina e i pezzi da togliere brillano.
- **Sfida del giorno:** se l'acero non ha niente da potare, la sfida può essere "Cima le candele del pino", "Togli gli aghi vecchi del pino" o "Pizzica il ginepro".

### 4.4 Rinvaso

Il rinvaso rinnova il terriccio e accorcia le radici. Si fa nella **finestra giusta**, tra la fine dell'inverno (dal 4° giorno) e l'inizio della primavera (fino al 3° giorno), quando le gemme si gonfiano.

- **Ogni quanto, per specie:** acero ogni anno di gioco (giovane e vigoroso); pino e ginepro ogni 2 anni, 3 con la miscela per conifere (crescono piano e stanno bene a lungo nello stesso terriccio). Una partita nuova parte con le piante appena rinvasate: l'acero chiede il primo rinvaso alla fine del primo inverno.
- **Terricci** (negozio, scheda Cura, confezioni da 3 dosi): **Akadama** (25 Semi), argilla giapponese in granuli che va bene per tutte; **Miscela per conifere** (35 Semi), akadama, pomice e lapillo, solo per pino e ginepro, fa durare il rinvaso 3 anni. Si comincia con una dose di akadama.
- **Come si vede:** quando il rinvaso è dovuto, le radici escono dal terriccio e scavalcano il bordo del vaso (fini e rossicce sull'acero, più grosse e chiare sulle conifere). Il pannello Cura della pianta dice come stanno le radici.
- **Come si fa:** **Rinvasa** nella tendina della pianta (usa il terriccio migliore che hai, prima lo specifico) oppure, nel pannello Cura, **Usa** su un terriccio. Una piccola sequenza da gustare (circa 5 secondi): la pianta si abbassa e poi esce dal vaso con uno scatto; si scuote e il terriccio vecchio si sbriciola; le forbici accorciano le radici in tre colpi (con il loro suono) e i pezzetti cadono; piovono i granuli del terriccio nuovo, del suo colore (ocra l'akadama, ocra, bianco e rosso la miscela); la pianta scende piano, si assesta con un rimbalzo, si alza una nuvoletta di polvere e suonano tre note di legno. +40 Semi; conta come cura del giorno. Nella finestra, la sfida del giorno può essere "Rinvasa l'acero" (o il pino, il ginepro).
- **Se si salta la finestra:** il vaso resta stretto fino alla finestra dell'anno dopo: la pianta beve il 25% in più e cresce l'80%. Fuori stagione un messaggio dice quanti giorni mancano; la pianta non muore.

## 5. Piante e stili

### 5.1 Specie

Specie iniziali: **pino nero, ginepro, acero giapponese**. Da comprare coi Semi: **azalea Satsuki** (fatta, sezione 5.4). In seguito: ficus, olmo cinese, glicine e altre.

Ogni specie ha esigenze proprie (acqua, ritmo di crescita, reazione alla potatura), un aspetto proprio nelle stagioni (fioritura, colori autunnali, sempreverde o caduca) e un kit grafico dedicato (foglia, corteccia, colori, fiori).

### 5.2 Stili come obiettivi

L'obiettivo di lungo periodo di ogni albero è uno stile classico. La potatura e il filo sono gli strumenti per arrivarci; la percentuale di stile misura quanto la forma attuale si avvicina allo stile scelto.

- *Chokkan*: eretto formale
- *Moyogi*: eretto informale
- *Shakan*: inclinato
- *Kengai*: a cascata
- *Han-kengai*: semi-cascata
- *Bunjingi*: letterato
- *Fukinagashi*: battuto dal vento
- *Hokidachi*: a scopa
- *Yose-ue*: boschetto

### 5.3 Stili nell'app

- **Stili per pianta**, adatti al tronco e alla specie: acero **Moyogi** (eretto informale, cuscinetti piatti a triangolo) o **Hokidachi** (a scopa, una cupola tonda); pino **Shakan** (inclinato, cuscinetti a mensola e contrappeso) o **Moyogi** (cuscinetti tondi); ginepro **Moyogi** (cuscinetti a nuvola) o **Fukinagashi** (battuto dal vento, tutta la chioma a destra). Si parte con il primo; si cambia quando si vuole, dalla modalità Stile.
- **Sagoma:** ogni stile è una sagoma fatta di ellissoidi attorno alla chioma, nelle coordinate del tronco. In modalità Stile (dalla tendina della pianta) la sagoma si vede come una nuvola chiara e i ciuffi che ne escono brillano.
- **Forbice:** un tocco su un ciuffo lo taglia insieme ai vicinissimi (una sforbiciata), con le foglie o gli aghi che cadono. I ciuffi tagliati ricrescono piano con il vigore della pianta (circa 3 settimane d'estate sull'acero, il doppio sulle conifere): la forma va mantenuta, come nei bonsai veri. Tagliare conta come cura del giorno.
- **Percentuale** (sull'etichetta di ogni pianta e nella scheda dello stile): 35% riempimento (i ciuffi dentro la sagoma ci sono ancora: non tagliati troppo, chioma sana) + 45% pulizia (ogni ciuffo fuori dalla sagoma pesa il doppio, così senza forbice non si arriva al sigillo) + 20% regole dello stile (per esempio "rami bassi abbassati col filo", "ramo basso di contrappeso abbassato", "chioma sana"). La scheda elenca le regole fatte (✓) e da fare (○).
- **Sigillo:** al 90% lo stile è compiuto: un sigillo sulla pianta (la percentuale sull'etichetta diventa rossa con ✓) e 300–500 Semi a seconda dello stile, una volta sola per stile e pianta.
- **Stili sbloccati con l'età:** gli stili più difficili si aprono con gli anni della pianta nel giardino (anni di gioco: 1 anno = 4 settimane reali), così c'è un obiettivo a lungo termine per chi torna ogni giorno.

  | Pianta | Subito | Anno 2 | Anno 3 |
  |---|---|---|---|
  | Acero | Moyogi, Hokidachi | **Bunjingi** (letterato: tronco nudo, chioma piccola in cima; 600 Semi) | **Fukinagashi** (battuto dal vento: chioma tutta a destra; 650 Semi) |
  | Pino | Shakan, Moyogi | **Bunjingi** (pochi cuscinetti in cima, come un pino sulle rocce; 600 Semi) | **Fukinagashi** (pino delle scogliere; 650 Semi) |
  | Ginepro | Moyogi, Fukinagashi | **Bunjingi** (una sola nuvola di squame sul tronco che si torce; 600 Semi) | |

  - Sono più difficili perché la sagoma è piccola o tutta da un lato: bisogna tagliare molti ciuffi e piegare i rami col filo.
  - Nella scelta degli stili quelli chiusi hanno il lucchetto, "Anno N", fra quanti giorni si aprono e il **perché** servono anni, con le parole del maestro (per esempio: il Bunjingi si ottiene togliendo, serve una pianta con un tronco che ha già carattere e la forza di ricacciare dall'alto).
  - All'inizio di un anno nuovo **il maestro** annuncia gli stili che si sono aperti, pianta per pianta, con il perché (sezione 7.4).
  - Lo stile in corso e quelli già sigillati restano sempre scelti, anche se fossero di un anno successivo.

### 5.4 Azalea Satsuki: la quarta pianta

La prima pianta che si compra: **400 Semi**, dal Negozio, scheda Giardino (in cima, con il bordo dorato). Compare sulla ghiaia a destra, dietro al pino, in un vaso tondo di terracotta scura su una lastra di pietra; le decorazioni che erano lì si spostano lì vicino, e lì non se ne possono più posare. Da quel momento ha tutto quello che hanno le altre piante: etichetta, tendina (Acqua, Pota, Filo, Rinvasa, Stile, Cura, Foto), sete, troppa acqua, afidi, concime, rinvaso, filo, stili, foto nel diario, consigli del maestro.

- **Aspetto:** tronco basso e mosso, corteccia bruno-rossiccia, foglie piccole, ovali e scure, fitte.
- **Acqua:** vuole il terriccio sempre un po' umido: asciuga poco meno dell'acero (`SETE_SPECIE` 0,8), molto più delle conifere.
- **Fioritura (il ciclo vero dell'azalea):**
  - dal 2° giorno di primavera spuntano piccoli **boccioli** scuri sulle punte; dal 4° si aprono i **fiori rosa**, uno dopo l'altro, fino a coprire la chioma;
  - il 1° giorno d'estate appassiscono: nei primi due giorni d'estate compaiono **6 fiori appassiti** (rosa sbiadito e marroni), da togliere uno per uno con **Pota** (brillano, come gli aghi vecchi del pino; toccandoli cadono). Valgono come cura del giorno e per la sfida "Togli i fiori appassiti dell'azalea";
  - **se restano**, all'inizio dell'autunno cadono da soli ma la pianta ha speso le forze a fare semi: **l'anno dopo fiorisce la metà**. Tolti tutti, la fioritura torna piena;
  - meno fiori anche con la chioma diradata o con la sete forte.
- **Potatura:** dopo la fioritura (in estate e nei primi 3 giorni d'autunno) mette germogli da potare con le forbici. Il maestro spiega perché non si pota in altri momenti: in primavera si taglierebbero i fiori, in autunno i boccioli dell'anno dopo.
- **Terriccio:** nuovo terriccio **Kanuma** (30 Semi, solo per l'azalea), pomice gialla e acida: il rinvaso dura 3 anni. In akadama sta bene solo un anno.
- **Stili:** Moyogi (cuscinetti tondi a gradini, 350 Semi) e Hokidachi (cupola tonda che in fioritura sembra un mazzo di fiori, 400 Semi).
- **Per provarla:** nel pannello di prova (3 tocchi sulla stagione) c'è "Azalea in regalo", che la mette nel giardino senza spendere Semi.
- **Il maestro:** una scheda anche per l'azalea in ogni consiglio di stagione; alla prima fioritura un consiglio apposta, col perché dei fiori appassiti da togliere; "come si sente" racconta la fioritura e i fiori che appassiscono.

### 5.5 Ciliegio giapponese: la quinta pianta

Scelto dal giocatore tra ciliegio e glicine (13/11/2026). Si compra coi Semi (500, scheda Giardino del negozio; nel pannello di prova c'è "Ciliegio in regalo").

- **Dove sta:** davanti, al centro, tra il laghetto e il sentiero, in un vaso ovale grigio (vaso di partenza, gratis) su una base di legno; se il posto è occupato, lì vicino. Si sposta come le altre.
- **Com'è:** tronco dritto con la corteccia bruno-rossiccia lucida e le strisce orizzontali (lenticelle), rami che si aprono in fuori, foglie ovali verde brillante.
- **Stagioni:** come l'acero perde le foglie. Primavera verde tenero, estate verde pieno, autunno arancio e rosso, spoglio da fine autunno a fine inverno.
- **Fioritura (hanami):** all'inizio della primavera, prima che le foglie si facciano piene: boccioli rosa scuro il 1° e 2° giorno, fiori rosa chiaro dal 3°, pieni il 4° e 5°, poi i petali cadono (si vedono cadere piano attorno alla pianta) e il 7° giorno non ce ne sono più. Più breve di quella dell'azalea: è il bello del ciliegio.
- **Ciliegine:** nei primi due giorni d'estate, dove c'erano i fiori, compaiono le ciliegine rosse (fino a 8). Vanno tolte una per una (Pota): se restano, all'inizio dell'autunno cadono e l'anno dopo il ciliegio fiorisce la metà (come i fiori appassiti dell'azalea).
- **Acqua:** beve quasi quanto l'acero (×0,9).
- **Potatura:** germogli nuovi dal 5° giorno di primavera (dopo la fioritura), per tutta l'estate e nei primi due giorni d'autunno; d'inverno niente. Mentre fiorisce non si pota. La sfida del giorno può chiedere "Togli le ciliegine del ciliegio" o "Pota i germogli del ciliegio".
- **Rinvaso:** ogni 2 anni (akadama: ogni anno).
- **Stili:** Hokidachi (a scopa, quello di partenza, 400 Semi), Moyogi (eretto informale, 350), Kabudachi (a più tronchi, dal 2° anno, 650).
- **Maestro:** consigli di ogni stagione (non potare mentre fiorisce, potare subito dopo, togliere le ciliegine, niente tagli grandi d'autunno perché il ciliegio cicatrizza male, il freddo dell'inverno serve ai boccioli), come si sente in fioritura e con le ciliegine, e una volta sola il consiglio "Hanami" alla prima fioritura.

## 6. Salute della pianta e trascuratezza

**Principio:** il deterioramento è graduale e visibile, la morte non esiste. Si perdono progressi, mai la pianta.

### 6.1 Fasi di disidratazione

Tempi riferiti all'estate; in inverno si allungano di circa 2 volte.

| Senza acqua da | Stato | Cosa si vede | Cosa si perde |
|---|---|---|---|
| 1 giorno | Assetata | Terriccio più chiaro, foglie leggermente spente | Niente |
| **2 giorni** | **Stress lieve** | **Punte gialle su alcune foglie** | La crescita rallenta |
| 4 giorni | Stress medio | Foglie gialle diffuse, qualcuna cade | Crescita ferma |
| 7 giorni | Stress forte | Chioma diradata, rametti fini secchi | Alcuni rametti periferici (la percentuale di stile scende un po') |
| 14+ giorni | Sopravvivenza | Quasi spoglia, ma resta **una gemma verde** ben visibile | Gran parte della ramificazione fine |
| 30+ giorni | Sopravvivenza stabile | Come sopra, **non peggiora più** | Tronco e rami principali **sempre conservati** |

### 6.1.1 Numeri del motore (MVP)

Valori iniziali, in `app/src/gioco/stato.js` e `tempo.js`, da ritoccare con i test sul telefono.

- **Giorni di sete:** giorni reali senza acqua pesati per la stagione di gioco: estate 1, primavera 0,8, autunno 0,7, inverno 0,5. Le fasi della tabella sopra si leggono su questo valore.
- **Ha sete** da 1 giorno di sete; si può annaffiare da 0,5 (prima il terriccio è umido e l'acqua non viene assorbita).
- **Chioma (salute):** da 1 (piena) a 0,2 (minimo garantito). Da 4 giorni di sete si dirada verso 0,85 a 7 giorni, 0,45 a 14 e 0,2 a 30, perdendo al massimo 0,08 al giorno: spariscono prima i ciuffi esterni. Con la pianta annaffiata (sotto i 2 giorni di sete) ricresce di 0,15 al giorno: da quasi spoglia a piena in 5–6 giorni.
- **Nuova partita:** inizia il primo giorno di primavera, con 50 Semi e la pianta un po' assetata, così la prima azione è annaffiarla.
- **Ritorno da 7+ giorni di sete:** messaggio *"Ti stava aspettando"*.

### 6.1.2 Numeri della potatura (MVP)

Valori iniziali in `app/src/gioco/stato.js`, da ritoccare con i test sul telefono.

- **Germogli:** spuntano su 10 punte fisse della chioma. Ogni nuovo giorno ne spunta uno (due in primavera), anche quando si salta avanti di più giorni in una volta, al massimo 5 alla volta: arrivati a 5 ne spuntano di nuovi solo potando. Sotto stress medio (4+ giorni di sete) la pianta non ne mette.
- **Lunghezza:** da 0 a 1 (getto lungo). Un germoglio nuovo nasce a 0,3, cioè già cimabile, così ogni giorno c'è un'azione di cura per la serie. Si può tagliare da 0,25.
- **Crescita:** in estate +0,3 al giorno per i germogli (da cimabile a getto lungo in 2–3 giorni, così si vede crescere giorno per giorno; sull'acero lo stelo si allunga e le foglie si aprono) e +0,5 per le gemme (un ciuffo pieno in 2 giorni). Vigore per stagione: primavera 1,4, estate 1, autunno 0,6, inverno 0,5. Con stress lieve (2–4 giorni di sete) cresce al 40%, con stress medio si ferma.
- **Taglio:** sotto il taglio spuntano 2 gemme, fino a 6 per punta; poi la punta è già fitta e il taglio non ne aggiunge. La potatura conta per la serie ma non dà Semi (sezione 7.1).
- **Comandi:** Pota (dalla barra o dalla tendina dell'acero) avvicina la telecamera all'acero e illumina i germogli da tagliare; un tocco ne taglia uno, che cade nel vaso. Pota ha il badge "!" quando ci sono germogli e oggi non c'è ancora stata un'azione di cura (e la pianta non ha sete).

### 6.1.3 Come si vede la sofferenza

- **Etichetta dell'acero:** sotto il nome la fase (Sta bene, Ha sete, Stress lieve, medio, forte, Sopravvivenza) con un colore che segue la gravità: verde, azzurro, arancione, rosso. Due barre separate: **acqua** (riserva nel terriccio: piena appena annaffiata, vuota dopo una settimana senz'acqua; azzurra, poi arancione, poi rossa) e **chioma** (quanto è folta, in percentuale). Le due cose sono diverse: la sete arriva in un giorno, mentre la chioma si dirada solo dopo vari giorni di stress forte. Per questo si può essere in stress medio con la chioma ancora al 95%.
- **Sulla pianta:** con la sete le foglie ingialliscono e il terriccio schiarisce. Dallo stress medio la chioma si affloscia verso il basso, le foglie diventano spente e marroni, cadono foglie secche e l'anello a terra passa dall'azzurro all'arancione. Con lo stress forte la chioma si dirada.

### 6.1.4 L'acqua di ogni specie

Principio: cura **realistica**, con esigenze diverse per specie (e più avanti per varietà), ma sempre almeno un'azione da fare ogni giorno, per l'abitudine di aprire il giardino.

- **Acero:** foglie larghe e radici fini, asciuga il vaso in circa un giorno d'estate.
- **Pino nero e ginepro:** aghi e squame trattengono l'acqua, e vogliono il terriccio quasi asciutto tra un'annaffiatura e l'altra. Bevono circa un terzo dell'acero (pino 0,28, ginepro 0,33): si possono annaffiare dopo circa 2 giorni d'estate e hanno sete dopo 3–4, il doppio d'inverno. Le fasi della sete sono le stesse dell'acero, ma arrivano più tardi.
- **Come si vede:** come l'acero, anello azzurro a terra e terriccio che schiarisce; gli aghi del pino e le squame del ginepro ingialliscono a chiazze. L'etichetta di ogni conifera mostra la fase ("Sta bene", "Ha sete"...) e la barra dell'acqua.
- **Come si annaffia:** **Acqua** nella barra annaffia la pianta che ha il terriccio asciutto; se sono più d'una, le piante con l'anello azzurro aspettano un tocco per scegliere. Dalla tendina di una pianta (anche pino e ginepro ora hanno **Acqua**) si annaffia lei. Se il terriccio è ancora umido, un messaggio spiega che le conifere lo vogliono quasi asciutto.
- **Sfida del giorno:** se l'acero non beve ma una conifera ha davvero sete, la sfida è "Annaffia il pino" (o il ginepro).
- **Chioma delle conifere:** come l'acero, la sete lunga e gli afidi non trattati la diradano (prima i ciuffi esterni) e le cure la rifanno, ma alla metà del ritmo: aghi e squame durano anni. Gli afidi da soli non la portano sotto la metà; la pianta non muore mai. L'etichetta mostra la barra della chioma con la percentuale, come l'acero (al posto della percentuale di stile, che tornerà con gli stili).

### 6.2 Ritorno dopo una lunga assenza

- All'apertura una breve sequenza: la gemma verde in evidenza e il messaggio *"Ti stava aspettando"*. Nessun rimprovero.
- Ripresa guidata in circa 5–7 giorni reali: acqua, potatura dei rami secchi, concime. La chioma torna in modo visibile giorno dopo giorno.
- Una **sfida di rinascita** con ricompensa.
- Tronco e rami principali restano intatti: chi torna non riparte da zero.

### 6.3 Troppa acqua

Innaffiare più di 2 volte al giorno per più giorni porta a foglie flosce e marciume, che si curano saltando l'acqua per un giorno. Serve a evitare che la strategia migliore sia premere il pulsante dell'acqua a ogni apertura.

**Nell'app (fatto, per tutte e tre le piante):** come nella realtà, l'errore si può fare, ma il gioco avvisa prima e non rimprovera dopo.

- **Prima di annaffiare, solo la prima volta per ogni pianta:** se il terriccio è ancora umido compare una domanda gentile, con il motivo vero ("le conifere vogliono che si asciughi quasi del tutto: troppa acqua fa marcire le radici"). Il pulsante verde è **Aspetto**; accanto, più discreto, **Annaffia lo stesso**. Il pulsante Acqua della barra annaffia solo le piante col terriccio asciutto: per insistere si passa dalla tendina della pianta. Dalla seconda volta la domanda non c'è più: i tempi di ogni specie li ricorda il giocatore. La notifica quando la pianta ha sete resta; se si annaffia col terriccio umido l'acqua viene data e compare solo una scritta breve in basso che fa capire l'errore ("Il terriccio era ancora umido: l'acqua ristagna nel vaso").
- **Ristagno:** l'acqua in più resta nel vaso. Si misura come la sete, in giorni di asciugatura, ed è tanto più alta quanto più il terriccio era bagnato (0,8 annaffiando subito dopo l'ultima volta, al massimo 3). Finché c'è, il terriccio non si asciuga: prima deve scolare l'acqua in più. Scola con il ritmo della sete della specie, ma mai sotto 0,6 al giorno (dai fori del vaso), pesato per la stagione: nelle conifere resta molto più a lungo che nell'acero, ma sempre meno di una settimana.
- **Chioma persa subito:** ogni annaffiatura inutile toglie un po' di chioma, sempre di più se si continua a sbagliare: 4%, poi 8%, 12% e da lì 15% ogni volta. Il conto riparte da capo con un'annaffiatura fatta al momento giusto (terriccio asciutto). La chioma non scende mai sotto il 20%: la pianta non muore. La scritta in basso dice quanta chioma si è persa ("-8% chioma"); la chioma si rifà con le cure, come dopo la sete.
- **Fasi:** una volta di troppo lascia il **terriccio fradicio** (solo un avviso); due (ristagno da 1) danno **troppa acqua**: foglie flosce e crescita dimezzata, la chioma smette di riprendersi; tre (ristagno da 2) le **radici fradice**: niente crescita né germogli nuovi e la chioma si dirada piano, mai sotto il 60%. La pianta non muore.
- **Come si vede:** terriccio quasi nero con un velo d'acqua che luccica in superficie; l'acero afflosciato con foglie di un verde-giallo pallido a chiazze (diverso dal bruno secco della sete); pino e ginepro con gli aghi e le squame più interne che ingialliscono per prime. Sull'etichetta la fase è in blu ("Terriccio fradicio", "Troppa acqua") o in rosso ("Radici fradice") e la barra dell'acqua diventa blu cupo.
- **Come si guarisce:** saltando l'acqua. Il messaggio dice per quanti giorni ("Salta l'acqua per 3 giorni e tornerà come prima"). Annaffiare di troppo non dà Semi né conta per la serie.

### 6.4 Parassiti

- Compaiono **in modo casuale**, più spesso in primavera ed estate o se la pianta è sotto stress.
- Sono visibili prima con lo zoom ravvicinato, poi anche da lontano.
- Sfida: intervenire entro 24 ore. Chi li scopre presto con lo zoom riceve una ricompensa extra.

### 6.5 Cura nell'app: prodotti, inventario, concimi e trattamenti

Si curano tutte e tre le piante: l'acero e le due conifere (pino e ginepro). Anche acqua, potatura e filo valgono per tutte, ognuna con le sue regole (sezioni 6.1.4, 4.3 e 4.2.2).

- **Prodotti:** si comprano nel **negozio, scheda Cura**, a confezioni da 3 dosi; ogni uso consuma una dose. La scheda è divisa in categorie (Concimi, Contro gli afidi, Terricci) con schede compatte come i vasi, tre per riga, le dosi che hai nell'angolo del disegno; se gli articoli non stanno nello schermo l'elenco scorre. Alcuni sono **specifici** per una pianta (più efficaci), altri **generali** per tutte:

| Prodotto | Per | Effetto | Prezzo (3 dosi) |
|---|---|---|---|
| Concime per aceri | acero | concime, crescita ×1,6 | 30 |
| Concime per conifere | pino e ginepro | concime, crescita ×1,6 | 30 |
| Concime universale | tutte | concime, crescita ×1,3 | 20 |
| Sapone molle | tutte | toglie gli afidi | 20 |
| Olio di neem | tutte | toglie gli afidi e li tiene lontani per una stagione (si può usare anche prima) | 35 |
| Piretro naturale | tutte | toglie gli afidi e li tiene lontani per tre giorni | 25 |
| Concime liquido | tutte | concime, crescita ×1,8 ma solo per tre giorni | 25 |
| Concime per azalee | azalea | concime acido, crescita ×1,6 | 30 |
| Tonico alle alghe | tutte | tonico: per una stagione la chioma diradata si riprende il doppio più in fretta; va bene anche d'inverno, non si somma con sé stesso | 35 |
| Muschio per il vaso | tutte | copre il terriccio fino al prossimo rinvaso (si vede nella scena): il vaso asciuga più piano (sete ×0,85) | 20 |
| Kiryu | pino, ginepro, azalea | terriccio: sabbia vulcanica dura; rinvaso ogni 3 anni per pino e ginepro, 2 per l'azalea | 30 |

**Tipologie di cura (12/11/2026):** oltre a concimi, trattamenti e terricci ci sono i **tonici** (aiutano la ripresa, non la crescita) e il **muschio** (bello, e cambia il ritmo dell'acqua: va ricordato, e il bastoncino lo dice). Nel negozio i tonici stanno coi concimi e il muschio coi terricci; nella cura della pianta ognuno ha il suo gruppo, e lo stato della pianta dice se ha il tonico (per quanti giorni) e il muschio.

  Si comincia con un kit: 2 dosi di concime universale e 2 di sapone molle.
- **Inventario:** **Cura** nella barra in basso apre l'inventario: i prodotti che hai, divisi tra concimi e trattamenti, con le dosi rimaste, e un pulsante per il negozio. Da qui non si usano: servono a sapere cosa c'è.
- **Curare una pianta:** si tocca la pianta e nella sua tendina si sceglie **Cura** (pino e ginepro hanno per ora solo questa voce). Il pannello dice come sta (afidi, concime, protezione) e mostra solo i prodotti adatti a lei, prima gli specifici, con il pulsante Usa e le dosi; quelli che non hai sono spenti.
- **Concime** (granuli a lenta cessione color crema, che si vedono sul terriccio della pianta e si consumano con i giorni): dura una stagione (7 giorni). Sull'acero germogli, gemme e presa del filo crescono più in fretta (×1,6 con il concime per aceri, ×1,3 con l'universale) e la chioma si riprende più in fretta; su tutte le piante i parassiti arrivano la metà delle volte. D'inverno la pianta riposa e il concime non serve; finché fa effetto non se ne può dare altro. Conta come cura del giorno. In autunno, a giorni alterni, la sfida del giorno può essere "Concima l'acero" (sezione 4.1).
- **Parassiti (afidi):** al massimo un attacco alla volta per pianta, su uno dei 5 cuscinetti più visibili della chioma. Probabilità al giorno per l'acero: 12% in primavera ed estate, 6% in autunno, mai d'inverno; doppia se ha sete (stress lieve o più). Le conifere, robuste, ne prendono il 60%. Dimezzata con il concime, nulla con l'olio di neem attivo. Il caso è prevedibile: la stessa partita nello stesso giorno dà sempre lo stesso risultato.
- **Come si vedono:** puntini neri e verde chiaro sulle foglie, che crescono di numero e grandezza. Nelle prime 12 ore sono minuscoli e si scoprono solo avvicinandosi; poi l'etichetta della pianta dice "Ha gli afidi", sul pulsante Cura compare il "!" e un messaggio gentile avvisa.
- **Trattamento:** la telecamera si avvicina, lo spray fa una nuvola fine sul cuscinetto e gli afidi cadono e spariscono. Entro 24 ore: +20 Semi; scoperti prima dell'avviso: +10 in più. Il sapone molle senza afidi non si spreca (un messaggio invita a guardare da vicino ogni tanto); l'olio di neem invece si può dare anche prima, come protezione.
- **Se restano:** dopo un giorno la crescita rallenta a metà, la chioma non si riprende e si dirada piano (6% al giorno sull'acero, 3% sulle conifere), mai sotto la metà: la pianta non muore. Trattati tardi non danno Semi, senza rimproveri.
- Concimi e trattamenti su qualunque pianta contano come cura del giorno per la serie.

## 7. Sfide, serie ed economia

### 7.1 Sfide

- **Quotidiane:** per esempio annaffiare una pianta, fare l'azione di stagione.
- **Settimanali:** per esempio rinvasare nella stagione giusta, eliminare i parassiti in tempo.
- **Di lungo periodo:** completare uno stile.
- La potatura **non completa sfide da sola**: è lo strumento per raggiungere lo stile. Unica eccezione, la sfida del giorno "Pota un germoglio": è una cimatura leggera dei germogli nuovi, che non fa male alla pianta.
- **Sfida della settimana nell'app (sempre fattibile):** la settimana è una stagione di gioco. La prima volta che si apre il gioco in una stagione si sceglie un obiettivo da raggiungere a poco a poco, tra quelli possibili in quella stagione: primavera "Cura il giardino N giorni", "Cima N candele del pino" o "Pota N germogli dell'acero"; estate potatura dell'acero, "Pizzica N punte del ginepro" o "Fotografa N piante per il diario" (piante diverse); autunno "Togli N ciuffi di aghi vecchi", foto o giorni di cura; inverno "Metti il filo a N rami" o giorni di cura, e al loro posto "Rinvasa una pianta in tempo" se una pianta va rinvasata e c'è un terriccio adatto nell'inventario. Il primo anno arrivano le più semplici, poi si alternano. L'obiettivo tiene conto dei giorni che restano nella stagione (chi arriva il sesto giorno ha un obiettivo più piccolo). "Elimina i parassiti in tempo" resta fuori: gli afidi arrivano a caso e la sfida potrebbe essere impossibile. Completata dà 50 Semi, che partono dal banner.
- **Banner e pulsante delle sfide:** i banner (del giorno e della settimana, con la barra azzurra e i giorni che restano) compaiono solo per qualche secondo (5) quando c'è qualcosa di nuovo: all'apertura, una sfida nuova, un passo avanti, una sfida completata; poi escono da soli, così non ingombrano il giardino. Le sfide si rivedono quando si vuole col pulsante con la bandierina, sotto quello del maestro (o toccando un banner): un pannello "Le sfide" con la sfida del giorno, quella della settimana (quanto manca e fino a quando) e la serie (quanti giorni al prossimo bonus e al giorno di riposo, o se il riposo è già pronto). Un pallino rosso sul pulsante dice che la sfida del giorno è ancora da fare.
- **Sfida del giorno nell'app (sempre fattibile):** si sceglie la prima volta che si apre il gioco in quel giorno, guardando la pianta in quel momento: "Annaffia l'acero" se il terriccio è asciutto; altrimenti "Pota un germoglio" (ogni giorno ne spunta almeno uno); in inverno, a giorni alterni, "Metti il filo a un ramo", e in autunno, a giorni alterni e se non ha già il concime, "Concima l'acero": le azioni tipiche della stagione (sezione 4.1). Così il giocatore non trova mai una sfida impossibile, per esempio "Annaffia" con il terriccio ancora umido. Completata, dà 10 Semi.

### 7.2 Serie di giorni consecutivi

- Conta un'azione di cura al giorno. Nell'MVP vale l'acqua oppure la potatura; per questo ogni giorno spunta almeno un germoglio da cimare, anche quando l'acqua non serve.
- **Giorno di riposo:** guadagnabile, protegge la serie una volta a settimana. Nell'app: ogni 7 giorni di fila se ne guadagna uno (insieme ai 50 Semi), e se ne tiene uno solo alla volta. Se si salta un giorno, il giorno di riposo lo copre da solo e la serie resta com'è (non cresce per quel giorno); se si saltano due giorni o più non basta, la serie si dimezza e il riposo resta per la volta dopo. Quando c'è, una piccola luna sta accanto alla serie (saltella il giorno in cui arriva); toccando la serie un messaggio spiega come funziona. Quando il riposo ha coperto un giorno, all'apertura lo si dice con calma: "Ieri il giardino ha riposato".
- Se la serie si interrompe **si dimezza** invece di azzerarsi (40 diventa 20).

### 7.3 Moneta: i Semi

Una sola moneta guadagnata giocando. Un'eventuale moneta a pagamento si valuterà più avanti. I valori sono indicativi e vanno bilanciati.

| Come si guadagna | Semi |
|---|---|
| Sfida del giorno (acqua, potatura o filo) | 10 |
| Sfida della settimana | 50 |
| Filo tolto al momento giusto | 10 |
| Serie di 7 giorni | 50 |
| Parassiti eliminati in tempo (entro 24 ore; +10 se scoperti prima dell'avviso) | 20 |
| Rinvaso nella stagione giusta | 40 |
| Prima foto di una pianta in una stagione (diario) | 5 |
| Fioritura o primi colori autunnali | 30 |
| Stile completato | 300–500 |

| Come si spende | Semi |
|---|---|
| Vaso estetico | 80–300 |
| Decorazione del giardino | 50–200 |
| Nuova specie (azalea Satsuki: 400) | 400–1.000 |
| Ampliamento del giardino (sezione 8.5) | 600 → 1.000 → 1.600 (prezzo crescente) |
| Attrezzi (bastoncino di bambù, tronchesino per filo, forbici concave) | 150–250 |

**Attrezzi nell'app** (negozio, scheda Cura, categoria Attrezzi): si comprano una volta e servono per sempre. Aiutano a curare meglio e a capire la pianta, non fanno saltare l'attesa.

| Attrezzo | Semi | Cosa fa |
|---|---|---|
| Bastoncino di bambù | 150 | Infilato nel terriccio resta scuro finché è umido (il trucco vero dei bonsaisti): sull'etichetta di ogni pianta che sta bene, al posto di "Sta bene", compare fra quanto annaffiarla ("Acqua fra 15 ore", "Acqua domani", "Acqua fra 3 giorni"), con il tempo sereno. Il bastoncino si vede anche nella scena, infilato nel terriccio di ogni pianta: la parte vicino alla terra è scura finché il terriccio è umido e torna color bambù quando è asciutto. Aiuta a non dare troppa acqua. |
| Tronchesino per filo | 200 | Il filo si taglia a pezzetti invece di svolgerlo: i segni sulla corteccia spariscono il doppio più in fretta, e il filo tolto con un po' di ritardo (segno leggero) vale ancora il premio. |
| Forbici concave | 250 | Taglio pulito che si chiude presto: dopo la potatura le gemme dell'acero crescono il 40% più in fretta. |

**Regola di bilanciamento:** un giocatore costante deve potersi permettere una cosa piccola ogni 2–3 giorni e una grande ogni 3–4 settimane.

**Verifica (11/11/2026):** una simulazione del motore (`app/src/gioco/simula.js`, controllata da un test) fa giocare per 8 settimane un giocatore costante: ogni giorno la sfida del giorno, l'acqua a chi ha sete, gli afidi tolti, il filo tolto al momento giusto, una foto per pianta a stagione; compra solo i prodotti che gli servono. Con i premi di prima (sfida del giorno 5, della settimana 30) guadagnava circa 22 Semi al giorno: un vaso o una decorazione ogni 5–7 giorni, troppo pochi. Ora la sfida del giorno vale 10 e quella della settimana 50: circa 31 Semi al giorno, cioè una cosa piccola (50–120) ogni 2–4 giorni, l'azalea in meno di due settimane e il primo ampliamento in tre. Gli ampliamenti successivi costano 1.000 e 1.600 (prima 1.200 e 2.500): obiettivi lunghi, da uno e due mesi, non da tre.

### 7.4 I consigli del maestro

Un vecchio maestro di bonsai, **il maestro Ren**, insegna la tecnica vera un po' alla volta, senza manuali. Lo scopo è far **capire** le piante: ogni azione suggerita ha il suo perché (cosa succede dentro la pianta), così il giocatore impara a decidere da solo quando dare più o meno acqua, come tagliare, quando aspettare. Tono gentile, mai rimproveri; i consigli non danno Semi e non sono obblighi.

- **Quando parla:** all'apertura del gioco (e quando l'app torna in primo piano), se c'è un consiglio nuovo, **uno per volta**: se ne ha altri, il pulsante del maestro ha il pallino rosso e li mostra al tocco (o arrivano alla prossima apertura). Mai durante la guida dei primi passi né sopra un'altra cosa aperta (negozio, potatura, filo, stile, foto, Sposta, anteprima del pannello di prova): aspetta la volta dopo.
- **Com'è fatto un consiglio:**
  - una **riflessione** sulla stagione: cosa sta vivendo il giardino (due testi per stagione, alternati negli anni dispari e pari);
  - una **scheda per pianta** (Acero, Ginepro, Pino) con **Come si sente**: preso dal suo stato vero in quel momento (radici fradice, terriccio zuppo, sete da giorni, prima sete, afidi, vaso stretto, chioma diradata), oppure, se sta bene, come vive quella stagione (l'acero che porta gli zuccheri nei rami e per questo si fa rosso, il pino che allunga le candele, il ginepro che si fa bronzeo contro il gelo...);
  - i **punti da fare**, numerati, ognuno con il suo **Perché** (per esempio: si potano i germogli dell'acero perché la linfa, fermata più in basso, sveglia gemme vicino al tronco e la chioma si infittisce; il pino vuole il terriccio quasi asciutto perché le sue radici vivono con un fungo che ha bisogno d'aria; il ginepro si pizzica con le dita perché le squame tagliate con le forbici imbruniscono).
- **Cosa dice**, in ordine di importanza:
  1. **Momenti chiave**, solo per le piante interessate: si apre la finestra del rinvaso (una volta per anno: rinvasare ora e perché, quale terriccio e perché); all'inizio di un anno nuovo, gli stili che si sono aperti (sezione 5.3); la prima volta che le radici marciscono per troppa acqua (una volta sola: saltare l'acqua e perché, guardare il terriccio prima di annaffiare).
  2. **Stagione:** a ogni stagione nuova, per tutte e tre le piante (acqua, potatura, candele, pizzicatura, aghi vecchi, filo, concime, riposo).
- **Come si vede:** un pannello con il ritratto (barba bianca, codino), "Il maestro Ren" e la stagione, la riflessione in corsivo, le schede delle piante e il pulsante **Grazie, maestro**: solo allora il consiglio conta come letto. Se è lungo, la parte della pianta scorre.
- **Pulsante del maestro**, col suo ritratto, sotto quelli dei suoni e della musica: fa rileggere il consiglio della stagione (o quello nuovo, se c'è), con "come si sente" aggiornato a quel momento. Un pallino rosso dice che c'è un consiglio da leggere.
- Nel salvataggio si tengono solo gli ultimi consigli letti.

## 8. Giardino

- Il giardino è un'**isola fluttuante** in stile diorama, con ghiaia rastrellata, prato, laghetto, lanterna, staccionata di bambù.
- Contiene più bonsai su supporti (tavolo in legno, lastra di pietra, base in legno) e decorazioni.
- Le decorazioni si comprano con i Semi; lo spazio si amplia a pagamento in Semi (sezione 8.5).

### 8.1 Diario fotografico

Un album dei ricordi di ogni pianta, per vedere quanto è cambiata con le stagioni e con le cure.

- **Foto** è nella tendina di ogni pianta: la telecamera si avvicina alla pianta e compare il mirino (riquadro 3:4 con gli angoli, nome della pianta in alto). Etichette, barra e pulsanti spariscono; si può ancora girare e zoomare per scegliere l'inquadratura. In basso: Diario (con l'ultima foto in piccolo), il pulsante di scatto, Fine.
- Lo scatto ha un lampo bianco e il clic della macchina. La foto è solo la scena dentro il riquadro, senza anelli della sete né scritte.
- Ogni foto ricorda la data di gioco (stagione, anno, giorno). **La prima foto di ogni pianta in ogni stagione vale 5 Semi**: un invito a tornare a guardarla, non un obbligo. Le altre foto non danno niente.
- **Diario:** una scheda per pianta (Acero, Ginepro, Pino), le foto in griglia dalla più vecchia, con la stagione sotto. Toccandone una si vede grande con la data, le frecce per scorrere, Elimina (con una domanda di conferma) e Torna al diario. **Rivedi la crescita** fa scorrere tutte le foto una dopo l'altra, dalla prima: il time-lapse della pianta.
- Le foto stanno sul telefono (IndexedDB, 600×800 in JPEG), separate dal salvataggio della partita. Al massimo 120 per pianta: oltre, si toglie la più vecchia tranne la prima. Ricominciando la partita il diario si svuota.

### 8.1.1 Vasi per tutte le piante

- Ogni pianta ha il suo vaso, e **ogni vaso comprato va bene per tutte**: la scena lo fa nella misura giusta per ognuna (più stretto e basso per pino, ginepro e azalea), con il fondo appoggiato sul supporto e il terriccio al suo posto. Lo stesso modello si può usare su più piante insieme.
- Vasi di partenza, già posseduti e gratis: acero ovale blu smaltato, pino tondo in cotto, ginepro rettangolare bruno, azalea tondo bruno. Nel negozio si vendono solo gli altri (sette, da 80 a 250 Semi).
- **Aspetto** è nella tendina di ogni pianta: mostra i vasi tuoi, con "In uso" su quello della pianta e "Usa" sugli altri; "Altri vasi nel negozio" porta al negozio ricordando la pianta, e il vaso comprato va subito a lei. Comprato dal negozio aperto dalla barra, va all'acero.

### 8.2 Decorazioni

Ogni decorazione si mette **dove si vuole** sul prato e si gira, così ogni giardino è unico.

| Decorazione | Semi | Dove compare appena comprata |
|---|---|---|
| Pietre impilate | 50 | sul prato, accanto al sentiero |
| Panchina di legno | 90 | dietro al ginepro, rivolta verso la ghiaia |
| Fontana di bambù (shishi-odoshi) | 120 | sul prato a sinistra: il bambù si riempie, si inclina versando nella vasca e torna indietro battendo sulla pietra (un "toc" leggero ogni 9 secondi) |
| Gatto che dorme | 150 | al sole accanto al pino, respira piano |
| Ponticello rosso | 200 | ad arco sopra il laghetto delle carpe |
| Rana di pietra | 60 | piccola, col muschio sulla schiena ("kaeru": tornare) |
| Lanterna di carta | 90 | rossa, appesa a una canna di bambù, dondola piano e brilla appena |
| Vasca tsukubai | 110 | bassa vasca di pietra col mestolo di bambù |
| Ombrellone del tè | 140 | grande ombrello rosso sopra una panca col telo |
| Piccolo torii | 220 | il portale rosso dei santuari, in piccolo |
| Pagoda di pietra | 260 | torre a cinque tetti col muschio |

- Si comprano dal **Negozio, scheda Giardino**. La decorazione comprata spunta con un saltello e le stelline nel suo posto iniziale (o lì vicino, se è occupato) e si passa subito a **Sposta**, per metterla dove si vuole.
- **Sposta:** si entra toccando una decorazione nel giardino, oppure con Sposta nella scheda Giardino. Spariscono etichette e barra; in alto il nome, in basso **Togli**, **Ruota** e **Fatto**.
  - Col dito si trascina la decorazione sul prato (si solleva un poco, come presa in mano); un tocco sul prato la porta lì.
  - Sotto c'è un anello che pulsa: **verde** dove si può posare, **rosso** dove no. Lasciata in un posto sbagliato torna dov'era, con una scritta breve: "Lì è fuori dal prato", "Nel laghetto ci va solo il ponticello", "Lì c'è già qualcosa".
  - Non si può posare sulle piante (con il loro tavolo o la loro lastra), sulla lanterna, sulla pietra col muschio, sopra un'altra decorazione, oltre il bordo del prato né dietro la staccionata. Nel laghetto va solo il ponticello. Sulla ghiaia invece sì.
  - **Ruota** la gira di un ottavo di giro. **Togli** la mette da parte: si rimette con Metti nella scheda Giardino e torna dov'era (o lì vicino, se intanto quel posto si è occupato).
- La posizione e la rotazione di ogni decorazione si salvano nella partita. Dove c'è una decorazione l'erba e i fiorellini non crescono, e la seguono quando si sposta.
- Nessun effetto sulle piante: le decorazioni sono solo per il piacere del giardino.
- Più avanti: altre decorazioni, e forse spostare anche le cose fisse (lanterna, pietre del sentiero).

### 8.3 Piante dove si vuole

Anche i bonsai si spostano, come le decorazioni, così il giardino si compone a piacere.

- **Sposta** è l'ultimo pulsante della tendina di ogni pianta (acero, pino, ginepro e azalea). Si entra nella stessa modalità delle decorazioni: nome in alto, in basso **Ruota** e **Fatto** (niente Togli: le piante restano sempre nel giardino). Etichette, barra e indicatori in alto spariscono.
- La pianta si sposta **con il suo vaso e il supporto** (il tavolo dell'acero, la lastra del ginepro, la base del pino, la lastra dell'azalea): col dito la si trascina (si solleva un poco), o si tocca il prato dove la si vuole. **Ruota** la gira di un ottavo di giro.
- Anello verde dove si può posare, rosso dove no. Non si posa sopra un'altra pianta, una decorazione, la lanterna o la pietra col muschio, nel laghetto, oltre il bordo del prato né dietro la staccionata. Sulla ghiaia sì.
- Spostando la pianta si spostano anche l'anello della sete, l'annaffiatoio, l'etichetta, il punto che la telecamera guarda per Pota, Filo, Stile e Foto, i granuli di concime e le radici del vaso stretto.
- Le posizioni si salvano nella partita (`piantePosti`); una pianta mai spostata sta al suo posto iniziale. Se il posto dell'azalea è già occupato da un'altra pianta quando la si compra, l'azalea va lì vicino.
- Sotto le piante spostate l'erba non cresce. I cerchi rastrellati nella ghiaia seguono il ginepro (sezione 8.4).
- Le foglie d'acero cadute in autunno stanno intorno all'acero, anche dopo averlo spostato.

### 8.4 Ogni elemento del giardino dove si vuole

Oltre a piante e decorazioni, si sposta tutto quello che c'è nel giardino fin dall'inizio, così ogni giardino è unico.

- Elementi spostabili: la **lanterna di pietra** (con la sua luce e il cappello di neve), la **pietra col muschio**, il **laghetto delle carpe** (con ninfee, fiore di loto e carpe), i **sei cespugli** (uno rosso) e le **quattro pietre del sentiero**, una per una.
- Restano fermi solo la cornice dell'isola: la ghiaia, la staccionata di bambù, l'albero dietro e il bambù.
- Un tocco sull'elemento (fuori dalle piante) apre la stessa modalità Sposta delle decorazioni: nome in alto, **Togli**, **Ruota** e **Fatto**. Si trascina col dito o si tocca il prato dove lo si vuole.
- **Togli** mette l'elemento da parte: sparisce dal giardino e non ingombra più (al suo posto ci va altro; la lanterna tolta non fa più luce, nella ghiaia spariscono i suoi cerchi, sotto torna l'erba). Si rimette **gratis** dal Negozio, scheda Giardino, col pulsante **Rimetti**: torna dov'era (o lì vicino, se intanto il posto si è occupato) e si può subito spostare. Gli elementi tolti si salvano nella partita (`elementiTolti`).
- Anello verde dove si può posare, rosso dove no. Nessuna cosa va sopra un'altra; nel laghetto entra solo il ponticello. I cespugli possono stare proprio sul bordo dell'isola; le altre cose no.
- **Laghetto e ponticello**: spostando o girando il laghetto, il ponticello che ci sta sopra lo segue (si vede al momento di posarlo).
- **Ghiaia**: i cerchi rastrellati si ridisegnano intorno a lanterna, pietra col muschio e ginepro quando stanno nella ghiaia; dove non c'è più niente torna la ghiaia a righe.
- **Erba**: dove all'inizio c'erano laghetto, pino e sentiero l'erba c'è (prima mancava); sotto ogni elemento, dovunque sia, l'erba non cresce.
- Le posizioni si salvano nella partita (`elementiPosti`); un elemento mai spostato sta al suo posto iniziale.
### 8.5 Ampliamento del giardino

- **Com'è:** il prato dell'isola si allarga tutto intorno, come in un diorama che cresce: niente isolette staccate né schermate nuove, il giardino resta uno solo. Tre ampliamenti a prezzo crescente, nella scheda Giardino del negozio (per primo, "Prato più grande, 1 di 3"): 600, 1.000 e 1.600 Semi.
- **Quanto:** a ogni passo il raggio dell'isola cresce di 0,6 (da 5,3 a 5,9, 6,5 e 7,1): alla fine il prato è grande quasi il doppio. Cresce tutto il blocco dell'isola (prato, terra, roccia, radici che pendono) e sull'anello nuovo spunta l'erba coi fiorellini. Ghiaia, staccionata, albero dietro e bambù restano dove sono; dietro la staccionata non si guadagna posto.
- **A cosa serve:** più posto per piante e decorazioni, che si sistemano con Sposta. Le cose già messe restano dove sono.
- **Telecamera:** si allontana un po' per inquadrare tutta l'isola (meno di quanto cresce l'isola); col pizzico si torna vicini.
- Comprato un ampliamento, il negozio si chiude, la telecamera mostra l'isola intera e un messaggio lo dice.

## 9. Stile grafico

### 9.1 Direzione

**Realismo stilizzato pittorico:** le forme rispettano la botanica (foglie per specie, struttura dei rami, corteccia, colori stagionali, sintomi di sofferenza), la resa è stilizzata (texture morbide, luce calda e diffusa, colori armonizzati).

Riferimenti:
- **Supercell** per l'interfaccia: bottoni grandi in rilievo, contorni scuri spessi, contatori con icona tonda, badge "!" sull'azione urgente.
- **Studio Ghibli** per l'atmosfera: cielo caldo, nuvole morbide, verdi pieni, dettagli vivi (koi, foglie che cadono, rampicanti).
- **Tiny Glade** per il diorama: isola-giardino, ghiaia rastrellata, generazione procedurale.
- Altri: Botany Manor (piante stilizzate ma precise), Alba: A Wildlife Adventure (luce e colori).

### 9.2 Lo zoom come meccanica

Ogni livello di zoom rivela informazioni utili per giocare, non solo più dettaglio grafico.

| Livello | Cosa si vede | Cosa ci si fa |
|---|---|---|
| 1. Giardino | Sagome, colori di stagione, luce | Si capisce a colpo d'occhio chi sta bene |
| 2. Albero intero | Chioma, rami principali, vaso, terriccio umido o secco | Lavoro sullo stile, scelta di cosa potare, acqua |
| 3. Ramo | Foglie singole, gemme, filo, prime punte gialle, puntini sospetti | Tagli precisi, filo, primi segnali |
| 4. Macro | Venature, corteccia, muschio, parassiti, gocce, segni del filo, tagli che cicatrizzano | Diagnosi precoce, scelta della gemma sopra cui tagliare |

### 9.3 Stagioni, luce e suono

- Primavera fresca e verde chiaro, estate calda e satura, autunno ambrato, inverno freddo e desaturato.
- Suoni: fruscio, forbici, acqua che viene assorbita dal terriccio. Nell'MVP sono generati dal codice (Web Audio API, nessun file audio): brezza leggerissima di sottofondo, scroscio e gocce dell'annaffiatoio, gorgoglio del terriccio che beve, doppio scatto delle forbici, fruscio di foglie (tocco sull'acero, germoglio tagliato che cade), due note per i Semi, un arpeggio luccicante per il vaso nuovo, un piccolo "pop" sui pulsanti. Un pulsante sotto i Semi li accende e spegne; la scelta resta sul telefono.
- Musica: sottofondo leggerissimo nello spirito delle colonne sonore Ghibli (Joe Hisaishi): pianoforte ovattato con un po' di riverbero, arpeggi lenti e un tappeto d'archi morbido, a 62 battiti al minuto, in fa maggiore. Non è un brano registrato: la compone il codice mentre si gioca, su un giro di 8 accordi diverso per ogni stagione (primavera luminosa, estate più piena, autunno malinconico, inverno in re minore e più rado, con meno note). Ogni melodia si sente due volte, poi resta solo l'accompagnamento per un giro, così la musica respira e non stanca; ogni tanto un luccichio da carillon. La stagione cambia solo alla fine del giro, per non spezzare la frase. Parte piano dopo il primo tocco; un pulsante con la nota, sotto quello dei suoni, la accende e spegne a parte, e la scelta resta sul telefono.
- Sull'iPhone suoni e musica si sentono anche con il telefono in modalità silenziosa (sessione audio "playback", da iOS 17): per il silenzio ci sono i due pulsanti del gioco.

### 9.4 Indicazioni per l'artista

- Fissare per prima una "bibbia visiva": colori, livello di stilizzazione, una specie completa (consigliato il pino) nei 4 livelli di zoom.
- Ogni specie è un kit grafico separato, aggiungibile senza toccare il motore.

## 10. Homepage (validata col prototipo)

- **Tendine e banner della sfida:** quando si apre la tendina di una pianta, la sua etichetta passa sopra al banner della sfida del giorno, che si fa trasparente e lascia passare i tocchi: le azioni non restano mai coperte.

Riferimento: `prototipo/giardino-bonsai.html`, pubblicato su https://claude.ai/artifact/L9hqj269PdqfjAopyCABdH

Elementi:
- **In alto a sinistra:** stagione con i 7 giorni della settimana (il giorno corrente evidenziato).
- **In alto a destra:** Semi con pulsante "+" verso il negozio.
- **Sotto:** serie di giorni consecutivi.
- **Scheda "Sfida del giorno"** con barra di avanzamento e ricompensa.
- **Etichette sulle piante:** nome, stile, percentuale di stile. Avvisi a fumetto ("Ha sete!") sopra la pianta che ne ha bisogno. Sulla pianta curata (l'acero nell'MVP) l'etichetta mostra invece fase, acqua e chioma (sezione 6.1.3).
- **Tendina della pianta:** toccando l'acero si apre sotto la sua etichetta una tendina con Acqua, Pota e Aspetto. Aspetto mostra gli oggetti già comprati (per ora i vasi) da mettere in uso, con un pulsante verso il negozio. Il negozio serve solo a comprare: i vasi già comprati vi risultano "Già tuo". Toccando pino o ginepro un messaggio ricorda che per ora si cura solo l'acero.
- **Barra in basso:** Acqua, Pota, Filo, Cura, Negozio. Il pulsante dell'azione urgente si evidenzia con un badge "!".
- **Scena:** ruotabile col dito, zoom con il pizzico.

Stato del prototipo: funziona solo l'annaffiatura (annaffiatoio animato, pino che torna verde, terriccio che si scurisce, sfida completata, +5 Semi). Gli altri strumenti mostrano un messaggio esplicativo. Gli alberi sono forme generate dal codice, non modelli definitivi.

## 11. Architettura tecnica

### 11.1 L'albero come dati

L'albero è salvato come **struttura di rami** (grafo: ogni ramo con punto di partenza, direzione, spessore, età, gemme, foglie) più parametri di specie, non come modello 3D. Vantaggi:
- la crescita e la potatura lavorano direttamente sulla struttura;
- i salvataggi sono leggeri e sincronizzabili;
- la futura funzione di scansione dovrà solo riempire questa struttura.

### 11.2 Crescita procedurale

- Algoritmi di riferimento: L-system, *space colonization*, più regole botaniche (dominanza apicale, gemme dormienti che si attivano sotto un taglio).
- Il comportamento deve essere credibile: tagliando la punta spuntano gemme sotto il taglio.
- **È la parte da prototipare per prima**: se la potatura non dà soddisfazione, il resto non conta.

### 11.3 Prestazioni

- Foglie raggruppate a ciuffi da lontano, foglie singole da vicino, con transizione graduale.
- Texture a strati: il micro-dettaglio (rilievo, licheni, crepe) si carica solo da vicino.
- Giardino semplificato quando si guarda dall'alto.
- Dettaglio massimo solo nella zona inquadrata.

### 11.4 Tecnologie

Decisione del 26/10/2026: si resta sul web, riusando il prototipo. Vincoli: sviluppatore unico alle prime armi, budget quasi zero fino all'app funzionante sul proprio iPhone.

- **App:** Three.js + Vite, JavaScript semplice, nella cartella `app/`.
- **Sul telefono, gratis:** **PWA** (app web installabile). Si apre in Safari e si aggiunge alla schermata Home: icona, schermo intero, funziona anche offline. Non servono Mac, Xcode né account sviluppatore.
- **Hosting gratuito:** GitHub Pages, aggiornato in automatico a ogni invio del codice.
- **Salvataggio:** sul telefono (`localStorage`), con esportazione e importazione di un file di backup.
- **Store (più avanti, a pagamento):** la stessa app impacchettata con **Capacitor**. Android: 25 $ una tantum per Google Play. iPhone: 99 $ l'anno per l'Apple Developer Program, più un Mac o un servizio di compilazione online.
- **Unity o Godot:** solo se in futuro serviranno realtà aumentata o scansione.
- **Backend:** non serve nell'MVP. Più avanti Firebase o Supabase per account, salvataggi nel cloud e parte social.
- **Notifiche:** al massimo una al giorno, tono gentile (es. *"Il tuo acero ha sete"* al 2° giorno). Nella PWA su iPhone le notifiche richiedono un server di invio, quindi arrivano dopo l'MVP; con Capacitor diventano notifiche locali, senza server.

## 12. Monetizzazione

- **Sì:** estetica (vasi, decorazioni, temi del giardino), specie rare, pass stagionali, abbonamento con funzioni avanzate (scansione, promemoria per piante vere).
- **No:** "paga per non aspettare" aggressivo, far sentire che l'albero soffre per spingere a pagare.

## 13. Funzioni future

### 13.1 Scansione della pianta reale (a pagamento)

Rimandata. Promessa corretta: *"ricrea il tuo bonsai nel giardino"*, non *"copia identica"*.

- **Livello 1:** riconoscimento della specie da foto, stima di altezza, inclinazione e stile, generazione di un albero simile, editor con la foto sovrapposta.
- **Livello 2:** video intorno alla pianta o sensore LiDAR, nuvola di punti, estrazione dello scheletro di rami, albero digitale agganciato.
- **Livello 3:** copia ramo per ramo; problema ancora aperto nella ricerca.

### 13.2 Altro

- Social: visite ai giardini degli amici, mostre stagionali con voti, scambio di talee.
- Realtà aumentata: il bonsai virtuale sulla propria scrivania.
- Gemello digitale: promemoria di cura per la pianta vera collegata alla scansione.
- Modalità didattica sulla tecnica reale del bonsai.

## 14. Roadmap

### 14.1 MVP: poche meccaniche, fatte bene

Obiettivo primario: l'app con le funzioni base funzionante sul proprio iPhone, a costo zero.

| Nell'MVP | Rimandato |
|---|---|
| **Una specie: l'acero giapponese.** Cambia aspetto in ogni stagione (verde, rosso, spoglio), e da spoglio in inverno mostra i rami da potare | Pino, ginepro, altre specie |
| **Acqua, Pota, Filo, Cura e Rinvaso** (arrivati dopo l'MVP, sezioni 4.2–4.4 e 6.5), poi **troppa acqua** (sezione 6.3) | |
| Stagioni compresse (4 settimane = 1 anno), fasi di sete visibili, la pianta non muore | Stili classici con percentuale |
| Serie di giorni (acqua o potatura), Semi, mini-negozio con 4–5 vasi | Decorazioni, ampliamenti, pass, moneta a pagamento |
| Un solo albero da curare (l'acero); il giardino è un ecosistema di piante, ognuna nel suo spazio: pino e ginepro restano, per ora senza cure | Cure per più alberi, zoom a 4 livelli |
| Salvataggio sul telefono | Account, server, notifiche, social |

Al posto della percentuale di stile, l'etichetta mostra l'**età dell'albero** in anni di gioco.

Crescita semplificata (al posto di L-system e *space colonization*): tronco e rami principali fissi, germogli sulle punte. Tagliando una punta, sotto il taglio spuntano 2 gemme che crescono nei giorni successivi.

### 14.2 Fasi

1. **Game design scritto** (questo documento). ✅
2. **Progetto dell'app e PWA:** prototipo portato in `app/`, a schermo intero, installabile sull'iPhone da GitHub Pages. ✅ (manca solo la messa online, vedi `docs/guida-iphone.md`)
3. **Motore senza grafica:** stato dell'albero, tempo trascorso calcolato all'apertura, salvataggio, cursore "avanti di N giorni" per i test di trascuratezza e stagioni. ✅ Il pannello di prova si apre toccando 3 volte la stagione. Per ora il motore guida il pino del prototipo; la scena resta autunnale anche se la stagione cambia (si sistema nella fase 5 con l'acero).
4. **Potatura:** toccare un germoglio, tagliarlo, vedere le gemme ricrescere. È la parte che decide se il gioco è divertente. ✅ Numeri nella sezione 6.1.2. Come la sete, per ora la potatura è sul pino; nella fase 5 passa all'acero. Da verificare sul telefono se il gesto dà soddisfazione. Dopo la prima prova sul telefono: bonsai più realistici, con ciuffi di aghi (pino, ginepro), foglie palmate (acero), corteccia e rametti dentro la chioma.
5. **Ciclo completo dell'MVP:** stagioni dell'acero, fasi di sete, serie, Semi, negozio dei vasi, breve tutorial, suoni. Fatto: sete e potatura sono passate dal pino all'acero; l'acero cambia colore giorno per giorno (verde chiaro in primavera, verde pieno in estate, rosso in autunno), in inverno perde le foglie nei primi giorni, resta spoglio e l'ultimo giorno rimette le foglie nuove. Le foglie cadono nel giardino solo tra autunno e inizio inverno. I germogli dell'acero nascono dalla punta di un rametto della chioma (così sono sempre attaccati alla pianta) e sono uno stelo curvo, sottile in cima, che sfuma dal colore del legno al rosso, con coppie di foglie opposte a 7 lobi che si aprono man mano che crescono; sporgono dalla chioma e sono rosso tenero sul verde (verde chiaro sul rosso e sui rami spogli). Ogni albero ha una chioma con un carattere proprio: l'acero foglie a mano larghe e ariose, il pino ciuffi di aghi lunghi a spazzola, il ginepro fiammelle a squame fitte, verde-azzurro. Le stagioni si vedono in tutto il giardino: l'acero ha colori ben distinti (verde tenero, verde intenso, rosso fuoco, spoglio), l'albero di sfondo fiorisce di rosa in primavera, è verde d'estate, giallo oro in autunno e spoglio d'inverno, il ginepro d'inverno si fa bronzeo. Le foglie che cadono e quelle a terra hanno la forma della foglia d'acero. Cielo e prato restano uguali tutto l'anno. Negozio dei vasi fatto: si apre da Negozio e dal "+" dei Semi, ha 5 vasi per l'acero (ovale blu smaltato già posseduto; tondo in terracotta 80, rettangolare in grès 120, ovale celadon 180, crema con piedini a nuvola 250 Semi). Il vaso comprato va subito all'acero; quelli già comprati si rimettono con "Usa" da Aspetto. Quando il vaso cambia fa un saltello e intorno girano stelline dorate per un paio di secondi. Se mancano Semi il negozio dice quanti, senza spingere. Suoni e musica di sottofondo fatti (sezione 9.3). Guida dei primi passi fatta: alla prima partita un fumetto in alto accompagna 7 passi brevi (benvenuto, annaffiare, i Semi, potare un germoglio, le gemme, la tendina dell'acero, "torna domani"); i passi di Acqua e Pota aspettano che il giocatore faccia l'azione, e si saltano se non servono. Il pulsante interessato rimbalza. Chi stava già giocando non la vede; si può rivedere dal pannello di prova. Fase 5 completata ✅.
6. **Test** con amici tramite il link della PWA (gratis).
7. **Store:** Capacitor, notifiche locali, Google Play e App Store (a pagamento, sezione 11.4).
8. **Versione 1.0:** più specie, filo, giardino con decorazioni, stili, diario fotografico. Filo fatto sull'acero (sezione 4.2.1). Diario fotografico fatto (sezione 8.1). Prime 5 decorazioni fatte, da mettere dove si vuole (sezione 8.2). Cura fatta: concime e afidi con trattamento (sezione 6.5). Giorno di riposo della serie, sfida della settimana e attrezzi fatti (sezioni 7.1–7.3). Ampliamento del giardino fatto (sezione 8.5). Ciliegio giapponese, la quinta pianta (sezione 5.5); vasi per tutte le piante (sezione 8.1.1). Pacchetto di oggetti: 6 decorazioni nuove (11 in tutto), 2 vasi nuovi per l'acero (7 in tutto: ovale rosso smaltato 160, esagonale nero 220) e 6 prodotti di cura nuovi, con tonici e muschio (sezioni 6.5 e 8.2).
9. **Versione 2.0:** social, mostre, realtà aumentata, scansione, promemoria per piante vere.

Squadra: per l'MVP basta una persona. Per la grafica definitiva servirà un artista; per la scansione di livello 2 esperienza di computer vision.

## 15. Questioni aperte

- Nome definitivo del gioco.
- Nome definitivo della moneta (provvisorio: Semi).
- Bilanciamento numerico dell'economia: verificato con la simulazione (sezione 7.3); da riguardare quando arrivano stili completati e premi di fioritura, che la simulazione non conta ancora.
- Quante piante può avere il giardino iniziale. (Ampliamenti decisi: tre, a 600, 1.000 e 1.600 Semi, sezione 8.5.)
- Come si calcola la percentuale di stile (confronto della forma con un modello dello stile).
- Ora delle notifiche: fissa o scelta dal giocatore.
