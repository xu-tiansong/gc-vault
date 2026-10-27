# GC VAULT Quick Save（浏览器扩展）

用户在任意网页的输入框里输入（或选中）内容后，按 **Alt+Shift+V**、右键选"Save to GC VAULT"或点工具栏图标，扩展读取当前输入框，打开一个小窗加载网页应用（vault.xuts.net），由网页应用负责输入主密钥、选文件、加密和保存。**扩展本身不接触主密钥、令牌和保险箱。**

这个目录随部署仓库一起公开在 GitHub（不含 `spike/` 测试页）；服务器不对外提供它。

## 数据流
1. 触发（快捷键 / 右键菜单 / 工具栏图标）→ 扩展获得对当前标签页的临时访问（activeTab）。
2. `capture.js` 在页面（所有 frame）里读 `document.activeElement`（输入框、textarea、contenteditable、open 模式的 Shadow DOM；没有焦点时读选中的文字）。
3. 暂存在 `chrome.storage.session`（只在浏览器内存里，关浏览器清空，10 分钟过期）。
4. `chrome.windows.create` 打开 `https://vault.xuts.net/` 的小窗（popup 类型），**网址里不带任何内容**。
5. 小窗页面加载后发 `{gcv:'page-ready', nonce}`；`bridge.js`（只在 vault.xuts.net 运行）核对来源，向后台要暂存内容，后台只交给"自己打开的那个标签页"，再用同一个 nonce 回给页面。
6. 网页应用（`src/state/quick.ts`）校验、清理（`src/lib/quick.ts`）、给出名称和标签的建议，显示提示条；用户输入密钥、打开文件或新建后，弹出**预填好的添加窗口**，用户确认才加入；保存成功后发 `{gcv:'done', close:true}`，后台关闭小窗；用户点"放弃"发 `close:false`（只清暂存）。
7. 小窗里点云图标登录会整页跳转：回来后页面重新握手，后台还留着暂存，会再交一次。

## 体验细节（阶段 2）
- **没取到内容但知道网站**：仍打开小窗，提示条说明，添加窗口里名称和标签是域名、值留空、光标在值上，用户手动填。
- **受限页面**（chrome://、应用商店等不允许注入）：小窗里给出明确提示。
- **小窗已开着、保险箱已在用**：再触发时不另开窗口，新内容用同一个 nonce 推送进同一个窗口（`gcv-push`），直接弹出预填的添加窗口，可以连续存多条再一起保存；用户还没选文件时只更新提示条。页面正在跳转（比如 Google 登录中）收不到推送也没关系，回来后握手会拿到最新的。
- **界面语言**：右键菜单、授权窗、扩展描述走 `_locales`（en、zh_CN），跟随浏览器语言；小窗里的网页应用用它自己的语言设置。
- **第一次安装**：自动打开 `about.html#extension`（"关于"页的扩展介绍，会滚动到当前语言下可见的那一节）。

## 跨域 iframe（1.0 版不支持）
activeTab 只覆盖顶层页面，读不到跨域 iframe 里的输入框。为了让首次审核尽量快，1.0 版**没有申请任何可选的网站权限**；输入框在 iframe 里时走"没取到内容、手动填写"的路径（小窗里预填域名，值由用户自己粘贴）。以后想支持，可以作为更新加回：`optional_host_permissions` + 一个由用户点击触发的授权小窗（快捷键触发后再异步申请会报 "must be called during a user gesture"，所以必须有一个真正的点击）。取值函数 `gcvCapture` 本身已经能读 iframe 里的字段（`scripts/ext-spike.mjs` 用测试清单验证过）。

## 权限
`activeTab`、`scripting`、`contextMenus`、`storage`（只用 session 和一个开发用的 `vaultUrl`）；内容脚本只在 `https://vault.xuts.net/*` 运行。**没有 `host_permissions`，也没有可选的网站权限，不申请"读取所有网站"。**

## 文件
- `manifest.json` — Manifest V3。
- `background.js` — 快捷键、右键菜单、取值、暂存、开小窗（已开着就复用）、按需交付。
- `capture.js` — 注入页面的取值函数（`gcvCapture`）。
- `bridge.js` — vault.xuts.net 页面里的中转：握手、核对来源（`e.source === window`、同源、nonce）。
- `_locales/` — 界面文字（en、zh_CN）。
- `spike/` — 测试页（普通表单、跨域 iframe、Shadow DOM 和富文本）和假的接收页，仅用于测试。

## 网页应用这一侧
- `src/lib/quick.ts` — 校验、清理、名称和标签的建议（纯函数，有单元测试 `tests/quick.test.ts`）。名称规则放在网页应用里，改规则不用重新上架扩展。
- `src/state/quick.ts` — 握手、通知扩展、放弃。
- `src/ui/PendingBanner.tsx` — 提示条（入口页和主界面）。
- 待保存内容只放内存：不写任何存储、不输出到控制台；闲置超时（默认 300 秒）会丢弃并通知扩展。

## 手动测试（真实的快捷键和 activeTab）
```
npx vite build && npx vite preview --port 4173        # 网页应用（正式构建）
cd extension/spike && python -m http.server 4190        # 测试页
node scripts/make-ext-dev.mjs                           # 生成 extension-dev/（小窗打开本地的 4173）
```
在 `chrome://extensions` 打开开发者模式，加载 `extension-dev/`（不要同时装正式的 `extension/`，避免快捷键冲突）。打开 http://localhost:4190/ 的测试页，在输入框里输入后按 Alt+Shift+V。

## 自动测试
`node scripts/ext-e2e.mjs`（需要 4173 和 4190 两个服务器已经在运行）：用系统 Chrome 通过 DevTools 协议加载真实扩展，走完整条链路（取值 → 小窗 → 预填 → 保存 → 小窗自动关闭 → 暂存清除，以及放弃、关窗、别的标签页拿不到、没取到内容）。取值本身的各种场景用 `node scripts/ext-spike.mjs`。测试清单会给复制出来的扩展加上对测试页的 host_permissions，所以真实的 activeTab 授权和快捷键只能手动测。
网页应用一侧的对接（假的中转脚本）在 `tests/e2e/quick.spec.ts`，随 `npm run test:e2e` 一起跑。

## 打包和上架
`node scripts/pack-extension.mjs`（先检查再打包成 `extension-dist/*.zip`）；上架步骤、商店文案、权限理由、审核说明都在 `docs/extension-store.md`；商店图片用 `node scripts/make-store-assets.mjs` 生成到 `extension-store/`。

## 发布
网页应用一侧的改动照常 `npm run publish`；扩展本身单独打包 zip 上架商店（Chrome 应用商店"不公开"、Edge 加载项），不进部署仓库。消息协议以后升级时，网页应用要继续认旧版扩展。
