// Spiegelt de data-schema's uit frontier-city-design-doc.md, hoofdstuk 13.
// Velden met een `?` zijn bewust al aanwezig voor post-MVP features (zeldzaamheid,
// vooruitkijk, campagne-ankers) maar worden in de MVP nog niet gebruikt.

export type ResourceType =
  | "hout"
  | "steen"
  | "erts"
  | "goud"
  | "voedsel"
  | "cultuur"
  | "wetenschap";

export type Categorie =
  | "economisch"
  | "wetenschappelijk"
  | "militair"
  | "civiel"
  | "cultureel";

export interface EffectDefinition {
  type: string;
  resource?: ResourceType;
  waarde?: number;
  [key: string]: unknown;
}

export interface Improvement {
  id: string;
  naam: string;
  categorie: Categorie;
  soort: "city" | "land" | "unit";
  kosten: Partial<Record<ResourceType, number>>;
  bouwtijdBeurten: number;
  effect: EffectDefinition;
  zeldzaamheid?: "gewoon" | "rijk" | "legendarisch";
  uitputtingBeurten?: number;
}

export interface Tile {
  positieInLaag: number; // 0-8, 4 = centrum/stad
  improvement?: Improvement;
  status: "leeg" | "in_aanbouw" | "actief" | "ghost_town";
  beurtenTotUitputting?: number;
  // Alleen aanwezig terwijl status "in_aanbouw" is (M3: productiewachtrij).
  // Houdt bij hoeveel van elke grondstof nog geïnvesteerd moet worden.
  bouwVoortgang?: Partial<Record<ResourceType, number>>;
}

export interface Layer {
  hoogte: number;
  ontgrendeld: boolean;
  tiles: Tile[]; // lengte 9
  terreinType: string;
  // Sterkte van de tegenstander bij een militaire confrontatie op deze laag
  // (M7, hoofdstuk 6). Was al als optioneel veld voorbereid; vanaf M7
  // daadwerkelijk gevuld (zie wereld.ts) en dus niet meer ongebruikt.
  dreigingsniveau?: number;
}

export interface Relic {
  id: string;
  naam: string;
  categorie: Categorie;
}

export interface City {
  naam: string;
  grootte: "klein" | "middel" | "groot";
  relics: Relic[];
  vervalStatus: "gezond" | "kritiek";
  vervalBeurtenResterend?: number;
  // Lopende groei-tier-bouw (M6, hoofdstuk 4: "kost een civiel improvement +
  // rijptijd"). Net als een tile-in-aanbouw (M3) een per-beurt investering
  // van bouwmateriaal, maar los van de tegel-band omdat groei de stad zelf
  // upgradet, geen land-vakje inneemt.
  groeiInAanbouw?: {
    improvement: Improvement;
    voortgang: Partial<Record<ResourceType, number>>;
  };
  // Opgebouwde legerwaarde (M7, hoofdstuk 6: "vergelijking van totale
  // legerwaarde") uit gerekruteerde Soldaat-eenheden. Net als `grootte` en
  // `relics` een resultaat van keuzes over de tijd, dus ook onderdeel van het
  // permadeath-verval-risico (hoofdstuk 4).
  leger: number;
  // Lopende rekrutering, zelfde queue-patroon als `groeiInAanbouw` (los van
  // de tegel-band omdat een unit geen land-vakje inneemt).
  legerInAanbouw?: {
    improvement: Improvement;
    voortgang: Partial<Record<ResourceType, number>>;
  };
}

// Uitkomst van een militaire confrontatie (M7, hoofdstuk 6): een vergelijking
// van eigen legerwaarde tegen de dreiging op de actieve laag, met een
// winkans in plaats van een gegarandeerde uitkomst. Bewaard in GameState
// zodat de UI het laatste resultaat kan tonen na `volgendeBeurt`/interactie.
export interface ConfrontatieResultaat {
  winkans: number; // 0-1, berekend vóór het gevecht
  gewonnen: boolean;
  eigenLegerwaarde: number;
  tegenstanderSterkte: number;
  buitGoud?: number; // alleen bij winst (hoofdstuk 6: "mogelijk buit")
  geraakteTiles?: number; // alleen bij verlies (hoofdstuk 6: "schade ... aan getroffen tiles")
}

export interface StoryAnchor {
  id: string;
  hoogteRange: [number, number];
  keuzes: string[];
}

export interface CampaignConfig {
  id: string;
  naam: string;
  tegelSet: string; // asset-map referentie
  multipliers: Partial<{
    uitputtingssnelheid: number;
    pushbackFrequentie: number;
    zeldzaamheidLegendarisch: number;
  }>;
  ankers?: StoryAnchor[]; // post-MVP
}

// Gedeelde-opslag-grondstoffen (hoofdstuk 5): hout, steen, erts, goud delen
// samen één opslag-cap. Voedsel, cultuur en wetenschap zijn bewust geen
// onderdeel van deze gedeelde pool (aparte voorraad resp. drempel-tellers).
export type MateriaalType = "hout" | "steen" | "erts" | "goud";

// Volledige spelstatus voor de MVP (één actieve stad, één band van 9 vakjes,
// meerdere lagen). Zie hoofdstuk 13 voor de scope-afbakening.
export interface GameState {
  stad: City;
  lagen: Layer[];
  voorraad: Record<MateriaalType, number>;
  opslagCap: number;
  voedsel: number; // aparte voorraad, geen gedeelde cap (hoofdstuk 5 / 11)
  // Voortgangs-valuta richting laag-ontgrendeling (M5): geen opslag-cap, blijft
  // cumulatief oplopen (ook voorbij de drempel van de eerstvolgende laag) —
  // zie hoofdstuk 5, "Voortgangs-valuta".
  cultuur: number;
  beurt: number;
  // Resultaat van de laatst afgehandelde militaire confrontatie (M7), voor
  // de UI. `undefined` zolang er nog geen confrontatie heeft plaatsgevonden.
  laatsteConfrontatie?: ConfrontatieResultaat;
  // Spelregel (hoofdstuk 11): hoogstens 1 bouwkeuze per beurt. Wordt gezet
  // zodra de speler een improvement kiest óf de bouw-pop-up sluit zonder te
  // bouwen, en door `volgendeBeurt` weer teruggezet — een echte spelregel
  // die ook na een refresh/reload geldt, geen losse UI-vlag.
  bouwKeuzeGedaanDitBeurt: boolean;
  // Gezet zodra de stad instort (M6, hoofdstuk 4: hard verval — de groei-tier
  // en relics gaan verloren, de run zelf loopt door). Blijft `true` tot de
  // speler het ineenstortingsscherm sluit (zie `bevestigIneenstorting` in
  // economie.ts), net als `laatsteConfrontatie` hierboven een resultaat-vlag
  // voor de UI, geen los systeem.
  laatsteIneenstorting?: boolean;
}
