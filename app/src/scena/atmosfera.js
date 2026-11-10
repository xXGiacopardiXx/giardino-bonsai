// Ora del giorno e meteo (game-design.md, sezione 3.4): il giardino segue l'ora vera del telefono
// (alba, giorno, tramonto, notte con la lanterna accesa) e il meteo del motore (pioggia, neve).
// D'estate, di notte, le lucciole; d'estate a volte il temporale, con lampi e tuoni lontani.
// La neve si posa sul prato (giardino.setNeve) e dopo la pioggia restano pozzanghere che luccicano. Cielo, nebbia, sole, luce del cielo e nuvole passano piano da un
// aspetto all'altro. Le intensità sono moltiplicate per PI, come nel resto della scena.
// Pioggia, neve e lucciole usano Math.random solo mentre girano: la sequenza con seme fisso non cambia.
import * as THREE from 'three';

const PI = Math.PI;
const C = (x) => new THREE.Color(x);
// aspetto di ogni momento: cielo (4 colori dall'alto al basso), nebbia, sole, luce del cielo, nuvole, notte (0..1)
const ASPETTI = {
  notte: { cielo: ['#132042', '#25366a', '#3e4b7e', '#5b5a85'], nebbia: 0x3a4470, sole: [0xa9bfff, .36], emi: [0x7d92d0, 0x34344a, .44], nuvole: [0x5d6a92, 0x1a1f33], notte: 1 },
  alba: { cielo: ['#8fb0d8', '#f2c9b8', '#f7c39a', '#f6a985'], nebbia: 0xf3cdb4, sole: [0xffcfa0, .55], emi: [0xf5dccf, 0x8a7a5e, .45], nuvole: [0xfbd9c8, 0x6a4f45], notte: .25 },
  giorno: { cielo: ['#6fb2da', '#b4dbe8', '#f2e3cc', '#f5c99e'], nebbia: 0xf1dcc4, sole: [0xfff0d6, .74], emi: [0xdcefff, 0x9a8a5e, .5], nuvole: [0xf4efe8, 0x5a554f], notte: 0 },
  tramonto: { cielo: ['#5b78b6', '#e9a07e', '#f6935f', '#ea7a62'], nebbia: 0xe9a88a, sole: [0xffa26a, .52], emi: [0xffd2b8, 0x7a6450, .42], nuvole: [0xf7b89a, 0x6a3f35], notte: .35 },
};
// il cielo coperto, per la pioggia e la neve (si mescola al momento del giorno)
const COPERTO = {
  pioggia: { cielo: ['#7e8c96', '#a3adb3', '#b9bcb8', '#b2aea6'], nebbia: 0xa7adb0, sole: [0xdfe6ea, .3], emi: [0xc9d3da, 0x6f6a5c, .48], nuvole: [0x9aa3a9, 0x3a3f44] },
  neve: { cielo: ['#9fb0c0', '#cdd6dd', '#e4e6e6', '#e8e2da'], nebbia: 0xdfe3e6, sole: [0xeef3ff, .45], emi: [0xe6eef7, 0x9a9a96, .56], nuvole: [0xe8ecef, 0x55595e] },
};
// ore del giorno e momento corrispondente: tra due ore vicine si passa piano dall'uno all'altro
const ORE = [[0, 'notte'], [5, 'notte'], [6.5, 'alba'], [8, 'giorno'], [17.5, 'giorno'], [19.3, 'tramonto'], [21, 'notte'], [24, 'notte']];

