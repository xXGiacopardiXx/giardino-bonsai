// Test del motore: si lanciano con  npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GIORNO, ORA, calendario } from './tempo.js';
import { nuovoStato, avanza, annaffia, pota, vista, migra, compra, scegliVaso, mettiFilo, togliFilo, togliAghi, rinvasa, usaProdotto, compraProdotto, PRODOTTI, DOSI_PER_CONFEZIONE, SEMI, VASI, VERSIONE, RAMI } from './stato.js';

// concime e trattamento sull'acero, con l'inventario sempre pieno (i test delle confezioni sono più sotto)
const pieno = (s) => { s.inventario['concime-universale'] = 99; s.inventario['sapone-molle'] = 99; return s; };
const concima = (s, t) => usaProdotto(pieno(s), t, 'acero', 'concime-universale');
const tratta = (s, t) => usaProdotto(pieno(s), t, 'acero', 'sapone-molle');

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
  assert.equal(r.semi, SEMI.sfida);
  assert.equal(s.semi, SEMI.iniziali + SEMI.sfida);
  assert.equal(vista(s).haSete, false);
  assert.equal(s.serie.giorni, 1);
});

test('con il terriccio ancora umido l\'acqua non viene assorbita', () => {
  const s = nuovoStato(T0);
  annaffia(s, T0);
  const r = annaffia(s, T0 + 2 * ORA);
  assert.equal(r.esito, 'umido');
  assert.equal(s.semi, SEMI.iniziali + SEMI.sfida);
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
  // le cure di ogni giorno: acqua e, se sono arrivati durante l'assenza, via i parassiti
  for (let g = 40; g <= 47; g++) { annaffia(s, dopo(g)); tratta(s, dopo(g)); }
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
  assert.equal(annaffia(s, dopo(1)).semi, SEMI.sfida);
});

test('una partita nuova ha due germogli da cimare subito', () => {
  const v = vista(nuovoStato(T0));
  assert.equal(v.germogli.length, 2);
  assert.equal(v.puoPotare, true);
  assert.notEqual(v.germogli[0].punta, v.germogli[1].punta);
});

test('tagliando un germoglio spuntano 2 gemme che crescono nei giorni successivi', () => {
  const s = nuovoStato(T0);
  const g = s.albero.germogli[0];
  const r = pota(s, T0, g.id);
  assert.equal(r.esito, 'ok');
  assert.equal(r.gemme, 2);
  assert.equal(s.albero.germogli.length, 1);
  assert.deepEqual(s.albero.gemme.map(x => x.punta), [g.punta, g.punta]);
  assert.equal(s.serie.giorni, 1, 'la potatura conta per la serie');
  assert.equal(s.semi, SEMI.iniziali, 'ma non dà Semi da sola');
  annaffia(s, T0 + ORA);
  avanza(s, T0 + ORA + GIORNO);
  const c = s.albero.gemme[0].crescita;
  assert.ok(c > .5 && c < 1, `dopo un giorno di primavera la gemma è a metà strada (${c})`);
  assert.equal(pota(s, T0, g.id).esito, 'nessuno', 'un germoglio si taglia una volta sola');
});

test('ogni giorno spunta un germoglio da cimare (due in primavera), fino a un massimo', () => {
  const s = nuovoStato(T0);
  s.inizio = T0 - 7 * GIORNO; // estate
  annaffia(s, T0);
  avanza(s, dopo(1));
  assert.equal(s.albero.germogli.length, 3);
  assert.equal(vista(s).germogli.at(-1).potabile, true, 'il germoglio nuovo si può già cimare');
  for (let g = 2; g < 8; g++) { s.albero.sete = 0; avanza(s, dopo(g)); }
  assert.equal(s.albero.germogli.length, 5);
  assert.equal(new Set(s.albero.germogli.map(g => g.punta)).size, 5, 'ognuno su una punta diversa');

  const p = nuovoStato(T0);
  p.albero.sete = 0;
  avanza(p, dopo(1));
  assert.equal(p.albero.germogli.length, 4);
});

