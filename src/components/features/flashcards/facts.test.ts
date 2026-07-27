/* Die Kartenrückseite: welche Fakten erscheinen und wie sie beschriftet sind.
   Die Invariante gegen den echten Bestand steht am Ende — dort entscheidet sich,
   ob der Stern beim Lernenden ankommt. */

import { describe, expect, it } from 'vitest';
import { getMuscles } from '../../../data';
import { UNGEPRUEFT_MARKE, facts } from './facts';
import type { Muscle } from '../../../types';

const muskel = (over: Partial<Muscle> = {}): Muscle => ({
  id: 'test', nameLatin: 'M. test', region: 'upper', subregion: 'Test',
  joints: [], origin: 'Ursprung', insertion: 'Ansatz', functions: [],
  functionDescription: 'Funktion', innervation: 'N. test', segments: 'C5, C6',
  difficulty: 1, images: [], tags: [], ...over,
} as Muscle);

describe('facts', () => {
  it('lässt leere Felder weg', () => {
    const labels = facts(muskel({ segments: '', innervation: '' })).map((f) => f.label);
    expect(labels).toEqual(['Ursprung', 'Ansatz', 'Funktion']);
  });

  it('beschriftet Segmente ohne Marke, solange der Wert belegt ist', () => {
    const segmente = facts(muskel()).find((f) => f.label.startsWith('Segmente'));
    expect(segmente?.label).toBe('Segmente');
  });

  it('hängt die Marke bei einem ungeprüften Wert an das Label', () => {
    /* Am Label, nicht am Wert: ein Stern hinter „C5, C6" liesse sich für einen
       Teil der Segmentangabe lesen. */
    const segmente = facts(muskel({ segmentsUngeprueft: true }))
      .find((f) => f.label.startsWith('Segmente'));
    expect(segmente?.label).toBe(`Segmente${UNGEPRUEFT_MARKE}`);
    expect(segmente?.value).toBe('C5, C6');
  });

  it('markiert nichts, wenn der ungeprüfte Wert leer ist', () => {
    /* Die Zeile fällt ohnehin raus — es darf keine markierte Leerzeile geben. */
    expect(facts(muskel({ segments: '', segmentsUngeprueft: true }))
      .some((f) => f.label.includes(UNGEPRUEFT_MARKE))).toBe(false);
  });
});

describe('facts — echter Bestand', () => {
  it('jeder ungeprüfte Muskel zeigt die Marke auf der Karte', () => {
    const ungeprueft = getMuscles().filter((m) => m.segmentsUngeprueft === true);
    expect(ungeprueft.length).toBeGreaterThan(0);
    for (const m of ungeprueft) {
      const segmente = facts(m).find((f) => f.label.startsWith('Segmente'));
      expect(segmente?.label, m.nameLatin).toBe(`Segmente${UNGEPRUEFT_MARKE}`);
    }
  });

  it('kein geprüfter Muskel zeigt die Marke', () => {
    const geprueft = getMuscles().filter((m) => m.segmentsUngeprueft !== true);
    for (const m of geprueft) {
      expect(facts(m).some((f) => f.label.includes(UNGEPRUEFT_MARKE)), m.nameLatin).toBe(false);
    }
  });
});
