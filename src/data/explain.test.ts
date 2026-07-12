import { describe, expect, it } from 'vitest';
import { explainWrongAnswer } from './explain';
import { confusionPairs, confusionText } from './confusions';
import { getMuscleByLatinName, getMuscles } from './loader';
import type { Muscle, QuizMode, QuizQuestion } from '../types';

const SUPRA = getMuscleByLatinName('M. supraspinatus') as Muscle;
const INFRA = getMuscleByLatinName('M. infraspinatus') as Muscle;
const SOLEUS = getMuscleByLatinName('M. soleus') as Muscle;

/** Frage bauen: Option 0 = richtig (der gefragte Muskel), Option 1 = gewählter Distraktor. */
function question(
  concreteMode: QuizMode,
  correct: Muscle,
  distractor: Muscle,
  overrides: Partial<QuizQuestion> = {},
): QuizQuestion {
  return {
    id: 'q0',
    mode: concreteMode,
    concreteMode,
    category: 'Test',
    muscleId: correct.id,
    prompt: 'egal',
    options: [
      { id: 'o0', label: 'richtig', muscleId: correct.id },
      { id: 'o1', label: 'falsch', muscleId: distractor.id },
    ],
    correctId: 'o0',
    ...overrides,
  };
}

function explain(concreteMode: QuizMode, correct: Muscle, distractor: Muscle) {
  return explainWrongAnswer({ question: question(concreteMode, correct, distractor), selectedId: 'o1' });
}

describe('explainWrongAnswer — es wird kontrastiert, wonach gefragt war', () => {
  it('Funktion → Muskel: stellt die beiden Funktionen gegenüber', () => {
    // Ohne die kuratierte Liste zu treffen: Soleus als Distraktor.
    const result = explain('function-to-muscle', SUPRA, SOLEUS)!;

    expect(result.aspect).toBe('function');
    expect(result.text).toContain('M. soleus');
    expect(result.text).toContain(SOLEUS.functionDescription.replace(/[.;]+$/, ''));
    expect(result.text).toContain('Gesucht war M. supraspinatus');
    expect(result.curated).toBe(false);
  });

  it('Muskel → Funktion: benennt, wessen Funktion gewählt wurde', () => {
    const result = explain('muscle-to-function', SUPRA, SOLEUS)!;

    expect(result.aspect).toBe('function');
    expect(result.text).toContain('Das ist die Funktion von M. soleus');
    expect(result.text).toContain('M. supraspinatus dagegen');
  });

  it('Innervation: nennt den Nerv beider Muskeln', () => {
    const result = explain('innervation', SUPRA, SOLEUS)!;

    expect(result.aspect).toBe('innervation');
    expect(result.text).toContain(`${SOLEUS.innervation} versorgt M. soleus`);
    expect(result.text).toContain(`M. supraspinatus wird von ${SUPRA.innervation} versorgt`);
  });

  it('Ursprung → Ansatz: kontrastiert die Ansätze', () => {
    const result = explain('origin-insertion', SUPRA, SOLEUS)!;

    expect(result.aspect).toBe('insertion');
    expect(result.text).toContain('ist der Ansatz von M. soleus');
    expect(result.text).toContain('Der Ansatz von M. supraspinatus ist');
  });

  it('Ansatz → Ursprung: kontrastiert die Ursprünge', () => {
    const result = explain('insertion-origin', SUPRA, SOLEUS)!;

    expect(result.aspect).toBe('origin');
    expect(result.text).toContain('ist der Ursprung von M. soleus');
    expect(result.text).toContain('Der Ursprung von M. supraspinatus ist');
  });

  it('Bild → Muskel: kontrastiert die Lage', () => {
    const result = explain('image', SUPRA, SOLEUS)!;

    expect(result.aspect).toBe('location');
    expect(result.text).toContain('Gewählt: M. soleus');
    expect(result.text).toContain('Abgebildet ist M. supraspinatus');
    expect(result.text).toContain(SUPRA.subregion);
  });

  it('Name → Bild: benennt, welches Bild gewählt wurde', () => {
    const result = explain('name-image', SUPRA, SOLEUS)!;

    expect(result.text).toContain('Das gewählte Bild zeigt M. soleus');
    expect(result.text).toContain('Abgebildet ist M. supraspinatus');
  });
});

