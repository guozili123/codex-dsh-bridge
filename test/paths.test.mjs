import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { assertAllowedMetadataPath, resolveDshPaths } from '../src/paths.mjs';

test('resolves metadata indexes below the configured DSH root', () => {
  const paths = resolveDshPaths({ appDataDir: 'C:/Users/test/AppData/Roaming' });

  assert.equal(paths.dataRoot, path.join('C:/Users/test/AppData/Roaming', 'dsh-desktop', 'harness'));
  assert.match(paths.workspaceIndex, /storages[\\/]workspace\.json$/);
});

test('rejects credential and token paths', () => {
  assert.throws(
    () => assertAllowedMetadataPath('C:/dsh/harness', 'C:/dsh/harness/.credentials.yaml'),
    /not an allowed DSH metadata path/,
  );
});

test('allows only session JSON files below the session metadata directory', () => {
  assert.equal(
    assertAllowedMetadataPath(
      'C:/dsh/harness',
      'C:/dsh/harness/storages/session_projcache/sessions/session-1.json',
    ),
    'C:\\dsh\\harness\\storages\\session_projcache\\sessions\\session-1.json',
  );
});
