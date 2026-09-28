import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  assertFunktionKurz,
  FunktionKurzDataError,
  funktionAnzeige,
  funktionKurzText,
  funktionsLuecken,
  ortLabel,
  readFunktionKurzSource,
  withFunktionKurz,
  type FunktionKurzSource,
} from './funktion-kurz';
import { getMuscles } from './loader';
import { facts } from '../components/features/flashcards/facts';
import type { Muscle } from '../types';

const MUSCLES = getMuscles();
const ROH = JSON.parse(readFileSync('src/data/editorial/funktion-kurz.json', 'utf8')) as unknown;
const ECHT = readFunktionKurzSource(ROH);

/** Die echte Quelle ohne einen Eintrag — fuer die Gegenprobe der Regeln. */
function ohne(id: string): FunktionKurzSource {
  const { [id]: _weg, ...rest } = ECHT.muskeln;
  return { muskeln: rest };
}

describe('readFunktionKurzSource — defensiv gegenüber der Struktur', () => {
  it('liest Zeilen mit Orten und Bewegungen', () => {
    const q = readFunktionKurzSource({
      muskeln: {
        x: {
          nameLatin: 'M. x',
          status: 'geprueft',
          zeilen: [{ orte: ['Art. coxae'], bewegungen: [' Extension ', 'Außenrotation'] }],
        },
      },
    });
    expect(q.muskeln.x).toEqual({
      nameLatin: 'M. x',
      status: 'geprueft',
      zeilen: [{ orte: ['Art. coxae'], bewegungen: ['Extension', 'Außenrotation'] }],
    });
  });

  it('eine Zeile ohne Bewegung fällt weg, ein Eintrag ohne Zeile ebenso', () => {
    const q = readFunktionKurzSource({
      muskeln: {
        leer: { nameLatin: 'M. leer', zeilen: [{ orte: ['Art. coxae'], bewegungen: ['  '] }] },
      },
    });
    expect(q.muskeln.leer).toBeUndefined();
  });

  it('ein unbekannter Status gilt als ungeprüft — im Zweifel steht der Stern da', () => {
    const q = readFunktionKurzSource({
      muskeln: { x: { nameLatin: 'M. x', status: 'fertig', zeilen: [{ orte: [], bewegungen: ['a'] }] } },
    });
    expect(q.muskeln.x.status).toBe('ungeprueft');
  });

  it('verträgt eine leere, fehlende oder kaputte Datei', () => {
    expect(readFunktionKurzSource({}).muskeln).toEqual({});
    expect(readFunktionKurzSource(null).muskeln).toEqual({});
    expect(readFunktionKurzSource({ muskeln: 'kaputt' }).muskeln).toEqual({});
  });
});

describe('assertFunktionKurz — gegen den echten Bestand', () => {
  it('die eingecheckte Datei besteht', () => {
    expect(() => assertFunktionKurz(MUSCLES, ECHT)).not.toThrow();
  });

  it('eine id, die es nicht gibt, lässt den Build scheitern', () => {
    const q: FunktionKurzSource = {
      muskeln: { ...ECHT.muskeln, erfunden: { nameLatin: 'M. erfunden', status: 'ungeprueft', zeilen: [{ orte: [], bewegungen: ['a'] }] } },
    };
    expect(() => assertFunktionKurz(MUSCLES, q)).toThrow(FunktionKurzDataError);
  });

  it('passt nameLatin nicht zur id, scheitert der Build — die Kurzform hinge am falschen Muskel', () => {
    const q: FunktionKurzSource = {
      muskeln: { ...ECHT.muskeln, soleus: { ...ECHT.muskeln.soleus, nameLatin: 'M. gastrocnemius' } },
    };
    expect(() => assertFunktionKurz(MUSCLES, q)).toThrow(/nameLatin/);
  });

  it('ein Muskel mit Funktionstext, aber ohne Kurzform, lässt den Build scheitern', () => {
    /* Sonst stuende im Quiz eine lange Textoption zwischen drei kurzen — und verriete
       allein durch ihre Laenge die Antwort. */
    expect(() => assertFunktionKurz(MUSCLES, ohne('soleus'))).toThrow(/ohne Kurzform.*soleus/);
  });
});

