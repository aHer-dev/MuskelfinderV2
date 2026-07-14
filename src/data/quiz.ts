/* =========================================================================
   Quiz-Generierung — reine Datenschicht (unit-getestet, deterministisch mit RNG).
   src/data/quiz.ts

   Erzeugt Multiple-Choice-Fragen (4 Optionen) aus den Muskeldaten. Der
   Serien-Key folgt der V1-Form `"<mode>::<filterSignatur>"`, damit die
   persistierte Serien-Statistik zu ADR 0002 kompatibel bleibt.
   ========================================================================= */

import type { Muscle, QuizMode, QuizQuestion, RegionId } from '../types';

/** Deterministischer PRNG (mulberry32) — für reproduzierbare Tests. */
export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Ein Antwort-Kandidat: das Label und der Muskel, aus dessen Daten es stammt. */
interface Candidate {
  label: string;
  muscleId: string;
}

/* ---- Ein Distraktor muss WEHTUN ---------------------------------------------------------
   Bis 2026-07-14 wurde der ganze Bestand gemischt und die ersten drei genommen. Gemessen an
   einer echten Frage:

     M. brachioradialis — Innervation?
     A) N. femoralis  B) N. subscapularis  C) N. radialis  D) R. thyrohyoideus

   Ein Bein-Nerv, ein Schulter-Nerv, ein Kehlkopf-Ast. Wer die Topografie grob kennt, loest
   das durch Ausschluss — **ohne den Muskel zu kennen**. Eine Frage, die man ohne das gefragte
   Wissen beantwortet, misst nichts und lehrt nichts.

   Darum kommen die falschen Antworten jetzt aus der NACHBARSCHAFT: erst dieselbe Subregion
   (Unterarm gegen Unterarm), dann dieselbe Region, dann der Rest. Der Rest bleibt als
   Auffuellung drin — sonst haette eine kleine Subregion keine vier Optionen mehr, und genau
   das war der Haken, den 8b geloest hat. Die Distraktoren kommen weiter von AUSSERHALB des
   Karten-Filters (8b); nur ihre Reihenfolge ist jetzt nicht mehr blind.

   `quizSeriesKey` bleibt unangetastet (ADR 0002) — es ist kein neuer Parameter, sondern eine
   bessere Auswahl. Die Runden werden dadurch aber SCHWERER: eine Trefferquote von heute ist
   mit einer von gestern nur noch bedingt vergleichbar. */
function nearness(candidate: Muscle | undefined, target: Muscle): 0 | 1 | 2 {
  if (!candidate) return 2;
  if (candidate.subregion === target.subregion) return 0;
  if (candidate.region === target.region) return 1;
  return 2;
}

/** Kandidaten nach Nähe geschichtet, INNERHALB jeder Schicht gemischt. */
function nearestFirst<T>(
  items: readonly T[],
  muscleOf: (item: T) => Muscle | undefined,
  target: Muscle,
  rng: () => number,
): T[] {
  const tiers: T[][] = [[], [], []];
  for (const item of items) tiers[nearness(muscleOf(item), target)].push(item);
  return tiers.flatMap((tier) => shuffle(tier, rng));
}

/**
 * Wählt bis zu `n` verschiedene Distraktoren (≠ correct), die nächsten zuerst. Jeder trägt
 * seinen Muskel mit — ohne diese Herkunft könnte die Erklärung (7e) den gewählten Distraktor
 * nur noch über seinen Text zurückraten.
 */
