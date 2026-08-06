"use client";

import { STICHTING_KOSTEN } from "@/game/acties";
import { STICHT_STAD_TITEL, STICHT_STAD_WAARSCHUWING } from "@/game/tutorialContent";
import { KostenIcons } from "./ResourceIcoon";

interface StichtStadPopupProps {
  onBevestig: () => void;
  onAnnuleren: () => void;
}

// Stichtings-bevestiging (hoofdstuk 2/10/16, issue: "stad stichten op de
// frontier" deel 4): getoond zodra de speler op "Stad stichten" in
// SettlerPaneel klikt. Waarschuwt expliciet dat de settler verdwijnt — een
// onomkeerbare actie, dus een tussenstap in plaats van een directe
// klik-en-klaar-knop.
export default function StichtStadPopup({ onBevestig, onAnnuleren }: StichtStadPopupProps) {
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
        <strong className="fc-heading" style={{ color: "var(--kleur-oker)" }}>
          {STICHT_STAD_TITEL}
        </strong>
        <p style={{ margin: 0, lineHeight: 1.6, whiteSpace: "pre-line" }}>{STICHT_STAD_WAARSCHUWING}</p>
        <p
          style={{
            margin: 0,
            fontSize: "0.85rem",
            color: "var(--kleur-tekst-gedempt)",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          Kosten: <KostenIcons kosten={STICHTING_KOSTEN} />
        </p>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
          <button className="fc-knop" onClick={onBevestig} style={{ padding: "0.5rem 1.5rem" }}>
            Stad stichten
          </button>
          <button className="fc-knop" onClick={onAnnuleren} style={{ padding: "0.5rem 1.5rem" }}>
            Annuleren
          </button>
        </div>
      </div>
    </div>
  );
}
