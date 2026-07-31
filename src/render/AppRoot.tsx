"use client";

import { useState } from "react";
import CampagneSelectScherm from "@/components/CampagneSelectScherm";
import TitelScherm from "@/components/TitelScherm";
import GameRoot from "./GameRoot";

type Scherm = "titel" | "campagne" | "spel";

// Navigatie boven GameRoot (issue: "font en style" — beginscherm →
// campagne-select → spel). Puur schermwissel, geen spelstatus: elke
// sessie start weer bij het beginscherm, GameRoot/save.ts regelt zelf of er
// een lopende tutorial-run hervat wordt.
export default function AppRoot() {
  const [scherm, setScherm] = useState<Scherm>("titel");

  if (scherm === "titel") return <TitelScherm onStart={() => setScherm("campagne")} />;
  if (scherm === "campagne") return <CampagneSelectScherm onKiesTutorial={() => setScherm("spel")} />;
  return <GameRoot />;
}
