# DSH Codex 只读桥接服务

[English](README.md) | [简体中文](README.zh-CN.md)

这个本地 MCP 服务让 Codex 能够列出 DSH 工作区与未归档会话。
它严格只读取元数据：不会读取对话、提示词、回复、工具日志、附件、凭据、Cookie、API 密钥或令牌。

## 环境要求

- Node.js 20 或更高版本
- 标准 AppData 位置中存在本地 DSH 桌面端数据目录

在本仓库中安装依赖：

```powershell
npm install
```

## 在 Codex 中启用

1. 将 `codex-mcp.example.toml` 中的 `[mcp_servers.dsh_readonly]` 配置段复制到本地 Codex MCP 配置。
2. 将占位路径替换为本仓库 `src/server.mjs` 的绝对路径。
3. 重启 Codex 或重新加载 MCP 配置。

该 bridge 采用显式启用模式。要停用它，请删除该配置段并重新加载 MCP 配置。

## 工具

`list_dsh_workspaces` 仅返回每个工作区的以下元数据：

- ID、名称和文件系统路径
- 会话数量
- 可用时的最近活动时间戳

`list_dsh_sessions` 可选接收工作区名称，只返回未归档会话。每个条目包含 ID、工作区名称、标题、保守状态（`in_progress`、`completed`、`pending` 或 `unknown`）以及可用时的最近活动时间戳。

## 隐私与行为

服务只读取以下本地 DSH 元数据位置：

- `storages/workspace.json`
- `storages/session_projcache/sessions/` 中的直接 JSON 记录
- `task-board/ledger-v2.json`

只有在调用工具时才会读取元数据。服务没有文件监视器、调度器、缓存、后台轮询、DSH Web/RPC 集成、网络监听器或写入路径。若 DSH 正在更新而导致读取失败，服务会重试一次；工具错误只会返回安全的通用消息，不会泄露本地路径或异常堆栈。

## 测试

```powershell
npm test
```

由于 `unelevated` Windows 沙盒策略会阻止 Node 测试工作线程创建子进程，项目测试以关闭子进程隔离的方式运行。
