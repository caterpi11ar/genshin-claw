import { chromium, firefox, webkit } from "playwright";
import type { Browser, Dialog } from "playwright";
import type { SessionInfo, SessionCreateOptions, SkillContext } from "./types.js";
import { SessionNotFoundError, SessionLimitError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { loadConfig, type Config } from "./config.js";

const DEFAULT_SESSION_ID = "default";

interface ManagedSession extends SessionInfo {
  browser: Browser;
  dialogTimer?: ReturnType<typeof setTimeout>;
  cleanupTimer?: ReturnType<typeof setTimeout>;
}

export class SessionManager {
  private sessions = new Map<string, ManagedSession>();
  private config: Config;
  private shuttingDown = false;

  constructor(options?: Partial<Config>) {
    this.config = loadConfig(options);
  }

  /**
   * Build a SkillContext for use by skill handlers.
   */
  buildContext(): SkillContext {
    return {
      getSession: (sessionId?: string) => this.getOrCreate(sessionId),
      listSessions: () => this.list(),
      closeSession: (sessionId: string) => this.close(sessionId),
      createSession: (options?: SessionCreateOptions) =>
        this.create(undefined, options),
      config: this.config,
    };
  }

  /**
   * Get an existing session, or create the default one lazily.
   */
  async getOrCreate(sessionId?: string): Promise<SessionInfo> {
    const id = sessionId ?? DEFAULT_SESSION_ID;
    const existing = this.sessions.get(id);
    if (existing) {
      this.touch(existing);
      return existing;
    }
    if (id === DEFAULT_SESSION_ID) {
      return this.create(DEFAULT_SESSION_ID);
    }
    throw new SessionNotFoundError(id);
  }

  /**
   * Create a new session.
   */
  async create(
    sessionId?: string,
    options?: SessionCreateOptions,
  ): Promise<SessionInfo> {
    if (this.sessions.size >= this.config.maxSessions) {
      throw new SessionLimitError(this.config.maxSessions);
    }

    const id = sessionId ?? crypto.randomUUID();

    if (this.sessions.has(id)) {
      throw new Error(`Session "${id}" already exists`);
    }

    const browserType = options?.browser ?? "chromium";
    const launcher =
      browserType === "firefox"
        ? firefox
        : browserType === "webkit"
          ? webkit
          : chromium;

    logger.info(`Creating session "${id}" with ${browserType}`);

    const browser = await launcher.launch({
      headless: options?.headless ?? true,
    });

    const contextOptions: Record<string, unknown> = {};
    if (options?.viewport) {
      contextOptions["viewport"] = options.viewport;
    }
    if (options?.userAgent) {
      contextOptions["userAgent"] = options.userAgent;
    }

    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();
    await page.goto(this.config.startupUrl);

    const now = Date.now();
    const session: ManagedSession = {
      id,
      browser,
      context,
      page,
      createdAt: now,
      lastUsedAt: now,
      url: page.url(),
      title: "",
    };

    // Set up dialog auto-dismiss
    this.setupDialogHandler(session);

    // Set up idle timeout
    this.scheduleCleanup(session);

    this.sessions.set(id, session);
    logger.info(`Session "${id}" created`);

    return session;
  }

  /**
   * List all active sessions.
   */
  list(): SessionInfo[] {
    return Array.from(this.sessions.values()).map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      lastUsedAt: s.lastUsedAt,
      url: s.page.url(),
      title: s.title,
      page: s.page,
      context: s.context,
    }));
  }

  /**
   * Close a specific session.
   */
  async close(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }
    await this.destroy(session);
  }

  /**
   * Gracefully close all sessions and browsers.
   */
  async closeAll(): Promise<void> {
    if (this.shuttingDown) return;
    this.shuttingDown = true;
    logger.info("Closing all sessions...");
    const promises = Array.from(this.sessions.values()).map((s) =>
      this.destroy(s),
    );
    await Promise.allSettled(promises);
    logger.info("All sessions closed");
  }

  private touch(session: ManagedSession): void {
    session.lastUsedAt = Date.now();
    session.url = session.page.url();
    this.scheduleCleanup(session);
  }

  private scheduleCleanup(session: ManagedSession): void {
    if (session.cleanupTimer) {
      clearTimeout(session.cleanupTimer);
    }
    session.cleanupTimer = setTimeout(async () => {
      logger.info(`Session "${session.id}" timed out, closing`);
      await this.destroy(session);
    }, this.config.sessionTimeoutMs);
  }

  private setupDialogHandler(session: ManagedSession): void {
    const handleDialog = (dialog: Dialog) => {
      logger.info(
        `Dialog detected in session "${session.id}": ${dialog.type()} - "${dialog.message()}"`,
      );
      session.dialogTimer = setTimeout(async () => {
        try {
          await dialog.dismiss();
          logger.info(`Dialog auto-dismissed in session "${session.id}"`);
        } catch {
          // Dialog may have been handled already
        }
      }, this.config.dialogAutoDismissMs);
    };
    session.page.on("dialog", handleDialog);
  }

  private async destroy(session: ManagedSession): Promise<void> {
    this.sessions.delete(session.id);
    if (session.cleanupTimer) clearTimeout(session.cleanupTimer);
    if (session.dialogTimer) clearTimeout(session.dialogTimer);
    try {
      await session.browser.close();
    } catch (err) {
      logger.error(`Error closing browser for session "${session.id}"`, err);
    }
    logger.info(`Session "${session.id}" destroyed`);
  }
}
