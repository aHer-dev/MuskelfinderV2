/* =========================================================================
   Such- & Filter-Logik — reine Datenschicht (keine React-Abhängigkeit).
   src/data/search.ts

   Komponenten rendern nur; das Matching/Sortieren lebt hier und ist unit-getestet.
   Suche über lateinischen Namen (primär) + deutscher Name/Tags/Subregion/Innervation
   als „DE/Synonyme". Diakritika-tolerant, tokenweise UND-Verknüpfung.
   ========================================================================= */

import type { Movement, Muscle, MuscleFilter, RegionId, SortKey } from '../types';

/** Kleinschreibung, Diakritika entfernt, auf Wort-Tokens reduziert. */
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u00df/g, 'ss')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Längen-erhaltende Faltung (Kleinschreibung + Diakritika weg) für Treffer-Positionen. */
export function foldText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export interface HighlightSegment {
  text: string;
  match: boolean;
}

/**
 * Zerlegt einen Namen in Segmente, wobei das erste Vorkommen der (diakritika-
 * toleranten) Anfrage als Treffer markiert wird — für orange Hervorhebung.
 */
export function highlightName(name: string, query: string): HighlightSegment[] {
  const needle = foldText(query).trim();
  if (needle === '') return [{ text: name, match: false }];
  const index = foldText(name).indexOf(needle);
  if (index < 0) return [{ text: name, match: false }];
  return [
    { text: name.slice(0, index), match: false },
    { text: name.slice(index, index + needle.length), match: true },
    { text: name.slice(index + needle.length), match: false },
  ].filter((segment) => segment.text.length > 0);
}

function haystack(muscle: Muscle): string {
  return [
    muscle.nameLatin,
    muscle.nameDE ?? '',
    muscle.subregion,
    muscle.innervation,
    ...muscle.tags,
  ]
    .map(normalizeText)
    .join(' ');
}

/**
 * Relevanz-Score einer Karte gegenüber der (bereits normalisierten) Anfrage.
 * < 0  → kein Treffer (nicht alle Tokens gefunden); ≥ 0 → Treffer, höher = relevanter.
 */
export function queryScore(muscle: Muscle, normQuery: string, tokens: string[]): number {
  if (normQuery === '') return 0;
  const name = normalizeText(muscle.nameLatin);
  const stack = haystack(muscle);

  if (!tokens.every((token) => stack.includes(token))) return -1;

  let score = 0;
  if (name.startsWith(normQuery)) score += 100;
  else if (` ${name}`.includes(` ${normQuery}`)) score += 60;
  else if (name.includes(normQuery)) score += 40;

  const nameDE = muscle.nameDE ? normalizeText(muscle.nameDE) : '';
  if (nameDE && nameDE.startsWith(normQuery)) score += 30;

  score += tokens.filter((token) => name.includes(token)).length * 5;
  return score;
}

function matchesFilter(muscle: Muscle, filter: MuscleFilter): boolean {
  if (filter.regions.length > 0 && !filter.regions.includes(muscle.region)) return false;
  if (filter.joint && !muscle.joints.includes(filter.joint)) return false;
  if (filter.movement && !muscle.functions.includes(filter.movement)) return false;
  if (filter.innervation && muscle.innervation !== filter.innervation) return false;
  return true;
}

function compareAlpha(a: Muscle, b: Muscle): number {
  return a.nameLatin.localeCompare(b.nameLatin, 'de');
}

/** Wendet Filter + Suche + Sortierung an und liefert die getypte Ergebnisliste. */
export function filterMuscles(muscles: readonly Muscle[], filter: MuscleFilter): Muscle[] {
  const normQuery = normalizeText(filter.query);
  const tokens = normQuery ? normQuery.split(' ') : [];

  const scored: Array<{ muscle: Muscle; score: number }> = [];
  for (const muscle of muscles) {
    if (!matchesFilter(muscle, filter)) continue;
    const score = queryScore(muscle, normQuery, tokens);
    if (score < 0) continue;
    scored.push({ muscle, score });
  }

  scored.sort((a, b) => {
    if (filter.sort === 'difficulty') {
      if (a.muscle.difficulty !== b.muscle.difficulty) {
        return a.muscle.difficulty - b.muscle.difficulty;
      }
      return compareAlpha(a.muscle, b.muscle);
    }
    if (filter.sort === 'relevance' && normQuery) {
      if (a.score !== b.score) return b.score - a.score;
      return compareAlpha(a.muscle, b.muscle);
    }
    return compareAlpha(a.muscle, b.muscle);
  });

  return scored.map((entry) => entry.muscle);
}

/* ---------- Verfügbare Filter-Optionen (aus den Daten abgeleitet) ------ */

export interface FilterOptions {
  joints: string[];
  movements: Movement[];
  innervations: string[];
}

/** Sammelt die tatsächlich vorkommenden Gelenke/Bewegungen/Innervationen. */
export function getFilterOptions(
  muscles: readonly Muscle[],
  movements: readonly Movement[],
): FilterOptions {
  const joints = new Set<string>();
  const usedMovements = new Set<string>();
  const innervations = new Set<string>();

  for (const muscle of muscles) {
    muscle.joints.forEach((joint) => joints.add(joint));
    muscle.functions.forEach((fn) => usedMovements.add(fn));
    if (muscle.innervation) innervations.add(muscle.innervation);
  }

  const movementById = new Map(movements.map((movement) => [movement.id, movement]));
  const movementOptions: Movement[] = [...usedMovements]
    .map((id) => movementById.get(id) ?? { id, label: id })
    .sort((a, b) => a.label.localeCompare(b.label, 'de'));

  return {
    joints: [...joints].sort((a, b) => a.localeCompare(b, 'de')),
    movements: movementOptions,
    innervations: [...innervations].sort((a, b) => a.localeCompare(b, 'de')),
  };
}

/* ---------- Konstanten für UI/Serialisierung -------------------------- */

export const SORT_KEYS: readonly SortKey[] = ['alpha', 'relevance', 'difficulty'];
export const REGION_IDS: readonly RegionId[] = ['upper', 'lower', 'trunk', 'head'];
