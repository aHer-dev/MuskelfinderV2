import { describe, expect, it } from 'vitest';
import { generateGroupQuiz } from './group-quiz';
import { getGroups } from './groups';
import { createRng, quizSeriesKey } from './quiz';
import { getMuscles } from './loader';

const MUSCLES = getMuscles();
const GROUPS = getGroups();

function quiz(count = 20, seed = 7) {
  return generateGroupQuiz({ groups: GROUPS, muscles: MUSCLES, count, rng: createRng(seed) });
}

describe('generateGroupQuiz', () => {
  it('fragt nach dem Fremden — und der Fremde ist die richtige Antwort', () => {
    for (const q of quiz()) {
      const gruppe = GROUPS.find((g) => q.prompt.includes(g.label));
      expect(gruppe, `keine Gruppe zu „${q.prompt}"`).toBeDefined();

      const richtig = q.options.find((o) => o.id === q.correctId);
      expect(richtig).toBeDefined();
      // Die richtige Antwort gehoert NICHT zur Gruppe …
      expect(gruppe!.muscles).not.toContain(richtig!.label);
      // … und alle anderen Optionen schon.
      for (const o of q.options.filter((o) => o.id !== q.correctId)) {
        expect(gruppe!.muscles, `${o.label} sollte in ${gruppe!.id} sein`).toContain(o.label);
      }
    }
  });

  it('vier Optionen, alle verschieden', () => {
    for (const q of quiz()) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options.map((o) => o.label)).size).toBe(4);
    }
  });

  it('der Fremde kommt aus derselben Region — sonst wäre die Frage geschenkt', () => {
    const regionOf = new Map(MUSCLES.map((m) => [m.id, m.region]));
    for (const q of quiz()) {
      const fremd = q.options.find((o) => o.id === q.correctId)!;
      const mitglieder = q.options.filter((o) => o.id !== q.correctId);
      const regionen = new Set(mitglieder.map((o) => regionOf.get(o.muscleId!)));
      expect(regionen.has(regionOf.get(fremd.muscleId!))).toBe(true);
    }
  });

  it('ist deterministisch bei gleichem Seed', () => {
    expect(quiz(5, 99)).toEqual(quiz(5, 99));
  });

  it('erfindet nichts, wenn die Gruppen fehlen', () => {
    expect(generateGroupQuiz({ groups: [], muscles: MUSCLES, count: 5 })).toEqual([]);
  });

  it('überspringt Gruppen, die für vier Optionen zu klein sind', () => {
    const winzig = [{ id: 'x', label: 'X', muscles: ['M. deltoideus', 'M. subclavius'] }];
    expect(generateGroupQuiz({ groups: winzig, muscles: MUSCLES, count: 5 })).toEqual([]);
  });
});

describe('ADR 0002: der Serien-Schlüssel bleibt unangetastet', () => {
  it('die bestehenden Modi liefern exakt den bisherigen Key', () => {
    expect(quizSeriesKey('innervation')).toBe(
      'innervation::{"deckOnly":false,"regions":[],"subgroups":[]}',
    );
    expect(quizSeriesKey('image')).toBe('image::{"deckOnly":false,"regions":[],"subgroups":[]}');
  });

  it('der Gruppen-Modus erzeugt einen ZUSÄTZLICHEN Key, keinen veränderten', () => {
    expect(quizSeriesKey('group-odd-one-out')).toBe(
      'group-odd-one-out::{"deckOnly":false,"regions":[],"subgroups":[]}',
    );
  });
});
