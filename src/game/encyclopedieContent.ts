// Encyclopedie (issue: "Boekwerk met uitleg" — "een encyclopedie ... waarin
// alle spelconcepten gewoon even duidelijk per lemma staan uitgelegd").
// Puur verklarende, statische content — geen nieuw spelmechanisme (blijft
// binnen de huidige bouwscope). Los van de bestaande dynamische uitleg-
// pop-ups (uitlegContent.ts/tutorialContent.ts, die één keer op het juiste
// moment verschijnen): dit is een naslagwerk dat de speler zelf altijd kan
// opzoeken, zowel vanuit het hoofdmenu (vóór een run) als tijdens het spelen
// (EncyclopediePaneel, bereikbaar via HoofdNavigatieScherm/HoofdMenu).
//
// Tutorial- en Going-West-specifieke weergavenamen (bv. "Goudader" vs.
// "Goudmijn", zie improvementNaam()/CampaignConfig.improvementNamen in
// campagnes.ts) beschrijven dezelfde onderliggende spelconcepten — de
// hoofdlemma's hieronder gebruiken daarom hun functionele (tutorial-)naam,
// niet de per-campagne flavor-tekst. Voor gebouwen waar de Going West-naam
// écht afwijkt (issue "Going west gebouwen in encyclopedie") staat er wél een
// eigen, kort lemma bij: alleen een verwijzing naar het bijbehorende
// tutorial-lemma, zodat een speler die "Blokhuis" opzoekt ook iets vindt.
// Zie `GOING_WEST_NAAM_LEMMAS` onderaan dit bestand.
//
// Categorie-indeling (issue vraagt: "is alfabetische volgorde het
// handigst?"): een encyclopedie met een handvol losse lemma's is prima
// alfabetisch te doorzoeken, maar zodra dit gaandeweg uitbreidt (zoals de
// trigger-comment al aankondigt) wordt een platte alfabetische lijst al snel
// een muur van tekst zonder houvast. Daarom hier een categorie-indeling
// (Stad, Streken, Boons, Grondstoffen, Gebouwen, Eenheden & acties, Cultuur &
// wetenschap, Militair) met alfabetische volgorde bínnen elke categorie, plus
// een zoekveld in EncyclopediePaneel voor snel opzoeken ongeacht categorie —
// het beste van beide.
import { BOON_POOL } from "./boons";
import { GOING_WEST_CAMPAGNE } from "./campagnes";
import { TECH_TREE, TechNode } from "./techTree";

export type EncyclopedieCategorie =
  | "Stad"
  | "Streken"
  | "Boons"
  | "Grondstoffen"
  | "Gebouwen"
  | "Eenheden & acties"
  | "Cultuur & wetenschap"
  | "Militair";

export const ENCYCLOPEDIE_CATEGORIEEN: EncyclopedieCategorie[] = [
  "Stad",
  "Streken",
  "Boons",
  "Grondstoffen",
  "Gebouwen",
  "Eenheden & acties",
  "Cultuur & wetenschap",
  "Militair",
];

export interface EncyclopedieLemma {
  id: string;
  titel: string;
  categorie: EncyclopedieCategorie;
  tekst: string;
}

// Techboom-lemma's (issue: "Techtree toevoegen aan encyclopedie") worden
// gegenereerd uit `TECH_TREE` zelf (techTree.ts) — dezelfde brondata die
// TechboomPaneel/TechKeuzePopup al gebruiken — in plaats van de namen en
// effecten hier los te dupliceren. Zo blijft de encyclopedie vanzelf in sync
// als de boom ooit verandert. `Object.values` behoudt hier de
// declaratievolgorde van `TECH_TREE` (drempel 1 → 2 → 3, ouder vóór kind) —
// bewust géén alfabetische sortering zoals de rest van deze categorie: bij
// een keuzeboom is de boomvolgorde (welke tech volgt op welke) veel
// bruikbaarder dan het alfabet.
const TECHBOOM_LEMMAS: EncyclopedieLemma[] = (Object.values(TECH_TREE) as TechNode[]).map((node) => ({
  id: `tech-${node.id}`,
  titel: node.tutorialNaam,
  categorie: "Cultuur & wetenschap",
  tekst: node.ouder
    ? `Technologieboom-drempel ${node.drempel}, een van de twee keuzes na ${TECH_TREE[node.ouder].tutorialNaam}. ${node.beschrijving}`
    : `Technologieboom-drempel ${node.drempel}, een van de twee startrichtingen. ${node.beschrijving}`,
}));

