// Wachttoren & indringers (hoofdstuk 6): één keer per beurt een kans dat er
// ergens een indringers-incident plaatsvindt (`verwerkIndringers` hieronder,
// gebruikt door `volgendeBeurt` in economie.ts) — is er een incident, dan
// wordt de getroffen streek geloot uit alle ontgrendelde streken, ook beschermde.
// Een Wachttoren beschermt de streek waarop hij staat alleen als hij voltooid,
// bemand én via een wegketen met de stad verbonden is (zie hoofdstuk 16);
// anders eisen de indringers tribuut uit de gedeelde opslag, en kiest de
// speler geven (`geefTribuut`) of weigeren (`weigerTribuut`).
//
// Kuddes & roofdieren (hoofdstuk 14/16/17; issue: "kuddes met dieren waar je
// op kunt jagen voor voedsel", "roofdieren toevoegen"): wilde kuddes
// verschijnen per beurt met een kleine kans op een leeg vakje (bejaagbaar via
// `jaag` in acties.ts); vanaf `ROOFDIER_MIN_STREEK` (world.ts, sinds issue
// "Eerste streek geen roofdieren" streek 6 i.p.v. streek 1) kan diezelfde
// jachtactie een roofdier oproepen, dat één beurt later toeslaat als de
// settler er nog staat (`verwerkRoofdieren` hieronder).

import {
  GameState,
  IndringersTribuut,
  KuddeEvent,
  Streek,
  MateriaalType,
  RoofdierEvent,
  Strijder,
  Tile,
  WampumAfkoopStatus,
} from "./types";
import { hoogsteOntgrendeldeStreek, kuddeJachtBeurtenVoorStreek, STARTKUDDE_POSITIE } from "./world";
import { kuddeKansFactor } from "./techTree";
import { INDRINGERS_STAMMEN } from "./tutorialContent";
import { campagneConfig } from "./campagnes";
import { isTileVerbondenMetStad } from "./wegen";
import { metActieveStad } from "./stad";
import { heeftWampanoagVerbond } from "./wampanoag";

// Kans per beurt dat er ergens een indringers-incident plaatsvindt
// (hoofdstuk 6/14) — één trekking voor de hele stad, niet meer per streek.
// Bewuste MVP-placeholder, net als de overige tuning-getallen in dit bestand
// (hoofdstuk 14) — expliciet tunebaar genoemd in het issue dat deze feature
// aanvroeg. Was 40% op alleen de frontier-streek; nu 20% verspreid over alle
// ontgrendelde streken (issue: "elke nieuwe streek maakt een eerder gebouwde
// wachttoren waardeloos, en 40% per beurt op één streek is erg hoog").
const INDRINGERS_KANS = 0.2;

// Het mechanisme is pas een factor zodra deze streek ontgrendeld is — terug
// naar streek 3 (issue: "Tweede streek boerderij", was tijdelijk streek 2
// sinds "het mechanisme start pas zodra de speler streek 2 heeft
// ontgrendeld"): streek 2 introduceert nu alleen de Boerderij (zie
// improvements.ts), zodat de speler daar eerst een tweede voedselbron kan
// opbouwen vóórdat indringers (en de bijbehorende, voedsel-etende Wachttoren,
// ook verschoven naar streek 3) een factor worden.
const INDRINGERS_MIN_STREEK = 3;

// Eerste rogue-like bonus/malus-koppeling (hoofdstuk 6/11/14, issue:
// "Amberader: bonus/malus-koppeling" — waardevolle vondsten trekken ook
// ongewenste aandacht): een streek met een actieve Amberader weegt zwaarder mee
// in de streek-trekking hieronder dan een gewone streek — voorstel 2x zo
// waarschijnlijk om geloot te worden. MVP-richtwaarde, tunebaar. Vergroot
// alleen de kans dat de streek geloot wordt, niet de uitkomst daarna: een
// beschermende Wachttoren op die streek houdt het incident nog steeds tegen
// (`heeftBeschermendeWachttoren` hieronder blijft ongewijzigd die uitkomst
// bepalen). Bewust klein gehouden en volledig gebouwd op de bestaande
// Amberader- en indringers-trekking-systemen, zonder nieuw framework — zie
// hoofdstuk 11 voor de volledige onderbouwing.
const AMBERADER_INDRINGERS_GEWICHT = 2;

// Tweede rogue-like bonus/malus-koppeling (hoofdstuk 6/11/14, issue:
// "wachttorens kunnen vernietigd worden door indringers"): een beschermde
// streek (frontier of niet) houdt niet langer altijd zomaar stand — een derde
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

