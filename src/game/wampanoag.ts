// Wampanoag-Verkenning (Going West, M21e, opdracht-wampanoag-opening.md §5;
// blokkerend gemaakt door issue "Wampanoag streek blokkerend"): de
// Wampanoag-streek (`WAMPANOAG_STREEK_HOOGTE`, worldGoingWest.ts) komt "in
// beeld" met alle negen vakjes verhuld en blijft `ontgrendeld: false` —
// zelfde blokkerende rol als de Bezette Streek (`Streek.bezet`,
// streekOntgrendeling.ts: settler/frontier komen er niet voorbij, wetenschap
// ontgrendelt geen streken meer verderop) — maar met een eigen
// `Streek.wampanoagBezet`-vlag i.p.v. `Streek.bezet` zelf, en eigen
// `Tile.wampanoagVerhuld`/`wampanoagInhoud`/`wampanoagVerkenningInGang`-velden
// (types.ts) i.p.v. de bestaande `verhuld`/`bezetteStreekInhoud`/
// `verkenningInGang`: de Bezette Streek lost zichzelf op via
// `verwerkBelegering` (vijandelijke Heiligdom-/Wachttoren-inhoud), en die
// resolutielogica past niet op Wampanoag-inhoud. De streek lost hier in
// plaats daarvan op zodra de 3-3-3-handelsdrempel op de drie handelsvakjes
// (met `wampanoagInhoud`) gehaald is — zie `verwerkWampanoagFaseAfsluiting`
// hieronder (herzien door issue "Wampanoag streek pas helemaal onthuld na
// handel": puur ontdekken van de drie vakjes, via
// `verwerkWampanoagVerkenningInGang`, maakt ze alleen handelbaar, dat
// ontgrendelt de streek zelf niet meer) — de overige zes "neutrale" vakjes
// onthullen dan automatisch mee, maar zijn (net als de drie handelsvakjes)
// al vanaf het begin individueel verkenbaar (net als een "huisje"-vakje bij
// de Bezette Streek).
//
// Hergebruikt bewust dezelfde kosten/bouwtijd (`VERKENNER.kosten`/
// `VERKENNER.bouwtijdBeurten`, improvements.ts) en de EXACT ZELFDE
// 1x-per-beurt-limiet (`GameState.verkenningGedaanDitBeurt`,
// `VERKENNING_KOSTEN_WETENSCHAP` uit streekOntgrendeling.ts) als de
// Bezette-Streek-Verkenning: de opdracht is expliciet "geen nieuwe
// kostenbalans hiervoor bouwen" (§5). Het delen van de 1x-per-beurt-vlag met
// de Bezette Streek is een bewuste, veilige vereenvoudiging — de twee
// reveal-lagen draaien in de praktijk nooit tegelijk (Bezette Streek is
// tutorial-only op streek 13, Wampanoag is Going-West-only op
// `WAMPANOAG_STREEK_HOOGTE`).

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
// hier komt te staan (`undefined` op een neutraal vakje, precies zoals de
// "huisje"-loze vakjes van de Bezette Streek). Zelfde "meerdere vakjes
// tegelijk onderweg"-gedrag als `verwerkVerkenningInGang`
// (streekOntgrendeling.ts): elk vakje telt onafhankelijk af, ongeacht op
// welke beurt de verkenner gestuurd is.
//
// Onthult uitsluitend het losse vakje zelf — dat maakt het handelbaar (zie
// `verwerkWampanoagHandel` hieronder), maar ontgrendelt de streek als geheel
// nog niet. Herzien door issue "Wampanoag streek pas helemaal onthuld na
// handel": vóór die issue onthulden de resterende neutrale vakjes automatisch
// mee en werd de streek al ontgrendeld zodra alleen deze drie vakjes ontdekt
// waren — dat vond de speler te vroeg. Die volledige-streek-resolutie
// (neutrale vakjes onthullen, `wampanoagBezet: false`/`ontgrendeld: true`)
// loopt sindsdien via `verwerkWampanoagFaseAfsluiting` hieronder, pas bij de
// 3-3-3-handelsdrempel.
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

// Geldige handelskeuzes per Wampanoag-inhoud (opdracht §6, tabel; herzien
// door issue "Smederij inactief zetten": erts is als keuze geschrapt, zodat
// gereedschap de enige handelswaar is voor Maïsboerderij/Beverjachthut en de
// Smederij de enige plek blijft die nog erts omzet). Opperhoofdtent
// (Cultureel/diplomatiek van aard, opdracht §2) blijft alleen goud.
const WAMPANOAG_HANDEL_OPTIES: Record<WampanoagInhoud, WampanoagHandelKeuze[]> = {
  maisboerderij: ["gereedschap"],
  beverjachthut: ["gereedschap"],
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
// mogelijk voor deze twee samen.
export const WAMPANOAG_HANDEL_KEUZE_LABELS: Record<WampanoagHandelKeuze, string> = {
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
// Gebruikt door zowel de statusweergave (WampanoagPaneel.tsx) als de
// `cultureelOntgrendeld`-omslag in `verwerkWampanoagFaseAfsluiting` hieronder.
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
  // "Ontvangen"-vlaggen voor de ResourceHud (issue: "Alle voorraden tonen in
  // resource block") — zelfde eenmalige-garantie-patroon als
  // `gereedschapOntvangen` in productie.ts, maar dan voor de drie
  // handelswaren die hier bij komen.
  let bevervellenOntvangen = state.bevervellenOntvangen;
  let maisOntvangen = state.maisOntvangen;
  let wampumOntvangen = state.wampumOntvangen;

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
    if (goed === "bevervellen") {
      bevervellen += 1;
      bevervellenOntvangen = true;
    } else if (goed === "mais") {
      mais += 1;
      maisOntvangen = true;
    } else {
      wampum += 1;
      wampumOntvangen = true;
    }
  }

  return {
    ...state,
    voorraad,
    gereedschap,
    bevervellen,
    mais,
    wampum,
    bevervellenOntvangen,
    maisOntvangen,
    wampumOntvangen,
  };
}

