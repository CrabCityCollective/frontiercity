// Bouwkosten-investering & goud-rush (M3/M10, hoofdstuk 5/16): een
// productiewachtrij die per beurt bouwmateriaal verbruikt tot een improvement
// voltooid is, per grondstof-type onafhankelijk van de andere benodigde types
// (zie `investeerInBouwkosten` hieronder). Gedeeld tussen de
// land-tile-bouwwachtrij hieronder en de stad-brede wachtrijen in
// groeiEnRekrutering.ts (groei/settler/opslagplaats/stadsverbetering/
// rekrutering), die verder los van elkaar staan (tile vs. stad).
//
// Goud-rush-bouwen (hoofdstuk 5/14, issue: "toevoeging Goud" Deel 2): koopt
// resterende bouwbeurten van een lopend land- of city-improvement af met
// goud in plaats van te wachten op de normale per-beurt-investering — nooit
// voor units of de technologieboom, die houden hun eigen tempo.

import { boerderijUitputtingFactor } from "./techTree";
import { GameState, Improvement, MateriaalType, ResourceType, TechId, Tile } from "./types";
import { isMateriaalType } from "./materiaal";

type ResourceKey = keyof Improvement["kosten"];

interface BouwInvestering {
  nieuweVoortgang: Partial<Record<ResourceType, number>>;
  voltooid: boolean;
}

// Investeert dit beurt-aandeel van de resterende bouwkosten vanuit de
// gedeelde opslag, per grondstof-type onafhankelijk van de andere benodigde
// types (bugfix, issue: "soldaat in opleiding wordt nooit voltooid" — een
// wachtrij die bv. hout én erts nodig heeft, mag niet *ook* de hout-betaling
// blokkeren zolang alleen de erts-voorraad tijdelijk tekortschiet, anders
// bevriest de hele teller onzichtbaar zodra één grondstof-type opdroogt,
// terwijl de UI gewoon een "nog X beurten" blijft tonen alsof er nog voortgang
// is). Binnen één grondstof-type blijft het wél alles-of-niets per beurt
// (geen gedeeltelijke betaling van dat ene bedrag) — zie hoofdstuk 5, "geen
// instant-klik, maar een productiewachtrij". Gedeeld tussen de
// land-tile-bouwwachtrij (M3) en de stadsgroei-/rekruterings-bouwwachtrij
// (M6/M7), die verder los van elkaar staan (tile vs. stad).
export function investeerInBouwkosten(
  improvement: Improvement,
  voortgang: Partial<Record<ResourceType, number>>,
  voorraad: Record<MateriaalType, number>
): BouwInvestering | null {
  const nieuweVoortgang = { ...voortgang };
  let geinvesteerd = false;

  for (const key of Object.keys(voortgang) as ResourceKey[]) {
    const resterend = voortgang[key] ?? 0;
    if (resterend <= 0) continue;

    const totaal = improvement.kosten[key] ?? 0;
    const perBeurt = Math.ceil(totaal / improvement.bouwtijdBeurten);
    const bedrag = Math.min(perBeurt, resterend);

    if (isMateriaalType(key) && voorraad[key] < bedrag) continue; // dit type stokt deze beurt, de rest gaat gewoon door

    if (isMateriaalType(key)) voorraad[key] -= bedrag;
    nieuweVoortgang[key] = resterend - bedrag;
    geinvesteerd = true;
  }

  if (!geinvesteerd) return null;

  const voltooid = (Object.values(nieuweVoortgang) as number[]).every((rest) => rest <= 0);
  return { nieuweVoortgang, voltooid };
}

// Resterende beurten tot een lopende bouw/rekrutering klaar is, uitgaande van
// dezelfde per-beurt-investering als `investeerInBouwkosten` hierboven (dus:
// zolang de voorraad het bijhoudt). Gebruikt door het militaire scherm
// (hoofdstuk 6/11, issue: "wachttorens, bemanning en bevoorrading" — punt 4:
// "hoeveel beurten er nóg te gaan zijn" bij een soldaat die al in opleiding
// is) in plaats van de speler te laten gokken, op dezelfde manier als de
// bouw-pop-up elders al de totale bouwtijd van een nog niet gestarte
// improvement toont.
export function resterendeBouwBeurten(
  improvement: Improvement,
  voortgang: Partial<Record<ResourceType, number>>
): number {
  let maxBeurten = 0;
  for (const key of Object.keys(voortgang) as ResourceKey[]) {
    const resterend = voortgang[key] ?? 0;
    if (resterend <= 0) continue;
    const totaal = improvement.kosten[key] ?? 0;
    const perBeurt = Math.ceil(totaal / improvement.bouwtijdBeurten);
    maxBeurten = Math.max(maxBeurten, Math.ceil(resterend / perBeurt));
  }
  return maxBeurten;
}

