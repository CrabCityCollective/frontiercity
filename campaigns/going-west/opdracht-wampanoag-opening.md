# Opdracht: Openingsfase Amerikaanse campagne — Wampanoag/Massasoit

**Herzien (issue "Weer gewoon cultuur voor ontgrendeling")**: de
wetenschap-gedreven streek-ontgrendeling van §4 hieronder (en de bijbehorende
`ontgrendelResource`-vlag uit §1/§7) bleek nodeloos ingewikkeld en is
teruggedraaid — streek-ontgrendeling loopt in Going West, net als in de
tutorial, weer altijd op cultuur, en Cultureel-improvements (Heiligdom e.a.)
zijn weer gewoon bouwbaar vanaf streek 1. Wetenschap drijft sindsdien alleen
nog de technologieboom en de Verkenner-actie (§5: het onthullen van
Wampanoag-vakjes blijft wetenschap kosten). De rest van deze opdracht — de
Wampanoag-laag zelf, de Smederij, de handel (§6) en de gecapte
stadsverbeteringen-pool die tot de 3-3-3-handelsdrempel op alleen de Smederij
blijft staan (§7) — staat nog steeds, ongewijzigd. De paragrafen hieronder
zijn met dit voorbehoud gelezen te worden; ze zijn historisch gelaten in
plaats van herschreven.

