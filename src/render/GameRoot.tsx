"use client";

import { useEffect, useState } from "react";
import BouwPopup from "@/components/BouwPopup";
import GroeiPaneel from "@/components/GroeiPaneel";
import IneenstortingScherm from "@/components/IneenstortingScherm";
import IntroScherm from "@/components/IntroScherm";
import LaagIntroPaneel from "@/components/LaagIntroPaneel";
import MilitairPaneel from "@/components/MilitairPaneel";
import ResourceHud from "@/components/ResourceHud";
import TileInfoPopup from "@/components/TileInfoPopup";
import { berekenLegerwaarde } from "@/game/economie";
import { heeftIntroGezien, markeerIntroGezien } from "@/game/save";
import { beschrijfOceaanTile, beschrijfTile } from "@/game/tileInfo";
import { Improvement } from "@/game/types";
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
  const {
    state,
    volgendeBeurt,
    startBouw,
    sluitBouwKeuze,
    startGroei,
    startRecrutering,
    confrontatie,
    bevestigIneenstorting,
  } = useGameEngine();

  // Introscherm (issue: "intro en game over scherm"): start op `true` zodat
  // server- en eerste client-render gelijk blijven (geen hydration mismatch,
  // zelfde reden als de save/load-aanpak in useGameEngine), en wordt pas ná
  // mount verlaagd als deze browser de intro al eerder bevestigd heeft.
  const [toonIntro, setToonIntro] = useState(true);

  useEffect(() => {
    if (heeftIntroGezien()) setToonIntro(false);
  }, []);

  function bevestigIntro() {
    markeerIntroGezien();
    setToonIntro(false);
  }
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

  // Intro- en ineenstortingsscherm zijn volledig blokkerende overlays (issue:
  // "intro en game over scherm") — alle hooks hierboven blijven onvoorwaardelijk
  // aangeroepen, alleen de uiteindelijke JSX wisselt.
  if (toonIntro) return <IntroScherm onBeginnen={bevestigIntro} />;
  if (state.laatsteIneenstorting) {
    return <IneenstortingScherm onDoorgaan={bevestigIneenstorting} />;
  }

  return (
    <div className="game-viewport">
      <div className="game-scroll-area">
        <GameCanvas
          lagen={state.lagen}
          stad={state.stad}
          plaatsingsLaagHoogte={plaatsingsImprovement ? actieveLaag.hoogte : undefined}
          onTileClick={(hoogte, positieInLaag) => setGeselecteerdeTile({ hoogte, positieInLaag })}
        />
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
          zichtbaar={!state.bouwKeuzeGedaanDitBeurt && !plaatsingsImprovement}
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
      </div>
      <ResourceHud state={state} onVolgendeBeurt={volgendeBeurt} />
    </div>
  );
}
