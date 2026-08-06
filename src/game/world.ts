// Bouwt de initiële wereldstaat voor de tutorial ("De Eerste Vuren", lagen 1-13).
// Zie frontier-city-design-doc.md hoofdstuk 2 (ruimtelijk model) en hoofdstuk 10 (tutorial-opzet).

import { BezetteLaagInhoud, Layer, TerreinType, Tile } from "./types";

export const BAND_WIDTH_TILES = 9;
export const STAD_POSITIE = 4; // middelste vakje van de band = stad
export const TUTORIAL_LAAG_AANTAL = 13;

// Laag van de Bezette Laag ("De Bergkam", hoofdstuk 6, issue: "De Bezette
// Laag, missionaris en verkenner" — vervangt de eerdere, kleinere
// "militaire confrontatie op laag 12"-placeholder volledig). Los van
// `TUTORIAL_LAAG_AANTAL` gehouden (issue: "tutorial laatste stad aan
// oceaan") — vóór laag 13 erbij kwam waren dit dezelfde laag. Het generieke
// Bezette-Laag-mechanisme zelf (bevriezing, Verkenning, Belegering,
// Confrontatie) leeft in economie.ts en kent alleen deze ene hoogte als
// tutorial-specifieke scripting — een latere campagne zou hier een eigen
// hoogte (of meerdere) voor kunnen definiëren.
export const BEZETTE_LAAG_HOOGTE = 12;

export function isBezetteLaagHoogte(hoogte: number): boolean {
  return hoogte === BEZETTE_LAAG_HOOGTE;
}

// Vaste (niet-procedurele) terreintypes voor de tutorial-lagen — de tutorial is
// vastgelegde inhoud, geen random worldgen zoals bij latere campagnes (hoofdstuk 8).
const TUTORIAL_TERREINTYPES = [
  "oevervlakte",
  "rietmoeras",
  "bosrand",
  "loofbos",
  "heuvelvoet",
  "heuvels",
  "rotsrichel",
  "hooggebergte-voet",
  "naaldwoud",
  "kale hoogvlakte",
  "besneeuwde flank",
  "bergkam",
  "oceaanoever",
];

function terreinTypeVoorLaag(hoogte: number): string {
  return TUTORIAL_TERREINTYPES[hoogte - 1] ?? "onbekend";
}

// Vast terrein-subtype per vakje binnen elke laag (issue: "grotere
// verscheidenheid van tiles per laag" + terreinEisen op Improvement) — net
// als TUTORIAL_TERREINTYPES hierboven vastgelegde tutorial-inhoud, geen
// random worldgen. Index = `positieInLaag` (0-8); index 4 (het stad-vakje)
// krijgt een placeholder-waarde die nooit voor plaatsingslogica gebruikt
// wordt. Elke laag houdt bewust minstens één vakje van elk van `bos`,
// `heuvel`/`berg` en `vlak` aan, zodat geen enkele laag houtkap, mijn of
// boerderij helemaal onmogelijk maakt — de mix verschuift wel duidelijk met
// de hoogte (bv. geen bos meer op de kale hoogvlakte/bergkam, op één
// eenzame boom na) zodat de terreinkeuze voelbaar blijft.
const TUTORIAL_TILE_TERREIN: Record<number, TerreinType[]> = {
  1: ["vlak", "vlak", "bos", "vlak", "vlak", "vlak", "heuvel", "vlak", "vlak"],
  2: ["vlak", "bos", "vlak", "heuvel", "vlak", "vlak", "vlak", "bos", "vlak"],
  3: ["bos", "vlak", "bos", "heuvel", "vlak", "vlak", "bos", "vlak", "vlak"],
  4: ["bos", "bos", "vlak", "bos", "vlak", "heuvel", "bos", "vlak", "bos"],
  5: ["heuvel", "vlak", "heuvel", "vlak", "vlak", "bos", "heuvel", "vlak", "vlak"],
  6: ["heuvel", "heuvel", "vlak", "heuvel", "vlak", "bos", "heuvel", "vlak", "heuvel"],
  7: ["berg", "heuvel", "berg", "bos", "vlak", "heuvel", "berg", "vlak", "heuvel"],
  8: ["berg", "berg", "heuvel", "bos", "vlak", "berg", "heuvel", "vlak", "berg"],
  9: ["bos", "bos", "heuvel", "bos", "vlak", "vlak", "bos", "heuvel", "bos"],
  10: ["vlak", "heuvel", "vlak", "heuvel", "vlak", "vlak", "bos", "vlak", "vlak"],
  11: ["berg", "heuvel", "berg", "heuvel", "vlak", "vlak", "bos", "vlak", "heuvel"],
  12: ["berg", "berg", "heuvel", "berg", "vlak", "vlak", "bos", "heuvel", "berg"],
  13: ["vlak", "bos", "vlak", "heuvel", "vlak", "vlak", "bos", "heuvel", "vlak"],
};