test('sotto stress la pianta smette di crescere', () => {
  const s = nuovoStato(T0);
  s.albero.sete = 5;
  const prima = s.albero.germogli.map(g => g.lunghezza);
  avanza(s, dopo(1));
  assert.deepEqual(s.albero.germogli.map(g => g.lunghezza), prima);
  assert.equal(s.albero.germogli.length, 2, 'e non mette germogli nuovi');
});

test('un germoglio appena spuntato è troppo piccolo per essere tagliato', () => {
  const s = nuovoStato(T0);
  s.albero.germogli[0].lunghezza = .1;
  assert.equal(pota(s, T0, s.albero.germogli[0].id).esito, 'piccolo');
  assert.equal(s.serie.giorni, 0);
});

test('una punta già fitta non aggiunge altre gemme', () => {
  const s = nuovoStato(T0);
  const g = s.albero.germogli[0];
  for (let i = 0; i < 6; i++) s.albero.gemme.push({ punta: g.punta, crescita: 1 });
  assert.equal(pota(s, T0, g.id).gemme, 0);
});

test('un salvataggio della versione 1 riceve i germogli', () => {
  const vecchio = nuovoStato(T0);
  vecchio.versione = 1;
  delete vecchio.albero.germogli; delete vecchio.albero.gemme; delete vecchio.albero.contatore;
  delete vecchio.vasi;
  const s = migra(vecchio);
  assert.equal(s.versione, VERSIONE);
  assert.equal(s.albero.germogli.length, 2);
  assert.equal(s.vasi.scelto, VASI[0].id);
  assert.equal(migra({ versione: 99 }), null);
});

test('si parte con il primo vaso; gli altri si comprano con i Semi', () => {
  const s = nuovoStato(T0);
  assert.equal(vista(s).vaso, VASI[0].id);
  assert.deepEqual(vista(s).vasi.filter(v => v.tuo).map(v => v.id), [VASI[0].id]);
  // 50 Semi non bastano per un vaso da 80
  assert.deepEqual(compra(s, 'terracotta'), { esito: 'pochi', mancano: 30 });
  s.semi = 100;
  assert.equal(compra(s, 'terracotta').esito, 'ok');
  assert.equal(s.semi, 20);
  assert.equal(vista(s).vaso, 'terracotta');
  // un vaso già comprato non si paga due volte, e si può tornare al primo
  assert.equal(compra(s, 'terracotta').esito, 'gia');
  assert.equal(scegliVaso(s, VASI[0].id), true);
  assert.equal(vista(s).vaso, VASI[0].id);
  assert.equal(scegliVaso(s, 'nuvola'), false);
  assert.equal(compra(s, 'inesistente').esito, 'nessuno');
});

test('un salvataggio della versione 2 riceve il vaso iniziale', () => {
  const vecchio = nuovoStato(T0);
  vecchio.versione = 2; delete vecchio.vasi;
  const s = migra(vecchio);
  assert.equal(s.versione, VERSIONE);
  assert.deepEqual(s.vasi, { posseduti: [VASI[0].id], scelto: VASI[0].id });
});

test('saltando più giorni in una volta spunta un germoglio per ogni giorno', () => {
  const s = nuovoStato(T0);
  s.albero.germogli = [];
  annaffia(s, T0);
  avanza(s, dopo(2));
  // primavera: due germogli al giorno
  assert.equal(vista(s).germogli.length, 4);
});

test('la guida si mostra alla prima partita, non a chi giocava già', () => {
  assert.equal(nuovoStato(T0).guida.fatta, false);
  const vecchio = nuovoStato(T0);
  vecchio.versione = 3; delete vecchio.guida;
  const s = migra(vecchio);
  assert.equal(s.versione, VERSIONE);
  assert.equal(s.guida.fatta, true);
});

// annaffia ogni giorno, così la pianta cresce a pieno ritmo
const curaFinoA = (s, giorni) => { for (let g = 0; g <= giorni; g++) annaffia(s, dopo(g)); };

