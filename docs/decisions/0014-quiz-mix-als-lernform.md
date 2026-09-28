# ADR 0014 — Quiz-Mix als zweite Lernform im Karteikasten

- Status: angenommen
- Datum: 2026-09-28
- Betrifft: `src/data/quiz-mix.ts` (neu), `src/store/useSessionStore.ts`,
  `src/hooks/useFlashcardSession.ts`, `src/pages/FlashcardsPage.tsx`, `src/pages/TodayPage.tsx`,
  `src/pages/GuidePage.tsx`, `src/data/quiz.ts` (`eligible`)
- Auftrag: Projektinhaber, 2026-09-28

## Kontext

Die fälligen Karten ließen sich nur auf eine Art lernen: als Lernkarte (aufdecken, selbst
bewerten, ab Fach 7 Namen tippen). Das Quiz gab es daneben, aber als **freies Üben**: Man wählt
einen Modus, bekommt zehn Fragen über den Bestand, und keine Antwort verschiebt eine Karte.

Gewünscht war eine zweite Form für die tägliche Wiederholung: dieselben Karten, in derselben
Portion (Tagesdosis 20 bzw. Kartenlimit 5/10/20/50), aber als **gemischte Quizfragen**:
Ursprung/Ansatz, Bild/Name, Funktion, Innervation durcheinander. Wählbar im Karteikasten und
auf „Heute" neben dem Vorschlag.

## Entscheidung

1. **Eine Sitzung, zwei Formen.** Der Quiz-Mix ist keine eigene Seite und kein eigener Zustand,
   sondern eine `lernform` der bestehenden Lernsitzung (`SessionOptions.lernform`, Vorgabe
   `'karten'`). Warteschlange (`buildQueue`), Bereich, Filter, Kartenlimit, Tagesplan und
   Streak bleiben dieselben. Nur die Darstellung jeder Karte wechselt.
