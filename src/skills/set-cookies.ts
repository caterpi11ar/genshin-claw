import { z } from "zod";
import { defineSkill } from "../core/types.js";

export const setCookies = defineSkill({
  name: "browser_set_cookies",
  description: "Set one or more cookies in the browser context.",
  inputSchema: z.object({
    sessionId: z
      .string()
      .optional()
      .describe("Session ID. Uses default session if omitted."),
    cookies: z
      .array(
        z.object({
          name: z.string().describe("Cookie name."),
          value: z.string().describe("Cookie value."),
          url: z
            .string()
            .optional()
            .describe("URL to associate the cookie with."),
          domain: z.string().optional().describe("Cookie domain."),
          path: z.string().optional().describe("Cookie path."),
          expires: z
            .number()
            .optional()
            .describe("Unix timestamp for expiry."),
          httpOnly: z.boolean().optional(),
          secure: z.boolean().optional(),
          sameSite: z.enum(["Strict", "Lax", "None"]).optional(),
        }),
      )
      .describe("Array of cookies to set."),
  }),
  annotations: { readOnlyHint: false },
  async handler(input, ctx) {
    const session = await ctx.getSession(input.sessionId);
    await session.context.addCookies(input.cookies);
    return {
      content: `Set ${input.cookies.length} cookie(s)`,
      success: true,
    };
  },
});
