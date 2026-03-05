import { z } from "zod";
import { defineSkill } from "../core/types.js";
import { validateSelector } from "../utils/sanitize.js";

export const selectOption = defineSkill({
  name: "browser_select_option",
  description:
    "Select an option from a <select> dropdown by value, label, or index.",
  inputSchema: z.object({
    selector: z.string().describe("CSS selector of the <select> element."),
    sessionId: z
      .string()
      .optional()
      .describe("Session ID. Uses default session if omitted."),
    value: z
      .string()
      .optional()
      .describe("Option value attribute to select."),
    label: z
      .string()
      .optional()
      .describe("Option visible text label to select."),
    index: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe("Zero-based index of the option to select."),
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
    const locator = session.page.locator(input.selector);

    let selected: string[];
    if (input.value !== undefined) {
      selected = await locator.selectOption(
        { value: input.value },
        { timeout: input.timeout ?? 5000 },
      );
    } else if (input.label !== undefined) {
      selected = await locator.selectOption(
        { label: input.label },
        { timeout: input.timeout ?? 5000 },
      );
    } else if (input.index !== undefined) {
      selected = await locator.selectOption(
        { index: input.index },
        { timeout: input.timeout ?? 5000 },
      );
    } else {
      return {
        content: "Must provide one of: value, label, or index",
        success: false,
      };
    }

    return {
      content: `Selected option(s): ${selected.join(", ")}`,
      success: true,
    };
  },
});
