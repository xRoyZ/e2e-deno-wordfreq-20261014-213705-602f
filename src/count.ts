/**
 * Pure word counting for the wordfreq CLI.
 *
 * The shape every other module shares:
 * `WordCount` is one entry of the result, `countWords` turns raw text into the
 * sorted, limited list of word frequencies. Pure: no file system, no console.
 */
export type WordCount = { word: string; count: number };

/**
 * Matches a word as a contiguous run of Unicode letters and digits.
 *
 * `\p{L}` covers umlauts and `ß`, `\p{N}` covers digits. Whitespace, punctuation,
 * line breaks and every control or escape character separate words and are
 * therefore never part of the token — nothing from the input can reach the
 * output as a control sequence.
 */
const WORD_PATTERN = /[\p{L}\p{N}]+/gu;

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
  const { top, minLength } = options;

  const counts = new Map<string, number>();
  for (const token of text.match(WORD_PATTERN) ?? []) {
    const word = token.toLowerCase();
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  const entries: WordCount[] = [];
  for (const [word, count] of counts) {
    if (word.length >= minLength) {
      entries.push({ word, count });
    }
  }

  entries.sort((a, b) => {
    if (a.count !== b.count) {
      return b.count - a.count;
    }
    return a.word.localeCompare(b.word, "de");
  });

  return top >= 0 ? entries.slice(0, top) : entries;
}
