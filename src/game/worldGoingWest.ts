// Vaste (niet-procedurele) campagnewereld voor de Amerikaanse frontier-campagne
// ("Going West", hoofdstuk 8/9/14 design-doc) — M20b (hoofdstuk 13/15). Zelfde
// patroon als de tutorial-worldgen (world.ts): losse `Record<hoogte, ...>`-
// tabellen voor terreintype/subtype/vers-water/goudader/dreigingsniveau,
// hier volledig losstaand van de tutorial-tabellen gehouden zodat die
// ongewijzigd blijven (CLAUDE.md). Besloten (issue #247, hoofdstuk 8/11): een
// handgeschreven, vaste kaart in plaats van seeded-RNG/procedurele
// streek-generatie — dezelfde reden als de tutorial-kaart, nu bewust ook
// gekozen voor een veel langere campagne.
//
// Scope-grens (hoofdstuk 13, milestone-tabel): M20b levert alleen de
// kaartdata; de vers-water-dichtheid hieronder is sinds M20c geverifieerd
// tegen `gegarandeerdeStichtingskansHoogten()` (`vindStichtingskansGaten()`,
// stad.ts — zie worldGoingWest.test.ts) en bleek zonder aanpassingen al aan
// de garantie te voldoen. Sinds M20d deelstap 1 kan `maakInitieleSpelStatus()`
// (initieleSpelStatus.ts) hier al doorheen bouwen (via een expliciete
// `campagneId`-parameter), en sinds M20d deelstap 3 loopt die `campagneId`
// ook al helemaal door van `CampagneSelectScherm` (via AppRoot/GameRoot) tot
// aan `useGameEngine()`. `CampagneSelectScherm` toont Going West voorlopig
// echter nog altijd als `beschikbaar: false` ("Binnenkort beschikbaar") —
// pas de laatste M20d-deelstap zet die knop aan, zie het M20d-issue.

import { MateriaalType, Streek, TerreinType, Tile, WampanoagInhoud } from "./types";

export const BAND_WIDTH_TILES = 9;
export const STAD_POSITIE = 4; // middelste vakje van de band = stad — zelfde conventie als de tutorial

// "Normaal"-lengte uit hoofdstuk 14 (30-40 streken); Makkelijk/Moeilijk-
// varianten zijn expliciet geen harde M20b-eis (hoofdstuk 13) en volgen als
// latere uitbreiding.
export const GOING_WEST_STREEK_AANTAL = 35;

// Streek-hoogte van de Wampanoag-laag (M21e, opdracht-wampanoag-opening.md
// §5) — het einde van de openingsfase, lopend op cultuur net als elke andere
// streek (`cultuurKostenVoorStreek` in world.ts; issue "Weer gewoon cultuur
// voor ontgrendeling" draaide een eerdere, wetenschap-gedreven versie hiervan
// terug). Verschoven van 4 naar 6 (issue: "Wampanoag streek blokkerend") om
// de speler meer van de openingsfase te laten spelen vóór de streek "in
// beeld" komt. Gedeeld met streekOntgrendeling.ts (de trigger, in de
// cultuur-gedreven ontgrendel-lus, en de blokkering zelf) en wampanoag.ts (de
// Verkenning-flow zelf) zodat beide dezelfde hoogte hanteren.
export const WAMPANOAG_STREEK_HOOGTE = 6;

// Streek-hoogte waarop de Ohio-rivier wordt aangekondigd (issue "Pop-up
// rivier"): zodra deze streek ontgrendelt, hoort de speler voor het eerst
// over een machtige rivier verderop naar het westen. De rivier zelf ligt op
// `RIVIER_STREEK_HOOGTE` hieronder.
export const RIVIER_AANKONDIGING_STREEK_HOOGTE = 9;

