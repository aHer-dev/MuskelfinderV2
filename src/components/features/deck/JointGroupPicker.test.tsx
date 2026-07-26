import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { JointGroupPicker } from './JointGroupPicker';
import { getJointGroup, getJointGroups } from '../../../data/joint-groups';
import { useProfileStore } from '../../../store/useProfileStore';
import { useProgressStore } from '../../../store/useProgressStore';
import { useToastStore } from '../../../store/useToastStore';

function renderPicker() {
  return render(<JointGroupPicker headingId="test-gelenke" />);
}

/** Der Knopf einer Gruppe — über das Label, nicht über die Position (die hängt am Beruf). */
function gruppe(label: string): HTMLElement {
  return screen.getByRole('button', { name: new RegExp(label.replace('&', '&')) });
}

beforeEach(() => {
  localStorage.clear();
  useProgressStore.getState().clearProgress();
  useToastStore.setState({ toasts: [] });
  useProfileStore.getState().setProfile('ergo', null);
});

describe('JointGroupPicker', () => {
  it('zeigt ALLE Gruppen, auch die nicht berufstypischen', () => {
    /* „Sortieren, nichts verstecken" (Entscheidung 2026-07-26). Ein Ergo, der die Hüfte
       lernen will, soll sie nicht hinter einem „Alle zeigen"-Klick suchen müssen. */
    renderPicker();
    for (const g of getJointGroups()) {
      expect(gruppe(g.label), `Gruppe „${g.label}" fehlt`).toBeInTheDocument();
    }
  });

  it('stellt das eigene Fach nach vorn und sagt WARUM', () => {
    renderPicker();
    expect(screen.getByRole('heading', { name: /Typisch für dich/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Alle weiteren/i })).toBeInTheDocument();

    const banden = screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent);
    expect(banden).toEqual(['Typisch für dich', 'Alle weiteren']);
  });

  it('ein Klick legt genau die Karten der Gruppe an', () => {
    renderPicker();
    const hand = getJointGroup('hand')!;
    fireEvent.click(gruppe('Hand'));

    const drin = Object.keys(useProgressStore.getState().flashcards.cards).sort();
    expect(drin).toEqual([...hand.muscles].sort());
  });

  it('sagt hinterher, was passiert ist — sonst merkt niemand den Klick', () => {
    /* Gemessen im UX-Review 2026-07-26: Der einzige Hinweis auf einen erfolgreichen Klick war
       das Umbauen der ganzen Seite, und auf dem Handy blieb die Scrollposition dabei stehen.
       Der einzige Toast in diesem Moment war „+10 XP · Tagesbonus" — der gehört zum
       App-Start, nicht zur Handlung. */
    renderPicker();
    const ellenbogen = getJointGroup('ellenbogen')!;
    fireEvent.click(gruppe('Ellenbogen'));

    const texte = useToastStore.getState().toasts.map((t) => t.message);
    expect(texte.some((t) => t.includes(`${ellenbogen.muscles.length}`) && /angelegt/.test(t))).toBe(
      true,
    );
    expect(texte.some((t) => t.includes('Ellenbogen'))).toBe(true);
  });

  it('die Zahl am Knopf ist die Zahl der NEUEN Karten, nicht die Mitgliederzahl', () => {
    /* 26 Muskeln liegen in mehreren Gruppen. Nach „Ellenbogen" enthält „Schultergelenk"
       noch die Zweigelenker (M. biceps brachii, Caput longum des Triceps) — ein Knopf, der
       dann weiter 11 verspricht, aber 9 anlegt, lügt. */
    const schulter = getJointGroup('schultergelenk')!;
    renderPicker();
    expect(within(gruppe('Schultergelenk')).getByText(String(schulter.muscles.length))).toBeInTheDocument();

    fireEvent.click(gruppe('Ellenbogen'));

    const knopf = gruppe('Schultergelenk');
    const rest = schulter.muscles.filter(
      (n) => !getJointGroup('ellenbogen')!.muscles.includes(n),
    ).length;
    expect(rest).toBeLessThan(schulter.muscles.length); // es gibt wirklich eine Überlappung
    expect(within(knopf).getByText(String(rest))).toBeInTheDocument();
    expect(knopf).toHaveAccessibleName(new RegExp(`${rest} neue`));
  });

  it('eine vollständig vorhandene Gruppe ist erledigt, nicht anklickbar', () => {
    const knie = getJointGroup('kniegelenk')!;
    useProgressStore.getState().addCards(knie.muscles);
    renderPicker();

    const knopf = gruppe('Kniegelenk');
    expect(knopf).toBeDisabled();
    expect(knopf).toHaveAccessibleName(/liegen schon/i);
  });

  it('ohne Profil gibt es keine Bänder, aber alle Gruppen', () => {
    useProfileStore.setState({ profession: null, examDate: null });
    renderPicker();
    expect(screen.queryByRole('heading', { name: /Typisch für dich/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(getJointGroups().length);
  });
});
