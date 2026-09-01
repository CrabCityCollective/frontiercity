"use client";

import { bouwStagneertVolgendeBeurt, resterendeBouwBeurten } from "@/game/bouwwachtrij";
import { MISSIONARIS, SOLDAAT } from "@/game/improvements";
import { heeftOfferAltaar } from "@/game/streekOntgrendeling";
import { GameState, ResourceType } from "@/game/types";
import { KostenIcons } from "./ResourceIcoon";

interface MilitairPaneelProps {
  state: GameState;
  legerwaarde: number;
  tegenstanderSterkte: number;
  onStartRecrutering: () => void;
  // Missionaris-rekrutering (hoofdstuk 6, issue: "De Bezette Streek,
  // missionaris en verkenner", Deel 4, herzien door "Bezette streek scherm"):
  // alleen het ópleiden blijft in het stadsmenu (net als Soldaat) — welk
  // vijandelijk Heiligdom een opgeleide Missionaris krijgt, kies je met een
  // klik op de kaart (zie TileInfoPopup: `missionarisVraag`).
  onStartMissionarisRecrutering: () => void;
}

// Militair (basis) (M7, hoofdstuk 6): rekruteren van Soldaat-eenheden, met de
// legerwaarde zichtbaar voor de speler. Legerkamp- én wachttoren-toewijzing
// (issue: "wachttorens bemannen"/"Verschil legerkamp") lopen allebei via een
// klik op de tile zelf op de kaart (zie TileInfoPopup: `wachttorenVraag`/
// `legerkampVraag`) — dit paneel toont daarvoor alleen nog hoeveel strijders
// nog vrij zijn. Puur placeholder-styling — geen definitieve UI.
export default function MilitairPaneel({
  state,
  legerwaarde,
  tegenstanderSterkte,
  onStartRecrutering,
  onStartMissionarisRecrutering,
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
  // Missionaris-opleiding (hoofdstuk 6, herzien door "Bezette streek scherm")
  // — zelfde soort resterend-grondstoffen-weergave als Soldaat hierboven.
  const missionarisResterend = stad.missionarisInAanbouw
    ? (Object.entries(stad.missionarisInAanbouw.voortgang) as [ResourceType, number][]).filter(
        ([, aantal]) => aantal > 0
      )
    : [];
  const missionarisStagneert = stad.missionarisInAanbouw
    ? bouwStagneertVolgendeBeurt(stad.missionarisInAanbouw.improvement, stad.missionarisInAanbouw.voortgang, state.voorraad)
    : false;
  const heeftAltaar = heeftOfferAltaar(state);

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
            wachttoren of legerkamp op de kaart om er een te bemannen.
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
            {stad.strijders.map((strijder) => {
              if (strijder.wachttoren) {
                // Wachttoren-/legerkamp-toewijzing loopt niet meer via dit
                // paneel, maar via de tile zelf op de kaart (zie
                // TileInfoPopup: `wachttorenVraag`/`legerkampVraag`) — hier
                // dus puur informatief, geen knop.
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
                return (
                  <span
                    key={strijder.id}
                    title={`Toegewezen aan een legerkamp op streek ${strijder.legerkamp.hoogte}`}
                    aria-label="Strijder toegewezen aan een legerkamp"
                    style={{ padding: "0.3rem 0.5rem", fontSize: "1rem", lineHeight: 1 }}
                  >
                    ⛺
                  </span>
                );
              }
              return (
                <span
                  key={strijder.id}
                  title="Nog niet toegewezen — klik op een wachttoren of legerkamp op de kaart om deze strijder te bemannen"
                  aria-label="Strijder vrij"
                  style={{ padding: "0.3rem 0.5rem", fontSize: "1rem", lineHeight: 1, opacity: 0.6 }}
                >
                  🗡
                </span>
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

        {stad.missionarissen.length > 0 && (
          <span style={{ color: "var(--kleur-tekst-gedempt)" }}>Missionarissen: {stad.missionarissen.length}</span>
        )}
        {stad.missionarisInAanbouw ? (
          <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
            Missionaris in opleiding… Nog nodig: <KostenIcons kosten={Object.fromEntries(missionarisResterend)} />
            {missionarisStagneert ? (
              <span style={{ color: "var(--kleur-gevaar)" }}>
                ⚠ Tekort aan grondstoffen — volgende beurt wordt hier niet aan gewerkt.
              </span>
            ) : (
              <span>
                (nog {resterendeBouwBeurten(stad.missionarisInAanbouw.improvement, stad.missionarisInAanbouw.voortgang)}{" "}
                beurten)
              </span>
            )}
          </span>
        ) : (
          <button
            className="fc-knop"
            disabled={!heeftAltaar}
            onClick={onStartMissionarisRecrutering}
            title={heeftAltaar ? "Stuur een opgeleide Missionaris naar een vijandelijk Heiligdom op de kaart" : "Vereist een voltooid Offer Altaar"}
            style={{ padding: "0.35rem 0.75rem", opacity: heeftAltaar ? 1 : 0.5 }}
          >
            Missionaris opleiden (<KostenIcons kosten={MISSIONARIS.kosten} />, {MISSIONARIS.bouwtijdBeurten} beurten)
          </button>
        )}
      </div>
    </div>
  );
}
