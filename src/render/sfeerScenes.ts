// Sfeerbeelden voor het intro- en ineenstortingsscherm (issue: "intro en game
// over scherm"). Zelfde aanpak als de tegel-art in canvas.ts: handgetekende
// vector-schilderingen in plaats van losse afbeeldingsbestanden, omdat dit
// project de herkomst/licentie van een extern plaatje niet kan verifiëren
// (zie canvas.ts, bovenaan). Warme/aardse Riven/Myst-stijl voor het intro
// (hoofdstuk 12/13), een kille, gedoofde variant voor de ineenstorting — maar
// beide blijven in de neolithische setting, geen latere-campagne-beeldtaal.

import { hexNaarRgb, maakSeededRandom, rgbNaarCss, tint } from "./canvas";

export const SFEER_BREEDTE = 960;
export const SFEER_HOOGTE = 420;

function tekenHeuvelSilhouet(
  ctx: CanvasRenderingContext2D,
  breedte: number,
  horizonY: number,
  amplitude: number,
  kleur: string,
  seed: number
): void {
  const rng = maakSeededRandom(seed);
  ctx.fillStyle = kleur;
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  const stappen = 7;
  for (let i = 0; i <= stappen; i++) {
    const x = (breedte / stappen) * i;
    const y = horizonY - amplitude * (0.3 + rng() * 0.7);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(breedte, horizonY + amplitude);
  ctx.lineTo(0, horizonY + amplitude);
  ctx.closePath();
  ctx.fill();
}

function tekenTentSilhouet(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  h: number,
  kleur: string
): void {
  ctx.fillStyle = kleur;
  ctx.beginPath();
  ctx.moveTo(cx, baseY - h);
  ctx.lineTo(cx + h * 0.4, baseY);
  ctx.lineTo(cx - h * 0.4, baseY);
  ctx.closePath();
  ctx.fill();
}

function tekenVuurGloed(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, kleur: string): void {
  const gloed = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  gloed.addColorStop(0, kleur);
  gloed.addColorStop(1, rgbNaarCss(hexNaarRgb("#000000"), 0));
  ctx.fillStyle = gloed;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

// Intro-sfeerbeeld: ochtendlicht boven de rivier waar "De Eerste Vuren" begint
// (hoofdstuk 10) — stil, warm, verwondering in plaats van dreiging.
export function tekenIntroSfeer(ctx: CanvasRenderingContext2D, breedte: number, hoogte: number): void {
  const horizonY = hoogte * 0.62;

  const lucht = ctx.createLinearGradient(0, 0, 0, horizonY);
  lucht.addColorStop(0, "#2b3350");
  lucht.addColorStop(0.55, "#7a5a52");
  lucht.addColorStop(1, "#e8a15a");
  ctx.fillStyle = lucht;
  ctx.fillRect(0, 0, breedte, horizonY);

  tekenVuurGloed(ctx, breedte * 0.5, horizonY, breedte * 0.32, "rgba(255, 210, 140, 0.55)");

  tekenHeuvelSilhouet(ctx, breedte, horizonY - hoogte * 0.05, hoogte * 0.14, rgbNaarCss(tint("#5a4a38", -0.1), 0.85), 11);
  tekenHeuvelSilhouet(ctx, breedte, horizonY, hoogte * 0.1, rgbNaarCss(tint("#3a2f22", -0.2)), 47);

  const water = ctx.createLinearGradient(0, horizonY, 0, hoogte);
  water.addColorStop(0, "#c98a56");
  water.addColorStop(0.2, "#5c4534");
  water.addColorStop(1, "#241c14");
  ctx.fillStyle = water;
  ctx.fillRect(0, horizonY, breedte, hoogte - horizonY);

  ctx.fillStyle = "rgba(255, 210, 150, 0.22)";
  ctx.fillRect(breedte * 0.5 - breedte * 0.05, horizonY, breedte * 0.1, hoogte - horizonY);

  const kampY = hoogte * 0.92;
  tekenVuurGloed(ctx, breedte * 0.5, kampY - hoogte * 0.02, hoogte * 0.18, "rgba(255, 170, 70, 0.35)");
  tekenTentSilhouet(ctx, breedte * 0.46, kampY, hoogte * 0.16, "#241c14");
  tekenTentSilhouet(ctx, breedte * 0.56, kampY, hoogte * 0.13, "#1a140e");
}

function tekenGedoofdVuur(ctx: CanvasRenderingContext2D, cx: number, baseY: number, r: number): void {
  tekenVuurGloed(ctx, cx, baseY - r * 0.2, r * 1.6, "rgba(120, 70, 40, 0.2)");

  ctx.strokeStyle = "rgba(80, 60, 50, 0.6)";
  ctx.lineWidth = Math.max(1, r * 0.12);
  for (const dx of [-0.4, 0, 0.35]) {
    ctx.beginPath();
    ctx.moveTo(cx + r * dx, baseY);
    ctx.lineTo(cx + r * (dx * 0.4), baseY - r * 1.1);
    ctx.stroke();
  }

  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = `rgba(200, 100, 40, ${0.35 - i * 0.1})`;
    ctx.beginPath();
    ctx.arc(cx + (i - 1) * r * 0.3, baseY - r * 0.05, r * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(160, 160, 155, 0.3)";
  ctx.lineWidth = Math.max(1, r * 0.1);
  ctx.beginPath();
  ctx.moveTo(cx, baseY - r * 0.2);
  ctx.bezierCurveTo(cx + r * 0.6, baseY - r * 1.4, cx - r * 0.5, baseY - r * 2.4, cx + r * 0.3, baseY - r * 3.6);
  ctx.stroke();
}

function tekenIngestorteTent(ctx: CanvasRenderingContext2D, cx: number, baseY: number, h: number): void {
  ctx.strokeStyle = "#161210";
  ctx.lineWidth = Math.max(1.5, h * 0.06);
  ctx.beginPath();
  ctx.moveTo(cx - h * 0.4, baseY);
  ctx.lineTo(cx + h * 0.15, baseY - h * 0.35);
  ctx.moveTo(cx - h * 0.1, baseY);
  ctx.lineTo(cx + h * 0.4, baseY - h * 0.2);
  ctx.stroke();

  ctx.fillStyle = "#201a16";
  ctx.beginPath();
  ctx.moveTo(cx - h * 0.4, baseY);
  ctx.lineTo(cx + h * 0.15, baseY - h * 0.35);
  ctx.lineTo(cx + h * 0.4, baseY - h * 0.2);
  ctx.lineTo(cx + h * 0.35, baseY);
  ctx.closePath();
  ctx.fill();
}

// Ineenstortings-sfeerbeeld: het vuur dooft, het kamp valt terug tot land
// (hoofdstuk 4: "hard verval" — de groei-tier en relics gaan verloren, niet
// het einde van de run). Zelfde neolithische setting als het intro, maar
// koud/donker in plaats van warm.
export function tekenIneenstortingSfeer(ctx: CanvasRenderingContext2D, breedte: number, hoogte: number): void {
  const horizonY = hoogte * 0.62;

  const lucht = ctx.createLinearGradient(0, 0, 0, horizonY);
  lucht.addColorStop(0, "#0c0c10");
  lucht.addColorStop(0.6, "#241a1c");
  lucht.addColorStop(1, "#4a2620");
  ctx.fillStyle = lucht;
  ctx.fillRect(0, 0, breedte, horizonY);

  tekenVuurGloed(ctx, breedte * 0.5, horizonY, breedte * 0.22, "rgba(160, 60, 30, 0.2)");

  tekenHeuvelSilhouet(ctx, breedte, horizonY - hoogte * 0.05, hoogte * 0.14, "#1c1613", 23);
  tekenHeuvelSilhouet(ctx, breedte, horizonY, hoogte * 0.1, "#100c0a", 59);

  const grond = ctx.createLinearGradient(0, horizonY, 0, hoogte);
  grond.addColorStop(0, "#2a2018");
  grond.addColorStop(1, "#100c0a");
  ctx.fillStyle = grond;
  ctx.fillRect(0, horizonY, breedte, hoogte - horizonY);

  const kampY = hoogte * 0.92;
  tekenIngestorteTent(ctx, breedte * 0.44, kampY, hoogte * 0.15);
  tekenGedoofdVuur(ctx, breedte * 0.56, kampY, hoogte * 0.06);

  const rng = maakSeededRandom(101);
  for (let i = 0; i < 24; i++) {
    const ax = rng() * breedte;
    const ay = horizonY + rng() * (hoogte - horizonY) * 0.8;
    ctx.fillStyle = `rgba(180, 175, 165, ${0.08 + rng() * 0.12})`;
    ctx.beginPath();
    ctx.arc(ax, ay, 1 + rng() * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
