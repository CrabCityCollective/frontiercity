# Frontier City — Design Document

Een rogue-like Civilization voor mobiel, waarbij je niet horizontaal een kaart ontdekt, maar verticaal een beschaving opbouwt in gestapelde lagen, richting een oceaan aan de overkant.

---

## 1. Kernconcept

- Je bouwt een beschaving **omhoog**, laag voor laag, in plaats van uit te breiden over een platte kaart.
- Drie soorten improvements: **city improvements** (in het centrum-vakje van een laag), **land improvements** (de omliggende vakjes — boerderijen, mijnen, af en toe een nieuwe stad), en **units**. Elke soort heeft zijn eigen interactie: voor een leeg land-vakje kies je eerst een **categorie** (Economisch, Wetenschappelijk, Militair, Civiel, Cultureel) en zie je daarna **alle land improvements** binnen die categorie die op dat moment geldig zijn (hoofdstuk 11); city improvements kies je via de pop-up die opent zodra je op de stad klikt, en units via hun eigen bestaande mechanisme (bv. het militaire scherm, hoofdstuk 6).
- **Win-conditie**: bereik de oceaan aan de overkant van een procedureel gegenereerd continent.

---

## 2. Ruimtelijk model

- Bovenaanzicht zoals klassieke Civilization, maar beperkt tot een **verticale band van 9 vakjes breed**.
- Onderste laag = startstad (begint aan een oceaan). Daarboven telkens nieuwe lagen. Onder die onderste laag toont het scherm een rij klikbare oceaan-tegels, zodat meteen duidelijk is waar de reis begint — puur sfeer/flavor-tekst bij een klik, niet bebouwbaar.
- **Fog of war** boven je huidige ontgrendelde grens; wordt weggehaald door cultuur te verzamelen.
- **Vooruitkijken**: je ziet standaard 1 laag verder dan je ontgrendelde grens (terreintype + vage dreigingsindicatie, geen exacte details). Uitbreidbaar via wetenschap-drempels (permanent, tot een max van 3-4 lagen) en via de Verkenner-unit (tijdelijke, gerichte blik verder).
- Elke laag heeft **9 bouwvakken**: middelste = stad (max 1 stad per laag), overige 8 = land improvements.
- Naast het terreintype van de hele laag (bv. "loofbos", zie hoofdstuk 8) heeft elk los vakje ook een eigen **terrein-subtype** (vlak/bos/heuvel/berg) — een laag is dus geen uniform blok, maar een mix. Dit subtype bepaalt of een specifiek land improvement er neergezet mag worden (zie hoofdstuk 3 en hoofdstuk 11, "Terrein-eisen per land improvement").
- Je speelt met **1 actieve frontier-stad** tegelijk. Sticht je een nieuwe stad (op een geschikte locatie, verderop), dan schuift het scherm op — je nieuwe stad begint onderaan, als nieuwe frontier.
- **Geschikte stichtingslocatie**: een nieuwe stad kan alleen gesticht worden op een vakje dat aan **vers water** ligt — een rivier of een meer. Dit is een los, vast vakje-kenmerk (net als het terrein-subtype uit hoofdstuk 3/11), zichtbaar op de kaart zodra de laag ontgrendeld is, zodat een speler er naartoe kan plannen. Voor de tutorial ligt dit vakje uitsluitend op de allerlaatste laag — de oceaan aan de overkant, zie hoofdstuk 10/13 — de enige plek in de hele tutorial met vers water, zodat het stichten van de laatste stad een bewuste, unieke bestemming aan het eind van de tocht is.
- Niet-volledig bebouwde lagen **sluiten permanent** zodra je een nieuwe stad start.
- Oudere, achtergelaten steden leveren **geen** lopende resource-inkomsten meer (bewust, voor het frontier-gevoel) — hun waarde zit in de specialisatie-relics die ze hebben opgeleverd voor je vertrok.

---

## 3. De vijf categorieën

| Categorie | City improvement (vb.) | Land improvement (vb.) | Unit | Relic (permanent, bij specialisatie) |
|---|---|---|---|---|
| **Economisch** | Markt (+2 goud/beurt), opslagplaats | Boerderij, mijn, houtkap, Amberader/goudmijn (interne sleutel `goudmijn`, tutorial-naam "Amberader" — hoofdstuk 14), (met "aardewerk"-tech) Voorraadkuil | Karavaan | Goedkopere improvements in elke volgende stad |
| **Wetenschappelijk** | Bibliotheek (+10 wetenschap/beurt), observatorium, universiteit | Sterrencirkel (produceert wetenschap, put niet uit — zie hoofdstuk 4/6) | Verkenner — in de MVP trainbaar en functioneel: onthult vakjes op een Bezette Laag (hoofdstuk 6), 10 wetenschap per Verkenning; de tijdelijke-extra-vooruitkijk-functie uit een eerdere versie van dit document blijft post-MVP | Permanent groter vooruitkijk-bereik |
| **Militair** | Barakken (+10 permanente legerwaarde, stad-breed, geen bemanning nodig — vereist stadsgrootte "middel"), muur, wapensmid | Wachttoren (verdedigt de hele laag tegen indringers, put niet uit — zie hoofdstuk 6); Legerkamp (bouwbaar op elke ontgrendelde laag, net als de Wachttoren-uitzondering — geeft toegewezen Soldaten legerwaarde bij een Confrontatie tegen een Bezette Laag, hoofdstuk 6; sinds issue "city improvements" pas bouwbaar na minstens 5 actieve Wachttorens én een Barakken, zie hoofdstuk 6/11/14) | Soldaat, ruiter, artillerie | Extra unit-slot / gratis startgarnizoen |
| **Civiel** | Aquaduct, riolering, woonwijk + grote woonwijk (= groei-tiers, klein→middel resp. middel→groot) | Weg, brug | Ingenieur (versnelt bouw) | Snellere groei-rijptijd in volgende steden |
| **Cultureel** | Tempel (+5 cultuur/beurt, vereist stadsgrootte "middel"), Grote Tempel (+10 cultuur/beurt bovenop een al gebouwde Tempel, dus samen +15 — een aparte, tweede slot, vereist stadsgrootte "groot"), amfitheater, monument | Heiligdom (put niet uit; volle cultuur alleen op de frontier-laag, anders de helft — zie hoofdstuk 6); Offer Altaar (ontgrendelt de Missionaris als trainbare unit, hoofdstuk 6; sinds issue "city improvements" pas bouwbaar na minstens 5 actieve Heiligdommen én een Grote Tempel, zie hoofdstuk 6/11/14) | Missionaris/diplomaat — in de MVP trainbaar zodra er een voltooid Offer Altaar staat: leidt cultuurproductie om naar de belegeringsmeter tegen een vijandelijk Heiligdom op een Bezette Laag (hoofdstuk 6); de culturele-pushback-diplomatie-functie uit een eerdere versie van dit document blijft post-MVP | Korting op cultuurkosten voor nieuwe lagen |

- "Weg" uit de tabel hierboven is voor de MVP geen gewone, met een categorie-keuze te bouwen land improvement meer, maar een apart settler-mechanisme — zie hoofdstuk 16. "Brug" blijft, net als de rest van de post-MVP-scope, voorlopig ongebouwd.
- Pool-grootte per categorie (basisversie): 6-8 city improvements, 4-6 land improvement-types, 2-3 units.
- Latere campagnes vervangen een deel van de generieke opties door thema-specifieke varianten.
- **City-improvement-capaciteit** (hoofdstuk 4/11/14, issue: "city improvements" Deel 1): een stad kan hoogstens een aan haar grootte gekoppeld aantal city improvements tegelijk hebben — klein 1, middel 3, groot 5. Bibliotheek, Markt, Barakken, Tempel en Grote Tempel concurreren om deze sloten (Tempel en Grote Tempel tellen als twee aparte sloten); Opslagplaats en de groei-tier-improvements (Woonwijk/Grote Woonwijk) vallen hier bewust buiten — zie hoofdstuk 4/11 voor de volledige onderbouwing.
- **Terrein-eisen**: sommige land improvements zijn beperkt tot een vakje-terreinsubtype (hoofdstuk 2) — houtkap alleen op **bos**, mijn en steengroeve alleen op **heuvel of berg**, boerderij alleen op **vlakke grond**, Voorraadkuil alleen op **vlakke grond**. Overige land improvements (heiligdom, sterrencirkel, wachttoren) hebben geen terrein-eis. Zie hoofdstuk 11 voor de reden achter deze keuze.
- **Amberader/goudmijn** (issue: "toevoeging Goud"): dezelfde terrein-eis en bouwkosten als een gewone mijn (heuvel/berg), maar met een aanvullende, vakje-specifieke eis bovenop het terreintype — niet elk heuvel/bergvakje heeft een amberader-vondst, in tegenstelling tot een gewone erts-mijn die op elk heuvel/bergvakje mag. Zie hoofdstuk 14 voor de exacte plaatsingskans t.o.v. erts en de gegarandeerde eerste locatie vanaf laag 7, en hoofdstuk 11 voor waarom goud, net als erts, een uitputtend improvement is.
- **Wetenschap in de MVP** (issue: "tech tree toevoegen"): de wetenschap-relic uit de tabel hierboven ("permanent groter vooruitkijk-bereik") blijft een latere post-MVP-uitwerking (hoofdstuk 13: "vooruitkijk-mechaniek verder dan 1 laag"). De MVP-functie van wetenschap is in plaats daarvan tweeledig: de **technologie-boom** (hoofdstuk 9/11/13/14, 3 drempels van elk 2 keuzes, geproduceerd door de Sterrencirkel) én, sinds "De Bezette Laag" (hoofdstuk 6), **Verkenning** (10 wetenschap per vakje) — een bewuste afweging tussen verder verkennen en voortgang in de technologieboom.

---

## 4. Groei, uitputting & verval (de kernspanning)

- **Stadsgrootte**: klein → middel → groot. Elke tier kost een civiel improvement + rijptijd (geen instant-klik) — Woonwijk voor klein→middel, Grote Woonwijk voor middel→groot (hoofdstuk 3/14, issue: "city improvements" Deel 2).
- **Hoe groter de tier, hoe meer city improvements je stad tegelijk kan dragen** (issue: "city improvements" Deel 1 — vervangt een eerder, nooit-gebouwd relic-slot-concept uit een vroegere versie van dit hoofdstuk): klein 1, middel 3, groot 5 gelijktijdige city improvements uit de gecapte pool (Bibliotheek, Markt, Barakken, Tempel, Grote Tempel — hoofdstuk 3/14). Opslagplaats valt hier bewust buiten (eigen, herhaalbare wachtrij, zie hoofdstuk 3/5); de Anker-verhaal-relics (hoofdstuk 9) zijn een volledig apart, ongewijzigd mechanisme — zie hoofdstuk 11 voor waarom deze twee "relic"-achtige systemen los van elkaar staan. Staat een stad al op haar maximum, dan zijn overige city improvements niet bouwbaar tot de stad groeit — maar hoe langer je blijft, hoe verder het omliggende land uitput.
- **Land improvements putten uit** (per type verschillende snelheid — mijnen sneller dan boerderijen), en worden daarna permanent **ghost-town-tiles**: onbebouwbaar, maar met kleine passieve culturele waarde en een rol in flavor-teksten aan het einde van een run. De teller telt pas af zodra het vakje daadwerkelijk **actief-producerend** is — dus gebouwd én via een wegverbinding met de stad verbonden (hoofdstuk 16). Staat een improvement nog te wachten op zijn wegverbinding, dan blijft de teller stilstaan: geen productie betekent geen uitputting.
- **Uitzondering: Wachttoren, Heiligdom en Sterrencirkel putten niet uit.** Ze blijven permanent actief in plaats van ooit een ghost-town-tile te worden — alledrie zijn een structurele, doorlopende aanwezigheid (wachtpost, cultusplek, sterrenobservatorium) in plaats van een verbruikende oogst zoals een mijn of boerderij: er is geen fysieke grondstof die opraakt. Zie hoofdstuk 6 voor wat ze in plaats daarvan wél doen (indringers afweren, cultuur produceren, wetenschap produceren).
- **Voedsel is de directe trigger van verval, niet landuitputting zelf**: een stad verbruikt elke beurt voedsel (hoe groter de tier, hoe meer monden), tegenover de voedselproductie van actieve, wegverbonden boerderijen. Dreigt die voorraad — bij het huidige tempo — binnen een paar beurten op te raken, dan verschijnt een **zichtbare waarschuwingsstatus** ("kritiek"); bouw je op tijd bij (extra boerderij, wegverbinding), dan wordt de status weer gezond. Landuitputting draagt hier alleen **indirect** aan bij: minder producerende tiles zetten de voedselbalans onder druk, maar veroorzaken zelf geen instorting meer.
- **Reageer je op tijd** (vertrekken/relics oogsten): je behoudt alles wat je tot dan toe hebt verdiend.
- **Negeer je het**: kans op volledige ineenstorting — **ook de relics van eerder voltooide tiers gaan dan verloren** (permadeath-risico op stadsniveau). Dit is de centrale risk/reward-gok van elke stad-episode.
- **In de huidige MVP-scope** (hoofdstuk 13: één stad, nog geen meerdere steden/frontier-verplaatsing) is er geen volgende stad om de run mee door te laten lopen: een volledige ineenstorting **eindigt de run** en start de tutorial opnieuw (nieuwe kleine stad, lege lagen, beurt 1). Zodra meerdere steden/frontier-verplaatsing bestaat, kan dit weer een puur stads-niveau-permadeath worden terwijl de run zelf naar de volgende stad doorloopt.
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
- **Cultuur** → laag-ontgrendeling
- **Wetenschap** → technologie-boom (3 drempels van elk 2 keuzes, permanente effecten — hoofdstuk 3/9/11/14; het vooruitkijk-bereik uit een eerdere versie van dit document is post-MVP, hoofdstuk 13)

**Bouwen**: geen instant-klik, maar een productiewachtrij — verbruikt elke beurt bouwmateriaal tot voltooiing. Hogere materiaalinkomsten = snellere bouw. Ingenieur-unit versnelt dit extra. Militair heeft bewust géén eigen valuta: puur directe krachtsvergelijking op het moment zelf.

**Rush-bouwen met goud** (issue: "toevoeging Goud" Deel 2 — de eerste functie van goud): een lopend bouwproject in de productiewachtrij hierboven kan versneld worden door **5 goud per weggekochte beurt** te betalen — de speler koopt zo een deel of de hele resterende bouwtijd in één keer af (bijv. nog 3 beurten te gaan × 5 goud = 15 goud voor directe voltooiing), of desgewenst maar een deel van de beurten als het goud niet toereikend is voor alles. Geldt uitsluitend voor **land improvements en city improvements** — nooit voor de technologieboom (hoofdstuk 3/9/11), die drempel houdt bewust zijn eigen tempo (zie hoofdstuk 11). Een duidelijke "versnel met goud"-knop bij een lopend bouwproject toont zowel de volledige rush-kosten als de daadwerkelijke goudvoorraad van de speler.

---

## 6. Militair & culturele pushback

**Directe militaire confrontatie:**
- Vergelijking van totale legerwaarde (units + muur/wachttoren-bonus) vs. tegenstander, met een **winkans** (geen gegarandeerde uitkomst).
- Winst: normale uitkomst, mogelijk buit. Verlies: schade (versnelde uitputting van getroffen tiles), geen instant game-over.
- In de huidige MVP (tutorial) komt dit generieke patroon concreet tot uiting via de **Bezette Laag** hieronder — de eerdere, kleinere "militaire confrontatie op laag 12"-placeholder is daarmee volledig vervangen. De winkans-formule en het `eigen/(eigen+vijand)`-principe blijven gelijk; alleen de eigen-legerwaarde-berekening en het verlies-effect zijn voor deze variant herzien (zie "Bezette Laag & Confrontatie" hieronder).

**Culturele pushback (sterke tribe weerstaat expansie):**
- Geen gevecht — een **oplopende cultuurkostprijs** (bijv. dubbel) voor het ontgrendelen van die specifieke laag.
- Diplomatiek keuzemoment: **Erkennen/aanpassen** (permanente kleine wederzijdse korting), **Doordrukken** (hogere kost nu, blijvend hogere basiskost daarna), of **Terugtrekken** (laag laten zitten, zijwaarts verder zoeken indien mogelijk).

