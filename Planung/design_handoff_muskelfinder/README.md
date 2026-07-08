# Handoff: Muskelfinder — Migration Vanilla → React + TypeScript + Vite

> Für Claude Code. Dieses Paket beschreibt das **Rebranding + die Migration** der bisher
> **statischen Vanilla-Seite „Muskelfinder"** in eine **moderne, komponentenbasierte
> React-App** (React 18 + TypeScript + Vite). Optik = dieselbe Marken-Linie wie die
> 3D-Anatomie-App (Variante A: Orange als einziger Akzent, Sora/Manrope, Glassmorphism),
> **jetzt mit Hell- UND Dunkelmodus — Default ist HELL.**
>
> Das Paket ist **selbsttragend**: Tokens, Theming, Komponenten-System, Props, Zustände,
> Responsive-Regeln und Datenmodell stehen hier vollständig.

---

## 1. Überblick

Muskelfinder ist ein **Nachschlagewerk + Lern-Tool** für die Skelettmuskulatur (Zielgruppe:
Studierende Physio-/Ergo-/Medizin). Kern-Flows:

1. **Suche** — Muskeln durchsuchen & filtern (Region, Gelenk, Bewegung, Innervation).
2. **Muskel-Detail** — Ursprung/Ansatz/Funktion/Innervation, Abbildung, klinischer Bezug.
3. **Lernkarten** — Flip-Karten mit Leitner-System (Spaced Repetition).
4. **Quiz** — Multiple-Choice mit Serie/Score.
5. **Statistik** — Level/XP, Serie, Beherrschung nach Region (Gamification).

**Ziel dieses Auftrags:** Die App von statischem HTML/CSS/JS auf ein **komponentenbasiertes
React-UI-System** heben — wiederverwendbare Komponenten, responsive Layouts (Desktop-Rail +
Sidebar ⇄ Mobile Tab-Leiste + Bottom-Sheet) und sauber getrennte Zustände für Quiz, Auswahl,
Fortschritt und Detail. Gleichzeitig das **neue Marken-Design** umsetzen (Referenz-Frames unten).

**Ton:** seriös, wissenschaftlich, ruhig — „medical atlas, scientific-clean". Orange sparsam
und gezielt als einziger Akzent.

---

## 2. Über die Design-Dateien (Referenzen — kein Copy-Paste-Code)

Die HTML-Datei in diesem Paket ist eine **Design-Referenz** (Prototyp, der Aussehen und
Verhalten zeigt). Sie ist **nicht** dazu gedacht, 1:1 kopiert zu werden.

**Aufgabe:** die gezeigten Designs im **Ziel-Environment nachbauen** — als `.tsx`-Komponenten,
die ausschließlich die Tokens aus `theme.css` (siehe §5) nutzen. Da es aktuell **kein**
React-Environment gibt, wird eines **neu aufgesetzt** (React + TS + Vite, §4). Kein Tailwind
nötig; CSS-Module oder eine schlanke CSS-in-JS-Lösung sind ok — Hauptsache tokenbasiert.

**Referenz-Datei:** `Muskelfinder Suche Redesign.dc.html` — enthält **alle** Frames. Im Browser
öffnen (Datei liegt neben `support.js`; `assets/` daneben). Frame-IDs sind im Dokument als Badges
sichtbar:

| Frame | Screen | Theme |
|---|---|---|
| `1a` | Suche · Default (Desktop) | Dark |
| `1b` | Suche · gefiltert + Dropdown (Desktop) | Dark |
| `1c` / `1d` | Suche / Filter-Sheet (Mobile) | Dark |
| `2a` | Muskel-Detail (Desktop) | Dark |
| `2b` | Lernkarten · Karte (Desktop) | Dark |
| `2c` | Quiz (Desktop) | Dark |
| `2d` | Statistik-Dashboard (Desktop) | Dark |
| `2e` / `2f` | Detail / Lernkarte (Mobile) | Dark |
| `3a` | Suche · **Light „Warm/Atlas"** (Desktop) | **Light · Default** |
| `3b` | Suche · Light „Clinical/Cool" (Alternative) | Light |
| `3c` | Suche · Light (Mobile) | Light |

