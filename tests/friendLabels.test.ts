import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildGroupMemberLabels } from '../src/utils/friendLabels.ts';

test('owner comes first and friends use display names', () => {
  const labels = buildGroupMemberLabels([
    { username: 'ali_88', display_name: 'علی' },
    { username: 'reza', display_name: 'رضا' },
  ]);
  assert.deepEqual(labels, ['من', 'علی', 'رضا']);
});

test('duplicate display names fall back to usernames', () => {
  const labels = buildGroupMemberLabels([
    { username: 'ali_1', display_name: 'علی' },
    { username: 'ali_2', display_name: 'علی' },
  ]);
  assert.deepEqual(labels, ['من', '@ali_1', '@ali_2']);
  assert.equal(new Set(labels).size, labels.length);
});

test('a friend named like the owner label is disambiguated', () => {
  const labels = buildGroupMemberLabels([{ username: 'man_x', display_name: 'من' }]);
  assert.deepEqual(labels, ['من', '@man_x']);
});

test('missing display name uses the username', () => {
  const labels = buildGroupMemberLabels([{ username: 'sara', display_name: null }]);
  assert.deepEqual(labels, ['من', '@sara']);
});
