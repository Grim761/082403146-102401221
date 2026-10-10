'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLocalStore, KEY } = require('../js/storage.js');
const seed = require('../js/seed.js');
const input = { kind: 'found', title: '蓝色钥匙', category: '钥匙', zone: '食堂', place: '第一食堂',
  eventAt: '2026-10-09T09:00:00Z', description: '', contact: '第一食堂值班室', photo: '' };
function memory() { const values = new Map(); return { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v), removeItem: k => values.delete(k) }; }
function setup(storage = memory()) { let serial = 0; return { storage, store: createLocalStore({ storage, seed, idFactory: () => 'id-' + ++serial, clock: () => Date.parse('2026-10-10T06:00:00Z') }) }; }

test('发布后重建存储对象：数据与发布者身份仍保留', async () => {
  const { storage, store } = setup(); const post = await store.create(input);
  const reopened = createLocalStore({ storage, seed });
  assert.ok((await reopened.list()).some(x => x.id === post.id));
  assert.deepEqual(await reopened.profile(), await store.profile());
});
test('状态更新后重载：完成状态仍然存在', async () => {
  const { storage, store } = setup(); const post = await store.create(input); await store.update(post.id, 'resolved');
  assert.equal((await createLocalStore({ storage }).list()).find(x => x.id === post.id).status, 'resolved');
});
test('其他发布者的数据：本机不能更改演示记录', async () => {
  const { store } = setup(); await assert.rejects(store.update('sample-001', 'resolved'), e => e.status === 403);
});
test('存储配额不足：发布失败时列表保持不变', async () => {
  const { storage, store } = setup(); const before = await store.list();
  storage.setItem = () => { throw new Error('QuotaExceededError'); };
  await assert.rejects(store.create(input), e => e.code === 'STORAGE_FULL');
  assert.deepEqual(await store.list(), before);
});
test('损坏记录：保留原始内容，给出临时模式提示', async () => {
  const storage = memory(); storage.setItem(KEY, '{broken'); const { store } = setup(storage);
  assert.equal(store.persistent, false); assert.equal(storage.getItem(KEY), '{broken');
  assert.ok(store.notice.includes('原数据没有覆盖')); assert.equal((await store.list()).length, seed.length);
});
test('浏览器禁用存储：仍可运行，并明确临时模式', async () => {
  const { store } = setup({ getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('SecurityError'); } });
  assert.equal(store.persistent, false); const post = await store.create(input); assert.ok(post.id);
  assert.ok(store.notice.includes('关闭页面后会丢失'));
});
test('列表副本：调用者修改返回值不会污染存储', async () => {
  const { store } = setup(); const posts = await store.list(); posts[0].title = '污染';
  assert.notEqual((await store.list())[0].title, '污染');
});
test('发布草稿：保存、读取、清除独立于已发布数据', async () => {
  const { store } = setup(); assert.equal(store.saveDraft({ title: '未提交的线索' }), true);
  assert.equal(store.readDraft().title, '未提交的线索'); store.clearDraft();
  assert.equal(store.readDraft(), null); assert.equal((await store.list()).length, seed.length);
});
test('导出备份：包含版本和原数据，不丢失Unicode', async () => {
  const { store } = setup(); const backup = JSON.parse(store.exportData());
  assert.equal(backup.version, 1); assert.deepEqual(backup.posts, await store.list()); assert.ok(backup.exportedAt);
});
