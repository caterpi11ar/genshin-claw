import { z } from "zod";
import { defineSkill } from "../core/types.js";

export const scroll = defineSkill({
  name: "browser_scroll",
  description:
    "Scroll the page or a specific element. Can scroll by pixels or to top/bottom.",
  inputSchema: z.object({
    sessionId: z
      .string()
      .optional()
      .describe("Session ID. Uses default session if omitted."),
    selector: z
      .string()
      .optional()
      .describe("CSS selector of element to scroll. Omit to scroll the page."),
    direction: z
      .enum(["up", "down"])
      .optional()
      .describe("Scroll direction. Defaults to 'down'."),
    amount: z
      .number()
      .int()
      .optional()
      .describe("Pixels to scroll. Defaults to one viewport height."),
    toEdge: z
      .enum(["top", "bottom"])
      .optional()
      .describe("Scroll to the very top or bottom of the page."),
  }),
  annotations: { readOnlyHint: false, idempotentHint: false },
  async handler(input, ctx) {
    const session = await ctx.getSession(input.sessionId);
    const page = session.page;

    if (input.toEdge) {
      const position = input.toEdge === "top" ? 0 : Number.MAX_SAFE_INTEGER;
      if (input.selector) {
        await page.locator(input.selector).evaluate(
          (el, pos) => el.scrollTo(0, pos),
          position,
        );
      } else {
        await page.evaluate(
          `window.scrollTo(0, ${position})`,
        );
      }
      return { content: `Scrolled to ${input.toEdge}`, success: true };
    }

    const direction = input.direction ?? "down";
    const viewport = page.viewportSize();
    const amount = input.amount ?? (viewport?.height ?? 600);
    const delta = direction === "up" ? -amount : amount;

    if (input.selector) {
      await page.locator(input.selector).evaluate(
        (el, d) => el.scrollBy(0, d),
        delta,
      );
    } else {
      await page.evaluate(`window.scrollBy(0, ${delta})`);
    }

    return {
      content: `Scrolled ${direction} by ${amount}px`,
      success: true,
    };
  },
});