// Of een lopende bouw/rekrutering de eerstvolgende beurt volledig stilligt
// door een tekort aan grondstoffen (issue: "bouwproces inzichtelijk maken" —
// "als er geen bouwmaterialen op voorraad zijn ... graag een attentie dat er
// de volgende beurt niets gebouwd gaat worden"). Zelfde per-beurt-bedrag als
// `investeerInBouwkosten` hierboven, maar zonder de voorraad te muteren: pas
// als voor élk resterend grondstoftype de voorraad de per-beurt-investering
// niet haalt, gebeurt er komende beurt werkelijk niets.
export function bouwStagneertVolgendeBeurt(
  improvement: Improvement,
  voortgang: Partial<Record<ResourceType, number>>,
  voorraad: Record<MateriaalType, number>
): boolean {
  for (const key of Object.keys(voortgang) as ResourceKey[]) {
    const resterend = voortgang[key] ?? 0;
    if (resterend <= 0) continue;

    const totaal = improvement.kosten[key] ?? 0;
    const perBeurt = Math.ceil(totaal / improvement.bouwtijdBeurten);
    const bedrag = Math.min(perBeurt, resterend);

    if (!isMateriaalType(key) || voorraad[key] >= bedrag) return false;
  }
  return true;
}

// Goud-rush-bouwen (hoofdstuk 5/14, issue: "toevoeging Goud" Deel 2): koopt
// resterende beurten van een lopend land- of city-improvement af met goud in
// plaats van te wachten op de normale per-beurt-investering hierboven. Alleen
// voor `soort: "land"`/`"city"` — de aanroepers (`versnelBouwMetGoud` e.a.
// verderop) sluiten `soort: "unit"` (Soldaat, Nieuwe settler) en de
// technologieboom (die geen eigen bouwwachtrij kent) uit, precies zoals het
// issue vraagt: die drempels houden hun eigen tempo.
export const RUSH_GOUD_PER_BEURT = 5;

// Hoeveel goud nodig is om de volledige resterende bouwtijd in één keer af te
// kopen — gebruikt door de UI om te tonen wat volledig rushen kost naast wat
// de speler daadwerkelijk in voorraad heeft.
export function rushKostenGoud(
  improvement: Improvement,
  voortgang: Partial<Record<ResourceType, number>>
): number {
  return resterendeBouwBeurten(improvement, voortgang) * RUSH_GOUD_PER_BEURT;
}

// Koopt zoveel mogelijk van de resterende bouwtijd af (nooit meer dan nodig,
// nooit meer dan het beschikbare goud toelaat) — de speler kan dus ook maar
// een deel van de beurten wegkopen als het goud niet toereikend is voor de
// volledige rush. Dezelfde per-beurt-bedragen als `investeerInBouwkosten`
// hierboven, maar zonder de grondstofvoorraad aan te spreken: goud vervangt
// hier de resterende materiaalbetaling, in plaats van ernaast te komen.
export function pasVersnellingToe(
  improvement: Improvement,
  voortgang: Partial<Record<ResourceType, number>>,
  beschikbaarGoud: number
): (BouwInvestering & { gouduitgegeven: number }) | null {
  const resterendeBeurten = resterendeBouwBeurten(improvement, voortgang);
  const beurten = Math.min(resterendeBeurten, Math.floor(beschikbaarGoud / RUSH_GOUD_PER_BEURT));
  if (beurten <= 0) return null;

  const nieuweVoortgang = { ...voortgang };
  for (const key of Object.keys(voortgang) as ResourceKey[]) {
    const resterend = nieuweVoortgang[key] ?? 0;
    if (resterend <= 0) continue;
    const totaal = improvement.kosten[key] ?? 0;
    const perBeurt = Math.ceil(totaal / improvement.bouwtijdBeurten);
    nieuweVoortgang[key] = Math.max(0, resterend - perBeurt * beurten);
  }

  const voltooid = (Object.values(nieuweVoortgang) as number[]).every((rest) => rest <= 0);
  return { nieuweVoortgang, voltooid, gouduitgegeven: beurten * RUSH_GOUD_PER_BEURT };
}

