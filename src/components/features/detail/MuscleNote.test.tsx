import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MuscleNote } from './MuscleNote';
import { useNotesStore } from '../../../store/useNotesStore';

const NAME = 'M. deltoideus';

/** Das Feld — über sein Label gefunden, nicht über eine Klasse. */
function field(): HTMLTextAreaElement {
  return screen.getByLabelText('Deine Notiz') as HTMLTextAreaElement;
}

function type(value: string) {
  fireEvent.change(field(), { target: { value } });
}

/** Über den Debounce hinweg. */
function waitOutDebounce() {
  act(() => {
    vi.advanceTimersByTime(700);
  });
}

beforeEach(() => {
  useNotesStore.getState().resetNotes();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('MuscleNote', () => {
  it('zeigt eine vorhandene Notiz an', () => {
    useNotesStore.getState().setNote(NAME, 'Steht in der Klausur.');
    render(<MuscleNote nameLatin={NAME} />);

    expect(field()).toHaveValue('Steht in der Klausur.');
  });

  it('speichert ohne Knopf — nach kurzer Pause steht die Notiz im Store', () => {
    render(<MuscleNote nameLatin={NAME} />);

    type('Ursprung merken');
    expect(useNotesStore.getState().getNote(NAME)).toBe(''); // noch nicht — der Debounce läuft

    waitOutDebounce();
    expect(useNotesStore.getState().getNote(NAME)).toBe('Ursprung merken');
  });

  it('verliert nichts, wenn mitten im Tippen weggeblättert wird', () => {
    const view = render(<MuscleNote nameLatin={NAME} />);

    type('halb getippt');
    // Wegnavigieren, BEVOR der Debounce zuschlägt. Genau hier ginge sonst alles verloren.
    view.unmount();

    expect(useNotesStore.getState().getNote(NAME)).toBe('halb getippt');
  });

  it('eine geleerte Notiz wird gelöscht', () => {
    useNotesStore.getState().setNote(NAME, 'weg damit');
    render(<MuscleNote nameLatin={NAME} />);

    type('');
    waitOutDebounce();

    expect(useNotesStore.getState().notes.entries).toEqual({});
  });

  it('meldet erst „Wird gespeichert …", dann „Gespeichert"', () => {
    render(<MuscleNote nameLatin={NAME} />);

    type('etwas');
    expect(screen.getByRole('status')).toHaveTextContent('Wird gespeichert');

    waitOutDebounce();
    expect(screen.getByRole('status')).toHaveTextContent('Gespeichert');
  });

  it('das Feld trägt ein echtes Label (Muskelnamen taugen nicht als ID)', () => {
    render(<MuscleNote nameLatin={NAME} />);

    const label = document.querySelector('label');
    expect(label?.getAttribute('for')).toBe(field().id);
    expect(field().id).not.toContain(' ');
  });
});
