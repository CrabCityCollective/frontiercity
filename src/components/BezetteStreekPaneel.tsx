"use client";

import { BELEGERINGSDREMPEL, beschikbareMissionarissen } from "@/game/streekOntgrendeling";
import { GameState } from "@/game/types";

// Bezette-Streek-statusbalk (issue: "Bezette streek scherm" — vervangt het
// eerdere BezetteStreekPaneel in het stadsmenu volledig): alle acties
// (verkenner sturen, missionaris sturen, confrontatie aangaan) lopen sinds
// dit issue via een klik op de betreffende tile zelf (zie TileInfoPopup:
// `verkenningVraag`/`missionarisVraag`/`confrontatieVraag` in GameRoot) —
// "het scherm met zaken die je kunt doen met een bezette laag" hoort niet in
// hetzelfde scherm als de stad. Dit balkje is puur status: welke verkenners
// onderweg zijn en hoe ver elke wololo-meter staat, zodat de speler dat niet
// per se per tile hoeft na te gaan. Wordt rechtstreeks op de kaart getoond
// (GameRoot), niet in een pop-up — alleen zichtbaar zolang er een actieve
// Bezette Streek is (anders `null`).
export default function BezetteStreekPaneel({ state }: { state: GameState }) {
  const bezetteStreek = state.streken.find((l) => l.bezet);
  if (!bezetteStreek) return null;

  const onderwegTiles = bezetteStreek.tiles.filter((tile) => tile.verkenningInGang);
  const heiligdomTiles = bezetteStreek.tiles.filter(
    (tile) => tile.status === "actief" && tile.improvement?.id === "vijandelijk-heiligdom"
  );
  const wachttorenAantal = bezetteStreek.tiles.filter(
    (tile) => tile.status === "actief" && tile.improvement?.id === "vijandelijke-wachttoren"
  ).length;
  const vrijeMissionarissen = beschikbareMissionarissen(state).length;

  return (
    <div
      className="fc-paneel"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.3rem",
        padding: "0.5rem 0.9rem",
        fontSize: "0.85rem",
        margin: "0.5rem",
      }}
    >
      <strong className="fc-heading" style={{ color: "var(--kleur-gevaar)" }}>
        De Stam van de Mammoet — {bezetteStreek.hoogte}
      </strong>
      <span style={{ color: "var(--kleur-tekst-gedempt)" }}>
        Klik een verhuld vakje om een verkenner te sturen, een vijandelijke wachttoren voor een confrontatie, of een
        vijandelijk heiligdom om een missionaris te sturen ({vrijeMissionarissen} vrij inzetbaar).
        {wachttorenAantal > 0 && ` Nog ${wachttorenAantal} vijandelijke wachttoren${wachttorenAantal === 1 ? "" : "s"}.`}
      </span>

      {onderwegTiles.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
          {onderwegTiles.map((tile) => (
            <span key={tile.positieInStreek}>
              Verkenner onderweg naar vakje {tile.positieInStreek} — nog {tile.verkenningInGang!.beurtenResterend}{" "}
              {tile.verkenningInGang!.beurtenResterend === 1 ? "beurt" : "beurten"}.
            </span>
          ))}
        </div>
      )}

      {heiligdomTiles.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
          {heiligdomTiles.map((tile) => (
            <span key={tile.positieInStreek}>
              Heiligdom (vakje {tile.positieInStreek}) — wololo-meter: {tile.wololoVoortgang ?? 0} / {BELEGERINGSDREMPEL}
            </span>
          ))}
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
          {!state.laatsteConfrontatieBezetteStreek.gewonnen && " — een Legerkamp-strijder is verloren gegaan"}
        </p>
      )}
    </div>
  );
}
