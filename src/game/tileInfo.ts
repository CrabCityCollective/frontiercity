// Beschrijft een tile in mensentaal voor de klik-op-tile-info-pop-up (naam,
// soort, kort wat je erop kunt bouwen/wat het doet). Puur een leesfunctie —
// verandert geen spelstatus, dus hoort hier naast de andere pure
// game-logica-modules in plaats van in een component.

import { CATEGORIE_LABELS } from "./improvements";
import { City, Improvement, Layer } from "./types";
import { isVooruitkijkLaag } from "./world";

export interface TileInfo {
  titel: string;
  ondertitel?: string;
  tekst: string;
}

function effectBeschrijving(improvement: Improvement): string {
  const { effect } = improvement;
  if (effect.type === "productie" && effect.resource && effect.waarde) {
    return `Levert +${effect.waarde} ${effect.resource} per beurt.`;
  }
  if (effect.type === "verdediging" && effect.waarde) {
    return `Geeft +${effect.waarde} verdediging bij een militaire confrontatie.`;
  }
  if (effect.type === "stad") {
    return "Het centrum van je nederzetting.";
  }
  return "";
}

// Geeft de info voor de tile op `positieInLaag` binnen `laag`. Onontgrendelde
// lagen (fog of war / vooruitkijk) hebben geen tile-detail — daar tonen we
// alleen wat er over de laag zelf bekend is (hoofdstuk 2).
export function beschrijfTile(laag: Layer, lagen: Layer[], stad: City, positieInLaag: number): TileInfo {
  if (!laag.ontgrendeld) {
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

  const tile = laag.tiles[positieInLaag];

  if (tile.improvement?.soort === "city") {
    return {
      titel: stad.naam,
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
    return {
      titel: tile.improvement.naam,
      ondertitel: `${CATEGORIE_LABELS[tile.improvement.categorie]} — in aanbouw`,
      tekst: `Nog niet actief. ${effectBeschrijving(tile.improvement)}`.trim(),
    };
  }

  if (tile.status === "actief" && tile.improvement) {
    const uitputting =
      tile.beurtenTotUitputting !== undefined
        ? ` Nog ${tile.beurtenTotUitputting} beurten actief voordat het uitgeput raakt.`
        : "";
    return {
      titel: tile.improvement.naam,
      ondertitel: CATEGORIE_LABELS[tile.improvement.categorie],
      tekst: `${effectBeschrijving(tile.improvement)}${uitputting}`.trim(),
    };
  }

  return {
    titel: "Leeg vakje",
    ondertitel: laag.terreinType,
    tekst: "Hier kun je een improvement bouwen. Kies een categorie in de bouw-pop-up (economisch, cultureel of militair) om te zien wat je hier kunt neerzetten.",
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
