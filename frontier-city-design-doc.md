# Frontier City — Design Document

Een Civilization-achtig spel voor mobiel, waarbij je niet horizontaal een kaart ontdekt, maar verticaal een beschaving opbouwt in gestapelde streken, richting een oceaan aan de overkant. Het spel behoudt hier en daar rogue-like elementen (permadeath-risico bij stadsverval, verborgen zeldzaamheid, vertakkende verhaalkeuzes), maar dat karakter is niet langer het hoofdkader van het ontwerp zoals in het oorspronkelijke plan.

Wijzigingen die in de loop van development zijn doorgevoerd, staan niet meer tussen de hoofdtekst, maar verzameld in **hoofdstuk 20, "Wijzigingsgeschiedenis"**, met de bijbehorende issue-referenties.

---

## 1. Kernconcept

- Je bouwt een beschaving **omhoog**, streek voor streek, in plaats van uit te breiden over een platte kaart.
- Drie soorten improvements: **city improvements** (in het centrum-vakje van een streek), **land improvements** (de omliggende vakjes — boerderijen, mijnen, af en toe een nieuwe stad), en **units**. Elke soort heeft zijn eigen interactie: voor een leeg land-vakje kies je eerst een **categorie** (Economisch, Wetenschappelijk, Militair, Civiel, Cultureel) en zie je daarna **alle land improvements** binnen die categorie die op dat moment geldig zijn (hoofdstuk 11); city improvements kies je via de pop-up die opent zodra je op de stad klikt, en units via hun eigen bestaande mechanisme (bv. het militaire scherm, hoofdstuk 6).
- **Win-conditie**: bereik de oceaan aan de overkant van een vast, handgeschreven continent (per campagne een eigen kaart, geen procedurele generatie — hoofdstuk 8).

---

## 2. Ruimtelijk model

- Bovenaanzicht zoals klassieke Civilization, maar beperkt tot een **verticale band van 9 vakjes breed**.
- Onderste streek = startstad (begint aan een oceaan). Daarboven telkens nieuwe streken. Onder die onderste streek toont het scherm een rij klikbare oceaan-tegels, zodat meteen duidelijk is waar de reis begint — puur sfeer/flavor-tekst bij een klik, niet bebouwbaar.
- **Fog of war** boven je huidige ontgrendelde grens; wordt weggehaald door cultuur te verzamelen.
- **Vooruitkijken**: je ziet standaard 1 streek verder dan je ontgrendelde grens (terreintype + vage dreigingsindicatie, geen exacte details). Uitbreidbaar via wetenschap-drempels (permanent, tot een max van 3-4 streken) en via de Verkenner-unit (tijdelijke, gerichte blik verder).
- Elke streek heeft **9 bouwvakken**: middelste = stad (max 1 stad per streek), overige 8 = land improvements.
- Naast het terreintype van de hele streek (bv. "loofbos", zie hoofdstuk 8) heeft elk los vakje ook een eigen **terrein-subtype** (vlak/bos/heuvel/berg) — een streek is dus geen uniform blok, maar een mix. Dit subtype bepaalt of een specifiek land improvement er neergezet mag worden (zie hoofdstuk 3 en hoofdstuk 11, "Terrein-eisen per land improvement").
- Je speelt met **1 actieve frontier-stad** tegelijk. Sticht je een nieuwe stad (op een geschikte locatie, verderop), dan schuift het scherm op — je nieuwe stad begint onderaan, als nieuwe frontier.
- **Geschikte stichtingslocatie**: een nieuwe stad kan alleen gesticht worden op een vakje dat aan **vers water** ligt — een rivier of een meer. Dit is een los, vast vakje-kenmerk (net als het terrein-subtype uit hoofdstuk 3/11), zichtbaar op de kaart zodra de streek ontgrendeld is, zodat een speler er naartoe kan plannen. Voor de tutorial ligt dit vakje uitsluitend op de allerlaatste streek — de oceaan aan de overkant, zie hoofdstuk 10/13 — de enige plek in de hele tutorial met vers water, zodat het stichten van de laatste stad een bewuste, unieke bestemming aan het eind van de tocht is.
- Niet-volledig bebouwde streken **sluiten permanent** zodra je een nieuwe stad start.
- Oudere, achtergelaten steden leveren **geleidelijk minder city-improvement-inkomsten** op naarmate ze verder achterblijven — een afstandsafhankelijk verval (hoofdstuk 9/14); hun blijvende waarde zit hoe dan ook in de specialisatie-relics die ze hebben opgeleverd voor je vertrok.

---

## 3. De vijf categorieën

| Categorie | City improvement (vb.) | Land improvement (vb.) | Unit | Relic (permanent, bij specialisatie) |
|---|---|---|---|---|
| **Economisch** | Markt (+2 goud/beurt), opslagplaats | Boerderij, mijn, houtkap, Amberader/goudmijn (interne sleutel `goudmijn`, tutorial-naam "Amberader" — hoofdstuk 14), (met "aardewerk"-tech) Voorraadkuil | Karavaan | Goedkopere improvements in elke volgende stad |
| **Wetenschappelijk** | Bibliotheek (+10 wetenschap/beurt), observatorium, universiteit | Sterrencirkel (produceert wetenschap, put niet uit — zie hoofdstuk 4/6) | Verkenner — trainbaar en functioneel: onthult vakjes op een Bezette Streek (hoofdstuk 6), 10 wetenschap per Verkenning; het vooruitkijk-bereik-effect blijft post-MVP | Permanent groter vooruitkijk-bereik |
| **Militair** | Barakken (+10 permanente legerwaarde, stad-breed, geen bemanning nodig — vereist stadsgrootte "middel"), muur, wapensmid | Wachttoren (verdedigt de streek waarop hij staat én de streek direct eronder tegen indringers — dus 2 streken per Wachttoren, put niet uit — zie hoofdstuk 6); Legerkamp (bouwbaar op elke ontgrendelde streek, net als de Wachttoren-uitzondering — geeft toegewezen Soldaten legerwaarde bij een Confrontatie tegen een Bezette Streek, hoofdstuk 6; pas bouwbaar na minstens 5 actieve Wachttorens én een Barakken, zie hoofdstuk 6/14) | Soldaat, ruiter, artillerie | Extra unit-slot / gratis startgarnizoen |
| **Civiel** | Aquaduct, riolering, woonwijk + grote woonwijk (= groei-tiers, klein→middel resp. middel→groot) | Weg, brug | Ingenieur (versnelt bouw) | Snellere groei-rijptijd in volgende steden |
| **Cultureel** | Tempel (+5 cultuur/beurt, vereist stadsgrootte "middel"), Grote Tempel (+10 cultuur/beurt bovenop een al gebouwde Tempel, dus samen +15 — een aparte, tweede slot, vereist stadsgrootte "groot"), amfitheater, monument | Heiligdom (put niet uit; volle cultuur alleen op de frontier-streek, anders de helft — zie hoofdstuk 6); Offer Altaar (ontgrendelt de Missionaris als trainbare unit, hoofdstuk 6; pas bouwbaar na minstens 5 actieve Heiligdommen én een Grote Tempel, zie hoofdstuk 6/14) | Missionaris/diplomaat — trainbaar zodra er een voltooid Offer Altaar staat: leidt cultuurproductie om naar de belegeringsmeter tegen een vijandelijk Heiligdom op een Bezette Streek (hoofdstuk 6); de culturele-pushback-diplomatie-functie blijft post-MVP | Korting op cultuurkosten voor nieuwe streken |

- "Weg" uit de tabel hierboven is voor de MVP geen gewone, met een categorie-keuze te bouwen land improvement meer, maar een apart settler-mechanisme — zie hoofdstuk 16. "Brug" blijft, net als de rest van de post-MVP-scope, voorlopig ongebouwd.
- Pool-grootte per categorie (basisversie): 6-8 city improvements, 4-6 land improvement-types, 2-3 units.
- Latere campagnes vervangen een deel van de generieke opties door thema-specifieke varianten.
- **City-improvement-capaciteit** (hoofdstuk 4/11/14): een stad kan hoogstens een aan haar grootte gekoppeld aantal city improvements tegelijk hebben — klein 1, middel 3, groot 5. Bibliotheek, Markt, Barakken, Tempel en Grote Tempel concurreren om deze sloten (Tempel en Grote Tempel tellen als twee aparte sloten); Opslagplaats en de groei-tier-improvements (Woonwijk/Grote Woonwijk) vallen hier bewust buiten — zie hoofdstuk 4/11 voor de volledige onderbouwing.
- **Terrein-eisen**: sommige land improvements zijn beperkt tot een vakje-terreinsubtype (hoofdstuk 2) — houtkap alleen op **bos**, mijn en steengroeve alleen op **heuvel of berg**, boerderij alleen op **vlakke grond**, Voorraadkuil alleen op **vlakke grond**. Overige land improvements (heiligdom, sterrencirkel, wachttoren) hebben geen terrein-eis. Zie hoofdstuk 11 voor de reden achter deze keuze.
- **Amberader/goudmijn**: dezelfde terrein-eis en bouwkosten als een gewone mijn (heuvel/berg), maar met een aanvullende, vakje-specifieke eis bovenop het terreintype — niet elk heuvel/bergvakje heeft een amberader-vondst, in tegenstelling tot een gewone erts-mijn die op elk heuvel/bergvakje mag. Zie hoofdstuk 14 voor de exacte plaatsingskans t.o.v. erts en de gegarandeerde eerste locatie vanaf streek 7, en hoofdstuk 11 voor waarom goud, net als erts, een uitputtend improvement is.
- **Wetenschap in de MVP**: de wetenschap-relic uit de tabel hierboven ("permanent groter vooruitkijk-bereik") blijft een latere post-MVP-uitwerking (hoofdstuk 13: "vooruitkijk-mechaniek verder dan 1 streek"). De MVP-functie van wetenschap is in plaats daarvan tweeledig: de **technologie-boom** (hoofdstuk 9/11/13/14, 3 drempels van elk 2 keuzes, geproduceerd door de Sterrencirkel) én **Verkenning** (10 wetenschap per vakje, hoofdstuk 6) — een bewuste afweging tussen verder verkennen en voortgang in de technologieboom.

---

## 4. Groei, uitputting & verval (de kernspanning)

- **Stadsgrootte**: klein → middel → groot. Elke tier kost een civiel improvement + rijptijd (geen instant-klik) — Woonwijk voor klein→middel, Grote Woonwijk voor middel→groot (hoofdstuk 3/14).
- **Hoe groter de tier, hoe meer city improvements je stad tegelijk kan dragen**: klein 1, middel 3, groot 5 gelijktijdige city improvements uit de gecapte pool (Bibliotheek, Markt, Barakken, Tempel, Grote Tempel — hoofdstuk 3/14). Opslagplaats valt hier bewust buiten (eigen, herhaalbare wachtrij, zie hoofdstuk 3/5); de Anker-verhaal-relics (hoofdstuk 9) zijn een volledig apart, ongewijzigd mechanisme — zie hoofdstuk 11 voor waarom deze twee "relic"-achtige systemen los van elkaar staan. Staat een stad al op haar maximum, dan zijn overige city improvements niet bouwbaar tot de stad groeit — maar hoe langer je blijft, hoe verder het omliggende land uitput.
- **Land improvements putten uit** (per type verschillende snelheid — mijnen sneller dan boerderijen), en worden daarna permanent **ghost-town-tiles**: onbebouwbaar, maar met kleine passieve culturele waarde en een rol in flavor-teksten aan het einde van een run. De teller telt pas af zodra het vakje daadwerkelijk **actief-producerend** is — dus gebouwd én via een wegverbinding met de stad verbonden (hoofdstuk 16). Staat een improvement nog te wachten op zijn wegverbinding, dan blijft de teller stilstaan: geen productie betekent geen uitputting.
- **Uitzondering: Wachttoren, Heiligdom en Sterrencirkel putten niet uit.** Ze blijven permanent actief in plaats van ooit een ghost-town-tile te worden — alledrie zijn een structurele, doorlopende aanwezigheid (wachtpost, cultusplek, sterrenobservatorium) in plaats van een verbruikende oogst zoals een mijn of boerderij: er is geen fysieke grondstof die opraakt. Zie hoofdstuk 6 voor wat ze in plaats daarvan wél doen (indringers afweren, cultuur produceren, wetenschap produceren).
- **Voedsel is de directe trigger van verval, niet landuitputting zelf**: een stad verbruikt elke beurt voedsel (hoe groter de tier, hoe meer monden), tegenover de voedselproductie van actieve, wegverbonden boerderijen. Dreigt die voorraad — bij het huidige tempo — binnen een paar beurten op te raken, dan verschijnt een **zichtbare waarschuwingsstatus** ("kritiek"); bouw je op tijd bij (extra boerderij, wegverbinding), dan wordt de status weer gezond. Landuitputting draagt hier alleen **indirect** aan bij: minder producerende tiles zetten de voedselbalans onder druk, maar veroorzaken zelf geen instorting meer.
- **Reageer je op tijd** (vertrekken/relics oogsten): je behoudt alles wat je tot dan toe hebt verdiend.
- **Negeer je het**: kans op volledige ineenstorting — **ook de relics van eerder voltooide tiers gaan dan verloren** (permadeath-risico op stadsniveau). Dit is de centrale risk/reward-gok van elke stad-episode.
- **In de huidige MVP-scope** (hoofdstuk 13: één stad, nog geen meerdere steden/frontier-verplaatsing) is er geen volgende stad om de run mee door te laten lopen: een volledige ineenstorting **eindigt de run** en start de tutorial opnieuw (nieuwe kleine stad, lege streken, beurt 1). Zodra meerdere steden/frontier-verplaatsing bestaat, kan dit weer een puur stads-niveau-permadeath worden terwijl de run zelf naar de volgende stad doorloopt.
- Bewust **geen kunstmatige tijdsdruk/klok** — de druk komt volledig uit uitputting en schaarste, niet uit een aftellende timer.

---

## 5. Resource-economie

**Gedeelde opslag (met cap, uitbreidbaar via opslagplaats-improvement):** in de huidige implementatie geldt de cap per grondstof (hout/steen/erts/goud elk apart), niet als gezamenlijke som van de vier — zie hoofdstuk 14 ("Opslag-cap") voor de doorrekening en de reden om dit vooralsnog zo te laten staan.
- **Hout** (van houtkap) — snel, ververst relatief snel, basis voor vroege/culturele improvements
- **Steen** (van steengroeve) — langzamer, duurzaam, nodig voor civiele/grote gebouwen
- **Erts** (van mijnen) — zeldzaamst, snelste uitputting, nodig voor militaire/wetenschappelijke improvements
- **Goud** — voor diplomatie, tribuut, handel, evt. rush-bouwen

**Aparte voorraad (geen gedeelde cap):**
- **Voedsel** — verzameld richting groei-drempels (klein → middel → groot)

**Voortgangs-valuta (geen opslag/cap, cumulatieve teller richting drempel):**
- **Cultuur** → streek-ontgrendeling
- **Wetenschap** → technologie-boom (3 drempels van elk 2 keuzes, permanente effecten — hoofdstuk 3/9/11/14; het vooruitkijk-bereik is post-MVP, hoofdstuk 13)

**Bouwen**: geen instant-klik, maar een productiewachtrij — verbruikt elke beurt bouwmateriaal tot voltooiing. Hogere materiaalinkomsten = snellere bouw. Ingenieur-unit versnelt dit extra. Militair heeft bewust géén eigen valuta: puur directe krachtsvergelijking op het moment zelf.

**Rush-bouwen met goud**: een lopend bouwproject in de productiewachtrij hierboven kan versneld worden door **5 goud per weggekochte beurt** te betalen — de speler koopt zo een deel of de hele resterende bouwtijd in één keer af (bijv. nog 3 beurten te gaan × 5 goud = 15 goud voor directe voltooiing), of desgewenst maar een deel van de beurten als het goud niet toereikend is voor alles. Geldt uitsluitend voor **land improvements en city improvements** — nooit voor de technologieboom (hoofdstuk 3/9/11), die drempel houdt bewust zijn eigen tempo (zie hoofdstuk 11). Een duidelijke "versnel met goud"-knop bij een lopend bouwproject toont zowel de volledige rush-kosten als de daadwerkelijke goudvoorraad van de speler.

---

## 6. Militair & culturele pushback

**Directe militaire confrontatie:**
- Vergelijking van totale legerwaarde (units + muur/wachttoren-bonus) vs. tegenstander, met een **winkans** (geen gegarandeerde uitkomst).
- Winst: normale uitkomst, mogelijk buit. Verlies: schade (versnelde uitputting van getroffen tiles), geen instant game-over.
- In de huidige MVP (tutorial) komt dit generieke patroon concreet tot uiting via de **Bezette Streek** hieronder. De winkans-formule en het `eigen/(eigen+vijand)`-principe gelden ook daar; alleen de eigen-legerwaarde-berekening en het verlies-effect zijn voor die variant anders (zie "Bezette Streek & Confrontatie" hieronder).

**Culturele pushback (sterke tribe weerstaat expansie):**
- Geen gevecht — een **oplopende cultuurkostprijs** (bijv. dubbel) voor het ontgrendelen van die specifieke streek.
- Diplomatiek keuzemoment: **Erkennen/aanpassen** (permanente kleine wederzijdse korting), **Doordrukken** (hogere kost nu, blijvend hogere basiskost daarna), of **Terugtrekken** (streek laten zitten, zijwaarts verder zoeken indien mogelijk).

**Wachttoren & indringers:**
- Het mechanisme is pas actief zodra de speler **streek 3** heeft ontgrendeld — daarvóór gebeurt er nooit iets, zodat de speler eerst iets kan opbouwen. De Boerderij is al vanaf streek 2 bouwbaar, vóór Wachttoren/Mijn/indringers, zodat er eerst een tweede voedselbron staat (zie hoofdstuk 3, "Terrein-eisen").
- Elke beurt is er, zodra die drempel gehaald is, **één trekking** (MVP-richtwaarde 20%, tunebaar — hoofdstuk 14) of er een incident plaatsvindt — één kans per beurt voor de hele stad, niet een aparte kans per streek. Dat houdt het tempo van indringers-incidenten constant, ongeacht hoeveel streken er al ontgrendeld zijn.
- Is er een incident, dan wordt de getroffen streek geloot uit **álle ontgrendelde streken die iets te bieden hebben** — ook de startstreek en streken waar alleen nog ghost towns staan. Een streek doet **niet** mee als het enige wat erop staat een Wachttoren is, en er verder geen andere improvements en geen ghost towns zijn: zo'n kale wachtpost biedt indringers niets te halen. Dit geldt ongeacht de staat van die Wachttoren — ook een Wachttoren die nog in aanbouw is of nog niet bemand is, maakt de streek niet interessant. Beschermde streken (met een voltooide, bemande, verbonden Wachttoren) blijven wél gewoon meeloten zodra er ook maar iets anders op staat; de Wachttoren houdt het incident daar tegen (zie hieronder), ongewijzigd. Zijn er die beurt geen in aanmerking komende streken, dan gebeurt er niets. Een pop-up meldt het incident met een korte flavor-tekst, tribenaam (bijv. "de stam van de Halve Maan" of "de stam van de Bloedhoeven") en de betrokken streek.
- **Amberader vergroot de aantrekkelijkheid** (hoofdstuk 3/14; zie hoofdstuk 11 voor de rationale): zolang een streek een **actieve** Amberader heeft (gebouwd, nog niet uitgeput), weegt die streek in de trekking hierboven **2× zo zwaar** mee als een vergelijkbare streek zonder Amberader (MVP-richtwaarde, tunebaar — hoofdstuk 14) — het waardevolle materiaal trekt ongewenste aandacht. Dit werkt bovenop, niet in plaats van, de bestaande regels: een streek met alleen een Wachttoren blijft uitgesloten (zie hierboven), en een beschermde streek houdt het incident nog steeds tegen zoals gewoonlijk — de Amberader vergroot alleen de kans dat de streek geloot wordt, niet de uitkomst daarna. Is de Amberader uitgeput (ghost town), dan vervalt dit extra gewicht meteen weer — een lege put trekt niemand meer.
- **Bouwen op elke ontgrendelde streek**: de algemene regel is dat bouwen alleen op de huidige frontier-streek kan (hoofdstuk 11). De Wachttoren is daar een expliciete uitzondering op — hij mag op elke al ontgrendelde streek gebouwd worden, ook streken die de speler allang achter zich heeft gelaten. De overige bouwregels blijven gelden: de Wachttoren kost gewoon zijn materialen en bouwtijd, en de wegverbindings-eis voor bescherming (zie hieronder) blijft staan — in de praktijk zelden een blokkade, want oude streken hebben meestal al wegen uit de tijd dat ze zelf de frontier waren.
- Een Wachttoren beschermt de streek waarop hij staat alleen als hij **voltooid, bemand én via een aaneengesloten wegketen met de stad verbonden** is — alle drie de voorwaarden (zie ook hoofdstuk 16). Een wachtpost moet bevoorraad worden om te kunnen functioneren; zonder wegverbinding telt een Wachttoren dus niet mee, ook al staat hij er en is hij bemand. Onbemand of onverbonden biedt hij geen bescherming en telt zijn verdedigingsbonus ook niet mee bij een directe militaire confrontatie. Zo'n werkende Wachttoren beschermt niet alleen zijn eigen streek, maar ook **de streek direct daaronder** — niet verder, en nooit de streek erboven. Valt het incident op een streek met zo'n beschermde Wachttoren (op de streek zelf, of op de streek erboven), dan wordt een van drie uitkomsten geloot (zie hieronder).
  - **Bemannen**: in het militaire scherm ziet de speler zijn opgeleide strijders als los aanklikbare icoontjes. Een klik op een nog niet toegewezen strijder opent een keuze ("kies een wachttoren"); de daaropvolgende klik op een actieve Wachttoren-tile op de kaart bemant die.
  - **Terughalen (omkeerbaar)**: toewijzing is niet permanent. Een klik op een al bemande strijder haalt hem terug van zijn Wachttoren (die daarmee meteen onbemand raakt, tenzij een andere strijder hem overneemt). De teruggehaalde strijder is meteen weer elders inzetbaar — verplaatsen tussen Wachttorens kost geen beurten.
  - **Bemanningskosten**: elke bemande Wachttoren verbruikt **1 voedsel per beurt**, bovenop het bestaande stadsverbruik (klein 2, middel 4, groot 6 — hoofdstuk 14). Dit telt mee in de voedselbalans die de verval-waarschuwing bepaalt (hoofdstuk 4).
- **Een beschermde streek houdt niet altijd zomaar stand: de tweede rogue-like bonus/malus-koppeling** (hoofdstuk 11/14). Geldt voor **elke** beschermde, ontgrendelde streek die getroffen wordt — een oudere, achtergelaten streek net zo goed als de frontier-streek zelf; er is hier geen onderscheid. Bij zo'n incident wordt een uitkomst geloot, van vaakst naar zeldzaamst:
  - **Stand houden** (MVP-richtwaarde **85%**, tunebaar — hoofdstuk 14): het bestaande gedrag, ongewijzigd — de pop-up meldt dat de wachttoren stand houdt en de indringers zich terugtrekken zonder iets te nemen.
  - **Malus — overrompeld** (MVP-richtwaarde **10%**, tunebaar): ondanks de bescherming wordt de beschermende Wachttoren-tile alsnog vernietigd: de tile wordt een **ruïne** (op dezelfde plek herbouwbaar tegen de normale Wachttoren-kosten/bouwtijd), en de strijder die hem bemande is blijvend verloren — moet als nieuwe Soldaat volledig opnieuw opgeleid worden, geen reassignment. Dit is een **passief, door de speler niet-geïnitieerd** incident en blijft daarom zwaarder afgehandeld dan een verloren Confrontatie tegen een Bezette Streek hieronder — die laatste is een bewuste, door de speler zelf gestarte actie en kreeg om die reden een lichtere straf (de Wachttoren zelf blijft daar overeind, alleen de bemanning gaat verloren).
  - **Bonus — buit** (MVP-richtwaarde **5%**, tunebaar): de bemanning slaat de aanval niet alleen af, maar buit ook iets van de indringers — **+6 goud** (MVP-richtwaarde, tunebaar — hoofdstuk 14), direct aan de gedeelde opslag toegevoegd (binnen de gewone opslag-cap, hoofdstuk 5).
  - **Amberader onder vuur**: onafhankelijk van deze drie uitkomsten, en onafhankelijk van of de streek beschermd is — zie de aparte pop-up hieronder.
- **Drie korte pop-ups**, zelfde register als de bestaande indringers-/kudde-/roofdier-pop-ups:
  1. **Amberader onder vuur**: wordt een streek met een **actieve** Amberader (gebouwd, nog niet uitgeput) getroffen door een indringers-incident, dan verschijnt eerst een korte pop-up die aangeeft dat de indringers specifiek op de amber afkomen — onafhankelijk van de uiteindelijke uitkomst (stand houden/malus/bonus), en ook bij de gewone, onbeschermde tribuut-afhandeling hieronder (niet alleen bij de nieuwe malus/bonus-uitkomsten hierboven).
  2. **Wachttoren afgebroken**: bij de malus-uitkomst hierboven — meldt dat de Wachttoren overrompeld is en tot ruïne is vervallen, en dat de strijder verloren is.
  3. **Buit binnengehaald**: bij de bonus-uitkomst hierboven — meldt dat de bemanning de aanvallers heeft verslagen én goud heeft buitgemaakt, met het gewonnen bedrag.

  Zijn zowel de Amberader-aankondiging als een malus/bonus-uitkomst van toepassing op hetzelfde incident, dan verschijnen ze na elkaar (eerst de aankondiging, dan de uitkomst) — nooit gecombineerd tot één bericht.
- Valt het incident op een streek **zonder** beschermende Wachttoren, dan eisen de indringers **tribuut**: ongeveer de helft van het grondstof-type (hout/steen/erts/goud) waar de speler op dat moment het meest van heeft — het spel eist nooit meer dan er daadwerkelijk in voorraad is. De streek waar het incident plaatsvindt bepaalt alleen wáár het gebeurt, niet wat er geëist wordt: de hoogte van het tribuut hangt alleen af van de totale voorraad.
  - **Geven**: de pop-up toont eerst hoeveel tribuut geëist wordt; kiest de speler ervoor te betalen, dan bevestigt een laatste scherm dat bedrag nog eens voordat de indringers zich terugtrekken. Pas zodra de speler dat laatste scherm sluit, wordt het tribuut daadwerkelijk van de gedeelde opslag afgetrokken — niet al bij de keuze om te betalen.
  - **Weigeren**: heeft bewust hetzelfde gevolg als geven — de pop-up legt uit dat de indringers het tribuut hoe dan ook opeisen, waarna precies hetzelfde bevestigingsscherm en dezelfde afschrijving volgt als bij "Geven". Er is bewust **geen** "stad vernietigd, val terug op de vorige stad"-uitkomst — ook niet zodra er meerdere steden bestaan (hoofdstuk 9): een indringers-incident dat écht doordringt (geen beschermende Wachttoren) blijft altijd beperkt tot het tribuut zelf, nooit het verlies van een hele stad. "Weigeren" is dus puur een tweede pad naar dezelfde uitkomst (voor spelers die eerst willen proberen te weigeren), niet een apart risico.

