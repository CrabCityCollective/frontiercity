// Tutorial-content (M8, hoofdstuk 10 & 13): de vastgelegde mechaniek-volgorde
// en flavor-teksten voor streken 1-14 van "De Eerste Vuren" (Het Hertenpad-volk)
// — 14 in plaats van de oorspronkelijke 13 sinds "jagen en farmen omdraaien"
// de Boerderij een eigen streek gaf.
// De mechanieken zelf zijn al gebouwd in M1-M7 — dit bestand voegt alleen de
// vaste, geschreven inhoud toe die per streek hoort (geen nieuwe systemen).
//
// Flavor-tekststijlgids (hoofdstuk 9): korte, vaak enkelvoudige zinnen, geen
// emotie-bijvoeglijke naamwoorden, geen moreel oordeel, concreet/zintuiglijk
// boven abstract, herhaling als stijlmiddel toegestaan, stiltes toegestaan.
//
// Streek 10 ("Zeldzaamheid") en de framing van streek 11/12 als "gescript,
// ongevaarlijk" horen bij post-MVP-uitbreidingen (hoofdstuk 13: geen
// zeldzaamheid, geen aparte tutorial-veilige verval-variant in de MVP) — de
// flavor-tekst hieronder zet de sfeer alvast neer zonder een apart systeem te
// bouwen dat later weer weggegooid moet worden.

export interface StreekContent {
  naam: string;
  mechaniek: string;
  flavorTekst: string;
}

// Streek-indeling herschikt (issue: "jagen en farmen omdraaien"): de jacht is
// nu vanaf streek 1 de eerste voedselbron (in plaats van de boerderij), en de
// boerderij krijgt een eigen, latere streek — één streek méér dan de
// oorspronkelijke 13, want de boerderij vervangt geen bestaande streek, ze
// komt er echt bij. Wetenschap/Sterrencirkel (voorheen streek 3) en alles
// daarna schuift daardoor een streek op.
//
// Streek 2/3 nogmaals herschikt (issue: "Tweede streek boerderij"): streek 2
// bleek qua voedsel niet haalbaar met alleen de jacht als bron zolang de
// Boerderij pas op streek 3 kwam — zeker zodra daar ook meteen een
// voedsel-etende Wachttoren bij kon komen. De Boerderij schuift daarom naar
// streek 2, en Wachttoren/Mijn/indringers (voorheen allemaal streek 2, zie
// improvements.ts en indringersEnDieren.ts) schuiven samen naar streek 3 —
// Houtkap blijft op streek 2. Het totaal blijft 14 streken; alleen de
// mechaniek-inhoud van streek 2 en 3 is omgewisseld, geen nieuwe streek.
export const TUTORIAL_STREEK_CONTENT: Record<number, StreekContent> = {
  1: {
    naam: "De Oevervlakte",
    mechaniek: "Jagen, voedselbalans, heiligdom en steengroeve",
    flavorTekst: "Water aan de ene kant, gras aan de andere. Er is maar 1 richting: voorwaarts.",
  },
  2: {
    naam: "Het Akkerland",
    mechaniek: "Houtkap en de boerderij",
    flavorTekst: "Vlak land, tot aan de horizon. Genoeg om meer te zaaien dan de jacht alleen ooit kon voeden.",
  },
  3: {
    naam: "Het Rietmoeras",
    mechaniek: "Wachttoren, mijnbouw en verdedigen tegen indringers",
    flavorTekst:
      "De wereld bleek wreder dan gedacht. Maar het Goddelijke Licht dan wel de Menselijke Speer zal blijven staan.",
  },
  4: {
    naam: "De Bosrand",
    mechaniek: "Wetenschap en de techtree",
    flavorTekst: "We zijn al van ver gekomen. Hoewel, als we op de heuvel staan, kunnen we het kamp nog zien.",
  },
  5: {
    naam: "Het Loofbos",
    mechaniek: "Grotere kuddes",
    flavorTekst: "De kuddes trekken hier dieper het bos in. De jacht gaat gewoon door, verder van het kamp.",
  },
  6: {
    naam: "De Heuvelvoet",
    mechaniek: "Diepere jachtgronden",
    flavorTekst: "De heuvels bieden schuilplekken — voor de kuddes, en voor wat hen al sinds het begin volgt.",
  },
  7: {
    naam: "De Heuvels",
    mechaniek: "De stad groter laten groeien",
    flavorTekst: "De heuvels bieden eindelijk ruimte. Groter worden kan — meer monden om te voeden ook.",
  },
  8: {
    naam: "De Rotsrichel",
    mechaniek: "Amber en Mijnbouw",
    flavorTekst: "Het mooiste materiaal ooit gezien, het trekt ook de verkeerde mensen aan.",
  },
  9: {
    naam: "De Hooggebergte-voet",
    mechaniek: "Kennis en technologie",
    flavorTekst: "Aan de voet van het hooggebergte ligt de lucht al dunner. Wie hier kijkt, ziet verder dan ooit.",
  },
  10: {
    naam: "Het Naaldwoud",
    mechaniek: "Dieper de wildernis in",
    flavorTekst: "In het naaldwoud fluistert men over bomen ouder dan het Hertenpad-volk zelf.",
  },
  11: {
    naam: "De Boomgrens",
    mechaniek: "Nog eens groeien: van middel naar groot",
    flavorTekst:
      "Boven de boomgrens is er minder beschutting, maar wel meer land. Groter worden is hier een keuze, geen vanzelfsprekendheid.",
  },
  12: {
    naam: "De Besneeuwde Flank",
    mechaniek: "Een tweede amberader",
    flavorTekst: "Onder de sneeuw glinstert iets dat we al kennen. Een tweede ader, dieper dan de eerste.",
  },
  13: {
    naam: "De Bergkam",
    mechaniek: "Een vijandige stam overnemen (cultureel/militair)",
    flavorTekst:
      "Vanaf de bergkam zagen we ons einddoel: de oceaan. We laten niemand heel die tussen ons en ons doel komt te staan.",
  },
  // Laatste streek van de tutorial (issue: "tutorial laatste stad aan
  // oceaan") — de oceaan aan de overkant, precies de win-conditie uit
  // hoofdstuk 1 van het design-document, hier alvast voelbaar gemaakt aan
  // het eind van de tutorial-tocht. De enige streek met vers water (zie
  // world.ts `TUTORIAL_VERS_WATER`), en dus de enige plek waar de laatste
  // stad gesticht kan worden.
  14: {
    naam: "De Oceaanoever",
    mechaniek: "Stad stichten aan het vers water",
    flavorTekst:
      "Het land houdt hier op. Aan de voet van de oever ligt weer vers water, voor het eerst sinds de rivier bij Holenrots.",
  },
};

