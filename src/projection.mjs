function isoTimestamp(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return null;

  const timestamp = new Date(value);
  return Number.isNaN(timestamp.valueOf()) ? null : timestamp.toISOString();
}

export function deriveState(record) {
  const rows = record?.rows ?? {};
  const boundary = rows.turnBoundary?.val;
  const stats = rows.sessionStats?.val;
  const draft = rows.turnOutline?.val?.draft;
  const hasPendingCalls = Object.keys(stats?.pendingCalls ?? {}).length > 0;

  if (boundary?.openTurnStartSeq != null || stats?.openStep != null || hasPendingCalls || draft) {
    return 'in_progress';
  }
  if (rows.scheduler?.val || rows.todos?.val?.some((todo) => todo?.status === 'pending')) {
    return 'pending';
  }
  if (boundary?.lastStepBoundary?.kind === 'end') return 'completed';
  return 'unknown';
}

export function projectSessions(workspace, records, archivedIds) {
  return records
    .filter((record) => record && typeof record.id === 'string' && !archivedIds.has(record.id))
    .map((record) => ({
      id: record.id,
      workspace,
      title: typeof record.rows?.title?.val === 'string' ? record.rows.title.val : 'Untitled session',
      state: deriveState(record),
      lastActivityAt: isoTimestamp(record.rows?.sessionListMetadata?.val?.lastPromptAt),
    }));
}

export function projectWorkspaces(workspaceIndex) {
  const workspaces = workspaceIndex?.tables?.workspaces ?? {};

  return Object.entries(workspaces)
    .filter(([, workspace]) => workspace && typeof workspace === 'object')
    .map(([id, workspace]) => ({
      id,
      name: typeof workspace.title === 'string' ? workspace.title : 'Untitled workspace',
      path: typeof workspace.path === 'string' ? workspace.path : '',
      sessionCount: Array.isArray(workspace.sessionIds) ? workspace.sessionIds.length : 0,
      lastActivityAt: isoTimestamp(workspace.lastActivityAt ?? workspace.updatedAt),
    }));
}
