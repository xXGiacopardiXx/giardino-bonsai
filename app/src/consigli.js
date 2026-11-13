// Pannello del maestro (game-design.md, sezione 7.4): mostra i consigli scelti dal motore (gioco/maestro.js).
// In alto il maestro e una riflessione sulla stagione; sotto una scheda per pianta, con come si sente
// e i punti da fare, ognuno col suo perché. Arriva da solo quando c'è un consiglio nuovo, dopo la guida
// dei primi passi e mai sopra un'altra cosa; il pulsante col ritratto, in alto a destra, lo fa rileggere.
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

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// azioni: quaderno() apre il quaderno del maestro
export function creaConsigli(azioni = {}) {
  const el = document.createElement('section');
  el.className = 'negozio maestro'; el.hidden = true;
  el.setAttribute('aria-label', 'Il consiglio del maestro');
  el.innerHTML = `
    <div class="negozio-pannello maestro-pannello" role="dialog" aria-modal="true" aria-labelledby="maestro-titolo">
      <div class="maestro-testa">
        <span class="guida-ic maestro-ic">${RITRATTO}</span>
        <div><p class="maestro-chi">${NOME_MAESTRO}</p><h2 id="maestro-titolo" data-v="titolo"></h2></div>
      </div>
      <p class="maestro-intro" data-v="intro"></p>
      <div class="negozio-schede" data-v="schede"></div>
      <div class="maestro-pianta" data-v="pianta"></div>
      <div class="maestro-fondo">
        <button class="maestro-quaderno" data-a="quaderno">Il quaderno</button>
        <button class="guida-avanti maestro-ok">Grazie, maestro</button>
      </div>
    </div>`;
  document.getElementById('screen').appendChild(el);
  const v = (n) => el.querySelector(`[data-v="${n}"]`);
  let consiglio = null, letto = null;

  // la scheda di una pianta: come si sente, poi i punti col perché
  function mostraPianta(id) {
    el.querySelectorAll('[data-pianta]').forEach(b => b.classList.toggle('on', b.dataset.pianta === id));
    const p = consiglio.piante.find(x => x.id === id);
    v('pianta').innerHTML = `
      <div class="maestro-sente"><b>Come si sente</b><p>${esc(p.sente)}</p></div>
      <ol class="maestro-punti">${p.punti.map(x => `<li><b>${esc(x.fai)}</b><span><i>Perché:</i> ${esc(x.perche)}</span></li>`).join('')}</ol>`;
    v('pianta').scrollTop = 0;
  }
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.pianta) mostraPianta(b.dataset.pianta);
    else if (b.classList.contains('maestro-ok')) { el.hidden = true; const f = letto; letto = null; f?.(); }
    // il quaderno: il consiglio conta come letto, poi si apre l'indice
    else if (b.dataset.a === 'quaderno') { el.hidden = true; const f = letto; letto = null; f?.(); azioni.quaderno?.(); }
  });
  return {
    get aperto() { return !el.hidden; },
    // c: { titolo, intro, piante: [{ id, nome, sente, punti: [{ fai, perche }] }] }; quandoLetto(): col "Grazie, maestro"
    mostra(c, quandoLetto) {
      consiglio = c; letto = quandoLetto;
      v('titolo').textContent = c.titolo;
      v('intro').textContent = c.intro;
      v('schede').innerHTML = c.piante.map(p => `<button class="scheda" data-pianta="${p.id}">${p.nome}</button>`).join('');
      v('schede').hidden = c.piante.length < 2;
      mostraPianta(c.piante[0].id);
      el.hidden = false;
    },
    chiudi() { el.hidden = true; letto = null; },
  };
}
