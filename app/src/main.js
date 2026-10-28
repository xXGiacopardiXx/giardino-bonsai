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
import { creaGermogli } from './scena/germogli.js';
import { creaInterfaccia } from './interfaccia.js';
import { creaPannelloProva } from './pannello-prova.js';
import { creaNegozio } from './negozio.js';
import { creaGuida } from './guida.js';
import * as suoni from './suoni.js';
import * as musica from './musica.js';
import { GIORNO } from './gioco/tempo.js';
import { nuovoStato, avanza, annaffia, pota, compra, scegliVaso, vista, VASI } from './gioco/stato.js';
import { carica, salva, cancella } from './gioco/salvataggio.js';

// Colori come nel prototipo (Three.js r128): niente conversioni di spazio colore
THREE.ColorManagement.enabled = false;

// Su iPhone il pizzico non deve ingrandire la pagina, solo la scena
document.addEventListener('gesturestart', e => e.preventDefault());
// l'audio del telefono si sblocca solo con un tocco; Safari accetta lo sblocco solo da alcuni eventi,
// per questo li ascoltiamo tutti
const sbloccaAudio = () => { suoni.sblocca(); musica.avvia(); };
['pointerdown', 'touchend', 'click'].forEach(ev => document.addEventListener(ev, sbloccaAudio, true));

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
  let baseDist = 30, potando = false;
  // inquadra tutta l'isola qualunque sia la forma dello schermo
  function fit() {
    const w = screenEl.clientWidth, h = screenEl.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    const a = w / h, hw = Math.min(4.4, 4.4 * Math.max(a, .42) / .46);
    baseDist = Math.min(44, Math.max(16, hw / (Math.tan(camera.fov / 2 * Math.PI / 180) * Math.min(a, 1))));
    camera.updateProjectionMatrix();
    // durante la potatura ci si può avvicinare di più, per toccare i germogli
    controls.minDistance = baseDist * (potando ? .2 : .45); controls.maxDistance = baseDist * 1.15;
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
  // La pianta del motore è l'acero, unica specie da curare nell'MVP (game-design.md, sezione 14.1)
  const acero = alberi.acero;
  const germogli = creaGermogli(scene, acero);

  // --- Stato della partita: caricato, portato all'ora attuale, salvato ---
  let stato = carica(Date.now());
  const ora = () => Date.now() + stato.debug.spostamento;
  avanza(stato, ora());
  salva(stato);

  let pannello, negozio;
  // ridisegna scena e interfaccia; con l'anteprima del pannello mostra il futuro senza toccare la partita
  function disegna() {
    const giorniAnteprima = pannello?.anteprima ?? 0;
    const base = giorniAnteprima > 0 ? avanza(structuredClone(stato), ora() + giorniAnteprima * GIORNO) : stato;
    const v = vista(base);
    const annaffiando = annaffiatura.attiva;
    ui.aggiorna(v, { annaffiando });
    if (!annaffiando) {
      acero.setThirst(v.ingiallimento);
      acero.setSoil(v.terriccio);
      acero.ring.visible = v.haSete;
      acero.setAppassimento(v.appassimento);
    }
    acero.setSalute(v.salute);
    acero.setVaso(v.vaso);
    negozio?.mostra(v);
    // punto dell'anno, giorno per giorno: colori dell'acero e foglie che cadono
    const pAnno = v.stagione + (v.giornoStagione - 1) / 7;
    alberi.setStagione(pAnno); giardino.setStagione(pAnno); musica.setStagione(v.stagione);
    germogli.sincronizza(v.germogli, v.gemme);
    pannello?.mostra(v, base.aggiornato);
  }
  function aggiornaStato() { avanza(stato, ora()); salva(stato); disegna(); }

  const waterBtn = document.getElementById('t-water');
  let ultimoEsito = null;
  const annaffiatura = creaAnnaffiatura(scene, acero, {
    assorbita: () => { ui.nascondiAvvisoSete(); suoni.assorbe(); },
    completata: () => {
      ui.mostraIdratato();
      const { semi, bonusSerie } = ultimoEsito;
      if (semi) { ui.guadagnaSemi(semi, stato.semi - bonusSerie, 'acero'); suoni.semi(); }
      if (bonusSerie) setTimeout(() => { ui.guadagnaSemi(bonusSerie, stato.semi, 'acero'); suoni.semi(); }, 900);
      ui.toast(bonusSerie ? `${stato.serie.giorni} giorni di fila: +${bonusSerie} Semi!` : 'L\'acero si sta riprendendo. Tornerà ad avere sete tra un giorno o due.');
      disegna();
      guida.evento('annaffiato');
    },
  });
  waterBtn.addEventListener('click', () => {
    if (annaffiatura.attiva) return;
    if (pannello.anteprima > 0) { ui.toast('Stai guardando un\'anteprima: chiudila o fai passare il tempo.'); return; }
    const esito = annaffia(stato, ora());
    if (esito.esito === 'umido') { ui.toast('Il terriccio è ancora umido: l\'acqua non viene assorbita. Riprova più tardi.'); return; }
    ultimoEsito = esito;
    salva(stato);
    annaffiatura.avvia();
    suoni.acqua();
    waterBtn.classList.remove('needs');
    disegna();
  });

  pannello = creaPannelloProva({
    anteprima: () => disegna(),
    applica: (giorni) => { stato.debug.spostamento += giorni * GIORNO; aggiornaStato(); },
    azzera: () => { cancella(); stato = nuovoStato(Date.now()); aggiornaStato(); guida.avvia(); },
    guida: () => guida.avvia(),
  });

  disegna();

  // --- Guida dei primi passi e suoni ---
  const guida = creaGuida({ vista: () => vista(stato), finita: () => { stato.guida.fatta = true; salva(stato); } });
  if (!stato.guida.fatta) guida.avvia();
  const suoniBtn = document.getElementById('suoni');
  const ICONE_SUONI = { si: suoniBtn.innerHTML, no: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4Z" fill="#d9cdb6" stroke="#3b2716" stroke-width="1.8" stroke-linejoin="round"/><path d="M16 9.5l5 5M21 9.5l-5 5" stroke="#c4291c" stroke-width="2" stroke-linecap="round"/></svg>` };
  function mostraSuoni() {
    const si = suoni.suoniAttivi();
    suoniBtn.innerHTML = si ? ICONE_SUONI.si : ICONE_SUONI.no;
    suoniBtn.setAttribute('aria-pressed', si); suoniBtn.setAttribute('aria-label', si ? 'Suoni accesi' : 'Suoni spenti');
  }
  suoniBtn.addEventListener('click', () => { suoni.attivaSuoni(!suoni.suoniAttivi()); mostraSuoni(); });
  mostraSuoni();
  const musicaBtn = document.getElementById('musica');
  const ICONE_MUSICA = { si: musicaBtn.innerHTML, no: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 17V5l10-2v12" stroke="#3b2716" stroke-width="1.8" fill="none" stroke-linejoin="round"/><ellipse cx="6.5" cy="17.5" rx="3" ry="2.4" fill="#d9cdb6" stroke="#3b2716" stroke-width="1.6"/><ellipse cx="16.5" cy="15.5" rx="3" ry="2.4" fill="#d9cdb6" stroke="#3b2716" stroke-width="1.6"/><path d="M3 3l18 18" stroke="#c4291c" stroke-width="2.2" stroke-linecap="round"/></svg>` };
  function mostraMusica() {
    const si = musica.musicaAttiva();
    musicaBtn.innerHTML = si ? ICONE_MUSICA.si : ICONE_MUSICA.no;
    musicaBtn.setAttribute('aria-pressed', si); musicaBtn.setAttribute('aria-label', si ? 'Musica accesa' : 'Musica spenta');
  }
  musicaBtn.addEventListener('click', () => { musica.attivaMusica(!musica.musicaAttiva()); mostraMusica(); });
  mostraMusica();
  // un piccolo "pop" a ogni pulsante dell'interfaccia
  document.addEventListener('click', (e) => { if (e.target.closest('.tool, .mp, .vaso-b, .negozio-x, .negozio-vai, .guida-avanti, .suoni-b, .plus, .prova button')) suoni.tocco(); });

  // ritorno dopo una lunga assenza: nessun rimprovero (game-design.md, sezione 6.2)
  if (vista(stato).lungaAssenza) ui.toast('Ti stava aspettando. Un po\' d\'acqua e tornerà a crescere.', 4500);

  // l'app può restare aperta a lungo: il tempo si aggiorna ogni 30 secondi e al ritorno sull'app
  setInterval(aggiornaStato, 30000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') aggiornaStato(); else salva(stato); });
  window.addEventListener('pagehide', () => salva(stato));

  // Strumenti non ancora attivi
  const prossimamente = {
    't-wire': 'Filo: trascina un ramo per piegarlo nella forma voluta. Arriva più avanti.',
    't-care': 'Cura: concime e trattamenti contro i parassiti. Arriva più avanti.',
  };
  for (const id in prossimamente) document.getElementById(id).addEventListener('click', () => ui.toast(prossimamente[id]));

  // --- Negozio dei vasi: il vaso comprato va subito all'acero ---
  const nomeVaso = (id) => VASI.find(x => x.id === id).nome.toLowerCase();
  negozio = creaNegozio({
    compra(id) {
      const esito = compra(stato, id);
      if (esito.esito === 'pochi') { ui.toast(`Ti mancano ${esito.mancano} Semi. Li guadagni annaffiando ogni giorno.`); return; }
      if (esito.esito !== 'ok') return;
      salva(stato); disegna(); suoni.magia();
      negozio.chiudi();
      ui.toast(`Ecco il vaso ${nomeVaso(id)}! Per cambiarlo tocca l'acero e scegli Aspetto.`, 3500);
    },
    usa(id) {
      if (!scegliVaso(stato, id)) return;
      salva(stato); disegna(); suoni.magia();
      negozio.chiudi();
    },
  });
  const apriNegozio = () => { chiudiMenu(); negozio.apri('negozio'); disegna(); };
  document.getElementById('t-shop').addEventListener('click', apriNegozio);
  document.getElementById('plus').addEventListener('click', apriNegozio);

  // --- Tendina dell'acero: si apre toccando la pianta, con Acqua, Pota e Aspetto ---
  const menuAcero = document.getElementById('menu-acero');
  function chiudiMenu() { menuAcero.hidden = true; }
  menuAcero.addEventListener('click', (e) => {
    const a = e.target.closest('button')?.dataset.a; if (!a) return;
    chiudiMenu();
    if (a === 'acqua') waterBtn.click();
    else if (a === 'pota') document.getElementById('t-prune').click();
    else if (a === 'aspetto') { negozio.apri('aspetto'); disegna(); }
  });
  const nomiPiante = { pino: 'Il pino nero', ginepro: 'Il ginepro' };

  // --- Potatura: Pota avvicina la telecamera all'acero, un tocco su un germoglio lo taglia ---
  const pruneBtn = document.getElementById('t-prune');
  const volo = { t: 1, daT: new THREE.Vector3(), aT: new THREE.Vector3(), daD: 0, aD: 0 };
  const centro = target.clone();
  let distanzaPrima = baseDist;
  // sposta con dolcezza il punto guardato e la distanza, lasciando l'angolo scelto dal giocatore
  function vola(versoT, dist) {
    volo.t = 0; volo.daT.copy(controls.target); volo.aT.copy(versoT);
    volo.daD = camera.position.distanceTo(controls.target); volo.aD = dist;
  }
  function potatura(on) {
    if (on === potando) return;
    potando = on; germogli.potatura = on;
    if (on) chiudiMenu();
    pruneBtn.classList.toggle('attivo', on);
    if (on) {
      distanzaPrima = camera.position.distanceTo(controls.target);
      controls.minDistance = baseDist * .2;
      vola(acero.fuoco, baseDist * .27);
    } else {
      vola(centro, Math.max(distanzaPrima, baseDist * .45));
      controls.minDistance = baseDist * .45;
    }
  }
  pruneBtn.addEventListener('click', () => {
    if (potando) { potatura(false); return; }
    if (pannello.anteprima > 0) { ui.toast('Stai guardando un\'anteprima: chiudila o fai passare il tempo.'); return; }
    potatura(true);
    ui.toast(vista(stato).puoPotare ? 'Tocca un germoglio che brilla per tagliarlo. Tocca Pota per finire.' : 'Per ora non c\'è niente da potare: ogni giorno spunta un germoglio nuovo.', 3500);
  });

  const raycaster = new THREE.Raycaster(), puntatore = new THREE.Vector2();
  // un tocco è breve e quasi fermo: così non si confonde con la rotazione della scena
  const dita = new Map();
  canvas.addEventListener('pointerdown', e => dita.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now(), multi: dita.size > 0 }));
  canvas.addEventListener('pointercancel', e => dita.delete(e.pointerId));
  canvas.addEventListener('pointerup', e => {
    const d = dita.get(e.pointerId); dita.delete(e.pointerId);
    if (!d || d.multi || dita.size || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 10 || performance.now() - d.t > 450) return;
    const r = canvas.getBoundingClientRect();
    puntatore.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    raycaster.setFromCamera(puntatore, camera);
    const id = germogli.tocca(raycaster);
    if (id === null) {
      // fuori dalla potatura un tocco su una pianta apre la sua tendina
      if (potando) return;
      const quale = alberi.tocca(raycaster);
      if (quale === 'acero') { menuAcero.hidden = !menuAcero.hidden; if (!menuAcero.hidden) suoni.fruscio(.1); return; }
      chiudiMenu();
      if (quale) ui.toast(`${nomiPiante[quale]} per ora si gode il giardino: per adesso si cura solo l'acero.`);
      return;
    }
    if (!potando) { ui.toast('Per tagliare un germoglio scegli prima Pota.'); return; }
    if (pannello.anteprima > 0) { ui.toast('Stai guardando un\'anteprima: chiudila o fai passare il tempo.'); return; }
    const esito = pota(stato, ora(), id);
    if (esito.esito === 'piccolo') { ui.toast('È ancora troppo piccolo: lascialo crescere un po\'.'); return; }
    if (esito.esito !== 'ok') return;
    ui.forbici(e.clientX - r.left, e.clientY - r.top);
    germogli.taglia(id);
    suoni.forbici(); setTimeout(() => suoni.fruscio(), 350);
    guida.evento('potato');
    salva(stato);
    disegna();
    if (esito.bonusSerie) { ui.guadagnaSemi(esito.bonusSerie, stato.semi, 'acero'); suoni.semi(); }
    ui.toast(esito.bonusSerie ? `${stato.serie.giorni} giorni di fila: +${esito.bonusSerie} Semi!`
      : esito.gemme ? 'Taglio pulito! Sotto il taglio spunteranno due gemme.' : 'Taglio pulito. Questa punta è già bella fitta.');
    // finiti i germogli da tagliare, la telecamera torna indietro da sola
    if (!vista(stato).puoPotare) setTimeout(() => potatura(false), 1600);
  });

  let clock = 0, last = performance.now();
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now; clock += dt;
    if (volo.t < 1) {
      volo.t = Math.min(1, volo.t + dt / .8);
      const k = volo.t * volo.t * (3 - 2 * volo.t), dir = camera.position.clone().sub(controls.target).normalize();
      controls.target.lerpVectors(volo.daT, volo.aT, k);
      camera.position.copy(controls.target).addScaledVector(dir, volo.daD + (volo.aD - volo.daD) * k);
    }
    controls.update();
    alberi.aggiorna(clock);
    germogli.aggiorna(dt, clock);
    giardino.aggiorna(dt, clock);
    if (!reduce) nuvole.aggiorna(dt);
    annaffiatura.aggiorna(dt);
    renderer.render(scene, camera);
    ui.aggiornaEtichette();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
