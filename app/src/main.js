// Punto di partenza dell'app: crea la scena 3D, collega i pulsanti e avvia il ciclo di disegno.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import './style.css';

import { creaCielo, creaNuvole } from './scena/cielo.js';
import { creaIsola } from './scena/isola.js';
import { creaAlberi } from './scena/alberi.js';
import { creaGiardino } from './scena/giardino.js';
import { creaAnnaffiatura } from './scena/annaffiatura.js';
import { creaGermogli } from './scena/germogli.js';
import { creaAghiVecchi } from './scena/aghi-vecchi.js';
import { creaRinvaso } from './scena/rinvaso.js';
import { creaInterfaccia } from './interfaccia.js';
import { creaPannelloProva } from './pannello-prova.js';
import { creaNegozio } from './negozio.js';
import { creaCure } from './cure.js';
import { creaCura } from './scena/cura.js';
import { creaGuida } from './guida.js';
import * as suoni from './suoni.js';
import * as musica from './musica.js';
import { GIORNO } from './gioco/tempo.js';
import { nuovoStato, avanza, annaffia, pota, mettiFilo, togliFilo, togliAghi, rinvasa, usaProdotto, compraProdotto, compra, scegliVaso, vista, VASI } from './gioco/stato.js';
import { carica, salva, cancella } from './gioco/salvataggio.js';

// Colori come nel prototipo (Three.js r128): niente conversioni di spazio colore
THREE.ColorManagement.enabled = false;

// Su iPhone il pizzico non deve ingrandire la pagina, solo la scena
document.addEventListener('gesturestart', e => e.preventDefault());
// l'audio del telefono si sblocca solo con un tocco; Safari accetta lo sblocco solo da alcuni eventi,
// per questo li ascoltiamo tutti
const sbloccaAudio = () => { suoni.sblocca(); musica.avvia(); };
['pointerdown', 'touchend', 'click'].forEach(ev => document.addEventListener(ev, sbloccaAudio, true));

const screenEl = document.getElementById('screen'), canvas = document.getElementById('c');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
} catch (e) {
  document.getElementById('fallback').style.display = 'grid';
}

if (renderer) avvia();

