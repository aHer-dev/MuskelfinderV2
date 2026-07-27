/* =========================================================================
   Segmente: die Nachtragsebene für ein Feld, das in 48 von 150 Datensätzen leer ist.
   src/data/segments.ts

   WARUM ES DAS GIBT: Beim Abgleich gegen die deutsche Wikipedia (siehe
   `docs/pruefung/`) fiel auf, dass `segments` bei 48 Muskeln leer steht. Der
   Reflex wäre, alle 48 aufzufüllen — und der wäre falsch. Die 48 sind drei
   verschiedene Dinge:

   - **entfaellt** (16): Hirnnerv ohne spinalen Anteil. M. masseter, die Mimik,
     Platysma — die haben keine Segmente. Das Feld ist nicht unfertig, es ist
     fertig. Wer hier etwas einträgt, erfindet Anatomie.
   - **klaeren** (9): autochthone Rückenmuskulatur an den Rr. dorsales. Die sind
     segmental über ihre ganze Spannweite innerviert; ein einzelner String trifft
     das nicht. Erst das Modell entscheiden, dann eintragen.
   - **offen** (23): echte Lücken. Nachzutragen, mit Quellenangabe.

   ⚠️ Die Daten liegen unter `src/data/editorial/`, NICHT unter `src/data/generated/`:
   Der generierte Ordner wird von `npm run migrate:data` neu erzeugt und würde jeden
   Nachtrag mitnehmen. (Dieselbe Regel wie bei `etymology.ts` und `palpation.ts`.)

   KEINE FREMDDATEN: `vorschlagWikipedia` in der JSON ist ein **Nachschlage-Hinweis**,
   kein Wert. Gelesen wird ausschliesslich `segments` — was dort steht, hat ein Mensch
   im Buch geprüft. Der Vergleich findet Verdachtsfälle, er entscheidet sie nicht.
   ========================================================================= */

import editorial from './editorial/segments.json';
import type { Muscle } from '../types';

/**
 * Warum ein Feld leer ist — bzw. wie belastbar ein Wert ist. Das unterscheidet
 * „unfertig" von „fertig leer" **und** von „steht drin, aber noch nicht im Buch
 * nachgeschlagen".
 */
export type SegmentStatus = 'offen' | 'ungeprueft' | 'klaeren' | 'entfaellt';

export interface SegmentEntry {
  status: SegmentStatus;
  /** Der Wert. Leer = noch nicht nachgetragen. */
  segments: string;
  /** Woher der Wert stammt. Pflicht, sobald `segments` gefüllt ist. */
  quelle: string;
  /** Nur zum Lesen der Datei und für Fehlermeldungen — die Wahrheit steht im Bestand. */
  nameLatin: string;
}

export interface SegmentsSource {
  muskeln: Record<string, SegmentEntry>;
}

export class SegmentsDataError extends Error {
  override name = 'SegmentsDataError';
}

const STATUS: readonly SegmentStatus[] = ['offen', 'ungeprueft', 'klaeren', 'entfaellt'];

function istStatus(value: unknown): value is SegmentStatus {
  return typeof value === 'string' && (STATUS as readonly string[]).includes(value);
}

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/**
 * Liest die redaktionelle Datei. Defensiv gegenüber Struktur, **streng gegenüber
 * Namen und Widersprüchen** — beides prüft `assertSegments` gegen den Bestand.
 */
export function readSegmentsSource(raw: unknown): SegmentsSource {
  const data = (raw ?? {}) as { muskeln?: unknown };
  if (typeof data.muskeln !== 'object' || data.muskeln === null) return { muskeln: {} };

  const muskeln: Record<string, SegmentEntry> = {};
  for (const [id, entry] of Object.entries(data.muskeln as Record<string, unknown>)) {
    if (typeof entry !== 'object' || entry === null) continue;
    const roh = entry as Record<string, unknown>;
    if (!istStatus(roh.status)) continue;
    muskeln[id] = {
      status: roh.status,
      segments: text(roh.segments),
      quelle: text(roh.quelle),
      nameLatin: text(roh.nameLatin),
    };
  }
  return { muskeln };
}

const SOURCE = readSegmentsSource(editorial);

/**
 * Prüft die Nachtragsebene gegen den echten Bestand. Drei Regeln, jede aus einem
 * Fehler entstanden, der sonst still passieren würde:
 *
 * 1. Eine ID, die es nicht gibt, lässt den Build scheitern — der Eintrag wäre
 *    sonst für immer unsichtbar. (Dieselbe Regel wie bei Gruppen und Palpation.)
 * 2. `status: 'entfaellt'` mit einem Wert ist ein Widerspruch: entweder hat der
 *    Muskel Segmente oder nicht. Das fängt genau den Reflex ab, der die 16
 *    Hirnnerv-Muskeln „vervollständigen" wollte.
 * 3. Ein Wert ohne `quelle` ist kein geprüfter Wert. Ohne diese Regel wandert
 *    ein Wikipedia-Vorschlag beim Abtippen unbemerkt in den Bestand.
 */
