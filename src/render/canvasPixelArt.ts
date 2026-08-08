// Pixel-art variant van canvas.ts (issue: "pixel art style placeholders i.p.v.
// vector style, oude bewaren om te kunnen wisselen"). Zelfde tile-geometrie en
// dezelfde `tekenWereldPixelArt`-signatuur als `tekenWereld` in canvas.ts (zie
// render/GameCanvas.tsx, dat op basis van een instelling kiest welke van de
// twee wordt aangeroepen) — maar elk vakje wordt eerst op een klein
// vast-resolutie canvas getekend met vlakke kleuren en rechte blokken (geen
// verlopen, geen curves, geen zachte schaduwen), en pas daarna zonder
// smoothing opgeschaald. Dat geeft het blokkerige, "retro" pixel-art silhouet
// in plaats van de geschilderde vector-stijl uit canvas.ts.
//
// De grid-lijnen en klik-markeringen (beschikbaar/settler-bereikbaar) zijn
// bewust hergebruikt uit canvas.ts in plaats van hier opnieuw getekend: dat
// is UI-chrome, geen los "asset" (vraag van het issue was specifiek de
// tegel/icoon-illustraties), en blijft zo pixel-voor-pixel identiek ongeacht
// welke stijl actief is.

import { isWachttorenBemand } from "@/game/indringersEnDieren";
import { isBebouwbaarLeeg } from "@/game/improvements";
import { City, Streek, Settler, Tile } from "@/game/types";
import { isTileVerbondenMetStad, wegVerbindingen, WegVerbindingen } from "@/game/wegen";
import {
  BAND_WIDTH_TILES,
  eindeOceaanZichtbaar,
  isVooruitkijkStreek,
} from "@/game/world";
import {
  OCEAAN_BASIS,
  maakSeededRandom,
  tekenBeschikbaarMarkering,
  tekenLegerkampBereikbaarMarkering,
  tekenSettlerBereikbaarMarkering,
  tekenTileGrid,
  tekenVerkenningBereikbaarMarkering,
  terreinBasisKleur,
} from "./canvas";

export { BAND_WIDTH_TILES };

// Vaste "pixel-grid"-resolutie waarop elke tile eerst getekend wordt. Bij de
// standaard TILE_SIZE van 64px (zie GameCanvas.tsx) geeft dit een nette 4x
// opschaling — elke "grote pixel" hieronder wordt dan precies 4x4 echte
// beeldschermpixels.
const PIX = 16;

function tileSeed(col: number, hoogte: number, extra = 0): number {
  return col * 9781 + hoogte * 6271 + extra * 131 + 1;
}

// --- Low-level pixel-tekenhulpen ----------------------------------------

function p(ctx: CanvasRenderingContext2D, x: number, y: number, kleur: string): void {
  ctx.fillStyle = kleur;
  ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
}

function hlijn(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, kleur: string): void {
  const a = Math.round(Math.min(x0, x1));
  const b = Math.round(Math.max(x0, x1));
  ctx.fillStyle = kleur;
  ctx.fillRect(a, Math.round(y), b - a + 1, 1);
}

function vlijn(ctx: CanvasRenderingContext2D, x: number, y0: number, y1: number, kleur: string): void {
  const a = Math.round(Math.min(y0, y1));
  const b = Math.round(Math.max(y0, y1));
  ctx.fillStyle = kleur;
  ctx.fillRect(Math.round(x), a, 1, b - a + 1);
}

// Eén horizontale rij van een gevulde vorm, gecentreerd op `cx` met een
// halve breedte — de bouwsteen waarmee driehoeken/ellipsen/rotsen hieronder
// rij voor rij worden opgebouwd (elke rij een geheel getal pixels breed,
// vandaar het blokkerige silhouet).
function blokrij(ctx: CanvasRenderingContext2D, cx: number, y: number, halfBreedte: number, kleur: string): void {
  if (halfBreedte < 0) return;
  hlijn(ctx, cx - halfBreedte, cx + halfBreedte, y, kleur);
}

// Zachte contactschaduw: één gedempte rij vlak onder een icoon, zodat het
// los van de ondergrond "staat" — het blokkerige equivalent van
// `tekenContactschaduw` in canvas.ts.
function schaduw(ctx: CanvasRenderingContext2D, cx: number, baseY: number, breedte: number): void {
  hlijn(ctx, cx - breedte / 2, cx + breedte / 2, baseY, "rgba(10, 8, 6, 0.4)");
}

// Cirkelvormig halfrond profiel (gebruikt voor wielen, het mijn-gat en het
// vergrootglas) — rij `i` van de `rijen` rijen krijgt de halve breedte van
// een cirkel met straal `r` op die hoogte.
function cirkelHalf(r: number, i: number, rijen: number): number {
  const t = rijen <= 1 ? 0 : (i / (rijen - 1)) * 2 - 1;
  return Math.round(r * Math.sqrt(Math.max(0, 1 - t * t)));
}

// --- Terrein-ondergrond ---------------------------------------------------

function tekenTerreinOndergrondPixel(
  ctx: CanvasRenderingContext2D,
  terreinType: string,
  seed: number
): void {
  const basis = terreinBasisKleur(terreinType);
  ctx.fillStyle = basis;
  ctx.fillRect(0, 0, PIX, PIX);

  const rng = maakSeededRandom(seed);
  for (let i = 0; i < 10; i++) {
    const gx = Math.floor(rng() * PIX);
    const gy = Math.floor(rng() * PIX);
    const donker = rng() > 0.5;
    p(ctx, gx, gy, donker ? "rgba(10, 8, 4, 0.22)" : "rgba(255, 245, 220, 0.16)");
  }
}

// --- Land-improvement iconografie ---------------------------------------