function pickDistractors(
  pool: readonly Candidate[],
  gueltig: ReadonlySet<string>,
  n: number,
  rng: () => number,
  target: Muscle,
  byId: ReadonlyMap<string, Muscle>,
): Candidate[] {
  /* **Wer auf denselben Fragetext ebenfalls richtig antwortet, ist kein Distraktor.**
     Das ist die ganze Regel, und sie gilt in JEDEM Modus — welche Antworten richtig sind, weiss
     `specFor` (`gueltigeAntworten`). Frueher stand hier nur die EINE gemeinte Antwort; jede
     zweite richtige rutschte als „falsche" Option durch.

     Der Fehler sah in jedem Modus anders aus, war aber immer derselbe: „Welcher Muskel dreht den
     Oberschenkel nach aussen?" mit BEIDEN Obturatorii zur Wahl. „Was entspringt am Tuber
     ischiadicum?" mit zwei Ischiocruralen. „Welcher Muskel ist abgebildet?" unter dem
     Quadriceps-Bild, das VIER Muskeln gehoert. Der Nutzer klickt eine richtige Antwort an und
     bekommt sie rot — gemessen bis zu 6,3 % der Fragen (`insertion-origin`).

     Dass die Sperre nach LABEL geht und nicht nach Muskel, ist der Kern: M. sartorius hat einen
     anderen Ursprung als M. gracilis und rutscht durch jeden muskelbasierten Filter — aber beide
     setzen am **Pes anserinus** an, und damit ist sein Ansatz auf die Gracilis-Frage richtig.

     Die Sperre entdoppelt zugleich die Optionen: 121 Muskeln teilen sich eine Innervation, ohne
     sie stuende dieselbe Antwort zweimal da. */
  const seen = new Set<string>(gueltig);
  const unique: Candidate[] = [];
  for (const candidate of pool) {
    if (candidate.label.trim() === '' || seen.has(candidate.label)) continue;
    seen.add(candidate.label);
    unique.push(candidate);
  }
  return nearestFirst(unique, (c) => byId.get(c.muscleId), target, rng).slice(0, n);
}

const MODE_CATEGORY: Record<QuizMode, string> = {
  'function-to-muscle': 'Funktion → Muskel',
  'muscle-to-function': 'Muskel → Funktion',
  'function-mixed': 'Funktion ↔ Muskel',
  innervation: 'Innervation',
  'origin-insertion': 'Ursprung → Ansatz',
  'insertion-origin': 'Ansatz → Ursprung',
  'origin-insertion-mixed': 'Ursprung ↔ Ansatz',
  image: 'Bild → Muskel',
  'name-image': 'Name → Bild',
  'image-mixed': 'Bild ↔ Name',
  'group-odd-one-out': 'Funktionelle Gruppe',
};

/** „Gemischt"-Modi lösen je Frage zufällig auf eine ihrer konkreten Richtungen auf. */
const MIXED_SUBMODES: Partial<Record<QuizMode, QuizMode[]>> = {
  'function-mixed': ['function-to-muscle', 'muscle-to-function'],
  'origin-insertion-mixed': ['origin-insertion', 'insertion-origin'],
  'image-mixed': ['image', 'name-image'],
};

/** Bekannter Quizmodus? V1-Backups können Serien-Keys enthalten, die es heute nicht gibt. */
export function isQuizMode(value: unknown): value is QuizMode {
  return typeof value === 'string' && Object.hasOwn(MODE_CATEGORY, value);
}

/**
 * Router-State, mit dem die Statistik (8c) direkt in einen Modus springt — dasselbe
 * Muster wie die Sitzungs-Übergabe aus 7b: validiert, nicht gecastet. Der State kommt
 * aus der History und kann alles sein.
 */
export function readQuizHandoff(state: unknown): QuizMode | null {
  if (typeof state !== 'object' || state === null) return null;
  const mode = (state as { mode?: unknown }).mode;
  return isQuizMode(mode) ? mode : null;
}

/**
 * Woher die **Fragen** kommen (Etappe 8b, entschieden am 2026-07-13).
 * Die **falschen Antworten** kommen davon unabhängig immer aus dem ganzen Bestand —
 * genau darum genügt hier schon EINE passende Karte für eine Frage.
 */
export type QuizScope =
  /** Der ganze Muskelbestand (bisheriges Verhalten). */
  | 'all'
  /** Nur was im Karteikasten liegt. */
  | 'deck'
  /** Karten, die schon mindestens einmal falsch beantwortet wurden. */
  | 'wrong'
  /** Karten, die noch nie bewertet wurden. */
  | 'unseen'
  /** Von Hand als schwierig markierte Karten. */
  | 'difficult';

export const QUIZ_SCOPE_LABELS: Record<QuizScope, string> = {
  all: 'Alle Muskeln',
  deck: 'Mein Karteikasten',
  wrong: 'Nur falsch beantwortete',
  unseen: 'Nie gesehen',
  difficult: 'Als schwierig markiert',
};

export const QUIZ_SCOPES = Object.keys(QUIZ_SCOPE_LABELS) as QuizScope[];

