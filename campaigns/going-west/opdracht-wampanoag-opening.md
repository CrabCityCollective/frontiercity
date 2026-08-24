# Opdracht: Openingsfase Amerikaanse campagne — Wampanoag/Massasoit

## Context
Dit implementeert de eerste vier streken van de Amerikaanse frontier-campagne
("Going West"), vóór de bestaande Anker-verhalen. De speler landt, heeft nog
geen cultuur-economie, en moet via wetenschap streken ontgrendelen tot hij de
Wampanoag-laag op streek 4 bereikt. Daar moet hij drie handelsvakjes onthullen
en tot een vaste drempel handelen voordat de normale cultuur-gedreven
streek-ontgrendeling en de volledige stadsverbeteringen-pool weer opengaan.

Bouwt voort op bestaande patronen: de Bezette-Streek-Verkenning (hoofdstuk 6),
de city-improvement-cap (hoofdstuk 3/4/11), en de campagne-specifieke
weergavenamen (hoofdstuk 9). Hergebruik die patronen zoveel mogelijk in plaats
van nieuwe systemen te bouwen.

---

## 1. Data model

- **`CampaignConfig`**: nieuw veld `popupTeksten` (key-value, functionele sleutel
  → tekst), zelfde terugval-patroon als `techNamen`/`improvementNamen`: geen
  override → geen flavor-tekst getoond (of generieke placeholder, geen tutorial-
  lek). Narratieve/flavor-pop-ups gaan hierin. Mechaniek-uitleg-pop-ups
  (streek-per-streek-tutorial-teksten) blijven **buiten** `CampaignConfig` —
  losstaand, universeel, herbruikbaar over campagnes heen.
- Nieuwe resource-tracking voor drie handelswaren: **bevervellen, maïs, wampum**
  — zelfde soort cap-loze/aparte voorraad als bestaande resources, per stad.
  Harde drempel: **3 van elk, apart**, geen cumulatieve som.
- Nieuwe grondstof-afgeleide: **gereedschap** (output van Smederij), telt als
  eigen kleine voorraad, geen gedeelde cap-koppeling nodig (lage volumes).
- Vlag op `GameState` of `City`: `cultureelOntgrendeld: boolean` (default false
  voor deze campagne-opening) — bepaalt of de Cultureel-categorie zichtbaar is
  in de land-improvement-categoriekeuze. Wordt `true` zodra 3-3-3-drempel
  gehaald is.
- Vlag `ontgrendelResource: 'wetenschap' | 'cultuur'` per campagne-fase — bepaalt
  welke valuta streek-ontgrendeling aandrijft. Start op `wetenschap`, schakelt
  naar `cultuur` bij dezelfde 3-3-3-trigger.

## 2. Nieuwe land improvements (categorie Economisch, tenzij anders vermeld)

| Improvement | Terrein-eis | Rol |
|---|---|---|
| Maïsboerderij | vlakke grond | Wampanoag-vakje, niet door speler gebouwd — onthuld |
| Beverjachthut | vers water | Wampanoag-vakje, onthuld |
| Opperhoofdtent | geen | Wampanoag-vakje, onthuld — Cultureel/diplomatiek van aard |

Deze drie zijn **geen normale, bouwbare land improvements** via de
categorie-keuze-flow. Ze bestaan alleen op streek 4 (Wampanoag-laag), verhuld
tot onthuld via Verkenner-actie, exact zoals vijandelijke Wachttoren/Heiligdom-
tiles bij de bestaande Bezette Streek. Visueel apart skinnen (niet als gewone
Boerderij/vergelijkbaar).

## 3. Nieuwe city improvement: Smederij

- Categorie Economisch, **buiten de city-improvement-cap** (zelfde uitzondering
  als Opslagplaats — reden: zou bij kleine stad de facto verplicht zijn).
- Conversie: **2 erts → 1 gereedschap per beurt**, zolang erts voorradig is
  (anders: geen conversie die beurt, geen negatieve voorraad — zelfde regel
  als tribuut-afhandeling).
- Blijft na deze openingsfase gewoon staan/nuttig voor latere campagne-lagen.

## 4. Openingsfase streek 1-3

- **Update (issue "Going west campaign geen tutorial")**: Militair stond hier
  eerder ook als verborgen categorie, en de gedeelde `minStreek`-velden op
  Houtkap/Boerderij/Mijn/Wachttoren/Sterrencirkel (improvements.ts, oorspronkelijk
  tutorial-pacing) golden ook voor Going West — dat bleek een ongewenste
  tutorial-achtige beperking (op streek 1 was letterlijk alleen de Steengroeve
  bouwbaar). Beide zijn losgelaten: `beschikbareOpties` negeert `minStreek`
  zodra er een campagne actief is, en `OPENINGSFASE_VERBORGEN_CATEGORIEEN`
  bevat alleen nog Cultureel. Zichtbare categorieën in land-improvement-keuze
  tijdens streek 1-4: **alles, behalve Cultureel** (Civiel toont sowieso geen
  losse land-improvement-opties, zie `IMPROVEMENT_POOLS.civiel`).
- Stadsverbeteringen-scherm (gecapte pool): **alleen Smederij** zichtbaar.
- Civiele wachtrij (los, bestaand mechanisme): Woonwijk + settler, ongewijzigd.
- Streek-ontgrendeling loopt op **wetenschap**, niet cultuur. Wetenschap komt uit
  Sterrencirkel zoals gewoonlijk (put niet uit, volle opbrengst op frontier,
  helft eronder).
- Drempels (MVP-richtwaarde, tunebaar): streek 2 = 10, streek 3 = 20,
  streek 4 ("in beeld") = 35.

