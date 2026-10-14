import { parseArgs, usageText } from "./src/args.ts";
import { CliError } from "./src/errors.ts";
import { readTextFile } from "./src/input.ts";
import { countWords } from "./src/count.ts";
import { renderEntries } from "./src/output.ts";

/**
 * Entry point of the wordfreq CLI.
 *
 * This file is written once by the skeleton and never edited again: every
 * feature lives in the `src/` modules it wires together. It parses the
 * arguments, prints the usage for `--help` and otherwise pipes
 * `readTextFile` → `countWords` → `renderEntries` to stdout, mapping a
 * {@link CliError} to stderr plus its exit code and any other error to a clear
 * message with exit code 1 (never a stack trace).
 */

const encoder = new TextEncoder();

function writeStdout(text: string): Promise<number> {
  return Deno.stdout.write(encoder.encode(text));
}

function writeStderr(text: string): Promise<number> {
  return Deno.stderr.write(encoder.encode(text));
}

async function run(): Promise<number> {
  try {
    const args = parseArgs(Deno.args);

    if (args.help) {
      await writeStdout(`${usageText()}\n`);
      return 0;
    }

    const file = args.file;
    if (file === undefined) {
      await writeStderr(`wordfreq: Fehlender Dateiparameter.\n\n${usageText()}\n`);
      return 2;
    }

    const text = await readTextFile(file);
    const entries = countWords(text, {
      top: args.top,
      minLength: args.minLength,
    });
    const output = renderEntries(entries, { json: args.json });
    await writeStdout(output);
    return 0;
  } catch (error) {
    if (error instanceof CliError) {
      await writeStderr(`${error.message}\n`);
      return error.exitCode;
    }
    const detail = error instanceof Error ? error.message : String(error);
    await writeStderr(`wordfreq: ${detail}\n`);
    return 1;
  }
}

if (import.meta.main) {
  Deno.exit(await run());
}
