// Interfaccia sopra la scena 3D: etichette delle piante, messaggi, Semi, serie, stagione, sfida del giorno.
import * as THREE from 'three';

const $ = (id) => document.getElementById(id);
const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export function creaInterfaccia(screenEl, camera, trees) {
  const tagEls = { acero: $('tag-acero'), ginepro: $('tag-ginepro'), pino: $('tag-pino') };
  const pv = new THREE.Vector3();
  const toScreen = (v) => { pv.copy(v).project(camera); return [(pv.x + 1) / 2 * screenEl.clientWidth, (1 - pv.y) / 2 * screenEl.clientHeight, pv.z]; };

  const hint = $('hint');
  const hideHint = () => hint.classList.add('gone');
  $('c').addEventListener('pointerdown', hideHint, { once: true });
  setTimeout(hideHint, 6000);

  const toastEl = $('toast');
  let toastT;
  function toast(msg, durata = 2800) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), durata);
  }

  function floatText(txt, x, y) {
    const f = document.createElement('div'); f.className = 'float'; f.textContent = txt;
    f.style.left = x + 'px'; f.style.top = y + 'px';
    screenEl.appendChild(f); setTimeout(() => f.remove(), 1500);
  }

  const seedsEl = $('seeds');
  let semiMostrati = null, semiAnimati = false;
  // i Semi guadagnati salgono dalla pianta al contatore, che cresce a poco a poco
  function guadagnaSemi(n, totale, daPianta) {
    const [x, y] = toScreen(trees[daPianta].tag); floatText('+' + n, x, y - 20);
    const r = seedsEl.getBoundingClientRect(), s = screenEl.getBoundingClientRect();
    setTimeout(() => floatText('+' + n, r.left - s.left + r.width / 2, r.top - s.top + r.height + 8), 300);
    const from = semiMostrati ?? totale - n, t0 = performance.now();
    semiAnimati = true;
    (function tick(now) {
      const k = Math.min(1, (now - t0) / 700);
      semiMostrati = Math.round(from + (totale - from) * k); seedsEl.textContent = fmt(semiMostrati);
      if (k < 1) requestAnimationFrame(tick); else semiAnimati = false;
    })(t0);
  }

  const settimanaEl = $('settimana'), questEl = $('quest');
  let primoAggiornamento = true, sfidaChiusa = false;
  questEl.addEventListener('animationend', () => { if (questEl.classList.contains('via')) questEl.style.display = 'none'; });
  return {
    toast,
    guadagnaSemi,
    // ridisegna l'interfaccia a partire dalla vista calcolata dal motore (gioco/stato.js)
    aggiorna(v, { annaffiando = false } = {}) {
      $('stagione').textContent = v.nomeStagione;
      settimanaEl.setAttribute('aria-label', `Giorno ${v.giornoStagione} di 7`);
      [...settimanaEl.children].forEach((el, i) => { el.className = i + 1 < v.giornoStagione ? 'on' : i + 1 === v.giornoStagione ? 'now' : ''; });
      // durante l'annaffiatura il contatore aspetta l'animazione dei Semi guadagnati
      if (!semiAnimati && !annaffiando) { semiMostrati = v.semi; seedsEl.textContent = fmt(v.semi); }
      $('serie').textContent = v.serie;

      // sfida completata: la barra si riempie, la scritta si cancella e il banner esce di scena
      if (!v.sfida?.fatta) {
        sfidaChiusa = false;
        questEl.classList.remove('done', 'via');
        questEl.style.display = v.sfida ? '' : 'none';
        $('qfill').style.width = '0'; $('qtxt').textContent = '0/1';
      } else if (!sfidaChiusa) {
        sfidaChiusa = true;
        if (primoAggiornamento) questEl.style.display = 'none';
        else {
          questEl.classList.add('done');
          $('qfill').style.width = '100%'; $('qtxt').textContent = '1/1';
          setTimeout(() => { if (sfidaChiusa) questEl.classList.add('via'); }, 1800);
        }
      }
      primoAggiornamento = false;

      const salute = Math.round(v.salute * 100) + '%';
      $('acero-fase').textContent = v.nomeFase;
      $('acero-salute').textContent = salute;
      $('acero-barra').style.width = salute;
      if (!annaffiando) {
        $('alert').classList.toggle('hide', !v.haSete);
        $('alert').style.display = v.haSete ? '' : 'none';
        $('ok').classList.toggle('show', !v.haSete && v.sfida?.fatta === true);
        $('t-water').classList.toggle('needs', v.haSete);
      }
      // Pota chiede attenzione solo se oggi non c'è ancora stata un'azione di cura e la pianta non ha sete
      $('t-prune').classList.toggle('needs', v.puoPotare && !v.curatoOggi && !v.haSete);
    },
    // forbici che si chiudono nel punto toccato
    forbici(x, y) {
      const f = document.createElement('div'); f.className = 'snip';
      f.innerHTML = $('t-prune').querySelector('svg').outerHTML;
      f.style.left = x + 'px'; f.style.top = y + 'px';
      screenEl.appendChild(f); setTimeout(() => f.remove(), 700);
    },
    nascondiAvvisoSete() { $('alert').classList.add('hide'); },
    mostraIdratato() { $('alert').style.display = 'none'; $('ok').classList.add('show'); },
    // le etichette seguono le piante quando si ruota la scena
    aggiornaEtichette() {
      for (const k in tagEls) {
        const [x, y, z] = toScreen(trees[k].tag), el = tagEls[k];
        const hw2 = el.offsetWidth / 2 + 8, cx = Math.min(screenEl.clientWidth - hw2, Math.max(hw2, x));
        el.style.visibility = z > 1 ? 'hidden' : 'visible';
        el.style.transform = `translate(${cx.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-100%)`;
      }
    },
  };
}
