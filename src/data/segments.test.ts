/* Segmente: die Nachtragsebene und ihre Dateninvarianten.
   Die Invarianten laufen gegen den ECHTEN Bestand (`getMuscles()`) — Fixtures sind
   per Konstruktion sauber und würden genau die Datenfehler verstecken, um die es
   hier geht (siehe `docs/pruefstrategie.md`). */

import { describe, expect, it } from 'vitest';
import editorial from './editorial/segments.json';
import { getMuscles } from './loader';
import {
  SegmentsDataError,
  assertSegments,
  hirnnervMitSegmenten,
  istHirnnervOhneSpinalenAnteil,
  readSegmentsSource,
  segmentGaps,
  ungepruefteSegmente,
  unklassifizierteLuecken,
  withSegments,
} from './segments';
import type { Muscle } from '../types';

const muskel = (over: Partial<Muscle> = {}): Muscle => ({
  id: 'test', nameLatin: 'M. test', region: 'upper', subregion: 'Test',
  joints: [], origin: 'U', insertion: 'A', functions: [], functionDescription: 'F',
  innervation: 'N. test', segments: '', difficulty: 1, images: [], tags: [],
  ...over,
} as Muscle);

describe('readSegmentsSource', () => {
  it('nimmt nur Einträge mit gültigem Status', () => {
    const q = readSegmentsSource({
      muskeln: {
        a: { status: 'offen', segments: 'C5, C6', quelle: 'Buch' },
        b: { status: 'quatsch', segments: 'C7' },
        c: 'kein Objekt',
      },
    });
    expect(Object.keys(q.muskeln)).toEqual(['a']);
  });

  it('überlebt kaputte Struktur', () => {
    expect(readSegmentsSource(null).muskeln).toEqual({});
    expect(readSegmentsSource({ muskeln: 42 }).muskeln).toEqual({});
  });
});

describe('assertSegments', () => {
  it('lässt einen unbekannten Muskel scheitern', () => {
    const q = readSegmentsSource({ muskeln: { gibtsnicht: { status: 'offen', segments: '', quelle: '' } } });
    expect(() => assertSegments(q, new Set(['anconeus']))).toThrow(SegmentsDataError);
  });

  it('lässt einen Wert bei Status "entfaellt" scheitern', () => {
    /* Das ist der Reflex, den die Prüfung abfangen soll: M. masseter hat keine
       Segmente, und wer dort etwas einträgt, erfindet Anatomie. */
    const q = readSegmentsSource({ muskeln: { masseter: { status: 'entfaellt', segments: 'C5', quelle: 'x' } } });
    expect(() => assertSegments(q, new Set(['masseter']))).toThrow(/entfaellt/);
  });

  it('lässt einen Wert ohne Quelle scheitern', () => {
    const q = readSegmentsSource({ muskeln: { soleus: { status: 'offen', segments: 'L5, S1', quelle: '' } } });
    expect(() => assertSegments(q, new Set(['soleus']))).toThrow(/quelle/);
  });

  it('lässt "ungeprueft" ohne Wert scheitern', () => {
    /* Ein ungeprüfter Eintrag ohne Wert ist bloss „offen" — der Status würde über den
       Bearbeitungsstand lügen und der Stern erschiene nirgends. */
    const q = readSegmentsSource({ muskeln: { soleus: { status: 'ungeprueft', segments: '', quelle: 'x' } } });
    expect(() => assertSegments(q, new Set(['soleus']))).toThrow(/ungeprueft/);
  });

  it('nimmt einen belegten Nachtrag an', () => {
    const q = readSegmentsSource({ muskeln: { soleus: { status: 'offen', segments: 'L5, S1', quelle: 'Prometheus S. 1' } } });
    expect(() => assertSegments(q, new Set(['soleus']))).not.toThrow();
  });
});

