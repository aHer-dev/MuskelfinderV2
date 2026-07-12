/* =========================================================================
   Auto-Seeding des Karteikastens (Etappe 7c) — reine Logik, kein Store.
   src/data/seeding.ts

   Der leere Karteikasten war die zweite Reibungswand: Spaced Repetition lief
   ins Leere, weil nie Karten drin waren. Aus der einen Frage „Was lernst du?"
   entsteht hier ein Startdeck — klein genug, um es zu schaffen, und in der
   Reihenfolge, die der Beruf verlangt.

   Bewusst KEINE Semester-/Curriculum-Sequenz (E4 steht auf „adaptiver
   Empfehler"). Eine feste Reihenfolge wäre später additiv nachrüstbar: eine
   sortierte Namensliste je Kohorte, sonst ändert sich nichts.
   ========================================================================= */

import { getMuscles } from './loader';
import type { Muscle, RegionId } from '../types';

export type Profession = 'physio' | 'ergo' | 'logo';

export const PROFESSIONS: Profession[] = ['physio', 'ergo', 'logo'];

/** Anzeigenamen — die UI formuliert nichts selbst zusammen. */
export const PROFESSION_LABELS: Record<Profession, string> = {
  physio: 'Physiotherapie',
  ergo: 'Ergotherapie',
  logo: 'Logopädie',
};

/** Startdeck: groß genug, um zu tragen, klein genug, um es nicht abzubrechen. */
export const SEED_DECK_SIZE = 20;

interface SeedProfile {
  /** Regionen in Prioritätsreihenfolge; der Anteil bestimmt die Quote am Startdeck. */
  weights: Array<[RegionId, number]>;
  /** Innerhalb der Region zuerst: die Feinbereiche, die dieser Beruf wirklich braucht. */
  preferredSubregions: string[];
}

/**
 * Die Berufsprofile. Die Gewichte sind fachlich gesetzt, nicht mathematisch:
 * Logopädie lebt an Kau-, Zungenbein- und Kehlkopfmuskulatur, Ergotherapie an
 * Hand und oberer Extremität, Physiotherapie an Extremitäten und Rumpf.
 */
const SEED_PROFILES: Record<Profession, SeedProfile> = {
  physio: {
    weights: [
      ['lower', 0.35],
      ['upper', 0.3],
      ['trunk', 0.25],
      ['head', 0.1],
    ],
    preferredSubregions: [],
  },
  ergo: {
    weights: [
      ['upper', 0.6],
      ['trunk', 0.15],
      ['head', 0.15],
      ['lower', 0.1],
    ],
    preferredSubregions: ['Hand & Finger', 'Ellenbogen'],
  },
  logo: {
    weights: [
      ['head', 0.7],
      ['trunk', 0.15],
      ['upper', 0.1],
      ['lower', 0.05],
    ],
    preferredSubregions: [
      'Kaumuskulatur',
      'Suprahyoidale Muskeln',
      'Infrahyoidale Muskeln',
      'Mimikmuskulatur',
    ],
  },
};

/** Fachlich bevorzugte Feinbereiche zuerst, dann die leichten Muskeln, dann alphabetisch. */
function rankWithin(profile: SeedProfile) {
  const rank = (m: Muscle): number => {
    const i = profile.preferredSubregions.indexOf(m.subregion);
    return i === -1 ? profile.preferredSubregions.length : i;
  };
  return (a: Muscle, b: Muscle): number =>
    rank(a) - rank(b) || a.difficulty - b.difficulty || a.nameLatin.localeCompare(b.nameLatin);
}

/**
 * Das Startdeck für einen Beruf: `nameLatin` in Lernreihenfolge (die erste Karte
 * ist die, mit der dieser Beruf anfangen sollte). Reicht eine Region nicht für
 * ihre Quote, füllen die nächstwichtigeren auf — das Deck bleibt vollzählig.
 */
export function seedDeck(
  profession: Profession,
  muscles: readonly Muscle[] = getMuscles(),
  size: number = SEED_DECK_SIZE,
): string[] {
  const profile = SEED_PROFILES[profession];
  const compare = rankWithin(profile);

  const pools = new Map<RegionId, Muscle[]>(
    profile.weights.map(([region]) => [
      region,
      muscles.filter((m) => m.region === region).sort(compare),
    ]),
  );

  /* Karten werden nach `nameLatin` geschlüsselt (ADR 0002 §2) — und fünf Namen gibt es
     zweimal (Hand und Fuß, z. B. „M. flexor digiti minimi brevis"). Zwei Muskeln mit
     demselben Namen sind also EINE Karte; ohne diese Sperre wäre das Startdeck stillschweigend
     kleiner als versprochen. */
  const chosen = new Set<string>();
  const picked: string[] = [];
  const takeFrom = (region: RegionId, count: number) => {
    const pool = pools.get(region) ?? [];
    let open = count;
    while (open > 0 && pool.length > 0) {
      const muscle = pool.shift() as Muscle;
      if (chosen.has(muscle.nameLatin)) continue;
      chosen.add(muscle.nameLatin);
      picked.push(muscle.nameLatin);
      open--;
    }
  };

  // Quoten (abgerundet) in Prioritätsreihenfolge …
  for (const [region, weight] of profile.weights) {
    takeFrom(region, Math.floor(size * weight));
  }
  // … dann die Restplätze (Rundung, zu kleine Regionen, Namensdubletten) auffüllen.
  for (const [region] of profile.weights) {
    if (picked.length >= size) break;
    takeFrom(region, size - picked.length);
  }

  return picked;
}