test('il filo piega il ramo, che prende la forma crescendo', () => {
  const s = nuovoStato(T0);
  assert.equal(vista(s).rami.length, RAMI);
  assert.equal(mettiFilo(s, T0, 0, -0.8).esito, 'ok');
  let r = vista(s).rami[0];
  assert.equal(r.filo, true); assert.equal(r.piega, -0.8); assert.equal(r.pronto, false);
  assert.ok(r.giorniAllaPresa >= 2);
  // primavera: 0,35 al giorno, la forma è presa in 3 giorni
  curaFinoA(s, 3);
  r = vista(s).rami[0];
  assert.equal(r.pronto, true);
  assert.equal(vista(s).filoDaTogliere, true);
  const semi = s.semi, esito = togliFilo(s, dopo(3), 0);
  assert.equal(esito.semi, SEMI.filo);
  assert.equal(s.semi, semi + SEMI.filo);
  r = vista(s).rami[0];
  assert.equal(r.filo, false); assert.equal(r.piega, -0.8);
});

test('tolto troppo presto, il ramo torna in parte indietro', () => {
  const s = nuovoStato(T0);
  mettiFilo(s, T0, 1, 1);
  curaFinoA(s, 1);
  const esito = togliFilo(s, dopo(1.5), 1);
  assert.equal(esito.semi, 0);
  const r = vista(s).rami[1];
  assert.ok(r.piega > 0 && r.piega < 1);
});

test('il filo lasciato troppo a lungo segna la corteccia; tolto, il segno svanisce', () => {
  const s = nuovoStato(T0);
  mettiFilo(s, T0, 2, 0.5);
  curaFinoA(s, 12);
  assert.ok(vista(s).rami[2].segno > 0.5);
  assert.equal(togliFilo(s, dopo(12), 2).semi, 0);
  curaFinoA(s, 40);
  assert.ok(vista(s).rami[2].segno < 0.05);
});

test('mettere il filo conta per la serie', () => {
  const s = nuovoStato(T0);
  mettiFilo(s, T0, 3, 0.2);
  assert.equal(s.serie.giorni, 1);
  assert.equal(mettiFilo(s, T0, 9, 0).esito, 'nessuno');
});

test('un salvataggio della versione 4 riceve i rami da legare', () => {
  const vecchio = nuovoStato(T0);
  vecchio.versione = 4; delete vecchio.albero.rami;
  const s = migra(vecchio);
  assert.equal(s.versione, VERSIONE);
  assert.equal(vista(s).rami.length, RAMI);
});

test('la sfida del giorno si può sempre fare, in ogni stagione', () => {
  const s = nuovoStato(T0);
  const tipi = new Set();
  // un giocatore che passa una sera e la mattina dopo, e fa sempre la sfida
  for (let g = 0; g < 56; g++) {
    const ora = new Date(2026, 9, 26 + g, g % 2 ? 9 : 20).getTime();
    const v = vista(avanza(s, ora));
    tipi.add(v.sfida.tipo);
    if (v.sfida.tipo === 'acqua') assert.ok(v.sfida.pianta && v.sfida.pianta !== 'acero' ? v.conifere[v.sfida.pianta].puoAnnaffiare : v.puoAnnaffiare, `giorno ${g}: acqua ma terriccio umido`);
    if (v.sfida.tipo === 'pota') assert.ok(v.puoPotare, `giorno ${g}: pota ma niente da potare`);
    const semi = s.semi;
    if (v.sfida.tipo === 'acqua') annaffia(s, ora, v.sfida.pianta ?? 'acero');
    else if (v.sfida.tipo === 'pota') pota(s, ora, v.germogli.find(x => x.potabile).id);
    else if (v.sfida.tipo === 'rinvaso') { s.inventario.akadama = 9; assert.equal(rinvasa(s, ora, v.sfida.pianta, 'akadama').esito, 'ok'); }
    else if (v.sfida.tipo === 'concime') concima(s, ora);
    else mettiFilo(s, ora, g % RAMI, 0.3);
    assert.ok(vista(s).sfida.fatta, `giorno ${g}: sfida non completata`);
    assert.ok(s.semi >= semi + SEMI.sfida);
  }
  // l'acqua (anche delle conifere) torna spesso, ma non è l'unica sfida
  assert.ok(tipi.has('acqua') && tipi.size >= 2, [...tipi].join());
});

