import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateExpenseDraft, findDuplicateNames } from '../src/utils/dongValidation.ts';

const base = { title: '  شام  ', payer: 'علی', amount: 1200.4, participants: ['علی', 'رضا', 'علی'], members: ['علی', 'رضا', 'سارا'] };

test('valid expense is normalised (trim, rounding, dedupe)', () => {
  const v = validateExpenseDraft(base);
  assert.equal(v.title, 'شام');
  assert.equal(v.amount, 1200);
  assert.deepEqual(v.participants, ['علی', 'رضا']);
});

test('zero, negative and NaN amounts are rejected', () => {
  assert.throws(() => validateExpenseDraft({ ...base, amount: 0 }));
  assert.throws(() => validateExpenseDraft({ ...base, amount: -5 }));
  assert.throws(() => validateExpenseDraft({ ...base, amount: Number.NaN }));
});

test('payer must be a group member', () => {
  assert.throws(() => validateExpenseDraft({ ...base, payer: 'ناشناس' }), /عضو این گروه نیست/);
});

test('every participant must be a group member', () => {
  assert.throws(() => validateExpenseDraft({ ...base, participants: ['علی', 'ناشناس'] }), /ناشناس/);
});

test('at least one participant is required', () => {
  assert.throws(() => validateExpenseDraft({ ...base, participants: [] }));
});

test('duplicate member names are detected', () => {
  assert.deepEqual(findDuplicateNames(['علی', 'رضا', 'علی']), ['علی']);
  assert.deepEqual(findDuplicateNames(['علی', 'رضا']), []);
});