// valori numerici di un aspetto, per mescolarli facilmente
function valori(a) {
  return { cielo: a.cielo.map(C), nebbia: C(a.nebbia), sole: C(a.sole[0]), soleI: a.sole[1], emiS: C(a.emi[0]), emiT: C(a.emi[1]), emiI: a.emi[2], nuv: C(a.nuvole[0]), nuvE: C(a.nuvole[1]), notte: a.notte ?? 0 };
}
function mescola(a, b, k) {
  return {
    cielo: a.cielo.map((c, i) => c.clone().lerp(b.cielo[i], k)), nebbia: a.nebbia.clone().lerp(b.nebbia, k),
    sole: a.sole.clone().lerp(b.sole, k), soleI: a.soleI + (b.soleI - a.soleI) * k,
    emiS: a.emiS.clone().lerp(b.emiS, k), emiT: a.emiT.clone().lerp(b.emiT, k), emiI: a.emiI + (b.emiI - a.emiI) * k,
    nuv: a.nuv.clone().lerp(b.nuv, k), nuvE: a.nuvE.clone().lerp(b.nuvE, k), notte: a.notte + (b.notte - a.notte) * k,
  };
}
const V = Object.fromEntries(Object.entries(ASPETTI).map(([k, a]) => [k, valori(a)]));
const VC = Object.fromEntries(Object.entries(COPERTO).map(([k, a]) => [k, valori(a)]));

// l'aspetto all'ora h (0..24), con il cielo coperto se piove o nevica (più scuro di notte)
function aspettoAlle(h, cade) {
  let i = 0; while (i < ORE.length - 2 && h >= ORE[i + 1][0]) i++;
  const [h0, a0] = ORE[i], [h1, a1] = ORE[i + 1];
  let v = mescola(V[a0], V[a1], h1 > h0 ? (h - h0) / (h1 - h0) : 0);
  if (cade) {
    const buio = 1 - .72 * v.notte, cop = VC[cade];
    const scuro = { ...cop, cielo: cop.cielo.map(c => c.clone().multiplyScalar(buio)), nebbia: cop.nebbia.clone().multiplyScalar(buio),
      nuv: cop.nuv.clone().multiplyScalar(buio), nuvE: cop.nuvE.clone().multiplyScalar(buio), emiS: cop.emiS.clone().multiplyScalar(buio),
      soleI: cop.soleI * buio, emiI: cop.emiI * (1 - .3 * v.notte), notte: v.notte };
    v = mescola(v, scuro, .75);
  }
  return v;
}

