import { describe, it, expect } from "vitest";
import {
  SkillError,
  SessionNotFoundError,
  SessionLimitError,
  NavigationError,
  SelectorError,
  TimeoutError,
  ForbiddenURLError,
  SkillDisabledError,
} from "../../src/utils/errors.js";

describe("SkillError", () => {
  it("sets name to SkillError", () => {
    const err = new SkillError("msg", "CODE");
    expect(err.name).toBe("SkillError");
  });

  it("stores message and code", () => {
    const err = new SkillError("something broke", "MY_CODE");
    expect(err.message).toBe("something broke");
    expect(err.code).toBe("MY_CODE");
  });

  it("stores cause", () => {
    const cause = new Error("root");
    const err = new SkillError("wrapper", "CODE", cause);
    expect(err.cause).toBe(cause);
  });

  it("is an instance of Error", () => {
    expect(new SkillError("m", "c")).toBeInstanceOf(Error);
  });
});

describe("SessionNotFoundError", () => {
  it("has correct name and code", () => {
    const err = new SessionNotFoundError("abc");
    expect(err.name).toBe("SessionNotFoundError");
    expect(err.code).toBe("SESSION_NOT_FOUND");
  });

  it("includes session ID in message", () => {
    expect(new SessionNotFoundError("xyz").message).toContain("xyz");
  });

  it("is instanceof SkillError", () => {
    expect(new SessionNotFoundError("x")).toBeInstanceOf(SkillError);
  });
});

describe("SessionLimitError", () => {
  it("has correct name and code", () => {
    const err = new SessionLimitError(5);
    expect(err.name).toBe("SessionLimitError");
    expect(err.code).toBe("SESSION_LIMIT");
  });

  it("includes max in message", () => {
    expect(new SessionLimitError(3).message).toContain("3");
  });
});

describe("NavigationError", () => {
  it("has correct name and code", () => {
    const err = new NavigationError("https://fail.com");
    expect(err.name).toBe("NavigationError");
    expect(err.code).toBe("NAVIGATION_ERROR");
  });

  it("includes URL in message", () => {
    expect(new NavigationError("https://x.com").message).toContain("https://x.com");
  });

  it("stores cause", () => {
    const cause = new Error("net err");
    const err = new NavigationError("https://x.com", cause);
    expect(err.cause).toBe(cause);
  });
});

describe("SelectorError", () => {
  it("has correct name and code", () => {
    const err = new SelectorError("#btn");
    expect(err.name).toBe("SelectorError");
    expect(err.code).toBe("SELECTOR_ERROR");
  });

  it("includes selector in message", () => {
    expect(new SelectorError(".missing").message).toContain(".missing");
  });

  it("stores cause", () => {
    const cause = new Error("timeout");
    expect(new SelectorError("div", cause).cause).toBe(cause);
  });
});

describe("TimeoutError", () => {
  it("has correct name and code", () => {
    const err = new TimeoutError("navigate", 5000);
    expect(err.name).toBe("TimeoutError");
    expect(err.code).toBe("TIMEOUT");
  });

  it("includes operation and timeout in message", () => {
    const err = new TimeoutError("screenshot", 3000);
    expect(err.message).toContain("screenshot");
    expect(err.message).toContain("3000");
  });
});

describe("ForbiddenURLError", () => {
  it("has correct name and code", () => {
    const err = new ForbiddenURLError("file:///etc");
    expect(err.name).toBe("ForbiddenURLError");
    expect(err.code).toBe("FORBIDDEN_URL");
  });

  it("includes URL in message", () => {
    expect(new ForbiddenURLError("chrome://x").message).toContain("chrome://x");
  });
});

describe("SkillDisabledError", () => {
  it("has correct name and code", () => {
    const err = new SkillDisabledError("browser_click");
    expect(err.name).toBe("SkillDisabledError");
    expect(err.code).toBe("SKILL_DISABLED");
  });

  it("includes skill name in message", () => {
    expect(new SkillDisabledError("browser_pdf").message).toContain("browser_pdf");
  });
});
