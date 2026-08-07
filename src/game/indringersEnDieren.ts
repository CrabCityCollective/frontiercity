// Wachttoren & indringers (hoofdstuk 6): één keer per beurt een kans dat er
// ergens een indringers-incident plaatsvindt (`verwerkIndringers` hieronder,
// gebruikt door `volgendeBeurt` in economie.ts) — is er een incident, dan
// wordt de getroffen laag geloot uit alle ontgrendelde lagen, ook beschermde.
// Een Wachttoren beschermt de laag waarop hij staat alleen als hij voltooid,
// bemand én via een wegketen met de stad verbonden is (zie hoofdstuk 16);
// anders eisen de indringers tribuut uit de gedeelde opslag, en kiest de
// speler geven (`geefTribuut`) of weigeren (`weigerTribuut`).
//
// Kuddes & roofdieren (hoofdstuk 14/16/17; issue: "kuddes met dieren waar je
// op kunt jagen voor voedsel", "roofdieren toevoegen"): wilde kuddes
// verschijnen per beurt met een kleine kans op een leeg vakje (bejaagbaar via
// `jaag` in acties.ts); vanaf `ROOFDIER_MIN_LAAG` kan diezelfde jachtactie een
// roofdier oproepen, dat één beurt later toeslaat als de settler er nog
// staat (`verwerkRoofdieren` hieronder).

import { GameState, IndringersTribuut, KuddeEvent, Layer, MateriaalType, RoofdierEvent, Strijder, Tile } from "./types";
import { hoogsteOntgrendeldeLaag } from "./world";
import { kuddeKansFactor } from "./techTree";
import { INDRINGERS_STAMMEN } from "./tutorialContent";
import { isTileVerbondenMetStad } from "./wegen";

// Kans per beurt dat er ergens een indringers-incident plaatsvindt
// (hoofdstuk 6/14) — één trekking voor de hele stad, niet meer per laag.
// Bewuste MVP-placeholder, net als de overige tuning-getallen in dit bestand
// (hoofdstuk 14) — expliciet tunebaar genoemd in het issue dat deze feature
// aanvroeg. Was 40% op alleen de frontier-laag; nu 20% verspreid over alle
// ontgrendelde lagen (issue: "elke nieuwe laag maakt een eerder gebouwde
// wachttoren waardeloos, en 40% per beurt op één laag is erg hoog").
const INDRINGERS_KANS = 0.2;

// Het mechanisme is pas een factor zodra deze laag ontgrendeld is (issue:
// "het mechanisme start pas zodra de speler laag 2 heeft ontgrendeld") — de
// eerste laag blijft zo een rustige introductie zonder dat risico. Was laag 3.
const INDRINGERS_MIN_LAAG = 2;

// Eerste rogue-like bonus/malus-koppeling (hoofdstuk 6/11/14, issue:
// "Amberader: bonus/malus-koppeling" — waardevolle vondsten trekken ook
// ongewenste aandacht): een laag met een actieve Amberader weegt zwaarder mee
// in de laag-trekking hieronder dan een gewone laag — voorstel 2x zo
// waarschijnlijk om geloot te worden. MVP-richtwaarde, tunebaar. Vergroot
// alleen de kans dat de laag geloot wordt, niet de uitkomst daarna: een
// beschermende Wachttoren op die laag houdt het incident nog steeds tegen
// (`heeftBeschermendeWachttoren` hieronder blijft ongewijzigd die uitkomst
// bepalen). Bewust klein gehouden en volledig gebouwd op de bestaande
// Amberader- en indringers-trekking-systemen, zonder nieuw framework — zie
// hoofdstuk 11 voor de volledige onderbouwing.
const AMBERADER_INDRINGERS_GEWICHT = 2;

// Tweede rogue-like bonus/malus-koppeling (hoofdstuk 6/11/14, issue:
// "wachttorens kunnen vernietigd worden door indringers"): een beschermde
// laag (frontier of niet) houdt niet langer altijd zomaar stand — een derde
// loot bepaalt de uitkomst van het incident. Volgorde bewust vaakst → meest
// zeldzaam: stand houden (ongewijzigd gedrag) ♦ malus (Wachttoren wordt een
// ruïne, bemanning blijvend verloren) ♦ bonus (buit, extra goud). MVP-
// richtwaarden, tunebaar (hoofdstuk 14) — `INDRINGERS_STANDHOUDEN_KANS +
// INDRINGERS_MALUS_KANS` moet onder 1 blijven; de rest van de kansruimte is
// de bonus-uitkomst.
const INDRINGERS_STANDHOUDEN_KANS = 0.85;
const INDRINGERS_MALUS_KANS = 0.1;

