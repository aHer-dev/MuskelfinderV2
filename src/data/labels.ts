/* =========================================================================
   Label-Helfer — id → Anzeigetext, aus den Daten abgeleitet.
   src/data/labels.ts
   ========================================================================= */

import { MOVEMENTS, REGIONS } from './loader';
import type { RegionId } from '../types';

const REGION_LABELS = new Map<RegionId, string>(REGIONS.map((r) => [r.id, r.label]));
const MOVEMENT_LABELS = new Map<string, string>(MOVEMENTS.map((m) => [m.id, m.label]));

/** Deutscher Region-Anzeigename, Fallback = id. */
export function regionLabel(id: RegionId): string {
  return REGION_LABELS.get(id) ?? id;
}

/** Bewegungs-Label zur Movement-id, Fallback = id. */
export function movementLabel(id: string): string {
  return MOVEMENT_LABELS.get(id) ?? id;
}
