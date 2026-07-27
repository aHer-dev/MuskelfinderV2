import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { JointGroupPicker } from './JointGroupPicker';
import { getJointGroup, getJointGroups, neueKartenDerAuswahl } from '../../../data/joint-groups';
import { MAX_DAILY_DOSE } from '../../../data/today';
import { useProfileStore } from '../../../store/useProfileStore';
import { useProgressStore } from '../../../store/useProgressStore';
import { useToastStore } from '../../../store/useToastStore';

function renderPicker() {
  return render(<JointGroupPicker headingId="test-gelenke" />);
}

/** Das Kästchen einer Gruppe — über das Label, nicht über die Position (die hängt am Beruf). */
function gruppe(label: string): HTMLElement {
  return screen.getByRole('checkbox', { name: new RegExp(label.replace('&', '&')) });
}

/** Die Zeile um das Kästchen — dort stehen Zahl und Hinweis. */
function zeile(label: string): HTMLElement {
  return gruppe(label).closest('label') as HTMLElement;
}

function anlegenKnopf(): HTMLElement {
  return screen.getByRole('button', { name: /anlegen/i });
}

function imKasten(): string[] {
  return Object.keys(useProgressStore.getState().flashcards.cards);
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

  it('Ankreuzen allein legt NICHTS an — erst der Knopf tut es', () => {
    /* Der Kern der Mehrfachwahl: Bis zum 2026-07-27 legte jeder Klick sofort an, und auf
       `/heute` war danach der ganze Auswahlbildschirm weg (der Kasten war nicht mehr leer).
       Wer „Hand und Ellenbogen" lernt, konnte die zweite Gruppe dort nicht mehr wählen. */
    renderPicker();
    fireEvent.click(gruppe('Hand'));

    expect(imKasten()).toEqual([]);
    expect(gruppe('Hand')).toBeChecked();
  });

  it('mehrere Gruppen auf einmal — Hand + Ellenbogen in EINEM Zug', () => {
    const hand = getJointGroup('hand')!;
    const ellenbogen = getJointGroup('ellenbogen')!;
    renderPicker();

    fireEvent.click(gruppe('Hand'));
    fireEvent.click(gruppe('Ellenbogen'));
    fireEvent.click(anlegenKnopf());

    const erwartet = neueKartenDerAuswahl([hand, ellenbogen], {});
    expect(imKasten().sort()).toEqual([...erwartet].sort());
    expect(erwartet.length).toBeGreaterThan(hand.muscles.length);
  });

  it('die Zahl am Knopf ist die VEREINIGUNG, nicht die Summe der Zeilen', () => {
    /* 26 Muskeln liegen in mehreren Gruppen. „Ellenbogen 17" + „Schultergelenk 11" ergeben
       nicht 28 Karten — ein Knopf, der 28 verspricht und 26 anlegt, lügt. */
    const ellenbogen = getJointGroup('ellenbogen')!;
    const schulter = getJointGroup('schultergelenk')!;
    const vereinigung = neueKartenDerAuswahl([ellenbogen, schulter], {});
    const summe = ellenbogen.muscles.length + schulter.muscles.length;
    expect(vereinigung.length).toBeLessThan(summe);

    renderPicker();
    fireEvent.click(gruppe('Ellenbogen'));
    fireEvent.click(gruppe('Schultergelenk'));

    expect(anlegenKnopf()).toHaveTextContent(`${vereinigung.length} Karten anlegen`);
    // Und die Differenz wird benannt, statt sie stillschweigend zu verschlucken.
    expect(screen.getByText(new RegExp(`${summe - vereinigung.length} Muskeln liegen in mehreren`))).toBeInTheDocument();

    fireEvent.click(anlegenKnopf());
    expect(imKasten()).toHaveLength(vereinigung.length);
  });

  it('sagt hinterher, was passiert ist — sonst merkt niemand den Klick', () => {
    /* Gemessen im UX-Review 2026-07-26: Der einzige Hinweis auf einen erfolgreichen Klick war
       das Umbauen der ganzen Seite, und auf dem Handy blieb die Scrollposition dabei stehen.
       Der einzige Toast in diesem Moment war „+10 XP · Tagesbonus" — der gehört zum
       App-Start, nicht zur Handlung. */
    const ellenbogen = getJointGroup('ellenbogen')!;
    renderPicker();
    fireEvent.click(gruppe('Ellenbogen'));
    fireEvent.click(anlegenKnopf());

    const texte = useToastStore.getState().toasts.map((t) => t.message);
    expect(texte.some((t) => t.includes(`${ellenbogen.muscles.length}`) && /angelegt/.test(t))).toBe(
      true,
    );
    expect(texte.some((t) => t.includes('Ellenbogen'))).toBe(true);
  });

  it('nach dem Anlegen ist die Auswahl leer — kein zweiter Klick legt dasselbe nochmal an', () => {
    renderPicker();
    fireEvent.click(gruppe('Ellenbogen'));
    fireEvent.click(anlegenKnopf());

    expect(screen.queryByRole('button', { name: /anlegen/i })).not.toBeInTheDocument();
    expect(gruppe('Ellenbogen')).not.toBeChecked();
  });

  it('„Auswahl aufheben" ist der Rückweg VOR dem Anlegen', () => {
    renderPicker();
    fireEvent.click(gruppe('Hand'));
    fireEvent.click(gruppe('Ellenbogen'));
    fireEvent.click(screen.getByRole('button', { name: /Auswahl aufheben/i }));

    expect(imKasten()).toEqual([]);
    expect(screen.queryByRole('button', { name: /anlegen/i })).not.toBeInTheDocument();
    expect(gruppe('Hand')).not.toBeChecked();
  });

  it('ein zweiter Klick nimmt die Gruppe wieder aus der Auswahl', () => {
    const hand = getJointGroup('hand')!;
    renderPicker();
    fireEvent.click(gruppe('Hand'));
    fireEvent.click(gruppe('Ellenbogen'));
    fireEvent.click(gruppe('Ellenbogen'));

    expect(anlegenKnopf()).toHaveTextContent(`${hand.muscles.length} Karten anlegen`);
    fireEvent.click(anlegenKnopf());
    expect(imKasten().sort()).toEqual([...hand.muscles].sort());
  });

  it('die Zahl in der Zeile ist die Zahl der NEUEN Karten, nicht die Mitgliederzahl', () => {
    /* 26 Muskeln liegen in mehreren Gruppen. Nach „Ellenbogen" enthält „Schultergelenk"
       noch die Zweigelenker (M. biceps brachii, Caput longum des Triceps) — eine Zeile, die
       dann weiter 11 verspricht, aber 9 anlegt, lügt. */
    const schulter = getJointGroup('schultergelenk')!;
    renderPicker();
    expect(
      within(zeile('Schultergelenk')).getByText(String(schulter.muscles.length)),
    ).toBeInTheDocument();

    fireEvent.click(gruppe('Ellenbogen'));
    fireEvent.click(anlegenKnopf());

    const rest = schulter.muscles.filter(
      (n) => !getJointGroup('ellenbogen')!.muscles.includes(n),
    ).length;
    expect(rest).toBeLessThan(schulter.muscles.length); // es gibt wirklich eine Überlappung
    expect(within(zeile('Schultergelenk')).getByText(String(rest))).toBeInTheDocument();
    expect(gruppe('Schultergelenk')).toHaveAccessibleName(new RegExp(`${rest} neue`));
  });

  it('eine vollständig vorhandene Gruppe ist erledigt, nicht ankreuzbar', () => {
    const knie = getJointGroup('kniegelenk')!;
    useProgressStore.getState().addCards(knie.muscles);
    renderPicker();

    const box = gruppe('Kniegelenk');
    expect(box).toBeDisabled();
    expect(box).toHaveAccessibleName(/liegen schon/i);
  });

  it('ohne Profil gibt es keine Bänder, aber alle Gruppen', () => {
    useProfileStore.setState({ profession: null, examDate: null });
    renderPicker();
    expect(screen.queryByRole('heading', { name: /Typisch für dich/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(getJointGroups().length);
  });
});

describe('Rahmen-Invariante 2 bleibt gewahrt (ADR 0009)', () => {
  it('ohne Auswahl gibt es KEINEN Primärbutton — dort ist das Wählen die Aufgabe', () => {
    /* ADR 0009 nimmt dem leeren Kasten den einen Primärbutton, weil ein Vorschlag dort wieder
       für den Schüler entscheiden würde. Die Aktionsleiste darf das nicht zurückholen. */
    const { container } = renderPicker();
    expect(container.querySelectorAll('.btn--primary')).toHaveLength(0);
  });

  it('mit Auswahl gibt es GENAU EINEN — die Folge einer Wahl, die der Schüler getroffen hat', () => {
    const { container } = renderPicker();
    fireEvent.click(gruppe('Hand'));
    fireEvent.click(gruppe('Ellenbogen'));
    expect(container.querySelectorAll('.btn--primary')).toHaveLength(1);
  });
});

describe('Eine große Mehrfachwahl fragt nach (UX-Review-Regel 3)', () => {
  /* „Eine Handlung, die 121 Karten anlegt, braucht eine Zahl, eine Rückfrage und einen
     Rückweg." Die Schwelle ist `MAX_DAILY_DOSE` — die größte Tagesdosis, die die App je
     ansetzt. Darunter bleibt die Wahl reibungslos, darüber wird gefragt. */
  let confirmSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
  });
  afterEach(() => {
    confirmSpy.mockRestore();
  });

  it('eine einzelne Gruppe fragt NICHT nach', () => {
    renderPicker();
    fireEvent.click(gruppe('Hand'));
    fireEvent.click(anlegenKnopf());

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(imKasten().length).toBeGreaterThan(0);
  });

  it('der Regelfall aus dem Kurs — Hand + Ellenbogen — läuft ohne Rückfrage durch', () => {
    /* Der Fall, den der Projektinhaber genannt hat. Eine Rückfrage für zwei benachbarte
       Gruppen wäre genau die Reibung, die die Mehrfachwahl abschaffen soll. */
    renderPicker();
    fireEvent.click(gruppe('Hand'));
    fireEvent.click(gruppe('Ellenbogen'));
    const versprochen = Number(anlegenKnopf().textContent?.match(/\d+/)?.[0]);
    fireEvent.click(anlegenKnopf());

    expect(versprochen).toBeLessThan(MAX_DAILY_DOSE);
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(imKasten()).toHaveLength(versprochen);
  });

  it('ab der größten Tagesdosis fragt sie nach — und ein „Nein" legt nichts an', () => {
    confirmSpy.mockReturnValue(false);
    renderPicker();
    for (const g of getJointGroups()) fireEvent.click(gruppe(g.label));

    const versprochen = Number(anlegenKnopf().textContent?.match(/\d+/)?.[0]);
    expect(versprochen).toBeGreaterThanOrEqual(MAX_DAILY_DOSE);

    fireEvent.click(anlegenKnopf());
    expect(confirmSpy).toHaveBeenCalled();
    expect(imKasten()).toEqual([]);
    // Die Auswahl bleibt stehen: Ein „Nein" ist kein Zurücksetzen.
    expect(gruppe('Hand')).toBeChecked();
  });

  it('… und ein „Ja" legt genau die versprochene Zahl an', () => {
    renderPicker();
    for (const g of getJointGroups()) fireEvent.click(gruppe(g.label));
    const versprochen = Number(anlegenKnopf().textContent?.match(/\d+/)?.[0]);

    fireEvent.click(anlegenKnopf());
    expect(imKasten()).toHaveLength(versprochen);
  });
});
