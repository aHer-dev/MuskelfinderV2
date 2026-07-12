# Project State — Single Source of Truth

> Erst hier lesen. Diese Datei ist der kompakte, aktuelle Stand fuer Agenten.
> Details stehen in ROADMAP.md, docs/produkt-plan.md (aktuelle Arbeit, mit Statustafel),
> docs/migration-plan.md (abgeschlossen), docs/architecture.md und den ADRs.

## Stand
- Datum: 2026-07-12
- Branch: `release/v1.1` (Etappe 8 komplett auf `main`)
- Status: **Migration abgeschlossen (Etappen 0–6, `v1.0`). ETAPPE 7 KOMPLETT (7a–7f). ETAPPE 8
  LAEUFT: 8a + 8c + 8b + 8e fertig** — die Abrufhaerte waechst mit der Beherrschung, keine Zahl in der
  Statistik steht ohne Knopf, man kann gezielt an den Luecken ueben, und eigene Notizen stehen beim
  Muskel, die Bildluecke sieht absichtlich aus, und der lateinische Name erklaert sich selbst.
  **ETAPPE 8 IST KOMPLETT** (8a–8f). Offen bleiben nur zwei bewusste Auslassungen: Stufe 2a von 8f
  (Renderings) und die Merksaetze aus 8d — beide brauchen den Fachmann, nicht mehr Code.
  **Bruecke B4 ist eingeloest**; offen bleibt nur noch B3 (9c). Statustafel: `docs/produkt-plan.md`.
- Gate gruen: `npm run lint && npm run test && npm run build` — **405 Tests**.
- **Offen aus 8b (Entscheidung noetig):** Die Filter gibt es in der **Sitzung**, aber **nicht im
  Quiz**. Ein gefilterter Quiz-Pool braucht einen ZUSAETZLICHEN Serien-Schluessel (der bestehende
  muss bitgleich bleiben, ADR 0002) und eine Antwort auf zu kleine Pools (eine Frage braucht 4
  Optionen). Siehe Kasten in der Statustafel.

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

## Offene Kopplung: 3D-App V2 ist noch NICHT veroeffentlicht
Der „In 3D ansehen"-Link zeigt seit `28c4033` auf **`https://aher-dev.github.io/3DAnatomyV2/`**
(vorher V1 `/3DAnatomy/`). Das ist **bewusst so** — aber V2 ist **noch nicht offiziell
veroeffentlicht**. Der Link ist vorausschauend gesetzt, damit beim Release nichts nachgezogen
werden muss.

**Warum V2 und nicht V1:** V1 laedt three.js zur Laufzeit per Import-Map von `cdn.jsdelivr.net`
(live gemessen: 9 Requests). Das schickt die IP unserer Nutzer an ein fremdes CDN und verletzt die
Architektur-Grenze „keine externen Laufzeit-Requests". V2 buendelt three.js lokal, setzt
`default-src 'self'` und macht null externe Requests. Deep-Link-Vertrag
(`muscleKey`/`muscle`/`source`/`returnTo`) und Mapping sind identisch (beide 118 Keys, diffed);
End-to-End verifiziert (Muskel wird hervorgehoben, „Zurueck zum Muskelfinder" traegt).

**Vor einem oeffentlichen Muskelfinder-Deploy pruefen — sonst laufen Nutzer ins Leere:**
- [ ] Ist V2 unter `/3DAnatomyV2/` offiziell veroeffentlicht und stabil?
- [ ] **`/3DAnatomyV2/datenschutz.html` liefert aktuell HTTP 404** (deployter Build ist aelter als
      die `vite.config`, die sie als Input fuehrt). Eine oeffentliche App ohne erreichbare
      Datenschutzseite ist ein Problem — Redeploy von V2 noetig.
- [ ] Im 3D-Repo liegt der Branch `fix/datenschutz-jsdelivr-veraltet` (Commit `f209896`): entfernt
      die falsche Behauptung, V2 lade three.js ueber jsDelivr. Sollte mit veroeffentlicht werden.

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
**RELEASE v1.1 — die App war NIE deployt.** Es gibt kein Git-Remote; kein Schueler hat sie je
geoeffnet. Checkliste: `docs/release-v1.1.md`. Alles, was ohne den Projektinhaber ging, ist erledigt
(Release-Blocker `base` behoben, unter echten Pages-Bedingungen verifiziert, Version 1.1.0).
**Offen und nur vom Projektinhaber loesbar:** Remote anlegen + pushen, Pages auf "GitHub Actions"
stellen, und die 3D-Kopplung aufloesen (V2 veroeffentlichen; ihre datenschutz.html liefert 404).

**Danach: Etappe 9 planen** (Briefings wie fuer Etappe 7 und 8). Etappe 9 ist seit den
Entscheidungen E1-E5 nicht mehr blockiert:
9a funktionelle Gruppen + Gruppen-Quiz · 9b Abzeichen · 9c Pruefungsmodus (schliesst **Bruecke B3**)
· 9d Palpation.

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

Anschluss-Hinweis: Stores schluesseln Karten nach `nameLatin`; die UI loest Routing-`id` ueber
die Datenschicht (`getMuscleByLatinName`) auf (ADR 0002 §2 / ADR 0006 §3). Such-/Filter-Logik,
Quiz-Generierung und Statistik liegen getestet in `src/data/` — Etappe 4 aendert nur Darstellung.

## Agenten-Regel
Nach jedem abgeschlossenen Task diese Datei aktualisieren, wenn sich Status, Gate, Datenstand,
naechster Schritt oder eine harte Entscheidung aendert. CHANGELOG.md bleibt zusaetzlich Pflicht.
