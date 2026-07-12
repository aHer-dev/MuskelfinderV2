/* =========================================================================
   Empfehlungs-Engine „Heute dran" — reine Selektoren über Deck + Daten.
   src/data/today.ts

   Beantwortet die eine Frage, die Etappe 7 stellt: WAS soll die Studentin
   jetzt tun? Ergebnis ist ein getyptes `TodayPlan` — Zahlen und Codes, keine
   Sätze. Die Formulierung gehört ins UI (7b).

   Reine Funktionen: keine Store-Imports. Der Kartenstand wird hineingereicht,
   damit die Engine unit-testbar bleibt (ADR 0006).
   ========================================================================= */

import { isDue, MAX_FACH } from '../persistence/leitner';
import { regionMastery } from './stats';
import { getMuscles } from './loader';
import type { FlashcardCard } from '../persistence/types';
import type { Muscle, RegionId } from '../types';

/* ---------- Stellschrauben --------------------------------------------- */

/** Tagesdosis ohne Prüfungsdatum — eine Sitzung, die man auch wirklich macht. */
export const DEFAULT_DAILY_DOSE = 20;
/** Obergrenze auch bei nahem Prüfungstermin. Mehr wird nicht gelernt, nur abgebrochen. */
export const MAX_DAILY_DOSE = 40;
/** Ab dieser Zahl fälliger Karten gilt der Stau als Stau (Zustand `backlog`). */
export const BACKLOG_THRESHOLD = 1.5;
/** Erfahrungswert je Karte (Frage lesen, abrufen, bewerten). */
export const SECONDS_PER_CARD = 20;
/** „Alles wiederholt — 5 neue aus deinem Pfad?" (Rahmen-Briefing, Invariante 1). */
export const NEW_SUGGESTION_COUNT = 5;

/** Gewichte der Priorisierung. Summe ist bedeutungslos, nur das Verhältnis zählt. */
const W_OVERDUE = 3; // je Tag Verzug
const W_DIFFICULT = 15; // manuell als schwierig markiert
const W_LOW_FACH = 4; // je Fach unterhalb von 7
const W_REGION_WEAKNESS = 20; // × (1 − Beherrschung der Region)
const W_LOOKUP = 6; // je Nachschlagevorgang, gedeckelt
const LOOKUP_CAP = 5;

const MS_PER_DAY = 86_400_000;

/* ---------- Typen ------------------------------------------------------- */

/**
 * Der Zustand, in dem die Nutzerin die App öffnet. Trägt die Headline des
 * Heute-Screens — jeder Wert hat genau einen Primärbutton (7b).
 */
export type TodayKind =
  /** Kasten leer → Erstsetup (7c übernimmt das UI). */
  | 'needsOnboarding'
  /** Normalfall: fällige Karten in verdaubarer Menge. */
  | 'review'
  /** Überfällig-Stau: mehr fällig als eine Tagesdosis → gedeckelt. */
  | 'backlog'
  /** Nichts fällig, Kasten gefüllt → neue Muskeln aus dem Pfad. */
  | 'new';

/** Begründung als Daten. Das UI baut daraus den Satz, nicht umgekehrt. */
export interface TodayReason {
  kind: TodayKind;
  /** Worauf sich der Satz bezieht: fällige Karten (review/backlog) bzw. Vorschläge (new/needsOnboarding). */
  count: number;
  /** Schwächste betroffene Region, falls eine heraussticht. */
  region: RegionId | null;
  /** Dosis wurde wegen eines nahen Prüfungstermins angehoben. */
  examPressure: boolean;
}

