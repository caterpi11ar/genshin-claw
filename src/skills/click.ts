import { z } from "zod";
import { defineSkill } from "../core/types.js";
import { validateSelector } from "../utils/sanitize.js";

export const click = defineSkill({
  name: "browser_click",
  description:
    "Click an element by CSS selector, or click at absolute coordinates (x/y). " +
    "When x and y are provided, uses page.mouse.click() for raw input (useful for canvas/video).",
  inputSchema: z.object({
    selector: z
      .string()
      .optional()
      .describe("CSS selector of the element to click. Required unless x/y are provided."),
    x: z.number().optional().describe("Absolute X coordinate for raw mouse click."),
    y: z.number().optional().describe("Absolute Y coordinate for raw mouse click."),
    sessionId: z
      .string()
      .optional()
      .describe("Session ID. Uses default session if omitted."),
    button: z
      .enum(["left", "right", "middle"])
      .optional()
      .describe("Mouse button to use. Defaults to 'left'."),
    clickCount: z
      .number()
      .int()
      .min(1)
      .max(3)
      .optional()
      .describe("Number of clicks. Defaults to 1."),
    timeout: z
      .number()
      .int()
      .min(0)
      .max(30000)
      .optional()
      .describe("Timeout in ms to wait for the element. Defaults to 5000."),
  }),
  annotations: { readOnlyHint: false },
  async handler(input, ctx) {
    const session = await ctx.getSession(input.sessionId);

    // Coordinate-based click (raw mouse input, bypasses DOM checks)
    if (input.x !== undefined && input.y !== undefined) {
      const clickCount = input.clickCount ?? 1;
      for (let i = 0; i < clickCount; i++) {
        await session.page.mouse.click(input.x, input.y, {
          button: input.button ?? "left",
        });
      }
      return {
        content: `Clicked at (${input.x}, ${input.y})` + (clickCount > 1 ? ` ×${clickCount}` : ""),
        success: true,
      };
    }

    // Selector-based click
    if (!input.selector) {
      return { content: "Either selector or x/y coordinates are required", success: false };
    }
    validateSelector(input.selector);
    await session.page.click(input.selector, {
      button: input.button,
      clickCount: input.clickCount,
      timeout: input.timeout ?? 5000,
    });
    return {
      content: `Clicked "${input.selector}"`,
      success: true,
    };
  },
});