> **Palette-Entscheid:** Default-Theme ist **Light · „Warm/Atlas"** (Frame `3a`). „Clinical/Cool"
> (`3b`) ist die verworfene Alternative — nur als Referenz, **nicht** umsetzen. Dark (`1`/`2`) ist
> der Umschalter.

---

## 3. Fidelity: **Hi-Fi**

Pixelgenaue Mockups mit finalen Farben, Typo, Spacing und Zuständen. Bitte die UI **pixelgenau**
nachbauen. Alle Maß-, Farb- und Typo-Werte in diesem Paket sind verbindlich.

---

## 4. Tech-Stack & Projektstruktur

**Stack:** React 18 · TypeScript (strict) · Vite · React Router · Zustand (State) ·
CSS-Module oder Vanilla-CSS mit den Tokens aus `theme.css`. Keine UI-Library nötig; keine
externen Fonts/CDN (Fonts self-hosten, §6). Icons als **SVG-Sprite** (§11).

**Empfohlene Struktur:**
```
muskelfinder/
├─ index.html
├─ vite.config.ts
├─ public/
│  ├─ fonts/                 # Sora + Manrope .woff2 (self-hosted)
│  ├─ icons/sprite.svg       # Icon-Sprite (§11)
│  └─ logo/                  # af-logo*.png (§15)
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx                # Router + AppShell
│  ├─ styles/
│  │  ├─ theme.css           # ← aus diesem Paket (Tokens, light+dark)
│  │  ├─ fonts.css           # @font-face (§6)
│  │  └─ base.css            # Resets
│  ├─ types/index.ts         # ← aus diesem Paket
│  ├─ data/muscles.ts        # Muskel-Datensatz (aus altem Vanilla-Datenbestand migrieren)
│  ├─ store/                 # Zustand-Slices (§12)
│  │  ├─ useFilterStore.ts
│  │  ├─ useQuizStore.ts
│  │  ├─ useProgressStore.ts
│  │  ├─ useCollectionStore.ts
│  │  └─ useThemeStore.ts
│  ├─ hooks/                 # useMuscleSearch, useMediaQuery, useTheme …
│  ├─ components/
│  │  ├─ ui/                 # PRIMITIVES (§ COMPONENTS.md · Teil A)
│  │  ├─ layout/             # AppShell, IconRail, TabBar, FilterSidebar/Sheet
│  │  └─ features/           # Suche, Detail, Lernkarten, Quiz, Statistik
│  └─ pages/                 # Routen-Container (§9)
```

**Routen (React Router):**
| Pfad | Screen | Frame |
|---|---|---|
| `/` → `/suche` | SearchPage | `3a` / `1a` |
| `/muskel/:id` | MuscleDetailPage | `2a` |
| `/lernkarten` | FlashcardsPage | `2b` |
| `/quiz` | QuizPage | `2c` |
| `/statistik` | StatsPage | `2d` |

---

## 5. Design-Tokens & Theming → `src/styles/theme.css`

Die vollständige, einsatzbereite Datei liegt als **`theme.css`** bei. Zwei Themes über ein
`data-theme`-Attribut auf `<html>`; **Default = Light**.

```html
<html data-theme="light">   <!-- ThemeToggle setzt "light" | "dark" -->
```

**Kern-Idee für den Akzent:** Orange ist der **einzige** Akzent, muss aber je nach Theme
unterschiedlich eingesetzt werden:
- `--accent: #ff6a00` → **Füllung** (Buttons, aktiver Zustand, Checkbox, Ringe) in **beiden** Themes.
- `--accent-on: #1a1a1a` → Text/Icon **auf** gefülltem Orange (near-black, beide Themes).
- `--accent-on-surface` → Akzent für **Text/Icons/Links auf der Fläche**:
  Light `#e05500` (dunkler → Kontrast auf Weiß), Dark `#ff6a00`.

