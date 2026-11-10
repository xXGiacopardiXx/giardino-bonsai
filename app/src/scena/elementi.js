// Elementi del giardino che si spostano (game-design.md, sezione 8.4): lanterna, pietra col muschio,
// laghetto con le carpe, cespugli e pietre del sentiero. Ognuno è un gruppo della scena (giardino.js e
// isola.js) che sta dove dice il motore (vista.elementiPosti); quello scelto si trascina col dito, con
// l'anello verde sotto dove si può posare e rosso dove no. Niente numeri casuali.
import * as THREE from 'three';
import { PI } from './strumenti.js';

// oggetti: { id: gruppo }, già al loro posto iniziale
export function creaElementi(world, oggetti) {
  const el = {};
  for (const id in oggetti) {
    const g = oggetti[id];
    el[id] = { g, posto: { x: g.position.x, z: g.position.z, r: g.rotation.y } };
  }
  const anello = new THREE.Mesh(new THREE.RingGeometry(.9, 1, 56), new THREE.MeshBasicMaterial({ color: 0x8fe06a, transparent: true, opacity: .8, depthWrite: false }));
  anello.rotation.x = -PI / 2; anello.visible = false; anello.renderOrder = 3; world.add(anello);
  let scelta = null, raggio = 1, prova = null;

  function colloca(id) {
    const e = el[id], p = id === scelta && prova ? prova : e.posto;
    e.g.position.set(p.x, id === scelta && prova?.inMano ? .12 : 0, p.z); e.g.rotation.y = p.r;
    if (id === scelta) {
      anello.position.set(p.x, .03, p.z); anello.scale.setScalar(raggio);
      anello.material.color.setHex(prova && !prova.valido ? 0xff6a4a : 0x8fe06a);
    }
  }
  return {
    // posti: { id: { x, z, r, tolto } } dalla vista del motore; quelli tolti non si vedono
    setPosti(posti) {
      for (const id in posti) {
        const e = el[id], p = posti[id];
        if (!e) continue;
        e.g.visible = !p.tolto;
        if (e.posto.x === p.x && e.posto.z === p.z && e.posto.r === p.r) continue;
        e.posto = { x: p.x, z: p.z, r: p.r }; colloca(id);
      }
    },
    // l'elemento toccato dal dito (id), oppure null
    tocca(raycaster) {
      let meglio = null, d = Infinity;
      for (const id in el) {
        if (!el[id].g.visible) continue;
        const hit = raycaster.intersectObject(el[id].g, true)[0];
        if (hit && hit.distance < d) { d = hit.distance; meglio = id; }
      }
      return meglio;
    },
    // l'elemento da spostare (id, col raggio dell'anello), oppure null
    seleziona(id, r = 1) {
      if (scelta && scelta !== id) { const s = scelta; scelta = null; prova = null; colloca(s); }
      scelta = id; raggio = r; prova = null; anello.visible = !!id;
      if (id) colloca(id);
    },
    // posizione provvisoria mentre lo si trascina ({ x, z, r, valido, inMano }), oppure null
    prova(p) { prova = p; if (scelta) colloca(scelta); },
    // dov'è adesso l'elemento scelto (anche mentre lo si trascina)
    get posizione() { return scelta ? { ...(prova ?? el[scelta].posto) } : null; },
    aggiorna(clock) { if (anello.visible) anello.material.opacity = .6 + .3 * Math.sin(clock * 5); },
  };
}
