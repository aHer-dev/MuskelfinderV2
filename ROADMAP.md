# Muskelfinder V2 — Roadmap

> *Was* bauen wir und in *welcher* Reihenfolge. Strategie-Ebene, ändert sich selten.
> Das *Wie* der Agenten steht in AGENT_WORKFLOW.md, die *konkreten* Aufgaben in docs/tasks/.
> **Der detaillierte Etappenplan (mit Umfang, DoD, Abhängigkeiten) steht in
> [docs/migration-plan.md](docs/migration-plan.md).** Diese Datei ist die Kurzfassung.

## Vision
Modernisierung der bestehenden statischen Vanilla-App (V1) zu einer komponentenbasierten,
modularen und ausbaubaren React-App — **weiterhin statisch, ohne Backend, auf GitHub Pages**.
Nachschlagewerk + Lern-Tool für Studierende (Physio/Ergo/Medizin): Suche, Muskel-Detail,
Lernkarten (Leitner), Quiz, Statistik/Gamification.

## Rahmen (unverhandelbar)
- **Statisch**, kein Backend; Deploy als statische Seite (isolierte Origin/eigene Domain).
- **Speicherdatei-Kompatibilität**: bestehende Backup-Dateien der Schüler bleiben import-/
  exportierbar — Vertrag in [ADR 0002](docs/decisions/0002-persistenz-und-datenkompatibilitaet.md).
- **Kern zuerst, Design danach.** Erst funktioniert die App, dann kommt das Hi-Fi-Design aus `Planung/`.
- Keine Altlast: kein XLSX-Wrapper, kein Multipage-HTML, keine `window.*`-Globals.

## Phasen (Details → docs/migration-plan.md)

### Etappe 0 — Fundament & Infrastruktur
Vitest, React Router (Hash) + Zustand, `theme.css`/`fonts.css`/`types.ts` aus `Planung/`,
Icon-Sprite, CI/Deploy nach GitHub Pages, App-Shell-Skelett. Kern-Scaffold steht bereits.

### Etappe 1 — Datenschicht & Migration
V1-Daten (4 Region-JSONs) sauber nach `Muscle`-Typ migrieren, XLSX-Wrapper entfernen,
Bilder + Attribution übernehmen, Loader + Validierung (getestet).

### Etappe 2 — Persistenz- & Kompatibilitätskern ★
Backup Import/Export nach ADR 0002 + persistierte Stores (Leitner 7, XP-Kurve).
Steht **vor** den Screens. Getestet gegen echte V1-Backup-Fixtures.

### Etappe 3 — Funktionaler Kern (un-poliert)
Suche/Filter · Detail · Lernkarten · Quiz · Statistik — funktional, tokenbasiert, noch nicht pixelgenau.

### Etappe 4 — Design-Umsetzung (Hi-Fi)
Marken-Design aus `Planung/` pixelgenau: Primitives, AppShell/Rail/TabBar, Responsive, A11y,
Light/Dark (Default Light). LeitnerBoxes auf 7 Fächer.

### Etappe 5 — Härtung & Feinschliff
A11y-Audit, Performance, Deploy-Härtung, Lizenz-/Quellen-Seite, Release-Tag.
