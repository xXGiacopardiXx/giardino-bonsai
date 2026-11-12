// Disegnini dei prodotti di cura (catalogo PRODOTTI in gioco/stato.js), usati da negozio e inventario.
// Sacchetti di concime con un'etichetta diversa per ogni pianta, flaconi spray per i trattamenti.

const INK = '#3b2716';
const sacco = (colore, etichetta) => `<path d="M20 12h24l4 32H16Z" fill="${colore}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/><path d="M20 12l3-5h18l3 5" fill="${colore}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" opacity=".85"/><circle cx="32" cy="28" r="9" fill="#fff8e6" stroke="${INK}" stroke-width="1.6"/>${etichetta}<circle cx="11" cy="44" r="2.6" fill="#f0dc9a" stroke="${INK}" stroke-width=".8"/><circle cx="53" cy="45" r="2.2" fill="#e2c47a" stroke="${INK}" stroke-width=".8"/>`;
const flacone = (colore, tappo, extra) => `<rect x="22" y="18" width="18" height="28" rx="5" fill="${colore}" stroke="${INK}" stroke-width="2.4"/><path d="M26 18v-6h12v6" fill="${tappo}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/><path d="M38 12h8l2 3h-10" fill="${tappo}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><circle cx="54" cy="10" r="2" fill="#bfe6f7"/><circle cx="58" cy="15" r="1.6" fill="#bfe6f7"/><circle cx="55" cy="19" r="1.4" fill="#bfe6f7"/>${extra}`;

