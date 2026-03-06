# Skills

技能是 genshin-impact-claw 的任务单元。每个技能是一个 `SKILL.md` 文件，包含 YAML frontmatter（机器配置）和 Markdown 正文（AI 指令）。添加新技能只需写一个 Markdown 文件，无需编写 TypeScript 代码。

## 内置技能

| ID | 名称 | 说明 |
|----|------|------|
| `welkin-moon` | 月卡每日领取 | 登录 → 启动游戏 → 领取月卡奖励 |
| `claim-mail` | 邮件领取 | 打开邮箱 → 一键领取所有附件 |
| `expedition-collect` | 探索派遣收取 | 冒险之证 → 收取已完成派遣 → 重新派遣 |
| `battle-pass-claim` | 纪行奖励领取 | 打开纪行 → 领取可领取的等级奖励 |

所有技能按 `config.json` 中 `tasks.enabled` 的顺序在同一浏览器会话中依次执行。`welkin-moon` 负责启动游戏，后续技能从游戏内界面继续操作。

## SKILL.md 格式

```
skills/<skill-id>/SKILL.md
```

```markdown
---
id: my-skill
name: My Skill Name
description: One-line English description for logs and API.
enabled: true
timeoutMs: 600000
retries: 1
---

## Background
场景背景描述（中文）。告诉 AI 当前看到的是什么界面、有哪些元素。

## Goal
任务目标和操作步骤（中文）。越具体越好，列出分步操作指南。

## Known Issues
- 已知问题 1——处理方式。
- 已知问题 2——处理方式。
```

### Frontmatter 字段

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `id` | string | **必填** | 唯一标识，与目录名一致 |
| `name` | string | **必填** | 显示名称 |
| `description` | string | **必填** | 英文简述，用于日志和 API |
| `enabled` | boolean | `true` | 是否可被加载 |
| `timeoutMs` | number | `600000` | 单次执行超时（毫秒） |
| `retries` | number | `1` | 失败重试次数 |

### Markdown 正文

按 `## ` 标题分段，解析为 `TaskDescription`：

| 标题 | 映射字段 | 说明 |
|------|----------|------|
| `## Background` | `background` | AI 看到的场景上下文 |
| `## Goal` | `goal` | AI 需要完成的目标及操作步骤 |
| `## Known Issues` | `knownIssues` | 每行 `- ` 开头的已知问题列表 |

## 编写技巧

- **Background** 要描述 AI 在截图中会看到什么，帮它定位当前状态。
- **Goal** 写成分步操作指南（1、2、3…），明确每一步该点什么、找什么。
- **Known Issues** 列出容易踩坑的 UI 场景和正确处理方式，避免 AI 反复尝试错误操作。
- 所有 AI 指令用中文编写（prompt 模板为中文）。
- 如果任务在某些条件下无需执行（如没有新邮件），在 Goal 中明确说明直接报告 `done success`。

## 添加新技能

1. 创建目录：`mkdir skills/my-skill`
2. 编写 `skills/my-skill/SKILL.md`
3. 在 `config.json` 的 `tasks.enabled` 中添加 `"my-skill"`
4. 运行验证：`npx tsx src/cli.ts run --dry-run`
