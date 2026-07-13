/* =========================================================================
   Was hinter einem Statistik-Knopf steckt (Etappe 8c, Brücke B4) — reine Selektoren.
   src/data/practice.ts

   „Keine Zahl ohne Knopf." Die Statistik weiß seit Etappe 3, dass die Schulter bei
   41 % steht — und sagte es, ohne zu helfen. Jeder ausgewiesenen Schwäche steht
   jetzt genau eine Aktion daneben.

   Zwei Regeln, die jeder Selektor hier befolgt:

   1. **Nur fällige Karten.** Die Sitzung filtert die Übergabe erneut auf Fälligkeit
      (`buildQueue` in `useSessionStore`). Wer hier eine nicht-fällige Karte verspricht,
      baut einen Knopf, der eine leere Sitzung startet — genau das darf nicht passieren.
   2. **Dieselbe Priorisierung wie der Tagesplan** (`prioritizeDueCards`), keine zweite.

   Ist nichts zu tun, sagt der Selektor WARUM. Das UI formuliert daraus den Satz und
   deaktiviert den Knopf — ein Klick, der nichts bewirkt, ist schlimmer als kein Knopf.
   ========================================================================= */

import { MASTERED_FACH } from '../persistence/leitner';
import { getMuscles } from './loader';
import { regionMastery } from './stats';
import { prioritizeDueCards } from './today';
import type { FlashcardCard } from '../persistence/types';
import type { Muscle, RegionId } from '../types';

/** Ab diesem Fach (und darunter) gilt eine Karte als schwach — sie sitzt noch nicht. */
export const WEAK_FACH = 2;

/** Warum ein Knopf nichts zu tun hat. Codes, keine Sätze (das UI formuliert). */
export type PracticeBlocker =
  /** Zu dieser Auswahl liegt gar keine Karte im Kasten. */
  | 'noCards'
  /** Karten gibt es, aber heute ist keine davon fällig. */
  | 'nothingDue'
  /** Es gibt nichts zu verbessern — alles gemeistert bzw. keine schwachen Karten. */
  | 'nothingToFix';

export interface PracticeSelection {
  /** Die Karten der Sitzung (`nameLatin`), priorisiert. Leer ⇔ `blocker` gesetzt. */
  names: string[];
  /** Grund, warum der Knopf nicht klickbar ist — `null`, wenn er es ist. */
  blocker: PracticeBlocker | null;
}

export interface PracticeInput {
  cards: Record<string, FlashcardCard>;
  lookupCounts?: Record<string, number>;
  muscles?: readonly Muscle[];
  now?: Date;
}

const NOTHING = (blocker: PracticeBlocker): PracticeSelection => ({ names: [], blocker });

function selection(names: string[], emptyBlocker: PracticeBlocker): PracticeSelection {
  return names.length > 0 ? { names, blocker: null } : NOTHING(emptyBlocker);
}

/* ---------- Region: „Diese Region üben" -------------------------------- */

/**
 * Die fälligen Karten einer Region. Liegt aus dem Bereich nichts im Kasten, ist das
 * kein Defizit, sondern eine Leerstelle — dann sagt der Knopf das, statt zu behaupten,
 * es gäbe etwas zu üben.
 */
export function regionPractice(input: PracticeInput, region: RegionId): PracticeSelection {
  const { cards, muscles = getMuscles() } = input;

  const inRegion = new Set(
    muscles.filter((m) => m.region === region).map((m) => m.nameLatin),
  );
  const deckInRegion = Object.keys(cards).filter((name) => inRegion.has(name));
  if (deckInRegion.length === 0) return NOTHING('noCards');

  const due = prioritizeDueCards({ ...input, muscles }).filter((name) => inRegion.has(name));
  return selection(due, 'nothingDue');
}

export interface RegionFocus {
  /** Die Region, auf die der Knopf zeigt — `null`, wenn keine etwas zu tun hat. */
  region: RegionId | null;
  selection: PracticeSelection;
}

/**
 * Die Region, in der sich Zeit am meisten lohnt **und** heute etwas zu tun ist:
 * niedrigste Beherrschung unter denen mit fälligen Karten, bei Gleichstand die mit
 * den meisten.
 *
 * Die schwächste Region OHNE fällige Karten zu nennen wäre eine Falle: Der Knopf
 * verspräche Arbeit, die Sitzung wäre leer.
 */
