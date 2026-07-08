/* =========================================================================
   Muskelfinder — Domänen-Modell  ·  src/types/index.ts
   Verbindliche TypeScript-Typen für Daten, Filter, Lernkarten, Quiz,
   Fortschritt und Theme. TS strict; kein `any` in Kernpfaden.
   Anzeigename eines Muskels ist IMMER der lateinische Name.
   ========================================================================= */

/* ---------- Regionen & Bewegungen -------------------------------------- */

export type RegionId = 'upper' | 'lower' | 'trunk' | 'head';

export interface Region {
  id: RegionId;
  /** Deutscher Anzeigename, z. B. „Obere Extremität". */
  label: string;
  /** Anzahl Muskeln in dieser Region (für Filter-Zähler). */
  count: number;
}

/** Bewegungen/Funktionen — als Slug + Label, damit sie filterbar sind. */
export interface Movement {
  id: string;          // 'flexion' | 'extension' | 'abduction' | …
  label: string;       // „Flexion"
}

/* ---------- Muskel ------------------------------------------------------ */

export type Difficulty = 1 | 2 | 3;

export interface MuscleImage {
  id: string;
  url: string;
  /** Ansicht, z. B. „Ventral", „Dorsal". */
  view: string;
  attribution: string; // „© DBCLS · BodyParts3D"
  license: string;     // „CC BY 4.0"
  licenseUrl?: string;
  sourceUrl?: string;
}

export interface MuscleEasyFields {
  origin: string;
  insertion: string;
  functionDescription: string;
  innervation: string;
  segments: string;
}

export interface Muscle {
  id: string;
  /** Primärer Anzeigename — lateinisch. */
  nameLatin: string;         // „Musculus deltoideus"
  nameDE?: string;           // optional deutsch
  /** Terminologia Anatomica Code. */
  taCode?: string;           // „A04.6.02.002" — fehlt in V1-Daten.
  region: RegionId;
  /** Feinere Zuordnung, z. B. „Schultergürtel". */
  subregion: string;
  /** Gelenke, auf die der Muskel wirkt (für Gelenk-Filter). */
  joints: string[];
  origin: string;            // Ursprung
  insertion: string;         // Ansatz
  /** Funktionen als Movement-IDs (für Chips & Filter). */
  functions: string[];       // ['flexion','abduction', …]
  /** Ausformulierter V1-Funktionstext für Detail/Lernkarten. */
  functionDescription: string;
  innervation: string;       // „N. axillaris"
  segments: string;          // „C5–C6"
  clinicalNote?: string;     // klinischer Bezug
  difficulty: Difficulty;    // 1..3 (Punkt-Indikator)
  images: MuscleImage[];
  tags: string[];            // ['#Schultergürtel','#Abduktor']
  easy?: MuscleEasyFields;
}

/* ---------- Suche & Filter --------------------------------------------- */

export type SortKey = 'alpha' | 'relevance' | 'difficulty';

export interface MuscleFilter {
  query: string;
  regions: RegionId[];           // Mehrfachauswahl (Checkboxen)
  joint: string | null;
  movement: string | null;
  innervation: string | null;
  sort: SortKey;
}

export const EMPTY_FILTER: MuscleFilter = {
  query: '',
  regions: [],
  joint: null,
  movement: null,
  innervation: null,
  sort: 'alpha',
};

/* ---------- Lernkarten (Leitner / Spaced Repetition) ------------------- */

export type LeitnerBox = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type CardRating = 'wrong' | 'unsure' | 'correct';

export interface CardProgress {
  muscleId: string;
  box: LeitnerBox;
  /** ISO-Datum, wann die Karte wieder fällig ist. */
  due: string;
  lastReviewed?: string;
}

export type CardSide = 'front' | 'back';

export interface FlashcardSession {
  regionScope: RegionId | 'all';
  queue: string[];        // muscleId[]
  index: number;          // aktuelle Karte
  side: CardSide;         // front/back (Flip-Zustand)
  reviewed: number;
  total: number;
}

/* ---------- Quiz -------------------------------------------------------- */

export type QuizMode =
  | 'function-to-muscle'   // „Welcher Muskel …?"
  | 'muscle-to-function'
  | 'innervation'
  | 'image';               // Bild → Muskel

export interface QuizOption {
  id: string;              // = muscleId oder optionId
  label: string;
}

export interface QuizQuestion {
  id: string;
  mode: QuizMode;
  /** Kategorie-Label, z. B. „Funktion → Muskel". */
  category: string;
  prompt: string;
  imageUrl?: string;       // nur mode==='image'
  options: QuizOption[];   // i. d. R. 4
  correctId: string;
}

export type QuizPhase = 'answering' | 'revealed' | 'finished';

export interface QuizState {
  questions: QuizQuestion[];
  index: number;
  phase: QuizPhase;
  selectedId: string | null;
  correctCount: number;
  streak: number;
  score: number;
}

export interface QuizResult {
  total: number;
  correct: number;
  bestStreak: number;
  score: number;
  xpEarned: number;
}

/* ---------- Fortschritt / Gamification --------------------------------- */

export interface CardBreakdown {
  mastered: number;
  learning: number;
  neu: number;
}

export interface UserProgress {
  level: number;
  xp: number;
  xpToNext: number;
  streakDays: number;
  bestStreak: number;
  learnedCount: number;
  totalCount: number;
  cards: CardBreakdown;
  /** Beherrschung 0..100 je Region. */
  regionMastery: Record<RegionId, number>;
  /** Freigeschaltete Auszeichnungen. */
  achievements: string[];
}

/* ---------- Sammlung (Merkliste) --------------------------------------- */

export interface Collection {
  muscleIds: string[];
}

/* ---------- Theme ------------------------------------------------------- */

export type Theme = 'light' | 'dark';
