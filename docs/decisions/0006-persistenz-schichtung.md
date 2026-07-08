# ADR 0006: Schichtung des Persistenz- & Kompatibilitätskerns

## Status: akzeptiert · 2026-07-08

## Kontext
[ADR 0002](0002-persistenz-und-datenkompatibilitaet.md) friert den V1-Backup-Datei-Vertrag
ein (Karten nach Muskelname, 7 Fächer, XP-Kurve, `quizSeries`-Modus-Keys). Etappe 2 setzt
diesen Vertrag um. Offen war, **wie** die Schichten geschnitten werden: Wo lebt die V1-nahe
Form, wie bleibt der Round-Trip verlustfrei, und wie bleibt das saubere Domänenmodell
(`src/types`) davon unberührt?

## Entscheidung

1. **Reiner Adapter + dünne Store-Bridge.**
   `src/persistence/` enthält ausschließlich DOM-freie, getestete Logik:
   - `sanitize.ts` — die V1-Sanitisierungsregeln 1:1 (geklammerte Fächer, Ints ≥ 0,
     `correct ≤ answers`, Historie ≤ 5, Datums-Normalisierung).
   - `backup.ts` — `parseBackup` (v1/v2/Legacy, Ablehnung von zu neu/unvollständig/unbekannt)
     und `buildBackup`/`serializeBackup`.
   - `leitner.ts` / `xp.ts` — die eingefrorenen Domänenkonstanten & -transitions
     (Intervalle `1/3/7/14/30/90/180`, Kurve `round(50·(l−1)^1.658)`).
   - `backup-service.ts` — die einzige Stelle, die Stores kennt (`exportBackup`/`importBackup`);
     `download.ts` — der einzige DOM-Seiteneffekt (Blob-Download).

2. **Persistierter Store-Zustand = V1-Sektionsform.**
   `useProgressStore` hält `{ flashcards, xp }` **exakt** in der Backup-Form; `useQuizStore`
   hält die `quizSeries`-Sektion. Dadurch ist Import → State → Export strukturell verlustfrei
   (kein verlustbehaftetes Hin-und-Her-Mapping). Das saubere Domänenmodell (`CardProgress`,
   `UserProgress`) wird über **Selektoren** abgeleitet, nicht doppelt gespeichert.

3. **Karten nach Muskelname; id-Auflösung erst in der UI.**
   Die Stores schlüsseln Karten nach `nameLatin` (ADR 0002 §2). Die Übersetzung
   Routing-`id` ↔ `nameLatin` macht die UI (Etappe 3) über die Datenschicht — die
   Persistenzschicht bleibt frei von einer Abhängigkeit auf die Muskeldaten.

4. **Eigene, saubere V2-localStorage-Keys** (`mf.progress`, `mf.quizSeries`, `mf.collection`).
   Level wird nie gespeichert, immer aus `totalXP` abgeleitet. Unbekannte `quizSeries`-Keys
   werden verbatim erhalten.

5. **Sammlung/Merkliste ist V2-only.** `useCollectionStore` ist **nicht** Teil des
   Backup-Formats und hat daher keine Backup-Bridge.

## Konsequenzen
- **Gut:** Round-Trip ist per Konstruktion verlustfrei und durch Golden-File-Tests gegen
  V1-Format-Fixtures abgesichert. Reiner Kern ohne DOM/Store ist voll unit-testbar. Die
  UI kann sich später gegen Selektoren bauen, ohne die Speicherform zu kennen.
- **Preis:** Die Stores tragen V1-Eigenheiten (deutsche XP-Rating-Wörter intern,
  Namens-Schlüssel). Das ist bewusst gekapselt; die Domänen-API der Stores bleibt in der
  sauberen `CardRating`-Sprache (`correct`/`unsure`/`wrong`).
- **Testpflicht (erfüllt):** `backup-roundtrip.test.ts` prüft dauerhaft Import→State→Export,
  Level-/Fälligkeits-Erhalt und die Ablehnung fehlerhafter/zu neuer Dateien.
