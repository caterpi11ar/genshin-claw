import { z } from "zod";
import { defineSkill } from "../core/types.js";

export const screenshot = defineSkill({
  name: "browser_screenshot",
  description:
    "Take a screenshot of the current page or a specific element. Returns the screenshot as a base64-encoded PNG image.",
  inputSchema: z.object({
    sessionId: z
      .string()
      .optional()
      .describe("Session ID. Uses default session if omitted."),
    selector: z
      .string()
      .optional()
      .describe("CSS selector to screenshot a specific element. Omit for full page."),
    fullPage: z
      .boolean()
      .optional()
      .describe("Capture the full scrollable page. Defaults to false."),
  }),
  annotations: { readOnlyHint: true },
  async handler(input, ctx) {
    const session = await ctx.getSession(input.sessionId);
    let buffer: Buffer;
    if (input.selector) {
      buffer = await session.page.locator(input.selector).screenshot();
    } else {
      buffer = await session.page.screenshot({
        fullPage: input.fullPage ?? false,
      });
    }
    const base64 = buffer.toString("base64");
    return {
      content: `Screenshot taken (${buffer.length} bytes)`,
      image: { data: base64, mimeType: "image/png" },
      success: true,
    };
  },
});
