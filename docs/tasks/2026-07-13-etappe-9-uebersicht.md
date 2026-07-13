# Etappe 9 — Rahmen-Briefing für alle Agenten

> **Lies das hier, bevor du ein Task-Briefing 9a–9d öffnest.** Es erklärt, *warum* Etappe 9
> existiert, was aus Etappe 7 + 8 dasteht (und benutzt werden **muss**, statt neu gebaut zu werden)
> und welche Regeln in **jedem** ihrer Tasks gelten.

## Pflichtlektüre vor jedem Task
1. [docs/PROJECT_STATE.md](../PROJECT_STATE.md) — der aktuelle Stand.
2. [docs/produkt-plan.md](../produkt-plan.md) — **Statustafel** (verbindlich) + §Etappe 9.
3. [ADR 0002](../decisions/0002-persistenz-und-datenkompatibilitaet.md) — Persistenz nur additiv.
4. [ADR 0008](../decisions/0008-abrufstufen-aus-leitner-box.md) — die Leitner-Box ist die einzige
   Wahrheit über den Lernstand. Sie wird *abgeleitet*, nicht dupliziert.
5. Dein Task-Briefing.

## Das Problem, das Etappe 9 löst

Nach Etappe 8 ist die App ein Lernbegleiter: Sie schlägt vor, füllt den Kasten, erklärt Fehler,
steigert die Abrufhärte, macht jede Zahl handlungsfähig. **Seit dem 13.07.2026 ist sie live**
(`aher-dev.github.io/MuskelfinderV2/`).

Was ihr fehlt, ist die **Prüfung**. Die Studentin lernt Muskel für Muskel — aber geprüft wird in
**Zusammenhängen** („Nenne die Rotatorenmanschette", „Welche Muskeln beugen im Knie?"), und geprüft
wird **unter Bedingungen**: festes Set, kein Feedback zwischendurch, Zeit im Nacken.

**Nordstern der Etappe:** Die App prüft, wie geprüft wird — und macht aus jedem Fehler eine Karte.

## Die letzte offene Brücke

| # | Kante | Mechanik | Etappe |
|---|-------|----------|--------|
| B3 | **Fehler → Karteikasten** | Jedes Debrief seedet die verpassten Muskeln zurück in den Kasten. **Der wertvolle Teil des Prüfungsmodus ist nicht der Timer, sondern was danach passiert.** | **9c** |

B1 (7d), B2 (7e) und B4 (8c) stehen. **B3 ist die letzte.** Sie ist der Grund, warum 9c den größten
Produktwert dieser Etappe hat.

## Was dasteht — benutzen, nicht neu bauen

| Was | Wo | Wofür in Etappe 9 |
|-----|-----|-------------------|
| Karten nachträglich in den Kasten legen | `useProgressStore.addCards(names)` | **9c: das Debrief ist damit ein Einzeiler.** |
| Sitzung mit vorpriorisierter Auswahl starten | `SessionOptions.names` + `readSessionHandoff` | 9c: „Jetzt aus den Fehlern lernen" → `navigate('/lernkarten', { state: { start: { names } } })` |
| Die **eine** Priorisierung | `prioritizeDueCards` in [today.ts](../../src/data/today.ts) | 9c/9b: keine zweite bauen |
| Redaktionelle Daten außerhalb von `generated/` | [etymology.ts](../../src/data/etymology.ts) + `src/data/editorial/` | **9a + 9d: `withEtymology` ist die Blaupause.** |
| Abrufstufe aus der Box ableiten | [recall.ts](../../src/data/recall.ts) | 9c: der Prüfungsmodus fragt härter, speichert aber nichts Neues |
| Freitext-Prüfung mit Bedeutungsgate | [answer-check.ts](../../src/data/answer-check.ts) | 9c: mündliche/praktische Prüfung = freier Abruf. **`checkAnswer` braucht den Korpus!** |
| Erklärung aus Daten komponieren | [explain.ts](../../src/data/explain.ts) | 9c: das Debrief erklärt, es zählt nicht nur |
| CTA-Selektoren + „kein Knopf ins Leere" | [practice.ts](../../src/data/practice.ts) | 9b: ein Abzeichen ohne Weg dorthin ist Deko |

## ⚠️ Drei Fallen — am Code verifiziert, glaub dem Code

1. **`useQuizGame` schreibt bei jeder Runde in die V1-Quizbilanz.**
   [src/hooks/useQuizGame.ts:103](../../src/hooks/useQuizGame.ts) ruft
   `commitRound(quizSeriesKey(mode, regions), …)`. Wer den Prüfungsmodus (9c) einfach auf diesem Hook
   aufsetzt, **kippt die Prüfungsergebnisse still in die normale Quiz-Statistik** — die Trefferquote
   je Modus wäre danach Unsinn, und der V1-Serien-Schlüssel wäre verschmutzt (**ADR 0002**).
   → Der Prüfungsmodus **committet gar nicht** in die Quizserien, oder unter einem **zusätzlichen**
   Schlüssel. Der bestehende bleibt **bitgleich**.

