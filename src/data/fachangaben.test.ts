import { describe, expect, it } from 'vitest';
import { getMuscles } from '.';
import { funktionsAbschnitte, ursprungAnsatzAbschnitte } from './fachangaben';
import { fachfelder } from './muscle-fields';
import type { Muscle } from '../types';

const muskel = (id: string): Muscle => getMuscles().find((m) => m.id === id)!;

describe('Fachangaben — einzelne Punkte aus dem echten Bestand', () => {
  it('trennt die vier Ursprünge des Latissimus, lässt die Klammer am Ort', () => {
    expect(ursprungAnsatzAbschnitte(muskel('latissimus-dorsi').origin)).toEqual([
      { eintraege: [
        'Procc. spinosi Th7–Th12', 'Fascia thoracolumbalis',
        'Crista iliaca (hinterer Teil)', '10.–12. Rippe',
      ] },
    ]);
  });

  it('trennt beide Bizeps-Köpfe und beide Ansätze in Fachlich und Einfach', () => {
    const m = muskel('biceps-brachii');
    for (const quelle of [m, m.easy!]) {
      expect(ursprungAnsatzAbschnitte(quelle.origin)).toEqual([
        { label: 'Caput longum', eintraege: ['Tuberculum supraglenoidale scapulae und Labrum glenoidale'] },
        { label: 'Caput breve', eintraege: ['Proc. coracoideus scapulae'] },
      ]);
      expect(ursprungAnsatzAbschnitte(quelle.insertion)).toEqual([
        { eintraege: ['Tuberositas radii', 'Lacertus fibrosus / Fascia antebrachii'] },
      ]);
    }
  });

  it('hält mehrere Stellen beim zugehörigen Kopf, auch nach einem Semikolon', () => {
    expect(ursprungAnsatzAbschnitte(muskel('adductor-hallucis').origin)).toEqual([
      { label: 'Caput obliquum', eintraege: [
        'Os metatarsale II–V (Basis)', 'Os cuboideum', 'Os cuneiforme III und Lig. plantare longum',
      ] },
      { label: 'Caput transversum', eintraege: ['Kapsel der Art. MTP II–V und Lig. metatarseum transversum profundum'] },
    ]);
  });

  it('macht Ortszusätze und Nummerierungen nicht zu weiteren Ansatzstellen', () => {
    for (const [id, key] of [
      ['brachialis', 'origin'], ['gluteus-medius', 'origin'], ['gastrocnemius', 'origin'],
      ['subclavius', 'insertion'], ['interossei-palmares-i-iii', 'insertion'],
      ['flexor-digitorum-longus', 'insertion'],
    ] as const) {
      const m = muskel(id);
      const abschnitte = ursprungAnsatzAbschnitte(m[key]);
      expect(abschnitte.map((a) => a.eintraege.length), id).toEqual(id === 'gastrocnemius' ? [1, 1] : [1]);
    }
  });

  it('liest | im einfachen Text, behält Kommata und Trennzeichen in Klammern', () => {
    const m = muskel('sternocleidomastoideus');
    expect(ursprungAnsatzAbschnitte(m.easy!.insertion)).toEqual([
      { eintraege: ['Proc. mastoideus', 'Linea nuchalis superior (lateraler Anteil)'] },
    ]);
    expect(ursprungAnsatzAbschnitte('Ort (Zusatz, weiterer Zusatz; Alternative | Detail): Stelle [a, b]')).toEqual([
      { label: 'Ort (Zusatz, weiterer Zusatz; Alternative | Detail)', eintraege: ['Stelle [a, b]'] },
    ]);
  });

  it('verliert in keinem Ursprung oder Ansatz Text und übernimmt die Listen in die Fachfelder', () => {
    const inhalt = (text: string) => text.replace(/[,;|:\s]/g, '');
    for (const m of getMuscles()) {
      for (const quelle of [m, ...(m.easy ? [m.easy] : [])]) {
        const felder = fachfelder(quelle, false, m);
        for (const key of ['origin', 'insertion'] as const) {
          const feld = felder.find((f) => f.key === key)!;
          expect(feld.value, `${m.id} ${key}`).toBe(quelle[key]);
          expect(feld.abschnitte?.length, `${m.id} ${key}`).toBeGreaterThan(0);
          const text = feld.abschnitte!.map((a) => [a.label ?? '', ...a.eintraege].join(' ')).join(' ');
          expect(inhalt(text), `${m.id} ${key}`).toBe(inhalt(quelle[key]));
          for (const a of feld.abschnitte!) {
            expect(a.eintraege.length, m.id).toBeGreaterThan(0);
            expect(a.eintraege.every((e) => e.trim() !== ''), m.id).toBe(true);
            expect(a.eintraege.every((e) => !/[;|\n\r]/.test(e.replace(/\([^()]*\)/g, ''))), m.id).toBe(true);
          }
        }
      }
    }
  });

  it('liefert jede Bewegung als eigenen Punkt unter ihrem Ort — für alle 150 Muskeln', () => {
    for (const m of getMuscles()) {
      const zeilen = m.funktionKurz!;
      const abschnitte = funktionsAbschnitte(zeilen);
      expect(abschnitte.map((a) => a.eintraege), m.id).toEqual(zeilen.map((z) => z.bewegungen));
      expect(fachfelder(m, false, m)[2].abschnitte, m.id).toEqual(abschnitte);
    }
    const biceps = funktionsAbschnitte(muskel('biceps-brachii').funktionKurz!);
    expect(biceps).toEqual([
      { label: 'Schultergelenk (Art. humeri)', eintraege: ['Flexion', 'Abduktion oder Adduktion (je nach Kopf)'] },
      { label: 'Ellenbogengelenk (Art. cubiti)', eintraege: ['Flexion'] },
      { label: 'Unterarm (Radioulnargelenke)', eintraege: ['Supination'] },
    ]);
  });
});
