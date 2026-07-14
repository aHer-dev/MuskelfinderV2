import { describe, expect, it } from 'vitest';
import { getMuscles } from './loader';
import { createRng, generateQuiz, quizSeriesKey, readQuizHandoff } from './quiz';
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
  'function-mixed',
  'innervation',
  'origin-insertion',
  'insertion-origin',
  'origin-insertion-mixed',
  'image',
  'name-image',
  'image-mixed',
];

const IMG = { id: 'i1', url: 'pic.jpg', view: 'Ventral', attribution: 'X', license: 'CC BY 4.0' };

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

describe('readQuizHandoff — die Statistik startet einen Modus direkt (8c)', () => {
  it('nimmt einen bekannten Modus an', () => {
    expect(readQuizHandoff({ mode: 'innervation' })).toBe('innervation');
  });

  it('weist alles zurück, was kein Modus ist — der State kommt aus der History', () => {
    expect(readQuizHandoff({ mode: 'was-auch-immer' })).toBeNull();
    expect(readQuizHandoff({ mode: 42 })).toBeNull();
    expect(readQuizHandoff({})).toBeNull();
    expect(readQuizHandoff(null)).toBeNull();
    expect(readQuizHandoff('innervation')).toBeNull();
  });

  it('faellt nicht auf geerbte Eigenschaften herein', () => {
    expect(readQuizHandoff({ mode: 'toString' })).toBeNull();
  });

  it('ein Modus-Sprung veraendert den Serien-Schluessel nicht (ADR 0002)', () => {
    const mode = readQuizHandoff({ mode: 'innervation' });
    expect(mode).not.toBeNull();
    expect(quizSeriesKey(mode!)).toBe('innervation::{"deckOnly":false,"regions":[],"subgroups":[]}');
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

  /* Fuenf `nameLatin` gibt es zweimal (Hand/Fuss, und zweimal im Kopf). Bei `muscle-to-function`
     und `innervation` IST der Fragetext nur dieser Name — die Antwort des Zwillings waere fuer
     den gezeigten Namen GENAUSO richtig, wuerde aber als falsch gewertet. Vor dem Fix traf das
     gemessen ~18 % der Fragen ueber einen doppelten Namen (536 von 3000). */
  it('bietet den gleichnamigen Zwilling nie als falsche Antwort an', () => {
    const zwillinge = [
      m({ id: 'hand', nameLatin: 'M. digiti minimi', region: 'upper',
          functionDescription: 'Kleinfinger abspreizen', innervation: 'N. ulnaris' }),
      m({ id: 'fuss', nameLatin: 'M. digiti minimi', region: 'lower',
          functionDescription: 'Kleinzehe abspreizen', innervation: 'N. plantaris lateralis' }),
      ...MUSCLES,
    ];

    for (const mode of ['muscle-to-function', 'innervation'] as const) {
      for (let seed = 1; seed <= 60; seed++) {
        for (const frage of generateQuiz(zwillinge, mode, zwillinge.length, createRng(seed))) {
          const gefragt = zwillinge.find((x) => x.id === frage.muscleId)!;
          const fremde = frage.options.filter((o) => o.muscleId !== gefragt.id);
          for (const o of fremde) {
            const quelle = zwillinge.find((x) => x.id === o.muscleId);
            expect(quelle?.nameLatin).not.toBe(gefragt.nameLatin);
          }
        }
      }
    }
  });

  /* Dasselbe gegen die ECHTEN Daten: `M. nasalis` und `M. occipitofrontalis` liegen sogar in
     derselben Subregion — und `nearestFirst` zieht die Nachbarschaft zuerst. */
  it('haelt das auch auf dem echten Bestand durch (nasalis, occipitofrontalis, digiti minimi)', () => {
    const alle = getMuscles();
    const doppelt = new Set(
      alle.map((x) => x.nameLatin).filter((n, i, arr) => arr.indexOf(n) !== i),
    );
    expect(doppelt.size).toBe(5); // faellt das, hat sich der Datenstand geaendert

    for (const mode of ['muscle-to-function', 'innervation'] as const) {
      for (let seed = 1; seed <= 40; seed++) {
        for (const frage of generateQuiz(alle, mode, 20, createRng(seed))) {
          const gefragt = alle.find((x) => x.id === frage.muscleId)!;
          if (!doppelt.has(gefragt.nameLatin)) continue;
          const fremde = frage.options.filter((o) => o.id !== frage.correctId);
          for (const o of fremde) {
            const quelle = alle.find((x) => x.id === o.muscleId);
            expect(quelle?.nameLatin).not.toBe(gefragt.nameLatin);
          }
        }
      }
    }
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

  it('Name → Bild: Bild-Optionen mit correctId auf dem Zielmuskel', () => {
    const withImg = Array.from({ length: 5 }, (_, i) =>
      m({ id: `ni${i}`, nameLatin: `M. ni-${i}`, images: [{ ...IMG, id: `i${i}`, url: `pic-${i}.jpg` }] }),
    );
    const quiz = generateQuiz(withImg, 'name-image', 5, createRng(4));
    expect(quiz).toHaveLength(5);
    for (const q of quiz) {
      // Optionen tragen Bild-URLs, Prompt ist ein Muskelname.
      expect(q.options.every((o) => typeof o.imageUrl === 'string')).toBe(true);
      const target = withImg.find((mm) => mm.nameLatin === q.prompt)!;
      const correct = q.options.find((o) => o.id === q.correctId)!;
      expect(correct.imageUrl).toBe(target.images[0].url);
    }
  });

  it('Gemischt (image-mixed) mischt Bild→Muskel und Name→Bild', () => {
    const withImg = Array.from({ length: 12 }, (_, i) =>
      m({ id: `mx${i}`, nameLatin: `M. mx-${i}`, images: [{ ...IMG, id: `i${i}`, url: `pic-${i}.jpg` }] }),
    );
    const quiz = generateQuiz(withImg, 'image-mixed', 12, createRng(123));
    // Alle Fragen tragen den Anzeige-Modus des Familien-Modus (für den Serien-Key).
    expect(quiz.every((q) => q.mode === 'image-mixed')).toBe(true);
    const withImageOptions = quiz.filter((q) => q.options.some((o) => o.imageUrl));
    const withTextPrompt = quiz.filter((q) => q.imageUrl);
    // Beide Richtungen kommen vor (Bild-Prompt bzw. Bild-Optionen).
    expect(withImageOptions.length).toBeGreaterThan(0);
    expect(withTextPrompt.length).toBeGreaterThan(0);
  });

  it('funktioniert für alle Modi ohne Absturz', () => {
    for (const mode of MODES) {
      expect(() => generateQuiz(MUSCLES, mode, 3, createRng(5))).not.toThrow();
    }
  });
});

/* Vor dem 2026-07-14 wurde der ganze Bestand gemischt: „M. brachioradialis — Innervation?"
   bot N. femoralis, N. subscapularis, N. radialis und R. thyrohyoideus an. Ein Bein-Nerv, ein
   Schulter-Nerv, ein Kehlkopf-Ast — man loest das durch Ausschluss, ohne den Muskel zu kennen. */
describe('Distraktoren kommen aus der Nachbarschaft', () => {
  const NACHBARN: Muscle[] = [
    m({ id: 'brachio', nameLatin: 'M. brachioradialis', region: 'upper', subregion: 'Unterarm' }),
    m({ id: 'flexcarp', nameLatin: 'M. flexor carpi radialis', region: 'upper', subregion: 'Unterarm' }),
    m({ id: 'extcarp', nameLatin: 'M. extensor carpi ulnaris', region: 'upper', subregion: 'Unterarm' }),
    m({ id: 'supinator', nameLatin: 'M. supinator', region: 'upper', subregion: 'Unterarm' }),
    m({ id: 'delt', nameLatin: 'M. deltoideus', region: 'upper', subregion: 'Schulter' }),
    m({ id: 'soleus', nameLatin: 'M. soleus', region: 'lower', subregion: 'Wade' }),
    m({ id: 'masseter', nameLatin: 'M. masseter', region: 'head', subregion: 'Kaumuskeln' }),
    m({ id: 'rectus', nameLatin: 'M. rectus abdominis', region: 'trunk', subregion: 'Bauchwand' }),
  ];

  it('fuellt die falschen Antworten zuerst aus derselben Subregion', () => {
    // Genug Nachbarn (3 weitere im Unterarm) — der Rest des Koerpers darf gar nicht drankommen.
    for (const seed of [1, 2, 3, 7, 42]) {
      const [frage] = generateQuiz(NACHBARN, 'muscle-to-function', 1, createRng(seed));
      const gefragt = NACHBARN.find((x) => x.id === frage.muscleId)!;
      if (gefragt.subregion !== 'Unterarm') continue;

      const herkunft = frage.options
        .filter((o) => o.id !== frage.correctId)
        .map((o) => NACHBARN.find((x) => x.id === o.muscleId)?.subregion);

      expect(herkunft).toEqual(['Unterarm', 'Unterarm', 'Unterarm']);
    }
  });

  it('fuellt aus dem Rest auf, wenn die Nachbarschaft zu klein ist — vier Optionen bleiben Pflicht', () => {
    // M. masseter ist der einzige Kaumuskel: ohne Auffuellung gaebe es keine vier Optionen (8b).
    const nurEiner = NACHBARN.filter((x) => x.subregion !== 'Unterarm' || x.id === 'brachio');
    const quiz = generateQuiz(nurEiner, 'muscle-to-function', nurEiner.length, createRng(5));

    for (const frage of quiz) {
      expect(frage.options).toHaveLength(4);
      expect(new Set(frage.options.map((o) => o.label)).size).toBe(4);
    }
  });

  it('bleibt deterministisch — gleicher Seed, gleiche Optionen', () => {
    expect(generateQuiz(NACHBARN, 'innervation', 3, createRng(9))).toEqual(
      generateQuiz(NACHBARN, 'innervation', 3, createRng(9)),
    );
  });
})
