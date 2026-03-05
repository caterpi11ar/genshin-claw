---
name: genshin-skills
description: >-
  Browser automation skills for LLMs. 33 atomic Playwright-based browser
  operations (navigate, click, fill, screenshot, extract text, login, start game, etc.).
  Background script manages browser sessions; agent invokes via bash.
version: "0.1.0"
metadata:
  openclaw:
    requires:
      bins: ["node"]
env: []
tools:
  - node: Required. Runs browser scripts.
files:
  read:
    - references/: Prompt templates
    - dist/: Compiled JavaScript
  write:
    - /tmp/genshin-skills.sock: Unix domain socket for IPC
    - /tmp/genshin-skills.json: Process state (PID, socket path)
---

# Genshin-Skills

Browser automation skills for LLMs — 33 atomic Playwright-based browser operations.

## Quick Start

```bash
# Install
pnpm install
npx playwright install chromium
pnpm build

# Start browser (background)
node <SKILL_DIR>/dist/scripts/start-browser.js &

# Use skills
node <SKILL_DIR>/dist/scripts/run-skill.js browser_navigate --url "https://example.com"
node <SKILL_DIR>/dist/scripts/run-skill.js browser_screenshot --output-file page.png
node <SKILL_DIR>/dist/scripts/run-skill.js browser_extract_text

# Stop browser
node <SKILL_DIR>/dist/scripts/stop-browser.js
```

## Available Skills (33)

### Session Management

| Skill | Description | Required Args |
|-------|-------------|---------------|
| `browser_session_create` | Create a new browser session | _(none)_ |
| `browser_session_list` | List all active sessions | _(none)_ |
| `browser_session_close` | Close a browser session | _(none, closes default)_ |
| `browser_login` | Cookie-based persistent login (manual login on first use, auto-restore after) | _(none)_ |
| `browser_start_game` | Dismiss popups and click start after login | _(none)_ |

### Navigation

| Skill | Description | Required Args |
|-------|-------------|---------------|
| `browser_navigate` | Navigate to a URL | `--url` |
| `browser_get_url` | Get the current page URL | _(none)_ |
| `browser_get_title` | Get the current page title | _(none)_ |
| `browser_go_back` | Navigate back in history | _(none)_ |
| `browser_go_forward` | Navigate forward in history | _(none)_ |
| `browser_reload` | Reload the current page | _(none)_ |

### Interaction

| Skill | Description | Required Args |
|-------|-------------|---------------|
| `browser_click` | Click an element by selector, or at coordinates (x/y) | `--selector` or `--x --y` |
| `browser_fill` | Fill an input field (clears first) | `--selector --value` |
| `browser_type` | Type text character by character | `--selector --text` |
| `browser_hover` | Hover over an element | `--selector` |
| `browser_check` | Check/uncheck a checkbox | `--selector` |
| `browser_press_key` | Press a key or key combo | `--key` |
| `browser_select_option` | Select dropdown option | `--selector` + `--value`/`--label`/`--index` |

### Extraction

| Skill | Description | Required Args |
|-------|-------------|---------------|
| `browser_extract_text` | Extract visible text from page/element | _(none)_ |
| `browser_extract_html` | Extract HTML from page/element | _(none)_ |
| `browser_get_attribute` | Get an element's attribute value | `--selector --attribute` |
| `browser_screenshot` | Take a screenshot (base64 PNG) | _(none)_ |
| `browser_pdf` | Generate a PDF of the page | _(none)_ |

### Page Operations

| Skill | Description | Required Args |
|-------|-------------|---------------|
| `browser_scroll` | Scroll the page or element | _(none)_ |
| `browser_wait` | Wait for a duration (ms) | `--ms` |
| `browser_wait_for_selector` | Wait for an element to appear | `--selector` |
| `browser_evaluate` | Execute JavaScript in the page | `--expression` |
| `browser_set_viewport` | Set the viewport size | `--width --height` |
| `browser_upload_file` | Upload a file to a file input | `--selector --file-path` |
| `browser_dialog_handle` | Handle browser dialogs | `--action` (accept/dismiss) |

### Cookies

| Skill | Description | Required Args |
|-------|-------------|---------------|
| `browser_get_cookies` | Get cookies for the current page | _(none)_ |
| `browser_set_cookies` | Set cookies | `--cookies '[...]'` (JSON) |
| `browser_clear_cookies` | Clear all cookies | _(none)_ |

## Common Optional Args

- `--session-id <id>` — Target a specific session (default session used if omitted)
- `--timeout <ms>` — Element wait timeout (interaction skills, default 5000)
- `--wait-until <event>` — Navigation wait strategy: `load`, `domcontentloaded`, `networkidle`, `commit`
- `--output-file <path>` — Write screenshot/PDF binary to file instead of base64 in JSON

## Architecture

```
src/
├── scripts/        # start-browser, run-skill, stop-browser
├── core/           # types, SessionManager, SkillRegistry, SkillRunner
├── skills/         # one file per skill (33 total)
└── utils/          # logger, errors, sanitize, args
```

The browser runs as a long-lived background process (`start-browser.js`) that listens on a Unix domain socket.
The `run-skill.js` script connects to the socket, sends commands, and prints JSON results to stdout.
`stop-browser.js` sends a shutdown command for graceful cleanup.

## Security

- **URL allowlist**: Only `http://` and `https://` protocols are permitted. `file://`, `javascript:`, `chrome://`, and `data:` URLs are blocked.
- **Selector limits**: CSS selectors are length-limited to prevent abuse.
- **Log redaction**: Sensitive values (passwords, tokens, cookies) are automatically redacted in logs.
- **Session isolation**: Each session has its own browser context with separate cookies and storage.
- **Idle cleanup**: Sessions are automatically closed after 30 minutes of inactivity.

## Development

```bash
pnpm build          # compile TypeScript
pnpm typecheck      # type-check without emitting
pnpm test           # run all tests
pnpm test:unit      # unit tests only
pnpm test:coverage  # with coverage report
pnpm lint           # check formatting
pnpm format         # auto-format
```

## License

MIT
