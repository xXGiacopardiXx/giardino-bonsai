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
  // miscela: akadama ocra, pomice bianca, lapillo rosso scuro
  'miscela-conifere': sacco('#8e9a7a', `<circle cx="29" cy="25" r="2.3" fill="#c8894a"/><circle cx="34" cy="24" r="2.1" fill="#eeeade"/><circle cx="31" cy="29" r="2.5" fill="#8a3c2c"/><circle cx="36" cy="30" r="2" fill="#eeeade"/><circle cx="27" cy="31" r="1.8" fill="#c8894a"/><circle cx="32" cy="34" r="2" fill="#8a3c2c"/>`),
  // flacone ambrato con foglia di neem
  'olio-neem': flacone('#e0a640', '#5a8a3a', `<path d="M31 38c-5-4-4-11 3-13 2 6 1 10-3 13Z" fill="#6fae3e" stroke="#2e6a3a" stroke-width="1.4"/>`),
};

export const iconaProdotto = (id) => `<svg viewBox="0 0 64 50" aria-hidden="true">${DISEGNI[id] || ''}</svg>`;

// per chi è un prodotto, detto a parole
const NOMI = { acero: 'acero', pino: 'pino', ginepro: 'ginepro' };
export function perChi(piante) {
  if (piante.length >= 3) return 'Per tutte le piante';
  if (piante.includes('pino') && piante.includes('ginepro')) return 'Per pino e ginepro';
  return 'Solo per ' + piante.map(p => NOMI[p]).join(' e ');
}
