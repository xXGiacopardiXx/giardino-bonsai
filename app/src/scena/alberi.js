// I tre bonsai del giardino: acero sul tavolo, ginepro sulla lastra di pietra, pino sulla base in legno.
// Sono forme fisse, con corteccia, rametti e ciuffi di aghi o foglie palmate. L'acero è la pianta
// che si cura nell'MVP: ha sete, cambia con le stagioni e sulle sue punte spuntano i germogli da potare
// (scena/germogli.js). Pino e ginepro fanno parte del giardino e per ora stanno sempre bene.
// I dettagli non consumano numeri della sequenza col seme.
import * as THREE from 'three';
import { PI, R, M, toon, flatGeo, mesh, tube, foliage, ciuffoAghi, ciuffoFoglie, corteccia, rametti, sequenza } from './strumenti.js';

const SOIL_WET = new THREE.Color(0x4a3628), SOIL_DRY = new THREE.Color(0xc9ad80);

// Colori dell'acero giapponese nell'anno: verde chiaro in primavera, pieno in estate, rosso in autunno
const ACERO = {
  primavera: ['#6f9e36', '#80ae3c', '#92bd45', '#a5c950', '#b9d35e', '#cbdc72', '#d9b45e'],
  estate: ['#2f5a24', '#3b6a2a', '#477a30', '#538836', '#60953d', '#6fa245', '#7dad4e'],
  autunno: ['#9a2c22', '#b33827', '#c94b2b', '#db652e', '#e88535', '#f0a744', '#f5c25a'],
  // foglie che seccano per la sete: marroni e accartocciate
  sete: ['#a07a3a', '#8a6334', '#b2914f', '#7a5530', '#c0a05a'],
};
// colore che prendono le gemme cresciute (in inverno restano gemme scure)
const MATURO = [0x92bd45, 0x477a30, 0xc94b2b, 0x7a3b2a];

