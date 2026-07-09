# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier festgehalten.
Format nach [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
Versionierung nach [Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

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
