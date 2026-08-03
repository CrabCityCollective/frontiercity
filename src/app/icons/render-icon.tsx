import { ImageResponse } from "next/og";

// Warm/aards Riven-palet (zie CLAUDE.md): donkerbruin leem + oranje vuur,
// als eenvoudig plaatshouder-icoon voor "De Eerste Vuren".
const BG = "#3d2e26";
const FG = "#d67a2c";

export function renderIcon(size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BG,
        }}
      >
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: `${size * 0.28}px solid transparent`,
            borderRight: `${size * 0.28}px solid transparent`,
            borderBottom: `${size * 0.5}px solid ${FG}`,
          }}
        />
      </div>
    ),
    { width: size, height: size }
  );
}
