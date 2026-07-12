# Etappe 7 — Rahmen-Briefing für alle Agenten

> **Lies das hier, bevor du ein Task-Briefing 7a–7f öffnest.** Es erklärt, *warum* Etappe 7
> existiert und welche Regeln in **jedem** ihrer Tasks gelten. Ohne diesen Rahmen baust du
> technisch korrekte Dinge, die am Ziel vorbeigehen.

## Pflichtlektüre vor jedem Task
1. [docs/PROJECT_STATE.md](../PROJECT_STATE.md) — der aktuelle Stand.
2. [docs/produkt-plan.md](../produkt-plan.md) — **Statustafel**: was ist offen, laufend, fertig,
   blockiert. Verbindlich.
3. [ADR 0007](../decisions/0007-einstieg-und-informationsarchitektur.md) — Einstieg `/heute`,
   Navigation nach Absichten.
4. [ADR 0008](../decisions/0008-abrufstufen-aus-leitner-box.md) — Abrufstufe wird abgeleitet,
   nicht gespeichert. (Relevant ab Etappe 8, aber prägt schon den Session-Fluss.)
5. Dein Task-Briefing.

## Das Problem, das Etappe 7 löst

Nach Etappe 6 hat die App volle V1-Parität — sie **kann** alles. Trotzdem verliert sie ihre Nutzerin
in den ersten drei Minuten:

- Sie öffnet auf `/suche`: **eine Liste mit 150 Muskeln.** Das ist keine Begrüßung, das ist eine Aufgabe.
- Der **Karteikasten ist leer** und muss von Hand befüllt werden. Spaced Repetition greift ins Leere,
  weil nie Karten drin sind.
- Die **Statistik zeigt Zahlen ohne Empfehlung.** Sie weiß, dass die Schulter schwach ist — und sagt es nicht.

Alles davon ist dasselbe Problem in verschiedenen Kostümen: **Die App hat keine Meinung dazu, was die
Studentin jetzt gerade tun soll.** Sie lädt die gesamte Strukturierungsarbeit auf sie ab.

**Nordstern:** Beim Öffnen genau **ein** Vorschlag — „Heute dran". Jeder Task in Etappe 7 zahlt darauf ein.

## Der uneinholbare Vorteil (nicht kaputtmachen)

Muskelfinder ist die einzige App im Feld, die **Nachschlagewerk und Lernwerkzeug zugleich** ist.
Anki kennt kein Nachschlagen, Kenhub keinen eigenen Karteikasten, AMBOSS kann beides — aber nicht für
Physio/Ergo/Logo, nicht kostenlos, nicht offline.

Daraus folgt die wichtigste Design-Regel dieser Etappe: **Der neue Einstieg darf das Nachschlagen
nicht teurer machen.** Es verliert den Startbildschirm — nicht die Erreichbarkeit.

## Reihenfolge und Abhängigkeiten

```
7a (Engine) ──▶ 7b (Route /heute) ──┬── 7c (Onboarding + Seeding)
                                     └── 7d (Suchfeld überall + Brücke B1)

7e (Falschantwort erklärt sich + B2)   ─┐ hängen an nichts,
7f (Streak + Freeze)                   ─┘ jederzeit parallel
```

7a ist die Wurzel: ohne Empfehlungs-Engine kein Heute-Screen. **7a und 7b gehören zusammen** —
7a allein produziert nichts, was man ansehen kann.

## Invarianten — gelten in JEDEM Task dieser Etappe

1. **Kein Zustand ohne Primärbutton.** Nichts fällig → „Alles wiederholt — 5 neue aus deinem Pfad?“.
   Kasten leer → Erstsetup. Ein leerer Bildschirm ist ein Ausstiegspunkt, kein Layout. Nutze das
   vorhandene `EmptyState`-Primitiv ([src/components/ui/EmptyState.tsx](../../src/components/ui/EmptyState.tsx)),
   es hat einen CTA-Slot.
2. **Genau ein Primärbutton pro Screen.** Wahlfreiheit ist die Kehrseite von Entscheidungslast.
   Die Zielgruppe hat vor der Prüfung keine übrig.
3. **UI rendert nur.** Empfehlung, Seeding, Streak-Rechnung, Normalisierung gehören nach `src/data/`
   bzw. `src/persistence/` und sind dort getestet. Keine Ableitungslogik im JSX.
4. **Persistenz ist additiv.** Neue Keys (Profession, Prüfungsdatum, Streak, Nachschlage-Zähler) dürfen
   das Backup-Format **erweitern**, niemals bestehende Felder ändern. `nameLatin` bleibt der
   Karten-Schlüssel, die Leitner-Box bleibt der Fälligkeits-Schlüssel — [ADR 0002](../decisions/0002-persistenz-und-datenkompatibilitaet.md)
   bleibt unangetastet. **Der Backup-Round-Trip-Test gegen die V1-Fixtures muss grün bleiben.**
5. **Kein Timer im normalen Lernen.** Zeitdruck gehört ausschließlich in den Prüfungsmodus (Etappe 9).
   Bei einer prüfungsängstlichen Zielgruppe erzeugt er Vermeidung, nicht Leistung.
6. **Erwachsene Marke.** Klinisch, orange-akzentuiert. Kein Maskottchen, kein Konfetti, keine
   Schuld-Botschaft, kein Cartoon-Feuer. Bewegung nur zweckgebunden, `prefers-reduced-motion` respektieren.
7. **Deep-Links dürfen nicht brechen.** Bestehende Routen bleiben erreichbar, auch wenn sie den
   Tab-Rang verlieren.
8. **Statisch, kein Backend.** Keine externen Laufzeit-Requests. Alles lokal — das ist ein
   Verkaufsargument („kein Konto, keine Überwachung, funktioniert im Funkloch“), kein Kompromiss.

## Definition of Done — zusätzlich zu jedem Task-DoD

- [ ] `npm run lint && npm run test && npm run build` grün, **bevor** „fertig“ gemeldet wird
- [ ] CHANGELOG-Eintrag
- [ ] **Statustafel in [docs/produkt-plan.md](../produkt-plan.md) aktualisiert** (Status + Branch).
      Wer das vergisst, hinterlässt den nächsten Agenten im Blindflug.
- [ ] [docs/PROJECT_STATE.md](../PROJECT_STATE.md): „Nächster Schritt“ nachgezogen
- [ ] Kreuz-Review durch den **anderen** Agenten (AGENT_WORKFLOW.md §5), keine offenen `[BLOCKER]`

## Nicht-Ziele der GESAMTEN Etappe 7

Wer davon etwas anfasst, ist im falschen Task:

- **Kein FSRS/SM-2.** Leitner bleibt. Begründung in [produkt-plan.md](../produkt-plan.md), „Bewusst nicht“.
- **Keine funktionellen Gruppen, keine Abzeichen, kein Prüfungsmodus, keine Palpation.** Das ist
  Etappe 9 und **blockiert** — es fehlen Entscheidungen des Projektinhabers (E1–E3).
- **Keine Freitext-Abrufstufe.** Das ist 8a.
- **Kein Nachrendern der 47 fehlenden Bilder.** Die Bildquiz-Modi schließen bildlose Muskeln bereits
  aus ([src/data/quiz.ts:89](../../src/data/quiz.ts)).
- **Kein Konto, kein Cloud-Sync, keine Bestenliste, kein Tracking, keine Werbung, kein KI-Chat.**
