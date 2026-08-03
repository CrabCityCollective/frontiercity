"use client";

import { OPSLAGPLAATS } from "@/game/improvements";
import { GameState } from "@/game/types";
import { KostenIcons } from "./ResourceIcoon";

interface OpslagplaatsPaneelProps {
  state: GameState;
  onStartOpslagplaats: () => void;
}

// Opslagplaats (hoofdstuk 3/5/13/14, issue: "stad stichten op de frontier"
// deel 2): economische city improvement, verhoogt de gedeelde opslag-cap met
// +20. Altijd beschikbaar (geen drempel zoals groei) en herhaalbaar — een
// bewuste tussenstap richting het stichten van een nieuwe stad (deel 3: de
// stichtingskosten liggen hoger dan de start-cap), maar ook los daarvan
// nuttig. Zelfde altijd-zichtbare-paneel-patroon als CivielPaneel/SettlerPaneel.
export default function OpslagplaatsPaneel({ state, onStartOpslagplaats }: OpslagplaatsPaneelProps) {
  const { opslagplaatsInAanbouw } = state.stad;

  return (
    <div
      className="fc-paneel"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.4rem",
        padding: "0.75rem 1rem",
        fontSize: "0.9rem",
        margin: "0.5rem",
      }}
    >
      <strong className="fc-heading" style={{ color: "var(--kleur-oker)" }}>
        Opslagplaats
      </strong>
      <span style={{ color: "var(--kleur-tekst-gedempt)", fontSize: "0.8rem" }}>
        Huidige opslag-cap: {state.opslagCap} (per grondstof, hout/steen/erts/goud elk apart)
      </span>

      {opslagplaatsInAanbouw ? (
        <p style={{ margin: 0 }}>Opslagplaats in aanbouw…</p>
      ) : (
        <button
          className="fc-knop"
          onClick={onStartOpslagplaats}
          style={{ padding: "0.35rem 0.75rem", alignSelf: "flex-start" }}
        >
          Bouw Opslagplaats (<KostenIcons kosten={OPSLAGPLAATS.kosten} />, {OPSLAGPLAATS.bouwtijdBeurten} beurten, +
          {OPSLAGPLAATS.effect.waarde} opslag-cap)
        </button>
      )}
    </div>
  );
}
