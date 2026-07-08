# Task: Etappe 4 — Design-Umsetzung (Hi-Fi)

## Ziel
Das Marken-Design aus `Planung/design_handoff_muskelfinder/` pixelgenau umsetzen — jetzt,
wo der funktionale Kern (Etappe 3) trägt. Nur Darstellung/Layout, keine neuen Features/Daten.

## Kontext
- Branch: `feat/etappe-0-fundament`
- Relevante Doku: Handoff README (§5 Tokens, §7 Layout, §8 Rezepte, §13 A11y, §14 Responsive),
  COMPONENTS.md, Referenz-Frames `Muskelfinder Suche Redesign.dc.html`. ROADMAP Phase 4.
- Tokens liegen bereits vollständig in `src/styles/theme.css` (aus dem Handoff, Etappe 0).

## Erledigt (dieser Durchgang)
- [x] `useMediaQuery` (+ `useIsDesktop`, lg=1024px) + Test; matchMedia-Stub im Test-Setup.
- [x] Responsive AppShell: schwebende **Glas-Icon-Rail** (Desktop, 68px, radius 20px, Logo
      themeabhängig, Icon-Nav, Level-`ProgressRing`, Theme-Toggle) ⇄ **Glas-Tab-Leiste** (Mobile),
      Bühnen-Radial-Hintergrund, Safe-Area-Insets.
- [x] `ProgressRing`-Primitive (SVG, Track/Fill-Tokens).
- [x] Primitives an Handoff-Rezepte angeglichen: SearchField 56px (50px mobil) + Fokus-Recipe,
      Chip (radius 8, padding 5/9, 11.5px, `--active`), DifficultyDots (6px, `--hairline-strong`),
      SegmentedControl aktiv = `--accent`-Füllung.

## Offen (braucht Browser-/Frame-Abgleich)
- [ ] SearchPage: FilterSidebar **rechts** (Glas) statt In-Content-Panel; ActiveFilters-Chips-Reihe;
      Treffer-Highlighting im Namen (`--accent-on-surface`/600); Mobile Region-Chip-Reihe + FilterSheet.
- [ ] `Sheet`-Primitive (Bottom-Sheet, Grabber, Fokus-Trap + Esc) für Mobile-Filter/Detail.
- [ ] Detail: MuscleImageViewer mit Thumbnails/Zoom-Leiste + Ansichts-Badge; ClinicalNote-Box (`icInfo`).
- [ ] Lernkarten: 3D-Flip (`rotateY`), LeitnerBoxes-Visual (7 Fächer); Quiz: AnswerOption A–D-Badges,
      QuizProgress-Segmente; Statistik: LevelCard/StatCard/CardBreakdown-Bento.
- [ ] A11y-Pass §13: Quiz `role="radiogroup"`/`radio`, Listbox-Dropdowns, vollständige aria-Labels.
- [ ] Referenz-Frame-Abgleich (`3a` Light default, `1`/`2` Dark) — Pixel-Feinschliff.

## Definition of Done (Etappe gesamt)
- [ ] Screens entsprechen den Referenz-Frames; Responsive-Checkliste §14 ✔; A11y-Pass §13 ✔.
- [ ] lint + test + build grün; nur Tokens.
