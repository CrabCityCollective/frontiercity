// Spiegelt de data-schema's uit frontier-city-design-doc.md, hoofdstuk 13.
// Velden met een `?` zijn bewust al aanwezig voor post-MVP features (zeldzaamheid,
// vooruitkijk) maar worden in de MVP nog niet gebruikt.

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
  | "trekdier"
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

// Vaste inhoud van een Wampanoag-vakje op de Wampanoag-streek van Going West
// (M21e, opdracht-wampanoag-opening.md §5; blokkerend gemaakt sinds issue:
// "Wampanoag streek blokkerend"): net als `BezetteStreekInhoud` hierboven een
// functionele sleutel i.p.v. een direct `Improvement`-object, bepaald bij het
// ontstaan van de laag (`initialiseerWampanoagLaag`, worldGoingWest.ts) en
// pas naar een echte `Improvement` opgelost zodra Verkenning het vakje
// onthult (zie `Tile.wampanoagVerhuld` hieronder en wampanoag.ts). Net als de
// Bezette Streek blijft de streek zelf `ontgrendeld: false` (zie
// `Streek.wampanoagBezet`) tot de drie handelsvakjes onthuld zijn — de
// overige vakjes zijn "neutraal" (net als bij de Bezette Streek) en
// onthullen automatisch mee zodra die drie klaar zijn. `"tentje"` (issue
// "Wampanoag kamp uitbreiding") is zo'n vakje met bijzondere inhoud zonder
// handelsfunctie — puur decoratief, zie `WAMPANOAG_TENTJE` (improvements.ts):
// laat het kamp groter/voller ogen naast de drie functionele gebouwen.
export type WampanoagInhoud = "maisboerderij" | "beverjachthut" | "opperhoofdtent" | "tentje";

