// Test del motore: si lanciano con  npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GIORNO, ORA, calendario } from './tempo.js';
import { nuovoStato, avanza, annaffia, vista, SEMI } from './stato.js';

// mezzogiorno locale, così i giorni del calendario non dipendono dal fuso orario
const T0 = new Date(2026, 9, 26, 12).getTime();
const dopo = (giorni) => T0 + giorni * GIORNO;

test('il calendario: una settimana per stagione, quattro settimane per anno', () => {
  assert.deepEqual(calendario(T0, T0), { anno: 1, stagione: 0, giornoStagione: 1 });
  assert.deepEqual(calendario(T0, dopo(7.5)), { anno: 1, stagione: 1, giornoStagione: 1 });
  assert.deepEqual(calendario(T0, dopo(27.9)), { anno: 1, stagione: 3, giornoStagione: 7 });
  assert.deepEqual(calendario(T0, dopo(28)), { anno: 2, stagione: 0, giornoStagione: 1 });
});

test('una partita nuova parte con la pianta assetata e si può annaffiare', () => {
  const s = nuovoStato(T0);
  const v = vista(s);
  assert.equal(v.haSete, true);
  assert.equal(v.semi, SEMI.iniziali);
  const r = annaffia(s, T0 + ORA);
  assert.equal(r.esito, 'ok');
  assert.equal(r.semi, SEMI.acqua);
  assert.equal(s.semi, SEMI.iniziali + SEMI.acqua);
  assert.equal(vista(s).haSete, false);
  assert.equal(s.serie.giorni, 1);
});

test('con il terriccio ancora umido l\'acqua non viene assorbita', () => {
  const s = nuovoStato(T0);
  annaffia(s, T0);
  const r = annaffia(s, T0 + 2 * ORA);
  assert.equal(r.esito, 'umido');
  assert.equal(s.semi, SEMI.iniziali + SEMI.acqua);
});

test('in primavera la sete torna dopo poco più di un giorno, in inverno dopo due', () => {
  const s = nuovoStato(T0);
  annaffia(s, T0);
  avanza(s, dopo(1));
  assert.equal(vista(s).haSete, false); // 1 giorno di primavera vale 0,8
  avanza(s, dopo(1.3));
  assert.equal(vista(s).haSete, true);

  const inverno = nuovoStato(T0);
  annaffia(inverno, dopo(21)); // la quarta settimana è inverno
  avanza(inverno, dopo(22.9));
  assert.equal(vista(inverno).haSete, false);
  avanza(inverno, dopo(23.1));
  assert.equal(vista(inverno).haSete, true);
});

test('le fasi della sete peggiorano a poco a poco e la pianta non muore mai', () => {
  const s = nuovoStato(T0);
  s.inizio = T0 - 7 * GIORNO; // estate: i giorni di sete coincidono con quelli reali
  annaffia(s, T0);
  const fasi = [1, 2, 4, 6.99].map(g => { avanza(s, dopo(g + .01)); return vista(s).nomeFase; });
  assert.deepEqual(fasi, ['Ha sete', 'Stress lieve', 'Stress medio', 'Stress forte']);
  // poi arrivano autunno e inverno e la sete cresce più piano:
  // 7 + 7 x 0,7 = 11,9 giorni di sete dopo due settimane, 14 solo verso il diciottesimo giorno
  avanza(s, dopo(14));
  assert.equal(vista(s).nomeFase, 'Stress forte');
  avanza(s, dopo(19));
  assert.equal(vista(s).nomeFase, 'Sopravvivenza');
  assert.ok(s.albero.salute < .7, 'dopo più di due settimane la chioma è diradata');
  avanza(s, dopo(400));
  assert.equal(s.albero.salute, .2, 'resta sempre la struttura con la gemma');
});

test('dopo una lunga assenza la chioma si riprende in circa una settimana di cure', () => {
  const s = nuovoStato(T0);
  avanza(s, dopo(40));
  assert.equal(vista(s).lungaAssenza, true);
  for (let g = 40; g <= 47; g++) { annaffia(s, dopo(g)); }
  assert.equal(s.albero.salute, 1);
});

test('la serie cresce di un giorno al giorno e dà un bonus ogni 7', () => {
  const s = nuovoStato(T0);
  let bonus = 0;
  for (let g = 0; g < 7; g++) { s.albero.sete = 1; bonus += annaffia(s, dopo(g)).bonusSerie; }
  assert.equal(s.serie.giorni, 7);
  assert.equal(bonus, SEMI.serie7);
});

test('se la serie si interrompe si dimezza una volta sola', () => {
  const s = nuovoStato(T0);
  for (let g = 0; g < 10; g++) { s.albero.sete = 1; annaffia(s, dopo(g)); }
  avanza(s, dopo(12));
  assert.equal(s.serie.giorni, 5);
  avanza(s, dopo(15));
  assert.equal(s.serie.giorni, 5);
  s.albero.sete = 1; annaffia(s, dopo(15));
  assert.equal(s.serie.giorni, 6);
});

test('i Semi dell\'acqua si danno una volta al giorno', () => {
  const s = nuovoStato(T0);
  annaffia(s, T0);
  s.albero.sete = 1;
  assert.equal(annaffia(s, T0 + 3 * ORA).semi, 0);
  s.albero.sete = 1;
  assert.equal(annaffia(s, dopo(1)).semi, SEMI.acqua);
});
