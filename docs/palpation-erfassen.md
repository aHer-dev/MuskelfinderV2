# Palpation eintragen

> **Die Texte kommen aus dem Skript deiner Kollegen — nicht von der KI.**
> Am 2026-07-13 sind 21 KI-Vorschläge **allesamt gestrichen** worden. Das war die richtige
> Entscheidung: Palpation wird am Menschen angewandt, und du hast eine geprüfte Quelle.
> Ein Agent schreibt hier **nie** wieder etwas hinein, außer du lieferst den Text.

Bis dahin zeigt jede Muskel-Detailseite an der Stelle den Platzhalter
„Noch kein Palpationshinweis hinterlegt."

## Die Datei

`src/data/editorial/palpation.json`

⚠️ **Nicht** `src/data/generated/` — den Ordner schreibt `npm run migrate:data` neu, und alles
darin wäre weg. Das ist geprüft: Die Migration wurde real ausgeführt, `editorial/` hat sie überlebt.

## Das Format

Schlüssel ist der **lateinische Name, exakt wie in der App** (`nameLatin`) — nicht die ID aus der URL.
Alle vier Felder sind **optional**. Was du nicht sicher weißt, lässt du weg: Eine fehlende Zeile ist
besser als eine ungefähre.

```json
{
  "muskeln": {
    "M. deltoideus": {
      "position":  "Wie die Testperson liegt oder sitzt.",
      "landmarks": "Knöcherne Orientierungspunkte.",
      "technique": "Wie man ihn aufsucht und aktiviert (Widerstandstest).",
      "confusion": "Womit er typischerweise verwechselt wird."
    },
    "M. soleus": {
      "position":  "Bauchlage, Knie 90° gebeugt.",
      "technique": "Widerstand gegen Plantarflexion bei GEBEUGTEM Knie."
    }
  }
}
```

Der `_hinweis`-Block ganz oben in der Datei bleibt stehen — er wird ignoriert.

## Was passiert, wenn du dich vertippst

**Ein Muskelname, den es nicht gibt, lässt den Build scheitern.** Absichtlich: Der Eintrag würde
sonst still verschwinden, und niemandem fiele es auf.

```
PalpationDataError: palpation.json nennt Muskeln, die es nicht gibt: M. deltoideuz
```

Namen mit Bindestrich-Zusatz brauchen den **Halbgeviertstrich** (`–`), nicht den normalen
Bindestrich: `M. trapezius – Pars descendens`. Am sichersten kopierst du den Namen aus der App
oder aus `src/data/generated/muscles.json`.

## Prüfen

```bash
npm run test    # Namen, Felder, Migrationssicherheit
npm run dev     # dann eine Detailseite öffnen
```

Sobald ein Muskel einen Eintrag hat, ersetzt die einklappbare Sektion **„Am Körper finden"** den
Platzhalter — in **beiden** Detailtiefen, denn Palpation ist kein „Einfach"-Thema, sondern
Prüfungsstoff.

## Muskeln, die nicht direkt tastbar sind

Für die trägt man **nichts** ein — der Platzhalter ist dort die richtige Antwort. Bekannte Fälle:

| Muskel | Grund |
|---|---|
| M. vastus intermedius | Liegt unter dem M. rectus femoris. |
| M. gluteus minimus | Liegt unter dem M. gluteus medius. |
| M. semimembranosus | Weitgehend vom M. semitendinosus überdeckt. |
| M. subscapularis | Nur der laterale Rand, in der Achselhöhle. |