// Buit-bedrag bij de bonus-uitkomst hierboven (hoofdstuk 6/14) — MVP-
// richtwaarde, tunebaar.
const INDRINGERS_BUIT_GOUD = 6;

// Kuddes verschijnen pas vanaf `KUDDE_MIN_LAAG` (issue: "vanaf laag 4 mogen
// kuddes voorkomen"). KUDDE_KANS verlaagd van 0,15 naar 0,05 (issue: "kudde
// frequentie verlagen") — bij de oude 15%/beurt, zonder natuurlijk verval van
// een ongejaagde kudde (alleen leegjagen of overbouwen verwijdert er een),
// stapelden kuddes zich in de praktijk sneller op dan een actief jagende
// speler kon bijhouden. Zie hoofdstuk 14 voor de doorrekening.
const KUDDE_MIN_LAAG = 4;
const KUDDE_KANS = 0.05;
const KUDDE_JACHT_BEURTEN = 4;

// Een Wachttoren beschermt de laag waarop hij staat alleen als hij voltooid,
// bemand én via een aaneengesloten wegketen met de stad verbonden is (issue:
// "een wachtpost moet bevoorraad worden; zonder verbinding met de stad kan
// hij zijn functie niet vervullen") — dit lost de eerdere ambiguïteit tussen
// hoofdstuk 6 ("actief én bemand") en hoofdstuk 16 (land improvements worden
// pas actief via een wegverbinding) op. Een gebouwde maar onbemande of
// onverbonden Wachttoren biedt geen bescherming. Geeft de tile zelf terug
// (niet alleen een boolean) zodat de malus-uitkomst hieronder (issue:
// "wachttorens kunnen vernietigd worden door indringers") weet welke
// specifieke tile tot ruïne moet vervallen.
// Of een Wachttoren-vakje bemand is door een van de strijders (nieuwe
// Wachttoren-functie, hoofdstuk 6: "de wachttoren moet dus bemand zijn").
// Geëxporteerd zodat zowel militair.ts (Wachttoren-/Legerkamp-bemanning) als
// de tile-info-pop-up (tileInfo.ts) en de canvas-tekenaars (render/canvas.ts,
// render/canvasPixelArt.ts) hetzelfde bemand/onbemand-onderscheid kunnen
// tonen als hier bepaald wordt.
export function isWachttorenBemand(strijders: Strijder[], hoogte: number, positieInLaag: number): boolean {
  return strijders.some(
    (strijder) => strijder.wachttoren?.hoogte === hoogte && strijder.wachttoren?.positieInLaag === positieInLaag
  );
}

function vindWerkendeWachttorenTile(state: GameState, laag: Layer): Tile | undefined {
  return laag.tiles.find(
    (tile) =>
      tile.status === "actief" &&
      tile.improvement?.id === "wachttoren" &&
      isWachttorenBemand(state.stad.strijders, laag.hoogte, tile.positieInLaag) &&
      isTileVerbondenMetStad(state.lagen, laag.hoogte, tile.positieInLaag)
  );
}

export function heeftWerkendeWachttorenOpLaag(state: GameState, laag: Layer): boolean {
  return vindWerkendeWachttorenTile(state, laag) !== undefined;
}

// De specifieke laag+tile van de Wachttoren die `laag` beschermt: op de laag
// zelf, of anders (issue: "wachttoren beschermt 2 lagen") op de laag erboven
// — nooit de laag eronder. Een toren beschermt dus zijn eigen laag én de laag
// daaronder, nooit de laag erboven — dat blijft aan een eigen toren op die
// hogere laag. Gebruikt door zowel `heeftBeschermendeWachttoren` hieronder
// als de nieuwe malus-uitkomst (issue: "wachttorens kunnen vernietigd worden
// door indringers"), die precies déze Wachttoren tot ruïne laat vervallen.
function vindBeschermendeWachttoren(state: GameState, laag: Layer): { laag: Layer; tile: Tile } | undefined {
  const opLaagZelf = vindWerkendeWachttorenTile(state, laag);
  if (opLaagZelf) return { laag, tile: opLaagZelf };

  const laagErboven = state.lagen.find((l) => l.hoogte === laag.hoogte + 1);
  if (!laagErboven) return undefined;
  const opLaagErboven = vindWerkendeWachttorenTile(state, laagErboven);
  return opLaagErboven ? { laag: laagErboven, tile: opLaagErboven } : undefined;
}