**Heiligdom & de frontier:**
- Een Heiligdom produceert onbeperkt cultuur, ook nadat de frontier verder omhoog is getrokken — het put, net als de Wachttoren, niet uit (hoofdstuk 4).
- Alleen als het Heiligdom op de frontier-streek zelf staat, levert het de volle opbrengst; op elke streek daaronder levert het nog maar de **helft**. Dat beeldt uit dat een Heiligdom vooral nabije, nog niet "eigen" stammen omtovert tot de eigen stam — een effect dat afneemt naarmate de streek verder van het actieve grensgebied af komt te liggen.
- De **Sterrencirkel** (hoofdstuk 3/9) volgt voor wetenschap exact hetzelfde patroon: onbeperkte productie, put niet uit, volle opbrengst op de frontier-streek en de helft daaronder — dezelfde reden (nabije observatie/kennis weegt zwaarder dan een verre).

**Bezette Streek & Confrontatie** (zie hoofdstuk 11 voor de volledige onderbouwing, hoofdstuk 10 voor de tutorial-scripting op streek 12, hoofdstuk 14 voor alle tunbare getallen):

Een generiek, herbruikbaar mechanisme (ook voor latere campagnes) voor een streek die niet op de gebruikelijke manier ontgrendelt, maar eerst opgelost moet worden via Verkenning, Missionaris-toewijzing (wololo) en Confrontatie. Alle drie acties lopen via een klik op de betreffende tile zelf, nooit via een los scherm dat samen met de stad-acties in het stadsmenu staat.

- **Uiterlijk**: een Bezette Streek krijgt vijandelijke Wachttoren- en Heiligdom-tiles (dezelfde tile-typen als de eigen versies, met een duidelijk andere skin/kleur — geen nieuwe game-logica voor het uiterlijk zelf) verspreid over de land-vakjes, plus af en toe een puur cosmetisch "huisje"-tegeltje: geen economische functie, niet interactief, nooit een Confrontatie- of wololo-doel, en permanent onbebouwbaar. Geen enkele vijandelijke economische improvement (geen mijn/boerderij/etc.). Elk vakje is bovendien individueel **verhuld** — een eigen, per-tegel verhullingslaag los van de gewone streek-brede fog-of-war (hoofdstuk 2) — totdat het via Verkenning onthuld wordt.
- **Wat het betekent voor de speler**: zodra de streek "in beeld komt" (dezelfde soort trigger als een gegarandeerde vondst, bijv. de Amberader op streek 7 — hoofdstuk 14), toont een dynamische pop-up uitleg. Zolang de streek bezet is: de normale cultuur-voortgang richting haar ontgrendeling **bevriest volledig** (de cumulatieve cultuurteller stopt met oplopen, maar gaat niet verloren — de frontier blijft op de streek eronder staan), en er kan op de Bezette Streek zelf niet gebouwd worden. Elders blijft alles gewoon werken, inclusief het bouwen van het Offer Altaar en het Legerkamp hieronder. Een compact statusbalkje op de kaart zelf (niet in het stadsmenu) toont lopende verkenningen en wololo-meters; de acties zelf lopen via de tiles.
- **Verkenning**: een klik op een nog verhuld vakje van een Bezette Streek stuurt daar direct een verkenner heen — geen losse, vooraf te trainen eenheid meer. Kost dezelfde grondstoffen als de vroegere Verkenner-eenheid (hoofdstuk 3/14) plus wetenschap uit dezelfde pool als de technologie-boom (hoofdstuk 3/9) — een bewuste afweging tussen verder verkennen en voortgang in de techboom. In plaats van meteen te onthullen, telt een tellertje een aantal beurten af (dezelfde bouwtijd als de vroegere Verkenner-eenheid); pas daarna onthult het vakje als Wachttoren, Heiligdom of cosmetisch huisje. Hoogstens 1 verkenner-actie **gestart** per beurt (meerdere vakjes kunnen wel tegelijk "onderweg" zijn, als ze op verschillende beurten gestart zijn).
- **Offer Altaar, Missionaris & wololo**: het Offer Altaar (culturele land improvement, normale frontier-only bouwregel) ontgrendelt de **Missionaris**-unit als trainbare optie (training blijft in het stadsmenu, net als een Soldaat) — het sturen van een opgeleide Missionaris gebeurt met een klik op een specifiek onthuld vijandelijk Heiligdom. Dat Heiligdom krijgt daarmee een eigen **wololo-meter** (los van de andere Heiligdommen op de streek) die per beurt vult met een vast bedrag per daaraan toegewezen Missionaris — een tweede Missionaris op hetzélfde Heiligdom vult de meter 2× zo snel (issue: "laatste confrontatie tweaken" — zonder dit zou een tweede/derde Missionaris geen enkel nut hebben), maar een Missionaris op een ánder Heiligdom draagt niets bij. Bereikt de meter de drempel, dan wordt dat Heiligdom geen ruïne maar **eigen bezit**: het wordt een gewoon Heiligdom en levert cultuur op zodra het, net als elk ander land improvement, wegverbonden is (pas mogelijk zodra de hele streek opengaat, zie "Einde van de Bezette Streek" hieronder) — de toegewezen Missionarissen komen daarna vrij voor een volgend doel. Een pop-up meldt zowel het onthullen als het veroveren van een vijandelijk Heiligdom.
- **Legerkamp & Confrontatie tegen een vijandelijke Wachttoren**: het Legerkamp (militaire land improvement) is, net als de Wachttoren, bouwbaar op elke ontgrendelde streek (zelfde uitzondering, zelfde reden: een gestationeerde Soldaat kan zelf naar een Bezette Streek marcheren, ongeacht waar het Legerkamp staat). Een Soldaat kan aan een Legerkamp toegewezen worden — zelfde soort bemanningsinteractie als een Wachttoren (kies een strijder, kies een tile op de kaart), en net zo omkeerbaar en instant. Een klik op een onthulde vijandelijke Wachttoren-tile toont de Confrontatie-knop — **maar alleen bruikbaar als de speler al een voltooid, wegverbonden eigen Legerkamp heeft op de streek direct onder de Bezette Streek** (thematisch logischer dan een Wachttoren-eis: een legerkamp confronteert, geen wachtpost — zie hoofdstuk 11). Zonder dat Legerkamp is de actie niet beschikbaar (uitgegrijsd), geen mislukte poging — het Legerkamp hoeft zelf niet bemand te zijn om als "aanwezig" te tellen. Eigen legerwaarde voor déze Confrontatie = de opgetelde legerwaarde van alle Legerkamp-toegewezen Soldaten (ongeacht op welke streek) plus de vaste Barakken-bonus — een andere formule dan de gewone, algemene legerwaarde. De vijandelijke Wachttoren krijgt een legerwaarde vergelijkbaar met de zwaarste tegenstander die de speler tot dan toe is tegengekomen (in de tutorial: hetzelfde oplopende dreigingsniveau dat de streek toch al draagt). Winst: de vijandelijke Wachttoren wordt vernietigd — de tile telt vanaf dan als "opgeruimd". **Verlies**: het eigen Legerkamp blijft overeind (geen ruïne); alleen één eraan toegewezen strijder (de eerste, bij gebrek aan een aparte "wie voerde het bevel"-notie) is blijvend verloren — moet als nieuwe Soldaat volledig opnieuw opgeleid worden, geen reassignment. Zonder toegewezen Legerkamp-strijders (legerwaarde puur uit de Barakken-bonus) is er niemand om te verliezen.
- **Einde van de Bezette Streek**: zodra elk vijandelijk Heiligdom veroverd (i.p.v. vernietigd) en elke vijandelijke Wachttoren opgeruimd is, wordt de hele streek in één keer volledig onthuld (ook nog niet individueel verkende vakjes), eindigt de Bezette-status, en telt de streek vanaf dan als normaal ontgrendeld — de bevroren cultuurteller ontdooit en telt weer gewoon door richting de normale drempel voor de vólgende streek. Zolang er nog een vijandelijke Wachttoren- of Heiligdom-tile over is (onthuld of nog verhuld), blijft de streek vergrendeld: de settler kan er niet naartoe bewegen en er kan er niet gebouwd worden (dezelfde bestaande "alleen ontgrendelde streken"-regel als overal elders, hoofdstuk 2/16 — geen apart mechanisme nodig). De tutorial-indeling (hoofdstuk 10) legt hiervoor bewust precies één vijandelijke Wachttoren en één vijandelijk Heiligdom vast, zodat "alles oplossen" een haalbare, concrete climax blijft in plaats van een herhaalde reeks identieke acties. De cosmetische huisjes blijven altijd gewoon staan (geen doel, geen functie). Normaal bouwen wordt na het opengaan van de streek weer mogelijk op de overige vakjes.

---

## 7. Ghost towns & zeldzaamheid

- Uitgeputte land-tiles worden permanente **ghost towns**: produceren niets meer, rol in flavor bij einde van een run, niet herbouwbaar in de basisversie.
- **Zeldzaamheid** wordt pas **onthuld na het bouwen** (niet vooraf zichtbaar):
  - **Gewoon** (~70%): standaard opbrengst/uitputting
  - **Rijk** (~25%): hogere opbrengst, snellere uitputting (korte-termijnklapper)
  - **Legendarisch** (~5%): hoge opbrengst, lange levensduur; bij uitputting een **kort oogst-tijdvenster** (2-3 beurten) voor een eenmalige, stevige beloning (relic-fragment, unieke unit, materiaalstoot) — negeren = gewoon een ghost town.
- Kansen kunnen licht schuiven per campagne-thema (bijv. hogere kans op legendarische pelsjacht-vondsten in een Siberische campagne).

**Signature-mechanic van het spel**: het herhalende ritme van *waarschuwing → kort reactievenster → alles-of-niets* komt terug bij stadsverval, legendarische oogst, en tribe-pushback-momenten.

---

## 8. Campagnestructuur

- **Worldgen** (hoogte/lengte van continent, terrein, obstakels) is **vast**: elke campagne heeft één eigen, volledig handgeschreven kaart, precies zoals de tutorial (hoofdstuk 10/11/13) — geen procedurele generatie. Zie hoofdstuk 11 ("Vaste, handgeschreven campagnekaarten i.p.v. procedurele worldgen") voor de volledige afweging.
- Een **campagne** legt daar een thema-streek overheen: tribe-roster/gedrag, unieke units/gebouwen, en **campagne-specifieke multipliers** op bestaande mechanica (bijv. uitputtingssnelheid, pushback-frequentie) — geen aparte kernmechanica per campagne.
- **Vertakkend verhaal**: een paar vaste "ankerpunten" (gekoppeld aan streekhoogte-range, niet aan één exacte streek) met 2-3 betekenisvolle keuzes per anker. Latere ankers reageren op eerdere keuzes (keuzeboom), tot een gedeelde kernscène met tonale varianten bij het laatste anker (voorkomt dat elk pad apart volledig uitgeschreven moet worden).
- **Historische inspiratie wordt direct gebruikt** (echte volken/leiders), naar eigen creatieve invulling — geen verplichting tot historische nauwkeurigheid of fictionalisering.
- **Volgorde**: tutorial (neolithisch, **"De Eerste Vuren"**) → Amerikaanse frontier-campagne (eerste, verplicht; in-game titel **"Going West"**) → overige campagnes ontgrendelen daarna. Deze in-game titels staan (samen met de nog uitgegrijsde toekomstige campagnes) in `CampagneSelectScherm.tsx`.
- Meerdere campagnes/saves moeten **gelijktijdig lopen** (opslaan, wisselen tussen runs).

**Toekomstige campagne-ideeën (met kernthema):**
- **Mongoolse expansie** — mobiliteit/verovering makkelijk, behoud/civiele groei moeilijk (spiegelbeeld van Siberië)
- **Alexander de Grote / Hellenistisch** — nadruk op stedenstichting, snel wisselend terrein. In-game titel (uitgegrijsd aangekondigd in `CampagneSelectScherm.tsx`): **"Into the Footsteps of Alexander"** ("Grieks-Macedonische Veroveringen").
- **Romeinse limes** — grens die je actief verdedigt en langzaam opschuift, militair als hoofdas
- **Bantu-expansie** — lange termijn, economie/wetenschap als hoofdas, weinig conflict
- **Vikingexpansie** — eilandspringen i.p.v. doorlopend continent (ruimtelijke variant)
- **Spaanse conquista** — snelle maar instabiele verovering, cultuurschok/verval van bestaande rijken
- **Nederlandse VOC-expansie** — handelsposten als eerste stap, sterke economische as, eilandstructuur
- **Siberische/Tataarse expansie (Rusland)** — kou versnelt uitputting van voedselland, dunbevolkt = tragere pushback, bonthandel als economische motor. In-game titel (uitgegrijsd aangekondigd in `CampagneSelectScherm.tsx`): **"Through the Taiga"** ("Russian Expansion").

---

## 9. Amerikaanse frontier-campagne ("Going West") — uitgewerkte ankers