function tekenBoomPixel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  hoogte: number,
  breed: boolean
): void {
  const stamH = Math.max(1, Math.round(hoogte * 0.22));
  vlijn(ctx, cx, baseY - stamH, baseY, "#3a2a18");

  const kroonTop = baseY - hoogte;
  const kroonBaseY = baseY - stamH;
  const rijen = Math.max(1, kroonBaseY - kroonTop);
  const maxHalf = Math.max(1, Math.round(hoogte * (breed ? 0.34 : 0.26)));

  for (let i = 0; i <= rijen; i++) {
    const y = kroonTop + i;
    const t = i / rijen;
    const half = breed
      ? Math.max(1, Math.round(maxHalf * Math.sin(Math.PI * t)) + 1)
      : Math.max(1, Math.round(maxHalf * t));
    blokrij(ctx, cx, y, half, "#2f4a22");
  }
  p(ctx, cx - Math.round(maxHalf * 0.5), Math.round(kroonTop + rijen * 0.35), "#3d5c2c");
}

function tekenHoutkapPixel(ctx: CanvasRenderingContext2D, seed: number): void {
  const rng = maakSeededRandom(seed);
  const baseY = 14;
  schaduw(ctx, 8, baseY + 1, 10);

  // Gekapte stam.
  hlijn(ctx, 3, 5, baseY, "#caa876");
  p(ctx, 4, baseY - 1, "#4a3420");

  tekenBoomPixel(ctx, 11, baseY, rng() > 0.5 ? 9 : 7, rng() > 0.5);
  tekenBoomPixel(ctx, 7, baseY - 1, rng() > 0.5 ? 6 : 5, rng() > 0.5);
}

function tekenSteengroevePixel(ctx: CanvasRenderingContext2D, seed: number): void {
  const rng = maakSeededRandom(seed);
  const baseY = 14;
  schaduw(ctx, 8, baseY + 1, 11);

  const rijen = 8;
  for (let i = 0; i < rijen; i++) {
    const y = baseY - i;
    const half = Math.max(1, Math.round(2 + i * 0.6 + rng() * 1.2));
    blokrij(ctx, 8, y, half, "#8a8577");
  }
  ctx.strokeStyle = "#4a453a";
  ctx.lineWidth = 1;
  ctx.strokeRect(8 - 6, baseY - rijen, 12, rijen + 1);

  for (let i = 0; i < 3; i++) {
    p(ctx, 6 + Math.floor(rng() * 5), baseY - 2 - Math.floor(rng() * 5), "#e6ded0");
  }
}

function tekenMijnPixel(ctx: CanvasRenderingContext2D): void {
  const baseY = 14;
  schaduw(ctx, 8, baseY + 1, 10);

  vlijn(ctx, 4, 5, baseY, "#5c4a34");
  vlijn(ctx, 12, 5, baseY, "#5c4a34");
  hlijn(ctx, 3, 13, 4, "#5c4a34");

  const rijen = 6;
  for (let i = 0; i < rijen; i++) {
    const half = cirkelHalf(4, i, rijen);
    blokrij(ctx, 8, baseY - rijen + i + 1, half, i < 1 ? "#241c14" : "#0c0906");
  }
  p(ctx, 6, baseY - 2, "rgba(220, 190, 120, 0.7)");
  p(ctx, 9, baseY - 4, "rgba(220, 190, 120, 0.5)");
}

function tekenBoerderijPixel(ctx: CanvasRenderingContext2D, seed: number): void {
  const rng = maakSeededRandom(seed);
  const baseY = 14;
  schaduw(ctx, 8, baseY + 1, 12);

  for (let rij = 0; rij < 4; rij++) {
    hlijn(ctx, 2, 14, 6 + rij * 2, "#6b5222");
  }
  for (let i = 0; i < 8; i++) {
    p(ctx, 3 + Math.floor(rng() * 11), 6 + Math.floor(rng() * 7), "#c9a84a");
  }
}

function tekenHeiligdomPixel(ctx: CanvasRenderingContext2D): void {
  const baseY = 14;
  schaduw(ctx, 8, baseY + 1, 7);

  const rijen = 9;
  for (let i = 0; i < rijen; i++) {
    const t = i / (rijen - 1);
    const half = Math.max(1, Math.round(1 + t * 2));
    blokrij(ctx, 8, baseY - rijen + i + 1, half + 1, "#4c474e");
    blokrij(ctx, 8, baseY - rijen + i + 1, half, "#79747a");
  }

  // Gloed-vonkjes rondom de steen.
  ctx.fillStyle = "rgba(170, 90, 170, 0.5)";
  p(ctx, 4, 6, "rgba(170, 90, 170, 0.4)");
  p(ctx, 12, 7, "rgba(170, 90, 170, 0.4)");
  p(ctx, 5, 10, "rgba(170, 90, 170, 0.35)");
  p(ctx, 11, 4, "rgba(170, 90, 170, 0.35)");

  // Rune-icoon: ringetje + streep.
  ctx.strokeStyle = "rgba(154, 74, 138, 0.9)";
  ctx.lineWidth = 1;
  ctx.strokeRect(7, 5, 2, 2);
  vlijn(ctx, 8, 8, 9, "rgba(154, 74, 138, 0.9)");
}

// `bemand` (nieuwe Wachttoren-functie, hoofdstuk 6, issue: "ik wil ook in het
// wachttoren icoontje zien of er een soldaat in zit") — zelfde onderscheid
// als `tekenWachttoren` in canvas.ts: een gedempte grijze vlag als hij leeg
// (dus inactief) staat, een warme vlag + strijder-silhouet zodra bemand.
function tekenWachttorenPixel(ctx: CanvasRenderingContext2D, bemand: boolean): void {
  const baseY = 14;
  schaduw(ctx, 8, baseY + 1, 8);

  vlijn(ctx, 5, 6, baseY, "#5a4326");
  vlijn(ctx, 11, 6, baseY, "#5a4326");
  hlijn(ctx, 6, 10, 10, "#5a4326");

  hlijn(ctx, 4, 12, 5, "#6b5230");
  ctx.strokeStyle = "#3a2c18";
  ctx.strokeRect(4, 5, 8, 1);

  vlijn(ctx, 8, 1, 5, "#3a2c18");
  const vlagKleur = bemand ? "#c9552f" : "#5a564e";
  blokrij(ctx, 9, 1, 2, vlagKleur);
  blokrij(ctx, 9, 2, 2, vlagKleur);

  if (bemand) {
    p(ctx, 8, 4, "#2a2016");
    vlijn(ctx, 8, 5, 6, "#2a2016");
  }
}

