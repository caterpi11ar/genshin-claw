import { z } from "zod";
import type { Config } from "./config.js";

/**
 * Result returned by every skill handler.
 */
export interface SkillResult {
  /** Human-readable text output */
  content: string;
  /** Optional base64-encoded image (screenshot/pdf) */
  image?: { data: string; mimeType: "image/png" | "image/jpeg" | "application/pdf" };
  /** Whether the operation succeeded */
  success: boolean;
}

/**
 * Context passed to every skill handler.
 */
export interface SkillContext {
  /** Get or create a browser session */
  getSession: (sessionId?: string) => Promise<SessionInfo>;
  /** List all active sessions */
  listSessions: () => SessionInfo[];
  /** Close a session */
  closeSession: (sessionId: string) => Promise<void>;
  /** Create a new session */
  createSession: (options?: SessionCreateOptions) => Promise<SessionInfo>;
  /** Runtime config (read-only) */
  config: Config;
}

export interface SessionInfo {
  id: string;
  createdAt: number;
  lastUsedAt: number;
  url: string;
  title: string;
  /** The Playwright Page object */
  page: import("playwright").Page;
  /** The Playwright BrowserContext */
  context: import("playwright").BrowserContext;
}

export interface SessionCreateOptions {
  /** Browser type to use */
  browser?: "chromium" | "firefox" | "webkit";
  /** Whether to run headless */
  headless?: boolean;
  /** Initial viewport size */
  viewport?: { width: number; height: number };
  /** User agent string */
  userAgent?: string;
}

/**
 * MCP tool annotations.
 */
export interface SkillAnnotations {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

/**
 * Definition of a single atomic browser skill.
 * Non-generic base type used for collections and runtime operations.
 */
export interface SkillDefinition {
  /** Skill name (e.g., "browser_navigate") */
  name: string;
  /** Human-readable description for LLMs */
  description: string;
  /** Zod schema for input validation */
  inputSchema: z.ZodType;
  /** Skill handler */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (input: any, ctx: SkillContext) => Promise<SkillResult>;
  /** MCP annotations */
  annotations?: SkillAnnotations;
  /** Per-skill timeout override in milliseconds (defaults to global skillTimeoutMs) */
  timeoutMs?: number;
}

/**
 * Type-safe skill definition used at definition site.
 */
interface TypedSkillDefinition<T extends z.ZodType> {
  name: string;
  description: string;
  inputSchema: T;
  handler: (input: z.infer<T>, ctx: SkillContext) => Promise<SkillResult>;
  annotations?: SkillAnnotations;
  timeoutMs?: number;
}

/**
 * Helper to define a skill with proper type inference.
 * Returns a SkillDefinition that is type-safe at the definition site.
 */
export function defineSkill<T extends z.ZodType>(
  def: TypedSkillDefinition<T>,
): SkillDefinition {
  return def as SkillDefinition;
}
