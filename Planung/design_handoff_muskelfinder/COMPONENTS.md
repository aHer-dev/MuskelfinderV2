# Muskelfinder — Komponenten-Inventar

> Ergänzung zu `README.md`. Wiederverwendbare Komponenten (Primitives → Layout → Feature),
> jeweils mit **TypeScript-Props** und den verbindlichen Design-Werten. Alle Styles über die
> Tokens aus `theme.css`. Namen sind Vorschläge — an Codebase-Konventionen anpassen.

Legende: 🔁 = mehrfach wiederverwendet · 📐 = feste Maße aus den Frames.

---

## Teil A — Primitives (`src/components/ui/`)

### `Icon` 🔁
SVG-Sprite-Wrapper (`<use href="/icons/sprite.svg#name"/>`), erbt `currentColor`.
```ts
interface IconProps { name: IconName; size?: number; className?: string; }  // size default 20
```

### `Button` 🔁 📐
```ts
interface ButtonProps {
  variant?: 'primary' | 'outline' | 'ghost';  // primary: bg --accent / text --accent-on
  size?: 'sm' | 'md' | 'lg';                    // md ~ padding 14px 26px, radius --radius-md
  iconLeft?: IconName; iconRight?: IconName;
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}
```
- **primary:** `background:var(--accent); color:var(--accent-on)`.
- **outline:** `1.5px solid var(--accent-border); color:var(--accent-on-surface)`.
- **ghost:** transparent, `color:var(--text-secondary)`, Hover `--surface-hover`.

### `IconButton` 🔁 📐
Quadratischer Icon-Button (Rail/Tab/Header). `44×44` (Rail) bzw. `52×52` (Tab), `radius:13–15px`.
```ts
interface IconButtonProps { icon: IconName; label: string; /* aria */ active?: boolean; onClick?: () => void; }
```
Aktiv → `background:var(--accent-tint); color:var(--accent-on-surface)`, sonst `color:var(--text-tertiary)`.

### `Chip` 🔁 📐
Filter-Chip / Bewegungs-Tag. `radius:8px (Tag)` bzw. `20px (Filter-Pille)`, `padding:5px 9px`, Manrope 600 11.5px.
```ts
interface ChipProps {
  label: string;
  active?: boolean;                 // aktiv: --accent-tint / --accent-border / --accent-on-surface
  removable?: boolean; onRemove?: () => void;  // ✕ (icClose 14px)
  onClick?: () => void;
}
```

### `RegionBadge` 🔁 📐
Pille mit neutralem Punkt + Region-/Subregion-Text. `radius:20px`, Punkt 7px `var(--region-dot)`,
`background:var(--surface-sunken); border:1px solid var(--hairline)`.
```ts
interface RegionBadgeProps { region: string; subregion?: string; }
```

### `DifficultyDots` 🔁 📐
Drei 6px-Punkte; `level` gefüllt `--accent`, Rest `--hairline-strong`.
```ts
interface DifficultyDotsProps { level: 1 | 2 | 3; }
```

### `Checkbox` 🔁 📐
Region-Filter-Zeile. Box `19px`, `radius:6px`; unchecked `border 1.5px var(--checkbox-border)`,
checked `background:var(--accent)` + `icCheck` in `--accent-on`. Zeile aktiv → `background:var(--accent-dim)`.
```ts
interface CheckboxProps { checked: boolean; label: string; count?: number; onChange(v: boolean): void; }
```

### `Select` / `Dropdown` 🔁 📐
Gelenk/Bewegung/Innervation + Sort. Geschlossen: Feld `padding:12px 13px; radius:11px;
background:var(--surface); border:1px solid var(--card-border)` + `icChevD`. Offen: Panel mit Optionen
(aktive Option `--accent`-Rahmen, gewählte mit `icCheck`).
```ts
interface SelectProps<T extends string> {
  value: T | null; options: { id: T; label: string; count?: number }[];
  placeholder: string; multiple?: boolean; onChange(v: T | null): void;
}
```

### `SearchField` 🔁 📐
`height:56px` (Desktop) / `50px` (Mobile), `radius:14px`, `background:var(--surface)`,
fokussiert `border:1.5px solid var(--accent-border)` + `box-shadow:0 0 0 4px var(--accent-dim)`.
Lupe `--accent-on-surface`; Cursor 2px-Balken `--accent` (blinkt); rechts ⌘K-Hint bzw. ✕ zum Leeren.
```ts
interface SearchFieldProps {
  value: string; placeholder?: string;
  onChange(v: string): void; onClear?: () => void;
  shortcutHint?: string;   // "⌘K"
}
```