// Afsluiting van de openingsfase (Going West, M21g, opdracht-wampanoag-opening.md
// §7): "3-3-3-drempel is hard en per type apart gecontroleerd" — geen
// cumulatieve som, alle drie moeten onafhankelijk de drempel halen.
export function heeftWampanoagHandelsdrempelGehaald(state: GameState): boolean {
  return (
    state.bevervellen >= WAMPANOAG_HANDELSDREMPEL &&
    state.mais >= WAMPANOAG_HANDELSDREMPEL &&
    state.wampum >= WAMPANOAG_HANDELSDREMPEL
  );
}

// Zet de streek-resolutie zodra de 3-3-3-drempel gehaald is (opdracht §7,
// herzien door issue "Wampanoag streek pas helemaal onthuld na handel"): pas
// nu — niet meer zodra de drie vaste vakjes ontdekt zijn, zie
// `verwerkWampanoagVerkenningInGang` hierboven — onthullen de resterende
// neutrale vakjes automatisch mee en telt de streek weer als normaal
// ontgrendeld (`wampanoagBezet: false`, `ontgrendeld: true`): de settler mag
// er dan pas doorheen. `wampanoagRelatieGelegdEvent` drijft de narratieve
// bevestigingspop-up. De gecapte stadsverbeteringen-pool (`cultureelOntgrendeld`)
// hangt sinds diezelfde issue niet langer aan deze drempel, maar aan de
// Smederij (`metCultureelOntgrendeldDoorSmederij`, groeiEnRekrutering.ts) —
// die omslag blijft hier dus buiten beeld.
//
// Guard op `streek.wampanoagBezet` (i.p.v. het vroegere `cultureelOntgrendeld`)
// maakt dit vanzelf een eenmalige, onomkeerbare omslag per streek — eenmaal
// opgelost, blijft opgelost, ook al zou een voorraad later weer onder de
// drempel zakken (de opdracht vraagt geen "terugval"-gedrag). Bestaat de
// Wampanoag-streek niet (tutorial, of een campagne zonder deze laag), dan is
// dit vanzelf een no-op.
export function verwerkWampanoagFaseAfsluiting(state: GameState): GameState {
  const streek = vindWampanoagStreek(state);
  if (!streek || !streek.wampanoagBezet || !heeftWampanoagHandelsdrempelGehaald(state)) return state;

  const streken = state.streken.map((s) =>
    s.hoogte !== streek.hoogte
      ? s
      : {
          ...s,
          wampanoagBezet: false,
          ontgrendeld: true,
          tiles: s.tiles.map((t) => (t.wampanoagVerhuld ? { ...t, wampanoagVerhuld: false } : t)),
        }
  );

  return {
    ...state,
    streken,
    wampanoagRelatieGelegdEvent: true,
  };
}

// Sluit de "Wampanoag-relatie gelegd"-melding (opdracht §7/§8) — puur een
// UI-bevestiging, zelfde patroon als `sluitWampanoagLaagOntdektMelding`
// (streekOntgrendeling.ts).
export function sluitWampanoagRelatieGelegdMelding(state: GameState): GameState {
  return { ...state, wampanoagRelatieGelegdEvent: undefined };
}

// Of de Wampanoag "gepacificeerd" zijn — d.w.z. de 3-3-3-handelsdrempel is
// gehaald en `verwerkWampanoagFaseAfsluiting` hierboven heeft de streek al
// opgelost (`wampanoagBezet: false`). Gebruikt door de generieke wampum-
// afkoop (issue "Wampum — invallen tijdelijk afkopen", indringersEnDieren.ts)
// als de expliciet gevraagde voorwaarde: de speler mag wampum pas als
// diplomatieke afkoopvaluta inzetten zodra dit eerste verbond met de
// Wampanoag zelf gesloten is. `false` zolang de streek niet bestaat (tutorial,
// of een campagne zonder Wampanoag-laag) — dan is er ook geen wampum-bron, dus
// geen zinvolle afkoop mogelijk.
export function heeftWampanoagVerbond(state: GameState): boolean {
  const streek = vindWampanoagStreek(state);
  return streek !== undefined && !streek.wampanoagBezet;
}
