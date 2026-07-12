/* =========================================================================
   Freitext-Antworten prüfen (Etappe 8a) — reine Logik, kein UI.
   src/data/answer-check.ts

   Ab Fach 7 tippt die Studentin den Namen selbst (ADR 0008). Damit steht und
   fällt die Stufe mit einer Frage: Was ist ein Tippfehler und was ist ein
   Bedeutungsfehler?

   - Tippfehler werden verziehen (`'almost'`), aber sichtbar korrigiert — sonst
     lernt man die falsche Schreibweise ein.
   - Bedeutungsfehler NIE. `longus` ≠ `brevis`, `major` ≠ `minor`,
     `abductor` ≠ `adductor` (Levenshtein-Abstand 1!). Solche Paare sind ein
     anderer Muskel, egal wie nah sie sich schreiben.

   Der Verdict ist getypt; den Satz formuliert das UI.
   ========================================================================= */

export type AnswerVerdict = 'correct' | 'almost' | 'wrong';

/** Was akzeptiert wird. `nameDE` ist optional — die V1-Daten führen ihn (noch) nicht. */
export interface AnswerTarget {
  nameLatin: string;
  nameDE?: string;
}

export interface AnswerCheck {
  verdict: AnswerVerdict;
  /** Die Schreibweise, die getroffen wurde — `null` bei `'wrong'`. */
  matched: string | null;
}

/* ── Normalisierung ───────────────────────────────────────────────────── */

/** „M.", „Mm.", „Musculus", „Musculi" tragen keine Information — sie sind auf jeder Karte gleich. */
const ARTICLE = new Set(['m', 'mm', 'musculus', 'musculi']);

/**
 * Strukturwörter, die den Muskel nicht unterscheiden: „Pars descendens" und
 * „descendens" meinen dieselbe Karte, „Caput longum" und „longum" auch.
 */
const STOPWORDS = new Set(['pars', 'caput', 'und', 'et']);

/**
 * Kleinschreibung, Diakritika weg, alles Nicht-Alphanumerische zu Leerraum
 * (Punkte, Binde- und Gedankenstriche, Klammern), Füllwörter raus.
 *
 * Die römische Nummerierung bleibt bewusst stehen: In diesen Daten ist sie das
 * EINZIGE, was Hand von Fuß trennt — „Mm. lumbricales I–IV" (Hand) gegen
 * „Mm. lumbricales" (Fuß). Wer sie wegkürzt, verschmilzt zwei Karten zu einer.
 */
export function normalizeName(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((w) => w !== '' && !ARTICLE.has(w) && !STOPWORDS.has(w))
    .join(' ');
}

interface AcceptedForm {
  /** Normalisiert — damit wird verglichen. */
  normalized: string;
  /** Original — damit korrigiert das UI die Schreibweise. */
  display: string;
}

/**
 * Ein Klammerzusatz ist ein Synonym, kein Beiwerk: „M. fibularis longus
 * (M. peroneus longus)" — beide Namen sind richtig, beide werden akzeptiert.
 * Und wer schlicht abschreibt, was auf der Karte steht (samt Klammer), auch.
 */
export function acceptedForms(target: AnswerTarget): AcceptedForm[] {
  const forms: AcceptedForm[] = [];

  const collect = (raw: string | undefined) => {
    if (!raw) return;
    const outside = raw.replace(/\([^)]*\)/g, ' ');
    const inside = [...raw.matchAll(/\(([^)]*)\)/g)].map((m) => m[1]);
    for (const part of [outside, ...inside, raw]) {
      const normalized = normalizeName(part);
      if (normalized !== '' && !forms.some((f) => f.normalized === normalized)) {
        forms.push({ normalized, display: raw });
      }
    }
  };

  collect(target.nameLatin);
  collect(target.nameDE);
  return forms;
}

/* ── Bedeutungsträger ─────────────────────────────────────────────────── */

interface Marker {
  id: string;
  test: RegExp;
}

/**
 * Dimensionen, in denen sich Muskeln unterscheiden. Stehen auf beiden Seiten
 * Marker derselben Dimension und sind sie verschieden, ist es ein **anderer
 * Muskel** — dann greift keine Toleranz, egal wie klein der Abstand ist.
 *
 * Fehlt der Marker auf der Eingabeseite ganz (vertippt bis zur Unkenntlichkeit),
 * entscheidet weiter der Abstand: „digitorm" ist ein Tippfehler, kein Gegenteil.
 */
