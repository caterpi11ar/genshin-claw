import { z } from "zod";
import { defineSkill } from "../core/types.js";
import { validateSelector } from "../utils/sanitize.js";

export const fill = defineSkill({
  name: "browser_fill",
  description:
    "Fill an input field with text. Clears any existing value first. Use this for form inputs like text fields, textareas, and content-editable elements.",
  inputSchema: z.object({
    selector: z.string().describe("CSS selector of the input element."),
    value: z.string().describe("Text to fill into the input."),
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
  annotations: { readOnlyHint: false },
  async handler(input, ctx) {
    validateSelector(input.selector);
    const session = await ctx.getSession(input.sessionId);
    await session.page.fill(input.selector, input.value, {
      timeout: input.timeout ?? 5000,
    });
    return {
      content: `Filled "${input.selector}" with text`,
      success: true,
    };
  },
});
