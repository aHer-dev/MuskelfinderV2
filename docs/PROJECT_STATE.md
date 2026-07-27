# Project State — Single Source of Truth

> Erst hier lesen. Diese Datei ist der kompakte, aktuelle Stand fuer Agenten.
> Details stehen in ROADMAP.md, docs/produkt-plan.md (aktuelle Arbeit, mit Statustafel),
> docs/migration-plan.md (abgeschlossen), docs/architecture.md und den ADRs.

## Stand
- Datum: 2026-07-27
- Branch: `main` · **Remote: github.com/aHer-dev/MuskelfinderV2** · Live: `aher-dev.github.io/MuskelfinderV2/`
- Status: **Migration abgeschlossen (Etappen 0–6, `v1.0`). ETAPPE 7 KOMPLETT (7a–7f). ETAPPE 8
  KOMPLETT (8a–8f). ETAPPE 9 KOMPLETT (9a–9d). ETAPPE 10 KOMPLETT (10a–10f). ETAPPE 11 (Zeitdruck) — code-seitig. Offen ist
  nur noch, was den FACHMANN braucht: `docs/todo.md`.** Die Abrufhaerte waechst mit der Beherrschung,
  keine Zahl in der Statistik steht ohne Knopf, man kann gezielt an den Luecken ueben, eigene Notizen
  stehen beim Muskel, der lateinische Name erklaert sich selbst, geprueft wird in Zusammenhaengen, die
  Pruefung wirft ihre Luecken direkt in die naechste Sitzung, Abzeichen messen Koennen statt
  Anwesenheit, die Detailseite kann sagen, wo man den Muskel am Koerper findet — **und die App legt
  niemandem mehr ungefragt Karten in den Kasten.**
  **ALLE VIER BRUECKEN STEHEN:** B1 (7d), B2 (7e), B3 (**9c**), B4 (8c).
  Statustafel: `docs/produkt-plan.md`. Offene Punkte: `docs/todo.md`.
- Gate gruen: **`npm run verify`** — **692 Tests**.
- A11y: axe 0 Verstoesse ueber **14 Routen x Light+Dark x Ruhe/HOVER/Fokus — und seit 2026-07-26
  ZUSAETZLICH auf 320 + 390 px** (Playwright+Chromium+axe-core).
  ⚠️ **Bis zum 2026-07-26 stand hier „Desktop+Handy", und das war FALSCH:** Weder
  `check:oberflaeche` noch `check:wege` haben je `setViewportSize` gerufen — beide liefen
  ausschliesslich auf der Harness-Vorgabe 1440x900. Die Handy-Schicht war ungeprueft, und genau
  darin sassen zwei Layout-Fehler (siehe unten). **Wer eine Abdeckung in diese Datei schreibt,
  greppt vorher nach dem Aufruf, der sie herstellt.**
  inkl. `/pruefung` in allen drei Zustaenden, der Abzeichen auf `/statistik`, der Palpations-Sektion
  (mit + ohne Eintrag), `/anleitung` und dem leeren `/heute`. 0 externe Requests.
  **Der Pruef-Lauf legt jetzt erst Karten an, bevor er `/karteikasten` misst.** Ein frischer Browser
  hat einen leeren Kasten — dann rendert die Deck-Tabelle gar nicht, und der Lauf hat sie jahrelang
  nur uebersehen statt bestanden. Genau so blieb ihr fehlender Tab-Stop (WCAG 2.1.1) unentdeckt.
- **8b ist erledigt:** Der Quiz-Pool-Filter ist gebaut (`src/data/quiz-pool.ts`). Die Antwort auf
  zu kleine Pools lautet: **die Distraktoren kommen von ausserhalb des Filters** — darum genuegt EINE
  passende Karte fuer eine vollstaendige 4-Optionen-Frage.

## ⚠️ ETAPPE 10: KEIN AUTOMATISCHES STARTDECK MEHR (ADR 0009, 2026-07-13)
**Wer `seedDeck` wieder einbaut, dreht die wichtigste Produktkorrektur des Projekts zurueck.**

Der Projektinhaber (Lehrkraft) hat die App aus Schuelersicht geoeffnet. Am Build nachgemessen:
Zwei Klicks — und man stand in einer **laufenden Sitzung** mit 20 Karten, die man nie gewaehlt hatte.
Die 20 waren nicht zufaellig, sondern **alphabetisch**: Sortierung nach Regionsquote, dann
`difficulty`, dann Name — und allein in der unteren Extremitaet teilen sich **22 Muskeln den
Schwierigkeitsgrad 1**. Die erste Karte, die ein Physio-Schueler je sah, war
**`M. abductor digiti minimi`** (ein kleiner Fussmuskel). Die App erklaerte nirgends, woher die
Karten kamen.

- **Kein Codepfad legt mehr Karten ohne Nutzerhandlung an.** Zwei Tests wachen darueber
  (`OnboardingPage.test.tsx`): einer am Verhalten, einer am Quelltext.
- `src/data/seeding.ts` ist **geloescht**. `Profession`/`PROFESSIONS`/`PROFESSION_LABELS` liegen jetzt
  in **`src/data/profession.ts`** — **nicht loeschen**: Der Beruf wird im Backup persistiert
  (`sanitize.ts` validiert `physio|ergo|logo`), das faellt unter ADR 0002. Und er schluesselt das
  Curriculum.
- **ADR 0009 aendert die Rahmen-Invariante 2 aus ADR 0007 fuer genau EINEN Zustand:** Der leere
  Kasten hat **keinen** einzigen Primaerbutton mehr — dort *ist* das Waehlen die Aufgabe. Alle
  anderen Zustaende (`review`, `backlog`, `new`) behalten ihren einen Primaerbutton.
- Der Erststart fuehrt jetzt auf **`/anleitung`-Kurzfassung + drei Wege** (Kursabschnitt · Bereich ·
  einzeln). Die Zahl am Knopf ist die Zahl der Karten (nach `nameLatin` entdoppelt).

**Curriculum (10d) ist die zweite leere redaktionelle Datei nach der Palpation.**
`src/data/editorial/curriculum.json` ist **leer, und ein Test wacht darueber**. Kursabschnitte kommen
vom Projektinhaber (`docs/curriculum-erfassen.md`) — **ein Agent erfindet hier nie einen Abschnitt.**
Ein Kursabschnitt ist eine Behauptung darueber, was geprueft wird; eine geratene fuehrt zum falschen
Stoff fuer die falsche Pruefung. Geschluesselt nach Beruf (Kurs 1 der Logopaedie ≠ Kurs 1 der Physio).

**Dark-Mode-Falle (10f), gilt fuer JEDES neue `<select>`:** Chromium malt die Optionsliste mit
**exakt der `background-color` des Selects**. Ein durchscheinender Wert (`--surface-sunken` =
`rgba(255,255,255,0.05)`) landet ungemischt im Popup und verschwimmt mit dem Hintergrund. Es gibt
dafuer das Token **`--field-bg`** — in beiden Themes **deckend**. Nie wieder eine rgba-Flaeche auf ein
Formularfeld legen.

## ⚠️ UX-REVIEW 2026-07-26 — was daraus HART gilt
Ein Durchgang am laufenden Build (Kaltstart, 320 + 390 px, nur Tastatur, Abbruch-Wege). Acht Fehler,
alle als Prüfzeile gegengetestet. Vier Regeln, die daraus für JEDEN Folge-Task gelten:

1. **Ein Text auf dem Schirm ist ein VERSPRECHEN, und Prosa wird nicht mitgetestet.**
   `/statistik` sagte „Der Karteikasten bleibt, der Lernstand ist weg" — `resetProgress()` setzte
   `cards: {}` und loeschte ihn (gemessen 24 → 0), unumkehrbar, direkt nachdem derselbe Satz das
   angekuendigt hatte. **`resetCardProgress` in `src/persistence/leitner.ts` ist die EINZIGE
   Ruecksetz-Regel**: Fach, Faelligkeit, Zaehler, `lastSeen` auf Anfang — **Karte bleibt**,
   `difficult` bleibt (das ist die Markierung der Nutzerin, kein Messwert). Der echte
   Vollausraeumer heisst **`clearProgress()`** und ist nur fuer Tests/Import da. **Wer
   `resetProgress` wieder auf `createEmptyFlashcardsSection()` dreht, baut den Fehler neu ein.**
2. **Eine Entscheidung von damals kann durch eine Aenderung von heute falsch werden.**
   `ExamPage` warf die Pruefung im Unmount weg — begruendet und kommentiert. Diese Begruendung ist
   **aelter als Etappe 7d**, seit der das Suchfeld in der Kopfzeile JEDER Route sitzt. Gemessen:
   „biceps" ins Suchfeld, Enter, zurueck → 20 Antworten weg, ohne Warnung. **Wer etwas auf JEDE
   Route legt, geht die laufenden Abläufe durch, die es jetzt unterbricht.** Die Pruefung ueberlebt
   die Navigation, den Browser-Neustart bewusst nicht (wie die Lernsitzung), und wird ausdruecklich
   verworfen.
3. **Eine Handlung, die 121 Karten anlegt, braucht eine Zahl, eine Rueckfrage und einen Rueckweg.**
   ADR 0009 verhindert, dass die APP ungefragt Karten anlegt — es verhinderte nicht, dass der
   Schueler es sich selbst tut. `removeCards` ist der Rueckweg; **ein Massen-Knopf ohne Gegenstueck
   ist eine Einbahnstrasse.**
4. **`1fr` ist `minmax(auto, 1fr)`.** Eine Grid-Spalte faellt damit NIE unter die min-content-Breite
   ihres Inhalts, und ein einziges `minmax(280px, 1fr)` darin schiebt die ganze Seite waagerecht auf
   (`/statistik`, 26 px bei 320 px). **Raster, die schrumpfen sollen, bekommen `minmax(0, 1fr)`,
   und Kachel-Raster `minmax(min(Xpx, 100%), 1fr)`.**

**Zwei Funde, die nichts mit dem Code zu tun haben, sondern mit dem MESSEN:**
- **`check:oberflaeche` hat jahrelang die 404-Seite vermessen und sie „detail" genannt.** In der
  Routenliste stand `/muskel/m-biceps-brachii` — die Kennungen haben **kein `m-`** (`biceps-brachii`).
  Die inhaltsreichste Seite der App war damit **nie im Audit**. Die 404-Seite ist barrierefrei, laeuft
  nicht ueber und haelt den Satzspiegel: **sie besteht jede Messung glaenzend.** Darum prueft
  **Station 0** jetzt zuerst, ob eine Route ueberhaupt zeigt, was sie behauptet. **Jede neue Route in
  einer Pruefliste braucht eine Behauptung ueber ihren INHALT, nicht nur ihren Pfad.**