test('se il terriccio è ancora umido la sfida è potare, e dà i Semi', () => {
  const s = nuovoStato(T0);
  s.conifere.pino.sete = s.conifere.ginepro.sete = 0;  // le conifere qui non hanno sete
  annaffia(s, new Date(2026, 9, 26, 21).getTime());
  const mattina = new Date(2026, 9, 27, 8).getTime();
  const v = vista(avanza(s, mattina));
  assert.equal(v.sfida.tipo, 'pota');
  const semi = s.semi;
  assert.equal(pota(s, mattina, v.germogli.find(x => x.potabile).id).semi, SEMI.sfida);
  assert.equal(s.semi, semi + SEMI.sfida);
});

test('un salvataggio della versione 5 riceve i rami nuovi e tiene il filo già messo', () => {
  const vecchio = nuovoStato(T0);
  mettiFilo(vecchio, T0, 1, -0.5);
  vecchio.versione = 5; vecchio.albero.rami = vecchio.albero.rami.slice(0, 4);
  const s = migra(vecchio);
  assert.equal(s.versione, VERSIONE);
  assert.equal(vista(s).rami.length, RAMI);
  assert.equal(vista(s).rami[1].filo, true);
  assert.equal(mettiFilo(s, T0, RAMI - 1, 0.4).esito, 'ok');
});

test('il concime dura una stagione, fa crescere di più e d\'inverno non serve', () => {
  const con = nuovoStato(T0), senza = nuovoStato(T0);
  assert.equal(concima(con, T0).esito, 'ok');
  assert.equal(concima(con, T0 + ORA).esito, 'attivo');
  assert.equal(vista(con).concime.giorni, 7);
  for (const s of [con, senza]) { s.albero.germogli = [{ id: 99, punta: 0, lunghezza: 0.3 }]; s.albero.parassiti = null; annaffia(s, T0); avanza(s, T0 + 12 * ORA); }
  assert.ok(con.albero.germogli.find(g => g.id === 99).lunghezza > senza.albero.germogli.find(g => g.id === 99).lunghezza);
  avanza(con, dopo(8));
  assert.equal(vista(con).concime.attivo, false);
  const inverno = nuovoStato(T0);
  avanza(inverno, dopo(22));
  assert.equal(concima(inverno, dopo(22)).esito, 'inverno');
});

test('i parassiti arrivano a caso, si vedono dopo mezza giornata e trattati in tempo danno Semi', () => {
  const s = nuovoStato(T0);
  // un giocatore che passa ogni giorno a mezzogiorno e poi alle 2 di notte
  let g = 0;
  while (!s.albero.parassiti && g < 30) { annaffia(s, dopo(g)); g++; avanza(s, dopo(g - 0.42)); }
  assert.ok(s.albero.parassiti, 'in un mese di bella stagione arrivano');
  const da = s.albero.parassiti.da;
  assert.equal(vista(s).parassiti.visibili, false);
  assert.equal(vista(avanza(s, da + 13 * ORA)).parassiti.visibili, true);
  const semi = s.semi, esito = tratta(s, da + 2 * ORA);
  assert.equal(esito.semi, SEMI.parassiti + SEMI.scoperti, 'scoperti da vicino prima dell\'avviso');
  assert.equal(s.semi, semi + esito.semi);
  assert.equal(vista(s).parassiti, null);
});

test('i parassiti lasciati lì diradano la chioma, ma non oltre la metà', () => {
  const s = nuovoStato(T0);
  annaffia(s, T0);
  s.albero.parassiti = { posto: 2, da: T0 };
  for (let g = 1; g <= 20; g++) { s.albero.sete = 0; avanza(s, dopo(g)); }
  assert.ok(vista(s).parassiti.danno);
  assert.equal(s.albero.salute, 0.5);
  const esito = tratta(s, dopo(20));
  assert.equal(esito.semi, 0);
  assert.equal(esito.inTempo, false);
});

test('un salvataggio della versione 6 riceve concime e parassiti', () => {
  const vecchio = nuovoStato(T0);
  vecchio.versione = 6; delete vecchio.albero.concime; delete vecchio.albero.parassiti;
  const s = migra(vecchio);
  assert.equal(s.versione, VERSIONE);
  assert.equal(vista(s).parassiti, null);
  assert.equal(vista(s).concime.attivo, false);
});

