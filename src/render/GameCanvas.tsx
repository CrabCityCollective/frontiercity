"use client";

import { useEffect, useRef } from "react";
import { BAND_WIDTH_TILES, drawPlaceholderScene } from "./canvas";

const TILE_SIZE = 64;
const VISIBLE_LAYERS = 6;

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawPlaceholderScene(ctx, canvas.width, canvas.height);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={TILE_SIZE * BAND_WIDTH_TILES}
      height={TILE_SIZE * VISIBLE_LAYERS}
      style={{ display: "block", background: "#1a1410" }}
    />
  );
}
