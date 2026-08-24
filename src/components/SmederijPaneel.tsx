"use client";

import { SMEDERIJ, SMEDERIJ_GEREEDSCHAP_OPBRENGST } from "@/game/improvements";
import { GameState } from "@/game/types";
import { KostenIcons } from "./ResourceIcoon";
import RushMetGoudKnop from "./RushMetGoudKnop";

interface SmederijPaneelProps {
  state: GameState;
  onStartSmederij: () => void;
  onVersnelSmederij: () => void;
}

// Smederij (Going West, M21d, opdracht-wampanoag-opening.md §3): economische
// city improvement, buiten de city-improvement-cap — zelfde uitzondering en
// altijd-zichtbare-paneel-patroon als OpslagplaatsPaneel. Anders dan
// Opslagplaats niet herhaalbaar: eenmaal gebouwd toont dit paneel alleen nog
// de lopende conversie-status. Blijft, net als OpslagplaatsPaneel, ook buiten
// Going West gewoon in het stadsmenu staan — de tutorial ziet 'm alleen nooit
// gebouwd worden (geen erts-gedreven reden om dat te doen daar).
export default function SmederijPaneel({ state, onStartSmederij, onVersnelSmederij }: SmederijPaneelProps) {
  const { smederijInAanbouw, heeftSmederij } = state.stad;
  const ertsKosten = SMEDERIJ.effect.waarde ?? 0;

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
        Smederij
      </strong>

      {heeftSmederij ? (
        <span style={{ color: "var(--kleur-tekst-gedempt)", fontSize: "0.8rem" }}>
          Actief — zet elke beurt {ertsKosten} erts om in {SMEDERIJ_GEREEDSCHAP_OPBRENGST} gereedschap (indien
          voorradig). Gereedschap in voorraad: {state.gereedschap}.
        </span>
      ) : smederijInAanbouw ? (
        <>
          <p style={{ margin: 0 }}>Smederij in aanbouw…</p>
          <RushMetGoudKnop
            improvement={smederijInAanbouw.improvement}
            voortgang={smederijInAanbouw.voortgang}
            goudInVoorraad={state.voorraad.goud}
            onVersnellen={onVersnelSmederij}
          />
        </>
      ) : (
        <button
          className="fc-knop"
          onClick={onStartSmederij}
          style={{ padding: "0.35rem 0.75rem", alignSelf: "flex-start" }}
        >
          Bouw Smederij (<KostenIcons kosten={SMEDERIJ.kosten} />, {SMEDERIJ.bouwtijdBeurten} beurten, zet
          {ertsKosten} erts/beurt om in {SMEDERIJ_GEREEDSCHAP_OPBRENGST} gereedschap)
        </button>
      )}
    </div>
  );
}