describe('Kurzform im geladenen Bestand', () => {
  it('jeder Muskel mit Funktionstext trägt eine Kurzform', () => {
    const ohneKurz = MUSCLES.filter((m) => m.functionDescription.trim() && !m.funktionKurz?.length);
    expect(ohneKurz.map((m) => m.id)).toEqual([]);
  });

  it('die beiden Datensätze von M. nasalis haben verschiedene Kurzformen (Schlüssel ist die id)', () => {
    const nasalis = MUSCLES.filter((m) => m.nameLatin === 'M. nasalis').map(funktionAnzeige);
    expect(nasalis).toHaveLength(2);
    expect(new Set(nasalis).size).toBe(2);
  });

  /* Der Fehler, den die Kurzform nebenbei behebt: Auf der Freitext-Stufe (Fach 7) zeigt die
     Karte die Fakten und fragt nach dem Namen. 31 lange Funktionstexte nennen den Muskel
     selbst („Der M. masseter ist der kräftigste Kaumuskel …") — die Antwort stand auf der
     Frage. Gegengetestet: `fachfelder` wieder auf `functionDescription` ⇒ dieser Test faellt. */
  /* Nur die Funktion: Ursprung und Innervation nennen den Namen manchmal aus der Anatomie
     selbst („N. subclavius", „Fossa subscapularis") — das ist kein Formulierungsfehler. */
  it('die Funktion auf der Karte nennt den eigenen Muskel nicht (Freitext-Stufe fragt genau danach)', () => {
    const verraten: string[] = [];
    for (const m of MUSCLES) {
      const kern = m.nameLatin
        .replace(/^(Mm?\.)\s+/, '')
        .split(/\s+[–(]/)[0]
        .toLowerCase();
      const funktion = facts(m).find((f) => f.label.startsWith('Funktion'));
      if (funktion?.value.toLowerCase().includes(kern)) verraten.push(m.nameLatin);
    }
    expect(verraten).toEqual([]);
  });
});

describe('Anzeige', () => {
  it('ein Ort bekommt den deutschen Namen, mehrere bleiben bei ihren Etiketten', () => {
    expect(ortLabel(['Art. coxae'])).toBe('Hüftgelenk (Art. coxae)');
    expect(ortLabel(['Kiefergelenk'])).toBe('Kiefergelenk');
    expect(ortLabel(['MCP', 'PIP', 'DIP'])).toBe('MCP + PIP + DIP');
  });

  it('eine Zeile je Ort; ohne Ort nur die Bewegungen', () => {
    expect(funktionKurzText([
      { orte: ['Art. coxae'], bewegungen: ['Extension'] },
      { orte: ['Art. genus'], bewegungen: ['Flexion', 'Innenrotation'] },
    ])).toBe('Hüftgelenk (Art. coxae): Extension\nKniegelenk (Art. genus): Flexion · Innenrotation');
    expect(funktionKurzText([{ orte: [], bewegungen: ['spannt die Haut'] }])).toBe('spannt die Haut');
  });

  it('ohne Kurzform bleibt es beim Text', () => {
    const m = { functionDescription: 'Beugt.', funktionKurz: undefined };
    expect(funktionAnzeige(m)).toBe('Beugt.');
  });

  it('withFunktionKurz setzt die Marke nach dem Status', () => {
    const roh = { ...MUSCLES.find((m) => m.id === 'soleus')! } as Muscle;
    const q = (status: 'ungeprueft' | 'geprueft'): FunktionKurzSource => ({
      muskeln: { soleus: { ...ECHT.muskeln.soleus, status } },
    });
    expect(withFunktionKurz(roh, q('ungeprueft')).funktionKurzUngeprueft).toBe(true);
    expect(withFunktionKurz(roh, q('geprueft')).funktionKurzUngeprueft).toBe(false);
  });
});

describe('funktionsLuecken — der Hinweis fuer den Fachmann', () => {
  it('meldet Gelenke ohne Zeile und Orte ausserhalb von joints', () => {
    expect(funktionsLuecken({
      joints: ['Art. cubiti', 'Art. manus'],
      funktionKurz: [{ orte: ['Art. manus'], bewegungen: ['Palmarflexion'] }, { orte: ['Unterarm'], bewegungen: ['Pronation'] }],
    })).toEqual({ gelenkeOhneZeile: ['Art. cubiti'], orteAusserhalb: ['Unterarm'] });
  });

  it('am echten Bestand: M. flexor carpi radialis — Art. cubiti ohne Zeile, der Text nennt dort nichts', () => {
    const fcr = MUSCLES.find((m) => m.id === 'flexor-carpi-radialis')!;
    expect(funktionsLuecken(fcr).gelenkeOhneZeile).toEqual(['Art. cubiti']);
  });
});

