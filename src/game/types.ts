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
}
