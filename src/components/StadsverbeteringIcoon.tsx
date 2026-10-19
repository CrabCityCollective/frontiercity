"use client";

import { useSyncExternalStore } from "react";
import { GRAFISCHE_STIJL_EVENT, GrafischeStijl, grafischeStijl } from "@/game/save";
import { PixelIconSpec } from "./ResourceIcoon";

// Icoontjes voor de city improvements (issue "Icoontjes city improvements"):
// zowel een pixel-art variant (zelfde 8x8-raster als de grondstof-icoontjes in
// ResourceIcoon) als een getekende vector-variant, passend bij de
// grafische-stijl-instelling (save.ts). Gebruikt in StadsverbeteringenPaneel en
// in de encyclopedie. Placeholder-kwaliteit (CLAUDE.md: functionaliteit gaat
// voor polish).
export type StadsverbeteringIcoonSleutel =
  | "bibliotheek"
  | "markt"
  | "barakken"
  | "tempel"
  | "grote-tempel"
  | "aquaduct"
  | "smederij"
  | "opslagplaats";

const STADSVERBETERING_SLEUTELS: readonly string[] = [
  "bibliotheek",
  "markt",
  "barakken",
  "tempel",
  "grote-tempel",
  "aquaduct",
  "smederij",
  "opslagplaats",
];

export function isStadsverbeteringIcoonSleutel(sleutel: string): sleutel is StadsverbeteringIcoonSleutel {
  return STADSVERBETERING_SLEUTELS.includes(sleutel);
}

const PIXEL: Record<StadsverbeteringIcoonSleutel, PixelIconSpec> = {
  bibliotheek: {
    grid: [
      "........",
      ".AAAAAA.",
      "ABCBDBEA",
      "ABCBDBEA",
      "ABCBDBEA",
      "ABCBDBEA",
      ".AAAAAA.",
      "........",
    ],
    palette: { A: "#5a3a20", B: "#9c3a2a", C: "#d4b46a", D: "#3a6a8a", E: "#6f8f46" },
  },
  markt: {
    grid: [
      "........",
      "ABABABAB",
      "ABABABAB",
      ".CCCCCC.",
      ".C....C.",
      ".C.DD.C.",
      ".C.DD.C.",
      "........",
    ],
    palette: { A: "#b03a2a", B: "#e8e0d0", C: "#7a4a28", D: "#e0b030" },
  },
  barakken: {
    grid: [
      "...A....",
      "..AAA...",
      ".BBBBBB.",
      ".BCBBCB.",
      ".BBBBBB.",
      ".BBDDBB.",
      ".BBDDBB.",
      "........",
    ],
    palette: { A: "#a03030", B: "#8a6a4a", C: "#3a2a1a", D: "#4a3020" },
  },
  tempel: {
    grid: [
      "...AA...",
      "..AAAA..",
      ".BBBBBB.",
      ".C.C.C..",
      ".C.C.C..",
      ".C.C.C..",
      "BBBBBBB.",
      "........",
    ],
    palette: { A: "#c4b8a0", B: "#9c8f7a", C: "#e8e0d0" },
  },
  "grote-tempel": {
    grid: [
      "...DD...",
      "..AAAA..",
      ".AAAAAA.",
      "BBBBBBBB",
      ".C.CC.C.",
      ".C.CC.C.",
      "BBBBBBBB",
      "BBBBBBBB",
    ],
    palette: { A: "#e0b030", B: "#9c8f7a", C: "#e8e0d0", D: "#f5dc80" },
  },
  aquaduct: {
    grid: [
      "........",
      "AAAAAAAA",
      "BBBBBBBB",
      "AA.AA.AA",
      "AA.AA.AA",
      "AA.AA.AA",
      "AA.AA.AA",
      "........",
    ],
    palette: { A: "#9c8f7a", B: "#5a9fa8" },
  },
  smederij: {
    grid: [
      "........",
      ".AAAAAA.",
      "AAAAAAA.",
      "..AAAA..",
      "...BB...",
      "..BBBB..",
      ".BBBBBB.",
      "........",
    ],
    palette: { A: "#6a6a72", B: "#3a3a42" },
  },
  opslagplaats: {
    grid: [
      "........",
      "..AAAA..",
      ".AAAAAA.",
      "BBBBBBBB",
      "BCCBBCCB",
      "BCCBBCCB",
      "BBBBBBBB",
      "........",
    ],
    palette: { A: "#a08050", B: "#7a4a28", C: "#c9915a" },
  },
};

function PixelSvg({ spec, grootte }: { spec: PixelIconSpec; grootte: number }) {
  return (
    <svg width={grootte} height={grootte} viewBox="0 0 8 8" shapeRendering="crispEdges">
      {spec.grid.flatMap((rij, y) =>
        rij.split("").map((teken, x) => {
          const kleur = spec.palette[teken];
          if (!kleur) return null;
          return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={kleur} />;
        }),
      )}
    </svg>
  );
}

