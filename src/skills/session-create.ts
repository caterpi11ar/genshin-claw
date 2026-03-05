import { z } from "zod";
import { defineSkill } from "../core/types.js";

export const sessionCreate = defineSkill({
  name: "browser_session_create",
  description:
    "Create a new browser session. Returns a session ID that can be used with other browser skills. Each session has its own isolated browser context.",
  inputSchema: z.object({
    browser: z
      .enum(["chromium", "firefox", "webkit"])
      .optional()
      .describe("Browser engine to use. Defaults to chromium."),
    headless: z
      .boolean()
      .optional()
      .describe("Run in headless mode. Defaults to true."),
    viewport: z
      .object({
        width: z.number().int().min(1).describe("Viewport width in pixels"),
        height: z.number().int().min(1).describe("Viewport height in pixels"),
      })
      .optional()
      .describe("Initial viewport size."),
    userAgent: z.string().optional().describe("Custom user agent string."),
  }),
  annotations: { destructiveHint: false, readOnlyHint: false, idempotentHint: false },
  async handler(input, ctx) {
    const session = await ctx.createSession({
      browser: input.browser,
      headless: input.headless,
      viewport: input.viewport,
      userAgent: input.userAgent,
    });
    return {
      content: `Session created with ID: ${session.id}`,
      success: true,
    };
  },
});
