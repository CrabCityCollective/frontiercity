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

// Technologie-boom (hoofdstuk 3/9/11/13, issue: "tech tree toevoegen"): 3
// drempels, elk met 2 keuzes. Elke sleutel is functioneel (het effect), los
// van naam/flavor-tekst — dezelfde aanpak als `CampaignConfig.tegelSet`
// hieronder, zodat latere campagnes een eigen naam kunnen geven zonder de
// boom-structuur of effecten te wijzigen (zie techTree.ts). De boomvorm zelf
// (welke tech onder welke ouder hangt) staat vast in `techTree.ts` en wordt
// hier bewust niet herhaald in het type-systeem.
export type TechId =
  | "vuur-temmen"
  | "spoor-lezen"
  | "aardewerk"
  | "zaadselectie"
  | "wiel"
  | "speerwerper"
  | "weven"
  | "kalkoven"
  | "veeteelt"
  | "voorraadschuur"
  | "vlotten"
  | "handkar"
  | "boogschieten"
  | "verharde-speren";

export type TechDrempel = 1 | 2 | 3;

// Terrein-subtype van een los vakje binnen een streek (issue: "grotere
// verscheidenheid van tiles per streek"). Een streek heeft daarnaast nog steeds
// een eigen `terreinType`-label (hieronder, op `Streek`) voor de sfeer/flavor
// (bv. "loofbos"), maar de 9 losse vakjes binnen die streek kunnen onderling
// verschillen — dat verschil bepaalt welke land improvements er geplaatst
// mogen worden (zie `Improvement.terreinEisen`).
export type TerreinType = "vlak" | "bos" | "heuvel" | "berg";

// Vaste, verhulde inhoud van een vakje binnen een Bezette Streek (hoofdstuk 6,
// issue: "De Bezette Streek, missionaris en verkenner"), bepaald bij het
// ontstaan van de streek (zie world.ts) en pas zichtbaar zodra Verkenning het
// vakje onthult (`Tile.verhuld` hieronder). `undefined` op een vakje binnen
// een Bezette Streek betekent: geen bijzondere inhoud, gewoon een leeg vakje
// zodra onthuld — dat houdt één vakje per Bezette Streek "neutraal" in plaats
// van dat alle 9 vakjes vijandelijke/cosmetische inhoud moeten dragen.
export type BezetteStreekInhoud = "wachttoren" | "heiligdom" | "huisje";

export interface EffectDefinition {
  type: string;
  resource?: ResourceType;
  waarde?: number;
  [key: string]: unknown;
}

