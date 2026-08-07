// Cultuur & laag-ontgrendeling (M5): cultuur is een voortgangs-valuta zonder
// opslag-cap (hoofdstuk 5). Zodra de cumulatieve cultuur de drempel van de
// eerstvolgende vergrendelde laag haalt, ontgrendelt die laag automatisch
// (fog of war verdwijnt — hoofdstuk 2).
//
// Bezette Laag, Verkenning & belegering (hoofdstuk 6, issue: "De Bezette
// Laag, missionaris en verkenner"): sommige lagen komen in plaats daarvan
// "in beeld" met verhulde vakjes — Verkenning (met wetenschap, dezelfde pool
// als de technologie-boom) onthult ze één voor één, en zodra de speler een
// Missionaris heeft, leidt de cultuurproductie van die beurt om naar een
// belegeringsmeter tegen de vijandelijke Heiligdommen op die laag.

import {
  BEZETTE_LAAG_HUISJE,
  VIJANDELIJK_HEILIGDOM,
  VIJANDELIJKE_WACHTTOREN,
} from "./improvements";
import { GameState, Settler } from "./types";
import {
  AMBER_ONTDEKKING_LAAG,
  AMBER_ONTDEKKING_LAAG_2,
  cultuurKostenVoorLaag,
  hoogsteOntgrendeldeLaag,
  initialiseerBezetteLaag,
  isBezetteLaagHoogte,
} from "./world";
import { berekenCultuurProductieDitBeurt } from "./productie";

// Bezette Laag (hoofdstuk 6, issue: "De Bezette Laag, missionaris en
// verkenner"): kosten van één Verkenning (Deel 3) en de belegeringsdrempel
// tegen een vijandelijk Heiligdom (Deel 4) — beide MVP-richtwaarden,
// expliciet tunebaar genoemd in het issue (hoofdstuk 14).
export const VERKENNING_KOSTEN_WETENSCHAP = 10;
export const BELEGERINGSDREMPEL = 30;

// Ontgrendelt de eerstvolgende vergrendelde laag zodra de cumulatieve cultuur
// de drempel haalt (M5, hoofdstuk 2/5). Cultuur wordt niet "uitgegeven" —
// het blijft een oplopende teller, dus bij een grote overschot ontgrendelen
// meteen meerdere lagen na elkaar in dezelfde beurt.
export function verwerkLaagOntgrendeling(state: GameState): GameState {
  let lagen = state.lagen;
  let volgendeHoogte = hoogsteOntgrendeldeLaag(lagen) + 1;
  let amberOntdektEvent = state.amberOntdektEvent;
  let tweedeAmberOntdektEvent = state.tweedeAmberOntdektEvent;
  let bezetteLaagOntdektEvent = state.bezetteLaagOntdektEvent;

  while (
    volgendeHoogte <= lagen.length &&
    state.cultuur >= cultuurKostenVoorLaag(volgendeHoogte)
  ) {
    const huidigeLaag = lagen.find((laag) => laag.hoogte === volgendeHoogte)!;

    // Bezette Laag (hoofdstuk 6, issue: "De Bezette Laag, missionaris en
    // verkenner", Deel 2): in plaats van normaal te ontgrendelen, komt deze
    // laag "in beeld" — dezelfde soort trigger als de gegarandeerde
    // Amberader-vondst hieronder. De laag blijft `ontgrendeld: false` (dus
    // de frontier blijft op de laag eronder staan) tot alle vijandelijke
    // Heiligdommen vernietigd zijn (`verwerkBelegering` hieronder in de
    // `volgendeBeurt`-pijplijn) — de `while`-lus stopt hier dus altijd,
    // zowel de eerste keer (initialisatie) als op elke latere beurt zolang
    // de laag nog bezet is.
    if (isBezetteLaagHoogte(volgendeHoogte)) {
      if (!huidigeLaag.bezet) {
        lagen = lagen.map((laag) => (laag.hoogte === volgendeHoogte ? initialiseerBezetteLaag(laag) : laag));
        bezetteLaagOntdektEvent = true;
      }
      break;
    }

    lagen = lagen.map((laag) =>
      laag.hoogte === volgendeHoogte ? { ...laag, ontgrendeld: true } : laag
    );
    // Amberader-ontdekking (hoofdstuk 3/14, issue: "toevoeging Goud"): de
    // gegarandeerde eerste Amberader-locatie ligt op `AMBER_ONTDEKKING_LAAG`
    // (world.ts) — deze `while`-lus loopt precies één keer door die hoogte
    // heen op het moment dat hij ontgrendelt, dus dit triggert vanzelf maar
    // één keer per run, net als de laag-ontgrendeling zelf.
    if (volgendeHoogte === AMBER_ONTDEKKING_LAAG) {
      amberOntdektEvent = true;
    }
    // Tweede Amberader-ontdekking (hoofdstuk 3/11/14, issue: "Amberader
    // sowieso op laag 12"): zelfde eenmalige trigger als hierboven, maar op
    // `AMBER_ONTDEKKING_LAAG_2` — de softlock-preventie vlak vóór de Bezette
    // Laag.
    if (volgendeHoogte === AMBER_ONTDEKKING_LAAG_2) {
      tweedeAmberOntdektEvent = true;
    }
    volgendeHoogte += 1;
  }

  return lagen === state.lagen && bezetteLaagOntdektEvent === state.bezetteLaagOntdektEvent
    ? state
    : { ...state, lagen, amberOntdektEvent, tweedeAmberOntdektEvent, bezetteLaagOntdektEvent };
}

