# Task: Ursprung, Ansatz und Funktion untereinander

## Ziel
Jede Ursprung-/Ansatzstelle und jede Bewegung steht als eigener Listenpunkt statt in
einer langen Aufzählung. Muskelköpfe und Gelenke dienen als Gruppenüberschriften.

## Kontext
- Auftrag des Projektinhabers im Chat, 2026-10-10.
- Branch: `feat/fachangaben-untereinander`.
- Betroffen: Fachfelder-Datenschicht, Detailseite, Lernkarte, Quiz-Vergleichskarte.

## Anforderungen
- Beide Detailniveaus und die drei Anzeigen verwenden dieselbe Listenstruktur.
- Klammern, Ortszusätze, Nummerierungen und die Zuordnung zum Muskelkopf bleiben erhalten.
- Funktionen werden aus den vorhandenen strukturierten Kurzformen angezeigt.
- Auch bei langen Lernkarten bleiben Aufdecken und Bewertung erreichbar; ausreichender Textkontrast.
- Prüfungen gegen den echten Bestand, Gegenproben und `npm run verify`.

## Nicht-Ziele
- Anatomische Inhalte ändern, neue Funktionen ergänzen, Quiz-Auswertung oder Speicherformat ändern.

## Definition of Done
- [x] Einzelne Listenpunkte und Gruppenzuordnung im Browser geprüft, Desktop und Handy.
- [x] Neue Prüfungen gegengetestet; `npm run verify` grün (902 Tests in 75 Dateien).
- [x] CHANGELOG und PROJECT_STATE aktualisiert.

## Anschlussauftrag
Am 2026-10-10 hat der Projektinhaber nach der lokalen Vorschau erst Commit und Push
und anschließend die Übernahme nach `main` und Veröffentlichung für alle Nutzer
beauftragt. Diese Integration erfolgt über einen Pull Request; Gate und GitHub-Pages-
Deploy werden kontrolliert.