// Wampum-afkoop (issue "Wampum — invallen tijdelijk afkopen"): een generiek,
// niet aan één specifieke stam gekoppeld derde alternatief naast
// `geefTribuut`/`weigerTribuut` hieronder — de speler koopt met wampum
// tijdelijke rust van dezelfde stam die net het incident veroorzaakte, in
// plaats van tribuut te geven of te weigeren. Werkt voor elke huidige/
// toekomstige stam-namenpool (`CampaignConfig.indringersStamNamen`/
// `indringersStamNamenNaVerbond`, campagnes.ts) zonder wijziging, want
// gesleuteld op de al bestaande `IndringersEvent.stamNaam` in plaats van op
// een hardcoded stamnaam. Alleen beschikbaar ná het Wampanoag-verbond
// (`heeftWampanoagVerbond`, wampanoag.ts) — expliciet gevraagd in het issue:
// "mag pas in effect gaan op het moment dat de Wampanoag zijn gepacificeerd".
// MVP-richtwaarde, tunebaar (issue noemt 5-8 beurten).
const WAMPUM_AFKOOP_RUST_BEURTEN = 6;

// Oplopende kostenreeks per stam (issue: "3 wampum (eerste keer), 5 (tweede
// keer), 8 (derde keer), daarna verder oplopend volgens een vaste curve"):
// de eerste drie afkopen bij dezelfde stam volgen de vaste reeks hieronder,
// elke afkoop daarna kost `WAMPUM_AFKOOP_KOSTEN_STAP` méér dan de vorige —
// lineair oplopend (het issue vraagt geen kwadratische curve zoals
// `cultuurKostenVoorStreek`/`wetenschapKostenVoorDrempel`, world.ts/techTree.ts,
// alleen "vergelijkbaar met hoe andere oplopende kosten al zijn opgebouwd").
const WAMPUM_AFKOOP_KOSTEN_REEKS = [3, 5, 8];
const WAMPUM_AFKOOP_KOSTEN_STAP = 4;

// Kosten van de vólgende afkoop bij een stam die al `aantalAlAfgekocht` keer
// eerder afgekocht is (0 = nog nooit) — pure functie, geen state nodig.
export function wampumAfkoopKosten(aantalAlAfgekocht: number): number {
  if (aantalAlAfgekocht < WAMPUM_AFKOOP_KOSTEN_REEKS.length) {
    return WAMPUM_AFKOOP_KOSTEN_REEKS[aantalAlAfgekocht];
  }
  const extraKeerBovenReeks = aantalAlAfgekocht - WAMPUM_AFKOOP_KOSTEN_REEKS.length + 1;
  return WAMPUM_AFKOOP_KOSTEN_REEKS[WAMPUM_AFKOOP_KOSTEN_REEKS.length - 1] + WAMPUM_AFKOOP_KOSTEN_STAP * extraKeerBovenReeks;
}

// Status van een stam in `GameState.wampumAfkoopPerStam` — ontbreekt de stam
// nog in die map, dan betekent dat "nog nooit afgekocht, geen rust actief".
function wampumAfkoopStatusVoorStam(state: GameState, stamNaam: string): WampumAfkoopStatus {
  return state.wampumAfkoopPerStam[stamNaam] ?? { aantalAfgekocht: 0, rustTotBeurt: 0 };
}

// Of deze stam op dit moment "rust" heeft na een eerdere afkoop — gebruikt
// door `verwerkIndringers` hieronder om de stam-namenpool te filteren vóór de
// trekking, zodat een afgekochte stam geen nieuw incident veroorzaakt totdat
// de rustperiode voorbij is.
function heeftWampumAfkoopRust(state: GameState, stamNaam: string): boolean {
  return wampumAfkoopStatusVoorStam(state, stamNaam).rustTotBeurt > state.beurt;
}

// Kuddes verschijnen vanaf `KUDDE_MIN_STREEK` (issue: "jagen en farmen
// omdraaien" — de jacht is nu vanaf streek 1 de eerste voedselbron, dus
// kuddes moeten daar al kunnen verschijnen; was voorheen streek 4). KUDDE_KANS
// verstreekd van 0,15 naar 0,05 (issue: "kudde frequentie verstreken") — bij
// de oude 15%/beurt, zonder natuurlijk verval van een ongejaagde kudde
// (alleen leegjagen of overbouwen verwijdert er een), stapelden kuddes zich
// in de praktijk sneller op dan een actief jagende speler kon bijhouden. Zie
// hoofdstuk 14 voor de doorrekening.
const KUDDE_MIN_STREEK = 1;
const KUDDE_KANS = 0.05;

