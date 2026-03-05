import type { SkillContext, SkillDefinition, SkillResult } from "./types.js";
import { SkillError, TimeoutError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { loadConfig, type Config } from "./config.js";

export class SkillRunner {
  private config: Config;

  constructor(options?: Partial<Config>) {
    this.config = loadConfig(options);
  }

  /**
   * Execute a skill with input validation, timeout, and error handling.
   */
  async run(
    skill: SkillDefinition,
    rawInput: unknown,
    ctx: SkillContext,
  ): Promise<SkillResult> {
    logger.info(`Running skill: ${skill.name}`);

    // Validate input
    const parseResult = skill.inputSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const errors = parseResult.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      return {
        content: `Invalid input: ${errors}`,
        success: false,
      };
    }

    // Execute with timeout
    try {
      const timeoutMs = skill.timeoutMs ?? this.config.skillTimeoutMs;
      const result = await Promise.race([
        skill.handler(parseResult.data, ctx),
        this.timeoutPromise(skill.name, timeoutMs),
      ]);
      return result;
    } catch (err) {
      if (err instanceof SkillError) {
        logger.warn(`Skill ${skill.name} failed: ${err.message}`);
        return { content: err.message, success: false };
      }
      const message =
        err instanceof Error ? err.message : "Unknown error occurred";
      logger.error(`Skill ${skill.name} unexpected error: ${message}`);
      return { content: `Error: ${message}`, success: false };
    }
  }

  private timeoutPromise(skillName: string, timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(skillName, timeoutMs));
      }, timeoutMs);
    });
  }
}
