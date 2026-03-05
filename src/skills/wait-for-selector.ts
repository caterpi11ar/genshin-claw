import { z } from "zod";
import { defineSkill } from "../core/types.js";
import { validateSelector } from "../utils/sanitize.js";

export const waitForSelector = defineSkill({
  name: "browser_wait_for_selector",
  description:
    "Wait for an element matching the CSS selector to appear or reach a specific state.",
  inputSchema: z.object({
    selector: z.string().describe("CSS selector to wait for."),
    sessionId: z
      .string()
      .optional()
      .describe("Session ID. Uses default session if omitted."),
    state: z
      .enum(["attached", "detached", "visible", "hidden"])
      .optional()
      .describe("State to wait for. Defaults to 'visible'."),
    timeout: z
      .number()
      .int()
      .min(0)
      .max(30000)
      .optional()
      .describe("Timeout in ms. Defaults to 10000."),
  }),
  annotations: { readOnlyHint: true },
  async handler(input, ctx) {
    validateSelector(input.selector);
    const session = await ctx.getSession(input.sessionId);
    await session.page.locator(input.selector).waitFor({
      state: input.state ?? "visible",
      timeout: input.timeout ?? 10000,
    });
    return {
      content: `Selector "${input.selector}" reached state "${input.state ?? "visible"}"`,
      success: true,
    };
  },
});
