"""Generate the project's diagrams from the actual implementation structure."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math

OUT = Path(__file__).resolve().parents[1] / 'docs' / 'images'
OUT.mkdir(parents=True, exist_ok=True)
FONT = Path('C:/Windows/Fonts/msyh.ttc')
if not FONT.exists():
    raise SystemExit('请安装微软雅黑字体或将 FONT 改为本机中文字体路径。')
INK, PAPER, RUST, SAGE, MUTED = '#193443', '#fffdf7', '#ba5c3c', '#426c58', '#657675'
def font(size): return ImageFont.truetype(str(FONT), size)
def canvas(title, subtitle, height=890):
    im = Image.new('RGB', (1500, height), '#f3efe4'); d = ImageDraw.Draw(im)
    d.text((60,40), title, font=font(42), fill=INK)
    d.text((62,105), subtitle, font=font(21), fill=MUTED)
    d.line((60,152,1440,152), fill='#d9d6c9', width=2)
    return im,d
def box(d, xy, title, body='', color=INK):
    x,y,w,h=xy; d.rounded_rectangle((x,y,x+w,y+h), radius=12, fill=PAPER, outline='#d9d6c9', width=2)
    d.rectangle((x,y+12,x+5,y+h-12),fill=color)
    d.text((x+24,y+20),title,font=font(27),fill=color)
    for i,line in enumerate(body.split('\n')): d.text((x+24,y+65+i*34),line,font=font(20),fill=MUTED)
def arrow(d, points, color=RUST, label=None, label_pos=None):
    d.line(points,fill=color,width=4,joint='curve'); a,b=points[-2:]; angle=math.atan2(b[1]-a[1],b[0]-a[0]); n=13
    d.polygon([b,(b[0]-n*math.cos(angle-.45),b[1]-n*math.sin(angle-.45)),(b[0]-n*math.cos(angle+.45),b[1]-n*math.sin(angle+.45))],fill=color)
    if label: d.text(label_pos,label,font=font(19),fill=color)

im,d=canvas('拾见校园 · 从发布到处理完成','使用流程：状态由发布者更新，浏览者先核对物品特征。')
steps=[('01  发布线索','选择寻物 / 招领\n填写物品、地点、时间'),('02  浏览与筛选','组合关键词\n按类别、区域缩小范围'),('03  核对与联系','查看线索详情\n复制联系或领取信息'),('04  线下交接','核对独有特征\n确认物品归属')]
for i,(title,body) in enumerate(steps):
    x=60+i*355;box(d,(x,205,315,160),title,body)
    if i<3:arrow(d,[(x+319,285),(x+350,285)])
box(d,(60,460,400,160),'发布者更新处理结果','详情页 / 我的发布\n服务器检查当前账号归属',RUST)
box(d,(550,460,380,160),'寻物：已找到','默认列表收起\n详情页收起联系信息',SAGE)
box(d,(1015,460,425,160),'招领：已归还','勾选“包含已完成”可查看\n误操作可以重新开放',SAGE)
arrow(d,[(1260,370),(1260,412),(260,412),(260,455)],label='交接完成后',label_pos=(685,379))
arrow(d,[(465,518),(544,518)])
arrow(d,[(465,578),(498,578),(498,654),(1228,654),(1228,625)])
d.text((64,734),'校验未通过：保留表单并指出具体字段；保存失败：不给出发布成功提示。',font=font(23),fill=INK)
d.text((64,789),'本机模式：当前浏览器保存     ·     共享模式：同一服务的不同账号浏览同一份数据',font=font(21),fill=MUTED)
im.save(OUT/'flow.png')

im,d=canvas('拾见校园 · 数据怎样流动','页面负责交互，业务规则统一校验，存储层确认写入后才更新视图。',1030)
box(d,(60,210,400,210),'页面层 · app.js','线索墙 / 发布 / 详情 / 我的发布\n转义显示文本，处理表单反馈\n复制领取信息与草稿恢复')
box(d,(550,210,395,210),'业务层 · core.js','validatePost：字段和时间校验\nsearchPosts：关键词与组合筛选\nchangeStatus：发布者与状态检查')
arrow(d,[(465,295),(545,295)],label='调用规则',label_pos=(472,256))
box(d,(1030,210,410,210),'记录结构 · Post','id / ownerId / kind / status\ntitle / category / zone / place\neventAt / contact / photo / …')
arrow(d,[(950,295),(1025,295)])
box(d,(60,535,400,215),'本机存储 · storage.js','稳定的本机发布身份\nlocalStorage 保存记录\n先写入成功，再替换内存数据',SAGE)
box(d,(550,535,395,215),'共享接口 · server.js','HttpOnly Cookie 识别账号\n服务端重复校验并检查归属\n密码经随机盐与 scrypt 处理',RUST)
box(d,(1030,535,410,215),'文件存储 · store.js','data/shijian.json\n串行事务 → 临时文件 → rename\n保存成功后提交新的数据快照',RUST)
arrow(d,[(260,425),(260,529)],color=SAGE,label='本机模式',label_pos=(277,460))
arrow(d,[(420,425),(420,475),(747,475),(747,529)],label='api.js 选择共享接口',label_pos=(475,439))
arrow(d,[(950,630),(1025,630)],label='JSON',label_pos=(963,592))
d.text((64,835),'两种模式的数据独立。GitHub Pages 提供本机模式；运行 Node 服务后才支持账号间共享。',font=font(22),fill=INK)
d.text((64,885),'账号数据和运行记录不上传 GitHub。自动化测试使用临时目录，不改动运行中的数据。',font=font(21),fill=MUTED)
im.save(OUT/'data-flow.png')

im=Image.new('RGB',(480,320),'#f3efe4');d=ImageDraw.Draw(im)
d.ellipse((115,65,245,195),outline=INK,width=14);d.line((205,170,355,270),fill=INK,width=14)
d.line((305,235,325,205),fill=INK,width=12);d.line((332,255,350,225),fill=INK,width=12)
d.text((25,20),'图片处理测试 · 示例钥匙',font=font(23),fill=RUST)
im.save(OUT/'photo-fixture.png')
