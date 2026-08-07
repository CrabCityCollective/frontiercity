// Beschrijft een tile in mensentaal voor de klik-op-tile-info-pop-up (naam,
// soort, kort wat je erop kunt bouwen/wat het doet). Puur een leesfunctie —
// verandert geen spelstatus, dus hoort hier naast de andere pure
// game-logica-modules in plaats van in een component.

import { bouwStagneertVolgendeBeurt, resterendeBouwBeurten } from "./bouwwachtrij";
import { CATEGORIE_LABELS, MATERIAAL_LABELS, TERREIN_LABELS } from "./improvements";
import { isWachttorenBemand } from "./indringersEnDieren";
import { WACHTTOREN_VOEDSEL_VERBRUIK } from "./productie";
import { City, Improvement, Layer, MateriaalType, ResourceType, Tile } from "./types";
import { isTileVerbondenMetStad } from "./wegen";
import { hoogsteOntgrendeldeLaag, isVooruitkijkLaag } from "./world";

export interface TileInfo {
  titel: string;
  ondertitel?: string;
  tekst: string;
}

// `opFrontier` is alleen relevant voor cultuurproductie (Heiligdom,
// hoofdstuk 6): volle opbrengst op de frontier-laag zelf, de helft op elke
// laag daaronder — zie `verwerkProductie` in economie.ts voor dezelfde regel.
function effectBeschrijving(improvement: Improvement, opFrontier = true): string {
  const { effect } = improvement;
  if (effect.type === "productie" && effect.resource && effect.waarde) {
    if (effect.resource === "cultuur" && !opFrontier) {
      return `Levert +${effect.waarde / 2} cultuur per beurt (halve opbrengst — niet op de frontier-laag).`;
    }
    return `Levert +${effect.waarde} ${effect.resource} per beurt.`;
  }
  if (effect.type === "verdediging" && effect.waarde) {
    return `Geeft +${effect.waarde} verdediging bij een militaire confrontatie, en beschermt deze laag én de laag eronder tegen indringers-tribuut.`;
  }
  if (effect.type === "opslag" && effect.waarde) {
    return `Verhoogt de opslag-cap met +${effect.waarde}, direct bij voltooiing.`;
  }
  if (effect.type === "stad") {
    return "Het centrum van je nederzetting.";
  }
  // Bezette Laag (hoofdstuk 6, issue: "De Bezette Laag, missionaris en
  // verkenner", Deel 1/4/5) — vijandelijke tile-varianten en het cosmetische
  // huisje hebben geen productie-/verdedigingseffect, maar wel een eigen
  // korte omschrijving.
  if (effect.type === "dreiging") {
    return "Een vijandelijke Wachttoren. Vereist een eigen, bemande Wachttoren op de laag eronder om een Confrontatie aan te gaan.";
  }
  if (effect.type === "belegeringsdoel") {
    return "Een vijandelijk Heiligdom. Belegeringsdoel zolang je minstens één Missionaris hebt.";
  }
  if (effect.type === "legerkamp") {
    return "Elke hieraan toegewezen Soldaat telt mee als legerwaarde bij een Confrontatie tegen een Bezette Laag, ongeacht op welke laag dit Legerkamp staat.";
  }
  if (effect.type === "ontgrendelt-missionaris") {
    return "Ontgrendelt de Missionaris als trainbare eenheid.";
  }
  if (effect.type === "decoratief") {
    return "Een verlaten huisje. Geen functie, niet interactief.";
  }
  return "";
}

