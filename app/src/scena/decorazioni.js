// Decorazioni del giardino (game-design.md, sezione 8.2): pietre impilate, panchina, fontana di bambù,
// gatto che dorme, ponticello rosso. Ognuna sta dove l'ha messa il giocatore (vista del motore) e si
// sposta trascinandola col dito; una decorazione appena messa spunta con un saltello e le stelline.
// Niente numeri casuali: la sequenza con seme fisso della scena resta la stessa.
import * as THREE from 'three';
import { PI, M, flatGeo, mesh, tube } from './strumenti.js';
import { creaScintille } from './alberi.js';
import { DECORAZIONI } from '../gioco/stato.js';

const BAMBU = 0xcdb46c, BAMBU_SCURO = 0x9c8448, PIETRA = 0x9d998c, PIETRA_SCURA = 0x8e8a7e;

// ogni costruttore riceve il gruppo interno (quello che fa il saltello) e restituisce l'animazione, se c'è
const COSTRUISCI = {
  // tre sassi tondi in equilibrio, con un ciuffo di muschio alla base
  pietre(g) {
    [[.3, .14, 0xa9a597], [.22, .36, PIETRA], [.15, .54, 0xb5b0a2]].forEach(([r, y, c], i) => {
      const s = mesh(new THREE.SphereGeometry(r, 14, 10), M(c), g, i * .02, y, -i * .015); s.scale.set(1, .5, .9);
    });
    const m = mesh(new THREE.IcosahedronGeometry(.18, 1), M(0x6d9a43), g, -.22, .04, .12); m.scale.set(1, .3, .8);
  },
  // panchina di legno su due piedi di pietra
  panchina(g) {
    [-.4, .4].forEach(x => mesh(flatGeo(new THREE.BoxGeometry(.16, .26, .3)), M(PIETRA_SCURA), g, x, .13, 0));
    for (let i = 0; i < 3; i++) mesh(new THREE.BoxGeometry(1.15, .06, .11), M(i % 2 ? 0x8a5a3a : 0x9a6a46), g, 0, .29, (i - 1) * .12);
  },
  // shishi-odoshi: il bambù si riempie d'acqua, si inclina versando nella vasca e torna indietro
  // battendo sulla pietra
  fontana(g, { toc }) {
    // vasca di pietra con l'acqua
    mesh(flatGeo(new THREE.CylinderGeometry(.3, .36, .26, 9)), M(PIETRA_SCURA), g, .55, .13, 0);
    const acqua = new THREE.Mesh(new THREE.CircleGeometry(.23, 24), new THREE.MeshPhongMaterial({ color: 0x6cb6c8, shininess: 90, specular: 0xffffff }));
    acqua.rotation.x = -PI / 2; acqua.position.set(.55, .265, 0); g.add(acqua);
    // canna che porta l'acqua, su un paletto
    mesh(new THREE.CylinderGeometry(.04, .045, .95, 7), M(BAMBU), g, .2, .475, -.28);
    tube([[.2, .9, -.28], [.18, .9, -.1], [.12, .84, 0]], .03, .028, BAMBU, g, 8);
    // due paletti e il bambù che oscilla in mezzo
    [-.11, .11].forEach(z => mesh(new THREE.CylinderGeometry(.03, .035, .5, 7), M(BAMBU_SCURO), g, -.1, .25, z));
    const perno = new THREE.Group(); perno.position.set(-.1, .46, 0); g.add(perno);
    const canna = mesh(new THREE.CylinderGeometry(.055, .055, .85, 9), M(BAMBU), perno, .08, 0, 0); canna.rotation.z = PI / 2;
    [-.2, .22].forEach(x => mesh(new THREE.CylinderGeometry(.06, .06, .025, 9), M(BAMBU_SCURO), perno, x, 0, 0).rotation.z = PI / 2);
    // la pietra su cui batte
    const p = mesh(flatGeo(new THREE.DodecahedronGeometry(.13, 0)), M(PIETRA), g, -.42, .07, 0); p.scale.y = .6;
    // ciclo: si riempie (bocca in alto), si inclina e versa, torna indietro e batte
    const SU = .3, GIU = -.42, CICLO = 9;
    let t = 2;
    return (dt, sonoro) => {
      t = (t + dt) % CICLO;
      let a;
      if (t < 7.6) a = SU;
      else if (t < 7.9) a = SU + (GIU - SU) * ((t - 7.6) / .3);
      else if (t < 8.4) a = GIU;
      else if (t < 8.55) a = GIU + (SU - GIU) * ((t - 8.4) / .15);
      else a = SU;
      // il colpo sulla pietra
      if (t >= 8.55 && t - dt < 8.55 && sonoro) toc();
      perno.rotation.z = a;
    };
  },
  // gatto rosso acciambellato che respira piano, con la coda attorno
  gatto(g) {
    const pelo = M(0xe8913a), chiaro = M(0xf7e3c4);
    const corpo = mesh(new THREE.SphereGeometry(.3, 16, 12), pelo, g, 0, .15, 0); corpo.scale.set(1.15, .55, .9);
    const testa = new THREE.Group(); testa.position.set(.27, .17, .13); testa.rotation.y = -.5; g.add(testa);
    const t = mesh(new THREE.SphereGeometry(.14, 14, 10), pelo, testa, 0, 0, 0); t.scale.set(1, .85, 1);
    mesh(new THREE.SphereGeometry(.07, 10, 8), chiaro, testa, .08, -.04, .06).scale.set(1, .7, .9);
    [-.07, .07].forEach(z => { const o = mesh(new THREE.ConeGeometry(.05, .1, 4), pelo, testa, -.02, .12, z); o.rotation.x = z * 2; });
    // occhi chiusi: due trattini scuri
    [-.04, .05].forEach(z => mesh(new THREE.BoxGeometry(.012, .008, .04), M(0x3b2716), testa, .125, .02, z + .03, false));
    tube([[-.3, .08, -.05], [-.25, .07, .25], [0, .06, .32], [.22, .07, .26]], .045, .035, pelo, g, 12);
    let c = 0;
    return (dt) => { c += dt; const k = 1 + .045 * Math.sin(c * 1.6); corpo.scale.set(1.15, .55 * k, .9 * (1 + (k - 1) * .5)); };
  },
  // ponte ad arco laccato di rosso, sopra il laghetto
  ponte(g) {
    const L = 1.45, H = .38, N = 15, ROSSO = 0xc8402c;
    const y = (x) => .08 + H * (1 - (x / L) ** 2);
    for (let i = 0; i < N; i++) {
      const x = -L + (i + .5) * 2 * L / N, pend = -2 * H * x / (L * L);
      const asse = mesh(new THREE.BoxGeometry(2 * L / N * 1.02, .05, .62), M(i % 2 ? 0x8a5a3a : 0x9a6a46), g, x, y(x), 0);
      asse.rotation.z = Math.atan(pend);
    }
    [-.33, .33].forEach(z => {
      const pts = []; for (let i = 0; i <= 12; i++) { const x = -L * .96 + i / 12 * 2 * L * .96; pts.push([x, y(x) + .3, z]); }
      tube(pts, .035, .035, ROSSO, g, 30);
      for (let i = 0; i <= 6; i++) { const x = -L * .96 + i / 6 * 2 * L * .96; mesh(new THREE.CylinderGeometry(.035, .035, .34, 7), M(ROSSO), g, x, y(x) + .14, z); }
      // pomelli dorati alle estremità
      [-L * .96, L * .96].forEach(x => mesh(new THREE.SphereGeometry(.055, 10, 8), M(0xe8b84a), g, x, y(x) + .34, z));
    });
  },
};

