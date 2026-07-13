# Etappe 10 — Kaltstart & Orientierung

**Ausgelöst vom Projektinhaber am 2026-07-13**, nachdem er die App aus Schülersicht geöffnet hat.
Kein Bugreport, sondern ein Produktbefund: *„wieso werden beim kalten Start random 20 Muskeln in die
Lernkartei gepackt? Es geht einfach los."*

## Der Befund (am 2026-07-13 live im Build verifiziert, nicht aus dem Code geraten)

1. **Der Kaltstart ist nicht zufällig — er ist alphabetisch, und das ist schlimmer.**
   Zwei Klicks (Beruf wählen → „Ohne Datum weiter") und der Schüler steht in einer **laufenden
   Sitzung** mit 20 Karten, die er nie ausgewählt hat. `seedDeck` sortiert nach Regionsquote je
   Beruf, dann `difficulty`, dann `nameLatin.localeCompare` — und weil sich allein in der unteren
   Extremität **22 Muskeln den Schwierigkeitsgrad 1 teilen**, entscheidet praktisch das Alphabet.
   Gemessenes Ergebnis: Die **erste Karte**, die ein Physio-Schüler je sieht, ist
   **`M. abductor digiti minimi`** — ein kleiner Fußmuskel.
   Die App sagt an **keiner Stelle**, woher die 20 kommen oder dass man sie ändern darf.

2. **Es gibt nirgends einen Guide.** `/heute` zeigt das Onboarding genau einmal und erklärt danach
   nie wieder etwas — weder wie hier gelernt wird (Leitner) noch wie man seine Karten organisiert.

3. **Die Lernkarten-Übersicht ist überladen — und gefährlich.** Unter „Fächer-Übersicht" steht
   „Speicherstand" mit einem **roten „Zurücksetzen"-Knopf, der den gesamten Lernfortschritt löscht**
   — mitten auf dem Hauptlernbildschirm.

4. **Der Rückweg aus dem Karteikasten ist ein 129 × 18 px großer, grauer Textlink**
   (`.deck-manager__back`, 13px, `--text-tertiary`, ohne Fläche). Unter der WCAG-2.5.8-Mindestgröße
   für Klickziele (24 × 24). Dieselben 13px-Textlinks tragen die Kopfzeile der Lernkartenseite.

5. **Dark-Mode-Dropdowns heben sich nicht ab.** `.fc-select` hat
   `background: rgba(255,255,255,0.05)` — durchscheinend. **Chromium malt die Optionsliste mit exakt
   dieser Farbe**, also 5 % Weiß auf Schwarz = ein Grau, das kaum vom Hintergrund abgeht.
   Betrifft alle drei Lernkarten-Selects und die vier im Suchfilter.

## Entscheidungen des Projektinhabers (2026-07-13)

- **E10-1 — Das Startdeck fällt ganz weg.** Keine automatisch angelegten Karten mehr. Der Erststart
  führt auf einen **Guide**; danach wählt der Schüler selbst (Bereich, später Kursabschnitt).
  Wer nichts wählt, hat einen leeren Kasten — **das ist Absicht.** → ADR 0009.
- **E10-2 — Curriculum: Platzhalter wie bei der Palpation.** Mechanik bauen (redaktionelle Datei,
  Loader, Auswahl-UI), Datei **leer** lassen, Anleitung schreiben.
  **Kein einziger Kursabschnitt wird erfunden.** Die Abschnitte kommen vom Projektinhaber.

## Ziele

- **10a — Startdeck raus.** `seedDeck` und `src/data/seeding.ts` verschwinden ersatzlos.
  **Achtung:** `Profession` / `PROFESSIONS` / `PROFESSION_LABELS` liegen dort, werden aber im
  **Backup persistiert** (`sanitize.ts` validiert `physio|ergo|logo`, `persistence/types.ts`).
  Sie ziehen nach `src/data/profession.ts` um — **löschen würde ADR 0002 brechen.**
  Das Onboarding fragt weiter nach dem Beruf (er trägt später das Curriculum), legt aber **keine
  Karten** mehr an und startet **keine Sitzung**.
- **10b — Guide.** Route `/anleitung`: wie hier gelernt wird (Leitner, Tagesplan, warum nicht alles
  auf einmal) und wie man seine Karten organisiert. Dauerhaft erreichbar.
- **10c — Landing page.** `/heute` bei leerem Kasten: Kurzerklärung + **drei Wege, den Kasten zu
  füllen** (Bereich · Kursabschnitt · einzeln nachschlagen) + Link auf den Guide.
- **10d — Curriculum-Mechanik.** `src/data/curriculum.ts` + `src/data/editorial/curriculum.json`
  (**leer**, nach Beruf geschlüsselt) + `docs/curriculum-erfassen.md`. Blaupause: `palpation.ts`.
- **10e — Aufräumen.** „Zurücksetzen" von der Lernkartenseite nach `/statistik` (dorthin, wo das
  Backup-Panel schon steht). Kopfzeilen-Links und der Rückweg aus dem Karteikasten werden echte
  Bedienelemente (≥ 24 px Klickziel).
- **10f — Dark-Mode-Felder.** Opaker Feld-Hintergrund als Token, für **alle** `<select>`.

## Nicht-Ziele

- **Keine erfundenen Kursabschnitte.** Wie bei der Palpation: Die Datei bleibt leer, bis der
  Projektinhaber sie füllt. (Siehe `docs/palpation-erfassen.md`.)
- **Kein neuer persistierter Schlüssel.** Das Curriculum ist redaktionelle Stammdatei, kein Zustand.
- **`Profession` nicht aus dem Backup entfernen** — ADR 0002, additiv bleibt additiv.
- Kein Logo (steht auf der TODO-Liste, eigener Task).

## Definition of Done

- `npm run lint && npm run test && npm run build` grün.
- Kaltstart live durchgeklickt: Beruf wählen → **Guide**, **null Karten** im Kasten, **keine
  laufende Sitzung**.
- axe 0 Verstöße auf `/anleitung` und dem neuen `/heute`-Leerzustand, Light **und** Dark.
- Ein Test wacht darüber, dass **kein** Code mehr Karten ohne Zutun des Nutzers anlegt.
- `docs/PROJECT_STATE.md`, Statustafel in `docs/produkt-plan.md`, `CHANGELOG.md`, ADR 0009.
