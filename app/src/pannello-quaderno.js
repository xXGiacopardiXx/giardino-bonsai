// Il quaderno del maestro (game-design.md, sezione 7.6): le pagine delle tecniche e delle piante, con il
// calendario vero. Il catalogo è in gioco/quaderno.js; quali pagine sono aperte e quali nuove lo dice il
// motore (vista.quaderno). Si apre dal pannello del maestro. Le pagine chiuse si vedono come "da scoprire",
// con come si aprono: un quaderno che si riempie giocando.
import { PAGINE, PARTI, GRUPPI, MESI } from './gioco/quaderno.js';
import { iconaProdotto } from './icone-cura.js';

const INK = '#3b2716';
const svg = (dentro) => `<svg viewBox="0 0 64 50" aria-hidden="true">${dentro}</svg>`;
const foglia = (macchie) => `<path d="M32 44c-14-4-20-16-16-30 10 0 22 6 24 18 1 5-2 9-8 12Z" fill="#7fb24a" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M32 44c-4-10-8-18-14-28" stroke="#4f7a2e" stroke-width="1.4" fill="none"/>${macchie}`;
const alberello = (chioma) => `<path d="M14 40h36l-4 7H18Z" fill="#8a573a" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><rect x="11" y="37" width="42" height="4" rx="2" fill="#76482f" stroke="${INK}" stroke-width="1.6"/><path d="M32 37c-2-6 3-9 0-17" stroke="#6b4a2a" stroke-width="3" fill="none" stroke-linecap="round"/>${chioma}`;
// un disegno per pagina: il gesto o la cosa da guardare, non la pianta intera
const DISEGNI = {
  acqua: svg(`<path d="M10 22h26v16a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4Z" fill="#5f8ea8" stroke="${INK}" stroke-width="2.2"/><path d="M36 26l14-8 3 3-15 11" fill="#5f8ea8" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M12 22q11-12 22 0" stroke="${INK}" stroke-width="2.2" fill="none"/><g fill="#5db4f0"><circle cx="54" cy="27" r="1.6"/><circle cx="57" cy="32" r="1.6"/><circle cx="53" cy="35" r="1.4"/><circle cx="58" cy="39" r="1.4"/></g>`),
  zuppo: svg(`<path d="M12 22h40l-5 22H17Z" fill="#8a573a" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/><path d="M14 26h36" stroke="#3f6f8f" stroke-width="5"/><g fill="#9fd4f0"><circle cx="20" cy="18" r="2"/><circle cx="30" cy="14" r="2.4"/><circle cx="42" cy="17" r="2"/></g><path d="M8 46h48" stroke="#5db4f0" stroke-width="3" stroke-linecap="round"/>`),
  concime: svg(iconaProdotto('concime-universale').replace(/^<svg[^>]*>|<\/svg>$/g, '')),
  tonico: svg(iconaProdotto('alghe').replace(/^<svg[^>]*>|<\/svg>$/g, '')),
  terriccio: svg(iconaProdotto('akadama').replace(/^<svg[^>]*>|<\/svg>$/g, '')),
  muschio: svg(iconaProdotto('muschio').replace(/^<svg[^>]*>|<\/svg>$/g, '')),
  forbici: svg(`<path d="M30 8v34" stroke="#6b4a2a" stroke-width="2.4"/><path d="M30 18c-8-2-12-6-12-10 6 0 10 4 12 10ZM30 28c8-2 12-6 12-10-6 0-10 4-12 10Z" fill="#8fc25a" stroke="#2e6a3a" stroke-width="1.4"/><path d="M38 34 52 22M38 22l14 12" stroke="#7d8a92" stroke-width="3" stroke-linecap="round"/><circle cx="36" cy="36" r="3" fill="#e2483a" stroke="${INK}" stroke-width="1.4"/><circle cx="36" cy="20" r="3" fill="#e2483a" stroke="${INK}" stroke-width="1.4"/>`),
  candela: svg(`<path d="M32 46V14" stroke="#6b4a2a" stroke-width="3"/><path d="M32 14c-3-4-3-8 0-11 3 3 3 7 0 11Z" fill="#e8dfa8" stroke="${INK}" stroke-width="1.6"/><path d="M32 34l-14-8M32 34l14-8M32 40l-16-5M32 40l16-5M32 28l-10-8M32 28l10-8" stroke="#2e6a3a" stroke-width="2.2" stroke-linecap="round"/><path d="M24 12h16" stroke="#e2483a" stroke-width="2" stroke-dasharray="3 2"/>`),
  pizzico: svg(`<path d="M18 44c4-10 10-16 14-26M32 18c4-4 10-6 14-6M32 18c-2-4-2-8 0-12" stroke="#4f7a3a" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M28 30c6 0 10 2 12 6" stroke="#6fa64a" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M44 8 54 16" stroke="#7d8a92" stroke-width="3" stroke-linecap="round"/><path d="M48 6l4 10" stroke="#7d8a92" stroke-width="3" stroke-linecap="round"/>`),
  aghi: svg(`<path d="M10 38h44" stroke="#6b4a2a" stroke-width="4" stroke-linecap="round"/><path d="M20 38l-6-16M24 38l-2-18M40 38l2-18M44 38l6-16" stroke="#2e6a3a" stroke-width="2.2" stroke-linecap="round"/><path d="M30 38l-8 8M34 38l8 8" stroke="#d8b84a" stroke-width="2.2" stroke-linecap="round"/><path d="M26 46h12" stroke="#e2483a" stroke-width="1.6" stroke-dasharray="2 2"/>`),
  fiore: svg(`<path d="M32 46V26" stroke="#6b4a2a" stroke-width="2.6"/><g fill="#c8968a" stroke="${INK}" stroke-width="1.2"><path d="M32 26c-8-2-10-10-6-14 4 2 6 8 6 14Z"/><path d="M32 26c8-2 10-10 6-14-4 2-6 8-6 14Z"/></g><circle cx="32" cy="27" r="2.6" fill="#7fb24a" stroke="${INK}" stroke-width="1.2"/><path d="M44 30l8-8" stroke="#7d8a92" stroke-width="2.4" stroke-linecap="round"/>`),
  ciliegia: svg(`<path d="M20 8c6 4 10 10 12 20M44 8c-6 4-10 10-12 20" stroke="#6b4a2a" stroke-width="2" fill="none"/><path d="M32 8c6-4 14-2 16 4-6 2-12 0-16-4Z" fill="#7fb24a" stroke="${INK}" stroke-width="1.4"/><circle cx="22" cy="34" r="8" fill="#c8283a" stroke="${INK}" stroke-width="2"/><circle cx="42" cy="34" r="8" fill="#b81e2c" stroke="${INK}" stroke-width="2"/><circle cx="19" cy="31" r="2" fill="#fff" opacity=".6"/><circle cx="39" cy="31" r="2" fill="#fff" opacity=".6"/>`),
  filo: svg(`<path d="M8 40c10 0 20-4 26-14s12-16 22-18" stroke="#6b4a2a" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M10 37l4 6M16 36l3 6M22 34l2 6M27 30l3 5M31 26l4 4M35 21l4 4M40 16l3 5M45 12l2 5" stroke="#d07a3a" stroke-width="2.2" stroke-linecap="round"/>`),
  rinvaso: svg(`<path d="M14 18h36l-4 14H18Z" fill="#c27a4a" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/><path d="M20 32c-2 6-6 8-10 10M28 32c0 6-2 10-4 13M36 32c2 6 4 9 8 12M44 32c4 4 6 6 10 7" stroke="#b08a5a" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M28 20v-6M36 20v-6" stroke="#e2483a" stroke-width="1.6" stroke-dasharray="2 2"/>`),
  afidi: svg(foglia(`<g fill="#26231c"><circle cx="26" cy="22" r="1.8"/><circle cx="29" cy="26" r="1.6"/><circle cx="24" cy="28" r="1.5"/><circle cx="32" cy="30" r="1.7"/></g><g fill="#c6ef7a" stroke="${INK}" stroke-width=".5"><circle cx="28" cy="18" r="1.6"/><circle cx="34" cy="25" r="1.5"/></g>`)),
  oidio: svg(foglia(`<g fill="#fff" opacity=".92"><ellipse cx="26" cy="22" rx="5" ry="3"/><ellipse cx="32" cy="30" rx="6" ry="3.4"/><ellipse cx="22" cy="31" rx="3.6" ry="2.4"/></g>`)),
  ruggine: svg(`<path d="M10 42 54 10M14 46 56 18M8 34 48 6" stroke="#2e6a3a" stroke-width="2.6" stroke-linecap="round"/><g fill="#e07a1e" stroke="${INK}" stroke-width=".6"><circle cx="24" cy="32" r="2"/><circle cx="34" cy="25" r="1.8"/><circle cx="30" cy="34" r="1.6"/><circle cx="40" cy="27" r="2"/><circle cx="22" cy="23" r="1.6"/></g>`),
  galle: svg(`<path d="M8 40c12-2 24-8 32-20" stroke="#4f7a3a" stroke-width="6" stroke-linecap="round" fill="none"/><g fill="#f28a1c" stroke="${INK}" stroke-width="1.2"><path d="M22 36c-2-8 0-14 2-16 2 4 2 10-2 16Z"/><path d="M30 31c0-9 4-14 6-15 1 5-1 10-6 15Z"/><path d="M26 34c-6-4-8-10-7-12 4 2 6 6 7 12Z"/></g>`),
  galla: svg(`<path d="M32 46V20" stroke="#6b4a2a" stroke-width="2.6"/><path d="M32 30c-10 0-14-6-14-10 6-2 12 2 14 10Z" fill="#7fb24a" stroke="${INK}" stroke-width="1.6"/><path d="M32 24c8 2 14-2 14-8-8-2-14 2-14 8Z" fill="#f6dcd6" stroke="${INK}" stroke-width="1.8"/><ellipse cx="40" cy="18" rx="3" ry="2" fill="#fff" opacity=".8"/>`),
  corineo: svg(foglia(`<g fill="#7a2a1c"><circle cx="26" cy="22" r="2"/><circle cx="31" cy="29" r="2.2"/><circle cx="22" cy="30" r="1.6"/></g><g fill="#e7f3f6" stroke="#7a2a1c" stroke-width=".8"><circle cx="30" cy="20" r="1.8"/><circle cx="25" cy="35" r="1.6"/></g>`)),
  stile: svg(`<path d="M18 42h28l-3 6H21Z" fill="#4c7891" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M32 42c-4-8 6-12 0-22" stroke="#6b4a2a" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M8 22c6-14 42-14 48 0-10 6-38 6-48 0Z" fill="none" stroke="${INK}" stroke-width="1.6" stroke-dasharray="3 2.4"/><g fill="#6fae3e" stroke="${INK}" stroke-width="1.2"><ellipse cx="22" cy="22" rx="8" ry="4"/><ellipse cx="40" cy="18" rx="9" ry="4.4"/><ellipse cx="31" cy="11" rx="6" ry="3.4"/></g>`),
  acero: svg(alberello(`<circle cx="24" cy="18" r="8" fill="#c94b2b" stroke="${INK}" stroke-width="1.4"/><circle cx="40" cy="16" r="8" fill="#e3462a" stroke="${INK}" stroke-width="1.4"/><circle cx="32" cy="9" r="6.4" fill="#f0702c" stroke="${INK}" stroke-width="1.4"/>`)),
  pino: svg(alberello(`<g fill="#2e6a3a" stroke="${INK}" stroke-width="1.4"><ellipse cx="22" cy="24" rx="10" ry="4"/><ellipse cx="42" cy="20" rx="10" ry="4"/><ellipse cx="32" cy="12" rx="8" ry="3.6"/></g>`)),
  ginepro: svg(alberello(`<g fill="#4f8a4a" stroke="${INK}" stroke-width="1.4"><circle cx="22" cy="22" r="6"/><circle cx="40" cy="20" r="7"/><circle cx="31" cy="11" r="6"/></g>`)),
  azalea: svg(alberello(`<g fill="#467a36" stroke="${INK}" stroke-width="1.4"><ellipse cx="23" cy="21" rx="10" ry="6"/><ellipse cx="41" cy="18" rx="10" ry="6"/></g><g fill="#f27ea6"><circle cx="19" cy="19" r="2.4"/><circle cx="26" cy="18" r="2.2"/><circle cx="38" cy="16" r="2.4"/><circle cx="45" cy="17" r="2.2"/><circle cx="42" cy="21" r="2"/></g>`)),
  ciliegio: svg(alberello(`<g fill="#f8c2d6" stroke="${INK}" stroke-width="1.2"><circle cx="22" cy="18" r="7"/><circle cx="32" cy="10" r="7"/><circle cx="42" cy="17" r="7"/></g><g fill="#fde8f0"><circle cx="30" cy="8" r="2.4"/><circle cx="20" cy="16" r="2"/></g>`)),
};
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// azioni: leggi(id) quando si apre una pagina
export function creaQuaderno(azioni) {
  const el = document.createElement('section');
  el.className = 'negozio quaderno'; el.hidden = true;
  el.setAttribute('aria-label', 'Il quaderno del maestro');
  el.innerHTML = `
    <div class="negozio-pannello quaderno-pannello" role="dialog" aria-modal="true" aria-labelledby="quaderno-titolo">
      <div class="negozio-testa">
        <button class="quaderno-indietro" data-a="indietro" aria-label="Torna all'indice" hidden>‹</button>
        <h2 id="quaderno-titolo">Il quaderno</h2>
        <button class="negozio-x" data-a="chiudi" aria-label="Chiudi">×</button>
      </div>
      <div data-v="indice">
        <p class="negozio-sotto" data-v="conto"></p>
        <div class="negozio-schede">${PARTI.map(([id, nome]) => `<button class="scheda" data-parte="${id}">${nome}</button>`).join('')}</div>
        <div class="quaderno-lista" data-v="lista"></div>
      </div>
      <article class="quaderno-pagina" data-v="pagina" hidden></article>
    </div>`;
  document.getElementById('screen').appendChild(el);
  const v = (n) => el.querySelector(`[data-v="${n}"]`);
  let parte = 'tecniche', pagina = null, ultima = null;

  el.addEventListener('click', (e) => {
    if (e.target === el) { api.chiudi(); return; }
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.a === 'chiudi') api.chiudi();
    else if (b.dataset.a === 'indietro') { pagina = null; disegna(); }
    else if (b.dataset.parte) { parte = b.dataset.parte; disegna(); }
    else if (b.dataset.pagina) api.apri(b.dataset.pagina);
  });

  function voce(p, q) {
    const aperta = q.pagine.includes(p.id), nuova = q.nuove.includes(p.id);
    if (!aperta) return `<div class="quaderno-voce chiusa"><span class="quaderno-ic">?</span><span><b>Da scoprire</b><small>${esc(p.apre)}</small></span></div>`;
    return `<button class="quaderno-voce${nuova ? ' nuova' : ''}" data-pagina="${p.id}"><span class="quaderno-ic">${DISEGNI[p.disegno] ?? ''}</span><span><b>${esc(p.titolo)}</b>${p.giapponese ? `<small><i>${esc(p.giapponese)}</i></small>` : ''}</span>${nuova ? '<em>Nuova</em>' : ''}</button>`;
  }

  function indice(q) {
    const tutte = PAGINE.filter(p => p.parte === parte);
    const lista = parte === 'tecniche'
      ? GRUPPI.map(([g, nome]) => `<h3 class="cure-gruppo">${nome}</h3>${tutte.filter(p => p.gruppo === g).map(p => voce(p, q)).join('')}`).join('')
      : tutte.map(p => voce(p, q)).join('');
    v('lista').innerHTML = lista;
    const aperte = PAGINE.filter(p => q.pagine.includes(p.id)).length;
    v('conto').textContent = `${aperte} pagine su ${PAGINE.length}. Si riempie giocando.`;
    el.querySelectorAll('[data-parte]').forEach(b => {
      b.classList.toggle('on', b.dataset.parte === parte);
      b.classList.toggle('nuova', PAGINE.some(p => p.parte === b.dataset.parte && q.nuove.includes(p.id)));
    });
  }

  const sezione = (titolo, testo) => `<section><h4>${titolo}</h4><p>${esc(testo)}</p></section>`;
  function scheda(p) {
    const testa = `<div class="quaderno-disegno">${DISEGNI[p.disegno] ?? ''}</div><h3>${esc(p.titolo)}${p.giapponese ? ` <i>${esc(p.giapponese)}</i>` : ''}</h3>`;
    if (p.parte === 'piante') {
      const righe = p.calendario.map(r => `<div class="cal-riga"><span class="cal-cosa">${esc(r.cosa)}${r.nota ? `<small>${esc(r.nota)}</small>` : ''}</span>${MESI.map((_, i) => `<i class="${r.mesi.includes(i + 1) ? 'si' : ''}${/^Attenzione/.test(r.cosa) ? ' occhio' : ''}"></i>`).join('')}</div>`).join('');
      return `${testa}${sezione('Carattere', p.carattere)}${sezione('Acqua', p.acqua)}${sezione('Luce', p.luce)}${sezione('Teme', p.teme)}
        <section><h4>Il calendario vero</h4><div class="cal"><div class="cal-riga cal-mesi"><span></span>${MESI.map(m => `<b>${m.charAt(0).toUpperCase()}</b>`).join('')}</div>${righe}</div><p class="cal-nota">Mesi per il clima dell'Italia. Nel gioco l'anno dura 4 settimane: le stagioni arrivano molto prima.</p></section>`;
    }
    return `${testa}${sezione("Cos'è", p.cos)}${sezione('Perché', p.perche)}
      <section><h4>Quando, dal vero</h4>${p.quando.map(([chi, t]) => `<p><b>${esc(chi)}:</b> ${esc(t)}</p>`).join('')}</section>
      <section><h4>Come si fa, dal vero</h4><ol>${p.come.map(x => `<li>${esc(x)}</li>`).join('')}</ol></section>
      <section class="quaderno-errore"><h4>L'errore più comune</h4><p>${esc(p.errore)}</p></section>
      <section class="quaderno-gioco"><h4>Nel gioco</h4><p>${esc(p.gioco)}</p></section>`;
  }

  function disegna() {
    if (!ultima) return;
    const q = ultima.quaderno;
    el.querySelector('[data-a="indietro"]').hidden = !pagina;
    v('indice').hidden = !!pagina; v('pagina').hidden = !pagina;
    if (pagina) { v('pagina').innerHTML = scheda(PAGINE.find(p => p.id === pagina)); return; }
    indice(q);
  }

  const api = {
    get aperto() { return !el.hidden; },
    // id: una pagina da aprire subito (se è aperta nel motore), altrimenti l'indice
    apri(id = null) {
      el.hidden = false;
      if (id && ultima?.quaderno.pagine.includes(id)) {
        pagina = id; parte = PAGINE.find(p => p.id === id).parte;
        azioni.leggi(id);
        v('pagina').scrollTop = 0;
      } else pagina = null;
      disegna();
    },
    chiudi() { el.hidden = true; pagina = null; },
    mostra(vista) { ultima = vista; if (!el.hidden) disegna(); },
  };
  return api;
}