**Status**: de drie ankers hieronder zijn inhoudelijk beschreven, maar nog niet technisch/inhoudelijk uitgewerkt in code (issue #278, vraag 3). Dit is bewust een **doorlopend, incrementeel proces zonder vaste opleverdatum** — geen aparte milestone die dit in één keer "afrondt"; de ankers worden gaandeweg, stap voor stap opgepakt. Ze zijn geen onderdeel van blocker 1 (hoofdstuk 19) en vormen geen poort voor `beschikbaar: true`.

**Toon**: donkerder en minder heroïsch dan klassieke western-verhalen — geïnspireerd op de sfeer van *Blood Meridian*. Geen morele framing door het spel zelf; geweld en keuzes worden beschreven, niet beoordeeld.

### Anker 1 (streek 8-10) — Eerste contact
Twee keuzes (geen neutrale derde optie):
- **Handel aanbieden** → kleine economische bonus nu; de tribe groeit sterker mee met jouw voortgang.
- **Land claimen** → gratis land improvement-vakje nu; start een **zichtbare wrokmeter** die oploopt tot Anker 2.

### Anker 2 (streek 16-18) — vertakt per keuze uit Anker 1

*Vanuit Handel:*
- **Verdrag sluiten** → permanente/vergrote economische relic; tribe blijft neutrale sterke buur.
- **Ruil ondermijnen** → grote eenmalige economische boost; tribe wordt blijvend vijandig.

*Vanuit Land claimen (wrokmeter vol):*
- **Terugvechten** → directe militaire confrontatie; winst = lagere wrok maar beschadigde streek (versnelde uitputting); verlies = richting stadsverval.
- **Tribuut aanbieden** → wrok daalt fors, eenmalig fors verlies van huidige opbrengst; geen garantie voor de toekomst.

### Anker 3 (richting oceaan) — vier tonale/mechanisch verschillende varianten
Gedeelde flavor-kern, uitkomst (winnen) gelijk voor iedereen, maar elk pad krijgt een eigen soort obstakel:
- **Na Verdrag**: tolgang-onderhandeling (resource-management, geen gevecht) — bijv. met Comanche onder Buffalo Hump.
- **Na Ruil ondermijnen**: pure militaire confrontatie, zwaarste directe slag — bijv. Apache onder Mangas Coloradas.
- **Na Terugvechten**: lange, uitputtende tocht over meerdere half-uitgeputte streken (uithoudingstest, geen piekmoment).
- **Na Tribuut**: moreel/strategisch dilemma — permanent relic-verlies voor gegarandeerde doorgang, óf onvoorbereid gevecht.

### Afstandsverval & het herhalende drie-stichtingsmomenten-patroon

Zodra een speler meerdere steden heeft (vanaf deze campagne), geldt voor elke stad die niet meer de actieve frontier is een geleidelijk, afstandsafhankelijk verval van haar city-improvement-productie, hieronder uitgewerkt.

**Deel 1 — Afstandsverval van city improvements**

Voor elke gestichte stad wordt de **afstand** bijgehouden: het aantal streken tussen die stad en de huidige frontier-streek. De frontier beweegt alleen vooruit, dus deze afstand kan alleen groeien. De doorlopende productie van de city improvements van die stad (Bibliotheek, Markt, Barakken, Tempel, Grote Tempel — hoofdstuk 3/13/14) wordt vermenigvuldigd met een effectiviteitspercentage dat van die afstand afhangt, in vier zones:

| Afstand tot de stad | Effectiviteit |
|---|---|
| 0-4 streken | 100% ("gezond") |
| 5-8 streken | 65% (begint te verminderen) |
| 9-12 streken | 30% (flink verminderd) |
| 13+ streken ("de grens") | 0% — werkt niet meer, stad is volledig uitgeput qua city-improvement-nut |

MVP-richtwaarden, tunebaar (hoofdstuk 14) — doorgerekend tegen de campagne-continentlengte van 30-60 streken (hoofdstuk 14).

Dit verval raakt uitsluitend de stad-brede city-improvement-productie. **Niet aangeraakt**: land improvements (mijn, boerderij, Sterrencirkel, Amberader, etc.) blijven gewoon normaal produceren zolang ze wegverbonden zijn (hoofdstuk 16), ongeacht afstand. Ook het stadsverval/permadeath-risico (hoofdstuk 4) blijft ongewijzigd — een stad op 0% city-improvement-effectiviteit kan nog gewoon blijven bestaan, ze levert alleen niets meer op via haar gebouwen. Bij meerdere gelijktijdig actieve steden wordt dit per stad apart berekend.

**Deel 2 — Drie gegarandeerde stichtingskansen per stad, herhalend**

Geen eenmalige, vaste telling van 3 stichtingen over de hele run, maar een **patroon dat zich herhaalt voor elke actieve stad**. Zodra een stad gesticht is, garandeert de worldgen drie momenten waarop de speler een nieuwe stad **kán** stichten, gekoppeld aan de afstandszones hierboven — telkens een gegarandeerd vers-water-vakje (hoofdstuk 2):

1. **Vóór de stad begint te verminderen**: een gegarandeerd vers-water-vakje ergens binnen afstand 0-4 van de huidige stad (de "gezonde" zone). Vroeg stichten, met een gezonde buffer.
2. **Terwijl de stad al aan het verminderen is**: een gegarandeerd vers-water-vakje ergens binnen afstand 5-12 (één van beide verval-zones). Stichten met minder buffer, maar nog niet acuut.
3. **Zodra de stad volledig is uitgeput**: een gegarandeerd vers-water-vakje zodra afstand 13+ bereikt wordt (de 0%-zone). De oude stad levert dan al niets meer op via city improvements — de speler voelt de noodzaak, maar wordt niet hard geblokkeerd (hij kan in theorie nog verder trekken zonder te stichten, alleen zonder city-improvement-voordeel).

Of de speler bij kans 1, 2 of 3 daadwerkelijk sticht, is aan hem — dat hangt af van hoeveel voorraad hij nog heeft en hoeveel risico hij wil nemen door langer te wachten. Zodra hij sticht, begint dit hele patroon (Deel 1 + Deel 2) opnieuw voor de nieuwe stad.

Bij een campagnelengte van 30-40 streken (Normaal, hoofdstuk 14) herhaalt dit patroon zich met deze afstandszones typisch ongeveer 3 keer over een hele run — vandaar het "verhaal in 3 delen"-gevoel — maar dit is een natuurlijk gevolg van de gekozen getallen, geen harde limiet. Bij een lange "Moeilijk"-campagne (45-60 streken) kan het vaker gebeuren. Het is dus een herhalend mechanisme, geen geharde "maximaal/precies 3 keer"-teller.

Stad stichten blijft een **settler-actie** (hoofdstuk 6/13, inclusief de bestaande "maximaal één settler per gestichte stad"-regel), mogelijk op **elke** al ontgrendelde streek — een uitzondering op de frontier-only-bouwregel, zoals Wachttoren/Legerkamp al hebben (hoofdstuk 6/11) — mits er vers water direct naast ligt (hoofdstuk 2) en de settler er fysiek naartoe reist. De allerlaatste, verplichte stichting blijft bij de oceaan aan het einde van de campagne (bestaande win-conditie, hoofdstuk 1) — die telt gewoon mee als een van deze cykli, in de 0%-zone van de laatst gestichte stad als de speler tot dan toe heeft doorgetrokken.

Hoe dit precies samenvalt met de bestaande Anker-verhalen hierboven (rond streek 8-10/16-18/eindspel) moet nog op elkaar afgestemd worden in een latere opdracht — dit mechanisme is hier op zichzelf staand uitgewerkt.

**Implementatiestatus**: zie de milestone-tabel in hoofdstuk 13 (M16 t/m M20d) voor de volledige, actuele stand van de code voor dit mechanisme.

### Flavor-tekststijlgids
1. Korte, vaak enkelvoudige zinnen — kracht in understatement.
2. Geen emotie-bijvoeglijke naamwoorden ("verschrikkelijk", "triomfantelijk").
3. Geen moreel oordeel in de tekst ("helaas", "terecht").
4. Concreet/zintuiglijk boven abstract (geur, geluid, licht i.p.v. sfeerbeschrijving).
5. Herhaling/cadans als bewust stijlmiddel ("geen X, geen Y").
6. Historische namen/volken mogen gebruikt worden, functioneel beschreven — geen karikatuur.
7. Stiltes toegestaan — een flavor-tekst hoeft niet samen te vatten wat er net gebeurde.

### Weergavenamen (functionele sleutel ongewijzigd)

Zelfde herbruikbaarheidspatroon als de technologie-boom en de tegel-sets uit hoofdstuk 13 (`CampaignConfig.techNamen`/`improvementNamen`, types.ts): de functionele sleutel (`Improvement.id`/`TechId`) en alle bijbehorende kosten/effecten/gating blijven ongewijzigd — alleen de naam die de speler te zien krijgt, verandert per campagne (`improvementNaam()`/`techNaam()`). Ontbreekt een sleutel (of heeft de campagne geen override), dan valt de weergave terug op de tutorial-naam. De `CampaignConfig`-instantie voor deze campagne (`GOING_WEST_CAMPAGNE`, `src/game/campagnes.ts`) gebruikt onderstaande tabel al als `improvementNamen` (hoofdstuk 13, M20a).

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
| Karavaan (post-MVP, meerdere steden — zie hoofdstuk 13) | Handelswagen |

De Huifkar (settler) krijgt geen aparte naam — al generiek/thematisch passend, blijft ongewijzigd.

---

## 10. Tutorial — "De Eerste Vuren" (Het Hertenpad-volk)

Fictieve neolithische stam, sfeer geïnspireerd op *De Stam van de Holenbeer* — overleving en verwondering in plaats van morele ambiguïteit.

Eén nieuw mechaniek per streek, oplopend:

| Streek | Mechaniek |
|---|---|
| 1 | Land improvement bouwen |
| 2 | Categorie-keuze voor land improvements (alle geldige opties binnen de categorie) |
| 3-4 | Drie bouwmaterialen (hout/steen/erts) |
| 5 | Uitputting (laagdrempelig voorbeeld) |
| 6-7 | Cultuur → streek ontgrendelen |
| 8 | Wetenschap → technologie kiezen (drempel 1 van de technologie-boom, hoofdstuk 3/9/14) |
| 9 | Zeldzaamheid (verborgen tot bouwen) |
| 10 | Groei-gok |
| 11 | Waarschuwingssignaal bij verval (gescript, ongevaarlijk) |
| 12 | Bezette Streek & Confrontatie (hoofdstuk 6) |
| 13 | Stad stichten aan de oceaan (vers water — de enige plek in de hele tutorial) |

**Streek 10 in het bijzonder:** dit is de eerste keer dat de speler de volledige inzet van hoofdstuk 4 voelt — een ineenstorting hier beëindigt de hele tutorial-run, net zoals later in een echte campagne. De tutorial waarschuwt de speler dan ook expliciet wat er op het spel staat: zodra de voedselstatus "kritiek" wordt (de zichtbare waarschuwingsstatus uit hoofdstuk 4, die al een paar beurten vóór een mogelijke instorting verschijnt), krijgt de speler een duidelijke melding dat doorgroeien nu een echte gok is en dat bij een instorting de hele stad — inclusief alle tot dan toe verdiende relics — verloren gaat. Dat de speler dit risico ruim van tevoren kan zien aankomen, is wat deze streek uitdagend houdt zonder oneerlijk te worden.

**Streek 12 — De Bergkam, de Bezette Streek:** de climax vlak vóór het stichten op streek 13, en de eerste keer dat de speler iemand tegenkomt die niet van het Hertenpad-volk is. Zie hoofdstuk 6 voor het volledige Bezette-Streek-mechanisme (Verkenning, Offer Altaar/Missionaris/Belegering, Legerkamp/Confrontatie). Het bereiken van streek 12 is bewust **niet** het tutorial-einddoel (dat blijft het stichten op streek 13, hoofdstuk 2/16) — de streek hoeft dus niet "gewonnen" te worden om door te kunnen naar streek 13, al blijft de frontier er wel op vastzitten tot zowel het vijandelijke Heiligdom als de vijandelijke Wachttoren vernietigd zijn.

**Streek 13 — de oceaan aan de overkant:** de allerlaatste streek van de tutorial, en de enige plek in de hele tutorial met een vakje aan vers water (hoofdstuk 2) — precies de win-conditie uit hoofdstuk 1 ("bereik de oceaan aan de overkant"), hier alvast voelbaar gemaakt binnen de eenvoudigere tutorial-scope. Zodra deze streek in beeld komt, krijgt de speler een gerichte pop-up die uitlegt hoe je hier een stad sticht en dat dit de run beëindigt.

**Einddoel: je eerste stad stichten.** De afsluiting van de tutorial is niet langer "bereik streek 12", maar **je eerste stad stichten op de frontier** (hoofdstuk 2/16) — precies waar het spel zijn naam aan ontleent. Zodra de settler op het vers-water-vakje van streek 13 staat en de speler genoeg grondstoffen heeft gespaard (hoofdstuk 14), kan hij stichten; de speler wordt daarbij duidelijk gewaarschuwd dat de settler bij het stichten verdwijnt ("de huifkar wordt de stad"). De speler is niet verplicht meteen te stichten zodra dat kan — hij mag ook gewoon nog even ronddolen op de oceaanoever en later stichten. De stichtingskosten (hoofdstuk 14) dwingen geen Opslagplaats af vóór het stichten. Streek 12 blijft wel zijn eigen mechaniek-les (de Bezette Streek, hoofdstuk 6/10): de speler moet haar daadwerkelijk oplossen (zowel het vijandelijke Heiligdom als de vijandelijke Wachttoren vernietigen) voordat de frontier verder kan naar streek 13 — de streek blijft er zelf op vastzitten zolang ze bezet is.

Bij het stichten: afsluitende scène, opent het campagnemenu (alleen Amerikaanse frontier beschikbaar; overige campagnes ontgrendelen daarna). Tutorial-save blijft apart bestaan/speelbaar. Er volgt in de MVP nog **geen** volledige frontier-verplaatsing (scherm dat opschuift, oude streken die sluiten, relics die worden toegekend, hoofdstuk 2/13) — dat hoort bij de Amerikaanse campagne; het stichten is in de tutorial het eindpunt zelf.

**Namen:**
- Hoofdstuktitel: **"De Eerste Vuren"**
- Stam van de speler: **Het Hertenpad-volk**
- Mogelijke NPC-stam (indien nodig): Het Steenhoorn-volk / De Rivierwakers
- Steden hebben, net als tribes, een eigen naam (los van de stam die er woont) — zichtbaar zodra je op de stad-tile klikt, en waar relevant terug te laten komen in flavor-teksten. Prehistorisch klinkende voorbeeldnamen, in de stijl van *De Stam van de Holenbeer*: **Oer-stad**, **Vuurbron**, **Asvallei**. De eerste stad (het startkamp van het Hertenpad-volk) heet **Oer-stad**. In de MVP is dit de enige stad; zodra meerdere steden/frontier-verplaatsing bestaat (post-MVP, hoofdstuk 13), kunnen de overige namen als volgende stadsnamen dienen — `City.naam` (hoofdstuk 13) ondersteunt dit al.

---

## 11. Belangrijkste ontwerpoverwegingen

Een aantal kernbeslissingen is bewust gemaakt na afweging van alternatieven. Hieronder de belangrijkste, met de reden achter de keuze.

**Boom-structuur i.p.v. letterlijke stapel-toren**
Een letterlijke verticale stapel van alle improvements door elkaar zou visueel rommelig worden zodra city- en land-improvements samen op één kolom staan. De boom/frontier-band-structuur (stad als stam, land improvements als uitlopers, nieuwe steden als nieuwe stammen) houdt de drie improvement-soorten visueel en conceptueel gescheiden, terwijl de "naar boven groeien"-fantasie behouden blijft.

**Land improvements: categorie kiezen, dán alle geldige concrete opties zien (niet een willekeurige subset)**
Dit geldt specifiek voor **land improvements** — city improvements en units lopen niet via dit mechanisme (zie hoofdstuk 1). Eén keuzemoment (direct een specifieke improvement kiezen) zou minder diepte geven dan twee gelaagde momenten: eerst een richting (categorie) bepalen, dan een concrete keuze binnen die richting maken. Een eerdere versie toonde daarna een willekeurige subset van 2-3 opties uit de categorie-pool, maar dat kon ertoe leiden dat de speler precies de land improvement niet aangeboden kreeg die zijn economie op dat moment nodig had (bijvoorbeeld een tekort aan erts terwijl er geen mijn in de aanbieding zat) — dat voelde niet als een interessante keuze, maar als een gemiste kans. Door in plaats daarvan alle geldige land improvements binnen een categorie te tonen (gefilterd op vervulde voorwaarden zoals terreineisen, maar niet meer willekeurig beperkt), wordt resource-planning een echte, uitvoerbare vaardigheid: met 4-6 land improvement-types per categorie (hoofdstuk 3) blijft de lijst vanzelf behapbaar voor een mobiel scherm. De onvoorspelbaarheid van het spel blijft intact via andere systemen: verborgen zeldzaamheid, de vertakkende Anker-verhalen, en de indringers-trekking (hoofdstuk 6/9/14) — worldgen zelf is inmiddels vast per campagne (hoofdstuk 8/11), geen bron van run-op-run-onvoorspelbaarheid meer.

**Geleidelijk, afstandsafhankelijk verval i.p.v. een harde "geen inkomsten"-regel (hoofdstuk 9, Amerikaanse campagne)**
Een oude stad mag geen veilige, passieve thuisbasis worden die de noodzaak om verder te trekken wegneemt: dat is de reden dat achtergelaten steden minder lopende resource-inkomsten leveren zodra ze ver genoeg achterblijven. Een geleidelijke, afstandsafhankelijke curve (hoofdstuk 9/14: 100% tot afstand 4, aflopend naar 0% vanaf afstand 13) geeft de speler daarbij een voelbaar, voorspelbaar signaal (vergelijkbaar met het waarschuwingssignaal bij stadsverval, hieronder) in plaats van een abrupte knip, en beloont nog een tijd verder bouwen op een oudere stad in plaats van hem meteen nutteloos te maken. Specialisatie-relics blijven wél permanent (als beloning); alleen de stad-brede city-improvement-productie zakt weg, land improvements blijven normaal produceren zolang wegverbonden (hoofdstuk 9/16).

**Hard verval (permadeath van relics) i.p.v. zachte aftakeling**
Zachte aftakeling (een stad die langzaam minder oplevert tot je vertrekt) is altijd veilig zolang je op tijd weggaat — er is dan geen echt risico. Hard verval, waarbij ook al verdiende relics verloren kunnen gaan bij een misrekening, geeft een echt risk/reward-moment: doorgroeien voor een extra relic-slot is een bewuste gok, geen gratis extra beloning. Het zichtbare waarschuwingssignaal zorgt ervoor dat dit risico eerlijk aanvoelt (voorspelbaar te vermijden) in plaats van willekeurig.

**De permadeath-dreiging geldt ook in de tutorial, zonder uitzondering**
De groei-gok op streek 10 (hoofdstuk 10) is bewust géén ongevaarlijke oefening: een ineenstorting beëindigt ook daar de hele run, precies zoals hoofdstuk 4 beschrijft. Een tutorial waarin niets echt op het spel staat, zou de speler nooit laten voelen waarom groeien versus op tijd vertrekken de kernspanning van het hele spel is — en dus ook niet waarom het spel de moeite waard is. Dat het risico ruim van tevoren zichtbaar aankomt (het waarschuwingssignaal uit hoofdstuk 4, hier expliciet uitgelicht in hoofdstuk 10) houdt dit uitdagend in plaats van oneerlijk: de speler maakt de gok bewust, in plaats van hem per ongeluk te verliezen. Echte inzet vanaf het begin is dus een bewuste ontwerpkeuze, geen omissie.

**Volledige ineenstorting eindigt in de MVP de hele run**
Zolang er maar één stad is (hoofdstuk 13), heeft een ineenstorting geen "volgende stad" om naar door te schuiven — de stad die instort, is de enige stad. Een stad laten voortbestaan in verzwakte vorm (geen relics, kleine tier) zou het permadeath-risico uit hoofdstuk 4 juist ondermijnen: de speler kan dan gewoon doorspelen alsof er niets gebeurd is. Door de run in dat geval echt te beëindigen en de tutorial opnieuw te starten, blijft de inzet van "doorgroeien voor een extra relic-slot" reëel, ook zonder dat er al een frontier-verplaatsing naar een nieuwe stad bestaat.

**Geen kunstmatige tijdsdruk/klok**
Een oprukkende dreigingstimer (zoals in veel rogue-likes) werd bewust weggelaten omdat de vergelijkbare historische frontier-situaties ook geen "klok" kenden — en omdat schaarste (uitputting van land, uitputting van vooruitzicht op groei) al een intrinsieke, thematisch passende reden geeft om door te bewegen. Een extra klok erbovenop zou dubbelop en kunstmatig aanvoelen.

**Zeldzaamheid van land improvements pas zichtbaar na bouwen**
Vooraf zichtbare zeldzaamheid zou het bouwen puur een optimalisatie-keuze maken ("bouw ik hier de zekere optie of gok ik op een goudmijn"). Door de uitkomst pas na het bouwen te onthullen, wordt élke bouwactie een klein gokmoment, wat beter past bij het rogue-like karakter van het spel dan een volledig planbare economie.

**Eén gedeelde opslag i.p.v. één-resource-kiezen (zoals in Frostpunk)**
Frostpunk dwingt spelers één opslagtype te kiezen per gebouw, wat in de praktijk onrealistisch aanvoelt (waarom zou je geen hout én steen naast elkaar kunnen opslaan?). Een gedeelde opslag met een gezamenlijke cap is intuïtiever en legt de spanning waar die hoort: bij de totale capaciteit, niet bij een kunstmatige keuze tussen fysiek vergelijkbare goederen. Voedsel kreeg wel een aparte voorraad, omdat het conceptueel een ander doel dient (groei-drempels) dan bouwmateriaal.

**Kwadratisch in plaats van exponentieel cultuurkosten**
De oorspronkelijke cultuurkosten-formule (basis 20, ×1,4 per streek, hoofdstuk 14) schaalde exponentieel, terwijl het daadwerkelijke cultuurinkomen — in de MVP vrijwel volledig het Heiligdom (hoofdstuk 6) — ruwweg lineair groeit naarmate een speler er in de loop van een run meer bouwt. Voor de tutorial van 12 streken viel dat verschil nog te verbergen, maar bij de campagnes van 30-60 streken (hoofdstuk 14) liep de cumulatieve drempel binnen enkele tientallen streken op tot miljoenen — een harde muur in plaats van een geleidelijk oplopende uitdaging. Een kwadratische kostencurve groeit nog altijd sneller dan het lineaire inkomen (dus blijft elke streek moeilijker dan de vorige), maar niet exponentieel sneller, waardoor het aantal beurten per streek geleidelijk oploopt in plaats van door te schieten naar het twintigvoudige of meer.

**Basisterm van de cultuurkosten verlaagd, kwadratische factor niet**
Ook na de omzetting naar een kwadratische curve hierboven bleef streek 2 (drempel 20) in de praktijk tientallen beurten kosten — precies het moment waarop een speler voortgang wil voelen, niet stilstand. De doorrekening in hoofdstuk 14 ("Vroege-spel-doorrekening") laat zien dat dit voor een belangrijk deel een ándere oorzaak heeft dan de kostenformule (de grondstofketen naar het eerste Heiligdom kost zelf al zo'n 13 beurten), maar de kostenformule droeg door zijn hoge basisterm (15) ook onnodig bij. Omdat de basisterm een vaste optelling is, weegt hij bij lage streken (waar de kwadratische term nog klein is) verreweg het zwaarst mee, maar wordt hij bij hoge streken verwaarloosbaar tegenover de kwadratische term. Hem verlagen (van 15 naar 3) is daarom een chirurgische ingreep: de eerste paar streken worden fors goedkoper, terwijl de curve verderop — en dus de hierboven beschreven, bewust behouden schaling voor de campagnes van 30-60 streken — nauwelijks verandert. De kwadratische factor (5) blijft daarom bewust ongewijzigd; alleen de basis is aangepast.

**Twee gescheiden systemen voor militair conflict en culturele pushback**
Een direct gevecht (unit-sterkte vergelijken) en het weerstaan van een cultureel sterke tribe zijn thematisch verschillende soorten weerstand — de eerste is fysiek, de tweede diplomatiek/economisch. Door ze als aparte systemen te ontwerpen (in plaats van beide via legersterkte af te handelen) blijven de vijf categorieën ook mechanisch onderscheidend: militair lost fysieke dreiging op, cultureel lost expansie-weerstand op.

**Wachttoren en Heiligdom putten niet uit**
De overige land improvements (mijn, boerderij, houtkap, steengroeve) stellen een eindige oogst voor — hun hele nut ligt in het opgebruiken van een hulpbron. Een Wachttoren en een Heiligdom stellen iets anders voor: een blijvende aanwezigheid (een wachtpost, een cultusplek) die niet "op" kan raken. Ze een levensduur geven zou de speler dwingen ze op den duur te vervangen zonder dat daar een thematische reden voor is — in plaats daarvan krijgen ze allebei een doorlopend, tunebaar effect (indringers-bescherming resp. cultuurproductie) dat wél kan verzwakken (Heiligdom, buiten de frontier) maar nooit stopt.

**Uitputting telt pas vanaf actieve productie, niet vanaf bouwmoment**
Uitputting stelt het opgebruiken van een hulpbron voor (zie hierboven) — zonder productie is er niets om op te gebruiken. Zou de teller al aftellen zodra een improvement gebouwd is, dan zou wachttijd op een wegverbinding (hoofdstuk 16) een onzichtbare straf worden: de speler ziet de wachttijd zelf niet als een kostenpost, en thematisch klopt het ook niet dat een mijn die nog geen erts heeft opgeleverd toch al levensduur verliest. Door de teller pas te laten lopen zodra het vakje daadwerkelijk actief-producerend is (gebouwd én wegverbonden), blijft de regel voor elke land improvement consistent: geen productie, geen uitputting — ongeacht of dat komt door een ontbrekende wegverbinding of (mocht dat ooit kunnen) een verbroken verbinding.

**Wachttoren verdedigt de hele streek, niet alleen zichzelf**
Een verdedigingsbonus die alleen meetelt bij een directe, door de speler gestarte confrontatie (het bestaande M7-systeem) beloont de Wachttoren pas op het moment dat de speler toch al voorbereid was. Door de Wachttoren daarnaast een passieve, elke-beurt-kans-gedreven dreiging (indringers-tribuut) volledig te laten blokkeren, wordt hij ook waardevol als voorzorgsmaatregel — precies het gevoel van een wachtpost, in plaats van alleen een statistiekbonus tijdens een gevecht dat de speler zelf initieert.

**Wachttoren beschermt ook de streek eronder**
Met indringers-incidenten verspreid over alle ontgrendelde streken (zie hieronder) had de speler, om overal gedekt te zijn, in de praktijk op bijna elke ontgrendelde streek een eigen Wachttoren nodig — te veel bouwwerk voor wat een voorzorgsmaatregel hoort te zijn. Een werkende Wachttoren (voltooid, bemand, wegverbonden) beschermt daarom niet alleen zijn eigen streek, maar ook de streek direct daaronder — thematisch een wachtpost die ook over het gebied net onder zich uitkijkt. Dit werkt niet door naar een tweede streek daaronder, en een toren beschermt nooit de streek erboven: die blijft afhankelijk van zijn eigen toren (of van een toren op de streek daar weer boven).

**Indringers-incidenten verspreid over alle ontgrendelde streken, niet alleen de frontier**
Zolang indringers alleen op de frontier-streek konden toeslaan, werd elke eerder gebouwde Wachttoren waardeloos zodra de frontier een streek opschoof. Elke nieuwe streek vroeg zo om een nieuwe toren, en alles wat de speler eerder had opgebouwd, telde niet meer mee. Door de getroffen streek bij elk incident te loten uit **alle** ontgrendelde streken — inclusief beschermde — blijft elke gebouwde, bemande en verbonden Wachttoren zijn hele run lang waarde houden. Beschermde streken blijven bewust meeloten zodat de dreiging voelbaar blijft: de speler ziet dat er nog steeds pogingen zijn, maar ziet ook dat zijn verdediging werkt. De één-trekking-per-beurt-vorm (in plaats van een aparte kans per streek) houdt daarbij het tempo van incidenten constant, ongeacht hoeveel streken er ontgrendeld zijn.

**Een kale streek met alleen een Wachttoren doet niet mee in de indringers-trekking**
Indringers komen ergens op af — een streek waar helemaal niets staat behalve een wachtpost, biedt daar geen aanleiding toe, ongeacht of die wachtpost al voltooid of bemand is. Zonder deze uitzondering zou elke ontgrendelde streek meedoen in de trekking (zie hierboven, "indringers-incidenten verspreid over alle ontgrendelde streken"), ook een streek die verder helemaal leeg is op de Wachttoren na. Door zo'n streek uit te sluiten van de trekking, blijft de dreiging gekoppeld aan streken die daadwerkelijk iets waardevols bevatten (een andere improvement of een ghost town), zonder de kernmaatregel van hierboven terug te draaien: een streek met een Wachttoren én iets anders blijft gewoon meeloten, en de Wachttoren beschermt die streek zoals altijd.

**Wachttoren bouwbaar op elke ontgrendelde streek, niet alleen de frontier**
De bovenstaande maatregel (incidenten over alle ontgrendelde streken) lost alleen de hélft van het probleem op zolang bouwen zelf aan de frontier-only-regel gebonden blijft: een streek die de speler allang achter zich gelaten heeft, zou dan nooit meer een Wachttoren kúnnen krijgen, en dus permanent onverdedigbaar zijn — de speler zou tribuut moeten betalen zonder enige manier om dat te voorkomen. Dat botst met het uitgangspunt dat dreiging door goed spel te vermijden moet zijn (zie hierboven, "geen kunstmatige tijdsdruk/klok" en de risk/reward-filosofie achter hard verval). De Wachttoren krijgt daarom een expliciete uitzondering op de frontier-only-bouwregel; de overige bouwregels (materialen, bouwtijd, wegverbinding voor bescherming) blijven onveranderd. Thematisch klopt het bovendien: forten en wachtposten werden historisch juist áchter de oprukkende grens aangelegd om de route te beveiligen, niet aan de voorste rand.

**Strijder-toewijzing omkeerbaar en instant**
Nu Wachttorens over veel meer streken verspreid nodig zijn (zie hierboven), zou een blijvend onomkeerbare strijder-toewijzing betekenen dat elke verkeerde plaatsing — of elke Wachttoren die inmiddels overbodig is omdat een andere streek dringender bescherming nodig heeft — een strijder definitief kost. Een strijder kan daarom worden teruggehaald en elders opnieuw toegewezen, volledig instant: bemannen was al instant, dus vertraging zou alleen bij *terughalen om elders te bemannen* schuren zonder de plaatsingskeuze zelf voelbaar zwaarder te maken. De indringers-mechaniek zelf (hierboven) blijft de reden waarom een verkeerde plaatsing nog steeds relevant is — een onbeschermde streek kan alsnog getroffen worden voordat de speler een strijder heeft kunnen herplaatsen.

**Bemanningskosten in voedsel per Wachttoren**
Een wachtpost die alleen bouwmateriaal en bouwtijd kost, maar daarna niets meer, past niet bij het "bevoorrading"-thema van de Wachttoren (zie ook de wegverbindings-eis voor bescherming, hoofdstuk 6): een bemanning moet ook gevoed worden. Een klein, doorlopend voedselverbruik per bemande toren (bovenop het stadsverbruik) maakt uitbreiden van het verdedigingsnetwerk een reële afweging tegen de voedseleconomie, in plaats van een zuiver positieve keuze zonder nadeel. De doorrekening in hoofdstuk 14 laat zien dat dit bij een typische boerderij-opbouw geen dreiging vormt voor de speelbaarheid — vandaar geen aanpassing elders in de voedseleconomie.

**Offer Altaar en Legerkamp geven twee tot dusver functieloze units eindelijk een rol**
De Verkenner en de Missionaris stonden allebei al sinds hoofdstuk 3 in het ontwerp, maar waren nooit daadwerkelijk trainbaar: de Verkenner wachtte op een vooruitkijk-mechaniek die bewust post-MVP bleef (hoofdstuk 2/13), en de Missionaris op een culturele-pushback-diplomatie die evenmin gebouwd is (hoofdstuk 6, "Culturele pushback"). In plaats van die oorspronkelijke, grotere post-MVP-functies alvast te bouwen, krijgen beide units een kleinere maar wél passende MVP-rol via de Bezette Streek: de Verkenner onthult vakjes (een kleine, tijdelijke vorm van "extra zicht"), de Missionaris leidt cultuurproductie om naar een belegeringsmeter (een kleine, tijdelijke vorm van "diplomatieke/culturele druk"). Zo blijven beide units geen dode letter in de improvement-tabel, zonder de grotere, nog niet ontworpen mechanieken waar ze oorspronkelijk voor bedoeld waren te hoeven voorwegnemen.

**Missionaris-vereiste voor de belegeringsmeter (zie "Klikbare kaart i.p.v. een los stadsscherm-paneel" hieronder voor de huidige, per-Heiligdom-vorm)**
Zonder deze eis zou cultuurproductie die tijdens een Bezette Streek toch al niet naar de normale streek-ontgrendeling gaat, automatisch en passief naar de belegeringsmeter stromen — de speler zou de Bezette Streek oplossen puur door door te blijven spelen, zonder een bewuste handeling. Door dat pas te laten gebeuren zodra er minstens één Missionaris is, wordt het oplossen van een Bezette Streek een actieve keuze (eerst een Offer Altaar bouwen, dan een Missionaris opleiden) in plaats van een automatisme — consistent met hoe de rest van het spel bewuste investering beloont boven passief wachten (zie ook "Settler en bouw-ritme" hieronder).

**Meerdere Missionarissen vermenigvuldigen de belegeringsmeter-snelheid (per-Heiligdom, zie "Klikbare kaart..." hieronder)**
Zonder deze aanpassing zou een tweede of derde Missionaris geen enkel effect hebben: de belegeringsmeter zou alleen vereisen dát er minstens één Missionaris bestaat, niet hoeveel — dat maakt elke Missionaris na de eerste een pure verspilling van hout en goud, inconsistent met hoe de rest van het spel investering beloont. Door de opbrengst van elk Heiligdom te vermenigvuldigen met het aantal daaraan toegewezen Missionarissen, wordt "meer Missionarissen sturen" een geldige, snellere route door de Bezette Streek — dezelfde soort investering-versus-tijd-afweging als elders in het spel (zie ook "Missionaris-vereiste voor de belegeringsmeter" hierboven).

**Een Legerkamp-eis voor een Confrontatie tegen een Bezette Streek, met een verlies-effect dat de bemanning kost maar niet het Legerkamp zelf**
Geen Confrontatie-knop zonder een voltooid, wegverbonden eigen Legerkamp op de streek direct onder de Bezette Streek — dat maakt de al bestaande "Wachttoren/Legerkamp beschermt ook de streek eronder"-relatie (hierboven) hier expliciet en verplicht, in plaats van optioneel. Het verlies-effect moet een Confrontatie tegen een Bezette Streek ook echt iets op het spel geven: winst mag niet gratis zijn. Omdat de speler deze Confrontatie zelf bewust initieert (in tegenstelling tot de passieve indringers-malus hierboven, die wél de Wachttoren zelf raakt), is het verlies-effect bewust verlicht tot alleen de toegewezen strijder (blijvend verloren, geen reassignment) — het Legerkamp zelf overleeft een verloren Confrontatie, al staat het er tot een nieuwe strijder het overneemt wel onbemand bij. Er blijft dus een echte inzet (een goed opgeleide strijder is niet gratis), maar zonder dat een enkele misrekening de hele verdedigingslinie van de streek eronder afbreekt — consistent met "hard verval i.p.v. zachte aftakeling" hierboven, maar met de zwaarte afgestemd op wat de speler zelf bewust riskeert versus wat willekeurig gebeurt.

**Precies één vijandelijke Wachttoren en één vijandelijk Heiligdom per Bezette Streek, allebei verplicht te vernietigen vóór de streek opengaat**
Zowel de Wachttoren- als de Heiligdom-vernietiging zijn even verplicht (zie "Einde van de Bezette Streek" hierboven) — zo wordt de climax van hoofdstuk 10 een echte afronding van beide lessen uit dit hoofdstuk (Belegering via Missionaris, Confrontatie via Legerkamp), in plaats van dat één ervan overgeslagen kan worden. Dat de settler pas na het slopen van beide de streek in mag en er pas dan gebouwd kan worden, is geen nieuw mechanisme: het is een direct gevolg van de bestaande "alleen ontgrendelde streken zijn betreedbaar/bebouwbaar"-regel (hoofdstuk 2/16), nu toegepast op een strengere ontgrendel-voorwaarde.

**Klikbare kaart i.p.v. een los stadsscherm-paneel**
Een los paneel binnen het stadsmenu (dezelfde plek als groei, opslag, stadsverbeteringen en het militaire paneel) vermengt twee verschillende soorten interactie: stadsbeheer (dingen die niets met een specifieke plek te maken hebben) en streek-specifieke acties (die per definitie over een concreet vakje gaan). Het patroon van een Wachttoren bemannen — eerst op de tile zelf klikken, dan pas de keuze maken — werkt precies zo goed voor Verkenning (klik een verhuld vakje), Confrontatie (klik de vijandelijke Wachttoren) en Missionaris-toewijzing (klik het vijandelijke Heiligdom): de tile-info-pop-up krijgt per geval de relevante actie erbij (`verkenningVraag`/`confrontatieVraag`/`missionarisVraag`), precies zoals `wachttorenVraag` dat al doet. Het statusbalkje op de kaart (buiten het stadsmenu) toont alleen nog samenvattende voortgang (lopende verkenningen, wololo-meters) — geen acties, puur zichtbaarheid.

**Verkenner niet een vooraf te trainen eenheid**
Een eenheid die eerst getraind moet worden (een aparte wachtrij) voordat de Verkenning-actie ooit beschikbaar komt, voegt weinig toe zolang de eenheid zelf geen andere rol heeft dan "bestaat, dus Verkenning is mogelijk" (geen positie, geen individuele toewijzing). Het sturen van een verkenner is daarom rechtstreeks aan de klik op het doelvakje gekoppeld — met dezelfde grondstofkosten en dezelfde tijdsduur als een getrainde eenheid zou hebben, nu als een per-vakje aftellend tellertje (`Tile.verkenningInGang`). De speler betaalt nog steeds grondstoffen en wetenschap, en wacht nog steeds een aantal beurten voordat het vakje onthuld wordt. De 1×-per-beurt-limiet (hoofdstuk 6) blijft bestaan als rem op hoe snel de hele streek verkend kan worden, losgekoppeld van hoeveel verkenningen tegelijk "onderweg" mogen zijn.

**Missionaris-toewijzing per Heiligdom i.p.v. een streek-brede belegeringsmeter, en veroveren i.p.v. vernietigen**
Een acties-op-de-kaart-model (zie "Klikbare kaart..." hierboven) vraagt om een doel-op-de-kaart: de speler stuurt een Missionaris naar een concreet vakje, niet naar een abstracte, streek-brede meter. Elk vijandelijk Heiligdom heeft daarom een eigen wololo-meter, gevuld door de Missionarissen die er specifiek naartoe gestuurd zijn (een vaste opbrengst per beurt per Missionaris). Bij een Missionaris die één specifiek Heiligdom bewerkt, past "bekeren" (het wordt eigen bezit, met cultuuropbrengst) thematisch beter dan "slopen" — vandaar de naam "wololo-meter". De toegewezen Missionarissen komen na verovering vrij voor een volgend doel.

**Legerkamp i.p.v. Wachttoren als eis voor een Confrontatie tegen een Bezette Streek**
Thematisch is een Wachttoren een verdedigingswerk (hij weert indringers af, hoofdstuk 6), terwijl een Legerkamp de eenheid is die zelf aanvalt — een Confrontatie starten vanaf een Wachttoren zou de verkeerde infrastructuur voor de verkeerde actie zijn. Het Legerkamp heeft toch al exact de rol die hier nodig is: een toegewezen Soldaat "marcheert zelf naar de Bezette Streek", ongeacht waar het Legerkamp staat (zie "Legerkamp overal bouwbaar" hieronder). Bemanning van dat Legerkamp is geen aparte eis, omdat de Legerkamp-legerwaarde toch al apart en overal meetelt (`berekenLegerkampLegerwaarde`) — de eis is puur "staat dit Legerkamp er en is het wegverbonden", niet "is het ook bemand". Het verlies-effect uit "Een Legerkamp-eis voor een Confrontatie..." hierboven treft bij verlies één van de Legerkamp-toegewezen strijders (de eerste, bij gebrek aan een aparte "wie voerde het bevel"-notie).

**Legerkamp overal bouwbaar, net als de Wachttoren**
Dezelfde redenering als "Wachttoren bouwbaar op elke ontgrendelde streek" hierboven: een Soldaat die aan een Legerkamp is toegewezen, marcheert zelf naar de Bezette Streek om daar te vechten — het Legerkamp zelf hoeft dus niet op die streek, of zelfs in de buurt ervan, te staan. Een frontier-only-bouwregel voor het Legerkamp zou de speler dwingen het steeds opnieuw te herbouwen naarmate de frontier verder trekt, zonder dat daar een thematische reden voor is.

**City-improvement-capaciteit i.p.v. een los relic-telsysteem als groei-beloning**
De groei-beloning is rechtstreeks gekoppeld aan wat de speler al aan het doen is: hoeveel city improvements een stad tegelijk kan dragen, en welke pas vanaf een bepaalde stadsgrootte bouwbaar zijn (Barakken/Tempel vanaf "middel", Grote Tempel vanaf "groot"). Dat is een tastbare beloning (méér mogelijkheden bij een grotere stad) via capaciteit en toegang — mechanisch eenvoudiger dan een apart relic-telsysteem, en het hergebruikt de al bestaande bouwwachtrij-infrastructuur in plaats van een nieuw inventarisconcept te introduceren. De Anker-verhaal-relics (hoofdstuk 9) zijn een volledig apart mechanisme dat niets met city-improvement-capaciteit te maken heeft.

**Opslagplaats valt buiten de city-improvement-cap**
De Opslagplaats heeft al haar eigen, herhaalbare wachtrij (hoofdstuk 3/5, "praktisch maximum ~3-4 opslagplaatsen per stad") en dient een structureel andere functie (opslagcapaciteit uitbreiden) dan de vijf gecapte city improvements (Bibliotheek/Markt/Barakken/Tempel/Grote Tempel), die elk een doorlopend productie- of legerwaarde-effect leveren. Zou Opslagplaats wél meetellen voor de cap, dan zou hij bij een kleine stad (cap 1) de facto de enige zinvolle keuze worden — elke andere city improvement zou dan rechtstreeks concurreren met de opslagcapaciteit die de speler toch al nodig heeft om te kunnen bouwen. Door Opslagplaats hier expliciet buiten te houden, blijft de cap een keuze tussen de vijf inhoudelijk verschillende improvements, niet een verkapte keuze tussen "opslag" en "iets anders".

**Een forse Legerkamp/Offer Altaar-infrastructuur-eis als bewuste climax-voorbereiding**
Legerkamp en Offer Altaar zijn de sleutel tot de Bezette-Streek-climax (hoofdstuk 6/10). Door ze pas bouwbaar te maken na een fors aantal actieve Wachttorens/Heiligdommen (5) én de bijbehorende city improvement (Barakken/Grote Tempel), moet de speler zijn militaire en culturele infrastructuur écht hebben opgebouwd voordat hij de Bezette Streek aankan — consistent met hoe de rest van het spel bewuste investering beloont boven een toevallig-net-genoeg-grondstoffen-moment (zie ook "Missionaris-vereiste voor de belegeringsmeter" hierboven). De eis is bewust fors (vergelijkbaar met een aanzienlijk deel van de tutorial-streken), maar niet zo fors dat hij binnen de 13 tutorial-streken onhaalbaar wordt — zie de doorrekening in hoofdstuk 14. Een zichtbare voortgangsindicatie in de bouw-UI (in plaats van de improvements simpelweg te verbergen, zoals bij een gewone `minStreek`-eis) houdt dit voorspelbaar: de speler ziet hoe ver hij is, niet alleen dát het nog niet kan.

**Vertakkende verhaalstructuur met een gedeelde slotscène i.p.v. volledig lineair of volledig random**
Volledig vaste verhaalmomenten (altijd dezelfde gebeurtenis op dezelfde streek) zouden na een paar runs voorspelbaar worden; volledig random getrokken gebeurtenissen zouden geen samenhangend verhaal opbouwen. Een keuzeboom met een paar vaste ankerpunten (waarvan de invulling reageert op eerdere keuzes) geeft het gevoel van een reagerend verhaal, terwijl het aantal te schrijven scenario's beheersbaar blijft — mede mogelijk gemaakt door bij het laatste ankerpunt de paden samen te laten komen in één kernscène met tonale varianten, in plaats van vier volledig aparte eindes.

**Vaste, handgeschreven campagnekaarten i.p.v. procedurele worldgen**
Elke campagne krijgt één eigen, volledig handgeschreven kaart in plaats van een procedureel gegenereerde — hetzelfde patroon als de tutorial, die volledig op vaste, handgeschreven streek-data draait (hoofdstuk 10/11/13).

*Waarom*: een procedurele generator zou een heel nieuw stuk architectuur vergen (seeded RNG, een plaatsingsalgoritme, validatie tegen onspeelbare edge-cases zoals een streek zonder geldig heuvel/bergvakje) bovenop wat feitelijk al bestaat en bewezen werkt. Het herhalende drie-stichtingsmomenten-patroon (hoofdstuk 9 Deel 2) vraagt bovendien om precíes drie vers-water-vakjes op precíes de juiste afstandszones per stichtingscyclus (`gegarandeerdeStichtingskansHoogten()`, hoofdstuk 9/13) — met een vaste kaart is dat een kwestie van die vakjes op de juiste plek neerzetten, met een generator zou het een plaatsingsalgoritme met garanties vereisen. Dezelfde redenering geldt voor de Anker-verhalen (hoofdstuk 9, gebonden aan streekhoogte-ranges) en voor softlock-preventie zoals de gegarandeerde tweede Amberader vóór streek 12 (hoofdstuk 14): stuk voor stuk plaatsingen die met een vaste kaart triviaal handmatig te garanderen zijn, en met een generator elk een eigen, apart te testen regel zouden vergen.

*Afweging*: dit kost wél iets. Een vaste kaart betekent minder replay-variatie binnen één campagne (een tweede "Going West"-run speelt zich af op dezelfde kaart) en een groter, per-campagne contentwerk (elke nieuwe campagne, hoofdstuk 8/14, heeft een eigen, volledig met de hand ingevulde kaart van 20-60 streken nodig, tegenover 14 voor de tutorial) — dat werk schaalt in principe met het aantal campagnes, in tegenstelling tot een generator die je maar één keer bouwt. Daar staat tegenover dat het spel zijn onvoorspelbaarheid al voor een groot deel uit andere systemen haalt, niet uit de kaart zelf: verborgen zeldzaamheid, de vertakkende Anker-keuzeboom, de indringers-trekking en (post-MVP) culturele pushback (hoofdstuk 6/7/9). Voor de speler die de tutorial al "tig" keer gespeeld heeft zonder dat de vaste kaart een probleem was, weegt de lagere implementatie-onzekerheid zwaarder dan de replay-variatie die een generator zou toevoegen. Per moeilijkheidsgraad (hoofdstuk 14) komt er daarom telkens een eigen, apart handgeschreven kaart met een eigen vaste lengte, in plaats van één kaart met een random-getrokken lengte binnen een range.

**Wetenschap als vertakkende, onomkeerbare technologie-boom i.p.v. los vooruitkijk-bereik**
Het voorziene vooruitkijk-bereik-effect blijft bewust post-MVP (hoofdstuk 13). In plaats daarvan krijgt wetenschap dezelfde vertakkende, permanent-onomkeerbare keuzelogica als de Anker-verhalen (hoofdstuk 9): op elke drempel kiest de speler één van twee technologieën, en het niet-gekozen pad — inclusief alles wat daaronder in de boom hangt — is voor de rest van de run blijvend ontoegankelijk. Dat is bewuste consistentie in ontwerptaal (twee systemen die aanvoelen als variaties op hetzelfde patroon, in plaats van twee losse mechanieken die toevallig allebei "kiezen" heten) en versterkt tegelijk het rogue-like karakter: net als bij een Anker-keuze bouwt de speler binnen één run een onherhaalbare combinatie van technologieën op.

**Wetenschapscurve bewust zwaarder dan de cultuurcurve**
Cultuur koopt eenmalige toegang tot een streek — een keer betaald, geen blijvend voordeel behalve de toegang zelf. Elke technologie in de boom hierboven levert daarentegen een **permanente, structurele** bonus op (een boerderij die voorgoed 20% meer opbrengt, een opslag-cap die voorgoed +10 is, een leger dat voorgoed sterker vecht) — een stapelend voordeel voor de rest van de run, niet een eenmalige drempel. Die grotere waarde per aankoop rechtvaardigt een hogere prijs: zowel de basisterm als de kwadratische factor van de wetenschapskosten (hoofdstuk 14) liggen boven die van de cultuurkosten, met een verschil dat oploopt naarmate de speler dieper de boom in gaat — passend bij hoe ook de bonussen zelf zwaarder worden (drempel 3 stapelt op drempel 1 en 2).

**Echte historische inspiratie i.p.v. fictieve samengestelde facties**
Er is bewust gekozen om echte historische volken en leiders te gebruiken als inspiratiebron, met volledige creatieve vrijheid voor de ontwerper om zelf te bepalen hoeveel historische nauwkeurigheid wordt aangehouden. Dit sluit aan bij de achtergrond en voorkeur van de ontwerper, en geeft de campagnes meer historisch gewicht dan volledig verzonnen namen zouden bieden.

**Neolithische tutorial als neutrale sfeer, campagnes met eigen toon**
Door de tutorial in een fictieve, mythische neolithische setting te plaatsen (in plaats van er meteen een historische campagne van te maken), kan de speler alle kernmechanieken leren zonder dat dit de toon van latere, thematisch zwaardere campagnes (zoals de sombere Amerikaanse frontier) alvast kleurt of verwatert.

**Settler en bouw-ritme i.p.v. een bouwkeuze bij elke beurt**
Een nieuwe bouwkeuze op elke beurt aanbieden liet het bouwen te snel aanvoelen: er was geen andere handeling tussen twee bouwmomenten in. Door nieuwe bouwprojecten voortaan om de 3 beurten aan te bieden (hoofdstuk 16) ontstaat er ruimte, en die ruimte wordt gevuld met een actieve, ruimtelijke taak: de settler-eenheid verplaatsen en wegen aanleggen. Door land improvements pas daadwerkelijk te laten produceren zodra ze via zo'n weg met de stad verbonden zijn, is wegenaanleg geen losstaand extraatje maar een voorwaarde voor de economie zelf — precies zoals uitgeputte grond (hoofdstuk 4) en verval al zorgen dat de speler iets te doen heeft tussen bouwmomenten door.

**Terrein-eisen per land improvement, met een gegarandeerd minimum per streek**
Zonder terrein-eisen voelen alle 8 land-vakjes van een streek inwisselbaar aan: elke improvement past overal, dus de keuze wáár je bouwt heeft geen betekenis. Door improvements te binden aan een vakje-terreinsubtype (houtkap → bos, mijn/steengroeve → heuvel/berg, boerderij → vlak) wordt plaatsing zelf een keuze in plaats van een formaliteit, en oogt elke streek ook visueel gevarieerder dan één herhaald terreintype. Mijn en steengroeve delen bewust dezelfde terrein-eis (heuvel/berg) — dat maakt die vakjes een schaarser, strategischer knelpunt (op streken met maar één zo'n vakje kun je er dus maar één van de twee bouwen) in plaats van dat elk vakje-subtype netjes één-op-één aan één improvement gekoppeld is. Om te voorkomen dat dit té restrictief wordt, houdt elke (tutorial-)streek bewust minstens één vakje van elk relevant subtype aan — een streek kan dus wél duidelijk overhellen naar bijvoorbeeld bos of gebergte (en zo de hoogte voelbaar maken, bv. geen bos meer boven de boomgrens), maar sluit nooit een hele economische optie helemaal uit. Terrein-subtypes liggen, net als de streek-terreintypes zelf, vast per streek — voor de tutorial én (sinds issue #247, hoofdstuk 8/11) voor elke latere campagne: geen procedurele generatie, wel dezelfde onderliggende regel (minstens één vakje per relevant subtype) bij het handmatig samenstellen van elke nieuwe campagnekaart.

**Waarschuwing vóór "Volgende beurt" i.p.v. stilzwijgend een actie laten verlopen**
Zowel de settler-actie als de bouwkeuze zijn beperkt tot één keer per beurt (hoofdstuk 16) — een speler die snel doorklikt kan zo onbedoeld een beurt "verspillen" zonder dat te merken. In plaats van dit stilzwijgend te laten gebeuren (of, aan de andere kant, "Volgende beurt" helemaal te blokkeren tot alles gebruikt is, wat een verplichting zou maken van iets dat een keuze hoort te zijn), waarschuwt een pop-up de speler alleen als er nog iets te doen valt, met de mogelijkheid om alsnog terug te gaan en te handelen vóórdat de beurt echt eindigt. Zo blijft overslaan een bewuste keuze, geen ongeluk.

**Settler-jacht op kuddes als alternatief voor de Houtkap-improvement**
Een losse, directe settler-actie (jagen/hout hakken) naast de bestaande improvement-productie (hoofdstuk 5) geeft de speler een kleinere maar onmiddellijke opbrengst zonder bouwkosten of wegverbinding — nuttig in de vroege beurten van het bouw-ritme (hoofdstuk 16) voordat een Houtkap of Boerderij daadwerkelijk staat en verbonden is. Kuddes zijn bewust eindig (net als de uitputting van land improvements, hoofdstuk 4) zodat jagen een tijdelijke bonus blijft in plaats van een permanente vervanging van boerderijen — vandaar de hogere opbrengst per beurt (3 voedsel) tegenover het structurele, maar onbeperkte houtkappen (1 hout per beurt).

**Roofdieren als risico op settler-jacht**
Settler-jacht op kuddes (hierboven) zou zonder risico een gratis, dominante uitweg uit een voedseltekort zijn: geen bouwkosten, geen wegverbinding, en — anders dan bijvoorbeeld een Boerderij, die tijd en materiaal kost — zonder enig nadeel. Doordat jagen vanaf streek 6 een kans op een roofdier met zich meebrengt (hoofdstuk 14/17), staat een reëel risico tegenover die gratis opbrengst: de settler kan sterven als de speler niet op tijd wegbeweegt. Dat maakt "jaag ik hier nog een keer, of bouw ik liever een Boerderij" een echte afweging, in plaats van dat jagen altijd de dominante keuze blijft zolang er een kudde in de buurt staat. Het ritme (zichtbaar → een beurt reactietijd → pas dan het gevolg) houdt dit, net als bij stadsverval en indringers (hoofdstuk 4/6/7), voorspelbaar te vermijden in plaats van willekeurig oneerlijk.

**Opslagplaats is geen harde eis om te kunnen stichten**
De stichtingskosten (hoofdstuk 14) blijven ruim onder de start-opslag-cap van 30 — de Opslagplaats-improvement blijft verder gewoon nuttig (meer opslag-ruimte), maar is geen harde eis om te kunnen stichten. Dat past bij de kernspanning van hoofdstuk 4 (doorgroeien/uitbouwen kost tijd, tegenover simpelweg vertrekken zodra het net-lukt) zonder het stichten zelf onnodig te vertragen.

**De settler als civiele keuze tegenover groei, niet als losse aanwinst**
Een nieuwe settler simpelweg los verkrijgbaar maken (bijvoorbeeld via een aparte knop, altijd beschikbaar) zou het stichten van een tweede stad een puur positieve, kosteloze keuze maken zodra de speler er de grondstoffen voor heeft. Door de nieuwe settler in dezelfde civiele wachtrij te zetten als de groei-tier-improvement (Woonwijk) — met hoogstens één van de twee tegelijk in aanbouw — wordt het een echte afweging: investeer je in de stad waar je al staat (groei, meer relic-slots), of rust je een expeditie uit om verder te trekken? Dat past bij hoofdstuk 3, waar Civiel al de categorie is die stads-tiers en beweging (weg/settler) samenbrengt.

**Maximaal één settler per gestichte stad**
Zonder deze rem zou een speler in theorie settler na settler kunnen uitrusten vanuit één stad en zo een onbeperkt aantal expedities tegelijk op pad kunnen sturen, wat het "één actieve frontier-stad tegelijk"-uitgangspunt (hoofdstuk 2) zou ondermijnen. Door het aantal beschikbare settlers te koppelen aan het aantal gestichte steden (elke gestichte stad kan er precies één uitrusten), blijft expansie een geleidelijk, door de speler zelf opgebouwd proces in plaats van een instant-vermenigvuldiging — een natuurlijke rem die meegroeit met hoeveel de speler daadwerkelijk heeft opgebouwd.

**Een permanent herbouwbare tweede settler vanaf streek 7**
Naast de eerste settler (nog steeds gebonden aan "maximaal één per gestichte stad") kan de stad vanaf het moment dat streek 7 ontgrendeld is, een **tweede** settler uitrusten — via een eigen wachtrij (`City.tweedeSettlerInAanbouw`), los van de gedeelde civiele wachtrij van groei/de eerste settler, zodat de speler groei/de eerste settler en de tweede settler tegelijk kan laten lopen. Anders dan de eerste settler is deze tweede settler **permanent herbouwbaar**: verlies je hem aan een roofdier, of verbruik je hem bij het stichten van de stad, dan is de wachtrij meteen weer te starten (zelfde kosten/bouwtijd als de eerste settler). De streek-7-drempel is bewust gekozen: pas als het terugreizen naar eerdere streken voor settler-jacht en het herbouwen van vervallen Wachttorens echt vervelend begint te worden, neemt de tweede settler die last weg — hij is dus geen vroege versoepeling van de kernspanning uit de vorige alinea, maar een latere verlichting van reis-gesleep, nadat die spanning zijn werk gedaan heeft. Het roofdieren-risico bij settler-jacht (hoofdstuk 17) geldt onverkort voor beide settlers, elk onafhankelijk.

**Amberader/goudmijn is uitputtend, net als de andere mijn**
Een goudader is, net als een ertsader, een fysieke, eindige vondst — het hele nut ligt in het opgebruiken van een hulpbron (zie hierboven, "Wachttoren en Heiligdom putten niet uit"). Dat plaatst de Amberader nadrukkelijk in dezelfde categorie als mijn/boerderij/houtkap/steengroeve, niet bij de niet-uitputtende Sterrencirkel of het Heiligdom, die allebei een blijvende aanwezigheid voorstellen (een observatorium, een cultusplek) in plaats van een oogst. De extra, vakje-specifieke amberader-vondst-eis (bovenop de gewone heuvel/berg-terreineis van een mijn, hoofdstuk 3/14) maakt een Amberader-locatie bovendien schaarser dan een gewone erts-mijn-locatie — precies zoals hoofdstuk 7 een goudmijn al noemt als voorbeeld van iets om "op te gokken".

**Een tweede gegarandeerde Amberader-locatie voorkomt een softlock rond streek 12**
De eerste gegarandeerde Amberader (streek 7, hoofdstuk 14) is, net als elke andere mijn/boerderij/houtkap, uitputtend (hierboven) — een speler kan die vondst dus laten opdrogen zonder ooit een Markt te bouwen als vervangend goud-inkomen. Zonder een tweede garantie zou zo'n speler tegen streek 12 (de Bezette Streek, hoofdstuk 6) kunnen aanlopen zonder enig lopend goud-inkomen, precies op het moment dat zowel Offer Altaar als Legerkamp goud vereisen (hoofdstuk 11, "Legerkamp/Offer Altaar-infrastructuur-eis") — een echte softlock, geen tegenslag die de speler had kunnen zien aankomen. Een tweede gegarandeerde locatie op streek 11 (hoofdstuk 14) lost dit op met dezelfde vaste-worldgen-garantie als de eerste, vlak genoeg vóór streek 12 om nog op tijd te zijn, maar laat genoeg om de speler eerst de kans te geven zelf een Markt te bouwen. Bewust geen nieuwe variant of mechaniek: dezelfde Amberader/goudmijn-improvement, dezelfde uitputting, dezelfde indringers-malus hieronder — de garantie zit alleen in de worldgen-plaatsing, niet in een nieuw systeem.

**Amberader verhoogt indringers-aantrekkelijkheid: de eerste rogue-like bonus/malus-koppeling**
Een waardevolle vondst zonder enige consequentie (alleen een positief effect, geen risico) past niet bij het rogue-like karakter van het spel (hoofdstuk 7, 9), waarin risico en beloning doorgaans aan elkaar gekoppeld zijn. Een streek met een actieve Amberader weegt daarom zwaarder mee in de indringers-streek-trekking (hoofdstuk 6) — het waardevolle materiaal trekt ongewenste aandacht, thematisch net zo logisch als de bestaande koppeling tussen groei en verval-risico (hierboven, "hard verval i.p.v. zachte aftakeling"). Deze koppeling is bewust klein gehouden: ze wijzigt alleen het gewicht in een al bestaande trekking (hoofdstuk 6), voegt geen nieuw framework toe, en laat de uitkomst van een geloot incident (beschermd door een Wachttoren, of tribuut) volledig ongewijzigd — de Amberader vergroot alleen de kans dat een streek überhaupt geloot wordt. Grotere, systemische bonus/malus-mechanismen (zeldzaamheid met een dual-edge-effect per tier, hoofdstuk 7, of een los vondst-gebeurtenissysteem) zijn bewust uitgesteld: zeldzaamheid tot een latere MVP-uitbreiding (hoofdstuk 13: "nog niet in de MVP"), en een vondst-gebeurtenissysteem tot de Amerikaanse campagne, waar zulke systemische mechanismen beter passen bij de zwaardere, minder heroïsche toon (hoofdstuk 9).

**Een beschermde Wachttoren houdt niet altijd zomaar stand: de tweede rogue-like bonus/malus-koppeling**
Een voltooide, bemande, wegverbonden Wachttoren als een pure set-and-forget-investering — die zijn streek (en de streek eronder) voor de rest van de run gegarandeerd tegen elk indringers-incident beschermt — zou precies het soort risicoloze, "veilige" uitkomst zijn die de eerste koppeling hierboven (Amberader-malus) al vermeed voor waardevolle vondsten, en dat geldt hier zelfs voor oude, allang achtergelaten streken, niet alleen de frontier zelf. Een kleine, altijd aanwezige kans dat de bescherming toch faalt (malus: ruïne + verloren strijder) — gecompenseerd door een even kleine kans op een tegenovergesteld resultaat (bonus: buit) — geeft ook een lang geleden gebouwde Wachttoren een klein maar reëel spanningselement, in lijn met het risk/reward-karakter dat de rest van het spel al draagt (hoofdstuk 4, 7, 9). Net als bij de Amberader-koppeling is de omvang bewust klein gehouden: het wijzigt alleen de uitkomst van een al bestaand incident (hoofdstuk 6), voegt geen nieuw framework toe, en de volgorde stand houden (85%) ♦ malus (10%) ♦ bonus (5%) houdt de meest waarschijnlijke uitkomst nadrukkelijk het bestaande gedrag. De malus hergebruikt bovendien bewust dezelfde afhandeling als een verloren Confrontatie tegen een Bezette Streek (ruïne, herbouwbaar, blijvend verloren strijder) — geen nieuw verlies-patroon, maar een tweede toepassing van een al gevestigd patroon.

**Rush-bouwen met goud raakt de bouwwachtrij, niet de technologieboom**
Goud kopen tijd af binnen een systeem dat toch al met tijd werkt: de productiewachtrij (hoofdstuk 5) is een aantal beurten per improvement, en rush-bouwen verkort dat aantal — een direct, evenredig ruilmiddel. De technologieboom (hoofdstuk 3/9) is bewust een zwaardere drempel dan cultuur (zie hierboven, "Wetenschapscurve bewust zwaarder dan de cultuurcurve"): elke technologie levert een permanente, structurele bonus op, en die drempel moet zijn eigen tempo houden om die zwaarte te behouden. Zou goud die drempel ook kunnen omzeilen, dan zou de bewust zwaardere wetenschapscurve zijn functie verliezen zodra een speler genoeg goud heeft opgespaard — rush-bouwen blijft daarom uitdrukkelijk beperkt tot land- en city-improvements in de bouwwachtrij.

---

## 12. Visuele stijl

**Referentiestijl**: jaren 90 pre-rendered aesthetic — met name *Planescape: Torment* als hoofdreferentie. Aanvullende inspiratiebronnen, elk met een specifiek toepassingsgebied:

- **Diablo II** — pre-rendered 3D omgevingen gebakken tot losse 2D tiles, donkere/atmosferische belichting. Belangrijkste technische referentie: dit spel bewijst dat je met losse, herbruikbare tegels toch een samenhangend, sfeervol geheel kunt bouwen.
- **Fallout 1 & 2** — kariger, verweerd/industrieel palet. Referentie specifiek voor de Amerikaanse frontier-campagne (sluit aan bij de Blood Meridian-toon).
- **Heroes of Might and Magic III** — handgeschilderd, tile-based fantasy-palet met veel variatie binnen herbruikbare tegel-types. Referentie voor hoe land improvements er visueel gevarieerd uit kunnen zien.
- **Riven / Myst** — stille, wonderlijke, schilderachtige werelden. Referentie specifiek voor de neolithische tutorial (Het Hertenpad-volk).
- **Age of Empires II** — bovenaanzicht met herkenbare, per-cultuur onderscheidende gebouw-iconografie. Referentie voor hoe je improvements per campagne visueel laat verschillen zonder de leesbaarheid te verliezen.

**Technische aanpak: losse tegels, geen naadloos geschilderd tafereel**
Elke land/city improvement is een eigen, in zichzelf afgesloten tegel-asset (zoals bij Diablo II/HoMM3) — geen doorlopend geschilderd landschap per streek (zoals bij Final Fantasy VII-VIII-IX). Dit is bewust gekozen boven de "naadloze" aanpak omdat:
- het productie-werk per campagne beperkt blijft tot het vervangen van een tegel-set, niet het herbouwen van hele scènes;
- het past bij het modulaire bouwvakken-systeem (9 losse vakjes per streek) dat al de kern van het ruimtelijk model is;
- het toevoegen van nieuwe improvements, zeldzaamheidsvarianten, of hele campagnes hierdoor een asset-toevoeging blijft, geen structurele wijziging.

**Per campagne een eigen tegel-set/palet, zelfde onderliggende systeem**: de "engine" (grid, tegel-plaatsing, belichtingsstijl-conventies) blijft gelijk; wat wisselt is de tegel-set en het kleurenpalet (bijv. stoffig/verweerd voor Amerika, koud/blauwig voor Siberië, warm/aards voor de neolithische tutorial).

**Zeldzaamheidsvarianten**: elk land improvement-type heeft idealiter een visueel onderscheidbare variant per zeldzaamheidstier (gewoon/rijk/legendarisch), zodat zeldzaamheid ook zonder UI-tekst herkenbaar is zodra een tile onthuld wordt.

---

## 13. Technische opzet & bouwplan (MVP)

**Stack**: Next.js + TypeScript. Rendering van het tegel-grid via HTML Canvas (past bij eerdere browsergame-ervaring en geeft volledige controle over losse tegel-assets). Voor v1 geen backend nodig — save-states lokaal (localStorage/IndexedDB); een Vercel-deploy met een gratis database is een logische vervolgstap zodra cloud-saves/meerdere devices relevant worden.

### MVP-scope (eerste bouwbare versie)

Om een speelbare kernloop te krijgen vóór alle content is ingevuld, beperkt de eerste versie zich tot:

**Wel in de MVP:**
- Eén stad, één actieve band van 9 vakjes, meerdere streken (geen frontier-stadswissel nog)
- Land improvements: categorie kiezen → alle geldige opties binnen die categorie tonen → bouwen (met productiewachtrij). City improvements en units lopen niet via deze flow (stad-pop-up resp. eigen mechanisme, hoofdstuk 1/11).
- Drie bouwmaterialen (hout/steen/erts) + gedeelde opslag-cap, losstaande voedselvoorraad
- Uitputting van land improvements → permanente ghost-town-tiles
- Cultuur → streek ontgrendelen; fog of war
- Twee groei-tier-stappen (klein→middel via Woonwijk, middel→groot via Grote Woonwijk — hoofdstuk 3/14, issue: "city improvements" Deel 2), met het zichtbare waarschuwingssignaal en het permadeath-verval-risico (volledige ineenstorting eindigt de run en herstart de tutorial, zie hoofdstuk 4/11)
- **City-improvement-capaciteit & -gating** (hoofdstuk 3/4/6/11/14, issue: "city improvements"): een aan de stadsgrootte gekoppelde cap op het aantal gelijktijdige city improvements (klein 1, middel 3, groot 5), vier nieuwe/ingevulde city improvements (Bibliotheek, Markt, Barakken, Tempel, Grote Tempel — de laatste drie met een stadsgrootte-eis), en een infrastructuur-eis voor Legerkamp/Offer Altaar (5 actieve Wachttorens + Barakken, resp. 5 actieve Heiligdommen + Grote Tempel) met een zichtbare voortgangsindicatie in de bouw-UI
- Militaire confrontatie (winkans-formule) — in de tutorial uitsluitend via de Bezette Streek hieronder (de eerdere, generieke "confrontatie op streek 12"-placeholder is vervangen)
- **Bezette Streek & Confrontatie** (hoofdstuk 6/10/11/14, issue: "De Bezette Streek, missionaris en verkenner", verlies-effect en aantallen bijgesteld door issue "laatste confrontatie tweaken"): generiek, herbruikbaar mechanisme, in de tutorial gescript op streek 12. Per-tegel verhulling los van de gewone fog of war, Verkenning (nieuwe functie voor de Verkenner-unit), Offer Altaar + Missionaris + belegeringsmeter tegen vijandelijke Heiligdommen, Legerkamp + herziene Confrontatie (met een harde eigen-Wachttoren-eis en een verlies-effect dat alleen de bemannende strijder kost) tegen vijandelijke Wachttorens — precies 1 van elk, en de streek ontgrendelt pas als beide vernietigd zijn.
- Settler-eenheid en wegen (hoofdstuk 16): de settler start beurt 2 in de stad en verplaatst 1 vakje per beurt (voor/achter/zijwaarts); hij legt kosteloos wegen aan (kost enkel die beurt). Een land improvement produceert pas zodra zijn vakje via zo'n wegverbinding aan de stad hangt. Nieuwe bouwprojecten kun je hierdoor nog maar om de 3 beurten starten (de eerste beurt telt al als bouwmoment)
- Kuddes & settler-jacht (hoofdstuk 17): vanaf streek 4 kunnen wilde kuddes op een leeg vakje verschijnen (gemeld via een pop-up, dezelfde stijl als de indringers-pop-up); de settler kan er (in plaats van bewegen/weg aanleggen) op jagen voor voedsel, of op een bos-vakje hout hakken — beide een alternatief voor gebouwde improvements, zonder bouwkosten. Vanaf streek 5 kan jagen een **roofdier** oproepen op het jachtvakje: zichtbaar via een pop-up, valt pas de beurt erna aan, en doodt de settler als die er dan nog staat — verlies van de settler kan de huifkar terugbrengen in de civiele improvement-pool (hoofdstuk 6/11)
- Waarschuwing bij "Volgende beurt" (hoofdstuk 11) als de settler nog een actie heeft of er nog een bouwkeuze openstaat, met de mogelijkheid om alsnog terug te gaan en te handelen
- Placeholder-tegels (simpele, consistente stijl — geen definitieve pre-rendered assets nodig om te testen)
- Alléén de tutorial-content (Het Hertenpad-volk, streken 1-13) als speelbare inhoud
- De stad heeft een zichtbare naam (**Oer-stad**, zie hoofdstuk 10), te zien via een klik op de stad-tile — geen naam-generator voor toekomstige steden, dat komt pas met meerdere-steden-support
- **Opslagplaats** (hoofdstuk 3/5/11/14, economische city improvement): verhoogt de gedeelde opslag-cap met +20, herhaalbaar. Eigen wachtrij, los van de civiele wachtrij hieronder.
- **Stad stichten** (hoofdstuk 2/10/16): op een vakje aan vers water waar de settler fysiek staat, met een bevestigingswaarschuwing (de settler verdwijnt hierbij — "de huifkar wordt de stad"). In de tutorial is dit uitsluitend mogelijk op streek 13 (de oceaan aan de overkant, hoofdstuk 10) — de enige plek met vers water. Vervangt "bereik streek 12" als tutorial-einddoel; opent daarna de afsluitende scène en het campagnemenu. Nog **geen** volledige frontier-verplaatsing (dat blijft hieronder uitgesteld).
- **Nieuwe settler in de civiele improvement-pool** (hoofdstuk 3/11): concurreert met de groei-tier-improvement (hoogstens één van de twee tegelijk in aanbouw). Alleen beschikbaar als het huidige aantal settlers lager is dan het aantal gestichte steden.
- **Sterrencirkel** (hoofdstuk 3/4/6/14, wetenschappelijk land improvement, issue: "tech tree toevoegen"): produceert wetenschap per beurt, put niet uit (zelfde patroon als het Heiligdom), pas actief na wegverbinding zoals elk ander land improvement.
- **Technologie-boom** (hoofdstuk 3/9/11/14, issue: "tech tree toevoegen"): 3 drempels van elk 2 keuzes, permanent vertakkend zoals de Anker-verhalen — zie techTree.ts voor de volledige boom en effecten.

**Nog niet in de MVP** (bewust uitgesteld tot de kernloop staat):
- Een daadwerkelijk speelbare Amerikaanse frontier-campagne, inclusief het herhalende drie-stichtingsmomenten-patroon in de praktijk (hoofdstuk 9/11/14) — het onderliggende mechanisme (datamodel-fundering `GameState.steden`/`City.streekHoogte` (M16), effectiviteitsverval `stadEffectiviteit` (M17), en de `stichtStad`-herschrijving + `gegarandeerdeStichtingskansHoogten()` (Deel 2, M18)) staat inmiddels in de code, maar de tutorial (vast, 14 streken, precies één vers-water-vakje) kan het nooit meer dan één keer laten zien. Wat nog ontbreekt: een echte, langere, vaste (handgeschreven) campagnewereld (20-60 streken, hoofdstuk 8/11/14) met een eigen `CampaignConfig`-instantie, waarin de drie kansen per cyclus daadwerkelijk als vers-water-vakjes zijn ingetekend — pas dan wordt het patroon voor een speler voelbaar (zie hoofdstuk 15, voorgestelde M20a/b/c)
- Permanent vooruitkijk-bereik verder dan 1 streek (de wetenschap-relic uit hoofdstuk 3) en de bijbehorende relic-functie van de Verkenner — de Verkenner-unit zelf is sinds "De Bezette Streek" wél in de MVP, met een andere, kleinere functie (Verkenning, hoofdstuk 6)
- Culturele pushback-diplomatie (hoofdstuk 6, de oplopende-cultuurkostprijs-variant) — de Missionaris-unit zelf is sinds "De Bezette Streek" wél in de MVP, met een andere, kleinere functie (belegeringsmeter, hoofdstuk 6)
- Zeldzaamheid (rijk/legendarisch) en het oogst-tijdvenster
- Volledige Amerikaanse campagne-content (ankers, vertakkingen)
- Meerdere campagnes/saves tegelijk

### Data-schema's

Dit document bevatte hier eerder een letterlijk, "indicatief" gelabeld TypeScript-codeblok met de belangrijkste interfaces (`Improvement`, `Tile`, `City`, `GameState`, `CampaignConfig`, e.d.). Dat blok is verwijderd: een los-gekopieerd voorbeeld raakt onvermijdelijk gedateerd zodra de echte code evolueert (het miste bijvoorbeeld al `Tile.roofdier`/`Tile.bouwVoortgang` en `Improvement.minStreek`), terwijl de losse velden intussen toch al beschreven staan in de hoofdstukken hierboven (2, 3, 4, 6, 9, 11, 16, 17).

**Voor de actuele, altijd-kloppende interfaces: zie de code zelf**, met name:
- `src/game/types.ts` — `Improvement`, `Tile`, `Settler`, `Layer`, `City`, `GameState`, `Strijder`, `IndringersEvent`, `CampaignConfig`, `TechId`, en de post-MVP-velden die al voorbereid staan (`Improvement.zeldzaamheid`, `CampaignConfig.ankers`, `zeldzaamheidLegendarisch`) zonder dat de tutorial-code ze gebruikt (CLAUDE.md).
- `src/game/techTree.ts` — de volledige technologie-boom en effecten per `TechId`.

### Asset-lijst voor de MVP (placeholder-niveau)

**Stijlrichting voor deze MVP specifiek**: omdat de MVP alléén de tutorial (Het Hertenpad-volk) bevat, volgen de assets hier de **Riven/Myst-referentie** (stil, schilderachtig, warm/aards licht, gevoel van verwondering) in plaats van de donkerdere Diablo II-achtige stijl die voor latere, zwaardere campagnes (zoals de Amerikaanse frontier) is bedoeld. De onderliggende tegel-engine (losse tegels, geen naadloos tafereel) blijft ongewijzigd — alleen het palet/de belichting van deze eerste asset-set wijkt af.

- 1 stad-tegel (per grootte-tier: klein/middel = 2 varianten)
- Per bouwmateriaal 1 land-tegel: houtkap, steengroeve, mijn (3 tegels)
- 1 ghost-town-tegel
- 1 fog-of-war-tegel/overlay
- 1 "kritiek"-status-indicator (overlay/icoon)
- Simpele iconen voor de 5 categorieën (voor de keuze-UI)

### Bouw-milestones

De tabel hieronder geeft de huidige stand van de implementatie weer (gecontroleerd tegen de code in `src/`); M0-M14 is de bouwvolgorde waarin de milestones zijn opgepakt, geen open takenlijst — een nieuwe sessie hoeft dus niet bij M0 te beginnen.

| # | Milestone | Omvat | Status |
|---|---|---|---|
| M0 | Project-setup | Next.js + TypeScript scaffolding, canvas-rendering basis, repo-structuur | Klaar |
| M1 | Grid & streek-rendering | 9-tile band, meerdere streken, fog of war, placeholder-tegels tonen | Klaar |
| M2 | Categorie-keuze-UI | Categorie kiezen → alle geldige land improvements binnen die categorie tonen → bouwen starten | Klaar |
| M3 | Resource-economie | 3 materialen + opslag-cap, voedsel, productiewachtrij | Klaar |
| M4 | Uitputting & ghost towns | Land improvements putten uit, worden ghost-town-tiles | Klaar |
| M5 | Cultuur & streek-ontgrendeling | Cultuur verzamelen, nieuwe streek ontgrendelen | Klaar |
| M6 | Groei & verval | Klein→middel groei-tier, waarschuwingssignaal, permadeath-verval (ineenstorting eindigt de run) | Klaar |
| M7 | Militair (basis) | Eenvoudige confrontatie met winkans-formule | Klaar |
| M8 | Tutorial-content | Streken 1-13 met de vastgelegde mechaniek-volgorde en flavor-teksten | Klaar |
| M9 | Save/load | Eén actieve run lokaal opslaan en hervatten | Klaar |
| M10 | Wegen & settler | Settler-eenheid + verplaatsing, wegen aanleggen, bouw-ritme (1 nieuw project per 3 beurten), resource-activatie via wegverbinding, uitleg-pop-up bij beurt 2 (hoofdstuk 16) | Klaar |
| M11 | Kuddes, settler-jacht & beurt-waarschuwing | Wilde kuddes vanaf streek 4, settler-jacht (voedsel) en settler-houtkap (hout) als extra settler-acties, waarschuwing-pop-up bij "Volgende beurt" zolang de settler of de bouwkeuze nog iets te doen heeft (hoofdstuk 11/17) | Klaar |
| M12 | Stad stichten | Vers-water-vakje (uitsluitend op de laatste streek — de oceaan aan de overkant, de enige plek in de hele tutorial met vers water), Opslagplaats-improvement, doorgerekende stichtingskosten, settler-in-de-civiele-pool (max 1 per gestichte stad), stichtingsbevestiging + afsluitende tutorial-scène als nieuw einddoel (hoofdstuk 2/3/10/11/14/16) | Klaar |
| M13 | Technologie-boom & Sterrencirkel | Sterrencirkel-improvement (wetenschap, put niet uit), vertakkende 3-drempel technologie-boom met permanente effecten, tech-keuze-pop-up, doorgerekende drempelkosten (hoofdstuk 3/4/6/9/11/13/14) | Klaar |
| M14 | Bezette Streek, Missionaris & Verkenner | Generiek Bezette-Streek-mechanisme (per-tegel verhulling, tutorial-scripting op streek 12 met precies 1 vijandelijke Wachttoren + 1 vijandelijk Heiligdom), Verkenner trainbaar + Verkenning-actie, Offer Altaar + Missionaris trainbaar + belegeringsmeter tegen vijandelijke Heiligdommen, Legerkamp + herziene Confrontatie (harde eigen-Wachttoren-eis, verlies kost alleen de bemannende strijder) tegen vijandelijke Wachttorens, streek ontgrendelt pas als zowel Wachttoren als Heiligdom vernietigd zijn — vervangt de eerdere "Militair (basis)"-placeholder op streek 12 volledig (hoofdstuk 3/6/10/11/14) | Klaar |
| M15 | City-improvement-capaciteit & infrastructuur-gating | City-improvement-cap per stadsgrootte (klein 1/middel 3/groot 5, vervangt het niet-gebouwde relic-slot-concept uit hoofdstuk 4), Grote Woonwijk (tweede groei-tier), Bibliotheek/Markt/Barakken/Tempel/Grote Tempel als nieuwe gecapte city improvements, Legerkamp/Offer Altaar geblokkeerd tot een forse Wachttoren/Heiligdom-infrastructuur-eis + de bijbehorende city improvement (Barakken/Grote Tempel) vervuld is, met zichtbare voortgangsindicatie in de bouw-UI (hoofdstuk 3/4/6/11/14, issue: "city improvements") | Klaar |
| M16 | Meerdere-steden-fundering | `GameState.steden: City[]` als brontabel van alle gestichte steden van deze run (`GameState.stad` blijft de actieve/laatst-gestichte stad, `steden[steden.length - 1]`, bijgewerkt via de nieuwe `metActieveStad`-helper in `stad.ts` zodat de bestaande MVP-code ongewijzigd blijft werken), `City.streekHoogte` + een pure `frontierAfstand()`-functie als basis voor de afstand tot de frontier (hoofdstuk 9/14), save-migratie voor oudere saves zonder deze velden — nog geen effectiviteitsverval (M17) en nog geen worldgen/`stichtStad`-herschrijving voor een tweede stad (M18): puur de datamodel-fundering (hoofdstuk 9/13, issue: "Eerste bouwsteen van de Amerikaanse frontier-campagne") | Klaar |
| M17 | Afstandsverval van city improvements | `cityImprovementEffectiviteit()`/`stadVervalZone()`/`stadEffectiviteit()` (`stad.ts`): de vier afstandszones (100/65/30/0%, hoofdstuk 9/14) toegepast op de doorlopende productie van Bibliotheek/Markt/Barakken/Tempel/Grote Tempel (`productie.ts`), plus een waarschuwingsregel in StadsverbeteringenPaneel zodra een stad niet meer op 100% zit. `stadEffectiviteit` geeft altijd 100% terug zolang een run nog nooit meer dan 1 stad heeft gehad (hoofdstuk 11: de oude "geen inkomsten van achtergelaten steden"-regel gold nooit zonder een tweede, achtergelaten stad) — de tutorial (altijd precies 1 stad) blijft dus exact ongewijzigd; het verval wordt pas voelbaar zodra het herhalende stichtingspatroon (Deel 2, M18) een speler ooit een tweede stad laat stichten | Klaar |
| M18 | Herhalend stichtingspatroon (Deel 2, mechanisme) | `stichtStad` (acties.ts) voegt bij een stichting een echte nieuwe `City` toe aan `steden` in plaats van de bestaande stad te vervangen, en maakt haar de actieve stad; `stadGesticht` (en daarmee het einde van de run) wordt alleen nog gezet bij de allerlaatste streek van de wereld — elke andere stichting laat de run doorlopen (hoofdstuk 9 Deel 2). Nieuwe pure `gegarandeerdeStichtingskansHoogten()` (`stad.ts`) legt de drie kans-hoogten per zone vast (+3/+8/+13 t.o.v. de streekHoogte van de stichtende stad). Settler-pool-regel ("max 1 settler per gestichte stad") werkte al op `state.steden.length` sinds M16 en loopt hier vanzelf in mee. **Nog niet gedaan/nog niet mogelijk in de tutorial**: deze functie is nog niet aan een daadwerkelijke campagnekaart gekoppeld — de tutorial-wereld is vast en precies 14 streken lang met precies één vers-water-vakje (op de laatste streek), dus het patroon kan daar per definitie nooit meer dan die ene, afsluitende stichting laten zien. Om het patroon echt speelbaar te maken is een eigen, langere, vaste Amerikaanse-campagne-wereld nodig (zie hoofdstuk 15, voorgestelde M20a/b/c) | Klaar (mechanisme); wereld-integratie volgt in M20b/c |
| M19 | Bezette Streek — klikbare kaart i.p.v. stadsscherm | Herziening van M14 (issue: "Bezette streek scherm"): Verkenner-rekrutering vervangen door een direct-op-de-kaart-actie (`stuurVerkenner`, `Tile.verkenningInGang` telt af i.p.v. instant onthullen), Missionaris-toewijzing per specifiek vijandelijk Heiligdom met een eigen wololo-meter per Heiligdom (`Missionaris.doelHeiligdom`, `Tile.wololoVoortgang`) die het Heiligdom verovert i.p.v. vernietigt, Confrontatie-eis verplaatst van een eigen Wachttoren naar een eigen Legerkamp op de streek direct onder de Bezette Streek (`heeftWerkendeLegerkampOpStreek`), en alle drie acties verplaatst van het BezetteStreekPaneel-in-het-stadsmenu naar een klik op de betreffende tile zelf (`TileInfoPopup`: `verkenningVraag`/`confrontatieVraag`/`missionarisVraag`) met een compact statusbalkje op de kaart zelf (hoofdstuk 6/11) | Klaar |
| M20a | Going West — `CampaignConfig` & weergavenamen | Een echte `CampaignConfig`-instantie voor de Amerikaanse frontier-campagne (`GOING_WEST_CAMPAGNE`, `src/game/campagnes.ts`: id/naam/tegelSet/campagne-specifieke multipliers, hoofdstuk 8), de weergavenamen-tabel uit hoofdstuk 9 volledig ingevuld (`improvementNamen`, types.ts — de tabel in hoofdstuk 9 bevat geen aparte tech-namen, dus `techNamen` blijft leeg). `beschikbaar: true` in `CampagneSelectScherm.tsx` volgt pas met M20b zodra er een speelbare kaart achter zit — nog geen worldgen-wijziging, dit was de kleinste, niet-architectuur-rakende stap (issue #247) | Klaar |
| M20b | Going West — vaste campagnekaart | Een eigen, volledig handgeschreven campagnekaart voor de Amerikaanse frontier-campagne (`maakInitieleWereldGoingWest()`, `src/game/worldGoingWest.ts` — een eigen bestand, niet in `world.ts` zelf, zodat de tutorial-tabellen ongewijzigd blijven), zelfde patroon als de tutorial (`Record<hoogte, ...>`-tabellen voor terreintype/subtype/vers-water/amberader/dreigingsniveau). Lengte: 35 streken, binnen de "Normaal"-range (30-40, hoofdstuk 14); moeilijkheidsgraad-varianten (eigen kaarten voor Makkelijk/Moeilijk) volgen als latere uitbreiding, geen harde M20b-eis. **Besloten (issue #247, hoofdstuk 8/11)**: vervangt het eerder voorgestelde plan voor seeded-RNG/procedurele streek-generatie — te veel nieuwe, ongeteste architectuur bovenop een tutorial-patroon dat al bewezen werkt. **Nog niet gedaan**: koppeling aan het daadwerkelijk starten van een run (`CampagneSelectScherm`/`GameState` kiezen deze kaart nog niet — "Going West" blijft "Binnenkort beschikbaar" tonen) — de vers-water-dichtheid is inmiddels geverifieerd tegen `gegarandeerdeStichtingskansHoogten()` in M20c | Klaar (kaartdata); daadwerkelijk starten van een run volgt in een nog voor te stellen vervolg-milestone |
| M20c | `gegarandeerdeStichtingskansHoogten()` koppelen aan de vaste kaart | Nieuwe, generieke `vindStichtingskansGaten()` (`stad.ts`) toetst voor elke hoogte waarop daadwerkelijk gesticht kán worden (de starthoogte plus elke vers-water-hoogte op de kaart) of alle drie de kans-vensters uit `gegarandeerdeStichtingskansHoogten()` (M18: (hoogte,+4]/(+4,+12]/(+12,einde-kaart], samen de vier afstandszones overspannend) een vers-water-treffer hebben, met een venster dat al voorbij het einde van de kaart valt overgeslagen (de run is dan al voorbij, M18). Toegepast op de M20b-kaart (nieuwe test in `worldGoingWest.test.ts`): **geen gaten gevonden** — de bestaande dichtheid (interval ≤ 4 streken, hoofdstuk 13 M20b) voldeed al aan de garantie, dus de kaartdata zelf hoefde niet aangepast te worden. Een vaste kaart kan de exacte, pas tijdens het spelen bekende stichtingshoogte niet vooraf raden (anders dan bij procedurele generatie, waar je ná de stichting op de berekende hoogte kunt plaatsen); de garantie wordt daarom via dichtheid van vooraf geplaatste vakjes gehaald in plaats van exacte, dynamische plaatsing. Het herhalende drie-stichtingsmomenten-patroon (hoofdstuk 9 Deel 2) is hiermee inhoudelijk/mechanisch dekkend voor de hele kaart. **Nog niet gedaan**: de koppeling van deze kaart aan het daadwerkelijk starten/spelen van een run (`CampagneSelectScherm` toont "Going West" nog als "Binnenkort beschikbaar"; `GameRoot`/`useGameEngine`/save.ts zijn nog niet campagne-bewust) — dat raakt de spel-opstart-architectuur breder dan deze kaart-milestone en hoort eerst als eigen milestone voorgesteld te worden (CLAUDE.md, hoofdstuk 15) | Klaar |
| M20d | Going West — run-integratie (spel-opstart-architectuur) | De in M20c aangekondigde vervolg-milestone (issue: "M20d voorstel"), in deelstappen opgepakt: `GameState.campagneId` + `campagneConfig()`-lookup (`campagnes.ts`) en een campagne-parameter op `maakInitieleSpelStatus()` die bij `"going-west"` `maakInitieleWereldGoingWest()` gebruikt in plaats van de tutorial-wereld; een eigen `saveSleutel()` per campagne (`save.ts`, i.p.v. één gedeeld tutorial-slot — voorkomt dat een Going West-run een lopende tutorial-save overschrijft of omgekeerd); de campagnekeuze-doorgifte `CampagneSelectScherm` (`onKiesCampagne`) → `AppRoot` → `GameRoot` → `useGameEngine`; en een placeholder-tegelset-tint per campagne (`pasTegelSetTint()`, `src/render/tegelSets.ts`) — `CampaignConfig.tegelSet` (hoofdstuk 12) wordt hiermee voor het eerst daadwerkelijk door de renderer gelezen. **Nog niet gedaan**: Going West op `beschikbaar: true` zetten in `CampagneSelectScherm.tsx` — bij het narekenen daarvan bleken drie resterende blockers (streek-flavor-content niet campagne-bewust, een hard-coded tutorial-streek-aantal, en een streek-popup-softlock voorbij streek 14), zie hoofdstuk 19 | Klaar (spel-opstart-architectuur); Going West blijft "Binnenkort beschikbaar" tot de blockers in hoofdstuk 19 zijn opgepakt |
| M20e | Going West — blockers 2 en 3 (hoofdstuk 19) opgelost | De twee zuiver technische blockers uit hoofdstuk 19 (geen contentkeuzes) opgepakt: `toonStreekPopup` (`GameRoot.tsx`) vereist nu ook dat `streekContent()` daadwerkelijk content teruggeeft voor de huidige streek, niet alleen dat de streek nog onbevestigd is — lost de softlock voorbij streek 14 op voor elke campagnekaart, ongeacht content (blocker 3); de oceaan-uitleg-pop-up-trigger gebruikt nu `state.streken.length` (de lengte van de actieve campagnekaart, zelfde bron als `isAfsluitendeStichting` in `acties.ts`) in plaats van de tutorial-constante `TUTORIAL_STREEK_AANTAL` (blocker 2). Terzijde meegenomen: het "voltooid"-vinkje in `CampagneSelectScherm.tsx` verschijnt nu uitsluitend bij de tutorial-entry zelf (`campagne.id === undefined`) i.p.v. bij elke beschikbare campagne, zoals gesignaleerd in hoofdstuk 19's "Samenhang"-paragraaf — ook zuiver technisch, geen content. **Nog niet gedaan**: blocker 1 (Going West-eigen streek-flavor-/intro-/voltooid-content) en de rest van de "Samenhang"-paragraaf (een eigen Going West-"voltooid"-signaal per stichting i.p.v. het tutorial-scherm) — dat is de eigenlijke inhoudelijke schrijftaak die nog los voorgesteld moet worden, zie hoofdstuk 19 | Klaar |
| M20f | Going West — placeholder-streek-content & stichtingsmoment-pop-up (issue #278, blocker 1 deel 1) | Eerste, bewust minimale invulling van blocker 1: een eigen, van de tutorial losstaand content-bestand (`src/game/goingWestContent.ts`) geeft alle 35 Going West-streken een `StreekContent`-entry — `naam` hergebruikt het al bestaande terreintype per streek (`worldGoingWest.ts`: `terreinTypeVoorStreek`, nu geëxporteerd), `mechaniek`/`flavorTekst` zijn overal `"todo"` (issue #278, antwoord op vraag 1 — later gaandeweg aan te vullen). Een nieuwe campagne-bewuste dispatcher `streekContentVoorCampagne()` (`campagnes.ts`) vervangt de rechtstreekse `tutorialContent.streekContent()`-aanroepen in `GameRoot.tsx`/`StreekPopup.tsx`/`StreekIntroPaneel.tsx` (`campagneId` erbij als prop) — zonder deze stap zou blocker 3 (M20e) zich herhalen zodra `toonStreekPopup` wél content vindt maar `StreekPopup` zelf nog alleen tutorial-content kent. `StreekIntroPaneel`'s eigen, tot dusver onopgemerkte kopie van blocker 2 (`isLaatsteStreek` tegen de hard-coded `TUTORIAL_STREEK_AANTAL` i.p.v. `streken.length`) is in dezelfde stap meegefixt, en de tutorial-specifieke afsluitende-scène-tekst daar is nu tot de tutorial beperkt (`campagneId === undefined`). Nieuw: een eigen Going West-"stichtingsmoment"-pop-up (`StichtingsMomentPopup.tsx`, placeholder-plaatje `public/assets/scenes/going-west-stichting.svg` in het donkere/stoffige Fallout/Diablo II-palet van hoofdstuk 12) die bij élke stichting binnen het herhalende drie-stichtingsmomenten-patroon verschijnt (hoofdstuk 9 Deel 2) — niet alleen de allerlaatste — en anders dan `TutorialVoltooidPopup` de run niet beëindigt (issue #278, antwoord op vraag 2: "het verschil met de tutorial is dat het spel niet eindigt dan"); getriggerd zodra `state.steden.length` boven een lokaal bijgehouden teller uitkomt. `toonTutorialVoltooidPopup` is nu expliciet tot de tutorial beperkt (`state.campagneId === undefined`) — zonder die eis zou een Going West-run bij de allerlaatste, afsluitende stichting alsnog het tutorial-specifieke voltooid-scherm te zien krijgen, want `stadGesticht` zelf blijft campagne-agnostisch gezet (`acties.ts`). **Nog niet gedaan**: echte flavor-tekst per streek (blijft "todo" tot de speler die zelf aanvult), de drie Anker-verhalen (issue #278, vraag 3, bewust nog open) en de oceaan-uitleg-pop-up-tekst zelf (nog steeds tutorial-gekleurd, "sinds Oer-stad") — Going West blijft daarom nog op `beschikbaar: false` staan | Klaar (placeholder-content); vraag 3 en `beschikbaar: true` volgen in een latere sessie |

Elke milestone is bewust klein genoeg om als losse Claude Code-taak opgepakt te worden.

---

## 14. Aanvullende uitwerkingen

**Concrete balanscijfers (startpunt, te testen/tunen tijdens ontwikkeling)**

*Continent-lengte (streken oceaan-tot-oceaan), per moeilijkheidsgraad:*

| Moeilijkheid | Lengte |
|---|---|
| Makkelijk | 20-25 streken |
| Normaal | 30-40 streken |
| Moeilijk | 45-60 streken |

Voor elke moeilijkheidsgraad wordt één vaste, handgeschreven campagnekaart met een lengte binnen deze range gemaakt (zelfde patroon als de tutorial, hoofdstuk 8/11/13) — geen random trekking; een bergengte/obstakel-zone wordt daarbij ergens tussen 40-70% van de lengte ingetekend.

*Uitputtingssnelheid (beurten tot volledig uitgeput):*

| Type | Gewoon | Rijk | Legendarisch |
|---|---|---|---|
| Mijn (erts) | 6 | 5-8 | 20-25 (+ oogstvenster) |
| Boerderij (voedsel) | 15-20 | 10-14 | 30-35 |
| Houtkap (hout) | 12-16 (nooit volledig 0, wel afnemend) | 8-11 | 25-30 |
| Steengroeve (steen) | 10-14 | 7-10 | 22-27 |
| Amberader/goudmijn (goud, issue: "toevoeging Goud") | 10-14 | 6-10 | 22-28 (+ oogstvenster, zoals bij andere legendarische vondsten — hoofdstuk 7) |

De rijk/legendarisch-kolommen hierboven blijven, net als bij de andere mijn/boerderij/houtkap/steengroeve-rijen, een MVP-placeholder voor de zeldzaamheid-uitwerking (hoofdstuk 7/13: nog niet geïmplementeerd) — de huidige code kent alleen de "gewoon"-waarde toe. Voor Houtkap (14), Steengroeve (10), Boerderij (18) en Amberader/goudmijn (12, het midden van de 10-14-range) valt die waarde binnen de tabel hierboven. **Correctie op eerdere beschrijving**: Mijn week hier eerder van af — de code gebruikt `uitputtingBeurten: 6` (`src/game/improvements.ts`), sneller dan de eerder gedocumenteerde 8-12-range en zelfs onder de Rijk-placeholder (5-8). De "Gewoon"-waarde hierboven is bijgewerkt naar 6; de Rijk/Legendarisch-kolommen voor Mijn zijn nog niet opnieuw doorgerekend tegen die snellere basiswaarde, wat pas relevant wordt zodra de zeldzaamheid-uitwerking zelf wordt gebouwd.

*Cultuurkosten*: `kosten(streek) = 3 + 5 × (streek − 1)²` — kwadratisch, cumulatieve drempel (cultuur wordt nooit "uitgegeven", zie hoofdstuk 5). Vervangt de eerdere exponentiële formule (basis 20, ×1,4 per streek); zie hoofdstuk 11 ("Kwadratisch in plaats van exponentieel cultuurkosten") voor de onderbouwing. De basisterm is sindsdien verder verlaagd van 15 naar 3 (issue: "de eerste cultuurdrempel is te hoog"; hoofdstuk 11, "Basisterm van de cultuurkosten verlaagd") — de kwadratische factor (5) is ongewijzigd, dus de curve vanaf ruwweg streek 6-8 verandert nauwelijks, terwijl streek 2-5 fors goedkoper worden. Culturele pushback-streken: ×2 van het normale (dan al kwadratisch opgelopen) bedrag.

| Streek | Cultuurkosten (cumulatief) |
|---|---|
| 2 | 8 |
| 3 | 23 |
| 4 | 48 |
| 5 | 83 |
| 6 | 128 |
| 12 | 608 |
| 20 | 1.808 |
| 30 | 4.208 |
| 40 | 7.608 |

*Cultuurinkomen*: de enige cultuurbron in de MVP is het **Heiligdom** (hoofdstuk 3/6) — 2 cultuur/beurt op de frontier-streek zelf, 1 cultuur/beurt (halve opbrengst) op elke streek daaronder; hij put niet uit en blijft dus permanent actief. Tempel/amfitheater/monument en de passieve cultuur van ghost towns (hoofdstuk 7) zijn nog niet geïmplementeerd — buiten de huidige MVP-scope (hoofdstuk 13). Bij een gemiddelde build (niet puur cultuur, niet nul — indicatief: ruwweg 1 Heiligdom per 4 ontgrendelde streken, waarvan steeds het nieuwste op de frontier-streek staat) geeft dat ruwweg:

| Streek | Heiligdommen (indicatief) | Cultuur/beurt (indicatief) | Beurten voor déze streek (marginale kosten ÷ inkomen) |
|---|---|---|---|
| 5 | 1 | ~2 | ~18 |
| 12 | 3 | ~4 | ~26 |
| 25 | 6 | ~7 | ~34 |
| 40 | 10 | ~11 | ~35 |

Het aantal beurten per streek loopt zo geleidelijk op (ruwweg 2× van vroeg- naar laat-spel) in plaats van naar het twintig- of honderdvoudige zoals bij de oude exponentiële formule.

*Vroege-spel-doorrekening (issue: "de eerste cultuurdrempel is te hoog")*: de tabel hierboven gaat uit van een gemiddelde build over een hele run; voor de allereerste streek-ontgrendeling is de vraag niet "wat is het gemiddelde inkomen", maar "wanneer staat het eerste Heiligdom er, en hoeveel beurten kost de drempel dáárna nog". Een doorgerekende, near-optimale openingszet — Houtkap eerst (de enige houtbron, en steen is bij de start toevallig precies genoeg voor de Houtkap), dan een Boerderij tegen de voedselwaarschuwing (het startvoedsel van 14 is expliciet hierop afgestemd, zie economie.ts), dan een Steengroeve (nodig omdat de startvoorraad steen volledig opgaat aan de Houtkap, en het Heiligdom zelf ook steen kost), en pas dán het eerste Heiligdom — laat zien dat deze volgorde vrijwel afgedwongen wordt door de grondstofketen zelf: een Heiligdom kost zowel hout als steen, en zonder Steengroeve blijft de steenvoorraad op 0 staan. Door het bouw-ritme (hoofdstuk 16: 1 nieuw project per 3 beurten) en de settler-reistijd voor elke wegverbinding (elke land improvement produceert pas met een eigen wegverbinding, hoofdstuk 16) komt het eerste Heiligdom pas rond **beurt 13** daadwerkelijk actief, ruim vóórdat enige cultuurdrempel een rol speelt. Vanaf dat punt loopt de cultuur met 2/beurt op (één Heiligdom op de frontier-streek):

| Streek | Cultuurkosten (nieuw) | Beurt bereikt (indicatief) | Beurt bereikt met oude formule (indicatief) |
|---|---|---|---|
| 2 | 8 | ~16 | ~22 |
| 3 | 23 | ~24 | ~30 |
| 4 | 48 | ~36 | ~42 |

Twee dingen volgen hieruit. Eén: de trage start heeft inderdaad **deels een andere oorzaak** dan de kostenformule (issue-punt 4) — de ~13 beurten tot het eerste Heiligdom zijn een gevolg van de grondstofketen, het bouw-ritme en de wegaanleg, niet van de cultuurdrempel, en geen enkele drempelverlaging brengt streek 2 onder die ~13 beurten. Dat is precies waarom de basisterm hierboven is verlaagd in plaats van op nul gezet: verder verlagen zou de drempel zelf triviaal maken zonder dat eerste, onvermijdelijke wachten te verkorten. Twee: bóven die vloer van ~13 beurten scheelt de nieuwe formule wel degelijk fors — streek 2 valt van ~22 naar ~16 beurten, dus van ~9 naar ~3 beurten ná het eerste Heiligdom, ruim binnen een handvol beurten zoals de issue vraagt.

**Technologie-boom & Sterrencirkel (hoofdstuk 3/9/11/13, issue: "tech tree toevoegen")**

*Sterrencirkel*: **6 hout, 2 steen**, bouwtijd **2 beurten** — vergelijkbaar bouwprofiel als het Heiligdom (4 hout, 4 steen, 2 beurten, hoofdstuk 3), maar verschoven naar "vooral hout, een beetje steen" zoals gevraagd; hetzelfde totaal (8) en dezelfde bouwtijd, alleen de verhouding wijkt af. Opbrengst **2 wetenschap/beurt**, exact hetzelfde patroon als het Heiligdom voor cultuur (hoofdstuk 6): geen uitputting, volle opbrengst op de frontier-streek, de helft daaronder.

*Drempelkosten*: `kosten(drempel) = 20 + 20 × (drempel-1)²` — drempel 1 = 20, drempel 2 = 40, drempel 3 = 100. Afgeweken van het voorstel in het issue (`8 + 5 × (drempel-1)²`, drempel 1/2/3 = 8/13/28): bij een near-optimale opening levert dat voorstel een curve op die de cultuurcurve (hieronder) nauwelijks trager haalt — met een basisterm en kwadratische factor die allebei maar net boven cultuur (3 en 5) uitkomen, groeit het verschil tussen de twee curves te langzaam om "merkbaar" te blijven voorbij de eerste drempel (zie de doorrekening hieronder). Zowel de basisterm als de kwadratische factor waren daarom naar **10** gezet, en zijn sindsdien verder verdubbeld naar **20** (zie de correctie hieronder, issue: "techtree langzamer").

| Drempel | Wetenschapskosten (cumulatief) |
|---|---|
| 1 | 20 |
| 2 | 40 |
| 3 | 100 |

**Correctie (issue: "techtree langzamer")**: de oorspronkelijke curve hierboven (basis en kwadratische factor **10**, drempel 1/2/3 = 10/20/50) voltooide de hele boom rond beurt 42 (zie de doorrekening hieronder) — ruim vóórdat de Bezette Streek (streek 12, hoofdstuk 6) gemiddeld in beeld komt. Wetenschap stapelde zich daarna grotendeels ongebruikt op, dus Verkenning (`VERKENNING_KOSTEN_WETENSCHAP`, hoofdstuk 6, dezelfde wetenschap-pool) concurreerde in de praktijk nauwelijks met een openstaande techkeuze. Basis en kwadratische factor zijn daarom verdubbeld naar **20**, met de doorrekening hieronder bijgewerkt.

*Doorrekening tegen de Sterrencirkel-opbrengst*: met dezelfde near-optimale opening als de cultuur-doorrekening hierboven (Houtkap → Boerderij → Steengroeve → Heiligdom, actief rond beurt 10-13) is het bouw-ritme (hoofdstuk 16: 1 nieuw project per 3 beurten) na het Heiligdom vrij voor een Sterrencirkel — met dezelfde bouwtijd en wegaanleg-tijd als het Heiligdom komt die rond **beurt 17** actief. Vanaf dan loopt wetenschap met 2/beurt op (één Sterrencirkel op de frontier):

| Drempel | Wetenschapskosten | Beurt bereikt (indicatief) | Vergelijkbare cultuurstreek | Beurt bereikt (cultuur, indicatief) |
|---|---|---|---|---|
| 1 | 20 | ~27 | streek 3 (23) | ~24 |
| 2 | 40 | ~37 | streek 4 (48) | ~36 |
| 3 | 100 | ~67 | streek 5-6 (83-128) | ~48-60 (indicatief) |

Het verschil met de vergelijkbare cultuurstreek loopt op van ~3 naar ~10+ beurten — een oplopend, dus **merkbaar** tempoverschil, en nu een stuk forser dan de eerdere 3-tot-9-beurten-marge. Belangrijker voor de gevraagde concurrentie met Verkenning: drempel 3 (~beurt 67) valt nu ruim ná het moment waarop de Bezette Streek gemiddeld in beeld komt (streek 12, rond beurt 26 bij een gemiddelde build, zie de cultuurinkomen-tabel hierboven) — een speler die de Bezette Streek bereikt vóórdat de techboom voltooid is, moet dus daadwerkelijk kiezen tussen wetenschap sparen voor de volgende drempel en wetenschap uitgeven aan Verkenning, in plaats van dat de boom allang klaar is en de wetenschap-pool vrijwel uitsluitend voor Verkenning overblijft. Drempel 3 blijft desondanks ruim vóór het einde van de 12 tutorial-streken haalbaar (de cultuurkosten lopen daar al op tot 400-600, zie de cultuurkosten-tabel hierboven). Het zwaardere tempo is bewust: wetenschap levert permanente, structurele bonussen op (een boerderij die voorgoed 20% meer opbrengt, een opslag-cap die voorgoed +10 is) in plaats van eenmalige toegang tot een streek — zie hoofdstuk 11 voor de volledige onderbouwing.

> ⚠️ **Nog te implementeren — let op**: de tech **"vlotten"** (B1a) belooft dat de settler rivier-vakjes kan oversteken, maar heeft in de huidige MVP-code **geen enkel waarneembaar effect**: er bestaat nog geen enkele vorm van bewegingsbeperking bij water (`versWater` op een tile is uitsluitend een stichtings-geschiktheids-vlag, geen doorgangs-blokkade — zie `world.ts`/`wegen.ts`), dus er is niets om op te heffen. De functie `settlerKanRivierOversteken` (`src/game/techTree.ts`) bestaat al en staat klaar, maar wordt nergens aangeroepen. Dit moet alsnog gebouwd worden zodra een water-doorgangsregel wordt toegevoegd — tot die tijd is de keuze voor "vlotten" in de technologie-boom cosmetisch.
>
> Ter vergelijking: **"wiel"** (B1) is wél functioneel gewired (`settlerWegaanlegGratis`, gebruikt in `economie.ts`) — wegaanleg kost de settler daarmee geen aparte actie meer — maar dat is een bewust gekozen interpretatie ("dichtstbijzijnde zinvolle interpretatie" van "sneller wegen aanleggen", zie de code-comments in `techTree.ts`), geen letterlijke snelheids-verhoging. Dit is geen open werkpunt zoals "vlotten", maar wel het vermelden waard als de daadwerkelijke tech-tekst ooit herzien wordt.

*Opslag-cap (issue: "stad stichten op de frontier" deel 3, doorgerekend tegen de code)*: start op 30, elke Opslagplaats-improvement +20, praktisch maximum ~3-4 opslagplaatsen per stad (~110 totaal). **Correctie op eerdere beschrijving**: dit is in de daadwerkelijke implementatie een cap **per grondstof** (hout/steen/erts/goud elk apart tot 30, niet hun gezamenlijke som) — anders dan "gedeelde opslag" in hoofdstuk 5 en eerdere versies van dit hoofdstuk suggereren. De opslagplaats-waarde (`OPSLAGPLAATS.kosten`, hoofdstuk 3) is **8 hout, 6 steen**, bouwtijd **3 beurten**; het effect (+20 opslag-cap) geldt voor alle vier grondstoffen tegelijk. Deze architectuur is bewust ongewijzigd gelaten bij het doorrekenen van de stichtingskosten hieronder (een refactor naar een echt gedeelde cap is een aparte, grotere wijziging) — in plaats daarvan zijn de stichtingskosten erop afgestemd.

*Stichtingskosten (hoofdstuk 2/10/14, issue: "stad stichten op de frontier" deel 3)*: **10 hout, 4 steen, 3 erts, 8 voedsel**. Oorspronkelijk vastgesteld op 40 hout, 15 steen, 10 erts, 30 voedsel (zie git-historie voor de volledige doorrekening tegen de per-grondstof opslag-cap uit die tijd) — **issue #187 ("stad stichten veel goedkoper")** heeft alle vier bedragen daarna 4x zo goedkoop gemaakt (gedeeld door 4, afgerond). Gevolg: het stichten forceert niet langer een Opslagplaats vóór streek 13 (10 hout blijft ruim onder de start-cap van 30) — dat was met de oorspronkelijke bedragen wel bewust het geval, maar de expliciete kostenverlaging weegt hier zwaarder.

*Nieuwe settler (hoofdstuk 3/11/16)*: kosten **10 hout, 4 steen**, bouwtijd **4 beurten** — vergelijkbaar met Woonwijk (6 hout, 4 steen, 4 beurten), de improvement waarmee hij in dezelfde civiele wachtrij concurreert.

*Groei-tier kosten (voedsel)*: **correctie op eerdere beschrijving** — de huidige code gebruikt klein→middel = **40 voedsel** (`VOEDSEL_DREMPEL_GROEI`, `src/game/world.ts`) + **4 beurten** bouwtijd (Woonwijk-improvement, `src/game/improvements.ts`), lager dan de eerder hier genoemde 100 voedsel/5 beurten. Dit is in de huidige MVP-scope (hoofdstuk 13: één groei-tier-stap) ook de enige geïmplementeerde stap; middel→groot bestaat nog niet in de code — er is geen aparte formule of kostenwaarde voor deze tier vastgelegd.

*Voedselverbruik & verval-drempel*: een kleine stad verbruikt 2 voedsel/beurt, middel 4, groot 6 — tegenover de productie van actieve, wegverbonden boerderijen. De "kritiek"-waarschuwing verschijnt zodra de voorraad bij het huidige netto-tempo naar verwachting binnen 5 beurten op zou raken; bij daadwerkelijk 0 voedsel stort de stad in (hoofdstuk 4).

*Wachttoren-bemanning (hoofdstuk 6/11, issue: "wachttorens, bemanning en bevoorrading")*: elke bemande Wachttoren kost **1 voedsel/beurt**, bovenop het stadsverbruik hierboven. Doorgerekend tegen de boerderij-opbrengst (4 voedsel/beurt, uitputting pas na 15-20 beurten): een kleine stad met 1 actieve boerderij houdt na het eigen verbruik (2) nog 2 voedsel/beurt over — genoeg voor 2 bemande wachttorens zonder in de min te komen; met 2 boerderijen (8) is dat 6 over, genoeg voor 6. Een middelgrote stad (verbruik 4) heeft met 2 boerderijen (8) een marge van 4 wachttorens, met 3 (12) een marge van 8. Omdat elke tutorial-streek minstens 2 (en meestal 3-6) vlakke vakjes heeft (vaste terrein-indeling per streek, zie hoofdstuk 11 "Terrein-eisen per land improvement"), is een boerderij zelden het knelpunt, en groeit het aantal boerderijen dat een speler gaandeweg de 12 tutorial-streken bouwt doorgaans mee met het aantal wachttorens dat nodig is om ze te verdedigen. Bij een typische build (2-4 boerderijen tegen de tijd dat er meerdere wachttorens staan) blijft 1 voedsel/beurt per toren dus ruim binnen de marge — geen aanpassing elders in de voedseleconomie nodig (zie hoofdstuk 11 voor de volledige onderbouwing).

*Winkans-formule militaire confrontaties*:
> Winkans = eigen legerwaarde / (eigen legerwaarde + vijand legerwaarde), geclampt tussen **5% en 95%** (`WINKANS_MIN`/`WINKANS_MAX`, `src/game/economie.ts`).
>
> **Correctie op eerdere beschrijving**: dit document noemde eerder een clamp van 10%-90%; de daadwerkelijke implementatie clampt ruimer, op 5%-95%.

*Indringers & tribuut (hoofdstuk 6)*: kans op een indringers-incident (één trekking voor de hele stad, niet per streek) = 20% per beurt (MVP-richtwaarde, tunebaar; verlaagd vanaf de eerdere 40% op alleen de frontier-streek), getrokken over alle ontgrendelde streken samen — geen aanwezigheids-eis meer, en pas een factor vanaf streek 2 (verlaagd vanaf streek 3) — de eerste streek blijft zo een rustige introductie. Tribuut zonder beschermende (voltooide, bemande én wegverbonden) wachttoren op de getroffen streek = ongeveer de helft (afgerond, minimaal 1) van het grondstof-type waar de speler op dat moment het meest van heeft, nooit meer dan de aanwezige voorraad. Een streek met een actieve Amberader (issue: "Amberader: bonus/malus-koppeling", hoofdstuk 6/11) weegt in die streek-trekking **2× zo zwaar** als een gewone streek (`AMBERADER_INDRINGERS_GEWICHT`, `src/game/economie.ts`) — MVP-richtwaarde, tunebaar.

*Derde uitkomst voor een beschermde streek (hoofdstuk 6/11, issue: "wachttorens kunnen vernietigd worden door indringers")*: bij een incident op een beschermde streek (frontier of niet) — **standhouden 85%** (`INDRINGERS_STANDHOUDEN_KANS`), **malus (Wachttoren-ruïne + verloren strijder) 10%** (`INDRINGERS_MALUS_KANS`), **bonus (buit) 5%** (het restant van de kansruimte) — allemaal MVP-richtwaarden, tunebaar, met behoud van de volgorde standhouden ♦ malus ♦ bonus van vaakst naar zeldzaamst. Buit-bedrag bij de bonus-uitkomst = **6 goud** (`INDRINGERS_BUIT_GOUD`, `src/game/economie.ts`) — MVP-richtwaarde, tunebaar, direct aan de gedeelde opslag toegevoegd (binnen de opslag-cap).

*Kuddes (hoofdstuk 17, issue: "kudde frequentie verlagen")*: kans op een nieuwe wilde kudde per beurt, zodra streek 4 of hoger ontgrendeld is = **5%** (MVP-richtwaarde, tunebaar; `A2a. Veeteelt` vermenigvuldigt dit met 1,5×, hoofdstuk 3/9) — verlaagd vanaf de eerdere 15%. Een kudde kent geen eigen verval: alleen volledig leegjagen (4 jachtbeurten) of overbouwen verwijdert er een, dus het aantal tegelijk aanwezige kuddes is in de praktijk de kans vermenigvuldigd met hoe lang een kudde gemiddeld blijft staan, niet alleen de kans zelf. Bij 15%/beurt en een speler die niet elke kudde meteen kan leegjagen (settler-reistijd tussen streken, concurrerende settler-acties zoals wegen aanleggen) liep dat gemiddelde aantal in de praktijk op tot ruim boven de bedoelde 1-2 tegelijk; bij 5%/beurt daalt dat evenredig naar het beoogde tempo — een speler die actief jaagt houdt zo doorgaans 1, hooguit 2 kuddes tegelijk op de ontgrendelde streken. Voedselaanvulling via jagen blijft daarmee overeind (elke individuele kudde levert nog steeds 4×3 = 12 voedsel over de gebruikelijke jachtbeurten, hoofdstuk 17) — alleen het aánbod aan kuddes wordt schaarser, niet de opbrengst per kudde. Minder kuddes betekent ook minder jachtmomenten en dus minder kans op een roofdier-encounter (hieronder); dat is een geaccepteerd neveneffect van deze frequentie-tweak, geen reden om de roofdier-kans zelf aan te passen.

*Roofdieren (hoofdstuk 17, issue: "Eerste streek geen roofdieren")*: kans op een roofdier per jachtactie op streek 6 of hoger = **15%** (MVP-richtwaarde, tunebaar) — geen aparte per-beurt- of per-streek-kans, alleen getrokken op het moment dat de settler daadwerkelijk jaagt. Het roofdier verschijnt op het jachtvakje zelf en valt pas de beurt erna aan, wat de speler één beurt geeft om de settler weg te bewegen voordat hij sterft. De allereerste jachtbeurt op streek 6 of hoger roept altijd een roofdier op (i.p.v. de gewone 15%-kans) — dit was eerder (issue: "jagen en farmen omdraaien") verschoven naar streek 1, wat spelers regelmatig een settler kostte voordat ze de mechaniek ooit bewust hadden leren kennen; streek 6 komt bovendien met een eigen, verplichte uitleg-pop-up vóórdat de speler er kan jagen (zie hoofdstuk 17 hieronder). Diezelfde uitleg-pop-up kondigt twee compensaties aan (vervolgvraag op hetzelfde issue, `ROOFDIER_STREEK_KUDDE_POSITIE`/`kuddeJachtBeurtenVoorStreek`, `src/game/world.ts`): een gegarandeerde kudde op vakje 5 zodra streek 6 ontgrendelt, en 5 in plaats van de gebruikelijke 4 jachtbeurten voor elke kudde die vanaf streek 6 verschijnt.

**Bezette Streek, Missionaris & Verkenner (hoofdstuk 3/6/10/11/13/14, issue: "De Bezette Streek, missionaris en verkenner")**

*Offer Altaar*: kosten **3 hout, 12 steen, 3 erts, 3 goud**, bouwtijd **3 beurten** — alle vier grondstoffen, in lijn met hoe de speler dit aanleverde. MVP-richtwaarde, tunebaar. Geen terrein-eis (net als Heiligdom).

*Legerkamp*: kosten **12 hout, 3 steen, 3 erts, 2 goud**, bouwtijd **3 beurten** — MVP-richtwaarde, tunebaar. Geen terrein-eis, `bouwbaarBuitenFrontier` (zelfde uitzondering als de Wachttoren).

*Verkenner*: kosten **3 hout, 1 erts**, bouwtijd **2 beurten** — lichter dan Soldaat (2 erts, 1 hout, 2 beurten), MVP-richtwaarde, tunebaar.

*Missionaris*: kosten **2 hout, 2 goud**, bouwtijd **2 beurten** — hout/goud i.p.v. erts, in lijn met een culturele in plaats van militaire unit. MVP-richtwaarde, tunebaar.

*Verkenning-kosten*: **10 wetenschap** per Verkenning (`VERKENNING_KOSTEN_WETENSCHAP`, `src/game/economie.ts`), afgetrokken van dezelfde wetenschap-pool als de technologie-boom (hoofdstuk 3/9) — MVP-richtwaarde, tunebaar. Hoogstens 1 Verkenning per beurt, zelfde soort beurt-limiet als de settler-acties.

*Wololo-drempel*: **30** wololo-punten per te veroveren vijandelijk Heiligdom (`BELEGERINGSDREMPEL`, `src/game/streekOntgrendeling.ts`) — MVP-richtwaarde, tunebaar. Elke Missionaris die naar dat specifieke Heiligdom gestuurd is (`Missionaris.doelHeiligdom`) levert **5** wololo-punten per beurt op dat doel (`WOLOLO_INKOMEN_PER_MISSIONARIS`, issue: "Bezette streek scherm" — vervangt de eerdere, omgeleide cultuurproductie); 1 Missionaris vult de meter dus in 6 beurten, 2 Missionarissen op hetzelfde Heiligdom in 3 beurten, enzovoort (issue: "laatste confrontatie tweaken" — het "meer Missionarissen = sneller"-principe blijft, nu per Heiligdom in plaats van streek-breed). De meter begint na elke verovering weer bij 0 voor een volgend Heiligdom.

*Vijandelijke Wachttoren-legerwaarde*: hergebruikt het bestaande, per streek oplopende `dreigingsniveau` (`dreigingsniveauVoorStreek(hoogte) = max(0, (hoogte-1)×2)`, `src/game/world.ts`) — op streek 12 dus **22**, hetzelfde precedent-getal dat de streek als frontier-dreiging toch al draagt, en daarmee automatisch vergelijkbaar met de zwaarste tegenstander die de speler tot dan toe in de tutorial is tegengekomen. Geen apart, nieuw getal nodig.

*Bezette-Streek-inhoud (tutorial, streek 12)*: van de 9 vakjes dragen er 8 vaste inhoud — 2 vijandelijke Wachttorens (Confrontatie-doelen), 2 vijandelijke Heiligdommen (Belegeringsdoelen), 4 cosmetische huisjes (geen doel, geen functie); het middelste vakje blijft neutraal (gewoon een leeg vakje zodra onthuld). Vaste, niet-procedurele worldgen, net als de overige tutorial-inhoud (hoofdstuk 8/11).

**City-improvement-capaciteit, Grote Woonwijk & vier nieuwe city improvements (hoofdstuk 3/4/6/11/13, issue: "city improvements")**

*City-improvement-cap*: klein **1**, middel **3**, groot **5** gelijktijdige city improvements uit de gecapte pool (Bibliotheek, Markt, Barakken, Tempel, Grote Tempel — Tempel en Grote Tempel tellen als twee aparte sloten). Opslagplaats en de groei-tier-improvements (Woonwijk/Grote Woonwijk) tellen hier niet in mee (hoofdstuk 4/11).

*Grote Woonwijk (tweede groei-tier, middel→groot)*: kosten **12 hout, 8 steen**, bouwtijd **6 beurten**, voedseldrempel **100** (`VOEDSEL_DREMPEL_GROEI_GROOT`, `src/game/world.ts`) — ongeveer het dubbele bouwprofiel van de Woonwijk (6 hout, 4 steen, 4 beurten, drempel 40), passend bij de grotere sprong. *Doorrekening tegen de late-tutorial-voedseleconomie*: een middelgrote stad verbruikt 4 voedsel/beurt (`VOEDSEL_VERBRUIK`); tegen de tijd dat een speler richting streek 10+ speelt (waar de Sterrencirkel/Amberader-doorrekeningen elders in dit hoofdstuk al van uitgaan) staan er doorgaans 2-3 actieve, wegverbonden boerderijen (4 voedsel/beurt elk, hoofdstuk 3/14). Bij 2 boerderijen (8 voedsel/beurt) is het netto-overschot 4/beurt, bij 3 boerderijen (12) is dat 8/beurt — de drempel van 100 is dan binnen resp. ~25 en ~13 beurten spaarbaar, ruim binnen de tientallen beurten die toch al nodig zijn om van streek 10 naar streek 13 te komen (zie de cultuurkosten-tabel hierboven: streek 12 kost al 608 cumulatieve cultuur). De drempel is daarmee een bewuste, voelbare maar niet onhaalbare tweede groei-stap.

*Bibliotheek*: kosten **6 hout, 4 steen, 2 erts**, bouwtijd **3 beurten**, effect **+10 wetenschap/beurt**. Geen stadsgrootte-eis.

*Markt*: kosten **5 hout, 6 steen**, bouwtijd **3 beurten**, effect **+2 goud/beurt**. Geen stadsgrootte-eis.

*Barakken*: kosten **4 hout, 8 steen, 4 erts**, bouwtijd **3 beurten**, effect **+10 permanente legerwaarde** (stad-breed, geen bemanning nodig — anders dan de Wachttoren-bonus, telt mee bij zowel een gewone Confrontatie als een Confrontatie tegen een Bezette Streek). Stadsgrootte-eis **middel** (aanname uit het issue zelf, "pas aan als dat niet de bedoeling is").

*Tempel*: kosten **6 hout, 6 steen**, bouwtijd **3 beurten**, effect **+5 cultuur/beurt**. Stadsgrootte-eis **middel**.

*Grote Tempel*: kosten **4 hout, 14 steen, 4 erts, 4 goud**, bouwtijd **4 beurten**, effect **+10 cultuur/beurt**, cumulatief bovenop een al gebouwde Tempel (samen dus +15 cultuur/beurt — twee aparte city-improvement-sloten, geen vervanging). Stadsgrootte-eis **groot**.

Alle kosten/effecten hierboven zijn MVP-richtwaarden, expliciet tunebaar (issue: "city improvements").

**Legerkamp/Offer Altaar-infrastructuur-eis, doorgerekend (hoofdstuk 4/6/11, issue: "city improvements" Deel 4)**

*Eis*: Legerkamp pas bouwbaar vanaf **5 actieve Wachttorens** (bemand of onbemand) **+ een gebouwde Barakken** (vereist zelf stadsgrootte "middel"); Offer Altaar pas bouwbaar vanaf **5 actieve Heiligdommen + een gebouwde Grote Tempel** (vereist stadsgrootte "groot").

*Haalbaarheid binnen de 13 tutorial-streken*: elke streek heeft 8 bebouwbare land-vakjes (het negende is de stad). Over de hele tutorial is dat 13 × 8 = **104 land-vakjes**. Wachttoren is vanaf streek 2 bouwbaar (11 van de 13 streken, dus tot 88 vakjes in aanmerking) en heeft, net als het Legerkamp zelf, geen terrein-eis; Heiligdom heeft evenmin een terrein-eis en is vanaf streek 1 bouwbaar. Een speler die de economische basis dekt (per streek doorgaans 1 houtkap/mijn/boerderij/steengroeve/Sterrencirkel/Amberader-vakje, hoofdstuk 3/11/14: "elke streek houdt bewust minstens één vakje van elk relevant subtype aan") laat typisch 2-4 vakjes per streek over voor overige keuzes. De 5+5 Wachttorens/Heiligdommen plus de Legerkamp/Offer Altaar-tiles zelf kosten samen **12 vakjes** — bij een gemiddelde van pakweg 3 vrije vakjes/streek over de hele tutorial (ruim 30 in totaal) is dat **goed haalbaar**, zeker omdat Wachttoren/Legerkamp `bouwbaarBuitenFrontier` zijn en dus niet per se op de frontier-streek zelf hoeven te staan (de speler kan dus ook op reeds gepasseerde streken bijbouwen). De stadsgrootte-eisen (Barakken: middel, Grote Tempel: groot) vallen samen met de toch al beoogde groei-doorrekening hierboven, en de Bibliotheek/Markt/Tempel-sloten (cap, zie hierboven) beperken dit niet extra: Barakken en Grote Tempel passen ruim binnen de cap van 3 resp. 5 sloten. **Conclusie**: de eis is fors genoeg om een bewuste, meerdere-streken-brede investering te vragen (zoals bedoeld — de speler moet zijn infrastructuur echt hebben opgebouwd voor de Bezette-Streek-climax op streek 12), maar ruim haalbaar binnen de tutorial van 13 streken zolang de speler er gericht op bouwt vanaf pakweg streek 2-3.

**Amberader/goudmijn & rush-bouwen (hoofdstuk 3/11/14, issue: "toevoeging Goud")**

*Plaatsingskans t.o.v. erts*: de tutorial-worldgen is (net als het overige terrein, hoofdstuk 8/11) volledig vast, geen procedurele kansberekening — de schaarste van een Amberader-locatie is daarom uitgedrukt als een verhouding tussen vaste vakjes, niet als een percentage. Van de 33 heuvel/bergvakjes over de hele tutorial van 12 streken (elk daarvan een geldige erts-mijn-locatie) hebben er precies **3** een amberader-vondst — ruwweg **1 op de 11**, tegenover "elk heuvel/bergvakje" voor een gewone mijn. Bij een latere, eveneens vaste campagnekaart (hoofdstuk 8/11) vertaalt deze verhouding zich naar een vergelijkbaar aantal amberader-vondsten t.o.v. het totaal aantal heuvel/bergvakjes, handmatig verdeeld in plaats van willekeurig getrokken.

*Gegarandeerde eerste locatie*: de eerste amberader-vondst ligt vast op **streek 7**, positie 0 — net als de vers-water-garantie voor stad-stichten op streek 13 (hoofdstuk 2/6) een vaste worldgen-toewijzing, geen kans. Zodra streek 7 voor het eerst ontgrendelt, toont het spel de ontdekkingspop-up (hoofdstuk 3, flavor-tekst in tutorialContent.ts).

*Gegarandeerde tweede locatie (issue: "Amberader sowieso op streek 12" — softlock-preventie)*: een tweede, eveneens gegarandeerde amberader-vondst ligt vast op **streek 11**, positie 2 (een bergvakje). Reden: een speler die de eerste Amberader (streek 7) liet uitputten zonder ooit een Markt te bouwen, zou anders zonder lopend goud-inkomen tegen streek 12 kunnen aanlopen — precies de streek waar zowel Offer Altaar als Legerkamp goud vereisen (hoofdstuk 11, "Legerkamp/Offer Altaar-infrastructuur-eis"). Vlak vóór streek 12 gekozen: laat genoeg om de speler eerst zelf een Markt te laten proberen, maar nog op tijd om alsnog goud op te bouwen vóór het relevant wordt. Identiek aan de eerste Amberader qua kosten, uitputtingsprofiel en de indringers-aantrekkelijkheids-malus hieronder — geen nieuwe variant, gewoon een tweede exemplaar van hetzelfde land improvement (`AMBER_ONTDEKKING_STREEK_2`, `src/game/world.ts`). Zodra streek 11 voor het eerst ontgrendelt, toont het spel dezelfde soort ontdekkingspop-up, met een lichte tekstvariant (`AMBER_ONTDEKKING_TWEEDE_TITEL`/`_TEKST`, tutorialContent.ts) die past bij een tweede vondst in plaats van de eerste verwondering.

*Amberader-bouwprofiel*: kosten en bouwtijd gelijk aan de gewone Mijn (**8 hout, 4 steen**, bouwtijd **3 beurten**), effect **2 goud/beurt** — zelfde opbrengst-schaal als Mijn (2 erts/beurt).

*Rush-bouwen-prijs*: **5 goud per weggekochte beurt** (`RUSH_GOUD_PER_BEURT`, tunebaar). Van toepassing op elke lopende land- of city-improvement in de bouwwachtrij (hoofdstuk 5); nooit op de technologieboom (hoofdstuk 11).

**Lange mars (Anker 3, na Terugvechten — Amerikaanse campagne)**
- Uitgestrekt over 3-4 opeenvolgende streken in plaats van één piekmoment.
- Vooruitkijk-bereik tijdelijk teruggezet naar 0 extra streken tijdens deze reeks.
- Alle land improvements in deze streken hebben standaard verlaagde opbrengst (het beschadigde land werkt door).
- Geen nieuwe stad te stichten binnen deze reeks.
- Zichtbare voorraadmeter (materiaal tegenover resterende streken) i.p.v. een harde timer.
- Bij te weinig voorraad aan het einde: geen instant game-over, maar een verzwakte aankomst (kleinere stad-status bij de oceaan, beïnvloedt slotscène/flavor) — consistent met "hard maar eerlijk" bij nederlagen.

**Afstandsverval & herhalend stichtingspatroon (hoofdstuk 9/11, Amerikaanse campagne)**

*Afstandszones en effectiviteit* (volledige uitleg in hoofdstuk 9): 0-4 streken = 100%, 5-8 = 65%, 9-12 = 30%, 13+ = 0%. MVP-richtwaarden, tunebaar.

*Doorrekening tegen de campagnelengte*: een speler die telkens pas bij kans 3 (afstand 13+) sticht, legt tussen twee stichtingen ten minste 13 streken frontier-voortgang af — bij Normaal (30-40 streken) past dat ruwweg **3 cycli** (3 × 13 ≈ 39, aan de bovenkant van de range), bij Moeilijk (45-60 streken) **3-4 cycli**, bij Makkelijk (20-25 streken) **1-2 cycli**. Een speler die eerder sticht (kans 1 of 2) start een nieuwe cyclus sneller, dus dit is een ondergrens-schatting van het aantal cycli, geen exacte voorspelling — vandaar "typisch ~3 keer" in hoofdstuk 9, niet een harde teller.

*Implementatiestatus (M18)*: de drie kans-hoogten zelf liggen inmiddels vast als pure functie, `gegarandeerdeStichtingskansHoogten()` (`src/game/stad.ts`) — vaste, deterministische offsets t.o.v. de streekHoogte van de stichtende stad: **+3** (kans 1, binnen de 0-4-zone), **+8** (kans 2, het midden van de 5-12-verval-zones), **+13** (kans 3, exact de drempel van de uitgeputte zone). Deze functie is nog niet gekoppeld aan een daadwerkelijke, handgeschreven plaatsing van vers-water-vakjes (hoofdstuk 2) op een echte, vaste campagnewereld — dat is voorgesteld als M20b/M20c (hoofdstuk 13/15). Omdat een vaste kaart niet vooraf kan weten op welke hoogte de speler daadwerkelijk zal stichten, gebeurt die koppeling via voldoende dichte, vooraf geplaatste vers-water-vakjes (M20c) in plaats van vakjes die pas ná de stichting op de berekende hoogte verschijnen. Tot die tijd bepaalt deze functie dus alleen de streek-hóógtes waarop de drie kansen zouden moeten vallen, geen concrete `positieInStreek` of daadwerkelijk geplaatst vakje.

**Volgorde/unlock-logica overige campagnes**
Na het voltooien van de Amerikaanse frontier-campagne worden alle overige campagnes **in één keer ontgrendeld** — geen verdere gedwongen volgorde, omdat er geen inhoudelijke leercurve-afhankelijkheid tussen de latere campagnes bestaat (in tegenstelling tot tutorial → Amerika). **Besloten: geen cross-campagne relic-bonussen of ander meta-progressiesysteem tussen campagnes** — elke campagne staat op zichzelf, om de rogue-like puurheid (elke run is een eigen uitdaging, zonder consolatieprijzen of stapelende voordelen) niet te verwateren.

**Herbruikbaar ankersjabloon voor overige campagnes**
Gebaseerd op hetzelfde 3-anker-ritme als de Amerikaanse campagne, generiek te vullen per campagne:

| Anker | Universele functie | Toe te passen op |
|---|---|---|
| 1 (streek 8-10) | Eerste contact/keuze die een "spoor" achterlaat | Historisch passend eerste-contact-moment |
| 2 (streek 16-18) | Escalatie op basis van Anker 1 | Twee vertakkende gevolgen, elk met een ander lange-termijn-effect |
| 3 (eindspel) | Gedeelde slotscène met tonale varianten per pad | Thematisch passend obstakel — niet per se militair; kan bestuurlijk, economisch of anderszins zijn |

Voorbeeldinvulling (Mongoolse campagne, ter illustratie van het sjabloon):
- Anker 1: een steppevolk kruist je pad — toenadering voor ruiter-technologie, of onderwerping voor direct gebied.
- Anker 2: bij toenadering → bondgenootschap (hogere mobiliteit, tragere civiele groei, passend bij het Mongoolse thema "verovering makkelijk, behoud moeilijk"); bij onderwerping → georganiseerd verzet richting Anker 3.
- Anker 3: obstakel draait om een overspannen, moeilijk te behouden gebied, in plaats van een fysieke horde.

Dit sjabloon, met bijpassende historische invulling, dient als basis voor de resterende campagnes: Hellenistisch, Romeins, Bantu, Vikings, Spaanse conquista, VOC, Siberisch/Tataars.

---

## 15. Huidige prioriteit & later op te pakken

**Voorheen (t/m M19)**: alleen de tutorial ("De Eerste Vuren", Het Hertenpad-volk) bouwen volgens de MVP-scope in hoofdstuk 13 — die tutorial-MVP is inmiddels volledig af.

**Nu**: de Amerikaanse frontier-campagne inhoudelijk en technisch volledig uitwerken (ankers staan al beschreven in hoofdstuk 9; de meerdere-steden-fundering, het afstandsverval en de kern van het herhalende stichtingspatroon staan al in de code, M16-M18 — zie hoofdstuk 9/13). De `CampaignConfig`-instantie en de weergavenamen (M20a) staan inmiddels ook in de code, sinds M20b ook een eigen, langere, vaste (handgeschreven, geen procedurele generatie — issue #247, hoofdstuk 8/11) campagnekaart (`src/game/worldGoingWest.ts`, 35 streken), sinds M20c is de vers-water-dichtheid van die kaart geverifieerd tegen `gegarandeerdeStichtingskansHoogten()` (`vindStichtingskansGaten()`, stad.ts), en sinds M20d is de spel-opstart-architectuur zelf campagne-bewust (`GameState.campagneId`, per-campagne save-sleutel, campagnekeuze-doorgifte, placeholder-tegelset-koppeling — hoofdstuk 13). Nog te doen: Going West op `beschikbaar: true` zetten — geblokkeerd door de resterende delen van blocker 1 uit hoofdstuk 19 (de intro-/oceaan-uitleg-tekst verwijst nog naar de tutorial; het per-streek-flavor-deel en de "Samenhang"-paragraaf zijn sinds M20f al opgelost met placeholder-content) en door resterende content zoals zeldzaamheid en pushback-diplomatie die in de tutorial-MVP bewust zijn uitgesteld. De drie Anker-verhalen (hoofdstuk 9) staan hier bewust **niet** bij: die zijn inhoudelijk beschreven maar nog niet technisch uitgewerkt, en worden gaandeweg als een los, doorlopend/incrementeel proces opgepakt (issue #278, vraag 3) — geen poort voor `beschikbaar: true`, dus een volgende sessie hoeft niet te wachten tot de ankers "af" zijn. De tutorial blijft intussen gewoon bestaan en speelbaar als losstaande, eerste campagne (hoofdstuk 10) — dit is een verschuiving van bouwprioriteit, geen vervanging.

**Later, nog te bepalen**: of en welke overige campagnes (Mongools, Hellenistisch, Romeins, Bantu, Vikings, Spaanse conquista, VOC, Siberisch/Tataars) worden uitgewerkt, met het herbruikbare ankersjabloon uit hoofdstuk 14 als basis. Geen cross-campagne bonussen tussen deze campagnes (zie hoofdstuk 14).

---

## 16. Wegen & de settler (bouw-ritme)

Nieuw spelmechanisme (in de MVP, zie hoofdstuk 13): het bouwen van improvements voelde te snel aan zonder iets actiefs ertussen. De oplossing bestaat uit twee met elkaar verbonden regels: bouwprojecten worden schaarser, en er komt een aparte, actieve eenheid — de settler — om de tussenliggende beurten te vullen. Zie hoofdstuk 11 ("Settler en bouw-ritme...") voor de reden achter deze keuze.

**Bouw-ritme**
- De eerste bouw-pop-up (beurt 1) blijft ongewijzigd: de speler mag meteen iets bouwen.
- Daarna mag een nieuw bouwproject nog maar **om de 3 beurten** gestart worden (beurt 1, 4, 7, 10, ...) — ongeacht of de speler op een eerder bouwmoment daadwerkelijk iets koos of de pop-up sloot zonder te bouwen.
- Dit geldt alleen voor het starten van een *nieuw* bouwproject; een improvement die al "in_aanbouw" is, blijft gewoon doorbouwen via de bestaande productiewachtrij (hoofdstuk 5).

**De settler**
- Verschijnt aan het begin van **beurt 2**, startend op de stad-tile.
- Verplaatst **1 vakje per beurt**: vooruit/achteruit (een streek omhoog/omlaag, dezelfde positie in de band) of zijwaarts (dezelfde streek, één positie links/rechts) — nooit diagonaal, en nooit buiten al ontgrendeld gebied.
- Kan in plaats van bewegen ook een **weg aanleggen** op het vakje waar hij staat. Dat kost geen grondstoffen, alleen die ene beurt (geen meerdere-beurten-wachtrij zoals bij improvements, hoofdstuk 5).
- Eén actie (bewegen óf een weg aanleggen) per beurt — de speler hoeft de settler niet elke beurt te gebruiken.
- Visueel: een huifkar, in lijn met de MVP-plaatshouderstijl (hoofdstuk 13: "grove/simpele placeholders zijn prima").

**Wegen activeren resource-productie**
- Een land improvement (mijn, boerderij, houtkap, steengroeve, heiligdom, wachttoren) is pas **actief-producerend** zodra er een weg **op zijn eigen vakje** ligt, én die weg via een aaneengesloten keten van wegen verbonden is met de stad-tile. Een weg die alleen tót het improvement leidt, zonder er zelf op te liggen, is niet genoeg — de speler moet de weg daadwerkelijk over/op het resource-vakje aanleggen.
- Zonder die eigen wegverbinding blijft de improvement gewoon gebouwd en zichtbaar, maar levert hij niets op totdat de wegverbinding er is — en telt hij ook niet mee voor uitputting (hoofdstuk 4): pas zodra een improvement daadwerkelijk produceert, telt de uitputtingsteller af.
- Dezelfde eis geldt voor de indringers-bescherming van een Wachttoren (hoofdstuk 6): een gebouwde en bemande Wachttoren zonder eigen wegverbinding beschermt zijn streek nog niet. Pas met een aaneengesloten wegketen naar de stad is een Wachttoren, net als elke andere land improvement, echt "actief" — en dus in staat zijn functie te vervullen. Dit maakt expliciet wat hoofdstuk 6 vereist ("voltooid, bemand én verbonden"): de drie voorwaarden zijn geen aparte regel, maar dezelfde activerings-eis die hier voor alle land improvements geldt.
- Dit maakt wegenaanleg geen losstaand extraatje maar een echte voorwaarde voor de economie — de actieve handeling die de rustigere bouw-ritme hierboven opvult.

**Tutorial**
- Bij beurt 2 (zodra de settler verschijnt) krijgt de speler een eenmalige uitleg-pop-up over de settler, wegen en het nieuwe bouw-ritme — los van, en aanvullend op, de bestaande per-beurt basisbegrippen-uitleg (grondstoffen/improvements) uit de eerste beurten.

**Stad stichten (hoofdstuk 2/10/11)**
- Naast bewegen, weg aanleggen, jagen en hout hakken (hoofdstuk 17) kan de settler, wanneer hij op een geschikt (vers-water) vakje staat, in plaats daarvan **stichten**: een nieuwe stad neerzetten op zijn huidige vakje. Dit is geen herhaalbare per-beurt-actie zoals de andere vier — de speler kan stichten zodra hij er klaar voor is, ongeacht of hij deze beurt al een settler-actie heeft gebruikt.
- De speler krijgt eerst een duidelijke bevestigingswaarschuwing: **de settler verdwijnt bij het stichten** ("de huifkar wordt de stad"). Pas na bevestigen worden de stichtingskosten (hoofdstuk 14) betaald en verschijnt de nieuwe stad-tile.
- Een nieuwe (eerste) settler is daarna alleen te verkrijgen via de civiele improvement-pool (hoofdstuk 3/11), concurrerend met de groei-tier-improvement, en alleen zolang het aantal settlers lager is dan het aantal gestichte steden (hoofdstuk 11: "maximaal één settler per gestichte stad"). Vanaf streek 7 kan de stad daarnaast een **tweede** settler uitrusten via een eigen, onafhankelijke wachtrij — permanent herbouwbaar, niet gekoppeld aan het aantal gestichte steden (hoofdstuk 11: "Een permanent herbouwbare tweede settler vanaf streek 7").

---

## 17. Kuddes & settler-jacht

Nieuw spelmechanisme (in de MVP, zie hoofdstuk 13): twee extra, directe settler-acties naast bewegen en weg aanleggen (hoofdstuk 16) — jagen op wilde kuddes voor voedsel, en hout hakken op een bos-vakje. Zie hoofdstuk 11 ("Settler-jacht op kuddes...") voor de reden achter deze keuze.

**Wilde kuddes**
- Vanaf **streek 4** kan elke beurt, met een kleine kans (**5%**, MVP-richtwaarde, tunebaar — hoofdstuk 14), een wilde kudde verschijnen op een leeg vakje van een al ontgrendelde streek (streek 4 of hoger).
- Een kudde staat los van improvements: het vakje blijft "leeg" (er kan nog steeds op gebouwd worden — bouwen op een kudde-vakje laat de kudde verder trekken, zie hieronder).
- Een kudde is eindig: ze biedt in totaal **4 jachtbeurten** voordat ze verder trekt (net als de uitputting van land improvements, hoofdstuk 4, maar zonder ghost-town-tile erna — het vakje wordt gewoon weer een normaal leeg vakje).
- Verschijnt een kudde, dan meldt een pop-up dit meteen — dezelfde stijl als de indringers-pop-up (hoofdstuk 6): een korte melding met flavor-tekst en de streek waar de kudde staat. Zo hoeft de speler niet toevallig op de kaart te zien waar hij de settler heen kan sturen om te jagen.

**Jagen**
- De settler moet eerst naar het vakje met de kudde verplaatst worden (kost, net als elke verplaatsing, de settler-actie van die beurt).
- Staat de settler op een kudde-vakje, dan kan hij in plaats van bewegen/weg aanleggen ook **jagen**: dat levert die beurt direct **3 voedsel** op en telt één jachtbeurt van de kudde af.
- Na 4 jachtbeurten (in totaal, niet per se aaneengesloten) is de kudde uitgeput en verdwijnt ze; de speler kan opnieuw naar een andere, nieuw verschenen kudde trekken. Vanaf streek 6 zijn dit er 5 in plaats van 4 — zie "Roofdieren" hieronder.
- Wordt er op het kudde-vakje gebouwd voordat de kudde uitgeput is, dan trekt de kudde meteen verder (het vakje verliest zijn kudde-status).

**Roofdieren**
- Vanaf **streek 6** brengt jagen een risico met zich mee. Streek 6 introduceert verder geen andere nieuwe mechaniek, dus het roofdier krijgt hier de volle aandacht.
- Een verplichte uitleg-pop-up (zelfde stijl als de overige streek-introductie-pop-ups, hoofdstuk 9/13) verschijnt zodra streek 6 ontgrendelt, vóórdat de speler er ooit kan jagen — de speler weet dus altijd vooraf wat hem te wachten staat. De allereerste jachtbeurt op streek 6 of hoger roept daarna altijd een roofdier op (i.p.v. de gewone kans hieronder), zodat de speler de volledige waarschuwing-reactietijd-gevolg-cyclus gegarandeerd één keer meemaakt terwijl de uitleg nog vers is; daarna geldt weer de gewone kans.
- Twee compensaties voor dat risico, allebei al aangekondigd in de uitleg-pop-up hierboven: zodra streek 6 ontgrendelt, staat er meteen een **gegarandeerde kudde** op vakje 5 van die streek (dezelfde softlock-preventie-gedachte als de gegarandeerde eerste kudde op streek 1, hoofdstuk 17 hierboven — de speler hoeft niet op de gewone, willekeurige kudde-trekking te wachten om de net uitgelegde mechaniek meteen te kunnen ervaren). Daarnaast zijn kuddes die vanaf streek 6 verschijnen (gegarandeerd of via de gewone trekking) **groter**: ze bieden 5 jachtbeurten in plaats van de gebruikelijke 4 — één beurt extra risico verdient zo ook iets extra's terug.
- Geen losstaande, willekeurige kans per streek of per beurt (zoals bij kuddes hierboven of indringers, hoofdstuk 6): een roofdier is uitsluitend een **gevolg van jagen**. Elke keer dat de settler jaagt op een kudde op streek 6 of hoger, is er een kans (MVP-richtwaarde 15%, tunebaar — hoofdstuk 14) dat een roofdier verschijnt, op datzelfde vakje.
- Het ritme volgt de signature-mechanic van het spel (waarschuwing → kort reactievenster → gevolg, hoofdstuk 7):
  1. **Waarschuwing**: het roofdier is meteen zichtbaar op de kaart, op het vakje waar de settler zojuist jaagde. Een pop-up meldt zijn komst — dezelfde stijl als de indringers- en kudde-pop-up hierboven: korte flavor-tekst, geen paniekerige taal.
  2. **Reactietijd**: het roofdier valt pas de **beurt erna** aan, niet meteen. De speler heeft die tussenliggende beurt om de settler weg te bewegen (een gewone verplaatsings-actie, hoofdstuk 16) en zo te ontsnappen.
  3. **Gevolg**: staat de settler nog op (of keert hij terug naar) het vakje met het roofdier wanneer die beurt om is, dan **sterft de settler**.
- Verlies van de settler activeert de bestaande regel uit hoofdstuk 6/13: is het aantal settlers lager dan het aantal steden (de startstad Oer-stad telt hierbij mee, ook al is die niet via de stichter-actie ontstaan, hoofdstuk 16), dan verschijnt de huifkar weer als optie in de civiele improvement-pool. Dit is de eerste situatie waarin die regel al van toepassing is vóórdat er ooit gesticht is.
- **Buiten scope**: geen "strijder verjaagt het roofdier"-mechanisme — militaire eenheden en Wachttorens (hoofdstuk 6) spelen hier bewust geen rol. De enige uitweg is de settler op tijd wegbewegen.

**Hout hakken**
- Op elk vakje met terrein-subtype **bos** (hoofdstuk 2/11) kan de settler, in plaats van bewegen/weg aanleggen, **hout hakken**: dat levert die beurt direct **1 hout** op.
- Geen limiet op het aantal keer — dit is, anders dan jagen, geen eindige hulpbron, maar ook een kleinere opbrengst per beurt.
- Een alternatief voor de Houtkap-improvement (die 3 hout per beurt oplevert, maar bouwkosten, bouwtijd én een wegverbinding vereist, hoofdstuk 16) — vooral nuttig in de eerste beurten van het bouw-ritme, voordat een Houtkap er al staat en aangesloten is.

**Eén settler-actie per beurt**
- Jagen en hout hakken zijn, net als bewegen en weg aanleggen, elk hoogstens **1 keer per beurt** mogelijk (dezelfde `settlerActieGedaanDitBeurt`-regel uit hoofdstuk 16) — de speler kiest per beurt welke van de vier acties de settler uitvoert.

---

## 18. Waarschuwing bij "Volgende beurt"

Nieuw, kleine UX-toevoeging (in de MVP, zie hoofdstuk 13): vóórdat een klik op "Volgende beurt" de beurt daadwerkelijk beëindigt, controleert het spel of er nog iets te doen valt. Zie hoofdstuk 11 ("Waarschuwing vóór 'Volgende beurt'...") voor de reden achter deze keuze.

- Een pop-up verschijnt zodra **minstens één** van de volgende twee gevallen geldt:
  - De settler heeft deze beurt nog geen actie gebruikt (bewegen, weg aanleggen, jagen of hout hakken — hoofdstuk 16/17).
  - Er staat nog een bouwkeuze open (de bouw-pop-up is nog niet gesloten of ingevuld deze beurt, hoofdstuk 16: "bouw-ritme").
- De pop-up benoemt welk(e) van de twee gevallen van toepassing zijn/is.
- De speler kiest tussen:
  - **Terug**: de pop-up sluit, de beurt eindigt niet — de speler kan alsnog de settler gebruiken en/of bouwen.
  - **Toch doorgaan**: de beurt eindigt gewoon, zoals voorheen zonder deze waarschuwing.
- Zijn beide gevallen al afgehandeld (settler heeft al een actie gebruikt, en er staat geen bouwkeuze meer open, of het is nog geen bouwmoment), dan verschijnt de pop-up niet en eindigt de beurt meteen bij een klik op "Volgende beurt" — precies zoals voorheen.

---

## 19. Going West — resterende blockers vóór `beschikbaar: true` (vervolg op M20d)

Bij het afronden van M20d (hoofdstuk 13, issue: "M20d voorstel") is de spel-opstart-architectuur zelf campagne-bewust gemaakt (`GameState.campagneId`, per-campagne save-sleutel, de `CampagneSelectScherm` → `AppRoot` → `GameRoot` → `useGameEngine`-campagnekeuze-doorgifte, en een placeholder-tegelset-koppeling in de renderer). Bij het volledig doorlezen van `GameRoot.tsx` om de laatste stap te zetten — Going West op `beschikbaar: true` — bleek dat de streek-flavor- en uitleg-pop-up-laag daar nog los van staat: die is nog vrijwel volledig tutorial-specifiek, en één van de gevonden problemen is een echte functionele bug, geen contentkeuze. Dit hoofdstuk legt de drie blockers vast als uitgangspunt voor een nog voor te stellen vervolg-milestone (CLAUDE.md: architectuur-/content-rakende bevindingen eerst apart voorstellen in plaats van ze blind in dezelfde sessie mee te nemen). **Update (M20e, hoofdstuk 13)**: blockers 2 en 3 zijn inmiddels opgelost, samen met de losstaande vinkje-bug uit de "Samenhang"-paragraaf hieronder — geen van drieën vergde een contentkeuze. **Update (M20f, hoofdstuk 13, issue #278)**: van blocker 1 is de streek-flavor-content en het per-stichting-"voltooid"-signaal uit de "Samenhang"-paragraaf inmiddels opgepakt, met placeholder-tekst ("todo") — zie hieronder. De drie Anker-verhalen (issue #278, vraag 3) en de intro-/oceaan-uitleg-tekst blijven nog open; dat is de resterende inhoudelijke schrijftaak.

**1. Tutorial-narratieve content is niet campagne-bewust (deels opgelost, M20f)**
`tutorialContent.ts` (`TUTORIAL_STREEK_CONTENT`, `INTRO_TITEL`/`INTRO_FLAVOR_TEKST`, `TUTORIAL_VOLTOOID_TITEL`, `BEZETTE_STREEK_TITEL`/`_TEKST`, `STICHTING_AFSLUITENDE_SCENE`, e.a.) bevat expliciete Hertenpad-volk-/Oer-stad-lore (hoofdstuk 10) en keek nergens naar `state.campagneId`. Op `beschikbaar: true` zou een Going West-run dus letterlijk tutorial-teksten tonen ("De Bergkam is bezet", "De Eerste Vuren — voltooid", enz.) — inhoudelijk fout, geen technisch detail. **M20f** loste het per-streek-deel op met een eigen, losstaand bestand (`goingWestContent.ts`) — alle 35 streken hebben nu een `StreekContent`-entry, met de naam van het al bestaande terreintype en `"todo"` als mechaniek/flavor-tekst (issue #278, vraag 1: bewust een generieke placeholder, later gaandeweg aan te vullen door de speler zelf) — en met een eigen `StichtingsMomentPopup` die bij élke stichting verschijnt in plaats van het tutorial-"voltooid"-scherm (vraag 2, zie "Samenhang" hieronder). **Nog open**: `INTRO_TITEL`/`INTRO_FLAVOR_TEKST` (het introscherm bij het starten van een run) en `OCEAAN_UITLEG_TEKST` (verwijst nog naar "Oer-stad") zijn niet meegenomen — die zijn niet aangeraakt door issue #278's twee vragen en blijven dus nog tutorial-tekst tonen zodra een Going West-run ze bereikt.

**2. `TUTORIAL_STREEK_AANTAL` hard-coded voor de oceaan-uitleg (opgelost, M20e)**
`GameRoot.tsx` gebruikte de tutorial-constante `TUTORIAL_STREEK_AANTAL` (14, `world.ts`) om te bepalen wanneer de oceaan-uitleg-pop-up moet verschijnen. Bij `beschikbaar: true` zou dit op streek 14 van de 35-streken Going West-kaart (hoofdstuk 13 M20b) afgaan, niet aan het echte einde van die kaart. Opgelost door `state.streken.length` te gebruiken (de lengte van de actieve campagnekaart, zelfde bron als `isAfsluitendeStichting` in `acties.ts`) in plaats van de tutorial-constante. De tekst van de pop-up zelf (`OCEAAN_UITLEG_TEKST`) is nog steeds tutorial-specifiek ("vers water... sinds Oer-stad") — dat hoort bij blocker 1.

**3. Streek-popup-softlock voorbij streek 14 (functionele bug, geen contentkeuze) (opgelost, M20e; content-koppeling voltooid, M20f)**
`TUTORIAL_STREEK_CONTENT` kent alleen entries voor streek 1-14; `StreekPopup` rendert `null` zodra er voor de huidige streek geen content gevonden wordt. `laatstBevestigdeStreek` (`GameRoot.tsx`) wordt echter uitsluitend bijgewerkt via de "Doorgaan"-knop in diezelfde popup. Zodra een campagnekaart langer is dan 14 streken (Going West: 35) bleef `laatstBevestigdeStreek` dus permanent achter vanaf streek 15 — en via de bestaande `!toonStreekPopup`-gating-keten blokkeerde dat daarmee alle lager-prioriteit pop-ups voor de rest van de run, inclusief de **verplichte** tech-keuze-pop-up (hoofdstuk 13 M13). Anders dan blocker 1/2 was dit geen inhoudelijke tutorial-koppeling maar een echte bug: hij treft elke toekomstige campagnekaart die langer is dan 14 streken, niet specifiek Going West. Fix (M20e): `toonStreekPopup` vereist nu ook dat er daadwerkelijk streek-content bestaat voor de huidige streek, niet alleen dat de streek nog niet bevestigd is. **M20f** rondde dit af: `streekContentVoorCampagne()` (`campagnes.ts`) vervangt de rechtstreekse `TUTORIAL_STREEK_CONTENT`-aanroep in zowel deze gating als in `StreekPopup`/`StreekIntroPaneel` zelf — zonder die laatste stap zou de softlock zijn opgelost qua gating, maar `StreekPopup` zelf had nog steeds `null` gerenderd voor Going West-streken (dezelfde softlock, één laag dieper).

**Samenhang met het herhalende stichtingspatroon (opgelost, M20f)**
Los van bovenstaande drie, maar bij hetzelfde onderzoek gevonden: `TutorialVoltooidPopup` ("De Eerste Vuren — voltooid") zou bij de allerlaatste, afsluitende stichting van een Going West-run verschijnen (`stadGesticht` wordt campagne-agnostisch gezet, `acties.ts`) — inhoudelijk fout (tutorial-tekst) en zou de run bovendien beëindigen, wat voor Going West niet de bedoeling is. **M20f** loste dit op met een eigen `StichtingsMomentPopup` (issue #278, antwoord op vraag 2: "iedere stichting... krijgt een mooi momentje... het verschil met de tutorial is dat het spel niet eindigt dan") die bij élke stichting binnen het patroon verschijnt voor niet-tutorial-campagnes, met een placeholder-plaatje en -tekst; `toonTutorialVoltooidPopup` is nu expliciet tot `state.campagneId === undefined` beperkt. Het "voltooid"-vinkje in `CampagneSelectScherm.tsx` (`heeftTutorialVoltooid()`) is al eerder opgelost (M20e): het verschijnt uitsluitend bij de tutorial-entry zelf (`campagne.id === undefined`).

**Wat dit niet verandert**
De in M20d gebouwde spel-opstart-architectuur (campagne-bewuste `GameState`/save-sleutel/campagnekeuze-doorgifte/placeholder-tegelset, hoofdstuk 13) blijft ongewijzigd en werkt. De laatste stap — Going West op `beschikbaar: true` zetten in `CampagneSelectScherm.tsx` — blijft geblokkeerd: blocker 1 heeft nu placeholder-content (M20f) in plaats van tutorial-lekkage, maar de intro-/oceaan-uitleg-tekst is nog niet meegenomen.

De drie Anker-verhalen (hoofdstuk 9, issue #278 vraag 3) zijn **geen** onderdeel van blocker 1 en vormen dus ook geen poort voor `beschikbaar: true` — ze zijn inhoudelijk beschreven maar nog niet technisch uitgewerkt, en worden bewust als een los, doorlopend/incrementeel proces zonder vaste opleverdatum opgepakt (zie de statusregel bovenaan hoofdstuk 9).

---

## 20. Wijzigingsgeschiedenis

De hoofdtekst hierboven beschrijft steeds alleen de huidige stand van het ontwerp. Dit hoofdstuk verzamelt de wijzigingen die daar onderweg naartoe hebben geleid, per onderwerp, met de bijbehorende issue-referentie. De ontwerp-rationale (de *reden* achter een keuze) staat nog gewoon bij het onderwerp zelf in hoofdstuk 11 — hier gaat het puur om wat er vroeger anders was.

**Algemeen/wereldgen**
- Vaste, handgeschreven campagnekaarten per campagne i.p.v. random worldgen per run (hoofdstuk 1/8/11) — issue #247.

**Hoofdstuk 2/9 — steden & afstandsverval**
- Achtergelaten steden leverden oorspronkelijk helemaal geen city-improvement-inkomsten meer op (harde knip). Vervangen door een geleidelijk, afstandsafhankelijk verval (100/65/30/0% naar afstandszone, hoofdstuk 9/14) zodra de Amerikaanse campagne meerdere steden mogelijk maakte — de oude harde regel had tot dan toe nooit een "achtergelaten stad" om op toe te passen.

**Hoofdstuk 4/11 — groei-beloning**
- Het "meer relic-slots"-concept als groei-beloning is nooit gebouwd; vervangen door de city-improvement-capaciteit (klein 1/middel 3/groot 5) — issue: "city improvements" Deel 1.

**Hoofdstuk 6 — indringers & Wachttoren**
- Wachttoren-mechanisme geactiveerd vanaf streek 3 i.p.v. streek 2 (de eerdere, verlaagde drempel bleek qua voedsel niet haalbaar zodra er meteen ook een voedsel-etende Wachttoren bijkwam); Boerderij zelf naar streek 2 verplaatst, vóór Wachttoren/Mijn/indringers — issue: "Tweede streek boerderij".
- Indringers-kans per beurt verlaagd van 40% naar 20%, en verbreed van "alleen de frontier-streek" naar één trekking over alle ontgrendelde streken.
- Wachttoren beschermt sindsdien ook de streek direct eronder, niet alleen zijn eigen streek — issue: "wachttoren beschermt 2 streken".
- Een streek met uitsluitend een Wachttoren (en verder niets) telt niet meer mee in de indringers-trekking — issue: "een streek met alleen een wachttoren kan geen indringers krijgen".
- Wachttoren bouwbaar gemaakt op elke ontgrendelde streek i.p.v. alleen de frontier; bemanningskosten van 1 voedsel/beurt per bemande Wachttoren toegevoegd — issue: "wachttorens, bemanning en bevoorrading".
- Strijder-terughalen was eerst 2 beurten "onderweg", nu volledig instant en omkeerbaar — issue: "wachttoren tweaks" (dezelfde issue verplaatste ook het daadwerkelijk aftrekken van tribuut naar het bevestigingsscherm, i.p.v. bij de keuze om te betalen).
- Een beschermde Wachttoren hield voorheen altijd stand; sindsdien een geloot resultaat (standhouden 85% / malus (ruïne + verloren strijder) 10% / bonus (buit) 5%) — issue: "wachttorens kunnen vernietigd worden door indringers".
- Amberlader/goudmijn-locaties wegen sinds de introductie van goud 2× zo zwaar mee in de indringers-trekking — issue: "Amberader: bonus/malus-koppeling".

**Hoofdstuk 6/11 — De Bezette Streek**
- De Bezette Streek (Verkenning/Offer Altaar/Missionaris/Legerkamp/Confrontatie) verving een eerdere, kleinere "militaire confrontatie op streek 12"-placeholder volledig — issue: "De Bezette Streek, missionaris en verkenner".
- Aantal vijandelijke Wachttorens/Heiligdommen op streek 12 teruggebracht van 2+2 naar 1+1, en Wachttoren-vernietiging net zo verplicht gemaakt als Heiligdom-verovering vóór de streek opengaat (voorheen bleef een niet-geconfronteerde Wachttoren gewoon permanent staan); meerdere Missionarissen op hetzelfde doel vermenigvuldigen sindsdien ook de belegeringssnelheid — issue: "laatste confrontatie tweaken".
- De volledige Bezette-Streek-UI verplaatst van een los paneel in het stadsmenu naar een klikbare-kaart-flow (tile-info-pop-ups); Verkenner niet langer een vooraf te trainen eenheid maar een directe, per-vakje actie; Missionaris-toewijzing van een streek-brede belegeringsmeter naar een eigen wololo-meter per Heiligdom (met "veroveren" i.p.v. "vernietigen" als uitkomst); Confrontatie-eis verplaatst van een eigen Wachttoren naar een eigen Legerkamp op de streek eronder — issue: "Bezette streek scherm".

**Hoofdstuk 3/4/6/14 — city improvements**
- Vier nieuwe, gecapte city improvements (Bibliotheek, Markt, Barakken, Tempel, Grote Tempel) en de Grote Woonwijk (tweede groei-tier) toegevoegd; Legerkamp/Offer Altaar van vrij bouwbaar naar een infrastructuur-eis (5 actieve Wachttorens/Heiligdommen + de bijbehorende city improvement) — issue: "city improvements".

**Hoofdstuk 3/9/13 — technologie & wetenschap**
- Wetenschap had aanvankelijk geen enkele functie in de MVP; Sterrencirkel en de vertakkende technologie-boom (3 drempels) toegevoegd — issue: "tech tree toevoegen".
- Wetenschapsdrempelkosten eerst verhoogd naar `10 + 10×(drempel-1)²`, daarna verdubbeld naar `20 + 20×(drempel-1)²` nadat bleek dat de eerste curve de hele boom al rond beurt 42 voltooide, ruim vóór de Bezette Streek — issue: "techtree langzamer".

**Hoofdstuk 3/14 — goud**
- Amberader/goudmijn, Markt en rush-bouwen met goud (5 goud per weggekochte bouwbeurt) toegevoegd — issue: "toevoeging Goud".
- Een tweede gegarandeerde Amberader-locatie (streek 11) toegevoegd om een softlock rond streek 12 te voorkomen (goud nodig voor Offer Altaar/Legerkamp) — issue: "Amberader sowieso op streek 12".

**Hoofdstuk 10/16 — settler & stichten**
- Nieuwe settler in de civiele bouw-pool gezet (concurrerend met groei), gekoppeld aan het aantal gestichte steden (max. 1), en het stichten zelf als settler-actie uitgewerkt — issue: "stad stichten op de frontier".
- Stichtingskosten (oorspronkelijk 40 hout/15 steen/10 erts/30 voedsel) 4× verlaagd naar 10 hout/4 steen/3 erts/8 voedsel, waardoor een Opslagplaats niet langer verplicht is vóór het stichten — issue #187 ("stad stichten veel goedkoper").
- Een permanent herbouwbare tweede settler vanaf streek 7 toegevoegd, los van de "max. 1 per gestichte stad"-regel — issue: "Altijd 2e settler" (GitHub-issue #236).

**Hoofdstuk 17 — kuddes & roofdieren**
- Kans op een nieuwe wilde kudde per beurt verlaagd van 15% naar 5% (bij 15% liep het gemiddeld aantal tegelijk aanwezige kuddes op tot ruim boven de bedoelde 1-2) — issue: "kudde frequentie verlagen".
- Roofdier-risico bij jagen eerst naar streek 1 verplaatst (issue: "jagen en farmen omdraaien"), bleek daar te vroeg (spelers verloren een settler voordat ze de mechaniek bewust hadden leren kennen), en daarna naar streek 6 — issue: "Eerste streek geen roofdieren".

**Hoofdstuk 14 — cultuurkosten**
- Cultuurkosten-formule omgezet van exponentieel (basis 20, ×1,4 per streek) naar kwadratisch (`3 + 5×(streek-1)²`), en de basisterm daarna verder verlaagd van 15 naar 3 nadat bleek dat streek 2 nog altijd tientallen beurten kostte — issue: "de eerste cultuurdrempel is te hoog".

**Bouwvolgorde (hoofdstuk 13)**
- Volledige milestone-geschiedenis (M0 t/m M20d) staat in de milestone-tabel in hoofdstuk 13 — die tabel is zelf al een chronologisch overzicht en wordt daarom niet herhaald in dit hoofdstuk.
