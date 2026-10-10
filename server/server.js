'use strict';
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { scrypt, randomBytes, randomUUID, timingSafeEqual, createHash } = require('node:crypto');
const { promisify } = require('node:util');
const Core = require('../js/core.js');
const { openStore } = require('./store.js');
const derive = promisify(scrypt);
const ROOT = path.resolve(__dirname, '..');
const STATIC = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']], ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/css/style.css', ['css/style.css', 'text/css; charset=utf-8']],
  ...['core', 'seed', 'storage', 'api', 'app'].map(name => [`/js/${name}.js`, [`js/${name}.js`, 'text/javascript; charset=utf-8']])
]);
const SESSION_LIFE = 7 * 24 * 60 * 60 * 1000;
function publicUser(user) { return user ? { id: user.id, name: user.name, username: user.username } : null; }
function digest(value) { return createHash('sha256').update(value).digest('hex'); }

async function createApp({ dataDir = path.join(ROOT, 'data') } = {}) {
  const store = await openStore(dataDir);
  const sessions = new Map();
  const attempts = new Map();
  function failIfLimited(ip) {
    const entry = attempts.get(ip);
    if (entry && entry.until > Date.now() && entry.count >= 8) throw new Core.DomainError('登录尝试过多，请十分钟后再试。', 'RATE_LIMITED', 429);
    if (entry && entry.until <= Date.now()) attempts.delete(ip);
  }
  function failed(ip) {
    const entry = attempts.get(ip) || { count: 0, until: Date.now() + 10 * 60 * 1000 };
    entry.count++; attempts.set(ip, entry);
  }
  function sessionUser(req) {
    const value = (req.headers.cookie || '').match(/(?:^|;\s*)sj_session=([a-f0-9]{64})(?:;|$)/)?.[1];
    const entry = value && sessions.get(digest(value));
    if (!entry || entry.expires <= Date.now()) { if (value) sessions.delete(digest(value)); return null; }
    return store.read().users.find(user => user.id === entry.userId) || null;
  }
  function cookie(req, token, expiry) {
    return `sj_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${expiry}${req.socket.encrypted ? '; Secure' : ''}`;
  }
  function signIn(req, res, user) {
    for (const [key, entry] of sessions) if (entry.expires <= Date.now()) sessions.delete(key);
    if (sessions.size >= 1000) throw new Core.DomainError('服务繁忙，请稍后登录。', 'SERVICE_BUSY', 503);
    const token = randomBytes(32).toString('hex');
    sessions.set(digest(token), { userId: user.id, expires: Date.now() + SESSION_LIFE });
    res.setHeader('Set-Cookie', cookie(req, token, SESSION_LIFE / 1000));
  }
  async function readBody(req) {
    if (!(req.headers['content-type'] || '').startsWith('application/json')) throw new Core.DomainError('请求需要使用 JSON 格式。', 'UNSUPPORTED_MEDIA', 415);
    let size = 0; const chunks = [];
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 512 * 1024) throw new Core.DomainError('提交内容过大，请缩小图片。', 'BODY_TOO_LARGE', 413);
      chunks.push(chunk);
    }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch (_) { throw new Core.DomainError('JSON 内容无效。'); }
  }
  function send(res, status, body) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Shijian-App': '1' });
    res.end(JSON.stringify(body));
  }
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: blob:; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const route = decodeURIComponent(url.pathname);
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        const origin = req.headers.origin;
        const expected = `${req.socket.encrypted ? 'https' : 'http'}://${req.headers.host}`;
        if (origin && origin !== expected) throw new Core.DomainError('不接受来自其他网站的修改请求。', 'ORIGIN_REJECTED', 403);
      }
      if (!route.startsWith('/api/')) {
        const target = STATIC.get(route);
        if (!target || !['GET', 'HEAD'].includes(req.method)) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('页面不存在'); return; }
        const bytes = await fs.readFile(path.join(ROOT, target[0]));
        res.writeHead(200, { 'Content-Type': target[1], 'Cache-Control': 'no-cache' });
        res.end(req.method === 'HEAD' ? undefined : bytes); return;
      }
      const user = sessionUser(req);
      if (route === '/api/session' && req.method === 'GET') { send(res, 200, { app: 'shijian', user: publicUser(user), mode: 'shared' }); return; }
      if (route === '/api/posts' && req.method === 'GET') { send(res, 200, { posts: store.read().posts }); return; }
      if (route === '/api/register' && req.method === 'POST') {
        failIfLimited(req.socket.remoteAddress);
        const account = Core.validateAccount(await readBody(req));
        const salt = randomBytes(16).toString('hex');
        const hash = (await derive(account.password, salt, 64)).toString('hex');
        const registered = await store.transaction(db => {
          if (db.users.some(u => u.username === account.username)) throw new Core.DomainError('这个账号已被使用，请换一个。', 'ACCOUNT_EXISTS', 409);
          if (db.users.length >= 2000) throw new Core.DomainError('账号数量达到本教学服务上限。', 'LIMIT_REACHED', 503);
          const created = { id: randomUUID(), username: account.username, name: account.name, salt, hash };
          db.users.push(created); return created;
        });
        signIn(req, res, registered); send(res, 201, { user: publicUser(registered) }); return;
      }
      if (route === '/api/login' && req.method === 'POST') {
        const ip = req.socket.remoteAddress; failIfLimited(ip);
        const input = await readBody(req);
        const username = Core.text(input?.username).toLowerCase();
        const password = typeof input?.password === 'string' ? input.password : '';
        if (password.length > 72) throw new Core.DomainError('账号或密码不正确。', 'BAD_CREDENTIALS', 401);
        const found = store.read().users.find(u => u.username === username);
        const computed = await derive(password, found?.salt || '00000000000000000000000000000000', 64);
        if (!found || !timingSafeEqual(Buffer.from(found.hash, 'hex'), computed)) {
          failed(ip); throw new Core.DomainError('账号或密码不正确。', 'BAD_CREDENTIALS', 401);
        }
        attempts.delete(ip); signIn(req, res, found); send(res, 200, { user: publicUser(found) }); return;
      }
      if (route === '/api/logout' && req.method === 'POST') {
        await readBody(req);
        const token = (req.headers.cookie || '').match(/(?:^|;\s*)sj_session=([a-f0-9]{64})(?:;|$)/)?.[1];
        if (token) sessions.delete(digest(token));
        res.setHeader('Set-Cookie', cookie(req, '', 0)); send(res, 200, { user: null }); return;
      }
      if (route === '/api/posts' && req.method === 'POST') {
        if (!user) throw new Core.DomainError('请登录后发布线索。', 'UNAUTHORIZED', 401);
        const input = await readBody(req);
        const post = Core.createPost(input, publicUser(user), { id: randomUUID() });
        await store.transaction(db => {
          if (db.posts.length >= 5000) throw new Core.DomainError('线索数量达到本教学服务上限。', 'LIMIT_REACHED', 503);
          db.posts.unshift(post);
        });
        send(res, 201, { post }); return;
      }
      const match = route.match(/^\/api\/posts\/([A-Za-z0-9_-]{1,100})$/);
      if (match && req.method === 'PATCH') {
        if (!user) throw new Core.DomainError('请登录后更新自己的线索。', 'UNAUTHORIZED', 401);
        const input = await readBody(req);
        const post = await store.transaction(db => {
          const index = db.posts.findIndex(p => p.id === match[1]);
          const changed = Core.changeStatus(db.posts[index], user.id, input?.status);
          db.posts[index] = changed; return changed;
        });
        send(res, 200, { post }); return;
      }
      throw new Core.DomainError('接口不存在。', 'NOT_FOUND', 404);
    } catch (error) {
      if (res.headersSent) { res.end(); return; }
      const known = error instanceof Core.DomainError;
      if (!known) console.error('[shijian] 请求失败:', error.code || error.name);
      send(res, known ? error.status : 500, { error: known ? error.message : '服务暂时无法保存，请稍后重试。', code: known ? error.code : 'SERVER_ERROR' });
    }
  });
  return { server, store };
}
if (require.main === module) {
  createApp({ dataDir: process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : undefined }).then(({ server }) => {
    const port = Number(process.env.PORT) || 8787;
    const host = process.env.HOST || '127.0.0.1';
    server.listen(port, host, () => console.log(`拾见校园共享服务已启动\nLocal: http://127.0.0.1:${port}\n数据保存在 data/shijian.json；按 Ctrl+C 停止。`));
    server.on('error', error => { console.error('启动失败:', error.message); process.exitCode = 1; });
  }).catch(error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { createApp };
