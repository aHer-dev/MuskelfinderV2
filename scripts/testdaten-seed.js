// === Muskelfinder-Testdaten setzen (in der Browser-Konsole ausfuehren) ===
(() => {
  const tag = (d) => new Date(Date.now() + d * 864e5).toISOString();
  const stamp = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
  const karte = (o = {}) => ({ fach: 3, nextDue: tag(-1), totalCorrect: 4, totalWrong: 0, lastSeen: tag(-2), difficult: false, ...o });

  localStorage.setItem('mf.progress', JSON.stringify({ state: {
    flashcards: { version: 2, cards: {
      'M. pectoralis major':      karte({ fach: 7, totalCorrect: 12 }),          // Fach 7 -> Freitext
      'M. flexor digitorum longus': karte({ fach: 7, totalCorrect: 9 }),         // Fach 7 -> Freitext
      'M. psoas minor':           karte({ fach: 4, totalWrong: 3 }),             // falsch beantwortet
      'M. iliacus':               karte({ fach: 1, lastSeen: null, totalCorrect: 0 }), // nie gesehen
      'M. subclavius':            karte({ fach: 2, difficult: true }),           // schwierig markiert
      'M. serratus anterior':     karte({ fach: 6, nextDue: tag(20) }),          // gemeistert, nicht faellig
      'M. trapezius – Pars descendens': karte({ fach: 5, nextDue: tag(15) }),    // gemeistert, nicht faellig
      'M. masseter':              karte({ fach: 2, totalWrong: 2 }),             // bildlos -> Platzhalter
    }},
    xp: { version: 2, totalXP: 320, lastDailyBonus: null },
  }, version: 0 }));

  localStorage.setItem('mf.profile', JSON.stringify({ state: {
    profession: 'physio', examDate: stamp(5),            // Pruefung in 5 Tagen -> hoehere Tagesdosis
  }, version: 0 }));

  localStorage.setItem('mf.lookups', JSON.stringify({ state: {
    lookups: { version: 2, entries: {
      'M. gluteus medius': { count: 4, lastLookup: tag(-1) },   // 4x nachgeschlagen, NICHT im Kasten
      'M. piriformis':     { count: 3, lastLookup: tag(-2) },
    }},
  }, version: 0 }));

  localStorage.setItem('mf.quizSeries', JSON.stringify({ state: {
    quizSeries: {
      'innervation::{"deckOnly":false,"regions":[],"subgroups":[]}': { rounds: 3, answers: 30, correct: 9,  history: [] },
      'image::{"deckOnly":false,"regions":[],"subgroups":[]}':       { rounds: 2, answers: 20, correct: 18, history: [] },
    },
  }, version: 0 }));

  localStorage.setItem('mf.streak', JSON.stringify({ state: {
    streak: { version: 2, current: 4, best: 6, lastCompletedDay: stamp(-1), freezes: 1, day: stamp(-1), reviewedToday: 0, earnedFreezeToday: false },
  }, version: 0 }));

  localStorage.removeItem('mf.notes');
  location.reload();
})();
