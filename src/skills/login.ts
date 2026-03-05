import { z } from "zod";
import { readFile, writeFile, unlink, access } from "node:fs/promises";
import { defineSkill } from "../core/types.js";
import { logger } from "../utils/logger.js";

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkSelector(
  page: { locator: (sel: string) => { waitFor: (opts: { timeout: number }) => Promise<void> } },
  selector: string,
): Promise<boolean> {
  try {
    await page.locator(selector).waitFor({ timeout: 0 });
    return true;
  } catch {
    return false;
  }
}

export const login = defineSkill({
  name: "browser_login",
  description:
    "Cookie-based persistent login. If a cookie file exists, loads cookies in headless mode. " +
    "If not, opens a visible browser for manual login, polls for a success selector, " +
    "saves cookies, then switches to headless mode.",
  inputSchema: z.object({
    loginSuccessSelector: z
      .string()
      .default(".wel-card__content--start")
      .describe("CSS selector that appears after successful login."),
    timeoutMs: z
      .number()
      .int()
      .positive()
      .default(300_000)
      .describe("Max time to wait for manual login (ms). Default 5 minutes."),
    pollIntervalMs: z
      .number()
      .int()
      .positive()
      .default(500)
      .describe("Polling interval for login detection (ms)."),
  }),
  annotations: { readOnlyHint: false },
  timeoutMs: 310_000,
  async handler(input, ctx) {
    const cookiePath = ctx.config.cookieFilePath;
    const hasCookieFile = await fileExists(cookiePath);

    if (hasCookieFile) {
      logger.info("Cookie file found, attempting headless login");
      const result = await tryLoadCookies(cookiePath, input.loginSuccessSelector, ctx);
      if (result) return result;

      // Cookies expired — delete file and fall through to manual login
      logger.info("Cookies expired, deleting cookie file");
      await unlink(cookiePath);
    }

    // Manual login flow
    logger.info("Opening visible browser for manual login");
    const visibleSession = await ctx.createSession({ headless: false });

    const loggedIn = await pollForLogin(
      visibleSession.page,
      input.loginSuccessSelector,
      input.timeoutMs,
      input.pollIntervalMs,
    );

    if (!loggedIn) {
      return {
        content: `Login timed out after ${input.timeoutMs}ms — selector "${input.loginSuccessSelector}" not found`,
        success: false,
      };
    }

    // Save cookies
    const cookies = await visibleSession.context.cookies();
    await writeFile(cookiePath, JSON.stringify(cookies, null, 2));
    logger.info("Cookies saved to file");

    // Close visible session, open headless
    await ctx.closeSession(visibleSession.id);
    const headlessSession = await ctx.createSession({ headless: true });
    await headlessSession.context.addCookies(cookies);
    await headlessSession.page.reload();

    return {
      content: `Login successful — cookies saved and headless session "${headlessSession.id}" ready`,
      success: true,
    };
  },
});

async function tryLoadCookies(
  cookiePath: string,
  selector: string,
  ctx: Parameters<typeof login.handler>[1],
): Promise<{ content: string; success: boolean } | null> {
  const session = await ctx.createSession({ headless: true });
  try {
    const raw = await readFile(cookiePath, "utf-8");
    const cookies = JSON.parse(raw) as Parameters<
      typeof session.context.addCookies
    >[0];
    await session.context.addCookies(cookies);
    await session.page.reload();

    const found = await checkSelector(session.page, selector);
    if (found) {
      return {
        content: `Login restored from cookies — headless session "${session.id}" ready`,
        success: true,
      };
    }

    // Cookies didn't work — close this session
    await ctx.closeSession(session.id);
    return null;
  } catch {
    await ctx.closeSession(session.id);
    return null;
  }
}

async function pollForLogin(
  page: { locator: (sel: string) => { waitFor: (opts: { timeout: number }) => Promise<void> } },
  selector: string,
  timeoutMs: number,
  pollIntervalMs: number,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const found = await checkSelector(page, selector);
    if (found) return true;
    await delay(pollIntervalMs);
  }
  return false;
}
