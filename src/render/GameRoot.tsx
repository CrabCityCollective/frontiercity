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
import ResourceHud from "@/components/ResourceHud";
import SpelActiesMenu from "@/components/SpelActiesMenu";
import TileInfoPopup from "@/components/TileInfoPopup";
import { berekenHistorieStatistieken, berekenLegerwaarde } from "@/game/economie";
import { heeftOpgeslagenSpel } from "@/game/save";
import { beschrijfOceaanTile, beschrijfTile } from "@/game/tileInfo";
import { Improvement } from "@/game/types";
import { useGameEngine } from "@/game/useGameEngine";
import { hoogsteOntgrendeldeLaag, zichtbareLagen } from "@/game/world";
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
    bevestigIneenstorting,
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

  const isGeldigPlaatsingsDoel =
    plaatsingsImprovement !== null &&
    geselecteerdeTile !== null &&
    geselecteerdeTile.hoogte === actieveLaag.hoogte &&
    actieveLaag.tiles[geselecteerdeTile.positieInLaag]?.status === "leeg";

  function bevestigBouw() {
    if (!plaatsingsImprovement || !geselecteerdeTile) return;
    startBouw(geselecteerdeTile.hoogte, plaatsingsImprovement, geselecteerdeTile.positieInLaag);
    setPlaatsingsImprovement(null);
    setGeselecteerdeTile(null);
  }

  const toonLaagPopup = actieveLaag.hoogte > laatstBevestigdeLaag;

  // Intro- en ineenstortingsscherm zijn volledig blokkerende overlays (issue:
  // "intro en game over scherm") — alle hooks hierboven blijven onvoorwaardelijk
  // aangeroepen, alleen de uiteindelijke JSX wisselt.
  if (toonIntro) return <IntroScherm onBeginnen={bevestigIntro} />;
  if (state.laatsteIneenstorting) {
    return <IneenstortingScherm onDoorgaan={bevestigIneenstorting} statistieken={state.laatsteRunStatistieken} />;
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
          onTileClick={(hoogte, positieInLaag) => setGeselecteerdeTile({ hoogte, positieInLaag })}
        />
        <LaagIntroPaneel lagen={state.lagen} />
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
        <BouwPopup
          laag={actieveLaag}
          zichtbaar={!toonLaagPopup && !state.bouwKeuzeGedaanDitBeurt && !plaatsingsImprovement}
          onBouwStarten={(improvement) => setPlaatsingsImprovement(improvement)}
          onSluiten={sluitBouwKeuze}
        />
        <TileInfoPopup
          tileInfo={tileInfo}
          bouwVraag={isGeldigPlaatsingsDoel ? { improvementNaam: plaatsingsImprovement!.naam } : undefined}
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
