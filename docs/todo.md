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

## Design / Produkt (offen, nicht dringend)

| Was | Notiz |
|---|---|
| **Logo oben rechts, mit Anatomie-Bezug** | Vom Projektinhaber am 2026-07-13 gewünscht: *„ich hätte gerne oben rechts ein Logo mit Anatomie-Fokus, weil die Seite so leer ist."* Stimmt — die Kopfzeile ist ein breites Suchfeld, rechts daneben ist nichts. Es gibt bereits eine Wortmarke in der linken Leiste (`public/`-Icons, 192/512/maskable). **Lizenz beachten:** kein fremdes anatomisches Bildmaterial ohne geklärte Lizenz (CLAUDE.md). Eigene Zeichnung oder ein Rendering aus der eigenen 3D-App (BodyParts3D, CC BY 4.0, Attribution) wären zulässig. |
| **3D-Renderings für die 47 bildlosen Muskeln** (8f Stufe 2a) | Zurückgestellt (2026-07-13). Lizenz **ist geklärt** ([Protokoll](3d-app-lizenzpruefung.md)), offen ist die **Qualität**: Nur 21 der 47 sind in der 3D-App überhaupt adressierbar, und der Deep-Link allein liefert kein brauchbares Bild (der Muskel liegt im Kontrollrendering hinter dem Unterkiefer). Ein Bild, auf dem der Muskel nicht zu erkennen ist, ist schlechter als kein Bild. |

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
