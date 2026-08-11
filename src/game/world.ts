// Bouwt de initiële wereldstaat voor de tutorial ("De Eerste Vuren", streken 1-14).
// Zie frontier-city-design-doc.md hoofdstuk 2 (ruimtelijk model) en hoofdstuk 10 (tutorial-opzet).

import { BezetteStreekInhoud, Streek, TerreinType, Tile } from "./types";

export const BAND_WIDTH_TILES = 9;
export const STAD_POSITIE = 4; // middelste vakje van de band = stad
// 14 streken (issue: "jagen en farmen omdraaien" — de Boerderij krijgt een
// eigen streek (3), in plaats van meteen vanaf streek 1 bouwbaar te zijn),
// één meer dan de oorspronkelijke 13.
export const TUTORIAL_STREEK_AANTAL = 14;

// Streek van de Bezette Streek ("De Bergkam", hoofdstuk 6, issue: "De Bezette
// Streek, missionaris en verkenner" — vervangt de eerdere, kleinere
// "militaire confrontatie op streek 12"-placeholder volledig). Los van
// `TUTORIAL_STREEK_AANTAL` gehouden (issue: "tutorial laatste stad aan
// oceaan") — vóór streek 13 erbij kwam waren dit dezelfde streek. Het generieke
// Bezette-Streek-mechanisme zelf (bevriezing, Verkenning, Belegering,
// Confrontatie) leeft in economie.ts en kent alleen deze ene hoogte als
// tutorial-specifieke scripting — een latere campagne zou hier een eigen
// hoogte (of meerdere) voor kunnen definiëren.
// Schoof van 12 naar 13 (issue: "jagen en farmen omdraaien" — de nieuwe
// Boerderij-streek 3 duwt alles vanaf de oude streek 3 een plek op).
export const BEZETTE_STREEK_HOOGTE = 13;

export function isBezetteStreekHoogte(hoogte: number): boolean {
  return hoogte === BEZETTE_STREEK_HOOGTE;
}