// una pallina di luce morbida, per neve e lucciole
function pallina() {
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const x = c.getContext('2d'), g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.4, 'rgba(255,255,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}

// pozzanghere sulla ghiaia e accanto al sentiero: [x, z, raggio]
const POZZE = [[1.65, -.35, .5], [-1.05, 1.95, .38], [2.55, -1.55, .32], [-1.15, -.35, .42], [.45, 4.05, .3], [-.2, .55, .28]];

// cielo: { sun, hemi, cielo: { ctx, tex } } da creaCielo; nuvole: { mat }; lanterna: { lamp, luce }; giardino: { setNeve }
// tuono(forza): il suono del tuono, qualche istante dopo il lampo
export function creaAtmosfera(scene, { sun, hemi, cielo, nuvole, lanterna, giardino }, { reduce, tuono }) {
  // pozzanghere: dischi lucidi e un po' trasparenti, che compaiono con la pioggia e si asciugano piano
  const matPozza = new THREE.MeshPhongMaterial({ color: 0x86aec2, shininess: 120, specular: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
  const pozze = POZZE.map(([x, z, r]) => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 28), matPozza);
    m.rotation.x = -PI / 2; m.scale.y = .7; m.position.set(x, .024, z); m.renderOrder = 1; m.visible = false; scene.add(m);
    return m;
  });
  let lampo = 0, prossimoLampo = 4, neveScena = -1;
  const tex = pallina();
  // pioggia: gocce come trattini che cadono un po' inclinati
  const N_GOCCE = 700, gocce = new Float32Array(N_GOCCE * 6);
  const geoP = new THREE.BufferGeometry(); geoP.setAttribute('position', new THREE.BufferAttribute(gocce, 3));
  const pioggia = new THREE.LineSegments(geoP, new THREE.LineBasicMaterial({ color: 0xd2e2ee, transparent: true, opacity: 0, depthWrite: false }));
  pioggia.frustumCulled = false; pioggia.visible = false; scene.add(pioggia);
  const goccia = (i, y = Math.random() * 14) => {
    const x = (Math.random() - .5) * 16, z = (Math.random() - .5) * 18;
    gocce.set([x, y, z, x + .06, y + .45, z + .02], i * 6);
  };
  for (let i = 0; i < N_GOCCE; i++) goccia(i);
  // neve: fiocchi che scendono ondeggiando
  const N_FIOCCHI = 800, fiocchi = new Float32Array(N_FIOCCHI * 3), fase = new Float32Array(N_FIOCCHI);
  for (let i = 0; i < N_FIOCCHI; i++) { fiocchi.set([(Math.random() - .5) * 16, Math.random() * 12, (Math.random() - .5) * 18], i * 3); fase[i] = Math.random() * 6; }
  const geoN = new THREE.BufferGeometry(); geoN.setAttribute('position', new THREE.BufferAttribute(fiocchi, 3));
  const neve = new THREE.Points(geoN, new THREE.PointsMaterial({ map: tex, color: 0xffffff, size: .13, transparent: true, opacity: 0, depthWrite: false }));
  neve.frustumCulled = false; neve.visible = false; scene.add(neve);
  // lucciole: luci gialle che vagano sul prato e si accendono e spengono
  const N_LUCI = 36, luci = new Float32Array(N_LUCI * 3), colLuci = new Float32Array(N_LUCI * 3), moto = [];
  for (let i = 0; i < N_LUCI; i++) {
    const a = Math.random() * PI * 2, r = 2.2 + Math.random() * 2.4;
    moto.push({ x: Math.cos(a) * r, z: Math.sin(a) * r * 1.3, y: .3 + Math.random() * 1.2, f: Math.random() * 6, v: .3 + Math.random() * .5 });
  }
  const geoL = new THREE.BufferGeometry();
  geoL.setAttribute('position', new THREE.BufferAttribute(luci, 3)); geoL.setAttribute('color', new THREE.BufferAttribute(colLuci, 3));
  const lucciole = new THREE.Points(geoL, new THREE.PointsMaterial({ map: tex, size: .55, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  lucciole.frustumCulled = false; lucciole.visible = false; scene.add(lucciole);

  const lampGiorno = lanterna.lamp.material.color.clone(), lampNotte = C(0xffe9b0);
  let extra = { temporale: false, neve: 0, pozze: 0 };
  let ora = 12, cade = null, stagione = 0, attuale = null, tempo = 0, quantoPioggia = 0, quantoNeve = 0, quanteLucciole = 0;

  // disegna la sfumatura del cielo con i 4 colori
  function cieloDi(colori) {
    const g = cielo.ctx.createLinearGradient(0, 0, 0, 512);
    [0, .42, .72, 1].forEach((p, i) => g.addColorStop(p, '#' + colori[i].getHexString()));
    cielo.ctx.fillStyle = g; cielo.ctx.fillRect(0, 0, 4, 512); cielo.tex.needsUpdate = true;
  }
  function applica(v) {
    cieloDi(v.cielo);
    scene.fog.color.copy(v.nebbia);
    sun.color.copy(v.sole); sun.intensity = v.soleI * PI;
    hemi.color.copy(v.emiS); hemi.groundColor.copy(v.emiT); hemi.intensity = v.emiI * PI;
    nuvole.mat.color.copy(v.nuv); nuvole.mat.emissive.copy(v.nuvE);
    // il sole gira col giorno; di notte la luna arriva dall'altra parte
    const giorno = Math.min(1, Math.max(0, (ora - 5.5) / 15)), a = giorno * PI;
    if (v.notte > .6) sun.position.set(-7, 13, 5);
    else sun.position.set(12 * Math.cos(a), 7 + 8 * Math.sin(a), 6);
    // la lanterna si accende davvero quando fa buio
    lanterna.luce.intensity = (.55 + 1.7 * v.notte) * PI; lanterna.luce.distance = 3.2 + 2.6 * v.notte;
    lanterna.lamp.material.color.copy(lampGiorno).lerp(lampNotte, v.notte);
  }

  return {
    // h: ora del giorno (0..24, ora vera del telefono); cosaCade: 'pioggia', 'neve' o null; stag: stagione del gioco
    // e: { temporale, neve (a terra, 0..1), pozze (0..1) } dalla vista del motore
    imposta(h, cosaCade, stag, e = {}) { ora = h; cade = cosaCade; stagione = stag; extra = { temporale: !!e.temporale, neve: e.neve ?? 0, pozze: e.pozze ?? 0 }; },
    // quanto è notte adesso (0..1)
    get notte() { return attuale?.notte ?? 0; },
    aggiorna(dt) {
      tempo += dt;
      // l'aspetto si avvicina a quello giusto in qualche secondo (all'apertura subito)
      const meta = aspettoAlle(ora, cade);
      attuale = attuale ? mescola(attuale, meta, Math.min(1, dt * 1.2)) : meta;
      applica(attuale);
      // temporale: ogni tanto un lampo illumina tutto, e qualche istante dopo brontola il tuono
      if (cade === 'pioggia' && extra.temporale && !reduce) {
        prossimoLampo -= dt;
        if (prossimoLampo <= 0) {
          lampo = 1; prossimoLampo = 6 + Math.random() * 10;
          const lontano = Math.random();
          setTimeout(() => tuono?.(1 - lontano * .5), 500 + lontano * 2200);
        }
      }
      if (lampo > 0) {
        // due bagliori ravvicinati, come un lampo vero
        const t = 1 - lampo, f = t < .12 ? 1 : t < .22 ? .25 : t < .32 ? .85 : Math.max(0, 1 - (t - .32) / .68) * .5;
        hemi.intensity += f * 1.6 * PI; sun.intensity += f * .8 * PI;
        lampo = Math.max(0, lampo - dt / .55);
      }
      // la neve a terra si posa piano anche nella scena; le pozzanghere luccicano
      neveScena = neveScena < 0 ? extra.neve : neveScena + (extra.neve - neveScena) * Math.min(1, dt * .5);
      giardino?.setNeve(neveScena);
      matPozza.opacity = .62 * extra.pozze * (1 - neveScena);
      pozze.forEach(m => { m.visible = matPozza.opacity > .02; });
      const k = Math.min(1, dt * .8);
      quantoPioggia += ((cade === 'pioggia' ? 1 : 0) - quantoPioggia) * k;
      quantoNeve += ((cade === 'neve' ? 1 : 0) - quantoNeve) * k;
      quanteLucciole += ((stagione === 1 && !cade && attuale.notte > .6 ? 1 : 0) - quanteLucciole) * k;
      // pioggia
      pioggia.visible = quantoPioggia > .02; pioggia.material.opacity = (extra.temporale ? .7 : .5) * quantoPioggia;
      if (pioggia.visible && !reduce) {
        for (let i = 0; i < N_GOCCE; i++) {
          const j = i * 6; gocce[j + 1] -= 13 * dt; gocce[j + 4] -= 13 * dt; gocce[j] -= .9 * dt; gocce[j + 3] -= .9 * dt;
          if (gocce[j + 1] < 0) goccia(i, 13 + Math.random());
        }
        geoP.attributes.position.needsUpdate = true;
      }
      // neve
      neve.visible = quantoNeve > .02; neve.material.opacity = .95 * quantoNeve;
      if (neve.visible && !reduce) {
        for (let i = 0; i < N_FIOCCHI; i++) {
          const j = i * 3; fiocchi[j + 1] -= .9 * dt; fiocchi[j] += Math.sin(tempo * .8 + fase[i]) * .25 * dt;
          if (fiocchi[j + 1] < 0) fiocchi[j + 1] = 12;
        }
        geoN.attributes.position.needsUpdate = true;
      }
      // lucciole: vagano piano e lampeggiano, ognuna col suo ritmo
      lucciole.visible = quanteLucciole > .02;
      if (lucciole.visible) {
        moto.forEach((m, i) => {
          const t = tempo * m.v + m.f;
          luci.set([m.x + Math.sin(t * .7) * .5, m.y + Math.sin(t * 1.3) * .2, m.z + Math.cos(t * .6) * .5], i * 3);
          const b = Math.max(0, Math.sin(tempo * (1.4 + m.v) + m.f * 3)) ** 2 * quanteLucciole;
          colLuci.set([b, b * .95, b * .35], i * 3);
        });
        geoL.attributes.position.needsUpdate = true; geoL.attributes.color.needsUpdate = true;
      }
    },
  };
}
