# Frontier City — Design Document

Een rogue-like Civilization voor mobiel, waarbij je niet horizontaal een kaart ontdekt, maar verticaal een beschaving opbouwt in gestapelde lagen, richting een oceaan aan de overkant.

---

## 1. Kernconcept

- Je bouwt een beschaving **omhoog**, laag voor laag, in plaats van uit te breiden over een platte kaart.
- Elke beurt kies je een **categorie** (Economisch, Wetenschappelijk, Militair, Civiel, Cultureel), krijgt daarna **2-3 concrete opties** binnen die categorie te zien, en kiest er één.
- Drie soorten improvements: **city improvements** (in het centrum-vakje van een laag), **land improvements** (de omliggende vakjes — boerderijen, mijnen, af en toe een nieuwe stad), en **units**.
- **Win-conditie**: bereik de oceaan aan de overkant van een procedureel gegenereerd continent.

---

## 2. Ruimtelijk model

- Bovenaanzicht zoals klassieke Civilization, maar beperkt tot een **verticale band van 9 vakjes breed**.
- Onderste laag = startstad (begint aan een oceaan). Daarboven telkens nieuwe lagen. Onder die onderste laag toont het scherm een rij klikbare oceaan-tegels, zodat meteen duidelijk is waar de reis begint — puur sfeer/flavor-tekst bij een klik, niet bebouwbaar.
- **Fog of war** boven je huidige ontgrendelde grens; wordt weggehaald door cultuur te verzamelen.
- **Vooruitkijken**: je ziet standaard 1 laag verder dan je ontgrendelde grens (terreintype + vage dreigingsindicatie, geen exacte details). Uitbreidbaar via wetenschap-drempels (permanent, tot een max van 3-4 lagen) en via de Verkenner-unit (tijdelijke, gerichte blik verder).
- Elke laag heeft **9 bouwvakken**: middelste = stad (max 1 stad per laag), overige 8 = land improvements.
- Je speelt met **1 actieve frontier-stad** tegelijk. Sticht je een nieuwe stad (op een geschikte locatie, verderop), dan schuift het scherm op — je nieuwe stad begint onderaan, als nieuwe frontier.
- Niet-volledig bebouwde lagen **sluiten permanent** zodra je een nieuwe stad start.
- Oudere, achtergelaten steden leveren **geen** lopende resource-inkomsten meer (bewust, voor het frontier-gevoel) — hun waarde zit in de specialisatie-relics die ze hebben opgeleverd voor je vertrok.

---

## 3. De vijf categorieën

| Categorie | City improvement (vb.) | Land improvement (vb.) | Unit | Relic (permanent, bij specialisatie) |
|---|---|---|---|---|
| **Economisch** | Markt, opslagplaats | Boerderij, mijn, houtkap | Karavaan | Goedkopere improvements in elke volgende stad |
| **Wetenschappelijk** | Bibliotheek, observatorium, universiteit | Onderzoekspost | Verkenner (tijdelijke extra vooruitkijk) | Permanent groter vooruitkijk-bereik |
| **Militair** | Barakken, muur, wapensmid | Wachttoren (beschermt lege lagen tegen barbaren) | Soldaat, ruiter, artillerie | Extra unit-slot / gratis startgarnizoen |
| **Civiel** | Aquaduct, riolering, woonwijk (= groei-tiers) | Weg, brug | Ingenieur (versnelt bouw) | Snellere groei-rijptijd in volgende steden |
| **Cultureel** | Tempel, amfitheater, monument | Heiligdom | Missionaris/diplomaat (voor pushback) | Korting op cultuurkosten voor nieuwe lagen |

- Pool-grootte per categorie (basisversie): 6-8 city improvements, 4-6 land improvement-types, 2-3 units.
- Latere campagnes vervangen een deel van de generieke opties door thema-specifieke varianten.

---

## 4. Groei, uitputting & verval (de kernspanning)

