# Fonts (self-hosted)

Diese App bindet **keine** externen Font-CDNs ein (Architektur-Grenze: keine
Laufzeit-Requests nach außen). Sora + Manrope werden self-hosted.

## Benötigte Dateien
Lege hier die `.woff2`-Dateien ab (Namen müssen zu `src/styles/fonts.css` passen):

```
sora-400.woff2   sora-500.woff2   sora-600.woff2   sora-700.woff2   sora-800.woff2
manrope-400.woff2 manrope-500.woff2 manrope-600.woff2 manrope-700.woff2 manrope-800.woff2
```

## Bezugsquelle
[google-webfonts-helper](https://gwfh.mranftl.com/fonts) → Sora bzw. Manrope,
Gewichte 400–800, Format `woff2`, „modern browsers". Beide Lizenz **SIL OFL 1.1**.

Nach dem Ablegen der Dateien den auskommentierten `@font-face`-Block in
`src/styles/fonts.css` **einkommentieren**.

Bis dahin greift automatisch der `system-ui`-Fallback aus `theme.css`
(`--font-display` / `--font-ui`) — die App bleibt voll funktionsfähig.
