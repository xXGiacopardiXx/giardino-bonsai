# Giardino Bonsai: documento di game design

Ultimo aggiornamento: 28/10/2026
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

## 5. Piante e stili

### 5.1 Specie

Specie iniziali previste: **pino nero, ginepro, acero giapponese**. Da sbloccare in seguito: ficus, olmo cinese, glicine, azalea e altre.

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

### 6.2 Ritorno dopo una lunga assenza

- All'apertura una breve sequenza: la gemma verde in evidenza e il messaggio *"Ti stava aspettando"*. Nessun rimprovero.
- Ripresa guidata in circa 5–7 giorni reali: acqua, potatura dei rami secchi, concime. La chioma torna in modo visibile giorno dopo giorno.
- Una **sfida di rinascita** con ricompensa.
- Tronco e rami principali restano intatti: chi torna non riparte da zero.

### 6.3 Troppa acqua

Innaffiare più di 2 volte al giorno per più giorni porta a foglie flosce e marciume, che si curano saltando l'acqua per un giorno. Serve a evitare che la strategia migliore sia premere il pulsante dell'acqua a ogni apertura.

**Nell'MVP:** niente marciume. Se il terriccio è ancora umido l'acqua non viene assorbita e compare un messaggio gentile.

### 6.4 Parassiti

- Compaiono **in modo casuale**, più spesso in primavera ed estate o se la pianta è sotto stress.
- Sono visibili prima con lo zoom ravvicinato, poi anche da lontano.
- Sfida: intervenire entro 24 ore. Chi li scopre presto con lo zoom riceve una ricompensa extra.

## 7. Sfide, serie ed economia

### 7.1 Sfide

- **Quotidiane:** per esempio annaffiare una pianta, fare l'azione di stagione.
- **Settimanali:** per esempio rinvasare nella stagione giusta, eliminare i parassiti in tempo.
- **Di lungo periodo:** completare uno stile.
- La potatura **non completa sfide da sola**: è lo strumento per raggiungere lo stile. Unica eccezione, la sfida del giorno "Pota un germoglio": è una cimatura leggera dei germogli nuovi, che non fa male alla pianta.
- **Sfida del giorno nell'app (sempre fattibile):** si sceglie la prima volta che si apre il gioco in quel giorno, guardando la pianta in quel momento: "Annaffia l'acero" se il terriccio è asciutto; altrimenti "Pota un germoglio" (ogni giorno ne spunta almeno uno); in inverno, a giorni alterni, "Metti il filo a un ramo", l'azione tipica della stagione (sezione 4.1). Così il giocatore non trova mai una sfida impossibile, per esempio "Annaffia" con il terriccio ancora umido. Completata, dà 5 Semi.

### 7.2 Serie di giorni consecutivi

- Conta un'azione di cura al giorno. Nell'MVP vale l'acqua oppure la potatura; per questo ogni giorno spunta almeno un germoglio da cimare, anche quando l'acqua non serve.
- **Giorno di riposo:** guadagnabile, protegge la serie una volta a settimana.
- Se la serie si interrompe **si dimezza** invece di azzerarsi (40 diventa 20).

### 7.3 Moneta: i Semi

Una sola moneta guadagnata giocando. Un'eventuale moneta a pagamento si valuterà più avanti. I valori sono indicativi e vanno bilanciati.

| Come si guadagna | Semi |
|---|---|
| Sfida del giorno (acqua, potatura o filo) | 5 |
| Filo tolto al momento giusto | 10 |
| Serie di 7 giorni | 50 |
| Parassiti eliminati in tempo | 20 |
| Rinvaso nella stagione giusta | 40 |
| Fioritura o primi colori autunnali | 30 |
| Stile completato | 300–500 |

| Come si spende | Semi |
|---|---|
| Vaso estetico | 80–300 |
| Decorazione del giardino | 50–200 |
| Nuova specie | 400–1.000 |
| Ampliamento del giardino | 600 → 1.200 → 2.500 (prezzo crescente) |
| Attrezzi (es. forbici concave per tagli più puliti) | 150–400 |

**Regola di bilanciamento:** un giocatore costante deve potersi permettere una cosa piccola ogni 2–3 giorni e una grande ogni 3–4 settimane.

## 8. Giardino

- Il giardino è un'**isola fluttuante** in stile diorama, con ghiaia rastrellata, prato, laghetto, lanterna, staccionata di bambù.
- Contiene più bonsai su supporti (tavolo in legno, lastra di pietra, base in legno) e decorazioni.
- Le decorazioni si comprano con i Semi; lo spazio si amplia a pagamento in Semi.

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
- Diario fotografico con time-lapse dell'albero.
- Realtà aumentata: il bonsai virtuale sulla propria scrivania.
- Gemello digitale: promemoria di cura per la pianta vera collegata alla scansione.
- Modalità didattica sulla tecnica reale del bonsai.

## 14. Roadmap

### 14.1 MVP: poche meccaniche, fatte bene

Obiettivo primario: l'app con le funzioni base funzionante sul proprio iPhone, a costo zero.

| Nell'MVP | Rimandato |
|---|---|
| **Una specie: l'acero giapponese.** Cambia aspetto in ogni stagione (verde, rosso, spoglio), e da spoglio in inverno mostra i rami da potare | Pino, ginepro, altre specie |
| **Acqua, Pota e Filo** (il filo è arrivato dopo l'MVP, sezione 4.2.1) | Cura, Rinvaso, parassiti, troppa acqua |
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
8. **Versione 1.0:** più specie, filo, giardino con decorazioni, stili, diario fotografico. Filo fatto sull'acero (sezione 4.2.1).
9. **Versione 2.0:** social, mostre, realtà aumentata, scansione, promemoria per piante vere.

Squadra: per l'MVP basta una persona. Per la grafica definitiva servirà un artista; per la scansione di livello 2 esperienza di computer vision.

## 15. Questioni aperte

- Nome definitivo del gioco.
- Nome definitivo della moneta (provvisorio: Semi).
- Bilanciamento numerico dell'economia.
- Quante piante può avere il giardino iniziale e quanto costa ogni ampliamento.
- Come si calcola la percentuale di stile (confronto della forma con un modello dello stile).
- Ora delle notifiche: fissa o scelta dal giocatore.
