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
    origin: partial.origin ?? '',
    insertion: partial.insertion ?? '',
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

const MODES: QuizMode[] = [
  'function-to-muscle',
  'muscle-to-function',
  'innervation',
  'origin-insertion',
  'insertion-origin',
  'image',
];

describe('quizSeriesKey', () => {
  it('folgt der V1-Form <mode>::<filterSignatur> (ohne Filter = V1-kompatibel)', () => {
    expect(quizSeriesKey('innervation')).toBe(
      'innervation::{"deckOnly":false,"regions":[],"subgroups":[]}',
    );
  });

  it('kodiert einen Bereichsfilter als eigenen (sortierten) Schlüssel', () => {
    expect(quizSeriesKey('innervation', ['lower', 'head'])).toBe(
      'innervation::{"deckOnly":false,"regions":["head","lower"],"subgroups":[]}',
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

  it('Ursprung → Ansatz: Prompt = Ursprung, richtige Antwort = Ansatz', () => {
    const withOI = Array.from({ length: 5 }, (_, i) =>
      m({ id: `oi${i}`, nameLatin: `M. oi-${i}`, origin: `Ursprung ${i}`, insertion: `Ansatz ${i}` }),
    );
    const quiz = generateQuiz(withOI, 'origin-insertion', 5, createRng(11));
    expect(quiz).toHaveLength(5);
    for (const q of quiz) {
      const source = withOI.find((mm) => mm.origin === q.prompt);
      const correct = q.options.find((o) => o.id === q.correctId);
      expect(correct?.label).toBe(source?.insertion);
    }
  });

  it('Ursprung/Ansatz-Modi brauchen beide Felder (leere werden ausgelassen)', () => {
    // MUSCLES haben leere origin/insertion → kein tauglicher Kandidat.
    expect(generateQuiz(MUSCLES, 'origin-insertion', 5, createRng(5))).toHaveLength(0);
  });

  it('funktioniert für alle Modi ohne Absturz', () => {
    for (const mode of MODES) {
      expect(() => generateQuiz(MUSCLES, mode, 3, createRng(5))).not.toThrow();
    }
  });
});