## Context
Dit implementeert de eerste zes streken van de Amerikaanse frontier-campagne
("Going West"), vóór de bestaande Anker-verhalen. De speler landt, heeft nog
geen cultuur-economie, en moet via wetenschap streken ontgrendelen tot hij de
Wampanoag-laag op streek 6 bereikt. Die streek is (issue: "Wampanoag streek
blokkerend") volledig bezet — de settler kan er niet doorheen, en wetenschap
ontgrendelt geen streken meer verderop — tot hij daar drie handelsvakjes heeft
onthuld met Verkenners. Pas daarna kan hij tot een vaste drempel handelen
voordat de normale cultuur-gedreven streek-ontgrendeling en de volledige
stadsverbeteringen-pool weer opengaan.

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
  gehaald is. **Herzien**: bepaalt sindsdien alleen nog of de gecapte
  stadsverbeteringen-pool en het Wampanoag-statusbalkje getoond worden — de
  Cultureel-categorie zelf is niet langer aan deze vlag gekoppeld (zie de
  herziening bovenaan dit document).
- ~~Vlag `ontgrendelResource: 'wetenschap' | 'cultuur'` per campagne-fase —
  bepaalt welke valuta streek-ontgrendeling aandrijft. Start op `wetenschap`,
  schakelt naar `cultuur` bij dezelfde 3-3-3-trigger.~~ **Vervallen** (zie de
  herziening bovenaan dit document): streek-ontgrendeling loopt altijd op
  cultuur, dit veld bestaat niet meer.

## 2. Nieuwe land improvements (categorie Economisch, tenzij anders vermeld)

| Improvement | Terrein-eis | Rol |
|---|---|---|
| Maïsboerderij | vlakke grond | Wampanoag-vakje, niet door speler gebouwd — onthuld |
| Beverjachthut | vers water | Wampanoag-vakje, onthuld |
| Opperhoofdtent | geen | Wampanoag-vakje, onthuld — Cultureel/diplomatiek van aard |

Deze drie zijn **geen normale, bouwbare land improvements** via de
categorie-keuze-flow. Ze bestaan alleen op streek 6 (Wampanoag-laag), verhuld
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

## 4. Openingsfase streek 1-5

- **Update (issue "Going west campaign geen tutorial")**: Militair stond hier
  eerder ook als verborgen categorie, en de gedeelde `minStreek`-velden op
  Houtkap/Boerderij/Mijn/Wachttoren/Sterrencirkel (improvements.ts, oorspronkelijk
  tutorial-pacing) golden ook voor Going West — dat bleek een ongewenste
  tutorial-achtige beperking (op streek 1 was letterlijk alleen de Steengroeve
  bouwbaar). Beide zijn losgelaten: `beschikbareOpties` negeert `minStreek`
  zodra er een campagne actief is. **Herzien (issue "Weer gewoon cultuur voor
  ontgrendeling")**: `OPENINGSFASE_VERBORGEN_CATEGORIEEN`/`categorieZichtbaar`
  bestaan niet meer — Cultureel is sindsdien net als elke andere categorie
  altijd zichtbaar, ook tijdens de openingsfase. Zichtbare categorieën in
  land-improvement-keuze tijdens streek 1-6: **alles** (Civiel toont sowieso
  geen losse land-improvement-opties, zie `IMPROVEMENT_POOLS.civiel`).
- Stadsverbeteringen-scherm (gecapte pool): **alleen Smederij** zichtbaar
  (ongewijzigd — blijft aan `cultureelOntgrendeld` gekoppeld).
- Civiele wachtrij (los, bestaand mechanisme): Woonwijk + settler, ongewijzigd.
- ~~Streek-ontgrendeling loopt op **wetenschap**, niet cultuur.~~ **Herzien**:
  streek-ontgrendeling loopt, net als in de tutorial, op **cultuur** — de
  drempels hieronder golden alleen voor de teruggedraaide wetenschap-variant
  en zijn niet meer in gebruik (`cultuurKostenVoorStreek` in world.ts blijft
  de enige drempelformule). Wetenschap komt uit Sterrencirkel zoals
  gewoonlijk (put niet uit, volle opbrengst op frontier, helft eronder) en
  drijft nog wel de technologieboom en de Verkenner-actie (§5 hieronder).
- ~~Drempels (MVP-richtwaarde, tunebaar): streek 2 = 10, streek 3 = 18,
  streek 4 = 25, streek 5 = 30, streek 6 ("in beeld") = 35.~~ Vervallen samen
  met de wetenschap-variant hierboven.

## 5. Streek 6 — Wampanoag-laag (issue: "Wampanoag streek blokkerend")

- Trigger bij de cultuurdrempel van streek 6 (`cultuurKostenVoorStreek(6)`,
  wereldwaarde van de Going West-kaart — vóór de herziening was dit "bij 35
  wetenschap"): narratieve pop-up (`CampaignConfig.popupTeksten`, sleutel
  bijv. `eersteContactPopup`) — introduceert Massasoit/Wampanoag.
- **Blokkerend**, net als de bestaande Bezette Streek: de streek komt "in
  beeld" met `ontgrendeld: false` en blijft dat tot de fase hieronder is
  opgelost — de settler kan er niet doorheen lopen, en de cultuur-gedreven
  streek-ontgrendeling (§4) stopt hier (ontgrendelt geen streken meer
  verderop). Wetenschap blijft wél bruikbaar om vakjes binnen deze streek te
  onthullen (Verkenner-actie hieronder kost immers wetenschap) — dat is
  sindsdien de enige plek waar wetenschap nog invloed heeft op deze streek.
- Streek toont **alle negen vakjes verhuld** (niet alleen de drie
  handelsvakjes), per-tegel verhullingslaag zoals bestaande
  Bezette-Streek-tiles — de zes vakjes zonder bijzondere inhoud zijn
  "neutraal" (net als bij de Bezette Streek) en onthullen automatisch mee
  zodra de drie handelsvakjes onthuld zijn.
- **Onthullen**: klik op verhuld vakje = directe Verkenner-actie. **Hergebruik
  exact de bestaande tutorial-Verkenner-kosten/bouwtijd/max-1-per-beurt-limiet**
  — geen nieuwe kostenbalans hiervoor bouwen.
- Terrein bepaalt welk van de drie gebouwen ergens kán liggen (zie tabel
  hierboven) — geen aparte trekking/keuze-UI nodig, terreinsubtype van het
  vakje bepaalt het resultaat.
- **Opgelost** zodra de drie handelsvakjes onthuld zijn: de streek telt
  vanaf dan weer als normaal ontgrendeld (frontier/settler mogen verder), de
  resterende neutrale vakjes onthullen in één keer mee.
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
- `cultureelOntgrendeld = true` → opent de gecapte stadsverbeteringen-pool
  (Bibliotheek/Markt/Barakken/Tempel/Grote Tempel) naast de Smederij, en
  verbergt het Wampanoag-statusbalkje. **Herzien**: de Cultureel-categorie
  (Heiligdom/Kapel) zelf hangt hier niet meer van af — die is al vanaf
  streek 1 zichtbaar in de land-improvement-keuze (zie §4).
- ~~`ontgrendelResource` schakelt van `wetenschap` naar `cultuur` voor
  streek 5 en verder (wetenschap blijft daarna gewoon actief voor de
  technologie-boom, zoals in de tutorial).~~ **Vervallen** (zie de herziening
  bovenaan dit document): streek-ontgrendeling liep hier al op cultuur.
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

- [x] Speler kan op streek 1-5 alle categorieën bouwen (**herzien**: ook
      Cultureel, niet alleen Economisch/Wetenschappelijk/Militair), plus
      Smederij (city, buiten cap) en Woonwijk/settler (civiele wachtrij).
- [x] ~~Streek-ontgrendeling 1→6 loopt aantoonbaar op wetenschap, niet
      cultuur.~~ **Herzien**: loopt aantoonbaar op cultuur, net als de rest
      van het spel (zie de herziening bovenaan dit document).
- [x] Bij de cultuurdrempel van streek 6 verschijnt de Massasoit-pop-up en
      toont streek 6 negen verhulde vakjes; de streek zelf blijft
      `ontgrendeld: false` (settler kan er niet doorheen, streek-ontgrendeling
      ontgrendelt geen streken meer verderop) tot de drie handelsvakjes
      onthuld zijn.
- [ ] Onthullen via klik + Verkenner-tellertje werkt met de bestaande
      tutorial-Verkenner-kosten, max 1 gestart per beurt.
- [ ] Terrein-subtype van het vakje bepaalt welk gebouw onthuld wordt.
- [ ] Klik op onthuld vakje opent grondstofkeuze en start conversie direct,
      zonder vertraging, omkeerbaar.
- [ ] Smederij zet 2 erts om in 1 gereedschap per beurt, bruikbaar als
      alternatieve handelsinput.
- [ ] 3-3-3-drempel is hard en per type apart gecontroleerd.
- [x] Bij het halen van de drempel: gecapte stadsverbeteringen-pool
      ontgrendelt naast de Smederij, bevestigingspop-up verschijnt (**herzien**:
      niet langer de Cultureel-categorie of een ontgrendel-resource-omslag —
      die zijn al vanaf streek 1 op cultuur, zie de herziening bovenaan dit
      document).
- [ ] Mechaniek-uitleg-pop-ups, campagne-flavor-pop-ups en systeem-pop-ups zijn
      technisch gescheiden (aparte databronnen/sleutels), geen kruisbesmetting
      tussen tutorial en Amerikaanse campagne.
