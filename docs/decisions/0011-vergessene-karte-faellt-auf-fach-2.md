# ADR 0011 — Eine vergessene Karte fällt auf höchstens Fach 2

- Status: angenommen
- Datum: 2026-07-13
- Betrifft: `src/persistence/leitner.ts` (`applyWrong`, `applyExamMiss`)
- Berührt **nicht**: ADR 0002 (das Datenformat bleibt bitgleich)
- Beantwortet **nicht**: Frage 5 des Brainstormings (Leitner vs. SM-2/FSRS) — siehe unten

## Kontext

Der Projektinhaber fragte, was Anki denn besser mache. Beim Nachmessen am eigenen Code kam ein
Fehler heraus, der schwerer wiegt als der ganze Anki-Vergleich.

Bis zum 2026-07-13 fiel eine falsch beantwortete Karte **genau ein Fach** zurück. Mit den
Intervallen `1 · 3 · 7 · 14 · 30 · 90 · 180` heißt das gemessen:

| Ausgangslage | falsch beantwortet | wieder dran in |
|---|---|---|
| Fach 7 (sechsmal richtig gehabt) | → Fach 6 | **90 Tagen** |
| Fach 5 („gemeistert") | → Fach 4 | **14 Tagen** |

Ein Schüler beweist gerade, dass er den Muskel **nicht** weiß — und die App zeigt ihn ihm erst in
drei Monaten wieder. Das ist genau verkehrt herum.

**Es war nie echtes Leitner.** Sebastian Leitners Original wirft eine falsch beantwortete Karte
zurück in **Fach 1**. Das „ein Fach zurück" ist eine aufgeweichte Variante, die aus V1 übernommen
und nie hinterfragt wurde.

**Warum es kein Test gefangen hat:** Der einzige Rückfall-Test in `leitner.test.ts` startete in
**Fach 3** — und Fach 3 landet unter der alten *und* der neuen Regel bei Fach 2. Die reifen Fächer,
in denen der Fehler wehtat, waren schlicht nicht abgedeckt.

**Derselbe Fehler steckte einen Schritt tiefer in der Prüfung.** `applyExamMiss` stufte ebenfalls nur
ein Fach zurück. Eine in der Prüfung verpasste Karte aus Fach 7 landete auf Fach 6 — und **ein**
Treffer in der Debrief-Sitzung hob sie zurück auf Fach 7: **180 Tage weg, einen Tag nach der Prüfung,
in der sie gefehlt hat.**

## Entscheidung

Eine vergessene Karte fällt auf **höchstens Fach 2** (3 Tage) — und **immer mindestens ein Fach**.

```ts
export const LAPSE_FACH = 2;

export function lapseFach(fach: number): number {
  return Math.max(MIN_FACH, Math.min(fach - 1, LAPSE_FACH));
}
```

- **Höchstens Fach 2** behebt den 90-Tage-Fehler: Aus jedem Fach ≥ 3 landet die Karte in Fach 2.
- **Mindestens ein Fach runter** sorgt dafür, dass auch eine Karte in Fach 2 noch etwas zu verlieren
  hat — sonst wäre eine falsche Antwort dort folgenlos.
- **Eine Regel, zwei Aufrufer.** `applyWrong` *und* `applyExamMiss` benutzen `lapseFach`. Zwei
  getrennte Rückstufungs-Regeln wären genau der Weg, auf dem der Fehler beim ersten Mal entstanden
  ist.

Warum nicht Fach 1 (Leitners Original)? Weil ein einziger Patzer bei einer Karte, die man sechsmal
konnte, dann den kompletten Wiederaufstieg erzwingt. Fach 2 ist streng genug, um zu wirken, und
mild genug, um nicht zu bestrafen. Entscheidung des Projektinhabers.

## Was das NICHT ist

**Kein Bruch von ADR 0002.** Das Datenformat bleibt unangetastet: `fach` ist weiterhin eine Zahl von
1–7, `nextDue` weiterhin ein ISO-Datum, kein Feld kommt dazu oder fällt weg. Nur die
**Übergangsregel** ändert sich. Alte Backups laden unverändert; ein exportiertes Backup ist
strukturell identisch. Ein Test prüft genau das.

**Keine Antwort auf Frage 5 (Leitner vs. FSRS).** Anki fährt heute FSRS und führt pro Karte
*Schwierigkeit*, *Stabilität* und *Abrufwahrscheinlichkeit* — jede Karte bekommt ihr eigenes
Intervall, statt es aus einer festen Leiter zu ziehen. Das ist nach wie vor überlegen. Ein Wechsel
scheitert aber nicht am Backup-Format (das ließe sich additiv erweitern, wie bei `lookups`,
`profile`, `notes`, `streak`), sondern an **ADR 0008**: Die Abrufhärte (MC → Freitext) wird *aus dem
Leitner-Fach abgeleitet*. Ohne Fächer gibt es diese Ableitung nicht, und die Abzeichen (`fach ≥ 5`)
hängen ebenfalls daran. Das ist ein Umbau, kein Austausch.

**Der Aufwand lohnt bei dieser Deckgröße nicht:** FSRS spielt seinen Vorsprung bei Zehntausenden
Karten über Jahre aus. Bei 150 Muskeln über ein bis zwei Semester ist der Gewinn klein — der
90-Tage-Fehler war der teure Teil, und der ist jetzt weg.

## Konsequenzen

- Ein Abzeichen (`fach ≥ 5`) ist nach **einem** Patzer weg. Das entspricht der bereits erklärten
  Absicht aus 9b: *„Wer eine Karte vergisst, verliert das Abzeichen wieder. Das ist Absicht."*
- Der Aufstieg nach einem Fehler läuft normal weiter (2 → 3 → 4 …). Es ist keine Strafschleife.
- Der Guide (`/anleitung`) sagt es dem Schüler jetzt auch: „in wenigen Tagen wieder — egal, wie weit
  oben die Karte vorher lag."