const DISEGNI = {
  // foglia d'acero rossa
  'concime-acero': sacco('#d98a5a', `<path d="M32 21l1.6 3.4 3.4-1.4-1.3 3.5 3.4 1.2-3.2 1.7 1.1 3.3-3.5-1.5L32 35l-1.4-3.8-3.5 1.5 1.1-3.3-3.2-1.7 3.4-1.2-1.3-3.5 3.4 1.4Z" fill="#e3462a"/>`),
  // ciuffo di aghi verde scuro
  'concime-conifere': sacco('#7aa86a', `<path d="M32 34V22M32 26l-5-3M32 26l5-3M32 30l-6-2M32 30l6-2" stroke="#2e6a3a" stroke-width="2.2" stroke-linecap="round"/>`),
  // germoglio verde: va bene per tutte
  'concime-universale': sacco('#c9a36a', `<path d="M32 34v-8M32 27c-4 0-6-3-6-6 4 0 6 3 6 6Zm0 0c4 0 6-3 6-6-4 0-6 3-6 6Z" fill="#6fae3e" stroke="#2e6a3a" stroke-width="1.4" stroke-linejoin="round"/>`),
  // flacone azzurro con bolle di sapone
  'sapone-molle': flacone('#7cc4e8', '#e2483a', `<circle cx="29" cy="30" r="3" fill="#fff" opacity=".9"/><circle cx="34" cy="37" r="2.2" fill="#fff" opacity=".8"/><circle cx="33" cy="26" r="1.5" fill="#fff" opacity=".8"/>`),
  // granuli di akadama color ocra
  'akadama': sacco('#b98a52', `<circle cx="29" cy="25" r="2.4" fill="#c8894a"/><circle cx="34" cy="24" r="2.2" fill="#d69a58"/><circle cx="31" cy="29" r="2.6" fill="#b87a40"/><circle cx="36" cy="30" r="2" fill="#c8894a"/><circle cx="27" cy="31" r="1.8" fill="#d69a58"/><circle cx="32" cy="34" r="2" fill="#b87a40"/>`),
  // kanuma: pomice giallo chiaro, acida, per l'azalea
  'kanuma': sacco('#c4a24a', `<circle cx="29" cy="25" r="2.4" fill="#e6d27a"/><circle cx="34" cy="24" r="2.2" fill="#d8c060"/><circle cx="31" cy="29" r="2.6" fill="#f0e09a"/><circle cx="36" cy="30" r="2" fill="#e6d27a"/><circle cx="27" cy="31" r="1.8" fill="#d8c060"/><circle cx="32" cy="34" r="2" fill="#f0e09a"/>`),
  // miscela: akadama ocra, pomice bianca, lapillo rosso scuro
  'miscela-conifere': sacco('#8e9a7a', `<circle cx="29" cy="25" r="2.3" fill="#c8894a"/><circle cx="34" cy="24" r="2.1" fill="#eeeade"/><circle cx="31" cy="29" r="2.5" fill="#8a3c2c"/><circle cx="36" cy="30" r="2" fill="#eeeade"/><circle cx="27" cy="31" r="1.8" fill="#c8894a"/><circle cx="32" cy="34" r="2" fill="#8a3c2c"/>`),
  // piretro: flacone bianco con un fiore di crisantemo
  'piretro': flacone('#f2efe4', '#e8b84a', `<circle cx="31" cy="31" r="2.4" fill="#e8b84a"/><g fill="#fff" stroke="${INK}" stroke-width=".8"><ellipse cx="31" cy="26" rx="1.6" ry="3"/><ellipse cx="31" cy="36" rx="1.6" ry="3"/><ellipse cx="26" cy="31" rx="3" ry="1.6"/><ellipse cx="36" cy="31" rx="3" ry="1.6"/></g>`),
  // concime liquido: bottiglia verde con una goccia
  'concime-liquido': `<rect x="23" y="16" width="18" height="30" rx="4" fill="#6fae3e" stroke="${INK}" stroke-width="2.4"/><rect x="27" y="9" width="10" height="7" rx="1.5" fill="#e2483a" stroke="${INK}" stroke-width="2"/><path d="M32 24c3 4 4.5 6 4.5 8a4.5 4.5 0 0 1-9 0c0-2 1.5-4 4.5-8Z" fill="#bfe6f7" stroke="${INK}" stroke-width="1.4"/>`,
  // concime per azalee: sacchetto rosa con un fiore
  'concime-azalee': sacco('#e7a0b8', `<g fill="#f27ea6" stroke="#b8406a" stroke-width=".8"><circle cx="32" cy="24" r="3"/><circle cx="27.5" cy="28" r="3"/><circle cx="36.5" cy="28" r="3"/><circle cx="29.5" cy="33" r="3"/><circle cx="34.5" cy="33" r="3"/></g><circle cx="32" cy="29" r="1.8" fill="#fbd3e1"/>`),
  // tonico alle alghe: barattolo blu mare con un'alga
  'alghe': `<rect x="20" y="16" width="24" height="30" rx="5" fill="#3f7fa6" stroke="${INK}" stroke-width="2.4"/><rect x="18" y="11" width="28" height="7" rx="2" fill="#2c5a78" stroke="${INK}" stroke-width="2"/><path d="M32 42c-4-5 4-8 0-13s4-7 1-11" stroke="#6fd08a" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="26" cy="24" r="1.6" fill="#bfe6f7"/><circle cx="38" cy="34" r="1.4" fill="#bfe6f7"/>`,
  // kiryu: sabbia vulcanica gialla e dura
  'kiryu': sacco('#a8a060', `<circle cx="29" cy="25" r="2.3" fill="#e0c25a"/><circle cx="34" cy="24" r="2.1" fill="#c8a83c"/><circle cx="31" cy="29" r="2.5" fill="#e8d070"/><circle cx="36" cy="30" r="2" fill="#c8a83c"/><circle cx="27" cy="31" r="1.8" fill="#e0c25a"/><circle cx="32" cy="34" r="2" fill="#b89a34"/>`),
  // muschio: un cuscinetto verde in una vaschetta
  'muschio': `<path d="M12 34h40l-4 10H16Z" fill="#8a6a48" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/><path d="M12 34c2-8 8-11 14-8 3-5 10-5 13 0 6-3 13 1 13 8Z" fill="#6d9a43" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/><circle cx="24" cy="29" r="2" fill="#8fc25a"/><circle cx="36" cy="27" r="2.2" fill="#8fc25a"/><circle cx="44" cy="31" r="1.6" fill="#8fc25a"/>`,
  // flacone ambrato con foglia di neem
  'olio-neem': flacone('#e0a640', '#5a8a3a', `<path d="M31 38c-5-4-4-11 3-13 2 6 1 10-3 13Z" fill="#6fae3e" stroke="#2e6a3a" stroke-width="1.4"/>`),
};

export const iconaProdotto = (id) => `<svg viewBox="0 0 64 50" aria-hidden="true">${DISEGNI[id] || ''}</svg>`;

// per chi è un prodotto, detto a parole
const NOMI = { acero: 'acero', pino: 'pino', ginepro: 'ginepro', azalea: "l'azalea" };
export function perChi(piante) {
  if (piante.length >= 4) return 'Per tutte le piante';
  if (piante.length === 3) return 'Per ' + piante.map(p => NOMI[p]).join(', ').replace(/, ([^,]*)$/, ' e $1');
  if (piante.includes('pino') && piante.includes('ginepro')) return 'Per pino e ginepro';
  return 'Solo per ' + piante.map(p => NOMI[p]).join(' e ');
}
