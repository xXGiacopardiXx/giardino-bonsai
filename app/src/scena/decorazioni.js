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
  // rana di pietra accovacciata, col muschio sulla schiena
  rana(g) {
    const pietra = M(0x8f9a7e);
    const corpo = mesh(new THREE.SphereGeometry(.2, 14, 10), pietra, g, 0, .14, 0); corpo.scale.set(1, .75, 1.15);
    const testa = mesh(new THREE.SphereGeometry(.13, 12, 9), pietra, g, 0, .24, .16); testa.scale.set(1.1, .8, 1);
    [-.07, .07].forEach(x => {
      mesh(new THREE.SphereGeometry(.05, 10, 8), M(0xa7b292), g, x, .31, .19);
      mesh(new THREE.SphereGeometry(.022, 8, 6), M(0x3b2716), g, x * 1.05, .32, .235, false);
      // zampe davanti e dietro
      const z1 = mesh(new THREE.SphereGeometry(.07, 8, 6), pietra, g, x * 1.6, .04, .16); z1.scale.set(1, .4, 1.3);
      const z2 = mesh(new THREE.SphereGeometry(.1, 8, 6), pietra, g, x * 2.2, .07, -.06); z2.scale.set(.8, .6, 1.3);
    });
    const m = mesh(new THREE.IcosahedronGeometry(.13, 1), M(0x6d9a43), g, -.02, .26, -.05); m.scale.set(1, .3, 1);
  },
  // lanterna rossa di carta appesa a una canna di bambù piegata: dondola piano
  'lanterna-carta'(g) {
    mesh(new THREE.CylinderGeometry(.035, .045, 1.5, 7), M(BAMBU), g, 0, .75, 0);
    tube([[0, 1.48, 0], [.18, 1.58, 0], [.42, 1.55, 0]], .03, .022, BAMBU, g, 8);
    [.4, .9, 1.3].forEach(y => mesh(new THREE.CylinderGeometry(.045, .045, .02, 7), M(BAMBU_SCURO), g, 0, y, 0));
    const perno = new THREE.Group(); perno.position.set(.42, 1.55, 0); g.add(perno);
    mesh(new THREE.CylinderGeometry(.006, .006, .14, 4), M(0x3b2716), perno, 0, -.07, 0, false);
    const carta = new THREE.Mesh(new THREE.SphereGeometry(.17, 14, 10), new THREE.MeshToonMaterial({ color: 0xd8402c, emissive: 0x5a1408 }));
    carta.scale.set(1, 1.25, 1); carta.position.y = -.33; carta.castShadow = true; perno.add(carta);
    [-.2, .2].forEach((dy, i) => mesh(new THREE.CylinderGeometry(.09, .09, .04, 12), M(0x2e2018), perno, 0, -.33 + dy * (i ? 1.05 : 1.05), 0));
    mesh(new THREE.CylinderGeometry(.01, .01, .12, 4), M(0xe8b84a), perno, 0, -.6, 0, false);
    let c = 0;
    return (dt) => { c += dt; perno.rotation.z = Math.sin(c * 1.3) * .08; perno.rotation.x = Math.sin(c * .9 + 1) * .05; };
  },
  // tsukubai: vasca bassa di pietra con l'acqua, il mestolo di bambù e due sassi davanti
  tsukubai(g) {
    const v = mesh(flatGeo(new THREE.CylinderGeometry(.32, .36, .3, 10)), M(PIETRA_SCURA), g, 0, .15, 0); v.rotation.y = .3;
    const acqua = new THREE.Mesh(new THREE.CircleGeometry(.2, 20), new THREE.MeshPhongMaterial({ color: 0x6cb6c8, shininess: 90, specular: 0xffffff }));
    acqua.rotation.x = -PI / 2; acqua.position.set(0, .29, 0); g.add(acqua);
    // il mestolo appoggiato sopra
    const manico = mesh(new THREE.CylinderGeometry(.012, .012, .5, 5), M(BAMBU), g, .05, .33, -.08); manico.rotation.z = PI / 2; manico.rotation.y = .4;
    mesh(new THREE.CylinderGeometry(.05, .045, .07, 8), M(BAMBU), g, -.17, .34, 0);
    [[.42, .2, .14], [-.38, .26, .11]].forEach(([x, z, r]) => { const s = mesh(flatGeo(new THREE.DodecahedronGeometry(r, 0)), M(PIETRA), g, x, r * .5, z); s.scale.y = .6; });
    const m = mesh(new THREE.IcosahedronGeometry(.16, 1), M(0x6d9a43), g, -.25, .05, -.2); m.scale.set(1, .3, .8);
  },
  // nodate: ombrello rosso sopra una panca col telo rosso
  ombrellone(g) {
    [-.38, .38].forEach(x => [-.14, .14].forEach(z => mesh(new THREE.BoxGeometry(.06, .26, .06), M(0x8a5a3a), g, x, .13, z)));
    mesh(new THREE.BoxGeometry(.95, .05, .4), M(0x9a6a46), g, 0, .28, 0);
    mesh(new THREE.BoxGeometry(.97, .02, .42), M(0xc8402c), g, 0, .315, 0);
    mesh(new THREE.CylinderGeometry(.025, .025, 1.55, 6), M(0x8a5a3a), g, .5, .78, -.22);
    const tela = mesh(new THREE.ConeGeometry(.85, .32, 16, 1, true), new THREE.MeshToonMaterial({ color: 0xd8402c, side: THREE.DoubleSide }), g, .5, 1.42, -.22);
    tela.castShadow = true;
    // le stecche sotto l'ombrello
    for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; tube([[.5, 1.3, -.22], [.5 + Math.cos(a) * .8, 1.27, -.22 + Math.sin(a) * .8]], .008, .008, 0xe8d6a8, g, 2); }
    mesh(new THREE.SphereGeometry(.04, 8, 6), M(0xe8b84a), g, .5, 1.6, -.22);
  },
  // piccolo torii rosso: due colonne, due travi, la trave alta curva coi bordi neri
  torii(g) {
    const ROSSO = 0xc8402c, NERO = 0x2e2018;
    [-.55, .55].forEach(x => {
      mesh(new THREE.CylinderGeometry(.07, .08, 1.35, 10), M(ROSSO), g, x, .67, 0);
      mesh(new THREE.CylinderGeometry(.1, .1, .1, 10), M(NERO), g, x, .05, 0);
    });
    mesh(new THREE.BoxGeometry(1.3, .08, .09), M(ROSSO), g, 0, 1.08, 0);
    mesh(new THREE.BoxGeometry(.08, .2, .06), M(ROSSO), g, 0, 1.2, 0);
    const pts = []; for (let i = 0; i <= 10; i++) { const x = -.9 + i * .18; pts.push([x, 1.36 + .06 * (x / .9) ** 2, 0]); }
    tube(pts, .07, .07, ROSSO, g, 16);
    tube(pts.map(([x, y, z]) => [x, y + .08, z]), .05, .05, NERO, g, 16);
  },
  // pagoda di pietra a cinque tetti, con un po' di muschio
  pagoda(g) {
    mesh(flatGeo(new THREE.CylinderGeometry(.26, .3, .22, 4)), M(PIETRA_SCURA), g, 0, .11, 0).rotation.y = PI / 4;
    let y = .22;
    for (let i = 0; i < 5; i++) {
      const k = 1 - i * .12;
      mesh(new THREE.BoxGeometry(.24 * k, .16, .24 * k), M(PIETRA), g, 0, y + .08, 0);
      const tetto = mesh(flatGeo(new THREE.CylinderGeometry(.06 * k, .32 * k, .09, 4)), M(i % 2 ? PIETRA_SCURA : 0x8a867a), g, 0, y + .2, 0); tetto.rotation.y = PI / 4;
      if (i % 2 === 0) { const m = mesh(new THREE.IcosahedronGeometry(.06, 0), M(0x6d9a43), g, .12 * k, y + .24, .1 * k); m.scale.set(1.4, .4, 1); }
      y += .26;
    }
    mesh(new THREE.ConeGeometry(.04, .22, 6), M(PIETRA_SCURA), g, 0, y + .06, 0);
    mesh(new THREE.SphereGeometry(.045, 8, 6), M(PIETRA), g, 0, y + .2, 0);
  },
};

// dove non deve crescere l'erba, per ogni decorazione: [dx, dz, raggio] attorno al suo posto
const ZONE = { pietre: [[0, 0, .5]], panchina: [[0, 0, .75]], fontana: [[.1, 0, .85]], gatto: [[0, .05, .55]], ponte: [[-1.4, 0, .45], [1.4, 0, .45]],
  rana: [[0, 0, .32]], 'lanterna-carta': [[0, 0, .25]], tsukubai: [[0, 0, .55]], ombrellone: [[0, 0, .65]], torii: [[-.55, 0, .2], [.55, 0, .2]], pagoda: [[0, 0, .4]] };
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
