# DSH Codex Read-Only Bridge

[English](README.md) | [简体中文](README.zh-CN.md)

This local MCP server lets Codex list DSH workspaces and unarchived sessions.
It is deliberately metadata-only: it does not read conversations, prompts,
responses, tool logs, attachments, credentials, cookies, API keys, or tokens.

## Requirements

- Node.js 20 or newer
- A local DSH desktop data directory at the standard AppData location

Install dependencies from this repository:

```powershell
npm install
```

## Enable in Codex

1. Copy the `[mcp_servers.dsh_readonly]` stanza in `codex-mcp.example.toml`
   into your local Codex MCP configuration.
2. Replace the placeholder with the absolute path to this repository's
   `src/server.mjs` file.
3. Restart or reload Codex's MCP configuration.

The bridge is opt-in. To disable it, remove that stanza and reload the MCP
configuration.

## Tools

`list_dsh_workspaces` returns only the following metadata for each workspace:

- ID, name, and filesystem path
- number of sessions
- most recent activity timestamp when available

`list_dsh_sessions` optionally accepts a workspace name and returns only
unarchived sessions. Each row contains an ID, workspace name, title,
conservative state (`in_progress`, `completed`, `pending`, or `unknown`), and
most recent activity timestamp when available.

## Privacy and behavior

The server reads only these local DSH metadata locations:

- `storages/workspace.json`
- direct JSON records in `storages/session_projcache/sessions/`
- `task-board/ledger-v2.json`

It reads metadata only when a tool is called. It has no watcher, scheduler,
cache, background polling, DSH Web/RPC integration, network listener, or write
path. Reads that fail during a DSH update are retried once; tool errors report
only a safe generic message rather than a local path or exception stack.

## Test

```powershell
npm test
```

The package runs Node's tests without child-process isolation because the
`unelevated` Windows sandbox policy blocks Node's test-worker child processes.