// Afsluitende scène na de laatste streek (hoofdstuk 10: "Na de laatste streek:
// afsluitende scène..."). Het openen van het campagnemenu valt buiten de MVP
// (alleen tutorial-content is speelbaar, hoofdstuk 13) — deze tekst sluit de
// tutorial-run zelf af, zonder naar een systeem te verwijzen dat nog niet bestaat.
export const AFSLUITENDE_SCENE =
  "Bij de oceaan staat Holenrots nog overeind, vele streken daaronder. De vuren branden. Verder is er, voor nu, niets te zeggen.";

// Stichtings-waarschuwing (hoofdstuk 2/10/16, issue: "stad stichten op de
// frontier" deel 4): getoond vóór de speler bevestigt — de settler verdwijnt
// definitief bij het stichten ("de huifkar wordt de stad"), dus dit moet
// duidelijk zijn vóór de onomkeerbare klik, niet erna.
export const STICHT_STAD_TITEL = "Hier een nieuwe stad stichten?";
export const STICHT_STAD_WAARSCHUWING =
  "De huifkar komt tot stilstand. De wielen zakken weg in de oever. Dit wordt de plek.\n\n" +
  "Let op: de settler verdwijnt hierbij. Er is geen weg terug — als je hier sticht, is er geen settler meer om verder te trekken, tenzij je er later een nieuwe uitrust.";

