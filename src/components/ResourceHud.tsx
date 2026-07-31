"use client";

import { GameState, MateriaalType } from "@/game/types";
import { cultuurKostenVoorLaag, hoogsteOntgrendeldeLaag } from "@/game/world";

const MATERIAAL_LABELS: Record<MateriaalType, string> = {
  hout: "Hout",
  steen: "Steen",
  erts: "Erts",
  goud: "Goud",
};

interface ResourceHudProps {
  state: GameState;
  onVolgendeBeurt: () => void;
}

// HUD voor de gedeelde opslag, de losse voedselvoorraad en de beurtteller
// (M3: resource-economie). Puur placeholder-styling — geen definitieve UI.
export default function ResourceHud({ state, onVolgendeBeurt }: ResourceHudProps) {
  const volgendeLaagHoogte = hoogsteOntgrendeldeLaag(state.lagen) + 1;
  const cultuurLabel =
    volgendeLaagHoogte <= state.lagen.length
      ? `Cultuur: ${state.cultuur} / ${cultuurKostenVoorLaag(volgendeLaagHoogte)} (laag ${volgendeLaagHoogte})`
      : `Cultuur: ${state.cultuur} (alle lagen ontgrendeld)`;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1.25rem",
        padding: "0.75rem 1rem",
        background: "linear-gradient(180deg, var(--kleur-aarde-paneel), var(--kleur-aarde-donker))",
        color: "var(--kleur-tekst)",
        fontSize: "0.9rem",
        borderTop: "3px solid var(--kleur-oker)",
        boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.45)",
      }}
    >
      {(Object.keys(MATERIAAL_LABELS) as MateriaalType[]).map((type) => (
        <span key={type}>
          {MATERIAAL_LABELS[type]}: {state.voorraad[type]} / {state.opslagCap}
        </span>
      ))}
      <span>Voedsel: {state.voedsel}</span>
      <span>{cultuurLabel}</span>
      <span style={{ marginLeft: "auto" }}>Beurt: {state.beurt}</span>
      <button className="fc-knop" onClick={onVolgendeBeurt} style={{ padding: "0.35rem 0.75rem" }}>
        Volgende beurt
      </button>
    </div>
  );
}
