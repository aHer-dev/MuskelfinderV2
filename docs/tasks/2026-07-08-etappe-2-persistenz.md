# Task: Etappe 2 — Persistenz- & Kompatibilitätskern ★

## Ziel
Die harte Kompatibilitätsgarantie aus [ADR 0002](../decisions/0002-persistenz-und-datenkompatibilitaet.md)
steht als getypter, getesteter Kern: V1-Backup-Dateien lassen sich import-/exportieren
(round-trip-verlustfrei), und die persistierten Stores (Leitner 7 Fächer, XP-Kurve,
Quiz-Serien-Statistik, Sammlung) sind verfügbar — **vor** den Screens.

## Kontext
- Branch: `feat/etappe-0-fundament` (Etappe 0+1 noch uncommittet auf demselben Branch)
- Betroffene Dateien/Module:
  - `src/persistence/*` — Sanitizer, Backup-Adapter, Leitner- & XP-Kernlogik, Store-Bridge
  - `src/store/useProgressStore.ts` (Leitner 7 + XP), `useQuizStore.ts` (Serien-Statistik),
    `useCollectionStore.ts` (Merkliste)
  - `src/persistence/__fixtures__/*` — echte V1-Format-Backup-Fixtures
- Relevante Doku: ADR 0002 (Vertrag, heilig), docs/migration-plan.md §Etappe 2, ROADMAP.md Phase 2
- V1-Quellen (Vertrag): `../Muskelfinder/assets/js/nav.js` (BackupManager),
  `progress.js` (ProgressManager), `gamification.js` (Gamification), `quiz-session.js` (quizSeries).

## Anforderungen
- [ ] Sanitizer für `flashcards`/`xp`/`quizSeries` als getypte TS-Funktionen (V1-Regeln 1:1):
      `fach` auf 1..7 klammern, Ints ≥ 0, `correct ≤ answers`, `history` auf letzte 5, Datums-Normalisierung.
- [ ] Backup-Adapter: `parseBackup` akzeptiert v1, v2 und Legacy-Flashcard-only; lehnt
      `version > 2`, fehlende Pflicht-Sektion und unbekanntes Format mit klarer Meldung ab.
- [ ] Export erzeugt exakt das V1-Format (`backupType`, `version: 2`, `exportedAt`, Sektionen).
- [ ] Leitner 7 Fächer, Intervalle `1/3/7/14/30/90/180`; Karten nach **Muskelname** geschlüsselt.
- [ ] XP-Kurve `round(50·(l−1)^1.658)`, Level 1 = 0, Cap 99 = 99780; Level **abgeleitet**, nie gespeichert.
- [ ] Stores persistieren unter sauberen eigenen V2-Keys (`mf.progress`, `mf.quizSeries`, `mf.collection`).
- [ ] Unbekannte `quizSeries`-Modus-Keys beim Import **verbatim** durchreichen.

## Nicht-Ziele (explizit außerhalb dieses Tasks)
- Screens, Layout, Design, Responsive.
- In-Session-Quiz-Ablauf (Fragen generieren, Auswertung) — das ist Etappe 3d.
- id↔nameLatin-Auflösung in der UI — Etappe 3 löst Slugs auf Namen auf.

## Definition of Done
- [ ] Golden-File-/Round-Trip-Tests gegen V1-Format-Fixtures: Import → State → Export semantisch gleich.
- [ ] Fehlerhafte/zu neue Backups werden abgelehnt (getestet).
- [ ] 7-Fach-Intervalle korrekt; Level aus totalXP korrekt abgeleitet (getestet).
- [ ] lint + test + build grün.
- [ ] ADR zur Persistenz-Schichtung angelegt; CHANGELOG-Eintrag; PROJECT_STATE aktualisiert.
