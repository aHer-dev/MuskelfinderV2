# Task: Etappe 8b — Session-Filter „nur falsch beantwortete" / „nie gesehen"

> **Zuerst lesen:** [Rahmen-Briefing Etappe 8](2026-07-12-etappe-8-uebersicht.md).

## Ziel
Gezielt an den Lücken üben statt am ganzen Deck. Zwei Filter, mehr nicht: **„nur falsch
beantwortete"** und **„nie gesehen"**.

## Kontext
- Branch: `feat/etappe-8b-session-filter`
- Betroffen:
  - [src/store/useSessionStore.ts](../../src/store/useSessionStore.ts) — `SessionOptions` erweitern
    (additiv, wie es 7b mit `names` gemacht hat)
  - [src/pages/FlashcardsPage.tsx](../../src/pages/FlashcardsPage.tsx) — Setup-Screen
  - ggf. [src/data/today.ts](../../src/data/today.ts) — die Engine kennt die Auswahl schon

## ⚠️ Der Produktplan liegt hier falsch — lies das, bevor du suchst

Der Plan behauptet, die Daten lägen „bereits in `useQuizStore`". **Das stimmt nicht.**
`useQuizStore` hält ausschließlich Aggregate je Serien-Key (`rounds`/`answers`/`correct`/`history`)
— **keine Fehler je Muskel.**

Was du brauchst, steht in der **Karte** ([src/persistence/types.ts](../../src/persistence/types.ts),
`FlashcardCard`), also im `useProgressStore`:

| Filter | Quelle |
|--------|--------|
| „nur falsch beantwortete" | `totalWrong > 0` (ggf. verschärft: `totalWrong > totalCorrect`) |
| „nie gesehen" | `lastSeen === null` |
| „schwierig markiert" (bereits vorhanden) | `difficult === true` |

Das ist eine gute Nachricht: Die Daten sind schon persistiert und ADR-0002-konform. Es muss **nichts
Neues gespeichert** werden.

## Anforderungen
- [ ] Filter als **reine Selektoren** in `src/data/` (nicht im Store, nicht im JSX), getestet.
- [ ] `SessionOptions` additiv um den Filter erweitern; `buildQueue` respektiert ihn. Die
      Vorpriorisierung aus 7a/7b (`names`) darf dabei **nicht** verlorengehen.
- [ ] Im Setup-Screen sichtbar, **welcher** Filter aktiv ist und **wie viele** Karten er übrig lässt
      („nur falsch beantwortete · 12 Karten") — ein Filter, der still ins Leere greift, ist eine Falle.
- [ ] Greift ein Filter ins Leere, gibt es **keinen leeren Screen**, sondern den `EmptyState` mit CTA
      (Rahmen-Invariante aus Etappe 7 gilt weiter).
- [ ] Die Filter sind auch für das Quiz nutzbar (Pool-Einschränkung) — **aber:**

## Nicht-Ziele / harte Grenze
- **`quizSeriesKey` darf sich nicht verändern.** Ein Filter darf den V1-kompatiblen Serien-Schlüssel
  **nicht** anfassen (ADR 0002, [src/data/quiz.ts](../../src/data/quiz.ts)). Wenn ein gefiltertes Quiz
  eine eigene Serie braucht, dann als **zusätzlicher** Key — der bestehende bleibt bitgleich.
- Keine neuen persistierten Felder. Alles ist ableitbar.
- Kein Umbau des Karteikastens.

## Definition of Done
- [ ] Selektoren getestet, inkl. Leerfall (kein Treffer) und Kombination mit dem Bereichsfilter
- [ ] Test: `quizSeriesKey` ohne Filter ist **exakt** der bisherige Key (Regression gegen ADR 0002)
- [ ] Backup-Round-Trip gegen die V1-Fixtures grün
- [ ] Gate grün · CHANGELOG · **Statustafel 8b auf `fertig`** · PROJECT_STATE nachgezogen
