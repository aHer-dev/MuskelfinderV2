import type { FachangabenAbschnitt, FunktionsZeile } from '../types';
import { ortLabel } from './funktion-kurz';

/** Nur Trennzeichen außerhalb von Klammern sind Listengrenzen. */
function teile(text: string, trenner: string): string[] {
  const ergebnis: string[] = [];
  let tiefe = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if ('([{'.includes(text[i])) tiefe++;
    if (')]}'.includes(text[i])) tiefe = Math.max(0, tiefe - 1);
    if (tiefe === 0 && trenner.includes(text[i])) {
      ergebnis.push(text.slice(start, i).trim());
      start = i + 1;
    }
  }
  ergebnis.push(text.slice(start).trim());
  return ergebnis.filter(Boolean);
}

/** Präzisierungen desselben Orts dürfen nicht als weitere Ansatzstelle erscheinen. */
function istPraezisierung(vorher: string, text: string): boolean {
  return /^distale Hälfte$/i.test(text)
    || (/^Extremitas acromialis$/i.test(text) && /Clavicula$/i.test(vorher))
    || /^(?:C|Th|L|S)\d/.test(text)
    || /^[IVX]+(?: und [IVX]+)?$/.test(text)
    || /^lateral des Nasenrückens$/i.test(text)
    || (/^(?:Ala ossis ilii|Os pubis|Os sacrum|Femur|Tibia)(?:, .*)?$/i.test(vorher)
      && /^(?:Facies |Ramus |Condylus )/i.test(text))
    || /^Zeh(?:en)? [IVX\d.–-]+$/i.test(vorher);
}

function stellen(text: string): string[] {
  const eintraege: string[] = [];
  for (const teil of teile(text, ',')) {
    const letzter = eintraege.at(-1);
    if (letzter && istPraezisierung(letzter, teil)) {
      eintraege[eintraege.length - 1] += `, ${teil}`;
    } else {
      eintraege.push(teil);
    }
  }
  return eintraege;
}

/**
 * Ursprung/Ansatz: Komma, Semikolon, | und vorhandene Umbrüche als Listen lesen.
 * Muskelköpfe/-anteile bleiben als Gruppe erhalten, auch über mehrere Teiltexte.
 * „und“ und Schrägstriche bleiben im Text: Sie können gemeinsame Zusätze oder Synonyme
 * verbinden; daraus lässt sich ohne redaktionelle Zuordnung keine sichere Liste bilden.
 */
export function ursprungAnsatzAbschnitte(text: string): FachangabenAbschnitt[] {
  const abschnitte: FachangabenAbschnitt[] = [];
  for (const teil of teile(text, ';|\n\r')) {
    const doppelpunkt = teile(teil, ':');
    const hatLabel = doppelpunkt.length > 1;
    const label = hatLabel ? doppelpunkt[0] : undefined;
    const eintraege = stellen(hatLabel ? doppelpunkt.slice(1).join(': ') : teil);
    const vorher = abschnitte.at(-1);
    if (!hatLabel && vorher) vorher.eintraege.push(...eintraege);
    else if (eintraege.length > 0) abschnitte.push({ ...(label ? { label } : {}), eintraege });
  }
  return abschnitte;
}

/** Eine Bewegung pro Punkt, der Ort steht als Gruppenüberschrift darüber. */
export function funktionsAbschnitte(zeilen: readonly FunktionsZeile[]): FachangabenAbschnitt[] {
  return zeilen.map(({ orte, bewegungen }) => ({
    ...(orte.length > 0 ? { label: ortLabel(orte) } : {}),
    eintraege: [...bewegungen],
  }));
}
