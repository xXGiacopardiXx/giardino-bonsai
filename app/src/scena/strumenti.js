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
// col: colore oppure materiale già pronto (es. corteccia)
export function tube(pts, r0, r1, col, parent, seg = 20) {
  const mat = typeof col === 'number' ? M(col) : col;
  const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2])));
  const RS = 8, geo = new THREE.TubeGeometry(curve, seg, 1, RS, false), p = geo.attributes.position, c = new THREE.Vector3(), v = new THREE.Vector3();
  for (let i = 0; i <= seg; i++) {
    const t = i / seg; curve.getPointAt(t, c);
    const r = r0 + (r1 - r0) * Math.pow(t, .85);
    for (let j = 0; j <= RS; j++) { const k = i * (RS + 1) + j; v.fromBufferAttribute(p, k).sub(c).multiplyScalar(r).add(c); p.setXYZ(k, v.x, v.y, v.z); }
  }
  geo.computeVertexNormals();
  const m = mesh(geo, mat, parent);
  const end = curve.getPointAt(1);
  mesh(new THREE.SphereGeometry(r1, 8, 6), mat, parent, end.x, end.y, end.z);
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
  // o.geo: forma del singolo ciuffo (aghi, foglie); senza, una pallina sfaccettata
  const m = new THREE.InstancedMesh(o.geo || new THREE.IcosahedronGeometry(1, o.detail), toon({ color: 0xffffff, side: o.geo ? THREE.DoubleSide : THREE.FrontSide }), items.length);
  m.castShadow = true; m.receiveShadow = true;
  const d = new THREE.Object3D(), healthy = [], stressed = [], toni = [];
  items.forEach((it, i) => {
    d.position.set(it.p[0], it.p[1], it.p[2]);
    d.rotation.set(R(-.2, .2), R(0, PI * 2), R(-.2, .2));
    d.scale.set(it.s, it.s * o.flat, it.s);
    d.updateMatrix(); m.setMatrixAt(i, d.matrix);
    const f = Math.min(1, Math.max(0, it.h * .7 + rnd() * .38)), c = new THREE.Color(o.palette[Math.round(f * (o.palette.length - 1))]);
    healthy.push(c); toni.push(f);
    stressed.push(o.stress && rnd() < o.stressRatio ? new THREE.Color(o.stress[Math.floor(rnd() * o.stress.length)]) : c.clone());
    m.setColorAt(i, c);
  });
  parent.add(m);
  // periferia: 0 al centro del ciuffo, 1 sul bordo (i rametti esterni si perdono per primi)
  // toni: posizione di ogni ciuffo nella tavolozza (0 = primo colore), per ricolorarlo con le stagioni
  return { m, healthy, stressed, toni, periferia: items.map(it => it.dn) };
}

// --- Dettagli realistici dei bonsai: aghi, foglie palmate, corteccia ---
// Usano una sequenza casuale propria, così la sequenza col seme della scena non cambia.
export function sequenza(s) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

// Le normali puntano verso l'esterno del ciuffo: la luce lo modella come un cuscinetto morbido,
// mentre il contorno mostra i singoli aghi o le singole foglie.
// nucleo: raggio di una pallina piena al centro, che dà corpo al ciuffo (0 = nessuna)
function geoCiuffo(pos, nucleo = 0) {
  if (nucleo) {
    const ico = new THREE.IcosahedronGeometry(nucleo, 0).toNonIndexed().attributes.position.array;
    for (let i = 0; i < ico.length; i += 3) pos.push(ico[i], ico[i + 1] * .8, ico[i + 2]);
  }
  const g = new THREE.BufferGeometry(), nrm = [];
  for (let i = 0; i < pos.length; i += 3) {
    const v = new THREE.Vector3(pos[i], pos[i + 1] + .35, pos[i + 2]).normalize();
    nrm.push(v.x, v.y, v.z);
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  return g;
}

// Ciuffo di aghi (pino) di raggio circa 1: n aghi sottili che partono dal centro.
// apertura: quanto in basso arrivano gli aghi (-1 = sfera intera, 0 = solo verso l'alto, a spazzola)
export function ciuffoAghi({ n = 46, lunghezza = 1, larghezza = .07, seme = 7, nucleo = .5, apertura = -.35 } = {}) {
  const rnd = sequenza(seme), pos = [], d = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    // direzioni sparse su una cupola, un po' anche verso il basso
    const y = apertura + (1 - apertura) * (i + .5) / n, r = Math.sqrt(Math.max(0, 1 - y * y)), t = i * 2.39996;
    d.set(Math.cos(t) * r, y, Math.sin(t) * r).normalize();
    const L = lunghezza * (.7 + rnd() * .35), base = d.clone().multiplyScalar(.12);
    const tip = d.clone().multiplyScalar(L);
    a.crossVectors(d, Math.abs(d.y) > .9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)).normalize();
    b.crossVectors(d, a).normalize();
    // due triangoli incrociati: l'ago si vede da ogni lato
    for (const s of [a, b]) {
      const w = s.clone().multiplyScalar(larghezza * L);
      pos.push(base.x - w.x, base.y - w.y, base.z - w.z, base.x + w.x, base.y + w.y, base.z + w.z, tip.x, tip.y, tip.z);
    }
  }
  return geoCiuffo(pos, nucleo * lunghezza);
}

