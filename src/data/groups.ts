/* =========================================================================
   Funktionelle Gruppen (Etappe 9a) — reine Logik.
   src/data/groups.ts

   Geprüft wird in Zusammenhängen: „Nenne die Rotatorenmanschette." Die App kannte
   bisher nur Einzelmuskeln und topographische Subregionen.

   ⚠️ Gruppen sind eine **Many-to-Many-Dimension, keine Partition**:
   - Ein Muskel gehört zu MEHREREN Gruppen (M. supraspinatus: Rotatorenmanschette).
   - Viele Muskeln gehören zu KEINER. Das ist kein Fehler.
   - Eine Gruppe liegt oft INNERHALB einer Subregion (Rotatorenmanschette ⊂ Schultergürtel).
     Wer Gruppen als „zweite Subregion" baut, baut das Falsche.

   ⚠️ Die Daten liegen unter `src/data/editorial/`, NICHT unter `src/data/generated/`:
   Der generierte Ordner wird von `npm run migrate:data` neu erzeugt.
   ========================================================================= */

import editorial from './editorial/groups.json';
import type { Muscle } from '../types';

export interface MuscleGroup {
  id: string;
  label: string;
  /** Muskeln der Gruppe (`nameLatin`, ADR 0002 §2) — nicht die Routing-`id`. */
  muscles: string[];
  /** Fachlicher Hinweis (Prüfungsfalle, Abgrenzung). Optional. */
  note?: string;
}

export class GroupDataError extends Error {}

/**
 * Liest und **prüft** die redaktionelle Datei.
 *
 * Anders als bei Etymologie/Notizen wird hier **hart geprüft**: Ein Muskelname, den
 * es nicht gibt (Tippfehler in `groups.json`), würde sonst still verschwinden — die
 * Gruppe wäre unvollständig, und niemand merkte es. Eine unvollständige
 * Rotatorenmanschette ist schlimmer als gar keine.
 *
 * @param known Alle existierenden `nameLatin`. Fehlt sie, wird nicht gegen den
 *   Bestand geprüft (nur für isolierte Tests).
 */
export function readGroups(raw: unknown, known?: ReadonlySet<string>): MuscleGroup[] {
  const data = raw as { gruppen?: unknown };
  if (!Array.isArray(data?.gruppen)) return [];

  const groups: MuscleGroup[] = [];
  const seenIds = new Set<string>();

  for (const entry of data.gruppen) {
    const g = entry as Partial<MuscleGroup>;
    if (typeof g.id !== 'string' || typeof g.label !== 'string' || !Array.isArray(g.muscles)) {
      throw new GroupDataError(`Gruppe unvollständig: ${JSON.stringify(entry).slice(0, 80)}`);
    }
    if (seenIds.has(g.id)) throw new GroupDataError(`Doppelte Gruppen-id: „${g.id}"`);
    seenIds.add(g.id);

    // Namensdubletten (Hand/Fuß) sind laut ADR 0002 §2 DIESELBE Karte — einmal reicht.
    const muscles = [...new Set(g.muscles.filter((m): m is string => typeof m === 'string'))];

    if (known) {
      const unbekannt = muscles.filter((name) => !known.has(name));
      if (unbekannt.length > 0) {
        throw new GroupDataError(
          `Gruppe „${g.id}" nennt Muskeln, die es nicht gibt: ${unbekannt.join(', ')}`,
        );
      }
    }

    groups.push({ id: g.id, label: g.label, muscles, ...(g.note ? { note: g.note } : {}) });
  }

  return groups;
}

/** Index: `nameLatin` → Gruppen, in denen er steckt. */
export function indexByMuscle(groups: readonly MuscleGroup[]): Map<string, MuscleGroup[]> {
  const index = new Map<string, MuscleGroup[]>();
  for (const group of groups) {
    for (const name of group.muscles) {
      const list = index.get(name);
      if (list) list.push(group);
      else index.set(name, [group]);
    }
  }
  return index;
}

/* ---------- Der Bestand (vom Loader initialisiert) ---------------------- */

let GROUPS: readonly MuscleGroup[] = [];
let BY_MUSCLE: Map<string, MuscleGroup[]> = new Map();

/** Ruft der Loader auf, sobald die Muskeln validiert sind. */
export function initGroups(muscles: readonly Muscle[]): void {
  GROUPS = readGroups(editorial, new Set(muscles.map((m) => m.nameLatin)));
  BY_MUSCLE = indexByMuscle(GROUPS);
}

export function getGroups(): readonly MuscleGroup[] {
  return GROUPS;
}

export function getGroupById(id: string): MuscleGroup | undefined {
  return GROUPS.find((g) => g.id === id);
}

/** Die Gruppen eines Muskels — leer, wenn er zu keiner gehört (das ist kein Fehler). */
export function groupsOf(nameLatin: string): readonly MuscleGroup[] {
  return BY_MUSCLE.get(nameLatin) ?? [];
}
