/* =========================================================================
   Palpation: wo man den Muskel am lebenden Körper findet (Etappe 9d).
   src/data/palpation.ts

   Physio- und Ergo-Schüler werden **am Menschen** geprüft: „Zeig mir den
   M. supraspinatus." Kein Feld der App sagte bisher, wo man ihn findet.

   Entscheidung E3: **Feld anlegen, inkrementell füllen.** Die Mechanik steht hier;
   der Inhalt wächst nach. Ein Muskel ohne Eintrag rendert **genau wie vorher** —
   kein leerer Kasten, keine Überschrift ohne Text.

   ⚠️ **Nichts erfinden.** Palpation ist Fachinhalt am Menschen: Ein falscher
   Landmarken-Hinweis wird auswendig gelernt und am Patienten angewandt. Wo Unsicherheit
   besteht, bleibt das Feld leer — ein kurzer Eintrag ist besser als ein ungefährer.

   ⚠️ Die Daten liegen unter `src/data/editorial/`, NICHT unter `src/data/generated/`:
   Der generierte Ordner wird von `npm run migrate:data` neu erzeugt und nähme jeden
   redaktionellen Text mit. Schlüssel ist `nameLatin` (ADR 0002 §2), nicht die
   Routing-`id` — die kann sich bei einer Neu-Migration ändern.
   ========================================================================= */

import editorial from './editorial/palpation.json';
import type { Muscle, Palpation } from '../types';

export class PalpationDataError extends Error {}

export interface PalpationSource {
  /** `nameLatin` → Palpationshinweise. */
  muskeln: Record<string, Palpation>;
}

const FIELDS = ['position', 'landmarks', 'technique', 'confusion'] as const;

/** Leerer Text = kein Text. Ein Feld mit Leerzeichen darf keine Überschrift erzeugen. */
function clean(entry: Record<string, unknown>): Palpation | null {
  const result: Palpation = {};
  for (const field of FIELDS) {
    const value = entry[field];
    if (typeof value === 'string' && value.trim() !== '') result[field] = value.trim();
  }
  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Liest die redaktionelle Datei. Defensiv gegenüber Struktur, **streng gegenüber Namen**:
 * `assertKnownMuscles` prüft separat gegen den Bestand.
 */
export function readPalpationSource(raw: unknown): PalpationSource {
  const data = (raw ?? {}) as { muskeln?: unknown };
  if (typeof data.muskeln !== 'object' || data.muskeln === null) return { muskeln: {} };

  const muskeln: Record<string, Palpation> = {};
  for (const [name, entry] of Object.entries(data.muskeln as Record<string, unknown>)) {
    if (typeof entry !== 'object' || entry === null) continue;
    const palpation = clean(entry as Record<string, unknown>);
    if (palpation) muskeln[name] = palpation;
  }
  return { muskeln };
}

/**
 * Ein Muskelname, den es nicht gibt, **lässt den Build scheitern** — er verschwände sonst
 * still, und der Eintrag wäre für immer unsichtbar, ohne dass es jemandem auffiele.
 * (Dieselbe Regel wie bei den Gruppen aus 9a.)
 */
export function assertKnownMuscles(source: PalpationSource, known: ReadonlySet<string>): void {
  const unbekannt = Object.keys(source.muskeln).filter((name) => !known.has(name));
  if (unbekannt.length > 0) {
    throw new PalpationDataError(
      `palpation.json nennt Muskeln, die es nicht gibt: ${unbekannt.join(', ')}`,
    );
  }
}

const SOURCE = readPalpationSource(editorial);

/** Wie viele Muskeln bisher Palpationshinweise haben — die Charge wächst inkrementell. */
export function palpationCount(source: PalpationSource = SOURCE): number {
  return Object.keys(source.muskeln).length;
}

/** Der Loader ruft das, sobald die Muskeln validiert sind. */
export function initPalpation(muscles: readonly Muscle[], source: PalpationSource = SOURCE): void {
  assertKnownMuscles(source, new Set(muscles.map((m) => m.nameLatin)));
}

/**
 * Reichert einen Muskel um seine Palpationshinweise an (der Loader ruft das).
 * Fehlt der Eintrag, bleibt der Muskel **unverändert** — die Detailseite rendert wie vorher.
 */
export function withPalpation(muscle: Muscle, source: PalpationSource = SOURCE): Muscle {
  const palpation = source.muskeln[muscle.nameLatin];
  return palpation ? { ...muscle, palpation } : muscle;
}