function terreinVoorTile(hoogte: number, positieInLaag: number): TerreinType {
  return TUTORIAL_TILE_TERREIN[hoogte]?.[positieInLaag] ?? "vlak";
}

// Vakjes die aan vers water liggen — een rivier of een meer (hoofdstuk 2:
// "een stad kan alleen gesticht worden op een vakje dat aan vers water
// ligt"). Vaste tutorial-worldgen (net als TUTORIAL_TILE_TERREIN hierboven).
// Sinds issue "tutorial laatste stad aan oceaan" staat dit vakje uitsluitend
// op de allerlaatste laag (TUTORIAL_LAAG_AANTAL, de oceaan aan de overkant)
// — de enige plek in de hele tutorial met vers water. Dat maakt het stichten
// van de laatste stad een bewuste, unieke bestemming aan het eind van de
// tocht, in plaats van een keuze die de speler al vanaf laag 10 open staat.
// Op een vlak vakje (nooit het centrum/positie 4) zodat het ook een
// boerderij-kandidaat is — plannen waar je een stad sticht versus waar je
// verbouwt, is een bewuste keuze, geen dwangkeuze.
const TUTORIAL_VERS_WATER: Record<number, number[]> = {
  13: [5],
};

function versWaterVoorTile(hoogte: number, positieInLaag: number): boolean {
  return TUTORIAL_VERS_WATER[hoogte]?.includes(positieInLaag) ?? false;
}

// Laag waarop de eerste Amberader-locatie gegarandeerd zichtbaar/beschikbaar
// wordt (issue: "toevoeging Goud" Deel 1) — gedeeld met `verwerkLaagOntgrendeling`
// in economie.ts, die op precies deze laag de ontdekkings-pop-up (hoofdstuk
// 3/14) triggert.
export const AMBER_ONTDEKKING_LAAG = 7;

// Vakjes met een amberader — de vondst-eis van de Amberader/goudmijn-
// improvement (hoofdstuk 3/14), bovenop de gewone heuvel/berg-terreineis van
// een mijn (zie `improvementPastOpTile` in improvements.ts). Bewust schaarser
// dan gewone erts-mijn-locaties: van de 33 heuvel/berg-vakjes in de hele
// tutorial (`TUTORIAL_TILE_TERREIN` hierboven) hebben er hier maar drie een
// amberader, tegenover "elk heuvel/bergvakje" voor een gewone mijn. Vast,
// niet-procedureel (net als `TUTORIAL_VERS_WATER` hierboven) en bewust zo
// gekozen dat laag `AMBER_ONTDEKKING_LAAG` de eerste is met zo'n vakje — de
// speler heeft dus nooit pech en hoeft nooit voorbij die laag te zoeken naar
// de eerste kans op een Amberader.
const TUTORIAL_AMBER: Record<number, number[]> = {
  7: [0],
  8: [5],
  11: [2],
};

function amberVoorTile(hoogte: number, positieInLaag: number): boolean {
  return TUTORIAL_AMBER[hoogte]?.includes(positieInLaag) ?? false;
}

// Vaste inhoud-verdeling van de Bezette Laag (hoofdstuk 6, issue: "De
// Bezette Laag, missionaris en verkenner", Deel 1) — tutorial-scripting op
// `BEZETTE_LAAG_HOOGTE` (laag 12), net zo vastgelegd/niet-procedureel als
// `TUTORIAL_AMBER` hierboven. Verspreid over 8 van de 9 vakjes: twee
// vijandelijke Wachttorens (Confrontatie-doelen), twee vijandelijke
// Heiligdommen (Belegeringsdoelen) en vier cosmetische huisjes (geen doel,
// geen functie). Positie 4 (het middelste vakje — elders het stad-vakje)
// blijft bewust neutraal: een gewoon leeg vakje zodra onthuld, zodat niet
// alle 9 vakjes vijandelijke/cosmetische inhoud hoeven te dragen.
const TUTORIAL_BEZETTE_LAAG_INHOUD: Record<number, BezetteLaagInhoud> = {
  0: "wachttoren",
  1: "heiligdom",
  2: "huisje",
  3: "wachttoren",
  5: "huisje",
  6: "heiligdom",
  7: "huisje",
  8: "huisje",
};

function bezetteLaagInhoudVoorTile(hoogte: number, positieInLaag: number): BezetteLaagInhoud | undefined {
  return hoogte === BEZETTE_LAAG_HOOGTE ? TUTORIAL_BEZETTE_LAAG_INHOUD[positieInLaag] : undefined;
}

