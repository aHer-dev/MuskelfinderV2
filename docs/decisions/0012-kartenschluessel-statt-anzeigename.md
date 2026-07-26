# ADR 0012 — Der Kartenschlüssel ist nicht der Anzeigename

- Status: angenommen
- Datum: 2026-07-26
- Betrifft: `src/data/card-key.ts` (neu), `src/data/loader.ts`, alle Module, die Karten auf
  Muskeln abbilden
- Nachtrag zu: **ADR 0002 §2** — dessen Backup-Vertrag bleibt **unangetastet**
- Erledigt: den offenen Punkt „Der Hand-Kleinfingerballen ist über Karten nicht lernbar"
  aus `docs/todo.md` (offen seit 2026-07-14)

## Kontext

ADR 0002 §2 schlüsselt Lernkarten nach `nameLatin`, damit V1-Backups verlustfrei einlesbar
bleiben. Das trägt für 145 von 150 Muskeln. Für drei trägt es nicht:

| `nameLatin` | steht im Bestand als |
|---|---|
| `M. abductor digiti minimi` | Hand & Finger (upper) **und** Fuß & Sprunggelenk (lower) |
| `M. flexor digiti minimi brevis` | dito |
| `M. opponens digiti minimi` | dito |

Das sind **zwei verschiedene Muskeln mit einem Namen**. Ein Namensindex kann nur einen davon
zurückgeben, und er gab — allein wegen der Zeilenreihenfolge in `muscles.json` — den Fuß zurück.
Gemessen hieß das:

- Wer „Obere Extremität" oder später die Gelenkgruppe „Hand" wählte, bekam **drei Karten mit
  Kleinzehen-Fakten**, beschriftet mit „Untere Extremität".
- Der **Handmuskel war über Karten überhaupt nicht lernbar**. Nachschlagen ging (die Detailseite
  routet über `id`), Lernen nicht.
