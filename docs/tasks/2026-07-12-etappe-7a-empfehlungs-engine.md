# Task: Etappe 7a — Empfehlungs-Engine („Heute dran“)

> **Zuerst lesen:** [Rahmen-Briefing Etappe 7](2026-07-12-etappe-7-uebersicht.md) — dort stehen das
> Problem, der Nordstern und die Invarianten, die für alle Tasks der Etappe gelten.

## Ziel
Die Datenschicht kann beantworten, **was die Studentin heute tun soll** — als getyptes
`TodayPlan`-Objekt. Reine Logik, kein UI. Das ist die Wurzel von Etappe 7: ohne sie gibt es
keinen Heute-Screen.

## Kontext
- Branch: `feat/etappe-7a-empfehlungs-engine`
- Neu: `src/data/today.ts`, `src/data/today.test.ts`
- Wiederverwenden (nicht duplizieren!): `src/persistence/leitner.ts` (Fälligkeit, 7 Fächer),
  `src/data/stats.ts` (Regionen-Beherrschung, `quizByMode`, `nextMasteryMilestone`),
  `src/data/loader.ts` (Muskeln, Regionen, Schwierigkeit)
- Relevante Doku: [docs/produkt-plan.md](../produkt-plan.md) (Statustafel + Etappe 7),
  [ADR 0007](../decisions/0007-einstieg-und-informationsarchitektur.md)

## Anforderungen
- [ ] `getTodayPlan(state): TodayPlan` — eine reine Funktion, keine Store-Imports im Modul selbst
      (Stores werden von außen hineingereicht, damit die Funktion testbar bleibt).
- [ ] `TodayPlan` enthält mindestens:
      `dueCards` (Karten, fällig nach Leitner), `focusRegion` (schwächste Region mit fälligen Karten),
      `estimatedMinutes`, `newSuggestions` (Muskeln, die noch nicht im Kasten sind, nach Pfad/Schwierigkeit),
      `headline`/`reason` als **getypte Daten**, nicht als fertiger Text (Formulierung gehört ins UI).
- [ ] **Jeder Zustand hat einen Vorschlag.** Vier Fälle sind explizit abzudecken:
      1. Normalfall (fällige Karten vorhanden)
      2. Nichts fällig, Kasten gefüllt → Vorschlag „neue Muskeln aus dem Pfad“
      3. Kasten leer → Zustand `needsOnboarding` (7c übernimmt das UI dafür)
      4. Überfällig-Stau (z. B. 80 Karten fällig) → auf eine **verdaubare Tagesdosis** deckeln,
         nicht die volle Zahl ausspielen
- [ ] Mehrfach nachgeschlagene Muskeln werden höher priorisiert — die Schnittstelle dafür
      (`lookupCounts: Record<nameLatin, number>`) wird **jetzt schon** im Parametertyp vorgesehen,
      auch wenn der Store erst in 7d entsteht. Fehlt sie, ist das kein Fehler.
- [ ] Tagesdosis berücksichtigt ein optionales Prüfungsdatum (`examDate`), falls gesetzt:
      weniger Tage → größere Dosis. Ohne Datum: sinnvoller Default.

## Nicht-Ziele (explizit außerhalb dieses Tasks)
- Keine Route, keine Komponente, kein Screen. **7b** baut das UI.
- Kein Onboarding, kein Seeding des Karteikastens. Das ist **7c**.
- Kein `useLookupStore`. Das ist **7d** — hier nur der Parametertyp.
- Keine Änderung an Leitner-Intervallen, XP-Kurve oder Backup-Format. ADR 0002 bleibt unangetastet.

## Definition of Done
- [ ] Vitest deckt alle vier Zustände oben ab, plus die Priorisierung nach Region-Schwäche
      und nach Nachschlage-Häufigkeit
- [ ] `npm run lint && npm run test && npm run build` grün
- [ ] Kein `any`; keine Parse-/Ableitungslogik, die später ins JSX wandern müsste
- [ ] CHANGELOG-Eintrag
- [ ] **Statustafel in [docs/produkt-plan.md](../produkt-plan.md): Zeile 7a auf `fertig` + Branch eintragen**
- [ ] [docs/PROJECT_STATE.md](../PROJECT_STATE.md): „Nächster Schritt“ auf 7b setzen
