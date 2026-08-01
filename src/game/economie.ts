// Resource-economie (M3): gedeelde opslag met cap voor hout/steen/erts/goud,
// een losse voedselvoorraad, en een productiewachtrij die per beurt
// bouwmateriaal verbruikt tot een improvement voltooid is. Zie
// frontier-city-design-doc.md hoofdstuk 5.
//
// Uitputting & ghost towns (M4): elke actieve land-improvement telt af vanaf
// `uitputtingBeurten` (hoofdstuk 4/7). Bij nul wordt de tile een permanente,
// onbebouwbare ghost-town-tile die niet meer produceert.
//
// Cultuur & laag-ontgrendeling (M5): cultuur is een voortgangs-valuta zonder
// opslag-cap (hoofdstuk 5). Zodra de cumulatieve cultuur de drempel van de
// eerstvolgende vergrendelde laag haalt, ontgrendelt die laag automatisch
// (fog of war verdwijnt — hoofdstuk 2).
//
// Groei & verval (M6): zodra voedsel de groeidrempel haalt kan de speler
// bewust de groei-tier klein→middel starten (geen automatische ontgrendeling
// zoals cultuur, hoofdstuk 11), die net als een land-improvement een aantal
// beurten rijptijd kost. Raakt het gebouwde land grotendeels uitgeput, dan
// verschijnt een "kritiek"-waarschuwing; blijft dat zo, dan stort de stad in.
// In de MVP (hoofdstuk 13: één stad, nog geen frontier-verplaatsing) is er
// geen volgende stad om naartoe te gaan, dus eindigt een volledige
// ineenstorting de hele run: de speler begint de tutorial opnieuw
// (hoofdstuk 4/11, permadeath-risico op run-niveau i.p.v. alleen stadsniveau).
//
// Militair (M7, hoofdstuk 6): Soldaat-eenheden rekruteren (zelfde
// wachtrij-patroon als groei) bouwt legerwaarde op, samen met de passieve
// verdedigingsbonus van actieve Wachttoren-tiles. Een confrontatie vergelijkt
// die legerwaarde met de dreiging op de actieve laag via een winkans-formule
// (geen gegarandeerde uitkomst) — winst levert buit op, verlies versnelt de
// uitputting van een deel van de actieve land-tiles (schade, geen
// instant-verlies van de stad zelf).
//
// Exacte getallen (opslag-cap, kosten, productiesnelheden, uitputtingssnelheid,
// winkans-formule) zijn nog niet vastgelegd in het design-document
// (hoofdstuk 14) — de waarden hieronder zijn bewuste MVP-placeholders, geen
// definitieve balans.

import { improvementPastOpTerrein, SOLDAAT, WOONWIJK } from "./improvements";
import { City, ConfrontatieResultaat, GameState, Improvement, MateriaalType, ResourceType, Tile } from "./types";
import {
  cultuurKostenVoorLaag,
  hoogsteOntgrendeldeLaag,
  maakInitieleWereld,
  STAD_POSITIE,
  VOEDSEL_DREMPEL_GROEI,
} from "./world";
import { isTileVerbondenMetStad, magSettlerNaar, SettlerRichting, volgendePositie } from "./wegen";

export const OPSLAG_CAP = 30;

// Bouw-ritme (M10, hoofdstuk 16): na een bouwkeuze (of het bewust overslaan
// ervan) mag pas na zoveel beurten weer een nieuw bouwproject gestart worden
// — de tussenliggende beurten zijn voor de settler (wegen aanleggen).
const BOUW_RITME_BEURTEN = 3;

// Verval-tuning (M6, hoofdstuk 4/14): bewuste MVP-placeholders, net als de
// overige nog niet vastgelegde balansgetallen. Een minimum-aantal ghost towns
// naast de ratio voorkomt dat de allereerste uitgeputte tile al meteen een
// crisis veroorzaakt.
const KRITIEK_MIN_UITGEPUTTE_TILES = 3;
const KRITIEK_UITPUTTINGSRATIO = 0.6;
const VERVAL_BEURTEN = 5;

// Militair-tuning (M7, hoofdstuk 6/14): net als de verval-tuning bewuste
// MVP-placeholders. `WINKANS_MIN`/`WINKANS_MAX` zorgen dat een confrontatie
// nooit een gegarandeerde uitkomst is, ook bij extreme krachtsverschillen.
const WINKANS_MIN = 0.05;
const WINKANS_MAX = 0.95;
const BUIT_GOUD_FACTOR = 0.5;
const SCHADE_TILES_AANTAL = 2;
const SCHADE_BEURTEN = 3;

