import { describe, expect, it } from 'vitest';
import { checkAnswer, levenshtein, normalizeName, tolerance } from './answer-check';
import { getMuscles } from './loader';

const CORPUS = getMuscles().map((m) => ({ nameLatin: m.nameLatin, nameDE: m.nameDE }));

/** Prüfung wie im Betrieb: immer gegen den ganzen Namensraum. */
function check(input: string, expected: string) {
  return checkAnswer(input, { nameLatin: expected }, CORPUS).verdict;
}

describe('normalizeName', () => {
  // Eine Zeile pro Normalisierungsregel (DoD 8a).
  const CASES: Array<[rule: string, raw: string, expected: string]> = [
    ['Artikel „M."', 'M. deltoideus', 'deltoideus'],
    ['Artikel „Mm."', 'Mm. rotatores', 'rotatores'],
    ['ausgeschrieben „Musculus"', 'Musculus deltoideus', 'deltoideus'],
    ['ausgeschrieben „Musculi"', 'Musculi rotatores', 'rotatores'],
    ['Großschreibung', 'DELTOIDEUS', 'deltoideus'],
    ['Diakritika', 'M. glutéus máximus', 'gluteus maximus'],
    ['Mehrfach-Leerzeichen', '  M.   psoas    major ', 'psoas major'],
    ['Bindestrich', 'M. occipito-frontalis', 'occipito frontalis'],
    ['Gedankenstrich', 'M. trapezius – Pars descendens', 'trapezius descendens'],
    ['Strukturwort „Pars"', 'M. trapezius Pars transversa', 'trapezius transversa'],
    ['Strukturwort „Caput"', 'M. biceps femoris Caput breve', 'biceps femoris breve'],
    ['Strukturwort „und"', 'Caput laterale und mediale', 'laterale mediale'],
    ['Klammern werden zu Leerraum', 'M. fibularis longus (M. peroneus longus)', 'fibularis longus peroneus longus'],
  ];

  it.each(CASES)('%s', (_rule, raw, expected) => {
    expect(normalizeName(raw)).toBe(expected);
  });

  it('behält die römische Nummerierung — sie trennt Hand von Fuß', () => {
    // „Mm. lumbricales I–IV" (Hand) und „Mm. lumbricales" (Fuß) sind zwei Karten.
    expect(normalizeName('Mm. lumbricales I–IV')).not.toBe(normalizeName('Mm. lumbricales'));
  });
});

describe('checkAnswer — was durchgehen muss', () => {
  it('nimmt den exakten Namen', () => {
    expect(check('M. deltoideus', 'M. deltoideus')).toBe('correct');
  });

  it('nimmt den Namen ohne Artikel', () => {
    expect(check('deltoideus', 'M. deltoideus')).toBe('correct');
  });

  it('nimmt „Pars" weg oder mit', () => {
    expect(check('trapezius descendens', 'M. trapezius – Pars descendens')).toBe('correct');
    expect(check('M. trapezius Pars descendens', 'M. trapezius – Pars descendens')).toBe('correct');
  });

  it('nimmt das Synonym aus der Klammer — und den ganzen Namen samt Klammer', () => {
    const expected = 'M. fibularis longus (M. peroneus longus)';
    expect(check('M. peroneus longus', expected)).toBe('correct');
    expect(check('M. fibularis longus', expected)).toBe('correct');
    expect(check(expected, expected)).toBe('correct');
  });

  it('verzeiht einen Tippfehler, korrigiert ihn aber sichtbar', () => {
    const result = checkAnswer('M. flexor digitorm superficialis', {
      nameLatin: 'M. flexor digitorum superficialis',
    }, CORPUS);
    expect(result.verdict).toBe('almost');
    expect(result.matched).toBe('M. flexor digitorum superficialis');
  });

  it('nimmt den deutschen Namen, wo es einen gibt', () => {
    const target = { nameLatin: 'M. deltoideus', nameDE: 'Deltamuskel' };
    expect(checkAnswer('Deltamuskel', target).verdict).toBe('correct');
    expect(checkAnswer('deltamuskl', target).verdict).toBe('almost');
  });
});

