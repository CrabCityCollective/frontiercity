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
  // Expliciete uitzondering op de algemene regel "bouwen kan alleen op de
  // frontier-laag" (hoofdstuk 6/11): momenteel alleen de Wachttoren. Zonder
  // deze uitzondering zou een achtergelaten laag permanent onverdedigbaar
  // zijn zodra de frontier verder trekt, terwijl indringers-incidenten op
  // elke ontgrendelde laag kunnen vallen (niet meer alleen de frontier).
  // `undefined`/`false` = de normale frontier-only regel geldt.
  bouwbaarBuitenFrontier?: boolean;
  // Alleen beschikbaar in de bouw-opties nadat deze tech gekozen is (hoofdstuk
  // 3/9, Deel 2 van "tech tree toevoegen"): momenteel alleen de Voorraadkuil,
  // ontgrendeld door "aardewerk". `undefined` = altijd beschikbaar (los van
  // de technologie-boom), zoals bijna elke andere improvement.
  vereisteTech?: TechId;
  // Alleen beschikbaar in de bouw-opties zodra deze laaghoogte ontgrendeld is
  // (issue: "tutorial popups wijzigen" — Sterrencirkel/Wetenschappelijk pas
  // vanaf laag 3, Wachttoren/Militair pas vanaf laag 2, allebei uitgegrijsd
  // ervoor). `undefined` = altijd beschikbaar, zoals bijna elke andere
  // improvement. Gebruikt de hoogst ontgrendelde laag (frontier), niet de
  // laag waar de speler op dat moment op bouwt — zelfde reden als
  // `bouwbaarBuitenFrontier`: eenmaal ontgrendeld blijft de categorie
  // beschikbaar, ook op een oudere laag.
  minLaag?: number;
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
  // Roofdier (hoofdstuk 14/17, issue: "roofdieren toevoegen"): kan vanaf
  // laag 5 verschijnen op het vakje waar de settler net gejaagd heeft (zie
  // `jaag` in economie.ts) — nooit los van een kudde-jachtactie. Valt pas de
  // beurt ná verschijnen aan (`beurtenTotAanval` telt af in
  // `verwerkRoofdieren`, economie.ts): staat de settler er op dat moment nog
  // (of weer) op, dan sterft hij. Geen eigen ghost-town-achtige nasleep — het
  // veld verdwijnt gewoon weer zodra de aanval is afgehandeld.
  roofdier?: {
    beurtenTotAanval: number;
  };
  // Ligt dit vakje aan vers water — een rivier of een meer (hoofdstuk 2:
  // "een stad kan alleen gesticht worden op een vakje dat aan vers water
  // ligt")? Vast, niet-procedureel (net als `terrein`) — de tutorial-worldgen
  // garandeert minstens één zulk vakje tussen laag 10 en 12 (zie world.ts).
  // Geen terrein-eis op zichzelf: een vlak, bos-, heuvel- of bergvakje kan
  // allemaal aan water liggen, dus los van `terrein` bijgehouden.
  versWater?: boolean;
  // Ligt hier een amberader — de vondst die de Amberader/goudmijn-improvement
  // (hoofdstuk 3/14, issue: "toevoeging Goud") nodig heeft, bovenop de gewone
  // heuvel/berg-terreineis? Net als `versWater` hierboven vast/niet-procedureel
  // en los van `terrein` bijgehouden: niet elk heuvel/bergvakje heeft een
  // amberader, in tegenstelling tot een gewone erts-mijn die op elk
  // heuvel/bergvakje mag. De tutorial-worldgen garandeert minstens één zulk
  // vakje vanaf laag 7 (zie world.ts).
  amber?: boolean;
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
// het militaire paneel gezet (kies een strijder → kies een wachttoren).
// Toewijzen is omkeerbaar (hoofdstuk 6/11, issue: "wachttorens, bemanning en
// bevoorrading"): een bemande strijder kan teruggehaald worden
// (`haalStrijderTerug` in economie.ts) en meteen elders opnieuw bemand —
// verplaatsen tussen wachttorens kost geen beurten (issue: "wachttoren
// tweaks").
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