// Aspetto della chioma in un punto dell'anno p (0 = inizio primavera, 4 = fine inverno):
// da quale tavolozza a quale (k = quanto si è passati alla seconda) e quante foglie ci sono (0..1).
// In inverno le foglie cadono nei primi giorni, l'albero resta spoglio e l'ultimo giorno rimette le foglie nuove.
function aspettoAnno(p) {
  const tra = (a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
  if (p < 1.2) return { da: 'primavera', a: 'estate', k: tra(.6, 1.2), foglie: 1 };
  if (p < 2) return { da: 'estate', a: 'estate', k: 0, foglie: 1 };
  if (p < 3) return { da: 'estate', a: 'autunno', k: tra(2, 2.6), foglie: 1 };
  if (p < 3.75) return { da: 'autunno', a: 'autunno', k: 0, foglie: 1 - tra(3, 3.45) };
  return { da: 'primavera', a: 'primavera', k: 0, foglie: tra(3.75, 4) };
}

export function creaAlberi(world) {
  const trees = {};

  // Acero giapponese su un tavolo in legno: è la pianta da curare
  let acero;
  {
    const t = new THREE.Group(); t.position.set(0, 0, -2.4); world.add(t);
    mesh(new THREE.BoxGeometry(2.1, .12, 1.3), M(0x8b5a34), t, 0, .75, 0);
    [[-.9, -.52], [.9, -.52], [-.9, .52], [.9, .52]].forEach(([x, z]) => mesh(new THREE.BoxGeometry(.13, .75, .13), M(0x6b4226), t, x, .375, z));
    mesh(new THREE.BoxGeometry(1.9, .08, .1), M(0x6b4226), t, 0, .2, .52);
    const pot = mesh(new THREE.CylinderGeometry(.8, .62, .36, 36), M(0x4c7891), t, 0, .99, 0); pot.scale.z = .74;
    const rim = mesh(new THREE.CylinderGeometry(.84, .84, .06, 36), M(0x5f8ea8), t, 0, 1.17, 0); rim.scale.z = .74;
    const soil = mesh(new THREE.CylinderGeometry(.76, .76, .04, 36), toon({ color: SOIL_DRY.clone() }), t, 0, 1.19, 0); soil.scale.z = .72;
    for (let i = 0; i < 7; i++) { const b = mesh(new THREE.IcosahedronGeometry(R(.08, .14), 1), M(0x6a9a40), t, R(-.55, .55), 1.21, R(-.35, .35)); b.scale.y = .4; }
    const tr = new THREE.Group(); tr.position.set(0, 1.16, 0); t.add(tr);
    const legnoA = corteccia(0x857262, { chiaro: .18, scuro: .25 });
    tube([[0, -.05, 0], [.08, .35, .02], [-.12, .75, .05], [.04, 1.15, 0], [0, 1.55, 0]], .2, .06, legnoA, tr);
    for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2 + .3; tube([[0, .06, 0], [Math.cos(a) * .22, 0, Math.sin(a) * .18], [Math.cos(a) * .42, -.03, Math.sin(a) * .3]], .075, .02, legnoA, tr, 6); }
    [[[-.1, .7, .04], [-.55, .9, .12], [-1.0, 1.05, .1]], [[.03, 1.0, 0], [.5, 1.2, -.08], [.95, 1.35, -.05]], [[.02, 1.3, 0], [-.25, 1.55, .18], [-.45, 1.75, .2]], [[.03, 1.15, -.02], [.15, 1.35, -.35], [.2, 1.5, -.55]], [[0, 1.5, 0], [.15, 1.75, -.05], [.2, 1.95, -.1]], [[.02, 1.2, .02], [.3, 1.45, .25], [.45, 1.7, .3]]].forEach(p => tube(p, .075, .022, legnoA, tr, 10));
    const padsA = [[-1.0, 1.08, .1, .56], [.95, 1.38, -.05, .56], [-.45, 1.82, .2, .5], [.2, 2.0, -.1, .6], [.2, 1.55, -.55, .46], [-.5, 1.42, -.3, .42], [.45, 1.75, .3, .44]];
    const f = foliage(tr, padsA,
      { palette: ACERO.autunno, density: 72, size: .37, flat: .78, detail: 1, geo: ciuffoFoglie() });
    rametti(tr, padsA, legnoA, 21);
    // anello azzurro a terra, attorno al tavolo: indica la pianta che ha bisogno
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.38, 1.5, 64), new THREE.MeshBasicMaterial({ color: 0x6ac8ff, transparent: true, opacity: .7, depthWrite: false }));
    ring.rotation.x = -PI / 2; ring.position.y = .025; t.add(ring);
    trees.acero = { g: tr, tag: new THREE.Vector3(-.3, 1.16 + 2.95, -2.4), ph: 0 };

    // colori di ogni ciuffo in ogni stagione e con la sete, presi dalla stessa posizione nella tavolozza
    const tinta = (pal) => f.toni.map(x => new THREE.Color(pal[Math.round(x * (pal.length - 1))]));
    const colori = { primavera: tinta(ACERO.primavera), estate: tinta(ACERO.estate), autunno: f.healthy };
    const rs = sequenza(41), secche = f.healthy.map(() => rs() < .55 ? new THREE.Color(ACERO.sete[Math.floor(rs() * ACERO.sete.length)]) : null);
    // punte della chioma dove spuntano i germogli da potare: 2 per cuscinetto, sui 5 cuscinetti
    // più verso chi guarda; l'indice corrisponde a PUNTE del motore
    const davanti = [0, 1, 2, 3, 6], angoli = [[2.4, 1.9], [.5, 1.2], [2.2, 1.4], [.9, 2.2], [1.3, .4]];
    const punte = [0, 1].flatMap(j => davanti.map((n, i) => {
      const [x, y, z, r] = padsA[n], a = angoli[i][j], c = Math.cos(a), sn = Math.sin(a);
      return { p: new THREE.Vector3(x + c * r * .72, y + r * .16, z + sn * r * .65), d: new THREE.Vector3(c * .75, 1, sn * .75).normalize() };
    }));
    acero = pianta(f, soil, ring, {
      g: tr,
      punte,
      aghi: false,
      legno: legnoA,
      // dove guarda la telecamera durante la potatura
      fuoco: new THREE.Vector3(0, 2.7, -2.4),
      potTop: new THREE.Vector3(0, 1.21, -2.4),
      // dove compare l'annaffiatoio, rispetto al terriccio: davanti e a sinistra, fuori dalla chioma
      annaffiatoio: new THREE.Vector3(-1.15, 1.35, 1.05),
      // colore della chioma con la stagione e con la sete
      colore(i, base, sete, out) {
        out.copy(colori[base.da][i]).lerp(colori[base.a][i], base.k);
        if (secche[i]) out.lerp(secche[i], sete);
        return out;
      },
    });
  }

  // Ginepro su una lastra di pietra, con legno secco (jin) chiaro
  {
    const t = new THREE.Group(); t.position.set(-2.3, 0, .6); world.add(t);
    mesh(flatGeo(new THREE.CylinderGeometry(.85, .98, .26, 9)), M(0x9d998d), t, 0, .13, 0);
    mesh(new THREE.BoxGeometry(1.36, .3, .9), M(0x8a573a), t, 0, .41, 0);
    mesh(new THREE.BoxGeometry(1.44, .06, .98), M(0x76482f), t, 0, .57, 0);
    mesh(new THREE.BoxGeometry(1.28, .04, .82), M(0x4a3628), t, 0, .59, 0);
    [[-.55, -.33], [.55, -.33], [-.55, .33], [.55, .33]].forEach(([x, z]) => mesh(new THREE.BoxGeometry(.14, .06, .14), M(0x76482f), t, x, .27, z));
    for (let i = 0; i < 6; i++) { const b = mesh(new THREE.IcosahedronGeometry(R(.08, .13), 1), M(0x6a9a40), t, R(-.5, .5), .61, R(-.3, .3)); b.scale.y = .4; }
    const tr = new THREE.Group(); tr.position.set(0, .58, 0); t.add(tr);
    const legnoG = corteccia(0x7b5241, { chiaro: .3, scuro: .35 });
    tube([[0, -.05, 0], [-.22, .3, .05], [.12, .62, -.05], [-.12, .95, .06], [.08, 1.3, 0], [0, 1.6, 0]], .19, .05, legnoG, tr, 26);
    tube([[.06, 1.15, 0], [.3, 1.4, .08], [.45, 1.64, .1]], .045, .012, 0xeee7d7, tr, 8);
    tube([[-.05, .25, .08], [-.2, .12, .2], [-.3, .05, .25]], .04, .012, 0xeee7d7, tr, 6);
    [[[-.15, .85, .04], [-.5, .82, .1], [-.8, .78, .12]], [[.1, .6, -.04], [.45, .85, -.05], [.75, 1.0, -.05]], [[-.08, 1.1, .05], [-.3, 1.25, .06], [-.5, 1.32, .05]], [[.05, 1.25, .04], [.2, 1.32, .18], [.3, 1.36, .25]]].forEach(p => tube(p, .07, .02, legnoG, tr, 10));
    const padsG = [[-.84, .8, .12, .5], [.76, 1.03, -.05, .48], [-.5, 1.33, .05, .4], [.04, 1.72, 0, .46], [.3, 1.38, .25, .3]];
    // il ginepro ha aghi corti e fitti
    foliage(tr, padsG,
      { palette: ['#2e5638', '#3a6943', '#467a4c', '#548955', '#66985c', '#7daa65'], density: 92, size: .34, flat: .56, detail: 1, geo: ciuffoAghi({ n: 60, lunghezza: .85, larghezza: .1, seme: 3 }) });
    rametti(tr, padsG, legnoG, 13);
    trees.ginepro = { g: tr, tag: new THREE.Vector3(-2.3, .58 + 2.35, .6), ph: 1.7 };
  }

  // Pino nero inclinato su una base in legno
  {
    const t = new THREE.Group(); t.position.set(2.1, 0, 2.0); world.add(t);
    mesh(new THREE.BoxGeometry(1.7, .16, 1.15), M(0x9b6a3e), t, 0, .12, 0);
    mesh(new THREE.BoxGeometry(.18, .06, 1.15), M(0x7a4f2c), t, -.6, .02, 0); mesh(new THREE.BoxGeometry(.18, .06, 1.15), M(0x7a4f2c), t, .6, .02, 0);
    mesh(new THREE.CylinderGeometry(.62, .5, .42, 36), M(0xc27a4a), t, 0, .41, 0);
    mesh(new THREE.CylinderGeometry(.66, .66, .07, 36), M(0xae6a3d), t, 0, .6, 0);
    mesh(new THREE.CylinderGeometry(.6, .6, .04, 36), M(0x4a3628), t, 0, .62, 0);
    const tr = new THREE.Group(); tr.position.set(0, .6, 0); t.add(tr);
    // corteccia del pino nero: scura, a placche
    const legnoP = corteccia(0x5e4434, { chiaro: .35, scuro: .45 });
    tube([[0, -.05, 0], [.14, .38, 0], [.34, .78, .05], [.44, 1.18, 0], [.4, 1.55, 0]], .18, .05, legnoP, tr, 24);
    for (let i = 0; i < 4; i++) { const a = i / 4 * PI * 2 + .7; tube([[0, .06, 0], [Math.cos(a) * .2, 0, Math.sin(a) * .2], [Math.cos(a) * .36, -.03, Math.sin(a) * .36]], .07, .02, legnoP, tr, 6); }
    [[[.2, .55, .02], [-.2, .66, .08], [-.6, .74, .1]], [[.4, 1.0, 0], [.75, 1.03, -.03], [1.05, 1.08, -.05]], [[.43, 1.32, 0], [.25, 1.5, .1], [.1, 1.65, .1]], [[.42, 1.45, 0], [.55, 1.65, -.1]], [[.38, .9, .04], [.35, 1.1, .25], [.3, 1.22, .35]]].forEach(p => tube(p, .07, .02, legnoP, tr, 10));
    const pads = [[-.62, .76, .1, .48], [1.05, 1.1, -.05, .45], [.1, 1.72, .1, .42], [.55, 1.8, -.1, .38], [.3, 1.25, .35, .3]];
    // i colori della sete restano preparati (la sequenza col seme non deve cambiare) ma per ora non si usano
    foliage(tr, pads,
      { palette: ['#304a24', '#3c5a2b', '#4a6c34', '#587c3c', '#688d46'], density: 125, size: .29, flat: .62, detail: 0, geo: ciuffoAghi({ n: 64, larghezza: .055 }), stress: ['#cdb84a', '#d6a440', '#bfae55', '#a8873a', '#d9c25e'], stressRatio: .42 });
    rametti(tr, pads, legnoP, 5);
    trees.pino = { g: tr, tag: new THREE.Vector3(2.6, .6 + 2.3, 2.0), ph: 3.1 };
  }

  return {
    trees,
    acero,
    // le piante ondeggiano appena, come mosse dalla brezza
    aggiorna(clock) {
      for (const k in trees) { const { g, ph } = trees[k]; g.rotation.z = Math.sin(clock * .9 + ph) * .012; g.rotation.x = Math.cos(clock * .7 + ph) * .008; }
      if (acero.ring.visible) acero.ring.material.opacity = .45 + .3 * Math.sin(clock * 3.2);
    },
  };
}