// Sluit de "Bezette Laag ontdekt"-melding (Deel 2) — puur een
// UI-bevestiging, zelfde patroon als `sluitAmberOntdektMelding` hieronder.
export function sluitBezetteLaagOntdektMelding(state: GameState): GameState {
  return { ...state, bezetteLaagOntdektEvent: undefined };
}

// Sluit de Amberader-ontdekkingsmelding (hoofdstuk 3/14) — puur een
// UI-bevestiging, zelfde patroon als `sluitKuddeMelding` hierboven.
export function sluitAmberOntdektMelding(state: GameState): GameState {
  return { ...state, amberOntdektEvent: undefined };
}

// Sluit de tweede Amberader-ontdekkingsmelding (hoofdstuk 3/11/14, issue:
// "Amberader sowieso op laag 12") — puur een UI-bevestiging, zelfde patroon
// als `sluitAmberOntdektMelding` hierboven.
export function sluitTweedeAmberOntdektMelding(state: GameState): GameState {
  return { ...state, tweedeAmberOntdektEvent: undefined };
}

// Of er een voltooid Offer Altaar staat (Deel 4) — net als
// `heeftGebouwdeMijn` verderop telt hier niet mee of het wegverbonden is:
// het gaat om het moment van bouwen zelf, niet om lopende productie (het
// Offer Altaar produceert toch niets, zie improvements.ts).
export function heeftOfferAltaar(state: GameState): boolean {
  return state.lagen.some((laag) =>
    laag.tiles.some((tile) => tile.status === "actief" && tile.improvement?.id === "offer-altaar")
  );
}

