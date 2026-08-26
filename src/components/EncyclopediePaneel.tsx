"use client";

import { useState } from "react";
import { ENCYCLOPEDIE_CATEGORIEEN, ENCYCLOPEDIE_LEMMAS } from "@/game/encyclopedieContent";

interface EncyclopediePaneelProps {
  onSluiten: () => void;
}

// Encyclopedie (issue: "Boekwerk met uitleg" — "een encyclopedie ... waarin
// alle spelconcepten gewoon even duidelijk per lemma staan uitgelegd").
// Bereikbaar zowel vanuit het hoofdmenu vóór een run (HoofdNavigatieScherm)
// als tijdens het spelen (HoofdMenu/GameRoot) — in beide gevallen als losse,
// volledig-schermige overlay, zelfde patroon als TechboomPaneel/
// EconomieOverzichtPaneel. Sluiten laat je gewoon verder waar je was (tijdens
// een run blijft de canvas eronder gewoon staan; buiten een run kom je terug
// op het scherm waar je vandaan kwam) — er is dus geen aparte "terug naar het
// spel"-actie nodig.
export default function EncyclopediePaneel({ onSluiten }: EncyclopediePaneelProps) {
  const [zoek, setZoek] = useState("");

  const zoekTerm = zoek.trim().toLowerCase();
  const gefilterdeLemmas = zoekTerm
    ? ENCYCLOPEDIE_LEMMAS.filter(
        (lemma) => lemma.titel.toLowerCase().includes(zoekTerm) || lemma.tekst.toLowerCase().includes(zoekTerm)
      )
    : ENCYCLOPEDIE_LEMMAS;

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
          gap: "0.75rem",
          padding: "1rem 1.25rem",
          fontSize: "0.9rem",
          width: "min(32rem, 100%)",
          maxHeight: "min(36rem, 90vh)",
        }}
      >
        <strong className="fc-heading" style={{ color: "var(--kleur-oker)" }}>
          Encyclopedie
        </strong>

        <input
          type="text"
          value={zoek}
          onChange={(e) => setZoek(e.target.value)}
          placeholder="Zoek een lemma..."
          style={{
            padding: "0.4rem 0.6rem",
            borderRadius: "0.3rem",
            border: "1px solid var(--kleur-rand)",
            background: "transparent",
            color: "inherit",
          }}
        />

        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {ENCYCLOPEDIE_CATEGORIEEN.map((categorie) => {
            const lemmasInCategorie = gefilterdeLemmas.filter((lemma) => lemma.categorie === categorie);
            if (lemmasInCategorie.length === 0) return null;
            return (
              <div key={categorie} style={{ borderTop: "1px solid var(--kleur-rand)", paddingTop: "0.5rem" }}>
                <strong style={{ display: "block", marginBottom: "0.4rem", color: "var(--kleur-oker)" }}>
                  {categorie}
                </strong>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {lemmasInCategorie.map((lemma) => (
                    <div key={lemma.id}>
                      <strong style={{ display: "block" }}>{lemma.titel}</strong>
                      <span style={{ color: "var(--kleur-tekst-gedempt)" }}>{lemma.tekst}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {gefilterdeLemmas.length === 0 && (
            <span style={{ color: "var(--kleur-tekst-gedempt)" }}>Geen lemma&apos;s gevonden.</span>
          )}
        </div>

        <button className="fc-knop" onClick={onSluiten} style={{ padding: "0.35rem 0.75rem", alignSelf: "flex-start" }}>
          Sluiten
        </button>
      </div>
    </div>
  );
}
