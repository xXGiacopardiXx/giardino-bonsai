// Interfaccia sopra la scena 3D: etichette delle piante, messaggi, Semi, serie, stagione, sfida del giorno.
import * as THREE from 'three';
import * as suoni from './suoni.js';

const $ = (id) => document.getElementById(id);
const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

// colore della fase sull'etichetta: sete (azzurro), stress (arancio), grave (rosso), troppa acqua (blu)
const livello = (c) => c.marciume ? 'grave' : c.ristagno > 0 ? 'troppa'
  : c.fase === 0 ? 'bene' : c.fase === 1 ? 'sete' : c.fase < 4 ? 'stress' : 'grave';
const livelloAcqua = (c) => c.ristagno > 0 ? 'troppa' : c.acqua > .6 ? 'bene' : c.acqua > .3 ? 'poca' : 'pochissima';

export function creaInterfaccia(screenEl, camera, trees) {
  const tagEls = { acero: $('tag-acero'), ginepro: $('tag-ginepro'), pino: $('tag-pino'), azalea: $('tag-azalea') };
  const pv = new THREE.Vector3();
  const toScreen = (v) => { pv.copy(v).project(camera); return [(pv.x + 1) / 2 * screenEl.clientWidth, (1 - pv.y) / 2 * screenEl.clientHeight, pv.z]; };

  const hint = $('hint');
  const hideHint = () => hint.classList.add('gone');
  $('c').addEventListener('pointerdown', hideHint, { once: true });
  setTimeout(hideHint, 6000);

  const toastEl = $('toast');
  let toastT;
  function toast(msg, durata = 2800) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), durata);
  }

  // domanda con due risposte: risolve true per "si", false per "no" (o se non si risponde)
  const domandaEl = $('domanda');
  let rispondi = null;
  domandaEl.addEventListener('click', (e) => {
    const a = e.target.closest('button')?.dataset.a; if (!a) return;
    domandaEl.hidden = true; const r = rispondi; rispondi = null; r?.(a === 'si');
  });
  function chiedi(testo, si, no) {
    rispondi?.(false);
    toastEl.classList.remove('show');
    $('domanda-testo').textContent = testo;
    domandaEl.querySelector('[data-a="si"]').textContent = si;
    domandaEl.querySelector('[data-a="no"]').textContent = no;
    domandaEl.hidden = false;
    return new Promise(r => { rispondi = r; });
  }
  function chiudiDomanda() { if (domandaEl.hidden) return; domandaEl.hidden = true; const r = rispondi; rispondi = null; r?.(false); }

  function floatText(txt, x, y) {
    const f = document.createElement('div'); f.className = 'float'; f.textContent = txt;
    f.style.left = x + 'px'; f.style.top = y + 'px';
    screenEl.appendChild(f); setTimeout(() => f.remove(), 1500);
  }

  const seedsEl = $('seeds');
  let semiMostrati = null, semiAnimati = false;
  // i Semi guadagnati salgono dalla pianta al contatore, che cresce a poco a poco
  function guadagnaSemi(n, totale, daPianta) {
    const [x, y] = toScreen(trees[daPianta].tag); semiDa(n, totale, x, y - 20);
  }
  // ...o da un punto dello schermo (x, y), per esempio dal banner di una sfida
  function semiDa(n, totale, x, y) {
    floatText('+' + n, x, y);
    const r = seedsEl.getBoundingClientRect(), s = screenEl.getBoundingClientRect();
    setTimeout(() => floatText('+' + n, r.left - s.left + r.width / 2, r.top - s.top + r.height + 8), 300);
    const from = semiMostrati ?? totale - n, t0 = performance.now();
    semiAnimati = true;
    (function tick(now) {
      const k = Math.min(1, (now - t0) / 700);
      semiMostrati = Math.round(from + (totale - from) * k); seedsEl.textContent = fmt(semiMostrati);
      if (k < 1) requestAnimationFrame(tick); else semiAnimati = false;
    })(t0);
  }

  const settimanaEl = $('settimana'), questEl = $('quest'), settEl = $('quest-sett'), riposoEl = $('riposo');
  let primoAggiornamento = true, sfidaChiusa = false, ultima = null;
  for (const el of [questEl, settEl]) el.addEventListener('animationend', () => {
    if (!el.classList.contains('via')) return;
    el.style.display = 'none';
    // uscito il banner del giorno, al suo posto arriva quello della settimana
    if (el === questEl && ultima) mostraSettimana(ultima);
  });
  // Sfida della settimana (sezione 7.1): sta al posto di quella del giorno quando quella è fatta, così il
  // giardino resta libero. Avanza a poco a poco; completata, i Semi partono dal banner, che poi esce.
  let settFatta = null, settAnimata = false;
  function mostraSettimana(v) {
    const w = v.settimana;
    if (!w) { settEl.style.display = 'none'; return; }
    $('qs-testo').textContent = w.testo;
    $('qs-premio').textContent = '+' + w.premio;
    $('qs-fill').style.width = Math.round(Math.min(1, w.fatti / w.obiettivo) * 100) + '%';
    const resto = w.giorniRimasti === 1 ? 'ultimo giorno' : `ancora ${w.giorniRimasti} giorni`;
    $('qs-txt').textContent = `${Math.min(w.fatti, w.obiettivo)}/${w.obiettivo} · ${resto}`;
    const libero = questEl.style.display === 'none';
    if (!w.fatta) {
      settFatta = null; settAnimata = false;
      settEl.classList.remove('done', 'via');
      settEl.style.display = libero ? '' : 'none';
      return;
    }
    // completata: se lo era già all'apertura non si mostra; se è appena successo, festa appena c'è posto
    if (settFatta === null) settFatta = primoAggiornamento ? 'vecchia' : 'nuova';
    if (settFatta === 'vecchia') { settEl.style.display = 'none'; return; }
    if (settAnimata || !libero) return;
    settAnimata = true;
    settEl.style.display = ''; settEl.classList.add('done');
    setTimeout(() => {
      const r = settEl.getBoundingClientRect(), s = screenEl.getBoundingClientRect();
      semiDa(w.premio, ultima.semi, r.left - s.left + r.width * .8, r.top - s.top);
      suoni.magia();
    }, 700);
    setTimeout(() => settEl.classList.add('via'), 2400);
  }
  // un tocco sulla serie spiega come funziona, col giorno di riposo (sezione 7.2)
  $('serie').parentElement.addEventListener('click', () => {
    if (!ultima) return;
    toast(ultima.riposi ? `${ultima.serie} giorni di fila. Hai un giorno di riposo: se salti un giorno, la serie resta com'è.`
      : `${ultima.serie} giorni di fila. Ogni 7 giorni arriva un giorno di riposo, che salva la serie se salti un giorno.`, 4500);
  });
  // col bastoncino di bambù l'etichetta dice fra quanto annaffiare (giorni con decimali)
  const fraQuanto = (g) => g * 24 < 20 ? `Acqua fra ${Math.max(1, Math.round(g * 24))} ${Math.round(g * 24) <= 1 ? 'ora' : 'ore'}`
    : Math.round(g) <= 1 ? 'Acqua domani' : `Acqua fra ${Math.round(g)} giorni`;
  const conBastoncino = (el, c, giorni) => {
    if (giorni > 0 && c.fase === 0 && !c.ristagno && !c.parassiti?.visibili) { el.textContent = fraQuanto(giorni); el.dataset.livello = 'bene'; }
  };
  return {
    toast,
    chiedi,
    chiudiDomanda,
    guadagnaSemi,
    // ridisegna l'interfaccia a partire dalla vista calcolata dal motore (gioco/stato.js)
    aggiorna(v, { annaffiando = false } = {}) {
      $('stagione').textContent = v.nomeStagione;
      settimanaEl.setAttribute('aria-label', `Giorno ${v.giornoStagione} di 7`);
      [...settimanaEl.children].forEach((el, i) => { el.className = i + 1 < v.giornoStagione ? 'on' : i + 1 === v.giornoStagione ? 'now' : ''; });
      // durante l'annaffiatura il contatore aspetta l'animazione dei Semi guadagnati
      if (!semiAnimati && !annaffiando) { semiMostrati = v.semi; seedsEl.textContent = fmt(v.semi); }
      $('serie').textContent = v.serie;
      ultima = v;
      // giorno di riposo pronto: la luna accanto alla serie (saltella il giorno che arriva)
      riposoEl.hidden = !v.riposi;
      riposoEl.classList.toggle('nuovo', !!v.riposoNuovo);

      // la sfida del giorno cambia: acqua, potatura o filo (gioco/stato.js, SFIDE)
      if (v.sfida) questEl.querySelector('.qd').textContent = v.sfida.testo;
      // sfida completata: la barra si riempie, la scritta si cancella e il banner esce di scena
      if (!v.sfida?.fatta) {
        sfidaChiusa = false;
        questEl.classList.remove('done', 'via');
        questEl.style.display = v.sfida ? '' : 'none';
        $('qfill').style.width = '0'; $('qtxt').textContent = '0/1';
      } else if (!sfidaChiusa) {
        sfidaChiusa = true;
        if (primoAggiornamento) questEl.style.display = 'none';
        else {
          questEl.classList.add('done');
          $('qfill').style.width = '100%'; $('qtxt').textContent = '1/1';
          setTimeout(() => { if (sfidaChiusa) questEl.classList.add('via'); }, 1800);
        }
      }
      mostraSettimana(v);
      primoAggiornamento = false;

      const salute = Math.round(v.salute * 100) + '%';
      // fase scritta col colore della gravità; acqua e chioma su due barre separate
      $('acero-fase').textContent = v.nomeFase;
      $('acero-fase').dataset.livello = livello(v);
      // gli afidi evidenti si segnalano sull'etichetta (quelli appena arrivati si scoprono solo da vicino)
      if (v.parassiti?.visibili && v.fase < 4) { $('acero-fase').textContent = 'Ha gli afidi'; $('acero-fase').dataset.livello = 'stress'; }
      if (v.bastoncino) conBastoncino($('acero-fase'), v, v.bastoncino.acero);
      $('acero-salute').textContent = salute;
      $('acero-barra').style.width = salute;
      $('acero-acqua').style.width = Math.round(v.acqua * 100) + '%';
      $('acero-acqua').parentElement.dataset.livello = livelloAcqua(v);
      // pino, ginepro e azalea (se c'è): fase della sete e acqua nel terriccio, come l'acero
      tagEls.azalea.hidden = !v.conifere.azalea;
      for (const p of Object.keys(v.conifere)) {
        const c = v.conifere[p];
        $(p + '-fase').textContent = c.nomeFase;
        $(p + '-fase').dataset.livello = livello(c);
        if (v.bastoncino) conBastoncino($(p + '-fase'), { ...c, parassiti: v.cura[p]?.parassiti }, v.bastoncino[p]);
        $(p + '-acqua').style.width = Math.round(c.acqua * 100) + '%';
        $(p + '-acqua').parentElement.dataset.livello = livelloAcqua(c);
        // chioma: come quella dell'acero, con la percentuale
        $(p + '-barra').style.width = $(p + '-salute').textContent = Math.round(c.salute * 100) + '%';
      }
      if (!annaffiando) {
        $('alert').classList.toggle('hide', !v.haSete);
        $('alert').style.display = v.haSete ? '' : 'none';
        $('ok').classList.toggle('show', !v.haSete && v.annaffiatoOggi);
        // Acqua chiede attenzione se ha sete una pianta qualunque
        $('t-water').classList.toggle('needs', v.haSete || Object.values(v.conifere).some(c => c.haSete));
      }
      // Pota chiede attenzione solo se oggi non c'è ancora stata un'azione di cura e la pianta non ha sete
      $('t-prune').classList.toggle('needs', v.puoPotare && !v.curatoOggi && !v.haSete);
    },
    // forbici che si chiudono nel punto toccato
    forbici(x, y) {
      const f = document.createElement('div'); f.className = 'snip';
      f.innerHTML = $('t-prune').querySelector('svg').outerHTML;
      f.style.left = x + 'px'; f.style.top = y + 'px';
      screenEl.appendChild(f); setTimeout(() => f.remove(), 700);
    },
    nascondiAvvisoSete() { $('alert').classList.add('hide'); },
    mostraIdratato() { $('alert').style.display = 'none'; $('ok').classList.add('show'); },
    // le etichette seguono le piante quando si ruota la scena
    aggiornaEtichette() {
      for (const k in tagEls) {
        if (tagEls[k].hidden) continue;
        const [x, y, z] = toScreen(trees[k].tag), el = tagEls[k];
        const hw2 = el.offsetWidth / 2 + 8, cx = Math.min(screenEl.clientWidth - hw2, Math.max(hw2, x));
        el.style.visibility = z > 1 ? 'hidden' : 'visible';
        el.style.transform = `translate(${cx.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-100%)`;
      }
    },
  };
}