const STARTVOORRAAD: Record<MateriaalType, number> = {
  hout: 8,
  steen: 6,
  erts: 0,
  goud: 0,
};

export function maakInitieleSpelStatus(): GameState {
  return {
    stad: {
      naam: "Holenrots",
      grootte: "klein",
      relics: [],
      vervalStatus: "gezond",
      leger: 0,
    },
    lagen: maakInitieleWereld(),
    voorraad: { ...STARTVOORRAAD },
    opslagCap: OPSLAG_CAP,
    voedsel: 0,
    cultuur: 0,
    beurt: 1,
    bouwKeuzeGedaanDitBeurt: false,
    settlerActieGedaanDitBeurt: false,
    volgendeBouwBeurt: 1,
  };
}

function isMateriaalType(resource: string): resource is MateriaalType {
  return resource === "hout" || resource === "steen" || resource === "erts" || resource === "goud";
}

type ResourceKey = keyof Improvement["kosten"];

// Past productie toe van elke actieve land-improvement met een "productie"-effect.
// Bouwmaterialen lopen tegen de gedeelde opslag-cap aan; voedsel niet (hoofdstuk 5).
function verwerkProductie(state: GameState): GameState {
  const voorraad = { ...state.voorraad };
  let voedsel = state.voedsel;
  let cultuur = state.cultuur;

  for (const laag of state.lagen) {
    for (const tile of laag.tiles) {
      const effect = tile.improvement?.effect;
      if (tile.status !== "actief" || effect?.type !== "productie" || !effect.resource || !effect.waarde) {
        continue;
      }

      // Wegverbinding (M10, hoofdstuk 16): een land improvement produceert
      // pas zodra zijn vakje via een wegennetwerk met de stad verbonden is —
      // de stad zelf heeft geen `soort: "land"`-improvement, dus die blijft
      // hierdoor ongemoeid.
      if (tile.improvement?.soort === "land" && !isTileVerbondenMetStad(state.lagen, laag.hoogte, tile.positieInLaag)) {
        continue;
      }

      if (effect.resource === "voedsel") {
        voedsel += effect.waarde;
      } else if (effect.resource === "cultuur") {
        cultuur += effect.waarde;
      } else if (isMateriaalType(effect.resource)) {
        voorraad[effect.resource] = Math.min(
          state.opslagCap,
          voorraad[effect.resource] + effect.waarde
        );
      }
    }
  }

  return { ...state, voorraad, voedsel, cultuur };
}

// Ontgrendelt de eerstvolgende vergrendelde laag zodra de cumulatieve cultuur
// de drempel haalt (M5, hoofdstuk 2/5). Cultuur wordt niet "uitgegeven" —
// het blijft een oplopende teller, dus bij een grote overschot ontgrendelen
// meteen meerdere lagen na elkaar in dezelfde beurt.
function verwerkLaagOntgrendeling(state: GameState): GameState {
  let lagen = state.lagen;
  let volgendeHoogte = hoogsteOntgrendeldeLaag(lagen) + 1;

  while (
    volgendeHoogte <= lagen.length &&
    state.cultuur >= cultuurKostenVoorLaag(volgendeHoogte)
  ) {
    lagen = lagen.map((laag) =>
      laag.hoogte === volgendeHoogte ? { ...laag, ontgrendeld: true } : laag
    );
    volgendeHoogte += 1;
  }

  return lagen === state.lagen ? state : { ...state, lagen };
}

interface BouwInvestering {
  nieuweVoortgang: Partial<Record<ResourceType, number>>;
  voltooid: boolean;
}

