# Release v1.1 — Checkliste

Stand: 2026-07-13 · Ziel: **Die App liegt öffentlich, und echte Schüler können sie öffnen.**
Bis heute war sie nie deployt — es gibt kein Git-Remote.

---

## Erledigt (ohne dich machbar)

- [x] **Release-Blocker gefunden und behoben: `base`.** Der Build stand auf `base: '/'`. Auf GitHub
      Pages liegt ein Projekt-Repo unter `<user>.github.io/<repo>/` — damit hätten **Sprite, Fonts und
      alle Bilder 404 geliefert**. Lokal fällt das nie auf, weil `vite preview` für jeden Pfad die
      `index.html` ausliefert und die Assets trotzdem vom Root holt. `base` ist jetzt
      `/Muskelfinder-V2/` (per `VITE_BASE` überschreibbar), `start_url` und `scope` des PWA-Manifests
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

### 1 · Remote anlegen und pushen
```bash
gh repo create Muskelfinder-V2 --public --source=. --remote=origin --push
# oder: git remote add origin git@github.com:<user>/Muskelfinder-V2.git && git push -u origin main
```
- [ ] Repo angelegt, `main` gepusht.
- [ ] In den Repo-Settings: **Pages → Source = „GitHub Actions"**.
- [ ] **Heißt das Repo anders als `Muskelfinder-V2`?** Dann `base` in `vite.config.ts` anpassen —
      es ist die **einzige** Stellschraube. (Eigene Domain oder User-Site? Dann `VITE_BASE=/`.)

### 2 · Die 3D-Kopplung auflösen (sonst laufen Nutzer ins Leere)
Der „In 3D ansehen"-Link zeigt bewusst auf **`aher-dev.github.io/3DAnatomyV2/`** — deine V2, die
three.js lokal bündelt und **keine** externen Requests macht (V1 lud es von jsDelivr und hätte die
IP deiner Schüler an ein fremdes CDN geschickt).

- [ ] **Ist V2 überhaupt veröffentlicht und stabil?**
- [ ] **`/3DAnatomyV2/datenschutz.html` liefert 404.** Eine öffentliche App ohne erreichbare
      Datenschutzseite ist kein Schönheitsfehler — die V2 braucht einen Redeploy.
- [ ] Im 3D-Repo liegt der Branch `fix/datenschutz-jsdelivr-veraltet` (Commit `f209896`) — sollte
      mit veröffentlicht werden.

**Fällt die Entscheidung gegen V2:** `THREE_D_BASE_URL` in
[`src/data/threeD.ts`](../src/data/threeD.ts) auf `/3DAnatomy/` zurückdrehen. Eine Konstante, eine
Zeile. **Aber:** Dann lädt die verlinkte App three.js von einem fremden CDN — mit den IPs deiner
Schüler. Das ist der Grund, warum der Link auf V2 zeigt.

### 3 · Tag setzen (wenn der Deploy steht)
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
