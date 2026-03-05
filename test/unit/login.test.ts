import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { login } from "../../src/skills/login.js";
import {
  createMockSkillContext,
  createMockSessionInfo,
  createMockPage,
  createMockBrowserContext,
  createMockLocator,
} from "../helpers/mock-factories.js";
import * as fs from "node:fs/promises";
import { loadConfig } from "../../src/core/config.js";

vi.mock("node:fs/promises", () => ({
  access: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  unlink: vi.fn(),
}));

const COOKIE_PATH = "./cookies.json";
const SELECTOR = ".logged-in";
const SAMPLE_COOKIES = [
  { name: "session", value: "abc123", domain: ".example.com", path: "/" },
];

function buildSession(overrides?: {
  locatorFound?: boolean;
  id?: string;
  headless?: boolean;
}) {
  const locator = createMockLocator();
  if (overrides?.locatorFound) {
    locator.waitFor.mockResolvedValue(undefined);
  } else {
    locator.waitFor.mockRejectedValue(new Error("not found"));
  }
  const page = createMockPage(locator);
  const context = createMockBrowserContext();
  context.cookies.mockResolvedValue(SAMPLE_COOKIES);
  return createMockSessionInfo({
    id: overrides?.id ?? "test-session",
    page: page as unknown as import("playwright").Page,
    context: context as unknown as import("playwright").BrowserContext,
  });
}

describe("browser_login", () => {
  beforeEach(() => {
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(fs.unlink).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads cookies from file when cookie file exists and selector matches", async () => {
    vi.mocked(fs.access).mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(SAMPLE_COOKIES));

    const headlessSession = buildSession({ locatorFound: true, id: "headless-1" });

    const ctx = createMockSkillContext({
      createSession: vi.fn().mockResolvedValue(headlessSession),
      config: loadConfig({ cookieFilePath: COOKIE_PATH }),
    });

    const result = await login.handler(
      { loginSuccessSelector: SELECTOR, timeoutMs: 300_000, pollIntervalMs: 500 },
      ctx,
    );

    expect(result.success).toBe(true);
    expect(result.content).toContain("restored from cookies");
    expect(ctx.createSession).toHaveBeenCalledWith({ headless: true });
    expect(headlessSession.context.addCookies).toHaveBeenCalledWith(SAMPLE_COOKIES);
  });

  it("falls back to manual login when cookies are expired", async () => {
    vi.mocked(fs.access).mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(SAMPLE_COOKIES));

    // First session: headless, selector not found (cookies expired)
    const expiredSession = buildSession({ locatorFound: false, id: "expired" });
    // Second session: visible, selector found immediately (manual login)
    const visibleSession = buildSession({ locatorFound: true, id: "visible" });
    // Third session: headless after manual login
    const finalSession = buildSession({ locatorFound: true, id: "final-headless" });

    let callCount = 0;
    const ctx = createMockSkillContext({
      createSession: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve(expiredSession);
        if (callCount === 2) return Promise.resolve(visibleSession);
        return Promise.resolve(finalSession);
      }),
      config: loadConfig({ cookieFilePath: COOKIE_PATH }),
    });

    const result = await login.handler(
      { loginSuccessSelector: SELECTOR, timeoutMs: 300_000, pollIntervalMs: 10 },
      ctx,
    );

    expect(result.success).toBe(true);
    expect(fs.unlink).toHaveBeenCalledWith(COOKIE_PATH);
    expect(ctx.closeSession).toHaveBeenCalledWith("expired");
    expect(ctx.closeSession).toHaveBeenCalledWith("visible");
    expect(ctx.createSession).toHaveBeenCalledWith({ headless: false });
    expect(fs.writeFile).toHaveBeenCalled();
  });

  it("opens visible browser when no cookie file exists", async () => {
    vi.mocked(fs.access).mockRejectedValue(new Error("ENOENT"));
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(SAMPLE_COOKIES));

    const visibleSession = buildSession({ locatorFound: true, id: "visible" });
    const headlessSession = buildSession({ locatorFound: true, id: "headless" });

    let callCount = 0;
    const ctx = createMockSkillContext({
      createSession: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve(visibleSession);
        return Promise.resolve(headlessSession);
      }),
      config: loadConfig({ cookieFilePath: COOKIE_PATH }),
    });

    const result = await login.handler(
      { loginSuccessSelector: SELECTOR, timeoutMs: 300_000, pollIntervalMs: 10 },
      ctx,
    );

    expect(result.success).toBe(true);
    expect(result.content).toContain("headless");
    expect(ctx.createSession).toHaveBeenCalledWith({ headless: false });
    expect(ctx.closeSession).toHaveBeenCalledWith("visible");
    expect(fs.writeFile).toHaveBeenCalledWith(
      COOKIE_PATH,
      JSON.stringify(SAMPLE_COOKIES, null, 2),
    );
  });

  it("returns failure when login times out", async () => {
    vi.mocked(fs.access).mockRejectedValue(new Error("ENOENT"));

    const visibleSession = buildSession({ locatorFound: false, id: "visible" });

    const ctx = createMockSkillContext({
      createSession: vi.fn().mockResolvedValue(visibleSession),
      config: loadConfig({ cookieFilePath: COOKIE_PATH }),
    });

    const result = await login.handler(
      { loginSuccessSelector: SELECTOR, timeoutMs: 50, pollIntervalMs: 10 },
      ctx,
    );

    expect(result.success).toBe(false);
    expect(result.content).toContain("timed out");
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it("handles cookie file read errors gracefully", async () => {
    vi.mocked(fs.access).mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockRejectedValue(new Error("Permission denied"));

    // First session: headless, fails to read cookies
    const errorSession = buildSession({ locatorFound: false, id: "error-sess" });
    // Second session: visible, login succeeds
    const visibleSession = buildSession({ locatorFound: true, id: "visible" });
    // Third session: headless after manual login
    const finalSession = buildSession({ locatorFound: true, id: "final" });

    let callCount = 0;
    const ctx = createMockSkillContext({
      createSession: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve(errorSession);
        if (callCount === 2) return Promise.resolve(visibleSession);
        return Promise.resolve(finalSession);
      }),
      config: loadConfig({ cookieFilePath: COOKIE_PATH }),
    });

    const result = await login.handler(
      { loginSuccessSelector: SELECTOR, timeoutMs: 300_000, pollIntervalMs: 10 },
      ctx,
    );

    expect(result.success).toBe(true);
    expect(ctx.closeSession).toHaveBeenCalledWith("error-sess");
  });
});
