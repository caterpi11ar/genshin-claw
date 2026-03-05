import { describe, it, expect } from "vitest";
import { SkillRegistry } from "../../src/core/skill-registry.js";
import { SkillRunner } from "../../src/core/skill-runner.js";
import { defineSkill } from "../../src/core/types.js";
import type { SkillContext } from "../../src/core/types.js";
import { z } from "zod";

const dummyCtx = {} as SkillContext;

describe("SkillRegistry", () => {
  it("registers and retrieves a skill", () => {
    const registry = new SkillRegistry();
    const skill = defineSkill({
      name: "test_skill",
      description: "A test skill",
      inputSchema: z.object({ value: z.string() }),
      async handler() {
        return { content: "ok", success: true };
      },
    });
    registry.register(skill);
    expect(registry.has("test_skill")).toBe(true);
    expect(registry.get("test_skill")).toBe(skill);
  });

  it("throws on duplicate registration", () => {
    const registry = new SkillRegistry();
    const skill = defineSkill({
      name: "dup",
      description: "dup",
      inputSchema: z.object({}),
      async handler() {
        return { content: "ok", success: true };
      },
    });
    registry.register(skill);
    expect(() => registry.register(skill)).toThrow("already registered");
  });

  it("lists all registered skills", () => {
    const registry = new SkillRegistry();
    const skills = [
      defineSkill({
        name: "a",
        description: "a",
        inputSchema: z.object({}),
        async handler() {
          return { content: "a", success: true };
        },
      }),
      defineSkill({
        name: "b",
        description: "b",
        inputSchema: z.object({}),
        async handler() {
          return { content: "b", success: true };
        },
      }),
    ];
    registry.registerAll(skills);
    expect(registry.getAll()).toHaveLength(2);
  });
});

describe("SkillRunner", () => {
  it("validates input and runs handler", async () => {
    const runner = new SkillRunner();
    const skill = defineSkill({
      name: "echo",
      description: "echo",
      inputSchema: z.object({ message: z.string() }),
      async handler(input) {
        return { content: input.message, success: true };
      },
    });
    const result = await runner.run(skill, { message: "hello" }, dummyCtx);
    expect(result.success).toBe(true);
    expect(result.content).toBe("hello");
  });

  it("returns validation error for invalid input", async () => {
    const runner = new SkillRunner();
    const skill = defineSkill({
      name: "strict",
      description: "strict",
      inputSchema: z.object({ count: z.number().int().min(1) }),
      async handler(input) {
        return { content: String(input.count), success: true };
      },
    });
    const result = await runner.run(skill, { count: "abc" }, dummyCtx);
    expect(result.success).toBe(false);
    expect(result.content).toContain("Invalid input");
  });

  it("catches handler errors", async () => {
    const runner = new SkillRunner();
    const skill = defineSkill({
      name: "fail",
      description: "fail",
      inputSchema: z.object({}),
      async handler() {
        throw new Error("boom");
      },
    });
    const result = await runner.run(skill, {}, dummyCtx);
    expect(result.success).toBe(false);
    expect(result.content).toContain("boom");
  });
});
