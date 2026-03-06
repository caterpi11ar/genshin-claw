---
sidebar_position: 4
title: CLI 参考
---

# CLI 参考

```
giclaw [options] [command]
```

## 命令

| 命令 | 说明 |
|------|------|
| `run` | 单次运行（默认） |
| `daemon [options]` | Daemon 模式 |
| `init [options]` | 交互式初始化配置 |
| `config` | 显示配置路径 |

## 全局选项

| 选项 | 说明 |
|------|------|
| `-c, --config <path>` | 配置文件路径（默认 `./config.json`） |
| `-t, --tasks <ids...>` | 指定运行的任务 |
| `--headless / --no-headless` | 启用/禁用无头模式 |
| `--dry-run` | 仅验证配置 |
| `-v, --verbose` | 调试日志 |

## Daemon 选项

| 选项 | 说明 |
|------|------|
| `-p, --port <number>` | Web 面板端口（默认 3000） |
| `--no-web` | 禁用 Web 面板 |

## Init 选项

| 选项 | 说明 |
|------|------|
| `--non-interactive` | 跳过交互引导，仅创建默认配置文件 |

## 示例

```bash
# 交互式初始化配置
giclaw init

# 非交互模式（CI 环境）
giclaw init --non-interactive

# 单次运行所有已启用任务
giclaw run

# 首次运行，手动登录
giclaw run --no-headless

# 仅运行指定任务
giclaw run --tasks welkin-moon claim-mail

# 验证配置
giclaw run --dry-run

# 启动 daemon 模式
giclaw daemon

# 指定端口
giclaw daemon --port 8080

# 禁用 Web 面板
giclaw daemon --no-web
```
