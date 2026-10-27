// 只在 vault.xuts.net 里运行：网页应用 ←→ 扩展后台 的中转。
// 握手：页面先发 { gcv: 'page-ready', nonce }；这里确认消息来自本页自己，再向后台要暂存的内容，用同一个 nonce 回给页面。
// 小窗已经开着时，后台还会主动推送新内容（gcv-push）：同样用握手时记下的 nonce 转给页面。
(() => {
  let lastNonce = null;
  const send = (cap) => window.postMessage({ gcv: 'pending', nonce: lastNonce, cap: cap || null }, location.origin);

  window.addEventListener('message', async (e) => {
    if (e.source !== window || e.origin !== location.origin) return;
    const d = e.data;
    if (!d || typeof d !== 'object' || typeof d.nonce !== 'string' || d.nonce.length < 8 || d.nonce.length > 64) return;
    if (d.gcv === 'page-ready') {
      lastNonce = d.nonce;
      let res = null;
      try { res = await chrome.runtime.sendMessage({ type: 'gcv-hello' }); } catch (_) { /* 扩展刚被重新加载 */ }
      send(res && res.cap);
    } else if (d.gcv === 'done') {
      try { await chrome.runtime.sendMessage({ type: 'gcv-done', close: d.close !== false }); } catch (_) { /* ignore */ }
    }
  });

  chrome.runtime.onMessage.addListener((m) => {
    if (m && m.type === 'gcv-push' && lastNonce) send(m.cap);
  });
})();
