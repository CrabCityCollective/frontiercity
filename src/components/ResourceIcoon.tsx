import { RESOURCE_LABELS } from "@/game/improvements";
import { ResourceType } from "@/game/types";

// Pixel-art icoontjes per grondstof (issue #129: "kun je ook de resource
// icoontjes voorzien van pixel art versies?"). Elk icoon is een klein grid
// van "pixels" (rect per cel) i.p.v. een afbeeldingsbestand — geen extra
// asset-pipeline nodig, en de blokkerige stijl komt overeen met de gevraagde
// pixel art look. Placeholder-kwaliteit is prima in de MVP (CLAUDE.md:
// "functionaliteit gaat voor polish").
type PixelGrid = string[];

interface PixelIconSpec {
  grid: PixelGrid;
  palette: Record<string, string>;
}

const GRID_GROOTTE = 8;
const CEL = 16 / GRID_GROOTTE;

const PIXEL_ICONEN: Record<ResourceType, PixelIconSpec> = {
  hout: {
    grid: [
      "........",
      ".AAAAAA.",
      ".ABBBBA.",
      ".AAAAAA.",
      "........",
      ".AAAAAA.",
      ".ABBBBA.",
      ".AAAAAA.",
    ],
    palette: { A: "#c9915a", B: "#7a4a28" },
  },
  steen: {
    grid: [
      "........",
      "..AAAA..",
      ".AABBAA.",
      "AABBBBAA",
      "AABBBBAA",
      ".AABBAA.",
      "..AAAA..",
      "........",
    ],
    palette: { A: "#c4c4bd", B: "#7d7d76" },
  },
  erts: {
    grid: [
      "........",
      "..AAAA..",
      ".ABBBBA.",
      "AABCCBAA",
      "AABCCBAA",
      ".ABBBBA.",
      "..AAAA..",
      "........",
    ],
    palette: { A: "#5c5c66", B: "#84848c", C: "#c96b3a" },
  },
  goud: {
    grid: [
      "........",
      "..AAAA..",
      ".ABBBBA.",
      "AABCBBAA",
      "AABBCBAA",
      ".ABBBBA.",
      "..AAAA..",
      "........",
    ],
    palette: { A: "#8a6a1a", B: "#e0b030", C: "#f5dc80" },
  },
  voedsel: {
    grid: [
      "...CC...",
      "..C..C..",
      ".C....C.",
      "AA....AA",
      ".AA..AA.",
      "..AAAA..",
      "...BB...",
      "...BB...",
    ],
    palette: { A: "#d4b46a", B: "#6f8f46", C: "#e8d090" },
  },
  cultuur: {
    grid: [
      "........",
      "..AAAA..",
      "..ABBA..",
      "..ABBA..",
      "..ABCA..",
      "..ABBA..",
      "..AAAA..",
      "........",
    ],
    palette: { A: "#9c8f7a", B: "#c4b8a0", C: "#5a4a3a" },
  },
  wetenschap: {
    grid: [
      "...A....",
      "...A....",
      "..CAC...",
      "AAABAAA.",
      "..CAC...",
      "...A....",
      "...A....",
      "........",
    ],
    palette: { A: "#5a9fa8", B: "#e8f5f5", C: "#a8d8dc" },
  },
};

function IcoonSvg({ type }: { type: ResourceType }) {
  const { grid, palette } = PIXEL_ICONEN[type];

  return (
    <svg width={16} height={16} viewBox="0 0 16 16" shapeRendering="crispEdges">
      {grid.flatMap((rij, y) =>
        rij.split("").map((teken, x) => {
          const kleur = palette[teken];
          if (!kleur) return null;
          return <rect key={`${x}-${y}`} x={x * CEL} y={y * CEL} width={CEL} height={CEL} fill={kleur} />;
        }),
      )}
    </svg>
  );
}

interface ResourceIcoonProps {
  type: ResourceType;
  waarde?: number | string;
}

// Grondstof-icoon met de naam er gewoon achter (issue #129: "ik wil alleen
// toch de pop-ups bij de icoontjes weg, en de namen van de resource er
// gewoon achter"). Geen klik-state meer nodig — de naam is altijd zichtbaar.
export default function ResourceIcoon({ type, waarde }: ResourceIcoonProps) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
      <span aria-hidden="true" style={{ display: "inline-flex", lineHeight: 0 }}>
        <IcoonSvg type={type} />
      </span>
      <span>{RESOURCE_LABELS[type]}</span>
      {waarde !== undefined && <span>{waarde}</span>}
    </span>
  );
}

// Rijtje icoontjes voor een bouwkosten-record (issue: "ook in andere pop-ups
// met bouwkosten wil ik graag deze icoontjes getoond zien worden, in plaats
// van steen, hout, voedsel, cultuur, etc."). Vervangt de losse
// `formatteerKosten`-tekstfuncties die voorheen in BouwPopup/CivielPaneel/
// MilitairPaneel/OpslagplaatsPaneel stonden.
export function KostenIcons({ kosten }: { kosten: Partial<Record<ResourceType, number>> }) {
  const delen = (Object.entries(kosten) as [ResourceType, number][]).filter(([, waarde]) => waarde > 0);
  if (delen.length === 0) return <span>gratis</span>;

  return (
    <span style={{ display: "inline-flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
      {delen.map(([type, waarde]) => (
        <ResourceIcoon key={type} type={type} waarde={waarde} />
      ))}
    </span>
  );
}
