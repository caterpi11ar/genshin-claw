# Browser Automation — Agent Prompt

You have access to browser automation skills via `genshin-skills`. Use these scripts to interact with web pages.

## Workflow

### 1. Start the browser

```bash
node <SKILL_DIR>/dist/scripts/start-browser.js &
```

Wait a moment for the browser to initialize.

### 2. Navigate and observe

```bash
# Go to a page
node <SKILL_DIR>/dist/scripts/run-skill.js browser_navigate --url "https://example.com"

# See what's on the page
node <SKILL_DIR>/dist/scripts/run-skill.js browser_screenshot --output-file page.png
node <SKILL_DIR>/dist/scripts/run-skill.js browser_extract_text
```

### 3. Interact

```bash
# Click a button
node <SKILL_DIR>/dist/scripts/run-skill.js browser_click --selector "button.submit"

# Fill a form field
node <SKILL_DIR>/dist/scripts/run-skill.js browser_fill --selector "#email" --value "user@example.com"

# Press a key
node <SKILL_DIR>/dist/scripts/run-skill.js browser_press_key --key "Enter"
```

### 4. Extract results

```bash
# Get text content
node <SKILL_DIR>/dist/scripts/run-skill.js browser_extract_text --selector ".results"

# Get an attribute
node <SKILL_DIR>/dist/scripts/run-skill.js browser_get_attribute --selector "a.link" --attribute "href"
```

### 5. Stop the browser

```bash
node <SKILL_DIR>/dist/scripts/stop-browser.js
```

## Rules

1. **Always start the browser** before using any browser skill.
2. **Always stop the browser** when you're done.
3. **Check the `success` field** in every response. If `false`, the operation failed and the `content` field has the error message.
4. **Use `--output-file`** for screenshots and PDFs to save binary data to a file instead of getting base64 in JSON.
5. **Default session** is used automatically. You only need `--session-id` if you created multiple sessions.

## Skill Reference

### Session

| Skill | Args | Example |
|-------|------|---------|
| `browser_session_create` | `[--browser chromium\|firefox\|webkit] [--headless] [--user-agent "..."]` | `run-skill.js browser_session_create --browser firefox` |
| `browser_session_list` | _(none)_ | `run-skill.js browser_session_list` |
| `browser_session_close` | `[--session-id ID]` | `run-skill.js browser_session_close` |

### Navigation

| Skill | Args | Example |
|-------|------|---------|
| `browser_navigate` | `--url URL [--wait-until load\|domcontentloaded\|networkidle\|commit]` | `run-skill.js browser_navigate --url "https://example.com"` |
| `browser_get_url` | `[--session-id]` | `run-skill.js browser_get_url` |
| `browser_get_title` | `[--session-id]` | `run-skill.js browser_get_title` |
| `browser_go_back` | `[--wait-until]` | `run-skill.js browser_go_back` |
| `browser_go_forward` | `[--wait-until]` | `run-skill.js browser_go_forward` |
| `browser_reload` | `[--wait-until]` | `run-skill.js browser_reload` |

### Interaction

| Skill | Args | Example |
|-------|------|---------|
| `browser_click` | `--selector SEL [--button left\|right\|middle] [--click-count N] [--timeout MS]` | `run-skill.js browser_click --selector "#btn"` |
| `browser_fill` | `--selector SEL --value TEXT [--timeout MS]` | `run-skill.js browser_fill --selector "#name" --value "Alice"` |
| `browser_type` | `--selector SEL --text TEXT [--delay MS] [--timeout MS]` | `run-skill.js browser_type --selector "#search" --text "hello"` |
| `browser_hover` | `--selector SEL [--timeout MS]` | `run-skill.js browser_hover --selector ".menu-item"` |
| `browser_check` | `--selector SEL [--checked true\|false] [--timeout MS]` | `run-skill.js browser_check --selector "#agree"` |
| `browser_press_key` | `--key KEY [--selector SEL]` | `run-skill.js browser_press_key --key "Enter"` |
| `browser_select_option` | `--selector SEL [--value V \| --label L \| --index N] [--timeout MS]` | `run-skill.js browser_select_option --selector "#country" --label "Japan"` |

### Extraction

| Skill | Args | Example |
|-------|------|---------|
| `browser_extract_text` | `[--selector SEL]` | `run-skill.js browser_extract_text --selector ".article"` |
| `browser_extract_html` | `[--selector SEL] [--outer]` | `run-skill.js browser_extract_html --selector "#content"` |
| `browser_get_attribute` | `--selector SEL --attribute ATTR` | `run-skill.js browser_get_attribute --selector "img" --attribute "src"` |
| `browser_screenshot` | `[--selector SEL] [--full-page] [--output-file PATH]` | `run-skill.js browser_screenshot --output-file shot.png` |
| `browser_pdf` | `[--format A4\|Letter\|...] [--landscape] [--print-background] [--output-file PATH]` | `run-skill.js browser_pdf --output-file page.pdf` |

### Page Operations

| Skill | Args | Example |
|-------|------|---------|
| `browser_scroll` | `[--selector SEL] [--direction up\|down] [--amount PX] [--to-edge top\|bottom]` | `run-skill.js browser_scroll --direction down --amount 500` |
| `browser_wait` | `--ms MS` | `run-skill.js browser_wait --ms 2000` |
| `browser_wait_for_selector` | `--selector SEL [--state visible\|hidden\|attached\|detached] [--timeout MS]` | `run-skill.js browser_wait_for_selector --selector ".loaded"` |
| `browser_evaluate` | `--expression JS` | `run-skill.js browser_evaluate --expression "document.title"` |
| `browser_set_viewport` | `--width W --height H` | `run-skill.js browser_set_viewport --width 1920 --height 1080` |
| `browser_upload_file` | `--selector SEL --file-path PATH` | `run-skill.js browser_upload_file --selector "#avatar" --file-path "/tmp/photo.jpg"` |
| `browser_dialog_handle` | `--action accept\|dismiss [--prompt-text TEXT]` | `run-skill.js browser_dialog_handle --action accept` |

### Cookies

| Skill | Args | Example |
|-------|------|---------|
| `browser_get_cookies` | `[--urls '["url1","url2"]']` | `run-skill.js browser_get_cookies` |
| `browser_set_cookies` | `--cookies '[{"name":"a","value":"b","url":"https://example.com"}]'` | `run-skill.js browser_set_cookies --cookies '[...]'` |
| `browser_clear_cookies` | `[--session-id]` | `run-skill.js browser_clear_cookies` |
