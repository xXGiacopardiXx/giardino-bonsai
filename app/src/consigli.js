// Fumetto del maestro (game-design.md, sezione 7.4): mostra i consigli scelti dal motore (gioco/maestro.js).
// Arriva da solo quando c'è un consiglio nuovo, dopo la guida dei primi passi e mai sopra un'altra cosa;
// il pulsante col suo ritratto, in alto a destra, fa rileggere il consiglio della stagione.
import { NOME_MAESTRO } from './gioco/maestro.js';

// il ritratto: un vecchio maestro con la barba bianca e il codino
export const RITRATTO = `<svg viewBox="0 0 48 48" aria-hidden="true">
  <circle cx="24" cy="10" r="4.5" fill="#e9e4da" stroke="#3b2716" stroke-width="1.6"/>
  <ellipse cx="24" cy="22" rx="12" ry="12.5" fill="#f2c9a0" stroke="#3b2716" stroke-width="1.8"/>
  <path d="M13 22c2-7 20-7 22 0" fill="#e9e4da"/>
  <path d="M14 27c1 9 6 15 10 15s9-6 10-15c-3 2-6 2-10 2s-7 0-10-2Z" fill="#fbfaf6" stroke="#3b2716" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="M18 29c2 1.5 4 1.5 6 0 2 1.5 4 1.5 6 0" fill="none" stroke="#3b2716" stroke-width="1.3" stroke-linecap="round"/>
  <path d="M16 19.5c1.5-1.4 4-1.6 5.5-.6M26.5 18.9c1.5-1 4-.8 5.5.6" fill="none" stroke="#fbfaf6" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M17.5 23c1 .9 2.5.9 3.5 0M27 23c1 .9 2.5.9 3.5 0" fill="none" stroke="#3b2716" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="16" cy="25.5" r="1.6" fill="#ef9a7a" opacity=".6"/><circle cx="32" cy="25.5" r="1.6" fill="#ef9a7a" opacity=".6"/>
</svg>`;

export function creaConsigli() {
  const el = document.createElement('section');
  el.className = 'guida maestro'; el.hidden = true;
  el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
  el.innerHTML = `
    <span class="guida-ic maestro-ic">${RITRATTO}</span>
    <div class="guida-corpo">
      <p class="maestro-chi"><b>${NOME_MAESTRO}</b> · <span data-v="titolo"></span></p>
      <p class="guida-testo" data-v="testo"></p>
      <div class="guida-piede"><span></span><button class="guida-avanti">Grazie, maestro</button></div>
    </div>`;
  document.getElementById('screen').appendChild(el);
  let letto = null;
  el.querySelector('.guida-avanti').addEventListener('click', () => { el.hidden = true; const f = letto; letto = null; f?.(); });
  return {
    get aperto() { return !el.hidden; },
    // consiglio: { titolo, testo }; quandoLetto(): chiamata col "Grazie, maestro"
    mostra(consiglio, quandoLetto) {
      el.querySelector('[data-v="titolo"]').textContent = consiglio.titolo;
      el.querySelector('[data-v="testo"]').textContent = consiglio.testo;
      letto = quandoLetto; el.hidden = false;
      el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    },
    chiudi() { el.hidden = true; letto = null; },
  };
}
