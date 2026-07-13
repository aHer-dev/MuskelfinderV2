# Task: Etappe 9c — Prüfungsmodus + Debrief-Schleife (Brücke B3)

> **Zuerst lesen:** [Rahmen-Briefing Etappe 9](2026-07-13-etappe-9-uebersicht.md).

## Ziel
Die App prüft, **wie geprüft wird**: festes Set, **kein Feedback zwischendurch**, Zeit im Nacken.
Und dann — das ist der eigentliche Punkt — **macht sie aus jedem Fehler eine Karte.**

> **Der wertvolle Teil des Prüfungsmodus ist nicht der Timer, sondern was danach passiert.**
> Das ist **Brücke B3**, die letzte offene: **Fehler → Karteikasten.**

Entscheidung **E1** (2026-07-12): Die reale Prüfung ist **gemischt** (schriftlich *und*
mündlich/praktisch) — **trainiert wird der freie Abruf.** Der Prüfungsmodus bildet beides ab.

## Kontext
- Branch: `feat/etappe-9c-pruefungsmodus`
- **Neu:** `src/data/exam.ts` (Set-Zusammenstellung + Auswertung, rein) · `src/store/useExamStore.ts`
  (laufende Prüfung, **nicht persistiert**) · Route `/pruefung`
- Wiederverwenden (**nicht duplizieren**):
  - [src/data/quiz.ts](../../src/data/quiz.ts) — `generateQuiz` erzeugt die Fragen
  - [src/data/answer-check.ts](../../src/data/answer-check.ts) — der freie Abruf. **`checkAnswer`
    braucht den Korpus** (`getMuscles()`), sonst winkt die Toleranz fremde Muskeln durch!
  - [src/data/explain.ts](../../src/data/explain.ts) — das Debrief **erklärt**, es zählt nicht nur
  - `useProgressStore.addCards(names)` — **damit ist das Seeding ein Einzeiler**
  - `SessionOptions.names` + `readSessionHandoff` — **damit ist der Sprung ins Lernen ein Einzeiler**

## ⚠️ DIE FALLE — sie kostet dich die Quiz-Statistik

**[useQuizGame.ts:103](../../src/hooks/useQuizGame.ts) ruft bei jeder Runde
`commitRound(quizSeriesKey(mode, regions), …)`.**

Wer den Prüfungsmodus bequem auf `useQuizGame` aufsetzt, **kippt jedes Prüfungsergebnis still in die
normale Quiz-Bilanz**. Die Trefferquote je Modus (die 8c für den „schwächster Modus"-Knopf benutzt!)
wäre danach Unsinn, und der **V1-Serien-Schlüssel wäre verschmutzt** — ADR 0002 gebrochen.

→ **Der Prüfungsmodus committet NICHT in die Quizserien.** Er hat seinen eigenen, nicht persistierten
Store. Braucht er doch eine Historie, dann als **zusätzliche, additive** Backup-Sektion — niemals im
`quizSeries`-Namensraum. Der bestehende Key bleibt **bitgleich** (Regressionstest!).

## Anforderungen

### Die Prüfung
- [ ] **Festes Set** (Vorschlag: 20 Fragen), zusammengestellt aus dem Kasten — gemischt über die
      Abrufformen (MC · Bild · **Freitext**), denn so wird real geprüft (E1).
- [ ] **Kein Feedback bis zum Ende.** Keine grüne/rote Rückmeldung je Frage. Wer zwischendurch weiß,
      dass er falsch lag, prüft nicht mehr — er lernt (das ist der Lernmodus, nicht die Prüfung).
- [ ] **Timer — und nur hier.** Sichtbar, aber nicht hetzend. Er endet die Prüfung, er bestraft nicht.
- [ ] Abbrechen ist erlaubt und **verliert nichts** (die Auswertung läuft über die beantworteten Fragen).

### Das Debrief — hier liegt der Wert
- [ ] Auswertung **nach Struktur, nicht als Punktzahl**: nach Region, nach Abrufform, nach
      **Verwechslungs-Clustern** (die Paare aus [confusions.ts](../../src/data/confusions.ts) und die
      Bedeutungs-Dimensionen aus `answer-check.ts` liefern die Sprache dafür).
- [ ] **Genau EIN Primärbutton: „Jetzt aus den Fehlern lernen".** Er
      1. legt die verpassten Muskeln in den Kasten (`addCards`) — auch die, die noch nicht drin waren,
      2. startet **sofort** eine Sitzung mit genau diesen Karten (`state.start.names`).
      **Das ist B3. Ohne diesen Knopf ist der ganze Task Deko.**
- [ ] Die Sprache bleibt **schuldfrei**: „12 von 20 · hier lohnt sich Zeit", nicht „60 % — durchgefallen".
- [ ] **Kein CTA ins Leere** (Regel aus 8c): Wurde alles richtig beantwortet, ist der Knopf nicht
      sichtbar, und es steht ehrlich da, was Sache ist.

## Nicht-Ziele
- **Keine Note, keine Punktzahl als Selbstzweck.** Ein Befund und ein nächster Schritt.
- **Kein Timer im normalen Lernen** (Rahmen-Invariante 5).
- Keine Änderung an Leitner-Intervallen, XP-Kurve oder `quizSeriesKey`.
- Kein Prüfungs-Verlauf/„Bestenliste" in dieser Runde (wenn, dann später und additiv).

## Definition of Done
- [ ] **Regressionstest: `quizSeriesKey` ist unverändert und die Prüfung schreibt NICHT hinein**
      (die Falle oben — explizit testen, nicht behaupten)
- [ ] Test: Das Debrief seedet **genau** die verpassten Muskeln — auch solche, die vorher **nicht**
      im Kasten waren
- [ ] Test: Der Knopf startet eine Sitzung mit **genau** diesen Karten (`buildQueue`-Gegenprobe wie in 8c)
- [ ] Test: Freitext-Fragen nutzen `checkAnswer` **mit Korpus** (sonst ginge „mylohyoideus" als
      „stylohyoideus" durch)
- [ ] Test: Kein Feedback vor dem Ende (die Antwort verrät nicht, ob sie richtig war)
- [ ] Backup-Round-Trip gegen die V1-Fixtures grün
- [ ] axe: 0 Verstöße (Light + Dark); der Timer ist **nicht** nur farbcodiert
- [ ] Gate grün · CHANGELOG · **Statustafel 9c auf `fertig`, B3 auf ✅** · PROJECT_STATE nachgezogen