// Boon-lemma's (issue "Boons" — hoofdstuk in de encyclopedie): net als
// `TECHBOOM_LEMMAS` hierboven gegenereerd uit de brondata zelf (`BOON_POOL`,
// boons.ts) in plaats van hier los gedupliceerd, zodat een nieuwe Boon (issue
// #428/#431 laten al zien dat de pool groeit) vanzelf ook een encyclopedie-
// lemma krijgt. Alfabetisch op naam, zoals de rest van deze categorie buiten
// de techboom.
const BOON_LEMMAS: EncyclopedieLemma[] = [...BOON_POOL]
  .sort((a, b) => a.naam.localeCompare(b.naam))
  .map((boon) => ({
    id: `boon-${boon.id}`,
    titel: boon.naam,
    categorie: "Boons",
    tekst: boon.beschrijving,
  }));

// Alfabetisch bínnen elke categorie (zie de comment hierboven) — behalve de
// techboom-lemma's, zie de comment bij `TECHBOOM_LEMMAS`.
const BASE_LEMMAS: EncyclopedieLemma[] = [
  // Stad
  {
    id: "stad",
    titel: "Stad",
    categorie: "Stad",
    tekst:
      "Het centrum van je nederzetting, middenin elke streek. Hier komen je grondstoffen samen en bouw je stadsverbeteringen en eenheden.",
  },
  {
    id: "stad-stichten",
    titel: "Stad stichten",
    categorie: "Stad",
    tekst:
      "Een settler kan op een geschikt vakje aan vers water een nieuwe stad stichten. Dat kost grondstoffen en voedsel, en opent een nieuwe stadsepisode verderop.",
  },
  {
    id: "stadsgrootte",
    titel: "Stadsgrootte",
    categorie: "Stad",
    tekst:
      "Een stad groeit van klein naar middel naar groot zodra er genoeg voedsel is. Een grotere stad mag meer stadsverbeteringen tegelijk hebben, maar verbruikt ook meer voedsel per beurt.",
  },
  {
    id: "voedsel-game-over",
    titel: "Voedsel & game over",
    categorie: "Stad",
    tekst:
      "Voedsel heeft geen opslaglimiet, maar dreigt de voorraad binnen een paar beurten op te raken, dan wordt de stad 'kritiek'. Bereikt de voorraad nul, dan stort de stad in en eindigt de run.",
  },
  // Streken
  {
    id: "streken",
    titel: "Streken",
    categorie: "Streken",
    tekst:
      "De wereld bestaat uit een opeenvolging van streken, elk met 9 vakjes rond de stad. Genoeg cultuur ontgrendelt de volgende streek.",
  },
  {
    id: "frontier-streek",
    titel: "Frontier-streek",
    categorie: "Streken",
    tekst:
      "De hoogst ontgrendelde streek — hier kun je bouwen. Oudere streken blijven bestaan en produceren door, maar zijn niet langer de frontier.",
  },
  {
    id: "bezette-streek",
    titel: "Bezette streek",
    categorie: "Streken",
    tekst:
      "Een streek vol vijandelijke bouwwerken, verhuld tot je er een verkenner heen stuurt. Een vijandelijke wachttoren vraagt om een militaire confrontatie, een vijandelijk heiligdom om een missionaris.",
  },
  {
    id: "onrust",
    titel: "Onrust",
    categorie: "Streken",
    tekst:
      "Ontstaat zodra een streek meer dan vier gebouwen draagt — elk gebouw daarna verhoogt de onrust met 1 en verlaagt de productie van alle landverbeteringen op die streek. Gebouwen die volledig uitgeput zijn (ghost towns) tellen niet meer mee, dus onrust op oudere streken zakt vanzelf terug naarmate ze uitputten. Een wegverbonden Saloon verlaagt de onrust op zijn eigen streek met 1; een bemand, wegverbonden Courthouse houdt de onrust op zijn eigen streek en de 2 streken direct erboven blijvend op 0.",
  },
  // Boons
  {
    id: "boon",
    titel: "Boon",
    categorie: "Boons",
    tekst:
      "Een permanente, run-brede beloning die je krijgt bij elke stichting die de campagne niet afsluit, maar alleen als de stad die je net verlaat 'groot' was. Je trekt 'm willekeurig uit een pool, zonder terugleggen — dezelfde Boon krijg je dus nooit twee keer. Boons zijn stapelbaar (geen sloten zoals bij een relic) en blijven de rest van de run actief, ook als een latere stad instort. Niet beschikbaar in de tutorial.",
  },
  ...BOON_LEMMAS,
  // Grondstoffen
  {
    id: "resources",
    titel: "Resources",
    categorie: "Grondstoffen",
    tekst:
      "Hout, steen, erts en goud delen samen één opslaglimiet. Voedsel, cultuur en wetenschap zijn aparte voorraden zonder die limiet.",
  },
  {
    id: "erts",
    titel: "Erts",
    categorie: "Grondstoffen",
    tekst: "Bouwmateriaal uit een mijn, nodig voor zwaardere verbeteringen en voor het opleiden van een strijder.",
  },
  {
    id: "hout",
    titel: "Hout",
    categorie: "Grondstoffen",
    tekst:
      "Het meest gebruikte bouwmateriaal — via houtkap, of direct gehakt door je settler. Nodig voor vrijwel elke verbetering.",
  },
  {
    id: "steen",
    titel: "Steen",
    categorie: "Grondstoffen",
    tekst: "Bouwmateriaal uit een steengroeve, nodig voor de meeste land- en stadsverbeteringen.",
  },
  // Gebouwen
  {
    id: "goud-mijn",
    titel: "Goud mijn",
    categorie: "Gebouwen",
    tekst:
      "Een zeldzame variant van de mijn: alleen te bouwen op een heuvel- of bergvakje met een goudader-vondst. Levert goud in plaats van erts.",
  },
  {
    id: "aquaduct",
    titel: "Aquaduct",
    categorie: "Gebouwen",
    tekst:
      "Civiele stadsverbetering die de voedseldrempel om van middel naar groot te groeien verlaagt. Pas te bouwen vanaf een stad van middelgrote omvang.",
  },
  {
    id: "barakken",
    titel: "Barakken",
    categorie: "Gebouwen",
    tekst:
      "Militaire stadsverbetering die de hele stad een vaste legerwaarde-bonus geeft bij een militaire confrontatie, zonder dat daar een strijder voor bemand hoeft te zijn. Pas te bouwen vanaf een stad van middelgrote omvang.",
  },
  {
    id: "bibliotheek",
    titel: "Bibliotheek",
    categorie: "Gebouwen",
    tekst: "Wetenschappelijke stadsverbetering, levert wetenschap per beurt.",
  },
  {
    id: "boerderij",
    titel: "Boerderij",
    categorie: "Gebouwen",
    tekst: "Landverbetering op vlakke grond, levert voedsel per beurt. Raakt na verloop van tijd uitgeput.",
  },
  {
    id: "bouwen",
    titel: "Bouwen",
    categorie: "Gebouwen",
    tekst:
      "Land- en stadsverbeteringen kosten grondstoffen en een aantal beurten om te voltooien. Een landverbetering moet daarna ook nog via een weg met de stad verbonden zijn voordat hij echt produceert.",
  },
  {
    id: "courthouse",
    titel: "Courthouse",
    categorie: "Gebouwen",
    tekst:
      "Civiele landverbetering (Going West), duurder dan de Saloon. Bouwbaar zonder voorwaarde, maar heeft pas effect zodra een opgeleide rechter er zitting neemt én de tile wegverbonden is — houdt dan de onrust op zijn eigen streek en de 2 streken direct erboven blijvend op 0, zolang bemand.",
  },
  {
    id: "grote-tempel",
    titel: "Grote Tempel",
    categorie: "Gebouwen",
    tekst:
      "Tweede culturele stadsverbetering naast de Tempel, levert extra cultuur per beurt. Pas te bouwen vanaf een grote stad, en samen met vijf actieve heiligdommen een voorwaarde voor het Offeraltaar.",
  },
  {
    id: "grote-woonwijk",
    titel: "Grote Woonwijk",
    categorie: "Gebouwen",
    tekst:
      "Civiele stadsverbetering die de stad van middelgrote naar grote omvang laat groeien, zodra de bijbehorende (hogere) voedseldrempel is bereikt.",
  },
  {
    id: "heiligdom",
    titel: "Heiligdom",
    categorie: "Gebouwen",
    tekst:
      "Culturele landverbetering, levert cultuur per beurt. Blijft, anders dan de meeste andere landverbeteringen, permanent actief.",
  },
  {
    id: "hout-kap",
    titel: "Hout kap",
    categorie: "Gebouwen",
    tekst: "Landverbetering op een bosvakje, levert elke beurt hout op tot het bos uitgeput raakt.",
  },
  {
    id: "land-improvements",
    titel: "Land improvements",
    categorie: "Gebouwen",
    tekst:
      "Verbeteringen die je op een los vakje binnen een streek plaatst, zoals boerderij, mijn en wachttoren. De meeste hebben een terrein-eis en putten na verloop van tijd uit.",
  },
  {
    id: "markt",
    titel: "Markt",
    categorie: "Gebouwen",
    tekst: "Economische stadsverbetering, levert goud per beurt.",
  },
  {
    id: "mijn",
    titel: "Mijn",
    categorie: "Gebouwen",
    tekst: "Landverbetering op een heuvel of berg, levert erts per beurt tot hij uitgeput raakt.",
  },
  {
    id: "offeraltaar",
    titel: "Offeraltaar",
    categorie: "Gebouwen",
    tekst:
      "Culturele landverbetering die de missionaris ontgrendelt. Vereist eerst meerdere heiligdommen en een uitgebouwde stad met een Grote Tempel.",
  },
  {
    id: "opslagplaats",
    titel: "Opslagplaats",
    categorie: "Gebouwen",
    tekst:
      "Economische stadsverbetering die de gedeelde opslag-cap verhoogt. Herhaalbaar: elke voltooide Opslagplaats telt opnieuw mee.",
  },
  {
    id: "saloon",
    titel: "Saloon",
    categorie: "Gebouwen",
    tekst:
      "Goedkope civiele landverbetering (Going West) die, zodra wegverbonden, de onrust op zijn eigen streek met 1 vermindert.",
  },
  {
    id: "smederij",
    titel: "Smederij",
    categorie: "Gebouwen",
    tekst:
      "Economische stadsverbetering die elke beurt erts omzet in gereedschap, zolang er genoeg erts voorradig is.",
  },
  {
    id: "stad-improvements",
    titel: "Stad improvements",
    categorie: "Gebouwen",
    tekst:
      "Gebouwen die de stad zelf verbetert, zoals bibliotheek, markt, barakken en tempel — los van de streken-band. Een stad mag er, afhankelijk van haar stadsgrootte, maar een beperkt aantal tegelijk van hebben.",
  },
  {
    id: "steengroeve",
    titel: "Steengroeve",
    categorie: "Gebouwen",
    tekst: "Landverbetering op een heuvel of berg, levert steen per beurt tot hij uitgeput raakt.",
  },
  {
    id: "sterrencirkel",
    titel: "Sterrencirkel",
    categorie: "Gebouwen",
    tekst: "Wetenschappelijke landverbetering, levert wetenschap per beurt — de sleutel tot de technologieboom.",
  },
  {
    id: "tempel",
    titel: "Tempel",
    categorie: "Gebouwen",
    tekst: "Culturele stadsverbetering, levert cultuur per beurt. Pas te bouwen vanaf een stad van middelgrote omvang.",
  },
  {
    id: "woonwijk",
    titel: "Woonwijk",
    categorie: "Gebouwen",
    tekst:
      "Civiele stadsverbetering die de stad van kleine naar middelgrote omvang laat groeien, zodra er genoeg voedsel is.",
  },
  // Eenheden & acties
  {
    id: "hout-hakken",
    titel: "Hout hakken",
    categorie: "Eenheden & acties",
    tekst:
      "Een directe actie van je settler op een bosvakje: een kleine, meteen beschikbare hoeveelheid hout, zonder dat je er een houtkap voor hoeft te bouwen.",
  },
  {
    id: "jagen",
    titel: "Jagen",
    categorie: "Eenheden & acties",
    tekst:
      "Je settler kan op een kudde jagen voor voedsel. Daarbij is er een kans dat er een roofdier verschijnt op datzelfde vakje.",
  },
  {
    id: "rechter",
    titel: "Rechter",
    categorie: "Eenheden & acties",
    tekst:
      "Trainbare eenheid (Going West) die aan een Courthouse toegewezen kan worden om onrust op die streek en de 2 streken direct erboven te onderdrukken — zelfde bemannings-patroon als een strijder op een wachttoren: instant en omkeerbaar.",
  },
  {
    id: "roofdieren",
    titel: "Roofdieren",
    categorie: "Eenheden & acties",
    tekst:
      "Verschijnen soms nadat je hebt gejaagd. Vallen een beurt later aan — staat je settler er dan nog op, dan sterft hij.",
  },
  {
    id: "settler",
    titel: "Settler",
    categorie: "Eenheden & acties",
    tekst:
      "Je verkennende eenheid: kan zich verplaatsen, een weg aanleggen, jagen, hout hakken, of een nieuwe stad stichten. Doet hoogstens één actie per beurt.",
  },
  {
    id: "weg",
    titel: "Weg",
    categorie: "Eenheden & acties",
    tekst:
      "Een landverbetering produceert pas zodra zijn vakje via een keten van wegen met de stad verbonden is. Je settler legt een weg aan als losse actie.",
  },
  // Cultuur & wetenschap
  {
    id: "cultuur",
    titel: "Cultuur",
    categorie: "Cultuur & wetenschap",
    tekst: "Voortgangs-valuta zonder opslaglimiet, geproduceerd door heiligdommen en tempels. Ontgrendelt nieuwe streken.",
  },
  {
    id: "wetenschap",
    titel: "Wetenschap",
    categorie: "Cultuur & wetenschap",
    tekst:
      "Voortgangs-valuta zonder opslaglimiet, geproduceerd door de sterrencirkel en bibliotheek. Ontgrendelt technologieën in de technologieboom.",
  },
  {
    id: "technologieboom",
    titel: "Technologieboom",
    categorie: "Cultuur & wetenschap",
    tekst:
      "Een vertakkende keuzeboom van 3 drempels, elk met 2 opties. Bij het bereiken van een drempel kies je één van de twee getoonde technologieën; de niet-gekozen tech en alles wat daaronder in de boom hing, is voor de rest van de run permanent onbereikbaar. Elke volgende drempel kost meer wetenschap dan de vorige.",
  },
  ...TECHBOOM_LEMMAS,
  // Militair
  {
    id: "dreiging",
    titel: "Dreiging",
    categorie: "Militair",
    tekst:
      "De tegenstandersterkte van een streek, waar je legerwaarde bij een militaire confrontatie tegenover komt te staan. Loopt op naarmate je verder de frontier op trekt — een streek dicht bij huis is een stuk overzichtelijker dan eentje ver weg.",
  },
  {
    id: "legerkamp",
    titel: "Legerkamp",
    categorie: "Militair",
    tekst:
      "Militaire landverbetering waaraan je strijders kunt toewijzen. Elke toegewezen strijder telt mee als legerwaarde bij een confrontatie tegen een bezette streek.",
  },
  {
    id: "legerwaarde",
    titel: "Legerwaarde",
    categorie: "Militair",
    tekst:
      "Je totale militaire kracht: elke opgeleide strijder telt mee, aangevuld met een bonus van bemande, voltooide en wegverbonden wachttorens en een vaste stad-brede bonus zodra je barakken hebt voltooid. Hoe hoger je legerwaarde tegenover de dreiging van een streek, hoe groter je winkans bij een militaire confrontatie.",
  },
  {
    id: "militaire-confrontatie",
    titel: "Militaire confrontatie",
    categorie: "Militair",
    tekst:
      "Een vergelijking van je legerwaarde tegen de dreiging op een streek. Geeft een winkans in plaats van een gegarandeerde uitkomst — winst levert soms buit op, verlies schade aan getroffen tiles.",
  },
  {
    id: "missionaris",
    titel: "Missionaris",
    categorie: "Militair",
    tekst:
      "Culturele eenheid, pas op te leiden na een voltooid offeraltaar. Stuur hem naar een vijandelijk heiligdom om het te veroveren in plaats van te vernietigen.",
  },
  {
    id: "strijder",
    titel: "Strijder",
    categorie: "Militair",
    tekst: "Opgeleide militaire eenheid. Kan een wachttoren of een legerkamp bemannen, of meetellen in je legerwaarde.",
  },
  {
    id: "wachttoren",
    titel: "Wachttoren",
    categorie: "Militair",
    tekst:
      "Militaire landverbetering: geeft verdediging bij een militaire confrontatie en beschermt de streek tegen indringers-tribuut — maar alleen zolang hij bemand is met een strijder.",
  },
  {
    id: "winkans",
    titel: "Winkans",
    categorie: "Militair",
    tekst:
      "Bij een militaire confrontatie bepaalt de verhouding tussen je legerwaarde en de dreiging van de streek je winkans: hoe groter je overwicht, hoe hoger die kans. Een confrontatie blijft altijd kansspel — zelfs een overmachtig leger wint niet gegarandeerd, en een zwak leger houdt altijd een kleine kans.",
  },
];

