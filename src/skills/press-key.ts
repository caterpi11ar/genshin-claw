import { z } from "zod";
import { defineSkill } from "../core/types.js";

export const pressKey = defineSkill({
  name: "browser_press_key",
  description:
    "Press a keyboard key or key combination (e.g., 'Enter', 'Control+A', 'Meta+C').",
  inputSchema: z.object({
    key: z
      .string()
      .describe(
        "Key to press. Can be a single key ('Enter', 'Tab') or combination ('Control+A').",
      ),
    sessionId: z
      .string()
      .optional()
      .describe("Session ID. Uses default session if omitted."),
    selector: z
      .string()
      .optional()
      .describe("CSS selector to focus before pressing. Omit to press on the current focus."),
  }),
  annotations: { readOnlyHint: false },
  async handler(input, ctx) {
    const session = await ctx.getSession(input.sessionId);
    if (input.selector) {
      await session.page.locator(input.selector).press(input.key);
    } else {
      await session.page.keyboard.press(input.key);
    }
    return { content: `Pressed "${input.key}"`, success: true };
  },
});
