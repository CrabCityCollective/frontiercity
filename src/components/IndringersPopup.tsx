"use client";

import { MATERIAAL_LABELS } from "@/game/improvements";
import {
  AMBERADER_ONDER_VUUR_TEKST,
  BUIT_BINNENGEHAALD_TEKST,
  INDRINGERS_TITEL,
  WACHTTOREN_OVERROMPELD_TEKST,
  WAMPUM_AFKOOP_BEVESTIGING_TEKST,
} from "@/game/tutorialContent";
import { IndringersEvent } from "@/game/types";

interface IndringersPopupProps {
  event: IndringersEvent;
  onBevestigAmberOnderVuur: () => void;
  onGeefTribuut: () => void;
  onWeigerTribuut: () => void;
  onSluiten: () => void;
  // Wampum-afkoop (issue "Wampum — invallen tijdelijk afkopen"): `undefined`
  // zolang de keuze niet getoond moet worden (zie `kanIndringersAfkopenMetWampum`,
  // indringersEnDieren.ts) — pas ná het Wampanoag-verbond, en alleen op de
  // gewone tribuut-tak (geen Wachttoren, `fase: "gemeld"`).
  wampumAfkoop?: {
    kosten: number;
    wampumVoorraad: number;
    onKoopAf: () => void;
  };
  // Campagne-eigen flavor-tekst voor de bevestiging hieronder
  // (`CampaignConfig.popupTeksten.wampumAfkoopTekst`, campagnes.ts) — valt
  // terug op `WAMPUM_AFKOOP_BEVESTIGING_TEKST` als de campagne (of de
  // tutorial) geen override heeft.
  wampumAfkoopBevestigingTekst?: string;
}

// Indringers-pop-up (hoofdstuk 6): verschijnt zodra `verwerkIndringers`
// (economie.ts) toeslaat op een van de ontgrendelde streken (niet meer alleen
// de frontier-streek). Eén component met varianten, geschakeld op
// `event.heeftWachttoren`/`event.fase`, omdat ze hetzelfde blokkerende
// meldings-frame delen (zelfde patroon als
// VoedselWaarschuwingPopup/MilitairUitlegPopup) en alleen in tekst/knoppen
// verschillen. Zowel `onGeefTribuut` (vanuit `fase: "gemeld"`) als de
// "Begrepen"-knop bij `fase: "geforceerd"` roepen dezelfde `onGeefTribuut`-actie
// aan — die trekt het tribuut direct van de voorraad af én sluit de melding in
// één stap (issue: "Indringers 2e pop-up samenvoegen" — geen apart
// bevestigingsscherm meer tussen de keuze/afdwinging en de afschrijving).
// `fase: "amber-onder-vuur"`/`"malus"`/`"bonus"` (issue: "wachttorens kunnen
// vernietigd worden door indringers"): de derde-uitkomst-loot voor een
// beschermde streek, en de losstaande Amberader-aankondiging die daar (of vóór
// de gewone tribuut-afhandeling) aan vooraf kan gaan — zie
// `bevestigAmberOnderVuur` in economie.ts voor de fase-overgang.
export default function IndringersPopup({
  event,
  onBevestigAmberOnderVuur,
  onGeefTribuut,
  onWeigerTribuut,
  onSluiten,
  wampumAfkoop,
  wampumAfkoopBevestigingTekst,
}: IndringersPopupProps) {
  const resourceLabel = event.tribuut ? MATERIAAL_LABELS[event.tribuut.resource].toLowerCase() : "";
  const afbeelding =
    event.heeftWachttoren && event.fase === "malus"
      ? "/assets/scenes/ingestorte-wachttoren.png"
      : "/assets/scenes/indringers-bij-de-grens.png";

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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={afbeelding}
          alt=""
          style={{
            width: "100%",
            maxWidth: "26rem",
            height: "auto",
            display: "block",
            alignSelf: "center",
            border: "3px solid var(--kleur-oker)",
            boxShadow: "0 6px 18px rgba(0, 0, 0, 0.55)",
          }}
        />
        <strong className="fc-heading" style={{ color: "var(--kleur-gevaar)" }}>
          {INDRINGERS_TITEL}
        </strong>

        {event.fase === "amber-onder-vuur" && (
          <>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              {event.stamNaam} dringt streek {event.streekHoogte} binnen. {AMBERADER_ONDER_VUUR_TEKST}
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
              {event.stamNaam} dringt streek {event.streekHoogte} binnen. De wachttoren houdt stand — ze trekken zich
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
              {event.stamNaam} dringt streek {event.streekHoogte} binnen. Er staat geen bemande wachttoren — ze eisen{" "}
              {event.tribuut.aantal} {resourceLabel} als tribuut. Geef je het, dan trekken ze zich terug. Weiger je,
              dan eisen ze het hoe dan ook op.
            </p>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button className="fc-knop" onClick={onGeefTribuut} style={{ padding: "0.5rem 1.5rem" }}>
                Geef tribuut
              </button>
              <button className="fc-knop" onClick={onWeigerTribuut} style={{ padding: "0.5rem 1.5rem" }}>
                Weiger
              </button>
              {wampumAfkoop && (
                <button
                  className="fc-knop"
                  onClick={wampumAfkoop.onKoopAf}
                  disabled={wampumAfkoop.wampumVoorraad < wampumAfkoop.kosten}
                  style={{ padding: "0.5rem 1.5rem" }}
                >
                  {wampumAfkoop.wampumVoorraad < wampumAfkoop.kosten
                    ? `Afkopen met wampum (onvoldoende wampum, ${wampumAfkoop.kosten} nodig)`
                    : `Afkopen met wampum (${wampumAfkoop.kosten})`}
                </button>
              )}
            </div>
          </>
        )}

        {!event.heeftWachttoren && event.tribuut && event.fase === "geforceerd" && (
          <>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              Weigeren helpt niet — ze eisen het tribuut hoe dan ook op: {event.tribuut.aantal} {resourceLabel}.
            </p>
            <button
              className="fc-knop"
              onClick={onGeefTribuut}
              style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}
            >
              Begrepen
            </button>
          </>
        )}

        {event.fase === "wampum-afgekocht" && (
          <>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              {wampumAfkoopBevestigingTekst ?? WAMPUM_AFKOOP_BEVESTIGING_TEKST}
            </p>
            <button className="fc-knop" onClick={onSluiten} style={{ alignSelf: "center", padding: "0.5rem 1.5rem" }}>
              Begrepen
            </button>
          </>
        )}
      </div>
    </div>
  );
}
