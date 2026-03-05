import { describe, it, expect } from "vitest";
import { allSkills } from "../../src/skills/index.js";

describe("allSkills", () => {
  it("exports 33 skills", () => {
    expect(allSkills).toHaveLength(33);
  });

  it("all skills have unique names", () => {
    const names = allSkills.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("all skill names start with browser_", () => {
    for (const skill of allSkills) {
      expect(skill.name).toMatch(/^browser_/);
    }
  });

  it("all skills have descriptions", () => {
    for (const skill of allSkills) {
      expect(skill.description.length).toBeGreaterThan(10);
    }
  });
});

describe("URL validation", () => {
  it("rejects forbidden protocols", async () => {
    const { validateUrl } = await import("../../src/utils/sanitize.js");
    expect(() => validateUrl("file:///etc/passwd")).toThrow("forbidden");
    expect(() => validateUrl("javascript:alert(1)")).toThrow("forbidden");
    expect(() => validateUrl("chrome://settings")).toThrow("forbidden");
    expect(() => validateUrl("data:text/html,<h1>hi</h1>")).toThrow("forbidden");
  });

  it("allows http and https", async () => {
    const { validateUrl } = await import("../../src/utils/sanitize.js");
    expect(() => validateUrl("https://example.com")).not.toThrow();
    expect(() => validateUrl("http://localhost:3000")).not.toThrow();
  });
});
