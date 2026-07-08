/* =========================================================================
   useMediaQuery — reagiert auf CSS-Media-Queries (Rail ⇄ TabBar, §14).
   src/hooks/useMediaQuery.ts
   ========================================================================= */

import { useEffect, useState } from 'react';

/** lg-Breakpoint aus dem Handoff (§7): Rail ab ≥1024px, darunter TabBar. */
export const DESKTOP_QUERY = '(min-width: 1024px)';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false,
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** Convenience: true ab dem Desktop-Breakpoint (Rail sichtbar). */
export function useIsDesktop(): boolean {
  return useMediaQuery(DESKTOP_QUERY);
}
