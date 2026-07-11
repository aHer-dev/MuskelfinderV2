# ADR 0001: Stack ist Vite + React 19 + TypeScript

## Status: akzeptiert · 2026-07-08

## Kontext
Muskelfinder V2 ist ein Neuaufbau der bisherigen statischen HTML/JS-Muskel-App.
Ziel: wartbarer, komponentenbasierter Aufbau mit getippter Datenschicht, ohne Backend,
weiterhin als statische Seite deploybar (GitHub Pages).

## Entscheidung
- **Vite** als Build-/Dev-Server (schnelles HMR, einfacher statischer Build).
- **React 19** für die Komponenten-UI.
- **TypeScript (strict)** für getypte Datenschicht und weniger Laufzeitfehler.
- **oxlint** als Linter (schnell, im Scaffold enthalten).
- **Vitest** als Test-Runner (Setup als erster Infra-Task — steht noch aus).

## Konsequenzen
- Kein Server, keine Laufzeit-API außer den im Repo liegenden JSON-Daten.
- Three.js / 3D wird hier **nicht** eingesetzt (Unterschied zum Schwesterprojekt
  „Anatomie Fokus 3D") — die App bleibt bild-/textbasiert.
- Test-Gate greift erst voll, sobald Vitest eingerichtet ist; bis dahin ist der
  TS-Compiler das primäre automatisierte Review.