// dove non deve crescere l'erba, per ogni decorazione: [dx, dz, raggio] attorno al suo posto
const ZONE = { pietre: [[0, 0, .5]], panchina: [[0, 0, .75]], fontana: [[.1, 0, .85]], gatto: [[0, .05, .55]], ponte: [[-1.4, 0, .45], [1.4, 0, .45]] };
const RAGGIO = Object.fromEntries(DECORAZIONI.map(d => [d.id, d.raggio]));
const VERDE = new THREE.Color(0x8fe06a), ROSSO = new THREE.Color(0xff6a4a);

// azioni: toc() (il bambù che batte, solo se i suoni sono accesi)
export function creaDecorazioni(world, { toc }) {
  const dec = {};
  for (const id in COSTRUISCI) {
    const posto = new THREE.Group(); posto.visible = false; world.add(posto);
    const g = new THREE.Group(); posto.add(g);
    dec[id] = { posto, g, dove: null, anima: COSTRUISCI[id](g, { toc }), scintille: creaScintille(posto, g) };
  }
  // anello sotto la decorazione che si sta spostando: verde dove si può posare, rosso dove no
  const anello = new THREE.Mesh(new THREE.RingGeometry(.86, 1, 48), new THREE.MeshBasicMaterial({ color: VERDE, transparent: true, opacity: .85, depthWrite: false }));
  anello.rotation.x = -PI / 2; anello.visible = false; anello.renderOrder = 3; world.add(anello);
  let scelta = null, prova = null, primaVolta = true, tempo = 0;

  // mette il gruppo della decorazione nel punto giusto (con prova, quello mentre la si trascina)
  function colloca(id) {
    const d = dec[id], p = id === scelta && prova ? prova : d.dove;
    if (!p) return;
    d.posto.position.set(p.x, 0, p.z); d.posto.rotation.y = p.r;
    // mentre la si trascina si solleva un poco, come presa in mano
    d.g.position.y = id === scelta && prova?.inMano ? .14 : 0;
    if (id === scelta) {
      anello.position.set(p.x, .03, p.z); anello.scale.setScalar(RAGGIO[id] * 1.1);
      anello.material.color.copy(prova && !prova.valido ? ROSSO : VERDE);
    }
  }
  return {
    // lista: le decorazioni nel giardino, { id, x, z, r }; quelle nuove (dopo la prima volta) spuntano con le stelline
    setDecorazioni(lista) {
      for (const id in dec) {
        const d = dec[id], qui = lista.find(x => x.id === id);
        if (qui && !d.posto.visible && !primaVolta) d.scintille.avvia();
        d.posto.visible = !!qui; d.dove = qui ?? null;
        colloca(id);
      }
      if (scelta && !dec[scelta].posto.visible) this.seleziona(null);
      primaVolta = false;
    },
    // le zone senza erba delle decorazioni nel giardino, in coordinate dell'isola
    zone() {
      const z = [];
      for (const id in dec) {
        const p = dec[id].dove; if (!p || !dec[id].posto.visible) continue;
        for (const [dx, dz, raggio] of ZONE[id]) z.push([+(p.x + dx * Math.cos(p.r) + dz * Math.sin(p.r)).toFixed(3), +(p.z - dx * Math.sin(p.r) + dz * Math.cos(p.r)).toFixed(3), raggio]);
      }
      return z;
    },
    // la decorazione toccata dal dito (id), oppure null
    tocca(raycaster) {
      let meglio = null, d = Infinity;
      for (const id in dec) {
        if (!dec[id].posto.visible) continue;
        const hit = raycaster.intersectObject(dec[id].g, true)[0];
        if (hit && hit.distance < d) { d = hit.distance; meglio = id; }
      }
      return meglio;
    },
    // la decorazione da spostare (id), oppure null per finire
    seleziona(id) {
      if (scelta && scelta !== id) { const s = scelta; scelta = null; prova = null; colloca(s); }
      scelta = id; prova = null; anello.visible = !!id;
      if (id) colloca(id);
    },
    // posizione provvisoria mentre la si trascina ({ x, z, r, valido, inMano }), oppure null
    prova(p) { prova = p; if (scelta) colloca(scelta); },
    // dov'è adesso la decorazione scelta (anche mentre la si trascina)
    get posizione() { return scelta ? { ...(prova ?? dec[scelta].dove) } : null; },
    aggiorna(dt) {
      tempo += dt;
      if (anello.visible) anello.material.opacity = .6 + .3 * Math.sin(tempo * 5);
      for (const id in dec) {
        const d = dec[id]; if (!d.posto.visible) continue;
        d.anima?.(dt, true);
        d.scintille.aggiorna(dt);
      }
    },
  };
}
