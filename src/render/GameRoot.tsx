"use client";

import { useEffect, useRef, useState } from "react";
import BoerderijKlaarUitlegPopup from "@/components/BoerderijKlaarUitlegPopup";
import BouwPopup from "@/components/BouwPopup";
import HistoriePaneel from "@/components/HistoriePaneel";
import HoofdMenu from "@/components/HoofdMenu";
import IndringersPopup from "@/components/IndringersPopup";
import IneenstortingScherm from "@/components/IneenstortingScherm";
import IntroScherm from "@/components/IntroScherm";
import KuddePopup from "@/components/KuddePopup";
import LaagIntroPaneel from "@/components/LaagIntroPaneel";
import LaagPopup from "@/components/LaagPopup";
import MilitairUitlegPopup from "@/components/MilitairUitlegPopup";
import ResourceHud from "@/components/ResourceHud";
import RoofdierPopup from "@/components/RoofdierPopup";
import SettlerPaneel from "@/components/SettlerPaneel";
import SettlerUitlegPopup from "@/components/SettlerUitlegPopup";
import SpelActiesMenu from "@/components/SpelActiesMenu";
import StadMenuPopup from "@/components/StadMenuPopup";
import StadUpgradeUitlegPopup from "@/components/StadUpgradeUitlegPopup";
import StichtStadPopup from "@/components/StichtStadPopup";
import TechKeuzePopup from "@/components/TechKeuzePopup";
import TileInfoPopup from "@/components/TileInfoPopup";
import TutorialVoltooidPopup from "@/components/TutorialVoltooidPopup";
import UitlegPopup from "@/components/UitlegPopup";
import VoedselWaarschuwingPopup from "@/components/VoedselWaarschuwingPopup";
import VolgendeBeurtWaarschuwingPopup from "@/components/VolgendeBeurtWaarschuwingPopup";
import WachttorenKiesBanner from "@/components/WachttorenKiesBanner";
import {
  berekenHistorieStatistieken,
  berekenLegerwaarde,
  heeftWerkendeBoerderij,
  onbemandeWachttorenPosities,
} from "@/game/economie";
import { improvementPastOpTerrein, terreinEisenBeschrijving } from "@/game/improvements";
import { heeftOpgeslagenSpel, markeerTutorialVoltooid } from "@/game/save";
import { beschrijfOceaanTile, beschrijfTile } from "@/game/tileInfo";
import { Improvement } from "@/game/types";
import { useGameEngine } from "@/game/useGameEngine";
import { bereikbarePosities } from "@/game/wegen";
import { TUTORIAL_LAAG_AANTAL, VOEDSEL_DREMPEL_GROEI, hoogsteOntgrendeldeLaag, zichtbareLagen } from "@/game/world";
import GameCanvas from "./GameCanvas";

interface GameRootProps {
  // Terug naar het startscherm (issue: "spel verlaten, waarmee je weer naar
  // het start scherm gaat") — navigatie zelf blijft bij AppRoot, GameRoot
  // roept dit alleen aan.
  onVerlaten: () => void;
  // Terug naar het campagnemenu (hoofdstuk 2/10/16, issue: "stad stichten op
  // de frontier" deel 4: "daarna het campagnemenu") — aangeroepen zodra de
  // speler de tutorial-voltooid-samenvatting wegklikt na het stichten van
  // een nieuwe stad. Los van `onVerlaten` hierboven, dat naar het titelscherm
  // gaat.
  onTutorialAfgerond: () => void;
}

