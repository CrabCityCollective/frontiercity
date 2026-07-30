"use client";

import { useEffect, useRef } from "react";
import { BAND_WIDTH_TILES, TUTORIAL_LAAG_AANTAL, maakInitieleWereld } from "@/game/world";
import { tekenWereld } from "./canvas";

const TILE_SIZE = 64;

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const wereld = maakInitieleWereld();
    tekenWereld(ctx, canvas.width, canvas.height, wereld);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={TILE_SIZE * BAND_WIDTH_TILES}
      height={TILE_SIZE * TUTORIAL_LAAG_AANTAL}
      style={{ display: "block", background: "#1a1410" }}
    />
  );
}
