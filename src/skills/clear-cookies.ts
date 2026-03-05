import { z } from "zod";
import { defineSkill } from "../core/types.js";

export const clearCookies = defineSkill({
  name: "browser_clear_cookies",
  description: "Clear all cookies in the browser context.",
  inputSchema: z.object({
    sessionId: z
      .string()
      .optional()
      .describe("Session ID. Uses default session if omitted."),
  }),
  annotations: { destructiveHint: true },
  async handler(input, ctx) {
    const session = await ctx.getSession(input.sessionId);
    await session.context.clearCookies();
    return { content: "Cookies cleared", success: true };
  },
});
