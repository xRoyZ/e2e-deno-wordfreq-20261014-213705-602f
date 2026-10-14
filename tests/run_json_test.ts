/**
 * Contract tests for the RUN.json start declaration of the `wordfreq` service.
 *
 * The CLI's smoke step executes the command this file declares, so the declared
 * `start` has to succeed on its own (AC-13). These tests read the real RUN.json
 * from the repository root and run exactly the command it lists — a change to
 * that declaration can no longer slip through unnoticed.
 */

const repoRoot = new URL("..", import.meta.url);

type Service = {
  name?: string;
  kind?: string;
  start?: unknown;
  [key: string]: unknown;
};

type RunContract = { services?: Service[] };

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

async function readService(name: string): Promise<Service> {
  const text = await Deno.readTextFile(new URL("RUN.json", repoRoot));
  const doc = JSON.parse(text) as RunContract;
  assert(
    Array.isArray(doc.services),
    "RUN.json does not declare a services list",
  );
  const service = doc.services!.find((entry) => entry.name === name);
  assert(service !== undefined, `RUN.json does not declare the '${name}' service`);
  return service!;
}

function asArgv(value: unknown, label: string): string[] {
  assert(
    Array.isArray(value) && value.length > 0,
    `${label} is not a non-empty argv array`,
  );
  assert(
    (value as unknown[]).every((part) => typeof part === "string"),
    `${label} is not a list of arguments`,
  );
  return value as string[];
}

async function run(argv: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  const command = new Deno.Command(argv[0], {
    args: argv.slice(1),
    cwd: repoRoot,
    stdout: "piped",
    stderr: "piped",
  });
  const result = await command.output();
  return {
    code: result.code,
    stdout: new TextDecoder().decode(result.stdout),
    stderr: new TextDecoder().decode(result.stderr),
  };
}

Deno.test("RUN.json declares an argv start command for the wordfreq cli", async () => {
  const service = await readService("wordfreq");
  assert(service.kind === "cli", "the wordfreq service is not declared as a cli");
  asArgv(service.start, "wordfreq.start");
});

Deno.test("the declared start command succeeds on its own (smoke path)", async () => {
  const service = await readService("wordfreq");
  const argv = asArgv(service.start, "wordfreq.start");

  const { code, stdout, stderr } = await run(argv);

  assert(
    code === 0,
    `the declared start command exited ${code}: ${stderr.trim() || stdout.trim()}`,
  );
  assert(
    stdout.trim().length > 0,
    "the declared start command produced no output on stdout",
  );
});

Deno.test("the tool behind the start command handles both AC-13 paths", async () => {
  const service = await readService("wordfreq");
  const start = asArgv(service.start, "wordfreq.start");
  const entryPoint = start.filter((part) => part !== "--help");

  const help = await run(entryPoint.concat("--help"));
  assert(help.code === 0, `--help exited ${help.code}: ${help.stderr.trim()}`);
  assert(
    help.stdout.includes("--top") && help.stdout.includes("--json"),
    "--help did not print the usage with all options",
  );

  const dir = await Deno.makeTempDir();
  try {
    const file = `${dir}/beispiel.txt`;
    await Deno.writeTextFile(file, "der der die haus\n");

    const result = await run(entryPoint.concat(file));
    assert(
      result.code === 0,
      `a file with content exited ${result.code}: ${result.stderr.trim()}`,
    );
    assert(
      /^der\t2$/m.test(result.stdout),
      `a file with content did not print a frequency list: ${JSON.stringify(result.stdout)}`,
    );
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});
