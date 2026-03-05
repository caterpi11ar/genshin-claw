import { z } from "zod";
import { defineSkill } from "../core/types.js";

export const sessionClose = defineSkill({
  name: "browser_session_close",
  description:
    "Close a browser session and release its resources. If no sessionId is provided, closes the default session.",
  inputSchema: z.object({
    sessionId: z
      .string()
      .optional()
      .describe("ID of the session to close. Omit to close the default session."),
  }),
  annotations: { destructiveHint: true },
  async handler(input, ctx) {
    const id = input.sessionId ?? "default";
    await ctx.closeSession(id);
    return { content: `Session "${id}" closed.`, success: true };
  },
});