- **Stadsgrootte**: klein → middel → groot. Elke tier kost een civiel improvement + rijptijd (geen instant-klik).
- Hoe groter de tier, hoe meer **relic-slots** (specialisatie-bonussen) je kunt vullen — maar hoe langer je blijft, hoe verder het omliggende land uitput.
- **Land improvements putten uit** (per type verschillende snelheid — mijnen sneller dan boerderijen), en worden daarna permanent **ghost-town-tiles**: onbebouwbaar, maar met kleine passieve culturele waarde en een rol in flavor-teksten aan het einde van een run.
- Als het omliggende land grotendeels is uitgeput, verschijnt een **zichtbare waarschuwingsstatus** ("kritiek", voor meerdere beurten) voordat een stad kan instorten.
- **Reageer je op tijd** (vertrekken/relics oogsten): je behoudt alles wat je tot dan toe hebt verdiend.
- **Negeer je het**: kans op volledige ineenstorting — **ook de relics van eerder voltooide tiers gaan dan verloren** (permadeath-risico op stadsniveau). Dit is de centrale risk/reward-gok van elke stad-episode.
- **In de huidige MVP-scope** (hoofdstuk 13: één stad, nog geen meerdere steden/frontier-verplaatsing) is er geen volgende stad om de run mee door te laten lopen: een volledige ineenstorting **eindigt de run** en start de tutorial opnieuw (nieuwe kleine stad, lege lagen, beurt 1). Zodra meerdere steden/frontier-verplaatsing bestaat, kan dit weer een puur stads-niveau-permadeath worden terwijl de run zelf naar de volgende stad doorloopt.
- Bewust **geen kunstmatige tijdsdruk/klok** — de druk komt volledig uit uitputting en schaarste, niet uit een aftellende timer.

---

## 5. Resource-economie

**Gedeelde opslag (met cap, uitbreidbaar via opslagplaats-improvement):**
- **Hout** (van houtkap) — snel, ververst relatief snel, basis voor vroege/culturele improvements
- **Steen** (van steengroeve) — langzamer, duurzaam, nodig voor civiele/grote gebouwen
- **Erts** (van mijnen) — zeldzaamst, snelste uitputting, nodig voor militaire/wetenschappelijke improvements
- **Goud** — voor diplomatie, tribuut, handel, evt. rush-bouwen

**Aparte voorraad (geen gedeelde cap):**
- **Voedsel** — verzameld richting groei-drempels (klein → middel → groot)

**Voortgangs-valuta (geen opslag/cap, cumulatieve teller richting drempel):**
- **Cultuur** → laag-ontgrendeling
- **Wetenschap** → vooruitkijk-bereik

**Bouwen**: geen instant-klik, maar een productiewachtrij — verbruikt elke beurt bouwmateriaal tot voltooiing. Hogere materiaalinkomsten = snellere bouw. Ingenieur-unit versnelt dit extra. Militair heeft bewust géén eigen valuta: puur directe krachtsvergelijking op het moment zelf.

---

## 6. Militair & culturele pushback

**Directe militaire confrontatie:**
- Vergelijking van totale legerwaarde (units + muur/wachttoren-bonus) vs. tegenstander, met een **winkans** (geen gegarandeerde uitkomst).
- Winst: normale uitkomst, mogelijk buit. Verlies: schade (versnelde uitputting van getroffen tiles), geen instant game-over.

**Culturele pushback (sterke tribe weerstaat expansie):**
- Geen gevecht — een **oplopende cultuurkostprijs** (bijv. dubbel) voor het ontgrendelen van die specifieke laag.
- Diplomatiek keuzemoment: **Erkennen/aanpassen** (permanente kleine wederzijdse korting), **Doordrukken** (hogere kost nu, blijvend hogere basiskost daarna), of **Terugtrekken** (laag laten zitten, zijwaarts verder zoeken indien mogelijk).

---

## 7. Ghost towns & zeldzaamheid

