# Task: Etappe 9b — Kompetenz-Abzeichen

> **Zuerst lesen:** [Rahmen-Briefing Etappe 9](2026-07-13-etappe-9-uebersicht.md).
> **Gate: 9a muss fertig sein.** Ohne funktionelle Gruppen gibt es nur hohle Aktivitäts-Abzeichen —
> die lassen wir dann weg.

## Ziel
Abzeichen messen **Kompetenz, nicht Aktivität**. Nicht „7 Tage am Stück!", sondern:

> **„Rotatorenmanschette komplett"** — alle 4 Muskeln der Gruppe stehen in Fach ≥ 5.
> **„Alle Innervationen der oberen Extremität"**

Das ist der Unterschied zwischen einem Abzeichen, auf das man stolz sein kann, und einem, das man
fürs Dasitzen bekommt.

## Kontext
- Branch: `feat/etappe-9b-abzeichen`
- **Neu:** `src/data/badges.ts` (reine Ableitung) + Anzeige unter *Fortschritt*
- Wiederverwenden:
  - `groupsOf()` aus 9a
  - `MASTERED_FACH` aus [leitner.ts](../../src/persistence/leitner.ts)
  - [practice.ts](../../src/data/practice.ts) — für den Weg **zum** Abzeichen (siehe unten)

## ⚠️ Die harte Regel: **nichts speichern**

Ein Abzeichen ist eine **Ableitung** aus (Gruppe × Leitner-Box), kein Zustand:

```ts
verdient(gruppe) = alle Muskeln der Gruppe haben fach >= MASTERED_FACH
```

Wer „verdiente Abzeichen" persistiert, baut eine **zweite Wahrheit**, die mit der Box auseinanderläuft
(ADR 0008) — und einen neuen Backup-Key, den ältere Versionen nicht kennen (ADR 0002). **Beides
verboten.** Der Nebeneffekt ist ein Feature: Wer eine Karte vergisst, verliert das Abzeichen wieder —
**genau so soll es sein.** Kompetenz ist kein Besitz.

## Anforderungen
- [ ] `badges(cards, groups): Badge[]` — rein, getestet. `Badge { id, label, total, mastered, earned }`.
- [ ] Anzeige: verdient / **wie weit noch** („Rotatorenmanschette · 3 von 4"). Der Fortschritt ist
      der interessante Teil, nicht der Pokal.
- [ ] **Keine Zahl ohne Knopf** (Regel aus 8c): Neben jedem *nicht* verdienten Abzeichen steht die
      Aktion, die dorthin führt — „Die fehlende Karte üben" (Sitzung mit genau den Muskeln der Gruppe,
      die noch unter Fach 5 sind). **Nur fällige Karten** (sonst startet der Knopf eine leere Sitzung —
      die Falle aus 8c!). Ist nichts fällig, ist der Knopf deaktiviert **mit Begründung**.
- [ ] Nüchterne Gestaltung: Tokens, kein Konfetti, kein Maskottchen (Rahmen-Invariante 7).
- [ ] Beim Verdienen **ein** dezenter Toast — kein Feuerwerk, `prefers-reduced-motion` respektieren.

## Nicht-Ziele
- **Keine Aktivitäts-Abzeichen** („10 Sitzungen", „100 Karten"). Die misst der Streak (7f) schon, und
  sie sagen nichts über Können.
- Kein persistierter Abzeichen-Zustand, keine „verdient am"-Historie.
- Keine Punkte/Level neben XP (das gibt es schon).

## Definition of Done
- [ ] Test: Ein Abzeichen ist verdient ⇔ **alle** Gruppenmuskeln in Fach ≥ 5
- [ ] Test: **Fällt eine Karte zurück, ist das Abzeichen wieder weg** (die Ableitung trägt, es gibt
      keinen gespeicherten Rest)
- [ ] Test: **Kein neuer persistierter Key** — der Backup-Round-Trip gegen die V1-Fixtures ist
      unverändert grün, das Backup enthält **keine** Abzeichen-Sektion
- [ ] Test: Der CTA neben einem offenen Abzeichen startet eine Sitzung mit **genau** den fehlenden,
      **fälligen** Karten
- [ ] axe: 0 Verstöße (Light + Dark); „verdient" ist nicht nur farbcodiert
- [ ] Gate grün · CHANGELOG · **Statustafel 9b auf `fertig`** · PROJECT_STATE nachgezogen