export function isQuizScope(value: unknown): value is QuizScope {
  return typeof value === 'string' && Object.hasOwn(QUIZ_SCOPE_LABELS, value);
}

/* ── Zeitdruck (Etappe 11, entschieden 2026-07-13) ───────────────────────────
   Sekunden pro Frage. **0 ist die Vorgabe und heißt: kein Zeitlimit.**

   Dass es abschaltbar ist und standardmäßig aus steht, ist kein Zufall, sondern die
   Bedingung, unter der ein Zeitlimit überhaupt zulässig ist: WCAG 2.2.1 („Timing
   Adjustable") verlangt, dass eine Nutzerin das Limit abschalten kann. Wer es einschaltet,
   hat es selbst gewählt — und kann es jederzeit wieder ausschalten.

   Die Werte sind Übungstempo, nicht Prüfungstempo: In einer echten schriftlichen Prüfung
   hat man deutlich mehr als 30 Sekunden pro Frage. Hier geht es um den Abruf unter Druck,
   nicht um eine Simulation. Darum heißen sie auch nicht „Prüfungstempo". */
export const QUIZ_TIME_LIMITS = [0, 30, 15] as const;
export type QuizTimeLimit = (typeof QUIZ_TIME_LIMITS)[number];

export const QUIZ_TIME_LIMIT_LABELS: Record<QuizTimeLimit, string> = {
  0: 'Ohne Zeit',
  30: '30 Sekunden',
  15: '15 Sekunden',
};

export function isQuizTimeLimit(value: unknown): value is QuizTimeLimit {
  return (QUIZ_TIME_LIMITS as readonly number[]).includes(value as number);
}

/**
 * Serien-Key im V1-Format `<mode>::{"deckOnly":…,"regions":…,"subgroups":…}`.
 *
 * **Der bestehende Schlüssel bleibt bitgleich** (ADR 0002): Ohne Bereichsfilter und mit
 * `scope: 'all'` kommt exakt der bisherige Text heraus. Jede Einschränkung erzeugt einen
 * **zusätzlichen** Schlüssel, nie einen veränderten.
 *
 * Das Feld `deckOnly` stammt aus V1 und stand bisher immer auf `false` — es war für genau
 * diesen Fall vorgesehen. „Nur mein Karteikasten" erzeugt darum sogar **denselben** Key,
 * den V1 dafür erzeugt hätte. Erst die feineren Filter (`wrong`/`unseen`/`difficult`)
 * brauchen ein Feld, das V1 nicht kennt — und das wird nur dann angehängt.
 */
export function quizSeriesKey(
  mode: QuizMode,
  regions: RegionId[] = [],
  scope: QuizScope = 'all',
  timeLimit: QuizTimeLimit = 0,
): string {
  const base = {
    deckOnly: scope !== 'all',
    regions: [...regions].sort(),
    subgroups: [] as string[],
  };
  const mitFilter = scope === 'all' || scope === 'deck' ? base : { ...base, filter: scope };
  /* Eine Runde unter Zeitdruck bekommt einen EIGENEN Schlüssel — dieselbe Regel wie beim
     Karten-Filter (8b). 60 % unter der Uhr ist nicht dasselbe wie 60 % in Ruhe; liefen beide
     in denselben Topf, wäre die „beste Quote" je Modus wertlos. Ohne Uhr (`0`) bleibt der
     Text **bitgleich** — ADR 0002. */
  const signature = timeLimit === 0 ? mitFilter : { ...mitFilter, timed: timeLimit };
  return `${mode}::${JSON.stringify(signature)}`;
}

