"use client";

import { useEffect, useRef, useState } from "react";
import BouwPopup from "@/components/BouwPopup";
import GroeiPaneel from "@/components/GroeiPaneel";
import HistoriePaneel from "@/components/HistoriePaneel";
import HoofdMenu from "@/components/HoofdMenu";
import IneenstortingScherm from "@/components/IneenstortingScherm";
import IntroScherm from "@/components/IntroScherm";
import LaagIntroPaneel from "@/components/LaagIntroPaneel";
import LaagPopup from "@/components/LaagPopup";
import MilitairPaneel from "@/components/MilitairPaneel";
import MilitairUitlegPopup from "@/components/MilitairUitlegPopup";
import ResourceHud from "@/components/ResourceHud";
import SettlerPaneel from "@/components/SettlerPaneel";
import SettlerUitlegPopup from "@/components/SettlerUitlegPopup";
import SpelActiesMenu from "@/components/SpelActiesMenu";
import TileInfoPopup from "@/components/TileInfoPopup";
import TutorialVoltooidPopup from "@/components/TutorialVoltooidPopup";
import UitlegPopup from "@/components/UitlegPopup";
import VoedselWaarschuwingPopup from "@/components/VoedselWaarschuwingPopup";
import { berekenHistorieStatistieken, berekenLegerwaarde } from "@/game/economie";
import { improvementPastOpTerrein, terreinEisenBeschrijving } from "@/game/improvements";
import { heeftOpgeslagenSpel, markeerTutorialVoltooid } from "@/game/save";
import { beschrijfOceaanTile, beschrijfTile } from "@/game/tileInfo";
import { Improvement } from "@/game/types";
import { LAATSTE_UITLEG_BEURT } from "@/game/uitlegContent";
import { useGameEngine } from "@/game/useGameEngine";
import { TUTORIAL_LAAG_AANTAL, hoogsteOntgrendeldeLaag, zichtbareLagen } from "@/game/world";
import GameCanvas from "./GameCanvas";

