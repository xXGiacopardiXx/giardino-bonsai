// Il filo sui rami dell'acero (game-design.md, sezione 4.2). Ogni ramo da legare sta in un gruppo
// che ruota attorno all'attacco sul tronco: con il ramo si muovono il suo cuscinetto di foglie,
// i rametti e i germogli. Sul ramo si avvolge una spirale di filo di rame; se il filo resta troppo
// a lungo, sotto compare un segno scuro sulla corteccia, sottile, che si vede bene solo da vicino.
// In modalità Filo sulla punta di ogni ramo compare una maniglia: si trascina su o giù per piegarlo.
import * as THREE from 'three';
import { toon } from './strumenti.js';

const SU = new THREE.Vector3(0, 1, 0);
// angolo massimo, in radianti, per piega = 1 (alzato) e piega = -1 (abbassato)
const ALZA = .3, ABBASSA = .42;
const RAME = 0xc8743a, RAME_PRONTO = 0x8fe05a, SEGNO = 0x3a2418;

const ramaMat = toon({ color: 0xb87a4b });
const segnoMat = new THREE.MeshBasicMaterial({ color: SEGNO, transparent: true, opacity: 0, depthWrite: false });
const presaGeo = new THREE.SphereGeometry(.22, 8, 6), presaMat = new THREE.MeshBasicMaterial({ visible: false });
const pallinoGeo = new THREE.SphereGeometry(.075, 16, 12), aloneGeo = new THREE.SphereGeometry(.14, 16, 12);

// spirale attorno al ramo: segue la curva e il suo spessore (r0 alla base, r1 in punta)
function spirale(curva, r0, r1, giri, spessore, distacco) {
  const N = Math.round(giri * 14), pts = [], t = new THREE.Vector3(), c = new THREE.Vector3();
  const n = new THREE.Vector3(), b = new THREE.Vector3();
  for (let i = 0; i <= N; i++) {
    const k = .04 + .86 * i / N;
    curva.getPointAt(k, c); curva.getTangentAt(k, t);
    n.crossVectors(t, Math.abs(t.y) > .95 ? new THREE.Vector3(1, 0, 0) : SU).normalize();
    b.crossVectors(t, n);
    const r = r0 + (r1 - r0) * Math.pow(k, .85) + distacco, a = i / N * giri * Math.PI * 2;
    pts.push(c.clone().addScaledVector(n, Math.cos(a) * r).addScaledVector(b, Math.sin(a) * r));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), N * 2, spessore, 5, false);
}