// Going West-gebouwen met een afwijkende naam (issue "Going west gebouwen in
// encyclopedie"): sleutel is de bijbehorende `BASE_LEMMAS`-id, waarde het
// `Improvement.id` waaronder `CampaignConfig.improvementNamen`
// (campagnes.ts) de Going West-naam voert. Alleen gebouwen (land-/
// stadsverbeteringen) — Verkenner/Missionaris zijn eenheden en blijven hier
// dus buiten beeld, de issue vraagt specifiek naar gebouwen.
const GOING_WEST_GEBOUW_NAAM_BRON: { lemmaId: string; improvementId: string }[] = [
  { lemmaId: "sterrencirkel", improvementId: "sterrencirkel" },
  { lemmaId: "goud-mijn", improvementId: "goudmijn" },
  { lemmaId: "wachttoren", improvementId: "wachttoren" },
  { lemmaId: "legerkamp", improvementId: "legerkamp" },
  { lemmaId: "heiligdom", improvementId: "heiligdom" },
  { lemmaId: "offeraltaar", improvementId: "offer-altaar" },
  { lemmaId: "markt", improvementId: "markt" },
  { lemmaId: "opslagplaats", improvementId: "opslagplaats" },
  { lemmaId: "bibliotheek", improvementId: "bibliotheek" },
  { lemmaId: "barakken", improvementId: "barakken" },
  { lemmaId: "tempel", improvementId: "tempel" },
  { lemmaId: "grote-tempel", improvementId: "grote-tempel" },
  { lemmaId: "woonwijk", improvementId: "woonwijk" },
  { lemmaId: "grote-woonwijk", improvementId: "grote-woonwijk" },
];

