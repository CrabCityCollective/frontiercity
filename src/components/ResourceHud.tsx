"use client";

import { MATERIAAL_LABELS } from "@/game/improvements";
import { wetenschapKostenVoorDrempel } from "@/game/techTree";
import { GameState, MateriaalType, TechDrempel } from "@/game/types";
import { cultuurKostenVoorLaag, hoogsteOntgrendeldeLaag } from "@/game/world";

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
  // Wetenschap → technologie-boom (hoofdstuk 3/9, issue: "tech tree
  // toevoegen") — zelfde label-patroon als cultuur hierboven, maar naar een
  // drempel (1-3) in plaats van een laag.
  const volgendeDrempel = (state.technologieen.length + 1) as TechDrempel;
  const wetenschapLabel =
    volgendeDrempel <= 3
      ? `Wetenschap: ${state.wetenschap} / ${wetenschapKostenVoorDrempel(volgendeDrempel)} (drempel ${volgendeDrempel})`
      : `Wetenschap: ${state.wetenschap} (technologie-boom compleet)`;

  return (
    <div className="resource-hud">
      <div className="resource-hud__items">
        {(Object.keys(MATERIAAL_LABELS) as MateriaalType[]).map((type) => (
          <span key={type}>
            {MATERIAAL_LABELS[type]}: {state.voorraad[type]} / {state.opslagCap}
          </span>
        ))}
        <span>Voedsel: {state.voedsel}</span>
        <span>{cultuurLabel}</span>
        <span>{wetenschapLabel}</span>
      </div>
      <div className="resource-hud__beurt">
        <span>Beurt: {state.beurt}</span>
        <button className="fc-knop" onClick={onVolgendeBeurt} style={{ padding: "0.35rem 0.75rem" }}>
          Volgende beurt
        </button>
      </div>
    </div>
  );
}
