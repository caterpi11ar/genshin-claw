import { z } from "zod";
import { defineSkill } from "../core/types.js";

export const setViewport = defineSkill({
  name: "browser_set_viewport",
  description: "Set the browser viewport size.",
  inputSchema: z.object({
    width: z.number().int().min(1).describe("Viewport width in pixels."),
    height: z.number().int().min(1).describe("Viewport height in pixels."),
    sessionId: z
      .string()
      .optional()
      .describe("Session ID. Uses default session if omitted."),
  }),
  annotations: { readOnlyHint: false, idempotentHint: true },
  async handler(input, ctx) {
    const session = await ctx.getSession(input.sessionId);
    await session.page.setViewportSize({
      width: input.width,
      height: input.height,
    });
    return {
      content: `Viewport set to ${input.width}x${input.height}`,
      success: true,
    };
  },
});