// Afsluitende scène na het stichten (hoofdstuk 2/10/16): vervangt de
// streek-12-afsluiting hierboven als het echte tutorial-einddoel — "je eerste
// stad stichten op de frontier" (issue-titel) is precies waar het spel zijn
// naam aan ontleent.
export const STICHTING_AFSLUITENDE_SCENE =
  "De huifkar wordt de stad. Vuurbron, noemen ze het, voor het vuur dat er die avond voor het eerst brandt.\n" +
  "Holenrots ligt nu ver onder hen, stil, achtergelaten maar niet vergeten.\n" +
  "Het Hertenpad-volk is niet langer op doortocht. Het is aangekomen — voor nu.";

export function streekContent(hoogte: number): StreekContent | undefined {
  return TUTORIAL_STREEK_CONTENT[hoogte];
}

// Wachttoren-overal-uitleg-pop-up (issue: "meer uitleg", vervolgvraag: "wachttorens
// mag je als enige op alle laag bouwen ... dat komt ook omdat indringers soms je
// wachttoren kunnen vernietigen op een oudere laag"): getoond zodra streek 3 voor
// het eerst ontgrendelt (zie GameRoot: `toonWachttorenOveralUitlegPopup` — was
// streek 2 vóór issue "Tweede streek boerderij", zie improvements.ts:
// `MILITAIR_LAND_IMPROVEMENTS[0].minStreek`) — dat is hetzelfde moment als
// VIJAND_AAN_DE_HORIZON_* hierboven, dat de Wachttoren al kort als
// uitzondering noemt. Deze pop-up legt de uitzondering zelf uit, en vooral de
// reden erachter (`bouwbaarBuitenFrontier` in improvements.ts, en
// `WACHTTOREN_OVERROMPELD_TEKST` verderop in dit bestand voor het gevolg als je
// een oudere streek onbewaakt laat).
export const WACHTTOREN_OVERAL_UITLEG_TITEL = "De wachttoren kun je overal bouwen";
export const WACHTTOREN_OVERAL_UITLEG_TEKST =
  "De meeste gebouwen komen alleen op de frontier. De wachttoren niet: die zet je neer op elke streek die je al ontgrendeld hebt, ook ver achter je. Reden: indringers kiezen niet altijd de frontier als doelwit, soms zoeken ze een oudere streek uit. Een wachttoren beschermd zijn eigen streek tegen indringers, en ook de streek precies eronder..";

// Voedsel-balans-uitleg-pop-up (issue: "meer uitleg", vervolgvraag: "voedsel komt
// van 2 bronnen ... die zijn te optimaliseren met wetenschap ... er zijn ook 2
// afnemers ... door het groeien van je stad en het aantal wachttorens wordt het
// steeds lastiger om voedsel te managen"; volgorde omgedraaid, issue: "jagen en
// farmen omdraaien"; tekst en trigger vervangen, issue: "genoeg hout om ook
// boerderij te bouwen" — de eerdere tekst ("Eén bron, één mond") verscheen
// meteen bij de start, nog vóórdat er een kudde te zien was; deze versie
// verschijnt pas zodra de gegarandeerde startkudde daadwerkelijk verschenen is
// (zie GameRoot: `toonVoedselBalansUitlegPopup`, `state.eersteKuddeVerschenen`
// in indringersEnDieren.ts), direct ná de bijbehorende kudde-pop-up. De
// boerderij komt pas op streek 2 (issue: "Tweede streek boerderij" — was
// streek 3, zie BOERDERIJ_KLAAR_TITEL/-TEKST hieronder, die op dat moment de
// balans naar twee bronnen uitbreidt); wachttorens volgen pas op streek 3.
export const VOEDSEL_BALANS_UITLEG_TITEL = "Voedsel verzamelen";
export const VOEDSEL_BALANS_UITLEG_TEKST =
  "De stad heeft dringend voedsel nodig. Iedere beurt heeft de stad 2 voedsel nodig om te overleven. Wanneer de voedselvoorraad op 0 is gekomen, is het game over. Je krijgt een waarschuwing 5 beurten voordat dit gebeurt. Voor nu kunnen we jagen op de kudde om te overleven. Je kunt een aantal beurten jagen voordat de kudde weer wegtrekt.";

