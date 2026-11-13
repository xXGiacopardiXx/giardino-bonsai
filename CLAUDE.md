# Giardino Bonsai

Gioco mobile rilassante sulla cura di bonsai digitali in un giardino giapponese. Il progetto è in fase di concept e prototipazione.

## File

- `docs/game-design.md`: tutte le decisioni di design (tempo, cure, trascuratezza, economia, stile, architettura, roadmap). **È la fonte di riferimento**: leggerlo prima di proporre o modificare qualcosa.
- `prototipo/giardino-bonsai.html`: prototipo di stile della homepage, scena 3D in Three.js in un'unica pagina HTML.
- `app/`: l'app vera (PWA), Three.js + Vite in JavaScript semplice. Codice della scena in `app/src/scena/` (germogli, candele e punte della potatura in `germogli.js`, aghi vecchi del pino e fiori appassiti dell'azalea in `aghi-vecchi.js`, rami piegati col filo in `filo.js`, radici e animazione del rinvaso in `rinvaso.js`, sagoma dello stile in `stile.js`, per tutte le piante), interfaccia in `app/src/interfaccia.js`, avvio in `app/src/main.js`.
- Ciliegio giapponese (quinta pianta, come l'azalea: `stato.conifere.ciliegio`, seme `conSeme(5353)` in `alberi.js`, ciliegine con `creaAghiVecchi` in `main.js`, fioritura `fiorituraCiliegio` nel motore).
- Azalea Satsuki (quarta pianta, si compra coi Semi): nel motore sta in `stato.conifere.azalea` solo dopo l'acquisto (`compraPianta`); le piante presenti sono `vista.piante`. Nella scena è costruita sempre in `alberi.js` (nascosta finché non c'è) con un seme suo (`conSeme`), così la sequenza casuale del resto non cambia.
- `app/src/gioco/`: il motore senza grafica (tempo compresso, stato della partita, salvataggio in `localStorage`) con i test in `stato.test.js`. Le funzioni ricevono l'ora come parametro; la scena si disegna solo da `vista(stato)`.
- `app/src/pannello-prova.js`: pannello per far passare il tempo (e azalea e giardino grande in regalo), si apre con 3 tocchi sulla stagione.
- `app/src/guida.js`: guida dei primi passi (una volta sola, flag `guida` nel salvataggio). `app/src/suoni.js`: suoni generati con la Web Audio API, niente file audio. `app/src/musica.js`: musica di sottofondo composta dal codice, con lo stesso contesto audio.
- `app/src/cure.js`: inventario (Cura nella barra) e cura di una pianta (dalla sua tendina); catalogo `PRODOTTI` nel motore, icone in `icone-cura.js`, acquisto nel negozio (scheda Cura); afidi, granuli e spray nella scena in `app/src/scena/cura.js`, per tutte e tre le piante.
- Malattie (una per pianta: oidio, ruggine del pino e del ginepro, galla dell'azalea, corineo del ciliegio): catalogo `MALATTIE` nel motore (`c.malattia`, `c.difesa`, prodotti di tipo `fungicida`), aspetto di ognuna in `MALATTIE` di `scena/cura.js` (`setMalattia`, `spruzza('malattia')`), consiglio del maestro `malattia-<id>`. Attrezzo `lente` per vederle prima.
- `app/src/gioco/stili.js`: catalogo degli stili (sagome, regole e anno di sblocco con `stileAperto`) e valutazione pura della percentuale; scheda e scelta dello stile in `app/src/pannello-stile.js`.
- Quaderno del maestro (modalità didattica, sezione 7.6): catalogo puro delle pagine in `app/src/gioco/quaderno.js` (tecniche, stili, piante col calendario vero) con i test in `quaderno.test.js`; il motore apre le pagine con `apriPagina` (dalle azioni) e `guardaQuaderno` (alla fine di `avanza`), `stato.quaderno` e `leggiPagina`; pannello e disegni in `app/src/pannello-quaderno.js`, aperto dal pulsante "Il quaderno" del pannello del maestro. Ogni specie o stile nuovo deve arrivare con le sue pagine (un test lo controlla).
- `app/src/gioco/maestro.js`: consigli del maestro (riflessione, come si sente ogni pianta dal suo stato, punti col perché; stagione e momenti chiave, letti una volta sola) con i test in `maestro.test.js`; pannello a schede per pianta e pulsante col ritratto in `app/src/consigli.js`.
- `app/src/diario.js`: diario fotografico (foto salvate in IndexedDB, galleria e time-lapse); mirino e scatto in `main.js`, premio della prima foto di stagione nel motore (`fotografa`).
- `app/src/scena/decorazioni.js`: decorazioni del giardino da mettere dove si vuole (catalogo `DECORAZIONI`, acquisti e controllo del posto con `postoLibero`/`posaDecorazione` nel motore; modalità Sposta in `main.js`, che sposta anche le piante: `posaPianta` nel motore, `setPosti`/`provaPosto` in `alberi.js`; scheda Giardino nel negozio); toglie l'erba sotto di loro con `liberaErba` di `giardino.js`.
- `app/src/scena/elementi.js`: elementi del giardino spostabili (lanterna, pietra col muschio, laghetto, cespugli, pietre del sentiero; catalogo `ELEMENTI`, `posaElemento` e `mettiElemento` (togli e rimetti, gratis dalla scheda Giardino del negozio) nel motore, il laghetto porta con sé il ponticello). I gruppi vengono da `giardino.spostabili` e `isola.sasso`; i cerchi nella ghiaia si ridisegnano con `isola.setCerchi`, le foglie seguono l'acero con `giardino.setAcero`. L'erba in più dei posti iniziali ha un seme suo (`conSeme`).
- `app/src/scena/atmosfera.js`: ora del giorno (dall'ora del telefono: cielo, luci, lanterna, lucciole) e meteo (pioggia, temporali con lampi, neve, pozzanghere); il meteo di ogni giorno, la pioggia che annaffia, la neve a terra e le pozzanghere sono nel motore (`meteoDelGiorno`, `cadeAlle`, `stato.meteo`); la neve imbianca il prato con `giardino.setNeve`. Nei test il meteo è spento (`stato.meteo.attivo = false`).
- `app/src/negozio.js`: negozio dei vasi, per tutte le piante (catalogo `VASI`, acquisti e `vasiPiante` nel motore; forme in `VASI_FORME` e misura per ogni pianta con `vasoCambiabile` in `scena/alberi.js`; Aspetto nella tendina di ogni pianta) e degli attrezzi (catalogo `ATTREZZI` e `compraAttrezzo` nel motore, categoria Attrezzi della scheda Cura; il bastoncino di bambù nei vasi in `scena/bastoncini.js`, il muschio sul terriccio in `scena/muschio.js`). Economia controllata dalla simulazione `app/src/gioco/simula.js` (`node src/gioco/simula.js` dalla cartella `app`, e un test).
- Ampliamento del giardino: `AMPLIAMENTI` e `compraAmpliamento` nel motore (`stato.giardino.ampliamenti`, `vista.raggioIsola`); il blocco dell'isola si allarga con `isola.setRaggio`, l'erba dell'anello in più (seme suo) con `giardino.setRaggio`, la telecamera con `ampiezza` in `fit()` di `main.js`.
- Momenti speciali delle stagioni: catalogo `EVENTI`, `eventoDi`, `eventoDaFesteggiare` e `festeggiaEvento` nel motore (`stato.eventi`), decorazioni con `evento` (si comprano solo in quei giorni); pannello in `app/src/eventi.js`, petali, lucciole in più e luna in `scena/atmosfera.js` (`extra.evento`).
- Premi dei momenti belli delle piante (`premiaMomenti`, `stato.premiStagione`) e sfida di rinascita (`stato.rinascita`, `controllaRinascita`, `leggiAvvisoRinascita`) nel motore; neve sulle chiome con `alberi.setNeve`, laghetto ghiacciato in `giardino.setNeve`.
- Serie e sfide nel motore: giorno di riposo in `stato.serie.riposi` (`registraCura`, `leggiAvvisoRiposo`), sfida della settimana in `stato.settimana` (`scegliSettimana`, `contaSettimana`); banner delle sfide (escono da soli dopo 5 secondi) e luna del riposo in `interfaccia.js`, pannello delle sfide (pulsante con la bandierina) in `app/src/sfide.js`.
- `docs/guida-iphone.md`: come provare e installare l'app sull'iPhone, gratis.
- `.github/workflows/pubblica.yml`: pubblica `app/` su GitHub Pages a ogni push su `main`.

## App

- Comandi (dalla cartella `app`): `npm run dev` (server di sviluppo, raggiungibile anche dal telefono in Wi-Fi), `npm run build`, `npm run preview`, `npm test` (test del motore), `npm run icone` (rigenera le icone provvisorie in `public/icone`).
- Three.js r186 con la gestione del colore disattivata e le intensità delle luci moltiplicate per PI: così la scena ha gli stessi colori del prototipo (r128). Mantenerlo quando si aggiungono luci o materiali.
- `base: './'` in `vite.config.js`: l'app deve funzionare in una sottocartella (GitHub Pages).
- I numeri casuali della scena vengono da un'unica sequenza con seme fisso: l'ordine di costruzione in `main.js` conta.
- Utente neofita e budget quasi zero fino all'app funzionante sull'iPhone: niente strumenti a pagamento né che richiedano un Mac.

## Prototipo

- Pubblicato come artifact: https://claude.ai/artifact/L9hqj269PdqfjAopyCABdH
- Per aggiornarlo: modificare il file locale e ripubblicarlo passando questo URL come `url`, così il link resta lo stesso.
- Il file non ha `<!doctype>`, `<html>`, `<head>` né `<body>`: lo scheletro viene aggiunto alla pubblicazione. Va mantenuto così.
- Librerie: Three.js r128 da cdnjs e OrbitControls da jsdelivr. Gli script esterni possono arrivare solo da cdnjs.cloudflare.com, cdn.jsdelivr.net/npm, unpkg.com; i font solo da Google Fonts. Tutto il resto va incluso nella pagina.
- Il prototipo serve a validare design e stile, non è il codice dell'app finale (prevista in Unity).

## Regole di lavoro

- Lingua: italiano, sia nei testi del gioco sia nei documenti.
- Quando si prende o si cambia una decisione di design, aggiornare `docs/game-design.md` (e la data in cima).
- Rispettare i principi fissati nel documento: la pianta non muore mai; il deterioramento è graduale e visibile; l'acqua segue i giorni reali, crescita e stagioni il tempo compresso (4 settimane = 1 anno); niente monetizzazione che faccia leva sul senso di colpa.
- Stile grafico: interfaccia alla Supercell, atmosfera alla Studio Ghibli, giardino-diorama alla Tiny Glade (dettagli nella sezione 9 del documento).
- Salvare ogni passo significativo con un commit git.
