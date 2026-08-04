import { ImageResponse } from "next/og";

// Warm/aards Riven-palet (zie CLAUDE.md): donkerbruin leem, hout en
// linnen crème, als eenvoudig plaatshouder-icoon van een huifkar
// voor "De Eerste Vuren".
const BG = "#3d2e26";
const CANVAS = "#e8d9c3";
const WOOD = "#8a5a34";
const WHEEL = "#2a1c14";
const ACCENT = "#d67a2c";

export function renderIcon(size: number) {
  const bodyWidth = size * 0.56;
  const wheelSize = size * 0.16;
  const rimWidth = Math.max(1, size * 0.012);

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
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: size * 0.46,
              height: size * 0.22,
              background: CANVAS,
              borderRadius: `${size * 0.23}px ${size * 0.23}px 0 0`,
            }}
          />
          <div
            style={{
              width: bodyWidth,
              height: size * 0.14,
              background: WOOD,
            }}
          />
          <div
            style={{
              display: "flex",
              width: bodyWidth,
              justifyContent: "space-between",
              marginTop: size * 0.02,
            }}
          >
            <div
              style={{
                width: wheelSize,
                height: wheelSize,
                borderRadius: "50%",
                background: WHEEL,
                border: `${rimWidth}px solid ${ACCENT}`,
              }}
            />
            <div
              style={{
                width: wheelSize,
                height: wheelSize,
                borderRadius: "50%",
                background: WHEEL,
                border: `${rimWidth}px solid ${ACCENT}`,
              }}
            />
          </div>
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
