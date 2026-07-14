# TODO — was offen ist

> Der Code-Fahrplan (Etappen 0–10) ist durch. Was hier steht, braucht entweder den
> **Projektinhaber** (Fachinhalt, Deploys) oder ist ein **bewusst zurückgestellter** Task.
> Stand: 2026-07-13. Single Source of Truth bleibt [PROJECT_STATE.md](PROJECT_STATE.md).

## Braucht den Projektinhaber (Fachinhalt — kein Agent macht das)

| Was | Warum nur du | Anleitung |
|---|---|---|
| **Palpationstexte eintragen** | Ein falscher Landmarken-Hinweis wird auswendig gelernt und am Patienten angewandt. Die Texte kommen aus dem **Skript deiner Kollegen**. Am 2026-07-13 hast du alle 21 KI-Vorschläge gestrichen — zu Recht. Bis dahin steht auf **allen 150** Detailseiten ein Platzhalter. | [palpation-erfassen.md](palpation-erfassen.md) |
| **Kursabschnitte eintragen** | Ein Kursabschnitt ist eine Behauptung darüber, was geprüft wird. Rät die KI ihn, lernt ein Schüler den falschen Stoff für die falsche Prüfung. Solange leer, zeigt der Erststart einen Platzhalter statt der Kursauswahl. | [curriculum-erfassen.md](curriculum-erfassen.md) |

## Braucht dich (Deploy / Betrieb)

| Was | Stand |
|---|---|
| **3D-App neu deployen** — `aher-dev.github.io/3DAnatomyV2/datenschutz.html` liefert **HTTP 404** | Der Fix liegt im 3D-Repo bereits als HEAD (`f209896`). Nur pushen. Der einzige echte Makel an der öffentlichen App. |
| **V1 abschalten oder Hinweis setzen** — `aher-dev.github.io/Muskelfinder/` ist noch live | Du sagtest: „läuft weiter, egal". Kein Blocker. |

## ⚠️ Der Hand-Kleinfingerballen ist über Karten nicht lernbar (offen, braucht eine Entscheidung)

Am 2026-07-14 beim Mobil-Durchlauf gefunden und **zur Hälfte** behoben.

**Drei `nameLatin` gibt es zweimal, einmal Hand und einmal Fuß:**
`M. abductor digiti minimi`, `M. flexor digiti minimi brevis`, `M. opponens digiti minimi`.
(`M. nasalis` und `M. occipitofrontalis` sind ebenfalls doppelt, aber beide Hälften liegen im
Kopf — dort ist es harmlos.)

Karten sind nach `nameLatin` geschlüsselt (ADR 0002 §2), und der Namens-Index löst so ein Paar auf
**genau einen** Muskel auf — auf den **Fuß**. Das heißt heute:

- Wer „Obere Extremität" wählt, hat **drei Karten im Kasten, die als „Untere Extremität" rendern**
  und Fuß-Fakten abfragen. Die Zahl am Knopf (53) stimmt, die Zeilen stimmen (53) — der **Inhalt**
  dieser drei Karten nicht.
- Der Handmuskel ist über Karten **gar nicht** lernbar. Nachschlagen geht (die Detailseite routet
  über `id` und ist korrekt), Lernen nicht.
- Es ist dieselbe Wurzel, an der schon die Gruppe **Hypothenar** gestorben ist (siehe
  PROJECT_STATE). Damals wurde die Gruppe entfernt; der Kartenweg blieb.

**Behoben ist nur die Entdopplung** (`isCardMuscle` / `CARD_MUSCLES`): keine Phantom-Zeilen mehr,
keine widersprüchlichen Zahlen, „Entfernen" löscht nicht mehr zwei Karten auf einmal.

**Das echte Gegenmittel bricht ADR 0002** und ist darum deine Entscheidung:

| Weg | Preis |
|---|---|
| `nameLatin` eindeutig machen (z. B. `M. abductor digiti minimi (Fuß)`) | Bricht den Backup-Schlüssel. V1-Backups (V1 ist noch live!) verlieren diese Karten, es braucht eine Migrationsregel. Danach sind Hand und Fuß zwei echte Karten. |
| Karten zusätzlich nach `id` schlüsseln | Sauberstes Datenmodell, größter Umbau — ADR 0002 §2 fällt. |
| So lassen | Drei von 150 Muskeln bleiben falsch beschriftet und der Handmuskel unlernbar. |

## Design / Produkt (offen, nicht dringend)

| Was | Notiz |
|---|---|
| **3D-Renderings für die 47 bildlosen Muskeln** (8f Stufe 2a) | Zurückgestellt (2026-07-13). Lizenz **ist geklärt** ([Protokoll](3d-app-lizenzpruefung.md)), offen ist die **Qualität**: Nur 21 der 47 sind in der 3D-App überhaupt adressierbar, und der Deep-Link allein liefert kein brauchbares Bild (der Muskel liegt im Kontrollrendering hinter dem Unterkiefer). Ein Bild, auf dem der Muskel nicht zu erkennen ist, ist schlechter als kein Bild. |
| **Der Erststart ist immer noch textlastig** | Behoben ist die *Reihenfolge* („Nach Bereich" steht jetzt vor dem leeren Kursabschnitt-Platzhalter). Der erste Karten-Knopf liegt damit bei **y = 611** von 664 px — er ist sichtbar, aber gerade so. Darüber stehen weiterhin Marke, Suchfeld, Überschrift und fünf Zeilen Fließtext. Den Text zu kürzen ist eine **Textentscheidung des Inhabers**, kein Agenten-Job. |

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
