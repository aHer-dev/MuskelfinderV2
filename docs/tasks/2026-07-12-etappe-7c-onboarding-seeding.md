# Task: Etappe 7c — Onboarding in zwei Fragen + Auto-Seeding des Karteikastens

> **Zuerst lesen:** [Rahmen-Briefing Etappe 7](2026-07-12-etappe-7-uebersicht.md).

## Ziel
Der leere Karteikasten verschwindet als Problem. Nach dem ersten Öffnen hat die Studentin ein
sinnvolles Startdeck — **ohne eine Verwaltungsseite zu öffnen** — und bewertet ihre erste Karte
in unter 60 Sekunden.

## Kontext
- Branch: `feat/etappe-7c-onboarding-seeding`
- Vorher fertig: **7a** (Engine, kennt den Zustand `needsOnboarding`), **7b** (Route `/heute`).
- Betroffen:
  - neu: `src/data/seeding.ts` + Tests (reine Logik)
  - neu: `src/components/features/onboarding/` (die zwei Screens)
  - `src/store/useCollectionStore.ts` (Karteikasten befüllen — bestehende API nutzen, nicht umbauen)
  - ein neuer, kleiner Store bzw. persistierter Slice für Profil (Profession, Prüfungsdatum)
- Doku: [ADR 0007](../decisions/0007-einstieg-und-informationsarchitektur.md),
  [ADR 0002](../decisions/0002-persistenz-und-datenkompatibilitaet.md) (Persistenz **additiv**)

## Anforderungen
- [ ] **Genau zwei Fragen**, keine Tutorial-Slides, kein Konto:
      1. „Was lernst du?“ → **Physiotherapie · Ergotherapie · Logopädie**
      2. „Wann ist deine Prüfung?“ → Datum, **überspringbar**
- [ ] `seedDeck(profession, muscles): string[]` in `src/data/seeding.ts` — reine Funktion:
      - **Logopädie** → Kopf/Hals zuerst (mimische Muskulatur, Kau-, Zungen-, Kehlkopfmuskulatur)
      - **Ergotherapie** → obere Extremität und Hand zuerst
      - **Physiotherapie** → Extremitäten und Rumpf zuerst
      - innerhalb der Region: **leichte Muskeln zuerst** (vorhandene Schwierigkeit 1→3)
      - Startdeck ist **klein und schaffbar** (Größenordnung 15–25 Karten), nicht 150 auf einen Schlag
- [ ] Profession und Prüfungsdatum werden persistiert und von 7a gelesen (Tagesdosis rechnet mit
      dem Datum, falls gesetzt).
- [ ] Nach dem Onboarding landet die Nutzerin **direkt in der ersten Session**, nicht auf einer
      Bestätigungsseite. Erster XP-Gewinn vor Sekunde 60.
- [ ] Onboarding erscheint **nur beim Erststart** (Kasten leer und Profil nicht gesetzt) und ist
      später über *Fortschritt* wiederholbar (Profession ändern).

## Nicht-Ziele
- **Keine Semester-/Curriculum-Sequenz.** Entscheidung E4 steht vorläufig auf „adaptiver Empfehler“
  (siehe Statustafel). Eine feste Reihenfolge wäre später additiv nachrüstbar.
- Keine funktionellen Gruppen als Seeding-Grundlage — die gibt es noch nicht (Etappe 9, blockiert).
- Kein Umbau des Karteikastens oder der `DeckManagerPage`.

## Definition of Done
- [ ] `seedDeck` getestet: **jede** Profession bekommt ein nicht-leeres, plausibles Startdeck;
      ein Logopädie-Erstsemester bekommt **nie** den M. gluteus maximus als erste Karte
- [ ] Persistenz ist **additiv** — der Backup-Round-Trip-Test gegen die V1-Fixtures bleibt grün
- [ ] axe: 0 Verstöße auf den Onboarding-Screens (Light + Dark)
- [ ] Gate grün · CHANGELOG · **Statustafel 7c auf `fertig`** · PROJECT_STATE nachgezogen
