# Migrationsplan — Muskelfinder V1 → V2

> **Zweck:** Der verbindliche Etappenplan für die Modernisierung von der statischen
> Vanilla-App (V1) zur komponentenbasierten React-App (V2). Jede Etappe ist so geschnitten,
> dass ein Coding-Agent sie eigenständig umsetzen kann und **zu jeder Zeit klar ist, was zu tun
> ist**. Strategie-Ebene: [ROADMAP.md](../ROADMAP.md) · Prozess: [AGENT_WORKFLOW.md](../AGENT_WORKFLOW.md).

## So wird dieser Plan benutzt
- Eine Etappe = eine oder mehrere **Task-Briefings** in `docs/tasks/` (Template: `_TEMPLATE.md`).
  Der **Umfang** einer Etappe/eines Tasks setzt die **Regel-1-Grenze** (welche Module ein Agent
  anfassen darf — siehe AGENT_WORKFLOW §2).
- Etappen laufen **seriell** in der angegebenen Reihenfolge; innerhalb einer Etappe dürfen
  Tasks parallel laufen, wenn ihre Modulgrenzen **strikt getrennt** sind.
- „Fertig" heißt: `npm run lint && npm run test && npm run build` grün + die **Definition of
  Done** der Etappe erfüllt + Cross-Review durch den anderen Agenten.
- **Kern zuerst, Design danach.** Etappen 0–3 bauen die *funktionierende* App (tokenbasiert,
  aber nicht pixelgenau). Etappe 4 setzt das Hi-Fi-Design aus `Planung/` um.

## Leitplanken (gelten in JEDER Etappe)
1. **Statisch, kein Backend.** Keine Laufzeit-Requests außer den Repo-Daten (Muskel-JSON, Bilder).
2. **Kompatibilitäts-Vertrag ist heilig.** Das Backup-Datei-Format bleibt import-/exportierbar —
   siehe [ADR 0002](decisions/0002-persistenz-und-datenkompatibilitaet.md). Keine Etappe darf ihn brechen.
3. **Tokens only.** Farben/Maße/Typo ausschließlich über `theme.css`-Variablen, nie hardgecodet.
4. **Schichten trennen.** Datenschicht ↔ Store ↔ UI reden über getypte Objekte; keine
   Parse-/Fetch-Logik in Komponenten (siehe [architecture.md](architecture.md)).
5. **Keine Altlast hinterlassen.** Kein toter/auskommentierter Code, keine V1-Struktur-Reste.
6. **Tests sind das Gate, nicht Deko.** Logik wird mitgetestet; rot = nicht fertig.
7. **TypeScript strict, kein `any` in Kernpfaden.** Kein `window.*` als State-Kanal.

## Zielarchitektur (Sollzustand nach Etappe 4)
```
src/
├─ main.tsx · App.tsx            # Router (Hash) + AppShell
├─ styles/  theme.css · fonts.css · base.css
├─ types/index.ts               # Domänenmodell (aus Planung/, ggf. erweitert)
├─ data/    muscles.ts | *.json # saubere, validierte Muskeldaten (aus V1 migriert)
├─ data/loader.ts               # laden + validieren → getypte Muscle[]
├─ persistence/                 # ★ Kompatibilitätskern (ADR 0002): Backup-Adapter, Sanitizer
├─ store/   useFilterStore · useQuizStore · useProgressStore · useCollectionStore · useThemeStore
├─ hooks/   useMuscleSearch · useMediaQuery · useTheme …
├─ components/ ui/ (Primitives) · layout/ (Shell/Rail/TabBar/Sidebar) · features/ (Suche/Detail/…)
└─ pages/   SearchPage · MuscleDetailPage · FlashcardsPage · QuizPage · StatsPage
```

## Altlasten, die verschwinden (nicht mitschleppen)
- `{"Sheet1":[…]}`-XLSX-Export-Wrapper und die `.xlsx`-Dateien → V2 committet nur **sauberes,
  getyptes** JSON/TS; das Migrationsskript bleibt als Dev-Werkzeug, die Rohquelle nicht.
- Multipage-HTML (`index.html`, `muscle-details.html`, `quizzes/*.html`) → SPA mit Router.
- IIFE-Module + `window.XManager`-Globals → getypte ES-Module + Zustand-Stores.
- Vermischtes Feld `Segments` (Nerv + Segmente in einem String) → getrennte `innervation` + `segments`.
- V1-UI-localStorage-Keys (Such-/Filter-/Mode-State) → werden **nicht** übernommen (ADR 0002 §5).

