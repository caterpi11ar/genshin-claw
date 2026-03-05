import { z } from "zod";
import { defineSkill } from "../core/types.js";
import { validateSelector } from "../utils/sanitize.js";

export const extractHtml = defineSkill({
  name: "browser_extract_html",
  description:
    "Extract the HTML content (innerHTML) from the page or a specific element.",
  inputSchema: z.object({
    sessionId: z
      .string()
      .optional()
      .describe("Session ID. Uses default session if omitted."),
    selector: z
      .string()
      .optional()
      .describe("CSS selector. Omit to get the full page HTML."),
    outer: z
      .boolean()
      .optional()
      .describe("If true, returns outerHTML instead of innerHTML. Defaults to false."),
  }),
  annotations: { readOnlyHint: true },
  async handler(input, ctx) {
    const session = await ctx.getSession(input.sessionId);
    const sel = input.selector ?? "html";
    if (input.selector) validateSelector(input.selector);
    const locator = session.page.locator(sel);
    const html = input.outer
      ? await locator.evaluate((el) => el.outerHTML)
      : await locator.innerHTML();
    return { content: html, success: true };
  },
});
