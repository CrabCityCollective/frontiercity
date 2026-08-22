"use client";

import { useState } from "react";
import CampagneSelectScherm from "@/components/CampagneSelectScherm";
import HoofdNavigatieScherm from "@/components/HoofdNavigatieScherm";
import InstellingenPopup from "@/components/InstellingenPopup";
import TitelScherm from "@/components/TitelScherm";
import GameRoot from "./GameRoot";

type Scherm = "titel" | "navigatie" | "campagne" | "spel";

// Navigatie boven GameRoot (issue: "font en style" — beginscherm → campagne-
// select → spel; en "een nieuw scherm waarin je kunt kiezen tussen
// Campagnes en Instellingen"). Puur schermwissel, geen spelstatus: elke
// sessie start weer bij het beginscherm, GameRoot/save.ts regelt zelf of er
// een lopende tutorial-run hervat wordt.
export default function AppRoot() {
  const [scherm, setScherm] = useState<Scherm>("titel");
  const [toonInstellingen, setToonInstellingen] = useState(false);
  // Actieve campagne (M20d deelstap 3, hoofdstuk 9/13/15) — `undefined` voor
  // de tutorial, anders de `CampaignConfig.id` (campagnes.ts) die
  // `CampagneSelectScherm` doorgeeft via `onKiesCampagne`. Net als `scherm`
  // hierboven puur navigatie-state: `GameRoot` leest 'm bij het opzetten van
  // een verse `useGameEngine()`-status, de lopende run zelf onthoudt zijn
  // eigen `campagneId` (`GameState.campagneId`, sinds M20d deelstap 1).
  const [actieveCampagneId, setActieveCampagneId] = useState<string | undefined>(undefined);

  if (scherm === "titel") return <TitelScherm onStart={() => setScherm("navigatie")} />;

  if (scherm === "navigatie") {
    return (
      <>
        <HoofdNavigatieScherm
          onCampagnes={() => setScherm("campagne")}
          onInstellingen={() => setToonInstellingen(true)}
        />
        {toonInstellingen && <InstellingenPopup onSluiten={() => setToonInstellingen(false)} />}
      </>
    );
  }

  if (scherm === "campagne") {
    return (
      <CampagneSelectScherm
        onKiesCampagne={(campagneId) => {
          setActieveCampagneId(campagneId);
          setScherm("spel");
        }}
      />
    );
  }
  return (
    <GameRoot
      campagneId={actieveCampagneId}
      onVerlaten={() => setScherm("titel")}
      onTutorialAfgerond={() => setScherm("campagne")}
    />
  );
}
