"use client";

import { INTRO_FLAVOR_TEKST, INTRO_SUBTITEL, INTRO_TITEL } from "@/game/tutorialContent";

interface IntroSchermProps {
  onBeginnen: () => void;
}

// Introscherm (issue: "intro en game over scherm"), getoond vóór de speler
// iets van de tutorial ziet: sfeerbeeld + flavor-tekst uit hoofdstuk 10, in de
// Riven/Myst-stijl van hoofdstuk 12/13. Blokkeert de rest van de UI tot de
// speler bevestigt — dat gebeurt bij elke start van de tutorial opnieuw (zie
// GameRoot: `toonIntro`), niet slechts één keer per browser (issue: "als ik
// de tutorial aanklik vanuit het menu, zie ik het introscherm niet meer").
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
        background: "var(--kleur-aarde-diepst)",
        color: "var(--kleur-tekst)",
        padding: "1.5rem",
        zIndex: 100,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/scenes/intro.jpg"
        alt=""
        style={{
          width: "100%",
          maxWidth: "720px",
          height: "auto",
          display: "block",
          border: "3px solid var(--kleur-oker)",
          boxShadow: "0 6px 18px rgba(0, 0, 0, 0.55)",
        }}
      />
      <div className="fc-paneel" style={{ textAlign: "center", maxWidth: "540px", padding: "1.25rem 1.5rem" }}>
        <h1 style={{ margin: "0 0 0.25rem", fontSize: "1.6rem", color: "var(--kleur-oker)" }}>{INTRO_TITEL}</h1>
        <p style={{ margin: "0 0 1rem", fontStyle: "italic", color: "var(--kleur-tekst-gedempt)" }}>
          {INTRO_SUBTITEL}
        </p>
        <p style={{ margin: 0, whiteSpace: "pre-line", lineHeight: 1.6 }}>{INTRO_FLAVOR_TEKST}</p>
      </div>
      <button className="fc-knop" onClick={onBeginnen} style={{ padding: "0.6rem 1.5rem", fontSize: "1rem" }}>
        Beginnen
      </button>
    </div>
  );
}
