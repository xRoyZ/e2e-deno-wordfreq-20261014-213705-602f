import {
  DEFAULT_MIN_LENGTH,
  DEFAULT_TOP,
  parseArgs,
  PROGRAM_NAME,
  usageText,
} from "../src/args.ts";
import { CliError } from "../src/errors.ts";

/**
 * Contract tests for the argument parser only.
 *
 * They cover the parser's own contract — defaults, options before and after the
 * file path, invalid values mapped to `CliError` with exit code 2, and the help
 * text — and nothing a later feature module fills in.
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

function assertUsageError(fn: () => unknown, label: string): void {
  try {
    fn();
  } catch (error) {
    if (!(error instanceof CliError)) {
      throw new Error(`${label}: expected CliError, got ${String(error)}`);
    }
    if (error.exitCode !== 2) {
      throw new Error(`${label}: expected exit code 2, got ${error.exitCode}`);
    }
    assert(
      error.message.includes(usageText()),
      `${label}: message does not carry the usage text`,
    );
    return;
  }
  throw new Error(`${label}: expected CliError, but nothing was thrown`);
}

Deno.test("defaults are top=10, min-length=1, text output", () => {
  const args = parseArgs(["note.txt"]);
  assertEquals(args.file, "note.txt");
  assertEquals(args.top, DEFAULT_TOP);
  assertEquals(args.top, 10);
  assertEquals(args.minLength, DEFAULT_MIN_LENGTH);
  assertEquals(args.minLength, 1);
  assertEquals(args.json, false);
  assertEquals(args.help, false);
});

Deno.test("options may stand before the file path", () => {
  const args = parseArgs(["--top", "5", "--min-length", "3", "--json", "note.txt"]);
  assertEquals(args.file, "note.txt");
  assertEquals(args.top, 5);
  assertEquals(args.minLength, 3);
  assertEquals(args.json, true);
});

Deno.test("options may stand after the file path", () => {
  const args = parseArgs(["note.txt", "--top", "2", "--min-length", "4", "--json"]);
  assertEquals(args.file, "note.txt");
  assertEquals(args.top, 2);
  assertEquals(args.minLength, 4);
  assertEquals(args.json, true);
});

Deno.test("options may be split around the file path", () => {
  const args = parseArgs(["--top", "7", "note.txt", "--min-length", "2"]);
  assertEquals(args.file, "note.txt");
  assertEquals(args.top, 7);
  assertEquals(args.minLength, 2);
});

Deno.test("--opt=value spelling is accepted", () => {
  const args = parseArgs(["note.txt", "--top=3", "--min-length=2"]);
  assertEquals(args.top, 3);
  assertEquals(args.minLength, 2);
});

Deno.test("a leading -- separator is skipped", () => {
  const help = parseArgs(["--", "--help"]);
  assertEquals(help.help, true);
  const args = parseArgs(["--", "note.txt", "--top", "3"]);
  assertEquals(args.file, "note.txt");
  assertEquals(args.top, 3);
});

Deno.test("missing file argument is a usage error", () => {
  assertUsageError(() => parseArgs([]), "no arguments");
  assertUsageError(() => parseArgs(["--top", "5"]), "only options");
});

Deno.test("unknown option is a usage error", () => {
  assertUsageError(() => parseArgs(["note.txt", "--verbose"]), "unknown option");
  assertUsageError(() => parseArgs(["--nope", "note.txt"]), "unknown option first");
});

Deno.test("invalid --top values are usage errors", () => {
  assertUsageError(() => parseArgs(["note.txt", "--top", "0"]), "top zero");
  assertUsageError(() => parseArgs(["note.txt", "--top", "-3"]), "top negative");
  assertUsageError(() => parseArgs(["note.txt", "--top", "abc"]), "top non-numeric");
  assertUsageError(() => parseArgs(["note.txt", "--top"]), "top without value");
});

Deno.test("invalid --min-length values are usage errors", () => {
  assertUsageError(() => parseArgs(["note.txt", "--min-length", "0"]), "min-length zero");
  assertUsageError(() => parseArgs(["note.txt", "--min-length", "-1"]), "min-length negative");
  assertUsageError(() => parseArgs(["note.txt", "--min-length", "x"]), "min-length non-numeric");
  assertUsageError(() => parseArgs(["note.txt", "--min-length"]), "min-length without value");
});

Deno.test("--help sets help and does not require a file", () => {
  const long = parseArgs(["--help"]);
  assertEquals(long.help, true);
  assertEquals(long.file, undefined);
  const short = parseArgs(["-h"]);
  assertEquals(short.help, true);
});

Deno.test("help text names the program, the call schema and every option with its default", () => {
  const text = usageText();
  assert(text.includes(PROGRAM_NAME), "help text does not name the program");
  assert(text.includes("<datei>"), "help text does not show a file argument");
  assert(text.includes("--top"), "help text does not mention --top");
  assert(text.includes("--min-length"), "help text does not mention --min-length");
  assert(text.includes("--json"), "help text does not mention --json");
  assert(text.includes("--help"), "help text does not mention --help");
  assert(text.includes("10"), "help text does not show the --top default");
  assert(
    text.includes("Standard: 1"),
    "help text does not show the --min-length default",
  );
});
