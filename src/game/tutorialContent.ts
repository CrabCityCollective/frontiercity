// Tutorial-content (M8, hoofdstuk 10 & 13): de vastgelegde mechaniek-volgorde
// en flavor-teksten voor streken 1-13 van "De Eerste Vuren" (Het Hertenpad-volk).
// De mechanieken zelf zijn al gebouwd in M1-M7 — dit bestand voegt alleen de
// vaste, geschreven inhoud toe die per streek hoort (geen nieuwe systemen).
//
// Flavor-tekststijlgids (hoofdstuk 9): korte, vaak enkelvoudige zinnen, geen
// emotie-bijvoeglijke naamwoorden, geen moreel oordeel, concreet/zintuiglijk
// boven abstract, herhaling als stijlmiddel toegestaan, stiltes toegestaan.
//
// Streek 9 ("Zeldzaamheid") en de framing van streek 10/11 als "gescript,
// ongevaarlijk" horen bij post-MVP-uitbreidingen (hoofdstuk 13: geen
// zeldzaamheid, geen aparte tutorial-veilige verval-variant in de MVP) — de
// flavor-tekst hieronder zet de sfeer alvast neer zonder een apart systeem te
// bouwen dat later weer weggegooid moet worden.

export interface StreekContent {
  naam: string;
  mechaniek: string;
  flavorTekst: string;
}

