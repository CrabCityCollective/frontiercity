"use client";

import BezetteStreekPaneel from "./BezetteStreekPaneel";
import CivielPaneel from "./CivielPaneel";
import MilitairPaneel from "./MilitairPaneel";
import OpslagplaatsPaneel from "./OpslagplaatsPaneel";
import StadsverbeteringenPaneel from "./StadsverbeteringenPaneel";
import { GameState, Improvement } from "@/game/types";

interface StadMenuPopupProps {
  state: GameState;
  legerwaarde: number;
  tegenstanderSterkte: number;
  onStartGroei: () => void;
  onStartNieuweSettler: () => void;
  onStartTweedeSettler: () => void;
  onStartOpslagplaats: () => void;
  onStartCityVerbetering: (improvement: Improvement) => void;
  onVersnelCityVerbetering: () => void;
  onStartRecrutering: () => void;
  onKiesStrijderVoorLegerkamp: (strijderId: string) => void;
  onHaalTerug: (strijderId: string) => void;
  onVersnelCiviel: () => void;
  onVersnelOpslagplaats: () => void;
  onStartVerkennerRecrutering: () => void;
  onActiveerVerkenningsModus: () => void;
  verkenningsModusActief: boolean;
  onStartMissionarisRecrutering: () => void;
  onConfrontatieBezetteStreek: (positieInStreek: number) => void;
  onSluiten: () => void;
}

// City-improvement-menu (issue: "city improvement menu toevoegen"): een
// pop-up die opent zodra de speler op de stad-tile klikt (zie GameRoot:
// `handleTileClick`), en die alle acties bundelt die voorheen als losse,
// altijd-in-beeld dozen op de kaart stonden (CivielPaneel — inclusief de
// stad-upgrade, OpslagplaatsPaneel, MilitairPaneel) — inclusief het
// militaire paneel, dat voorheen apart getoggled werd via SpelActiesMenu.
// De drie panelen blijven ongewijzigd (zelfde props/logica), puur verplaatst
// van de doorlopende kaart-scroll naar hier.
export default function StadMenuPopup({
  state,
  legerwaarde,
  tegenstanderSterkte,
  onStartGroei,
  onStartNieuweSettler,
  onStartTweedeSettler,
  onStartOpslagplaats,
  onStartCityVerbetering,
  onVersnelCityVerbetering,
  onStartRecrutering,
  onKiesStrijderVoorLegerkamp,
  onHaalTerug,
  onVersnelCiviel,
  onVersnelOpslagplaats,
  onStartVerkennerRecrutering,
  onActiveerVerkenningsModus,
  verkenningsModusActief,
  onStartMissionarisRecrutering,
  onConfrontatieBezetteStreek,
  onSluiten,
}: StadMenuPopupProps) {
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
          gap: "0.25rem",
          padding: "1rem 1.25rem",
          maxWidth: "28rem",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <strong className="fc-heading" style={{ color: "var(--kleur-oker)" }}>
            {state.stad.naam}
          </strong>
          <button className="fc-knop" onClick={onSluiten} style={{ padding: "0.3rem 0.6rem" }}>
            Sluiten
          </button>
        </div>

        <CivielPaneel
          state={state}
          onStartGroei={onStartGroei}
          onStartNieuweSettler={onStartNieuweSettler}
          onStartTweedeSettler={onStartTweedeSettler}
          onVersnelCiviel={onVersnelCiviel}
        />
        <OpslagplaatsPaneel
          state={state}
          onStartOpslagplaats={onStartOpslagplaats}
          onVersnelOpslagplaats={onVersnelOpslagplaats}
        />
        <StadsverbeteringenPaneel
          state={state}
          onStartCityVerbetering={onStartCityVerbetering}
          onVersnelCityVerbetering={onVersnelCityVerbetering}
        />
        <MilitairPaneel
          state={state}
          legerwaarde={legerwaarde}
          tegenstanderSterkte={tegenstanderSterkte}
          onStartRecrutering={onStartRecrutering}
          onKiesStrijderVoorLegerkamp={onKiesStrijderVoorLegerkamp}
          onHaalTerug={onHaalTerug}
        />
        <BezetteStreekPaneel
          state={state}
          onStartVerkennerRecrutering={onStartVerkennerRecrutering}
          onActiveerVerkenningsModus={onActiveerVerkenningsModus}
          verkenningsModusActief={verkenningsModusActief}
          onStartMissionarisRecrutering={onStartMissionarisRecrutering}
          onConfrontatieBezetteStreek={onConfrontatieBezetteStreek}
        />
      </div>
    </div>
  );
}
