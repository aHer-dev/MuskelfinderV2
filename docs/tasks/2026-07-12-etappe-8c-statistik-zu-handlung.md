# Task: Etappe 8c — Statistik wird handlungsfähig (Brücke B4)

> **Zuerst lesen:** [Rahmen-Briefing Etappe 8](2026-07-12-etappe-8-uebersicht.md).

## Ziel
**Keine Zahl ohne Knopf.** Die Statistik weiß seit Etappe 3, dass die Schulter bei 41 % steht — und
sagt es der Studentin, ohne ihr zu helfen. Das ist die letzte offene Brücke: **B4 — Fortschritt →
Handlung.**

> „Unterarmflexoren 41 % — **10 Karten dazu**"

## Kontext
- Branch: `feat/etappe-8c-statistik-handlung`
- Betroffen:
  - [src/pages/StatsPage.tsx](../../src/pages/StatsPage.tsx)
  - [src/components/features/stats/](../../src/components/features/stats/)
- Wiederverwenden (**nicht duplizieren** — das ist die halbe Aufgabe):
  - [src/data/stats.ts](../../src/data/stats.ts) — `regionMastery`, `quizByMode`,
    `nextMasteryMilestone`, `cardBreakdown` liegen fertig und getestet da.
  - [src/data/today.ts](../../src/data/today.ts) — die Priorisierung (schwächste Region, Verzug,
    Nachschlage-Häufigkeit) ist gelöst. Ein CTA soll **dieselbe** Auswahl treffen, keine zweite.
  - **Der Sprung in die Session ist bereits gebaut:** `/heute` übergibt eine vorpriorisierte
    Namensliste an `/lernkarten` (`SessionOptions.names` + `readSessionHandoff` in
    [src/store/useSessionStore.ts](../../src/store/useSessionStore.ts)). Ein CTA ist damit ein
    `navigate('/lernkarten', { state: { start: { names, limit: 0, scope: 'all' } } })` — mehr nicht.

## Anforderungen
- [ ] **Jeder** Statistik-Block, der eine Schwäche ausweist, bekommt genau **eine** Aktion daneben:
      - Region-Beherrschung → „Diese Region üben" (Session mit den fälligen Karten der Region)
      - Quiz-Bilanz je Modus (schwächster Modus) → „Diesen Modus üben"
      - Karten im Fach 1–2 („neu") → „Die schwachen Karten üben"
      - Meilenstein („noch 3 bis 25 gemeisterte") → die Karten, die dem am nächsten sind
- [ ] Die Auswahl hinter jedem CTA ist ein **reiner Selektor in `src/data/`**, getestet — kein
      Filtern im JSX.
- [ ] **Kein CTA ins Leere:** Gibt es nichts zu tun (Region hat keine fälligen Karten), ist der Knopf
      nicht sichtbar oder deaktiviert **mit Begründung** — nie ein Klick, der nichts bewirkt.
- [ ] Die Sprache bleibt nüchtern und schuldfrei: „41 % — hier lohnt sich Zeit", nicht „Schwachstelle!".

## Nicht-Ziele
- Keine neuen Kennzahlen, keine neuen Diagramme. **Diese Etappe fügt Knöpfe hinzu, keine Zahlen.**
- Keine Änderung an der Quiz-Auswertung oder den Serien-Schlüsseln (ADR 0002).
- Keine Abzeichen (die brauchen die funktionellen Gruppen, Etappe 9).

## Definition of Done
- [ ] Test: **Kein** Statistik-Block ohne CTA (oder mit begründet deaktiviertem CTA)
- [ ] Test: Ein CTA startet eine Session mit **genau** den Karten, die er verspricht
- [ ] Selektoren aus `stats.ts`/`today.ts` wiederverwendet, nicht dupliziert (im Review nachweisen)
- [ ] axe: 0 Verstöße (Light + Dark)
- [ ] Gate grün · CHANGELOG · **Statustafel 8c auf `fertig`** · PROJECT_STATE nachgezogen
