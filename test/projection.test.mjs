import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveState, projectSessions, projectWorkspaces } from '../src/projection.mjs';

test('excludes archived sessions and maps a clean session to completed', () => {
  const rows = [{
    id: 'done',
    rows: { title: { val: 'Import preset' }, turnBoundary: { val: { openTurnStartSeq: null, lastStepBoundary: { kind: 'end' } } } },
  }, {
    id: 'archived',
    rows: { title: { val: 'Hidden' } },
  }];

  assert.deepEqual(projectSessions('CV Training', rows, new Set(['archived'])), [{
    id: 'done', workspace: 'CV Training', title: 'Import preset', state: 'completed', lastActivityAt: null,
  }]);
});

test('prioritizes active work over a stale completion boundary', () => {
  assert.equal(deriveState({ rows: { turnBoundary: { val: { openTurnStartSeq: 7, lastStepBoundary: { kind: 'end' } } } } }), 'in_progress');
});

test('projects only allowed workspace summary fields', () => {
  const result = projectWorkspaces({ tables: { workspaces: {
    cvtrain: { title: 'CV Training', path: 'E:/projects/cvtrain', sessionIds: ['active', 'done'] },
  } } });

  assert.deepEqual(result, [{
    id: 'cvtrain', name: 'CV Training', path: 'E:/projects/cvtrain', sessionCount: 2, lastActivityAt: null,
  }]);
});
