// GC VAULT Quick Save：快捷键 / 右键菜单 → 读取当前输入框 → 暂存（只在浏览器内存里）→ 打开小窗（已经开着就复用）→ 小窗页面来要，才交给它。
importScripts('capture.js');   // 提供 gcvCapture

const VAULT_URL = 'https://vault.xuts.net/';
// 开发 / 测试时可以在扩展自己的存储里设置 vaultUrl 指向本地构建；网页读不到、改不了这个值
const targetUrl = async () => (await chrome.storage.local.get('vaultUrl')).vaultUrl || VAULT_URL;
const TTL = 10 * 60 * 1000;
const msg = (k) => chrome.i18n.getMessage(k) || k;

chrome.runtime.onInstalled.addListener((details) => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'save', title: msg('menuSave'), contexts: ['editable', 'selection'] });
  });
  // 第一次安装：打开"关于"页的扩展介绍（快捷键怎么用）
  if (details.reason === 'install') void targetUrl().then(u => chrome.tabs.create({ url: u + 'about.html#extension' }));
});

const hostOf = (url) => { try { const u = new URL(url); return /^https?:$/.test(u.protocol) ? u.hostname : ''; } catch (_) { return ''; } };

async function scan(tab) {
  const results = await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, func: gcvCapture });
  const hits = results.filter(r => r && r.result && r.result.value).map(r => ({ ...r.result, frameId: r.frameId }));
  // 优先选"输入框"，其次才是选中的文字
  const best = hits.find(h => h.kind === 'field') || hits.find(h => h.kind === 'editable') || hits[0];
  return { best, frames: results.length };
}

// 注意：activeTab 只覆盖顶层页面，读不到跨域 iframe 里的输入框（1.0 版不支持，用户可在小窗里手动填写；以后可以作为更新加回按需授权）。
async function capture(tab) {
  if (!tab || tab.id == null) return { error: 'no tab' };
  const host = hostOf(tab.url);
  let first;
  try {
    first = await scan(tab);
  } catch (e) {
    return { error: 'restricted', restricted: true, host, detail: String(e && e.message || e) };   // chrome:// 页面、应用商店等不允许注入
  }
  if (first.best) return { item: first.best, frames: first.frames };

  return { error: 'nothing', host, frames: first.frames };
}

// 小窗已经开着（用户在里面已经打开了保险箱）：把新内容送进同一个窗口，不另开
async function reuseWindow(pending, cap) {
  if (!pending || pending.windowId == null || pending.tabId == null) return false;
  try { await chrome.windows.get(pending.windowId); } catch (_) { return false; }
  await chrome.storage.session.set({ pending: { ...pending, createdAt: Date.now(), cap } });
  try { await chrome.windows.update(pending.windowId, { focused: true }); } catch (_) { /* ignore */ }
  // 页面此刻可能正在跳转（比如 Google 登录中）没有中转脚本：送不到也没关系，页面回来后握手时会拿到新内容
  try { await chrome.tabs.sendMessage(pending.tabId, { type: 'gcv-push', cap }); } catch (_) { /* ignore */ }
  return true;
}

async function run(tab, url) {
  const cap = await capture(tab);
  const { pending: old } = await chrome.storage.session.get('pending');
  if (await reuseWindow(old, cap)) return;
  url = url || await targetUrl();
  const win = await chrome.windows.create({ url, type: 'popup', width: 440, height: 700 });
  await chrome.storage.session.set({ pending: { createdAt: Date.now(), cap, windowId: win.id, tabId: win.tabs && win.tabs[0] && win.tabs[0].id } });
}

chrome.commands.onCommand.addListener((cmd, tab) => { if (cmd === 'save-to-vault') void run(tab); });
chrome.contextMenus.onClicked.addListener((info, tab) => { if (info.menuItemId === 'save') void run(tab); });
chrome.action.onClicked.addListener(tab => { void run(tab); });

// 小窗页面里的中转脚本来要内容：只交给"自己打开的那个标签页"，用过期时间兜底
chrome.runtime.onMessage.addListener((m, sender, sendResponse) => {
  (async () => {
    const { pending } = await chrome.storage.session.get('pending');
    const ok = pending && sender.tab && sender.tab.id === pending.tabId && Date.now() - pending.createdAt < TTL;
    if (m && m.type === 'gcv-hello') { sendResponse(ok ? { cap: pending.cap } : { cap: null }); return; }
    if (m && m.type === 'gcv-done') {
      if (ok) {
        await chrome.storage.session.remove('pending');
        if (m.close !== false && sender.tab.windowId != null) chrome.windows.remove(sender.tab.windowId);   // 保存成功才关窗；用户放弃只清暂存
      }
      sendResponse({ ok: !!ok });
    }
  })();
  return true;   // 异步回应
});

// 窗口被关掉：清掉暂存
chrome.windows.onRemoved.addListener(async (windowId) => {
  const { pending } = await chrome.storage.session.get('pending');
  if (pending && pending.windowId === windowId) await chrome.storage.session.remove('pending');
});