// Settler-acties-uitleg-pop-up (issue: "meer uitleg", vervolgvraag: "de settler
// bouwt wegen, jaagt en hakt hout ... maar voor het bouwen hoeft de settler niet
// aanwezig te zijn"): getoond zodra de settler in beurt 2 verschijnt (zie
// GameRoot: `toonSettlerActiesUitlegPopup`), net als SETTLER_UITLEG_* hierboven
// — maar op de laagste prioriteit in de pop-up-volgorde, dus hij verschijnt pas
// als er verder niets anders te melden is. Legt de drie losse settler-acties
// (wegaanleg, jacht, houtkap — `acties.ts`: `legWegAan`/`jaag`/`hakHout`) naast
// elkaar, en het punt dat verrast: bouwen zelf (`startBouw`, infrastructuurEnBouw.ts)
// controleert nergens waar de settler staat.
export const SETTLER_ACTIES_UITLEG_TITEL = "De settler";
export const SETTLER_ACTIES_UITLEG_TEKST =
  "Behalve wegen aanleggen kan de settler ook jagen op wild en hout hakken in een bos. Iedere actie en iedere stap kost hem 1 beurt. Voor het bouwen is de settler niet nodig, alleen voor de weg ernaartoe.";

// Beurtensysteem-uitleg-pop-up (issue: "meer uitleg", vervolgvraag: "het
// beurten systeem: iedere beurt worden resources berekend: hoeveel heb je
// nodig voor bouwen van nieuwe gebouwen, hoeveel komt er binnen"): getoond
// zodra beurt 2 begint (zie GameRoot: `toonBeurtensysteemUitlegPopup`) — dat
// is het eerste moment waarop er al een volledige beurt is doorgerekend (zie
// economie.ts `volgendeBeurt`), zodat de speler al iets heeft zien
// veranderen om de uitleg aan op te hangen. Zelfde laagste prioriteit als
// SETTLER_ACTIES_UITLEG_* hierboven.
export const BEURTENSYSTEEM_UITLEG_TITEL = "De grondstoffen economie";
export const BEURTENSYSTEEM_UITLEG_TEKST =
  "Elke beurt wordt berekend welke bouwmaterialen nodig zijn voor een gebouw in aanbouw. Tegelijk komt er nieuwe materiaal binnen: hout, steen, erts. Zo groeit of slinkt de voorraad, beurt na beurt.";

// Bezette-Streek-uitleg-pop-up (hoofdstuk 6, issue: "De Bezette Streek,
// missionaris en verkenner", Deel 2, herzien door "Bezette streek scherm"),
// getoond zodra streek 13 "in beeld komt" (dezelfde soort trigger als de
// gegarandeerde Amberader-vondst op streek 8), direct na de gewone
// streek-pop-up hierboven — vervangt de eerdere, kleinere MILITAIR_UITLEG_*-
// pop-up volledig.
export const BEZETTE_STREEK_TITEL = "De Bergkam is bezet";
export const BEZETTE_STREEK_TEKST =
  "Op de bergkam staan een wachttoren en een heiligdom die niet van het Hertenpad-volk zijn — en her en der een verlaten huisje. Hier kun je niet zomaar bouwen, en cultuur werkt hier anders: ze stapelt niet meer op zolang deze streek bezet blijft. Klik op een verhuld vakje om er een verkenner heen te sturen. Klik op het vijandelijke heiligdom om er een Missionaris heen te sturen — die laat een wololo-meter vollopen die het heiligdom uiteindelijk van jou maakt. Klik op de vijandelijke wachttoren voor een Confrontatie — daarvoor heb je eerst een eigen legerkamp op de streek eronder nodig. Pas als zowel het heiligdom veroverd als de wachttoren opgeruimd is, gaat de bergkam open voor je settler en voor nieuwe bebouwing.";

// Vijandelijk-Heiligdom-onthuld-/veroverd-pop-up (Deel 4, herzien door
// "Bezette streek scherm") — zelfde blokkerende overlay als hierboven, maar
// twee losse momenten van dezelfde dreiging (zelfde patroon als
// ROOFDIER_VERSCHENEN_*/ROOFDIER_AANVAL_* hieronder).
export const VIJANDELIJK_HEILIGDOM_ONTHULD_TITEL = "Een vijandelijk heiligdom";
export const VIJANDELIJK_HEILIGDOM_ONTHULD_TEKST =
  "Verkenning heeft een heiligdom blootgelegd dat niet het onze is. Stuur er een Missionaris heen om een wololo-meter voor dit heiligdom te laten vollopen — zonder een Missionaris die hierheen gestuurd is, gebeurt er niets. Meer Missionarissen op hetzelfde heiligdom laten de meter sneller vollopen.";
