(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ShijianCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const CATEGORIES = ['证件卡片', '钥匙', '电子产品', '生活用品', '其他'];
  const ZONES = ['图书馆', '教学楼', '食堂', '宿舍区', '运动场', '其他'];
  const KIND_LABELS = { lost: '寻物', found: '招领' };
  class DomainError extends Error {
    constructor(message, code = 'INVALID_INPUT', status = 400) {
      super(message); this.name = 'DomainError'; this.code = code; this.status = status;
    }
  }
  function text(value) { return typeof value === 'string' ? value.trim() : ''; }
  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function statusLabel(post) {
    return post.status === 'resolved' ? (post.kind === 'lost' ? '已找到' : '已归还') : (post.kind === 'lost' ? '寻找中' : '招领中');
  }
  function validPhoto(value) {
    return value === '' || (typeof value === 'string' && value.length <= 360000 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value));
  }
  function validatePost(input, now = Date.now()) {
    const source = input && typeof input === 'object' ? input : {};
    const value = {
      kind: text(source.kind), title: text(source.title), category: text(source.category),
      zone: text(source.zone), place: text(source.place), eventAt: text(source.eventAt),
      description: text(source.description), contact: text(source.contact), photo: text(source.photo)
    };
    const errors = {};
    if (!['lost', 'found'].includes(value.kind)) errors.kind = '请选择寻物或招领。';
    if (value.title.length < 2 || value.title.length > 40) errors.title = '物品名称需要 2—40 个字符，不能只填空格。';
    if (!CATEGORIES.includes(value.category)) errors.category = '请选择有效的物品类别。';
    if (!ZONES.includes(value.zone)) errors.zone = '请选择所在区域。';
    if (value.place.length < 2 || value.place.length > 80) errors.place = '具体地点需要 2—80 个字符。';
    const time = Date.parse(value.eventAt);
    if (!value.eventAt || !Number.isFinite(time)) errors.eventAt = '请填写有效的遗失或拾取时间。';
    else if (time > now + 5 * 60 * 1000) errors.eventAt = '遗失或拾取时间不能在未来。';
    else value.eventAt = new Date(time).toISOString();
    if (value.description.length > 600) errors.description = '补充描述最多 600 个字符。';
    if (value.contact.length < 2 || value.contact.length > 120) errors.contact = '联系方式或领取地点需要 2—120 个字符。';
    if (!validPhoto(value.photo)) errors.photo = '图片仅支持 JPEG、PNG、WebP，压缩后不能超过 260 KB。';
    return { valid: Object.keys(errors).length === 0, errors, value };
  }
  function createPost(input, owner, { now = Date.now(), id = '' } = {}) {
    if (!owner || !text(owner.id)) throw new DomainError('请先选择发布身份。', 'UNAUTHORIZED', 401);
    const result = validatePost(input, now);
    if (!result.valid) throw new DomainError(Object.values(result.errors)[0]);
    if (!text(id)) throw new DomainError('未能生成线索编号，请重试。');
    return { ...result.value, id, ownerId: owner.id, ownerName: text(owner.name) || '校园同学',
      status: 'open', createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString(), demo: false };
  }
  function changeStatus(post, actorId, nextStatus, now = Date.now()) {
    if (!post) throw new DomainError('这条线索不存在或已被移除。', 'NOT_FOUND', 404);
    if (!actorId || post.ownerId !== actorId) throw new DomainError('只有发布者可以修改这条线索。', 'FORBIDDEN', 403);
    if (!['open', 'resolved'].includes(nextStatus)) throw new DomainError('状态参数无效。');
    if (post.status === nextStatus) return { ...post };
    return { ...post, status: nextStatus, updatedAt: new Date(now).toISOString() };
  }
  function searchPosts(posts, filters = {}) {
    const words = text(filters.query).toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const result = (Array.isArray(posts) ? posts : []).filter(post => {
      if (filters.kind && filters.kind !== 'all' && post.kind !== filters.kind) return false;
      if (filters.category && filters.category !== 'all' && post.category !== filters.category) return false;
      if (filters.zone && filters.zone !== 'all' && post.zone !== filters.zone) return false;
      if (filters.status && filters.status !== 'all' && post.status !== filters.status) return false;
      const haystack = [post.title, post.description, post.zone, post.place, post.category].join(' ').toLocaleLowerCase();
      return words.every(word => haystack.includes(word));
    });
    const field = filters.sort === 'event' ? 'eventAt' : 'createdAt';
    return result.sort((a, b) => (Date.parse(b[field]) || 0) - (Date.parse(a[field]) || 0) || String(a.id).localeCompare(String(b.id)));
  }
  function validStoredPost(post) {
    return !!post && typeof post === 'object' && text(post.id) && text(post.ownerId) && text(post.ownerName)
      && ['lost', 'found'].includes(post.kind) && ['open', 'resolved'].includes(post.status)
      && CATEGORIES.includes(post.category) && ZONES.includes(post.zone)
      && typeof post.title === 'string' && post.title.length >= 2 && post.title.length <= 40
      && typeof post.place === 'string' && post.place.length <= 80
      && typeof post.contact === 'string' && post.contact.length <= 120
      && typeof post.description === 'string' && post.description.length <= 600
      && Number.isFinite(Date.parse(post.eventAt)) && Number.isFinite(Date.parse(post.createdAt))
      && Number.isFinite(Date.parse(post.updatedAt)) && validPhoto(post.photo || '');
  }
  function validateAccount(input) {
    const username = text(input?.username).toLowerCase();
    const name = text(input?.name);
    const password = typeof input?.password === 'string' ? input.password : '';
    if (!/^[a-z0-9_]{3,24}$/.test(username)) throw new DomainError('账号需要 3—24 位字母、数字或下划线。');
    if (name.length < 2 || name.length > 20) throw new DomainError('发布署名需要 2—20 个字符。');
    if (password.length < 8 || password.length > 72) throw new DomainError('密码需要 8—72 个字符。');
    return { username, name, password };
  }
  return { CATEGORIES, ZONES, KIND_LABELS, DomainError, text, escapeHTML, statusLabel, validPhoto,
    validatePost, createPost, changeStatus, searchPosts, validStoredPost, validateAccount };
});
