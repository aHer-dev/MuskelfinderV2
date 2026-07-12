# Project State — Single Source of Truth

> Erst hier lesen. Diese Datei ist der kompakte, aktuelle Stand fuer Agenten.
> Details stehen in ROADMAP.md, docs/produkt-plan.md (aktuelle Arbeit, mit Statustafel),
> docs/migration-plan.md (abgeschlossen), docs/architecture.md und den ADRs.

## Stand
- Datum: 2026-07-12
- Branch: `feat/design-feinschliff` (nicht gemergt)
- Status: **Migration abgeschlossen (Etappen 0–6, `v1.0` getaggt). Produktphase geplant
  (Etappen 7–9) — Statustafel in `docs/produkt-plan.md`. Naechster Schritt: Etappe 7a.**
  Der historische Verlauf steht unten.

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
- Etappe 7 ist **nicht blockiert** und sofort startklar. Etappe 9 wartet auf Entscheidungen
  **E1–E3** (reale Pruefungsform · Gruppen-Annotation · Palpations-Relevanz), die nur der
  Projektinhaber treffen kann — Liste in der Statustafel.
- Konzept-Mockups (visuell, extern): Heute-Screen und Produktkonzept, siehe `docs/produkt-plan.md`.

## Naechster Schritt
**Etappe 7a — Empfehlungs-Engine** (`src/data/today.ts`, reine Selektoren, kein UI).
Briefing: `docs/tasks/2026-07-12-etappe-7a-empfehlungs-engine.md`. Danach 7b (Route `/heute`).

Davor liegt noch offen (nur durch dich):
- Merge `feat/design-feinschliff` → `main`.
- Bei oeffentlichem Deploy: `git remote add origin …` + Push (kein Remote konfiguriert).

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