// Infrastructuur-eis (hoofdstuk 4/6/11/14, issue: "city improvements" Deel
// 4): een bouw-drempel op basis van reeds gebouwde infrastructuur in plaats
// van tech/streekhoogte — momenteel alleen gebruikt door Legerkamp (5 actieve
// Wachttorens + een Barakken) en Offer Altaar (5 actieve Heiligdommen + een
// Grote Tempel). `landImprovementNaam`/`cityImprovementNaam` zijn puur voor
// de voortgangstekst in de bouw-pop-up (bv. "3/5 Wachttorens, Barakken: nog
// niet gebouwd") — bewust gedenormaliseerd in plaats van een losse
// naam-lookup, er zijn maar twee gebruikers van dit veld.
export interface InfrastructuurEis {
  landImprovementId: string;
  landImprovementNaam: string;
  minAantal: number;
  cityImprovementId: string;
  cityImprovementNaam: string;
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
  // Expliciete uitzondering op de algemene regel "bouwen kan alleen op de
  // frontier-streek" (hoofdstuk 6/11): momenteel alleen de Wachttoren. Zonder
  // deze uitzondering zou een achtergelaten streek permanent onverdedigbaar
  // zijn zodra de frontier verder trekt, terwijl indringers-incidenten op
  // elke ontgrendelde streek kunnen vallen (niet meer alleen de frontier).
  // `undefined`/`false` = de normale frontier-only regel geldt.
  bouwbaarBuitenFrontier?: boolean;
  // Alleen beschikbaar in de bouw-opties nadat deze tech gekozen is (hoofdstuk
  // 3/9, Deel 2 van "tech tree toevoegen"): momenteel alleen de Voorraadkuil,
  // ontgrendeld door "aardewerk". `undefined` = altijd beschikbaar (los van
  // de technologie-boom), zoals bijna elke andere improvement.
  vereisteTech?: TechId;
  // Alleen beschikbaar in de bouw-opties zodra deze streekhoogte ontgrendeld is
  // (issue: "tutorial popups wijzigen", volgorde verschoven door "jagen en
  // farmen omdraaien" — Sterrencirkel/Wetenschappelijk pas vanaf streek 4,
  // Wachttoren/Militair, Houtkap en Mijn pas vanaf streek 2, Boerderij pas
  // vanaf streek 3, allemaal uitgegrijsd ervoor). `undefined` = altijd
  // beschikbaar, zoals bijna elke andere
  // improvement. Gebruikt de hoogst ontgrendelde streek (frontier), niet de
  // streek waar de speler op dat moment op bouwt — zelfde reden als
  // `bouwbaarBuitenFrontier`: eenmaal ontgrendeld blijft de categorie
  // beschikbaar, ook op een oudere streek.
  minStreek?: number;
  // Vijandelijke skin-variant (hoofdstuk 6, issue: "De Bezette Streek,
  // missionaris en verkenner", Deel 1): hergebruikt de bestaande Wachttoren-
  // en Heiligdom-tegel-typen met andere kleur/naam voor de vijandelijke tiles
  // op een Bezette Streek — geen nieuwe game-logica voor het uiterlijk zelf,
  // alleen een vlag zodat canvas-rendering en de Confrontatie/Belegering-
  // doelherkenning ze kunnen onderscheiden van de eigen Wachttoren/Heiligdom.
  // Nooit onderdeel van IMPROVEMENT_POOLS/beschikbareOpties — deze tiles
  // worden alleen door Verkenning/wereldgeneratie geplaatst, nooit door de
  // speler gebouwd.
  vijandelijk?: boolean;
  // Minimale stadsgrootte om dit (city-)improvement te mogen bouwen
  // (hoofdstuk 3/14, issue: "city improvements" Deel 3): momenteel Barakken/
  // Tempel (`"middel"`) en Grote Tempel (`"groot"`). `undefined` = geen eis,
  // zoals bijna elk ander improvement (o.a. Bibliotheek/Markt).
  stadsgrootteEis?: City["grootte"];
  // Bouw-drempel op basis van reeds gebouwde infrastructuur (hoofdstuk 4/6/
  // 11/14, issue: "city improvements" Deel 4) — zie `InfrastructuurEis`
  // hierboven. Momenteel alleen Legerkamp en Offer Altaar.
  infrastructuurEis?: InfrastructuurEis;
}

