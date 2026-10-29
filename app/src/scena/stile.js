// Modalità Stile nella scena (game-design.md, sezione 5.2): la sagoma fantasma dello stile scelto,
// come una nuvola chiara attorno alla chioma, e un luccichio sui ciuffi che ne escono (quelli da tagliare).
// I ciuffi tagliati cadono a terra come una manciata di foglie o aghi.
import * as THREE from 'three';
import { toon } from './strumenti.js';

const sfera = new THREE.SphereGeometry(1, 28, 18);
const velo = new THREE.MeshBasicMaterial({ color: 0xfff6dc, transparent: true, opacity: .16, depthWrite: false });
const bordo = new THREE.MeshBasicMaterial({ color: 0xffe8a8, transparent: true, opacity: .3, depthWrite: false, side: THREE.BackSide });
const luce = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const g = c.getContext('2d'), r = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  r.addColorStop(0, 'rgba(255,255,240,1)'); r.addColorStop(.35, 'rgba(255,224,120,.85)'); r.addColorStop(1, 'rgba(255,200,80,0)');
  g.fillStyle = r; g.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
})();
// colore delle briciole di chioma che cadono, per specie
const CHIOMA = { acero: 0x6fa83e, pino: 0x4a6c34, ginepro: 0x38775e };

// piante: { acero, pino, ginepro } con g (gruppo del tronco) e potTop
export function creaStile(scene, piante) {
  const stati = {};
  for (const id in piante) {
    const sagoma = new THREE.Group(); sagoma.visible = false; piante[id].g.add(sagoma);
    const punti = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ map: luce, size: .14, transparent: true, depthWrite: false, depthTest: false }));
    punti.renderOrder = 15; punti.visible = false; piante[id].g.add(punti);
    stati[id] = { sagoma, punti, stileId: null };
  }
  const cadute = [], bricolaGeo = new THREE.IcosahedronGeometry(1, 0), materiali = {};
  let attiva = null, clock = 0;

  return {
    get attiva() { return attiva; },
    // mostra la sagoma dello stile e i ciuffi da tagliare (fuori: indici; ciuffi: posizioni dalla scena)
    mostra(id, stile, ciuffi, fuori) {
      for (const k in stati) { const s = stati[k]; s.sagoma.visible = s.punti.visible = k === id; }
      attiva = id;
      const s = stati[id];
      if (s.stileId !== stile.id) {
        s.stileId = stile.id;
        s.sagoma.clear();
        for (const { c, r } of stile.sagoma) {
          for (const [mat, k] of [[velo, 1], [bordo, 1.03]]) {
            const m = new THREE.Mesh(sfera, mat); m.position.set(...c); m.scale.set(r[0] * k, r[1] * k, r[2] * k); m.renderOrder = 14;
            s.sagoma.add(m);
          }
        }
      }
      const pos = new Float32Array(fuori.length * 3);
      fuori.forEach((i, n) => { const q = ciuffi[i]; pos[n * 3] = q.x; pos[n * 3 + 1] = q.y + .04; pos[n * 3 + 2] = q.z; });
      s.punti.geometry.dispose(); s.punti.geometry = new THREE.BufferGeometry();
      s.punti.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    },
    nascondi() { for (const k in stati) stati[k].sagoma.visible = stati[k].punti.visible = false; attiva = null; },
    // una manciata di foglie o aghi che cade dove si è tagliato (posizioni nel gruppo del tronco)
    taglia(id, posizioni) {
      const g = piante[id].g, mat = materiali[id] ??= toon({ color: CHIOMA[id] });
      g.updateMatrixWorld();
      for (const p of posizioni) for (let n = 0; n < 3; n++) {
        let x = cadute.find(q => !q.on);
        if (!x) { x = { m: new THREE.Mesh(bricolaGeo, mat) }; x.m.castShadow = true; scene.add(x.m); cadute.push(x); }
        x.m.material = mat; x.m.visible = true; x.on = true; x.t = 0;
        x.m.position.set(p.x, p.y, p.z); g.localToWorld(x.m.position);
        x.m.scale.set(.03, .012, .022); x.terra = piante[id].potTop.y - .02;
        const a = Math.random() * Math.PI * 2;
        x.v = new THREE.Vector3(Math.cos(a) * .5, .8 + Math.random() * .5, Math.sin(a) * .5);
      }
    },
    aggiorna(dt) {
      clock += dt;
      if (attiva) stati[attiva].punti.material.size = .12 + Math.sin(clock * 5) * .035;
      for (const x of cadute) {
        if (!x.on) continue;
        x.t += dt;
        if (x.m.position.y > x.terra) { x.v.y -= 6 * dt; x.m.position.addScaledVector(x.v, dt); x.m.rotation.x += dt * 5; x.m.rotation.z += dt * 3; }
        if (x.t > 1.6) x.m.scale.multiplyScalar(1 - dt * 3);
        if (x.t > 2.4) { x.on = false; x.m.visible = false; }
      }
    },
  };
}
