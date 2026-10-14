import { CliError } from "./errors.ts";

/**
 * File reading for the wordfreq CLI.
 *
 * Reads the given path as UTF-8 text in a single pass. On any IO failure it
 * throws a {@link CliError} with exit code 1 and a German message — it never
 * leaks a stack trace.
 *
 * The only path touched is the one passed in, and only for reading: nothing is
 * created, changed or deleted, not even on an error path.
 */

/** Error for a path that does not exist. */
function notFound(path: string): CliError {
  return new CliError(`wordfreq: datei nicht gefunden: ${path}`, 1);
}

/** Error for a path that is a directory rather than a file. */
function isDirectory(path: string): CliError {
  return new CliError(
    `wordfreq: pfad ist ein verzeichnis, keine datei: ${path}`,
    1,
  );
}

/** Error for a file that exists but cannot be read. */
function notReadable(path: string, reason: string): CliError {
  return new CliError(`wordfreq: datei nicht lesbar: ${path} (${reason})`, 1);
}

/** Maps any IO error of the given path to a clear German {@link CliError}. */
function toCliError(path: string, error: unknown): CliError {
  if (error instanceof Deno.errors.NotFound) {
    return notFound(path);
  }
  if (error instanceof Deno.errors.PermissionDenied) {
    return notReadable(path, "keine leseberechtigung");
  }
  if (error instanceof Deno.errors.IsADirectory) {
    return isDirectory(path);
  }
  const reason = error instanceof Error ? error.message : String(error);
  return notReadable(path, reason);
}

/**
 * Reads the file at `path` as UTF-8 and returns its content.
 *
 * @throws {CliError} with exit code 1 on any IO failure — missing file, a
 * directory instead of a file, or a file without read permission.
 */
export async function readTextFile(path: string): Promise<string> {
  let info: Deno.FileInfo;
  try {
    info = await Deno.stat(path);
  } catch (error) {
    throw toCliError(path, error);
  }

  if (info.isDirectory) {
    throw isDirectory(path);
  }

  try {
    return await Deno.readTextFile(path);
  } catch (error) {
    throw toCliError(path, error);
  }
}
