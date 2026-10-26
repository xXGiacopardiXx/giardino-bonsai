# Giardino Bonsai sull'iPhone: guida passo passo

Costo: zero. Servono il PC con Windows, l'iPhone e un account GitHub gratuito.

L'app è una **PWA**, cioè un'app web installabile: si apre in Safari, si aggiunge alla schermata Home e da lì si comporta come un'app vera (icona, schermo intero, funziona anche senza internet).

---

## A. Prova veloce in casa (stessa rete Wi-Fi)

Utile mentre si sviluppa: ogni modifica si vede subito sul telefono.

1. Sul PC, nella cartella `app`, avvia il server:
   ```bash
   npm run dev
   ```
2. Nel terminale compare una riga `Network: http://192.168.x.x:5173/`. Se Windows chiede di consentire l'accesso di Node.js alla rete, consenti solo le **reti private**.
3. Sull'iPhone, collegato allo stesso Wi-Fi, apri Safari e scrivi quell'indirizzo.

Limite: funziona solo con il PC acceso e sulla stessa rete. Per averla sempre, segui la parte B.

## B. Installazione permanente (GitHub Pages, gratis)

### Una volta sola

1. Crea un account su [github.com](https://github.com) (gratuito).
2. Crea un nuovo repository: pulsante **New**, nome `giardino-bonsai`, visibilità **Public** (le pagine gratuite richiedono un repository pubblico, quindi il codice sarà visibile a tutti), **senza** README né altri file.
3. Nel repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Sul PC, nella cartella del progetto, collega il repository e invia il codice (sostituisci `TUO-UTENTE`):
   ```bash
   git remote add origin https://github.com/TUO-UTENTE/giardino-bonsai.git
   ```
   ```bash
   git push -u origin main
   ```
   La prima volta si apre il browser per accedere a GitHub.
5. Nella scheda **Actions** del repository parte "Pubblica l'app". Dopo 1–2 minuti l'app è online su:
   `https://TUO-UTENTE.github.io/giardino-bonsai/`

### Sull'iPhone

1. Apri quel link in **Safari** (non in Chrome).
2. Tocca il pulsante **Condividi** (il quadrato con la freccia in su).
3. Scegli **Aggiungi alla schermata Home**, poi **Aggiungi**.
4. Apri l'app dall'icona dell'acero.

### Aggiornamenti

A ogni `git push` l'app online si aggiorna da sola. Sul telefono la nuova versione arriva alla riapertura successiva (a volte serve chiudere l'app e riaprirla due volte).

---

## Da sapere

- **Salvataggi:** restano sul telefono. Se si elimina l'app dalla schermata Home, si perdono. Per questo l'app avrà un'esportazione di backup.
- **Notifiche:** nella versione PWA non ci sono; arriveranno con la versione per gli store.
- **Store:** quando si vorrà pubblicare, costa 99 $ l'anno per l'App Store e 25 $ una tantum per Google Play (vedi `game-design.md`, sezione 11.4).