// Verbindt de spelstatus (M3: resource-economie) met de HUD, de
// tutorial-flavor (M8), de bouw-pop-up, het groei/verval-paneel (M6), het
// militair-paneel (M7) en de canvas-rendering.
//
// Layout: een schermvullende kolom (`.game-viewport`) met een intern
// scrollend gebied (`.game-scroll-area`, canvas + info-panelen) en de
// grondstoffenbalk als vaste footer eronder — die scrolt dus nooit mee weg en
// de stad staat meteen in beeld zonder te scrollen (issue: sticky
// grondstoffenbalk onderaan, stad direct zichtbaar).
export default function GameRoot({ onVerlaten, onTutorialAfgerond }: GameRootProps) {
  const {
    state,
    volgendeBeurt,
    startBouw,
    sluitBouwKeuze,
    startGroei,
    startNieuweSettler,
    startOpslagplaats,
    stichtStad,
    startRecrutering,
    confrontatie,
    verplaatsSettlerNaar,
    legWegAan,
    jaag,
    hakHout,
    sluitIndringersMelding,
    sluitKuddeMelding,
    sluitRoofdierMelding,
    geefTribuut,
    kiesGeefTribuut,
    weigerTribuut,
    bevestigGedwongenTribuut,
    bemanWachttoren,
    haalStrijderTerug,
    zetUitlegPopups,
    kiesTech,
    opslaan,
    laden,
  } = useGameEngine();

  // Historiescherm is een losse volledig-schermige pop-up, geen aan/uit-paneel.
  const [toonHistorie, setToonHistorie] = useState(false);

  // Stadsmenu-pop-up (issue: "city improvement menu toevoegen"): bundelt alle
  // stad-acties (civiel/groei, opslagplaats, militair) die voorheen als losse
  // dozen constant in beeld stonden. Opent zodra de speler op de stad-tile
  // klikt (zie `handleTileClick` hieronder) — het militair-paneel hoeft
  // hierdoor niet meer apart getoggled te worden via SpelActiesMenu.
  const [toonStadMenuPopup, setToonStadMenuPopup] = useState(false);

  // Introscherm (issue: "intro en game over scherm"): getoond bij elke start
  // van de tutorial vanuit het menu — niet slechts één keer per browser, zodat
  // de speler 'm ook ziet als hij de tutorial via het campagnemenu opnieuw
  // opstart (issue: "als ik de tutorial aanklik vanuit het menu, zie ik het
  // introscherm niet meer").
  const [toonIntro, setToonIntro] = useState(true);

  function bevestigIntro() {
    setToonIntro(false);
  }

  // Laag-popup (issue: "als je naar een nieuwe laag gaat, een popup vóór het
  // bouwcategorie-schermpje"): zodra de hoogst ontgrendelde laag verder komt
  // dan de laatst bevestigde, blokkeert deze popup de bouw-pop-up totdat de
  // speler 'm wegklikt. Begint op 1 (de startlaag, al geïntroduceerd via
  // IntroScherm) zodat hij niet meteen bij de eerste laag verschijnt.
  const [laatstBevestigdeLaag, setLaatstBevestigdeLaag] = useState(1);

  // Openings-uitleg-pop-up (issue: "uitleg pop-ups dynamisch tonen"): los van
  // de laag-popup hierboven, toont dit één vaste pop-up bij het begin van
  // beurt 1 — een eenmalige-confirm-vlag, zelfde patroon als de overige
  // uitleg-pop-ups hieronder (settler/voedsel/boerderij/militair).
  const [openingsUitlegBevestigd, setOpeningsUitlegBevestigd] = useState(false);

  // Militaire-uitleg-pop-up en tutorial-voltooid-pop-up (issue: "pop-up met
  // uitleg over de militaire confrontatie" + "pop-up met summary na het
  // halen ervan"): allebei eenmalige confirm-vlaggen per sessie, zelfde
  // patroon als `laatstBevestigdeLaag` hierboven.
  const [militairUitlegBevestigd, setMilitairUitlegBevestigd] = useState(false);
  const [tutorialVoltooidBevestigd, setTutorialVoltooidBevestigd] = useState(false);
  // Settler-uitleg-pop-up (M10, hoofdstuk 16): zelfde eenmalige-confirm-vlag
  // als de twee hierboven, getoond zodra de settler in beurt 2 verschijnt.
  const [settlerUitlegBevestigd, setSettlerUitlegBevestigd] = useState(false);
  // Boerderij-klaar-uitleg-pop-up (issue: "uitleg pop-ups dynamisch tonen"):
  // zelfde eenmalige-confirm-vlag, getoond zodra er voor het eerst een
  // actieve, wegverbonden boerderij meeproduceert (zie economie.ts
  // `heeftWerkendeBoerderij`).
  const [boerderijKlaarBevestigd, setBoerderijKlaarBevestigd] = useState(false);
  // Stad-upgrade-uitleg-pop-up (issue: "city improvement menu toevoegen"):
  // zelfde eenmalige-confirm-vlag, getoond zodra er voor het eerst genoeg
  // voedsel is voor de groei-tier klein→middel (zie `toonStadUpgradeUitlegPopup`
  // hieronder).
  const [stadUpgradeUitlegBevestigd, setStadUpgradeUitlegBevestigd] = useState(false);
  // Voedselwaarschuwing-pop-up (issue: "aparte pop-up ... zodra de dreiging
  // van te weinig voedsel 5 beurten ver weg is"): anders dan de
  // eenmalige-confirm-vlaggen hierboven mag deze wél opnieuw verschijnen —
  // reageert de speler op tijd (stad wordt weer "gezond"), en zakt de
  // voorraad daarna opnieuw weg, dan verdient dat een nieuwe waarschuwing.
  // De reset-effect hieronder zet de vlag terug zodra de status weer
  // "gezond" is.
  const [voedselWaarschuwingBevestigd, setVoedselWaarschuwingBevestigd] = useState(false);
  useEffect(() => {
    if (state.stad.vervalStatus === "gezond") setVoedselWaarschuwingBevestigd(false);
  }, [state.stad.vervalStatus]);
  // Strijder-bemannen-flow (nieuwe Wachttoren-functie, hoofdstuk 6): klik op
  // een strijder-icoontje in MilitairPaneel zet `wachttorenKiesModusStrijderId`
  // meteen (issue: "wachttoren tweaks" — een tussenliggende bevestigings-
  // pop-up voegde hier geen nieuwe informatie toe), waarna een klik op een
  // actieve Wachttoren-tile op de kaart (zie `handleTileClick` hieronder) die
  // strijder daadwerkelijk bemant.
  const [wachttorenKiesModusStrijderId, setWachttorenKiesModusStrijderId] = useState<string | null>(null);
  // "Volgende beurt"-waarschuwing (issue: "als je op volgende beurt drukt,
  // dan moet er eerst gecheckt worden of je settler nog mag lopen of iets
  // mag doen die beurt ... en of je nog een improvement mocht neerzetten"):
  // een klik op de knop roept niet meteen `volgendeBeurt` aan zolang de
  // settler nog een actie heeft of er nog een bouwkeuze openstaat — die
  // gevallen tonen eerst deze pop-up. "Terug" sluit 'm weer (de speler kan
  // dan alsnog handelen); "Toch doorgaan" roept alsnog `volgendeBeurt` aan.
  const [toonVolgendeBeurtWaarschuwing, setToonVolgendeBeurtWaarschuwing] = useState(false);
  // Stichtings-bevestiging (hoofdstuk 2/10/16, issue: "stad stichten op de
  // frontier" deel 4): geopend via de "Stad stichten"-knop in SettlerPaneel,
  // bevestigd/geannuleerd via StichtStadPopup.
  const [toonStichtStadPopup, setToonStichtStadPopup] = useState(false);
  // Tutorial-voltooid-pop-up (issue: "pop-up met summary wat je geleerd
  // hebt"): sinds het stichten het tutorial-einddoel is (vervangt "bereik
  // laag 12"), gaat `state.stadGesticht` maar één keer van false naar true —
  // deze vlag hoeft dus niet apart bevestigd te worden zoals de eenmalige
  // uitleg-pop-ups hierboven (die blijven immers relevant bij een nieuwe run
  // via `onTutorialAfgerond`, dat GameRoot altijd laat unmounten).
  // Bouwen gebeurt op de huidige frontier-laag: de hoogste ontgrendelde laag
  // (M5: welke laag dat is, verandert zodra cultuur een nieuwe laag ontgrendelt).
  const actieveLaag = state.lagen.find(
    (laag) => laag.hoogte === hoogsteOntgrendeldeLaag(state.lagen)
  )!;

  // Alle tiles zijn klikbaar (issue: "alle tiles klikbaar"): een klik zet de
  // aangeklikte tile hier, en TileInfoPopup toont er de naam/soort/korte
  // bouwmogelijkheden van via `beschrijfTile`.
  const [geselecteerdeTile, setGeselecteerdeTile] = useState<{
    hoogte: number;
    positieInLaag: number;
  } | null>(null);

  // Twee-staps bouwplaatsing: eerst kiest de speler een concrete improvement
  // in de bouw-pop-up (BouwPopup roept `onBouwStarten` daarvoor aan), daarna
  // wijst hij zelf een lege tile aan door erop te klikken — de daadwerkelijke
  // plaatsing (`startBouw`) gebeurt pas als hij dat bevestigt met "Okee".
  const [plaatsingsImprovement, setPlaatsingsImprovement] = useState<Improvement | null>(null);

  // Een onafgeronde plaatsing (improvement gekozen, nog geen tile bevestigd)
  // hoort niet de volgende beurt te overleven — anders zou de speler een
  // improvement uit een vorige beurt op een nieuwe frontier-laag kunnen
  // neerzetten.
  useEffect(() => {
    setPlaatsingsImprovement(null);
    setGeselecteerdeTile(null);
    setToonVolgendeBeurtWaarschuwing(false);
    setWachttorenKiesModusStrijderId(null);
    setToonStichtStadPopup(false);
    setToonStadMenuPopup(false);
  }, [state.beurt]);

  const geselecteerdeLaag = geselecteerdeTile
    ? state.lagen.find((laag) => laag.hoogte === geselecteerdeTile.hoogte)
    : undefined;

  // Alleen de relevante lagen op de canvas (issue: "onderkant altijd in
  // view" + "onontdekte tegels weg") — zie world.ts: `zichtbareLagen`.
  const zichtbareLagenState = zichtbareLagen(state.lagen);

  // Scrolt de kaart standaard naar onderaan (de stad, issue: "onderkant van
  // het scherm altijd standaard in view") zodra het aantal zichtbare lagen
  // verandert (nieuwe laag ontgrendeld) — de stad staat door de vaste
  // tegel-geometrie in canvas.ts altijd precies één rij boven de onderkant
  // van de canvas, dus "helemaal naar onderen scrollen" laat 'm altijd zien,
  // ongeacht hoeveel lagen er inmiddels ontgrendeld zijn.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [zichtbareLagenState.length]);

  // Hoogte 0 is de klikbare oceaan-rij onder laag 1 (geen echte `Layer`, zie
  // GameCanvas: `bepaalAangeklikteTile`) — puur sfeer-tekst, nooit bebouwbaar.
  const tileInfo =
    geselecteerdeTile?.hoogte === 0
      ? beschrijfOceaanTile()
      : geselecteerdeTile && geselecteerdeLaag
        ? beschrijfTile(geselecteerdeLaag, state.lagen, state.stad, geselecteerdeTile.positieInLaag, state.voorraad)
        : null;

  // De tile die de speler heeft aangeklikt terwijl er een improvement klaar
  // staat om geplaatst te worden. Normaal alleen geldig op de actieve
  // (frontier-)laag; `bouwbaarBuitenFrontier`-improvements (hoofdstuk 6/11:
  // momenteel alleen de Wachttoren) mogen op elke ontgrendelde laag, dus daar
  // telt elke aangeklikte tile op een ontgrendelde laag mee.
  const doelTileVoorPlaatsing =
    plaatsingsImprovement && geselecteerdeTile
      ? plaatsingsImprovement.bouwbaarBuitenFrontier
        ? geselecteerdeLaag?.ontgrendeld
          ? geselecteerdeLaag.tiles[geselecteerdeTile.positieInLaag]
          : undefined
        : geselecteerdeTile.hoogte === actieveLaag.hoogte
          ? actieveLaag.tiles[geselecteerdeTile.positieInLaag]
          : undefined
      : undefined;

  // Terrein-eis (issue: "houtkap alleen op bos" e.d.): een leeg vakje met het
  // verkeerde terrein is geen geldig plaatsingsdoel, maar verdient wel een
  // duidelijke reden in plaats van stilzwijgend niets te doen.
  const terreinMismatch =
    plaatsingsImprovement !== undefined &&
    plaatsingsImprovement !== null &&
    doelTileVoorPlaatsing?.status === "leeg" &&
    !improvementPastOpTerrein(plaatsingsImprovement, doelTileVoorPlaatsing.terrein);

  const isGeldigPlaatsingsDoel =
    plaatsingsImprovement !== null && doelTileVoorPlaatsing?.status === "leeg" && !terreinMismatch;

  // Settler actief zodra de beurt begint (issue: "de settler unit is actief
  // als je aan je beurt begint, de tegels waar je heen kunt lichten op, door
  // te klikken op een tegel ga je er naar toe") — alleen buiten een lopende
  // bouwplaatsing, zodat een tile-klik nooit tussen twee betekenissen kan
  // zweven. De bereikbare vakjes lichten op via GameCanvas/canvas.ts; een
  // klik erop verplaatst de settler meteen in plaats van de tile-info-popup
  // te openen (zie `handleTileClick` hieronder).
  const settlerKanBewegen =
    Boolean(state.settler) &&
    !state.settlerActieGedaanDitBeurt &&
    !plaatsingsImprovement &&
    !wachttorenKiesModusStrijderId;
  const settlerBereikbarePosities = settlerKanBewegen ? bereikbarePosities(state.lagen, state.settler!) : [];

  // Actieve, nog onbemande Wachttoren-tiles tijdens het bemannen (nieuwe
  // Wachttoren-functie, hoofdstuk 6, issue: "de wachttorens die beschikbaar
  // zijn dan allemaal worden gehighlight ... je kunt dus alleen de
  // wachttorens kiezen die nog geen strijder hebben") — zelfde
  // alleen-tijdens-de-modus-berekenen-patroon als `settlerBereikbarePosities`
  // hierboven, en meteen ook de enige geldige klikdoelen in `handleTileClick`.
  const wachttorenBereikbarePosities = wachttorenKiesModusStrijderId
    ? onbemandeWachttorenPosities(state)
    : [];

  function handleTileClick(hoogte: number, positieInLaag: number) {
    // Wachttoren-kies-modus (nieuwe Wachttoren-functie, hoofdstuk 6) heeft
    // voorrang op settler-verplaatsing/tile-selectie: een klik op een
    // gehighlight, dus nog onbemand, actieve Wachttoren-tile bemant de
    // gekozen strijder en sluit de modus af; een klik ernaast (of op een al
    // bemande toren) laat de modus openstaan zodat de speler opnieuw kan
    // mikken.
    if (wachttorenKiesModusStrijderId) {
      const isGeldigWachttorenDoel = wachttorenBereikbarePosities.some(
        (positie) => positie.hoogte === hoogte && positie.positieInLaag === positieInLaag
      );
      if (isGeldigWachttorenDoel) {
        bemanWachttoren(wachttorenKiesModusStrijderId, hoogte, positieInLaag);
        setWachttorenKiesModusStrijderId(null);
      }
      return;
    }

    const isSettlerDoel = settlerBereikbarePosities.some(
      (positie) => positie.hoogte === hoogte && positie.positieInLaag === positieInLaag
    );
    if (settlerKanBewegen && isSettlerDoel) {
      verplaatsSettlerNaar(hoogte, positieInLaag);
      return;
    }

    // City improvement menu (issue: "city improvement menu toevoegen"): een
    // klik op de stad-tile zelf (het centrum van een laag, `soort: "city"`)
    // opent het stadsmenu in plaats van de gewone tile-info-pop-up.
    const laag = state.lagen.find((l) => l.hoogte === hoogte);
    if (laag?.tiles[positieInLaag]?.improvement?.soort === "city") {
      setToonStadMenuPopup(true);
      return;
    }

    setGeselecteerdeTile({ hoogte, positieInLaag });
  }

  function bevestigBouw() {
    if (!plaatsingsImprovement || !geselecteerdeTile) return;
    startBouw(geselecteerdeTile.hoogte, plaatsingsImprovement, geselecteerdeTile.positieInLaag);
    setPlaatsingsImprovement(null);
    setGeselecteerdeTile(null);
  }

  // Alle tutorial-uitleg-pop-ups (openings/settler/voedsel/boerderij/militair)
  // zijn via het hoofdmenu aan/uit te zetten (issue: "een setting waarmee je
  // deze uitleg pop-ups aan en uit kunt zetten") — laag-flavor, indringers en
  // de tutorial-voltooid-samenvatting blijven altijd zichtbaar, dat is
  // kerninhoud, geen uitleg.
  const uitlegAan = state.uitlegPopupsAan;

  const toonLaagPopup = actieveLaag.hoogte > laatstBevestigdeLaag;
  // Openings-uitleg bij het begin van beurt 1 (issue: "uitleg pop-ups
  // dynamisch tonen") — geen vast beurtbereik meer, één vaste pop-up.
  const toonUitlegPopup = !toonLaagPopup && uitlegAan && state.beurt === 1 && !openingsUitlegBevestigd;
  // Settler-uitleg direct nadat de settler in beurt 2 verschijnt (hoofdstuk
  // 16) — gekoppeld aan `state.settler` zelf i.p.v. een los beurtnummer, dus
  // hij verschijnt op precies hetzelfde moment als de settler zelf.
  const toonSettlerUitlegPopup =
    !toonLaagPopup && !toonUitlegPopup && uitlegAan && Boolean(state.settler) && !settlerUitlegBevestigd;
  // Voedselwaarschuwing-pop-up (issue: "uitleg pop-ups dynamisch tonen" —
  // vervangt de vroegere vaste beurt-3-pop-up) — zie economie.ts
  // `verwerkVerval` voor de trigger zelf (voedsel dreigt binnen 5 beurten op
  // te raken).
  const toonVoedselWaarschuwingPopup =
    !toonLaagPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    uitlegAan &&
    state.stad.vervalStatus === "kritiek" &&
    !voedselWaarschuwingBevestigd;
  // Boerderij-klaar-uitleg-pop-up (issue: "uitleg pop-ups dynamisch tonen"):
  // zodra er voor het eerst een actieve, wegverbonden boerderij meeproduceert
  // — de introductie van de militaire mechaniek (Wachttoren + militair
  // scherm).
  const toonBoerderijKlaarUitlegPopup =
    !toonLaagPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    uitlegAan &&
    !boerderijKlaarBevestigd &&
    heeftWerkendeBoerderij(state);
  // Militaire-uitleg direct na de laag-pop-up van laag 12 (issue: "als je op
  // het laatst in de tutorial bij de militaire confrontatie bent, uitleg
  // over hoe je het moet aanpakken").
  const toonMilitairUitlegPopup =
    !toonLaagPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    uitlegAan &&
    actieveLaag.hoogte === TUTORIAL_LAAG_AANTAL &&
    !militairUitlegBevestigd;
  // Stad-upgrade-uitleg-pop-up (issue: "city improvement menu toevoegen"):
  // zodra er voor het eerst genoeg voedsel is voor de groei-tier klein→middel
  // — dezelfde dynamische-trigger-vorm als de andere uitleg-pop-ups hierboven.
  const toonStadUpgradeUitlegPopup =
    !toonLaagPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonMilitairUitlegPopup &&
    uitlegAan &&
    !stadUpgradeUitlegBevestigd &&
    state.stad.grootte === "klein" &&
    state.voedsel >= VOEDSEL_DREMPEL_GROEI;
  // Indringers-pop-up (hoofdstuk 6) — verschijnt zodra `verwerkIndringers`
  // (economie.ts) een gebeurtenis op een van de ontgrendelde lagen heeft
  // gezet (niet meer alleen de frontier-laag). Blijft in beeld tot de speler
  // de melding afhandelt (geven/weigeren/afgedwongen tribuut of gewoon
  // wegklikken). Los van de uitleg-toggle hierboven — dit is kerninhoud, geen
  // uitleg.
  const toonIndringersPopup =
    !toonLaagPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonMilitairUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    Boolean(state.indringersEvent);
  // Kudde- & roofdier-pop-ups (hoofdstuk 14/17) — zelfde blokkerende vorm en
  // prioriteit als de indringers-pop-up hierboven, ook los van de
  // uitleg-toggle: dit is kerninhoud, geen uitleg.
  const toonKuddePopup =
    !toonLaagPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonMilitairUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    Boolean(state.kuddeEvent);
  const toonRoofdierPopup =
    !toonLaagPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonMilitairUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    Boolean(state.roofdierEvent);
  // Technologie-keuze-pop-up (hoofdstuk 3/9/11, issue: "tech tree toevoegen"
  // Deel 2) — verschijnt zodra `verwerkTechDrempel` (economie.ts) een drempel
  // bereikt heeft. Net als de indringers-/kudde-/roofdier-pop-ups hierboven
  // los van de uitleg-toggle (kerninhoud, geen uitleg) en niet wegklikbaar
  // zonder te kiezen.
  const toonTechKeuzePopup =
    !toonLaagPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonMilitairUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    !toonRoofdierPopup &&
    Boolean(state.techKeuzeEvent);
  // Tutorial-voltooid-samenvatting zodra een nieuwe stad gesticht is
  // (hoofdstuk 2/10/16, issue: "stad stichten op de frontier" — vervangt
  // "confrontatie op laag 12 gewonnen" als trigger: het stichten is nu het
  // tutorial-einddoel, niet het bereiken van laag 12).
  const toonTutorialVoltooidPopup =
    !toonLaagPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonMilitairUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    !toonRoofdierPopup &&
    !toonTechKeuzePopup &&
    state.stadGesticht === true &&
    !tutorialVoltooidBevestigd;
  // Bouw-ritme (hoofdstuk 16): een nieuw bouwproject mag pas weer gestart
  // worden vanaf `volgendeBouwBeurt` — de `?? 1` is puur een veilige default
  // voor een save van vóór dit veld bestond.
  const kanBouwen = state.beurt >= (state.volgendeBouwBeurt ?? 1);

  // "Volgende beurt"-waarschuwing (issue: "eerst gecheckt worden of je
  // settler nog mag lopen of iets mag doen die beurt" / "ook als een
  // improvement mocht neerzetten die beurt"): dezelfde vlaggen die de
  // settler-knoppen en de bouw-pop-up zelf al sturen, hergebruikt om te
  // bepalen of de waarschuwing nodig is vóór `volgendeBeurt` echt aangeroepen
  // wordt.
  const settlerHeeftNogActie = Boolean(state.settler) && !state.settlerActieGedaanDitBeurt;
  const magNogBouwen = kanBouwen && !state.bouwKeuzeGedaanDitBeurt;

  function klikVolgendeBeurt() {
    if (settlerHeeftNogActie || magNogBouwen) {
      setToonVolgendeBeurtWaarschuwing(true);
      return;
    }
    volgendeBeurt();
  }

  function tochDoorgaanNaVolgendeBeurtWaarschuwing() {
    setToonVolgendeBeurtWaarschuwing(false);
    volgendeBeurt();
  }

  // Intro- en ineenstortingsscherm zijn volledig blokkerende overlays (issue:
  // "intro en game over scherm") — alle hooks hierboven blijven onvoorwaardelijk
  // aangeroepen, alleen de uiteindelijke JSX wisselt.
  if (toonIntro) return <IntroScherm onBeginnen={bevestigIntro} />;
  if (state.laatsteIneenstorting) {
    // Na een ineenstorting terug naar het beginscherm van het spel (issue:
    // "na het game over scherm terug naar het begin scherm, niet naar het
    // begin van de tutorial") — `onVerlaten` unmount GameRoot, waardoor de
    // volgende sessie (via het menu) weer met een verse `useGameEngine`-status
    // en het introscherm begint, in plaats van meteen door te spelen op de
    // (door `verwerkVerval` al gereset) tutorial-status.
    return <IneenstortingScherm onDoorgaan={onVerlaten} statistieken={state.laatsteRunStatistieken} />;
  }

  return (
    <div className="game-viewport">
      <HoofdMenu
        onOpslaan={opslaan}
        onLaden={laden}
        kanLaden={heeftOpgeslagenSpel()}
        onVerlaten={onVerlaten}
        uitlegAan={uitlegAan}
        onToggleUitleg={() => zetUitlegPopups(!uitlegAan)}
      />
      <SpelActiesMenu onToonHistorie={() => setToonHistorie(true)} />
      <div className="game-scroll-area" ref={scrollRef}>
        <GameCanvas
          lagen={zichtbareLagenState}
          stad={state.stad}
          plaatsingsLaagHoogte={plaatsingsImprovement ? actieveLaag.hoogte : undefined}
          settler={state.settler}
          settlerBereikbarePosities={settlerBereikbarePosities}
          wachttorenBereikbarePosities={wachttorenBereikbarePosities}
          onTileClick={handleTileClick}
        />
        <LaagIntroPaneel lagen={state.lagen} />
        <SettlerPaneel
          state={state}
          onLegWegAan={legWegAan}
          onJaag={jaag}
          onHakHout={hakHout}
          onOpenStichtStad={() => setToonStichtStadPopup(true)}
        />
        {toonStadMenuPopup && (
          <StadMenuPopup
            state={state}
            legerwaarde={berekenLegerwaarde(state)}
            tegenstanderSterkte={actieveLaag.dreigingsniveau ?? 0}
            confrontatieOntgrendeld={actieveLaag.hoogte >= TUTORIAL_LAAG_AANTAL}
            onStartGroei={startGroei}
            onStartNieuweSettler={startNieuweSettler}
            onStartOpslagplaats={startOpslagplaats}
            onStartRecrutering={startRecrutering}
            onConfrontatie={confrontatie}
            onKiesStrijder={(strijderId) => {
              setWachttorenKiesModusStrijderId(strijderId);
              setToonStadMenuPopup(false);
            }}
            onHaalTerug={haalStrijderTerug}
            onSluiten={() => setToonStadMenuPopup(false)}
          />
        )}
        {toonLaagPopup && (
          <LaagPopup hoogte={actieveLaag.hoogte} onDoorgaan={() => setLaatstBevestigdeLaag(actieveLaag.hoogte)} />
        )}
        {toonMilitairUitlegPopup && <MilitairUitlegPopup onDoorgaan={() => setMilitairUitlegBevestigd(true)} />}
        {toonIndringersPopup && state.indringersEvent && (
          <IndringersPopup
            event={state.indringersEvent}
            onGeefTribuut={kiesGeefTribuut}
            onWeigerTribuut={weigerTribuut}
            onBevestigGedwongenTribuut={bevestigGedwongenTribuut}
            onSluitTribuutBetaling={geefTribuut}
            onSluiten={sluitIndringersMelding}
          />
        )}
        {toonKuddePopup && state.kuddeEvent && (
          <KuddePopup event={state.kuddeEvent} onSluiten={sluitKuddeMelding} />
        )}
        {toonRoofdierPopup && state.roofdierEvent && (
          <RoofdierPopup event={state.roofdierEvent} onSluiten={sluitRoofdierMelding} />
        )}
        {toonTechKeuzePopup && state.techKeuzeEvent && (
          <TechKeuzePopup
            drempel={state.techKeuzeEvent.drempel}
            opties={state.techKeuzeEvent.opties}
            onKiesTech={kiesTech}
          />
        )}
        {toonUitlegPopup && <UitlegPopup onDoorgaan={() => setOpeningsUitlegBevestigd(true)} />}
        {toonSettlerUitlegPopup && <SettlerUitlegPopup onDoorgaan={() => setSettlerUitlegBevestigd(true)} />}
        {toonVoedselWaarschuwingPopup && (
          <VoedselWaarschuwingPopup
            beurtenResterend={state.stad.vervalBeurtenResterend}
            onDoorgaan={() => setVoedselWaarschuwingBevestigd(true)}
          />
        )}
        {toonBoerderijKlaarUitlegPopup && (
          <BoerderijKlaarUitlegPopup onDoorgaan={() => setBoerderijKlaarBevestigd(true)} />
        )}
        {toonStadUpgradeUitlegPopup && (
          <StadUpgradeUitlegPopup onDoorgaan={() => setStadUpgradeUitlegBevestigd(true)} />
        )}
        {wachttorenKiesModusStrijderId && (
          <WachttorenKiesBanner onAnnuleren={() => setWachttorenKiesModusStrijderId(null)} />
        )}
        {toonStichtStadPopup && (
          <StichtStadPopup
            onBevestig={() => {
              stichtStad();
              setToonStichtStadPopup(false);
            }}
            onAnnuleren={() => setToonStichtStadPopup(false)}
          />
        )}
        {toonVolgendeBeurtWaarschuwing && (
          <VolgendeBeurtWaarschuwingPopup
            settlerHeeftNogActie={settlerHeeftNogActie}
            magNogBouwen={magNogBouwen}
            onTochDoorgaan={tochDoorgaanNaVolgendeBeurtWaarschuwing}
            onTerug={() => setToonVolgendeBeurtWaarschuwing(false)}
          />
        )}
        {toonTutorialVoltooidPopup && (
          <TutorialVoltooidPopup
            onDoorgaan={() => {
              markeerTutorialVoltooid();
              setTutorialVoltooidBevestigd(true);
              // Hoofdstuk 9/10/16: "daarna het campagnemenu" — GameRoot
              // unmount hierdoor (zie AppRoot), dus geen frontier-
              // verplaatsing binnen deze issue nodig (hoofdstuk 13: dat
              // blijft bewust post-MVP).
              onTutorialAfgerond();
            }}
          />
        )}
        <BouwPopup
          laag={actieveLaag}
          alleLagen={state.lagen}
          technologieen={state.technologieen}
          zichtbaar={
            !toonLaagPopup &&
            !toonUitlegPopup &&
            !toonSettlerUitlegPopup &&
            !toonVoedselWaarschuwingPopup &&
            !toonBoerderijKlaarUitlegPopup &&
            !toonMilitairUitlegPopup &&
            !toonStadUpgradeUitlegPopup &&
            !toonIndringersPopup &&
            !toonKuddePopup &&
            !toonRoofdierPopup &&
            !toonTechKeuzePopup &&
            !toonTutorialVoltooidPopup &&
            !wachttorenKiesModusStrijderId &&
            !toonStichtStadPopup &&
            !toonStadMenuPopup &&
            !state.bouwKeuzeGedaanDitBeurt &&
            !plaatsingsImprovement &&
            kanBouwen
          }
          onBouwStarten={(improvement) => setPlaatsingsImprovement(improvement)}
          onSluiten={sluitBouwKeuze}
        />
        <TileInfoPopup
          tileInfo={tileInfo}
          bouwVraag={isGeldigPlaatsingsDoel ? { improvementNaam: plaatsingsImprovement!.naam } : undefined}
          terreinWaarschuwing={
            terreinMismatch
              ? `${plaatsingsImprovement!.naam} kan hier niet gebouwd worden — vereist ${terreinEisenBeschrijving(plaatsingsImprovement!)}.`
              : undefined
          }
          onBevestigBouw={bevestigBouw}
          onAnnuleerBouw={() => setGeselecteerdeTile(null)}
          onSluiten={() => setGeselecteerdeTile(null)}
        />
        {toonHistorie && (
          <HistoriePaneel
            lagen={state.lagen}
            statistieken={berekenHistorieStatistieken(state)}
            onSluiten={() => setToonHistorie(false)}
          />
        )}
      </div>
      <ResourceHud state={state} onVolgendeBeurt={klikVolgendeBeurt} />
    </div>
  );
}
