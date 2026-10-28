// I tre bonsai del giardino: acero sul tavolo, ginepro sulla lastra di pietra, pino sulla base in legno.
// Sono forme fisse, con corteccia, rametti e ciuffi di aghi o foglie palmate. L'acero è la pianta
// che si cura nell'MVP: ha sete, cambia con le stagioni e sulle sue punte spuntano i germogli da potare
// (scena/germogli.js). Pino e ginepro fanno parte del giardino e per ora stanno sempre bene.
// I dettagli non consumano numeri della sequenza col seme.
import * as THREE from 'three';
import { creaFilo } from './filo.js';
import { PI, R, M, toon, flatGeo, mesh, tube, foliage, ciuffoAghi, ciuffoFoglie, ciuffoSquame, fogliaAcero, corteccia, rametti, sequenza } from './strumenti.js';

const SOIL_WET = new THREE.Color(0x4a3628), SOIL_DRY = new THREE.Color(0xc9ad80);

// Colori dell'acero giapponese nell'anno, ben diversi tra loro: in primavera verde tenero con le punte
// arrossate dalle foglie nuove, in estate verde intenso, in autunno rosso fuoco e arancio
const ACERO = {
  primavera: ['#86c23a', '#97cf40', '#a9da4a', '#bce35a', '#cfe56a', '#dcd070', '#e4906c'],
  estate: ['#1f5219', '#28621f', '#317226', '#3c812d', '#478f35', '#539c3d', '#5fa645'],
  autunno: ['#8c1616', '#ad1f1c', '#cc2c22', '#e3462a', '#f0702c', '#f79c38', '#fcc848'],
  // foglie che seccano per la sete: marroni e accartocciate
  sete: ['#a07a3a', '#8a6334', '#b2914f', '#7a5530', '#c0a05a'],
};
// colore che prendono le gemme cresciute (in inverno restano gemme scure)
const MATURO = [0x92bd45, 0x477a30, 0xc94b2b, 0x7a3b2a];
// germogli nuovi dell'acero: rosso tenero sulla chioma verde, verde chiaro sulla chioma rossa o spoglia
const GERMOGLIO = [0xe0563c, 0xe0563c, 0xc8ec5a, 0xc8ec5a];

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

// I vasi del negozio (gioco/stato.js, VASI), tutti alti uguale sul tavolo dell'acero:
// ognuno aggiunge i suoi pezzi al gruppo e dice com'è fatto il terriccio.
const VASI_FORME = {
  blu(g) {
    mesh(new THREE.CylinderGeometry(.8, .62, .36, 36), M(0x4c7891), g, 0, .99, 0).scale.z = .74;
    mesh(new THREE.CylinderGeometry(.84, .84, .06, 36), M(0x5f8ea8), g, 0, 1.17, 0).scale.z = .74;
    return { geo: new THREE.CylinderGeometry(.76, .76, .04, 36), sz: .72 };
  },
  terracotta(g) {
    mesh(new THREE.CylinderGeometry(.68, .54, .36, 36), M(0xc27a4a), g, 0, .99, 0).scale.z = .9;
    mesh(new THREE.CylinderGeometry(.73, .73, .07, 36), M(0xae6a3d), g, 0, 1.17, 0).scale.z = .9;
    return { geo: new THREE.CylinderGeometry(.65, .65, .04, 36), sz: .88 };
  },
  // rettangolare basso in grès scuro non smaltato, con i piedini agli angoli
  rettangolare(g) {
    mesh(new THREE.BoxGeometry(1.62, .3, .98), M(0x5b4636), g, 0, 1.0, 0);
    mesh(new THREE.BoxGeometry(1.7, .06, 1.06), M(0x4a3829), g, 0, 1.17, 0);
    [[-.7, -.38], [.7, -.38], [-.7, .38], [.7, .38]].forEach(([x, z]) => mesh(new THREE.BoxGeometry(.16, .06, .14), M(0x4a3829), g, x, .84, z));
    return { geo: new THREE.BoxGeometry(1.56, .04, .92) };
  },
  // ovale basso verde celadon, smaltato
  celadon(g) {
    mesh(new THREE.CylinderGeometry(.88, .7, .3, 40), M(0x8cbfa3), g, 0, 1.02, 0).scale.z = .7;
    mesh(new THREE.CylinderGeometry(.92, .92, .06, 40), M(0xa9d6bd), g, 0, 1.17, 0).scale.z = .7;
    mesh(new THREE.CylinderGeometry(.6, .6, .06, 40), M(0x76a98c), g, 0, .84, 0).scale.z = .7;
    return { geo: new THREE.CylinderGeometry(.84, .84, .04, 40), sz: .68 };
  },
  // tondo color crema con una fascia blu e tre piedini a nuvola
  nuvola(g) {
    mesh(new THREE.CylinderGeometry(.74, .64, .3, 40), M(0xeadfc6), g, 0, 1.02, 0).scale.z = .82;
    mesh(new THREE.CylinderGeometry(.78, .78, .06, 40), M(0xd9c9a6), g, 0, 1.17, 0).scale.z = .82;
    const fascia = mesh(new THREE.TorusGeometry(.705, .022, 8, 48), M(0x4c7891), g, 0, 1.08, 0);
    fascia.rotation.x = PI / 2; fascia.scale.y = .82;
    for (let i = 0; i < 3; i++) {
      const a = i / 3 * PI * 2 + PI / 2, p = mesh(new THREE.SphereGeometry(.1, 12, 8), M(0xd0bc96), g, Math.cos(a) * .5, .86, Math.sin(a) * .42);
      p.scale.set(1.5, .55, 1.1);
    }
    return { geo: new THREE.CylinderGeometry(.7, .7, .04, 40), sz: .8 };
  },
};