function heeftBeschermendeWachttoren(state: GameState, laag: Layer): boolean {
  return vindBeschermendeWachttoren(state, laag) !== undefined;
}

// Het grondstof-type waar de speler op dit moment het meest van heeft, met
// ongeveer de helft daarvan als tribuut-eis (hoofdstuk 6: "iets specifieks...
// ongeveer de helft van datgene wat je op dat moment het meest op voorraad
// hebt"). Geeft `null` als er niets in voorraad is — het spel eist dan geen
// tribuut dat er niet is (issue: "het spel kijkt wel of je het hebt").
function kiesTribuut(voorraad: Record<MateriaalType, number>): IndringersTribuut | null {
  let grootsteType: MateriaalType | null = null;
  let grootsteWaarde = 0;

  for (const type of Object.keys(voorraad) as MateriaalType[]) {
    if (voorraad[type] > grootsteWaarde) {
      grootsteWaarde = voorraad[type];
      grootsteType = type;
    }
  }

  if (!grootsteType) return null;
  return { resource: grootsteType, aantal: Math.max(1, Math.round(grootsteWaarde / 2)) };
}

// Een laag is alleen "interessant" voor indringers als er iets te halen valt
// (hoofdstuk 6/11, issue: "een laag met alleen een wachttoren kan geen
// indringers krijgen"). Staat er op een laag uitsluitend een Wachttoren — en
// verder geen enkele andere improvement en geen ghost town — dan doet die
// laag niet mee in de trekking, ongeacht de staat van die Wachttoren (ook in
// aanbouw of nog niet bemand telt niet mee): een kale wachtpost biedt geen
// aanleiding. Een compleet lege laag (nog geen enkele improvement, bv. een
// net ontgrendelde laag) telt hier niet als "alleen een wachttoren" en blijft
// dus gewoon meedoen, net als lagen met alleen ghost towns en de startlaag —
// die regel is ongewijzigd. Is de Wachttoren op zo'n laag daarnaast ook nog
// beschermend (voltooid, bemand, verbonden), dan verandert dat hier niets:
// zo'n laag heeft dan alsnog niets anders te bieden en blijft uitgesloten.
function isAlleenWachttorenLaag(laag: Layer): boolean {
  let heeftWachttoren = false;
  for (const tile of laag.tiles) {
    if (tile.status === "ghost_town") return false;
    if (tile.improvement) {
      if (tile.improvement.id === "wachttoren") {
        heeftWachttoren = true;
      } else {
        return false;
      }
    }
  }
  return heeftWachttoren;
}

// Een laag heeft een *actieve* Amberader (gebouwd, nog niet uitgeput) zolang
// er een tile met de `goudmijn`-improvement (interne sleutel, zie
// `improvements.ts`) in status `actief` op staat. Eenmaal uitgeput wordt zo'n
// tile `ghost_town` (zie `verwerkUitputting` in uitputtingEnVerval.ts) en
// telt hij hier niet meer mee — een lege put trekt geen indringers meer aan
// (hoofdstuk 6/11/14).
function heeftActieveAmberader(laag: Layer): boolean {
  return laag.tiles.some((tile) => tile.status === "actief" && tile.improvement?.id === "goudmijn");
}

// Gewicht van `laag` in de indringers-laag-trekking hieronder: een laag met
// een actieve Amberader (zie hierboven) weegt `AMBERADER_INDRINGERS_GEWICHT`
// keer zo zwaar als een gewone laag.
function indringersGewicht(laag: Layer): number {
  return heeftActieveAmberader(laag) ? AMBERADER_INDRINGERS_GEWICHT : 1;
}

