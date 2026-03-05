import { vi } from "vitest";
import type { SessionInfo, SkillContext } from "../../src/core/types.js";
import { loadConfig } from "../../src/core/config.js";

export function createMockLocator() {
  const locator = {
    screenshot: vi.fn().mockResolvedValue(Buffer.from("fake-png")),
    innerText: vi.fn().mockResolvedValue("mock text"),
    innerHTML: vi.fn().mockResolvedValue("<p>mock</p>"),
    evaluate: vi.fn().mockResolvedValue("evaluated"),
    getAttribute: vi.fn().mockResolvedValue("attr-value"),
    press: vi.fn().mockResolvedValue(undefined),
    pressSequentially: vi.fn().mockResolvedValue(undefined),
    selectOption: vi.fn().mockResolvedValue(["opt1"]),
    setInputFiles: vi.fn().mockResolvedValue(undefined),
    waitFor: vi.fn().mockResolvedValue(undefined),
    click: vi.fn().mockResolvedValue(undefined),
  };
  return locator;
}

export function createMockPage(mockLocator?: ReturnType<typeof createMockLocator>) {
  const locator = mockLocator ?? createMockLocator();
  const page = {
    goto: vi.fn().mockResolvedValue(undefined),
    click: vi.fn().mockResolvedValue(undefined),
    fill: vi.fn().mockResolvedValue(undefined),
    hover: vi.fn().mockResolvedValue(undefined),
    check: vi.fn().mockResolvedValue(undefined),
    uncheck: vi.fn().mockResolvedValue(undefined),
    goBack: vi.fn().mockResolvedValue({}),
    goForward: vi.fn().mockResolvedValue({}),
    reload: vi.fn().mockResolvedValue(undefined),
    screenshot: vi.fn().mockResolvedValue(Buffer.from("page-png")),
    pdf: vi.fn().mockResolvedValue(Buffer.from("fake-pdf")),
    evaluate: vi.fn().mockResolvedValue(undefined),
    title: vi.fn().mockResolvedValue("Mock Title"),
    url: vi.fn().mockReturnValue("https://example.com"),
    setViewportSize: vi.fn().mockResolvedValue(undefined),
    viewportSize: vi.fn().mockReturnValue({ width: 1280, height: 720 }),
    keyboard: { press: vi.fn().mockResolvedValue(undefined) },
    locator: vi.fn().mockReturnValue(locator),
    on: vi.fn(),
    once: vi.fn(),
  };
  return page;
}

export function createMockBrowserContext() {
  return {
    cookies: vi.fn().mockResolvedValue([]),
    addCookies: vi.fn().mockResolvedValue(undefined),
    clearCookies: vi.fn().mockResolvedValue(undefined),
  };
}

export function createMockSessionInfo(
  overrides?: Partial<SessionInfo>,
): SessionInfo {
  const page = createMockPage();
  const context = createMockBrowserContext();
  return {
    id: "test-session",
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
    url: "https://example.com",
    title: "Mock Title",
    page: page as unknown as SessionInfo["page"],
    context: context as unknown as SessionInfo["context"],
    ...overrides,
  };
}

export function createMockSkillContext(
  overrides?: Partial<SkillContext>,
): SkillContext {
  const session = createMockSessionInfo();
  return {
    getSession: vi.fn().mockResolvedValue(session),
    listSessions: vi.fn().mockReturnValue([]),
    closeSession: vi.fn().mockResolvedValue(undefined),
    createSession: vi.fn().mockResolvedValue(session),
    config: loadConfig(),
    ...overrides,
  };
}