describe('checkAnswer — Bedeutungsfehler sind NIE tolerant', () => {
  // Eine Zeile pro Bedeutungspaar (DoD 8a). Alle liegen gefährlich nah beieinander.
  const TRAPS: Array<[dimension: string, typed: string, expected: string, distance: number]> = [
    ['longus/brevis', 'M. flexor digitorum brevis', 'M. flexor digitorum longus', 4],
    ['major/minor', 'M. pectoralis minor', 'M. pectoralis major', 2],
    ['major/medius', 'M. gluteus medius', 'M. gluteus maximus', 4],
    ['medialis/lateralis', 'M. vastus medialis', 'M. vastus lateralis', 4],
    ['superficialis/profundus', 'M. flexor digitorum profundus', 'M. flexor digitorum superficialis', 8],
    ['anterior/posterior', 'M. tibialis posterior', 'M. tibialis anterior', 4],
    ['superior/inferior', 'M. gemellus inferior', 'M. gemellus superior', 2],
    ['internus/externus', 'M. obturatorius externus', 'M. obturatorius internus', 2],
    ['flexor/extensor', 'M. extensor carpi ulnaris', 'M. flexor carpi ulnaris', 4],
    ['abductor/adductor', 'M. adductor pollicis', 'M. abductor pollicis longus', 8],
    ['radialis/ulnaris', 'M. flexor carpi ulnaris', 'M. flexor carpi radialis', 5],
    ['pollicis/hallucis', 'M. flexor hallucis longus', 'M. flexor pollicis longus', 4],
    ['digiti/digitorum', 'M. extensor digiti minimi', 'M. extensor digitorum', 7],
  ];

  it.each(TRAPS)('%s: „%s" gilt nicht als „%s"', (_dimension, typed, expected) => {
    expect(check(typed, expected)).toBe('wrong');
  });

  it('„major"/„minor" liegen im Toleranzfenster — und werden trotzdem abgelehnt', () => {
    // Genau der Fall, der ohne Bedeutungsprüfung durchginge: Abstand 2, Toleranz 2.
    const typed = normalizeName('M. pectoralis minor');
    const expected = normalizeName('M. pectoralis major');
    expect(levenshtein(typed, expected)).toBeLessThanOrEqual(tolerance(expected.length));
    expect(check('M. pectoralis minor', 'M. pectoralis major')).toBe('wrong');
  });

  it('leere Eingabe ist falsch, nicht „fast"', () => {
    expect(check('   ', 'M. deltoideus')).toBe('wrong');
    expect(check('M.', 'M. deltoideus')).toBe('wrong');
  });
});

describe('checkAnswer — die Toleranz darf nicht raten', () => {
  it('winkt keinen fremden Muskel durch, nur weil er nah liegt', () => {
    // Um das Zungenbein liegen sieben Namen im Abstand von zwei Zeichen.
    expect(check('M. stylohyoideus', 'M. mylohyoideus')).toBe('wrong');
    expect(check('M. sternothyroideus', 'M. sternohyoideus')).toBe('wrong');
  });

  it('ohne Namensraum ist die Prüfung nur so scharf wie das Ziel', () => {
    // Dokumentiert, warum das UI den Korpus mitgeben MUSS: „mylohyoideus" liegt zwei
    // Zeichen neben „stylohyoideus" und ginge sonst als Tippfehler durch.
    const target = { nameLatin: 'M. stylohyoideus' };
    expect(checkAnswer('M. mylohyoideus', target).verdict).toBe('almost');
    expect(checkAnswer('M. mylohyoideus', target, CORPUS).verdict).toBe('wrong');
  });
});

/* Der Härtetest: nicht an Beispielen, sondern am ganzen echten Datensatz. */
describe('checkAnswer gegen alle 150 Muskeln', () => {
  it('akzeptiert jeden Muskel unter seinem eigenen Namen', () => {
    const failed = CORPUS.filter(
      (target) => checkAnswer(target.nameLatin, target, CORPUS).verdict !== 'correct',
    ).map((t) => t.nameLatin);
    expect(failed).toEqual([]);
  });

  it('lässt keinen fremden Muskelnamen als Antwort durchgehen (False-Positive-Test)', () => {
    const leaks: string[] = [];
    for (const target of CORPUS) {
      for (const other of CORPUS) {
        // Namensdubletten (Hand/Fuß) sind laut ADR 0002 §2 dieselbe Karte.
        if (normalizeName(other.nameLatin) === normalizeName(target.nameLatin)) continue;
        if (checkAnswer(other.nameLatin, target, CORPUS).verdict !== 'wrong') {
          leaks.push(`${other.nameLatin} → ${target.nameLatin}`);
        }
      }
    }
    expect(leaks).toEqual([]);
  });
});