2. **Die Antworten zählen in den Kasten, aber strenger als auf der Lernkarte: zweimal richtig,
   bevor eine Karte vorrückt** (Projektinhaber, 2026-09-28, `FRAGEN_JE_KARTE = 2`). Jede Karte
   kommt in der Sitzung zweimal dran, in zwei **verschiedenen** Fragearten und mit einer
   ganzen Runde Abstand (Runde 1: alle Karten, Runde 2: dieselben noch einmal). Die erste
   richtige Antwort bewegt nichts („1 von 2 richtig"), die zweite ruft die Lernkarten-Regel
   `correct` (ein Fach hoch, dieselben XP). **Ein Fehler verbucht sofort** `wrong`
   (`lapseFach`, ADR 0011); die zweite Frage zu diesem Muskel kommt trotzdem, als Übung ohne
   Wirkung. Jede Karte wird so genau einmal bewertet, und die Tagesdosis zählt Karten, nicht
   Fragen. Auf der Lernkarte reicht weiterhin eine richtige Bewertung.
   Der Grund ist die Abrufhärte (ADR 0008): Aus vier Antworten die richtige zu erkennen ist
   leichter, als sie selbst abzurufen. Zwei verschiedene Arten gleichen das aus — wer den
   Muskel nur am Bild erkennt, aber seinen Ursprung nicht kennt, rückt nicht vor.
   Gewertet wird **sofort** beim Antworten, nicht bei „Weiter": Ein Seitenwechsel dazwischen
   (das Suchfeld sitzt auf jeder Route, 7d) verliert nichts und würfelt keine neue, leichtere
   Frage.
3. **Fach 7 bleibt Freitext (ADR 0008).** Eine Karte im letzten Fach bekommt keine Quizfrage;
   die Sitzung zeigt sie als Freitext-Lernkarte, mitten im Quiz-Mix. Sonst käme ein Muskel mit
   vier Antworten zur Wahl bis ganz nach oben, und die Anleitung („weiter hinten musst du den
   Namen frei eintippen") stimmte nur noch für die halbe App.
4. **Die Fragearten werden verteilt, nicht gewürfelt.** Sieben Arten (`MIX_FORMEN`: Bild →
   Muskel, Name → Bild, Ursprung → Ansatz, Ansatz → Ursprung, Funktion → Muskel, Muskel →
   Funktion, Innervation), je Sitzung gleich oft, nie zweimal hintereinander und die zwei
   Fragen zu einem Muskel nie in derselben Art. Zwei Schritte (`verteileFormen`): erst die
   Zählung, die eingeschränktesten Plätze zuerst (47 Muskeln ohne Bild haben nur fünf Arten),
   dann Nachbarn durch Tausch trennen. Ein reines Verteilen von vorn
   nach hinten ergab am ganzen Kasten 15 Bildfragen gegen 24 von jeder anderen Art, weil die
   bildlosen Muskeln im Bestand am Ende stehen.
5. **Die Fragen baut der bestehende Generator** (`questionForMuscle`): dieselbe
   Zwillingssperre (`gueltigeAntworten`), dieselben Distraktoren aus der Nachbarschaft, falsche
   Antworten aus dem ganzen Bestand (8b). Die Fragen werden beim Start **einmal** gebaut und im
   Sitzungs-Store gehalten.
6. **Keine Quizserie, kein neuer Speicherschlüssel.** Der Quiz-Mix schreibt nicht in
   `mf.quizSeries` (wie die Prüfung, 9c): Eine gemischte Runde in die Bilanz eines einzelnen
   Modus zu buchen, verfälschte genau die Zahl, aus der die Statistik den „schwächsten Modus"
   ableitet. Die Lernform selbst wird nicht gespeichert. ADR 0002 ist nicht berührt.
7. **Auf „Heute" stehen beide Formen gleichwertig nebeneinander**: „Los — 20 Karten lernen"
   und „Los — 20 Karten als Quiz", beide als Primärknopf, gleich breit, mittig. Die Zahl zählt
   Karten, nicht Fragen — „20 Quizfragen" (so der erste Wortlaut) wären seit Entscheidung 2
   in Wahrheit 40. Das ist eine
   Entscheidung des Projektinhabers (2026-09-28) und **lockert ADR 0007, Invariante 2 („genau
   ein Primärknopf je Zustand"), für genau dieses Paar.** Der erste Entwurf hatte den Quiz-Mix
   als ruhigen Zweitknopf daneben; er wirkte wie die schlechtere Wahl, und das ist er nicht.
   Was von der Invariante bleibt, ist ihr Kern: **ein Vorschlag.** Beide Knöpfe nennen dieselbe
   Zahl und starten dieselben Karten in derselben Reihenfolge; ein Quiz-Knopf mit eigener
   Auswahl wäre ein zweiter Tagesplan. `TodayPage.test.tsx` und `check:wege` (Station 4c)
   halten beides fest (gegengetestet: eine Karte weniger im Quiz-Knopf → Test fällt).
8. **Die Namen der Lernformen stehen an einer Stelle** (`LERNFORM_LABELS`): Umschalter,
   Knopf auf „Heute" und Anleitung lesen dort.

## Folgen

- **Wiedererkennen bringt eine Karte bis in Fach 7 — aber nur doppelt belegt.** Wer nur den
  Quiz-Mix nutzt, bringt Karten mit Multiple Choice bis in Fach 7, also auch über „gemeistert"
  (Fach 5) und in die Abzeichen. Der erste Entwurf verlangte dafür eine richtige Antwort je
  Fach; seit Entscheidung 2 sind es zwei, in zwei verschiedenen Arten. In Fach 7 verlangt die
  Karte in beiden Formen den Namen frei. Reicht auch das nicht, ist der nächste Hebel, den
  Quiz-Mix ab Fach 5 auf Lernkarten umzustellen, nicht, ihn aus dem Kasten zu nehmen.
- Eine Quiz-Sitzung ist doppelt so lang wie eine Lernkarten-Sitzung mit derselben Zahl
  Karten (20 Karten = 40 Fragen). Die Fortschrittsanzeige zählt darum Fragen, die
  Zusammenfassung Karten.
- Eine Quizfrage nennt ihren Muskel oft nicht (Ursprung → Ansatz zeigt nur einen Ursprung).
  Nach der Antwort steht darum eine Zeile mit dem Namen der Karte und ihrem neuen Fach, und
  zwar **in** der klebenden Leiste neben „Weiter". Erst stand sie darüber; nach einer falschen
  Antwort (Erklärung + „Beide vergleichen") lag sie auf dem Desktop genau hinter der Leiste.
- Die Aktionsleiste des Quiz-Mix klebt auch auf dem Desktop (`.fc-actions--quiz`): Eine Frage
  mit Bild und vier Antworten ist höher als eine Lernkarte, „Weiter" lag gemessen bei y=1182
  auf 1440 × 900.
- `eligible` in `quiz.ts` verlangt jetzt für **beide** Funktionsrichtungen einen
  Funktionstext. Vorher galt „Funktion → Muskel" für jeden Muskel als tauglich; mit leerem
  Funktionstext wäre der Fragetext leer gewesen. Im heutigen Bestand hat jeder Muskel eine
  Funktion, die Änderung ist also ohne sichtbare Wirkung.
- Prüfzeilen: `quiz-mix.test.ts` (echter Bestand: zwei Plätze je Karte, zwei Arten, Runden),
  `useFlashcardSession.test.ts` (zweimal richtig, Fehler sofort, Übung, Tagesdosis je Karte,
  zwei Riegel, „fertig erst nach dem Lesen"), `FlashcardsPage.test.tsx`, `TodayPage.test.tsx`,
  `GuidePage.test.tsx`, `check:wege` Station 4c (antwortet über die Daten RICHTIG: 20 richtige
  Antworten in Runde 1 bewegen keine Karte, die zweite schiebt sie weiter; gegengetestet),
  `check:oberflaeche` Block 9.
