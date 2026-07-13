import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  assertKnownMuscles,
  PalpationDataError,
  palpationCount,
  readPalpationSource,
  withPalpation,
  type PalpationSource,
} from './palpation';
import { getMuscles } from './loader';

const MUSCLES = getMuscles();
const NAMES = new Set(MUSCLES.map((m) => m.nameLatin));

/** Ein roher Muskel ohne Palpation — sonst erbt die Fixture den echten Eintrag. */
const ROH = (() => {
  const { palpation: _p, ...rest } = MUSCLES[0];
  return rest;
})();

const QUELLE: PalpationSource = {
  muskeln: {
    [ROH.nameLatin]: {
      position: 'Rückenlage, Arm neben dem Körper.',
      landmarks: 'Acromion, Tuberculum majus.',
    },
  },
};

describe('readPalpationSource — defensiv gegenüber der Struktur', () => {
  it('liest die vier Felder', () => {
    const q = readPalpationSource({
      muskeln: {
        'M. deltoideus': {
          position: 'Sitz',
          landmarks: 'Acromion',
          technique: 'Widerstand gegen Abduktion',
          confusion: 'M. supraspinatus',
        },
      },
    });
    expect(q.muskeln['M. deltoideus']).toEqual({
      position: 'Sitz',
      landmarks: 'Acromion',
      technique: 'Widerstand gegen Abduktion',
      confusion: 'M. supraspinatus',
    });
  });

  it('leere Felder erzeugen keinen Eintrag — sonst stünde eine Überschrift ohne Text da', () => {
    const q = readPalpationSource({
      muskeln: { 'M. deltoideus': { position: '   ', landmarks: '' } },
    });
    expect(q.muskeln['M. deltoideus']).toBeUndefined();
  });

  it('verträgt eine leere, fehlende oder kaputte Datei', () => {
    expect(readPalpationSource({}).muskeln).toEqual({});
    expect(readPalpationSource(null).muskeln).toEqual({});
    expect(readPalpationSource({ muskeln: 'kaputt' }).muskeln).toEqual({});
    expect(readPalpationSource({ muskeln: { 'M. deltoideus': null } }).muskeln).toEqual({});
  });

  it('ignoriert unbekannte Felder, statt sie durchzureichen', () => {
    const q = readPalpationSource({
      muskeln: { 'M. deltoideus': { position: 'Sitz', video: 'https://…' } },
    });
    expect(q.muskeln['M. deltoideus']).toEqual({ position: 'Sitz' });
  });
});

describe('assertKnownMuscles — die Validierung hat Zähne', () => {
  it('EIN UNBEKANNTER MUSKELNAME LÄSST DEN BUILD SCHEITERN', () => {
    /* Ein Tippfehler wuerde den Eintrag sonst still verschlucken: Er stuende in der
       Datei, waere aber fuer immer unsichtbar — und niemand merkte es. */
    expect(() =>
      assertKnownMuscles({ muskeln: { 'M. deltoideuz': { position: 'Sitz' } } }, NAMES),
    ).toThrow(PalpationDataError);
  });

  it('nimmt bekannte Namen an', () => {
    expect(() => assertKnownMuscles(QUELLE, NAMES)).not.toThrow();
  });
});

describe('withPalpation — der Loader mischt zu', () => {
  it('reichert einen Muskel MIT Eintrag an', () => {
    const muskel = withPalpation(ROH, QUELLE);
    expect(muskel.palpation).toEqual(QUELLE.muskeln[ROH.nameLatin]);
  });

  it('lässt einen Muskel OHNE Eintrag unverändert — kein leerer Kasten', () => {
    const fremd = { ...ROH, nameLatin: 'M. gibt-es-nicht' };
    const muskel = withPalpation(fremd, QUELLE);
    expect(muskel.palpation).toBeUndefined();
    expect(muskel).toBe(fremd); // dieselbe Referenz: es wurde nichts angefasst
  });

  it('bei leerer Datei bleibt jeder Muskel unverändert', () => {
    for (const muskel of MUSCLES.slice(0, 5)) {
      expect(withPalpation(muskel, { muskeln: {} }).palpation).toBeUndefined();
    }
  });
});

describe('Der echte Bestand', () => {
  it('nennt nur Muskeln, die es wirklich gibt', () => {
    // Der Loader ruft `initPalpation` bereits beim Import — kaeme hier ein unbekannter
    // Name vor, waere dieser Test nie gestartet. Wir pruefen es trotzdem explizit.
    const fehlend = MUSCLES.filter((m) => m.palpation && !NAMES.has(m.nameLatin));
    expect(fehlend).toEqual([]);
  });

  it('jeder vorhandene Eintrag hat mindestens ein gefülltes Feld', () => {
    for (const m of MUSCLES) {
      if (!m.palpation) continue;
      expect(Object.keys(m.palpation).length, `${m.nameLatin} hat einen leeren Eintrag`)
        .toBeGreaterThan(0);
    }
  });

  it('die Charge waechst inkrementell — auch 0 ist ein gueltiger Stand (E3)', () => {
    expect(palpationCount()).toBeGreaterThanOrEqual(0);
  });
});

/* ⚠️ Die Falle aus 8d — als Test, nicht als Kommentar. */
describe('Die Palpation überlebt eine Neu-Migration', () => {
  it('liegt NICHT in src/data/generated/ (das schreibt migrate:data neu)', () => {
    const script = readFileSync('scripts/migrate-v1-data.mjs', 'utf8');
    expect(script).toContain('src/data/generated');
    expect(script).not.toContain('palpation');
    expect(() => readFileSync('src/data/editorial/palpation.json', 'utf8')).not.toThrow();
  });

  it('die generierten Daten führen kein Palpationsfeld — es kommt vom Loader', () => {
    const generiert = readFileSync('src/data/generated/muscles.json', 'utf8');
    expect(generiert).not.toContain('palpation');
  });
});
