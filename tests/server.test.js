'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { createApp } = require('../server/server.js');
let app, directory, base, cookieA, cookieB, postedId;
async function request(route, method = 'GET', body, cookie = '', origin) {
  const response = await fetch(base + route, { method, headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...(origin ? { Origin: origin } : {}) }, body: body !== undefined ? JSON.stringify(body) : undefined });
  const json = response.headers.get('content-type')?.includes('application/json') ? await response.json() : null;
  return { status: response.status, json, cookie: response.headers.get('set-cookie')?.split(';')[0], headers: response.headers };
}
const account = { username: 'student_a', name: '测试同学甲', password: 'password-for-test-1' };
before(async () => {
  directory = await fs.mkdtemp(path.join(os.tmpdir(), 'shijian-test-'));
  app = await createApp({ dataDir: directory }); await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
  base = 'http://127.0.0.1:' + app.server.address().port;
});
after(async () => {
  await new Promise(resolve => app.server.close(resolve));
  if (path.resolve(directory).startsWith(path.resolve(os.tmpdir()) + path.sep + 'shijian-test-')) await fs.rm(directory, { recursive: true, force: true });
});
test('API模式发现：提供明确标记，不暴露敏感数据', async () => {
  const r = await request('/api/session'); assert.equal(r.json.app, 'shijian'); assert.equal(r.json.user, null);
});
test('未登录发布：返回401', async () => assert.equal((await request('/api/posts', 'POST', {})).status, 401));
test('注册：设置HttpOnly会话，响应与磁盘均不含明文密码', async () => {
  const r = await request('/api/register', 'POST', account); cookieA = r.cookie;
  assert.equal(r.status, 201); assert.ok(r.headers.get('set-cookie').includes('HttpOnly')); assert.ok(cookieA);
  assert.equal(r.json.user.hash, undefined); assert.equal(r.json.user.password, undefined);
  assert.equal((await fs.readFile(app.store.filename, 'utf8')).includes(account.password), false);
});
test('重复注册：返回409', async () => assert.equal((await request('/api/register', 'POST', account)).status, 409));
test('登录失败和成功：检查密码并恢复本人会话', async () => {
  assert.equal((await request('/api/login', 'POST', { ...account, password: 'wrong' })).status, 401);
  const r = await request('/api/login', 'POST', account); assert.equal(r.status, 200); cookieA = r.cookie;
  assert.equal((await request('/api/session', 'GET', undefined, cookieA)).json.user.username, 'student_a');
});
test('有效发布：保存到共享列表，新浏览者能看见', async () => {
  const r = await request('/api/posts', 'POST', { kind: 'found', title: '测试蓝色雨伞', category: '生活用品', zone: '图书馆', place: '一楼服务台', eventAt: '2026-10-09T01:00:00Z', description: '', contact: '服务台核对领取', photo: '' }, cookieA);
  assert.equal(r.status, 201); postedId = r.json.post.id;
  assert.ok((await request('/api/posts')).json.posts.some(p => p.id === postedId));
});
test('绕过页面直接提交无效信息：服务端仍执行字段校验', async () => {
  assert.equal((await request('/api/posts', 'POST', { title: ' ' }, cookieA)).status, 400);
});
test('另一账号：不能更新发布者的线索', async () => {
  const r = await request('/api/register', 'POST', { username: 'student_b', name: '测试同学乙', password: 'password-for-test-2' }); cookieB = r.cookie;
  assert.equal((await request('/api/posts/' + postedId, 'PATCH', { status: 'resolved' }, cookieB)).status, 403);
});
test('本人状态更新：公共列表及磁盘记录同步改变', async () => {
  assert.equal((await request('/api/posts/' + postedId, 'PATCH', { status: 'resolved' }, cookieA)).status, 200);
  assert.equal((await request('/api/posts')).json.posts.find(p => p.id === postedId).status, 'resolved');
  assert.equal(JSON.parse(await fs.readFile(app.store.filename, 'utf8')).posts.find(p => p.id === postedId).status, 'resolved');
});
test('跨站修改：拒绝其他Origin', async () => assert.equal((await request('/api/posts/' + postedId, 'PATCH', { status: 'open' }, cookieA, 'https://outside.invalid')).status, 403));
test('不存在的线索：返回404而不是默认展示另一条记录', async () => assert.equal((await request('/api/posts/missing', 'PATCH', { status: 'open' }, cookieA)).status, 404));
test('运行数据与源码目录：不可通过静态路由下载', async () => {
  assert.equal((await request('/data/shijian.json')).status, 404); assert.equal((await request('/server/server.js')).status, 404);
});
test('退出：旧会话立即失效', async () => {
  assert.equal((await request('/api/logout', 'POST', {}, cookieB)).status, 200);
  assert.equal((await request('/api/session', 'GET', undefined, cookieB)).json.user, null);
});
test('并发事务：两个独立修改都保存，不发生覆盖', async () => {
  await Promise.all([app.store.transaction(db => { db.posts[0].description = '并发修改一'; }), app.store.transaction(db => { db.posts[1].description = '并发修改二'; })]);
  const db = app.store.read(); assert.equal(db.posts[0].description, '并发修改一'); assert.equal(db.posts[1].description, '并发修改二');
});
