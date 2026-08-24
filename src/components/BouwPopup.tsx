"use client";

import { useEffect, useState } from "react";
import { infrastructuurVoortgang } from "@/game/infrastructuurEnBouw";
import { WACHTTOREN_VOEDSEL_VERBRUIK } from "@/game/productie";
import {
  beschikbareOpties,
  CATEGORIE_LABELS,
  categorieZichtbaar,
  effectBeschrijving,
  improvementNaam,
  terreinEisenBeschrijving,
} from "@/game/improvements";
import { CampaignConfig, Categorie, Improvement, Streek, TechId } from "@/game/types";
import { KostenIcons } from "./ResourceIcoon";

const CATEGORIEEN = Object.keys(CATEGORIE_LABELS) as Categorie[];

// Simpele lijn-iconen per categorie (hoofdstuk 13 asset-lijst: "Simpele
// iconen voor de 5 categorieën"), als inline SVG zodat er geen los
// afbeeldingsbestand nodig is en de kleur met de rest van de UI meeloopt.
function CategorieIcoon({ categorie }: { categorie: Categorie }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "#c9a876",
    strokeWidth: 1.3,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (categorie) {
    case "economisch":
      // Korenschoof: staat voor hout/steen/erts/voedsel-opbrengst.
      return (
        <svg {...common}>
          <path d="M8 14V6M8 6l-3 3M8 6l3 3M5 4c1-1 2-1 3 0 1-1 2-1 3 0" />
          <path d="M4.5 3.2c1.2-1 2.5-1 3.5.2 1-1.2 2.3-1.2 3.5-.2" />
        </svg>
      );
    case "wetenschappelijk":
      // Gekerfde ster: vroege kennis/observatie, geen anachronistische lab-flask.
      return (
        <svg {...common}>
          <path d="M8 1.5v3M8 11.5v3M1.5 8h3M11.5 8h3M3.4 3.4l2.1 2.1M10.5 10.5l2.1 2.1M12.6 3.4l-2.1 2.1M5.5 10.5l-2.1 2.1" />
          <circle cx="8" cy="8" r="1.6" />
        </svg>
      );
    case "militair":
      // Gekruiste speren.
      return (
        <svg {...common}>
          <path d="M2.5 13.5l9-9M11.5 4.5l1-1.5.8.8-1.5 1M13.5 2.5l-9 9M4.5 11.5l-1 1.5-.8-.8 1.5-1" />
        </svg>
      );
    case "civiel":
      // Tent/hut-silhouet, sluit aan bij de stad-tegel.
      return (
        <svg {...common}>
          <path d="M2.5 13h11L8 2.5 2.5 13z" />
          <path d="M8 2.5V13" />
        </svg>
      );
    case "cultureel":
      // Staande steen met een gekerfd teken, sluit aan bij de heiligdom-tegel.
      return (
        <svg {...common}>
          <path d="M6 13.5h4L9.3 5.5H6.7L6 13.5z" />
          <path d="M8 8.3v2.4M6.9 9.5h2.2" />
        </svg>
      );
    default:
      return null;
  }
}

interface BouwPopupProps {
  streek: Streek;
  // Alle streken (hoofdstuk 6/11): nodig om `bouwbaarBuitenFrontier`-improvements
  // (momenteel alleen de Wachttoren) als beschikbaar te herkennen zodra ze
  // ergens op een ontgrendelde streek geplaatst kunnen worden, niet alleen op
  // `streek` (de frontier) zelf.
  alleStreken: Streek[];
  // Gekozen technologieën (hoofdstuk 3/9, issue: "tech tree toevoegen" Deel
  // 2) — bepaalt of tech-gated improvements (momenteel alleen de
  // Voorraadkuil, ontgrendeld door "aardewerk") als optie meegenomen worden.
  technologieen: TechId[];
  // Gebouwde city improvements (hoofdstuk 4/6/11/14, issue: "city
  // improvements" Deel 4) — nodig om de infrastructuur-eis van Legerkamp/
  // Offer Altaar te tonen (`infrastructuurVoortgang`, economie.ts).
  cityImprovements: Improvement[];
  // Actieve campagne (hoofdstuk 9/13, M20d deelstap 1) — bepaalt de
  // weergavenaam via `improvementNaam()` hieronder. `undefined` voor de
  // tutorial (die geen eigen `CampaignConfig` heeft), zie `campagneConfig()`
  // in campagnes.ts.
  campagne?: CampaignConfig;
  // Campagnefase-gating (hoofdstuk 9, M21c, opdracht-wampanoag-opening.md
  // §4/§7): bepaalt of Militair/Cultureel als categorie-optie getoond worden
  // — zie `categorieZichtbaar()` in improvements.ts.
  cultureelOntgrendeld: boolean;
  zichtbaar: boolean;
  onBouwStarten: (improvement: Improvement) => void;
  onSluiten: () => void;
}

