# TODO — was offen ist

> Der Code-Fahrplan (Etappen 0–10) ist durch. Was hier steht, braucht entweder den
> **Projektinhaber** (Fachinhalt, Deploys) oder ist ein **bewusst zurückgestellter** Task.
> Stand: 2026-07-27. Single Source of Truth bleibt [PROJECT_STATE.md](PROJECT_STATE.md).

## Braucht den Projektinhaber (Fachinhalt — kein Agent macht das)

> **Zum Gegenlesen gibt es Tabellen:** `npm run export:csv` schreibt den kompletten Bestand nach
> `docs/pruefung/csv/` — je Region, je Gelenkgruppe, die Berufs-Vorsortierung, die
> doppelten Felder. **Die Dateien liegen nicht im Repo** (erzeugt, siehe `.gitignore`) — erst
> den Befehl laufen lassen, dann sind sie da. Was welche Datei enthält und wo eine Korrektur
> hingehört: [pruefung/LIESMICH.md](pruefung/LIESMICH.md).

| Was | Warum nur du | Anleitung |
|---|---|---|
| **Palpationstexte eintragen** | Ein falscher Landmarken-Hinweis wird auswendig gelernt und am Patienten angewandt. Die Texte kommen aus dem **Skript deiner Kollegen**. Am 2026-07-13 hast du alle 21 KI-Vorschläge gestrichen — zu Recht. Bis dahin steht auf **allen 150** Detailseiten ein Platzhalter. | [palpation-erfassen.md](palpation-erfassen.md) |
| **Kursabschnitte eintragen** | Ein Kursabschnitt ist eine Behauptung darüber, was geprüft wird. Rät die KI ihn, lernt ein Schüler den falschen Stoff für die falsche Prüfung. Solange leer, zeigt der Erststart einen Platzhalter statt der Kursauswahl. | [curriculum-erfassen.md](curriculum-erfassen.md) |
| **Ergo: obere Extremität und Rumpf nachschärfen** (dein Punkt vom 2026-07-27) | Zwei getrennte Fragen, beide fachlich: **(1)** Welche Gelenkgruppen stehen einem Ergo unter „Typisch für dich" oben? Heute sind es vier — `hand`, `ellenbogen`, `schultergelenk`, `schulterguertel` (`TYPICAL` in `src/data/joint-groups.ts`). Wirbelsäule/Rumpf ist bewusst **nicht** dabei; du sagtest, das stimmt so nicht. **(2)** Was steckt inhaltlich in „obere Extremität" und „Rumpf" für die Ergos — gehört etwas hinein oder heraus? Ein Agent rät das nicht: Die Reihenfolge ist eine Aussage darüber, womit dein Kurs anfängt. **Nichts ist versteckt** — alle elf Gruppen bleiben für jeden Beruf wählbar (Prüfzeile in `joint-groups.test.ts`), es geht nur um die Vorsortierung. Sag mir die Liste je Beruf, dann ist es ein Zweizeiler. | — |

## Braucht dich (Deploy / Betrieb)

