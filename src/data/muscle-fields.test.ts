/* =========================================================================
   Haelt die DREI Anzeigen gegen die eine Reihenfolge.
   src/data/muscle-fields.test.ts

   Der Fehler, der hier aussterben soll: Detailseite, Lernkarten-Rueckseite und
   Quiz-Vergleichskarte hatten je eine eigene Feldliste — drei Reihenfolgen fuer
   dieselben fuenf Felder. Jede fuer sich war plausibel, keine fiel je auf, weil
   kein Test zwei davon nebeneinander stellte. Genau das tut dieser hier.
   ========================================================================= */

import { describe, expect, it } from 'vitest';
import { getMuscles } from '.';
import { FACHFELDER, fachfelder, folgtReihenfolge, UNGEPRUEFT_MARKE } from './muscle-fields';
import { facts } from '../components/features/flashcards/facts';

const KANON = ['Ursprung', 'Ansatz', 'Funktion', 'Innervation', 'Segmente'];

describe('muscle-fields — die kanonische Reihenfolge', () => {
  it('ist Ursprung → Ansatz → Funktion → Innervation → Segmente', () => {
    /* Absichtlich als Literal: Diese Zeile ist die Zusicherung selbst. Leitete
       sie sich aus FACHFELDER ab, wuerde sie jede Umsortierung mitmachen und
       nichts pruefen. */
    expect(FACHFELDER.map((f) => f.label)).toEqual(KANON);
  });

  it('liest die Werte aus dem uebergebenen Objekt, nicht aus einem Muskel-Global', () => {
    const felder = fachfelder({
      origin: 'U', insertion: 'A', functionDescription: 'F', innervation: 'I', segments: 'S',
    });
    expect(felder.map((f) => f.value)).toEqual(['U', 'A', 'F', 'I', 'S']);
    expect(felder.map((f) => f.key)).toEqual(
      ['origin', 'insertion', 'functionDescription', 'innervation', 'segments'],
    );
  });

  it('setzt den Stern nur an die Segmente und nur auf Verlangen', () => {
    const leer = { origin: '', insertion: '', functionDescription: '', innervation: '', segments: 'C5' };
    expect(fachfelder(leer, false).map((f) => f.label)).toEqual(KANON);
    const mit = fachfelder(leer, true).map((f) => f.label);
    expect(mit).toEqual(['Ursprung', 'Ansatz', 'Funktion', 'Innervation', `Segmente${UNGEPRUEFT_MARKE}`]);
  });
});

describe('folgtReihenfolge — der Waechter selbst', () => {
  it('nimmt die volle Reihenfolge an', () => {
    expect(folgtReihenfolge(KANON)).toBe(true);
  });

  it('nimmt Luecken an (leere Felder verschwinden in der Anzeige)', () => {
    expect(folgtReihenfolge(['Ursprung', 'Funktion', 'Segmente'])).toBe(true);
    expect(folgtReihenfolge([])).toBe(true);
  });

  it('nimmt fremde Felder an, egal wo sie stehen', () => {
    expect(folgtReihenfolge(['Ursprung', 'Ansatz', 'Funktion', 'Innervation', 'Lage'])).toBe(true);
    expect(folgtReihenfolge(['Gelenke', 'Ursprung', 'TA-Code', 'Ansatz'])).toBe(true);
  });

  it('nimmt das Sternchen-Label an', () => {
    expect(folgtReihenfolge(['Innervation', `Segmente${UNGEPRUEFT_MARKE}`])).toBe(true);
  });

  /* Ohne diese beiden Zeilen wuerde `folgtReihenfolge` auch alles annehmen. */
  it('LEHNT vertauschte Fachfelder ab', () => {
    expect(folgtReihenfolge(['Ansatz', 'Ursprung'])).toBe(false);
    expect(folgtReihenfolge(['Funktion', 'Innervation', 'Segmente', 'Ursprung', 'Ansatz'])).toBe(false);
  });

  it('LEHNT die alte Lernkarten-Reihenfolge ab (der behobene Fehler)', () => {
    expect(folgtReihenfolge(['Funktion', 'Ursprung', 'Ansatz', 'Innervation'])).toBe(false);
  });
});

describe('die Anzeigen halten sich daran — gegen den ECHTEN Bestand', () => {
  it('Lernkarten-Rueckseite: jeder der 150 Muskeln in kanonischer Reihenfolge', () => {
    for (const muscle of getMuscles()) {
      const labels = facts(muscle).map((f) => f.label);
      expect(folgtReihenfolge(labels), `${muscle.nameLatin}: ${labels.join(' · ')}`).toBe(true);
    }
  });

  it('Lernkarte zeigt Ursprung vor Funktion — nicht mehr umgekehrt', () => {
    const mitAllem = getMuscles().find((m) => m.origin && m.functionDescription);
    const labels = facts(mitAllem!).map((f) => f.label);
    expect(labels.indexOf('Ursprung')).toBeLessThan(labels.indexOf('Funktion'));
  });
});