describe('withSegments', () => {
  it('mischt den nachgetragenen Wert dazu', () => {
    const q = readSegmentsSource({ muskeln: { test: { status: 'offen', segments: 'L5, S1', quelle: 'Buch' } } });
    expect(withSegments(muskel(), q).segments).toBe('L5, S1');
  });

  it('lässt den Muskel unverändert, wenn der Nachtrag leer ist', () => {
    const q = readSegmentsSource({ muskeln: { test: { status: 'offen', segments: '', quelle: '' } } });
    expect(withSegments(muskel({ segments: 'C7' }), q).segments).toBe('C7');
  });

  it('lässt den Muskel unverändert, wenn es keinen Eintrag gibt', () => {
    expect(withSegments(muskel({ segments: 'C7' }), { muskeln: {} }).segments).toBe('C7');
  });

  it('markiert einen ungeprüften Wert', () => {
    const q = readSegmentsSource({
      muskeln: { test: { status: 'ungeprueft', segments: 'L5, S1', quelle: 'Wikipedia' } },
    });
    const m = withSegments(muskel(), q);
    expect(m.segments).toBe('L5, S1');
    expect(m.segmentsUngeprueft).toBe(true);
  });

  it('markiert einen belegten Wert NICHT', () => {
    const q = readSegmentsSource({
      muskeln: { test: { status: 'offen', segments: 'L5, S1', quelle: 'Prometheus S. 1' } },
    });
    expect(withSegments(muskel(), q).segmentsUngeprueft).toBeUndefined();
  });
});

describe('istHirnnervOhneSpinalenAnteil', () => {
  it('erkennt die Kau- und Mimikmuskulatur', () => {
    expect(istHirnnervOhneSpinalenAnteil('N. massetericus (V3, N. trigeminus)')).toBe(true);
    expect(istHirnnervOhneSpinalenAnteil('N. facialis (VII), Ramus colli')).toBe(true);
  });

  it('nimmt Nerven mit spinalem Anteil aus', () => {
    /* Trapezius und M. thyrohyoideus haben sehr wohl C-Segmente. */
    expect(istHirnnervOhneSpinalenAnteil('N. accessorius (XI), Plexus cervicalis')).toBe(false);
    expect(istHirnnervOhneSpinalenAnteil('R. thyrohyoideus (aus C1 über N. hypoglossus XII)')).toBe(false);
    expect(istHirnnervOhneSpinalenAnteil('N. radialis')).toBe(false);
  });
});

describe('Dateninvarianten — echter Bestand', () => {
  const muscles = getMuscles();

  it('kein Muskel am reinen Hirnnerv trägt Segmente', () => {
    expect(hirnnervMitSegmenten(muscles)).toEqual([]);
  });

  it('jede Segment-Lücke ist in segments.json klassifiziert', () => {
    /* Ohne diese Prüfung rutscht ein neuer Muskel mit leerem Feld unbemerkt durch
       und niemand weiss, ob der Wert fehlt oder nicht existiert. */
    expect(unklassifizierteLuecken(muscles)).toEqual([]);
  });

  it('jeder nachgetragene Wert kommt im Bestand an', () => {
    /* Vorerst leer — die Prüfung greift ab dem ersten eingetragenen Wert und
       stellt sicher, dass der Loader ihn wirklich durchreicht. */
    const quelle = readSegmentsSource(editorial);
    const nachgetragen = Object.entries(quelle.muskeln).filter(([, e]) => e.segments !== '');
    for (const [id, eintrag] of nachgetragen) {
      expect(muscles.find((m) => m.id === id)?.segments).toBe(eintrag.segments);
    }
  });

  it('die Nachtragsdatei deckt genau die Lücken ab', () => {
    const gaps = segmentGaps();
    const leer = muscles.filter((m) => m.segments.trim() === '').length;
    /* „entfaellt", „klaeren" und noch nicht getragene „offen" bleiben leer.
       „ungeprueft" hat einen Wert und zaehlt hier nicht mit. */
    expect(gaps.entfaellt + gaps.klaeren + gaps.offen).toBe(leer);
  });

  it('jeder ungeprüfte Wert ist im Bestand sichtbar UND markiert', () => {
    const namen = ungepruefteSegmente();
    expect(namen.length).toBeGreaterThan(0);
    const markiert = muscles.filter((m) => m.segmentsUngeprueft === true);
    expect(markiert).toHaveLength(namen.length);
    /* Ein markierter Muskel ohne Wert waere ein Stern an einer leeren Zeile —
       die Zeile fiele aus der Anzeige, der Hinweis waere unsichtbar. */
    for (const m of markiert) expect(m.segments.trim()).not.toBe('');
  });
});
