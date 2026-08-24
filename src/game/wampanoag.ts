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
import { GameState, Improvement, Settler, WampanoagHandelKeuze, WampanoagInhoud } from "./types";
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

// Handel (Going West, M21f, opdracht-wampanoag-opening.md §6): "geen aparte
// Handelaar-unit" — een klik op een al onthuld Wampanoag-vakje kiest
// rechtstreeks een grondstof om per beurt 1:1 om te ruilen tegen het
// handelswaar van dat vakje, instant en omkeerbaar (zelfde interactiepatroon
// als Wachttoren-bemanning), i.p.v. de Verkenner-machinery hierboven, die
// alleen voor de onthulling zelf is.

// Geldige handelskeuzes per Wampanoag-inhoud (opdracht §6, tabel):
// Maïsboerderij/Beverjachthut ruilen erts óf gereedschap, Opperhoofdtent
// (Cultureel/diplomatiek van aard, opdracht §2) alleen goud.
const WAMPANOAG_HANDEL_OPTIES: Record<WampanoagInhoud, WampanoagHandelKeuze[]> = {
  maisboerderij: ["erts", "gereedschap"],
  beverjachthut: ["erts", "gereedschap"],
  opperhoofdtent: ["goud"],
};

// Welk handelswaar dit Wampanoag-vakje oplevert (opdracht §6) — losstaand van
// `WAMPANOAG_IMPROVEMENT_VOOR_INHOUD` hierboven, dat is voor de
// onthullings-resolutie, dit voor de lopende handelsconversie.
const WAMPANOAG_GOED_VOOR_INHOUD: Record<WampanoagInhoud, "bevervellen" | "mais" | "wampum"> = {
  maisboerderij: "mais",
  beverjachthut: "bevervellen",
  opperhoofdtent: "wampum",
};

// Weergavelabels voor de grondstofkeuze-knoppen (TileInfoPopup:
// `wampanoagHandelVraag`) — "gereedschap" is geen `ResourceType`/
// `MateriaalType`, dus geen hergebruik van `MATERIAAL_LABELS` (improvements.ts)
// mogelijk voor deze drie samen.
export const WAMPANOAG_HANDEL_KEUZE_LABELS: Record<WampanoagHandelKeuze, string> = {
  erts: "Erts",
  gereedschap: "Gereedschap",
  goud: "Goud",
};

// Weergavelabels voor de drie handelswaren, gebruikt door WampanoagPaneel.tsx
// om de lopende 3-3-3-voortgang te tonen (de drempel-afdwinging zelf is M21g).
export const WAMPANOAG_GOED_LABELS: Record<"bevervellen" | "mais" | "wampum", string> = {
  bevervellen: "Bevervellen",
  mais: "Maïs",
  wampum: "Wampum",
};

// Harde drempel, elk van de drie apart (opdracht §6/§7: "niet cumulatief").
// Nog niet afgedwongen hier — de omslag naar `cultureelOntgrendeld`/
// `ontgrendelResource` bij het bereiken ervan is M21g; alvast beschikbaar
// voor de statusweergave (WampanoagPaneel.tsx) en die latere stap.
export const WAMPANOAG_HANDELSDREMPEL = 3;

// Geldige handelskeuzes voor een vakje met deze inhoud — gebruikt door zowel
// `stelWampanoagHandelIn` (validatie) als de UI (welke knoppen tonen).
export function wampanoagHandelOpties(inhoud: WampanoagInhoud): WampanoagHandelKeuze[] {
  return WAMPANOAG_HANDEL_OPTIES[inhoud];
}

// Zet, wijzigt of pauzeert (`keuze: undefined`) de handelskeuze op een
// onthuld Wampanoag-vakje (opdracht §6: "instant, omkeerbaar ... zelfde
// interactiepatroon als Wachttoren-bemanning"). Geen kosten om te kiezen —
// de conversie zelf loopt via `verwerkWampanoagHandel` hieronder bij elke
// volgende beurtverwerking, direct vanaf de klik-beurt, zonder
// opstart-vertraging. Negeert de aanroep stilzwijgend bij een nog verhuld
// vakje, een vakje zonder Wampanoag-inhoud, of een ongeldige keuze voor dit
// vakje — zelfde veilige-aanroep-conventie als `stuurVerkennerWampanoag`.
export function stelWampanoagHandelIn(
  state: GameState,
  positieInStreek: number,
  keuze: WampanoagHandelKeuze | undefined
): GameState {
  const streek = vindWampanoagStreek(state);
  if (!streek) return state;
  const tile = streek.tiles[positieInStreek];
  if (!tile?.wampanoagInhoud || tile.wampanoagVerhuld) return state;
  if (keuze !== undefined && !WAMPANOAG_HANDEL_OPTIES[tile.wampanoagInhoud].includes(keuze)) return state;

  const streken = state.streken.map((s) =>
    s.hoogte !== streek.hoogte
      ? s
      : {
          ...s,
          tiles: s.tiles.map((t, index) => (index !== positieInStreek ? t : { ...t, wampanoagHandelKeuze: keuze })),
        }
  );

  return { ...state, streken };
}

// Past elke beurt de lopende handelsconversies toe op alle onthulde
// Wampanoag-vakjes met een actieve keuze (opdracht §6): 1 eenheid van de
// gekozen grondstof uit de voorraad, 1 eenheid handelswaar erbij. Onvoldoende
// voorraad = geen conversie die beurt, geen negatieve waarden — zelfde regel
// als de Smederij-conversie (productie.ts: "zelfde regel als
// tribuut-afhandeling"). Elk vakje wordt onafhankelijk verwerkt, zodat één
// vakje zonder voorraad de handel op de andere twee niet blokkeert.
export function verwerkWampanoagHandel(state: GameState): GameState {
  const streek = vindWampanoagStreek(state);
  if (!streek) return state;

  const handelendeTiles = streek.tiles.filter(
    (tile) => tile.wampanoagInhoud && !tile.wampanoagVerhuld && tile.wampanoagHandelKeuze
  );
  if (handelendeTiles.length === 0) return state;

  const voorraad = { ...state.voorraad };
  let gereedschap = state.gereedschap;
  let bevervellen = state.bevervellen;
  let mais = state.mais;
  let wampum = state.wampum;

  for (const tile of handelendeTiles) {
    const keuze = tile.wampanoagHandelKeuze!;

    if (keuze === "gereedschap") {
      if (gereedschap < 1) continue;
      gereedschap -= 1;
    } else {
      if (voorraad[keuze] < 1) continue;
      voorraad[keuze] -= 1;
    }

    const goed = WAMPANOAG_GOED_VOOR_INHOUD[tile.wampanoagInhoud!];
    if (goed === "bevervellen") bevervellen += 1;
    else if (goed === "mais") mais += 1;
    else wampum += 1;
  }

  return { ...state, voorraad, gereedschap, bevervellen, mais, wampum };
}
