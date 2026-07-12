import { describe, expect, it } from 'vitest';
import { PROFESSIONS, SEED_DECK_SIZE, seedDeck } from './seeding';
import { getMuscleByLatinName, getMuscles } from './loader';
import type { RegionId } from '../types';

/** Regionen-Verteilung eines Startdecks. */
function regionsOf(deck: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const name of deck) {
    const region = getMuscleByLatinName(name)?.region ?? '?';
    counts[region] = (counts[region] ?? 0) + 1;
  }
  return counts;
}

function dominantRegion(deck: string[]): RegionId {
  const counts = regionsOf(deck);
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as RegionId;
}

describe('seedDeck — jede Profession bekommt ein tragfähiges Startdeck', () => {
  it.each(PROFESSIONS)('%s: nicht leer, genau die Startdeck-Größe, ohne Dubletten', (profession) => {
    const deck = seedDeck(profession);

    expect(deck).toHaveLength(SEED_DECK_SIZE);
    expect(new Set(deck).size).toBe(SEED_DECK_SIZE);
    // Jeder Name muss ein echter Muskel sein — sonst hätte der Kasten Karteileichen.
    expect(deck.every((name) => getMuscleByLatinName(name))).toBe(true);
  });

  it('Logopädie beginnt am Kopf — nie mit dem M. gluteus maximus', () => {
    const deck = seedDeck('logo');

    expect(getMuscleByLatinName(deck[0])?.region).toBe('head');
    expect(dominantRegion(deck)).toBe('head');
    // Die DoD-Zusage wörtlich: nicht als erste Karte — und hier auch sonst nirgends.
    expect(deck).not.toContain('M. gluteus maximus');
  });

  it('Ergotherapie beginnt an der oberen Extremität, bevorzugt Hand & Finger', () => {
    const deck = seedDeck('ergo');
    const first = getMuscleByLatinName(deck[0]);

    expect(first?.region).toBe('upper');
    expect(first?.subregion).toBe('Hand & Finger');
    expect(dominantRegion(deck)).toBe('upper');
  });

  it('Physiotherapie deckt Extremitäten und Rumpf ab, nicht nur eine Region', () => {
    const deck = seedDeck('physio');
    const counts = regionsOf(deck);

    expect(counts.lower).toBeGreaterThan(0);
    expect(counts.upper).toBeGreaterThan(0);
    expect(counts.trunk).toBeGreaterThan(0);
    expect(dominantRegion(deck)).toBe('lower');
  });

  it('beginnt innerhalb der Schwerpunktregion mit den leichten Muskeln', () => {
    const deck = seedDeck('physio');
    const lower = deck
      .map((n) => getMuscleByLatinName(n))
      .filter((m) => m?.region === 'lower')
      .map((m) => m!.difficulty);

    // Aufsteigend: die Studentin fängt nicht beim schwersten Muskel an.
    expect([...lower].sort((a, b) => a - b)).toEqual(lower);
    expect(lower[0]).toBe(1);
  });

  it('füllt auf, wenn eine Region ihre Quote nicht hergibt', () => {
    // Nur Kopfmuskeln vorhanden: ein Physio-Deck (Schwerpunkt lower) muss trotzdem voll werden.
    const headOnly = getMuscles().filter((m) => m.region === 'head');
    const deck = seedDeck('physio', headOnly, 10);

    expect(deck).toHaveLength(10);
    expect(new Set(deck).size).toBe(10);
  });

  it('zählt Namensdubletten als eine Karte und füllt trotzdem auf', () => {
    // Fünf lateinische Namen gibt es zweimal (Hand und Fuß). Karten werden nach
    // `nameLatin` geschlüsselt (ADR 0002 §2) — zwei Muskeln, ein Name, eine Karte.
    // Das Ergo-Deck greift genau in diese Zone (Hand & Finger + etwas Fuß).
    const deck = seedDeck('ergo');

    expect(deck).toHaveLength(SEED_DECK_SIZE);
    expect(new Set(deck).size).toBe(SEED_DECK_SIZE);
  });

  it('gibt nie mehr Karten aus, als es Muskeln gibt', () => {
    const three = getMuscles().slice(0, 3);
    expect(seedDeck('logo', three, SEED_DECK_SIZE)).toHaveLength(3);
  });
});
