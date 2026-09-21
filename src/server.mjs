import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { readJsonWithRetry } from './metadata.mjs';
import { assertAllowedMetadataPath, resolveDshPaths } from './paths.mjs';
import { projectSessions, projectWorkspaces } from './projection.mjs';

function asRecord(value) {
  return value?.record ?? value;
}

function safeError(error) {
  if (error?.message === 'DSH is updating; retry shortly') return error.message;
  if (error?.code === 'ENOENT') return 'DSH data not found';
  return 'DSH metadata is unavailable';
}

async function toolResult(operation) {
  try {
    return { content: [{ type: 'text', text: JSON.stringify(await operation()) }] };
  } catch (error) {
    return { isError: true, content: [{ type: 'text', text: safeError(error) }] };
  }
}

export function createBridge(options = {}) {
  const paths = resolveDshPaths({ appDataDir: process.env.APPDATA, ...options });

  async function loadIndex() {
    const pathname = assertAllowedMetadataPath(paths.dataRoot, paths.workspaceIndex);
    return readJsonWithRetry(pathname);
  }

  async function loadWorkspaceSessions(workspace) {
    const ids = Array.isArray(workspace?.sessionIds) ? workspace.sessionIds : [];
    const results = await Promise.allSettled(ids.map(async (id) => {
      if (typeof id !== 'string') throw new Error('invalid session identifier');

      const pathname = assertAllowedMetadataPath(
        paths.dataRoot,
        path.join(paths.sessionCacheDir, `${id}.json`),
      );
      const value = asRecord(await readJsonWithRetry(pathname));
      return { ...(value && typeof value === 'object' ? value : {}), id };
    }));

    return {
      records: results.filter((result) => result.status === 'fulfilled').map((result) => result.value),
      skipped: results.filter((result) => result.status === 'rejected').length,
    };
  }

  return {
    async listWorkspaces() {
      return projectWorkspaces(await loadIndex());
    },

    async listSessions(requestedWorkspace) {
      const index = await loadIndex();
      const archived = new Set(
        (Array.isArray(index?.global?.archivedSessionIds) ? index.global.archivedSessionIds : [])
          .filter((id) => typeof id === 'string'),
      );
      const sourceWorkspaces = index?.tables?.workspaces ?? {};
      const selected = projectWorkspaces(index)
        .filter((workspace) => !requestedWorkspace || workspace.name === requestedWorkspace);
      const sessions = [];
      let skipped = 0;

      for (const workspace of selected) {
        const loaded = await loadWorkspaceSessions(sourceWorkspaces[workspace.id]);
        skipped += loaded.skipped;
        sessions.push(...projectSessions(workspace.name, loaded.records, archived));
      }

      sessions.sort((left, right) => (right.lastActivityAt ?? '').localeCompare(left.lastActivityAt ?? ''));
      return {
        sessions,
        warnings: skipped ? [`${skipped} malformed or unavailable session record(s) omitted`] : [],
      };
    },
  };
}

export async function startServer(options = {}) {
  const bridge = createBridge(options);
  const server = new McpServer({ name: 'dsh-readonly', version: '1.0.0' });

  server.tool('list_dsh_workspaces', 'List DSH workspaces and unarchived session counts.', {},
    async () => toolResult(() => bridge.listWorkspaces()));
  server.tool('list_dsh_sessions', 'List unarchived DSH sessions, optionally for one workspace.',
    { workspace: z.string().optional() },
    async ({ workspace }) => toolResult(() => bridge.listSessions(workspace)));

  await server.connect(new StdioServerTransport());
}

const isEntrypoint = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isEntrypoint) {
  await startServer();
}
