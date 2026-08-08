"use client";

import { bouwStagneertVolgendeBeurt, resterendeBouwBeurten } from "@/game/bouwwachtrij";
import { BELEGERINGSDREMPEL, heeftOfferAltaar, kanVerkennen, VERKENNING_KOSTEN_WETENSCHAP } from "@/game/streekOntgrendeling";
import { kanConfrontatieBezetteStreek } from "@/game/militair";
import { MISSIONARIS, VERKENNER } from "@/game/improvements";
import { GameState } from "@/game/types";
import { KostenIcons } from "./ResourceIcoon";

interface BezetteStreekPaneelProps {
  state: GameState;
  onStartVerkennerRecrutering: () => void;
  onActiveerVerkenningsModus: () => void;
  verkenningsModusActief: boolean;
  onStartMissionarisRecrutering: () => void;
  onConfrontatieBezetteStreek: (positieInStreek: number) => void;
}

// Bezette Streek & Confrontatie (hoofdstuk 6, issue: "De Bezette Streek,
// missionaris en verkenner"): bundelt Verkenner-rekrutering + Verkenning,
// Missionaris-rekrutering + belegeringsmeter, en de lijst van mogelijke
// Confrontatie-doelen — alleen zichtbaar zolang er een actieve Bezette Streek
// is (anders `null`, zodat StadMenuPopup dit paneel altijd onvoorwaardelijk
// kan renderen, net als de overige panelen).
export default function BezetteStreekPaneel({
  state,
  onStartVerkennerRecrutering,
  onActiveerVerkenningsModus,
  verkenningsModusActief,
  onStartMissionarisRecrutering,
  onConfrontatieBezetteStreek,
}: BezetteStreekPaneelProps) {
  const bezetteStreek = state.streken.find((l) => l.bezet);
  if (!bezetteStreek) return null;

  const { stad } = state;
  const vijandelijkeWachttorens = bezetteStreek.tiles.filter(
    (tile) => tile.status === "actief" && tile.improvement?.id === "vijandelijke-wachttoren"
  );
  const heeftVijandelijkHeiligdom = bezetteStreek.tiles.some(
    (tile) =>
      (tile.status === "actief" && tile.improvement?.id === "vijandelijk-heiligdom") ||
      (tile.verhuld && tile.bezetteStreekInhoud === "heiligdom")
  );

  const verkennerResterend = stad.verkennerInAanbouw
    ? bouwStagneertVolgendeBeurt(stad.verkennerInAanbouw.improvement, stad.verkennerInAanbouw.voortgang, state.voorraad)
    : false;
  const missionarisResterend = stad.missionarisInAanbouw
    ? bouwStagneertVolgendeBeurt(stad.missionarisInAanbouw.improvement, stad.missionarisInAanbouw.voortgang, state.voorraad)
    : false;

  return (
    <div
      className="fc-paneel"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        padding: "0.75rem 1rem",
        fontSize: "0.9rem",
        margin: "0.5rem",
      }}
    >
      <strong className="fc-heading" style={{ color: "var(--kleur-gevaar)" }}>
        Bezette Streek — {bezetteStreek.hoogte}
      </strong>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        <span>Verkenners: {stad.verkenners.length}</span>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {stad.verkennerInAanbouw ? (
            <span>
              Verkenner in opleiding…{" "}
              {verkennerResterend ? (
                <span style={{ color: "var(--kleur-gevaar)" }}>⚠ tekort aan grondstoffen</span>
              ) : (
                `(nog ${resterendeBouwBeurten(stad.verkennerInAanbouw.improvement, stad.verkennerInAanbouw.voortgang)} beurten)`
              )}
            </span>
          ) : (
            <button className="fc-knop" onClick={onStartVerkennerRecrutering} style={{ padding: "0.3rem 0.6rem" }}>
              Verkenner opleiden (<KostenIcons kosten={VERKENNER.kosten} />, {VERKENNER.bouwtijdBeurten} beurten)
            </button>
          )}
          <button
            className="fc-knop"
            disabled={!kanVerkennen(state) && !verkenningsModusActief}
            onClick={onActiveerVerkenningsModus}
            title={
              stad.verkenners.length === 0
                ? "Vereist minstens één Verkenner"
                : state.verkenningGedaanDitBeurt
                  ? "Al verkend deze beurt"
                  : `Kost ${VERKENNING_KOSTEN_WETENSCHAP} wetenschap`
            }
            style={{ padding: "0.3rem 0.6rem" }}
          >
            {verkenningsModusActief ? "Kies een verhuld vakje op de kaart…" : `Verkennen (${VERKENNING_KOSTEN_WETENSCHAP} wetenschap)`}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        <span>Missionarissen: {stad.missionarissen.length}</span>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {stad.missionarisInAanbouw ? (
            <span>
              Missionaris in opleiding…{" "}
              {missionarisResterend ? (
                <span style={{ color: "var(--kleur-gevaar)" }}>⚠ tekort aan grondstoffen</span>
              ) : (
                `(nog ${resterendeBouwBeurten(stad.missionarisInAanbouw.improvement, stad.missionarisInAanbouw.voortgang)} beurten)`
              )}
            </span>
          ) : (
            <button
              className="fc-knop"
              disabled={!heeftOfferAltaar(state)}
              onClick={onStartMissionarisRecrutering}
              title={heeftOfferAltaar(state) ? undefined : "Vereist een voltooid Offer Altaar"}
              style={{ padding: "0.3rem 0.6rem", opacity: heeftOfferAltaar(state) ? 1 : 0.5 }}
            >
              Missionaris opleiden (<KostenIcons kosten={MISSIONARIS.kosten} />, {MISSIONARIS.bouwtijdBeurten} beurten)
            </button>
          )}
        </div>
        {heeftVijandelijkHeiligdom && (
          <span style={{ color: "var(--kleur-tekst-gedempt)", fontSize: "0.8rem" }}>
            Belegeringsmeter: {bezetteStreek.belegeringsVoortgang ?? 0} / {BELEGERINGSDREMPEL}
            {stad.missionarissen.length === 0
              ? " — bevroren zonder Missionaris"
              : stad.missionarissen.length > 1 && ` (${stad.missionarissen.length}× snelheid)`}
          </span>
        )}
      </div>

      {vijandelijkeWachttorens.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <span style={{ color: "var(--kleur-tekst-gedempt)" }}>Vijandelijke wachttorens:</span>
          {vijandelijkeWachttorens.map((tile) => {
            const kan = kanConfrontatieBezetteStreek(state, tile.positieInStreek);
            return (
              <button
                key={tile.positieInStreek}
                className="fc-knop"
                disabled={!kan}
                onClick={() => onConfrontatieBezetteStreek(tile.positieInStreek)}
                title={kan ? undefined : "Vereist een voltooide, bemande, wegverbonden eigen Wachttoren op de streek direct onder de Bezette Streek"}
                style={{ padding: "0.3rem 0.6rem", opacity: kan ? 1 : 0.5, alignSelf: "flex-start" }}
              >
                Confrontatie aangaan (vakje {tile.positieInStreek})
              </button>
            );
          })}
        </div>
      )}

      {state.laatsteConfrontatieBezetteStreek && (
        <p
          style={{
            margin: 0,
            color: state.laatsteConfrontatieBezetteStreek.gewonnen ? "var(--kleur-mos)" : "var(--kleur-gevaar)",
          }}
        >
          {state.laatsteConfrontatieBezetteStreek.gewonnen ? "Overwinning" : "Verlies"} (winkans was{" "}
          {Math.round(state.laatsteConfrontatieBezetteStreek.winkans * 100)}%)
          {!state.laatsteConfrontatieBezetteStreek.gewonnen && " — de bemannende strijder is verloren gegaan"}
        </p>
      )}
    </div>
  );
}