interface GameRootProps {
  // Terug naar het startscherm (issue: "spel verlaten, waarmee je weer naar
  // het start scherm gaat") — navigatie zelf blijft bij AppRoot, GameRoot
  // roept dit alleen aan.
  onVerlaten: () => void;
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
export default function GameRoot({ onVerlaten }: GameRootProps) {
  const {
    state,
    volgendeBeurt,
    startBouw,
    sluitBouwKeuze,
    startGroei,
    startRecrutering,
    confrontatie,
    verplaatsSettler,
    legWegAan,
    opslaan,
    laden,
  } = useGameEngine();

  // Militair-paneel hoeft niet constant in beeld (issue: "spel-icoontje ...
  // militaire onderdeel openen, dit hoeft niet constant in beeld") — uit
  // totdat de speler het bewust opent via SpelActiesMenu. Historiescherm is
  // een losse volledig-schermige pop-up, geen aan/uit-paneel.
  const [toonMilitair, setToonMilitair] = useState(false);
  const [toonHistorie, setToonHistorie] = useState(false);

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

  // Uitleg-pop-up (issue: "meer uitleg"): los van de laag-popup hierboven,
  // toont dit de basisbegrippen-uitleg (grondstoffen/improvements) in de
  // eerste paar beurten. `laatstBevestigdeUitlegBeurt` volgt hetzelfde patroon
  // als `laatstBevestigdeLaag`: zodra de speler doorklikt, staat de huidige
  // beurt vast als bevestigd zodat dezelfde pop-up niet nogmaals verschijnt.
  const [laatstBevestigdeUitlegBeurt, setLaatstBevestigdeUitlegBeurt] = useState(0);

  // Militaire-uitleg-pop-up en tutorial-voltooid-pop-up (issue: "pop-up met
  // uitleg over de militaire confrontatie" + "pop-up met summary na het
  // halen ervan"): allebei eenmalige confirm-vlaggen per sessie, zelfde
  // patroon als `laatstBevestigdeLaag` hierboven.
  const [militairUitlegBevestigd, setMilitairUitlegBevestigd] = useState(false);
  const [tutorialVoltooidBevestigd, setTutorialVoltooidBevestigd] = useState(false);
  // Settler-uitleg-pop-up (M10, hoofdstuk 16): zelfde eenmalige-confirm-vlag
  // als de twee hierboven, getoond zodra de settler in beurt 2 verschijnt.
  const [settlerUitlegBevestigd, setSettlerUitlegBevestigd] = useState(false);
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
        ? beschrijfTile(geselecteerdeLaag, state.lagen, state.stad, geselecteerdeTile.positieInLaag)
        : null;

  // De tile die de speler heeft aangeklikt terwijl er een improvement klaar
  // staat om geplaatst te worden — alleen gezet als die klik ook op de
  // actieve (bouwbare) laag viel.
  const doelTileVoorPlaatsing =
    plaatsingsImprovement && geselecteerdeTile && geselecteerdeTile.hoogte === actieveLaag.hoogte
      ? actieveLaag.tiles[geselecteerdeTile.positieInLaag]
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

  function bevestigBouw() {
    if (!plaatsingsImprovement || !geselecteerdeTile) return;
    startBouw(geselecteerdeTile.hoogte, plaatsingsImprovement, geselecteerdeTile.positieInLaag);
    setPlaatsingsImprovement(null);
    setGeselecteerdeTile(null);
  }

  const toonLaagPopup = actieveLaag.hoogte > laatstBevestigdeLaag;
  const toonUitlegPopup =
    !toonLaagPopup && state.beurt > laatstBevestigdeUitlegBeurt && state.beurt <= LAATSTE_UITLEG_BEURT;
  // Settler-uitleg direct nadat de settler in beurt 2 verschijnt (hoofdstuk
  // 16) — gekoppeld aan `state.settler` zelf i.p.v. een los beurtnummer, dus
  // hij verschijnt op precies hetzelfde moment als de settler zelf.
  const toonSettlerUitlegPopup = !toonLaagPopup && !toonUitlegPopup && Boolean(state.settler) && !settlerUitlegBevestigd;
  // Militaire-uitleg direct na de laag-pop-up van laag 12 (issue: "als je op
  // het laatst in de tutorial bij de militaire confrontatie bent, uitleg
  // over hoe je het moet aanpakken").
  const toonMilitairUitlegPopup =
    !toonLaagPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    actieveLaag.hoogte === TUTORIAL_LAAG_AANTAL &&
    !militairUitlegBevestigd;
  // Voedselwaarschuwing-pop-up (issue: "aparte pop-up ... zodra de dreiging
  // van te weinig voedsel 5 beurten ver weg is") — zie economie.ts
  // `verwerkVerval` voor de trigger zelf (voedsel dreigt binnen 5 beurten op
  // te raken).
  const toonVoedselWaarschuwingPopup =
    !toonLaagPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonMilitairUitlegPopup &&
    state.stad.vervalStatus === "kritiek" &&
    !voedselWaarschuwingBevestigd;
  // Tutorial-voltooid-samenvatting zodra de confrontatie op laag 12 gewonnen
  // is (issue: "pop-up met summary wat je geleerd hebt").
  const toonTutorialVoltooidPopup =
    !toonLaagPopup &&
    !toonUitlegPopup &&
    !toonSettlerUitlegPopup &&
    !toonMilitairUitlegPopup &&
    !toonVoedselWaarschuwingPopup &&
    actieveLaag.hoogte === TUTORIAL_LAAG_AANTAL &&
    state.laatsteConfrontatie?.gewonnen === true &&
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
      <HoofdMenu onOpslaan={opslaan} onLaden={laden} kanLaden={heeftOpgeslagenSpel()} onVerlaten={onVerlaten} />
      <SpelActiesMenu
        toonMilitair={toonMilitair}
        onToggleMilitair={() => setToonMilitair((huidig) => !huidig)}
        onToonHistorie={() => setToonHistorie(true)}
      />
      <div className="game-scroll-area" ref={scrollRef}>
        <GameCanvas
          lagen={zichtbareLagenState}
          stad={state.stad}
          plaatsingsLaagHoogte={plaatsingsImprovement ? actieveLaag.hoogte : undefined}
          settler={state.settler}
          onTileClick={(hoogte, positieInLaag) => setGeselecteerdeTile({ hoogte, positieInLaag })}
        />
        <LaagIntroPaneel lagen={state.lagen} />
        <SettlerPaneel state={state} onVerplaats={verplaatsSettler} onLegWegAan={legWegAan} />
        <GroeiPaneel state={state} onStartGroei={startGroei} />
        {toonMilitair && (
          <MilitairPaneel
            state={state}
            legerwaarde={berekenLegerwaarde(state)}
            tegenstanderSterkte={actieveLaag.dreigingsniveau ?? 0}
            onStartRecrutering={startRecrutering}
            onConfrontatie={confrontatie}
          />
        )}
        {toonLaagPopup && (
          <LaagPopup hoogte={actieveLaag.hoogte} onDoorgaan={() => setLaatstBevestigdeLaag(actieveLaag.hoogte)} />
        )}
        {toonMilitairUitlegPopup && <MilitairUitlegPopup onDoorgaan={() => setMilitairUitlegBevestigd(true)} />}
        {toonUitlegPopup && (
          <UitlegPopup beurt={state.beurt} onDoorgaan={() => setLaatstBevestigdeUitlegBeurt(state.beurt)} />
        )}
        {toonSettlerUitlegPopup && <SettlerUitlegPopup onDoorgaan={() => setSettlerUitlegBevestigd(true)} />}
        {toonVoedselWaarschuwingPopup && (
          <VoedselWaarschuwingPopup
            beurtenResterend={state.stad.vervalBeurtenResterend}
            onDoorgaan={() => setVoedselWaarschuwingBevestigd(true)}
          />
        )}
        {toonTutorialVoltooidPopup && (
          <TutorialVoltooidPopup
            onDoorgaan={() => {
              markeerTutorialVoltooid();
              setTutorialVoltooidBevestigd(true);
            }}
          />
        )}
        <BouwPopup
          laag={actieveLaag}
          zichtbaar={
            !toonLaagPopup &&
            !toonUitlegPopup &&
            !toonSettlerUitlegPopup &&
            !toonMilitairUitlegPopup &&
            !toonVoedselWaarschuwingPopup &&
            !toonTutorialVoltooidPopup &&
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
      <ResourceHud state={state} onVolgendeBeurt={volgendeBeurt} />
    </div>
  );
}