// Streek-hoogte van de rivier zelf (issue "Pop-up rivier", vervolg): de
// volledige streek bestaat uit rivier-vakjes (`GOING_WEST_TILE_TERREIN`
// hieronder) waar geen enkel gewoon land improvement op geplaatst kan worden
// (`improvementPastOpTerrein`, improvements.ts). Bewust geen vers-water- of
// goud-vondst hier (zie `GOING_WEST_VERS_WATER`/`GOING_WEST_GOUD` hieronder) —
// je kunt hier geen stad stichten, dit is een barrière die je over moet.
// De Ingenieur-opleiding en de brug-bouwmechaniek zelf (waarmee een
// rivier-vakje ooit wél een geldig plaatsingsdoel wordt) zijn expliciet nog
// niet gebouwd — apart, later issue.
export const RIVIER_STREEK_HOOGTE = 12;

// Wetenschapskosten om één Ingenieur op te leiden (issue "Pop-up rivier",
// vervolg: engineer + brug) — instant betaald, geen bouwtijd, zelfde
// instant-wetenschap-patroon als `VERKENNING_KOSTEN_WETENSCHAP`
// (streekOntgrendeling.ts).
export const INGENIEUR_KOSTEN_WETENSCHAP = 30;

// Grondstofkosten om één brug te bouwen op een rivier-vakje (issue "Pop-up
// rivier", vervolg: brug-bouwmechaniek) — instant betaald bij de klik op het
// vakje (`bouwBrug`, streekOntgrendeling.ts), geen bouwtijd. Vereist daarnaast
// een nog niet aan een andere brug toegewezen Ingenieur (zie
// `beschikbareIngenieurs`/`kanBrugBouwen`, streekOntgrendeling.ts).
export const BRUG_KOSTEN: Partial<Record<MateriaalType, number>> = { hout: 6, steen: 6 };

// Vaste, beschrijvende terreinnaam per streek (flavor, geen invloed op
// spelmechaniek — zelfde rol als TUTORIAL_TERREINTYPES in world.ts). Volgt de
// reisroute van het groene, kustnabije Wampanoag-thuisland (streek 1-6, tot en
// met `WAMPANOAG_STREEK_HOOGTE` hieronder — issue: "Going west terrein in
// eerste instantie groener"), via prairie/canyons/mesa's, over het
// hooggebergte, en weer naar beneden richting de Pacifische kust. Streek 1-6
// gebruiken bewust namen uit het zuidoostelijke New England-kustlandschap
// waar de Wampanoag woonden (kreken, zoutmoerassen, cederswamps, eikenbos)
// i.p.v. de drogere prairie/korenveld-namen die de rest van de kaart
// kenmerken; streek 6 sluit af met de maisakker die ook de Maïsboerderij van
// de Wampanoag-laag draagt (`WAMPANOAG_STREEK_INHOUD` hieronder).
const GOING_WEST_TERREINTYPES = [
  "kreekmonding",
  "zoutmoeras",
  "cederswamp",
  "eikenbos",
  "beboste heuvelrug",
  "maisakker",
  "essenbos",
  "heuvelrug",
  "kalksteenrichel",
  "droge vlakte",
  "canyonrand",
  // Streek 12 = `RIVIER_STREEK_HOOGTE` hierboven: de Ohio-rivier zelf, dus
  // deze flavornaam (i.p.v. het oorspronkelijke "zandsteenplateau") sluit aan
  // op de daadwerkelijke tile-inhoud van deze streek. Stond hier eerder één
  // index te laat (op streek 13 i.p.v. 12) — issue "Rivier ?": daardoor
  // heette en kleurde (`TERREIN_BASIS["rivier"]`, canvas.ts/canvasPixelArt.ts)
  // streek 13 als rivier terwijl de daadwerkelijke rivier-vakjes op streek 12
  // stonden.
  "rivier",
  "mesa",
  "ravijn",
  "cottonwood-oase",
  "steppegras",
  "rotsformaties",
  "voorgebergte",
  "dennenwoud",
  "granietrichel",
  "bergpas",
  "alpenweide",
  "sneeuwgrens",
  "gletsjerrand",
  "hooggebergte",
  "bergmeeroever",
  "keienveld",
  "wolkenkam",
  "westhelling",
  "dennenbos-afdaling",
  "beekdal",
  "goudgraversvallei",
  "populierenbos",
  "rivierbocht",
  "pacifische kust",
];

