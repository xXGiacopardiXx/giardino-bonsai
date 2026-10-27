// Germogli da potare e gemme che ricrescono sotto il taglio (fase 4 della roadmap).
// La scena segue la vista del motore: sincronizza() crea, allunga e toglie i pezzi;
// taglia() stacca un germoglio, che cade a terra perdendo qualche foglia.
import * as THREE from 'three';
import { PI, toon, ciuffoAghi, ciuffoFoglie, fogliaAcero } from './strumenti.js';

const smooth = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
const backOut = t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

const SU = new THREE.Vector3(0, 1, 0);
const VERDE_NUOVO = 0xb4e05a, FUSTO = 0xc9d27a, GEMMA = new THREE.Color(0xc9dc6e);

// numeri "casuali" fissi per ogni germoglio, così l'aspetto non cambia a ogni ridisegno
// (e la sequenza col seme della scena resta intatta)
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const fustoGeo = new THREE.CylinderGeometry(.6, 1, 1, 6).translate(0, .5, 0);
// germoglio del pino: una "candela" coperta di aghi corti; la gemma è un ciuffetto di aghi che si apre.
// Sull'acero il germoglio è uno stelo rossiccio con coppie di foglie opposte (sezione 6.1.2)
// e la gemma si apre in un ciuffo di foglie.
const FORME = {
  aghi: { ciuffo: ciuffoAghi({ n: 34, lunghezza: 1, larghezza: .08, seme: 17, nucleo: .3 }), gemma: ciuffoAghi({ n: 40, larghezza: .07, seme: 29 }) },
  foglie: { ciuffo: ciuffoFoglie({ n: 5, seme: 23, nucleo: .1, incavo: .32, grandezza: .74 }), gemma: ciuffoFoglie({ n: 6, seme: 31, nucleo: .15, incavo: .32, grandezza: .74 }) },
};
const budGeo = new THREE.ConeGeometry(1, 2.2, 7).translate(0, 1.1, 0);
const toccoGeo = new THREE.SphereGeometry(.28, 8, 6), toccoMat = new THREE.MeshBasicMaterial({ visible: false });
const aloneGeo = new THREE.SphereGeometry(1, 16, 12);
const fustoMat = toon({ color: FUSTO }), budMat = toon({ color: 0xe8dcb8 });
const fogliaGeo = fogliaAcero(), steloMat = toon({ color: 0x9c3f33 }), budAceroMat = toon({ color: 0xb8483a });
// coppie di foglie lungo lo stelo dell'acero: altezza (0..1), grandezza; ogni coppia è girata di 90° (foglie opposte)
const COPPIE = [[.42, 1], [.72, .82], [.96, .55]];

