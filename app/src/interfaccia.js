// Interfaccia sopra la scena 3D: etichette delle piante, messaggi, Semi, sfida del giorno.
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
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2800);
  }

  function floatText(txt, x, y) {
    const f = document.createElement('div'); f.className = 'float'; f.textContent = txt;
    f.style.left = x + 'px'; f.style.top = y + 'px';
    screenEl.appendChild(f); setTimeout(() => f.remove(), 1500);
  }

  const seedsEl = $('seeds');
  let seeds = 1240;
  function aggiungiSemi(n, daPianta) {
    const [x, y] = toScreen(trees[daPianta].tag); floatText('+' + n, x, y - 20);
    const r = seedsEl.getBoundingClientRect(), s = screenEl.getBoundingClientRect();
    setTimeout(() => floatText('+' + n, r.left - s.left + r.width / 2, r.top - s.top + r.height + 8), 300);
    // il contatore sale a poco a poco
    const from = seeds; seeds += n; const t0 = performance.now();
    (function tick(now) { const k = Math.min(1, (now - t0) / 700); seedsEl.textContent = fmt(Math.round(from + (seeds - from) * k)); if (k < 1) requestAnimationFrame(tick); })(t0);
  }

  return {
    toast,
    aggiungiSemi,
    sfidaCompletata() {
      $('quest').classList.add('done');
      $('qfill').style.width = '100%'; $('qtxt').textContent = '1/1';
    },
    nascondiAvvisoSete() { $('alert').classList.add('hide'); },
    mostraIdratato() { $('ok').classList.add('show'); },
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
