// Canvas-rendering van de tegel-band (M1: grid & laag-rendering).
// Losse placeholder-tegels per vakje, geen naadloos geschilderd tafereel —
// zie frontier-city-design-doc.md hoofdstuk 12 (visuele stijl).

import { Layer, Tile } from "@/game/types";
import { BAND_WIDTH_TILES, isVooruitkijkLaag } from "@/game/world";

export { BAND_WIDTH_TILES };

const TERREIN_KLEUREN: Record<string, string> = {
  oevervlakte: "#7a7148",
  rietmoeras: "#5f6b3f",
  bosrand: "#4c5c34",
  loofbos: "#3e4f2c",
  heuvelvoet: "#6b5c3c",
  heuvels: "#7a6644",
  rotsrichel: "#6b6155",
  "hooggebergte-voet": "#5e5a52",
  naaldwoud: "#354533",
  "kale hoogvlakte": "#726a5c",
  "besneeuwde flank": "#8a8f8c",
  bergkam: "#9aa0a0",
};

function terreinKleur(terreinType: string): string {
  return TERREIN_KLEUREN[terreinType] ?? "#6b5b3e";
}

// Simpele placeholder-kleur per land-improvement (M3) — losse tegel-assets
// volgen later, zie hoofdstuk 12.
const LAND_IMPROVEMENT_KLEUREN: Record<string, string> = {
  houtkap: "#3f6b2f",
  steengroeve: "#8a8577",
  mijn: "#7a5a3a",
  boerderij: "#c9a84a",
  heiligdom: "#9a4a8a",
};

function landImprovementKleur(id: string): string {
  return LAND_IMPROVEMENT_KLEUREN[id] ?? "#8a8a4a";
}

function tekenFogTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
): void {
  ctx.fillStyle = "#0c0a08";
  ctx.fillRect(x, y, size, size);

  ctx.strokeStyle = "#1c1712";
  ctx.lineWidth = 1;
  for (let i = -size; i < size * 2; i += 10) {
    ctx.beginPath();
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i + size, y + size);
    ctx.stroke();
  }
}

function tekenVooruitkijkTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  terreinType: string
): void {
  ctx.fillStyle = terreinKleur(terreinType);
  ctx.globalAlpha = 0.35;
  ctx.fillRect(x, y, size, size);
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#c9b896";
  ctx.globalAlpha = 0.6;
  ctx.font = `${Math.floor(size * 0.4)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("?", x + size / 2, y + size / 2);
  ctx.globalAlpha = 1;
}

function tekenActieveTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  tile: Tile,
  terreinType: string
): void {
  ctx.fillStyle = terreinKleur(terreinType);
  ctx.fillRect(x, y, size, size);

  if (tile.status === "ghost_town") {
    ctx.fillStyle = "#3a3530";
    ctx.globalAlpha = 0.75;
    ctx.fillRect(x, y, size, size);
    ctx.globalAlpha = 1;
    return;
  }

  if (tile.improvement?.soort === "city") {
    ctx.fillStyle = "#d8a94a";
    const padding = size * 0.18;
    ctx.fillRect(x + padding, y + padding, size - padding * 2, size - padding * 2);
    ctx.strokeStyle = "#8a5a1a";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + padding, y + padding, size - padding * 2, size - padding * 2);
    return;
  }

  if (tile.status === "actief" && tile.improvement?.soort === "land") {
    ctx.fillStyle = landImprovementKleur(tile.improvement.id);
    const padding = size * 0.22;
    ctx.fillRect(x + padding, y + padding, size - padding * 2, size - padding * 2);

    if (tile.beurtenTotUitputting !== undefined) {
      ctx.fillStyle = "#e8dcc8";
      ctx.font = `${Math.floor(size * 0.22)}px sans-serif`;
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText(String(tile.beurtenTotUitputting), x + size - 4, y + size - 4);
    }
    return;
  }

  if (tile.status === "in_aanbouw") {
    ctx.strokeStyle = "#c9b896";
    ctx.lineWidth = 1;
    for (let i = 0; i < size; i += 8) {
      ctx.beginPath();
      ctx.moveTo(x + i, y + size);
      ctx.lineTo(x + i + size, y);
      ctx.stroke();
    }
  }
}

function tekenTileGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
): void {
  ctx.strokeStyle = "#5c4a32";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, size, size);
}

// Tekent alle lagen (band van 9 vakjes breed), laag 1 onderaan het canvas,
// oplopend naar boven — zie hoofdstuk 2 ("omhoog bouwen").
export function tekenWereld(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  lagen: Layer[]
): void {
  const tileSize = width / BAND_WIDTH_TILES;
  const totaalLagen = lagen.length;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#100d0a";
  ctx.fillRect(0, 0, width, height);

  for (const laag of lagen) {
    const rijIndex = totaalLagen - laag.hoogte;
    const y = rijIndex * tileSize;
    const vooruitkijk = !laag.ontgrendeld && isVooruitkijkLaag(laag, lagen);

    for (let col = 0; col < BAND_WIDTH_TILES; col++) {
      const x = col * tileSize;

      if (!laag.ontgrendeld && !vooruitkijk) {
        tekenFogTile(ctx, x, y, tileSize);
      } else if (!laag.ontgrendeld && vooruitkijk) {
        tekenVooruitkijkTile(ctx, x, y, tileSize, laag.terreinType);
      } else {
        tekenActieveTile(ctx, x, y, tileSize, laag.tiles[col], laag.terreinType);
      }

      tekenTileGrid(ctx, x, y, tileSize);
    }
  }
}
