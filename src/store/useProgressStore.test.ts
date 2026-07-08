import { beforeEach, describe, expect, it } from 'vitest';
import { useProgressStore } from './useProgressStore';

function reset() {
  localStorage.clear();
  useProgressStore.getState().resetProgress();
}

describe('useProgressStore — Deck-Verwaltung', () => {
  beforeEach(reset);

  it('addCard legt eine Karte in Fach 1 an, Duplikate sind No-Ops', () => {
    const s = useProgressStore.getState();
    s.addCard('M. deltoideus');
    s.addCard('M. deltoideus');
    expect(s.getAddedCardNames()).toEqual(['M. deltoideus']);
    expect(s.getCardState('M. deltoideus')?.fach).toBe(1);
  });

  it('addCards fügt mehrere hinzu, removeCard entfernt', () => {
    const s = useProgressStore.getState();
    s.addCards(['A', 'B', 'C']);
    expect(s.getAddedCardNames()).toHaveLength(3);
    s.removeCard('B');
    expect(s.isInDeck('B')).toBe(false);
  });
});

describe('useProgressStore — Bewertung & XP', () => {
  beforeEach(reset);

  it('richtig hebt das Fach und vergibt 3 XP (Fach 1)', () => {
    const s = useProgressStore.getState();
    s.addCard('M. deltoideus');
    const award = s.reviewCard('M. deltoideus', 'correct');
    expect(award.xpAdded).toBe(3);
    expect(useProgressStore.getState().getCardState('M. deltoideus')?.fach).toBe(2);
    expect(useProgressStore.getState().xp.totalXP).toBe(3);
  });

  it('falsch in Fach 1 bleibt bei 1 und vergibt 1 XP', () => {
    const s = useProgressStore.getState();
    s.addCard('M. deltoideus');
    const award = s.reviewCard('M. deltoideus', 'wrong');
    expect(award.xpAdded).toBe(1);
    expect(useProgressStore.getState().getCardState('M. deltoideus')?.fach).toBe(1);
  });

  it('unsicher lässt das Fach, vergibt 2 XP', () => {
    const s = useProgressStore.getState();
    s.addCard('M. deltoideus');
    s.reviewCard('M. deltoideus', 'unsure');
    expect(useProgressStore.getState().getCardState('M. deltoideus')?.fach).toBe(1);
    expect(useProgressStore.getState().xp.totalXP).toBe(2);
  });

  it('Fach-Bonus greift ab Fach 5 (5× richtig → Fach 6, 16 XP)', () => {
    const s = useProgressStore.getState();
    s.addCard('M. deltoideus');
    for (let i = 0; i < 5; i++) s.reviewCard('M. deltoideus', 'correct');
    expect(useProgressStore.getState().getCardState('M. deltoideus')?.fach).toBe(6);
    // 3+3+3+3+4 (letztes Review mit Fach-5-Bonus)
    expect(useProgressStore.getState().xp.totalXP).toBe(16);
  });

  it('reviewCard auf unbekannte Karte ist folgenlos', () => {
    const award = useProgressStore.getState().reviewCard('gibt-es-nicht', 'correct');
    expect(award.xpAdded).toBe(0);
    expect(useProgressStore.getState().xp.totalXP).toBe(0);
  });

  it('Tagesbonus greift genau einmal pro Tag', () => {
    const s = useProgressStore.getState();
    const first = s.awardDailyBonus();
    expect(first.xpAdded).toBe(10);
    const second = useProgressStore.getState().awardDailyBonus();
    expect(second.xpAdded).toBe(0);
    expect(second.alreadyClaimed).toBe(true);
    expect(useProgressStore.getState().xp.totalXP).toBe(10);
  });
});

describe('useProgressStore — Selektoren & Persistenz', () => {
  beforeEach(reset);

  it('getLevel wird aus totalXP abgeleitet', () => {
    useProgressStore.getState().replaceProgress({
      flashcards: { version: 2, cards: {} },
      xp: { version: 2, totalXP: 50, lastDailyBonus: null },
    });
    expect(useProgressStore.getState().getLevel()).toBe(2);
  });

  it('schwierige Karten sind immer fällig', () => {
    const s = useProgressStore.getState();
    s.addCard('M. deltoideus');
    // Karte weit in die Zukunft schieben, aber als schwierig markieren.
    s.reviewCard('M. deltoideus', 'correct');
    s.toggleDifficult('M. deltoideus');
    expect(useProgressStore.getState().getDueCards()).toContain('M. deltoideus');
  });

  it('getStats zählt Karten je Fach', () => {
    const s = useProgressStore.getState();
    s.addCards(['A', 'B']);
    s.reviewCard('A', 'correct'); // A → Fach 2
    const stats = useProgressStore.getState().getStats();
    expect(stats.total).toBe(2);
    expect(stats.byFach[1]).toBe(1);
    expect(stats.byFach[2]).toBe(1);
  });

  it('persistiert unter dem Key mf.progress', () => {
    useProgressStore.getState().addCard('M. deltoideus');
    const raw = localStorage.getItem('mf.progress');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string).state.flashcards.cards['M. deltoideus']).toBeTruthy();
  });
});
