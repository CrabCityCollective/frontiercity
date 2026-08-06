// Gedeelde grondstof-typegids (hoofdstuk 5): onderscheidt de vier
// opslag-cap-gebonden bouwmaterialen/goud van cultuur/wetenschap/voedsel, die
// elk hun eigen regels volgen (zie productie.ts/bouwwachtrij.ts). Losstaand
// van economie.ts (die zelf door productie.ts/bouwwachtrij.ts wordt
// geïmporteerd voor hun `verwerk...`-orchestratie) zodat er geen circulaire
// afhankelijkheid ontstaat.

import { MateriaalType } from "./types";

export function isMateriaalType(resource: string): resource is MateriaalType {
  return resource === "hout" || resource === "steen" || resource === "erts" || resource === "goud";
}