export interface Tile {
  positieInStreek: number; // 0-8, 4 = centrum/stad
  // Vast, niet-procedureel terrein-subtype van dit specifieke vakje (zie
  // `TerreinType` hierboven) — bepaalt welke land improvements hier geplaatst
  // mogen worden. Elk vakje heeft er één, ook het stad-vakje (ongebruikt voor
  // plaatsingslogica, maar houdt het veld overal aanwezig i.p.v. optioneel).
  terrein: TerreinType;
  improvement?: Improvement;
  // "ruine" (hoofdstuk 6, issue: "De Bezette Streek, missionaris en
  // verkenner", Deel 5): een eigen, beschermende Wachttoren die een verloren
  // Confrontatie tegen een Bezette Streek meemaakte — anders dan "ghost_town"
  // (permanent onbebouwbaar) mag hier, net als op een gewoon "leeg" vakje,
  // een nieuwe Wachttoren (of iets anders) tegen de normale kosten/bouwtijd
  // herbouwd worden (zie `kanImprovementOpStreek`/`startBouw` in
  // improvements.ts/economie.ts).
  status: "leeg" | "in_aanbouw" | "actief" | "ghost_town" | "ruine";
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
  // jagen voor voedsel"; vanaf streek 1, issue: "jagen en farmen omdraaien"):
  // kan op een leeg vakje verschijnen. De settler kan er `jaag` (economie.ts)
  // op uitvoeren zolang `beurtenResterend` boven nul staat; daarna is de
  // kudde uitgeput en verdwijnt dit veld weer.
  kudde?: {
    beurtenResterend: number;
  };
  // Roofdier (hoofdstuk 14/17, issue: "roofdieren toevoegen"; vanaf streek 1,
  // issue: "jagen en farmen omdraaien"): kan verschijnen op het vakje waar de
  // settler net gejaagd heeft (zie `jaag` in economie.ts) — nooit los van een
  // kudde-jachtactie. Valt pas de
  // beurt ná verschijnen aan (`beurtenTotAanval` telt af in
  // `verwerkRoofdieren`, economie.ts): staat de settler er op dat moment nog
  // (of weer) op, dan sterft hij. Geen eigen ghost-town-achtige nasleep — het
  // veld verdwijnt gewoon weer zodra de aanval is afgehandeld.
  roofdier?: {
    beurtenTotAanval: number;
  };
  // Bezette Streek (hoofdstuk 6, issue: "De Bezette Streek, missionaris en
  // verkenner", Deel 1): een eigen, per-tegel verhullingslaag, los van de
  // gewone streek-brede fog-of-war (`Streek.ontgrendeld`, hoofdstuk 2). Alleen
  // relevant op vakjes binnen een Bezette Streek (`Streek.bezet`). `verhuld:
  // true` betekent nog niet onthuld via Verkenning — `bezetteStreekInhoud`
  // (hierboven gedefinieerd) ligt dan al vast, maar `tile.improvement` zelf
  // blijft leeg tot onthulling (zie `verken` in economie.ts).
  verhuld?: boolean;
  bezetteStreekInhoud?: BezetteStreekInhoud;
  // Ligt dit vakje aan vers water — een rivier of een meer (hoofdstuk 2:
  // "een stad kan alleen gesticht worden op een vakje dat aan vers water
  // ligt")? Vast, niet-procedureel (net als `terrein`) — de tutorial-worldgen
  // garandeert precies één zulk vakje, uitsluitend op de allerlaatste streek
  // (de oceaan aan de overkant, zie world.ts `TUTORIAL_VERS_WATER`) — de
  // enige plek in de hele tutorial met vers water. Geen terrein-eis op
  // zichzelf: een vlak, bos-, heuvel- of bergvakje kan allemaal aan water
  // liggen, dus los van `terrein` bijgehouden.
  versWater?: boolean;
  // Ligt hier een amberader — de vondst die de Amberader/goudmijn-improvement
  // (hoofdstuk 3/14, issue: "toevoeging Goud") nodig heeft, bovenop de gewone
  // heuvel/berg-terreineis? Net als `versWater` hierboven vast/niet-procedureel
  // en los van `terrein` bijgehouden: niet elk heuvel/bergvakje heeft een
  // amberader, in tegenstelling tot een gewone erts-mijn die op elk
  // heuvel/bergvakje mag. De tutorial-worldgen garandeert minstens één zulk
  // vakje vanaf streek 8 (zie world.ts).
  amber?: boolean;
}

// Positie van de settler-eenheid (M10, hoofdstuk 16). Bestaat pas vanaf beurt
// 2 (zie `GameState.settler`) — geen los "gebouwd/niet gebouwd"-veld nodig
// omdat er precies één settler is, die nooit verloren kan gaan in de MVP.
export interface Settler {
  hoogte: number;
  positieInStreek: number;
}

