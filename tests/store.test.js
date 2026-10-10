'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { openStore } = require('../server/store.js');

async function temporaryDirectory(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'shijian-store-test-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return directory;
}

test('损坏的数据文件使启动失败，原始内容不被覆盖', async t => {
  const directory = await temporaryDirectory(t);
  const filename = path.join(directory, 'shijian.json');
  const original = Buffer.from('{broken JSON\n', 'utf8');
  await fs.writeFile(filename, original);

  await assert.rejects(openStore(directory), /数据文件无法读取/);
  assert.deepEqual(await fs.readFile(filename), original);
  assert.deepEqual(await fs.readdir(directory), ['shijian.json']);
});

test('事务失败不改变内存或磁盘，后续事务仍能保存', async t => {
  const directory = await temporaryDirectory(t);
  const store = await openStore(directory);
  const beforeMemory = store.read();
  const beforeDisk = await fs.readFile(store.filename, 'utf8');

  await assert.rejects(store.transaction(async db => {
    db.posts[0].status = 'resolved';
    await Promise.resolve();
    throw new Error('模拟事务失败');
  }), /模拟事务失败/);

  assert.deepEqual(store.read(), beforeMemory);
  assert.equal(await fs.readFile(store.filename, 'utf8'), beforeDisk);

  await store.transaction(db => {
    db.posts[0].status = 'resolved';
    db.posts[0].updatedAt = new Date().toISOString();
  });
  assert.equal(store.read().posts[0].status, 'resolved');
  assert.equal(JSON.parse(await fs.readFile(store.filename, 'utf8')).posts[0].status, 'resolved');
  assert.equal((await openStore(directory)).read().posts[0].status, 'resolved');
});
