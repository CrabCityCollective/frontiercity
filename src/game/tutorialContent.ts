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
      "Water aan de ene kant, gras aan de andere. Hier zet het Hertenpad-volk de eerste palen in de grond.",
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
  "Twaalf lagen boven de rivier staat het kamp waar het begon nog overeind. De vuren branden. Verder is er, voor nu, niets te zeggen.";

export function laagContent(hoogte: number): LaagContent | undefined {
  return TUTORIAL_LAAG_CONTENT[hoogte];
}

// Introscherm (issue: "intro en game over scherm"), getoond vóór laag 1 —
// zet de tutorial-sfeer neer voordat er iets van de mechaniek in beeld komt.
export const INTRO_TITEL = "De Eerste Vuren";
export const INTRO_SUBTITEL = "Het Hertenpad-volk";
export const INTRO_FLAVOR_TEKST =
  "De rivier buigt. Het gras wordt water, dan weer gras.\n" +
  "Hier zet het Hertenpad-volk de eerste palen in de grond.\n" +
  "Boven hen wachten twaalf lagen, nog in mist.";

// Ineenstortingsscherm, getoond zodra de stad instort (M6, hoofdstuk 4: hard
// verval). In de MVP (één stad, geen frontier-verplaatsing, hoofdstuk 13)
// eindigt dit de hele run en herstart de tutorial (issue: "run eindigen
// wanneer stad uitgeput is", zie economie.ts `verwerkVerval`).
export const INEENSTORTING_TITEL = "Het vuur dooft";
export const INEENSTORTING_FLAVOR_TEKST =
  "Niemand voedt het meer. Het valt terug tot as.\n" +
  "Wat gebouwd was, wordt weer land.\n" +
  "De rivier buigt nog steeds hetzelfde. Een nieuw vuur wacht op dezelfde oever.";
