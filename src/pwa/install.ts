/* =========================================================================
   „Auf dem Handy installieren" — was koennen wir auf DIESEM Gerät anbieten?
   src/pwa/install.ts

   WARUM ES DAS GIBT: Die App erfuellt die Installationskriterien schon lange
   (Manifest, Service Worker, Icons, HTTPS). Trotzdem klappte die Installation
   bei einem Nutzer und beim naechsten nicht — weil es **kein eigenes Angebot**
   gab und damit alles davon abhing, ob der Browser von sich aus fragt:

   - **Chrome/Android** hat die automatische Einblendleiste abgeschafft. Der
     Eintrag steckt im ⋮-Menue, sein Wortlaut wechselt mit der Version.
   - **iOS** kennt `beforeinstallprompt` **nicht** — dort gibt es nur den Weg
     ueber Teilen → „Zum Home-Bildschirm". Kein Knopf kann das ersetzen, nur
     eine Anleitung.
   - **In-App-Browser** (Instagram, Facebook, Android-WebView) koennen
     grundsaetzlich **nicht** installieren. Ohne Hinweis sucht der Nutzer
     endlos nach einem Menuepunkt, den es dort nicht gibt.

   AUFTEILUNG: `angebot()` ist eine reine Funktion ueber einem Umgebungs-Objekt
   und damit ohne Browser testbar; `leseUmgebung()` ist die einzige Stelle, die
   `window`/`navigator` anfasst. So bleibt die Fallunterscheidung pruefbar.

   ⚠️ UA-Erkennung, wo es nicht anders geht: Fuer „ist das iOS?" und „ist das ein
   In-App-Browser?" gibt es **keine** Feature-Erkennung. Ueberall sonst wird
   auf Faehigkeiten geprueft, nicht auf Namen.
   ========================================================================= */

/** Das Ereignis, mit dem Chromium ein Installationsangebot durchreicht. */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Was der Nutzer auf diesem Gerät zu sehen bekommt. */
export type InstallAngebot =
  /** Laeuft bereits als installierte App — nichts anzubieten. */
  | 'laeuft-als-app'
  /** Der Browser hat ein Angebot durchgereicht: echter Knopf. */
  | 'knopf'
  /** iOS: nur die Anleitung ueber das Teilen-Menue. */
  | 'ios-anleitung'
  /** In-App-Browser: erst im echten Browser oeffnen. */
  | 'in-app-browser'
  /** Kein Angebot, kein bekannter Sonderfall — Menue-Hinweis. */
  | 'menue-hinweis';

export interface Umgebung {
  /** Laeuft im App-Fenster statt im Browser-Tab. */
  standalone: boolean;
  /** iOS oder iPadOS. */
  ios: boolean;
  /** Eingebetteter Webview (Instagram, Facebook, Android-WebView …). */
  inAppBrowser: boolean;
  /** Ein `beforeinstallprompt` liegt bereit. */
  promptVorhanden: boolean;
}

/**
 * Die Reihenfolge ist die Aussage:
 *
 * 1. **Schon installiert** schlaegt alles — ein Installationsknopf in der
 *    installierten App ist eine Sackgasse.
 * 2. **In-App-Browser vor iOS**: In einem Instagram-Webview auf dem iPhone
 *    fuehrt die iOS-Anleitung ins Leere, weil es dort kein Teilen-Menue mit
 *    „Zum Home-Bildschirm" gibt. Erst rausschicken, dann anleiten.
 * 3. **Echter Prompt vor Anleitung** — ein Knopf ist immer besser als Text.
 */
export function angebot(u: Umgebung): InstallAngebot {
  if (u.standalone) return 'laeuft-als-app';
  if (u.inAppBrowser) return 'in-app-browser';
  if (u.promptVorhanden) return 'knopf';
  if (u.ios) return 'ios-anleitung';
  return 'menue-hinweis';
}

/* ---- Umgebung lesen --------------------------------------------------- */

/** Anzeigemodi, die „laeuft als App" bedeuten. */
const APP_MODI = ['standalone', 'fullscreen', 'minimal-ui', 'window-controls-overlay'];

function istStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const alsApp = APP_MODI.some((m) => window.matchMedia?.(`(display-mode: ${m})`).matches);
  /* iOS meldet den Modus nicht ueber `display-mode`, sondern ueber dieses
     alte, nicht standardisierte Flag. Ohne es gilt eine vom Home-Bildschirm
     gestartete App auf dem iPhone als Browser-Tab. */
  const iosFlag = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return alsApp || iosFlag;
}

function istIos(ua: string, plattform: string, touchpunkte: number): boolean {
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  /* iPadOS 13+ gibt sich als Mac aus. Ein Mac mit Touch ist praktisch immer
     ein iPad — `maxTouchPoints` ist hier das einzige Unterscheidungsmerkmal. */
  return plattform === 'MacIntel' && touchpunkte > 1;
}

/* Marker eingebetteter Webviews. `; wv)` ist der verlaessliche Hinweis auf
   Android-WebView; die uebrigen sind App-eigene Kennungen. */
const IN_APP_MARKER = [
  'FBAN', 'FBAV', 'FB_IAB', 'Instagram', 'Line/', 'MicroMessenger',
  'TikTok', 'Snapchat', 'Pinterest', '; wv)', 'GSA/',
];

function istInAppBrowser(ua: string): boolean {
  return IN_APP_MARKER.some((m) => ua.includes(m));
}

export function leseUmgebung(promptVorhanden: boolean): Umgebung {
  if (typeof navigator === 'undefined') {
    return { standalone: false, ios: false, inAppBrowser: false, promptVorhanden };
  }
  const ua = navigator.userAgent ?? '';
  const nav = navigator as Navigator & { platform?: string };
  return {
    standalone: istStandalone(),
    ios: istIos(ua, nav.platform ?? '', navigator.maxTouchPoints ?? 0),
    inAppBrowser: istInAppBrowser(ua),
    promptVorhanden,
  };
}

/* ---- Der Ereignis-Puffer ---------------------------------------------- */
/* `beforeinstallprompt` feuert oft, BEVOR React gemountet hat. Ein Listener,
   der erst in einem `useEffect` gesetzt wird, verpasst es — dann bleibt der
   Knopf aus, obwohl der Browser installieren wuerde. Deshalb wird hier beim
   Import gelauscht und das Ereignis gepuffert. */

let gepuffert: BeforeInstallPromptEvent | null = null;
let installiert = false;
const hoerer = new Set<() => void>();

function melden(): void {
  for (const h of hoerer) h();
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    /* Ohne `preventDefault` verwirft Chromium das Ereignis und der spaetere
       `prompt()`-Aufruf schlaegt fehl. */
    e.preventDefault();
    gepuffert = e as BeforeInstallPromptEvent;
    melden();
  });
  window.addEventListener('appinstalled', () => {
    installiert = true;
    gepuffert = null;
    melden();
  });
}

/** Fuer Tests: den Modulzustand zuruecksetzen. */
export function _resetInstallZustand(): void {
  gepuffert = null;
  installiert = false;
  hoerer.clear();
}

export function promptVorhanden(): boolean {
  return gepuffert !== null;
}

export function wurdeInstalliert(): boolean {
  return installiert;
}

/** Meldet Änderungen am Angebot. Rueckgabe: Abmeldefunktion. */
export function beobachte(h: () => void): () => void {
  hoerer.add(h);
  return () => hoerer.delete(h);
}

export type InstallErgebnis = 'angenommen' | 'abgelehnt' | 'nicht-verfuegbar';

/**
 * Zeigt den Browser-Dialog. **Ein Ereignis laesst sich nur einmal verwenden** —
 * danach ist der Puffer leer und der Knopf verschwindet, egal wie der Nutzer
 * entschieden hat. Lehnt er ab, reicht Chromium spaeter ein neues Ereignis nach.
 */
export async function installieren(): Promise<InstallErgebnis> {
  const e = gepuffert;
  if (!e) return 'nicht-verfuegbar';
  gepuffert = null;
  melden();
  await e.prompt();
  const { outcome } = await e.userChoice;
  return outcome === 'accepted' ? 'angenommen' : 'abgelehnt';
}
