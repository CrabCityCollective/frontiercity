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
              padding: "0.35rem 0.75rem",
              fontWeight: gekozenCategorie === categorie ? "bold" : "normal",
            }}
          >
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
