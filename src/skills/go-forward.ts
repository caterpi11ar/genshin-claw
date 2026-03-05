import { z } from "zod";
import { defineSkill } from "../core/types.js";

export const goForward = defineSkill({
  name: "browser_go_forward",
  description: "Navigate forward in browser history.",
  inputSchema: z.object({
    sessionId: z
      .string()
      .optional()
      .describe("Session ID. Uses default session if omitted."),
    waitUntil: z
      .enum(["load", "domcontentloaded", "networkidle", "commit"])
      .optional()
      .describe("When to consider navigation complete. Defaults to 'load'."),
  }),
  annotations: { readOnlyHint: false },
  async handler(input, ctx) {
    const session = await ctx.getSession(input.sessionId);
    const response = await session.page.goForward({
      waitUntil: input.waitUntil ?? "load",
    });
    if (!response) {
      return { content: "No next page in history", success: false };
    }
    const title = await session.page.title();
    return {
      content: `Navigated forward to ${session.page.url()} — "${title}"`,
      success: true,
    };
  },
});
