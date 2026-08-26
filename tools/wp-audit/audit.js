/* eslint-disable */
/**
 * Live-DOM audit for the Salient WordPress install.
 *
 * Paste into DevTools on http://luxury-property-group.local/<page>/.
 * See README.md for why this reads the browser rather than the export.
 */

window.__AUDIT = function () {
  const bn = (u) => {
    u = u || '';
    if (u === 'none' || !u) return '-';
    return u.replace(/^url\(["']?|["']?\)$/g, '').split('/').pop().split('?')[0];
  };
  const px = (v) => Math.round(parseFloat(v) || 0);
  const T = (e) => (e.textContent || '').replace(/\s+/g, ' ').trim();
  const L = [];

  // Nested rows are Salient's inner rows; only the top-level bands are
  // sections in the content model.
  const rows = [...document.querySelectorAll('.wpb_row')]
    .filter((r) => !r.parentElement.closest('.wpb_row'));

  rows.forEach((r, i) => {
    const s = getComputedStyle(r);
    const rc = r.getBoundingClientRect();
    // The ground lives on a child layer, never on the row element.
    const bg = r.querySelector(':scope > .row-bg-wrap .row-bg, :scope .row-bg-wrap > .row-bg');
    const ov = r.querySelector('.row-bg-overlay');
    const bs = bg ? getComputedStyle(bg) : null;

    const f = [];
    if (/vc_row-o-full-height/.test(r.className)) f.push('FULLH');
    if (/nectar-parallax-enabled/.test(r.className)) f.push('PARALLAX');
    if (/full-width-content/.test(r.className)) f.push('FWCONTENT');
    else if (/full-width-section/.test(r.className)) f.push('FWSECTION');
    if (/vc_row-o-equal-height/.test(r.className)) f.push('EQH');
    if (/content-middle|columns-middle/.test(r.className)) f.push('VCENTER');
    if (/content-bottom/.test(r.className)) f.push('VBOTTOM');

    L.push(
      `ROW ${i} h=${rc.height | 0} pad=${px(s.paddingTop)}/${px(s.paddingBottom)} ` +
      `bg=${bs ? bs.backgroundColor : s.backgroundColor} img=${bs ? bn(bs.backgroundImage) : '-'} ` +
      `pos=${bs ? bs.backgroundPosition : '-'} ` +
      `ovl=${ov ? getComputedStyle(ov).opacity + ' ' + getComputedStyle(ov).backgroundColor : '-'} ` +
      `[${f.join(' ')}]`
    );

    const cols = [...r.querySelectorAll('.wpb_column')]
      .filter((c) => !c.parentElement.closest('.wpb_column'));

    cols.forEach((c) => {
      const span = (c.className.match(/vc_col-sm-(\d+)/) || [])[1];
      const padc = (c.className.match(/padding-([\w-]+)-percent/) || [])[1];
      L.push(
        `  COL span${span} w=${c.getBoundingClientRect().width | 0} ` +
        `pad%=${padc || '-'} pad=${getComputedStyle(c).padding}`
      );

      const seen = new Set();
      const sel = 'h1,h2,h3,h4,h5,h6,.nectar-button,.wpcf7,.nectar-flickity,' +
        '.nectar-slider-wrap,img,.divider-wrap,.wpb_text_column,blockquote,' +
        '.img-with-aniamtion-wrap,[data-animation]';

      c.querySelectorAll(sel).forEach((el) => {
        if (seen.has(el)) return;
        const tag = el.tagName.toLowerCase();
        const cls = (typeof el.className === 'string' ? el.className : '')
          .replace(/vc_custom_\d+/g, 'VC');

        // ── Flickity carousel: the data attributes are the only record
        //    of the column counts and timing.
        if (el.matches('.nectar-flickity')) {
          [...el.querySelectorAll('*')].forEach((x) => seen.add(x));
          seen.add(el);
          const d = (n) => el.getAttribute('data-' + n) || '-';
          const slider = el.querySelector('.flickity-slider');
          const cells = slider ? [...slider.children] : [];
          L.push(
            `    CAROUSEL/flickity cols=${d('desktop-columns')}/${d('small-desktop-columns')}` +
            `/${d('tablet-columns')}/${d('phone-columns')} spacing=${d('spacing')} ` +
            `overflow=${d('overflow')} autoplay=${d('autoplay')}@${d('autoplay-dur')} ` +
            `wrap=${d('wrap')} controls=${d('controls')} shadow=${d('shadow')} cells=${cells.length}`
          );
          cells.slice(0, 12).forEach((ce) => {
            const im = ce.querySelector('img');
            const cap = ce.querySelector('h1,h2,h3,h4,h5,h6,.caption,p');
            L.push(
              `      CELL img=${im ? bn(im.getAttribute('src')) : '-'} ` +
              `${im ? (im.getBoundingClientRect().width | 0) + 'x' + (im.getBoundingClientRect().height | 0) : ''} ` +
              `cap="${cap ? T(cap).slice(0, 40) : ''}" href=${ce.querySelector('a')?.getAttribute('href') || '-'}`
            );
          });
          return;
        }

        // ── Nectar (swiper) slider — the other carousel Salient ships.
        if (el.matches('.nectar-slider-wrap')) {
          [...el.querySelectorAll('*')].forEach((x) => seen.add(x));
          seen.add(el);
          const d = (n) => el.getAttribute('data-' + n) || '-';
          L.push(
            `    CAROUSEL/nectar-slider h=${px(getComputedStyle(el).height)} ` +
            `style=${d('overall_style')} autorotate=${d('autorotate')} ` +
            `parallax=${d('parallax')} fullwidth=${d('full-width')} ` +
            `slides=${el.querySelectorAll('.swiper-slide').length}`
          );
          return;
        }

        if (/^h[1-6]$/.test(tag)) {
          const q = getComputedStyle(el);
          const split = el.closest('.nectar-split-heading');
          L.push(
            `    ${tag} ${q.fontFamily.split(',')[0].replace(/["']/g, '')} ` +
            `${px(q.fontSize)}/${px(q.lineHeight)} w${q.fontWeight} ls=${q.letterSpacing} ` +
            `${q.color} ${q.textAlign} ${q.textTransform} mb${px(q.marginBottom)} ` +
            `${split ? 'SPLIT[' + (split.getAttribute('data-text-effect') || '') + ' ' + (split.getAttribute('style') || '') + '] ' : ''}` +
            `"${T(el).slice(0, 60)}"`
          );
          return;
        }

        if (el.matches('.nectar-button')) {
          const q = getComputedStyle(el);
          L.push(
            `    BTN [${cls.replace(/nectar-button/, '').trim().slice(0, 55)}] bg=${q.backgroundColor} ` +
            `col=${q.color} bd=${q.borderTopWidth} ${q.borderTopColor} r=${q.borderRadius} ` +
            `pad=${q.padding} fs=${px(q.fontSize)} ls=${q.letterSpacing} "${T(el).slice(0, 40)}"`
          );
          return;
        }

        if (el.matches('.wpcf7')) {
          L.push(`    FORM fields=${[...el.querySelectorAll('input,textarea,select')].map((x) => x.name || x.type).join(',')}`);
          const inp = el.querySelector('input[type=text],input[type=email]');
          if (inp) {
            const q = getComputedStyle(inp);
            L.push(
              `      INPUT bg=${q.backgroundColor} bd=${q.borderTopWidth} ${q.borderTopStyle} ` +
              `${q.borderTopColor} r=${q.borderRadius} pad=${q.padding} fs=${px(q.fontSize)} ` +
              `lh=${px(q.lineHeight)} col=${q.color}`
            );
          }
          const sub = el.querySelector('input[type=submit],button');
          if (sub) {
            const q = getComputedStyle(sub);
            L.push(`      SUBMIT bg=${q.backgroundColor} col=${q.color} pad=${q.padding} fs=${px(q.fontSize)} r=${q.borderRadius}`);
          }
          [...el.querySelectorAll('*')].forEach((x) => seen.add(x));
          return;
        }

        if (el.matches('.img-with-aniamtion-wrap,[data-animation]') && !/^h[1-6]$/.test(tag)) {
          const im = el.querySelector('img') || el;
          const anim = el.getAttribute('data-animation') || '-';
          if (anim !== '-') {
            L.push(
              `    ANIM ${anim} delay=${el.getAttribute('data-delay') || '-'} ` +
              `on=${tag}.${cls.slice(0, 50)} img=${im.tagName === 'IMG' ? bn(im.getAttribute('src')) : '-'} ` +
              `${im.tagName === 'IMG' ? (im.getBoundingClientRect().width | 0) + 'x' + (im.getBoundingClientRect().height | 0) : ''}`
            );
            if (im.tagName === 'IMG') seen.add(im);
            return;
          }
        }

        if (tag === 'img') {
          L.push(`    IMG ${bn(el.getAttribute('src'))} ${el.getBoundingClientRect().width | 0}x${el.getBoundingClientRect().height | 0} cls=${cls.slice(0, 60)}`);
          return;
        }

        if (el.matches('blockquote')) {
          const q = getComputedStyle(el);
          L.push(`    QUOTE ${q.fontFamily.split(',')[0].replace(/["']/g, '')} ${px(q.fontSize)}/${px(q.lineHeight)} w${q.fontWeight} bl=${q.borderLeftWidth} ${q.borderLeftColor} "${T(el).slice(0, 50)}"`);
          return;
        }

        if (el.matches('.divider-wrap')) {
          L.push(`    SPACER h=${px(getComputedStyle(el).height)} ${cls.slice(0, 45)}`);
          [...el.querySelectorAll('*')].forEach((x) => seen.add(x));
          return;
        }

        if (el.matches('.wpb_text_column')) {
          const q = getComputedStyle(el);
          L.push(`    TXT ${px(q.fontSize)}/${px(q.lineHeight)} ${q.color} ${q.textAlign} "${T(el).slice(0, 70)}"`);
          [...el.querySelectorAll('*')].forEach((x) => seen.add(x));
          return;
        }
      });
    });
  });

  return L.join('\n');
};

/** Render the audit into <body> so a whole-page text read returns it all. */
window.__show = function () {
  const p = document.createElement('pre');
  p.textContent = window.__AUDIT();
  document.body.replaceChildren(p);
  return p.textContent.length;
};

/**
 * Grep the CSSOM. `document.styleSheets` resolves what actually loaded,
 * including the sheets Salient injects at runtime.
 */
window.__g = function (re, limit) {
  const rx = new RegExp(re, 'i');
  const out = [];
  const walk = (list, media) => {
    for (let i = 0; i < list.length; i++) {
      const r = list[i];
      // Group rules (@media, @supports) carry children and no selector.
      if (r.cssRules && r.cssRules.length !== undefined && !r.selectorText) {
        walk(r.cssRules, r.conditionText || media);
        continue;
      }
      if (r.selectorText && rx.test(r.selectorText)) {
        out.push((media ? '@' + media + ' ' : '') + r.cssText.replace(/\s+/g, ' '));
      }
      if (out.length >= limit) return;
    }
  };
  const sheets = document.styleSheets;
  for (let i = 0; i < sheets.length; i++) {
    let rl;
    try { rl = sheets[i].cssRules; } catch (e) { continue; }  // cross-origin
    walk(rl, null);
    if (out.length >= limit) break;
  }
  return out;
};
