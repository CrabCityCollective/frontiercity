"use client";

import { useEffect, useState } from "react";
import {
  beschikbareOpties,
  CATEGORIE_LABELS,
  terreinEisenBeschrijving,
  willekeurigeOpties,
} from "@/game/improvements";
import { Categorie, Improvement, Layer } from "@/game/types";

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

function formatteerKosten(improvement: Improvement): string {
  const delen = Object.entries(improvement.kosten).map(([type, waarde]) => `${waarde} ${type}`);
  return delen.length > 0 ? delen.join(", ") : "gratis";
}

interface BouwPopupProps {
  laag: Layer;
  zichtbaar: boolean;
  onBouwStarten: (improvement: Improvement) => void;
  onSluiten: () => void;
}

// Bouw-pop-up (hoofdstuk 11): verschijnt over de kaart bij het begin van elke
// beurt en dwingt de vaste twee-staps-keuze af — eerst een categorie, dan 2-3
// willekeurige concrete opties binnen die categorie. De speler kiest
// hoogstens 1 improvement per beurt (of sluit de pop-up zonder te bouwen).
// Na het kiezen van een concrete improvement neemt GameRoot het over: de
// pop-up verdwijnt (zie `plaatsingsImprovement` in GameRoot) en de speler
// wijst zelf een lege tile op de kaart aan om hem neer te zetten — pas dan
// wordt `bouwKeuzeGedaanDitBeurt` gezet.
export default function BouwPopup({ laag, zichtbaar, onBouwStarten, onSluiten }: BouwPopupProps) {
  const [gekozenCategorie, setGekozenCategorie] = useState<Categorie | null>(null);
  const [opties, setOpties] = useState<Improvement[]>([]);

  // Nieuwe beurt: begin weer bij de categorie-stap met een verse
  // willekeurige trekking, niet de opties van de vorige beurt.
  useEffect(() => {
    if (zichtbaar) {
      setGekozenCategorie(null);
      setOpties([]);
    }
  }, [zichtbaar]);

  if (!zichtbaar) return null;

  const legeTilesResterend = laag.tiles.filter((tile) => tile.status === "leeg").length;

  function kiesCategorie(categorie: Categorie) {
    setGekozenCategorie(categorie);
    setOpties(willekeurigeOpties(categorie, laag));
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
              {CATEGORIEEN.map((categorie) => {
                // Uitgegrijsd (issue: "categorieën waarin je niks kunt bouwen
                // uitgegrijsd") als er geen lege vakjes meer zijn, of als deze
                // categorie geen nog-niet-gebouwde improvements meer heeft op
                // deze laag.
                const kanBouwen = legeTilesResterend > 0 && beschikbareOpties(categorie, laag).length > 0;
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

            {legeTilesResterend === 0 && <p style={{ margin: 0 }}>Geen lege vakjes meer op deze laag.</p>}

            {legeTilesResterend > 0 && opties.length === 0 && (
              <p style={{ margin: 0 }}>
                Nog geen opties beschikbaar in de categorie {CATEGORIE_LABELS[gekozenCategorie]}.
              </p>
            )}

            {legeTilesResterend > 0 && opties.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {opties.map((improvement) => {
                  const terreinEis = terreinEisenBeschrijving(improvement);
                  return (
                    <button key={improvement.id} className="fc-knop" onClick={() => onBouwStarten(improvement)}>
                      {improvement.naam} ({formatteerKosten(improvement)}, {improvement.bouwtijdBeurten}{" "}
                      beurten)
                      {terreinEis && (
                        <span style={{ display: "block", fontSize: "0.75rem", color: "var(--kleur-tekst-gedempt)" }}>
                          Alleen op {terreinEis}
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
