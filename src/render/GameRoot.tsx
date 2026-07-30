"use client";

import CategoriePicker from "@/components/CategoriePicker";
import ResourceHud from "@/components/ResourceHud";
import { useGameEngine } from "@/game/useGameEngine";
import { hoogsteOntgrendeldeLaag } from "@/game/world";
import GameCanvas from "./GameCanvas";

// Verbindt de spelstatus (M3: resource-economie) met de HUD, de
// categorie-keuze-UI en de canvas-rendering.
export default function GameRoot() {
  const { state, volgendeBeurt, startBouw } = useGameEngine();
  // Bouwen gebeurt op de huidige frontier-laag: de hoogste ontgrendelde laag
  // (M5: welke laag dat is, verandert zodra cultuur een nieuwe laag ontgrendelt).
  const actieveLaag = state.lagen.find(
    (laag) => laag.hoogte === hoogsteOntgrendeldeLaag(state.lagen)
  )!;

  return (
    <div>
      <ResourceHud state={state} onVolgendeBeurt={volgendeBeurt} />
      <CategoriePicker
        laag={actieveLaag}
        onBouwStarten={(improvement) => startBouw(actieveLaag.hoogte, improvement)}
      />
      <GameCanvas lagen={state.lagen} />
    </div>
  );
}
