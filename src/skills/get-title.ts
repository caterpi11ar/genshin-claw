import { z } from "zod";
import { defineSkill } from "../core/types.js";

export const getTitle = defineSkill({
  name: "browser_get_title",
  description: "Get the title of the current page.",
  inputSchema: z.object({
    sessionId: z
      .string()
      .optional()
      .describe("Session ID. Uses default session if omitted."),
  }),
  annotations: { readOnlyHint: true },
  async handler(input, ctx) {
    const session = await ctx.getSession(input.sessionId);
    const title = await session.page.title();
    return { content: title || "(no title)", success: true };
  },
});
