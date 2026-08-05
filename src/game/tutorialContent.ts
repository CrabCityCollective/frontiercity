// Tutorial-content (M8, hoofdstuk 10 & 13): de vastgelegde mechaniek-volgorde
// en flavor-teksten voor lagen 1-13 van "De Eerste Vuren" (Het Hertenpad-volk).
// De mechanieken zelf zijn al gebouwd in M1-M7 — dit bestand voegt alleen de
// vaste, geschreven inhoud toe die per laag hoort (geen nieuwe systemen).
//
// Flavor-tekststijlgids (hoofdstuk 9): korte, vaak enkelvoudige zinnen, geen
// emotie-bijvoeglijke naamwoorden, geen moreel oordeel, concreet/zintuiglijk
// boven abstract, herhaling als stijlmiddel toegestaan, stiltes toegestaan.
//
// Laag 9 ("Zeldzaamheid") en de framing van laag 10/11 als "gescript,
// ongevaarlijk" horen bij post-MVP-uitbreidingen (hoofdstuk 13: geen
// zeldzaamheid, geen aparte tutorial-veilige verval-variant in de MVP) — de
// flavor-tekst hieronder zet de sfeer alvast neer zonder een apart systeem te
// bouwen dat later weer weggegooid moet worden.

export interface LaagContent {
  naam: string;
  mechaniek: string;
  flavorTekst: string;
}

export const TUTORIAL_LAAG_CONTENT: Record<number, LaagContent> = {
  1: {
    naam: "De Oevervlakte",
    mechaniek: "Land improvement bouwen",
    flavorTekst:
      "Water aan de ene kant, gras aan de andere. Hier zet het Hertenpad-volk de eerste palen in de grond. Ze noemen de plek Holenrots.",
  },
  2: {
    naam: "Het Rietmoeras",
    mechaniek: "Categorie-keuze (2-3 opties)",
    flavorTekst: "Het riet buigt naar drie kanten tegelijk. Kies er één.",
  },
  3: {
    naam: "De Bosrand",
    mechaniek: "Drie bouwmaterialen — hout en steen",
    flavorTekst: "Aan de bosrand liggen hout en steen binnen bereik van elkaar.",
  },
  4: {
    naam: "Het Loofbos",
    mechaniek: "Drie bouwmaterialen — erts erbij",
    flavorTekst: "Dieper het loofbos in ligt erts, onder wortels die niemand eerder omhoogtrok.",
  },
  5: {
    naam: "De Heuvelvoet",
    mechaniek: "Uitputting",
    flavorTekst: "De eerste groeve wordt stil. Dan leeg. Dan een naam die niemand meer gebruikt.",
  },
  6: {
    naam: "De Heuvels",
    mechaniek: "Cultuur → laag ontgrendelen",
    flavorTekst: "Op de heuvels staat een steen rechtop. Niemand weet meer wie.",
  },
  7: {
    naam: "De Rotsrichel",
    mechaniek: "Cultuur → laag ontgrendelen",
    flavorTekst: "Vanaf de rotsrichel is de volgende laag te zien, voor het eerst zonder mist.",
  },
  8: {
    naam: "De Hooggebergte-voet",
    mechaniek: "Wetenschap → technologie kiezen",
    flavorTekst:
      "Aan de voet van het hooggebergte staat een stenen cirkel. Wie er lang genoeg naar de hemel kijkt, moet kiezen welk pad hij verder volgt.",
  },
  9: {
    naam: "Het Naaldwoud",
    mechaniek: "Zeldzaamheid (verborgen tot bouwen)",
    flavorTekst: "In het naaldwoud fluistert men over hout dat zeldzamer is dan de rest. Nog niemand heeft het gevonden.",
  },
  10: {
    naam: "De Kale Hoogvlakte",
    mechaniek: "Groei-gok",
    flavorTekst:
      "Op de kale hoogvlakte overweegt het kamp te groeien. Groter betekent meer monden, en minder plek om ze allemaal te voeden.",
  },
  11: {
    naam: "De Besneeuwde Flank",
    mechaniek: "Waarschuwingssignaal bij verval",
    flavorTekst: "Op de besneeuwde flank ligt het land dunner dan het kamp nodig heeft. Een teken, geen vonnis.",
  },
  12: {
    naam: "De Bergkam",
    mechaniek: "Militair/verdediging",
    flavorTekst: "Op de bergkam staat voor het eerst iemand die niet van het Hertenpad-volk is.",
  },
  // Laatste laag van de tutorial (issue: "tutorial laatste stad aan
  // oceaan") — de oceaan aan de overkant, precies de win-conditie uit
  // hoofdstuk 1 van het design-document, hier alvast voelbaar gemaakt aan
  // het eind van de tutorial-tocht. De enige laag met vers water (zie
  // world.ts `TUTORIAL_VERS_WATER`), en dus de enige plek waar de laatste
  // stad gesticht kan worden.
  13: {
    naam: "De Oceaanoever",
    mechaniek: "Stad stichten aan het vers water",
    flavorTekst:
      "Het land houdt hier op. Aan de voet van de oever ligt weer vers water, voor het eerst sinds de rivier bij Holenrots.",
  },
};

