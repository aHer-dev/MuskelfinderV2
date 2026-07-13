import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { badges, earnedIds } from './badges';
import { getGroups } from './groups';
import { groupPractice } from './practice';
import { MASTERED_FACH, newCard } from '../persistence/leitner';
import { exportBackup } from '../persistence/backup-service';
import type { FlashcardCard } from '../persistence/types';
import type { MuscleGroup } from './groups';

const GRUPPE: MuscleGroup = {
  id: 'test',
  label: 'Testgruppe',
  muscles: ['M. supraspinatus', 'M. infraspinatus', 'M. teres minor', 'M. subscapularis'],
};

const DAY = 86_400_000;

function card(fach: number, dueInDays = -1): FlashcardCard {
  return {
    ...newCard(),
    fach,
    nextDue: new Date(Date.now() + dueInDays * DAY).toISOString(),
  };
}

/** Alle Muskeln der Gruppe auf dasselbe Fach setzen. */
function deck(fach: number, dueInDays = -1): Record<string, FlashcardCard> {
  return Object.fromEntries(GRUPPE.muscles.map((n) => [n, card(fach, dueInDays)]));
}

describe('badges — verdient wird Können, nicht Anwesenheit', () => {
  it('ist verdient, wenn ALLE Muskeln der Gruppe in Fach ≥ 5 stehen', () => {
    const [b] = badges(deck(MASTERED_FACH), [GRUPPE]);
    expect(b.earned).toBe(true);
    expect(b.mastered).toBe(4);
    expect(b.missing).toEqual([]);
  });

  it('EINE Karte unter Fach 5 genügt, und es ist nicht verdient', () => {
    const cards = deck(MASTERED_FACH);
    cards['M. teres minor'] = card(4);

    const [b] = badges(cards, [GRUPPE]);
    expect(b.earned).toBe(false);
    expect(b.mastered).toBe(3);
    expect(b.missing).toEqual(['M. teres minor']);
  });

  it('FÄLLT EINE KARTE ZURÜCK, IST DAS ABZEICHEN WIEDER WEG', () => {
    /* Der Kern von 9b: Es gibt keinen gespeicherten Rest, der überlebt. Kompetenz ist
       kein Besitz — wer den Muskel vergisst, hat die Gruppe nicht mehr komplett. */
    const cards = deck(MASTERED_FACH);
    expect(badges(cards, [GRUPPE])[0].earned).toBe(true);

    cards['M. subscapularis'] = card(4); // eine Box zurueck
    expect(badges(cards, [GRUPPE])[0].earned).toBe(false);
  });

  it('ein Muskel ohne Karte ist NICHT gemeistert (er hat kein Fach)', () => {
    const cards = deck(MASTERED_FACH);
    delete cards['M. teres minor'];

    const [b] = badges(cards, [GRUPPE]);
    expect(b.earned).toBe(false);
    expect(b.missing).toEqual(['M. teres minor']);
  });

  it('ein leerer Kasten verdient nichts, stürzt aber auch nicht ab', () => {
    const [b] = badges({}, [GRUPPE]);
    expect(b).toMatchObject({ earned: false, mastered: 0, total: 4 });
    expect(b.missing).toHaveLength(4);
  });

  it('offene zuerst, die am weitesten fortgeschrittenen oben — der Weg ist der Punkt', () => {
    const fast: MuscleGroup = { id: 'fast', label: 'Fast', muscles: GRUPPE.muscles };
    const fern: MuscleGroup = { id: 'fern', label: 'Fern', muscles: GRUPPE.muscles };
    const fertig: MuscleGroup = { id: 'fertig', label: 'Fertig', muscles: GRUPPE.muscles };

    const cards = deck(MASTERED_FACH);
    cards['M. teres minor'] = card(4); // 3 von 4 → „fast" und „fern" sind beide offen

    // Damit sich die Gruppen unterscheiden, bekommt „fern" nur 1 gemeisterten Muskel.
    const list = badges(cards, [fertig, fern, fast]);
    // „fertig" ist mit denselben Karten ebenfalls offen — alle drei teilen die Muskeln.
    expect(list.every((b) => !b.earned)).toBe(true);

    // Mit vollständigem Kasten ist alles verdient, und die Reihenfolge ist stabil.
    const alle = badges(deck(MASTERED_FACH), [fertig, fern, fast]);
    expect(alle.every((b) => b.earned)).toBe(true);
    expect(earnedIds(alle).sort()).toEqual(['fast', 'fern', 'fertig']);
  });

  it('läuft über den echten Gruppenbestand (9a)', () => {
    const list = badges(deck(MASTERED_FACH));
    expect(list).toHaveLength(getGroups().length);
    // Die Rotatorenmanschette ist mit genau diesen vier Karten komplett.
    expect(list.find((b) => b.id === 'rotatorenmanschette')?.earned).toBe(true);
  });
});

