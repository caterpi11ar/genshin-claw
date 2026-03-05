import { z } from "zod";
import { defineSkill } from "../core/types.js";
import { validateSelector } from "../utils/sanitize.js";

export const check = defineSkill({
  name: "browser_check",
  description:
    "Check or uncheck a checkbox or radio button.",
  inputSchema: z.object({
    selector: z.string().describe("CSS selector of the checkbox/radio element."),
    sessionId: z
      .string()
      .optional()
      .describe("Session ID. Uses default session if omitted."),
    checked: z
      .boolean()
      .optional()
      .describe("Whether to check (true) or uncheck (false). Defaults to true."),
    timeout: z
      .number()
      .int()
      .min(0)
      .max(30000)
      .optional()
      .describe("Timeout in ms. Defaults to 5000."),
  }),
  annotations: { readOnlyHint: false },
  async handler(input, ctx) {
    validateSelector(input.selector);
    const session = await ctx.getSession(input.sessionId);
    const shouldCheck = input.checked ?? true;
    if (shouldCheck) {
      await session.page.check(input.selector, {
        timeout: input.timeout ?? 5000,
      });
    } else {
      await session.page.uncheck(input.selector, {
        timeout: input.timeout ?? 5000,
      });
    }
    return {
      content: `${shouldCheck ? "Checked" : "Unchecked"} "${input.selector}"`,
      success: true,
    };
  },
});