export function creaAlberi(world) {
  const trees = {};

  // Acero giapponese su un tavolo in legno: è la pianta da curare
  let acero;
  {
    const t = new THREE.Group(); t.position.set(0, 0, -2.4); world.add(t);
    mesh(new THREE.BoxGeometry(2.1, .12, 1.3), M(0x8b5a34), t, 0, .75, 0);
    [[-.9, -.52], [.9, -.52], [-.9, .52], [.9, .52]].forEach(([x, z]) => mesh(new THREE.BoxGeometry(.13, .75, .13), M(0x6b4226), t, x, .375, z));
    mesh(new THREE.BoxGeometry(1.9, .08, .1), M(0x6b4226), t, 0, .2, .52);
    // vaso: si cambia dal negozio; il terriccio resta lo stesso oggetto e cambia solo forma
    const vasoG = new THREE.Group(); t.add(vasoG);
    const soil = mesh(new THREE.CylinderGeometry(.76, .76, .04, 36), toon({ color: SOIL_DRY.clone() }), t, 0, 1.19, 0);
    let vasoAttuale = null, vasoPronto = false;
    const scintille = creaScintille(t, vasoG);
    // anima: fa un saltello e una pioggia di stelline, per far capire che il vaso è cambiato
    function mettiVaso(id, anima = false) {
      if (id === vasoAttuale || !VASI_FORME[id]) return;
      vasoAttuale = id;
      vasoG.children.slice().forEach(c => { vasoG.remove(c); c.geometry.dispose(); });
      const terra = VASI_FORME[id](vasoG);
      soil.geometry.dispose(); soil.geometry = terra.geo; soil.scale.set(1, 1, terra.sz ?? 1);
      if (anima) scintille.avvia();
    }
    mettiVaso('blu');
    for (let i = 0; i < 7; i++) { const b = mesh(new THREE.IcosahedronGeometry(R(.08, .14), 1), M(0x6a9a40), t, R(-.55, .55), 1.21, R(-.35, .35)); b.scale.y = .4; }
    const tr = new THREE.Group(); tr.position.set(0, 1.16, 0); t.add(tr);
    const legnoA = corteccia(0x857262, { chiaro: .18, scuro: .25 });
    tube([[0, -.05, 0], [.08, .35, .02], [-.12, .75, .05], [.04, 1.15, 0], [0, 1.55, 0]], .2, .06, legnoA, tr);
    for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2 + .3; tube([[0, .06, 0], [Math.cos(a) * .22, 0, Math.sin(a) * .18], [Math.cos(a) * .42, -.03, Math.sin(a) * .3]], .075, .02, legnoA, tr, 6); }
    const ramiA = [[[-.1, .7, .04], [-.55, .9, .12], [-1.0, 1.05, .1]], [[.03, 1.0, 0], [.5, 1.2, -.08], [.95, 1.35, -.05]], [[.02, 1.3, 0], [-.25, 1.55, .18], [-.45, 1.75, .2]], [[.03, 1.15, -.02], [.15, 1.35, -.35], [.2, 1.5, -.55]], [[0, 1.5, 0], [.15, 1.75, -.05], [.2, 1.95, -.1]], [[.02, 1.2, .02], [.3, 1.45, .25], [.45, 1.7, .3]]];
    const padsA = [[-1.0, 1.08, .1, .56], [.95, 1.38, -.05, .56], [-.45, 1.82, .2, .5], [.2, 2.0, -.1, .6], [.2, 1.55, -.55, .46], [-.5, 1.42, -.3, .42], [.45, 1.75, .3, .44]];
    // rami da legare col filo (l'ordine è quello di RAMI nel motore): [ramo qui sopra, cuscinetto che porta]
    // ognuno ha un gruppo che ruota attorno all'attacco sul tronco, con il ramo e i suoi rametti
    const LEGABILI = [[0, 0], [1, 1], [2, 2], [5, 6]];
    const gruppoRamo = {}, gruppoPad = {};
    for (const [b, pad] of LEGABILI) { const g = new THREE.Group(); g.matrixAutoUpdate = false; tr.add(g); gruppoRamo[b] = gruppoPad[pad] = g; }
    ramiA.forEach((p, b) => tube(p, .075, .022, legnoA, gruppoRamo[b] ?? tr, 10));
    const f = foliage(tr, padsA,
      { palette: ACERO.autunno, density: 72, size: .37, flat: .78, detail: 1, geo: ciuffoFoglie({ n: 7, lobi: 5, incavo: .32, nucleo: .1, grandezza: .74 }) });
    const puntiRametti = rametti(pad => gruppoPad[pad] ?? tr, padsA, legnoA, 21);
    const filo = creaFilo(LEGABILI.map(([b, pad]) => {
      const [x, y, z, r] = padsA[pad];
      return { gruppo: gruppoRamo[b], punti: ramiA[b], r0: .075, r1: .022, cima: new THREE.Vector3(x, y + r * .5, z) };
    }));
    // anello azzurro a terra, attorno al tavolo: indica la pianta che ha bisogno
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.38, 1.5, 64), new THREE.MeshBasicMaterial({ color: 0x6ac8ff, transparent: true, opacity: .7, depthWrite: false }));
    ring.rotation.x = -PI / 2; ring.position.y = .025; t.add(ring);
    trees.acero = { g: tr, radice: t, tag: new THREE.Vector3(-.3, 1.16 + 2.95, -2.4), ph: 0 };

    // colori di ogni ciuffo in ogni stagione e con la sete, presi dalla stessa posizione nella tavolozza
    const tinta = (pal) => f.toni.map(x => new THREE.Color(pal[Math.round(x * (pal.length - 1))]));
    const colori = { primavera: tinta(ACERO.primavera), estate: tinta(ACERO.estate), autunno: f.healthy };
    const rs = sequenza(41), secche = f.healthy.map(() => rs() < .55 ? new THREE.Color(ACERO.sete[Math.floor(rs() * ACERO.sete.length)]) : null);
    // punte della chioma dove spuntano i germogli da potare: 2 per cuscinetto, sui 5 cuscinetti
    // più verso chi guarda; l'indice corrisponde a PUNTE del motore
    // ogni germoglio nasce dalla punta di un rametto, così è sempre attaccato alla pianta:
    // per ogni cuscinetto si scelgono i 2 rametti più rivolti verso l'esterno e verso chi guarda
    const davanti = [0, 1, 2, 3, 6];
    const scelti = davanti.map(n => {
      const [x, , z] = padsA[n], fuori = new THREE.Vector3(x, 0, z + .6).normalize();
      return puntiRametti.filter(q => q.pad === n)
        .map(q => ({ q, voto: q.a.clone().sub(q.da).setY(0).normalize().dot(fuori) }))
        .sort((a, b) => b.voto - a.voto).slice(0, 2).map(x => x.q);
    });
    const punte = [0, 1].flatMap(j => scelti.map(coppia => {
      const { da, a, pad } = coppia[j];
      // il germoglio prosegue il rametto piegando verso l'alto, verso la luce;
      // gruppo: sta sul ramo e si piega con lui quando si mette il filo
      return { p: a.clone(), d: a.clone().sub(da).normalize().add(new THREE.Vector3(0, 1.3, 0)).normalize(), gruppo: gruppoPad[pad] };
    }));
    acero = pianta(f, soil, ring, {
      // il primo vaso (quello del salvataggio) si mette senza stelline
      setVaso(id) { mettiVaso(id, vasoPronto); vasoPronto = true; },
      scintille,
      g: tr,
      punte,
      filo,
      // cuscinetto di ogni ciuffo e gruppo che lo piega: le foglie seguono il ramo col filo
      padDi: f.pad,
      pieghe: gruppoPad,
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
    filo.quandoPiega = () => acero.aggiornaPieghe();
  }

  let ginepro;
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
    const fg = foliage(tr, padsG,
      { palette: ['#24574a', '#2e6754', '#38775e', '#448667', '#529571', '#64a57c'], density: 92, size: .44, flat: .5, detail: 1, geo: ciuffoSquame({ n: 34, lunghezza: .8, larghezza: .3, nucleo: .3, seme: 3 }) });
    rametti(tr, padsG, legnoG, 13);
    trees.ginepro = { g: tr, radice: t, tag: new THREE.Vector3(-2.3, .58 + 2.35, .6), ph: 1.7 };
    // d'inverno il ginepro cinese prende un colore bronzeo, che torna verde a fine stagione
    const bronzo = fg.toni.map(x => new THREE.Color(['#4f4a2e', '#5e5432', '#6e5e36', '#7d6a3c', '#8b7443', '#9a7f4c'][Math.round(x * 5)]));
    const c = new THREE.Color();
    ginepro = {
      setStagione(p) {
        const k = Math.min(1, Math.max(0, (p - 3) / .35)) * (1 - Math.min(1, Math.max(0, (p - 3.75) / .25)));
        for (let i = 0; i < fg.healthy.length; i++) fg.m.setColorAt(i, c.copy(fg.healthy[i]).lerp(bronzo[i], k * .75));
        fg.m.instanceColor.needsUpdate = true;
      },
    };
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
      { palette: ['#304a24', '#3c5a2b', '#4a6c34', '#587c3c', '#688d46'], density: 125, size: .29, flat: .62, detail: 0, geo: ciuffoAghi({ n: 80, lunghezza: 1.3, larghezza: .04, nucleo: .14, apertura: -.05 }), stress: ['#cdb84a', '#d6a440', '#bfae55', '#a8873a', '#d9c25e'], stressRatio: .42 });
    rametti(tr, pads, legnoP, 5);
    trees.pino = { g: tr, radice: t, tag: new THREE.Vector3(2.6, .6 + 2.3, 2.0), ph: 3.1 };
  }

  return {
    trees,
    acero,
    // quale pianta (vaso e supporto compresi) è sotto il dito: 'acero', 'ginepro', 'pino' oppure null
    tocca(raycaster) {
      let meglio = null, d = Infinity;
      for (const k in trees) {
        const hit = raycaster.intersectObject(trees[k].radice, true)[0];
        if (hit && hit.distance < d) { d = hit.distance; meglio = k; }
      }
      return meglio;
    },
    // punto dell'anno (0 = inizio primavera, 3 = inverno): l'acero cambia chioma, il ginepro si fa bronzeo
    setStagione(p) { acero.setStagione(p); ginepro.setStagione(p); },
    // le piante ondeggiano appena, come mosse dalla brezza
    aggiorna(clock) {
      for (const k in trees) { const { g, ph } = trees[k]; g.rotation.z = Math.sin(clock * .9 + ph) * .012; g.rotation.x = Math.cos(clock * .7 + ph) * .008; }
      if (acero.ring.visible) acero.ring.material.opacity = .45 + .3 * Math.sin(clock * 3.2);
      acero.aggiorna(clock);
    },
  };
}

