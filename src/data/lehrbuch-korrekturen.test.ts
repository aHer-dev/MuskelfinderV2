/* =========================================================================
   Lehrbuch-Korrekturen — sie muessen stehen bleiben.
   src/data/lehrbuch-korrekturen.test.ts

   WARUM ES DAS GIBT: Die Fachdaten kommen aus der V1-Quelle und werden mit
   `npm run migrate:data` nach `src/data/generated/` geschrieben. Die Korrekturen
   unten sind in `generated/` nachgezogen — die V1-Quelle lag dabei nicht vor
   (2026-09-27) bzw. liegt ausserhalb des Repos (FPL, 2026-08-18). Ein erneutes
   `migrate:data` aus einer unkorrigierten Quelle drehte sie STILL zurueck: Der Build
   waere gruen, der Fehler wieder da. Dieser Test laesst ihn dann fallen.

   Jede Zeile ist ein Fehler, den der Projektinhaber im Lehrbuch geprueft hat.
   Wer hier eine Zeile aendert, braucht dafuer eine Buchstelle, keinen Grund.
   ========================================================================= */

import { describe, expect, it } from 'vitest';
import { getMuscleById } from './loader';
import { funktionAnzeige } from './funktion-kurz';
import type { Muscle } from '../types';

function muskel(id: string): Muscle {
  const m = getMuscleById(id);
  if (!m) throw new Error(`Muskel ${id} fehlt im Bestand`);
  return m;
}

/** Text in beiden Niveaus — die einfache Ansicht hat ihren eigenen Funktionstext. */
const texte = (m: Muscle) => [m.functionDescription, m.easy?.functionDescription ?? ''];

describe('Lehrbuch-Korrekturen bleiben stehen (auch nach migrate:data)', () => {
  it('M. flexor pollicis longus entspringt nicht am Humerus (2026-08-18)', () => {
    const m = muskel('flexor-pollicis-longus');
    expect(m.origin).not.toMatch(/humer/i);
    expect(m.joints).not.toContain('Art. cubiti');
  });

  it('M. semimembranosus zieht den Meniscus MEDIALIS nach dorsal (2026-09-27)', () => {
    for (const t of texte(muskel('semimembranosus'))) {
      expect(t).toMatch(/Meniscus medialis/);
      expect(t).not.toMatch(/Meniscus lateralis/);
    }
  });

  it('M. abductor digiti minimi (Hand) beugt im Grundgelenk, streckt in PIP/DIP (2026-09-27)', () => {
    const m = muskel('abductor-digiti-minimi-upper-hand-ulnarabduktion');
    for (const t of texte(m)) expect(t).not.toMatch(/MCP-Extension/);
    expect(funktionAnzeige(m)).toMatch(/Grundgelenk \(MCP\): .*Flexion/);
    expect(funktionAnzeige(m)).toMatch(/PIP \+ DIP: Extension/);
    expect(m.joints).toEqual(expect.arrayContaining(['MCP', 'PIP', 'DIP']));
  });

  it('M. sternocleidomastoideus: beidseitig Reklination des Kopfes, nicht Inklination (2026-09-27)', () => {
    const m = muskel('sternocleidomastoideus');
    for (const t of texte(m)) {
      expect(t).toMatch(/Reklination/);
      expect(t).not.toMatch(/Inklination/);
    }
    expect(funktionAnzeige(m)).not.toMatch(/Inklination/);
    expect(m.functions).not.toContain('inklination-bilateral');
  });

  it('Mm. lumbricales (Fuß) strecken Mittel- und Endgelenke, adduzieren zur Großzehe (2026-09-27)', () => {
    const m = muskel('lumbricales');
    for (const t of texte(m)) {
      expect(t).toMatch(/strecken ihre Mittel- und Endgelenke/);
      expect(t).toMatch(/zur Großzehe/);
      expect(t).not.toMatch(/zweiten Achse/);
    }
  });

  it('M. gluteus maximus: KRANIALE Anteile abduzieren, kaudale adduzieren (2026-09-27)', () => {
    const m = muskel('gluteus-maximus');
    for (const t of texte(m)) {
      expect(t).toMatch(/kranialen Anteile abduzieren/);
      expect(t).toMatch(/kaudalen Anteile adduzieren/);
      expect(t).not.toMatch(/lateralen Anteile/);
    }
    expect(m.functions).toContain('adduktion');
  });

  it('M. extensor carpi ulnaris ist über den Filter „Dorsalextension" auffindbar (2026-09-27)', () => {
    /* Kein Lehrbuch-Fehler, sondern ein Loch im Suchfilter: Der Text nannte die
       Dorsalextension, `functions` nicht — die Suche fand ihn darunter nicht. */
    expect(muskel('extensor-carpi-ulnaris').functions).toContain('dorsalextension');
  });
});
