import path from 'node:path';

const EXACT_METADATA_PATHS = [
  ['storages', 'workspace.json'],
  ['task-board', 'ledger-v2.json'],
];
const SESSION_DIRECTORY = ['storages', 'session_projcache', 'sessions'];

export function resolveDshPaths({ appDataDir, dataRoot } = {}) {
  if (!appDataDir && !dataRoot) {
    throw new Error('appDataDir or dataRoot is required');
  }

  const root = path.resolve(dataRoot ?? path.join(appDataDir, 'dsh-desktop', 'harness'));
  return {
    dataRoot: root,
    workspaceIndex: path.join(root, ...EXACT_METADATA_PATHS[0]),
    sessionCacheDir: path.join(root, ...SESSION_DIRECTORY),
    taskBoardIndex: path.join(root, ...EXACT_METADATA_PATHS[1]),
  };
}

export function assertAllowedMetadataPath(dataRoot, candidate) {
  const root = path.resolve(dataRoot);
  const resolved = path.resolve(candidate);
  const relative = path.relative(root, resolved);
  const parts = relative.split(path.sep);
  const outsideRoot = relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative);

  const isExactMetadataPath = EXACT_METADATA_PATHS.some(
    (allowed) => allowed.length === parts.length && allowed.every((part, index) => parts[index] === part),
  );
  const isSessionJson = parts.length === SESSION_DIRECTORY.length + 1
    && SESSION_DIRECTORY.every((part, index) => parts[index] === part)
    && parts.at(-1).endsWith('.json');

  if (outsideRoot || (!isExactMetadataPath && !isSessionJson)) {
    throw new Error('not an allowed DSH metadata path');
  }

  return resolved;
}
