"use client";

interface TitelSchermProps {
  onStart: () => void;
}

// Beginscherm (issue: "font en style" — "de game laten opstarten met een
// beginscherm, waarop de naam Frontier City staat"). Volledig blokkerend,
// vóór de campagne-keuze (zie AppRoot) — puur branding/intro, geen spelstatus.
export default function TitelScherm({ onStart }: TitelSchermProps) {
  return (
    <div
      onClick={onStart}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onStart();
      }}
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        padding: "1.5rem",
        cursor: "pointer",
        zIndex: 200,
        // Alternatieve hoofdtitel-afbeelding uitgeprobeerd (issue "Scène
        // beelden") i.p.v. title-screen.jpg — terug te draaien naar
        // title-screen.jpg als de oorspronkelijke toch mooier blijkt.
        backgroundImage: `linear-gradient(180deg, rgba(15, 10, 6, 0.35), rgba(15, 10, 6, 0.85)), url(/assets/scenes/title-screen-alt.png)`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
      }}
    >
      <div
        className="fc-paneel"
        style={{
          padding: "2rem 2.5rem",
          textAlign: "center",
          maxWidth: "min(32rem, 100%)",
          marginTop: "12vh",
        }}
      >
        <h1 style={{ margin: "0 0 0.5rem", fontSize: "2.6rem", color: "var(--kleur-oker)" }}>
          Frontier City
        </h1>
        <p style={{ margin: "0 0 1.5rem", fontStyle: "italic", color: "var(--kleur-tekst-gedempt)" }}>
          door Crab City Collective
        </p>
        <p
          className="fc-heading"
          style={{ margin: 0, fontSize: "0.95rem", color: "var(--kleur-tekst)", letterSpacing: "0.06em" }}
        >
          Tik om te beginnen
        </p>
      </div>
    </div>
  );
}
