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

// Terrein-subtype van een los vakje binnen een laag (issue: "grotere
// verscheidenheid van tiles per laag"). Een laag heeft daarnaast nog steeds
// een eigen `terreinType`-label (hieronder, op `Layer`) voor de sfeer/flavor
// (bv. "loofbos"), maar de 9 losse vakjes binnen die laag kunnen onderling
// verschillen — dat verschil bepaalt welke land improvements er geplaatst
// mogen worden (zie `Improvement.terreinEisen`).
export type TerreinType = "vlak" | "bos" | "heuvel" | "berg";

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
  // Welke vakje-terreintypes deze (land-)improvement toestaan (issue:
  // "houtkap alleen op bos", "mijn alleen op heuvel/berg", "boerderij alleen
  // op vlakke grond"). `undefined`/leeg = geen terrein-eis, overal plaatsbaar
  // (bv. de meeste city/unit-improvements). Alleen relevant voor
  // `soort: "land"`.
  terreinEisen?: TerreinType[];
}

export interface Tile {
  positieInLaag: number; // 0-8, 4 = centrum/stad
  // Vast, niet-procedureel terrein-subtype van dit specifieke vakje (zie
  // `TerreinType` hierboven) — bepaalt welke land improvements hier geplaatst
  // mogen worden. Elk vakje heeft er één, ook het stad-vakje (ongebruikt voor
  // plaatsingslogica, maar houdt het veld overal aanwezig i.p.v. optioneel).
  terrein: TerreinType;
  improvement?: Improvement;
  status: "leeg" | "in_aanbouw" | "actief" | "ghost_town";
  beurtenTotUitputting?: number;
  // Alleen aanwezig terwijl status "in_aanbouw" is (M3: productiewachtrij).
  // Houdt bij hoeveel van elke grondstof nog geïnvesteerd moet worden.
  bouwVoortgang?: Partial<Record<ResourceType, number>>;
  // Door de settler aangelegd (M10, hoofdstuk 16): een land improvement
  // produceert pas zodra zijn vakje via een keten van `heeftWeg`-vakjes
  // verbonden is met de stad (zie game/wegen.ts). Geen bouwkosten/-tijd —
  // wordt in één keer gezet zodra de settler de aanleg-actie uitvoert.
  heeftWeg?: boolean;
  // Wilde kudde (hoofdstuk 16/17, issue: "kuddes met dieren waar je op kunt
  // jagen voor voedsel"): kan vanaf laag 4 op een leeg vakje verschijnen. De
  // settler kan er `jaag` (economie.ts) op uitvoeren zolang
  // `beurtenResterend` boven nul staat; daarna is de kudde uitgeput en
  // verdwijnt dit veld weer.
  kudde?: {
    beurtenResterend: number;
  };
}

