// Inventario e cura delle piante (game-design.md, sezione 6.5), nello stesso pannello.
// Inventario: si apre da Cura nella barra; mostra i prodotti di cura che hai, divisi tra concimi
// e trattamenti, con le dosi rimaste. Cura di una pianta: si apre dalla tendina della pianta;
// mostra come sta (concime, parassiti, protezione) e solo i prodotti adatti a lei, prima quelli
// specifici. Cosa si può fare lo decide il motore; le azioni le fa main.js.
import { iconaProdotto, perChi } from './icone-cura.js';

const GRUPPI = [['concime', 'Concimi'], ['trattamento', 'Trattamenti'], ['terriccio', 'Terricci per il rinvaso']];

// azioni: usa(pianta, id), negozio()
export function creaCure(azioni) {
  const el = document.createElement('section');
  el.className = 'negozio cure'; el.hidden = true;
  el.innerHTML = `
    <div class="negozio-pannello" role="dialog" aria-modal="true" aria-labelledby="cure-titolo">
      <div class="negozio-testa">
        <h2 id="cure-titolo" data-v="titolo">Inventario</h2>
        <button class="negozio-x" data-a="chiudi" aria-label="Chiudi">×</button>
      </div>
      <p class="negozio-sotto" data-v="sotto"></p>
      <div class="cura-stato" data-v="stato"></div>
      <div class="cure-lista" data-v="lista"></div>
      <button class="negozio-vai" data-a="negozio">Altri prodotti nel negozio</button>
    </div>`;
  document.getElementById('screen').appendChild(el);
  const v = (n) => el.querySelector(`[data-v="${n}"]`);
  let modo = 'inventario', pianta = null, ultima = null;

  function chiudi() { el.hidden = true; }
  el.addEventListener('click', (e) => {
    if (e.target === el) { chiudi(); return; }
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.a === 'chiudi') chiudi();
    else if (b.dataset.a === 'negozio') { chiudi(); azioni.negozio(); }
    else if (b.dataset.a === 'usa') azioni.usa(pianta, b.dataset.id);
  });

  const giorni = (n) => n === 1 ? 'un giorno' : `${n} giorni`;
  function riga(p, conPulsante) {
    const azione = !conPulsante ? `<b class="riga-dosi">×${p.dosi}</b>`
      : p.dosi ? `<button class="vaso-b usa" data-a="usa" data-id="${p.id}">Usa<small>×${p.dosi}</small></button>`
      : '<span class="riga-manca">Non ne hai</span>';
    return `<div class="riga-prodotto${conPulsante && !p.dosi ? ' spento' : ''}"><div class="riga-img">${iconaProdotto(p.id)}</div>
      <div class="riga-testo"><b>${p.nome}</b><span>${perChi(p.piante)}</span><small>${p.descrizione}</small></div>${azione}</div>`;
  }

  const api = {
    get aperto() { return !el.hidden; },
    get pianta() { return modo === 'pianta' ? pianta : null; },
    // nuovoModo: 'inventario' (dalla barra) o 'pianta' (dalla tendina di una pianta: id 'acero', 'pino', 'ginepro')
    apri(nuovoModo = 'inventario', id = null) {
      modo = nuovoModo; pianta = id; el.hidden = false;
      if (ultima) api.mostra(ultima);
    },
    chiudi,
    mostra(vista) {
      ultima = vista;
      if (el.hidden) return;
      const statoEl = v('stato');
      if (modo === 'inventario') {
        v('titolo').textContent = 'Inventario';
        v('sotto').textContent = 'I tuoi prodotti di cura. Per usarli tocca una pianta e scegli Cura.';
        statoEl.hidden = true;
        v('lista').innerHTML = GRUPPI.map(([tipo, nome]) => {
          const tuoi = vista.prodotti.filter(p => p.tipo === tipo && p.dosi > 0);
          return `<h3 class="cure-gruppo">${nome}</h3>${tuoi.length ? tuoi.map(p => riga(p, false)).join('') : '<p class="cure-vuoto">Nessuno: li trovi nel negozio.</p>'}`;
        }).join('');
        return;
      }
      // cura di una pianta: come sta, poi i prodotti adatti (gli specifici per primi)
      const c = vista.cura[pianta], nome = vista.nomiPiante[pianta];
      v('titolo').textContent = 'Cura';
      v('sotto').textContent = nome;
      const righe = [
        c.parassiti?.visibili ? `<span class="male">Afidi! ${c.parassiti.danno ? 'Stanno facendo danni' : `Trattali entro ${c.parassiti.oreInTempo} ore`}</span>` : '<span>Nessun parassita in vista</span>',
        c.concime.attivo ? `<span>Concime: fa effetto ancora ${giorni(c.concime.giorni)}</span>` : c.concime.inverno ? '<span>D\'inverno riposa: niente concime</span>' : '<span>Senza concime</span>',
      ];
      const r = vista.rinvaso[pianta];
      righe.push(r.dovuto && r.finestra ? '<span class="male">Le radici escono dal vaso: è il momento del rinvaso</span>'
        : r.dovuto ? `<span class="male">Vaso stretto: si rinvasa a fine inverno, tra ${giorni(r.giorniAllaFinestra)}</span>`
        : `<span>Radici a posto: prossimo rinvaso tra ${r.anniMancanti === 1 ? 'un anno' : r.anniMancanti + ' anni'} di gioco</span>`);
      if (c.protezione) righe.push(`<span>Protetta dall'olio di neem per ${giorni(c.protezione)}</span>`);
      statoEl.hidden = false; statoEl.innerHTML = righe.join('');
      const adatti = vista.prodotti.filter(p => p.piante.includes(pianta)).sort((a, b) => a.piante.length - b.piante.length);
      v('lista').innerHTML = GRUPPI.map(([tipo, nomeG]) => {
        const lista = adatti.filter(p => p.tipo === tipo);
        return lista.length ? `<h3 class="cure-gruppo">${nomeG}</h3>${lista.map(p => riga(p, true)).join('')}` : '';
      }).join('');
    },
  };
  return api;
}