**Wichtigste Token (Light / Dark):**
| Rolle | Token | Light | Dark |
|---|---|---|---|
| App-Hintergrund | `--bg` | `#f1efe9` | `#0b0c0e` |
| Bühnen-Radial | `--stage-gradient` | warm `#fbfaf7→#eae7df` | `#181a1f→#060607` |
| Karte | `--surface` | `#ffffff` | `rgba(255,255,255,.035)` |
| Chip/Tag-Fläche | `--surface-sunken` | `rgba(28,26,23,.04)` | `rgba(255,255,255,.05)` |
| Glas (Rail/Sidebar) | `--glass-panel` | `rgba(255,255,255,.78)` | `rgba(15,16,20,.82)` |
| Glas-Rahmen | `--glass-border` | `rgba(28,26,23,.09)` | `rgba(255,255,255,.08)` |
| Karten-Rahmen | `--card-border` | `rgba(28,26,23,.09)` | `rgba(255,255,255,.07)` |
| Karten-Schatten | `--card-shadow` | `0 1px 2px rgba(28,26,23,.05)` | `none` |
| Hairline | `--hairline` | `rgba(28,26,23,.08)` | `rgba(255,255,255,.08)` |
| Text primär | `--text-primary` | `#1c1b18` | `#f6f6f7` |
| Text sekundär | `--text-secondary` | `#55524c` | `#c9cace` |
| Text muted/faint | `--text-muted`/`--text-faint` | `#8a8680`/`#9a968d` | `#8a8d93`/`#6e7076` |
| Akzent-Fill | `--accent` | `#ff6a00` | `#ff6a00` |
| Akzent auf Fläche | `--accent-on-surface` | `#e05500` | `#ff6a00` |
| Akzent-Tint (aktiv) | `--accent-tint` | Orange @13 % | Orange @16 % |
| Medien-Fenster | `--media-well` | **dunkel** `#20232a→#0b0c0e` | dunkel (gleich) |

> **Merksatz Medien:** Der **Anatomie-/Bildviewer bleibt in BEIDEN Themes ein dunkles „Fenster"**
> (`--media-well`) — so bleiben Strukturen lesbar. Nur das Chrome drumherum wird hell/dunkel.

- **Radien:** Karten 14–15px · Panels/Rail/Sidebar 20px · Rail-Button 13px · Suchfeld 14px · Chips/Pillen 8–20px.
- **Spacing:** 4 / 8 / 16 / 24 / 32.
- **Motion:** eine Kurve `cubic-bezier(.4,0,.2,1)`, ~0.28s (`--transition-smooth`), via `prefers-reduced-motion` abschaltbar.

> Neue Tokens NUR in `theme.css` ergänzen, nie als Hardcode in Komponenten.

---

## 6. Typografie — Sora/Manrope **self-hosten**

Marke nutzt **Sora** (Display/Titel/Wortmarke) und **Manrope** (UI/Fließtext). Keine externen
Fonts (kein Google-Fonts-CDN):

1. `.woff2` von Sora (400/500/600/700/800) und Manrope (400/500/600/700/800) nach `public/fonts/`
   (Quelle: google-webfonts-helper; beide SIL OFL 1.1).
2. `@font-face` in `src/styles/fonts.css` (`font-display:swap`, `src:url('/fonts/…woff2')`).
3. Fallback im Stack ist gesetzt (`--font-display`/`--font-ui` enden auf `system-ui`).

**Type-Skala (verbindlich):**
| Rolle | Font | Größe / Gewicht | Extra |
|---|---|---|---|
| Screen-Titel | Sora | 27px / 600 | `letter-spacing:-.015em` |
| Detail-Titel (Muskel) | Sora | 34px / 600 | `letter-spacing:-.02em` |
| Karten-/Karteikarten-Titel | Sora | 16.5–30px / 600 | |
| Section-Label (Uppercase) | Manrope | 10.5–11px / 600 | `text-transform:uppercase`, `letter-spacing:.13em`, `--text-faint` |
| Zeilen-/Body | Manrope | 13.5–15px / 500 | `line-height:1.5` |
| Button / Chip / Tag | Manrope | 11.5–14px / 600–700 | |
| TA-Code / Meta | Manrope | 11.5px / 500 | `--text-muted` |

Wortmarke immer **Sora**: „Anatomie" in `--text-primary`, „**Fokus**" in `--accent-on-surface`.

---

## 7. Layout & App-Shell (responsive)

**Desktop (≥ 1024px):** persistente **Icon-Rail links** + Content + (auf der Suche) **Filter-Sidebar rechts**.
- **Icon-Rail** (`left:20px; top/bottom:20px; width:68px; radius:20px`, Glas): Logo oben ·
  Haupt-Nav `Suche · Lernkarten · Muskeln · Quiz · Statistik` · Trenner · `3D-Anatomie öffnen`
  (Link zur Schwester-App) · unten (`margin-top:auto`): **Level-Ring** · **Theme-Toggle** (Sonne/Mond) · **Einstellungen**.
  Rail-Button `44×44`, `radius:13px`, Icon 22px; aktiv `--accent-tint` + Icon `--accent-on-surface`.