// Belegering tegen de vijandelijke Heiligdommen van een Bezette Laag
// (hoofdstuk 6, issue: "De Bezette Laag, missionaris en verkenner", Deel 4).
// Zolang de speler geen Missionaris heeft, blijft de bevroren cultuurteller
// (`verwerkProductie` in productie.ts) gewoon bevroren en gebeurt hier niets —
// zodra er wél minstens één Missionaris is, wordt de cultuurproductie van
// deze beurt (dezelfde berekening als `verwerkProductie` normaal zou
// toepassen) omgeleid naar de belegeringsmeter. Bereikt de meter de drempel,
// dan wordt het eerst-onthulde nog-actieve vijandelijke Heiligdom vernietigd
// (positie als tie-break, bij gebrek aan een onthullings-tijdstempel) en
// begint de meter weer bij 0 voor het volgende, indien er nog een resterend
// is — vandaar de `while`-lus, net als `verwerkLaagOntgrendeling` hierboven.
export function verwerkBelegering(state: GameState): GameState {
  const bezetteLaag = state.lagen.find((l) => l.bezet);
  if (!bezetteLaag) return state;
  if (state.stad.missionarissen.length === 0) return state;

  const toevoeging = berekenCultuurProductieDitBeurt(state);
  if (toevoeging <= 0) return state;

  let voortgang = (bezetteLaag.belegeringsVoortgang ?? 0) + toevoeging;
  let tiles = bezetteLaag.tiles;
  let vijandelijkHeiligdomVernietigdEvent = state.vijandelijkHeiligdomVernietigdEvent;

  while (voortgang >= BELEGERINGSDREMPEL) {
    const doelIndex = tiles.findIndex(
      (tile) => tile.status === "actief" && tile.improvement?.id === "vijandelijk-heiligdom"
    );
    if (doelIndex === -1) break; // geen resterend doel: meter blijft op de drempel staan

    tiles = tiles.map((tile, index) =>
      index === doelIndex ? { ...tile, status: "leeg" as const, improvement: undefined } : tile
    );
    voortgang -= BELEGERINGSDREMPEL;
    vijandelijkHeiligdomVernietigdEvent = true;
  }

  // Einde van de Bezette Laag (Deel 6): zodra geen vijandelijk Heiligdom meer
  // over is — noch onthuld-en-actief, noch nog verhuld — wordt de hele laag
  // in één keer volledig onthuld (ook nog niet individueel verkende
  // vakjes), eindigt de Bezette-status en telt de laag vanaf dan als normaal
  // ontgrendeld. Nog niet geconfronteerde vijandelijke Wachttoren-tiles en de
  // cosmetische huisjes blijven daarna gewoon staan (permanent, want alleen
  // een gewonnen Confrontatie maakt een Wachttoren-tile weer leeg — zie
  // `confrontatieBezetteLaag`).
  const heeftNogHeiligdom = tiles.some(
    (tile) =>
      (tile.status === "actief" && tile.improvement?.id === "vijandelijk-heiligdom") ||
      (tile.verhuld && tile.bezetteLaagInhoud === "heiligdom")
  );
  // `bezetteLaag` (hierboven) bestaat alleen zolang `laag.bezet` nog waar is
  // — deze functie draait dus nooit meer opnieuw op een al opgeloste laag,
  // dus geen aparte "was dit al opgelost?"-check nodig.
  const opgelost = !heeftNogHeiligdom;

  if (opgelost) {
    tiles = tiles.map((tile) =>
      !tile.verhuld
        ? tile
        : {
            ...tile,
            verhuld: false,
            improvement:
              tile.bezetteLaagInhoud === "wachttoren"
                ? VIJANDELIJKE_WACHTTOREN
                : tile.bezetteLaagInhoud === "huisje"
                  ? BEZETTE_LAAG_HUISJE
                  : undefined,
            status:
              tile.bezetteLaagInhoud === "wachttoren" || tile.bezetteLaagInhoud === "huisje"
                ? ("actief" as const)
                : tile.status,
          }
    );
  }

  const lagen = state.lagen.map((laag) =>
    laag.hoogte === bezetteLaag.hoogte
      ? {
          ...laag,
          tiles,
          belegeringsVoortgang: voortgang,
          bezet: opgelost ? false : laag.bezet,
          ontgrendeld: opgelost ? true : laag.ontgrendeld,
        }
      : laag
  );

  return { ...state, lagen, vijandelijkHeiligdomVernietigdEvent };
}

// Sluit de "vijandelijk Heiligdom vernietigd"-melding (Deel 4) — puur een
// UI-bevestiging.
export function sluitVijandelijkHeiligdomVernietigdMelding(state: GameState): GameState {
  return { ...state, vijandelijkHeiligdomVernietigdEvent: undefined };
}