// Geëxporteerd (M20f, hoofdstuk 9/19 design-doc): `goingWestContent.ts`
// hergebruikt deze namen als streek-`naam` zolang er nog geen echte
// flavor-tekst per streek geschreven is (issue #278, blocker 1 vervolg).
export function terreinTypeVoorStreek(hoogte: number): string {
  return GOING_WEST_TERREINTYPES[hoogte - 1] ?? "onbekend";
}

// Vast terrein-subtype per vakje binnen elke streek — zelfde conventie als
// TUTORIAL_TILE_TERREIN in world.ts (index = `positieInStreek`, 0-8; index 4
// is het stad-vakje op streek 1, elders een gewoon vakje). Elke streek houdt
// bewust minstens één vakje van elk van `bos`, `heuvel`/`berg` en `vlak` aan
// (zelfde mix-conventie als de tutorial), terwijl de verhouding duidelijk
// verschuift met de hoogte: vlakke prairie (streek 1-9) → canyons/mesa's
// (10-18) → hooggebergte (19-27) → afdaling naar de kust (28-35).
// Streek 1-4 (opdracht-wampanoag-opening.md, de openingsfase) kregen
// oorspronkelijk vrijwel dezelfde krappe mix als de tutorial —
// op elke streek maar één heuvel-vakje en (voor streek 1) helemaal geen
// berg-vakje. Sinds `beschikbareOpties` (improvements.ts) de tutorial-
// `minStreek`-tempobeperking niet meer toepast op Going West (issue: "Going
// west campaign geen tutorial") kan de speler daardoor al vanaf streek 1
// tegelijk Steengroeve, Mijn, Goudader en Wachttoren willen bouwen, terwijl
// er maar één geschikt vakje voor was. Streek 1-4 hebben daarom hier een
// ruimere heuvel/berg-mix (3 in plaats van 1) gekregen, zodat "alle
// grondstoffen komen in principe al op streek 1 voor" ook daadwerkelijk
// tegelijk bouwbaar is — zie ook `GOING_WEST_GOUD` hieronder voor de
// bijbehorende goud-vondst op streek 1. Streek 6 draagt het Wampanoag-kamp
// op zijn vijf middelste vakjes (positie 2 t/m 6, issue "Wampanoag kamp
// uitbreiding"): positie 2 is `vlak` voor de Maïsboerderij, positie 6 (al
// `vlak`) krijgt zijn vers-water-vondst via `GOING_WEST_VERS_WATER` hieronder
// voor de Beverjachthut, de overige drie (3/4/5 — twee tentjes en de
// Opperhoofdtent) hebben geen terrein-eis — zie `WAMPANOAG_STREEK_INHOUD`
// hieronder. Overige streken blijven ongewijzigd — de kaart verschuift toch
// al vanzelf naar meer heuvel/berg (canyons/mesa's, zie de modulekop).
const GOING_WEST_TILE_TERREIN: Record<number, TerreinType[]> = {
  1: ["heuvel", "bos", "vlak", "bos", "vlak", "vlak", "heuvel", "vlak", "berg"],
  2: ["heuvel", "bos", "vlak", "heuvel", "bos", "vlak", "berg", "bos", "vlak"],
  3: ["bos", "heuvel", "vlak", "bos", "berg", "vlak", "heuvel", "bos", "vlak"],
  4: ["vlak", "vlak", "bos", "heuvel", "berg", "vlak", "bos", "heuvel", "vlak"],
  // Positie 6 kreeg een tweede heuvel-vakje (issue: "Extra heuvel op streek 5")
  // — met maar één heuvel-vakje kon een speler die daar al een Steengroeve of
  // Wachttoren op had staan geen Mijn meer bouwen; erts is anders niet meer
  // te winnen op deze streek.
  5: ["vlak", "bos", "vlak", "vlak", "bos", "heuvel", "heuvel", "vlak", "bos"],
  // Positie 2 (issue "Wampanoag kamp uitbreiding": het Wampanoag-kamp is
  // verbreed van de 3 naar de 5 middelste vakjes) is bewust `vlak` i.p.v. het
  // eerdere `heuvel` — de Maïsboerderij (terreineis `vlak`) staat sindsdien op
  // positie 2, zie `WAMPANOAG_STREEK_INHOUD` hieronder.
  6: ["vlak", "vlak", "vlak", "vlak", "vlak", "bos", "vlak", "heuvel", "vlak"],
  7: ["vlak", "heuvel", "vlak", "bos", "vlak", "heuvel", "vlak", "vlak", "bos"],
  8: ["heuvel", "vlak", "bos", "vlak", "heuvel", "vlak", "bos", "vlak", "vlak"],
  9: ["vlak", "bos", "heuvel", "vlak", "vlak", "heuvel", "vlak", "bos", "vlak"],
  10: ["heuvel", "vlak", "heuvel", "bos", "vlak", "heuvel", "vlak", "berg", "vlak"],
  11: ["berg", "heuvel", "vlak", "heuvel", "bos", "vlak", "heuvel", "vlak", "berg"],
  // Streek 12 = `RIVIER_STREEK_HOOGTE`: bewust een uitzondering op de
  // "minstens 1 vlak/bos/heuvel-of-berg"-mix hierboven — de hele streek is
  // rivier (issue "Pop-up rivier", vervolg), geen enkel gewoon land
  // improvement past hier (`improvementPastOpTerrein`, improvements.ts).
  12: ["rivier", "rivier", "rivier", "rivier", "rivier", "rivier", "rivier", "rivier", "rivier"],
  13: ["vlak", "heuvel", "berg", "heuvel", "bos", "heuvel", "vlak", "berg", "heuvel"],
  14: ["berg", "heuvel", "vlak", "berg", "heuvel", "bos", "heuvel", "vlak", "berg"],
  15: ["heuvel", "berg", "heuvel", "vlak", "bos", "heuvel", "berg", "heuvel", "vlak"],
  16: ["berg", "vlak", "heuvel", "berg", "bos", "heuvel", "vlak", "berg", "heuvel"],
  17: ["heuvel", "berg", "heuvel", "bos", "heuvel", "vlak", "berg", "heuvel", "berg"],
  18: ["berg", "heuvel", "berg", "heuvel", "bos", "heuvel", "berg", "vlak", "heuvel"],
  19: ["berg", "berg", "heuvel", "bos", "vlak", "berg", "heuvel", "berg", "berg"],
  20: ["berg", "vlak", "berg", "berg", "vlak", "heuvel", "berg", "bos", "berg"],
  21: ["heuvel", "berg", "berg", "bos", "berg", "heuvel", "berg", "vlak", "berg"],
  22: ["berg", "berg", "heuvel", "berg", "vlak", "berg", "bos", "berg", "heuvel"],
  23: ["berg", "heuvel", "berg", "vlak", "berg", "bos", "berg", "berg", "heuvel"],
  24: ["heuvel", "berg", "berg", "berg", "bos", "berg", "heuvel", "vlak", "berg"],
  25: ["berg", "berg", "vlak", "berg", "heuvel", "berg", "bos", "berg", "berg"],
  26: ["berg", "bos", "berg", "heuvel", "berg", "vlak", "berg", "berg", "heuvel"],
  27: ["heuvel", "berg", "berg", "vlak", "berg", "berg", "bos", "berg", "berg"],
  28: ["berg", "heuvel", "berg", "bos", "vlak", "heuvel", "berg", "vlak", "heuvel"],
  29: ["heuvel", "berg", "bos", "heuvel", "vlak", "berg", "heuvel", "vlak", "bos"],
  30: ["berg", "bos", "heuvel", "vlak", "heuvel", "bos", "vlak", "berg", "heuvel"],
  31: ["bos", "heuvel", "vlak", "bos", "heuvel", "vlak", "berg", "bos", "vlak"],
  32: ["vlak", "bos", "heuvel", "vlak", "bos", "vlak", "heuvel", "bos", "vlak"],
  33: ["bos", "vlak", "bos", "heuvel", "vlak", "bos", "vlak", "heuvel", "vlak"],
  34: ["vlak", "bos", "vlak", "bos", "heuvel", "vlak", "bos", "vlak", "bos"],
  35: ["bos", "vlak", "bos", "vlak", "bos", "vlak", "heuvel", "bos", "vlak"],
};