export const VIJANDELIJK_HEILIGDOM_VEROVERD_TITEL = "Het heiligdom is van ons";
export const VIJANDELIJK_HEILIGDOM_VEROVERD_TEKST =
  "De wololo-meter is vol. Het vreemde heiligdom is nu een van de onze — het levert cultuur op zodra het wegverbonden is.";

// Oceaan-uitleg-pop-up (issue: "tutorial laatste stad aan oceaan"), getoond
// zodra de laatste streek (de oceaan aan de overkant) bereikt is, direct na de
// gewone streek-pop-up hierboven — zelfde eenmalige-uitleg-patroon als
// BEZETTE_STREEK_* hierboven. Dit is de enige streek met vers water in de hele
// tutorial, en dus de enige plek waar de laatste stad gesticht kan worden;
// deze tekst maakt dat expliciet, samen met het feit dat stichten hier de run
// beëindigt (zie ook STICHT_STAD_WAARSCHUWING hieronder voor de
// bevestigingsstap zelf).
export const OCEAAN_UITLEG_TITEL = "De oceaan aan de overkant";
export const OCEAAN_UITLEG_TEKST =
  "Hier houdt het land op. Voor het eerst sinds Holenrots ligt er weer vers water binnen bereik — de enige plek in de hele tocht. Breng de settler naar het vakje aan het water en kies daar 'Stad stichten' in het settler-paneel. Zodra die stad er staat, eindigt deze tocht.";

// Settler-uitleg-pop-up (M10, hoofdstuk 16: settler-mechaniek + bouw-ritme),
// getoond zodra de settler in beurt 2 verschijnt. Zelfde eenmalige-confirm-
// patroon als BEZETTE_STREEK_* hierboven.
export const SETTLER_UITLEG_TITEL = "Wegen bouwen";
export const SETTLER_UITLEG_TEKST =
  "We moeten eerst een weg naar onze gebouwen aanleggen, anders bereiken de grondstoffen de voorraad niet. Gebruik de settler om een weg aan te leggen van de stad naar de steengroeve.";

// Tutorial-voltooid-pop-up (issue: "pop-up met een summary van wat je
// geleerd hebt"), getoond zodra een nieuwe stad gesticht is (hoofdstuk
// 9/10/16, issue: "stad stichten op de frontier" — vervangt "confrontatie op
// streek 12 gewonnen" als trigger). De samenvatting zelf doorloopt
// `TUTORIAL_STREEK_CONTENT` hierboven in plaats van een tweede
// streek→mechaniek-lijst bij te houden die uit de pas kan lopen.
export const TUTORIAL_VOLTOOID_TITEL = "De Eerste Vuren — voltooid";
export const TUTORIAL_VOLTOOID_INTRO =
  "Het Hertenpad-volk heeft een nieuwe stad gesticht. Onderweg hierheen is geleerd:";

// Introscherm (issue: "intro en game over scherm", tekst bijgewerkt in issue
// "tutorial popups wijzigen"), getoond vóór streek 1 — zet de tutorial-sfeer
// neer voordat er iets van de mechaniek in beeld komt.
export const INTRO_TITEL = "To the Elusive Coast";
export const INTRO_SUBTITEL = "tutorial";
export const INTRO_FLAVOR_TEKST =
  "Onze voorouders hebben aons lang op deze kust gewoond, maar de tijd is aangebroken om het binnenland in te trekken, op zoek naar nieuw land. (let op, deze tutorial is niet makkelijk)";

