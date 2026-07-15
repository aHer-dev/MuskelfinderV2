/* =========================================================================
   Browser-Pruef-Harness — startet den Preview-Server, faehrt Chromium, laedt axe.
   scripts/checks/harness.mjs

   Gemeinsame Basis fuer `check:oberflaeche` und `check:wege`. Beide brauchen
   dasselbe: einen laufenden Build, einen frischen React-Baum je Route (der
   HashRouter laedt sonst nicht neu), axe-core im Ruhe- UND Hover-Zustand.

   Setzt einen fertigen `dist/`-Build voraus (`npm run build`). `npm run verify`
   baut vorher; fuer den Einzelaufruf sagt das Skript, wenn dist fehlt.
   ========================================================================= */

import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const AXE = readFileSync(join(ROOT, 'node_modules/axe-core/axe.min.js'), 'utf8');
const PORT = Number(process.env.CHECK_PORT ?? 4319);
const BASE = `http://localhost:${PORT}/MuskelfinderV2/`;

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];

/** Preview-Server starten und warten, bis er antwortet. */
async function startPreview() {
  if (!existsSync(join(ROOT, 'dist', 'index.html'))) {
    console.error('✗ Kein Build gefunden. Erst `npm run build`, dann diese Pruefung.');
    process.exit(2);
  }
  const bin = join(ROOT, 'node_modules', '.bin', 'vite');
  const srv = spawn(bin, ['preview', '--port', String(PORT), '--strictPort'], {
    cwd: ROOT, stdio: 'ignore',
  });
  // Auf Antwort warten (max ~20 s)
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(BASE);
      if (res.ok) return srv;
    } catch { /* noch nicht bereit */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  srv.kill();
  throw new Error('Preview-Server ist nicht hochgekommen');
}

/**
 * Fuehrt `fn(ctx)` gegen einen laufenden Build aus und raeumt danach auf.
 * `ctx` enthaelt: page, goto, runAxe, errors, BASE, shot.
 *
 * @param {object} opts
 * @param {Function=} opts.seed   addInitScript-Funktion (leer = frischer Zustand)
 * @param {{width:number,height:number}=} opts.viewport
 */
export async function withApp(fn, opts = {}) {
  const srv = await startPreview();
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: opts.viewport ?? { width: 1440, height: 900 },
  });
  if (opts.seed) await context.addInitScript(opts.seed);

  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`PAGEERROR ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  /** Route oeffnen UND neu laden — sonst bleibt ein kaputter Baum stehen. */
  const goto = async (route) => {
    await page.goto(`${BASE}#${route}`, { waitUntil: 'networkidle' });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
  };

  /** axe im aktuellen Zustand. `rules` optional (Default: volle WCAG-Tags). */
  const runAxe = async (rulesOrTags) => {
    await page.evaluate(AXE);
    return page.evaluate(async (arg) => {
      const opt = Array.isArray(arg)
        ? { runOnly: { type: 'tag', values: arg } }
        : arg
          ? { runOnly: { type: 'rule', values: arg.rules } }
          : {};
      const r = await window.axe.run(document, opt);
      return r.violations.map((v) => ({
        id: v.id, impact: v.impact, n: v.nodes.length,
        target: v.nodes[0]?.target?.join(' ')?.slice(0, 70),
        msg: v.nodes[0]?.failureSummary?.split('\n').filter(Boolean).pop()?.slice(0, 110),
      }));
    }, rulesOrTags ?? AXE_TAGS);
  };

  const setTheme = (t) => page.evaluate((x) => document.documentElement.setAttribute('data-theme', x), t);
  const shot = (name) => page.screenshot({ path: join(ROOT, 'dist', '..', 'check-shots', name), fullPage: true }).catch(() => {});

  try {
    return await fn({ page, goto, runAxe, setTheme, errors, BASE, AXE_TAGS, shot });
  } finally {
    await browser.close();
    srv.kill();
  }
}
