// Test dei consigli del maestro: si lanciano con  npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GIORNO } from './tempo.js';
import { nuovoStato, avanza, annaffia, migra, VERSIONE } from './stato.js';
import { consiglioMaestro, consiglioStagione, segnaConsiglio } from './maestro.js';

const T0 = new Date(2026, 9, 26, 12).getTime();
const dopo = (giorni) => T0 + giorni * GIORNO;

test('il maestro dà il consiglio della stagione una volta sola, e cambia con la stagione', () => {
  const s = nuovoStato(T0);
  const c = consiglioMaestro(s);
  assert.equal(c.id, 'stagione-1-0');
  assert.equal(c.titolo, 'Primavera');
  assert.match(c.testo, /germogli/);
  segnaConsiglio(s, c.id);
  assert.equal(consiglioMaestro(s), null);
  // il consiglio della stagione si può sempre rileggere
  assert.equal(consiglioStagione(s).id, 'stagione-1-0');
  avanza(s, dopo(7.5));
  assert.equal(consiglioMaestro(s).titolo, 'Estate');
});

test('negli anni pari il consiglio della stagione è diverso', () => {
  const s = nuovoStato(T0);
  const primo = consiglioStagione(s).testo;
  avanza(s, dopo(28.5));
  const secondo = consiglioStagione(s);
  assert.equal(secondo.id, 'stagione-2-0');
  assert.notEqual(secondo.testo, primo);
});

test('i momenti chiave vengono prima della stagione: radici fradice, una volta per sempre', () => {
  const s = nuovoStato(T0);
  segnaConsiglio(s, consiglioStagione(s).id);
  annaffia(s, T0);
  for (let i = 1; i <= 4; i++) annaffia(s, T0 + i * 3600 * 1000, 'acero', true);
  const c = consiglioMaestro(s);
  assert.equal(c.id, 'ristagno');
  segnaConsiglio(s, c.id);
  assert.equal(consiglioMaestro(s), null);
});

test('alla fine dell\'inverno il maestro avvisa del rinvaso', () => {
  const s = nuovoStato(T0);
  // fine inverno dell'anno 2: l'acero va rinvasato ogni anno
  avanza(s, dopo(28 + 21 + 4.5));
  const c = consiglioMaestro(s);
  assert.equal(c.id, 'rinvaso-2');
  assert.match(c.testo, /Rinvasa/);
});

test('si tengono solo gli ultimi consigli letti', () => {
  const s = nuovoStato(T0);
  segnaConsiglio(s, 'ristagno');
  for (let i = 0; i < 30; i++) segnaConsiglio(s, `stagione-${i}-0`);
  assert.equal(s.maestro.visti.length, 13);
  assert.ok(s.maestro.visti.includes('ristagno'));
});

test('un salvataggio della versione 17 riceve il maestro', () => {
  const vecchio = nuovoStato(T0);
  vecchio.versione = 17; delete vecchio.maestro;
  const s = migra(vecchio);
  assert.equal(s.versione, VERSIONE);
  assert.deepEqual(s.maestro, { visti: [] });
});
