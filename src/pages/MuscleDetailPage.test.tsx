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
  /* Ohne Stern: Die ungepruefte Kurzform heisst „Funktion *" (Etappe 15) — hier geht es
     um die Reihenfolge, nicht um die Marke. */
  const labelsImDom = () => Array.from(document.querySelectorAll('.datalist__label'))
    .map((el) => (el.textContent ?? '').replace(/\s*\*$/, ''));

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
    /* Eigenes Zeitbudget: 150 Detailseiten nacheinander. Allein laeuft das in ~2 s, im vollen
       Lauf (74 Dateien parallel) gemessen 5,9–6,3 s — ueber der Vorgabe von 5 s, auch auf dem
       Stand vor Etappe 16. Damit fiel `npm run verify` an einer Uhr, nicht an einem Fehler. */
  }, 20_000);
});

/* ── Funktion in Kurzform (Etappe 15) ──
   Oben Gelenk und Bewegung, der ausformulierte Text klappt direkt darunter auf. */
describe('MuscleDetailPage — Funktion in Kurzform', () => {
  const funktionsZeile = () =>
    Array.from(document.querySelectorAll('.datalist__row'))
      .find((row) => row.querySelector('.datalist__label')?.textContent?.startsWith('Funktion'))!;

  it('zeigt unter „Funktion" die Kurzform mit deutschem Gelenknamen', () => {
    renderAt('/muskel/rectus-femoris');
    const zeile = funktionsZeile();
    expect(Array.from(zeile.querySelectorAll('.fachangabe__gruppe')).map((el) => el.textContent))
      .toEqual(['Hüftgelenk (Art. coxae)', 'Kniegelenk (Art. genus)']);
    expect(Array.from(zeile.querySelectorAll('li')).map((el) => el.textContent))
      .toEqual(['Flexion', 'Extension']);
  });

  it('der ausformulierte Text steht eingeklappt in derselben Zeile', () => {
    renderAt('/muskel/rectus-femoris');
    const muskel = getMuscles().find((m) => m.id === 'rectus-femoris')!;
    const aufklapper = funktionsZeile().querySelector('details');
    expect(aufklapper).not.toBeNull();
    expect(aufklapper).not.toHaveAttribute('open');
    expect(aufklapper?.querySelector('summary')?.textContent).toBe('Funktionsbeschreibung');
    expect(aufklapper?.textContent).toContain(muskel.functionDescription);
  });

  it('in „Einfach" klappt der einfache Text auf — die Kurzform bleibt dieselbe', () => {
    const id = 'nasalis-head-mimikmuskulatur-erweitert-blaht-nasenloch-pars-alaris';
    const muskel = getMuscles().find((m) => m.id === id)!;
    expect(muskel.easy?.functionDescription).not.toBe(muskel.functionDescription);

    renderAt(`/muskel/${id}`);
    const vorher = funktionsZeile().querySelector('.datalist__text')?.textContent;
    fireEvent.click(screen.getByRole('button', { name: 'Einfach' }));
    expect(funktionsZeile().querySelector('.datalist__text')?.textContent).toBe(vorher);
    expect(funktionsZeile().querySelector('details')?.textContent).toContain(muskel.easy!.functionDescription);
  });

  it('abgenommene Kurzform: kein Stern, keine Legende (Abnahme 2026-09-27)', () => {
    renderAt('/muskel/rectus-femoris');
    expect(funktionsZeile().querySelector('.datalist__label')?.textContent).toBe('Funktion');
    expect(screen.queryByText(/noch nicht im Lehrbuch gegengelesen/)).not.toBeInTheDocument();
  });
});

describe('MuscleDetailPage — Fachangaben als Liste', () => {
  it.each(['Fachlich', 'Einfach'])('zeigt jeden Bizeps-Ansatz und jede Bewegung einzeln in %s', (modus) => {
    renderAt('/muskel/biceps-brachii');
    fireEvent.click(screen.getByRole('button', { name: modus }));
    const zeile = (label: string) => Array.from(document.querySelectorAll('.datalist__row'))
      .find((row) => row.querySelector('dt')?.textContent === label)!;
    expect(Array.from(zeile('Ursprung').querySelectorAll('.fachangabe__gruppe')).map((el) => el.textContent))
      .toEqual(['Caput longum', 'Caput breve']);
    expect(Array.from(zeile('Ansatz').querySelectorAll('li')).map((el) => el.textContent))
      .toEqual(['Tuberositas radii', 'Lacertus fibrosus / Fascia antebrachii']);
    const schulter = Array.from(zeile('Funktion').querySelectorAll('.fachangabe__abschnitt'))
      .find((el) => el.querySelector('strong')?.textContent === 'Schultergelenk (Art. humeri)')!;
    expect(Array.from(schulter.querySelectorAll('li')).map((el) => el.textContent))
      .toEqual(['Flexion', 'Abduktion oder Adduktion (je nach Kopf)']);
  });
});
