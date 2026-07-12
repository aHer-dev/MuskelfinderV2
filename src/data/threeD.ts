/* =========================================================================
   3D-Anatomie-Verknüpfung (V1-Parität, ohne Architektur-Bruch).
   src/data/threeD.ts

   V1 fetchte das Support-Mapping zur Laufzeit von der externen 3D-App. V2 darf
   keine externen Laufzeit-Requests machen (CLAUDE.md) — deshalb sind die
   unterstützten Muskel-Keys als Repo-Daten gebündelt (`three-d-support.json`,
   aus der eigenen 3DAnatomy-App). Der „In 3D ansehen"-Link ist ein reiner,
   nutzerinitiierter Hyperlink auf die externe App (kein Fetch von uns).
   ========================================================================= */

import supportData from './generated/three-d-support.json';

/** Basis-URL der externen 3D-Anatomie-App (eigene GitHub-Pages-App). */
export const THREE_D_BASE_URL = 'https://aher-dev.github.io/3DAnatomy/';

const SUPPORTED_KEYS = new Set<string>(supportData.muscleKeys);

/**
 * Muskel-Key aus dem lateinischen Namen (Key-Format der 3D-App: `m_<name>`).
 *
 * `mm?\.` f\u00e4ngt auch den Plural \u201eMm." (z. B. \u201eMm. lumbricales I\u2013IV"). Vorher wurde
 * nur \u201eM." gestrippt \u2014 die 14 Plural-Muskeln erzeugten `m_mm_lumbricales_i_iv`,
 * trafen damit keinen Mapping-Key und bekamen keinen 3D-Button, obwohl die 3D-App
 * sie kennt.
 */
export function buildMuscleKey(name = ''): string {
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/^mm?\.\s*/, '')
    .replace(/^musculi\s+/, '')
    .replace(/^musculus\s+/, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
  return normalized ? `m_${normalized}` : '';
}

/** Ist der Muskel in der 3D-App verfügbar? (lokales Mapping, kein Request) */
export function isSupportedIn3D(nameLatin: string): boolean {
  const key = buildMuscleKey(nameLatin);
  return key !== '' && SUPPORTED_KEYS.has(key);
}

/** Externe 3D-App-URL mit Muskel-Kontext (wie V1: muscleKey/muscle/source/returnTo). */
export function threeDUrl(nameLatin: string, returnTo?: string): string {
  const url = new URL(THREE_D_BASE_URL);
  const key = buildMuscleKey(nameLatin);
  if (key) url.searchParams.set('muscleKey', key);
  if (nameLatin) url.searchParams.set('muscle', nameLatin);
  url.searchParams.set('source', 'muskelfinder');
  if (returnTo) url.searchParams.set('returnTo', returnTo);
  return url.toString();
}
