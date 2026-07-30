// Canvas-rendering van de tegel-band (M1: grid & laag-rendering).
// Losse tegel-tekeningen per improvement, geen naadloos geschilderd tafereel —
// zie frontier-city-design-doc.md hoofdstuk 12 (visuele stijl). De MVP-stijl
// volgt de Riven/Myst-referentie uit hoofdstuk 13: stil, schilderachtig,
// warm/aards licht. In plaats van losse afbeeldingsbestanden (die dit project
// zou moeten meenemen zonder de herkomst/licentie te kunnen verifiëren) worden
// de tegels hier als handgetekende vector-art opgebouwd — dezelfde
// canvas-renderpijplijn, maar met gelaagde, geschilderde texturen in plaats
// van platte kleurvlakken.

import { City, Layer, Tile } from "@/game/types";
import { BAND_WIDTH_TILES, isVooruitkijkLaag } from "@/game/world";

export { BAND_WIDTH_TILES };

// --- Kleur-hulpfuncties -----------------------------------------------

function hexNaarRgb(hex: string): [number, number, number] {
  const schoon = hex.replace("#", "");
  const volledig =
    schoon.length === 3
      ? schoon
          .split("")
          .map((c) => c + c)
          .join("")
      : schoon;
  const getal = parseInt(volledig, 16);
  return [(getal >> 16) & 255, (getal >> 8) & 255, getal & 255];
}

