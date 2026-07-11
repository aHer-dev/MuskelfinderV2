import { readFileSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { useProgressStore } from '../store/useProgressStore';
import { useQuizStore } from '../store/useQuizStore';
import { parseBackup } from './backup';
import { exportBackup, importBackup } from './backup-service';

const FIXTURE_DIR = path.join(process.cwd(), 'src/persistence/__fixtures__');

function fixture(name: string): string {
  return readFileSync(path.join(FIXTURE_DIR, name), 'utf8');
}

/** Sektionen (ohne wechselndes exportedAt), wie sie ein Import erwarten würde. */
function expectedSections(raw: string) {
  const { sections } = parseBackup(raw);
  return { flashcards: sections.flashcards, xp: sections.xp, quizSeries: sections.quizSeries };
}

describe('Backup Round-Trip (Kompatibilitäts-Selbsttest, ADR 0002)', () => {
  beforeEach(() => {
    localStorage.clear();
    useProgressStore.getState().resetProgress();
    useQuizStore.getState().resetAllSeries();
  });

  it('v2: Import → State → Export ist semantisch gleich', () => {
    importBackup(fixture('full-backup-v2.json'));
    const out = exportBackup('2026-07-08T00:00:00.000Z');

    const expected = expectedSections(fixture('full-backup-v2.json'));
    expect(out.flashcards).toEqual(expected.flashcards);
    expect(out.xp).toEqual(expected.xp);
    expect(out.quizSeries).toEqual(expected.quizSeries);
    expect(out.version).toBe(2);
  });

  it('v1: Import → Export schreibt v2, Sektionen bleiben inhaltsgleich', () => {
    importBackup(fixture('full-backup-v1.json'));
    const out = exportBackup();

    const expected = expectedSections(fixture('full-backup-v1.json'));
    expect(out.version).toBe(2);
    expect(out.flashcards).toEqual(expected.flashcards);
    expect(out.xp).toEqual(expected.xp);
    expect(out.quizSeries).toEqual(expected.quizSeries);
  });

  it('gelernter Stand ergibt in V2 dasselbe Level und dieselbe Fälligkeit', () => {
    importBackup(fixture('full-backup-v2.json'));
    // totalXP 553 → Level 5 (siehe xp.test.ts).
    expect(useProgressStore.getState().getLevel()).toBe(5);
    // Fälligkeit der Karte bleibt exakt erhalten.
    expect(useProgressStore.getState().getCardState('M. biceps brachii')?.nextDue).toBe(
      '2027-01-04T00:00:00.000Z',
    );
  });

  it('Legacy-Import ersetzt nur die Lernkarten, XP & Quiz-Serien bleiben', () => {
    useProgressStore.getState().replaceProgress({
      flashcards: { version: 2, cards: {} },
      xp: { version: 2, totalXP: 300, lastDailyBonus: '2026-07-08' },
    });
    useQuizStore.getState().replaceQuizSeries({
      'mode::x': { rounds: 1, answers: 2, correct: 1, history: [] },
    });

    const result = importBackup(fixture('legacy-flashcards.json'));

    expect(result.type).toBe('legacy-flashcards');
    expect(useProgressStore.getState().isInDeck('M. trapezius')).toBe(true);
    expect(useProgressStore.getState().xp.totalXP).toBe(300);
    expect(useQuizStore.getState().quizSeries['mode::x']).toBeDefined();
  });

  it('beschädigte Werte werden beim Import gehärtet und sind danach stabil', () => {
    importBackup(fixture('dirty-full-backup.json'));
    const first = exportBackup('2026-07-08T00:00:00.000Z');

    // Sanitisierung greift: fach geklammert, leere Keys weg, totalXP ≥ 0, correct ≤ answers.
    expect(first.flashcards.cards['M. soleus'].fach).toBe(7);
    expect(Object.keys(first.flashcards.cards)).toEqual(['M. soleus']);
    expect(first.xp.totalXP).toBe(0);
    expect(first.quizSeries['mode::x'].correct).toBe(5);
    expect(first.quizSeries['mode::x'].history).toHaveLength(5);

    // Re-Import des Exports → erneuter Export ist identisch (idempotent).
    useProgressStore.getState().resetProgress();
    useQuizStore.getState().resetAllSeries();
    importBackup(JSON.stringify(first));
    const second = exportBackup('2026-07-08T00:00:00.000Z');
    expect(second).toEqual(first);
  });
});
