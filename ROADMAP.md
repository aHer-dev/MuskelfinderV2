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

### Etappe 6 — V1-Parität
Gap-Analyse V1↔V2, alle Lern-Features zurück (Karteikasten-Verwaltung, vollständiger
Lernkarten-Ablauf, Quiz-Modi, Statistik, 3D-Verknüpfung). **Abgeschlossen, `v1.0` getaggt.**

---

# Teil 2 — Produkt: vom Nachschlagewerk zum Coach

> Die Migration ist fertig — die App **kann** alles, was V1 konnte. Teil 2 beantwortet die nächste
> Frage: **warum die Studentin sie morgen wieder öffnet.**
> **Detaillierter Plan mit Statustafel → [docs/produkt-plan.md](docs/produkt-plan.md).**

**Befund (drei unabhängige Recherche-Berichte, [docs/Brainstorming.txt](docs/Brainstorming.txt)):**
Die App ist eine Bibliothek, keine Lernbegleitung. Sie öffnet auf einer Liste mit 150 Muskeln,
der Karteikasten muss von Hand befüllt werden, die Statistik zeigt Zahlen ohne Empfehlung. Der
einzige uneinholbare Vorteil — **Nachschlagewerk und Lernwerkzeug in einer App** — wird nicht genutzt.

**Nordstern:** Beim Öffnen genau *ein* Vorschlag — „Heute dran“.

### Etappe 7 — Die App bekommt eine Meinung ★
Einstiegsroute `/heute` mit Empfehlung ([ADR 0007](docs/decisions/0007-einstieg-und-informationsarchitektur.md)),
Onboarding in zwei Fragen mit Auto-Seeding des Karteikastens, persistentes Suchfeld,
„Zuletzt nachgeschlagen → als Karten lernen“, Falschantworten erklären sich, Streak mit Freeze.
*Keine offene Entscheidung blockiert diese Etappe.*

### Etappe 8 — Die App wird schwerer, wenn du besser wirst
Abrufhärte wächst mit der Leitner-Box, inkl. Freitext-Stufe
([ADR 0008](docs/decisions/0008-abrufstufen-aus-leitner-box.md)). Session-Filter „nur falsch
beantwortete“. Statistik bekommt Handlungsknöpfe. Etymologie/Eselsbrücken, eigene Notizen,
Platzhalter für bildlose Muskeln.

### Etappe 9 — Die App wird prüfungsnah *(gated)*
Funktionelle Gruppen, kompetenzbasierte Abzeichen, Prüfungsmodus mit Debrief-Schleife, Palpation.
**Wartet auf Entscheidungen E1–E3** (reale Prüfungsform · Gruppen-Annotation · Palpations-Relevanz)
— siehe Statustafel in docs/produkt-plan.md.
