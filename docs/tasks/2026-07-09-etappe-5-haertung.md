# Task: Etappe 5 — Härtung & Feinschliff

## Ziel
Produktionsreife herstellen: rechtlich pflichtige Quellen-/Lizenz-/Datenschutz-Seite,
Performance (Route-Code-Splitting, Bild-Lazy-Load), A11y-Feinschliff, Deploy-Härtung,
Release-Tag `v1.0`.

## Kontext
- Branch: feat/etappe-0-fundament
- Betroffene Dateien/Module:
  - `src/pages/LegalPage.tsx` (+ `.css`), `src/pages/PrivacyPage` bzw. gemeinsame LegalPage
  - `src/App.tsx` (Routing, `React.lazy`/`Suspense`)
  - `src/components/layout/*` (Footer-Links zu Legal-Seiten)
  - `src/components/features/detail/*` bzw. ImageViewer (Bild-Lazy-Load)
- Relevante Doku: docs/migration-plan.md §Etappe 5, ROADMAP.md Phase 5,
  ADR 0002 (Attribution/CC BY 4.0 sichtbar halten), V1 `quellen-lizenzen.html` + `datenschutz.html`

## Anforderungen
- [ ] Quellen- & Lizenz-Seite unter `/quellen` — BodyParts3D/DBCLS CC BY 4.0, Namensnennung,
      Lizenz-Links, fachliche Textquellen, verwendete Software (Inhalt aus V1 übernommen/angepasst).
- [ ] Datenschutz-Seite unter `/datenschutz` — statische App, localStorage-Zwecke, GitHub Pages.
- [ ] Beide Seiten aus Rail (Desktop) und TabBar/Footer (Mobile) erreichbar; Routen navigierbar,
      Deep-Link-Reload robust (HashRouter).
- [ ] Route-Code-Splitting via `React.lazy` + `Suspense`-Fallback; Bundle in sinnvolle Chunks.
- [ ] Muskel-Bilder mit `loading="lazy"` + `decoding="async"`.
- [ ] A11y: Fokus-Ring, aria-labels, `prefers-reduced-motion` respektiert (bereits aus E4 — verifizieren).

## Nicht-Ziele (explizit außerhalb dieses Tasks)
- Neue fachliche Features oder Datenänderungen.
- Impressum mit realen Personendaten (nur Hinweis auf Prüfbedarf wie in V1).
- Zwingend PWA/Offline (optional, nur wenn ohne Risiko).

## Definition of Done
- [ ] Tests für neue Logik vorhanden und grün (Routing/Rendering der Legal-Seiten smoke-getestet)
- [ ] lint + build grün; Build erzeugt separate Route-Chunks
- [ ] Attribution vollständig sichtbar (CC BY 4.0), Deep-Link-Reload funktioniert
- [ ] docs/PROJECT_STATE.md aktualisiert
- [ ] CHANGELOG-Eintrag
