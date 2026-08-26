# Frontier City — instructies voor Claude Code

Dit project bouwt "Frontier City", een rogue-like Civilization-achtig spel voor mobiel. Het volledige ontwerp staat in `frontier-city-design-doc.md` — lees dat document eerst voordat je begint aan een taak.

## Scope van dit moment

De tutorial-MVP (hoofdstuk 13 van het design-document, "Technische opzet & bouwplan") is **klaar** (M0 t/m M19: "De Eerste Vuren", Het Hertenpad-volk, is volledig speelbaar). Het huidige bouwdoel is nu de **Amerikaanse frontier-campagne** ("Going West", hoofdstuk 9), zie hoofdstuk 15 ("Huidige prioriteit & later op te pakken"). Dat betekent concreet:

- De meerdere-steden-fundering, het afstandsverval van city improvements en de kern van het herhalende drie-stichtingsmomenten-patroon staan al in de code (M16-M18, hoofdstuk 9/13) — bouw daarop voort in plaats van opnieuw te beginnen.
- Nog te bouwen: een echte, langere campagnewereld (30-60 streken, hoofdstuk 8/14) met een eigen `CampaignConfig`-instantie voor de Amerikaanse campagne, en de worldgen-koppeling die het stichtingspatroon daadwerkelijk speelbaar maakt. Zie hoofdstuk 13's milestone-tabel voor de voorgestelde vervolgstap (M20).
- De tutorial blijft bestaan en speelbaar als losstaande, eerste campagne (hoofdstuk 10) — dit is een verschuiving van bouwprioriteit, geen vervanging. Wijzig de tutorial-content niet om ruimte te maken voor Amerikaanse-campagne-content; die twee horen los van elkaar te blijven (zie ook de weergavenamen-aanpak in hoofdstuk 9, die functionele sleutels deelt maar per campagne een eigen naam toont).
- Geen zeldzaamheid (rijk/legendarisch), geen vooruitkijk verder dan 1 streek, geen culturele pushback-diplomatie. Deze staan bewust **niet** in scope — bouw er geen code voor die je later toch weg moet gooien, maar houd de data-schema's er wel op voorbereid (zie de TypeScript-interfaces in het document, die bevatten al optionele velden voor latere uitbreiding).
- Overige campagnes (Mongools, Romeins, etc., hoofdstuk 14) blijven buiten scope tot de Amerikaanse campagne af is (hoofdstuk 15).

## Stack

- Next.js + TypeScript
- Rendering van het tegel-grid via HTML Canvas
- Geen backend in de MVP — saves lokaal (localStorage/IndexedDB)

## Visuele stijl

De tutorial-assets volgen de **Riven/Myst-referentie**: stil, schilderachtig, warm/aards licht, verwondering. De Amerikaanse-campagne-assets volgen een andere, donkerdere **Diablo II-achtige** stijl (zie hoofdstuk 12 van het design-document) — niet de Riven/Myst-sfeer van de tutorial. Losse tegels per improvement, geen naadloos geschilderd tafereel — dat maakt het mogelijk om per campagne een eigen tegelset te voeren zonder de renderlogica aan te passen (zie ook de weergavenamen-tabel in hoofdstuk 9).

Assets mogen grove/simpele placeholders zijn (kleurvlakken met een eenvoudige schets is prima) — functionaliteit gaat voor polish.

## Werkwijze

Werk de milestones uit hoofdstuk 13 **één voor één** af, in volgorde — elke milestone is een losse, afgeronde taak. Voltooi en test een milestone voordat je aan de volgende begint. Raadpleeg bij twijfel over spelmechaniek altijd eerst het relevante hoofdstuk in `frontier-city-design-doc.md` (met name hoofdstuk 11, "Belangrijkste ontwerpoverwegingen", voor de *reden* achter een keuze — dat voorkomt dat een detail per ongeluk anders wordt geïmplementeerd dan bedoeld).

Bij twijfel of iets in scope van het huidige bouwdoel valt: raadpleeg hoofdstuk 15 ("Huidige prioriteit") en de milestone-tabel in hoofdstuk 13 — een taak die niet bij de huidige prioriteit (nu: de Amerikaanse campagne) of een bestaande/voorgestelde milestone hoort, hoort er nog niet in. Grote, architectuur-rakende stappen (zoals een nieuwe campagnewereld) horen eerst als aparte milestone voorgesteld te worden in plaats van blind in één sessie meegenomen te worden — zie de M20-voorstel-aanpak in hoofdstuk 13 als voorbeeld.
