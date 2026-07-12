# ADR 0007: Einstiegsroute `/heute` und Informationsarchitektur nach Absichten

## Status: vorgeschlagen · 2026-07-12

## Kontext
Nach Etappe 6 hat V2 volle V1-Parität: Suche, Detail, Lernkarten, Karteikasten, Quiz, Statistik.
`/` leitet auf `/suche` um ([src/App.tsx:47](../../src/App.tsx)) — das Erste, was eine Studentin
sieht, ist ein leeres Suchfeld über 150 Muskeln und ein leerer Karteikasten.

Der UX-Review und drei unabhängige Recherche-Berichte ([Brainstorming.txt](../Brainstorming.txt))
kommen zum selben Befund: Die App ist eine **Bibliothek**, keine **Lernbegleitung**. Sie lädt die
gesamte Strukturierungsarbeit auf die Nutzerin ab — was lernen, in welcher Reihenfolge, wie viel
heute. Spaced Repetition greift nicht, weil nie Karten im Kasten sind.

Die Navigation listet heute **sechs gleichrangige Werkzeuge**. Das ist ein Werkzeugkasten, aus dem
sich die Studentin selbst eine Lernstrategie basteln muss — genau die Arbeit, die eine
Lern-App abnehmen sollte.

Zugleich ist das Nachschlagen ein **echter, häufiger Anwendungsfall** (Praktikum, Unterricht,
Sekundenfrist). Es darf durch einen neuen Einstieg nicht teurer werden.

## Entscheidung

1. **Neue Route `/heute` wird der Einstieg.** `/` leitet dorthin. `/suche` bleibt als eigene Route
   vollständig erhalten — sie verliert den Startbildschirm, nicht die Erreichbarkeit.

2. **Die Navigation benennt Absichten, keine Features.** Vier Einträge in Rail (Desktop) und TabBar
   (Mobil):

   | Tab | Absicht | Enthält |
   |-----|---------|---------|
   | **Heute** | „Was soll ich jetzt tun?“ | Empfehlung, ein Primärbutton, Brücken B1/B4 |
   | **Suche** | „Ich will was nachschlagen.“ | Suche, Filter, Detailseiten |
   | **Lernen** | „Ich will üben.“ | Session (alle Abrufformen), Freies Üben, später Prüfungsmodus |
   | **Fortschritt** | „Wie stehe ich da?“ | Statistik, Karteikasten-Ansicht, später Abzeichen |

   „Karteikasten“ verliert den Tab-Rang — es ist keine Absicht, die jemand hat. Die Route
   `/karteikasten` **bleibt bestehen**, damit Deep-Links und Lesezeichen nicht brechen.

3. **Das Suchfeld sitzt in der Kopfzeile jeder Route**, nicht nur auf `/suche`. Nachschlagen bleibt
   ein Griff entfernt; eine laufende Lern-Session überlebt den Griff.

4. **Kein Zustand ohne Primärbutton.** Nichts fällig → „Alles wiederholt — 5 neue aus deinem Pfad?“.
   Kasten leer → Erstsetup. Ein leerer Zustand ist ein Ausstiegspunkt, kein Layout.

## Begründung
- **Duolingo** ersetzte 2022 das Kachelraster durch einen geführten Pfad, ausdrücklich um dem
  Lernenden die Sequenz-Entscheidung abzunehmen. Das Prinzip übernehmen wir; das Kostüm (Maskottchen,
  Herzen, Guilt-Push) nicht — und den *starren* Pfad auch nicht: Anatomie ist nicht sequenziell wie
  Sprache, und die Reihenfolge kommt bei unserer Zielgruppe ohnehin von der Dozentin.
- **AMBOSS** löst dieselbe Doppelnatur (Nachschlagewerk + Lernwerkzeug) und hält die Bibliothek
  jederzeit griffbereit. Daher das persistente Suchfeld statt „Suche als Startseite“.
- **Kenhub**s Dashboard führt mit Schwachstellen, nicht mit einem Katalog.

## Konsequenzen
- **Gut:** Der kalte Start, der leere Karteikasten und die empfehlungslose Statistik werden von
  *einem* Schritt erschlagen. Die Navigation wird von 6 auf 4 Einträge kürzer und mobil
  daumenfreundlicher.
- **Kosten:** Eine neue Route, ein neues Empfehlungsmodul (`src/data/today.ts`), Umbau von Rail und
  TabBar. Bestehende Screens werden **nicht** neu geschrieben, nur anders erreichbar.
- **Risiko:** Wer die App bisher als reines Nachschlagewerk nutzt, findet die Suche nicht mehr
  sofort. Abgefedert durch das persistente Suchfeld und den eigenen Tab.
- **Keine Berührung** von ADR 0002: kein Datenformat, kein Backup-Schlüssel, keine Store-Semantik
  ändert sich. Profession und Prüfungsdatum aus dem Onboarding werden **additiv** persistiert.
- **Umkehrbar:** Fällt die Entscheidung zurück, genügt das Umstellen des Redirects in
  `src/App.tsx` und der Nav-Einträge. `/heute` bliebe als Zusatzroute bestehen.

## Alternativen
- **Heute-Screen als Sektion oberhalb der Suchliste.** Verworfen: Die Liste bleibt sichtbar und
  zieht die Aufmerksamkeit; der eine Vorschlag verliert seine Wirkung.
- **Onboarding-Modal über der Suche.** Verworfen: löst den Erststart, nicht den täglichen
  Wiedereinstieg — und der ist der eigentliche Bindungshebel.