function terreinVoorTile(hoogte: number, positieInStreek: number): TerreinType {
  return GOING_WEST_TILE_TERREIN[hoogte]?.[positieInStreek] ?? "vlak";
}

// Vakjes die aan vers water liggen (hoofdstuk 2: alleen hier mag gesticht
// worden). In tegenstelling tot de tutorial (precies één, uitsluitend op de
// allerlaatste streek — de tutorial laat het herhalende stichtingspatroon
// bewust nooit meer dan die ene keer zien, hoofdstuk 9/13) heeft de Going
// West-kaart hier meerdere, over de hele route verspreide vakjes nodig zodra
// het stichtingspatroon speelbaar wordt. Interval hier is ruwweg om de 3-4
// streken, met het laatste vakje op de laatste streek (35) — M20c
// (`vindStichtingskansGaten()`, stad.ts, getoetst in worldGoingWest.test.ts)
// bevestigt dat deze dichtheid alle drie de kans-vensters uit
// `gegarandeerdeStichtingskansHoogten()` een treffer geeft, ongeacht op welke
// van deze hoogten daadwerkelijk gesticht wordt. Op een `vlak`-vakje gekozen
// (nooit het stad-centrum, positie 4), zelfde reden als de tutorial: ook
// bruikbaar als Boerderij-kandidaat.
//
// Streek 6, positie 6 (issue "Wampanoag kamp uitbreiding": het Wampanoag-kamp
// beslaat sindsdien de vijf middelste vakjes — positie 2 t/m 6, zie
// `WAMPANOAG_STREEK_INHOUD` hieronder — vóór die issue lag dit op positie 3,
// vóór issue "Na de Wampanoag" op positie 1; bewust niet positie 4 zelf, want
// dat is overal `STAD_POSITIE` en vers water hoort daar nooit op te liggen,
// zie het M20c-vers-water-invariant-testje in worldGoingWest.test.ts): een
// extra vondst, bovenop — niet in plaats van — het bestaande 4/8/12/...-ritme
// hierboven, puur voor de Beverjachthut van de Wampanoag-laag op
// `WAMPANOAG_STREEK_HOOGTE` (worldGoingWest.ts). Verhoogt de dichtheid alleen
// maar, dus de M20c-stichtingskans-garantie (`vindStichtingskansGaten()`,
// getoetst in worldGoingWest.test.ts) blijft hierdoor gewoon gehaald.
// Streek 12 (`RIVIER_STREEK_HOOGTE`) draagt bewust géén vers-water-vondst
// (meer) — de hele streek is rivier (issue "Pop-up rivier", vervolg), je kunt
// hier geen stad stichten. De oorspronkelijke vondst op deze hoogte is
// vervangen door twee nieuwe, op streek 10 en 13 (in plaats van vlak vóór en
// ná de rivier) — nodig omdat de M20c-garantie hierboven specifiek leunt op
// een treffer binnen [streek 8 + 1, streek 8 + 4] én binnen het venster van
// elke nieuwe stichtingshoogte zelf; één enkele vervangende hoogte bleek
// steeds een nieuw gat op te leveren (zie worldGoingWest.test.ts), vandaar
// deze twee in plaats van één-op-één.
const GOING_WEST_VERS_WATER: Record<number, number[]> = {
  4: [1],
  6: [6],
  8: [3],
  10: [1],
  13: [0],
  16: [1],
  20: [1],
  24: [7],
  28: [7],
  32: [3],
  35: [8],
};

