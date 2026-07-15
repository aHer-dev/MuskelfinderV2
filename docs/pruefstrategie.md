# Prüfstrategie — wie wir „alles" testen, ohne alles zu testen

> Kurz: **`npm run verify`** vor jedem „fertig". Läuft auch bei jedem Push automatisch
> (GitHub Action `verify.yml`).

## Warum es diese Datei gibt

Bei den Desktop-Durchläufen im Juli 2026 tauchte Bug um Bug auf, obwohl **592 Unit-Tests grün**
waren. Der Grund war kein Schlendrian, sondern eine Lücke mit System:

- **`quiz.test.ts` lief gegen selbstgebaute Fixtures, nie gegen die echten Daten.** Fixture-Muskeln
  sind per Konstruktion sauber — jeder hat einen eigenen Namen, eine eigene Funktion, ein eigenes
  Bild. Der ganze Fehlertyp „zwei Muskeln teilen sich ein Feld" war in der Testwelt **unmöglich**,
  während 6 % der echten Quizfragen zwei richtige Antworten hatten.
- **Es gab keine eingecheckte Oberflächen- oder Ablaufprüfung.** `playwright` und `axe-core` lagen im
  Projekt, aber jede visuelle Kontrolle wurde im Wegwerf-Verzeichnis neu zusammengebaut und danach
  verworfen. Deshalb fand *jede* Prüfung *neue* Fehler: Jede schaute woanders hin, nichts sammelte
  sich an.

Die Fehler waren nicht zufällig. Sie saßen in zwei blinden Flecken der Unit-Tests:

| blinder Fleck | was dort gestorben ist |
|---|---|
| **Die echten Daten** (5 doppelte Namen, 29 geteilte Ansätze, 152 Dateien für 168 Bildrefs) | Quiz-Mehrdeutigkeit, „53 Karten vs. 56 Zeilen", Hypothenar, alphabetisches Startdeck |
| **Der Zustandsraum der Oberfläche** (Hover, Fokus, leer vs. voll, Dark Mode) | drei Hover-Kontrastfehler in Folge, fehlender Tab-Stop, 111 Zeichen/Zeile |

**„Alles testen" geht nicht.** Aber man kann jede *Fehlerklasse*, die einmal zugeschlagen hat, in
eine *stehende Prüfung* verwandeln — dann kann genau diese Klasse nicht zurückkommen.

## Die vier Prüfungen

Alle laufen ohne Netz und ohne Backend. `verify` bündelt sie in der Reihenfolge billig → teuer.

### 1. `npm test` — Verhalten (Vitest, 592+)
Die reine Datenschicht und die Hooks. **Neu seit Juli 2026:** die Quiz-Invarianten laufen jetzt
zusätzlich gegen den **echten** Bestand (`getMuscles()`), nicht nur gegen Fixtures — sie rechnen die
gültigen Antworten unabhängig vom Generator nach und würden jede neue Mehrdeutigkeit fangen.

### 2. `npm run check:daten` — die Daten (Sekunden, kein Browser)
`scripts/check-data.mjs`. Zwei Teile:
- **Integrität (harter Fehler):** Jedes referenzierte Bild existiert auf der Platte, IDs sind
  eindeutig, jeder Gruppenmuskel existiert und ist nicht regionsübergreifend mehrdeutig
  (Hypothenar-Falle), jede Region ist gültig.
- **Bericht (kein Fehler, zum Ansehen):** Wo sich zwei Muskeln ein Feld teilen — Name, Funktion,
  Ursprung, Ansatz, Innervation, Bild. **Das ist deine Liste, Fachmann.** Der Code fängt die
  Quiz-Mehrdeutigkeit inzwischen ab, aber die Frage bleibt: *Ist der geteilte Wert fachlich richtig
  oder ein Datenfehler?* Beispiel aus dem aktuellen Bericht: `M. rhomboideus major` und `minor`
  tragen **wörtlich denselben** Funktionstext — Absicht oder Copy-Paste?

### 3. `npm run check:oberflaeche` — die Oberfläche in jedem Zustand
`scripts/check-surface.mjs` (Playwright + axe). Jede der 14 Routen in **Hell und Dunkel**, in
**Ruhe, Hover und Fokus**, einmal **leer** und einmal **befüllt**. Misst axe-Verstöße, horizontalen
Überlauf und Zeichen pro Zeile. Fängt genau die Klasse, die ein Ruhezustand-Audit übersieht — der
Hover-Kontrast wird nach 400 ms gemessen (sonst trifft man die Farbe mitten in der CSS-Transition).

### 4. `npm run check:wege` — der Weg einer Schülerin
`scripts/check-journey.mjs` (Playwright, **frischer Browser, kein Seed**). Der Kaltstart, den echte
Schüler sehen: Erststart → **0 Karten, kein Primärknopf** (ADR 0009) → Bereich wählen → *versprochene
Zahl == angelegte Zahl == Tabellenzeilen* → Sitzung mit Tastatur → **jeder Quizmodus** (vier Optionen,
keine Doppelung) → Prüfung bis zum Debrief. Fängt die Ablauffehler, die auf keiner Einzelseite sichtbar
sind.

## Die eine Regel, die das Ganze trägt

> **Jeder gefundene Fehler wird zu einer Zeile in einer dieser Prüfungen — nicht nur zu einem Fix.**

Ein Fix repariert einen Fall. Eine Prüfung lässt die *Klasse* aussterben. Und jede neue Prüfung wird
**gegengetestet**: erst den Fix zurückdrehen, sehen, dass sie fällt, dann wieder herstellen. Eine
Prüfung, die auch ohne den Fehler grün ist, prüft nichts. (So verifiziert: check:daten fällt bei
kaputter Bildreferenz, check:oberflaeche bei zu blassem Hover, check:wege bei wiedereingebautem
`seedDeck`.)

## Was die Automatik NICHT kann — dein Teil

Keine Maschine sieht **fachliche Richtigkeit**:
- Ob ein Palpationstext stimmt (kommt aus dem Kollegen-Skript, `docs/palpation-erfassen.md`).
- Ob eine funktionelle Gruppe didaktisch sinnvoll geschnitten ist.
- Ob ein geteilter Funktions-/Ursprungstext im Datenbericht **korrekt** ist oder ein Fehler.
- Ob ein Kursabschnitt das prüft, was er behauptet (`docs/curriculum-erfassen.md`).

Die Automatik soll dir genau **dafür** den Kopf frei machen: Sie hält Regressionen, Layout und Abläufe
in Schach, damit deine Aufmerksamkeit für das reicht, was nur der Fachmann beurteilen kann. Der
Datenbericht aus check:daten ist die Brücke — er legt die fachlichen Fragen offen, statt sie zu
verstecken.

## Bekannte Grenzen der Prüf-Skripte
- Die Browser-Prüfungen brauchen einen fertigen Build (`npm run build`); `verify` baut vorher.
  Chromium wird in CI via `npx playwright install --with-deps chromium` bereitgestellt.
- Der Seed (`scripts/checks/seed.mjs`) muss den Formen in `src/persistence/types.ts` folgen. Ein
  falsch geformter Store lässt `/heute` weiß werden — die Skripte kontrollieren darum, dass der Seed
  ankommt, bevor sie messen.
- `check:wege` klickt immer die **erste** Option — es prüft, dass eine Runde *durchläuft* und
  Rückmeldung gibt, nicht ob eine Antwort inhaltlich richtig ist. Das Inhaltliche liegt in `npm test`.