// Voedselwaarschuwing-pop-up (issue: "uitleg pop-ups dynamisch tonen" —
// vervangt de vroegere vaste beurt-3-pop-up): getoond zodra de stad voor het
// eerst "kritiek" wordt (zie economie.ts `verwerkVerval`) — dynamisch op het
// moment dat de voedseldreiging zich voordoet, in plaats van op een vast
// beurtnummer. Tekst wijst naar de jacht (issue: "jagen en farmen omdraaien"
// — dit kan al op streek 1 triggeren, ruim vóór de Boerderij op streek 2
// bestaat, issue: "Tweede streek boerderij"), met de boerderij als aanvulling
// zodra die er wél al staat.
export const VOEDSEL_WAARSCHUWING_TITEL = "De voorraad slinkt";
export const VOEDSEL_WAARSCHUWING_TEKST =
  "De bodem van de voedselvoorraad komt behoorlijk dichtbij. Als het voedsel op, verlaat de stam het kamp, en gaat iedereen op zijn houtje de wildernis in. Jaag met de settler op een kudde voor snel voedsel. Staat er al een boerderij, zorg dan dat hij met een weg verbonden blijft.";

// Boerderij-klaar-uitleg-pop-up (issue: "uitleg pop-ups dynamisch tonen",
// tekst bijgewerkt in issue "tutorial popups wijzigen", nogmaals in "jagen en
// farmen omdraaien", en nogmaals in "Tweede streek boerderij"): getoond zodra
// er voor het eerst een actieve, wegverbonden boerderij meeproduceert (zie
// economie.ts `heeftWerkendeBoerderij`) — dat is nu ten vroegste op streek 2,
// ná het Heiligdom (al gebouwd op streek 1) maar vóór de Wachttoren (nu pas
// streek 3, zie VIJAND_AAN_DE_HORIZON_TITEL/-TEKST hieronder). De tekst mag
// de Wachttoren dus niet meer als al-bestaande tweede voedselverbruiker
// noemen — dat is nu nog toekomstmuziek — en foreshadowt 'm in plaats daarvan
// alvast, dezelfde functie als VOEDSEL_BALANS_UITLEG_* eerder al deed.
export const BOERDERIJ_KLAAR_TITEL = "Twee voedselbronnen";
export const BOERDERIJ_KLAAR_TEKST =
  "De boerderij is een efficiëntere manier om voedsel te produceren dan de jacht, want je hebt je settler nu vrij voor andere dingen. Hoe verder je komt, hoe meer voedsel je nodig zal hebben. Ieder stuk grond raakt uitgeput na een aantal beurten. Dit staat aangegeven met een getalletje bij ieder gebouw. Als de grond uitgeput is, produceert het gebouw niets meer. Maar hoe groter de stad en hoe meer bemande wachttorens, hoe meer voedsel je nodig hebt.";

// Goddelijke-raadgeving-pop-up (issue: "tutorial popups wijzigen", trigger
// verschoven van streek 3 naar 4 door "jagen en farmen omdraaien"): getoond
// zodra streek 4 ontgrendelt (zie GameRoot: `toonGoddelijkeRaadgevingPopup`) —
// dit is het moment waarop Wetenschappelijk (en dus de Sterrencirkel, zie
// improvements.ts: `STERRENCIRKEL.minStreek`) voor het eerst beschikbaar komt
// in de bouw-pop-up, ervoor stond de categorie uitgegrijsd.
export const GODDELIJKE_RAADGEVING_TITEL = "Goddelijke raadgeving";
export const GODDELIJKE_RAADGEVING_TEKST =
  "Hoe meer land we tot onze beschikking hebben, hoe meer de goden ons leren over wereld. Bouw een Sterrencirkel om kennis neer te laten dalen op aarde.";

// De-vijand-aan-de-horizon-pop-up (issue: "tutorial popups wijzigen", trigger
// verschoven van streek 2 naar 3 door "Tweede streek boerderij"): getoond
// zodra streek 3 ontgrendelt (zie GameRoot: `toonVijandAanDeHorizonPopup`) —
// dit is het moment waarop Militair (en dus de Wachttoren, zie
// improvements.ts: `MILITAIR_LAND_IMPROVEMENTS[0].minStreek`) én de Mijn voor
// het eerst beschikbaar komen in de bouw-pop-up, ervoor stond Militair
// uitgegrijsd (Mijn viel ervoor al onder Economisch, maar was zelf ook nog
// niet bouwbaar).
export const VIJAND_AAN_DE_HORIZON_TITEL = "De vijand aan de horizon";
export const VIJAND_AAN_DE_HORIZON_TEKST =
  "Niet alle wilde stammen zitten op onze opmars te wachten, ze proberen ons gebied binnen te dringen. We hebben nu erts nodig uit de heuvels en bergen. Bouw een mijn. Dat is het eerste wat we nu nodig hebben.";