function avvia() {
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 220);
  const world = new THREE.Group(); scene.add(world);

  // L'ordine conta: ogni parte consuma numeri casuali dalla stessa sequenza
  creaCielo(scene);
  creaIsola(world, renderer.capabilities.getMaxAnisotropy());
  const alberi = creaAlberi(world);
  const giardino = creaGiardino(world, { reduce });
  const nuvole = creaNuvole(scene);

  // Telecamera: si ruota col dito e si zooma col pizzico, senza spostarsi di lato
  const controls = new OrbitControls(camera, canvas);
  Object.assign(controls, { enablePan: false, enableDamping: true, dampingFactor: .08, rotateSpeed: .55, zoomSpeed: .8, minPolarAngle: .55, maxPolarAngle: 1.2 });
  const target = new THREE.Vector3(.1, 1.5, .5); controls.target.copy(target);
  // potando, filando: la pianta su cui si sta lavorando ('acero', 'pino', 'ginepro'), oppure null
  let baseDist = 30, potando = null, filando = null;
  // inquadra tutta l'isola qualunque sia la forma dello schermo
  function fit() {
    const w = screenEl.clientWidth, h = screenEl.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    const a = w / h, hw = Math.min(4.4, 4.4 * Math.max(a, .42) / .46);
    baseDist = Math.min(44, Math.max(16, hw / (Math.tan(camera.fov / 2 * Math.PI / 180) * Math.min(a, 1))));
    camera.updateProjectionMatrix();
    // durante la potatura ci si può avvicinare di più, per toccare i germogli
    controls.minDistance = baseDist * (potando || filando ? .2 : .45); controls.maxDistance = baseDist * 1.15;
    scene.fog.near = baseDist + 8; scene.fog.far = baseDist + 62;
  }
  fit();
  camera.position.copy(target).add(new THREE.Vector3(Math.sin(.95) * Math.sin(.22), Math.cos(.95), Math.sin(.95) * Math.cos(.22)).multiplyScalar(baseDist));
  controls.update();
  new ResizeObserver(() => {
    const d = camera.position.distanceTo(controls.target) / (baseDist || 1);
    fit(); camera.position.sub(controls.target).setLength(d * baseDist).add(controls.target);
  }).observe(screenEl);

  const ui = creaInterfaccia(screenEl, camera, alberi.trees);
  // La pianta del motore è l'acero, unica specie da curare nell'MVP (game-design.md, sezione 14.1)
  const acero = alberi.acero;
  // germogli dell'acero, candele del pino, punte del ginepro; aghi vecchi del pino
  const germogliScene = Object.fromEntries(['acero', 'pino', 'ginepro'].map(p => [p, creaGermogli(scene, alberi.cure[p])]));
  const aghiVecchi = creaAghiVecchi(alberi.cure.pino);
  // afidi, concime e spray su tutte e tre le piante
  const curaScene = Object.fromEntries(['acero', 'pino', 'ginepro'].map(p => [p, creaCura(scene, alberi.cure[p], p)]));
  // radici che escono dal vaso stretto e animazione del rinvaso
  const rinvasoScena = creaRinvaso(scene, alberi.cure);

  // --- Stato della partita: caricato, portato all'ora attuale, salvato ---
  let stato = carica(Date.now());
  const ora = () => Date.now() + stato.debug.spostamento;
  avanza(stato, ora());
  salva(stato);

  let pannello, negozio, cure;
  // ridisegna scena e interfaccia; con l'anteprima del pannello mostra il futuro senza toccare la partita
  // azione della barra in attesa che si tocchi una pianta: 'acqua', 'pota', 'filo' (oppure null)
  let scelta = null;
  const avvisati = new Set();
  const SULLA = { acero: 'sull' + "'" + 'acero', pino: 'sul pino', ginepro: 'sul ginepro' };
  function disegna() {
    const giorniAnteprima = pannello?.anteprima ?? 0;
    const base = giorniAnteprima > 0 ? avanza(structuredClone(stato), ora() + giorniAnteprima * GIORNO) : stato;
    const v = vista(base);
    const annaffiando = annaffiature.acero.attiva;
    ui.aggiorna(v, { annaffiando });
    if (!annaffiando) {
      acero.setThirst(v.ingiallimento);
      acero.setSoil(v.terriccio);
      acero.ring.visible = v.haSete || (scelta === 'acqua' && v.puoAnnaffiare);
      acero.setAppassimento(v.appassimento);
    }
    // pino e ginepro: aghi che ingialliscono, terriccio che schiarisce, anello quando hanno sete
    for (const p of ['pino', 'ginepro']) {
      if (annaffiature[p].attiva) continue;
      const c = v.conifere[p], pianta = alberi.cure[p];
      pianta.setThirst(c.ingiallimento); pianta.setSoil(c.terriccio); pianta.setSalute(c.salute);
      pianta.ring.visible = c.haSete || (scelta === 'acqua' && c.puoAnnaffiare);
    }
    acero.filo.setRami(v.rami);
    for (const p of ['pino', 'ginepro']) alberi.cure[p].filo.setRami(v.conifere[p].rami);
    document.getElementById('t-wire').classList.toggle('needs', v.filoDaTogliere || v.conifere.pino.filoDaTogliere || v.conifere.ginepro.filoDaTogliere);
    acero.setSalute(v.salute);
    acero.setVaso(v.vaso);
    negozio?.mostra(v);
    cure?.mostra(v);
    rinvasoScena.setRinvaso(v.rinvaso);
    for (const p in curaScene) {
      const c = v.cura[p];
      curaScene[p].setParassiti(c.parassiti); curaScene[p].setConcime(c.concime);
      // la prima volta che gli afidi diventano evidenti, un avviso gentile
      if (c.parassiti?.visibili && !avvisati.has(p) && giorniAnteprima === 0) {
        avvisati.add(p);
        setTimeout(() => ui.toast(`Ci sono degli afidi ${SULLA[p]}! Tocca la pianta e scegli Cura.`, 4000), 600);
      }
      if (!c.parassiti) avvisati.delete(p);
      if (p !== 'acero') document.getElementById(p + '-afidi').hidden = !c.parassiti?.visibili;
    }
    document.getElementById('t-care').classList.toggle('needs', Object.values(v.cura).some(c => c.parassiti?.visibili));
    // punto dell'anno, giorno per giorno: colori dell'acero e foglie che cadono
    const pAnno = v.stagione + (v.giornoStagione - 1) / 7;
    alberi.setStagione(pAnno); giardino.setStagione(pAnno); musica.setStagione(v.stagione);
    germogliScene.acero.sincronizza(v.germogli, v.gemme);
    for (const p of ['pino', 'ginepro']) germogliScene[p].sincronizza(v.conifere[p].germogli, []);
    aghiVecchi.sincronizza(v.conifere.pino.vecchi);
    pannello?.mostra(v, base.aggiornato);
  }
  function aggiornaStato() { avanza(stato, ora()); salva(stato); disegna(); }

  // --- Acqua: ogni pianta ha la sua sete (sezione 6.1.4). Acqua nella barra annaffia la pianta
  // che ne ha bisogno; se sono più d'una, si tocca quella da annaffiare. Dalla tendina di una pianta
  // si annaffia lei. ---
  const waterBtn = document.getElementById('t-water');
  const esiti = {};
  const ANTEPRIMA = 'Stai guardando un\'anteprima: chiudila o fai passare il tempo.';
  const IL = { acero: 'L\'acero', pino: 'Il pino', ginepro: 'Il ginepro' };
  const DOPO = {
    acero: 'L\'acero si sta riprendendo. Tornerà ad avere sete tra un giorno o due.',
    pino: 'Il pino ha bevuto. Come tutte le conifere vuole il terriccio quasi asciutto: avrà di nuovo sete tra qualche giorno.',
    ginepro: 'Il ginepro ha bevuto. Come tutte le conifere vuole il terriccio quasi asciutto: avrà di nuovo sete tra qualche giorno.',
  };
  const annaffiature = Object.fromEntries(['acero', 'pino', 'ginepro'].map(p => [p, creaAnnaffiatura(scene, alberi.cure[p], {
    assorbita: () => { if (p === 'acero') ui.nascondiAvvisoSete(); suoni.assorbe(); },
    completata: () => {
      if (p === 'acero') ui.mostraIdratato();
      const { semi, bonusSerie } = esiti[p];
      if (semi) { ui.guadagnaSemi(semi, stato.semi - bonusSerie, p); suoni.semi(); }
      if (bonusSerie) setTimeout(() => { ui.guadagnaSemi(bonusSerie, stato.semi, p); suoni.semi(); }, 900);
      ui.toast(bonusSerie ? `${stato.serie.giorni} giorni di fila: +${bonusSerie} Semi!` : DOPO[p], 4000);
      disegna();
      if (p === 'acero') guida.evento('annaffiato');
    },
  })]));
  function annaffiaPianta(p) {
    if (scelta === 'acqua') annullaScelta();
    if (annaffiature[p].attiva) return;
    if (pannello.anteprima > 0) { ui.toast('Stai guardando un\'anteprima: chiudila o fai passare il tempo.'); return; }
    const esito = annaffia(stato, ora(), p);
    if (esito.esito === 'umido') {
      ui.toast(p === 'acero' ? 'Il terriccio è ancora umido: l\'acqua non viene assorbita. Riprova più tardi.'
        : `${IL[p]} ha ancora il terriccio umido: le conifere vogliono che si asciughi quasi del tutto. Riprova tra qualche giorno.`, 4000);
      disegna(); return;
    }
    if (esito.esito !== 'ok') return;
    esiti[p] = esito;
    salva(stato);
    annaffiature[p].avvia();
    suoni.acqua();
    disegna();
  }
  waterBtn.addEventListener('click', () => {
    if (annullaScelta()) return;
    if (Object.values(annaffiature).some(a => a.attiva)) return;
    if (pannello.anteprima > 0) { ui.toast('Stai guardando un\'anteprima: chiudila o fai passare il tempo.'); return; }
    chiudiMenu(); potatura(null); filatura(null);
    const v = vista(stato);
    const asciutte = [v.puoAnnaffiare && 'acero', v.conifere.pino.puoAnnaffiare && 'pino', v.conifere.ginepro.puoAnnaffiare && 'ginepro'].filter(Boolean);
    if (!asciutte.length) { ui.toast('Tutte le piante hanno il terriccio ancora umido. Riprova più tardi.'); return; }
    if (asciutte.length === 1) { annaffiaPianta(asciutte[0]); return; }
    // più piante da annaffiare: si sceglie toccandola (hanno l'anello azzurro)
    scegli('acqua', 'Tocca la pianta da annaffiare: quelle con l\'anello azzurro hanno il terriccio asciutto.');
  });

  pannello = creaPannelloProva({
    anteprima: () => disegna(),
    applica: (giorni) => { stato.debug.spostamento += giorni * GIORNO; aggiornaStato(); },
    azzera: () => { cancella(); stato = nuovoStato(Date.now()); aggiornaStato(); guida.avvia(); },
    guida: () => guida.avvia(),
  });

  disegna();

  // --- Guida dei primi passi e suoni ---
  const guida = creaGuida({ vista: () => vista(stato), finita: () => { stato.guida.fatta = true; salva(stato); } });
  if (!stato.guida.fatta) guida.avvia();
  const suoniBtn = document.getElementById('suoni');
  const ICONE_SUONI = { si: suoniBtn.innerHTML, no: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4Z" fill="#d9cdb6" stroke="#3b2716" stroke-width="1.8" stroke-linejoin="round"/><path d="M16 9.5l5 5M21 9.5l-5 5" stroke="#c4291c" stroke-width="2" stroke-linecap="round"/></svg>` };
  function mostraSuoni() {
    const si = suoni.suoniAttivi();
    suoniBtn.innerHTML = si ? ICONE_SUONI.si : ICONE_SUONI.no;
    suoniBtn.setAttribute('aria-pressed', si); suoniBtn.setAttribute('aria-label', si ? 'Suoni accesi' : 'Suoni spenti');
  }
  suoniBtn.addEventListener('click', () => { suoni.attivaSuoni(!suoni.suoniAttivi()); mostraSuoni(); });
  mostraSuoni();
  const musicaBtn = document.getElementById('musica');
  const ICONE_MUSICA = { si: musicaBtn.innerHTML, no: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 17V5l10-2v12" stroke="#3b2716" stroke-width="1.8" fill="none" stroke-linejoin="round"/><ellipse cx="6.5" cy="17.5" rx="3" ry="2.4" fill="#d9cdb6" stroke="#3b2716" stroke-width="1.6"/><ellipse cx="16.5" cy="15.5" rx="3" ry="2.4" fill="#d9cdb6" stroke="#3b2716" stroke-width="1.6"/><path d="M3 3l18 18" stroke="#c4291c" stroke-width="2.2" stroke-linecap="round"/></svg>` };
  function mostraMusica() {
    const si = musica.musicaAttiva();
    musicaBtn.innerHTML = si ? ICONE_MUSICA.si : ICONE_MUSICA.no;
    musicaBtn.setAttribute('aria-pressed', si); musicaBtn.setAttribute('aria-label', si ? 'Musica accesa' : 'Musica spenta');
  }
  musicaBtn.addEventListener('click', () => { musica.attivaMusica(!musica.musicaAttiva()); mostraMusica(); });
  mostraMusica();
  // un piccolo "pop" a ogni pulsante dell'interfaccia
  document.addEventListener('click', (e) => { if (e.target.closest('.tool, .mp, .vaso-b, .negozio-x, .negozio-vai, .guida-avanti, .suoni-b, .plus, .prova button')) suoni.tocco(); });

  // ritorno dopo una lunga assenza: nessun rimprovero (game-design.md, sezione 6.2)
  if (vista(stato).lungaAssenza) ui.toast('Ti stava aspettando. Un po\' d\'acqua e tornerà a crescere.', 4500);

  // l'app può restare aperta a lungo: il tempo si aggiorna ogni 30 secondi e al ritorno sull'app
  setInterval(aggiornaStato, 30000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') aggiornaStato(); else salva(stato); });
  window.addEventListener('pagehide', () => salva(stato));

  // --- Cura (sezione 6.5): dalla barra l'inventario, dalla tendina di una pianta i prodotti adatti a lei ---
  const ANTEPRIMA_CURA = 'Stai guardando un\'anteprima: chiudila o fai passare il tempo.';
  const giorniTesto = (n) => n === 1 ? 'un giorno' : `${n} giorni`;
  function premia(esito, pianta) {
    const semi = esito.semi + esito.bonusSerie;
    if (semi) { ui.guadagnaSemi(semi, stato.semi, pianta); suoni.semi(); }
  }
  // la pianta e il punto da guardare quando si spruzza
  const fuocoDi = (p) => p === 'acero' ? acero.fuoco : alberi.trees[p].radice.position.clone().add(new THREE.Vector3(0, 1.7, 0));
  cure = creaCure({
    usa(pianta, id) {
      if (pannello.anteprima > 0) { ui.toast(ANTEPRIMA_CURA); return; }
      // i terricci si usano rinvasando
      if (vista(stato).prodotti.find(p => p.id === id)?.tipo === 'terriccio') { cure.chiudi(); rinvasaPianta(pianta, id); return; }
      const esito = usaProdotto(stato, ora(), pianta, id);
      const prodotto = vista(stato).prodotti.find(p => p.id === id), nome = nomiPiante[pianta].toLowerCase();
      if (esito.esito === 'attivo') { ui.toast(`Ha già il concime: fa effetto ancora ${giorniTesto(vista(stato).cura[pianta].concime.giorni)}.`); return; }
      if (esito.esito === 'inverno') { ui.toast('D\'inverno le piante riposano: il concime lo darai in primavera.'); return; }
      if (esito.esito === 'niente') { ui.toast(`Non ci sono afidi ${SULLA[pianta]}: il sapone molle non serve. Ogni tanto guarda da vicino: all\'inizio sono minuscoli.`, 4500); return; }
      if (esito.esito === 'finito') { ui.toast(`Hai finito il ${prodotto.nome.toLowerCase()}: lo trovi nel negozio, scheda Cura.`); return; }
      if (esito.esito !== 'ok') return;
      salva(stato); cure.chiudi();
      if (prodotto.tipo === 'concime') {
        curaScene[pianta].concima(); suoni.concime(); disegna(); premia(esito, pianta);
        ui.toast(esito.bonusSerie ? `${stato.serie.giorni} giorni di fila: +${esito.bonusSerie} Semi!`
          : `Concime dato! Per una stagione ${pianta === 'acero' ? 'l\'acero crescerà di più e ' : 'la pianta '}resisterà meglio ai parassiti.`, 4000);
        return;
      }
      // trattamento: la telecamera si avvicina alla pianta, per vedere lo spray
      vola(fuocoDi(pianta), baseDist * .45); suoni.spray(); premia(esito, pianta);
      if (esito.tolti) { curaScene[pianta].spruzza(); setTimeout(disegna, 1700); } else disegna();
      ui.toast(!esito.tolti ? `Olio di neem spruzzato: per una stagione niente afidi ${SULLA[pianta]}.`
        : esito.presto ? `Scoperti prima che si notassero: che occhio! +${esito.semi} Semi`
        : esito.inTempo ? `Via gli afidi, in tempo! +${esito.semi} Semi`
        : `Via gli afidi. Con le cure ${nome === 'acero giapponese' ? 'la chioma si riprenderà' : 'si riprenderà'} in pochi giorni.`, 4000);
    },
    negozio() { negozio.apri('negozio', 'cura'); disegna(); },
  });
  // dalla barra: l'inventario dei prodotti di cura
  document.getElementById('t-care').addEventListener('click', () => { chiudiMenu(); potatura(null); filatura(null); cure.apri('inventario'); disegna(); });
  // --- Rinvaso (sezione 4.4): dalla tendina della pianta (si usa il terriccio migliore che hai, prima lo
  // specifico) o dal pannello Cura scegliendo il terriccio. Si fa tra fine inverno e inizio primavera. ---
  const DEL = { acero: "dell'acero", pino: 'del pino', ginepro: 'del ginepro' };
  const anniTesto = (n) => n === 1 ? 'un anno' : `${n} anni`;
  function rinvasaPianta(p, id = null) {
    if (pannello.anteprima > 0) { ui.toast(ANTEPRIMA_CURA); return; }
    if (rinvasoScena.attivo) return;
    const v = vista(stato);
    const terricci = v.prodotti.filter(x => x.tipo === 'terriccio' && x.piante.includes(p)).sort((a, b) => a.piante.length - b.piante.length);
    const scelto = id ?? (terricci.find(x => x.dosi > 0) ?? terricci[0]).id;
    const esito = rinvasa(stato, ora(), p, scelto);
    const nome = v.prodotti.find(x => x.id === scelto).nome;
    if (esito.esito === 'presto') { ui.toast(`Le radici ${DEL[p]} hanno ancora spazio: il prossimo rinvaso tra ${anniTesto(esito.anniMancanti)} di gioco, a fine inverno.`, 4500); return; }
    if (esito.esito === 'stagione') { ui.toast(`Il vaso è stretto, ma il momento giusto è a fine inverno, quando le gemme si gonfiano: mancano ${giorniTesto(esito.giorniAllaFinestra)}.`, 4500); return; }
    if (esito.esito === 'finito') { ui.toast('Ti serve del terriccio: Akadama' + (p === 'acero' ? '' : ' o Miscela per conifere') + ', nel negozio (scheda Cura).', 4500); return; }
    if (esito.esito !== 'ok') return;
    salva(stato); chiudiMenu(); potatura(null); filatura(null);
    vola(fuocoPianta(p), baseDist * .4);
    suoni.terra();
    rinvasoScena.rinvasa(p, () => { disegna(); suoni.fruscio(.12); });
    setTimeout(() => {
      ui.guadagnaSemi(esito.semi + esito.bonusSerie, stato.semi, p); suoni.semi();
      ui.toast(`Rinvasato con ${nome}! Radici accorciate e terriccio nuovo: il prossimo rinvaso tra ${anniTesto(esito.anni)}. +${esito.semi} Semi`, 4500);
    }, 2600);
  }

  const curaPianta = (p) => { chiudiMenu(); potatura(null); filatura(null); cure.apri('pianta', p); disegna(); };

  // --- Negozio dei vasi: il vaso comprato va subito all'acero ---
  const nomeVaso = (id) => VASI.find(x => x.id === id).nome.toLowerCase();
  negozio = creaNegozio({
    compra(id) {
      const esito = compra(stato, id);
      if (esito.esito === 'pochi') { ui.toast(`Ti mancano ${esito.mancano} Semi. Li guadagni con la sfida di ogni giorno.`); return; }
      if (esito.esito !== 'ok') return;
      salva(stato); disegna(); suoni.magia();
      negozio.chiudi();
      ui.toast(`Ecco il vaso ${nomeVaso(id)}! Per cambiarlo tocca l'acero e scegli Aspetto.`, 3500);
    },
    compraProdotto(id) {
      const esito = compraProdotto(stato, id);
      if (esito.esito === 'pochi') { ui.toast(`Ti mancano ${esito.mancano} Semi. Li guadagni con la sfida di ogni giorno.`); return; }
      if (esito.esito !== 'ok') return;
      salva(stato); disegna(); suoni.semi();
      const p = vista(stato).prodotti.find(x => x.id === id);
      ui.toast(`${p.nome}: ${p.dosi} dosi nell\'inventario. Per usarlo tocca una pianta e scegli Cura.`, 3500);
    },
    usa(id) {
      if (!scegliVaso(stato, id)) return;
      salva(stato); disegna(); suoni.magia();
      negozio.chiudi();
    },
  });
  const apriNegozio = () => { chiudiMenu(); negozio.apri('negozio'); disegna(); };
  document.getElementById('t-shop').addEventListener('click', apriNegozio);
  document.getElementById('plus').addEventListener('click', apriNegozio);

  // --- Tendine delle piante: si aprono toccando la pianta. L'acero ha Acqua, Pota, Filo, Cura e Aspetto;
  // pino e ginepro Acqua, Pota, Filo e Cura ---
  const menuAcero = document.getElementById('menu-acero');
  const menuPiante = { acero: menuAcero, pino: document.getElementById('menu-pino'), ginepro: document.getElementById('menu-ginepro') };
  function chiudiMenu() {
    for (const m of Object.values(menuPiante)) { m.hidden = true; m.parentElement.classList.remove('aperta'); }
    screenEl.classList.remove('menu-aperto');
  }
  // la tendina aperta passa sopra al banner della sfida, che si fa da parte
  function apriMenu(m) { m.hidden = false; m.parentElement.classList.add('aperta'); screenEl.classList.add('menu-aperto'); }
  for (const p of ['pino', 'ginepro']) menuPiante[p].addEventListener('click', (e) => {
    const a = e.target.closest('button')?.dataset.a; if (!a) return;
    chiudiMenu();
    if (a === 'acqua') annaffiaPianta(p);
    else if (a === 'pota') potatura(p);
    else if (a === 'filo') filatura(p);
    else if (a === 'rinvasa') rinvasaPianta(p);
    else curaPianta(p);
  });
  menuAcero.addEventListener('click', (e) => {
    const a = e.target.closest('button')?.dataset.a; if (!a) return;
    chiudiMenu();
    if (a === 'acqua') annaffiaPianta('acero');
    else if (a === 'pota') potatura('acero');
    else if (a === 'filo') filatura('acero');
    else if (a === 'aspetto') { negozio.apri('aspetto'); disegna(); }
    else if (a === 'cura') curaPianta('acero');
    else if (a === 'rinvasa') rinvasaPianta('acero');
  });
  const nomiPiante = { acero: 'Acero giapponese', pino: 'Pino nero', ginepro: 'Ginepro' };

  // --- Potatura e filo su tutte le piante (sezioni 4.2 e 4.3). Pota e Filo avvicinano la telecamera
  // alla pianta scelta: dalla sua tendina, oppure dalla barra (se più piante ne hanno bisogno, si tocca
  // quella giusta). Ogni specie ha la sua tecnica: germogli dell'acero, candele e aghi vecchi del pino,
  // punte del ginepro da pizzicare. ---
  const pruneBtn = document.getElementById('t-prune');
  const wireBtn = document.getElementById('t-wire');
  const volo = { t: 1, daT: new THREE.Vector3(), aT: new THREE.Vector3(), daD: 0, aD: 0 };
  const centro = target.clone();
  let distanzaPrima = baseDist;
  // sposta con dolcezza il punto guardato e la distanza, lasciando l'angolo scelto dal giocatore
  function vola(versoT, dist) {
    volo.t = 0; volo.daT.copy(controls.target); volo.aT.copy(versoT);
    volo.daD = camera.position.distanceTo(controls.target); volo.aD = dist;
  }
  const fuocoPianta = (p) => p === 'acero' ? acero.fuoco : alberi.cure[p].fuoco;
  const filoDi = (p) => p === 'acero' ? acero.filo : alberi.cure[p].filo;
  const ramiDi = (v, p) => p === 'acero' ? v.rami : v.conifere[p].rami;
  const potabile = (v, p) => p === 'acero' ? v.puoPotare : v.conifere[p].puoPotare;
  const daSlegare = (v, p) => p === 'acero' ? v.filoDaTogliere : v.conifere[p].filoDaTogliere;
  function avvicina(p, dist) {
    if (!potando && !filando) distanzaPrima = camera.position.distanceTo(controls.target);
    controls.minDistance = baseDist * .2;
    vola(fuocoPianta(p), baseDist * dist);
  }
  function allontana() {
    vola(centro, Math.max(distanzaPrima, baseDist * .45));
    controls.minDistance = baseDist * .45;
  }
  // il primo passo dopo Pota, per ogni specie e momento dell'anno
  function consiglioPota(p) {
    const v = vista(stato);
    if (p === 'acero') return v.puoPotare ? 'Tocca un germoglio che brilla per tagliarlo. Tocca Pota per finire.' : 'Per ora l\'acero non ha niente da potare: ogni giorno spunta un germoglio nuovo.';
    const c = v.conifere[p];
    if (p === 'pino') return c.vecchi.length ? 'Togli gli aghi vecchi: tocca i ciuffi gialli che brillano.'
      : c.germogli.some(g => g.potabile) ? 'Cima le candele: tocca quelle chiare che brillano, in punta ai rami.'
      : 'Il pino mette le candele in primavera; in autunno si tolgono gli aghi vecchi. Per ora non c\'è niente da fare.';
    return c.germogli.some(g => g.potabile) ? 'Pizzica le punte nuove che brillano: con le dita, non con le forbici, così le squame non imbruniscono.'
      : 'Il ginepro mette punte nuove in primavera ed estate. Per ora non c\'è niente da pizzicare.';
  }
  // p: pianta da potare, oppure null per finire
  function potatura(p) {
    if (p === potando) return;
    if (p) filatura(null);
    if (p && !potando && !filando) distanzaPrima = camera.position.distanceTo(controls.target);
    potando = p;
    for (const q in germogliScene) germogliScene[q].potatura = q === p;
    aghiVecchi.potatura = p === 'pino';
    if (p) chiudiMenu();
    pruneBtn.classList.toggle('attivo', !!p);
    if (p) { avvicina(p, p === 'acero' ? .27 : .3); ui.toast(consiglioPota(p), 4000); } else allontana();
  }

  // --- Filo: un pallino di rame sulla punta di ogni ramo; trascinandolo su o giù il ramo si piega e il filo
  // si avvolge; quando il ramo ha preso la forma il pallino diventa verde: toccandolo si toglie il filo ---
  function filatura(p) {
    if (p === filando) return;
    if (p) potatura(null);
    if (p && !potando && !filando) distanzaPrima = camera.position.distanceTo(controls.target);
    for (const q of ['acero', 'pino', 'ginepro']) filoDi(q).maniglie = q === p;
    filando = p;
    if (p) chiudiMenu();
    wireBtn.classList.toggle('attivo', !!p);
    if (p) {
      avvicina(p, p === 'acero' ? .36 : .32);
      const conifera = p !== 'acero' ? ' Il legno delle conifere è duro: il filo ci mette di più a fare presa.' : '';
      ui.toast(daSlegare(vista(stato), p) ? 'Un ramo ha preso la forma: tocca il pallino verde per togliere il filo.'
        : 'Trascina un pallino di rame su o giù per piegare il ramo. Tocca Filo per finire.' + conifera, 4200);
    } else allontana();
  }

  // Pota, Filo (e Acqua) dalla barra: se più piante ne hanno bisogno si sceglie toccandola
  const bottoni = { acqua: waterBtn, pota: pruneBtn, filo: wireBtn };
  function scegli(azione, testo) {
    scelta = azione; bottoni[azione].classList.add('attivo'); disegna();
    ui.toast(testo, 4000);
  }
  function annullaScelta() { if (!scelta) return false; bottoni[scelta].classList.remove('attivo'); scelta = null; disegna(); return true; }
  pruneBtn.addEventListener('click', () => {
    if (potando) { potatura(null); return; }
    if (annullaScelta()) return;
    if (pannello.anteprima > 0) { ui.toast(ANTEPRIMA); return; }
    const v = vista(stato), pronte = ['acero', 'pino', 'ginepro'].filter(p => potabile(v, p));
    if (pronte.length === 0) { ui.toast('Per ora non c\'è niente da potare. Ogni giorno l\'acero mette un germoglio; il pino ha le candele in primavera e gli aghi vecchi in autunno; il ginepro le punte in primavera ed estate.', 5000); return; }
    if (pronte.length === 1) { potatura(pronte[0]); return; }
    chiudiMenu(); scegli('pota', 'Tocca la pianta da potare: hanno tutte qualcosa da sistemare.');
  });
  wireBtn.addEventListener('click', () => {
    if (filando) { filatura(null); return; }
    if (annullaScelta()) return;
    if (pannello.anteprima > 0) { ui.toast(ANTEPRIMA); return; }
    const v = vista(stato), pronte = ['acero', 'pino', 'ginepro'].filter(p => daSlegare(v, p));
    if (pronte.length === 1) { filatura(pronte[0]); return; }
    chiudiMenu(); scegli('filo', 'Tocca la pianta su cui lavorare con il filo.');
  });

  const raycaster = new THREE.Raycaster(), puntatore = new THREE.Vector2();
  function punta(e) {
    const r = canvas.getBoundingClientRect();
    puntatore.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    raycaster.setFromCamera(puntatore, camera);
  }
  const giorni = (n) => n === 1 ? 'un giorno' : `${n} giorni`;
  // trascinamento di un pallino: si ascolta prima della telecamera, così il dito piega il ramo invece di ruotare la scena
  let tiro = null, ultimoTocco = { ramo: -1, t: 0 };
  screenEl.addEventListener('pointerdown', (e) => {
    if (!filando || e.target !== canvas || tiro) return;
    punta(e);
    const i = filoDi(filando).tocca(raycaster);
    if (i === null) return;
    e.stopPropagation();
    controls.enabled = false;
    const piega = ramiDi(vista(stato), filando)[i].piega;
    tiro = { i, p: filando, id: e.pointerId, y: e.clientY, piega, ora: piega, mosso: false };
  }, true);
  window.addEventListener('pointermove', (e) => {
    if (!tiro || e.pointerId !== tiro.id) return;
    const dy = tiro.y - e.clientY;
    if (Math.abs(dy) > 8) tiro.mosso = true;
    if (!tiro.mosso) return;
    // un quarto dello schermo in verticale = tutta la piega possibile in un verso
    tiro.ora = Math.max(-1, Math.min(1, tiro.piega + dy / (canvas.clientHeight * .25)));
    filoDi(tiro.p).anteprima(tiro.i, tiro.ora);
  });
  const fineTiro = (e) => {
    if (!tiro || e.pointerId !== tiro.id) return;
    const { i, p, mosso, ora: piega } = tiro; tiro = null;
    controls.enabled = true;
    filoDi(p).anteprima(i, null);
    if (e.type === 'pointercancel') return;
    if (pannello.anteprima > 0) { ui.toast(ANTEPRIMA); return; }
    if (mosso) legaRamo(p, i, piega); else toccaRamo(p, i);
  };
  window.addEventListener('pointerup', fineTiro);
  window.addEventListener('pointercancel', fineTiro);

  function legaRamo(p, i, piega) {
    const esito = mettiFilo(stato, ora(), i, piega, p);
    if (esito.esito !== 'ok') return;
    salva(stato); disegna();
    filoDi(p).avvolgi(i); suoni.filo();
    const r = ramiDi(vista(stato), p)[i];
    if (esito.semi + esito.bonusSerie) { ui.guadagnaSemi(esito.semi + esito.bonusSerie, stato.semi, p); suoni.semi(); }
    ui.toast(esito.bonusSerie ? `${stato.serie.giorni} giorni di fila: +${esito.bonusSerie} Semi!`
      : r.giorniAllaPresa ? `Filo avvolto! Crescendo, il ramo prenderà questa forma in circa ${giorni(r.giorniAllaPresa)}.`
      : 'Filo avvolto! Il ramo crescerà di nuovo quando la pianta starà meglio: intanto il filo lo tiene.', 3800);
  }
  function toccaRamo(p, i) {
    const r = ramiDi(vista(stato), p)[i];
    if (!r.filo) { ui.toast('Trascina il pallino su o giù per piegare il ramo.'); return; }
    // toglierlo in anticipo chiede un secondo tocco: il ramo torna in parte indietro
    const chiave = p + i;
    const secondo = ultimoTocco.ramo === chiave && performance.now() - ultimoTocco.t < 3500;
    ultimoTocco = { ramo: chiave, t: performance.now() };
    if (!r.pronto && !secondo) {
      ui.toast(r.giorniAllaPresa ? `Il ramo sta prendendo la forma: ancora circa ${giorni(r.giorniAllaPresa)}. Tocca di nuovo per togliere il filo adesso.`
        : 'Il ramo cresce solo quando la pianta sta bene. Tocca di nuovo per togliere il filo adesso.', 4000);
      return;
    }
    ultimoTocco.ramo = -1;
    const esito = togliFilo(stato, ora(), i, p);
    if (esito.esito !== 'ok') return;
    salva(stato); disegna(); suoni.slega();
    if (esito.semi + esito.bonusSerie) { ui.guadagnaSemi(esito.semi + esito.bonusSerie, stato.semi, p); suoni.semi(); }
    ui.toast(esito.presa >= 1
      ? (esito.semi ? `Filo tolto al momento giusto: il ramo resta così. +${esito.semi} Semi!` : 'Filo tolto: il ramo resta così. La corteccia è un po\' segnata, ma col tempo il segno sparirà.')
      : 'Filo tolto prima del tempo: il ramo torna un po\' indietro.', 4000);
  }

  // potatura vera e propria: un tocco su un germoglio, una candela, una punta o un ciuffo di aghi vecchi
  const DOPO_TAGLIO = {
    pino: 'Candela cimata: gli aghi nuovi resteranno corti e la chioma compatta.',
    ginepro: 'Punta pizzicata: il ginepro resterà fitto e compatto.',
  };
  function potaQui(e, r) {
    const p = potando;
    if (pannello.anteprima > 0) { ui.toast(ANTEPRIMA); return; }
    // aghi vecchi del pino
    const vecchio = p === 'pino' ? aghiVecchi.tocca(raycaster) : null;
    if (vecchio !== null) {
      const esito = togliAghi(stato, ora(), vecchio);
      if (esito.esito !== 'ok') return;
      aghiVecchi.togli(vecchio); suoni.fruscio(.16);
      salva(stato); disegna();
      if (esito.semi + esito.bonusSerie) { ui.guadagnaSemi(esito.semi + esito.bonusSerie, stato.semi, p); suoni.semi(); }
      ui.toast(esito.bonusSerie ? `${stato.serie.giorni} giorni di fila: +${esito.bonusSerie} Semi!` : 'Aghi vecchi tolti: luce e aria arrivano dentro la chioma.');
    } else {
      const id = germogliScene[p].tocca(raycaster);
      if (id === null) return;
      const esito = pota(stato, ora(), id, p);
      if (esito.esito === 'piccolo') { ui.toast('È ancora troppo piccolo: lascialo crescere un po\'.'); return; }
      if (esito.esito !== 'ok') return;
      germogliScene[p].taglia(id);
      // il ginepro si pizzica con le dita: niente forbici
      if (p === 'ginepro') suoni.fruscio(.18);
      else { ui.forbici(e.clientX - r.left, e.clientY - r.top); suoni.forbici(); setTimeout(() => suoni.fruscio(), 350); }
      if (p === 'acero') guida.evento('potato');
      salva(stato); disegna();
      if (esito.semi + esito.bonusSerie) { ui.guadagnaSemi(esito.semi + esito.bonusSerie, stato.semi, p); suoni.semi(); }
      ui.toast(esito.bonusSerie ? `${stato.serie.giorni} giorni di fila: +${esito.bonusSerie} Semi!`
        : p !== 'acero' ? DOPO_TAGLIO[p]
        : esito.gemme ? 'Taglio pulito! Sotto il taglio spunteranno due gemme.' : 'Taglio pulito. Questa punta è già bella fitta.');
    }
    // finito il lavoro su questa pianta, la telecamera torna indietro da sola
    if (!potabile(vista(stato), p)) setTimeout(() => { if (potando === p) potatura(null); }, 1600);
  }

  // un tocco è breve e quasi fermo: così non si confonde con la rotazione della scena
  const dita = new Map();
  canvas.addEventListener('pointerdown', e => dita.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now(), multi: dita.size > 0 }));
  canvas.addEventListener('pointercancel', e => dita.delete(e.pointerId));
  canvas.addEventListener('pointerup', e => {
    const d = dita.get(e.pointerId); dita.delete(e.pointerId);
    if (!d || d.multi || dita.size || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 10 || performance.now() - d.t > 450) return;
    const r = canvas.getBoundingClientRect();
    punta(e);
    if (potando) { potaQui(e, r); return; }
    if (filando) return;
    const quale = alberi.tocca(raycaster);
    // dopo Acqua, Pota o Filo nella barra, il tocco sceglie la pianta
    if (scelta) {
      if (!quale) return;
      const azione = scelta; annullaScelta();
      if (azione === 'acqua') annaffiaPianta(quale);
      else if (azione === 'pota') potatura(quale);
      else filatura(quale);
      return;
    }
    // un tocco su una pianta apre la sua tendina
    const m = menuPiante[quale];
    const apri = m && m.hidden;
    chiudiMenu();
    if (apri) { apriMenu(m); suoni.fruscio(.1); }
  });

  let clock = 0, last = performance.now();
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now; clock += dt;
    if (volo.t < 1) {
      volo.t = Math.min(1, volo.t + dt / .8);
      const k = volo.t * volo.t * (3 - 2 * volo.t), dir = camera.position.clone().sub(controls.target).normalize();
      controls.target.lerpVectors(volo.daT, volo.aT, k);
      camera.position.copy(controls.target).addScaledVector(dir, volo.daD + (volo.aD - volo.daD) * k);
    }
    controls.update();
    alberi.aggiorna(clock);
    for (const p in germogliScene) germogliScene[p].aggiorna(dt, clock);
    aghiVecchi.aggiorna(dt, clock);
    for (const p in curaScene) curaScene[p].aggiorna(dt);
    rinvasoScena.aggiorna(dt);
    giardino.aggiorna(dt, clock);
    if (!reduce) nuvole.aggiorna(dt);
    for (const p in annaffiature) annaffiature[p].aggiorna(dt);
    renderer.render(scene, camera);
    ui.aggiornaEtichette();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
