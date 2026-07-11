# Project State — Single Source of Truth

> Erst hier lesen. Diese Datei ist der kompakte, aktuelle Stand fuer Agenten.
> Details stehen in ROADMAP.md, docs/migration-plan.md, docs/architecture.md und den ADRs.

## Stand
- Datum: 2026-07-09
- Branch: `feat/etappe-0-fundament`
- Status: Etappe 0–4 abgeschlossen. **Etappe 5 (Haertung) laeuft** — Teil 1+2 umgesetzt:
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
- Aktueller Teststand: 163 Tests gruen. A11y: axe 0 Verstoesse (Playwright+Chromium+axe-core lokal).
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

## Naechster Schritt
Etappe 5 (Haertung & Feinschliff) fortsetzen (docs/migration-plan.md, ROADMAP Phase 5).
Erledigt: Quellen-/Lizenz- + Datenschutz-Seite, Route-Code-Splitting, Bild-Lazy-Load,
A11y-Audit (axe 0 Verstoesse Light+Dark), Deep-Link-Reload verifiziert, Offline/PWA (SW +
Manifest + Icons, offline verifiziert). **Etappe 5 technisch abgeschlossen.**
Offen — nur noch durch dich:
- Merge `feat/etappe-0-fundament` → `main`.
- Release-Tag `v1.0` setzen.
Werkzeuge lokal: Playwright+Chromium+axe-core (visuelle/A11y-Verifikation, Preview Port 4319).
Task-Briefing: `docs/tasks/2026-07-09-etappe-5-haertung.md`.

Anschluss-Hinweis: Stores schluesseln Karten nach `nameLatin`; die UI loest Routing-`id` ueber
die Datenschicht (`getMuscleByLatinName`) auf (ADR 0002 §2 / ADR 0006 §3). Such-/Filter-Logik,
Quiz-Generierung und Statistik liegen getestet in `src/data/` — Etappe 4 aendert nur Darstellung.

## Agenten-Regel
Nach jedem abgeschlossenen Task diese Datei aktualisieren, wenn sich Status, Gate, Datenstand,
naechster Schritt oder eine harte Entscheidung aendert. CHANGELOG.md bleibt zusaetzlich Pflicht.
