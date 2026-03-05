import { describe, it, expect, vi } from "vitest";
import { SkillRunner } from "../../src/core/skill-runner.js";
import { SkillError } from "../../src/utils/errors.js";
import { defineSkill } from "../../src/core/types.js";
import type { SkillContext } from "../../src/core/types.js";
import { z } from "zod";
import { createMockSkillContext } from "../helpers/mock-factories.js";

// Suppress logger output during tests
vi.mock("../../src/utils/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe("SkillRunner", () => {
  const ctx = createMockSkillContext();

  it("returns timeout error when handler exceeds timeoutMs", async () => {
    const runner = new SkillRunner({ skillTimeoutMs: 50 });
    const skill = defineSkill({
      name: "slow",
      description: "slow",
      inputSchema: z.object({}),
      async handler() {
        await new Promise((r) => setTimeout(r, 200));
        return { content: "done", success: true };
      },
    });
    const result = await runner.run(skill, {}, ctx);
    expect(result.success).toBe(false);
    expect(result.content).toContain("timed out");
  });

  it("catches SkillError and returns its message", async () => {
    const runner = new SkillRunner();
    const skill = defineSkill({
      name: "skill-err",
      description: "skill-err",
      inputSchema: z.object({}),
      async handler() {
        throw new SkillError("custom skill error", "CUSTOM");
      },
    });
    const result = await runner.run(skill, {}, ctx);
    expect(result.success).toBe(false);
    expect(result.content).toBe("custom skill error");
  });

  it("wraps non-Error thrown values as 'Unknown error occurred'", async () => {
    const runner = new SkillRunner();
    const skill = defineSkill({
      name: "throw-string",
      description: "throw-string",
      inputSchema: z.object({}),
      async handler() {
        throw "just a string";
      },
    });
    const result = await runner.run(skill, {}, ctx);
    expect(result.success).toBe(false);
    expect(result.content).toContain("Unknown error occurred");
  });

  it("passes correct input and context to handler", async () => {
    const runner = new SkillRunner();
    const handlerSpy = vi.fn().mockResolvedValue({ content: "ok", success: true });
    const skill = defineSkill({
      name: "spy",
      description: "spy",
      inputSchema: z.object({ name: z.string() }),
      handler: handlerSpy,
    });
    const customCtx = createMockSkillContext();
    await runner.run(skill, { name: "test" }, customCtx);
    expect(handlerSpy).toHaveBeenCalledWith({ name: "test" }, customCtx);
  });

  it("returns validation error for invalid input", async () => {
    const runner = new SkillRunner();
    const skill = defineSkill({
      name: "validate",
      description: "validate",
      inputSchema: z.object({ count: z.number() }),
      async handler(input) {
        return { content: String(input.count), success: true };
      },
    });
    const result = await runner.run(skill, { count: "not-a-number" }, ctx);
    expect(result.success).toBe(false);
    expect(result.content).toContain("Invalid input");
  });

  it("logs warn for SkillError, not error", async () => {
    const { logger } = await import("../../src/utils/logger.js");
    const runner = new SkillRunner();
    const skill = defineSkill({
      name: "warn-test",
      description: "warn-test",
      inputSchema: z.object({}),
      async handler() {
        throw new SkillError("oops", "OOPS");
      },
    });
    await runner.run(skill, {}, ctx);
    expect(logger.warn).toHaveBeenCalled();
    // error should NOT have been called for this case (only warn)
    const errorCalls = (logger.error as ReturnType<typeof vi.fn>).mock.calls;
    const relevantErrorCalls = errorCalls.filter((c: unknown[]) =>
      (c[0] as string).includes("warn-test"),
    );
    expect(relevantErrorCalls).toHaveLength(0);
  });

  it("uses default 30s timeout when no options provided", async () => {
    const runner = new SkillRunner();
    const skill = defineSkill({
      name: "fast",
      description: "fast",
      inputSchema: z.object({}),
      async handler() {
        return { content: "instant", success: true };
      },
    });
    const result = await runner.run(skill, {}, ctx);
    expect(result.success).toBe(true);
  });
});
