// Pannello delle sfide (game-design.md, sezioni 7.1 e 7.2): si apre dal pulsante con la bandierina, sotto
// quello del maestro, o toccando un banner delle sfide. Mostra tutte le sfide del momento (del giorno e della
// settimana, coi Semi e quanto manca) e la serie, col giorno di riposo. I banner escono da soli dopo qualche
// secondo: qui si rivedono quando si vuole.

const SEME = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c4.5 3 6 7 6 10.5A6 6 0 0 1 6 13.5C6 10 7.5 6 12 3Z" fill="#a8641f" stroke="#3b2716" stroke-width="2"/></svg>';
// l'icona del pulsante: una bandierina rossa su un'asta
export const BANDIERINA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 21V3.5" stroke="#3b2716" stroke-width="2" stroke-linecap="round"/><path d="M7.5 4h10.5l-2.6 3.6L18 11.2H7.5Z" fill="#e2483a" stroke="#3b2716" stroke-width="1.6" stroke-linejoin="round"/><ellipse cx="7" cy="21" rx="3.4" ry="1.2" fill="#6fae3e" stroke="#3b2716" stroke-width="1.2"/></svg>';

// una sfida: titolo, testo, premio, barra e com'è andata
function scheda({ tipo, titolo, testo, premio, fatti, obiettivo, nota, fatta }) {
  const p = Math.round(Math.min(1, fatti / obiettivo) * 100);
  return `<div class="sfida-scheda ${tipo}${fatta ? ' fatta' : ''}">
    <span class="sfida-titolo">${titolo}</span>
    <span class="sfida-testo">${testo}</span>
    <span class="sfida-premio">+${premio}${SEME}</span>
    <span class="qbar"><i style="width:${p}%"></i><span>${fatta ? 'Fatta!' : `${Math.min(fatti, obiettivo)}/${obiettivo}`}</span></span>
    ${nota ? `<span class="sfida-nota">${nota}</span>` : ''}
  </div>`;
}

export function creaSfide() {
  const el = document.createElement('section');
  el.className = 'negozio sfide'; el.hidden = true;
  el.setAttribute('aria-label', 'Le sfide');
  el.innerHTML = `
    <div class="negozio-pannello sfide-pannello" role="dialog" aria-modal="true" aria-labelledby="sfide-titolo">
      <div class="negozio-testa">
        <h2 id="sfide-titolo">Le sfide</h2>
        <button class="negozio-x" data-a="chiudi" aria-label="Chiudi le sfide">×</button>
      </div>
      <div class="sfide-lista" data-v="lista"></div>
    </div>`;
  document.getElementById('screen').appendChild(el);
  const lista = el.querySelector('[data-v="lista"]');
  let ultima = null;
  el.addEventListener('click', (e) => {
    if (e.target === el || e.target.closest('[data-a="chiudi"]')) el.hidden = true;
  });

  const api = {
    get aperto() { return !el.hidden; },
    apri() { el.hidden = false; if (ultima) api.mostra(ultima); },
    chiudi() { el.hidden = true; },
    // ridisegna dalla vista del motore (gioco/stato.js)
    mostra(v) {
      ultima = v;
      if (el.hidden) return;
      const s = v.sfida, w = v.settimana, parti = [];
      if (s) parti.push(scheda({ tipo: 'giorno', titolo: 'Sfida del giorno', testo: s.testo, premio: 5, fatti: s.fatta ? 1 : 0, obiettivo: 1, fatta: s.fatta,
        nota: s.fatta ? 'Domani ne arriva una nuova.' : 'Una cosa sola, sempre fattibile oggi.' }));
      if (w) parti.push(scheda({ tipo: 'settimana', titolo: 'Sfida della settimana', testo: w.testo, premio: w.premio, fatti: w.fatti, obiettivo: w.obiettivo, fatta: w.fatta,
        nota: w.fatta ? 'Con la stagione nuova ne arriva un\'altra.' : w.giorniRimasti === 1 ? 'Ultimo giorno di questa stagione.' : `Ancora ${w.giorniRimasti} giorni, fino alla fine della stagione.` }));
      // la serie: quanti giorni mancano al prossimo bonus e il giorno di riposo
      const mancano = 7 - (v.serie % 7);
      parti.push(scheda({ tipo: 'serie', titolo: 'Serie di giorni', testo: `${v.serie} ${v.serie === 1 ? 'giorno' : 'giorni'} di fila`, premio: 50,
        fatti: 7 - mancano, obiettivo: 7, fatta: false,
        nota: (v.curatoOggi ? 'Oggi hai già curato il giardino. ' : 'Una cura qualunque, oggi, allunga la serie. ')
          + (v.riposi ? 'Hai un giorno di riposo: se salti un giorno, la serie resta com\'è.' : `Fra ${mancano} ${mancano === 1 ? 'giorno' : 'giorni'} arriva anche un giorno di riposo.`) }));
      lista.innerHTML = parti.join('');
    },
  };
  return api;
}
