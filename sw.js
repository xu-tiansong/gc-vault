// Service Worker 模板。构建时由 vite.config.ts 的 swPlugin 填入缓存版本号和预缓存文件列表后输出为 /sw.js。
// 原则：只缓存应用自己的静态文件（让断网时也能打开）；其他一律不拦截——
// /phase0/、/tools/、Google Drive 接口、任何带密文的请求都直接走网络，绝不缓存。
const CACHE = 'zt-vault-1f8440ed7eb1';
const PRECACHE = [
  "/",
  "/about.html",
  "/assets/index-CZo-u_OV.js",
  "/assets/index-DN3WHHFZ.css",
  "/assets/montserrat-latin-700-normal-BdjcYUrC.woff2",
  "/google68e880aba90c2d26.html",
  "/icons/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/legal.css",
  "/legal.js",
  "/licenses/Montserrat-OFL.txt",
  "/main.html",
  "/manifest.webmanifest",
  "/privacy.html",
  "/terms.html"
];

self.addEventListener('install', e => {
  // 不自动 skipWaiting：新版本装好后等页面提示用户刷新（避免编辑到一半被换掉代码）
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('zt-vault-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const path = req.mode === 'navigate' && (url.pathname === '/' || url.pathname === '/index.html') ? '/' : url.pathname;
  if (!PRECACHE.includes(path)) return;
  e.respondWith(caches.match(path).then(hit => hit || fetch(req)));
});
