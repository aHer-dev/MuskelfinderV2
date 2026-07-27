/* Der Install-Abschnitt zeigt in jedem der fünf Fälle etwas Sinnvolles.
   Getestet wird, WAS der Nutzer liest — nicht das Layout (React-Pixel bleiben
   ungetestet, siehe CLAUDE.md). */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { InstallAngebot } from '../../../pwa/install';

const angebot = vi.hoisted(() => ({ wert: 'menue-hinweis' as InstallAngebot }));
const install = vi.hoisted(() => vi.fn());

vi.mock('../../../hooks/useInstallAngebot', () => ({
  useInstallAngebot: () => ({ angebot: angebot.wert, install }),
}));

const { InstallSection } = await import('./InstallSection');

afterEach(() => {
  cleanup();
  install.mockReset();
});

const zeige = (wert: InstallAngebot) => {
  angebot.wert = wert;
  render(<InstallSection />);
};

describe('InstallSection', () => {
  it('hat in jedem Fall eine Überschrift', () => {
    for (const fall of ['laeuft-als-app', 'knopf', 'ios-anleitung', 'in-app-browser', 'menue-hinweis'] as const) {
      cleanup();
      zeige(fall);
      expect(screen.getByRole('heading', { name: /Als App aufs Handy/i })).toBeTruthy();
    }
  });

  it('zeigt bei "knopf" einen echten Knopf', () => {
    zeige('knopf');
    expect(screen.getByRole('button', { name: /installieren/i })).toBeTruthy();
  });

  it('zeigt in der installierten App KEINEN Knopf', () => {
    /* Ein Installationsknopf in der installierten App ist eine Sackgasse. */
    zeige('laeuft-als-app');
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText(/schon als installierte App/i)).toBeTruthy();
  });

  it('leitet auf iOS an, statt einen Knopf zu zeigen', () => {
    zeige('ios-anleitung');
    expect(screen.queryByRole('button')).toBeNull();
    /* „Home-Bildschirm" steht im Schritt UND im Hinweis darunter — beides gewollt. */
    expect(screen.getAllByText(/Home-Bildschirm/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Safari/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Teilen-Symbol/i)).toBeTruthy();
  });

  it('schickt aus dem In-App-Browser in den echten Browser', () => {
    zeige('in-app-browser');
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText(/eingebetteten Browser/i)).toBeTruthy();
  });

  it('verweist sonst auf das Browsermenü', () => {
    zeige('menue-hinweis');
    expect(screen.getByText(/App installieren/i)).toBeTruthy();
  });

  it('ruft beim Klick den Installationsdialog auf', async () => {
    install.mockResolvedValue('angenommen');
    zeige('knopf');
    screen.getByRole('button', { name: /installieren/i }).click();
    expect(install).toHaveBeenCalledOnce();
    expect(await screen.findByText(/auf dem Startbildschirm/i)).toBeTruthy();
  });

  it('bleibt nach Abbruch freundlich und blockiert nicht', async () => {
    install.mockResolvedValue('abgelehnt');
    zeige('knopf');
    screen.getByRole('button', { name: /installieren/i }).click();
    expect(await screen.findByText(/Abgebrochen/i)).toBeTruthy();
  });
});
