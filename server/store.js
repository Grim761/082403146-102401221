'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const Core = require('../js/core.js');
const seed = require('../js/seed.js');

async function openStore(directory) {
  await fs.mkdir(directory, { recursive: true });
  const filename = path.join(directory, 'shijian.json');
  let db;
  try { db = JSON.parse(await fs.readFile(filename, 'utf8')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw new Error('数据文件无法读取。请保留原文件，检查备份后再启动。');
    db = { version: 1, users: [], posts: JSON.parse(JSON.stringify(seed)) };
  }
  if (db.version !== 1 || !Array.isArray(db.users) || !Array.isArray(db.posts) || !db.posts.every(Core.validStoredPost)
    || !db.users.every(u => u && typeof u.id === 'string' && typeof u.username === 'string' && typeof u.name === 'string'
      && /^[a-f0-9]{32}$/.test(u.salt) && /^[a-f0-9]{128}$/.test(u.hash))) {
    throw new Error('数据文件结构不合法。原文件未覆盖，请检查后再启动。');
  }
  async function write(next) {
    const temporary = filename + '.' + randomUUID() + '.tmp';
    try { await fs.writeFile(temporary, JSON.stringify(next, null, 2), { mode: 0o600 }); await fs.rename(temporary, filename); }
    catch (error) { await fs.unlink(temporary).catch(() => {}); throw error; }
  }
  await write(db);
  let queue = Promise.resolve();
  function transaction(action) {
    const task = queue.then(async () => {
      const next = JSON.parse(JSON.stringify(db));
      const result = await action(next);
      await write(next); db = next; return result;
    });
    queue = task.catch(() => {});
    return task;
  }
  return { read: () => JSON.parse(JSON.stringify(db)), transaction, filename };
}
module.exports = { openStore };
