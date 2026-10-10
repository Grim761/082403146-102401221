(function (root, factory) {
  const illustrations = factory();
  if (typeof module === 'object' && module.exports) module.exports = illustrations;
  else root.ShijianIllustrations = illustrations;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // All artwork is fixed markup. Item text selects a drawing; it is never inserted into SVG.
  const ink = '#193443';
  const paper = '#fffdf7';
  const sage = '#9eb7a5';
  const rust = '#ba5c3c';
  const sand = '#e6d7bc';
  const drawings = {
    key: `<ellipse cx="48" cy="80" rx="29" ry="5" fill="${ink}" opacity=".08"/>
      <g stroke="${ink}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
        <path d="M53 15h13v18H53z" fill="${sage}" transform="rotate(20 60 24)"/>
        <circle cx="40" cy="30" r="15" fill="none"/>
        <circle cx="40" cy="30" r="10" fill="none" opacity=".4"/>
        <g transform="rotate(24 40 47)"><path d="M38 44a8 8 0 1 0-8 0v30h7v-7h6v-7h-6V44z" fill="${sand}"/><circle cx="34" cy="37" r="3" fill="${paper}"/></g>
        <g transform="rotate(-24 57 49)"><path d="M62 43a9 9 0 1 0-10 0v34h8v-7h6v-8h-6V43z" fill="${paper}"/><circle cx="57" cy="35" r="3" fill="${sage}"/></g>
        <path d="M51 21l4 4" fill="none"/>
      </g>`,
    umbrella: `<ellipse cx="49" cy="82" rx="23" ry="4" fill="${ink}" opacity=".08"/>
      <g stroke="${ink}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
        <path d="M48 13v5M48 43v30c0 12 15 12 15 1" fill="none"/>
        <path d="M12 46C15 26 30 17 48 17s33 9 36 29c-5-5-13-5-18 0-5-5-13-5-18 0-5-5-13-5-18 0-5-5-13-5-18 0z" fill="${sage}"/>
        <path d="M30 46c1-14 6-23 18-29-3 9-4 19 0 29M48 17c12 6 17 15 18 29" fill="none"/>
        <path d="M63 73v2c0 6-9 7-12 2" fill="none" stroke="${rust}" stroke-width="5"/>
      </g>`,
    earbuds: `<ellipse cx="48" cy="81" rx="30" ry="5" fill="${ink}" opacity=".08"/>
      <g stroke="${ink}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
        <path d="M20 40V30c0-10 9-16 28-16s28 6 28 16v10" fill="${sage}"/>
        <path d="M21 41c1-8 9-11 27-11s26 3 27 11" fill="${paper}"/>
        <path d="M36 32c-8-1-11-8-7-13 3-4 11-3 14 2 1 2 1 5-1 8v16a4 4 0 0 1-8 0V31" fill="${paper}"/>
        <path d="M60 32c8-1 11-8 7-13-3-4-11-3-14 2-1 2-1 5 1 8v16a4 4 0 0 0 8 0V31" fill="${paper}"/>
        <path d="M32 23h3M61 23h3" fill="none"/>
        <path d="M18 42h60v19c0 11-9 17-30 17s-30-6-30-17z" fill="${paper}"/>
        <path d="M25 48h46" fill="none" opacity=".3"/>
        <circle cx="48" cy="63" r="2" fill="${rust}" stroke="none"/>
      </g>`,
    headphones: `<ellipse cx="48" cy="81" rx="29" ry="5" fill="${ink}" opacity=".08"/>
      <g stroke="${ink}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
        <path d="M21 60V40a27 27 0 0 1 54 0v20h-8V40a19 19 0 0 0-38 0v20z" fill="${sage}"/>
        <path d="M28 20c10-9 30-9 40 0" fill="none" stroke="${ink}" stroke-width="5"/>
        <rect x="18" y="45" width="19" height="31" rx="8" fill="${paper}"/>
        <rect x="59" y="45" width="19" height="31" rx="8" fill="${paper}"/>
        <path d="M31 51v19M65 51v19" stroke="${rust}" stroke-width="4"/>
      </g>`,
    card: `<ellipse cx="48" cy="79" rx="31" ry="5" fill="${ink}" opacity=".08"/>
      <g stroke="${ink}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
        <path d="M41 25V12h14v13" fill="none" stroke="${sage}" stroke-width="6"/>
        <rect x="14" y="25" width="68" height="49" rx="7" fill="${paper}"/>
        <path d="M15 38h66" fill="none"/>
        <path d="M42 30h12" fill="none"/>
        <rect x="24" y="46" width="18" height="18" rx="3" fill="${sage}" stroke="none"/>
        <circle cx="33" cy="52" r="3" fill="${paper}" stroke="none"/>
        <path d="M28 61c1-5 9-5 10 0" fill="${paper}" stroke="none"/>
        <path d="M51 49h19M51 56h14M51 63h10" fill="none"/>
        <circle cx="72" cy="32" r="2" fill="${rust}" stroke="none"/>
      </g>`,
    cup: `<ellipse cx="48" cy="82" rx="24" ry="5" fill="${ink}" opacity=".08"/>
      <g stroke="${ink}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
        <rect x="34" y="13" width="28" height="12" rx="4" fill="${sage}"/>
        <path d="M32 25h32l2 47a8 8 0 0 1-8 8H38a8 8 0 0 1-8-8z" fill="${paper}"/>
        <path d="M32 34h32M34 73h28" fill="none" opacity=".35"/>
        <path d="M48 59c-13 1-14-13-14-13 13-1 15 9 14 13z" fill="${sage}"/>
        <path d="M48 59c0-12 11-14 11-14 3 11-5 16-11 14z" fill="${sage}"/>
        <path d="M48 65V54" fill="none"/>
        <path d="M41 18h14" fill="none"/>
      </g>`,
    book: `<ellipse cx="48" cy="81" rx="28" ry="5" fill="${ink}" opacity=".08"/>
      <g stroke="${ink}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
        <path d="M27 16h43v58H27c-8 0-8-13 0-13" fill="${paper}"/>
        <path d="M27 12h43v54H27c-8 0-8 12 0 12H73" fill="${rust}"/>
        <path d="M29 16v47" fill="none" opacity=".35"/>
        <rect x="38" y="26" width="23" height="18" rx="2" fill="${paper}" stroke="none"/>
        <path d="M43 32h13M43 38h9" fill="none"/>
        <path d="M34 72h33" fill="none" opacity=".45"/>
        <path d="M60 66v14l-5-4-5 4V66" fill="${sage}"/>
      </g>`,
    bag: `<ellipse cx="48" cy="82" rx="29" ry="5" fill="${ink}" opacity=".08"/>
      <g stroke="${ink}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
        <path d="M34 37V25c0-17 28-17 28 0v12" fill="none" stroke="${sage}" stroke-width="7"/>
        <path d="M24 32h48l6 41c1 5-3 8-7 8H25c-4 0-8-3-7-8z" fill="${paper}"/>
        <path d="M32 32v9M64 32v9" fill="none"/>
        <rect x="34" y="48" width="28" height="20" rx="3" fill="${sage}"/>
        <path d="M39 54h18M39 60h11" fill="none" stroke="${paper}"/>
        <path d="M24 73l2-27M70 73l-2-27" fill="none" opacity=".25"/>
      </g>`,
    backpack: `<ellipse cx="48" cy="83" rx="26" ry="5" fill="${ink}" opacity=".08"/>
      <g stroke="${ink}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
        <path d="M40 20v-6h16v6M26 43h-6v27h7M70 43h6v27h-7" fill="${paper}"/>
        <path d="M25 40c0-27 46-27 46 0v34a7 7 0 0 1-7 7H32a7 7 0 0 1-7-7z" fill="${sage}"/>
        <path d="M32 41c0-18 32-18 32 0" fill="none"/>
        <path d="M60 39v8" fill="none"/>
        <rect x="33" y="51" width="30" height="24" rx="5" fill="${paper}"/>
        <path d="M34 59h28M55 59v5" fill="none"/>
        <path d="M43 43h10" fill="none" stroke="${rust}" stroke-width="4"/>
      </g>`,
    usb: `<ellipse cx="49" cy="81" rx="25" ry="4" fill="${ink}" opacity=".08"/>
      <g transform="rotate(24 48 48)" stroke="${ink}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
        <path d="M36 12h24v25H36z" fill="${paper}"/>
        <path d="M42 20h3v6h-3zM51 20h3v6h-3z" fill="${ink}" stroke="none"/>
        <rect x="31" y="34" width="34" height="46" rx="7" fill="${rust}"/>
        <path d="M37 42h22" fill="none" stroke="${paper}" opacity=".6"/>
        <rect x="42" y="64" width="12" height="7" rx="3.5" fill="${paper}"/>
        <path d="M48 48v10M45 51l3-3 3 3" fill="none" stroke="${paper}"/>
      </g>`,
    phone: `<ellipse cx="48" cy="82" rx="24" ry="5" fill="${ink}" opacity=".08"/>
      <g stroke="${ink}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
        <rect x="28" y="10" width="40" height="72" rx="8" fill="${paper}"/>
        <rect x="33" y="19" width="30" height="53" rx="3" fill="${sage}"/>
        <path d="M43 15h10M44 77h8" fill="none"/>
        <path d="M38 58l12-12 9 9M38 38l10-10" fill="none" stroke="${paper}" opacity=".7"/>
        <circle cx="53" cy="33" r="4" fill="${sand}" stroke="none"/>
      </g>`,
    laptop: `<ellipse cx="48" cy="80" rx="34" ry="5" fill="${ink}" opacity=".08"/>
      <g stroke="${ink}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
        <rect x="18" y="20" width="60" height="43" rx="4" fill="${paper}"/>
        <rect x="24" y="26" width="48" height="31" rx="1" fill="${sage}" stroke="none"/>
        <path d="M18 63h60l9 12c1 2 0 4-3 4H12c-3 0-4-2-3-4z" fill="${paper}"/>
        <path d="M33 70h30M40 75h16" fill="none" opacity=".5"/>
        <path d="M38 42l-6 4 6 4M58 42l6 4-6 4M51 39l-6 14" fill="none" stroke="${paper}"/>
        <circle cx="48" cy="23" r="1" fill="${ink}" stroke="none"/>
      </g>`,
    generic: `<ellipse cx="48" cy="81" rx="29" ry="5" fill="${ink}" opacity=".08"/>
      <g stroke="${ink}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
        <path d="M20 32l28-13 28 13v34L48 80 20 66z" fill="${paper}"/>
        <path d="M20 32l28 14 28-14M48 46v34" fill="none"/>
        <path d="M35 25l28 14v13l-8 4V43L27 29" fill="${sage}"/>
        <path d="M29 53l9 5M29 60l6 3" fill="none" stroke="${rust}"/>
      </g>`
  };

  const titleRules = [
    ['headphones', /头戴(?:式)?(?:蓝牙|无线)?耳机|(?:头戴式|头戴)耳麦|耳麦|\bheadphones?\b/i],
    ['earbuds', /无线耳机|蓝牙耳机|入耳式耳机|耳机|\bearbuds?\b|\bearphones?\b|\bairpods?\b/i],
    ['umbrella', /折叠伞|雨伞|遮阳伞|太阳伞|晴雨伞|长柄伞|伞|\bumbrellas?\b/i],
    ['key', /门禁钥匙|钥匙(?:串|扣)?|\bkeys?\b|\bkeychains?\b|\bkeyrings?\b/i],
    ['card', /校园卡(?:套)?|学生卡|饭卡|公交卡|银行卡|身份证|学生证|证件|门禁卡|卡套|卡片|一卡通|\bcards?\b|\bid\s+cards?\b/i],
    ['cup', /保温杯|水杯|杯子|马克杯|水壶|水瓶|杯|\bcups?\b|\bmugs?\b|\b(?:water\s+)?bottles?\b|\bthermos\b/i],
    ['book', /笔记本(?!电脑)|笔记簿|记事本|教材|课本|作业本|练习本|书本|书籍|书|\bbooks?\b|\bnotebooks?\b/i],
    ['backpack', /双肩包|背包|书包|\bbackpacks?\b|\brucksacks?\b/i],
    ['bag', /帆布袋|帆布包|手提袋|手提包|托特包|购物袋|钱包|挎包|包|袋|\bbags?\b|\btotes?\b|\bwallets?\b/i],
    ['usb', /[uｕ]\s*[-－]?\s*盘|优盘|闪存盘|\busb(?:\s+(?:flash\s+)?(?:drive|stick))?\b|\bflash\s+drives?\b|\bthumb\s+drives?\b/i],
    ['phone', /手机|智能电话|\b(?:smart)?phones?\b|\biphones?\b/i],
    ['laptop', /笔记本电脑|平板(?:电脑)?|电脑|计算机|\blaptops?\b|\bmacbooks?\b|\bipads?\b|\btablets?\b/i]
  ];
  const categoryTypes = { '证件卡片': 'card', '钥匙': 'key', '电子产品': 'phone', '生活用品': 'cup', '其他': 'generic' };

  function itemType(post = {}) {
    const title = typeof post?.title === 'string' ? post.title : '';
    let best = null;
    for (const [type, pattern] of titleRules) {
      const match = pattern.exec(title);
      // Prefer the first named item. Longer matches settle overlapping names such as 笔记本电脑.
      if (match && (!best || match.index < best.index || (match.index === best.index && match[0].length > best.length))) {
        best = { type, index: match.index, length: match[0].length };
      }
    }
    const category = typeof post?.category === 'string' ? post.category : '';
    return best?.type || (Object.hasOwn(categoryTypes, category) ? categoryTypes[category] : 'generic');
  }

  function render(post) {
    const type = itemType(post);
    return `<span class="item-art item-art--${type}" aria-hidden="true"><svg class="item-illustration" data-item-icon="${type}" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" focusable="false">${drawings[type]}</svg></span>`;
  }

  return Object.freeze({ itemType, render });
});
