"use client";

import { NIEUWE_SETTLER, WOONWIJK } from "@/game/improvements";
import { GameState } from "@/game/types";
import { VOEDSEL_DREMPEL_GROEI } from "@/game/world";
import { KostenIcons } from "./ResourceIcoon";
import RushMetGoudKnop from "./RushMetGoudKnop";

interface CivielPaneelProps {
  state: GameState;
  onStartGroei: () => void;
  onStartNieuweSettler: () => void;
  onVersnelCiviel: () => void;
}

// Civiele keuzes (M6, hoofdstuk 4/11/16): toont de voortgang richting de
// groei-tier klein→middel, de eventuele "kritiek"-verval-waarschuwing, én
// (hoofdstuk 3/11/13, issue: "stad stichten op de frontier" deel 4) de optie
// om een nieuwe settler uit te rusten. Groei en een nieuwe settler delen
// dezelfde `civielInAanbouw`-wachtrij (economie.ts) — hoogstens één van de
// twee tegelijk, een bewuste keuze (hoofdstuk 11: "investeer je in de stad
// waar je staat, of rust je een expeditie uit om verder te trekken?") in
// plaats van een stille state-flip. Puur placeholder-styling — geen
// definitieve UI.
export default function CivielPaneel({ state, onStartGroei, onStartNieuweSettler, onVersnelCiviel }: CivielPaneelProps) {
  const { stad, voedsel, settler } = state;

  const kanGroeien = stad.grootte === "klein";
  // Hoofdstuk 11: "de settler verschijnt alleen als optie in de civiele pool
  // als het huidige aantal settlers lager is dan het aantal steden" — in de
  // MVP (hoofdstuk 13: precies 1 stad) is dat alleen zolang er nog geen
  // settler bestaat (vóór beurt 2, zie economie.ts `volgendeBeurt`).
  const kanNieuweSettler = !settler;

  if (!kanGroeien && !kanNieuweSettler && !stad.civielInAanbouw) {
    return null;
  }

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
        Civiel
      </strong>

      {stad.vervalStatus === "kritiek" && (
        <p style={{ color: "var(--kleur-gevaar)", fontWeight: "bold", margin: 0 }}>
          ⚠ Kritiek: er is te weinig voedsel. Instorting over {stad.vervalBeurtenResterend}{" "}
          beurten als dit niet verandert.
        </p>
      )}

      {stad.civielInAanbouw && (
        <p style={{ margin: 0 }}>
          {stad.civielInAanbouw.improvement.id === "nieuwe-settler"
            ? "Nieuwe settler wordt uitgerust…"
            : "Woonwijk in aanbouw (groei naar middel)…"}
        </p>
      )}

      {/* Rush-bouwen met goud (hoofdstuk 5/14, issue: "toevoeging Goud" Deel
          2) geldt alleen voor land- en city-improvements — een Nieuwe settler
          is `soort: "unit"` en blijft dus buiten bereik. */}
      {stad.civielInAanbouw?.improvement.soort === "city" && (
        <RushMetGoudKnop
          improvement={stad.civielInAanbouw.improvement}
          voortgang={stad.civielInAanbouw.voortgang}
          goudInVoorraad={state.voorraad.goud}
          onVersnellen={onVersnelCiviel}
        />
      )}

      {!stad.civielInAanbouw && kanGroeien && voedsel >= VOEDSEL_DREMPEL_GROEI && (
        <button className="fc-knop" onClick={onStartGroei} style={{ padding: "0.35rem 0.75rem", alignSelf: "flex-start" }}>
          Start groei naar middel (<KostenIcons kosten={WOONWIJK.kosten} />, {WOONWIJK.bouwtijdBeurten} beurten)
        </button>
      )}

      {!stad.civielInAanbouw && kanGroeien && voedsel < VOEDSEL_DREMPEL_GROEI && (
        <p style={{ margin: 0 }}>
          Voedsel: {voedsel} / {VOEDSEL_DREMPEL_GROEI} (naar groei middel)
        </p>
      )}

      {!stad.civielInAanbouw && kanNieuweSettler && (
        <button
          className="fc-knop"
          onClick={onStartNieuweSettler}
          style={{ padding: "0.35rem 0.75rem", alignSelf: "flex-start" }}
        >
          Rust een nieuwe settler uit (<KostenIcons kosten={NIEUWE_SETTLER.kosten} />,{" "}
          {NIEUWE_SETTLER.bouwtijdBeurten} beurten)
        </button>
      )}
    </div>
  );
}
