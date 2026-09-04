"use client";

import { STAD_GESTICHT_TEKST } from "@/game/tutorialContent";

interface StadGestichtPopupProps {
  stadNaam: string;
  onDoorgaan: () => void;
}

// Stad-gesticht-pop-up (issue: "Tutorial" — "bij het stichten van de nieuwe
// stad van de tutorial wil ik ook graag de pop-up van de gestichte stad
// tonen ... ook al staat er nog geen tekst. En daarna pas graag de pop-up
// met de opsomming van alle streken"): getoond zodra `state.stadGesticht`
// waar wordt, vóór TutorialVoltooidPopup — tutorial-equivalent van Going
// West's `StichtingsMomentPopup`, die met dezelfde placeholder-tekst-aanpak
// werkt.
export default function StadGestichtPopup({ stadNaam, onDoorgaan }: StadGestichtPopupProps) {
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
          maxHeight: "85vh",
          overflowY: "auto",
          textAlign: "center",
        }}
      >
        <strong className="fc-heading" style={{ color: "var(--kleur-oker)" }}>
          {stadNaam} — gesticht
        </strong>
        <p style={{ margin: 0, whiteSpace: "pre-line", lineHeight: 1.6 }}>{STAD_GESTICHT_TEKST}</p>
        <button className="fc-knop" onClick={onDoorgaan} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
          Doorgaan
        </button>
      </div>
    </div>
  );
}
