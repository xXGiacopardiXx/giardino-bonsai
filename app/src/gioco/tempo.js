// Il tempo del gioco (game-design.md, sezione 3).
// Stagioni e anni seguono il tempo compresso: 4 settimane reali = 1 anno, 1 settimana = 1 stagione.
// La sete invece si misura in giorni reali.

export const ORA = 3600 * 1000;
export const GIORNO = 24 * ORA;

export const STAGIONI = ['Primavera', 'Estate', 'Autunno', 'Inverno'];

// Quanto in fretta si secca il terriccio in ogni stagione (estate = 1).
// In inverno i tempi della sete si allungano di circa 2 volte.
export const FATTORE_SETE = [0.8, 1, 0.7, 0.5];

// Calendario di gioco: la partita inizia il primo giorno di primavera dell'anno 1.
export function calendario(inizio, ora) {
  const giorni = Math.max(0, (ora - inizio) / GIORNO);
  const settimane = Math.floor(giorni / 7);
  return {
    anno: Math.floor(settimane / 4) + 1,
    stagione: settimane % 4,
    giornoStagione: Math.floor(giorni % 7) + 1, // da 1 a 7
  };
}

// Giorno del calendario locale del telefono, es. "2026-10-26": serve per serie e sfide.
export function giornoLocale(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Quanti giorni di calendario separano due giorni locali (0 = stesso giorno, 1 = il giorno dopo)
export function giorniTra(a, b) {
  const utc = (g) => { const [y, m, d] = g.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((utc(b) - utc(a)) / GIORNO);
}
