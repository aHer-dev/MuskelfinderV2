import { describe, expect, it } from 'vitest';
import { createRng, generateQuiz, quizSeriesKey } from './quiz';
import type { Muscle, QuizMode } from '../types';

function m(partial: Partial<Muscle> & { id: string; nameLatin: string }): Muscle {
  return {
    id: partial.id,
    nameLatin: partial.nameLatin,
    region: partial.region ?? 'upper',
    subregion: '',
    joints: [],
    origin: '',
    insertion: '',
    functions: [],
    functionDescription: partial.functionDescription ?? `Funktion ${partial.id}`,
    innervation: partial.innervation ?? `N. ${partial.id}`,
    segments: '',
    difficulty: 1,
    images: partial.images ?? [],
    tags: [],
  };
}

const MUSCLES: Muscle[] = Array.from({ length: 8 }, (_, i) =>
  m({ id: `m${i}`, nameLatin: `M. nummer-${i}` }),
);

const MODES: QuizMode[] = ['function-to-muscle', 'muscle-to-function', 'innervation', 'image'];

describe('quizSeriesKey', () => {
  it('folgt der V1-Form <mode>::<filterSignatur>', () => {
    expect(quizSeriesKey('innervation')).toBe(
      'innervation::{"deckOnly":false,"regions":[],"subgroups":[]}',
    );
  });
});

describe('createRng', () => {
  it('ist deterministisch für denselben Seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe('generateQuiz', () => {
  it('erzeugt die gewünschte Fragenanzahl mit je 4 eindeutigen Optionen', () => {
    const quiz = generateQuiz(MUSCLES, 'function-to-muscle', 5, createRng(1));
    expect(quiz).toHaveLength(5);
    for (const q of quiz) {
      expect(q.options).toHaveLength(4);
      const labels = q.options.map((o) => o.label);
      expect(new Set(labels).size).toBe(4);
      // Die richtige Option existiert und ist unter den Optionen.
      expect(q.options.some((o) => o.id === q.correctId)).toBe(true);
    }
  });

  it('setzt correctId auf die inhaltlich richtige Antwort (muscle-to-function)', () => {
    const quiz = generateQuiz(MUSCLES, 'muscle-to-function', 3, createRng(7));
    for (const q of quiz) {
      const source = MUSCLES.find((mm) => mm.nameLatin === q.prompt);
      const correct = q.options.find((o) => o.id === q.correctId);
      expect(correct?.label).toBe(source?.functionDescription);
    }
  });

  it('ist deterministisch mit gleichem Seed', () => {
    const a = generateQuiz(MUSCLES, 'innervation', 4, createRng(99));
    const b = generateQuiz(MUSCLES, 'innervation', 4, createRng(99));
    expect(a).toEqual(b);
  });

  it('klemmt die Anzahl auf die verfügbaren Muskeln', () => {
    const quiz = generateQuiz(MUSCLES.slice(0, 2), 'function-to-muscle', 10, createRng(3));
    expect(quiz).toHaveLength(2);
  });

  it('liefert für den Bild-Modus nur Muskeln mit Bildern', () => {
    const withImg = [
      m({ id: 'a', nameLatin: 'M. a', images: [{ id: 'a1', url: 'x.jpg', view: 'Ventral', attribution: 'X', license: 'CC BY 4.0' }] }),
      m({ id: 'b', nameLatin: 'M. b' }),
    ];
    const quiz = generateQuiz(withImg, 'image', 10, createRng(2));
    expect(quiz).toHaveLength(1);
    expect(quiz[0].imageUrl).toBe('x.jpg');
  });

  it('funktioniert für alle Modi ohne Absturz', () => {
    for (const mode of MODES) {
      expect(() => generateQuiz(MUSCLES, mode, 3, createRng(5))).not.toThrow();
    }
  });
});
