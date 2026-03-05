# Genshin Skills

Browser automation skills for LLMs — an [OpenClaw](https://github.com/anthropics/openclaw) skill project.

Provides **33 atomic Playwright-based browser operations** (navigate, click, fill, screenshot, extract text, etc.) that an LLM agent can invoke via bash scripts communicating over Unix domain socket IPC. Every new browser session automatically opens the [Genshin Impact Cloud Gaming](https://ys.mihoyo.com/cloud/) page.

## Supported Features

- **Claim monthly card (Blessing of the Welkin Moon)** — Auto login to cloud gaming and claim the daily Welkin Moon reward.

## Quick Start

```bash
pnpm install
pnpm build

# Start the browser background process
node dist/scripts/start-browser.js &

# Run a skill
node dist/scripts/run-skill.js browser_navigate --url "https://ys.mihoyo.com/cloud/"
node dist/scripts/run-skill.js browser_screenshot

# Stop the browser
node dist/scripts/stop-browser.js
```

## Architecture

**IPC model**: `start-browser.js` launches a long-lived Unix socket server (`/tmp/genshin-skills.sock`). `run-skill.js` connects, sends newline-delimited JSON commands, receives JSON results on stdout. `stop-browser.js` sends a shutdown command.

**Core pipeline**: `SkillRegistry` holds all skill definitions → `SkillRunner.run()` validates input via Zod schema, executes handler with timeout, catches `SkillError` subclasses → `SessionManager` provides `SkillContext` to handlers with lazy session creation, idle timeout (30 min), and max 5 concurrent sessions.

**Configuration**: All runtime constants are centralized in `src/core/config.ts` with Zod validation. Configurable options include startup URL, session timeout, max sessions, dialog auto-dismiss delay, and skill execution timeout.

## Skills Reference

All skills accept an optional `sessionId` parameter (omit to use the default session). Skills that take CSS selectors validate them before use. All skills return `{ content: string, success: boolean }`.

### Session Management

#### `browser_session_create`

Create a new browser session with its own isolated browser context.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `browser` | `"chromium" \| "firefox" \| "webkit"` | No | `"chromium"` | Browser engine to use |
| `headless` | `boolean` | No | `true` | Run in headless mode |
| `viewport` | `{ width: number, height: number }` | No | — | Initial viewport size |
| `userAgent` | `string` | No | — | Custom user agent string |

Returns the new session ID.

#### `browser_login`

Cookie-based persistent login. If a cookie file exists, loads cookies in headless mode. If not, opens a visible browser for manual login, polls for a success selector, saves cookies, then switches to headless mode.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `loginSuccessSelector` | `string` | No | `".wel-card__content--start"` | CSS selector that appears after successful login |
| `timeoutMs` | `number` | No | `300000` (5 min) | Max time to wait for manual login (ms) |
| `pollIntervalMs` | `number` | No | `500` | Polling interval for login detection (ms) |

#### `browser_start_game`

Start the game after login. Dismisses any popup dialogs (announcements, promotions, queue notices) that may overlay the start button, then clicks start. Optionally waits for the game to finish loading.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sessionId` | `string` | No | — | Session ID (must be an existing session from `browser_login`) |
| `startSelector` | `string` | No | `".wel-card__content--start"` | CSS selector for the start button |
| `dismissSelectors` | `string[]` | No | `[]` | Popup close-button selectors to dismiss before clicking start |
| `gameLoadedSelector` | `string` | No | — | Element selector that appears when the game finishes loading |
| `dismissTimeoutMs` | `number` | No | `3000` | Timeout (ms) for detecting each popup |
| `gameLoadedTimeoutMs` | `number` | No | `60000` | Timeout (ms) for waiting for game to load |
| `pollIntervalMs` | `number` | No | `500` | Polling interval (ms) for game-loaded detection |

#### `browser_session_list`

List all active browser sessions with their IDs, URLs, and creation times.

No parameters.

#### `browser_session_close`

Close a browser session and release its resources.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sessionId` | `string` | No | `"default"` | Session to close |

---

### Navigation

#### `browser_navigate`

Navigate the browser to a URL. Waits for the page to load before returning. Only `http://` and `https://` URLs are allowed.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | `string` (URL) | **Yes** | — | The URL to navigate to |
| `sessionId` | `string` | No | — | Session ID |
| `waitUntil` | `"load" \| "domcontentloaded" \| "networkidle" \| "commit"` | No | `"load"` | When to consider navigation complete |

#### `browser_get_url`

Get the current URL of the page.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sessionId` | `string` | No | — | Session ID |

#### `browser_get_title`

Get the title of the current page. Returns `"(no title)"` if the page has no title.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sessionId` | `string` | No | — | Session ID |

#### `browser_go_back`

Navigate back in browser history. Returns `success: false` if there is no previous page.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sessionId` | `string` | No | — | Session ID |
| `waitUntil` | `"load" \| "domcontentloaded" \| "networkidle" \| "commit"` | No | `"load"` | When to consider navigation complete |

#### `browser_go_forward`

Navigate forward in browser history. Returns `success: false` if there is no next page.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sessionId` | `string` | No | — | Session ID |
| `waitUntil` | `"load" \| "domcontentloaded" \| "networkidle" \| "commit"` | No | `"load"` | When to consider navigation complete |

#### `browser_reload`

Reload the current page.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sessionId` | `string` | No | — | Session ID |
| `waitUntil` | `"load" \| "domcontentloaded" \| "networkidle" \| "commit"` | No | `"load"` | When to consider reload complete |

---

### Interaction

#### `browser_click`

Click an element by CSS selector, or click at absolute coordinates. When `x` and `y` are provided, uses `page.mouse.click()` for raw input (useful for canvas/video elements like cloud gaming).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `selector` | `string` | No* | — | CSS selector of the element |
| `x` | `number` | No* | — | Absolute X coordinate for raw mouse click |
| `y` | `number` | No* | — | Absolute Y coordinate for raw mouse click |
| `sessionId` | `string` | No | — | Session ID |
| `button` | `"left" \| "right" \| "middle"` | No | `"left"` | Mouse button |
| `clickCount` | `number` (1–3) | No | `1` | Number of clicks |
| `timeout` | `number` (0–30000) | No | `5000` | Timeout in ms (selector mode only) |

\* Either `selector` or both `x`/`y` must be provided.

#### `browser_fill`

Fill an input field with text. Clears any existing value first. Use for form inputs, textareas, and content-editable elements.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `selector` | `string` | **Yes** | — | CSS selector of the input |
| `value` | `string` | **Yes** | — | Text to fill |
| `sessionId` | `string` | No | — | Session ID |
| `timeout` | `number` (0–30000) | No | `5000` | Timeout in ms |

#### `browser_type`

Type text character by character, simulating real keyboard input. Unlike `browser_fill`, this triggers `keydown`/`keypress`/`keyup` events for each character.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `selector` | `string` | **Yes** | — | CSS selector of the element |
| `text` | `string` | **Yes** | — | Text to type |
| `sessionId` | `string` | No | — | Session ID |
| `delay` | `number` (0–1000) | No | `0` | Delay between keystrokes in ms |
| `timeout` | `number` (0–30000) | No | `5000` | Timeout in ms |

#### `browser_hover`

Hover over an element identified by a CSS selector.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `selector` | `string` | **Yes** | — | CSS selector of the element |
| `sessionId` | `string` | No | — | Session ID |
| `timeout` | `number` (0–30000) | No | `5000` | Timeout in ms |

#### `browser_select_option`

Select an option from a `<select>` dropdown by value, label, or index. Exactly one of `value`, `label`, or `index` must be provided.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `selector` | `string` | **Yes** | — | CSS selector of the `<select>` element |
| `sessionId` | `string` | No | — | Session ID |
| `value` | `string` | No | — | Option `value` attribute |
| `label` | `string` | No | — | Option visible text |
| `index` | `number` (≥0) | No | — | Zero-based option index |
| `timeout` | `number` (0–30000) | No | `5000` | Timeout in ms |

#### `browser_check`

Check or uncheck a checkbox or radio button.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `selector` | `string` | **Yes** | — | CSS selector of the checkbox/radio |
| `sessionId` | `string` | No | — | Session ID |
| `checked` | `boolean` | No | `true` | Check (`true`) or uncheck (`false`) |
| `timeout` | `number` (0–30000) | No | `5000` | Timeout in ms |

#### `browser_press_key`

Press a keyboard key or key combination (e.g., `Enter`, `Control+A`, `Meta+C`).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `key` | `string` | **Yes** | — | Key or combination to press |
| `sessionId` | `string` | No | — | Session ID |
| `selector` | `string` | No | — | Element to focus before pressing |

#### `browser_scroll`

Scroll the page or a specific element. Can scroll by pixels or to top/bottom.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sessionId` | `string` | No | — | Session ID |
| `selector` | `string` | No | — | Element to scroll (omit for page) |
| `direction` | `"up" \| "down"` | No | `"down"` | Scroll direction |
| `amount` | `number` | No | viewport height | Pixels to scroll |
| `toEdge` | `"top" \| "bottom"` | No | — | Scroll to the very top or bottom |

#### `browser_upload_file`

Upload a file to a file input element.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `selector` | `string` | **Yes** | — | CSS selector of `<input type="file">` |
| `filePath` | `string` | **Yes** | — | Absolute path to the file |
| `sessionId` | `string` | No | — | Session ID |

#### `browser_dialog_handle`

Set up a handler for the next browser dialog (alert, confirm, prompt, beforeunload).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | `"accept" \| "dismiss"` | **Yes** | — | Whether to accept or dismiss |
| `promptText` | `string` | No | — | Text to enter in a prompt dialog |
| `sessionId` | `string` | No | — | Session ID |

---

### Extraction

#### `browser_screenshot`

Take a screenshot of the current page or a specific element. Returns base64-encoded PNG.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sessionId` | `string` | No | — | Session ID |
| `selector` | `string` | No | — | Element to screenshot (omit for full page) |
| `fullPage` | `boolean` | No | `false` | Capture full scrollable page |

#### `browser_extract_text`

Extract the visible text content from the page or a specific element.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sessionId` | `string` | No | — | Session ID |
| `selector` | `string` | No | `"body"` | CSS selector to extract from |

#### `browser_extract_html`

Extract the HTML content from the page or a specific element.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sessionId` | `string` | No | — | Session ID |
| `selector` | `string` | No | `"html"` | CSS selector to extract from |
| `outer` | `boolean` | No | `false` | Return `outerHTML` instead of `innerHTML` |

#### `browser_get_attribute`

Get an attribute value from an element. Returns `"(null)"` if the attribute does not exist.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `selector` | `string` | **Yes** | — | CSS selector of the element |
| `attribute` | `string` | **Yes** | — | Attribute name |
| `sessionId` | `string` | No | — | Session ID |

#### `browser_evaluate`

Execute JavaScript code in the browser page context and return the result. Use with caution — this can modify page state.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `expression` | `string` | **Yes** | — | JavaScript expression to evaluate |
| `sessionId` | `string` | No | — | Session ID |

#### `browser_pdf`

Generate a PDF of the current page. Only works with Chromium-based browsers.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sessionId` | `string` | No | — | Session ID |
| `format` | `"Letter" \| "Legal" \| "Tabloid" \| "A0"–"A6"` | No | `"Letter"` | Paper format |
| `landscape` | `boolean` | No | `false` | Landscape orientation |
| `printBackground` | `boolean` | No | `true` | Print background graphics |

---

### Cookies

#### `browser_get_cookies`

Get cookies for the current page or specified URLs.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sessionId` | `string` | No | — | Session ID |
| `urls` | `string[]` | No | — | URLs to get cookies for (omit for current page) |

#### `browser_set_cookies`

Set one or more cookies in the browser context.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sessionId` | `string` | No | — | Session ID |
| `cookies` | `Cookie[]` | **Yes** | — | Array of cookie objects |

Each cookie object:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | **Yes** | Cookie name |
| `value` | `string` | **Yes** | Cookie value |
| `url` | `string` | No | URL to associate |
| `domain` | `string` | No | Cookie domain |
| `path` | `string` | No | Cookie path |
| `expires` | `number` | No | Unix timestamp for expiry |
| `httpOnly` | `boolean` | No | HTTP-only flag |
| `secure` | `boolean` | No | Secure flag |
| `sameSite` | `"Strict" \| "Lax" \| "None"` | No | SameSite policy |

#### `browser_clear_cookies`

Clear all cookies in the browser context.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sessionId` | `string` | No | — | Session ID |

---

### Page State

#### `browser_set_viewport`

Set the browser viewport size.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `width` | `number` (≥1) | **Yes** | — | Viewport width in pixels |
| `height` | `number` (≥1) | **Yes** | — | Viewport height in pixels |
| `sessionId` | `string` | No | — | Session ID |

#### `browser_wait`

Wait for a specified number of milliseconds.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `ms` | `number` (0–30000) | **Yes** | — | Milliseconds to wait |
| `sessionId` | `string` | No | — | Session ID |

#### `browser_wait_for_selector`

Wait for an element matching the CSS selector to appear or reach a specific state.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `selector` | `string` | **Yes** | — | CSS selector to wait for |
| `sessionId` | `string` | No | — | Session ID |
| `state` | `"attached" \| "detached" \| "visible" \| "hidden"` | No | `"visible"` | State to wait for |
| `timeout` | `number` (0–30000) | No | `10000` | Timeout in ms |

## License

MIT
