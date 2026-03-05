import { z } from "zod";
import { defineSkill } from "../core/types.js";
import { validateSelector } from "../utils/sanitize.js";

export const typeText = defineSkill({
  name: "browser_type",
  description:
    "Type text into an element character by character, simulating real keyboard input. Unlike fill, this triggers keydown/keypress/keyup events for each character.",
  inputSchema: z.object({
    selector: z.string().describe("CSS selector of the element to type into."),
    text: z.string().describe("Text to type."),
    sessionId: z
      .string()
      .optional()
      .describe("Session ID. Uses default session if omitted."),
    delay: z
      .number()
      .int()
      .min(0)
      .max(1000)
      .optional()
      .describe("Delay between keystrokes in ms. Defaults to 0."),
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
    await session.page.locator(input.selector).pressSequentially(input.text, {
      delay: input.delay,
      timeout: input.timeout ?? 5000,
    });
    return {
      content: `Typed text into "${input.selector}"`,
      success: true,
    };
  },
});
