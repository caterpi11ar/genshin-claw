import { z } from "zod";

const configSchema = z.object({
  /** URL to navigate to when a new session is created */
  startupUrl: z.string().url().default("https://ys.mihoyo.com/cloud/"),
  /** Session idle timeout in milliseconds */
  sessionTimeoutMs: z
    .number()
    .int()
    .positive()
    .default(30 * 60 * 1000),
  /** Maximum number of concurrent sessions */
  maxSessions: z.number().int().positive().default(5),
  /** Milliseconds before an unhandled dialog is auto-dismissed */
  dialogAutoDismissMs: z.number().int().nonnegative().default(10_000),
  /** Per-skill execution timeout in milliseconds */
  skillTimeoutMs: z.number().int().positive().default(30_000),
  /** Path to the cookie persistence file */
  cookieFilePath: z.string().default("./cookies.json"),
});

export type Config = z.infer<typeof configSchema>;

/**
 * Parse and validate a partial config object, applying defaults for
 * any missing fields. Throws a ZodError if validation fails.
 */
export function loadConfig(overrides?: Partial<Config>): Config {
  return configSchema.parse(overrides ?? {});
}
