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
        background: "#1a1410",
        color: "#e8dcc8",
        fontFamily: "sans-serif",
        fontSize: "0.9rem",
        borderBottom: "1px solid #3a2f22",
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
      <button onClick={onVolgendeBeurt} style={{ padding: "0.35rem 0.75rem" }}>
        Volgende beurt
      </button>
    </div>
  );
}
