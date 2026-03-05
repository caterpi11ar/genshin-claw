import { z } from "zod";
import { defineSkill } from "../core/types.js";

export const wait = defineSkill({
  name: "browser_wait",
  description: "Wait for a specified number of milliseconds.",
  inputSchema: z.object({
    ms: z
      .number()
      .int()
      .min(0)
      .max(30000)
      .describe("Milliseconds to wait (max 30000)."),
    sessionId: z
      .string()
      .optional()
      .describe("Session ID. Uses default session if omitted."),
  }),
  annotations: { readOnlyHint: true },
  async handler(input) {
    await new Promise((resolve) => setTimeout(resolve, input.ms));
    return { content: `Waited ${input.ms}ms`, success: true };
  },
});
