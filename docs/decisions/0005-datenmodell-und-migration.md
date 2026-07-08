# ADR 0005: Datenmodell & Migration der Muskeldaten

## Status: akzeptiert · 2026-07-08

## Kontext
Etappe 1 migriert die V1-Daten aus dem Originalordner `../Muskelfinder` in ein sauberes,
getyptes V2-Datenmodell. V1 speichert die Muskeln als vier JSON-Dateien mit
`{"Sheet1":[...]}`-Wrapper, gemischten Feldtypen und Bildpfaden unter `assets/images/`.
V2 soll keine XLSX-/Sheet-Altlasten zur Laufzeit tragen.

## Entscheidung

- `../Muskelfinder` ist die kanonische Quelle. `npm run migrate:data` liest sie per Default,
  alternativ über `MUSKELFINDER_V1_SOURCE` oder `--source`.
- Commit-fähige Runtime-Daten liegen unter `src/data/generated/`; Bilder werden nach
  `public/muscles/` kopiert. V1-Wrapper und XLSX-Dateien werden nicht übernommen.
- `nameLatin` bleibt exakt V1-`Name` und ist damit weiter der Backup-Schlüssel nach ADR 0002.
- Routing-`id` wird aus `Name` gesluggt. Da V1 fünf doppelte Namen enthält, bekommen nur
  Kollisionen einen stabilen Suffix aus Region, Subgruppe und erstem Bewegungslabel.
- `taCode` ist optional. V1 liefert keine TA-Codes; sie werden nicht erfunden.
- V1-`Function` wird als `functionDescription` erhalten. V1-`Movements` wird in
  `functions[]` über das generierte Movement-Wörterbuch `movements.json` abgebildet.
- `Segments` wird heuristisch getrennt: top-level Nerven-/Plexus-Anteile bleiben in
  `innervation`; spinalsegmentartige Tokens (`C5`, `Th1–Th4`, `L2`, `S3` usw.) wandern nach
  `segments`. Nicht eindeutig trennbare oder segmentlose Fälle stehen im Migrationsreport.
- Bilder speichern relative, base-taugliche URLs (`muscles/...`) und je Bild Attribution,
  Lizenz und Lizenz-URL. Die Quelle bleibt BodyParts3D (DBCLS), CC BY 4.0.
- `src/data/loader.ts` validiert JSON beim Import und exportiert nur getypte, eingefrorene
  Daten plus ID-Lookups. UI-Komponenten parsen kein JSON.

## Konsequenzen

- Die Migration ist wiederholbar und testbar, ohne persönliche absolute Pfade in der App.
- 150 V1-Datensätze ergeben 150 V2-Muskeln; 168 Bildreferenzen zeigen auf 152 eindeutige
  kopierte Bilddateien. 47 V1-Datensätze bleiben bewusst ohne Bild.
- Der Migrationsreport dokumentiert verbleibende manuelle Prüfpunkte statt sie zu raten.
- Detailseiten können später sowohl kurze Bewegungs-Chips als auch den ausformulierten
  Funktionstext anzeigen.
