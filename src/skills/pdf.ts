import { z } from "zod";
import { defineSkill } from "../core/types.js";

export const pdf = defineSkill({
  name: "browser_pdf",
  description:
    "Generate a PDF of the current page. Only works with Chromium-based browsers.",
  inputSchema: z.object({
    sessionId: z
      .string()
      .optional()
      .describe("Session ID. Uses default session if omitted."),
    format: z
      .enum(["Letter", "Legal", "Tabloid", "Ledger", "A0", "A1", "A2", "A3", "A4", "A5", "A6"])
      .optional()
      .describe("Paper format. Defaults to 'Letter'."),
    landscape: z
      .boolean()
      .optional()
      .describe("Print in landscape orientation. Defaults to false."),
    printBackground: z
      .boolean()
      .optional()
      .describe("Print background graphics. Defaults to true."),
  }),
  annotations: { readOnlyHint: true },
  async handler(input, ctx) {
    const session = await ctx.getSession(input.sessionId);
    const buffer = await session.page.pdf({
      format: input.format ?? "Letter",
      landscape: input.landscape ?? false,
      printBackground: input.printBackground ?? true,
    });
    const base64 = buffer.toString("base64");
    return {
      content: `PDF generated (${buffer.length} bytes)`,
      image: { data: base64, mimeType: "application/pdf" },
      success: true,
    };
  },
});
