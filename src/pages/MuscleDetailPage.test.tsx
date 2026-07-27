import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MuscleDetailPage } from './MuscleDetailPage';
import { getMuscles } from '../data';
import { folgtReihenfolge } from '../data/muscle-fields';
import { useCollectionStore } from '../store/useCollectionStore';
import { useProgressStore } from '../store/useProgressStore';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/muskel/:id" element={<MuscleDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('MuscleDetailPage', () => {
  beforeEach(() => {
    localStorage.clear();
    useCollectionStore.getState().clear();
    useProgressStore.getState().clearProgress();
  });

  it('lädt den Muskel per :id und zeigt Name + Attribution', () => {
    renderAt('/muskel/deltoideus');
    expect(screen.getByRole('heading', { level: 1, name: 'M. deltoideus' })).toBeInTheDocument();
    expect(screen.getByText(/CC BY 4\.0/)).toBeInTheDocument();
  });

  it('zeigt eine klare Meldung bei unbekannter id', () => {
    renderAt('/muskel/gibt-es-nicht');
    expect(screen.getByRole('heading', { name: /Unbekannter Muskel/i })).toBeInTheDocument();
  });

  it('Merken-Button schreibt in die Sammlung (persistiert)', () => {
    renderAt('/muskel/deltoideus');
    fireEvent.click(screen.getByRole('button', { name: /Merken/i }));
    expect(useCollectionStore.getState().has('deltoideus')).toBe(true);
  });

  it('Zu-Lernkarten-Button legt eine Karte nach Muskelname an', () => {
    renderAt('/muskel/deltoideus');
    fireEvent.click(screen.getByRole('button', { name: /Zu Lernkarten/i }));
    expect(useProgressStore.getState().isInDeck('M. deltoideus')).toBe(true);
  });

  it('bietet den Fachlich/Einfach-Umschalter, wenn Easy-Felder vorhanden sind', () => {
    renderAt('/muskel/deltoideus');
    expect(screen.getByRole('group', { name: /Detailtiefe/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Einfach' })).toBeInTheDocument();
  });

  /* Die Reihenfolge wird am gerenderten DOM geprueft, nicht an `buildRows`: Was
     zaehlt, ist was der Lernende sieht. `buildRows` bleibt modulprivat. */
  const labelsImDom = () => Array.from(document.querySelectorAll('.datalist__label'))
    .map((el) => el.textContent ?? '');

  it('zeigt die Fachfelder in der kanonischen Reihenfolge', () => {
    renderAt('/muskel/deltoideus');
    const labels = labelsImDom();
    expect(folgtReihenfolge(labels), labels.join(' · ')).toBe(true);
    expect(labels.indexOf('Ursprung')).toBeLessThan(labels.indexOf('Funktion'));
  });

  it('behält die Reihenfolge auch in der einfachen Ansicht', () => {
    renderAt('/muskel/deltoideus');
    fireEvent.click(screen.getByRole('button', { name: 'Einfach' }));
    const labels = labelsImDom();
    expect(folgtReihenfolge(labels), labels.join(' · ')).toBe(true);
  });

  it('zeigt für JEDEN Muskel des Bestands dieselbe Reihenfolge', () => {
    /* Ein einzelner Muskel beweist hier nichts: Fehlt ein Feld, verschiebt sich
       alles, und genau dabei koennte eine Sortierung kippen. */
    for (const m of getMuscles()) {
      const { unmount } = renderAt(`/muskel/${m.id}`);
      const labels = labelsImDom();
      expect(folgtReihenfolge(labels), `${m.nameLatin}: ${labels.join(' · ')}`).toBe(true);
      unmount();
    }
  });
});
