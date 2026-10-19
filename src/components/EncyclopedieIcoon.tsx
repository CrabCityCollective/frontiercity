import { HudResourceType, PIXEL_ICONEN, PixelIconSpec } from "@/components/ResourceIcoon";

// Icoontjes voor de encyclopedie (issue "Encyclopedie mooier": icoontjes bij
// grondstoffen, gebouwen, onrust en roofdieren). Zelfde pixel-art-aanpak als
// de grondstof-icoontjes in ResourceIcoon.tsx (8x8 grid, rect per cel, geen
// afbeeldingsbestanden); de grondstof-icoontjes zelf worden hergebruikt.
const GEBOUW_ICONEN = {
  boerderij: {
    grid: ["........", "...B....", "..BB.B..", "...B.BB.", "AAAAAAAA", "CCCCCCCC", "AAAAAAAA", "CCCCCCCC"],
    palette: { A: "#6f4a2a", B: "#6f8f46", C: "#9a6a3a" },
  },
  mijn: {
    grid: ["........", "..AAAA..", ".AAAAAA.", "AAABBAAA", "AABBBBAA", "AABBBBAA", "AABBBBAA", "AAAAAAAA"],
    palette: { A: "#84848c", B: "#2a2a30" },
  },
  goudmijn: {
    grid: ["........", "..AAAA..", ".AAAAAA.", "AAABBAAA", "AABBBCAA", "AABBBBAA", "ACABBBAA", "AAAAAAAA"],
    palette: { A: "#84848c", B: "#2a2a30", C: "#e0b030" },
  },
  steengroeve: {
    grid: ["........", "....A...", "...AAA..", "..ABBBA.", ".AABBBAA", "AABBBBBA", "ABBCBBBA", "AAAAAAAA"],
    palette: { A: "#c4c4bd", B: "#7d7d76", C: "#5a5a55" },
  },
  houtkap: {
    grid: ["...AA...", "..AAAA..", ".AAAAAA.", "AAAAAAAA", "...BB...", "...BB...", "...BB...", "..BBBB.."],
    palette: { A: "#4a7a3a", B: "#7a4a28" },
  },
  wachttoren: {
    grid: ["..A.A.A.", "..AAAAA.", "..ABBBA.", "..AAAAA.", "..ABBBA.", "..AAAAA.", "..AAAAA.", ".AAAAAAA"],
    palette: { A: "#9c8f7a", B: "#3a2f28" },
  },
  heiligdom: {
    grid: ["...C....", "..CBBC..", "...AA...", "..AAAA..", "..ABBA..", "..ABBA..", ".AAAAAA.", "AAAAAAAA"],
    palette: { A: "#9c8f7a", B: "#5a4a3a", C: "#e0b030" },
  },
  sterrencirkel: {
    grid: ["..A..A..", ".A....A.", "A..CC..A", "...CC...", "A......A", ".A....A.", "..A..A..", "........"],
    palette: { A: "#9c8f7a", C: "#a8d8dc" },
  },
  ranch: {
    grid: ["........", "....AA..", "..BBBBAA", ".BBCBBB.", "..BBBBB.", "..B..B..", "EEEEEEEE", "E.E..E.E"],
    palette: { A: "#2a2a2a", B: "#e8e0d0", C: "#2a2a2a", E: "#7a4a28" },
  },
  saloon: {
    grid: ["CCCCCCCC", "AAAAAAAA", "ABBAABBA", "ABBAABBA", "AAADDAAA", "AAADDAAA", "AAADDAAA", "AAAAAAAA"],
    palette: { A: "#a0683a", B: "#e0b030", C: "#7a4a28", D: "#3a2418" },
  },
  courthouse: {
    grid: ["...AA...", "..AAAA..", ".AAAAAA.", "BBBBBBBB", "A.A..A.A", "A.A..A.A", "BBBBBBBB", "BBBBBBBB"],
    palette: { A: "#c4b8a0", B: "#9c8f7a" },
  },
  tempel: {
    grid: ["...AA...", "..AAAA..", ".AAAAAA.", "BBBBBBBB", "A.A..A.A", "A.A..A.A", "BBBBBBBB", "BBBBBBBB"],
    palette: { A: "#e0b030", B: "#9c8f7a" },
  },
  offeraltaar: {
    grid: ["...C....", "..CCC...", "........", ".AAAAAA.", ".ABBBBA.", "..ABBA..", "..ABBA..", ".AAAAAA."],
    palette: { A: "#9c8f7a", B: "#5a4a3a", C: "#d9622a" },
  },
  legerkamp: {
    grid: ["...D....", "...A....", "..AAA...", ".AAAAA..", "AAABAAA.", "AAABBAAA", "AABBBBAA", "AAAAAAAA"],
    palette: { A: "#b89a64", B: "#3a2f28", D: "#a03030" },
  },
  woonwijk: {
    grid: ["...AA...", "..AAAA..", ".AAAAAA.", "AAAAAAAA", ".BBCCBB.", ".BBCCBB.", ".BBCCBB.", ".BBBBBB."],
    palette: { A: "#a03a2a", B: "#c4b8a0", C: "#3a2418" },
  },
  grotewoonwijk: {
    grid: ["...AA...", "..AAAA..", ".AAAAAA.", "AAAAAAAA", ".BBCCBB.", ".BBCCBB.", ".BBCCBB.", ".BBBBBB."],
    palette: { A: "#e0b030", B: "#c4b8a0", C: "#3a2418" },
  },
  aquaduct: {
    grid: ["AAAAAAAA", "CCCCCCCC", "A..AA..A", "A..AA..A", "A..AA..A", "A..AA..A", "A..AA..A", "AAAAAAAA"],
    palette: { A: "#9c8f7a", C: "#5a9fa8" },
  },
  bibliotheek: {
    grid: ["........", ".AAAAAA.", ".ACCACC.", ".ACCACC.", ".ACCACC.", ".ACCACC.", ".AAAAAA.", "........"],
    palette: { A: "#6a3a2a", C: "#e8e0d0" },
  },
  markt: {
    grid: ["ABABABAB", "ABABABAB", "C......C", "C.DD.D.C", "C......C", "CEEEEEEC", "C......C", "C......C"],
    palette: { A: "#a03a2a", B: "#e8e0d0", C: "#7a4a28", D: "#e0b030", E: "#9a6a3a" },
  },
  opslagplaats: {
    grid: ["........", ".AAAAAA.", ".ABBBBA.", ".AABBAA.", ".ABBBBA.", ".AAAAAA.", "........", "........"],
    palette: { A: "#7a4a28", B: "#c9915a" },
  },
  smederij: {
    grid: ["........", "AAAAAAA.", ".AAAAAAA", "..AAAA..", "...AA...", "..AAAA..", ".AAAAAA.", "........"],
    palette: { A: "#5c5c66" },
  },
  barakken: {
    grid: ["AB......", "ABB.....", "A.......", "CCCCCCCC", "CCDDDDCC", "CCDEEDCC", "CCDEEDCC", "CCCCCCCC"],
    palette: { A: "#7a4a28", B: "#a03030", C: "#7d7d76", D: "#5c5c66", E: "#2a2a30" },
  },
  roofdier: {
    grid: ["A......A", "AA....AA", "AAAAAAAA", "AYAAAAYA", "AAAAAAAA", ".AACCAA.", "..ACCA..", "...CC..."],
    palette: { A: "#6a6a70", Y: "#e0b030", C: "#2a2a30" },
  },
} satisfies Record<string, PixelIconSpec>;

