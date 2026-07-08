# ADR 0003: Routing (HashRouter) & Deploy (GitHub Pages, statisch)

## Status: akzeptiert · 2026-07-08

## Kontext
V2 ist eine SPA, wird aber **statisch** auf GitHub Pages ausgeliefert (kein Server, der
unbekannte Pfade auf `index.html` zurückschreiben könnte). Bei `BrowserRouter` führt ein
Reload/Direktaufruf einer Unterroute (`/quiz`) dann zu einem **404**, solange kein
`404.html`-Fallback-Trick eingebaut ist. Zusätzlich hängt der korrekte Asset-Pfad vom
Deploy-Ziel ab (eigene Domain-Root vs. Projekt-Unterpfad).

## Entscheidung
- **`HashRouter`** für das Routing. Deep-Link-Reload (`/#/quiz`) funktioniert ohne
  Server-Konfiguration und ohne 404-Fallback — die einfachste robuste Variante für statisches
  Hosting. Routen: `/suche` (Default via Redirect von `/`), `/muskel/:id`, `/lernkarten`,
  `/quiz`, `/statistik`, `*` (NotFound).
- **Deploy via GitHub Actions** (`.github/workflows/deploy.yml`) → `actions/deploy-pages`.
  Pipeline-Gate: `lint → test → build`, erst dann Upload. Deployt von `main`.
- **`base: '/'`** in `vite.config.ts` (eigene Domain-Root, siehe ADR 0002). `.nojekyll` liegt
  in `public/`, damit Pages die Assets nicht durch Jekyll filtert.

## Konsequenzen
- **Gut:** Kein 404-Risiko bei Reloads, kein Server nötig, minimale Deploy-Komplexität.
- **Preis:** URLs enthalten `#` (`…/#/quiz`). Akzeptabel für eine Lern-App; SEO ist kein Ziel.
- **Wechsel-Option:** Soll später unter einem Projektpfad (`<name>.github.io/<repo>/`) statt
  eigener Domain deployt werden, muss `base` auf `'/<repo>/'` gesetzt werden. Ein späterer
  Umstieg auf `BrowserRouter` bliebe möglich, erfordert dann aber den `404.html`-SPA-Fallback.