// Loot de derde-uitkomst voor een beschermde laag (hoofdstuk 6/14, issue:
// "wachttorens kunnen vernietigd worden door indringers"): meestal houdt de
// Wachttoren gewoon stand, soms wordt hij overrompeld (malus), zelden buit de
// bemanning iets van de indringers (bonus).
function bepaalIndringersUitkomst(): "standhouden" | "malus" | "bonus" {
  const worp = Math.random();
  if (worp < INDRINGERS_STANDHOUDEN_KANS) return "standhouden";
  if (worp < INDRINGERS_STANDHOUDEN_KANS + INDRINGERS_MALUS_KANS) return "malus";
  return "bonus";
}

// Verwerkt de malus-uitkomst hierboven: dezelfde afhandeling als een verloren
// Confrontatie tegen een Bezette Laag (`confrontatieBezetteLaag` in
// militair.ts) — de beschermende Wachttoren-tile wordt een ruïne (op dezelfde
// plek herbouwbaar tegen de normale kosten/bouwtijd) en de strijder die hem
// bemande is blijvend verloren, geen reassignment.
function verwerkWachttorenOverrompeling(
  state: GameState,
  beschermendeWachttoren: { laag: Layer; tile: Tile }
): GameState {
  const { laag, tile } = beschermendeWachttoren;
  const bemanner = state.stad.strijders.find(
    (s) => s.wachttoren?.hoogte === laag.hoogte && s.wachttoren?.positieInLaag === tile.positieInLaag
  );
  const strijders = bemanner ? state.stad.strijders.filter((s) => s.id !== bemanner.id) : state.stad.strijders;

  const lagen = state.lagen.map((l) =>
    l.hoogte !== laag.hoogte
      ? l
      : {
          ...l,
          tiles: l.tiles.map((t, i) =>
            i === tile.positieInLaag
              ? { ...t, status: "ruine" as const, improvement: undefined, beurtenTotUitputting: undefined }
              : t
          ),
        }
  );

  return { ...state, lagen, stad: { ...state.stad, strijders } };
}