export interface Streek {
  hoogte: number;
  ontgrendeld: boolean;
  tiles: Tile[]; // lengte 9
  terreinType: string;
  // Sterkte van de tegenstander bij een militaire confrontatie op deze streek
  // (M7, hoofdstuk 6). Was al als optioneel veld voorbereid; vanaf M7
  // daadwerkelijk gevuld (zie wereld.ts) en dus niet meer ongebruikt. Wordt
  // sinds "De Bezette Streek" ook hergebruikt als de legerwaarde van een
  // vijandelijke Wachttoren op deze streek (economie.ts: `confrontatieBezetteStreek`)
  // — dezelfde precedent-waarde als een gewone Confrontatie op de frontier.
  dreigingsniveau?: number;
  // Bezette Streek (hoofdstuk 6, issue: "De Bezette Streek, missionaris en
  // verkenner"): generiek, herbruikbaar mechanisme (ook voor latere
  // campagnes) — `true` zolang deze streek geblokkeerd is door vijandelijke
  // Wachttoren-/Heiligdom-tiles die eerst via Verkenning/Confrontatie/
  // Belegering opgelost moeten worden (zie world.ts voor de tutorial-
  // scripting op streek 13, en economie.ts `verwerkStreekOntgrendeling` voor de
  // bevriezing van de normale cultuur-ontgrendeling). Wordt `false` zodra
  // alle vijandelijke Heiligdommen vernietigd zijn (Deel 6) — de streek telt
  // dan als normaal ontgrendeld.
  bezet?: boolean;
  // Cumulatieve belegeringsvoortgang tegen de vijandelijke Heiligdommen op
  // deze Bezette Streek (Deel 4) — vult zich met cultuur-inkomen dat anders
  // verloren zou gaan, maar uitsluitend zolang de speler minstens één
  // Missionaris heeft (zie `verwerkBelegering` in economie.ts). Bereikt de
  // drempel, dan wordt één vijandelijk Heiligdom vernietigd en begint de
  // meter weer bij 0.
  belegeringsVoortgang?: number;
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
// het militaire paneel gezet (kies een strijder → kies een wachttoren).
// Toewijzen is omkeerbaar (hoofdstuk 6/11, issue: "wachttorens, bemanning en
// bevoorrading"): een bemande strijder kan teruggehaald worden
// (`haalStrijderTerug` in economie.ts) en meteen elders opnieuw bemand —
// verplaatsen tussen wachttorens kost geen beurten (issue: "wachttoren
// tweaks").
export interface Strijder {
  id: string;
  wachttoren?: { hoogte: number; positieInStreek: number };
  // Legerkamp-toewijzing (hoofdstuk 6, issue: "De Bezette Streek, missionaris
  // en verkenner", Deel 5) — zelfde soort interactie als `wachttoren`
  // hierboven (omkeerbaar, instant), maar telt in plaats van de gewone
  // Wachttoren-verdedigingsbonus mee als extra legerwaarde bij een
  // Confrontatie tegen een Bezette Streek, ongeacht op welke streek het
  // Legerkamp staat. Een strijder heeft hoogstens één van de twee
  // toewijzingen tegelijk.
  legerkamp?: { hoogte: number; positieInStreek: number };
}

export interface City {
  naam: string;
  grootte: "klein" | "middel" | "groot";
  relics: Relic[];
  vervalStatus: "gezond" | "kritiek";
  vervalBeurtenResterend?: number;
  // Lopende civiele stads-bouw (M6, hoofdstuk 4/16: "kost een civiel
  // improvement + rijptijd"). Net als een tile-in-aanbouw (M3) een per-beurt
  // investering van bouwmateriaal, maar los van de tegel-band omdat dit de
  // stad zelf upgradet, geen land-vakje inneemt. Eén gedeelde wachtrij voor
  // de groei-tier (WOONWIJK) én een nieuwe settler (NIEUWE_SETTLER,
  // hoofdstuk 11/13/16: "concurrerend met de groei-improvements") — de
  // speler kiest er hoogstens één tegelijk, precies de bedoelde spanning
  // tussen investeren in de huidige stad of een nieuwe expeditie uitrusten.
  civielInAanbouw?: {
    improvement: Improvement;
    voortgang: Partial<Record<ResourceType, number>>;
  };
  // Alle opgeleide Soldaat-eenheden (M7, hoofdstuk 6), elk optioneel toegewezen
  // aan een Wachttoren-vakje (zie `Strijder` hierboven). Vervangt een simpele
  // legerwaarde-teller: de speler moet nu per strijder kunnen kiezen welke
  // Wachttoren hij bemant.
  strijders: Strijder[];
  // Lopende rekrutering, zelfde queue-patroon als `civielInAanbouw` (los van
  // de tegel-band omdat een unit geen land-vakje inneemt).
  legerInAanbouw?: {
    improvement: Improvement;
    voortgang: Partial<Record<ResourceType, number>>;
  };
  // Lopende Opslagplaats-bouw (hoofdstuk 3/5/14, issue: "stad stichten op de
  // frontier" deel 2): eigen wachtrij, los van `civielInAanbouw` — Opslagplaats
  // is een economisch, geen civiel improvement (hoofdstuk 3), en concurreert
  // dus niet met groei/nieuwe-settler. Elke voltooide Opslagplaats verhoogt
  // `GameState.opslagCap` direct met `OPSLAGPLAATS.effect.waarde` (zie
  // economie.ts) — geen apart telveld nodig, de cap zelf is de optelsom.
  opslagplaatsInAanbouw?: {
    improvement: Improvement;
    voortgang: Partial<Record<ResourceType, number>>;
  };
  // Verkenner-eenheden (hoofdstuk 6, issue: "De Bezette Streek, missionaris en
  // verkenner", Deel 3) — wetenschappelijke units, trainbaar via hetzelfde
  // wachtrij-patroon als Soldaat (`verkennerInAanbouw`/`strijders`
  // hierboven), zonder toewijzingsconcept (geen "wachttoren"-achtig veld
  // nodig): hun enige functie is de Verkenning-actie beschikbaar maken zodra
  // er minstens één bestaat (zie `kanVerkennen` in economie.ts).
  verkenners: { id: string }[];
  verkennerInAanbouw?: {
    improvement: Improvement;
    voortgang: Partial<Record<ResourceType, number>>;
  };
  // Missionaris-eenheden (Deel 4) — culturele units, alleen trainbaar zodra
  // er een voltooid Offer Altaar staat (zie `heeftOfferAltaar`/
  // `startMissionarisRecrutering` in economie.ts). Net als Verkenner
  // hierboven geen toewijzingsconcept: alleen hun bestaan telt (de
  // "vereenvoudiging" uit Deel 4 van het issue) om cultuur-inkomen om te
  // leiden naar de belegeringsmeter van een Bezette Streek.
  missionarissen: { id: string }[];
  missionarisInAanbouw?: {
    improvement: Improvement;
    voortgang: Partial<Record<ResourceType, number>>;
  };
  // Gebouwde, gelijktijdig-gecapte city improvements (hoofdstuk 3/4/11/14,
  // issue: "city improvements" Deel 1/3) — Bibliotheek, Markt, Barakken,
  // Tempel en Grote Tempel. Vervangt het nooit-gebouwde relic-slot-concept
  // uit een eerdere versie van hoofdstuk 4 als groei-beloning: hoe groter de
  // stad, hoe meer van deze improvements tegelijk actief mogen zijn (zie
  // `CITY_IMPROVEMENT_CAP` in economie.ts). Bewust een array van volledige
  // `Improvement`-objecten (net als `relics` hierboven), niet alleen id's —
  // de productie-/legerwaarde-verwerking in economie.ts leest hun `effect`
  // rechtstreeks. Opslagplaats (eigen wachtrij hieronder) en de groei-tier-
  // improvements (Woonwijk/Grote Woonwijk, via `civielInAanbouw`) tellen
  // bewust niet mee — zie hoofdstuk 11 voor de reden.
  cityImprovements: Improvement[];
  // Gedeelde wachtrij voor Bibliotheek/Markt/Barakken/Tempel/Grote Tempel —
  // net als `civielInAanbouw` hoogstens één tegelijk, los van
  // `opslagplaatsInAanbouw` en de rekruterings-wachtrijen hierboven.
  cityVerbeteringInAanbouw?: {
    improvement: Improvement;
    voortgang: Partial<Record<ResourceType, number>>;
  };
}

// Uitkomst van een militaire confrontatie (M7, hoofdstuk 6): een vergelijking
// van eigen legerwaarde tegen de dreiging op de actieve streek, met een
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
  // Herbruikbaarheid van de technologie-boom per campagne (hoofdstuk 3/9/13,
  // issue: "tech tree toevoegen"): dezelfde functionele `TechId`-sleutels
  // (techTree.ts) krijgen per campagne een eigen naam/flavor (bijv. "IJzeren
  // ploeg" i.p.v. "Vuur temmen" voor een latere campagne), zonder de boom of
  // effecten te wijzigen — zelfde aanpak als `tegelSet` hierboven. Ontbreekt
  // een sleutel (of de hele campagne heeft geen override), dan valt
  // `techNaam()` terug op de tutorial-naam.
  techNamen?: Partial<Record<TechId, string>>;
  // Zelfde herbruikbaarheid als `techNamen` hierboven, maar voor land/city
  // improvements (hoofdstuk 3/14, issue: "toevoeging Goud" — de Amberader is
  // hier het eerste voorbeeld van: functioneel een goudmijn, met "Amberader"
  // als tutorial-naam). Gesleuteld op `Improvement.id`, niet op een apart
  // ID-type zoals `TechId` — improvements hebben geen vaste, opgesomde
  // sleutellijst. Ontbreekt een sleutel (of de hele campagne heeft geen
  // override), dan valt `improvementNaam()` terug op `Improvement.naam`.
  improvementNamen?: Partial<Record<string, string>>;
}