- Uitgeputte land-tiles worden permanente **ghost towns**: klein beetje passieve cultuur, rol in flavor bij einde van een run, niet herbouwbaar in de basisversie.
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
- **Volgorde**: tutorial (neolithisch) → Amerikaanse frontier-campagne (eerste, verplicht) → overige campagnes ontgrendelen daarna.
- Meerdere campagnes/saves moeten **gelijktijdig lopen** (opslaan, wisselen tussen runs).

**Toekomstige campagne-ideeën (met kernthema):**
- **Mongoolse expansie** — mobiliteit/verovering makkelijk, behoud/civiele groei moeilijk (spiegelbeeld van Siberië)
- **Alexander de Grote / Hellenistisch** — nadruk op stedenstichting, snel wisselend terrein
- **Romeinse limes** — grens die je actief verdedigt en langzaam opschuift, militair als hoofdas
- **Bantu-expansie** — lange termijn, economie/wetenschap als hoofdas, weinig conflict
- **Vikingexpansie** — eilandspringen i.p.v. doorlopend continent (ruimtelijke variant)
- **Spaanse conquista** — snelle maar instabiele verovering, cultuurschok/verval van bestaande rijken
- **Nederlandse VOC-expansie** — handelsposten als eerste stap, sterke economische as, eilandstructuur
- **Siberische/Tataarse expansie (Rusland)** — kou versnelt uitputting van voedselland, dunbevolkt = tragere pushback, bonthandel als economische motor

---

## 9. Amerikaanse frontier-campagne — uitgewerkte ankers

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
| 2 | Categorie-keuze (2-3 opties) |
| 3-4 | Drie bouwmaterialen (hout/steen/erts) |
| 5 | Uitputting (laagdrempelig voorbeeld) |
| 6-7 | Cultuur → laag ontgrendelen |
| 8 | Vooruitkijk-bereik |
| 9 | Zeldzaamheid (verborgen tot bouwen) |
| 10 | Groei-gok (zonder echte permadeath-dreiging) |
| 11 | Waarschuwingssignaal bij verval (gescript, ongevaarlijk) |
| 12 | Militair/verdediging (licht, laagdrempelig) |

Na laag 12: afsluitende scène, opent het campagnemenu (alleen Amerikaanse frontier beschikbaar; overige campagnes ontgrendelen daarna). Tutorial-save blijft apart bestaan/speelbaar.

**Namen:**
- Hoofdstuktitel: **"De Eerste Vuren"**
- Stam van de speler: **Het Hertenpad-volk**
- Mogelijke NPC-stam (indien nodig): Het Steenhoorn-volk / De Rivierwakers

---

## 11. Belangrijkste ontwerpoverwegingen

Een aantal kernbeslissingen is bewust gemaakt na afweging van alternatieven. Hieronder de belangrijkste, met de reden achter de keuze.

**Boom-structuur i.p.v. letterlijke stapel-toren**
Een letterlijke verticale stapel van alle improvements door elkaar zou visueel rommelig worden zodra city- en land-improvements samen op één kolom staan. De boom/frontier-band-structuur (stad als stam, land improvements als uitlopers, nieuwe steden als nieuwe stammen) houdt de drie improvement-soorten visueel en conceptueel gescheiden, terwijl de "naar boven groeien"-fantasie behouden blijft.

**Categorie kiezen, dán pas 2-3 concrete opties zien**
Eén keuzemoment (direct een specifieke improvement kiezen) zou minder diepte geven dan twee gelaagde momenten: eerst een richting (categorie) bepalen, dan een concrete keuze binnen die richting maken. Dit geeft zowel sturing (je kunt een strategie volgen) als variatie (je weet nooit precies welke opties je zult zien) — vergelijkbaar met de kaartbeloningen in Slay the Spire, maar met een extra beslislaag.

