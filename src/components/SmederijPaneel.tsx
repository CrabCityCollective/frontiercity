"use client";

import { useState } from "react";
import { SMEDERIJ,SMEDERIJ_GEREEDSCHAP_OPBRENGST } from "@/game/improvements";
import { GameState } from "@/game/types";
import { KostenIcons } from "./ResourceIcoon";
import RushMetGoudKnop from "./RushMetGoudKnop";

interface SmederijPaneelProps {
  state: GameState;
  onStartSmederij: () => void;
  onVersnelSmederij: () => void;
  onZetSmederijOpdracht: (aantal: number) => void;
}

// Smederij (Going West, M21d, opdracht-wampanoag-opening.md §3): economische
// city improvement, buiten de city-improvement-cap — zelfde uitzondering als
// OpslagplaatsPaneel. Anders dan Opslagplaats niet herhaalbaar: eenmaal
// gebouwd toont dit paneel alleen nog de lopende conversie-status (inclusief
// het invoerveld voor het aantal te maken gereedschap, issue: "Smederij"). Anders dan
// OpslagplaatsPaneel niet campagne-onafhankelijk zichtbaar: de
// erts→gereedschap-conversie hoort bij Going West, dus dit paneel (en de
// bijbehorende `startSmederij`-gate, groeiEnRekrutering.ts) blijft in de
// tutorial verborgen (issue: "Smederij niet in tutorial").
export default function SmederijPaneel({ state, onStartSmederij, onVersnelSmederij, onZetSmederijOpdracht }: SmederijPaneelProps) {
  const { smederijInAanbouw, heeftSmederij, smederijOpdracht } = state.stad;
  const [invoer, setInvoer] = useState("");
  const ertsKosten = SMEDERIJ.effect.waarde ?? 0;

  if (state.campagneId !== "going-west") return null;

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
        <>
          <span style={{ color: "var(--kleur-tekst-gedempt)", fontSize: "0.8rem" }}>
            {smederijOpdracht > 0
              ? `Bezig — nog ${smederijOpdracht} gereedschap te maken (${ertsKosten} erts per gereedschap, indien voorradig). Daarna gaat de Smederij vanzelf uit.`
              : "Uit — voer hieronder in hoeveel gereedschap er gemaakt moet worden."}{" "}
            Gereedschap in voorraad: {state.gereedschap}.
          </span>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              type="number"
              min={0}
              step={1}
              value={invoer}
              onChange={(e) => setInvoer(e.target.value)}
              aria-label="Aantal te maken gereedschap"
              style={{ width: "5rem", padding: "0.3rem" }}
            />
            <button
              className="fc-knop"
              onClick={() => {
                onZetSmederijOpdracht(Number(invoer));
                setInvoer("");
              }}
              style={{ padding: "0.35rem 0.75rem" }}
            >
              Maak gereedschap
            </button>
          </div>
        </>
      ) : smederijInAanbouw ? (
        <>
          <p style={{ margin: 0 }}>Smederij in aanbouw…</p>
          <RushMetGoudKnop
            improvement={smederijInAanbouw.improvement}
            voortgang={smederijInAanbouw.voortgang}
            goudInVoorraad={state.voorraad.goud}
            technologieen={state.technologieen}
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
