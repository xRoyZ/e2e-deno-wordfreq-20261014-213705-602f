/**
 * Pure word counting for the wordfreq CLI.
 *
 * The shape every other module shares:
 * `WordCount` is one entry of the result, `countWords` turns raw text into the
 * sorted, limited list of word frequencies. Pure: no file system, no console.
 */
export type WordCount = { word: string; count: number };

/**
 * Count words in `text`.
 *
 * Lowercase-folds, filters by `minLength`, sorts by count descending then word
 * ascending and limits the result to `top` entries.
 */
export function countWords(
  text: string,
  options: { top: number; minLength: number },
): WordCount[] {
  return [];
}