// Positie van de settler-eenheid (M10, hoofdstuk 16). Bestaat pas vanaf beurt
// 2 (zie `GameState.settler`) — geen los "gebouwd/niet gebouwd"-veld nodig
// omdat er precies één settler is, die nooit verloren kan gaan in de MVP.
export interface Settler {
  hoogte: number;
  positieInLaag: number;
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

// Individuele opgeleide Soldaat-eenheid (nieuwe Wachttoren-functie, hoofdstuk
// 6: "een wachttoren heeft een strijder nodig om te kunnen functioneren").
// Elke strijder telt mee in de algemene legerwaarde (`berekenLegerwaarde` in
// economie.ts), ongeacht of hij een Wachttoren bemant. `wachttoren` wordt via
// het militaire paneel gezet (kies een strijder → kies een wachttoren) en is
// daarna blijvend — een strijder kan niet meer uit een eerdere Wachttoren
// gehaald worden om ergens anders bemand te worden (issue).
export interface Strijder {
  id: string;
  wachttoren?: { hoogte: number; positieInLaag: number };
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
  // Alle opgeleide Soldaat-eenheden (M7, hoofdstuk 6), elk optioneel toegewezen
  // aan een Wachttoren-vakje (zie `Strijder` hierboven). Vervangt een simpele
  // legerwaarde-teller: de speler moet nu per strijder kunnen kiezen welke
  // Wachttoren hij bemant.
  strijders: Strijder[];
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

// Indringers & tribuut (nieuwe Wachttoren-functie, hoofdstuk 6): elke beurt is
// er een kans dat een tribe de frontier-laag (de hoogst ontgrendelde laag)
// binnendringt. `tribuut` is alleen aanwezig als er geen actieve Wachttoren op
// die laag staat.
export interface IndringersTribuut {
  resource: MateriaalType;
  aantal: number;
}

// `fase: "geforceerd"` is de MVP-uitzondering (hoofdstuk 13: nog geen
// meerdere steden) op het "weiger → stad verwoest, terugval naar vorige
// stad"-pad uit hoofdstuk 6: zonder vorige stad om naar terug te vallen wordt
// het tribuut alsnog betaald — zie `weigerTribuut`/`bevestigGedwongenTribuut`
// in economie.ts. Zodra meerdere steden bestaan (post-MVP), kan "weigeren"
// hier in plaats daarvan echt tot stadsverlies leiden.
export interface IndringersEvent {
  laagHoogte: number;
  stamNaam: string;
  heeftWachttoren: boolean;
  tribuut?: IndringersTribuut;
  fase: "gemeld" | "geforceerd";
}

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
  // Gezet zodra de stad volledig instort (M6, hoofdstuk 4: hard verval). In de
  // MVP (één stad, geen frontier-verplaatsing) betekent dat het einde van de
  // run — de rest van deze `GameState` is dan al een verse tutorial-start
  // (zie `verwerkVerval` in economie.ts). Blijft `true` tot de speler het
  // ineenstortingsscherm sluit (zie `bevestigIneenstorting`), net als
  // `laatsteConfrontatie` hierboven een resultaat-vlag voor de UI, geen los
  // systeem.
  laatsteIneenstorting?: boolean;
  // Momentopname van de zojuist geëindigde run (issue: "game-over-scherm
  // met beurten/steden/lagen"), genomen vlak vóór `verwerkVerval` de status
  // terugzet naar een verse start. Alleen relevant zolang
  // `laatsteIneenstorting` `true` is; puur UI-weergave, geen spelregel.
  laatsteRunStatistieken?: {
    beurten: number;
    stedenGebouwd: number;
    hoogsteLaag: number;
  };
  // Settler & wegen (M10, hoofdstuk 16). `settler` is `undefined` tot beurt 2
  // (hij verschijnt dan in de stad, zie economie.ts `volgendeBeurt`).
  // `settlerActieGedaanDitBeurt` is het settler-equivalent van
  // `bouwKeuzeGedaanDitBeurt` hierboven: hoogstens 1 settler-actie (bewegen
  // óf een weg aanleggen) per beurt, teruggezet door `volgendeBeurt`.
  settler?: Settler;
  settlerActieGedaanDitBeurt: boolean;
  // Eerstvolgende beurt waarop weer een nieuw bouwproject gestart mag worden
  // (hoofdstuk 16: bouw-ritme, "om de 3 beurten"). Begint op 1 zodat de
  // allereerste bouw-pop-up gewoon blijft verschijnen.
  volgendeBouwBeurt: number;
  // Lopende indringers-melding (hoofdstuk 6), gezet door `verwerkIndringers`
  // in economie.ts zodra een beurt een binnendringende tribe oplevert.
  // `undefined` zolang er geen (onopgeloste) melding is — de UI blokkeert
  // dan geen andere pop-ups.
  indringersEvent?: IndringersEvent;
  // Per-run instelling (issue: "een setting waarmee je deze uitleg pop-ups
  // aan en uit kunt zetten ... voor deze run specifiek") — schakelt alle
  // tutorial-uitleg-pop-ups (openings-uitleg, settler, voedsel/boerderij,
  // militair) in of uit via het hoofdmenu, los van de standaard-instelling
  // (zie save.ts: `standaardUitlegAan`) waarmee elke nieuwe run start. Laat
  // laag-flavor, indringers-meldingen en de tutorial-voltooid-samenvatting
  // ongemoeid — dat is kerninhoud, geen uitleg.
  uitlegPopupsAan: boolean;
}