- **Die behauptete Handy-Abdeckung existierte nicht** (siehe „Stand" oben). Neu je Route und Breite:
  Ueberlauf, axe, Daumenmasse, **Scroll-Fallen** (eigene Scrollflaeche > 50 % der Viewport-Hoehe —
  die Auswahlliste im Karteikasten war 460 px auf einem 568-px-Schirm, jeder Wisch darin scrollte
  die Liste statt die Seite). **320 px ist Absicht:** Bei 390 px zeigt sich die Grid-Falle nicht.

**Nachtrag 2026-07-27 — dieselbe Regel 2 hat sofort wieder zugeschlagen.** Die Mehrfachwahl
macht es leicht, 45 Karten in einem Zug anzulegen. `getTodayPlan` kannte nur `dueTotal`, und
frische Karten sind sofort faellig → der Schueler waere eine Sekunde nach seiner EIGENEN Wahl
mit „Wir holen den Stau in Etappen auf" begruesst worden. **Genau der Satz, dessentwegen die
vier Regionen durch elf Gelenkgruppen ersetzt wurden.** `TodayPlan.overdueTotal` trennt jetzt
**faellig** von **versaeumt**; nur Letzteres darf „Stau" heissen. Der Deckel auf die Tagesdosis
bleibt (45 Karten am Stueck lernt niemand), nur die Schuldzuweisung faellt weg.
**Wer eine Zahl in einen bewertenden Satz giesst, prueft, ob sie das Urteil traegt** — dieselbe
Wurzel wie die „schwaechste Region" ohne eine einzige Antwort.

**Zwei Nachtraege vom selben Tag, beide aus dem Erstkontakt-Durchgang:**
- **Keine Diagnose ohne Datengrundlage.** `/heute` nannte eine „schwaechste Region", bevor eine
  einzige Karte beantwortet war (frische Karten = Fach 1 = Beherrschung 0 in JEDER Region).
  `weakestRegion` schweigt jetzt, solange alle Regionen gleich stehen. **Wer einen bewertenden
  Satz aus Daten baut, prueft erst, ob die Daten ihn tragen.**
- **Eine Pruefzeile muss auf der Groesse laufen, auf der der Fehler lebt.** Die
  Bildlauf-Behauptung („nach dem Anlegen steht die Seite oben") war auf 1440x900 bedeutungslos
  gruen — dort ist `scrollY` ohnehin 0. Erst auf 390x664 faellt sie ohne den Fix (`scrollY=499`).
  `check:wege` schaltet fuer diese Station darum ausdruecklich auf Handy-Mass.

**Und eine Nebenwirkung, die kein DOM-Test fangen kann:** Uhr und Klick konnten dieselbe Quizfrage
doppelt werten — der Intervall-Callback laeuft AUSSERHALB des React-Ereignisflusses, ein Klick im
selben Frame sieht in `answer()` noch das alte `phase` aus seinem Closure. Ein Ref-Riegel wertet
jeden Index genau einmal. **Der Test dafuer ist ein HOOK-Test** (zwei Aufrufe in einem `act`-Block):
Im DOM ist die Option danach `disabled`, dort waere er auch ohne den Fix gruen — **eine Pruefung, die
ohne den Fehler gruen ist, prueft nichts.**

## ⚠️ DER KASTEN WIRD NACH GELENK GEFUELLT (2026-07-26) — `src/data/joint-groups.ts`
**Wer die vier Regionen zum Fuellen zurueckholt, baut den „Stau"-Fehler neu ein.**

Elf Gelenkgruppen mit **8–26 Karten**: Mimik & Kopf · Zungenbein & Kehlkopf · Wirbelsaeule ·
Bauchwand & Beckenboden · Schulterguertel · Schultergelenk · Ellenbogen · Hand · Hueftgelenk ·
Kniegelenk · Sprunggelenk & Fuss.

- **Warum:** „Obere Extremitaet" legte **53 Karten** an — mehr als das Anderthalbfache der
  Tagesdosis, also stufte `getTodayPlan` den FRISCHEN Kasten sofort als `backlog` ein. Gemessen
  begruesste die App einen Schueler in Minute eins mit „Wir holen den Stau in Etappen auf" und
  „Der Rest bleibt liegen und wartet". Mit „Ellenbogen" (17) steht dort „Heute dran".
  **Ein Test haelt jede Gruppe unter 30 Karten** — das ist die Schwelle, nicht Geschmack.
- **Abgeleitet, nicht erfunden:** Die Gruppen buendeln `joints` und `subregion` aus den
  migrierten Daten. Das ist das E2-Verfahren („vorannotiert, vom Projektinhaber geprueft") und
  ausdruecklich NICHT der Fall von `curriculum.json`/Palpation. Darum liegt die Datei auch nicht
  in `editorial/`. **Ein Test prueft, dass jedes genannte Etikett im Bestand vorkommt** — ein
  Tippfehler erzeugt sonst eine stillschweigend kleinere Gruppe.
- **ZWEI Schluessel, und beide sind noetig:** `M. palmaris brevis` und `M. quadratus plantae`
  haben ein LEERES `joints`-Feld (nur ueber die Subregion zu finden).
- **Zwei Etiketten sind Fallen, beide mit eigener Pruefzeile:**
  `Kopf` klingt nach Kopfmuskulatur, traegt aber `M. semispinalis`, `Mm. longissimi`,
  `Mm. splenii` — **Nackenstrecker**. Es gehoert zur Wirbelsaeule, nicht ins Gesicht.
  `Becken` traegt `M. psoas minor` UND die vier Beckenbodenmuskeln — darum kommt
  „Bauchwand & Beckenboden" ueber die Subregion.
- **26 Muskeln liegen in MEHREREN Gruppen** (`M. biceps brachii`: Ellenbogen + Schultergelenk).
  Many-to-many, keine Partition — dieselbe Regel wie bei den funktionellen Gruppen (9a).
  **Folge:** Die Mitgliederzahl ist NICHT die Zahl der neuen Karten. Wer eine Zahl an einen
  Knopf schreibt, nimmt **`neueKarten()`**. Gemessen: „Schultergelenk" verspricht nach
  „Ellenbogen" 9 statt 11 — und legt 9 an.
- **MEHRFACHWAHL seit dem 2026-07-27 — ein Klick war eine Einbahnstrasse.** Jeder Klick legte
  sofort an; damit war der Kasten nach der ERSTEN Gruppe nicht mehr leer, `/heute` ersetzte den
  ganzen `DeckStarter` durch den Tagesplan, und die zweite Gruppe war dort **gar nicht mehr
  waehlbar**. „Hand + Ellenbogen" ist aber der Regelfall im Kurs (Projektinhaber, 2026-07-27).
  Jetzt: ankreuzen, EINMAL anlegen.
  - **Die Zahl am Knopf ist die VEREINIGUNG, nicht die Summe** (`neueKartenDerAuswahl`).
    „Hueftgelenk 23 + Kniegelenk 15" legt **31** an, nicht 38. Die Differenz wird **benannt**.
  - **Rueckfrage ab `MAX_DAILY_DOSE` (40)** — die eigene Obergrenze der App, nicht Geschmack.
    Eine einzelne Gruppe (< 30) und zwei benachbarte (Hand + Ellenbogen = 35) fragen nie.
  - **Rahmen-Invariante 2 haelt:** Ohne Auswahl **kein** Primaerbutton (ADR 0009), mit Auswahl
    genau einer. Zwei Pruefzeilen, beide Richtungen.
  - **Die Aktionsleiste sieht kein Ruhelauf** — sie existiert nur mit Auswahl und klebt unten.
    `check:oberflaeche` **Station 6** rendert diesen Zustand ausdruecklich (axe Hell+Dunkel auf
    320 px, Ueberlauf, Lage gegen die TabBar, Daumenmass). Gegengetestet: `bottom: 0` auf dem
    Handy → „Aktionsleiste liegt unter der TabBar".
- **Die Wahl steht an ZWEI Stellen, und das ist keine Doppelung:** Der `DeckStarter` rendert nur
  bei leerem Kasten. Stand die Gruppenwahl nur dort, war sie nach der ersten Gruppe weg — wer im
  naechsten Kursabschnitt nachlegen wollte, musste 148 Kaestchen durchgehen. Der
  `JointGroupPicker` liegt darum auch dauerhaft auf `/karteikasten`.
- **Der Beruf sortiert vor, versteckt aber nichts** (Entscheidung des Projektinhabers): Ein Ergo,
  der die Huefte lernen will, soll sie nicht suchen muessen. Ein Test prueft, dass jeder Beruf
  alle elf Gruppen erreicht.
  **Und das Onboarding sagt es jetzt auch so** (2026-07-27): Hinter „Ergotherapie" stand „Hand,
  Arm, Feinmotorik" — vom Projektinhaber beanstandet, weil es sich als **Stoffgrenze** liest und
  fachlich falsch ist (ein Ergo braucht die obere Extremitaet vollstaendig). Die Texte nennen
  jetzt die REIHENFOLGE („Hand, Ellenbogen und Schulter zuerst"), und der Satz „Sie sortiert nur
  — jede Gelenkgruppe bleibt fuer jeden waehlbar" steht auf dem Schirm; eine Pruefzeile haelt
  Satz UND Verhalten fest. Logopaedie blieb unveraendert (ausdruecklich bestaetigt).
  **Welche Gruppen ein Ergo oben sieht, ist weiter offen** — Fachfrage, steht in `docs/todo.md`.
- Die vier Regionen bleiben in **Suche und Filter**. Nur zum FUELLEN sind sie zu grob.

- **Die Gruppen leiten aus `CARD_MUSCLES` ab, NICHT aus `getMuscles()`.** Der erste Wurf lief
  ueber alle 150 Muskeln, und „Hand" enthielt damit die drei Doppelnamen, deren Kartenschluessel
  auf den FUSS aufloest — ein Ergo bekam Kleinzehen-Fakten in seinem Handkasten. Das ist die
  harte Regel aus `isCardMuscle`, und sie gilt fuer JEDE neue Ableitung: **Wer von Karten auf
  Muskeln schliesst, geht durch `CARD_MUSCLES`.** Zwei Pruefzeilen vergleichen die Gruppe nicht
  mit dem Muskel, der ihre Bedingung erfuellt, sondern mit dem, den die KARTE rendert.

**Nachtrag 2026-07-26 — inzwischen geheilt (ADR 0012):** Hier stand, die drei doppelten
`nameLatin` (Hand/Fuss) blieben, „Hand" enthalte weiter einen Namen, der auf den FUSS aufloest.
Das gilt nicht mehr. Der Kartenschluessel ist seit ADR 0012 nicht mehr der Anzeigename: Die Hand
traegt `…#manus`, der Fuss den historischen Schluessel. „Hand" hat damit **26** Mitglieder statt
23, und alle 26 rendern Hand-Fakten. `CARD_MUSCLES` = **148** statt 145.

## Verlauf (Migration, abgeschlossen)
- Etappe 0–4 abgeschlossen. **Etappe 5 (Haertung)** — Teil 1+2 umgesetzt:
  (1) Quellen-/Lizenz-Seite (`/quellen`) + Datenschutz-Seite (`/datenschutz`) aus V1 uebernommen
  (geteiltes `LegalPage`-Geruest, CC-BY-4.0-Attribution vollstaendig), globaler `SiteFooter`
  (Attribution + Legal-Links) auf jeder Route; Route-Code-Splitting via `React.lazy`/`Suspense`
  (`RouteFallback`); Bild-Lazy-Load (`loading="lazy"` + `decoding="async"`).
  (2) A11y-Audit (axe-core, WCAG 2 A/AA + best-practice) ueber alle 7 Routen in Light+Dark: 0
  Verstoesse. Light-Farbkontraste auf ≥4.5:1 gebracht (Text-Tokens + `--accent-on-surface` #bd4800).
  Deep-Link-Reload live verifiziert.
  (3) Offline/PWA via `vite-plugin-pwa`: Service-Worker (Workbox, autoUpdate), Precache der
  App-Shell/Daten, CacheFirst fuer Muskelbilder, Manifest + Marken-Icons (192/512/maskable).
  Offline im Browser verifiziert (Suche + Detail laden ohne Netz).
- **Etappe 6 (V1-Paritaet) laeuft:** Gap-Analyse V1↔V2 (`docs/v1-v2-gap-analysis.md`) zeigte
  reduzierte Lern-Features. Entscheidung: V1-Funktionen zurueck, V2-Extras (z. B. Innervations-Quiz)
  behalten. Umgesetzt:
  - Teil 1: **Karteikasten-Verwaltung** (`/karteikasten`, `DeckManagerPage`) — In-Deck-Tabelle +
    Bulk-Add (Suche/Region-Tabs/Checkboxen), aus Lernkarten verlinkt. Behebt die leere Lernkartei.
  - Teil 2: **Lernkarten-Ablauf** wieder vollstaendig — `useFlashcardSession` mit explizitem
    `start({limit,scope})`; Setup-/Card-/Summary-Screen inkl. Kartenlimit, Bereich, Schwierig-Flag,
    Bild-Zuschalten, Tastatur/Swipe.
  - Teil 3: **Quiz „Ursprung & Ansatz"** (Modi `origin-insertion`/`insertion-origin`) +
    **Bereichsfilter** (Pool-Einschraenkung). `quizSeriesKey(mode, regions)` ohne Filter =
    exakt V1-Key (ADR 0002); Innervations-Modus (V2-Extra) bleibt.
  - Teil 4: **Statistik** um „Quiz-Bilanz je Modus" (mit Beste-Quote) + „Ziele/Meilensteine"
    erweitert (`quizByMode`/`nextMasteryMilestone`).
  - Teil 5: **Nav-Eintrag „Karteikasten"** (Desktop-Rail), **XP-/Level-Up-Toasts**
    (`useToastStore`/`ToastHost`) und **Tagesbonus verdrahtet** (`useDailyBonus`).
  - Teil 6: **3D-Anatomie-Verknüpfung** regelkonform (lokales Mapping `three-d-support.json`,
    `data/threeD.ts`; Detail-Button + Footer-Link + Datenschutz-Abschnitt) und **Quiz-Submodi**
    komplett (`name-image` Bild-Optionen + `*-mixed` „Gemischt"; QuizPage in V1-Typ-Karten-Struktur).
  **Volle V1-Paritaet erreicht** — alle Seiten/Funktionen uebernommen; nur das *Einbetten* fremder
  3D-Modelle bleibt aussen vor (war nie Teil von V1; nur Verlinkung).
- Gate zuletzt gruen: `npm run lint && npm run test && npm run build` (Per-Route-Chunks + SW/Manifest).
- Aktueller Teststand: 167 Tests gruen. A11y: axe 0 Verstoesse ueber alle Routen inkl.
  `/karteikasten` (Playwright+Chromium+axe-core lokal, Light+Dark).
- **Release:** nach `main` gemergt (`--no-ff`) und als **`v1.0`** getaggt (lokal; noch kein Remote
  konfiguriert → nichts gepusht). Etappe 5+6 inhaltlich abgeschlossen, volle V1-Paritaet.
- Offen: Bei oeffentlichem Deploy Remote/`git remote add origin …` + Push durch dich; optional
  Impressum + eigene Domain/CNAME.

## ETAPPE 11: ZEITDRUCK IM QUIZ — und DREI ABSAGEN (ADR 0010, 2026-07-13)
Die letzten vier offenen Fragen aus dem Brainstorming sind entschieden.

- ✅ **Zeitdruck: ja.** Sekunden pro Frage `0 | 30 | 15`, **`0` (aus) ist die Vorgabe** — das ist die
  Bedingung, unter der ein Zeitlimit ueberhaupt zulaessig ist (**WCAG 2.2.1**: abschaltbar).
  **Wer irgendwo sonst ein Zeitlimit einbaut, haelt sich an dieselbe Regel.**
  Zeit abgelaufen = falsch, aber `selectedId` bleibt `null`: Die Karte behauptet NICHT, es sei etwas
  Falsches angeklickt worden. Die Uhr laeuft gegen einen **Zeitstempel**, nicht gegen einen Zaehler
  (ein Intervall wird im Hintergrund-Tab gedrosselt).
  **ADR 0002:** Eine Runde unter der Uhr bekommt einen EIGENEN Serien-Schluessel (`"timed":15`) —
  dieselbe Regel wie beim Karten-Filter (8b). Ohne Uhr bleibt der Schluessel **bitgleich**.
  **Das ist jetzt Muster: Jeder Quiz-Parameter, der die SCHWIERIGKEIT aendert, braucht einen eigenen
  Serien-Schluessel.**
- ❌ **Audio / lateinische Aussprache: NEIN.** Vom Projektinhaber gestrichen, obwohl er Logopaedie
  unterrichtet. **Nicht wieder vorschlagen.**
- ❌ **Sozialer Vergleich / teilbarer Ergebnis-Link / Lernstand als Bild: NEIN.** Der Backup-Export
  bleibt der einzige Weg, Daten aus der App zu bekommen — fuer den Geraetewechsel, nicht fuer den
  Vergleich.
- ⏸ **Leitner vs. SM-2/FSRS: WEITERHIN OFFEN.** Wir sind bei Leitner, weil ADR 0002 das
  Backup-Format einfriert — das war nie eine Entscheidung, es ist passiert. Anki ist hier
  nachweislich besser. Ein Wechsel braeche das Persistenzformat: eigener, grosser Task.

## ⚠️ EINE VERGESSENE KARTE FAELLT AUF HOECHSTENS FACH 2 (ADR 0011, 2026-07-13)
**Wer die Rueckstufung wieder auf „ein Fach zurueck" dreht, baut den Fehler neu ein.**

Bis 2026-07-13 fiel eine falsch beantwortete Karte genau EIN Fach. Mit den Intervallen
`1 · 3 · 7 · 14 · 30 · 90 · 180` hiess das gemessen: Wer einen Muskel sechsmal richtig hatte
(Fach 7) und ihn dann vergass, sah ihn **erst in 90 TAGEN wieder**. Aus dem „gemeisterten" Fach 5
waren es 14 Tage. Er hatte gerade bewiesen, dass er ihn NICHT weiss.

- **`lapseFach(fach)` in `src/persistence/leitner.ts` ist die EINZIGE Rueckstufungs-Regel.**
  Hoechstens `LAPSE_FACH` (= 2), und immer mindestens ein Fach runter. **`applyWrong` UND
  `applyExamMiss` rufen sie beide auf** — zwei getrennte Regeln waren genau der Weg, auf dem der
  Fehler entstanden ist.
- **Der Fehler steckte auch im Pruefungsmodus:** Eine verpasste Karte aus Fach 7 landete auf Fach 6,
  und EIN Treffer im Debrief hob sie zurueck auf 7 — 180 Tage weg, einen Tag nach der Pruefung.
- **ADR 0002 ist NICHT beruehrt:** `fach` bleibt 1–7, `nextDue` ein ISO-Datum, kein Feld aendert
  sich. Nur die Uebergangsregel. Ein Test prueft die Formattreue.
- **Warum kein Test das gefangen hat:** Der einzige Rueckfall-Test startete in Fach 3 — und der
  landet unter BEIDER Regeln bei 2. Die reifen Faecher waren nicht abgedeckt. Jetzt sind sie es.

**Zu FSRS/Anki (Frage 5, weiterhin offen):** Ein Wechsel scheitert nicht am Backup-Format (das liesse
sich additiv erweitern), sondern an **ADR 0008** — die Abrufhaerte wird AUS DEM LEITNER-FACH
abgeleitet, und die Abzeichen (`fach >= 5`) haengen ebenfalls daran. Umbau, kein Austausch. Bei 150
Muskeln ueber ein bis zwei Semester lohnt er nicht; der teure Teil war der 90-Tage-Fehler, und der
ist weg.

## Design-Tokens: was der Akzent faerben darf — und was nicht (2026-07-13)
`--card-border` ist in **beiden** Themes ein getoentes Orange (**Light 45 %, Dark 26 %** — auf dem
warmen Papier muss es sich gegen viel Licht behaupten, auf Schwarz leuchtet es von selbst). Es faerbt
**nur Inhalts-Kaesten**.

- **Bedienelemente sind NICHT orange** (`--control-border`), und das ist eine Entscheidung, keine
  Auslassung: **Ein Akzent, der ueberall ist, ist kein Akzent mehr.** Sie tragen ein **echtes warmes
  Grau** — `#8a8279` (Light, **3.78:1**) bzw. `rgba(255,255,255,0.42)` (Dark, **4.07:1**).
- **Der eigentliche Fehler war nie die Farbe, sondern die Deckkraft.** Der frueher dort stehende
  Alpha-Schleier `rgba(28,26,23,0.16)` erreichte nur **1.39:1** und verfehlte **WCAG 1.4.11** (3:1
  fuer Bedienelemente — ihr Umriss ist das, woran man sie ALS Bedienelement erkennt).
  **Nicht wieder zu einem Alpha-Schleier verduennen.**
- **Das echte Glas** (Rail, TabBar, Sheet, Toast) bleibt auf `--glass-border`: Es soll zuruecktreten.
- **Rot und Orange als SCHRIFT brauchen eigene Toene.** Auf hellem Grund reichen die Flaechenfarben
  nicht fuer AA: `--accent-on-tint` (#b34400) fuer Akzent-Text auf `--accent-tint`,
  `--danger-on-surface` (#c43e2e) fuer rote Schrift auf Weiss. `--danger`/`--accent` bleiben die
  Flaechenfarben. **Wer Akzent- oder Warnfarbe als Text setzt, nimmt die `-on-`-Variante.**
- **Und genau daran ist der HOVER jahrelang gescheitert** (behoben 2026-07-14): `a:hover` setzte
  `--accent` (#ff6a00) — als Schrift auf Weiss **2.87:1**, WCAG 1.4.3 will 4.5:1. Der Hover
  **dunkelt jetzt ab** (`--accent-on-tint`, 5.6:1) statt aufzuhellen.
  **Die zweite Haelfte des Fehlers war die Spezifitaet:** `a:hover` ist `(0,1,1)` und schlug damit
  JEDE Link-Klasse `(0,1,0)` — auch `.btn--primary`, dessen weisse Schrift beim Ueberfahren orange
  wurde: **orange auf Orange.** Die Regel steht jetzt als `a:where(:hover)` auf `(0,0,1)`: ein
  Vorgabewert, den Komponenten ueberschreiben duerfen. **Wer globale Element-Regeln mit
  Pseudoklassen schreibt, kapselt sie in `:where()`** — sonst ueberstimmt die Basis die Bausteine.
- **Der axe-Lauf prueft jetzt auch den HOVER-Zustand**, jede Link-Klasse einzeln. Der Fehler fiel
  nur auf, weil der Mauszeiger nach einem Klick zufaellig auf einem Link stehenblieb. Ein
  Ruhezustand-Audit haette ihn nie gefunden. **Nach dem Hover 350 ms warten** — sonst misst axe
  eine Farbe MITTEN in der CSS-Transition (gemessen: 4.49:1 auf einem Knopf, der in Ruhe 6.06:1 hat).
- **Der Primaerknopf-Hover ist derselbe Fehler in Gruen** (behoben 2026-07-14): Der Hover dunkelt ab
  (`--accent` → `--accent-strong`), aber die Schrift darauf ist **near-black** (`--accent-on`) — und
  gegen Schwarz heisst dunkler **weniger** Kontrast. Ruhe 6.06:1 ✓, Hover war **4.32:1 ✗**.
  `--accent-strong` ist jetzt **#ef5800** (5.03:1). **Wer diesen Ton anfasst, rechnet ihn gegen
  `--accent-on` nach, nicht gegen Weiss.**

## ⚠️ DAS PRUEF-GATE: `npm run verify` (2026-07-15)
**Warum Bug um Bug auftauchte, obwohl 592 Tests gruen waren — und was das jetzt verhindert.**

Die Unit-Tests hatten zwei blinde Flecken, und in genau denen sass fast jeder harte Bug:
`quiz.test.ts` lief nur gegen **selbstgebaute Fixtures** (die sind per Konstruktion sauber — kein
Fixture teilt sich je ein Feld), und es gab **keine eingecheckte Oberflaechen-/Ablaufpruefung** (jede
visuelle Kontrolle wurde im Scratchpad neu gebaut und weggeworfen, darum fand jede NEUE Fehler).

**`npm run verify`** buendelt jetzt vier Stufen, billig → teuer, und laeuft bei jedem Push
(`.github/workflows/verify.yml`):
- **`npm test`** — Verhalten. Die Quiz-Invarianten laufen jetzt ZUSAETZLICH gegen `getMuscles()`.
- **`check:daten`** (`scripts/check-data.mjs`) — Integritaet (Bild-Dateien, IDs, Gruppen, Regionen)
  als harter Fehler, PLUS ein **Kollisionsbericht fuer den Fachmann**: wo zwei Muskeln sich Name,
  Funktion, Ursprung, Ansatz, Innervation oder Bild teilen. Das ist die Liste fachlicher Fragen
  (z. B. `rhomboideus major`/`minor` mit woertlich gleichem Funktionstext).
- **`check:oberflaeche`** (`scripts/check-surface.mjs`) — 14 Routen × Hell/Dunkel × Ruhe/**Hover**/
  Fokus × leer/voll. axe, Ueberlauf, Satzspiegel. Faengt die Hover-Klasse, die ein Ruhe-Audit nie sah.
- **`check:wege`** (`scripts/check-journey.mjs`) — frischer Browser, Kaltstart: 0 Karten (ADR 0009),
  Bereich fuellen (versprochen == angelegt == Zeilen), Sitzung, JEDER Quizmodus, Pruefung.

**DIE REGEL (in AGENTS.md verankert):** Jeder gefundene Fehler wird zu einer ZEILE in einer Pruefung,
nicht nur zu einem Fix — und jede neue Pruefung wird gegengetestet (Fix zurueckdrehen → Pruefung muss
fallen). So verifiziert: check:daten faellt bei kaputter Bildref, check:oberflaeche bei blassem Hover,
check:wege bei wiedereingebautem `seedDeck`. **Was die Automatik NICHT kann — fachliche Richtigkeit —
und der Rest: `docs/pruefstrategie.md`.**

## Desktop-Durchlauf 2 — am Build nachgemessen (2026-07-14)
Gefahren gegen den **echten Build** (Playwright+Chromium+axe, 1440×900, Hell+Dunkel, 14 Routen).

- **ADR 0009 haelt — nachgewiesen, nicht geglaubt.** Frischer Browser, zwei Klicks durchs Onboarding:
  **0 Karten im Kasten**, in `localStorage` steht **nur `mf.profile`**. Kein Primaerknopf auf dem
  leeren Kasten. Erst der Klick auf „Obere Extremitaet" legt Karten an — **53 versprochen, 53
  angelegt, 53 Zeilen in der Tabelle**. Die Entdopplung aus `isCardMuscle` traegt.
  **Es landen keine zufaelligen Karten im Kasten.**
- **Erledigt (2026-07-26, ADR 0012):** Hier stand, drei dieser Zeilen truegen das Etikett
  „Untere Extremitaet" (die Hand/Fuss-Doppelnamen) — dokumentiert und **nicht geheilt**. Sie ist
  jetzt geheilt: Hand und Fuss sind zwei Karten mit zwei Schluesseln.
- **Der Hover ist die Fehlerquelle, die kein Ruhezustand-Audit findet.** axe meldete auf allen 14
  Routen in Ruhe **0 Verstoesse** — und trotzdem fiel der „Entfernen"-Knopf im Karteikasten beim
  Ueberfahren auf **4.44:1** durch (WCAG 1.4.3). **Das ist jetzt der dritte Hover-Fehler in Folge.**
  Wer eine `:hover`-Regel schreibt, die eine **Farbe** setzt, prueft sie einzeln nach — der Ruhelauf
  sagt darueber nichts.
- **Falle beim PRUEFEN selbst (mich hat sie erwischt):** Ein Seed in `localStorage` **nach** dem
  Laden bringt nichts — die App laeuft auf `HashRouter`, ein Routenwechsel laedt das Dokument
  **nicht** neu, und `zustand` hydriert nie nach. Der Seed gehoert in ein `addInitScript`, und die
  Sektionsformen muessen exakt `persistence/types.ts` treffen (`lookups.entries`, nicht flach;
  der Quiz-Key heisst `mf.quizSeries`). Ein falsch geformter Store liess `/heute` **weiss** werden
  (`Object.entries(undefined)`) — und weil der Hash-Wechsel nicht neu laedt, sahen **alle
  Folgerouten** danach kaputt aus. **Je Route neu laden, sonst misst man einen Leichnam.**

## ⚠️ KEINE FRAGE HAT ZWEI RICHTIGE ANTWORTEN (2026-07-15) — `gueltigeAntworten`
**Wer die Sperre in `pickDistractors` (`src/data/quiz.ts`) aufweicht, baut den Fehler neu ein.**

Der Fragetext ist in JEDEM Modus **ein einzelnes Muskelfeld** — Name, Ursprung, Ansatz, Funktion,
ein Bild. **Keins davon ist eindeutig.** Am echten Bestand nachgezaehlt:

| geteiltes Feld | Kollisionen | betroffene Muskeln |
|---|---|---|
| `insertion` | 12 | **29** |
| `origin` | 10 | **23** |
| `functionDescription` | 5 | 10 |
| `nameLatin` | 5 | 10 |
| erstes Bild | 2 | 6 (**das Quadriceps-Bild gehoert VIER Muskeln**) |

Wer den Fragetext teilt, **antwortet auf ihn auch richtig** — und wurde trotzdem rot markiert.
Gemessen ueber 16 800 Fragen, vorher: `name-image` **6,6 %** (zwei Optionen zeigten **dieselbe
Bilddatei**, eine gruen, eine rot), `insertion-origin` **6,3 %**, `image` 3,8 %, `origin-insertion`
3,5 %, `function-to-muscle` 1,1 %. Nachher: **0,0 % in allen sieben Modi.**

- **Jeder Modus sagt selbst, welche Antworten richtig waeren** (`gueltigeAntworten` in `specFor`).
  `pickDistractors` sperrt sie **alle**, nicht nur die eine gemeinte.
- **Die Sperre geht nach ANTWORT, nicht nach MUSKEL** — und genau daran ist ein erster Versuch
  gescheitert: **M. sartorius** hat einen anderen Ursprung als **M. gracilis** und rutscht durch
  jeden muskelbasierten Filter — aber **beide setzen am Pes anserinus an**. Sein Ansatz ist damit
  auf die Gracilis-Frage richtig. **Wer nur Muskeln aussiebt, laesst das Label stehen.**
- **`name-image` siebt nach BILDDATEI, nicht nach `id`.** Der alte Filter (`m.id !== muscle.id`)
  liess vier verschiedene IDs mit **derselben Datei** durch. 152 Dateien tragen 168 Referenzen.
- **`M. nasalis`/`M. occipitofrontalis`: dieselbe Doppelung, entgegengesetzte Wirkung.** Bei der
  Gruppen-Regel galten sie als „unbedenklich, weil beide Haelften im Kopf liegen" — fuers Quiz ist
  genau das der **schlimmste** Fall: `nearestFirst` zieht Distraktoren bevorzugt aus derselben
  Subregion, und dort steht der Zwilling. **Eine Regel aus einem Kontext traegt nicht in den
  naechsten.**
- **Es bleiben ueberall vier Optionen**, auch unter engem Bereichsfilter (die Regel aus 8b) — ein
  Test prueft es je Region und Modus.
- **`quizSeriesKey` ist unangetastet** (ADR 0002), kein Feld, kein Backup-Schluessel aendert sich.
- **Ein Fehlverdacht, damit ihn niemand nochmal jagt:** `correctId` zeigte NIE auf den falschen
  Muskel (0 von 21 000), obwohl es ueber das Label aufgeloest wird.

**Es ist eine Entschaerfung, KEINE Heilung.** „Was macht M. abductor digiti minimi?" bleibt fuer den
Schueler mehrdeutig, und „Ursprung → Ansatz" nennt weiterhin keinen Muskelnamen — die Fragen sind nur
wieder *beantwortbar*. Der echte Weg waere, den Muskel im Fragetext zu benennen: **Produktentscheidung,
nicht Bugfix.**

**ADR 0012 aendert daran nichts** — im Gegenteil, es macht die Mehrdeutigkeit sichtbarer: Seit dem
2026-07-26 koennen Hand UND Fuss im selben Kasten liegen, also auch beide gefragt werden. Der
KARTENschluessel trennt sie, der ANZEIGEname nicht. Die Zwillingssperre (`teilt`/`gueltigeAntworten`)
zaehlt darum weiterhin beide Antworten als richtig, und das ist die einzige ehrliche Loesung, solange
der Fragetext den Koerperteil nicht nennt.

## Satzspiegel: `--measure` (2026-07-14)
Der Desktop-Durchlauf hat auf 1440 px **169 Zeichen pro Zeile** gemessen (`.stats__panel-sub`), im
Quiz 146, im Guide 109 — waehrend diese Datei „Fliesstext gehoert auf ~68 Zeichen" als Regel fuehrt.
Ueber ~85 Zeichen findet das Auge den naechsten Zeilenanfang nicht mehr zuverlaessig wieder.

- **`--measure: 52ch`** ist das Token. **Nicht auf 68ch stellen:** `ch` ist die Breite der Ziffer
  „0" und in Manrope deutlich breiter als ein Durchschnittszeichen — 68ch ergaben nachgemessen ~90
  echte Zeichen. Der Wert ist an der gerenderten Zeile geeicht, nicht aus der Theorie geraten.
- **Nachtrag 2026-07-14 (zweiter Durchlauf): `legal.css` war uebersehen worden.** Der erste
  Durchgang erfasste `today`, `guide`, `exam` und `stats` — ausgerechnet die Rechtsseiten
  (`/quellen`, `/datenschutz`) nicht, und dort steht der **laengste Fliesstext der App**. Sie trugen
  ein hartes `max-width: 780px`: gemessen **107–111** Zeichen pro Zeile, jetzt **71–72**.
  **Wer ein Token einfuehrt, geht die Seiten durch, die es NICHT haben — nicht die, die es haben.**
- **Die SPALTE traegt den Satzspiegel, nicht der Absatz.** Der Guide hatte bereits `max-width: 68ch`
  — am Container mit 16 px, waehrend der Text in den Karten 14 px ist. Kappt man stattdessen die
  Absaetze, bleiben die Karten breit und der Text hoert mittendrin auf: eine tote Rinne rechts IN
  jeder Karte. Die Karte soll ihren Text umschliessen.
- Gilt fuer Fliesstext — **nicht** fuer Tabellen, Chips oder Zahlen.

## Die rechte Schiene auf `/heute` (`StandRail`, Etappe 12)
Bei 1440 px lagen dort **444 px rechts brach** (gemessen), waehrend Level, Serie und Fortschritt als
winzige Textzeile am Seitenende klebten.

- **Geometrie ist nicht erfunden:** 320 px, `radius: 20px`, Glas, rechts — exakt das, was das
  Design-Handoff (§7) fuer die Filter-Sidebar der Suche vorgibt. Zwei Spalten ab **1200 px**
  (nicht 1024: darunter blieben dem Inhalt < 500 px). Unterhalb stapelt es.
- **Daten sind nicht erfunden:** alles aus `getTodayPlan` (7a), `badges` (9b), `xpView`,
  `useStreakStore` (7f). **Kein neuer Zustand, kein neuer Backup-Schluessel.**
- **NUR auf `/heute`.** Lernkarten, Quiz und Statistik nutzen bereits 1096 px — dort muesste man
  Inhalt wegnehmen. Der Guide bleibt schmal (Fliesstext gehoert auf ~68 Zeichen).
  **Eine Box, die nur existiert, damit rechts nichts fehlt, ist schlimmer als der leere Platz.**
- **Die Schiene sagt, WO man steht. Sie fuehrt nicht.** „Schnell starten" gehoert in den Inhalt;
  Navigation hat links schon eine Heimat (Icon-Rail). Der Versuch, sie mit hineinzuraeumen, liess
  die linke Spalte nach dem einen Knopf abbrechen.

## Fachliche Pruefung: `npm run export:csv` (2026-07-27)
Was die Automatik NICHT kann, ist fachliche Richtigkeit — die muss ein Mensch lesen, und zwar
nicht in JSON. `scripts/export-csv.mjs` schreibt den Bestand als 20 Tabellen nach
**`docs/pruefung/csv/`**: alle 150 Datensaetze, je Region, je Gelenkgruppe, die
Berufs-Vorsortierung, die funktionellen Gruppen, die 47 bildlosen Muskeln (21 davon in der
3D-App) und die woertlich doppelten Felder. Wegweiser: `docs/pruefung/LIESMICH.md`.

- **Erzeugte Dateien, und sie liegen NICHT im Repo** (`.gitignore`, seit 2026-07-27). Eine
  Aenderung darin bewirkt nichts; der Weg zurueck steht im LIESMICH (Spalte → Quelldatei).
  Eingecheckt waeren sie eine zweite Wahrheit: Wer eine drei Commits alte Tabelle gegenliest,
  prueft einen Bestand, den die App nicht mehr hat, und meldet Fehler, die schon behoben sind.
  `check:daten` faellt jetzt, wenn eine wieder im Versionsstand landet.
  **Gegenbeispiel mit Absicht:** `public/screenshots/*.png` sind ebenfalls erzeugt, bleiben aber
  eingecheckt — sie sind **Build-Eingabe** (Manifest + `check:pwa`), und `make:screenshots`
  braucht einen fertigen Build, den ein frischer Klon noch nicht hat. Gegengeprobt: ohne sie
  baut es durch und `check:pwa` faellt mit zwei Fehlern.
- **Keine zweite Wahrheit:** Das Skript laedt ueber Vites SSR-Lader **dieselben Module wie die
  App** (`getMuscles`, `getJointGroups`, `cardKey`, …), statt die JSONs noch einmal selbst zu
  deuten. Ein Export mit eigener Meinung ueber die Daten waere genau der Fehler, den er
  aufdecken soll. Gegenprobe beim Bau: „21 von 47 in der 3D-App" — dieselbe Zahl, die schon in
  `docs/todo.md` stand.
- 150 Zeilen, nicht 148: Die Spalte „Eigene Karte" macht die zwei Funktionszeilen von
  `M. nasalis`/`M. occipitofrontalis` sichtbar, statt sie wegzufiltern.

## ⚠️ SEGMENTE: 48 LEERE FELDER SIND 23 LUECKEN (2026-07-27) — `src/data/segments.ts`
Ein Abgleich gegen die `{{Infobox Muskel}}` der deutschen Wikipedia (143 von 150 Muskeln
getroffen; Tabelle: `docs/pruefung/vergleich-wikipedia.csv`) zeigte 48 Datensaetze mit leerem
`segments`. **Blind aufgefuellt haette das Anatomie erfunden.** Die Einordnung steht jetzt in
`src/data/editorial/segments.json`:

| Klasse | Anzahl | Bedeutung |
|---|---|---|
| `entfaellt` | 16 | Reiner Hirnnerv (V3/VII) — M. masseter, Mimik, Platysma. **Die haben keine spinalen Segmente.** Nichts zu tun. |
| `klaeren` | 9 | Autochthone Rueckenmuskulatur (Rr. dorsales), segmental ueber die ganze Spannweite. Ein einzelner String trifft das nicht — erst das Modell entscheiden. |
| `ungeprueft` | 20 | Wikipedia-Wert **eingetragen und sichtbar markiert** — Stern am Label auf Karte und Detailseite. Noch nicht im Lehrbuch gegengelesen. |
| `offen` | 3 | Echte Luecken ohne Vorschlag (Mm. interossei plantares/dorsales, Mm. lumbricales) — auch Wikipedia hat dort nichts. |

Alle 23 echten Luecken lagen **in der unteren Extremitaet/Fuss** — eine geschlossene
Migrationsluecke, keine verstreuten Einzelfaelle.

**Der Stern ist Pflicht, nicht Kosmetik.** `withSegments` setzt `Muscle.segmentsUngeprueft`;
`facts.ts` und `MuscleDetailPage` haengen ihn an das **Label** („Segmente *"), nicht an den
Wert — sonst liest man ihn als Teil der Segmentangabe. Zwei Prueflinien halten das fest
(`facts.test.ts`, gegengetestet): jeder ungeprueft markierte Muskel zeigt die Marke, kein
anderer zeigt sie. Nach dem Nachschlagen: `status` auf `offen`, `quelle` durch die Buchstelle
ersetzen — der Stern verschwindet von selbst.

- **Zwei Invarianten gegen den echten Bestand** (`src/data/segments.test.ts`, beide
  gegengetestet): kein Muskel am reinen Hirnnerv traegt Segmente; jede Luecke ist
  klassifiziert. Damit kann niemand die 16 spaeter „vervollstaendigen" und kein neuer
  Muskel rutscht unklassifiziert mit leerem Feld herein.
- **Ein Wert ohne `quelle` laesst den Build fallen.** Sonst wandert ein Wikipedia-Vorschlag
  beim Abtippen unbemerkt in den Bestand.
- **Wikipedia ist Verdachtsgeber, nicht Wahrheit.** Bei der Innervation ist der eigene
  Bestand meist *praeziser* (M. biceps femoris nach Koepfen getrennt, M. digastricus nach
  Baeuchen, M. pterygoideus medialis mit V3-Zuordnung) — Wikipedia fasst zusammen. Und die
  Segment-Abweichungen sind zu einem Drittel **systematisch** (8x „nur bei mir C6" am
  N. radialis, 3x S1 am N. gluteus superior): eine Quellenentscheidung mehrfach uebertragen,
  kein Fehler. Einmal im Buch nachschlagen klaert je ganze Gruppen.
- **Mechanisch vergleichbar sind nur Segmente und Innervation.** Ursprung/Ansatz/Funktion
  bleiben bei ~85–100 % markiert (lateinische Deklination, Freitext auf beiden Seiten) —
  dafuer braucht es Sprachurteil, kein Textvergleich. Naechster Schritt.
- ⚠️ `docs/pruefung/vergleich-wikipedia.csv` liegt **eine Ebene ueber** `csv/`, weil
  `export-csv.mjs` sein Zielverzeichnis per `rmSync` leert.
- ⚠️ Beide Dateien sind erzeugt und stehen in der `.gitignore`. Die Vergleichsliste ist die
  **einzige, deren Neuerzeugen weh tut**: `npm run vergleich:wikipedia` braucht Netz und laeuft
  Minuten (ein Abruf je Muskel, gedrosselt); sie ist zugleich die Eingabe fuer den offenen
  naechsten Schritt (Ursprung/Ansatz per Sprachurteil). Ihre Eingabe wiederum ist
  `csv/00-alle-muskeln.csv` — das Skript sagt es jetzt selbst, statt an einem ENOENT zu sterben.

## ⚠️ INSTALLIERBARKEIT: DIE APP WAR NIE KAPUTT, ES FEHLTE DAS ANGEBOT (2026-07-27)
Befund aus der Praxis: Installation klappte bei einem Nutzer, beim naechsten nicht. Die
Kriterien waren **immer** erfuellt (Manifest, SW, Icons 192/512/maskable, HTTPS,
`start_url`/`scope` passend zur `base`). Es gab nur kein eigenes Angebot — also hing alles
daran, ob der Browser von sich aus fragt. Drei Plattformen, drei verschiedene Antworten:

| Lage | Was der Nutzer braucht |
|---|---|
| Chrome/Android | Automatische Leiste ist abgeschafft; Eintrag steckt im ⋮-Menue → **eigener Knopf** |
| iOS/iPadOS | `beforeinstallprompt` gibt es dort **nicht** → nur eine **Anleitung** (Teilen → Zum Home-Bildschirm) |
| In-App-Browser (WhatsApp, Instagram, Teams) | Installieren ist **technisch unmoeglich** → erst rausschicken. **In der Praxis die haeufigste Ursache.** |

- **`src/pwa/install.ts`**: `angebot()` ist eine reine Funktion ueber einem Umgebungs-Objekt,
  also ohne Browser testbar. Die **Reihenfolge ist die Aussage**: schon installiert schlaegt
  alles · In-App-Browser **vor** iOS (im Instagram-Webview auf dem iPhone fuehrt die
  iOS-Anleitung ins Leere) · echter Knopf vor Anleitung.
- **Der Ereignis-Puffer liegt im Modul, nicht in einem `useEffect`.** `beforeinstallprompt`
  trifft oft ein, BEVOR React gemountet hat — ein Effekt-Listener kaeme zu spaet und der
  Knopf blieb aus, obwohl der Browser installieren wuerde.
- **UA-Erkennung nur, wo es nicht anders geht**: fuer „ist das iOS?" und „ist das ein
  In-App-Browser?" gibt es keine Feature-Erkennung. iPadOS 13+ gibt sich als Mac aus —
  `maxTouchPoints > 1` ist das einzige Unterscheidungsmerkmal.
- Der Abschnitt steht am **Ende** von `/anleitung`: Er ist Technik, keine Lernerklaerung.

### `npm run check:pwa` — gegen das gebaute `dist/`, nicht gegen die Konfiguration
Der gefaehrlichste Fehler dieser Klasse **faellt lokal nie auf**: Laufen `base` und
`start_url`/`scope` auseinander, installiert der Browser einen Scope, den es nicht gibt —
`vite preview` liefert fuer jeden Pfad die index.html aus, alles sieht richtig aus, und erst
auf GitHub Pages startet die installierte App ins Nichts.

- **Keine zweite Wahrheit:** Die erwartete `base` wird aus den Asset-Pfaden in
  `dist/index.html` **abgeleitet**, nicht noch einmal behauptet.
- Geprueft: Manifest-Pflichtfelder · jede Icon-/Screenshot-Datei existiert **und hat die
  deklarierte Pixelgroesse** (eine luegende `sizes`-Angabe laesst Chrome das Icon
  stillschweigend verwerfen) · Icons ≥192 und ≥512 · Service Worker · die vier
  iOS-/Mobile-Meta-Tags · `apple-touch-icon`.
- In `verify` **nach `build`, vor den Browserlaeufen** — ein Manifest-Fehler soll auffallen,
  bevor Playwright startet. Fuenf Fehlerklassen gegengetestet.
- ⚠️ **Zwei Bauschritte fuer die Screenshots**: `build` → `make:screenshots` → `build`.
  Wer den zweiten vergisst, erfaehrt es von `check:pwa`.
- ⚠️ **Bekannte zweite Quelle**: `scripts/checks/harness.mjs` hat die `base` als Literal
  (`/MuskelfinderV2/`). `check:pwa` faengt die Manifest-Seite ab, aber ein `base`-Wechsel
  muesste dort **auch** nachgezogen werden.

## ⚠️ DIE FACHFELDER STEHEN UEBERALL GLEICH (2026-07-27) — `src/data/muscle-fields.ts`
**Ursprung → Ansatz → Funktion → Innervation → Segmente.** Diese Reihenfolge liegt in
`FACHFELDER` und wird nirgends sonst behauptet. Vorher standen dieselben fuenf Felder an drei
Stellen in drei Reihenfolgen (Detailseite / Lernkarten-Rueckseite / Quiz-Vergleichskarte).

- **Warum das in einer Lern-App teuer ist:** Wer auswendig lernt, praegt sich die **Position**
  mit ein, nicht nur den Text. Wechselt die Reihenfolge zwischen Nachschlagen, Ueben und
  Abfragen, sucht der Lernende jedes Mal an der falschen Stelle.
- **Warum gerade diese Reihenfolge:** Sie folgt der anatomischen Beschreibung, in der auch
  Lehrbuecher einen Muskel abhandeln — wo faengt er an, wo hoert er auf, was tut er deshalb,
  woher kommt der Befehl, aus welcher Rueckenmarkshoehe.
- **`folgtReihenfolge()` prueft als Teilfolge**, nicht auf Gleichheit: Auslassen ist erlaubt
  (leere Segmente bei 28 von 150), Anhaengen auch (Gelenke, TA-Code, Lage). Verboten ist nur
  das Vertauschen zweier Fachfelder gegeneinander.
- **Geprueft am gerenderten DOM aller 150 Muskeln**, nicht an der Datenfunktion — was zaehlt,
  ist was der Lernende sieht. `buildRows` bleibt modulprivat.
- Die **Stern-Regel** fuer ungepruefte Segmente (`UNGEPRUEFT_MARKE`) stand ebenfalls doppelt
  und liegt jetzt in derselben Datei. Sonst haette das naechste Umsortieren sie wieder
  auseinandergezogen.
- Gegengeprobt in **zwei** Richtungen: (A) Reihenfolge in der Quelle zurueckgedreht → 12
  Fehlschlaege in 5 Dateien. (B) nur **eine** Anzeige tanzt aus der Reihe, Quelle bleibt
  richtig → 3 Fehlschlaege mit Fundstelle. Ohne (B) haette die Pruefung nur Aenderungen an
  sich selbst bemerkt — das ist der Unterschied zwischen „prueft die Konstante" und „prueft
  die Anzeigen".
- `scripts/export-csv.mjs` fuehrt dieselbe Reihenfolge in den Spalten (war schon richtig,
  traegt jetzt einen Verweis). `ExplainSheet` hatte keinen Test und hat jetzt einen.

## ⚠️ EIN NAME, EINE STELLE (2026-07-27) — `mode-labels.ts`, `muscle-fields.ts`
Nachpruefung der Reihenfolge-Arbeit: Es ging nicht um Ordnungsliebe, sondern es lagen **drei
Klassen derselben Doppelung** vor. Was daraus hart gilt:

- **Modusnamen: `src/data/mode-labels.ts` ist die einzige Quelle.** Vorher vier Stellen, zwei
  davon zeichengleich (`MODE_CATEGORY` in `quiz.ts`, `QUIZ_MODE_LABELS` in `stats.ts`).
  `exam.ts` liest die sechs MC-Formen von dort und besitzt nur `recall` selbst; `QuizPage`
  liest die konkreten Richtungen von dort.
- **Absichtliche Ausnahme, festgehalten durch einen Test:** „Gemischt" und „Starten" in
  `QuizPage` bleiben eigene Knopftexte. Sie sind keine Modusnamen, sondern Beschriftungen im
  Zusammenhang ihrer Karte. Unter „Ursprung & Ansatz" ist „Gemischt" verstaendlich,
  „Ursprung ↔ Ansatz" waere umstaendlich. **Einheitlichkeit ist hier der Fehler**, und der
  Test verhindert, dass jemand das „aufraeumt".
- **`check-journey.mjs` behaelt seine Modus-Liste**: Sie ist eine Auswahl (6 von 11 werden
  begangen), keine zweite Fassung der Tabelle. Weicht ein Label ab, faellt die Pruefung
  ohnehin — sie nennt jetzt die Fundstelle.
- **Der Stern brauchte auf der Lernkarte eine Legende** (Defekt, behoben). Die Detailseite
  erklaerte ihn, die Karte nicht. Auf der Karte ist das teurer: dort wird der Wert
  EINGEPRAEGT, ein ungeprueftes Datum ohne Hinweis wird als gesichert gelernt. 20 Muskeln
  betroffen. Text und Bedingung stehen in `muscle-fields.ts`, damit beide woertlich dasselbe
  sagen.
- **`LabeledValue`** (`src/types/index.ts`) ersetzt `Fact`/`DataRow`/`Row` als Struktur; die
  Namen bleiben als Aliase, weil sie am Aufruf mehr sagen. `nichtLeer()` ersetzt den dreifach
  wiederholten Leer-Filter.
- **Regel fuer kuenftige Arbeit:** Bevor eine Beschriftung an einer zweiten Stelle
  hingeschrieben wird — pruefen, ob sie schon existiert. Zwei uebereinstimmende Kopien sind
  kein Beweis, dass es gutgeht, sondern nur, dass es noch niemand angefasst hat.

## ⚠️ HANDY-DURCHGANG 2026-07-27 — DER PRUEFUNG FEHLTE DER SEED
Nachpruefung der Handy-Ansicht. Der wichtigste Fund war **kein UI-Fehler, sondern ein Loch in
der Pruefung**: `check-surface.mjs:182` rief den ganzen Handy-Block ohne `{ seed: SEED }`, also
gegen Onboarding und leere Listen. Tippziele, axe, Ueberlauf und Scrollfallen sahen auf dem
Handy fast leere Seiten. **Eine Pruefung, die den leeren Zustand misst, misst nicht die App** —
dieselbe Klasse wie „beide liefen ausschliesslich auf 1440 × 900" (UX-Review 2026-07-26), eine
Ebene tiefer.

Was daraus hart gilt:

- **Jeder neue `withApp`-Block, der befuellten Zustand braucht, bekommt den Seed.** Der leere
  Zustand wird SEPARAT geprueft (Block 5) — das ist Absicht, aber es ersetzt den befuellten nicht.
- **16 px sind die Untergrenze fuer Eingabefelder** (`base.css`, eine Regel fuer alle). Darunter
  zoomt iOS Safari beim Fokussieren hinein und nicht zurueck. War an zwei von drei Stellen falsch.
- **200 % Textzoom ist eine eigene Pruefstufe** (WCAG 1.4.4) und NICHT durch 320 px gedeckt: Dort
  schrumpft der Platz, hier waechst der Inhalt. Ursache fast immer `min-width: auto` auf Flex-/
  Grid-Kindern. In dieser App besonders scharf, weil lateinische Namen lang und unteilbar sind
  (`M. sternocleidomastoideus` = 413 px bei 32 px Schrift).
- **`overflow-wrap`: global `break-word`, punktuell `anywhere`.** Der Unterschied ist
  spezifikationsrelevant — nur `anywhere` senkt die **min-content-Breite**, und nur die
  entscheidet, wie schmal ein Flex-Kind werden darf. Global gesetzt liess `anywhere` auf 320 px
  Elemente auf 19 px kollabieren (24 Befunde). Es gehoert nur dorthin, wo ein Kind unter sein
  laengstes Wort schrumpfen MUSS (`.badge__label`).
- **Klebende Startknoepfe unter 1024 px sind das Muster, nicht die Ausnahme.** `.fc-actions`
  hatte es, `.fc-setup__start` und `.exam-intro__start` fehlten — dieselbe 96-px-Reserve fuer
  die Tab-Leiste. Beim vierten Auftreten gehoert das in eine gemeinsame Klasse.
- **Kleinste Schrift: 11 px, nicht 12 px.** Die 48 Stellen mit 11–11.5 px sind gesperrte
  Mikro-Labels — ein legitimes Mittel, Kontrast von axe bestaetigt. Sie umzuwerfen waere eine
  Designentscheidung, keine Reparatur. Behoben wurde, was DARUNTER lag: 8.8 px am
  `.progress-ring__label` und fuenf Stellen mit 10 px.
- **`START-UNTER-FALZ` gilt nur auf vier Seiten** (`/lernkarten`, `/quiz`, `/pruefung`,
  `/heute`). Auf `/anleitung` steht „Zurueck zu Heute" nach 2700 px Anleitung, und das ist
  richtig. Eine Regel „jede Hauptaktion ueber die Falz" haette Fehlalarm erzeugt und waere zu
  Recht ignoriert worden — eine Pruefung, die man ignoriert, ist schlechter als keine.
- **Der 200-%-Zoom laeuft auf BEIDEN Handybreiten** (390 und 320). Nur 375 zu pruefen liess
  drei Ueberlaeufe stehen: Toast mit `white-space: nowrap` (387 px breit auf 320 px Schirm),
  die Textspalte des klinischen Hinweises (Flex-Kind ohne `min-width: 0`) und der
  Onboarding-Knopf („Physiotherapie" = 274 px bei 32 px Schrift in 288 px Knopf).
  Enger Schirm UND doppelte Schrift zusammen sind der schaerfste Fall.
- ⚠️ **Der befuellte Lauf sieht den LEERZUSTAND nicht** — und umgekehrt. Nach dem
  Seed-Nachtrag war `/lernkarten` im befuellten Zustand sauber, im Erststart aber nicht:
  „Muskeln hinzufuegen" lag bei y=590 auf 320 × 568, weil zwei Navigationszeilen davor
  standen, eine davon mit demselben Ziel. Gefunden hat das erst eine Messung an der
  **Live-Seite**, nicht die Pruefung. Block 5 prueft die Startaktion jetzt auch leer.
  Merksatz: **Jeder Zustand braucht seinen eigenen Lauf** — befuellt UND leer.
- ⚠️ **Zwei meiner eigenen Messungen waren Fehlalarm** und sind hier festgehalten, damit sie
  niemand nachbaut: „feste Leisten belegen 96 % der Hoehe im Querformat" (die `stand-rail` liegt
  bei y=737 unter dem Bild — Hoehen summiert, ohne die Position zu pruefen) und „ein Link liegt
  hinter der TabBar" (Inhalt scrollt normal darunter hervor). Eine Zahl ist noch keine Diagnose.

## Kanonische Quellen
- V1-Original: `../Muskelfinder` (`/home/pepperboy8/Documents/Muskelfinder`)
- V2-Repo: `Muskelfinder-V2`
- Strategie: `ROADMAP.md`
- Etappen/DoD: `docs/migration-plan.md`
- Architektur: `docs/architecture.md`
- Kompatibilitaet: `docs/decisions/0002-persistenz-und-datenkompatibilitaet.md`
- Datenmodell/Migration: `docs/decisions/0005-datenmodell-und-migration.md`

## Unverhandelbar
- Statische App, kein Backend.
- Keine externen Laufzeit-Requests ausser Repo-Daten und statischen Assets.
- UI rendert nur; Parsing/Mapping/Validierung bleibt in `src/data/`.
- Persistenz-/Backup-Kompatibilitaet laeuft nach ADR 0002.
- `nameLatin` bleibt exakt V1-`Name` und ist der Backup-Schluessel.
- Kein `any` in Kernpfaden, keine `window.*`-Globals als State-Kanal.
- BodyParts3D-Bilder: CC BY 4.0, Attribution sichtbar halten.

## Fertig
- Etappe 0: React Router HashRouter, Zustand, Vitest, App-Shell, Theme, Icon-Sprite, Pages-Deploy.
- Etappe 1: Wiederholbare V1-Datenmigration, generierte V2-JSONs, Loader/Validierung, Bildkopie.
- Etappe 2: Persistenz-/Backup-Kern (`src/persistence/`), Sanitizer + `parseBackup`/`buildBackup`
  im eingefrorenen v2-Format, Leitner-7- & XP-Kurven-Module, persistierte Stores
  (`useProgressStore`/`useQuizStore`/`useCollectionStore`), Backup-Bridge, Round-Trip-Tests
  gegen V1-Format-Fixtures. ADR 0006 angelegt.
- Etappe 3: Funktionaler Kern (un-poliert, tokenbasiert). 3a Suche/Filter (deep-linkbare URL),
  3b Muskel-Detail (Fachlich/Einfach, ImageViewer + Attribution, Collection), 3c Lernkarten
  (Leitner-Session), 3d Quiz (4 MC-Modi, kompatible Serien-Statistik), 3e Statistik (abgeleitete
  Selektoren) + Backup-Panel (Export/Import an der UI). Geteilte Primitives in `styles/components.css`.
- Etappe 4: Hi-Fi-Design (Durchgang 1–7). Responsive Glas-Shell (Rail⇄TabBar), Handoff-Primitives,
  Treffer-Highlighting, ActiveFilters, Quiz-Options (A–D), LeitnerBoxes, LevelCard, Sheet + mobiles
  FilterSheet, ImageViewer-Thumbnails, ClinicalNote, Lernkarte-3D-Flip, Quiz-Progress-Segmente,
  Statistik-CardBreakdown-Bento, mobile Region-Chips, Sheet-Fokus-Trap, Radiogroup-Roving-Tabindex,
  Dark-Mode-Feinschliff. Light+Dark per Screenshot verifiziert. Nur Tokens.

## Datenstand
- Runtime-Daten: `src/data/generated/`
- Bilder: `public/muscles/`
- Migrationsbefehl: `npm run migrate:data`
- Default-Quelle: `../Muskelfinder`
- Alternative Quelle: `MUSKELFINDER_V1_SOURCE=/pfad npm run migrate:data` oder `--source`
- Ergebnis: 150 Muskeln, 4 Regionen, 111 Bewegungen.
- Bilder: 168 Bildreferenzen, 152 eindeutige Dateien, 47 bildlose Muskeln wie in V1.
- Report: `src/data/generated/migration-report.json`

## Bekannte Datenhinweise
- Doppelte V1-Namen haben stabile ID-Suffixe: `M. flexor digiti minimi brevis`,
  `M. abductor digiti minimi`, `M. opponens digiti minimi`, `M. nasalis`,
  `M. occipitofrontalis`.
- 56 Segment-Hinweise stehen im Migrationsreport; nicht raten, bei Bedarf manuell pruefen.
- Zwei V1-Bilddateien sind nicht referenziert:
  `/assets/images/untere-ext/muscle_adductor_minimus_ventral_1.jpg`,
  `/assets/images/untere-ext/muscle_fibularis_tertius_lateral_1.jpg`.
- TA-Codes fehlen in V1 und bleiben optional. Nicht erfinden.

## Kopplung 3D-App V2: LIVE UND GEPRUEFT — kein Blocker mehr (2026-07-14)
Der „In 3D ansehen"-Link zeigt auf **`https://aher-dev.github.io/3DAnatomyV2/`**.

**Warum V2 und nicht V1:** V1 laedt three.js zur Laufzeit per Import-Map von `cdn.jsdelivr.net`
(live gemessen: 9 Requests). Das schickt die IP unserer Nutzer an ein fremdes CDN und verletzt die
Architektur-Grenze „keine externen Laufzeit-Requests". V2 buendelt three.js lokal und macht null
externe Requests. Deep-Link-Vertrag: `muscleKey`/`muscle`/`source`/`returnTo`.

**End-to-End LIVE geprueft am 2026-07-14** (echter Klick auf der veroeffentlichten Detailseite,
nicht gegen einen lokalen Build): Detailseite → „In 3D ansehen" → neuer Tab → Muskel hervorgehoben
→ „← Zurueck zum Muskelfinder" fuehrt zurueck. 24 Bedienelemente, Lizenz-Link und die
CC-BY-Attribution sichtbar. **0 externe Requests.** Alle Rechtsseiten HTTP 200
(`datenschutz.html`, `quellen-lizenzen.html`) — die 404 von 2026-07-13 ist behoben.

### ⚠️ Die Falle, die uns das eingebrockt hat: der „Vorschau-Modus" der 3D-App
Nach dem Redesign-Deploy fuehrte JEDER Klick auf „In 3D ansehen" in eine **tote App**: 0 Knoepfe,
0 Links, kein Rueckweg, keine sichtbare CC-BY-Attribution. Nur ein Standbild.

- Die 3D-App hat einen **Vorschau-Modus** (`js/integration/muskelfinderPreview.js`), der die
  gesamte React-UI, `setupInteractions()` und `initRoomSettings()` abschaltet — gedacht als
  **eingebettetes Vorschaubild**.
- Er sprang an `source === 'muskelfinder' && (muscleKey || muscle)` an — **genau der Link, den
  `threeDUrl()` baut**, und den die Detailseite per `<a target="_blank">` als NAVIGATION oeffnet.
  Der Muskelfinder bettet nichts ein; es gibt hier kein einziges `<iframe>`.
- **Behoben im 3D-Repo** (Commit `b12bf3b`, auf `main`, deployt): Die Vorschau verlangt jetzt einen
  echten Rahmen (`window.self !== window.top`) oder ein ausdrueckliches `?preview=1`.
  Sechs Tests wachen darueber (`js/integration/muskelfinderPreview.test.ts`).
- **Lehre fuer uns:** Der Deep-Link ist ein Vertrag mit einem FREMDEN Repo. Wer dort deployt, kann
  ihn brechen, ohne dass hier eine Zeile Code faellt — und kein Test von uns haette es gemerkt.
  **Nach jedem 3D-Deploy den Link einmal live klicken.**

Faellt die Entscheidung gegen V2, genuegt ein Zurueckdrehen von `THREE_D_BASE_URL`
(`src/data/threeD.ts`) — die URL ist die einzige Stelle.

## Produktphase (Etappen 7–9) — vom Nachschlagewerk zum Coach
Die Migration ist durch: die App **kann** alles, was V1 konnte. Drei unabhaengige Recherche-Berichte
(`docs/Brainstorming.txt`) kommen zum selben Befund: **Die App ist eine Bibliothek, keine
Lernbegleitung.** Sie oeffnet auf einer Liste mit 150 Muskeln, der Karteikasten muss von Hand
befuellt werden, die Statistik zeigt Zahlen ohne Empfehlung.

- **Verbindlicher Stand + Statustafel: `docs/produkt-plan.md`.** Dort steht je Schritt (7a–9d),
  ob er offen, laufend, fertig oder blockiert ist. **Wer einen Schritt abschliesst, aktualisiert
  die Tafel** — sonst weiss der naechste Agent nicht, wo er ansetzt.
- Nordstern: beim Oeffnen genau **ein** Vorschlag — „Heute dran".
- Harte Entscheidungen: **ADR 0007** (Einstieg `/heute`, Navigation nach Absichten statt Features),
  **ADR 0008** (Abrufstufe wird aus der Leitner-Box *abgeleitet*, nicht gespeichert — ADR 0002
  bleibt dadurch unangetastet).
- **Nichts ist mehr blockiert:** Die Entscheidungen E1–E5 sind am 2026-07-12 getroffen (siehe unten
  und Statustafel). Etappe 9 ist damit entblockt und folgt nach Etappe 8.
- Konzept-Mockups (visuell, extern): Heute-Screen und Produktkonzept, siehe `docs/produkt-plan.md`.

## Naechster Schritt
**DIE APP IST LIVE.** `aher-dev.github.io/MuskelfinderV2/` liefert HTTP 200 und traegt den aktuellen
Stand (am ausgelieferten CSS nachgemessen, nicht gehofft). Der Pages-Schalter und der 3D-Deploy sind
erledigt — beide Punkte, die hier frueher als „nur vom Projektinhaber loesbar" standen, sind zu.

**Es gibt keinen offenen Code-Task mehr.** Offen ist nur noch, was den FACHMANN braucht —
vollstaendige Liste: `docs/todo.md`. (Die Entscheidung, die an ADR 0002 ruehrte, ist am 2026-07-26
mit **ADR 0012** gefallen und umgesetzt.)
(Der UX-Review vom 2026-07-26 hat acht Fehler gefunden und behoben; die Regeln daraus stehen oben.)
- Palpationstexte aus dem Kollegen-Skript (`docs/palpation-erfassen.md`).
- Kursabschnitte (`docs/curriculum-erfassen.md`) — solange leer, steht der Platzhalter HINTEN.
- ~~**Die drei doppelten `nameLatin`** (Hand/Fuss)~~ — **ERLEDIGT 2026-07-26 (ADR 0012).** Der
  Kartenschluessel ist nicht mehr der Anzeigename; der Handmuskel ist lernbar, der Fuss behaelt
  seinen historischen Schluessel, ADR 0002 bleibt unangetastet (rein additiv, keine Migration).
- V1 (`aher-dev.github.io/Muskelfinder/`) ist noch live — Hinweis setzen oder abschalten (dir egal).

**ETAPPE 9 IST VOLLSTAENDIG GEBRIEFT** (Rahmen + 9a-9d, siehe Statustafel).
**9a ist gebaut** (15 Gruppen, Gruppen-Quiz, Gruppenseite) — die Gruppenliste **wartet auf die
fachliche Freigabe des Projektinhabers** (E2). Was er streicht, wird gestrichen.
**9c ist gebaut** (Pruefungsmodus `/pruefung` + Debrief) — **BRUECKE B3 IST EINGELOEST.**
**Damit stehen ALLE VIER Bruecken** (B1 7d, B2 7e, B3 9c, B4 8c).
**9b ist gebaut** (Kompetenz-Abzeichen unter Fortschritt) — abgeleitet aus (Gruppe × Leitner-Box),
**nirgends gespeichert**.
**9d ist gebaut** (Palpation, Sektion „Am Koerper finden") — **die MECHANIK. Die Daten nicht.**
Reihenfolge: 9a ✅ → 9c ✅ → 9b ✅ → 9d ✅.

## ABNAHME DURCH DEN PROJEKTINHABER: ERFOLGT (2026-07-13)
Er hat den Abnahmebogen durchgearbeitet. Ergebnis:
- **Gruppen: 14 statt 15.** M. plantaris raus aus der Wade, M. quadratus lumborum „in Klammern"
  bei der Bauchwand (neues Feld `related` — angezeigt, aber KEIN Mitglied: zaehlt weder im
  Gruppen-Quiz noch im Abzeichen). **Hypothenar ENTFERNT** — siehe unten, nicht wieder anlegen.
- **Merksaetze (8d): ganz entfernt.** Feld, Typ, Anzeige, Tests. Erledigt.
- **Palpation (9d): alle 21 KI-Vorschlaege gestrichen.** Er holt die Texte aus dem **Skript seiner
  Kollegen** und traegt sie selbst ein. **NIE wieder Palpationstexte erfinden oder vorschlagen.**
  Ablauf: `docs/palpation-erfassen.md`. Bis dahin: bewusster Platzhalter auf der Detailseite.
- **3D-Renderings (8f): zurueckgestellt.**
- **3D-Datenschutz-404: macht er selbst.** V1 laeuft weiter, das ist ihm egal.

**Quiz-Pool-Filter (8b): GEBAUT** (`src/data/quiz-pool.ts`). Damit ist der letzte offene Punkt aus
Etappe 8 erledigt.
- **Zwei Toepfe, und sie sind NICHT derselbe:** `questions` (worueber gefragt wird — der Karten-Filter
  greift hier) und `distractors` (woraus die falschen Antworten kommen — der Karten-Filter greift hier
  NIE). Genau darum genuegt **EINE** passende Karte fuer eine vollstaendige 4-Optionen-Frage.
- Der **Bereichsfilter** (Region) grenzt dagegen **beide** Toepfe ein.
- **`quizSeriesKey` bleibt bitgleich** (Regressionstest). Das V1-Feld `deckOnly` stand immer auf
  `false` und war fuer genau diesen Fall da: „Nur mein Karteikasten" erzeugt denselben Key, den V1
  erzeugt haette. Erst `wrong`/`unseen`/`difficult` haengen ein `filter`-Feld an — und **nur dann**.
- Der **Gruppen-Modus ignoriert den Karten-Filter** (er fragt nach Zusammenhaengen, nicht nach
  Karten) und benutzt immer `scope: 'all'`.

**ES GIBT KEINEN OFFENEN CODE-TASK MEHR.** Offen sind nur noch Dinge, die der Projektinhaber
erledigt — die vollstaendige Liste steht in **`docs/todo.md`**: Palpationstexte aus dem
Kollegen-Skript (`docs/palpation-erfassen.md`), Kursabschnitte (`docs/curriculum-erfassen.md`), die
3D-App neu deployen (ihre `datenschutz.html` liefert 404), 3D-Renderings (zurueckgestellt).

**Das Logo ist erledigt (12b).** Die Wortmarke haengt in der Kopfzeile der Shell (`BrandMark`) und
steht damit auf JEDER Route — Desktop rechts, Handy als Kopfzeile ueber der Suche. Reihenfolge nach
Ansage: **„Anatomie Fokus" oben, „Muskelfinder" darunter.** Genau EINMAL pro Bildschirm: Das Zeichen
ist dafuer aus der Icon-Rail und aus der `StandRail` verschwunden — ein Test bewacht das
(`BrandMark.test.tsx`). Wer es in die Rail zurueckholt, hat zwei Logos auf einem Schirm.

## ⚠️ EIN KARTEN-SCHLUESSEL, EIN MUSKEL (2026-07-14) — `isCardMuscle` / `CARD_MUSCLES`
**Wer beim Lesen wieder ueber `getMuscles()` laeuft, baut den Fehler neu ein.**

Beim Mobil-Durchlauf als Schuelerin gemessen: Der Knopf „Obere Extremitaet" verspricht **53**
Karten — die Kasten-Tabelle zeigte **56 Zeilen**, drei davon „Untere Extremitaet". Die erste Karte
der allerersten Sitzung war wieder **`M. abductor digiti minimi`**, diesmal mit **Fuss**-Fakten
(Tuber calcanei, Kleinzehe). Nicht durch `seedDeck` (der ist geloescht) — durch den **Bereichs-Weg**.

- Fuenf `nameLatin` gibt es **zweimal**. Karten sind nach `nameLatin` geschluesselt (ADR 0002 §2),
  also ist so ein Paar **EINE** Karte — `addCards` entdoppelt laengst, und `regionMuscleNames`
  auch. **Der Fehler sass auf der LESE-Seite:** `DeckManagerPage` und `quizPool` liefen ueber die
  **150 Muskeln** und behielten die, deren Name ein Kartenschluessel ist — fuer EINE Karte fanden
  sie **ZWEI** Muskeln.
- Folgen, alle am Build nachgemessen: widerspruechliche Zahlen (Quiz „Karteikasten **56**",
  Sitzung „**53** Karten"), Phantom-Zeilen, und **„Entfernen" loeschte beide Zeilen auf einmal** —
  es ist derselbe Schluessel. Wer den Fussmuskel loswerden wollte, verlor die Handkarte mit.
- **`isCardMuscle(muscle)` in `src/data/loader.ts` ist die einzige Regel:** wahr genau dann, wenn
  `getMuscleByCardKey(cardKey(m)) === m`. Sie waehlt den Muskel, den die Lernkarte **rendert** —
  jede andere Wahl zeigte eine Zeile, die nicht zur Karte gehoert. `CARD_MUSCLES` ist die fertige
  Liste (**148** statt 150; bis ADR 0012 waren es 145). **Alles, was von Karten auf Muskeln
  schliesst, geht hier durch.**
- `quizPool` entdoppelt nur die **`questions`**. Die **`distractors`** bleiben der ganze Bestand —
  das ist die Regel aus 8b und sie gilt weiter. `quizSeriesKey` bleibt bitgleich (ADR 0002).

**Das war eine Entdopplung, KEINE Heilung — geheilt ist es seit dem 2026-07-26 (ADR 0012).**
Hier stand: Der Hand-Kleinfingerballen bleibt ueber Karten unlernbar (sein Schluessel loest auf den
Fuss auf), und drei Karten in einem „Obere Extremitaet"-Kasten tragen das Etikett „Untere
Extremitaet". Es war **dieselbe Wurzel, an der das Hypothenar gestorben ist** (siehe unten).

Das Gegenmittel brauchte **keinen** neuen `nameLatin` und bricht ADR 0002 **nicht**: Der
Kartenschluessel wurde vom Anzeigenamen getrennt (`cardKey`), der **Fuss behaelt** den historischen
Schluessel, die Hand bekommt `…#manus`. Damit ist die Aenderung rein **additiv** — alte Backups
importieren unveraendert, kein Bestandsnutzer verliert etwas, es gibt keine Migrationsregel. Details,
Preis und Pruefzeilen: `docs/decisions/0012-kartenschluessel-statt-anzeigename.md`.

## Handy-Regeln, die ab jetzt gelten (2026-07-14)
- **⚠️ UEBERHOLT AM 2026-07-26: Die App startet HELL, nicht nach Geraet.** Ansage des
  Projektinhabers — die Marke ist auf dem warmen Papier gestaltet. Der Umschalter bleibt, und eine
  ausdrueckliche Wahl wird persistiert und schlaegt die Vorgabe.
  **DREI Stellen kennen dieselbe Regel, und sie muessen zusammenbleiben:** `useThemeStore`
  (`DEFAULT_THEME`), das No-Flash-Skript in `index.html` (vor dem ersten Paint) und die
  **eine** `theme-color` (die `useTheme` nachzieht). Zwei medienabhaengige `theme-color`-Metas
  waeren jetzt falsch: Sie legten auf einem Nachtmodus-Handy eine dunkle Systemleiste um eine
  helle Seite. Vier Tests wachen darueber.
  Der frueher hier stehende `@media (prefers-color-scheme: dark)`-Block in `theme.css` war
  **toter Code** (das Skript setzt `data-theme` immer, also traf `:not([data-theme])` nie zu) und
  obendrein eine zweite Kopie der Tokens aus `[data-theme="dark"]`. Nicht wieder anlegen.
  *Der historische Fehler von damals war NICHT der helle Default, sondern dass daneben toter
  Code stand, der aussah, als sei an den Nachtmodus gedacht.*
- **Touch-Ziele: 44 px, aber nur unter 1024 px.** `--touch-min` gilt fuer echte Bedienelemente —
  auf dem Desktop zielt eine Maus, dort bleibt das Bild wie gestaltet. **`.chip` ist auch ein
  reines Etikett** (die Bewegungs-Tags auf den Suchtreffern): darum `button.chip`/`a.chip`, nie
  `.chip`. Eine native Checkbox darf 17 px bleiben, wenn ihr `<label>` die Trefferflaeche ist.
- **Quiz-Distraktoren kommen aus der Nachbarschaft** (`nearestFirst` in `src/data/quiz.ts`): erst
  dieselbe Subregion, dann dieselbe Region, dann der Rest als Auffuellung. Der Rest MUSS drinbleiben
  — sonst hat eine kleine Subregion keine vier Optionen (die Regel aus 8b). `quizSeriesKey` bleibt
  unangetastet, aber **die Runden sind seitdem schwerer**: alte und neue Trefferquoten sind nur
  bedingt vergleichbar.

## Die Aktionen der Lernsitzung kleben (2026-07-14)
Gemessen auf 390 × 664: „Karte aufdecken" und die drei Bewertungsknoepfe lagen bei **y = 872** —
unter der Falz. **Eine Sitzung mit 20 Karten kostete 20-mal Scrollen**, bevor man bewerten konnte.

- `.fc-actions` ist `position: sticky` unterhalb von 1024 px (darueber gibt es keine Tab-Leiste).
  `bottom` ist dieselbe **96-px-Reserve**, die `.shell--mobile .content` ohnehin freihaelt — die
  Leiste legt sich damit **nicht** auf die Navigation. Wer eine zweite klebende Leiste baut, nimmt
  denselben Wert.
- **Der Kopf der Sitzung ist weg** (ebenfalls 2026-07-14): Ueber der Karte standen Marke,
  Kopfzeilen-Suche, der Titel „Lernkarten" und zwei **Setup**-Knoepfe — **445 px, mehr als die
  Karte selbst (443 px)**. Das war die eigentliche Ursache der Falz, nicht die Kartenhoehe.
  Waehrend eine Karte laeuft, sind Titel, Untertitel und Setup-Links ausgeblendet; die Karte
  beginnt bei **y = 278**. Die `h1` bleibt als `visually-hidden` stehen — ohne sie haette die Seite
  keine Ueberschrift (axe-Regel `page-has-heading-one`).

## ⚠️ KEIN HYPOTHENAR — und das bitte nicht „reparieren"
Drei seiner vier Mitglieder (`M. abductor digiti minimi`, `M. flexor digiti minimi brevis`,
`M. opponens digiti minimi`) tragen einen `nameLatin`, den es **ZWEIMAL** gibt: einmal Hand, einmal
Fuss. Karten sind nach `nameLatin` geschluesselt (ADR 0002 §2), also loeste die Gruppe still auf die
**FUSS**-Muskeln auf: Die Gruppenseite zeigte „Untere Extremitaet", und das Abzeichen „Hypothenar
komplett" haette man mit den **Fusskarten** verdient. Der Kleinfingerballen ist mit
`nameLatin`-Schluesseln **nicht darstellbar**. Am 2026-07-13 entfernt.

**Ein Test wacht darueber:** Kein mehrdeutiger Name darf in einer Gruppe stehen, dessen Doppel in
einer ANDEREN Region liegt. (`M. nasalis` und `M. occipitofrontalis` sind ebenfalls doppelt, aber
beide Haelften liegen im Kopf — unbedenklich, und die Regel unterscheidet genau das.) Der **Thenar**
ist nicht betroffen: die `pollicis`-Namen sind eindeutig.

**Aus 9b mitnehmen:**
- **Ein Abzeichen ist eine Ableitung, kein Zustand** (`src/data/badges.ts`):
  `verdient(gruppe) ⇔ jeder Muskel hat fach >= MASTERED_FACH`. Es wird **nirgends gespeichert** —
  wer es persistiert, baut eine zweite Wahrheit neben der Box (ADR 0008) und einen Backup-Schluessel,
  den aeltere Versionen nicht kennen (ADR 0002). **Wer eine Karte vergisst, verliert das Abzeichen
  wieder. Das ist Absicht.**
- **Ein Gruppenmuskel ohne Karte hat kein Fach.** Kein Faelligkeitsfilter findet ihn — `groupPractice`
  nimmt ihn darum trotzdem in die Auswahl, und der Knopf legt die Karte an (frisch = sofort faellig).
  Ohne das bliebe ein Abzeichen ewig bei „3 von 4" stehen.

**Aus 9c mitnehmen (gilt fuer alles, was Karten faellig machen will):**
- **`applyExamMiss` in `src/persistence/leitner.ts` ist eine EIGENE Transition, kein Ersatz fuer
  `applyWrong`.** Sie stuft eine Box zurueck UND macht die Karte sofort faellig. Beides ist noetig:
  `applyWrong` legt die Karte auf `dueDate(fach)`, also fruehestens auf **morgen** — `buildQueue`
  filtert auf `isDue`, die Debrief-Sitzung waere **leer** gestartet (die Regel aus 8c). Und ohne die
  Rueckstufung hoebe die Sitzung eine gerade verpasste Karte beim ersten Treffer noch *ueber* ihr
  altes Fach: Die Pruefung wuerde eine Luecke belohnen.
- **Das Schwierig-Flag ist NICHT der Weg, eine Karte faellig zu machen.** Es macht sie zwar immer
  faellig (`isDue`), aber es **klebt** — die Karte bliebe fuer immer „immer faellig", bis jemand sie
  von Hand entmarkiert. Das Flag gehoert der Nutzerin, nicht dem System.
- **Die Pruefung vergibt keine XP und keinen Streak.** Sie bewertet, sie belohnt nicht; verdient wird
  in der Sitzung danach.
- **`questionForMuscle` / `eligibleFor` (`src/data/quiz.ts`)** sind additiv exportiert: Fragen zu
  EINEM vorgegebenen Muskel, Distraktoren aus dem **ganzen** Bestand. `generateQuiz` wuerfelt den Pool
  selbst und taugt nicht, wenn man nur Karten aus dem Kasten abfragen will.

**Drei Fallen fuer den Rest von Etappe 9 (am Code verifiziert):**
1. **`useQuizGame` schreibt bei jeder Runde `commitRound(quizSeriesKey(...))`** (Zeile 110). Wer
   darauf aufsetzt, kippt seine Ergebnisse still in die normale Quiz-Bilanz und verschmutzt den
   V1-Serien-Schluessel. ADR 0002 waere gebrochen. **9c umgeht das mit einem eigenen, nicht
   persistierten Store; ein Test prueft am Quelltext, dass die Namen dort nicht vorkommen.**
2. **`src/data/generated/` wird von `npm run migrate:data` ueberschrieben.** Gruppen (9a) und
   Palpation (9d) gehoeren nach `src/data/editorial/`. Blaupause: `withEtymology` in
   `src/data/etymology.ts`.
3. **Subregionen sind KEINE funktionellen Gruppen.** 15 topographische Subregionen existieren bereits;
   „Rotatorenmanschette" liegt *innerhalb* des Schultergürtels, und ein Muskel gehoert zu MEHREREN
   Gruppen. Many-to-Many, keine Partition.

**Zwei bewusste Auslassungen aus Etappe 8 — beide brauchen den Fachmann, nicht mehr Code:**
1. **8f Stufe 2a (Renderings):** lizenzrechtlich freigegeben, aber Qualitaets-Gate offen (s. u.).
2. **8d Merksaetze:** Die Mechanik steht, die Feldstruktur auch — es ist bewusst **kein einziger
   Merksatz erfunden** worden. Ein falscher Merksatz wird auswendig gelernt. Sie gehoeren in
   `src/data/editorial/etymology.json` unter `muskeln.<nameLatin>.merksatz`.

**8d-Falle (bleibt fuer 9d Palpation relevant):** `src/data/generated/` wird von
`npm run migrate:data` UEBERSCHRIEBEN. Redaktionelle Daten liegen darum unter `src/data/editorial/`
und werden vom Loader dazugemischt (`withEtymology` in `src/data/etymology.ts` ist die Blaupause).
Ein Test wacht darueber; die Migration wurde real ausgefuehrt, die Daten haben sie ueberlebt.

## Lizenzfrage 3D-App: GEKLAERT (2026-07-13)
**Die Pruefung ist bestanden** — Protokoll: `docs/3d-app-lizenzpruefung.md`. Die eigene 3D-App
enthaelt ausschliesslich BodyParts3D-Geometrie (DBCLS); Renderings daraus sind CC BY 4.0 und duerfen
mit Attribution uebernommen werden. **Niemand muss das erneut raten.**

**Stufe 2a (Renderings) bleibt trotzdem offen — aus Qualitaets-, nicht aus Lizenzgruenden:**
- Nur **21 der 47** bildlosen Muskeln sind in der 3D-App ueberhaupt adressierbar; ihr eigener
  Build-Report meldet fuer 28 Muskeln `no-meta-match` (Masseter, Temporalis, Pterygoidei,
  Rectus abdominis u. a.).
- Der Deep-Link allein liefert **kein brauchbares Bild**: Im Kontrollrendering (headless funktioniert)
  liegt der Muskel hinter dem Unterkiefer. Es braucht pro Muskel Isolation, Kamera, Hervorhebung.
- **Ein Bild, auf dem der Muskel nicht zu erkennen ist, ist schlechter als kein Bild.** Ein eigener
  Task mit fachlicher Freigabe durch den Projektinhaber, nicht nebenbei.

Aus 8e mitnehmen:
- Die additive Backup-Sektion gibt es jetzt **viermal** (`lookups`, `profile`, `streak`, `notes`).
  Das Muster ist erprobt: optionale Sektion, nur schreiben wenn nicht leer, Sanitizer nie `strict`,
  altes Backup darf lokale Daten NICHT loeschen. Backup-Version bleibt 2.
- **Muskelnamen taugen nicht als HTML-ID** (sie enthalten Leerzeichen und Punkte). `aria-labelledby`
  bricht daran still. Echtes `<label for>` benutzen.

Aus 8b mitnehmen:
- **`buildQueue(opts, cards?)` ist rein**, wenn man die Karten mitgibt. Die Seite fragt damit dieselbe
  Funktion, die auch die Sitzung startet — die Zahl am Knopf KANN nicht mehr von der Sitzung abweichen.
- **Ein Filter hebt die Faelligkeit nicht auf.** Die Leitner-Box bleibt die einzige Wahrheit ueber den
  Zeitpunkt. Wer eine Karte sofort wiedersehen will, markiert sie als schwierig (die ist immer faellig).

Aus 8c mitnehmen:
- **Ein CTA darf nur faellige Karten versprechen.** `buildQueue` filtert die Uebergabe erneut auf
  Faelligkeit — wer eine nicht-faellige Karte uebergibt, startet eine **leere Sitzung**. Alle
  Selektoren in `src/data/practice.ts` halten sich daran, 8b muss es auch.
- **Es gibt genau eine Priorisierung:** `prioritizeDueCards` in `src/data/today.ts`. Sie ist aus
  `getTodayPlan` herausgezogen, damit Tagesplan und CTAs dieselbe Auswahl treffen. Keine zweite bauen.
- Modus-Sprung ins Quiz: `readQuizHandoff` (`src/data/quiz.ts`), validiert wie die Sitzungs-Uebergabe
  aus 7b. Der V1-Serien-Schluessel bleibt dabei unangetastet.

Aus 8a mitnehmen (gilt fuer alle folgenden Tasks):
- `recallStage(fach)` in `src/data/recall.ts` ist die **einzige** Ableitung der Abrufstufe
  (ADR 0008). Fach 7 = Freitext. **Nichts davon ist persistiert** — wer eine Stufe speichert,
  bricht ADR 0008 **und** ADR 0002.
- `checkAnswer(input, target, corpus)` in `src/data/answer-check.ts` **braucht den Korpus**. Ohne ihn
  misst sie nur gegen das Ziel und winkt fremde Muskeln durch („mylohyoideus" als Tippfehler von
  „stylohyoideus"). Wer die Funktion wiederverwendet, gibt `getMuscles()` mit.
- **Die roemische Nummerierung im Namen ist kein Beiwerk:** `Mm. lumbricales I–IV` (Hand) und
  `Mm. lumbricales` (Fuss) sind **zwei Karten**. Wer sie beim Normalisieren wegkuerzt, verschmilzt sie.
- Tastatur-Kuerzel in der Sitzung (`F`, `Space`, `1/2/3`) haengen am `window` und ignorieren jetzt
  Eingaben aus `<input>`. Wer ein weiteres Feld in die Sitzung baut, verlaesst sich darauf.

Was fuer Etappe 8 schon entschieden ist:
- **8f** darf Renderings aus der eigenen 3D-App nutzen — **aber erst nach der Pruefung**, dass dort
  ausschliesslich BodyParts3D-Geometrie steckt (E5). Ohne bestandene Pruefung: Platzhalter.

**Zwei Fallen (am Code verifiziert, im Produktplan falsch beschrieben):**
- Die Daten fuer **8b** liegen NICHT in `useQuizStore` (nur Aggregate je Serien-Key), sondern in der
  Karte: `totalWrong`, `lastSeen` (`useProgressStore`).
- **`src/data/generated/` wird von `npm run migrate:data` ueberschrieben.** Redaktionelle Texte
  (**8d** Etymologie, spaeter 9d Palpation) muessen in eine eigene, handgepflegte Datei ausserhalb
  von `generated/`, die der Loader dazumischt.

**Etappe 7 ist komplett und gemergt** (Merge-Commit `4380bfe`, `--no-ff`).
- **7a:** `src/data/today.ts` liefert `getTodayPlan()` → getypter `TodayPlan` mit vier Zustaenden
  (`needsOnboarding` · `review` · `backlog` · `new`) — **kein Zustand ohne Vorschlag**. Priorisierung
  nach Verzug, Schwierig-Flag, Fach, Region-Schwaeche und Nachschlage-Haeufigkeit; Tagesdosis
  gedeckelt (Default 20, max 40 bei nahem Pruefungstermin). `lookupCounts` ist im Parametertyp schon
  vorgesehen — den Store dazu baut 7d.
- **7b:** Route `/heute` (`TodayPage` + `useTodayPlan`), `/` leitet dorthin. Navigation auf vier
  Absichten (Heute · Suche · Lernen · Fortschritt); **Karteikasten und Quiz haben keinen Tab mehr,
  bleiben aber verlinkt** (Karteikasten unter Fortschritt, Quiz unter Lernen) und deep-linkbar.
  Der Primaerbutton uebergibt die **vorpriorisierte Auswahl** an `/lernkarten`
  (`SessionOptions.names` + `readSessionHandoff`) — die Sitzung startet ohne Setup-Screen.
  Verifiziert: axe 0 Verstoesse auf `/heute` (Light+Dark, beide Zustaende), Deep-Link-Reload auf
  allen 7 Routen, End-to-End-Klick „Los" → laufende Sitzung.
- **7c:** Onboarding (2 Fragen) auf `/heute` beim Erststart + `src/data/seeding.ts`
  (`seedDeck(profession)` → 20 Karten, berufsgewichtet, leichte zuerst). Neuer Store
  `useProfileStore` (`mf.profile`: Beruf + Pruefungstermin) — **neben** dem Backup, nicht darin;
  ADR 0002 bleibt unangetastet. Neue Route `/start` (Profil aendern, aus Fortschritt verlinkt).
  Der Pruefungstermin speist die Tagesdosis. Verifiziert: axe 0 Verstoesse auf beiden
  Onboarding-Screens (Light+Dark), kalter Erststart → erste bewertete Karte nach 2 Klicks.
  **Wichtig fuer alle Folge-Tasks:** `nameLatin` ist NICHT eindeutig — 5 Namen gibt es zweimal
  (Hand/Fuss). Karten schluesseln nach `nameLatin` (ADR 0002 §2), also sind das je EINE Karte.
  Wer Namenslisten baut (Seeding, Sessions, Vorschlaege), muss deduplizieren.
- **7d:** Suchfeld in der Kopfzeile **jeder** Route (`HeaderSearch`, eigene `search`-Landmark).
  Neuer `useLookupStore` (`mf.lookups`) zaehlt Detailseiten-Aufrufe je `nameLatin`; `/heute` zeigt
  daraus „Zuletzt nachgeschlagen = noch nicht gewusst" mit **einem** Button „Alle N als Karten
  lernen" — der Kasten fuellt sich ohne die Verwaltungsseite (Bruecke B1). Aufnahme in den Kasten
  loescht den Zaehler. **Backup additiv erweitert:** neue OPTIONALE Sektion `lookups`; sie fehlt in
  der Datei, solange nichts nachgeschlagen wurde, Version bleibt 2, V1-Round-Trip gruen.
  **Architektur-Aenderung:** Die Lernsitzung liegt jetzt in `src/store/useSessionStore.ts` statt in
  `useState` der `FlashcardsPage` — sonst haette der Griff zur Kopfzeilen-Suche die laufende Sitzung
  zerstoert (Unmount). `useFlashcardSession` ist nur noch die Sicht darauf; sie ueberlebt Navigation,
  bewusst NICHT den Browser-Neustart.
- **7e:** Falschantworten erklaeren sich (`src/data/explain.ts`): ein Kontrastsatz, **komponiert**
  aus den Daten beider Muskeln, kontrastiert genau das gefragte Merkmal — null Redaktionsarbeit,
  alle Modi getestet, saubere Degradation bei fehlenden Feldern. `src/data/confusions.ts` haelt
  **7 handgeschriebene Saetze** fuer klassische Pruefungsfallen; sie ersetzen das Template und sind
  beliebig erweiterbar (nie ein Blocker). **Bruecke B2:** `ExplainSheet` legt beide Muskeln
  nebeneinander **ueber** die Session (Sheet, kein `navigate()`), Schliessen fuehrt in dieselbe
  Frage zurueck. **Quiz-Datenmodell additiv erweitert:** `QuizQuestion.muscleId`/`.concreteMode`
  und `QuizOption.muscleId` — die Auswertung, `quizSeriesKey` und die Statistik sind unberuehrt
  (ADR 0002).

## Entscheidungen — alle getroffen (2026-07-12)
**Etappe 9 ist damit nicht mehr blockiert.** Volltext + Begruendungen: `docs/produkt-plan.md`.
- **E1 (Pruefungsform):** gemischt (schriftlich *und* muendlich/praktisch) — **trainiert wird aber
  der freie Abruf**, MC nur als Einstiegsstufe fuer frische Karten. Macht die Freitext-Stufe (8a)
  zur Pflicht, bestaetigt ADR 0008.
- **E2 (Funktionelle Gruppen):** ja, aber **~12–15 kuratierte Gruppen**, automatisch aus den
  vorhandenen Feldern vorannotiert, vom Projektinhaber nur geprueft. Kein 30×150-Handbetrieb.
- **E3 (Palpation):** optionales Feld anlegen, **inkrementell** fuellen; Sektion erscheint nur, wo
  etwas steht. Kein Blocker.
- **E4 (Empfehler):** adaptiv (bereits in 7a umgesetzt).
- **E5 (3D-Renderings fuer die 47 bildlosen Muskeln):** erlaubt, **sofern BodyParts3D-basiert**
  (CC BY 4.0, Attribution mitfuehren). **Vor Uebernahme pruefen**, dass in der 3D-App wirklich nur
  BodyParts3D-Geometrie steckt — sonst typografischer Platzhalter.
- **Lernprofil im Backup:** ja, additiv nachgezogen (Branch `feat/profil-im-backup`).

Offen (nur durch dich):
- Bei oeffentlichem Deploy: `git remote add origin …` + Push (kein Remote konfiguriert).
- **Merge:** Etappe 7 wird **am Stueck** gemergt, wenn 7e + 7f fertig sind (so entschieden).
  Branch-Kette: 7a → 7b → 7c → 7d → `feat/profil-im-backup`.

## Vorheriger Stand (Etappe 5+6)
Etappe 5+6 abgeschlossen, `v1.0` lokal getaggt. **Laufend: Branch `feat/design-feinschliff`** —
UX-/Design-Review der fertigen App (Playwright-Durchklick aller Routen, Light+Dark, Desktop+Mobil).
Behoben: Emoji-Tofu-Glyphen → Sprite-Icons (neues `icFlag`), Lernkarten-Rueckseite ohne
Muskelnamen, leeres „Segmente"-Feld (48/150), Etappe-0-Jargon auf der 404-Seite, doppeltes
Such-Clear-Kreuz, orange wirkende Disabled-Buttons, abgeschnittene Namen im Karteikasten,
Farb-only-Quizfeedback (WCAG 1.4.1), `.chip--active`-Kontrast 4.47:1 (neuer Token
`--accent-on-tint`). Neu: `EmptyState`-Primitive mit CTA, Filter-Sheet-Abschlussleiste.
Offen — nur noch durch dich:
- Merge `feat/design-feinschliff` → `main`.
- Bei oeffentlichem Deploy: `git remote add origin …` + Push (kein Remote konfiguriert).
- Optional: Impressum, eigene Domain/CNAME.
Werkzeuge lokal: Playwright+Chromium+axe-core (visuelle/A11y-Verifikation, Preview Port 4319).
Task-Briefing: `docs/tasks/2026-07-09-etappe-5-haertung.md`.

Anschluss-Hinweis: Stores schluesseln Karten nach **Kartenschluessel** (`cardKey`, ADR 0012 —
fuer 147 von 150 Muskeln identisch mit `nameLatin`); die UI loest ihn ueber die Datenschicht
(`getMuscleByCardKey`) auf (ADR 0002 §2 / ADR 0006 §3). Such-/Filter-Logik,
Quiz-Generierung und Statistik liegen getestet in `src/data/` — Etappe 4 aendert nur Darstellung.

## Agenten-Regel
Nach jedem abgeschlossenen Task diese Datei aktualisieren, wenn sich Status, Gate, Datenstand,
naechster Schritt oder eine harte Entscheidung aendert. CHANGELOG.md bleibt zusaetzlich Pflicht.
