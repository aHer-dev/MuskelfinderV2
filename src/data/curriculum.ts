/* =========================================================================
   Kursabschnitte: der Stoff in der Reihenfolge, in der er unterrichtet wird (Etappe 10d).
   src/data/curriculum.ts

   Ohne diese Datei muss ein Schüler seinen Karteikasten aus 150 Muskeln selbst
   zusammenklauben — nach Region, also nach Anatomie statt nach Unterricht. Der
   Kursabschnitt ist der Weg, den er wirklich geht: „Kurs 2 — Schultergürtel", und
   drin liegt genau das, was in Kurs 2 drankommt.

   ⚠️ **Nichts erfinden.** Ein Kursabschnitt ist eine Behauptung darüber, was geprüft wird.
   Rät die KI ihn, lernt ein Schüler den falschen Stoff für die falsche Prüfung. Die
   Abschnitte kommen vom Projektinhaber (er unterrichtet die Kurse). Bis dahin bleibt
   `editorial/curriculum.json` **leer**, und die UI zeigt einen bewussten Platzhalter —
   dieselbe Regel wie bei der Palpation (`docs/palpation-erfassen.md`).

   ⚠️ Die Daten liegen unter `src/data/editorial/`, NICHT unter `src/data/generated/`:
   Der generierte Ordner wird von `npm run migrate:data` neu erzeugt und nähme jeden
   redaktionellen Eintrag mit. Schlüssel ist `nameLatin` (ADR 0002 §2), nicht die
   Routing-`id` — die kann sich bei einer Neu-Migration ändern.

   Geschlüsselt nach Beruf: Kurs 1 der Logopädie ist nicht Kurs 1 der Physiotherapie
   (ADR 0009).
   ========================================================================= */

import editorial from './editorial/curriculum.json';
import { PROFESSIONS, type Profession } from './profession';
import type { Muscle } from '../types';

export class CurriculumDataError extends Error {}

export interface CurriculumSection {
  /** Stabil, kleingeschrieben, für Deep-Links und Test-Zuordnung. */
  id: string;
  /** Was der Schüler liest: „Kurs 2 — Schultergürtel". */
  label: string;
  /** `nameLatin` der Muskeln in diesem Abschnitt. */
  muscles: string[];
}

export interface CurriculumSource {
  kurse: Record<Profession, CurriculumSection[]>;
}

function emptySource(): CurriculumSource {
  return { kurse: { physio: [], ergo: [], logo: [] } };
}

/** Ein Abschnitt ohne Muskeln ist kein Abschnitt — er würde einen toten Knopf erzeugen. */
function readSection(raw: unknown): CurriculumSection | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const entry = raw as Record<string, unknown>;

  const id = typeof entry.id === 'string' ? entry.id.trim() : '';
  const label = typeof entry.label === 'string' ? entry.label.trim() : '';
  if (id === '' || label === '') return null;

  /* Karten sind nach `nameLatin` geschlüsselt (ADR 0002 §2) — und fünf Namen gibt es
     zweimal (Hand und Fuß). Zwei Muskeln mit demselben Namen sind EINE Karte; ohne die
     Dublettensperre wäre ein Abschnitt still kleiner, als seine Zahl verspricht. */
  const seen = new Set<string>();
  const muscles: string[] = [];
  for (const value of Array.isArray(entry.muscles) ? entry.muscles : []) {
    if (typeof value !== 'string') continue;
    const name = value.trim();
    if (name === '' || seen.has(name)) continue;
    seen.add(name);
    muscles.push(name);
  }

  return muscles.length > 0 ? { id, label, muscles } : null;
}

/**
 * Liest die redaktionelle Datei. Defensiv gegenüber Struktur, **streng gegenüber Namen**:
 * `assertKnownMuscles` prüft separat gegen den Bestand.
 */
export function readCurriculumSource(raw: unknown): CurriculumSource {
  const data = (raw ?? {}) as { kurse?: unknown };
  const source = emptySource();
  if (typeof data.kurse !== 'object' || data.kurse === null) return source;

  const kurse = data.kurse as Record<string, unknown>;
  for (const profession of PROFESSIONS) {
    const list = kurse[profession];
    if (!Array.isArray(list)) continue;

    const seenIds = new Set<string>();
    for (const raw of list) {
      const section = readSection(raw);
      /* Zwei Abschnitte mit derselben id wären in React zwei Zeilen mit demselben `key` —
         und im Deep-Link nicht auseinanderzuhalten. Der erste gewinnt. */
      if (!section || seenIds.has(section.id)) continue;
      seenIds.add(section.id);
      source.kurse[profession].push(section);
    }
  }
  return source;
}

/**
 * Ein Muskelname, den es nicht gibt, **lässt den Build scheitern** — er verschwände sonst
 * still aus dem Abschnitt, und niemandem fiele auf, dass der Kurs eine Lücke hat.
 * (Dieselbe Regel wie bei Gruppen (9a) und Palpation (9d).)
 */
export function assertKnownMuscles(source: CurriculumSource, known: ReadonlySet<string>): void {
  const unbekannt = new Set<string>();
  for (const sections of Object.values(source.kurse)) {
    for (const section of sections) {
      for (const name of section.muscles) {
        if (!known.has(name)) unbekannt.add(`${section.id}: ${name}`);
      }
    }
  }
  if (unbekannt.size > 0) {
    throw new CurriculumDataError(
      `curriculum.json nennt Muskeln, die es nicht gibt: ${[...unbekannt].join(', ')}`,
    );
  }
}

const SOURCE = readCurriculumSource(editorial);

/** Der Loader ruft das, sobald die Muskeln validiert sind. */
export function initCurriculum(muscles: readonly Muscle[], source: CurriculumSource = SOURCE): void {
  assertKnownMuscles(source, new Set(muscles.map((m) => m.nameLatin)));
}

/** Die Abschnitte eines Berufs — leer, solange der Projektinhaber keine eingetragen hat. */
export function getSections(
  profession: Profession | null,
  source: CurriculumSource = SOURCE,
): CurriculumSection[] {
  return profession ? source.kurse[profession] : [];
}

/** Hat dieser Beruf überhaupt schon Abschnitte? Entscheidet Platzhalter vs. Auswahl. */
export function hasCurriculum(
  profession: Profession | null,
  source: CurriculumSource = SOURCE,
): boolean {
  return getSections(profession, source).length > 0;
}
