import { useCallback, useSyncExternalStore } from 'react';
import {
  type InstallAngebot,
  type InstallErgebnis,
  angebot,
  beobachte,
  installieren,
  leseUmgebung,
  promptVorhanden,
} from '../pwa/install';

/**
 * Bindet den Install-Puffer an React. `useSyncExternalStore` statt
 * `useState` + `useEffect`: Das `beforeinstallprompt`-Ereignis trifft oft ein,
 * **bevor** React gemountet hat — ein Effekt-Listener kaeme zu spaet, der
 * Knopf blieb aus. Der Puffer in `pwa/install.ts` lauscht ab Import; hier wird
 * nur noch gelesen und abonniert.
 *
 * Der Schnappschuss ist ein String, also referenziell stabil — React sieht
 * keine Endlosschleife, obwohl bei jedem Aufruf neu gemessen wird.
 */
export function useInstallAngebot(): {
  angebot: InstallAngebot;
  install: () => Promise<InstallErgebnis>;
} {
  const zustand = useSyncExternalStore(
    beobachte,
    () => angebot(leseUmgebung(promptVorhanden())),
    /* Ohne DOM (SSR/Tests) gibt es nichts anzubieten. */
    () => 'menue-hinweis' as InstallAngebot,
  );

  const install = useCallback(() => installieren(), []);
  return { angebot: zustand, install };
}
