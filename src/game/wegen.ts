// Wegen & de settler (M10, hoofdstuk 16): een losse settler-eenheid legt
// wegen aan die land improvements verbinden met de stad. Alleen via zo'n
// wegverbinding wordt de productie van een land improvement daadwerkelijk
// actief (zie economie.ts: `verwerkProductie`).
//
// Geometrie: elke streek is een rij van BAND_WIDTH_TILES vakjes
// (`positieInStreek`), en streken stapelen verticaal op dezelfde x-positie (zie
// render/canvas.ts: `rijIndex = totaalStreken - streek.hoogte`) — "vooruit" en
// "achteruit" bewegen dus in hoogte, "links" en "rechts" in `positieInStreek`.

import { Streek, Settler } from "./types";
import { BAND_WIDTH_TILES, hoogsteOntgrendeldeStreek, STAD_POSITIE } from "./world";

export type SettlerRichting = "vooruit" | "achteruit" | "links" | "rechts";

// Eén vakje per beurt (hoofdstuk 16: "elke beurt 1 vakje naar voren, achter,
// of zijwaarts"), nooit diagonaal.
export function volgendePositie(settler: Settler, richting: SettlerRichting): Settler {
  switch (richting) {
    case "vooruit":
      return { ...settler, hoogte: settler.hoogte + 1 };
    case "achteruit":
      return { ...settler, hoogte: settler.hoogte - 1 };
    case "links":
      return { ...settler, positieInStreek: settler.positieInStreek - 1 };
    case "rechts":
      return { ...settler, positieInStreek: settler.positieInStreek + 1 };
  }
}

// De settler blijft, net als de speler zelf, binnen al ontgrendeld gebied —
// geen stappen de mist of de klikbare oceaan-rij in. Een rivier-vakje (issue
// "Pop-up rivier", vervolg: brug-bouwmechaniek) is bovendien onbegaanbaar
// zolang er geen brug op staat — "een rivier vakje mag niet begaanbaar zijn
// voor settlers zonder een brug".
export function magSettlerNaar(streken: Streek[], positie: Settler): boolean {
  if (positie.positieInStreek < 0 || positie.positieInStreek >= BAND_WIDTH_TILES) return false;
  if (positie.hoogte < 1 || positie.hoogte > hoogsteOntgrendeldeStreek(streken)) return false;
  const streek = streken.find((l) => l.hoogte === positie.hoogte);
  const tile = streek?.tiles[positie.positieInStreek];
  if (tile?.terrein === "rivier" && !tile.brug) return false;
  return true;
}

const ALLE_RICHTINGEN: SettlerRichting[] = ["vooruit", "achteruit", "links", "rechts"];

// Twee vakjes ver in dezelfde richting (issue: "Settlers verplaatsen sneller
// over wegen"): alleen als de hele route — het vakje waar de settler nu
// staat, én beide stappen ernaartoe — al een weg heeft. Dat maakt vooral de
// terugreis over een eerder aangelegde weg sneller; zonder weg (of met een
// weg die halverwege ophoudt) blijft het bij de gewone ene stap hierboven.
function tweedeStapOverWeg(streken: Streek[], settler: Settler, richting: SettlerRichting): Settler | undefined {
  if (!heeftWegOp(streken, settler.hoogte, settler.positieInStreek)) return undefined;
  const eersteStap = volgendePositie(settler, richting);
  if (!magSettlerNaar(streken, eersteStap) || !heeftWegOp(streken, eersteStap.hoogte, eersteStap.positieInStreek)) {
    return undefined;
  }
  const tweedeStap = volgendePositie(eersteStap, richting);
  if (!magSettlerNaar(streken, tweedeStap) || !heeftWegOp(streken, tweedeStap.hoogte, tweedeStap.positieInStreek)) {
    return undefined;
  }
  return tweedeStap;
}

// De vakjes waar de settler deze beurt naartoe kan (issue: "de tegels waar je
// heen kunt lichten op, door te klikken op een tegel ga je er naar toe") —
// gebruikt zowel om die vakjes op de canvas te markeren als om een klik op
// zo'n vakje als geldige zet te herkennen (zie economie.ts:
// `verplaatsSettlerNaar`). Bevat naast de gewone buurvakjes ook de vakjes
// twee stappen verderop als de volledige route daar over een weg loopt.
export function bereikbarePosities(streken: Streek[], settler: Settler): Settler[] {
  const eenStap = ALLE_RICHTINGEN.map((richting) => volgendePositie(settler, richting)).filter((positie) =>
    magSettlerNaar(streken, positie)
  );
  const tweeStappenOverWeg = ALLE_RICHTINGEN.map((richting) => tweedeStapOverWeg(streken, settler, richting)).filter(
    (positie): positie is Settler => positie !== undefined
  );
  return [...eenStap, ...tweeStappenOverWeg];
}

function tileSleutel(hoogte: number, positieInStreek: number): string {
  return `${hoogte}:${positieInStreek}`;
}

function buurPosities(positie: Settler): Settler[] {
  const buren: Settler[] = [
    { hoogte: positie.hoogte - 1, positieInStreek: positie.positieInStreek },
    { hoogte: positie.hoogte + 1, positieInStreek: positie.positieInStreek },
  ];
  if (positie.positieInStreek > 0) {
    buren.push({ hoogte: positie.hoogte, positieInStreek: positie.positieInStreek - 1 });
  }
  if (positie.positieInStreek < BAND_WIDTH_TILES - 1) {
    buren.push({ hoogte: positie.hoogte, positieInStreek: positie.positieInStreek + 1 });
  }
  return buren;
}

