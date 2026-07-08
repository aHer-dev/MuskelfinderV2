/* =========================================================================
   useFilterStore — Such-/Filter-Zustand (Session, NICHT persistiert).
   src/store/useFilterStore.ts

   Der Filter ist deep-linkbar über die URL (ADR 0002 §5: V1-UI-localStorage-Keys
   werden nicht übernommen). Deshalb kein `persist` — die URL ist die Wahrheit,
   der Store der schnelle Arbeitszustand.
   ========================================================================= */

import { create } from 'zustand';
import { EMPTY_FILTER, type MuscleFilter, type RegionId, type SortKey } from '../types';

interface FilterState extends MuscleFilter {
  setQuery: (query: string) => void;
  toggleRegion: (region: RegionId) => void;
  setJoint: (joint: string | null) => void;
  setMovement: (movement: string | null) => void;
  setInnervation: (innervation: string | null) => void;
  setSort: (sort: SortKey) => void;
  /** Kompletten Filter setzen (z. B. Hydration aus der URL). */
  setFilter: (filter: MuscleFilter) => void;
  reset: () => void;
  /** Der aktuelle Filter als reines Objekt (für Serialisierung/Suche). */
  current: () => MuscleFilter;
}

function pickFilter(state: MuscleFilter): MuscleFilter {
  return {
    query: state.query,
    regions: state.regions,
    joint: state.joint,
    movement: state.movement,
    innervation: state.innervation,
    sort: state.sort,
  };
}

export const useFilterStore = create<FilterState>()((set, get) => ({
  ...EMPTY_FILTER,

  setQuery: (query) => set({ query }),

  toggleRegion: (region) =>
    set((s) => ({
      regions: s.regions.includes(region)
        ? s.regions.filter((r) => r !== region)
        : [...s.regions, region],
    })),

  setJoint: (joint) => set({ joint }),
  setMovement: (movement) => set({ movement }),
  setInnervation: (innervation) => set({ innervation }),
  setSort: (sort) => set({ sort }),

  setFilter: (filter) => set({ ...filter }),
  reset: () => set({ ...EMPTY_FILTER }),

  current: () => pickFilter(get()),
}));