test('scoperti da vicino prima dell\'avviso, i parassiti danno qualche Seme in più', () => {
  const s = nuovoStato(T0);
  annaffia(s, T0);
  avanza(s, T0 + ORA);
  s.albero.parassiti = { posto: 1, da: T0 + ORA };
  assert.equal(vista(s).parassiti.visibili, false);
  assert.equal(tratta(s, T0 + 3 * ORA).semi, SEMI.parassiti + SEMI.scoperti);
});

test('si parte con un piccolo kit; i prodotti si comprano a confezioni e ogni uso consuma una dose', () => {
  const s = nuovoStato(T0);
  const dosi = (id) => vista(s).prodotti.find(p => p.id === id).dosi;
  assert.equal(dosi('concime-universale'), 2);
  assert.equal(dosi('sapone-molle'), 2);
  assert.equal(dosi('concime-acero'), 0);
  assert.equal(usaProdotto(s, T0, 'acero', 'concime-acero').esito, 'finito');
  s.semi = 100;
  assert.equal(compraProdotto(s, 'concime-acero').esito, 'ok');
  assert.equal(s.semi, 100 - PRODOTTI.find(p => p.id === 'concime-acero').prezzo);
  assert.equal(dosi('concime-acero'), DOSI_PER_CONFEZIONE);
  assert.equal(usaProdotto(s, T0, 'acero', 'concime-acero').esito, 'ok');
  assert.equal(dosi('concime-acero'), DOSI_PER_CONFEZIONE - 1);
  s.semi = 5;
  assert.deepEqual(compraProdotto(s, 'olio-neem'), { esito: 'pochi', mancano: 30 });
});

test('i prodotti specifici vanno solo sulla loro pianta, quelli generali su tutte', () => {
  const s = nuovoStato(T0);
  s.semi = 200; compraProdotto(s, 'concime-acero'); compraProdotto(s, 'concime-conifere');
  assert.equal(usaProdotto(s, T0, 'pino', 'concime-acero').esito, 'non-adatto');
  assert.equal(usaProdotto(s, T0, 'acero', 'concime-conifere').esito, 'non-adatto');
  assert.equal(usaProdotto(s, T0, 'pino', 'concime-conifere').esito, 'ok');
  assert.equal(usaProdotto(s, T0, 'ginepro', 'concime-universale').esito, 'ok');
  assert.equal(vista(s).cura.pino.concime.attivo, true);
  assert.equal(vista(s).cura.ginepro.concime.attivo, true);
  assert.equal(vista(s).cura.acero.concime.attivo, false);
  // lo specifico spinge di più dell'universale
  assert.ok(PRODOTTI.find(p => p.id === 'concime-acero').spinta > PRODOTTI.find(p => p.id === 'concime-universale').spinta);
});

test('il sapone molle senza parassiti non si spreca; l\'olio di neem protegge per una stagione', () => {
  const s = nuovoStato(T0);
  assert.equal(usaProdotto(s, T0, 'ginepro', 'sapone-molle').esito, 'niente');
  assert.equal(vista(s).prodotti.find(p => p.id === 'sapone-molle').dosi, 2);
  s.semi = 100; compraProdotto(s, 'olio-neem');
  assert.equal(usaProdotto(s, T0, 'acero', 'olio-neem').esito, 'ok');
  assert.equal(vista(s).cura.acero.protezione, 7);
  for (let g = 0; g < 7; g++) { annaffia(s, dopo(g)); avanza(s, dopo(g + 0.9)); assert.equal(s.albero.parassiti, null); }
});

