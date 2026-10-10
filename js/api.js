(function (root) {
  'use strict';
  const Core = root.ShijianCore;
  function browserStorage() { try { return root.localStorage; } catch (_) { return null; } }
  async function connect() {
    const storage = browserStorage();
    let shared = false;
    if (/^https?:$/.test(location.protocol) && !location.hostname.endsWith('.github.io') && new URLSearchParams(location.search).get('mode') !== 'local') {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1800);
      try {
        const response = await fetch('./api/session', { signal: controller.signal, cache: 'no-store' });
        shared = response.ok && response.headers.get('X-Shijian-App') === '1' && (await response.json()).app === 'shijian';
      } catch (_) {} finally { clearTimeout(timer); }
    }
    if (!shared) return root.ShijianStorage.createLocalStore({ storage, seed: root.ShijianSeed });
    let user = null;
    async function request(route, { method = 'GET', body } = {}) {
      const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch('./api/' + route, { method, credentials: 'same-origin', cache: 'no-store',
          headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
          body: body !== undefined ? JSON.stringify(body) : undefined, signal: controller.signal });
        const result = await response.json();
        if (!response.ok) throw new Core.DomainError(result.error || '操作失败，请重试。', result.code, response.status);
        return result;
      } catch (error) {
        if (error instanceof Core.DomainError) throw error;
        throw new Core.DomainError('暂时连接不上共享服务。请检查服务是否运行，再重试；本次修改没有确认保存。', 'NETWORK_ERROR', 503);
      } finally { clearTimeout(timer); }
    }
    const draftKey = () => `shijian.campus.draft.shared.${user?.id || 'anonymous'}`;
    return {
      mode: 'shared', persistent: true, notice: '',
      async list() { return (await request('posts')).posts; },
      async profile() { user = (await request('session')).user; return user; },
      async create(input) { return (await request('posts', { method: 'POST', body: input })).post; },
      async update(id, status) { return (await request('posts/' + encodeURIComponent(id), { method: 'PATCH', body: { status } })).post; },
      async login(input) { user = (await request('login', { method: 'POST', body: input })).user; return user; },
      async register(input) { user = (await request('register', { method: 'POST', body: input })).user; return user; },
      async logout() { await request('logout', { method: 'POST', body: {} }); user = null; },
      readDraft() { try { return JSON.parse(storage?.getItem(draftKey()) || 'null'); } catch (_) { return null; } },
      saveDraft(value) { try { storage?.setItem(draftKey(), JSON.stringify(value)); return !!storage; } catch (_) { return false; } },
      clearDraft() { try { storage?.removeItem(draftKey()); } catch (_) {} }
    };
  }
  root.ShijianAPI = { connect };
})(globalThis);
