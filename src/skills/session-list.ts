import { z } from "zod";
import { defineSkill } from "../core/types.js";

export const sessionList = defineSkill({
  name: "browser_session_list",
  description:
    "List all active browser sessions with their IDs, URLs, and creation times.",
  inputSchema: z.object({}),
  annotations: { readOnlyHint: true },
  async handler(_input, ctx) {
    const sessions = ctx.listSessions();
    if (sessions.length === 0) {
      return { content: "No active sessions.", success: true };
    }
    const lines = sessions.map(
      (s) =>
        `- ${s.id}: ${s.url} (created: ${new Date(s.createdAt).toISOString()}, last used: ${new Date(s.lastUsedAt).toISOString()})`,
    );
    return {
      content: `Active sessions (${sessions.length}):\n${lines.join("\n")}`,
      success: true,
    };
  },
});