// Beschrijft de resterende grondstoffen en bouwtijd van een tile-in-aanbouw
// (issue: "bouwproces inzichtelijk maken" — hoeveel grondstoffen nog nodig
// zijn, en zolang de voorraad het bijhoudt, hoeveel beurten het nog duurt).
// Alleen zichtbaar via de tile-info-pop-up, dus pas berekend als de speler
// er daadwerkelijk op klikt — geen doorlopende UI-weergave.
function bouwVoortgangBeschrijving(
  tile: Tile & { bouwVoortgang: Partial<Record<ResourceType, number>> },
  improvement: Improvement,
  voorraad: Record<MateriaalType, number>
): string {
  const resterend = (Object.entries(tile.bouwVoortgang) as [ResourceType, number][]).filter(
    ([, aantal]) => aantal > 0
  );
  if (resterend.length === 0) return "";

  const grondstoffenTekst = resterend
    .map(([resource, aantal]) => `${aantal} ${MATERIAAL_LABELS[resource as MateriaalType] ?? resource}`)
    .join(", ");

  if (bouwStagneertVolgendeBeurt(improvement, tile.bouwVoortgang, voorraad)) {
    return ` Nog nodig: ${grondstoffenTekst}. Let op: door een tekort aan grondstoffen wordt hier de volgende beurt niet aan gebouwd.`;
  }

  const beurten = resterendeBouwBeurten(improvement, tile.bouwVoortgang);
  return ` Nog nodig: ${grondstoffenTekst}. Nog ${beurten} ${beurten === 1 ? "beurt" : "beurten"} tot voltooiing.`;
}

