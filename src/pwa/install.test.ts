/* Welches Install-Angebot gilt auf welchem Gerät.
   Die Fallunterscheidung ist eine reine Funktion — deshalb ist sie hier ohne
   Browser vollstaendig durchgetestet, inklusive der Reihenfolge, die die
   eigentliche Aussage traegt (siehe `install.ts`). */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  type Umgebung,
  _resetInstallZustand,
  angebot,
  beobachte,
  installieren,
  leseUmgebung,
  promptVorhanden,
} from './install';

const umgebung = (over: Partial<Umgebung> = {}): Umgebung => ({
  standalone: false, ios: false, inAppBrowser: false, promptVorhanden: false, ...over,
});

afterEach(() => {
  _resetInstallZustand();
  vi.unstubAllGlobals();
});

describe('angebot', () => {
  it('bietet nichts an, wenn die App schon installiert laeuft', () => {
    expect(angebot(umgebung({ standalone: true }))).toBe('laeuft-als-app');
  });

  it('schlaegt alles andere, auch wenn ein Prompt vorliegt', () => {
    /* Ein Installationsknopf IN der installierten App ist eine Sackgasse. */
    expect(angebot(umgebung({ standalone: true, promptVorhanden: true, ios: true })))
      .toBe('laeuft-als-app');
  });

  it('schickt aus dem In-App-Browser heraus, bevor es anleitet', () => {
    /* In einem Instagram-Webview auf dem iPhone fuehrt die iOS-Anleitung ins
       Leere — es gibt dort kein „Zum Home-Bildschirm". */
    expect(angebot(umgebung({ inAppBrowser: true, ios: true }))).toBe('in-app-browser');
  });

  it('zieht den echten Knopf der Anleitung vor', () => {
    expect(angebot(umgebung({ promptVorhanden: true, ios: true }))).toBe('knopf');
  });

  it('leitet auf iOS ohne Prompt an', () => {
    expect(angebot(umgebung({ ios: true }))).toBe('ios-anleitung');
  });

  it('verweist sonst auf das Browsermenue', () => {
    expect(angebot(umgebung())).toBe('menue-hinweis');
  });
});

describe('leseUmgebung', () => {
  const mitNavigator = (ua: string, extra: Record<string, unknown> = {}) => {
    vi.stubGlobal('navigator', { userAgent: ua, maxTouchPoints: 0, platform: '', ...extra });
    vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) });
  };

  it('erkennt iPhone und iPad', () => {
    mitNavigator('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari');
    expect(leseUmgebung(false).ios).toBe(true);
  });

  it('erkennt iPadOS, das sich als Mac ausgibt', () => {
    /* iPadOS 13+ meldet „MacIntel"; nur maxTouchPoints unterscheidet es. */
    mitNavigator('Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari', {
      platform: 'MacIntel', maxTouchPoints: 5,
    });
    expect(leseUmgebung(false).ios).toBe(true);
  });

  it('haelt einen echten Mac ohne Touch fuer keinen iPad', () => {
    mitNavigator('Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari', {
      platform: 'MacIntel', maxTouchPoints: 0,
    });
    expect(leseUmgebung(false).ios).toBe(false);
  });

  it('erkennt den Instagram- und Facebook-Webview', () => {
    mitNavigator('Mozilla/5.0 (iPhone) Instagram 300.0.0.0');
    expect(leseUmgebung(false).inAppBrowser).toBe(true);
    mitNavigator('Mozilla/5.0 (Linux; Android 14) [FBAN/FB4A;FBAV/450.0]');
    expect(leseUmgebung(false).inAppBrowser).toBe(true);
  });

  it('erkennt den Android-WebView an "; wv)"', () => {
    mitNavigator('Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/X; wv) Chrome/120');
    expect(leseUmgebung(false).inAppBrowser).toBe(true);
  });

  it('haelt normales Chrome auf Android fuer keinen Webview', () => {
    mitNavigator('Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/120 Mobile Safari');
    const u = leseUmgebung(false);
    expect(u.inAppBrowser).toBe(false);
    expect(u.ios).toBe(false);
  });

  it('erkennt den App-Modus am display-mode', () => {
    vi.stubGlobal('navigator', { userAgent: 'Chrome', maxTouchPoints: 0, platform: '' });
    vi.stubGlobal('window', {
      matchMedia: (q: string) => ({ matches: q.includes('standalone') }),
    });
    expect(leseUmgebung(false).standalone).toBe(true);
  });

  it('erkennt den App-Modus auf iOS am navigator.standalone-Flag', () => {
    /* iOS meldet den Anzeigemodus nicht ueber display-mode. */
    vi.stubGlobal('navigator', {
      userAgent: 'iPhone', maxTouchPoints: 5, platform: '', standalone: true,
    });
    vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) });
    expect(leseUmgebung(false).standalone).toBe(true);
  });
});

describe('installieren', () => {
  it('meldet "nicht-verfuegbar" ohne gepuffertes Ereignis', async () => {
    expect(await installieren()).toBe('nicht-verfuegbar');
  });

  it('reicht die Entscheidung des Nutzers durch und leert den Puffer', async () => {
    const prompt = vi.fn().mockResolvedValue(undefined);
    const ereignis = {
      preventDefault: vi.fn(),
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    };
    window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), ereignis));
    expect(promptVorhanden()).toBe(true);

    expect(await installieren()).toBe('angenommen');
    expect(prompt).toHaveBeenCalledOnce();
    /* Ein Ereignis laesst sich nur einmal verwenden. */
    expect(promptVorhanden()).toBe(false);
    expect(await installieren()).toBe('nicht-verfuegbar');
  });

  it('benachrichtigt Beobachter, wenn ein Angebot eintrifft', () => {
    const gerufen = vi.fn();
    beobachte(gerufen);
    window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), {
      preventDefault: vi.fn(),
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: 'dismissed' as const }),
    }));
    expect(gerufen).toHaveBeenCalled();
  });

  it('meldet ab, wenn der Beobachter geht', () => {
    const gerufen = vi.fn();
    beobachte(gerufen)();
    window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), {
      preventDefault: vi.fn(), prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: 'dismissed' as const }),
    }));
    expect(gerufen).not.toHaveBeenCalled();
  });
});
