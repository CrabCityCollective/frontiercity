"use client";

import { GameState } from "./types";

// M9 (save/load, hoofdstuk 13): "Eén actieve run lokaal opslaan en hervatten".
// Meerdere gelijktijdige saves zijn expliciet buiten scope voor de MVP
// (hoofdstuk 8/13) — daarom precies één vaste localStorage-sleutel, geen
// save-slot-systeem.
const SAVE_KEY = "frontier-city:tutorial-save";

// Bewaart de volledige spelstatus. GameState bevat uitsluitend data (geen
// functies), dus JSON.stringify volstaat. Fouten (privé-browsen, volle
// opslag) mogen de speelsessie niet onderbreken — de run gaat dan gewoon
// door zonder dat de laatste beurt bewaard blijft.
export function saveSpel(state: GameState): void {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // Zie hierboven: bewust genegeerd.
  }
}

// Leest de bewaarde run terug, of `null` als er nog geen save is (eerste
// bezoek) of de opgeslagen data niet te lezen valt.
export function laadSpel(): GameState | null {
  try {
    const ruw = window.localStorage.getItem(SAVE_KEY);
    if (!ruw) return null;
    return JSON.parse(ruw) as GameState;
  } catch {
    return null;
  }
}

// Of er iets te laden valt (issue: "menu-icoontje ... opslaan en oudere
// games ... inladen") — gebruikt om de "Laden"-knop uit te schakelen zolang
// de speler nog niets bewust heeft opgeslagen.
export function heeftOpgeslagenSpel(): boolean {
  try {
    return window.localStorage.getItem(SAVE_KEY) !== null;
  } catch {
    return false;
  }
}

// Onthoudt of het introscherm (issue: "intro en game over scherm") al
// getoond is, los van de spelstatus zelf — dit hoort niet bij `GameState`
// (geen speldata, puur "heeft deze browser de opening al gezien").
const INTRO_GEZIEN_KEY = "frontier-city:tutorial-intro-gezien";

export function heeftIntroGezien(): boolean {
  try {
    return window.localStorage.getItem(INTRO_GEZIEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markeerIntroGezien(): void {
  try {
    window.localStorage.setItem(INTRO_GEZIEN_KEY, "1");
  } catch {
    // Zie saveSpel hierboven: bewust genegeerd.
  }
}
