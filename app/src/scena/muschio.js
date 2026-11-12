// Il muschio per il vaso (game-design.md, sezione 6.5): cuscinetti verdi sul terriccio di una pianta,
// dal momento in cui lo si stende fino al rinvaso. Sta sul terriccio (è suo figlio), così si sposta col vaso.
// Niente numeri casuali della scena: le posizioni vengono da una regola fissa.
import * as THREE from 'three';
import { toon } from './strumenti.js';

// quanto è grande il terriccio di ogni pianta (raggio in x e in z, nelle sue misure)
const MISURE = { acero: [.68, .68], pino: [.58, .34], ginepro: [.52, .52], azalea: [.48, .48] };
const VERDI = [0x5f8f3a, 0x6d9a43, 0x7aa84c];

// terricci: { acero: mesh, pino: mesh, ... }
export function creaMuschio(terricci) {
  const cuscini = {};
  const geo = new THREE.IcosahedronGeometry(1, 1);
  for (const [p, soil] of Object.entries(terricci)) {
    if (!soil || !MISURE[p]) continue;
    const [rx, rz] = MISURE[p], g = new THREE.Group(); g.visible = false; soil.add(g);
    // una dozzina di cuscinetti sparsi, lasciando libero il centro (il tronco)
    for (let i = 0; i < 14; i++) {
      const a = i * 2.39996, d = .45 + .5 * ((i * .618) % 1);
      const m = new THREE.Mesh(geo, toon({ color: VERDI[i % 3] }));
      const s = .07 + .05 * ((i * .37) % 1);
      m.position.set(Math.cos(a) * rx * d, .02, Math.sin(a) * rz * d); m.scale.set(s * 1.4, s * .35, s * 1.2);
      m.receiveShadow = true; g.add(m);
    }
    cuscini[p] = g;
  }
  return {
    // quali piante hanno il muschio: { acero: true, ... }
    set(conMuschio) { for (const [p, g] of Object.entries(cuscini)) g.visible = !!conMuschio[p]; },
  };
}
