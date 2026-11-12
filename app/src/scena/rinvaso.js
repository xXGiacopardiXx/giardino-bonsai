// Rinvaso nella scena (game-design.md, sezione 4.4). Quando il vaso è stretto le radici escono dal
// terriccio e scavalcano il bordo. Rinvasando c'è una piccola sequenza, da guardare con gusto:
// la pianta si abbassa e poi esce dal vaso con la sua zolla; si scuote e il terriccio vecchio si
// sbriciola; le forbici accorciano le radici in tre colpi; piovono i granuli del terriccio nuovo
// (del colore del terriccio scelto); la pianta scende, si assesta con un rimbalzo e si alza un po' di polvere.
// Ogni specie ha le sue radici: fini e rossicce per l'acero, più grosse e chiare per pino e ginepro.
// I dettagli usano una sequenza casuale propria: la sequenza col seme della scena non cambia.
import * as THREE from 'three';
import { toon, sequenza } from './strumenti.js';

const smooth = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
const backOut = t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const fase = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));

// raggio del bordo del vaso (x, z), colore e spessore delle radici di ogni specie
const SPECIE = {
  acero: { rx: .7, rz: .7, colore: 0x8a5a44, spessore: .011, n: 7 },
  pino: { rx: .56, rz: .56, colore: 0xa4825a, spessore: .015, n: 6 },
  ginepro: { rx: .58, rz: .36, colore: 0x9c7a56, spessore: .014, n: 6 },
  azalea: { rx: .5, rz: .5, colore: 0xa07a5a, spessore: .013, n: 6 },
  ciliegio: { rx: .55, rz: .45, colore: 0x8e5e4a, spessore: .013, n: 6 },
};
// colori dei granuli del terriccio nuovo
const GRANULI = {
  akadama: [0xc8894a, 0xd69a58, 0xb87a40],
  'miscela-conifere': [0xc8894a, 0xeeeade, 0x8a3c2c, 0xe2ddd0],
  kanuma: [0xe6d27a, 0xd8c060, 0xf0e09a],
};
// tempi della sequenza (secondi)
const T = { su: .25, alto: .95, scuoti: 1.75, tagli: [1.95, 2.3, 2.65], pioggia: [2.85, 3.6], giu: [3.7, 4.4], fine: 5.1 };

// una radice che esce dal terriccio e scavalca il bordo, ricadendo fuori dal vaso
function radice(rnd, rx, rz, sp) {
  const a = rnd() * Math.PI * 2, k = .55 + rnd() * .25;
  const dentro = new THREE.Vector3(Math.cos(a) * rx * k, .01, Math.sin(a) * rz * k);
  const bordo = new THREE.Vector3(Math.cos(a) * rx * 1.02, .035, Math.sin(a) * rz * 1.02);
  const fuori = new THREE.Vector3(Math.cos(a) * rx * 1.12, -.08 - rnd() * .08, Math.sin(a) * rz * 1.12);
  const curva = new THREE.CatmullRomCurve3([dentro, dentro.clone().lerp(bordo, .5).setY(.04), bordo, fuori]);
  return new THREE.TubeGeometry(curva, 14, sp * (.7 + rnd() * .6), 5, false);
}

// forbici da radici: due lame che si chiudono
function forbici() {
  const g = new THREE.Group(), lama = new THREE.BoxGeometry(.2, .012, .03).translate(.1, 0, 0);
  const acciaio = toon({ color: 0x9aa4a8 }), manico = toon({ color: 0xe2483a });
  const lame = [0, 1].map(() => {
    const p = new THREE.Group(); g.add(p);
    p.add(new THREE.Mesh(lama, acciaio));
    const m = new THREE.Mesh(new THREE.TorusGeometry(.03, .01, 6, 12), manico); m.position.x = -.05; p.add(m);
    return p;
  });
  g.visible = false;
  return { g, lame };
}

