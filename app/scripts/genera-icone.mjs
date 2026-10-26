// Disegna l'icona provvisoria dell'app (un acero in autunno nel vaso) e la salva in PNG
// nelle misure richieste da iPhone e Android. Non servono programmi esterni: si lancia con
//   npm run icone
// Quando ci sarà un'icona disegnata da un artista basterà sostituire i file in public/icone.
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync, crc32 } from 'node:zlib';

const INK = [0x3b, 0x27, 0x16];
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

// Forme come "distanza con segno": negativa dentro, positiva fuori
const circle = (cx, cy, r) => (x, y) => Math.hypot(x - cx, y - cy) - r;
function capsule(ax, ay, bx, by, r) {
  return (x, y) => {
    const px = x - ax, py = y - ay, dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, (px * dx + py * dy) / (dx * dx + dy * dy)));
    return Math.hypot(px - dx * t, py - dy * t) - r;
  };
}
// poligono convesso, punti in senso orario
function polygon(pts) {
  const edges = pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length], ex = q[0] - p[0], ey = q[1] - p[1], len = Math.hypot(ex, ey);
    return [p[0], p[1], ey / len, -ex / len];
  });
  return (x, y) => Math.max(...edges.map(([px, py, nx, ny]) => (x - px) * nx + (y - py) * ny));
}

const OUT = 0.016; // spessore del contorno scuro, stile Supercell
const foglie = ['#f0a744', '#c94b2b'].map(hex);
// Gruppi disegnati in ordine: prima tutti i contorni del gruppo, poi i riempimenti
const groups = [
  { // rami e tronco
    shapes: [capsule(.5, .70, .46, .56, .042), capsule(.46, .56, .53, .42, .036), capsule(.53, .42, .5, .32, .026), capsule(.47, .53, .31, .47, .02), capsule(.52, .45, .69, .39, .02)],
    fill: () => hex('#857262'),
  },
  { // chioma: più chiara in alto, più scura in basso
    shapes: [[.31, .45, .095], [.70, .38, .105], [.50, .29, .135], [.38, .34, .09], [.62, .28, .09]].map(([x, y, r]) => Object.assign(circle(x, y, r), { cy: y, r })),
    fill: (x, y, s) => mix(foglie[0], foglie[1], Math.max(0, Math.min(1, (y - (s.cy - s.r)) / (2 * s.r)))),
  },
  { // vaso
    shapes: [polygon([[.29, .71], [.71, .71], [.66, .83], [.34, .83]])],
    fill: () => hex('#4c7891'),
  },
  { // bordo del vaso
    shapes: [polygon([[.26, .675], [.74, .675], [.74, .715], [.26, .715]])],
    fill: () => hex('#5f8ea8'),
  },
];
const sky = [[0, hex('#6fb2da')], [.5, hex('#b4dbe8')], [.8, hex('#f2e3cc')], [1, hex('#f5c99e')]];
function background(y) {
  for (let i = 1; i < sky.length; i++) if (y <= sky[i][0]) return mix(sky[i - 1][1], sky[i][1], (y - sky[i - 1][0]) / (sky[i][0] - sky[i - 1][0]));
  return sky[sky.length - 1][1];
}

// scale < 1 rimpicciolisce il disegno verso il centro (icona "maskable" di Android)
function sample(u, v, scale) {
  const x = (u - .5) / scale + .5, y = (v - .5) / scale + .5;
  let c = background(v);
  for (const g of groups) {
    if (g.shapes.some(s => s(x, y) < OUT)) c = INK;
    for (const s of g.shapes) if (s(x, y) < 0) c = g.fill(x, y, s);
  }
  return c;
}

function png(size, scale) {
  const SS = 4, raw = Buffer.alloc((size * 3 + 1) * size);
  for (let py = 0; py < size; py++) {
    raw[py * (size * 3 + 1)] = 0;
    for (let px = 0; px < size; px++) {
      let acc = [0, 0, 0];
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const c = sample((px + (sx + .5) / SS) / size, (py + (sy + .5) / SS) / size, scale);
        acc = acc.map((v, i) => v + c[i]);
      }
      const o = py * (size * 3 + 1) + 1 + px * 3;
      for (let i = 0; i < 3; i++) raw[o + i] = Math.round(acc[i] / (SS * SS));
    }
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]), crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2; // 8 bit, RGB
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const dir = new URL('../public/icone/', import.meta.url);
mkdirSync(dir, { recursive: true });
for (const [name, size, scale] of [['apple-touch-icon.png', 180, 1], ['icona-192.png', 192, 1], ['icona-512.png', 512, 1], ['icona-maskable-512.png', 512, .8]]) {
  writeFileSync(new URL(name, dir), png(size, scale));
  console.log('creata', name);
}
