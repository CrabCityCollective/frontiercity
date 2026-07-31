"use client";

import BouwPopup from "@/components/BouwPopup";
import GroeiPaneel from "@/components/GroeiPaneel";
import LaagIntroPaneel from "@/components/LaagIntroPaneel";
import MilitairPaneel from "@/components/MilitairPaneel";
import ResourceHud from "@/components/ResourceHud";
import { berekenLegerwaarde } from "@/game/economie";
import { useGameEngine } from "@/game/useGameEngine";
import { hoogsteOntgrendeldeLaag } from "@/game/world";
import GameCanvas from "./GameCanvas";

// Verbindt de spelstatus (M3: resource-economie) met de HUD, de
// tutorial-flavor (M8), de bouw-pop-up, het groei/verval-paneel (M6), het
// militair-paneel (M7) en de canvas-rendering.
//
// Layout: een schermvullende kolom (`.game-viewport`) met een intern
// scrollend gebied (`.game-scroll-area`, canvas + info-panelen) en de
// grondstoffenbalk als vaste footer eronder — die scrolt dus nooit mee weg en
// de stad staat meteen in beeld zonder te scrollen (issue: sticky
// grondstoffenbalk onderaan, stad direct zichtbaar).
export default function GameRoot() {
  const { state, volgendeBeurt, startBouw, sluitBouwKeuze, startGroei, startRecrutering, confrontatie } =
    useGameEngine();
  // Bouwen gebeurt op de huidige frontier-laag: de hoogste ontgrendelde laag
  // (M5: welke laag dat is, verandert zodra cultuur een nieuwe laag ontgrendelt).
  const actieveLaag = state.lagen.find(
    (laag) => laag.hoogte === hoogsteOntgrendeldeLaag(state.lagen)
  )!;

  return (
    <div className="game-viewport">
      <div className="game-scroll-area">
        <GameCanvas lagen={state.lagen} stad={state.stad} />
        <LaagIntroPaneel lagen={state.lagen} />
        <GroeiPaneel state={state} onStartGroei={startGroei} />
        <MilitairPaneel
          state={state}
          legerwaarde={berekenLegerwaarde(state)}
          tegenstanderSterkte={actieveLaag.dreigingsniveau ?? 0}
          onStartRecrutering={startRecrutering}
          onConfrontatie={confrontatie}
        />
        <BouwPopup
          laag={actieveLaag}
          zichtbaar={!state.bouwKeuzeGedaanDitBeurt}
          onBouwStarten={(improvement) => startBouw(actieveLaag.hoogte, improvement)}
          onSluiten={sluitBouwKeuze}
        />
      </div>
      <ResourceHud state={state} onVolgendeBeurt={volgendeBeurt} />
    </div>
  );
}