- **Filter-Sidebar** (nur Suche, `right:20px; width:320px; radius:20px`, Glas): Header „Filter"
  (+ Zähler-Badge wenn aktiv) · Region-Checkboxen mit Zählern · Dropdowns Gelenk/Bewegung/Innervation ·
  Fuß mit Lizenz/Quellen/Datenschutz.

**Mobile (< 768px):** **untere Tab-Leiste** (Glas-Pille, `bottom:26px`, Buttons ≥ 52px) mit
`Suche · Lernkarten · Quiz · Statistik · Mehr`. Filter & Detail-Extras als **Bottom-Sheet**
(Grabber `42×5`, `radius:28px 28px 0 0`). Region als horizontal scrollbare **Chip-Reihe** über der Liste.
- Touch-Targets ≥ 44px. `viewport-fit=cover` + `env(safe-area-inset-*)` respektieren.

**Breakpoints (Vorschlag):** `sm 640 · md 768 · lg 1024 · xl 1280`. Rail erscheint ab `lg`;
darunter Tab-Leiste. Ergebnis-Grid: 1 Spalte < md, 2 Spalten ≥ md.

Vollständiges Komponenten→Ort-Mapping und alle Props: **siehe `COMPONENTS.md`**.

---

## 8. Oberflächen-Rezepte (tokenbasiert)

```css
/* Glas-Panel (Rail / Filter-Sidebar / Bottom-Sheet) */
.panel {
  background: var(--glass-panel);
  backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);          /* 20px */
  box-shadow: var(--glass-shadow);
  color: var(--text-primary);
}
/* Ergebnis-Karte */
.card {
  background: var(--surface);
  border: 1px solid var(--card-border);
  border-radius: 14px;
  box-shadow: var(--card-shadow);
}
/* Klinischer Section-Header */
.label {
  font: 600 11px/1 var(--font-ui);
  letter-spacing: .13em; text-transform: uppercase;
  color: var(--text-faint);
}
/* Aktiver Nav-/Tool-Button */
.nav--active { background: var(--accent-tint); color: var(--accent-on-surface); }
/* Chip / Bewegungs-Tag */
.chip {
  background: var(--surface-sunken); border: 1px solid var(--hairline);
  border-radius: 8px; padding: 5px 9px;
  font: 600 11.5px var(--font-ui); color: var(--text-secondary);
}
/* Aktiver Filter-Chip */
.chip--active { background: var(--accent-tint); border-color: var(--accent-border); color: var(--accent-on-surface); }
/* Suchfeld (fokussiert) */
.search {
  height: 56px; border-radius: var(--radius-field);
  background: var(--surface);
  border: 1.5px solid var(--accent-border);
  box-shadow: 0 0 0 4px var(--accent-dim);
}
/* Primär-CTA */
.btn-primary { background: var(--accent); color: var(--accent-on); border-radius: var(--radius-md); }
/* Medien-Fenster (Anatomie-/Bildviewer) — DUNKEL in beiden Themes */
.media-well { background: var(--media-well); color: var(--media-fg); }
```

---

## 9. Screens / Views

Je Screen: Zweck · Layout · Kern-Komponenten (Details/Props in `COMPONENTS.md`).

### 9.1 SearchPage — `/suche` (Frames `3a` default · `1a`/`1b` dark · `1c`/`1d` mobile)
- **Zweck:** Muskeln durchsuchen & filtern; Einstieg in die App.
- **Layout:** Rail · Content (Titel „Muskulatur nachschlagen" + **SearchField** 56px + Ergebnis-Meta/Sort +
  **MuscleGrid** 2-spaltig) · **FilterSidebar** rechts.
- **Zustände:** leer/Default · Tippen (Cursor blinkt, Placeholder) · **gefiltert** (`1b`: Such-Text mit
  Löschen-✕, aktive **Filter-Chips**, Region-Checkbox aktiv, Bewegungs-Dropdown offen, Treffer im Namen orange
  hervorgehoben, passende Bewegungs-Tags orange) · keine Treffer (Empty-State).
