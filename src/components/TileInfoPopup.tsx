"use client";

import RushMetGoudKnop from "./RushMetGoudKnop";
import { KostenIcons } from "./ResourceIcoon";
import { VERKENNER } from "@/game/improvements";
import { VERKENNING_KOSTEN_WETENSCHAP } from "@/game/streekOntgrendeling";
import { TileInfo } from "@/game/tileInfo";
import { WAMPANOAG_HANDEL_KEUZE_LABELS } from "@/game/wampanoag";
import { Improvement, Missionaris, Rechter, ResourceType, Strijder, TechId, WampanoagHandelKeuze } from "@/game/types";

interface TileInfoPopupProps {
  tileInfo: TileInfo | null;
  // Als er een improvement-plaatsing loopt én de aangeklikte tile daar een
  // geldig doel voor is, tonen we naast de tile-info ook de "hier bouwen?"
  // bevestigingsvraag (zie GameRoot: `plaatsingsImprovement`).
  bouwVraag?: { improvementNaam: string };
  // Gezet in plaats van `bouwVraag` als de aangeklikte tile leeg is maar niet
  // aan de terrein-eis van de gekozen improvement voldoet (issue: "houtkap
  // alleen op bos" e.d.) — legt uit waarom hier niet gebouwd kan worden i.p.v.
  // stilzwijgend de bevestigingsvraag weg te laten.
  terreinWaarschuwing?: string;
  // Gezet als de aangeklikte tile een land-improvement in aanbouw is
  // (hoofdstuk 5/14, issue: "toevoeging Goud" Deel 2) — toont de "versnel met
  // goud"-knop naast de gewone bouwvoortgangstekst.
  rushVraag?: {
    improvement: Improvement;
    voortgang: Partial<Record<ResourceType, number>>;
    goudInVoorraad: number;
    technologieen?: TechId[];
    onVersnellen: () => void;
  };
  // Gezet als de aangeklikte tile een actieve Wachttoren is (issue:
  // "wachttorens bemannen" — herzien zodat bemannen begint bij de tile zelf
  // i.p.v. bij een strijder in het stadsmenu). Onbemand: eerst een
  // "Wachttoren bemannen"-knop, die na een klik de keuzelijst toont met ALLE
  // strijders (issue: "strijders in wachttorens" — niet alleen de vrije, zo
  // zie je in één oogopslag wie je al hebt en wie nog te kiezen is). Bemand:
  // een "stuur naar huis"-knop voor de zittende strijder.
  wachttorenVraag?: {
    bemand: boolean;
    alleStrijders: Strijder[];
    keuzeActief: boolean;
    onStartKeuze: () => void;
    onKiesStrijder: (strijderId: string) => void;
    onStuurNaarHuis: () => void;
  };
  // Gezet als de aangeklikte tile een actief Courthouse is (issue: "Onrust,
  // Saloon en Courthouse") — zelfde bemannen/naar-huis-sturen-patroon als
  // `wachttorenVraag` hierboven, maar met een Rechter i.p.v. een Strijder.
  courthouseVraag?: {
    bemand: boolean;
    alleRechters: Rechter[];
    keuzeActief: boolean;
    onStartKeuze: () => void;
    onKiesRechter: (rechterId: string) => void;
    onStuurNaarHuis: () => void;
  };
  // Gezet als de aangeklikte tile een nog verhuld vakje van een Bezette Streek
  // is (issue: "Bezette streek scherm" — vervangt de eerdere Verkenner-
  // rekrutering + losse Verkenning-modus): een klik stuurt direct een
  // verkenner, met een aftellend tellertje i.p.v. een instant onthulling.
  verkenningVraag?: {
    kan: boolean;
    onderweg?: { beurtenResterend: number };
    onStuurVerkenner: () => void;
  };
  // Gezet als de aangeklikte tile een onthulde vijandelijke Wachttoren is
  // (issue: "Bezette streek scherm" — de Confrontatie-knop verschijnt nu bij
  // een klik op de wachttoren zelf, i.p.v. in een lijst in het stadsmenu).
  // Sinds issue "Militaire confrontatie" een twee-staps flow (zelfde
  // keuze-modus-patroon als `wachttorenVraag`/`courthouseVraag` hierboven):
  // de eerste klik opent een bevestigings-pop-up met de winkans/verlieskans
  // (`winkans`), pas de tweede klik (`onBevestig`) voert de confrontatie
  // daadwerkelijk uit. `geblokkeerdTotVolgendeBeurt` onderscheidt "geen
  // Legerkamp" van "vorige beurt verloren" voor de tooltip-tekst.
  confrontatieVraag?: {
    kan: boolean;
    geblokkeerdTotVolgendeBeurt: boolean;
    winkans: number;
    keuzeActief: boolean;
    onStartKeuze: () => void;
    onBevestig: () => void;
    onAnnuleer: () => void;
  };
  // Gezet als de aangeklikte tile een al onthuld Wampanoag-vakje is (Going
  // West, M21f, opdracht-wampanoag-opening.md §6): "geen aparte
  // Handelaar-unit" — een klik opent direct de grondstofkeuze. `huidigeKeuze`
  // markeert de actief lopende ruil (of `undefined` als er nog geen gekozen
  // is, of de handel gepauzeerd staat); nogmaals op dezelfde knop klikken
  // pauzeert (zelfde interactiepatroon als Wachttoren-bemanning).
  wampanoagHandelVraag?: {
    opties: WampanoagHandelKeuze[];
    huidigeKeuze?: WampanoagHandelKeuze;
    onKiesResource: (keuze: WampanoagHandelKeuze) => void;
    onPauzeer: () => void;
  };
  // Gezet als de aangeklikte tile een onthuld vijandelijk Heiligdom is (issue:
  // "Bezette streek scherm" — een Missionaris sturen gebeurt nu met een klik
  // op het Heiligdom zelf, i.p.v. via een streek-brede belegeringsmeter).
  missionarisVraag?: {
    wololoVoortgang: number;
    wololoDrempel: number;
    beschikbareMissionarissen: Missionaris[];
    onStuurMissionaris: (missionarisId: string) => void;
  };
  onBevestigBouw: () => void;
  onAnnuleerBouw: () => void;
  onSluiten: () => void;
}

