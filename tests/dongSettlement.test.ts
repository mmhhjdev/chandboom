import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeSettlement } from '../src/utils/dongSettlement.ts';
import { parseMoneyInput, formatMoneyInput } from '../src/utils/money.ts';

const sumBalances = (b: Record<string, number>) => Object.values(b).reduce((s, v) => s + v, 0);

test('payer share is deducted from their own credit', () => {
  // A پرداخت ۳۰۰ برای A,B,C → B و C هرکدام ۱۰۰ بدهکارند
  const r = computeSettlement({
    members: ['A', 'B', 'C'],
    expenses: [{ payer: 'A', amount: 300, participants: ['A', 'B', 'C'] }],
  });
  assert.equal(r.balances.A, 200);
  assert.equal(r.balances.B, -100);
  assert.equal(r.balances.C, -100);
  assert.equal(sumBalances(r.balances), 0);
  assert.equal(r.issues.length, 0);
  assert.equal(r.transfers.reduce((s, t) => s + t.amount, 0), 200);
});

test('rounding never loses toman: 100 split three ways', () => {
  const r = computeSettlement({
    members: ['A', 'B', 'C'],
    expenses: [{ payer: 'A', amount: 100, participants: ['A', 'B', 'C'] }],
  });
  assert.equal(sumBalances(r.balances), 0);
  // A سهم ۳۴ دارد (خودش پرداخت‌کننده و مصرف‌کننده است)، B و C هرکدام ۳۳
  assert.equal(r.balances.A, 66);
  assert.equal(r.balances.B, -33);
  assert.equal(r.balances.C, -33);
});

test('unknown participant is reported, not silently dropped', () => {
  const r = computeSettlement({
    members: ['A', 'B'],
    expenses: [{ payer: 'A', amount: 200, participants: ['A', 'B', 'Ghost'] }],
  });
  assert.equal(sumBalances(r.balances), 0);
  assert.ok(r.issues.some((m) => m.includes('Ghost')));
  // سهم Ghost میان معتبرها تقسیم می‌شود و هیچ پولی گم نمی‌شود
  assert.equal(r.balances.A + r.balances.B, 0);
});

test('unknown payer makes the expense ignored and reported', () => {
  const r = computeSettlement({
    members: ['A', 'B'],
    expenses: [{ payer: 'Zed', amount: 500, participants: ['A', 'B'] }],
  });
  assert.equal(r.balances.A, 0);
  assert.equal(r.balances.B, 0);
  assert.equal(r.issues.length, 1);
});

test('itemized bill: each item split only among its consumers', () => {
  // غذای A: ۱۰۰۰ | نوشیدنی A,B: ۶۰۰ | پرداخت‌کننده B
  const r = computeSettlement({
    members: ['A', 'B'],
    expenses: [{
      payer: 'B',
      amount: 1600,
      participants: ['A', 'B'],
      isItemized: true,
      billItems: [
        { price: 1000, consumers: ['A'] },
        { price: 600, consumers: ['A', 'B'] },
      ],
    }],
  });
  // A سهم ۱۳۰۰ دارد، B سهم ۳۰۰ دارد و ۱۶۰۰ پرداخت کرده → بستانکار ۱۳۰۰
  assert.equal(r.balances.A, -1300);
  assert.equal(r.balances.B, 1300);
  assert.deepEqual(r.transfers, [{ from: 'A', to: 'B', amount: 1300 }]);
  assert.equal(r.issues.length, 0);
});

test('family mode weights by family size', () => {
  // خانواده ۲ نفره پرداخت ۳۰۰ برای دو خانواده (۲ و ۱ نفر) → سهم ۲۰۰ و ۱۰۰
  const r = computeSettlement({
    isFamilyMode: true,
    members: [],
    families: [{ name: 'F1', count: 2 }, { name: 'F2', count: 1 }],
    expenses: [{ payer: 'F1', amount: 300, participants: ['F1', 'F2'] }],
  });
  assert.equal(r.balances.F1, 100);
  assert.equal(r.balances.F2, -100);
  assert.deepEqual(r.transfers, [{ from: 'F2', to: 'F1', amount: 100 }]);
});

test('persian and arabic digits are accepted in amounts', () => {
  assert.equal(parseMoneyInput('۱۲,۳۴۰'), 12340);
  assert.equal(parseMoneyInput('١٢٬٣٤٠'), 12340);
  assert.ok(Number.isNaN(parseMoneyInput('abc')));
  assert.equal(formatMoneyInput('۱۲۳۴۵'), '12,345');
});

test('rows with missing participants / consumers / bill items do not crash rendering', () => {
  // Regression: "Cannot read properties of undefined (reading 'map')" from older or partial DB rows.
  const r = computeSettlement({
    members: ['A', 'B'],
    expenses: [
      { payer: 'A', amount: 100 } as any,
      { payer: 'A', amount: 100, participants: ['A', 'B'], isItemized: true, billItems: [{ price: 100 } as any] },
      { payer: 'A', amount: 100, participants: ['A', 'B'], isItemized: true, billItems: null } as any,
    ],
    families: null,
    isFamilyMode: false,
  });
  assert.ok(Array.isArray(r.transfers));
  assert.equal(sumBalances(r.balances), 0);
});

test('null members and expenses are treated as empty', () => {
  const r = computeSettlement({ members: null as any, expenses: null as any });
  assert.deepEqual(r.transfers, []);
  assert.deepEqual(r.balances, {});
});
