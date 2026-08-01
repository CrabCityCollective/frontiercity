// Tutorial-content (M8, hoofdstuk 10 & 13): de vastgelegde mechaniek-volgorde
// en flavor-teksten voor lagen 1-12 van "De Eerste Vuren" (Het Hertenpad-volk).
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
    mechaniek: "Vooruitkijk-bereik",
    flavorTekst: "Aan de voet van het hooggebergte is één laag vooruit te zien. Niet meer, niet minder.",
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
};

// Afsluitende scène na laag 12 (hoofdstuk 10: "Na laag 12: afsluitende
// scène..."). Het openen van het campagnemenu valt buiten de MVP (alleen
// tutorial-content is speelbaar, hoofdstuk 13) — deze tekst sluit de
// tutorial-run zelf af, zonder naar een systeem te verwijzen dat nog niet bestaat.
export const AFSLUITENDE_SCENE =
  "Twaalf lagen boven de rivier staat Holenrots nog overeind. De vuren branden. Verder is er, voor nu, niets te zeggen.";

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

// Settler-uitleg-pop-up (M10, hoofdstuk 16: settler-mechaniek + bouw-ritme),
// getoond zodra de settler in beurt 2 verschijnt. Zelfde eenmalige-confirm-
// patroon als MILITAIR_UITLEG_* hierboven.
export const SETTLER_UITLEG_TITEL = "De settler";
export const SETTLER_UITLEG_TEKST =
  "We gaan vooruit de wildenis in. De settlers kunnen bewegen over de kaart, en wegen bouwen. We moeten een weg naar de houtkap bouwen, anders kan het hout de voorraad niet bereiken.";

// Tutorial-voltooid-pop-up (issue: "pop-up met een summary van wat je
// geleerd hebt"), getoond zodra de confrontatie op laag 12 gewonnen is. De
// samenvatting zelf doorloopt `TUTORIAL_LAAG_CONTENT` hierboven in plaats van
// een tweede laag→mechaniek-lijst bij te houden die uit de pas kan lopen.
export const TUTORIAL_VOLTOOID_TITEL = "De Eerste Vuren — voltooid";
export const TUTORIAL_VOLTOOID_INTRO =
  "Het Hertenpad-volk staat op de bergkam. Onderweg hierheen is geleerd:";

// Introscherm (issue: "intro en game over scherm"), getoond vóór laag 1 —
// zet de tutorial-sfeer neer voordat er iets van de mechaniek in beeld komt.
export const INTRO_TITEL = "De Eerste Vuren";
export const INTRO_SUBTITEL = "Het Hertenpad-volk";
export const INTRO_FLAVOR_TEKST =
  "De rivier buigt. Het gras wordt water, dan weer gras.\n" +
  "Hier zet het Hertenpad-volk de eerste palen in de grond.\n" +
  "Boven hen wachten twaalf lagen, nog in mist.";

// Voedselwaarschuwing-pop-up (issue: "uitleg pop-ups dynamisch tonen" —
// vervangt de vroegere vaste beurt-3-pop-up): getoond zodra de stad voor het
// eerst "kritiek" wordt (zie economie.ts `verwerkVerval`) — dynamisch op het
// moment dat de voedseldreiging zich voordoet, in plaats van op een vast
// beurtnummer.
export const VOEDSEL_WAARSCHUWING_TITEL = "De voorraad slinkt";
export const VOEDSEL_WAARSCHUWING_TEKST =
  "De bodem van de voedselvoorraad komt behoorlijk dichtbij. Als het voedsel op, verlaat de stam het kamp, en gaat iedereen op zijn houtje de wildernis in. Bouw een boerderij om de voedselvoorraad weer aan te vullen. Vergeet niet de boerderij met een weg te verbinden.";

// Boerderij-klaar-uitleg-pop-up (issue: "uitleg pop-ups dynamisch tonen"):
// getoond zodra er voor het eerst een actieve, wegverbonden boerderij
// meeproduceert (zie economie.ts `heeftWerkendeBoerderij`) — de voedselcrisis
// is dan bezworen, en dit is meteen de introductie van de militaire
// mechaniek (Wachttoren + militair scherm), die vanaf dit punt relevant
// wordt (hoofdstuk 6: indringers-dreiging vanaf laag 2).
export const BOERDERIJ_KLAAR_TITEL = "Voedsel bereikt het kamp";
export const BOERDERIJ_KLAAR_TEKST =
  "Voedsel bereikt het kamp, de ergste hongersnood is geweken. De tocht gaat verder. Maar we komen steeds meer vijandelijke stammen tegen. We hebben nu steen en erts nodig uit de heuvels en bergen om een wachttoren te kunnen bouwen, en onze strijders te bewapenen. Bouw een wachttoren, en open het militaire scherm via het menu om strijders op te leiden.";

// Strijder-bemannen-pop-up (nieuwe Wachttoren-functie, hoofdstuk 6: "een
// wachttoren heeft een strijder nodig om te kunnen functioneren"), getoond
// zodra de speler in het militaire paneel op een nog niet toegewezen strijder
// klikt (zie MilitairPaneel/GameRoot).
export const STRIJDER_BEMAN_TITEL = "Welke wachttoren wil je bemannen?";
export const STRIJDER_BEMAN_TEKST =
  "Deze strijder kan één Wachttoren bemannen. Kies een Wachttoren, en klik daarna op de kaart op een actieve Wachttoren om hem daar te plaatsen. Je kunt een bemande strijder later terughalen om elders te bemannen, maar hij is dan een paar beurten onderweg voordat hij weer inzetbaar is.";

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
