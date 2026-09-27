/* =========================================================================
   Funktion in Kurzform: je Gelenk die Bewegungen (Etappe 15).
   src/data/funktion-kurz.ts

   WARUM ES DAS GIBT: Unter „Funktion" stand bisher nur der ausformulierte Text
   (`functionDescription`, bis 306 Zeichen). Wer nachschlaegt, will zuerst wissen:
   welches Gelenk, welche Bewegung. Das stand zwar irgendwo im Satz — aber man
   musste es herauslesen. Die Kurzform steht jetzt oben, der Text aufklappbar darunter.

   Warum NICHT aus `functions` abgeleitet: Die Bewegungs-Schluessel haengen an keinem
   Gelenk. `M. biceps brachii` fuehrt `joints: [Art. cubiti, Art. humeri]` und
   `functions: [flexion, supination]` — Flexion von was? Das Feld traegt die Frage
   nicht, die die Kurzform beantworten soll.

   ⚠️ **Die Kurzform verdichtet nur den Funktionstext.** Sie behauptet nichts, was dort
   nicht steht. Wo der Text zu einem Gelenk aus `joints` schweigt, fehlt die Zeile —
   `check:daten` listet das fuer den Fachmann, statt es still zu ergaenzen.

   ⚠️ Die Daten liegen unter `src/data/editorial/`, NICHT unter `src/data/generated/`
   (das ueberschreibt `npm run migrate:data`). Schluessel ist die Muskel-`id` wie bei
   den Segmenten, NICHT der Kartenschluessel: `M. nasalis` hat zwei Datensaetze mit
   verschiedener Funktion (Pars transversa / alaris) und damit zwei Kurzformen.
   `nameLatin` steht als Gegenprobe daneben — aendert eine Neu-Migration die ids,
   faellt das hier auf, statt dass Kurzformen am falschen Muskel haengen.
   ========================================================================= */

import editorial from './editorial/funktion-kurz.json';
import type { FunktionsZeile, Muscle } from '../types';

export type FunktionKurzStatus = 'ungeprueft' | 'geprueft';

export interface FunktionKurzEintrag {
  nameLatin: string;
  status: FunktionKurzStatus;
  zeilen: FunktionsZeile[];
}

export interface FunktionKurzSource {
  muskeln: Record<string, FunktionKurzEintrag>;
}

export class FunktionKurzDataError extends Error {
  override name = 'FunktionKurzDataError';
}

const STATUS: readonly FunktionKurzStatus[] = ['ungeprueft', 'geprueft'];

const texte = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((v): v is string => typeof v === 'string').map((v) => v.trim()).filter(Boolean)
    : [];

/**
 * Liest die redaktionelle Datei. Defensiv gegenüber Struktur — eine Zeile ohne Bewegung
 * faellt weg, ein Eintrag ohne Zeile ebenso. **Streng gegenüber Namen und Lücken** ist
 * erst `assertFunktionKurz`, gegen den echten Bestand.
 */
export function readFunktionKurzSource(raw: unknown): FunktionKurzSource {
  const data = (raw ?? {}) as { muskeln?: unknown };
  if (typeof data.muskeln !== 'object' || data.muskeln === null) return { muskeln: {} };

  const muskeln: Record<string, FunktionKurzEintrag> = {};
  for (const [id, entry] of Object.entries(data.muskeln as Record<string, unknown>)) {
    if (typeof entry !== 'object' || entry === null) continue;
    const roh = entry as Record<string, unknown>;
    const zeilen = (Array.isArray(roh.zeilen) ? roh.zeilen : [])
      .filter((z): z is Record<string, unknown> => typeof z === 'object' && z !== null)
      .map((z) => ({ orte: texte(z.orte), bewegungen: texte(z.bewegungen) }))
      .filter((z) => z.bewegungen.length > 0);
    if (zeilen.length === 0) continue;
    muskeln[id] = {
      nameLatin: typeof roh.nameLatin === 'string' ? roh.nameLatin.trim() : '',
      /* Ein unbekannter Status gilt als ungeprueft: Im Zweifel steht der Stern da. */
      status: STATUS.includes(roh.status as FunktionKurzStatus)
        ? (roh.status as FunktionKurzStatus)
        : 'ungeprueft',
      zeilen,
    };
  }
  return { muskeln };
}

