(function (root, factory) {
  const seed = factory();
  if (typeof module === 'object' && module.exports) module.exports = seed;
  else root.ShijianSeed = seed;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const items = [
    ['found', '校园卡，在图书馆等你', '证件卡片', '图书馆', '图书馆一楼服务台', '2026-10-10T01:20:00Z', '在一楼自助借还机旁拾到。已交服务台保管，领取时请说明卡面特征。', '图书馆一楼服务台，工作时间内凭本人信息核对领取。', '图书馆服务点'],
    ['lost', '寻找黑色无线耳机', '电子产品', '教学楼', '第三教学楼 2 层', '2026-10-09T08:15:00Z', '黑色充电盒，盒盖左侧有小划痕。可能遗落在自习教室，请帮忙留意。', '演示联系方式：请交第三教学楼值班室，并说明来自拾见校园。', '同学小林'],
    ['found', '一串钥匙，带蓝色挂绳', '钥匙', '食堂', '第一食堂北门长椅', '2026-10-10T02:35:00Z', '两把银色钥匙和一个蓝色挂绳。请失主说明挂绳上的图案再领取。', '第一食堂值班室，核对挂绳特征后领取。', '食堂服务点'],
    ['lost', '米白色保温杯', '生活用品', '运动场', '田径场看台附近', '2026-10-08T10:10:00Z', '杯盖为深绿色，杯身有一枚小树贴纸，周四晚跑步后发现不见了。', '演示联系方式：请转交运动场值班室。', '同学小周'],
    ['found', '深蓝色折叠伞', '生活用品', '宿舍区', '学生宿舍 12 号楼门厅', '2026-10-09T11:00:00Z', '放在门厅角落，伞柄有白色挂绳。已交宿管处。', '学生宿舍 12 号楼宿管处。', '宿舍服务点'],
    ['lost', '校园卡遗失线索', '证件卡片', '教学楼', '第二教学楼到图书馆沿途', '2026-10-09T03:40:00Z', '上午课后发现校园卡不见了。公开页面不填写完整姓名和学号，领取时本人核对。', '演示联系方式：请交图书馆一楼服务台。', '同学小陈'],
    ['found', '一本写着笔记的高数教材', '其他', '图书馆', '图书馆三楼靠窗座位', '2026-10-07T07:30:00Z', '书中有手写便签。请描述便签内容后领取。', '图书馆三楼咨询台。', '图书馆服务点'],
    ['found', '灰色帆布袋', '生活用品', '食堂', '第二食堂二层', '2026-10-06T04:15:00Z', '已由失主核对并领取，此条保留为已完成示例。', '第二食堂服务台。', '食堂服务点', 'resolved'],
    ['lost', '银色 U 盘', '电子产品', '教学楼', '实验楼机房', '2026-10-05T06:45:00Z', '已找回，此条展示寻物信息的完成状态。', '实验楼值班室。', '同学小吴', 'resolved']
  ];
  return items.map((item, i) => {
    const [kind, title, category, zone, place, eventAt, description, contact, ownerName, status = 'open'] = item;
    return { id: `sample-${String(i + 1).padStart(3, '0')}`, kind, title, category, zone, place,
      eventAt, description, contact, ownerName, ownerId: `sample-owner-${i + 1}`, status,
      createdAt: eventAt, updatedAt: eventAt, photo: '', demo: true };
  });
});