function tekenSettlerPixel(ctx: CanvasRenderingContext2D): void {
  const baseY = 13;
  schaduw(ctx, 8, baseY + 1, 9);

  for (const wx of [5, 11]) {
    for (let i = 0; i < 3; i++) {
      const half = cirkelHalf(1.5, i, 3);
      blokrij(ctx, wx, baseY - 1 + i, half, "#3a2a18");
    }
    p(ctx, wx, baseY, "#8a6a3a");
  }

  hlijn(ctx, 4, 12, baseY - 4, "#6b4a2c");
  hlijn(ctx, 4, 12, baseY - 5, "#6b4a2c");
  ctx.strokeStyle = "#3a2a18";
  ctx.strokeRect(4, baseY - 5, 8, 2);

  const rijen = 5;
  for (let i = 0; i < rijen; i++) {
    const half = cirkelHalf(4, i, rijen * 2);
    blokrij(ctx, 8, baseY - 6 - i, half, "#e8dcc0");
  }
}

// Offer Altaar (hoofdstuk 6, issue: "De Bezette Streek, missionaris en
// verkenner", Deel 4) — pixel-art variant van `tekenOfferAltaar` in
// canvas.ts: een lage stenen slab met een klein offervuur.
function tekenOfferAltaarPixel(ctx: CanvasRenderingContext2D): void {
  const baseY = 14;
  schaduw(ctx, 8, baseY + 1, 9);
  hlijn(ctx, 5, 11, baseY - 2, "#6b6055");
  hlijn(ctx, 4, 12, baseY - 1, "#6b6055");
  hlijn(ctx, 4, 12, baseY, "#6b6055");
  tekenKampvuurPixel(ctx, 8, baseY - 3);
}

// Legerkamp (Deel 5) — pixel-art variant van `tekenLegerkampIcon`.
function tekenLegerkampPixel(ctx: CanvasRenderingContext2D): void {
  tekenTentPixel(ctx, 8, 14, 6, "#5a6b46");
}

// Cosmetisch huisje van een Bezette Streek (Deel 1) — pixel-art variant van
// `tekenBezetteStreekHuisje`: klein, stil, geen kampvuur.
function tekenBezetteStreekHuisjePixel(ctx: CanvasRenderingContext2D): void {
  tekenTentPixel(ctx, 8, 14, 4, "#8a7a68");
}

// Vijandelijke Wachttoren-/Heiligdom-varianten van een Bezette Streek (Deel 1)
// — pixel-art variant: hergebruikt dezelfde vorm als de eigen versies, maar
// met de killere rode/grijze palet uit canvas.ts.
function tekenVijandelijkeWachttorenPixel(ctx: CanvasRenderingContext2D): void {
  const baseY = 14;
  schaduw(ctx, 8, baseY + 1, 8);

  vlijn(ctx, 5, 6, baseY, "#3a2c2c");
  vlijn(ctx, 11, 6, baseY, "#3a2c2c");
  hlijn(ctx, 6, 10, 10, "#3a2c2c");

  hlijn(ctx, 4, 12, 5, "#4a3838");
  ctx.strokeStyle = "#241818";
  ctx.strokeRect(4, 5, 8, 1);

  vlijn(ctx, 8, 1, 5, "#241818");
  blokrij(ctx, 9, 1, 2, "#a0242c");
  blokrij(ctx, 9, 2, 2, "#a0242c");
}

function tekenVijandelijkHeiligdomPixel(ctx: CanvasRenderingContext2D): void {
  const baseY = 14;
  schaduw(ctx, 8, baseY + 1, 7);

  const rijen = 9;
  for (let i = 0; i < rijen; i++) {
    const t = i / (rijen - 1);
    const half = Math.max(1, Math.round(1 + t * 2));
    blokrij(ctx, 8, baseY - rijen + i + 1, half + 1, "#2c2020");
    blokrij(ctx, 8, baseY - rijen + i + 1, half, "#5a4a4a");
  }

  p(ctx, 4, 6, "rgba(200, 60, 60, 0.4)");
  p(ctx, 12, 7, "rgba(200, 60, 60, 0.4)");
  p(ctx, 5, 10, "rgba(200, 60, 60, 0.35)");
  p(ctx, 11, 4, "rgba(200, 60, 60, 0.35)");

  ctx.strokeStyle = "rgba(200, 60, 60, 0.9)";
  ctx.strokeRect(7, 5, 2, 2);
  vlijn(ctx, 8, 8, 9, "rgba(200, 60, 60, 0.9)");
}

// Sterrencirkel — pixel-art variant van `tekenSterrencirkel` in canvas.ts:
// een boog van rechtopstaande stenen met een nachtelijke gloed en sterretjes
// erboven (issue: "wegen en gebouwen verbeteren" — was een kale
// placeholder-vierkant).
function tekenSterrencirkelPixel(ctx: CanvasRenderingContext2D, seed: number): void {
  const rng = maakSeededRandom(seed);
  const baseY = 14;
  schaduw(ctx, 8, baseY + 1, 11);

  const stenen: { x: number; h: number }[] = [
    { x: 2, h: 3 },
    { x: 5, h: 4 },
    { x: 8, h: 3 },
    { x: 11, h: 4 },
    { x: 14, h: 3 },
  ];
  for (const { x: sx, h } of stenen) {
    vlijn(ctx, sx, baseY - h, baseY, "#5c5850");
    p(ctx, sx, baseY - h, "rgba(230, 222, 205, 0.4)");
  }

  p(ctx, 4, 5, "rgba(130, 150, 200, 0.35)");
  p(ctx, 11, 4, "rgba(130, 150, 200, 0.3)");
  p(ctx, 8, 6, "rgba(130, 150, 200, 0.3)");

  const sterren: [number, number][] = [[3, 2], [9, 1], [13, 3], [6, 4]];
  for (const [sx, sy] of sterren) {
    p(ctx, sx, sy, "rgba(232, 220, 200, 0.9)");
    if (rng() > 0.4) {
      p(ctx, sx - 1, sy, "rgba(232, 220, 200, 0.4)");
      p(ctx, sx + 1, sy, "rgba(232, 220, 200, 0.4)");
    }
  }
}

