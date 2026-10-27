// Salvataggio della partita sul telefono (localStorage).
// Ogni accesso è protetto: se la memoria non è disponibile il gioco funziona lo stesso, senza salvare.
import { migra, nuovoStato } from './stato.js';

const CHIAVE = 'giardino-bonsai:partita';

export function carica(ora) {
  try {
    const testo = localStorage.getItem(CHIAVE);
    if (testo) {
      const stato = migra(JSON.parse(testo));
      if (stato) return stato;
    }
  } catch (e) { /* salvataggio illeggibile: si riparte */ }
  return nuovoStato(ora);
}

export function salva(stato) {
  try { localStorage.setItem(CHIAVE, JSON.stringify(stato)); return true; } catch (e) { return false; }
}

export function cancella() {
  try { localStorage.removeItem(CHIAVE); } catch (e) { /* niente da fare */ }
}
