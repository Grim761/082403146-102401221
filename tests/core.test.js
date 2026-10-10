'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/core.js');
const seed = require('../js/seed.js');
const NOW = Date.parse('2026-10-10T06:00:00Z');
const owner = { id: 'student-a', name: '测试同学' };
function input(overrides = {}) {
  return { kind: 'lost', title: '黑色耳机', category: '电子产品', zone: '教学楼', place: '第三教学楼',
    eventAt: '2026-10-09T09:30:00Z', description: '盒盖有划痕', contact: '实验楼值班室', photo: '', ...overrides };
}
function post(overrides = {}) { return C.createPost(input(overrides), owner, { now: NOW, id: 'p-1' }); }

test('有效寻物：统一时间格式并设置寻找中', () => {
  const result = post({ title: '  黑色耳机  ' });
  assert.equal(result.title, '黑色耳机'); assert.equal(result.status, 'open');
  assert.equal(C.statusLabel(result), '寻找中'); assert.equal(result.ownerId, owner.id);
});
test('有效招领：初始状态为招领中', () => assert.equal(C.statusLabel(post({ kind: 'found' })), '招领中'));
test('必填字段缺失：逐一覆盖校验分支', () => {
  for (const field of ['kind', 'title', 'category', 'zone', 'place', 'eventAt', 'contact']) {
    const result = C.validatePost(input({ [field]: '' }), NOW);
    assert.equal(result.valid, false, field); assert.ok(result.errors[field], field);
  }
});
test('空白输入：名称、地点、联系方式不能只填空格', () => {
  const result = C.validatePost(input({ title: '   ', place: '\n\t ', contact: '　　' }), NOW);
  assert.ok(result.errors.title); assert.ok(result.errors.place); assert.ok(result.errors.contact);
});
test('长度边界：接受40字名称，拒绝41字名称', () => {
  assert.equal(C.validatePost(input({ title: '物'.repeat(40) }), NOW).valid, true);
  assert.ok(C.validatePost(input({ title: '物'.repeat(41) }), NOW).errors.title);
});
test('无效和未来时间：不接受错误日期或将来事件', () => {
  assert.ok(C.validatePost(input({ eventAt: 'not-a-date' }), NOW).errors.eventAt);
  assert.ok(C.validatePost(input({ eventAt: '2026-10-11T06:00:00Z' }), NOW).errors.eventAt);
});
test('图像输入：拒绝SVG和过大数据，接受允许的光栅格式', () => {
  assert.equal(C.validPhoto('data:image/svg+xml;base64,PHN2Zz4='), false);
  assert.equal(C.validPhoto('data:image/jpeg;base64,' + 'A'.repeat(360001)), false);
  assert.equal(C.validPhoto('data:image/png;base64,iVBORw0KGgo='), true);
});
test('关键词：忽略大小写并按多个词共同匹配', () => {
  const posts = [post({ title: 'USB耳机', description: '黑色' }), { ...post(), id: 'p-2', title: '白色USB线' }];
  assert.deepEqual(C.searchPosts(posts, { query: 'usb 黑色' }).map(x => x.id), ['p-1']);
});
test('无结果、空关键词：分别返回空列表与全部数据', () => {
  assert.equal(C.searchPosts(seed, { query: '火星飞船' }).length, 0);
  assert.equal(C.searchPosts(seed, { query: '  ' }).length, seed.length);
});
test('组合筛选：类型、区域、类别和状态同时满足', () => {
  const result = C.searchPosts(seed, { kind: 'found', zone: '图书馆', category: '证件卡片', status: 'open' });
  assert.equal(result.length, 1); assert.equal(result[0].id, 'sample-001');
});
test('排序：按事件时间降序，原数组顺序不被修改', () => {
  const before = seed.map(x => x.id); const result = C.searchPosts(seed, { sort: 'event' });
  assert.ok(Date.parse(result[0].eventAt) >= Date.parse(result[1].eventAt));
  assert.deepEqual(seed.map(x => x.id), before);
});
test('发布者更新状态：寻物已找到、招领已归还，并可重新开放', () => {
  for (const kind of ['lost', 'found']) {
    const p = post({ kind }); const resolved = C.changeStatus(p, owner.id, 'resolved', NOW + 1000);
    assert.equal(C.statusLabel(resolved), kind === 'lost' ? '已找到' : '已归还');
    assert.equal(p.status, 'open'); assert.equal(C.changeStatus(resolved, owner.id, 'open').status, 'open');
  }
});
test('其他用户与未登录用户：不能修改他人的发布', () => {
  for (const actor of ['student-b', '', null]) assert.throws(() => C.changeStatus(post(), actor, 'resolved'), e => e.code === 'FORBIDDEN');
});
test('不存在的记录和非法状态：返回明确错误', () => {
  assert.throws(() => C.changeStatus(null, owner.id, 'resolved'), e => e.status === 404);
  assert.throws(() => C.changeStatus(post(), owner.id, 'deleted'), e => e.code === 'INVALID_INPUT');
});
test('重复完成：不制造新的更新时间', () => {
  const p = { ...post(), status: 'resolved' }; assert.equal(C.changeStatus(p, owner.id, 'resolved', NOW + 10000).updatedAt, p.updatedAt);
});
test('HTML输出转义：文本不会成为标签或事件属性', () => {
  assert.equal(C.escapeHTML('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
});
test('账号校验：规范化账号并拒绝弱长度密码和无效账号', () => {
  assert.equal(C.validateAccount({ username: 'Student_A', name: '同学甲', password: 'password123' }).username, 'student_a');
  assert.throws(() => C.validateAccount({ username: 'a', name: '同学甲', password: '123' }));
});
test('演示数据通过存储结构验证', () => assert.equal(seed.every(C.validStoredPost), true));

module.exports = { input, NOW };