// Investeert dit beurt-aandeel van de resterende bouwkosten vanuit de
// gedeelde opslag, als er voldoende voorraad is. Bij onvoldoende voorraad
// stokt de bouw deze beurt (geen gedeeltelijke betaling) — zie hoofdstuk 5,
// "geen instant-klik, maar een productiewachtrij". Gedeeld tussen de
// land-tile-bouwwachtrij (M3) en de stadsgroei-bouwwachtrij (M6), die verder
// los van elkaar staan (tile vs. stad).
function investeerInBouwkosten(
  improvement: Improvement,
  voortgang: Partial<Record<ResourceType, number>>,
  voorraad: Record<MateriaalType, number>
): BouwInvestering | null {
  const teBetalen: Partial<Record<ResourceKey, number>> = {};
  for (const key of Object.keys(voortgang) as ResourceKey[]) {
    const resterend = voortgang[key] ?? 0;
    if (resterend <= 0) continue;
    const totaal = improvement.kosten[key] ?? 0;
    const perBeurt = Math.ceil(totaal / improvement.bouwtijdBeurten);
    teBetalen[key] = Math.min(perBeurt, resterend);
  }

  const kanBetalen = (Object.keys(teBetalen) as ResourceKey[]).every((key) => {
    if (!isMateriaalType(key)) return true; // niet-materiaalkosten komen hier nog niet voor
    return voorraad[key] >= (teBetalen[key] ?? 0);
  });

  if (!kanBetalen) return null;

  const nieuweVoortgang = { ...voortgang };
  for (const key of Object.keys(teBetalen) as ResourceKey[]) {
    const bedrag = teBetalen[key] ?? 0;
    if (isMateriaalType(key)) voorraad[key] -= bedrag;
    nieuweVoortgang[key] = (nieuweVoortgang[key] ?? 0) - bedrag;
  }

  const voltooid = (Object.values(nieuweVoortgang) as number[]).every((rest) => rest <= 0);
  return { nieuweVoortgang, voltooid };
}

function verwerkTileInAanbouw(tile: Tile, voorraad: Record<MateriaalType, number>): Tile {
  const improvement = tile.improvement;
  if (!improvement || !tile.bouwVoortgang) return tile;

  const resultaat = investeerInBouwkosten(improvement, tile.bouwVoortgang, voorraad);
  if (!resultaat) return tile;

  if (resultaat.voltooid) {
    return {
      ...tile,
      status: "actief",
      bouwVoortgang: undefined,
      beurtenTotUitputting: improvement.uitputtingBeurten,
    };
  }

  return { ...tile, bouwVoortgang: resultaat.nieuweVoortgang };
}

// Telt de resterende levensduur van elke actieve land-improvement af. Bij nul
// wordt de tile een permanente ghost-town-tile: onbebouwbaar en stopt met
// produceren (zie verwerkProductie, die alleen "actief"-tiles meetelt).
// City-tiles en tiles zonder `uitputtingBeurten` slaan we over (hoofdstuk 4:
// alleen land-improvements putten uit).
function verwerkUitputting(state: GameState): GameState {
  const lagen = state.lagen.map((laag) => ({
    ...laag,
    tiles: laag.tiles.map((tile) => {
      if (tile.status !== "actief" || tile.beurtenTotUitputting === undefined) {
        return tile;
      }

      const resterend = tile.beurtenTotUitputting - 1;
      if (resterend <= 0) {
        return { ...tile, status: "ghost_town" as const, beurtenTotUitputting: undefined };
      }

      return { ...tile, beurtenTotUitputting: resterend };
    }),
  }));

  return { ...state, lagen };
}

function verwerkBouwwachtrij(state: GameState): GameState {
  const voorraad = { ...state.voorraad };

  const lagen = state.lagen.map((laag) => ({
    ...laag,
    tiles: laag.tiles.map((tile) =>
      tile.status === "in_aanbouw" ? verwerkTileInAanbouw(tile, voorraad) : tile
    ),
  }));

  return { ...state, lagen, voorraad };
}

// Telt de gebouwde land-tiles (actief + ghost_town) en hoeveel daarvan al
// zijn uitgeput — de basis voor de "kritiek"-verval-drempel (M6, hoofdstuk 4).
// City-tiles tellen niet mee (alleen land put uit, zie ook verwerkUitputting).
function telLandTiles(state: GameState): { totaal: number; ghostTowns: number } {
  let totaal = 0;
  let ghostTowns = 0;

  for (const laag of state.lagen) {
    for (const tile of laag.tiles) {
      const isGebouwdeLandTile =
        tile.improvement?.soort === "land" &&
        (tile.status === "actief" || tile.status === "ghost_town");
      if (!isGebouwdeLandTile) continue;

      totaal += 1;
      if (tile.status === "ghost_town") ghostTowns += 1;
    }
  }

  return { totaal, ghostTowns };
}