---

# Die Etappen

## Etappe 0 — Fundament & Infrastruktur
**Ziel:** Lauffähiges, leeres Grundgerüst mit Toolchain, Theming, Routing, Deploy — noch ohne
Features. Danach kann jede weitere Etappe „nur noch Inhalt" bauen.

**Umfang (Module):** `package.json`, `vite.config.ts`, `index.html`, `src/main.tsx`,
`src/App.tsx`, `src/styles/*`, `src/types/index.ts`, `public/fonts/`, `public/icons/sprite.svg`,
CI-Workflow, ADRs.

**Kernpunkte:**
- **Vitest einrichten** (erster Infra-Task laut AGENTS.md) + ein Smoke-Test, `npm run test` grün.
- Deps ergänzen: `react-router-dom`, `zustand`. React **19** (Scaffold-Stand) beibehalten —
  Design-Handoff nennt 18, unser Stack ist 19 (siehe AGENTS.md); als ADR festhalten.
- `theme.css`, `fonts.css` (Sora + Manrope **self-hosted**, `.woff2` nach `public/fonts/`),
  `base.css` und `types/index.ts` aus `Planung/design_handoff_muskelfinder/` einsetzen.
  `data-theme="light"` als Default auf `<html>`.
- Icon-Sprite `public/icons/sprite.svg` aus der Referenz bündeln (`<use href=…#icName>`).
- **Routing: `HashRouter`** (zero-config, kein 404 bei Deep-Link-Reload auf statischem Hosting).
  Routen `/suche · /muskel/:id · /lernkarten · /quiz · /statistik` als leere Platzhalter.
- **Deploy:** GitHub-Actions-Workflow → GitHub Pages. Isolierte Origin/eigene Domain →
  `base: '/'` in `vite.config`, `CNAME` in `public/`. `.nojekyll` setzen.
- `useThemeStore` (persistiert) + `ThemeToggle` funktional (noch un-poliert).
- **App-Shell-Skelett** nur strukturell (Rail/TabBar als Platzhalter) — **nicht** pixelgenau.

**Nicht-Ziele:** Muskeldaten, echte Features, finales Design.

**Definition of Done:** lint+test+build grün; CI deployt das leere Grundgerüst live;
Theme-Toggle schaltet light/dark; Routen navigierbar; ADRs 0003 (Routing/Deploy) &
0004 (State = Zustand) angelegt.

---

## Etappe 1 — Datenschicht & Daten-Migration
**Ziel:** Alle ~150 Muskeln liegen als **sauberes, getyptes, validiertes** V2-Datenmodell vor;
kein XLSX-Wrapper mehr. Bilder + Attribution übernommen.

**Umfang (Module):** `scripts/migrate-v1-data.*` (Dev-Werkzeug), `src/data/*`,
`src/data/loader.ts`, `public/muscles/` (Bilder), Tests dazu. **Keine UI.**

**Kernpunkte (V1→V2-Mapping):**
- Quelle: V1 `data/{obere-extremitaet,untere-extremitaet,wirbelsaeule,kopf-hals}.json`
  (Wrapper `{"Sheet1":[…]}`) + `config.json` (Regionen/Subgruppen).
- Feld-Mapping auf `Muscle` (types.ts): `Name→nameLatin` (**kanonisch, = Backup-Schlüssel,
  ADR 0002 §2**), `id = slug(Name)` (stabil, eindeutig), `Movements` (Komma-String) →
  `functions[]` (Movement-Slugs) via Movement-Wörterbuch, `Segments` (gemischt) → **splitten**
  in `innervation` (Nerv, z. B. „N. …/Plexus …") + `segments` (z. B. „C6–Th1"), `Joints`→`joints[]`,
  `subgroup`(id)→`subregion`(Label via config), `region`(id) → RegionId
  (`obere-extremitaet→upper, untere→lower, wirbelsaeule→trunk, kopf-hals→head`),
  `Images[]`+`Attribution` → `images[]` (je Bild `view`/`attribution`/`license`),
  `easy{…}` behalten (Expert/Easy-Umschalter), `difficulty`, `tags`, `clinicalNote`.
- **`taCode` fehlt in V1** → im V2-Modell **optional** machen und in der UI ausblenden, wenn leer
  (types.ts anpassen: `taCode?`). Nicht erfinden.
