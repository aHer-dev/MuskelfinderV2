/* =========================================================================
   BrandMark — die Marke, auf jeder Seite (Etappe 12b).
   src/components/layout/BrandMark.tsx

   Bis hierher trug nur `/heute` den Namen (in der StandRail), und die Icon-Rail zeigte
   das nackte Zeichen ohne ihn. Auf dem Handy — wo es gar keine Rail gibt — stand nirgends,
   wessen App das ueberhaupt ist.

   Jetzt haengt die Wortmarke in der Kopfzeile der Shell. Die Shell umschliesst JEDE Route,
   also ist die Marke damit auf jeder Seite — Desktop wie Handy, ohne dass eine Seite etwas
   dafuer tun muss. Sie fuehrt nach `/heute`: Ein Logo, das nicht nach Hause fuehrt, ist eine
   Enttaeuschung.

   Genau EINMAL pro Bildschirm. Darum ist das Zeichen aus der Icon-Rail und aus der StandRail
   verschwunden — dasselbe Logo zweimal auf einem Bildschirm ist kein Branding, sondern ein
   Versehen.
   ========================================================================= */

import { Link } from 'react-router-dom';
import { useThemeStore } from '../../store/useThemeStore';

export function BrandMark() {
  const theme = useThemeStore((s) => s.theme);

  /* Das Zeichen ist ein heller Keil mit Schatten — auf hellem Grund verschwaende er.
     Der helle Modus traegt darum die dunkle Fassung und umgekehrt. */
  const logo = `${import.meta.env.BASE_URL}logo/${theme === 'dark' ? 'af-logo.png' : 'af-logo-dark.png'}`;

  return (
    <Link
      to="/heute"
      className="brand-mark"
      aria-label="Anatomie Fokus — Muskelfinder, zur Startseite"
    >
      {/* Die Datei ist 985 × 892, nicht quadratisch. Die Rail zwang sie bis hierher in
          30 × 30 und stauchte den Keil um 10 %. Hier stehen die ECHTEN Masse im Markup
          (dafuer reserviert der Browser den richtigen Kasten, kein Layout-Sprung), die
          Groesse macht das CSS ueber die Hoehe. */}
      <img src={logo} alt="" width={985} height={892} aria-hidden="true" />
      <span className="brand-mark__text">
        <strong>Anatomie Fokus</strong>
        <em>Muskelfinder</em>
      </span>
    </Link>
  );
}