// Gedeelde-opslag-grondstoffen (hoofdstuk 5): hout, steen, erts, goud delen
// samen één opslag-cap. Voedsel, cultuur en wetenschap zijn bewust geen
// onderdeel van deze gedeelde pool (aparte voorraad resp. drempel-tellers).
export type MateriaalType = "hout" | "steen" | "erts" | "goud";

// Indringers & tribuut (hoofdstuk 6): elke beurt is er, zodra streek 2
// ontgrendeld is, een kans dat er ergens een incident plaatsvindt — de
// getroffen streek wordt geloot uit alle ontgrendelde streken (ook beschermde).
// `tribuut` is alleen aanwezig als er geen beschermende Wachttoren (voltooid,
// bemand én wegverbonden) op die streek staat.
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
// `fase: "betaald"` (issue: "wachttoren tweaks") is het laatste, bevestigende
// scherm nadat de speler heeft gekozen om het tribuut te geven (bewust of
// afgedwongen): toont het bedrag dat afgeschreven gaat worden, en trekt dat
// pas daadwerkelijk van de voorraad af zodra de speler deze melding sluit
// (zie `geefTribuut` in economie.ts).
//
// `uitkomst` (issue: "wachttorens kunnen vernietigd worden door indringers"):
// alleen gezet als `heeftWachttoren` — de derde-uitkomst-loot (hoofdstuk 6)
// voor een beschermde streek (frontier of niet). `"standhouden"` is het
// bestaande gedrag (fase "gemeld", "houdt stand"-tekst); `"malus"` en
// `"bonus"` krijgen elk hun eigen fase/pop-up hieronder. De bijbehorende
// state-mutatie (ruïne + strijderverlies, resp. goud) is al toegepast door
// `verwerkIndringers` op het moment dat het event gezet wordt — de latere
// fase-overgangen (`bevestigAmberOnderVuur`/`sluitIndringersMelding` in
// economie.ts) zijn puur UI-voortgang, geen nieuwe state-effecten.
// `buitGoud` is alleen aanwezig bij `uitkomst: "bonus"`.
//
// `amberOnderVuur`/`fase: "amber-onder-vuur"`: onafhankelijk van
// `heeftWachttoren`/`uitkomst` — geldt voor élke indringers-melding op een
// streek met een actieve Amberader (ook de gewone tribuut-afhandeling), en
// wordt altijd als eerste getoond vóór de eigenlijke uitkomst-fase
// (`bevestigAmberOnderVuur` schuift daarna door naar die fase).
export interface IndringersEvent {
  streekHoogte: number;
  stamNaam: string;
  heeftWachttoren: boolean;
  tribuut?: IndringersTribuut;
  amberOnderVuur?: boolean;
  uitkomst?: "standhouden" | "malus" | "bonus";
  buitGoud?: number;
  fase: "amber-onder-vuur" | "gemeld" | "malus" | "bonus" | "geforceerd" | "betaald";
}