// Indringers & tribuut (hoofdstuk 6): elke beurt is er, zodra laag
// `INDRINGERS_MIN_LAAG` ontgrendeld is, één trekking of er sowieso een
// incident plaatsvindt — niet meer per laag. Is er een incident, dan wordt de
// getroffen laag geloot uit alle ontgrendelde lagen die iets te bieden hebben
// (issue: "loot dan de laag uit álle ontgrendelde lagen — ook lagen die
// beschermd zijn", later verfijnd met `isAlleenWachttorenLaag` hierboven),
// zodat elke gebouwde, bemande en verbonden Wachttoren zijn hele run lang
// waarde houdt in plaats van waardeloos te worden zodra de frontier opschuift.
// Een beschermende Wachttoren op de geloten laag verdedigt de laag meestal
// gewoon (issue: "wachttorens kunnen vernietigd worden door indringers" —
// `bepaalIndringersUitkomst` hierboven loot hier nu de derde uitkomst, ook op
// de frontier-laag zelf: meestal stand houden, soms een malus, zelden een
// bonus). Zonder zo'n wachttoren eist de tribe tribuut (zie `kiesTribuut`); de
// speler lost dit verder zelf op via `geefTribuut`/`weigerTribuut` hieronder.
// Een laag met een actieve Amberader krijgt bovendien altijd eerst een eigen
// aankondiging (`amberOnderVuur`/fase "amber-onder-vuur"), los van de
// uitkomst — ook bij de gewone tribuut-afhandeling. Rolt geen nieuwe
// gebeurtenis zolang een vorige melding nog open staat.
export function verwerkIndringers(state: GameState): GameState {
  if (state.indringersEvent) return state;
  if (hoogsteOntgrendeldeLaag(state.lagen) < INDRINGERS_MIN_LAAG) return state;
  if (Math.random() >= INDRINGERS_KANS) return state;

  const ontgrendeldeLagen = state.lagen.filter(
    (laag) => laag.ontgrendeld && !isAlleenWachttorenLaag(laag)
  );
  if (ontgrendeldeLagen.length === 0) return state;

  // Gewogen trekking (issue: "Amberader: bonus/malus-koppeling") in plaats
  // van een zuiver uniforme trekking — lagen met een actieve Amberader tellen
  // hier zwaarder mee, zie `indringersGewicht` hierboven.
  const gewichten = ontgrendeldeLagen.map(indringersGewicht);
  const totaalGewicht = gewichten.reduce((som, gewicht) => som + gewicht, 0);
  let punt = Math.random() * totaalGewicht;
  let laag = ontgrendeldeLagen[ontgrendeldeLagen.length - 1];
  for (let i = 0; i < ontgrendeldeLagen.length; i++) {
    punt -= gewichten[i];
    if (punt < 0) {
      laag = ontgrendeldeLagen[i];
      break;
    }
  }
  const stamNaam = INDRINGERS_STAMMEN[Math.floor(Math.random() * INDRINGERS_STAMMEN.length)];
  const amberOnderVuur = heeftActieveAmberader(laag) || undefined;

  const beschermendeWachttoren = vindBeschermendeWachttoren(state, laag);
  if (beschermendeWachttoren) {
    const uitkomst = bepaalIndringersUitkomst();
    let volgendeState = state;
    let buitGoud: number | undefined;

    if (uitkomst === "malus") {
      volgendeState = verwerkWachttorenOverrompeling(volgendeState, beschermendeWachttoren);
    } else if (uitkomst === "bonus") {
      buitGoud = INDRINGERS_BUIT_GOUD;
      volgendeState = {
        ...volgendeState,
        voorraad: {
          ...volgendeState.voorraad,
          goud: Math.min(volgendeState.opslagCap, volgendeState.voorraad.goud + INDRINGERS_BUIT_GOUD),
        },
      };
    }

    // Historiescherm-statistieken (issue: "hoe vaak je aangevallen bent, en
    // hoe vaak de aanval succesvol is afgeslagen ... hoeveel wachttorens door
    // indringers zijn gesloopt") — elk incident met een beschermende
    // Wachttoren is een "aanval"; alleen de malus-uitkomst telt als gesloopt.
    const statistieken = state.indringersStatistieken;
    volgendeState = {
      ...volgendeState,
      indringersStatistieken: {
        ...statistieken,
        aanvallenTotaal: statistieken.aanvallenTotaal + 1,
        aanvallenAfgeslagen: statistieken.aanvallenAfgeslagen + (uitkomst === "malus" ? 0 : 1),
        wachttorensGesloopt: statistieken.wachttorensGesloopt + (uitkomst === "malus" ? 1 : 0),
      },
    };

    const uitkomstFase = uitkomst === "standhouden" ? "gemeld" : uitkomst;
    return {
      ...volgendeState,
      indringersEvent: {
        laagHoogte: laag.hoogte,
        stamNaam,
        heeftWachttoren: true,
        amberOnderVuur,
        uitkomst,
        buitGoud,
        fase: amberOnderVuur ? "amber-onder-vuur" : uitkomstFase,
      },
    };
  }

  const tribuut = kiesTribuut(state.voorraad);
  if (!tribuut) return state;

  return {
    ...state,
    indringersEvent: {
      laagHoogte: laag.hoogte,
      stamNaam,
      heeftWachttoren: false,
      tribuut,
      amberOnderVuur,
      fase: amberOnderVuur ? "amber-onder-vuur" : "gemeld",
    },
  };
}

// Spawnt per beurt met een kleine kans een nieuwe wilde kudde (hoofdstuk
// 16/17) op een leeg, nog-kuddeloos vakje van een ontgrendelde laag vanaf
// `KUDDE_MIN_LAAG`. Net als `verwerkIndringers` hierboven: hoogstens één
// nieuwe kudde per beurt, geen limiet op het totaal aantal tegelijk
// aanwezige kuddes.
export function verwerkKuddes(state: GameState): GameState {
  if (hoogsteOntgrendeldeLaag(state.lagen) < KUDDE_MIN_LAAG) return state;
  // "A2a. Veeteelt" (hoofdstuk 3/9, techTree.ts): kuddes verschijnen vaker.
  if (Math.random() >= KUDDE_KANS * kuddeKansFactor(state.technologieen)) return state;

  const kandidaten: { hoogte: number; positieInLaag: number }[] = [];
  for (const laag of state.lagen) {
    if (!laag.ontgrendeld || laag.hoogte < KUDDE_MIN_LAAG) continue;
    for (const tile of laag.tiles) {
      if (tile.status === "leeg" && !tile.kudde) {
        kandidaten.push({ hoogte: laag.hoogte, positieInLaag: tile.positieInLaag });
      }
    }
  }
  if (kandidaten.length === 0) return state;

  const doel = kandidaten[Math.floor(Math.random() * kandidaten.length)];
  const lagen = state.lagen.map((laag) => {
    if (laag.hoogte !== doel.hoogte) return laag;
    const tiles = laag.tiles.map((tile, index) =>
      index === doel.positieInLaag ? { ...tile, kudde: { beurtenResterend: KUDDE_JACHT_BEURTEN } } : tile
    );
    return { ...laag, tiles };
  });

  // Meldt de nieuwe kudde meteen (hoofdstuk 17: "dezelfde stijl als de
  // indringers-pop-up"), zodat de speler niet toevallig op de kaart hoeft te
  // zien waar hij de settler heen kan sturen om te jagen.
  const kuddeEvent: KuddeEvent = { hoogte: doel.hoogte, positieInLaag: doel.positieInLaag };

  return { ...state, lagen, kuddeEvent };
}

