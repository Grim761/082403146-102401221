(function () {
  'use strict';
  const C = window.ShijianCore;
  const e = C.escapeHTML;
  const main = document.getElementById('main-content');
  const modal = document.getElementById('modal');
  const toastBox = document.getElementById('toast');
  const illustrations = window.ShijianIllustrations;
  const state = {
    api: null, user: null, posts: [], filters: { query: '', kind: 'all', category: 'all', zone: 'all', status: 'open', sort: 'created' },
    mineStatus: 'all', routeVersion: 0, publishing: false, photoLoading: false, photoVersion: 0, photo: '', authMode: 'login', pendingPublish: false, skipDraftSave: false
  };
  let toastTimer, draftTimer, confirmAction;
  const dateFormat = new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
  function date(value) { const d = new Date(value); return Number.isFinite(d.getTime()) ? dateFormat.format(d) : '时间待补充'; }
  function localTime(value = Date.now()) {
    const d = new Date(value); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
  function toast(message, error = false) {
    clearTimeout(toastTimer); toastBox.textContent = message; toastBox.classList.toggle('error', error); toastBox.hidden = false;
    toastTimer = setTimeout(() => { toastBox.hidden = true; }, error ? 6500 : 3800);
  }
  function go(hash) { if (location.hash === hash) void route(); else location.hash = hash; }
  function empty(title, copy, action = '') {
    return `<div class="empty-state"><span class="empty-symbol">拾</span><h3>${e(title)}</h3><p>${e(copy)}</p>${action}</div>`;
  }
  function options(values, selected, allLabel) {
    return `${allLabel ? `<option value="all">${e(allLabel)}</option>` : ''}${values.map(v => `<option value="${e(v)}"${v === selected ? ' selected' : ''}>${e(v)}</option>`).join('')}`;
  }
  function card(post, preview = false) {
    const picture = post.photo && C.validPhoto(post.photo)
      ? `<img class="card-thumb" src="${e(post.photo)}" alt="${e(post.title)}的图片">`
      : illustrations.render(post);
    const serial = post.id === 'preview' ? '待发布' : String(post.id).replace(/[^a-z0-9]/gi, '').slice(-6).toUpperCase();
    const content = `<div class="card-top"><span class="serial">线索 · ${e(serial)}</span><span class="type-badge">${e(C.statusLabel(post))}</span></div>
      <div class="card-body">${picture}<div><h3 class="clue-title">${e(post.title || '物品名称会出现在这里')}</h3><div class="category-name">${e(post.category || '物品类别')} · ${e(C.KIND_LABELS[post.kind] || '寻物')}</div></div></div>
      <div class="card-facts"><div><b>地点</b><span>${e(post.zone)} · ${e(post.place || '具体地点')}</span></div><div><b>时间</b><span>${e(date(post.eventAt))}</span></div></div>
      <div class="card-foot"><span>${e(post.ownerName || '校园同学')}${post.demo ? '<span class="demo-badge">示例</span>' : ''}</span><span class="card-arrow">${preview ? '发布前预览' : '查看线索 ↗'}</span></div>`;
    const classes = `clue-card ${post.kind} ${post.status === 'resolved' ? 'resolved' : ''}`;
    return preview ? `<div class="${classes}">${content}</div>` : `<a class="${classes}" href="#detail/${encodeURIComponent(post.id)}">${content}</a>`;
  }
  function updateHeader(routeName) {
    document.querySelectorAll('[data-nav]').forEach(link => {
      if (link.dataset.nav === routeName) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    document.getElementById('mode-tag').textContent = state.api.mode === 'shared' ? '共享服务' : state.api.persistent ? '本机保存' : '临时模式';
    document.getElementById('identity-button').textContent = state.user?.name || '登录 / 注册';
    const notice = document.getElementById('storage-notice'); notice.textContent = state.api.notice; notice.hidden = !state.api.notice;
    document.getElementById('export-button').hidden = state.api.mode !== 'local';
  }
  function board() {
    const f = state.filters;
    const posts = C.searchPosts(state.posts, f);
    const count = kind => state.posts.filter(p => p.kind === kind && p.status === 'open').length;
    main.innerHTML = `<section class="hero" aria-labelledby="board-title"><div class="hero-copy"><span class="eyebrow">拾见 · 校园线索墙</span>
      <h1 id="board-title">让失物，<br>有迹<em>可寻。</em></h1><p>记下地点与时间，把一次错过，变成一条有用的线索。</p>
      <form id="search-form" class="hero-search" role="search"><label for="query" class="sr-only">搜索物品、地点或描述</label><input id="query" name="query" maxlength="120" placeholder="试试：图书馆 钥匙" value="${e(f.query)}" type="search"><button type="submit">查找线索</button></form>
      <div class="quick-search"><span>常找物品</span>${['校园卡', '钥匙', '耳机', '雨伞'].map(q => `<button type="button" data-action="quick-search" data-query="${q}">${q}</button>`).join('')}</div></div>
      <aside class="hero-aside"><div><span class="aside-label">此刻，线索墙上</span><div class="stats"><div class="stat"><strong>${count('lost')}</strong><span>正在寻找</span></div><div class="stat"><strong>${count('found')}</strong><span>等待认领</span></div><div class="stat"><strong>${state.posts.filter(p => p.status === 'resolved').length}</strong><span>已有归处</span></div></div></div>
      <p class="hero-note"><strong>先核对特征，再约定领取</strong>${state.api.mode === 'shared' ? '同一服务里的同学可以看到最新线索。' : '当前记录保存在这台设备。换设备后需要重新发布。'}<br>标注“示例”的线索仅供体验。</p></aside></section>
      <section class="board-section" aria-labelledby="results-title"><div class="board-topline"><div class="type-tabs" aria-label="线索类型">${[['all','全部线索'],['lost','我丢东西了'],['found','我捡到东西了']].map(([v,l]) => `<button type="button" data-action="kind-filter" data-kind="${v}" class="${f.kind === v ? 'active' : ''}" aria-pressed="${f.kind === v}">${l}</button>`).join('')}</div><p class="board-caption">按地点缩小范围，会更容易找到。</p></div>
      <div class="filters"><label class="filter-field">类别<select id="category-filter">${options(C.CATEGORIES,f.category,'全部类别')}</select></label><label class="filter-field">区域<select id="zone-filter">${options(C.ZONES,f.zone,'整个校园')}</select></label>
      <label class="filter-field">排序<select id="sort-filter"><option value="created"${f.sort === 'created' ? ' selected' : ''}>最新发布</option><option value="event"${f.sort === 'event' ? ' selected' : ''}>事件时间</option></select></label>
      <label class="check-field"><input type="checkbox" id="completed-filter"${f.status === 'all' ? ' checked' : ''}>包含已完成</label><button class="filter-clear" data-action="clear-filters" type="button">清空条件</button><button class="filter-clear" data-action="refresh" type="button">刷新线索 ↻</button></div>
      <div class="section-heading"><h2 id="results-title">${f.kind === 'lost' ? '寻物线索' : f.kind === 'found' ? '招领线索' : '最近的线索'}${f.query ? `<span class="query-label">${e(f.query)}</span>` : ''}</h2><small aria-live="polite">找到 ${posts.length} 条线索</small></div>
      <div class="clue-grid">${posts.length ? posts.map(p => card(p)).join('') : empty('还没有匹配的线索','换一个关键词，或放宽类别和区域再看看。','<button class="button secondary" data-action="clear-filters" type="button">清空条件</button>')}</div></section>`;
  }
  function detail(id) {
    const post = state.posts.find(p => p.id === id);
    if (!post) { main.innerHTML = `<a class="back-link" href="#board">← 返回线索墙</a>${empty('这条线索暂时找不到','请回到线索墙，刷新后重新查看。')}`; return; }
    const owner = state.user?.id === post.ownerId;
    const done = post.status === 'resolved';
    main.innerHTML = `<a class="back-link" href="#board">← 返回线索墙</a><div class="detail-layout"><article class="detail-main ${post.kind}"><span class="eyebrow">${e(C.KIND_LABELS[post.kind])}线索 · ${e(C.statusLabel(post))}</span>
      <h1>${e(post.title)}</h1><p class="detail-meta">${e(post.ownerName)} 发布于 ${e(date(post.createdAt))}${post.demo ? ' · 示例数据' : ''}</p>
      <div class="detail-art${post.photo && C.validPhoto(post.photo) ? ' has-photo' : ''}">${post.photo && C.validPhoto(post.photo) ? `<img src="${e(post.photo)}" alt="${e(post.title)}的图片">` : `${illustrations.render(post)}<span class="illustration-caption">物品示意图 · 请核对文字描述</span>`}</div>
      <div class="detail-description"><h3>线索描述</h3><p>${e(post.description || '发布者没有补充描述。联系时可以先核对物品特征。')}</p></div>${post.demo ? '<p class="privacy-note">这是一条体验用的示例，请勿按示例信息寻找真实物品。</p>' : ''}</article>
      <aside class="detail-side"><section class="panel"><h2>先核对这些信息</h2><dl class="facts"><div><dt>物品类别</dt><dd>${e(post.category)}</dd></div><div><dt>发生时间</dt><dd>${e(date(post.eventAt))}</dd></div><div><dt>所在区域</dt><dd>${e(post.zone)}</dd></div><div><dt>具体地点</dt><dd>${e(post.place)}</dd></div><div><dt>当前状态</dt><dd>${e(C.statusLabel(post))}</dd></div></dl></section>
      <section class="panel"><h2>${done ? '这条线索已有归处' : '联系与领取'}</h2>${done ? `<p class="privacy-note resolved-note">发布者已标记“${e(C.statusLabel(post))}”。为减少后续打扰，本页收起了联系方式。</p><p class="modal-copy">状态更新于 ${e(date(post.updatedAt))}</p>` : `<p class="contact-text" id="contact-text">${e(post.contact)}</p><button class="button wide" type="button" data-action="copy-contact" data-id="${e(post.id)}">复制联系方式 / 领取信息</button><p class="privacy-note">请核对独有特征后领取。身份证号、银行卡号等敏感信息不宜写在公开描述中。</p>`}
      ${owner ? `<div class="owner-actions"><span class="modal-copy">你是这条线索的发布者，可以更新处理结果。</span><button class="button ${done ? 'secondary' : 'rust'} wide" type="button" data-action="status" data-id="${e(post.id)}" data-status="${done ? 'open' : 'resolved'}">${done ? '重新开放这条线索' : '标记为' + (post.kind === 'lost' ? '已找到' : '已归还')}</button></div>` : '<p class="modal-copy">处理状态由发布者更新。</p>'}</section></aside></div>`;
  }
  function inputField(name, label, value, type = 'text', extra = '', hint = '') {
    return `<label class="field${['place','description','contact'].includes(name) ? ' full' : ''}"><span>${label}<em>*</em></span><input id="field-${name}" name="${name}" type="${type}" value="${e(value)}" ${extra} aria-describedby="error-${name}${hint ? ' hint-' + name : ''}"><span id="error-${name}" class="field-error"></span>${hint ? `<small class="field-hint" id="hint-${name}">${hint}</small>` : ''}</label>`;
  }
  function publish() {
    if (!state.user) {
      main.innerHTML = `<div class="page-intro"><span class="eyebrow">留下线索</span><h1>发布之前，先认个名字。</h1><p>登录后，才能管理自己发布的线索和更新处理结果。</p></div>${empty('用自己的账号发布','浏览线索无需登录。账号只用来确认发布者身份。','<button class="button rust" data-action="auth-publish" type="button">登录 / 注册后发布</button>')}`; return;
    }
    const saved = state.api.readDraft();
    const draft = saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
    const v = { kind: 'lost', title: '', category: C.CATEGORIES[0], zone: C.ZONES[0], place: '', eventAt: localTime(), description: '', contact: '', ...draft };
    if (!['lost','found'].includes(v.kind)) v.kind = 'lost';
    if (!C.CATEGORIES.includes(v.category)) v.category = C.CATEGORIES[0];
    if (!C.ZONES.includes(v.zone)) v.zone = C.ZONES[0];
    state.photo = ''; state.photoLoading = false;
    main.innerHTML = `<div class="page-intro"><span class="eyebrow">留下线索</span><h1>把你知道的，写清楚。</h1><p>地点、时间和物品特征，是别人核对线索时最需要的信息。发布之后，你可以在“我的发布”里更新结果。</p></div>
      ${saved ? '<div class="draft-banner"><span>已恢复上次未发布的文字草稿；图片需要重新选择。</span><button type="button" data-action="clear-draft">清空草稿</button></div>' : ''}
      <div class="form-layout"><form id="publish-form" class="publish-form" novalidate><fieldset class="kind-selector"><legend>这是一条什么线索？</legend>${[['lost','我丢东西了','发布寻物信息'],['found','我捡到东西了','发布招领信息']].map(([k,l,s]) => `<label class="kind-choice"><input type="radio" name="kind" value="${k}"${v.kind === k ? ' checked' : ''}><span>${l}<small>${s}</small></span></label>`).join('')}</fieldset>
      <div class="form-grid">${inputField('title','物品名称',v.title,'text','maxlength="40" required placeholder="例如：深蓝色校园卡套"')}
      <label class="field"><span>物品类别<em>*</em></span><select id="field-category" name="category" aria-describedby="error-category">${options(C.CATEGORIES,v.category)}</select><span id="error-category" class="field-error"></span></label>
      ${inputField('eventAt','遗失 / 拾取时间',v.eventAt,'datetime-local','required')}
      <label class="field"><span>所在区域<em>*</em></span><select id="field-zone" name="zone" aria-describedby="error-zone">${options(C.ZONES,v.zone)}</select><span id="error-zone" class="field-error"></span></label>
      ${inputField('place','具体地点',v.place,'text','maxlength="80" required placeholder="例如：图书馆二楼靠窗自习区"')}
      <label class="field full"><span>补充描述</span><textarea id="field-description" name="description" maxlength="600" placeholder="外观、颜色、特殊标记；可保留一两处特征用于认领核对。" aria-describedby="error-description">${e(v.description)}</textarea><span id="error-description" class="field-error"></span></label>
      ${inputField('contact','联系方式 / 领取地点',v.contact,'text','maxlength="120" required placeholder="例如：已交至图书馆一楼服务台"','优先填写校园服务台、公共领取地点或你愿意公开的联系方式。')}
      <div class="field full"><label class="field-label" for="photo-input">物品图片（可选）</label><div class="image-control"><input id="photo-input" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="photo-hint"><img id="photo-thumb" alt="待发布的物品图片" hidden><button type="button" id="remove-photo" data-action="remove-photo" hidden>移除图片</button></div><small id="photo-hint" class="field-hint">仅支持 JPG、PNG、WebP，原图不超过 10 MB；上传后自动缩小尺寸。</small><span id="error-photo" class="field-error"></span></div></div>
      <p class="form-error" id="publish-error" role="alert" hidden></p><div class="form-end"><small id="draft-status">以“${e(state.user.name)}”发布 · 文字会自动保存为草稿</small><button id="publish-submit" class="button rust" type="submit">发布这条线索 →</button></div></form>
      <aside class="preview-side"><h2>你的线索，会长这样</h2><div id="card-preview"></div><div class="preview-tip"><strong>写得具体，比写得多更有用。</strong><br>把“丢了钥匙”改成“食堂二楼遗失一串带蓝色挂件的钥匙”，别人会更容易判断。<br><br>${state.api.mode === 'local' ? '本机模式只保存到当前浏览器。需要多人共享时，请运行项目的共享服务。' : '发布后，同一共享服务中的同学都可以浏览这条线索。'}</div></aside></div>`;
    updatePreview();
  }
  function formValues() {
    const form = document.getElementById('publish-form');
    if (!form) return null;
    const data = Object.fromEntries(new FormData(form));
    return { kind: data.kind, title: data.title, category: data.category, zone: data.zone, place: data.place,
      eventAt: data.eventAt, description: data.description, contact: data.contact, photo: state.photo };
  }
  function updatePreview() {
    const v = formValues(); if (!v) return;
    document.getElementById('card-preview').innerHTML = card({ ...v, id: 'preview', status: 'open', ownerName: state.user?.name }, true);
  }
  function saveDraft() {
    const v = formValues(); if (!v) return;
    const { photo, ...words } = v;
    const okay = state.api.saveDraft(words);
    document.getElementById('draft-status').textContent = okay ? '文字草稿已保存 · ' + date(Date.now()) : '文字草稿暂未保存，请在离开页面前完成发布。';
  }
  function mine() {
    const own = state.posts.filter(p => p.ownerId === state.user?.id);
    const shown = C.searchPosts(own, { status: state.mineStatus });
    main.innerHTML = `<div class="page-intro my-intro"><div><span class="eyebrow">我的线索记录</span><h1>有进展，记得更新。</h1><p>${state.api.mode === 'local' ? '这里只显示这台设备上由你发布的线索。' : '这里只显示当前账号发布的线索。'}已找到或已归还后，线索墙默认会将它收起。</p></div><a class="button rust" href="#publish">＋ 发布新线索</a></div>
      ${!state.user ? empty('登录后查看你的发布','同学可以浏览所有线索，自己的记录需要登录后查看。','<button class="button" type="button" data-action="auth">登录 / 注册</button>') : `<div class="board-topline"><div class="type-tabs" aria-label="我的发布状态">${[['all','全部'],['open','处理中'],['resolved','已完成']].map(([s,l]) => `<button type="button" data-action="mine-filter" data-status="${s}" class="${state.mineStatus === s ? 'active' : ''}" aria-pressed="${state.mineStatus === s}">${l}</button>`).join('')}</div><p class="my-status">${e(state.user.name)} · 共 ${own.length} 条</p></div>
      <div class="clue-grid my-grid">${shown.length ? shown.map(p => `<div class="mine-entry">${card(p)}<button type="button" data-action="status" data-id="${e(p.id)}" data-status="${p.status === 'open' ? 'resolved' : 'open'}">${p.status === 'open' ? '标记为' + (p.kind === 'lost' ? '已找到' : '已归还') : '重新开放'}</button></div>`).join('') : empty('这个分类下还没有发布','如果你正在找东西，或刚好捡到一件物品，可以先留下线索。','<a class="button secondary" href="#publish">去发布线索</a>')}</div>`}`;
  }
  async function route() {
    if (!state.api) return;
    const version = ++state.routeVersion;
    if (modal.open) modal.close();
    const hash = location.hash || '#board';
    const routeName = hash.startsWith('#detail/') ? 'detail' : hash.slice(1);
    updateHeader(routeName);
    try {
      const [posts, user] = await Promise.all([state.api.list(), state.api.profile()]);
      if (version !== state.routeVersion) return;
      state.posts = posts; state.user = user; updateHeader(routeName);
      if (routeName === 'publish') publish();
      else if (routeName === 'mine') mine();
      else if (routeName === 'detail') {
        let id = ''; try { id = decodeURIComponent(hash.slice(8)); } catch (_) {}
        detail(id);
      } else board();
      document.title = (routeName === 'publish' ? '发布线索' : routeName === 'mine' ? '我的发布' : routeName === 'detail' ? '线索详情' : '校园线索墙') + ' · 拾见校园';
      main.focus({ preventScroll: true }); window.scrollTo(0, 0);
    } catch (error) {
      if (version !== state.routeVersion) return;
      main.innerHTML = empty('暂时无法读取线索',error.message,'<button class="button" data-action="refresh" type="button">重试</button>');
    }
  }
  function openModal(title, content) {
    modal.innerHTML = `<div class="modal-head"><h2 id="modal-title">${e(title)}</h2><button class="modal-close" type="button" data-action="close-modal" aria-label="关闭对话框">×</button></div>${content}`;
    if (!modal.open) modal.showModal();
  }
  function confirm(title, copy, label, callback) {
    confirmAction = callback;
    openModal(title, `<p class="modal-copy">${e(copy)}</p><p class="form-error" id="confirm-error" role="alert" hidden></p><div class="modal-actions"><button class="button secondary" data-action="close-modal" type="button">再想想</button><button class="button rust" data-action="confirm" type="button">${e(label)}</button></div>`);
  }
  function auth(mode = 'login') {
    state.authMode = mode;
    openModal(mode === 'login' ? '欢迎回来' : '认识一下', `<div class="auth-tabs">${[['login','登录'],['register','注册']].map(([v,l]) => `<button type="button" data-action="auth-tab" data-mode="${v}" class="${mode === v ? 'active' : ''}">${l}</button>`).join('')}</div><form id="auth-form" class="modal-stack">
      <label class="field"><span>账号</span><input name="username" required minlength="3" maxlength="24" autocomplete="username" placeholder="3—24 位字母、数字或下划线"></label>
      ${mode === 'register' ? '<label class="field"><span>发布署名</span><input name="name" required minlength="2" maxlength="20" autocomplete="nickname" placeholder="别人看到的名字"></label>' : ''}
      <label class="field"><span>密码</span><input name="password" type="password" required minlength="8" maxlength="72" autocomplete="${mode === 'register' ? 'new-password' : 'current-password'}" placeholder="至少 8 位"></label><p class="form-error" id="auth-error" role="alert" hidden></p><button class="button rust wide" type="submit">${mode === 'register' ? '注册并登录' : '登录'}</button></form><p class="modal-copy">账号用于管理自己发布的线索。请使用本项目专用密码。</p>`);
  }
  function identity() {
    if (state.api.mode === 'local') {
      openModal('你的发布署名', `<p class="modal-copy">这台设备上的发布会归属于同一个本机身份。署名用于展示，不会改变已有线索的归属。</p><form id="identity-form" class="modal-stack"><label class="field"><span>发布署名</span><input name="name" value="${e(state.user.name)}" required minlength="2" maxlength="20"></label><p class="form-error" id="identity-error" role="alert" hidden></p><button class="button wide" type="submit">保存署名</button></form>`);
    } else if (!state.user) auth();
    else openModal('当前发布身份', `<p class="modal-copy">署名：${e(state.user.name)}<br>账号：${e(state.user.username)}<br>退出后仍可浏览线索，更新自己的发布需要重新登录。</p><button class="button secondary wide" data-action="logout" type="button">退出登录</button>`);
  }
  async function readPhoto(file) {
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('请选择 JPG、PNG 或 WebP 图片。');
    if (file.size > 10 * 1024 * 1024) throw new Error('原图不能超过 10 MB，请先缩小图片。');
    const source = await new Promise((resolve,reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('图片读取失败，请重新选择。')); reader.readAsDataURL(file); });
    const img = await new Promise((resolve,reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error('这张图片无法打开，请换一张。')); image.src = source; });
    if (!img.width || !img.height || img.width * img.height > 50000000) throw new Error('图片尺寸过大或无效，请先缩小图片。');
    const scale = Math.min(1,1000 / Math.max(img.width,img.height));
    const canvas = document.createElement('canvas'); canvas.width = Math.max(1,Math.round(img.width * scale)); canvas.height = Math.max(1,Math.round(img.height * scale));
    const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('当前浏览器无法处理图片，请先不选图片发布。');
    ctx.fillStyle = '#fffdf7'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0,canvas.width,canvas.height);
    let photo = canvas.toDataURL('image/jpeg',.8);
    for (const quality of [.65,.5,.35]) { if (photo.length <= 250000) break; photo = canvas.toDataURL('image/jpeg',quality); }
    if (!C.validPhoto(photo)) throw new Error('图片压缩后仍然过大，请选择内容更简单或尺寸更小的图片。');
    return photo;
  }
  async function copyContact(id) {
    const post = state.posts.find(p => p.id === id);
    if (!post || post.status !== 'open') throw new Error('这条线索已经完成，请刷新后查看。');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('FALLBACK');
      await navigator.clipboard.writeText(post.contact);
    } catch (_) {
      const input = document.createElement('textarea'); input.value = post.contact; input.className = 'sr-only'; document.body.appendChild(input); input.select();
      const okay = document.execCommand('copy'); input.remove();
      if (!okay) throw new Error('自动复制没有成功，请在详情中选中领取信息手动复制。');
    }
    toast('领取信息已复制。');
  }
  function showError(id, message) { const node = document.getElementById(id); if (node) { node.textContent = message; node.hidden = false; } }
  async function submitPost(form) {
    if (state.publishing) return;
    if (state.photoLoading) { toast('图片还在处理，请稍等一下再发布。', true); return; }
    const v = formValues(); const check = C.validatePost(v);
    form.querySelectorAll('[aria-invalid]').forEach(n => n.removeAttribute('aria-invalid'));
    form.querySelectorAll('.field-error').forEach(n => { n.textContent = ''; });
    document.getElementById('publish-error').hidden = true;
    if (!check.valid) {
      for (const [name,message] of Object.entries(check.errors)) {
        showError('error-' + name,message); document.getElementById('field-' + name)?.setAttribute('aria-invalid','true');
      }
      showError('publish-error','有几项信息还需要检查。请按字段下方的提示补充。');
      form.querySelector('[aria-invalid="true"]')?.focus(); return;
    }
    state.publishing = true;
    const button = document.getElementById('publish-submit'); button.disabled = true; button.textContent = '正在保存…';
    try {
      const post = await state.api.create(check.value); clearTimeout(draftTimer); state.api.clearDraft(); state.skipDraftSave = true;
      go('#detail/' + encodeURIComponent(post.id));
      toast(state.api.mode === 'shared' ? '线索已发布到共享服务。' : state.api.persistent ? '线索已保存到本机，刷新后仍可查看。' : '线索已加入临时记录，请及时导出备份。');
    } catch (error) { showError('publish-error',error.message); }
    finally { state.publishing = false; if (button.isConnected) { button.disabled = false; button.textContent = '发布这条线索 →'; } }
  }
  document.addEventListener('submit', async event => {
    const form = event.target;
    if (!['search-form','publish-form','auth-form','identity-form'].includes(form.id)) return;
    event.preventDefault();
    if (form.id === 'search-form') { state.filters.query = C.text(new FormData(form).get('query')); board(); document.getElementById('results-title').scrollIntoView({ block: 'nearest' }); return; }
    if (form.id === 'publish-form') { await submitPost(form); return; }
    const button = form.querySelector('[type="submit"]'); if (button.disabled) return; button.disabled = true;
    try {
      const data = Object.fromEntries(new FormData(form));
      if (form.id === 'auth-form') {
        state.user = await state.api[state.authMode](data); modal.close();
        if (state.pendingPublish) { state.pendingPublish = false; go('#publish'); } else await route();
        toast('已登录，欢迎 ' + state.user.name + '。');
      } else {
        state.user = await state.api.setName(data.name); modal.close(); updateHeader((location.hash || '#board').slice(1));
        if (location.hash === '#publish') updatePreview();
        toast('发布署名已保存。');
      }
    } catch (error) { showError(form.id === 'auth-form' ? 'auth-error' : 'identity-error',error.message); }
    finally { if (button.isConnected) button.disabled = false; }
  });
  document.addEventListener('input', event => {
    if (!event.target.closest('#publish-form') || event.target.type === 'file') return;
    updatePreview(); clearTimeout(draftTimer); draftTimer = setTimeout(saveDraft,250);
    const error = document.getElementById('error-' + event.target.name); if (error) error.textContent = '';
    event.target.removeAttribute('aria-invalid');
  });
  document.addEventListener('change', async event => {
    const input = event.target;
    const filters = { 'category-filter': 'category', 'zone-filter': 'zone', 'sort-filter': 'sort' };
    if (filters[input.id]) { state.filters[filters[input.id]] = input.value; board(); document.getElementById(input.id)?.focus({ preventScroll:true }); }
    else if (input.id === 'completed-filter') { state.filters.status = input.checked ? 'all' : 'open'; board(); document.getElementById(input.id)?.focus({ preventScroll:true }); }
    else if (input.id === 'photo-input') {
      const version = state.routeVersion; const photoVersion = ++state.photoVersion; state.photoLoading = true; const submit = document.getElementById('publish-submit'); submit.disabled = true;
      showError('error-photo','正在处理图片…');
      try {
        const photo = await readPhoto(input.files[0]);
        if (version !== state.routeVersion || photoVersion !== state.photoVersion) return;
        state.photo = photo || ''; const thumb = document.getElementById('photo-thumb'); thumb.src = state.photo; thumb.hidden = !state.photo;
        document.getElementById('remove-photo').hidden = !state.photo; document.getElementById('error-photo').textContent = ''; updatePreview();
      } catch (error) { if (version === state.routeVersion && photoVersion === state.photoVersion) { input.value = ''; showError('error-photo',error.message); } }
      finally { if (version === state.routeVersion && photoVersion === state.photoVersion) { state.photoLoading = false; submit.disabled = false; } }
    } else if (input.closest('#publish-form')) { updatePreview(); clearTimeout(draftTimer); draftTimer = setTimeout(saveDraft,100); }
  });
  document.getElementById('identity-button').addEventListener('click',identity);
  document.addEventListener('click', async event => {
    const button = event.target.closest('[data-action]'); if (!button) return;
    const action = button.dataset.action;
    try {
      if (action === 'close-modal') modal.close();
      else if (action === 'auth') auth();
      else if (action === 'auth-publish') { state.pendingPublish = true; auth(); }
      else if (action === 'auth-tab') auth(button.dataset.mode);
      else if (action === 'quick-search') { state.filters.query = button.dataset.query; board(); }
      else if (action === 'kind-filter') { state.filters.kind = button.dataset.kind; board(); }
      else if (action === 'mine-filter') { state.mineStatus = button.dataset.status; mine(); }
      else if (action === 'clear-filters') { state.filters = { query:'',kind:'all',category:'all',zone:'all',status:'open',sort:'created' }; board(); }
      else if (action === 'refresh') { button.disabled = true; await route(); toast('线索已刷新。'); }
      else if (action === 'copy-contact') await copyContact(button.dataset.id);
      else if (action === 'status') {
        const post = state.posts.find(p => p.id === button.dataset.id); if (!post) throw new Error('找不到这条线索，请刷新。');
        const next = button.dataset.status; const label = next === 'open' ? '重新开放' : post.kind === 'lost' ? '已找到' : '已归还';
        confirm(next === 'open' ? '重新开放这条线索？' : '确认物品已有归处？', next === 'open' ? '线索会重新出现在默认列表中，领取信息也会恢复显示。' : '确认后，线索墙默认收起这条信息，详情页也会收起联系方式。',next === 'open' ? label : '标记为' + label,async () => {
          await state.api.update(post.id,next); modal.close(); await route(); toast('状态已更新：' + label + '。');
        });
      } else if (action === 'confirm') {
        if (button.disabled) return; button.disabled = true;
        try { await confirmAction?.(); } catch (error) { showError('confirm-error',error.message); }
        finally { if (button.isConnected) button.disabled = false; }
      } else if (action === 'logout') {
        button.disabled = true; await state.api.logout(); state.user = null; modal.close(); await route(); toast('已退出登录。');
      } else if (action === 'clear-draft') {
        confirm('清空未发布的草稿？','已发布的线索不受影响。当前表单里的文字和图片会清空。','清空草稿',async () => { clearTimeout(draftTimer); state.api.clearDraft(); modal.close(); publish(); });
      } else if (action === 'remove-photo') {
        state.photo = ''; document.getElementById('photo-input').value = ''; document.getElementById('photo-thumb').hidden = true; button.hidden = true; updatePreview();
      } else if (action === 'export') {
        const blob = new Blob([state.api.exportData()],{ type:'application/json;charset=utf-8' }); const url = URL.createObjectURL(blob);
        const link = document.createElement('a'); link.href = url; link.download = '拾见校园-本机备份-' + new Date().toISOString().slice(0,10) + '.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
        toast('本机记录已导出。请妥善保管含联系方式的备份。');
      } else if (action === 'help') {
        openModal('怎样用好一条线索', `<div class="help-step"><strong>01 · 发布</strong>选择寻物或招领，写清物品、地点、时间和领取信息。</div><div class="help-step"><strong>02 · 查找</strong>用空格组合关键词，例如“图书馆 钥匙”；也可以按类别、区域筛选。</div><div class="help-step"><strong>03 · 核对</strong>进入详情，复制领取信息。保留独有特征，核实后再交接物品。</div><div class="help-step"><strong>04 · 收尾</strong>发布者在“我的发布”或详情里标记已找到 / 已归还。误操作时可以重新开放。</div><p class="privacy-note">${state.api.mode === 'shared' ? '当前为共享服务：同一服务中的账号共同浏览线索，由发布者账号更新状态。' : '当前为本机模式：记录只存于当前浏览器，换设备不会同步。本机身份适合个人体验；多人使用请按 README 启动共享服务。'}</p>`);
      }
    } catch (error) { toast(error.message,true); if (button.isConnected) button.disabled = false; }
  });
  window.addEventListener('hashchange',() => { clearTimeout(draftTimer); if (!state.skipDraftSave) saveDraft(); state.skipDraftSave = false; void route(); });
  window.addEventListener('pagehide',saveDraft);
  async function start() {
    try { state.api = await window.ShijianAPI.connect(); await route(); }
    catch (error) { main.innerHTML = empty('页面暂时无法打开',error.message); }
  }
  void start();
})();
