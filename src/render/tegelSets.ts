// Placeholder-tegelset-differentiatie per campagne (`CampaignConfig.tegelSet`,
// types.ts). Hoofdstuk 12 van het design-document noemt Diablo II/Fallout
// als referentie voor de Amerikaanse frontier-campagne: donkerder,
// stoffiger/verweerder dan de warme Riven/Myst-sfeer van de tutorial. Een
// eigen tegel-asset-set per campagne (hoofdstuk 12: "losse tegels, geen
// naadloos tafereel") is voor de MVP-placeholder-fase nog te veel werk — een
// kleurtint bovenop de bestaande tutorial-tegels is de kleinste manier om
// `CampaignConfig.tegelSet` daadwerkelijk door de renderer te laten lezen
// (M20d deelstap 4), conform CLAUDE.md: "grove/simpele placeholders
// (kleurvlakken) zijn prima, functionaliteit gaat voor polish".
//
// Nieuwe campagnes met een eigen `tegelSet`-waarde kunnen hier gewoon een
// nieuwe branch toevoegen; de tutorial (`tegelSet === undefined`) blijft
// altijd ongewijzigd.
export function pasTegelSetTint(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tegelSet?: string
): void {
  if (tegelSet !== "going-west") return;

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = "#8a7250";
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}