- **Mobile:** SearchField + Region-Chip-Reihe + „Filter"-Button → **FilterSheet** (`1d`).

### 9.2 MuscleDetailPage — `/muskel/:id` (Frame `2a` · Mobile `2e`)
- **Zweck:** Alle Fakten zu einem Muskel + Abbildung.
- **Layout Desktop:** Rail · Zurück-Leiste + Expert/Easy-Umschalter + Bookmark + „Zur Sammlung" ·
  Titel/Meta · Grid `520px | 1fr`: **MuscleImageViewer** (dunkles Fenster, Ansichts-Badge, Thumbnails, Zoom) |
  **MuscleDataList** (Ursprung · Ansatz · Funktion · Innervation/Segmente · Klinischer Bezug · Tags).
- **Expert/Easy:** „Easy" blendet Detailtiefe aus (z. B. nur Funktion + Innervation), „Expert" zeigt alles.
- **Mobile:** Bild als Kopf (dunkles Fenster, Back/Bookmark schweben), Daten als Sheet darunter, CTA fix unten.

### 9.3 FlashcardsPage — `/lernkarten` (Frame `2b` · Mobile `2f`)
- **Zweck:** Karten lernen (Leitner/Spaced Repetition).
- **Layout:** Progress-Header (Region + „Wiederholung" + Serie 🔥 + „12 / 30") + **ProgressBar** ·
  **Flashcard** (Flip: Vorder-/Rückseite; Leertaste dreht) · **LeitnerBoxes** (Fächer 1–5 mit Zähler) ·
  **RatingBar** `Falsch · Unsicher · Richtig` (Tasten 1/2/3).
- **Setup-Vorschalter** (optional): Region-Scope + „neu/fällig/alle" wählen, dann Session starten.

### 9.4 QuizPage — `/quiz` (Frame `2c`)
- **Zweck:** Multiple-Choice-Abfrage.
- **Layout:** Kopf „Frage 5 von 10" + Serie + Score · **QuizProgress** (Segmente) · Frage (Kategorie-Label +
  Prompt Sora 32px) · **AnswerOptions** 2×2 (A–D) · Fuß „Überspringen" + „Bestätigen".
- **Zustände:** `answering` (Auswahl markiert `--accent`) · `revealed` (richtig grün-neutral/✓, falsch gedimmt) ·
  `finished` → **QuizResult** (Score, richtige, längste Serie, XP-Gewinn, „Nochmal"/„Zur Statistik").

### 9.5 StatsPage — `/statistik` (Frame `2d`)
- **Zweck:** Fortschritt & Gamification.
- **Layout:** Bento-Grid: großer **LevelCard** (Ring + XP) · **StatCard** Serie · **StatCard** gelernte Muskeln (+Bar) ·
  **CardBreakdown** (Lernkarten mastered/learning/neu) · **RegionMastery** (4 Balken, breit).

---

## 10. Interaktionen & Verhalten

- **Motion:** eine Kurve `cubic-bezier(.4,0,.2,1)` ~0.28s. Sheets sliden von unten, Detail faded ein,
  Flip-Karte 3D-`rotateY` (~0.4s). `prefers-reduced-motion:reduce` → alles aus (Cursor-Blink, Flip, Ringe).
- **Hover:** Nav/Tool → `--surface-hover`; Karten minimal anheben (`translateY(-1px)` + Schatten);
  CTAs leicht heller.
- **Aktiv/Selektiert:** `--accent-tint` (Fläche) + `--accent-on-surface` (Icon/Text). Ausgewählte Antwort/Karte:
  `--accent`-Rahmen.
- **Suche:** debounced (~150 ms) Fuzzy-Match über `nameLatin` (+ Synonyme/DE). Treffer-Teil im Namen
  `--accent-on-surface`, `font-weight:600`. Tastatur: ↑/↓ + Enter.
- **Quiz:** nach „Bestätigen" `revealed`; automatisch/`Weiter` zur nächsten Frage. Serie zählt korrekte in Folge.
- **Lernkarten:** Bewertung schiebt Karte im Leitner-System hoch/runter, aktualisiert `due` und `UserProgress`.
- **Theme-Toggle:** setzt `data-theme` auf `<html>` + persistiert (localStorage, §12). Sanfter Übergang.

---

## 11. Icons — SVG-Sprite

