# Going West — campagne-ontwerp (ankers, afstandsverval, weergavenamen)

Dit bestand bevat de campagne-specifieke inhoud voor de Amerikaanse
frontier-campagne ("Going West") die eerder in hoofdstuk 9 (en delen van
hoofdstuk 14) van `frontier-city-design-doc.md` stond. De algemene,
campagne-onafhankelijke spelmechanica (waar deze content op voortbouwt) staat
nog gewoon in het hoofddocument — zie de hoofdstukverwijzingen hieronder.

Zie ook [`opdracht-wampanoag-opening.md`](./opdracht-wampanoag-opening.md)
voor de technische opdracht van de openingsfase (streek 1-4, vóór onderstaande
ankers beginnen).

**Status**: de drie ankers hieronder zijn inhoudelijk beschreven, maar nog niet
technisch/inhoudelijk uitgewerkt in code (issue #278, vraag 3). Dit is bewust
een **doorlopend, incrementeel proces zonder vaste opleverdatum** — geen aparte
milestone die dit in één keer "afrondt"; de ankers worden gaandeweg, stap voor
stap opgepakt. Ze zijn geen onderdeel van de eerdere blocker 1 (zie
[`implementatie-status.md`](./implementatie-status.md)) en vormden geen poort
voor `beschikbaar: true`.

**Toon**: donkerder en minder heroïsch dan klassieke western-verhalen —
geïnspireerd op de sfeer van *Blood Meridian*. Geen morele framing door het
spel zelf; geweld en keuzes worden beschreven, niet beoordeeld.

## Anker 1 (streek 8-10) — Eerste contact
Twee keuzes (geen neutrale derde optie):
- **Handel aanbieden** → kleine economische bonus nu; de tribe groeit sterker mee met jouw voortgang.
- **Land claimen** → gratis land improvement-vakje nu; start een **zichtbare wrokmeter** die oploopt tot Anker 2.

## Anker 2 (streek 16-18) — vertakt per keuze uit Anker 1

*Vanuit Handel:*
- **Verdrag sluiten** → permanente/vergrote economische relic; tribe blijft neutrale sterke buur.
- **Ruil ondermijnen** → grote eenmalige economische boost; tribe wordt blijvend vijandig.

*Vanuit Land claimen (wrokmeter vol):*
- **Terugvechten** → directe militaire confrontatie; winst = lagere wrok maar beschadigde streek (versnelde uitputting); verlies = richting stadsverval.
- **Tribuut aanbieden** → wrok daalt fors, eenmalig fors verlies van huidige opbrengst; geen garantie voor de toekomst.

## Anker 3 (richting oceaan) — vier tonale/mechanisch verschillende varianten
Gedeelde flavor-kern, uitkomst (winnen) gelijk voor iedereen, maar elk pad krijgt een eigen soort obstakel:
- **Na Verdrag**: tolgang-onderhandeling (resource-management, geen gevecht) — bijv. met Comanche onder Buffalo Hump.
- **Na Ruil ondermijnen**: pure militaire confrontatie, zwaarste directe slag — bijv. Apache onder Mangas Coloradas.
- **Na Terugvechten**: lange, uitputtende tocht over meerdere half-uitgeputte streken (uithoudingstest, geen piekmoment).
- **Na Tribuut**: moreel/strategisch dilemma — permanent relic-verlies voor gegarandeerde doorgang, óf onvoorbereid gevecht.

**Lange mars (Anker 3, na Terugvechten)**
- Uitgestrekt over 3-4 opeenvolgende streken in plaats van één piekmoment.
- Vooruitkijk-bereik tijdelijk teruggezet naar 0 extra streken tijdens deze reeks.
- Alle land improvements in deze streken hebben standaard verlaagde opbrengst (het beschadigde land werkt door).
- Geen nieuwe stad te stichten binnen deze reeks.
- Zichtbare voorraadmeter (materiaal tegenover resterende streken) i.p.v. een harde timer.
- Bij te weinig voorraad aan het einde: geen instant game-over, maar een verzwakte aankomst (kleinere stad-status bij de oceaan, beïnvloedt slotscène/flavor) — consistent met "hard maar eerlijk" bij nederlagen (zie hoofdstuk 11 van het hoofddocument).

## Afstandsverval & het herhalende drie-stichtingsmomenten-patroon

Zodra een speler meerdere steden heeft (vanaf deze campagne), geldt voor elke stad die niet meer de actieve frontier is een geleidelijk, afstandsafhankelijk verval van haar city-improvement-productie, hieronder uitgewerkt.

**Deel 1 — Afstandsverval van city improvements**

Voor elke gestichte stad wordt de **afstand** bijgehouden: het aantal streken tussen die stad en de huidige frontier-streek. De frontier beweegt alleen vooruit, dus deze afstand kan alleen groeien. De doorlopende productie van de city improvements van die stad (Bibliotheek, Markt, Barakken, Tempel, Grote Tempel — hoofdstuk 3/13/14 van het hoofddocument) wordt vermenigvuldigd met een effectiviteitspercentage dat van die afstand afhangt, in vier zones:

| Afstand tot de stad | Effectiviteit |
|---|---|
| 0-4 streken | 100% ("gezond") |
| 5-8 streken | 65% (begint te verminderen) |
| 9-12 streken | 30% (flink verminderd) |
| 13+ streken ("de grens") | 0% — werkt niet meer, stad is volledig uitgeput qua city-improvement-nut |

MVP-richtwaarden, tunebaar — doorgerekend tegen de campagne-continentlengte van 30-60 streken (hoofdstuk 14 van het hoofddocument).

Dit verval raakt uitsluitend de stad-brede city-improvement-productie. **Niet aangeraakt**: land improvements (mijn, boerderij, Sterrencirkel, Amberader, etc.) blijven gewoon normaal produceren zolang ze wegverbonden zijn (hoofdstuk 16), ongeacht afstand. Ook het stadsverval/permadeath-risico (hoofdstuk 4) blijft ongewijzigd — een stad op 0% city-improvement-effectiviteit kan nog gewoon blijven bestaan, ze levert alleen niets meer op via haar gebouwen. Bij meerdere gelijktijdig actieve steden wordt dit per stad apart berekend.

**Deel 2 — Drie gegarandeerde stichtingskansen per stad, herhalend**

Geen eenmalige, vaste telling van 3 stichtingen over de hele run, maar een **patroon dat zich herhaalt voor elke actieve stad**. Zodra een stad gesticht is, garandeert de worldgen drie momenten waarop de speler een nieuwe stad **kán** stichten, gekoppeld aan de afstandszones hierboven — telkens een gegarandeerd vers-water-vakje (hoofdstuk 2 van het hoofddocument):

1. **Vóór de stad begint te verminderen**: een gegarandeerd vers-water-vakje ergens binnen afstand 0-4 van de huidige stad (de "gezonde" zone). Vroeg stichten, met een gezonde buffer.
2. **Terwijl de stad al aan het verminderen is**: een gegarandeerd vers-water-vakje ergens binnen afstand 5-12 (één van beide verval-zones). Stichten met minder buffer, maar nog niet acuut.
3. **Zodra de stad volledig is uitgeput**: een gegarandeerd vers-water-vakje zodra afstand 13+ bereikt wordt (de 0%-zone). De oude stad levert dan al niets meer op via city improvements — de speler voelt de noodzaak, maar wordt niet hard geblokkeerd (hij kan in theorie nog verder trekken zonder te stichten, alleen zonder city-improvement-voordeel).

Of de speler bij kans 1, 2 of 3 daadwerkelijk sticht, is aan hem — dat hangt af van hoeveel voorraad hij nog heeft en hoeveel risico hij wil nemen door langer te wachten. Zodra hij sticht, begint dit hele patroon (Deel 1 + Deel 2) opnieuw voor de nieuwe stad.

Bij een campagnelengte van 30-40 streken (Normaal, hoofdstuk 14 van het hoofddocument) herhaalt dit patroon zich met deze afstandszones typisch ongeveer 3 keer over een hele run — vandaar het "verhaal in 3 delen"-gevoel — maar dit is een natuurlijk gevolg van de gekozen getallen, geen harde limiet. Bij een lange "Moeilijk"-campagne (45-60 streken) kan het vaker gebeuren. Het is dus een herhalend mechanisme, geen geharde "maximaal/precies 3 keer"-teller.

Stad stichten blijft een **settler-actie** (hoofdstuk 6/13 van het hoofddocument, inclusief de bestaande "maximaal één settler per gestichte stad"-regel), mogelijk op **elke** al ontgrendelde streek — een uitzondering op de frontier-only-bouwregel, zoals Wachttoren/Legerkamp al hebben (hoofdstuk 6/11) — mits er vers water direct naast ligt (hoofdstuk 2) en de settler er fysiek naartoe reist. De allerlaatste, verplichte stichting blijft bij de oceaan aan het einde van de campagne (bestaande win-conditie, hoofdstuk 1) — die telt gewoon mee als een van deze cykli, in de 0%-zone van de laatst gestichte stad als de speler tot dan toe heeft doorgetrokken.

Hoe dit precies samenvalt met de bestaande Anker-verhalen hierboven (rond streek 8-10/16-18/eindspel) moet nog op elkaar afgestemd worden in een latere opdracht — dit mechanisme is hier op zichzelf staand uitgewerkt.

*Doorrekening tegen de campagnelengte*: een speler die telkens pas bij kans 3 (afstand 13+) sticht, legt tussen twee stichtingen ten minste 13 streken frontier-voortgang af — bij Normaal (30-40 streken) past dat ruwweg **3 cycli** (3 × 13 ≈ 39, aan de bovenkant van de range), bij Moeilijk (45-60 streken) **3-4 cycli**, bij Makkelijk (20-25 streken) **1-2 cycli**. Een speler die eerder sticht (kans 1 of 2) start een nieuwe cyclus sneller, dus dit is een ondergrens-schatting van het aantal cycli, geen exacte voorspelling — vandaar "typisch ~3 keer" hierboven, niet een harde teller.

*Implementatiestatus (M18, zie de milestone-tabel in hoofdstuk 13 van het hoofddocument)*: de drie kans-hoogten zelf liggen inmiddels vast als pure functie, `gegarandeerdeStichtingskansHoogten()` (`src/game/stad.ts`) — vaste, deterministische offsets t.o.v. de streekHoogte van de stichtende stad: **+3** (kans 1, binnen de 0-4-zone), **+8** (kans 2, het midden van de 5-12-verval-zones), **+13** (kans 3, exact de drempel van de uitgeputte zone). Deze functie is inmiddels gekoppeld aan een echte, handgeschreven plaatsing van vers-water-vakjes op de vaste Going West-campagnewereld (M20b/M20c, `src/game/worldGoingWest.ts`) — zie de milestone-tabel in hoofdstuk 13 van het hoofddocument voor de actuele implementatiestand.

**Implementatiestatus**: zie de milestone-tabel in hoofdstuk 13 van het hoofddocument (M16 t/m M20g) voor de volledige, actuele stand van de code voor dit mechanisme.

## Flavor-tekststijlgids
1. Korte, vaak enkelvoudige zinnen — kracht in understatement.
2. Geen emotie-bijvoeglijke naamwoorden ("verschrikkelijk", "triomfantelijk").
3. Geen moreel oordeel in de tekst ("helaas", "terecht").
4. Concreet/zintuiglijk boven abstract (geur, geluid, licht i.p.v. sfeerbeschrijving).
5. Herhaling/cadans als bewust stijlmiddel ("geen X, geen Y").
6. Historische namen/volken mogen gebruikt worden, functioneel beschreven — geen karikatuur.
7. Stiltes toegestaan — een flavor-tekst hoeft niet samen te vatten wat er net gebeurde.

## Weergavenamen (functionele sleutel ongewijzigd)

Zelfde herbruikbaarheidspatroon als de technologie-boom en de tegel-sets uit hoofdstuk 13 van het hoofddocument (`CampaignConfig.techNamen`/`improvementNamen`, types.ts): de functionele sleutel (`Improvement.id`/`TechId`) en alle bijbehorende kosten/effecten/gating blijven ongewijzigd — alleen de naam die de speler te zien krijgt, verandert per campagne (`improvementNaam()`/`techNaam()`). Ontbreekt een sleutel (of heeft de campagne geen override), dan valt de weergave terug op de tutorial-naam. De `CampaignConfig`-instantie voor deze campagne (`GOING_WEST_CAMPAGNE`, `src/game/campagnes.ts`) gebruikt onderstaande tabel al als `improvementNamen` (hoofdstuk 13, M20a).

**Land improvements**

| Functionele sleutel (tutorial-naam) | Amerikaanse weergavenaam |
|---|---|
| Sterrencirkel | Observatorium |
| Amberader/goudmijn | Goudmijn |
| Wachttoren | Blokhuis |
| Legerkamp | Fort |
| Heiligdom | Kapel |
| Offer Altaar | Opwekkingstent |

Boerderij, Mijn, Houtkap, Steengroeve en Voorraadkuil krijgen geen aparte Amerikaanse naam — generiek genoeg voor beide settings, blijven de tutorial-naam tonen via de bestaande fallback.

**City improvements**

| Functionele sleutel (tutorial-naam) | Amerikaanse weergavenaam |
|---|---|
| Markt | Handelspost |
| Opslagplaats | Pakhuis |
| Bibliotheek | Schoolhuis |
| Barakken | Garnizoen |
| Tempel | Kerk |
| Grote Tempel | Kathedraal |
| Woonwijk (klein → middel) | Hoofdstraat |
| Grote Woonwijk (middel → groot) | Spoorwegstation |

**Units**

| Functionele sleutel (tutorial-naam) | Amerikaanse weergavenaam |
|---|---|
| Verkenner | Spoorzoeker |
| Missionaris | Prediker |
| Karavaan (post-MVP, meerdere steden — zie hoofdstuk 13 van het hoofddocument) | Handelswagen |

De Huifkar (settler) krijgt geen aparte naam — al generiek/thematisch passend, blijft ongewijzigd.