- Es ist dieselbe Wurzel, an der schon `seedDeck` (ADR 0009), die funktionelle Gruppe
  **Hypothenar** und die Kasten-Tabelle („53 Karten, 56 Zeilen") gestorben sind. Jedes Mal wurde
  die Oberfläche repariert und die Wurzel stehen gelassen.

Zwei weitere Namen sind ebenfalls doppelt — `M. nasalis` und `M. occipitofrontalis` —, aber das
ist **kein** Namenskonflikt: Beide Hälften sind derselbe Muskel in zwei Funktionszeilen (Pars
transversa / Pars alaris). Sie sollen **eine** Karte bleiben.

## Entscheidung

### 1. Schlüssel und Anzeigename werden getrennt

```
cardKey(muscle)    = womit die Karte gespeichert wird     — nie sichtbar
muscle.nameLatin   = was auf der Karte steht              — nie ein Schlüssel
```

Für 147 Muskeln sind beide gleich. Die drei Handmuskeln bekommen den anatomischen Zusatz aus der
Terminologia Anatomica, abgesetzt durch `#`:

```
M. abductor digiti minimi          → der Fußmuskel   (unverändert)
M. abductor digiti minimi#manus    → der Handmuskel  (neu)
```

`CARD_MUSCLES` wächst damit von 145 auf **148**.

### 2. Der FUSS behält den historischen Schlüssel

Nicht aus fachlichen Gründen, sondern weil er ihn schon besitzt: Jede Karte, die je unter
`M. abductor digiti minimi` angelegt wurde — auch in V1, das noch live ist —, meint den Fuß.

Damit ist die Änderung **rein additiv**:

- Import eines alten Backups: unverändert. Der Schlüssel landet auf demselben Muskel wie vorher.
- Export: schreibt denselben Schlüssel zurück. Round-Trip ohne Umbenennung.
- Der Handschlüssel ist einer, den alte Dateien nicht enthalten — also fehlt die Karte, was
  exakt dem bisherigen Zustand entspricht. **Kein Bestandsnutzer verliert etwas, und es braucht
  keine Migrationsregel.**

Das ist derselbe Weg, den `lookups`, `profile`, `streak` und `notes` als optionale Sektionen
schon gegangen sind. **ADR 0002 §1 bleibt darum wörtlich gültig.**

### 3. Eine handgeschriebene Ausnahmeliste, keine Regel

`OWN_CARD` in `src/data/card-key.ts` nennt die drei Muskeln namentlich. Eine Regel („bei
Namensgleichheit die Region anhängen") hätte `M. nasalis` mitgerissen und ihn in zwei Karten
zerlegt — fachlich falsch. Das Unterscheidungsmerkmal ist nicht der Name, sondern die
**Subregion**, und diese Entscheidung gehört ausgeschrieben.

Damit die Liste nicht still veraltet, prüft `assertCardKeys` beim Laden der Daten:

1. Kein `nameLatin` enthält `#`.
2. Jeder Eintrag der Liste trifft wirklich einen Muskel (sonst: Tippfehler = Ausnahme, die nie
   greift = Handmuskel wieder unlernbar).
3. Gleicher Name + **andere** Subregion ⇒ verschiedene Schlüssel.
   Gleicher Name + **gleiche** Subregion ⇒ derselbe Schlüssel.

Punkt 3 ist die eigentliche Absicherung: Ein neues Hand/Fuß-Paar, das jemand einpflegt, **lässt
die App beim Start scheitern**, statt einen der beiden still zu verschlucken.

### 4. `#` und keine Klammer

Gemessen, nicht vermutet: `acceptedForms` in `answer-check.ts` liest einen Klammerzusatz als
**Synonym** (`M. fibularis longus (M. peroneus longus)` — beide Namen sind richtig). Ein
Schlüssel `M. abductor digiti minimi (Hand)` hätte, sobald er je in ein Anzeigefeld gerät, in
Fach 7 die Eingabe **„Hand"** als richtige Antwort gewertet:

```
checkAnswer('Hand', ziel) → { verdict: 'correct', matched: 'M. abductor digiti minimi (Hand)' }
```

`#` kommt in keinem lateinischen Namen vor und ist kein Namensbestandteil.

### 5. Wo zwei Karten denselben Namen tragen, muss die Liste sie trennen

Auf der Karte selbst ist Namensgleichheit egal — man sieht immer nur eine. In einer **Liste**
nicht. `hasNameTwin(muscle)` markiert die drei Fälle; die Kasten-Tabelle trennt sie über die
Spalte „Bereich", die Auswahlliste über die Subregion, und der Entfernen-Knopf trägt sie im
`aria-label` (zwei Knöpfe mit identischem zugänglichem Namen sind für eine Screenreader-Nutzerin
dieselbe Zeile). Für die übrigen 145 bleibt alles unverändert.

## Konsequenzen

- **Gut:** Drei Muskeln sind erstmals lernbar; drei Karten zeigen nicht mehr die Fakten eines
  anderen Körperteils. Die funktionelle Gruppe **Hypothenar** wäre wieder baubar (fachliche
  Entscheidung des Projektinhabers). Redaktionelle Ebenen (`groups.json`, `curriculum.json`,
  `palpation.json`) schlüsseln jetzt nach Kartenschlüssel und können Hand und Fuß
  auseinanderhalten — vorher hätte ein Palpationshinweis für den Fuß auch auf der Handseite
  gestanden.
- **Preis:** Es gibt einen Bezeichner mehr im Kopf zu behalten. Wer `m.nameLatin` als Schlüssel
  benutzt, baut denselben Fehler neu — deshalb heißt die Auflösefunktion jetzt
  `getMuscleByCardKey` und nicht mehr `getMuscleByLatinName`.
- **Nicht behoben:** `M. nasalis` und `M. occipitofrontalis` sind je zwei Funktionszeilen, von
  denen die Karte nur **eine** zeigt (die letzte im Bestand). Das ist eine Datenfrage, keine
  Schlüsselfrage.
- **Etymologie bleibt nach `nameLatin` geschlüsselt.** Die Herleitung eines Namens ist eine
  Eigenschaft des **Namens**, nicht des Muskels — Hand und Fuß teilen sie zu Recht.

## Prüfzeilen

| Wo | Was |
|---|---|
| `src/data/card-key.test.ts` | Schlüssel↔Muskel-Bijektion · Fuß behält den historischen Schlüssel · Zusatz ist keine akzeptierte Antwort · vier Gegenproben gegen `assertCardKeys` |
| `src/persistence/backup-roundtrip.test.ts` | V1-Backup behält seinen Schlüssel · erfindet keine Handkarte · Hand und Fuß überleben Export → Import als zwei Karten |
| `src/data/loader.test.ts` | 148 Karten, nicht 145 |
| `src/data/joint-groups.test.ts` | Die drei Namen liegen in **beiden** Gruppen, jeder mit seinem Schlüssel |
| `src/data/quiz-pool.test.ts` | Hand und Fuß sind zwei Fragen; die Funktionszeilen sind eine |
| `src/data/today.test.ts` | Ein Muskel mit zwei Funktionszeilen belegt nur einen Vorschlagsplatz |
| `src/pages/DeckManagerPage.test.tsx` | Zwei Zeilen, unterscheidbar, getrennt entfernbar |
| `scripts/check-journey.mjs` Station 2c | Im Browser: „Hand" legt die Handkarte an, die Zeile führt zum Handmuskel |

**Gegengetestet:** Mit geleerter `OWN_CARD` startet die App nicht mehr — `assertCardKeys` wirft
beim Laden der Daten. Der Zustand vor diesem ADR ist nicht mehr erreichbar, ohne die Prüfung
selbst zu entfernen.
