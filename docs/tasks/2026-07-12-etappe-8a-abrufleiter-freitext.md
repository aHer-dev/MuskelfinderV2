# Task: Etappe 8a — Abrufleiter + Freitext-Stufe

> **Zuerst lesen:** [Rahmen-Briefing Etappe 8](2026-07-12-etappe-8-uebersicht.md) — dort stehen das
> Problem, die Invarianten und die zwei Fallen, die im Produktplan falsch beschrieben sind.

## Ziel
**Wiedererkennen ist nicht Können.** Die Abrufhärte wächst mit der Beherrschung: Wer eine Karte im
Fach 7 hat, bekommt kein Multiple Choice mehr, sondern muss den Namen **tippen**.

Durch Entscheidung **E1** ist das kein Extra, sondern der Kern dieser Etappe: Trainiert wird der
freie Abruf, weil in der Prüfung keine Auswahl danebensteht.

## Kontext
- Branch: `feat/etappe-8a-abrufleiter`
- Neu: `src/data/answer-check.ts` + `answer-check.test.ts` (reine Logik)
- Neu: eine Freitext-Karte in der Session (Komponente unter
  `src/components/features/flashcards/`)
- Wiederverwenden (**nicht duplizieren**):
  - [src/persistence/leitner.ts](../../src/persistence/leitner.ts) — `FACH_INTERVALS`, `MASTERED_FACH`,
    `applyCorrect`/`applyWrong`. **Die Box ist die einzige Wahrheit** (ADR 0008).
  - [src/store/useSessionStore.ts](../../src/store/useSessionStore.ts) — die laufende Sitzung.
  - [src/data/explain.ts](../../src/data/explain.ts) — Muster, wie man Feedback aus Daten *komponiert*.
- Doku: [ADR 0008](../decisions/0008-abrufstufen-aus-leitner-box.md)

## Die Leiter (aus der Box abgeleitet, nichts Neues gespeichert)

| Fach | Abrufform | Status |
|------|-----------|--------|
| 1–2 | Multiple Choice (4 Optionen) | vorhanden (`QuizPage`) |
| 3–4 | Bild ↔ Name zuordnen | vorhanden (`name-image`) |
| 5–6 | Freier Abruf, Selbstbewertung | vorhanden (`FlashcardsPage`) |
| 7 | **Produktion — tippen** | **neu, dieser Task** |

## Anforderungen
- [ ] `recallStage(fach): RecallStage` — reine Funktion, **abgeleitet**, nirgends persistiert.
- [ ] `checkAnswer(input, expected): AnswerVerdict` in `src/data/answer-check.ts` — rein und getestet.
      Der Verdict ist getypt (`'correct' | 'almost' | 'wrong'`), **kein fertiger Satz** (Formulierung
      gehört ins UI).
- [ ] **Normalisierung** vor dem Vergleich: Groß/Klein, Diakritika, Mehrfach-Leerzeichen,
      `M.` / `Mm.` / `Musculus` / `Musculi`, Bindestriche, Klammerzusätze.
- [ ] **Tippfehler-Toleranz** (z. B. Levenshtein ≤ 1–2, abhängig von der Wortlänge) → `'almost'`:
      angenommen, aber sichtbar korrigiert („Fast — richtig geschrieben: …").
- [ ] **Bedeutungsfehler sind NIE tolerant** (Invariante 5): `longus` ≠ `brevis`, `major` ≠ `minor`,
      `medialis` ≠ `lateralis`, `superficialis` ≠ `profundus`, `dexter` ≠ `sinister`.
      Diese Paare müssen den Vergleich hart scheitern lassen, **auch wenn die Levenshtein-Distanz
      klein ist** — `brevis`/`longus` unterscheiden sich in vielen Buchstaben, aber
      `major`/`minor` liegen gefährlich nah beieinander.
- [ ] Die Freitext-Karte sitzt **in der bestehenden Session** (`useSessionStore`), nicht in einem
      neuen Modus. Bewertung: `correct` → `applyCorrect`, `wrong` → `applyWrong`. Ein Freitext-Fehler
      ist eine **normale Leitner-Rückstufung**, keine Extra-Strafe.
- [ ] Eingabe per Tastatur vollständig bedienbar (Enter = prüfen, Enter = weiter).
- [ ] Die zehn bestehenden Quizmodi bleiben als **„Freies Üben"** unter *Lernen* erhalten.

## Nicht-Ziele
- Keine Spracheingabe, keine Handschrift. Freitext heißt tippen.
- **Kein neuer persistierter Schlüssel.** Die Stufe wird abgeleitet — wer sie speichert, bricht
  ADR 0008 und ADR 0002.
- Kein Timer, keine Zeitmessung (das ist der Prüfungsmodus, 9c).
- Keine Änderung an Leitner-Intervallen oder der XP-Kurve.

## Definition of Done
- [ ] **Fixture-Tabelle** im Test: je eine Zeile pro Normalisierungsregel und pro
      Bedeutungsfehler-Paar. Explizit als **False-Positive-Test**: `M. flexor digitorum longus`
      darf nicht als `… brevis` durchgehen, `M. gluteus major` nicht als `… minor`.
- [ ] Deutsche Namen (`nameDE`) werden ebenfalls akzeptiert, wo vorhanden
- [ ] Leitner-Box bleibt einziger persistierter Schlüssel — **Backup-Round-Trip grün**
- [ ] axe: 0 Verstöße auf der Freitext-Karte (Light + Dark); das Feld hat ein Label, das Ergebnis
      ist nicht nur farbcodiert
- [ ] Gate grün · CHANGELOG · **Statustafel 8a auf `fertig`** · PROJECT_STATE nachgezogen
