/** Layout-Prüfung am gebauten Ergebnis; geteilte Listen auch in der Lernkarte messen. */
export async function pruefeFachangaben({ page, goto, runAxe, setTheme }, record) {
  const viewport = page.viewportSize();
  const messen = async (wo, root, erwarteteUrspruenge) => {
    const befunde = await page.locator(root).evaluate((el, anzahl) => {
      const out = [];
      const angaben = [...el.querySelectorAll('.fachangabe')];
      if (angaben.length < 3) out.push('Ursprung, Ansatz oder Funktion fehlen als Liste');
      if (anzahl !== undefined && angaben[0]?.querySelectorAll('li').length !== anzahl) {
        out.push(`Ursprung: ${angaben[0]?.querySelectorAll('li').length ?? 0} statt ${anzahl} Punkte`);
      }
      for (const liste of el.querySelectorAll('.fachangabe__liste')) {
        let unten = null;
        for (const item of liste.children) {
          const r = item.getBoundingClientRect();
          if (unten !== null && r.top < unten - 1) out.push('Listenpunkte stehen nebeneinander');
          unten = r.bottom;
        }
      }
      const d = document.documentElement;
      if (d.scrollWidth > d.clientWidth + 1) out.push(`horizontaler Überlauf: ${d.scrollWidth} > ${d.clientWidth}`);
      return out;
    }, erwarteteUrspruenge);
    for (const befund of befunde) record(wo, 'FACHANGABEN', befund);
  };

  for (const vp of [
    { width: 1440, height: 900 }, { width: 390, height: 664 }, { width: 320, height: 568 },
  ]) {
    await page.setViewportSize(vp);
    for (const [id, urspruenge] of [['latissimus-dorsi', 4], ['biceps-brachii', 2], ['flexor-pollicis-brevis', 4]]) {
      const route = `/muskel/${id}`;
      await goto(route);
      for (const modus of ['Fachlich', 'Einfach']) {
        await page.getByRole('button', { name: modus, exact: true }).click();
        const wo = `${route} ${modus} @${vp.width}`;
        await messen(wo, '.datalist', urspruenge);
        for (const theme of ['light', 'dark']) {
          await setTheme(theme);
          const v = await runAxe();
          for (const x of v) record(wo, `axe ${theme}`, `${x.id} — ${x.msg}`);
        }
        await setTheme('light');
      }
    }

    await goto('/lernkarten');
    await page.locator('.btn--primary').first().click();
    await page.getByRole('button', { name: 'Karte aufdecken', exact: true }).click();
    await page.locator('.flashcard--revealed').waitFor();
    await page.waitForTimeout(450); // Drehung beenden, bevor die Geometrie gemessen wird.
    await messen(`/lernkarten (aufgedeckt) @${vp.width}`, '.flashcard__facts');
  }
  await page.setViewportSize(viewport);
}

/** Auf langen Karten müssen Aufdecken UND Bewerten ohne vorheriges Scrollen erreichbar sein. */
export async function pruefeLangeLernkarte({ page, goto, runAxe, setTheme }, record) {
  for (const vp of [
    { width: 1440, height: 900 }, { width: 390, height: 664 }, { width: 320, height: 568 },
  ]) {
    await page.setViewportSize(vp);
    await goto('/lernkarten');
    await page.locator('.btn--primary').first().click();
    await page.locator('.flashcard').waitFor();
    await page.waitForTimeout(600);
    const name = await page.locator('.flashcard__back-name').textContent();
    const punkte = await page.locator('.flashcard__facts li').count();
    if (name !== 'M. gluteus maximus' || punkte < 10) {
      record(`/lernkarten (lange Karte) @${vp.width}`, 'INHALT', `falscher Prüffall: ${name}, ${punkte} Punkte`);
    }
    for (const phase of ['Aufdecken', 'Bewerten']) {
      if (phase === 'Bewerten') {
        await page.keyboard.press('Space'); // Kein Klick, der die Leiste automatisch hinscrollt.
        await page.locator('.flashcard--revealed').waitFor();
        await page.waitForTimeout(450);
      }
      const wo = `/lernkarten (lange Karte, ${phase}) @${vp.width}`;
      const lage = await page.locator('.fc-actions').evaluate((el) => {
        const r = el.getBoundingClientRect();
        const tabbar = document.querySelector('.tabbar')?.getBoundingClientRect();
        return { oben: r.top, unten: r.bottom, vh: innerHeight, scrollY,
          tabbarOben: tabbar?.height > 0 ? tabbar.top : null };
      });
      if (lage.oben < 0 || lage.unten > lage.vh + 1) {
        record(wo, 'AKTIONEN-UNTER-FALZ', `Leiste bei y=${Math.round(lage.oben)}–${Math.round(lage.unten)} auf ${lage.vh} px`);
      }
      if (lage.scrollY !== 0) record(wo, 'SCROLL', 'Messung startet nicht oben');
      if (lage.tabbarOben !== null && lage.unten > lage.tabbarOben) {
        record(wo, 'UNTER-TABBAR', 'Leiste liegt unter der Tab-Leiste');
      }
      for (const theme of ['light', 'dark']) {
        await setTheme(theme);
        await page.waitForTimeout(250);
        for (const x of await runAxe()) record(wo, `axe ${theme}`, `${x.id} — ${x.msg}`);
      }
      await setTheme('light');
    }
  }
}