export interface TodayPlan {
  kind: TodayKind;
  /** Die heutige Auswahl (`nameLatin`), priorisiert und auf die Tagesdosis gedeckelt. */
  dueCards: string[];
  /** Alle fälligen Karten — größer als `dueCards.length`, wenn gedeckelt wurde. */
  dueTotal: number;
  /** Der angewandte Deckel. */
  dailyDose: number;
  /** Schwächste Region mit fälligen Karten (bzw. mit Vorschlägen), sonst null. */
  focusRegion: RegionId | null;
  /** Muskeln (`nameLatin`), die noch nicht im Kasten sind — nach Pfad/Schwierigkeit. */
  newSuggestions: string[];
  /** Schätzung für die heutige Auswahl. 0, wenn nichts zu tun ist. */
  estimatedMinutes: number;
  deckSize: number;
  /** Tage bis zur Prüfung; null ohne Datum oder wenn der Termin vorbei ist. */
  daysUntilExam: number | null;
  reason: TodayReason;
}

export interface TodayInput {
  /** Karteikasten, geschlüsselt nach `nameLatin` (ADR 0002 §2). */
  cards: Record<string, FlashcardCard>;
  /** Detailseiten-Aufrufe je `nameLatin`. Kommt aus `useLookupStore` (7d); fehlt hier ohne Folgen. */
  lookupCounts?: Record<string, number>;
  /** Prüfungstermin (ISO oder Date), falls im Onboarding gesetzt (7c). */
  examDate?: string | Date | null;
  /** Muskelbestand — überschreibbar für Tests. */
  muscles?: readonly Muscle[];
  now?: Date;
}

/* ---------- Bausteine (exportiert, weil einzeln getestet) --------------- */