interface QuestionSpec {
  prompt: string;
  correctLabel: string;
  distractorPool: Candidate[];
  imageUrl?: string;
  /**
   * **Jede Antwort, die auf diesen Fragetext richtig waere** — nicht nur die eine, die gemeint war.
   * Enthaelt `correctLabel` und alles, was ihm gleichsteht.
   *
   * Der Fragetext ist in fast jedem Modus ein einzelnes Muskelfeld: Name, Ursprung, Ansatz,
   * Funktion, ein Bild. **Keins davon ist eindeutig.** Gemessen am echten Bestand teilen sich
   * **10 Muskeln eine Funktion**, **23 einen Ursprung**, **29 einen Ansatz**, **6 ein Bild** (das
   * Quadriceps-Bild gehoert VIER Muskeln) — und 10 einen Namen.
   *
   * Wichtig: Es zaehlt die **Antwort**, nicht der Muskel. Ein Kandidat kann einen anderen Ursprung
   * haben und trotzdem richtig sein, weil sein ANSATZ derselbe Text ist wie der eines Muskels, der
   * den Ursprung teilt. Genau daran ist ein erster, muskelbasierter Ausschluss gescheitert:
   * „Os pubis, Ramus inferior" (M. gracilis) — und M. sartorius setzt ebenfalls am **Pes
   * anserinus** an. Wer nur Muskeln aussiebt, laesst dieses Label stehen.
   */
  gueltigeAntworten: Set<string>;
}

/** Kandidatenliste aus einem Muskelfeld — Label plus Herkunft. */
function candidates(all: readonly Muscle[], field: (m: Muscle) => string): Candidate[] {
  return all.map((m) => ({ label: field(m), muscleId: m.id }));
}

/**
 * Muskeln, die für den Modus taugliche Daten haben.
 *
 * Exportiert für den Prüfungsmodus (9c): der stellt sein Set aus dem Karteikasten
 * zusammen und muss vorher wissen, ob ein Muskel eine Bild- oder Innervationsfrage
 * überhaupt hergibt — sonst stünde eine Frage ohne Bild da.
 */
export function eligibleFor(muscles: readonly Muscle[], mode: QuizMode): Muscle[] {
  return eligible(muscles, mode);
}

function eligible(muscles: readonly Muscle[], mode: QuizMode): Muscle[] {
  const sub = MIXED_SUBMODES[mode]?.[0] ?? mode; // gemischte teilen die Anforderung der Submodi
  if (sub === 'innervation') return muscles.filter((m) => m.innervation.trim() !== '');
  if (sub === 'muscle-to-function') return muscles.filter((m) => m.functionDescription.trim() !== '');
  if (sub === 'image' || sub === 'name-image') return muscles.filter((m) => m.images.length > 0);
  if (sub === 'origin-insertion' || sub === 'insertion-origin') {
    return muscles.filter((m) => m.origin.trim() !== '' && m.insertion.trim() !== '');
  }
  return [...muscles];
}

/**
 * Alle Antworten, die auf denselben Fragetext richtig waeren.
 *
 * `zeigtDieFrage` ist das Feld, AUS DEM die Frage gebaut ist (Name, Ursprung, Ansatz, Funktion,
 * Bild); `antwortet` das Feld, das die Option traegt. Jeder Muskel, der den Fragetext teilt,
 * liefert eine gueltige Antwort — und die darf nicht als Distraktor auftauchen.
 */
function gueltigeAntworten(
  all: readonly Muscle[],
  zeigtDieFrage: (m: Muscle) => boolean,
  antwortet: (m: Muscle) => string,
): Set<string> {
  return new Set(all.filter(zeigtDieFrage).map(antwortet));
}

