"use client";

import { RUSH_GOUD_PER_BEURT, rushKostenGoud } from "@/game/bouwwachtrij";
import { Improvement, ResourceType, TechId } from "@/game/types";

interface RushMetGoudKnopProps {
  improvement: Improvement;
  voortgang: Partial<Record<ResourceType, number>>;
  goudInVoorraad: number;
  technologieen?: TechId[];
  onVersnellen: () => void;
}

// "Versnel met goud"-knop (hoofdstuk 5/14, issue: "toevoeging Goud" Deel 2):
// koopt de resterende bouwtijd van een lopend land- of city-improvement af,
// 5 goud per weggekochte beurt (zie `versnelBouwMetGoud` e.a. in economie.ts).
// Toont zowel de volledige rush-kosten als wat de speler daadwerkelijk in
// voorraad heeft — is dat te weinig voor de hele rush, dan koopt de klik
// gewoon zoveel beurten als het goud toelaat, nooit een geblokkeerde actie.
export default function RushMetGoudKnop({
  improvement,
  voortgang,
  goudInVoorraad,
  technologieen = [],
  onVersnellen,
}: RushMetGoudKnopProps) {
  const kosten = rushKostenGoud(improvement, voortgang, technologieen);
  if (kosten <= 0) return null;

  const kanVolledigVersnellen = goudInVoorraad >= kosten;

  return (
    <button
      className="fc-knop"
      onClick={onVersnellen}
      disabled={goudInVoorraad < RUSH_GOUD_PER_BEURT}
      style={{ padding: "0.35rem 0.75rem", alignSelf: "flex-start" }}
    >
      Versnel met goud ({kosten} goud voor volledige voltooiing, je hebt {goudInVoorraad}
      {kanVolledigVersnellen ? "" : " — koopt zoveel beurten als je goud toelaat"})
    </button>
  );
}