// Of dit vakje "doorgang" biedt aan het wegennetwerk: de stad zelf (het
// beginpunt), een vakje met een aangelegde weg, of — sinds de brug-
// bouwmechaniek, zie `heeftWegOp` hieronder — een brug-vakje.
function biedtDoorgang(streken: Streek[], positie: Settler): boolean {
  if (positie.hoogte === 1 && positie.positieInStreek === STAD_POSITIE) return true;
  return heeftWegOp(streken, positie.hoogte, positie.positieInStreek);
}

// Alle vakjes die via een aaneengesloten keten van wegen (of de stad zelf) te
// bereiken zijn — het wegennetwerk (hoofdstuk 16).
function wegNetwerk(streken: Streek[]): Set<string> {
  const start: Settler = { hoogte: 1, positieInStreek: STAD_POSITIE };
  const bezocht = new Set<string>([tileSleutel(start.hoogte, start.positieInStreek)]);
  const stapel: Settler[] = [start];

  while (stapel.length > 0) {
    const huidig = stapel.pop()!;
    for (const buur of buurPosities(huidig)) {
      const sleutel = tileSleutel(buur.hoogte, buur.positieInStreek);
      if (bezocht.has(sleutel) || buur.hoogte < 1 || !biedtDoorgang(streken, buur)) continue;
      bezocht.add(sleutel);
      stapel.push(buur);
    }
  }

  return bezocht;
}

// Of een land improvement op dit vakje daadwerkelijk kan produceren
// (hoofdstuk 16; issue: "een resource levert pas iets op als je de weg echt
// op die tile hebt gebouwd, niet alleen tussen de stad en de resource"). Het
// improvement-vakje zelf moet dus zelf een weg hebben (`heeftWeg`) én die weg
// moet via het wegennetwerk verbonden zijn met de stad — een weg die er
// alleen naartoe leidt, zonder erop te liggen, is niet genoeg.
export function isTileVerbondenMetStad(streken: Streek[], hoogte: number, positieInStreek: number): boolean {
  const netwerk = wegNetwerk(streken);
  return netwerk.has(tileSleutel(hoogte, positieInStreek));
}

// Welke van de vier buren van een wegvakje zelf ook een weg hebben (issue:
// "kruispunten en driesprongen zien als er een weg verticaal omhoog loopt
// vanaf een horizontale weg") — puur voor de tekenpijplijn (canvas.ts/
// canvasPixelArt.ts), zodat een wegtegel als kruising/T-splitsing i.p.v. altijd
// als los recht baantje getekend kan worden. `omhoog`/`omlaag` volgen dezelfde
// hoogte-conventie als hierboven: `omhoog` is `hoogte + 1`, de streek die op het
// canvas boven deze tegel getekend wordt (zie render/canvas.ts: `rijIndex`).
// De stadstegel telt hierin gewoon mee als "heeft een weg" (`heeftWeg: true`,
// zie world.ts), dus een weg die de stad raakt sluit ook zichtbaar op haar aan.
export interface WegVerbindingen {
  links: boolean;
  rechts: boolean;
  omhoog: boolean;
  omlaag: boolean;
}

// Een brug (issue "Pop-up rivier", vervolg: brug-bouwmechaniek) telt hier
// vanzelf mee als weg — "een brug hoeft geen weg te hebben, hij fungeert al
// als weg" (issue). Dit ene punt bepaalt zowel het wegennetwerk
// (`wegNetwerk`/`biedtDoorgang` hieronder, dus ook `isTileVerbondenMetStad`)
// als de sneller-over-wegen-settlersnelheid (`tweedeStapOverWeg` hierboven)
// als de kruispunt-rendering (`wegVerbindingen` hieronder) — een brug sluit
// zo overal naadloos aan op het wegennetwerk zonder los aangelegd te worden.
function heeftWegOp(streken: Streek[], hoogte: number, positieInStreek: number): boolean {
  const streek = streken.find((l) => l.hoogte === hoogte);
  const tile = streek?.tiles[positieInStreek];
  return Boolean(tile?.heeftWeg || tile?.brug);
}

export function wegVerbindingen(streken: Streek[], hoogte: number, positieInStreek: number): WegVerbindingen {
  return {
    links: positieInStreek > 0 && heeftWegOp(streken, hoogte, positieInStreek - 1),
    rechts: positieInStreek < BAND_WIDTH_TILES - 1 && heeftWegOp(streken, hoogte, positieInStreek + 1),
    omhoog: heeftWegOp(streken, hoogte + 1, positieInStreek),
    omlaag: heeftWegOp(streken, hoogte - 1, positieInStreek),
  };
}

// Aantal wegvakjes dat de settler zelf heeft aangelegd (issue: "Settlers
// verplaatsen sneller over wegen") — de stadstegel telt niet mee, die heeft
// altijd `heeftWeg: true` zonder dat de settler er iets voor deed (zie
// world.ts). Gebruikt om de bijbehorende uitleg-pop-up pas te tonen zodra er
// daadwerkelijk een route van minstens 2 vakjes over de weg kán lopen (zie
// GameRoot: `toonSettlerWegSnelheidUitlegPopup`).
export function aantalAangelegdeWegen(streken: Streek[]): number {
  return streken.reduce((totaal, streek) => totaal + streek.tiles.filter((tile) => tile.heeftWeg).length, 0) - 1;
}
