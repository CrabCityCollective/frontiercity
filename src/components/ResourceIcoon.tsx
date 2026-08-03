"use client";

import { useState } from "react";
import { RESOURCE_LABELS } from "@/game/improvements";
import { ResourceType } from "@/game/types";

// Simpele lijn-iconen per grondstof, zelfde stijl/opzet als CategorieIcoon in
// BouwPopup.tsx — placeholder-kwaliteit is prima in de MVP (CLAUDE.md:
// "functionaliteit gaat voor polish"), maar wel al herkenbaar per type.
function IcoonSvg({ type }: { type: ResourceType }) {
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

  switch (type) {
    case "hout":
      // Stapel houtblokken.
      return (
        <svg {...common}>
          <path d="M2 6h12M2 10h12" />
          <circle cx="4" cy="6" r="1" />
          <circle cx="12" cy="10" r="1" />
        </svg>
      );
    case "steen":
      // Onregelmatig rotsblok.
      return (
        <svg {...common}>
          <path d="M3 10.5l1.5-4 3-2 3.5 1 2 3-1 3.5-4 1.5-4.5-2z" />
        </svg>
      );
    case "erts":
      // Ruwe ertsklomp met adertjes.
      return (
        <svg {...common}>
          <path d="M8 1.5l4 3-1 5-3 4.5-3-4.5-1-5z" />
          <path d="M8 1.5v13M4.5 4.5l7 7M11.5 4.5l-7 7" />
        </svg>
      );
    case "goud":
      // Munt.
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="5.5" />
          <path d="M8 5v6M6.2 7h3.6M6.2 9h3.6" />
        </svg>
      );
    case "voedsel":
      // Korenschoof (zelfde motief als het economische categorie-icoon).
      return (
        <svg {...common}>
          <path d="M8 14V6M8 6l-3 3M8 6l3 3M5 4c1-1 2-1 3 0 1-1 2-1 3 0" />
        </svg>
      );
    case "cultuur":
      // Staande steen met een gekerfd teken.
      return (
        <svg {...common}>
          <path d="M6 13.5h4L9.3 5.5H6.7L6 13.5z" />
          <path d="M8 8.3v2.4M6.9 9.5h2.2" />
        </svg>
      );
    case "wetenschap":
      // Gekerfde ster.
      return (
        <svg {...common}>
          <path d="M8 1.5v3M8 11.5v3M1.5 8h3M11.5 8h3M3.4 3.4l2.1 2.1M10.5 10.5l2.1 2.1M12.6 3.4l-2.1 2.1M5.5 10.5l-2.1 2.1" />
          <circle cx="8" cy="8" r="1.6" />
        </svg>
      );
    default:
      return null;
  }
}

interface ResourceIcoonProps {
  type: ResourceType;
  waarde?: number | string;
}

// Klikbaar grondstof-icoon (issue: "in de onderste materialen balk ipv
// steen, erts enzo icoontjes tonen. Als je op een icoontje klikt, dan krijg
// je een pop-up met 'erts' bijvoorbeeld"). Elk icoon beheert zijn eigen
// kleine naam-pop-up — geen gedeelde state nodig, dus geen extra wiring door
// GameRoot voor elke plek waar dit icoon gebruikt wordt (grondstoffenbalk,
// alle bouwkosten-pop-ups). Een `<span role="button">` i.p.v. een echte
// `<button>`: `KostenIcons` wordt vaak binnenin een bestaande actie-knop
// gebruikt ("Soldaat rekruteren (...)"), en een `<button>` genest in een
// `<button>` is ongeldige HTML — `stopPropagation` hieronder voorkomt
// alsnog dat een klik op het icoon de omliggende knop activeert.
export default function ResourceIcoon({ type, waarde }: ResourceIcoonProps) {
  const [toonNaam, setToonNaam] = useState(false);

  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
      <span
        role="button"
        tabIndex={0}
        onClick={(event) => {
          event.stopPropagation();
          setToonNaam((huidig) => !huidig);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          event.stopPropagation();
          setToonNaam((huidig) => !huidig);
        }}
        aria-label={RESOURCE_LABELS[type]}
        title={RESOURCE_LABELS[type]}
        style={{
          display: "inline-flex",
          cursor: "pointer",
          lineHeight: 0,
        }}
      >
        <IcoonSvg type={type} />
      </span>
      {waarde !== undefined && <span>{waarde}</span>}
      {toonNaam && (
        <span
          onClick={(event) => event.stopPropagation()}
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginBottom: "0.3rem",
            padding: "0.2rem 0.5rem",
            background: "var(--kleur-aarde-paneel)",
            border: "1px solid var(--kleur-rand)",
            borderRadius: "0.25rem",
            fontSize: "0.75rem",
            whiteSpace: "nowrap",
            zIndex: 30,
          }}
        >
          {RESOURCE_LABELS[type]}
        </span>
      )}
    </span>
  );
}

// Rijtje icoontjes voor een bouwkosten-record (issue: "ook in andere pop-ups
// met bouwkosten wil ik graag deze icoontjes getoond zien worden, in plaats
// van steen, hout, voedsel, cultuur, etc."). Vervangt de losse
// `formatteerKosten`-tekstfuncties die voorheen in BouwPopup/CivielPaneel/
// MilitairPaneel/OpslagplaatsPaneel stonden.
export function KostenIcons({ kosten }: { kosten: Partial<Record<ResourceType, number>> }) {
  const delen = (Object.entries(kosten) as [ResourceType, number][]).filter(([, waarde]) => waarde > 0);
  if (delen.length === 0) return <span>gratis</span>;

  return (
    <span style={{ display: "inline-flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
      {delen.map(([type, waarde]) => (
        <ResourceIcoon key={type} type={type} waarde={waarde} />
      ))}
    </span>
  );
}
