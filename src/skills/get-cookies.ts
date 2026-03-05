import { z } from "zod";
import { defineSkill } from "../core/types.js";

export const getCookies = defineSkill({
  name: "browser_get_cookies",
  description: "Get cookies for the current page or specified URLs.",
  inputSchema: z.object({
    sessionId: z
      .string()
      .optional()
      .describe("Session ID. Uses default session if omitted."),
    urls: z
      .array(z.string())
      .optional()
      .describe("URLs to get cookies for. Omit for current page cookies."),
  }),
  annotations: { readOnlyHint: true },
  async handler(input, ctx) {
    const session = await ctx.getSession(input.sessionId);
    const cookies = await session.context.cookies(input.urls);
    return {
      content: JSON.stringify(cookies, null, 2),
      success: true,
    };
  },
});
