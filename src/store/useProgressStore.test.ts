import { beforeEach, describe, expect, it } from 'vitest';
import { useProgressStore } from './useProgressStore';

/* `clearProgress`, NICHT `resetProgress`: das Zurücksetzen behält die Karten seit dem
   UX-Review 2026-07-26 absichtlich im Kasten — als Test-Aufräumer würde es die Auswahl
   von einem Test in den nächsten tragen. */
function reset() {
  localStorage.clear();
  useProgressStore.getState().clearProgress();
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

/* ── „Der Karteikasten bleibt" (UX-Review 2026-07-26) ─────────────────────────
   Der Text auf `/statistik` versprach es, der Code löschte die Karten mit (gemessen
   24 → 0). Diese Gruppe ist die Prüfzeile dazu: Sie fällt, sobald `resetProgress`
   wieder die Kartenabbildung leert. */
describe('useProgressStore — resetProgress behält den Karteikasten', () => {
  beforeEach(reset);

  it('löscht Fächer, Fälligkeiten, Zähler und XP — aber KEINE Karte', () => {
    const s = useProgressStore.getState();
    s.addCards(['M. deltoideus', 'M. biceps brachii', 'M. soleus']);
    s.reviewCard('M. deltoideus', 'correct');
    s.reviewCard('M. deltoideus', 'correct');
    s.reviewCard('M. biceps brachii', 'wrong');
    expect(useProgressStore.getState().getCardState('M. deltoideus')?.fach).toBe(3);
    expect(useProgressStore.getState().xp.totalXP).toBeGreaterThan(0);

    useProgressStore.getState().resetProgress();
    const after = useProgressStore.getState();

    // Die Auswahl selbst ist unangetastet — das ist das Versprechen.
    expect(after.getAddedCardNames().sort()).toEqual(
      ['M. biceps brachii', 'M. deltoideus', 'M. soleus'].sort(),
    );
    // Der Lernstand ist weg.
    expect(after.xp.totalXP).toBe(0);
    for (const name of after.getAddedCardNames()) {
      const card = after.getCardState(name);
      expect(card?.fach).toBe(1);
      expect(card?.totalCorrect).toBe(0);
      expect(card?.totalWrong).toBe(0);
      expect(card?.lastSeen).toBeNull();
    }
    // Alles wieder fällig: Nach dem Zurücksetzen kann man sofort weiterlernen.
    expect(after.getDueCards().length).toBe(3);
  });

  it('behält die Schwierig-Markierung — sie gehört zur Auswahl, nicht zum Lernstand', () => {
    const s = useProgressStore.getState();
    s.addCards(['M. deltoideus', 'M. soleus']);
    s.toggleDifficult('M. deltoideus');

    useProgressStore.getState().resetProgress();

    expect(useProgressStore.getState().getCardState('M. deltoideus')?.difficult).toBe(true);
    expect(useProgressStore.getState().getCardState('M. soleus')?.difficult).toBe(false);
  });

  it('ADR 0002: das Kartenformat übersteht das Zurücksetzen feldgleich', () => {
    const s = useProgressStore.getState();
    s.addCard('M. deltoideus');
    const vorher = Object.keys(s.getCardState('M. deltoideus') as object).sort();
    useProgressStore.getState().resetProgress();
    const nachher = Object.keys(
      useProgressStore.getState().getCardState('M. deltoideus') as object,
    ).sort();
    expect(nachher).toEqual(vorher);
  });

  it('clearProgress räumt dagegen alles weg — auch die Auswahl', () => {
    const s = useProgressStore.getState();
    s.addCards(['M. deltoideus', 'M. soleus']);
    useProgressStore.getState().clearProgress();
    expect(useProgressStore.getState().getAddedCardNames()).toEqual([]);
  });

  it('removeCards nimmt mehrere Karten in einem Schritt heraus', () => {
    const s = useProgressStore.getState();
    s.addCards(['A', 'B', 'C', 'D']);
    useProgressStore.getState().removeCards(['B', 'D', 'gibtsnicht']);
    expect(useProgressStore.getState().getAddedCardNames().sort()).toEqual(['A', 'C']);
  });
});