export const TUTORIAL_STREEK_CONTENT: Record<number, StreekContent> = {
  1: {
    naam: "De Oevervlakte",
    mechaniek: "Bouwen en overleven",
    flavorTekst: "Water aan de ene kant, gras aan de andere. Er is maar 1 richting: voorwaarts.",
  },
  2: {
    naam: "Het Rietmoeras",
    mechaniek: "Verdedigen tegen indringers",
    flavorTekst:
      "De wereld bleek wreder dan gedacht. Maar het Goddelijke Licht dan wel de Menselijke Speer zal blijven staan.",
  },
  3: {
    naam: "De Bosrand",
    mechaniek: "Wetenschap en de techtree",
    flavorTekst: "We zijn al van ver gekomen. Hoewel, als we op de heuvel staan, kunnen we het kamp nog zien.",
  },
  4: {
    naam: "Het Loofbos",
    mechaniek: "Kuddes en jacht",
    flavorTekst:
      "De stam heeft niet genoeg aan alleen boerderijen, we moeten jagen op de sappige wilde dieren om ons menu uit te breiden.",
  },
  5: {
    naam: "De Heuvelvoet",
    mechaniek: "Roofdieren",
    flavorTekst: "Jagen heeft het nadeel dat er ook dieren verschijnen die de jagers van onze stam ook heel sappig vinden.",
  },
  6: {
    naam: "De Heuvels",
    mechaniek: "De stad groter laten groeien",
    flavorTekst: "De heuvels bieden eindelijk ruimte. Groter worden kan — meer monden om te voeden ook.",
  },
  7: {
    naam: "De Rotsrichel",
    mechaniek: "Amber en Mijnbouw",
    flavorTekst: "Het mooiste materiaal ooit gezien, het trekt ook de verkeerde mensen aan.",
  },
  8: {
    naam: "De Hooggebergte-voet",
    mechaniek: "Kennis en technologie",
    flavorTekst: "Aan de voet van het hooggebergte ligt de lucht al dunner. Wie hier kijkt, ziet verder dan ooit.",
  },
  9: {
    naam: "Het Naaldwoud",
    mechaniek: "Dieper de wildernis in",
    flavorTekst: "In het naaldwoud fluistert men over bomen ouder dan het Hertenpad-volk zelf.",
  },
  10: {
    naam: "De Boomgrens",
    mechaniek: "Nog eens groeien: van middel naar groot",
    flavorTekst:
      "Boven de boomgrens is er minder beschutting, maar wel meer land. Groter worden is hier een keuze, geen vanzelfsprekendheid.",
  },
  11: {
    naam: "De Besneeuwde Flank",
    mechaniek: "Een tweede amberader",
    flavorTekst: "Onder de sneeuw glinstert iets dat we al kennen. Een tweede ader, dieper dan de eerste.",
  },
  12: {
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
  13: {
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

// Bezette-Streek-uitleg-pop-up (hoofdstuk 6, issue: "De Bezette Streek,
// missionaris en verkenner", Deel 2), getoond zodra streek 12 "in beeld komt"
// (dezelfde soort trigger als de gegarandeerde Amberader-vondst op streek 7),
// direct na de gewone streek-pop-up hierboven — vervangt de eerdere, kleinere
// MILITAIR_UITLEG_*-pop-up volledig.
export const BEZETTE_STREEK_TITEL = "De Bergkam is bezet";
export const BEZETTE_STREEK_TEKST =
  "Op de bergkam staan een wachttoren en een heiligdom die niet van het Hertenpad-volk zijn — en her en der een verlaten huisje. Hier kun je niet zomaar bouwen of verkennen, en cultuur werkt hier anders: ze stapelt niet meer op zolang deze streek bezet blijft. Leid een Verkenner op om de bergkam vakje voor vakje te onthullen, en een Missionaris om het heiligdom te belegeren. De vijandelijke wachttoren vereist een Confrontatie — en daarvoor heb je eerst een eigen, bemande wachttoren op de streek eronder nodig. Pas als zowel het heiligdom als de wachttoren vernietigd zijn, gaat de bergkam open voor je settler en voor nieuwe bebouwing.";

// Vijandelijk-Heiligdom-onthuld-/vernietigd-pop-up (Deel 4) — zelfde
// blokkerende overlay als hierboven, maar twee losse momenten van dezelfde
// dreiging (zelfde patroon als ROOFDIER_VERSCHENEN_*/ROOFDIER_AANVAL_*
// hieronder).
export const VIJANDELIJK_HEILIGDOM_ONTHULD_TITEL = "Een vijandelijk heiligdom";
export const VIJANDELIJK_HEILIGDOM_ONTHULD_TEKST =
  "Verkenning heeft een heiligdom blootgelegd dat niet het onze is. Zolang je minstens één Missionaris hebt opgeleid, stroomt nieuwe cultuur van je eigen heiligdommen naar een belegeringsmeter voor dit doel — zonder Missionaris gebeurt er niets. Elke extra Missionaris laat de meter sneller vollopen.";
export const VIJANDELIJK_HEILIGDOM_VERNIETIGD_TITEL = "Het heiligdom valt stil";
export const VIJANDELIJK_HEILIGDOM_VERNIETIGD_TEKST =
  "De belegeringsmeter is vol. Het vreemde heiligdom valt stil — geen dreiging meer, geen doel meer.";

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
export const SETTLER_UITLEG_TITEL = "De settler";
export const SETTLER_UITLEG_TEKST =
  "We gaan vooruit de wildenis in. De settlers kunnen bewegen over de kaart, en wegen bouwen. We moeten een weg naar de houtkap bouwen, anders kan het hout de voorraad niet bereiken.";

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
// van streek 2 zelf, zie VIJAND_AAN_DE_HORIZON_TITEL/-TEKST hieronder).
export const BOERDERIJ_KLAAR_TITEL = "Voedsel bereikt het kamp";
export const BOERDERIJ_KLAAR_TEKST =
  "Voedsel bereikt het kamp, de ergste hongersnood is geweken. De tijd is nu gekomen om de wilde stammen te verenigen onder de glorie van onze voorouders. Bouw een Heiligdom, opdat ons licht over de wereld gaat stralen. (een Heiligdom heeft voldoende steen nodig om te bouwen)";

// Goddelijke-raadgeving-pop-up (issue: "tutorial popups wijzigen"): getoond
// zodra streek 3 ontgrendelt (zie GameRoot: `toonGoddelijkeRaadgevingPopup`) —
// dit is het moment waarop Wetenschappelijk (en dus de Sterrencirkel, zie
// improvements.ts: `STERRENCIRKEL.minStreek`) voor het eerst beschikbaar komt
// in de bouw-pop-up, ervoor stond de categorie uitgegrijsd.
export const GODDELIJKE_RAADGEVING_TITEL = "Goddelijke raadgeving";
export const GODDELIJKE_RAADGEVING_TEKST =
  "Hoe meer land we tot onze beschikking hebben, hoe meer de goden ons leren over wereld. Bouw een Sterrencirkel om kennis neer te laten dalen op aarde.";

// De-vijand-aan-de-horizon-pop-up (issue: "tutorial popups wijzigen"):
// getoond zodra streek 2 ontgrendelt (zie GameRoot: `toonVijandAanDeHorizonPopup`)
// — dit is het moment waarop Militair (en dus de Wachttoren, zie
// improvements.ts: `MILITAIR_LAND_IMPROVEMENTS[0].minStreek`) voor het eerst
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
// een ontgrendelde streek binnendringt (niet meer alleen de frontier-streek).
// Zelfde stijlgids als de rest van dit bestand — kort, concreet, geen moreel
// oordeel.
export const INDRINGERS_STAMMEN = ["de stam van de Halve Maan", "de stam van de Bloedhoeven"];

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
  "Onze verkenners vonden een fantastisch glimmend materiaal: Amber. We gaan een mijn bouwen om al het Amber tot het laatste brokje uit de grond te krijgen.";

// Tweede Amberader-ontdekkingsmelding (hoofdstuk 3/11/14, issue: "Amberader
// sowieso op streek 12"): getoond zodra `verwerkStreekOntgrendeling` (economie.ts)
// streek `AMBER_ONTDEKKING_STREEK_2` (world.ts) voor het eerst ontgrendelt —
// zelfde meldings-vorm als `AMBER_ONTDEKKING_TITEL`/`AMBER_ONTDEKKING_TEKST`
// hierboven, met een lichte variant in toon: een tweede vondst, geen eerste
// verwondering meer.
export const AMBER_ONTDEKKING_TWEEDE_TITEL = "Nog een amberader";
export const AMBER_ONTDEKKING_TWEEDE_TEKST =
  "Een tweede ader vol amber, verscholen in de rotsen. Mooi meegenomen, mocht de eerste ooit opdrogen — het goud dat eruit komt, blijft hier hard nodig.";
