# ADR 0002: Persistenz- & Datenkompatibilität zu Muskelfinder V1

## Status: akzeptiert · 2026-07-08

## Kontext
V2 ersetzt die statische Vanilla-App V1 (`aHer-dev/Muskelfinder`), **läuft aber auf einer
eigenen, isolierten Origin** (eigene Domain). Damit wandert `localStorage` **nicht**
automatisch mit — die **einzige** Brücke für den Fortschritt bestehender Schüler ist der
**Backup-Datei-Import**. Diese Backup-Dateien (`muskelfinder-backup-*.json`) müssen weiter
funktionieren. Das ist eine **harte, nicht verhandelbare Anforderung**.

Das V1-Format ist im `BackupManager` (V1 `assets/js/nav.js`), `ProgressManager`
(`progress.js`) und `Gamification` (`gamification.js`) exakt definiert. Dieser ADR friert
den Vertrag ein, damit keine Etappe ihn versehentlich bricht.

## Entscheidung

### 1. Der Backup-Datei-Vertrag (eingefroren)
V2 **importiert** dieses Format und **exportiert** es byte-nah identisch (round-trip-fähig):

```jsonc
{
  "backupType": "muskelfinder-backup",   // Pflicht-Diskriminator
  "version": 2,                          // Import akzeptiert 1 UND 2; Export schreibt 2
  "exportedAt": "<ISO-8601>",
  "flashcards": {
    "version": 2,
    "cards": {
      "<Muskelname>": {                  // ← Schlüssel = lateinischer Name, NICHT id!
        "fach": 1,                       // 1..7 (Leitner, geklammert)
        "nextDue": "<ISO>",              // Fälligkeit
        "totalCorrect": 0,               // int >= 0
        "totalWrong": 0,                 // int >= 0
        "lastSeen": "<ISO>|null",
        "difficult": false               // bool
      }
    }
  },
  "xp": { "version": 2, "totalXP": 0, "lastDailyBonus": "YYYY-MM-DD|null" },
  "quizSeries": {
    "<modusKey>": {
      "rounds": 0, "answers": 0, "correct": 0,   // correct <= answers
      "history": [ { "pct": 0, "correct": 0, "answered": 0 } ]  // max. 5, jüngste 5
    }
  }
}
```

**Zusätzlich beim Import zu akzeptieren (Abwärtskompatibilität):**
- `version: 1` (gleiche Sektionen, alte Nummer).
- **Legacy-Flashcard-only**: Objekt ohne `backupType`, aber mit `cards` → nur Lernkarten.
- `version > 2` → **ablehnen** mit klarer Meldung („neuere Version").
- Fehlende Pflicht-Sektion (`flashcards`/`xp`/`quizSeries`) im Full-Backup → ablehnen.

**Sanitisierungs-Regeln (aus V1 portieren, getypt + getestet):**
`fach` auf 1..7 klammern · Datums-Strings via `Date.parse` normalisieren (Fallback = jetzt) ·
Ints ≥ 0 erzwingen · `correct <= answers` · `history` auf letzte 5 kürzen ·
beschädigte Sektion → Fehler, nicht stillschweigend leeren.

### 2. Join-Schlüssel = lateinischer Name, nicht `id`
Lernkarten sind im Backup nach **Muskelname** (`"M. pectoralis minor"`) verschlüsselt.
V2 **muss** den originalen V1-`Name` verlustfrei als kanonisches Feld behalten
(`nameLatin` == V1-`Name`) und die Persistenz-/Backup-Schicht **nach diesem Namen**
schlüsseln. Die Routing-`id` (Slug) wird daraus abgeleitet, ist aber **nie** der
Persistenz-Schlüssel. So bleibt der Round-Trip verlustfrei.

### 3. Leitner: 7 Fächer bleiben
Intervalle (Tage) fest: `Fach 1→1, 2→3, 3→7, 4→14, 5→30, 6→90, 7→180`.
Das Design-Mockup (5 Fächer) wird auf **7** angepasst — Kompatibilität schlägt Pixel-Treue.

### 4. XP-Kurve bleibt identisch
`xpForLevel(l) = round(50 · (l−1)^1.658)`, `Level 1 = 0`, Cap `Level 99 = 99780 XP`.
Level wird aus `totalXP` **abgeleitet**, nie separat gespeichert — so ergibt ein
importiertes `totalXP` exakt dasselbe Level wie in V1. Das Design-Feld `xpToNext` wird aus
dieser Kurve berechnet.

### 5. localStorage-Keys sind bei isolierter Origin frei
Weil V2 auf eigener Origin läuft, sind die V1-Keys (`muskelfinder_progress_v1` etc.) für die
Übernahme **irrelevant** — V2 darf saubere, eigene Keys wählen. **Verbindlich ist allein das
Backup-Datei-Format oben.** Die UI-/Session-Keys von V1 (`_search_state`, `_selected_packages`,
`_quiz_filter_v1`, `_theme`, `_expert`, Mode-Keys, Config-Cache) werden **nicht** übernommen.

## Konsequenzen
- **Gut:** Bestandsnutzer verlieren nichts (Import). Kein Alt-localStorage-Schema als Ballast.
  Persistenzschicht ist über einen versionierten Adapter von der UI entkoppelt → künftige
  Schema-Sprünge liegen hinter einem Migrator, nicht in Komponenten.
- **Schlecht/Preis:** V2 trägt die V1-Feld-Eigenheiten weiter (Karten nach Name, 7 Fächer,
  `quizSeries`-Modus-Keys). Diese leben **gekapselt** in der Persistenzschicht (Etappe 2);
  das saubere Domänenmodell (`types.ts`) bleibt davor unberührt (Adapter mappt).
- **Testpflicht:** Etappe 2 wird gegen **echte V1-Backup-Fixtures** getestet (Golden-File +
  Round-Trip). Ohne diese Tests gilt der Vertrag als nicht erfüllt.
- **Offen für Etappe 2:** exakte Menge der `quizSeries`-Modus-Keys aus V1 `quiz-session.js`
  inventarisieren; unbekannte Keys beim Import **verbatim** durchreichen.
