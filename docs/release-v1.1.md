# Release v1.1 — Checkliste

Stand: 2026-07-13 · Ziel: **Die App liegt öffentlich, und echte Schüler können sie öffnen.**
Bis heute war sie nie deployt — es gibt kein Git-Remote.

---

## Erledigt (ohne dich machbar)

- [x] **Release-Blocker gefunden und behoben: `base`.** Der Build stand auf `base: '/'`. Auf GitHub
      Pages liegt ein Projekt-Repo unter `<user>.github.io/<repo>/` — damit hätten **Sprite, Fonts und
      alle Bilder 404 geliefert**. Lokal fällt das nie auf, weil `vite preview` für jeden Pfad die
      `index.html` ausliefert und die Assets trotzdem vom Root holt. `base` ist jetzt
      `/MuskelfinderV2/` (per `VITE_BASE` überschreibbar), `start_url` und `scope` des PWA-Manifests
      ziehen mit — sonst installiert die PWA einen Scope, den es nicht gibt.
- [x] **Unter echten Pages-Bedingungen geprüft** (Build unter Unterpfad serviert, ohne SPA-Fallback):
      alle **10 Routen** tragen inkl. Deep-Link-Reload · **0 HTTP-Fehler** · **0 Konsolenfehler** ·
      **0 externe Requests** (die harte Architekturregel aus CLAUDE.md hält).
- [x] Version auf **1.1.0**, CHANGELOG-Abschnitt geschrieben.
- [x] Gate grün: `npm run lint && npm run test && npm run build` — **405 Tests**.
- [x] Deploy-Workflow liegt bereit: [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)
      (baut, lintet, testet, deployt nach Pages — läuft bei jedem Push auf `main`).

---

## Was nur du tun kannst

### 1 · Pages einschalten
Das Repo ist **`github.com/aHer-dev/MuskelfinderV2`**, `main` ist gepusht, `base` steht auf
`/MuskelfinderV2/`. Ziel-URL: **`https://aher-dev.github.io/MuskelfinderV2/`**

- [ ] Repo-Settings → **Pages → Source = „GitHub Actions"**. (Das ist der einzige Schalter; der
      Workflow läuft dann bei jedem Push auf `main`.)
- [ ] Danach: Actions-Tab ansehen — Build muss grün durchlaufen (lint + 405 Tests + build).

### 2 · Die 3D-Kopplung (ein Rest-Blocker)
Der „In 3D ansehen"-Link zeigt auf **`aher-dev.github.io/3DAnatomyV2/`**. Stand 2026-07-13 geprüft:

- ✅ **V2 ist live** (HTTP 200) — die frühere Notiz „noch nicht veröffentlicht" ist überholt.
- ❌ **`/3DAnatomyV2/datenschutz.html` liefert 404.** Die 3D-App verlinkt ihre eigene
      Datenschutzseite, die es im deployten Build nicht gibt. Eine öffentliche App ohne erreichbare
      Datenschutzseite ist kein Schönheitsfehler.
- [ ] Im lokalen 3D-Repo liegt der Fix bereits als HEAD (`f209896`,
      „fix(legal): veraltete jsDelivr-Aussage …"). **Pushen und neu deployen** — dann ist die Seite da.

**V1 bleibt bewusst außen vor:** Sie lädt three.js von jsDelivr nach und schickt damit die IPs deiner
Schüler an ein fremdes CDN. Genau deshalb zeigt der Link auf V2.

### 3 · Die alte V1 aufräumen (Empfehlung)
`aher-dev.github.io/Muskelfinder/` ist **weiterhin live**. Zwei Apps, zwei URLs — Schüler landen sonst
auf der alten. Die Daten kollidieren nicht (V1 nutzt `muskelfinder_*`, V2 `mf.*` — geprüft), aber die
Verwirrung bleibt.
- [ ] Auf V1 einen Hinweis setzen („Diese Version ist abgelöst → neue URL") **oder** V1-Pages
      abschalten.

### 4 · Tag setzen (wenn der Deploy steht)
```bash
git tag -a v1.1 -m "Vom Nachschlagewerk zum Lernbegleiter (Etappe 7 + 8)"
git push origin v1.1
```

---

## Nach dem Deploy: der einzige Test, der zählt

Gib die URL **einem echten Schüler** und sieh zu, ohne zu helfen. Der Kaltstart ist die Stelle, an
der V1 gescheitert ist. Der [Handtestplan](testplan-etappe-7-8.md) prüft die Mechanik — ein Schüler
prüft, ob es trägt.

## Bewusst nicht im Release

- **Keine Merksätze** (8d): Die Mechanik steht, aber kein einziger ist erfunden worden. Ein falscher
  Merksatz wird auswendig gelernt. Sie schreibt der Fachmann.
- **Keine 3D-Renderings** für die 47 bildlosen Muskeln (8f Stufe 2a): Die
  [Lizenzprüfung ist bestanden](3d-app-lizenzpruefung.md), aber der Deep-Link allein liefert kein
  brauchbares Bild — im Kontrollrendering lag der Muskel hinter dem Unterkiefer. Statt eines
  irreführenden Bildes steht dort ein gesetzter Platzhalter.