function specFor(muscle: Muscle, mode: QuizMode, all: readonly Muscle[]): QuestionSpec {
  /* Jeder Modus sagt selbst, WELCHES Feld sein Fragetext ist — die Frage zeigt den Namen? Dann
     meint sie auch den gleichnamigen Zwilling. Sie zeigt einen Ursprung? Dann meint sie jeden
     Muskel, der dort entspringt. */
  const teilt = (feld: (m: Muscle) => string) => (k: Muscle) => feld(k) === feld(muscle);

  switch (mode) {
    case 'muscle-to-function':
      return {
        prompt: muscle.nameLatin,
        correctLabel: muscle.functionDescription,
        distractorPool: candidates(all, (m) => m.functionDescription),
        gueltigeAntworten: gueltigeAntworten(
          all, teilt((m) => m.nameLatin), (m) => m.functionDescription,
        ),
      };
    case 'innervation':
      return {
        prompt: muscle.nameLatin,
        correctLabel: muscle.innervation,
        distractorPool: candidates(all, (m) => m.innervation),
        gueltigeAntworten: gueltigeAntworten(
          all, teilt((m) => m.nameLatin), (m) => m.innervation,
        ),
      };
    case 'origin-insertion':
      return {
        prompt: muscle.origin,
        correctLabel: muscle.insertion,
        distractorPool: candidates(all, (m) => m.insertion),
        gueltigeAntworten: gueltigeAntworten(
          all, teilt((m) => m.origin), (m) => m.insertion,
        ),
      };
    case 'insertion-origin':
      return {
        prompt: muscle.insertion,
        correctLabel: muscle.origin,
        distractorPool: candidates(all, (m) => m.origin),
        gueltigeAntworten: gueltigeAntworten(
          all, teilt((m) => m.insertion), (m) => m.origin,
        ),
      };
    case 'image': {
      /* Die Frage zeigt EIN Bild — und das Quadriceps-Bild gehoert vier Muskeln. Jeder, der
         dieses Bild traegt, ist eine richtige Antwort auf „Welcher Muskel ist abgebildet?".
         Nicht ueber `images[0]` vergleichen: ein Kandidat kann dasselbe Bild an zweiter Stelle
         fuehren. */
      const gezeigt = muscle.images[0]?.url;
      const zeigtDasselbeBild = (k: Muscle) => k.images.some((b) => b.url === gezeigt);
      return {
        prompt: 'Welcher Muskel ist abgebildet?',
        correctLabel: muscle.nameLatin,
        distractorPool: candidates(all, (m) => m.nameLatin),
        imageUrl: gezeigt,
        gueltigeAntworten: gueltigeAntworten(all, zeigtDasselbeBild, (m) => m.nameLatin),
      };
    }
    case 'function-to-muscle':
    default:
      return {
        prompt: muscle.functionDescription,
        correctLabel: muscle.nameLatin,
        distractorPool: candidates(all, (m) => m.nameLatin),
        gueltigeAntworten: gueltigeAntworten(
          all, teilt((m) => m.functionDescription), (m) => m.nameLatin,
        ),
      };
  }
}

/** Frage mit Text-Optionen (alle Modi außer „name-image"). */
function textQuestion(
  muscle: Muscle,
  concreteMode: QuizMode,
  all: readonly Muscle[],
  rng: () => number,
  qid: string,
  displayMode: QuizMode,
): QuizQuestion {
  const spec = specFor(muscle, concreteMode, all);
  const byId = new Map(all.map((m) => [m.id, m]));
  const distractors = pickDistractors(
    spec.distractorPool, spec.gueltigeAntworten, 3, rng, muscle, byId,
  );
  const picks = shuffle([{ label: spec.correctLabel, muscleId: muscle.id }, ...distractors], rng);
  const options = picks.map((candidate, oIndex) => ({
    id: `${qid}-o${oIndex}`,
    label: candidate.label,
    muscleId: candidate.muscleId,
  }));
  const correctId = options.find((o) => o.label === spec.correctLabel)?.id ?? options[0].id;
  return {
    id: qid,
    mode: displayMode,
    concreteMode,
    category: MODE_CATEGORY[concreteMode], // konkrete Richtung anzeigen (auch in „Gemischt")
    muscleId: muscle.id,
    prompt: spec.prompt,
    imageUrl: spec.imageUrl,
    options,
    correctId,
  };
}