test('anche pino e ginepro prendono gli afidi, e si trattano con i prodotti generali', () => {
  const s = nuovoStato(T0);
  let g = 0;
  while (!s.conifere.pino.parassiti && !s.conifere.ginepro.parassiti && g < 60) { annaffia(s, dopo(g)); usaProdotto(pieno(s), dopo(g), 'acero', 'sapone-molle'); g++; avanza(s, dopo(g - 0.42)); }
  const quale = s.conifere.pino.parassiti ? 'pino' : 'ginepro';
  assert.ok(s.conifere[quale].parassiti, 'in due mesi arrivano anche sulle conifere');
  const esito = usaProdotto(pieno(s), dopo(g - 0.4), quale, 'sapone-molle');
  assert.equal(esito.esito, 'ok'); assert.equal(esito.tolti, true);
  assert.equal(vista(s).cura[quale].parassiti, null);
});

test('un salvataggio della versione 7 riceve il kit e la cura delle conifere', () => {
  const vecchio = nuovoStato(T0);
  vecchio.versione = 7; delete vecchio.inventario; delete vecchio.conifere; delete vecchio.albero.protezione;
  const s = migra(vecchio);
  assert.equal(s.versione, VERSIONE);
  assert.equal(vista(s).cura.pino.parassiti, null);
  assert.equal(vista(s).prodotti.find(p => p.id === 'sapone-molle').dosi, 2);
});

test("pino e ginepro bevono meno dell'acero: si annaffiano ogni 3-4 giorni d'estate", () => {
  const s = nuovoStato(T0);
  avanza(s, dopo(7.5));  // estate
  for (const p of ['pino', 'ginepro']) { s.conifere[p].sete = 0; }
  s.albero.sete = 0;
  avanza(s, dopo(8.5));
  let v = vista(s);
  assert.equal(v.puoAnnaffiare, true, "l'acero in un giorno d'estate ha già il terriccio asciutto");
  assert.equal(v.conifere.pino.puoAnnaffiare, false, 'il pino no');
  assert.equal(annaffia(s, dopo(8.5), 'pino').esito, 'umido');
  avanza(s, dopo(11.5));
  v = vista(s);
  assert.equal(v.conifere.pino.puoAnnaffiare, true);
  assert.equal(annaffia(s, dopo(11.5), 'ginepro').esito, 'ok');
  assert.equal(vista(s).conifere.ginepro.sete, 0);
});

test("se l'acero non beve ma una conifera sì, la sfida è annaffiare lei", () => {
  const s = nuovoStato(T0);
  annaffia(s, T0 + 9 * ORA);  // l'acero bevuto la sera
  s.conifere.ginepro.sete = 2;
  const mattina = new Date(2026, 9, 27, 8).getTime();
  const v = vista(avanza(s, mattina));
  assert.equal(v.sfida.tipo, 'acqua');
  assert.equal(v.sfida.pianta, 'ginepro');
  assert.equal(v.sfida.testo, 'Annaffia il ginepro');
  assert.equal(annaffia(s, mattina, 'ginepro').semi, SEMI.sfida);
});

test('un salvataggio della versione 8 riceve la sete di pino e ginepro', () => {
  const vecchio = nuovoStato(T0);
  vecchio.versione = 8; delete vecchio.conifere.pino.sete; delete vecchio.conifere.ginepro.sete;
  const s = migra(vecchio);
  assert.equal(s.versione, VERSIONE);
  assert.equal(vista(s).conifere.pino.haSete, false);
});

test("il pino mette le candele in primavera, si cimano senza lasciare gemme", () => {
  const s = nuovoStato(T0);
  for (let g = 0; g < 2; g++) { s.conifere.pino.sete = 0; annaffia(s, dopo(g)); }
  s.conifere.pino.sete = 0;
  avanza(s, dopo(2));
  const v = vista(s).conifere.pino;
  assert.ok(v.germogli.length >= 2, 'candele in primavera');
  assert.equal(v.puoPotare, true);
  const id = v.germogli.find(x => x.potabile).id;
  const esito = pota(s, dopo(2), id, 'pino');
  assert.equal(esito.esito, 'ok');
  assert.equal(esito.gemme, 0);
  assert.equal(vista(s).conifere.pino.germogli.some(x => x.id === id), false);
});