### `ProgressRing` 🔁 📐
Level-Ring. SVG-Kreis, Track `--hairline-strong`, Fill `--accent` (oder `--accent-gradient` groß),
`stroke-linecap:round`, gedreht `-90°`. Zentrum: Label + Wert.
```ts
interface ProgressRingProps { value: number; /* 0..1 */ size?: number; stroke?: number; centerLabel?: string; centerValue?: string; }
```

### `ProgressBar` 🔁 📐
`height:5–6px`, `radius:3px`, Track `--hairline-strong`, Fill `--accent` oder `--accent-gradient`.
```ts
interface ProgressBarProps { value: number; gradient?: boolean; }
```

### `SegmentedControl` 🔁 📐
Expert/Easy · Sort · Setup-Optionen. Container `padding:4px; radius:11px; background:var(--surface)`;
aktives Segment `background:var(--accent); color:var(--accent-on); radius:8px`.
```ts
interface SegmentedControlProps<T extends string> { value: T; options: { id: T; label: string }[]; onChange(v: T): void; }
```

### `Panel` 🔁
Glas-Container (Rail/Sidebar/Sheet). Optionale `header`/`footer`-Slots + scrollbarer Body.
```ts
interface PanelProps { header?: React.ReactNode; footer?: React.ReactNode; children: React.ReactNode; className?: string; }
```

### `Card` 🔁
Fläche mit `--surface` / `--card-border` / `--card-shadow`, `radius:14px`.

### `Sheet` 🔁 📐 (mobil)
Bottom-Sheet. Grabber `42×5`, `radius:28px 28px 0 0`, Backdrop `rgba(6,6,7,.6)`, Fokus-Trap + Esc.
```ts
interface SheetProps { open: boolean; title?: string; onClose(): void; children: React.ReactNode; }
```

### `ThemeToggle` 🔁
Sonne/Mond-`IconButton`; ruft `useThemeStore().toggle()`.

---

## Teil B — Layout (`src/components/layout/`)

### `AppShell`
Rahmen aller Seiten. `≥lg`: `IconRail` links + `<main>` (+ optional rechte Sidebar via `sidebar`-Prop).
`<lg`: `<main>` + `TabBar` unten. Hintergrund `var(--stage-gradient)`.
```ts
interface AppShellProps { sidebar?: React.ReactNode; children: React.ReactNode; }
```

### `IconRail` 📐 (Desktop)
`width:68px; radius:20px`, Glas. Logo oben (**themeabhängig**: `af-logo.png` dark / `af-logo-dark.png` light),
Trenner, Haupt-Nav (`NavItem` je Route), Trenner, „3D-Anatomie", Spacer, Level-`ProgressRing`, `ThemeToggle`, Einstellungen.
```ts
interface NavItemProps { icon: IconName; label: string; to: string; active: boolean; }
```

### `TabBar` 📐 (Mobile)
Glas-Pille `bottom:26px`, 5 `IconButton` (`Suche · Lernkarten · Quiz · Statistik · Mehr`), Buttons ≥ 52px.

### `FilterSidebar` (Desktop) / `FilterSheet` (Mobile) 📐
Header „Filter" (+ Zähler-Badge, „Zurücksetzen") · `Checkbox`-Liste Region · `Select` Gelenk/Bewegung/Innervation ·
Fuß Lizenz/Quellen/Datenschutz. Liest/schreibt `useFilterStore`.
```ts
interface FilterProps { filter: MuscleFilter; regions: Region[]; onChange(patch: Partial<MuscleFilter>): void; onReset(): void; }
```

---

## Teil C — Feature-Komponenten (`src/components/features/`)

### Suche
**`MuscleGrid`** — Grid 2→1 Spalten, `gap:14px`. `interface { muscles: Muscle[]; query?: string }`.

**`MuscleCard`** 🔁 📐 — Frame `1a`/`3a`. `radius:14px`, `padding:16px 17px`.
Kopf: `nameLatin` (Sora 600 16.5px) + `taCode` (Manrope 500 11.5px `--text-muted`) rechts `DifficultyDots`.
Mitte: `RegionBadge`. Fuß: Bewegungs-`Chip`s. Bei aktiver Suche Treffer im Namen `--accent-on-surface`/600,
passende Bewegungs-Chips `active`.
```ts
interface MuscleCardProps { muscle: Muscle; query?: string; onClick?(): void; }
```

**`ActiveFilters`** — Reihe aktiver `Chip`s (removable) über der Liste (Frame `1b`).
**`SortControl`** — Label „Sortieren" + `Select` (Alphabetisch/Relevanz/Schwierigkeit).

