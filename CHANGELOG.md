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
- `docs/PROJECT_STATE.md` als Single Source of Truth fuer Agenten angelegt und in
  `AGENTS.md` verpflichtend verlinkt.
