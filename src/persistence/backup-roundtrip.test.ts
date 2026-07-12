import { readFileSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { useLookupStore } from '../store/useLookupStore';
import { useProfileStore } from '../store/useProfileStore';
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

describe('Additive Sektion „lookups" (7d) — ADR 0002 bleibt unangetastet', () => {
  beforeEach(() => {
    localStorage.clear();
    useProgressStore.getState().resetProgress();
    useQuizStore.getState().resetAllSeries();
    useLookupStore.getState().resetLookups();
  });

  it('ohne Nachschlagen fehlt der Schlüssel — die Datei ist die von vor 7d', () => {
    importBackup(fixture('full-backup-v2.json'));
    const out = exportBackup('2026-07-08T00:00:00.000Z');

    expect(out).not.toHaveProperty('lookups');
    expect(Object.keys(out).sort()).toEqual(
      ['backupType', 'exportedAt', 'flashcards', 'quizSeries', 'version', 'xp'].sort(),
    );
  });

  it('ein V1-Backup ohne die Sektion loescht die lokalen Zaehler nicht', () => {
    useLookupStore.getState().record('M. deltoideus');

    importBackup(fixture('full-backup-v1.json'));

    expect(useLookupStore.getState().lookups.entries['M. deltoideus'].count).toBe(1);
  });

  it('Zaehler ueberleben Export → Import verlustfrei', () => {
    importBackup(fixture('full-backup-v2.json'));
    useLookupStore.getState().record('M. supraspinatus', new Date('2026-07-12T09:00:00.000Z'));
    useLookupStore.getState().record('M. supraspinatus', new Date('2026-07-12T10:00:00.000Z'));

    const out = exportBackup('2026-07-08T00:00:00.000Z');
    expect(out.lookups?.entries['M. supraspinatus']).toEqual({
      count: 2,
      lastLookup: '2026-07-12T10:00:00.000Z',
    });

    useLookupStore.getState().resetLookups();
    importBackup(JSON.stringify(out));

    expect(useLookupStore.getState().lookups.entries['M. supraspinatus'].count).toBe(2);
    // Und die Pflicht-Sektionen bleiben davon unberührt.
    expect(useProgressStore.getState().getLevel()).toBe(5);
  });

  it('eine kaputte lookups-Sektion kippt den Import nicht — die Karten sind das Wertvolle', () => {
    const broken = JSON.parse(fixture('full-backup-v2.json'));
    broken.lookups = { version: 2, entries: { '': { count: 3 }, 'M. soleus': 'kaputt' } };

    const result = importBackup(JSON.stringify(broken));

    expect(result.type).toBe('full-backup');
    expect(useProgressStore.getState().isInDeck('M. biceps brachii')).toBe(true);
    // Leerer Name raus, unbrauchbarer Eintrag auf einen plausiblen Wert gehaertet.
    expect(useLookupStore.getState().lookups.entries['']).toBeUndefined();
    expect(useLookupStore.getState().lookups.entries['M. soleus'].count).toBe(1);
  });
});

describe('Additive Sektion „profile" (Entscheidung 2026-07-12)', () => {
  beforeEach(() => {
    localStorage.clear();
    useProgressStore.getState().resetProgress();
    useQuizStore.getState().resetAllSeries();
    useLookupStore.getState().resetLookups();
    useProfileStore.getState().resetProfile();
  });

  it('ohne Profil fehlt der Schluessel — die Datei bleibt die von vor 7c', () => {
    importBackup(fixture('full-backup-v2.json'));
    const out = exportBackup('2026-07-08T00:00:00.000Z');

    expect(out).not.toHaveProperty('profile');
  });

  it('Beruf und Pruefungstermin ueberleben Export → Import', () => {
    importBackup(fixture('full-backup-v2.json'));
    useProfileStore.getState().setProfile('logo', '2026-09-01');

    const out = exportBackup('2026-07-08T00:00:00.000Z');
    expect(out.profile).toEqual({ version: 2, profession: 'logo', examDate: '2026-09-01' });

    useProfileStore.getState().resetProfile();
    importBackup(JSON.stringify(out));

    expect(useProfileStore.getState().profession).toBe('logo');
    expect(useProfileStore.getState().examDate).toBe('2026-09-01');
  });

  it('ein unbekannter Beruf wird verworfen statt durchgereicht', () => {
    const dirty = JSON.parse(fixture('full-backup-v2.json'));
    dirty.profile = { version: 2, profession: 'zahnmedizin', examDate: 'irgendwann' };

    importBackup(JSON.stringify(dirty));

    expect(useProfileStore.getState().profession).toBeNull();
    expect(useProfileStore.getState().examDate).toBeNull();
    // Die Karten kommen trotzdem an — eine kaputte Zusatzsektion kippt den Import nicht.
    expect(useProgressStore.getState().isInDeck('M. biceps brachii')).toBe(true);
  });

  it('ein altes Backup ohne die Sektion loescht das lokale Profil nicht', () => {
    useProfileStore.getState().setProfile('physio', '2026-08-15');

    importBackup(fixture('full-backup-v1.json'));

    expect(useProfileStore.getState().profession).toBe('physio');
    expect(useProfileStore.getState().examDate).toBe('2026-08-15');
  });
});
