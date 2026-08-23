"use client";

import { kanTweedeSettlerBouwen } from "@/game/groeiEnRekrutering";
import { aquaductVoedseldrempelVerlaging, GROTE_WOONWIJK, NIEUWE_SETTLER, WOONWIJK } from "@/game/improvements";
import { City, GameState } from "@/game/types";
import { VOEDSEL_DREMPEL_GROEI, VOEDSEL_DREMPEL_GROEI_GROOT } from "@/game/world";
import { KostenIcons } from "./ResourceIcoon";
import RushMetGoudKnop from "./RushMetGoudKnop";

// Groei-tier-improvement/-drempel voor de huidige stad (hoofdstuk 3/4/13/14,
// issue: "city improvements" Deel 2 — de tweede groei-stap, middel→groot,
// ontbrak nog volledig). Zelfde keuze als `groeiTierImprovement`/
// `groeiTierVoedselDrempel` in groeiEnRekrutering.ts, hier puur voor de
// weergave — inclusief de Aquaduct-verlaging (issue #285) van de tweede
// drempel, zodat dit paneel dezelfde drempel toont als `startGroei` hanteert.
function groeiTierVoorGrootte(stad: City) {
  if (stad.grootte === "klein") return { improvement: WOONWIJK, drempel: VOEDSEL_DREMPEL_GROEI, naarGrootte: "middel" };
  if (stad.grootte === "middel")
    return {
      improvement: GROTE_WOONWIJK,
      drempel: VOEDSEL_DREMPEL_GROEI_GROOT - aquaductVoedseldrempelVerlaging(stad.cityImprovements),
      naarGrootte: "groot",
    };
  return undefined;
}

interface CivielPaneelProps {
  state: GameState;
  onStartGroei: () => void;
  onStartNieuweSettler: () => void;
  onStartTweedeSettler: () => void;
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
export default function CivielPaneel({
  state,
  onStartGroei,
  onStartNieuweSettler,
  onStartTweedeSettler,
  onVersnelCiviel,
}: CivielPaneelProps) {
  const { stad, voedsel, settler } = state;

  const groeiTier = groeiTierVoorGrootte(stad);
  const kanGroeien = groeiTier !== undefined;
  // Hoofdstuk 11: "de settler verschijnt alleen als optie in de civiele pool
  // als het huidige aantal settlers lager is dan het aantal steden" — in de
  // MVP (hoofdstuk 13: precies 1 stad) is dat alleen zolang er nog geen
  // settler bestaat (vóór beurt 2, zie economie.ts `volgendeBeurt`).
  const kanNieuweSettler = !settler;
  // Tweede settler (issue: "Altijd 2e settler" #236): eigen wachtrij, los
  // van `civielInAanbouw` hierboven — zie `kanTweedeSettlerBouwen`
  // (groeiEnRekrutering.ts) voor de precieze voorwaarden (streek 7,
  // permanent herbouwbaar).
  const kanTweedeSettler = kanTweedeSettlerBouwen(state);

  if (!kanGroeien && !kanNieuweSettler && !stad.civielInAanbouw && !kanTweedeSettler && !stad.tweedeSettlerInAanbouw) {
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
            : `${stad.civielInAanbouw.improvement.naam} in aanbouw (groei naar ${
                (stad.civielInAanbouw.improvement.effect.naarGrootte as string) ?? "?"
              })…`}
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

      {!stad.civielInAanbouw && groeiTier && voedsel >= groeiTier.drempel && (
        <button className="fc-knop" onClick={onStartGroei} style={{ padding: "0.35rem 0.75rem", alignSelf: "flex-start" }}>
          Start groei naar {groeiTier.naarGrootte} (<KostenIcons kosten={groeiTier.improvement.kosten} />,{" "}
          {groeiTier.improvement.bouwtijdBeurten} beurten)
        </button>
      )}

      {!stad.civielInAanbouw && groeiTier && voedsel < groeiTier.drempel && (
        <p style={{ margin: 0 }}>
          Voedsel: {voedsel} / {groeiTier.drempel} (naar groei {groeiTier.naarGrootte})
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

      {/* Tweede settler (issue: "Altijd 2e settler" #236): eigen wachtrij,
          los van `civielInAanbouw` hierboven — daarom hier zonder de
          `!stad.civielInAanbouw`-voorwaarde, groei/eerste-settler en de
          tweede settler lopen bewust onafhankelijk van elkaar. */}
      {stad.tweedeSettlerInAanbouw && <p style={{ margin: 0 }}>Tweede settler wordt uitgerust…</p>}

      {!stad.tweedeSettlerInAanbouw && kanTweedeSettler && (
        <button
          className="fc-knop"
          onClick={onStartTweedeSettler}
          style={{ padding: "0.35rem 0.75rem", alignSelf: "flex-start" }}
        >
          Rust een tweede settler uit (<KostenIcons kosten={NIEUWE_SETTLER.kosten} />,{" "}
          {NIEUWE_SETTLER.bouwtijdBeurten} beurten)
        </button>
      )}
    </div>
  );
}
