import { describe, expect, it } from 'vitest';
import {
  CurriculumDataError,
  assertKnownMuscles,
  getSections,
  hasCurriculum,
  readCurriculumSource,
} from './curriculum';
import { getMuscles } from './loader';
import editorial from './editorial/curriculum.json';

const KNOWN = new Set(getMuscles().map((m) => m.nameLatin));

describe('curriculum.json — die ausgelieferte Datei', () => {
  it('IST LEER — und das ist Absicht', () => {
    /* Ein Kursabschnitt ist eine Behauptung darueber, was geprueft wird. Raet die KI ihn,
       lernt ein Schueler den falschen Stoff fuer die falsche Pruefung. Die Abschnitte kommen
       vom Projektinhaber (docs/curriculum-erfassen.md) — dieselbe Regel wie bei der Palpation,
       deren 21 KI-Vorschlaege er am 2026-07-13 allesamt gestrichen hat.

       Schlaegt dieser Test fehl, weil der PROJEKTINHABER Abschnitte eingetragen hat: gut,
       dann loeschen. Schlaegt er fehl, weil ein AGENT sie erfunden hat: zurueckdrehen. */
    const source = readCurriculumSource(editorial);
    expect(getSections('physio', source)).toEqual([]);
    expect(getSections('ergo', source)).toEqual([]);
    expect(getSections('logo', source)).toEqual([]);
    expect(hasCurriculum('physio', source)).toBe(false);
  });

  it('ihre Muskelnamen existieren alle (leer = trivial wahr, aber der Waechter steht)', () => {
    expect(() => assertKnownMuscles(readCurriculumSource(editorial), KNOWN)).not.toThrow();
  });
});

describe('readCurriculumSource — defensiv gegenüber Struktur', () => {
  it('nimmt Müll ohne zu werfen', () => {
    for (const junk of [null, undefined, 42, 'text', {}, { kurse: null }, { kurse: [] }]) {
      expect(() => readCurriculumSource(junk)).not.toThrow();
      expect(hasCurriculum('physio', readCurriculumSource(junk))).toBe(false);
    }
  });

  it('liest einen vollständigen Abschnitt', () => {
    const source = readCurriculumSource({
      kurse: {
        physio: [{ id: 'kurs-1', label: 'Kurs 1 — Bein', muscles: ['M. soleus', 'M. gracilis'] }],
      },
    });
    expect(getSections('physio', source)).toEqual([
      { id: 'kurs-1', label: 'Kurs 1 — Bein', muscles: ['M. soleus', 'M. gracilis'] },
    ]);
    // Ein anderer Beruf sieht ihn NICHT — Kurs 1 der Logopädie ist nicht Kurs 1 der Physio.
    expect(getSections('logo', source)).toEqual([]);
    expect(getSections(null, source)).toEqual([]);
  });

  it('wirft einen Abschnitt ohne Muskeln weg — er wäre ein toter Knopf', () => {
    const source = readCurriculumSource({
      kurse: { physio: [{ id: 'leer', label: 'Leer', muscles: [] }] },
    });
    expect(getSections('physio', source)).toEqual([]);
  });

  it('wirft einen Abschnitt ohne id oder label weg', () => {
    const source = readCurriculumSource({
      kurse: {
        physio: [
          { label: 'ohne id', muscles: ['M. soleus'] },
          { id: 'ohne-label', muscles: ['M. soleus'] },
          { id: '  ', label: '  ', muscles: ['M. soleus'] },
        ],
      },
    });
    expect(getSections('physio', source)).toEqual([]);
  });

  it('entdoppelt Muskelnamen — zwei gleiche Namen sind EINE Karte (ADR 0002 §2)', () => {
    const source = readCurriculumSource({
      kurse: {
        physio: [
          { id: 'k', label: 'K', muscles: ['M. soleus', 'M. soleus', ' M. soleus ', 'M. gracilis'] },
        ],
      },
    });
    expect(getSections('physio', source)[0].muscles).toEqual(['M. soleus', 'M. gracilis']);
  });

  it('bei doppelter id gewinnt der erste — sonst zwei React-keys und ein mehrdeutiger Link', () => {
    const source = readCurriculumSource({
      kurse: {
        physio: [
          { id: 'k', label: 'Erster', muscles: ['M. soleus'] },
          { id: 'k', label: 'Zweiter', muscles: ['M. gracilis'] },
        ],
      },
    });
    const sections = getSections('physio', source);
    expect(sections).toHaveLength(1);
    expect(sections[0].label).toBe('Erster');
  });
});

describe('assertKnownMuscles — ein Tippfehler bricht den Build', () => {
  it('ein Muskel, den es nicht gibt, wirft', () => {
    const source = readCurriculumSource({
      kurse: { physio: [{ id: 'k', label: 'K', muscles: ['M. erfundeus maximus'] }] },
    });
    expect(() => assertKnownMuscles(source, KNOWN)).toThrow(CurriculumDataError);
    expect(() => assertKnownMuscles(source, KNOWN)).toThrow(/M. erfundeus maximus/);
  });

  it('der Bindestrich-statt-Gedankenstrich-Fehler wird gefangen', () => {
    /* Die Falle aus docs/curriculum-erfassen.md: „M. trapezius - Pars descendens" (-) statt
       „M. trapezius – Pars descendens" (–). Sieht identisch aus, ist ein anderer Name. */
    const source = readCurriculumSource({
      kurse: { physio: [{ id: 'k', label: 'K', muscles: ['M. trapezius - Pars descendens'] }] },
    });
    expect(() => assertKnownMuscles(source, KNOWN)).toThrow(CurriculumDataError);
  });

  it('echte Namen gehen durch', () => {
    const source = readCurriculumSource({
      kurse: { physio: [{ id: 'k', label: 'K', muscles: ['M. soleus', 'M. deltoideus'] }] },
    });
    expect(() => assertKnownMuscles(source, KNOWN)).not.toThrow();
  });
});