## 5. Streek 4 — Wampanoag-laag

- Trigger bij 35 wetenschap: narratieve pop-up (`CampaignConfig.popupTeksten`,
  sleutel bijv. `eersteContactPopup`) — introduceert Massasoit/Wampanoag.
- Streek toont drie **verhulde** vakjes, per-tegel verhullingslaag zoals
  bestaande Bezette-Streek-tiles.
- **Onthullen**: klik op verhuld vakje = directe Verkenner-actie. **Hergebruik
  exact de bestaande tutorial-Verkenner-kosten/bouwtijd/max-1-per-beurt-limiet**
  — geen nieuwe kostenbalans hiervoor bouwen.
- Terrein bepaalt welk van de drie gebouwen ergens kán liggen (zie tabel
  hierboven) — geen aparte trekking/keuze-UI nodig, terreinsubtype van het
  vakje bepaalt het resultaat.
- Statusbalkje op de kaart (buiten stadsmenu, zelfde patroon als bestaande
  Bezette-Streek-balkje) toont voortgang van onthullingen + handel.

## 6. Handel

- **Geen aparte Handelaar-unit.** Klik op een **onthuld** Wampanoag-vakje →
  pop-up met grondstofkeuze:
  - Maïsboerderij / Beverjachthut: erts **of** gereedschap
  - Opperhoofdtent: goud
- Conversie **1:1**, **start direct vanaf de klik-beurt**, geen opstart-
  vertraging.
- Elke beurt: trekt gekozen grondstof uit gedeelde opslag, voegt 1 eenheid
  bevervel/maïs/wampum toe (afhankelijk van vakje). Onvoldoende voorraad =
  geen conversie die beurt, geen negatieve waarden.
- **Instant, omkeerbaar**: klik opnieuw op het vakje om grondstofkeuze te
  wijzigen of handel te pauzeren — zelfde interactiepatroon als
  Wachttoren-bemanning.
- Drempel: **3 bevervellen + 3 maïs + 3 wampum**, hard, elk apart (niet
  cumulatief) — pas bij alle drie ≥3 is de fase voltooid.

## 7. Afsluiting van de fase

Zodra 3-3-3 gehaald is:
- `cultureelOntgrendeld = true` → Cultureel-categorie (Heiligdom/Kapel)
  wordt zichtbaar in land-improvement-keuze.
- `ontgrendelResource` schakelt van `wetenschap` naar `cultuur` voor
  streek 5 en verder (wetenschap blijft daarna gewoon actief voor de
  technologie-boom, zoals in de tutorial).
- Narratieve pop-up bevestigt het omslagpunt (nieuwe sleutel in
  `popupTeksten`, bijv. `wampanoagRelatieGelegdPopup`).
- Zodra de stad (los, via Woonwijk) naar "middel" groeit: cap wordt 3, volledige
  normale city-improvement-pool ontgrendelt naast de Smederij.

## 8. Pop-up-architectuur (belangrijk, los systeem)

Drie gescheiden lagen, niet vermengen:

1. **Mechaniek-uitleg-pop-ups** — universeel, campagne-onafhankelijk, blijven
   buiten `CampaignConfig`. Triggeren op mechanisch moment, tonen altijd
   dezelfde tekst ongeacht campagne.
2. **Narratieve/flavor-pop-ups** — campagne-gebonden, leven in
   `CampaignConfig.popupTeksten` onder een functionele sleutel. Trigger-logica
   (wannéér) blijft generiek in de code; alleen de tekst-invulling verschilt
   per campagne. Voorbeelden hier: `eersteContactPopup`,
   `wampanoagRelatieGelegdPopup`.
3. **Systeem-pop-ups zonder flavor** (bevestigingsschermen, "weet je het
   zeker?") — puur functioneel, horen bij geen van beide, blijven generiek.

Zorg dat er geen enkel pad is waarop een tutorial-uitleg-tekst of een andere
campagne se flavor-tekst per ongeluk in de Amerikaanse-campagne-flow verschijnt,
en andersom.

---

## Acceptatiecriteria

- [ ] Speler kan op streek 1-3 alleen Economisch/Wetenschappelijk bouwen, plus
      Smederij (city, buiten cap) en Woonwijk/settler (civiele wachtrij).
- [ ] Streek-ontgrendeling 1→4 loopt aantoonbaar op wetenschap, niet cultuur.
- [ ] Bij 35 wetenschap verschijnt de Massasoit-pop-up en toont streek 4 drie
      verhulde vakjes.
- [ ] Onthullen via klik + Verkenner-tellertje werkt met de bestaande
      tutorial-Verkenner-kosten, max 1 gestart per beurt.
- [ ] Terrein-subtype van het vakje bepaalt welk gebouw onthuld wordt.
- [ ] Klik op onthuld vakje opent grondstofkeuze en start conversie direct,
      zonder vertraging, omkeerbaar.
- [ ] Smederij zet 2 erts om in 1 gereedschap per beurt, bruikbaar als
      alternatieve handelsinput.
- [ ] 3-3-3-drempel is hard en per type apart gecontroleerd.
- [ ] Bij het halen van de drempel: Cultureel-categorie ontgrendelt, ontgrendel-
      resource schakelt naar cultuur, bevestigingspop-up verschijnt.
- [ ] Mechaniek-uitleg-pop-ups, campagne-flavor-pop-ups en systeem-pop-ups zijn
      technisch gescheiden (aparte databronnen/sleutels), geen kruisbesmetting
      tussen tutorial en Amerikaanse campagne.
