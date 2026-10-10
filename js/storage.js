(function (root, factory) {
  const core = typeof module === 'object' && module.exports ? require('./core.js') : root.ShijianCore;
  const api = factory(core);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ShijianStorage = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Core) {
  'use strict';
  const KEY = 'shijian.campus.v1';
  const DRAFT_KEY = 'shijian.campus.draft.v1';
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function makeId() {
    return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }
  function createLocalStore({ storage, seed = [], idFactory = makeId, clock = Date.now } = {}) {
    let state = { version: 1, owner: { id: idFactory(), name: '本机发布者' }, posts: copy(seed) };
    let persistent = !!storage;
    let notice = '';
    let recoveryOriginalRaw = null;
    try {
      const raw = storage?.getItem(KEY);
      if (raw) {
        recoveryOriginalRaw = raw;
        const saved = JSON.parse(raw);
        if (saved.version !== 1 || !saved.owner?.id || typeof saved.owner.name !== 'string'
          || !Array.isArray(saved.posts) || saved.posts.length > 500 || !saved.posts.every(Core.validStoredPost)) {
          throw new Error('INVALID_STORE');
        }
        state = saved;
        recoveryOriginalRaw = null;
      } else if (storage) storage.setItem(KEY, JSON.stringify(state));
    } catch (error) {
      persistent = false;
      notice = error.message === 'INVALID_STORE' || error instanceof SyntaxError
        ? '本机记录无法读取，原数据没有覆盖。当前使用临时数据，请先导出备份或检查浏览器存储。'
        : '浏览器暂不允许保存记录，当前内容关闭页面后会丢失。可先导出备份。';
    }
    if (!storage) notice = '浏览器暂不允许保存记录，当前内容关闭页面后会丢失。可先导出备份。';
    function commit(next) {
      if (persistent) {
        try { storage.setItem(KEY, JSON.stringify(next)); }
        catch (_) { throw new Core.DomainError('本机存储空间不足，信息尚未保存。请缩小图片或导出旧记录。', 'STORAGE_FULL', 507); }
      }
      state = next;
    }
    return {
      mode: 'local',
      get persistent() { return persistent; },
      get notice() { return notice; },
      async list() { return copy(state.posts); },
      async profile() { return copy(state.owner); },
      async setName(name) {
        name = Core.text(name);
        if (name.length < 2 || name.length > 20) throw new Core.DomainError('发布署名需要 2—20 个字符。');
        commit({ ...copy(state), owner: { ...state.owner, name } });
        return copy(state.owner);
      },
      async create(input) {
        if (state.posts.length >= 500) throw new Core.DomainError('本机最多保存 500 条记录，请先整理旧数据。');
        const post = Core.createPost(input, state.owner, { now: clock(), id: idFactory() });
        commit({ ...copy(state), posts: [post, ...copy(state.posts)] });
        return copy(post);
      },
      async update(id, status) {
        const post = state.posts.find(item => item.id === id);
        const nextPost = Core.changeStatus(post, state.owner.id, status, clock());
        commit({ ...copy(state), posts: state.posts.map(item => item.id === id ? nextPost : copy(item)) });
        return copy(nextPost);
      },
      exportData() { return JSON.stringify({ ...copy(state), exportedAt: new Date(clock()).toISOString(),
        ...(recoveryOriginalRaw !== null ? { recoveryOriginalRaw } : {}) }, null, 2); },
      readDraft() {
        try { const value = JSON.parse(storage?.getItem(DRAFT_KEY) || 'null'); return value && typeof value === 'object' ? value : null; }
        catch (_) { return null; }
      },
      saveDraft(value) { try { storage?.setItem(DRAFT_KEY, JSON.stringify(value)); return !!storage; } catch (_) { return false; } },
      clearDraft() { try { storage?.removeItem(DRAFT_KEY); } catch (_) {} }
    };
  }
  return { KEY, DRAFT_KEY, createLocalStore, makeId };
});
