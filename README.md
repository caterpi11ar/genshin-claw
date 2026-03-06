<p align="center">
  <img src="docs/static/img/logo.jpeg" width="180" alt="Giclaw Logo" />
</p>

<h1 align="center">Giclaw</h1>

<p align="center">
  <strong>Genshin Impact Claw — 专为原神服务的视觉 AI 智能体</strong>
</p>

<p align="center">
  <a href="https://giclaw.cn">文档</a> · <a href="https://giclaw.cn/docs/getting-started">快速开始</a> · <a href="https://giclaw.cn/docs/skills/built-in-skills">技能列表</a>
</p>

---

通过视觉模型分析游戏截图，自动完成云原神的日常任务——登录、领取月卡、收取邮件等。无需选择器、无需坐标硬编码。截图发给 AI，AI 决定下一步操作。

## 特性

- **视觉 AI 驱动** — 纯截图理解，不依赖固定选择器或坐标
- **文件驱动技能** — 写一个 Markdown 就能定义新任务，无需 TypeScript
- **多模型支持** — Gemini、OpenAI、豆包、通义千问，任意 OpenAI 兼容视觉 API
- **共享游戏上下文** — 通用 UI 规则（鼠标锁定、HUD 布局、云游戏侧边栏）自动注入，技能只需关注自身逻辑
- **Daemon 模式** — cron 定时调度 + TUI 仪表盘 + Web 面板
- **云游戏适配** — 无需本地安装原神客户端，低资源占用

## 安装

运行环境：**Node >= 20**

```bash
npm install -g giclaw@latest
```

## 快速开始

```bash
giclaw init                  # 交互式配置
giclaw run --no-headless     # 首次运行，手动登录
giclaw run                   # 后续运行，自动执行
```

详细指南请访问 [文档站点](https://giclaw.cn/docs/getting-started)。

## 内置技能

| 技能 | 说明 | 状态 |
|------|------|------|
| `welkin-moon` | 启动云游戏，领取月卡每日奖励 | 启用 |
| `claim-mail` | 打开邮箱，一键领取所有邮件附件 | 启用 |
| `battle-pass-claim` | 打开纪行，领取等级奖励 | 暂停 |
| `expedition-collect` | 收取探索派遣并重新派遣 | 暂停 |

自定义技能只需在 `~/.giclaw/skills/` 下创建 `SKILL.md`，详见 [编写技能](https://giclaw.cn/docs/skills/writing-skills)。

## License

MIT
