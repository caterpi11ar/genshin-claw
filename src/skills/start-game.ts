import { z } from "zod";
import { defineSkill } from "../core/types.js";
import { logger } from "../utils/logger.js";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkSelector(
  page: { locator: (sel: string) => { waitFor: (opts: { timeout: number }) => Promise<void> } },
  selector: string,
  timeoutMs = 5000,
): Promise<boolean> {
  try {
    await page.locator(selector).waitFor({ timeout: timeoutMs });
    return true;
  } catch {
    return false;
  }
}

export const startGame = defineSkill({
  name: "browser_start_game",
  description:
    "Start the game after login. Dismisses any popup dialogs (announcements, promotions, queue notices) " +
    "that may overlay the start button, then clicks the start button. Optionally waits for the game to finish loading.",
  inputSchema: z.object({
    sessionId: z
      .string()
      .optional()
      .describe("Session ID. Must be an existing session created by browser_login."),
    startSelector: z
      .string()
      .default(".wel-card__content--start")
      .describe('CSS selector for the "Start Game" button.'),
    dismissSelectors: z
      .array(z.string())
      .default([])
      .describe("Popup close-button selectors to dismiss before clicking start (checked in order)."),
    gameLoadedSelector: z
      .string()
      .optional()
      .describe("CSS selector for an element that appears when the game has finished loading. If omitted, returns success immediately after clicking start."),
    dismissTimeoutMs: z
      .number()
      .int()
      .positive()
      .default(3000)
      .describe("Timeout (ms) for detecting each popup."),
    gameLoadedTimeoutMs: z
      .number()
      .int()
      .positive()
      .default(60_000)
      .describe("Timeout (ms) for waiting for the game to finish loading."),
    pollIntervalMs: z
      .number()
      .int()
      .positive()
      .default(500)
      .describe("Polling interval (ms) for game-loaded detection."),
  }),
  annotations: { readOnlyHint: false },
  timeoutMs: 120_000,
  async handler(input, ctx) {
    const session = await ctx.getSession(input.sessionId);
    const { page } = session;

    // 1. Verify the start button exists (confirms logged-in state)
    const startExists = await checkSelector(page, input.startSelector);
    if (!startExists) {
      return {
        content: `Start button not found — selector "${input.startSelector}" does not exist. Is the user logged in?`,
        success: false,
      };
    }

    // 2. Dismiss popups
    for (const selector of input.dismissSelectors) {
      logger.info(`Checking popup: ${selector}`);
      try {
        await page.locator(selector).waitFor({ timeout: input.dismissTimeoutMs });
        await page.locator(selector).click();
        logger.info(`Dismissed popup: ${selector}`);
      } catch {
        logger.info(`Popup not found, skipping: ${selector}`);
      }
    }

    // 3. Click start
    await page.locator(input.startSelector).click();
    logger.info("Clicked start button");

    // 4. Wait for game to load (if selector provided)
    if (input.gameLoadedSelector) {
      const deadline = Date.now() + input.gameLoadedTimeoutMs;
      while (Date.now() < deadline) {
        const loaded = await checkSelector(page, input.gameLoadedSelector, 1000);
        if (loaded) {
          return {
            content: `Game started and loaded — selector "${input.gameLoadedSelector}" detected`,
            success: true,
          };
        }
        await delay(input.pollIntervalMs);
      }
      return {
        content: `Game start clicked but loading timed out after ${input.gameLoadedTimeoutMs}ms — selector "${input.gameLoadedSelector}" not found`,
        success: false,
      };
    }

    return {
      content: "Game start clicked successfully",
      success: true,
    };
  },
});
