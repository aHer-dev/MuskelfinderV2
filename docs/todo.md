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
| **Wadengruppe fällt aus dem Gruppen-Quiz** | Folge deiner Abnahme („ohne Plantaris"): Die Gruppe hat nur noch 2 Mitglieder, eine 4-Optionen-Frage braucht 3 + einen Fremden. Gruppenseite und Abzeichen laufen normal. Sag Bescheid, wenn du den Plantaris als Mitglied zurück willst. |
| **Tagesbonus feuert auf dem leeren Kasten** | Seit ADR 0009 landet man beim Erststart auf dem Guide — und bekommt dort „+10 XP · Tagesbonus", ohne etwas getan zu haben. Vorher startete sofort eine Sitzung, da passte es. Kosmetisch, aber schief. |
