// Animazione dell'annaffiatura: l'annaffiatoio compare, si inclina, versa le gocce sul vaso
// e il pino torna verde a poco a poco.
import * as THREE from 'three';
import { PI, R, M, mesh } from './strumenti.js';

const smooth = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
const backOut = t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

// eventi.assorbita(): l'acqua arriva al terriccio; eventi.completata(): fine, si dà la ricompensa
export function creaAnnaffiatura(scene, pino, eventi) {
  const can = new THREE.Group(); can.visible = false; scene.add(can);
  const body = 0x5f9e92;
  mesh(new THREE.CylinderGeometry(.24, .27, .42, 20), M(body), can, 0, 0, 0);
  mesh(new THREE.CylinderGeometry(.25, .25, .04, 20), M(0x4b8276), can, 0, .21, 0);
  const sp = mesh(new THREE.CylinderGeometry(.03, .045, .5, 10), M(body), can, .37, .12, 0); sp.rotation.z = -1.05;
  const rose = mesh(new THREE.CylinderGeometry(.075, .04, .08, 12), M(0x4b8276), can, .59, .25, 0); rose.rotation.z = -1.05;
  const h = mesh(new THREE.TorusGeometry(.17, .03, 8, 20, PI), M(0x4b8276), can, -.12, .15, 0); h.rotation.z = .5;
  const SPOUT = new THREE.Vector3(.62, .27, 0);

  const drops = [];
  const dropGeo = new THREE.SphereGeometry(.035, 8, 6), dropMat = new THREE.MeshBasicMaterial({ color: 0x7cc6f0 });
  for (let i = 0; i < 70; i++) { const m = new THREE.Mesh(dropGeo, dropMat); m.visible = false; scene.add(m); drops.push({ m, v: new THREE.Vector3(), on: false }); }

  const potTop = pino.potTop, tipW = new THREE.Vector3();
  let w = -1, assorbita = false, completata = false, emitAcc = 0;
  let sete0 = 1, terriccio0 = 1; // aspetto della pianta all'inizio dell'annaffiatura

  return {
    get attiva() { return w >= 0; },
    // restituisce false se un'annaffiatura è già in corso
    avvia() {
      if (w >= 0) return false;
      w = 0; assorbita = false; completata = false;
      sete0 = pino.thirst; terriccio0 = pino.soilDry;
      return true;
    },
    aggiorna(dt) {
      if (w >= 0) {
        w += dt;
        can.position.set(potTop.x - 1.25, potTop.y - .03 + 1.55, potTop.z + .6);
        const sIn = w < .35 ? backOut(w / .35) : w > 3.0 ? Math.max(0, 1 - (w - 3.0) / .3) : 1;
        can.scale.setScalar(Math.max(.001, sIn)); can.visible = w < 3.3;
        can.rotation.set(0, -.35, w < .35 ? 0 : w < .7 ? -.8 * smooth((w - .35) / .35) : w < 2.6 ? -.8 + Math.sin(w * 6) * .04 : -.8 * (1 - smooth((w - 2.6) / .4)));
        if (w > .7 && w < 2.6) {
          emitAcc += dt * 55; can.updateMatrixWorld();
          while (emitAcc > 1) {
            emitAcc--;
            const d = drops.find(d => !d.on); if (!d) break;
            tipW.copy(SPOUT); can.localToWorld(tipW); d.m.position.copy(tipW);
            // velocità iniziale per atterrare sul terriccio in T secondi
            const T = .42, tx = potTop.x + R(-.35, .35), tz = potTop.z + R(-.3, .3);
            d.v.set((tx - tipW.x) / T, ((potTop.y - tipW.y) + 4.9 * T * T) / T, (tz - tipW.z) / T);
            d.on = true; d.m.visible = true;
          }
        }
        pino.setThirst(sete0 * (1 - smooth((w - 1.0) / 3.0)));
        pino.setSoil(terriccio0 * (1 - smooth((w - .9) / 1.0)));
        if (w > .9 && !assorbita) { assorbita = true; eventi.assorbita(); }
        if (w > 1.2) pino.ring.visible = false;
        if (w > 3.3 && !completata) { completata = true; eventi.completata(); }
        if (w > 4.2) { w = -1; pino.setThirst(0); pino.setSoil(0); }
      }
      drops.forEach(d => {
        if (!d.on) return;
        d.v.y -= 9.8 * dt; d.m.position.addScaledVector(d.v, dt);
        if (d.m.position.y < potTop.y) { d.on = false; d.m.visible = false; }
      });
    },
  };
}
