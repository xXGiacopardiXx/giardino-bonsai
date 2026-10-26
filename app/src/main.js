// Punto di partenza dell'app: crea la scena 3D, collega i pulsanti e avvia il ciclo di disegno.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import './style.css';

import { creaCielo, creaNuvole } from './scena/cielo.js';
import { creaIsola } from './scena/isola.js';
import { creaAlberi } from './scena/alberi.js';
import { creaGiardino } from './scena/giardino.js';
import { creaAnnaffiatura } from './scena/annaffiatura.js';
import { creaInterfaccia } from './interfaccia.js';

// Colori come nel prototipo (Three.js r128): niente conversioni di spazio colore
THREE.ColorManagement.enabled = false;

// Su iPhone il pizzico non deve ingrandire la pagina, solo la scena
document.addEventListener('gesturestart', e => e.preventDefault());

const screenEl = document.getElementById('screen'), canvas = document.getElementById('c');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
} catch (e) {
  document.getElementById('fallback').style.display = 'grid';
}

if (renderer) avvia();

function avvia() {
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 220);
  const world = new THREE.Group(); scene.add(world);

  // L'ordine conta: ogni parte consuma numeri casuali dalla stessa sequenza
  creaCielo(scene);
  creaIsola(world, renderer.capabilities.getMaxAnisotropy());
  const alberi = creaAlberi(world);
  const giardino = creaGiardino(world, { reduce });
  const nuvole = creaNuvole(scene);

  // Telecamera: si ruota col dito e si zooma col pizzico, senza spostarsi di lato
  const controls = new OrbitControls(camera, canvas);
  Object.assign(controls, { enablePan: false, enableDamping: true, dampingFactor: .08, rotateSpeed: .55, zoomSpeed: .8, minPolarAngle: .55, maxPolarAngle: 1.2 });
  const target = new THREE.Vector3(.1, 1.5, .5); controls.target.copy(target);
  let baseDist = 30;
  // inquadra tutta l'isola qualunque sia la forma dello schermo
  function fit() {
    const w = screenEl.clientWidth, h = screenEl.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    const a = w / h, hw = Math.min(4.4, 4.4 * Math.max(a, .42) / .46);
    baseDist = Math.min(44, Math.max(16, hw / (Math.tan(camera.fov / 2 * Math.PI / 180) * Math.min(a, 1))));
    camera.updateProjectionMatrix();
    controls.minDistance = baseDist * .45; controls.maxDistance = baseDist * 1.15;
    scene.fog.near = baseDist + 8; scene.fog.far = baseDist + 62;
  }
  fit();
  camera.position.copy(target).add(new THREE.Vector3(Math.sin(.95) * Math.sin(.22), Math.cos(.95), Math.sin(.95) * Math.cos(.22)).multiplyScalar(baseDist));
  controls.update();
  new ResizeObserver(() => {
    const d = camera.position.distanceTo(controls.target) / (baseDist || 1);
    fit(); camera.position.sub(controls.target).setLength(d * baseDist).add(controls.target);
  }).observe(screenEl);

  const ui = creaInterfaccia(screenEl, camera, alberi.trees);
  const pino = alberi.pino;

  const waterBtn = document.getElementById('t-water');
  const annaffiatura = creaAnnaffiatura(scene, pino, {
    assorbita: () => ui.nascondiAvvisoSete(),
    completata: () => {
      ui.mostraIdratato(); ui.sfidaCompletata(); ui.aggiungiSemi(5, 'pino');
      ui.toast('Il pino si sta riprendendo. Torna domani per la prossima annaffiatura.');
    },
  });
  waterBtn.addEventListener('click', () => {
    if (pino.thirst < .05) { ui.toast('Il pino è già idratato. Troppa acqua fa marcire le radici.'); return; }
    if (annaffiatura.avvia()) waterBtn.classList.remove('needs');
  });

  // Strumenti non ancora attivi
  const prossimamente = {
    't-prune': 'Pota: zoomma su un ramo e toccalo per tagliarlo. Arriva nella prossima versione.',
    't-wire': 'Filo: trascina un ramo per piegarlo nella forma voluta. Arriva più avanti.',
    't-care': 'Cura: concime e trattamenti contro i parassiti. Arriva più avanti.',
    't-shop': 'Negozio: vasi da comprare con i Semi. Arriva nella prossima versione.',
  };
  for (const id in prossimamente) document.getElementById(id).addEventListener('click', () => ui.toast(prossimamente[id]));
  document.getElementById('plus').addEventListener('click', () => ui.toast(prossimamente['t-shop']));

  let clock = 0, last = performance.now();
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now; clock += dt;
    controls.update();
    alberi.aggiorna(clock);
    giardino.aggiorna(dt, clock);
    if (!reduce) nuvole.aggiorna(dt);
    annaffiatura.aggiorna(dt);
    renderer.render(scene, camera);
    ui.aggiornaEtichette();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
