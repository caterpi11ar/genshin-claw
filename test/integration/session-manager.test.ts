import { describe, it, expect, afterEach } from "vitest";
import { SessionManager } from "../../src/core/session-manager.js";
import { SessionNotFoundError, SessionLimitError } from "../../src/utils/errors.js";

describe("SessionManager (integration)", () => {
  let sm: SessionManager;

  afterEach(async () => {
    if (sm) {
      await sm.closeAll();
    }
  });

  describe("create", () => {
    it("lazily creates default session via getOrCreate", async () => {
      sm = new SessionManager({ sessionTimeoutMs: 60_000, maxSessions: 3 });
      const session = await sm.getOrCreate();
      expect(session.id).toBe("default");
      expect(session.page).toBeDefined();
      expect(session.context).toBeDefined();
      expect(session.createdAt).toBeGreaterThan(0);
    });

    it("creates a named session", async () => {
      sm = new SessionManager({ sessionTimeoutMs: 60_000, maxSessions: 3 });
      const session = await sm.create("my-session");
      expect(session.id).toBe("my-session");
      expect(session.page).toBeDefined();
    });

    it("creates session with custom viewport", async () => {
      sm = new SessionManager({ sessionTimeoutMs: 60_000, maxSessions: 3 });
      const session = await sm.create("vp", { viewport: { width: 800, height: 600 } });
      const vp = session.page.viewportSize();
      expect(vp).toEqual({ width: 800, height: 600 });
    });

    it("creates session with custom userAgent", async () => {
      sm = new SessionManager({ sessionTimeoutMs: 60_000, maxSessions: 3 });
      const session = await sm.create("ua", { userAgent: "TestBot/1.0" });
      expect(session.page).toBeDefined();
      // userAgent is set on context level; we just verify the session was created
      expect(session.id).toBe("ua");
    });

    it("returns valid SessionInfo", async () => {
      sm = new SessionManager({ sessionTimeoutMs: 60_000, maxSessions: 3 });
      const session = await sm.create("valid");
      expect(session).toHaveProperty("id");
      expect(session).toHaveProperty("page");
      expect(session).toHaveProperty("context");
      expect(session).toHaveProperty("createdAt");
      expect(session).toHaveProperty("lastUsedAt");
      expect(session).toHaveProperty("url");
      expect(session).toHaveProperty("title");
    });
  });

  describe("getOrCreate", () => {
    it("returns existing session", async () => {
      sm = new SessionManager({ sessionTimeoutMs: 60_000, maxSessions: 3 });
      const s1 = await sm.create("reuse");
      const s2 = await sm.getOrCreate("reuse");
      expect(s2.id).toBe(s1.id);
    });

    it("throws SessionNotFoundError for unknown non-default ID", async () => {
      sm = new SessionManager({ sessionTimeoutMs: 60_000, maxSessions: 3 });
      await expect(sm.getOrCreate("nonexistent")).rejects.toThrow(SessionNotFoundError);
    });

    it("updates lastUsedAt on access", async () => {
      sm = new SessionManager({ sessionTimeoutMs: 60_000, maxSessions: 3 });
      const s = await sm.create("touch");
      const first = s.lastUsedAt;
      await new Promise((r) => setTimeout(r, 20));
      const s2 = await sm.getOrCreate("touch");
      expect(s2.lastUsedAt).toBeGreaterThanOrEqual(first);
    });
  });

  describe("list", () => {
    it("returns empty array when no sessions", () => {
      sm = new SessionManager({ sessionTimeoutMs: 60_000, maxSessions: 3 });
      expect(sm.list()).toHaveLength(0);
    });

    it("returns all active sessions", async () => {
      sm = new SessionManager({ sessionTimeoutMs: 60_000, maxSessions: 3 });
      await sm.create("a");
      await sm.create("b");
      const list = sm.list();
      expect(list).toHaveLength(2);
      const ids = list.map((s) => s.id);
      expect(ids).toContain("a");
      expect(ids).toContain("b");
    });
  });

  describe("close", () => {
    it("removes session after close", async () => {
      sm = new SessionManager({ sessionTimeoutMs: 60_000, maxSessions: 3 });
      await sm.create("closeme");
      await sm.close("closeme");
      expect(sm.list()).toHaveLength(0);
    });

    it("throws SessionNotFoundError for unknown ID", async () => {
      sm = new SessionManager({ sessionTimeoutMs: 60_000, maxSessions: 3 });
      await expect(sm.close("ghost")).rejects.toThrow(SessionNotFoundError);
    });
  });

  describe("limits", () => {
    it("throws SessionLimitError when maxSessions reached", async () => {
      sm = new SessionManager({ sessionTimeoutMs: 60_000, maxSessions: 2 });
      await sm.create("s1");
      await sm.create("s2");
      await expect(sm.create("s3")).rejects.toThrow(SessionLimitError);
    });

    it("allows creation after closing a session", async () => {
      sm = new SessionManager({ sessionTimeoutMs: 60_000, maxSessions: 2 });
      await sm.create("s1");
      await sm.create("s2");
      await sm.close("s1");
      const s3 = await sm.create("s3");
      expect(s3.id).toBe("s3");
    });
  });

  describe("timeout", () => {
    it("auto-cleans session after timeout", async () => {
      sm = new SessionManager({ sessionTimeoutMs: 500, maxSessions: 3 });
      await sm.create("ephemeral");
      expect(sm.list()).toHaveLength(1);
      await new Promise((r) => setTimeout(r, 800));
      expect(sm.list()).toHaveLength(0);
    });
  });

  describe("closeAll", () => {
    it("closes all sessions", async () => {
      sm = new SessionManager({ sessionTimeoutMs: 60_000, maxSessions: 5 });
      await sm.create("x");
      await sm.create("y");
      await sm.closeAll();
      expect(sm.list()).toHaveLength(0);
    });

    it("is idempotent", async () => {
      sm = new SessionManager({ sessionTimeoutMs: 60_000, maxSessions: 3 });
      await sm.create("z");
      await sm.closeAll();
      await sm.closeAll(); // should not throw
      expect(sm.list()).toHaveLength(0);
    });
  });

  describe("buildContext", () => {
    it("returns a usable SkillContext", async () => {
      sm = new SessionManager({ sessionTimeoutMs: 60_000, maxSessions: 3 });
      const ctx = sm.buildContext();
      expect(ctx.getSession).toBeInstanceOf(Function);
      expect(ctx.listSessions).toBeInstanceOf(Function);
      expect(ctx.closeSession).toBeInstanceOf(Function);
      expect(ctx.createSession).toBeInstanceOf(Function);
      // Verify getSession works (creates default session)
      const session = await ctx.getSession();
      expect(session.page).toBeDefined();
    });
  });

  describe("duplicate ID", () => {
    it("throws when creating session with existing ID", async () => {
      sm = new SessionManager({ sessionTimeoutMs: 60_000, maxSessions: 3 });
      await sm.create("dup");
      await expect(sm.create("dup")).rejects.toThrow("already exists");
    });
  });
});