function startOfDay(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Volle Tage, die eine Karte über ihrer Fälligkeit steht. Nie negativ. */
export function daysOverdue(card: FlashcardCard, now: Date = new Date()): number {
  const diff = startOfDay(now) - startOfDay(new Date(card.nextDue));
  return diff > 0 ? Math.floor(diff / MS_PER_DAY) : 0;
}

/** Tage bis zur Prüfung. null ohne Datum, bei ungültigem Datum oder wenn der Termin durch ist. */
export function daysUntilExam(examDate: string | Date | null | undefined, now: Date = new Date()): number | null {
  if (!examDate) return null;
  const exam = new Date(examDate);
  if (Number.isNaN(exam.getTime())) return null;
  const days = Math.ceil((startOfDay(exam) - startOfDay(now)) / MS_PER_DAY);
  return days > 0 ? days : null;
}

/**
 * Tagesdosis: weniger Tage bis zur Prüfung → größere Dosis, gedeckelt bei
 * `MAX_DAILY_DOSE`. Ohne Termin bleibt es beim Default.
 */
export function dailyDose(days: number | null): number {
  if (days === null || days > 30) return DEFAULT_DAILY_DOSE;
  if (days > 14) return 25;
  if (days > 7) return 30;
  return MAX_DAILY_DOSE;
}

/** Schätzung in Minuten für eine Auswahl. Aufgerundet, mindestens 1 bei ≥ 1 Karte. */
export function estimateMinutes(cardCount: number): number {
  if (cardCount <= 0) return 0;
  return Math.max(1, Math.round((cardCount * SECONDS_PER_CARD) / 60));
}

/* ---------- Engine ------------------------------------------------------ */

interface Scored {
  name: string;
  score: number;
}

/** Deterministisch: erst Score absteigend, bei Gleichstand alphabetisch. */
function byScoreThenName(a: Scored, b: Scored): number {
  return b.score - a.score || a.name.localeCompare(b.name);
}

/**
 * Schwächste Region unter den übergebenen Muskelnamen: niedrigste Beherrschung,
 * bei Gleichstand die mit den meisten betroffenen Karten. null, wenn keine Region trägt.
 */
function weakestRegion(
  names: string[],
  mastery: Record<RegionId, number>,
  regionOf: (name: string) => RegionId | undefined,
): RegionId | null {
  const counts = new Map<RegionId, number>();
  for (const name of names) {
    const region = regionOf(name);
    if (region) counts.set(region, (counts.get(region) ?? 0) + 1);
  }
  let best: RegionId | null = null;
  for (const [region, count] of counts) {
    if (best === null) {
      best = region;
      continue;
    }
    const delta = mastery[region] - mastery[best];
    if (delta < 0 || (delta === 0 && count > (counts.get(best) ?? 0))) best = region;
  }
  return best;
}

/**
 * Der Tagesplan. Es gibt keinen Zustand ohne Vorschlag: leerer Kasten →
 * `needsOnboarding` mit Startvorschlägen, nichts fällig → `new`, Stau → `backlog`.
 */
export function getTodayPlan({
  cards,
  lookupCounts = {},
  examDate = null,
  muscles = getMuscles(),
  now = new Date(),
}: TodayInput): TodayPlan {
  const regionByName = new Map(muscles.map((m) => [m.nameLatin, m.region]));
  const regionOf = (name: string): RegionId | undefined => regionByName.get(name);
  const mastery = regionMastery(cards, regionOf);

  const deckSize = Object.keys(cards).length;
  const examDays = daysUntilExam(examDate, now);
  const dose = dailyDose(examDays);
  const examPressure = examDays !== null && dose > DEFAULT_DAILY_DOSE;
  const lookupsOf = (name: string): number => lookupCounts[name] ?? 0;

  /* Fällige Karten priorisieren: Verzug, Schwierig-Flag, niedriges Fach,
     Schwäche der Region, Nachschlage-Häufigkeit. */
  const due = Object.entries(cards)
    .filter(([, card]) => isDue(card, now))
    .map(([name, card]) => {
      const region = regionOf(name);
      const weakness = region ? (100 - mastery[region]) / 100 : 0;
      const score =
        daysOverdue(card, now) * W_OVERDUE +
        (card.difficult ? W_DIFFICULT : 0) +
        (MAX_FACH - card.fach) * W_LOW_FACH +
        weakness * W_REGION_WEAKNESS +
        Math.min(lookupsOf(name), LOOKUP_CAP) * W_LOOKUP;
      return { name, score };
    })
    .sort(byScoreThenName);

  const dueTotal = due.length;
  const dueCards = due.slice(0, dose).map((s) => s.name);

  /* Neue Muskeln aus dem Pfad: schwache Region zuerst, dann was sie nachgeschlagen
     hat, dann die leichten. */
  const focusForNew = weakestRegion(Object.keys(cards), mastery, regionOf);
  const newSuggestions = muscles
    .filter((m) => !(m.nameLatin in cards))
    .map((m) => ({
      name: m.nameLatin,
      score:
        (focusForNew !== null && m.region === focusForNew ? W_REGION_WEAKNESS : 0) +
        Math.min(lookupsOf(m.nameLatin), LOOKUP_CAP) * W_LOOKUP +
        (4 - m.difficulty) * W_LOW_FACH,
    }))
    .sort(byScoreThenName)
    .slice(0, NEW_SUGGESTION_COUNT)
    .map((s) => s.name);

  const kind: TodayKind =
    deckSize === 0
      ? 'needsOnboarding'
      : dueTotal === 0
        ? 'new'
        : dueTotal > dose * BACKLOG_THRESHOLD
          ? 'backlog'
          : 'review';

  /* Fokus beim Wiederholen: schwächste Region unter den heutigen Karten. Beim
     Vorschlagen: die Region, aus der die Vorschläge stammen. Regionen ohne Karten
     haben Beherrschung 0 — das heißt „unbekannt", nicht „schwach", und darf hier
     nicht mitsprechen. */
  const isReview = kind === 'review' || kind === 'backlog';
  const focusRegion = isReview ? weakestRegion(dueCards, mastery, regionOf) : focusForNew;
  const count = isReview ? dueTotal : newSuggestions.length;

  return {
    kind,
    dueCards,
    dueTotal,
    dailyDose: dose,
    focusRegion,
    newSuggestions,
    estimatedMinutes: estimateMinutes(isReview ? dueCards.length : newSuggestions.length),
    deckSize,
    daysUntilExam: examDays,
    reason: { kind, count, region: focusRegion, examPressure },
  };
}
