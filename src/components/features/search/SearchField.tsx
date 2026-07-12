import { Icon } from '../../ui/Icon';
import { useFilterStore } from '../../../store/useFilterStore';

interface SearchFieldProps {
  /**
   * Wird beim Tippen gerufen — die Kopfzeile (7d) nutzt das, um zur Trefferliste
   * zu wechseln, wenn gerade eine andere Route offen ist. Ohne Prop passiert nichts.
   */
  onActivate?: () => void;
}

/** Suchfeld — schreibt direkt in den Filter-Store (Debounce passiert im Hook). */
export function SearchField({ onActivate }: SearchFieldProps = {}) {
  const query = useFilterStore((s) => s.query);
  const setQuery = useFilterStore((s) => s.setQuery);

  return (
    <div className="search-field">
      <Icon name="icSearch" size={20} className="search-field__icon" />
      <input
        type="search"
        className="search-field__input"
        placeholder="Muskel suchen …"
        aria-label="Muskel suchen"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          onActivate?.();
        }}
      />
      {query && (
        <button
          type="button"
          className="search-field__clear"
          aria-label="Suche leeren"
          onClick={() => setQuery('')}
        >
          <Icon name="icClose" size={18} />
        </button>
      )}
    </div>
  );
}
