# Task: Etappe 7b — Route `/heute` und Navigation nach Absichten

> **Zuerst lesen:** [Rahmen-Briefing Etappe 7](2026-07-12-etappe-7-uebersicht.md) — dort stehen die
> Invarianten, die auch für diesen Task gelten.

## Ziel
Die App öffnet nicht mehr auf einer Liste mit 150 Muskeln, sondern auf **einem Vorschlag**.
Die Navigation benennt künftig Absichten statt Werkzeuge.

## Kontext
- Branch: `feat/etappe-7b-route-heute`
- Vorher fertig: **7a** (`src/data/today.ts` liefert `TodayPlan`). Ohne 7a nicht starten.
- Betroffen:
  - `src/App.tsx` (Routen, Redirect)
  - `src/components/layout/nav.ts` (die Nav-Konfiguration — Rail und TabBar teilen sie sich)
  - `src/components/layout/IconRail.tsx`, `TabBar.tsx` (falls Anpassung nötig)
  - neu: `src/pages/TodayPage.tsx` + `src/pages/today.css`
- Doku: [ADR 0007](../decisions/0007-einstieg-und-informationsarchitektur.md),
  [produkt-plan.md](../produkt-plan.md) §Etappe 7

## Anforderungen
- [ ] Neue Route `/heute` mit `TodayPage`, lazy geladen wie die anderen Seiten (`React.lazy` + `Suspense`,
      Muster aus `src/App.tsx`).
- [ ] `/` leitet auf `/heute` statt auf `/suche` ([src/App.tsx:47](../../src/App.tsx)).
- [ ] `NAV_ITEMS` in [nav.ts](../../src/components/layout/nav.ts) auf **vier Absichten**:
      **Heute** (`/heute`) · **Suche** (`/suche`) · **Lernen** (`/lernkarten`) · **Fortschritt** (`/statistik`).
- [ ] **`/karteikasten` und `/quiz` bleiben als Routen bestehen** — sie verlieren nur den Tab-Rang.
      Erreichbar über die Zielseiten (Karteikasten aus *Fortschritt*, Quiz aus *Lernen*).
      Bestehende Deep-Links und Lesezeichen dürfen nicht brechen.
- [ ] `TodayPage` rendert den `TodayPlan` aus 7a:
      - eine **Diagnosezeile** („12 Karten fällig · 8 davon Schulter — deine schwächste Region · ca. 5 Min“)
      - **genau ein Primärbutton** („Los“) → startet die Session
      - Fortschritt (Level/XP) klein und untergeordnet, nicht dominierend
      - „Schnell starten“ (Quiz, Karteikasten) als ruhige Sekundär-Aktionen
- [ ] **Alle vier Zustände** aus 7a haben ein Rendering, keiner ohne Primärbutton:
      Normalfall · nichts fällig · Kasten leer (→ Hinweis auf Onboarding, 7c baut es) · Überfällig-Stau.
- [ ] Die **Formulierung** der Texte entsteht hier im UI — 7a liefert nur getypte Daten, keine Sätze.
- [ ] Mobil ist die Referenz: Primärbutton in der Daumenzone.

## Nicht-Ziele
- **Kein Onboarding, kein Seeding.** Das ist 7c. Ist der Kasten leer, zeigt 7b nur den passenden
  `EmptyState` mit CTA.
- **Kein Suchfeld in der Kopfzeile, kein Nachschlage-Zähler.** Das ist 7d.
- Keine Änderung an Lernkarten-, Quiz- oder Statistik-Logik. Diese Seiten werden nur anders erreicht.
- Kein Redesign bestehender Seiten.

## Definition of Done
- [ ] Deep-Link-Reload funktioniert auf allen Routen, auch auf `/karteikasten` und `/quiz`
- [ ] axe-core: 0 Verstöße auf `/heute` in **Light und Dark** (Werkzeuge lokal: Playwright + Chromium + axe,
      Preview Port 4319)
- [ ] Rendering-Test je Zustand (kein Screen ohne Primärbutton)
- [ ] Gate grün · CHANGELOG · **Statustafel 7b auf `fertig`** · PROJECT_STATE „Nächster Schritt“ = 7c
