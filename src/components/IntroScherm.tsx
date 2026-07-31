"use client";

import { INTRO_FLAVOR_TEKST, INTRO_SUBTITEL, INTRO_TITEL } from "@/game/tutorialContent";

interface IntroSchermProps {
  onBeginnen: () => void;
}

// Introscherm (issue: "intro en game over scherm"), getoond vóór de speler
// iets van de tutorial ziet: sfeerbeeld + flavor-tekst uit hoofdstuk 10, in de
// Riven/Myst-stijl van hoofdstuk 12/13. Blokkeert de rest van de UI tot de
// speler bevestigt — daarna blijft dat bevestigd (zie save.ts
// `markeerIntroGezien`), zodat een reload niet elke keer opnieuw opent.
export default function IntroScherm({ onBeginnen }: IntroSchermProps) {
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
        background: "#100d0a",
        color: "#e8dcc8",
        fontFamily: "sans-serif",
        padding: "1.5rem",
        zIndex: 100,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/scenes/intro.jpg"
        alt=""
        style={{ width: "100%", maxWidth: "720px", height: "auto", display: "block" }}
      />
      <div style={{ textAlign: "center", maxWidth: "540px" }}>
        <h1 style={{ margin: "0 0 0.25rem", fontSize: "1.6rem" }}>{INTRO_TITEL}</h1>
        <p style={{ margin: "0 0 1rem", fontStyle: "italic", color: "#b7a888" }}>{INTRO_SUBTITEL}</p>
        <p style={{ margin: 0, whiteSpace: "pre-line", lineHeight: 1.6 }}>{INTRO_FLAVOR_TEKST}</p>
      </div>
      <button onClick={onBeginnen} style={{ padding: "0.6rem 1.5rem", fontSize: "1rem" }}>
        Beginnen
      </button>
    </div>
  );
}