// Grondstofkeuze voor de handelsconversie op een onthuld Wampanoag-vakje
// (M21f, opdracht-wampanoag-opening.md §6): welke grondstof de speler kiest
// om elke beurt 1:1 om te zetten in het bijbehorende handelswaar
// (`wampanoag.ts`: `WAMPANOAG_GOED_VOOR_INHOUD`). Maïsboerderij/Beverjachthut
// bieden alleen gereedschap aan (issue: "Smederij inactief zetten" — erts is
// hier bewust geschrapt als keuze, zodat de Smederij de enige erts-afzet
// blijft), Opperhoofdtent alleen goud (opdracht §6, tabel).
export type WampanoagHandelKeuze = "gereedschap" | "goud";

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
  // Alleen beschikbaar binnen deze specifieke campagne (issue: "Onrust,
  // Saloon en Courthouse" — Saloon/Courthouse horen alleen bij Going West,
  // niet bij de tutorial of enige andere campagne). Anders dan `minStreek`
  // hierboven (een tutorial-pacing-drempel die `beschikbareOpties` overslaat
  // zodra er een campagne actief is, zie de comment daar in improvements.ts)
  // geldt `minStreek` hier wél nog binnen de eigen campagne: het is voor zo'n
  // campagne-exclusieve improvement het eigen introductiepunt, niet een
  // tutorial-only tempo-beperking. `undefined` = beschikbaar in elke
  // campagne (en de tutorial), zoals bijna elke andere improvement.
  vereisteCampagneId?: string;
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
  // Roofdier (hoofdstuk 14/17, issue: "roofdieren toevoegen"; vanaf
  // `ROOFDIER_MIN_STREEK`, world.ts): kan verschijnen op het vakje waar de
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
  // Verkenner onderweg (issue: "Bezette streek scherm" — vervangt de eerdere
  // Verkenner-rekrutering + losse Verkenning-modus): een klik op dit nog
  // verhulde vakje stuurt direct een verkenner (kost dezelfde grondstoffen als
  // vroeger de Verkenner-eenheid, plus wetenschap, zie streekOntgrendeling.ts
  // `VERKENNING_KOSTEN_WETENSCHAP`) — geen losse eenheid meer nodig. Telt af
  // met 1 per beurt (`verwerkVerkenningInGang`); op 0 wordt het vakje onthuld
  // en verdwijnt dit veld weer. Hoogstens 1 tegelijk gestart per beurt
  // (`GameState.verkenningGedaanDitBeurt`), maar er kunnen best meerdere
  // vakjes tegelijk "onderweg" zijn als ze op verschillende beurten gestart
  // zijn.
  verkenningInGang?: { beurtenResterend: number };
  // Wololo-meter van dit specifieke vijandelijke Heiligdom (issue: "Bezette
  // streek scherm" — vervangt de eerdere streek-brede belegeringsmeter):
  // vult zich zodra er minstens één Missionaris hierheen gestuurd is (zie
  // `Missionaris.doelHeiligdom`), tot `BELEGERINGSDREMPEL`
  // (streekOntgrendeling.ts) — daarna wordt dit vakje een eigen Heiligdom in
  // plaats van vernietigd te worden. Alleen relevant op een tile met
  // `bezetteStreekInhoud === "heiligdom"`.
  wololoVoortgang?: number;
  // Ligt dit vakje aan vers water — een rivier of een meer (hoofdstuk 2:
  // "een stad kan alleen gesticht worden op een vakje dat aan vers water
  // ligt")? Vast, niet-procedureel (net als `terrein`) — de tutorial-worldgen
  // garandeert precies één zulk vakje, uitsluitend op de allerlaatste streek
  // (de oceaan aan de overkant, zie world.ts `TUTORIAL_VERS_WATER`) — de
  // enige plek in de hele tutorial met vers water. Geen terrein-eis op
  // zichzelf: een vlak, bos-, heuvel- of bergvakje kan allemaal aan water
  // liggen, dus los van `terrein` bijgehouden.
  versWater?: boolean;
  // Ligt hier een goudader — de vondst die de Goudader/goudmijn-improvement
  // (hoofdstuk 3/14, issue: "toevoeging Goud") nodig heeft, bovenop de gewone
  // heuvel/berg-terreineis? Net als `versWater` hierboven vast/niet-procedureel
  // en los van `terrein` bijgehouden: niet elk heuvel/bergvakje heeft een
  // goudader, in tegenstelling tot een gewone erts-mijn die op elk
  // heuvel/bergvakje mag. De tutorial-worldgen garandeert minstens één zulk
  // vakje vanaf streek 8 (zie world.ts).
  goud?: boolean;
  // Wampanoag-laag, Going West (M21e, opdracht-wampanoag-opening.md §5; sinds
  // issue "Wampanoag streek blokkerend" alle negen vakjes van de streek, niet
  // meer alleen de drie handelsvakjes): een eigen, per-tegel verhullingslaag
  // — bewust met eigen velden i.p.v. het hergebruiken van
  // `verhuld`/`bezetteStreekInhoud`/`verkenningInGang` hierboven, want die
  // zijn semantisch aan de Bezette-Streek-toestandsmachine gekoppeld
  // (`Streek.bezet`, met zijn eigen `verwerkBelegering`-resolutielogica die
  // niet op Wampanoag-inhoud past — zie `Streek.wampanoagBezet`). Blijft
  // verhuld tot de speler er een Verkenner naartoe stuurt (wampanoag.ts,
  // hergebruikt dezelfde kosten/bouwtijd/1x-per-beurt-limiet als de
  // Bezette-Streek-Verkenning, geen nieuwe kostenbalans) — alleen de drie
  // vakjes met `wampanoagInhoud` moeten daadwerkelijk verkend worden, de
  // overige zes onthullen automatisch mee zodra die drie klaar zijn. `undefined`
  // op elk ander vakje (ook buiten de Wampanoag-streek).
  wampanoagVerhuld?: boolean;
  wampanoagInhoud?: WampanoagInhoud;
  // Verkenner onderweg naar een Wampanoag-vakje — zelfde aftel-patroon als
  // `verkenningInGang` hierboven, maar los geteld zodat de twee lagen elkaar
  // nooit kunnen overschrijven (ook al draaien ze in de praktijk nooit
  // tegelijk, zie de comment bij `wampanoagVerhuld` hierboven).
  wampanoagVerkenningInGang?: { beurtenResterend: number };
  // Handelskeuze op een onthuld Wampanoag-vakje (M21f, opdracht-wampanoag-
  // opening.md §6): welke grondstof de speler momenteel kiest om elke beurt
  // om te zetten in het bijbehorende handelswaar (`verwerkWampanoagHandel`,
  // wampanoag.ts). `undefined` = geen actieve handel (nog niet gekozen, of
  // gepauzeerd) — instant omkeerbaar door opnieuw te klikken, zelfde patroon
  // als Wachttoren-bemanning.
  wampanoagHandelKeuze?: WampanoagHandelKeuze;
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
  // Wampanoag-laag (Going West, issue: "Wampanoag streek blokkerend"): zelfde
  // blokkerende rol als `bezet` hierboven — `true` zolang deze streek (zie
  // `WAMPANOAG_STREEK_HOOGTE`, worldGoingWest.ts) nog niet volledig verkend
  // is, `ontgrendeld` blijft dan ook `false` (settler/frontier komen er niet
  // voorbij, streek-ontgrendeling op wetenschap stopt hier, zie
  // `verwerkStreekOntgrendeling` in streekOntgrendeling.ts). Bewust een eigen
  // vlag i.p.v. hergebruik van `bezet`: `verwerkBelegering` zoekt op `bezet`
  // en gaat uit van vijandelijke Heiligdom-/Wachttoren-inhoud, die een
  // Wampanoag-streek niet heeft — die functie zou een Wampanoag-streek
  // per ongeluk meteen als "opgelost" behandelen. Wordt `false` zodra de drie
  // Wampanoag-vakjes onthuld zijn (`verwerkWampanoagVerkenningInGang`,
  // wampanoag.ts), net als `bezet` daarna telt de streek dan als normaal
  // ontgrendeld.
  wampanoagBezet?: boolean;
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
// Individuele opgeleide Missionaris-eenheid (issue: "Bezette streek scherm" —
// vervangt de eerdere "telt alleen mee zolang hij bestaat"-vereenvoudiging):
// net als een Strijder aan een Wachttoren/Legerkamp, wordt een Missionaris nu
// aan één specifiek vijandelijk Heiligdom toegewezen door op dat vakje op de
// kaart te klikken (`stuurMissionaris` in streekOntgrendeling.ts). Zonder
// toewijzing draagt hij niet bij aan een wololo-meter — `undefined` betekent
// "nog niet gestuurd, vrij inzetbaar".
export interface Missionaris {
  id: string;
  doelHeiligdom?: { hoogte: number; positieInStreek: number };
}

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

// Individuele opgeleide Rechter-eenheid (issue: "Onrust, Saloon en
// Courthouse", Going West): zelfde bemannings-patroon als een Strijder op een
// Wachttoren (`Strijder.wachttoren` hierboven) — een Rechter zonder
// `courthouse`-toewijzing is vrij inzetbaar, toewijzen/terughalen gaat via
// een klik op de Courthouse-tile zelf (net als Wachttoren-bemanning) en is
// net zo omkeerbaar/instant.
export interface Rechter {
  id: string;
  courthouse?: { hoogte: number; positieInStreek: number };
}