**Wachttoren & indringers:**
- Het mechanisme is pas actief zodra de speler **laag 2** heeft ontgrendeld — daarvóór gebeurt er nooit iets, zodat de speler eerst iets kan opbouwen (verlaagd vanaf de eerdere drempel van laag 3).
- Elke beurt is er, zodra die drempel gehaald is, **één trekking** (MVP-richtwaarde 20%, tunebaar — hoofdstuk 14; verlaagd vanaf de eerdere 40%) of er sowieso een incident plaatsvindt — niet meer een aparte kans per laag, maar één kans per beurt voor de hele stad. Dat houdt het tempo van indringers-incidenten constant, ongeacht hoeveel lagen er al ontgrendeld zijn.
- Is er een incident, dan wordt de getroffen laag geloot uit **álle ontgrendelde lagen die iets te bieden hebben** — ook de startlaag en lagen waar alleen nog ghost towns staan. Een laag doet **niet** mee als het enige wat erop staat een Wachttoren is, en er verder geen andere improvements en geen ghost towns zijn: zo'n kale wachtpost biedt indringers niets te halen. Dit geldt ongeacht de staat van die Wachttoren — ook een Wachttoren die nog in aanbouw is of nog niet bemand is, maakt de laag niet interessant. Beschermde lagen (met een voltooide, bemande, verbonden Wachttoren) blijven wél gewoon meeloten zodra er ook maar iets anders op staat; de Wachttoren houdt het incident daar tegen (zie hieronder), ongewijzigd. Zijn er die beurt geen in aanmerking komende lagen, dan gebeurt er niets. Een pop-up meldt het incident met een korte flavor-tekst, tribenaam (bijv. "de stam van de Halve Maan" of "de stam van de Bloedhoeven") en de betrokken laag.
- **Amberader vergroot de aantrekkelijkheid** (hoofdstuk 3/14, issue: "Amberader: bonus/malus-koppeling" — de eerste rogue-like bonus/malus-koppeling, zie hoofdstuk 11): zolang een laag een **actieve** Amberader heeft (gebouwd, nog niet uitgeput), weegt die laag in de trekking hierboven **2× zo zwaar** mee als een vergelijkbare laag zonder Amberader (MVP-richtwaarde, tunebaar — hoofdstuk 14) — het waardevolle materiaal trekt ongewenste aandacht. Dit werkt bovenop, niet in plaats van, de bestaande regels: een laag met alleen een Wachttoren blijft uitgesloten (zie hierboven), en een beschermde laag houdt het incident nog steeds tegen zoals gewoonlijk — de Amberader vergroot alleen de kans dat de laag geloot wordt, niet de uitkomst daarna. Is de Amberader uitgeput (ghost town), dan vervalt dit extra gewicht meteen weer — een lege put trekt niemand meer.
- **Bouwen op elke ontgrendelde laag**: de algemene regel is dat bouwen alleen op de huidige frontier-laag kan (hoofdstuk 11). De Wachttoren is daar een expliciete uitzondering op — hij mag op elke al ontgrendelde laag gebouwd worden, ook lagen die de speler allang achter zich heeft gelaten. De overige bouwregels blijven gelden: de Wachttoren kost gewoon zijn materialen en bouwtijd, en de wegverbindings-eis voor bescherming (zie hieronder) blijft staan — in de praktijk zelden een blokkade, want oude lagen hebben meestal al wegen uit de tijd dat ze zelf de frontier waren.
- Een Wachttoren beschermt de laag waarop hij staat alleen als hij **voltooid, bemand én via een aaneengesloten wegketen met de stad verbonden** is — alle drie de voorwaarden (zie ook hoofdstuk 16). Een wachtpost moet bevoorraad worden om te kunnen functioneren; zonder wegverbinding telt een Wachttoren dus niet mee, ook al staat hij er en is hij bemand. Onbemand of onverbonden biedt hij geen bescherming en telt zijn verdedigingsbonus ook niet mee bij een directe militaire confrontatie. Zo'n werkende Wachttoren beschermt niet alleen zijn eigen laag, maar ook **de laag direct daaronder** (issue: "wachttoren beschermt 2 lagen") — niet verder, en nooit de laag erboven. Valt het incident op een laag met zo'n beschermde Wachttoren (op de laag zelf, of op de laag erboven), dan wordt — sinds de tweede rogue-like bonus/malus-koppeling hieronder — een derde uitkomst geloot, in plaats van dat de Wachttoren altijd zomaar stand houdt.
  - **Bemannen**: in het militaire scherm ziet de speler zijn opgeleide strijders als los aanklikbare icoontjes. Een klik op een nog niet toegewezen strijder opent een keuze ("kies een wachttoren"); de daaropvolgende klik op een actieve Wachttoren-tile op de kaart bemant die.
  - **Terughalen (omkeerbaar)**: anders dan in een eerdere versie is toewijzing niet meer permanent. Een klik op een al bemande strijder haalt hem terug van zijn Wachttoren (die daarmee meteen onbemand raakt, tenzij een andere strijder hem overneemt). De teruggehaalde strijder is meteen weer elders inzetbaar — verplaatsen tussen Wachttorens kost geen beurten (issue: "wachttoren tweaks"; een eerdere versie liet de strijder hier nog 2 beurten "onderweg" zijn, maar dat bleek in de praktijk vooral wachttijd toevoegen zonder de keuze zelf interessanter te maken).
  - **Bemanningskosten**: elke bemande Wachttoren verbruikt **1 voedsel per beurt**, bovenop het bestaande stadsverbruik (klein 2, middel 4, groot 6 — hoofdstuk 14). Dit telt mee in de voedselbalans die de verval-waarschuwing bepaalt (hoofdstuk 4).
- **Een beschermde laag houdt niet langer altijd zomaar stand: de tweede rogue-like bonus/malus-koppeling** (hoofdstuk 11/14, issue: "wachttorens kunnen vernietigd worden door indringers" — na de Amberader-malus hierboven de tweede). Geldt voor **elke** beschermde, ontgrendelde laag die getroffen wordt — een oudere, achtergelaten laag net zo goed als de frontier-laag zelf; er is hier geen onderscheid. Bij zo'n incident wordt een uitkomst geloot, van vaakst naar zeldzaamst:
  - **Stand houden** (MVP-richtwaarde **85%**, tunebaar — hoofdstuk 14): het bestaande gedrag, ongewijzigd — de pop-up meldt dat de wachttoren stand houdt en de indringers zich terugtrekken zonder iets te nemen.
  - **Malus — overrompeld** (MVP-richtwaarde **10%**, tunebaar): ondanks de bescherming wordt de beschermende Wachttoren-tile alsnog vernietigd. Zelfde afhandeling als een verloren Confrontatie tegen een Bezette Laag (hierboven): de tile wordt een **ruïne** (op dezelfde plek herbouwbaar tegen de normale Wachttoren-kosten/bouwtijd), en de strijder die hem bemande is blijvend verloren — moet als nieuwe Soldaat volledig opnieuw opgeleid worden, geen reassignment.
  - **Bonus — buit** (MVP-richtwaarde **5%**, tunebaar): de bemanning slaat de aanval niet alleen af, maar buit ook iets van de indringers — **+6 goud** (MVP-richtwaarde, tunebaar — hoofdstuk 14), direct aan de gedeelde opslag toegevoegd (binnen de gewone opslag-cap, hoofdstuk 5).
  - **Amberader onder vuur**: onafhankelijk van deze drie uitkomsten, en onafhankelijk van of de laag beschermd is — zie de aparte pop-up hieronder.
- **Drie korte pop-ups**, zelfde register als de bestaande indringers-/kudde-/roofdier-pop-ups:
  1. **Amberader onder vuur**: wordt een laag met een **actieve** Amberader (gebouwd, nog niet uitgeput) getroffen door een indringers-incident, dan verschijnt eerst een korte pop-up die aangeeft dat de indringers specifiek op de amber afkomen — onafhankelijk van de uiteindelijke uitkomst (stand houden/malus/bonus), en ook bij de gewone, onbeschermde tribuut-afhandeling hieronder (niet alleen bij de nieuwe malus/bonus-uitkomsten hierboven).
  2. **Wachttoren afgebroken**: bij de malus-uitkomst hierboven — meldt dat de Wachttoren overrompeld is en tot ruïne is vervallen, en dat de strijder verloren is.
  3. **Buit binnengehaald**: bij de bonus-uitkomst hierboven — meldt dat de bemanning de aanvallers heeft verslagen én goud heeft buitgemaakt, met het gewonnen bedrag.

  Zijn zowel de Amberader-aankondiging als een malus/bonus-uitkomst van toepassing op hetzelfde incident, dan verschijnen ze na elkaar (eerst de aankondiging, dan de uitkomst) — nooit gecombineerd tot één bericht.
- Valt het incident op een laag **zonder** beschermende Wachttoren, dan eisen de indringers **tribuut**: ongeveer de helft van het grondstof-type (hout/steen/erts/goud) waar de speler op dat moment het meest van heeft — het spel eist nooit meer dan er daadwerkelijk in voorraad is. De laag waar het incident plaatsvindt bepaalt alleen wáár het gebeurt, niet wat er geëist wordt: de hoogte van het tribuut hangt alleen af van de totale voorraad.
  - **Geven**: de pop-up toont eerst hoeveel tribuut geëist wordt; kiest de speler ervoor te betalen, dan bevestigt een laatste scherm dat bedrag nog eens voordat de indringers zich terugtrekken. Pas zodra de speler dat laatste scherm sluit, wordt het tribuut daadwerkelijk van de gedeelde opslag afgetrokken (issue: "wachttoren tweaks") — niet al bij de keuze om te betalen.
  - **Weigeren**: de indringers verwoesten de stad, en de speler valt terug op de vorige stad — als die er is. In de huidige MVP-scope (hoofdstuk 13: één stad, nog geen frontier-verplaatsing) is die vorige stad er nooit, dus wordt het tribuut in dat geval alsnog betaald (de pop-up legt dit uit zodra het zich voordoet). Zodra meerdere steden bestaan, wordt "weigeren zonder wachttoren" een echt risico: de actieve stad gaat verloren en de speler valt terug op de voorgaande.

**Heiligdom & de frontier:**
- Een Heiligdom produceert onbeperkt cultuur, ook nadat de frontier verder omhoog is getrokken — het put, net als de Wachttoren, niet uit (hoofdstuk 4).
- Alleen als het Heiligdom op de frontier-laag zelf staat, levert het de volle opbrengst; op elke laag daaronder levert het nog maar de **helft**. Dat beeldt uit dat een Heiligdom vooral nabije, nog niet "eigen" stammen omtovert tot de eigen stam — een effect dat afneemt naarmate de laag verder van het actieve grensgebied af komt te liggen.
- De **Sterrencirkel** (hoofdstuk 3/9, issue: "tech tree toevoegen") volgt voor wetenschap exact hetzelfde patroon: onbeperkte productie, put niet uit, volle opbrengst op de frontier-laag en de helft daaronder — dezelfde reden (nabije observatie/kennis weegt zwaarder dan een verre).

**Bezette Laag & Confrontatie** (issue: "De Bezette Laag, missionaris en verkenner" — vervangt de eerdere, kleinere "militaire confrontatie op laag 12"-placeholder volledig; hoofdstuk 10 voor de tutorial-scripting op laag 12, hoofdstuk 14 voor alle tunbare getallen):

Een generiek, herbruikbaar mechanisme (ook voor latere campagnes) voor een laag die niet op de gebruikelijke manier ontgrendelt, maar eerst opgelost moet worden via Verkenning, Belegering en Confrontatie.

- **Uiterlijk**: een Bezette Laag krijgt vijandelijke Wachttoren- en Heiligdom-tiles (dezelfde tile-typen als de eigen versies, met een duidelijk andere skin/kleur — geen nieuwe game-logica voor het uiterlijk zelf) verspreid over de land-vakjes, plus af en toe een puur cosmetisch "huisje"-tegeltje: geen economische functie, niet interactief, nooit een Confrontatie- of Belegeringsdoel, en permanent onbebouwbaar. Geen enkele vijandelijke economische improvement (geen mijn/boerderij/etc.). Elk vakje is bovendien individueel **verhuld** — een eigen, per-tegel verhullingslaag los van de gewone laag-brede fog-of-war (hoofdstuk 2) — totdat het via Verkenning onthuld wordt.
- **Wat het betekent voor de speler**: zodra de laag "in beeld komt" (dezelfde soort trigger als een gegarandeerde vondst, bijv. de Amberader op laag 7 — hoofdstuk 14), toont een dynamische pop-up uitleg. Zolang de laag bezet is: de normale cultuur-voortgang richting haar ontgrendeling **bevriest volledig** (de cumulatieve cultuurteller stopt met oplopen, maar gaat niet verloren — de frontier blijft op de laag eronder staan), en er kan op de Bezette Laag zelf niet gebouwd worden. Elders blijft alles gewoon werken, inclusief het bouwen van het Offer Altaar en het Legerkamp hieronder.
- **Verkenning**: vereist een gebouwde, beschikbare **Verkenner**-eenheid (hoofdstuk 3) — een losse actie, gescheiden van de settler-acties (hoofdstuk 16/17), hoogstens 1 keer per beurt. Kost wetenschap uit dezelfde pool als de technologie-boom (hoofdstuk 3/9) — een bewuste afweging tussen verder verkennen en voortgang in de techboom. Onthult één gekozen vakje als Wachttoren, Heiligdom of cosmetisch huisje.
- **Offer Altaar, Missionaris & Belegering**: het Offer Altaar (culturele land improvement, normale frontier-only bouwregel) ontgrendelt de **Missionaris**-unit als trainbare optie. Zodra een vijandelijk Heiligdom onthuld is, wordt het een belegeringsdoel — de belegeringsmeter voor de laag vult zich met cultuur-inkomen, maar uitsluitend zolang de speler minstens één Missionaris heeft: zonder Missionaris blijft de bevroren cultuurteller gewoon bevroren en gebeurt er niets; mét Missionaris wordt nieuwe cultuurproductie (van Heiligdommen die de speler al elders bezit) omgeleid naar de belegeringsmeter in plaats van verloren te gaan (vereist alleen dat er ergens minstens één Missionaris bestaat, geen fysieke verplaatsing naar een specifiek Heiligdom-vakje — een bewuste scope-vereenvoudiging). Bereikt de meter de drempel, dan wordt één nog-actief-vijandelijk Heiligdom vernietigd (bij meerdere: het eerst-onthulde) en begint de meter weer bij 0 voor het volgende. Een pop-up meldt zowel het onthullen als het vernietigen van een vijandelijk Heiligdom.
- **Legerkamp & Confrontatie tegen een vijandelijke Wachttoren**: het Legerkamp (militaire land improvement) is, net als de Wachttoren, bouwbaar op elke ontgrendelde laag (zelfde uitzondering, zelfde reden: een gestationeerde Soldaat kan zelf naar een Bezette Laag marcheren, ongeacht waar het Legerkamp staat). Een Soldaat kan aan een Legerkamp toegewezen worden — zelfde soort bemanningsinteractie als een Wachttoren (kies een strijder, kies een tile op de kaart), en net zo omkeerbaar en instant. Zodra een vijandelijke Wachttoren-tile onthuld is, wordt een Confrontatie tegen die specifieke tile mogelijk — **maar alleen als de speler al een voltooide, bemande, wegverbonden eigen Wachttoren heeft op de laag direct onder de Bezette Laag** (dezelfde "beschermt ook de laag eronder"-relatie als hierboven). Zonder die eigen Wachttoren is de actie niet beschikbaar (uitgegrijsd), geen mislukte poging. Eigen legerwaarde voor déze Confrontatie = de verdedigingsbonus van die eigen Wachttoren plus de opgetelde legerwaarde van alle Legerkamp-toegewezen Soldaten (ongeacht op welke laag) — een andere formule dan de gewone, algemene legerwaarde. De vijandelijke Wachttoren krijgt een legerwaarde vergelijkbaar met de zwaarste tegenstander die de speler tot dan toe is tegengekomen (in de tutorial: hetzelfde oplopende dreigingsniveau dat de laag toch al draagt). Winst: de vijandelijke Wachttoren wordt vernietigd — de tile telt vanaf dan als "opgeruimd". Verlies: de eigen beschermende Wachttoren wordt een **ruïne** (op dezelfde plek herbouwbaar tegen de normale kosten/bouwtijd), en de strijder die hem bemande is blijvend verloren — moet als nieuwe Soldaat volledig opnieuw opgeleid worden, geen reassignment (in tegenstelling tot de normale, omkeerbare bemannings-regel hierboven). Legerkamp-toegewezen strijders blijven bij verlies gewoon behouden.
- **Einde van de Bezette Laag**: zodra alle vijandelijke Heiligdommen vernietigd zijn, wordt de hele laag in één keer volledig onthuld (ook nog niet individueel verkende vakjes), eindigt de Bezette-status, en telt de laag vanaf dan als normaal ontgrendeld — de bevroren cultuurteller ontdooit en telt weer gewoon door richting de normale drempel voor de vólgende laag. Nog niet geconfronteerde vijandelijke Wachttoren-tiles blijven daarna staan als permanente, niet-bebouwbare decoratieve tiles (vergelijkbaar met een ghost town, hoofdstuk 7) — zelfde behandeling voor de cosmetische huisjes. Normaal bouwen wordt weer mogelijk op de overige vakjes.

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

- **Worldgen** (hoogte/lengte van continent, terrein, obstakels) blijft **random** per run — dat blijft het ontdekkingsgevoel.
- Een **campagne** legt daar een thema-laag overheen: tribe-roster/gedrag, unieke units/gebouwen, en **campagne-specifieke multipliers** op bestaande mechanica (bijv. uitputtingssnelheid, pushback-frequentie) — geen aparte kernmechanica per campagne.
- **Vertakkend verhaal**: een paar vaste "ankerpunten" (gekoppeld aan laag-hoogte-range, niet aan één exacte laag) met 2-3 betekenisvolle keuzes per anker. Latere ankers reageren op eerdere keuzes (keuzeboom), tot een gedeelde kernscène met tonale varianten bij het laatste anker (voorkomt dat elk pad apart volledig uitgeschreven moet worden).
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

**Toon**: donkerder en minder heroïsch dan klassieke western-verhalen — geïnspireerd op de sfeer van *Blood Meridian*. Geen morele framing door het spel zelf; geweld en keuzes worden beschreven, niet beoordeeld.

### Anker 1 (laag 8-10) — Eerste contact
Twee keuzes (geen neutrale derde optie):
- **Handel aanbieden** → kleine economische bonus nu; de tribe groeit sterker mee met jouw voortgang.
- **Land claimen** → gratis land improvement-vakje nu; start een **zichtbare wrokmeter** die oploopt tot Anker 2.

### Anker 2 (laag 16-18) — vertakt per keuze uit Anker 1

*Vanuit Handel:*
- **Verdrag sluiten** → permanente/vergrote economische relic; tribe blijft neutrale sterke buur.
- **Ruil ondermijnen** → grote eenmalige economische boost; tribe wordt blijvend vijandig.

*Vanuit Land claimen (wrokmeter vol):*
- **Terugvechten** → directe militaire confrontatie; winst = lagere wrok maar beschadigde laag (versnelde uitputting); verlies = richting stadsverval.
- **Tribuut aanbieden** → wrok daalt fors, eenmalig fors verlies van huidige opbrengst; geen garantie voor de toekomst.

