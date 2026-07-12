# Task: Etappe 8d — Etymologie & Eselsbrücken

> **Zuerst lesen:** [Rahmen-Briefing Etappe 8](2026-07-12-etappe-8-uebersicht.md).

## Ziel
Der lateinische Name **ist** die Funktion — man muss ihn nur lesen können. „Flexor digitorum
longus": der lange Beuger der Finger. Wer das einmal versteht, muss 150 Namen nicht auswendig
lernen, sondern nur noch ein Vokabular von ~40 Bausteinen.

Das ist die billigste Lernhilfe im ganzen Projekt — und sie richtet sich direkt an das „Einfach"-Niveau.

## Kontext
- Branch: `feat/etappe-8d-etymologie`
- Betroffen:
  - **Neu:** eine **handgepflegte** Datendatei (Vorschlag: `src/data/editorial/etymology.json`)
  - [src/data/loader.ts](../../src/data/loader.ts) — mischt sie zu den Muskeln dazu
  - [src/data/validation.ts](../../src/data/validation.ts) — validiert sie (optional, aber getypt)
  - [src/pages/MuscleDetailPage.tsx](../../src/pages/MuscleDetailPage.tsx) — „Einfach"-Niveau
  - [src/types/index.ts](../../src/types/index.ts) — `MuscleEasyFields` erweitern (optional)

## ⚠️ Die Falle, die dich sonst die ganze Arbeit kostet

**`src/data/generated/` wird überschrieben.** `npm run migrate:data`
([scripts/migrate-v1-data.mjs](../../scripts/migrate-v1-data.mjs)) erzeugt diesen Ordner **neu** aus den
V1-Daten. Jeder redaktionelle Text, der dort landet, ist beim nächsten Migrationslauf **weg**.

Die Etymologie-Daten gehören darum in eine **eigene Datei außerhalb von `generated/`**, die der
Loader beim Laden dazumischt (`nameLatin` als Schlüssel — nicht die Routing-`id`, die kann sich bei
einer Neu-Migration ändern). Dasselbe gilt später für 9d (Palpation).

## Anforderungen
- [ ] Datenmodell: je Muskel **optional** `etymology` (Herleitung des Namens) und `mnemonic`
      (Merksatz). Beides Freitext, beides darf fehlen.
- [ ] Der Loader mischt die redaktionelle Datei zu; **fehlt sie oder ein Eintrag, rendert die
      Detailseite unverändert.** Kein Platzhalter, kein leerer Kasten.
- [ ] Anzeige im **„Einfach"-Niveau** der Detailseite (das gibt es bereits: `MuscleEasyFields`).
      Im „Fachlich"-Niveau bleibt es aus dem Weg.
- [ ] **Redaktion ist inkrementell**: Der Task gilt als fertig, wenn die *Mechanik* steht und eine
      **erste, fachlich geprüfte Charge** drin ist (Vorschlag: die ~40 Namensbausteine —
      `flexor`/`extensor`, `longus`/`brevis`, `major`/`minor`, `superficialis`/`profundus`,
      `abductor`/`adductor`, `supinator`/`pronator` …). Der Rest wächst nach.
- [ ] **Nichts erfinden.** Wo eine Herleitung unsicher ist, bleibt das Feld leer. Ein falscher
      Merksatz ist schlimmer als keiner — er wird auswendig gelernt.

## Nicht-Ziele
- Keine Etymologie für alle 150 Muskeln in einem Zug.
- Keine Änderung an den generierten Daten oder am Migrationsskript.
- Keine KI-generierten Merksätze ohne fachliche Prüfung durch den Projektinhaber.

## Definition of Done
- [ ] Loader-Merge getestet: Muskel **mit** Eintrag, Muskel **ohne** Eintrag, Datei ganz leer
- [ ] Test: `npm run migrate:data` (Regeneration) **löscht die redaktionellen Daten nicht**
- [ ] Erste Charge fachlich geprüft (Projektinhaber), keine erfundenen Herleitungen
- [ ] axe: 0 Verstöße auf der Detailseite (Light + Dark)
- [ ] Gate grün · CHANGELOG · **Statustafel 8d auf `fertig`** · PROJECT_STATE nachgezogen