// Verval (M6, hoofdstuk 4): zodra het gebouwde land grotendeels is uitgeput
// verschijnt een zichtbare "kritiek"-waarschuwing voor meerdere beurten.
// Reageert de speler op tijd (bijv. nieuw land ontsluiten door een laag te
// ontgrendelen, wat de uitputtingsratio weer verlaagt) dan wordt de stad
// weer "gezond" en blijft alles behouden. Blijft de ratio kritiek tot de
// aftelling nul bereikt, dan stort de stad in — de centrale risk/reward-gok
// van elke stad-episode. Omdat de MVP maar één stad kent (hoofdstuk 13), is
// er geen volgende stad om de run mee door te laten lopen: de hele run
// eindigt en de tutorial herstart vanaf een verse spelstatus (hoofdstuk 4/11).
function verwerkVerval(state: GameState): GameState {
  const { totaal, ghostTowns } = telLandTiles(state);
  const isKritiekeUitputting =
    ghostTowns >= KRITIEK_MIN_UITGEPUTTE_TILES &&
    totaal > 0 &&
    ghostTowns / totaal >= KRITIEK_UITPUTTINGSRATIO;

  if (state.stad.vervalStatus === "gezond") {
    if (!isKritiekeUitputting) return state;
    return {
      ...state,
      stad: { ...state.stad, vervalStatus: "kritiek", vervalBeurtenResterend: VERVAL_BEURTEN },
    };
  }

  if (!isKritiekeUitputting) {
    return {
      ...state,
      stad: { ...state.stad, vervalStatus: "gezond", vervalBeurtenResterend: undefined },
    };
  }

  const resterend = (state.stad.vervalBeurtenResterend ?? VERVAL_BEURTEN) - 1;
  if (resterend > 0) {
    return { ...state, stad: { ...state.stad, vervalBeurtenResterend: resterend } };
  }

  // Volledige ineenstorting (issue: "run eindigen wanneer stad uitgeput is"):
  // de run zelf eindigt hier, niet alleen de groei-tier/relics van de stad —
  // een verse spelstatus, met de ineenstortingsvlag erbovenop zodat de UI het
  // game-over-scherm toont tot de speler bevestigt. `laatsteRunStatistieken`
  // is een momentopname van de net geëindigde run (issue: "beurten/steden/
  // lagen tonen op het game-over-scherm") — moet vóór de reset genomen
  // worden, anders is er niets meer over om te tonen.
  return {
    ...maakInitieleSpelStatus(),
    laatsteIneenstorting: true,
    laatsteRunStatistieken: {
      beurten: state.beurt,
      stedenGebouwd: 1, // MVP: precies 1 stad per run (hoofdstuk 13, geen frontier-verplaatsing)
      hoogsteLaag: hoogsteOntgrendeldeLaag(state.lagen),
    },
  };
}

// Sluit het ineenstortingsscherm (issue: "intro en game over scherm"). Puur
// een UI-bevestiging — de daadwerkelijke gevolgen van de ineenstorting (de
// volledige run-reset) zijn al door `verwerkVerval` toegepast op het moment
// dat de vlag gezet werd.
export function bevestigIneenstorting(state: GameState): GameState {
  return { ...state, laatsteIneenstorting: false, laatsteRunStatistieken: undefined };
}

// Statistieken voor het historiescherm van de lopende run (issue:
// "spel-icoontje ... historie van deze run ... aantal improvements gebouwd,
// hoeveel vervallen, hoeveel steden, en je grootste stad"). Hergebruikt
// `telLandTiles` (M6) — "gebouwd" telt hier voltooide land-tiles
// (actief + ghost_town), dezelfde definitie als de verval-drempel gebruikt.
export function berekenHistorieStatistieken(state: GameState): {
  improvementenGebouwd: number;
  vervallen: number;
  steden: number;
  grootsteStad: City["grootte"];
} {
  const { totaal, ghostTowns } = telLandTiles(state);
  return {
    improvementenGebouwd: totaal,
    vervallen: ghostTowns,
    steden: 1, // MVP: precies 1 stad per run (hoofdstuk 13)
    grootsteStad: state.stad.grootte,
  };
}

