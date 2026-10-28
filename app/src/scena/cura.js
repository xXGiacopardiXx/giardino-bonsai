// Cura dell'acero nella scena (game-design.md, sezioni 4 e 6.4): afidi sulle foglie, granuli di concime
// sul terriccio, la nuvola dello spray quando si trattano i parassiti.
// Gli afidi all'inizio sono minuscoli (si vedono solo avvicinandosi), poi crescono di numero e grandezza.
// I dettagli usano una sequenza casuale propria: la sequenza col seme della scena non cambia.
import * as THREE from 'three';
import { toon, sequenza } from './strumenti.js';

// cuscinetti della chioma dove possono stare i parassiti (POSTI_PARASSITI del motore): per l'acero
// i più visibili; pino e ginepro ne hanno 5 in tutto
const CUSCINETTI = { acero: [0, 1, 2, 6, 3], pino: [0, 1, 2, 3, 4], ginepro: [0, 1, 2, 3, 4] };
const AFIDI = 70;
const smooth = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);

const afideGeo = new THREE.SphereGeometry(1, 8, 6);
const granoGeo = new THREE.IcosahedronGeometry(1, 1);
const nebbiaTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.5, 'rgba(235,248,255,.55)'); r.addColorStop(1, 'rgba(235,248,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();

// pianta: una pianta di scena/alberi.js (cure.acero, cure.pino, cure.ginepro: ciuffiDi, gruppoDi, potTop);
// id: 'acero', 'pino' o 'ginepro'
export function creaCura(scene, pianta, id = 'acero') {
  const semeBase = { acero: 0, pino: 500, ginepro: 900 }[id];
  // --- afidi: un InstancedMesh per ogni cuscinetto possibile, nel gruppo che si piega col filo ---
  const colonie = CUSCINETTI[id].map((pad, posto) => {
    const rnd = sequenza(301 + semeBase + posto * 17);
    // i ciuffi più in alto e più verso chi guarda: lì gli afidi si notano
    const ciuffi = pianta.ciuffiDi(pad).slice().sort((a, b) => (b.pos.y + b.pos.z * .6) - (a.pos.y + a.pos.z * .6)).slice(0, 7);
    const m = new THREE.InstancedMesh(afideGeo, toon({ color: 0xffffff }), AFIDI);
    m.count = 0; m.visible = false;
    const posti = [], d = new THREE.Object3D(), col = new THREE.Color();
    for (let i = 0; i < AFIDI; i++) {
      const c = ciuffi[i % ciuffi.length], s = c.sc.x;
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * s * .55;
      posti.push({ p: c.pos.clone().add(new THREE.Vector3(Math.cos(a) * r, s * .55 + rnd() * s * .15, Math.sin(a) * r)), rot: rnd() * 6, k: .7 + rnd() * .6 });
      // per lo più neri, qualcuno verde chiaro: devono staccarsi dalle foglie
      m.setColorAt(i, col.setHex(rnd() < .65 ? 0x26231c : 0xc6ef7a));
    }
    pianta.gruppoDi(pad).add(m);
    const centro = ciuffi.reduce((v, c) => v.add(c.pos), new THREE.Vector3()).multiplyScalar(1 / Math.max(1, ciuffi.length));
    return { m, posti, d, centro, pad };
  });
  let attuale = null, grandezza = 0, via = null;

  function disponi(colonia, g, svanisce = 1) {
    const n = Math.round(8 + (AFIDI - 8) * g);
    colonia.m.count = n;
    // da piccolissimi (si vedono solo da vicino) a puntini ben visibili
    const s = (.009 + .035 * g) * svanisce;
    colonia.posti.slice(0, n).forEach((x, i) => {
      colonia.d.position.copy(x.p); if (svanisce < 1) colonia.d.position.y -= (1 - svanisce) * .15;
      colonia.d.rotation.set(0, x.rot, 0);
      colonia.d.scale.set(s * x.k, s * x.k * .7, s * x.k * 1.4);
      colonia.d.updateMatrix(); colonia.m.setMatrixAt(i, colonia.d.matrix);
    });
    colonia.m.instanceMatrix.needsUpdate = true;
  }

  // --- concime: granuli sul terriccio, che si consumano con i giorni ---
  const rg = sequenza(77 + semeBase), raggio = pianta.raggioTerra ?? 1;
  const granuli = new THREE.InstancedMesh(granoGeo, toon({ color: 0xffffff }), 16);
  const granPos = [];
  for (let i = 0; i < 16; i++) {
    const a = rg() * Math.PI * 2, r = (.2 + rg() * .45) * raggio;
    granPos.push(new THREE.Vector3(pianta.potTop.x + Math.cos(a) * r, pianta.potTop.y + .02, pianta.potTop.z + Math.sin(a) * r * .8));
    // granuli a lenta cessione, color crema: si vedono bene sul terriccio scuro
    granuli.setColorAt(i, new THREE.Color(rg() < .5 ? 0xf0dc9a : 0xe2c47a));
  }
  granuli.visible = false; scene.add(granuli);
  let quantita = 0, nuovo = -1;
  const d = new THREE.Object3D();
  function disponiGranuli(pop = 1) {
    granuli.count = Math.max(1, Math.round(16 * quantita));
    granPos.forEach((p, i) => {
      if (i >= granuli.count) return;
      const k = Math.min(1, Math.max(0, pop * 1.6 - i / 16 * .6));
      d.position.copy(p); d.position.y += (1 - k) * .25;
      d.scale.setScalar(.03 * (k > 0 ? 1 : .001)); d.rotation.set(i, i * 2, 0);
      d.updateMatrix(); granuli.setMatrixAt(i, d.matrix);
    });
    granuli.instanceMatrix.needsUpdate = true;
  }

  // --- nuvola dello spray ---
  const nebbia = [];
  for (let i = 0; i < 26; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: nebbiaTex, transparent: true, depthWrite: false, opacity: 0 }));
    s.visible = false; scene.add(s); nebbia.push({ s, v: new THREE.Vector3(), t: 0, vita: 0 });
  }
  let spruzzo = -1;

  return {
    // vista(stato).parassiti: null oppure { posto, grandezza }
    setParassiti(v) {
      if (via) return;  // sta finendo l'animazione del trattamento
      const nuova = v ? colonie[v.posto] : null;
      if (attuale && attuale !== nuova) attuale.m.visible = false;
      attuale = nuova;
      if (!attuale) return;
      attuale.m.visible = true;
      if (Math.abs(v.grandezza - grandezza) > .01 || attuale.m.count === 0) { grandezza = v.grandezza; disponi(attuale, grandezza); }
    },
    // vista(stato).concime: { attivo, giorni }
    setConcime(v) {
      const q = v.attivo ? Math.max(.25, v.giorni / 7) : 0;
      if (q === quantita) return;
      quantita = q; granuli.visible = q > 0;
      if (q > 0 && nuovo < 0) disponiGranuli();
    },
    // il concime appena dato: i granuli cadono sul terriccio
    concima() { quantita = 1; granuli.visible = true; nuovo = 0; disponiGranuli(0); },
    // lo spray sui parassiti: una nuvola fine, poi gli afidi cadono e spariscono
    spruzza() {
      const colonia = attuale; if (!colonia) return;
      spruzzo = 0;
      const centro = colonia.centro.clone(); pianta.gruppoDi(colonia.pad).localToWorld(centro);
      nebbia.forEach((n, i) => {
        n.s.position.copy(centro).add(new THREE.Vector3(.9, .35, .9).multiplyScalar(1 + i * .01));
        n.v.copy(centro).sub(n.s.position).normalize().multiplyScalar(1.6).add(new THREE.Vector3((Math.random() - .5) * .5, (Math.random() - .3) * .3, (Math.random() - .5) * .5));
        n.t = -i * .03; n.vita = 1.1 + Math.random() * .4; n.s.visible = false;
      });
      via = { colonia, t: 0 };
    },
    aggiorna(dt) {
      if (nuovo >= 0) { nuovo = Math.min(1, nuovo + dt / .7); disponiGranuli(smooth(nuovo)); if (nuovo >= 1) nuovo = -1; }
      if (spruzzo >= 0) {
        spruzzo += dt;
        let vivi = false;
        for (const n of nebbia) {
          n.t += dt;
          if (n.t < 0) { vivi = true; continue; }
          if (n.t > n.vita) { n.s.visible = false; continue; }
          vivi = true; n.s.visible = true;
          n.s.position.addScaledVector(n.v, dt); n.v.multiplyScalar(1 - dt * 2.2);
          const k = n.t / n.vita;
          n.s.scale.setScalar(.12 + k * .35);
          n.s.material.opacity = Math.sin(k * Math.PI) * .7;
        }
        if (!vivi) spruzzo = -1;
      }
      if (via) {
        via.t += dt;
        // dopo mezzo secondo di spray gli afidi cadono giù e svaniscono
        const k = smooth((via.t - .6) / .9);
        disponi(via.colonia, grandezza, Math.max(.001, 1 - k));
        if (via.t > 1.6) { via.colonia.m.visible = false; via.colonia.m.count = 0; via = null; attuale = null; grandezza = 0; }
      }
    },
  };
}