**Geen resource-inkomsten en geen veiligheidsnet van achtergelaten steden**
Dit is een bewuste keuze om het "frontier"-gevoel scherp te houden: als oude steden gewoon door bleven produceren, zou er een veilige, passieve thuisbasis ontstaan en verdwijnt de noodzaak om steeds verder te trekken. Door specialisatie-relics wél permanent te maken (als beloning), maar lopende inkomsten niet, blijft vooruitgang komen uit wat je hebt veroverd, niet uit wat je passief bezit.

**Hard verval (permadeath van relics) i.p.v. zachte aftakeling**
Zachte aftakeling (een stad die langzaam minder oplevert tot je vertrekt) is altijd veilig zolang je op tijd weggaat — er is dan geen echt risico. Hard verval, waarbij ook al verdiende relics verloren kunnen gaan bij een misrekening, geeft een echt risk/reward-moment: doorgroeien voor een extra relic-slot is een bewuste gok, geen gratis extra beloning. Het zichtbare waarschuwingssignaal zorgt ervoor dat dit risico eerlijk aanvoelt (voorspelbaar te vermijden) in plaats van willekeurig.

**Volledige ineenstorting eindigt in de MVP de hele run**
Zolang er maar één stad is (hoofdstuk 13), heeft een ineenstorting geen "volgende stad" om naar door te schuiven — de stad die instort, is de enige stad. Een stad laten voortbestaan in verzwakte vorm (geen relics, kleine tier) zou het permadeath-risico uit hoofdstuk 4 juist ondermijnen: de speler kan dan gewoon doorspelen alsof er niets gebeurd is. Door de run in dat geval echt te beëindigen en de tutorial opnieuw te starten, blijft de inzet van "doorgroeien voor een extra relic-slot" reëel, ook zonder dat er al een frontier-verplaatsing naar een nieuwe stad bestaat.

**Geen kunstmatige tijdsdruk/klok**
Een oprukkende dreigingstimer (zoals in veel rogue-likes) werd bewust weggelaten omdat de vergelijkbare historische frontier-situaties ook geen "klok" kenden — en omdat schaarste (uitputting van land, uitputting van vooruitzicht op groei) al een intrinsieke, thematisch passende reden geeft om door te bewegen. Een extra klok erbovenop zou dubbelop en kunstmatig aanvoelen.

**Zeldzaamheid van land improvements pas zichtbaar na bouwen**
Vooraf zichtbare zeldzaamheid zou het bouwen puur een optimalisatie-keuze maken ("bouw ik hier de zekere optie of gok ik op een goudmijn"). Door de uitkomst pas na het bouwen te onthullen, wordt élke bouwactie een klein gokmoment, wat beter past bij het rogue-like karakter van het spel dan een volledig planbare economie.

**Eén gedeelde opslag i.p.v. één-resource-kiezen (zoals in Frostpunk)**
Frostpunk dwingt spelers één opslagtype te kiezen per gebouw, wat in de praktijk onrealistisch aanvoelt (waarom zou je geen hout én steen naast elkaar kunnen opslaan?). Een gedeelde opslag met een gezamenlijke cap is intuïtiever en legt de spanning waar die hoort: bij de totale capaciteit, niet bij een kunstmatige keuze tussen fysiek vergelijkbare goederen. Voedsel kreeg wel een aparte voorraad, omdat het conceptueel een ander doel dient (groei-drempels) dan bouwmateriaal.

**Twee gescheiden systemen voor militair conflict en culturele pushback**
Een direct gevecht (unit-sterkte vergelijken) en het weerstaan van een cultureel sterke tribe zijn thematisch verschillende soorten weerstand — de eerste is fysiek, de tweede diplomatiek/economisch. Door ze als aparte systemen te ontwerpen (in plaats van beide via legersterkte af te handelen) blijven de vijf categorieën ook mechanisch onderscheidend: militair lost fysieke dreiging op, cultureel lost expansie-weerstand op.

