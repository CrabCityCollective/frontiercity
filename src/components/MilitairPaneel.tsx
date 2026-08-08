"use client";

import { bouwStagneertVolgendeBeurt, resterendeBouwBeurten } from "@/game/bouwwachtrij";
import { SOLDAAT } from "@/game/improvements";
import { GameState, ResourceType } from "@/game/types";
import { KostenIcons } from "./ResourceIcoon";

interface MilitairPaneelProps {
  state: GameState;
  legerwaarde: number;
  tegenstanderSterkte: number;
  onStartRecrutering: () => void;
  // Klik op het Legerkamp-icoontje naast een nog niet toegewezen strijder
  // (hoofdstuk 6, issue: "De Bezette Streek, missionaris en verkenner", Deel
  // 5) — zet meteen de legerkamp-kies-modus aan (zie WachttorenKiesBanner).
  // Wachttoren-toewijzing loopt sinds issue "wachttorens bemannen" niet meer
  // via dit paneel, maar via de wachttoren-tile zelf op de kaart (zie
  // TileInfoPopup: `wachttorenVraag`) — hier is alleen nog te zien hoeveel
  // strijders daarvoor nog vrij zijn.
  onKiesStrijderVoorLegerkamp: (strijderId: string) => void;
  // Klik op een aan een Legerkamp toegewezen strijder (hoofdstuk 6/11, issue:
  // "wachttorens, bemanning en bevoorrading" — toewijzing is niet langer
  // onomkeerbaar): haalt hem meteen terug, waarna hij direct weer inzetbaar
  // is voor een andere toewijzing (issue: "wachttoren tweaks" — verplaatsen
  // kost geen beurten). Een wachttoren-bemanning haal je terug via de
  // wachttoren-tile zelf, niet meer via dit paneel.
  onHaalTerug: (strijderId: string) => void;
}

