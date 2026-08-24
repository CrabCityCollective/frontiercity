// Wampanoag-Verkenning (Going West, M21e, opdracht-wampanoag-opening.md §5):
// een parallelle, niet-blokkerende onthullings-flow op streek 4, expliciet
// los van de Bezette-Streek-toestandsmachine (streekOntgrendeling.ts).
// Streek 4 zelf wordt gewoon normaal `ontgrendeld: true` zodra de
// wetenschapsdrempel gehaald is (`verwerkStreekOntgrendeling`) — er is geen
// `Streek.bezet`-achtige vlag die de streek bevriest. Alleen de drie vaste
// Wampanoag-vakjes (worldGoingWest.ts: `initialiseerWampanoagLaag`) blijven
// daarna nog individueel verhuld tot de speler er een Verkenner naartoe
// stuurt — vandaar de eigen `Tile.wampanoagVerhuld`/`wampanoagInhoud`/
// `wampanoagVerkenningInGang`-velden (types.ts) in plaats van de bestaande
// `verhuld`/`bezetteStreekInhoud`/`verkenningInGang`, die semantisch aan de
// Bezette Streek gekoppeld zijn.
//
// Hergebruikt bewust dezelfde kosten/bouwtijd (`VERKENNER.kosten`/
// `VERKENNER.bouwtijdBeurten`, improvements.ts) en de EXACT ZELFDE
// 1x-per-beurt-limiet (`GameState.verkenningGedaanDitBeurt`,
// `VERKENNING_KOSTEN_WETENSCHAP` uit streekOntgrendeling.ts) als de
// Bezette-Streek-Verkenning: de opdracht is expliciet "geen nieuwe
// kostenbalans hiervoor bouwen" (§5). Het delen van de 1x-per-beurt-vlag met
// de Bezette Streek is een bewuste, veilige vereenvoudiging — de twee
// reveal-lagen draaien in de praktijk nooit tegelijk (Bezette Streek is
// tutorial-only op streek 13, Wampanoag is Going-West-only op streek 4).

import { BEVERJACHTHUT, MAISBOERDERIJ, OPPERHOOFDTENT, VERKENNER } from "./improvements";
import { VERKENNING_KOSTEN_WETENSCHAP } from "./streekOntgrendeling";
import { GameState, Improvement, Settler, WampanoagInhoud } from "./types";
import { WAMPANOAG_STREEK_HOOGTE } from "./worldGoingWest";

// Vaste inhoud-sleutel → daadwerkelijk `Improvement`-object — worldGoingWest.ts
// kent alleen de functionele sleutel (`WampanoagInhoud`), niet het
// improvement zelf (zelfde scheiding als `onthuldImprovementVoorInhoud` in
// streekOntgrendeling.ts voor de Bezette Streek).
const WAMPANOAG_IMPROVEMENT_VOOR_INHOUD: Record<WampanoagInhoud, Improvement> = {
  maisboerderij: MAISBOERDERIJ,
  beverjachthut: BEVERJACHTHUT,
  opperhoofdtent: OPPERHOOFDTENT,
};

function vindWampanoagStreek(state: GameState) {
  return state.streken.find((streek) => streek.hoogte === WAMPANOAG_STREEK_HOOGTE);
}

// Alle nog verhulde Wampanoag-vakjes — gebruikt door de canvas om ze als
// klikbaar te markeren (zelfde rol als `verhuldeBezetteStreekPosities` in
// streekOntgrendeling.ts voor de Bezette Streek).
export function verhuldeWampanoagPosities(state: GameState): Settler[] {
  const streek = vindWampanoagStreek(state);
  if (!streek) return [];
  return streek.tiles
    .filter((tile) => tile.wampanoagVerhuld)
    .map((tile) => ({ hoogte: streek.hoogte, positieInStreek: tile.positieInStreek }));
}