// Cumulatieve indringers-statistieken voor het historiescherm van deze run
// (issue: "hoe vaak je aangevallen bent, en hoe vaak de aanval succesvol is
// afgeslagen, hoeveel tribuut gegeven is (met exacte aantallen), en hoeveel
// wachttorens door indringers zijn gesloopt"). Een "aanval" is elk
// indringers-incident op een streek met een beschermende Wachttoren (zie
// `verwerkIndringers` in indringersEnDieren.ts) — zonder Wachttoren eisen de
// indringers in plaats daarvan tribuut, dat hier los geteld wordt.
// `aanvallenAfgeslagen` telt de uitkomsten "standhouden" en "bonus" (de
// Wachttoren hield stand); `wachttorensGesloopt` telt de "malus"-uitkomst
// (de Wachttoren wordt een ruïne) — samen dus altijd gelijk aan
// `aanvallenTotaal`.
export interface IndringersStatistieken {
  aanvallenTotaal: number;
  aanvallenAfgeslagen: number;
  wachttorensGesloopt: number;
  tribuutGegevenAantal: number;
  tribuutGegeven: Record<MateriaalType, number>;
}

// Kudde-melding (hoofdstuk 17: "verschijnt een kudde, dan meldt een pop-up
// dit meteen — dezelfde stijl als de indringers-pop-up"), gezet door
// `verwerkKuddes` in economie.ts zodra er een nieuwe wilde kudde verschijnt.
// Puur een meldings-vlag (geen keuze zoals `IndringersEvent`) — de speler
// klikt 'm gewoon weg via `sluitKuddeMelding`.
export interface KuddeEvent {
  hoogte: number;
  positieInStreek: number;
}