// "A2. Zaadselectie" (hoofdstuk 3/9, techTree.ts: boerderij-uitputting 25%
// trager) wordt hier toegepast — op het moment dat de tile "actief" wordt,
// niet per beurt tijdens het aftellen (`verwerkUitputting` in
// uitputtingEnVerval.ts telt gewoon 1 per beurt af, ongeacht de tech): de
// totale levensduur wordt langer verlengd, precies zoals de bestaande
// `uitputtingBeurten`-waarden al een vaste levensduur per improvement-type
// zijn.
// Past een `BouwInvestering`-uitkomst toe op een tile — gedeeld tussen de
// normale per-beurt-verwerking (`verwerkTileInAanbouw` hieronder) en
// goud-rush-bouwen (`versnelBouwMetGoud` verderop), zodat een gerushte tile
// exact dezelfde voltooiingslogica krijgt als een normaal-voltooide tile
// (o.a. de boerderij-uitputtingsfactor hieronder).
function pasTileInvesteringToe(
  tile: Tile,
  improvement: Improvement,
  resultaat: BouwInvestering,
  technologieen: TechId[]
): Tile {
  if (resultaat.voltooid) {
    const beurtenTotUitputting =
      improvement.uitputtingBeurten !== undefined && improvement.id === "boerderij"
        ? Math.round(improvement.uitputtingBeurten * boerderijUitputtingFactor(technologieen))
        : improvement.uitputtingBeurten;
    return {
      ...tile,
      status: "actief",
      bouwVoortgang: undefined,
      beurtenTotUitputting,
    };
  }

  return { ...tile, bouwVoortgang: resultaat.nieuweVoortgang };
}

function verwerkTileInAanbouw(tile: Tile, voorraad: Record<MateriaalType, number>, technologieen: TechId[]): Tile {
  const improvement = tile.improvement;
  if (!improvement || !tile.bouwVoortgang) return tile;

  const resultaat = investeerInBouwkosten(improvement, tile.bouwVoortgang, voorraad);
  if (!resultaat) return tile;

  return pasTileInvesteringToe(tile, improvement, resultaat, technologieen);
}

// Opslag-effecten van land improvements (momenteel alleen de Voorraadkuil,
// hoofdstuk 3/9: "A1. Aardewerk") tellen direct bij voltooiing mee, niet pas
// na wegverbinding zoals productie-effecten (`verwerkProductie` in
// productie.ts) — een opslagvergroting is een structurele capaciteit, geen
// lopende oogst, net als de Opslagplaats-city-improvement (hoofdstuk 3/5,
// `verwerkOpslagplaats` in groeiEnRekrutering.ts) die om dezelfde reden ook
// geen wegverbinding vereist.
export function verwerkBouwwachtrij(state: GameState): GameState {
  const voorraad = { ...state.voorraad };
  let opslagCap = state.opslagCap;

  const lagen = state.lagen.map((laag) => ({
    ...laag,
    tiles: laag.tiles.map((tile) => {
      if (tile.status !== "in_aanbouw") return tile;
      const nieuweTile = verwerkTileInAanbouw(tile, voorraad, state.technologieen);
      if (nieuweTile.status === "actief" && nieuweTile.improvement?.effect.type === "opslag") {
        opslagCap += nieuweTile.improvement.effect.waarde ?? 0;
      }
      return nieuweTile;
    }),
  }));

  return { ...state, lagen, voorraad, opslagCap };
}

// Koopt de resterende bouwtijd van een land-tile-in-aanbouw af met goud
// (hoofdstuk 5/14, issue: "toevoeging Goud" Deel 2) — negeert de aanroep
// stilzwijgend als de tile niet (meer) in aanbouw is of er geen goud te
// besteden valt, zelfde veilige-aanroep-conventie als `startBouw`. Land
// improvements zijn altijd `soort: "land"`, dus geen aparte uitsluiting nodig
// zoals bij de civiele wachtrij (`versnelCivielMetGoud` in
// groeiEnRekrutering.ts, die ook `soort: "unit"` kan bevatten).
export function versnelBouwMetGoud(state: GameState, hoogte: number, positieInLaag: number): GameState {
  const laag = state.lagen.find((l) => l.hoogte === hoogte);
  const tile = laag?.tiles[positieInLaag];
  if (!tile || tile.status !== "in_aanbouw" || !tile.improvement || !tile.bouwVoortgang) return state;

  const resultaat = pasVersnellingToe(tile.improvement, tile.bouwVoortgang, state.voorraad.goud);
  if (!resultaat) return state;

  const nieuweTile = pasTileInvesteringToe(tile, tile.improvement, resultaat, state.technologieen);
  const voorraad = { ...state.voorraad, goud: state.voorraad.goud - resultaat.gouduitgegeven };
  let opslagCap = state.opslagCap;
  if (nieuweTile.status === "actief" && nieuweTile.improvement?.effect.type === "opslag") {
    opslagCap += nieuweTile.improvement.effect.waarde ?? 0;
  }

  const lagen = state.lagen.map((l) =>
    l.hoogte !== hoogte
      ? l
      : { ...l, tiles: l.tiles.map((t, index) => (index === positieInLaag ? nieuweTile : t)) }
  );

  return { ...state, lagen, voorraad, opslagCap };
}