// Een Wachttoren beschermt de streek waarop hij staat alleen als hij voltooid,
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
export function isWachttorenBemand(strijders: Strijder[], hoogte: number, positieInStreek: number): boolean {
  return strijders.some(
    (strijder) => strijder.wachttoren?.hoogte === hoogte && strijder.wachttoren?.positieInStreek === positieInStreek
  );
}

function vindWerkendeWachttorenTile(state: GameState, streek: Streek): Tile | undefined {
  return streek.tiles.find(
    (tile) =>
      tile.status === "actief" &&
      tile.improvement?.id === "wachttoren" &&
      isWachttorenBemand(state.stad.strijders, streek.hoogte, tile.positieInStreek) &&
      isTileVerbondenMetStad(state.streken, streek.hoogte, tile.positieInStreek)
  );
}

export function heeftWerkendeWachttorenOpStreek(state: GameState, streek: Streek): boolean {
  return vindWerkendeWachttorenTile(state, streek) !== undefined;
}

// De specifieke streek+tile van de Wachttoren die `streek` beschermt: op de streek
// zelf, of anders (issue: "wachttoren beschermt 2 streken") op de streek erboven
// — nooit de streek eronder. Een toren beschermt dus zijn eigen streek én de streek
// daaronder, nooit de streek erboven — dat blijft aan een eigen toren op die
// hogere streek. Gebruikt door zowel `heeftBeschermendeWachttoren` hieronder
// als de nieuwe malus-uitkomst (issue: "wachttorens kunnen vernietigd worden
// door indringers"), die precies déze Wachttoren tot ruïne laat vervallen.
function vindBeschermendeWachttoren(state: GameState, streek: Streek): { streek: Streek; tile: Tile } | undefined {
  const opStreekZelf = vindWerkendeWachttorenTile(state, streek);
  if (opStreekZelf) return { streek, tile: opStreekZelf };

  const streekErboven = state.streken.find((l) => l.hoogte === streek.hoogte + 1);
  if (!streekErboven) return undefined;
  const opStreekErboven = vindWerkendeWachttorenTile(state, streekErboven);
  return opStreekErboven ? { streek: streekErboven, tile: opStreekErboven } : undefined;
}

