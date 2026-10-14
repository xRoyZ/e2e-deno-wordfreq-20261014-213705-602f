# wordfreq

`wordfreq` ist ein Kommandozeilen-Werkzeug auf Basis von Deno und TypeScript,
das eine Textdatei liest und die häufigsten Wörter mit ihrer Anzahl ausgibt.
Groß- und Kleinschreibung werden dabei zusammengefasst, die Ausgabe lässt sich
über `--top N` begrenzen und über `--min-length N` filtern, und mit `--json`
wird statt Text ein JSON-Array ausgegeben. Fehlende Dateien, leere Dateien und
falsche Aufrufe werden mit einer klaren deutschen Meldung und einem passenden
Exit-Code behandelt.

## Tech-Stack

- **Sprache:** TypeScript
- **Runtime:** Deno (aktuelle stabile Version)
- **Abhängigkeiten:** keine Fremdpakete, nur die Deno-Standardbibliothek
- **Tests:** `deno test` (eingebaute Test-Bibliothek)
- **Konfiguration:** `deno.json` mit den Tasks `start`, `test` und `check`

## Installation

Deno installieren (falls noch nicht vorhanden) und das Repository klonen:

```sh
git clone <repository-url>
cd wordfreq
```

Es sind keine weiteren Abhängigkeiten zu installieren. Optional prüft
`deno install` die Projektkonfiguration:

```sh
deno install
```

## Ausführen (Entwicklung)

Das Tool wird direkt über den Start-Task gestartet. Der Dateiparameter und alle
Optionen werden nach `--` übergeben:

```sh
deno task start -- beispiel.txt
deno task start -- beispiel.txt --top 5
deno task start -- --min-length 3 --json beispiel.txt
deno task start -- --help
```

Ein separater Build-Schritt für die Produktion ist nicht nötig, da Deno
TypeScript direkt ausführt. Der in `RUN.json` hinterlegte Start-Befehl ist:

```sh
deno run --allow-read main.ts
```

## Die Deno-Tasks

| Task | Befehl | Zweck |
| --- | --- | --- |
| `start` | `deno run --allow-read main.ts` | Startet die CLI. |
| `test` | `deno test --allow-all` | Führt die Testsuite aus. |
| `check` | `deno check main.ts src/*.ts tests/*.ts` | Typprüft alle Quell- und Testdateien. |

## Verwendung

### Aufrufschema

```text
wordfreq <datei> [--top N] [--min-length N] [--json] [--help|-h]
```

Optionen dürfen vor oder nach dem Dateipfad stehen.

### Optionen

| Option | Standard | Bedeutung |
| --- | --- | --- |
| `--top N` | `10` | Gibt höchstens `N` Einträge aus. `N` muss eine ganze Zahl größer als 0 sein. |
| `--min-length N` | `1` | Lässt alle Wörter weg, die kürzer als `N` Zeichen sind. `N` muss eine ganze Zahl größer als 0 sein. |
| `--json` | aus | Gibt auf stdout ausschließlich ein JSON-Array aus. |
| `--help`, `-h` | — | Zeigt das Aufrufschema und alle Optionen mit ihren Voreinstellungen und beendet mit Exit-Code 0. |

### Textausgabe

Ohne `--json` gibt `wordfreq` pro Eintrag eine Zeile `wort<TAB>anzahl` aus,
absteigend nach Anzahl und bei gleicher Anzahl alphabetisch aufsteigend sortiert:

```sh
deno task start -- beispiel.txt
```

```text
der	3
die	2
haus	1
```

### JSON-Ausgabe

Mit `--json` enthält stdout nur ein JSON-Array von Objekten mit den Feldern
`word` und `count`, in derselben Sortierung:

```sh
deno task start -- --json beispiel.txt
```

```json
[{"word":"der","count":3},{"word":"die","count":2},{"word":"haus","count":1}]
```

### Exit-Codes

| Exit-Code | Bedeutung |
| --- | --- |
| `0` | Erfolg (auch bei `--help`). |
| `1` | Laufzeit- bzw. Dateifehler (fehlende oder unlesbare Datei, Verzeichnis statt Datei, keine Wörter gefunden). |
| `2` | Nutzungsfehler (fehlender Dateiparameter, unbekannte Option, ungültiger Optionswert). |

Ergebnisse gehen auf stdout, Fehlermeldungen auf stderr und tragen das Präfix
`wordfreq: `.

## Funktionsumfang

- Häufigste Wörter einer Textdatei mit ihrer Anzahl ausgeben.
- Groß-/Kleinschreibung zusammenfassen (`Der der DER` ergibt einen Eintrag `der` mit Anzahl 3).
- Sortierung absteigend nach Anzahl, bei Gleichstand alphabetisch aufsteigend.
- `--top N` begrenzt die Anzahl der Einträge.
- `--min-length N` filtert zu kurze Wörter heraus.
- `--json` liefert maschinenlesbares JSON.
- `--help`/`-h` beschreibt Aufrufschema und Optionen.
- Klare deutsche Fehlermeldungen mit passendem Exit-Code, kein Stacktrace.
