"use client";

import { MATERIAAL_LABELS } from "@/game/improvements";
import { wetenschapKostenVoorDrempel } from "@/game/techTree";
import { GameState, MateriaalType, TechDrempel } from "@/game/types";
import { cultuurKostenVoorStreek, hoogsteOntgrendeldeStreek } from "@/game/world";
import ResourceIcoon from "./ResourceIcoon";

interface ResourceHudProps {
  state: GameState;
}

// HUD voor de gedeelde opslag, de losse voedselvoorraad en de beurtteller
// (M3: resource-economie). Puur placeholder-styling — geen definitieve UI.
//
// Geen "Volgende beurt"-knop meer (issue: "beurt button helemaal weg") — de
// beurt gaat automatisch door zodra de settler zijn actie heeft gebruikt (of,
// vóór beurt 2, zodra de bouwkeuze van beurt 1 gemaakt is), zie
// `beurtMagAutomatischDoorgaan` in economie.ts.
export default function ResourceHud({ state }: ResourceHudProps) {
  const volgendeStreekHoogte = hoogsteOntgrendeldeStreek(state.streken) + 1;
  const cultuurLabel =
    volgendeStreekHoogte <= state.streken.length
      ? `${state.cultuur} / ${cultuurKostenVoorStreek(volgendeStreekHoogte)} (streek ${volgendeStreekHoogte})`
      : `${state.cultuur} (alle streken ontgrendeld)`;
  // Wetenschap → technologie-boom (hoofdstuk 3/9, issue: "tech tree
  // toevoegen") — zelfde label-patroon als cultuur hierboven, maar naar een
  // drempel (1-3) in plaats van een streek.
  const volgendeDrempel = (state.technologieen.length + 1) as TechDrempel;
  const wetenschapLabel =
    volgendeDrempel <= 3
      ? `${state.wetenschap} / ${wetenschapKostenVoorDrempel(volgendeDrempel)} (drempel ${volgendeDrempel})`
      : `${state.wetenschap} (technologie-boom compleet)`;

  return (
    <>
      <div className="beurt-blok">
        <span className="beurt-blok__label">Beurt: {state.beurt}</span>
      </div>
      <div className="resource-hud">
        <div className="resource-hud__items">
          {(Object.keys(MATERIAAL_LABELS) as MateriaalType[]).map((type) => (
            <span key={type} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
              <ResourceIcoon type={type} /> {state.voorraad[type]} / {state.opslagCap}
            </span>
          ))}
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
            <ResourceIcoon type="voedsel" /> {state.voedsel}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
            <ResourceIcoon type="cultuur" /> {cultuurLabel}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
            <ResourceIcoon type="wetenschap" /> {wetenschapLabel}
          </span>
        </div>
      </div>
    </>
  );
}
