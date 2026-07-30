"use client";

import CategoriePicker from "@/components/CategoriePicker";
import ResourceHud from "@/components/ResourceHud";
import { useGameEngine } from "@/game/useGameEngine";
import GameCanvas from "./GameCanvas";

// Verbindt de spelstatus (M3: resource-economie) met de HUD, de
// categorie-keuze-UI en de canvas-rendering.
export default function GameRoot() {
  const { state, volgendeBeurt, startBouw } = useGameEngine();
  const actieveLaag = state.lagen[0];

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