// Afsluitende scène na de laatste laag (hoofdstuk 10: "Na de laatste laag:
// afsluitende scène..."). Het openen van het campagnemenu valt buiten de MVP
// (alleen tutorial-content is speelbaar, hoofdstuk 13) — deze tekst sluit de
// tutorial-run zelf af, zonder naar een systeem te verwijzen dat nog niet bestaat.
export const AFSLUITENDE_SCENE =
  "Bij de oceaan staat Holenrots nog overeind, vele lagen daaronder. De vuren branden. Verder is er, voor nu, niets te zeggen.";

// Stichtings-waarschuwing (hoofdstuk 2/10/16, issue: "stad stichten op de
// frontier" deel 4): getoond vóór de speler bevestigt — de settler verdwijnt
// definitief bij het stichten ("de huifkar wordt de stad"), dus dit moet
// duidelijk zijn vóór de onomkeerbare klik, niet erna.
export const STICHT_STAD_TITEL = "Hier een nieuwe stad stichten?";
export const STICHT_STAD_WAARSCHUWING =
  "De huifkar komt tot stilstand. De wielen zakken weg in de oever. Dit wordt de plek.\n\n" +
  "Let op: de settler verdwijnt hierbij. Er is geen weg terug — als je hier sticht, is er geen settler meer om verder te trekken, tenzij je er later een nieuwe uitrust.";

// Afsluitende scène na het stichten (hoofdstuk 2/10/16): vervangt de
// laag-12-afsluiting hierboven als het echte tutorial-einddoel — "je eerste
// stad stichten op de frontier" (issue-titel) is precies waar het spel zijn
// naam aan ontleent.
export const STICHTING_AFSLUITENDE_SCENE =
  "De huifkar wordt de stad. Vuurbron, noemen ze het, voor het vuur dat er die avond voor het eerst brandt.\n" +
  "Holenrots ligt nu ver onder hen, stil, achtergelaten maar niet vergeten.\n" +
  "Het Hertenpad-volk is niet langer op doortocht. Het is aangekomen — voor nu.";

export function laagContent(hoogte: number): LaagContent | undefined {
  return TUTORIAL_LAAG_CONTENT[hoogte];
}

// Militaire-uitleg-pop-up (issue: "pop-up met uitleg hoe je de militaire
// confrontatie moet aanpakken"), getoond zodra laag 12 bereikt is, direct na
// de gewone laag-pop-up hierboven. Militair is de enige tutorial-mechaniek
// met een voorbereidingsstap (rekruteren) vóór de speler kan handelen, vandaar
// een gerichte extra uitleg naast de algemene laag-flavor.
export const MILITAIR_UITLEG_TITEL = "Hoe pak je dit aan?";
export const MILITAIR_UITLEG_TEKST =
  "Open het militaire paneel via het menu-icoon. Rekruteer een Soldaat zolang de legerwaarde onder de dreiging op de bergkam ligt — dat kost grondstoffen en een paar beurten. Ga de confrontatie pas aan zodra de winkans je bevalt. Verlies is geen einde: één vakje raakt beschadigd, maar het Hertenpad-volk mag het opnieuw proberen.";

