# Task: Funktion in Kurzform — Text aufklappbar (Etappe 15)

## Ziel
Unter „Funktion" steht kurz Gelenk → Bewegungen („Hüftgelenk (Art. coxae): Extension ·
Außenrotation"). Der ausformulierte Text klappt als „Funktionsbeschreibung" darunter auf.
Im Quiz landet die Kurzform, nicht der Text.

## Kontext
- Branch: feat/etappe-15-funktion-kurzform
- Auftrag: Projektinhaber, 2026-09-27 („den Bereich Funktion wirklich kurz und knapp,
  dann einen Extra-Bereich Funktionsbeschreibung")
- Entscheidung: ADR 0013
- Betroffene Module: `src/data/funktion-kurz.ts`, `src/data/editorial/funktion-kurz.json`,
  `src/data/muscle-fields.ts`, `src/data/quiz.ts`, `src/data/explain.ts`,
  `src/components/ui/FunktionsBeschreibung.tsx`, Detailseite, Lernkarte, ExplainSheet,
  `scripts/check-data.mjs`, `scripts/export-csv.mjs`

## Anforderungen
- [x] Kurzform je Gelenk für alle 150 Datensätze (KI-Entwurf, status „ungeprueft")
- [x] Kurzform verdichtet nur den Funktionstext — nichts dazuerfinden
- [x] Muskeln ohne Gelenkbewegung: Kurzform der Wirkung aus dem Text
- [x] Funktionsbeschreibung aufklappbar (Detailseite, Lernkarte, Quiz-Erklärung)
- [x] Quiz „Muskel → Funktion" und „Funktion → Muskel" stellen die Kurzform
- [x] Ungeprüft → Stern am Label mit Legende
- [x] Prüfbogen `funktion-kurzform.csv`, Bericht in `check:daten`

## Nicht-Ziele
- Die Kurzformen fachlich abnehmen — das macht der Projektinhaber über die CSV.
- `functions` (Filter-Schlüssel der Suche) umbauen oder mit der Kurzform abgleichen.
- `joints` korrigieren, wo der Bericht Lücken zeigt — erst nach fachlicher Entscheidung.
- Die Funktions-Chips auf den Suchkarten (`MuscleCard`).

## Definition of Done
- [x] Tests für neue Logik vorhanden und grün (gegen den echten Bestand)
- [x] lint + build grün, `npm run verify` grün
- [x] ADR 0013, CHANGELOG, PROJECT_STATE