// Amberader (interne id `goudmijn`) — pixel-art variant van `tekenAmberader`
// in canvas.ts: een kleiner rotsblok dan de Steengroeve met een gloeiende
// amberader erdoorheen.
function tekenAmberaderPixel(ctx: CanvasRenderingContext2D, seed: number): void {
  const rng = maakSeededRandom(seed);
  const baseY = 14;
  schaduw(ctx, 8, baseY + 1, 9);

  const rijen = 5;
  for (let i = 0; i < rijen; i++) {
    const y = baseY - i;
    const half = Math.max(1, Math.round(1.5 + i * 0.7));
    blokrij(ctx, 8, y, half, "#584d3f");
  }
  ctx.strokeStyle = "#3a3227";
  ctx.lineWidth = 1;
  ctx.strokeRect(4, baseY - rijen, 8, rijen + 1);

  ctx.strokeStyle = "rgba(216, 140, 40, 0.6)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(5, baseY - 1);
  ctx.lineTo(11, baseY - 4);
  ctx.stroke();

  for (let i = 0; i < 3; i++) {
    const bx = 6 + i * 2 + (rng() > 0.5 ? 1 : 0);
    const by = baseY - 2 - i;
    p(ctx, bx, by, i % 2 === 0 ? "#f6c869" : "#e8a23c");
  }
}

// Voorraadkuil — pixel-art variant van `tekenVoorraadkuil` in canvas.ts: een
// ingegraven kuil met een cluster opgeslagen manden die net boven de rand
// uitsteken.
function tekenVoorraadkuilPixel(ctx: CanvasRenderingContext2D, seed: number): void {
  const rng = maakSeededRandom(seed);
  const baseY = 14;
  schaduw(ctx, 8, baseY + 1, 12);

  hlijn(ctx, 1, 15, baseY, "#4a3d2c");
  hlijn(ctx, 2, 14, baseY - 1, "#4a3d2c");
  hlijn(ctx, 3, 13, baseY - 1, "#241a10");
  hlijn(ctx, 4, 12, baseY, "#160f09");

  const mandKleuren = ["#b98a4c", "#8a6a3a", "#c9a05a"];
  for (let i = 0; i < 3; i++) {
    const bx = 5 + i * 3;
    const h = 3 + (i % 2) + Math.floor(rng() * 2);
    const kleur = mandKleuren[i];
    vlijn(ctx, bx - 1, baseY - h, baseY - 1, kleur);
    vlijn(ctx, bx, baseY - 1 - h, baseY - 1, kleur);
    vlijn(ctx, bx + 1, baseY - h, baseY - 1, kleur);
    p(ctx, bx, baseY - 1 - h, "rgba(60, 42, 22, 0.7)");
  }
}

const LAND_IMPROVEMENT_TEKENAARS: Record<
  string,
  (ctx: CanvasRenderingContext2D, seed: number, bemand: boolean) => void
> = {
  houtkap: tekenHoutkapPixel,
  steengroeve: tekenSteengroevePixel,
  mijn: (ctx) => tekenMijnPixel(ctx),
  boerderij: tekenBoerderijPixel,
  heiligdom: (ctx) => tekenHeiligdomPixel(ctx),
  wachttoren: (ctx, seed, bemand) => tekenWachttorenPixel(ctx, bemand),
  "offer-altaar": (ctx) => tekenOfferAltaarPixel(ctx),
  legerkamp: (ctx) => tekenLegerkampPixel(ctx),
  "vijandelijke-wachttoren": (ctx) => tekenVijandelijkeWachttorenPixel(ctx),
  "vijandelijk-heiligdom": (ctx) => tekenVijandelijkHeiligdomPixel(ctx),
  "bezette-streek-huisje": (ctx) => tekenBezetteStreekHuisjePixel(ctx),
  sterrencirkel: (ctx, seed) => tekenSterrencirkelPixel(ctx, seed),
  goudmijn: (ctx, seed) => tekenAmberaderPixel(ctx, seed),
  voorraadkuil: (ctx, seed) => tekenVoorraadkuilPixel(ctx, seed),
};

function tekenLandImprovementPixel(ctx: CanvasRenderingContext2D, id: string, seed: number, bemand: boolean): void {
  const tekenaar = LAND_IMPROVEMENT_TEKENAARS[id];
  if (tekenaar) {
    tekenaar(ctx, seed, bemand);
    return;
  }
  ctx.fillStyle = "#8a8a4a";
  ctx.fillRect(5, 5, 6, 6);
}

// --- Oceaan ---------------------------------------------------------------

export function tekenOceaanTilePixel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  seed: number
): void {
  const { canvas: tileCanvas, ctx: tileCtx } = maakTileCanvas();
  tileCtx.fillStyle = OCEAAN_BASIS;
  tileCtx.fillRect(0, 0, PIX, PIX);

  const rng = maakSeededRandom(seed);
  for (let i = 0; i < 3; i++) {
    const wy = 3 + i * 4 + Math.floor(rng() * 2);
    hlijn(tileCtx, 0, PIX - 1, wy, "rgba(220, 235, 235, 0.28)");
  }
  for (let i = 0; i < 4; i++) {
    p(tileCtx, Math.floor(rng() * PIX), Math.floor(rng() * PIX), "rgba(230, 240, 235, 0.3)");
  }

  blit(ctx, tileCanvas, x, y, size);
}

