import { beforeEach, describe, expect, it } from 'vitest';
import { useNotesStore } from './useNotesStore';
import { MAX_NOTE_LENGTH } from '../persistence/types';

const NAME = 'M. deltoideus';

beforeEach(() => {
  useNotesStore.getState().resetNotes();
});

describe('useNotesStore', () => {
  it('schreibt und liest eine Notiz', () => {
    useNotesStore.getState().setNote(NAME, 'Dozentin: kommt in der Klausur.');
    expect(useNotesStore.getState().getNote(NAME)).toBe('Dozentin: kommt in der Klausur.');
  });

  it('überschreibt eine bestehende Notiz', () => {
    useNotesStore.getState().setNote(NAME, 'erste Fassung');
    useNotesStore.getState().setNote(NAME, 'zweite Fassung');
    expect(useNotesStore.getState().getNote(NAME)).toBe('zweite Fassung');
    expect(Object.keys(useNotesStore.getState().notes.entries)).toEqual([NAME]);
  });

  it('leere Notiz = keine Notiz — sie wird gelöscht, nicht als "" gespeichert', () => {
    useNotesStore.getState().setNote(NAME, 'etwas');
    useNotesStore.getState().setNote(NAME, '   ');

    expect(useNotesStore.getState().getNote(NAME)).toBe('');
    expect(useNotesStore.getState().notes.entries).toEqual({});
  });

  it('legt für einen leeren Text gar keinen Eintrag an', () => {
    useNotesStore.getState().setNote(NAME, '');
    expect(useNotesStore.getState().notes.entries).toEqual({});
  });

  it('deckelt überlange Notizen', () => {
    useNotesStore.getState().setNote(NAME, 'x'.repeat(MAX_NOTE_LENGTH + 500));
    expect(useNotesStore.getState().getNote(NAME)).toHaveLength(MAX_NOTE_LENGTH);
  });

  it('führt den Änderungszeitpunkt mit', () => {
    const now = new Date('2026-07-12T10:00:00.000Z');
    useNotesStore.getState().setNote(NAME, 'notiert', now);
    expect(useNotesStore.getState().notes.entries[NAME].updatedAt).toBe(now.toISOString());
  });

  it('schreibt nicht, wenn sich nichts geändert hat (kein neuer Zeitstempel)', () => {
    useNotesStore.getState().setNote(NAME, 'gleich', new Date('2026-07-12T10:00:00.000Z'));
    useNotesStore.getState().setNote(NAME, ' gleich ', new Date('2026-07-13T10:00:00.000Z'));

    // Getrimmt identisch → kein Schreibvorgang, der Zeitstempel bleibt.
    expect(useNotesStore.getState().notes.entries[NAME].updatedAt).toBe(
      '2026-07-12T10:00:00.000Z',
    );
  });

  it('hängt am Muskel, nicht an der Karte — zwei Muskeln, zwei Notizen', () => {
    useNotesStore.getState().setNote(NAME, 'A');
    useNotesStore.getState().setNote('M. iliacus', 'B');

    expect(useNotesStore.getState().getNote(NAME)).toBe('A');
    expect(useNotesStore.getState().getNote('M. iliacus')).toBe('B');
  });
});
