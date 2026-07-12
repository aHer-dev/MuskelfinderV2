# ADR 0008: Abrufstufe wird aus der Leitner-Box abgeleitet, nicht gespeichert

## Status: vorgeschlagen · 2026-07-12

## Kontext
Heute muss die Studentin **vor** dem Üben wählen: Lernkarten oder Quiz? Und im Quiz: welcher der
zehn Modi? Das ist eine Frage, die sie nicht beantworten kann — sie weiß ja gerade nicht, was sie
kann. Die Modus-Wahl ist eine Entscheidungslast, die die App ihr abnehmen sollte.

Didaktisch sind Lernkarten und Quiz ohnehin dasselbe: Abruf üben. Sie unterscheiden sich nur in der
**Abrufhärte**. Kenhub steigert diese Härte pro Struktur — erst Bild-Wiedererkennen, dann schwerere
Bildfragen, am Ende **Schreibfragen** — als bewussten Schritt vom Wiedererkennen zum freien Abruf.
Unser Quiz ist heute reines Multiple Choice, also durchgehend nur Wiedererkennen. Für eine
**mündliche** Prüfung, in der niemand vier Optionen anbietet, bereitet das nicht vor.

Naheliegend wäre, pro Karte eine „Stufe“ zu speichern. Das würde jedoch ein neues persistiertes
Feld einführen — und damit die eingefrorene Backup-Struktur aus
[ADR 0002](0002-persistenz-und-datenkompatibilitaet.md) berühren.

## Entscheidung

**Die Abrufform wird aus der bestehenden Leitner-Box abgeleitet. Es wird nichts Neues gespeichert.**

| Leitner-Fach | Abrufform | Kognitiv | Status |
|---|---|---|---|
| 1–2 | Multiple Choice (4 Optionen) | wiedererkennen | vorhanden (`QuizPage`) |
| 3–4 | Bild ↔ Name zuordnen | wiedererkennen im Kontext | vorhanden (`name-image`) |
| 5–6 | Freier Abruf, Selbstbewertung | abrufen | vorhanden (`FlashcardsPage`) |
| 7 | Freitext tippen | produzieren | **neu** |

- Die Ableitung ist eine **reine Funktion** in `src/data/` (`retrievalStage(box): Stage`), getestet.
- Die Freitext-Auswertung normalisiert tolerant (Groß/Klein, Diakritika, `M.` ↔ `Musculus`, kleine
  Tippfehler), lehnt aber echte Verwechslungen ab: `M. flexor digitorum longus` darf **nicht** als
  `… brevis` durchgehen.
- Die zehn bestehenden Quizmodi verschwinden nicht — sie bleiben als **„Freies Üben“** unter
  *Lernen* erhalten, für alle, die gezielt einen Modus wählen wollen.

## Begründung
- **Einfacher:** Ein Startknopf statt einer Modus-Wahl, die niemand fundiert treffen kann.
- **Didaktisch stärker:** Die Abrufhärte wächst mit der Beherrschung, statt konstant bei der
  leichtesten Form zu bleiben. Genau das ist der Übergang vom Wiedererkennen zum Können.
- **Kompatibel:** Die Leitner-Box bleibt der einzige persistierte Schlüssel. Der
  Backup-Round-Trip-Test gegen die V1-Fixtures bleibt unverändert grün. **ADR 0002 wird nicht
  berührt** — es gibt keinen neuen Key, den eine alte Version ignorieren müsste.
- **Kostenlos in der Wiederverwendung:** Drei der vier Stufen sind bereits gebaut. Neu ist eine
  Komponente und eine Normalisierungsfunktion.

## Konsequenzen
- **Gut:** Die Stufe ist immer konsistent mit der Fälligkeit; es gibt keinen Zustand, in dem
  „Stufe“ und „Box“ auseinanderlaufen können. Ein importiertes V1-Backup bekommt die Leiter
  automatisch — Fach 6 heißt Fach 6, egal woher es kommt.
- **Kosten:** Die Kopplung ist starr. Wollte man Stufe und Fälligkeit später entkoppeln (etwa: „diese
  Karte will ich immer nur als MC“), bräuchte es doch ein eigenes Feld — dann additiv, dann mit ADR.
- **Risiko:** Die Freitext-Stufe kann frustrieren, wenn die Toleranz zu streng ist. Deshalb ist die
  Normalisierung testgetrieben und die Stufe erst ab Fach 7 aktiv — also erst, wenn der Muskel
  nachweislich sitzt.

## Alternativen
- **Eigenes `stage`-Feld pro Karte.** Verworfen: neuer persistierter Key ohne inhaltlichen Gewinn,
  und zwei Zähler, die auseinanderlaufen können.
- **Wechsel auf FSRS.** Verworfen (siehe [produkt-plan.md](../produkt-plan.md), „Bewusst nicht“):
  Bei 150 Karten über wenige Monate ist der Vorsprung gegenüber getuntem Leitner klein, und das
  Problem ist nicht das Intervall, sondern dass die Nutzerin nicht in die Session findet.