// Oceaan-uitleg-pop-up (issue: "tutorial laatste stad aan oceaan"), getoond
// zodra de laatste laag (de oceaan aan de overkant) bereikt is, direct na de
// gewone laag-pop-up hierboven — zelfde eenmalige-uitleg-patroon als
// MILITAIR_UITLEG_* hierboven. Dit is de enige laag met vers water in de hele
// tutorial, en dus de enige plek waar de laatste stad gesticht kan worden;
// deze tekst maakt dat expliciet, samen met het feit dat stichten hier de run
// beëindigt (zie ook STICHT_STAD_WAARSCHUWING hieronder voor de
// bevestigingsstap zelf).
export const OCEAAN_UITLEG_TITEL = "De oceaan aan de overkant";
export const OCEAAN_UITLEG_TEKST =
  "Hier houdt het land op. Voor het eerst sinds Holenrots ligt er weer vers water binnen bereik — de enige plek in de hele tocht. Breng de settler naar het vakje aan het water en kies daar 'Stad stichten' in het settler-paneel. Zodra die stad er staat, eindigt deze tocht.";

// Settler-uitleg-pop-up (M10, hoofdstuk 16: settler-mechaniek + bouw-ritme),
// getoond zodra de settler in beurt 2 verschijnt. Zelfde eenmalige-confirm-
// patroon als MILITAIR_UITLEG_* hierboven.
export const SETTLER_UITLEG_TITEL = "De settler";
export const SETTLER_UITLEG_TEKST =
  "We gaan vooruit de wildenis in. De settlers kunnen bewegen over de kaart, en wegen bouwen. We moeten een weg naar de houtkap bouwen, anders kan het hout de voorraad niet bereiken.";

// Tutorial-voltooid-pop-up (issue: "pop-up met een summary van wat je
// geleerd hebt"), getoond zodra een nieuwe stad gesticht is (hoofdstuk
// 9/10/16, issue: "stad stichten op de frontier" — vervangt "confrontatie op
// laag 12 gewonnen" als trigger). De samenvatting zelf doorloopt
// `TUTORIAL_LAAG_CONTENT` hierboven in plaats van een tweede
// laag→mechaniek-lijst bij te houden die uit de pas kan lopen.
export const TUTORIAL_VOLTOOID_TITEL = "De Eerste Vuren — voltooid";
export const TUTORIAL_VOLTOOID_INTRO =
  "Het Hertenpad-volk heeft een nieuwe stad gesticht. Onderweg hierheen is geleerd:";

// Introscherm (issue: "intro en game over scherm", tekst bijgewerkt in issue
// "tutorial popups wijzigen"), getoond vóór laag 1 — zet de tutorial-sfeer
// neer voordat er iets van de mechaniek in beeld komt.
export const INTRO_TITEL = "De Eerste Vuren";
export const INTRO_SUBTITEL = "Het Hertenpad-volk";
export const INTRO_FLAVOR_TEKST =
  "Onze voorouders hebben aons lang op deze kust gewoond, maar de tijd is aangebroken om het binnenland in te trekken, op zoek naar nieuw land. Ruimte en Glorie voor onze stam! Het zal niet makkelijk worden, maar dankzij de goddelijke begeleiding zullen we de moeilijkheden kunnen doorstaan. (let op, deze tutorial is niet makkelijk)";

// Voedselwaarschuwing-pop-up (issue: "uitleg pop-ups dynamisch tonen" —
// vervangt de vroegere vaste beurt-3-pop-up): getoond zodra de stad voor het
// eerst "kritiek" wordt (zie economie.ts `verwerkVerval`) — dynamisch op het
// moment dat de voedseldreiging zich voordoet, in plaats van op een vast
// beurtnummer.
export const VOEDSEL_WAARSCHUWING_TITEL = "De voorraad slinkt";
export const VOEDSEL_WAARSCHUWING_TEKST =
  "De bodem van de voedselvoorraad komt behoorlijk dichtbij. Als het voedsel op, verlaat de stam het kamp, en gaat iedereen op zijn houtje de wildernis in. Bouw een boerderij om de voedselvoorraad weer aan te vullen. Vergeet niet de boerderij met een weg te verbinden.";