// Geeft de info voor de tile op `positieInLaag` binnen `laag`. Onontgrendelde
// lagen (fog of war / vooruitkijk) hebben geen tile-detail — daar tonen we
// alleen wat er over de laag zelf bekend is (hoofdstuk 2).
export function beschrijfTile(
  laag: Layer,
  lagen: Layer[],
  stad: City,
  positieInLaag: number,
  voorraad: Record<MateriaalType, number>
): TileInfo {
  const tile = laag.tiles[positieInLaag];

  // Bezette Laag (hoofdstuk 6, issue: "De Bezette Laag, missionaris en
  // verkenner", Deel 1): een eigen, per-tegel verhullingslaag — de laag zelf
  // blijft `ontgrendeld: false` zolang ze bezet is, dus dit moet vóór de
  // gewone fog-of-war-check hieronder afgehandeld worden. Een onthuld vakje
  // (`tile.verhuld === false`) valt gewoon door naar de normale
  // tile-detail-logica verderop, want `tile.status`/`tile.improvement` zijn
  // dan al echt gezet (zie `verken` in economie.ts).
  if (laag.bezet) {
    if (tile.verhuld) {
      return {
        titel: "Verhuld vakje",
        ondertitel: `Bezette Laag ${laag.hoogte}`,
        tekst: "Dit vakje is nog niet verkend. Leid een Verkenner op en verken het om te zien wat hier ligt.",
      };
    }
  } else if (!laag.ontgrendeld) {
    if (isVooruitkijkLaag(laag, lagen)) {
      return {
        titel: `Laag ${laag.hoogte} — nog niet ontgrendeld`,
        ondertitel: laag.terreinType,
        tekst: "Je kunt dit terrein in de verte zien, maar de vakjes zelf zijn nog verborgen. Ontgrendel deze laag door genoeg cultuur te verzamelen.",
      };
    }
    return {
      titel: "Onbekend gebied",
      tekst: "Dit gebied ligt nog in de mist en is niet verkend.",
    };
  }

  if (tile.status === "ruine") {
    return {
      titel: "Ruïne",
      ondertitel: "Voormalige Wachttoren",
      tekst: "Een verloren Confrontatie tegen een Bezette Laag verwoestte deze Wachttoren. Herbouwbaar tegen de normale kosten en bouwtijd.",
    };
  }

  if (tile.improvement?.soort === "city") {
    // `tile.improvement.naam` i.p.v. het meegegeven `stad.naam`: sinds het
    // stichten van een nieuwe stad (hoofdstuk 2/16, issue: "stad stichten op
    // de frontier") kan er een tweede city-tile bestaan (de zojuist
    // gestichte stad) met een eigen naam, los van de originele `stad`-status
    // die alleen Holenrots beschrijft.
    return {
      titel: tile.improvement.naam,
      ondertitel: "Jouw nederzetting",
      tekst: "Het hart van je stad. Verzamel voedsel om hier te laten groeien.",
    };
  }

  if (tile.status === "ghost_town") {
    return {
      titel: "Verlaten vakje",
      ondertitel: tile.improvement ? `Voormalig: ${tile.improvement.naam}` : undefined,
      tekst: "Dit land is uitgeput en kan niet opnieuw bebouwd worden.",
    };
  }

  if (tile.status === "in_aanbouw" && tile.improvement) {
    const voortgangTekst = tile.bouwVoortgang
      ? bouwVoortgangBeschrijving(
          tile as Tile & { bouwVoortgang: Partial<Record<ResourceType, number>> },
          tile.improvement,
          voorraad
        )
      : "";
    // Voedselverbruik van een Wachttoren (issue: "wachttoren tweaks" — moet
    // ook zichtbaar zijn zolang hij nog in aanbouw is, niet pas zodra hij
    // actief en bemand is).
    const wachttorenVoedselTekst =
      tile.improvement.id === "wachttoren"
        ? ` Verbruikt ${WACHTTOREN_VOEDSEL_VERBRUIK} voedsel per beurt zodra bemand.`
        : "";
    return {
      titel: tile.improvement.naam,
      ondertitel: `${CATEGORIE_LABELS[tile.improvement.categorie]} — in aanbouw`,
      tekst: `Nog niet actief. ${effectBeschrijving(tile.improvement)}${wachttorenVoedselTekst}${voortgangTekst}`.trim(),
    };
  }

  if (tile.status === "actief" && tile.improvement) {
    const opFrontier = laag.hoogte === hoogsteOntgrendeldeLaag(lagen);
    const uitputting =
      tile.beurtenTotUitputting !== undefined
        ? ` Nog ${tile.beurtenTotUitputting} beurten actief voordat het uitgeput raakt.`
        : "";
    // Wegverbinding (M10, hoofdstuk 16): alleen relevant voor land
    // improvements — de stad zelf heeft geen wegverbinding nodig. Vijandelijke
    // tile-varianten (dreiging/belegeringsdoel, hoofdstuk 6) produceren of
    // verdedigen niets en zijn nooit wegverbonden — de wegverbindings-tekst
    // (die over "niets afleggen" gaat) is daar dus altijd misleidend en
    // irrelevant.
    const wegStatus =
      tile.improvement.soort === "land" && !tile.improvement.vijandelijk
        ? isTileVerbondenMetStad(lagen, laag.hoogte, positieInLaag)
          ? " Verbonden met de stad via een weg."
          : " Nog niet verbonden met de stad — legt pas iets af zodra de settler op dit vakje zelf een weg heeft aangelegd, verbonden met het wegennetwerk naar de stad."
        : "";
    // Bemand/onbemand-status (nieuwe Wachttoren-functie, hoofdstuk 6, issue:
    // "in de pop-up kunnen zien of er een strijder aanwezig is en dus actief
    // is") — alleen relevant voor de Wachttoren zelf, andere improvements
    // hebben geen bemanningsconcept. Vermeldt ook het voedselverbruik
    // (issue: "wachttoren tweaks" — moet inzichtelijk zijn dat een Wachttoren
    // voedsel kost).
    const bemandStatus =
      tile.improvement.id === "wachttoren"
        ? isWachttorenBemand(stad.strijders, laag.hoogte, positieInLaag)
          ? ` Bemand door een strijder — actief, verbruikt ${WACHTTOREN_VOEDSEL_VERBRUIK} voedsel per beurt.`
          : ` Nog niet bemand door een strijder — daardoor momenteel niet actief. Zodra bemand, verbruikt hij ${WACHTTOREN_VOEDSEL_VERBRUIK} voedsel per beurt.`
        : "";
    return {
      titel: tile.improvement.naam,
      ondertitel: CATEGORIE_LABELS[tile.improvement.categorie],
      tekst: `${effectBeschrijving(tile.improvement, opFrontier)}${bemandStatus}${wegStatus}${uitputting}`.trim(),
    };
  }

  if (tile.kudde) {
    return {
      titel: "Wilde kudde",
      ondertitel: `${laag.terreinType} — ${TERREIN_LABELS[tile.terrein]}`,
      tekst: `Verplaats de settler hierheen en jaag voor voedsel. Nog ${tile.kudde.beurtenResterend} beurten te jagen voordat de kudde verder trekt.`,
    };
  }

  // Bezette Laag (hoofdstuk 6, issue: "De Bezette Laag, missionaris en
  // verkenner", Deel 1/2): het neutrale, onthulde vakje (geen vijandelijke/
  // cosmetische inhoud, zie world.ts) — bouwen blijft hier onmogelijk zolang
  // de laag bezet is, ongeacht de normale frontier-only-regel hieronder.
  if (laag.bezet) {
    return {
      titel: "Leeg vakje",
      ondertitel: `Bezette Laag ${laag.hoogte}`,
      tekst: "Hier ligt geen vijandelijke of cosmetische inhoud. Zolang de laag bezet is, kun je hier niet bouwen.",
    };
  }

  // Bouwen kan normaal alleen op de frontier-laag (de hoogst ontgrendelde) —
  // de Wachttoren is daarop een expliciete uitzondering (hoofdstuk 6/11,
  // issue: "wachttorens, bemanning en bevoorrading") en blijft dus overal
  // ontgrendeld bouwbaar.
  const opFrontier = laag.hoogte === hoogsteOntgrendeldeLaag(lagen);
  // Vers water (hoofdstuk 2, issue: "stad stichten op de frontier" deel 1):
  // maakt op de kaart/tile-info zichtbaar welke vakjes geschikt zijn om een
  // nieuwe stad te stichten, zodat de speler ernaartoe kan plannen.
  const versWaterTekst = tile.versWater
    ? " Dit vakje ligt aan vers water — hier kan, met de settler erop, een nieuwe stad gesticht worden."
    : "";
  return {
    titel: "Leeg vakje",
    ondertitel: `${laag.terreinType} — ${TERREIN_LABELS[tile.terrein]}`,
    tekst: (opFrontier
      ? "Hier kun je bouwen. Houtkap vereist bos, een mijn vereist heuvel of berg, een boerderij vereist vlakke grond. Heiligdommen, sterrencirkels en wachttorens kunnen overal geplaatst worden."
      : "Dit is niet meer de frontier-laag, dus hier is alleen nog een Wachttoren te bouwen — die mag, als uitzondering, op elke ontgrendelde laag geplaatst worden.") + versWaterTekst,
  };
}

