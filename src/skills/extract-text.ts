import { z } from "zod";
import { defineSkill } from "../core/types.js";
import { validateSelector } from "../utils/sanitize.js";

export const extractText = defineSkill({
  name: "browser_extract_text",
  description:
    "Extract the visible text content from the page or a specific element.",
  inputSchema: z.object({
    sessionId: z
      .string()
      .optional()
      .describe("Session ID. Uses default session if omitted."),
    selector: z
      .string()
      .optional()
      .describe(
        "CSS selector to extract text from. Omit to extract all visible text from the page body.",
      ),
  }),
  annotations: { readOnlyHint: true },
  async handler(input, ctx) {
    const session = await ctx.getSession(input.sessionId);
    const sel = input.selector ?? "body";
    if (input.selector) validateSelector(input.selector);
    const text = await session.page.locator(sel).innerText();
    return { content: text, success: true };
  },
});