/**
 * Prüft die Kurzformen gegen den echten Bestand. Drei Regeln, jede lässt den Build scheitern:
 *
 * 1. Eine id, die es nicht gibt — der Eintrag wäre sonst für immer unsichtbar.
 * 2. Eine id, deren `nameLatin` nicht passt — nach einer Neu-Migration hinge die Kurzform
 *    sonst still am falschen Muskel.
 * 3. **Ein Muskel mit Funktionstext, aber ohne Kurzform.** Das Quiz stellt seine Optionen
 *    aus der Kurzform: Stünde eine einzelne lange Textoption zwischen drei kurzen, verriete
 *    allein ihre Länge die Antwort.
 */
export function assertFunktionKurz(muscles: readonly Muscle[], source: FunktionKurzSource): void {
  const byId = new Map(muscles.map((m) => [m.id, m]));

  const unbekannt = Object.keys(source.muskeln).filter((id) => !byId.has(id));
  if (unbekannt.length > 0) {
    throw new FunktionKurzDataError(
      `funktion-kurz.json nennt Muskeln, die es nicht gibt: ${unbekannt.join(', ')}`,
    );
  }

  const falscherName = Object.entries(source.muskeln)
    .filter(([id, e]) => byId.get(id)?.nameLatin !== e.nameLatin)
    .map(([id, e]) => `${id} („${e.nameLatin}" ≠ „${byId.get(id)?.nameLatin}")`);
  if (falscherName.length > 0) {
    throw new FunktionKurzDataError(
      `funktion-kurz.json: id und nameLatin passen nicht zusammen: ${falscherName.join(', ')}`,
    );
  }

  const ohneKurzform = muscles
    .filter((m) => m.functionDescription.trim() !== '' && !source.muskeln[m.id])
    .map((m) => m.id);
  if (ohneKurzform.length > 0) {
    throw new FunktionKurzDataError(
      `Muskeln mit Funktionstext, aber ohne Kurzform in funktion-kurz.json: ${ohneKurzform.join(', ')}`,
    );
  }
}

const SOURCE = readFunktionKurzSource(editorial);

/** Der Loader ruft das, sobald die Muskeln validiert sind. */
export function initFunktionKurz(
  muscles: readonly Muscle[],
  source: FunktionKurzSource = SOURCE,
): void {
  assertFunktionKurz(muscles, source);
}

/** Reichert einen Muskel um seine Kurzform an. Ohne Eintrag bleibt er unverändert. */
export function withFunktionKurz(muscle: Muscle, source: FunktionKurzSource = SOURCE): Muscle {
  const eintrag = source.muskeln[muscle.id];
  if (!eintrag) return muscle;
  return {
    ...muscle,
    funktionKurz: eintrag.zeilen,
    funktionKurzUngeprueft: eintrag.status === 'ungeprueft',
  };
}

/* ---- Anzeige ------------------------------------------------------------ */

/**
 * Deutsche Namen für die Gelenk-Etiketten aus `joints`. Nur die, die ein Schüler nicht
 * ohnehin lesen kann — „Kiefergelenk" oder „Rippen" stehen so, wie sie sind.
 */
