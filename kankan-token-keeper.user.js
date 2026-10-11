// ==UserScript==
// @name         看看新闻直播 token 自动续期
// @namespace    kankan-token-keeper
// @version      1.0
// @description  在直播流签名(volcTime)过期前，用隐藏 iframe 重新拿一份新签名地址，并无缝切换到播放器
// @match        https://live.kankanews.com/huikan*
// @run-at       document-idle
// @grant        none
// @homepageURL  https://github.com/iamlipan/kankan-token-keeper
// @downloadURL  https://raw.githubusercontent.com/iamlipan/kankan-token-keeper/main/kankan-token-keeper.user.js
// @updateURL    https://raw.githubusercontent.com/iamlipan/kankan-token-keeper/main/kankan-token-keeper.user.js
// ==/UserScript==
(function () {
  'use strict';
  if (window.top !== window.self) return;           // iframe 里不运行
  if (window.__kkKeeper) return;

  const LEAD = 120;   // 过期前多少秒开始续期
  const TICK = 15000; // 检查间隔
  const log = (...a) => console.log('%c[token-keeper]', 'color:#e33', ...a);
  const now = () => Math.floor(Date.now() / 1000);
  const vtOf = (u) => +((String(u || '').match(/volcTime=(\d+)/) || [])[1] || 0);
  const pathOf = (u) => String(u || '').split('?')[0];

  function findH(root) {
    let H = null;
    (function w(vm) { if (!vm || H) return; if (vm.$options && vm.$options.name === 'HuikanIndex') H = vm; (vm.$children || []).forEach(w); })(root);
    return H;
  }
  const curUrl = (H) => (H && H.player && H.player.config && H.player.config.url) || '';

  let busy = false;
  function fetchFreshUrl(H) {
    return new Promise((resolve) => {
      const want = pathOf(curUrl(H));
      const oldVt = vtOf(curUrl(H));
      const f = document.createElement('iframe');
      f.style.cssText = 'position:fixed;width:2px;height:2px;left:-10px;top:-10px;opacity:0;pointer-events:none;';
      f.src = location.href;
      document.body.appendChild(f);
      const t0 = Date.now();
      let switched = false;
      const done = (url) => {
        clearInterval(iv);
        try { const fh = findH(f.contentWindow.$nuxt); fh && fh.destroyPlayer && fh.destroyPlayer(); } catch (e) {}
        f.remove();
        resolve(url);
      };
      const iv = setInterval(() => {
        try {
          const w = f.contentWindow;
          w.document.querySelectorAll('video').forEach((v) => { v.muted = true; v.volume = 0; });
          const fh = w.$nuxt && findH(w.$nuxt);
          if (fh) {
            // 频道不一致时让 iframe 切到当前频道
            const wantId = H.currChannel && H.currChannel.id;
            if (!switched && fh.currChannel && fh.currChannel.id !== undefined && String(fh.currChannel.id) !== String(wantId)) {
              const target = (fh.channelList || []).find((c) => String(c.id) === String(wantId));
              if (target) { switched = true; try { fh.changeChannel(target); } catch (e) {} }
            }
            const u = curUrl(fh);
            if (u && pathOf(u) === want && vtOf(u) > oldVt) return done(u);
          }
        } catch (e) {}
        if (Date.now() - t0 > 40000) done(null);
      }, 1000);
    });
  }

  async function tick() {
    if (busy) return;
    const H = findH(window.$nuxt);
    if (!H || !H.player) return;
    const u = curUrl(H), vt = vtOf(u);
    if (!vt) return;
    const remain = vt - now();
    if (remain > (window.__kkLead || LEAD)) return;
    busy = true;
    log(`签名还剩 ${remain}s，开始续期…`);
    try {
      const fresh = await fetchFreshUrl(H);
      if (!fresh) { log('续期失败，下个周期重试'); return; }
      const P = H.player;
      if (typeof P.switchURL === 'function') {
        await P.switchURL(fresh);
      } else { P.src = fresh; }
      if (P.config) P.config.url = fresh;
      if (P.paused) P.play();
      log(`续期成功，新过期时间 ${new Date(vtOf(fresh) * 1000).toLocaleTimeString()}`);
    } catch (e) {
      log('续期出错', e);
    } finally { busy = false; }
  }

  window.__kkTick = tick;
  window.__kkKeeper = setInterval(tick, TICK);
  log('已启动');
})();
