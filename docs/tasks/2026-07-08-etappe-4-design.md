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

## Erledigt (2. Durchgang)
- [x] Treffer-Highlighting im Namen (`foldText`/`highlightName`, diakritika-tolerant, getestet) +
      orange `<mark>` in der MuscleCard.
- [x] `ActiveFilters`-Chip-Reihe (entfernbar) über der Ergebnisliste.
- [x] Quiz: AnswerOption mit A–D-Badges + 2×2-Grid; `role="radiogroup"`/`radio` + aria-live-Feedback.
- [x] Lernkarten: `LeitnerBoxes`-Visual (7 Fächer, aktives Fach hervorgehoben).
- [x] Statistik: LevelCard mit großem `ProgressRing`.

## Erledigt (3. Durchgang)
- [x] `Sheet`-Primitive (Bottom-Sheet: Grabber, Backdrop/Esc schließt, Initial-Fokus +
      Fokus-Rückgabe, Body-Scroll-Lock) + mobiles FilterSheet (Filter-Button mit aktiv-Zähler,
      `FilterPanel bare` im Sheet); Desktop-FilterPanel weiter inline.
- [x] Detail: ImageViewer mit Ansichts-Badge + Thumbnail-Reihe (aktiv markiert); ClinicalNote-Box
      (`icInfo`, Akzent-Tint) aus der DataList herausgelöst.

## Erledigt (4. Durchgang — nach Screenshot-Review via Playwright)
- [x] Screenshot-Abgleich der Frames `3a`/`2a` (Desktop + Mobile) mit echtem Headless-Chromium.
- [x] Bugfix: lange Bewegungs-Chips (z. B. „Zeh V: …") liefen aus der Karte → jetzt Ellipsis + `title`.
- [x] FilterSidebar auf **rechts** verschoben (Frame `3a`).

## Erledigt (5. Durchgang — mit Screenshot-Verify via Playwright)
- [x] Lernkarten: echter **3D-Flip** (`rotateY(180deg)`, `perspective`, `transform-style: preserve-3d`,
      `backface-visibility: hidden`). Beide Seiten im Grid gestapelt (Zellenhöhe = höhere Seite,
      kein Clipping); Rückseite vorgedreht → un-gespiegelt lesbar. Reduced-motion springt ohne Animation.
- [x] Quiz: **QuizProgress**-Segmentleiste (ein Stück je Frage, eingefärbt richtig/falsch/aktuell/offen);
      `results`-Historie im `useQuizGame`-Hook. Leiste ist `aria-hidden` (Text „Frage X/Y" trägt die A11y).
- [x] Statistik: **CardBreakdown**-Stapelbalken (gemeistert/in Arbeit/neu, Legende) + **Bento-Grid**
      (`stats__bento`, 2 Spalten Desktop → 1 mobil; Regionen `--wide` über volle Breite).

## Erledigt (6. Durchgang — mit Screenshot-Verify, mobil)
- [x] Mobile **Region-Chip-Reihe** (`RegionChips`): horizontal scrollbar, Toggle-Buttons
      (`aria-pressed`), über der Ergebnisliste; nur im Mobile-Layout. Voller Filtersatz bleibt im Sheet.
- [x] **Sheet-Fokus-Trap** vervollständigt: Tab/Shift+Tab zyklisch innerhalb des Panels
      (dynamische Focusable-Query), Esc/Backdrop schließt, Fokus-Rückgabe.
- [x] Quiz-**Radiogroup**: Roving-Tabindex (nur eine Option im Tab-Fluss) + Pfeiltasten/Home/End;
      Enter/Space wählt (nativer Button). Reset auf erste Option je Frage.
- [x] Listbox-Dropdowns: **bewusst nativ** (`<select>`) belassen — beste A11y & mobile Bedienung;
      keine Custom-Listbox.

## Offen (braucht Browser-/Frame-Abgleich)
- [ ] Dark-Frame-Abgleich (`1`/`2`) — Pixel-Feinschliff im Dunkelmodus.

## Definition of Done (Etappe gesamt)
- [ ] Screens entsprechen den Referenz-Frames; Responsive-Checkliste §14 ✔; A11y-Pass §13 ✔.
- [ ] lint + test + build grün; nur Tokens.
