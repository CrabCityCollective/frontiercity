"use client";

// Klein kompas-badge, alléén voor de Going West-campagne (issue: "Compas in
// beeld bij Going West") — west boven, noord links (i.p.v. de gebruikelijke
// noord-boven-oriëntatie), zodat het echt voelt alsof je naar het westen
// trekt. Puur decoratief/sfeer, geen functionele richtingaanwijzer: de
// streekvolgorde is altijd lineair (hoofdstuk 8/9), dit kompas draait dus
// nooit mee met spelstatus of kaartrichting. De roos zelf is blokkerig
// (`shapeRendering="crispEdges"`, harde vlakken i.p.v. een gladde/gradient
// vorm) passend bij de donkerdere Diablo II-achtige Going West-stijl
// (hoofdstuk 12) i.p.v. de warme Riven/Myst-tutorialstijl — de vier
// windrichting-letters staan als gewone tekst eromheen, geen eigen
// pixel-font nodig voor zo'n klein element.
export default function KompasIcoon() {
  return (
    <div
      aria-label="Kompas: west boven, noord links"
      title="West boven, noord links"
      style={{
        display: "grid",
        gridTemplateColumns: "0.85rem 1.6rem 0.85rem",
        gridTemplateRows: "0.7rem 1.6rem 0.7rem",
        justifyItems: "center",
        alignItems: "center",
        flexShrink: 0,
      }}
    >
      <span />
      <span style={{ gridColumn: 2, gridRow: 1, fontSize: "0.55rem", fontWeight: "bold", color: "var(--kleur-oker)" }}>
        W
      </span>
      <span />

      <span style={{ gridColumn: 1, gridRow: 2, fontSize: "0.55rem", fontWeight: "bold", color: "var(--kleur-roest-licht)" }}>
        N
      </span>
      <svg width="26" height="26" viewBox="0 0 16 16" shapeRendering="crispEdges" style={{ gridColumn: 2, gridRow: 2 }}>
        {/* kompasroos: 4 "kite"-vlakken rond het midden — boven = west
            (nadruk, oker), links = noord, rechts = zuid, onder = oost */}
        <polygon points="8,1 11.5,4.5 8,8 4.5,4.5" fill="var(--kleur-oker)" />
        <polygon points="1,8 4.5,4.5 8,8 4.5,11.5" fill="var(--kleur-roest-licht)" />
        <polygon points="15,8 11.5,11.5 8,8 11.5,4.5" fill="var(--kleur-tekst-gedempt)" />
        <polygon points="8,15 4.5,11.5 8,8 11.5,11.5" fill="var(--kleur-leer)" />
        <polygon
          points="8,1 15,8 8,15 1,8"
          fill="none"
          stroke="var(--kleur-aarde-diepst)"
          strokeWidth="0.6"
        />
        <rect x="7.3" y="7.3" width="1.4" height="1.4" fill="var(--kleur-aarde-diepst)" />
      </svg>
      <span style={{ gridColumn: 3, gridRow: 2, fontSize: "0.55rem", fontWeight: "bold", color: "var(--kleur-tekst-gedempt)" }}>
        S
      </span>

      <span />
      <span style={{ gridColumn: 2, gridRow: 3, fontSize: "0.55rem", fontWeight: "bold", color: "var(--kleur-leer)" }}>
        E
      </span>
      <span />
    </div>
  );
}
