// Modalità Stile (game-design.md, sezione 5.2): una scheda in basso con lo stile in corso, la percentuale,
// le regole (✓ fatte, ○ da fare) e i pulsanti Cambia stile e Fine; e un pannello per scegliere tra gli
// stili adatti alla pianta, con descrizione, premio e sigillo se già completato.
// I dati arrivano da main.js (valutazione della scena e vista del motore).

const SIGILLO = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="#c4291c" stroke="#3b2716" stroke-width="1.6"/><path d="M8 12.5l2.6 2.6L16.4 9" stroke="#fff4e0" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const LUCCHETTO = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.4" fill="#d9b25a" stroke="#3b2716" stroke-width="1.8"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="#3b2716" stroke-width="1.8"/><circle cx="12" cy="15.5" r="1.6" fill="#3b2716"/></svg>';
const SEME = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c4.5 3 6 7 6 10.5A6 6 0 0 1 6 13.5C6 10 7.5 6 12 3Z" fill="#a8641f" stroke="#3b2716" stroke-width="2"/></svg>';

// azioni: cambia(id), fine()
export function creaPannelloStile(azioni) {
  const card = document.createElement('section');
  card.className = 'stile-card'; card.hidden = true;
  card.innerHTML = `
    <div class="stile-testa"><b data-v="nome"></b><span data-v="sotto"></span><span class="stile-sigillo" data-v="sigillo" hidden>${SIGILLO}</span></div>
    <div class="stile-misura"><span class="bar"><i data-v="barra"></i></span><b data-v="perc"></b></div>
    <ul class="stile-regole" data-v="regole"></ul>
    <p class="stile-aiuto" data-v="aiuto"></p>
    <div class="stile-pulsanti"><button class="guida-avanti stile-cambia" data-a="cambia">Cambia stile</button><button class="guida-avanti" data-a="fine">Fine</button></div>`;
  const scelta = document.createElement('section');
  scelta.className = 'negozio stili-scelta'; scelta.hidden = true;
  scelta.innerHTML = `
    <div class="negozio-pannello" role="dialog" aria-modal="true" aria-labelledby="stili-titolo">
      <div class="negozio-testa"><h2 id="stili-titolo">Stili</h2><button class="negozio-x" data-a="chiudi" aria-label="Chiudi">×</button></div>
      <p class="negozio-sotto" data-v="sotto">Gli stili adatti a questa pianta</p>
      <div class="cure-lista" data-v="lista"></div>
    </div>`;
  const screen = document.getElementById('screen');
  screen.appendChild(card); screen.appendChild(scelta);
  const v = (el, n) => el.querySelector(`[data-v="${n}"]`);
  let ultimo = null;

  card.addEventListener('click', (e) => {
    const a = e.target.closest('button')?.dataset.a;
    if (a === 'fine') azioni.fine();
    else if (a === 'cambia') apriScelta();
  });
  scelta.addEventListener('click', (e) => {
    if (e.target === scelta) { scelta.hidden = true; return; }
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.a === 'chiudi') scelta.hidden = true;
    else if (b.dataset.a === 'scegli') { scelta.hidden = true; azioni.cambia(b.dataset.id); }
  });

  function apriScelta() {
    if (!ultimo) return;
    const { stili, attuale, sigilli, aperti, sblocco } = ultimo;
    v(scelta, 'sotto').textContent = `Gli stili adatti ${ultimo.aChi}. I più difficili si aprono con gli anni.`;
    // gli stili ancora chiusi mostrano il lucchetto, l'anno, i giorni che mancano e il perché del maestro
    const giorni = (n) => n === 1 ? 'domani' : `tra ${n} giorni`;
    v(scelta, 'lista').innerHTML = stili.map(s => {
      const chiuso = !aperti.includes(s.id);
      const destra = s.id === attuale ? '<span class="riga-manca">In corso</span>'
        : chiuso ? `<span class="riga-manca stile-chiuso">${LUCCHETTO}Anno ${s.anno}</span>`
        : `<button class="vaso-b usa" data-a="scegli" data-id="${s.id}">Scegli</button>`;
      return `<div class="riga-prodotto${s.id === attuale ? ' in-corso' : ''}${chiuso ? ' chiusa' : ''}">
      <div class="riga-testo"><b>${s.nome} <small>· ${s.sottotitolo}</small>${sigilli.includes(s.id) ? ` <span class="stile-sigillo">${SIGILLO}</span>` : ''}</b>
      <small>${s.descrizione}</small>${chiuso ? `<small class="stile-perche">Si apre ${giorni(sblocco[s.id])}, nell'anno ${s.anno} della pianta. ${s.perche}</small>` : ''}<span>Completato: +${s.premio} ${SEME}</span></div>
      ${destra}</div>`;
    }).join('');
    scelta.hidden = false;
  }

  return {
    get aperto() { return !card.hidden; },
    apri() { card.hidden = false; },
    chiudi() { card.hidden = true; scelta.hidden = true; },
    // dati: { stile, valutazione, sigilli, stili (compatibili), aperti (id che si possono scegliere), sblocco ({ id: giorni }), aChi ("all'acero", "al pino"...) }
    mostra(dati) {
      ultimo = { ...dati, attuale: dati.stile.id };
      const { stile, valutazione: val, sigilli } = dati;
      v(card, 'nome').textContent = stile.nome;
      v(card, 'sotto').textContent = stile.sottotitolo;
      v(card, 'sigillo').hidden = !sigilli.includes(stile.id);
      v(card, 'perc').textContent = val.percentuale + '%';
      v(card, 'barra').style.width = val.percentuale + '%';
      v(card, 'regole').innerHTML = [
        `<li class="${val.fuori.length ? '' : 'fatta'}">${val.fuori.length ? `Ciuffi fuori dalla sagoma: ${val.fuori.length}` : 'Niente fuori dalla sagoma'}</li>`,
        `<li class="${val.riempimento >= .85 ? 'fatta' : ''}">Sagoma ben piena (${Math.round(val.riempimento * 100)}%)</li>`,
        ...val.regole.map(r => `<li class="${r.ok ? 'fatta' : ''}">${r.testo}</li>`),
      ].join('');
      v(card, 'aiuto').textContent = val.fuori.length ? 'Tocca i ciuffi che brillano per tagliarli. Ricresceranno piano: la forma va curata nel tempo.'
        : val.percentuale >= 90 ? 'Lo stile è compiuto. Mantienilo: i ciuffi ricrescono.' : 'La sagoma è pulita: ora segui le regole che mancano, con il filo e le cure.';
    },
  };
}