// Pianta da curare: chioma che si dirada, ingiallisce con la sete e cambia con le stagioni.
// f: chioma (foliage), soil: terriccio, ring: anello della sete; dati: punte, fuoco, potTop, colore()...
function pianta(f, soil, ring, dati) {
  const tmpC = new THREE.Color();
  // ordine in cui spariscono i ciuffi quando la chioma si dirada: prima quelli esterni
  const originali = f.m.instanceMatrix.array.slice();
  const ordine = f.periferia.map((dn, i) => [dn + ((i * 0.618) % 1) * .35, i]).sort((a, b) => b[0] - a[0]).map(x => x[1]);
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  let salute = 1, foglie = 1, anno = aspettoAnno(2.5), nascostiPrima = -1;

  function chioma() {
    const nascosti = Math.max(Math.round((1 - salute) / .8 * ordine.length * .85), Math.round((1 - foglie) * ordine.length));
    if (nascosti === nascostiPrima) return;
    nascostiPrima = nascosti;
    ordine.forEach((idx, k) => {
      if (k < nascosti) f.m.setMatrixAt(idx, zero);
      else f.m.instanceMatrix.array.set(originali.subarray(idx * 16, idx * 16 + 16), idx * 16);
    });
    f.m.instanceMatrix.needsUpdate = true;
  }
  function colora() {
    for (let i = 0; i < f.healthy.length; i++) f.m.setColorAt(i, dati.colore(i, anno, p.thirst, tmpC));
    f.m.instanceColor.needsUpdate = true;
  }

  const p = {
    ...dati,
    ring,
    thirst: 1,
    soilDry: 1,
    // colore delle foglie mature in questa stagione (lo usano le gemme che crescono)
    verde: new THREE.Color(MATURO[2]),
    // 1 = chioma piena, 0,2 = quasi spoglia (resta sempre qualche ciuffo)
    setSalute(v) { salute = v; chioma(); },
    // 0 = idratata, 1 = assetata: sfuma il colore di ogni ciuffo verso le foglie secche
    setThirst(v) { this.thirst = v; colora(); },
    // 0 = terriccio umido (scuro), 1 = secco (chiaro)
    setSoil(v) { this.soilDry = v; soil.material.color.copy(SOIL_WET).lerp(SOIL_DRY, v); },
    // punto dell'anno: 0 = inizio primavera, 1 estate, 2 autunno, 3 inverno, fino a 4
    setStagione(pAnno) {
      const a = aspettoAnno(pAnno);
      if (a.da === anno.da && a.a === anno.a && a.k === anno.k && a.foglie === foglie) return;
      anno = a; foglie = a.foglie;
      this.verde.setHex(MATURO[Math.min(3, Math.floor(pAnno))]);
      colora(); chioma();
    },
  };
  p.setThirst(1);
  return p;
}
