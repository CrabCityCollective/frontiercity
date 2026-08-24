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
//
// De eerste `GROENE_STREKEN_AANTAL` streken (het Wampanoag-kustthuisland,
// `WAMPANOAG_STREEK_HOOGTE` in worldGoingWest.ts) krijgen een groenere,
// minder stoffige tint dan de rest van de kaart — issue: "Going west terrein
// in eerste instantie groener". De aanroepers (canvas.ts/canvasPixelArt.ts)
// geven de pixel-y door waar die groene band begint (onderaan het canvas,
// waar streek 1 staat); alles daarboven houdt de bestaande stoffige
// Diablo II-achtige bruine tint (hoofdstuk 12).
export const GROENE_STREKEN_AANTAL = 6;

export function pasTegelSetTint(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tegelSet?: string,
  groeneBandVanafY?: number
): void {
  if (tegelSet !== "going-west") return;

  const bandY = Math.min(Math.max(groeneBandVanafY ?? height, 0), height);

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = "#8a7250";
  ctx.fillRect(0, 0, width, bandY);
  if (bandY < height) {
    ctx.fillStyle = "#7fa35c";
    ctx.fillRect(0, bandY, width, height - bandY);
  }
  ctx.restore();
}