// Getekende (vector) varianten, 32x32 viewBox.
const VECTOR: Record<StadsverbeteringIcoonSleutel, React.ReactNode> = {
  bibliotheek: (
    <>
      <rect x="4" y="6" width="24" height="22" rx="2" fill="#5a3a20" />
      <rect x="7" y="9" width="4" height="16" fill="#9c3a2a" />
      <rect x="12" y="9" width="4" height="16" fill="#d4b46a" />
      <rect x="17" y="9" width="4" height="16" fill="#3a6a8a" />
      <rect x="22" y="9" width="3" height="16" fill="#6f8f46" />
    </>
  ),
  markt: (
    <>
      <path d="M3 13 L6 5 H26 L29 13 Z" fill="#b03a2a" />
      <path d="M9 5 L8 13 M15 5 L14 13 M21 5 L20 13" stroke="#e8e0d0" strokeWidth="3" />
      <rect x="5" y="13" width="22" height="3" fill="#7a4a28" />
      <rect x="6" y="16" width="3" height="12" fill="#7a4a28" />
      <rect x="23" y="16" width="3" height="12" fill="#7a4a28" />
      <circle cx="16" cy="22" r="4" fill="#e0b030" />
    </>
  ),
  barakken: (
    <>
      <path d="M16 3 L22 3 L22 8 L16 8 Z" fill="#a03030" />
      <path d="M16 3 V13" stroke="#3a2a1a" strokeWidth="1.5" />
      <rect x="4" y="13" width="24" height="15" fill="#8a6a4a" />
      <rect x="7" y="16" width="4" height="4" fill="#3a2a1a" />
      <rect x="21" y="16" width="4" height="4" fill="#3a2a1a" />
      <rect x="13" y="20" width="6" height="8" fill="#4a3020" />
    </>
  ),
  tempel: (
    <>
      <path d="M3 12 L16 3 L29 12 Z" fill="#c4b8a0" />
      <rect x="5" y="12" width="22" height="3" fill="#9c8f7a" />
      <rect x="7" y="15" width="3" height="10" fill="#e8e0d0" />
      <rect x="14.5" y="15" width="3" height="10" fill="#e8e0d0" />
      <rect x="22" y="15" width="3" height="10" fill="#e8e0d0" />
      <rect x="3" y="25" width="26" height="4" fill="#9c8f7a" />
    </>
  ),
  "grote-tempel": (
    <>
      <circle cx="16" cy="5" r="2.5" fill="#f5dc80" />
      <path d="M4 14 L16 6 L28 14 Z" fill="#e0b030" />
      <rect x="3" y="14" width="26" height="3" fill="#9c8f7a" />
      <rect x="5" y="17" width="3" height="9" fill="#e8e0d0" />
      <rect x="11" y="17" width="3" height="9" fill="#e8e0d0" />
      <rect x="18" y="17" width="3" height="9" fill="#e8e0d0" />
      <rect x="24" y="17" width="3" height="9" fill="#e8e0d0" />
      <rect x="2" y="26" width="28" height="4" fill="#9c8f7a" />
    </>
  ),
  aquaduct: (
    <>
      <rect x="2" y="6" width="28" height="6" fill="#9c8f7a" />
      <rect x="3" y="7" width="26" height="3" fill="#5a9fa8" />
      <path d="M2 12 H30 V28 H25 V20 A4 4 0 0 0 17 20 V28 H15 V20 A4 4 0 0 0 7 20 V28 H2 Z" fill="#9c8f7a" />
    </>
  ),
  smederij: (
    <>
      <path d="M3 8 H25 L29 11 H22 L19 15 H13 L11 12 H3 Z" fill="#6a6a72" />
      <rect x="13" y="15" width="6" height="5" fill="#3a3a42" />
      <path d="M8 28 L11 20 H21 L24 28 Z" fill="#3a3a42" />
      <circle cx="26" cy="24" r="2" fill="#c96b3a" />
    </>
  ),
  opslagplaats: (
    <>
      <path d="M3 13 L16 4 L29 13 Z" fill="#a08050" />
      <rect x="4" y="13" width="24" height="15" fill="#7a4a28" />
      <rect x="7" y="16" width="7" height="9" fill="#c9915a" />
      <rect x="18" y="16" width="7" height="9" fill="#c9915a" />
      <path d="M7 16 L14 25 M14 16 L7 25 M18 16 L25 25 M25 16 L18 25" stroke="#7a4a28" strokeWidth="1" />
    </>
  ),
};

function subscribe(onChange: () => void) {
  window.addEventListener(GRAFISCHE_STIJL_EVENT, onChange);
  return () => window.removeEventListener(GRAFISCHE_STIJL_EVENT, onChange);
}

function useGrafischeStijl(): GrafischeStijl {
  // Server-snapshot "vector" = ook de standaard in `grafischeStijl()`.
  return useSyncExternalStore(subscribe, grafischeStijl, () => "vector");
}

export function StadsverbeteringIcoon({
  sleutel,
  grootte = 32,
}: {
  sleutel: StadsverbeteringIcoonSleutel;
  grootte?: number;
}) {
  const stijl = useGrafischeStijl();
  return (
    <span aria-hidden="true" style={{ display: "inline-flex", lineHeight: 0, flexShrink: 0 }}>
      {stijl === "pixel-art" ? (
        <PixelSvg spec={PIXEL[sleutel]} grootte={grootte} />
      ) : (
        <svg width={grootte} height={grootte} viewBox="0 0 32 32">
          {VECTOR[sleutel]}
        </svg>
      )}
    </span>
  );
}
