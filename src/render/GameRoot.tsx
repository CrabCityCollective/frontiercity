"use client";

import CategoriePicker from "@/components/CategoriePicker";
import GroeiPaneel from "@/components/GroeiPaneel";
import LaagIntroPaneel from "@/components/LaagIntroPaneel";
import MilitairPaneel from "@/components/MilitairPaneel";
import ResourceHud from "@/components/ResourceHud";
import { berekenLegerwaarde } from "@/game/economie";
import { useGameEngine } from "@/game/useGameEngine";
import { hoogsteOntgrendeldeLaag } from "@/game/world";
import GameCanvas from "./GameCanvas";

// Verbindt de spelstatus (M3: resource-economie) met de HUD, de
// tutorial-flavor (M8), de categorie-keuze-UI, het groei/verval-paneel (M6),
// het militair-paneel (M7) en de canvas-rendering.
export default function GameRoot() {
  const { state, volgendeBeurt, startBouw, startGroei, startRecrutering, confrontatie } =
    useGameEngine();
  // Bouwen gebeurt op de huidige frontier-laag: de hoogste ontgrendelde laag
  // (M5: welke laag dat is, verandert zodra cultuur een nieuwe laag ontgrendelt).
  const actieveLaag = state.lagen.find(
    (laag) => laag.hoogte === hoogsteOntgrendeldeLaag(state.lagen)
  )!;

  return (
    <div>
      <ResourceHud state={state} onVolgendeBeurt={volgendeBeurt} />
      <LaagIntroPaneel lagen={state.lagen} />
      <GroeiPaneel state={state} onStartGroei={startGroei} />
      <MilitairPaneel
        state={state}
        legerwaarde={berekenLegerwaarde(state)}
        tegenstanderSterkte={actieveLaag.dreigingsniveau ?? 0}
        onStartRecrutering={startRecrutering}
        onConfrontatie={confrontatie}
      />
      <CategoriePicker
        laag={actieveLaag}
        onBouwStarten={(improvement) => startBouw(actieveLaag.hoogte, improvement)}
      />
      <GameCanvas lagen={state.lagen} stad={state.stad} />
    </div>
  );
}
