import { describe, expect, it } from 'vitest';
import {
  DAILY_BONUS_XP,
  flashcardXp,
  levelFromXP,
  MAX_LEVEL,
  MAX_LEVEL_XP,
  streakXp,
  xpForLevel,
  xpView,
} from './xp';

describe('xpForLevel (eingefrorene V1-Kurve)', () => {
  it('Level 1 kostet 0 XP, Level 2 exakt 50', () => {
    expect(xpForLevel(0)).toBe(0);
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(50);
  });

  it('Cap bei Level 99 = 99780, darüber konstant', () => {
    expect(xpForLevel(MAX_LEVEL)).toBe(MAX_LEVEL_XP);
    expect(xpForLevel(120)).toBe(MAX_LEVEL_XP);
  });

  it('ist streng monoton steigend von Level 2 bis 99', () => {
    for (let l = 2; l < MAX_LEVEL; l++) {
      expect(xpForLevel(l + 1)).toBeGreaterThan(xpForLevel(l));
    }
  });
});

describe('levelFromXP', () => {
  it('mappt totalXP auf das erreichte Level', () => {
    expect(levelFromXP(0)).toBe(1);
    expect(levelFromXP(49)).toBe(1);
    expect(levelFromXP(50)).toBe(2);
    expect(levelFromXP(MAX_LEVEL_XP)).toBe(99);
    expect(levelFromXP(500000)).toBe(99);
  });

  it('ist das exakte Inverse von xpForLevel (kein Level-Drift beim Import)', () => {
    for (let l = 1; l <= MAX_LEVEL; l++) {
      expect(levelFromXP(xpForLevel(l))).toBe(l);
    }
  });
});

describe('xpView', () => {
  it('leitet Level & Fortschritt aus totalXP ab', () => {
    const start = xpView(0);
    expect(start.level).toBe(1);
    expect(start.xpThisLevel).toBe(0);
    expect(start.xpNeeded).toBe(50);
    expect(start.progress).toBe(0);

    const level2 = xpView(50);
    expect(level2.level).toBe(2);
    expect(level2.xpThisLevel).toBe(0);
  });

  it('deckelt den Fortschritt bei Level 99 auf 1', () => {
    const capped = xpView(MAX_LEVEL_XP + 1000);
    expect(capped.level).toBe(99);
    expect(capped.progress).toBe(1);
  });
});

describe('XP-Vergabe-Beträge (V1-identisch)', () => {
  it('Lernkarte: Basis nach Rating + Fach-Bonus (F5+1, F6/F7+2)', () => {
    expect(flashcardXp('richtig', 1)).toBe(3);
    expect(flashcardXp('unsicher', 1)).toBe(2);
    expect(flashcardXp('falsch', 1)).toBe(1);
    expect(flashcardXp('richtig', 5)).toBe(4);
    expect(flashcardXp('unsicher', 6)).toBe(4);
    expect(flashcardXp('falsch', 7)).toBe(3);
    expect(flashcardXp('richtig', 3)).toBe(3);
  });

  it('Streak-Bonus nur bei 5/10/20', () => {
    expect(streakXp(5)).toBe(5);
    expect(streakXp(10)).toBe(10);
    expect(streakXp(20)).toBe(20);
    expect(streakXp(7)).toBe(0);
    expect(streakXp(0)).toBe(0);
  });

  it('Tagesbonus ist 10 XP', () => {
    expect(DAILY_BONUS_XP).toBe(10);
  });
});
