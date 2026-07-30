"use client";

import { useState } from "react";
import { beschikbareOpties } from "@/game/improvements";
import { Categorie, Improvement, Layer } from "@/game/types";

const CATEGORIE_LABELS: Record<Categorie, string> = {
  economisch: "Economisch",
  wetenschappelijk: "Wetenschappelijk",
  militair: "Militair",
  civiel: "Civiel",
  cultureel: "Cultureel",
};

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

interface CategoriePickerProps {
  laag: Layer;
  onBouwStarten: (improvement: Improvement) => void;
}

// Minimale M2-stand-in: categorie kiezen → 2-3 concrete opties tonen →
// bouwen starten (hoofdstuk 11). Plaatst de gekozen improvement automatisch
// op de eerstvolgende lege tile van de actieve laag — tile-selectie op het
// canvas zelf valt buiten de scope van deze taak.
export default function CategoriePicker({ laag, onBouwStarten }: CategoriePickerProps) {
  const [gekozenCategorie, setGekozenCategorie] = useState<Categorie | null>(null);

  const legeTilesResterend = laag.tiles.filter((tile) => tile.status === "leeg").length;
  const reedsGebouwdeIds = laag.tiles
    .map((tile) => tile.improvement?.id)
    .filter((id): id is string => Boolean(id));

  const opties = gekozenCategorie ? beschikbareOpties(gekozenCategorie, reedsGebouwdeIds) : [];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        padding: "0.75rem 1rem",
        background: "#20180f",
        color: "#e8dcc8",
        fontFamily: "sans-serif",
        fontSize: "0.9rem",
      }}
    >
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {CATEGORIEEN.map((categorie) => (
          <button
            key={categorie}
            onClick={() => setGekozenCategorie(categorie)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.35rem 0.75rem",
              fontWeight: gekozenCategorie === categorie ? "bold" : "normal",
            }}
          >
            <CategorieIcoon categorie={categorie} />
            {CATEGORIE_LABELS[categorie]}
          </button>
        ))}
      </div>

      {gekozenCategorie && legeTilesResterend === 0 && (
        <p>Geen lege vakjes meer op deze laag.</p>
      )}

      {gekozenCategorie && legeTilesResterend > 0 && opties.length === 0 && (
        <p>Nog geen opties beschikbaar in de categorie {CATEGORIE_LABELS[gekozenCategorie]}.</p>
      )}

      {gekozenCategorie && legeTilesResterend > 0 && opties.length > 0 && (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {opties.map((improvement) => (
            <button key={improvement.id} onClick={() => onBouwStarten(improvement)}>
              {improvement.naam} ({formatteerKosten(improvement)}, {improvement.bouwtijdBeurten} beurten)
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
