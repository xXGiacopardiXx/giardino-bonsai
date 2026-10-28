// "Il tuo parere" (fase 6 della roadmap: prova con gli amici). Tre domande veloci e un commento;
// "Invia" apre la condivisione del telefono (WhatsApp, Messaggi, Mail…) con un testo già pronto,
// così il parere arriva direttamente a chi ha mandato il link. Niente server né account.
// Il testo include versione, punto della partita e ultimo errore, per capire cosa è successo.
// Al secondo giorno in cui si apre il gioco compare, una volta sola, un invito gentile.

const CHIAVE = 'giardino-bonsai:parere';
const CHIAVE_ERRORE = 'giardino-bonsai:ultimo-errore';
const leggi = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const scrivi = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* niente da fare */ } };

// l'ultimo errore del gioco resta sul telefono e finisce nel parere
export function registraErrori() {
  const salva = (msg) => scrivi(CHIAVE_ERRORE, { msg: String(msg).slice(0, 200), quando: new Date().toISOString() });
  window.addEventListener('error', e => salva(e.message));
  window.addEventListener('unhandledrejection', e => salva(e.reason?.message || e.reason));
}

const FOGLIA = (on) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.2 5 4.8-2-1.8 5 4.8 1.8-4.6 2.4 1.6 4.8-5-2.2L12 22l-2-5.2-5 2.2 1.6-4.8L2 11.8 6.8 10 5 5l4.8 2Z" fill="${on ? '#e3462a' : '#e6dcc6'}" stroke="#3b2716" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
const DOMANDE = [
  { id: 'relax', testo: 'Ti ha rilassato?', tipo: 'foglie' },
  { id: 'chiaro', testo: 'Era chiaro cosa fare?', tipo: 'foglie' },
  { id: 'torni', testo: 'Ci torneresti domani?', tipo: 'scelta', scelte: ['Sì', 'Forse', 'No'] },
];

// info(): righe sul punto della partita; avviso(testo): un messaggio breve a schermo
export function creaParere({ info, avviso }) {
  const el = document.createElement('section');
  el.className = 'negozio parere'; el.hidden = true;
  el.innerHTML = `
    <div class="negozio-pannello" role="dialog" aria-modal="true" aria-labelledby="parere-titolo">
      <div class="negozio-testa">
        <h2 id="parere-titolo">Il tuo parere</h2>
        <button class="negozio-x" data-a="chiudi" aria-label="Chiudi">×</button>
      </div>
      <p class="negozio-sotto">Bastano 30 secondi. Ogni risposta aiuta il giardino a crescere.</p>
      ${DOMANDE.map(d => `<div class="parere-dom"><span class="parere-q">${d.testo}</span><div class="parere-r" data-d="${d.id}">${
        d.tipo === 'foglie' ? [1, 2, 3, 4, 5].map(n => `<button class="parere-foglia" data-v="${n}" aria-label="${n} su 5">${FOGLIA(false)}</button>`).join('')
          : d.scelte.map(s => `<button class="parere-scelta" data-v="${s}">${s}</button>`).join('')
      }</div></div>`).join('')}
      <textarea class="parere-testo" rows="3" maxlength="600" placeholder="Cosa ti è piaciuto? Cosa ti ha confuso?"></textarea>
      <button class="negozio-vai parere-invia" data-a="invia">Invia il parere</button>
    </div>`;
  document.getElementById('screen').appendChild(el);
  const risposte = {}, testo = el.querySelector('.parere-testo');

  function chiudi() { el.hidden = true; }
  el.addEventListener('click', (e) => {
    if (e.target === el) { chiudi(); return; }
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.a === 'chiudi') { chiudi(); return; }
    if (b.dataset.a === 'invia') { invia(); return; }
    const gruppo = b.closest('.parere-r'); if (!gruppo) return;
    const d = gruppo.dataset.d, v = b.dataset.v;
    risposte[d] = v;
    // le foglie si accendono fino a quella toccata; le scelte ne accendono una
    gruppo.querySelectorAll('button').forEach(x => {
      const on = x.classList.contains('parere-foglia') ? +x.dataset.v <= +v : x.dataset.v === v;
      x.classList.toggle('on', on);
      if (x.classList.contains('parere-foglia')) x.innerHTML = FOGLIA(on);
    });
  });

  function messaggio() {
    const voto = (id) => risposte[id] ? `${risposte[id]}/5` : '–';
    const err = leggi(CHIAVE_ERRORE, null);
    return [
      `🍁 Giardino Bonsai: il mio parere (v${__VERSIONE__})`,
      `Rilassante: ${voto('relax')}`,
      `Chiaro cosa fare: ${voto('chiaro')}`,
      `Ci tornerei domani: ${risposte.torni || '–'}`,
      testo.value.trim() ? `\n${testo.value.trim()}\n` : '',
      '—',
      ...info(),
      `Telefono: ${navigator.userAgent.match(/\(([^)]+)\)/)?.[1] || navigator.userAgent}`,
      err ? `Ultimo errore: ${err.msg} (${err.quando.slice(0, 16).replace('T', ' ')})` : '',
    ].filter(Boolean).join('\n');
  }

  async function invia() {
    const text = messaggio();
    if (navigator.share) {
      try { await navigator.share({ text }); fatto(); return; }
      catch (e) { if (e.name === 'AbortError') return; }  // ha chiuso la condivisione: resta tutto com'è
    }
    try { await navigator.clipboard.writeText(text); fatto('Parere copiato: incollalo in un messaggio a chi ti ha mandato il gioco.'); }
    catch (e) { avviso('Non riesco a condividere da qui: fai uno screenshot di questa scheda.'); }
  }
  function fatto(msg = 'Grazie! Il tuo parere aiuta il giardino a crescere.') {
    chiudi(); avviso(msg);
    scrivi(CHIAVE, { ...leggi(CHIAVE, {}), inviato: true });
  }

  return {
    get aperto() { return !el.hidden; },
    apri() { el.hidden = false; },
    chiudi,
  };
}

// segna il giorno di oggi tra quelli in cui si è giocato; vero se è il momento dell'invito
// (dal secondo giorno, una volta sola, e mai se il parere è già stato inviato).
// puoMostrare: falso se ora c'è altro sullo schermo (la guida, un pannello): l'invito aspetta
export function tempoDiInvito(oggi, puoMostrare = true) {
  const p = leggi(CHIAVE, {});
  const giorni = p.giorni || [];
  if (!giorni.includes(oggi)) giorni.push(oggi);
  const invita = puoMostrare && giorni.length >= 2 && !p.invitato && !p.inviato;
  scrivi(CHIAVE, { ...p, giorni: giorni.slice(-10), invitato: p.invitato || invita });
  return invita;
}

// l'invito: un fumetto come quello della guida, con "Più tardi" e "Dico la mia"
export function mostraInvito(apri) {
  const el = document.createElement('section');
  el.className = 'guida pop'; el.setAttribute('role', 'status');
  el.innerHTML = `
    <span class="guida-ic">${FOGLIA(true)}</span>
    <div class="guida-corpo">
      <p class="guida-testo">Che bello rivederti nel giardino! Ti va di dirmi cosa ne pensi? Bastano 30 secondi.</p>
      <div class="guida-piede"><button class="guida-avanti parere-dopo">Più tardi</button><button class="guida-avanti">Dico la mia</button></div>
    </div>`;
  document.getElementById('screen').appendChild(el);
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    el.remove();
    if (!b.classList.contains('parere-dopo')) apri();
  });
}
