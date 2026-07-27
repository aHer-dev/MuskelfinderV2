# Fachliche Prüfung — die Daten als Tabellen

Erzeugt mit **`npm run export:csv`** (`scripts/export-csv.mjs`), Ziel: [csv/](csv/).
Stand des letzten Laufs: **2026-07-27** · 150 Datensätze · 148 Karten · 11 Gelenkgruppen.

> **Diese Dateien sind erzeugt.** Wer sie bearbeitet, ändert an der App nichts — der Weg ist:
> hier lesen, in der Quelle ändern (Tabelle unten), `npm run verify`, `npm run export:csv`.
> Das Skript lädt dieselben Module wie die App, es deutet die JSONs nicht ein zweites Mal.
> Ein Export, der eine eigene Meinung über die Daten hätte, wäre genau der Fehler, den er
> aufdecken soll.

**Format:** Semikolon, UTF-8 mit BOM, CRLF — Excel (deutsch) öffnet sie mit Doppelklick,
Umlaute stimmen, kein Import-Dialog. Mehrfachwerte in einer Zelle stehen mit ` · ` getrennt.

## Womit anfangen

| Wenn du … | dann |
|---|---|
| **die Ergo-Frage klären** willst (dein offener Punkt) | `berufe-vorsortierung.csv`, dann `gruppe-hand.csv` / `gruppe-ellenbogen.csv` / `gruppe-schultergelenk.csv` / `gruppe-schulterguertel.csv` / `gruppe-wirbelsaeule.csv` |
| **Fachinhalt gegenlesen** willst (Ursprung, Ansatz, Innervation …) | die vier `region-*.csv` — sie sind nach Subregion sortiert, also in der Reihenfolge, in der du unterrichtest |
| **wissen willst, was eine Gruppe wirklich enthält** | `gruppe-*.csv`; die letzte Spalte „Liegt auch in" zeigt die Mehrfachzugehörigkeit |
| **alles auf einmal** willst | `00-alle-muskeln.csv` |

## Die Dateien

| Datei | Zeilen | Was drinsteht |
|---|---|---|
| `00-alle-muskeln.csv` | 150 | Alle Datensätze mit allen Fachfeldern. **150, nicht 148:** `M. nasalis` und `M. occipitofrontalis` stehen je zweimal im Bestand (Pars transversa / Pars alaris) und sind trotzdem **eine** Karte. Die Spalte „Eigene Karte" sagt, welche Zeile eine Karte ist — die zweite Funktionszeile ist eine fachliche Frage an dich. |
| `region-kopf-hals.csv` · `region-wirbelsaeule-rumpf.csv` · `region-obere-extremitaet.csv` · `region-untere-extremitaet.csv` | 24 · 20 · 53 · 53 | Dieselben Spalten je Region, nach Subregion sortiert. |
| `gruppe-*.csv` (11 Dateien) | 8–26 | Je Gelenkgruppe, so wie der Karteikasten gefüllt wird. Gelesen über den **Kartenschlüssel**: Es steht der Muskel drin, den die Karte wirklich zeigt — nicht der, der zufällig denselben Namen trägt (Hand/Fuß, ADR 0012). |
| `berufe-vorsortierung.csv` | 33 | Beruf × Gelenkgruppe: Rang, „typisch ja/nein", Kartenzahl. **Es wird nur sortiert, nichts versteckt** — jeder Beruf erreicht alle elf Gruppen. |
| `funktionelle-gruppen.csv` | 60 | Die handgepflegten funktionellen Gruppen (Thenar, Rotatorenmanschette …) mit Region und Subregion jedes Mitglieds. |
| `ohne-bild.csv` | 47 | Die bildlosen Muskeln — die einzige Lücke, die sich von Muskel zu Muskel unterscheidet. Spalte „In der 3D-App vorhanden": **21 von 47**. Herkunft und Klinik stehen bei allen 150, die Palpation bei keinem — eine Spalte, die 150-mal dasselbe sagt, wäre keine Liste. |
| `doppelte-felder.csv` | 58 | Wo zwei Muskeln sich Name, Ursprung, Ansatz, Funktionstext oder Innervation **wörtlich** teilen. Kein Programmfehler; ob es ein Datenfehler ist, weißt nur du. Spalte „Ist derselbe Muskel" trennt die echten Kollisionen von den zwei Funktionszeilen desselben Muskels. Diese Liste ist zugleich der Grund für die Zwillingssperre im Quiz (`gueltigeAntworten`). |

## Wo eine Korrektur hingehört

| Spalte / Befund | Quelle |
|---|---|
| Ursprung · Ansatz · Funktion · Innervation · Segmente · Klinik · Bilder · Subregion · Gelenke | `src/data/generated/muscles.json` — **Achtung:** Der Ordner `generated/` wird von `npm run migrate:data` neu erzeugt. Die V1-Quelle (`../Muskelfinder`) liegt auf diesem Rechner **nicht** mehr. Solange sie fehlt, ist eine Korrektur dort eine Änderung an einer Datei, die ein Migrationslauf überschreiben würde — sag Bescheid, dann heben wir sie so ab, dass sie das überlebt. |
| Welche Muskeln in einer **Gelenkgruppe** liegen | `JOINT_GROUP_DEFS` in `src/data/joint-groups.ts` (Etiketten aus `joints`/`subregion` — nichts erfunden) |
| Welche Gruppen ein **Beruf** zuerst sieht | `TYPICAL` in derselben Datei |
| **Funktionelle Gruppen** | `src/data/editorial/groups.json` |
| **Palpation** | `src/data/editorial/palpation.json` → [palpation-erfassen.md](../palpation-erfassen.md) |
| **Herkunft/Etymologie** | `src/data/editorial/etymology.json` |
| **Kursabschnitte** | `src/data/editorial/curriculum.json` → [curriculum-erfassen.md](../curriculum-erfassen.md) |

Was die Automatik prüfen kann und was nicht: [pruefstrategie.md](../pruefstrategie.md).
Offene Punkte: [todo.md](../todo.md).
