import { renderEntries } from "../src/output.ts";
import { CliError } from "../src/errors.ts";
import type { WordCount } from "../src/count.ts";

/**
 * Contract tests for the stdout rendering only.
 *
 * They cover the module's own contract — the text layout, the JSON layout
 * (valid JSON, field names and order), and the error for an empty entry list —
 * and nothing the counting or file-reading modules own.
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

const entries: WordCount[] = [
  { word: "der", count: 3 },
  { word: "die", count: 2 },
  { word: "und", count: 1 },
];

Deno.test("text output renders one word<TAB>count line per entry", () => {
  const text = renderEntries(entries, { json: false });
  assertEquals(text, "der\t3\ndie\t2\nund\t1\n");
});

Deno.test("text output keeps the given order", () => {
  const text = renderEntries(
    [
      { word: "zebra", count: 5 },
      { word: "alpha", count: 5 },
    ],
    { json: false },
  );
  assertEquals(text, "zebra\t5\nalpha\t5\n");
});

Deno.test("json output is a valid array of {word, count} objects", () => {
  const text = renderEntries(entries, { json: true });
  const parsed = JSON.parse(text);
  assert(Array.isArray(parsed), "json output is not an array");
  assertEquals(parsed, [
    { word: "der", count: 3 },
    { word: "die", count: 2 },
    { word: "und", count: 1 },
  ]);
});

Deno.test("json output uses exactly the fields word and count", () => {
  const parsed = JSON.parse(renderEntries(entries, { json: true }));
  for (const item of parsed) {
    assertEquals(Object.keys(item), ["word", "count"]);
  }
});

Deno.test("json output carries no extra stdout content", () => {
  const text = renderEntries(entries, { json: true });
  assertEquals(text.trimStart(), text);
  assert(
    text.trimEnd().startsWith("[") && text.trimEnd().endsWith("]"),
    "json output is not a bare array",
  );
  assertEquals(text, `${JSON.stringify(entries)}\n`);
});

Deno.test("json output keeps the same order as the text output", () => {
  const textOrder = renderEntries(entries, { json: false })
    .trimEnd()
    .split("\n")
    .map((line) => line.split("\t")[0]);
  const jsonOrder = JSON.parse(renderEntries(entries, { json: true })).map(
    (item: WordCount) => item.word,
  );
  assertEquals(jsonOrder, textOrder);
});

Deno.test("empty entries raise a CliError with exit code 1 and a clear German message", () => {
  try {
    renderEntries([], { json: false });
  } catch (error) {
    if (!(error instanceof CliError)) {
      throw new Error(`expected CliError, got ${String(error)}`);
    }
    assertEquals(error.exitCode, 1);
    assertEquals(error.message, "wordfreq: keine Wörter gefunden");
    return;
  }
  throw new Error("expected CliError, but nothing was thrown");
});

Deno.test("empty entries raise the same error in json mode", () => {
  try {
    renderEntries([], { json: true });
  } catch (error) {
    if (!(error instanceof CliError)) {
      throw new Error(`expected CliError, got ${String(error)}`);
    }
    assertEquals(error.exitCode, 1);
    assertEquals(error.message, "wordfreq: keine Wörter gefunden");
    return;
  }
  throw new Error("expected CliError, but nothing was thrown");
});
