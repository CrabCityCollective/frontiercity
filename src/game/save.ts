"use client";

import { GameState } from "./types";
import { hoogsteOntgrendeldeStreek } from "./world";

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
    return metGemigreerdeSmederijVeld(
      metGemigreerdeWampanoagVelden(metGemigreerdePopupStatus(metGemigreerdeSteden(JSON.parse(ruw) as GameState)))
    );
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

// Migratie voor saves van vóór `gezieneEenmaligeUitleg`/`laatstBevestigdeStreek`/
// `laatsteBevestigdeStedenAantal` (issue: "Bij laden niet alle pop-ups
// tonen") — die drie velden leefden voorheen uitsluitend als React-`useState`
// in GameRoot, dus oudere saves kennen ze nog niet. Zonder deze migratie zou
// zo'n save `laatstBevestigdeStreek`/`laatsteBevestigdeStedenAantal` op
// `undefined` laten staan (waardoor bijvoorbeeld `actieveStreek.hoogte >
// laatstBevestigdeStreek` altijd `true` is) — daarom hier meteen op de al
// bereikte stand gezet, in plaats van terug op 1: de speler kan de streken/
// stichtingen die deze save al voorbij is per definitie alleen bereikt hebben
// door de bijbehorende pop-up in een eerdere sessie al weg te klikken (die
// blokkeert verder spelen totdat hij bevestigd is). `gezieneEenmaligeUitleg`
// kán niet met dezelfde zekerheid worden afgeleid (geen van de bijbehorende
// pop-ups blokkeert verder spelen) — die begint hier daarom leeg, dus een
// save van vóór deze migratie toont elke nog openstaande eenmalige
// uitleg-pop-up nog precies één keer opnieuw, waarna hij (net als bij een
// nieuwe run) voorgoed bevestigd blijft.
function metGemigreerdePopupStatus(state: GameState): GameState {
  if (
    Array.isArray(state.gezieneEenmaligeUitleg) &&
    typeof state.laatstBevestigdeStreek === "number" &&
    typeof state.laatsteBevestigdeStedenAantal === "number"
  ) {
    return state;
  }
  return {
    ...state,
    gezieneEenmaligeUitleg: state.gezieneEenmaligeUitleg ?? [],
    laatstBevestigdeStreek: state.laatstBevestigdeStreek ?? hoogsteOntgrendeldeStreek(state.streken),
    laatsteBevestigdeStedenAantal: state.laatsteBevestigdeStedenAantal ?? state.steden.length,
  };
}

// Migratie voor saves van vóór de Wampanoag-openingsfase-velden (M21a,
// opdracht-wampanoag-opening.md §1): oudere saves kennen
// `bevervellen`/`mais`/`wampum`/`gereedschap`/`cultureelOntgrendeld` nog niet.
// Handelswaren-voorraad begint alsnog op 0 (niets vult ze met terugwerkende
// kracht). `cultureelOntgrendeld` valt terug op `true` — een save van vóór dit
// veld bestond per definitie vóór de Wampanoag-fase-gating (nog nergens aan
// gekoppeld, zie types.ts), dus voor élke campagne is `true` de correcte
// terugval, niet de Going-West-openingsfase-startwaarde (`maakInitieleSpelStatus`
// gebruikt die alleen voor een gloednieuwe run). Een eerdere versie migreerde
// hier ook `ontgrendelResource`; dat veld is vervallen (issue "Weer gewoon
// cultuur voor ontgrendeling" — streek-ontgrendeling loopt altijd op cultuur,
// zie streekOntgrendeling.ts), dus oudere saves met dat veld negeren het
// stilzwijgend.
function metGemigreerdeWampanoagVelden(state: GameState): GameState {
  if (
    typeof state.bevervellen === "number" &&
    typeof state.mais === "number" &&
    typeof state.wampum === "number" &&
    typeof state.gereedschap === "number" &&
    typeof state.cultureelOntgrendeld === "boolean"
  ) {
    return state;
  }
  return {
    ...state,
    bevervellen: state.bevervellen ?? 0,
    mais: state.mais ?? 0,
    wampum: state.wampum ?? 0,
    gereedschap: state.gereedschap ?? 0,
    cultureelOntgrendeld: state.cultureelOntgrendeld ?? true,
  };
}

