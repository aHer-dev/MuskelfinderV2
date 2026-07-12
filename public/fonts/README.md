# Fonts (self-hosted)

Diese App bindet **keine** externen Font-CDNs ein (Architektur-Grenze: keine
Laufzeit-Requests nach außen). Sora + Manrope liegen als `.woff2` hier im Repo
und werden über `src/styles/fonts.css` per `@font-face` geladen.

## Vorhandene Dateien
```
sora-400.woff2    sora-500.woff2    sora-600.woff2    sora-700.woff2    sora-800.woff2
manrope-400.woff2 manrope-500.woff2 manrope-600.woff2 manrope-700.woff2 manrope-800.woff2
```
Subset `latin`, Format `woff2` — zusammen ~145 KB, per Service-Worker vorab gecacht.

## Lizenz
Beide Familien stehen unter **SIL Open Font License 1.1**. Die vollständigen
Lizenztexte liegen daneben:

- `OFL-Sora.txt` — Copyright 2019 The Sora Project Authors
- `OFL-Manrope.txt` — Copyright 2018 The Manrope Project Authors

Die OFL erlaubt Einbettung und Weitergabe, verlangt aber, dass der Lizenztext
mitgeliefert wird — genau dafür liegen die beiden Dateien hier.

## Erneuern / Gewichte ergänzen
Bezugsquelle: [google-webfonts-helper](https://gwfh.mranftl.com/fonts) → Sora bzw.
Manrope, Subset `latin`, Format `woff2`. Die Dateinamen müssen zu den `src`-Pfaden
in `src/styles/fonts.css` passen (`<familie>-<gewicht>.woff2`).