export function assertSegments(source: SegmentsSource, known: ReadonlySet<string>): void {
  const unbekannt = Object.keys(source.muskeln).filter((id) => !known.has(id));
  if (unbekannt.length > 0) {
    throw new SegmentsDataError(
      `segments.json nennt Muskeln, die es nicht gibt: ${unbekannt.join(', ')}`,
    );
  }

  const widerspruch = Object.entries(source.muskeln)
    .filter(([, e]) => e.status === 'entfaellt' && e.segments !== '')
    .map(([id]) => id);
  if (widerspruch.length > 0) {
    throw new SegmentsDataError(
      'segments.json trägt Segmente bei Muskeln ein, die als "entfaellt" markiert sind '
      + `(Hirnnerv, es gibt keine): ${widerspruch.join(', ')}`,
    );
  }

  const ohneQuelle = Object.entries(source.muskeln)
    .filter(([, e]) => e.segments !== '' && e.quelle === '')
    .map(([id]) => id);
  if (ohneQuelle.length > 0) {
    throw new SegmentsDataError(
      `segments.json trägt Segmente ohne "quelle" ein: ${ohneQuelle.join(', ')}`,
    );
  }

  /* Ein „ungeprueft" ohne Wert ist bloss „offen" — der Status waere eine Luege
     ueber den Bearbeitungsstand und der Stern erschiene nirgends. */
  const leerUngeprueft = Object.entries(source.muskeln)
    .filter(([, e]) => e.status === 'ungeprueft' && e.segments === '')
    .map(([id]) => id);
  if (leerUngeprueft.length > 0) {
    throw new SegmentsDataError(
      `segments.json markiert leere Einträge als "ungeprueft" (dann ist es "offen"): ${leerUngeprueft.join(', ')}`,
    );
  }
}

export function initSegments(
  muscles: readonly Muscle[],
  source: SegmentsSource = SOURCE,
): void {
  assertSegments(source, new Set(muscles.map((m) => m.id)));
}

/**
 * Mischt den nachgetragenen Wert dazu. Fehlt der Eintrag oder ist er leer, bleibt
 * der Muskel unverändert — die Detailseite rendert dann wie vorher.
 */
export function withSegments(muscle: Muscle, source: SegmentsSource = SOURCE): Muscle {
  const entry = source.muskeln[muscle.id];
  if (!entry || entry.segments === '') return muscle;
  return entry.status === 'ungeprueft'
    /* Der Wert wird gezeigt, aber als noch nicht im Buch nachgeschlagen markiert —
       auf der Kartenrueckseite steht dann „Segmente *". Ein ungeprüfter Wert ohne
       diesen Hinweis waere die stille Behauptung, er sei geprueft. */
    ? { ...muscle, segments: entry.segments, segmentsUngeprueft: true }
    : { ...muscle, segments: entry.segments };
}

/* ---- Dateninvarianten -------------------------------------------------
   Die beiden Prädikate unten sind der eigentliche Gewinn aus dem Wikipedia-
   Abgleich: nicht die 23 nachgetragenen Werte, sondern die Regeln, die
   verhindern, dass jemand später die 16 Hirnnerv-Muskeln „vervollständigt"
   oder ein neuer Muskel unklassifiziert mit leerem Feld hereinrutscht. */

/** Innerviert nur über einen Hirnnerv (V3/VII) — dann gibt es keine Segmente. */
export function istHirnnervOhneSpinalenAnteil(innervation: string): boolean {
  const hirnnerv = /\bV3\b|\bVII\b|facialis|trigeminus|massetericus|pterygoideus|mylohyoideus|temporalis profundus/i;
  /* N. accessorius (XI) und der Umweg über den N. hypoglossus haben sehr wohl
     C-Segmente — Trapezius und M. thyrohyoideus dürfen hier nicht hängenbleiben. */
  const spinal = /\bC\d|\bTh\d|\bL\d|\bS\d|cervicalis|Spinalnerv|accessorius|hypoglossus/i;
  return hirnnerv.test(innervation) && !spinal.test(innervation);
}

/** Muskeln mit leerem `segments`, die in der Nachtragsdatei fehlen. */
export function unklassifizierteLuecken(
  muscles: readonly Muscle[],
  source: SegmentsSource = SOURCE,
): string[] {
  return muscles
    .filter((m) => m.segments.trim() === '' && !source.muskeln[m.id])
    .map((m) => m.nameLatin);
}

/** Muskeln, die einen Hirnnerv nennen und trotzdem Segmente tragen. */
export function hirnnervMitSegmenten(muscles: readonly Muscle[]): string[] {
  return muscles
    .filter((m) => istHirnnervOhneSpinalenAnteil(m.innervation) && m.segments.trim() !== '')
    .map((m) => `${m.nameLatin} (${m.innervation}) → "${m.segments}"`);
}

/** Wie viele Lücken noch offen sind — für den Bericht in `check:daten`. */
export function segmentGaps(source: SegmentsSource = SOURCE): Record<SegmentStatus, number> {
  const zaehl: Record<SegmentStatus, number> = {
    offen: 0, ungeprueft: 0, klaeren: 0, entfaellt: 0,
  };
  for (const entry of Object.values(source.muskeln)) {
    /* Ein „offen", in dem inzwischen ein belegter Wert steht, ist erledigt und
       zaehlt nicht mehr als Luecke. „ungeprueft" zaehlt weiter — es ist offen. */
    if (entry.status === 'offen' && entry.segments !== '') continue;
    zaehl[entry.status]++;
  }
  return zaehl;
}

/** Die Muskeln mit ungeprüftem Wert — Arbeitsvorrat für die fachliche Prüfung. */
export function ungepruefteSegmente(source: SegmentsSource = SOURCE): string[] {
  return Object.values(source.muskeln)
    .filter((e) => e.status === 'ungeprueft')
    .map((e) => e.nameLatin)
    .filter(Boolean);
}