/** Frage mit Bild-Optionen: Name als Prompt, vier Muskelbilder zur Auswahl (Name → Bild). */
function imageOptionQuestion(
  muscle: Muscle,
  all: readonly Muscle[],
  rng: () => number,
  qid: string,
  displayMode: QuizMode,
): QuizQuestion {
  /* **Hier waren zwei Optionen buchstaeblich dasselbe Bild.** 152 Bilddateien tragen 168
     Referenzen: Das Quadriceps-Bild gehoert VIER Muskeln, das Triceps-Bild zweien. Der Filter
     stand auf `m.id !== muscle.id` — verschiedene IDs, dieselbe Datei. Fragte die Runde nach
     `M. vastus intermedius`, standen bis zu vier optisch IDENTISCHE Kacheln zur Wahl, eine gruen,
     eine rot. Gemessen: 6,6 % der Runden. Das ist nicht schwer, das ist unloesbar.

     Darum wird nach der BILDDATEI ausgesiebt, nicht nach der ID — und der gleichnamige Zwilling
     fliegt ebenfalls raus (er waere fuer den gezeigten Namen genauso richtig). Zwei Distraktoren
     duerfen sich auch untereinander kein Bild teilen: zweimal dieselbe falsche Kachel sieht aus
     wie ein Fehler und verschenkt eine Option. */
  const gezeigt = muscle.images[0]?.url;
  const belegt = new Set<string>(gezeigt ? [gezeigt] : []);
  const pool: Muscle[] = [];
  for (const m of all) {
    const bild = m.images[0]?.url;
    if (!bild || belegt.has(bild)) continue;
    if (m.nameLatin === muscle.nameLatin) continue;
    belegt.add(bild);
    pool.push(m);
  }

  // Auch hier die Nachbarschaft zuerst: vier Bilder aus vier Koerperregionen verraten sich selbst.
  const distractors = nearestFirst(pool, (m) => m, muscle, rng).slice(0, 3);
  const picks = shuffle([muscle, ...distractors], rng);
  const options = picks.map((m, oIndex) => ({
    id: `${qid}-o${oIndex}`,
    label: m.nameLatin,
    imageUrl: m.images[0]?.url,
    muscleId: m.id,
  }));
  const correctId = options.find((o) => o.label === muscle.nameLatin)?.id ?? options[0].id;
  return {
    id: qid,
    mode: displayMode,
    concreteMode: 'name-image',
    category: MODE_CATEGORY['name-image'], // konkrete Richtung, auch innerhalb „Bild ↔ Name"
    muscleId: muscle.id,
    prompt: muscle.nameLatin,
    options,
    correctId,
  };
}

/**
 * Eine Frage zu EINEM vorgegebenen Muskel. Die Distraktoren kommen aus `all` — das
 * ist nicht dasselbe wie der Fragen-Pool: Der Prüfungsmodus (9c) fragt nur Muskeln
 * aus dem Karteikasten ab, zieht die falschen Antworten aber aus dem ganzen Bestand.
 * Ein Kasten mit vier Karten böte sonst vier immer gleiche Optionen.
 */
export function questionForMuscle(
  muscle: Muscle,
  mode: QuizMode,
  all: readonly Muscle[],
  rng: () => number,
  qid: string,
): QuizQuestion {
  const submodes = MIXED_SUBMODES[mode];
  const concrete = submodes ? submodes[Math.floor(rng() * submodes.length)] : mode;
  return concrete === 'name-image'
    ? imageOptionQuestion(muscle, all, rng, qid, mode)
    : textQuestion(muscle, concrete, all, rng, qid, mode);
}

/**
 * Fragen aus dem einen Topf, **falsche Antworten aus dem anderen** (Etappe 8b).
 *
 * Das ist die Entscheidung vom 2026-07-13: Wer „nur falsch beantwortete" filtert, hat
 * vielleicht drei Karten — zu wenig für eine Frage mit vier Optionen. Kämen die
 * Distraktoren aus demselben Topf, gäbe es gar keine Frage. Sie kommen darum von
 * **außerhalb**, und damit genügt schon **eine** passende Karte.
 */
export function generateQuizFrom(
  questionPool: readonly Muscle[],
  distractorPool: readonly Muscle[],
  mode: QuizMode,
  count = 10,
  rng: () => number = createRng(Date.now()),
): QuizQuestion[] {
  const pool = eligible(questionPool, mode);
  const chosen = shuffle(pool, rng).slice(0, Math.min(count, pool.length));

  return chosen.map((muscle, qIndex) =>
    questionForMuscle(muscle, mode, distractorPool, rng, `q${qIndex}-${muscle.id}`),
  );
}

/**
 * Erzeugt bis zu `count` MC-Fragen für den Modus. Jede Frage hat 4 Optionen
 * (1 richtig + bis zu 3 Distraktoren), Reihenfolge gemischt. „Gemischt"-Modi lösen
 * je Frage zufällig auf eine konkrete Richtung auf; „name-image" nutzt Bild-Optionen.
 *
 * Fragen und Distraktoren aus demselben Topf — der bisherige Fall.
 */
export function generateQuiz(
  muscles: readonly Muscle[],
  mode: QuizMode,
  count = 10,
  rng: () => number = createRng(Date.now()),
): QuizQuestion[] {
  return generateQuizFrom(muscles, muscles, mode, count, rng);
}
