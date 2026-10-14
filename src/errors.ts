/**
 * Error type shared by every module of the wordfreq CLI.
 *
 * The message already carries the `wordfreq: ` prefix, so a catcher only has
 * to print `error.message` to stderr and exit with `error.exitCode`.
 */
export class CliError extends Error {
  /** Process exit code to use when this error reaches the entry point. */
  readonly exitCode: number;

  constructor(message: string, exitCode: number) {
    super(message);
    this.name = "CliError";
    this.exitCode = exitCode;
  }
}
