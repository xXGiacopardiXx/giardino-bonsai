// Test del quaderno del maestro (game-design.md, sezione 7.6): si lanciano con  npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GIORNO, ORA } from './tempo.js';
import { nuovoStato as nuovoStatoVero, avanza, annaffia, pota, mettiFilo, usaProdotto, compraProdotto, compraPianta, leggiPagina, migra, vista, MALATTIE, PIANTE, VERSIONE } from './stato.js';
import { STILI } from './stili.js';
import { PAGINE, paginaDi, MESI } from './quaderno.js';

const T0 = new Date(2026, 9, 26, 12).getTime();
const nuovoStato = (t) => { const s = nuovoStatoVero(t); s.meteo.attivo = false; return s; };

test('ogni pagina del quaderno è completa', () => {
  const ids = new Set();
  for (const p of PAGINE) {
    assert.ok(!ids.has(p.id), 'pagina doppia: ' + p.id); ids.add(p.id);
    assert.ok(p.titolo && p.apre && p.disegno, p.id);
    if (p.parte === 'tecniche') {
      assert.ok(p.cos && p.perche && p.errore && p.gioco, p.id);
      assert.ok(p.come.length >= 3 && p.quando.length >= 1, p.id);
    } else {
      assert.ok(p.carattere && p.acqua && p.luce && p.teme, p.id);
      for (const r of p.calendario) assert.ok(r.cosa && r.mesi.length && r.mesi.every(m => m >= 1 && m <= 12), p.id + ' ' + r.cosa);
    }
  }
  assert.equal(MESI.length, 12);
});

test('il quaderno ha una pagina per ogni pianta, malattia e stile del gioco', () => {
  for (const p of Object.keys(PIANTE)) {
    assert.ok(paginaDi('pianta-' + p), 'pianta ' + p);
    assert.ok(paginaDi(MALATTIE[p].id), 'malattia di ' + p);
    for (const s of STILI[p]) assert.ok(paginaDi('stile-' + s.id), 'stile ' + s.id);
  }
});

test('una pagina si apre quando la tecnica si incontra, resta e smette di essere nuova quando si legge', () => {
  const s = nuovoStato(T0);
  avanza(s, T0 + ORA);
  // le piante del giardino e gli stili aperti si vedono subito
  assert.ok(vista(s).quaderno.pagine.includes('pianta-acero'));
  assert.ok(vista(s).quaderno.pagine.includes('stile-moyogi'));
  assert.ok(!vista(s).quaderno.pagine.includes('pianta-azalea'));
  assert.ok(!vista(s).quaderno.pagine.includes('stile-bunjingi'), 'il Bunjingi si apre dal secondo anno');
  assert.ok(!vista(s).quaderno.pagine.includes('acqua'));
  annaffia(s, T0 + ORA);
  assert.ok(vista(s).quaderno.pagine.includes('acqua'));
  assert.ok(vista(s).quaderno.nuove.includes('acqua'));
  leggiPagina(s, 'acqua');
  assert.ok(!vista(s).quaderno.nuove.includes('acqua'));
  annaffia(s, T0 + 3 * GIORNO, 'acero');
  assert.ok(!vista(s).quaderno.nuove.includes('acqua'), 'una pagina letta non torna nuova');
  assert.equal(vista(s).quaderno.pagine.filter(x => x === 'acqua').length, 1);
});

test('la potatura apre la pagina giusta per ogni specie, e così filo e concime', () => {
  const s = nuovoStato(T0);
  pota(s, T0 + ORA, s.albero.germogli[0].id);
  s.conifere.pino.germogli = [{ id: 50, punta: 0, lunghezza: 1 }];
  pota(s, T0 + ORA, 50, 'pino');
  mettiFilo(s, T0 + ORA, 0, -.5);
  usaProdotto(s, T0 + ORA, 'acero', 'concime-universale');
  const q = vista(s).quaderno.pagine;
  for (const id of ['potatura', 'candele', 'filo', 'concime']) assert.ok(q.includes(id), id);
  assert.ok(!q.includes('pizzicatura'));
});

test('afidi e malattie aprono la loro pagina quando si notano, e un terriccio comprato apre quella dei terricci', () => {
  const s = nuovoStato(T0); s.semi = 2000;
  s.conifere.ginepro.malattia = { id: 'ruggine-ginepro', posto: 0, da: T0 };
  avanza(s, T0 + 12 * ORA);
  assert.ok(!vista(s).quaderno.pagine.includes('ruggine-ginepro'), 'ancora nascosta');
  avanza(s, T0 + 25 * ORA);
  assert.ok(vista(s).quaderno.pagine.includes('ruggine-ginepro'));
  compraProdotto(s, 'kanuma');
  assert.ok(vista(s).quaderno.pagine.includes('terricci'));
  compraPianta(s, T0 + 26 * ORA, 'azalea');
  avanza(s, T0 + 27 * ORA);
  assert.ok(vista(s).quaderno.pagine.includes('pianta-azalea'));
});

test('un salvataggio della versione 29 riceve il quaderno con le pagine di quello che ha già fatto', () => {
  const vecchio = nuovoStato(T0);
  annaffia(vecchio, T0);
  vecchio.versione = 29; delete vecchio.quaderno;
  const s = migra(vecchio);
  assert.equal(s.versione, VERSIONE);
  assert.ok(s.quaderno.pagine.includes('acqua'));
  assert.ok(!s.quaderno.pagine.includes('filo'));
});
