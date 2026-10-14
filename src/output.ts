import type { WordCount } from "./count.ts";

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
  return "";
}
