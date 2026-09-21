import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createBridge } from '../src/server.mjs';

const fixtures = path.dirname(fileURLToPath(import.meta.url));
const fixtureRoot = path.join(fixtures, 'fixtures', 'harness');

test('lists only the fields allowed by the bridge contract', async () => {
  const bridge = createBridge({ dataRoot: fixtureRoot });
  const [row] = await bridge.listWorkspaces();

  assert.deepEqual(Object.keys(row).sort(), ['id', 'lastActivityAt', 'name', 'path', 'sessionCount']);
});

test('lists only unarchived sessions in the requested workspace', async () => {
  const bridge = createBridge({ dataRoot: fixtureRoot });
  const result = await bridge.listSessions('CV Training');

  assert.ok(result.sessions.every((row) => row.workspace === 'CV Training'));
  assert.deepEqual(result.sessions.map((row) => row.id), ['active', 'done']);
});

test('omits unavailable session records and reports only their count', async () => {
  const bridge = createBridge({ dataRoot: fixtureRoot });
  const result = await bridge.listSessions('CV Training');

  assert.deepEqual(result.warnings, ['1 malformed or unavailable session record(s) omitted']);
});
