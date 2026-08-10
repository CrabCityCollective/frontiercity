"use client";

import { useEffect, useRef, useState } from "react";
import AmberOntdektPopup from "@/components/AmberOntdektPopup";
import BezetteStreekPopup from "@/components/BezetteStreekPopup";
import BoerderijKlaarUitlegPopup from "@/components/BoerderijKlaarUitlegPopup";
import BouwPopup from "@/components/BouwPopup";
import FrontierUitlegPopup from "@/components/FrontierUitlegPopup";
import GoddelijkeRaadgevingPopup from "@/components/GoddelijkeRaadgevingPopup";
import HistoriePaneel from "@/components/HistoriePaneel";
import HoofdMenu from "@/components/HoofdMenu";
import IndringersPopup from "@/components/IndringersPopup";
import IneenstortingScherm from "@/components/IneenstortingScherm";
import IntroScherm from "@/components/IntroScherm";
import KuddePopup from "@/components/KuddePopup";
import StreekIntroPaneel from "@/components/StreekIntroPaneel";
import StreekPopup from "@/components/StreekPopup";
import OceaanUitlegPopup from "@/components/OceaanUitlegPopup";
import ResourceHud from "@/components/ResourceHud";
import RoofdierPopup from "@/components/RoofdierPopup";
import SettlerPaneel from "@/components/SettlerPaneel";
import SettlerUitlegPopup from "@/components/SettlerUitlegPopup";
import StadMenuPopup from "@/components/StadMenuPopup";
import StadUpgradeUitlegPopup from "@/components/StadUpgradeUitlegPopup";
import StichtStadPopup from "@/components/StichtStadPopup";
import StrijdersOpleidenPopup from "@/components/StrijdersOpleidenPopup";
import TechKeuzePopup from "@/components/TechKeuzePopup";
import TileInfoPopup from "@/components/TileInfoPopup";
import TutorialVoltooidPopup from "@/components/TutorialVoltooidPopup";
import UitlegPopup from "@/components/UitlegPopup";
import VijandAanDeHorizonPopup from "@/components/VijandAanDeHorizonPopup";
import VijandelijkHeiligdomPopup from "@/components/VijandelijkHeiligdomPopup";
import VoedselBalansUitlegPopup from "@/components/VoedselBalansUitlegPopup";
import VoedselWaarschuwingPopup from "@/components/VoedselWaarschuwingPopup";
import WachttorenKiesBanner from "@/components/WachttorenKiesBanner";
import WachttorenOveralUitlegPopup from "@/components/WachttorenOveralUitlegPopup";
import { improvementPastOpTerrein, terreinEisenBeschrijving } from "@/game/improvements";
import { verhuldeBezetteStreekPosities } from "@/game/streekOntgrendeling";
import { AMBER_ONTDEKKING_TWEEDE_TEKST, AMBER_ONTDEKKING_TWEEDE_TITEL } from "@/game/tutorialContent";
import { berekenLegerwaarde, onbemandeLegerkampPosities } from "@/game/militair";
import { heeftGebouwdeMijn, heeftWerkendeBoerderij } from "@/game/productie";
import { grafischeStijl, heeftOpgeslagenSpel, markeerTutorialVoltooid, zetGrafischeStijl } from "@/game/save";
import { beschrijfEindeOceaanTile, beschrijfOceaanTile, beschrijfTile } from "@/game/tileInfo";
import { Improvement } from "@/game/types";
import { berekenHistorieStatistieken } from "@/game/uitputtingEnVerval";
import { useGameEngine } from "@/game/useGameEngine";
import { bereikbarePosities } from "@/game/wegen";
import {
  EINDE_OCEAAN_HOOGTE,
  TUTORIAL_STREEK_AANTAL,
  VOEDSEL_DREMPEL_GROEI,
  hoogsteOntgrendeldeStreek,
  zichtbareStreken,
} from "@/game/world";
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
    startBouw,
    sluitBouwKeuze,
    startGroei,
    startNieuweSettler,
    startOpslagplaats,
    startCityVerbetering,
    versnelCityVerbeteringMetGoud,
    stichtStad,
    startRecrutering,
    verplaatsSettlerNaar,
    legWegAan,
    jaag,
    hakHout,
    sluitIndringersMelding,
    bevestigAmberOnderVuur,
    sluitKuddeMelding,
    sluitRoofdierMelding,
    sluitAmberOntdektMelding,
    sluitTweedeAmberOntdektMelding,
    versnelBouwMetGoud,
    versnelCivielMetGoud,
    versnelOpslagplaatsMetGoud,
    geefTribuut,
    kiesGeefTribuut,
    weigerTribuut,
    bevestigGedwongenTribuut,
    bemanWachttoren,
    haalStrijderTerug,
    zetUitlegPopups,
    kiesTech,
    verken,
    startVerkennerRecrutering,
    startMissionarisRecrutering,
    bemanLegerkamp,
    confrontatieBezetteStreek,
    sluitBezetteStreekOntdektMelding,
    sluitVijandelijkHeiligdomOnthuldMelding,
    sluitVijandelijkHeiligdomVernietigdMelding,
    opslaan,
    laden,
  } = useGameEngine();

  // Historiescherm is een losse volledig-schermige pop-up, geen aan/uit-paneel.
  // Bereikbaar via het hoofdmenu (issue: "Settings uitbreiden" — "de
  // historie van de run toevoegen aan het menu, ipv dat het een
  // zelfstandige button is"), niet meer via een los spel-icoontje.
  const [toonHistorie, setToonHistorie] = useState(false);

  // Grafische stijl (issue: "Settings uitbreiden" — "on the fly kunnen
  // wisselen tussen pixel art en vector art"): als losse state hier i.p.v.
  // GameCanvas 'm zelf uit save.ts te laten lezen, zodat een toggle via het
  // hoofdmenu meteen een herteken triggert (zie GameCanvas: `stijl`-prop) in
  // plaats van pas bij de volgende (her)start van dit scherm.
  const [stijl, setStijl] = useState(grafischeStijl);
  function toggleStijl() {
    const nieuweStijl = stijl === "vector" ? "pixel-art" : "vector";
    setStijl(nieuweStijl);
    zetGrafischeStijl(nieuweStijl);
  }

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

  // Streek-popup (issue: "als je naar een nieuwe streek gaat, een popup vóór het
  // bouwcategorie-schermpje"): zodra de hoogst ontgrendelde streek verder komt
  // dan de laatst bevestigde, blokkeert deze popup de bouw-pop-up totdat de
  // speler 'm wegklikt. Begint op 1 (de startstreek, al geïntroduceerd via
  // IntroScherm) zodat hij niet meteen bij de eerste streek verschijnt.
  const [laatstBevestigdeStreek, setLaatstBevestigdeStreek] = useState(1);

  // Openings-uitleg-pop-up (issue: "uitleg pop-ups dynamisch tonen"): los van
  // de streek-popup hierboven, toont dit één vaste pop-up bij het begin van
  // beurt 1 — een eenmalige-confirm-vlag, zelfde patroon als de overige
  // uitleg-pop-ups hieronder (settler/voedsel/boerderij/militair).
  const [openingsUitlegBevestigd, setOpeningsUitlegBevestigd] = useState(false);

  // Tutorial-voltooid-pop-up (issue: "pop-up met summary na het halen
  // ervan"): eenmalige confirm-vlag per sessie, zelfde patroon als
  // `laatstBevestigdeStreek` hierboven. De Bezette-Streek-intro (hoofdstuk 6,
  // issue: "De Bezette Streek, missionaris en verkenner", Deel 2 — vervangt de
  // eerdere MilitairUitlegPopup) is zelf géén eenmalige-uitleg-vlag maar een
  // persistente `GameState`-melding (`bezetteStreekOntdektEvent`), net als
  // `amberOntdektEvent`: kerninhoud, geen uitleg die met de uitleg-toggle
  // uit mag.
  // Oceaan-uitleg-pop-up (issue: "tutorial laatste stad aan oceaan"): zelfde
  // eenmalige-confirm-vlag, getoond zodra de laatste streek (de oceaan aan de
  // overkant) bereikt is.
  const [oceaanUitlegBevestigd, setOceaanUitlegBevestigd] = useState(false);
  const [tutorialVoltooidBevestigd, setTutorialVoltooidBevestigd] = useState(false);
  // Settler-uitleg-pop-up (M10, hoofdstuk 16): zelfde eenmalige-confirm-vlag
  // als de twee hierboven, getoond zodra de settler in beurt 2 verschijnt.
  const [settlerUitlegBevestigd, setSettlerUitlegBevestigd] = useState(false);
  // Boerderij-klaar-uitleg-pop-up (issue: "uitleg pop-ups dynamisch tonen"):
  // zelfde eenmalige-confirm-vlag, getoond zodra er voor het eerst een
  // actieve, wegverbonden boerderij meeproduceert (zie economie.ts
  // `heeftWerkendeBoerderij`).
  const [boerderijKlaarBevestigd, setBoerderijKlaarBevestigd] = useState(false);
  // Strijders-opleiden-uitleg-pop-up (issue: "pop-ups wijzigen"): zelfde
  // eenmalige-confirm-vlag, getoond zodra er voor het eerst een gebouwde mijn
  // staat (zie economie.ts `heeftGebouwdeMijn`).
  const [strijdersOpleidenBevestigd, setStrijdersOpleidenBevestigd] = useState(false);
  // Stad-upgrade-uitleg-pop-up (issue: "city improvement menu toevoegen"):
  // zelfde eenmalige-confirm-vlag, getoond zodra er voor het eerst genoeg
  // voedsel is voor de groei-tier klein→middel (zie `toonStadUpgradeUitlegPopup`
  // hieronder).
  const [stadUpgradeUitlegBevestigd, setStadUpgradeUitlegBevestigd] = useState(false);
  // "De vijand aan de horizon"- en "Goddelijke raadgeving"-pop-ups (issue:
  // "tutorial popups wijzigen"): zelfde eenmalige-confirm-vlaggen, getoond
  // zodra respectievelijk streek 2 (Militair/Wachttoren) en streek 3
  // (Wetenschappelijk/Sterrencirkel) voor het eerst ontgrendeld worden — zie
  // `toonVijandAanDeHorizonPopup`/`toonGoddelijkeRaadgevingPopup` hieronder.
  const [vijandAanDeHorizonBevestigd, setVijandAanDeHorizonBevestigd] = useState(false);
  const [goddelijkeRaadgevingBevestigd, setGoddelijkeRaadgevingBevestigd] = useState(false);
  // Frontier-uitleg-pop-up (issue: "meer uitleg"): zelfde eenmalige-confirm-
  // vlag, getoond direct na de "vijand aan de horizon"-pop-up hierboven —
  // zodra streek 2 voor het eerst ontgrendelt is dit het eerste moment waarop
  // de frontier-only-bouwregel (hoofdstuk 2) er ook echt toe doet.
  const [frontierUitlegBevestigd, setFrontierUitlegBevestigd] = useState(false);
  // Wachttoren-overal-uitleg-pop-up (issue: "meer uitleg"): zelfde eenmalige-
  // confirm-vlag, getoond zodra streek 2 voor het eerst ontgrendelt — legt uit
  // waarom de Wachttoren (anders dan alle andere bouwwerken) op elke
  // ontgrendelde streek te plaatsen is.
  const [wachttorenOveralUitlegBevestigd, setWachttorenOveralUitlegBevestigd] = useState(false);
  // Voedsel-balans-uitleg-pop-up (issue: "meer uitleg"): zelfde eenmalige-
  // confirm-vlag, getoond zodra streek 4 voor het eerst ontgrendelt — het
  // moment waarop de jacht als tweede voedselbron beschikbaar komt (naast de
  // boerderij, al uitgelegd via BoerderijKlaarUitlegPopup).
  const [voedselBalansUitlegBevestigd, setVoedselBalansUitlegBevestigd] = useState(false);
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
  // Wachttoren-bemannen-flow (issue: "wachttorens bemannen" — herzien zodat
  // de speler eerst de wachttoren-tile zelf aanklikt en pas dán, in de
  // tile-info-pop-up, uit de nog vrije strijders kiest, in plaats van eerst
  // een strijder te kiezen in het stadsmenu): onthoudt alleen nog of de
  // keuzelijst met vrije strijders open staat voor de aangeklikte wachttoren
  // (zie `handleTileClick`/TileInfoPopup hieronder).
  const [toonWachttorenBemanningsKeuze, setToonWachttorenBemanningsKeuze] = useState(false);
  // Legerkamp-toewijzingsflow (hoofdstuk 6, issue: "De Bezette Streek,
  // missionaris en verkenner", Deel 5) — zelfde soort kies-modus als
  // hierboven, maar voor een Legerkamp-tile i.p.v. een Wachttoren-tile.
  const [legerkampKiesModusStrijderId, setLegerkampKiesModusStrijderId] = useState<string | null>(null);
  // Verkenning-kies-modus (Deel 3): geactiveerd via de "Verkennen"-knop in
  // BezetteStreekPaneel, waarna een klik op een verhuld vakje van de Bezette
  // Streek (zie `handleTileClick` hieronder) dat vakje daadwerkelijk verkent.
  const [verkenningsModusActief, setVerkenningsModusActief] = useState(false);
  // Stichtings-bevestiging (hoofdstuk 2/10/16, issue: "stad stichten op de
  // frontier" deel 4): geopend via de "Stad stichten"-knop in SettlerPaneel,
  // bevestigd/geannuleerd via StichtStadPopup.
  const [toonStichtStadPopup, setToonStichtStadPopup] = useState(false);
  // Tutorial-voltooid-pop-up (issue: "pop-up met summary wat je geleerd
  // hebt"): sinds het stichten het tutorial-einddoel is (vervangt "bereik
  // streek 12"), gaat `state.stadGesticht` maar één keer van false naar true —
  // deze vlag hoeft dus niet apart bevestigd te worden zoals de eenmalige
  // uitleg-pop-ups hierboven (die blijven immers relevant bij een nieuwe run
  // via `onTutorialAfgerond`, dat GameRoot altijd laat unmounten).
  // Bouwen gebeurt op de huidige frontier-streek: de hoogste ontgrendelde streek
  // (M5: welke streek dat is, verandert zodra cultuur een nieuwe streek ontgrendelt).
  const actieveStreek = state.streken.find(
    (streek) => streek.hoogte === hoogsteOntgrendeldeStreek(state.streken)
  )!;

  // Alle tiles zijn klikbaar (issue: "alle tiles klikbaar"): een klik zet de
  // aangeklikte tile hier, en TileInfoPopup toont er de naam/soort/korte
  // bouwmogelijkheden van via `beschrijfTile`.
  const [geselecteerdeTile, setGeselecteerdeTile] = useState<{
    hoogte: number;
    positieInStreek: number;
  } | null>(null);

  // Twee-staps bouwplaatsing: eerst kiest de speler een concrete improvement
  // in de bouw-pop-up (BouwPopup roept `onBouwStarten` daarvoor aan), daarna
  // wijst hij zelf een lege tile aan door erop te klikken — de daadwerkelijke
  // plaatsing (`startBouw`) gebeurt pas als hij dat bevestigt met "Okee".
  const [plaatsingsImprovement, setPlaatsingsImprovement] = useState<Improvement | null>(null);

  // Een onafgeronde plaatsing (improvement gekozen, nog geen tile bevestigd)
  // hoort niet de volgende beurt te overleven — anders zou de speler een
  // improvement uit een vorige beurt op een nieuwe frontier-streek kunnen
  // neerzetten.
  useEffect(() => {
    setPlaatsingsImprovement(null);
    setGeselecteerdeTile(null);
    setToonWachttorenBemanningsKeuze(false);
    setLegerkampKiesModusStrijderId(null);
    setVerkenningsModusActief(false);
    setToonStichtStadPopup(false);
    setToonStadMenuPopup(false);
  }, [state.beurt]);

  const geselecteerdeStreek = geselecteerdeTile
    ? state.streken.find((streek) => streek.hoogte === geselecteerdeTile.hoogte)
    : undefined;

  // De ruwe tile achter de aangeklikte tile-info (hoofdstuk 5/14, issue:
  // "toevoeging Goud" Deel 2) — `tileInfo` hierboven is alleen tekst, dit
  // geeft de "versnel met goud"-knop toegang tot de echte bouwvoortgang.
  // Hoogte 0 en EINDE_OCEAAN_HOOGTE zijn de twee oceaan-rijen (geen echte
  // `Streek`, zie `tileInfo` hieronder).
  const geselecteerdeTileVoorRush =
    geselecteerdeTile &&
    geselecteerdeTile.hoogte !== 0 &&
    geselecteerdeTile.hoogte !== EINDE_OCEAAN_HOOGTE &&
    geselecteerdeStreek
      ? geselecteerdeStreek.tiles[geselecteerdeTile.positieInStreek]
      : undefined;

  // Wachttoren-bemannen (issue: "wachttorens bemannen" — herzien): alleen
  // relevant als de aangeklikte tile een actieve Wachttoren is — de
  // tile-info-pop-up krijgt er dan een bemannen-/naar-huis-sturen-actie bij
  // (zie TileInfoPopup: `wachttorenVraag` hieronder).
  const geselecteerdeTileIsWachttoren =
    geselecteerdeTileVoorRush?.status === "actief" && geselecteerdeTileVoorRush.improvement?.id === "wachttoren";
  const wachttorenBemanner =
    geselecteerdeTileIsWachttoren && geselecteerdeTile
      ? state.stad.strijders.find(
          (s) =>
            s.wachttoren?.hoogte === geselecteerdeTile.hoogte &&
            s.wachttoren?.positieInStreek === geselecteerdeTile.positieInStreek
        )
      : undefined;
  // Alleen de relevante streken op de canvas (issue: "onderkant altijd in
  // view" + "onontdekte tegels weg") — zie world.ts: `zichtbareStreken`.
  const zichtbareStrekenState = zichtbareStreken(state.streken);

  // Scrolt de kaart standaard naar onderaan (de stad, issue: "onderkant van
  // het scherm altijd standaard in view") zodra het aantal zichtbare streken
  // verandert (nieuwe streek ontgrendeld) — de stad staat door de vaste
  // tegel-geometrie in canvas.ts altijd precies één rij boven de onderkant
  // van de canvas, dus "helemaal naar onderen scrollen" laat 'm altijd zien,
  // ongeacht hoeveel streken er inmiddels ontgrendeld zijn.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [zichtbareStrekenState.length]);

  // Hoogte 0 is de klikbare oceaan-rij onder streek 1, EINDE_OCEAAN_HOOGTE de
  // afsluitende oceaan-rij bóven de laatste streek (issue: "laatste oceaan ook
  // visueel") — beide geen echte `Streek` (zie GameCanvas: `bepaalAangeklikteTile`)
  // — puur sfeer-tekst, nooit bebouwbaar.
  const tileInfo =
    geselecteerdeTile?.hoogte === 0
      ? beschrijfOceaanTile()
      : geselecteerdeTile?.hoogte === EINDE_OCEAAN_HOOGTE
        ? beschrijfEindeOceaanTile()
        : geselecteerdeTile && geselecteerdeStreek
          ? beschrijfTile(geselecteerdeStreek, state.streken, state.stad, geselecteerdeTile.positieInStreek, state.voorraad)
          : null;

  // De tile die de speler heeft aangeklikt terwijl er een improvement klaar
  // staat om geplaatst te worden. Normaal alleen geldig op de actieve
  // (frontier-)streek; `bouwbaarBuitenFrontier`-improvements (hoofdstuk 6/11:
  // momenteel alleen de Wachttoren) mogen op elke ontgrendelde streek, dus daar
  // telt elke aangeklikte tile op een ontgrendelde streek mee.
  const doelTileVoorPlaatsing =
    plaatsingsImprovement && geselecteerdeTile
      ? plaatsingsImprovement.bouwbaarBuitenFrontier
        ? geselecteerdeStreek?.ontgrendeld
          ? geselecteerdeStreek.tiles[geselecteerdeTile.positieInStreek]
          : undefined
        : geselecteerdeTile.hoogte === actieveStreek.hoogte
          ? actieveStreek.tiles[geselecteerdeTile.positieInStreek]
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

  // Amberader-vondst-eis (hoofdstuk 3/14, issue: "toevoeging Goud" Deel 1):
  // een leeg heuvel/bergvakje voldoet aan de gewone terrein-eis van de
  // Amberader, maar zonder een amberader-vondst (`tile.amber`, zie world.ts)
  // is het alsnog geen geldig plaatsingsdoel — apart van `terreinMismatch`
  // hierboven zodat de UI de juiste reden kan tonen.
  const amberMismatch =
    plaatsingsImprovement?.id === "goudmijn" &&
    doelTileVoorPlaatsing?.status === "leeg" &&
    !terreinMismatch &&
    !doelTileVoorPlaatsing.amber;

  const isGeldigPlaatsingsDoel =
    plaatsingsImprovement !== null &&
    doelTileVoorPlaatsing?.status === "leeg" &&
    !terreinMismatch &&
    !amberMismatch;

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
    !legerkampKiesModusStrijderId &&
    !verkenningsModusActief;
  const settlerBereikbarePosities = settlerKanBewegen ? bereikbarePosities(state.streken, state.settler!) : [];

  // Actieve, nog onbemande Legerkamp-tiles tijdens het bemannen (hoofdstuk 6,
  // issue: "De Bezette Streek, missionaris en verkenner", Deel 5) — zelfde
  // alleen-tijdens-de-modus-berekenen-patroon als `settlerBereikbarePosities`
  // hierboven, en meteen ook de enige geldige klikdoelen in `handleTileClick`.
  const legerkampBereikbarePosities = legerkampKiesModusStrijderId ? onbemandeLegerkampPosities(state) : [];
  // Nog verhulde vakjes van de actieve Bezette Streek tijdens Verkenning (Deel
  // 3) — zelfde patroon.
  const verkenningBereikbarePosities = verkenningsModusActief ? verhuldeBezetteStreekPosities(state) : [];

  function handleTileClick(hoogte: number, positieInStreek: number) {
    // Legerkamp-kies-modus en Verkenning (Bezette Streek hoofdstuk 6, issue:
    // "De Bezette Streek, missionaris en verkenner") hebben voorrang op
    // settler-verplaatsing/tile-selectie: een klik op een gehighlight, dus
    // geldig, vakje voert de bijbehorende actie uit en sluit de modus af; een
    // klik ernaast laat de modus openstaan zodat de speler opnieuw kan
    // mikken.
    if (legerkampKiesModusStrijderId) {
      const isGeldigLegerkampDoel = legerkampBereikbarePosities.some(
        (positie) => positie.hoogte === hoogte && positie.positieInStreek === positieInStreek
      );
      if (isGeldigLegerkampDoel) {
        bemanLegerkamp(legerkampKiesModusStrijderId, hoogte, positieInStreek);
        setLegerkampKiesModusStrijderId(null);
      }
      return;
    }

    if (verkenningsModusActief) {
      const isGeldigVerkenningsDoel = verkenningBereikbarePosities.some(
        (positie) => positie.hoogte === hoogte && positie.positieInStreek === positieInStreek
      );
      if (isGeldigVerkenningsDoel) {
        verken(positieInStreek);
        setVerkenningsModusActief(false);
      }
      return;
    }

    const isSettlerDoel = settlerBereikbarePosities.some(
      (positie) => positie.hoogte === hoogte && positie.positieInStreek === positieInStreek
    );
    if (settlerKanBewegen && isSettlerDoel) {
      verplaatsSettlerNaar(hoogte, positieInStreek);
      return;
    }

    // City improvement menu (issue: "city improvement menu toevoegen"): een
    // klik op de stad-tile zelf (het centrum van een streek, `soort: "city"`)
    // opent het stadsmenu in plaats van de gewone tile-info-pop-up.
    const streek = state.streken.find((l) => l.hoogte === hoogte);
    if (streek?.tiles[positieInStreek]?.improvement?.soort === "city") {
      setToonStadMenuPopup(true);
      return;
    }

    setToonWachttorenBemanningsKeuze(false);
    setGeselecteerdeTile({ hoogte, positieInStreek });
  }

  function bevestigBouw() {
    if (!plaatsingsImprovement || !geselecteerdeTile) return;
    startBouw(geselecteerdeTile.hoogte, plaatsingsImprovement, geselecteerdeTile.positieInStreek);
    setPlaatsingsImprovement(null);
    setGeselecteerdeTile(null);
  }

  // Alle tutorial-uitleg-pop-ups (openings/settler/voedsel/boerderij/militair)
  // zijn via het hoofdmenu aan/uit te zetten (issue: "een setting waarmee je
  // deze uitleg pop-ups aan en uit kunt zetten") — streek-flavor, indringers en
  // de tutorial-voltooid-samenvatting blijven altijd zichtbaar, dat is
  // kerninhoud, geen uitleg.
  const uitlegAan = state.uitlegPopupsAan;

  const toonStreekPopup = actieveStreek.hoogte > laatstBevestigdeStreek;
  // Openings-uitleg bij het begin van beurt 1 (issue: "uitleg pop-ups
  // dynamisch tonen") — geen vast beurtbereik meer, één vaste pop-up.
  const toonUitlegPopup = !toonStreekPopup && uitlegAan && state.beurt === 1 && !openingsUitlegBevestigd;
  // Settler-uitleg direct nadat de settler in beurt 2 verschijnt (hoofdstuk
  // 16) — gekoppeld aan `state.settler` zelf i.p.v. een los beurtnummer, dus
  // hij verschijnt op precies hetzelfde moment als de settler zelf.
  const toonSettlerUitlegPopup =
    !toonStreekPopup && !toonUitlegPopup && uitlegAan && Boolean(state.settler) && !settlerUitlegBevestigd;
  // Voedselwaarschuwing-pop-up (issue: "uitleg pop-ups dynamisch tonen" —
  // vervangt de vroegere vaste beurt-3-pop-up) — zie economie.ts
  // `verwerkVerval` voor de trigger zelf (voedsel dreigt binnen 5 beurten op
  // te raken).
  const toonVoedselWaarschuwingPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    uitlegAan &&
    state.stad.vervalStatus === "kritiek" &&
    !voedselWaarschuwingBevestigd;
  // "De vijand aan de horizon"-pop-up (issue: "tutorial popups wijzigen"):
  // zodra streek 2 voor het eerst ontgrendelt — het moment waarop Militair/de
  // Wachttoren beschikbaar komt (zie improvements.ts: `minStreek`).
  const toonVijandAanDeHorizonPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    uitlegAan &&
    !vijandAanDeHorizonBevestigd &&
    hoogsteOntgrendeldeStreek(state.streken) >= 2;
  // Frontier-uitleg-pop-up (issue: "meer uitleg"): direct na de pop-up
  // hierboven, zelfde ontgrendel-trigger (streek 2) — legt uit dat bouwen
  // vanaf nu alleen nog op de frontier-streek kan.
  const toonFrontierUitlegPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    uitlegAan &&
    !frontierUitlegBevestigd &&
    hoogsteOntgrendeldeStreek(state.streken) >= 2;
  // "Goddelijke raadgeving"-pop-up (issue: "tutorial popups wijzigen"): zodra
  // streek 3 voor het eerst ontgrendelt — het moment waarop Wetenschappelijk/de
  // Sterrencirkel beschikbaar komt (zie improvements.ts: `minStreek`).
  const toonGoddelijkeRaadgevingPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    uitlegAan &&
    !goddelijkeRaadgevingBevestigd &&
    hoogsteOntgrendeldeStreek(state.streken) >= 3;
  // Boerderij-klaar-uitleg-pop-up (issue: "uitleg pop-ups dynamisch tonen"):
  // zodra er voor het eerst een actieve, wegverbonden boerderij meeproduceert
  // — de introductie van het Heiligdom/cultuur (issue: "tutorial popups
  // wijzigen").
  const toonBoerderijKlaarUitlegPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonFrontierUitlegPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    uitlegAan &&
    !boerderijKlaarBevestigd &&
    heeftWerkendeBoerderij(state);
  // Strijders-opleiden-uitleg-pop-up (issue: "pop-ups wijzigen"): zodra er
  // voor het eerst een gebouwde mijn staat — het moment waarop het bouwen van
  // een Wachttoren en het opleiden van een strijder allebei relevant worden.
  const toonStrijdersOpleidenPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonFrontierUitlegPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    uitlegAan &&
    !strijdersOpleidenBevestigd &&
    heeftGebouwdeMijn(state);
  // Bezette-Streek-intro (hoofdstuk 6, issue: "De Bezette Streek, missionaris en
  // verkenner", Deel 2 — vervangt de eerdere, kleinere MilitairUitlegPopup):
  // verschijnt zodra `verwerkStreekOntgrendeling` (economie.ts) streek 12 "in
  // beeld" brengt. Los van de uitleg-toggle (kerninhoud, geen uitleg, net als
  // de indringers-/amberader-pop-ups) — daarom hier bewust géén `uitlegAan`-
  // check, ook al staat de flag qua prioriteit tussen de uitleg-pop-ups in.
  const toonBezetteStreekOntdektPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonFrontierUitlegPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    Boolean(state.bezetteStreekOntdektEvent);
  // Oceaan-uitleg direct na de streek-pop-up van de laatste streek (issue:
  // "tutorial laatste stad aan oceaan" — de enige plek met vers water, dus
  // de enige plek waar de laatste stad gesticht kan worden).
  const toonOceaanUitlegPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonFrontierUitlegPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    uitlegAan &&
    actieveStreek.hoogte === TUTORIAL_STREEK_AANTAL &&
    !oceaanUitlegBevestigd;
  // Stad-upgrade-uitleg-pop-up (issue: "city improvement menu toevoegen"):
  // zodra er voor het eerst genoeg voedsel is voor de groei-tier klein→middel
  // — dezelfde dynamische-trigger-vorm als de andere uitleg-pop-ups hierboven.
  const toonStadUpgradeUitlegPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonFrontierUitlegPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    uitlegAan &&
    !stadUpgradeUitlegBevestigd &&
    state.stad.grootte === "klein" &&
    state.voedsel >= VOEDSEL_DREMPEL_GROEI;
  // Indringers-pop-up (hoofdstuk 6) — verschijnt zodra `verwerkIndringers`
  // (economie.ts) een gebeurtenis op een van de ontgrendelde streken heeft
  // gezet (niet meer alleen de frontier-streek). Blijft in beeld tot de speler
  // de melding afhandelt (geven/weigeren/afgedwongen tribuut of gewoon
  // wegklikken). Los van de uitleg-toggle hierboven — dit is kerninhoud, geen
  // uitleg.
  const toonIndringersPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonFrontierUitlegPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    Boolean(state.indringersEvent);
  // Kudde- & roofdier-pop-ups (hoofdstuk 14/17) — zelfde blokkerende vorm en
  // prioriteit als de indringers-pop-up hierboven, ook los van de
  // uitleg-toggle: dit is kerninhoud, geen uitleg.
  const toonKuddePopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonFrontierUitlegPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    Boolean(state.kuddeEvent);
  const toonRoofdierPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonFrontierUitlegPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    Boolean(state.roofdierEvent);
  // Amberader-ontdekkingspop-up (hoofdstuk 3/14, issue: "toevoeging Goud") —
  // zelfde blokkerende vorm en prioriteit als de kudde-/roofdier-pop-ups
  // hierboven, ook los van de uitleg-toggle: dit is kerninhoud, geen uitleg.
  const toonAmberOntdektPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonFrontierUitlegPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    !toonRoofdierPopup &&
    Boolean(state.amberOntdektEvent);
  // Tweede Amberader-ontdekkingspop-up (hoofdstuk 3/11/14, issue: "Amberader
  // sowieso op streek 12") — zelfde blokkerende vorm en prioriteit als de
  // eerste Amberader-pop-up hierboven, één stap lager zodat de eerste vondst
  // altijd voorrang krijgt als beide toevallig in dezelfde beurt triggeren.
  const toonTweedeAmberOntdektPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonFrontierUitlegPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    !toonRoofdierPopup &&
    !toonAmberOntdektPopup &&
    Boolean(state.tweedeAmberOntdektEvent);
  // Technologie-keuze-pop-up (hoofdstuk 3/9/11, issue: "tech tree toevoegen"
  // Deel 2) — verschijnt zodra `verwerkTechDrempel` (economie.ts) een drempel
  // bereikt heeft. Net als de indringers-/kudde-/roofdier-pop-ups hierboven
  // los van de uitleg-toggle (kerninhoud, geen uitleg) en niet wegklikbaar
  // zonder te kiezen.
  const toonTechKeuzePopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonFrontierUitlegPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    !toonRoofdierPopup &&
    !toonAmberOntdektPopup &&
    !toonTweedeAmberOntdektPopup &&
    Boolean(state.techKeuzeEvent);
  // Vijandelijk-Heiligdom-onthuld-/vernietigd-pop-ups (hoofdstuk 6, issue:
  // "De Bezette Streek, missionaris en verkenner", Deel 4) — zelfde
  // blokkerende vorm en prioriteit als de overige kerninhoud-meldingen
  // hierboven. "Onthuld" gaat voor "vernietigd" (kan in theorie dezelfde
  // beurt allebei gezet zijn — onthullen via Verkenning, vernietigen via de
  // belegeringsmeter — de speler ziet dan eerst de onthulling).
  const toonVijandelijkHeiligdomOnthuldPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonFrontierUitlegPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    !toonRoofdierPopup &&
    !toonAmberOntdektPopup &&
    !toonTweedeAmberOntdektPopup &&
    !toonTechKeuzePopup &&
    Boolean(state.vijandelijkHeiligdomOnthuldEvent);
  const toonVijandelijkHeiligdomVernietigdPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonFrontierUitlegPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    !toonRoofdierPopup &&
    !toonAmberOntdektPopup &&
    !toonTweedeAmberOntdektPopup &&
    !toonTechKeuzePopup &&
    !toonVijandelijkHeiligdomOnthuldPopup &&
    Boolean(state.vijandelijkHeiligdomVernietigdEvent);
  // Wachttoren-overal-uitleg-pop-up (issue: "meer uitleg"): laagste prioriteit
  // van de uitleg-pop-ups, zodat hij nooit kerninhoud (indringers/kudde/
  // roofdier/amber/tech/bezette streek) onderbreekt — verschijnt zodra streek
  // 2 voor het eerst ontgrendelt en alle hogere-prioriteit pop-ups afgehandeld
  // zijn.
  const toonWachttorenOveralUitlegPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonFrontierUitlegPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    !toonRoofdierPopup &&
    !toonAmberOntdektPopup &&
    !toonTweedeAmberOntdektPopup &&
    !toonTechKeuzePopup &&
    !toonVijandelijkHeiligdomOnthuldPopup &&
    !toonVijandelijkHeiligdomVernietigdPopup &&
    uitlegAan &&
    !wachttorenOveralUitlegBevestigd &&
    hoogsteOntgrendeldeStreek(state.streken) >= 2;
  // Voedsel-balans-uitleg-pop-up (issue: "meer uitleg"): direct na de pop-up
  // hierboven, zelfde lage prioriteit — verschijnt zodra streek 4 voor het
  // eerst ontgrendelt, het moment waarop de jacht als tweede voedselbron
  // beschikbaar komt naast de boerderij.
  const toonVoedselBalansUitlegPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonFrontierUitlegPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    !toonRoofdierPopup &&
    !toonAmberOntdektPopup &&
    !toonTweedeAmberOntdektPopup &&
    !toonTechKeuzePopup &&
    !toonVijandelijkHeiligdomOnthuldPopup &&
    !toonVijandelijkHeiligdomVernietigdPopup &&
    !toonWachttorenOveralUitlegPopup &&
    uitlegAan &&
    !voedselBalansUitlegBevestigd &&
    hoogsteOntgrendeldeStreek(state.streken) >= 4;
  // Tutorial-voltooid-samenvatting zodra een nieuwe stad gesticht is
  // (hoofdstuk 2/10/16, issue: "stad stichten op de frontier" — vervangt
  // "confrontatie op streek 12 gewonnen" als trigger: het stichten is nu het
  // tutorial-einddoel, niet het bereiken van streek 12).
  const toonTutorialVoltooidPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonFrontierUitlegPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    !toonRoofdierPopup &&
    !toonAmberOntdektPopup &&
    !toonTweedeAmberOntdektPopup &&
    !toonTechKeuzePopup &&
    !toonVijandelijkHeiligdomOnthuldPopup &&
    !toonVijandelijkHeiligdomVernietigdPopup &&
    !toonWachttorenOveralUitlegPopup &&
    !toonVoedselBalansUitlegPopup &&
    state.stadGesticht === true &&
    !tutorialVoltooidBevestigd;
  // Bouw-ritme (hoofdstuk 16): een nieuw bouwproject mag pas weer gestart
  // worden vanaf `volgendeBouwBeurt` — de `?? 1` is puur een veilige default
  // voor een save van vóór dit veld bestond.
  const kanBouwen = state.beurt >= (state.volgendeBouwBeurt ?? 1);

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
        stijl={stijl}
        onToggleStijl={toggleStijl}
        onToonHistorie={() => setToonHistorie((open) => !open)}
      />
      <div className="game-scroll-area" ref={scrollRef}>
        <GameCanvas
          streken={zichtbareStrekenState}
          stad={state.stad}
          plaatsingsStreekHoogte={plaatsingsImprovement ? actieveStreek.hoogte : undefined}
          settler={state.settler}
          settlerBereikbarePosities={settlerBereikbarePosities}
          legerkampBereikbarePosities={legerkampBereikbarePosities}
          verkenningBereikbarePosities={verkenningBereikbarePosities}
          stijl={stijl}
          onTileClick={handleTileClick}
        />
        <SettlerPaneel
          state={state}
          onLegWegAan={legWegAan}
          onJaag={jaag}
          onHakHout={hakHout}
          onOpenStichtStad={() => setToonStichtStadPopup(true)}
        />
        <StreekIntroPaneel streken={state.streken} />
        {toonStadMenuPopup && (
          <StadMenuPopup
            state={state}
            legerwaarde={berekenLegerwaarde(state)}
            tegenstanderSterkte={actieveStreek.dreigingsniveau ?? 0}
            onStartGroei={startGroei}
            onStartNieuweSettler={startNieuweSettler}
            onStartOpslagplaats={startOpslagplaats}
            onStartCityVerbetering={startCityVerbetering}
            onVersnelCityVerbetering={versnelCityVerbeteringMetGoud}
            onStartRecrutering={startRecrutering}
            onKiesStrijderVoorLegerkamp={(strijderId) => {
              setLegerkampKiesModusStrijderId(strijderId);
              setToonStadMenuPopup(false);
            }}
            onHaalTerug={haalStrijderTerug}
            onVersnelCiviel={versnelCivielMetGoud}
            onVersnelOpslagplaats={versnelOpslagplaatsMetGoud}
            onStartVerkennerRecrutering={startVerkennerRecrutering}
            onActiveerVerkenningsModus={() => {
              setVerkenningsModusActief(true);
              setToonStadMenuPopup(false);
            }}
            verkenningsModusActief={verkenningsModusActief}
            onStartMissionarisRecrutering={startMissionarisRecrutering}
            onConfrontatieBezetteStreek={confrontatieBezetteStreek}
            onSluiten={() => setToonStadMenuPopup(false)}
          />
        )}
        {toonStreekPopup && (
          <StreekPopup hoogte={actieveStreek.hoogte} onDoorgaan={() => setLaatstBevestigdeStreek(actieveStreek.hoogte)} />
        )}
        {toonBezetteStreekOntdektPopup && <BezetteStreekPopup onDoorgaan={sluitBezetteStreekOntdektMelding} />}
        {toonVijandelijkHeiligdomOnthuldPopup && (
          <VijandelijkHeiligdomPopup fase="onthuld" onSluiten={sluitVijandelijkHeiligdomOnthuldMelding} />
        )}
        {toonVijandelijkHeiligdomVernietigdPopup && (
          <VijandelijkHeiligdomPopup fase="vernietigd" onSluiten={sluitVijandelijkHeiligdomVernietigdMelding} />
        )}
        {toonOceaanUitlegPopup && <OceaanUitlegPopup onDoorgaan={() => setOceaanUitlegBevestigd(true)} />}
        {toonIndringersPopup && state.indringersEvent && (
          <IndringersPopup
            event={state.indringersEvent}
            onBevestigAmberOnderVuur={bevestigAmberOnderVuur}
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
        {toonAmberOntdektPopup && <AmberOntdektPopup onSluiten={sluitAmberOntdektMelding} />}
        {toonTweedeAmberOntdektPopup && (
          <AmberOntdektPopup
            titel={AMBER_ONTDEKKING_TWEEDE_TITEL}
            tekst={AMBER_ONTDEKKING_TWEEDE_TEKST}
            onSluiten={sluitTweedeAmberOntdektMelding}
          />
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
        {toonVijandAanDeHorizonPopup && (
          <VijandAanDeHorizonPopup onDoorgaan={() => setVijandAanDeHorizonBevestigd(true)} />
        )}
        {toonFrontierUitlegPopup && <FrontierUitlegPopup onDoorgaan={() => setFrontierUitlegBevestigd(true)} />}
        {toonGoddelijkeRaadgevingPopup && (
          <GoddelijkeRaadgevingPopup onDoorgaan={() => setGoddelijkeRaadgevingBevestigd(true)} />
        )}
        {toonBoerderijKlaarUitlegPopup && (
          <BoerderijKlaarUitlegPopup onDoorgaan={() => setBoerderijKlaarBevestigd(true)} />
        )}
        {toonStrijdersOpleidenPopup && (
          <StrijdersOpleidenPopup onDoorgaan={() => setStrijdersOpleidenBevestigd(true)} />
        )}
        {toonStadUpgradeUitlegPopup && (
          <StadUpgradeUitlegPopup onDoorgaan={() => setStadUpgradeUitlegBevestigd(true)} />
        )}
        {toonWachttorenOveralUitlegPopup && (
          <WachttorenOveralUitlegPopup onDoorgaan={() => setWachttorenOveralUitlegBevestigd(true)} />
        )}
        {toonVoedselBalansUitlegPopup && (
          <VoedselBalansUitlegPopup onDoorgaan={() => setVoedselBalansUitlegBevestigd(true)} />
        )}
        {legerkampKiesModusStrijderId && (
          <WachttorenKiesBanner onAnnuleren={() => setLegerkampKiesModusStrijderId(null)} />
        )}
        {verkenningsModusActief && <WachttorenKiesBanner onAnnuleren={() => setVerkenningsModusActief(false)} />}
        {toonStichtStadPopup && (
          <StichtStadPopup
            onBevestig={() => {
              stichtStad();
              setToonStichtStadPopup(false);
            }}
            onAnnuleren={() => setToonStichtStadPopup(false)}
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
          streek={actieveStreek}
          alleStreken={state.streken}
          technologieen={state.technologieen}
          cityImprovements={state.stad.cityImprovements}
          zichtbaar={
            !toonStreekPopup &&
            !toonUitlegPopup &&
            !toonSettlerUitlegPopup &&
            !toonVoedselWaarschuwingPopup &&
            !toonVijandAanDeHorizonPopup &&
            !toonGoddelijkeRaadgevingPopup &&
            !toonBoerderijKlaarUitlegPopup &&
            !toonStrijdersOpleidenPopup &&
            !toonBezetteStreekOntdektPopup &&
            !toonOceaanUitlegPopup &&
            !toonStadUpgradeUitlegPopup &&
            !toonIndringersPopup &&
            !toonKuddePopup &&
            !toonRoofdierPopup &&
            !toonAmberOntdektPopup &&
            !toonTweedeAmberOntdektPopup &&
            !toonTechKeuzePopup &&
            !toonVijandelijkHeiligdomOnthuldPopup &&
            !toonVijandelijkHeiligdomVernietigdPopup &&
            !toonWachttorenOveralUitlegPopup &&
            !toonVoedselBalansUitlegPopup &&
            !toonTutorialVoltooidPopup &&
            !legerkampKiesModusStrijderId &&
            !verkenningsModusActief &&
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
              : amberMismatch
                ? `${plaatsingsImprovement!.naam} kan hier niet gebouwd worden — hier is geen amberader gevonden.`
                : undefined
          }
          rushVraag={
            geselecteerdeTile &&
            geselecteerdeTileVoorRush?.status === "in_aanbouw" &&
            geselecteerdeTileVoorRush.improvement &&
            geselecteerdeTileVoorRush.bouwVoortgang
              ? {
                  improvement: geselecteerdeTileVoorRush.improvement,
                  voortgang: geselecteerdeTileVoorRush.bouwVoortgang,
                  goudInVoorraad: state.voorraad.goud,
                  onVersnellen: () => versnelBouwMetGoud(geselecteerdeTile.hoogte, geselecteerdeTile.positieInStreek),
                }
              : undefined
          }
          wachttorenVraag={
            geselecteerdeTileIsWachttoren && geselecteerdeTile
              ? {
                  bemand: Boolean(wachttorenBemanner),
                  alleStrijders: state.stad.strijders,
                  keuzeActief: toonWachttorenBemanningsKeuze,
                  onStartKeuze: () => setToonWachttorenBemanningsKeuze(true),
                  onKiesStrijder: (strijderId) => {
                    bemanWachttoren(strijderId, geselecteerdeTile.hoogte, geselecteerdeTile.positieInStreek);
                    setToonWachttorenBemanningsKeuze(false);
                    setGeselecteerdeTile(null);
                  },
                  onStuurNaarHuis: () => {
                    if (wachttorenBemanner) haalStrijderTerug(wachttorenBemanner.id);
                    setGeselecteerdeTile(null);
                  },
                }
              : undefined
          }
          onBevestigBouw={bevestigBouw}
          onAnnuleerBouw={() => {
            setGeselecteerdeTile(null);
            setToonWachttorenBemanningsKeuze(false);
          }}
          onSluiten={() => {
            setGeselecteerdeTile(null);
            setToonWachttorenBemanningsKeuze(false);
          }}
        />
        {toonHistorie && (
          <HistoriePaneel
            streken={state.streken}
            statistieken={berekenHistorieStatistieken(state)}
            onSluiten={() => setToonHistorie(false)}
          />
        )}
      </div>
      <ResourceHud state={state} />
    </div>
  );
}