function versWaterVoorTile(hoogte: number, positieInStreek: number): boolean {
  return GOING_WEST_VERS_WATER[hoogte]?.includes(positieInStreek) ?? false;
}

// Vaste inhoud-verdeling van de Wampanoag-laag (M21e, opdracht-wampanoag-
// opening.md §5; posities eerst verschoven naar de drie middelste vakjes door
// issue "Na de Wampanoag" — "de 3 Wampanoag gebouwen [staan] op de 3
// middelste vakjes van hun bezette streek. Altijd." — en sindsdien verbreed
// naar de vijf middelste vakjes door issue "Wampanoag kamp uitbreiding", die
// vraagt om een groter kamp met twee extra, puur decoratieve tentjes naast de
// drie functionele gebouwen): vijf vaste vakjes op `WAMPANOAG_STREEK_HOOGTE`
// (streek 6), positie 2 t/m 6 — nog altijd gecentreerd rond `STAD_POSITIE`
// (4), met het terrein-subtype van dat vakje (`GOING_WEST_TILE_TERREIN`
// hierboven) bepalend voor welk gebouw er ligt zodra het onthuld wordt
// (opdracht: "terrein bepaalt welk van de drie gebouwen ergens kán liggen ...
// geen aparte trekking/keuze-UI nodig"), van links naar rechts:
// - Maïsboerderij vereist vlakke grond — positie 2 (`vlak`, geen vers water).
// - Tentje (decoratief, geen terrein-eis) — positie 3.
// - Opperhoofdtent heeft geen terrein-eis (Cultureel/diplomatiek van aard,
//   opdracht §2) — positie 4.
// - Tentje (decoratief, geen terrein-eis) — positie 5.
// - Beverjachthut vereist vers water — `GOING_WEST_VERS_WATER[6]` heeft maar
//   één zo'n vakje (positie 6, bewust niet positie 4 zelf, zie de toelichting
//   daar), dus die ligt hier vast.
// De overige vier posities dragen bewust geen inhoud — zelfde conventie als
// `TUTORIAL_BEZETTE_STREEK_INHOUD` in world.ts: niet elk vakje van een
// verhullingslaag hoeft bijzondere inhoud te dragen. Ze worden, net als bij
// de Bezette Streek, wél mee verhuld (`initialiseerWampanoagLaag` hieronder)
// en tellen als "neutraal" zodra onthuld.
const WAMPANOAG_STREEK_INHOUD: Record<number, WampanoagInhoud> = {
  2: "maisboerderij",
  3: "tentje",
  4: "opperhoofdtent",
  5: "tentje",
  6: "beverjachthut",
};