2. **`src/data/generated/` wird von `npm run migrate:data` überschrieben.**
   Gruppen (9a) und Palpationstexte (9d) sind **redaktionelle** Daten. Sie gehören nach
   `src/data/editorial/` und werden vom Loader dazugemischt — genau wie die Etymologie (8d).
   Ein Test wacht darüber; in 8d wurde die Migration real ausgeführt, die Daten haben sie überlebt.

3. **Subregionen sind KEINE funktionellen Gruppen.** Es gibt bereits 15 Subregionen
   (Schultergürtel, Hand & Finger, …) — die sind **topographisch**. „Rotatorenmanschette" ist keine
   Subregion, sondern 4 Muskeln **innerhalb** des Schultergürtels. Ein Muskel gehört zu **mehreren**
   Gruppen (Supraspinatus: Rotatorenmanschette *und* Abduktoren). **Gruppen sind eine Many-to-Many-
   Dimension, keine Partition.** Wer sie als zweite Subregion baut, baut das Falsche.

## Invarianten — gelten in JEDEM Task dieser Etappe

1. **Die Leitner-Box bleibt der einzige persistierte Lernschlüssel.** Abzeichen (9b) werden
   **abgeleitet** (Gruppe × Fach), nicht gespeichert. Kein zweiter Fortschritts-Zähler.
2. **Persistenz ist additiv.** Neue Sektionen sind optional, fehlen in älteren Dateien, werden von
   älteren Versionen ignoriert. **Backup-Version bleibt 2.** Der V1-Round-Trip bleibt grün.
3. **`quizSeriesKey` bleibt unangetastet.** Siehe Falle 1.
4. **UI rendert nur.** Auswahl, Ableitung, Auswertung gehören nach `src/data/` und sind dort getestet.
5. **Kein Timer außerhalb des Prüfungsmodus.** Der Timer ist ein *Prüfungs*-Merkmal, kein Lernmerkmal.
   Zeitdruck beim normalen Lernen erzeugt Vermeidung.
6. **Keine Bestrafung, keine Schuld.** Ein Prüfungsergebnis ist ein Befund, keine Note. Der
   Abschlussbildschirm hat **einen** Button — und der führt zum Lernen, nicht zur Punktzahl.
7. **Erwachsene Marke.** Klinisch, orange-akzentuiert. Kein Maskottchen, kein Konfetti.
   `prefers-reduced-motion` respektieren.
8. **Nichts erfinden.** Gruppen (9a) und Palpation (9d) sind Fachinhalte. Im Zweifel bleibt das Feld
   leer und der Projektinhaber entscheidet. Ein falscher Fachinhalt wird auswendig gelernt.
9. **Statisch, kein Backend.** Keine externen Laufzeit-Requests. **Die App ist live** — ein Fehler
   hier trifft echte Nutzer.

## Reihenfolge und Abhängigkeiten

```
9a (Funktionelle Gruppen)  ──▶ 9b braucht sie zwingend
9c (Pruefungsmodus + B3)   ──▶ haengt an nichts. Groesster Produktwert.
9b (Abzeichen)             ──▶ braucht 9a
9d (Palpation)             ──▶ haengt an nichts, redaktionell, inkrementell
```

**Empfohlene Reihenfolge: 9a → 9c → 9b → 9d.**

Begründung: **9a zuerst, weil es den Projektinhaber blockiert.** Die Gruppen müssen von ihm fachlich
geprüft werden (E2) — je früher der Vorschlag auf seinem Tisch liegt, desto eher kann er prüfen,
*während* 9c gebaut wird. 9c ist der größte Wurf (B3) und hängt an nichts.

## Definition of Done — zusätzlich zu jedem Task-DoD

- [ ] `npm run lint && npm run test && npm run build` grün, **bevor** „fertig" gemeldet wird
- [ ] **Backup-Round-Trip gegen die V1-Fixtures grün** (jeder Task, nicht nur die mit Persistenz)
- [ ] **Regressionstest: `quizSeriesKey` ohne Filter ist exakt der bisherige Key**
- [ ] CHANGELOG-Eintrag
- [ ] **Statustafel in [docs/produkt-plan.md](../produkt-plan.md) aktualisiert** (Status + Branch)
- [ ] [docs/PROJECT_STATE.md](../PROJECT_STATE.md): „Nächster Schritt" nachgezogen
- [ ] axe: 0 Verstöße auf berührten Screens (Light + Dark), Feedback nie nur über Farbe

## Nicht-Ziele der GESAMTEN Etappe 9

- **Kein FSRS/SM-2.** Leitner bleibt.
- **Keine Aktivitäts-Abzeichen** („7 Tage am Stück!"). Abzeichen messen **Kompetenz**. Gibt es keine
  Gruppen, gibt es keine Abzeichen — dann lieber gar keine.
- **Keine Videos** (Palpation) — Bundle-Größe und Lizenz.
- **Kein KI-Chat, kein Konto, kein Cloud-Sync, kein Tracking, keine Werbung.**
- **Keine Punktzahl als Selbstzweck.** Die Prüfung liefert einen Befund und einen nächsten Schritt.
