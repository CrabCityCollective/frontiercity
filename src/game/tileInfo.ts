// Beschrijft een tile in mensentaal voor de klik-op-tile-info-pop-up (naam,
// soort, kort wat je erop kunt bouwen/wat het doet). Puur een leesfunctie —
// verandert geen spelstatus, dus hoort hier naast de andere pure
// game-logica-modules in plaats van in een component.

import { bouwStagneertVolgendeBeurt, resterendeBouwBeurten } from "./bouwwachtrij";
import { CATEGORIE_LABELS, MATERIAAL_LABELS, TERREIN_LABELS, effectBeschrijving } from "./improvements";
import { isWachttorenBemand } from "./indringersEnDieren";
import { WACHTTOREN_VOEDSEL_VERBRUIK } from "./productie";
import { BELEGERINGSDREMPEL } from "./streekOntgrendeling";
import { City, Improvement, Streek, MateriaalType, ResourceType, Tile } from "./types";
import { isTileVerbondenMetStad } from "./wegen";
import { hoogsteOntgrendeldeStreek, isVooruitkijkStreek } from "./world";

export interface TileInfo {
  titel: string;
  ondertitel?: string;
  tekst: string;
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

// Geeft de info voor de tile op `positieInStreek` binnen `streek`. Onontgrendelde
// streken (fog of war / vooruitkijk) hebben geen tile-detail — daar tonen we
// alleen wat er over de streek zelf bekend is (hoofdstuk 2).
export function beschrijfTile(
  streek: Streek,
  streken: Streek[],
  stad: City,
  positieInStreek: number,
  voorraad: Record<MateriaalType, number>
): TileInfo {
  const tile = streek.tiles[positieInStreek];

  // Wampanoag-laag (Going West, M21e, opdracht-wampanoag-opening.md §5): een
  // parallelle verhullingslaag op een normaal ontgrendelde streek (streek 4
  // wordt niet `bezet` en niet `ontgrendeld: false` gehouden zoals de
  // Bezette Streek hieronder) — moet dus vóór die keten gecontroleerd worden,
  // anders zou dit vakje gewoon als een leeg, bebouwbaar vakje beschreven
  // worden. Nooit gezet buiten Going West streek 4 (worldGoingWest.ts), dus
  // geen effect op de tutorial.
  if (tile.wampanoagVerhuld) {
    return {
      titel: "Verhuld vakje",
      tekst: tile.wampanoagVerkenningInGang
        ? `Een verkenner is onderweg — nog ${tile.wampanoagVerkenningInGang.beurtenResterend} ${tile.wampanoagVerkenningInGang.beurtenResterend === 1 ? "beurt" : "beurten"} tot dit vakje onthuld wordt.`
        : "Dit vakje is nog niet verkend. Stuur er een verkenner heen om te zien wat hier ligt.",
    };
  }

  // Bezette Streek (hoofdstuk 6, issue: "De Bezette Streek, missionaris en
  // verkenner", Deel 1): een eigen, per-tegel verhullingslaag — de streek zelf
  // blijft `ontgrendeld: false` zolang ze bezet is, dus dit moet vóór de
  // gewone fog-of-war-check hieronder afgehandeld worden. Een onthuld vakje
  // (`tile.verhuld === false`) valt gewoon door naar de normale
  // tile-detail-logica verderop, want `tile.status`/`tile.improvement` zijn
  // dan al echt gezet (zie `verken` in economie.ts).
  if (streek.bezet) {
    if (tile.verhuld) {
      return {
        titel: "Verhuld vakje",
        ondertitel: `De Stam van de Mammoet — ${streek.hoogte}`,
        tekst: tile.verkenningInGang
          ? `Een verkenner is onderweg — nog ${tile.verkenningInGang.beurtenResterend} ${tile.verkenningInGang.beurtenResterend === 1 ? "beurt" : "beurten"} tot dit vakje onthuld wordt.`
          : "Dit vakje is nog niet verkend. Stuur er een verkenner heen om te zien wat hier ligt.",
      };
    }
  } else if (!streek.ontgrendeld) {
    if (isVooruitkijkStreek(streek, streken)) {
      return {
        titel: `Streek ${streek.hoogte} — nog niet ontgrendeld`,
        ondertitel: streek.terreinType,
        tekst: "Je kunt dit terrein in de verte zien, maar de vakjes zelf zijn nog verborgen. Ontgrendel deze streek door genoeg cultuur te verzamelen.",
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
      tekst: "Een verloren Confrontatie tegen De Stam van de Mammoet verwoestte deze Wachttoren. Herbouwbaar tegen de normale kosten en bouwtijd.",
    };
  }

  if (tile.improvement?.soort === "city") {
    // `tile.improvement.naam` i.p.v. het meegegeven `stad.naam`: sinds het
    // stichten van een nieuwe stad (hoofdstuk 2/16, issue: "stad stichten op
    // de frontier") kan er een tweede city-tile bestaan (de zojuist
    // gestichte stad) met een eigen naam, los van de originele `stad`-status
    // die alleen Oer-stad beschrijft.
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
    const opFrontier = streek.hoogte === hoogsteOntgrendeldeStreek(streken);
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
        ? isTileVerbondenMetStad(streken, streek.hoogte, positieInStreek)
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
        ? isWachttorenBemand(stad.strijders, streek.hoogte, positieInStreek)
          ? ` Bemand door een strijder — actief, verbruikt ${WACHTTOREN_VOEDSEL_VERBRUIK} voedsel per beurt.`
          : ` Nog niet bemand door een strijder — daardoor momenteel niet actief. Zodra bemand, verbruikt hij ${WACHTTOREN_VOEDSEL_VERBRUIK} voedsel per beurt.`
        : "";
    // Wololo-meter (issue: "Bezette streek scherm"): alleen relevant voor een
    // nog niet veroverd vijandelijk Heiligdom — zie `wololoVoortgang`
    // (types.ts) en `verwerkBelegering` (streekOntgrendeling.ts).
    const wololoStatus =
      tile.improvement.id === "vijandelijk-heiligdom"
        ? ` Wololo-meter: ${tile.wololoVoortgang ?? 0} / ${BELEGERINGSDREMPEL}.`
        : "";
    return {
      titel: tile.improvement.naam,
      ondertitel: CATEGORIE_LABELS[tile.improvement.categorie],
      tekst: `${effectBeschrijving(tile.improvement, opFrontier)}${bemandStatus}${wololoStatus}${wegStatus}${uitputting}`.trim(),
    };
  }

  if (tile.kudde) {
    return {
      titel: "Wilde kudde",
      ondertitel: `${streek.terreinType} — ${TERREIN_LABELS[tile.terrein]}`,
      tekst: `Verplaats de settler hierheen en jaag voor voedsel. Nog ${tile.kudde.beurtenResterend} beurten te jagen voordat de kudde verder trekt.`,
    };
  }

  // Bezette Streek (hoofdstuk 6, issue: "De Bezette Streek, missionaris en
  // verkenner", Deel 1/2): het neutrale, onthulde vakje (geen vijandelijke/
  // cosmetische inhoud, zie world.ts) — bouwen blijft hier onmogelijk zolang
  // de streek bezet is, ongeacht de normale frontier-only-regel hieronder.
  if (streek.bezet) {
    return {
      titel: "Leeg vakje",
      ondertitel: `De Stam van de Mammoet — ${streek.hoogte}`,
      tekst: "Hier ligt geen vijandelijke of cosmetische inhoud. Zolang de streek bezet is, kun je hier niet bouwen.",
    };
  }

  // Bouwen kan normaal alleen op de frontier-streek (de hoogst ontgrendelde) —
  // de Wachttoren is daarop een expliciete uitzondering (hoofdstuk 6/11,
  // issue: "wachttorens, bemanning en bevoorrading") en blijft dus overal
  // ontgrendeld bouwbaar.
  const opFrontier = streek.hoogte === hoogsteOntgrendeldeStreek(streken);
  // Vers water (hoofdstuk 2, issue: "stad stichten op de frontier" deel 1):
  // maakt op de kaart/tile-info zichtbaar welke vakjes geschikt zijn om een
  // nieuwe stad te stichten, zodat de speler ernaartoe kan plannen.
  const versWaterTekst = tile.versWater
    ? " Dit vakje ligt aan vers water — hier kan, met de settler erop, een nieuwe stad gesticht worden."
    : "";
  return {
    titel: "Leeg vakje",
    ondertitel: `${streek.terreinType} — ${TERREIN_LABELS[tile.terrein]}`,
    tekst: (opFrontier
      ? "Hier kun je bouwen. Houtkap vereist bos, een mijn vereist heuvel of berg, net als een steengroeve. Een boerderij vereist vlakke grond. Heiligdommen, sterrencirkels en wachttorens kunnen overal geplaatst worden."
      : "Dit is niet meer de frontier-streek, dus hier is alleen nog een Wachttoren te bouwen — die mag, als uitzondering, op elke ontgrendelde streek geplaatst worden.") + versWaterTekst,
  };
}

// Info voor de klikbare oceaan-rij onder streek 1 (hoofdstuk 2: "Onderste streek
// = startstad, begint aan een oceaan"). Puur sfeer/flavor — er is hier niets
// te bouwen, dus geen `Streek`/`Tile` nodig zoals bij `beschrijfTile`.
export function beschrijfOceaanTile(): TileInfo {
  return {
    titel: "De oceaan",
    ondertitel: "Waar het Hertenpad-volk aankwam",
    tekst: "Het water strekt zich uit voorbij het zicht. Hier is niets te bouwen — het kamp begon aan deze rand.",
  };
}

// Info voor de klikbare oceaan-rij bóven de laatste streek (issue: "laatste
// oceaan ook visueel") — de oceaan aan de overkant (hoofdstuk 2/10), het
// einddoel van de hele tocht. Zelfde puur-sfeer-patroon als `beschrijfOceaanTile`
// hierboven, alleen getoond zodra die laatste streek ontgrendeld is (zie
// world.ts: `eindeOceaanZichtbaar`).
export function beschrijfEindeOceaanTile(): TileInfo {
  return {
    titel: "De oceaan aan de overkant",
    ondertitel: "Waar de tocht eindigt",
    tekst: "Het water strekt zich uit voorbij het zicht — hetzelfde water, aan het andere eind van de tocht. Hier is niets te bouwen.",
  };
}