- Split-Heuristik `Segments` dokumentieren; Zweifelsfälle als Report ausgeben (manuelle Nachschau),
  nicht raten.
- Bilder: `assets/images/{region}/…` → `public/muscles/…`; Pfade in den Daten umschreiben
  (relativ, base-tauglich). Lizenz/Attribution je Bild erhalten (CC BY 4.0 Pflicht).
- Loader validiert beim Laden (Schema-Check, TS strict); ungültige Datensätze schlagen laut fehl.

**Nicht-Ziele:** Suche/Filter-Logik, Store, UI.

**Definition of Done:** Tests grün für: Anzahl == V1, `id` eindeutig, `nameLatin` == V1-`Name`
(verlustfrei), Pflichtfelder vorhanden, jedes Bild mit Attribution, keine `{"Sheet1"}`-Reste,
kein `any`. ADR 0005 (Datenmodell & Migration) angelegt.

---

## Etappe 2 — Persistenz- & Kompatibilitätskern ★
**Ziel:** Die harte Kompatibilitätsgarantie. Backup **Import/Export** nach [ADR 0002](decisions/0002-persistenz-und-datenkompatibilitaet.md)
plus die persistierten Stores. **Steht bewusst VOR den Screens** — alles danach baut darauf.

**Umfang (Module):** `src/persistence/*` (Sanitizer, Backup-Adapter, Migrator),
`src/store/useProgressStore.ts` (Leitner 7 + XP-Kurve), `src/store/useQuizStore.ts`
(Serien-Statistik), `src/store/useCollectionStore.ts`, Fixtures + Tests.

**Kernpunkte:**
- V1-Sanitizer (`sanitizeFlashcards/XP/QuizSeries`, `normalizeFullBackup`,
  `normalizeLegacyFlashcardBackup`) als **getypte TS-Funktionen** portieren.
- Export erzeugt `muskelfinder-backup`-v2-Datei (Blob-Download); Import akzeptiert v1, v2 und
  Legacy-Flashcard-only; `version > 2` und unvollständige Backups sauber ablehnen.
- **Karten nach Muskelname** schlüsseln (ADR 0002 §2). **Leitner 7 Fächer**, Intervalle
  `1/3/7/14/30/90/180`. **XP-Kurve** `50·(l−1)^1.658`, Cap 99 — Level abgeleitet, nie gespeichert.
- Persistenz über versionierten Adapter (eigene, saubere V2-localStorage-Keys) — UI-Modell bleibt
  vom Speicher-Schema entkoppelt.
- `quizSeries`-Modus-Keys aus V1 `quiz-session.js` inventarisieren; unbekannte Keys beim Import
  **verbatim** durchreichen.

**Nicht-Ziele:** Screens, Layout, Design.

**Definition of Done:** Golden-File-/Round-Trip-Tests gegen **echte V1-Backup-Fixtures**
(einen echten V1-Export ins Repo als Fixture legen): Import → State → Export ist semantisch
gleich; fehlerhafte/zu neue Dateien werden abgelehnt; 7-Fach-Intervalle & Level aus totalXP
korrekt. **Ohne diese Tests gilt die Etappe als nicht erfüllt.**

---

## Etappe 3 — Funktionaler Kern (un-poliert)
**Ziel:** Alle fünf Screens **funktionieren** end-to-end auf Basis von Etappe 1+2 — tokenbasiert,
aber ohne Pixel-Feinschliff. Das ist der „Kern funktioniert"-Meilenstein.

Aufgeteilt in unabhängig mergebare Tasks (getrennte Modulgrenzen → Regel 1):

- **3a — Suche & Filter:** `useFilterStore`, `useMuscleSearch` (debounced Fuzzy über `nameLatin`
  + DE/Synonyme), `MuscleGrid`/`MuscleCard`, Filter (Region-Mehrfach, Gelenk/Bewegung/Innervation),
  Sortierung, **deep-linkbare URL** (Filter ↔ Query-Params). *DoD: Such-/Filter- und
  URL-Serialisierungs-Logik getestet.*
- **3b — Muskel-Detail:** DataList, Expert/Easy-Umschalter, ImageViewer (funktional),
  Collection-Toggle (`useCollectionStore`), Attribution sichtbar. *DoD: Detail lädt per `:id`;
  Collection persistiert.*
