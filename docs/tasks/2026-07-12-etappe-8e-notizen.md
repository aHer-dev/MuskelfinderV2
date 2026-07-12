# Task: Etappe 8e — Eigene Notizen je Muskel

> **Zuerst lesen:** [Rahmen-Briefing Etappe 8](2026-07-12-etappe-8-uebersicht.md).

## Ziel
Was die Dozentin im Unterricht sagt, steht in keinem Datensatz. Die Studentin muss es irgendwo
hinschreiben können — **dort, wo der Muskel steht**, nicht in einer fremden App.

## Kontext
- Branch: `feat/etappe-8e-notizen`
- Betroffen:
  - **Neu:** `src/store/useNotesStore.ts` (Key `mf.notes`)
  - [src/persistence/types.ts](../../src/persistence/types.ts) + [sanitize.ts](../../src/persistence/sanitize.ts)
    + [backup.ts](../../src/persistence/backup.ts) + [backup-service.ts](../../src/persistence/backup-service.ts)
  - [src/pages/MuscleDetailPage.tsx](../../src/pages/MuscleDetailPage.tsx)

## Das Muster steht schon — kopiere es, erfinde nichts Neues

Etappe 7 hat **dreimal** eine additive Backup-Sektion gebaut. Halte dich exakt daran:
[`useLookupStore`](../../src/store/useLookupStore.ts) · [`useProfileStore`](../../src/store/useProfileStore.ts) ·
[`useStreakStore`](../../src/store/useStreakStore.ts).

Die Regeln, die dabei gelten (ADR 0002 §1):
- Die Sektion ist **optional** und heißt hier `notes`.
- Sie wird **nur geschrieben, wenn es Notizen gibt** — wer keine schreibt, bekommt eine Backup-Datei,
  die bitgleich zu der von vor 8e ist.
- Ein **altes** Backup ohne die Sektion **löscht die lokalen Notizen nicht**.
- Die **Backup-Version bleibt 2.** Die drei Pflicht-Sektionen bleiben unangetastet.
- Schlüssel ist **`nameLatin`** (ADR 0002 §2), nicht die Routing-`id`.

## Anforderungen
- [ ] Freitext-Notiz je Muskel, lokal gespeichert, sofort sichtbar auf der Detailseite.
- [ ] Speichern ohne „Speichern"-Knopf (debounced) — oder mit, aber dann **verlustfrei**: Eine Notiz,
      die beim Wegnavigieren verschwindet, ist schlimmer als gar keine.
- [ ] Notizen sind **durchsuchbar**? → **Nein, nicht in diesem Task** (siehe Nicht-Ziele).
- [ ] Leere Notiz = keine Notiz (kein leerer Eintrag im Backup).
- [ ] Der Muskel mit Notiz ist auf der Detailseite erkennbar — dezent, nicht als Ausrufezeichen.

## Nicht-Ziele
- **Keine Volltextsuche über Notizen.** Das ist eine eigene Entscheidung (Suchindex, Gewichtung) und
  gehört nicht in diesen Task.
- Kein Markdown, kein Rich-Text, keine Bilder in Notizen. Freitext.
- Keine Notizen an Karten (Leitner) — sie hängen am **Muskel**, nicht an der Karte.
- Keine Cloud-Sync, kein Export als eigene Datei (das Backup trägt sie mit).

## Definition of Done
- [ ] Store getestet (schreiben, überschreiben, leeren = löschen)
- [ ] **Backup-Tests wie bei `lookups`/`profile`/`streak`:** Sektion fehlt ohne Notizen · Notizen
      überleben Export→Import · **altes Backup löscht die Notizen nicht** · kaputte Sektion kippt den
      Import nicht
- [ ] **Round-Trip gegen die V1-Fixtures grün**
- [ ] axe: 0 Verstöße; das Textfeld hat ein Label und ist per Tastatur erreichbar
- [ ] Gate grün · CHANGELOG · **Statustafel 8e auf `fertig`** · PROJECT_STATE nachgezogen