// Sluit een kudde-melding (hoofdstuk 17) — puur een UI-bevestiging, de kudde
// zelf blijft gewoon op de kaart staan tot hij leeggejaagd is of overbouwd
// wordt.
export function sluitKuddeMelding(state: GameState): GameState {
  return { ...state, kuddeEvent: undefined };
}

// Roofdieren (hoofdstuk 14/17, issue: "roofdieren toevoegen") — onderdeel van
// de `volgendeBeurt`-pijplijn, net als `verwerkIndringers`/`verwerkKuddes`
// hierboven. Elk vakje met een `roofdier` (gezet door `jaag`) telt eerst zijn
// `beurtenTotAanval` af — dat geeft de speler exact één tussenliggende beurt
// om de settler weg te bewegen (hoofdstuk 7: "waarschuwing → kort
// reactievenster → gevolg"). Is die beurt om, dan wordt de aanval
// afgehandeld: staat de settler nog (of weer) op het vakje, dan sterft hij en
// meldt een pop-up dit (`fase: "aanval"`); staat hij er niet, dan trekt het
// roofdier zich stilzwijgend terug. Zowel bij een voltreffer als een
// ontsnapping verdwijnt het roofdier-veld daarna — één aanvalspoging per
// verschijning (hoofdstuk 17 kent geen mechanisme om een roofdier af te
// weren, alleen om het te ontwijken).
export function verwerkRoofdieren(state: GameState): GameState {
  let settler = state.settler;
  let settlerVerlorenAanRoofdier = state.settlerVerlorenAanRoofdier;
  let roofdierEvent = state.roofdierEvent;

  const lagen = state.lagen.map((laag) => {
    const tiles = laag.tiles.map((tile) => {
      if (!tile.roofdier) return tile;

      if (tile.roofdier.beurtenTotAanval > 0) {
        return { ...tile, roofdier: { beurtenTotAanval: tile.roofdier.beurtenTotAanval - 1 } };
      }

      const settlerOpPlek =
        state.settler?.hoogte === laag.hoogte && state.settler?.positieInLaag === tile.positieInLaag;
      if (settlerOpPlek) {
        settler = undefined;
        settlerVerlorenAanRoofdier = true;
        roofdierEvent = { hoogte: laag.hoogte, positieInLaag: tile.positieInLaag, fase: "aanval" };
      }
      return { ...tile, roofdier: undefined };
    });
    return { ...laag, tiles };
  });

  return { ...state, lagen, settler, settlerVerlorenAanRoofdier, roofdierEvent };
}

// Sluit een roofdier-melding (hoofdstuk 14/17) — puur een UI-bevestiging,
// zowel bij de waarschuwing ("verschenen") als bij het gevolg ("aanval").
export function sluitRoofdierMelding(state: GameState): GameState {
  return { ...state, roofdierEvent: undefined };
}

// Sluit een gemelde indringers-melding zonder verdere gevolgen: de
// "standhouden"-uitkomst (`fase: "gemeld"` met `heeftWachttoren: true`), en de
// nieuwe "malus"/"bonus"-uitkomsten (issue: "wachttorens kunnen vernietigd
// worden door indringers") — hun state-mutatie (ruïne + strijderverlies, resp.
// goud) is al toegepast door `verwerkIndringers` op het moment dat het event
// gezet werd, dit is puur de UI-bevestiging.
export function sluitIndringersMelding(state: GameState): GameState {
  return { ...state, indringersEvent: undefined };
}