// --- Stad, ghost town, fog en statusiconen --------------------------------

function tekenTentPixel(ctx: CanvasRenderingContext2D, cx: number, baseY: number, h: number, kleur: string): void {
  const rijen = h;
  for (let i = 0; i < rijen; i++) {
    const half = Math.max(1, Math.round((h * 0.42) * (i / (rijen - 1 || 1))));
    blokrij(ctx, cx, baseY - h + i, half, kleur);
  }
  vlijn(ctx, cx, baseY - h, baseY, "#2a1c10");
}

function tekenKampvuurPixel(ctx: CanvasRenderingContext2D, cx: number, baseY: number): void {
  p(ctx, cx - 1, baseY - 1, "rgba(255, 170, 70, 0.35)");
  p(ctx, cx + 1, baseY - 1, "rgba(255, 170, 70, 0.35)");
  blokrij(ctx, cx, baseY - 2, 1, "#e07a2a");
  blokrij(ctx, cx, baseY - 1, 1, "#e07a2a");
  p(ctx, cx, baseY - 3, "#f7d34a");
}

function tekenStadTilePixel(ctx: CanvasRenderingContext2D, grootte: City["grootte"]): void {
  const baseY = 14;
  schaduw(ctx, 8, baseY + 1, 12);

  if (grootte === "klein") {
    tekenTentPixel(ctx, 5, baseY, 5, "#b8895a");
    tekenTentPixel(ctx, 10, baseY, 4, "#a9784c");
    tekenKampvuurPixel(ctx, 8, baseY);
  } else {
    tekenTentPixel(ctx, 3, baseY, 4, "#b8895a");
    tekenTentPixel(ctx, 6, baseY, 6, "#c99a68");
    tekenTentPixel(ctx, 11, baseY, 5, "#a9784c");
    tekenTentPixel(ctx, 13, baseY, 3, "#96693e");
    tekenKampvuurPixel(ctx, 9, baseY);
  }
}

function tekenGhostTownPixel(ctx: CanvasRenderingContext2D, seed: number): void {
  const rng = maakSeededRandom(seed);
  ctx.fillStyle = "rgba(20, 18, 15, 0.55)";
  ctx.fillRect(0, 0, PIX, PIX);

  ctx.strokeStyle = "#4a453e";
  ctx.strokeRect(5, 6, 6, 8);
  vlijn(ctx, 6, 6, 8, "#4a453e");
  vlijn(ctx, 10, 5, 9, "#4a453e");

  for (let i = 0; i < 3; i++) {
    p(ctx, 5 + Math.floor(rng() * 6), 12 + Math.floor(rng() * 2), `rgba(214, 110, 60, ${(0.25 + rng() * 0.2).toFixed(2)})`);
  }
}

// Ruïne (hoofdstuk 6, issue: "De Bezette Streek, missionaris en verkenner",
// Deel 5) — pixel-art variant van `tekenRuine` in canvas.ts: zelfde
// rubble-silhouet als `tekenGhostTownPixel` hierboven, maar met een warme
// rust-/asgloed i.p.v. het koude grijs.
function tekenRuinePixel(ctx: CanvasRenderingContext2D, seed: number): void {
  const rng = maakSeededRandom(seed);
  ctx.fillStyle = "rgba(40, 20, 14, 0.5)";
  ctx.fillRect(0, 0, PIX, PIX);

  ctx.strokeStyle = "#5a3c2c";
  ctx.strokeRect(5, 6, 6, 8);
  vlijn(ctx, 6, 6, 8, "#5a3c2c");
  vlijn(ctx, 10, 5, 9, "#5a3c2c");

  for (let i = 0; i < 4; i++) {
    p(ctx, 5 + Math.floor(rng() * 6), 12 + Math.floor(rng() * 2), `rgba(224, 120, 60, ${(0.3 + rng() * 0.2).toFixed(2)})`);
  }
}

// Waarschuwingsdriehoek voor de "kritiek"-verval-status (M6, hoofdstuk 4/13).
function tekenVervalIndicatorPixel(ctx: CanvasRenderingContext2D): void {
  const rijen = 6;
  for (let i = 0; i < rijen; i++) {
    blokrij(ctx, 12, 1 + i, Math.max(1, Math.round(i * 0.7)), "#e0684a");
  }
  ctx.strokeStyle = "#2a1008";
  ctx.strokeRect(9, 1, 6, 6);
  vlijn(ctx, 12, 3, 4, "#2a1008");
  p(ctx, 12, 6, "#2a1008");
}

function tekenFogTilePixel(ctx: CanvasRenderingContext2D, seed: number): void {
  ctx.fillStyle = "#0e0b08";
  ctx.fillRect(0, 0, PIX, PIX);

  const rng = maakSeededRandom(seed);
  for (let i = 0; i < 3; i++) {
    const mx = Math.floor(rng() * (PIX - 2));
    const my = Math.floor(rng() * (PIX - 3)) + 2;
    ctx.fillStyle = "rgba(120, 130, 140, 0.16)";
    ctx.fillRect(mx, my, 2, 2);
  }
  for (let i = 0; i < 4; i++) {
    p(ctx, Math.floor(rng() * PIX), Math.floor(rng() * PIX * 0.6), `rgba(230, 220, 200, ${(0.16 + rng() * 0.16).toFixed(2)})`);
  }
}

