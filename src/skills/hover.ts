import { z } from "zod";
import { defineSkill } from "../core/types.js";
import { validateSelector } from "../utils/sanitize.js";

export const hover = defineSkill({
  name: "browser_hover",
  description: "Hover over an element identified by a CSS selector.",
  inputSchema: z.object({
    selector: z.string().describe("CSS selector of the element to hover."),
    sessionId: z
      .string()
      .optional()
      .describe("Session ID. Uses default session if omitted."),
    timeout: z
      .number()
      .int()
      .min(0)
      .max(30000)
      .optional()
      .describe("Timeout in ms. Defaults to 5000."),
  }),
  annotations: { readOnlyHint: true },
  async handler(input, ctx) {
    validateSelector(input.selector);
    const session = await ctx.getSession(input.sessionId);
    await session.page.hover(input.selector, {
      timeout: input.timeout ?? 5000,
    });
    return { content: `Hovered over "${input.selector}"`, success: true };
  },
});
