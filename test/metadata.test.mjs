import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { readJsonOnce, readJsonWithRetry } from '../src/metadata.mjs';

const fixtures = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name) => path.join(fixtures, 'fixtures', name);

test('reads valid JSON metadata once', async () => {
  const workspace = await readJsonOnce(fixture('workspace.json'));

  assert.equal(workspace.tables.workspaces.cvtrain.title, 'CV Training');
});

test('returns a safe updating error after two invalid reads', async () => {
  await assert.rejects(
    () => readJsonWithRetry(fixture('invalid-session.json')),
    /DSH is updating; retry shortly/,
  );
});