// Verhuld vakje van een Bezette Streek (hoofdstuk 6, issue: "De Bezette Streek,
// missionaris en verkenner", Deel 1) — pixel-art variant van
// `tekenVerhuldeTile` in canvas.ts: zelfde opbouw als `tekenFogTilePixel`
// hierboven, met een dreigende rossige gloed i.p.v. het neutrale grijs.
function tekenVerhuldeTilePixel(ctx: CanvasRenderingContext2D, seed: number): void {
  ctx.fillStyle = "#1a0f0b";
  ctx.fillRect(0, 0, PIX, PIX);

  const rng = maakSeededRandom(seed);
  for (let i = 0; i < 3; i++) {
    const mx = Math.floor(rng() * (PIX - 2));
    const my = Math.floor(rng() * (PIX - 3)) + 2;
    ctx.fillStyle = "rgba(160, 70, 60, 0.18)";
    ctx.fillRect(mx, my, 2, 2);
  }
  for (let i = 0; i < 3; i++) {
    p(ctx, Math.floor(rng() * PIX), Math.floor(rng() * PIX * 0.6), `rgba(220, 140, 110, ${(0.14 + rng() * 0.14).toFixed(2)})`);
  }
}

function tekenVooruitkijkTilePixel(ctx: CanvasRenderingContext2D, terreinType: string): void {
  ctx.fillStyle = terreinBasisKleur(terreinType);
  ctx.globalAlpha = 0.3;
  ctx.fillRect(0, 0, PIX, PIX);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(12, 10, 8, 0.4)";
  ctx.fillRect(0, 0, PIX, PIX);

  ctx.strokeStyle = "rgba(232, 220, 200, 0.7)";
  ctx.strokeRect(5, 5, 4, 4);
  vlijn(ctx, 10, 10, 12, "rgba(232, 220, 200, 0.7)");
  hlijn(ctx, 10, 12, 12, "rgba(232, 220, 200, 0.7)");
}

function tekenBouwSteigerPixel(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = "rgba(201, 184, 150, 0.6)";
  for (let i = -PIX; i < PIX; i += 4) {
    ctx.beginPath();
    ctx.moveTo(i, PIX);
    ctx.lineTo(i + PIX, 0);
    ctx.stroke();
  }
}

function tekenNietVerbondenIndicatorPixel(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "rgba(16, 14, 12, 0.4)";
  ctx.fillRect(0, 0, PIX, PIX);

  ctx.strokeStyle = "#e8dcc8";
  ctx.strokeRect(1, 1, 3, 3);
  vlijn(ctx, 1, 4, 1, "#e8dcc8");
  hlijn(ctx, 1, 4, 4, "#e8dcc8");
}

// Zachte hint van het vakje-terreinsubtype op een nog onbebouwd vakje.
function tekenTerreinHintPixel(ctx: CanvasRenderingContext2D, terrein: Tile["terrein"], seed: number): void {
  if (terrein === "vlak") return;

  if (terrein === "bos") {
    ctx.save();
    ctx.globalAlpha = 0.55;
    const rng = maakSeededRandom(seed);
    tekenBoomPixel(ctx, 8, 12, 7, rng() > 0.5);
    ctx.restore();
    return;
  }

  // Issue: "berg/heuvel niet goed zichtbaar in pixel art" — een vlakke vulling
  // zonder rand viel op sommige streken bijna samen met de terreinkleur (bv. de
  // olijfbruine oevervlakte-ondergrond van streek 1 tegen de vergelijkbaar
  // gekleurde heuvel-vulling). Elke rij krijgt daarom eerst een bredere,
  // donkere rand-rij en daarna de smallere vulkleur erbovenop, zodat het
  // silhouet op elke ondergrond afsteekt — zelfde aanpak als de wegrand-fix
  // in `tekenWegPixel` hierboven.
  const rijen = terrein === "berg" ? 6 : 4;
  const kleur = terrein === "berg" ? "#c9cbc4" : "#b08e52";
  const rand = "rgba(28, 22, 14, 0.85)";
  const baseY = 12;
  for (let i = 0; i < rijen; i++) {
    const y = baseY - rijen + i + 1;
    const half = Math.max(1, Math.round(((i + 1) / rijen) * 4));
    blokrij(ctx, 8, y, half + 1, rand);
  }
  for (let i = 0; i < rijen; i++) {
    const y = baseY - rijen + i + 1;
    const half = Math.max(1, Math.round(((i + 1) / rijen) * 4));
    blokrij(ctx, 8, y, half, kleur);
  }
}

function tekenHertSilhouetPixel(ctx: CanvasRenderingContext2D, cx: number, baseY: number, h: number): void {
  const rijen = 3;
  for (let i = 0; i < rijen; i++) {
    const half = cirkelHalf(h * 0.4, i, rijen);
    blokrij(ctx, cx, baseY - h * 0.4 + i, half, "rgba(60, 44, 28, 0.85)");
  }
  vlijn(ctx, cx - h * 0.2, baseY - h * 0.4, baseY, "rgba(60, 44, 28, 0.85)");
  vlijn(ctx, cx + h * 0.2, baseY - h * 0.35, baseY, "rgba(60, 44, 28, 0.85)");
  p(ctx, cx + h * 0.35, baseY - h * 0.7, "rgba(60, 44, 28, 0.85)");
}

function tekenKuddePixel(ctx: CanvasRenderingContext2D, seed: number): void {
  const rng = maakSeededRandom(seed);
  tekenHertSilhouetPixel(ctx, 6, 12, 5 + rng());
  tekenHertSilhouetPixel(ctx, 10, 11, 4 + rng());
}

function tekenRoofdierPixel(ctx: CanvasRenderingContext2D): void {
  const cx = 8;
  const baseY = 11;
  const rijen = 3;
  for (let i = 0; i < rijen; i++) {
    const half = cirkelHalf(3, i, rijen);
    blokrij(ctx, cx, baseY - 2 + i, half, "rgba(30, 12, 10, 0.9)");
  }
  vlijn(ctx, cx - 3, baseY, baseY + 2, "rgba(30, 12, 10, 0.9)");
  vlijn(ctx, cx + 3, baseY, baseY + 2, "rgba(30, 12, 10, 0.9)");
  p(ctx, cx + 4, baseY - 1, "rgba(196, 70, 40, 0.95)");
}

