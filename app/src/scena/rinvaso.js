// Rinvaso nella scena (game-design.md, sezione 4.4). Quando il vaso è stretto le radici escono dal
// terriccio e scavalcano il bordo; rinvasando, la pianta si solleva con la sua zolla di radici, le radici
// vengono accorciate, il terriccio nuovo prende il posto del vecchio e la pianta torna giù.
// Ogni specie ha le sue radici: fini e rossicce per l'acero, più grosse e chiare per pino e ginepro.
// I dettagli usano una sequenza casuale propria: la sequenza col seme della scena non cambia.
import * as THREE from 'three';
import { toon, sequenza } from './strumenti.js';

const smooth = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
const backOut = t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

// raggio del bordo del vaso (x, z), colore e spessore delle radici di ogni specie
const SPECIE = {
  acero: { rx: .7, rz: .7, colore: 0x8a5a44, spessore: .011, n: 7 },
  pino: { rx: .56, rz: .56, colore: 0xa4825a, spessore: .015, n: 6 },
  ginepro: { rx: .58, rz: .36, colore: 0x9c7a56, spessore: .014, n: 6 },
};

// una radice che esce dal terriccio e scavalca il bordo, ricadendo fuori dal vaso
function radice(rnd, rx, rz, sp) {
  const a = rnd() * Math.PI * 2, k = .55 + rnd() * .25;
  const dentro = new THREE.Vector3(Math.cos(a) * rx * k, .01, Math.sin(a) * rz * k);
  const bordo = new THREE.Vector3(Math.cos(a) * rx * 1.02, .035, Math.sin(a) * rz * 1.02);
  const fuori = new THREE.Vector3(Math.cos(a) * rx * 1.12, -.08 - rnd() * .08, Math.sin(a) * rz * 1.12);
  const curva = new THREE.CatmullRomCurve3([dentro, dentro.clone().lerp(bordo, .5).setY(.04), bordo, fuori]);
  return new THREE.TubeGeometry(curva, 14, sp * (.7 + rnd() * .6), 5, false);
}

// piante: { acero, pino, ginepro } con g (gruppo del tronco) e potTop (centro del terriccio nel mondo)
export function creaRinvaso(scene, piante) {
  const stati = {};
  for (const id in piante) {
    const p = piante[id], s = SPECIE[id], rnd = sequenza(r(id));
    const mat = toon({ color: s.colore });
    // radici che escono dal vaso stretto
    const fuori = new THREE.Group(); fuori.position.copy(p.potTop); fuori.visible = false; scene.add(fuori);
    for (let i = 0; i < s.n; i++) { const m = new THREE.Mesh(radice(rnd, s.rx, s.rz, s.spessore), mat); m.castShadow = true; fuori.add(m); }
    // zolla di radici sotto la pianta, che si vede solo mentre la pianta è sollevata
    const zolla = new THREE.Group(); zolla.visible = false; p.g.add(zolla);
    const terra = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, Math.PI * .45, Math.PI * .55), toon({ color: 0x5a4030, side: THREE.DoubleSide }));
    terra.scale.set(s.rx * .78, .32, s.rz * .78); terra.position.y = .02; zolla.add(terra);
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2 + rnd() * .3, l = .12 + rnd() * .14;
      const pts = [new THREE.Vector3(Math.cos(a) * s.rx * .6, -.05, Math.sin(a) * s.rz * .6)];
      pts.push(pts[0].clone().multiplyScalar(1.15).setY(-.05 - l * .6), pts[0].clone().multiplyScalar(1.05).setY(-.05 - l));
      const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, s.spessore * .8, 4, false), mat);
      zolla.add(m);
    }
    stati[id] = { p, fuori, zolla, t: -1, y0: p.g.position.y };
  }
  function r(id) { return { acero: 131, pino: 137, ginepro: 139 }[id]; }

  return {
    // vista(stato).rinvaso: le radici escono quando il rinvaso è dovuto
    setRinvaso(v) { for (const id in stati) if (stati[id].t < 0) stati[id].fuori.visible = !!v[id]?.dovuto; },
    get attivo() { return Object.values(stati).some(x => x.t >= 0); },
    // fine(): a metà animazione, quando il terriccio nuovo è al suo posto
    rinvasa(id, fine) { const x = stati[id]; if (!x || x.t >= 0) return; x.t = 0; x.fine = fine; x.fatto = false; },
    aggiorna(dt) {
      for (const id in stati) {
        const x = stati[id];
        if (x.t < 0) continue;
        x.t += dt;
        // su (0-0,7 s), resta sollevata mentre si sistemano le radici (fino a 1,9 s), poi giù
        const su = x.t < .7 ? backOut(x.t / .7) : x.t < 1.9 ? 1 : 1 - smooth((x.t - 1.9) / .7);
        x.p.g.position.y = x.y0 + su * .42;
        x.zolla.visible = su > .05;
        // le radici vengono accorciate: la zolla si fa più compatta
        const pulisci = smooth((x.t - .8) / .8);
        x.zolla.children.forEach((m, i) => { if (i > 0) m.scale.y = 1 - pulisci * .45; });
        if (x.t > 1.1) x.fuori.visible = false;
        if (x.t > 1.3 && !x.fatto) { x.fatto = true; x.fine?.(); }
        if (x.t > 2.6) {
          x.t = -1; x.p.g.position.y = x.y0; x.zolla.visible = false;
          x.zolla.children.forEach((m, i) => { if (i > 0) m.scale.y = 1; });
        }
      }
    },
  };
}
