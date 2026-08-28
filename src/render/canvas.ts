// Canvas-rendering van de tegel-band (M1: grid & streek-rendering).
// Losse tegel-tekeningen per improvement, geen naadloos geschilderd tafereel —
// zie frontier-city-design-doc.md hoofdstuk 12 (visuele stijl). De MVP-stijl
// volgt de Riven/Myst-referentie uit hoofdstuk 13: stil, schilderachtig,
// warm/aards licht. In plaats van losse afbeeldingsbestanden (die dit project
// zou moeten meenemen zonder de herkomst/licentie te kunnen verifiëren) worden
// de tegels hier als handgetekende vector-art opgebouwd — dezelfde
// canvas-renderpijplijn, maar met gelaagde, geschilderde texturen in plaats
// van platte kleurvlakken.

import { isWachttorenBemand } from "@/game/indringersEnDieren";
import { isBebouwbaarLeeg } from "@/game/improvements";
import { onrustOpStreek } from "@/game/onrust";
import { City, Streek, Settler, TerreinType, Tile } from "@/game/types";
import { isTileVerbondenMetStad, wegVerbindingen, WegVerbindingen } from "@/game/wegen";
import {
  BAND_WIDTH_TILES,
  eindeOceaanZichtbaar,
  isVooruitkijkStreek,
  startOceaanZichtbaar,
} from "@/game/world";

export { BAND_WIDTH_TILES };

// --- Kleur-hulpfuncties -----------------------------------------------

