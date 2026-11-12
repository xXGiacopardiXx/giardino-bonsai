// Momenti speciali delle stagioni (game-design.md, sezione 7.5): il pannello che annuncia l'evento la prima
// volta che si apre il gioco in quei giorni (hanami, lucciole, luna d'autunno, prima neve), col regalo in Semi
// e la decorazione che si trova nel negozio solo durante l'evento. Gli eventi li decide il motore.

// un disegnino per ogni evento
export const DISEGNI_EVENTI = {
  hanami: '<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="#f8c2d6" stroke="#3b2716" stroke-width="1.4"><ellipse cx="24" cy="13" rx="5" ry="7"/><ellipse cx="24" cy="13" rx="5" ry="7" transform="rotate(72 24 24)"/><ellipse cx="24" cy="13" rx="5" ry="7" transform="rotate(144 24 24)"/><ellipse cx="24" cy="13" rx="5" ry="7" transform="rotate(216 24 24)"/><ellipse cx="24" cy="13" rx="5" ry="7" transform="rotate(288 24 24)"/></g><circle cx="24" cy="24" r="4" fill="#e07a9c" stroke="#3b2716" stroke-width="1.2"/></svg>',
  hotaru: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20" fill="#2c3d5e"/><circle cx="16" cy="18" r="4" fill="#fff3a0" opacity=".5"/><circle cx="16" cy="18" r="2" fill="#fff3a0"/><circle cx="31" cy="14" r="3" fill="#fff3a0" opacity=".5"/><circle cx="31" cy="14" r="1.5" fill="#fff3a0"/><circle cx="28" cy="30" r="5" fill="#fff3a0" opacity=".45"/><circle cx="28" cy="30" r="2.4" fill="#fff3a0"/><path d="M8 40c6-4 10-2 14-6M26 42c4-6 10-6 14-10" stroke="#5c9645" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  tsukimi: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20" fill="#2c3d5e"/><circle cx="26" cy="20" r="11" fill="#ffd27a" stroke="#3b2716" stroke-width="1.4"/><circle cx="23" cy="18" r="2.4" fill="#e8b85a"/><circle cx="29" cy="23" r="1.8" fill="#e8b85a"/><g fill="#fbf6ea" stroke="#3b2716" stroke-width="1"><circle cx="13" cy="39" r="3"/><circle cx="19" cy="39" r="3"/><circle cx="16" cy="34" r="3"/></g><path d="M34 42c0-8 2-12 5-16M37 42c1-6 4-9 6-11" stroke="#c8b070" stroke-width="1.6" fill="none"/></svg>',
  hatsuyuki: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="31" r="10" fill="#f4f7fa" stroke="#3b2716" stroke-width="1.4"/><circle cx="24" cy="16" r="7" fill="#f4f7fa" stroke="#3b2716" stroke-width="1.4"/><path d="M18 9h12l-1.5-5h-9Z" fill="#c8402c" stroke="#3b2716" stroke-width="1.2" stroke-linejoin="round"/><circle cx="21.5" cy="16" r="1" fill="#3b2716"/><circle cx="26.5" cy="16" r="1" fill="#3b2716"/><g fill="#bfe6f7"><circle cx="8" cy="10" r="1.6"/><circle cx="40" cy="8" r="1.4"/><circle cx="41" cy="22" r="1.6"/><circle cx="6" cy="26" r="1.4"/></g></svg>',
};

// azioni: negozio() (apre la scheda Giardino del negozio)
export function creaEventi(azioni) {
  const el = document.createElement('section');
  el.className = 'negozio evento'; el.hidden = true;
  el.setAttribute('aria-label', 'Un momento speciale');
  el.innerHTML = `
    <div class="negozio-pannello evento-pannello" role="dialog" aria-modal="true" aria-labelledby="evento-titolo">
      <div class="maestro-testa"><span class="guida-ic evento-ic" data-v="ic"></span>
        <div><p class="maestro-chi" data-v="sotto"></p><h2 id="evento-titolo" data-v="titolo"></h2></div></div>
      <p class="maestro-intro" data-v="testo"></p>
      <div class="evento-cose" data-v="cose"></div>
      <div class="evento-pulsanti"><button class="domanda-b secondaria" data-a="negozio">Vai al negozio</button><button class="guida-avanti" data-a="ok">Che bello!</button></div>
    </div>`;
  document.getElementById('screen').appendChild(el);
  const v = (n) => el.querySelector(`[data-v="${n}"]`);
  let chiuso = null;
  const chiudi = () => { el.hidden = true; const f = chiuso; chiuso = null; f?.(); };
  el.addEventListener('click', (e) => {
    const a = e.target.closest('button')?.dataset.a;
    if (a === 'ok') chiudi();
    else if (a === 'negozio') { chiudi(); azioni.negozio(); }
  });
  const giorni = (n) => n === 1 ? 'oggi è l\'ultimo giorno' : `dura ancora ${n} giorni`;
  return {
    get aperto() { return !el.hidden; },
    // e: l'evento (dal motore); semi: il regalo appena ricevuto; deco: la decorazione del negozio ({ nome, tua });
    // quandoChiuso: alla chiusura
    mostra(e, semi, deco, quandoChiuso) {
      chiuso = quandoChiuso;
      v('ic').innerHTML = DISEGNI_EVENTI[e.id] ?? '';
      v('titolo').textContent = e.nome;
      v('sotto').textContent = `${e.sottotitolo} · ${giorni(e.giorniRimasti)}`;
      v('testo').textContent = e.testo;
      v('cose').innerHTML = (semi ? `<span>Un regalo per questi giorni: <b>+${semi} Semi</b></span>` : '')
        + (deco && !deco.tua ? `<span>Nel negozio, solo adesso: <b>${deco.nome}</b>. Se non fai in tempo, torna l'anno prossimo.</span>` : '');
      el.querySelector('[data-a="negozio"]').hidden = !deco || deco.tua;
      el.hidden = false;
    },
    chiudi,
  };
}
