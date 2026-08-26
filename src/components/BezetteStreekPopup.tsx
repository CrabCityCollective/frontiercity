"use client";

import { BEZETTE_STREEK_TEKST, BEZETTE_STREEK_TITEL } from "@/game/tutorialContent";

interface BezetteStreekPopupProps {
  onDoorgaan: () => void;
}

// Bezette-Streek-uitleg-pop-up (hoofdstuk 6, issue: "De Bezette Streek,
// missionaris en verkenner", Deel 2): verschijnt zodra streek 13 "in beeld
// komt" (economie.ts: `verwerkStreekOntgrendeling` zet `bezetteStreekOntdektEvent`
// — dezelfde soort trigger als de gegarandeerde Amberader-vondst op streek 8).
// Zelfde blokkerende overlay/stijl als de overige dynamische pop-ups
// (IndringersPopup/KuddePopup) — vervangt de eerdere, kleinere
// MilitairUitlegPopup volledig.
export default function BezetteStreekPopup({ onDoorgaan }: BezetteStreekPopupProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(10, 8, 6, 0.72)",
        padding: "1rem",
        zIndex: 20,
      }}
    >
      <div
        className="fc-paneel"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          padding: "1.25rem 1.5rem",
          maxWidth: "32rem",
          textAlign: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/scenes/stam-van-de-mammoet.png"
          alt=""
          style={{
            width: "100%",
            maxWidth: "26rem",
            height: "auto",
            display: "block",
            alignSelf: "center",
            border: "3px solid var(--kleur-oker)",
            boxShadow: "0 6px 18px rgba(0, 0, 0, 0.55)",
          }}
        />
        <strong className="fc-heading" style={{ color: "var(--kleur-gevaar)" }}>
          {BEZETTE_STREEK_TITEL}
        </strong>
        <p style={{ margin: 0, lineHeight: 1.6 }}>{BEZETTE_STREEK_TEKST}</p>
        <button className="fc-knop" onClick={onDoorgaan} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
          Begrepen
        </button>
      </div>
    </div>
  );
}
