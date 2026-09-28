# Task: Quiz-Mix als zweite Lernform im Karteikasten (Etappe 16)

## Ziel
Die fälligen Karten lassen sich wahlweise als Lernkarten oder als gemischte Quizfragen lernen:
dieselben Karten, dieselbe Portion, und jede Antwort zählt in den Leitner-Kasten. Wählbar auf
`/lernkarten` und auf `/heute` neben dem Vorschlag.

## Kontext
- Branch: feat/etappe-16-quiz-mix (abgezweigt von feat/etappe-15-funktion-kurzform, weil die
  Funktionsfragen die Kurzform aus Etappe 15 stellen)
- Betroffene Dateien/Module: `src/data/quiz-mix.ts` (neu), `src/data/quiz.ts` (`eligible`),
  `src/store/useSessionStore.ts`, `src/hooks/useFlashcardSession.ts`,
  `src/pages/FlashcardsPage.tsx`, `src/pages/TodayPage.tsx`, `src/pages/GuidePage.tsx`,
  `flashcards.css`, `today.css`, `scripts/check-journey.mjs`, `scripts/check-surface.mjs`
- Relevante Doku: ADR 0014 (neu), ADR 0002, 0007, 0008, 0011

## Anforderungen
- [x] Umschalter „Lernform: Karteikarten | Quiz-Mix" auf `/lernkarten`; Bereich, Auswahl und
      Kartenlimit gelten für beide Formen gleich
- [x] Jede Karte der Sitzung wird zu genau einer Multiple-Choice-Frage; die sieben Fragearten
      (Bild ↔ Name, Ursprung ↔ Ansatz, Funktion ↔ Muskel, Innervation) sind je Sitzung gleich
      oft und nie zweimal hintereinander
- [x] Im Quiz-Mix rückt eine Karte erst nach ZWEI richtigen Antworten vor (zwei verschiedene
      Fragearten, eine Runde Abstand); ein Fehler schickt sie sofort zurück; auf der Lernkarte
      reicht einmal (Projektinhaber, 2026-09-28). Tagesdosis/XP je Karte, nicht je Frage
- [x] Nach der Antwort: welche Karte es war und wohin sie ging; „Weiter" liegt im Bild
- [x] Karten in Fach 7 bleiben Freitext (ADR 0008), auch im Quiz-Mix
- [x] Eine Portion misst Antworten: „20 Quizfragen" = die obersten 10 Karten; Fragenlimit
      10/20/40 auf `/lernkarten`; Tagesdosis zählt Antworten (Projektinhaber, 2026-09-28)
- [x] `/heute`: „Los — 20 Quizfragen" gleichwertig neben „Los — 20 Karten lernen", mittig,
      dieselben Karten (Projektinhaber, 2026-09-28: gleichwertig statt Zweitknopf)
- [x] Anleitung beschreibt beide Lernformen und die Grenze zum freien Quiz
- [x] Tastatur: 1–4 antworten, Enter weiter, F schwierig

## Nicht-Ziele (explizit außerhalb dieses Tasks)
- Keine Zeitbegrenzung im Quiz-Mix (das freie Quiz hat sie, Etappe 11)
- Keine Quizserie, keine Statistik-Zeile für den Quiz-Mix; kein neuer Speicherschlüssel
- Die gewählte Lernform wird nicht gespeichert (auf `/heute` stehen beide Knöpfe)
- Das freie Quiz (`/quiz`) bleibt unverändert und zählt weiterhin nicht in den Kasten
- Keine Gruppenfrage (9a) im Mix: Sie fragt nach Zusammenhängen, nicht nach einer Karte

## Definition of Done
- [x] Tests für neue Logik vorhanden und grün, Datenlogik gegen den echten Bestand
- [x] Jede neue Prüfung gegengetestet (Fehler eingebaut → Prüfung fällt)
- [x] `npm run verify` grün
- [x] ADR 0014, CHANGELOG, PROJECT_STATE