function tekenVersWaterMarkeringPixel(ctx: CanvasRenderingContext2D, seed: number): void {
  const rng = maakSeededRandom(seed);
  for (let gx = 0; gx < PIX; gx += 2) {
    const gy = 14 + Math.round(Math.sin(gx * 0.9 + rng()) * 0.6);
    p(ctx, gx, gy, "rgba(120, 195, 220, 0.85)");
  }
}

// Issue: "niet duidelijk als er nu een weg ligt" — een volle, ononderbroken
// aardebaan met een donkere rand boven en onder in plaats van verspreide
// halftransparante stippen, zodat de weg op elke ondergrondkleur duidelijk
// afsteekt.
//
// Issue: "kruispunten en driesprongen zien als er een weg verticaal omhoog
// loopt vanaf een horizontale weg" — de horizontale baan (rijen `boven`..
// `onder`) wordt nu alleen zo breed getekend als er ook echt een buur-weg
// links/rechts is, en een aparte verticale baan (kolommen `linkerBaan`..
// `rechterBaan`) verschijnt zodra er een buur-weg omhoog/omlaag is. Samen
// vormen die twee banen, net als bij `tekenWeg` in canvas.ts, vanzelf een
// doodlopend stuk, T-splitsing of kruispunt afhankelijk van welke
// `verbindingen` er zijn.
function tekenWegPixel(ctx: CanvasRenderingContext2D, seed: number, verbindingen: WegVerbindingen): void {
  const rng = maakSeededRandom(seed);
  const boven = 11;
  const onder = 14;
  const linkerBaan = 6;
  const rechterBaan = 9;
  const randKleur = "#3a2a18";
  const vlakKleur = "#c8a878";

  const heeftHorizontaal = verbindingen.links || verbindingen.rechts;
  const heeftVerticaal = verbindingen.omhoog || verbindingen.omlaag;

  if (heeftHorizontaal) {
    const startX = verbindingen.links ? 0 : linkerBaan;
    const eindX = verbindingen.rechts ? PIX - 1 : rechterBaan;
    hlijn(ctx, startX, eindX, boven, randKleur);
    for (let gy = boven + 1; gy < onder; gy++) {
      hlijn(ctx, startX, eindX, gy, vlakKleur);
    }
    hlijn(ctx, startX, eindX, onder, randKleur);
  }

  if (heeftVerticaal) {
    const startY = verbindingen.omhoog ? 0 : boven;
    const eindY = verbindingen.omlaag ? PIX - 1 : onder;
    vlijn(ctx, linkerBaan, startY, eindY, randKleur);
    for (let gx = linkerBaan + 1; gx < rechterBaan; gx++) {
      vlijn(ctx, gx, startY, eindY, vlakKleur);
    }
    vlijn(ctx, rechterBaan, startY, eindY, randKleur);
  }

  if (!heeftHorizontaal && !heeftVerticaal) {
    // Nog geen buur met een eigen weg: een klein los stukje pad i.p.v. een
    // volle baan die nergens op aansluit.
    hlijn(ctx, linkerBaan, rechterBaan, boven, randKleur);
    for (let gy = boven + 1; gy < onder; gy++) {
      hlijn(ctx, linkerBaan, rechterBaan, gy, vlakKleur);
    }
    hlijn(ctx, linkerBaan, rechterBaan, onder, randKleur);
  }

  for (let gx = 0; gx < PIX; gx++) {
    const opHorizontaleBaan = heeftHorizontaal && gx >= (verbindingen.links ? 0 : linkerBaan) && gx <= (verbindingen.rechts ? PIX - 1 : rechterBaan);
    if (opHorizontaleBaan && rng() > 0.5) {
      const gy = boven + 1 + Math.floor(rng() * (onder - boven - 1));
      p(ctx, gx, gy, rng() > 0.5 ? "rgba(140, 112, 74, 0.8)" : "rgba(230, 208, 172, 0.7)");
    }
  }
}

// --- Offscreen tile-canvas + upscale-blit ---------------------------------

function maakTileCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = PIX;
  canvas.height = PIX;
  const ctx = canvas.getContext("2d")!;
  return { canvas, ctx };
}

function blit(
  doelCtx: CanvasRenderingContext2D,
  bron: HTMLCanvasElement,
  x: number,
  y: number,
  size: number
): void {
  doelCtx.imageSmoothingEnabled = false;
  doelCtx.drawImage(bron, 0, 0, PIX, PIX, Math.round(x), Math.round(y), Math.ceil(size), Math.ceil(size));
}

function tekenActieveTilePixel(
  ctx: CanvasRenderingContext2D,
  tile: Tile,
  terreinType: string,
  stad: City,
  col: number,
  hoogte: number,
  verbondenMetStad: boolean,
  streken: Streek[]
): void {
  const seed = tileSeed(col, hoogte);
  tekenTerreinOndergrondPixel(ctx, terreinType, seed);

  if (tile.heeftWeg) {
    tekenWegPixel(ctx, seed, wegVerbindingen(streken, hoogte, col));
  }

  if (tile.status === "ghost_town") {
    tekenGhostTownPixel(ctx, seed);
    return;
  }

  if (tile.status === "ruine") {
    tekenRuinePixel(ctx, seed);
    return;
  }

  if (tile.improvement?.soort === "city") {
    tekenStadTilePixel(ctx, stad.grootte);
    if (stad.vervalStatus === "kritiek") {
      tekenVervalIndicatorPixel(ctx);
    }
    return;
  }

  if (tile.status === "actief" && tile.improvement?.soort === "land") {
    const bemand =
      tile.improvement.id === "wachttoren" && isWachttorenBemand(stad.strijders, hoogte, col);
    tekenLandImprovementPixel(ctx, tile.improvement.id, seed, bemand);

    if (tile.beurtenTotUitputting !== undefined) {
      ctx.fillStyle = "rgba(20, 16, 10, 0.7)";
      ctx.fillRect(10, 11, 6, 4);
      ctx.fillStyle = "#e8dcc8";
      ctx.font = "4px sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText(String(tile.beurtenTotUitputting), 15, 14);
    }

    if (!verbondenMetStad) {
      tekenNietVerbondenIndicatorPixel(ctx);
    }
    return;
  }

  if (tile.status === "in_aanbouw") {
    tekenBouwSteigerPixel(ctx);
    return;
  }

  if (tile.status === "leeg") {
    tekenTerreinHintPixel(ctx, tile.terrein, seed);
    if (tile.kudde) {
      tekenKuddePixel(ctx, seed + 1);
    }
    if (tile.roofdier) {
      tekenRoofdierPixel(ctx);
    }
  }
}