| Was | Stand |
|---|---|
| ~~3D-App neu deployen (datenschutz.html → 404)~~ | **ERLEDIGT 2026-07-14.** Alle Rechtsseiten liefern HTTP 200. |
| ~~Pages-Schalter für den Muskelfinder~~ | **ERLEDIGT.** `aher-dev.github.io/MuskelfinderV2/` ist live und trägt den aktuellen Stand. |
| **V1 abschalten oder Hinweis setzen** — `aher-dev.github.io/Muskelfinder/` ist noch live | Du sagtest: „läuft weiter, egal". Kein Blocker. |
| **Nach jedem 3D-Deploy den Link einmal live klicken** | Kein Task, eine **Gewohnheit**. Der Deep-Link ist ein Vertrag mit einem fremden Repo: Ein Deploy dort kann ihn brechen, ohne dass hier eine Zeile Code fällt — und **kein Test von uns merkt es**. Genau so ist es am 2026-07-14 passiert (der „Vorschau-Modus" der 3D-App löschte die komplette Bedienoberfläche). |

## ✅ Der Hand-Kleinfingerballen ist lernbar (ERLEDIGT 2026-07-26 — ADR 0012)

Am 2026-07-14 gefunden, am 2026-07-26 behoben. Hier stand über zwölf Tage die Frage, ob es den
Bruch von ADR 0002 wert sei. **Es brauchte keinen Bruch.**

**Das Problem:** `M. abductor digiti minimi`, `M. flexor digiti minimi brevis` und
`M. opponens digiti minimi` heißen in der Hand genauso wie im Fuß. Karten waren nach `nameLatin`
geschlüsselt (ADR 0002 §2), der Namensindex löste auf den **Fuß** auf — also bekam, wer die Hand
lernte, drei Karten mit Kleinzehen-Fakten, und der Handmuskel war über Karten gar nicht erreichbar.

**Die Lösung:** Der Kartenschlüssel wurde vom Anzeigenamen getrennt (`src/data/card-key.ts`).
Der **Fuß behält** den historischen Schlüssel, die Hand bekommt `…#manus`. Damit ist die Änderung
rein **additiv** — genau wie die Sektionen `lookups`, `profile`, `streak` und `notes` es im
Backup-Format schon waren:

| | |
|---|---|
| Alte Backups importieren | unverändert, derselbe Muskel wie vorher |
| Export | schreibt denselben Schlüssel zurück, kein Round-Trip-Bruch |
| Migrationsregel | **keine nötig** |
| Bestandsnutzer | verlieren nichts |
| Karten insgesamt | 145 → **148** |

Die drei Wege aus der alten Tabelle sind damit erledigt: `nameLatin` eindeutig machen hätte den
Backup-Schlüssel gebrochen, „nach `id` schlüsseln" wäre der größte Umbau gewesen, „so lassen"
war der Preis, den niemand zahlen wollte. Der vierte Weg — Schlüssel ≠ Name — kostet keinen davon.

Volle Begründung, Preis und Prüfzeilen: [ADR 0012](decisions/0012-kartenschluessel-statt-anzeigename.md).

**Was das NICHT heilt** (Datenfrage, keine Schlüsselfrage): `M. nasalis` und
`M. occipitofrontalis` stehen je zweimal im Bestand — derselbe Muskel in zwei Funktionszeilen
(Pars transversa / Pars alaris). Sie sind zu Recht **eine** Karte, aber diese Karte zeigt nur
**eine** der beiden Funktionen. Wenn dir das im Unterricht auffällt, ist es ein Fall für die
Muskeldaten, nicht für den Code.

## Design / Produkt (offen, nicht dringend)

| Was | Notiz |
|---|---|
| **3D-Renderings für die 47 bildlosen Muskeln** (8f Stufe 2a) | Zurückgestellt (2026-07-13). Lizenz **ist geklärt** ([Protokoll](3d-app-lizenzpruefung.md)), offen ist die **Qualität**: Nur 21 der 47 sind in der 3D-App überhaupt adressierbar, und der Deep-Link allein liefert kein brauchbares Bild (der Muskel liegt im Kontrollrendering hinter dem Unterkiefer). Ein Bild, auf dem der Muskel nicht zu erkennen ist, ist schlechter als kein Bild. |
| **Der Erststart ist immer noch textlastig** | Behoben ist die *Reihenfolge* („Nach Gelenk" steht vor dem leeren Kursabschnitt-Platzhalter). **Am 2026-07-26 nach den Gelenkgruppen neu gemessen** (390×664): Der erste Gruppen-Knopf liegt bei **y = 608** von 664 px, die Seite ist 2381 px hoch. Er ist ohne Scrollen sichtbar, aber gerade so. Darüber stehen weiterhin Marke, Suchfeld, Überschrift und fünf Zeilen Fließtext. Den Text zu kürzen ist eine **Textentscheidung des Inhabers**, kein Agenten-Job. |

## Entschieden und abgelehnt (nicht wieder vorschlagen)

| Was | Entscheidung |
|---|---|
| **Audio / lateinische Aussprache** | **Nein** (2026-07-13). Trotz Logopädie-Bezug gestrichen. |
| **Sozialer Vergleich, teilbarer Ergebnis-Link, Lernstand als Bild** | **Nein** (2026-07-13). Der Backup-Export bleibt der einzige Datenausgang — für den Gerätewechsel, nicht für den Vergleich. |
| **Merksätze / Eselsbrücken** | **Nein** (2026-07-13, Abnahme). Feld, Typ und Anzeige wurden entfernt. |
| **Automatisches Startdeck** | **Nein** (ADR 0009). Der Schüler wählt selbst. |

## Offen, aber groß

| Was | Notiz |
|---|---|
| **Leitner vs. SM-2/FSRS** | Frage 5 des Brainstormings — **weiterhin offen, aber entschärft.** Der teuerste Teil des Rückstands war der 90-Tage-Fehler bei vergessenen Karten; der ist mit [ADR 0011](decisions/0011-vergessene-karte-faellt-auf-fach-2.md) behoben. Was bleibt: Anki (FSRS) gibt jeder Karte ihr eigenes Intervall statt einer festen Leiter. Ein Wechsel scheitert **nicht** am Backup-Format (additiv erweiterbar), sondern an **ADR 0008** — die Abrufhärte wird aus dem Leitner-Fach abgeleitet, und die Abzeichen hängen auch daran. Umbau, kein Austausch. Bei 150 Muskeln über ein bis zwei Semester lohnt er vermutlich nicht. |