// Sluit de "vijandelijk Heiligdom onthuld"-melding (Deel 3/4), gezet door
// `verken` verderop zodra een onthuld vakje een vijandelijk Heiligdom
// blijkt te zijn.
export function sluitVijandelijkHeiligdomOnthuldMelding(state: GameState): GameState {
  return { ...state, vijandelijkHeiligdomOnthuldEvent: undefined };
}

// Of Verkenning uitgevoerd kan worden (Deel 3): een actieve Bezette Laag,
// minstens één Verkenner, en de beurt-limiet (hoogstens 1 keer per beurt,
// zelfde soort limiet als de settler-acties) nog niet gebruikt.
export function kanVerkennen(state: GameState): boolean {
  return (
    state.lagen.some((l) => l.bezet) &&
    state.stad.verkenners.length > 0 &&
    !state.verkenningGedaanDitBeurt &&
    state.wetenschap >= VERKENNING_KOSTEN_WETENSCHAP
  );
}

// Alle nog verhulde vakjes van de actieve Bezette Laag — de geldige
// klik-doelen tijdens Verkenning (zelfde soort "bereikbare posities"-lijst
// als `onbemandeWachttorenPosities`).
export function verhuldeBezetteLaagPosities(state: GameState): Settler[] {
  const bezetteLaag = state.lagen.find((l) => l.bezet);
  if (!bezetteLaag) return [];
  return bezetteLaag.tiles.filter((tile) => tile.verhuld).map((tile) => ({ hoogte: bezetteLaag.hoogte, positieInLaag: tile.positieInLaag }));
}

// Voert een Verkenning uit op één door de speler gekozen, nog verhuld vakje
// van de actieve Bezette Laag (Deel 3): kost `VERKENNING_KOSTEN_WETENSCHAP`
// wetenschap (dezelfde pool als de technologie-boom, hoofdstuk 3/9 — een
// bewuste afweging tussen verder verkennen en voortgang in de techboom),
// onthult het vakje als Wachttoren, Heiligdom of cosmetisch huisje (of, op
// het neutrale vakje, blijft het gewoon een leeg vakje). Negeert de aanroep
// stilzwijgend bij een ongeldige aanroep — zelfde veilige-aanroep-conventie
// als `startBouw`/`bemanWachttoren`.
export function verken(state: GameState, positieInLaag: number): GameState {
  if (!kanVerkennen(state)) return state;

  const bezetteLaag = state.lagen.find((l) => l.bezet)!;
  const tile = bezetteLaag.tiles[positieInLaag];
  if (!tile?.verhuld) return state;

  const inhoudImprovement =
    tile.bezetteLaagInhoud === "wachttoren"
      ? VIJANDELIJKE_WACHTTOREN
      : tile.bezetteLaagInhoud === "heiligdom"
        ? VIJANDELIJK_HEILIGDOM
        : tile.bezetteLaagInhoud === "huisje"
          ? BEZETTE_LAAG_HUISJE
          : undefined;

  const lagen = state.lagen.map((laag) =>
    laag.hoogte !== bezetteLaag.hoogte
      ? laag
      : {
          ...laag,
          tiles: laag.tiles.map((t, index) =>
            index !== positieInLaag
              ? t
              : {
                  ...t,
                  verhuld: false,
                  improvement: inhoudImprovement,
                  status: inhoudImprovement ? ("actief" as const) : t.status,
                }
          ),
        }
  );

  return {
    ...state,
    lagen,
    wetenschap: state.wetenschap - VERKENNING_KOSTEN_WETENSCHAP,
    verkenningGedaanDitBeurt: true,
    vijandelijkHeiligdomOnthuldEvent:
      tile.bezetteLaagInhoud === "heiligdom" ? true : state.vijandelijkHeiligdomOnthuldEvent,
  };
}
