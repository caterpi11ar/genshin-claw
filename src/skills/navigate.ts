import { z } from "zod";
import { defineSkill } from "../core/types.js";
import { validateUrl } from "../utils/sanitize.js";

export const navigate = defineSkill({
  name: "browser_navigate",
  description:
    "Navigate the browser to a URL. Waits for the page to load before returning.",
  inputSchema: z.object({
    url: z.string().url().describe("The URL to navigate to."),
    sessionId: z
      .string()
      .optional()
      .describe("Session ID. Uses default session if omitted."),
    waitUntil: z
      .enum(["load", "domcontentloaded", "networkidle", "commit"])
      .optional()
      .describe("When to consider navigation complete. Defaults to 'load'."),
  }),
  annotations: { readOnlyHint: false, idempotentHint: true },
  async handler(input, ctx) {
    validateUrl(input.url);
    const session = await ctx.getSession(input.sessionId);
    await session.page.goto(input.url, {
      waitUntil: input.waitUntil ?? "load",
    });
    const title = await session.page.title();
    return {
      content: `Navigated to ${session.page.url()} — "${title}"`,
      success: true,
    };
  },
});