// Boerderij-klaar-uitleg-pop-up (issue: "uitleg pop-ups dynamisch tonen",
// tekst bijgewerkt in issue "tutorial popups wijzigen"): getoond zodra er
// voor het eerst een actieve, wegverbonden boerderij meeproduceert (zie
// economie.ts `heeftWerkendeBoerderij`) — de voedselcrisis is dan bezworen,
// en dit introduceert nu het Heiligdom/cultuur (in plaats van de Wachttoren:
// die introductie hoort sinds "tutorial popups wijzigen" bij het ontgrendelen
// van laag 2 zelf, zie VIJAND_AAN_DE_HORIZON_TITEL/-TEKST hieronder).
export const BOERDERIJ_KLAAR_TITEL = "Voedsel bereikt het kamp";
export const BOERDERIJ_KLAAR_TEKST =
  "Voedsel bereikt het kamp, de ergste hongersnood is geweken. De tijd is nu gekomen om de wilde stammen te verenigen onder de glorie van onze voorouders. Bouw een Heiligdom, opdat ons licht over de wereld gaat stralen. (een Heiligdom heeft voldoende steen nodig om te bouwen)";

// Goddelijke-raadgeving-pop-up (issue: "tutorial popups wijzigen"): getoond
// zodra laag 3 ontgrendelt (zie GameRoot: `toonGoddelijkeRaadgevingPopup`) —
// dit is het moment waarop Wetenschappelijk (en dus de Sterrencirkel, zie
// improvements.ts: `STERRENCIRKEL.minLaag`) voor het eerst beschikbaar komt
// in de bouw-pop-up, ervoor stond de categorie uitgegrijsd.
export const GODDELIJKE_RAADGEVING_TITEL = "Goddelijke raadgeving";
export const GODDELIJKE_RAADGEVING_TEKST =
  "Hoe meer land we tot onze beschikking hebben, hoe meer de goden ons leren over wereld. Bouw een Sterrencirkel om kennis neer te laten dalen op aarde.";

// De-vijand-aan-de-horizon-pop-up (issue: "tutorial popups wijzigen"):
// getoond zodra laag 2 ontgrendelt (zie GameRoot: `toonVijandAanDeHorizonPopup`)
// — dit is het moment waarop Militair (en dus de Wachttoren, zie
// improvements.ts: `MILITAIR_LAND_IMPROVEMENTS[0].minLaag`) voor het eerst
// beschikbaar komt in de bouw-pop-up, ervoor stond de categorie uitgegrijsd.
export const VIJAND_AAN_DE_HORIZON_TITEL = "De vijand aan de horizon";
export const VIJAND_AAN_DE_HORIZON_TEKST =
  "Niet alle wilde stammen zitten op onze opmars te wachten, ze proberen ons gebied binnen te dringen. We hebben nu erts nodig uit de heuvels en bergen. Bouw een mijn. Dat is het eerste wat we nu nodig hebben.";

// Strijders-opleiden-uitleg-pop-up (issue: "pop-ups wijzigen"): getoond zodra
// er voor het eerst een gebouwde mijn staat (zie economie.ts
// `heeftGebouwdeMijn`) — dit is het moment waarop het bouwen van een
// Wachttoren en het opleiden van een strijder allebei relevant worden, ná de
// erts-introductie hierboven maar vóór VIJAND_AAN_DE_HORIZON een wachttoren
// noemde.
export const STRIJDERS_OPLEIDEN_TITEL = "Strijders opleiden";
export const STRIJDERS_OPLEIDEN_TEKST =
  "Bouw nu een wachttoren. Leidt tegelijkertijd een strijder op. Klik op de stad en begin de opleiding van een strijder. Als de strijder klaar is, verschijnt hij in het stadscherm, en vanaf daar kun je hem toewijzen aan een wachttoren die nog niet bemand is.";

// Stad-upgrade-uitleg-pop-up (issue: "city improvement menu toevoegen" —
// "op het moment dat je voor het eerst genoeg resources hebt om de stad
// upgrade uit te voeren, mag er een dynamische pop-up komen die uitlegt dat
// je kunt upgraden, en wat er aan hebt"): getoond zodra er voor het eerst
// genoeg voedsel is voor de groei-tier klein→middel (zie world.ts:
// `VOEDSEL_DREMPEL_GROEI`) — zelfde eenmalige dynamische-trigger-patroon als
// BOERDERIJ_KLAAR_TITEL/-TEKST hierboven. Eerlijk over de keerzijde (hoofdstuk
// 4/11: "een bewuste gok, geen gratis extra beloning") in plaats van alleen
// de voordelen te noemen.
export const STAD_UPGRADE_UITLEG_TITEL = "De stad kan groeien";
export const STAD_UPGRADE_UITLEG_TEKST =
  "Er is genoeg voedsel verzameld om Holenrots te laten groeien naar middel. Open het stadsmenu door op de stad te klikken, en start de groei daar. Het kost hout en steen, en een paar beurten rijptijd. Let op: een grotere stad heeft ook meer mondjes te voeden — zorg dat de voedselproductie meegroeit.";

