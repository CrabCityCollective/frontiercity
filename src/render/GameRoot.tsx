"use client";

import { useEffect, useRef, useState } from "react";
import GoudOntdektPopup from "@/components/GoudOntdektPopup";
import BeurtensysteemUitlegPopup from "@/components/BeurtensysteemUitlegPopup";
import BezetteStreekPaneel from "@/components/BezetteStreekPaneel";
import BezetteStreekPopup from "@/components/BezetteStreekPopup";
import BoerderijKlaarUitlegPopup from "@/components/BoerderijKlaarUitlegPopup";
import BouwPopup from "@/components/BouwPopup";
import BouwUitlegPopup from "@/components/BouwUitlegPopup";
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
import RoofdierIntroPopup from "@/components/RoofdierIntroPopup";
import RoofdierPopup from "@/components/RoofdierPopup";
import SettlerActiesUitlegPopup from "@/components/SettlerActiesUitlegPopup";
import SettlerPaneel from "@/components/SettlerPaneel";
import SettlerUitlegPopup from "@/components/SettlerUitlegPopup";
import StadMenuPopup from "@/components/StadMenuPopup";
import StadsverbeteringenUitlegPopup from "@/components/StadsverbeteringenUitlegPopup";
import StadUpgradeUitlegPopup from "@/components/StadUpgradeUitlegPopup";
import StichtingsMomentPopup from "@/components/StichtingsMomentPopup";
import StichtStadPopup from "@/components/StichtStadPopup";
import StrijdersOpleidenPopup from "@/components/StrijdersOpleidenPopup";
import TechboomPaneel from "@/components/TechboomPaneel";
import EconomieOverzichtPaneel from "@/components/EconomieOverzichtPaneel";
import EncyclopediePaneel from "@/components/EncyclopediePaneel";
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
import WampanoagPaneel from "@/components/WampanoagPaneel";
import { SettlerSlot } from "@/game/acties";
import { boonMetId } from "@/game/boons";
import { campagneConfig, popupContent, streekContentVoorCampagne } from "@/game/campagnes";
import { beurtMagAutomatischDoorgaan } from "@/game/economie";
import { improvementNaam, improvementPastOpTerrein, terreinEisenBeschrijving } from "@/game/improvements";
import { kanIndringersAfkopenMetWampum, wampumAfkoopKostenHuidig } from "@/game/indringersEnDieren";
import {
  BELEGERINGSDREMPEL,
  beschikbareMissionarissen,
  kanStuurMissionaris,
  kanStuurVerkenner,
  verhuldeBezetteStreekPosities,
} from "@/game/streekOntgrendeling";
import { kanStuurVerkennerWampanoag, verhuldeWampanoagPosities, wampanoagHandelOpties } from "@/game/wampanoag";
import {
  GOUD_ONTDEKKING_TWEEDE_TEKST,
  GOUD_ONTDEKKING_TWEEDE_TITEL,
  BOERDERIJ_STREEK_UITLEG_TEKST,
  BOERDERIJ_STREEK_UITLEG_TITEL,
  HEILIGDOM_UITLEG_TEKST,
  HEILIGDOM_UITLEG_TITEL,
  HOUTKAP_STREEK_UITLEG_TEKST,
  HOUTKAP_STREEK_UITLEG_TITEL,
  NIET_BOUWEN_UITLEG_TEKST,
  NIET_BOUWEN_UITLEG_TITEL,
  SETTLER_WEG_SNELHEID_UITLEG_TEKST,
  SETTLER_WEG_SNELHEID_UITLEG_TITEL,
  TWEEDE_SETTLER_UITLEG_TEKST,
  TWEEDE_SETTLER_UITLEG_TITEL,
} from "@/game/tutorialContent";
import { TWEEDE_SETTLER_MIN_STREEK } from "@/game/groeiEnRekrutering";
import {
  berekenLegerwaarde,
  kanConfrontatieBezetteStreek,
  onbemandeLegerkampPosities,
  winkansConfrontatieBezetteStreek,
} from "@/game/militair";
import { onrustOpStreek } from "@/game/onrust";
import { heeftGebouwdeMijn, heeftGeplaatsteSteengroeve, heeftWerkendeBoerderij } from "@/game/productie";
import {
  campagneStatistieken,
  grafischeStijl,
  registreerCampagneGestart,
  registreerCampagneUitgespeeld,
  registreerGameOverGezien,
  zetGrafischeStijl,
} from "@/game/save";
import { beschrijfEindeOceaanTile, beschrijfOceaanTile, beschrijfTile } from "@/game/tileInfo";
import { Improvement } from "@/game/types";
import { berekenHistorieStatistieken } from "@/game/uitputtingEnVerval";
import { useGameEngine } from "@/game/useGameEngine";
import { aantalAangelegdeWegen, bereikbarePosities } from "@/game/wegen";
import {
  EINDE_OCEAAN_HOOGTE,
  ROOFDIER_MIN_STREEK,
  VOEDSEL_DREMPEL_GROEI,
  hoogsteOntgrendeldeStreek,
  zichtbareStreken,
} from "@/game/world";
import GameCanvas from "./GameCanvas";