// Tekent alle streken (band van 9 vakjes breed) — pixel-art variant van
// `tekenWereld` in canvas.ts, zelfde signatuur zodat GameCanvas.tsx op basis
// van de gekozen stijl kan wisselen tussen de twee zonder verder iets aan te
// passen.
export function tekenWereldPixelArt(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  streken: Streek[],
  stad: City,
  plaatsingsStreekHoogte?: number,
  settler?: Settler,
  settlerBereikbarePosities?: Settler[],
  legerkampBereikbarePosities?: Settler[],
  verkenningBereikbarePosities?: Settler[]
): void {
  const tileSize = width / BAND_WIDTH_TILES;
  const totaalStreken = streken.length;
  // Afsluitende oceaan-rij bóven de laatste streek (issue: "laatste oceaan ook
  // visueel") — zie canvas.ts voor de volledige toelichting.
  const topOffset = eindeOceaanZichtbaar(streken) ? tileSize : 0;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#100d0a";
  ctx.fillRect(0, 0, width, height);

  const { canvas: tileCanvas, ctx: tileCtx } = maakTileCanvas();

  for (const streek of streken) {
    const rijIndex = totaalStreken - streek.hoogte;
    const y = rijIndex * tileSize + topOffset;
    const vooruitkijk = !streek.ontgrendeld && isVooruitkijkStreek(streek, streken);

    for (let col = 0; col < BAND_WIDTH_TILES; col++) {
      const x = col * tileSize;
      tileCtx.clearRect(0, 0, PIX, PIX);

      // Bezette Streek (hoofdstuk 6, issue: "De Bezette Streek, missionaris en
      // verkenner", Deel 1) — zelfde per-tegel-verhullingslaag als
      // `tekenWereld` in canvas.ts.
      if (streek.bezet) {
        const tile = streek.tiles[col];
        if (tile.verhuld) {
          tekenVerhuldeTilePixel(tileCtx, tileSeed(col, streek.hoogte));
        } else {
          const verbonden = isTileVerbondenMetStad(streken, streek.hoogte, col);
          tekenActieveTilePixel(tileCtx, tile, streek.terreinType, stad, col, streek.hoogte, verbonden, streken);
        }
      } else if (!streek.ontgrendeld && !vooruitkijk) {
        tekenFogTilePixel(tileCtx, tileSeed(col, streek.hoogte));
      } else if (!streek.ontgrendeld && vooruitkijk) {
        tekenVooruitkijkTilePixel(tileCtx, streek.terreinType);
      } else {
        const verbonden = isTileVerbondenMetStad(streken, streek.hoogte, col);
        tekenActieveTilePixel(tileCtx, streek.tiles[col], streek.terreinType, stad, col, streek.hoogte, verbonden, streken);
        if (streek.tiles[col].versWater) {
          tekenVersWaterMarkeringPixel(tileCtx, tileSeed(col, streek.hoogte, 2));
        }
      }

      blit(ctx, tileCanvas, x, y, tileSize);
      tekenTileGrid(ctx, x, y, tileSize);

      if (streek.hoogte === plaatsingsStreekHoogte && isBebouwbaarLeeg(streek.tiles[col])) {
        tekenBeschikbaarMarkering(ctx, x, y, tileSize);
      }

      if (settlerBereikbarePosities?.some((positie) => positie.hoogte === streek.hoogte && positie.positieInStreek === col)) {
        tekenSettlerBereikbaarMarkering(ctx, x, y, tileSize);
      }

      if (
        legerkampBereikbarePosities?.some(
          (positie) => positie.hoogte === streek.hoogte && positie.positieInStreek === col
        )
      ) {
        tekenLegerkampBereikbaarMarkering(ctx, x, y, tileSize);
      }

      if (
        verkenningBereikbarePosities?.some(
          (positie) => positie.hoogte === streek.hoogte && positie.positieInStreek === col
        )
      ) {
        tekenVerkenningBereikbaarMarkering(ctx, x, y, tileSize);
      }
    }
  }

  if (settler) {
    const rijIndex = totaalStreken - settler.hoogte;
    if (rijIndex >= 0 && rijIndex < totaalStreken) {
      tileCtx.clearRect(0, 0, PIX, PIX);
      tekenSettlerPixel(tileCtx);
      blit(ctx, tileCanvas, settler.positieInStreek * tileSize, rijIndex * tileSize + topOffset, tileSize);
    }
  }

  const oceaanY = totaalStreken * tileSize + topOffset;
  for (let col = 0; col < BAND_WIDTH_TILES; col++) {
    const x = col * tileSize;
    tekenOceaanTilePixel(ctx, x, oceaanY, tileSize, tileSeed(col, 0));
    tekenTileGrid(ctx, x, oceaanY, tileSize);
  }

  // Afsluitende oceaan-rij bóven de laatste streek (issue: "laatste oceaan ook
  // visueel") — zie canvas.ts voor de volledige toelichting.
  if (topOffset > 0) {
    for (let col = 0; col < BAND_WIDTH_TILES; col++) {
      const x = col * tileSize;
      tekenOceaanTilePixel(ctx, x, 0, tileSize, tileSeed(col, totaalStreken + 1));
      tekenTileGrid(ctx, x, 0, tileSize);
    }
  }
}