// Strijders-opleiden-uitleg-pop-up (issue: "pop-ups wijzigen"): getoond zodra
// er voor het eerst een gebouwde mijn staat (zie economie.ts
// `heeftGebouwdeMijn`) — dit is het moment waarop het bouwen van een
// Wachttoren en het opleiden van een strijder allebei relevant worden, ná de
// erts/mijn-introductie via VIJAND_AAN_DE_HORIZON_* hierboven (sinds "Tweede
// streek boerderij" allebei streek 3).
export const STRIJDERS_OPLEIDEN_TITEL = "Strijders opleiden";
export const STRIJDERS_OPLEIDEN_TEKST =
  "Bouw nu een wachttoren. Leidt tegelijkertijd een strijder op. Klik op de stad en begin de opleiding van een strijder. Zodra hij klaar is, klik je op de wachttoren zelf op de kaart en kies je Wachttoren bemannen om hem toe te wijzen.";

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
  "Er is genoeg voedsel verzameld om de stad te laten groeien naar middelgroot. Open het stadsmenu door op de stad te klikken, en start de groei daar. Het kost hout en steen, en een paar beurten rijptijd. Let op: een grotere stad biedt meer bouwmogelijkheden in de stad zelf, maar neemt iedere beurt meer voedsel.";

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
// een ontgrendelde streek binnendringt (niet meer alleen de frontier-streek).
// Zelfde stijlgids als de rest van dit bestand — kort, concreet, geen moreel
// oordeel.
export const INDRINGERS_STAMMEN = [
  "de stam van de Halve Maan",
  "de stam van de Bloedhoeven",
  "de stam van de Bottenkrakers",
  "de stam van de Platneuzen",
  "de stam van de Appelplukkers",
];

export const INDRINGERS_TITEL = "Indringers bij de grens";

// Derde-uitkomst-pop-ups voor beschermde streken (hoofdstuk 6/14, issue:
// "wachttorens kunnen vernietigd worden door indringers"): drie korte
// meldingen, zelfde stijlgids als de rest van dit bestand. De Amberader-tekst
// geldt voor élke indringers-melding op een streek met een actieve Amberader
// (ook de gewone tribuut-afhandeling), niet alleen de malus/bonus-uitkomsten
// hieronder — zie `IndringersEvent.amberOnderVuur` (types.ts).
export const AMBERADER_ONDER_VUUR_TEKST =
  "Dit keer zijn ze niet zomaar op doortocht. Ze ruiken de amber, en komen ervoor.";
export const WACHTTOREN_OVERROMPELD_TEKST =
  "Dit keer houdt de wachttoren geen stand. Balken breken, de wacht valt — er blijft een ruïne over.";
export const BUIT_BINNENGEHAALD_TEKST =
  "De aanval wordt afgeslagen, en de bemanning neemt iets mee terug: goud dat de indringers achterlieten.";

// Kudde-melding (hoofdstuk 17): getoond zodra `verwerkKuddes` (economie.ts)
// een nieuwe wilde kudde neerzet — zelfde stijlgids als de rest van dit
// bestand, en dezelfde blokkerende meldings-vorm als de indringers-pop-up
// hierboven. De streek zelf wordt, net als bij `INDRINGERS_TITEL`, in de
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
// getoond zodra `verwerkStreekOntgrendeling` (economie.ts) streek
// `AMBER_ONTDEKKING_STREEK` (world.ts) voor het eerst ontgrendelt — zelfde
// blokkerende meldings-vorm en stijlgids als `KUDDE_TITEL`/`KUDDE_FLAVOR_TEKST`
// hierboven.
export const AMBER_ONTDEKKING_TITEL = "Amber gevonden";
export const AMBER_ONTDEKKING_TEKST =
  "Onze verkenners hoorden verhalen over een fantastisch glimmend materiaal: Amber. We weten alleen niet precies waar we de mijn moeten bouwen. Als we maar niet per ongeluk een ander gebouw neer zetten op de amberader, dat zou zonde zijn.";

