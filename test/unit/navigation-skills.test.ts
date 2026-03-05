import { describe, it, expect, vi } from "vitest";
import { navigate } from "../../src/skills/navigate.js";
import { getUrl } from "../../src/skills/get-url.js";
import { getTitle } from "../../src/skills/get-title.js";
import { goBack } from "../../src/skills/go-back.js";
import { goForward } from "../../src/skills/go-forward.js";
import { reload } from "../../src/skills/reload.js";
import {
  createMockSkillContext,
  createMockSessionInfo,
  createMockPage,
} from "../helpers/mock-factories.js";

describe("browser_navigate", () => {
  it("calls validateUrl then page.goto", async () => {
    const page = createMockPage();
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await navigate.handler({ url: "https://example.com" }, ctx);
    expect(page.goto).toHaveBeenCalledWith("https://example.com", { waitUntil: "load" });
    expect(result.success).toBe(true);
  });

  it("uses custom waitUntil", async () => {
    const page = createMockPage();
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    await navigate.handler({ url: "https://x.com", waitUntil: "networkidle" }, ctx);
    expect(page.goto).toHaveBeenCalledWith("https://x.com", { waitUntil: "networkidle" });
  });

  it("returns URL and title in content", async () => {
    const page = createMockPage();
    page.url.mockReturnValue("https://result.com");
    page.title.mockResolvedValue("Result Page");
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await navigate.handler({ url: "https://result.com" }, ctx);
    expect(result.content).toContain("https://result.com");
    expect(result.content).toContain("Result Page");
  });

  it("throws on forbidden URL", async () => {
    const ctx = createMockSkillContext();
    await expect(navigate.handler({ url: "file:///etc/passwd" }, ctx)).rejects.toThrow("forbidden");
  });
});

describe("browser_get_url", () => {
  it("returns page URL", async () => {
    const page = createMockPage();
    page.url.mockReturnValue("https://current.com/path");
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await getUrl.handler({}, ctx);
    expect(result.success).toBe(true);
    expect(result.content).toBe("https://current.com/path");
  });

  it("passes sessionId to getSession", async () => {
    const ctx = createMockSkillContext();
    await getUrl.handler({ sessionId: "s1" }, ctx);
    expect(ctx.getSession).toHaveBeenCalledWith("s1");
  });
});

describe("browser_get_title", () => {
  it("returns page title", async () => {
    const page = createMockPage();
    page.title.mockResolvedValue("My Page");
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await getTitle.handler({}, ctx);
    expect(result.content).toBe("My Page");
  });

  it("returns '(no title)' for empty title", async () => {
    const page = createMockPage();
    page.title.mockResolvedValue("");
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await getTitle.handler({}, ctx);
    expect(result.content).toBe("(no title)");
  });
});

describe("browser_go_back", () => {
  it("calls page.goBack with default waitUntil", async () => {
    const page = createMockPage();
    page.goBack.mockResolvedValue({});
    page.title.mockResolvedValue("Prev");
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await goBack.handler({}, ctx);
    expect(page.goBack).toHaveBeenCalledWith({ waitUntil: "load" });
    expect(result.success).toBe(true);
    expect(result.content).toContain("Navigated back");
  });

  it("returns success:false when no history", async () => {
    const page = createMockPage();
    page.goBack.mockResolvedValue(null);
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await goBack.handler({}, ctx);
    expect(result.success).toBe(false);
    expect(result.content).toContain("No previous page");
  });

  it("uses custom waitUntil", async () => {
    const page = createMockPage();
    page.goBack.mockResolvedValue({});
    page.title.mockResolvedValue("T");
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    await goBack.handler({ waitUntil: "domcontentloaded" }, ctx);
    expect(page.goBack).toHaveBeenCalledWith({ waitUntil: "domcontentloaded" });
  });
});

describe("browser_go_forward", () => {
  it("calls page.goForward", async () => {
    const page = createMockPage();
    page.goForward.mockResolvedValue({});
    page.title.mockResolvedValue("Next");
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await goForward.handler({}, ctx);
    expect(page.goForward).toHaveBeenCalledWith({ waitUntil: "load" });
    expect(result.success).toBe(true);
  });

  it("returns success:false when no forward history", async () => {
    const page = createMockPage();
    page.goForward.mockResolvedValue(null);
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await goForward.handler({}, ctx);
    expect(result.success).toBe(false);
    expect(result.content).toContain("No next page");
  });
});

describe("browser_reload", () => {
  it("calls page.reload with default waitUntil", async () => {
    const page = createMockPage();
    page.title.mockResolvedValue("Reloaded");
    page.url.mockReturnValue("https://r.com");
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await reload.handler({}, ctx);
    expect(page.reload).toHaveBeenCalledWith({ waitUntil: "load" });
    expect(result.success).toBe(true);
    expect(result.content).toContain("Reloaded");
  });

  it("returns URL and title", async () => {
    const page = createMockPage();
    page.title.mockResolvedValue("My Page");
    page.url.mockReturnValue("https://my.com");
    const session = createMockSessionInfo({ page: page as any });
    const ctx = createMockSkillContext({ getSession: vi.fn().mockResolvedValue(session) });
    const result = await reload.handler({}, ctx);
    expect(result.content).toContain("https://my.com");
    expect(result.content).toContain("My Page");
  });
});