// piante: { acero, pino, ginepro } con g (gruppo del tronco) e potTop (centro del terriccio nel mondo)
export function creaRinvaso(scene, piante) {
  const stati = {};
  for (const id in piante) {
    const p = piante[id], s = SPECIE[id], rnd = sequenza({ acero: 131, pino: 137, ginepro: 139, azalea: 149, ciliegio: 151 }[id]);
    const mat = toon({ color: s.colore });
    // radici che escono dal vaso stretto
    const fuori = new THREE.Group(); fuori.position.copy(p.potTop); fuori.visible = false; scene.add(fuori);
    for (let i = 0; i < s.n; i++) { const m = new THREE.Mesh(radice(rnd, s.rx, s.rz, s.spessore), mat); m.castShadow = true; fuori.add(m); }
    // zolla di radici sotto la pianta, che si vede solo mentre la pianta è sollevata
    const zolla = new THREE.Group(); zolla.visible = false; p.g.add(zolla);
    const terra = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, Math.PI * .45, Math.PI * .55), toon({ color: 0x5a4030, side: THREE.DoubleSide }));
    terra.scale.set(s.rx * .78, .32, s.rz * .78); terra.position.y = .02; zolla.add(terra);
    const radici = [];
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2 + rnd() * .3, l = .12 + rnd() * .14;
      const pts = [new THREE.Vector3(Math.cos(a) * s.rx * .6, -.05, Math.sin(a) * s.rz * .6)];
      pts.push(pts[0].clone().multiplyScalar(1.15).setY(-.05 - l * .6), pts[0].clone().multiplyScalar(1.05).setY(-.05 - l));
      const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, s.spessore * .8, 4, false), mat);
      zolla.add(m); radici.push(m);
    }
    stati[id] = { p, s, fuori, zolla, terra, radici, mat, t: -1, y0: p.g.position.y };
  }

  // particelle condivise: briciole di terriccio vecchio, pezzetti di radice, granuli nuovi, polvere
  const bricolaGeo = new THREE.IcosahedronGeometry(1, 0), radiceGeo = new THREE.CylinderGeometry(.005, .005, .07, 4);
  const terraVecchia = toon({ color: 0x4e3626 }), granuliMat = {};
  const particelle = [];
  function particella(geo, mat, pos, vel, s, terra, vita = 2.5) {
    let x = particelle.find(q => !q.on && q.m.geometry === geo);
    if (!x) { x = { m: new THREE.Mesh(geo, mat) }; x.m.castShadow = true; scene.add(x.m); particelle.push(x); }
    x.m.material = mat; x.m.visible = true; x.m.position.copy(pos); x.m.scale.setScalar(s); x.m.rotation.set(Math.random() * 3, Math.random() * 3, 0);
    Object.assign(x, { on: true, v: vel, terra, t: 0, vita, s, posato: false });
  }
  const polvereTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(196,160,118,.9)'); r.addColorStop(1, 'rgba(196,160,118,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  const polvere = Array.from({ length: 14 }, () => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: polvereTex, transparent: true, depthWrite: false, opacity: 0 }));
    sp.visible = false; scene.add(sp); return { sp, v: new THREE.Vector3(), t: -1 };
  });
  const cesoie = forbici(); scene.add(cesoie.g);
  const tmp = new THREE.Vector3();

  return {
    // vista(stato).rinvaso: le radici escono quando il rinvaso è dovuto
    // le radici che escono dal vaso seguono la pianta, anche se è stata spostata
    setRinvaso(v) { for (const id in stati) if (stati[id].t < 0) { stati[id].fuori.visible = !!v[id]?.dovuto; stati[id].fuori.position.copy(stati[id].p.potTop); } },
    get attivo() { return Object.values(stati).some(x => x.t >= 0); },
    // terriccio: id del terriccio usato (colore dei granuli);
    // eventi: taglio() a ogni colpo di forbici, pioggia() quando cadono i granuli, posata() quando la pianta
    // tocca il terriccio nuovo, fine() a sequenza conclusa
    rinvasa(id, terriccio, eventi = {}) {
      const x = stati[id]; if (!x || x.t >= 0) return;
      x.t = 0; x.eventi = eventi; x.passati = new Set();
      x.colori = (GRANULI[terriccio] ?? GRANULI.akadama).map(c => granuliMat[c] ??= toon({ color: c }));
      x.radici.forEach(m => { m.scale.set(1, 1, 1); });
      x.terra.material.color.setHex(0x5a4030);
    },
    aggiorna(dt) {
      for (const id in stati) {
        const x = stati[id];
        if (x.t < 0) continue;
        const t0 = x.t; x.t += dt; const t = x.t;
        const una = (nome, quando) => { if (t0 < quando && t >= quando && !x.passati.has(nome)) { x.passati.add(nome); return true; } return false; };
        const { p, s } = x, base = p.potTop;
        // altezza: si abbassa un attimo, esce con uno scatto, resta su, scende piano e rimbalza
        let y = 0;
        if (t < T.su) y = -.035 * Math.sin(fase(t, 0, T.su) * Math.PI);
        else if (t < T.alto) y = .55 * backOut(fase(t, T.su, T.alto));
        else if (t < T.giu[0]) y = .55 + Math.sin(t * 2.4) * .012;
        else if (t < T.giu[1]) y = .55 * (1 - smooth(fase(t, T.giu[0], T.giu[1])));
        // si scuote: il terriccio vecchio si sbriciola
        const scuoti = t > T.alto && t < T.scuoti ? Math.sin(t * 38) * .025 * (1 - fase(t, T.alto, T.scuoti)) : 0;
        p.g.position.y = x.y0 + y;
        p.g.position.x = (p.g.userData.x0 ??= p.g.position.x) + scuoti;
        // assestamento: un piccolo schiacciamento quando tocca il terriccio nuovo
        const ass = t > T.giu[1] ? Math.sin(fase(t, T.giu[1], T.giu[1] + .45) * Math.PI) : 0;
        p.g.scale.set(1 + ass * .03, 1 - ass * .05, 1 + ass * .03);
        x.zolla.visible = t > .3 && t < T.giu[1];

        p.g.updateMatrixWorld();
        // briciole di terriccio vecchio mentre si scuote
        if (t > T.alto && t < T.scuoti && Math.random() < dt * 40) {
          const a = Math.random() * Math.PI * 2;
          x.zolla.localToWorld(tmp.set(Math.cos(a) * s.rx * .55, -.05 - Math.random() * .15, Math.sin(a) * s.rz * .55));
          particella(bricolaGeo, terraVecchia, tmp, new THREE.Vector3(Math.cos(a) * .4, .2, Math.sin(a) * .4), .012 + Math.random() * .014, base.y + .005);
        }
        // il terriccio vecchio si stacca: la zolla schiarisce un poco e si fa più piccola
        const pulita = fase(t, T.alto, T.scuoti);
        x.terra.scale.set(s.rx * .78 * (1 - pulita * .2), .32 * (1 - pulita * .25), s.rz * .78 * (1 - pulita * .2));
        // tre colpi di forbici: le radici si accorciano a scatti e i pezzetti cadono
        lame: {
          const primo = T.tagli[0] - .15, ultimo = T.tagli[2] + .25;
          cesoie.g.visible = t > primo && t < ultimo;
          if (!cesoie.g.visible) break lame;
          const k = T.tagli.findIndex(q => t < q + .2), lato = (k < 0 ? 2 : k) * 2.1;
          x.zolla.localToWorld(tmp.set(Math.cos(lato) * s.rx * .75, -.18, Math.sin(lato) * s.rz * .75));
          cesoie.g.position.copy(tmp); cesoie.g.rotation.set(0, -lato + Math.PI, 0);
          const vicino = Math.min(...T.tagli.map(q => Math.abs(t - q)));
          const chiuso = vicino < .08 ? 1 - vicino / .08 : 0;
          cesoie.lame[0].rotation.z = .45 * (1 - chiuso); cesoie.lame[1].rotation.z = -.45 * (1 - chiuso);
        }
        T.tagli.forEach((q, i) => {
          if (!una('taglio' + i, q)) return;
          x.eventi.taglio?.();
          x.radici.forEach((m, j) => { if (j % 3 === i) m.scale.y = .55; else m.scale.y = Math.min(m.scale.y, .8); });
          for (let n = 0; n < 5; n++) {
            const a = q * 3 + n;
            x.zolla.localToWorld(tmp.set(Math.cos(a) * s.rx * .65, -.2, Math.sin(a) * s.rz * .65));
            particella(radiceGeo, x.mat, tmp, new THREE.Vector3(Math.cos(a) * .3, .5, Math.sin(a) * .3), 1, base.y + .005);
          }
        });
        if (una('via', T.alto + .2)) x.fuori.visible = false;
        // pioggia di granuli nuovi nel vaso, dall'alto
        if (una('pioggia', T.pioggia[0])) x.eventi.pioggia?.();
        if (t > T.pioggia[0] && t < T.pioggia[1] && Math.random() < dt * 70) {
          const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * .8;
          tmp.set(base.x + Math.cos(a) * s.rx * r, base.y + .9 + Math.random() * .2, base.z + Math.sin(a) * s.rz * r);
          particella(bricolaGeo, x.colori[Math.floor(Math.random() * x.colori.length)], tmp, new THREE.Vector3(0, -.5, 0), .014 + Math.random() * .01, base.y + .012, 3);
        }
        // tocca terra: nuvoletta di polvere tutt'intorno
        if (una('posata', T.giu[1])) {
          x.eventi.posata?.();
          polvere.forEach((q, i) => {
            const a = i / polvere.length * Math.PI * 2;
            q.sp.position.set(base.x + Math.cos(a) * s.rx * .8, base.y + .05, base.z + Math.sin(a) * s.rz * .8);
            q.v.set(Math.cos(a) * .35, .12, Math.sin(a) * .35); q.t = 0; q.sp.visible = true;
          });
        }
        if (t > T.fine) {
          x.t = -1; p.g.position.y = x.y0; p.g.position.x = p.g.userData.x0; p.g.scale.set(1, 1, 1); x.zolla.visible = false; cesoie.g.visible = false;
          x.eventi.fine?.();
        }
      }
      // particelle: cadono, rimbalzano un poco, si posano e svaniscono
      for (const q of particelle) {
        if (!q.on) continue;
        q.t += dt;
        if (!q.posato) {
          q.v.y -= 9.8 * dt; q.m.position.addScaledVector(q.v, dt); q.m.rotation.x += dt * 6;
          if (q.m.position.y <= q.terra) {
            q.m.position.y = q.terra;
            if (Math.abs(q.v.y) > .8) { q.v.y *= -.25; q.v.x *= .4; q.v.z *= .4; } else q.posato = true;
          }
        }
        if (q.t > q.vita - .5) q.m.scale.setScalar(q.s * Math.max(.001, (q.vita - q.t) / .5));
        if (q.t > q.vita) { q.on = false; q.m.visible = false; }
      }
      for (const q of polvere) {
        if (q.t < 0) continue;
        q.t += dt; q.sp.position.addScaledVector(q.v, dt);
        q.sp.scale.setScalar(.1 + q.t * .35); q.sp.material.opacity = Math.max(0, .55 * (1 - q.t / .9));
        if (q.t > .9) { q.t = -1; q.sp.visible = false; }
      }
    },
  };
}