interface GameRootProps {
  // Actieve campagne (M20d deelstap 3, hoofdstuk 9/13/15) — `undefined` voor
  // de tutorial, anders een `CampaignConfig.id` (campagnes.ts). Komt van
  // AppRoot (gezet via `CampagneSelectScherm.onKiesCampagne`) en gaat
  // uitsluitend naar `useGameEngine()` voor het opzetten van de initiële
  // status — de lopende run zelf leest verder overal `state.campagneId`.
  campagneId?: string;
  // Issue: "loading button per campagne op het campagne select screen,
  // waarmee je een eerdere save kunt inladen" — true als de speler op
  // CampagneSelectScherm bewust de Laden-knop van deze campagne aanklikte in
  // plaats van de campagne zelf. Gaat, net als `campagneId` hierboven,
  // uitsluitend naar `useGameEngine()` voor de initiële status.
  laadBijStart?: boolean;
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
export default function GameRoot({ campagneId, laadBijStart, onVerlaten, onTutorialAfgerond }: GameRootProps) {
  const {
    state,
    volgendeBeurt,
    startBouw,
    sluitBouwKeuze,
    startGroei,
    startNieuweSettler,
    startTweedeSettler,
    startOpslagplaats,
    startSmederij,
    startCityVerbetering,
    versnelCityVerbeteringMetGoud,
    stichtStad,
    startRecrutering,
    verplaatsSettlerNaar,
    legWegAan,
    jaag,
    hakHout,
    sluitIndringersMelding,
    bevestigGoudOnderVuur,
    sluitKuddeMelding,
    sluitRoofdierMelding,
    sluitGoudOntdektMelding,
    sluitTweedeGoudOntdektMelding,
    versnelBouwMetGoud,
    versnelCivielMetGoud,
    versnelOpslagplaatsMetGoud,
    versnelSmederijMetGoud,
    zetSmederijActief,
    geefTribuut,
    koopIndringersAfMetWampum,
    bemanWachttoren,
    haalStrijderTerug,
    bemanCourthouse,
    haalRechterTerug,
    startRechterTraining,
    zetUitlegPopups,
    markeerUitlegGezien,
    bevestigStreekPopup,
    bevestigStichtingsMomentPopup,
    sluitBoonMelding,
    kiesTech,
    stuurVerkenner,
    stuurVerkennerWampanoag,
    stelWampanoagHandel,
    stuurMissionaris,
    startMissionarisRecrutering,
    bemanLegerkamp,
    confrontatieBezetteStreek,
    sluitBezetteStreekOntdektMelding,
    sluitVijandelijkHeiligdomOnthuldMelding,
    sluitVijandelijkHeiligdomVeroverdMelding,
    sluitWampanoagLaagOntdektMelding,
    sluitWampanoagRelatieGelegdMelding,
    sluitSmederijGebouwdMelding,
  } = useGameEngine(campagneId, laadBijStart);

  // Actieve campagne (hoofdstuk 9/13, M20d deelstap 3): `state.campagneId` is
  // nu de door `CampagneSelectScherm`/AppRoot gekozen campagne (zie de
  // `campagneId`-prop hierboven) — `undefined` betekent tutorial, net als
  // voorheen. `improvementNaam()`/`techNaam()`-gebruikers hieronder lezen
  // deze config voor de hele run.
  const campagne = campagneConfig(state.campagneId);

  // Historiescherm is een losse volledig-schermige pop-up, geen aan/uit-paneel.
  // Bereikbaar via het hoofdmenu (issue: "Settings uitbreiden" — "de
  // historie van de run toevoegen aan het menu, ipv dat het een
  // zelfstandige button is"), niet meer via een los spel-icoontje.
  const [toonHistorie, setToonHistorie] = useState(false);

  // Techboom-overzicht (issue: "tech tree inzien" — "kun je in het menu een
  // item erbij maken om de tech tree in te zien"): zelfde soort losse,
  // volledig-schermige pop-up als het historiescherm hierboven, bereikbaar
  // via hetzelfde hoofdmenu.
  const [toonTechboom, setToonTechboom] = useState(false);

  // Economie-overzicht (issue: "Economie overzicht" — "bij het menu een knop
  // waarop je een economie overzicht kunt inzien"): zelfde soort losse,
  // volledig-schermige pop-up als het historie-/techboomscherm hierboven,
  // bereikbaar via hetzelfde hoofdmenu.
  const [toonEconomie, setToonEconomie] = useState(false);

  // Encyclopedie (issue: "Boekwerk met uitleg"): zelfde soort losse,
  // volledig-schermige pop-up als het historie-/techboom-/economiescherm
  // hierboven, bereikbaar via hetzelfde hoofdmenu.
  const [toonEncyclopedie, setToonEncyclopedie] = useState(false);

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

  // Introscherm (issue: "intro en game over scherm"): getoond bij elke verse
  // start van de tutorial vanuit het menu — niet slechts één keer per
  // browser, zodat de speler 'm ook ziet als hij de tutorial via het
  // campagnemenu opnieuw opstart (issue: "als ik de tutorial aanklik vanuit
  // het menu, zie ik het introscherm niet meer"). Bij het laden van een
  // opgeslagen save vanuit het campagne-select-scherm (`laadBijStart`) is dit
  // geen nieuwe start, dus dan slaan we het introscherm over (issue: "bij
  // laden geen intro scherm").
  const [toonIntro, setToonIntro] = useState(!laadBijStart);

  function bevestigIntro() {
    setToonIntro(false);
  }

  // Per-campagne voortgangstellers (issue: "voortgang verschillende
  // campagnes tonen"): een start telt op precies hetzelfde moment als
  // `toonIntro` hierboven — elke verse (her)mount van GameRoot is een nieuwe
  // start van deze campagne. Bij het laden van een bestaande save
  // (`laadBijStart`) lezen we de tellers alleen, zonder de "gestart"-teller
  // te verhogen (issue: "het hoeft ook niet als 'run gestart' te worden
  // meegeteld"). Lazy `useState`-initializer (zelfde patroon als `stijl`
  // hierboven, dat ook een keer synchroon uit localStorage leest) zodat het
  // introscherm meteen bij de eerste render het bijgewerkte aantal toont,
  // zonder een extra her-render na een `useEffect`.
  const [campagneStats, setCampagneStats] = useState(() =>
    laadBijStart ? campagneStatistieken(campagneId) : registreerCampagneGestart(campagneId)
  );
  // Game-over-teller: verhoogt zodra `state.laatsteIneenstorting` voor het
  // eerst binnen deze mount `true` wordt (zie de blokkerende
  // `IneenstortingScherm`-return verderop) — niet bij elke her-render zolang
  // die vlag aan blijft staan.
  useEffect(() => {
    if (state.laatsteIneenstorting) setCampagneStats(registreerGameOverGezien(state.campagneId));
  }, [state.laatsteIneenstorting, state.campagneId]);

  // Streek-popup (issue: "als je naar een nieuwe streek gaat, een popup vóór het
  // bouwcategorie-schermpje"): zodra de hoogst ontgrendelde streek verder komt
  // dan de laatst bevestigde, blokkeert deze popup de bouw-pop-up totdat de
  // speler 'm wegklikt. Begint op 1 (de startstreek, al geïntroduceerd via
  // IntroScherm) zodat hij niet meteen bij de eerste streek verschijnt.
  const laatstBevestigdeStreek = state.laatstBevestigdeStreek;

  // Stichtingsmoment-pop-up (issue #278, hoofdstuk 9 Deel 2/hoofdstuk 19
  // "Samenhang"): onthoudt hoeveel steden de speler al bevestigd heeft gezien
  // — elke run begint met precies 1 stad (zowel tutorial als Going West, zie
  // `initieleSpelStatus.ts`), dus elke stichting daarna verhoogt
  // `state.steden.length` voorbij deze teller. Alleen relevant voor
  // niet-tutorial-campagnes, zie `toonStichtingsMomentPopup` hieronder.
  const laatsteBevestigdeStedenAantal = state.laatsteBevestigdeStedenAantal;

  // Openings-uitleg-pop-up (issue: "uitleg pop-ups dynamisch tonen"): los van
  // de streek-popup hierboven, toont dit één vaste pop-up bij het begin van
  // beurt 1 — een eenmalige-confirm-vlag, zelfde patroon als de overige
  // uitleg-pop-ups hieronder (settler/voedsel/boerderij/militair).
  const openingsUitlegBevestigd = state.gezieneEenmaligeUitleg.includes("opening");
  // Campagne-openings-pop-up (issue "Pop-up teksten Wampanoag" — "die langere
  // tekst moest in een nieuwe pop-up aan het begin van de campaign, niet de
  // introtekst"): losse, narratieve pop-up bij het begin van beurt 1, naast en
  // los van `openingsUitlegBevestigd` hierboven (dat is de tutorial-mechaniek-
  // uitleg, aan/uit te zetten via `uitlegAan`) — deze toont altijd, is
  // kerninhoud/verhaal net als de streek-popup, en bestaat alleen voor
  // campagnes die er content voor hebben (`popupContent`, campagnes.ts).
  const campagneOpeningBevestigd = state.gezieneEenmaligeUitleg.includes("campagneOpening");

  // Tutorial-voltooid-pop-up (issue: "pop-up met summary na het halen
  // ervan"): eenmalige confirm-vlag per sessie, zelfde patroon als
  // `laatstBevestigdeStreek` hierboven. De Bezette-Streek-intro (hoofdstuk 6,
  // issue: "De Bezette Streek, missionaris en verkenner", Deel 2 — vervangt de
  // eerdere MilitairUitlegPopup) is zelf géén eenmalige-uitleg-vlag maar een
  // persistente `GameState`-melding (`bezetteStreekOntdektEvent`), net als
  // `goudOntdektEvent`: kerninhoud, geen uitleg die met de uitleg-toggle
  // uit mag.
  // Oceaan-uitleg-pop-up (issue: "tutorial laatste stad aan oceaan"): zelfde
  // eenmalige-confirm-vlag, getoond zodra de laatste streek (de oceaan aan de
  // overkant) bereikt is.
  const oceaanUitlegBevestigd = state.gezieneEenmaligeUitleg.includes("oceaan");
  const [tutorialVoltooidBevestigd, setTutorialVoltooidBevestigd] = useState(false);
  // Settler-uitleg-pop-up (M10, hoofdstuk 16): zelfde eenmalige-confirm-vlag
  // als de twee hierboven, getoond zodra de settler in beurt 2 verschijnt.
  const settlerUitlegBevestigd = state.gezieneEenmaligeUitleg.includes("settler");
  // Boerderij-klaar-uitleg-pop-up (issue: "uitleg pop-ups dynamisch tonen"):
  // zelfde eenmalige-confirm-vlag, getoond zodra er voor het eerst een
  // actieve, wegverbonden boerderij meeproduceert (zie economie.ts
  // `heeftWerkendeBoerderij`) — sinds "Tweede streek boerderij" ten vroegste
  // streek 2.
  const boerderijKlaarBevestigd = state.gezieneEenmaligeUitleg.includes("boerderijKlaar");
  // Strijders-opleiden-uitleg-pop-up (issue: "pop-ups wijzigen"): zelfde
  // eenmalige-confirm-vlag, getoond zodra er voor het eerst een gebouwde mijn
  // staat (zie economie.ts `heeftGebouwdeMijn`).
  const strijdersOpleidenBevestigd = state.gezieneEenmaligeUitleg.includes("strijdersOpleiden");
  // Stad-upgrade-uitleg-pop-up (issue: "city improvement menu toevoegen"):
  // zelfde eenmalige-confirm-vlag, getoond zodra er voor het eerst genoeg
  // voedsel is voor de groei-tier klein→middel (zie `toonStadUpgradeUitlegPopup`
  // hieronder).
  const stadUpgradeUitlegBevestigd = state.gezieneEenmaligeUitleg.includes("stadUpgrade");
  // "De vijand aan de horizon"- en "Goddelijke raadgeving"-pop-ups (issue:
  // "tutorial popups wijzigen", trigger van de eerste verschoven van streek 2
  // naar 3 door "Tweede streek boerderij", trigger van de laatste verschoven
  // van streek 3 naar 4 door "jagen en farmen omdraaien"): zelfde
  // eenmalige-confirm-vlaggen, getoond zodra respectievelijk streek 3
  // (Militair/Wachttoren, Economisch/Mijn) en streek 4
  // (Wetenschappelijk/Sterrencirkel) voor het eerst ontgrendeld worden — zie
  // `toonVijandAanDeHorizonPopup`/`toonGoddelijkeRaadgevingPopup` hieronder.
  const vijandAanDeHorizonBevestigd = state.gezieneEenmaligeUitleg.includes("vijandAanDeHorizon");
  const goddelijkeRaadgevingBevestigd = state.gezieneEenmaligeUitleg.includes("goddelijkeRaadgeving");
  // Roofdier-intro-uitleg-pop-up (hoofdstuk 14/17, issue: "Eerste streek geen
  // roofdieren"): zelfde eenmalige-confirm-vlag als de twee hierboven,
  // getoond zodra streek `ROOFDIER_MIN_STREEK` (world.ts) voor het eerst
  // ontgrendelt — zie `toonRoofdierIntroPopup` hieronder.
  const roofdierIntroBevestigd = state.gezieneEenmaligeUitleg.includes("roofdierIntro");
  // Wachttoren-overal-uitleg-pop-up (issue: "meer uitleg", trigger verschoven
  // van streek 2 naar 3 door "Tweede streek boerderij"): zelfde
  // eenmalige-confirm-vlag, getoond zodra streek 3 voor het eerst ontgrendelt
  // — legt uit waarom de Wachttoren (anders dan alle andere bouwwerken) op
  // elke ontgrendelde streek te plaatsen is.
  const wachttorenOveralUitlegBevestigd = state.gezieneEenmaligeUitleg.includes("wachttorenOveral");
  // Voedsel-balans-uitleg-pop-up (issue: "meer uitleg", trigger verschoven van
  // streek 4 naar streek 1 door "jagen en farmen omdraaien"): zelfde
  // eenmalige-confirm-vlag, getoond zodra streek 1 voor het eerst ontgrendelt
  // — vrijwel meteen, het moment waarop de jacht de enige voedselbron is (de
  // boerderij komt pas later bij, uitgelegd via BoerderijKlaarUitlegPopup).
  const voedselBalansUitlegBevestigd = state.gezieneEenmaligeUitleg.includes("voedselBalans");
  // Settler-acties-uitleg-pop-up (issue: "meer uitleg"): zelfde eenmalige-
  // confirm-vlag, getoond zodra de settler in beurt 2 verschijnt — legt de
  // drie losse settler-acties uit (wegaanleg, jacht, houtkap), en dat bouwen
  // zelf niet vereist dat de settler op de bouwplek staat.
  const settlerActiesUitlegBevestigd = state.gezieneEenmaligeUitleg.includes("settlerActies");
  // Beurtensysteem-uitleg-pop-up (issue: "meer uitleg"): zelfde eenmalige-
  // confirm-vlag, getoond zodra beurt 2 begint — het eerste moment waarop een
  // volledige beurt (verbruik + productie) al is doorgerekend.
  const beurtensysteemUitlegBevestigd = state.gezieneEenmaligeUitleg.includes("beurtensysteem");
  // Stadsverbeteringen-uitleg-pop-up (issue: "Uitleg city improvements"):
  // zelfde eenmalige-confirm-vlag, getoond zodra streek 2 voor het eerst
  // ontgrendelt — zie `toonStadsverbeteringenUitlegPopup` hieronder.
  const stadsverbeteringenUitlegBevestigd = state.gezieneEenmaligeUitleg.includes("stadsverbeteringen");
  // Tweede-settler-uitleg-pop-up (issue #261, "Uitleg 2e settler"): zelfde
  // eenmalige-confirm-vlag, getoond zodra `TWEEDE_SETTLER_MIN_STREEK` voor
  // het eerst ontgrendelt — zie `toonTweedeSettlerUitlegPopup` hieronder.
  const tweedeSettlerUitlegBevestigd = state.gezieneEenmaligeUitleg.includes("tweedeSettler");
  // Onrust-uitleg-pop-up (issue: "Onrust, Saloon en Courthouse", issue-comment:
  // "Laat dit vergezellen van een pop-up die dit uitlegt"; issue "Onrust
  // indicator": "zodra dat je de eerste onrust krijgt ... een dynamische
  // pop-up met uitleg"): zelfde eenmalige-confirm-vlag, getoond zodra de
  // speler voor het eerst daadwerkelijk onrust > 0 heeft — zie
  // `toonOnrustUitlegPopup` verderop.
  const onrustUitlegBevestigd = state.gezieneEenmaligeUitleg.includes("onrust");
  // Bouw-pop-up-vervangende uitleg-pop-ups (issue: "Teksten aanpassen (nog
  // meer)"): zelfde eenmalige-confirm-vlaggen, getoond in plaats van de
  // gewone bouw-pop-up op de tweede/derde bouw-beurt van streek 1 en de
  // eerste/tweede van streek 2 — zie `toonHeiligdomUitlegPopup` e.a. hieronder.
  const heiligdomUitlegBevestigd = state.gezieneEenmaligeUitleg.includes("heiligdom");
  const nietBouwenUitlegBevestigd = state.gezieneEenmaligeUitleg.includes("nietBouwen");
  const boerderijStreekUitlegBevestigd = state.gezieneEenmaligeUitleg.includes("boerderijStreek");
  const houtkapStreekUitlegBevestigd = state.gezieneEenmaligeUitleg.includes("houtkapStreek");
  // Settler-wegsnelheid-uitleg-pop-up (issue: "Settlers verplaatsen sneller
  // over wegen"): zelfde eenmalige-confirm-vlag, getoond zodra er minstens 2
  // wegvakjes liggen — zie `toonSettlerWegSnelheidUitlegPopup` hieronder.
  const settlerWegSnelheidUitlegBevestigd = state.gezieneEenmaligeUitleg.includes("settlerWegSnelheid");
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
  // Courthouse-bemanning (issue: "Onrust, Saloon en Courthouse") — zelfde
  // keuze-modus-vlag als `toonWachttorenBemanningsKeuze` hierboven.
  const [toonCourthouseBemanningsKeuze, setToonCourthouseBemanningsKeuze] = useState(false);
  // Legerkamp-toewijzingsflow (hoofdstuk 6, issue: "De Bezette Streek,
  // missionaris en verkenner", Deel 5) — zelfde soort kies-modus als
  // hierboven, maar voor een Legerkamp-tile i.p.v. een Wachttoren-tile.
  const [legerkampKiesModusStrijderId, setLegerkampKiesModusStrijderId] = useState<string | null>(null);
  // Confrontatie-bevestigingsflow (issue: "Militaire confrontatie" — eerst
  // een pop-up met de winkans/verlieskans tonen, pas na een expliciete
  // bevestiging de confrontatie daadwerkelijk uitvoeren): zelfde soort
  // keuze-modus-vlag als `toonWachttorenBemanningsKeuze` hierboven.
  const [toonConfrontatieBevestiging, setToonConfrontatieBevestiging] = useState(false);
  // Stichtings-bevestiging (hoofdstuk 2/10/16, issue: "stad stichten op de
  // frontier" deel 4): geopend via de "Stad stichten"-knop in SettlerPaneel,
  // bevestigd/geannuleerd via StichtStadPopup. `stichtStadSlot` onthoudt met
  // welke settler-kaart de knop is ingedrukt (issue: "Altijd 2e settler"
  // #236 — er kunnen nu twee settlers tegelijk bestaan), zodat de bevestiging
  // de juiste settler verbruikt.
  const [toonStichtStadPopup, setToonStichtStadPopup] = useState(false);
  const [stichtStadSlot, setStichtStadSlot] = useState<SettlerSlot>("primair");
  // Welke settler op dit moment via de kaart op canvas-klikken reageert
  // (issue #236): met twee settlers tegelijk moet de speler kunnen kiezen
  // welke er beweegt — zie de kies-knop per kaart in SettlerPaneel. Blijft
  // "primair" zolang er geen tweede settler is, en negeert simpelweg elke
  // canvas-klik als de geselecteerde settler net niet (meer) bestaat.
  const [settlerSelectie, setSettlerSelectie] = useState<SettlerSlot>("primair");
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
    setToonCourthouseBemanningsKeuze(false);
    setLegerkampKiesModusStrijderId(null);
    setToonConfrontatieBevestiging(false);
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
  // Courthouse-bemannen (issue: "Onrust, Saloon en Courthouse") — zelfde
  // patroon als `geselecteerdeTileIsWachttoren`/`wachttorenBemanner`
  // hierboven, maar met een Rechter i.p.v. een Strijder.
  const geselecteerdeTileIsCourthouse =
    geselecteerdeTileVoorRush?.status === "actief" && geselecteerdeTileVoorRush.improvement?.id === "courthouse";
  const courthouseBemanner =
    geselecteerdeTileIsCourthouse && geselecteerdeTile
      ? state.stad.rechters.find(
          (r) =>
            r.courthouse?.hoogte === geselecteerdeTile.hoogte &&
            r.courthouse?.positieInStreek === geselecteerdeTile.positieInStreek
        )
      : undefined;
  // Bezette Streek — klikbare kaart i.p.v. stadsscherm (issue: "Bezette streek
  // scherm"): een klik op een nog verhuld vakje, een onthulde vijandelijke
  // Wachttoren of een onthuld vijandelijk Heiligdom geeft de tile-info-pop-up
  // er een eigen actie bij (`verkenningVraag`/`confrontatieVraag`/
  // `missionarisVraag` hieronder) — zelfde patroon als `wachttorenVraag`
  // hierboven.
  const geselecteerdeTileIsVerhuld = Boolean(geselecteerdeTileVoorRush?.verhuld);
  // Wampanoag-laag (Going West, M21e, opdracht-wampanoag-opening.md §5) —
  // zelfde soort afgeleide vlag als `geselecteerdeTileIsVerhuld` hierboven,
  // maar voor de losstaande Wampanoag-verhullingslaag (wampanoag.ts) i.p.v.
  // de Bezette Streek.
  const geselecteerdeTileIsWampanoagVerhuld = Boolean(geselecteerdeTileVoorRush?.wampanoagVerhuld);
  // Wampanoag-handel (Going West, M21f, opdracht-wampanoag-opening.md §6) —
  // zelfde soort afgeleide vlag als hierboven, maar voor een al onthuld
  // Wampanoag-vakje: die krijgt in de tile-info-pop-up de grondstofkeuze
  // (`wampanoagHandelVraag`) i.p.v. de verkenner-actie.
  const geselecteerdeTileIsWampanoagOnthuld = Boolean(
    geselecteerdeTileVoorRush?.wampanoagInhoud && !geselecteerdeTileVoorRush.wampanoagVerhuld
  );
  const geselecteerdeTileIsVijandelijkeWachttoren =
    geselecteerdeTileVoorRush?.status === "actief" && geselecteerdeTileVoorRush.improvement?.id === "vijandelijke-wachttoren";
  const geselecteerdeTileIsVijandelijkHeiligdom =
    geselecteerdeTileVoorRush?.status === "actief" && geselecteerdeTileVoorRush.improvement?.id === "vijandelijk-heiligdom";
  // Alleen de relevante streken op de canvas (issue: "onderkant altijd in
  // view" + "onontdekte tegels weg", en sinds issue "Nieuwe stad Cincinnati"
  // ook de dichtgeklapte streken van vóór de huidige stad) — zie world.ts:
  // `zichtbareStreken`. `state.stad.streekHoogte` is de streek waarop de
  // actieve (laatst-gestichte) stad staat — voor de tutorial en de eerste
  // Going West-stad altijd 1, dus geen enkele streek klapt dan dicht.
  const zichtbareStrekenState = zichtbareStreken(state.streken, state.stad.streekHoogte);

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
          ? beschrijfTile(
              geselecteerdeStreek,
              state.streken,
              state.stad,
              geselecteerdeTile.positieInStreek,
              state.voorraad,
              state.technologieen,
              campagne
            )
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

  // Goudader-vondst-eis (hoofdstuk 3/14, issue: "toevoeging Goud" Deel 1):
  // een leeg heuvel/bergvakje voldoet aan de gewone terrein-eis van de
  // Goudader, maar zonder een goudader-vondst (`tile.goud`, zie world.ts)
  // is het alsnog geen geldig plaatsingsdoel — apart van `terreinMismatch`
  // hierboven zodat de UI de juiste reden kan tonen.
  const goudMismatch =
    plaatsingsImprovement?.id === "goudmijn" &&
    doelTileVoorPlaatsing?.status === "leeg" &&
    !terreinMismatch &&
    !doelTileVoorPlaatsing.goud;

  const isGeldigPlaatsingsDoel =
    plaatsingsImprovement !== null &&
    doelTileVoorPlaatsing?.status === "leeg" &&
    !terreinMismatch &&
    !goudMismatch;

  // Settler actief zodra de beurt begint (issue: "de settler unit is actief
  // als je aan je beurt begint, de tegels waar je heen kunt lichten op, door
  // te klikken op een tegel ga je er naar toe") — alleen buiten een lopende
  // bouwplaatsing, zodat een tile-klik nooit tussen twee betekenissen kan
  // zweven. De bereikbare vakjes lichten op via GameCanvas/canvas.ts; een
  // klik erop verplaatst de settler meteen in plaats van de tile-info-popup
  // te openen (zie `handleTileClick` hieronder).
  // Tweede settler (issue: "Altijd 2e settler" #236): een klik op de canvas
  // beweegt altijd de op dat moment geselecteerde settler (`settlerSelectie`,
  // via de kies-knop per kaart in SettlerPaneel) — niet automatisch "beide",
  // want elke settler doet hoogstens 1 actie per beurt, onafhankelijk van de
  // ander.
  const geselecteerdeSettler = settlerSelectie === "primair" ? state.settler : state.tweedeSettler;
  const geselecteerdeSettlerActieGedaan =
    settlerSelectie === "primair" ? state.settlerActieGedaanDitBeurt : state.tweedeSettlerActieGedaanDitBeurt;
  const settlerKanBewegen =
    Boolean(geselecteerdeSettler) &&
    !geselecteerdeSettlerActieGedaan &&
    !plaatsingsImprovement &&
    !legerkampKiesModusStrijderId;
  const settlerBereikbarePosities = settlerKanBewegen ? bereikbarePosities(state.streken, geselecteerdeSettler!) : [];

  // Actieve, nog onbemande Legerkamp-tiles tijdens het bemannen (hoofdstuk 6,
  // issue: "De Bezette Streek, missionaris en verkenner", Deel 5) — zelfde
  // alleen-tijdens-de-modus-berekenen-patroon als `settlerBereikbarePosities`
  // hierboven, en meteen ook de enige geldige klikdoelen in `handleTileClick`.
  const legerkampBereikbarePosities = legerkampKiesModusStrijderId ? onbemandeLegerkampPosities(state) : [];
  // Nog verhulde vakjes van de actieve Bezette Streek (issue: "Bezette streek
  // scherm") — puur een highlight op de canvas, geen losse kies-modus meer:
  // een klik op zo'n vakje opent gewoon de tile-info-pop-up met de
  // `verkenningVraag`-actie erbij (zie `handleTileClick`/`TileInfoPopup`).
  // De Bezette-Streek- en Wampanoag-verhullingslagen draaien in de praktijk
  // nooit tegelijk (respectievelijk tutorial-only op streek 13 en
  // Going-West-only op de Wampanoag-streek), dus deze twee highlight-bronnen mogen
  // zonder conflict samengevoegd worden — geen aparte prop nodig op
  // GameCanvas (M21e, opdracht-wampanoag-opening.md §5).
  const verkenningBereikbarePosities = [...verhuldeBezetteStreekPosities(state), ...verhuldeWampanoagPosities(state)];

  function handleTileClick(hoogte: number, positieInStreek: number) {
    // Legerkamp-kies-modus (hoofdstuk 6, issue: "De Bezette Streek,
    // missionaris en verkenner") heeft voorrang op settler-verplaatsing/tile-
    // selectie: een klik op een gehighlight, dus geldig, vakje voert de
    // bijbehorende actie uit en sluit de modus af; een klik ernaast laat de
    // modus openstaan zodat de speler opnieuw kan mikken.
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

    const isSettlerDoel = settlerBereikbarePosities.some(
      (positie) => positie.hoogte === hoogte && positie.positieInStreek === positieInStreek
    );
    if (settlerKanBewegen && isSettlerDoel) {
      verplaatsSettlerNaar(hoogte, positieInStreek, settlerSelectie);
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
    setToonConfrontatieBevestiging(false);
    setGeselecteerdeTile({ hoogte, positieInStreek });
  }

  function bevestigBouw() {
    if (!plaatsingsImprovement || !geselecteerdeTile) return;
    startBouw(geselecteerdeTile.hoogte, plaatsingsImprovement, geselecteerdeTile.positieInStreek);
    setPlaatsingsImprovement(null);
    setGeselecteerdeTile(null);
  }

  // Alle tutorial-uitleg-pop-ups (openings/settler/boerderij/militair) zijn
  // via het hoofdmenu aan/uit te zetten (issue: "een setting waarmee je deze
  // uitleg pop-ups aan en uit kunt zetten") — streek-flavor, indringers en de
  // tutorial-voltooid-samenvatting blijven altijd zichtbaar, dat is
  // kerninhoud, geen uitleg. De voedseltekort-waarschuwing hoort inmiddels ook
  // bij die kerninhoud (issue: "pop-up voedseltekort hoort bij de game, niet
  // bij de uitleg") — zie `toonVoedselWaarschuwingPopup` hieronder, die
  // daarom niet meer van `uitlegAan` afhangt.
  const uitlegAan = state.uitlegPopupsAan;

  // Blocker 3 (hoofdstuk 19, design-doc): een streek-popup alleen tonen als er
  // ook daadwerkelijk streek-content voor bestaat — zonder deze eis blijft
  // `laatstBevestigdeStreek` (alleen bijgewerkt via de "Doorgaan"-knop van deze
  // popup) permanent achter zodra een campagnekaart verder komt dan de
  // beschikbare content, wat via de `!toonStreekPopup`-keten hieronder alle
  // lager-prioriteit pop-ups blokkeert, inclusief de verplichte tech-keuze.
  // Campagne-openings-pop-up (zie `campagneOpeningBevestigd` hierboven):
  // hoogste prioriteit van alle beurt-1-pop-ups — dit zet de openingsscène
  // vóórdat de speler zelfs de eerste-streek-inhoud (`toonStreekPopup`)
  // te zien krijgt. `popupContent` geeft `undefined` terug voor campagnes
  // zonder `campagneOpeningPopup`-tekst (o.a. de tutorial), dus deze pop-up
  // verschijnt vooralsnog alleen op Going West.
  const toonCampagneOpeningPopup =
    state.beurt === 1 && !campagneOpeningBevestigd && popupContent(campagne, "campagneOpeningPopup") !== undefined;
  const toonStreekPopup =
    !toonCampagneOpeningPopup &&
    actieveStreek.hoogte > laatstBevestigdeStreek &&
    streekContentVoorCampagne(state.campagneId, actieveStreek.hoogte) !== undefined;
  // Openings-uitleg bij het begin van beurt 1 (issue: "uitleg pop-ups
  // dynamisch tonen") — geen vast beurtbereik meer, één vaste pop-up.
  const toonUitlegPopup =
    !toonCampagneOpeningPopup && !toonStreekPopup && uitlegAan && state.beurt === 1 && !openingsUitlegBevestigd;
  // Settler-uitleg direct nadat de settler in beurt 2 verschijnt (hoofdstuk
  // 16) — gekoppeld aan `state.settler` zelf i.p.v. een los beurtnummer, dus
  // hij verschijnt op precies hetzelfde moment als de settler zelf.
  const toonSettlerUitlegPopup =
    !toonStreekPopup && !toonUitlegPopup && uitlegAan && Boolean(state.settler) && !settlerUitlegBevestigd;
  // Voedselwaarschuwing-pop-up (issue: "uitleg pop-ups dynamisch tonen" —
  // vervangt de vroegere vaste beurt-3-pop-up) — zie economie.ts
  // `verwerkVerval` voor de trigger zelf (voedsel dreigt binnen 5 beurten op
  // te raken). Hangt bewust niet (meer) af van `uitlegAan` (issue: "pop-up
  // voedseltekort hoort bij de game, niet bij de uitleg"): een dreigend
  // voedseltekort is kerninhoud van het spel, geen tutorial-uitleg, en moet
  // dus ook zichtbaar zijn als de speler de uitleg-pop-ups heeft uitgezet —
  // net als de streek-flavor- en indringers-pop-ups hierboven.
  const toonVoedselWaarschuwingPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    state.stad.vervalStatus === "kritiek" &&
    !voedselWaarschuwingBevestigd;
  // "De vijand aan de horizon"-pop-up (issue: "tutorial popups wijzigen",
  // trigger verschoven van streek 2 naar 3 door "Tweede streek boerderij"):
  // zodra streek 3 voor het eerst ontgrendelt — het moment waarop Militair/de
  // Wachttoren en Economisch/de Mijn beschikbaar komen (zie improvements.ts:
  // `minStreek`).
  const toonVijandAanDeHorizonPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    uitlegAan &&
    !vijandAanDeHorizonBevestigd &&
    hoogsteOntgrendeldeStreek(state.streken) >= 3;
  // "Goddelijke raadgeving"-pop-up (issue: "tutorial popups wijzigen", trigger
  // verschoven van streek 3 naar 4 door "jagen en farmen omdraaien"): zodra
  // streek 4 voor het eerst ontgrendelt — het moment waarop Wetenschappelijk/de
  // Sterrencirkel beschikbaar komt (zie improvements.ts: `minStreek`).
  const toonGoddelijkeRaadgevingPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    uitlegAan &&
    !goddelijkeRaadgevingBevestigd &&
    hoogsteOntgrendeldeStreek(state.streken) >= 4;
  // Roofdier-intro-uitleg-pop-up (hoofdstuk 14/17, issue: "Eerste streek geen
  // roofdieren"): zodra streek `ROOFDIER_MIN_STREEK` voor het eerst
  // ontgrendelt — vóór de speler er ooit kan jagen, dus vóór het risico voor
  // het eerst kan optreden (zie `jaag` in acties.ts).
  const toonRoofdierIntroPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    uitlegAan &&
    !roofdierIntroBevestigd &&
    hoogsteOntgrendeldeStreek(state.streken) >= ROOFDIER_MIN_STREEK;
  // Boerderij-klaar-uitleg-pop-up (issue: "uitleg pop-ups dynamisch tonen",
  // inhoud aangepast door "jagen en farmen omdraaien" en nogmaals door
  // "Tweede streek boerderij"): zodra er voor het eerst een actieve,
  // wegverbonden boerderij meeproduceert — dat is nu ten vroegste streek 2,
  // en dit introduceert de boerderij als tweede voedselbron naast de jacht
  // (het Heiligdom is dan al bekend, de Wachttoren nog niet — zie
  // tutorialContent.ts: `BOERDERIJ_KLAAR_TEKST`).
  const toonBoerderijKlaarUitlegPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonRoofdierIntroPopup &&
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
    !toonGoddelijkeRaadgevingPopup &&
    !toonRoofdierIntroPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    uitlegAan &&
    !strijdersOpleidenBevestigd &&
    heeftGebouwdeMijn(state);
  // Bezette-Streek-intro (hoofdstuk 6, issue: "De Bezette Streek, missionaris en
  // verkenner", Deel 2 — vervangt de eerdere, kleinere MilitairUitlegPopup):
  // verschijnt zodra `verwerkStreekOntgrendeling` (economie.ts) streek 13 "in
  // beeld" brengt. Los van de uitleg-toggle (kerninhoud, geen uitleg, net als
  // de indringers-/goudader-pop-ups) — daarom hier bewust géén `uitlegAan`-
  // check, ook al staat de flag qua prioriteit tussen de uitleg-pop-ups in.
  const toonBezetteStreekOntdektPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonRoofdierIntroPopup &&
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
    !toonGoddelijkeRaadgevingPopup &&
    !toonRoofdierIntroPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    uitlegAan &&
    // Blocker 2 (hoofdstuk 19, design-doc): per-campagne streek-aantal i.p.v.
    // de tutorial-constante `TUTORIAL_STREEK_AANTAL` — `state.streken.length`
    // is al de lengte van de actieve campagnekaart (zie ook `acties.ts`:
    // `isAfsluitendeStichting`), dus deze popup verschijnt nu op de laatste
    // streek van elke campagne, niet alleen op streek 14.
    actieveStreek.hoogte === state.streken.length &&
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
    !toonGoddelijkeRaadgevingPopup &&
    !toonRoofdierIntroPopup &&
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
  // de melding afhandelt (tribuut geven, wampum-afkoop of gewoon wegklikken).
  // Los van de uitleg-toggle hierboven — dit is kerninhoud, geen uitleg.
  const toonIndringersPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonRoofdierIntroPopup &&
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
    !toonGoddelijkeRaadgevingPopup &&
    !toonRoofdierIntroPopup &&
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
    !toonGoddelijkeRaadgevingPopup &&
    !toonRoofdierIntroPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    Boolean(state.roofdierEvent);
  // Goudader-ontdekkingspop-up (hoofdstuk 3/14, issue: "toevoeging Goud") —
  // zelfde blokkerende vorm en prioriteit als de kudde-/roofdier-pop-ups
  // hierboven, ook los van de uitleg-toggle: dit is kerninhoud, geen uitleg.
  const toonGoudOntdektPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonRoofdierIntroPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    !toonRoofdierPopup &&
    Boolean(state.goudOntdektEvent);
  // Tweede Goudader-ontdekkingspop-up (hoofdstuk 3/11/14, issue: "Goudader
  // sowieso op streek 12") — zelfde blokkerende vorm en prioriteit als de
  // eerste Goudader-pop-up hierboven, één stap lager zodat de eerste vondst
  // altijd voorrang krijgt als beide toevallig in dezelfde beurt triggeren.
  const toonTweedeGoudOntdektPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonRoofdierIntroPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    !toonRoofdierPopup &&
    !toonGoudOntdektPopup &&
    Boolean(state.tweedeGoudOntdektEvent);
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
    !toonGoddelijkeRaadgevingPopup &&
    !toonRoofdierIntroPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    !toonRoofdierPopup &&
    !toonGoudOntdektPopup &&
    !toonTweedeGoudOntdektPopup &&
    Boolean(state.techKeuzeEvent);
  // Vijandelijk-Heiligdom-onthuld-/veroverd-pop-ups (hoofdstuk 6, issue: "De
  // Bezette Streek, missionaris en verkenner", Deel 4, herzien door "Bezette
  // streek scherm") — zelfde blokkerende vorm en prioriteit als de overige
  // kerninhoud-meldingen hierboven. "Onthuld" gaat voor "veroverd" (kan in
  // theorie dezelfde beurt allebei gezet zijn — onthullen via Verkenning,
  // veroveren via de wololo-meter — de speler ziet dan eerst de onthulling).
  const toonVijandelijkHeiligdomOnthuldPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonRoofdierIntroPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    !toonRoofdierPopup &&
    !toonGoudOntdektPopup &&
    !toonTweedeGoudOntdektPopup &&
    !toonTechKeuzePopup &&
    Boolean(state.vijandelijkHeiligdomOnthuldEvent);
  const toonVijandelijkHeiligdomVeroverdPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonRoofdierIntroPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    !toonRoofdierPopup &&
    !toonGoudOntdektPopup &&
    !toonTweedeGoudOntdektPopup &&
    !toonTechKeuzePopup &&
    !toonVijandelijkHeiligdomOnthuldPopup &&
    Boolean(state.vijandelijkHeiligdomVeroverdEvent);
  // Wachttoren-overal-uitleg-pop-up (issue: "meer uitleg", trigger verschoven
  // van streek 2 naar 3 door "Tweede streek boerderij"): laagste prioriteit
  // van de uitleg-pop-ups, zodat hij nooit kerninhoud (indringers/kudde/
  // roofdier/goud/tech/bezette streek) onderbreekt — verschijnt zodra streek
  // 3 voor het eerst ontgrendelt en alle hogere-prioriteit pop-ups afgehandeld
  // zijn.
  const toonWachttorenOveralUitlegPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonRoofdierIntroPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    !toonRoofdierPopup &&
    !toonGoudOntdektPopup &&
    !toonTweedeGoudOntdektPopup &&
    !toonTechKeuzePopup &&
    !toonVijandelijkHeiligdomOnthuldPopup &&
    !toonVijandelijkHeiligdomVeroverdPopup &&
    uitlegAan &&
    !wachttorenOveralUitlegBevestigd &&
    hoogsteOntgrendeldeStreek(state.streken) >= 3;
  // Voedsel-balans-uitleg-pop-up (issue: "meer uitleg", trigger verschoven
  // van streek 4 naar streek 1 door "jagen en farmen omdraaien"; opnieuw
  // verschoven, issue: "genoeg hout om ook boerderij te bouwen" — van "streek
  // 1 ontgrendeld" (vrijwel altijd meteen bij de start) naar "de gegarandeerde
  // startkudde is verschenen"): direct na de kudde-pop-up hierboven (zelfde
  // lage prioriteit, `!toonKuddePopup`), zodat deze uitleg pas komt op het
  // moment waarop de tekst ("er is een kudde verschenen") ook daadwerkelijk
  // klopt.
  const toonVoedselBalansUitlegPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonRoofdierIntroPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    !toonRoofdierPopup &&
    !toonGoudOntdektPopup &&
    !toonTweedeGoudOntdektPopup &&
    !toonTechKeuzePopup &&
    !toonVijandelijkHeiligdomOnthuldPopup &&
    !toonVijandelijkHeiligdomVeroverdPopup &&
    !toonWachttorenOveralUitlegPopup &&
    uitlegAan &&
    !voedselBalansUitlegBevestigd &&
    Boolean(state.eersteKuddeVerschenen);
  // Settler-acties-uitleg-pop-up (issue: "meer uitleg"): zelfde lage
  // prioriteit als de twee pop-ups hierboven — verschijnt zodra de settler in
  // beurt 2 verschijnt (zelfde trigger als SettlerUitlegPopup), en legt de
  // drie losse settler-acties (weg aanleggen, jagen, hout hakken) uit, plus
  // dat bouwen zelf niet vereist dat de settler op de bouwplek staat.
  const toonSettlerActiesUitlegPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonRoofdierIntroPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    !toonRoofdierPopup &&
    !toonGoudOntdektPopup &&
    !toonTweedeGoudOntdektPopup &&
    !toonTechKeuzePopup &&
    !toonVijandelijkHeiligdomOnthuldPopup &&
    !toonVijandelijkHeiligdomVeroverdPopup &&
    !toonWachttorenOveralUitlegPopup &&
    !toonVoedselBalansUitlegPopup &&
    uitlegAan &&
    !settlerActiesUitlegBevestigd &&
    Boolean(state.settler);
  // Beurtensysteem-uitleg-pop-up (issue: "meer uitleg", trigger verschoven
  // van "beurt 2 begint" naar "de Steengroeve is geplaatst" door issue:
  // "Teksten aanpassen (nog meer)" — dat is het moment waarop de tekst, die
  // over bouwmateriaal-verbruik gaat, ook daadwerkelijk relevant is): zelfde
  // lage prioriteit, direct na de pop-up hierboven.
  const toonBeurtensysteemUitlegPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonRoofdierIntroPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    !toonRoofdierPopup &&
    !toonGoudOntdektPopup &&
    !toonTweedeGoudOntdektPopup &&
    !toonTechKeuzePopup &&
    !toonVijandelijkHeiligdomOnthuldPopup &&
    !toonVijandelijkHeiligdomVeroverdPopup &&
    !toonWachttorenOveralUitlegPopup &&
    !toonVoedselBalansUitlegPopup &&
    !toonSettlerActiesUitlegPopup &&
    uitlegAan &&
    !beurtensysteemUitlegBevestigd &&
    heeftGeplaatsteSteengroeve(state);
  // Stadsverbeteringen-uitleg-pop-up (issue: "Uitleg city improvements"):
  // zodra streek 2 voor het eerst ontgrendelt. Bibliotheek en Markt hebben
  // geen `minStreek`-eis (improvements.ts) en zijn dus strikt genomen al
  // vanaf streek 1 bouwbaar, maar streek 1 zit al vol met eigen uitleg
  // (jacht, heiligdom, steengroeve, voedselbalans). Streek 2 is de
  // eerstvolgende streek-ontgrendeling zonder een eigen "zodra streek X
  // ontgrendelt"-pop-up (vergelijk `toonVijandAanDeHorizonPopup`/
  // `toonGoddelijkeRaadgevingPopup` hierboven, voor streek 3/4) — een
  // rustiger moment om het altijd-zichtbare Stadsverbeteringen-paneel
  // (StadsverbeteringenPaneel.tsx, in het stadsmenu) voor het eerst onder de
  // aandacht te brengen.
  const toonStadsverbeteringenUitlegPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonRoofdierIntroPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    !toonRoofdierPopup &&
    !toonGoudOntdektPopup &&
    !toonTweedeGoudOntdektPopup &&
    !toonTechKeuzePopup &&
    !toonVijandelijkHeiligdomOnthuldPopup &&
    !toonVijandelijkHeiligdomVeroverdPopup &&
    !toonWachttorenOveralUitlegPopup &&
    !toonVoedselBalansUitlegPopup &&
    !toonSettlerActiesUitlegPopup &&
    !toonBeurtensysteemUitlegPopup &&
    uitlegAan &&
    !stadsverbeteringenUitlegBevestigd &&
    hoogsteOntgrendeldeStreek(state.streken) >= 2;
  // Tweede-settler-uitleg-pop-up (issue #261, "Uitleg 2e settler"): laagste
  // prioriteit van de streek-drempel-uitleg-pop-ups, verschijnt zodra
  // `TWEEDE_SETTLER_MIN_STREEK` voor het eerst ontgrendelt — hetzelfde moment
  // waarop `kanTweedeSettlerBouwen` (groeiEnRekrutering.ts) voor het eerst
  // waar wordt.
  const toonTweedeSettlerUitlegPopup =
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
    !toonGoudOntdektPopup &&
    !toonTweedeGoudOntdektPopup &&
    !toonTechKeuzePopup &&
    !toonVijandelijkHeiligdomOnthuldPopup &&
    !toonVijandelijkHeiligdomVeroverdPopup &&
    !toonWachttorenOveralUitlegPopup &&
    !toonVoedselBalansUitlegPopup &&
    !toonSettlerActiesUitlegPopup &&
    !toonBeurtensysteemUitlegPopup &&
    !toonStadsverbeteringenUitlegPopup &&
    uitlegAan &&
    !tweedeSettlerUitlegBevestigd &&
    hoogsteOntgrendeldeStreek(state.streken) >= TWEEDE_SETTLER_MIN_STREEK;
  // Bouw-ritme (hoofdstuk 16): een nieuw bouwproject mag pas weer gestart
  // worden vanaf `volgendeBouwBeurt` — de `?? 1` is puur een veilige default
  // voor een save van vóór dit veld bestond.
  const kanBouwen = state.beurt >= (state.volgendeBouwBeurt ?? 1);
  // Bouw-pop-up-vervangende uitleg-pop-ups (issue: "Teksten aanpassen (nog
  // meer)"): op streek 1 vervangen ze de tweede en derde keer dat de bouw-
  // pop-up zou verschijnen, op streek 2 de eerste en tweede keer — geteld via
  // `bouwPopupAfgehandeldTellerPerStreek` (infrastructuurEnBouw.ts), dat elke
  // keer ophoogt zodra de bouw-pop-up voor de huidige (frontier-)streek
  // wordt afgehandeld (gebouwd óf overgeslagen). `+ 1` omdat de teller pas
  // ná afhandeling ophoogt: de eerste keer staat hij nog op 0. Net als de
  // gewone bouw-pop-up alleen relevant zolang er deze beurt nog een
  // bouwkeuze openstaat (`kanBouwen && !state.bouwKeuzeGedaanDitBeurt`).
  const bouwPopupWeergaveNummer =
    (state.bouwPopupAfgehandeldTellerPerStreek?.[actieveStreek.hoogte] ?? 0) + 1;
  const magBouwUitlegTonen = kanBouwen && !state.bouwKeuzeGedaanDitBeurt;
  const toonHeiligdomUitlegPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonRoofdierIntroPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    !toonRoofdierPopup &&
    !toonGoudOntdektPopup &&
    !toonTweedeGoudOntdektPopup &&
    !toonTechKeuzePopup &&
    !toonVijandelijkHeiligdomOnthuldPopup &&
    !toonVijandelijkHeiligdomVeroverdPopup &&
    !toonWachttorenOveralUitlegPopup &&
    !toonVoedselBalansUitlegPopup &&
    !toonSettlerActiesUitlegPopup &&
    !toonBeurtensysteemUitlegPopup &&
    !toonStadsverbeteringenUitlegPopup &&
    !toonTweedeSettlerUitlegPopup &&
    uitlegAan &&
    !heiligdomUitlegBevestigd &&
    magBouwUitlegTonen &&
    actieveStreek.hoogte === 1 &&
    bouwPopupWeergaveNummer === 2;
  const toonNietBouwenUitlegPopup =
    !toonHeiligdomUitlegPopup &&
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonRoofdierIntroPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    !toonRoofdierPopup &&
    !toonGoudOntdektPopup &&
    !toonTweedeGoudOntdektPopup &&
    !toonTechKeuzePopup &&
    !toonVijandelijkHeiligdomOnthuldPopup &&
    !toonVijandelijkHeiligdomVeroverdPopup &&
    !toonWachttorenOveralUitlegPopup &&
    !toonVoedselBalansUitlegPopup &&
    !toonSettlerActiesUitlegPopup &&
    !toonBeurtensysteemUitlegPopup &&
    !toonStadsverbeteringenUitlegPopup &&
    !toonTweedeSettlerUitlegPopup &&
    uitlegAan &&
    !nietBouwenUitlegBevestigd &&
    magBouwUitlegTonen &&
    actieveStreek.hoogte === 1 &&
    bouwPopupWeergaveNummer === 3;
  const toonBoerderijStreekUitlegPopup =
    !toonHeiligdomUitlegPopup &&
    !toonNietBouwenUitlegPopup &&
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonRoofdierIntroPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    !toonRoofdierPopup &&
    !toonGoudOntdektPopup &&
    !toonTweedeGoudOntdektPopup &&
    !toonTechKeuzePopup &&
    !toonVijandelijkHeiligdomOnthuldPopup &&
    !toonVijandelijkHeiligdomVeroverdPopup &&
    !toonWachttorenOveralUitlegPopup &&
    !toonVoedselBalansUitlegPopup &&
    !toonSettlerActiesUitlegPopup &&
    !toonBeurtensysteemUitlegPopup &&
    !toonStadsverbeteringenUitlegPopup &&
    !toonTweedeSettlerUitlegPopup &&
    uitlegAan &&
    !boerderijStreekUitlegBevestigd &&
    magBouwUitlegTonen &&
    actieveStreek.hoogte === 2 &&
    bouwPopupWeergaveNummer === 1;
  const toonHoutkapStreekUitlegPopup =
    !toonHeiligdomUitlegPopup &&
    !toonNietBouwenUitlegPopup &&
    !toonBoerderijStreekUitlegPopup &&
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonRoofdierIntroPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    !toonRoofdierPopup &&
    !toonGoudOntdektPopup &&
    !toonTweedeGoudOntdektPopup &&
    !toonTechKeuzePopup &&
    !toonVijandelijkHeiligdomOnthuldPopup &&
    !toonVijandelijkHeiligdomVeroverdPopup &&
    !toonWachttorenOveralUitlegPopup &&
    !toonVoedselBalansUitlegPopup &&
    !toonSettlerActiesUitlegPopup &&
    !toonBeurtensysteemUitlegPopup &&
    !toonStadsverbeteringenUitlegPopup &&
    !toonTweedeSettlerUitlegPopup &&
    uitlegAan &&
    !houtkapStreekUitlegBevestigd &&
    magBouwUitlegTonen &&
    actieveStreek.hoogte === 2 &&
    bouwPopupWeergaveNummer === 2;
  // Settler-wegsnelheid-uitleg-pop-up (issue: "Settlers verplaatsen sneller
  // over wegen"): getoond zodra er minstens 2 wegvakjes liggen (zie wegen.ts:
  // `aantalAangelegdeWegen` — dat is het eerste moment waarop een route van 2
  // vakjes over de weg kán bestaan). Laagste prioriteit van de streek-
  // drempel-uitleg-pop-ups, net als de andere hierboven.
  const toonSettlerWegSnelheidUitlegPopup =
    !toonHeiligdomUitlegPopup &&
    !toonNietBouwenUitlegPopup &&
    !toonBoerderijStreekUitlegPopup &&
    !toonHoutkapStreekUitlegPopup &&
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonRoofdierIntroPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    !toonRoofdierPopup &&
    !toonGoudOntdektPopup &&
    !toonTweedeGoudOntdektPopup &&
    !toonTechKeuzePopup &&
    !toonVijandelijkHeiligdomOnthuldPopup &&
    !toonVijandelijkHeiligdomVeroverdPopup &&
    !toonWachttorenOveralUitlegPopup &&
    !toonVoedselBalansUitlegPopup &&
    !toonSettlerActiesUitlegPopup &&
    !toonBeurtensysteemUitlegPopup &&
    !toonStadsverbeteringenUitlegPopup &&
    !toonTweedeSettlerUitlegPopup &&
    uitlegAan &&
    !settlerWegSnelheidUitlegBevestigd &&
    aantalAangelegdeWegen(state.streken) >= 2;
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
    !toonGoddelijkeRaadgevingPopup &&
    !toonRoofdierIntroPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    !toonRoofdierPopup &&
    !toonGoudOntdektPopup &&
    !toonTweedeGoudOntdektPopup &&
    !toonTechKeuzePopup &&
    !toonVijandelijkHeiligdomOnthuldPopup &&
    !toonVijandelijkHeiligdomVeroverdPopup &&
    !toonWachttorenOveralUitlegPopup &&
    !toonVoedselBalansUitlegPopup &&
    !toonSettlerActiesUitlegPopup &&
    !toonBeurtensysteemUitlegPopup &&
    !toonStadsverbeteringenUitlegPopup &&
    !toonTweedeSettlerUitlegPopup &&
    !toonHeiligdomUitlegPopup &&
    !toonNietBouwenUitlegPopup &&
    !toonBoerderijStreekUitlegPopup &&
    !toonHoutkapStreekUitlegPopup &&
    !toonSettlerWegSnelheidUitlegPopup &&
    // Blijft uitsluitend de tutorial (hoofdstuk 19 design-doc, "Samenhang"):
    // zonder deze eis zou een Going West-run bij de allerlaatste, afsluitende
    // stichting (acties.ts: `isAfsluitendeStichting`) dit tutorial-specifieke
    // scherm te zien krijgen — `stadGesticht` zelf is campagne-agnostisch
    // (elke afsluitende stichting zet 'm, zie `stichtStad`). Going West krijgt
    // in plaats daarvan `toonStichtingsMomentPopup` hieronder, bij elke
    // stichting, zonder de run te beëindigen.
    state.campagneId === undefined &&
    state.stadGesticht === true &&
    !tutorialVoltooidBevestigd;

  // Stichtingsmoment-pop-up (issue #278, antwoord op vraag 2, hoofdstuk 9
  // Deel 2/hoofdstuk 19 "Samenhang"): Going West-equivalent van
  // `toonTutorialVoltooidPopup` hierboven, maar bij élke stichting binnen het
  // herhalende drie-stichtingsmomenten-patroon — niet alleen de allerlaatste
  // — en de run gaat hierna gewoon door (`onDoorgaan` sluit de pop-up alleen,
  // roept anders dan bij de tutorial nooit `onTutorialAfgerond` aan). Elke
  // run begint met 1 stad, dus elke stijging van `state.steden.length` voorbij
  // `laatsteBevestigdeStedenAantal` is een echte stichting.
  const toonStichtingsMomentPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonRoofdierIntroPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    !toonRoofdierPopup &&
    !toonGoudOntdektPopup &&
    !toonTweedeGoudOntdektPopup &&
    !toonTechKeuzePopup &&
    !toonVijandelijkHeiligdomOnthuldPopup &&
    !toonVijandelijkHeiligdomVeroverdPopup &&
    !toonWachttorenOveralUitlegPopup &&
    !toonVoedselBalansUitlegPopup &&
    !toonSettlerActiesUitlegPopup &&
    !toonBeurtensysteemUitlegPopup &&
    !toonStadsverbeteringenUitlegPopup &&
    !toonTweedeSettlerUitlegPopup &&
    !toonHeiligdomUitlegPopup &&
    !toonNietBouwenUitlegPopup &&
    !toonBoerderijStreekUitlegPopup &&
    !toonHoutkapStreekUitlegPopup &&
    !toonSettlerWegSnelheidUitlegPopup &&
    !toonTutorialVoltooidPopup &&
    state.campagneId !== undefined &&
    state.steden.length > laatsteBevestigdeStedenAantal;

  // Boon-toekenningspop-up (issue #411/#414, boons.ts): moet altijd direct ná
  // de Stichtingsmoment-pop-up hierboven en vóór elke andere pop-up
  // verschijnen (issue #414, vraag 4) — daarom, anders dan de "onderaan de
  // keten"-conventie van de Wampanoag-/Smederij-/Onrust-pop-ups verderop,
  // hier hoog in de keten ingevoegd (zelfde negatie-lijst als
  // `toonStichtingsMomentPopup` plus die pop-up zelf), met de vier pop-ups
  // erna (en `BouwPopup` hieronder) die 'm op hun beurt negeren.
  const toonBoonPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonRoofdierIntroPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    !toonRoofdierPopup &&
    !toonGoudOntdektPopup &&
    !toonTweedeGoudOntdektPopup &&
    !toonTechKeuzePopup &&
    !toonVijandelijkHeiligdomOnthuldPopup &&
    !toonVijandelijkHeiligdomVeroverdPopup &&
    !toonWachttorenOveralUitlegPopup &&
    !toonVoedselBalansUitlegPopup &&
    !toonSettlerActiesUitlegPopup &&
    !toonBeurtensysteemUitlegPopup &&
    !toonStadsverbeteringenUitlegPopup &&
    !toonTweedeSettlerUitlegPopup &&
    !toonHeiligdomUitlegPopup &&
    !toonNietBouwenUitlegPopup &&
    !toonBoerderijStreekUitlegPopup &&
    !toonHoutkapStreekUitlegPopup &&
    !toonSettlerWegSnelheidUitlegPopup &&
    !toonTutorialVoltooidPopup &&
    !toonStichtingsMomentPopup &&
    Boolean(state.boonToegekendEvent);

  // Wampanoag-narratieve pop-ups (Going West, M21g, opdracht-wampanoag-opening.md
  // §7/§8): campagne-gebonden flavor-tekst uit `CampaignConfig.popupTeksten`
  // (campagnes.ts: `popupContent`). Bewust helemaal onderaan deze keten
  // toegevoegd (laagste prioriteit) i.p.v. tussen de bestaande pop-ups: dat
  // voorkomt dat elk van de vele negatie-lijsten hierboven aangepast moet
  // worden. Onschadelijk, want de onderliggende events
  // (`wampanoagLaagOntdektEvent`/`wampanoagRelatieGelegdEvent`) blijven `true`
  // staan tot de speler ze wegklikt — bij toevallige samenloop verschijnt de
  // pop-up hooguit een beurt later, nooit helemaal niet.
  const toonEersteContactPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonRoofdierIntroPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    !toonRoofdierPopup &&
    !toonGoudOntdektPopup &&
    !toonTweedeGoudOntdektPopup &&
    !toonTechKeuzePopup &&
    !toonVijandelijkHeiligdomOnthuldPopup &&
    !toonVijandelijkHeiligdomVeroverdPopup &&
    !toonWachttorenOveralUitlegPopup &&
    !toonVoedselBalansUitlegPopup &&
    !toonSettlerActiesUitlegPopup &&
    !toonBeurtensysteemUitlegPopup &&
    !toonStadsverbeteringenUitlegPopup &&
    !toonTweedeSettlerUitlegPopup &&
    !toonHeiligdomUitlegPopup &&
    !toonNietBouwenUitlegPopup &&
    !toonBoerderijStreekUitlegPopup &&
    !toonHoutkapStreekUitlegPopup &&
    !toonSettlerWegSnelheidUitlegPopup &&
    !toonTutorialVoltooidPopup &&
    !toonStichtingsMomentPopup &&
    !toonBoonPopup &&
    Boolean(state.wampanoagLaagOntdektEvent);
  const toonWampanoagRelatieGelegdPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonRoofdierIntroPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    !toonRoofdierPopup &&
    !toonGoudOntdektPopup &&
    !toonTweedeGoudOntdektPopup &&
    !toonTechKeuzePopup &&
    !toonVijandelijkHeiligdomOnthuldPopup &&
    !toonVijandelijkHeiligdomVeroverdPopup &&
    !toonWachttorenOveralUitlegPopup &&
    !toonVoedselBalansUitlegPopup &&
    !toonSettlerActiesUitlegPopup &&
    !toonBeurtensysteemUitlegPopup &&
    !toonStadsverbeteringenUitlegPopup &&
    !toonTweedeSettlerUitlegPopup &&
    !toonHeiligdomUitlegPopup &&
    !toonNietBouwenUitlegPopup &&
    !toonBoerderijStreekUitlegPopup &&
    !toonHoutkapStreekUitlegPopup &&
    !toonSettlerWegSnelheidUitlegPopup &&
    !toonTutorialVoltooidPopup &&
    !toonStichtingsMomentPopup &&
    !toonBoonPopup &&
    !toonEersteContactPopup &&
    Boolean(state.wampanoagRelatieGelegdEvent);

  // Smederij-narratieve pop-up (issue "Wampanoag streek pas helemaal onthuld
  // na handel"): zelfde onderaan-de-keten-conventie als de twee Wampanoag-
  // pop-ups hierboven — laagste prioriteit, negeert dus ook die twee.
  const toonSmederijGebouwdPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonRoofdierIntroPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    !toonRoofdierPopup &&
    !toonGoudOntdektPopup &&
    !toonTweedeGoudOntdektPopup &&
    !toonTechKeuzePopup &&
    !toonVijandelijkHeiligdomOnthuldPopup &&
    !toonVijandelijkHeiligdomVeroverdPopup &&
    !toonWachttorenOveralUitlegPopup &&
    !toonVoedselBalansUitlegPopup &&
    !toonSettlerActiesUitlegPopup &&
    !toonBeurtensysteemUitlegPopup &&
    !toonStadsverbeteringenUitlegPopup &&
    !toonTweedeSettlerUitlegPopup &&
    !toonHeiligdomUitlegPopup &&
    !toonNietBouwenUitlegPopup &&
    !toonBoerderijStreekUitlegPopup &&
    !toonHoutkapStreekUitlegPopup &&
    !toonSettlerWegSnelheidUitlegPopup &&
    !toonTutorialVoltooidPopup &&
    !toonStichtingsMomentPopup &&
    !toonBoonPopup &&
    !toonEersteContactPopup &&
    !toonWampanoagRelatieGelegdPopup &&
    Boolean(state.smederijGebouwdEvent);

  // Onrust-uitleg-pop-up (issue: "Onrust indicator" — "zodra dat je de eerste
  // onrust krijgt ... een dynamische pop-up met uitleg"): getoond zodra een
  // willekeurige streek voor het eerst daadwerkelijk onrust > 0 draagt
  // (onrust.ts: `onrustOpStreek`) — niet zodra Saloon/Courthouse beschikbaar
  // komen (`ONRUST_MIN_STREEK`, improvements.ts): een drukke vroege streek
  // kan al onrust dragen ruim vóórdat die streek ontgrendelt. Onderaan de
  // keten net als `toonSmederijGebouwdPopup` hierboven (laagste prioriteit):
  // dit is Going-West-kerninhoud, geen `uitlegAan`-toggle-baar tutorial-hintje.
  const toonOnrustUitlegPopup =
    !toonStreekPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    !toonVijandAanDeHorizonPopup &&
    !toonGoddelijkeRaadgevingPopup &&
    !toonRoofdierIntroPopup &&
    !toonBoerderijKlaarUitlegPopup &&
    !toonStrijdersOpleidenPopup &&
    !toonBezetteStreekOntdektPopup &&
    !toonOceaanUitlegPopup &&
    !toonStadUpgradeUitlegPopup &&
    !toonIndringersPopup &&
    !toonKuddePopup &&
    !toonRoofdierPopup &&
    !toonGoudOntdektPopup &&
    !toonTweedeGoudOntdektPopup &&
    !toonTechKeuzePopup &&
    !toonVijandelijkHeiligdomOnthuldPopup &&
    !toonVijandelijkHeiligdomVeroverdPopup &&
    !toonWachttorenOveralUitlegPopup &&
    !toonVoedselBalansUitlegPopup &&
    !toonSettlerActiesUitlegPopup &&
    !toonBeurtensysteemUitlegPopup &&
    !toonStadsverbeteringenUitlegPopup &&
    !toonTweedeSettlerUitlegPopup &&
    !toonHeiligdomUitlegPopup &&
    !toonNietBouwenUitlegPopup &&
    !toonBoerderijStreekUitlegPopup &&
    !toonHoutkapStreekUitlegPopup &&
    !toonSettlerWegSnelheidUitlegPopup &&
    !toonTutorialVoltooidPopup &&
    !toonStichtingsMomentPopup &&
    !toonBoonPopup &&
    !toonEersteContactPopup &&
    !toonWampanoagRelatieGelegdPopup &&
    !toonSmederijGebouwdPopup &&
    state.campagneId === "going-west" &&
    !onrustUitlegBevestigd &&
    state.streken.some((streek) => onrustOpStreek(state.streken, state.stad.rechters, streek) > 0);

  // Intro- en ineenstortingsscherm zijn volledig blokkerende overlays (issue:
  // "intro en game over scherm") — alle hooks hierboven blijven onvoorwaardelijk
  // aangeroepen, alleen de uiteindelijke JSX wisselt.
  if (toonIntro)
    return <IntroScherm onBeginnen={bevestigIntro} statistieken={campagneStats} campagneId={state.campagneId} />;
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
        onVerlaten={onVerlaten}
        uitlegAan={uitlegAan}
        onToggleUitleg={() => zetUitlegPopups(!uitlegAan)}
        stijl={stijl}
        onToggleStijl={toggleStijl}
        onToonHistorie={() => setToonHistorie((open) => !open)}
        onToonTechboom={() => setToonTechboom((open) => !open)}
        onToonEconomie={() => setToonEconomie((open) => !open)}
        onToonEncyclopedie={() => setToonEncyclopedie((open) => !open)}
      />
      <div className="game-scroll-area" ref={scrollRef}>
        <GameCanvas
          streken={zichtbareStrekenState}
          alleStreken={state.streken}
          stad={state.stad}
          plaatsingsStreekHoogte={plaatsingsImprovement ? actieveStreek.hoogte : undefined}
          plaatsingsAlleStreken={Boolean(plaatsingsImprovement?.bouwbaarBuitenFrontier)}
          settler={state.settler}
          tweedeSettler={state.tweedeSettler}
          settlerBereikbarePosities={settlerBereikbarePosities}
          legerkampBereikbarePosities={legerkampBereikbarePosities}
          verkenningBereikbarePosities={verkenningBereikbarePosities}
          stijl={stijl}
          tegelSet={campagne?.tegelSet}
          campagneId={state.campagneId}
          onTileClick={handleTileClick}
        />
        <SettlerPaneel
          state={state}
          settlerSelectie={settlerSelectie}
          onKiesSettler={setSettlerSelectie}
          onLegWegAan={legWegAan}
          onJaag={jaag}
          onHakHout={hakHout}
          onOpenStichtStad={(slot) => {
            setStichtStadSlot(slot);
            setToonStichtStadPopup(true);
          }}
        />
        {/* Vangnet-knop (issue: "Button volgende beurt indien geen
            settlers"): de beurt gaat normaal automatisch door zodra er
            niets meer te doen valt (zie `beurtMagAutomatischDoorgaan`,
            economie.ts) — maar zonder settler toont `SettlerPaneel`
            hierboven niets meer, dus zonder deze knop kon de speler daar na
            een stad-stichting of een roofdier-aanval op vastlopen. Alleen
            zichtbaar wanneer er geen settler(s) meer zijn om te besturen én
            er verder niets openstaat (geen bouwkeuze). */}
        {!state.settler && !state.tweedeSettler && beurtMagAutomatischDoorgaan(state) && (
          <div
            className="fc-paneel"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem",
              padding: "0.75rem 1rem",
              fontSize: "0.9rem",
              margin: "0.5rem",
            }}
          >
            <span>Geen settler meer om te besturen deze beurt.</span>
            <button className="fc-knop" onClick={volgendeBeurt} style={{ padding: "0.3rem 0.6rem", alignSelf: "flex-start" }}>
              Volgende beurt
            </button>
          </div>
        )}
        <StreekIntroPaneel streken={state.streken} campagneId={state.campagneId} />
        <BezetteStreekPaneel state={state} />
        <WampanoagPaneel state={state} />
        {toonStadMenuPopup && (
          <StadMenuPopup
            state={state}
            legerwaarde={berekenLegerwaarde(state)}
            tegenstanderSterkte={actieveStreek.dreigingsniveau ?? 0}
            onStartGroei={startGroei}
            onStartNieuweSettler={startNieuweSettler}
            onStartTweedeSettler={startTweedeSettler}
            onStartOpslagplaats={startOpslagplaats}
            onStartSmederij={startSmederij}
            onVersnelSmederij={versnelSmederijMetGoud}
            onZetSmederijActief={zetSmederijActief}
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
            onStartMissionarisRecrutering={startMissionarisRecrutering}
            onStartRechterTraining={startRechterTraining}
            onSluiten={() => setToonStadMenuPopup(false)}
          />
        )}
        {toonStreekPopup && (
          <StreekPopup
            hoogte={actieveStreek.hoogte}
            campagneId={state.campagneId}
            onDoorgaan={() => bevestigStreekPopup(actieveStreek.hoogte)}
          />
        )}
        {toonBezetteStreekOntdektPopup && <BezetteStreekPopup onDoorgaan={sluitBezetteStreekOntdektMelding} />}
        {toonVijandelijkHeiligdomOnthuldPopup && (
          <VijandelijkHeiligdomPopup fase="onthuld" onSluiten={sluitVijandelijkHeiligdomOnthuldMelding} />
        )}
        {toonVijandelijkHeiligdomVeroverdPopup && (
          <VijandelijkHeiligdomPopup fase="veroverd" onSluiten={sluitVijandelijkHeiligdomVeroverdMelding} />
        )}
        {toonOceaanUitlegPopup && (
          <OceaanUitlegPopup onDoorgaan={() => markeerUitlegGezien("oceaan")} campagneId={state.campagneId} />
        )}
        {toonIndringersPopup && state.indringersEvent && (
          <IndringersPopup
            event={state.indringersEvent}
            onBevestigGoudOnderVuur={bevestigGoudOnderVuur}
            onGeefTribuut={geefTribuut}
            onSluiten={sluitIndringersMelding}
            wampumAfkoop={
              kanIndringersAfkopenMetWampum(state)
                ? {
                    kosten: wampumAfkoopKostenHuidig(state),
                    wampumVoorraad: state.wampum,
                    onKoopAf: koopIndringersAfMetWampum,
                  }
                : undefined
            }
            wampumAfkoopBevestigingTekst={popupContent(campagne, "wampumAfkoopPopup")?.tekst}
          />
        )}
        {toonKuddePopup && state.kuddeEvent && (
          <KuddePopup event={state.kuddeEvent} onSluiten={sluitKuddeMelding} />
        )}
        {toonRoofdierPopup && state.roofdierEvent && (
          <RoofdierPopup event={state.roofdierEvent} onSluiten={sluitRoofdierMelding} />
        )}
        {toonGoudOntdektPopup && (
          <GoudOntdektPopup afbeelding="/assets/scenes/goudader.png" onSluiten={sluitGoudOntdektMelding} />
        )}
        {toonTweedeGoudOntdektPopup && (
          <GoudOntdektPopup
            titel={GOUD_ONTDEKKING_TWEEDE_TITEL}
            tekst={GOUD_ONTDEKKING_TWEEDE_TEKST}
            afbeelding="/assets/scenes/goudader.png"
            onSluiten={sluitTweedeGoudOntdektMelding}
          />
        )}
        {toonTechKeuzePopup && state.techKeuzeEvent && (
          <TechKeuzePopup
            drempel={state.techKeuzeEvent.drempel}
            opties={state.techKeuzeEvent.opties}
            campagne={campagne}
            onKiesTech={kiesTech}
          />
        )}
        {toonCampagneOpeningPopup && (
          <GoudOntdektPopup
            titel={popupContent(campagne, "campagneOpeningPopup")?.titel}
            tekst={popupContent(campagne, "campagneOpeningPopup")?.tekst}
            onSluiten={() => markeerUitlegGezien("campagneOpening")}
          />
        )}
        {toonEersteContactPopup && (
          <GoudOntdektPopup
            titel={popupContent(campagne, "eersteContactPopup")?.titel}
            tekst={popupContent(campagne, "eersteContactPopup")?.tekst}
            afbeelding="/assets/scenes/wampanoag-trading.png"
            onSluiten={sluitWampanoagLaagOntdektMelding}
          />
        )}
        {toonWampanoagRelatieGelegdPopup && (
          <GoudOntdektPopup
            titel={popupContent(campagne, "wampanoagRelatieGelegdPopup")?.titel}
            tekst={popupContent(campagne, "wampanoagRelatieGelegdPopup")?.tekst}
            onSluiten={sluitWampanoagRelatieGelegdMelding}
          />
        )}
        {toonSmederijGebouwdPopup && (
          <GoudOntdektPopup
            titel={popupContent(campagne, "smederijGebouwdPopup")?.titel}
            tekst={popupContent(campagne, "smederijGebouwdPopup")?.tekst}
            onSluiten={sluitSmederijGebouwdMelding}
          />
        )}
        {toonOnrustUitlegPopup && (
          <GoudOntdektPopup
            titel={popupContent(campagne, "onrustUitlegPopup")?.titel}
            tekst={popupContent(campagne, "onrustUitlegPopup")?.tekst}
            afbeelding="/assets/scenes/onrust.png"
            onSluiten={() => markeerUitlegGezien("onrust")}
          />
        )}
        {toonUitlegPopup && <UitlegPopup onDoorgaan={() => markeerUitlegGezien("opening")} />}
        {toonSettlerUitlegPopup && <SettlerUitlegPopup onDoorgaan={() => markeerUitlegGezien("settler")} />}
        {toonVoedselWaarschuwingPopup && (
          <VoedselWaarschuwingPopup
            beurtenResterend={state.stad.vervalBeurtenResterend}
            onDoorgaan={() => setVoedselWaarschuwingBevestigd(true)}
          />
        )}
        {toonVijandAanDeHorizonPopup && (
          <VijandAanDeHorizonPopup onDoorgaan={() => markeerUitlegGezien("vijandAanDeHorizon")} />
        )}
        {toonGoddelijkeRaadgevingPopup && (
          <GoddelijkeRaadgevingPopup onDoorgaan={() => markeerUitlegGezien("goddelijkeRaadgeving")} />
        )}
        {toonRoofdierIntroPopup && <RoofdierIntroPopup onDoorgaan={() => markeerUitlegGezien("roofdierIntro")} />}
        {toonBoerderijKlaarUitlegPopup && (
          <BoerderijKlaarUitlegPopup onDoorgaan={() => markeerUitlegGezien("boerderijKlaar")} />
        )}
        {toonStrijdersOpleidenPopup && (
          <StrijdersOpleidenPopup onDoorgaan={() => markeerUitlegGezien("strijdersOpleiden")} />
        )}
        {toonStadUpgradeUitlegPopup && (
          <StadUpgradeUitlegPopup onDoorgaan={() => markeerUitlegGezien("stadUpgrade")} />
        )}
        {toonWachttorenOveralUitlegPopup && (
          <WachttorenOveralUitlegPopup onDoorgaan={() => markeerUitlegGezien("wachttorenOveral")} />
        )}
        {toonVoedselBalansUitlegPopup && (
          <VoedselBalansUitlegPopup onDoorgaan={() => markeerUitlegGezien("voedselBalans")} />
        )}
        {toonSettlerActiesUitlegPopup && (
          <SettlerActiesUitlegPopup onDoorgaan={() => markeerUitlegGezien("settlerActies")} />
        )}
        {toonBeurtensysteemUitlegPopup && (
          <BeurtensysteemUitlegPopup onDoorgaan={() => markeerUitlegGezien("beurtensysteem")} />
        )}
        {toonStadsverbeteringenUitlegPopup && (
          <StadsverbeteringenUitlegPopup onDoorgaan={() => markeerUitlegGezien("stadsverbeteringen")} />
        )}
        {toonTweedeSettlerUitlegPopup && (
          <BouwUitlegPopup
            titel={TWEEDE_SETTLER_UITLEG_TITEL}
            tekst={TWEEDE_SETTLER_UITLEG_TEKST}
            onDoorgaan={() => markeerUitlegGezien("tweedeSettler")}
          />
        )}
        {toonHeiligdomUitlegPopup && (
          <BouwUitlegPopup
            titel={HEILIGDOM_UITLEG_TITEL}
            tekst={HEILIGDOM_UITLEG_TEKST}
            onDoorgaan={() => markeerUitlegGezien("heiligdom")}
          />
        )}
        {toonNietBouwenUitlegPopup && (
          <BouwUitlegPopup
            titel={NIET_BOUWEN_UITLEG_TITEL}
            tekst={NIET_BOUWEN_UITLEG_TEKST}
            onDoorgaan={() => markeerUitlegGezien("nietBouwen")}
          />
        )}
        {toonBoerderijStreekUitlegPopup && (
          <BouwUitlegPopup
            titel={BOERDERIJ_STREEK_UITLEG_TITEL}
            tekst={BOERDERIJ_STREEK_UITLEG_TEKST}
            onDoorgaan={() => markeerUitlegGezien("boerderijStreek")}
          />
        )}
        {toonHoutkapStreekUitlegPopup && (
          <BouwUitlegPopup
            titel={HOUTKAP_STREEK_UITLEG_TITEL}
            tekst={HOUTKAP_STREEK_UITLEG_TEKST}
            onDoorgaan={() => markeerUitlegGezien("houtkapStreek")}
          />
        )}
        {toonSettlerWegSnelheidUitlegPopup && (
          <BouwUitlegPopup
            titel={SETTLER_WEG_SNELHEID_UITLEG_TITEL}
            tekst={SETTLER_WEG_SNELHEID_UITLEG_TEKST}
            onDoorgaan={() => markeerUitlegGezien("settlerWegSnelheid")}
          />
        )}
        {legerkampKiesModusStrijderId && (
          <WachttorenKiesBanner onAnnuleren={() => setLegerkampKiesModusStrijderId(null)} />
        )}
        {toonStichtStadPopup && (
          <StichtStadPopup
            onBevestig={() => {
              stichtStad(stichtStadSlot);
              setToonStichtStadPopup(false);
            }}
            onAnnuleren={() => setToonStichtStadPopup(false)}
          />
        )}
        {toonTutorialVoltooidPopup && (
          <TutorialVoltooidPopup
            onDoorgaan={() => {
              setCampagneStats(registreerCampagneUitgespeeld(state.campagneId));
              setTutorialVoltooidBevestigd(true);
              // Hoofdstuk 9/10/16: "daarna het campagnemenu" — GameRoot
              // unmount hierdoor (zie AppRoot), dus geen frontier-
              // verplaatsing binnen deze issue nodig (hoofdstuk 13: dat
              // blijft bewust post-MVP).
              onTutorialAfgerond();
            }}
          />
        )}
        {toonStichtingsMomentPopup && (
          <StichtingsMomentPopup
            stadNaam={state.stad.naam}
            onDoorgaan={() => bevestigStichtingsMomentPopup(state.steden.length)}
          />
        )}
        {toonBoonPopup && state.boonToegekendEvent && (
          <GoudOntdektPopup
            titel={boonMetId(state.boonToegekendEvent)?.naam}
            tekst={boonMetId(state.boonToegekendEvent)?.beschrijving}
            onSluiten={sluitBoonMelding}
          />
        )}
        <BouwPopup
          streek={actieveStreek}
          alleStreken={state.streken}
          technologieen={state.technologieen}
          cityImprovements={state.stad.cityImprovements}
          campagne={campagne}
          zichtbaar={
            !toonStreekPopup &&
            !toonUitlegPopup &&
            !toonSettlerUitlegPopup &&
            !toonVoedselWaarschuwingPopup &&
            !toonVijandAanDeHorizonPopup &&
            !toonGoddelijkeRaadgevingPopup &&
            !toonRoofdierIntroPopup &&
            !toonBoerderijKlaarUitlegPopup &&
            !toonStrijdersOpleidenPopup &&
            !toonBezetteStreekOntdektPopup &&
            !toonOceaanUitlegPopup &&
            !toonStadUpgradeUitlegPopup &&
            !toonIndringersPopup &&
            !toonKuddePopup &&
            !toonRoofdierPopup &&
            !toonGoudOntdektPopup &&
            !toonTweedeGoudOntdektPopup &&
            !toonTechKeuzePopup &&
            !toonVijandelijkHeiligdomOnthuldPopup &&
            !toonVijandelijkHeiligdomVeroverdPopup &&
            !toonWachttorenOveralUitlegPopup &&
            !toonVoedselBalansUitlegPopup &&
            !toonSettlerActiesUitlegPopup &&
            !toonBeurtensysteemUitlegPopup &&
            !toonStadsverbeteringenUitlegPopup &&
            !toonTweedeSettlerUitlegPopup &&
            !toonHeiligdomUitlegPopup &&
            !toonNietBouwenUitlegPopup &&
            !toonBoerderijStreekUitlegPopup &&
            !toonHoutkapStreekUitlegPopup &&
            !toonSettlerWegSnelheidUitlegPopup &&
            !toonTutorialVoltooidPopup &&
            !toonStichtingsMomentPopup &&
            !toonBoonPopup &&
            !legerkampKiesModusStrijderId &&
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
          bouwVraag={isGeldigPlaatsingsDoel ? { improvementNaam: improvementNaam(plaatsingsImprovement!, campagne) } : undefined}
          terreinWaarschuwing={
            terreinMismatch
              ? `${improvementNaam(plaatsingsImprovement!, campagne)} kan hier niet gebouwd worden — vereist ${terreinEisenBeschrijving(plaatsingsImprovement!)}.`
              : goudMismatch
                ? `${improvementNaam(plaatsingsImprovement!, campagne)} kan hier niet gebouwd worden — hier is geen goudader gevonden.`
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
                  technologieen: state.technologieen,
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
          courthouseVraag={
            geselecteerdeTileIsCourthouse && geselecteerdeTile
              ? {
                  bemand: Boolean(courthouseBemanner),
                  alleRechters: state.stad.rechters,
                  keuzeActief: toonCourthouseBemanningsKeuze,
                  onStartKeuze: () => setToonCourthouseBemanningsKeuze(true),
                  onKiesRechter: (rechterId) => {
                    bemanCourthouse(rechterId, geselecteerdeTile.hoogte, geselecteerdeTile.positieInStreek);
                    setToonCourthouseBemanningsKeuze(false);
                    setGeselecteerdeTile(null);
                  },
                  onStuurNaarHuis: () => {
                    if (courthouseBemanner) haalRechterTerug(courthouseBemanner.id);
                    setGeselecteerdeTile(null);
                  },
                }
              : undefined
          }
          verkenningVraag={
            geselecteerdeTileIsVerhuld && geselecteerdeTile
              ? {
                  kan: kanStuurVerkenner(state, geselecteerdeTile.positieInStreek),
                  onderweg: geselecteerdeTileVoorRush?.verkenningInGang,
                  onStuurVerkenner: () => stuurVerkenner(geselecteerdeTile.positieInStreek),
                }
              : geselecteerdeTileIsWampanoagVerhuld && geselecteerdeTile
                ? {
                    kan: kanStuurVerkennerWampanoag(state, geselecteerdeTile.positieInStreek),
                    onderweg: geselecteerdeTileVoorRush?.wampanoagVerkenningInGang,
                    onStuurVerkenner: () => stuurVerkennerWampanoag(geselecteerdeTile.positieInStreek),
                  }
                : undefined
          }
          wampanoagHandelVraag={
            geselecteerdeTileIsWampanoagOnthuld &&
            geselecteerdeTile &&
            geselecteerdeTileVoorRush?.wampanoagInhoud &&
            // "tentje" (issue "Wampanoag kamp uitbreiding") is puur decoratief
            // en handelt niet — `wampanoagHandelOpties` geeft dan een lege
            // lijst terug, dus de handels-UI hoort hier niet te verschijnen.
            wampanoagHandelOpties(geselecteerdeTileVoorRush.wampanoagInhoud).length > 0
              ? {
                  opties: wampanoagHandelOpties(geselecteerdeTileVoorRush.wampanoagInhoud),
                  huidigeKeuze: geselecteerdeTileVoorRush.wampanoagHandelKeuze,
                  onKiesResource: (keuze) => stelWampanoagHandel(geselecteerdeTile.positieInStreek, keuze),
                  onPauzeer: () => stelWampanoagHandel(geselecteerdeTile.positieInStreek, undefined),
                }
              : undefined
          }
          confrontatieVraag={
            geselecteerdeTileIsVijandelijkeWachttoren && geselecteerdeTile
              ? {
                  kan: kanConfrontatieBezetteStreek(state, geselecteerdeTile.positieInStreek),
                  geblokkeerdTotVolgendeBeurt: Boolean(state.confrontatieGeblokkeerdTotVolgendeBeurt),
                  winkans: winkansConfrontatieBezetteStreek(state),
                  keuzeActief: toonConfrontatieBevestiging,
                  onStartKeuze: () => setToonConfrontatieBevestiging(true),
                  onBevestig: () => {
                    confrontatieBezetteStreek(geselecteerdeTile.positieInStreek);
                    setToonConfrontatieBevestiging(false);
                  },
                  onAnnuleer: () => setToonConfrontatieBevestiging(false),
                }
              : undefined
          }
          missionarisVraag={
            geselecteerdeTileIsVijandelijkHeiligdom && geselecteerdeTile
              ? {
                  wololoVoortgang: geselecteerdeTileVoorRush?.wololoVoortgang ?? 0,
                  wololoDrempel: BELEGERINGSDREMPEL,
                  beschikbareMissionarissen: beschikbareMissionarissen(state),
                  onStuurMissionaris: (missionarisId) => {
                    stuurMissionaris(missionarisId, geselecteerdeTile.positieInStreek);
                  },
                }
              : undefined
          }
          onBevestigBouw={bevestigBouw}
          onAnnuleerBouw={() => {
            setGeselecteerdeTile(null);
            setToonWachttorenBemanningsKeuze(false);
            setToonConfrontatieBevestiging(false);
          }}
          onSluiten={() => {
            setGeselecteerdeTile(null);
            setToonWachttorenBemanningsKeuze(false);
            setToonConfrontatieBevestiging(false);
          }}
        />
        {toonHistorie && (
          <HistoriePaneel
            streken={state.streken}
            statistieken={berekenHistorieStatistieken(state)}
            onSluiten={() => setToonHistorie(false)}
          />
        )}
        {toonTechboom && (
          <TechboomPaneel
            technologieen={state.technologieen}
            techKeuzeEvent={state.techKeuzeEvent}
            campagne={campagne}
            onSluiten={() => setToonTechboom(false)}
          />
        )}
        {toonEconomie && <EconomieOverzichtPaneel state={state} onSluiten={() => setToonEconomie(false)} />}
        {toonEncyclopedie && <EncyclopediePaneel onSluiten={() => setToonEncyclopedie(false)} />}
      </div>
      <ResourceHud state={state} />
    </div>
  );
}