// Ciuffo di foglie palmate (acero) di raggio circa 1.
// lobi: quante punte ha la foglia; incavo: quanto sono profondi i tagli tra un lobo e l'altro (più basso = più profondi)
export function ciuffoFoglie({ n = 7, seme = 11, nucleo = .45, lobi = 5, incavo = .38, grandezza = .55 } = {}) {
  const rnd = sequenza(seme), pos = [];
  // contorno della foglia nel piano: picciolo in (0,0), lobi a ventaglio verso +x, il centrale più lungo
  const contorno = [], ap = lobi > 5 ? 1.5 : 1.2;
  for (let j = 0; j < lobi; j++) {
    const ang = -ap + 2 * ap * j / (lobi - 1), L = .5 + .5 * Math.cos(ang * .85);
    contorno.push([Math.cos(ang) * L, Math.sin(ang) * L]);
    if (j < lobi - 1) { const m = ang + ap / (lobi - 1); contorno.push([Math.cos(m) * incavo, Math.sin(m) * incavo]); }
  }
  const q = new THREE.Quaternion(), v = new THREE.Vector3(), d = new THREE.Vector3(), base = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const y = .15 + .7 * rnd(), r = Math.sqrt(1 - y * y), t = i * 2.39996 + rnd();
    d.set(Math.cos(t) * r, y * .6, Math.sin(t) * r).normalize();
    // la foglia si stende verso l'esterno, quasi orizzontale, un po' inclinata
    q.setFromEuler(new THREE.Euler(-.35 + rnd() * .7, -t, (y - .3) * .9));
    base.copy(d).multiplyScalar(.18);
    const s = grandezza + rnd() * .2, pts = contorno.map(([x, z]) => v.set(x * s, 0, z * s).applyQuaternion(q).add(base).toArray());
    for (let k = 0; k < pts.length - 1; k++) pos.push(...base.toArray(), ...pts[k], ...pts[k + 1]);
  }
  return geoCiuffo(pos, nucleo);
}

// Ciuffo di rametti a squame (ginepro) di raggio circa 1: tante "fiammelle" appuntite rivolte in su,
// con il bordo seghettato come le squame del ginepro cinese
export function ciuffoSquame({ n = 20, lunghezza = 1, larghezza = .2, seme = 5, nucleo = .2 } = {}) {
  const rnd = sequenza(seme), pos = [], d = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const SEG = 6;
  for (let i = 0; i < n; i++) {
    // le fiammelle salgono verso l'alto e verso l'esterno, mai verso il basso
    const y = .15 + .85 * (i + .5) / n, r = Math.sqrt(1 - y * y), t = i * 2.39996;
    d.set(Math.cos(t) * r, y, Math.sin(t) * r).normalize();
    const L = lunghezza * (.65 + rnd() * .4);
    a.crossVectors(d, Math.abs(d.y) > .9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)).normalize();
    b.crossVectors(d, a).normalize();
    for (const s of [a, b]) {
      // striscia che si assottiglia fino alla punta; a segmenti alterni più larga (le squame)
      const lato = [];
      for (let k = 0; k <= SEG; k++) {
        const q = k / SEG, hw = larghezza * L * Math.pow(1 - q, .8) * (k % 2 ? 1 : .65);
        c.copy(d).multiplyScalar(.08 + q * L); c.y += .12 * q * q * L;
        lato.push([c.x - s.x * hw, c.y - s.y * hw, c.z - s.z * hw, c.x + s.x * hw, c.y + s.y * hw, c.z + s.z * hw]);
      }
      for (let k = 0; k < SEG; k++) {
        const [p, q] = [lato[k], lato[k + 1]];
        pos.push(p[0], p[1], p[2], p[3], p[4], p[5], q[3], q[4], q[5], p[0], p[1], p[2], q[3], q[4], q[5], q[0], q[1], q[2]);
      }
    }
  }
  return geoCiuffo(pos, nucleo * lunghezza);
}

// Corteccia: venature lungo il ramo, dipinte su una piccola immagine generata dal codice
const cortecce = {};
export function corteccia(hex, { chiaro = .22, scuro = .38 } = {}) {
  if (cortecce[hex]) return cortecce[hex];
  const c = document.createElement('canvas'); c.width = 128; c.height = 64;
  const x = c.getContext('2d'), rnd = sequenza(hex % 99991 + 3), base = new THREE.Color(hex);
  const tono = (k) => '#' + base.clone().multiplyScalar(k).getHexString();
  x.fillStyle = tono(1); x.fillRect(0, 0, 128, 64);
  // la x dell'immagine corre lungo il ramo: crepe orizzontali ondulate
  for (let i = 0; i < 26; i++) {
    const y0 = rnd() * 64, chiara = i % 3 === 0;
    x.strokeStyle = chiara ? tono(1 + chiaro) : tono(1 - scuro); x.lineWidth = chiara ? 1.4 : 1 + rnd() * 2.2;
    x.beginPath(); x.moveTo(-4, y0);
    for (let px = 0; px <= 132; px += 8) x.lineTo(px, y0 + Math.sin(px * .09 + i) * 2.2 + (rnd() - .5) * 2.5);
    x.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(2, 1);
  return (cortecce[hex] = toon({ color: 0xffffff, map: tex }));
}

// Rametti sottili che dal ramo entrano nel cuscinetto di foglie: si intravedono tra le foglie
export function rametti(parent, pads, mat, seme = 5) {
  const rnd = sequenza(seme);
  pads.forEach(([x, y, z, r]) => {
    for (let i = 0; i < 4; i++) {
      const a = rnd() * PI * 2, d = r * (.45 + rnd() * .4);
      const p0 = [x * .9, y - r * .18, z * .9], p2 = [x + Math.cos(a) * d, y + r * .05, z + Math.sin(a) * d * .9];
      tube([p0, [(p0[0] + p2[0]) / 2, y - r * .02, (p0[2] + p2[2]) / 2], p2], .022, .008, mat, parent, 6);
    }
  });
}