function rgbNaarCss([r, g, b]: [number, number, number], alpha = 1): string {
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Verlicht (percentage > 0) of verdonkert (percentage < 0) een hex-kleur.
// Gebruikt om uit één basiskleur per terreintype een schilderachtig
// licht/donker-verloop te halen zonder elke tint met de hand vast te leggen.
function tint(hex: string, percentage: number): [number, number, number] {
  const [r, g, b] = hexNaarRgb(hex);
  const doel = percentage > 0 ? 255 : 0;
  const p = Math.abs(percentage);
  return [r + (doel - r) * p, g + (doel - g) * p, b + (doel - b) * p];
}

// Deterministische pseudo-random per tile-positie (col, hoogte) zodat
// schilderachtige textuurdetails stabiel blijven tussen re-renders — een
// echte Math.random() zou bij elke state-update (nieuwe beurt, bouwactie)
// opnieuw schudden en de tegel laten "flikkeren".
function maakSeededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function tileSeed(col: number, hoogte: number, extra = 0): number {
  return col * 9781 + hoogte * 6271 + extra * 131 + 1;
}

// --- Terrein-paletten ---------------------------------------------------

const TERREIN_BASIS: Record<string, string> = {
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

function terreinBasisKleur(terreinType: string): string {
  return TERREIN_BASIS[terreinType] ?? "#6b5b3e";
}

// Schildert de ondergrond van een tile: een warm verloop van licht (linksboven,
// alsof de zon laag staat) naar donker (rechtsonder), plus een paar zachte
// verf-vlekken voor textuur — geeft de "geschilderd", niet-vlakke indruk uit
// hoofdstuk 12 zonder een los afbeeldingsbestand nodig te hebben.
function tekenTerreinOndergrond(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  terreinType: string,
  seed: number
): void {
  const basis = terreinBasisKleur(terreinType);
  const verloop = ctx.createLinearGradient(x, y, x + size, y + size);
  verloop.addColorStop(0, rgbNaarCss(tint(basis, 0.22)));
  verloop.addColorStop(0.55, basis);
  verloop.addColorStop(1, rgbNaarCss(tint(basis, -0.28)));
  ctx.fillStyle = verloop;
  ctx.fillRect(x, y, size, size);

  const rng = maakSeededRandom(seed);
  for (let i = 0; i < 4; i++) {
    const vx = x + rng() * size;
    const vy = y + rng() * size;
    const r = size * (0.18 + rng() * 0.22);
    const donker = rng() > 0.5;
    const vlek = ctx.createRadialGradient(vx, vy, 0, vx, vy, r);
    vlek.addColorStop(0, rgbNaarCss(tint(basis, donker ? -0.18 : 0.16), 0.16));
    vlek.addColorStop(1, rgbNaarCss(tint(basis, donker ? -0.18 : 0.16), 0));
    ctx.fillStyle = vlek;
    ctx.beginPath();
    ctx.arc(vx, vy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Zachte contactschaduw onder een improvement-icoon, zodat het los van de
// ondergrond "staat" in plaats van er plat bovenop geplakt te lijken.
function tekenContactschaduw(
  ctx: CanvasRenderingContext2D,
  cx: number,
  groundY: number,
  breedte: number
): void {
  ctx.save();
  ctx.fillStyle = "rgba(10, 8, 6, 0.35)";
  ctx.beginPath();
  ctx.ellipse(cx, groundY, breedte / 2, breedte * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// --- Land-improvement iconografie ---------------------------------------

function tekenBoom(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  h: number,
  breed: boolean
): void {
  const stamBreedte = h * 0.09;
  ctx.fillStyle = "#3a2a18";
  ctx.fillRect(cx - stamBreedte / 2, baseY - h * 0.28, stamBreedte, h * 0.28);

  ctx.fillStyle = "#2f4a22";
  if (breed) {
    ctx.beginPath();
    ctx.ellipse(cx, baseY - h * 0.55, h * 0.32, h * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 235, 190, 0.18)";
    ctx.beginPath();
    ctx.ellipse(cx - h * 0.1, baseY - h * 0.68, h * 0.14, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(cx, baseY - h);
    ctx.lineTo(cx + h * 0.26, baseY - h * 0.42);
    ctx.lineTo(cx - h * 0.26, baseY - h * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#3d5c2c";
    ctx.beginPath();
    ctx.moveTo(cx, baseY - h * 0.78);
    ctx.lineTo(cx + h * 0.19, baseY - h * 0.3);
    ctx.lineTo(cx - h * 0.19, baseY - h * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255, 235, 190, 0.16)";
    ctx.beginPath();
    ctx.moveTo(cx, baseY - h);
    ctx.lineTo(cx + h * 0.06, baseY - h * 0.5);
    ctx.lineTo(cx - h * 0.02, baseY - h * 0.5);
    ctx.closePath();
    ctx.fill();
  }
}

function tekenHoutkap(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, seed: number): void {
  const rng = maakSeededRandom(seed);
  const baseY = y + size * 0.86;
  tekenContactschaduw(ctx, x + size * 0.5, baseY, size * 0.62);

  const gekapteStam = { x: x + size * 0.28, y: baseY };
  ctx.strokeStyle = "#4a3420";
  ctx.lineWidth = Math.max(1.5, size * 0.05);
  ctx.beginPath();
  ctx.moveTo(gekapteStam.x - size * 0.14, gekapteStam.y);
  ctx.lineTo(gekapteStam.x + size * 0.14, gekapteStam.y - size * 0.05);
  ctx.stroke();
  ctx.fillStyle = "#caa876";
  ctx.beginPath();
  ctx.ellipse(gekapteStam.x - size * 0.14, gekapteStam.y, size * 0.05, size * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();

  tekenBoom(ctx, x + size * 0.62, baseY, size * 0.62, rng() > 0.5);
  tekenBoom(ctx, x + size * 0.42, baseY - size * 0.02, size * 0.44, rng() > 0.5);
}

function tekenSteengroeve(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, seed: number): void {
  const rng = maakSeededRandom(seed);
  const baseY = y + size * 0.84;
  tekenContactschaduw(ctx, x + size * 0.5, baseY, size * 0.68);

  const punten: [number, number][] = [
    [0.14, 0], [0.4, -0.42], [0.62, -0.2], [0.86, -0.34], [0.95, 0], [0.05, 0],
  ];
  ctx.fillStyle = "#8a8577";
  ctx.beginPath();
  punten.forEach(([px, py], i) => {
    const gx = x + size * px;
    const gy = baseY + size * py;
    if (i === 0) ctx.moveTo(gx, gy);
    else ctx.lineTo(gx, gy);
  });
  ctx.closePath();
  ctx.fill();

  // Facet-hooglichten voor een gehouwen, niet-vlak gesteente
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = `rgba(230, 222, 205, ${0.14 + rng() * 0.1})`;
    const fx = x + size * (0.25 + rng() * 0.4);
    const fy = baseY - size * (0.15 + rng() * 0.2);
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + size * 0.12, fy - size * 0.1);
    ctx.lineTo(fx + size * 0.05, fy + size * 0.05);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = "#4a453a";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function tekenMijn(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const baseY = y + size * 0.86;
  tekenContactschaduw(ctx, x + size * 0.5, baseY, size * 0.66);

  ctx.fillStyle = "#5c4a34";
  ctx.fillRect(x + size * 0.2, y + size * 0.34, size * 0.1, size * 0.5);
  ctx.fillRect(x + size * 0.7, y + size * 0.34, size * 0.1, size * 0.5);
  ctx.fillRect(x + size * 0.18, y + size * 0.28, size * 0.64, size * 0.1);

  const opening = ctx.createRadialGradient(
    x + size * 0.5, y + size * 0.62, size * 0.02,
    x + size * 0.5, y + size * 0.62, size * 0.3
  );
  opening.addColorStop(0, "#0c0906");
  opening.addColorStop(1, "#241c14");
  ctx.fillStyle = opening;
  ctx.beginPath();
  ctx.ellipse(x + size * 0.5, y + size * 0.64, size * 0.24, size * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(220, 190, 120, 0.55)";
  ctx.beginPath();
  ctx.arc(x + size * 0.44, y + size * 0.62, size * 0.018, 0, Math.PI * 2);
  ctx.arc(x + size * 0.56, y + size * 0.7, size * 0.014, 0, Math.PI * 2);
  ctx.fill();
}

function tekenBoerderij(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, seed: number): void {
  const rng = maakSeededRandom(seed);
  const baseY = y + size * 0.86;
  tekenContactschaduw(ctx, x + size * 0.5, baseY, size * 0.74);

  ctx.strokeStyle = "#6b5222";
  ctx.lineWidth = Math.max(1.2, size * 0.035);
  for (let rij = 0; rij < 4; rij++) {
    const ry = y + size * (0.42 + rij * 0.11);
    ctx.beginPath();
    ctx.moveTo(x + size * 0.12, ry);
    ctx.lineTo(x + size * 0.88, ry - size * 0.03);
    ctx.stroke();
  }

  for (let i = 0; i < 10; i++) {
    const gx = x + size * (0.16 + rng() * 0.68);
    const gy = y + size * (0.4 + rng() * 0.42);
    ctx.fillStyle = "#c9a84a";
    ctx.beginPath();
    ctx.ellipse(gx, gy, size * 0.02, size * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function tekenHeiligdom(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const baseY = y + size * 0.86;
  tekenContactschaduw(ctx, x + size * 0.5, baseY, size * 0.42);

  const gloed = ctx.createRadialGradient(
    x + size * 0.5, y + size * 0.55, 0,
    x + size * 0.5, y + size * 0.55, size * 0.45
  );
  gloed.addColorStop(0, "rgba(170, 90, 170, 0.35)");
  gloed.addColorStop(1, "rgba(170, 90, 170, 0)");
  ctx.fillStyle = gloed;
  ctx.beginPath();
  ctx.arc(x + size * 0.5, y + size * 0.55, size * 0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#79747a";
  ctx.beginPath();
  ctx.moveTo(x + size * 0.4, baseY);
  ctx.lineTo(x + size * 0.36, y + size * 0.3);
  ctx.lineTo(x + size * 0.5, y + size * 0.16);
  ctx.lineTo(x + size * 0.64, y + size * 0.32);
  ctx.lineTo(x + size * 0.6, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#4c474e";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.strokeStyle = "rgba(154, 74, 138, 0.85)";
  ctx.lineWidth = Math.max(1, size * 0.02);
  ctx.beginPath();
  ctx.arc(x + size * 0.5, y + size * 0.42, size * 0.07, 0, Math.PI * 2);
  ctx.moveTo(x + size * 0.5, y + size * 0.49);
  ctx.lineTo(x + size * 0.5, y + size * 0.66);
  ctx.stroke();
}

function tekenWachttoren(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const baseY = y + size * 0.86;
  tekenContactschaduw(ctx, x + size * 0.5, baseY, size * 0.5);

  ctx.strokeStyle = "#5a4326";
  ctx.lineWidth = Math.max(1.5, size * 0.045);
  ctx.beginPath();
  ctx.moveTo(x + size * 0.36, baseY);
  ctx.lineTo(x + size * 0.44, y + size * 0.24);
  ctx.moveTo(x + size * 0.64, baseY);
  ctx.lineTo(x + size * 0.56, y + size * 0.24);
  ctx.moveTo(x + size * 0.4, y + size * 0.62);
  ctx.lineTo(x + size * 0.6, y + size * 0.5);
  ctx.stroke();

  ctx.fillStyle = "#6b5230";
  ctx.fillRect(x + size * 0.34, y + size * 0.16, size * 0.32, size * 0.1);
  ctx.strokeStyle = "#3a2c18";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + size * 0.34, y + size * 0.16, size * 0.32, size * 0.1);

  ctx.fillStyle = "#a94a3a";
  ctx.beginPath();
  ctx.moveTo(x + size * 0.5, y + size * 0.02);
  ctx.lineTo(x + size * 0.5, y + size * 0.16);
  ctx.lineTo(x + size * 0.62, y + size * 0.09);
  ctx.closePath();
  ctx.fill();
}

const LAND_IMPROVEMENT_TEKENAARS: Record<
  string,
  (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, seed: number) => void
> = {
  houtkap: tekenHoutkap,
  steengroeve: tekenSteengroeve,
  mijn: (ctx, x, y, size) => tekenMijn(ctx, x, y, size),
  boerderij: tekenBoerderij,
  heiligdom: (ctx, x, y, size) => tekenHeiligdom(ctx, x, y, size),
  wachttoren: (ctx, x, y, size) => tekenWachttoren(ctx, x, y, size),
};

function tekenLandImprovement(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  id: string,
  seed: number
): void {
  const tekenaar = LAND_IMPROVEMENT_TEKENAARS[id];
  if (tekenaar) {
    tekenaar(ctx, x, y, size, seed);
    return;
  }
  // Onbekend/toekomstig improvement-type: neutrale plek-houder zodat nieuwe
  // improvements nooit onzichtbaar blijven.
  ctx.fillStyle = "#8a8a4a";
  const padding = size * 0.28;
  ctx.fillRect(x + padding, y + padding, size - padding * 2, size - padding * 2);
}

// --- Stad, ghost town, fog en statusiconen -------------------------------

function tekenTent(ctx: CanvasRenderingContext2D, cx: number, baseY: number, h: number, kleur: string): void {
  ctx.fillStyle = kleur;
  ctx.beginPath();
  ctx.moveTo(cx, baseY - h);
  ctx.lineTo(cx + h * 0.42, baseY);
  ctx.lineTo(cx - h * 0.42, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(20, 12, 6, 0.35)";
  ctx.beginPath();
  ctx.moveTo(cx, baseY - h);
  ctx.lineTo(cx + h * 0.42, baseY);
  ctx.lineTo(cx + h * 0.1, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#2a1c10";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, baseY - h);
  ctx.lineTo(cx, baseY);
  ctx.stroke();
}

function tekenKampvuur(ctx: CanvasRenderingContext2D, cx: number, baseY: number, r: number): void {
  const gloed = ctx.createRadialGradient(cx, baseY - r * 0.3, 0, cx, baseY - r * 0.3, r * 3.2);
  gloed.addColorStop(0, "rgba(255, 170, 70, 0.45)");
  gloed.addColorStop(1, "rgba(255, 170, 70, 0)");
  ctx.fillStyle = gloed;
  ctx.beginPath();
  ctx.arc(cx, baseY - r * 0.3, r * 3.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e07a2a";
  ctx.beginPath();
  ctx.moveTo(cx, baseY - r * 1.6);
  ctx.quadraticCurveTo(cx + r * 0.7, baseY - r * 0.6, cx, baseY);
  ctx.quadraticCurveTo(cx - r * 0.7, baseY - r * 0.6, cx, baseY - r * 1.6);
  ctx.fill();
  ctx.fillStyle = "#f7d34a";
  ctx.beginPath();
  ctx.moveTo(cx, baseY - r * 0.9);
  ctx.quadraticCurveTo(cx + r * 0.32, baseY - r * 0.4, cx, baseY - r * 0.05);
  ctx.quadraticCurveTo(cx - r * 0.32, baseY - r * 0.4, cx, baseY - r * 0.9);
  ctx.fill();
}

function tekenStadTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  grootte: City["grootte"]
): void {
  const baseY = y + size * 0.86;
  tekenContactschaduw(ctx, x + size * 0.5, baseY, size * 0.8);

  if (grootte === "klein") {
    tekenTent(ctx, x + size * 0.34, baseY, size * 0.36, "#b8895a");
    tekenTent(ctx, x + size * 0.63, baseY, size * 0.3, "#a9784c");
    tekenKampvuur(ctx, x + size * 0.5, baseY, size * 0.05);
  } else {
    // "middel" (en toekomstig "groot" totdat verdere groei-tiers bestaan,
    // hoofdstuk 13: MVP-scope stopt bij de klein→middel-stap): drukker kamp,
    // meer tenten en een grotere gloed.
    tekenTent(ctx, x + size * 0.22, baseY, size * 0.32, "#b8895a");
    tekenTent(ctx, x + size * 0.42, baseY, size * 0.42, "#c99a68");
    tekenTent(ctx, x + size * 0.68, baseY, size * 0.36, "#a9784c");
    tekenTent(ctx, x + size * 0.82, baseY, size * 0.24, "#96693e");
    tekenKampvuur(ctx, x + size * 0.55, baseY, size * 0.065);

    ctx.strokeStyle = "rgba(140, 110, 60, 0.5)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x + size * (0.16 + i * 0.03), baseY - size * 0.02);
      ctx.lineTo(x + size * (0.16 + i * 0.03), baseY - size * 0.12);
      ctx.stroke();
    }
  }
}

function tekenGhostTown(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, seed: number): void {
  const rng = maakSeededRandom(seed);
  const baseY = y + size * 0.86;

  ctx.fillStyle = "rgba(20, 18, 15, 0.55)";
  ctx.fillRect(x, y, size, size);

  ctx.strokeStyle = "#4a453e";
  ctx.lineWidth = Math.max(1, size * 0.03);
  ctx.beginPath();
  ctx.moveTo(x + size * 0.32, baseY);
  ctx.lineTo(x + size * 0.4, y + size * 0.5);
  ctx.moveTo(x + size * 0.68, baseY);
  ctx.lineTo(x + size * 0.58, y + size * 0.56);
  ctx.moveTo(x + size * 0.3, y + size * 0.62);
  ctx.lineTo(x + size * 0.5, y + size * 0.5);
  ctx.stroke();

  for (let i = 0; i < 3; i++) {
    const ex = x + size * (0.3 + rng() * 0.4);
    const ey = baseY - rng() * size * 0.05;
    ctx.fillStyle = `rgba(214, 110, 60, ${0.12 + rng() * 0.1})`;
    ctx.beginPath();
    ctx.arc(ex, ey, size * 0.012, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Waarschuwingsdriehoek voor de "kritiek"-verval-status (M6, hoofdstuk 4/13).
// Als eigen vector-icoon getekend (niet via een tekst-glyph als ⚠, die er per
// platform/lettertype anders uitziet) zodat het consistent oogt.
function tekenVervalIndicator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
): void {
  const cx = x + size * 0.5;
  const topY = y + size * 0.03;
  const b = size * 0.22;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = size * 0.06;
  ctx.fillStyle = "#e0684a";
  ctx.beginPath();
  ctx.moveTo(cx, topY);
  ctx.lineTo(cx + b, topY + b * 1.7);
  ctx.lineTo(cx - b, topY + b * 1.7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "#2a1008";
  ctx.lineWidth = Math.max(1, size * 0.015);
  ctx.stroke();

  ctx.fillStyle = "#2a1008";
  ctx.fillRect(cx - b * 0.09, topY + b * 0.5, b * 0.18, b * 0.75);
  ctx.beginPath();
  ctx.arc(cx, topY + b * 1.42, b * 0.11, 0, Math.PI * 2);
  ctx.fill();
}

// Zachte, wervelende mist voor onontdekte lagen (fog of war) — donker en
// stil, met een vleugje sterrenlicht voor het "verwondering"-gevoel uit
// hoofdstuk 12, in plaats van een harde diagonale arcering.
function tekenFogTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  seed: number
): void {
  const verloop = ctx.createLinearGradient(x, y, x, y + size);
  verloop.addColorStop(0, "#171310");
  verloop.addColorStop(1, "#0a0806");
  ctx.fillStyle = verloop;
  ctx.fillRect(x, y, size, size);

  const rng = maakSeededRandom(seed);
  for (let i = 0; i < 3; i++) {
    const mx = x + rng() * size;
    const my = y + size * (0.3 + rng() * 0.5);
    const mr = size * (0.28 + rng() * 0.25);
    const mist = ctx.createRadialGradient(mx, my, 0, mx, my, mr);
    mist.addColorStop(0, "rgba(120, 130, 140, 0.14)");
    mist.addColorStop(1, "rgba(120, 130, 140, 0)");
    ctx.fillStyle = mist;
    ctx.beginPath();
    ctx.ellipse(mx, my, mr, mr * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 4; i++) {
    const sx = x + rng() * size;
    const sy = y + rng() * size * 0.6;
    ctx.fillStyle = `rgba(230, 220, 200, ${0.08 + rng() * 0.1})`;
    ctx.beginPath();
    ctx.arc(sx, sy, size * 0.007, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Vooruitkijk-tile (hoofdstuk 2, M8-laag 8: "vooruitkijk-bereik"): terrein
// waarneembaar door een sluier heen, met een spiegelglas-icoon in plaats van
// een letterlijk "?"-teken.
function tekenVooruitkijkTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  terreinType: string
): void {
  ctx.fillStyle = terreinBasisKleur(terreinType);
  ctx.globalAlpha = 0.3;
  ctx.fillRect(x, y, size, size);
  ctx.globalAlpha = 1;

  ctx.fillStyle = "rgba(12, 10, 8, 0.4)";
  ctx.fillRect(x, y, size, size);

  const cx = x + size * 0.5;
  const cy = y + size * 0.46;
  const r = size * 0.16;
  ctx.strokeStyle = "rgba(232, 220, 200, 0.65)";
  ctx.lineWidth = Math.max(1.5, size * 0.035);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.72, cy + r * 0.72);
  ctx.lineTo(cx + r * 1.4, cy + r * 1.4);
  ctx.stroke();
}

function tekenBouwSteiger(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.strokeStyle = "rgba(201, 184, 150, 0.55)";
  ctx.lineWidth = 1;
  for (let i = 0; i < size; i += 8) {
    ctx.beginPath();
    ctx.moveTo(x + i, y + size);
    ctx.lineTo(x + i + size, y);
    ctx.stroke();
  }
}

function tekenTileGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
): void {
  ctx.strokeStyle = "rgba(201, 184, 150, 0.12)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
}

function tekenActieveTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  tile: Tile,
  terreinType: string,
  stad: City,
  col: number,
  hoogte: number
): void {
  const seed = tileSeed(col, hoogte);
  tekenTerreinOndergrond(ctx, x, y, size, terreinType, seed);

  if (tile.status === "ghost_town") {
    tekenGhostTown(ctx, x, y, size, seed);
    return;
  }

  if (tile.improvement?.soort === "city") {
    tekenStadTile(ctx, x, y, size, stad.grootte);
    if (stad.vervalStatus === "kritiek") {
      tekenVervalIndicator(ctx, x, y, size);
    }
    return;
  }

  if (tile.status === "actief" && tile.improvement?.soort === "land") {
    tekenLandImprovement(ctx, x, y, size, tile.improvement.id, seed);

    if (tile.beurtenTotUitputting !== undefined) {
      ctx.fillStyle = "rgba(20, 16, 10, 0.7)";
      const badgeW = size * 0.32;
      const badgeH = size * 0.2;
      ctx.fillRect(x + size - badgeW - 3, y + size - badgeH - 3, badgeW, badgeH);
      ctx.fillStyle = "#e8dcc8";
      ctx.font = `${Math.floor(size * 0.2)}px sans-serif`;
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText(String(tile.beurtenTotUitputting), x + size - 6, y + size - 5);
    }
    return;
  }

  if (tile.status === "in_aanbouw") {
    tekenBouwSteiger(ctx, x, y, size);
  }
}

// Tekent alle lagen (band van 9 vakjes breed), laag 1 onderaan het canvas,
// oplopend naar boven — zie hoofdstuk 2 ("omhoog bouwen").
export function tekenWereld(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  lagen: Layer[],
  stad: City
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
        tekenFogTile(ctx, x, y, tileSize, tileSeed(col, laag.hoogte));
      } else if (!laag.ontgrendeld && vooruitkijk) {
        tekenVooruitkijkTile(ctx, x, y, tileSize, laag.terreinType);
      } else {
        tekenActieveTile(ctx, x, y, tileSize, laag.tiles[col], laag.terreinType, stad, col, laag.hoogte);
      }

      tekenTileGrid(ctx, x, y, tileSize);
    }
  }
}