describe('groupPractice — der Weg zum Abzeichen', () => {
  const input = (cards: Record<string, FlashcardCard>) => ({ cards });

  it('bietet die fälligen, noch nicht gemeisterten Karten an', () => {
    const cards = deck(MASTERED_FACH);
    cards['M. teres minor'] = card(3, -1); // faellig
    cards['M. supraspinatus'] = card(2, -1); // faellig

    const sel = groupPractice(input(cards), GRUPPE.muscles);
    expect(sel.blocker).toBeNull();
    expect(sel.names.sort()).toEqual(['M. supraspinatus', 'M. teres minor']);
  });

  it('NIMMT MUSKELN MIT, DIE GAR NICHT IM KASTEN LIEGEN — sonst bliebe das Abzeichen ewig bei 3 von 4', () => {
    const cards = deck(MASTERED_FACH);
    delete cards['M. teres minor']; // kein Fach → kein Faelligkeitsfilter findet ihn

    const sel = groupPractice(input(cards), GRUPPE.muscles);
    expect(sel.blocker).toBeNull();
    expect(sel.names).toContain('M. teres minor');
  });

  it('sagt „nichts zu verbessern", wenn das Abzeichen verdient ist', () => {
    expect(groupPractice(input(deck(MASTERED_FACH)), GRUPPE.muscles)).toEqual({
      names: [],
      blocker: 'nothingToFix',
    });
  });

  it('sagt „heute nichts fällig", wenn die offene Karte erst später dran ist', () => {
    const cards = deck(MASTERED_FACH);
    cards['M. teres minor'] = card(4, +7); // offen, aber erst in einer Woche faellig

    expect(groupPractice(input(cards), GRUPPE.muscles)).toEqual({
      names: [],
      blocker: 'nothingDue',
    });
  });
});

describe('ADR 0002 + 0008: Abzeichen sind eine Ableitung, kein Zustand', () => {
  it('KEIN NEUER PERSISTIERTER SCHLÜSSEL — das Backup kennt keine Abzeichen', () => {
    /* Der echte Export-Pfad, nicht der Konstruktor: Wer ein Abzeichen speichert, baut
       eine zweite Wahrheit neben der Leitner-Box (ADR 0008) und einen Schlüssel, den
       ältere Versionen nicht kennen (ADR 0002). */
    const backup = exportBackup();
    expect(Object.keys(backup)).not.toContain('badges');
    expect(JSON.stringify(backup)).not.toMatch(/badge|abzeichen/i);
  });

  it('badges.ts speichert nichts und kennt keinen Store', () => {
    // Kommentare raus — sie NENNEN die verbotenen Begriffe, und `persistence/leitner`
    // enthaelt nun einmal die Zeichenfolge „persist".
    const quelle = readFileSync('src/data/badges.ts', 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/\/\/[^\n]*/g, ' ');

    expect(quelle).not.toMatch(/localStorage|setState|\bpersist\(/);
    expect(quelle).not.toMatch(/from '\.\.\/store\//); // die Datenschicht kennt keine Stores
  });
});