### Anker 3 (richting oceaan) — vier tonale/mechanisch verschillende varianten
Gedeelde flavor-kern, uitkomst (winnen) gelijk voor iedereen, maar elk pad krijgt een eigen soort obstakel:
- **Na Verdrag**: tolgang-onderhandeling (resource-management, geen gevecht) — bijv. met Comanche onder Buffalo Hump.
- **Na Ruil ondermijnen**: pure militaire confrontatie, zwaarste directe slag — bijv. Apache onder Mangas Coloradas.
- **Na Terugvechten**: lange, uitputtende tocht over meerdere half-uitgeputte lagen (uithoudingstest, geen piekmoment).
- **Na Tribuut**: moreel/strategisch dilemma — permanent relic-verlies voor gegarandeerde doorgang, óf onvoorbereid gevecht.

### Flavor-tekststijlgids
1. Korte, vaak enkelvoudige zinnen — kracht in understatement.
2. Geen emotie-bijvoeglijke naamwoorden ("verschrikkelijk", "triomfantelijk").
3. Geen moreel oordeel in de tekst ("helaas", "terecht").
4. Concreet/zintuiglijk boven abstract (geur, geluid, licht i.p.v. sfeerbeschrijving).
5. Herhaling/cadans als bewust stijlmiddel ("geen X, geen Y").
6. Historische namen/volken mogen gebruikt worden, functioneel beschreven — geen karikatuur.
7. Stiltes toegestaan — een flavor-tekst hoeft niet samen te vatten wat er net gebeurde.

---

## 10. Tutorial — "De Eerste Vuren" (Het Hertenpad-volk)

Fictieve neolithische stam, sfeer geïnspireerd op *De Stam van de Holenbeer* — overleving en verwondering in plaats van morele ambiguïteit.

Eén nieuw mechaniek per laag, oplopend:

| Laag | Mechaniek |
|---|---|
| 1 | Land improvement bouwen |
| 2 | Categorie-keuze voor land improvements (alle geldige opties binnen de categorie) |
| 3-4 | Drie bouwmaterialen (hout/steen/erts) |
| 5 | Uitputting (laagdrempelig voorbeeld) |
| 6-7 | Cultuur → laag ontgrendelen |
| 8 | Wetenschap → technologie kiezen (drempel 1 van de technologie-boom, hoofdstuk 3/9/14) |
| 9 | Zeldzaamheid (verborgen tot bouwen) |
| 10 | Groei-gok |
| 11 | Waarschuwingssignaal bij verval (gescript, ongevaarlijk) |
| 12 | Bezette Laag & Confrontatie (hoofdstuk 6) |
| 13 | Stad stichten aan de oceaan (vers water — de enige plek in de hele tutorial) |

**Laag 10 in het bijzonder:** dit is de eerste keer dat de speler de volledige inzet van hoofdstuk 4 voelt — een ineenstorting hier beëindigt de hele tutorial-run, net zoals later in een echte campagne. De tutorial waarschuwt de speler dan ook expliciet wat er op het spel staat: zodra de voedselstatus "kritiek" wordt (de zichtbare waarschuwingsstatus uit hoofdstuk 4, die al een paar beurten vóór een mogelijke instorting verschijnt), krijgt de speler een duidelijke melding dat doorgroeien nu een echte gok is en dat bij een instorting de hele stad — inclusief alle tot dan toe verdiende relics — verloren gaat. Dat de speler dit risico ruim van tevoren kan zien aankomen, is wat deze laag uitdagend houdt zonder oneerlijk te worden.

**Laag 12 — De Bergkam, de Bezette Laag:** de climax vlak vóór het stichten op laag 13, en de eerste keer dat de speler iemand tegenkomt die niet van het Hertenpad-volk is. Vervangt de eerdere, kleinere "militair/verdediging"-placeholder volledig — zie hoofdstuk 6 voor het volledige Bezette-Laag-mechanisme (Verkenning, Offer Altaar/Missionaris/Belegering, Legerkamp/Confrontatie). Het bereiken van laag 12 is bewust **niet** het tutorial-einddoel (dat blijft het stichten op laag 13, hoofdstuk 2/16) — de laag hoeft dus niet "gewonnen" te worden om door te kunnen naar laag 13, al blijft de frontier er wel op vastzitten tot alle vijandelijke Heiligdommen vernietigd zijn.

**Laag 13 — de oceaan aan de overkant:** de allerlaatste laag van de tutorial, en de enige plek in de hele tutorial met een vakje aan vers water (hoofdstuk 2) — precies de win-conditie uit hoofdstuk 1 ("bereik de oceaan aan de overkant"), hier alvast voelbaar gemaakt binnen de eenvoudigere tutorial-scope. Zodra deze laag in beeld komt, krijgt de speler een gerichte pop-up die uitlegt hoe je hier een stad sticht en dat dit de run beëindigt.

