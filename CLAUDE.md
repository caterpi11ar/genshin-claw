# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Browser automation skills for LLMs — an OpenClaw skill project. Provides 31 atomic Playwright-based browser operations (navigate, click, fill, screenshot, extract text, etc.) that an LLM agent can invoke via bash scripts communicating over Unix domain socket IPC.

## Commands

```bash
pnpm build              # compile TypeScript (tsc → dist/)
pnpm typecheck          # type-check without emitting
pnpm test               # run all tests (vitest run)
pnpm test:unit          # unit tests only (excludes integration/)
pnpm test:integration   # integration tests only
pnpm test:coverage      # tests with V8 coverage
pnpm dev                # tsc --watch

# Run a single test file
npx vitest run test/unit/navigation-skills.test.ts

# Run tests matching a pattern
npx vitest run -t "browser_navigate"

# Runtime (requires `pnpm build` first)
node dist/scripts/start-browser.js &   # start browser background process
node dist/scripts/run-skill.js browser_navigate --url "https://example.com"
node dist/scripts/stop-browser.js      # graceful shutdown
```

## Architecture

**IPC model**: `start-browser.js` launches a long-lived Unix socket server (`/tmp/genshin-skills.sock`). `run-skill.js` connects, sends newline-delimited JSON commands, receives JSON results on stdout. `stop-browser.js` sends a shutdown command.

**Core pipeline**: `SkillRegistry` holds all skill definitions → `SkillRunner.run()` validates input via Zod schema, executes handler with timeout, catches `SkillError` subclasses → `SessionManager` provides `SkillContext` to handlers with lazy session creation, idle timeout (30min), and max 5 concurrent sessions.

**Key types** (`src/core/types.ts`):
- `SkillDefinition` — name, description, Zod `inputSchema`, `handler(input, ctx)`, optional `annotations`
- `SkillResult` — `{ content: string, image?: {...}, success: boolean }`
- `SkillContext` — `getSession()`, `listSessions()`, `closeSession()`, `createSession()`
- Use `defineSkill()` helper for type-safe skill definitions

**Adding a new skill**: Create `src/skills/my-skill.ts` using `defineSkill()` with a Zod schema, add export + import to `src/skills/index.ts`, add to the `allSkills` array. Name must start with `browser_`.

## Conventions

- ESM-only (`"type": "module"` in package.json) — all imports use `.js` extension
- Skill names: `browser_` prefix (e.g., `browser_navigate`)
- Skill files: kebab-case (e.g., `navigate.ts`)
- Errors: use custom classes from `utils/errors.ts` (`SkillError`, `NavigationError`, `SelectorError`, etc.) — each has a `code` string
- Logger writes to stderr (to avoid interfering with stdout JSON output), auto-redacts sensitive keys (password, token, secret, cookie, authorization)
- URL validation: only `http://` and `https://` allowed; `file://`, `javascript:`, `chrome://`, `data:` blocked (`utils/sanitize.ts`)
- `noUncheckedIndexedAccess` and `noUnusedLocals`/`noUnusedParameters` are enabled in tsconfig

## Testing

- Unit tests mock Playwright via factories in `test/helpers/mock-factories.ts` — use `createMockSkillContext()`, `createMockPage()`, `createMockLocator()`
- Integration tests (`test/integration/`) use real Playwright browser instances
- `restoreMocks: true` in vitest config — mocks auto-restore between tests
- Test timeout: 30 seconds