**Vertakkende verhaalstructuur met een gedeelde slotscène i.p.v. volledig lineair of volledig random**
Volledig vaste verhaalmomenten (altijd dezelfde gebeurtenis op dezelfde laag) zouden na een paar runs voorspelbaar worden; volledig random getrokken gebeurtenissen zouden geen samenhangend verhaal opbouwen. Een keuzeboom met een paar vaste ankerpunten (waarvan de invulling reageert op eerdere keuzes) geeft het gevoel van een reagerend verhaal, terwijl het aantal te schrijven scenario's beheersbaar blijft — mede mogelijk gemaakt door bij het laatste ankerpunt de paden samen te laten komen in één kernscène met tonale varianten, in plaats van vier volledig aparte eindes.

**Echte historische inspiratie i.p.v. fictieve samengestelde facties**
Er is bewust gekozen om echte historische volken en leiders te gebruiken als inspiratiebron, met volledige creatieve vrijheid voor de ontwerper om zelf te bepalen hoeveel historische nauwkeurigheid wordt aangehouden. Dit sluit aan bij de achtergrond en voorkeur van de ontwerper, en geeft de campagnes meer historisch gewicht dan volledig verzonnen namen zouden bieden.

**Neolithische tutorial als neutrale sfeer, campagnes met eigen toon**
Door de tutorial in een fictieve, mythische neolithische setting te plaatsen (in plaats van er meteen een historische campagne van te maken), kan de speler alle kernmechanieken leren zonder dat dit de toon van latere, thematisch zwaardere campagnes (zoals de sombere Amerikaanse frontier) alvast kleurt of verwatert.

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
- Categorie kiezen → 2-3 opties → bouwen (met productiewachtrij)
- Drie bouwmaterialen (hout/steen/erts) + gedeelde opslag-cap, losstaande voedselvoorraad
- Uitputting van land improvements → permanente ghost-town-tiles
- Cultuur → laag ontgrendelen; fog of war
- Eén groei-tier-stap (klein→middel), met het zichtbare waarschuwingssignaal en het permadeath-verval-risico (volledige ineenstorting eindigt de run en herstart de tutorial, zie hoofdstuk 4/11)
- Eenvoudige militaire confrontatie (winkans-formule)
- Placeholder-tegels (simpele, consistente stijl — geen definitieve pre-rendered assets nodig om te testen)
- Alléén de tutorial-content (Het Hertenpad-volk, lagen 1-12) als speelbare inhoud

**Nog niet in de MVP** (bewust uitgesteld tot de kernloop staat):
- Meerdere steden/frontier-verplaatsing
- Vooruitkijk-mechaniek verder dan 1 laag
- Culturele pushback-diplomatie
- Zeldzaamheid (rijk/legendarisch) en het oogst-tijdvenster
- Volledige Amerikaanse campagne-content (ankers, vertakkingen)
- Meerdere campagnes/saves tegelijk

### Data-schema's (indicatief, als TypeScript-interfaces)

```typescript
type ResourceType = "hout" | "steen" | "erts" | "goud" | "voedsel" | "cultuur" | "wetenschap";

interface Improvement {
  id: string;
  naam: string;
  categorie: "economisch" | "wetenschappelijk" | "militair" | "civiel" | "cultureel";
  soort: "city" | "land" | "unit";
  kosten: Partial<Record<ResourceType, number>>;
  bouwtijdBeurten: number;
  effect: EffectDefinition; // resource-productie, unlock, bonus, etc.
  zeldzaamheid?: "gewoon" | "rijk" | "legendarisch"; // alleen relevant voor land-improvements, post-MVP
  uitputtingBeurten?: number; // alleen land-improvements
}

interface Tile {
  positieInLaag: number; // 0-8, 4 = centrum/stad
  improvement?: Improvement;
  status: "leeg" | "in_aanbouw" | "actief" | "ghost_town";
  beurtenTotUitputting?: number;
}

interface Layer {
  hoogte: number;
  ontgrendeld: boolean;
  tiles: Tile[]; // lengte 9
  terreinType: string;
  dreigingsniveau?: number;
}

interface City {
  naam: string;
  grootte: "klein" | "middel" | "groot";
  relics: Relic[];
  vervalStatus: "gezond" | "kritiek";
  vervalBeurtenResterend?: number;
}

interface CampaignConfig {
  id: string;
  naam: string;
  tegelSet: string; // asset-map referentie
  multipliers: Partial<{ uitputtingssnelheid: number; pushbackFrequentie: number; zeldzaamheidLegendarisch: number }>;
  ankers?: StoryAnchor[]; // post-MVP
}
```

