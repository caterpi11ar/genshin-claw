import { z } from "zod";
import { defineSkill } from "../core/types.js";

export const getUrl = defineSkill({
  name: "browser_get_url",
  description: "Get the current URL of the page.",
  inputSchema: z.object({
    sessionId: z
      .string()
      .optional()
      .describe("Session ID. Uses default session if omitted."),
  }),
  annotations: { readOnlyHint: true },
  async handler(input, ctx) {
    const session = await ctx.getSession(input.sessionId);
    return { content: session.page.url(), success: true };
  },
});
