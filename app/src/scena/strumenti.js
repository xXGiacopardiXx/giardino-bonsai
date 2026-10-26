// Mattoncini comuni per costruire la scena: numeri casuali, materiali, tubi (rami) e chiome.
import * as THREE from 'three';

export const PI = Math.PI;

// Generatore casuale con seme fisso: la scena è identica a ogni apertura.
let seed = 20261001;
export function rnd() {
  seed |= 0; seed = seed + 0x6D2B79F5 | 0;
  let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
export const R = (a, b) => a + (b - a) * rnd();

// Ombreggiatura "a cartone" in 3 toni
export const toonGradient = new THREE.DataTexture(new Uint8Array([105, 105, 105, 255, 180, 180, 180, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
toonGradient.minFilter = toonGradient.magFilter = THREE.NearestFilter;
toonGradient.needsUpdate = true;

const matCache = {};
export const M = (hex) => matCache[hex] || (matCache[hex] = new THREE.MeshToonMaterial({ color: hex, gradientMap: toonGradient }));
export const toon = (opts) => new THREE.MeshToonMaterial({ gradientMap: toonGradient, ...opts });

// Facce piatte, per sassi e pietre
export const flatGeo = (g) => { if (g.index) g = g.toNonIndexed(); g.computeVertexNormals(); return g; };

export function mesh(geo, mat, parent, x = 0, y = 0, z = 0, shadow = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (shadow) { m.castShadow = true; m.receiveShadow = true; }
  parent.add(m);
  return m;
}

// Tubo che si assottiglia da r0 a r1 lungo i punti: tronchi, rami, radici.
export function tube(pts, r0, r1, col, parent, seg = 20) {
  const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2])));
  const RS = 8, geo = new THREE.TubeGeometry(curve, seg, 1, RS, false), p = geo.attributes.position, c = new THREE.Vector3(), v = new THREE.Vector3();
  for (let i = 0; i <= seg; i++) {
    const t = i / seg; curve.getPointAt(t, c);
    const r = r0 + (r1 - r0) * Math.pow(t, .85);
    for (let j = 0; j <= RS; j++) { const k = i * (RS + 1) + j; v.fromBufferAttribute(p, k).sub(c).multiplyScalar(r).add(c); p.setXYZ(k, v.x, v.y, v.z); }
  }
  geo.computeVertexNormals();
  const m = mesh(geo, M(col), parent);
  const end = curve.getPointAt(1);
  mesh(new THREE.SphereGeometry(r1, 8, 6), M(col), parent, end.x, end.y, end.z);
  return m;
}

// Chioma fatta di tanti ciuffi (pads = cuscinetti [x, y, z, raggio]).
// Se o.stress è dato, prepara anche i colori "sofferenti" per la sete.
export function foliage(parent, pads, o) {
  const items = [];
  pads.forEach(([x, y, z, r]) => {
    const n = Math.round(r * o.density);
    for (let i = 0; i < n; i++) {
      const a = rnd() * PI * 2, d = Math.sqrt(rnd()) * r, dn = d / r;
      const dome = (1 - dn * dn) * r * .34 * (.45 + rnd() * .75);
      items.push({ p: [x + Math.cos(a) * d, y + dome - .04, z + Math.sin(a) * d * .9], s: r * o.size * (.75 + rnd() * .5) * (1 - .35 * dn), h: dome / (r * .34) * .8 + (1 - dn) * .25, dn });
    }
  });
  const m = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, o.detail), toon({ color: 0xffffff }), items.length);
  m.castShadow = true; m.receiveShadow = true;
  const d = new THREE.Object3D(), healthy = [], stressed = [];
  items.forEach((it, i) => {
    d.position.set(it.p[0], it.p[1], it.p[2]);
    d.rotation.set(R(-.2, .2), R(0, PI * 2), R(-.2, .2));
    d.scale.set(it.s, it.s * o.flat, it.s);
    d.updateMatrix(); m.setMatrixAt(i, d.matrix);
    const f = Math.min(1, Math.max(0, it.h * .7 + rnd() * .38)), c = new THREE.Color(o.palette[Math.round(f * (o.palette.length - 1))]);
    healthy.push(c);
    stressed.push(o.stress && rnd() < o.stressRatio ? new THREE.Color(o.stress[Math.floor(rnd() * o.stress.length)]) : c.clone());
    m.setColorAt(i, c);
  });
  parent.add(m);
  // periferia: 0 al centro del ciuffo, 1 sul bordo (i rametti esterni si perdono per primi)
  return { m, healthy, stressed, periferia: items.map(it => it.dn) };
}
