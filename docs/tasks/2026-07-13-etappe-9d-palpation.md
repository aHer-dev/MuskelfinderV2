# Task: Etappe 9d — Palpation je Muskel

> **Zuerst lesen:** [Rahmen-Briefing Etappe 9](2026-07-13-etappe-9-uebersicht.md).

## Ziel
Physio- und Ergo-Schüler werden **am lebenden Körper** geprüft: „Zeig mir den M. supraspinatus."
Kein Datensatz der App sagt bisher, **wo man ihn findet**.

Entscheidung **E3** (2026-07-12): **Datenfeld anlegen, inkrementell füllen.** Der Task ist fertig,
wenn die **Mechanik** steht und eine **erste, fachlich geprüfte Charge** drin ist — der Rest wächst nach.

## Kontext
- Branch: `feat/etappe-9d-palpation`
- **Neu:** `src/data/editorial/palpation.json` (handgepflegt)
- Betroffen: [src/data/loader.ts](../../src/data/loader.ts) · [src/types/index.ts](../../src/types/index.ts) ·
  [src/pages/MuscleDetailPage.tsx](../../src/pages/MuscleDetailPage.tsx)
- **Blaupause: [src/data/etymology.ts](../../src/data/etymology.ts)** — dieselbe Mechanik, eine Ebene
  tiefer. Lies sie, bevor du anfängst; dann ist dieser Task klein.

## ⚠️ Die Falle (dieselbe wie in 8d)

**`src/data/generated/` wird von `npm run migrate:data` überschrieben.** Jeder Palpationstext, der
dort landet, ist beim nächsten Migrationslauf **weg** — und das merkt man erst Wochen später.

→ Die Daten gehören nach `src/data/editorial/`, der Loader mischt sie dazu. Schlüssel ist
**`nameLatin`** (ADR 0002 §2), **nicht** die Routing-`id` (die kann sich bei einer Neu-Migration ändern).

## Anforderungen
- [ ] Datenmodell je Muskel, alles **optional**:
      `palpation { position?, landmarks?, technique?, confusion? }` — Freitext.
      - `position` — Lagerung der Testperson
      - `landmarks` — knöcherne Orientierungspunkte
      - `technique` — wie man ihn aktiviert/spürt (Widerstandstest)
      - `confusion` — womit er typischerweise verwechselt wird
- [ ] Der Loader mischt zu; **fehlt der Eintrag, rendert die Detailseite unverändert** — kein leerer
      Kasten, keine Überschrift ohne Inhalt.
- [ ] Anzeige als eigene, **einklappbare** Sektion auf der Detailseite. Sichtbar in beiden Niveaus
      (Palpation ist kein „Einfach"-Thema — sie ist Prüfungsstoff).
- [ ] **Nichts erfinden.** Palpation ist Fachinhalt am Menschen. Wo unsicher: Feld leer lassen.
      Ein falscher Landmarken-Hinweis wird auswendig gelernt und am Patienten angewandt.
- [ ] **Erste Charge:** die Muskeln, die real palpiert geprüft werden — Vorschlag: gut tastbare,
      klinisch relevante (Rotatorenmanschette, Trapezius-Anteile, Deltoideus, Biceps/Triceps brachii,
      Glutei, Quadriceps, ischiocrurale Gruppe, Triceps surae, Tibialis anterior, Sternocleidomastoideus).

## Nicht-Ziele
- **Keine Videos, keine Bilder.** Bundle-Größe und Lizenz (die Bildfrage ist in 8f entschieden).
- Keine Palpation für alle 150 Muskeln in einem Zug.
- Keine Änderung an den generierten Daten oder am Migrationsskript.
- **Keine KI-generierten Palpationsanleitungen ohne fachliche Prüfung.**

## Definition of Done
- [ ] Loader-Merge getestet: Muskel **mit** Eintrag, **ohne** Eintrag, Datei ganz leer
- [ ] Test: `npm run migrate:data` **löscht die Palpationsdaten nicht** (real ausführen, wie in 8d)
- [ ] Test: Ein unbekannter `nameLatin` in `palpation.json` fällt auf (kein stilles Schlucken)
- [ ] **Erste Charge fachlich geprüft** (Projektinhaber) — keine erfundenen Anleitungen
- [ ] axe: 0 Verstöße auf der Detailseite (Light + Dark); die Sektion ist per Tastatur bedienbar
- [ ] Gate grün · CHANGELOG · **Statustafel 9d auf `fertig`** · PROJECT_STATE nachgezogen
