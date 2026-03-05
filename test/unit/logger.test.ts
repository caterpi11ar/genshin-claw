import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Logger", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  async function createLogger(level?: string) {
    if (level !== undefined) {
      vi.stubEnv("LOG_LEVEL", level);
    } else {
      // Ensure LOG_LEVEL is not set
      delete process.env["LOG_LEVEL"];
    }
    const mod = await import("../../src/utils/logger.js");
    return mod.logger;
  }

  describe("level filtering", () => {
    it("defaults to info level", async () => {
      const logger = await createLogger();
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      logger.info("visible");
      expect(spy).toHaveBeenCalled();
    });

    it("suppresses debug at default level", async () => {
      const logger = await createLogger();
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      logger.debug("hidden");
      expect(spy).not.toHaveBeenCalled();
    });

    it("outputs debug when LOG_LEVEL=debug", async () => {
      const logger = await createLogger("debug");
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      logger.debug("visible debug");
      expect(spy).toHaveBeenCalled();
    });

    it("warn level suppresses info", async () => {
      const logger = await createLogger("warn");
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      logger.info("hidden");
      expect(spy).not.toHaveBeenCalled();
    });

    it("error level suppresses warn", async () => {
      const logger = await createLogger("error");
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      logger.warn("hidden");
      expect(spy).not.toHaveBeenCalled();
    });

    it("error level allows error", async () => {
      const logger = await createLogger("error");
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      logger.error("visible");
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("output format", () => {
    it("writes to stderr via console.error", async () => {
      const logger = await createLogger();
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      logger.info("test message");
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("includes ISO timestamp in prefix", async () => {
      const logger = await createLogger();
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      logger.info("test");
      const prefix = spy.mock.calls[0]![0] as string;
      // ISO timestamp format: [2024-01-01T00:00:00.000Z]
      expect(prefix).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("includes uppercase level label", async () => {
      const logger = await createLogger();
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      logger.warn("test");
      const prefix = spy.mock.calls[0]![0] as string;
      expect(prefix).toContain("[WARN]");
    });
  });

  describe("sanitization", () => {
    it("redacts password values", async () => {
      const logger = await createLogger("debug");
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      logger.debug("auth", { password: "secret123" });
      const args = spy.mock.calls[0]!;
      const sanitized = args.find(
        (a: unknown) => typeof a === "object" && a !== null && "password" in a,
      ) as Record<string, unknown>;
      expect(sanitized["password"]).toBe("[REDACTED]");
    });

    it("redacts token values", async () => {
      const logger = await createLogger("debug");
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      logger.debug("auth", { token: "abc123" });
      const args = spy.mock.calls[0]!;
      const sanitized = args.find(
        (a: unknown) => typeof a === "object" && a !== null && "token" in a,
      ) as Record<string, unknown>;
      expect(sanitized["token"]).toBe("[REDACTED]");
    });

    it("redacts secret and authorization keys", async () => {
      const logger = await createLogger("debug");
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      logger.debug("data", { secret: "x", authorization: "Bearer y" });
      const args = spy.mock.calls[0]!;
      const sanitized = args.find(
        (a: unknown) => typeof a === "object" && a !== null && "secret" in a,
      ) as Record<string, unknown>;
      expect(sanitized["secret"]).toBe("[REDACTED]");
      expect(sanitized["authorization"]).toBe("[REDACTED]");
    });

    it("does not redact non-sensitive keys", async () => {
      const logger = await createLogger("debug");
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      logger.debug("data", { username: "alice" });
      const args = spy.mock.calls[0]!;
      const sanitized = args.find(
        (a: unknown) => typeof a === "object" && a !== null && "username" in a,
      ) as Record<string, unknown>;
      expect(sanitized["username"]).toBe("alice");
    });

    it("does not redact non-string values for sensitive keys", async () => {
      const logger = await createLogger("debug");
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      logger.debug("data", { password: 12345 });
      const args = spy.mock.calls[0]!;
      const sanitized = args.find(
        (a: unknown) => typeof a === "object" && a !== null && "password" in a,
      ) as Record<string, unknown>;
      expect(sanitized["password"]).toBe(12345);
    });

    it("passes array arguments as-is", async () => {
      const logger = await createLogger("debug");
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      const arr = [1, 2, 3];
      logger.debug("data", arr);
      const args = spy.mock.calls[0]!;
      expect(args).toContain(arr);
    });
  });
});
