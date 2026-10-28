# Giardino Bonsai

Gioco mobile rilassante sulla cura di bonsai digitali in un giardino giapponese. Il progetto è in fase di concept e prototipazione.

## File

- `docs/game-design.md`: tutte le decisioni di design (tempo, cure, trascuratezza, economia, stile, architettura, roadmap). **È la fonte di riferimento**: leggerlo prima di proporre o modificare qualcosa.
- `prototipo/giardino-bonsai.html`: prototipo di stile della homepage, scena 3D in Three.js in un'unica pagina HTML.
- `app/`: l'app vera (PWA), Three.js + Vite in JavaScript semplice. Codice della scena in `app/src/scena/` (germogli e gemme della potatura in `germogli.js`), interfaccia in `app/src/interfaccia.js`, avvio in `app/src/main.js`.
- `app/src/gioco/`: il motore senza grafica (tempo compresso, stato della partita, salvataggio in `localStorage`) con i test in `stato.test.js`. Le funzioni ricevono l'ora come parametro; la scena si disegna solo da `vista(stato)`.
- `app/src/pannello-prova.js`: pannello per far passare il tempo, si apre con 3 tocchi sulla stagione.
- `app/src/guida.js`: guida dei primi passi (una volta sola, flag `guida` nel salvataggio). `app/src/suoni.js`: suoni generati con la Web Audio API, niente file audio.
- `app/src/negozio.js`: negozio dei vasi (catalogo `VASI` e acquisti nel motore, forme dei vasi in `scena/alberi.js`).
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
