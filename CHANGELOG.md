# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier festgehalten.
Format nach [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
Versionierung nach [Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

### Added
- **Etappe 9a — Funktionelle Gruppen + Gruppen-Quiz** (`src/data/groups.ts`,
  `src/data/editorial/groups.json`, `/gruppe/:id`): Geprüft wird in **Zusammenhängen**, nicht Muskel
  für Muskel. **15 kuratierte Gruppen** (Rotatorenmanschette, Ischiocrurale, Quadriceps,
  Adduktorengruppe, Hypothenar, autochthone Rückenmuskulatur medial/lateral, Kaumuskulatur,
  supra-/infrahyoidal, Mimik …) decken **64 der 150 Muskeln** ab — wer in keine Gruppe gehört, gehört
  in keine, und das ist kein Fehler. Gruppen sind eine **Many-to-Many-Dimension, keine Partition**:
  Sie liegen *innerhalb* von Subregionen (Rotatorenmanschette ⊂ Schultergürtel), und ein Muskel kann
  in mehreren stecken.
  Der Vorschlag wurde **generiert** (`scripts/propose-groups.mjs` liest die 126 V1-Tags und schreibt
  einen Prüfbericht), die Wahrheit **kuratiert** — das Skript schreibt `groups.json` **nie** selbst.
  **Die Validierung hat Zähne:** Ein Muskelname, den es nicht gibt (Tippfehler), lässt den Test
  **scheitern**, statt die Gruppe still zu verkleinern — eine unvollständige Rotatorenmanschette wäre
  schlimmer als gar keine.
  **Neuer Quizmodus** „Welcher Muskel gehört NICHT zur Gruppe …?" — der Fremde kommt aus **derselben
  Region**, sonst wäre die Frage geschenkt. Der **V1-Serien-Schlüssel bleibt bitgleich**; der neue
  Modus erzeugt einen *zusätzlichen* Key (ADR 0002, Regressionstest).
  Die Gruppe ist auf der Detailseite verlinkt und führt zu einer Gruppenseite, die die fehlenden
  Karten anlegt **und** sofort damit übt (kein CTA ins Leere — Regel aus 8c).
  ⚠️ Die Daten liegen unter `src/data/editorial/` und **nicht** unter `generated/` (das überschreibt
  `npm run migrate:data`). Ein Test wacht darüber.

## [1.1.0] — 2026-07-13

**Vom Nachschlagewerk zum Lernbegleiter.** V1.0 konnte alles nachschlagen — aber sie öffnete auf einer
Liste mit 150 Muskeln, der Karteikasten musste von Hand gefüllt werden, und die Statistik zeigte
Zahlen ohne Empfehlung. Etappe 7 gibt der App eine **Meinung**, Etappe 8 macht sie **prüfungsnah**.

### Added
- **Etappe 8d — Den Namen lesen lernen** (`src/data/etymology.ts`,
  `src/data/editorial/etymology.json`): Der lateinische Name **ist** die Funktion — man muss ihn nur
  lesen können. „M. flexor digitorum longus" → *flexor = Beuger · digitorum = der Finger bzw. der
  Zehen · longus = lang*. Wer die Bausteine versteht, muss nicht 150 Namen auswendig lernen.
  Die Herleitung wird **komponiert, nicht redigiert** (dasselbe Prinzip wie die Erklärsätze aus 7e):
  ein handgepflegtes **Lexikon von ~110 Wortbausteinen**, aus dem der Loader je Muskel die Herleitung
  zusammensetzt. **Alle 150 Muskeln** haben damit eine Herleitung — ohne 150 Texte zu schreiben.
  Ein Wort, das nicht im Lexikon steht, fällt weg: Die Herleitung wird kürzer, **nie falsch**.
  Angezeigt im **„Einfach"-Niveau**; im „Fachlich"-Niveau bleibt sie aus dem Weg.
  ⚠️ Die Daten liegen unter `src/data/editorial/` und **nicht** unter `src/data/generated/` — den
  Ordner erzeugt `npm run migrate:data` neu und würde jeden redaktionellen Text mitnehmen. Ein Test
  wacht darüber; die Migration wurde real ausgeführt, die Herleitungen haben sie überlebt.
  **Merksätze bleiben leer** — sie sind vorbereitet, aber keiner ist erfunden: Ein falscher Merksatz
  wird auswendig gelernt und ist schlimmer als keiner. Sie schreibt der Fachmann.
- **Etappe 8f (Stufe 1 + 2b) — Die 47 bildlosen Muskeln sehen absichtlich aus**
  (`MusclePlaceholder`, [Prüfprotokoll](docs/3d-app-lizenzpruefung.md)): **Stufe 1 war eine
  Lizenzprüfung, kein Code** — und sie ist **bestanden**. Nachgesehen wurde die Substanz, nicht die
  Behauptung: **alle 3 772** ausgelieferten Modelldateien der eigenen 3D-App folgen dem
  BodyParts3D-Schema `FJ<Nummer>.glb`, **alle 789** Bundle-Einträge sind BodyParts3D-Teile, **kein**
  Modell enthält eingebettete Texturen, und die Suche nach kommerziellen Modellquellen (Zygote,
  TurboSquid, Sketchfab, Visible Body …) liefert **null Treffer**. Renderings daraus wären CC BY 4.0.
  **Umgesetzt ist trotzdem der Platzhalter (Stufe 2b)** — für alle 47: ein gesetzter,
  typografischer Platz mit Name, Region und Subregion, ehrlich beschriftet („Für diesen Muskel liegt
  kein lizenzfreies Bild vor."), **nur Tokens, kein Fremd-Asset**. Ein Platzhalter ist **kein Bild**
  und bleibt aus den Bildquiz-Modi draußen (Regressionstest über alle drei Modi und alle 150 Muskeln).
- **Etappe 8e — Eigene Notizen je Muskel** (`useNotesStore`, `MuscleNote`): Was die Dozentin im
  Unterricht sagt, steht in keinem Datensatz — es gehoert dorthin, wo der Muskel steht, nicht in eine
  fremde App. Freitext je Muskel, direkt auf der Detailseite, **ohne „Speichern"-Knopf** (debounced)
  und trotzdem **verlustfrei**: Wer mitten im Tippen wegnavigiert, verliert nichts (die Aufraeumfunktion
  schreibt den letzten Stand weg — eine Notiz, die beim Wegblaettern verschwindet, ist schlimmer als
  gar keine). **Leere Notiz = keine Notiz** (kein leerer Eintrag im Backup). Die Notiz haengt am
  **Muskel** (`nameLatin`, ADR 0002 §2), nicht an der Karte — sie ueberlebt, wenn eine Karte aus dem
  Kasten fliegt. Persistenz **additiv** (die vierte Sektion nach `lookups`/`profile`/`streak`):
  optionale Backup-Sektion `notes`, die nur geschrieben wird, wenn es Notizen gibt; ein **altes Backup
  ohne die Sektion loescht die lokalen Notizen nicht**; eine kaputte Sektion kippt den Import nicht;
  ueberlange Texte werden gedeckelt (2000 Zeichen), damit eine handgeschriebene Datei den Speicher
  nicht sprengt. Backup-Version bleibt **2**, der V1-Round-Trip gruen.
- **Etappe 8b — Session-Filter „nur falsch beantwortete" / „nie gesehen"** (`src/data/card-filter.ts`):
  Gezielt an den Lücken üben statt am ganzen Deck. Drei Filter — falsch beantwortet
  (`totalWrong > 0`), nie gesehen (`lastSeen === null`), schwierig markiert. **Es wird nichts Neues
  gespeichert:** Alles stand längst in der Karte (der Produktplan verwies auf `useQuizStore` — der
  hält aber nur Aggregate je Serien-Key und weiß nichts über einzelne Muskeln). `SessionOptions` ist
  **additiv** um `filter` erweitert; `applyCardFilter` **nimmt Karten weg, ohne umzusortieren**, damit
  die Vorpriorisierung aus 7a/7b überlebt. **Ein Filter grenzt die fälligen Karten ein — er hebt die
  Fälligkeit nicht auf:** Die Leitner-Box bleibt die einzige Wahrheit über den Zeitpunkt, sonst gäbe
  es zwei Terminpläne. Die Zahl im Setup-Screen ist **exakt** die Warteschlange, mit der die Sitzung
  startet (sie kommt aus `buildQueue` selbst, wird nicht nebenher nachgezählt). Greift ein Filter ins
  Leere, gibt es **keinen leeren Screen**, sondern einen Leerzustand, der den Grund nennt und den
  Ausweg anbietet („Filter aufheben" / „Alle Bereiche zeigen" / „Neue Muskeln hinzufügen").
  Der **Quiz-Serien-Schlüssel bleibt unangetastet** (Regressionstest gegen ADR 0002).
- **Etappe 8c — Statistik wird handlungsfähig (Brücke B4)** (`src/data/practice.ts`, `PracticeCta`):
  **Keine Zahl ohne Knopf.** Die Statistik wusste seit Etappe 3, dass die untere Extremität bei 33 %
  steht — und sagte es, ohne zu helfen. Jetzt hat **jeder** Block, der eine Schwäche ausweist, genau
  eine Aktion daneben: „Die schwachen Karten üben" (Fach 1–2), „Untere Extremität üben" (die
  schwächste Region **mit** fälligen Karten), „Innervation üben" (der schwächste Quizmodus, ab zwei
  gespielten Modi) und „Die Karten kurz vor dem Ziel üben" (die Karten, die dem nächsten Meilenstein
  am nächsten stehen — **höchstes Fach zuerst**). Die Auswahl dahinter sind **reine Selektoren** in
  `src/data/practice.ts`, die **dieselbe** Priorisierung nutzen wie der Tagesplan
  (`prioritizeDueCards`, aus `today.ts` herausgezogen) — es gibt keine zweite Reihenfolge. **Kein CTA
  greift ins Leere:** Jeder Selektor liefert nur **fällige** Karten (sonst startete der Knopf eine
  leere Sitzung), und wenn es nichts zu tun gibt, ist der Knopf deaktiviert und **nennt den Grund**
  („Dazu liegt keine Karte im Kasten" / „Heute nichts fällig" / „Hier ist nichts zu verbessern") —
  nüchtern, nie anklagend. Der Sprung in die Sitzung nutzt die Übergabe aus 7b; der Sprung ins Quiz
  bekommt dasselbe **validierte** Muster (`readQuizHandoff`), das den V1-Serien-Schlüssel
  **unangetastet** lässt (ADR 0002).
- **Etappe 8a — Abrufleiter + Freitext-Stufe** (`src/data/recall.ts`, `src/data/answer-check.ts`,
  `TypeCard`): **Wiedererkennen ist nicht Können.** Die Abrufhärte wächst jetzt mit der Beherrschung:
  Ab **Fach 7** steht keine Auswahl mehr daneben — die Karte zeigt Funktion, Innervation, Ursprung und
  Ansatz, und der Name muss **getippt** werden. Die Stufe wird aus der Leitner-Box **abgeleitet**
  (`recallStage`, ADR 0008), **nichts Neues wird gespeichert**; ein importiertes V1-Backup bekommt die
  Leiter automatisch. Die Prüfung ist **tolerant, aber nicht nachlässig**: Groß/Klein, Diakritika,
  `M.`/`Mm.`/`Musculus`, Binde- und Gedankenstriche, „Pars"/„Caput" und Klammer-Synonyme
  (`M. fibularis longus` = `M. peroneus longus`) werden normalisiert, ein Tippfehler zählt als richtig
  und wird **sichtbar korrigiert** („Fast — richtig geschrieben: …"). **Bedeutungsfehler nie:**
  `longus`≠`brevis`, `major`≠`minor`, `abductor`≠`adductor` (Levenshtein-Abstand **1**!),
  `medialis`≠`lateralis`, `superficialis`≠`profundus` u. a. — 15 Dimensionen, die den Vergleich hart
  scheitern lassen, bevor irgendeine Toleranz greift. Zusätzlich misst die Prüfung gegen den **ganzen
  Namensraum**: Eine Antwort, die genauso gut auf einen **anderen** Muskel passt, ist mehrdeutig und
  damit falsch (am Zungenbein liegen sieben Namen im Abstand von zwei Zeichen). Belegt durch einen
  **Kreuztest über alle 150 Muskeln**: jeder unter seinem eigenen Namen `correct`, **kein einziger**
  fremder Name kommt durch. Ein Freitext-Fehler ist eine **normale Leitner-Rückstufung** (7 → 6), keine
  Extra-Strafe. Bedienbar allein mit der Tastatur (Enter prüft, Enter geht weiter); die zehn Quizmodi
  bleiben als **„Freies Üben"** erhalten.
- **Etappe 7f — Tages-Streak mit Freeze** (`src/persistence/streak.ts`, `useStreakStore`): Ein Grund
  wiederzukommen, **ohne Schuld-Mechanik**. Der Streak zählt aufeinanderfolgende Tage mit erledigter
  Tagesdosis (dieselbe Dosis, die der Tagesplan vorschlägt — ein naher Prüfungstermin hebt sie).
  **Der Freeze wird verdient, nicht gekauft:** das Doppelte der Tagesdosis an einem Tag bringt einen
  Freeze aufs Konto (max. 2, einer pro Tag). Bei einem Fehltag wird er beim nächsten Öffnen
  **automatisch eingelöst** — ohne Nachfrage. Reißt die Serie doch, lautet die Botschaft „Neue
  Serie — weiter geht's", nie „du hast X verloren"; die Bestmarke und die verdienten Freezes bleiben.
  Tagesgrenzen rechnen **lokal** (nicht UTC), Sommerzeit-fest, und eine zurückgedrehte Uhr kann den
  Streak weder aufblähen noch zerstören. Anzeige: eine nüchterne Zeile auf `/heute` („5 Tage in
  Folge · 1 Freeze") — kein Feuer, kein Konfetti, keine Animation, nie nur über Farbe. Persistenz
  **additiv**: optionale Backup-Sektion `streak`, die eine handgeschriebene Datei nicht aufblasen
  kann (Freezes gedeckelt, `best ≥ current`).
- **Etappe 7e — Falschantworten erklären sich + Brücke B2** (`src/data/explain.ts`,
  `confusions.ts`, `ExplainSheet`): Wer falsch liegt, sieht nicht mehr nur die Lösung, sondern
  **warum** — ein Kontrastsatz, der genau das Merkmal gegenüberstellt, nach dem gefragt war
  („N. peroneus profundus versorgt M. tibialis anterior. M. rhomboideus minor wird von
  N. dorsalis scapulae versorgt."). Der Satz wird **komponiert**, nicht redigiert: null
  Redaktionsarbeit für den Massenfall, getestet über **alle** Quizmodi inkl. sauberer Degradation
  bei fehlenden Feldern. Für die klassischen Prüfungsfallen (Supra-/Infraspinatus, Teres
  major/minor, Pronatoren, Glutei …) liegen **7 handgeschriebene Sätze** in `confusions.ts`, die
  das Template ersetzen — die Liste ist erweiterbar und nie ein Blocker. **Brücke B2:** „Beide
  vergleichen" öffnet ein `Sheet` **über** der laufenden Session mit beiden Muskeln nebeneinander
  (Bild, Funktion, Ursprung, Ansatz, Innervation; die gefragte Zeile hervorgehoben) — Schließen
  führt in dieselbe Frage zurück, der Quiz-Zustand wird nie angefasst. Kein `navigate()`, denn wer
  eine Session verlässt, kommt nicht zurück.
- **Lernprofil im Backup** (Entscheidung 2026-07-12): Beruf und Prüfungstermin liegen jetzt auch im
  Backup — als **additive, optionale** Sektion `profile`, nach demselben Muster wie `lookups`. Sie
  fehlt in der Datei, solange kein Profil gesetzt ist; ältere Versionen ignorieren den Schlüssel;
  Backup-Version bleibt 2; V1-Round-Trip grün. Grund: Der Prüfungstermin steuert die Tagesdosis —
  ein Gerätewechsel soll ihn nicht verlieren. Ein unbekannter Beruf wird beim Import verworfen statt
  durchgereicht.
- **Etappe 7d — Suchfeld überall + Brücke B1 „nachgeschlagen = noch nicht gewusst"**: Das Suchfeld
  sitzt jetzt in der **Kopfzeile jeder Route** (eigene `search`-Landmark, tastaturerreichbar mit
  sichtbarem Fokus-Ring) — der neue Einstieg macht das Nachschlagen nicht teurer. Neuer
  `useLookupStore` zählt Detailseiten-Aufrufe je `nameLatin`; auf `/heute` erscheint daraus die
  Sektion **„Zuletzt nachgeschlagen — *= noch nicht gewusst*"** (häufigste zuerst, mit Zähler und
  Region) samt **einem** Button „Alle N als Karten lernen". Damit füllt sich der Karteikasten durch
  normale Benutzung — im Test wie im Browser nachgewiesen, **ohne dass `/karteikasten` je geöffnet
  wurde**. Wer im Kasten liegt, wird nicht mehr vorgeschlagen; wer aufgenommen wird, verliert seinen
  Zähler (er ist keine Lücke mehr). Mehrfach Nachgeschlagenes wird in der Empfehlung aus 7a höher
  priorisiert. Persistenz **additiv**: neue, optionale Backup-Sektion `lookups` — sie fehlt in der
  Datei, solange nichts nachgeschlagen wurde, ältere Versionen ignorieren den Schlüssel, die
  Backup-Version bleibt 2 und der Round-Trip gegen die V1-Fixtures grün.
- **Etappe 7c — Onboarding in zwei Fragen + Auto-Seeding** (`src/data/seeding.ts`,
  `components/features/onboarding/`): Der leere Karteikasten verschwindet als Problem. Beim
  Erststart fragt `/heute` **„Was lernst du?"** (Physio · Ergo · Logo — die Wahl *ist* die Handlung,
  kein „Weiter" dahinter) und **„Wann ist deine Prüfung?"** (Datum, überspringbar). Daraus legt
  `seedDeck()` ein **Startdeck von 20 Karten** an — berufsgewichtet (Logo → Kopf/Hals inkl. Kau-,
  Zungenbein- und Kehlkopfmuskulatur; Ergo → obere Extremität, Hand & Finger zuerst; Physio →
  Extremitäten + Rumpf), innerhalb der Region die leichten Muskeln zuerst — und führt **direkt in
  die erste Sitzung**, ohne Bestätigungsseite. Live gemessen: erste bewertete Karte nach zwei
  Klicks. Das Prüfungsdatum speist die Tagesdosis aus 7a (näher = größer). Profil (Beruf, Termin)
  liegt in einem eigenen Store `mf.profile` — **neben** dem Backup-Format, nicht darin: das
  eingefrorene V1-Format (ADR 0002 §1) bleibt unangetastet, der Round-Trip-Test gegen die
  V1-Fixtures grün. Neue Route `/start` macht das Profil aus *Fortschritt* heraus änderbar.
- **Etappe 7b — Route `/heute` + Navigation nach Absichten** (ADR 0007): Die App öffnet nicht mehr
  auf einer Liste mit 150 Muskeln, sondern auf **einem Vorschlag**. Neue `TodayPage` mit
  Diagnosezeile („5 Karten fällig · 2 davon Obere Extremität — deine schwächste Region · ca. 2 Min"),
  **genau einem Primärbutton** je Zustand, ruhigen Sekundär-Aktionen (Quiz · Karteikasten ·
  Nachschlagen) und klein gehaltenem Fortschritt. Der Button startet die Sitzung **mit genau den
  Karten aus dem Tagesplan, in dessen Reihenfolge** (`SessionOptions.names`, validiert per
  `readSessionHandoff`) — kein Umweg über den Setup-Screen. Im Zustand „nichts fällig" legt er die
  vorgeschlagenen neuen Muskeln an und lernt sie sofort; bei leerem Kasten führt er in den
  Karteikasten (das Onboarding baut 7c). Die Formulierung entsteht im UI, die Datenschicht liefert
  weiterhin nur Zahlen und Codes.
- **Etappe 7a — Empfehlungs-Engine** (`src/data/today.ts`): `getTodayPlan()` beantwortet als reine
  Funktion, was heute dran ist, und gibt einen getypten `TodayPlan` zurück — Zahlen und Codes, keine
  Sätze (die Formulierung gehört ins UI, 7b). **Kein Zustand ohne Vorschlag:** leerer Kasten →
  `needsOnboarding` *mit* Startvorschlägen, nichts fällig → `new` (neue Muskeln aus dem Pfad),
  Überfällig-Stau → `backlog` auf eine verdaubare Tagesdosis gedeckelt (die volle Zahl bleibt als
  `dueTotal` sichtbar), sonst `review`. Fällige Karten werden priorisiert nach Verzug, Schwierig-Flag,
  niedrigem Fach, Schwäche der Region (aus `stats.ts`) und Nachschlage-Häufigkeit; die Tagesdosis
  wächst bei nahem Prüfungstermin (Deckel 40). Der Parametertyp sieht `lookupCounts` bereits vor —
  den Store dazu baut 7d, sein Fehlen ist kein Fehler. Leitner-Fälligkeit und Backup-Format bleiben
  unangetastet (ADR 0002). 15 neue Tests, gesamt 185.
- **Produktplan für Etappen 7–9** (`docs/produkt-plan.md`): der Weg vom Nachschlagewerk zum Coach,
  mit **Statustafel** (jeder Schritt 7a–9d: offen/laufend/fertig/blockiert), den vier Brücken
  zwischen Suche und Lernen, Abhängigkeitsgraph und den fünf offenen Entscheidungen (E1–E5), die
  nur der Projektinhaber treffen kann. ROADMAP.md um „Teil 2 — Produkt“ erweitert.
- **ADR 0007** — Einstiegsroute `/heute`; die Navigation benennt künftig Absichten
  (Heute · Suche · Lernen · Fortschritt) statt sechs gleichrangiger Werkzeuge. `/karteikasten`
  bleibt als Route erhalten, damit Deep-Links nicht brechen.
- **ADR 0008** — die Abrufstufe (MC → Bildzuordnung → freier Abruf → Freitext) wird aus der
  Leitner-Box *abgeleitet* statt gespeichert. Kein neuer persistierter Key, ADR 0002 unangetastet.
- **Task-Briefings für die komplette Etappe 7** (7a–7f) plus ein **Rahmen-Briefing**
  (`docs/tasks/2026-07-12-etappe-7-uebersicht.md`), das jeder Agent vor jedem Task liest: das
  Problem, der Nordstern („beim Öffnen genau ein Vorschlag“), der Abhängigkeitsgraph, die acht
  Invarianten (kein Zustand ohne Primärbutton · Persistenz nur additiv · UI rendert nur · kein
  Timer im normalen Lernen …) und die Nicht-Ziele der gesamten Etappe. Aus der Statustafel führt
  je Schritt ein Link direkt ins Briefing.

### Fixed
- **Kontrast des „Beste Quote"-Abzeichens** (axe `color-contrast`, serious): Es stand mit
  `--accent-on-surface` auf getönter Fläche und kam damit auf **4,47:1** — knapp unter AA. Genau
  dafür gibt es `--accent-on-tint`; diese eine Stelle war übersehen worden. Der Fehler war nie
  aufgefallen, weil das Abzeichen erst ab **zwei** gespielten Quizmodi überhaupt erscheint
  (gefunden bei der axe-Prüfung zu 8c).
- **Grammatik im Erklärsatz** (7e): Plural-Muskeln („Mm. lumbricales I–IV") bekommen ein
  Plural-Verb — vorher stand dort „Mm. lumbricales I–IV **wird** von … versorgt".
- **Sheet-Inhalt war per Tastatur nicht erreichbar** (axe `scrollable-region-focusable`, serious):
  Der scrollbare Sheet-Body ist jetzt fokussierbar und zeigt seinen Fokus. Betraf alle Sheets, nicht
  nur das neue — wer nicht mausen kann, kam an den unteren Teil des Inhalts nicht heran.
- **Namensdubletten im Startdeck** (7c): Fünf lateinische Namen gibt es zweimal (Hand *und* Fuß,
  z. B. `M. flexor digiti minimi brevis`). Da Karten nach `nameLatin` geschlüsselt sind (ADR 0002 §2),
  sind zwei solche Muskeln **eine** Karte — ohne Sperre wären aus 20 versprochenen Karten stillschweigend
  19 geworden. `seedDeck` dedupliziert jetzt beim Ziehen und füllt nach.

### Changed
- **Die Lernsitzung liegt jetzt zentral** (`src/store/useSessionStore.ts`, 7d) statt in
  `useState` der `FlashcardsPage`. Grund: Mit dem Suchfeld in der Kopfzeile verlässt man mitten in
  der Sitzung die Route — lag der Zustand in der Komponente, war die Sitzung mit dem Unmount weg.
  Sie übersteht die Navigation jetzt (Nachschlagen kostet keine Sitzung mehr), **nicht** aber einen
  Browser-Neustart; das ist Absicht, die Bewertungen selbst liegen ohnehin nach jeder Karte im
  Fortschritts-Store. `useFlashcardSession` ist nur noch die abgeleitete Sicht darauf.
- **Navigation auf vier Absichten** (7b): Heute · Suche · Lernen · Fortschritt — statt sechs
  gleichrangiger Werkzeuge. **Karteikasten und Quiz verlieren nur den Tab-Rang, nicht die
  Erreichbarkeit:** der Karteikasten hängt jetzt sichtbar unter *Fortschritt*, das Quiz unter
  *Lernen*; beide Routen bleiben deep-linkbar (Reload auf allen Routen live geprüft). `/` leitet
  auf `/heute` statt auf `/suche`.
- **Statistik entdoppelt:** Level und XP standen dreifach auf einem Screen (Kachel, Ring, Text).
  Die Kachelreihe zeigt jetzt vier *verschiedene* Kennzahlen (Karten im Kasten, Gemeistert,
  Quiz-Trefferquote, Quiz-Runden); Level/XP haben ihren Platz in der Level-Karte.
  Kaputte Ziel-Copy („Noch **1** bis **1** gemeisterten Karten") korrigiert.
- **Toast** auf dem Desktop nach unten **rechts** (unten-mittig legte er sich über den Inhalt);
  mobil weiterhin mittig über der Tab-Leiste.
- **Quiz-Kopfzeile** verständlicher: „Serie 0 · 0 Pkt." → „0 Punkte · 0 in Folge richtig".
- **Such-Platzhalter** gekürzt („Muskel suchen …") — der lange Text war mobil abgeschnitten und
  wiederholte nur die Lead-Zeile darüber.
- **Schwierigkeits-Punkte** haben jetzt einen Tooltip; drei Punkte ohne Legende waren nicht deutbar.
- **Design-/Layout-Feinschliff (hochwertigeres Erscheinungsbild).**
  - **Rahmen-Fix:** Der Inhalt war auf dem Desktop links angeheftet (`margin-left` fix +
    `margin-right:auto`), sodass die halbe Bildschirmbreite tot rechts lag. Jetzt hält die Shell
    nur die Rail-Breite frei und der Inhalt **zentriert** sich mittig in der Restfläche.
  - **Kopf-Primitives global geladen:** `pages.css` wurde bislang nur von der Platzhalterseite
    importiert — dadurch waren `.page__eyebrow/__title/__body` auf allen echten Seiten wirkungslos.
    Jetzt global; Eyebrows in Versalien, Titel skalieren per `clamp()` (~27→34 px), Lesetexte
    (`.page__body`) auf ~70 Zeichen gedeckelt.
  - **Vertikale Balance:** Quiz-Auswahl und leere Zustände (Lernkarten) sitzen mittig im freien
    Raum statt oben angeheftet mit Leere darunter.
  - **Karten:** kräftigere Ruhe-Elevation + klarer Hover-Lift (Muskel- & Quiz-Karten).
  - **Toast** (Tagesbonus/XP) von oben-mittig nach **unten** verlegt (mobil über der Tab-Leiste).
  - Breiten sauber getrennt: Grids/Dashboards nutzen die volle Spalte, Rechtliches 780 px,
    Karteikasten-Verwaltung 940 px — jeweils zentriert.

### Added
- **`EmptyState`-Primitive** (`components/ui/EmptyState.tsx`): Icon, Überschrift, Erklärung und
  **eine primäre Handlung**. Ersetzt die bisherigen beiläufigen Textzeilen bei leerem Karteikasten
  (CTA „Muskeln hinzufügen"), 0 Suchtreffern (CTA „Filter zurücksetzen") und auf der 404-Seite
  (CTA „Zur Muskelsuche"). Ohne CTA ist ein Leerzustand eine Sackgasse — und der leere Karteikasten
  ist der Erstkontakt jedes neuen Nutzers mit dem Lernmodus.
- **Abschluss-Leiste im mobilen Filter-Sheet** (`Sheet`-Prop `footer`): „Zurücksetzen" +
  „N Ergebnisse anzeigen". Vorher gab es nur ein ✕ — die Wirkung der Filter war unsichtbar.
- **Token `--accent-on-tint`** für Text auf getönter Akzentfläche.

### Changed
- **3D-Verlinkung zeigt auf die neue 3D-App (V2).** Der „In 3D ansehen"-Link ging auf
  `/3DAnatomy/` (V1) — und **die lädt three.js zur Laufzeit von `cdn.jsdelivr.net`** nach. Jeder
  Klick schickte damit die IP unserer Nutzer an ein fremdes CDN, also genau der externe Abruf, den
  die Architektur-Grenze ausschließt. V2 (`/3DAnatomyV2/`) bündelt three.js lokal, setzt
  `default-src 'self'` und macht **keinen einzigen** externen Request. Deep-Link-Vertrag
  (`muscleKey`/`muscle`/`source`/`returnTo`) und Muskel-Mapping sind identisch (beide 118 Keys,
  diffed). End-to-End verifiziert: Deep-Link hebt den Muskel hervor, „Zurück zum Muskelfinder"
  funktioniert, null externe Hosts.
- **Schriftdateien aus der Schwester-App `3DAnatomy 2.0` übernommen** (byte-identisch). Es ist
  dieselbe Schrift in derselben Version (Sora 2.000, Manrope 4.504) — die Darstellung ändert sich
  **nicht**. Der Gewinn ist eine gemeinsame Quelle: beide Apps sind gegenseitig verlinkt („In 3D
  ansehen"), und identische Dateien schließen aus, dass die Typografie auseinanderläuft. Nebeneffekt:
  Subset `latin-ext` statt `latin` (355 statt 223 Zeichen, +41 KB). Für Deutsch war `latin` bereits
  vollständig — es fehlte kein Zeichen.

### Fixed
- **Grammatik im Erklärsatz** (7e): Plural-Muskeln („Mm. lumbricales I–IV") bekommen ein
  Plural-Verb — vorher stand dort „Mm. lumbricales I–IV **wird** von … versorgt".
- **Sheet-Inhalt war per Tastatur nicht erreichbar** (axe `scrollable-region-focusable`, serious):
  Der scrollbare Sheet-Body ist jetzt fokussierbar und zeigt seinen Fokus. Betraf alle Sheets, nicht
  nur das neue — wer nicht mausen kann, kam an den unteren Teil des Inhalts nicht heran.
- **14 Muskeln bekamen keinen 3D-Button, obwohl die 3D-App sie kennt.** `buildMuscleKey` strippte
  nur das Präfix „M.", nicht den Plural „Mm." — „Mm. lumbricales I–IV" erzeugte den Key
  `m_mm_lumbricales_i_iv` und traf damit keinen Mapping-Eintrag. Jetzt `mm?\.` (plus „Musculi").
  **Muskeln mit 3D-Link: 111 → 121**; von den 118 Mapping-Keys finden jetzt *alle* ihren Muskel
  (vorher 10 Waisen). Test läuft über den gesamten Datenbestand gegen das Mapping.
- **Schriften fehlten auf der Lizenzseite.** Sora und Manrope sind Fremd-Assets (SIL OFL 1.1) und
  gehören nach CLAUDE.md sichtbar attribuiert — `/quellen` hat jetzt einen Abschnitt „Schriften".
- **App-Icons zeigten nicht das Markenlogo.** Favicon, Apple-Touch-Icon und alle PWA-Icons waren ein
  handgezeichneter Platzhalter (kantiges „A" mit gerader Balken-Leiste) und hatten mit der Wortmarke
  nichts zu tun — sichtbar im Browser-Tab und auf dem Homescreen. Jetzt aus dem echten Logo erzeugt
  (`public/logo/af-logo.png`, weißes „A" mit orangem Schwung) auf der Marken-Kachel #1c1b18:
  `favicon-32.png`, `apple-touch-icon.png` (180, ohne Alpha — iOS mag keins), `pwa-192/512` sowie
  ein randloses `pwa-maskable-512` mit Logo in der 80-%-Sicherheitszone. Reproduzierbar über
  `scripts/generate-icons.py`. Das Platzhalter-`favicon.svg` ist entfernt (auch aus dem
  PWA-Precache, der es sonst weiter ausgeliefert hätte).
- **Lernkarten-Rückseite nannte den Muskelnamen nicht.** Nach dem Aufdecken standen dort nur die
  Fakten — welcher Muskel gemeint war, stand auf der weggedrehten Vorderseite. Damit ließ sich die
  eigene Antwort nicht gegen die Lösung prüfen, also genau das, wofür eine Lernkarte da ist.
- **Leeres Feld „Segmente" auf jeder dritten Lernkarte.** `segments` ist bei **48 von 150** Muskeln
  leer (V1-Datenstand), das Label wurde trotzdem gerendert. Leere Fakten fallen jetzt raus
  (`flashcards/facts.ts`, mit Test über den gesamten Datenbestand).
- **404-Seite zeigte internen Projekt-Jargon** („Etappe 0 · Grundgerüst"). Ursache war die
  `PlaceholderPage` aus Etappe 0, die nur noch von der 404-Seite benutzt wurde — jetzt entfernt.
- **Doppeltes Lösch-Kreuz im Suchfeld:** `type=search` bringt in WebKit/Blink ein eigenes ✕ mit,
  das neben dem eigenen Clear-Button stand.
- **Deaktivierte Buttons sahen klickbar aus.** `.btn:disabled` setzte nur `opacity: .5`, ein
  deaktivierter Primary blieb damit orange. Jetzt neutral (gedämpfte Fläche, gedämpfter Text).
- **Karteikasten: Muskelnamen bis zur Unkenntlichkeit abgeschnitten** („M. abducto…" zweimal
  nebeneinander). Name steht jetzt über der Region statt daneben.
- **Quiz-Feedback funktionierte nur über Farbe** (WCAG 1.4.1): ✓/✗-Marker an den Optionen, und die
  Rückmeldung benennt die richtige Antwort, statt „ist markiert" zu sagen.
- **Kontrast:** `.chip--active` lag bei 4.47:1 (AA verlangt 4.5:1) — der Akzent-Tint hebt den
  Untergrund an. Neuer Token `--accent-on-tint` (#b34400 im Light-Theme). Der Karteikasten entstand
  erst in Etappe 6, also nach dem A11y-Audit aus Etappe 5.
- **Seitenkopf-Regression:** die vertikale Zentrierung aus dem letzten Commit zentrierte die ganze
  Sektion **inklusive Titel** — Lernkarten- und Quiz-Titel rutschten in die Bildschirmmitte, andere
  Seiten nicht. Der Kopf steht jetzt überall oben, nur der Leerzustand füllt den freien Raum.
- **Emoji im UI durch Sprite-Icons ersetzt.** Rohe Emoji (`📋 🏆 ⚡ 🎉 ⚑ ★`) rendern je nach
  Betriebssystem/Font unterschiedlich — auf Linux/Chromium erschienen `📋` (Lernkarten-Kopf) und
  `🏆` (Statistik-Ziele) als leeres Kästchen (fehlendes Glyph). Sie brachen zudem die monochrome
  Strich-Bildsprache des Icon-Sprites. Jetzt: `icList` (+ `icArrow`) im Lernkarten-Kopf, `icFlag`
  am Schwierig-Marker, `icCheck` in der Sitzungs-Zusammenfassung, `icTrophy`/`icFlame` bei den
  Zielen, `icTrophy` im Level-Up-Toast. Neues Symbol `icFlag` im Sprite (24er-Raster, Strich 1.6,
  `currentColor`) — `icBookmark` wäre kollidiert (belegt für „Merken" im Detail). Keine neue
  Abhängigkeit: das Sprite deckte alles bis auf die Flagge ab.
- Lernkarten: Bewertungs-Buttons (Falsch/Unsicher/Richtig) waren vor dem Aufdecken als
  **deaktivierte** Buttons sichtbar — ein Klick tat nichts und wirkte wie ein Bug. Jetzt wie V1:
  vor dem Aufdecken ein klarer **„Karte aufdecken"**-Button, die Bewertung erscheint erst nach dem
  Aufdecken. Regressionstest ergänzt. (Voll-Audit aller Workflows — Lernkarten, Quiz inkl. neuer
  Modi, Deck-Verwaltung, Detail, Backup Import/Export — im Browser durchgespielt, sonst fehlerfrei.)

### Added
- Agenten-Workflow & Steuerdateien aufgesetzt (AGENTS.md + CLAUDE.md-Symlink,
  AGENT_WORKFLOW.md, ROADMAP.md, docs/architecture.md, docs/decisions/, docs/tasks/).
- Initialer Vite + React 19 + TypeScript Scaffold.
- Migrationsplan V1→V2 (docs/migration-plan.md) mit 6 Etappen für Coding-Agenten.
- ADR 0002: Persistenz- & Datenkompatibilität — friert den V1-Backup-Datei-Vertrag ein
  (Import/Export, Karten nach Muskelname, Leitner 7 Fächer, XP-Kurve).
- ROADMAP auf die reale Migration umgestellt (Etappen 0–5, Rahmenbedingungen).
- Etappe 0 (Fundament): React Router (HashRouter) + Zustand + Vitest eingerichtet;
  theme.css/fonts.css/base.css + Domänen-Typen aus Planung übernommen; Icon-Sprite;
  Theme-Store (persistiert, Default hell) + ThemeToggle; App-Shell-Skelett + Platzhalter-Routen;
  GitHub-Actions-Deploy nach Pages; ADR 0003 (Routing/Deploy) & ADR 0004 (State/Zustand).
- Etappe 1 (Datenschicht): Wiederholbare V1-Migration aus `../Muskelfinder` (`npm run migrate:data`);
  150 Muskeln als validierte V2-JSONs, Movement-Wörterbuch, Migrationsreport und kopierte
  BodyParts3D-Bilder unter `public/muscles/`; Loader/Validatoren und ADR 0005 ergänzt.
- Etappe 2 (Persistenz- & Kompatibilitätskern ★): getypter, DOM-freier Backup-Adapter
  (`src/persistence/`) — Sanitizer für flashcards/xp/quizSeries (V1-Regeln 1:1), `parseBackup`
  (nimmt v1/v2/Legacy an, lehnt zu neu/unvollständig/unbekannt ab) und `buildBackup`/Export im
  eingefrorenen v2-Format. Leitner-7- und XP-Kurven-Logik als reine, getestete Module.
- Persistierte Stores mit eigenen V2-Keys: `useProgressStore` (Leitner 7 + XP, Karten nach
  Muskelname, Level abgeleitet), `useQuizStore` (Serien-Statistik, Modus-Keys verbatim),
  `useCollectionStore` (Merkliste). Backup-Bridge `exportBackup`/`importBackup`.
- Golden-File-/Round-Trip-Tests gegen V1-Format-Fixtures (Import→State→Export semantisch gleich,
  Level-/Fälligkeits-Erhalt, Ablehnung fehlerhafter Backups). 78 neue Tests (gesamt 88 grün).
- ADR 0006: Schichtung des Persistenz-Kerns (reiner Adapter + dünne Store-Bridge,
  Store-Zustand = V1-Sektionsform, id↔Name-Auflösung erst in der UI).
- Etappe 3 (Funktionaler Kern, un-poliert): alle fünf Screens funktionieren end-to-end,
  tokenbasiert.
  - 3a Suche & Filter: `useFilterStore` (Session), `useMuscleSearch` (debounced, diakritika-
    toleranter Fuzzy über nameLatin + DE/Tags), Region/Gelenk/Bewegung/Innervation-Filter,
    Sortierung, deep-linkbare URL (`data/filterUrl.ts`), `MuscleGrid`/`MuscleCard`.
  - 3b Muskel-Detail: DataList, Fachlich/Einfach-Umschalter, ImageViewer mit sichtbarer
    CC-BY-4.0-Attribution, Collection-Toggle (persistiert), „Zu Lernkarten".
  - 3c Lernkarten: Leitner-Session (`useFlashcardSession`) gegen `useProgressStore`
    (Bewertung → Fach/nextDue/XP; unsicher re-queued).
  - 3d Quiz: 4 MC-Modi (deterministische Generierung `data/quiz.ts`), Serie/Score/Reveal/
    Ergebnis; Serien-Statistik im kompatiblen `quizSeries`-Format (`useQuizStore`).
  - 3e Statistik: Level/XP/Karten-Breakdown/Region-Mastery/Quiz aus den Stores abgeleitet
    (`data/stats.ts`, Selektoren ohne Doppel-State) + Backup-Panel (Export/Import) bindet den
    Etappe-2-Kern an die UI.
  - Geteilte UI-Primitives (`styles/components.css`: Button/Chip/Checkbox/Segmented/Difficulty),
    semantische Tokens `--success`/`--danger`. Teststand 132 grün.
- Etappe 4 (Design, 1. Durchgang): responsive App-Shell nach Handoff §7 — schwebende
  Glas-Icon-Rail (Desktop, Level-Ring + Theme-Toggle) ⇄ Glas-Tab-Leiste (Mobile), umgeschaltet
  über `useMediaQuery`/`useIsDesktop` (lg=1024px, matchMedia-Stub im Test-Setup). Bühnen-Radial-
  Hintergrund, Safe-Area-Insets. Neues `ProgressRing`-Primitive. Primitives an die verbindlichen
  Rezepte angeglichen (SearchField 56px + Fokus-Recipe, Chip 8px/11.5px + aktiv, DifficultyDots 6px,
  SegmentedControl aktiv = Akzent-Füllung). Pixelgenauer Frame-Abgleich pro Screen + A11y-Audit offen
  (siehe docs/tasks/2026-07-08-etappe-4-design.md).
- Etappe 4 (Design, 2. Durchgang): Treffer-Highlighting im Muskelnamen (`foldText`/`highlightName`,
  diakritika-tolerant, getestet, orange `<mark>`); entfernbare `ActiveFilters`-Chip-Reihe;
  Quiz-Antworten mit A–D-Badges im 2×2-Grid + `role="radiogroup"`/`radio`; `LeitnerBoxes`-Visual
  (7 Fächer); Statistik-LevelCard mit großem `ProgressRing`. Teststand 137 grün.
- Etappe 4 (Design, 3. Durchgang): `Sheet`-Primitive (Bottom-Sheet mit Grabber, Backdrop/Esc,
  Fokus-Rückgabe, Scroll-Lock) + mobiles FilterSheet (Filter-Button mit aktiv-Zähler);
  Detail-ImageViewer mit Ansichts-Badge + Thumbnail-Reihe; ClinicalNote-Box (`icInfo`).
- Etappe 4 (Design, 4. Durchgang, nach Screenshot-Review): Fix — lange Bewegungs-Chips liefen
  aus der Karte, jetzt Ellipsis + `title`; FilterSidebar auf rechts verschoben (Frame `3a`).
- Etappe 4 (Design, 5. Durchgang, mit Screenshot-Verify): Lernkarte als echter 3D-Flip
  (`rotateY`, `perspective`, `preserve-3d`, `backface-visibility`; beide Seiten im Grid gestapelt,
  Rückseite un-gespiegelt); Quiz-`QuizProgress`-Segmentleiste (richtig/falsch/aktuell/offen) samt
  `results`-Historie im `useQuizGame`; Statistik-`CardBreakdown`-Stapelbalken (gemeistert/in Arbeit/neu
  + Legende) und Bento-Grid (`stats__bento`). Teststand 137 grün.
- Etappe 4 (Design, 6. Durchgang, A11y + mobil, mit Screenshot-Verify): mobile Region-Chip-Reihe
  (`RegionChips`, horizontal scrollbar, `aria-pressed`-Toggles) über der Ergebnisliste; Sheet mit
  vollständigem Fokus-Trap (Tab/Shift+Tab zyklisch); Quiz-Radiogroup mit Roving-Tabindex +
  Pfeiltasten/Home/End. Native `<select>` bewusst als Dropdown belassen (A11y). Teststand 137 grün.
- Etappe 4 (Design, 7. Durchgang, Dark-Mode-Feinschliff): alle Screens im Dunkelmodus verifiziert;
  semantische Zustandsfarben pro Theme justiert — auf Dunkel heller/klarer (`--success #4ecb83`,
  `--danger #f2705f`, distinkt vom Orange), Light unverändert. **Etappe 4 abgeschlossen** (DoD erfüllt:
  Frames Light+Dark, Responsive, A11y §13; lint+test+build grün, nur Tokens).
- `docs/PROJECT_STATE.md` als Single Source of Truth fuer Agenten angelegt und in
  `AGENTS.md` verpflichtend verlinkt.
- Etappe 5 (Härtung, Teil 1): Rechts-/Transparenz-Seiten aus V1 übernommen —
  `SourcesPage` (Quellen & Lizenzen, BodyParts3D/DBCLS CC BY 4.0 vollständig sichtbar) unter
  `/quellen` und `PrivacyPage` (Datenschutz, an V2-localStorage angepasst) unter `/datenschutz`,
  geteiltes `LegalPage`-Gerüst; globaler `SiteFooter` (Attribution + Legal-Links) auf jeder Route.
  Route-Code-Splitting via `React.lazy`/`Suspense` (`RouteFallback`, respektiert reduced-motion) —
  Build erzeugt separate Chunks pro Seite. Muskel-/Quizbilder mit `loading="lazy"` + `decoding="async"`.
  Smoke-Tests für beide Legal-Seiten; App-Smoke-Test auf Lazy-Load umgestellt (139 Tests grün).
- Etappe 5 (Härtung, Teil 2): A11y-Audit mit axe-core (WCAG 2 A/AA + best-practice) über alle
  sieben Routen in Light **und** Dark — 0 Verstöße. Behoben: fünf Farbkontrast-Verstöße im
  Light-Theme durch Abdunkeln der Text-Tokens (`--text-tertiary/-muted/-faint`) und des
  Link-/Icon-Akzents (`--accent-on-surface` → `#bd4800`) auf ≥4.5:1; Dark unverändert (war grün).
  Deep-Link-Reload live verifiziert (direkter Load + Reload auf `/muskel/:id`, keine Fehler);
  `.nojekyll` + HashRouter tragen den statischen Deploy.
- Etappe 5 (Härtung, Teil 3): Offline/PWA via `vite-plugin-pwa` (Workbox, `registerType:
  autoUpdate`). App-Shell + Code + Daten-Chunk + Sprite werden vorab gecacht (33 Einträge),
  Muskelbilder laufzeit-gecacht (CacheFirst). Web-App-Manifest (Name, Standalone, Theme-Farbe)
  + Marken-Icons 192/512/maskable (aus `favicon.svg` gerendert) + `apple-touch-icon`. Bleibt
  statisch/lokal — der SW greift nur auf Repo-Assets zu. Offline verifiziert: `/suche` (150 Karten)
  und Muskel-Detail laden ohne Netz, keine Fehler.
- V1-Parität (Etappe 6, Teil 1): **Karteikasten-Verwaltung** wieder eingeführt (aus V1
  `muscle-selection.html` nachgebaut). Neue Seite/Route `/karteikasten` ([DeckManagerPage]):
  Tabelle „Im Karteikasten" (Muskel · Bereich · Fach · Fällig · Entfernen) + Bulk-Hinzufügen
  („Ausgewählte hinzufügen", „Alle sichtbaren hinzufügen") mit Suche + Region-Tabs + Checkboxen.
  Verlinkt aus der Lernkarten-Seite; behebt die faktisch leere Lernkartei (bisher nur Einzel-Add
  im Detail). Nutzt die vorhandene Deck-API (`addCards`/`removeCard`/`isDue`). 4 Smoke-Tests.
- Gap-Analyse V1↔V2 dokumentiert (`docs/v1-v2-gap-analysis.md`): offene Lücken (Lernkarten-Setup/
  Summary, Quiz „Ursprung & Ansatz" + Pool-Filter, Statistik-Ziele, Menü) priorisiert.
- V1-Parität (Etappe 6, Teil 2): **Lernkarten-Ablauf** wieder vollständig (V1 `flashcards.js`).
  `useFlashcardSession` startet jetzt explizit über `start({ limit, scope })` statt Auto-Start.
  Drei Screens: **Setup** (Fällig-Zähler, Bereich- + Kartenlimit-Auswahl, „Lernen starten",
  Fächer-Übersicht, Zurücksetzen) · **Card** (Zurück-Button, „Schwierig"-Flag ⚑, Bild-Zuschalten,
  Tastatur `Space`/`1`/`2`/`3`/`F` + Swipe mobil) · **Summary** (Sitzungsstatistik gelernt/richtig/
  falsch/XP, „Fächer nach der Sitzung", Weiter lernen / Zur Übersicht). `btn--danger`/`btn--block`
  als Primitives ergänzt. Hook- + Page-Tests (148 Tests grün); Light/Dark/Mobile verifiziert.
- V1-Parität (Etappe 6, Teil 3): **Quiz „Ursprung & Ansatz"** wieder da (V1 `origin-insertion-quiz`).
  Zwei Modi ergänzt — `origin-insertion` (Ursprung → Ansatz) und `insertion-origin`
  (Ansatz → Ursprung); nutzen die vorhandenen `origin`/`insertion`-Daten. Zusätzlich
  **Bereichsfilter** (V1 „Quiz-Filter"): Chip-Reihe auf dem Quiz-Start schränkt den Muskel-Pool
  auf Regionen ein. Serien-Key `quizSeriesKey(mode, regions)` bleibt ohne Filter exakt V1-kompatibel
  (ADR 0002), mit Filter ein zusätzlicher, sortierter Schlüssel. V2-Extra „Innervation"-Modus bleibt.
  Quiz-Datentests erweitert (151 Tests grün); Ursprung/Ansatz-Runde im Browser verifiziert.
- V1-Parität (Etappe 6, Teil 4): **Statistik erweitert** (V1 `stats-dashboard`). Neue Selektoren
  `quizByMode` (Quiz-Bilanz je Modus, Serien gleichen Modus zusammengefasst) und
  `nextMasteryMilestone` (Meilensteine 1/5/10/25/50/100). Neue Panels: **„Quiz-Bilanz je Modus"**
  (Quote-Balken je Modus + „Beste Quote"-Badge nach Genauigkeit) und **„Ziele"** (nächster
  Karten-Meilenstein in F5–F7 + XP bis nächstes Level). 154 Tests grün; Light verifiziert.
- V1-Parität (Etappe 6, Teil 5 — Feinschliff): **Nav-Eintrag „Karteikasten"** in der Desktop-Rail
  (mobile TabBar bleibt schlank; dort via Lernkarten-Link). **XP-/Level-Up-Toasts** (neuer
  `useToastStore` + `ToastHost`, aria-live, reduced-motion): Rückmeldung bei Quiz-Antworten,
  Lernkarten-Bewertungen, Serien-Boni und Level-Ups. **Tagesbonus verdrahtet** (`useDailyBonus`)
  — vergibt V1s 10 XP einmal täglich beim App-Start (war zuvor implementiert, aber nie aufgerufen).
  Hinweis: V1-Feld `functionalChain` ist in allen 150 Datensätzen leer → bewusst nicht übernommen.
  Toast-Store-Tests (157 Tests grün); Toast/Rail/TabBar im Browser verifiziert.
- V1-Parität (Etappe 6, Teil 6 — Abschluss): **3D-Anatomie-Verknüpfung** regelkonform (ohne
  Laufzeit-Request): unterstützte Muskel-Keys als Repo-Daten gebündelt
  (`data/generated/three-d-support.json`), `src/data/threeD.ts` (`isSupportedIn3D`/`threeDUrl`),
  „In 3D ansehen"-Button auf der Detailseite (unterstützte Muskeln) + „3D Anatomie ↗" im Footer +
  Datenschutz-Abschnitt. **Quiz-Submodi** vervollständigt: neuer Modus **„Name → Bild"**
  (Bild-Optionen) und **„Gemischt"** je Quiztyp (`function-mixed`/`origin-insertion-mixed`/
  `image-mixed`, lösen je Frage zufällig auf eine Richtung auf). QuizPage in V1-Struktur (Quiz-Typ-
  Karten mit Richtungs-Buttons). 163 Tests grün; alle neuen Flows im Browser verifiziert.