// Stelline dorate che girano attorno al vaso e salgono per un paio di secondi, mentre il vaso fa un saltello
function creaScintille(parent, vaso) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 30);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,240,170,.9)'); g.addColorStop(1, 'rgba(255,210,90,0)');
  x.fillStyle = g; x.beginPath();
  // stella a quattro punte
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2 - PI / 2, r = i % 2 ? 7 : 30; x.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); }
  x.fill();
  const tex = new THREE.CanvasTexture(c), stelle = [];
  for (let i = 0; i < 26; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: i % 3 ? 0xffe27a : 0xffffff, transparent: true, depthWrite: false }));
    sp.visible = false; parent.add(sp); stelle.push({ sp, a: 0, r: 0, y: 0, v: 0, ritardo: 0 });
  }
  let t = -1;
  return {
    avvia() {
      t = 0;
      stelle.forEach((s, i) => Object.assign(s, { a: i / stelle.length * PI * 2 + Math.random() * .5, r: .85 + Math.random() * .4, y: .85 + Math.random() * .5, v: .25 + Math.random() * .25, ritardo: Math.random() * .7 }));
    },
    aggiorna(dt) {
      if (t < 0) return;
      t += dt;
      const k = Math.min(1, t / .5);
      vaso.scale.set(1 + .1 * Math.sin(PI * k), 1 + .16 * Math.sin(PI * k), 1 + .1 * Math.sin(PI * k));
      for (const s of stelle) {
        const tt = t - s.ritardo, vita = Math.min(1, Math.max(0, tt / 1.5));
        s.sp.visible = tt > 0 && vita < 1;
        if (!s.sp.visible) continue;
        const a = s.a + tt * 1.2;
        s.sp.position.set(Math.cos(a) * s.r, s.y + tt * s.v, Math.sin(a) * s.r * .75);
        s.sp.scale.setScalar(.42 * Math.sin(PI * vita) * (1 + .2 * Math.sin(tt * 18)));
        s.sp.material.opacity = Math.sin(PI * vita);
      }
      if (t > 2.4) { t = -1; vaso.scale.setScalar(1); stelle.forEach(s => { s.sp.visible = false; }); }
    },
  };
}