### Asset-lijst voor de MVP (placeholder-niveau)

**Stijlrichting voor deze MVP specifiek**: omdat de MVP alléén de tutorial (Het Hertenpad-volk) bevat, volgen de assets hier de **Riven/Myst-referentie** (stil, schilderachtig, warm/aards licht, gevoel van verwondering) in plaats van de donkerdere Diablo II-achtige stijl die voor latere, zwaardere campagnes (zoals de Amerikaanse frontier) is bedoeld. De onderliggende tegel-engine (losse tegels, geen naadloos tafereel) blijft ongewijzigd — alleen het palet/de belichting van deze eerste asset-set wijkt af.

- 1 stad-tegel (per grootte-tier: klein/middel = 2 varianten)
- Per bouwmateriaal 1 land-tegel: houtkap, steengroeve, mijn (3 tegels)
- 1 ghost-town-tegel
- 1 fog-of-war-tegel/overlay
- 1 "kritiek"-status-indicator (overlay/icoon)
- Simpele iconen voor de 5 categorieën (voor de keuze-UI)

### Bouw-milestones

| # | Milestone | Omvat |
|---|---|---|
| M0 | Project-setup | Next.js + TypeScript scaffolding, canvas-rendering basis, repo-structuur |
| M1 | Grid & laag-rendering | 9-tile band, meerdere lagen, fog of war, placeholder-tegels tonen |
| M2 | Categorie-keuze-UI | Categorie kiezen → 2-3 opties tonen → bouwen starten |
| M3 | Resource-economie | 3 materialen + opslag-cap, voedsel, productiewachtrij |
| M4 | Uitputting & ghost towns | Land improvements putten uit, worden ghost-town-tiles |
| M5 | Cultuur & laag-ontgrendeling | Cultuur verzamelen, nieuwe laag ontgrendelen |
| M6 | Groei & verval | Klein→middel groei-tier, waarschuwingssignaal, permadeath-verval (ineenstorting eindigt de run) |
| M7 | Militair (basis) | Eenvoudige confrontatie met winkans-formule |
| M8 | Tutorial-content | Lagen 1-12 met de vastgelegde mechaniek-volgorde en flavor-teksten |
| M9 | Save/load | Eén actieve run lokaal opslaan en hervatten |

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
| Mijn (erts) | 8-12 | 5-8 | 20-25 (+ oogstvenster) |
| Boerderij (voedsel) | 15-20 | 10-14 | 30-35 |
| Houtkap (hout) | 12-16 (nooit volledig 0, wel afnemend) | 8-11 | 25-30 |
| Steengroeve (steen) | 10-14 | 7-10 | 22-27 |

*Cultuurkosten*: basis 50 punten voor laag 2, ×1,15 per volgende laag. Culturele pushback-lagen: ×2 van het normale bedrag.

*Opslag-cap*: start op 30 (gedeeld voor hout/steen/erts/goud), elke opslagplaats-improvement +20, praktisch maximum ~3-4 opslagplaatsen per stad (~110 totaal).

*Groei-tier kosten (voedsel)*: klein→middel = 100 voedsel + 5 beurten rijptijd; middel→groot = 250 voedsel + 8 beurten rijptijd.

*Winkans-formule militaire confrontaties*:
> Winkans = eigen legerwaarde / (eigen legerwaarde + vijand legerwaarde), geclampt tussen 10% en 90%.

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