// Betaalt de bouwkosten van een lopende stadsgroei (M6). Los van de
// land-tile-bouwwachtrij omdat groei de stad zelf upgradet, geen land-vakje.
function verwerkGroei(state: GameState): GameState {
  const groeiInAanbouw = state.stad.groeiInAanbouw;
  if (!groeiInAanbouw) return state;

  const voorraad = { ...state.voorraad };
  const resultaat = investeerInBouwkosten(groeiInAanbouw.improvement, groeiInAanbouw.voortgang, voorraad);
  if (!resultaat) return state;

  if (resultaat.voltooid) {
    return {
      ...state,
      voorraad,
      stad: { ...state.stad, grootte: "middel", groeiInAanbouw: undefined },
    };
  }

  return {
    ...state,
    voorraad,
    stad: {
      ...state.stad,
      groeiInAanbouw: { ...groeiInAanbouw, voortgang: resultaat.nieuweVoortgang },
    },
  };
}

// Betaalt de bouwkosten van een lopende Soldaat-rekrutering (M7). Zelfde
// wachtrij-patroon als verwerkGroei, los van de land-tile-bouwwachtrij omdat
// een unit geen land-vakje inneemt.
function verwerkRecrutering(state: GameState): GameState {
  const legerInAanbouw = state.stad.legerInAanbouw;
  if (!legerInAanbouw) return state;

  const voorraad = { ...state.voorraad };
  const resultaat = investeerInBouwkosten(legerInAanbouw.improvement, legerInAanbouw.voortgang, voorraad);
  if (!resultaat) return state;

  if (resultaat.voltooid) {
    return {
      ...state,
      voorraad,
      stad: {
        ...state.stad,
        leger: state.stad.leger + (legerInAanbouw.improvement.effect.waarde ?? 0),
        legerInAanbouw: undefined,
      },
    };
  }

  return {
    ...state,
    voorraad,
    stad: {
      ...state.stad,
      legerInAanbouw: { ...legerInAanbouw, voortgang: resultaat.nieuweVoortgang },
    },
  };
}

// Start de groei-tier klein→middel (M6), als de voedseldrempel gehaald is en
// er niet al een groei loopt. Dit is een bewuste spelerskeuze, geen
// automatische ontgrendeling zoals cultuur (M5) — hoofdstuk 11: "doorgroeien
// ... is een bewuste gok, geen gratis extra beloning". Voedsel wordt niet
// "uitgegeven": net als cultuur blijft het een oplopende teller die de
// drempel markeert (hoofdstuk 5).
export function startGroei(state: GameState): GameState {
  if (
    state.stad.grootte !== "klein" ||
    state.stad.groeiInAanbouw ||
    state.voedsel < VOEDSEL_DREMPEL_GROEI
  ) {
    return state;
  }

  return {
    ...state,
    stad: {
      ...state.stad,
      groeiInAanbouw: { improvement: WOONWIJK, voortgang: { ...WOONWIJK.kosten } },
    },
  };
}

// Start het rekruteren van een Soldaat (M7), als er niet al een rekrutering
// loopt. Net als startGroei een bewuste spelerskeuze via een wachtrij, geen
// eigen valuta (hoofdstuk 5: "Militair heeft bewust géén eigen valuta: puur
// directe krachtsvergelijking op het moment zelf" — die krachtsvergelijking
// gebeurt in `confrontatie` hieronder, dit start alleen de opbouw ervan).
export function startRecrutering(state: GameState): GameState {
  if (state.stad.legerInAanbouw) return state;

  return {
    ...state,
    stad: {
      ...state.stad,
      legerInAanbouw: { improvement: SOLDAAT, voortgang: { ...SOLDAAT.kosten } },
    },
  };
}

// Totale legerwaarde (hoofdstuk 6: "units + muur/wachttoren-bonus"): opgebouwde
// Soldaat-eenheden plus de passieve verdedigingsbonus van elke actieve
// Wachttoren-tile, ongeacht op welke laag die staat (er is in de MVP maar
// één actieve stad, hoofdstuk 13).
export function berekenLegerwaarde(state: GameState): number {
  let waarde = state.stad.leger;

  for (const laag of state.lagen) {
    for (const tile of laag.tiles) {
      const effect = tile.improvement?.effect;
      if (tile.status === "actief" && effect?.type === "verdediging" && effect.waarde) {
        waarde += effect.waarde;
      }
    }
  }

  return waarde;
}

function berekenWinkans(eigenLegerwaarde: number, tegenstanderSterkte: number): number {
  const totaal = eigenLegerwaarde + tegenstanderSterkte;
  const ruweKans = totaal === 0 ? 0.5 : eigenLegerwaarde / totaal;
  return Math.min(WINKANS_MAX, Math.max(WINKANS_MIN, ruweKans));
}

