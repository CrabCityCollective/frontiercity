"use client";

import { MouseEvent, useEffect, useRef } from "react";
import { City, Layer } from "@/game/types";
import { BAND_WIDTH_TILES } from "@/game/world";
import { tekenWereld } from "./canvas";

const TILE_SIZE = 64;

interface GameCanvasProps {
  // Alleen de tegenwoordig relevante lagen (zie world.ts: `zichtbareLagen`) —
  // niet per se alle 12 tutorial-lagen. Bepaalt zowel de canvas-hoogte als de
  // klik-geometrie hieronder, dus renderen en klikken blijven altijd in sync.
  lagen: Layer[];
  stad: City;
  // Hoogte van de laag waarop een gekozen improvement geplaatst mag worden
  // (klik-op-tile-plaatsing) — zolang dit gezet is markeert de canvas de
  // lege tiles op die laag en stuurt elke klik naar `onTileClick`.
  plaatsingsLaagHoogte?: number;
  onTileClick: (hoogte: number, positieInLaag: number) => void;
}

// Zet een klik-event op de canvas om naar de (laag-hoogte, positie-in-laag)
// van de aangeklikte tile, met dezelfde tile-geometrie als `tekenWereld`. Houdt
// rekening met een eventueel afwijkende CSS-grootte van het canvas-element.
// Hoogte 0 is de oceaan-rij onder laag 1 (hoofdstuk 2) — geen echte `Layer`,
// maar wel een geldig, klikbaar doel (zie GameRoot: oceaan-tile-info).
function bepaalAangeklikteTile(
  canvas: HTMLCanvasElement,
  event: MouseEvent<HTMLCanvasElement>,
  aantalLagen: number
): { hoogte: number; positieInLaag: number } | null {
  const rect = canvas.getBoundingClientRect();
  const schaalX = canvas.width / rect.width;
  const schaalY = canvas.height / rect.height;
  const tileSize = canvas.width / BAND_WIDTH_TILES;

  const x = (event.clientX - rect.left) * schaalX;
  const y = (event.clientY - rect.top) * schaalY;
  const positieInLaag = Math.floor(x / tileSize);
  const rijIndex = Math.floor(y / tileSize);
  const hoogte = aantalLagen - rijIndex;

  if (positieInLaag < 0 || positieInLaag >= BAND_WIDTH_TILES || hoogte < 0 || hoogte > aantalLagen) {
    return null;
  }

  return { hoogte, positieInLaag };
}

export default function GameCanvas({ lagen, stad, plaatsingsLaagHoogte, onTileClick }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    tekenWereld(ctx, canvas.width, canvas.height, lagen, stad, plaatsingsLaagHoogte);
  }, [lagen, stad, plaatsingsLaagHoogte]);

  function handleClick(event: MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tile = bepaalAangeklikteTile(canvas, event, lagen.length);
    if (tile) onTileClick(tile.hoogte, tile.positieInLaag);
  }

  return (
    <canvas
      ref={canvasRef}
      width={TILE_SIZE * BAND_WIDTH_TILES}
      // +1 rij voor de klikbare oceaan onder laag 1 (hoofdstuk 2). Hoogte
      // volgt het aantal daadwerkelijk meegegeven (zichtbare) lagen, niet het
      // vaste tutorial-totaal (issue: "onontdekte tegels weg" hierboven).
      height={TILE_SIZE * (lagen.length + 1)}
      onClick={handleClick}
      // width/height hierboven blijven de canvas-resolutie (en dus de
      // klik-geometrie in `bepaalAangeklikteTile`, die zelf al corrigeert
      // voor een afwijkende CSS-grootte). De CSS-grootte hieronder schaalt de
      // band mee naar smalle (mobiele) viewports i.p.v. buiten beeld te
      // schuiven — `maxWidth` voorkomt alleen dat 'm op brede schermen
      // wazig wordt opgerekt.
      style={{
        display: "block",
        background: "#1a1410",
        cursor: "pointer",
        width: "100%",
        height: "auto",
        maxWidth: `${TILE_SIZE * BAND_WIDTH_TILES}px`,
        margin: "0 auto",
      }}
    />
  );
}
