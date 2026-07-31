"use client";

import { useEffect, useRef } from "react";
import { INEENSTORTING_FLAVOR_TEKST, INEENSTORTING_TITEL } from "@/game/tutorialContent";
import { SFEER_BREEDTE, SFEER_HOOGTE, tekenIneenstortingSfeer } from "@/render/sfeerScenes";

interface IneenstortingSchermProps {
  onDoorgaan: () => void;
}

// Ineenstortingsscherm (issue: "intro en game over scherm"), getoond zodra de
// stad instort (M6, hoofdstuk 4). In de MVP (één stad, geen
// frontier-verplaatsing) is dit een echt game-over: de run eindigt en de
// tutorial herstart vanaf het begin (issue: "run eindigen wanneer stad
// uitgeput is", hoofdstuk 4/11). Blokkeert de rest van de UI tot de speler
// bevestigt, net als het introscherm.
export default function IneenstortingScherm({ onDoorgaan }: IneenstortingSchermProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    tekenIneenstortingSfeer(ctx, canvas.width, canvas.height);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        background: "#0a0806",
        color: "#e8dcc8",
        fontFamily: "sans-serif",
        padding: "1.5rem",
        zIndex: 100,
      }}
    >
      <canvas
        ref={canvasRef}
        width={SFEER_BREEDTE}
        height={SFEER_HOOGTE}
        style={{ width: "100%", maxWidth: "720px", height: "auto", display: "block" }}
      />
      <div style={{ textAlign: "center", maxWidth: "540px" }}>
        <h1 style={{ margin: "0 0 1rem", fontSize: "1.6rem" }}>{INEENSTORTING_TITEL}</h1>
        <p style={{ margin: 0, whiteSpace: "pre-line", lineHeight: 1.6 }}>{INEENSTORTING_FLAVOR_TEKST}</p>
        <p style={{ margin: "1rem 0 0", fontSize: "0.85rem", color: "#b7a888" }}>
          Deze run is voorbij. Het Hertenpad-volk begint opnieuw bij de rivier.
        </p>
      </div>
      <button onClick={onDoorgaan} style={{ padding: "0.6rem 1.5rem", fontSize: "1rem" }}>
        Opnieuw beginnen
      </button>
    </div>
  );
}
