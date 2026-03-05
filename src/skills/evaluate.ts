import { z } from "zod";
import { defineSkill } from "../core/types.js";

export const evaluate = defineSkill({
  name: "browser_evaluate",
  description:
    "Execute JavaScript code in the browser page context and return the result. Use with caution — this can modify page state.",
  inputSchema: z.object({
    expression: z
      .string()
      .describe("JavaScript expression or code to evaluate in the page."),
    sessionId: z
      .string()
      .optional()
      .describe("Session ID. Uses default session if omitted."),
  }),
  annotations: { destructiveHint: true, readOnlyHint: false },
  async handler(input, ctx) {
    const session = await ctx.getSession(input.sessionId);
    const result = await session.page.evaluate(input.expression);
    const serialized =
      result === undefined
        ? "undefined"
        : JSON.stringify(result, null, 2);
    return { content: serialized, success: true };
  },
});
