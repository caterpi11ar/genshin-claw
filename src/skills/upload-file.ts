import { z } from "zod";
import { defineSkill } from "../core/types.js";
import { validateSelector } from "../utils/sanitize.js";

export const uploadFile = defineSkill({
  name: "browser_upload_file",
  description:
    "Upload a file to a file input element. The file must exist on the local filesystem.",
  inputSchema: z.object({
    selector: z
      .string()
      .describe("CSS selector of the <input type='file'> element."),
    filePath: z
      .string()
      .describe("Absolute path to the file to upload."),
    sessionId: z
      .string()
      .optional()
      .describe("Session ID. Uses default session if omitted."),
  }),
  annotations: { readOnlyHint: false },
  async handler(input, ctx) {
    validateSelector(input.selector);
    const session = await ctx.getSession(input.sessionId);
    await session.page.locator(input.selector).setInputFiles(input.filePath);
    return {
      content: `Uploaded file to "${input.selector}"`,
      success: true,
    };
  },
});