// Pianta da curare: chioma che si dirada, ingiallisce con la sete, si affloscia e perde foglie secche
// quando soffre, e cambia con le stagioni.
// f: chioma (foliage), soil: terriccio, ring: anello della sete; dati: punte, fuoco, potTop, colore()...
const ANELLO = new THREE.Color(0x6ac8ff), ANELLO_GRAVE = new THREE.Color(0xff7a4a), SECCO = new THREE.Color(0x7d6a3e);
const fogliaSeccaGeo = fogliaAcero().scale(.075, .075, .075);
const FOGLIE_SECCHE = ['#9a7434', '#8a5f2e', '#b08a48', '#7a5228'];

function pianta(f, soil, ring, dati) {
  const tmpC = new THREE.Color();
  // ordine in cui spariscono i ciuffi quando la chioma si dirada: prima quelli esterni
  const ordine = f.periferia.map((dn, i) => [dn + ((i * 0.618) % 1) * .35, i]).sort((a, b) => b[0] - a[0]).map(x => x[1]);
  // posizione, rotazione e grandezza originali di ogni ciuffo, per poterlo afflosciare
  const forme = [], m4 = new THREE.Matrix4();
  for (let i = 0; i < f.healthy.length; i++) {
    f.m.getMatrixAt(i, m4);
    const pos = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
    m4.decompose(pos, q, sc); forme.push({ pos, q, sc });
  }
  const zero = new THREE.Matrix4().makeScale(0, 0, 0), vp = new THREE.Vector3(), vs = new THREE.Vector3();
  let salute = 1, foglie = 1, appassimento = 0, anno = aspettoAnno(2.5), chiavePrima = '';
  const visibili = [];

  function chioma() {
    const nascosti = Math.max(Math.round((1 - salute) / .8 * ordine.length * .85), Math.round((1 - foglie) * ordine.length));
    const chiave = nascosti + ':' + appassimento.toFixed(2);
    if (chiave === chiavePrima) return;
    chiavePrima = chiave;
    visibili.length = 0;
    ordine.forEach((idx, k) => {
      if (k < nascosti) { f.m.setMatrixAt(idx, zero); return; }
      // quando soffre i ciuffi scendono un po' e si appiattiscono: la chioma si affloscia
      const { pos, q, sc } = forme[idx];
      vp.copy(pos); vp.y -= appassimento * (.06 + .1 * f.periferia[idx]);
      vs.copy(sc); vs.y *= 1 - .4 * appassimento; vs.x *= 1 - .08 * appassimento; vs.z *= 1 - .08 * appassimento;
      m4.compose(vp, q, vs);
      const piega = dati.pieghe?.[dati.padDi[idx]];
      if (piega) m4.premultiply(piega.matrix);
      f.m.setMatrixAt(idx, m4);
      visibili.push(idx);
    });
    f.m.instanceMatrix.needsUpdate = true;
  }
  function colora() {
    for (let i = 0; i < f.healthy.length; i++) {
      dati.colore(i, anno, p.thirst, tmpC);
      if (appassimento > 0) tmpC.lerp(SECCO, appassimento * .55);
      f.m.setColorAt(i, tmpC);
    }
    f.m.instanceColor.needsUpdate = true;
  }

  // foglie secche che si staccano e cadono quando la pianta soffre
  const cadute = [];
  for (let i = 0; i < 10; i++) {
    const m = new THREE.Mesh(fogliaSeccaGeo, toon({ color: FOGLIE_SECCHE[i % 4], side: THREE.DoubleSide }));
    m.visible = false; dati.g.add(m); cadute.push({ m, v: 0, ph: i * 1.7, terra: -1, attiva: false });
  }
  let accumulo = 0, orologio = null;

  const p = {
    ...dati,
    ring,
    thirst: 1,
    soilDry: 1,
    // colore delle foglie mature in questa stagione (lo usano le gemme che crescono)
    verde: new THREE.Color(MATURO[2]),
    coloreGermoglio: new THREE.Color(GERMOGLIO[2]),
    // germogli più lunghi, che escono bene dalla chioma
    scalaGermogli: 1.5,
    // 1 = chioma piena, 0,2 = quasi spoglia (resta sempre qualche ciuffo)
    setSalute(v) { salute = v; chioma(); },
    // un ramo col filo si è mosso: i suoi ciuffi lo seguono
    aggiornaPieghe() { chiavePrima = ''; chioma(); },
    // 0 = idratata, 1 = assetata: sfuma il colore di ogni ciuffo verso le foglie secche
    setThirst(v) { this.thirst = v; colora(); },
    // 0 = sta bene, 1 = soffre molto: chioma afflosciata, foglie spente, anello arancione
    setAppassimento(v) {
      if (Math.abs(v - appassimento) < .005) return;
      appassimento = v;
      ring.material.color.copy(ANELLO).lerp(ANELLO_GRAVE, Math.min(1, v * 2));
      colora(); chioma();
    },
    // 0 = terriccio umido (scuro), 1 = secco (chiaro)
    setSoil(v) { this.soilDry = v; soil.material.color.copy(SOIL_WET).lerp(SOIL_DRY, v); },
    // punto dell'anno: 0 = inizio primavera, 1 estate, 2 autunno, 3 inverno, fino a 4
    setStagione(pAnno) {
      const a = aspettoAnno(pAnno);
      if (a.da === anno.da && a.a === anno.a && a.k === anno.k && a.foglie === foglie) return;
      anno = a; foglie = a.foglie;
      this.verde.setHex(MATURO[Math.min(3, Math.floor(pAnno))]);
      this.coloreGermoglio.setHex(GERMOGLIO[Math.min(3, Math.floor(pAnno))]);
      colora(); chioma();
    },
    aggiorna(clock) {
      const dt = orologio === null ? 0 : Math.min(.05, clock - orologio); orologio = clock;
      this.scintille?.aggiorna(dt);
      this.filo?.aggiorna(clock);
      // più soffre, più foglie secche cadono (fino a 2 al secondo)
      const ritmo = Math.max(appassimento * 2, (this.thirst - .7) * 2);
      if (ritmo > 0 && visibili.length) {
        accumulo += dt * ritmo;
        while (accumulo > 1) {
          accumulo--;
          const c = cadute.find(x => !x.attiva); if (!c) break;
          const idx = visibili[(Math.random() * visibili.length) | 0], piega = dati.pieghe?.[dati.padDi[idx]];
          c.m.position.copy(forme[idx].pos); if (piega) c.m.position.applyMatrix4(piega.matrix);
          c.m.rotation.set(0, Math.random() * 6, 0);
          // si posa sul tavolo se ci cade sopra, altrimenti a terra
          c.terra = Math.abs(c.m.position.x) < 1.05 && Math.abs(c.m.position.z) < .65 ? -.33 : -1.14;
          c.v = .3 + Math.random() * .2; c.t = 0; c.attiva = true; c.m.visible = true; c.m.scale.setScalar(1);
        }
      }
      for (const c of cadute) {
        if (!c.attiva) continue;
        c.t += dt;
        if (c.m.position.y > c.terra) {
          c.ph += dt;
          c.m.position.y = Math.max(c.terra, c.m.position.y - c.v * dt);
          c.m.position.x += Math.sin(c.ph * 2.2) * .25 * dt;
          c.m.rotation.x = Math.sin(c.ph * 3) * .6; c.m.rotation.z = Math.cos(c.ph * 2.4) * .5;
          c.atterrata = c.t;
        } else {
          c.m.rotation.x = c.m.rotation.z = 0;
          // resta a terra un paio di secondi, poi sparisce
          const k = (c.t - c.atterrata - 2) / .6;
          c.m.scale.setScalar(Math.max(.001, 1 - Math.max(0, k)));
          if (k >= 1) { c.attiva = false; c.m.visible = false; }
        }
      }
    },
  };
  p.setThirst(1);
  return p;
}