### Detail
**`MuscleImageViewer`** 📐 — dunkles **Medien-Fenster** (`--media-well`, auch im Light!), Ansichts-Badge
oben links, Attribution/Zoom-Leiste unten, Thumbnail-Reihe (aktiv `border:1.5px var(--accent)`).
```ts
interface MuscleImageViewerProps { images: MuscleImage[]; activeId: string; onSelect(id: string): void; onZoom(): void; }
```
**`MuscleDataList`** 📐 — Zeilen mit Uppercase-Label + Wert, getrennt durch `--hairline`:
Ursprung · Ansatz · Funktion · (Innervation | Segmente nebeneinander) · **ClinicalNote** (`--accent-dim`-Box mit `icInfo`) · Tags.
```ts
interface MuscleDataListProps { muscle: Muscle; mode: 'expert' | 'easy'; }
```
**`DetailHeader`** — Zurück-Leiste + `SegmentedControl` Expert/Easy + Bookmark-`IconButton` + „Zur Sammlung"-`Button`.

### Lernkarten
**`Flashcard`** 📐 — Flip-Karte (`rotateY`, ~0.4s), `radius:20px`, Glas/`--surface`. Vorderseite Frage,
Rückseite Antwort (Titel + Funktion + Innervation). Punkt-Indikator unten.
```ts
interface FlashcardProps { muscle: Muscle; side: CardSide; onFlip(): void; }
```
**`LeitnerBoxes`** 📐 — Fächer 1–5, aktives `--accent-tint`/`--accent-on-surface`. `interface { counts: Record<LeitnerBox, number>; activeBox: LeitnerBox }`.
**`RatingBar`** 📐 — `Falsch (icClose) · Unsicher · Richtig (icCheck, --accent)`, Tasten 1/2/3.
```ts
interface RatingBarProps { onRate(rating: CardRating): void; }
```
**`SessionProgress`** — Region + „Wiederholung" + Serie 🔥 + „12 / 30" + `ProgressBar`.

### Quiz
**`QuizProgress`** 📐 — Segment-Leiste (beantwortet `--accent`, aktuell halb, offen `--hairline-strong`).
**`QuizQuestionView`** — Kategorie-Label + Prompt (Sora 32px, zentriert) + `AnswerOption`-Grid 2×2.
**`AnswerOption`** 🔁 📐 — `radius:15px`, Buchstaben-Badge A–D. Zustände: idle · selected (`--accent`-Rahmen/-Tint) ·
correct (✓) · wrong (gedimmt).
```ts
interface AnswerOptionProps { letter: 'A'|'B'|'C'|'D'; label: string; state: 'idle'|'selected'|'correct'|'wrong'; onClick(): void; }
```
**`QuizResultView`** — Score, richtige/gesamt, längste Serie, XP-Gewinn, `Button`s „Nochmal" / „Zur Statistik".

### Statistik
**`LevelCard`** 📐 — großer `ProgressRing` (180px, `--accent-gradient`) + „1 240 XP" + „Noch 360 XP bis Level 8" + Rang-Pille.
**`StatCard`** 🔁 📐 — Uppercase-Label + Icon + große Zahl (Sora 42px) + Sublabel/`ProgressBar`.
```ts
interface StatCardProps { label: string; icon: IconName; value: string; sub?: string; progress?: number; }
```
**`CardBreakdown`** 📐 — gestapelter Balken (mastered `--accent` · learning `--accent` @45% · neu `--hairline-strong`) + Legende.
**`RegionMastery`** 📐 — 4 Zeilen `Label(170px) · ProgressBar(flex) · Prozent(38px)`.

---

## Komponenten → Ort / Frame (Übersicht)

| Komponente | Screen | Frame |
|---|---|---|
| IconRail / TabBar | alle | alle |
| SearchField · MuscleGrid · MuscleCard · FilterSidebar/Sheet · ActiveFilters · SortControl | SearchPage | `3a`,`1a`,`1b`,`1c`,`1d` |
| DetailHeader · MuscleImageViewer · MuscleDataList · ClinicalNote | MuscleDetailPage | `2a`,`2e` |
| Flashcard · LeitnerBoxes · RatingBar · SessionProgress | FlashcardsPage | `2b`,`2f` |
| QuizProgress · QuizQuestionView · AnswerOption · QuizResultView | QuizPage | `2c` |
| LevelCard · StatCard · CardBreakdown · RegionMastery | StatsPage | `2d` |
| Button · Chip · Tag · Checkbox · Select · ProgressRing/Bar · DifficultyDots · Panel · Card · SegmentedControl · Sheet · ThemeToggle | überall (Primitives) | — |
