# Kursabschnitte eintragen

Die Datei: **`src/data/editorial/curriculum.json`**
Sie ist im Auslieferungszustand **leer** — und das bleibt so, bis du sie füllst.

> **Warum leer?** Ein Kursabschnitt ist eine Behauptung darüber, was in deinem Unterricht
> drankommt und geprüft wird. Rät die KI ihn, lernt ein Schüler den falschen Stoff für die
> falsche Prüfung. Dieselbe Regel wie bei der Palpation. **Kein Agent trägt hier etwas ein.**

## Format

Abschnitte liegen **nach Beruf getrennt**, weil Kurs 1 der Logopädie nicht Kurs 1 der
Physiotherapie ist. Der Beruf, den ein Schüler beim Erststart wählt, entscheidet, welche
Abschnitte er sieht.

```json
{
  "_hinweis": "… nicht anfassen …",
  "kurse": {
    "physio": [
      {
        "id": "kurs-1-untere-extremitaet",
        "label": "Kurs 1 — Untere Extremität",
        "muscles": [
          "M. gluteus maximus",
          "M. rectus femoris",
          "M. biceps femoris – Caput longum"
        ]
      },
      {
        "id": "kurs-2-schultverguertel",
        "label": "Kurs 2 — Schultergürtel",
        "muscles": ["M. deltoideus", "M. supraspinatus"]
      }
    ],
    "ergo": [],
    "logo": []
  }
}
```

- **`id`** — kleingeschrieben, mit Bindestrichen, **einmalig je Beruf**. Sie wandert in Links,
  also nachträglich nicht mehr ändern. Zwei Abschnitte mit derselben `id`: der zweite wird
  ignoriert.
- **`label`** — was der Schüler liest. Schreib es so, wie du es im Unterricht nennst.
- **`muscles`** — die Muskelnamen **exakt so, wie sie in der App stehen** (siehe unten).
  Reihenfolge egal, Dubletten werden stillschweigend entfernt.

Ein Abschnitt **ohne Muskeln** wird ignoriert — er würde nur einen toten Knopf erzeugen.

## Die Namen müssen exakt stimmen

Der Schlüssel ist der lateinische Name, wie ihn die App führt (`nameLatin`). **Ein Tippfehler
lässt den Build scheitern** — mit der Meldung, welcher Name nicht existiert. Das ist Absicht:
Ein stillschweigend verschwundener Muskel wäre eine Lücke im Kurs, die niemandem auffällt.

**Die Falle:** Bei den zusammengesetzten Namen steht ein **Gedankenstrich (–)**, kein Bindestrich (-):

```
M. trapezius – Pars descendens      ✅ richtig (–)
M. trapezius - Pars descendens      ❌ Build bricht ab (-)
```

Am sichersten kopierst du den Namen direkt aus der App (Detailseite oder Suche) oder aus
`src/data/generated/muscles.json`.

**Fünf Namen gibt es doppelt** (einmal Hand, einmal Fuß) — `M. flexor digiti minimi brevis`,
`M. abductor digiti minimi`, `M. opponens digiti minimi`, dazu `M. nasalis` und
`M. occipitofrontalis`. Für die App sind das je **eine** Karte. Wenn du den Handmuskel meinst,
bekommst du beide; das lässt sich mit `nameLatin`-Schlüsseln nicht trennen (siehe
`docs/PROJECT_STATE.md`, Abschnitt Hypothenar).

## Was danach passiert

Sobald ein Beruf mindestens einen Abschnitt hat, erscheint auf der Startseite („Heute") und im
Karteikasten der Weg **„Nach Kursabschnitt"**: Der Schüler wählt „Kurs 2 — Schultergürtel", und
genau diese Muskeln wandern als Karten in seinen Kasten.

Solange kein Abschnitt eingetragen ist, steht dort ein Platzhalter — kein leeres Menü.

## Prüfen

```bash
npm run test    # die Curriculum-Tests prüfen Format und Namen
npm run build   # ein unbekannter Muskelname bricht hier ab
```
