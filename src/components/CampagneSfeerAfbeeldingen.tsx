// Pixel-art "sfeer"-afbeeldingen voor het campagne-select-scherm (issue:
// "sfeer afbeeldingen campagne select" — een vierkante, pixel-art
// stemmingsafbeelding naast de eerste twee campagne-blokken, met een
// simpele omlijsting). Zelfde aanpak als ResourceIcoon.tsx: een grid van
// "pixels" getekend als SVG-rects i.p.v. een afbeeldingsbestand, zodat er
// geen extra asset-pipeline nodig is. Placeholder-kwaliteit is prima in de
// MVP (CLAUDE.md: "functionaliteit gaat voor polish").

type PixelGrid = string[];

interface PixelSceneSpec {
  grid: PixelGrid;
  palette: Record<string, string>;
}

const GRID_GROOTTE = 16;

// "To the Elusive Coast" (tutorial, "De Eerste Vuren"): warme, schilderachtige
// kustscene in het Riven/Myst-palet (CLAUDE.md) — een hutje met het eerste
// kampvuur aan het water.
const TUTORIAL_SCENE: PixelSceneSpec = {
  grid: [
    "aaaaaaaaaaaaaaaa",
    "aaaaaaaaaaaaaaaa",
    "bbbbbbbbbbbbbbbb",
    "bbbbbbbbbbbbbbbb",
    "bbbbbbbbbbbbbbbb",
    "cccccccccccccccc",
    "cccccccccccccccc",
    "dddddddddddddddd",
    "ggggddddddddgggg",
    "eeeeeeeeeeeeeeee",
    "eeeeeeeeeeeeeeee",
    "eeeeeeggggeeeeee",
    "ffffffggggfhffff",
    "fffffffggfifffff",
    "ffffffffffffffff",
    "ffffffffffffffff",
  ],
  palette: {
    a: "#4a2f2a",
    b: "#7a4a34",
    c: "#c9834a",
    d: "#f2b25a",
    e: "#2c4a44",
    f: "#16302c",
    g: "#160f0a",
    h: "#f2a84a",
    i: "#ffe08a",
  },
};

// "Going West" (Amerikaanse campagne): donkerder, stoffig palet i.p.v. de
// warme tutorialsfeer (hoofdstuk 12 design-doc) — een huifkar bij het
// kampvuur tegen een schemerhemel, zelfde motief als
// public/assets/scenes/going-west-stichting.svg.
const GOING_WEST_SCENE: PixelSceneSpec = {
  grid: [
    "aaaaaaaaaaaaaaaa",
    "aaaaaaaaaaaaaaaa",
    "bbbbbbbbbbbbbbbb",
    "bbbbbbbbbbbbbbbb",
    "bbbbbbbbbbbbbbbb",
    "cccccccccccccccc",
    "cccccccccccccccc",
    "dddddddddddddddd",
    "eeeeddddddddeeee",
    "eeeeeeeeeeeeeeee",
    "eeeeeeeeeeeeeeee",
    "ffffffffffffffff",
    "ffffffggggffffff",
    "fffffffggfhfffff",
    "ffffffffffffffff",
    "ffffffffffffffff",
  ],
  palette: {
    a: "#3a2a22",
    b: "#6b4a30",
    c: "#8a5a34",
    d: "#f2a84a",
    e: "#2c1c14",
    f: "#241510",
    g: "#150c08",
    h: "#f7c46a",
  },
};

function PixelSceneSvg({ scene }: { scene: PixelSceneSpec }) {
  const { grid, palette } = scene;
  const cel = 16 / GRID_GROOTTE;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      preserveAspectRatio="xMidYMid slice"
    >
      {grid.flatMap((rij, y) =>
        rij.split("").map((teken, x) => {
          const kleur = palette[teken];
          if (!kleur) return null;
          return <rect key={`${x}-${y}`} x={x * cel} y={y * cel} width={cel} height={cel} fill={kleur} />;
        }),
      )}
    </svg>
  );
}

export function TutorialSfeerAfbeelding() {
  return <PixelSceneSvg scene={TUTORIAL_SCENE} />;
}

export function GoingWestSfeerAfbeelding() {
  return <PixelSceneSvg scene={GOING_WEST_SCENE} />;
}
