"use client";

import { WOONWIJK } from "@/game/improvements";
import { GameState, Improvement } from "@/game/types";
import { VOEDSEL_DREMPEL_GROEI } from "@/game/world";

function formatteerKosten(improvement: Improvement): string {
  const delen = Object.entries(improvement.kosten).map(([type, waarde]) => `${waarde} ${type}`);
  return delen.length > 0 ? delen.join(", ") : "gratis";
}

interface GroeiPaneelProps {
  state: GameState;
  onStartGroei: () => void;
}

// Groei & verval (M6, hoofdstuk 4/11): toont de voortgang richting de
// groei-tier klein→middel en de eventuele "kritiek"-verval-waarschuwing.
// Groei is een bewuste spelerskeuze (geen automatische ontgrendeling zoals
// cultuur, M5) — vandaar de knop in plaats van een stille state-flip.
// Puur placeholder-styling — geen definitieve UI.
export default function GroeiPaneel({ state, onStartGroei }: GroeiPaneelProps) {
  const { stad, voedsel } = state;

  if (stad.grootte !== "klein") {
    // Groot valt buiten de MVP-scope (hoofdstuk 13: alleen klein→middel).
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.4rem",
        padding: "0.75rem 1rem",
        background: "#20180f",
        color: "#e8dcc8",
        fontFamily: "sans-serif",
        fontSize: "0.9rem",
      }}
    >
      {stad.vervalStatus === "kritiek" && (
        <p style={{ color: "#e0684a", fontWeight: "bold", margin: 0 }}>
          ⚠ Kritiek: het omliggende land is grotendeels uitgeput. Instorting over{" "}
          {stad.vervalBeurtenResterend} beurten als dit niet afneemt.
        </p>
      )}

      {stad.groeiInAanbouw && (
        <p style={{ margin: 0 }}>Woonwijk in aanbouw (groei naar middel)…</p>
      )}

      {!stad.groeiInAanbouw && voedsel >= VOEDSEL_DREMPEL_GROEI && (
        <button onClick={onStartGroei} style={{ padding: "0.35rem 0.75rem", alignSelf: "flex-start" }}>
          Start groei naar middel ({formatteerKosten(WOONWIJK)}, {WOONWIJK.bouwtijdBeurten} beurten)
        </button>
      )}

      {!stad.groeiInAanbouw && voedsel < VOEDSEL_DREMPEL_GROEI && (
        <p style={{ margin: 0 }}>
          Voedsel: {voedsel} / {VOEDSEL_DREMPEL_GROEI} (naar groei middel)
        </p>
      )}
    </div>
  );
}
