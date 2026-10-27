// Negozio dei vasi (fase 5 della roadmap): si apre da Negozio nella barra e dal "+" dei Semi.
// Mostra il catalogo che arriva dalla vista del motore; comprare e scegliere li decide main.js.

const SEME = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c4.5 3 6 7 6 10.5A6 6 0 0 1 6 13.5C6 10 7.5 6 12 3Z" fill="#a8641f" stroke="#3b2716" stroke-width="2"/></svg>';

// disegnino di ogni vaso, con i colori della scena (scena/alberi.js, VASI_FORME)
const INK = '#3b2716';
const DISEGNI = {
  blu: `<path d="M8 30h48l-6 16H14Z" fill="#4c7891"/><rect x="5" y="26" width="54" height="6" rx="3" fill="#5f8ea8"/>`,
  terracotta: `<path d="M13 28h38l-5 20H18Z" fill="#c27a4a"/><rect x="10" y="24" width="44" height="7" rx="3" fill="#ae6a3d"/>`,
  rettangolare: `<rect x="5" y="30" width="54" height="13" fill="#5b4636"/><rect x="3" y="27" width="58" height="5" fill="#4a3829"/><rect x="8" y="43" width="7" height="4" fill="#4a3829"/><rect x="49" y="43" width="7" height="4" fill="#4a3829"/>`,
  celadon: `<path d="M5 32h54l-7 11H12Z" fill="#8cbfa3"/><rect x="3" y="28" width="58" height="6" rx="3" fill="#a9d6bd"/><rect x="18" y="43" width="28" height="4" rx="2" fill="#76a98c"/>`,
  nuvola: `<path d="M9 30h46l-4 13H13Z" fill="#eadfc6"/><rect x="7" y="26" width="50" height="6" rx="3" fill="#d9c9a6"/><rect x="10" y="35" width="44" height="2.5" fill="#4c7891"/><ellipse cx="17" cy="45" rx="6" ry="3" fill="#d0bc96"/><ellipse cx="47" cy="45" rx="6" ry="3" fill="#d0bc96"/>`,
};
// un piccolo acero sopra ogni vaso, perché si capisca a cosa serve
const ALBERELLO = `<path d="M32 28c-1-6 2-9 0-15" stroke="#6b5444" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="24" cy="13" r="8" fill="#c94b2b"/><circle cx="38" cy="11" r="8" fill="#e3462a"/><circle cx="31" cy="6" r="6" fill="#f0702c"/>`;
const disegno = (id) => `<svg viewBox="0 0 64 50" aria-hidden="true" stroke="${INK}" stroke-width="0">${ALBERELLO}${DISEGNI[id] || ''}</svg>`;

// azioni: compra(id), usa(id)
export function creaNegozio(azioni) {
  const el = document.createElement('section');
  el.className = 'negozio'; el.hidden = true;
  el.setAttribute('aria-label', 'Negozio');
  el.innerHTML = `
    <div class="negozio-pannello" role="dialog" aria-modal="true" aria-labelledby="negozio-titolo">
      <div class="negozio-testa">
        <h2 id="negozio-titolo">Negozio</h2>
        <span class="negozio-semi">${SEME}<b data-v="semi"></b></span>
        <button class="negozio-x" data-a="chiudi" aria-label="Chiudi il negozio">×</button>
      </div>
      <p class="negozio-sotto">Vasi per l'acero</p>
      <div class="negozio-lista" data-v="lista"></div>
    </div>`;
  document.getElementById('screen').appendChild(el);
  const lista = el.querySelector('[data-v="lista"]'), semiEl = el.querySelector('[data-v="semi"]');
  let ultimaVista = null;

  function chiudi() { el.hidden = true; }
  el.addEventListener('click', (e) => {
    // un tocco fuori dal pannello chiude il negozio
    if (e.target === el) { chiudi(); return; }
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.a === 'chiudi') chiudi();
    else if (b.dataset.a === 'compra') azioni.compra(b.dataset.id);
    else if (b.dataset.a === 'usa') azioni.usa(b.dataset.id);
  });

  return {
    get aperto() { return !el.hidden; },
    apri() { el.hidden = false; if (ultimaVista) this.mostra(ultimaVista); },
    chiudi,
    // ridisegna le schede dalla vista del motore (gioco/stato.js)
    mostra(v) {
      ultimaVista = v;
      if (el.hidden) return;
      semiEl.textContent = v.semi;
      lista.innerHTML = v.vasi.map(x => {
        const pulsante = x.inUso ? '<span class="vaso-stato">In uso</span>'
          : x.tuo ? `<button class="vaso-b usa" data-a="usa" data-id="${x.id}">Usa</button>`
          : `<button class="vaso-b compra${v.semi < x.prezzo ? ' caro' : ''}" data-a="compra" data-id="${x.id}" aria-label="Compra per ${x.prezzo} Semi">${x.prezzo}${SEME}</button>`;
        return `<div class="vaso${x.inUso ? ' in-uso' : ''}"><div class="vaso-img">${disegno(x.id)}</div><span class="vaso-nome">${x.nome}</span>${pulsante}</div>`;
      }).join('');
    },
  };
}
