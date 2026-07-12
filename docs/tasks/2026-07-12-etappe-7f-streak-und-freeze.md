# Task: Etappe 7f — Streak mit Freeze

> **Zuerst lesen:** [Rahmen-Briefing Etappe 7](2026-07-12-etappe-7-uebersicht.md).
> Dieser Task hängt an **nichts** und kann jederzeit parallel laufen.

## Ziel
Es gibt einen Grund, morgen wiederzukommen — **ohne** dass ein verpasster Tag zum Anfang vom
Aufhören wird. XP und Level existieren bereits, haben aber keinen Nutzen; der Freeze gibt ihnen einen.

## Kontext
- Branch: `feat/etappe-7f-streak-freeze`
- Betroffen:
  - neu: Streak-Logik als reine Funktionen in `src/persistence/` (oder `src/data/`) + Tests
  - `src/hooks/useDailyBonus.ts` (existiert — **darauf aufsetzen**, nicht danebenbauen)
  - `src/store/useProgressStore.ts` (persistierter Zustand, **additiv** erweitern)
  - `src/pages/TodayPage.tsx` / Kopfzeile (Anzeige), `src/store/useToastStore.ts` (dezenter Hinweis)
- Doku: [ADR 0002](../decisions/0002-persistenz-und-datenkompatibilitaet.md) (Persistenz additiv),
  [produkt-plan.md](../produkt-plan.md) §Etappe 7

## Anforderungen
- [ ] **Streak-Zähler**: aufeinanderfolgende Tage mit erledigter Tagesdosis. Nüchtern und klein —
      ein Zähler, mehr nicht.
- [ ] **Freeze**: wird durch **Überperformen verdient** (doppelte Tagesdosis an einem Tag → ein Freeze
      auf dem Konto, sinnvoll gedeckelt, z. B. maximal 2). Bei einem Fehltag wird er **automatisch
      eingelöst** — die Studentin muss nichts tun und wird nicht um Erlaubnis gefragt.
- [ ] Nach einem **verlorenen** Streak lautet die Botschaft „Weiter geht’s“ — nie „Du hast X verloren“.
- [ ] Tagesgrenzen sauber rechnen: lokale Zeitzone, Tageswechsel um Mitternacht, Sprung über mehrere
      Tage, Uhr-Manipulation (Datum in der Vergangenheit darf den Streak nicht künstlich aufblähen).
- [ ] Persistenz **additiv** — neue Keys, die eine alte Version ignoriert.

## Nicht-Ziele — hier wird es gefährlich, bitte genau lesen
- **Kein Cartoon-Feuer, kein Konfetti, kein Maskottchen.** Die Marke ist klinisch und erwachsen.
- **Keine Schuld-Mechanik**: keine Push-Erinnerung, kein „Du enttäuschst …“, keine Rot-Markierung
  verpasster Tage, keine Verlust-Animation.
- **Kein Herz-/Leben-System**, keine Bestrafung von Fehlern. Bei einer prüfungsängstlichen Zielgruppe
  ist das genau falsch herum.
- **Keine Abzeichen.** Die guten Abzeichen sind kompetenzbasiert und brauchen die funktionellen
  Gruppen (Etappe 9, blockiert). Aktivitäts-Abzeichen („7 Tage!“) sind hohl — **lieber gar keine.**
- **Kein Freeze-Kauf für XP, kein In-App-Shop.** Der Freeze wird durch Lernen verdient, nicht gehandelt.

## Definition of Done
- [ ] Streak- und Freeze-Logik über Tagesgrenzen getestet: Normalfall, Fehltag **mit** Freeze,
      Fehltag **ohne** Freeze, mehrere Tage Pause, Zeitzonen-Kante, Datum in der Vergangenheit
- [ ] Backup-Round-Trip-Test gegen die V1-Fixtures bleibt grün
- [ ] axe: 0 Verstöße; die Streak-Anzeige ist nicht nur farbcodiert
- [ ] Gate grün · CHANGELOG · **Statustafel 7f auf `fertig`** · PROJECT_STATE nachgezogen
