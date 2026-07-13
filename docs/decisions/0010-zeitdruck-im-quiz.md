# ADR 0010 — Zeitdruck im Quiz (und drei Absagen)

- Status: angenommen
- Datum: 2026-07-13
- Betrifft: die letzten vier unbeantworteten Fragen aus `docs/Brainstorming.txt` (Fragen 5, 11, 12, 20)

## Kontext

Das Brainstorming vom 2026-07-12 stellte 20 Fragen. Neunzehn wurden im Lauf der Etappen 7–10
beantwortet — vier blieben liegen, ohne dass es jemandem auffiel. Am 2026-07-13 hat der
Projektinhaber sie entschieden.

## Entscheidungen

### ✅ Frage 12 — Zeitdruck: JA, aber abschaltbar und aus per Default

**Sekunden pro Frage: `0` (aus) · `30` · `15`.** Die Vorgabe ist **ohne Uhr**.

Das ist keine Höflichkeit, sondern die Bedingung, unter der ein Zeitlimit überhaupt zulässig ist:
**WCAG 2.2.1 („Timing Adjustable", Level A)** verlangt, dass eine Nutzerin ein Zeitlimit abschalten,
verlängern oder anpassen kann. Wer die Uhr einschaltet, hat sie selbst gewählt und kann sie jederzeit
wieder ausschalten — damit ist das Kriterium erfüllt, ohne sich auf die „Essential"-Ausnahme berufen
zu müssen.

**Läuft die Zeit ab, zählt die Frage als falsch** — aber `selectedId` bleibt `null`. Die Karte
markiert darum nur die *richtige* Antwort und behauptet **nicht**, es sei etwas Falsches angeklickt
worden. Die Rückmeldung lautet „Zeit abgelaufen. Richtig ist: …", nicht „Leider falsch". Es gibt auch
keinen Erklärsatz (7e): Ohne gewählte Falschantwort gibt es nichts zu kontrastieren.

**Die Uhr läuft gegen einen Zeitstempel, nicht gegen einen Zähler.** Ein `setInterval` wird in einem
Hintergrund-Tab vom Browser gedrosselt; ein heruntergezählter Zähler liefe dann zu langsam und die
Frage bliebe unbegrenzt offen. Die Differenz zu `deadline` stimmt immer.

**Serien-Schlüssel (ADR 0002):** Eine Runde unter der Uhr bekommt einen **eigenen** Schlüssel
(`…,"timed":15`) — dieselbe Regel wie beim Karten-Filter aus 8b. **60 % unter Zeitdruck ist nicht
dasselbe wie 60 % in Ruhe**; liefen beide in denselben Topf, wäre die „beste Quote je Modus" wertlos.
Ohne Uhr (`0`) bleibt der Schlüssel **bitgleich** — Regressionstest vorhanden.

**Barrierefreiheit der Uhr selbst:** `role="timer"` mit **`aria-live="off"`**. Eine Uhr, die jede
Sekunde ansagt, würde in einem Screenreader die Frage und die Antwortoptionen permanent
unterbrechen. Das *Ablaufen* wird angesagt — über die Rückmeldezeile der Frage-Karte, die ohnehin
`aria-live="polite"` ist. Die letzten Sekunden **färben sich, blinken aber nicht** (WCAG 2.3.1), und
die Farbe ist nie das einzige Signal: Der Balken wird kürzer.

### ❌ Frage 20 — Audio / lateinische Aussprache: NEIN

Naheliegend gewesen wäre es (der Projektinhaber unterrichtet auch Logopädie). Trotzdem gestrichen.
**Nicht wieder vorschlagen, ohne dass er es von sich aus anspricht.**

### ❌ Frage 11 — Sozialer Vergleich / Teilen: NEIN

Kein teilbarer Ergebnis-Link, kein exportierbarer Lernstand als Bild, keine Bestenliste. Der
Backup-Export bleibt der einzige Weg, Daten aus der App zu bekommen — und der ist für den
Gerätewechsel da, nicht für den Vergleich.

### ⏸ Frage 5 — Leitner vs. SM-2/FSRS: WEITERHIN OFFEN

Faktisch sind wir bei **Leitner mit festen Intervallen** geblieben, weil das V1-Backup-Format
eingefroren ist (ADR 0002). Das war nie eine Entscheidung, es ist einfach passiert. **Anki ist an
dieser Stelle nachweislich besser.** Ein Wechsel wäre ein Bruch des Persistenzformats und damit ein
eigener, großer Task — er ist hier ausdrücklich *nicht* entschieden, nur benannt.

## Konsequenzen

- Wer einen weiteren Quiz-Parameter einführt, der die **Schwierigkeit** verändert, muss ihm einen
  eigenen Serien-Schlüssel geben. Das ist jetzt zweimal so gelöst (8b Filter, 11 Uhr) und damit
  Muster.
- Wer ein Zeitlimit an einer anderen Stelle einbaut, hält sich an dieselbe Regel: **abschaltbar, aus
  per Default.** Sonst bricht WCAG 2.2.1.
