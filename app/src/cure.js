// Pannello Cura (game-design.md, sezioni 4 e 6.4): concime e trattamento contro i parassiti.
// Si apre da Cura nella barra e dalla tendina dell'acero. Usa lo stesso pannello del negozio.
// Cosa si può fare lo decide il motore (vista(stato).concime e .parassiti); le azioni le fa main.js.

const CONCIME = `<svg viewBox="0 0 64 50" aria-hidden="true"><path d="M20 12h24l4 32H16Z" fill="#c9a36a" stroke="#3b2716" stroke-width="2.4" stroke-linejoin="round"/><path d="M20 12l3-5h18l3 5" fill="#b08850" stroke="#3b2716" stroke-width="2.4" stroke-linejoin="round"/><path d="M32 22c5 3 6 8 2 12-4-2-6-7-2-12Z" fill="#6fae3e" stroke="#3b2716" stroke-width="1.8"/><circle cx="12" cy="44" r="2.6" fill="#8a5a30"/><circle cx="52" cy="45" r="2.2" fill="#6e4426"/><circle cx="56" cy="40" r="1.8" fill="#8a5a30"/></svg>`;
const SPRAY = `<svg viewBox="0 0 64 50" aria-hidden="true"><rect x="22" y="18" width="18" height="28" rx="5" fill="#7cc4e8" stroke="#3b2716" stroke-width="2.4"/><path d="M26 18v-6h12v6" fill="#e2483a" stroke="#3b2716" stroke-width="2.4" stroke-linejoin="round"/><path d="M38 12h8l2 3h-10" fill="#e2483a" stroke="#3b2716" stroke-width="2" stroke-linejoin="round"/><circle cx="54" cy="10" r="2" fill="#bfe6f7"/><circle cx="58" cy="15" r="1.6" fill="#bfe6f7"/><circle cx="55" cy="19" r="1.4" fill="#bfe6f7"/><path d="M27 30h8" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>`;

// azioni: concima(), tratta()
export function creaCure(azioni) {
  const el = document.createElement('section');
  el.className = 'negozio cure'; el.hidden = true;
  el.innerHTML = `
    <div class="negozio-pannello" role="dialog" aria-modal="true" aria-labelledby="cure-titolo">
      <div class="negozio-testa">
        <h2 id="cure-titolo">Cura</h2>
        <button class="negozio-x" data-a="chiudi" aria-label="Chiudi">×</button>
      </div>
      <p class="negozio-sotto">Concime e trattamenti per l'acero</p>
      <div class="cure-lista">
        <div class="vaso cura-scheda"><div class="vaso-img">${CONCIME}</div><span class="vaso-nome">Concime</span><span class="cura-stato" data-v="concime"></span><button class="vaso-b usa" data-a="concima">Concima</button></div>
        <div class="vaso cura-scheda"><div class="vaso-img">${SPRAY}</div><span class="vaso-nome">Trattamento</span><span class="cura-stato" data-v="parassiti"></span><button class="vaso-b compra" data-a="tratta">Tratta</button></div>
      </div>
    </div>`;
  document.getElementById('screen').appendChild(el);
  const stato = (n) => el.querySelector(`[data-v="${n}"]`);
  const bConcime = el.querySelector('[data-a="concima"]'), bTratta = el.querySelector('[data-a="tratta"]');

  function chiudi() { el.hidden = true; }
  el.addEventListener('click', (e) => {
    if (e.target === el) { chiudi(); return; }
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.a === 'chiudi') chiudi();
    else if (b.dataset.a === 'concima') azioni.concima();
    else if (b.dataset.a === 'tratta') azioni.tratta();
  });

  let ultima = null;
  const api = {
    get aperto() { return !el.hidden; },
    apri() { el.hidden = false; if (ultima) api.mostra(ultima); },
    chiudi,
    mostra(v) {
      ultima = v;
      if (el.hidden) return;
      const c = v.concime, p = v.parassiti;
      stato('concime').textContent = c.attivo ? `Fa effetto ancora ${c.giorni === 1 ? 'un giorno' : c.giorni + ' giorni'}`
        : c.inverno ? 'D\'inverno riposa: non serve' : 'Dura una stagione: cresce di più';
      bConcime.classList.toggle('caro', c.attivo || c.inverno);
      // i parassiti non ancora segnalati si scoprono guardando da vicino: qui non si svelano
      stato('parassiti').textContent = p?.visibili ? (p.danno ? 'Afidi! Stanno facendo danni' : `Afidi! Trattali entro ${p.oreInTempo} ore`)
        : 'Contro afidi e parassiti';
      bTratta.classList.toggle('caro', !p?.visibili);
    },
  };
  return api;
}
