import { readTextFile } from "../src/input.ts";
import { CliError } from "../src/errors.ts";

/**
 * Contract tests for {@link readTextFile}.
 *
 * They cover the success case, a missing file and a directory instead of a
 * file. Fixtures live in a temporary directory this module creates and removes
 * itself, so nothing is written into the repository tree.
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

async function assertCliError(
  fn: () => Promise<unknown>,
  path: string,
  fragment: string,
  label: string,
): Promise<string> {
  try {
    await fn();
  } catch (error) {
    if (!(error instanceof CliError)) {
      throw new Error(`${label}: expected CliError, got ${String(error)}`);
    }
    if (error.exitCode !== 1) {
      throw new Error(`${label}: expected exit code 1, got ${error.exitCode}`);
    }
    assert(
      error.message.startsWith("wordfreq: "),
      `${label}: message misses the 'wordfreq: ' prefix`,
    );
    assert(
      error.message.includes(path),
      `${label}: message does not name the path`,
    );
    assert(
      error.message.includes(fragment),
      `${label}: message misses '${fragment}': ${error.message}`,
    );
    assert(
      !error.message.includes("\n"),
      `${label}: message carries a stack trace`,
    );
    return error.message;
  }
  throw new Error(`${label}: expected CliError, but nothing was thrown`);
}

Deno.test("reads an existing file as UTF-8", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const path = `${dir}/note.txt`;
    const content = "Grüße, der ß-Test\nzweite Zeile\n";
    await Deno.writeTextFile(path, content);

    const text = await readTextFile(path);
    assertEquals(text, content);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("a missing file becomes a CliError with the German message", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const path = `${dir}/does-not-exist.txt`;
    const message = await assertCliError(
      () => readTextFile(path),
      path,
      "datei nicht gefunden",
      "missing file",
    );
    assertEquals(message, `wordfreq: datei nicht gefunden: ${path}`);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("a directory instead of a file becomes a clear CliError", async () => {
  const dir = await Deno.makeTempDir();
  try {
    await assertCliError(
      () => readTextFile(dir),
      dir,
      "verzeichnis",
      "directory",
    );
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});
