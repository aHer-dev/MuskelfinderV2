# Muskelfinder V2 — Agenten-Regeln

Muskel-Lern- & Nachschlage-App für Studierende (Physio/Ergo/Logopädie).
Statische Seite (Vite-Build, GitHub Pages). Solo-Projekt, KI-gestützt.
Single Source of Truth: docs/PROJECT_STATE.md · Strategie: ROADMAP.md · Architektur:
docs/architecture.md · Prozess: AGENT_WORKFLOW.md

## Start jedes Tasks
- Zuerst `docs/PROJECT_STATE.md` lesen. Sie ist der aktuelle kompakte Projektstand
  fuer alle Agenten.
- Wenn ein Task Status, Datenstand, Gate-Ergebnis, naechsten Schritt oder eine harte
  Entscheidung aendert: `docs/PROJECT_STATE.md` aktualisieren.

## Stack
- Vite + React 19 + TypeScript (strict)
- Lint: oxlint · Test: Vitest
- Kein Backend. Muskeldaten liegen als JSON im Repo.

## Befehle
- Dev:   npm run dev
- Test:  npm run test      (muss grün sein vor "fertig" — sobald Vitest steht)
- Lint:  npm run lint
- Build: npm run build
- **Verify: npm run verify** — das volle Gate (lint · test · check:daten · build ·
  check:oberflaeche · check:wege). **Vor jedem „fertig" laufen lassen.** Läuft auch bei
  jedem Push automatisch (`.github/workflows/verify.yml`).
  Einzeln: `check:daten` (Dateninvarianten + Kollisionsbericht für den Fachmann),
  `check:oberflaeche` (axe/Hover/Satzspiegel im Browser), `check:wege` (Schüler-Durchlauf).
  Warum es das gibt und was es NICHT kann: `docs/pruefstrategie.md`.

## Prüf-Regel (hart)
- **Jeder gefundene Fehler wird zu einer Zeile in einer der Prüfungen — nicht nur zu einem Fix.**
  Ein Fix repariert einen Fall; eine Prüfung lässt die Klasse aussterben.
- **Jede neue Prüfung gegentesten:** Fix zurückdrehen → Prüfung MUSS fallen → wiederherstellen.
  Eine Prüfung, die auch ohne den Fehler grün ist, prüft nichts.
- **Unit-Tests für Datenlogik laufen gegen den ECHTEN Bestand** (`getMuscles()`), nicht nur gegen
  Fixtures — Fixtures sind per Konstruktion sauber und verstecken genau die Datenfehler.

## Architektur-Grenzen (hart)
- Statische App, kein Server. Keine externen Laufzeit-Requests außer den Repo-Daten.
- UI-Komponenten und Datenschicht (Muskel-JSON laden/parsen) sauber trennen.
  Komponenten rendern, die Datenschicht liefert getypte Objekte — keine Parse-Logik in JSX.
- Zustand zentral halten (Store/Context), nicht über verstreute Modul-Globals.

## Konventionen
- TypeScript strict. Kein `any` in Kernpfaden.
- Keine `window.*`-Globals als State-Kanal.
- Conventional Commits. Branch pro Task, nie auf main committen.

## Pflichten pro Task
- Tests für neue Logik mitschreiben (Vitest). React-Pixel/Layout nicht unit-testen.
- CHANGELOG.md-Eintrag.
- Bei Architektur-Entscheidung: ADR in docs/decisions/.
- Briefing in docs/tasks/ befolgen; Nicht-Ziele respektieren.

## Verbote
- Keine fremden Modelle/Bilder ohne geklärte Lizenz einbauen.
  Bestehende Muskelbilder: BodyParts3D (DBCLS), CC BY 4.0 — Attribution Pflicht.
- Keinen toten/auskommentierten Code hinterlassen.
