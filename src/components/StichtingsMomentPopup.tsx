"use client";

import { STICHTINGSMOMENT_TEKST } from "@/game/goingWestContent";

interface StichtingsMomentPopupProps {
  stadNaam: string;
  onDoorgaan: () => void;
}

// Stichtingsmoment-pop-up (issue #278, hoofdstuk 9 Deel 2/hoofdstuk 19
// "Samenhang" design-doc): Going West-equivalent van
// `TutorialVoltooidPopup`, maar getoond bij élke stichting binnen het
// herhalende drie-stichtingsmomenten-patroon, niet alleen de allerlaatste —
// en anders dan de tutorial-versie beëindigt dit de run niet, `onDoorgaan`
// sluit de pop-up hier alleen (zie GameRoot: `toonStichtingsMomentPopup`).
// Plaatje en tekst zijn bewust nog placeholder (issue #278: "een mooi
// momentje... met een mooi plaatje en tekst die ik later nog ga bedenken").
export default function StichtingsMomentPopup({ stadNaam, onDoorgaan }: StichtingsMomentPopupProps) {
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
          src="/assets/scenes/stad-stichting-going-west.png"
          alt=""
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            border: "3px solid var(--kleur-roest)",
            boxShadow: "0 6px 18px rgba(0, 0, 0, 0.55)",
          }}
        />
        <strong className="fc-heading" style={{ color: "var(--kleur-oker)" }}>{stadNaam} — gesticht</strong>
        <p style={{ margin: 0, whiteSpace: "pre-line", lineHeight: 1.6 }}>{STICHTINGSMOMENT_TEKST}</p>
        <button className="fc-knop" onClick={onDoorgaan} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
          Doorgaan
        </button>
      </div>
    </div>
  );
}
