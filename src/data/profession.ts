/* =========================================================================
   Der Beruf des Lernenden (Etappe 7c, freigelegt in Etappe 10).
   src/data/profession.ts

   Stand hier bis Etappe 10 zusammen mit dem Auto-Seeding in `seeding.ts`. Das Seeding
   ist mit ADR 0009 gestrichen — der Beruf bleibt, aus zwei Gründen:

   1. Er wird **im Backup persistiert** (`persistence/sanitize.ts` validiert gegen genau
      diese drei Werte, `persistence/types.ts` führt die Sektion `profile`). Ihn zu
      entfernen hieße, einen Schlüssel aus einem ausgelieferten Format zu nehmen —
      ADR 0002 verbietet das.
   2. Er trägt das **Curriculum**: Kursabschnitte sind je Beruf verschieden (Kurs 1 der
      Logopädie ist nicht Kurs 1 der Physiotherapie). `curriculum.json` ist nach Beruf
      geschlüsselt.

   Er legt **keine Karten** mehr an. Das tut ab jetzt nur noch der Nutzer selbst.
   ========================================================================= */

export type Profession = 'physio' | 'ergo' | 'logo';

export const PROFESSIONS: Profession[] = ['physio', 'ergo', 'logo'];

/** Anzeigenamen — die UI formuliert nichts selbst zusammen. */
export const PROFESSION_LABELS: Record<Profession, string> = {
  physio: 'Physiotherapie',
  ergo: 'Ergotherapie',
  logo: 'Logopädie',
};

/** Für `sanitize` und alles, was fremden Input prüft. */
export function isProfession(value: unknown): value is Profession {
  return typeof value === 'string' && (PROFESSIONS as string[]).includes(value);
}
