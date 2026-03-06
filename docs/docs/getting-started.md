---
sidebar_position: 1
title: 快速开始
---

# 快速开始

Genshin Impact Claw（`giclaw`）是专为原神服务的智能体。通过视觉模型分析游戏截图，自动完成云原神的日常任务——登录、领取月卡、收取邮件、探索派遣、纪行奖励。

无需选择器、无需坐标硬编码。截图发给 AI，AI 决定下一步操作。

## 开始使用

```bash
# 1. 安装
npm install -g giclaw@latest

# 2. 交互式配置（选择模型提供商、填写 API key）
giclaw init

# 3. 首次运行（可见浏览器，手动登录后自动保存 cookie）
giclaw run --no-headless

# 4. 后续运行（headless，复用 cookie）
giclaw run
```

`giclaw init` 会引导你选择模型提供商（Gemini、OpenAI、豆包、通义千问等）并配置 API key，配置保存到 `~/.giclaw/.env`。

如果跳过 init 直接运行，程序会自动检测未配置状态并触发引导。

首次需要手动登录米哈游账号，登录后 cookie 自动保存到 `cookies.json`，后续运行自动复用。

:::tip
在 CI 或非交互环境中，可以使用 `giclaw init --non-interactive` 创建默认配置文件，然后手动编辑 `~/.giclaw/.env` 填入 API key。
:::

## 验证配置

```bash
giclaw run --dry-run
```

`--dry-run` 仅验证配置是否正确，不会实际执行任务。
