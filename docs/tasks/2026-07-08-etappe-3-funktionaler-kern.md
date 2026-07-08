# Task: Etappe 3 — Funktionaler Kern (un-poliert)

## Ziel
Alle fünf Screens funktionieren end-to-end auf Basis von Etappe 1+2 — tokenbasiert,
aber ohne Pixel-Feinschliff. Man kann suchen → Detail öffnen → Karte lernen → Quiz spielen →
Fortschritt in Statistik sehen → Backup exportieren/importieren.

## Kontext
- Branch: `feat/etappe-0-fundament` (Etappe 0–2 noch uncommittet)
- Betroffene Module: `src/data/{search,filterUrl,labels,quiz,stats}.ts`, `src/store/useFilterStore.ts`,
  `src/hooks/{useMuscleSearch,useDebouncedValue,useFlashcardSession,useQuizGame,useStats}.ts`,
  `src/components/features/{search,detail,flashcards,quiz,stats}/*`, `src/components/ui/*`,
  `src/pages/*`, `src/styles/components.css`.
- Relevante Doku: ROADMAP Phase 3, migration-plan §Etappe 3, ADR 0002/0006.

## Sub-Tasks (getrennte Modulgrenzen)
- [x] **3a Suche & Filter:** `useFilterStore` (Session, nicht persistiert), `useMuscleSearch`
      (debounced, Fuzzy über nameLatin + DE/Tags, diakritika-tolerant), Region/Gelenk/Bewegung/
      Innervation-Filter, Sortierung, deep-linkbare URL (Filter ↔ Query-Params).
- [x] **3b Muskel-Detail:** DataList, Fachlich/Einfach-Umschalter, ImageViewer (Attribution sichtbar,
      CC BY 4.0), Collection-Toggle (persistiert), „Zu Lernkarten" (Karte nach nameLatin).
- [x] **3c Lernkarten:** Leitner-Session gegen `useProgressStore` (Bewertung verschiebt Fach +
      nextDue, XP greift; unsicher re-queued).
- [x] **3d Quiz:** 4 MC-Modi (deterministisch generiert), Serie/Score/Reveal/Ergebnis; Serien-
      Statistik schreibt ins kompatible `quizSeries`-Format (`useQuizStore`).
- [x] **3e Statistik:** Level/XP/Karten-Breakdown/Region-Mastery/Quiz aus den Stores **abgeleitet**
      (Selektoren, keine Doppel-State); Backup-Panel (Export/Import) bindet den E2-Kern an die UI.

## Nicht-Ziele
- Pixelgenaues Design, Glassmorphism, finale Responsive-/A11y-Politur (Etappe 4).
- Neue Daten/Modelle.

## Definition of Done
- [x] Such-/Filter-/URL-Serialisierung, Leitner-Session, Quiz-Generierung/-Auswertung und
      Statistik-Ableitung getestet.
- [x] lint + test + build grün (132 Tests).
- [x] Nur Tokens (theme.css); neue semantische Tokens `--success`/`--danger` ergänzt.
- [x] CHANGELOG-Eintrag; PROJECT_STATE aktualisiert.
