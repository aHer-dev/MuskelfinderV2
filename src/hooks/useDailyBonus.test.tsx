import { beforeEach, describe, expect, it } from 'vitest';
import { act, render } from '@testing-library/react';
import { useDailyBonus } from './useDailyBonus';
import { useProgressStore } from '../store/useProgressStore';
import { useToastStore } from '../store/useToastStore';

function Probe() {
  useDailyBonus();
  return null;
}

const xp = () => useProgressStore.getState().xp.totalXP;
const toasts = () => useToastStore.getState().toasts.map((t) => t.message).join(' | ');

describe('Tagesbonus — nur wer Karten hat, bekommt ihn (Etappe 12)', () => {
  beforeEach(() => {
    localStorage.clear();
    useProgressStore.getState().resetProgress();
    useToastStore.setState({ toasts: [] });
  });

  it('LEERER KASTEN: kein Bonus, kein Toast', () => {
    /* Seit ADR 0009 landet ein neuer Nutzer auf dem Guide statt in einer Sitzung — und bekam
       dort „+10 XP · Tagesbonus" eingeblendet, bevor er irgendetwas getan hatte. Er KONNTE an
       der Stelle noch gar nichts tun. */
    render(<Probe />);

    expect(xp()).toBe(0);
    expect(toasts()).not.toMatch(/Tagesbonus/);
  });

  it('mit Karten: der Bonus kommt wie bisher', () => {
    act(() => {
      useProgressStore.getState().addCards(['M. deltoideus']);
    });
    render(<Probe />);

    expect(xp()).toBeGreaterThan(0);
  });

  it('er läuft NACH, sobald die erste Karte im Kasten liegt — nicht erst morgen', () => {
    const { rerender } = render(<Probe />);
    expect(xp()).toBe(0);

    act(() => {
      useProgressStore.getState().addCards(['M. soleus']);
    });
    rerender(<Probe />);

    expect(xp()).toBeGreaterThan(0);
  });

  it('und wird trotzdem nur EINMAL vergeben — die Sperre liegt im Store', () => {
    act(() => {
      useProgressStore.getState().addCards(['M. soleus']);
    });
    const { rerender } = render(<Probe />);
    const nachErstem = xp();

    rerender(<Probe />);
    expect(xp()).toBe(nachErstem);
  });
});
