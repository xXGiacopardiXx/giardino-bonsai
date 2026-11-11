// Il bastoncino di bambù (game-design.md, sezione 7.3): comprato l'attrezzo, ce n'è uno infilato nel
// terriccio di ogni pianta. Come quello vero dei bonsaisti, la parte vicino alla terra è scura finché il
// terriccio è umido e torna chiara quando è asciutto: si capisce a colpo d'occhio chi va annaffiato.
// Sta sul terriccio di ogni pianta (è suo figlio), così si sposta col vaso. Niente numeri casuali.
import * as THREE from 'three';
import { M, toon } from './strumenti.js';

const CHIARO = new THREE.Color(0xd9b86a), BAGNATO = new THREE.Color(0x6b4a2a);
// dove sta il bastoncino sul terriccio di ogni pianta (x, z, nelle misure del terriccio) e quanto è lungo
const POSTI = { acero: [.52, .3, .85], pino: [.5, .22, .7], ginepro: [.42, .25, .7], azalea: [.38, .24, .62] };

// terricci: { acero: mesh, pino: mesh, ... }
export function creaBastoncini(terricci) {
  const bastoncini = {};
  for (const [p, soil] of Object.entries(terricci)) {
    if (!soil || !POSTI[p]) continue;
    const [x, z, h] = POSTI[p];
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.z = -.14; g.rotation.x = .08; g.visible = false;
    // la parte alta, color bambù, con due nodi
    const alto = new THREE.Mesh(new THREE.CylinderGeometry(.045, .05, h * .72, 8), M(CHIARO.getHex()));
    alto.position.y = h * .28 + h * .36; g.add(alto);
    for (const k of [.45, .8]) { const n = new THREE.Mesh(new THREE.CylinderGeometry(.058, .058, .03, 8), M(0xb8964c)); n.position.y = h * k; g.add(n); }
    // la parte bassa, vicino alla terra: scura se il terriccio è umido
    const basso = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, h * .28, 8), toon({ color: BAGNATO.clone() }));
    basso.position.y = h * .14; g.add(basso);
    for (const m of g.children) m.castShadow = true;
    soil.add(g);
    bastoncini[p] = { g, basso };
  }
  return {
    // si: c'è l'attrezzo; secco: per ogni pianta, 0 = terriccio umido, 1 = asciutto
    set(si, secco) {
      for (const [p, b] of Object.entries(bastoncini)) {
        b.g.visible = si;
        if (si && secco[p] !== undefined) b.basso.material.color.copy(BAGNATO).lerp(CHIARO, Math.min(1, secco[p]));
      }
    },
  };
}