test("in autunno sul pino compaiono aghi vecchi da togliere; d'inverno le conifere riposano", () => {
  const s = nuovoStato(T0);
  for (let g = 0; g <= 16; g++) { s.albero.sete = 0; s.conifere.pino.sete = 0; s.conifere.ginepro.sete = 0; avanza(s, dopo(g)); }
  const v = vista(s).conifere.pino;
  assert.equal(vista(s).stagione, 2);
  assert.ok(v.vecchi.length >= 1);
  const esito = togliAghi(s, dopo(16), v.vecchi[0].id);
  assert.equal(esito.esito, 'ok');
  assert.equal(vista(s).conifere.pino.vecchi.length, v.vecchi.length - 1);
  // inverno: niente candele né punte nuove
  s.conifere.pino.germogli = []; s.conifere.ginepro.germogli = [];
  for (let g = 22; g <= 26; g++) { s.conifere.pino.sete = 0; s.conifere.ginepro.sete = 0; avanza(s, dopo(g)); }
  assert.equal(vista(s).conifere.pino.germogli.length, 0);
  assert.equal(vista(s).conifere.ginepro.germogli.length, 0);
});

test("il ginepro si pizzica in primavera ed estate", () => {
  const s = nuovoStato(T0);
  for (let g = 0; g <= 3; g++) { s.conifere.ginepro.sete = 0; avanza(s, dopo(g)); }
  const v = vista(s).conifere.ginepro;
  assert.ok(v.germogli.length >= 3);
  assert.equal(pota(s, dopo(3), v.germogli.find(x => x.potabile).id, 'ginepro').esito, 'ok');
});

test("il filo sulle conifere fa presa più piano che sull'acero", () => {
  const s = nuovoStato(T0);
  assert.equal(vista(s).conifere.pino.rami.length, 5);
  assert.equal(vista(s).conifere.ginepro.rami.length, 4);
  mettiFilo(s, T0, 0, -0.6);
  assert.equal(mettiFilo(s, T0, 0, -0.6, 'pino').esito, 'ok');
  for (let g = 0; g <= 3; g++) { s.albero.sete = 0; s.conifere.pino.sete = 0; avanza(s, dopo(g)); }
  assert.equal(vista(s).rami[0].pronto, true);
  assert.equal(vista(s).conifere.pino.rami[0].pronto, false);
  let g = 4;
  while (!vista(s).conifere.pino.filoDaTogliere && g < 12) { s.conifere.pino.sete = 0; avanza(s, dopo(g++)); }
  assert.equal(vista(s).conifere.pino.filoDaTogliere, true);
  assert.equal(togliFilo(s, dopo(g - 1), 0, 'pino').semi, SEMI.filo);
  assert.equal(vista(s).conifere.pino.rami[0].piega, -0.6);
});

test("se l'acero non ha niente da potare, la sfida può essere la potatura di una conifera", () => {
  const s = nuovoStato(T0);
  annaffia(s, T0 + 9 * ORA);
  const mattina = new Date(2026, 9, 27, 7).getTime();
  avanza(s, mattina);
  s.albero.germogli = []; s.conifere.ginepro.sete = 0; s.conifere.pino.sete = 0;
  s.conifere.pino.germogli = [{ id: 50, punta: 1, lunghezza: 0.5 }];
  s.oggi.sfida = null; avanza(s, mattina + 1000);
  const v = vista(s);
  assert.equal(v.sfida.tipo, 'pota');
  assert.equal(v.sfida.pianta, 'pino');
  assert.equal(v.sfida.testo, 'Cima le candele del pino');
  assert.equal(pota(s, mattina + 2000, 50, 'pino').semi, SEMI.sfida);
});

test('un salvataggio della versione 9 riceve potatura e rami delle conifere', () => {
  const vecchio = nuovoStato(T0);
  vecchio.versione = 9;
  for (const p of ['pino', 'ginepro']) { delete vecchio.conifere[p].germogli; delete vecchio.conifere[p].rami; delete vecchio.conifere[p].vecchi; }
  const s = migra(vecchio);
  assert.equal(s.versione, VERSIONE);
  assert.equal(vista(s).conifere.ginepro.rami.length, 4);
  assert.deepEqual(vista(s).conifere.pino.vecchi, []);
});