// Info voor de klikbare oceaan-rij onder laag 1 (hoofdstuk 2: "Onderste laag
// = startstad, begint aan een oceaan"). Puur sfeer/flavor — er is hier niets
// te bouwen, dus geen `Layer`/`Tile` nodig zoals bij `beschrijfTile`.
export function beschrijfOceaanTile(): TileInfo {
  return {
    titel: "De oceaan",
    ondertitel: "Waar het Hertenpad-volk aankwam",
    tekst: "Het water strekt zich uit voorbij het zicht. Hier is niets te bouwen — het kamp begon aan deze rand.",
  };
}

// Info voor de klikbare oceaan-rij bóven de laatste laag (issue: "laatste
// oceaan ook visueel") — de oceaan aan de overkant (hoofdstuk 2/10), het
// einddoel van de hele tocht. Zelfde puur-sfeer-patroon als `beschrijfOceaanTile`
// hierboven, alleen getoond zodra die laatste laag ontgrendeld is (zie
// world.ts: `eindeOceaanZichtbaar`).
export function beschrijfEindeOceaanTile(): TileInfo {
  return {
    titel: "De oceaan aan de overkant",
    ondertitel: "Waar de tocht eindigt",
    tekst: "Het water strekt zich uit voorbij het zicht — hetzelfde water, aan het andere eind van de tocht. Hier is niets te bouwen.",
  };
}