// Puur een verwijzing naar het tutorial-lemma (issue vraagt expliciet "gewoon
// met een verwijzing naar het gebouw in de tutorial"), geen dubbele uitleg —
// zo blijft er één bron van waarheid voor het spelconcept zelf. Haalt de
// Going West-naam live uit `GOING_WEST_CAMPAGNE.improvementNamen` in plaats
// van 'm hier te dupliceren, en slaat automatisch over zodra een naam ooit
// gelijk zou worden aan de tutorial-naam (dan is een apart lemma overbodig).
const GOING_WEST_NAAM_LEMMAS: EncyclopedieLemma[] = GOING_WEST_GEBOUW_NAAM_BRON.flatMap(({ lemmaId, improvementId }) => {
  const basisLemma = BASE_LEMMAS.find((lemma) => lemma.id === lemmaId)!;
  const goingWestNaam = GOING_WEST_CAMPAGNE.improvementNamen?.[improvementId];
  if (!goingWestNaam || goingWestNaam === basisLemma.titel) return [];
  return [
    {
      id: `going-west-${lemmaId}`,
      titel: goingWestNaam,
      categorie: basisLemma.categorie,
      tekst: `Going West-naam voor de ${basisLemma.titel} — zie dat lemma voor de volledige uitleg.`,
    },
  ];
});

export const ENCYCLOPEDIE_LEMMAS: EncyclopedieLemma[] = [...BASE_LEMMAS, ...GOING_WEST_NAAM_LEMMAS];