test('anche la chioma di pino e ginepro si dirada con la sete lunga, più piano, e si riprende', () => {
  const s = nuovoStato(T0);
  avanza(s, dopo(30));
  const pino = vista(s).conifere.pino.salute, acero = vista(s).salute;
  assert.ok(pino < 1, "un mese senz'acqua si vede");
  assert.ok(pino > acero, "ma meno che sull'acero");
  // acqua e, se ci sono, via gli afidi
  for (let g = 30; g <= 50; g++) { annaffia(s, dopo(g), 'pino'); s.conifere.pino.parassiti = null; avanza(s, dopo(g + 0.5)); }
  assert.ok(vista(s).conifere.pino.salute > pino);
});

test('un salvataggio della versione 10 riceve la chioma delle conifere', () => {
  const vecchio = nuovoStato(T0);
  vecchio.versione = 10; delete vecchio.conifere.pino.salute; delete vecchio.conifere.ginepro.salute;
  const s = migra(vecchio);
  assert.equal(s.versione, VERSIONE);
  assert.equal(vista(s).conifere.ginepro.salute, 1);
});

test("l'acero si rinvasa ogni anno a fine inverno; fuori dalla finestra si aspetta", () => {
  const s = nuovoStato(T0);
  assert.equal(vista(s).rinvaso.acero.dovuto, false);
  assert.equal(rinvasa(s, T0, 'acero', 'akadama').esito, 'presto');
  for (let g = 0; g <= 24; g++) { s.albero.sete = 0; avanza(s, dopo(g)); }  // 4° giorno d'inverno
  let v = vista(s);
  assert.equal(v.rinvaso.acero.dovuto, true);
  assert.equal(v.rinvaso.acero.finestra, true);
  assert.equal(v.rinvaso.pino.dovuto, false, 'le conifere ogni 2 anni');
  const semi = s.semi, esito = rinvasa(s, dopo(24), 'acero', 'akadama');
  assert.equal(esito.esito, 'ok');
  assert.ok(s.semi >= semi + SEMI.rinvaso);
  assert.equal(vista(s).rinvaso.acero.dovuto, false);
  assert.equal(vista(s).prodotti.find(p => p.id === 'akadama').dosi, 0);
});

test('saltata la finestra il vaso resta stretto: la pianta beve di più finché non si rinvasa', () => {
  const s = nuovoStato(T0);
  for (let g = 0; g <= 32; g++) { s.albero.sete = 0; avanza(s, dopo(g)); }  // primavera dell'anno 2, finestra chiusa
  const v = vista(s);
  assert.equal(v.rinvaso.acero.stretto, true);
  assert.equal(rinvasa(s, dopo(32), 'acero', 'akadama').esito, 'stagione');
  assert.ok(v.rinvaso.acero.giorniAllaFinestra > 0);
  s.albero.sete = 0; avanza(s, dopo(33));
  assert.ok(s.albero.sete > 0.8 * 1.2, 'beve più del normale');
});

test('la miscela per conifere è solo per pino e ginepro e fa durare il rinvaso 3 anni', () => {
  const s = nuovoStato(T0);
  s.semi = 100; compraProdotto(s, 'miscela-conifere');
  for (let g = 0; g <= 52; g++) { s.albero.sete = 0; s.conifere.pino.sete = 0; avanza(s, dopo(g)); }  // fine inverno dell'anno 2
  assert.equal(vista(s).rinvaso.pino.dovuto, true);
  assert.equal(rinvasa(s, dopo(52), 'acero', 'miscela-conifere').esito, 'non-adatto');
  const esito = rinvasa(s, dopo(52), 'pino', 'miscela-conifere');
  assert.equal(esito.esito, 'ok'); assert.equal(esito.anni, 3);
});

test("un salvataggio della versione 11 riceve il rinvaso e un po' di akadama", () => {
  const vecchio = nuovoStato(T0);
  vecchio.versione = 11; delete vecchio.albero.rinvaso; delete vecchio.conifere.pino.rinvaso; delete vecchio.conifere.ginepro.rinvaso; delete vecchio.inventario.akadama;
  const s = migra(vecchio);
  assert.equal(s.versione, VERSIONE);
  assert.equal(vista(s).rinvaso.ginepro.dovuto, false);
  assert.equal(s.inventario.akadama, 1);
});
