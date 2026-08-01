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

// Losse sleutel (issue: "vinkje bij de tutorial als teken dat je hem gehaald
// hebt") — een bewuste tweede vlag naast `SAVE_KEY`: de tutorial blijft
// altijd opnieuw speelbaar (dus geen deel van de op-te-slaan `GameState`),
// maar of hij ooit gehaald is, moet een herstart/nieuwe run overleven.
const TUTORIAL_VOLTOOID_KEY = "frontier-city:tutorial-voltooid";

// Gezet zodra de speler de afsluitende samenvatting op laag 12 wegklikt (zie
// TutorialVoltooidPopup/GameRoot). Fouten worden net als bij `saveSpel`
// bewust genegeerd — een ontbrekend vinkje breekt de speelsessie niet.
export function markeerTutorialVoltooid(): void {
  try {
    window.localStorage.setItem(TUTORIAL_VOLTOOID_KEY, "1");
  } catch {
    // Zie hierboven: bewust genegeerd.
  }
}

// Of de tutorial ooit voltooid is — gebruikt door CampagneSelectScherm om
// het vinkje te tonen.
export function heeftTutorialVoltooid(): boolean {
  try {
    return window.localStorage.getItem(TUTORIAL_VOLTOOID_KEY) === "1";
  } catch {
    return false;
  }
}

// Losse sleutel (issue: "uitleg pop-ups aan en uit ... standaard voor alle
// nieuwe potjes"), gezet via het instellingen-scherm (InstellingenPopup, na
// het titelscherm). Bepaalt alleen de standaardwaarde van
// `GameState.uitlegPopupsAan` bij het starten van een nieuwe run — de
// per-run toggle in het hoofdmenu overschrijft dit daarna zonder deze
// globale instelling te wijzigen. Ontbreekt de sleutel nog (eerste bezoek),
// dan staat uitleg standaard aan.
const STANDAARD_UITLEG_KEY = "frontier-city:standaard-uitleg-aan";

export function standaardUitlegAan(): boolean {
  try {
    const ruw = window.localStorage.getItem(STANDAARD_UITLEG_KEY);
    return ruw === null ? true : ruw === "1";
  } catch {
    return true;
  }
}

export function zetStandaardUitleg(aan: boolean): void {
  try {
    window.localStorage.setItem(STANDAARD_UITLEG_KEY, aan ? "1" : "0");
  } catch {
    // Zie hierboven bij saveSpel: bewust genegeerd.
  }
}
