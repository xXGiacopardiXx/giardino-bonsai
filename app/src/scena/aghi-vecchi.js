// Aghi vecchi del pino (sezione 4.3): in autunno alcuni cuscinetti hanno ciuffi di aghi ingialliti
// da togliere a mano, così luce e aria arrivano dentro la chioma. In modalità Pota brillano piano;
// toccandoli cadono a terra. La scena segue la vista del motore (conifere.pino.vecchi).
// I dettagli usano una sequenza casuale propria: la sequenza col seme della scena non cambia.
import * as THREE from 'three';
import { toon, ciuffoAghi, sequenza } from './strumenti.js';

// cuscinetti del pino dove possono stare (POSTI_VECCHI del motore)
const CUSCINETTI = [0, 1, 2, 3, 4];
const ciuffoGeo = ciuffoAghi({ n: 30, lunghezza: 1, larghezza: .06, seme: 61, nucleo: .25 });
const toccoGeo = new THREE.SphereGeometry(.24, 8, 6), toccoMat = new THREE.MeshBasicMaterial({ visible: false });
const TINTE = [0xc49a3e, 0xb07a34, 0xd2b058, 0x9c6a2e];

// pino: cure.pino di scena/alberi.js (ciuffiDi, gruppoDi)
export function creaAghiVecchi(pino) {
  const posti = CUSCINETTI.map((pad, posto) => {
    const rnd = sequenza(711 + posto * 13);
    const g = new THREE.Group(); g.visible = false; pino.gruppoDi(pad).add(g);
    // 4 ciuffi gialli sopra i ciuffi più esterni del cuscinetto
    const ciuffi = pino.ciuffiDi(pad).slice().sort((a, b) => (b.pos.y + b.pos.z * .5) - (a.pos.y + a.pos.z * .5)).slice(0, 4);
    const mat = toon({ color: 0xffffff, emissive: 0xfff0a0, emissiveIntensity: 0, side: THREE.DoubleSide });
    const parti = ciuffi.map((c, i) => {
      const m = new THREE.Mesh(ciuffoGeo, mat.clone()); m.castShadow = true;
      m.material.color.setHex(TINTE[i % TINTE.length]);
      m.position.copy(c.pos).add(new THREE.Vector3((rnd() - .5) * c.sc.x * .5, c.sc.y * .35, (rnd() - .5) * c.sc.x * .5));
      m.rotation.set(rnd() * .6, rnd() * 6, rnd() * .6);
      m.scale.setScalar(c.sc.x * .55);
      m.userData.base = { pos: m.position.clone(), rot: m.rotation.clone(), s: c.sc.x * .55 };
      g.add(m); return m;
    });
    const centro = ciuffi.reduce((v, c) => v.add(c.pos), new THREE.Vector3()).multiplyScalar(1 / Math.max(1, ciuffi.length));
    const tocco = new THREE.Mesh(toccoGeo, toccoMat); tocco.position.copy(centro).y += .08; g.add(tocco);
    return { g, parti, tocco, id: null, cade: -1 };
  });
  let potatura = false;

  return {
    // vecchi: [{ id, posto }]
    sincronizza(vecchi) {
      posti.forEach((x, posto) => {
        const v = vecchi.find(y => y.posto === posto);
        if (x.cade >= 0) return;  // sta cadendo
        // ricompare dopo essere caduto: i ciuffi tornano al loro posto
        if (v && !x.g.visible) x.parti.forEach(m => { const b = m.userData.base; m.position.copy(b.pos); m.rotation.copy(b.rot); m.scale.setScalar(b.s); });
        x.id = v ? v.id : null; x.g.visible = !!v; x.tocco.userData.id = x.id;
      });
    },
    set potatura(v) { potatura = v; },
    // il ciuffo di aghi vecchi sotto il dito (raycaster già puntato), oppure null
    tocca(raycaster) {
      const visibili = posti.filter(x => x.g.visible && x.cade < 0).map(x => x.tocco);
      const hit = raycaster.intersectObjects(visibili, false)[0];
      return hit ? hit.object.userData.id : null;
    },
    // tolto: gli aghi cadono e spariscono
    togli(id) { const x = posti.find(y => y.id === id); if (x) x.cade = 0; },
    aggiorna(dt, clock) {
      for (const x of posti) {
        if (!x.g.visible) continue;
        if (x.cade >= 0) {
          x.cade += dt;
          x.parti.forEach((m, i) => { m.position.y -= dt * (.6 + i * .15); m.rotation.z += dt * 3; m.scale.multiplyScalar(1 - dt * .9); });
          if (x.cade > 1.2) { x.g.visible = false; x.cade = -1; x.id = null; }
          continue;
        }
        const luce = potatura ? .5 + .5 * Math.sin(clock * 4) : 0;
        x.parti.forEach(m => { m.material.emissiveIntensity = luce * .5; });
      }
    },
  };
}
