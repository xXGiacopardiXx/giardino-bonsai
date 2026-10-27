// Il resto del giardino: laghetto con le carpe koi, lanterna, staccionata di bambù,
// alberi di sfondo, cespugli, pietre del sentiero, prato e foglie che cadono.
import * as THREE from 'three';
import { PI, R, rnd, M, toon, flatGeo, mesh, tube, foliage, fogliaAcero } from './strumenti.js';
import { ZS, GX, GZ, GRX, GRZ } from './isola.js';

export function creaGiardino(world, { reduce }) {
  // Laghetto
  const koi = [];
  {
    const cx = -2.3, cz = 3.45;
    const basin = mesh(new THREE.CylinderGeometry(1.3, 1.3, .04, 48), M(0x587a64), world, cx, .005, cz, false); basin.scale.z = .85; basin.receiveShadow = true;
    const water = new THREE.Mesh(new THREE.CircleGeometry(1.18, 48), new THREE.MeshPhongMaterial({ color: 0x6cb6c8, shininess: 90, specular: 0xffffff }));
    water.rotation.x = -PI / 2; water.scale.y = .85; water.position.set(cx, .03, cz); water.receiveShadow = true; world.add(water);
    const shine = new THREE.Mesh(new THREE.RingGeometry(.55, .62, 40, 1, .4, 1.6), new THREE.MeshBasicMaterial({ color: 0xd6f2f6, transparent: true, opacity: .7 }));
    shine.rotation.x = -PI / 2; shine.position.set(cx, .034, cz); world.add(shine);
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * PI * 2 + R(-.1, .1);
      const m = mesh(new THREE.DodecahedronGeometry(R(.15, .27), 0), M(rnd() < .5 ? 0xa9a597 : 0x928e81), world, cx + Math.cos(a) * 1.28, .06, cz + Math.sin(a) * 1.28 * .85);
      m.scale.y = .55; m.rotation.y = R(0, 3);
    }
    // ninfee e un fiore di loto
    [[.35, -.3], [-.5, .15], [.1, .42]].forEach(([x, z]) => { const p = mesh(new THREE.CylinderGeometry(.17, .17, .012, 18, 1, false, 0, 5.5), M(0x5c9645), world, cx + x, .04, cz + z, false); p.rotation.y = R(0, 6); });
    const lot = new THREE.Group(); lot.position.set(cx + .35, .06, cz - .3); world.add(lot);
    for (let i = 0; i < 6; i++) { const pe = mesh(new THREE.SphereGeometry(.05, 8, 6), M(0xf4a9c0), lot, Math.cos(i) * .045, .02, Math.sin(i) * .045, false); pe.scale.set(.7, 1.4, .7); }
    mesh(new THREE.SphereGeometry(.03, 8, 6), M(0xffe27a), lot, 0, .05, 0, false);
    // due carpe koi che girano in tondo
    [[.55, .5, 0xf07a2e], [.75, -.36, 0xf5f0e6]].forEach(([r, sp, col], i) => {
      const k = new THREE.Group(); world.add(k);
      const b = mesh(new THREE.SphereGeometry(1, 12, 8), M(col), k, 0, 0, 0, false); b.scale.set(.19, .045, .07);
      const s = mesh(new THREE.SphereGeometry(1, 10, 8), M(i ? 0xf07a2e : 0xffffff), k, .06, .02, 0, false); s.scale.set(.07, .03, .05);
      const tl = mesh(new THREE.ConeGeometry(.06, .12, 6), M(col), k, -.22, 0, 0, false); tl.rotation.z = PI / 2; tl.scale.z = .3;
      koi.push({ k, tail: tl, r, sp, a: i * 2, cx, cz });
    });
  }

  // Lanterna di pietra accesa
  {
    const L = new THREE.Group(); L.position.set(3.3, 0, -2.4); world.add(L);
    const st = 0xaba79a, st2 = 0x918d81;
    mesh(flatGeo(new THREE.CylinderGeometry(.34, .4, .16, 6)), M(st2), L, 0, .08, 0);
    mesh(flatGeo(new THREE.CylinderGeometry(.1, .13, .6, 6)), M(st), L, 0, .46, 0);
    mesh(flatGeo(new THREE.CylinderGeometry(.3, .24, .1, 6)), M(st2), L, 0, .81, 0);
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(.19, .19, .3, 6), new THREE.MeshBasicMaterial({ color: 0xffd892 })); lamp.position.y = 1.0; L.add(lamp);
    for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; mesh(new THREE.BoxGeometry(.05, .3, .05), M(st), L, Math.cos(a) * .2, 1.0, Math.sin(a) * .2); }
    mesh(flatGeo(new THREE.ConeGeometry(.5, .28, 6)), M(st2), L, 0, 1.3, 0);
    mesh(new THREE.SphereGeometry(.08, 10, 8), M(st), L, 0, 1.48, 0);
    const pl = new THREE.PointLight(0xffc56b, .55 * PI, 3.2, 1); pl.position.y = 1.0; L.add(pl);
    for (let i = 0; i < 5; i++) { const b = mesh(new THREE.IcosahedronGeometry(R(.12, .2), 1), M(0x6a9a40), L, R(-.45, .45), .03, R(-.45, .45)); b.scale.y = .35; }
  }

  // Staccionata di bambù sul retro
  {
    const N = 36, pg = new THREE.CylinderGeometry(.055, .062, 1, 7); pg.translate(0, .5, 0);
    const poles = new THREE.InstancedMesh(pg, M(0xcdb46c), N); poles.castShadow = true; poles.receiveShadow = true;
    const d = new THREE.Object3D(), arc = [];
    for (let i = 0; i < N; i++) {
      const a = -.95 + i / (N - 1) * 1.9;
      d.position.set(Math.sin(a) * 4.3, 0, -Math.cos(a) * 4.3 * ZS); d.scale.set(1, R(1.15, 1.4), 1); d.rotation.set(0, 0, 0);
      d.updateMatrix(); poles.setMatrixAt(i, d.matrix);
    }
    world.add(poles);
    for (let i = 0; i <= 20; i++) { const a = -.95 + i / 20 * 1.9; arc.push([Math.sin(a) * 4.3, 0, -Math.cos(a) * 4.3 * ZS + .07]); }
    [.45, 1.0].forEach(h => tube(arc.map(p => [p[0], h, p[2]]), .035, .035, 0x9c8448, world, 40));
  }

  // Alberi di sfondo: un albero che cambia con le stagioni e un ciuffo di bambù
  let sfondo;
  {
    const t = new THREE.Group(); t.position.set(-2.6, 0, -6.0); world.add(t);
    tube([[0, 0, 0], [.15, 1.2, .05], [-.1, 2.3, 0], [.1, 3.2, 0]], .32, .1, 0x6f5a49, t, 16);
    [[[0, 1.8, 0], [-.8, 2.5, .2], [-1.4, 2.8, .3]], [[.05, 2.1, 0], [.8, 2.7, -.1], [1.3, 3.0, -.2]]].forEach(p => tube(p, .13, .04, 0x6f5a49, t, 10));
    const f = foliage(t, [[-1.3, 2.8, .3, 1.0], [1.2, 3.0, -.2, 1.0], [0, 3.5, 0, 1.2], [-.3, 2.9, .6, .8], [.5, 3.0, .5, .8]], { palette: ['#c99a2e', '#d9ad38', '#e6c048', '#efd25c', '#f6e07a'], density: 26, size: .34, flat: .85, detail: 1 });
    // in primavera fiorito di rosa, in estate verde, in autunno giallo oro, in inverno quasi spoglio
    const tinte = [['#e9a6b8', '#f0b6c6', '#f5c6d2', '#f9d6de', '#fde6ec'], ['#3f7a34', '#4b893b', '#589843', '#67a64c', '#78b357'], null, ['#9a8a6a', '#a8987a', '#b5a688', '#c2b496', '#cfc2a6']]
      .map(pal => pal ? f.toni.map(x => new THREE.Color(pal[Math.round(x * 4)])) : f.healthy);
    const originali = f.m.instanceMatrix.array.slice(), zero = new THREE.Matrix4().makeScale(0, 0, 0), c = new THREE.Color();
    let prima = -1;
    sfondo = (p) => {
      const s = Math.floor(p) % 4, k = Math.min(1, Math.max(0, (p - Math.floor(p) - .6) / .4)), chiave = s * 10 + Math.round(k * 7);
      if (chiave === prima) return;
      prima = chiave;
      // negli ultimi giorni di ogni stagione il colore sfuma in quello della stagione dopo
      const da = tinte[s], a = tinte[(s + 1) % 4];
      for (let i = 0; i < f.healthy.length; i++) {
        f.m.setColorAt(i, c.copy(da[i]).lerp(a[i], k));
        const spoglio = s === 3 ? 1 - k : s === 2 ? k : 0;
        if (f.periferia[i] + (i * .618 % 1) * .4 < spoglio * 1.25) f.m.setMatrixAt(i, zero);
        else f.m.instanceMatrix.array.set(originali.subarray(i * 16, i * 16 + 16), i * 16);
      }
      f.m.instanceColor.needsUpdate = true; f.m.instanceMatrix.needsUpdate = true;
    };
  }
  {
    const t = new THREE.Group(); t.position.set(2.7, 0, -5.95); world.add(t);
    const pads = [];
    for (let i = 0; i < 8; i++) { const x = R(-.7, .7), z = R(-.4, .4), h = R(3.0, 4.3), lx = R(-.25, .25); tube([[x, 0, z], [x + lx * .4, h * .5, z], [x + lx, h, z]], .07, .05, 0x8fae4a, t, 6); pads.push([x + lx, h - .3, z, R(.35, .55)]); }
    foliage(t, pads, { palette: ['#4f8a38', '#5f9a3e', '#72ab48', '#88bb55'], density: 30, size: .3, flat: .6, detail: 1 });
  }

  // Cespugli
  function bush(x, z, r, pal, h = .3) {
    const gp = new THREE.Group(); gp.position.set(x, 0, z); world.add(gp);
    foliage(gp, [[0, h, 0, r], [r * .5, h * .7, r * .3, r * .65], [-r * .5, h * .6, -r * .2, r * .6]], { palette: pal, density: 40, size: .36, flat: .85, detail: 1 });
  }
  const verde = ['#3f6f3c', '#4c7f45', '#5d9150', '#73a35e'];
  bush(-4.25, -1.6, .6, verde);
  bush(4.45, .3, .55, verde);
  bush(-4.05, 4.6, .5, verde);
  bush(3.85, 4.7, .55, ['#b5422c', '#c9572f', '#da7634', '#e89a3e']);
  bush(4.25, -3.3, .5, verde);
  bush(-.9, 6.1, .45, verde);

  // Pietre del sentiero
  [[1.3, 5.7], [1.0, 4.9], [1.45, 4.15], [1.1, 3.4]].forEach(([x, z]) => { const s = mesh(flatGeo(new THREE.CylinderGeometry(.33, .36, .09, 8)), M(0xb5b0a2), world, x, .03, z); s.rotation.y = R(0, 3); s.scale.z = .8; });

  // Prato: fili d'erba e fiorellini, tranne dove ci sono ghiaia, laghetto, pino e sentiero
  const inEll = (x, z, cx, cz, rx, rz) => ((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2 < 1;
  const blocked = (x, z) => inEll(x, z, GX, GZ, GRX * 1.06, GRZ * 1.06) || inEll(x, z, -2.3, 3.45, 1.55, 1.35) || (Math.abs(x - 2.1) < 1.0 && Math.abs(z - 2.0) < .72) || inEll(x, z, 1.2, 4.5, .6, 1.6);
  {
    const N = 1300, geo = new THREE.ConeGeometry(.05, .24, 4); geo.translate(0, .12, 0);
    const im = new THREE.InstancedMesh(geo, toon({ color: 0xffffff }), N); im.receiveShadow = true;
    const d = new THREE.Object3D(), pal = ['#5f8d35', '#6f9f3c', '#80b046', '#93c052', '#a5cb5f'];
    let n = 0, guard = 0;
    while (n < N && guard++ < 20000) {
      const x = R(-5.1, 5.1), z = R(-6.8, 6.8);
      if (!inEll(x, z, 0, 0, 5.1, 5.1 * ZS) || blocked(x, z)) continue;
      d.position.set(x, 0, z); d.rotation.set(R(-.25, .25), R(0, 6), R(-.25, .25));
      const s = R(.7, 1.5); d.scale.set(s, s * R(.8, 1.4), s);
      d.updateMatrix(); im.setMatrixAt(n, d.matrix); im.setColorAt(n, new THREE.Color(pal[Math.floor(rnd() * pal.length)])); n++;
    }
    im.count = n; world.add(im);
    const fl = ['#ffffff', '#ffe27a', '#f6b3c8', '#fff3c4'];
    for (let i = 0; i < 70; i++) {
      const x = R(-5, 5), z = R(-6.6, 6.6);
      if (!inEll(x, z, 0, 0, 4.9, 4.9 * ZS) || blocked(x, z)) continue;
      mesh(new THREE.SphereGeometry(.045, 6, 5), M(new THREE.Color(fl[i % 4]).getHex()), world, x, .2, z, false);
    }
  }

  // Foglie d'acero a terra e foglie che cadono: hanno la forma della foglia d'acero, coi colori del suo autunno
  const leafGeo = fogliaAcero().scale(.085, .085, .085);
  const leafCols = ['#ad1f1c', '#cc2c22', '#e3462a', '#f0702c', '#f79c38'];
  let foglieATerra;
  {
    const N = 80, im = new THREE.InstancedMesh(leafGeo, toon({ color: 0xffffff, side: THREE.DoubleSide }), N); im.receiveShadow = true;
    const d = new THREE.Object3D();
    for (let i = 0; i < N; i++) {
      const a = R(0, PI * 2), r = Math.sqrt(rnd()) * 2.6;
      const x = Math.cos(a) * r * 1.1, z = -2.4 + Math.sin(a) * r * .8;
      // quelle che cadono sul tavolo restano all'altezza del piano
      d.position.set(x, (Math.abs(x) < 1.05 && Math.abs(z + 2.4) < .65) ? .82 : .02, z);
      d.rotation.set(0, R(0, 6), 0); d.updateMatrix(); im.setMatrixAt(i, d.matrix); im.setColorAt(i, new THREE.Color(leafCols[i % 5]));
    }
    world.add(im);
    foglieATerra = im;
  }
  const falling = [];
  if (!reduce) for (let i = 0; i < 12; i++) {
    const m = new THREE.Mesh(leafGeo, toon({ color: leafCols[i % 5], side: THREE.DoubleSide })); world.add(m);
    const L = { m, ph: 0, sp: .3, reset() { m.position.set(R(-1.1, 1.1), R(2.6, 3.4), -2.4 + R(-.7, .7)); this.ph = R(0, 6); this.sp = R(.25, .45); } };
    L.reset(); m.position.y = R(.3, 3.2); falling.push(L);
  }

  return {
    // le foglie d'acero cadono da metà autunno all'inizio dell'inverno e restano a terra ancora un po'
    // (p: punto dell'anno, 0 = inizio primavera, 2 = autunno, 3 = inverno)
    setStagione(p) {
      sfondo(p);
      falling.forEach(L => { L.m.visible = p >= 2.4 && p < 3.4; });
      foglieATerra.visible = p >= 2.5 && p < 3.7;
    },
    aggiorna(dt, clock) {
      falling.forEach(L => {
        L.ph += dt; L.m.position.y -= L.sp * dt; L.m.position.x += Math.sin(L.ph * 1.6) * .35 * dt; L.m.position.z += Math.cos(L.ph * 1.1) * .2 * dt;
        L.m.rotation.set(L.ph * 1.3, L.ph * .9, L.ph * .6);
        if (L.m.position.y < .03) L.reset();
      });
      koi.forEach(o => {
        o.a += o.sp * dt;
        const x = o.cx + Math.cos(o.a) * o.r, z = o.cz + Math.sin(o.a) * o.r * .8, s = Math.sign(o.sp);
        o.k.position.set(x, .045, z);
        o.k.rotation.y = Math.atan2(-(Math.cos(o.a) * o.r * .8 * s), -Math.sin(o.a) * o.r * s);
        o.tail.rotation.y = Math.sin(clock * 8) * .4;
      });
    },
  };
}
