"use client";

import { ReactNode } from "react";
import ResourceIcoon from "./ResourceIcoon";
import { berekenEconomieOverzicht } from "@/game/economie";
import { MATERIAAL_LABELS } from "@/game/improvements";
import { berekenBoerderijOpbrengstRuw } from "@/game/productie";
import { GameState, MateriaalType } from "@/game/types";

interface EconomieOverzichtPaneelProps {
  state: GameState;
  onSluiten: () => void;
}

// Rijtje met huidige voorraad + netto verandering volgende beurt voor één
// resource-type — een positieve verandering in groen, negatief in rood, nul
// gedempt (geen op-/neergaande claim als er niets verandert).
function ResourceRegel({
  label,
  huidig,
  verandering,
}: {
  label: ReactNode;
  huidig: number;
  verandering: number;
}) {
  // `Math.round` op zowel huidig als verandering zorgt dat dit paneel altijd
  // hele getallen toont, ook voor cultuur/wetenschap die intern fractioneel
  // blijven (issue: "Voedsel hele getallen").
  const gerondeVerandering = Math.round(verandering);
  const teken = gerondeVerandering > 0 ? "+" : gerondeVerandering < 0 ? "" : "±";
  const kleur =
    gerondeVerandering > 0
      ? "var(--kleur-groen, #4a8f4a)"
      : gerondeVerandering < 0
        ? "var(--kleur-rood, #b04a3a)"
        : "var(--kleur-tekst-gedempt)";

  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
      <span>{label}</span>
      <span>
        {Math.round(huidig)} <span style={{ color: kleur }}>({teken}{gerondeVerandering})</span>
      </span>
    </div>
  );
}

// Ingesprongen sub-regel onder Voedsel (issue: "Economie scherm breakdown",
// eerste, bewust kleinere stap — voor nu alleen de ruwe boerderijopbrengst,
// zonder de tech-/onrust-modifiers die de latere volledige uitsplitsing wel
// zal tonen).
function BoerderijSubRegel({ opbrengst }: { opbrengst: number }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "0.75rem",
        paddingLeft: "1.25rem",
        color: "var(--kleur-tekst-gedempt)",
        fontSize: "0.8rem",
      }}
    >
      <span>Boerderijen (volgende beurt)</span>
      <span style={{ color: "var(--kleur-groen, #4a8f4a)" }}>+{Math.round(opbrengst)}</span>
    </div>
  );
}

// Economie-overzicht (issue: "Economie overzicht" — "een knop waarop je een
// economie overzicht kunt inzien ... hoeveel resources er volgende beurt
// vanaf of en bij komen ... alle grondstoffen, voedsel, cultuur en
// wetenschap"): puur informatief, net als TechboomPaneel/HistoriePaneel —
// bereikbaar via het hoofdmenu, zelfde paneel-patroon.
export default function EconomieOverzichtPaneel({ state, onSluiten }: EconomieOverzichtPaneelProps) {
  const overzicht = berekenEconomieOverzicht(state);
  const materiaalTypes = Object.keys(MATERIAAL_LABELS) as MateriaalType[];
  const boerderijOpbrengstRuw = berekenBoerderijOpbrengstRuw(state);

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
          gap: "0.75rem",
          padding: "1rem 1.25rem",
          fontSize: "0.9rem",
          width: "min(24rem, 100%)",
        }}
      >
        <strong className="fc-heading" style={{ color: "var(--kleur-oker)" }}>
          Economie-overzicht
        </strong>
        <span style={{ color: "var(--kleur-tekst-gedempt)" }}>Verwachte verandering volgende beurt</span>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {materiaalTypes.map((type) => (
            <ResourceRegel
              key={type}
              label={<ResourceIcoon type={type} />}
              huidig={state.voorraad[type]}
              verandering={overzicht[type]}
            />
          ))}
          <ResourceRegel label={<ResourceIcoon type="voedsel" />} huidig={state.voedsel} verandering={overzicht.voedsel} />
          <BoerderijSubRegel opbrengst={boerderijOpbrengstRuw} />
          <ResourceRegel label={<ResourceIcoon type="cultuur" />} huidig={state.cultuur} verandering={overzicht.cultuur} />
          <ResourceRegel
            label={<ResourceIcoon type="wetenschap" />}
            huidig={state.wetenschap}
            verandering={overzicht.wetenschap}
          />
        </div>

        <button className="fc-knop" onClick={onSluiten} style={{ padding: "0.35rem 0.75rem", alignSelf: "flex-start" }}>
          Sluiten
        </button>
      </div>
    </div>
  );
}