function heeftBeschermendeWachttoren(state: GameState, streek: Streek): boolean {
  return vindBeschermendeWachttoren(state, streek) !== undefined;
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

// Een streek is alleen "interessant" voor indringers als er iets te halen valt
// (hoofdstuk 6/11, issue: "een streek met alleen een wachttoren kan geen
// indringers krijgen"). Staat er op een streek uitsluitend een Wachttoren — en
// verder geen enkele andere improvement en geen ghost town — dan doet die
// streek niet mee in de trekking, ongeacht de staat van die Wachttoren (ook in
// aanbouw of nog niet bemand telt niet mee): een kale wachtpost biedt geen
// aanleiding. Een compleet lege streek (nog geen enkele improvement, bv. een
// net ontgrendelde streek) telt hier niet als "alleen een wachttoren" en blijft
// dus gewoon meedoen, net als streken met alleen ghost towns en de startstreek —
// die regel is ongewijzigd. Is de Wachttoren op zo'n streek daarnaast ook nog
// beschermend (voltooid, bemand, verbonden), dan verandert dat hier niets:
// zo'n streek heeft dan alsnog niets anders te bieden en blijft uitgesloten.
function isAlleenWachttorenStreek(streek: Streek): boolean {
  let heeftWachttoren = false;
  for (const tile of streek.tiles) {
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

// Een streek heeft een *actieve* Amberader (gebouwd, nog niet uitgeput) zolang
// er een tile met de `goudmijn`-improvement (interne sleutel, zie
// `improvements.ts`) in status `actief` op staat. Eenmaal uitgeput wordt zo'n
// tile `ghost_town` (zie `verwerkUitputting` in uitputtingEnVerval.ts) en
// telt hij hier niet meer mee — een lege put trekt geen indringers meer aan
// (hoofdstuk 6/11/14).
function heeftActieveAmberader(streek: Streek): boolean {
  return streek.tiles.some((tile) => tile.status === "actief" && tile.improvement?.id === "goudmijn");
}

// Gewicht van `streek` in de indringers-streek-trekking hieronder: een streek met
// een actieve Amberader (zie hierboven) weegt `AMBERADER_INDRINGERS_GEWICHT`
// keer zo zwaar als een gewone streek.
function indringersGewicht(streek: Streek): number {
  return heeftActieveAmberader(streek) ? AMBERADER_INDRINGERS_GEWICHT : 1;
}

// Loot de derde-uitkomst voor een beschermde streek (hoofdstuk 6/14, issue:
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
// Confrontatie tegen een Bezette Streek (`confrontatieBezetteStreek` in
// militair.ts) — de beschermende Wachttoren-tile wordt een ruïne (op dezelfde
// plek herbouwbaar tegen de normale kosten/bouwtijd) en de strijder die hem
// bemande is blijvend verloren, geen reassignment.
function verwerkWachttorenOverrompeling(
  state: GameState,
  beschermendeWachttoren: { streek: Streek; tile: Tile }
): GameState {
  const { streek, tile } = beschermendeWachttoren;
  const bemanner = state.stad.strijders.find(
    (s) => s.wachttoren?.hoogte === streek.hoogte && s.wachttoren?.positieInStreek === tile.positieInStreek
  );
  const strijders = bemanner ? state.stad.strijders.filter((s) => s.id !== bemanner.id) : state.stad.strijders;

  const streken = state.streken.map((l) =>
    l.hoogte !== streek.hoogte
      ? l
      : {
          ...l,
          tiles: l.tiles.map((t, i) =>
            i === tile.positieInStreek
              ? { ...t, status: "ruine" as const, improvement: undefined, beurtenTotUitputting: undefined }
              : t
          ),
        }
  );

  return { ...metActieveStad(state, { ...state.stad, strijders }), streken };
}

// Indringers & tribuut (hoofdstuk 6): elke beurt is er, zodra streek
// `INDRINGERS_MIN_STREEK` ontgrendeld is, één trekking of er sowieso een
// incident plaatsvindt — niet meer per streek. Is er een incident, dan wordt de
// getroffen streek geloot uit alle ontgrendelde streken die iets te bieden hebben
// (issue: "loot dan de streek uit álle ontgrendelde streken — ook streken die
// beschermd zijn", later verfijnd met `isAlleenWachttorenStreek` hierboven),
// zodat elke gebouwde, bemande en verbonden Wachttoren zijn hele run lang
// waarde houdt in plaats van waardeloos te worden zodra de frontier opschuift.
// Een beschermende Wachttoren op de geloten streek verdedigt de streek meestal
// gewoon (issue: "wachttorens kunnen vernietigd worden door indringers" —
// `bepaalIndringersUitkomst` hierboven loot hier nu de derde uitkomst, ook op
// de frontier-streek zelf: meestal stand houden, soms een malus, zelden een
// bonus). Zonder zo'n wachttoren eist de tribe tribuut (zie `kiesTribuut`); de
// speler lost dit verder zelf op via `geefTribuut`/`weigerTribuut` hieronder.
// Een streek met een actieve Amberader krijgt bovendien altijd eerst een eigen
// aankondiging (`amberOnderVuur`/fase "amber-onder-vuur"), los van de
// uitkomst — ook bij de gewone tribuut-afhandeling. Rolt geen nieuwe
// gebeurtenis zolang een vorige melding nog open staat.
export function verwerkIndringers(state: GameState): GameState {
  if (state.indringersEvent) return state;
  if (hoogsteOntgrendeldeStreek(state.streken) < INDRINGERS_MIN_STREEK) return state;
  if (Math.random() >= INDRINGERS_KANS) return state;

  // Na het Wampanoag-verbond (Going West, issue "Na de Wampanoag", M22): de
  // Wampanoag zijn nu bondgenoten, dus hun voormalige invalsgebied (streken
  // tot en met `indringersUitgeslotenTotHoogteNaVerbond`) doet niet meer mee
  // in de trekking hieronder — puur Going-West-specifiek via `CampaignConfig`,
  // ontbreekt het veld (elke andere campagne, of de tutorial, die overigens
  // altijd op `cultureelOntgrendeld: true` start maar geen eigen
  // `CampaignConfig` heeft), dan verandert hier niets.
  const campagne = campagneConfig(state.campagneId);
  const naVerbond = state.cultureelOntgrendeld && campagne?.indringersUitgeslotenTotHoogteNaVerbond !== undefined;

  const ontgrendeldeStreken = state.streken.filter(
    (streek) =>
      streek.ontgrendeld &&
      !isAlleenWachttorenStreek(streek) &&
      !(naVerbond && streek.hoogte <= campagne!.indringersUitgeslotenTotHoogteNaVerbond!)
  );
  if (ontgrendeldeStreken.length === 0) return state;

  // Gewogen trekking (issue: "Amberader: bonus/malus-koppeling") in plaats
  // van een zuiver uniforme trekking — streken met een actieve Amberader tellen
  // hier zwaarder mee, zie `indringersGewicht` hierboven.
  const gewichten = ontgrendeldeStreken.map(indringersGewicht);
  const totaalGewicht = gewichten.reduce((som, gewicht) => som + gewicht, 0);
  let punt = Math.random() * totaalGewicht;
  let streek = ontgrendeldeStreken[ontgrendeldeStreken.length - 1];
  for (let i = 0; i < ontgrendeldeStreken.length; i++) {
    punt -= gewichten[i];
    if (punt < 0) {
      streek = ontgrendeldeStreken[i];
      break;
    }
  }
  // Campagne-afhankelijke stam-naam (issue "Going west: indringers",
  // `CampaignConfig.indringersStamNamen`, campagnes.ts) — zelfde terugval-
  // patroon als `improvementNaam()`/`techNaam()`: ontbreekt de override (zoals
  // in de tutorial), dan valt dit terug op de generieke fictieve pool. Ná het
  // Wampanoag-verbond (`naVerbond` hierboven) nemen de nieuwe stammen het over
  // (issue "Na de Wampanoag", M22), met dezelfde terugval als er geen eigen
  // na-verbond-pool is.
  const stamNamenPool =
    (naVerbond ? campagne?.indringersStamNamenNaVerbond : undefined) ?? campagne?.indringersStamNamen ?? INDRINGERS_STAMMEN;
  // Wampum-afkoop (issue "Wampum — invallen tijdelijk afkopen"): een stam die
  // nog "rust" heeft na een eerdere afkoop doet niet mee in deze trekking —
  // filteren behoudt de volgorde van de pool, dus zolang geen enkele stam rust
  // heeft (het gangbare geval) verandert hier niets aan de bestaande trekking.
  const beschikbareStamNamen = stamNamenPool.filter((naam) => !heeftWampumAfkoopRust(state, naam));
  if (beschikbareStamNamen.length === 0) return state;
  const stamNaam = beschikbareStamNamen[Math.floor(Math.random() * beschikbareStamNamen.length)];
  const amberOnderVuur = heeftActieveAmberader(streek) || undefined;

  const beschermendeWachttoren = vindBeschermendeWachttoren(state, streek);
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
        streekHoogte: streek.hoogte,
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
      streekHoogte: streek.hoogte,
      stamNaam,
      heeftWachttoren: false,
      tribuut,
      amberOnderVuur,
      fase: amberOnderVuur ? "amber-onder-vuur" : "gemeld",
    },
  };
}

// Spawnt per beurt met een kleine kans een nieuwe wilde kudde (hoofdstuk
// 16/17) op een leeg, nog-kuddeloos vakje van een ontgrendelde streek vanaf
// `KUDDE_MIN_STREEK`. Net als `verwerkIndringers` hierboven: hoogstens één
// nieuwe kudde per beurt, geen limiet op het totaal aantal tegelijk
// aanwezige kuddes.
export function verwerkKuddes(state: GameState): GameState {
  if (hoogsteOntgrendeldeStreek(state.streken) < KUDDE_MIN_STREEK) return state;
  // "A2a. Veeteelt" (hoofdstuk 3/9, techTree.ts): kuddes verschijnen vaker.
  if (Math.random() >= KUDDE_KANS * kuddeKansFactor(state.technologieen)) return state;

  const kandidaten: { hoogte: number; positieInStreek: number }[] = [];
  for (const streek of state.streken) {
    if (!streek.ontgrendeld || streek.hoogte < KUDDE_MIN_STREEK) continue;
    // Streek 1 blijft gesloten voor de willekeurige trekking tot de
    // gegarandeerde eerste kudde er geweest is (issue: "genoeg hout om ook
    // boerderij te bouwen" — de kudde mag hier pas verschijnen ná de
    // Steengroeve, zie `verwerkEersteKudde` hieronder). Zonder deze
    // uitzondering zou een gunstige worp alsnog voortijdig een kudde op
    // streek 1 kunnen neerzetten, nog vóór de speler de Steengroeve heeft.
    if (streek.hoogte === 1 && !state.eersteKuddeVerschenen) continue;
    for (const tile of streek.tiles) {
      if (tile.status === "leeg" && !tile.kudde) {
        kandidaten.push({ hoogte: streek.hoogte, positieInStreek: tile.positieInStreek });
      }
    }
  }
  if (kandidaten.length === 0) return state;

  const doel = kandidaten[Math.floor(Math.random() * kandidaten.length)];
  const streken = state.streken.map((streek) => {
    if (streek.hoogte !== doel.hoogte) return streek;
    const tiles = streek.tiles.map((tile, index) =>
      index === doel.positieInStreek
        ? { ...tile, kudde: { beurtenResterend: kuddeJachtBeurtenVoorStreek(streek.hoogte) } }
        : tile
    );
    return { ...streek, tiles };
  });

  // Meldt de nieuwe kudde meteen (hoofdstuk 17: "dezelfde stijl als de
  // indringers-pop-up"), zodat de speler niet toevallig op de kaart hoeft te
  // zien waar hij de settler heen kan sturen om te jagen.
  const kuddeEvent: KuddeEvent = { hoogte: doel.hoogte, positieInStreek: doel.positieInStreek };

  return { ...state, streken, kuddeEvent };
}

// Minimum aantal gelijktijdig actieve kuddes zolang de Bezette Streek-
// confrontatie loopt, zie `verwerkConfrontatieKuddes` hieronder.
const CONFRONTATIE_KUDDE_MINIMUM = 2;

// Gegarandeerde kuddes tijdens de Confrontatie (hoofdstuk 6/14/17, issue:
// "kuddes op de laatste laag" — tijdens de confrontatie op de Bezette Streek
// (streek 13, `Streek.bezet`) werd voedsel een te groot probleem). De Bezette
// Streek zelf telt niet mee in de gewone `verwerkKuddes`-trekking hierboven
// (die loopt alleen over al *ontgrendelde* streken, en deze streek ontgrendelt
// pas zodra de confrontatie voorbij is), dus zonder deze garantie hangt
// voedsel tijdens de zwaarste fase van de tutorial volledig af van de kansen
// op eerder ontgrendelde streken. Zelfde garantie-patroon als
// `verwerkEersteKudde`: bovenop de gewone kans-gebaseerde spawn, niet in
// plaats daarvan, en hoogstens één kudde per beurt bijgeplaatst — zo blijft er
// altijd 1 of 2 kuddes tegelijk aanwezig in plaats van precies op dit moment
// eventueel nul.
export function verwerkConfrontatieKuddes(state: GameState): GameState {
  if (!state.streken.some((streek) => streek.bezet)) return state;

  const actieveKuddes = state.streken.reduce(
    (totaal, streek) => totaal + streek.tiles.filter((tile) => tile.kudde).length,
    0
  );
  if (actieveKuddes >= CONFRONTATIE_KUDDE_MINIMUM) return state;

  const kandidaten: { hoogte: number; positieInStreek: number }[] = [];
  for (const streek of state.streken) {
    if (!streek.ontgrendeld) continue;
    for (const tile of streek.tiles) {
      if (tile.status === "leeg" && !tile.kudde) {
        kandidaten.push({ hoogte: streek.hoogte, positieInStreek: tile.positieInStreek });
      }
    }
  }
  if (kandidaten.length === 0) return state;

  const doel = kandidaten[Math.floor(Math.random() * kandidaten.length)];
  const streken = state.streken.map((streek) => {
    if (streek.hoogte !== doel.hoogte) return streek;
    const tiles = streek.tiles.map((tile, index) =>
      index === doel.positieInStreek
        ? { ...tile, kudde: { beurtenResterend: kuddeJachtBeurtenVoorStreek(streek.hoogte) } }
        : tile
    );
    return { ...streek, tiles };
  });

  // Geen nieuwe melding als deze beurt al een kuddeEvent gemeld werd (bv. door
  // `verwerkKuddes` hierboven) — puur de state-mutatie hoeft niet twee keer
  // achter elkaar dezelfde soort pop-up te tonen.
  const kuddeEvent: KuddeEvent = state.kuddeEvent ?? { hoogte: doel.hoogte, positieInStreek: doel.positieInStreek };

  return { ...state, streken, kuddeEvent };
}

// Gegarandeerde eerste kudde op streek 1 (issue: "genoeg hout om ook
// boerderij te bouwen" — vervangt de eerdere direct-bij-de-start-garantie uit
// issue "Eerste streek gegarandeerd een kudde"): zodra de Steengroeve op
// streek 1 voltooid is, staat de kudde er sowieso, dezelfde
// softlock-preventie als voorheen (jacht is de enige voedselbron tot de
// Boerderij op streek 2) — alleen nu bewust pas ná die eerste bouwkeuze, in
// plaats van al bij de allereerste blik op de kaart. `eersteKuddeVerschenen`
// (types.ts) zorgt dat dit precies één keer gebeurt: zonder die vlag zou deze
// functie elke volgende beurt opnieuw een kudde neerzetten zodra de vorige is
// leeggejaagd, want de Steengroeve blijft daarna gewoon actief staan.
export function verwerkEersteKudde(state: GameState): GameState {
  if (state.eersteKuddeVerschenen) return state;

  const streek1 = state.streken.find((streek) => streek.hoogte === 1);
  const steengroeveKlaar = streek1?.tiles.some(
    (tile) => tile.status === "actief" && tile.improvement?.id === "steengroeve"
  );
  if (!steengroeveKlaar) return state;

  const streken = state.streken.map((streek) =>
    streek.hoogte !== 1
      ? streek
      : {
          ...streek,
          tiles: streek.tiles.map((tile, index) =>
            index === STARTKUDDE_POSITIE
              ? { ...tile, kudde: { beurtenResterend: kuddeJachtBeurtenVoorStreek(1) } }
              : tile
          ),
        }
  );

  const kuddeEvent: KuddeEvent = { hoogte: 1, positieInStreek: STARTKUDDE_POSITIE };
  return { ...state, streken, eersteKuddeVerschenen: true, kuddeEvent };
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
//
// Tweede settler (issue: "Altijd 2e settler" #236): een roofdier-aanval kan
// in principe elke settler treffen die op het aangevallen vakje staat, dus
// beide slots worden onafhankelijk gecheckt (`settlerVerlorenAanRoofdier`
// blijft alleen van toepassing op de eerste/primaire settler — dat vlag
// bestaat puur om te voorkomen dat hij gratis terugkomt op beurt 2, wat voor
// de tweede settler toch al nooit gebeurt, zie `volgendeBeurt`).
export function verwerkRoofdieren(state: GameState): GameState {
  let settler = state.settler;
  let tweedeSettler = state.tweedeSettler;
  let settlerVerlorenAanRoofdier = state.settlerVerlorenAanRoofdier;
  let roofdierEvent = state.roofdierEvent;

  const streken = state.streken.map((streek) => {
    const tiles = streek.tiles.map((tile) => {
      if (!tile.roofdier) return tile;

      if (tile.roofdier.beurtenTotAanval > 0) {
        return { ...tile, roofdier: { beurtenTotAanval: tile.roofdier.beurtenTotAanval - 1 } };
      }

      const opPlek = (positie?: { hoogte: number; positieInStreek: number }) =>
        positie?.hoogte === streek.hoogte && positie?.positieInStreek === tile.positieInStreek;

      let geraakt = false;
      if (opPlek(state.settler)) {
        settler = undefined;
        settlerVerlorenAanRoofdier = true;
        geraakt = true;
      }
      if (opPlek(state.tweedeSettler)) {
        tweedeSettler = undefined;
        geraakt = true;
      }
      if (geraakt) {
        roofdierEvent = { hoogte: streek.hoogte, positieInStreek: tile.positieInStreek, fase: "aanval" };
      }
      return { ...tile, roofdier: undefined };
    });
    return { ...streek, tiles };
  });

  return { ...state, streken, settler, tweedeSettler, settlerVerlorenAanRoofdier, roofdierEvent };
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

// Weigert het tribuut (hoofdstuk 6, issue: "indringers pakken altijd tribuut,
// geen stad-vernietiging"): weigeren heeft bewust hetzelfde gevolg als geven
// — er is geen "stad vernietigd"-uitkomst, ook niet zodra er meerdere steden
// bestaan (hoofdstuk 9). Het tribuut wordt hoe dan ook alsnog opgeëist, wat
// hier eerst zichtbaar wordt gemaakt (`fase: "geforceerd"`) zodat de pop-up
// dat kan uitleggen vóór de speler `geefTribuut` hieronder afrondt.
export function weigerTribuut(state: GameState): GameState {
  const event = state.indringersEvent;
  if (!event?.tribuut) return state;
  return { ...state, indringersEvent: { ...event, fase: "geforceerd" } };
}

// Geeft (bewust vanuit `fase: "gemeld"`, of afgedwongen vanuit `fase:
// "geforceerd"` na `weigerTribuut` hierboven) het geëiste tribuut: trekt het
// direct van de gedeelde opslag af (nooit onder nul) én sluit de melding in
// dezelfde stap (issue: "Indringers 2e pop-up samenvoegen" — voorheen ging
// dit via een tussenliggend `fase: "betaald"`-bevestigingsscherm dat de
// afschrijving pas bij het sluiten daarvan deed; dat scherm voegde niets toe
// aan wat de "gemeld"/"geforceerd"-tekst al meldde).
export function geefTribuut(state: GameState): GameState {
  const event = state.indringersEvent;
  if (!event?.tribuut) return state;

  const voorraad = { ...state.voorraad };
  voorraad[event.tribuut.resource] = Math.max(0, voorraad[event.tribuut.resource] - event.tribuut.aantal);

  // Historiescherm-statistieken (issue: "hoevaak tribuut gegeven is (met
  // exacte aantallen voorraad tribuut)").
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

// Of de wampum-afkoop-keuze (IndringersPopup.tsx) getoond moet worden naast
// de bestaande tribuut-knoppen (issue "Wampum — invallen tijdelijk afkopen").
// Zelfde tak als de tribuut-keuze zelf (`fase: "gemeld"`, geen Wachttoren) —
// een reeds afgeslagen of al afgedwongen (`fase: "geforceerd"`) incident kent
// geen keuze meer. Los daarvan pas beschikbaar ná het Wampanoag-verbond
// (`heeftWampanoagVerbond`), expliciet gevraagd in het issue. Zegt niets over
// of de speler het zich kan veroorloven — zie `wampumAfkoopKostenHuidig`
// hieronder, de UI disablet de knop zelf bij onvoldoende voorraad.
export function kanIndringersAfkopenMetWampum(state: GameState): boolean {
  const event = state.indringersEvent;
  return Boolean(event && !event.heeftWachttoren && event.tribuut && event.fase === "gemeld" && heeftWampanoagVerbond(state));
}

// Kosten van de afkoop van het huidige incident (alleen zinvol op te vragen
// als `kanIndringersAfkopenMetWampum` hierboven `true` teruggeeft) — puur
// afgeleid van hoe vaak déze stam al eerder afgekocht is, geen state-mutatie.
export function wampumAfkoopKostenHuidig(state: GameState): number {
  const stamNaam = state.indringersEvent?.stamNaam;
  if (!stamNaam) return 0;
  return wampumAfkoopKosten(wampumAfkoopStatusVoorStam(state, stamNaam).aantalAfgekocht);
}

// Koopt het huidige incident af met wampum (issue "Wampum — invallen
// tijdelijk afkopen"): generiek derde alternatief naast `geefTribuut`/
// `weigerTribuut` hierboven. Trekt de oplopende kosten direct van de
// wampum-voorraad af, sluit de melding, en geeft exact déze stam een
// tijdelijke rust van `WAMPUM_AFKOOP_RUST_BEURTEN` beurten (zie het filter in
// `verwerkIndringers` hierboven) — een andere stam blijft onaangetast, ook al
// deelt die een andere naam uit dezelfde of een latere pool
// (`indringersStamNamenNaVerbond`). Negeert de aanroep stilzwijgend als de
// keuze niet getoond zou worden (`kanIndringersAfkopenMetWampum`) of de
// speler het zich niet kan veroorloven — zelfde veilige-aanroep-conventie als
// de rest van dit bestand.
export function koopIndringersAfMetWampum(state: GameState): GameState {
  if (!kanIndringersAfkopenMetWampum(state)) return state;
  const event = state.indringersEvent!;

  const status = wampumAfkoopStatusVoorStam(state, event.stamNaam);
  const kosten = wampumAfkoopKosten(status.aantalAfgekocht);
  if (state.wampum < kosten) return state;

  return {
    ...state,
    wampum: state.wampum - kosten,
    wampumAfkoopPerStam: {
      ...state.wampumAfkoopPerStam,
      [event.stamNaam]: {
        aantalAfgekocht: status.aantalAfgekocht + 1,
        rustTotBeurt: state.beurt + WAMPUM_AFKOOP_RUST_BEURTEN,
      },
    },
    // Niet meteen wissen (vergelijk `geefTribuut` hierboven) — de pop-up toont
    // eerst nog een korte bevestiging (issue), pas `sluitIndringersMelding`
    // wist het event echt.
    indringersEvent: { ...event, fase: "wampum-afgekocht" },
  };
}