Die Referenz nutzt ein Inline-SVG-`<symbol>`-Set (Strichstärke ~1.6–1.7, `currentColor`). Bitte als
`public/icons/sprite.svg` bündeln und via `<svg><use href="/icons/sprite.svg#ic…"/></svg>` einsetzen
(Icon erbt `color`). Benötigte Symbole (IDs aus der Referenz):
`icSearch · icCards · icList · icQuiz · icChart · icCube · icGear · icSun · icClose · icChevD ·
icChevR · icCheck · icFilter · icMenu · icArrow · icArrowL · icBookmark · icFlip · icFlame ·
icTrophy · icTarget · icImage · icPlus · icInfo`.
Icon-Größen: Rail 22px · Tab-Leiste 23px · Inline 14–20px. **Keine** Icon-Font, **kein** externes Icon-CDN.

---

## 12. State Management (Zustand + Persistenz)

Getrennte Slices (Zustand-Stores). **Anders als die 3D-App darf Muskelfinder persistieren** — Lern-App:
Fortschritt/Serie/Leitner-Fächer, Sammlung und Theme in **`localStorage`** halten (nichts anderes
überschreiben). Datensatz der Muskeln ist statisch (`src/data/muscles.ts`), kein Backend nötig.

```ts
// useFilterStore — Suche & Auswahl
interface FilterStore {
  filter: MuscleFilter;                 // query, regions[], joint, movement, innervation, sort
  results: Muscle[];                    // abgeleitet (Selector)
  setQuery(q: string): void;
  toggleRegion(r: RegionId): void;
  setJoint(j: string | null): void;
  setMovement(m: string | null): void;
  setInnervation(s: string | null): void;
  setSort(s: SortKey): void;
  reset(): void;                        // „Zurücksetzen"
}

// useQuizStore — Quiz-Ablauf
interface QuizStore extends QuizState {  // questions, index, phase, selectedId, correctCount, streak, score
  start(mode: QuizMode, count: number): void;
  select(optionId: string): void;
  confirm(): void;                       // answering → revealed (+ Score/Serie)
  next(): void;                          // revealed → nächste | finished
  result(): QuizResult;
}

// useProgressStore — Fortschritt/Gamification (persistiert)
interface ProgressStore {
  progress: UserProgress;                // level, xp, streakDays, learnedCount, cards, regionMastery …
  cards: Record<string, CardProgress>;   // muscleId → Leitner-Box/Fälligkeit
  rateCard(muscleId: string, rating: CardRating): void;   // Leitner-Logik + XP
  addXp(amount: number): void;
  registerStudyDay(): void;              // Serie pflegen
}

// useCollectionStore — Merkliste (persistiert)
interface CollectionStore { ids: string[]; toggle(id: string): void; has(id: string): boolean; }

// useThemeStore — Theme (persistiert)
interface ThemeStore { theme: Theme; setTheme(t: Theme): void; toggle(): void; }
```

- Ableitungen (gefilterte/sortierte Liste, Treffer-Highlighting) als **Selektoren/`useMemo`**, nicht doppelt im State.
- **TypeScript strict**, kein `any` in Kernpfaden. Alle Komponenten `.tsx`.

---

## 13. Barrierefreiheit

- `aria-label` an allen Icon-Buttons (Rail/Tab/Bookmark). Nav als `<nav>` mit `aria-current="page"`.
- Checkboxen als echte `<input type="checkbox">` (oder `role="checkbox"` + Tastatur). Dropdowns als
  Listbox-Pattern (↑/↓, Enter, Esc). Bottom-Sheet/Modal: Fokus-Trap + Esc schließt.
- Quiz-Antworten als `role="radiogroup"`/`radio`; Ergebnis per `aria-live` ansagen.
- Sichtbarer Fokus-Ring `2px --focus-ring`. Kontraste der `--text-*` auf beiden Themes geprüft halten
  (darum `--accent-on-surface` im Light dunkler).
- `prefers-reduced-motion:reduce` respektieren.

---

## 14. Responsive-Checkliste

