"use client";

import { useState } from "react";
import CampagneSelectScherm from "@/components/CampagneSelectScherm";
import EncyclopediePaneel from "@/components/EncyclopediePaneel";
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
  // Encyclopedie (issue: "Boekwerk met uitleg" — "toegankelijk via button in
  // het hoofdmenu van het spel, onder campagnes en instellingen"): zelfde
  // overlay-patroon als `toonInstellingen` hierboven.
  const [toonEncyclopedie, setToonEncyclopedie] = useState(false);
  // Actieve campagne (M20d deelstap 3, hoofdstuk 9/13/15) — `undefined` voor
  // de tutorial, anders de `CampaignConfig.id` (campagnes.ts) die
  // `CampagneSelectScherm` doorgeeft via `onKiesCampagne`. Net als `scherm`
  // hierboven puur navigatie-state: `GameRoot` leest 'm bij het opzetten van
  // een verse `useGameEngine()`-status, de lopende run zelf onthoudt zijn
  // eigen `campagneId` (`GameState.campagneId`, sinds M20d deelstap 1).
  const [actieveCampagneId, setActieveCampagneId] = useState<string | undefined>(undefined);
  // Issue: "loading button per campagne op het campagne select screen,
  // waarmee je een eerdere save kunt inladen" — puur navigatie-state, net als
  // `actieveCampagneId` hierboven: geeft aan of de aankomende GameRoot-mount
  // de bewaarde save van `actieveCampagneId` moet terughalen (Laden-knop) of
  // een verse run moet starten (campagne zelf aanklikken, bestaand gedrag).
  const [laadBijStart, setLaadBijStart] = useState(false);

  if (scherm === "titel") return <TitelScherm onStart={() => setScherm("navigatie")} />;

  if (scherm === "navigatie") {
    return (
      <>
        <HoofdNavigatieScherm
          onCampagnes={() => setScherm("campagne")}
          onInstellingen={() => setToonInstellingen(true)}
          onEncyclopedie={() => setToonEncyclopedie(true)}
        />
        {toonInstellingen && <InstellingenPopup onSluiten={() => setToonInstellingen(false)} />}
        {toonEncyclopedie && <EncyclopediePaneel onSluiten={() => setToonEncyclopedie(false)} />}
      </>
    );
  }

  if (scherm === "campagne") {
    return (
      <CampagneSelectScherm
        onKiesCampagne={(campagneId) => {
          setActieveCampagneId(campagneId);
          setLaadBijStart(false);
          setScherm("spel");
        }}
        onLaadCampagne={(campagneId) => {
          setActieveCampagneId(campagneId);
          setLaadBijStart(true);
          setScherm("spel");
        }}
      />
    );
  }
  return (
    <GameRoot
      campagneId={actieveCampagneId}
      laadBijStart={laadBijStart}
      onVerlaten={() => setScherm("titel")}
      onTutorialAfgerond={() => setScherm("campagne")}
    />
  );
}