// Bouw-pop-up (hoofdstuk 1/11): verschijnt over de kaart bij het begin van
// elke beurt en dwingt de vaste twee-staps-keuze voor land improvements af —
// eerst een categorie, dan alle op dat moment geldige concrete land-
// improvement-opties binnen die categorie (niet langer een willekeurige
// subset van 2-3). City improvements en units lopen niet via deze pop-up
// (city improvements via de stad-pop-up, `StadMenuPopup`; units via hun eigen
// mechanisme). De speler kiest hoogstens 1 improvement per beurt (of sluit de
// pop-up zonder te bouwen). Na het kiezen van een concrete improvement neemt
// GameRoot het over: de pop-up verdwijnt (zie `plaatsingsImprovement` in
// GameRoot) en de speler wijst zelf een lege tile op de kaart aan om hem neer
// te zetten — pas dan wordt `bouwKeuzeGedaanDitBeurt` gezet.
export default function BouwPopup({
  streek,
  alleStreken,
  technologieen,
  cityImprovements,
  campagne,
  cultureelOntgrendeld,
  zichtbaar,
  onBouwStarten,
  onSluiten,
}: BouwPopupProps) {
  const [gekozenCategorie, setGekozenCategorie] = useState<Categorie | null>(null);
  const [opties, setOpties] = useState<Improvement[]>([]);

  // Nieuwe beurt: begin weer bij de categorie-stap, niet bij de opties van de
  // vorige beurt.
  useEffect(() => {
    if (zichtbaar) {
      setGekozenCategorie(null);
      setOpties([]);
    }
  }, [zichtbaar]);

  if (!zichtbaar) return null;

  const legeTilesResterend = streek.tiles.filter((tile) => tile.status === "leeg").length;

  function kiesCategorie(categorie: Categorie) {
    setGekozenCategorie(categorie);
    setOpties(beschikbareOpties(categorie, streek, alleStreken, technologieen));
  }

  return (
    <div
      style={{
        // `fixed` i.p.v. `absolute` (issue: "popups altijd in view") — zo
        // blijft de pop-up gecentreerd op het volledige scherm, ongeacht hoe
        // ver de speler in `.game-scroll-area` gescrold heeft.
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
          minWidth: "min(28rem, 100%)",
        }}
      >
        {gekozenCategorie === null && (
          <>
            <strong className="fc-heading" style={{ color: "var(--kleur-oker)" }}>
              Kies een categorie om deze beurt in te bouwen
            </strong>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {CATEGORIEEN.filter((categorie) => categorieZichtbaar(categorie, cultureelOntgrendeld)).map((categorie) => {
                // Uitgegrijsd (issue: "categorieën waarin je niks kunt bouwen
                // uitgegrijsd") als deze categorie geen nog-niet-gebouwde
                // improvements meer heeft met een geldig leeg vakje —
                // `beschikbareOpties` kijkt voor `bouwbaarBuitenFrontier`-
                // improvements (Wachttoren) ook naar andere ontgrendelde
                // streken, dus dit hoeft niet af te hangen van lege vakjes op
                // déze (frontier-)streek specifiek.
                const kanBouwen = beschikbareOpties(categorie, streek, alleStreken, technologieen).length > 0;
                return (
                  <button
                    key={categorie}
                    className="fc-knop"
                    disabled={!kanBouwen}
                    onClick={() => kiesCategorie(categorie)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.35rem 0.75rem",
                    }}
                  >
                    <CategorieIcoon categorie={categorie} />
                    {CATEGORIE_LABELS[categorie]}
                  </button>
                );
              })}
            </div>
            <button className="fc-knop" onClick={onSluiten} style={{ padding: "0.35rem 0.75rem", alignSelf: "flex-start" }}>
              Deze beurt niet bouwen
            </button>
          </>
        )}

        {gekozenCategorie !== null && (
          <>
            <strong className="fc-heading" style={{ color: "var(--kleur-oker)" }}>
              {CATEGORIE_LABELS[gekozenCategorie]}
            </strong>

            {/* `opties` houdt zelf al rekening met `bouwbaarBuitenFrontier`-
                improvements (Wachttoren) die elders ontgrendeld nog wél een
                leeg vakje hebben — "geen lege vakjes" is dus alleen terecht
                als er ook geen opties over zijn. */}
            {legeTilesResterend === 0 && opties.length === 0 && (
              <p style={{ margin: 0 }}>Geen lege vakjes meer op deze streek.</p>
            )}

            {opties.length === 0 && legeTilesResterend > 0 && (
              <p style={{ margin: 0 }}>
                Nog geen opties beschikbaar in de categorie {CATEGORIE_LABELS[gekozenCategorie]}.
              </p>
            )}

            {opties.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {opties.map((improvement) => {
                  const terreinEis = terreinEisenBeschrijving(improvement);
                  // Infrastructuur-eis (hoofdstuk 4/6/11/14, issue: "city
                  // improvements" Deel 4): Legerkamp/Offer Altaar blijven, in
                  // tegenstelling tot een `minStreek`-gate, gewoon zichtbaar
                  // (uitgegrijsd) met een voortgangstekst — de speler moet
                  // kunnen zien hoe ver hij is, niet alleen dát het nog niet
                  // kan. `startBouw` in economie.ts is de daadwerkelijke
                  // blokkade; dit is puur de weergave.
                  const voortgang = infrastructuurVoortgang(alleStreken, cityImprovements, improvement);
                  const eis = improvement.infrastructuurEis;
                  return (
                    <button
                      key={improvement.id}
                      className="fc-knop"
                      disabled={voortgang !== undefined && !voortgang.vervuld}
                      onClick={() => onBouwStarten(improvement)}
                    >
                      {improvementNaam(improvement, campagne)} (<KostenIcons kosten={improvement.kosten} />,{" "}
                      {improvement.bouwtijdBeurten} beurten)
                      {/* Wat dit improvement oplevert/doet (issue: "teksten bij city
                          gebouwen" — ontbrak hier volledig, zie effectBeschrijving() in
                          improvements.ts, gedeeld met de klik-op-tile-info-pop-up). */}
                      <span style={{ display: "block", fontSize: "0.75rem", color: "var(--kleur-tekst-gedempt)" }}>
                        {effectBeschrijving(improvement)}
                      </span>
                      {terreinEis && (
                        <span style={{ display: "block", fontSize: "0.75rem", color: "var(--kleur-tekst-gedempt)" }}>
                          Alleen op {terreinEis}
                        </span>
                      )}
                      {improvement.bouwbaarBuitenFrontier && (
                        <span style={{ display: "block", fontSize: "0.75rem", color: "var(--kleur-tekst-gedempt)" }}>
                          Kan op elke ontgrendelde streek gebouwd worden
                        </span>
                      )}
                      {improvement.id === "wachttoren" && (
                        <span style={{ display: "block", fontSize: "0.75rem", color: "var(--kleur-tekst-gedempt)" }}>
                          Verbruikt {WACHTTOREN_VOEDSEL_VERBRUIK} voedsel/beurt zodra bemand
                        </span>
                      )}
                      {voortgang && eis && (
                        <span
                          style={{
                            display: "block",
                            fontSize: "0.75rem",
                            color: voortgang.vervuld ? "var(--kleur-tekst-gedempt)" : "var(--kleur-gevaar)",
                          }}
                        >
                          {voortgang.aantalLandImprovement}/{voortgang.benodigdAantal} {eis.landImprovementNaam},{" "}
                          {eis.cityImprovementNaam}: {voortgang.heeftCityImprovement ? "gebouwd" : "nog niet gebouwd"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="fc-knop" onClick={() => setGekozenCategorie(null)} style={{ padding: "0.35rem 0.75rem" }}>
                Terug naar categorieën
              </button>
              <button className="fc-knop" onClick={onSluiten} style={{ padding: "0.35rem 0.75rem" }}>
                Deze beurt niet bouwen
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
