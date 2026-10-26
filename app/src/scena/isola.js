// L'isola fluttuante: strati di terra e roccia, radici che pendono, ghiaia rastrellata.
import * as THREE from 'three';
import { PI, R, rnd, M, toon, flatGeo, mesh, tube } from './strumenti.js';

export const ZS = 1.32; // l'isola è un po' allungata in profondità
// ellisse della ghiaia: centro e raggi
export const GX = 0.2, GZ = -0.6, GRX = 3.5, GRZ = 3.3;

export function creaIsola(world, maxAnisotropy) {
  function layer(rt, rb, h, seg, col, y) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), M(col));
    m.position.y = y; m.scale.z = ZS; m.receiveShadow = true; world.add(m); return m;
  }
  layer(5.3, 5.22, 0.36, 72, 0x8cbc50, -0.18);
  layer(5.18, 4.5, 1.0, 72, 0x9a643f, -0.86);
  layer(4.5, 1.5, 2.8, 48, 0x877e6e, -2.76);
  layer(1.5, 0.25, 1.3, 24, 0x716a5c, -4.8);

  // rocce sporgenti sotto l'isola
  for (let i = 0; i < 12; i++) {
    const a = R(0, PI * 2), r = R(3.4, 4.3);
    const m = mesh(flatGeo(new THREE.DodecahedronGeometry(R(.35, .7), 0)), M(rnd() < .5 ? 0x8f8676 : 0x7a7264), world, Math.cos(a) * r, R(-3.2, -1.6), Math.sin(a) * r * ZS, false);
    m.rotation.set(R(0, 3), R(0, 3), 0);
  }
  // radici e rampicanti che pendono dal bordo
  for (let i = 0; i < 10; i++) {
    const a = R(0, PI * 2);
    const x = Math.cos(a) * 5.18, z = Math.sin(a) * 5.18 * ZS, L = R(.7, 1.7);
    tube([[x, -.2, z], [x * 1.02, -.2 - L * .4, z * 1.02], [x, -.2 - L, z]], .035, .02, 0x5f8f3a, world, 8);
    for (let k = 0; k < 3; k++) mesh(new THREE.IcosahedronGeometry(R(.07, .11), 0), M(0x6f9f43), world, x * 1.02, -.3 - L * R(.15, .95), z * 1.02, false);
  }

  // ghiaia rastrellata: texture disegnata su un canvas
  const gc = document.createElement('canvas'); gc.width = gc.height = 1024;
  const g = gc.getContext('2d');
  const toPx = (x, z) => [((x - GX) / GRX / 2 + .5) * 1024, ((z - GZ) / GRZ / 2 + .5) * 1024];
  g.fillStyle = '#ebe3d1'; g.fillRect(0, 0, 1024, 1024);
  for (let y = -20; y < 1060; y += 22) {
    g.beginPath();
    for (let x = 0; x <= 1024; x += 16) { const yy = y + Math.sin(x * .011 + y * .03) * 6; x ? g.lineTo(x, yy) : g.moveTo(x, yy); }
    g.strokeStyle = '#d4c7ad'; g.lineWidth = 7; g.stroke();
    g.strokeStyle = '#f7f1e5'; g.lineWidth = 2.4; g.translate(0, -5); g.stroke(); g.translate(0, 5);
  }
  // cerchi concentrici intorno alle pietre e ai vasi
  [[0.9, 1.0, 0.45], [-2.3, 0.6, 0.95], [3.3, -2.4, 0.55]].forEach(([x, z, r]) => {
    const [px, py] = toPx(x, z), sx = 1024 / GRX / 2, sz = 1024 / GRZ / 2;
    g.fillStyle = '#ebe3d1'; g.beginPath(); g.ellipse(px, py, (r + .85) * sx, (r + .85) * sz, 0, 0, PI * 2); g.fill();
    for (let k = 1; k <= 6; k++) {
      const rr = r + k * .13;
      g.beginPath(); g.ellipse(px, py, rr * sx, rr * sz, 0, 0, PI * 2); g.strokeStyle = '#d4c7ad'; g.lineWidth = 6; g.stroke();
      g.beginPath(); g.ellipse(px, py - 4, rr * sx, rr * sz, 0, 0, PI * 2); g.strokeStyle = '#f7f1e5'; g.lineWidth = 2; g.stroke();
    }
  });
  for (let i = 0; i < 5000; i++) { g.fillStyle = rnd() < .5 ? 'rgba(150,135,110,.35)' : 'rgba(255,255,255,.5)'; g.fillRect(rnd() * 1024, rnd() * 1024, 2, 2); }
  const gtex = new THREE.CanvasTexture(gc); gtex.anisotropy = maxAnisotropy;
  const gravel = new THREE.Mesh(new THREE.CircleGeometry(1, 80), toon({ map: gtex }));
  gravel.rotation.x = -PI / 2; gravel.scale.set(GRX, GRZ, 1); gravel.position.set(GX, 0.012, GZ); gravel.receiveShadow = true;
  world.add(gravel);
  // sassolini sul bordo della ghiaia
  for (let i = 0; i < 70; i++) {
    const a = i / 70 * PI * 2;
    const m = mesh(new THREE.DodecahedronGeometry(R(.09, .15), 0), M(rnd() < .5 ? 0xb5afa1 : 0x9f9a8c), world, GX + Math.cos(a) * GRX * 1.01, .05, GZ + Math.sin(a) * GRZ * 1.01);
    m.scale.y = .6; m.rotation.y = R(0, 3);
  }
  // pietra con muschio nella ghiaia
  const rk = mesh(new THREE.DodecahedronGeometry(.42, 0), M(0x8e8a7e), world, .9, .16, 1.0); rk.scale.set(1.15, .7, 1); rk.rotation.y = .6;
  const rk2 = mesh(new THREE.DodecahedronGeometry(.22, 0), M(0x9d998c), world, 1.3, .08, 1.25); rk2.scale.y = .7;
  const moss = mesh(new THREE.IcosahedronGeometry(.3, 1), M(0x6d9a43), world, .85, .38, .95); moss.scale.set(1, .28, .8);
}