**Einddoel: je eerste stad stichten.** De afsluiting van de tutorial is niet langer "bereik laag 12", maar **je eerste stad stichten op de frontier** (hoofdstuk 2/16) — precies waar het spel zijn naam aan ontleent. Zodra de settler op het vers-water-vakje van laag 13 staat en de speler genoeg grondstoffen heeft gespaard (hoofdstuk 14), kan hij stichten; de speler wordt daarbij duidelijk gewaarschuwd dat de settler bij het stichten verdwijnt ("de huifkar wordt de stad"). De speler is niet verplicht meteen te stichten zodra dat kan — hij mag ook gewoon nog even ronddolen op de oceaanoever en later stichten. **Update (issue #187, "stad stichten veel goedkoper")**: de stichtingskosten zijn 4x verlaagd (hoofdstuk 14) en dwingen daardoor niet langer een Opslagplaats af vóór het stichten — dat was met de oorspronkelijke, hogere kosten wel het geval. Laag 12 blijft wel zijn eigen mechaniek-les (de Bezette Laag, hoofdstuk 6/10) — anders dan de eerdere, kleinere placeholder-versie moet de speler haar nu wél daadwerkelijk oplossen (alle vijandelijke Heiligdommen vernietigen) voordat de frontier verder kan naar laag 13: de laag blijft er zelf op vastzitten zolang ze bezet is.

Bij het stichten: afsluitende scène, opent het campagnemenu (alleen Amerikaanse frontier beschikbaar; overige campagnes ontgrendelen daarna). Tutorial-save blijft apart bestaan/speelbaar. Er volgt in de MVP nog **geen** volledige frontier-verplaatsing (scherm dat opschuift, oude lagen die sluiten, relics die worden toegekend, hoofdstuk 2/13) — dat hoort bij de Amerikaanse campagne; het stichten is in de tutorial het eindpunt zelf.

**Namen:**
- Hoofdstuktitel: **"De Eerste Vuren"**
- Stam van de speler: **Het Hertenpad-volk**
- Mogelijke NPC-stam (indien nodig): Het Steenhoorn-volk / De Rivierwakers
- Steden hebben, net als tribes, een eigen naam (los van de stam die er woont) — zichtbaar zodra je op de stad-tile klikt, en waar relevant terug te laten komen in flavor-teksten. Prehistorisch klinkende voorbeeldnamen, in de stijl van *De Stam van de Holenbeer*: **Holenrots**, **Vuurbron**, **Asvallei**. De eerste stad (het startkamp van het Hertenpad-volk) heet **Holenrots**. In de MVP is dit de enige stad; zodra meerdere steden/frontier-verplaatsing bestaat (post-MVP, hoofdstuk 13), kunnen de overige namen als volgende stadsnamen dienen — `City.naam` (hoofdstuk 13) ondersteunt dit al.

---

## 11. Belangrijkste ontwerpoverwegingen

Een aantal kernbeslissingen is bewust gemaakt na afweging van alternatieven. Hieronder de belangrijkste, met de reden achter de keuze.

**Boom-structuur i.p.v. letterlijke stapel-toren**
Een letterlijke verticale stapel van alle improvements door elkaar zou visueel rommelig worden zodra city- en land-improvements samen op één kolom staan. De boom/frontier-band-structuur (stad als stam, land improvements als uitlopers, nieuwe steden als nieuwe stammen) houdt de drie improvement-soorten visueel en conceptueel gescheiden, terwijl de "naar boven groeien"-fantasie behouden blijft.

**Land improvements: categorie kiezen, dán alle geldige concrete opties zien (niet een willekeurige subset)**
Dit geldt specifiek voor **land improvements** — city improvements en units lopen niet via dit mechanisme (zie hoofdstuk 1). Eén keuzemoment (direct een specifieke improvement kiezen) zou minder diepte geven dan twee gelaagde momenten: eerst een richting (categorie) bepalen, dan een concrete keuze binnen die richting maken. Een eerdere versie toonde daarna een willekeurige subset van 2-3 opties uit de categorie-pool, maar dat kon ertoe leiden dat de speler precies de land improvement niet aangeboden kreeg die zijn economie op dat moment nodig had (bijvoorbeeld een tekort aan erts terwijl er geen mijn in de aanbieding zat) — dat voelde niet als een interessante keuze, maar als een gemiste kans. Door in plaats daarvan alle geldige land improvements binnen een categorie te tonen (gefilterd op vervulde voorwaarden zoals terreineisen, maar niet meer willekeurig beperkt), wordt resource-planning een echte, uitvoerbare vaardigheid: met 4-6 land improvement-types per categorie (hoofdstuk 3) blijft de lijst vanzelf behapbaar voor een mobiel scherm. De onvoorspelbaarheid van het spel blijft intact via andere systemen: verborgen zeldzaamheid, procedurele worldgen, de vertakkende Anker-verhalen, en de indringers-trekking (hoofdstuk 6/9/14).

**Geen resource-inkomsten en geen veiligheidsnet van achtergelaten steden**
Dit is een bewuste keuze om het "frontier"-gevoel scherp te houden: als oude steden gewoon door bleven produceren, zou er een veilige, passieve thuisbasis ontstaan en verdwijnt de noodzaak om steeds verder te trekken. Door specialisatie-relics wél permanent te maken (als beloning), maar lopende inkomsten niet, blijft vooruitgang komen uit wat je hebt veroverd, niet uit wat je passief bezit.

**Hard verval (permadeath van relics) i.p.v. zachte aftakeling**
Zachte aftakeling (een stad die langzaam minder oplevert tot je vertrekt) is altijd veilig zolang je op tijd weggaat — er is dan geen echt risico. Hard verval, waarbij ook al verdiende relics verloren kunnen gaan bij een misrekening, geeft een echt risk/reward-moment: doorgroeien voor een extra relic-slot is een bewuste gok, geen gratis extra beloning. Het zichtbare waarschuwingssignaal zorgt ervoor dat dit risico eerlijk aanvoelt (voorspelbaar te vermijden) in plaats van willekeurig.

**De permadeath-dreiging geldt ook in de tutorial, zonder uitzondering**
De groei-gok op laag 10 (hoofdstuk 10) is bewust géén ongevaarlijke oefening: een ineenstorting beëindigt ook daar de hele run, precies zoals hoofdstuk 4 beschrijft. Een tutorial waarin niets echt op het spel staat, zou de speler nooit laten voelen waarom groeien versus op tijd vertrekken de kernspanning van het hele spel is — en dus ook niet waarom het spel de moeite waard is. Dat het risico ruim van tevoren zichtbaar aankomt (het waarschuwingssignaal uit hoofdstuk 4, hier expliciet uitgelicht in hoofdstuk 10) houdt dit uitdagend in plaats van oneerlijk: de speler maakt de gok bewust, in plaats van hem per ongeluk te verliezen. Echte inzet vanaf het begin is dus een bewuste ontwerpkeuze, geen omissie.

**Volledige ineenstorting eindigt in de MVP de hele run**
Zolang er maar één stad is (hoofdstuk 13), heeft een ineenstorting geen "volgende stad" om naar door te schuiven — de stad die instort, is de enige stad. Een stad laten voortbestaan in verzwakte vorm (geen relics, kleine tier) zou het permadeath-risico uit hoofdstuk 4 juist ondermijnen: de speler kan dan gewoon doorspelen alsof er niets gebeurd is. Door de run in dat geval echt te beëindigen en de tutorial opnieuw te starten, blijft de inzet van "doorgroeien voor een extra relic-slot" reëel, ook zonder dat er al een frontier-verplaatsing naar een nieuwe stad bestaat.

**Geen kunstmatige tijdsdruk/klok**
Een oprukkende dreigingstimer (zoals in veel rogue-likes) werd bewust weggelaten omdat de vergelijkbare historische frontier-situaties ook geen "klok" kenden — en omdat schaarste (uitputting van land, uitputting van vooruitzicht op groei) al een intrinsieke, thematisch passende reden geeft om door te bewegen. Een extra klok erbovenop zou dubbelop en kunstmatig aanvoelen.

**Zeldzaamheid van land improvements pas zichtbaar na bouwen**
Vooraf zichtbare zeldzaamheid zou het bouwen puur een optimalisatie-keuze maken ("bouw ik hier de zekere optie of gok ik op een goudmijn"). Door de uitkomst pas na het bouwen te onthullen, wordt élke bouwactie een klein gokmoment, wat beter past bij het rogue-like karakter van het spel dan een volledig planbare economie.

**Eén gedeelde opslag i.p.v. één-resource-kiezen (zoals in Frostpunk)**
Frostpunk dwingt spelers één opslagtype te kiezen per gebouw, wat in de praktijk onrealistisch aanvoelt (waarom zou je geen hout én steen naast elkaar kunnen opslaan?). Een gedeelde opslag met een gezamenlijke cap is intuïtiever en legt de spanning waar die hoort: bij de totale capaciteit, niet bij een kunstmatige keuze tussen fysiek vergelijkbare goederen. Voedsel kreeg wel een aparte voorraad, omdat het conceptueel een ander doel dient (groei-drempels) dan bouwmateriaal.

**Kwadratisch in plaats van exponentieel cultuurkosten**
De oorspronkelijke cultuurkosten-formule (basis 20, ×1,4 per laag, hoofdstuk 14) schaalde exponentieel, terwijl het daadwerkelijke cultuurinkomen — in de MVP vrijwel volledig het Heiligdom (hoofdstuk 6) — ruwweg lineair groeit naarmate een speler er in de loop van een run meer bouwt. Voor de 12-laags tutorial viel dat verschil nog te verbergen, maar bij de 30-60-laags campagnes (hoofdstuk 14) liep de cumulatieve drempel binnen enkele tientallen lagen op tot miljoenen — een harde muur in plaats van een geleidelijk oplopende uitdaging. Een kwadratische kostencurve groeit nog altijd sneller dan het lineaire inkomen (dus blijft elke laag moeilijker dan de vorige), maar niet exponentieel sneller, waardoor het aantal beurten per laag geleidelijk oploopt in plaats van door te schieten naar het twintigvoudige of meer.

**Basisterm van de cultuurkosten verlaagd, kwadratische factor niet (issue: "de eerste cultuurdrempel is te hoog")**
Ook na de omzetting naar een kwadratische curve hierboven bleef laag 2 (drempel 20) in de praktijk tientallen beurten kosten — precies het moment waarop een speler voortgang wil voelen, niet stilstand. De doorrekening in hoofdstuk 14 ("Vroege-spel-doorrekening") laat zien dat dit voor een belangrijk deel een ándere oorzaak heeft dan de kostenformule (de grondstofketen naar het eerste Heiligdom kost zelf al zo'n 13 beurten), maar de kostenformule droeg door zijn hoge basisterm (15) ook onnodig bij. Omdat de basisterm een vaste optelling is, weegt hij bij lage lagen (waar de kwadratische term nog klein is) verreweg het zwaarst mee, maar wordt hij bij hoge lagen verwaarloosbaar tegenover de kwadratische term. Hem verlagen (van 15 naar 3) is daarom een chirurgische ingreep: de eerste paar lagen worden fors goedkoper, terwijl de curve verderop — en dus de hierboven beschreven, bewust behouden schaling voor de 30-60-laags campagnes — nauwelijks verandert. De kwadratische factor (5) blijft daarom bewust ongewijzigd; alleen de basis is aangepast.

**Twee gescheiden systemen voor militair conflict en culturele pushback**
Een direct gevecht (unit-sterkte vergelijken) en het weerstaan van een cultureel sterke tribe zijn thematisch verschillende soorten weerstand — de eerste is fysiek, de tweede diplomatiek/economisch. Door ze als aparte systemen te ontwerpen (in plaats van beide via legersterkte af te handelen) blijven de vijf categorieën ook mechanisch onderscheidend: militair lost fysieke dreiging op, cultureel lost expansie-weerstand op.

**Wachttoren en Heiligdom putten niet uit**
De overige land improvements (mijn, boerderij, houtkap, steengroeve) stellen een eindige oogst voor — hun hele nut ligt in het opgebruiken van een hulpbron. Een Wachttoren en een Heiligdom stellen iets anders voor: een blijvende aanwezigheid (een wachtpost, een cultusplek) die niet "op" kan raken. Ze een levensduur geven zou de speler dwingen ze op den duur te vervangen zonder dat daar een thematische reden voor is — in plaats daarvan krijgen ze allebei een doorlopend, tunebaar effect (indringers-bescherming resp. cultuurproductie) dat wél kan verzwakken (Heiligdom, buiten de frontier) maar nooit stopt.

**Uitputting telt pas vanaf actieve productie, niet vanaf bouwmoment**
Uitputting stelt het opgebruiken van een hulpbron voor (zie hierboven) — zonder productie is er niets om op te gebruiken. Zou de teller al aftellen zodra een improvement gebouwd is, dan zou wachttijd op een wegverbinding (hoofdstuk 16) een onzichtbare straf worden: de speler ziet de wachttijd zelf niet als een kostenpost, en thematisch klopt het ook niet dat een mijn die nog geen erts heeft opgeleverd toch al levensduur verliest. Door de teller pas te laten lopen zodra het vakje daadwerkelijk actief-producerend is (gebouwd én wegverbonden), blijft de regel voor elke land improvement consistent: geen productie, geen uitputting — ongeacht of dat komt door een ontbrekende wegverbinding of (mocht dat ooit kunnen) een verbroken verbinding.

**Wachttoren verdedigt de hele laag, niet alleen zichzelf**
Een verdedigingsbonus die alleen meetelt bij een directe, door de speler gestarte confrontatie (het bestaande M7-systeem) beloont de Wachttoren pas op het moment dat de speler toch al voorbereid was. Door de Wachttoren daarnaast een passieve, elke-beurt-kans-gedreven dreiging (indringers-tribuut) volledig te laten blokkeren, wordt hij ook waardevol als voorzorgsmaatregel — precies het gevoel van een wachtpost, in plaats van alleen een statistiekbonus tijdens een gevecht dat de speler zelf initieert.

**Wachttoren beschermt ook de laag eronder (issue: "wachttoren beschermt 2 lagen")**
Met indringers-incidenten verspreid over alle ontgrendelde lagen (zie hieronder) had de speler, om overal gedekt te zijn, in de praktijk op bijna elke ontgrendelde laag een eigen Wachttoren nodig — te veel bouwwerk voor wat een voorzorgsmaatregel hoort te zijn. Een werkende Wachttoren (voltooid, bemand, wegverbonden) beschermt daarom niet alleen zijn eigen laag, maar ook de laag direct daaronder — thematisch een wachtpost die ook over het gebied net onder zich uitkijkt. Dit werkt niet door naar een tweede laag daaronder, en een toren beschermt nooit de laag erboven: die blijft afhankelijk van zijn eigen toren (of van een toren op de laag daar weer boven).

**Indringers-incidenten verspreid over alle ontgrendelde lagen, niet alleen de frontier**
Zolang indringers alleen op de frontier-laag konden toeslaan, werd elke eerder gebouwde Wachttoren waardeloos zodra de frontier een laag opschoof. Elke nieuwe laag vroeg zo om een nieuwe toren, en alles wat de speler eerder had opgebouwd, telde niet meer mee. Door de getroffen laag bij elk incident te loten uit **alle** ontgrendelde lagen — inclusief beschermde — blijft elke gebouwde, bemande en verbonden Wachttoren zijn hele run lang waarde houden. Beschermde lagen blijven bewust meeloten zodat de dreiging voelbaar blijft: de speler ziet dat er nog steeds pogingen zijn, maar ziet ook dat zijn verdediging werkt. De één-trekking-per-beurt-vorm (in plaats van een aparte kans per laag) houdt daarbij het tempo van incidenten constant, ongeacht hoeveel lagen er ontgrendeld zijn.

**Een kale laag met alleen een Wachttoren doet niet mee in de indringers-trekking (issue: "een laag met alleen een wachttoren kan geen indringers krijgen")**
Indringers komen ergens op af — een laag waar helemaal niets staat behalve een wachtpost, biedt daar geen aanleiding toe, ongeacht of die wachtpost al voltooid of bemand is. Toen de eis "er moet een improvement aanwezig zijn" verviel (zie hierboven, "indringers-incidenten verspreid over alle ontgrendelde lagen"), ging dat één stap te ver: elke ontgrendelde laag deed mee, ook een laag die verder helemaal leeg is op de Wachttoren na. Door zo'n laag uit te sluiten van de trekking, blijft de dreiging gekoppeld aan lagen die daadwerkelijk iets waardevols bevatten (een andere improvement of een ghost town), zonder de kernmaatregel van hierboven terug te draaien: een laag met een Wachttoren én iets anders blijft gewoon meeloten, en de Wachttoren beschermt die laag zoals altijd.

**Wachttoren bouwbaar op elke ontgrendelde laag, niet alleen de frontier (issue: "wachttorens, bemanning en bevoorrading")**
De bovenstaande maatregel (incidenten over alle ontgrendelde lagen) lost alleen de hélft van het probleem op zolang bouwen zelf aan de frontier-only-regel gebonden blijft: een laag die de speler allang achter zich gelaten heeft, zou dan nooit meer een Wachttoren kúnnen krijgen, en dus permanent onverdedigbaar zijn — de speler zou tribuut moeten betalen zonder enige manier om dat te voorkomen. Dat botst met het uitgangspunt dat dreiging door goed spel te vermijden moet zijn (zie hierboven, "geen kunstmatige tijdsdruk/klok" en de risk/reward-filosofie achter hard verval). De Wachttoren krijgt daarom een expliciete uitzondering op de frontier-only-bouwregel; de overige bouwregels (materialen, bouwtijd, wegverbinding voor bescherming) blijven onveranderd. Thematisch klopt het bovendien: forten en wachtposten werden historisch juist áchter de oprukkende grens aangelegd om de route te beveiligen, niet aan de voorste rand.

**Strijder-toewijzing omkeerbaar en instant (issue: "wachttorens, bemanning en bevoorrading" / "wachttoren tweaks")**
Nu Wachttorens over veel meer lagen verspreid nodig zijn (zie hierboven), zou een blijvend onomkeerbare strijder-toewijzing betekenen dat elke verkeerde plaatsing — of elke Wachttoren die inmiddels overbodig is omdat een andere laag dringender bescherming nodig heeft — een strijder definitief kost. Een strijder kan daarom worden teruggehaald en elders opnieuw toegewezen. Een eerdere versie gaf het terughalen bewust een paar beurten reistijd, om te voorkomen dat het een niet-keuze zou worden (waarom nog goed nadenken over plaatsing, als een misser toch niets kost?). In de praktijk voegde die vertraging vooral wachten toe zonder de plaatsingskeuze zelf voelbaar zwaarder te maken — bemannen was namelijk altijd al instant, dus alleen *terughalen om elders te bemannen* voelde traag, niet de oorspronkelijke keuze. Verplaatsen tussen Wachttorens is daarom weer volledig instant; de indringers-mechaniek zelf (hierboven) blijft de reden waarom een verkeerde plaatsing nog steeds relevant is — een onbeschermde laag kan alsnog getroffen worden voordat de speler een strijder heeft kunnen herplaatsen.

**Bemanningskosten in voedsel per Wachttoren (issue: "wachttorens, bemanning en bevoorrading")**
Een wachtpost die alleen bouwmateriaal en bouwtijd kost, maar daarna niets meer, past niet bij het "bevoorrading"-thema van de Wachttoren (zie ook de wegverbindings-eis voor bescherming, hoofdstuk 6): een bemanning moet ook gevoed worden. Een klein, doorlopend voedselverbruik per bemande toren (bovenop het stadsverbruik) maakt uitbreiden van het verdedigingsnetwerk een reële afweging tegen de voedseleconomie, in plaats van een zuiver positieve keuze zonder nadeel. De doorrekening in hoofdstuk 14 laat zien dat dit bij een typische boerderij-opbouw geen dreiging vormt voor de speelbaarheid — vandaar geen aanpassing elders in de voedseleconomie.

**Offer Altaar en Legerkamp geven twee tot dusver functieloze units eindelijk een rol (issue: "De Bezette Laag, missionaris en verkenner")**
De Verkenner en de Missionaris stonden allebei al sinds hoofdstuk 3 in het ontwerp, maar waren nooit daadwerkelijk trainbaar: de Verkenner wachtte op een vooruitkijk-mechaniek die bewust post-MVP bleef (hoofdstuk 2/13), en de Missionaris op een culturele-pushback-diplomatie die evenmin gebouwd is (hoofdstuk 6, "Culturele pushback"). In plaats van die oorspronkelijke, grotere post-MVP-functies alvast te bouwen, krijgen beide units een kleinere maar wél passende MVP-rol via de Bezette Laag: de Verkenner onthult vakjes (een kleine, tijdelijke vorm van "extra zicht"), de Missionaris leidt cultuurproductie om naar een belegeringsmeter (een kleine, tijdelijke vorm van "diplomatieke/culturele druk"). Zo blijven beide units geen dode letter in de improvement-tabel, zonder de grotere, nog niet ontworpen mechanieken waar ze oorspronkelijk voor bedoeld waren te hoeven voorwegnemen.

**Missionaris-vereiste voor de belegeringsmeter**
Zonder deze eis zou cultuurproductie die tijdens een Bezette Laag toch al niet naar de normale laag-ontgrendeling gaat, automatisch en passief naar de belegeringsmeter stromen — de speler zou de Bezette Laag oplossen puur door door te blijven spelen, zonder een bewuste handeling. Door dat pas te laten gebeuren zodra er minstens één Missionaris is, wordt het oplossen van een Bezette Laag een actieve keuze (eerst een Offer Altaar bouwen, dan een Missionaris opleiden) in plaats van een automatisme — consistent met hoe de rest van het spel bewuste investering beloont boven passief wachten (zie ook "Settler en bouw-ritme" hieronder).

**Een harde Wachttoren-eis voor een Confrontatie tegen een Bezette Laag, met een echt verlies-effect**
Een eerdere, kleinere versie van dit mechanisme ging uit van een zachte aanname (de speler heeft tegen die tijd toch wel een Wachttoren). Door die aanname om te zetten in een harde eis — geen Confrontatie-knop zonder een voltooide, bemande, wegverbonden eigen Wachttoren op de laag direct eronder — wordt de al bestaande "Wachttoren beschermt ook de laag eronder"-relatie (hierboven) ook hier expliciet en verplicht, in plaats van optioneel. Het bijbehorende verlies-effect (de eigen Wachttoren wordt een ruïne, de bemannende strijder blijvend verloren) geeft een Confrontatie tegen een Bezette Laag ook echt iets op het spel: winst is niet gratis, en een overhaaste poging kan de eigen verdediging juist verzwakken — consistent met "hard verval i.p.v. zachte aftakeling" hierboven, nu toegepast op militaire inzet.

**Legerkamp overal bouwbaar, net als de Wachttoren**
Dezelfde redenering als "Wachttoren bouwbaar op elke ontgrendelde laag" hierboven: een Soldaat die aan een Legerkamp is toegewezen, marcheert zelf naar de Bezette Laag om daar te vechten — het Legerkamp zelf hoeft dus niet op die laag, of zelfs in de buurt ervan, te staan. Een frontier-only-bouwregel voor het Legerkamp zou de speler dwingen het steeds opnieuw te herbouwen naarmate de frontier verder trekt, zonder dat daar een thematische reden voor is.

**City-improvement-capaciteit i.p.v. een los relic-telsysteem als groei-beloning (issue: "city improvements")**
Een eerdere versie van hoofdstuk 4 noemde "meer relic-slots" als de groei-beloning, maar dat concept (een apart tel-/inventarissysteem van drie-van-hetzelfde-type specialisatiebonussen) is nooit gebouwd — groeien had zo in de praktijk geen enkele tastbare beloning, alleen risico (hoofdstuk 4: uitputting, verval). In plaats van dat losse systeem alsnog te bouwen, wordt de beloning rechtstreeks gekoppeld aan wat de speler al aan het doen is: hoeveel city improvements een stad tegelijk kan dragen, en welke pas vanaf een bepaalde stadsgrootte bouwbaar zijn (Barakken/Tempel vanaf "middel", Grote Tempel vanaf "groot"). Dat is dezelfde soort beloning (méér mogelijkheden bij een grotere stad) maar dan via capaciteit en toegang — mechanisch eenvoudiger dan een apart telsysteem, en het hergebruikt de al bestaande bouwwachtrij-infrastructuur in plaats van een nieuw inventarisconcept te introduceren. Dit vervangt uitsluitend het niet-gebouwde relic-slot-concept — de Anker-verhaal-relics (hoofdstuk 9) zijn een volledig apart, ongewijzigd mechanisme dat niets met city-improvement-capaciteit te maken heeft.

**Opslagplaats valt buiten de city-improvement-cap (issue: "city improvements")**
De Opslagplaats heeft al haar eigen, herhaalbare wachtrij (hoofdstuk 3/5, "praktisch maximum ~3-4 opslagplaatsen per stad") en dient een structureel andere functie (opslagcapaciteit uitbreiden) dan de vijf gecapte city improvements (Bibliotheek/Markt/Barakken/Tempel/Grote Tempel), die elk een doorlopend productie- of legerwaarde-effect leveren. Zou Opslagplaats wél meetellen voor de cap, dan zou hij bij een kleine stad (cap 1) de facto de enige zinvolle keuze worden — elke andere city improvement zou dan rechtstreeks concurreren met de opslagcapaciteit die de speler toch al nodig heeft om te kunnen bouwen. Door Opslagplaats hier expliciet buiten te houden, blijft de cap een keuze tussen de vijf inhoudelijk verschillende improvements, niet een verkapte keuze tussen "opslag" en "iets anders".

**Een forse Legerkamp/Offer Altaar-infrastructuur-eis als bewuste climax-voorbereiding (issue: "city improvements")**
Legerkamp en Offer Altaar waren tot deze issue vrij bouwbaar zodra de speler er de grondstoffen voor had — geen enkele opbouw was ervoor nodig, terwijl ze wel de sleutel zijn tot de Bezette-Laag-climax (hoofdstuk 6/10). Door ze pas bouwbaar te maken na een fors aantal actieve Wachttorens/Heiligdommen (5) én de bijbehorende city improvement (Barakken/Grote Tempel), moet de speler zijn militaire en culturele infrastructuur écht hebben opgebouwd voordat hij de Bezette Laag aankan — consistent met hoe de rest van het spel bewuste investering beloont boven een toevallig-net-genoeg-grondstoffen-moment (zie ook "Missionaris-vereiste voor de belegeringsmeter" hierboven). De eis is bewust fors (vergelijkbaar met een aanzienlijk deel van de tutorial-lagen), maar niet zo fors dat hij binnen de 13 tutorial-lagen onhaalbaar wordt — zie de doorrekening in hoofdstuk 14. Een zichtbare voortgangsindicatie in de bouw-UI (in plaats van de improvements simpelweg te verbergen, zoals bij een gewone `minLaag`-eis) houdt dit voorspelbaar: de speler ziet hoe ver hij is, niet alleen dát het nog niet kan.

**Vertakkende verhaalstructuur met een gedeelde slotscène i.p.v. volledig lineair of volledig random**
Volledig vaste verhaalmomenten (altijd dezelfde gebeurtenis op dezelfde laag) zouden na een paar runs voorspelbaar worden; volledig random getrokken gebeurtenissen zouden geen samenhangend verhaal opbouwen. Een keuzeboom met een paar vaste ankerpunten (waarvan de invulling reageert op eerdere keuzes) geeft het gevoel van een reagerend verhaal, terwijl het aantal te schrijven scenario's beheersbaar blijft — mede mogelijk gemaakt door bij het laatste ankerpunt de paden samen te laten komen in één kernscène met tonale varianten, in plaats van vier volledig aparte eindes.

**Wetenschap als vertakkende, onomkeerbare technologie-boom i.p.v. los vooruitkijk-bereik (issue: "tech tree toevoegen")**
Wetenschap had tot deze issue geen enkele functie in de MVP: de bijbehorende bron (een land improvement die wetenschap produceert) ontbrak volledig, en het enige voorziene effect (vooruitkijk-bereik) is bewust post-MVP (hoofdstuk 13). In plaats van dat losse vooruitkijk-effect alvast half te bouwen, krijgt wetenschap dezelfde vertakkende, permanent-onomkeerbare keuzelogica als de Anker-verhalen (hoofdstuk 9): op elke drempel kiest de speler één van twee technologieën, en het niet-gekozen pad — inclusief alles wat daaronder in de boom hangt — is voor de rest van de run blijvend ontoegankelijk. Dat is bewuste consistentie in ontwerptaal (twee systemen die aanvoelen als variaties op hetzelfde patroon, in plaats van twee losse mechanieken die toevallig allebei "kiezen" heten) en versterkt tegelijk het rogue-like karakter: net als bij een Anker-keuze bouwt de speler binnen één run een onherhaalbare combinatie van technologieën op.

**Wetenschapscurve bewust zwaarder dan de cultuurcurve (issue: "tech tree toevoegen")**
Cultuur koopt eenmalige toegang tot een laag — een keer betaald, geen blijvend voordeel behalve de toegang zelf. Elke technologie in de boom hierboven levert daarentegen een **permanente, structurele** bonus op (een boerderij die voorgoed 20% meer opbrengt, een opslag-cap die voorgoed +10 is, een leger dat voorgoed sterker vecht) — een stapelend voordeel voor de rest van de run, niet een eenmalige drempel. Die grotere waarde per aankoop rechtvaardigt een hogere prijs: zowel de basisterm als de kwadratische factor van de wetenschapskosten (hoofdstuk 14) liggen boven die van de cultuurkosten, met een verschil dat oploopt naarmate de speler dieper de boom in gaat — passend bij hoe ook de bonussen zelf zwaarder worden (drempel 3 stapelt op drempel 1 en 2).

**Echte historische inspiratie i.p.v. fictieve samengestelde facties**
Er is bewust gekozen om echte historische volken en leiders te gebruiken als inspiratiebron, met volledige creatieve vrijheid voor de ontwerper om zelf te bepalen hoeveel historische nauwkeurigheid wordt aangehouden. Dit sluit aan bij de achtergrond en voorkeur van de ontwerper, en geeft de campagnes meer historisch gewicht dan volledig verzonnen namen zouden bieden.

**Neolithische tutorial als neutrale sfeer, campagnes met eigen toon**
Door de tutorial in een fictieve, mythische neolithische setting te plaatsen (in plaats van er meteen een historische campagne van te maken), kan de speler alle kernmechanieken leren zonder dat dit de toon van latere, thematisch zwaardere campagnes (zoals de sombere Amerikaanse frontier) alvast kleurt of verwatert.

**Settler en bouw-ritme i.p.v. een bouwkeuze bij elke beurt**
Een nieuwe bouwkeuze op elke beurt aanbieden liet het bouwen te snel aanvoelen: er was geen andere handeling tussen twee bouwmomenten in. Door nieuwe bouwprojecten voortaan om de 3 beurten aan te bieden (hoofdstuk 16) ontstaat er ruimte, en die ruimte wordt gevuld met een actieve, ruimtelijke taak: de settler-eenheid verplaatsen en wegen aanleggen. Door land improvements pas daadwerkelijk te laten produceren zodra ze via zo'n weg met de stad verbonden zijn, is wegenaanleg geen losstaand extraatje maar een voorwaarde voor de economie zelf — precies zoals uitgeputte grond (hoofdstuk 4) en verval al zorgen dat de speler iets te doen heeft tussen bouwmomenten door.

**Terrein-eisen per land improvement, met een gegarandeerd minimum per laag**
Zonder terrein-eisen voelen alle 8 land-vakjes van een laag inwisselbaar aan: elke improvement past overal, dus de keuze wáár je bouwt heeft geen betekenis. Door improvements te binden aan een vakje-terreinsubtype (houtkap → bos, mijn/steengroeve → heuvel/berg, boerderij → vlak) wordt plaatsing zelf een keuze in plaats van een formaliteit, en oogt elke laag ook visueel gevarieerder dan één herhaald terreintype. Mijn en steengroeve delen bewust dezelfde terrein-eis (heuvel/berg) — dat maakt die vakjes een schaarser, strategischer knelpunt (op lagen met maar één zo'n vakje kun je er dus maar één van de twee bouwen) in plaats van dat elk vakje-subtype netjes één-op-één aan één improvement gekoppeld is. Om te voorkomen dat dit té restrictief wordt, houdt elke (tutorial-)laag bewust minstens één vakje van elk relevant subtype aan — een laag kan dus wél duidelijk overhellen naar bijvoorbeeld bos of gebergte (en zo de hoogte voelbaar maken, bv. geen bos meer boven de boomgrens), maar sluit nooit een hele economische optie helemaal uit. Terrein-subtypes liggen, net als de laag-terreintypes zelf, vast per tutorial-laag (geen random worldgen, hoofdstuk 8) — bij latere procedurele campagnes kan dit alsnog random gegenereerd worden binnen dezelfde regel (minstens één vakje per relevant subtype).

**Waarschuwing vóór "Volgende beurt" i.p.v. stilzwijgend een actie laten verlopen**
Zowel de settler-actie als de bouwkeuze zijn beperkt tot één keer per beurt (hoofdstuk 16) — een speler die snel doorklikt kan zo onbedoeld een beurt "verspillen" zonder dat te merken. In plaats van dit stilzwijgend te laten gebeuren (of, aan de andere kant, "Volgende beurt" helemaal te blokkeren tot alles gebruikt is, wat een verplichting zou maken van iets dat een keuze hoort te zijn), waarschuwt een pop-up de speler alleen als er nog iets te doen valt, met de mogelijkheid om alsnog terug te gaan en te handelen vóórdat de beurt echt eindigt. Zo blijft overslaan een bewuste keuze, geen ongeluk.

**Settler-jacht op kuddes als alternatief voor de Houtkap-improvement**
Een losse, directe settler-actie (jagen/hout hakken) naast de bestaande improvement-productie (hoofdstuk 5) geeft de speler een kleinere maar onmiddellijke opbrengst zonder bouwkosten of wegverbinding — nuttig in de vroege beurten van het bouw-ritme (hoofdstuk 16) voordat een Houtkap of Boerderij daadwerkelijk staat en verbonden is. Kuddes zijn bewust eindig (net als de uitputting van land improvements, hoofdstuk 4) zodat jagen een tijdelijke bonus blijft in plaats van een permanente vervanging van boerderijen — vandaar de hogere opbrengst per beurt (3 voedsel) tegenover het structurele, maar onbeperkte houtkappen (1 hout per beurt).

**Roofdieren als risico op settler-jacht (issue: "roofdieren toevoegen")**
Settler-jacht op kuddes (hierboven) was tot nu toe een gratis, risicoloze uitweg uit een voedseltekort: geen bouwkosten, geen wegverbinding, en — anders dan bijvoorbeeld een Boerderij, die tijd en materiaal kost — zonder enig nadeel. Zodra jagen vanaf laag 5 een kans op een roofdier met zich meebrengt (hoofdstuk 14/17), staat voor het eerst een reëel risico tegenover die gratis opbrengst: de settler kan sterven als de speler niet op tijd wegbeweegt. Dat maakt "jaag ik hier nog een keer, of bouw ik liever een Boerderij" weer een echte afweging, in plaats van dat jagen altijd de dominante keuze blijft zolang er een kudde in de buurt staat. Het ritme (zichtbaar → een beurt reactietijd → pas dan het gevolg) houdt dit, net als bij stadsverval en indringers (hoofdstuk 4/6/7), voorspelbaar te vermijden in plaats van willekeurig oneerlijk.

**Opslagplaats als bewuste tussenstap richting het stichten (issue: "stad stichten op de frontier") — ingehaald door issue #187**
Oorspronkelijk lagen de stichtingskosten bewust hoger dan de start-opslag-cap van 30 (hoofdstuk 14), zodat de speler eerst zijn stad economisch moest uitbouwen (een Opslagplaats bouwen) voordat hij kon stichten — dat paste bij de kernspanning van hoofdstuk 4 (doorgroeien/uitbouwen kost tijd, tegenover simpelweg vertrekken zodra het net-lukt). **Issue #187 ("stad stichten veel goedkoper")** heeft de stichtingskosten daarna 4x verlaagd op expliciet verzoek, waardoor deze geforceerde Opslagplaats-tussenstap is vervallen — de Opslagplaats-improvement blijft verder gewoon nuttig (meer opslag-ruimte), maar is geen harde eis meer om te kunnen stichten.

**De settler als civiele keuze tegenover groei, niet als losse aanwinst (issue: "stad stichten op de frontier")**
Een nieuwe settler simpelweg los verkrijgbaar maken (bijvoorbeeld via een aparte knop, altijd beschikbaar) zou het stichten van een tweede stad een puur positieve, kosteloze keuze maken zodra de speler er de grondstoffen voor heeft. Door de nieuwe settler in dezelfde civiele wachtrij te zetten als de groei-tier-improvement (Woonwijk) — met hoogstens één van de twee tegelijk in aanbouw — wordt het een echte afweging: investeer je in de stad waar je al staat (groei, meer relic-slots), of rust je een expeditie uit om verder te trekken? Dat past bij hoofdstuk 3, waar Civiel al de categorie is die stads-tiers en beweging (weg/settler) samenbrengt.

**Maximaal één settler per gestichte stad (issue: "stad stichten op de frontier")**
Zonder deze rem zou een speler in theorie settler na settler kunnen uitrusten vanuit één stad en zo een onbeperkt aantal expedities tegelijk op pad kunnen sturen, wat het "één actieve frontier-stad tegelijk"-uitgangspunt (hoofdstuk 2) zou ondermijnen. Door het aantal beschikbare settlers te koppelen aan het aantal gestichte steden (elke gestichte stad kan er precies één uitrusten), blijft expansie een geleidelijk, door de speler zelf opgebouwd proces in plaats van een instant-vermenigvuldiging — een natuurlijke rem die meegroeit met hoeveel de speler daadwerkelijk heeft opgebouwd.

**Amberader/goudmijn is uitputtend, net als de andere mijn (issue: "toevoeging Goud")**
Een goudader is, net als een ertsader, een fysieke, eindige vondst — het hele nut ligt in het opgebruiken van een hulpbron (zie hierboven, "Wachttoren en Heiligdom putten niet uit"). Dat plaatst de Amberader nadrukkelijk in dezelfde categorie als mijn/boerderij/houtkap/steengroeve, niet bij de niet-uitputtende Sterrencirkel of het Heiligdom, die allebei een blijvende aanwezigheid voorstellen (een observatorium, een cultusplek) in plaats van een oogst. De extra, vakje-specifieke amberader-vondst-eis (bovenop de gewone heuvel/berg-terreineis van een mijn, hoofdstuk 3/14) maakt een Amberader-locatie bovendien schaarser dan een gewone erts-mijn-locatie — precies zoals hoofdstuk 7 een goudmijn al noemt als voorbeeld van iets om "op te gokken".

**Een tweede gegarandeerde Amberader-locatie voorkomt een softlock rond laag 12 (issue: "Amberader sowieso op laag 12")**
De eerste gegarandeerde Amberader (laag 7, hoofdstuk 14) is, net als elke andere mijn/boerderij/houtkap, uitputtend (hierboven) — een speler kan die vondst dus laten opdrogen zonder ooit een Markt te bouwen als vervangend goud-inkomen. Zonder een tweede garantie zou zo'n speler tegen laag 12 (de Bezette Laag, hoofdstuk 6) kunnen aanlopen zonder enig lopend goud-inkomen, precies op het moment dat zowel Offer Altaar als Legerkamp goud vereisen (hoofdstuk 11, "Legerkamp/Offer Altaar-infrastructuur-eis") — een echte softlock, geen tegenslag die de speler had kunnen zien aankomen. Een tweede gegarandeerde locatie op laag 11 (hoofdstuk 14) lost dit op met dezelfde vaste-worldgen-garantie als de eerste, vlak genoeg vóór laag 12 om nog op tijd te zijn, maar laat genoeg om de speler eerst de kans te geven zelf een Markt te bouwen. Bewust geen nieuwe variant of mechaniek: dezelfde Amberader/goudmijn-improvement, dezelfde uitputting, dezelfde indringers-malus hieronder — de garantie zit alleen in de worldgen-plaatsing, niet in een nieuw systeem.

**Amberader verhoogt indringers-aantrekkelijkheid: de eerste rogue-like bonus/malus-koppeling (issue: "Amberader: bonus/malus-koppeling")**
Tot deze issue had een waardevolle vondst (de Amberader, hierboven) uitsluitend een positief effect — meer opbrengst, verder geen enkele consequentie. Dat past niet bij het rogue-like karakter van het spel (hoofdstuk 7, 9), waarin risico en beloning doorgaans aan elkaar gekoppeld zijn. Een laag met een actieve Amberader weegt daarom zwaarder mee in de indringers-laag-trekking (hoofdstuk 6) — het waardevolle materiaal trekt ongewenste aandacht, thematisch net zo logisch als de bestaande koppeling tussen groei en verval-risico (hierboven, "hard verval i.p.v. zachte aftakeling"). Deze koppeling is bewust klein gehouden: ze wijzigt alleen het gewicht in een al bestaande trekking (hoofdstuk 6), voegt geen nieuw framework toe, en laat de uitkomst van een geloot incident (beschermd door een Wachttoren, of tribuut) volledig ongewijzigd — de Amberader vergroot alleen de kans dat een laag überhaupt geloot wordt. Grotere, systemische bonus/malus-mechanismen (zeldzaamheid met een dual-edge-effect per tier, hoofdstuk 7, of een los vondst-gebeurtenissysteem) zijn bewust uitgesteld: zeldzaamheid tot een latere MVP-uitbreiding (hoofdstuk 13: "nog niet in de MVP"), en een vondst-gebeurtenissysteem tot de Amerikaanse campagne, waar zulke systemische mechanismen beter passen bij de zwaardere, minder heroïsche toon (hoofdstuk 9).

**Een beschermde Wachttoren houdt niet altijd zomaar stand: de tweede rogue-like bonus/malus-koppeling (issue: "wachttorens kunnen vernietigd worden door indringers")**
Tot deze issue was een voltooide, bemande, wegverbonden Wachttoren een echte set-and-forget-investering: eenmaal neergezet en bemand, hield hij zijn laag (en de laag eronder) voor de rest van de run gegarandeerd tegen elk indringers-incident. Dat is precies het soort risicoloze, "veilige" uitkomst die de eerste koppeling hierboven (Amberader-malus) al vermeed voor waardevolle vondsten — en het geldt hier zelfs voor oude, allang achtergelaten lagen, niet alleen de frontier zelf. Een kleine, altijd aanwezige kans dat de bescherming toch faalt (malus: ruïne + verloren strijder) — gecompenseerd door een even kleine kans op een tegenovergesteld resultaat (bonus: buit) — geeft ook een lang geleden gebouwde Wachttoren een klein maar reëel spanningselement, in lijn met het risk/reward-karakter dat de rest van het spel al draagt (hoofdstuk 4, 7, 9). Net als bij de Amberader-koppeling is de omvang bewust klein gehouden: het wijzigt alleen de uitkomst van een al bestaand incident (hoofdstuk 6), voegt geen nieuw framework toe, en de volgorde stand houden (85%) ♦ malus (10%) ♦ bonus (5%) houdt de meest waarschijnlijke uitkomst nadrukkelijk het bestaande, ongewijzigde gedrag. De malus hergebruikt bovendien bewust dezelfde afhandeling als een verloren Confrontatie tegen een Bezette Laag (ruïne, herbouwbaar, blijvend verloren strijder) — geen nieuw verlies-patroon, maar een tweede toepassing van een al gevestigd patroon.

**Rush-bouwen met goud raakt de bouwwachtrij, niet de technologieboom (issue: "toevoeging Goud")**
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
Elke land/city improvement is een eigen, in zichzelf afgesloten tegel-asset (zoals bij Diablo II/HoMM3) — geen doorlopend geschilderd landschap per laag (zoals bij Final Fantasy VII-VIII-IX). Dit is bewust gekozen boven de "naadloze" aanpak omdat:
- het productie-werk per campagne beperkt blijft tot het vervangen van een tegel-set, niet het herbouwen van hele scènes;
- het past bij het modulaire bouwvakken-systeem (9 losse vakjes per laag) dat al de kern van het ruimtelijk model is;
- het toevoegen van nieuwe improvements, zeldzaamheidsvarianten, of hele campagnes hierdoor een asset-toevoeging blijft, geen structurele wijziging.

**Per campagne een eigen tegel-set/palet, zelfde onderliggende systeem**: de "engine" (grid, tegel-plaatsing, belichtingsstijl-conventies) blijft gelijk; wat wisselt is de tegel-set en het kleurenpalet (bijv. stoffig/verweerd voor Amerika, koud/blauwig voor Siberië, warm/aards voor de neolithische tutorial).

**Zeldzaamheidsvarianten**: elk land improvement-type heeft idealiter een visueel onderscheidbare variant per zeldzaamheidstier (gewoon/rijk/legendarisch), zodat zeldzaamheid ook zonder UI-tekst herkenbaar is zodra een tile onthuld wordt.

---

## 13. Technische opzet & bouwplan (MVP)

**Stack**: Next.js + TypeScript. Rendering van het tegel-grid via HTML Canvas (past bij eerdere browsergame-ervaring en geeft volledige controle over losse tegel-assets). Voor v1 geen backend nodig — save-states lokaal (localStorage/IndexedDB); een Vercel-deploy met een gratis database is een logische vervolgstap zodra cloud-saves/meerdere devices relevant worden.

### MVP-scope (eerste bouwbare versie)

Om een speelbare kernloop te krijgen vóór alle content is ingevuld, beperkt de eerste versie zich tot:

**Wel in de MVP:**
- Eén stad, één actieve band van 9 vakjes, meerdere lagen (geen frontier-stadswissel nog)
- Land improvements: categorie kiezen → alle geldige opties binnen die categorie tonen → bouwen (met productiewachtrij). City improvements en units lopen niet via deze flow (stad-pop-up resp. eigen mechanisme, hoofdstuk 1/11).
- Drie bouwmaterialen (hout/steen/erts) + gedeelde opslag-cap, losstaande voedselvoorraad
- Uitputting van land improvements → permanente ghost-town-tiles
- Cultuur → laag ontgrendelen; fog of war
- Twee groei-tier-stappen (klein→middel via Woonwijk, middel→groot via Grote Woonwijk — hoofdstuk 3/14, issue: "city improvements" Deel 2), met het zichtbare waarschuwingssignaal en het permadeath-verval-risico (volledige ineenstorting eindigt de run en herstart de tutorial, zie hoofdstuk 4/11)
- **City-improvement-capaciteit & -gating** (hoofdstuk 3/4/6/11/14, issue: "city improvements"): een aan de stadsgrootte gekoppelde cap op het aantal gelijktijdige city improvements (klein 1, middel 3, groot 5), vier nieuwe/ingevulde city improvements (Bibliotheek, Markt, Barakken, Tempel, Grote Tempel — de laatste drie met een stadsgrootte-eis), en een infrastructuur-eis voor Legerkamp/Offer Altaar (5 actieve Wachttorens + Barakken, resp. 5 actieve Heiligdommen + Grote Tempel) met een zichtbare voortgangsindicatie in de bouw-UI
- Militaire confrontatie (winkans-formule) — in de tutorial uitsluitend via de Bezette Laag hieronder (de eerdere, generieke "confrontatie op laag 12"-placeholder is vervangen)
- **Bezette Laag & Confrontatie** (hoofdstuk 6/10/11/14, issue: "De Bezette Laag, missionaris en verkenner"): generiek, herbruikbaar mechanisme, in de tutorial gescript op laag 12. Per-tegel verhulling los van de gewone fog of war, Verkenning (nieuwe functie voor de Verkenner-unit), Offer Altaar + Missionaris + belegeringsmeter tegen vijandelijke Heiligdommen, Legerkamp + herziene Confrontatie (met een harde eigen-Wachttoren-eis en een ruïne-verlies-effect) tegen vijandelijke Wachttorens.
- Settler-eenheid en wegen (hoofdstuk 16): de settler start beurt 2 in de stad en verplaatst 1 vakje per beurt (voor/achter/zijwaarts); hij legt kosteloos wegen aan (kost enkel die beurt). Een land improvement produceert pas zodra zijn vakje via zo'n wegverbinding aan de stad hangt. Nieuwe bouwprojecten kun je hierdoor nog maar om de 3 beurten starten (de eerste beurt telt al als bouwmoment)
- Kuddes & settler-jacht (hoofdstuk 17): vanaf laag 4 kunnen wilde kuddes op een leeg vakje verschijnen (gemeld via een pop-up, dezelfde stijl als de indringers-pop-up); de settler kan er (in plaats van bewegen/weg aanleggen) op jagen voor voedsel, of op een bos-vakje hout hakken — beide een alternatief voor gebouwde improvements, zonder bouwkosten. Vanaf laag 5 kan jagen een **roofdier** oproepen op het jachtvakje: zichtbaar via een pop-up, valt pas de beurt erna aan, en doodt de settler als die er dan nog staat — verlies van de settler kan de huifkar terugbrengen in de civiele improvement-pool (hoofdstuk 6/11)
- Waarschuwing bij "Volgende beurt" (hoofdstuk 11) als de settler nog een actie heeft of er nog een bouwkeuze openstaat, met de mogelijkheid om alsnog terug te gaan en te handelen
- Placeholder-tegels (simpele, consistente stijl — geen definitieve pre-rendered assets nodig om te testen)
- Alléén de tutorial-content (Het Hertenpad-volk, lagen 1-13) als speelbare inhoud
- De stad heeft een zichtbare naam (**Holenrots**, zie hoofdstuk 10), te zien via een klik op de stad-tile — geen naam-generator voor toekomstige steden, dat komt pas met meerdere-steden-support
- **Opslagplaats** (hoofdstuk 3/5/11/14, economische city improvement): verhoogt de gedeelde opslag-cap met +20, herhaalbaar. Eigen wachtrij, los van de civiele wachtrij hieronder.
- **Stad stichten** (hoofdstuk 2/10/16): op een vakje aan vers water waar de settler fysiek staat, met een bevestigingswaarschuwing (de settler verdwijnt hierbij — "de huifkar wordt de stad"). In de tutorial is dit uitsluitend mogelijk op laag 13 (de oceaan aan de overkant, hoofdstuk 10) — de enige plek met vers water. Vervangt "bereik laag 12" als tutorial-einddoel; opent daarna de afsluitende scène en het campagnemenu. Nog **geen** volledige frontier-verplaatsing (dat blijft hieronder uitgesteld).
- **Nieuwe settler in de civiele improvement-pool** (hoofdstuk 3/11): concurreert met de groei-tier-improvement (hoogstens één van de twee tegelijk in aanbouw). Alleen beschikbaar als het huidige aantal settlers lager is dan het aantal gestichte steden.
- **Sterrencirkel** (hoofdstuk 3/4/6/14, wetenschappelijk land improvement, issue: "tech tree toevoegen"): produceert wetenschap per beurt, put niet uit (zelfde patroon als het Heiligdom), pas actief na wegverbinding zoals elk ander land improvement.
- **Technologie-boom** (hoofdstuk 3/9/11/14, issue: "tech tree toevoegen"): 3 drempels van elk 2 keuzes, permanent vertakkend zoals de Anker-verhalen — zie techTree.ts voor de volledige boom en effecten.

**Nog niet in de MVP** (bewust uitgesteld tot de kernloop staat):
- Meerdere steden/frontier-verplaatsing
- Permanent vooruitkijk-bereik verder dan 1 laag (de wetenschap-relic uit hoofdstuk 3) en de bijbehorende relic-functie van de Verkenner — de Verkenner-unit zelf is sinds "De Bezette Laag" wél in de MVP, met een andere, kleinere functie (Verkenning, hoofdstuk 6)
- Culturele pushback-diplomatie (hoofdstuk 6, de oplopende-cultuurkostprijs-variant) — de Missionaris-unit zelf is sinds "De Bezette Laag" wél in de MVP, met een andere, kleinere functie (belegeringsmeter, hoofdstuk 6)
- Zeldzaamheid (rijk/legendarisch) en het oogst-tijdvenster
- Volledige Amerikaanse campagne-content (ankers, vertakkingen)
- Meerdere campagnes/saves tegelijk

### Data-schema's

Dit document bevatte hier eerder een letterlijk, "indicatief" gelabeld TypeScript-codeblok met de belangrijkste interfaces (`Improvement`, `Tile`, `City`, `GameState`, `CampaignConfig`, e.d.). Dat blok is verwijderd: een los-gekopieerd voorbeeld raakt onvermijdelijk gedateerd zodra de echte code evolueert (het miste bijvoorbeeld al `Tile.roofdier`/`Tile.bouwVoortgang` en `Improvement.minLaag`), terwijl de losse velden intussen toch al beschreven staan in de hoofdstukken hierboven (2, 3, 4, 6, 9, 11, 16, 17).

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
| M1 | Grid & laag-rendering | 9-tile band, meerdere lagen, fog of war, placeholder-tegels tonen | Klaar |
| M2 | Categorie-keuze-UI | Categorie kiezen → alle geldige land improvements binnen die categorie tonen → bouwen starten | Klaar |
| M3 | Resource-economie | 3 materialen + opslag-cap, voedsel, productiewachtrij | Klaar |
| M4 | Uitputting & ghost towns | Land improvements putten uit, worden ghost-town-tiles | Klaar |
| M5 | Cultuur & laag-ontgrendeling | Cultuur verzamelen, nieuwe laag ontgrendelen | Klaar |
| M6 | Groei & verval | Klein→middel groei-tier, waarschuwingssignaal, permadeath-verval (ineenstorting eindigt de run) | Klaar |
| M7 | Militair (basis) | Eenvoudige confrontatie met winkans-formule | Klaar |
| M8 | Tutorial-content | Lagen 1-13 met de vastgelegde mechaniek-volgorde en flavor-teksten | Klaar |
| M9 | Save/load | Eén actieve run lokaal opslaan en hervatten | Klaar |
| M10 | Wegen & settler | Settler-eenheid + verplaatsing, wegen aanleggen, bouw-ritme (1 nieuw project per 3 beurten), resource-activatie via wegverbinding, uitleg-pop-up bij beurt 2 (hoofdstuk 16) | Klaar |
| M11 | Kuddes, settler-jacht & beurt-waarschuwing | Wilde kuddes vanaf laag 4, settler-jacht (voedsel) en settler-houtkap (hout) als extra settler-acties, waarschuwing-pop-up bij "Volgende beurt" zolang de settler of de bouwkeuze nog iets te doen heeft (hoofdstuk 11/17) | Klaar |
| M12 | Stad stichten | Vers-water-vakje (uitsluitend op de laatste laag — de oceaan aan de overkant, de enige plek in de hele tutorial met vers water), Opslagplaats-improvement, doorgerekende stichtingskosten, settler-in-de-civiele-pool (max 1 per gestichte stad), stichtingsbevestiging + afsluitende tutorial-scène als nieuw einddoel (hoofdstuk 2/3/10/11/14/16) | Klaar |
| M13 | Technologie-boom & Sterrencirkel | Sterrencirkel-improvement (wetenschap, put niet uit), vertakkende 3-drempel technologie-boom met permanente effecten, tech-keuze-pop-up, doorgerekende drempelkosten (hoofdstuk 3/4/6/9/11/13/14) | Klaar |
| M14 | Bezette Laag, Missionaris & Verkenner | Generiek Bezette-Laag-mechanisme (per-tegel verhulling, tutorial-scripting op laag 12), Verkenner trainbaar + Verkenning-actie, Offer Altaar + Missionaris trainbaar + belegeringsmeter tegen vijandelijke Heiligdommen, Legerkamp + herziene Confrontatie (harde eigen-Wachttoren-eis, ruïne-verlies-effect) tegen vijandelijke Wachttorens — vervangt de eerdere "Militair (basis)"-placeholder op laag 12 volledig (hoofdstuk 3/6/10/11/14) | Klaar |
| M15 | City-improvement-capaciteit & infrastructuur-gating | City-improvement-cap per stadsgrootte (klein 1/middel 3/groot 5, vervangt het niet-gebouwde relic-slot-concept uit hoofdstuk 4), Grote Woonwijk (tweede groei-tier), Bibliotheek/Markt/Barakken/Tempel/Grote Tempel als nieuwe gecapte city improvements, Legerkamp/Offer Altaar geblokkeerd tot een forse Wachttoren/Heiligdom-infrastructuur-eis + de bijbehorende city improvement (Barakken/Grote Tempel) vervuld is, met zichtbare voortgangsindicatie in de bouw-UI (hoofdstuk 3/4/6/11/14, issue: "city improvements") | Klaar |

Elke milestone is bewust klein genoeg om als losse Claude Code-taak opgepakt te worden.

---

## 14. Aanvullende uitwerkingen

**Concrete balanscijfers (startpunt, te testen/tunen tijdens ontwikkeling)**

*Continent-lengte (lagen oceaan-tot-oceaan), per moeilijkheidsgraad:*

| Moeilijkheid | Lengte |
|---|---|
| Makkelijk | 20-25 lagen |
| Normaal | 30-40 lagen |
| Moeilijk | 45-60 lagen |

Binnen de gekozen range wordt random getrokken; een bergengte/obstakel-zone wordt geplaatst tussen 40-70% van de lengte.

*Uitputtingssnelheid (beurten tot volledig uitgeput):*

| Type | Gewoon | Rijk | Legendarisch |
|---|---|---|---|
| Mijn (erts) | 6 | 5-8 | 20-25 (+ oogstvenster) |
| Boerderij (voedsel) | 15-20 | 10-14 | 30-35 |
| Houtkap (hout) | 12-16 (nooit volledig 0, wel afnemend) | 8-11 | 25-30 |
| Steengroeve (steen) | 10-14 | 7-10 | 22-27 |
| Amberader/goudmijn (goud, issue: "toevoeging Goud") | 10-14 | 6-10 | 22-28 (+ oogstvenster, zoals bij andere legendarische vondsten — hoofdstuk 7) |

De rijk/legendarisch-kolommen hierboven blijven, net als bij de andere mijn/boerderij/houtkap/steengroeve-rijen, een MVP-placeholder voor de zeldzaamheid-uitwerking (hoofdstuk 7/13: nog niet geïmplementeerd) — de huidige code kent alleen de "gewoon"-waarde toe. Voor Houtkap (14), Steengroeve (10), Boerderij (18) en Amberader/goudmijn (12, het midden van de 10-14-range) valt die waarde binnen de tabel hierboven. **Correctie op eerdere beschrijving**: Mijn week hier eerder van af — de code gebruikt `uitputtingBeurten: 6` (`src/game/improvements.ts`), sneller dan de eerder gedocumenteerde 8-12-range en zelfs onder de Rijk-placeholder (5-8). De "Gewoon"-waarde hierboven is bijgewerkt naar 6; de Rijk/Legendarisch-kolommen voor Mijn zijn nog niet opnieuw doorgerekend tegen die snellere basiswaarde, wat pas relevant wordt zodra de zeldzaamheid-uitwerking zelf wordt gebouwd.

*Cultuurkosten*: `kosten(laag) = 3 + 5 × (laag − 1)²` — kwadratisch, cumulatieve drempel (cultuur wordt nooit "uitgegeven", zie hoofdstuk 5). Vervangt de eerdere exponentiële formule (basis 20, ×1,4 per laag); zie hoofdstuk 11 ("Kwadratisch in plaats van exponentieel cultuurkosten") voor de onderbouwing. De basisterm is sindsdien verder verlaagd van 15 naar 3 (issue: "de eerste cultuurdrempel is te hoog"; hoofdstuk 11, "Basisterm van de cultuurkosten verlaagd") — de kwadratische factor (5) is ongewijzigd, dus de curve vanaf ruwweg laag 6-8 verandert nauwelijks, terwijl laag 2-5 fors goedkoper worden. Culturele pushback-lagen: ×2 van het normale (dan al kwadratisch opgelopen) bedrag.

| Laag | Cultuurkosten (cumulatief) |
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

*Cultuurinkomen*: de enige cultuurbron in de MVP is het **Heiligdom** (hoofdstuk 3/6) — 2 cultuur/beurt op de frontier-laag zelf, 1 cultuur/beurt (halve opbrengst) op elke laag daaronder; hij put niet uit en blijft dus permanent actief. Tempel/amfitheater/monument en de passieve cultuur van ghost towns (hoofdstuk 7) zijn nog niet geïmplementeerd — buiten de huidige MVP-scope (hoofdstuk 13). Bij een gemiddelde build (niet puur cultuur, niet nul — indicatief: ruwweg 1 Heiligdom per 4 ontgrendelde lagen, waarvan steeds het nieuwste op de frontier-laag staat) geeft dat ruwweg:

| Laag | Heiligdommen (indicatief) | Cultuur/beurt (indicatief) | Beurten voor déze laag (marginale kosten ÷ inkomen) |
|---|---|---|---|
| 5 | 1 | ~2 | ~18 |
| 12 | 3 | ~4 | ~26 |
| 25 | 6 | ~7 | ~34 |
| 40 | 10 | ~11 | ~35 |

Het aantal beurten per laag loopt zo geleidelijk op (ruwweg 2× van vroeg- naar laat-spel) in plaats van naar het twintig- of honderdvoudige zoals bij de oude exponentiële formule.

*Vroege-spel-doorrekening (issue: "de eerste cultuurdrempel is te hoog")*: de tabel hierboven gaat uit van een gemiddelde build over een hele run; voor de allereerste laag-ontgrendeling is de vraag niet "wat is het gemiddelde inkomen", maar "wanneer staat het eerste Heiligdom er, en hoeveel beurten kost de drempel dáárna nog". Een doorgerekende, near-optimale openingszet — Houtkap eerst (de enige houtbron, en steen is bij de start toevallig precies genoeg voor de Houtkap), dan een Boerderij tegen de voedselwaarschuwing (het startvoedsel van 14 is expliciet hierop afgestemd, zie economie.ts), dan een Steengroeve (nodig omdat de startvoorraad steen volledig opgaat aan de Houtkap, en het Heiligdom zelf ook steen kost), en pas dán het eerste Heiligdom — laat zien dat deze volgorde vrijwel afgedwongen wordt door de grondstofketen zelf: een Heiligdom kost zowel hout als steen, en zonder Steengroeve blijft de steenvoorraad op 0 staan. Door het bouw-ritme (hoofdstuk 16: 1 nieuw project per 3 beurten) en de settler-reistijd voor elke wegverbinding (elke land improvement produceert pas met een eigen wegverbinding, hoofdstuk 16) komt het eerste Heiligdom pas rond **beurt 13** daadwerkelijk actief, ruim vóórdat enige cultuurdrempel een rol speelt. Vanaf dat punt loopt de cultuur met 2/beurt op (één Heiligdom op de frontier-laag):

| Laag | Cultuurkosten (nieuw) | Beurt bereikt (indicatief) | Beurt bereikt met oude formule (indicatief) |
|---|---|---|---|
| 2 | 8 | ~16 | ~22 |
| 3 | 23 | ~24 | ~30 |
| 4 | 48 | ~36 | ~42 |

Twee dingen volgen hieruit. Eén: de trage start heeft inderdaad **deels een andere oorzaak** dan de kostenformule (issue-punt 4) — de ~13 beurten tot het eerste Heiligdom zijn een gevolg van de grondstofketen, het bouw-ritme en de wegaanleg, niet van de cultuurdrempel, en geen enkele drempelverlaging brengt laag 2 onder die ~13 beurten. Dat is precies waarom de basisterm hierboven is verlaagd in plaats van op nul gezet: verder verlagen zou de drempel zelf triviaal maken zonder dat eerste, onvermijdelijke wachten te verkorten. Twee: bóven die vloer van ~13 beurten scheelt de nieuwe formule wel degelijk fors — laag 2 valt van ~22 naar ~16 beurten, dus van ~9 naar ~3 beurten ná het eerste Heiligdom, ruim binnen een handvol beurten zoals de issue vraagt.

**Technologie-boom & Sterrencirkel (hoofdstuk 3/9/11/13, issue: "tech tree toevoegen")**

*Sterrencirkel*: **6 hout, 2 steen**, bouwtijd **2 beurten** — vergelijkbaar bouwprofiel als het Heiligdom (4 hout, 4 steen, 2 beurten, hoofdstuk 3), maar verschoven naar "vooral hout, een beetje steen" zoals gevraagd; hetzelfde totaal (8) en dezelfde bouwtijd, alleen de verhouding wijkt af. Opbrengst **2 wetenschap/beurt**, exact hetzelfde patroon als het Heiligdom voor cultuur (hoofdstuk 6): geen uitputting, volle opbrengst op de frontier-laag, de helft daaronder.

*Drempelkosten*: `kosten(drempel) = 10 + 10 × (drempel-1)²` — drempel 1 = 10, drempel 2 = 20, drempel 3 = 50. Afgeweken van het voorstel in het issue (`8 + 5 × (drempel-1)²`, drempel 1/2/3 = 8/13/28): bij een near-optimale opening levert dat voorstel een curve op die de cultuurcurve (hieronder) nauwelijks trager haalt — met een basisterm en kwadratische factor die allebei maar net boven cultuur (3 en 5) uitkomen, groeit het verschil tussen de twee curves te langzaam om "merkbaar" te blijven voorbij de eerste drempel (zie de doorrekening hieronder). Zowel de basisterm als de kwadratische factor zijn daarom naar **10** gezet.

| Drempel | Wetenschapskosten (cumulatief) |
|---|---|
| 1 | 10 |
| 2 | 20 |
| 3 | 50 |

*Doorrekening tegen de Sterrencirkel-opbrengst*: met dezelfde near-optimale opening als de cultuur-doorrekening hierboven (Houtkap → Boerderij → Steengroeve → Heiligdom, actief rond beurt 10-13) is het bouw-ritme (hoofdstuk 16: 1 nieuw project per 3 beurten) na het Heiligdom vrij voor een Sterrencirkel — met dezelfde bouwtijd en wegaanleg-tijd als het Heiligdom komt die rond **beurt 17** actief. Vanaf dan loopt wetenschap met 2/beurt op (één Sterrencirkel op de frontier):

| Drempel | Wetenschapskosten | Beurt bereikt (indicatief) | Vergelijkbare cultuurlaag | Beurt bereikt (cultuur, indicatief) |
|---|---|---|---|---|
| 1 | 10 | ~22 | laag 2 (8) | ~16 |
| 2 | 20 | ~27 | laag 3 (23) | ~24 |
| 3 | 50 | ~42 | laag 4 (48) | ~36 |

Het verschil met de vergelijkbare cultuurlaag loopt op van ~6 naar ~9 beurten — een oplopend, dus **merkbaar** tempoverschil, precies zoals het issue vraagt ("wetenschap moet spelbaar merkbaar trager gaan dan cultuur"), zonder dat de boom onbereikbaar wordt: drempel 3 valt ruim vóór het einde van de 12 tutorial-lagen (de cultuurkosten lopen daar al op tot 400-600, zie de cultuurkosten-tabel hierboven — de tutorial duurt dus sowieso veel langer dan 42 beurten). Het zwaardere tempo is bewust: wetenschap levert permanente, structurele bonussen op (een boerderij die voorgoed 20% meer opbrengt, een opslag-cap die voorgoed +10 is) in plaats van eenmalige toegang tot een laag — zie hoofdstuk 11 voor de volledige onderbouwing.

> ⚠️ **Nog te implementeren — let op**: de tech **"vlotten"** (B1a) belooft dat de settler rivier-vakjes kan oversteken, maar heeft in de huidige MVP-code **geen enkel waarneembaar effect**: er bestaat nog geen enkele vorm van bewegingsbeperking bij water (`versWater` op een tile is uitsluitend een stichtings-geschiktheids-vlag, geen doorgangs-blokkade — zie `world.ts`/`wegen.ts`), dus er is niets om op te heffen. De functie `settlerKanRivierOversteken` (`src/game/techTree.ts`) bestaat al en staat klaar, maar wordt nergens aangeroepen. Dit moet alsnog gebouwd worden zodra een water-doorgangsregel wordt toegevoegd — tot die tijd is de keuze voor "vlotten" in de technologie-boom cosmetisch.
>
> Ter vergelijking: **"wiel"** (B1) is wél functioneel gewired (`settlerWegaanlegGratis`, gebruikt in `economie.ts`) — wegaanleg kost de settler daarmee geen aparte actie meer — maar dat is een bewust gekozen interpretatie ("dichtstbijzijnde zinvolle interpretatie" van "sneller wegen aanleggen", zie de code-comments in `techTree.ts`), geen letterlijke snelheids-verhoging. Dit is geen open werkpunt zoals "vlotten", maar wel het vermelden waard als de daadwerkelijke tech-tekst ooit herzien wordt.

*Opslag-cap (issue: "stad stichten op de frontier" deel 3, doorgerekend tegen de code)*: start op 30, elke Opslagplaats-improvement +20, praktisch maximum ~3-4 opslagplaatsen per stad (~110 totaal). **Correctie op eerdere beschrijving**: dit is in de daadwerkelijke implementatie een cap **per grondstof** (hout/steen/erts/goud elk apart tot 30, niet hun gezamenlijke som) — anders dan "gedeelde opslag" in hoofdstuk 5 en eerdere versies van dit hoofdstuk suggereren. De opslagplaats-waarde (`OPSLAGPLAATS.kosten`, hoofdstuk 3) is **8 hout, 6 steen**, bouwtijd **3 beurten**; het effect (+20 opslag-cap) geldt voor alle vier grondstoffen tegelijk. Deze architectuur is bewust ongewijzigd gelaten bij het doorrekenen van de stichtingskosten hieronder (een refactor naar een echt gedeelde cap is een aparte, grotere wijziging) — in plaats daarvan zijn de stichtingskosten erop afgestemd.

*Stichtingskosten (hoofdstuk 2/10/14, issue: "stad stichten op de frontier" deel 3)*: **10 hout, 4 steen, 3 erts, 8 voedsel**. Oorspronkelijk vastgesteld op 40 hout, 15 steen, 10 erts, 30 voedsel (zie git-historie voor de volledige doorrekening tegen de per-grondstof opslag-cap uit die tijd) — **issue #187 ("stad stichten veel goedkoper")** heeft alle vier bedragen daarna 4x zo goedkoop gemaakt (gedeeld door 4, afgerond). Gevolg: het stichten forceert niet langer een Opslagplaats vóór laag 13 (10 hout blijft ruim onder de start-cap van 30) — dat was met de oorspronkelijke bedragen wel bewust het geval, maar de expliciete kostenverlaging weegt hier zwaarder.

*Nieuwe settler (hoofdstuk 3/11/16)*: kosten **10 hout, 4 steen**, bouwtijd **4 beurten** — vergelijkbaar met Woonwijk (6 hout, 4 steen, 4 beurten), de improvement waarmee hij in dezelfde civiele wachtrij concurreert.

*Groei-tier kosten (voedsel)*: **correctie op eerdere beschrijving** — de huidige code gebruikt klein→middel = **40 voedsel** (`VOEDSEL_DREMPEL_GROEI`, `src/game/world.ts`) + **4 beurten** bouwtijd (Woonwijk-improvement, `src/game/improvements.ts`), lager dan de eerder hier genoemde 100 voedsel/5 beurten. Dit is in de huidige MVP-scope (hoofdstuk 13: één groei-tier-stap) ook de enige geïmplementeerde stap; middel→groot bestaat nog niet in de code — er is geen aparte formule of kostenwaarde voor deze tier vastgelegd.

*Voedselverbruik & verval-drempel*: een kleine stad verbruikt 2 voedsel/beurt, middel 4, groot 6 — tegenover de productie van actieve, wegverbonden boerderijen. De "kritiek"-waarschuwing verschijnt zodra de voorraad bij het huidige netto-tempo naar verwachting binnen 5 beurten op zou raken; bij daadwerkelijk 0 voedsel stort de stad in (hoofdstuk 4).

*Wachttoren-bemanning (hoofdstuk 6/11, issue: "wachttorens, bemanning en bevoorrading")*: elke bemande Wachttoren kost **1 voedsel/beurt**, bovenop het stadsverbruik hierboven. Doorgerekend tegen de boerderij-opbrengst (4 voedsel/beurt, uitputting pas na 15-20 beurten): een kleine stad met 1 actieve boerderij houdt na het eigen verbruik (2) nog 2 voedsel/beurt over — genoeg voor 2 bemande wachttorens zonder in de min te komen; met 2 boerderijen (8) is dat 6 over, genoeg voor 6. Een middelgrote stad (verbruik 4) heeft met 2 boerderijen (8) een marge van 4 wachttorens, met 3 (12) een marge van 8. Omdat elke tutorial-laag minstens 2 (en meestal 3-6) vlakke vakjes heeft (vaste terrein-indeling per laag, zie hoofdstuk 11 "Terrein-eisen per land improvement"), is een boerderij zelden het knelpunt, en groeit het aantal boerderijen dat een speler gaandeweg de 12 tutorial-lagen bouwt doorgaans mee met het aantal wachttorens dat nodig is om ze te verdedigen. Bij een typische build (2-4 boerderijen tegen de tijd dat er meerdere wachttorens staan) blijft 1 voedsel/beurt per toren dus ruim binnen de marge — geen aanpassing elders in de voedseleconomie nodig (zie hoofdstuk 11 voor de volledige onderbouwing).

*Winkans-formule militaire confrontaties*:
> Winkans = eigen legerwaarde / (eigen legerwaarde + vijand legerwaarde), geclampt tussen **5% en 95%** (`WINKANS_MIN`/`WINKANS_MAX`, `src/game/economie.ts`).
>
> **Correctie op eerdere beschrijving**: dit document noemde eerder een clamp van 10%-90%; de daadwerkelijke implementatie clampt ruimer, op 5%-95%.

*Indringers & tribuut (hoofdstuk 6)*: kans op een indringers-incident (één trekking voor de hele stad, niet per laag) = 20% per beurt (MVP-richtwaarde, tunebaar; verlaagd vanaf de eerdere 40% op alleen de frontier-laag), getrokken over alle ontgrendelde lagen samen — geen aanwezigheids-eis meer, en pas een factor vanaf laag 2 (verlaagd vanaf laag 3) — de eerste laag blijft zo een rustige introductie. Tribuut zonder beschermende (voltooide, bemande én wegverbonden) wachttoren op de getroffen laag = ongeveer de helft (afgerond, minimaal 1) van het grondstof-type waar de speler op dat moment het meest van heeft, nooit meer dan de aanwezige voorraad. Een laag met een actieve Amberader (issue: "Amberader: bonus/malus-koppeling", hoofdstuk 6/11) weegt in die laag-trekking **2× zo zwaar** als een gewone laag (`AMBERADER_INDRINGERS_GEWICHT`, `src/game/economie.ts`) — MVP-richtwaarde, tunebaar.

*Derde uitkomst voor een beschermde laag (hoofdstuk 6/11, issue: "wachttorens kunnen vernietigd worden door indringers")*: bij een incident op een beschermde laag (frontier of niet) — **standhouden 85%** (`INDRINGERS_STANDHOUDEN_KANS`), **malus (Wachttoren-ruïne + verloren strijder) 10%** (`INDRINGERS_MALUS_KANS`), **bonus (buit) 5%** (het restant van de kansruimte) — allemaal MVP-richtwaarden, tunebaar, met behoud van de volgorde standhouden ♦ malus ♦ bonus van vaakst naar zeldzaamst. Buit-bedrag bij de bonus-uitkomst = **6 goud** (`INDRINGERS_BUIT_GOUD`, `src/game/economie.ts`) — MVP-richtwaarde, tunebaar, direct aan de gedeelde opslag toegevoegd (binnen de opslag-cap).

*Kuddes (hoofdstuk 17, issue: "kudde frequentie verlagen")*: kans op een nieuwe wilde kudde per beurt, zodra laag 4 of hoger ontgrendeld is = **5%** (MVP-richtwaarde, tunebaar; `A2a. Veeteelt` vermenigvuldigt dit met 1,5×, hoofdstuk 3/9) — verlaagd vanaf de eerdere 15%. Een kudde kent geen eigen verval: alleen volledig leegjagen (4 jachtbeurten) of overbouwen verwijdert er een, dus het aantal tegelijk aanwezige kuddes is in de praktijk de kans vermenigvuldigd met hoe lang een kudde gemiddeld blijft staan, niet alleen de kans zelf. Bij 15%/beurt en een speler die niet elke kudde meteen kan leegjagen (settler-reistijd tussen lagen, concurrerende settler-acties zoals wegen aanleggen) liep dat gemiddelde aantal in de praktijk op tot ruim boven de bedoelde 1-2 tegelijk; bij 5%/beurt daalt dat evenredig naar het beoogde tempo — een speler die actief jaagt houdt zo doorgaans 1, hooguit 2 kuddes tegelijk op de ontgrendelde lagen. Voedselaanvulling via jagen blijft daarmee overeind (elke individuele kudde levert nog steeds 4×3 = 12 voedsel over de gebruikelijke jachtbeurten, hoofdstuk 17) — alleen het aánbod aan kuddes wordt schaarser, niet de opbrengst per kudde. Minder kuddes betekent ook minder jachtmomenten en dus minder kans op een roofdier-encounter (hieronder); dat is een geaccepteerd neveneffect van deze frequentie-tweak, geen reden om de roofdier-kans zelf aan te passen.

*Roofdieren (hoofdstuk 17)*: kans op een roofdier per jachtactie op laag 5 of hoger = **15%** (MVP-richtwaarde, tunebaar) — geen aparte per-beurt- of per-laag-kans, alleen getrokken op het moment dat de settler daadwerkelijk jaagt. Het roofdier verschijnt op het jachtvakje zelf en valt pas de beurt erna aan, wat de speler één beurt geeft om de settler weg te bewegen voordat hij sterft.

**Bezette Laag, Missionaris & Verkenner (hoofdstuk 3/6/10/11/13/14, issue: "De Bezette Laag, missionaris en verkenner")**

*Offer Altaar*: kosten **3 hout, 12 steen, 3 erts, 3 goud**, bouwtijd **3 beurten** — alle vier grondstoffen, in lijn met hoe de speler dit aanleverde. MVP-richtwaarde, tunebaar. Geen terrein-eis (net als Heiligdom).

*Legerkamp*: kosten **12 hout, 3 steen, 3 erts, 2 goud**, bouwtijd **3 beurten** — MVP-richtwaarde, tunebaar. Geen terrein-eis, `bouwbaarBuitenFrontier` (zelfde uitzondering als de Wachttoren).

*Verkenner*: kosten **3 hout, 1 erts**, bouwtijd **2 beurten** — lichter dan Soldaat (2 erts, 1 hout, 2 beurten), MVP-richtwaarde, tunebaar.

*Missionaris*: kosten **2 hout, 2 goud**, bouwtijd **2 beurten** — hout/goud i.p.v. erts, in lijn met een culturele in plaats van militaire unit. MVP-richtwaarde, tunebaar.

*Verkenning-kosten*: **10 wetenschap** per Verkenning (`VERKENNING_KOSTEN_WETENSCHAP`, `src/game/economie.ts`), afgetrokken van dezelfde wetenschap-pool als de technologie-boom (hoofdstuk 3/9) — MVP-richtwaarde, tunebaar. Hoogstens 1 Verkenning per beurt, zelfde soort beurt-limiet als de settler-acties.

*Belegeringsdrempel*: **30** cultuur-inkomen per vernietigd vijandelijk Heiligdom (`BELEGERINGSDREMPEL`, `src/game/economie.ts`) — MVP-richtwaarde, tunebaar. Alleen opgebouwd zolang de speler minstens één Missionaris heeft; de meter begint na elke vernietiging weer bij 0.

*Vijandelijke Wachttoren-legerwaarde*: hergebruikt het bestaande, per laag oplopende `dreigingsniveau` (`dreigingsniveauVoorLaag(hoogte) = max(0, (hoogte-1)×2)`, `src/game/world.ts`) — op laag 12 dus **22**, hetzelfde precedent-getal dat de laag als frontier-dreiging toch al draagt, en daarmee automatisch vergelijkbaar met de zwaarste tegenstander die de speler tot dan toe in de tutorial is tegengekomen. Geen apart, nieuw getal nodig.

*Bezette-Laag-inhoud (tutorial, laag 12)*: van de 9 vakjes dragen er 8 vaste inhoud — 2 vijandelijke Wachttorens (Confrontatie-doelen), 2 vijandelijke Heiligdommen (Belegeringsdoelen), 4 cosmetische huisjes (geen doel, geen functie); het middelste vakje blijft neutraal (gewoon een leeg vakje zodra onthuld). Vaste, niet-procedurele worldgen, net als de overige tutorial-inhoud (hoofdstuk 8/11).

**City-improvement-capaciteit, Grote Woonwijk & vier nieuwe city improvements (hoofdstuk 3/4/6/11/13, issue: "city improvements")**

*City-improvement-cap*: klein **1**, middel **3**, groot **5** gelijktijdige city improvements uit de gecapte pool (Bibliotheek, Markt, Barakken, Tempel, Grote Tempel — Tempel en Grote Tempel tellen als twee aparte sloten). Opslagplaats en de groei-tier-improvements (Woonwijk/Grote Woonwijk) tellen hier niet in mee (hoofdstuk 4/11).

*Grote Woonwijk (tweede groei-tier, middel→groot)*: kosten **12 hout, 8 steen**, bouwtijd **6 beurten**, voedseldrempel **100** (`VOEDSEL_DREMPEL_GROEI_GROOT`, `src/game/world.ts`) — ongeveer het dubbele bouwprofiel van de Woonwijk (6 hout, 4 steen, 4 beurten, drempel 40), passend bij de grotere sprong. *Doorrekening tegen de late-tutorial-voedseleconomie*: een middelgrote stad verbruikt 4 voedsel/beurt (`VOEDSEL_VERBRUIK`); tegen de tijd dat een speler richting laag 10+ speelt (waar de Sterrencirkel/Amberader-doorrekeningen elders in dit hoofdstuk al van uitgaan) staan er doorgaans 2-3 actieve, wegverbonden boerderijen (4 voedsel/beurt elk, hoofdstuk 3/14). Bij 2 boerderijen (8 voedsel/beurt) is het netto-overschot 4/beurt, bij 3 boerderijen (12) is dat 8/beurt — de drempel van 100 is dan binnen resp. ~25 en ~13 beurten spaarbaar, ruim binnen de tientallen beurten die toch al nodig zijn om van laag 10 naar laag 13 te komen (zie de cultuurkosten-tabel hierboven: laag 12 kost al 608 cumulatieve cultuur). De drempel is daarmee een bewuste, voelbare maar niet onhaalbare tweede groei-stap.

*Bibliotheek*: kosten **6 hout, 4 steen, 2 erts**, bouwtijd **3 beurten**, effect **+10 wetenschap/beurt**. Geen stadsgrootte-eis.

*Markt*: kosten **5 hout, 6 steen**, bouwtijd **3 beurten**, effect **+2 goud/beurt**. Geen stadsgrootte-eis.

*Barakken*: kosten **4 hout, 8 steen, 4 erts**, bouwtijd **3 beurten**, effect **+10 permanente legerwaarde** (stad-breed, geen bemanning nodig — anders dan de Wachttoren-bonus, telt mee bij zowel een gewone Confrontatie als een Confrontatie tegen een Bezette Laag). Stadsgrootte-eis **middel** (aanname uit het issue zelf, "pas aan als dat niet de bedoeling is").

*Tempel*: kosten **6 hout, 6 steen**, bouwtijd **3 beurten**, effect **+5 cultuur/beurt**. Stadsgrootte-eis **middel**.

*Grote Tempel*: kosten **4 hout, 14 steen, 4 erts, 4 goud**, bouwtijd **4 beurten**, effect **+10 cultuur/beurt**, cumulatief bovenop een al gebouwde Tempel (samen dus +15 cultuur/beurt — twee aparte city-improvement-sloten, geen vervanging). Stadsgrootte-eis **groot**.

Alle kosten/effecten hierboven zijn MVP-richtwaarden, expliciet tunebaar (issue: "city improvements").

**Legerkamp/Offer Altaar-infrastructuur-eis, doorgerekend (hoofdstuk 4/6/11, issue: "city improvements" Deel 4)**

*Eis*: Legerkamp pas bouwbaar vanaf **5 actieve Wachttorens** (bemand of onbemand) **+ een gebouwde Barakken** (vereist zelf stadsgrootte "middel"); Offer Altaar pas bouwbaar vanaf **5 actieve Heiligdommen + een gebouwde Grote Tempel** (vereist stadsgrootte "groot").

*Haalbaarheid binnen de 13 tutorial-lagen*: elke laag heeft 8 bebouwbare land-vakjes (het negende is de stad). Over de hele tutorial is dat 13 × 8 = **104 land-vakjes**. Wachttoren is vanaf laag 2 bouwbaar (11 van de 13 lagen, dus tot 88 vakjes in aanmerking) en heeft, net als het Legerkamp zelf, geen terrein-eis; Heiligdom heeft evenmin een terrein-eis en is vanaf laag 1 bouwbaar. Een speler die de economische basis dekt (per laag doorgaans 1 houtkap/mijn/boerderij/steengroeve/Sterrencirkel/Amberader-vakje, hoofdstuk 3/11/14: "elke laag houdt bewust minstens één vakje van elk relevant subtype aan") laat typisch 2-4 vakjes per laag over voor overige keuzes. De 5+5 Wachttorens/Heiligdommen plus de Legerkamp/Offer Altaar-tiles zelf kosten samen **12 vakjes** — bij een gemiddelde van pakweg 3 vrije vakjes/laag over de hele tutorial (ruim 30 in totaal) is dat **goed haalbaar**, zeker omdat Wachttoren/Legerkamp `bouwbaarBuitenFrontier` zijn en dus niet per se op de frontier-laag zelf hoeven te staan (de speler kan dus ook op reeds gepasseerde lagen bijbouwen). De stadsgrootte-eisen (Barakken: middel, Grote Tempel: groot) vallen samen met de toch al beoogde groei-doorrekening hierboven, en de Bibliotheek/Markt/Tempel-sloten (cap, zie hierboven) beperken dit niet extra: Barakken en Grote Tempel passen ruim binnen de cap van 3 resp. 5 sloten. **Conclusie**: de eis is fors genoeg om een bewuste, meerdere-lagen-brede investering te vragen (zoals bedoeld — de speler moet zijn infrastructuur echt hebben opgebouwd voor de Bezette-Laag-climax op laag 12), maar ruim haalbaar binnen de 13-laags tutorial zolang de speler er gericht op bouwt vanaf pakweg laag 2-3.

**Amberader/goudmijn & rush-bouwen (hoofdstuk 3/11/14, issue: "toevoeging Goud")**

*Plaatsingskans t.o.v. erts*: de tutorial-worldgen is (net als het overige terrein, hoofdstuk 8/11) volledig vast, geen procedurele kansberekening — de schaarste van een Amberader-locatie is daarom uitgedrukt als een verhouding tussen vaste vakjes, niet als een percentage. Van de 33 heuvel/bergvakjes over de hele 12-laags tutorial (elk daarvan een geldige erts-mijn-locatie) hebben er precies **3** een amberader-vondst — ruwweg **1 op de 11**, tegenover "elk heuvel/bergvakje" voor een gewone mijn. Bij een latere procedurele campagne (hoofdstuk 8) vertaalt deze verhouding zich naar een vergelijkbare kans per geschikt vakje.

*Gegarandeerde eerste locatie*: de eerste amberader-vondst ligt vast op **laag 7**, positie 0 — net als de vers-water-garantie voor stad-stichten op laag 13 (hoofdstuk 2/6) een vaste worldgen-toewijzing, geen kans. Zodra laag 7 voor het eerst ontgrendelt, toont het spel de ontdekkingspop-up (hoofdstuk 3, flavor-tekst in tutorialContent.ts).

*Gegarandeerde tweede locatie (issue: "Amberader sowieso op laag 12" — softlock-preventie)*: een tweede, eveneens gegarandeerde amberader-vondst ligt vast op **laag 11**, positie 2 (een bergvakje). Reden: een speler die de eerste Amberader (laag 7) liet uitputten zonder ooit een Markt te bouwen, zou anders zonder lopend goud-inkomen tegen laag 12 kunnen aanlopen — precies de laag waar zowel Offer Altaar als Legerkamp goud vereisen (hoofdstuk 11, "Legerkamp/Offer Altaar-infrastructuur-eis"). Vlak vóór laag 12 gekozen: laat genoeg om de speler eerst zelf een Markt te laten proberen, maar nog op tijd om alsnog goud op te bouwen vóór het relevant wordt. Identiek aan de eerste Amberader qua kosten, uitputtingsprofiel en de indringers-aantrekkelijkheids-malus hieronder — geen nieuwe variant, gewoon een tweede exemplaar van hetzelfde land improvement (`AMBER_ONTDEKKING_LAAG_2`, `src/game/world.ts`). Zodra laag 11 voor het eerst ontgrendelt, toont het spel dezelfde soort ontdekkingspop-up, met een lichte tekstvariant (`AMBER_ONTDEKKING_TWEEDE_TITEL`/`_TEKST`, tutorialContent.ts) die past bij een tweede vondst in plaats van de eerste verwondering.

*Amberader-bouwprofiel*: kosten en bouwtijd gelijk aan de gewone Mijn (**8 hout, 4 steen**, bouwtijd **3 beurten**), effect **2 goud/beurt** — zelfde opbrengst-schaal als Mijn (2 erts/beurt).

*Rush-bouwen-prijs*: **5 goud per weggekochte beurt** (`RUSH_GOUD_PER_BEURT`, tunebaar). Van toepassing op elke lopende land- of city-improvement in de bouwwachtrij (hoofdstuk 5); nooit op de technologieboom (hoofdstuk 11).

**Lange mars (Anker 3, na Terugvechten — Amerikaanse campagne)**
- Uitgestrekt over 3-4 opeenvolgende lagen in plaats van één piekmoment.
- Vooruitkijk-bereik tijdelijk teruggezet naar 0 extra lagen tijdens deze reeks.
- Alle land improvements in deze lagen hebben standaard verlaagde opbrengst (het beschadigde land werkt door).
- Geen nieuwe stad te stichten binnen deze reeks.
- Zichtbare voorraadmeter (materiaal tegenover resterende lagen) i.p.v. een harde timer.
- Bij te weinig voorraad aan het einde: geen instant game-over, maar een verzwakte aankomst (kleinere stad-status bij de oceaan, beïnvloedt slotscène/flavor) — consistent met "hard maar eerlijk" bij nederlagen.

**Volgorde/unlock-logica overige campagnes**
Na het voltooien van de Amerikaanse frontier-campagne worden alle overige campagnes **in één keer ontgrendeld** — geen verdere gedwongen volgorde, omdat er geen inhoudelijke leercurve-afhankelijkheid tussen de latere campagnes bestaat (in tegenstelling tot tutorial → Amerika). **Besloten: geen cross-campagne relic-bonussen of ander meta-progressiesysteem tussen campagnes** — elke campagne staat op zichzelf, om de rogue-like puurheid (elke run is een eigen uitdaging, zonder consolatieprijzen of stapelende voordelen) niet te verwateren.

**Herbruikbaar ankersjabloon voor overige campagnes**
Gebaseerd op hetzelfde 3-anker-ritme als de Amerikaanse campagne, generiek te vullen per campagne:

| Anker | Universele functie | Toe te passen op |
|---|---|---|
| 1 (laag 8-10) | Eerste contact/keuze die een "spoor" achterlaat | Historisch passend eerste-contact-moment |
| 2 (laag 16-18) | Escalatie op basis van Anker 1 | Twee vertakkende gevolgen, elk met een ander lange-termijn-effect |
| 3 (eindspel) | Gedeelde slotscène met tonale varianten per pad | Thematisch passend obstakel — niet per se militair; kan bestuurlijk, economisch of anderszins zijn |

Voorbeeldinvulling (Mongoolse campagne, ter illustratie van het sjabloon):
- Anker 1: een steppevolk kruist je pad — toenadering voor ruiter-technologie, of onderwerping voor direct gebied.
- Anker 2: bij toenadering → bondgenootschap (hogere mobiliteit, tragere civiele groei, passend bij het Mongoolse thema "verovering makkelijk, behoud moeilijk"); bij onderwerping → georganiseerd verzet richting Anker 3.
- Anker 3: obstakel draait om een overspannen, moeilijk te behouden gebied, in plaats van een fysieke horde.

Dit sjabloon, met bijpassende historische invulling, dient als basis voor de resterende campagnes: Hellenistisch, Romeins, Bantu, Vikings, Spaanse conquista, VOC, Siberisch/Tataars.

---

## 15. Huidige prioriteit & later op te pakken

**Nu**: alleen de tutorial ("De Eerste Vuren", Het Hertenpad-volk) bouwen volgens de MVP-scope in hoofdstuk 13.

**Daarna**: de Amerikaanse frontier-campagne inhoudelijk en technisch volledig uitwerken (ankers staan al beschreven in hoofdstuk 9; nog te doen: implementatie, resterende content zoals zeldzaamheid en pushback-diplomatie die in de MVP bewust zijn uitgesteld).

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
- Verplaatst **1 vakje per beurt**: vooruit/achteruit (een laag omhoog/omlaag, dezelfde positie in de band) of zijwaarts (dezelfde laag, één positie links/rechts) — nooit diagonaal, en nooit buiten al ontgrendeld gebied.
- Kan in plaats van bewegen ook een **weg aanleggen** op het vakje waar hij staat. Dat kost geen grondstoffen, alleen die ene beurt (geen meerdere-beurten-wachtrij zoals bij improvements, hoofdstuk 5).
- Eén actie (bewegen óf een weg aanleggen) per beurt — de speler hoeft de settler niet elke beurt te gebruiken.
- Visueel: een huifkar, in lijn met de MVP-plaatshouderstijl (hoofdstuk 13: "grove/simpele placeholders zijn prima").

**Wegen activeren resource-productie**
- Een land improvement (mijn, boerderij, houtkap, steengroeve, heiligdom, wachttoren) is pas **actief-producerend** zodra er een weg **op zijn eigen vakje** ligt, én die weg via een aaneengesloten keten van wegen verbonden is met de stad-tile. Een weg die alleen tót het improvement leidt, zonder er zelf op te liggen, is niet genoeg — de speler moet de weg daadwerkelijk over/op het resource-vakje aanleggen.
- Zonder die eigen wegverbinding blijft de improvement gewoon gebouwd en zichtbaar, maar levert hij niets op totdat de wegverbinding er is — en telt hij ook niet mee voor uitputting (hoofdstuk 4): pas zodra een improvement daadwerkelijk produceert, telt de uitputtingsteller af.
- Dezelfde eis geldt voor de indringers-bescherming van een Wachttoren (hoofdstuk 6): een gebouwde en bemande Wachttoren zonder eigen wegverbinding beschermt zijn laag nog niet. Pas met een aaneengesloten wegketen naar de stad is een Wachttoren, net als elke andere land improvement, echt "actief" — en dus in staat zijn functie te vervullen. Dit maakt expliciet wat hoofdstuk 6 vereist ("voltooid, bemand én verbonden"): de drie voorwaarden zijn geen aparte regel, maar dezelfde activerings-eis die hier voor alle land improvements geldt.
- Dit maakt wegenaanleg geen losstaand extraatje maar een echte voorwaarde voor de economie — de actieve handeling die de rustigere bouw-ritme hierboven opvult.

**Tutorial**
- Bij beurt 2 (zodra de settler verschijnt) krijgt de speler een eenmalige uitleg-pop-up over de settler, wegen en het nieuwe bouw-ritme — los van, en aanvullend op, de bestaande per-beurt basisbegrippen-uitleg (grondstoffen/improvements) uit de eerste beurten.

**Stad stichten (hoofdstuk 2/10/11, issue: "stad stichten op de frontier")**
- Naast bewegen, weg aanleggen, jagen en hout hakken (hoofdstuk 17) kan de settler, wanneer hij op een geschikt (vers-water) vakje staat, in plaats daarvan **stichten**: een nieuwe stad neerzetten op zijn huidige vakje. Dit is geen herhaalbare per-beurt-actie zoals de andere vier — de speler kan stichten zodra hij er klaar voor is, ongeacht of hij deze beurt al een settler-actie heeft gebruikt.
- De speler krijgt eerst een duidelijke bevestigingswaarschuwing: **de settler verdwijnt bij het stichten** ("de huifkar wordt de stad"). Pas na bevestigen worden de stichtingskosten (hoofdstuk 14) betaald en verschijnt de nieuwe stad-tile.
- Een nieuwe settler is daarna alleen te verkrijgen via de civiele improvement-pool (hoofdstuk 3/11), concurrerend met de groei-tier-improvement, en alleen zolang het aantal settlers lager is dan het aantal gestichte steden (hoofdstuk 11: "maximaal één settler per gestichte stad").

---

## 17. Kuddes & settler-jacht

Nieuw spelmechanisme (in de MVP, zie hoofdstuk 13): twee extra, directe settler-acties naast bewegen en weg aanleggen (hoofdstuk 16) — jagen op wilde kuddes voor voedsel, en hout hakken op een bos-vakje. Zie hoofdstuk 11 ("Settler-jacht op kuddes...") voor de reden achter deze keuze.

**Wilde kuddes**
- Vanaf **laag 4** kan elke beurt, met een kleine kans (**5%**, MVP-richtwaarde, tunebaar — hoofdstuk 14), een wilde kudde verschijnen op een leeg vakje van een al ontgrendelde laag (laag 4 of hoger).
- Een kudde staat los van improvements: het vakje blijft "leeg" (er kan nog steeds op gebouwd worden — bouwen op een kudde-vakje laat de kudde verder trekken, zie hieronder).
- Een kudde is eindig: ze biedt in totaal **4 jachtbeurten** voordat ze verder trekt (net als de uitputting van land improvements, hoofdstuk 4, maar zonder ghost-town-tile erna — het vakje wordt gewoon weer een normaal leeg vakje).
- Verschijnt een kudde, dan meldt een pop-up dit meteen — dezelfde stijl als de indringers-pop-up (hoofdstuk 6): een korte melding met flavor-tekst en de laag waar de kudde staat. Zo hoeft de speler niet toevallig op de kaart te zien waar hij de settler heen kan sturen om te jagen.

**Jagen**
- De settler moet eerst naar het vakje met de kudde verplaatst worden (kost, net als elke verplaatsing, de settler-actie van die beurt).
- Staat de settler op een kudde-vakje, dan kan hij in plaats van bewegen/weg aanleggen ook **jagen**: dat levert die beurt direct **3 voedsel** op en telt één jachtbeurt van de kudde af.
- Na 4 jachtbeurten (in totaal, niet per se aaneengesloten) is de kudde uitgeput en verdwijnt ze; de speler kan opnieuw naar een andere, nieuw verschenen kudde trekken.
- Wordt er op het kudde-vakje gebouwd voordat de kudde uitgeput is, dan trekt de kudde meteen verder (het vakje verliest zijn kudde-status).

**Roofdieren**
- Vanaf **laag 5** — één laag na de introductie van kuddes zelf (laag 4, hierboven) — brengt jagen een risico met zich mee, zodat de speler eerst met de kudde-mechaniek heeft kennisgemaakt voordat dit risico erbij komt.
- Geen losstaande, willekeurige kans per laag of per beurt (zoals bij kuddes hierboven of indringers, hoofdstuk 6): een roofdier is uitsluitend een **gevolg van jagen**. Elke keer dat de settler jaagt op een kudde op laag 5 of hoger, is er een kans (MVP-richtwaarde 15%, tunebaar — hoofdstuk 14) dat een roofdier verschijnt, op datzelfde vakje.
- Het ritme volgt de signature-mechanic van het spel (waarschuwing → kort reactievenster → gevolg, hoofdstuk 7):
  1. **Waarschuwing**: het roofdier is meteen zichtbaar op de kaart, op het vakje waar de settler zojuist jaagde. Een pop-up meldt zijn komst — dezelfde stijl als de indringers- en kudde-pop-up hierboven: korte flavor-tekst, geen paniekerige taal.
  2. **Reactietijd**: het roofdier valt pas de **beurt erna** aan, niet meteen. De speler heeft die tussenliggende beurt om de settler weg te bewegen (een gewone verplaatsings-actie, hoofdstuk 16) en zo te ontsnappen.
  3. **Gevolg**: staat de settler nog op (of keert hij terug naar) het vakje met het roofdier wanneer die beurt om is, dan **sterft de settler**.
- Verlies van de settler activeert de bestaande regel uit hoofdstuk 6/13: is het aantal settlers lager dan het aantal steden (de startstad Holenrots telt hierbij mee, ook al is die niet via de stichter-actie ontstaan, hoofdstuk 16), dan verschijnt de huifkar weer als optie in de civiele improvement-pool. Dit is de eerste situatie waarin die regel al van toepassing is vóórdat er ooit gesticht is.
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