// Info-pop-up voor een aangeklikte tile (naam, soort, kort wat je erop kunt
// bouwen/wat het doet). Verschijnt voor elke tile die je aanklikt op de
// kaart. Tijdens het plaatsen van een gekozen improvement krijgt dezelfde
// pop-up er de "hier bouwen?"-bevestiging (Okee/Annuleren) bij in plaats van
// een los scherm — de speler ziet zo altijd eerst waar hij klikt.
export default function TileInfoPopup({
  tileInfo,
  bouwVraag,
  terreinWaarschuwing,
  rushVraag,
  wachttorenVraag,
  courthouseVraag,
  verkenningVraag,
  wampanoagHandelVraag,
  confrontatieVraag,
  missionarisVraag,
  onBevestigBouw,
  onAnnuleerBouw,
  onSluiten,
}: TileInfoPopupProps) {
  if (!tileInfo) return null;

  return (
    <div
      style={{
        // `fixed` i.p.v. `absolute` (issue: "popups altijd in view") — zo
        // blijft de pop-up gecentreerd op het volledige scherm, ongeacht hoe
        // ver de speler in `.game-scroll-area` gescrold heeft.
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(10, 8, 6, 0.72)",
        padding: "1rem",
        // Lager dan de meeste pop-ups (zIndex 20), zelfde reden als
        // BouwPopup: deze pop-up toont soms kosten (rush met goud,
        // verkenning) via KostenIcons, dus moet de grondstoffenbalk
        // (zIndex 18) zichtbaar blijven.
        zIndex: 15,
      }}
    >
      <div
        className="fc-paneel"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          padding: "1rem 1.25rem",
          fontSize: "0.9rem",
          minWidth: "min(24rem, 100%)",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <strong className="fc-heading" style={{ color: "var(--kleur-oker)" }}>
          {tileInfo.titel}
        </strong>
        {tileInfo.ondertitel && (
          <span style={{ color: "var(--kleur-tekst-gedempt)", fontSize: "0.8rem" }}>{tileInfo.ondertitel}</span>
        )}
        <p style={{ margin: 0 }}>{tileInfo.tekst}</p>

        {bouwVraag && (
          <>
            <p style={{ margin: "0.25rem 0 0", fontWeight: "bold" }}>
              {bouwVraag.improvementNaam} hier bouwen?
            </p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="fc-knop" onClick={onBevestigBouw} style={{ padding: "0.35rem 0.75rem" }}>
                Okee
              </button>
              <button className="fc-knop" onClick={onAnnuleerBouw} style={{ padding: "0.35rem 0.75rem" }}>
                Annuleren
              </button>
            </div>
          </>
        )}

        {!bouwVraag && terreinWaarschuwing && (
          <>
            <p style={{ margin: "0.25rem 0 0", color: "var(--kleur-oker)" }}>{terreinWaarschuwing}</p>
            <button
              className="fc-knop"
              onClick={onAnnuleerBouw}
              style={{ padding: "0.35rem 0.75rem", alignSelf: "flex-start" }}
            >
              Ander vakje kiezen
            </button>
          </>
        )}

        {!bouwVraag && !terreinWaarschuwing && rushVraag && (
          <RushMetGoudKnop
            improvement={rushVraag.improvement}
            voortgang={rushVraag.voortgang}
            goudInVoorraad={rushVraag.goudInVoorraad}
            technologieen={rushVraag.technologieen}
            onVersnellen={rushVraag.onVersnellen}
          />
        )}

        {!bouwVraag && !terreinWaarschuwing && wachttorenVraag && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {wachttorenVraag.bemand ? (
              <button
                className="fc-knop"
                onClick={wachttorenVraag.onStuurNaarHuis}
                style={{ padding: "0.35rem 0.75rem", alignSelf: "flex-start" }}
              >
                Stuur strijder naar huis
              </button>
            ) : wachttorenVraag.keuzeActief ? (
              wachttorenVraag.alleStrijders.length > 0 ? (
                <>
                  <p style={{ margin: 0, fontWeight: "bold" }}>Kies een strijder om deze wachttoren te bemannen:</p>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {wachttorenVraag.alleStrijders.map((strijder) => {
                      // Strijders die al ergens anders zijn toegewezen (issue:
                      // "strijders in wachttorens" — toon alle strijders, maar
                      // maak degenen die al bezig zijn niet kiesbaar, herkenbaar
                      // aan het icoon) blijven zichtbaar maar zijn niet
                      // klikbaar — zo zie je meteen wie je nog kunt kiezen.
                      const bezet = Boolean(strijder.wachttoren || strijder.legerkamp);
                      if (bezet) {
                        return (
                          <span
                            key={strijder.id}
                            title={
                              strijder.wachttoren
                                ? `Bemant al een andere wachttoren op streek ${strijder.wachttoren.hoogte}`
                                : `Al toegewezen aan een legerkamp op streek ${strijder.legerkamp!.hoogte}`
                            }
                            aria-label="Strijder niet beschikbaar"
                            style={{
                              padding: "0.35rem 0.6rem",
                              fontSize: "1rem",
                              lineHeight: 1,
                              opacity: 0.35,
                              cursor: "not-allowed",
                            }}
                          >
                            🛡
                          </span>
                        );
                      }
                      return (
                        <button
                          key={strijder.id}
                          className="fc-knop"
                          onClick={() => wachttorenVraag.onKiesStrijder(strijder.id)}
                          title="Kies deze strijder om de wachttoren te bemannen"
                          aria-label="Strijder beschikbaar"
                          style={{ padding: "0.35rem 0.6rem", fontSize: "1rem", lineHeight: 1 }}
                        >
                          🛡
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p style={{ margin: 0, color: "var(--kleur-oker)" }}>
                  Geen strijders beschikbaar — recruteer eerst een nieuwe strijder via het stadsmenu.
                </p>
              )
            ) : (
              <button
                className="fc-knop"
                onClick={wachttorenVraag.onStartKeuze}
                style={{ padding: "0.35rem 0.75rem", alignSelf: "flex-start" }}
              >
                Wachttoren bemannen
              </button>
            )}
          </div>
        )}

        {!bouwVraag && !terreinWaarschuwing && courthouseVraag && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {courthouseVraag.bemand ? (
              <button
                className="fc-knop"
                onClick={courthouseVraag.onStuurNaarHuis}
                style={{ padding: "0.35rem 0.75rem", alignSelf: "flex-start" }}
              >
                Stuur rechter naar huis
              </button>
            ) : courthouseVraag.keuzeActief ? (
              courthouseVraag.alleRechters.length > 0 ? (
                <>
                  <p style={{ margin: 0, fontWeight: "bold" }}>Kies een rechter om dit Courthouse te bemannen:</p>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {courthouseVraag.alleRechters.map((rechter) => {
                      const bezet = Boolean(rechter.courthouse);
                      if (bezet) {
                        return (
                          <span
                            key={rechter.id}
                            title={`Bemant al een ander Courthouse op streek ${rechter.courthouse!.hoogte}`}
                            aria-label="Rechter niet beschikbaar"
                            style={{
                              padding: "0.35rem 0.6rem",
                              fontSize: "1rem",
                              lineHeight: 1,
                              opacity: 0.35,
                              cursor: "not-allowed",
                            }}
                          >
                            ⚖
                          </span>
                        );
                      }
                      return (
                        <button
                          key={rechter.id}
                          className="fc-knop"
                          onClick={() => courthouseVraag.onKiesRechter(rechter.id)}
                          title="Kies deze rechter om het Courthouse te bemannen"
                          aria-label="Rechter beschikbaar"
                          style={{ padding: "0.35rem 0.6rem", fontSize: "1rem", lineHeight: 1 }}
                        >
                          ⚖
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p style={{ margin: 0, color: "var(--kleur-oker)" }}>
                  Geen rechters beschikbaar — leid er eerst een op via het stadsmenu.
                </p>
              )
            ) : (
              <button
                className="fc-knop"
                onClick={courthouseVraag.onStartKeuze}
                style={{ padding: "0.35rem 0.75rem", alignSelf: "flex-start" }}
              >
                Courthouse bemannen
              </button>
            )}
          </div>
        )}

        {!bouwVraag && !terreinWaarschuwing && verkenningVraag && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {verkenningVraag.onderweg ? (
              <p style={{ margin: 0 }}>
                Verkenner onderweg — nog {verkenningVraag.onderweg.beurtenResterend}{" "}
                {verkenningVraag.onderweg.beurtenResterend === 1 ? "beurt" : "beurten"} tot onthulling.
              </p>
            ) : (
              <button
                className="fc-knop"
                disabled={!verkenningVraag.kan}
                onClick={verkenningVraag.onStuurVerkenner}
                style={{ padding: "0.35rem 0.75rem", alignSelf: "flex-start", opacity: verkenningVraag.kan ? 1 : 0.5 }}
              >
                Verkenner sturen (<KostenIcons kosten={VERKENNER.kosten} />, {VERKENNING_KOSTEN_WETENSCHAP} wetenschap)
              </button>
            )}
          </div>
        )}

        {!bouwVraag && !terreinWaarschuwing && wampanoagHandelVraag && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <p style={{ margin: 0, fontWeight: "bold" }}>Kies een grondstof om mee te handelen:</p>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              {wampanoagHandelVraag.opties.map((optie) => {
                const actief = wampanoagHandelVraag.huidigeKeuze === optie;
                return (
                  <button
                    key={optie}
                    className="fc-knop"
                    onClick={() => (actief ? wampanoagHandelVraag.onPauzeer() : wampanoagHandelVraag.onKiesResource(optie))}
                    title={actief ? "Klik om de handel te pauzeren" : `Ruil elke beurt 1 ${WAMPANOAG_HANDEL_KEUZE_LABELS[optie].toLowerCase()}`}
                    style={{ padding: "0.35rem 0.6rem", fontWeight: actief ? "bold" : "normal" }}
                  >
                    {WAMPANOAG_HANDEL_KEUZE_LABELS[optie]}
                    {actief ? " ✓" : ""}
                  </button>
                );
              })}
            </div>
            {wampanoagHandelVraag.huidigeKeuze && (
              <p style={{ margin: 0, color: "var(--kleur-tekst-gedempt)" }}>
                Elke beurt 1 {WAMPANOAG_HANDEL_KEUZE_LABELS[wampanoagHandelVraag.huidigeKeuze].toLowerCase()} geruild,
                zolang de voorraad het toelaat.
              </p>
            )}
          </div>
        )}

        {!bouwVraag && !terreinWaarschuwing && confrontatieVraag && (
          confrontatieVraag.keuzeActief ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <p style={{ margin: 0 }}>
                Winkans: {Math.round(confrontatieVraag.winkans * 100)}% — verlieskans:{" "}
                {Math.round((1 - confrontatieVraag.winkans) * 100)}%. Bij verlies raak je een Legerkamp-strijder
                permanent kwijt, en kun je pas volgende beurt weer een confrontatie proberen.
              </p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="fc-knop" onClick={confrontatieVraag.onBevestig} style={{ padding: "0.35rem 0.75rem" }}>
                  Confrontatie bevestigen
                </button>
                <button className="fc-knop" onClick={confrontatieVraag.onAnnuleer} style={{ padding: "0.35rem 0.75rem" }}>
                  Annuleren
                </button>
              </div>
            </div>
          ) : (
            <button
              className="fc-knop"
              disabled={!confrontatieVraag.kan}
              onClick={confrontatieVraag.onStartKeuze}
              title={
                confrontatieVraag.kan
                  ? undefined
                  : confrontatieVraag.geblokkeerdTotVolgendeBeurt
                    ? "Na een verloren confrontatie kun je pas volgende beurt weer een confrontatie proberen"
                    : "Vereist een voltooid, wegverbonden eigen Legerkamp op de streek direct onder De Stam van de Mammoet"
              }
              style={{ padding: "0.35rem 0.75rem", alignSelf: "flex-start", opacity: confrontatieVraag.kan ? 1 : 0.5 }}
            >
              Confrontatie aangaan
            </button>
          )
        )}

        {!bouwVraag && !terreinWaarschuwing && missionarisVraag && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <p style={{ margin: 0 }}>
              Wololo-meter: {missionarisVraag.wololoVoortgang} / {missionarisVraag.wololoDrempel}
            </p>
            {missionarisVraag.beschikbareMissionarissen.length > 0 ? (
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {missionarisVraag.beschikbareMissionarissen.map((missionaris) => (
                  <button
                    key={missionaris.id}
                    className="fc-knop"
                    onClick={() => missionarisVraag.onStuurMissionaris(missionaris.id)}
                    title="Stuur deze Missionaris naar dit Heiligdom"
                    style={{ padding: "0.35rem 0.6rem" }}
                  >
                    Missionaris sturen
                  </button>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, color: "var(--kleur-tekst-gedempt)" }}>
                Geen beschikbare Missionarissen — leid er een op via het stadsmenu.
              </p>
            )}
          </div>
        )}

        {!bouwVraag && !terreinWaarschuwing && (
          <button className="fc-knop" onClick={onSluiten} style={{ padding: "0.35rem 0.75rem", alignSelf: "flex-start" }}>
            Sluiten
          </button>
        )}
      </div>
    </div>
  );
}
