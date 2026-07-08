import { useEffect, useState } from 'react';

/** Gibt `value` verzögert zurück — glättet schnelle Eingaben (z. B. Suchfeld). */
export function useDebouncedValue<T>(value: T, delayMs = 150): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}