// Militaire confrontatie (M7, hoofdstuk 6): vergelijkt de eigen legerwaarde
// met de dreiging op de actieve (hoogst ontgrendelde) laag via een winkans —
// nooit een gegarandeerde uitkomst (WINKANS_MIN/MAX). Winst levert direct
// buit (goud) op. Verlies is geen instant game-over: het versnelt de
// uitputting van een beperkt aantal actieve land-tiles (schade), wat de
// bestaande verval-cyclus (M6) dichterbij kan brengen in plaats van de stad
// meteen te laten instorten.
export function confrontatie(state: GameState): GameState {
  const actieveLaag = state.lagen.find(
    (laag) => laag.hoogte === hoogsteOntgrendeldeLaag(state.lagen)
  );
  const tegenstanderSterkte = actieveLaag?.dreigingsniveau ?? 0;
  const eigenLegerwaarde = berekenLegerwaarde(state);
  const winkans = berekenWinkans(eigenLegerwaarde, tegenstanderSterkte);
  const gewonnen = Math.random() < winkans;

  if (gewonnen) {
    const buitGoud = Math.round(tegenstanderSterkte * BUIT_GOUD_FACTOR);
    const voorraad = {
      ...state.voorraad,
      goud: Math.min(state.opslagCap, state.voorraad.goud + buitGoud),
    };
    const laatsteConfrontatie: ConfrontatieResultaat = {
      winkans,
      gewonnen,
      eigenLegerwaarde,
      tegenstanderSterkte,
      buitGoud,
    };
    return { ...state, voorraad, laatsteConfrontatie };
  }

  let geraakt = 0;
  const lagen = state.lagen.map((laag) => ({
    ...laag,
    tiles: laag.tiles.map((tile) => {
      if (
        geraakt >= SCHADE_TILES_AANTAL ||
        tile.status !== "actief" ||
        tile.improvement?.soort !== "land" ||
        tile.beurtenTotUitputting === undefined
      ) {
        return tile;
      }

      geraakt += 1;
      return { ...tile, beurtenTotUitputting: Math.max(1, tile.beurtenTotUitputting - SCHADE_BEURTEN) };
    }),
  }));

  const laatsteConfrontatie: ConfrontatieResultaat = {
    winkans,
    gewonnen,
    eigenLegerwaarde,
    tegenstanderSterkte,
    geraakteTiles: geraakt,
  };
  return { ...state, lagen, laatsteConfrontatie };
}

// Start de bouw van een land improvement op de tile die de speler zelf heeft
// aangewezen (klik-op-tile plaatsing, zie GameRoot: `plaatsingsImprovement`).
// Geeft de ongewijzigde status terug als die tile niet (meer) leeg is, of als
// het terrein niet aan de eis van de improvement voldoet (issue: "houtkap
// alleen op bos" e.d.) — de aanroeper controleert dit al vóór het tonen van
// de "hier bouwen?"-vraag, dit is een tweede, veilige check. Verbruikt altijd
// de bouwkeuze van deze beurt (hoofdstuk 11: hoogstens 1 bouwkeuze per beurt).
export function startBouw(
  state: GameState,
  laagHoogte: number,
  improvement: Improvement,
  positieInLaag: number
): GameState {
  const lagen = state.lagen.map((laag) => {
    if (laag.hoogte !== laagHoogte) return laag;

    const doelTile = laag.tiles[positieInLaag];
    if (!doelTile || doelTile.status !== "leeg") return laag;
    if (!improvementPastOpTerrein(improvement, doelTile.terrein)) return laag;

    const tiles = laag.tiles.map((tile, index) => {
      if (index !== positieInLaag) return tile;
      return {
        ...tile,
        status: "in_aanbouw" as const,
        improvement,
        bouwVoortgang: { ...improvement.kosten },
      };
    });

    return { ...laag, tiles };
  });

  return {
    ...state,
    lagen,
    bouwKeuzeGedaanDitBeurt: true,
    volgendeBouwBeurt: state.beurt + BOUW_RITME_BEURTEN,
  };
}