- **3c — Lernkarten:** Leitner-Session (7 Fächer), RatingBar (Falsch/Unsicher/Richtig),
  Fälligkeits-Logik gegen `useProgressStore`. *DoD: Bewertung verschiebt Fach + `nextDue` korrekt
  (getestet); XP-Vergabe greift.*
- **3d — Quiz:** `useQuizStore`, MC-Modi, Serie/Score, Reveal, Ergebnis; Serien-Statistik schreibt
  ins kompatible `quizSeries`-Format. *DoD: Auswertungs-/Serien-Logik getestet.*
- **3e — Statistik:** Level/XP/Serie/Region-Mastery aus den Stores **abgeleitet** (Selektoren),
  keine Doppel-State. *DoD: Kennzahlen stimmen mit Store-Inhalt überein.*

**Nicht-Ziele:** Pixelgenaues Design, Glassmorphism, finale Responsive-Politur.

**Definition of Done (Etappe gesamt):** Man kann suchen → Detail öffnen → Karte lernen → Quiz
spielen → Fortschritt in Statistik sehen → als Backup exportieren und wieder importieren.
Alle Logik-Tests grün.

---

## Etappe 4 — Design-Umsetzung (Hi-Fi, pixelgenau)
**Ziel:** Das vollständige Marken-Design aus `Planung/design_handoff_muskelfinder/` umsetzen —
jetzt, wo der Kern trägt.

**Umfang:** `components/ui/` (Primitives), `components/layout/` (AppShell/IconRail/TabBar/
FilterSidebar+Sheet), `components/features/*`, responsive- & a11y-Feinschliff.

**Kernpunkte:**
- Primitives pixelgenau (README §5–§8, COMPONENTS.md): Button/Chip/Checkbox/Select/SearchField/
  ProgressRing+Bar/DifficultyDots/Panel/Card/SegmentedControl/Sheet.
- **AppShell**: Desktop Icon-Rail (Glas) + optional Filter-Sidebar; Mobile Tab-Leiste + Bottom-Sheet.
  Logo **themeabhängig** (`af-logo.png` dark / `af-logo-dark.png` light).
- **Responsive** (README §14): Rail↔TabBar via `useMediaQuery`, Grid 2→1, Sidebar↔Sheet,
  Detail zweispaltig→gestapelt, Medien-Fenster in **beiden** Themes dunkel.
- **LeitnerBoxes auf 7 Fächer** anpassen (ADR 0002 §3) — nicht 5.
- Default-Theme **Light „Warm/Atlas"** (Frame `3a`); Dark als Umschalter.

**Nicht-Ziele:** Neue Features/Datenänderungen.

**Definition of Done:** Screens entsprechen den Referenz-Frames; Responsive-Checkliste §14 ✔;
A11y-Pass §13 ✔ (aria-labels, Fokus-Ring, `prefers-reduced-motion`, radiogroup/aria-live im Quiz).

---

## Etappe 5 — Härtung & Feinschliff
**Ziel:** Produktionsreife.

**Kernpunkte:** vollständiger A11y-Audit; Performance (Bild-Lazy-Load, Route-Code-Splitting,
Lighthouse); Deploy-Härtung; Lizenz-/Quellen-/Datenschutz-Seite (aus V1 übernehmen, CC-BY-4.0-
Attribution vollständig); optional Offline/PWA. Release taggen (`v1.0`).

**Definition of Done:** Lighthouse A11y/Best-Practices grün; Deep-Link-Reload funktioniert live;
Attribution vollständig sichtbar; CHANGELOG + Tags aktuell.

---

## Abhängigkeiten
```
E0 ──▶ E1 ──▶ E2 ──▶ E3(a–e) ──▶ E4 ──▶ E5
                 ▲
        ADR 0002 (Vertrag) bindet E1, E2, E3c/d, E4
```
E2 vor E3, weil jeder Screen die Store-Verträge + die Kompatibilitätsschicht nutzt.
Innerhalb E3 sind 3a–3e parallelisierbar (getrennte Module), sobald E2 gemerged ist.

## Kompatibilitäts-Selbsttest (Definition of „migrationssicher")
Ein echter V1-Backup-Export liegt als Fixture im Repo. CI prüft in E2 dauerhaft:
**Import(V1-Datei) → State → Export → semantisch gleich**, und ein gelernter Karten-/XP-Stand
ergibt in V2 dasselbe Level und dieselbe Fälligkeit wie in V1. Bricht dieser Test, ist der
Vertrag verletzt — Merge blockiert.
