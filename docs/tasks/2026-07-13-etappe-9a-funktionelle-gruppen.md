# Task: Etappe 9a — Funktionelle Gruppen + Gruppen-Quiz

> **Zuerst lesen:** [Rahmen-Briefing Etappe 9](2026-07-13-etappe-9-uebersicht.md).

## Ziel
Geprüft wird in **Zusammenhängen**, nicht Muskel für Muskel: „Nenne die Rotatorenmanschette."
„Welche Muskeln beugen im Knie?" Die App kennt bisher nur Einzelmuskeln und topographische
Subregionen — die Gruppe als **Lern- und Prüfeinheit** fehlt.

Entscheidung **E2** (2026-07-12): **Ja, abgespeckt — ~12–15 kuratierte Gruppen, generiert + geprüft.**

## Kontext
- Branch: `feat/etappe-9a-funktionelle-gruppen`
- **Neu:** `src/data/editorial/groups.json` (handgepflegt) + `src/data/groups.ts` (reine Logik)
- Betroffen: [src/data/loader.ts](../../src/data/loader.ts) · [src/types/index.ts](../../src/types/index.ts) ·
  [src/data/quiz.ts](../../src/data/quiz.ts) (Gruppen-Modus) · Suche/Filter (optional)
- **Blaupause:** [src/data/etymology.ts](../../src/data/etymology.ts) — redaktionelle Datei außerhalb
  von `generated/`, vom Loader dazugemischt, defensiv gelesen, mit Test gegen die Migrations-Falle.

## ⚠️ Die Falle, die dich sonst das falsche Datenmodell kostet

**Subregionen sind KEINE funktionellen Gruppen.** Es gibt bereits **15** Subregionen (Schultergürtel,
Hand & Finger, Kaumuskulatur …) — die sind **topographisch**.

- „Rotatorenmanschette" ist keine Subregion, sondern **4 Muskeln innerhalb** des Schultergürtels.
- Ein Muskel gehört zu **mehreren** Gruppen: *M. supraspinatus* ist Rotatorenmanschette **und**
  Abduktor.

→ **Gruppen sind eine Many-to-Many-Dimension, keine Partition.** Wer sie als „zweite Subregion"
modelliert, muss es später neu bauen.

## Der Vorschlag wird generiert, die Wahrheit wird geprüft

Die Daten tragen die Rohstoffe schon: **126 Tags**, davon 58 mit ≥ 3 Muskeln — darunter genau die
funktionellen (`beuger` 25 · `strecker` 19 · `adduktor` 11 · `abduktor` 8 · `aussenrotator` 9 ·
`autochthon` 9 · `plantarflexion` 8 …), dazu `functions[]` und `joints[]`.

- [ ] Ein **Skript** (`scripts/propose-groups.mjs`) schlägt Gruppen aus Tags/Funktionen/Gelenken vor
      und schreibt einen **Bericht** — es schreibt **nicht** die Wahrheit.
- [ ] Der **Projektinhaber prüft und kuratiert** die Liste auf ~12–15 Gruppen. Erst dann landen sie in
      `groups.json`. **Nichts erfinden:** Eine falsche Gruppenzuordnung wird auswendig gelernt.
- [ ] Kandidaten, die fachlich naheliegen: Rotatorenmanschette · ischiocrurale Gruppe · Quadriceps ·
      Adduktorengruppe · Wadenmuskulatur/Triceps surae · autochthone Rückenmuskulatur · Bauchpresse ·
      Beckenboden · Kaumuskulatur · supra-/infrahyoidale Gruppe · Mimikmuskulatur · Daumenballen ·
      Unterarmflexoren/-extensoren.

## Anforderungen
- [ ] Datenmodell: `MuscleGroup { id, label, muscles: string[] (nameLatin), note? }`.
      Am Muskel **abgeleitet** verfügbar (`groupsOf(nameLatin)`), **nicht** doppelt gespeichert.
- [ ] Loader mischt die Gruppen dazu (Blaupause `withEtymology`). **Fehlt die Datei oder ein
      Eintrag, rendert alles unverändert** — kein leerer Kasten.
- [ ] **Validierung mit Zähnen:** Ein Gruppenmitglied, das es **nicht** als Muskel gibt (Tippfehler im
      `nameLatin`!), muss **im Test auffallen** — nicht still verschwinden. Schlüssel ist `nameLatin`
      (ADR 0002 §2), nicht die Routing-`id`.
- [ ] **Gruppen-Quizmodus:** „Welche Muskeln gehören zur Rotatorenmanschette?" (Mehrfachauswahl) oder
      „Welcher gehört NICHT dazu?" (Einfachauswahl). **Ein** Modus reicht — lieber einer, der trägt.
- [ ] **`quizSeriesKey` bleibt unangetastet.** Braucht der Gruppen-Modus eine eigene Serie, dann als
      **zusätzlicher** Key; der bestehende bleibt bitgleich (ADR 0002).
- [ ] Die Gruppe ist auf der Detailseite sichtbar („gehört zu: Rotatorenmanschette") und führt zu den
      anderen Mitgliedern.

## Nicht-Ziele
- **Keine 150 Muskeln in Gruppen zwängen.** Wer in keine Gruppe gehört, gehört in keine.
- Keine Hierarchie/Verschachtelung von Gruppen. Flache Liste.
- Keine Abzeichen (das ist 9b) und keine Änderung an der Leitner-Logik.
- Keine automatisch erzeugten Gruppen **ohne** fachliche Prüfung.

## Definition of Done
- [ ] Vorschlags-Skript + **Bericht**, den der Projektinhaber prüfen kann
- [ ] **Erste Charge (~12–15 Gruppen) fachlich freigegeben** — sonst ist der Task nicht fertig
- [ ] Test: Loader-Merge (Muskel **mit** Gruppe, **ohne** Gruppe, Datei ganz leer)
- [ ] Test: **Ein unbekannter `nameLatin` in `groups.json` lässt den Test scheitern** (kein stilles Schlucken)
- [ ] Test: `npm run migrate:data` **löscht die Gruppen nicht** (real ausführen, wie in 8d)
- [ ] Test: `quizSeriesKey` ohne Filter ist **exakt** der bisherige Key (ADR 0002)
- [ ] axe: 0 Verstöße (Light + Dark)
- [ ] Gate grün · CHANGELOG · **Statustafel 9a auf `fertig`** · PROJECT_STATE nachgezogen