// Tweede Amberader-ontdekkingsmelding (hoofdstuk 3/11/14, issue: "Amberader
// sowieso op streek 12"): getoond zodra `verwerkStreekOntgrendeling` (economie.ts)
// streek `AMBER_ONTDEKKING_STREEK_2` (world.ts) voor het eerst ontgrendelt —
// zelfde meldings-vorm als `AMBER_ONTDEKKING_TITEL`/`AMBER_ONTDEKKING_TEKST`
// hierboven, met een lichte variant in toon: een tweede vondst, geen eerste
// verwondering meer.
export const AMBER_ONTDEKKING_TWEEDE_TITEL = "Nog een amberader";
export const AMBER_ONTDEKKING_TWEEDE_TEKST =
  "Een tweede ader vol amber, verscholen in de rotsen. Mooi meegenomen, mocht de eerste ooit opdrogen — het goud dat eruit komt, blijft hier hard nodig.";

// Heiligdom-uitleg-pop-up (issue: "Teksten aanpassen (nog meer)"): getoond in
// plaats van de gewone bouw-pop-up, de tweede keer dat die op streek 1 zou
// verschijnen (zie GameRoot: `toonHeiligdomUitlegPopup`, geteld via
// `bouwPopupAfgehandeldTellerPerStreek`, infrastructuurEnBouw.ts).
export const HEILIGDOM_UITLEG_TITEL = "Het Heiligdom";
export const HEILIGDOM_UITLEG_TEKST =
  "Bouw nu een Heiligdom. Die produceert 'cultuur'. Na een bepaalde hoeveel cultuur te hebben geproduceerd, opent zich de volgende streek waar je op kunt bouwen.";

// Niet-bouwen-uitleg-pop-up (issue: "Teksten aanpassen (nog meer)"): getoond
// in plaats van de gewone bouw-pop-up, de derde keer dat die op streek 1 zou
// verschijnen — zelfde tel-mechanisme als `HEILIGDOM_UITLEG_*` hierboven.
export const NIET_BOUWEN_UITLEG_TITEL = "Je hoeft niet te bouwen";
export const NIET_BOUWEN_UITLEG_TEKST =
  "Als je je grondstoffen wilt bewaren voor een later moment, dan kun je ook kiezen om een beurtje niets te bouwen. Voorkom dat je in de knel komt met bouwmaterialen, want ieder gebouw in aanbouw heeft wel grondstoffen nodig, maar produceert ze nog niet!";

// Boerderij-streek-uitleg-pop-up (issue: "Teksten aanpassen (nog meer)"):
// getoond in plaats van de gewone bouw-pop-up, de eerste keer dat die op
// streek 2 verschijnt — zelfde tel-mechanisme als `HEILIGDOM_UITLEG_*`
// hierboven. Los van `BOERDERIJ_KLAAR_TITEL`/`-TEKST` hierboven, die pas
// verschijnt zodra de boerderij daadwerkelijk actief is.
export const BOERDERIJ_STREEK_UITLEG_TITEL = "De boerderij";
export const BOERDERIJ_STREEK_UITLEG_TEKST =
  "Je hebt een nieuwe streek ontgrendeld. Dit is je nieuwe frontier. De frontier is enige laag waar je op kunt bouwen. Bouw nu de boerderij ergens op een vakje met vlakke grond, maar vergeet niet dat er een weg moet lopen voordat de boerderij voedsel oplevert voor je stad.";

// Houtkap-streek-uitleg-pop-up (issue: "Teksten aanpassen (nog meer)"):
// getoond in plaats van de gewone bouw-pop-up, de tweede keer dat die op
// streek 2 verschijnt — zelfde tel-mechanisme als `HEILIGDOM_UITLEG_*`
// hierboven.
export const HOUTKAP_STREEK_UITLEG_TITEL = "Houtkap";
export const HOUTKAP_STREEK_UITLEG_TEKST =
  "Het bouwen van de boerderij kostte het laatste hout uit de voorraad dus dat moeten we als eerste weer aanvullen. Bouw een houtkap op een bos.";