export type GebouwIcoonSleutel = keyof typeof GEBOUW_ICONEN;
export type EncyclopedieIcoonSleutel = GebouwIcoonSleutel | HudResourceType;

// Onrust-badge (rode "!" rechtsboven): laat zien dat het gebouw onder onrust
// staat (issue: "een boerderij, mijn, steengroeve, wachttoren en heiligdom
// icoontje met onrust erop").
const ONRUST_BADGE: [number, number, string][] = [
  ...[5, 6, 7].flatMap((x) => [0, 1, 2, 3].map((y): [number, number, string] => [x, y, "#c0392b"])),
  [6, 0, "#ffffff"],
  [6, 1, "#ffffff"],
  [6, 3, "#ffffff"],
];

function icoonSpec(sleutel: EncyclopedieIcoonSleutel): PixelIconSpec {
  return sleutel in GEBOUW_ICONEN
    ? GEBOUW_ICONEN[sleutel as GebouwIcoonSleutel]
    : PIXEL_ICONEN[sleutel as HudResourceType];
}

export function EncyclopedieIcoon({
  sleutel,
  onrust = false,
  grootte = 28,
}: {
  sleutel: EncyclopedieIcoonSleutel;
  onrust?: boolean;
  grootte?: number;
}) {
  const { grid, palette } = icoonSpec(sleutel);
  return (
    <svg
      aria-hidden="true"
      width={grootte}
      height={grootte}
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
      style={{ flexShrink: 0 }}
    >
      {grid.flatMap((rij, y) =>
        rij.split("").map((teken, x) => {
          const kleur = palette[teken];
          return kleur ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={kleur} /> : null;
        })
      )}
      {onrust &&
        ONRUST_BADGE.map(([x, y, kleur]) => <rect key={`o${x}-${y}`} x={x} y={y} width={1} height={1} fill={kleur} />)}
    </svg>
  );
}

export interface IcoonRijItem {
  icoon: EncyclopedieIcoonSleutel;
  onrust?: boolean;
}

// Meerdere icoontjes naast elkaar (bv. een streek die "vol staat" met
// onrust-gebouwen).
export function IcoonRij({ items }: { items: IcoonRijItem[] }) {
  return (
    <span style={{ display: "inline-flex", gap: "0.25rem", flexWrap: "wrap", alignItems: "center" }}>
      {items.map((item, i) => (
        <EncyclopedieIcoon key={i} sleutel={item.icoon} onrust={item.onrust} />
      ))}
    </span>
  );
}
