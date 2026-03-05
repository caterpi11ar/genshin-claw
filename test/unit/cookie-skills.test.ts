import { describe, it, expect, vi } from "vitest";
import { getCookies } from "../../src/skills/get-cookies.js";
import { setCookies } from "../../src/skills/set-cookies.js";
import { clearCookies } from "../../src/skills/clear-cookies.js";
import {
  createMockSkillContext,
  createMockSessionInfo,
  createMockBrowserContext,
  createMockPage,
} from "../helpers/mock-factories.js";

describe("browser_get_cookies", () => {
  it("calls context.cookies() without urls", async () => {
    const context = createMockBrowserContext();
    context.cookies.mockResolvedValue([{ name: "a", value: "1" }]);
    const page = createMockPage();
    const session = createMockSessionInfo({ page: page as any, context: context as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await getCookies.handler({}, ctx);
    expect(context.cookies).toHaveBeenCalledWith(undefined);
    expect(result.success).toBe(true);
    expect(result.content).toContain('"a"');
  });

  it("passes urls to context.cookies()", async () => {
    const context = createMockBrowserContext();
    context.cookies.mockResolvedValue([]);
    const page = createMockPage();
    const session = createMockSessionInfo({ page: page as any, context: context as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    await getCookies.handler({ urls: ["https://a.com", "https://b.com"] }, ctx);
    expect(context.cookies).toHaveBeenCalledWith(["https://a.com", "https://b.com"]);
  });
});

describe("browser_set_cookies", () => {
  it("calls context.addCookies", async () => {
    const context = createMockBrowserContext();
    const page = createMockPage();
    const session = createMockSessionInfo({ page: page as any, context: context as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const cookies = [{ name: "test", value: "val", url: "https://x.com" }];
    const result = await setCookies.handler({ cookies }, ctx);
    expect(context.addCookies).toHaveBeenCalledWith(cookies);
    expect(result.success).toBe(true);
    expect(result.content).toContain("1 cookie");
  });

  it("reports count of multiple cookies", async () => {
    const context = createMockBrowserContext();
    const page = createMockPage();
    const session = createMockSessionInfo({ page: page as any, context: context as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const cookies = [
      { name: "a", value: "1", url: "https://x.com" },
      { name: "b", value: "2", url: "https://x.com" },
    ];
    const result = await setCookies.handler({ cookies }, ctx);
    expect(result.content).toContain("2 cookie");
  });
});

describe("browser_clear_cookies", () => {
  it("calls context.clearCookies", async () => {
    const context = createMockBrowserContext();
    const page = createMockPage();
    const session = createMockSessionInfo({ page: page as any, context: context as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await clearCookies.handler({}, ctx);
    expect(context.clearCookies).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.content).toBe("Cookies cleared");
  });
});
