import { z } from "zod";
import { defineSkill } from "../core/types.js";

export const reload = defineSkill({
  name: "browser_reload",
  description: "Reload the current page.",
  inputSchema: z.object({
    sessionId: z
      .string()
      .optional()
      .describe("Session ID. Uses default session if omitted."),
    waitUntil: z
      .enum(["load", "domcontentloaded", "networkidle", "commit"])
      .optional()
      .describe("When to consider reload complete. Defaults to 'load'."),
  }),
  annotations: { readOnlyHint: false, idempotentHint: true },
  async handler(input, ctx) {
    const session = await ctx.getSession(input.sessionId);
    await session.page.reload({
      waitUntil: input.waitUntil ?? "load",
    });
    const title = await session.page.title();
    return {
      content: `Reloaded ${session.page.url()} — "${title}"`,
      success: true,
    };
  },
});