// Militair (basis) (M7, hoofdstuk 6): rekruteren van Soldaat-eenheden, met de
// legerwaarde zichtbaar voor de speler. Legerkamp-toewijzing gebeurt via het
// kies-modus-icoontje hieronder; wachttoren-toewijzing (issue: "wachttorens
// bemannen") niet meer — dit paneel toont daarvoor alleen nog hoeveel
// strijders nog vrij zijn. Puur placeholder-styling — geen definitieve UI.
export default function MilitairPaneel({
  state,
  legerwaarde,
  tegenstanderSterkte,
  onStartRecrutering,
  onKiesStrijderVoorLegerkamp,
  onHaalTerug,
}: MilitairPaneelProps) {
  const { stad } = state;
  // Vrij = nog geen Wachttoren- én geen Legerkamp-toewijzing (issue:
  // "wachttorens bemannen": "je ziet alleen hoeveel strijders je hebt tot je
  // beschikking, die nog niet in een wachttoren zitten") — zelfde eis als
  // `bemanLegerkamp`/de wachttoren-keuzelijst (GameRoot) al stellen aan een
  // toewijsbare strijder.
  const vrijeStrijders = stad.strijders.filter((s) => !s.wachttoren && !s.legerkamp);
  // Apart geteld zodat je bij de stad meteen ziet hoeveel strijders al een
  // wachttoren bemannen (issue: "strijders in wachttorens" — "je moet ook
  // kunnen zien hoeveel strijders je in totaal hebt, en hoeveel daarvan dus
  // al in een wachttoren zitten"), naast het bestaande "vrij"-aantal.
  const wachttorenStrijders = stad.strijders.filter((s) => s.wachttoren);
  // Nog benodigde grondstoffen voor de lopende Soldaat-opleiding, en of die
  // volgende beurt stilligt door een tekort (issue: "wil ik graag zien welke
  // materialen nog nodig zijn ... en een attentie als de materialen niet
  // aanwezig zijn om de strijder af te maken volgende beurt") — zelfde
  // helpers als de tile-bouw-info (tileInfo.ts), hier toegepast op
  // `legerInAanbouw` in plaats van een land-tile.
  const legerResterend = stad.legerInAanbouw
    ? (Object.entries(stad.legerInAanbouw.voortgang) as [ResourceType, number][]).filter(
        ([, aantal]) => aantal > 0
      )
    : [];
  const legerStagneert = stad.legerInAanbouw
    ? bouwStagneertVolgendeBeurt(stad.legerInAanbouw.improvement, stad.legerInAanbouw.voortgang, state.voorraad)
    : false;

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
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <span>Legerwaarde: {legerwaarde}</span>
        <span>Dreiging op de frontier: {tegenstanderSterkte}</span>
      </div>

      {stad.strijders.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <span style={{ color: "var(--kleur-tekst-gedempt)" }}>
            Strijders: {stad.strijders.length} totaal, {wachttorenStrijders.length} in een wachttoren,{" "}
            {vrijeStrijders.length} vrij (nog niet toegewezen aan een wachttoren of legerkamp) — klik op een
            wachttoren op de kaart om er een te bemannen.
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
            {stad.strijders.map((strijder) => {
              if (strijder.wachttoren) {
                // Wachttoren-toewijzing wordt sinds issue "wachttorens
                // bemannen" niet meer via dit paneel teruggehaald, maar via
                // de wachttoren-tile zelf (zie TileInfoPopup) — hier dus
                // puur informatief, geen knop.
                return (
                  <span
                    key={strijder.id}
                    title={`Bemant wachttoren op streek ${strijder.wachttoren.hoogte}`}
                    aria-label="Strijder bemant een wachttoren"
                    style={{ padding: "0.3rem 0.5rem", fontSize: "1rem", lineHeight: 1 }}
                  >
                    🛡
                  </span>
                );
              }
              if (strijder.legerkamp) {
                // Toewijzing is omkeerbaar en instant (hoofdstuk 6/11, issue:
                // "wachttorens, bemanning en bevoorrading" / "wachttoren
                // tweaks"): een toegewezen strijder is klikbaar om terug te
                // halen, en meteen daarna weer inzetbaar.
                return (
                  <button
                    key={strijder.id}
                    className="fc-knop"
                    onClick={() => onHaalTerug(strijder.id)}
                    title={`Toegewezen aan een legerkamp op streek ${strijder.legerkamp.hoogte} — klik om terug te halen`}
                    aria-label="Strijder"
                    style={{ padding: "0.3rem 0.5rem", fontSize: "1rem", lineHeight: 1 }}
                  >
                    ⛺
                  </button>
                );
              }
              return (
                <button
                  key={strijder.id}
                  className="fc-knop"
                  onClick={() => onKiesStrijderVoorLegerkamp(strijder.id)}
                  title="Wijs deze strijder toe aan een legerkamp (hoofdstuk 6: Bezette Streek-legerwaarde)"
                  aria-label="Strijder naar legerkamp"
                  style={{ padding: "0.3rem 0.4rem", fontSize: "0.8rem", lineHeight: 1 }}
                >
                  ⛺
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        {stad.legerInAanbouw ? (
          <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
            Soldaat in opleiding… Nog nodig: <KostenIcons kosten={Object.fromEntries(legerResterend)} />
            {legerStagneert ? (
              <span style={{ color: "var(--kleur-gevaar)" }}>
                ⚠ Tekort aan grondstoffen — volgende beurt wordt hier niet aan gewerkt.
              </span>
            ) : (
              <span>
                (nog {resterendeBouwBeurten(stad.legerInAanbouw.improvement, stad.legerInAanbouw.voortgang)}{" "}
                beurten)
              </span>
            )}
          </span>
        ) : (
          <button className="fc-knop" onClick={onStartRecrutering} style={{ padding: "0.35rem 0.75rem" }}>
            Soldaat rekruteren (<KostenIcons kosten={SOLDAAT.kosten} />, {SOLDAAT.bouwtijdBeurten} beurten)
          </button>
        )}
      </div>
    </div>
  );
}