// Ineenstortingsscherm, getoond zodra de stad instort (M6, hoofdstuk 4: hard
// verval). In de MVP (één stad, geen frontier-verplaatsing, hoofdstuk 13)
// eindigt dit de hele run en herstart de tutorial (issue: "run eindigen
// wanneer stad uitgeput is", zie economie.ts `verwerkVerval`).
export const INEENSTORTING_TITEL = "Het vuur dooft";
export const INEENSTORTING_FLAVOR_TEKST =
  "Niemand voedt het meer. Het valt terug tot as.\n" +
  "Wat gebouwd was, wordt weer land.\n" +
  "De rivier buigt nog steeds hetzelfde. Een nieuw vuur wacht op dezelfde oever.";

// Indringers-tribuut-pop-up (hoofdstuk 6): een willekeurige naam uit deze
// pool wordt gekozen door `verwerkIndringers` in economie.ts zodra een tribe
// een ontgrendelde laag binnendringt (niet meer alleen de frontier-laag).
// Zelfde stijlgids als de rest van dit bestand — kort, concreet, geen moreel
// oordeel.
export const INDRINGERS_STAMMEN = ["de stam van de Halve Maan", "de stam van de Bloedhoeven"];

export const INDRINGERS_TITEL = "Indringers bij de grens";

// Kudde-melding (hoofdstuk 17): getoond zodra `verwerkKuddes` (economie.ts)
// een nieuwe wilde kudde neerzet — zelfde stijlgids als de rest van dit
// bestand, en dezelfde blokkerende meldings-vorm als de indringers-pop-up
// hierboven. De laag zelf wordt, net als bij `INDRINGERS_TITEL`, in de
// pop-up-component zelf achter de flavor-tekst gezet — dit is puur de
// vaste tekst.
export const KUDDE_TITEL = "Een kudde in de verte";
export const KUDDE_FLAVOR_TEKST = "Dieren bewegen tussen de bomen. Genoeg voor een paar dagen jacht.";

// Roofdier-meldingen (hoofdstuk 14/17, issue: "roofdieren toevoegen"): twee
// momenten van dezelfde dreiging — eerst de waarschuwing zodra hij verschijnt
// (`jaag` in economie.ts), dan pas het gevolg een beurt later
// (`verwerkRoofdieren`), als de settler niet op tijd wegkwam.
export const ROOFDIER_VERSCHENEN_TITEL = "Iets anders volgt de kudde";
export const ROOFDIER_VERSCHENEN_TEKST =
  "Een schaduw breekt door het struikgewas. Nog één beurt om de settler weg te bewegen.";
export const ROOFDIER_AANVAL_TITEL = "De settler keert niet terug";
export const ROOFDIER_AANVAL_TEKST =
  "Het spoor eindigt bij de kudde. Er is geen huifkar meer — een nieuwe moet eerst uitgerust worden.";

// Amberader-ontdekkingsmelding (hoofdstuk 3/14, issue: "toevoeging Goud"):
// getoond zodra `verwerkLaagOntgrendeling` (economie.ts) laag
// `AMBER_ONTDEKKING_LAAG` (world.ts) voor het eerst ontgrendelt — zelfde
// blokkerende meldings-vorm en stijlgids als `KUDDE_TITEL`/`KUDDE_FLAVOR_TEKST`
// hierboven.
export const AMBER_ONTDEKKING_TITEL = "Amber gevonden";
export const AMBER_ONTDEKKING_TEKST =
  "Onze verkenners vonden een fantastisch glimmend materiaal: Amber. We gaan een mijn bouwen om al het Amber tot het laatste brokje uit de grond te krijgen.";
