import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  composeEtymology,
  decomposeName,
  readEtymologySource,
  tokenizeName,
  withEtymology,
  type EtymologySource,
} from './etymology';
import { getMuscles } from './loader';
import type { Muscle } from '../types';

const LEXIKON = { flexor: 'Beuger', digitorum: 'der Finger', longus: 'lang' };
const SOURCE: EtymologySource = { lexikon: LEXIKON, muskeln: {} };

/* Der Loader hat den echten Muskeln die Herleitung schon angehängt — für den Test
   des Merges brauchen wir sie roh, sonst prüfen wir nur unsere eigene Vorarbeit. */
const { etymology: _e, ...ROH } = getMuscles()[0];

function muscleNamed(nameLatin: string): Muscle {
  return { ...ROH, nameLatin };
}

describe('tokenizeName', () => {
  it('wirft „M." und „Mm." weg, behält aber „Pars" und „Caput" — die tragen Bedeutung', () => {
    expect(tokenizeName('M. flexor digitorum longus')).toEqual(['flexor', 'digitorum', 'longus']);
    expect(tokenizeName('M. triceps brachii – Caput longum')).toEqual([
      'triceps',
      'brachii',
      'caput',
      'longum',
    ]);
    expect(tokenizeName('Mm. lumbricales I–IV')).toEqual(['lumbricales', 'i', 'iv']);
  });
});

describe('decomposeName', () => {
  it('findet die bekannten Bausteine in ihrer Reihenfolge', () => {
    expect(decomposeName('M. flexor digitorum longus', LEXIKON)).toEqual([
      { word: 'flexor', meaning: 'Beuger' },
      { word: 'digitorum', meaning: 'der Finger' },
      { word: 'longus', meaning: 'lang' },
    ]);
  });

  it('lässt Unbekanntes weg, statt zu raten', () => {
    // „peroneus" steht nicht im Test-Lexikon → es taucht in der Herleitung nicht auf.
    const parts = decomposeName('M. peroneus longus', LEXIKON);
    expect(parts).toEqual([{ word: 'longus', meaning: 'lang' }]);
  });

  it('ist bei einem völlig unbekannten Namen leer, nicht falsch', () => {
    expect(decomposeName('M. subclavius', LEXIKON)).toEqual([]);
    expect(composeEtymology([])).toBeNull();
  });
});

describe('withEtymology — der Merge des Loaders', () => {
  it('Muskel MIT Bausteinen bekommt eine Herleitung', () => {
    const result = withEtymology(muscleNamed('M. flexor digitorum longus'), SOURCE);
    expect(result.etymology).toBe('flexor = Beuger · digitorum = der Finger · longus = lang');
  });

  it('Muskel OHNE Eintrag bleibt unverändert — kein leerer Kasten', () => {
    const muscle = muscleNamed('M. subclavius');
    const result = withEtymology(muscle, SOURCE);
    expect(result).toBe(muscle); // identisch, nicht nur gleich
    expect(result.etymology).toBeUndefined();
  });

  it('eine leere redaktionelle Datei ändert gar nichts', () => {
    const empty: EtymologySource = { lexikon: {}, muskeln: {} };
    const muscle = muscleNamed('M. flexor digitorum longus');
    expect(withEtymology(muscle, empty)).toBe(muscle);
  });

  it('ein handgeschriebener Text schlägt die Komposition', () => {
    const source: EtymologySource = {
      lexikon: LEXIKON,
      muskeln: { 'M. flexor digitorum longus': { etymologie: 'Von Hand.' } },
    };
    const result = withEtymology(muscleNamed('M. flexor digitorum longus'), source);
    expect(result.etymology).toBe('Von Hand.');
  });

  it('verträgt eine kaputte Datei, ohne die App mitzureißen', () => {
    const broken = readEtymologySource({ lexikon: 'kein Objekt', muskeln: null });
    expect(broken).toEqual({ lexikon: {}, muskeln: {} });
    expect(readEtymologySource(null)).toEqual({ lexikon: {}, muskeln: {} });
  });
});

describe('Der echte Datenbestand', () => {
  it('jeder der 150 Muskeln hat eine Herleitung', () => {
    const ohne = getMuscles().filter((m) => !m.etymology);
    expect(ohne.map((m) => m.nameLatin)).toEqual([]);
  });

  it('keine Herleitung enthält ASCII-Umschrift statt Umlauten', () => {
    // „zum Gesaess gehoerig" darf keiner Schülerin unter die Augen kommen.
    const schlecht = getMuscles().filter((m) => /ae|oe|ue|ss(?![a-z]*ß)/i.test(m.etymology ?? ''));
    const verdaechtig = schlecht.filter((m) => /gehoerig|Gesaess|groess|saege|fuer\b|wuerde/i.test(m.etymology ?? ''));
    expect(verdaechtig.map((m) => m.etymology)).toEqual([]);
  });
});

/* ⚠️ Die Falle aus dem Rahmen-Briefing — als Test, nicht als Kommentar. */
describe('Die redaktionellen Daten überleben eine Neu-Migration', () => {
  it('liegen NICHT in src/data/generated/ (das schreibt migrate:data neu)', () => {
    const script = readFileSync('scripts/migrate-v1-data.mjs', 'utf8');
    // Das Skript erzeugt genau diesen Ordner neu …
    expect(script).toContain('src/data/generated');
    // … und die redaktionelle Datei liegt bewusst woanders.
    expect(() => readFileSync('src/data/editorial/etymology.json', 'utf8')).not.toThrow();
    expect(script).not.toContain('editorial');
  });
});