// Vaste (niet-procedurele) terreintypes voor de tutorial-streken — de tutorial is
// vastgelegde inhoud, geen random worldgen zoals bij latere campagnes (hoofdstuk 8).
const TUTORIAL_TERREINTYPES = [
  "oevervlakte",
  "rietmoeras",
  // Nieuwe streek 3 (issue: "jagen en farmen omdraaien" — de Boerderij komt
  // pas hier, niet meer meteen bouwbaar vanaf streek 1).
  "akkerland",
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

function terreinTypeVoorStreek(hoogte: number): string {
  return TUTORIAL_TERREINTYPES[hoogte - 1] ?? "onbekend";
}

// Vast terrein-subtype per vakje binnen elke streek (issue: "grotere
// verscheidenheid van tiles per streek" + terreinEisen op Improvement) — net
// als TUTORIAL_TERREINTYPES hierboven vastgelegde tutorial-inhoud, geen
// random worldgen. Index = `positieInStreek` (0-8); index 4 (het stad-vakje)
// krijgt een placeholder-waarde die nooit voor plaatsingslogica gebruikt
// wordt. Elke streek houdt bewust minstens één vakje van elk van `bos`,
// `heuvel`/`berg` en `vlak` aan, zodat geen enkele streek houtkap, mijn of
// boerderij helemaal onmogelijk maakt — de mix verschuift wel duidelijk met
// de hoogte (bv. geen bos meer op de kale hoogvlakte/bergkam, op één
// eenzame boom na) zodat de terreinkeuze voelbaar blijft.
const TUTORIAL_TILE_TERREIN: Record<number, TerreinType[]> = {
  1: ["vlak", "vlak", "bos", "vlak", "vlak", "vlak", "heuvel", "vlak", "vlak"],
  2: ["vlak", "bos", "vlak", "heuvel", "vlak", "vlak", "vlak", "bos", "vlak"],
  // Nieuwe streek 3 (issue: "jagen en farmen omdraaien"): vooral vlakke grond
  // voor de Boerderij, met minstens één bos- en één heuvelvakje (zelfde
  // mix-conventie als elke andere streek hieronder).
  3: ["vlak", "vlak", "vlak", "heuvel", "vlak", "vlak", "bos", "vlak", "vlak"],
  4: ["bos", "vlak", "bos", "heuvel", "vlak", "vlak", "bos", "vlak", "vlak"],
  5: ["bos", "bos", "vlak", "bos", "vlak", "heuvel", "bos", "vlak", "bos"],
  6: ["heuvel", "vlak", "heuvel", "vlak", "vlak", "bos", "heuvel", "vlak", "vlak"],
  7: ["heuvel", "heuvel", "vlak", "heuvel", "vlak", "bos", "heuvel", "vlak", "heuvel"],
  8: ["berg", "heuvel", "berg", "bos", "vlak", "heuvel", "berg", "vlak", "heuvel"],
  9: ["berg", "berg", "heuvel", "bos", "vlak", "berg", "heuvel", "vlak", "berg"],
  10: ["bos", "bos", "heuvel", "bos", "vlak", "vlak", "bos", "heuvel", "bos"],
  11: ["vlak", "heuvel", "vlak", "heuvel", "vlak", "vlak", "bos", "vlak", "vlak"],
  12: ["berg", "heuvel", "berg", "heuvel", "vlak", "vlak", "bos", "vlak", "heuvel"],
  13: ["berg", "berg", "heuvel", "berg", "vlak", "vlak", "bos", "heuvel", "berg"],
  14: ["vlak", "bos", "vlak", "heuvel", "vlak", "vlak", "bos", "heuvel", "vlak"],
};

function terreinVoorTile(hoogte: number, positieInStreek: number): TerreinType {
  return TUTORIAL_TILE_TERREIN[hoogte]?.[positieInStreek] ?? "vlak";
}

// Vakjes die aan vers water liggen — een rivier of een meer (hoofdstuk 2:
// "een stad kan alleen gesticht worden op een vakje dat aan vers water
// ligt"). Vaste tutorial-worldgen (net als TUTORIAL_TILE_TERREIN hierboven).
// Sinds issue "tutorial laatste stad aan oceaan" staat dit vakje uitsluitend
// op de allerlaatste streek (TUTORIAL_STREEK_AANTAL, de oceaan aan de overkant)
// — de enige plek in de hele tutorial met vers water. Dat maakt het stichten
// van de laatste stad een bewuste, unieke bestemming aan het eind van de
// tocht, in plaats van een keuze die de speler al vanaf streek 10 open staat.
// Op een vlak vakje (nooit het centrum/positie 4) zodat het ook een
// boerderij-kandidaat is — plannen waar je een stad sticht versus waar je
// verbouwt, is een bewuste keuze, geen dwangkeuze.
const TUTORIAL_VERS_WATER: Record<number, number[]> = {
  14: [5],
};

function versWaterVoorTile(hoogte: number, positieInStreek: number): boolean {
  return TUTORIAL_VERS_WATER[hoogte]?.includes(positieInStreek) ?? false;
}

// Streek waarop de eerste Amberader-locatie gegarandeerd zichtbaar/beschikbaar
// wordt (issue: "toevoeging Goud" Deel 1) — gedeeld met `verwerkStreekOntgrendeling`
// in economie.ts, die op precies deze streek de ontdekkings-pop-up (hoofdstuk
// 3/14) triggert.
export const AMBER_ONTDEKKING_STREEK = 8;

// Streek waarop de tweede, gegarandeerde Amberader-locatie beschikbaar komt
// (issue: "Amberader sowieso op streek 12" — softlock-preventie): een speler
// die de eerste Amberader (streek 8) liet uitputten zonder ooit een Markt te
// bouwen, zou anders zonder lopend goud-inkomen tegen de Bezette Streek (streek
// 13, hoofdstuk 6) kunnen aanlopen terwijl zowel Offer Altaar als Legerkamp
// goud vereisen (hoofdstuk 11/14). Bewust vlak vóór streek 13 gekozen — laat
// (de speler heeft de kans gehad zelf een Markt te bouwen) maar nog op tijd
// om alsnog goud op te bouwen. Zelfde trigger-patroon als
// `AMBER_ONTDEKKING_STREEK` hierboven.
export const AMBER_ONTDEKKING_STREEK_2 = 12;

// Vakjes met een amberader — de vondst-eis van de Amberader/goudmijn-
// improvement (hoofdstuk 3/14), bovenop de gewone heuvel/berg-terreineis van
// een mijn (zie `improvementPastOpTile` in improvements.ts). Bewust schaarser
// dan gewone erts-mijn-locaties: van de 33 heuvel/berg-vakjes in de hele
// tutorial (`TUTORIAL_TILE_TERREIN` hierboven) hebben er hier maar drie een
// amberader, tegenover "elk heuvel/bergvakje" voor een gewone mijn. Vast,
// niet-procedureel (net als `TUTORIAL_VERS_WATER` hierboven) en bewust zo
// gekozen dat streek `AMBER_ONTDEKKING_STREEK` de eerste is met zo'n vakje — de
// speler heeft dus nooit pech en hoeft nooit voorbij die streek te zoeken naar
// de eerste kans op een Amberader. Streek `AMBER_ONTDEKKING_STREEK_2` (positie 2,
// een bergvakje) is op dezelfde manier gegarandeerd de tweede vondst.
const TUTORIAL_AMBER: Record<number, number[]> = {
  8: [0],
  9: [5],
  12: [2],
};

function amberVoorTile(hoogte: number, positieInStreek: number): boolean {
  return TUTORIAL_AMBER[hoogte]?.includes(positieInStreek) ?? false;
}

// Vaste inhoud-verdeling van de Bezette Streek (hoofdstuk 6, issue: "De
// Bezette Streek, missionaris en verkenner", Deel 1 — aantal wachttorens/
// heiligdommen bijgesteld naar issue "laatste confrontatie tweaken")
// — tutorial-scripting op `BEZETTE_STREEK_HOOGTE` (streek 13), net zo
// vastgelegd/niet-procedureel als `TUTORIAL_AMBER` hierboven. Verspreid over
// 8 van de 9 vakjes: precies één vijandelijke Wachttoren (het enige
// Confrontatie-doel) en één vijandelijk Heiligdom (het enige
// Belegeringsdoel) — bewust op precies 1 van elk gehouden, want de streek
// ontgrendelt pas zodra allebei vernietigd zijn (zie `verwerkBelegering` in
// streekOntgrendeling.ts): meerdere exemplaren zouden dat alleen maar een
// herhaling van dezelfde actie maken, geen extra diepte. De overige zes
// vakjes zijn cosmetische huisjes (geen doel, geen functie). Positie 4 (het
// middelste vakje — elders het stad-vakje) blijft bewust neutraal: een
// gewoon leeg vakje zodra onthuld, zodat niet alle 9 vakjes vijandelijke/
// cosmetische inhoud hoeven te dragen.
const TUTORIAL_BEZETTE_STREEK_INHOUD: Record<number, BezetteStreekInhoud> = {
  0: "wachttoren",
  1: "heiligdom",
  2: "huisje",
  3: "huisje",
  5: "huisje",
  6: "huisje",
  7: "huisje",
  8: "huisje",
};

function bezetteStreekInhoudVoorTile(hoogte: number, positieInStreek: number): BezetteStreekInhoud | undefined {
  return hoogte === BEZETTE_STREEK_HOOGTE ? TUTORIAL_BEZETTE_STREEK_INHOUD[positieInStreek] : undefined;
}

// Initialiseert een Bezette Streek zodra ze "in beeld komt" (economie.ts:
// `verwerkStreekOntgrendeling`, dezelfde soort trigger als de gegarandeerde
// Amberader-vondst op streek 8): zet `bezet: true` en verhult elk vakje
// individueel (`Tile.verhuld`), los van de gewone streek-brede fog-of-war —
// de streek zelf blijft `ontgrendeld: false` tot alle vijandelijke
// Heiligdommen vernietigd zijn (zie `verwerkBelegering` in economie.ts).
export function initialiseerBezetteStreek(streek: Streek): Streek {
  return {
    ...streek,
    bezet: true,
    belegeringsVoortgang: 0,
    tiles: streek.tiles.map((tile) => ({
      ...tile,
      verhuld: true,
      bezetteStreekInhoud: bezetteStreekInhoudVoorTile(streek.hoogte, tile.positieInStreek),
    })),
  };
}

// Dreigingsniveau per streek (M7, hoofdstuk 6): de tegenstandersterkte bij een
// militaire confrontatie op die streek, gebruikt door `confrontatie` in
// economie.ts. Vastgelegde tutorial-waarden, oplopend met de hoogte — net
// als cultuurKostenVoorStreek een bewuste MVP-placeholder (hoofdstuk 14: de
// exacte winkans-formule ligt nog niet vast). Streek 1 is de startstreek en dus
// dreigingsvrij.
function dreigingsniveauVoorStreek(hoogte: number): number {
  return Math.max(0, (hoogte - 1) * 2);
}

function maakLegeTiles(hoogte: number): Tile[] {
  return Array.from({ length: BAND_WIDTH_TILES }, (_, positieInStreek) => ({
    positieInStreek,
    terrein: terreinVoorTile(hoogte, positieInStreek),
    status: "leeg" as const,
    versWater: versWaterVoorTile(hoogte, positieInStreek),
    amber: amberVoorTile(hoogte, positieInStreek),
  }));
}

function maakStartStreek(): Streek {
  const tiles = maakLegeTiles(1);
  tiles[STAD_POSITIE] = {
    positieInStreek: STAD_POSITIE,
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
    terreinType: terreinTypeVoorStreek(1),
    dreigingsniveau: dreigingsniveauVoorStreek(1),
  };
}

function maakVergrendeldeStreek(hoogte: number): Streek {
  return {
    hoogte,
    ontgrendeld: false,
    tiles: maakLegeTiles(hoogte),
    terreinType: terreinTypeVoorStreek(hoogte),
    dreigingsniveau: dreigingsniveauVoorStreek(hoogte),
  };
}

// De startwereld: streek 1 (startstad) ontgrendeld, streken 2-13 nog achter fog of war.
export function maakInitieleWereld(): Streek[] {
  return Array.from({ length: TUTORIAL_STREEK_AANTAL }, (_, i) =>
    i === 0 ? maakStartStreek() : maakVergrendeldeStreek(i + 1)
  );
}

// Sentinel-hoogte voor de klikbare oceaan-rij ná streek TUTORIAL_STREEK_AANTAL
// (issue: "laatste oceaan ook visueel") — net als hoogte 0 voor de startoceaan
// (zie GameCanvas: `bepaalAangeklikteTile`) geen echte `Streek`, puur een
// aparte, altijd-eind-van-de-band positie voor de tile-info-pop-up.
export const EINDE_OCEAAN_HOOGTE = TUTORIAL_STREEK_AANTAL + 1;

// Of de afsluitende oceaan-rij bóven streek TUTORIAL_STREEK_AANTAL getekend moet
// worden (hoofdstuk 2/10: "de oceaan aan de overkant" als einddoel van de
// tocht) — pas zodra die laatste streek daadwerkelijk ontgrendeld/speelbaar is,
// net zoals de startoceaan onderaan er al vanaf het begin staat omdat streek 1
// vanaf het begin ontgrendeld is. Vóór die tijd blijft de kaart gewoon in
// mist eindigen (zie `zichtbareStreken` hieronder) — de tocht is dan nog niet
// voltooid.
export function eindeOceaanZichtbaar(streken: Streek[]): boolean {
  return streken.some((streek) => streek.hoogte === TUTORIAL_STREEK_AANTAL && streek.ontgrendeld);
}

// Hoogste ontgrendelde streek = de huidige frontier-grens (hoofdstuk 2).
export function hoogsteOntgrendeldeStreek(streken: Streek[]): number {
  return streken.reduce(
    (max, streek) => (streek.ontgrendeld ? Math.max(max, streek.hoogte) : max),
    0
  );
}

// Standaard vooruitkijk = 1 streek verder dan de ontgrendelde grens (terreintype
// zichtbaar, maar geen tile-details) — zie hoofdstuk 2, "Vooruitkijken".
export function isVooruitkijkStreek(streek: Streek, streken: Streek[]): boolean {
  return streek.hoogte === hoogsteOntgrendeldeStreek(streken) + 1;
}

// Hoeveel nog-onontdekte mist-streken we, naast de ene vooruitkijk-streek, boven
// de frontier tonen (issue: "haal een paar onontdekte tegels weg, die zijn
// voor nu niet relevant"). Zonder deze grens rendert de canvas alle
// tutorial-streken vanaf het begin, wat de stad onderaan ver buiten beeld
// scrollt — met deze grens blijft de zichtbare kaart beperkt tot wat relevant
// is: de ontgrendelde streken, de vooruitkijk-streek, en een klein stukje mist
// erboven zodat de kaart niet abrupt afgesneden oogt.
const ZICHTBARE_MIST_STREKEN_BOVEN_VOORUITKIJK = 2;

// Het deel van `streken` dat daadwerkelijk op de canvas gerenderd wordt (zie
// GameCanvas/tekenWereld). Snijdt simpelweg de bovenste, (nog) niet-relevante
// mist-streken af — de resterende hoogtes blijven 1..N zonder gaten, dus de
// bestaande rij-geometrie (hoogte → canvas-rij) blijft ongewijzigd werken.
export function zichtbareStreken(streken: Streek[]): Streek[] {
  const frontier = hoogsteOntgrendeldeStreek(streken);
  const maxHoogte = Math.min(
    streken.length,
    frontier + 1 + ZICHTBARE_MIST_STREKEN_BOVEN_VOORUITKIJK
  );
  return streken.filter((streek) => streek.hoogte <= maxHoogte);
}

// Cultuurdrempel om streek `hoogte` te ontgrendelen (M5, hoofdstuk 5: "cultuur →
// streek-ontgrendeling"). Kwadratisch oplopend (hoofdstuk 14; issue: "cultuur
// doorrekenen" — de eerdere exponentiële formule schaalde niet naar de
// campagnes van 30-60 streken, zie hoofdstuk 11 voor de onderbouwing). Streek 1 is de
// startstreek en heeft dus geen drempel.
//
// CULTUUR_KOSTEN_BASIS verlaagd van 15 naar 3 (issue: "de eerste
// cultuurdrempel is te hoog", hoofdstuk 11/14 voor de volledige doorrekening).
// De basis is een vaste optelling die bij lage streken (waar de kwadratische
// term nog klein is) verreweg de grootste bijdrage aan de kosten levert, maar
// bij hoge streken verwaarloosbaar wordt tegenover de kwadratische term — hem
// verlagen knijpt dus specifiek de eerste paar streken samen zonder de reeds
// getunede curve verderop (hoofdstuk 11: "kwadratisch i.p.v. exponentieel")
// noemenswaardig te veranderen. CULTUUR_KOSTEN_KWADRATISCHE_FACTOR blijft
// daarom bewust ongewijzigd. Exacte cijfers blijven een bewuste MVP-
// placeholder, geen definitieve balans.
const CULTUUR_KOSTEN_BASIS = 3;
const CULTUUR_KOSTEN_KWADRATISCHE_FACTOR = 5;

export function cultuurKostenVoorStreek(hoogte: number): number {
  return CULTUUR_KOSTEN_BASIS + CULTUUR_KOSTEN_KWADRATISCHE_FACTOR * (hoogte - 1) ** 2;
}

// Voedseldrempel om de groei-tier klein→middel te mogen starten (M6,
// hoofdstuk 4/5: "voedsel verzameld richting groei-drempels"). Bereiken van
// de drempel ontgrendelt alleen de keuze — groei start pas als de speler dit
// bewust kiest (hoofdstuk 11: "een bewuste gok, geen gratis extra beloning"),
// in tegenstelling tot de automatische streek-ontgrendeling bij cultuur (M5).
// Net als cultuurKostenVoorStreek een bewuste MVP-placeholder (hoofdstuk 14);
// de MVP-scope beperkt zich tot deze ene groei-stap (hoofdstuk 13), dus geen
// aparte formule per grootte-tier nodig.
export const VOEDSEL_DREMPEL_GROEI = 40;

// Voedseldrempel voor de tweede groei-tier, middel→groot (hoofdstuk 3/4/13/
// 14, issue: "city improvements" Deel 2 — ontbrak nog volledig). Zelfde
// bewuste-keuze-patroon als `VOEDSEL_DREMPEL_GROEI` hierboven (het bereiken
// van de drempel ontgrendelt alleen de keuze, groei start pas bewust via
// `startGroei` in economie.ts). MVP-placeholder, doorgerekend in hoofdstuk 14
// tegen de late-tutorial-voedseleconomie (rond streek 10+, waar de speler
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
