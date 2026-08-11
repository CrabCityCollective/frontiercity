import { ImageResponse } from "next/og";

// Warm/aards Riven-palet (zie CLAUDE.md): pixel-art huifkar op een
// donkerbruine leem-achtergrond voor "De Eerste Vuren".
const BG = "#3d2e26";
const CANVAS = "#e8d9c3";
const CANVAS_SHADE = "#d4c0a0";
const TRIM = "#4a2f1c";
const WOOD = "#8a5a34";
const WOOD_SHADE = "#6b4423";
const WHEEL_DARK = "#2a1c14";
const WHEEL_RIM = "#d67a2c";
const AXLE = "#1a120c";
const LANTERN = "#f2b545";

// 20x20 pixelraster: elke cel is een kleur (of null voor transparant),
// zodat het icoon op elk formaat blokkerig/pixel-art aandoet.
const GRID = 20;

function buildPixels(): (string | null)[][] {
  const pixels: (string | null)[][] = Array.from({ length: GRID }, () =>
    Array(GRID).fill(null)
  );

  // Huif (canvas kap): bovenste helft van een ellips, met verticale
  // banen voor de genaaide canvas-panelen.
  const domeCenterX = 9.5;
  const domeCenterY = 6;
  const domeRx = 7;
  const domeRy = 5.5;
  for (let r = 0; r <= 6; r++) {
    for (let c = 0; c < GRID; c++) {
      const dx = (c - domeCenterX) / domeRx;
      const dy = (r - domeCenterY) / domeRy;
      if (dx * dx + dy * dy <= 1) {
        const panel = Math.floor(c / 3) % 2 === 0;
        pixels[r][c] = panel ? CANVAS : CANVAS_SHADE;
      }
    }
  }

  // Houten rand waar de huif op de wagenbak rust.
  for (let c = 2; c <= 17; c++) {
    pixels[7][c] = TRIM;
  }

  // Wagenbak: plankentextuur.
  for (let r = 8; r <= 11; r++) {
    for (let c = 2; c <= 17; c++) {
      const plank = Math.floor(c / 2) % 2 === 0;
      pixels[r][c] = plank ? WOOD : WOOD_SHADE;
    }
  }

  // Lantaarn vooraan tegen de bak.
  pixels[8][3] = LANTERN;
  pixels[9][3] = TRIM;

  // Wielen met spaken en ijzeren velg.
  const wheelCenters: [number, number][] = [
    [5, 14],
    [14, 14],
  ];
  const radius = 3.5;
  for (const [cx, cy] of wheelCenters) {
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const dx = c - cx;
        const dy = r - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > radius) continue;
        if (dist >= radius - 1) {
          pixels[r][c] = WHEEL_RIM;
        } else if (dist <= 1) {
          pixels[r][c] = AXLE;
        } else {
          const angleDeg =
            ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 60;
          pixels[r][c] = angleDeg < 10 || angleDeg > 50 ? WHEEL_RIM : WHEEL_DARK;
        }
      }
    }
  }

  // As tussen de wielen, onder de wagenbak.
  pixels[12][9] = AXLE;
  pixels[12][10] = AXLE;
  pixels[13][9] = AXLE;
  pixels[13][10] = AXLE;

  // Dissel vooraan.
  pixels[11][1] = WOOD_SHADE;
  pixels[12][0] = WOOD_SHADE;

  return pixels;
}

export function renderIcon(size: number) {
  const pixels = buildPixels();
  const cell = size / GRID;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: BG,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          {pixels.map((row, r) => (
            <div key={r} style={{ display: "flex" }}>
              {row.map((color, c) => (
                <div
                  key={c}
                  style={{
                    width: cell,
                    height: cell,
                    background: color ?? "transparent",
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