// Initialiseert een Bezette Laag zodra ze "in beeld komt" (economie.ts:
// `verwerkLaagOntgrendeling`, dezelfde soort trigger als de gegarandeerde
// Amberader-vondst op laag 7): zet `bezet: true` en verhult elk vakje
// individueel (`Tile.verhuld`), los van de gewone laag-brede fog-of-war —
// de laag zelf blijft `ontgrendeld: false` tot alle vijandelijke
// Heiligdommen vernietigd zijn (zie `verwerkBelegering` in economie.ts).
export function initialiseerBezetteLaag(laag: Layer): Layer {
  return {
    ...laag,
    bezet: true,
    belegeringsVoortgang: 0,
    tiles: laag.tiles.map((tile) => ({
      ...tile,
      verhuld: true,
      bezetteLaagInhoud: bezetteLaagInhoudVoorTile(laag.hoogte, tile.positieInLaag),
    })),
  };
}

// Dreigingsniveau per laag (M7, hoofdstuk 6): de tegenstandersterkte bij een
// militaire confrontatie op die laag, gebruikt door `confrontatie` in
// economie.ts. Vastgelegde tutorial-waarden, oplopend met de hoogte — net
// als cultuurKostenVoorLaag een bewuste MVP-placeholder (hoofdstuk 14: de
// exacte winkans-formule ligt nog niet vast). Laag 1 is de startlaag en dus
// dreigingsvrij.
function dreigingsniveauVoorLaag(hoogte: number): number {
  return Math.max(0, (hoogte - 1) * 2);
}

function maakLegeTiles(hoogte: number): Tile[] {
  return Array.from({ length: BAND_WIDTH_TILES }, (_, positieInLaag) => ({
    positieInLaag,
    terrein: terreinVoorTile(hoogte, positieInLaag),
    status: "leeg" as const,
    versWater: versWaterVoorTile(hoogte, positieInLaag),
    amber: amberVoorTile(hoogte, positieInLaag),
  }));
}

function maakStartLaag(): Layer {
  const tiles = maakLegeTiles(1);
  tiles[STAD_POSITIE] = {
    positieInLaag: STAD_POSITIE,
    terrein: terreinVoorTile(1, STAD_POSITIE),
    status: "actief",
    heeftWeg: true,
    improvement: {
      id: "holenrots",
      naam: "Holenrots",
      categorie: "civiel",
      soort: "city",
      kosten: {},
      bouwtijdBeurten: 0,
      effect: { type: "stad" },
    },
  };

  return {
    hoogte: 1,
    ontgrendeld: true,
    tiles,
    terreinType: terreinTypeVoorLaag(1),
    dreigingsniveau: dreigingsniveauVoorLaag(1),
  };
}

function maakVergrendeldeLaag(hoogte: number): Layer {
  return {
    hoogte,
    ontgrendeld: false,
    tiles: maakLegeTiles(hoogte),
    terreinType: terreinTypeVoorLaag(hoogte),
    dreigingsniveau: dreigingsniveauVoorLaag(hoogte),
  };
}

// De startwereld: laag 1 (startstad) ontgrendeld, lagen 2-13 nog achter fog of war.
export function maakInitieleWereld(): Layer[] {
  return Array.from({ length: TUTORIAL_LAAG_AANTAL }, (_, i) =>
    i === 0 ? maakStartLaag() : maakVergrendeldeLaag(i + 1)
  );
}

// Hoogste ontgrendelde laag = de huidige frontier-grens (hoofdstuk 2).
export function hoogsteOntgrendeldeLaag(lagen: Layer[]): number {
  return lagen.reduce(
    (max, laag) => (laag.ontgrendeld ? Math.max(max, laag.hoogte) : max),
    0
  );
}

// Standaard vooruitkijk = 1 laag verder dan de ontgrendelde grens (terreintype
// zichtbaar, maar geen tile-details) — zie hoofdstuk 2, "Vooruitkijken".
export function isVooruitkijkLaag(laag: Layer, lagen: Layer[]): boolean {
  return laag.hoogte === hoogsteOntgrendeldeLaag(lagen) + 1;
}

// Hoeveel nog-onontdekte mist-lagen we, naast de ene vooruitkijk-laag, boven
// de frontier tonen (issue: "haal een paar onontdekte tegels weg, die zijn
// voor nu niet relevant"). Zonder deze grens rendert de canvas alle
// tutorial-lagen vanaf het begin, wat de stad onderaan ver buiten beeld
// scrollt — met deze grens blijft de zichtbare kaart beperkt tot wat relevant
// is: de ontgrendelde lagen, de vooruitkijk-laag, en een klein stukje mist
// erboven zodat de kaart niet abrupt afgesneden oogt.
const ZICHTBARE_MIST_LAGEN_BOVEN_VOORUITKIJK = 2;

