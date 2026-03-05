import { z } from "zod";
import { defineSkill } from "../core/types.js";
import { validateSelector } from "../utils/sanitize.js";

export const getAttribute = defineSkill({
  name: "browser_get_attribute",
  description: "Get an attribute value from an element.",
  inputSchema: z.object({
    selector: z.string().describe("CSS selector of the element."),
    attribute: z.string().describe("Name of the attribute to retrieve."),
    sessionId: z
      .string()
      .optional()
      .describe("Session ID. Uses default session if omitted."),
  }),
  annotations: { readOnlyHint: true },
  async handler(input, ctx) {
    validateSelector(input.selector);
    const session = await ctx.getSession(input.sessionId);
    const value = await session.page
      .locator(input.selector)
      .getAttribute(input.attribute);
    return {
      content: value ?? "(null)",
      success: true,
    };
  },
});