describe('explainWrongAnswer — Degradation statt Bruch', () => {
  const bare: Muscle = {
    ...SUPRA,
    id: 'leer',
    nameLatin: 'M. leer',
    functionDescription: '',
    origin: '',
    insertion: '',
    innervation: '',
    subregion: '',
  };
  const resolve = (id: string) => (id === 'leer' ? bare : getMuscles().find((m) => m.id === id));

  it('fehlende Felder kürzen den Satz, sie leeren ihn nicht', () => {
    const q = question('innervation', bare, SOLEUS);
    const result = explainWrongAnswer({ question: q, selectedId: 'o1', resolve })!;

    expect(result.text).toContain(`${SOLEUS.innervation} versorgt M. soleus`);
    expect(result.text).toContain('Gesucht war M. leer');
    expect(result.text.length).toBeGreaterThan(10);
  });

  it('ohne zuzuordnenden Distraktor bleibt die Aussage über den gesuchten Muskel', () => {
    const q = question('function-to-muscle', SUPRA, SOLEUS);
    q.options[1] = { id: 'o1', label: 'irgendwas' }; // kein muscleId → nicht auflösbar
    const result = explainWrongAnswer({ question: q, selectedId: 'o1' })!;

    expect(result.chosen).toBeUndefined();
    expect(result.text).toContain('Gesucht war M. supraspinatus');
    expect(result.text).not.toContain('undefined');
  });

  it('Plural-Muskeln bekommen ein Plural-Verb („Mm. lumbricales werden …")', () => {
    const plural = getMuscleByLatinName('Mm. lumbricales I–IV') as Muscle;
    expect(plural, 'Fixture-Muskel fehlt').toBeDefined();

    const result = explain('innervation', plural, SOLEUS)!;

    expect(result.text).toContain(`${plural.nameLatin} werden von`);
    expect(result.text).not.toContain(`${plural.nameLatin} wird von`);
    // Singular bleibt Singular.
    expect(explain('innervation', SOLEUS, plural)!.text).toContain('M. soleus wird von');
  });

  it('kein Satz ohne Anlass: richtige oder ausgebliebene Antwort ergibt keine Erklärung', () => {
    const q = question('function-to-muscle', SUPRA, SOLEUS);

    expect(explainWrongAnswer({ question: q, selectedId: 'o0' })).toBeNull();
    expect(explainWrongAnswer({ question: q, selectedId: null })).toBeNull();
  });

  it('erzeugt in JEDEM Modus einen nicht-leeren Satz ohne „undefined"', () => {
    const modes: QuizMode[] = [
      'function-to-muscle',
      'muscle-to-function',
      'innervation',
      'origin-insertion',
      'insertion-origin',
      'image',
      'name-image',
    ];

    for (const mode of modes) {
      const result = explain(mode, SUPRA, SOLEUS)!;
      expect(result.text.trim()).not.toBe('');
      expect(result.text).not.toMatch(/undefined|null/);
      expect(result.text.endsWith('.')).toBe(true);
    }
  });
});

describe('Verwechslungspaare (Handarbeit über dem Template)', () => {
  it('ein hinterlegtes Paar ersetzt den Template-Satz — in beide Richtungen', () => {
    const forward = explain('function-to-muscle', SUPRA, INFRA)!;
    const backward = explain('function-to-muscle', INFRA, SUPRA)!;

    expect(forward.curated).toBe(true);
    expect(forward.text).toContain('initiiert die Abduktion');
    expect(backward.text).toBe(forward.text);
  });

  it('jeder hinterlegte Muskelname existiert wirklich — ein Tippfehler wäre stumm', () => {
    const pairs = confusionPairs();
    expect(pairs.length).toBeGreaterThan(0);

    for (const [a, b] of pairs) {
      expect(getMuscleByLatinName(a), `unbekannt: ${a}`).toBeDefined();
      expect(getMuscleByLatinName(b), `unbekannt: ${b}`).toBeDefined();
      expect(confusionText(a, b)).not.toBeNull();
    }
  });

  it('ein nicht hinterlegtes Paar faellt sauber auf das Template zurück', () => {
    expect(confusionText('M. soleus', 'M. supraspinatus')).toBeNull();
  });
});