// Bevestigt de "Amberader onder vuur"-aankondiging (hoofdstuk 6, issue:
// "wachttorens kunnen vernietigd worden door indringers", Deel 2) en schuift
// door naar de eigenlijke uitkomst-fase van hetzelfde incident — de
// aankondiging en de uitkomst worden bewust na elkaar getoond, niet
// gecombineerd tot één bericht.
export function bevestigAmberOnderVuur(state: GameState): GameState {
  const event = state.indringersEvent;
  if (!event || event.fase !== "amber-onder-vuur") return state;

  const volgendeFase = event.heeftWachttoren
    ? event.uitkomst === "standhouden"
      ? "gemeld"
      : event.uitkomst!
    : "gemeld";
  return { ...state, indringersEvent: { ...event, fase: volgendeFase } };
}

// Kiest bewust om het geëiste tribuut te geven (hoofdstuk 6, issue:
// "wachttoren tweaks" — het bedrag gaat pas van de voorraad af zodra de
// speler de melding daadwerkelijk sluit): zet de melding op `fase: "betaald"`
// zodat de pop-up het af te schrijven bedrag nog eens bevestigt, zonder de
// voorraad al aan te passen. Zie `geefTribuut` hieronder voor de
// daadwerkelijke afschrijving.
export function kiesGeefTribuut(state: GameState): GameState {
  const event = state.indringersEvent;
  if (!event?.tribuut || event.fase !== "gemeld") return state;
  return { ...state, indringersEvent: { ...event, fase: "betaald" } };
}

// Weigert het tribuut (hoofdstuk 6): normaal verwoesten de indringers de stad
// en valt de speler terug op de vorige stad, als die er is. De MVP kent nog
// maar één stad (hoofdstuk 13) — zonder toevlucht wordt het tribuut alsnog
// betaald, wat hier eerst zichtbaar wordt gemaakt (`fase: "geforceerd"`)
// zodat de pop-up dat kan uitleggen vóór `bevestigGedwongenTribuut` verder gaat.
export function weigerTribuut(state: GameState): GameState {
  const event = state.indringersEvent;
  if (!event?.tribuut) return state;
  return { ...state, indringersEvent: { ...event, fase: "geforceerd" } };
}

// Bevestigt het afgedwongen tribuut na `weigerTribuut` hierboven — zelfde
// vervolgstap als `kiesGeefTribuut` (naar `fase: "betaald"`, nog geen
// afschrijving), maar bewust als losse actie zodat de UI het onderscheid kan
// tonen (bewuste keuze vs. afgedwongen).
export function bevestigGedwongenTribuut(state: GameState): GameState {
  const event = state.indringersEvent;
  if (!event?.tribuut || event.fase !== "geforceerd") return state;
  return { ...state, indringersEvent: { ...event, fase: "betaald" } };
}

// Sluit de "betaald"-melding en trekt op dát moment pas het tribuut af van de
// gedeelde opslag (nooit onder nul) — issue: "wachttoren tweaks": de voorraad
// mag pas veranderen zodra de speler de pop-up daadwerkelijk wegklikt, niet
// al bij de keuze om te betalen.
export function geefTribuut(state: GameState): GameState {
  const event = state.indringersEvent;
  if (!event?.tribuut) return state;

  const voorraad = { ...state.voorraad };
  voorraad[event.tribuut.resource] = Math.max(0, voorraad[event.tribuut.resource] - event.tribuut.aantal);

  // Historiescherm-statistieken (issue: "hoevaak tribuut gegeven is (met
  // exacte aantallen voorraad tribuut)") — telt hier, niet al bij
  // `kiesGeefTribuut`/`bevestigGedwongenTribuut`, dezelfde reden als de
  // voorraad-afschrijving hierboven: pas als de speler de melding echt sluit.
  const statistieken = state.indringersStatistieken;
  const indringersStatistieken = {
    ...statistieken,
    tribuutGegevenAantal: statistieken.tribuutGegevenAantal + 1,
    tribuutGegeven: {
      ...statistieken.tribuutGegeven,
      [event.tribuut.resource]: statistieken.tribuutGegeven[event.tribuut.resource] + event.tribuut.aantal,
    },
  };

  return { ...state, voorraad, indringersEvent: undefined, indringersStatistieken };
}