export function hexNaarRgb(hex: string): [number, number, number] {
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

export function rgbNaarCss([r, g, b]: [number, number, number], alpha = 1): string {
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Verlicht (percentage > 0) of verdonkert (percentage < 0) een hex-kleur.
// Gebruikt om uit één basiskleur per terreintype een schilderachtig
// licht/donker-verloop te halen zonder elke tint met de hand vast te leggen.
export function tint(hex: string, percentage: number): [number, number, number] {
  const [r, g, b] = hexNaarRgb(hex);
  const doel = percentage > 0 ? 255 : 0;
  const p = Math.abs(percentage);
  return [r + (doel - r) * p, g + (doel - g) * p, b + (doel - b) * p];
}

// Deterministische pseudo-random per tile-positie (col, hoogte) zodat
// schilderachtige textuurdetails stabiel blijven tussen re-renders — een
// echte Math.random() zou bij elke state-update (nieuwe beurt, bouwactie)
// opnieuw schudden en de tegel laten "flikkeren".
export function maakSeededRandom(seed: number): () => number {
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
  oceaanoever: "#8c9468",
  // Going West, streek 1 t/m `WAMPANOAG_STREEK_HOOGTE` (worldGoingWest.ts):
  // het kustnabije Wampanoag-thuisland (hoofdstuk 9 design-doc) — issue
  // "Groene waas niet goed": deze zes streeknamen kregen eerder geen eigen
  // basiskleur (vielen terug op de bruine default hieronder) en werden i.p.v.
  // daarvan achteraf met een groene multiply-overlay over het hele canvas
  // "vergroend" (`pasTegelSetTint`, voorheen `tegelSets.ts`) — dat kleurde ook
  // wegen/gebouwen/settlers mee en gaf zo een waas i.p.v. groenere tegels. Nu
  // gewoon echte, groene tegelkleuren per terreinnaam, net als de tutorial-
  // groene paletten (bosrand/loofbos/naaldwoud) hierboven.
  kreekmonding: "#5a6b45",
  zoutmoeras: "#5e6a48",
  cederswamp: "#3f4f36",
  eikenbos: "#4c5c34",
  "beboste heuvelrug": "#556b3a",
  maisakker: "#748b42",
};

export function terreinBasisKleur(terreinType: string): string {
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

// --- Wegen & settler (M10, hoofdstuk 16) --------------------------------

// Door de settler aangelegde weg: een verweerd karrenspoor, getekend vóór het
// eventuele improvement-icoon op hetzelfde vakje (zie tekenActieveTile) zodat
// een weg en een improvement samen op één vakje kunnen staan.
//
// Issue: "kruispunten en driesprongen zien als er een weg verticaal omhoog
// loopt vanaf een horizontale weg" — in plaats van altijd hetzelfde vaste
// links-rechts spoor te tekenen, lopen er nu losse sporen vanuit een
// gezamenlijk knooppunt (`hub`, vlak boven de vroegere vaste hoogte) naar elke
// buur die zelf ook een weg heeft (`verbindingen`, zie game/wegen.ts). Eén
// spoor (alleen links of alleen rechts) oogt daardoor bijna hetzelfde als de
// oude vaste curve; twee of meer sporen die niet tegenover elkaar liggen vormen
// zichtbaar een T-splitsing of kruispunt.
function tekenWeg(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  seed: number,
  verbindingen: WegVerbindingen
): void {
  const rng = maakSeededRandom(seed);
  const hubX = x + size * 0.5;
  const hubY = y + size * 0.8;
  const golf = () => (rng() - 0.5) * size * 0.08;

  const sporen: { naar: [number, number]; controle: [number, number] }[] = [];
  if (verbindingen.links) {
    sporen.push({
      naar: [x + size * 0.04, y + size * 0.82 + golf()],
      controle: [x + size * 0.25, hubY + golf()],
    });
  }
  if (verbindingen.rechts) {
    sporen.push({
      naar: [x + size * 0.96, y + size * 0.82 + golf()],
      controle: [x + size * 0.75, hubY + golf()],
    });
  }
  if (verbindingen.omhoog) {
    sporen.push({
      naar: [x + size * 0.5 + golf(), y],
      controle: [hubX + golf(), y + size * 0.4],
    });
  }
  if (verbindingen.omlaag) {
    sporen.push({
      naar: [x + size * 0.5 + golf(), y + size],
      controle: [hubX + golf(), y + size * 0.92],
    });
  }

  ctx.save();
  ctx.lineCap = "round";

  if (sporen.length === 0) {
    // Nog geen buur met een eigen weg (bv. een net aangelegd stukje verderop
    // in het netwerk): een klein rustend spoorplekje i.p.v. een spoor het
    // niets in te laten lopen.
    ctx.fillStyle = "rgba(196, 168, 120, 0.5)";
    ctx.beginPath();
    ctx.arc(hubX, hubY, size * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.strokeStyle = "rgba(196, 168, 120, 0.55)";
  ctx.lineWidth = Math.max(2, size * 0.14);
  for (const spoor of sporen) {
    ctx.beginPath();
    ctx.moveTo(hubX, hubY);
    ctx.quadraticCurveTo(spoor.controle[0], spoor.controle[1], spoor.naar[0], spoor.naar[1]);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(90, 68, 40, 0.5)";
  ctx.lineWidth = Math.max(1, size * 0.02);
  for (const spoor of sporen) {
    ctx.beginPath();
    ctx.moveTo(hubX, hubY);
    ctx.quadraticCurveTo(spoor.controle[0], spoor.controle[1], spoor.naar[0], spoor.naar[1]);
    ctx.stroke();
  }

  // Bij een kruispunt/driesprong (3 of 4 sporen) een vertrapt plekje in het
  // midden, zodat de aansluiting niet als los van elkaar staande lijnen oogt.
  if (sporen.length >= 3) {
    ctx.fillStyle = "rgba(120, 98, 62, 0.4)";
    ctx.beginPath();
    ctx.arc(hubX, hubY, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// Badge voor een actief, maar (nog) niet met de stad verbonden land
// improvement (hoofdstuk 16: "levert nog niks op") — een gedempte waas plus
// een "geen doorgang"-icoontje linksboven, los van de uitputtingsteller
// rechtsonder (tekenActieveTile) zodat de twee elkaar nooit overlappen.
function tekenNietVerbondenIndicator(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.save();
  ctx.fillStyle = "rgba(16, 14, 12, 0.38)";
  ctx.fillRect(x, y, size, size);

  const cx = x + size * 0.18;
  const cy = y + size * 0.18;
  const r = size * 0.09;
  ctx.strokeStyle = "#e8dcc8";
  ctx.lineWidth = Math.max(1.2, size * 0.025);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.moveTo(cx - r * 0.85, cy - r * 0.85);
  ctx.lineTo(cx + r * 0.85, cy + r * 0.85);
  ctx.stroke();
  ctx.restore();
}

// Onrust-indicator (issue: "Onrust indicator" — "Op iedere improvement wil ik
// graag een onrust indicator ... een klein rood pijltje in de hoek"): een
// klein, omhoogwijzend rood pijltje rechtsboven op elk actief land improvement
// van een streek met onrust > 0 (onrust.ts: `onrustOpStreek`). Eigen hoek, los
// van de niet-verbonden-waas (linksboven) en de uitputtingsteller
// (rechtsonder) hierboven/hieronder, zodat de drie badges nooit overlappen.
function tekenOnrustIndicator(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.save();
  const cx = x + size * 0.84;
  const cy = y + size * 0.18;
  const r = size * 0.13;

  ctx.fillStyle = "#c93a2e";
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r * 0.62, cy);
  ctx.lineTo(cx + r * 0.24, cy);
  ctx.lineTo(cx + r * 0.24, cy + r * 0.75);
  ctx.lineTo(cx - r * 0.24, cy + r * 0.75);
  ctx.lineTo(cx - r * 0.24, cy);
  ctx.lineTo(cx - r * 0.62, cy);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(20, 8, 6, 0.7)";
  ctx.lineWidth = Math.max(0.8, size * 0.015);
  ctx.stroke();
  ctx.restore();
}

// Lopend oer-poppetje (issue: "Andere skin oer settler") — de tutorial-
// settler (Het Hertenpad-volk) is thematisch vóór het wiel, dus een huifkar
// past daar niet: in plaats daarvan een lopend mensfiguurtje met een
// reisbindel over de schouder. `variant` geeft dezelfde koelere, blauwige
// kledingtint aan de tweede settler als de huifkar hieronder deed (issue:
// "Altijd 2e settler" #236), zodat de twee op de kaart uit elkaar te houden
// blijven.
function tekenOerPoppetje(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  variant: "primair" | "tweede" = "primair"
): void {
  const baseY = y + size * 0.86;
  tekenContactschaduw(ctx, x + size * 0.5, baseY, size * 0.34);

  const huidKleur = "#c19a6b";
  const kledingKleur = variant === "primair" ? "#6b4a2c" : "#2c4a6b";
  const kledingSchaduw = variant === "primair" ? "#4a3018" : "#1c2e3a";
  const haarKleur = variant === "primair" ? "#2a1c10" : "#1a222a";
  const cx = x + size * 0.5;

  // Benen — lopende pas: één been vooruit, één naar achteren.
  ctx.strokeStyle = huidKleur;
  ctx.lineWidth = Math.max(2, size * 0.05);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.04, baseY - size * 0.3);
  ctx.lineTo(cx - size * 0.16, baseY);
  ctx.moveTo(cx + size * 0.05, baseY - size * 0.3);
  ctx.lineTo(cx + size * 0.13, baseY - size * 0.05);
  ctx.stroke();

  // Tuniek/omslagdoek — smal bij het middel, breder bij de schouders.
  ctx.fillStyle = kledingKleur;
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.14, baseY - size * 0.28);
  ctx.lineTo(cx + size * 0.14, baseY - size * 0.28);
  ctx.lineTo(cx + size * 0.1, baseY - size * 0.56);
  ctx.lineTo(cx - size * 0.1, baseY - size * 0.56);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = kledingSchaduw;
  ctx.lineWidth = Math.max(1, size * 0.02);
  ctx.stroke();

  // Armen.
  ctx.strokeStyle = huidKleur;
  ctx.lineWidth = Math.max(1.6, size * 0.04);
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.1, baseY - size * 0.5);
  ctx.lineTo(cx - size * 0.2, baseY - size * 0.34);
  ctx.moveTo(cx + size * 0.1, baseY - size * 0.5);
  ctx.lineTo(cx + size * 0.18, baseY - size * 0.4);
  ctx.stroke();

  // Reisbindel aan een stok over de schouder — teken van een trekkende settler.
  ctx.strokeStyle = kledingSchaduw;
  ctx.lineWidth = Math.max(1, size * 0.02);
  ctx.beginPath();
  ctx.moveTo(cx + size * 0.16, baseY - size * 0.66);
  ctx.lineTo(cx + size * 0.24, baseY - size * 0.38);
  ctx.stroke();
  ctx.fillStyle = kledingKleur;
  ctx.beginPath();
  ctx.arc(cx + size * 0.24, baseY - size * 0.42, size * 0.055, 0, Math.PI * 2);
  ctx.fill();

  // Hoofd.
  ctx.fillStyle = huidKleur;
  ctx.beginPath();
  ctx.arc(cx, baseY - size * 0.63, size * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = haarKleur;
  ctx.beginPath();
  ctx.arc(cx, baseY - size * 0.66, size * 0.09, Math.PI, 0);
  ctx.fill();
}

// De settler-eenheid (hoofdstuk 16): een huifkar, in lijn met de
// MVP-plaatshouderstijl (hoofdstuk 13: "grove/simpele placeholders zijn
// prima") — geen los afbeeldingsbestand, zelfde vector-aanpak als de rest van
// deze tekenpijplijn.
//
// Tweede settler (issue: "Altijd 2e settler" #236): `variant` geeft de
// tweede settler een koelere, blauwige huifkar-kleur zodat de twee op de
// kaart uit elkaar te houden zijn — verder identieke vorm/placeholder-stijl.
//
// `tegelSet` (M20d, `CampaignConfig.tegelSet`): `undefined` betekent de
// tutorial (Het Hertenpad-volk, vóór het wiel) — daar tekenen we in plaats
// van de huifkar het lopende oer-poppetje hierboven (issue: "Andere skin oer
// settler"). Elke campagne mét een `tegelSet` (vooralsnog alleen Going West)
// behoudt de huifkar.
export function tekenSettler(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  variant: "primair" | "tweede" = "primair",
  tegelSet?: string
): void {
  if (tegelSet === undefined) {
    tekenOerPoppetje(ctx, x, y, size, variant);
    return;
  }

  const baseY = y + size * 0.86;
  tekenContactschaduw(ctx, x + size * 0.5, baseY, size * 0.6);

  const wielKleur = variant === "primair" ? "#3a2a18" : "#1c2e3a";
  const naafKleur = variant === "primair" ? "#8a6a3a" : "#4a7a8a";
  const bakKleur = variant === "primair" ? "#6b4a2c" : "#2c4a6b";

  ctx.fillStyle = wielKleur;
  ctx.beginPath();
  ctx.arc(x + size * 0.35, baseY - size * 0.05, size * 0.09, 0, Math.PI * 2);
  ctx.arc(x + size * 0.65, baseY - size * 0.05, size * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = naafKleur;
  ctx.beginPath();
  ctx.arc(x + size * 0.35, baseY - size * 0.05, size * 0.03, 0, Math.PI * 2);
  ctx.arc(x + size * 0.65, baseY - size * 0.05, size * 0.03, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = bakKleur;
  ctx.fillRect(x + size * 0.27, baseY - size * 0.3, size * 0.46, size * 0.2);
  ctx.strokeStyle = wielKleur;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + size * 0.27, baseY - size * 0.3, size * 0.46, size * 0.2);

  ctx.fillStyle = "#e8dcc0";
  ctx.beginPath();
  ctx.moveTo(x + size * 0.22, baseY - size * 0.3);
  ctx.quadraticCurveTo(x + size * 0.5, baseY - size * 0.74, x + size * 0.78, baseY - size * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(90, 76, 50, 0.6)";
  ctx.lineWidth = Math.max(1, size * 0.02);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + size * 0.35, baseY - size * 0.3);
  ctx.quadraticCurveTo(x + size * 0.5, baseY - size * 0.6, x + size * 0.65, baseY - size * 0.3);
  ctx.stroke();
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

// Offer Altaar (hoofdstuk 6, issue: "De Bezette Streek, missionaris en
// verkenner", Deel 4) — een lage stenen altaar met een offervuur, bewust een
// andere silhouet/kleur dan het Heiligdom (rechtopstaande steen, paarse
// gloed) zodat de twee culturele improvements ook zonder tile-info-pop-up uit
// elkaar te houden zijn. Vaste, simpele vorm (hoofdstuk 13: placeholders
// mogen grof/simpel zijn).
function tekenOfferAltaar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const baseY = y + size * 0.86;
  tekenContactschaduw(ctx, x + size * 0.5, baseY, size * 0.56);

  ctx.fillStyle = "#6b6055";
  ctx.beginPath();
  ctx.moveTo(x + size * 0.24, baseY);
  ctx.lineTo(x + size * 0.3, baseY - size * 0.16);
  ctx.lineTo(x + size * 0.7, baseY - size * 0.16);
  ctx.lineTo(x + size * 0.76, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#3a342c";
  ctx.lineWidth = 1;
  ctx.stroke();

  tekenKampvuur(ctx, x + size * 0.5, baseY - size * 0.16, size * 0.09);
}

// Legerkamp (hoofdstuk 6, issue: "De Bezette Streek, missionaris en
// verkenner", Deel 5) — een kleine legertent, bewust anders dan de
// Wachttoren-toren en de stad-tenten (gedempt olijfgroen i.p.v. warm
// oker/bruin) zodat het meteen als "militair, maar geen toren" leesbaar is.
function tekenLegerkampIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const baseY = y + size * 0.86;
  tekenContactschaduw(ctx, x + size * 0.5, baseY, size * 0.6);
  tekenTent(ctx, x + size * 0.5, baseY, size * 0.4, "#5a6b46");

  ctx.strokeStyle = "rgba(40, 34, 24, 0.6)";
  ctx.lineWidth = Math.max(1, size * 0.02);
  ctx.beginPath();
  ctx.moveTo(x + size * 0.5, baseY);
  ctx.lineTo(x + size * 0.5, baseY - size * 0.4);
  ctx.stroke();
}

// Cosmetisch huisje van een Bezette Streek (Deel 1): geen economische functie,
// niet interactief — een klein, stil huisje, duidelijk kleiner en stiller
// (geen kampvuur-gloed) dan de stad-tenten, zodat het meteen als "decor"
// leesbaar is.
function tekenBezetteStreekHuisje(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const baseY = y + size * 0.86;
  tekenContactschaduw(ctx, x + size * 0.5, baseY, size * 0.4);
  tekenTent(ctx, x + size * 0.5, baseY, size * 0.32, "#8a7a68");
}

// Vijandelijke Wachttoren-/Heiligdom-varianten van een Bezette Streek
// (hoofdstuk 6, issue: "De Bezette Streek, missionaris en verkenner", Deel 1):
// hergebruikt de bestaande Wachttoren-/Heiligdom-tekenaars met een duidelijk
// andere kleurskin (een killere, dreigende rode/grijze palet i.p.v. het
// warme hout/paars van de eigen versies) — geen nieuwe game-logica, puur
// visueel onderscheid.
function tekenVijandelijkeWachttorenIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const baseY = y + size * 0.86;
  tekenContactschaduw(ctx, x + size * 0.5, baseY, size * 0.5);

  ctx.strokeStyle = "#3a2c2c";
  ctx.lineWidth = Math.max(1.5, size * 0.045);
  ctx.beginPath();
  ctx.moveTo(x + size * 0.36, baseY);
  ctx.lineTo(x + size * 0.44, y + size * 0.24);
  ctx.moveTo(x + size * 0.64, baseY);
  ctx.lineTo(x + size * 0.56, y + size * 0.24);
  ctx.moveTo(x + size * 0.4, y + size * 0.62);
  ctx.lineTo(x + size * 0.6, y + size * 0.5);
  ctx.stroke();

  ctx.fillStyle = "#4a3838";
  ctx.fillRect(x + size * 0.34, y + size * 0.16, size * 0.32, size * 0.1);
  ctx.strokeStyle = "#241818";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + size * 0.34, y + size * 0.16, size * 0.32, size * 0.1);

  ctx.fillStyle = "#a0242c";
  ctx.beginPath();
  ctx.moveTo(x + size * 0.5, y + size * 0.02);
  ctx.lineTo(x + size * 0.5, y + size * 0.16);
  ctx.lineTo(x + size * 0.62, y + size * 0.09);
  ctx.closePath();
  ctx.fill();
}

function tekenVijandelijkHeiligdomIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const baseY = y + size * 0.86;
  tekenContactschaduw(ctx, x + size * 0.5, baseY, size * 0.42);

  const gloed = ctx.createRadialGradient(
    x + size * 0.5, y + size * 0.55, 0,
    x + size * 0.5, y + size * 0.55, size * 0.45
  );
  gloed.addColorStop(0, "rgba(180, 40, 40, 0.35)");
  gloed.addColorStop(1, "rgba(180, 40, 40, 0)");
  ctx.fillStyle = gloed;
  ctx.beginPath();
  ctx.arc(x + size * 0.5, y + size * 0.55, size * 0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#5a4a4a";
  ctx.beginPath();
  ctx.moveTo(x + size * 0.4, baseY);
  ctx.lineTo(x + size * 0.36, y + size * 0.3);
  ctx.lineTo(x + size * 0.5, y + size * 0.16);
  ctx.lineTo(x + size * 0.64, y + size * 0.32);
  ctx.lineTo(x + size * 0.6, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#2c2020";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.strokeStyle = "rgba(200, 60, 60, 0.85)";
  ctx.lineWidth = Math.max(1, size * 0.02);
  ctx.beginPath();
  ctx.arc(x + size * 0.5, y + size * 0.42, size * 0.07, 0, Math.PI * 2);
  ctx.moveTo(x + size * 0.5, y + size * 0.49);
  ctx.lineTo(x + size * 0.5, y + size * 0.66);
  ctx.stroke();
}

// `bemand` (nieuwe Wachttoren-functie, hoofdstuk 6, issue: "ik wil ook in het
// wachttoren icoontje zien of er een soldaat in zit"): een gedempt grijze
// vlag voor een lege, dus inactieve, toren; een warme vlag + een klein
// strijder-silhouet op het platform zodra hij bemand (en dus actief) is.
function tekenWachttoren(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, bemand: boolean): void {
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

  ctx.fillStyle = bemand ? "#c9552f" : "#78716a";
  ctx.beginPath();
  ctx.moveTo(x + size * 0.5, y + size * 0.02);
  ctx.lineTo(x + size * 0.5, y + size * 0.16);
  ctx.lineTo(x + size * 0.62, y + size * 0.09);
  ctx.closePath();
  ctx.fill();

  if (bemand) {
    ctx.fillStyle = "#2a2016";
    ctx.beginPath();
    ctx.arc(x + size * 0.5, y + size * 0.11, size * 0.045, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + size * 0.47, y + size * 0.135, size * 0.06, size * 0.09);
  }
}

// Sterrencirkel (hoofdstuk 3/9, issue: "wegen en gebouwen verbeteren" — was
// een kale placeholder-vierkant): een kring van rechtopstaande stenen, in
// perspectief afgeplat, met een zachte nachtelijke gloed en een paar
// sterretjes erboven — verwijst zowel naar de naam als naar de
// wetenschap-productie (sterren en seizoenen bestuderen).
function tekenSterrencirkel(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, seed: number): void {
  const rng = maakSeededRandom(seed);
  const baseY = y + size * 0.86;
  const cx = x + size * 0.5;
  tekenContactschaduw(ctx, cx, baseY, size * 0.72);

  const gloed = ctx.createRadialGradient(cx, y + size * 0.32, 0, cx, y + size * 0.32, size * 0.4);
  gloed.addColorStop(0, "rgba(130, 150, 200, 0.28)");
  gloed.addColorStop(1, "rgba(130, 150, 200, 0)");
  ctx.fillStyle = gloed;
  ctx.beginPath();
  ctx.arc(cx, y + size * 0.32, size * 0.4, 0, Math.PI * 2);
  ctx.fill();

  const aantalStenen = 7;
  for (let i = 0; i < aantalStenen; i++) {
    const hoek = (i / aantalStenen) * Math.PI * 2;
    const sx = cx + Math.cos(hoek) * size * 0.36;
    const sy = baseY - size * 0.04 + Math.sin(hoek) * size * 0.09;
    const steenHoogte = size * (0.14 + rng() * 0.06);
    const breedte = size * 0.055;
    ctx.fillStyle = "#5c5850";
    ctx.fillRect(sx - breedte / 2, sy - steenHoogte, breedte, steenHoogte);
    ctx.fillStyle = "rgba(230, 222, 205, 0.18)";
    ctx.fillRect(sx - breedte / 2, sy - steenHoogte, breedte * 0.35, steenHoogte);
  }

  const sterPosities: [number, number][] = [
    [0.28, 0.1],
    [0.62, 0.06],
    [0.48, 0.2],
    [0.74, 0.22],
    [0.2, 0.24],
  ];
  for (const [sxr, syr] of sterPosities) {
    tekenSterretje(ctx, x + size * sxr, y + size * syr, size * (0.02 + rng() * 0.012));
  }
}

function tekenSterretje(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.strokeStyle = "rgba(232, 220, 200, 0.85)";
  ctx.lineWidth = Math.max(0.8, r * 0.5);
  ctx.beginPath();
  ctx.moveTo(x - r, y);
  ctx.lineTo(x + r, y);
  ctx.moveTo(x, y - r);
  ctx.lineTo(x, y + r);
  ctx.stroke();
}

// Amberader (hoofdstuk 3/14, interne id `goudmijn`, weergavenaam "Amberader")
// — issue: "wegen en gebouwen verbeteren" (was een kale placeholder-
// vierkant). Bewust een kleiner rotsblok dan de Steengroeve met een gloeiende
// amberader erdoorheen, zodat dit improvement ook zonder tile-info-popup te
// onderscheiden is van de gewone Mijn en Steengroeve.
function tekenAmberader(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, seed: number): void {
  const rng = maakSeededRandom(seed);
  const baseY = y + size * 0.86;
  const cx = x + size * 0.5;
  tekenContactschaduw(ctx, cx, baseY, size * 0.62);

  const punten: [number, number][] = [
    [0.16, 0],
    [0.3, -0.34],
    [0.56, -0.44],
    [0.82, -0.22],
    [0.9, 0],
    [0.1, 0],
  ];
  ctx.fillStyle = "#584d3f";
  ctx.beginPath();
  punten.forEach(([px, py], i) => {
    const gx = x + size * px;
    const gy = baseY + size * py;
    if (i === 0) ctx.moveTo(gx, gy);
    else ctx.lineTo(gx, gy);
  });
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#3a3227";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.strokeStyle = "rgba(216, 140, 40, 0.55)";
  ctx.lineWidth = Math.max(2, size * 0.05);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x + size * 0.22, baseY - size * 0.02);
  ctx.quadraticCurveTo(x + size * 0.5, baseY - size * 0.3, x + size * 0.78, baseY - size * 0.38);
  ctx.stroke();

  const brokken: [number, number][] = [
    [0.3, -0.06],
    [0.48, -0.18],
    [0.64, -0.28],
    [0.72, -0.34],
  ];
  for (const [bx, by] of brokken) {
    const gx = x + size * bx;
    const gy = baseY + size * by;
    const r = size * (0.05 + rng() * 0.02);
    const gloed = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
    gloed.addColorStop(0, "#f6c869");
    gloed.addColorStop(0.6, "#e8a23c");
    gloed.addColorStop(1, "rgba(180, 110, 30, 0.2)");
    ctx.fillStyle = gloed;
    ctx.beginPath();
    ctx.arc(gx, gy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Voorraadkuil (hoofdstuk 3/14, issue: "wegen en gebouwen verbeteren" — was
// een kale placeholder-vierkant): een ingegraven kuil met een cluster
// opgeslagen manden/kruiken die net boven de rand uitsteken.
function tekenVoorraadkuil(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, seed: number): void {
  const rng = maakSeededRandom(seed);
  const baseY = y + size * 0.86;
  const cx = x + size * 0.5;
  tekenContactschaduw(ctx, cx, baseY, size * 0.74);

  ctx.fillStyle = "#4a3d2c";
  ctx.beginPath();
  ctx.ellipse(cx, baseY - size * 0.02, size * 0.38, size * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  const put = ctx.createRadialGradient(
    cx, baseY - size * 0.02, size * 0.02,
    cx, baseY - size * 0.02, size * 0.32
  );
  put.addColorStop(0, "#120d08");
  put.addColorStop(1, "#2c2015");
  ctx.fillStyle = put;
  ctx.beginPath();
  ctx.ellipse(cx, baseY - size * 0.02, size * 0.3, size * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  const mandKleuren = ["#b98a4c", "#8a6a3a", "#c9a05a"];
  const mandPosities: [number, number][] = [
    [-0.16, 0],
    [0.02, -0.04],
    [0.2, 0.01],
  ];
  mandPosities.forEach(([mx, my], i) => {
    const gx = cx + size * mx + (rng() - 0.5) * size * 0.02;
    const topY = baseY - size * (0.22 + Math.abs(my) * 0.5);
    const breedte = size * 0.16;
    ctx.fillStyle = mandKleuren[i % mandKleuren.length];
    ctx.beginPath();
    ctx.moveTo(gx - breedte / 2, baseY - size * 0.04);
    ctx.lineTo(gx - breedte * 0.4, topY);
    ctx.lineTo(gx + breedte * 0.4, topY);
    ctx.lineTo(gx + breedte / 2, baseY - size * 0.04);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(60, 42, 22, 0.6)";
    ctx.lineWidth = 1;
    for (let band = 1; band <= 2; band++) {
      const by = topY + (baseY - size * 0.04 - topY) * (band / 3);
      ctx.beginPath();
      ctx.moveTo(gx - breedte * 0.42, by);
      ctx.lineTo(gx + breedte * 0.42, by);
      ctx.stroke();
    }
  });
}

// Wampanoag-vakjes (Going West, M21e/opdracht-wampanoag-opening.md §2/§5) —
// eigen iconografie i.p.v. de kale placeholder-vierkant die
// `tekenLandImprovement` hieronder toont voor onbekende improvement-id's,
// zelfde aanpak als de andere improvement-tekenaars hierboven. Bewust drie
// duidelijk verschillende silhouetten/kleuren, zonder tile-info-popup te
// onderscheiden: Maïsboerderij (rijen maïsstengels, i.p.v. de geploegde
// akker-rijen van de gewone Boerderij), Beverjachthut (lage blokhut met
// beverstaart/-vacht en een waterlijntje), Opperhoofdtent (grote, verder
// versierde tipi met vlaggenmast-veer — hergebruikt `tekenTent`, maar groter
// en met een ander palet dan de kleine Bezette-Streek-/Legerkamp-tenten).
function tekenMaisboerderij(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, seed: number): void {
  const rng = maakSeededRandom(seed);
  const baseY = y + size * 0.86;
  tekenContactschaduw(ctx, x + size * 0.5, baseY, size * 0.72);

  const rijen = 5;
  for (let i = 0; i < rijen; i++) {
    const sx = x + size * (0.14 + (i / (rijen - 1)) * 0.72);
    const h = size * (0.5 + rng() * 0.14);

    ctx.strokeStyle = "#3d5c2c";
    ctx.lineWidth = Math.max(1.4, size * 0.035);
    ctx.beginPath();
    ctx.moveTo(sx, baseY);
    ctx.lineTo(sx, baseY - h);
    ctx.stroke();

    ctx.strokeStyle = "#4f7a34";
    ctx.lineWidth = Math.max(1, size * 0.025);
    ctx.beginPath();
    ctx.moveTo(sx, baseY - h * 0.55);
    ctx.lineTo(sx + size * 0.1, baseY - h * 0.68);
    ctx.moveTo(sx, baseY - h * 0.4);
    ctx.lineTo(sx - size * 0.1, baseY - h * 0.52);
    ctx.stroke();

    ctx.fillStyle = "#e0b23c";
    ctx.beginPath();
    ctx.ellipse(sx + size * 0.03, baseY - h * 0.75, size * 0.035, size * 0.08, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function tekenBeverjachthut(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const baseY = y + size * 0.86;
  const cx = x + size * 0.42;
  tekenContactschaduw(ctx, x + size * 0.5, baseY, size * 0.62);

  ctx.fillStyle = "#5c4630";
  ctx.beginPath();
  ctx.moveTo(cx, baseY - size * 0.44);
  ctx.lineTo(cx + size * 0.3, baseY - size * 0.12);
  ctx.lineTo(cx - size * 0.3, baseY - size * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#6b5436";
  ctx.fillRect(cx - size * 0.28, baseY - size * 0.12, size * 0.56, size * 0.12);
  ctx.strokeStyle = "#3a2c1c";
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - size * 0.28, baseY - size * 0.12, size * 0.56, size * 0.12);

  // Beverstaart/-vacht die naast de hut te drogen hangt.
  ctx.fillStyle = "#4a3626";
  ctx.beginPath();
  ctx.ellipse(x + size * 0.78, baseY - size * 0.2, size * 0.08, size * 0.16, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(20, 12, 6, 0.4)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.strokeStyle = "rgba(120, 195, 220, 0.65)";
  ctx.lineWidth = Math.max(1, size * 0.02);
  ctx.beginPath();
  ctx.moveTo(x + size * 0.06, baseY + size * 0.03);
  ctx.quadraticCurveTo(x + size * 0.5, baseY + size * 0.08, x + size * 0.94, baseY + size * 0.03);
  ctx.stroke();
}

function tekenOpperhoofdtent(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const baseY = y + size * 0.86;
  const cx = x + size * 0.5;
  tekenContactschaduw(ctx, cx, baseY, size * 0.52);

  tekenTent(ctx, cx, baseY, size * 0.64, "#a0522d");

  ctx.strokeStyle = "#3a2416";
  ctx.lineWidth = Math.max(1, size * 0.02);
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.03, baseY - size * 0.62);
  ctx.lineTo(cx - size * 0.09, baseY - size * 0.76);
  ctx.moveTo(cx + size * 0.03, baseY - size * 0.62);
  ctx.lineTo(cx + size * 0.09, baseY - size * 0.76);
  ctx.stroke();

  ctx.strokeStyle = "rgba(230, 210, 160, 0.5)";
  ctx.lineWidth = Math.max(1, size * 0.03);
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.22, baseY - size * 0.18);
  ctx.lineTo(cx + size * 0.22, baseY - size * 0.18);
  ctx.stroke();

  ctx.fillStyle = "#e8dcc8";
  ctx.beginPath();
  ctx.ellipse(cx + size * 0.11, baseY - size * 0.7, size * 0.03, size * 0.09, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#8a2a2a";
  ctx.beginPath();
  ctx.ellipse(cx + size * 0.12, baseY - size * 0.75, size * 0.022, size * 0.032, 0.4, 0, Math.PI * 2);
  ctx.fill();
}

// Puur decoratief Wampanoag-tentje (issue "Wampanoag kamp uitbreiding"):
// kleiner dan de Opperhoofdtent, geen sier-details of kampvuur-gloed — zelfde
// stille "doet niets"-leesbaarheid als `tekenBezetteStreekHuisje` hierboven,
// met een eigen warme huidskleur zodat het toch als Wampanoag-kamp leesbaar
// blijft i.p.v. als "verlaten huisje".
function tekenWampanoagTentje(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const baseY = y + size * 0.86;
  tekenContactschaduw(ctx, x + size * 0.5, baseY, size * 0.4);
  tekenTent(ctx, x + size * 0.5, baseY, size * 0.48, "#9c6b42");
}

const LAND_IMPROVEMENT_TEKENAARS: Record<
  string,
  (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, seed: number, bemand: boolean) => void
> = {
  houtkap: tekenHoutkap,
  steengroeve: tekenSteengroeve,
  mijn: (ctx, x, y, size) => tekenMijn(ctx, x, y, size),
  boerderij: tekenBoerderij,
  heiligdom: (ctx, x, y, size) => tekenHeiligdom(ctx, x, y, size),
  wachttoren: (ctx, x, y, size, seed, bemand) => tekenWachttoren(ctx, x, y, size, bemand),
  "offer-altaar": (ctx, x, y, size) => tekenOfferAltaar(ctx, x, y, size),
  legerkamp: (ctx, x, y, size) => tekenLegerkampIcon(ctx, x, y, size),
  "vijandelijke-wachttoren": (ctx, x, y, size) => tekenVijandelijkeWachttorenIcon(ctx, x, y, size),
  "vijandelijk-heiligdom": (ctx, x, y, size) => tekenVijandelijkHeiligdomIcon(ctx, x, y, size),
  "bezette-streek-huisje": (ctx, x, y, size) => tekenBezetteStreekHuisje(ctx, x, y, size),
  sterrencirkel: (ctx, x, y, size, seed) => tekenSterrencirkel(ctx, x, y, size, seed),
  goudmijn: (ctx, x, y, size, seed) => tekenAmberader(ctx, x, y, size, seed),
  voorraadkuil: (ctx, x, y, size, seed) => tekenVoorraadkuil(ctx, x, y, size, seed),
  maisboerderij: (ctx, x, y, size, seed) => tekenMaisboerderij(ctx, x, y, size, seed),
  beverjachthut: (ctx, x, y, size) => tekenBeverjachthut(ctx, x, y, size),
  opperhoofdtent: (ctx, x, y, size) => tekenOpperhoofdtent(ctx, x, y, size),
  "wampanoag-tentje": (ctx, x, y, size) => tekenWampanoagTentje(ctx, x, y, size),
};

function tekenLandImprovement(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  id: string,
  seed: number,
  bemand: boolean
): void {
  const tekenaar = LAND_IMPROVEMENT_TEKENAARS[id];
  if (tekenaar) {
    tekenaar(ctx, x, y, size, seed, bemand);
    return;
  }
  // Onbekend/toekomstig improvement-type: neutrale plek-houder zodat nieuwe
  // improvements nooit onzichtbaar blijven.
  ctx.fillStyle = "#8a8a4a";
  const padding = size * 0.28;
  ctx.fillRect(x + padding, y + padding, size - padding * 2, size - padding * 2);
}

// --- Oceaan --------------------------------------------------------------

// Rij oceaan-tegels onder de onderste streek (hoofdstuk 2: "Onderste streek =
// startstad, begint aan een oceaan") — puur sfeer zodat meteen duidelijk is
// waar de reis begint, geen bebouwbare tiles. Zelfde geschilderde
// verloop+textuur-aanpak als `tekenTerreinOndergrond`, maar met een
// blauw/groen waterpalet en golflijnen in plaats van verfvlekken.
export const OCEAAN_BASIS = "#2e4a52";

export function tekenOceaanTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  seed: number
): void {
  const verloop = ctx.createLinearGradient(x, y, x, y + size);
  verloop.addColorStop(0, rgbNaarCss(tint(OCEAAN_BASIS, 0.18)));
  verloop.addColorStop(0.6, OCEAAN_BASIS);
  verloop.addColorStop(1, rgbNaarCss(tint(OCEAAN_BASIS, -0.3)));
  ctx.fillStyle = verloop;
  ctx.fillRect(x, y, size, size);

  const rng = maakSeededRandom(seed);
  ctx.strokeStyle = "rgba(220, 235, 235, 0.22)";
  ctx.lineWidth = Math.max(1, size * 0.025);
  for (let i = 0; i < 3; i++) {
    const wy = y + size * (0.25 + i * 0.24 + rng() * 0.06);
    ctx.beginPath();
    ctx.moveTo(x, wy);
    ctx.quadraticCurveTo(x + size * 0.5, wy + size * 0.05, x + size, wy);
    ctx.stroke();
  }

  const glinster = ctx.createRadialGradient(
    x + size * (0.3 + rng() * 0.4), y + size * (0.3 + rng() * 0.3), 0,
    x + size * (0.3 + rng() * 0.4), y + size * (0.3 + rng() * 0.3), size * 0.35
  );
  glinster.addColorStop(0, "rgba(230, 240, 235, 0.14)");
  glinster.addColorStop(1, "rgba(230, 240, 235, 0)");
  ctx.fillStyle = glinster;
  ctx.fillRect(x, y, size, size);
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

// Naam van de stad, vlak onder de stad-tegel (issue: "Stad naam tonen op de
// kaart"). Als losse overlay ná de hele tegel-band getekend (zie `tekenWereld`,
// net als de settler hieronder) i.p.v. binnen `tekenStadTile` zelf: de naam
// staat onder de tegel, en die ruimte behoort aan de tegel eronder (of de
// oceaan-rij) die pas later in de teken-volgorde aan de beurt komt — zonder
// overlay zou die latere tekening de naam meteen weer overschilderen.
export function tekenStadNaam(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  naam: string
): void {
  const cx = x + size * 0.5;
  const naamY = y + size + size * 0.05;
  const fontSize = Math.max(9, Math.floor(size * 0.16));

  ctx.save();
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  const breedte = ctx.measureText(naam).width;
  const paddingX = size * 0.08;
  const badgeH = fontSize * 1.5;
  ctx.fillStyle = "rgba(16, 13, 10, 0.62)";
  ctx.fillRect(cx - breedte / 2 - paddingX, naamY - size * 0.02, breedte + paddingX * 2, badgeH);

  ctx.fillStyle = "#f0e6d2";
  ctx.fillText(naam, cx, naamY);
  ctx.restore();
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

// Ruïne (hoofdstuk 6, issue: "De Bezette Streek, missionaris en verkenner",
// Deel 5: een eigen Wachttoren na een verloren Confrontatie) — zelfde
// rubble-silhouet als `tekenGhostTown` hierboven, maar met een warme
// rust-/asgloed in plaats van het koude grijs, zodat het visueel leesbaar is
// als "beschadigd, herbouwbaar" in plaats van "voor altijd verlaten".
function tekenRuine(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, seed: number): void {
  const rng = maakSeededRandom(seed);
  const baseY = y + size * 0.86;

  ctx.fillStyle = "rgba(40, 20, 14, 0.5)";
  ctx.fillRect(x, y, size, size);

  ctx.strokeStyle = "#5a3c2c";
  ctx.lineWidth = Math.max(1, size * 0.03);
  ctx.beginPath();
  ctx.moveTo(x + size * 0.34, baseY);
  ctx.lineTo(x + size * 0.42, y + size * 0.48);
  ctx.moveTo(x + size * 0.66, baseY);
  ctx.lineTo(x + size * 0.56, y + size * 0.54);
  ctx.stroke();

  for (let i = 0; i < 4; i++) {
    const ex = x + size * (0.28 + rng() * 0.44);
    const ey = baseY - rng() * size * 0.08;
    ctx.fillStyle = `rgba(224, 120, 60, ${0.2 + rng() * 0.15})`;
    ctx.beginPath();
    ctx.arc(ex, ey, size * 0.014, 0, Math.PI * 2);
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

// Zachte, wervelende mist voor onontdekte streken (fog of war) — donker en
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

// Verhuld vakje van een Bezette Streek (hoofdstuk 6, issue: "De Bezette Streek,
// missionaris en verkenner", Deel 1) — een eigen, per-tegel verhullingslaag,
// los van de gewone streek-brede fog-of-war hierboven (`tekenFogTile`). Zelfde
// opbouw (donkere ondergrond + wervelende mist), maar met een dreigende
// rossige gloed in plaats van het neutrale koud-grijze sterrenlicht, zodat
// een speler het verschil ook zonder tekst herkent: dit is geen "nog niet
// bereikt", maar "bezet, nog niet verkend".
function tekenVerhuldeTile(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, seed: number): void {
  const verloop = ctx.createLinearGradient(x, y, x, y + size);
  verloop.addColorStop(0, "#1f120e");
  verloop.addColorStop(1, "#0d0705");
  ctx.fillStyle = verloop;
  ctx.fillRect(x, y, size, size);

  const rng = maakSeededRandom(seed);
  for (let i = 0; i < 3; i++) {
    const mx = x + rng() * size;
    const my = y + size * (0.3 + rng() * 0.5);
    const mr = size * (0.28 + rng() * 0.25);
    const mist = ctx.createRadialGradient(mx, my, 0, mx, my, mr);
    mist.addColorStop(0, "rgba(160, 70, 60, 0.16)");
    mist.addColorStop(1, "rgba(160, 70, 60, 0)");
    ctx.fillStyle = mist;
    ctx.beginPath();
    ctx.ellipse(mx, my, mr, mr * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 3; i++) {
    const sx = x + rng() * size;
    const sy = y + rng() * size * 0.6;
    ctx.fillStyle = `rgba(220, 140, 110, ${0.1 + rng() * 0.1})`;
    ctx.beginPath();
    ctx.arc(sx, sy, size * 0.008, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Vooruitkijk-tile (hoofdstuk 2, M8-streek 8: "vooruitkijk-bereik"): terrein
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

// Zachte hint van het vakje-terreinsubtype op een nog onbebouwd vakje (issue:
// "grotere verscheidenheid van tiles per streek") — laat vóór het bouwen al
// zien of een vakje bos/heuvel/berg/vlak is, zodat de terrein-eis van een
// improvement (zie improvements.ts: `terreinEisen`) ook zonder de tile-info-
// pop-up herkenbaar is. `vlak` krijgt bewust geen extra vorm: dat is de
// neutrale ondergrond zonder afwijkend silhouet.
function tekenTerreinHint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  terrein: TerreinType,
  seed: number
): void {
  if (terrein === "vlak") return;

  ctx.save();
  ctx.globalAlpha = 0.55;

  if (terrein === "bos") {
    const rng = maakSeededRandom(seed);
    tekenBoom(ctx, x + size * 0.5, y + size * 0.74, size * 0.36, rng() > 0.5);
  } else {
    const baseY = y + size * 0.78;
    const h = size * (terrein === "berg" ? 0.36 : 0.24);
    ctx.fillStyle = terrein === "berg" ? "#8f8f88" : "#7a6a4a";
    ctx.beginPath();
    ctx.moveTo(x + size * 0.5, baseY - h);
    ctx.lineTo(x + size * 0.74, baseY);
    ctx.lineTo(x + size * 0.26, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(40, 34, 24, 0.4)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.restore();
}

// Wilde kudde (hoofdstuk 16/17, issue: "kuddes met dieren waar je op kunt
// jagen voor voedsel"): een paar eenvoudige hertsilhouetten op een leeg vakje
// — in lijn met de MVP-plaatshouderstijl (hoofdstuk 13), passend bij het
// Hertenpad-volk van de tutorial.
function tekenHertSilhouet(ctx: CanvasRenderingContext2D, cx: number, baseY: number, h: number): void {
  ctx.fillStyle = "rgba(60, 44, 28, 0.82)";
  ctx.beginPath();
  ctx.ellipse(cx, baseY - h * 0.4, h * 0.36, h * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(60, 44, 28, 0.82)";
  ctx.lineWidth = Math.max(1, h * 0.09);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - h * 0.28, baseY - h * 0.5);
  ctx.lineTo(cx - h * 0.32, baseY);
  ctx.moveTo(cx + h * 0.02, baseY - h * 0.5);
  ctx.lineTo(cx - h * 0.02, baseY);
  ctx.moveTo(cx + h * 0.3, baseY - h * 0.36);
  ctx.lineTo(cx + h * 0.4, baseY - h * 0.1);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx + h * 0.32, baseY - h * 0.58);
  ctx.lineTo(cx + h * 0.44, baseY - h * 0.78);
  ctx.moveTo(cx + h * 0.36, baseY - h * 0.66);
  ctx.lineTo(cx + h * 0.28, baseY - h * 0.82);
  ctx.stroke();
}

function tekenKudde(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, seed: number): void {
  const rng = maakSeededRandom(seed);
  const baseY = y + size * 0.82;
  tekenHertSilhouet(ctx, x + size * 0.38, baseY, size * (0.34 + rng() * 0.06));
  tekenHertSilhouet(ctx, x + size * 0.62, baseY - size * 0.04, size * (0.26 + rng() * 0.06));
}

// Roofdier (hoofdstuk 14/17, issue: "roofdieren toevoegen"): een laag,
// gedrongen silhouet — bewust anders dan de rechtop staande hertsilhouetten
// hierboven, zodat de dreiging ook zonder UI-tekst meteen leesbaar is. In
// lijn met de MVP-plaatshouderstijl (hoofdstuk 13): eenvoudige vormen, geen
// gedetailleerd sprite-werk.
function tekenRoofdier(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const cx = x + size * 0.5;
  const baseY = y + size * 0.78;
  const h = size * 0.32;

  ctx.fillStyle = "rgba(30, 12, 10, 0.88)";
  ctx.beginPath();
  ctx.ellipse(cx, baseY - h * 0.24, h * 0.62, h * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(30, 12, 10, 0.88)";
  ctx.lineWidth = Math.max(1, h * 0.1);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - h * 0.5, baseY - h * 0.3);
  ctx.lineTo(cx - h * 0.56, baseY);
  ctx.moveTo(cx + h * 0.5, baseY - h * 0.3);
  ctx.lineTo(cx + h * 0.56, baseY);
  ctx.stroke();

  // Kop, laag bij de grond — een jagende houding.
  ctx.beginPath();
  ctx.ellipse(cx + h * 0.68, baseY - h * 0.12, h * 0.2, h * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(196, 70, 40, 0.95)";
  ctx.beginPath();
  ctx.arc(cx + h * 0.76, baseY - h * 0.16, h * 0.045, 0, Math.PI * 2);
  ctx.fill();
}

// Vers-water-markering (hoofdstuk 2, issue: "stad stichten op de
// frontier" deel 1: "maak op de kaart zichtbaar welke vakjes geschikt
// zijn"): een klein golvend randje langs de onderzijde van het vakje, zodat
// een speler op elk moment kan zien/plannen waar hij later zou kunnen
// stichten — zichtbaar ongeacht of het vakje nog leeg is of al bebouwd
// (bebouwde vakjes tonen 'm nog om te laten zien dat de kans daar verkeken
// is, i.p.v. het spoor stilzwijgend te laten verdwijnen).
function tekenVersWaterMarkering(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  seed: number
): void {
  const rng = maakSeededRandom(seed);
  ctx.save();
  ctx.strokeStyle = "rgba(120, 195, 220, 0.85)";
  ctx.lineWidth = Math.max(1.5, size * 0.035);
  ctx.lineCap = "round";
  ctx.beginPath();
  const baseY = y + size * (0.93 + (rng() - 0.5) * 0.02);
  ctx.moveTo(x + size * 0.06, baseY);
  ctx.quadraticCurveTo(x + size * 0.28, baseY - size * 0.06, x + size * 0.5, baseY);
  ctx.quadraticCurveTo(x + size * 0.72, baseY + size * 0.06, x + size * 0.94, baseY);
  ctx.stroke();
  ctx.restore();
}

export function tekenTileGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
): void {
  ctx.strokeStyle = "rgba(201, 184, 150, 0.12)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
}

// Markeert een lege tile als geldig plaatsingsdoel tijdens het kiezen van een
// plek voor een gekozen improvement (klik-op-tile-plaatsing, zie GameRoot:
// `plaatsingsImprovement`) — een gouden rand zodat duidelijk is waar je nog
// mag klikken, zonder de tile-tekening zelf aan te passen.
export function tekenBeschikbaarMarkering(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
): void {
  ctx.save();
  ctx.strokeStyle = "rgba(230, 190, 90, 0.85)";
  ctx.lineWidth = Math.max(2, size * 0.045);
  ctx.strokeRect(x + ctx.lineWidth / 2, y + ctx.lineWidth / 2, size - ctx.lineWidth, size - ctx.lineWidth);
  ctx.restore();
}

// Markeert een vakje waar de settler deze beurt direct naartoe kan (issue:
// "de tegels waar je heen kunt lichten op") — een koele blauwe gloed +
// rand, bewust een andere kleur dan de gouden bouwplaatsings-markering
// hierboven zodat de twee klik-modi nooit door elkaar lopen.
export function tekenSettlerBereikbaarMarkering(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
): void {
  ctx.save();
  ctx.fillStyle = "rgba(120, 200, 220, 0.16)";
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = "rgba(140, 210, 230, 0.85)";
  ctx.lineWidth = Math.max(2, size * 0.045);
  ctx.strokeRect(x + ctx.lineWidth / 2, y + ctx.lineWidth / 2, size - ctx.lineWidth, size - ctx.lineWidth);
  ctx.restore();
}

// Markeert een actieve, nog onbemande Legerkamp-tile tijdens het bemannen
// (hoofdstuk 6, issue: "De Bezette Streek, missionaris en verkenner", Deel 5)
// — zelfde patroon als `tekenSettlerBereikbaarMarkering` hierboven, maar
// olijfgroen (net als `tekenLegerkampIcon`) zodat de twee klik-modi ook op de
// kaart zelf te onderscheiden zijn.
export function tekenLegerkampBereikbaarMarkering(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
): void {
  ctx.save();
  ctx.fillStyle = "rgba(120, 150, 70, 0.18)";
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = "rgba(140, 170, 80, 0.9)";
  ctx.lineWidth = Math.max(2, size * 0.045);
  ctx.strokeRect(x + ctx.lineWidth / 2, y + ctx.lineWidth / 2, size - ctx.lineWidth, size - ctx.lineWidth);
  ctx.restore();
}

// Markeert een nog verhuld vakje van de actieve Bezette Streek tijdens
// Verkenning (Deel 3) — zelfde patroon, maar de dreigende rossige kleur van
// `tekenVerhuldeTile` zodat de markering aansluit bij wat er onder zit.
export function tekenVerkenningBereikbaarMarkering(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
): void {
  ctx.save();
  ctx.fillStyle = "rgba(200, 90, 60, 0.18)";
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = "rgba(210, 110, 70, 0.9)";
  ctx.lineWidth = Math.max(2, size * 0.045);
  ctx.strokeRect(x + ctx.lineWidth / 2, y + ctx.lineWidth / 2, size - ctx.lineWidth, size - ctx.lineWidth);
  ctx.restore();
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
  hoogte: number,
  verbondenMetStad: boolean,
  // De volledige, niet-zichtbaarheids-gefilterde streken-lijst — zie
  // `tekenWereld` hieronder voor de volledige toelichting. `wegVerbindingen`
  // kijkt naar buurstreken (`omhoog`/`omlaag`) die na een nieuwe stichting
  // dichtgeklapt kunnen zijn, dus dit mag nooit de canvas-gefilterde subset
  // zijn.
  alleStreken: Streek[],
  heeftOnrust: boolean
): void {
  const seed = tileSeed(col, hoogte);
  tekenTerreinOndergrond(ctx, x, y, size, terreinType, seed);

  if (tile.heeftWeg) {
    tekenWeg(ctx, x, y, size, seed, wegVerbindingen(alleStreken, hoogte, col));
  }

  if (tile.status === "ghost_town") {
    tekenGhostTown(ctx, x, y, size, seed);
    return;
  }

  if (tile.status === "ruine") {
    tekenRuine(ctx, x, y, size, seed);
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
    const bemand =
      tile.improvement.id === "wachttoren" && isWachttorenBemand(stad.strijders, hoogte, col);
    tekenLandImprovement(ctx, x, y, size, tile.improvement.id, seed, bemand);

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

    // Wegverbinding (M10, hoofdstuk 16): een gebouwd, actief land improvement
    // zonder wegverbinding produceert nog niks — zichtbaar gemaakt met een
    // gedempte waas i.p.v. stilzwijgend niets te tonen.
    if (!verbondenMetStad) {
      tekenNietVerbondenIndicator(ctx, x, y, size);
    }
    if (heeftOnrust) {
      tekenOnrustIndicator(ctx, x, y, size);
    }
    return;
  }

  if (tile.status === "in_aanbouw") {
    tekenBouwSteiger(ctx, x, y, size);
    return;
  }

  if (tile.status === "leeg") {
    tekenTerreinHint(ctx, x, y, size, tile.terrein, seed);
    if (tile.kudde) {
      tekenKudde(ctx, x, y, size, seed + 1);
    }
    if (tile.roofdier) {
      tekenRoofdier(ctx, x, y, size);
    }
  }
}

// Tekent alle streken (band van 9 vakjes breed), streek 1 onderaan het canvas,
// oplopend naar boven — zie hoofdstuk 2 ("omhoog bouwen").
export function tekenWereld(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  streken: Streek[],
  // De volledige, niet-zichtbaarheids-gefilterde streken-lijst (`GameState.streken`)
  // — issue "Nieuwe stad Cincinnati": `streken` hierboven kan sinds die issue
  // ook van onderaf afgesneden zijn (dichtgeklapte streken van vóór de
  // huidige stad). Het wegennetwerk/de onrust-bescherming (`isTileVerbondenMetStad`,
  // `wegVerbindingen`, `onrustOpStreek` hieronder) moet daar wél doorheen
  // kunnen kijken — precies zoals de echte spellogica (productie.ts e.a.)
  // altijd al met `state.streken` rekent, nooit met een canvas-gefilterde
  // subset. Anders zou een tile vlak na een nieuwe stichting onterecht als
  // "niet verbonden" getekend worden.
  alleStreken: Streek[],
  stad: City,
  plaatsingsStreekHoogte?: number,
  // `bouwbaarBuitenFrontier`-improvements (Wachttoren/Legerkamp, hoofdstuk
  // 6/11) mogen op elke ontgrendelde streek geplaatst worden, niet alleen op
  // `plaatsingsStreekHoogte` (de actieve/frontier-streek) — issue "wachttoren
  // bouwen: alle vakjes oplichten". Zolang dit gezet is, lichten alle lege
  // vakjes van elke ontgrendelde streek op i.p.v. uitsluitend die van de
  // frontier-streek.
  plaatsingsAlleStreken?: boolean,
  settler?: Settler,
  settlerBereikbarePosities?: Settler[],
  legerkampBereikbarePosities?: Settler[],
  verkenningBereikbarePosities?: Settler[],
  // Tweede settler (issue: "Altijd 2e settler" #236) — apart van `settler`
  // hierboven, altijd los getekend zodat beide tegelijk zichtbaar zijn.
  tweedeSettler?: Settler,
  // Campagne-tegelset (M20d deelstap 4, `CampaignConfig.tegelSet`) — `undefined`
  // voor de tutorial. Kleurde eerder een groene/bruine multiply-overlay over
  // het hele canvas (issue "Groene waas niet goed"); nu bepalen de terrein-
  // tegels zelf hun kleur via `terreinBasisKleur`/`TERREIN_BASIS` (elke
  // Going West-streeknaam is al uniek t.o.v. de tutorial). Wordt inmiddels wel
  // gebruikt om de settler-skin te kiezen (`tekenSettler` hieronder: oer-
  // poppetje voor de tutorial vs. huifkar voor Going West, issue "Andere skin
  // oer settler") en blijft verder een aanknopingspunt voor een echte, losse
  // tegelset per campagne (hoofdstuk 12 design-doc).
  tegelSet?: string,
  // Actieve campagne-id (`GameState.campagneId`) — alleen doorgegeven om de
  // onrust-indicator (`tekenOnrustIndicator` hierboven) te gaten op Going
  // West, zelfde `campagneId`-check als productie.ts/tileInfo.ts: onrust
  // bestaat niet in de tutorial, dus daar blijft deze indicator altijd uit.
  campagneId?: string
): void {
  const tileSize = width / BAND_WIDTH_TILES;
  const totaalStreken = streken.length;
  // Hoogte van de bovenste zichtbare streek — sinds issue "Nieuwe stad
  // Cincinnati" niet meer per se gelijk aan `totaalStreken` zodra ook van
  // onderaf afgesneden wordt (zie world.ts: `zichtbareStreken`, `ondergrens`).
  // `streken` staat oplopend op hoogte, dus het laatste element is de hoogste.
  const maxHoogte = totaalStreken > 0 ? streken[totaalStreken - 1].hoogte : 0;
  // Afsluitende oceaan-rij bóven de laatste streek (issue: "laatste oceaan ook
  // visueel") — schuift alle rijen hieronder één tegel naar beneden zodra hij
  // getoond wordt, net zoals de startoceaan een vaste extra rij onderaan is
  // zolang streek 1 nog zichtbaar is (`startOceaanZichtbaar`).
  const topOffset = eindeOceaanZichtbaar(streken) ? tileSize : 0;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#100d0a";
  ctx.fillRect(0, 0, width, height);

  // Schermpositie van de stad-tegel (issue: "Stad naam tonen op de kaart") —
  // pas ná de hele band bekend welke tegel dat is, dus hier vastgelegd zodra
  // hij tijdens de loop hieronder getekend wordt en pas aan het eind gebruikt
  // om de naam als overlay te tekenen (zie `tekenStadNaam`).
  let stadPositie: { x: number; y: number } | undefined;

  for (const streek of streken) {
    const rijIndex = maxHoogte - streek.hoogte;
    const y = rijIndex * tileSize + topOffset;
    const vooruitkijk = !streek.ontgrendeld && isVooruitkijkStreek(streek, streken);
    // Onrust geldt per streek, niet per tile (onrust.ts: `onrustOpStreek`) —
    // dus één keer per streek berekend, niet opnieuw voor elke kolom
    // hieronder. `alleStreken` i.p.v. `streken`: zie toelichting bovenaan
    // deze functie.
    const heeftOnrust = campagneId === "going-west" && onrustOpStreek(alleStreken, stad.rechters, streek) > 0;

    for (let col = 0; col < BAND_WIDTH_TILES; col++) {
      const x = col * tileSize;

      // Bezette Streek (hoofdstuk 6, issue: "De Bezette Streek, missionaris en
      // verkenner", Deel 1) & Wampanoag-laag (Going West, M21e, issue:
      // "Wampanoag streek blokkerend"): allebei een eigen, per-tegel
      // verhullingslaag, los van de gewone streek-brede fog-of-war hieronder
      // — de streek zelf blijft `ontgrendeld: false` zolang ze bezet is, maar
      // de losse vakjes worden hier al individueel getoond zodra ze onthuld
      // zijn.
      if (streek.bezet || streek.wampanoagBezet) {
        const tile = streek.tiles[col];
        if (tile.verhuld || tile.wampanoagVerhuld) {
          tekenVerhuldeTile(ctx, x, y, tileSize, tileSeed(col, streek.hoogte));
        } else {
          const verbonden = isTileVerbondenMetStad(alleStreken, streek.hoogte, col);
          tekenActieveTile(ctx, x, y, tileSize, tile, streek.terreinType, stad, col, streek.hoogte, verbonden, alleStreken, heeftOnrust);
          if (tile.improvement?.soort === "city") {
            stadPositie = { x, y };
          }
          if (tile.versWater) {
            tekenVersWaterMarkering(ctx, x, y, tileSize, tileSeed(col, streek.hoogte, 2));
          }
        }
      } else if (!streek.ontgrendeld && !vooruitkijk) {
        tekenFogTile(ctx, x, y, tileSize, tileSeed(col, streek.hoogte));
      } else if (!streek.ontgrendeld && vooruitkijk) {
        tekenVooruitkijkTile(ctx, x, y, tileSize, streek.terreinType);
      } else {
        const verbonden = isTileVerbondenMetStad(alleStreken, streek.hoogte, col);
        tekenActieveTile(ctx, x, y, tileSize, streek.tiles[col], streek.terreinType, stad, col, streek.hoogte, verbonden, alleStreken, heeftOnrust);
        if (streek.tiles[col].improvement?.soort === "city") {
          stadPositie = { x, y };
        }
        if (streek.tiles[col].versWater) {
          tekenVersWaterMarkering(ctx, x, y, tileSize, tileSeed(col, streek.hoogte, 2));
        }
      }

      tekenTileGrid(ctx, x, y, tileSize);

      const isPlaatsingsDoelStreek = plaatsingsAlleStreken
        ? streek.ontgrendeld
        : streek.hoogte === plaatsingsStreekHoogte;
      if (isPlaatsingsDoelStreek && isBebouwbaarLeeg(streek.tiles[col])) {
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

  // De settler wordt als laatste getekend (hoofdstuk 16), boven op de tile
  // waar hij op dat moment staat, zodat hij nooit onder een improvement-icoon
  // verdwijnt.
  if (settler) {
    const rijIndex = maxHoogte - settler.hoogte;
    if (rijIndex >= 0 && rijIndex < totaalStreken) {
      tekenSettler(ctx, settler.positieInStreek * tileSize, rijIndex * tileSize + topOffset, tileSize, "primair", tegelSet);
    }
  }
  if (tweedeSettler) {
    const rijIndex = maxHoogte - tweedeSettler.hoogte;
    if (rijIndex >= 0 && rijIndex < totaalStreken) {
      tekenSettler(ctx, tweedeSettler.positieInStreek * tileSize, rijIndex * tileSize + topOffset, tileSize, "tweede", tegelSet);
    }
  }

  // Rij oceaan-tegels vlak onder streek 1 (hoofdstuk 2: startstad begint aan een
  // oceaan) — één extra rij, klikbaar via dezelfde tile-geometrie als de
  // overige streken (zie GameCanvas: `bepaalAangeklikteTile`, hoogte 0). Sinds
  // issue "Nieuwe stad Cincinnati" alleen nog getekend zolang streek 1 zelf
  // zichtbaar is (`startOceaanZichtbaar`) — na een nieuwe stichting is de
  // onderste zichtbare streek niet meer de startstreek.
  if (startOceaanZichtbaar(streken)) {
    const oceaanY = totaalStreken * tileSize + topOffset;
    for (let col = 0; col < BAND_WIDTH_TILES; col++) {
      const x = col * tileSize;
      tekenOceaanTile(ctx, x, oceaanY, tileSize, tileSeed(col, 0));
      tekenTileGrid(ctx, x, oceaanY, tileSize);
    }
  }

  // Afsluitende oceaan-rij bóven de laatste streek (issue: "laatste oceaan ook
  // visueel") — symmetrisch met de startoceaan hierboven, maar dan de oceaan
  // aan de overkant (hoofdstuk 2/10), pas getekend zodra de laatste streek
  // ontgrendeld is (zie `eindeOceaanZichtbaar` in world.ts). Klikbaar via
  // dezelfde tile-geometrie (GameCanvas: `bepaalAangeklikteTile`, sentinel-
  // hoogte `EINDE_OCEAAN_HOOGTE`).
  if (topOffset > 0) {
    for (let col = 0; col < BAND_WIDTH_TILES; col++) {
      const x = col * tileSize;
      tekenOceaanTile(ctx, x, 0, tileSize, tileSeed(col, totaalStreken + 1));
      tekenTileGrid(ctx, x, 0, tileSize);
    }
  }

  // Stad-naam als allerlaatste overlay (zie toelichting bij `stadPositie`
  // hierboven) zodat de startstad-tegel (hoogte 1, vlak boven de startoceaan)
  // ook een naam toont zonder dat de oceaan-rij hierboven hem overschildert.
  if (stadPositie) {
    tekenStadNaam(ctx, stadPositie.x, stadPositie.y, tileSize, stad.naam);
  }
}