// Initialiseert de Wampanoag-laag zodra de streek "in beeld" komt tijdens de
// Going West-openingsfase (streekOntgrendeling.ts:
// `verwerkStreekOntgrendeling`) — zelfde blokkerende opzet als
// `initialiseerBezetteStreek` (world.ts): `wampanoagBezet: true` houdt de
// streek `ontgrendeld: false` (issue: "Wampanoag streek blokkerend" — vóór
// deze wijziging ontgrendelde de streek juist gewoon normaal, zie de git-
// geschiedenis van dit bestand voor die eerdere, niet-blokkerende opzet). Net
// als bij de Bezette Streek worden alle negen vakjes verhuld, niet alleen de
// vijf uit `WAMPANOAG_STREEK_INHOUD` hierboven — elk vakje onthult zodra zijn
// eigen verkenning klaar is (`verwerkWampanoagVerkenningInGang`, wampanoag.ts
// — ook een tentje-vakje), maar de resterende vier "neutrale" vakjes
// onthullen daarnaast automatisch mee zodra de 3-3-3-handelsdrempel gehaald
// is (`verwerkWampanoagFaseAfsluiting`, wampanoag.ts), en zijn tot dan ook
// individueel al verkenbaar.
export function initialiseerWampanoagLaag(streek: Streek): Streek {
  return {
    ...streek,
    wampanoagBezet: true,
    tiles: streek.tiles.map((tile) => ({
      ...tile,
      wampanoagVerhuld: true,
      wampanoagInhoud: WAMPANOAG_STREEK_INHOUD[tile.positieInStreek],
    })),
  };
}

