import { describe, expect, it } from 'vitest';
import { generateGroupQuiz } from './group-quiz';
import { getGroups } from './groups';
import { createRng, quizSeriesKey } from './quiz';
import { getMuscles } from './loader';

const MUSCLES = getMuscles();
const GROUPS = getGroups();

function quiz(count = 20, seed = 7) {
  return generateGroupQuiz({ groups: GROUPS, muscles: MUSCLES, count, rng: createRng(seed) });
}

describe('generateGroupQuiz', () => {
  it('fragt nach dem Fremden — und der Fremde ist die richtige Antwort', () => {
    for (const q of quiz()) {
      const gruppe = GROUPS.find((g) => q.prompt.includes(g.label));
      expect(gruppe, `keine Gruppe zu „${q.prompt}"`).toBeDefined();

      const richtig = q.options.find((o) => o.id === q.correctId);
      expect(richtig).toBeDefined();
      // Die richtige Antwort gehoert NICHT zur Gruppe …
      expect(gruppe!.muscles).not.toContain(richtig!.label);
      // … und alle anderen Optionen schon.
      for (const o of q.options.filter((o) => o.id !== q.correctId)) {
        expect(gruppe!.muscles, `${o.label} sollte in ${gruppe!.id} sein`).toContain(o.label);
      }
    }
  });

  it('vier Optionen, alle verschieden', () => {
    for (const q of quiz()) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options.map((o) => o.label)).size).toBe(4);
    }
  });

  it('der Fremde kommt aus derselben Region — sonst wäre die Frage geschenkt', () => {
    const regionOf = new Map(MUSCLES.map((m) => [m.id, m.region]));
    for (const q of quiz()) {
      const fremd = q.options.find((o) => o.id === q.correctId)!;
      const mitglieder = q.options.filter((o) => o.id !== q.correctId);
      const regionen = new Set(mitglieder.map((o) => regionOf.get(o.muscleId!)));
      expect(regionen.has(regionOf.get(fremd.muscleId!))).toBe(true);
    }
  });

  it('ist deterministisch bei gleichem Seed', () => {
    expect(quiz(5, 99)).toEqual(quiz(5, 99));
  });

  it('erfindet nichts, wenn die Gruppen fehlen', () => {
    expect(generateGroupQuiz({ groups: [], muscles: MUSCLES, count: 5 })).toEqual([]);
  });

  it('überspringt Gruppen, die für vier Optionen zu klein sind', () => {
    const winzig = [{ id: 'x', label: 'X', muscles: ['M. deltoideus', 'M. subclavius'] }];
    expect(generateGroupQuiz({ groups: winzig, muscles: MUSCLES, count: 5 })).toEqual([]);
  });
});

describe('ADR 0002: der Serien-Schlüssel bleibt unangetastet', () => {
  it('die bestehenden Modi liefern exakt den bisherigen Key', () => {
    expect(quizSeriesKey('innervation')).toBe(
      'innervation::{"deckOnly":false,"regions":[],"subgroups":[]}',
    );
    expect(quizSeriesKey('image')).toBe('image::{"deckOnly":false,"regions":[],"subgroups":[]}');
  });

  it('der Gruppen-Modus erzeugt einen ZUSÄTZLICHEN Key, keinen veränderten', () => {
    expect(quizSeriesKey('group-odd-one-out')).toBe(
      'group-odd-one-out::{"deckOnly":false,"regions":[],"subgroups":[]}',
    );
  });
});

describe('Nach der Abnahme vom 2026-07-13', () => {
  it('DER FREMDE STAMMT AUS DER REGION DER GEZEIGTEN MITGLIEDER, nicht der ganzen Gruppe', () => {
    /* Der Bug, den das Entfernen des M. plantaris aufgedeckt hat: Es wurden nur DREI
       Mitglieder gezeigt, der Fremde aber aus den Regionen ALLER Mitglieder gezogen.
       Bei einer Gruppe, die zwei Regionen umspannt, konnte er damit der einzige
       Fusspunkt unter drei Schulterpunkten sein — die Frage war geschenkt. */
    const regionOf = new Map(MUSCLES.map((m) => [m.id, m.region]));
    for (const q of quiz(30, 3)) {
      const fremd = q.options.find((o) => o.id === q.correctId)!;
      const gezeigt = q.options.filter((o) => o.id !== q.correctId);
      const regionen = new Set(gezeigt.map((o) => regionOf.get(o.muscleId!)));
      expect(
        regionen.has(regionOf.get(fremd.muscleId!)),
        `${fremd.label} passt zu keiner Region der gezeigten Mitglieder`,
      ).toBe(true);
    }
  });

  it('die Wade ist wieder im Quiz — DREI Mitglieder ergeben eine 4-Optionen-Frage', () => {
    /* Bei der Abnahme stand der M. plantaris zunaechst in `related`. Dadurch hatte die Gruppe
       nur ZWEI Mitglieder — und eine „Welcher gehoert nicht dazu?"-Frage braucht drei Mitglieder
       plus einen Fremden. Die Wade fiel still aus dem Quiz. Nach diesem Befund hat der
       Projektinhaber umentschieden: Der Plantaris ist wieder Mitglied. */
    const wade = getGroups().find((g) => g.id === 'wade-oberflaechlich');
    expect(wade?.muscles).toHaveLength(3);
    expect(wade?.muscles).toContain('M. plantaris');
    expect(wade?.related).toBeUndefined();

    // Eine Gruppe mit drei Mitgliedern MUSS in einer ausreichend grossen Runde vorkommen koennen.
    const ids = new Set(quiz(60, 5).map((q) => q.id));
    expect(ids).toContain('group-wade-oberflaechlich');
  });

  it('ein „in Klammern"-Muskel DARF der Fremde sein — das ist die Prüfungsfrage', () => {
    const bauchwand = getGroups().find((g) => g.id === 'bauchwand')!;
    expect(bauchwand.related).toContain('M. quadratus lumborum');
    // Er steht nicht in `muscles`, ist also als Distraktor zugelassen.
    expect(bauchwand.muscles).not.toContain('M. quadratus lumborum');
  });
});
