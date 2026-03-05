import { z } from "zod";
import { defineSkill } from "../core/types.js";

export const dialogHandle = defineSkill({
  name: "browser_dialog_handle",
  description:
    "Set up a handler for the next browser dialog (alert, confirm, prompt, beforeunload). The handler will accept or dismiss the dialog when it appears.",
  inputSchema: z.object({
    action: z
      .enum(["accept", "dismiss"])
      .describe("Whether to accept or dismiss the dialog."),
    promptText: z
      .string()
      .optional()
      .describe("Text to enter in a prompt dialog before accepting."),
    sessionId: z
      .string()
      .optional()
      .describe("Session ID. Uses default session if omitted."),
  }),
  annotations: { readOnlyHint: false },
  async handler(input, ctx) {
    const session = await ctx.getSession(input.sessionId);
    session.page.once("dialog", async (dialog) => {
      if (input.action === "accept") {
        await dialog.accept(input.promptText);
      } else {
        await dialog.dismiss();
      }
    });
    return {
      content: `Dialog handler set: will ${input.action} next dialog`,
      success: true,
    };
  },
});
