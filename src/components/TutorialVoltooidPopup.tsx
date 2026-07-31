"use client";

import { TUTORIAL_LAAG_CONTENT, TUTORIAL_VOLTOOID_INTRO, TUTORIAL_VOLTOOID_TITEL } from "@/game/tutorialContent";

interface TutorialVoltooidPopupProps {
  onDoorgaan: () => void;
}

// Tutorial-voltooid-pop-up (issue: "pop-up met een summary van wat je
// geleerd hebt", getoond na het winnen van de confrontatie op laag 12): vat
// de mechanieken samen door dezelfde `TUTORIAL_LAAG_CONTENT` te doorlopen als
// LaagPopup/LaagIntroPaneel, in plaats van een tweede lijst bij te houden die
// uit de pas kan lopen met die twee.
export default function TutorialVoltooidPopup({ onDoorgaan }: TutorialVoltooidPopupProps) {
  const lagen = Object.entries(TUTORIAL_LAAG_CONTENT)
    .map(([hoogte, content]) => ({ hoogte: Number(hoogte), ...content }))
    .sort((a, b) => a.hoogte - b.hoogte);

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
          maxHeight: "80vh",
          overflowY: "auto",
          textAlign: "center",
        }}
      >
        <strong className="fc-heading" style={{ color: "var(--kleur-oker)" }}>
          {TUTORIAL_VOLTOOID_TITEL}
        </strong>
        <p style={{ margin: 0, lineHeight: 1.6 }}>{TUTORIAL_VOLTOOID_INTRO}</p>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", textAlign: "left", lineHeight: 1.8 }}>
          {lagen.map((laag) => (
            <li key={laag.hoogte}>
              Laag {laag.hoogte} — {laag.mechaniek}
            </li>
          ))}
        </ul>
        <button className="fc-knop" onClick={onDoorgaan} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
          Doorgaan
        </button>
      </div>
    </div>
  );
}
