// Negozio e sezione Aspetto (fase 5 della roadmap), nello stesso pannello.
// Negozio: si apre da Negozio nella barra e dal "+" dei Semi, con due schede: Vasi e Cura
// (concimi e trattamenti a confezioni di 3 dosi, che finiscono nell'inventario).
// Aspetto: si apre dalla tendina dell'acero, mostra solo i vasi già comprati da mettere in uso.
// I cataloghi arrivano dalla vista del motore; comprare e scegliere li decide main.js.
import { iconaProdotto, perChi } from './icone-cura.js';

// categorie della scheda Cura: tipo del prodotto (PRODOTTI nel motore), nome del pulsante, riga sotto
const CATEGORIE = [['concime', 'Concimi', 'Concimi: la pianta cresce di più per una stagione'], ['trattamento', 'Contro gli afidi', 'Trattamenti contro gli afidi'], ['terriccio', 'Terricci', 'Terricci per il rinvaso'], ['attrezzo', 'Attrezzi', 'Attrezzi: si comprano una volta e servono per sempre']];

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
// disegnino di ogni decorazione del giardino (scena/decorazioni.js)
const DECO = {
  pietre: `<ellipse cx="32" cy="42" rx="15" ry="6" fill="#a9a597"/><ellipse cx="33" cy="31" rx="11" ry="5.5" fill="#9d998c"/><ellipse cx="33" cy="22" rx="7.5" ry="4" fill="#b5b0a2"/><ellipse cx="19" cy="45" rx="6" ry="2.4" fill="#6d9a43"/>`,
  panchina: `<rect x="12" y="34" width="7" height="12" fill="#8e8a7e"/><rect x="45" y="34" width="7" height="12" fill="#8e8a7e"/><rect x="6" y="27" width="52" height="5" rx="1.5" fill="#9a6a46"/><rect x="6" y="32" width="52" height="4" rx="1.5" fill="#8a5a3a"/>`,
  fontana: `<path d="M36 36h20l-2 11H38Z" fill="#8e8a7e"/><ellipse cx="46" cy="36" rx="10" ry="2.6" fill="#6cb6c8"/><rect x="18" y="26" width="3" height="20" fill="#9c8448"/><rect x="4" y="20" width="38" height="6" rx="3" transform="rotate(12 21 23)" fill="#cdb46c"/><rect x="40" y="8" width="3.4" height="30" fill="#cdb46c"/><ellipse cx="9" cy="45" rx="5" ry="3" fill="#9d998c"/>`,
  gatto: `<ellipse cx="30" cy="36" rx="20" ry="10" fill="#e8913a"/><path d="M12 38c2 8 22 10 34 6" stroke="#e8913a" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="47" cy="31" r="9" fill="#e8913a"/><path d="M41 25l1-8 5 5ZM48 23l5-6 1 8Z" fill="#e8913a"/><path d="M44 31h3M49 31h3" stroke="#3b2716" stroke-width="1.4" stroke-linecap="round"/><ellipse cx="50" cy="35" rx="4" ry="2.4" fill="#f7e3c4"/>`,
  ponte: `<path d="M4 44Q32 14 60 44" stroke="#9a6a46" stroke-width="6" fill="none"/><path d="M6 34Q32 6 58 34" stroke="#c8402c" stroke-width="3" fill="none"/><path d="M10 40v-8M21 30v-9M32 26v-8M43 30v-9M54 40v-8" stroke="#c8402c" stroke-width="2.6"/><path d="M2 47h60" stroke="#6cb6c8" stroke-width="3"/>`,
};
// gli elementi del giardino messi da parte (sezione 8.4), per id senza il numero
const ELEMENTI_DISEGNI = {
  lanterna: `<rect x="25" y="40" width="14" height="6" rx="1" fill="#918d81"/><rect x="29" y="24" width="6" height="16" fill="#aba79a"/><rect x="23" y="20" width="18" height="4" rx="1" fill="#918d81"/><rect x="25" y="10" width="14" height="10" fill="#ffd892"/><path d="M20 11 32 2l12 9Z" fill="#918d81"/>`,
  sasso: `<ellipse cx="29" cy="38" rx="18" ry="10" fill="#8e8a7e"/><ellipse cx="47" cy="43" rx="8" ry="5" fill="#9d998c"/><ellipse cx="27" cy="30" rx="12" ry="4.5" fill="#6d9a43"/>`,
  laghetto: `<ellipse cx="32" cy="32" rx="28" ry="14" fill="#a9a597"/><ellipse cx="32" cy="32" rx="24" ry="11" fill="#6cb6c8"/><ellipse cx="24" cy="30" rx="6" ry="2.4" fill="#f07a2e"/><ellipse cx="40" cy="35" rx="5" ry="2.2" fill="#f5f0e6"/><circle cx="44" cy="27" r="3" fill="#5c9645"/>`,
  cespuglio: `<circle cx="22" cy="32" r="12" fill="#4c7f45"/><circle cx="40" cy="30" r="13" fill="#5d9150"/><circle cx="31" cy="22" r="11" fill="#73a35e"/>`,
  sentiero: `<ellipse cx="32" cy="34" rx="22" ry="11" fill="#b5b0a2"/><ellipse cx="32" cy="31" rx="20" ry="9" fill="#c4bfb1"/>`,
};
const disegnoElemento = (id) => `<svg viewBox="0 0 64 50" aria-hidden="true">${ELEMENTI_DISEGNI[id.replace(/-\d+$/, '')] || ''}</svg>`;
// le piante in vendita: un'azalea in fiore nel suo vaso tondo
const PIANTE_DISEGNI = {
  azalea: `<path d="M16 34h32l-3 12H19Z" fill="#6e4a38"/><rect x="13" y="31" width="38" height="4" rx="2" fill="#5f3e2f"/><path d="M32 31c-1-6 3-8 1-14" stroke="#7a4e3a" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="22" cy="21" rx="10" ry="6" fill="#3f6e30"/><ellipse cx="42" cy="18" rx="10" ry="6" fill="#467a36"/><ellipse cx="32" cy="11" rx="9" ry="5.5" fill="#4e823b"/><g fill="#f27ea6"><circle cx="18" cy="18" r="2.6"/><circle cx="25" cy="17" r="2.4"/><circle cx="22" cy="23" r="2.2"/><circle cx="38" cy="15" r="2.6"/><circle cx="46" cy="16" r="2.4"/><circle cx="42" cy="21" r="2.2"/><circle cx="29" cy="9" r="2.4"/><circle cx="35" cy="8" r="2.2"/></g><g fill="#fbd3e1"><circle cx="21" cy="20" r="1.4"/><circle cx="44" cy="19" r="1.4"/><circle cx="33" cy="11" r="1.4"/></g>`,
};
// gli attrezzi (sezione 7.3): bastoncino di bambù nel terriccio, tronchesino per filo, forbici concave
const ATTREZZI_DISEGNI = {
  bastoncino: `<ellipse cx="32" cy="43" rx="20" ry="5" fill="#6b4a33"/><g transform="rotate(12 32 40)"><rect x="29.5" y="4" width="5" height="36" rx="2.4" fill="#d9b86a"/><rect x="29.5" y="28" width="5" height="12" rx="2.4" fill="#8c6a32"/><path d="M28 12.5h8M28 22h8" stroke="#a8873f" stroke-width="1.6"/></g>`,
  tronchesino: `<path d="M30 25 15 44M34 25l15 19" stroke="#c8402c" stroke-width="7" stroke-linecap="round"/><path d="M32 27 26 6l6 3 6-3Z" fill="#8e979b"/><circle cx="32" cy="25" r="3.4" fill="#5c6468"/>`,
  forbici: `<ellipse cx="17" cy="38" rx="10" ry="8" fill="none" stroke="#3a3f42" stroke-width="4.4"/><ellipse cx="47" cy="38" rx="10" ry="8" fill="none" stroke="#3a3f42" stroke-width="4.4"/><path d="M24 32 37 8M40 32 27 8" stroke="#8e979b" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="21" r="2.6" fill="#5c6468"/>`,
};
const disegnoAttrezzo = (id) => `<svg viewBox="0 0 64 50" aria-hidden="true">${ATTREZZI_DISEGNI[id] || ''}</svg>`;
const disegnoPianta = (id) => `<svg viewBox="0 0 64 50" aria-hidden="true">${PIANTE_DISEGNI[id] || ''}</svg>`;
const disegnoDeco = (id) => `<svg viewBox="0 0 64 50" aria-hidden="true">${DECO[id] || ''}</svg>`;
const disegno = (id) => `<svg viewBox="0 0 64 50" aria-hidden="true" stroke="${INK}" stroke-width="0">${ALBERELLO}${DISEGNI[id] || ''}</svg>`;

