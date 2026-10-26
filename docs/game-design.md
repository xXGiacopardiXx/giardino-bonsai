# Giardino Bonsai: documento di game design

Ultimo aggiornamento: 26/10/2026
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
- La potatura **non completa sfide da sola**: è lo strumento per raggiungere lo stile.

### 7.2 Serie di giorni consecutivi

- Conta un'azione di cura al giorno. Nell'MVP vale l'acqua oppure la potatura; per questo ogni giorno spunta almeno un germoglio da cimare, anche quando l'acqua non serve.
- **Giorno di riposo:** guadagnabile, protegge la serie una volta a settimana.
- Se la serie si interrompe **si dimezza** invece di azzerarsi (40 diventa 20).

### 7.3 Moneta: i Semi

Una sola moneta guadagnata giocando. Un'eventuale moneta a pagamento si valuterà più avanti. I valori sono indicativi e vanno bilanciati.

| Come si guadagna | Semi |
|---|---|
| Acqua del giorno | 5 |
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
- Suoni: fruscio, forbici, acqua che viene assorbita dal terriccio.

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
- **Etichette sulle piante:** nome, stile, percentuale di stile. Avvisi a fumetto ("Ha sete!") sopra la pianta che ne ha bisogno.
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
| **Acqua e Pota** | Filo, Cura, Rinvaso, parassiti, troppa acqua |
| Stagioni compresse (4 settimane = 1 anno), fasi di sete visibili, la pianta non muore | Stili classici con percentuale |
| Serie di giorni (acqua o potatura), Semi, mini-negozio con 4–5 vasi | Decorazioni, ampliamenti, pass, moneta a pagamento |
| Un solo albero in primo piano, il giardino come cornice | Più alberi, zoom a 4 livelli |
| Salvataggio sul telefono | Account, server, notifiche, social |

Al posto della percentuale di stile, l'etichetta mostra l'**età dell'albero** in anni di gioco.

Crescita semplificata (al posto di L-system e *space colonization*): tronco e rami principali fissi, germogli sulle punte. Tagliando una punta, sotto il taglio spuntano 2 gemme che crescono nei giorni successivi.

### 14.2 Fasi

1. **Game design scritto** (questo documento). ✅
2. **Progetto dell'app e PWA:** prototipo portato in `app/`, a schermo intero, installabile sull'iPhone da GitHub Pages.
3. **Motore senza grafica:** stato dell'albero, tempo trascorso calcolato all'apertura, salvataggio, cursore "avanti di N giorni" per i test di trascuratezza e stagioni.
4. **Potatura:** toccare un germoglio, tagliarlo, vedere le gemme ricrescere. È la parte che decide se il gioco è divertente.
5. **Ciclo completo dell'MVP:** stagioni dell'acero, fasi di sete, serie, Semi, negozio dei vasi, breve tutorial, suoni.
6. **Test** con amici tramite il link della PWA (gratis).
7. **Store:** Capacitor, notifiche locali, Google Play e App Store (a pagamento, sezione 11.4).
8. **Versione 1.0:** più specie, filo, giardino con decorazioni, stili, diario fotografico.
9. **Versione 2.0:** social, mostre, realtà aumentata, scansione, promemoria per piante vere.

Squadra: per l'MVP basta una persona. Per la grafica definitiva servirà un artista; per la scansione di livello 2 esperienza di computer vision.

## 15. Questioni aperte

- Nome definitivo del gioco.
- Nome definitivo della moneta (provvisorio: Semi).
- Bilanciamento numerico dell'economia.
- Quante piante può avere il giardino iniziale e quanto costa ogni ampliamento.
- Come si calcola la percentuale di stile (confronto della forma con un modello dello stile).
- Ora delle notifiche: fissa o scelta dal giocatore.