export interface City {
  naam: string;
  grootte: "klein" | "middel" | "groot";
  relics: Relic[];
  vervalStatus: "gezond" | "kritiek";
  vervalBeurtenResterend?: number;
  // Streek-hoogte waarop deze stad gesticht is (0 voor de allereerste stad
  // van een run, die "vóór streek 1" ligt) — hoofdstuk 9/14, issue: "Eerste
  // bouwsteen van de Amerikaanse frontier-campagne". Ligt na stichting vast;
  // samen met de hoogst ontgrendelde streek de basis voor de afstand tot de
  // frontier (zie `frontierAfstand` in stad.ts), die alleen kan groeien
  // omdat de frontier alleen vooruit beweegt. Bepaalt via `stadEffectiviteit`
  // (M17) het effectiviteitsverval op city-improvement-productie zodra een
  // run meer dan één stad heeft (M18, `stichtStad` in acties.ts).
  streekHoogte: number;
  // Kolom (0-8) binnen die streek waar de stad-tegel daadwerkelijk staat
  // (issue: "Tweede stad" — een nieuw gebouwde settler verscheen na de
  // tweede stichting altijd terug op de vaste starttegel i.p.v. bij de net
  // gestichte stad, omdat die positie nergens werd vastgelegd). Voor de
  // allereerste stad altijd `STAD_POSITIE` (`maakStartStreek`/
  // `maakInitieleWereldGoingWest`); voor elke volgende stichting de kolom
  // waar de settler op dat moment stond (`stichtStad`, acties.ts) — kan van
  // `STAD_POSITIE` afwijken zodra de Amerikaanse-campagnewereld (hoofdstuk
  // 8/14) settlers niet meer dwingt om exact op de middelste kolom te
  // stichten.
  positieInStreek: number;
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
  // Lopende tweede-settler-bouw (hoofdstuk 11/13/16, issue: "Altijd 2e
  // settler" #236): eigen wachtrij, los van `civielInAanbouw` — zo kan de
  // speler tegelijk in de stad investeren (groei of de eerste settler) én de
  // tweede settler herbouwen, in plaats van steeds te moeten kiezen. Zelfde
  // kosten/bouwtijd als de eerste settler (`NIEUWE_SETTLER`,
  // groeiEnRekrutering.ts). Pas te starten vanaf streek 7
  // (`kanTweedeSettlerBouwen`) en, anders dan de eerste settler, permanent
  // herbouwbaar: verlies je 'm (roofdier) of verbruik je 'm (stad stichten),
  // dan kan deze wachtrij meteen weer gestart worden.
  tweedeSettlerInAanbouw?: {
    improvement: Improvement;
    voortgang: Partial<Record<ResourceType, number>>;
  };
  // Missionaris-eenheden (Deel 4, issue: "De Bezette Streek, missionaris en
  // verkenner" — herzien door "Bezette streek scherm") — culturele units,
  // alleen trainbaar zodra er een voltooid Offer Altaar staat (zie
  // `heeftOfferAltaar`/`startMissionarisRecrutering` in economie.ts). Elke
  // Missionaris kan aan één specifiek vijandelijk Heiligdom toegewezen worden
  // (zie `Missionaris.doelHeiligdom` hierboven) — geen losse Verkenner-eenheid
  // meer sinds "Bezette streek scherm" (die actie kost nu direct grondstoffen
  // per klik, zie `Tile.verkenningInGang`).
  missionarissen: Missionaris[];
  missionarisInAanbouw?: {
    improvement: Improvement;
    voortgang: Partial<Record<ResourceType, number>>;
  };
  // Rechter-eenheden (issue: "Onrust, Saloon en Courthouse", Going West) —
  // zelfde soort losstaande unit-lijst + eigen trainingswachtrij als
  // `missionarissen`/`missionarisInAanbouw` hierboven, maar dan voor het
  // Courthouse: een Rechter bemant een Courthouse-tile (zie `Rechter`
  // hierboven) om diens onrust-onderdrukkend effect te activeren (onrust.ts).
  // Geen voorwaarde vooraf (anders dan de Missionaris, die een voltooid Offer
  // Altaar vereist) — een Rechter is los van een al gebouwd Courthouse
  // trainbaar.
  rechters: Rechter[];
  rechterInAanbouw?: {
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
  // Smederij (Going West, M21d, opdracht-wampanoag-opening.md §3): eigen
  // wachtrij, los van `cityVerbeteringInAanbouw` — zelfde "buiten de cap"-
  // uitzondering als Opslagplaats hierboven (reden: zou bij een kleine stad
  // de facto verplicht zijn), dus ook een eigen wachtrij in plaats van de
  // gedeelde gecapte pool. Anders dan Opslagplaats niet herhaalbaar: één
  // Smederij per stad volstaat (`heeftSmederij` hieronder), meer heeft in de
  // MVP geen extra effect.
  smederijInAanbouw?: {
    improvement: Improvement;
    voortgang: Partial<Record<ResourceType, number>>;
  };
  // Of deze stad al een voltooide Smederij heeft (Going West, M21d) — bepaalt
  // of de erts→gereedschap-conversie (`verwerkProductie`, productie.ts) elke
  // beurt meedraait. Blijft `false` in de tutorial (nooit gebouwd, geen UI-pad
  // ernaartoe daar) en blijft, net als de Smederij zelf, ook na de Wampanoag-
  // openingsfase gewoon staan (opdracht-wampanoag-opening.md §3: "blijft
  // nuttig voor latere campagne-lagen").
  heeftSmederij: boolean;
  // Of de voltooide Smederij momenteel meedraait (issue: "Smederij inactief
  // zetten") — losstaand van `heeftSmederij` hierboven, dat alleen bijhoudt
  // of het gebouw er staat. Standaard `true` zodra de Smederij klaar is
  // (`verwerkSmederij`/`versnelSmederijMetGoud`, groeiEnRekrutering.ts), de
  // speler kan 'm via `zetSmederijActief` pauzeren/hervatten om de lopende
  // erts-consumptie stil te leggen zonder het gebouw kwijt te raken (zelfde
  // instant-omkeerbare toggle-conventie als de Wampanoag-handelskeuze en
  // Wachttoren-bemanning). Betekenisloos zolang `heeftSmederij` nog `false`
  // is; blijft dan gewoon op de standaardwaarde staan.
  smederijActief: boolean;
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

export interface CampaignConfig {
  id: string;
  naam: string;
  tegelSet: string; // asset-map referentie
  multipliers: Partial<{
    uitputtingssnelheid: number;
    pushbackFrequentie: number;
    zeldzaamheidLegendarisch: number;
  }>;
  // Herbruikbaarheid van de technologie-boom per campagne (hoofdstuk 3/9/13,
  // issue: "tech tree toevoegen"): dezelfde functionele `TechId`-sleutels
  // (techTree.ts) krijgen per campagne een eigen naam/flavor (bijv. "IJzeren
  // ploeg" i.p.v. "Vuur temmen" voor een latere campagne), zonder de boom of
  // effecten te wijzigen — zelfde aanpak als `tegelSet` hierboven. Ontbreekt
  // een sleutel (of de hele campagne heeft geen override), dan valt
  // `techNaam()` terug op de tutorial-naam.
  techNamen?: Partial<Record<TechId, string>>;
  // Zelfde herbruikbaarheid als `techNamen` hierboven, maar voor land/city
  // improvements (hoofdstuk 3/14, issue: "toevoeging Goud" — de Goudader is
  // hier het eerste voorbeeld van: functioneel een goudmijn, met "Goudader"
  // als tutorial-naam). Gesleuteld op `Improvement.id`, niet op een apart
  // ID-type zoals `TechId` — improvements hebben geen vaste, opgesomde
  // sleutellijst. Ontbreekt een sleutel (of de hele campagne heeft geen
  // override), dan valt `improvementNaam()` terug op `Improvement.naam`.
  improvementNamen?: Partial<Record<string, string>>;
  // Narratieve/flavor-pop-up-teksten, gesleuteld op een functionele sleutel
  // (bijv. `eersteContactPopup`) — M21a (opdracht-wampanoag-opening.md,
  // hoofdstuk 8/9), zelfde terugval-patroon als `techNamen`/`improvementNamen`
  // hierboven: ontbreekt de sleutel (of heeft de campagne geen override), dan
  // toont de aanroepende code bewust geen tekst in plaats van op een andere
  // campagne se flavor terug te vallen — dat zou tutorial-lore in de
  // Amerikaanse campagne (of andersom) lekken. Puur narratieve pop-ups; de
  // universele mechaniek-uitleg-pop-ups (streek-tutorial-teksten) en de
  // generieke systeem-pop-ups (bevestigingsschermen) blijven bewust buiten
  // `CampaignConfig` — zie opdracht-wampanoag-opening.md §8 voor de driedeling.
  popupTeksten?: Partial<Record<string, string>>;
  // Welke stam-naam(en) `verwerkIndringers` (indringersEnDieren.ts) toont bij
  // een indringers-incident (issue: "Going west: indringers" — de invallen op
  // Going West moeten van de Wampanoag afkomstig zijn i.p.v. de generieke
  // fictieve tutorial-namen). Zelfde terugval-patroon als `techNamen`/
  // `improvementNamen` hierboven: ontbreekt deze lijst (of de hele campagne
  // heeft geen override), dan valt `verwerkIndringers` terug op de tutorial-
  // pool (`INDRINGERS_STAMMEN`, tutorialContent.ts). Geldt voor de hele
  // campagne — een streek-afhankelijke wisseling naar andere stammen is nog
  // niet gebouwd.
  indringersStamNamen?: string[];
  // Vervolg op de Wampanoag-opening (issue "Na de Wampanoag", M22): zodra
  // `GameState.cultureelOntgrendeld` overgaat op `true` (de 3-3-3-
  // handelsdrempel, wampanoag.ts) tellen streken tot en met deze hoogte niet
  // meer mee in de `verwerkIndringers`-streek-trekking — de Wampanoag zijn nu
  // bondgenoten, hun voormalige invalsgebied wordt blijvend veilig. Optioneel,
  // zelfde terugval-patroon als hierboven: ontbreekt dit veld (elke andere
  // campagne, of de tutorial — die start al op `cultureelOntgrendeld: true`
  // maar heeft geen eigen `CampaignConfig`), dan verandert er niets aan het
  // bestaande gedrag.
  indringersUitgeslotenTotHoogteNaVerbond?: number;
  // Vervangt `indringersStamNamen` hierboven zodra de omslag hierboven actief
  // is: nieuwe stammen nemen de invallen over van de Wampanoag, die na het
  // verbond zelf geen invallen meer plegen. Ontbreekt dit veld, dan blijft
  // `indringersStamNamen` ook ná de omslag gewoon gelden.
  indringersStamNamenNaVerbond?: string[];
  // Campagne-eigen stadsnamen voor elke stad die ná de startstad gesticht
  // wordt (hoofdstuk 9/10/13, issue "Nieuwe stad Cincinnati"), zelfde
  // terugval-patroon als hierboven: geïndexeerd op `state.steden.length - 1`
  // van vóór de stichting, en ontbreekt deze lijst (of raakt ze op), dan valt
  // `nieuweStadNaam` (acties.ts) terug op de generieke tutorial-namenlijst
  // (`GESTICHTE_STAD_NAMEN`).
  stadNamen?: string[];
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

// `fase: "gemeld"` sluit rechtstreeks af via `geefTribuut` in economie.ts —
// die trekt het bedrag meteen van de voorraad af en sluit de melding in één
// stap (issue: "Indringers 2e pop-up samenvoegen" — geen apart
// bevestigingsscherm meer tussen de keuze en de daadwerkelijke afschrijving).
// Een tribuut-eis kent bewust geen weiger-optie (issue: "indringers weigeren
// droppen") — de indringers eisen het hoe dan ook op, dus de enige keuze is
// wanneer/hoe je betaalt (direct, of via de wampum-afkoop hieronder).
//
// `uitkomst` (issue: "wachttorens kunnen vernietigd worden door indringers"):
// alleen gezet als `heeftWachttoren` — de derde-uitkomst-loot (hoofdstuk 6)
// voor een beschermde streek (frontier of niet). `"standhouden"` is het
// bestaande gedrag (fase "gemeld", "houdt stand"-tekst); `"malus"` en
// `"bonus"` krijgen elk hun eigen fase/pop-up hieronder. De bijbehorende
// state-mutatie (ruïne + strijderverlies, resp. goud) is al toegepast door
// `verwerkIndringers` op het moment dat het event gezet wordt — de latere
// fase-overgangen (`bevestigGoudOnderVuur`/`sluitIndringersMelding` in
// economie.ts) zijn puur UI-voortgang, geen nieuwe state-effecten.
// `buitGoud` is alleen aanwezig bij `uitkomst: "bonus"`.
//
// `goudOnderVuur`/`fase: "goud-onder-vuur"`: onafhankelijk van
// `heeftWachttoren`/`uitkomst` — geldt voor élke indringers-melding op een
// streek met een actieve Goudader (ook de gewone tribuut-afhandeling), en
// wordt altijd als eerste getoond vóór de eigenlijke uitkomst-fase
// (`bevestigGoudOnderVuur` schuift daarna door naar die fase).
//
// `fase: "wampum-afgekocht"` (issue "Wampum — invallen tijdelijk afkopen"):
// gezet door `koopIndringersAfMetWampum` (indringersEnDieren.ts) i.p.v. het
// event meteen te wissen, zodat de pop-up eerst nog een korte bevestiging kan
// tonen — zelfde "meteen afgehandeld, alleen de UI-bevestiging staat nog
// open"-patroon als de andere niet-"gemeld"-fases hierboven. Sluit, net als
// die andere fases, af via het generieke `sluitIndringersMelding`.
export interface IndringersEvent {
  streekHoogte: number;
  stamNaam: string;
  heeftWachttoren: boolean;
  tribuut?: IndringersTribuut;
  goudOnderVuur?: boolean;
  uitkomst?: "standhouden" | "malus" | "bonus";
  buitGoud?: number;
  fase: "goud-onder-vuur" | "gemeld" | "malus" | "bonus" | "wampum-afgekocht";
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

// Wampum-afkoop (issue "Wampum — invallen tijdelijk afkopen"): generiek,
// niet aan één specifieke stam gekoppeld alternatief voor tribuut geven/
// weigeren bij een indringers-incident (`IndringersEvent.stamNaam`,
// indringersEnDieren.ts) — de speler koopt tijdelijke rust van díe stam met
// wampum uit de eigen voorraad. Bijgehouden per stam-naam, zodat afkopen bij
// de ene stam de kosten/rust van een andere stam (bijv. een latere Shawnee-
// laag) niet beïnvloedt.
export interface WampumAfkoopStatus {
  // Aantal keer dat de speler deze stam al afgekocht heeft deze playthrough —
  // bepaalt de oplopende kosten van de vólgende afkoop, zie
  // `wampumAfkoopKosten` in indringersEnDieren.ts.
  aantalAfgekocht: number;
  // Beurt tot en met welke deze stam geen nieuw indringers-incident meer mag
  // veroorzaken, vergeleken met `GameState.beurt` in `verwerkIndringers`.
  rustTotBeurt: number;
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
  // Brontabel van alle gestichte steden van deze run, in stichtingsvolgorde
  // (hoofdstuk 9/13, issue: "Eerste bouwsteen van de Amerikaanse
  // frontier-campagne", Meerdere-steden-fundering). Buiten `stad.ts` niet
  // rechtstreeks muteren — gebruik `metActieveStad` zodat deze array en
  // `stad` hieronder altijd in lockstap blijven.
  steden: City[];
  // De actieve/laatst-gestichte stad — altijd gelijk aan
  // `steden[steden.length - 1]`. Blijft (nog) het veld waar vrijwel de hele
  // bestaande MVP-code doorheen leest, omdat er ook ná M18 (herhalend
  // stichtingspatroon) nooit meer dan één stad tegelijk "actief" is —
  // eerder gestichte steden blijven gewoon in `steden` staan, alleen niet
  // meer bestuurbaar (settler, bouwwachtrijen, UI werken altijd op de
  // laatst-gestichte stad). Gebruik `actieveStad(state)`/`metActieveStad`
  // (stad.ts) in nieuwe code
  // in plaats van dit veld rechtstreeks te muteren.
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
  // alles daaronder) wordt hierdoor vanzelf nooit bereikbaar — een
  // permanente vertakkingslogica (hoofdstuk 11).
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
  // Telt, per streek-hoogte, hoe vaak de bouw-pop-up op die streek al is
  // afgehandeld (issue: "Teksten aanpassen (nog meer)") — zie
  // `metOpgehoogdeBouwPopupTeller` in infrastructuurEnBouw.ts. Gebruikt door
  // GameRoot om een aantal eenmalige tutorial-pop-ups op de juiste
  // bouw-beurt te tonen in plaats van de gewone bouw-pop-up.
  bouwPopupAfgehandeldTellerPerStreek: Record<number, number>;
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
  // "B1b. Handkar" (hoofdstuk 3/9, techTree.ts: `settlerBeweegtGratis`): de
  // eerste verplaatsing per beurt kost dan geen aparte settler-actie, zodat
  // de settler nog een andere actie kan doen. Zonder deze eigen vlag zou
  // `verplaatsSettlerNaar` (acties.ts) `settlerActieGedaanDitBeurt` nooit op
  // `true` zetten en kon de settler zo onbeperkt doorlopen (issue: "tech met
  // settler verplaatsen") — dit vlag zorgt dat alleen de éérste verplaatsing
  // gratis is, elke volgende telt weer als de gewone settler-actie. Net als
  // `settlerActieGedaanDitBeurt` teruggezet door `volgendeBeurt`.
  settlerGratisBewogenDitBeurt: boolean;
  // Tweede settler (hoofdstuk 11/13/16, issue: "Altijd 2e settler" #236): op
  // uitdrukkelijk verzoek een bewuste versoepeling van de "maximaal één
  // settler"-rem hierboven, pas beschikbaar vanaf streek 7
  // (`kanTweedeSettlerBouwen` in groeiEnRekrutering.ts) — zodat jagen/
  // wachttoren-herbouw op eerdere streken niet steeds heen-en-weer-lopen met
  // dezelfde settler vereist. Verschijnt nooit gratis (geen val-terug-regel
  // zoals `settler` hierboven bij beurt 2) — alleen via
  // `City.tweedeSettlerInAanbouw`, en dat permanent herhaalbaar zodra hij
  // leeg/verloren is. Eigen actie-per-beurt-vlag, los van
  // `settlerActieGedaanDitBeurt`, zodat beide settlers onafhankelijk van
  // elkaar kunnen handelen.
  tweedeSettler?: Settler;
  tweedeSettlerActieGedaanDitBeurt: boolean;
  // `settlerGratisBewogenDitBeurt` hierboven, maar dan voor de tweede
  // settler — zelfde onafhankelijke-vlag-patroon als
  // `tweedeSettlerActieGedaanDitBeurt`.
  tweedeSettlerGratisBewogenDitBeurt: boolean;
  // Eerstvolgende beurt waarop weer een nieuw bouwproject gestart mag worden
  // (hoofdstuk 16: bouw-ritme, "om de 3 beurten"). Begint op 1 zodat de
  // allereerste bouw-pop-up gewoon blijft verschijnen.
  volgendeBouwBeurt: number;
  // Lopende indringers-melding (hoofdstuk 6), gezet door `verwerkIndringers`
  // in economie.ts zodra een beurt een binnendringende tribe oplevert.
  // `undefined` zolang er geen (onopgeloste) melding is — de UI blokkeert
  // dan geen andere pop-ups.
  indringersEvent?: IndringersEvent;
  // Gezet zodra de speler op de allerlaatste streek van de wereld sticht
  // (hoofdstuk 1/2/9/10/16, issue: "stad stichten op de frontier" —
  // vervangt "bereik streek 12" als tutorial-einddoel; hoofdstuk 9 Deel 2/
  // M18: "de allerlaatste, verplichte stichting blijft bij de oceaan aan
  // het einde van de campagne"). Een tussentijdse stichting uit het
  // herhalende stichtingspatroon (elders dan de laatste streek, `stichtStad`
  // in acties.ts) zet dit vlag dus expliciet niet — de run loopt gewoon
  // door. De settler is dan al verdwenen (`settler` teruggezet naar
  // `undefined` door `stichtStad`) en dit vlag triggert de afsluitende
  // scène/samenvatting (zie GameRoot), net als `laatsteIneenstorting`
  // hierboven het game-over-scherm triggert — maar dan de winnende
  // afsluiting in plaats van de verliezende.
  stadGesticht?: boolean;
  // Kudde- & roofdier-meldingen (hoofdstuk 14/17): zie `KuddeEvent`/
  // `RoofdierEvent` hierboven. `undefined` zolang er geen (onopgeloste)
  // melding is, net als `indringersEvent` hierboven.
  kuddeEvent?: KuddeEvent;
  roofdierEvent?: RoofdierEvent;
  // Gezet door `verwerkEersteKudde` (indringersEnDieren.ts) zodra de
  // gegarandeerde startkudde op streek 1 geplaatst is (issue: "genoeg hout om
  // ook boerderij te bouwen" — verschoven van "direct bij de start" naar "zodra
  // de Steengroeve voltooid is"). Blijft daarna permanent `true`, ook nadat de
  // kudde is leeggejaagd: voorkomt dat dezelfde garantie een tweede keer
  // afgaat, en opent tegelijk streek 1 voor de gewone, willekeurige
  // `verwerkKuddes`-trekking (die streek 1 tot dan toe overslaat).
  eersteKuddeVerschenen?: boolean;
  // Gegarandeerd eerste roofdier (hoofdstuk 14/17, issue: "Eerste streek geen
  // roofdieren"): gezet door `jaag` (acties.ts) zodra de eerste jachtbeurt op
  // of boven `ROOFDIER_MIN_STREEK` (world.ts) heeft plaatsgevonden — die
  // beurt roept altijd een roofdier op, zie `jaag` voor de reden. Blijft
  // daarna permanent `true` en laat vanaf dan de gewone, kans-gebaseerde
  // roofdier-trekking gelden — zelfde eenmalige-garantie-patroon als
  // `eersteKuddeVerschenen` hierboven.
  eersteRoofdierVerschenen?: boolean;
  // Goudader-ontdekking (hoofdstuk 3/14, issue: "toevoeging Goud"): gezet
  // door `verwerkStreekOntgrendeling` in economie.ts zodra streek
  // `GOUD_ONTDEKKING_STREEK` (world.ts) voor het eerst ontgrendeld wordt — de
  // gegarandeerde eerste Goudader-locatie ligt op die streek. Puur een
  // meldings-vlag (geen keuze), zelfde patroon als `kuddeEvent` hierboven; de
  // speler klikt 'm gewoon weg via `sluitGoudOntdektMelding`.
  goudOntdektEvent?: boolean;
  // Tweede Goudader-ontdekking (hoofdstuk 3/11/14, issue: "Goudader
  // sowieso op streek 12"): zelfde meldings-vlag-patroon als
  // `goudOntdektEvent` hierboven, maar gezet zodra streek
  // `GOUD_ONTDEKKING_STREEK_2` (world.ts) voor het eerst ontgrendeld wordt —
  // de gegarandeerde tweede Goudader-locatie, softlock-preventie vlak vóór
  // de Bezette Streek. Los gehouden van `goudOntdektEvent` zodat beide
  // meldingen onafhankelijk van elkaar getriggerd en weggeklikt worden.
  tweedeGoudOntdektEvent?: boolean;
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
  // meldings-vlag-patroon als `goudOntdektEvent` hierboven: `undefined`/
  // `false` zolang er geen (onopgeloste) melding is.
  bezetteStreekOntdektEvent?: boolean;
  vijandelijkHeiligdomOnthuldEvent?: boolean;
  // Hernoemd van "vernietigd" naar "veroverd" (issue: "Bezette streek
  // scherm"): een vol gelopen wololo-meter verovert het Heiligdom voortaan
  // (het wordt eigen bezit en produceert cultuur), in plaats van het te
  // vernietigen.
  vijandelijkHeiligdomVeroverdEvent?: boolean;
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
  // (zie save.ts: `standaardUitlegAan`) waarmee elke nieuwe tutorial-run
  // start. Going West negeert die globale instelling en start altijd met
  // deze vlag op `false` (issue: "Uitleg pop-ups standaard uit ... bij
  // andere campaigns staan ze standaard uit", zie initieleSpelStatus.ts) —
  // de speler kan hem via het hoofdmenu alsnog voor die ene run aanzetten.
  // Laat streek-flavor, indringers-meldingen en de tutorial-voltooid-
  // samenvatting ongemoeid — dat is kerninhoud, geen uitleg.
  uitlegPopupsAan: boolean;
  // Cumulatieve indringers-statistieken van deze run (issue: "Settings
  // uitbreiden" — uitgebreid historiescherm), zie `IndringersStatistieken`
  // hierboven. Bijgehouden door `verwerkIndringers`/`geefTribuut`
  // (indringersEnDieren.ts), getoond door `berekenHistorieStatistieken`
  // (uitputtingEnVerval.ts) via HistoriePaneel.
  indringersStatistieken: IndringersStatistieken;
  // Wampum-afkoop (issue "Wampum — invallen tijdelijk afkopen"), zie
  // `WampumAfkoopStatus` hierboven — gesleuteld op stam-naam
  // (`IndringersEvent.stamNaam`). Ontbreekt een stam nog in deze map, dan
  // betekent dat "nog nooit afgekocht, geen rust actief" (zie
  // `wampumAfkoopStatusVoorStam` in indringersEnDieren.ts) — geen aparte
  // "leeg"-state nodig. Alleen daadwerkelijk bruikbaar ná het Wampanoag-
  // verbond (`heeftWampanoagVerbond`, wampanoag.ts), zie
  // `kanIndringersAfkopenMetWampum` in indringersEnDieren.ts. Oudere saves
  // kennen dit veld nog niet, zie `metGemigreerdeWampumAfkoopVeld` in save.ts.
  wampumAfkoopPerStam: Record<string, WampumAfkoopStatus>;
  // Bij welke campagne deze run hoort (hoofdstuk 9/13/15, M20d deelstap 1) —
  // `CampaignConfig.id` (campagnes.ts), of `undefined` voor de tutorial (die
  // nog geen eigen `CampaignConfig`-instantie heeft). Bepaalt gedurende de
  // hele run welke weergavenamen `improvementNaam()`/`techNaam()`
  // (improvements.ts/techTree.ts) gebruiken — niet alleen bij het opzetten
  // van de eerste stad, zie `campagneConfig()` in campagnes.ts. Oudere saves
  // kennen dit veld nog niet; `undefined` daar betekent, net als bij een
  // nieuwe tutorial-run, gewoon "tutorial".
  campagneId?: string;
  // Boon-systeem (issue #411/#414, campaigns/going-west/ontwerp.md): run-brede,
  // permanente beloningen voor het uitbouwen van een stad tot "groot" vóór het
  // vertrek (zie `komtInAanmerkingVoorBoon`/`trekBoon`, boons.ts). Trekking
  // zonder terugleggen (issue #414, vraag 1): een Boon-id die hier al in
  // staat, valt uit de pool voor een volgende trekking. Staat expliciet op
  // `GameState`, niet op `City` (zoals `Relic` hierboven, een per-stad concept
  // dat nooit is uitgebouwd) — overleeft daardoor een latere stad-
  // ineenstorting, zolang de run zelf doorgaat (issue #414, vraag 2). Generiek
  // voor elke campagne behalve de tutorial (issue #414, vraag 3). Oudere
  // saves kennen dit veld nog niet, zie `metGemigreerdeBoonsVeld` in save.ts.
  boons: string[];
  // Toegekende, nog niet weggeklikte Boon (issue #414, vraag 4: pop-up direct
  // ná `StichtingsMomentPopup`) — zelfde meldings-vlag-patroon als
  // `goudOntdektEvent` hierboven. `undefined` zolang er geen (onopgeloste)
  // melding is.
  boonToegekendEvent?: string;
  // Welke van de eenmalige uitleg-pop-ups (openings-uitleg, settler, voedsel-
  // balans, boerderij-klaar, enz. — zie GameRoot.tsx) de speler in déze run al
  // heeft weggeklikt (issue: "Bij laden niet alle pop-ups tonen"). Stond
  // voorheen uitsluitend als React-`useState` in GameRoot, dus verdween bij
  // elke (her)mount — een save laden toonde daardoor alle uitleg-pop-ups
  // opnieuw, ook de allang geziene. Door dit in `GameState` zelf bij te
  // houden overleeft de "al gezien"-status het opslaan/laden, net als
  // `uitlegPopupsAan` hierboven. Oudere saves kennen dit veld nog niet, zie
  // `metGemigreerdeSpelStatus` in save.ts.
  gezieneEenmaligeUitleg: EenmaligeUitlegKey[];
  // Hoogste streek waarvoor de speler de streek-pop-up (StreekPopup) al heeft
  // weggeklikt — zelfde reden als `gezieneEenmaligeUitleg` hierboven: stond
  // voorheen als losse `useState(1)` in GameRoot, dus verdween bij het laden
  // van een save, waardoor de streek-pop-up van elke allang bezochte streek
  // opnieuw verscheen. Begint op 1 (de startstreek, al geïntroduceerd via
  // IntroScherm), net als de oorspronkelijke `useState`-default.
  laatstBevestigdeStreek: number;
  // Aantal steden waarvoor de speler de Stichtingsmoment-pop-up
  // (StichtingsMomentPopup, Going West) al heeft weggeklikt — zelfde reden en
  // patroon als `laatstBevestigdeStreek` hierboven. Begint op 1 (elke run
  // begint al met 1 stad, zie `maakInitieleSpelStatus`).
  laatsteBevestigdeStedenAantal: number;
  // Wampanoag-openingsfase, streek 1-4 van Going West (M21a,
  // opdracht-wampanoag-opening.md §1/§6): drie handelswaren, elk een eigen,
  // cap-loze voorraad naast `voorraad` hierboven — zelfde soort aparte
  // telling als `voedsel`/`cultuur`/`wetenschap`, geen onderlinge of
  // gedeelde-opslag-cap-koppeling. Blijven op 0 staan (en blijven ongebruikt)
  // buiten de Going West-campagne; nog door geen enkele productie- of
  // handelsstap gevuld — dat volgt in een latere M21-stap. Oudere saves
  // kennen deze velden nog niet, zie `metGemigreerdeWampanoagVelden` in
  // save.ts.
  bevervellen: number;
  mais: number;
  wampum: number;
  // Afgeleide grondstof (opdracht-wampanoag-opening.md §3): output van de
  // nog te bouwen Smederij (2 erts → 1 gereedschap/beurt). Eigen kleine
  // voorraad, geen koppeling aan `opslagCap` (lage volumes, zelfde reden als
  // hierboven).
  gereedschap: number;
  // Bepaalt of de gecapte stadsverbeteringen-pool (StadsverbeteringenPaneel)
  // getoond wordt (opdracht-wampanoag-opening.md §3/§7, herzien door issue
  // "Weer gewoon cultuur voor ontgrendeling" en, ná die herziening, door issue
  // "Wampanoag streek pas helemaal onthuld na handel": streek-ontgrendeling en
  // de Cultureel-categorie zelf hangen hier niet van af, zie
  // `verwerkStreekOntgrendeling`/`categorieZichtbaar` — en sinds de tweede
  // issue ook niet meer de 3-3-3-Wampanoag-handelsdrempel, maar het gereed
  // zijn van de Smederij, zie `metCultureelOntgrendeldDoorSmederij`
  // (groeiEnRekrutering.ts)). Tutorial start op `true` (ongewijzigd,
  // bestaande tutorial kent geen fase-gating); Going West start op `false`
  // tot de Smederij gebouwd is.
  cultureelOntgrendeld: boolean;
  // Wampanoag-laag ontdekt (Going West, M21e/M21g, opdracht-wampanoag-opening.md
  // §5/§8): gezet door `verwerkStreekOntgrendeling` (streekOntgrendeling.ts)
  // zodra de Wampanoag-streek (`WAMPANOAG_STREEK_HOOGTE`, worldGoingWest.ts)
  // voor Going West "in beeld" komt — zelfde eenmalige
  // meldings-vlag-patroon als `bezetteStreekOntdektEvent` hierboven. Drijft
  // sinds M21g de narratieve `eersteContactPopup`-tekst (`GameRoot.tsx`, via
  // `CampaignConfig.popupTeksten`/`popupContent` in campagnes.ts).
  wampanoagLaagOntdektEvent?: boolean;
  // Wampanoag-3-3-3-drempel gehaald (Going West, M21g,
  // opdracht-wampanoag-opening.md §7): gezet door
  // `verwerkWampanoagFaseAfsluiting` (wampanoag.ts) zodra de streek zelf
  // weer normaal ontgrendelt (herzien door issue "Wampanoag streek pas
  // helemaal onthuld na handel": niet langer gekoppeld aan de
  // `cultureelOntgrendeld`-omslag, zie hierboven) — zelfde eenmalige
  // meldings-vlag-patroon als `wampanoagLaagOntdektEvent` hierboven, drijft
  // de narratieve `wampanoagRelatieGelegdPopup`-tekst.
  wampanoagRelatieGelegdEvent?: boolean;
  // Smederij gebouwd (Going West, issue "Wampanoag streek pas helemaal
  // onthuld na handel"): gezet door `metCultureelOntgrendeldDoorSmederij`
  // (groeiEnRekrutering.ts) op hetzelfde moment als de `cultureelOntgrendeld`-
  // omslag — zelfde eenmalige meldings-vlag-patroon als de twee velden
  // hierboven, drijft de narratieve `smederijGebouwdPopup`-tekst ("je kunt nu
  // weer alle stadsverbeteringen bouwen").
  smederijGebouwdEvent?: boolean;
  // Eenmalige "ontvangen"-vlaggen voor Gereedschap en de drie
  // Wampanoag-handelswaren (issue: "Alle voorraden tonen in resource block"):
  // bepalen of `ResourceHud` het bijbehorende icoontje toont. Gezet op `true`
  // zodra de speler voor het eerst meer dan 0 van de grondstof heeft (Smederij-
  // productie voor `gereedschap`, `verwerkWampanoagHandel` voor de andere
  // drie), en blijven daarna permanent `true` — zelfde eenmalige-
  // garantie-patroon als `eersteKuddeVerschenen` hierboven. Zonder deze
  // vlaggen zou de HUD een grondstof weer verbergen zodra de voorraad terug
  // op 0 zakt (`gereedschap` is verhandelbaar, kan dus weer leeglopen), wat de
  // opdracht expliciet niet wil ("als het daarna op 0 komt, blijft de
  // resource er wel bij staan"). Oudere saves kennen deze velden nog niet, zie
  // `metGemigreerdeOntvangenVlaggen` in save.ts.
  gereedschapOntvangen: boolean;
  bevervellenOntvangen: boolean;
  maisOntvangen: boolean;
  wampumOntvangen: boolean;
}

// Sleutels van de eenmalige uitleg-pop-ups (issue: "Bij laden niet alle
// pop-ups tonen") — één per `Bevestigd`-vlag die voorheen in GameRoot.tsx als
// losse `useState(false)` leefde. Bewust geen sleutel voor
// `voedselWaarschuwingBevestigd` (mag wél opnieuw verschijnen, zie GameRoot.tsx)
// of `tutorialVoltooidBevestigd` (GameRoot unmount't meteen na bevestigen,
// hoeft dus nooit een save te overleven).
export type EenmaligeUitlegKey =
  | "opening"
  | "campagneOpening"
  | "settler"
  | "vijandAanDeHorizon"
  | "goddelijkeRaadgeving"
  | "roofdierIntro"
  | "boerderijKlaar"
  | "strijdersOpleiden"
  | "oceaan"
  | "stadUpgrade"
  | "wachttorenOveral"
  | "voedselBalans"
  | "settlerActies"
  | "beurtensysteem"
  | "stadsverbeteringen"
  | "tweedeSettler"
  | "heiligdom"
  | "nietBouwen"
  | "boerderijStreek"
  | "houtkapStreek"
  | "settlerWegSnelheid"
  | "onrust";
