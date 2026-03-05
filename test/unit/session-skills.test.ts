import { describe, it, expect, vi } from "vitest";
import { sessionCreate } from "../../src/skills/session-create.js";
import { sessionList } from "../../src/skills/session-list.js";
import { sessionClose } from "../../src/skills/session-close.js";
import { createMockSkillContext, createMockSessionInfo } from "../helpers/mock-factories.js";

describe("browser_session_create", () => {
  it("calls ctx.createSession with provided options", async () => {
    const ctx = createMockSkillContext();
    await sessionCreate.handler({ browser: "firefox", headless: false }, ctx);
    expect(ctx.createSession).toHaveBeenCalledWith({
      browser: "firefox",
      headless: false,
      viewport: undefined,
      userAgent: undefined,
    });
  });

  it("returns session ID in content", async () => {
    const session = createMockSessionInfo({ id: "my-session-123" });
    const ctx = createMockSkillContext({
      createSession: vi.fn().mockResolvedValue(session),
    });
    const result = await sessionCreate.handler({}, ctx);
    expect(result.success).toBe(true);
    expect(result.content).toContain("my-session-123");
  });

  it("passes viewport and userAgent", async () => {
    const ctx = createMockSkillContext();
    await sessionCreate.handler(
      { viewport: { width: 800, height: 600 }, userAgent: "TestBot" },
      ctx,
    );
    expect(ctx.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        viewport: { width: 800, height: 600 },
        userAgent: "TestBot",
      }),
    );
  });
});

describe("browser_session_list", () => {
  it("returns 'No active sessions.' when empty", async () => {
    const ctx = createMockSkillContext({ listSessions: vi.fn().mockReturnValue([]) });
    const result = await sessionList.handler({}, ctx);
    expect(result.success).toBe(true);
    expect(result.content).toBe("No active sessions.");
  });

  it("formats sessions when present", async () => {
    const sessions = [
      createMockSessionInfo({ id: "s1", url: "https://a.com", createdAt: 1000, lastUsedAt: 2000 }),
      createMockSessionInfo({ id: "s2", url: "https://b.com", createdAt: 3000, lastUsedAt: 4000 }),
    ];
    const ctx = createMockSkillContext({ listSessions: vi.fn().mockReturnValue(sessions) });
    const result = await sessionList.handler({}, ctx);
    expect(result.success).toBe(true);
    expect(result.content).toContain("s1");
    expect(result.content).toContain("s2");
    expect(result.content).toContain("Active sessions (2)");
  });
});

describe("browser_session_close", () => {
  it("closes specified session", async () => {
    const ctx = createMockSkillContext();
    const result = await sessionClose.handler({ sessionId: "my-sess" }, ctx);
    expect(ctx.closeSession).toHaveBeenCalledWith("my-sess");
    expect(result.success).toBe(true);
    expect(result.content).toContain("my-sess");
  });

  it("defaults to 'default' session when no sessionId", async () => {
    const ctx = createMockSkillContext();
    const result = await sessionClose.handler({}, ctx);
    expect(ctx.closeSession).toHaveBeenCalledWith("default");
    expect(result.content).toContain("default");
  });

  it("returns success message", async () => {
    const ctx = createMockSkillContext();
    const result = await sessionClose.handler({ sessionId: "x" }, ctx);
    expect(result.success).toBe(true);
    expect(result.content).toContain("closed");
  });
});
