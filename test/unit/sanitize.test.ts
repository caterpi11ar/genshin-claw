import { describe, it, expect } from "vitest";
import { validateUrl, validateSelector } from "../../src/utils/sanitize.js";
import { ForbiddenURLError } from "../../src/utils/errors.js";

describe("validateUrl", () => {
  it("allows http URLs", () => {
    expect(() => validateUrl("http://example.com")).not.toThrow();
  });

  it("allows https URLs", () => {
    expect(() => validateUrl("https://example.com")).not.toThrow();
  });

  it("allows URLs with port and path", () => {
    expect(() => validateUrl("https://localhost:3000/api/v1")).not.toThrow();
  });

  it("rejects file: protocol", () => {
    expect(() => validateUrl("file:///etc/passwd")).toThrow(ForbiddenURLError);
  });

  it("rejects chrome: protocol", () => {
    expect(() => validateUrl("chrome://settings")).toThrow(ForbiddenURLError);
  });

  it("rejects javascript: protocol", () => {
    expect(() => validateUrl("javascript:alert(1)")).toThrow(ForbiddenURLError);
  });

  it("rejects data: protocol", () => {
    expect(() => validateUrl("data:text/html,<h1>hi</h1>")).toThrow(ForbiddenURLError);
  });

  it("rejects vbscript: protocol", () => {
    expect(() => validateUrl("vbscript:msgbox")).toThrow(ForbiddenURLError);
  });

  it("throws ForbiddenURLError for invalid URL strings", () => {
    expect(() => validateUrl("not a url")).toThrow(ForbiddenURLError);
  });

  it("thrown error has code FORBIDDEN_URL", () => {
    try {
      validateUrl("file:///etc/passwd");
    } catch (e) {
      expect((e as ForbiddenURLError).code).toBe("FORBIDDEN_URL");
    }
  });
});

describe("validateSelector", () => {
  it("throws on empty string", () => {
    expect(() => validateSelector("")).toThrow("empty");
  });

  it("throws on whitespace-only string", () => {
    expect(() => validateSelector("   ")).toThrow("empty");
  });

  it("throws on selector exceeding 1000 characters", () => {
    expect(() => validateSelector("a".repeat(1001))).toThrow("too long");
  });

  it("allows normal selectors", () => {
    expect(() => validateSelector("#my-id .class > div")).not.toThrow();
  });

  it("allows selector at exactly 1000 characters", () => {
    expect(() => validateSelector("a".repeat(1000))).not.toThrow();
  });
});
