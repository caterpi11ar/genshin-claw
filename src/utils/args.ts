/**
 * Simple argument parser for CLI scripts. No dependencies.
 *
 * Usage:
 *   parseArgs(["browser_navigate", "--url", "https://example.com"])
 *   → { command: "browser_navigate", flags: { url: "https://example.com" } }
 */

function kebabToCamel(s: string): string {
  return s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

function coerce(value: string): unknown {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value !== "" && !isNaN(Number(value))) return Number(value);
  // Try JSON parse for complex values (e.g. --json '{"a":1}' or arrays)
  if (
    (value.startsWith("{") && value.endsWith("}")) ||
    (value.startsWith("[") && value.endsWith("]"))
  ) {
    try {
      return JSON.parse(value);
    } catch {
      // fall through
    }
  }
  return value;
}

export interface ParsedArgs {
  command: string | undefined;
  flags: Record<string, unknown>;
}

export function parseArgs(argv: string[]): ParsedArgs {
  let command: string | undefined;
  const flags: Record<string, unknown> = {};

  let i = 0;
  // First non-flag arg is the command
  if (i < argv.length && !argv[i]!.startsWith("--")) {
    command = argv[i];
    i++;
  }

  while (i < argv.length) {
    const arg = argv[i]!;
    if (!arg.startsWith("--")) {
      i++;
      continue;
    }

    const key = kebabToCamel(arg.slice(2));
    const next = argv[i + 1];

    // Boolean flag (no value or next is also a flag)
    if (next === undefined || next.startsWith("--")) {
      flags[key] = true;
      i++;
      continue;
    }

    flags[key] = coerce(next);
    i += 2;
  }

  return { command, flags };
}