// azioni: compra(id), usa(id), compraProdotto(id), compraAttrezzo(id) e quelle del giardino
export function creaNegozio(azioni) {
  const el = document.createElement('section');
  el.className = 'negozio'; el.hidden = true;
  el.setAttribute('aria-label', 'Negozio');
  el.innerHTML = `
    <div class="negozio-pannello" role="dialog" aria-modal="true" aria-labelledby="negozio-titolo">
      <div class="negozio-testa">
        <h2 id="negozio-titolo" data-v="titolo">Negozio</h2>
        <span class="negozio-semi">${SEME}<b data-v="semi"></b></span>
        <button class="negozio-x" data-a="chiudi" aria-label="Chiudi il negozio">×</button>
      </div>
      <div class="negozio-schede" data-v="schede"><button class="scheda" data-scheda="vasi">Vasi</button><button class="scheda" data-scheda="cura">Cura</button><button class="scheda" data-scheda="giardino">Giardino</button></div>
      <div class="negozio-categorie" data-v="categorie" hidden>${CATEGORIE.map(([id, nome]) => `<button class="categoria" data-cat="${id}">${nome}</button>`).join('')}</div>
      <p class="negozio-sotto" data-v="sotto">Vasi per l'acero</p>
      <div class="negozio-lista" data-v="lista"></div>
      <button class="negozio-vai" data-a="negozio" hidden>Altri vasi nel negozio</button>
    </div>`;
  document.getElementById('screen').appendChild(el);
  const v = (nome) => el.querySelector(`[data-v="${nome}"]`);
  const lista = v('lista'), semiEl = v('semi'), vai = el.querySelector('.negozio-vai');
  let ultimaVista = null, modo = 'negozio', scheda = 'vasi', categoria = 'concime';

  function chiudi() { el.hidden = true; }
  el.addEventListener('click', (e) => {
    // un tocco fuori dal pannello chiude il negozio
    if (e.target === el) { chiudi(); return; }
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.a === 'chiudi') chiudi();
    else if (b.dataset.a === 'compra') azioni.compra(b.dataset.id);
    else if (b.dataset.a === 'usa') azioni.usa(b.dataset.id);
    else if (b.dataset.a === 'negozio') api.apri('negozio');
    else if (b.dataset.a === 'prodotto') azioni.compraProdotto(b.dataset.id);
    else if (b.dataset.a === 'attrezzo') azioni.compraAttrezzo(b.dataset.id);
    else if (b.dataset.a === 'deco') azioni.compraDecorazione(b.dataset.id);
    else if (b.dataset.a === 'pianta') azioni.compraPianta(b.dataset.id);
    else if (b.dataset.a === 'metti') azioni.mettiDecorazione(b.dataset.id, true);
    else if (b.dataset.a === 'rimetti') azioni.mettiElemento(b.dataset.id);
    else if (b.dataset.a === 'sposta') azioni.sposta(b.dataset.id);
    else if (b.dataset.scheda) api.apri('negozio', b.dataset.scheda);
    else if (b.dataset.cat) { categoria = b.dataset.cat; api.apri('negozio', 'cura'); }
  });

  const api = {
    get aperto() { return !el.hidden; },
    get modo() { return modo; },
    get scheda() { return scheda; },
    // nuovoModo: 'negozio' (comprare) o 'aspetto' (mettere in uso i vasi comprati);
    // nuovaScheda, nel negozio: 'vasi' o 'cura'
    apri(nuovoModo = 'negozio', nuovaScheda = 'vasi') {
      modo = nuovoModo; scheda = nuovaScheda; el.hidden = false;
      v('titolo').textContent = modo === 'aspetto' ? 'Aspetto' : 'Negozio';
      v('schede').hidden = modo === 'aspetto';
      el.querySelectorAll('.scheda').forEach(b => b.classList.toggle('on', b.dataset.scheda === scheda));
      v('categorie').hidden = modo !== 'negozio' || scheda !== 'cura';
      el.querySelectorAll('.categoria').forEach(b => b.classList.toggle('on', b.dataset.cat === categoria));
      lista.scrollTop = 0;
      v('sotto').textContent = modo === 'aspetto' ? 'I tuoi vasi: tocca Usa per cambiare quello dell\'acero'
        : scheda === 'cura' ? CATEGORIE.find(c => c[0] === categoria)[2] + (categoria === 'attrezzo' ? '' : ' (3 dosi a confezione)')
        : scheda === 'giardino' ? 'Piante nuove, decorazioni e cose messe da parte' : 'Vasi per l\'acero';
      if (ultimaVista) api.mostra(ultimaVista);
    },
    chiudi,
    // ridisegna le schede dalla vista del motore (gioco/stato.js)
    mostra(vista) {
      ultimaVista = vista;
      if (el.hidden) return;
      semiEl.textContent = vista.semi;
      // attrezzi: si comprano una volta; quelli già tuoi restano in vista con "Già tuo"
      if (modo === 'negozio' && scheda === 'cura' && categoria === 'attrezzo') {
        vai.hidden = true;
        lista.innerHTML = vista.attrezzi.map(a => `<div class="vaso prodotto${a.tuo ? ' in-uso' : ''}" title="${a.descrizione}"><div class="vaso-img">${disegnoAttrezzo(a.id)}</div><span class="vaso-nome">${a.nome}</span><span class="prodotto-per">${a.effetto}</span>${a.tuo ? '<span class="vaso-stato tuo">Già tuo</span>'
          : `<button class="vaso-b compra${vista.semi < a.prezzo ? ' caro' : ''}" data-a="attrezzo" data-id="${a.id}" aria-label="Compra per ${a.prezzo} Semi">${a.prezzo}${SEME}</button>`}</div>`).join('');
        return;
      }
      if (modo === 'negozio' && scheda === 'cura') {
        vai.hidden = true;
        // schede compatte come quelle dei vasi: le dosi che hai stanno nell'angolo del disegno
        lista.innerHTML = vista.prodotti.filter(p => p.tipo === categoria).map(p => `<div class="vaso prodotto"><div class="vaso-img">${iconaProdotto(p.id)}${p.dosi ? `<span class="prodotto-badge">×${p.dosi}</span>` : ''}</div><span class="vaso-nome">${p.nome}</span><span class="prodotto-per">${perChi(p.piante)}</span><button class="vaso-b compra${vista.semi < p.prezzo ? ' caro' : ''}" data-a="prodotto" data-id="${p.id}" aria-label="Compra per ${p.prezzo} Semi">${p.prezzo}${SEME}</button></div>`).join('');
        return;
      }
      if (modo === 'negozio' && scheda === 'giardino') {
        vai.hidden = true;
        // comprate: si spostano dove si vuole; quelle messe da parte si rimettono
        // prima le piante nuove (finché non sono tue), poi le decorazioni
        lista.innerHTML = vista.pianteNegozio.filter(p => !p.tua).map(p => `<div class="vaso pianta-nuova" title="${p.descrizione}"><div class="vaso-img">${disegnoPianta(p.id)}</div><span class="vaso-nome">${p.nome}</span><button class="vaso-b compra${vista.semi < p.prezzo ? ' caro' : ''}" data-a="pianta" data-id="${p.id}" aria-label="Compra per ${p.prezzo} Semi">${p.prezzo}${SEME}</button></div>`).join('') + vista.decorazioni.map(d => {
          const pulsante = d.tua ? `<button class="vaso-b usa" data-a="${d.messa ? 'sposta' : 'metti'}" data-id="${d.id}">${d.messa ? 'Sposta' : 'Metti'}</button>`
            : `<button class="vaso-b compra${vista.semi < d.prezzo ? ' caro' : ''}" data-a="deco" data-id="${d.id}" aria-label="Compra per ${d.prezzo} Semi">${d.prezzo}${SEME}</button>`;
          return `<div class="vaso${d.messa ? ' in-uso' : ''}" title="${d.descrizione}"><div class="vaso-img">${disegnoDeco(d.id)}</div><span class="vaso-nome">${d.nome}</span>${pulsante}</div>`;
        }).join('') + vista.elementiDaParte.map(e => `<div class="vaso" title="Messo da parte: rimetterlo è gratis"><div class="vaso-img">${disegnoElemento(e.id)}</div><span class="vaso-nome">${e.nome}</span><button class="vaso-b usa" data-a="rimetti" data-id="${e.id}">Rimetti</button></div>`).join('');
        return;
      }
      const vasi = modo === 'aspetto' ? vista.vasi.filter(x => x.tuo) : vista.vasi;
      vai.hidden = modo !== 'aspetto' || vista.vasi.every(x => x.tuo);
      lista.innerHTML = vasi.map(x => {
        // nel negozio i vasi già comprati si mettono in uso da Aspetto; in Aspetto si cambiano qui
        const pulsante = x.inUso ? '<span class="vaso-stato">In uso</span>'
          : x.tuo && modo === 'aspetto' ? `<button class="vaso-b usa" data-a="usa" data-id="${x.id}">Usa</button>`
          : x.tuo ? '<span class="vaso-stato tuo">Già tuo</span>'
          : `<button class="vaso-b compra${vista.semi < x.prezzo ? ' caro' : ''}" data-a="compra" data-id="${x.id}" aria-label="Compra per ${x.prezzo} Semi">${x.prezzo}${SEME}</button>`;
        return `<div class="vaso${x.inUso ? ' in-uso' : ''}"><div class="vaso-img">${disegno(x.id)}</div><span class="vaso-nome">${x.nome}</span>${pulsante}</div>`;
      }).join('');
    },
  };
  return api;
}