const GELENK_NAMEN: Readonly<Record<string, string>> = {
  'Art. coxae': 'Hüftgelenk (Art. coxae)',
  'Art. cubiti': 'Ellenbogengelenk (Art. cubiti)',
  'Art. genus': 'Kniegelenk (Art. genus)',
  'Art. humeri': 'Schultergelenk (Art. humeri)',
  'Art. manus': 'Handgelenk (Art. manus)',
  'Art. talocruralis': 'Oberes Sprunggelenk (Art. talocruralis)',
  'Art. subtalaris': 'Unteres Sprunggelenk (Art. subtalaris)',
  MCP: 'Grundgelenk (MCP)',
  PIP: 'Mittelgelenk (PIP)',
  DIP: 'Endgelenk (DIP)',
  IP: 'Endgelenk (IP)',
  CMC: 'Karpometakarpalgelenk (CMC)',
  LWS: 'Lendenwirbelsäule (LWS)',
  Halswirbelsäule: 'Halswirbelsäule (HWS)',
  /* Kein Etikett aus `joints`, aber der Ort, den die Texte fuer Pronation/Supination nennen.
     Ohne Zusatz stuende dort ein Koerperteil, wo ueberall sonst ein Gelenk steht. */
  Unterarm: 'Unterarm (Radioulnargelenke)',
};

/**
 * Der Ort einer Zeile, lesbar. **Ein Ort** bekommt den vollen Namen („Hüftgelenk
 * (Art. coxae)"). **Mehrere** bleiben bei ihren Etiketten („MCP + PIP + DIP") — drei
 * volle Namen hintereinander wären länger als der Text, den die Kurzform ersetzt.
 */
export function ortLabel(orte: readonly string[]): string {
  if (orte.length === 1) return GELENK_NAMEN[orte[0]] ?? orte[0];
  return orte.join(' + ');
}

/** Eine Zeile als Text: „Hüftgelenk (Art. coxae): Extension · Außenrotation". */
export function zeileText(zeile: FunktionsZeile): string {
  const bewegungen = zeile.bewegungen.join(' · ');
  return zeile.orte.length > 0 ? `${ortLabel(zeile.orte)}: ${bewegungen}` : bewegungen;
}

/** Die ganze Kurzform, eine Zeile je Ort, getrennt durch Zeilenumbruch. */
export function funktionKurzText(zeilen: readonly FunktionsZeile[]): string {
  return zeilen.map(zeileText).join('\n');
}

/**
 * **Was unter „Funktion" steht** — auf Detailseite, Lernkarte und im Quiz. Die Kurzform,
 * wenn es eine gibt; sonst der Text. Alle Anzeigen fragen hier, damit keine eine eigene
 * Regel dafür erfindet.
 */
export function funktionAnzeige(muscle: Pick<Muscle, 'funktionKurz' | 'functionDescription'>): string {
  return muscle.funktionKurz && muscle.funktionKurz.length > 0
    ? funktionKurzText(muscle.funktionKurz)
    : muscle.functionDescription;
}

/* ---- Pruefbericht ------------------------------------------------------- */

export interface FunktionsLuecken {
  /** Gelenke aus `joints`, zu denen die Kurzform keine Zeile hat — der Text schweigt dazu. */
  gelenkeOhneZeile: string[];
  /** Orte der Kurzform, die nicht in `joints` stehen (z. B. „Unterarm", „Fußgewölbe"). */
  orteAusserhalb: string[];
}

/**
 * Wo Kurzform und `joints` nicht zusammenpassen. **Kein Fehler, ein Hinweis:** Beides
 * kann richtig sein (der Text nennt das Gelenk nicht) oder ein Datenfehler (`joints`
 * fehlt ein Gelenk). Das entscheidet der Fachmann — `export:csv` legt es ihm vor.
 */
export function funktionsLuecken(muscle: Pick<Muscle, 'joints' | 'funktionKurz'>): FunktionsLuecken {
  const orte = new Set((muscle.funktionKurz ?? []).flatMap((z) => z.orte));
  return {
    gelenkeOhneZeile: muscle.joints.filter((j) => !orte.has(j)),
    orteAusserhalb: [...orte].filter((o) => !muscle.joints.includes(o)),
  };
}
