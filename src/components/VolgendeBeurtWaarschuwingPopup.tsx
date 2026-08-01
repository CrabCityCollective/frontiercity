"use client";

interface VolgendeBeurtWaarschuwingPopupProps {
  settlerHeeftNogActie: boolean;
  magNogBouwen: boolean;
  onTochDoorgaan: () => void;
  onTerug: () => void;
}

// Waarschuwing bij "Volgende beurt" (issue: "als je op volgende beurt drukt,
// dan moet er eerst gecheckt worden of je settler nog mag lopen of iets mag
// doen die beurt ... en of je nog een improvement mocht neerzetten"):
// GameRoot toont dit vóórdat `volgendeBeurt` daadwerkelijk wordt aangeroepen,
// zolang de settler nog een actie heeft (bewegen/weg aanleggen/jagen/hout
// hakken) of er nog een bouwkeuze openstaat. "Terug" sluit de pop-up alleen
// (de speler kan dan alsnog handelen); "Toch doorgaan" gaat gewoon naar de
// volgende beurt, net zoals eerder zonder deze waarschuwing.
export default function VolgendeBeurtWaarschuwingPopup({
  settlerHeeftNogActie,
  magNogBouwen,
  onTochDoorgaan,
  onTerug,
}: VolgendeBeurtWaarschuwingPopupProps) {
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
        <strong className="fc-heading" style={{ color: "var(--kleur-oker)" }}>
          Nog niet klaar deze beurt?
        </strong>
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          {settlerHeeftNogActie && magNogBouwen
            ? "Je settler kan deze beurt nog bewegen (of jagen/hout hakken/een weg aanleggen), en je kunt nog een improvement kiezen."
            : settlerHeeftNogActie
              ? "Je settler kan deze beurt nog bewegen (of jagen/hout hakken/een weg aanleggen)."
              : "Je kunt deze beurt nog een improvement kiezen om te bouwen."}
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          <button className="fc-knop" onClick={onTerug} style={{ padding: "0.5rem 1.5rem" }}>
            Terug
          </button>
          <button className="fc-knop" onClick={onTochDoorgaan} style={{ padding: "0.5rem 1.5rem" }}>
            Toch doorgaan
          </button>
        </div>
      </div>
    </div>
  );
}
