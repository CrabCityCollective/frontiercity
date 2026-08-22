"use client";

import { GameState } from "./types";

// M9 (save/load, hoofdstuk 13): "Eén actieve run lokaal opslaan en hervatten".
// Meerdere gelijktijdige saves binnen dezelfde campagne zijn expliciet buiten
// scope voor de MVP (hoofdstuk 8/13) — daarom precies één vaste
// localStorage-sleutel per campagne, geen save-slot-systeem.
//
// M20d deelstap 2 (hoofdstuk 9/13/15): vóór Going West bestond er maar één
// campagne, dus volstond precies één globale sleutel. Eén gedeelde sleutel
// zou nu betekenen dat het starten van een Going West-run een lopende
// tutorial-save stilzwijgend overschrijft (en omgekeerd) — onverwacht
// dataverlies voor de speler, en in strijd met "elke campagne blijft los
// speelbaar" (CLAUDE.md). Vandaar een eigen sleutel per `GameState.campagneId`
// (`undefined` → tutorial, ongewijzigd t.o.v. bestaande saves) in plaats van
// één gedeeld slot.
function saveSleutel(campagneId?: string): string {
  return campagneId ? `frontier-city:${campagneId}-save` : "frontier-city:tutorial-save";
}

// Bewaart de volledige spelstatus, onder de sleutel van de campagne waartoe
// deze run behoort (`state.campagneId`). GameState bevat uitsluitend data
// (geen functies), dus JSON.stringify volstaat. Fouten (privé-browsen, volle
// opslag) mogen de speelsessie niet onderbreken — de run gaat dan gewoon
// door zonder dat de laatste beurt bewaard blijft.
export function saveSpel(state: GameState): void {
  try {
    window.localStorage.setItem(saveSleutel(state.campagneId), JSON.stringify(state));
  } catch {
    // Zie hierboven: bewust genegeerd.
  }
}

// Leest de bewaarde run voor de gegeven campagne terug (zelfde `campagneId`
// als bij `saveSpel`/`heeftOpgeslagenSpel`), of `null` als er nog geen save is
// voor die campagne (eerste bezoek) of de opgeslagen data niet te lezen valt.
export function laadSpel(campagneId?: string): GameState | null {
  try {
    const ruw = window.localStorage.getItem(saveSleutel(campagneId));
    if (!ruw) return null;
    return metGemigreerdeSteden(JSON.parse(ruw) as GameState);
  } catch {
    return null;
  }
}

// Migratie voor saves van vóór de meerdere-steden-fundering (hoofdstuk 9/13,
// issue: "Eerste bouwsteen van de Amerikaanse frontier-campagne"): oudere
// saves kennen `GameState.steden`/`City.streekHoogte` nog niet. Leidt beide
// af van de bestaande `stad` — de MVP kende tot nu toe nooit een andere
// stad, dus die stond altijd op streekHoogte 0.
function metGemigreerdeSteden(state: GameState): GameState {
  if (Array.isArray(state.steden) && state.steden.length > 0) return state;
  const stad = { ...state.stad, streekHoogte: state.stad.streekHoogte ?? 0 };
  return { ...state, stad, steden: [stad] };
}

// Of er iets te laden valt voor de gegeven campagne (issue: "menu-icoontje
// ... opslaan en oudere games ... inladen") — gebruikt om de "Laden"-knop uit
// te schakelen zolang de speler voor déze campagne nog niets bewust heeft
// opgeslagen.
export function heeftOpgeslagenSpel(campagneId?: string): boolean {
  try {
    return window.localStorage.getItem(saveSleutel(campagneId)) !== null;
  } catch {
    return false;
  }
}

// Losse sleutel (issue: "vinkje bij de tutorial als teken dat je hem gehaald
// hebt") — een bewuste tweede vlag naast de save zelf: de tutorial blijft
// altijd opnieuw speelbaar (dus geen deel van de op-te-slaan `GameState`),
// maar of hij ooit gehaald is, moet een herstart/nieuwe run overleven.
//
// M20d deelstap 2: bewust nog geen analoge vlag voor Going West. Het vinkje
// hoort bij een afsluitend "voltooid"-moment (zie `markeerTutorialVoltooid`
// hieronder, gezet vanuit `TutorialVoltooidPopup`/GameRoot bij het stichten
// van een nieuwe stad) — Going West heeft dat afsluitmoment nog niet: de drie
// ankers (hoofdstuk 9) zijn nog niet inhoudelijk uitgewerkt (zie M20d-issue).
// Dat toevoegen zonder een echt eindpunt zou een vinkje opleveren dat nooit
// (bewust) gezet kan worden — dat komt pas met die latere milestone.
const TUTORIAL_VOLTOOID_KEY = "frontier-city:tutorial-voltooid";

// Gezet zodra de speler de afsluitende samenvatting bij het stichten van een
// nieuwe stad wegklikt (zie
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

// Grafische stijl (issue: "pixel art style placeholders i.p.v. vector style
// ... ik wil misschien later nog heen en weer kunnen schakelen"): een losse,
// globale instelling naast de save zelf (net als `STANDAARD_UITLEG_KEY`
// hierboven) — geldt meteen voor elke lopende/nieuwe run, geen deel van
// `GameState`. De vector-stijl (canvas.ts) blijft de standaard; ontbreekt de
// sleutel nog (eerste bezoek of een oude save), dan valt dit terug op
// "vector" in plaats van de nieuwere pixel-art-stijl.
export type GrafischeStijl = "vector" | "pixel-art";

const GRAFISCHE_STIJL_KEY = "frontier-city:grafische-stijl";

export function grafischeStijl(): GrafischeStijl {
  try {
    const ruw = window.localStorage.getItem(GRAFISCHE_STIJL_KEY);
    return ruw === "pixel-art" ? "pixel-art" : "vector";
  } catch {
    return "vector";
  }
}

export function zetGrafischeStijl(stijl: GrafischeStijl): void {
  try {
    window.localStorage.setItem(GRAFISCHE_STIJL_KEY, stijl);
  } catch {
    // Zie hierboven bij saveSpel: bewust genegeerd.
  }
}