// Het deel van `lagen` dat daadwerkelijk op de canvas gerenderd wordt (zie
// GameCanvas/tekenWereld). Snijdt simpelweg de bovenste, (nog) niet-relevante
// mist-lagen af — de resterende hoogtes blijven 1..N zonder gaten, dus de
// bestaande rij-geometrie (hoogte → canvas-rij) blijft ongewijzigd werken.
export function zichtbareLagen(lagen: Layer[]): Layer[] {
  const frontier = hoogsteOntgrendeldeLaag(lagen);
  const maxHoogte = Math.min(
    lagen.length,
    frontier + 1 + ZICHTBARE_MIST_LAGEN_BOVEN_VOORUITKIJK
  );
  return lagen.filter((laag) => laag.hoogte <= maxHoogte);
}

// Cultuurdrempel om laag `hoogte` te ontgrendelen (M5, hoofdstuk 5: "cultuur →
// laag-ontgrendeling"). Kwadratisch oplopend (hoofdstuk 14; issue: "cultuur
// doorrekenen" — de eerdere exponentiële formule schaalde niet naar de
// 30-60-laags campagnes, zie hoofdstuk 11 voor de onderbouwing). Laag 1 is de
// startlaag en heeft dus geen drempel.
//
// CULTUUR_KOSTEN_BASIS verlaagd van 15 naar 3 (issue: "de eerste
// cultuurdrempel is te hoog", hoofdstuk 11/14 voor de volledige doorrekening).
// De basis is een vaste optelling die bij lage lagen (waar de kwadratische
// term nog klein is) verreweg de grootste bijdrage aan de kosten levert, maar
// bij hoge lagen verwaarloosbaar wordt tegenover de kwadratische term — hem
// verlagen knijpt dus specifiek de eerste paar lagen samen zonder de reeds
// getunede curve verderop (hoofdstuk 11: "kwadratisch i.p.v. exponentieel")
// noemenswaardig te veranderen. CULTUUR_KOSTEN_KWADRATISCHE_FACTOR blijft
// daarom bewust ongewijzigd. Exacte cijfers blijven een bewuste MVP-
// placeholder, geen definitieve balans.
const CULTUUR_KOSTEN_BASIS = 3;
const CULTUUR_KOSTEN_KWADRATISCHE_FACTOR = 5;

export function cultuurKostenVoorLaag(hoogte: number): number {
  return CULTUUR_KOSTEN_BASIS + CULTUUR_KOSTEN_KWADRATISCHE_FACTOR * (hoogte - 1) ** 2;
}

// Voedseldrempel om de groei-tier klein→middel te mogen starten (M6,
// hoofdstuk 4/5: "voedsel verzameld richting groei-drempels"). Bereiken van
// de drempel ontgrendelt alleen de keuze — groei start pas als de speler dit
// bewust kiest (hoofdstuk 11: "een bewuste gok, geen gratis extra beloning"),
// in tegenstelling tot de automatische laag-ontgrendeling bij cultuur (M5).
// Net als cultuurKostenVoorLaag een bewuste MVP-placeholder (hoofdstuk 14);
// de MVP-scope beperkt zich tot deze ene groei-stap (hoofdstuk 13), dus geen
// aparte formule per grootte-tier nodig.
export const VOEDSEL_DREMPEL_GROEI = 40;

// Voedseldrempel voor de tweede groei-tier, middel→groot (hoofdstuk 3/4/13/
// 14, issue: "city improvements" Deel 2 — ontbrak nog volledig). Zelfde
// bewuste-keuze-patroon als `VOEDSEL_DREMPEL_GROEI` hierboven (het bereiken
// van de drempel ontgrendelt alleen de keuze, groei start pas bewust via
// `startGroei` in economie.ts). MVP-placeholder, doorgerekend in hoofdstuk 14
// tegen de late-tutorial-voedseleconomie (rond laag 10+, waar de speler
// doorgaans al meerdere boerderijen heeft).
export const VOEDSEL_DREMPEL_GROEI_GROOT = 100;

// Of een vakje geschikt is om een nieuwe stad te stichten (hoofdstuk 2,
// issue: "stad stichten op de frontier"): aan vers water, en nog onbebouwd —
// een vakje met een improvement of een ghost town erop is geen geldig doel
// meer, ook al ligt het aan water. Gedeeld tussen `stichtStad` (economie.ts),
// de settler-UI en de tile-info-pop-up zodat alle drie dezelfde regel volgen.
export function isGeschiktVoorStichten(tile: Tile): boolean {
  return Boolean(tile.versWater) && tile.status === "leeg";
}
