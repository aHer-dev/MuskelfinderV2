# ADR 0009 — Kein automatisches Startdeck

- Status: angenommen
- Datum: 2026-07-13
- Ersetzt: den Auto-Seeding-Teil von **Etappe 7c** (`src/data/seeding.ts`)
- Betrifft: ADR 0007 (Einstieg `/heute`) — bleibt gültig, bekommt aber einen neuen Erstzustand

## Kontext

Etappe 7c hat den leeren Karteikasten als „zweite Reibungswand" behandelt und mit einem
**automatischen Startdeck** beantwortet: eine Berufsfrage, danach 20 Karten und **sofort** die
erste Sitzung. Die Zielgröße war „erste bewertete Karte unter 60 Sekunden".

Der Projektinhaber — Lehrkraft, der die App an echten Schülern testet — hat das am 2026-07-13
aus Schülersicht geöffnet und für falsch befunden.

Der Befund wurde live im Build nachgemessen:

- Die 20 Karten sind **nicht zufällig, sondern alphabetisch**. `seedDeck` sortiert nach
  Regionsquote je Beruf, dann `difficulty`, dann `nameLatin.localeCompare`. Allein in der unteren
  Extremität teilen sich **22 Muskeln den Schwierigkeitsgrad 1** — die Sortierung entscheidet also
  praktisch per Alphabet.
- Die **erste Karte**, die ein Physio-Schüler je zu sehen bekommt, ist damit
  **`M. abductor digiti minimi`**: ein kleiner Fußmuskel.
- Die App **erklärt nirgends**, woher die Karten kommen oder dass man sie ändern darf.

Ein Startdeck, das der Schüler weder gewählt noch verstanden hat, ist keine Starthilfe. Es ist
Fremdbestimmung mit einem Zufallsgenerator, der sich als Didaktik ausgibt — und es nimmt ihm
genau die Handlung ab, die das Lernen trägt: **zu entscheiden, was er lernen will.**

## Entscheidung

**Es gibt kein automatisches Startdeck mehr.** Kein Codepfad legt Karten an, ohne dass der Nutzer
sie ausgewählt hat.

- Der Erststart führt auf einen **Guide**, nicht in eine Sitzung.
- Der Karteikasten bleibt **leer**, bis der Schüler wählt: nach Bereich, nach Kursabschnitt
  (Curriculum, Etappe 10d) oder einzeln über die Suche.
- **Wer nichts wählt, hat einen leeren Kasten. Das ist Absicht**, kein Leerzustand, den man
  „reparieren" müsste.

`src/data/seeding.ts` und seine Tests werden **ersatzlos gelöscht** (keine Leichen, siehe
CLAUDE.md).

## Was bleibt — und warum

**Die Berufsfrage bleibt.** Sie legt keine Karten mehr an, aber:

1. `Profession` (`physio` | `ergo` | `logo`) wird **im Backup persistiert**
   (`persistence/sanitize.ts`, `persistence/types.ts`, Sektion `profile`). Sie zu entfernen hieße,
   einen Schlüssel aus einem ausgelieferten Backup-Format zu nehmen — **ADR 0002 verbietet das.**
2. Sie trägt das **Curriculum**: Kursabschnitte sind je Beruf verschieden (Kurs 1 der Logopädie ist
   nicht Kurs 1 der Physiotherapie). `curriculum.json` ist nach Beruf geschlüsselt.

Darum zieht der Typ nach **`src/data/profession.ts`** um — die Datei, die stirbt, ist nur die
Seeding-Logik.

## Was das an ADR 0007 ändert

ADR 0007 hat als **Rahmen-Invariante 2** festgelegt: *jeder Zustand von `/heute` hat genau einen
Primärbutton — kein Zustand ohne Vorschlag.* Das war richtig, **solange die App das Startdeck
selbst anlegte**: Dann konnte auch der leere Kasten einen einzigen Vorschlag haben.

**Für den Zustand `needsOnboarding` (leerer Kasten) gilt sie nicht mehr.** Dort ist das *Wählen*
die Aufgabe — ein einzelner Primärbutton würde wieder für den Schüler entscheiden und genau den
Fehler wiederholen, den dieses ADR behebt. Er sieht stattdessen den Guide und **drei** gleichrangige
Wege (Kursabschnitt · Bereich · einzeln).

**Alle anderen Zustände (`review`, `backlog`, `new`) behalten ihren einen Primärbutton.** Tests
wachen über beides (`src/pages/TodayPage.test.tsx`).

## Konsequenzen

- **Positiv:** Der Schüler besitzt seinen Karteikasten von der ersten Sekunde an. Die App erklärt
  sich, statt loszulaufen. Der Kursabschnitt wird der natürliche Einstieg, sobald die Daten da sind.
- **Negativ:** Der Weg zur ersten bewerteten Karte wird länger als 60 Sekunden. Das ist der Preis,
  und er ist bewusst bezahlt — 7c hat die falsche Zahl optimiert.
- **Risiko:** Ein Schüler, der nichts wählt, lernt nichts. Dagegen steht der Guide und die Tatsache,
  dass `/heute` bei leerem Kasten **immer** die drei Wege zeigt, statt in eine Sackgasse zu laufen.
- Ein Test wacht darüber, dass kein Codepfad mehr Karten ohne Nutzerhandlung anlegt.
