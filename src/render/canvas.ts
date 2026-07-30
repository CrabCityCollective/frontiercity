export const BAND_WIDTH_TILES = 9;

// Verifieert dat de canvas-pijplijn werkt; de echte tegel-rendering komt in M1.
export function drawPlaceholderScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = "#1a1410";
  ctx.fillRect(0, 0, width, height);

  const tileSize = width / BAND_WIDTH_TILES;
  ctx.strokeStyle = "#5c4a32";
  ctx.lineWidth = 1;
  for (let col = 0; col <= BAND_WIDTH_TILES; col++) {
    ctx.beginPath();
    ctx.moveTo(col * tileSize, 0);
    ctx.lineTo(col * tileSize, height);
    ctx.stroke();
  }

  ctx.fillStyle = "#c9b896";
  ctx.font = "16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Frontier City — canvas basis (M0)", width / 2, height / 2);
}