// Indringers & tribuut (hoofdstuk 6): elke beurt is er, zodra laag 2
// ontgrendeld is, een kans dat er ergens een incident plaatsvindt — de
// getroffen laag wordt geloot uit alle ontgrendelde lagen (ook beschermde).
// `tribuut` is alleen aanwezig als er geen beschermende Wachttoren (voltooid,
// bemand én wegverbonden) op die laag staat.
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
export interface IndringersEvent {
  laagHoogte: number;
  stamNaam: string;
  heeftWachttoren: boolean;
  tribuut?: IndringersTribuut;
  fase: "gemeld" | "geforceerd" | "betaald";
}

// Kudde-melding (hoofdstuk 17: "verschijnt een kudde, dan meldt een pop-up
// dit meteen — dezelfde stijl als de indringers-pop-up"), gezet door
// `verwerkKuddes` in economie.ts zodra er een nieuwe wilde kudde verschijnt.
// Puur een meldings-vlag (geen keuze zoals `IndringersEvent`) — de speler
// klikt 'm gewoon weg via `sluitKuddeMelding`.
export interface KuddeEvent {
  hoogte: number;
  positieInLaag: number;
}

// Roofdier-melding (hoofdstuk 14/17, issue: "roofdieren toevoegen"): gezet
// door `jaag` zodra een roofdier verschijnt (`fase: "verschenen"`) en
// opnieuw door `verwerkRoofdieren` als de settler bij de aanval nog op het
// vakje staat (`fase: "aanval"`). Twee losse momenten van dezelfde dreiging,
// zelfde patroon als `IndringersEvent.fase` hierboven.
export interface RoofdierEvent {
  hoogte: number;
  positieInLaag: number;
  fase: "verschenen" | "aanval";
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
  // Gezet zodra de speler een nieuwe stad heeft gesticht (hoofdstuk 2/10/16,
  // issue: "stad stichten op de frontier" — vervangt "bereik laag 12" als
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
  // door `verwerkLaagOntgrendeling` in economie.ts zodra laag
  // `AMBER_ONTDEKKING_LAAG` (world.ts) voor het eerst ontgrendeld wordt — de
  // gegarandeerde eerste Amberader-locatie ligt op die laag. Puur een
  // meldings-vlag (geen keuze), zelfde patroon als `kuddeEvent` hierboven; de
  // speler klikt 'm gewoon weg via `sluitAmberOntdektMelding`.
  amberOntdektEvent?: boolean;
  // Gezet zodra een roofdier de settler daadwerkelijk doodt (hoofdstuk 17,
  // issue: "roofdieren toevoegen"). Voorkomt dat de "settler verschijnt bij
  // beurt 2"-vangnet in `volgendeBeurt` (economie.ts) hem daarna gratis laat
  // terugkeren — precies dezelfde bescherming die `stadGesticht` hierboven al
  // geeft na het stichten. Een vervangende settler is daarna alleen nog te
  // krijgen via de civiele improvement-pool (`startNieuweSettler`), zoals
  // hoofdstuk 17 beschrijft.
  settlerVerlorenAanRoofdier?: boolean;
  // Per-run instelling (issue: "een setting waarmee je deze uitleg pop-ups
  // aan en uit kunt zetten ... voor deze run specifiek") — schakelt alle
  // tutorial-uitleg-pop-ups (openings-uitleg, settler, voedsel/boerderij,
  // militair) in of uit via het hoofdmenu, los van de standaard-instelling
  // (zie save.ts: `standaardUitlegAan`) waarmee elke nieuwe run start. Laat
  // laag-flavor, indringers-meldingen en de tutorial-voltooid-samenvatting
  // ongemoeid — dat is kerninhoud, geen uitleg.
  uitlegPopupsAan: boolean;
}
