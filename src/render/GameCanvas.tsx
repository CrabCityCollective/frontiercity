"use client";

import { useEffect, useRef } from "react";
import { Layer } from "@/game/types";
import { BAND_WIDTH_TILES, TUTORIAL_LAAG_AANTAL } from "@/game/world";
import { tekenWereld } from "./canvas";

const TILE_SIZE = 64;

interface GameCanvasProps {
  lagen: Layer[];
}

export default function GameCanvas({ lagen }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    tekenWereld(ctx, canvas.width, canvas.height, lagen);
  }, [lagen]);

  return (
    <canvas
      ref={canvasRef}
      width={TILE_SIZE * BAND_WIDTH_TILES}
      height={TILE_SIZE * TUTORIAL_LAAG_AANTAL}
      style={{ display: "block", background: "#1a1410" }}
    />
  );
}
