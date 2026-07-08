# Architektur — Muskelfinder V2

> Das mentale Modell des Projekts. Kurz halten, mit dem Code mitwachsen lassen.
> **Status: Gerüst — beim Bauen der Datenschicht (Phase 1) konkretisieren.**

## Überblick
Statische React-App (Vite-Build), kein Backend. Muskeldaten liegen als generiertes,
validiertes JSON im Repo (`src/data/generated/`) und werden ohne externe Laufzeit-Requests
geladen. Deploy als statische Seite (GitHub Pages).

## Schichten
- **Datenschicht** (`src/data/`): lädt und validiert die Muskel-JSONs,
  liefert getypte Objekte. Enthält die einzige Parse-/Mapping-Logik.
  Die V1-Migration läuft wiederholbar über `npm run migrate:data` aus dem Originalordner
  `../Muskelfinder`.
- **State** (Store/Context, geplant): hält Suchzustand, Auswahl, Quiz-Fortschritt.
  Kein Zustand über `window.*`-Globals.
- **UI** (`src/components/`, geplant): rendert nur, holt Daten über State/Datenschicht.
  Keine Parse-Logik in Komponenten.

## Grenze (die harte Regel)
UI ↔ Datenschicht reden über getypte Objekte und den State — nicht über
verstreute Modul-Globals und nicht mit roher JSON-Parse-Logik in JSX.

## Daten & Lizenz
Muskelbilder basieren auf BodyParts3D (DBCLS), CC BY 4.0 — Attribution ist Pflicht
und muss auf der jeweiligen Detailseite sichtbar sein. Die migrierten Bilddateien liegen in
`public/muscles/`; die Attribution wird je Bild in den Muskeldaten gespeichert.
Siehe ADR 0005.