// Migratie voor saves van vóór de Smederij (Going West, M21d,
// opdracht-wampanoag-opening.md §3): oudere saves kennen `City.heeftSmederij`
// nog niet, op zowel `stad` als elke stad in `steden`. Valt terug op `false`
// (nooit gebouwd) op elke stad — geen enkele oudere save kan 'm al gehad
// hebben, deze migratie voegt alleen het ontbrekende veld toe.
function metGemigreerdeSmederijVeld(state: GameState): GameState {
  if (typeof state.stad.heeftSmederij === "boolean") return state;
  const stad = { ...state.stad, heeftSmederij: state.stad.heeftSmederij ?? false };
  const steden = state.steden.map((s) => ({ ...s, heeftSmederij: s.heeftSmederij ?? false }));
  return { ...state, stad, steden };
}

// Verwijdert de opgeslagen run van deze campagne (issue: "Bij game over moet
// de save verwijderd worden") — zonder dit bleef de laatst ge-autosavede
// status (met `laatsteIneenstorting: true` erop) gewoon in localStorage
// staan, waardoor "Laden" op CampagneSelectScherm de speler regelrecht weer
// op het game-over-scherm zette. Aangeroepen zodra een run daadwerkelijk
// instort (zie useGameEngine: de autosave-effect) — een ingestorte run heeft
// toch niets meer om te hervatten, dus de save mag weg in plaats van
// overschreven te blijven met de ineenstortingsvlag erop.
export function verwijderSpel(campagneId?: string): void {
  try {
    window.localStorage.removeItem(saveSleutel(campagneId));
  } catch {
    // Zie hierboven bij saveSpel: bewust genegeerd.
  }
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

// Op welke streek de opgeslagen run van deze campagne staat (issue:
// "loading button per campagne op het campagne select screen ... aangeeft op
// welke streek de save zich bevindt") — gebruikt door CampagneSelectScherm
// om dat direct bij de Laden-knop te tonen, zonder eerst de run te starten.
// Zelfde "hoogste ontgrendelde streek" als de frontier-streek binnen een
// lopende run (world.ts). `null` als er niets te laden valt.
export function opgeslagenSpelStreek(campagneId?: string): number | null {
  const opgeslagenStatus = laadSpel(campagneId);
  if (!opgeslagenStatus) return null;
  return hoogsteOntgrendeldeStreek(opgeslagenStatus.streken);
}

// Per-campagne voortgangstellers (issue: "voortgang verschillende campagnes
// tonen" — vervangt de eerdere, tutorial-specifieke `TUTORIAL_VOLTOOID_KEY`-
// vlag door drie tellers die voor elke campagne gelden). Eigen sleutel per
// `campagneId`, zelfde patroon als `saveSleutel` hierboven — dus ook hier
// geen gedeelde sleutel die de tutorial en Going West door elkaar zou halen.
//
// M20d deelstap 2/vervolg: Going West heeft nog geen afsluitend
// "voltooid"-moment (de drie ankers, hoofdstuk 9, zijn nog niet inhoudelijk
// uitgewerkt) — `uitgespeeld` blijft voor die campagne dus vanzelf op 0 tot
// die latere milestone er een aanroept naar `registreerCampagneUitgespeeld`
// aan toevoegt. Geen mechaniek hier vooruit gebouwd voor dat moment.
export interface CampagneStatistieken {
  gestart: number;
  gameOverGezien: number;
  uitgespeeld: number;
}

const LEGE_STATISTIEKEN: CampagneStatistieken = { gestart: 0, gameOverGezien: 0, uitgespeeld: 0 };

function campagneStatistiekenSleutel(campagneId?: string): string {
  return campagneId ? `frontier-city:${campagneId}-statistieken` : "frontier-city:tutorial-statistieken";
}

// Losse, oude sleutel van vóór deze tellers (issue: "vinkje bij de tutorial
// als teken dat je hem gehaald hebt") — uitsluitend nog gelezen zodat een
// speler die de tutorial vóór deze wijziging al gehaald had, dat vinkje niet
// kwijtraakt. Wordt nergens meer geschreven.
const LEGACY_TUTORIAL_VOLTOOID_KEY = "frontier-city:tutorial-voltooid";

// Huidige stand van de drie tellers voor de gegeven campagne (gebruikt door
// CampagneSelectScherm voor het vinkje/aantal keer gestart, en door
// IntroScherm voor alle drie op het campagne-introscherm). Nooit `null` —
// een campagne zonder ooit opgeslagen tellers levert gewoon nullen op.
export function campagneStatistieken(campagneId?: string): CampagneStatistieken {
  try {
    const ruw = window.localStorage.getItem(campagneStatistiekenSleutel(campagneId));
    const statistieken = ruw ? (JSON.parse(ruw) as CampagneStatistieken) : { ...LEGE_STATISTIEKEN };
    if (
      campagneId === undefined &&
      statistieken.uitgespeeld === 0 &&
      window.localStorage.getItem(LEGACY_TUTORIAL_VOLTOOID_KEY) === "1"
    ) {
      return { ...statistieken, uitgespeeld: 1 };
    }
    return statistieken;
  } catch {
    return { ...LEGE_STATISTIEKEN };
  }
}

function verhoogStatistiek(campagneId: string | undefined, veld: keyof CampagneStatistieken): CampagneStatistieken {
  const huidig = campagneStatistieken(campagneId);
  const nieuw = { ...huidig, [veld]: huidig[veld] + 1 };
  try {
    window.localStorage.setItem(campagneStatistiekenSleutel(campagneId), JSON.stringify(nieuw));
  } catch {
    // Zie hierboven bij saveSpel: bewust genegeerd — de teller mist dan
    // gewoon deze verhoging, dat breekt de speelsessie niet.
  }
  return nieuw;
}

// Gezet bij elke start van de campagne (zie GameRoot: elke keer dat het
// introscherm getoond wordt, net als voorheen bij `toonIntro`).
export function registreerCampagneGestart(campagneId?: string): CampagneStatistieken {
  return verhoogStatistiek(campagneId, "gestart");
}

// Gezet zodra het ineenstortingsscherm (game-over) voor deze campagne
// verschijnt (zie GameRoot: `state.laatsteIneenstorting`).
export function registreerGameOverGezien(campagneId?: string): CampagneStatistieken {
  return verhoogStatistiek(campagneId, "gameOverGezien");
}

// Gezet zodra de speler de afsluitende samenvatting van een run wegklikt
// (voor de tutorial: TutorialVoltooidPopup, bij het stichten van een nieuwe
// stad — zie GameRoot).
export function registreerCampagneUitgespeeld(campagneId?: string): CampagneStatistieken {
  return verhoogStatistiek(campagneId, "uitgespeeld");
}

// Losse sleutel (issue: "uitleg pop-ups aan en uit ... standaard voor alle
// nieuwe potjes"), gezet via het instellingen-scherm (InstellingenPopup, na
// het titelscherm). Bepaalt alleen de standaardwaarde van
// `GameState.uitlegPopupsAan` bij het starten van een nieuwe tutorial-run —
// de per-run toggle in het hoofdmenu overschrijft dit daarna zonder deze
// globale instelling te wijzigen. Ontbreekt de sleutel nog (eerste bezoek),
// dan staat uitleg standaard aan. Going West gebruikt deze instelling
// bewust niet (issue: "Uitleg pop-ups standaard uit"): die campagne start
// altijd met uitleg uit, zie `maakInitieleSpelStatus` (initieleSpelStatus.ts).
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
