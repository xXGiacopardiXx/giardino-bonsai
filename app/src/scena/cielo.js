// Cielo, nebbia, luci e nuvole.
import * as THREE from 'three';
import { R, toon } from './strumenti.js';

export function creaCielo(scene) {
  const sc = document.createElement('canvas'); sc.width = 4; sc.height = 512;
  const sx = sc.getContext('2d'), gr = sx.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, '#6fb2da'); gr.addColorStop(.42, '#b4dbe8'); gr.addColorStop(.72, '#f2e3cc'); gr.addColorStop(1, '#f5c99e');
  sx.fillStyle = gr; sx.fillRect(0, 0, 4, 512);
  scene.background = new THREE.CanvasTexture(sc);
  scene.fog = new THREE.Fog(0xf1dcc4, 40, 95);

  // Le intensità sono moltiplicate per PI per avere la stessa luce del prototipo (Three.js r128)
  scene.add(new THREE.HemisphereLight(0xdcefff, 0x9a8a5e, 0.5 * Math.PI));
  const sun = new THREE.DirectionalLight(0xfff0d6, 0.74 * Math.PI);
  sun.position.set(7, 14, 6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 45 });
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.025;
  scene.add(sun);
  return { sun };
}

export function creaNuvole(scene) {
  const clouds = [];
  const mat = toon({ color: 0xf4efe8, emissive: 0x5a554f });
  function cloud(x, y, z, s) {
    const c = new THREE.Group(); c.position.set(x, y, z);
    const n = 7;
    for (let i = 0; i < n; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(s * R(.55, .95), 16, 12), mat);
      b.position.set((i - (n - 1) / 2) * s * .55 + R(-.2, .2) * s, R(0, .45) * s * (1 - Math.abs(i - (n - 1) / 2) / n), R(-.3, .3) * s);
      b.scale.y = .8; c.add(b);
    }
    scene.add(c); clouds.push({ c, sp: R(.08, .18) });
  }
  [[-11, -1.5, -6, 1.5], [10, -.5, -10, 1.7], [-8, 4.5, -17, 2.2], [12, 5.5, -20, 2.4], [3, -6.5, -5, 2.0], [-12, -5, 4, 1.5], [12, -4.5, 2, 1.4], [-1, 8, -26, 3.0], [6, -9, 6, 1.8]].forEach(a => cloud(...a));

  return {
    aggiorna(dt) {
      clouds.forEach(o => { o.c.position.x += o.sp * dt; if (o.c.position.x > 18) o.c.position.x = -18; });
    },
  };
}
