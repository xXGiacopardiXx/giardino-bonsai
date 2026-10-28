// Breve guida della prima partita (fase 5 della roadmap): un fumetto in alto che accompagna
// i primi gesti. Alcuni passi aspettano che il giocatore faccia davvero l'azione (annaffiare, potare);
// se l'azione non serve (la pianta non ha sete, non c'è niente da potare) il passo si salta.
// Tono gentile, senza fretta né rimproveri (game-design.md, sezione 6.2).

// attende: nome dell'evento che fa andare avanti (da evento()); salta(v): vero se il passo non serve
const PASSI = [
  { testo: 'Benvenuto nel tuo giardino! Questo è il tuo acero giapponese: te ne prenderai cura un giorno alla volta.' },
  { testo: 'Ha sete: tocca Acqua per annaffiarlo.', bersaglio: '#t-water', attende: 'annaffiato', salta: v => !v.puoAnnaffiare },
  { testo: 'Ogni giorno l\'acqua ti regala Semi. Con i Semi compri vasi nuovi nel Negozio.', bersaglio: '.pill.seeds' },
  { testo: 'Ora tocca Pota e taglia un germoglio che brilla.', bersaglio: '#t-prune', attende: 'potato', salta: v => !v.puoPotare },
  { testo: 'Taglio perfetto! Sotto il taglio spunteranno nuove gemme e la chioma diventerà più fitta.' },
  { testo: 'Quando vuoi, tocca l\'acero: si apre una tendina con Acqua, Pota e Aspetto, dove scegli il vaso.', bersaglio: '#tag-acero .plate' },
  { testo: 'Torna domani: avrà di nuovo sete. Se ti dimentichi non muore, ti aspetta.', fine: true },
];

const FOGLIA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.2 5 4.8-2-1.8 5 4.8 1.8-4.6 2.4 1.6 4.8-5-2.2L12 22l-2-5.2-5 2.2 1.6-4.8L2 11.8 6.8 10 5 5l4.8 2Z" fill="#e3462a" stroke="#3b2716" stroke-width="1.4" stroke-linejoin="round"/></svg>';

// vista(): la vista attuale del motore; finita(): chiamata quando la guida è conclusa
export function creaGuida({ vista, finita }) {
  const el = document.createElement('section');
  el.className = 'guida'; el.hidden = true;
  el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
  el.innerHTML = `
    <span class="guida-ic">${FOGLIA}</span>
    <div class="guida-corpo">
      <p class="guida-testo"></p>
      <div class="guida-piede"><span class="guida-punti"></span><button class="guida-avanti">Avanti</button></div>
    </div>`;
  document.getElementById('screen').appendChild(el);
  const testo = el.querySelector('.guida-testo'), punti = el.querySelector('.guida-punti'), avanti = el.querySelector('.guida-avanti');
  let passo = -1, evidenziato = null;

  function evidenzia(sel) {
    evidenziato?.classList.remove('guida-qui');
    evidenziato = sel ? document.querySelector(sel) : null;
    evidenziato?.classList.add('guida-qui');
  }
  function mostra(i) {
    // salta i passi che ora non servono
    while (i < PASSI.length && PASSI[i].salta?.(vista())) i++;
    if (i >= PASSI.length) { chiudi(); return; }
    passo = i;
    const p = PASSI[i];
    testo.textContent = p.testo;
    punti.innerHTML = PASSI.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('');
    avanti.hidden = !!p.attende;
    avanti.textContent = p.fine ? 'Inizia' : 'Avanti';
    evidenzia(p.bersaglio);
    // il fumetto rimbalza a ogni passo nuovo
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  }
  function chiudi() { el.hidden = true; passo = -1; evidenzia(null); finita(); }

  avanti.addEventListener('click', () => mostra(passo + 1));

  return {
    get attiva() { return passo >= 0; },
    avvia() { el.hidden = false; mostra(0); },
    // un'azione del giocatore: se è quella che il passo aspetta, si va avanti
    evento(nome) { if (passo >= 0 && PASSI[passo].attende === nome) setTimeout(() => mostra(passo + 1), 900); },
  };
}