// Sluit de bouw-pop-up zonder te bouwen (hoofdstuk 11: de speler mag een
// beurt ook overslaan) — verbruikt, net als `startBouw`, de bouwkeuze van
// deze beurt én het eerstvolgende bouwmoment (hoofdstuk 16: bouw-ritme).
export function sluitBouwKeuze(state: GameState): GameState {
  return { ...state, bouwKeuzeGedaanDitBeurt: true, volgendeBouwBeurt: state.beurt + BOUW_RITME_BEURTEN };
}

// Verplaatst de settler één vakje (hoofdstuk 16), als er niet al een
// settler-actie deze beurt gebruikt is en het doelvakje binnen ontgrendeld
// gebied ligt. Negeert de aanroep stilzwijgend bij een ongeldige zet — de UI
// (SettlerPaneel) controleert dit al vóór het tonen van de knop, dit is een
// tweede, veilige check (zelfde patroon als `startBouw`/terrein-eisen).
export function verplaatsSettler(state: GameState, richting: SettlerRichting): GameState {
  if (!state.settler || state.settlerActieGedaanDitBeurt) return state;

  const doel = volgendePositie(state.settler, richting);
  if (!magSettlerNaar(state.lagen, doel)) return state;

  return { ...state, settler: doel, settlerActieGedaanDitBeurt: true };
}

// Legt een weg aan op het vakje waar de settler nu staat (hoofdstuk 16): geen
// grondstoffen, alleen de settler-actie van deze beurt. Geen effect als er
// al een weg ligt of de settler deze beurt al gehandeld heeft.
export function legWegAan(state: GameState): GameState {
  if (!state.settler || state.settlerActieGedaanDitBeurt) return state;

  const { hoogte, positieInLaag } = state.settler;
  const laag = state.lagen.find((l) => l.hoogte === hoogte);
  if (!laag || laag.tiles[positieInLaag]?.heeftWeg) return state;

  const lagen = state.lagen.map((l) => {
    if (l.hoogte !== hoogte) return l;
    const tiles = l.tiles.map((tile, index) => (index === positieInLaag ? { ...tile, heeftWeg: true } : tile));
    return { ...l, tiles };
  });

  return { ...state, lagen, settlerActieGedaanDitBeurt: true };
}

// Verwerkt één spelbeurt: eerst productie van actieve improvements (incl.
// cultuur), dan laag-ontgrendeling op basis van die cultuur (M5), dan
// uitputting van de actieve tiles (M4), dan verval op basis van die
// uitputting (M6), dan verbruik/voortgang van de land-tile-bouwwachtrij, de
// stadsgroei-bouwwachtrij (M6) en de Soldaat-rekruteringswachtrij (M7), dan
// de beurtteller ophogen. Een tile die deze beurt net voltooid wordt, begint
// pas volgende beurt met aftellen. Zet ook de bouwkeuze-vlag (hoofdstuk 11)
// weer terug, zodat de bouw-pop-up bij het begin van de nieuwe beurt weer
// verschijnt.
//
// Stort de stad deze beurt volledig in, dan geeft `verwerkVerval` al een
// verse, gereset spelstatus terug (issue: "run eindigen wanneer stad
// uitgeput is") — de resterende stappen (bouwwachtrijen, beurtteller) slaan
// we dan over, anders zou de net herstarte tutorial meteen op beurt 2 beginnen.
export function volgendeBeurt(state: GameState): GameState {
  const naProductie = verwerkProductie(state);
  const naOntgrendeling = verwerkLaagOntgrendeling(naProductie);
  const naUitputting = verwerkUitputting(naOntgrendeling);
  const naVerval = verwerkVerval(naUitputting);
  if (naVerval.laatsteIneenstorting) return naVerval;

  const naBouw = verwerkBouwwachtrij(naVerval);
  const naGroei = verwerkGroei(naBouw);
  const naRecrutering = verwerkRecrutering(naGroei);
  const nieuweBeurt = naRecrutering.beurt + 1;

  // De settler verschijnt bij de stad zodra beurt 2 begint (hoofdstuk 16) —
  // en blijft daarna gewoon staan waar de speler 'm laatst neerzette.
  const settler =
    naRecrutering.settler ?? (nieuweBeurt >= 2 ? { hoogte: 1, positieInLaag: STAD_POSITIE } : undefined);

  return {
    ...naRecrutering,
    beurt: nieuweBeurt,
    bouwKeuzeGedaanDitBeurt: false,
    settlerActieGedaanDitBeurt: false,
    settler,
  };
}
