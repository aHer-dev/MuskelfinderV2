# ADR 0004: State-Management mit Zustand · Stack-Ergänzungen

## Status: akzeptiert · 2026-07-08

## Kontext
Die App braucht zentralen, teils **persistierten** Zustand (Theme, später Filter, Quiz,
Fortschritt, Sammlung). AGENTS.md verlangt: Zustand zentral halten (Store/Context), **keine**
`window.*`-Globals als State-Kanal. Zusätzlich brauchte das Scaffold Routing und ein
Test-Framework.

## Entscheidung
- **Zustand** als State-Bibliothek. Schlanke, hook-basierte Stores; `persist`-Middleware für
  localStorage-Persistenz (Theme jetzt; Fortschritt/Sammlung ab Etappe 2). Getrennte Slices je
  Domäne (`useThemeStore`, später `useFilterStore`/`useQuizStore`/`useProgressStore`/
  `useCollectionStore`) — entspricht dem Design-Handoff §12.
- **React Router** (`react-router-dom` v7) fürs Routing (Modus: HashRouter, ADR 0003).
- **Vitest** als Test-Framework (kommt mit Vite), `jsdom` + React Testing Library für
  Komponenten-Smoke-Tests. `npm run test` = `vitest run` (CI-tauglich, einmaliger Lauf).
- **React 19 bleibt** (Scaffold-/AGENTS.md-Stand). Der Design-Handoff nennt React 18; wir
  weichen bewusst nach oben ab — 19 ist installiert und kompatibel.

## Konsequenzen
- **Gut:** Minimaler Boilerplate, gut testbare Stores (reine Funktionen), Persistenz out-of-the-box.
- **Grenze:** Ableitungen (gefilterte Listen, Highlighting) laufen über Selektoren/`useMemo`,
  nicht als doppelter State — sonst droht Zustands-Divergenz.
- **Persistenz-Keys** sind V2-eigen (z. B. `mf.theme`); der Backup-Datei-Vertrag bleibt davon
  unberührt und liegt gekapselt in der Persistenzschicht (ADR 0002, Etappe 2).
