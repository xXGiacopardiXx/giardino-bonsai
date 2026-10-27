// Pannello di prova per far passare il tempo senza aspettare giorni veri.
// Si apre toccando 3 volte di fila la stagione in alto a sinistra.
// Il cursore mostra un'anteprima; "Fai passare il tempo" la rende reale (e viene salvata).

const fmtData = new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const fmtNum = (n, cifre = 1) => n.toLocaleString('it-IT', { maximumFractionDigits: cifre });

// azioni: anteprima(giorni), applica(giorni), azzera()
export function creaPannelloProva(azioni) {
  const el = document.createElement('section');
  el.className = 'prova'; el.hidden = true;
  el.setAttribute('aria-label', 'Strumenti di prova');
  el.innerHTML = `
    <div class="prova-testa"><h2>Strumenti di prova</h2><button class="prova-x" data-a="chiudi" aria-label="Chiudi">×</button></div>
    <p class="prova-ora" data-v="ora"></p>
    <label class="prova-cur">Anteprima <b data-v="giorni">+0 giorni</b>
      <input type="range" min="0" max="40" step="0.25" value="0">
    </label>
    <dl class="prova-dati">
      <dt>Sete</dt><dd data-v="sete"></dd>
      <dt>Fase</dt><dd data-v="fase"></dd>
      <dt>Chioma</dt><dd data-v="salute"></dd>
      <dt>Serie</dt><dd data-v="serie"></dd>
      <dt>Germogli</dt><dd data-v="germogli"></dd>
    </dl>
    <div class="prova-pulsanti">
      <button data-a="ora">+1 ora</button>
      <button data-a="applica" class="principale">Fai passare il tempo</button>
      <button data-a="azzera" class="pericolo">Nuova partita</button>
    </div>`;
  document.getElementById('screen').appendChild(el);

  const v = (nome) => el.querySelector(`[data-v="${nome}"]`);
  const cursore = el.querySelector('input');
  const giorni = () => Number(cursore.value);
  function etichetta() { const g = giorni(); v('giorni').textContent = `+${fmtNum(g, 2)} ${g === 1 ? 'giorno' : 'giorni'}`; }
  function azzeraCursore() { cursore.value = 0; etichetta(); azioni.anteprima(0); }

  cursore.addEventListener('input', () => { etichetta(); azioni.anteprima(giorni()); });
  el.addEventListener('click', (e) => {
    const a = e.target.closest('button')?.dataset.a;
    if (a === 'chiudi') { el.hidden = true; azzeraCursore(); }
    else if (a === 'ora') { azzeraCursore(); azioni.applica(1 / 24); }
    else if (a === 'applica') { const g = giorni(); azzeraCursore(); if (g > 0) azioni.applica(g); }
    else if (a === 'azzera' && confirm('Ricominciare da capo? La partita salvata verrà cancellata.')) { azzeraCursore(); azioni.azzera(); }
  });

  // tre tocchi ravvicinati sulla stagione aprono il pannello
  let tocchi = [];
  document.querySelector('.pill.season').addEventListener('pointerup', () => {
    const t = performance.now();
    tocchi = [...tocchi.filter(x => t - x < 900), t];
    if (tocchi.length >= 3) { tocchi = []; el.hidden = !el.hidden; azzeraCursore(); }
  });

  return {
    get anteprima() { return el.hidden ? 0 : giorni(); },
    // vista: dal motore; ora: istante mostrato (reale o in anteprima)
    mostra(vista, ora) {
      if (el.hidden) return;
      v('ora').textContent = `${giorni() > 0 ? 'Anteprima' : 'Ora'}: ${fmtData.format(ora)} · ${vista.nomeStagione} ${vista.giornoStagione}/7, anno ${vista.anno}`;
      v('sete').textContent = fmtNum(vista.sete) + ' g';
      v('fase').textContent = vista.nomeFase;
      v('salute').textContent = Math.round(vista.salute * 100) + '%';
      v('serie').textContent = vista.serie;
      v('germogli').textContent = `${vista.germogli.length}, gemme ${vista.gemme.length}`;
    },
  };
}