export function weakestRegionPractice(input: PracticeInput): RegionFocus {
  const { cards, muscles = getMuscles() } = input;
  const regionByName = new Map(muscles.map((m) => [m.nameLatin, m.region]));
  const mastery = regionMastery(cards, (name) => regionByName.get(name));

  const regions = [...new Set(muscles.map((m) => m.region))];
  let best: RegionFocus['region'] = null;
  let bestSelection: PracticeSelection | null = null;

  for (const region of regions) {
    const selected = regionPractice({ ...input, muscles }, region);
    if (selected.names.length === 0) continue;
    if (
      best === null ||
      mastery[region] < mastery[best] ||
      (mastery[region] === mastery[best] && selected.names.length > (bestSelection?.names.length ?? 0))
    ) {
      best = region;
      bestSelection = selected;
    }
  }

  if (best === null || bestSelection === null) {
    return {
      region: null,
      selection: NOTHING(Object.keys(cards).length === 0 ? 'noCards' : 'nothingDue'),
    };
  }
  return { region: best, selection: bestSelection };
}

/* ---------- Schwache Karten: „Die schwachen Karten üben" --------------- */

/**
 * Karten in Fach 1–2 — die, die noch gar nicht sitzen. Sind alle darüber, ist die
 * Antwort nicht „nichts fällig", sondern „hier ist nichts zu reparieren".
 */
export function weakCardsPractice(input: PracticeInput): PracticeSelection {
  const { cards } = input;

  const weak = new Set(
    Object.entries(cards)
      .filter(([, card]) => card.fach <= WEAK_FACH)
      .map(([name]) => name),
  );
  if (weak.size === 0) return NOTHING('nothingToFix');

  const due = prioritizeDueCards(input).filter((name) => weak.has(name));
  return selection(due, 'nothingDue');
}

/* ---------- Abzeichen: „Die fehlenden Karten der Gruppe üben" ---------- */

/**
 * Der Weg zu einem Kompetenz-Abzeichen (9b): was der Gruppe noch zur Meisterschaft fehlt.
 *
 * Zwei Sorten von „fehlt", und beide müssen mit — sonst bliebe ein Abzeichen für immer bei
 * „3 von 4" stehen:
 * 1. **Karten unter Fach 5**, die heute **fällig** sind (Regel 1 dieser Datei).
 * 2. **Muskeln, die gar nicht im Kasten liegen.** Sie haben kein Fach, also kann kein
 *    Fälligkeitsfilter sie finden. Der Knopf legt sie an — wie schon die Gruppenseite aus
 *    9a — und eine frische Karte ist sofort fällig (`newCard`), fällt also nicht wieder raus.
 *
 * ⚠️ Der Aufrufer muss `addCards(selection.names)` rufen, bevor er die Sitzung startet.
 *
 * @param groupMuscles `nameLatin` der Gruppenmuskeln (ADR 0002 §2).
 */
export function groupPractice(
  input: PracticeInput,
  groupMuscles: readonly string[],
): PracticeSelection {
  const { cards } = input;

  const nochNichtImKasten = groupMuscles.filter((name) => !(name in cards));
  const offenImKasten = new Set(
    groupMuscles.filter((name) => name in cards && cards[name].fach < MASTERED_FACH),
  );

  // Alles im Kasten und alles gemeistert → das Abzeichen ist verdient.
  if (nochNichtImKasten.length === 0 && offenImKasten.size === 0) return NOTHING('nothingToFix');

  const due = prioritizeDueCards(input).filter((name) => offenImKasten.has(name));
  return selection([...nochNichtImKasten, ...due], 'nothingDue');
}

/* ---------- Meilenstein: „Die Karten, die dem am nächsten sind" -------- */

/**
 * Die Karten, die dem nächsten Meilenstein am nächsten stehen: fällige Karten
 * unterhalb der Meisterschaft, **die höchsten Fächer zuerst** — eine Karte in Fach 4
 * ist einen richtigen Abruf von „gemeistert" entfernt, eine in Fach 1 fünf.
 *
 * Das ist bewusst die umgekehrte Reihenfolge des Tagesplans (der die schwächsten
 * zuerst nimmt): Dieser Knopf verspricht nicht „lerne gut", sondern „bring diese
 * Karten über die Linie". Bei Gleichstand entscheidet wieder die Tagesplan-Priorität.
 *
 * @param needed Wie viele Karten bis zum Meilenstein fehlen. `null` = alle erreicht.
 */
export function milestonePractice(input: PracticeInput, needed: number | null): PracticeSelection {
  const { cards } = input;
  if (needed === null || needed <= 0) return NOTHING('nothingToFix');

  const unmastered = new Set(
    Object.entries(cards)
      .filter(([, card]) => card.fach < MASTERED_FACH)
      .map(([name]) => name),
  );
  if (unmastered.size === 0) return NOTHING('nothingToFix');

  const prioritized = prioritizeDueCards(input);
  const rank = new Map(prioritized.map((name, index) => [name, index]));

  const closest = prioritized
    .filter((name) => unmastered.has(name))
    .sort(
      (a, b) =>
        cards[b].fach - cards[a].fach || (rank.get(a) ?? 0) - (rank.get(b) ?? 0),
    )
    .slice(0, needed);

  return selection(closest, 'nothingDue');
}