// Roofdier-melding (hoofdstuk 14/17, issue: "roofdieren toevoegen"): gezet
// door `jaag` zodra een roofdier verschijnt (`fase: "verschenen"`) en
// opnieuw door `verwerkRoofdieren` als de settler bij de aanval nog op het
// vakje staat (`fase: "aanval"`). Twee losse momenten van dezelfde dreiging,
// zelfde patroon als `IndringersEvent.fase` hierboven.
export interface RoofdierEvent {
  hoogte: number;
  positieInStreek: number;
  fase: "verschenen" | "aanval";
}

// Volledige spelstatus voor de MVP (één actieve stad, één band van 9 vakjes,
// meerdere streken). Zie hoofdstuk 13 voor de scope-afbakening.
export interface GameState {
  stad: City;
  streken: Streek[];
  voorraad: Record<MateriaalType, number>;
  opslagCap: number;
  voedsel: number; // aparte voorraad, geen gedeelde cap (hoofdstuk 5 / 11)
  // Voortgangs-valuta richting streek-ontgrendeling (M5): geen opslag-cap, blijft
  // cumulatief oplopen (ook voorbij de drempel van de eerstvolgende streek) —
  // zie hoofdstuk 5, "Voortgangs-valuta".
  cultuur: number;
  // Wetenschap (hoofdstuk 3/5/9/11/13, issue: "tech tree toevoegen"): net als
  // cultuur een voortgangs-valuta zonder opslag-cap, die niet "uitgegeven"
  // wordt (hoofdstuk 5) — maar ontgrendelt geen los vooruitkijk-bereik (dat
  // blijft post-MVP, zie hoofdstuk 13), enkel de technologie-boom hieronder.
  wetenschap: number;
  // Gekozen technologieën, in volgorde van drempel (hoogstens 3 — hoofdstuk
  // 3/9). `technologieen.length` is tegelijk de laatst bereikte, opgeloste
  // drempel: de eerstvolgende te bereiken drempel is dus altijd
  // `technologieen.length + 1`. Het niet-gekozen pad op elke drempel (en
  // alles daaronder) wordt hierdoor vanzelf nooit bereikbaar — dezelfde
  // permanente vertakkingslogica als de Anker-verhalen (hoofdstuk 9/11).
  technologieen: TechId[];
  // Lopende technologie-keuze (hoofdstuk 9/11: dezelfde blokkerende
  // meldings-vorm als `indringersEvent` hieronder), gezet door
  // `verwerkTechDrempel` in economie.ts zodra de cumulatieve wetenschap de
  // eerstvolgende drempel haalt. `undefined` zolang er geen (onopgeloste)
  // keuze openstaat.
  techKeuzeEvent?: { drempel: TechDrempel; opties: [TechId, TechId] };
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
  // met beurten/steden/streken"), genomen vlak vóór `verwerkVerval` de status
  // terugzet naar een verse start. Alleen relevant zolang
  // `laatsteIneenstorting` `true` is; puur UI-weergave, geen spelregel.
  laatsteRunStatistieken?: {
    beurten: number;
    stedenGebouwd: number;
    hoogsteStreek: number;
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
  // Gezet zodra de speler een nieuwe stad heeft gesticht (hoofdstuk 2/10/16,
  // issue: "stad stichten op de frontier" — vervangt "bereik streek 12" als
  // tutorial-einddoel). De settler is dan al verdwenen (`settler` teruggezet
  // naar `undefined` door `stichtStad` in economie.ts) en dit vlag triggert
  // de afsluitende tutorial-scène/samenvatting (zie GameRoot), net als
  // `laatsteIneenstorting` hierboven het game-over-scherm triggert — maar dan
  // de winnende afsluiting in plaats van de verliezende.
  stadGesticht?: boolean;
  // Kudde- & roofdier-meldingen (hoofdstuk 14/17): zie `KuddeEvent`/
  // `RoofdierEvent` hierboven. `undefined` zolang er geen (onopgeloste)
  // melding is, net als `indringersEvent` hierboven.
  kuddeEvent?: KuddeEvent;
  roofdierEvent?: RoofdierEvent;
  // Amberader-ontdekking (hoofdstuk 3/14, issue: "toevoeging Goud"): gezet
  // door `verwerkStreekOntgrendeling` in economie.ts zodra streek
  // `AMBER_ONTDEKKING_STREEK` (world.ts) voor het eerst ontgrendeld wordt — de
  // gegarandeerde eerste Amberader-locatie ligt op die streek. Puur een
  // meldings-vlag (geen keuze), zelfde patroon als `kuddeEvent` hierboven; de
  // speler klikt 'm gewoon weg via `sluitAmberOntdektMelding`.
  amberOntdektEvent?: boolean;
  // Tweede Amberader-ontdekking (hoofdstuk 3/11/14, issue: "Amberader
  // sowieso op streek 12"): zelfde meldings-vlag-patroon als
  // `amberOntdektEvent` hierboven, maar gezet zodra streek
  // `AMBER_ONTDEKKING_STREEK_2` (world.ts) voor het eerst ontgrendeld wordt —
  // de gegarandeerde tweede Amberader-locatie, softlock-preventie vlak vóór
  // de Bezette Streek. Los gehouden van `amberOntdektEvent` zodat beide
  // meldingen onafhankelijk van elkaar getriggerd en weggeklikt worden.
  tweedeAmberOntdektEvent?: boolean;
  // Gezet zodra een roofdier de settler daadwerkelijk doodt (hoofdstuk 17,
  // issue: "roofdieren toevoegen"). Voorkomt dat de "settler verschijnt bij
  // beurt 2"-vangnet in `volgendeBeurt` (economie.ts) hem daarna gratis laat
  // terugkeren — precies dezelfde bescherming die `stadGesticht` hierboven al
  // geeft na het stichten. Een vervangende settler is daarna alleen nog te
  // krijgen via de civiele improvement-pool (`startNieuweSettler`), zoals
  // hoofdstuk 17 beschrijft.
  settlerVerlorenAanRoofdier?: boolean;
  // Bezette Streek (hoofdstuk 6, issue: "De Bezette Streek, missionaris en
  // verkenner", Deel 3): Verkenning is een losse actie, gescheiden van de
  // settler-acties (`settlerActieGedaanDitBeurt` hierboven) — hoogstens 1
  // keer per beurt, zelfde patroon, teruggezet door `volgendeBeurt`.
  verkenningGedaanDitBeurt: boolean;
  // Dynamische pop-up-meldingen voor de Bezette Streek (Deel 2/4) — zelfde
  // meldings-vlag-patroon als `amberOntdektEvent` hierboven: `undefined`/
  // `false` zolang er geen (onopgeloste) melding is.
  bezetteStreekOntdektEvent?: boolean;
  vijandelijkHeiligdomOnthuldEvent?: boolean;
  vijandelijkHeiligdomVernietigdEvent?: boolean;
  // Resultaat van de laatst afgehandelde Confrontatie tegen een Bezette Streek
  // (Deel 5) — los van `laatsteConfrontatie` hierboven (dat blijft de gewone
  // frontier-Confrontatie) omdat de twee losstaande systemen zijn met een
  // eigen eigen-legerwaarde-formule en een eigen verlies-effect (ruïne i.p.v.
  // versnelde uitputting).
  laatsteConfrontatieBezetteStreek?: ConfrontatieResultaat;
  // Per-run instelling (issue: "een setting waarmee je deze uitleg pop-ups
  // aan en uit kunt zetten ... voor deze run specifiek") — schakelt alle
  // tutorial-uitleg-pop-ups (openings-uitleg, settler, voedsel/boerderij,
  // militair) in of uit via het hoofdmenu, los van de standaard-instelling
  // (zie save.ts: `standaardUitlegAan`) waarmee elke nieuwe run start. Laat
  // streek-flavor, indringers-meldingen en de tutorial-voltooid-samenvatting
  // ongemoeid — dat is kerninhoud, geen uitleg.
  uitlegPopupsAan: boolean;
  // Cumulatieve indringers-statistieken van deze run (issue: "Settings
  // uitbreiden" — uitgebreid historiescherm), zie `IndringersStatistieken`
  // hierboven. Bijgehouden door `verwerkIndringers`/`geefTribuut`
  // (indringersEnDieren.ts), getoond door `berekenHistorieStatistieken`
  // (uitputtingEnVerval.ts) via HistoriePaneel.
  indringersStatistieken: IndringersStatistieken;
}
