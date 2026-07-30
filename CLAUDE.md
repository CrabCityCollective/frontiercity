# Frontier City — instructies voor Claude Code

Dit project bouwt "Frontier City", een rogue-like Civilization-achtig spel voor mobiel. Het volledige ontwerp staat in `frontier-city-design-doc.md` — lees dat document eerst voordat je begint aan een taak.

## Scope van dit moment

We bouwen op dit moment **alleen de MVP** (zie hoofdstuk 13 van het design-document: "Technische opzet & bouwplan"). Dat betekent concreet:

- Eén stad, één band van 9 vakjes, meerdere lagen — géén meerdere steden/frontier-verplaatsing nog.
- Alleen de **tutorial-content** ("De Eerste Vuren", Het Hertenpad-volk, lagen 1-12) is speelbare inhoud. Geen Amerikaanse campagne, geen andere campagnes.
- Geen zeldzaamheid (rijk/legendarisch), geen vooruitkijk verder dan 1 laag, geen culturele pushback-diplomatie. Deze staan bewust **niet** in scope — bouw er geen code voor die je later toch weg moet gooien, maar houd de data-schema's er wel op voorbereid (zie de TypeScript-interfaces in het document, die bevatten al optionele velden voor latere uitbreiding).

## Stack

- Next.js + TypeScript
- Rendering van het tegel-grid via HTML Canvas
- Geen backend in de MVP — saves lokaal (localStorage/IndexedDB)

## Visuele stijl (MVP-assets specifiek)

De tutorial-assets volgen de **Riven/Myst-referentie**: stil, schilderachtig, warm/aards licht, verwondering — niet de donkerdere Diablo II-achtige stijl die voor latere campagnes bedoeld is (zie hoofdstuk 12 van het design-document). Losse tegels per improvement, geen naadloos geschilderd tafereel — dat maakt het makkelijk om later andere campagne-tegelsets toe te voegen zonder de renderlogica aan te passen.

Voor deze eerste bouwronde mogen assets grove/simpele placeholders zijn (kleurvlakken met een eenvoudige schets is prima) — functionaliteit gaat voor polish in de MVP-fase.

## Werkwijze

Werk de milestones uit hoofdstuk 13 (M0 t/m M9) **één voor één** af, in volgorde — elke milestone is een losse, afgeronde taak. Voltooi en test een milestone voordat je aan de volgende begint. Raadpleeg bij twijfel over spelmechaniek altijd eerst het relevante hoofdstuk in `frontier-city-design-doc.md` (met name hoofdstuk 11, "Belangrijkste ontwerpoverwegingen", voor de *reden* achter een keuze — dat voorkomt dat een detail per ongeluk anders wordt geïmplementeerd dan bedoeld).

Bij twijfel of iets in scope van de huidige MVP valt: als het niet genoemd wordt onder "Wel in de MVP" in hoofdstuk 13, hoort het er nog niet in.
