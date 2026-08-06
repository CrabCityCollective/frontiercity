"use client";

import { MATERIAAL_LABELS } from "@/game/improvements";
import {
  AMBERADER_ONDER_VUUR_TEKST,
  BUIT_BINNENGEHAALD_TEKST,
  INDRINGERS_TITEL,
  WACHTTOREN_OVERROMPELD_TEKST,
} from "@/game/tutorialContent";
import { IndringersEvent } from "@/game/types";

interface IndringersPopupProps {
  event: IndringersEvent;
  onBevestigAmberOnderVuur: () => void;
  onGeefTribuut: () => void;
  onWeigerTribuut: () => void;
  onBevestigGedwongenTribuut: () => void;
  onSluitTribuutBetaling: () => void;
  onSluiten: () => void;
}

// Indringers-pop-up (hoofdstuk 6): verschijnt zodra `verwerkIndringers`
// (economie.ts) toeslaat op een van de ontgrendelde lagen (niet meer alleen
// de frontier-laag). Eén component met varianten, geschakeld op
// `event.heeftWachttoren`/`event.fase`, omdat ze hetzelfde blokkerende
// meldings-frame delen (zelfde patroon als
// VoedselWaarschuwingPopup/MilitairUitlegPopup) en alleen in tekst/knoppen
// verschillen. `fase: "betaald"` (issue: "wachttoren tweaks") is het laatste
// bevestigingsscherm — pas het sluiten daarvan (`onSluitTribuutBetaling`)
// trekt het tribuut daadwerkelijk van de voorraad af.
// `fase: "amber-onder-vuur"`/`"malus"`/`"bonus"` (issue: "wachttorens kunnen
// vernietigd worden door indringers"): de derde-uitkomst-loot voor een
// beschermde laag, en de losstaande Amberader-aankondiging die daar (of vóór
// de gewone tribuut-afhandeling) aan vooraf kan gaan — zie
// `bevestigAmberOnderVuur` in economie.ts voor de fase-overgang.
export default function IndringersPopup({
  event,
  onBevestigAmberOnderVuur,
  onGeefTribuut,
  onWeigerTribuut,
  onBevestigGedwongenTribuut,
  onSluitTribuutBetaling,
  onSluiten,
}: IndringersPopupProps) {
  const resourceLabel = event.tribuut ? MATERIAAL_LABELS[event.tribuut.resource].toLowerCase() : "";

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
          gap: "1rem",
          padding: "1.25rem 1.5rem",
          maxWidth: "32rem",
          textAlign: "center",
        }}
      >
        <strong className="fc-heading" style={{ color: "var(--kleur-gevaar)" }}>
          {INDRINGERS_TITEL}
        </strong>

        {event.fase === "amber-onder-vuur" && (
          <>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              {event.stamNaam} dringt laag {event.laagHoogte} binnen. {AMBERADER_ONDER_VUUR_TEKST}
            </p>
            <button
              className="fc-knop"
              onClick={onBevestigAmberOnderVuur}
              style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}
            >
              Begrepen
            </button>
          </>
        )}

        {event.heeftWachttoren && event.fase === "gemeld" && (
          <>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              {event.stamNaam} dringt laag {event.laagHoogte} binnen. De wachttoren houdt stand — ze trekken zich
              terug zonder iets te nemen.
            </p>
            <button className="fc-knop" onClick={onSluiten} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
              Begrepen
            </button>
          </>
        )}

        {event.heeftWachttoren && event.fase === "malus" && (
          <>
            <p style={{ margin: 0, lineHeight: 1.6 }}>{WACHTTOREN_OVERROMPELD_TEKST}</p>
            <button className="fc-knop" onClick={onSluiten} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
              Begrepen
            </button>
          </>
        )}

        {event.heeftWachttoren && event.fase === "bonus" && (
          <>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              {BUIT_BINNENGEHAALD_TEKST} +{event.buitGoud} goud.
            </p>
            <button className="fc-knop" onClick={onSluiten} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
              Begrepen
            </button>
          </>
        )}

        {!event.heeftWachttoren && event.tribuut && event.fase === "gemeld" && (
          <>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              {event.stamNaam} dringt laag {event.laagHoogte} binnen. Er staat geen bemande wachttoren — ze eisen{" "}
              {event.tribuut.aantal} {resourceLabel} als tribuut. Geef je het, dan trekken ze zich terug. Weiger je,
              dan verwoesten ze de stad.
            </p>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
              <button className="fc-knop" onClick={onGeefTribuut} style={{ padding: "0.5rem 1.5rem" }}>
                Geef tribuut
              </button>
              <button className="fc-knop" onClick={onWeigerTribuut} style={{ padding: "0.5rem 1.5rem" }}>
                Weiger
              </button>
            </div>
          </>
        )}

        {!event.heeftWachttoren && event.tribuut && event.fase === "geforceerd" && (
          <>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              Ze verwoesten de stad — maar er is geen vorige stad om je op terug te trekken. Zonder toevlucht wordt
              het tribuut alsnog betaald: {event.tribuut.aantal} {resourceLabel}.
            </p>
            <button
              className="fc-knop"
              onClick={onBevestigGedwongenTribuut}
              style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}
            >
              Begrepen
            </button>
          </>
        )}

        {!event.heeftWachttoren && event.tribuut && event.fase === "betaald" && (
          <>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              Je stuurt {event.tribuut.aantal} {resourceLabel} mee als tribuut. Zodra je deze melding sluit, gaat dit
              van je voorraad af.
            </p>
            <button
              className="fc-knop"
              onClick={onSluitTribuutBetaling}
              style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}
            >
              Sluiten
            </button>
          </>
        )}
      </div>
    </div>
  );
}