// rami: [{ gruppo, punti (del ramo), r0, r1, cima (Vector3: dove sta la maniglia) }]
export function creaFilo(rami) {
  const m4 = new THREE.Matrix4(), t1 = new THREE.Matrix4(), t2 = new THREE.Matrix4();
  let mostra = false, ultimo = 0;

  const stati = rami.map((r, i) => {
    const pts = r.punti.map(p => new THREE.Vector3(...p));
    const curva = new THREE.CatmullRomCurve3(pts);
    const base = pts[0], verso = pts.at(-1).clone().sub(base).setY(0).normalize();
    // ruotando attorno a questo asse la punta sale (angolo positivo) o scende
    const asse = new THREE.Vector3().crossVectors(verso, SU).normalize();
    const lunghezza = curva.getLength();
    const giri = Math.max(5, Math.round(lunghezza / .065));
    const filo = new THREE.Mesh(spirale(curva, r.r0, r.r1, giri, .008, .002), ramaMat);
    filo.castShadow = true; filo.visible = false; r.gruppo.add(filo);
    const segno = new THREE.Mesh(spirale(curva, r.r0, r.r1, giri, .008, -.002), segnoMat.clone());
    segno.visible = false; r.gruppo.add(segno);
    // maniglia: un pallino di rame con un alone, sempre visibile sopra le foglie
    const maniglia = new THREE.Group(); maniglia.position.copy(r.cima); maniglia.visible = false; r.gruppo.add(maniglia);
    const pallino = new THREE.Mesh(pallinoGeo, new THREE.MeshBasicMaterial({ color: RAME, depthTest: false }));
    const alone = new THREE.Mesh(aloneGeo, new THREE.MeshBasicMaterial({ color: 0xffcf96, transparent: true, opacity: .4, depthTest: false, depthWrite: false }));
    pallino.renderOrder = 21; alone.renderOrder = 20;
    const presa = new THREE.Mesh(presaGeo, presaMat); presa.userData.ramo = i;
    maniglia.add(alone, pallino, presa);
    return { ...r, base, asse, filo, segno, maniglia, pallino, alone, presa, angolo: 0, obiettivo: 0, anteprima: null, crescita: 1, pronto: false, ha: false };
  });

  const angolo = (piega) => piega >= 0 ? piega * ALZA : piega * ABBASSA;
  function piega(s) {
    t1.makeTranslation(s.base.x, s.base.y, s.base.z);
    t2.makeTranslation(-s.base.x, -s.base.y, -s.base.z);
    s.gruppo.matrix.copy(t1).multiply(m4.makeRotationAxis(s.asse, s.angolo)).multiply(t2);
    s.gruppo.matrixWorldNeedsUpdate = true;
  }

  const api = {
    // chiamata quando un ramo si muove, per spostare con lui le foglie (le disegna l'InstancedMesh della chioma)
    quandoPiega: null,
    // allinea i rami alla vista del motore (vista(stato).rami)
    setRami(vRami) {
      vRami.forEach((v, i) => {
        const s = stati[i]; if (!s) return;
        s.obiettivo = angolo(v.piega);
        s.ha = v.filo; s.pronto = v.pronto;
        s.filo.visible = v.filo;
        s.segno.visible = v.segno > .02; s.segno.material.opacity = Math.min(.85, v.segno);
        s.pallino.material.color.setHex(v.pronto ? RAME_PRONTO : RAME);
      });
    },
    // mentre si trascina: il ramo segue il dito (piega da -1 a 1), null per tornare alla vista
    anteprima(i, v) { const s = stati[i]; if (s) s.anteprima = v === null ? null : angolo(v); },
    // il filo si avvolge sul ramo, dalla base alla punta
    avvolgi(i) { const s = stati[i]; if (s) { s.crescita = 0; s.filo.visible = true; } },
    set maniglie(v) { mostra = v; stati.forEach(s => { s.maniglia.visible = v; }); },
    get maniglie() { return mostra; },
    // la maniglia sotto il dito (raycaster già puntato), oppure null
    tocca(raycaster) {
      if (!mostra) return null;
      const hit = raycaster.intersectObjects(stati.map(s => s.presa), false)[0];
      return hit ? hit.object.userData.ramo : null;
    },
    // punto della maniglia nel mondo (per capire di quanto si è trascinato)
    posizione(i) { return stati[i].maniglia.getWorldPosition(new THREE.Vector3()); },
    aggiorna(clock) {
      const dt = Math.min(.05, clock - ultimo); ultimo = clock;
      let mosso = false;
      for (const s of stati) {
        // il ramo raggiunge con dolcezza la nuova piega (anche quando torna indietro tolto il filo)
        const meta = s.anteprima ?? s.obiettivo;
        if (Math.abs(meta - s.angolo) > .0005) {
          s.angolo += (meta - s.angolo) * Math.min(1, dt * (s.anteprima !== null ? 18 : 4));
          piega(s); mosso = true;
        }
        if (s.crescita < 1) {
          s.crescita = Math.min(1, s.crescita + dt / .8);
          const tot = s.filo.geometry.index.count;
          s.filo.geometry.setDrawRange(0, Math.floor(tot * s.crescita / 6) * 6);
        }
        if (mostra) {
          // la maniglia pulsa piano; quella del ramo pronto da liberare un po' di più
          const k = 1 + Math.sin(clock * (s.pronto ? 5 : 3) + s.base.x * 3) * (s.pronto ? .18 : .08);
          s.alone.scale.setScalar(k);
          s.alone.material.opacity = s.pronto ? .55 : .4;
        }
      }
      if (mosso) api.quandoPiega?.();
    },
  };
  stati.forEach(piega);
  return api;
}
