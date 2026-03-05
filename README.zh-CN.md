# Genshin Skills

面向 LLM 的浏览器自动化技能集 — 一个 [OpenClaw](https://github.com/anthropics/openclaw) 技能项目。

提供 **33 个基于 Playwright 的原子浏览器操作**（导航、点击、填充、截图、提取文本等），LLM 代理可通过 bash 脚本经 Unix 域套接字 IPC 调用。每个新浏览器会话自动打开[原神云游戏](https://ys.mihoyo.com/cloud/)页面。

## 已支持功能

- **领取月卡（空月祝福）** — 自动登录云游戏并领取每日月卡奖励。

## 快速开始

```bash
pnpm install
pnpm build

# 启动浏览器后台进程
node dist/scripts/start-browser.js &

# 运行技能
node dist/scripts/run-skill.js browser_navigate --url "https://ys.mihoyo.com/cloud/"
node dist/scripts/run-skill.js browser_screenshot

# 停止浏览器
node dist/scripts/stop-browser.js
```

## 架构

**IPC 模型**：`start-browser.js` 启动一个常驻 Unix 套接字服务器（`/tmp/genshin-skills.sock`）。`run-skill.js` 连接后发送换行分隔的 JSON 命令，通过 stdout 接收 JSON 结果。`stop-browser.js` 发送关闭命令。

**核心流水线**：`SkillRegistry` 存储所有技能定义 → `SkillRunner.run()` 通过 Zod 校验输入、带超时执行处理器、捕获 `SkillError` 子类 → `SessionManager` 为处理器提供 `SkillContext`，支持延迟会话创建、空闲超时（30 分钟）及最多 5 个并发会话。

**配置**：所有运行时常量集中在 `src/core/config.ts` 中，通过 Zod 校验。可配置项包括启动 URL、会话超时、最大会话数、对话框自动关闭延迟和技能执行超时。

## 技能参考

所有技能均接受可选的 `sessionId` 参数（省略则使用默认会话）。使用 CSS 选择器的技能会在使用前进行校验。所有技能返回 `{ content: string, success: boolean }`。

### 会话管理

#### `browser_session_create`

创建一个新的浏览器会话，拥有独立的浏览器上下文。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `browser` | `"chromium" \| "firefox" \| "webkit"` | 否 | `"chromium"` | 浏览器引擎 |
| `headless` | `boolean` | 否 | `true` | 无头模式运行 |
| `viewport` | `{ width: number, height: number }` | 否 | — | 初始视口大小 |
| `userAgent` | `string` | 否 | — | 自定义 User Agent 字符串 |

返回新会话 ID。

#### `browser_login`

基于 Cookie 的持久化登录。若存在 Cookie 文件，以无头模式加载 Cookie 直接使用；若不存在，打开可见浏览器供用户手动登录，轮询检测登录成功后保存 Cookie，然后切换到无头模式。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `loginSuccessSelector` | `string` | 否 | `".wel-card__content--start"` | 登录成功后出现的元素的 CSS 选择器 |
| `timeoutMs` | `number` | 否 | `300000`（5 分钟） | 等待用户手动登录的最长时间（毫秒） |
| `pollIntervalMs` | `number` | 否 | `500` | 轮询检测间隔（毫秒） |

#### `browser_start_game`

登录后启动游戏。关闭可能遮挡开始按钮的弹窗（公告、推广、排队提示），然后点击开始。可选等待游戏加载完成。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `sessionId` | `string` | 否 | — | 会话 ID（须为 `browser_login` 创建的现有会话） |
| `startSelector` | `string` | 否 | `".wel-card__content--start"` | 开始游戏按钮的 CSS 选择器 |
| `dismissSelectors` | `string[]` | 否 | `[]` | 点击开始前需要关闭的弹窗按钮选择器（按顺序检测） |
| `gameLoadedSelector` | `string` | 否 | — | 游戏加载完成后出现的元素选择器，省略则点击后直接返回成功 |
| `dismissTimeoutMs` | `number` | 否 | `3000` | 每个弹窗检测的等待时间（毫秒） |
| `gameLoadedTimeoutMs` | `number` | 否 | `60000` | 等待游戏加载完成的超时时间（毫秒） |
| `pollIntervalMs` | `number` | 否 | `500` | 轮询间隔（毫秒） |

#### `browser_session_list`

列出所有活跃浏览器会话及其 ID、URL 和创建时间。

无参数。

#### `browser_session_close`

关闭一个浏览器会话并释放资源。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `sessionId` | `string` | 否 | `"default"` | 要关闭的会话 |

---

### 导航

#### `browser_navigate`

导航浏览器到指定 URL，等待页面加载完成后返回。仅允许 `http://` 和 `https://` URL。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `url` | `string`（URL） | **是** | — | 要导航到的 URL |
| `sessionId` | `string` | 否 | — | 会话 ID |
| `waitUntil` | `"load" \| "domcontentloaded" \| "networkidle" \| "commit"` | 否 | `"load"` | 视为导航完成的时机 |

#### `browser_get_url`

获取当前页面的 URL。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `sessionId` | `string` | 否 | — | 会话 ID |

#### `browser_get_title`

获取当前页面标题。若页面无标题则返回 `"(no title)"`。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `sessionId` | `string` | 否 | — | 会话 ID |

#### `browser_go_back`

在浏览器历史记录中后退。若无上一页则返回 `success: false`。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `sessionId` | `string` | 否 | — | 会话 ID |
| `waitUntil` | `"load" \| "domcontentloaded" \| "networkidle" \| "commit"` | 否 | `"load"` | 视为导航完成的时机 |

#### `browser_go_forward`

在浏览器历史记录中前进。若无下一页则返回 `success: false`。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `sessionId` | `string` | 否 | — | 会话 ID |
| `waitUntil` | `"load" \| "domcontentloaded" \| "networkidle" \| "commit"` | 否 | `"load"` | 视为导航完成的时机 |

#### `browser_reload`

重新加载当前页面。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `sessionId` | `string` | 否 | — | 会话 ID |
| `waitUntil` | `"load" \| "domcontentloaded" \| "networkidle" \| "commit"` | 否 | `"load"` | 视为重新加载完成的时机 |

---

### 交互

#### `browser_click`

通过 CSS 选择器点击元素，或通过绝对坐标点击。提供 `x` 和 `y` 时使用 `page.mouse.click()` 发送原始鼠标事件（适用于 canvas/video 等云游戏元素）。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `selector` | `string` | 否* | — | 元素的 CSS 选择器 |
| `x` | `number` | 否* | — | 原始鼠标点击的绝对 X 坐标 |
| `y` | `number` | 否* | — | 原始鼠标点击的绝对 Y 坐标 |
| `sessionId` | `string` | 否 | — | 会话 ID |
| `button` | `"left" \| "right" \| "middle"` | 否 | `"left"` | 鼠标按键 |
| `clickCount` | `number`（1–3） | 否 | `1` | 点击次数 |
| `timeout` | `number`（0–30000） | 否 | `5000` | 超时毫秒数（仅选择器模式） |

\* 必须提供 `selector` 或同时提供 `x`/`y`。

#### `browser_fill`

向输入框填充文本，会先清除已有内容。适用于表单输入框、文本域和可编辑内容元素。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `selector` | `string` | **是** | — | 输入元素的 CSS 选择器 |
| `value` | `string` | **是** | — | 要填充的文本 |
| `sessionId` | `string` | 否 | — | 会话 ID |
| `timeout` | `number`（0–30000） | 否 | `5000` | 超时毫秒数 |

#### `browser_type`

逐字符输入文本，模拟真实键盘输入。与 `browser_fill` 不同，会为每个字符触发 `keydown`/`keypress`/`keyup` 事件。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `selector` | `string` | **是** | — | 元素的 CSS 选择器 |
| `text` | `string` | **是** | — | 要输入的文本 |
| `sessionId` | `string` | 否 | — | 会话 ID |
| `delay` | `number`（0–1000） | 否 | `0` | 按键间隔毫秒数 |
| `timeout` | `number`（0–30000） | 否 | `5000` | 超时毫秒数 |

#### `browser_hover`

将鼠标悬停在由 CSS 选择器标识的元素上。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `selector` | `string` | **是** | — | 元素的 CSS 选择器 |
| `sessionId` | `string` | 否 | — | 会话 ID |
| `timeout` | `number`（0–30000） | 否 | `5000` | 超时毫秒数 |

#### `browser_select_option`

从 `<select>` 下拉框中按值、标签或索引选择选项。必须提供 `value`、`label` 或 `index` 中的一个。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `selector` | `string` | **是** | — | `<select>` 元素的 CSS 选择器 |
| `sessionId` | `string` | 否 | — | 会话 ID |
| `value` | `string` | 否 | — | 选项的 `value` 属性 |
| `label` | `string` | 否 | — | 选项的可见文本 |
| `index` | `number`（≥0） | 否 | — | 从零开始的选项索引 |
| `timeout` | `number`（0–30000） | 否 | `5000` | 超时毫秒数 |

#### `browser_check`

勾选或取消勾选复选框或单选按钮。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `selector` | `string` | **是** | — | 复选框/单选按钮的 CSS 选择器 |
| `sessionId` | `string` | 否 | — | 会话 ID |
| `checked` | `boolean` | 否 | `true` | 勾选（`true`）或取消（`false`） |
| `timeout` | `number`（0–30000） | 否 | `5000` | 超时毫秒数 |

#### `browser_press_key`

按下键盘按键或组合键（例如 `Enter`、`Control+A`、`Meta+C`）。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `key` | `string` | **是** | — | 按键或组合键 |
| `sessionId` | `string` | 否 | — | 会话 ID |
| `selector` | `string` | 否 | — | 按键前先聚焦的元素 |

#### `browser_scroll`

滚动页面或特定元素，可按像素滚动或滚动到顶部/底部。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `sessionId` | `string` | 否 | — | 会话 ID |
| `selector` | `string` | 否 | — | 要滚动的元素（省略则滚动页面） |
| `direction` | `"up" \| "down"` | 否 | `"down"` | 滚动方向 |
| `amount` | `number` | 否 | 视口高度 | 滚动像素数 |
| `toEdge` | `"top" \| "bottom"` | 否 | — | 滚动到最顶部或最底部 |

#### `browser_upload_file`

向文件输入元素上传文件。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `selector` | `string` | **是** | — | `<input type="file">` 的 CSS 选择器 |
| `filePath` | `string` | **是** | — | 文件的绝对路径 |
| `sessionId` | `string` | 否 | — | 会话 ID |

#### `browser_dialog_handle`

为下一个浏览器对话框（alert、confirm、prompt、beforeunload）设置处理器。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `action` | `"accept" \| "dismiss"` | **是** | — | 接受或关闭对话框 |
| `promptText` | `string` | 否 | — | 在 prompt 对话框中输入的文本 |
| `sessionId` | `string` | 否 | — | 会话 ID |

---

### 数据提取

#### `browser_screenshot`

截取当前页面或特定元素的屏幕截图，返回 base64 编码的 PNG 图像。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `sessionId` | `string` | 否 | — | 会话 ID |
| `selector` | `string` | 否 | — | 要截图的元素（省略则截取整个页面） |
| `fullPage` | `boolean` | 否 | `false` | 截取完整可滚动页面 |

#### `browser_extract_text`

提取页面或特定元素的可见文本内容。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `sessionId` | `string` | 否 | — | 会话 ID |
| `selector` | `string` | 否 | `"body"` | 要提取文本的 CSS 选择器 |

#### `browser_extract_html`

提取页面或特定元素的 HTML 内容。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `sessionId` | `string` | 否 | — | 会话 ID |
| `selector` | `string` | 否 | `"html"` | 要提取的 CSS 选择器 |
| `outer` | `boolean` | 否 | `false` | 返回 `outerHTML` 而非 `innerHTML` |

#### `browser_get_attribute`

获取元素的属性值。若属性不存在则返回 `"(null)"`。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `selector` | `string` | **是** | — | 元素的 CSS 选择器 |
| `attribute` | `string` | **是** | — | 属性名称 |
| `sessionId` | `string` | 否 | — | 会话 ID |

#### `browser_evaluate`

在浏览器页面上下文中执行 JavaScript 代码并返回结果。谨慎使用 — 可能会修改页面状态。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `expression` | `string` | **是** | — | 要执行的 JavaScript 表达式 |
| `sessionId` | `string` | 否 | — | 会话 ID |

#### `browser_pdf`

生成当前页面的 PDF。仅适用于 Chromium 内核浏览器。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `sessionId` | `string` | 否 | — | 会话 ID |
| `format` | `"Letter" \| "Legal" \| "Tabloid" \| "A0"–"A6"` | 否 | `"Letter"` | 纸张格式 |
| `landscape` | `boolean` | 否 | `false` | 横向打印 |
| `printBackground` | `boolean` | 否 | `true` | 打印背景图形 |

---

### Cookie 管理

#### `browser_get_cookies`

获取当前页面或指定 URL 的 Cookie。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `sessionId` | `string` | 否 | — | 会话 ID |
| `urls` | `string[]` | 否 | — | 要获取 Cookie 的 URL（省略则为当前页面） |

#### `browser_set_cookies`

在浏览器上下文中设置一个或多个 Cookie。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `sessionId` | `string` | 否 | — | 会话 ID |
| `cookies` | `Cookie[]` | **是** | — | Cookie 对象数组 |

每个 Cookie 对象：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | `string` | **是** | Cookie 名称 |
| `value` | `string` | **是** | Cookie 值 |
| `url` | `string` | 否 | 关联的 URL |
| `domain` | `string` | 否 | Cookie 域 |
| `path` | `string` | 否 | Cookie 路径 |
| `expires` | `number` | 否 | Unix 时间戳过期时间 |
| `httpOnly` | `boolean` | 否 | HTTP-only 标志 |
| `secure` | `boolean` | 否 | Secure 标志 |
| `sameSite` | `"Strict" \| "Lax" \| "None"` | 否 | SameSite 策略 |

#### `browser_clear_cookies`

清除浏览器上下文中的所有 Cookie。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `sessionId` | `string` | 否 | — | 会话 ID |

---

### 页面状态

#### `browser_set_viewport`

设置浏览器视口大小。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `width` | `number`（≥1） | **是** | — | 视口宽度（像素） |
| `height` | `number`（≥1） | **是** | — | 视口高度（像素） |
| `sessionId` | `string` | 否 | — | 会话 ID |

#### `browser_wait`

等待指定的毫秒数。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `ms` | `number`（0–30000） | **是** | — | 等待毫秒数（最大 30000） |
| `sessionId` | `string` | 否 | — | 会话 ID |

#### `browser_wait_for_selector`

等待匹配 CSS 选择器的元素出现或达到指定状态。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `selector` | `string` | **是** | — | 要等待的 CSS 选择器 |
| `sessionId` | `string` | 否 | — | 会话 ID |
| `state` | `"attached" \| "detached" \| "visible" \| "hidden"` | 否 | `"visible"` | 等待的状态 |
| `timeout` | `number`（0–30000） | 否 | `10000` | 超时毫秒数 |

## 许可证

MIT