// Of een klik op dit verhulde Wampanoag-vakje een verkenner mag sturen —
// zelfde voorwaarden als `kanStuurVerkenner` (streekOntgrendeling.ts): het
// vakje moet nog verhuld zijn zonder lopende verkenning, de gedeelde
// 1x-per-beurt-limiet mag nog niet gebruikt zijn, en de speler moet zowel de
// grondstoffen (`VERKENNER.kosten`) als de wetenschap
// (`VERKENNING_KOSTEN_WETENSCHAP`) kunnen betalen.
export function kanStuurVerkennerWampanoag(state: GameState, positieInStreek: number): boolean {
  const streek = vindWampanoagStreek(state);
  if (!streek) return false;
  const tile = streek.tiles[positieInStreek];
  if (!tile?.wampanoagVerhuld || tile.wampanoagVerkenningInGang) return false;
  if (state.verkenningGedaanDitBeurt) return false;
  if (state.wetenschap < VERKENNING_KOSTEN_WETENSCHAP) return false;

  return Object.entries(VERKENNER.kosten).every(
    ([resource, aantal]) => (state.voorraad[resource as keyof typeof state.voorraad] ?? 0) >= (aantal ?? 0)
  );
}

// Stuurt een verkenner naar `positieInStreek` op de Wampanoag-streek —
// betaalt meteen de grondstoffen + wetenschap en zet een aftellend tellertje
// (`Tile.wampanoagVerkenningInGang`) i.p.v. het vakje meteen te onthullen,
// zie `verwerkWampanoagVerkenningInGang` hieronder. Negeert de aanroep
// stilzwijgend bij een ongeldige aanroep — zelfde veilige-aanroep-conventie
// als `stuurVerkenner`.
export function stuurVerkennerWampanoag(state: GameState, positieInStreek: number): GameState {
  if (!kanStuurVerkennerWampanoag(state, positieInStreek)) return state;

  const streek = vindWampanoagStreek(state)!;
  const voorraad = { ...state.voorraad };
  for (const [resource, aantal] of Object.entries(VERKENNER.kosten)) {
    voorraad[resource as keyof typeof voorraad] -= aantal ?? 0;
  }

  const streken = state.streken.map((s) =>
    s.hoogte !== streek.hoogte
      ? s
      : {
          ...s,
          tiles: s.tiles.map((t, index) =>
            index !== positieInStreek
              ? t
              : { ...t, wampanoagVerkenningInGang: { beurtenResterend: VERKENNER.bouwtijdBeurten } }
          ),
        }
  );

  return {
    ...state,
    streken,
    voorraad,
    wetenschap: state.wetenschap - VERKENNING_KOSTEN_WETENSCHAP,
    verkenningGedaanDitBeurt: true,
  };
}

// Telt elk lopend Wampanoag-verkennings-tellertje één beurt af — op 0 wordt
// het vakje onthuld: `wampanoagInhoud` (vastgelegd bij het ontstaan van de
// laag, zie `initialiseerWampanoagLaag` in worldGoingWest.ts) bepaalt via
// `WAMPANOAG_IMPROVEMENT_VOOR_INHOUD` hierboven welk van de drie improvements
// hier komt te staan. Zelfde "meerdere vakjes tegelijk onderweg"-gedrag als
// `verwerkVerkenningInGang` (streekOntgrendeling.ts): elk vakje telt
// onafhankelijk af, ongeacht op welke beurt de verkenner gestuurd is.
export function verwerkWampanoagVerkenningInGang(state: GameState): GameState {
  const streek = vindWampanoagStreek(state);
  if (!streek || !streek.tiles.some((tile) => tile.wampanoagVerkenningInGang)) return state;

  const tiles = streek.tiles.map((tile) => {
    if (!tile.wampanoagVerkenningInGang) return tile;

    const beurtenResterend = tile.wampanoagVerkenningInGang.beurtenResterend - 1;
    if (beurtenResterend > 0) return { ...tile, wampanoagVerkenningInGang: { beurtenResterend } };

    const improvement = tile.wampanoagInhoud ? WAMPANOAG_IMPROVEMENT_VOOR_INHOUD[tile.wampanoagInhoud] : undefined;
    return {
      ...tile,
      wampanoagVerhuld: false,
      wampanoagVerkenningInGang: undefined,
      improvement,
      status: improvement ? ("actief" as const) : tile.status,
    };
  });

  const streken = state.streken.map((s) => (s.hoogte === streek.hoogte ? { ...s, tiles } : s));
  return { ...state, streken };
}
