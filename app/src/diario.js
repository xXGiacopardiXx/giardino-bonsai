// Diario fotografico (game-design.md, sezione 8.1): le foto delle piante, salvate sul telefono.
// Le immagini sono troppo grandi per il salvataggio della partita (localStorage, pochi MB): stanno in
// IndexedDB, una voce per foto. Se IndexedDB non c'è, le foto restano solo finché l'app è aperta.
// Il pannello mostra le foto di una pianta in ordine di tempo; toccandone una si vede grande, e
// "Rivedi la crescita" le fa scorrere una dopo l'altra.

const DB = 'giardino-bonsai-diario', NEGOZIO = 'foto';
const MASSIME = 120; // foto per pianta: oltre, si toglie la più vecchia (tranne la prima, il ricordo dell'inizio)
const STAGIONI_BREVI = ['Prim.', 'Est.', 'Aut.', 'Inv.'];
const DALLA = ['dalla primavera', "dall'estate", "dall'autunno", "dall'inverno"];
const NOMI = { acero: 'Acero', ginepro: 'Ginepro', pino: 'Pino', azalea: 'Azalea' };

// --- archivio ---
let memoria = [], prossimo = 1;
const apri = new Promise((ok) => {
  try {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(NEGOZIO, { keyPath: 'id', autoIncrement: true }).createIndex('pianta', 'pianta');
    r.onsuccess = () => ok(r.result);
    r.onerror = () => ok(null);
  } catch (e) { ok(null); }
});
const richiesta = (r) => new Promise((ok, no) => { r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
async function negozio(modo) { const db = await apri; return db && db.transaction(NEGOZIO, modo).objectStore(NEGOZIO); }

// le foto di una pianta, dalla più vecchia
export async function fotoDi(pianta) {
  try {
    const n = await negozio('readonly');
    const tutte = n ? await richiesta(n.index('pianta').getAll(pianta)) : memoria.filter(f => f.pianta === pianta);
    return tutte.sort((a, b) => a.ora - b.ora);
  } catch (e) { return memoria.filter(f => f.pianta === pianta); }
}
// foto: { pianta, ora, anno, stagione, giornoStagione, immagine (Blob) }. Restituisce true se è salvata davvero
export async function aggiungi(foto) {
  try {
    const n = await negozio('readwrite');
    if (!n) { memoria.push({ ...foto, id: prossimo++ }); return false; }
    await richiesta(n.add(foto));
    const tutte = await fotoDi(foto.pianta);
    if (tutte.length > MASSIME) await togli(tutte[1].id);
    return true;
  } catch (e) { memoria.push({ ...foto, id: prossimo++ }); return false; }
}
export async function togli(id) {
  memoria = memoria.filter(f => f.id !== id);
  try { const n = await negozio('readwrite'); if (n) await richiesta(n.delete(id)); } catch (e) { /* niente */ }
}
// ricominciando la partita il diario si svuota
export async function svuota() {
  memoria = [];
  try { const n = await negozio('readwrite'); if (n) await richiesta(n.clear()); } catch (e) { /* niente */ }
}

export const didascalia = (f) => `${['Primavera', 'Estate', 'Autunno', 'Inverno'][f.stagione]}, anno ${f.anno} · giorno ${f.giornoStagione}`;
const breve = (f) => `${STAGIONI_BREVI[f.stagione]} anno ${f.anno}`;

// --- pannello ---
// azioni: chiedi(testo, si, no) → Promise<boolean> (la domanda gentile dell'interfaccia), tocco() (suono)
export function creaDiario(azioni) {
  const el = document.createElement('section');
  el.className = 'negozio diario'; el.hidden = true;
  el.setAttribute('aria-label', 'Diario fotografico');
  el.innerHTML = `
    <div class="negozio-pannello" role="dialog" aria-modal="true" aria-labelledby="diario-titolo">
      <div class="negozio-testa">
        <h2 id="diario-titolo">Diario</h2>
        <button class="negozio-x" data-a="chiudi" aria-label="Chiudi il diario">×</button>
      </div>
      <div class="negozio-schede">${Object.entries(NOMI).map(([p, n]) => `<button class="scheda" data-pianta="${p}">${n}</button>`).join('')}</div>
      <p class="negozio-sotto" data-v="sotto"></p>
      <button class="negozio-vai diario-film" data-a="film" hidden>Rivedi la crescita</button>
      <div class="negozio-lista diario-lista" data-v="lista"></div>
    </div>
    <div class="diario-grande" data-v="grande" hidden>
      <img alt="" data-v="img">
      <p class="diario-dida" data-v="dida"></p>
      <div class="diario-comandi">
        <button class="diario-freccia" data-a="prima" aria-label="Foto precedente">‹</button>
        <button class="domanda-b" data-a="elimina">Elimina</button>
        <button class="guida-avanti" data-a="indietro">Torna al diario</button>
        <button class="diario-freccia" data-a="dopo" aria-label="Foto successiva">›</button>
      </div>
    </div>`;
  document.getElementById('screen').appendChild(el);
  const v = (nome) => el.querySelector(`[data-v="${nome}"]`);
  const lista = v('lista'), grande = v('grande'), img = v('img'), film = el.querySelector('[data-a="film"]');
  let pianta = 'acero', foto = [], indice = 0, timer = null, urls = [];

  // gli indirizzi delle immagini vanno liberati, altrimenti restano in memoria
  const url = (f) => { const u = URL.createObjectURL(f.immagine); urls.push(u); return u; };
  const libera = () => { urls.forEach(u => URL.revokeObjectURL(u)); urls = []; };
  const ferma = () => { clearInterval(timer); timer = null; };

  async function mostraLista() {
    ferma(); libera(); grande.hidden = true;
    el.querySelectorAll('[data-pianta]').forEach(b => b.classList.toggle('on', b.dataset.pianta === pianta));
    foto = await fotoDi(pianta);
    v('sotto').textContent = foto.length ? `${foto.length} foto, ${DALLA[foto[0].stagione]} dell'anno ${foto[0].anno}`
      : `Ancora nessuna foto. Tocca la pianta e scegli Foto: la prima di ogni stagione vale qualche Semi.`;
    film.hidden = foto.length < 2;
    lista.innerHTML = foto.map((f, i) => `<button class="diario-foto" data-i="${i}"><img src="${url(f)}" alt="${NOMI[pianta]}, ${didascalia(f)}"><span>${breve(f)}</span></button>`).join('');
  }
  function mostraGrande(i) {
    if (!foto.length) { mostraLista(); return; }
    indice = (i + foto.length) % foto.length;
    const f = foto[indice];
    img.src = url(f); img.alt = `${NOMI[pianta]}, ${didascalia(f)}`;
    v('dida').textContent = `${didascalia(f)} · ${indice + 1} di ${foto.length}`;
    grande.hidden = false;
  }
  // la crescita: tutte le foto una dopo l'altra, dalla prima
  function avviaFilm() {
    ferma(); mostraGrande(0);
    timer = setInterval(() => { if (indice >= foto.length - 1) { ferma(); return; } mostraGrande(indice + 1); }, 900);
  }

  el.addEventListener('click', async (e) => {
    if (e.target === el) { api.chiudi(); return; }
    const b = e.target.closest('button'); if (!b) return;
    azioni.tocco?.();
    const a = b.dataset.a;
    if (a === 'chiudi') api.chiudi();
    else if (b.dataset.pianta) { pianta = b.dataset.pianta; mostraLista(); }
    else if (b.dataset.i) mostraGrande(+b.dataset.i);
    else if (a === 'film') avviaFilm();
    else if (a === 'prima') { ferma(); mostraGrande(indice - 1); }
    else if (a === 'dopo') { ferma(); mostraGrande(indice + 1); }
    else if (a === 'indietro') mostraLista();
    else if (a === 'elimina') {
      ferma();
      const f = foto[indice];
      if (f && await azioni.chiedi('Togliere questa foto dal diario? Non si potrà recuperare.', 'Elimina', 'Tienila')) { await togli(f.id); mostraLista(); }
    }
  });

  const api = {
    get aperto() { return !el.hidden; },
    apri(p = pianta) { pianta = p; el.hidden = false; mostraLista(); },
    chiudi() { ferma(); libera(); el.hidden = true; },
  };
  return api;
}
