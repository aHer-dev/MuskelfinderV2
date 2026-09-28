# ADR 0013 — Funktion in Kurzform, Text aufklappbar

- Status: angenommen
- Datum: 2026-09-27
- Betrifft: `src/data/funktion-kurz.ts` (neu), `src/data/editorial/funktion-kurz.json` (neu),
  `src/data/muscle-fields.ts`, `src/data/quiz.ts`, `src/data/explain.ts`, Detailseite,
  Lernkarte, Quiz-Vergleichskarte
- Auftrag: Projektinhaber, 2026-09-27

## Kontext

Unter „Funktion" stand überall der ausformulierte V1-Text (`functionDescription`, Median
103 Zeichen, bis 306). Wer nachschlägt, sucht zuerst **Gelenk und Bewegung**. Das stand im
Satz, musste aber herausgelesen werden. Im Quiz „Muskel → Funktion“ waren die vier Optionen
vier solche Absätze.

Die naheliegende Quelle für eine Kurzform, das Feld `functions` (Bewegungs-Schlüssel), trägt
sie nicht: Es hängt an keinem Gelenk. `M. biceps brachii` führt `joints: [Art. cubiti,
Art. humeri]` und `functions: [flexion, supination]`, also Flexion von was?

Nebenbei gefunden: Auf der Freitext-Stufe (Fach 7) zeigt die Karte die Fakten und fragt nach
dem Namen. **31 lange Funktionstexte nennen den eigenen Muskel** („Der M. masseter ist der
kräftigste Kaumuskel …“), die Antwort stand also auf der Frage.

## Entscheidung

1. **Neue handgepflegte Ebene `editorial/funktion-kurz.json`**: je Muskel Zeilen aus `orte`
   (Etiketten aus `joints`, oder ein freier Ort, wenn der Text einen nennt) und `bewegungen`.
   Schlüssel ist die **id** (wie bei den Segmenten), weil `M. nasalis` zwei Datensätze mit
   verschiedener Funktion hat. `nameLatin` steht als Gegenprobe daneben.
2. **Die Kurzform verdichtet nur den Funktionstext.** Wo er zu einem Gelenk schweigt, fehlt
   die Zeile; `check:daten` und `export:csv` legen das dem Fachmann vor. Die KI-Entwürfe
   tragen `status: "ungeprueft"` → Stern am Label, bis der Projektinhaber sie abnimmt.
3. **`fachfelder()` zeigt unter „Funktion" die Kurzform** — damit übernehmen Detailseite,
   Lernkarte und Quiz-Vergleichskarte sie ohne eigene Regel, in beiden Niveaus.
4. **Der Text klappt darunter auf** (`FunktionsBeschreibung`, natives `<details>`): auf der
   Detailseite in der Funktionszeile, auf der Lernkarte unter der Karte (nach dem Aufdecken,
   **nie** auf der Freitext-Stufe), im Quiz je Vergleichskarte.
5. **Beide Funktionsmodi des Quiz stellen die Kurzform** (Optionen bzw. Fragetext), die
   Erklärung ebenso. Deshalb ist eine Kurzform für **jeden** Muskel mit Funktionstext
   Pflicht (Loader wirft): Eine einzelne lange Option zwischen kurzen verriete die Antwort.
6. Die losen Bewegungs-Chips auf der Detailseite entfallen: Sie wiederholten die Kurzform
   ohne Gelenk. `functions` bleibt als Filterfeld der Suche bestehen.

## Folgen

- Gleiche Kurzform = gleiche Frage. Das Quiz sperrt diese Muskeln als Distraktoren
  (dieselbe Regel wie beim Text), `check:daten` listet sie (Stand: 6 Gruppen).
- Solange die Kurzformen ungeprüft sind, trägt „Funktion" überall den Stern. Im Quiz steht
  er nicht (Optionen und Vergleichskarte haben keine Legende; ein Zeichen ohne Erklärung
  wäre ein Rätsel).
- Ändert eine Neu-Migration die ids, scheitert der Build an der Namens-Gegenprobe, statt
  Kurzformen still an den falschen Muskel zu hängen.