// albero: { g: gruppo del tronco, punte: [{ p, d }] in coordinate del gruppo, aghi: true per le conifere,
//          scalaGermogli e coloreGermoglio (THREE.Color): facoltativi, per far risaltare i germogli sulla chioma,
//          verde: colore (THREE.Color) delle foglie mature, cambia con le stagioni,
//          potTop: centro del terriccio, dove si fermano i germogli tagliati }
export function creaGermogli(scene, albero) {
  const germogli = new Map(), gemme = new Map(), cadute = [], foglie = [];
  const { ciuffo: ciuffoGeo, gemma: gemmaGeo } = FORME[albero.aghi ? 'aghi' : 'foglie'];
  const terra = albero.potTop.y + .02;
  let potatura = false;

  function nuovoGermoglio(g) {
    const { p, d } = albero.punte[g.punta];
    const o = new THREE.Group(); o.position.copy(p); o.quaternion.setFromUnitVectors(SU, d);
    // ogni germoglio ha il suo materiale: in modalità Pota si illumina
    const mat = toon({ color: VERDE_NUOVO, emissive: 0xfff2a0, emissiveIntensity: 0, side: THREE.DoubleSide });
    const ciuffi = [];
    if (!albero.aghi) {
      const fusto = new THREE.Mesh(fustoGeo, steloMat); fusto.castShadow = true; o.add(fusto);
      COPPIE.forEach(([k, grande], c) => {
        for (const lato of [0, PI]) {
          // perno sullo stelo: la foglia esce di lato e si alza verso la luce
          const perno = new THREE.Group(); perno.rotation.y = c * PI / 2 + lato + (hash(g.id * 9 + c) - .5) * .4; o.add(perno);
          const f = new THREE.Mesh(fogliaGeo, mat); f.castShadow = true; f.position.x = .42; f.rotation.z = .5 + c * .15; perno.add(f);
          ciuffi.push({ m: perno, k, grande });
        }
      });
      const punta = new THREE.Mesh(budGeo, budAceroMat); o.add(punta);
      const tocco = new THREE.Mesh(toccoGeo, toccoMat); tocco.userData.id = g.id; o.add(tocco);
      const alone = new THREE.Mesh(aloneGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
      o.add(alone);
      albero.g.add(o);
      return { o, fusto, ciuffi, punta, tocco, alone, mat, potabile: false, nato: performance.now() };
    }
    const fusto = new THREE.Mesh(fustoGeo, fustoMat); fusto.castShadow = true; o.add(fusto);
    for (let i = 0; i < 5; i++) {
      const c = new THREE.Mesh(ciuffoGeo, mat); c.castShadow = true;
      c.rotation.set(hash(g.id * 5 + i) * PI, hash(g.id * 7 + i) * PI, 0);
      o.add(c); ciuffi.push({ m: c, k: .45 + i * .14, a: hash(g.id * 3 + i) * PI * 2 });
    }
    // gemma apicale chiara in cima alla candela
    const punta = new THREE.Mesh(budGeo, budMat); o.add(punta);
    const tocco = new THREE.Mesh(toccoGeo, toccoMat); tocco.userData.id = g.id; o.add(tocco);
    const alone = new THREE.Mesh(aloneGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
    o.add(alone);
    albero.g.add(o);
    return { o, fusto, ciuffi, punta, tocco, alone, mat, potabile: false, nato: performance.now() };
  }

  // lunghezza 0..1 del motore: il fusto va da 0,2 a 0,7
  function allunga(x, lunghezza) {
    let L = .2 + .5 * lunghezza;
    if (!albero.aghi) {
      // il germoglio dell'acero si allunga molto: da corto e chiuso a getto lungo con le foglie aperte
      L = .14 + .8 * lunghezza;
      x.fusto.scale.set(.011, L, .011);
      // le foglie in alto si aprono dopo: piccole e ripiegate finché il germoglio è corto
      x.ciuffi.forEach(({ m, k, grande }) => {
        const apertura = smooth((lunghezza + .35 - k * .4) / .6);
        m.position.y = L * k; m.scale.setScalar((.06 + .11 * lunghezza) * grande * (.3 + .7 * apertura));
      });
      x.punta.position.y = L; x.punta.scale.set(.012, .02, .012);
      x.tocco.position.y = L * .6;
      x.alone.position.y = L * .6; x.alone.scale.setScalar(.12 + L * .32);
      return;
    }
    x.fusto.scale.set(.026, L, .026);
    x.ciuffi.forEach(({ m, k, a }) => {
      const s = (.08 + .05 * lunghezza) * (1.15 - k * .55);
      m.scale.set(s, s * 1.5, s);
      m.position.set(Math.cos(a) * s * .7, L * k, Math.sin(a) * s * .7);
    });
    x.punta.position.y = L; x.punta.scale.setScalar(.022 + .01 * lunghezza);
    x.tocco.position.y = L * .6;
    x.alone.position.y = L * .75; x.alone.scale.setScalar(.1 + L * .3);
  }

  function nuovaGemma(punta, k) {
    const { p, d } = albero.punte[punta];
    // le gemme si dispongono attorno alla base del taglio, a spirale
    const lato = new THREE.Vector3().crossVectors(d, Math.abs(d.y) > .9 ? new THREE.Vector3(1, 0, 0) : SU).normalize();
    const a = k * 2.4, r = .06 + .018 * k;
    const off = lato.applyAxisAngle(d, a).multiplyScalar(r).addScaledVector(d, .02 + .015 * (k % 2));
    const m = new THREE.Mesh(gemmaGeo, toon({ color: GEMMA.clone(), side: THREE.DoubleSide })); m.castShadow = true;
    m.position.copy(p).add(off);
    m.rotation.set(hash(punta * 11 + k) * PI, hash(punta * 13 + k) * PI, 0);
    albero.g.add(m);
    return { m, nato: performance.now(), crescita: 0 };
  }

  function forma(x, ora) {
    const pop = Math.min(1, (ora - x.nato) / 450);
    const s = (.045 + .09 * x.crescita) * Math.max(.001, backOut(pop));
    x.m.scale.set(s, s * .72, s);
    x.m.material.color.copy(GEMMA).lerp(albero.verde, smooth(x.crescita * 1.2));
  }

  const condivisi = new Set([fustoMat, toccoMat, budMat, steloMat, budAceroMat]);
  function togli(o) { o.parent?.remove(o); o.traverse(c => { if (c.material && !condivisi.has(c.material)) c.material.dispose(); }); }

  return {
    // allinea la scena alla vista del motore (gioco/stato.js)
    sincronizza(vGermogli, vGemme) {
      const visti = new Set();
      for (const g of vGermogli) {
        let x = germogli.get(g.id);
        if (!x) { x = nuovoGermoglio(g); germogli.set(g.id, x); }
        allunga(x, g.lunghezza); x.potabile = g.potabile; visti.add(g.id);
      }
      for (const [id, x] of germogli) if (!visti.has(id)) { togli(x.o); germogli.delete(id); }

      const perPunta = {}, chiavi = new Set();
      for (const g of vGemme) {
        const k = perPunta[g.punta] = (perPunta[g.punta] ?? -1) + 1, chiave = g.punta + ':' + k;
        let x = gemme.get(chiave);
        if (!x) { x = nuovaGemma(g.punta, k); gemme.set(chiave, x); }
        x.crescita = g.crescita; chiavi.add(chiave);
      }
      for (const [chiave, x] of gemme) if (!chiavi.has(chiave)) { togli(x.m); gemme.delete(chiave); }
    },
    // in modalità Pota i germogli da tagliare si illuminano
    set potatura(v) { potatura = v; },
    // il germoglio sotto il dito (raycaster già puntato), oppure null
    tocca(raycaster) {
      const bersagli = [...germogli.values()].map(x => x.tocco);
      const hit = raycaster.intersectObjects(bersagli, false)[0];
      return hit ? hit.object.userData.id : null;
    },
    // dove si trova un germoglio sullo schermo (per l'effetto delle forbici)
    posizione(id) { const x = germogli.get(id); return x ? x.tocco.getWorldPosition(new THREE.Vector3()) : null; },
    // stacca il germoglio: cade a terra e perde qualche foglia
    taglia(id) {
      const x = germogli.get(id); if (!x) return;
      germogli.delete(id);
      x.alone.visible = false; x.mat.emissiveIntensity = 0;
      scene.attach(x.o);
      const lato = new THREE.Vector3(hash(id) - .5, 0, hash(id + 9) - .5).normalize();
      cadute.push({ o: x.o, v: lato.clone().multiplyScalar(.6).setY(.9), giro: lato.cross(SU).multiplyScalar(4), t: 0, terra: null });
      const base = x.o.position;
      for (let i = 0; i < 7; i++) {
        const f = new THREE.Mesh(albero.aghi ? ciuffoGeo : fogliaGeo, x.mat); f.scale.setScalar(.04);
        f.position.copy(base).addScaledVector(SU, .15);
        const a = hash(id * 17 + i) * PI * 2;
        foglie.push({ m: f, v: new THREE.Vector3(Math.cos(a) * 1.1, 1.2 + hash(id + i) * .8, Math.sin(a) * 1.1), t: 0 });
        scene.add(f);
      }
    },
    aggiorna(dt, clock) {
      const ora = performance.now();
      for (const x of germogli.values()) {
        // un germoglio nuovo spunta con un piccolo salto
        const pop = Math.max(.001, backOut(Math.min(1, (ora - x.nato) / 500)));
        x.o.scale.setScalar(pop * (albero.scalaGermogli ?? 1));
        if (albero.coloreGermoglio) x.mat.color.copy(albero.coloreGermoglio);
        const luce = potatura && x.potabile ? .5 + .5 * Math.sin(clock * 4 + x.o.id) : 0;
        x.mat.emissiveIntensity = luce * .55;
        x.alone.material.opacity = luce * .28;
        x.alone.visible = luce > 0;
      }
      for (const x of gemme.values()) forma(x, ora);

      for (let i = cadute.length - 1; i >= 0; i--) {
        const c = cadute[i]; c.t += dt;
        if (c.terra === null) {
          c.v.y -= 9.8 * dt; c.o.position.addScaledVector(c.v, dt);
          c.o.rotation.x += c.giro.x * dt; c.o.rotation.z += c.giro.z * dt;
          if (c.o.position.y < terra) { c.o.position.y = terra; c.terra = 0; }
        } else {
          // a terra resta un attimo, poi sparisce
          c.terra += dt;
          c.o.scale.setScalar(Math.max(.001, 1 - smooth((c.terra - .8) / .5)));
          if (c.terra > 1.3) { togli(c.o); cadute.splice(i, 1); }
        }
      }
      for (let i = foglie.length - 1; i >= 0; i--) {
        const f = foglie[i]; f.t += dt;
        f.v.y -= 6 * dt; f.v.multiplyScalar(1 - 1.5 * dt); f.m.position.addScaledVector(f.v, dt);
        f.m.rotation.x += dt * 6; f.m.scale.setScalar(.04 * Math.max(.001, 1 - f.t / .9));
        if (f.t > .9) { scene.remove(f.m); foglie.splice(i, 1); }
      }
    },
  };
}
