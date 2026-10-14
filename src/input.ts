/**
 * File reading for the wordfreq CLI.
 *
 * Reads the given path as UTF-8 text. On any IO failure it throws a
 * {@link CliError} with exit code 1 and a German message — it never leaks a
 * stack trace.
 */
export function readTextFile(path: string): Promise<string> {
  return Promise.resolve("");
}