- [ ] Rail (≥ lg) ⇄ Tab-Leiste (< lg) korrekt umgeschaltet (`useMediaQuery`).
- [ ] Ergebnis-Grid 2 → 1 Spalte unter md.
- [ ] Filter-Sidebar → Bottom-Sheet unter md.
- [ ] Detail: zweispaltig → gestapelt (Bild-Kopf + Daten-Sheet).
- [ ] Touch-Targets ≥ 44px; Safe-Area-Insets.
- [ ] Karteikarte/Quiz füllen mobil die Breite, Buttons gestapelt.

---

## 15. Assets (Logo) & Einsatz

Im Ordner `assets/` (PNG mit Transparenz):
| Datei | Verwendung |
|---|---|
| `af-logo.png` | Primär (Silber-Bevel, weißes „A" + oranger Streifen) — **auf dunklem** Grund: Dark-Rail, Loading |
| `af-logo-dark.png` | Anthrazit-„A" **+ oranger Streifen** — **auf hellem** Grund: **Light-Rail/Header** |
| `af-logo-white.png` | Mono weiß — Favicon, sehr kleine Größen |
| `af-logo-black.png` | Mono schwarz (auch Streifen schwarz) — Maskable-Icon auf Orange |
| `af-logo-orange.png` | Mono orange — Sonderfälle |
| `af-logo-green.png` | **Nicht verwenden** (Don't-Beispiel) |

> **Wichtig (vom Nutzer bestätigt):** Im **Light-Modus `af-logo-dark.png`** verwenden — dessen
> **Streifen bleibt orange**, das „A" ist anthrazit und damit auf hellem Grund sichtbar. Im **Dark-Modus
> `af-logo.png`**. Das Logo also **themeabhängig** wählen (z. B. im `IconRail` per `useTheme()`).

**Logo-Regeln:** Schutzraum = ½ Logohöhe; nie verzerren/drehen/umfärben; unter 48px flache Mono-Version.
Wortmarke „Anatomie **Fokus**" immer Sora; „Fokus" in `--accent-on-surface`.

---

## 16. Dateien in diesem Paket

```
design_handoff_muskelfinder/
├─ README.md                          ← dieses Dokument
├─ COMPONENTS.md                      ← Komponenten-Inventar + TS-Props + Ort-Mapping
├─ theme.css                          ← Tokens light+dark, drop-in nach src/styles/
├─ types.ts                           ← Domänen-Modell, drop-in nach src/types/
├─ variables.css                      ← Original Dark-Tokens der 3D-App (Referenz/Abgleich)
├─ Muskelfinder Suche Redesign.dc.html← Haupt-Referenz (ALLE Frames 1a–3c)
├─ support.js                         ← nur damit die .dc.html im Browser rendert
└─ assets/                            ← Logo-PNGs (s. §15)
```
Die `.dc.html` im Browser öffnen (Doppelklick). `support.js` und `assets/` müssen daneben liegen.

---

## 17. Empfohlene Umsetzungs-Reihenfolge

1. **Setup:** Vite + React + TS Grundgerüst, Router, `theme.css` + `fonts.css` + `types.ts` einsetzen,
   `data-theme="light"` als Default, ThemeToggle + `useThemeStore` (persistiert).
2. **Daten:** alten Vanilla-Datenbestand nach `src/data/muscles.ts` (Typ `Muscle[]`) migrieren.
3. **Primitives** (`components/ui/`, siehe COMPONENTS.md · Teil A) — Button, Chip, Tag, Checkbox,
   SearchField, ProgressRing/Bar, DifficultyDots, Panel, Card, SegmentedControl, Icon, Sheet.
4. **App-Shell**: `AppShell` + `IconRail` (Desktop) + `TabBar` (Mobile) + `useMediaQuery`.
5. **SearchPage** (Kern-Flow): MuscleGrid + MuscleCard + FilterSidebar/Sheet + `useFilterStore` (inkl. Highlighting).
6. **MuscleDetailPage**: ImageViewer (dunkles Fenster) + DataList + Expert/Easy + Collection.
7. **FlashcardsPage** + `useProgressStore` (Leitner) → **QuizPage** + `useQuizStore` → **StatsPage**.
8. **Responsive-Pass** (§14) + **A11y-Pass** (§13). Isoliert pro Komponente arbeiten.

**Nicht:** kein Tailwind · keine externen Fonts/Icons/CDN · lateinische Muskelnamen als primärer
Anzeigename (UI-Chrome bleibt Deutsch) · Tokens nie hardcoden · Medien-Fenster in beiden Themes dunkel.
