import { CliError } from "./errors.ts";

/** Name the CLI presents itself with on the command line. */
export const PROGRAM_NAME = "wordfreq";

/** Default number of entries printed when `--top` is not given. */
export const DEFAULT_TOP = 10;

/** Default minimum word length when `--min-length` is not given. */
export const DEFAULT_MIN_LENGTH = 1;

/** Exit code for usage/option errors. */
const USAGE_EXIT_CODE = 2;

/**
 * Parsed command line of the wordfreq CLI.
 *
 * `file` is absent only when `help` is true, because `--help` must work
 * without a file argument.
 */
export type ParsedArgs = {
  file?: string;
  top: number;
  minLength: number;
  json: boolean;
  help: boolean;
};

/** Build the `wordfreq: ` -prefixed usage error carrying the usage text. */
function usageError(reason: string): CliError {
  return new CliError(
    `${PROGRAM_NAME}: ${reason}\n\n${usageText()}`,
    USAGE_EXIT_CODE,
  );
}

/**
 * The help/usage text: program name, call schema and every option with its
 * default. Printed on stdout for `--help` and appended to usage errors.
 */
export function usageText(): string {
  return [
    `${PROGRAM_NAME} — die häufigsten Wörter einer Textdatei zählen`,
    "",
    "Aufruf:",
    `  ${PROGRAM_NAME} <datei> [--top N] [--min-length N] [--json] [--help|-h]`,
    "",
    "Optionen:",
    `  --top N         Höchstens N Einträge ausgeben (Standard: ${DEFAULT_TOP})`,
    `  --min-length N  Wörter kürzer als N Zeichen weglassen (Standard: ${DEFAULT_MIN_LENGTH})`,
    "  --json          Ausgabe als JSON-Array statt als Text",
    "  --help, -h      Diese Hilfe anzeigen und beenden",
  ].join("\n");
}

/** Read the value of an option given either as `--opt value` or `--opt=value`. */
function readOptionValue(
  argv: readonly string[],
  index: number,
  option: string,
): { value: string; next: number } {
  const arg = argv[index];
  const equals = arg.indexOf("=");
  if (equals >= 0) {
    return { value: arg.slice(equals + 1), next: index + 1 };
  }
  const value = argv[index + 1];
  if (value === undefined) {
    throw usageError(`Option ${option} erwartet einen Wert.`);
  }
  return { value, next: index + 2 };
}

/** Parse a strictly positive integer option value; anything else is a usage error. */
function parsePositiveInt(raw: string, option: string): number {
  if (!/^[0-9]+$/.test(raw)) {
    throw usageError(
      `Ungültiger Wert für ${option}: "${raw}". Erwartet wird eine ganze Zahl größer als 0.`,
    );
  }
  const value = Number(raw);
  if (value <= 0) {
    throw usageError(
      `Ungültiger Wert für ${option}: "${raw}". Erwartet wird eine ganze Zahl größer als 0.`,
    );
  }
  return value;
}

/**
 * Read and validate the value of a numeric option, returning the next index.
 * The parsed value is handed to `apply`.
 */
function consumeNumberOption(
  argv: readonly string[],
  index: number,
  flag: "--top" | "--min-length",
  apply: (value: number) => void,
): number {
  const { value, next } = readOptionValue(argv, index, flag);
  apply(parsePositiveInt(value, flag));
  return next;
}

/** Does `arg` start with the given long option (bare or `--opt=value`)? */
function isOption(arg: string, flag: string): boolean {
  return arg === flag || arg.startsWith(`${flag}=`);
}

/**
 * Parse the raw CLI arguments.
 *
 * Options may stand before or after the file path. `--help`/`-h` short-circuits
 * the file requirement. Any missing file, unknown option or invalid value
 * raises a {@link CliError} with exit code 2 that already carries the usage text.
 */
export function parseArgs(argv: readonly string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    top: DEFAULT_TOP,
    minLength: DEFAULT_MIN_LENGTH,
    json: false,
    help: false,
  };
  let file: string | undefined;

  let index = 0;
  while (index < argv.length) {
    const arg = argv[index];
    // `deno task start -- <args>` forwards a literal `--` separator; it is not
    // part of the CLI's own contract and is skipped here.
    if (arg === "--") {
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      index += 1;
    } else if (arg === "--json") {
      parsed.json = true;
      index += 1;
    } else if (isOption(arg, "--top")) {
      index = consumeNumberOption(argv, index, "--top", (v) => {
        parsed.top = v;
      });
    } else if (isOption(arg, "--min-length")) {
      index = consumeNumberOption(argv, index, "--min-length", (v) => {
        parsed.minLength = v;
      });
    } else if (arg.startsWith("-") && arg !== "-") {
      throw usageError(`Unbekannte Option: ${arg}`);
    } else if (file === undefined) {
      file = arg;
      index += 1;
    } else {
      throw usageError(`Unerwartetes Argument: ${arg}`);
    }
  }

  if (parsed.help) {
    return file === undefined ? parsed : { ...parsed, file };
  }

  if (file === undefined) {
    throw usageError("Fehlender Dateiparameter.");
  }

  return { ...parsed, file };
}