const DIMENSIONS: ReadonlyArray<readonly Marker[]> = [
  [
    { id: 'longus', test: /^long/ },
    { id: 'brevis', test: /^brev/ },
  ],
  [
    { id: 'major', test: /^(maj|mai|magn|maxim)/ },
    { id: 'minor', test: /^(minor|minus|minim|parv)/ },
    { id: 'medius', test: /^medi(us|a|um|i)$/ },
  ],
  [
    { id: 'medialis', test: /^medial/ },
    { id: 'lateralis', test: /^lateral/ },
  ],
  [
    { id: 'superficialis', test: /^superficial/ },
    { id: 'profundus', test: /^profund/ },
  ],
  [
    { id: 'anterior', test: /^(anteri|anticus)/ },
    { id: 'posterior', test: /^(posteri|posticus)/ },
  ],
  [
    { id: 'superior', test: /^superior/ },
    { id: 'inferior', test: /^inferior/ },
  ],
  [
    { id: 'internus', test: /^intern/ },
    { id: 'externus', test: /^extern/ },
  ],
  [
    { id: 'dexter', test: /^dext/ },
    { id: 'sinister', test: /^sinist/ },
  ],
  [
    { id: 'flexor', test: /^flex/ },
    { id: 'extensor', test: /^exten(s|d)/ },
  ],
  [
    { id: 'abductor', test: /^abduct/ },
    { id: 'adductor', test: /^adduct/ },
  ],
  [
    { id: 'pronator', test: /^pronat/ },
    { id: 'supinator', test: /^supinat/ },
  ],
  [
    { id: 'pollicis', test: /^pollic/ },
    { id: 'hallucis', test: /^halluc/ },
    { id: 'digiti', test: /^digiti$/ },
    { id: 'digitorum', test: /^digitorum$/ },
  ],
  [
    { id: 'radialis', test: /^radial/ },
    { id: 'ulnaris', test: /^ulnar/ },
  ],
  [
    { id: 'palmaris', test: /^palmar/ },
    { id: 'dorsalis', test: /^dorsal/ },
  ],
  [
    { id: 'ascendens', test: /^ascend/ },
    { id: 'descendens', test: /^descend/ },
    { id: 'transversus', test: /^transvers/ },
  ],
];

function markersIn(words: string[], dimension: readonly Marker[]): Set<string> {
  const found = new Set<string>();
  for (const word of words) {
    const marker = dimension.find((m) => m.test.test(word));
    if (marker) found.add(marker.id);
  }
  return found;
}

function sameSet(a: Set<string>, b: Set<string>): boolean {
  return a.size === b.size && [...a].every((x) => b.has(x));
}

/** true = die beiden Namen widersprechen sich in ihrer Bedeutung. */
export function meaningConflict(typed: string, expected: string): boolean {
  const typedWords = typed.split(' ');
  const expectedWords = expected.split(' ');

  return DIMENSIONS.some((dimension) => {
    const mine = markersIn(typedWords, dimension);
    const theirs = markersIn(expectedWords, dimension);
    if (mine.size === 0 || theirs.size === 0) return false;
    return !sameSet(mine, theirs);
  });
}

/* ── Abstand & Toleranz ───────────────────────────────────────────────── */

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = row;
  }
  return prev[b.length];
}

/**
 * Kurze Namen vertragen keine Toleranz — bei „psoas" ist ein Zeichen schon ein
 * anderes Wort. Lange Namen dürfen zwei Fehler haben, sonst ist die Stufe reine Tippprüfung.
 */
export function tolerance(length: number): number {
  if (length <= 5) return 0;
  if (length <= 12) return 1;
  return 2;
}

/* ── Prüfung ──────────────────────────────────────────────────────────── */

/**
 * @param corpus Alle Muskeln. Ohne ihn prüft `checkAnswer` nur gegen das Ziel — für
 *   Einzeltests in Ordnung, im Betrieb NICHT: erst der Vergleich mit dem ganzen
 *   Namensraum verhindert, dass eine Toleranz einen anderen Muskel durchwinkt.
 */
export function checkAnswer(
  input: string,
  target: AnswerTarget,
  corpus: readonly AnswerTarget[] = [],
): AnswerCheck {
  const typed = normalizeName(input);
  if (typed === '') return { verdict: 'wrong', matched: null };

  const own = acceptedForms(target);
  const ownForms = new Set(own.map((f) => f.normalized));

  let almost: AnswerCheck | null = null;
  let almostDistance = Infinity;

  for (const form of own) {
    if (typed === form.normalized) return { verdict: 'correct', matched: form.display };

    // Bedeutungsfehler: hier endet die Nachsicht, bevor der Abstand überhaupt zählt.
    if (meaningConflict(typed, form.normalized)) continue;

    const distance = levenshtein(typed, form.normalized);
    if (distance <= tolerance(form.normalized.length) && distance < almostDistance) {
      almost = { verdict: 'almost', matched: form.display };
      almostDistance = distance;
    }
  }

  if (!almost) return { verdict: 'wrong', matched: null };

  /* Die Toleranz darf nicht raten. Rund um das Zungenbein liegen sieben Namen im
     Abstand von zwei Zeichen (mylo-/stylo-/genio-/sterno-/thyro-/omohyoideus): Wer
     „stylohyoideus" tippt, bekommt „mylohyoideus" NICHT geschenkt. Ist ein fremder
     Muskel genauso nah, ist die Antwort mehrdeutig — und damit falsch.
     (Namensdubletten wie Hand/Fuß sind laut ADR 0002 §2 DIESELBE Karte und zählen nicht.) */
  const ambiguous = corpus.some((other) =>
    acceptedForms(other).some(
      (form) =>
        !ownForms.has(form.normalized) && levenshtein(typed, form.normalized) <= almostDistance,
    ),
  );

  return ambiguous ? { verdict: 'wrong', matched: null } : almost;
}
