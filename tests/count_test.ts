import { countWords, type WordCount } from "../src/count.ts";

/**
 * Contract tests for the pure counting core only.
 *
 * They cover case folding, the `minLength` filter, the count-desc/word-asc
 * sorting with ties, the `top` limit, the empty input, counting correctness and
 * the security requirement that only letters and digits become words.
 */

function assertEquals<T>(actual: T, expected: T, message?: string): void {
  const got = JSON.stringify(actual);
  const want = JSON.stringify(expected);
  if (got !== want) {
    throw new Error(message ?? `expected ${want}, got ${got}`);
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const DEFAULTS = { top: 100, minLength: 1 };

Deno.test("case is folded: 'Der der DER' yields exactly one entry 'der' with count 3", () => {
  const entries = countWords("Der der DER", DEFAULTS);
  assertEquals(entries, [{ word: "der", count: 3 }]);
});

Deno.test("empty input yields an empty list", () => {
  assertEquals(countWords("", DEFAULTS), []);
});

Deno.test("input without any words yields an empty list", () => {
  assertEquals(countWords("   \n\t !!! ??? --- \r\n", DEFAULTS), []);
});

Deno.test("counts words correctly across lines and repeated words", () => {
  const entries = countWords("a b a\nc\ta b a", DEFAULTS);
  assertEquals(entries, [
    { word: "a", count: 4 },
    { word: "b", count: 2 },
    { word: "c", count: 1 },
  ]);
});

Deno.test("minLength drops words shorter than the limit", () => {
  const text = "a bb ccc a bb a";
  const entries = countWords(text, { top: 100, minLength: 2 });
  assertEquals(entries, [
    { word: "bb", count: 2 },
    { word: "ccc", count: 1 },
  ]);
});

Deno.test("minLength is measured on the lowercase form", () => {
  const entries = countWords("AB cd EF", { top: 100, minLength: 2 });
  assertEquals(entries, [
    { word: "ab", count: 1 },
    { word: "cd", count: 1 },
    { word: "ef", count: 1 },
  ]);
});

Deno.test("ties sort alphabetically ascending", () => {
  const entries = countWords("zebra apple mango apple zebra mango", DEFAULTS);
  assertEquals(entries, [
    { word: "apple", count: 2 },
    { word: "mango", count: 2 },
    { word: "zebra", count: 2 },
  ]);
});

Deno.test("count descending wins over the alphabetical tie-break", () => {
  const entries = countWords("bb bb bb aa cc aa cc", DEFAULTS);
  assertEquals(entries, [
    { word: "bb", count: 3 },
    { word: "aa", count: 2 },
    { word: "cc", count: 2 },
  ]);
});

Deno.test("top limits the number of entries", () => {
  const entries = countWords("a a b b c c d d", { top: 2, minLength: 1 });
  assertEquals(entries, [
    { word: "a", count: 2 },
    { word: "b", count: 2 },
  ]);
});

Deno.test("top larger than the result keeps every entry", () => {
  const entries = countWords("a b", { top: 10, minLength: 1 });
  assertEquals(entries, [
    { word: "a", count: 1 },
    { word: "b", count: 1 },
  ]);
});

Deno.test("umlauts and eszett are letters and are lowercased", () => {
  const entries = countWords("Über über ÄPFEL Straße", DEFAULTS);
  assertEquals(entries, [
    { word: "über", count: 2 },
    { word: "äpfel", count: 1 },
    { word: "straße", count: 1 },
  ]);
});

Deno.test("punctuation and control characters never become words", () => {
  const entries = countWords("hi!\n\x1b[31mred\x07\t(bye);", DEFAULTS);
  assertEquals(entries, [
    { word: "31mred", count: 1 },
    { word: "bye", count: 1 },
    { word: "hi", count: 1 },
  ]);
  for (const entry of entries) {
    assert(
      /^[\p{L}\p{N}]+$/u.test(entry.word),
      `word "${entry.word}" is not a plain letter/digit token`,
    );
  }
});

Deno.test("returns a fresh array each call (no state between calls)", () => {
  const first = countWords("a a", DEFAULTS);
  const second = countWords("a", DEFAULTS);
  assertEquals(first, [{ word: "a", count: 2 }]);
  assertEquals(second, [{ word: "a", count: 1 }]);
});

Deno.test("WordCount entries expose word and count only", () => {
  const entries: WordCount[] = countWords("a", DEFAULTS);
  assertEquals(Object.keys(entries[0]).sort(), ["count", "word"]);
});