// Goudader/goudmijn-vondsten (hoofdstuk 3/14) — vast en niet-procedureel,
// net als TUTORIAL_GOUD in world.ts. Altijd op een heuvel/bergvakje (de
// gewone mijn-terreineis, zie `improvementPastOpTile` in improvements.ts).
// Streek 1 heeft, anders dan de tutorial (waar Goudader pas op streek 8
// verschijnt, zie GOUD_ONTDEKKING_STREEK in world.ts), meteen al een vondst
// op het berg-vakje (positie 8, GOING_WEST_TILE_TERREIN hierboven) — issue:
// "Going west campaign geen tutorial", "alle grondstoffen moeten in principe
// voorkomen op streek 1" (dus ook goud). De rest van de vondsten blijft
// verspreid over de canyon/mesa- en hooggebergte-zones waar heuvel/berg-
// vakjes veruit het talrijkst zijn.
const GOING_WEST_GOUD: Record<number, number[]> = {
  1: [8],
  11: [0],
  15: [1],
  19: [2],
  23: [1],
  27: [0],
  31: [6],
};

function goudVoorTile(hoogte: number, positieInStreek: number): boolean {
  return GOING_WEST_GOUD[hoogte]?.includes(positieInStreek) ?? false;
}

// Dreigingsniveau per streek (hoofdstuk 6) — zelfde MVP-placeholder-formule
// als de tutorial (`dreigingsniveauVoorStreek` in world.ts): exacte
// winkans-cijfers liggen nog niet vast (hoofdstuk 14), oplopend met de
// hoogte. Streek 1 is de startstreek en dus dreigingsvrij.
function dreigingsniveauVoorStreek(hoogte: number): number {
  return Math.max(0, (hoogte - 1) * 2);
}

function maakLegeTiles(hoogte: number): Tile[] {
  return Array.from({ length: BAND_WIDTH_TILES }, (_, positieInStreek) => ({
    positieInStreek,
    terrein: terreinVoorTile(hoogte, positieInStreek),
    status: "leeg" as const,
    versWater: versWaterVoorTile(hoogte, positieInStreek),
    goud: goudVoorTile(hoogte, positieInStreek),
  }));
}

// Zelfde tile-opzet als `maakStartStreek` in world.ts.
export const GOING_WEST_STARTSTAD_NAAM = "Plymouth";

function maakStartStreek(): Streek {
  const tiles = maakLegeTiles(1);
  tiles[STAD_POSITIE] = {
    positieInStreek: STAD_POSITIE,
    terrein: terreinVoorTile(1, STAD_POSITIE),
    status: "actief",
    heeftWeg: true,
    improvement: {
      id: "startkamp",
      naam: GOING_WEST_STARTSTAD_NAAM,
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

// De startwereld voor de Going West-campagne: streek 1 (startstad)
// ontgrendeld, de rest nog achter fog of war — zelfde opzet als
// `maakInitieleWereld` in world.ts, nog niet aangesloten op een daadwerkelijke
// run (zie modulekop).
export function maakInitieleWereldGoingWest(): Streek[] {
  return Array.from({ length: GOING_WEST_STREEK_AANTAL }, (_, i) =>
    i === 0 ? maakStartStreek() : maakVergrendeldeStreek(i + 1)
  );
}
