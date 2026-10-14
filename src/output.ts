import type { WordCount } from "./count.ts";
import { CliError } from "./errors.ts";

/**
 * Rendering of the counted entries for stdout.
 *
 * Returns the exact stdout text for the given entries: plain text (one line per
 * entry, `wort<TAB>anzahl`) or a JSON array when `json` is set. Throws a
 * {@link CliError} with exit code 1 when `entries` is empty.
 */
export function renderEntries(
  entries: WordCount[],
  options: { json: boolean },
): string {
  if (entries.length === 0) {
    throw new CliError("wordfreq: keine Wörter gefunden", 1);
  }

  if (options.json) {
    const payload = entries.map((entry) => ({
      word: entry.word,
      count: entry.count,
    }));
    return `${JSON.stringify(payload)}\n`;
  }

  return entries.map((entry) => `${entry.word}\t${entry.count}`).join("\n") + "\n";
}
