# GC VAULT

**English** · [中文](#中文)

A personal encrypted vault that runs entirely in your browser. Keep account names, passwords, recovery codes, card numbers and licence keys in a single encrypted `.xgcv` file that you control.

Live app: **https://vault.xuts.net**

> **GC = Guardian & Crypto.** The Guardian keeps your private information safe; Crypto is how it does it.

## Features

- **Encryption happens in your browser.** The master key and the plaintext never leave the page and are never sent to any server.
- **Your data stays with you.** A vault is one `.xgcv` file kept on your computer, phone, or your own Google Drive. The app stores none of your files.
- **One master key.** No accounts, no sign-up, no password reset, no back door. Lose the key and the vault cannot be recovered.
- **Standard cryptography only.** Browser Web Crypto: PBKDF2-SHA256 (1,000,000 iterations by default) derives the key, AES-256-GCM encrypts every value, with a random salt per file and a random nonce per ciphertext.
- **Recoverable without this app.** One value's ciphertext plus the master key can be decrypted with the standalone tools in [`tools/`](tools/), even if the site no longer exists.
- **Optional Google Drive sync.** Only the `drive.file` scope is requested, so the app sees only files it created. Files are encrypted before upload.
- **No analytics, no ads, no third-party scripts.** Even the font is served from the site itself.
- **Installable PWA** that also works offline. Chinese and English UI.
- **Browser extension** (Chrome / Edge, desktop): press `Alt+Shift+V` on any page to save the field you just typed into your vault.

What it does *not* do: names, tags and (unless "Encrypt notes" is on) notes are plaintext; it is not a team-sharing tool; it does not back up your files automatically.

## What is in this repository

This repository contains the **built, deployable site** and its companion pieces — not the application's TypeScript source.

| Path | Contents |
|---|---|
| `index.html`, `main.html`, `assets/`, `sw.js`, `manifest.webmanifest`, `icons/` | The built web app (minified) |
| `about.html`, `privacy.html`, `terms.html` | User guide, privacy policy, terms of service |
| [`extension/`](extension/) | Source of the *GC VAULT Quick Save* browser extension (Manifest V3, plain JavaScript) |
| [`tools/`](tools/) | `decrypt.html` / `decrypt.py` (standalone decryption) and `upgrade.html` (old-format file upgrade) |
| `licenses/` | Third-party licence texts (Montserrat font, SIL OFL 1.1) |

## Self-hosting

The site is fully static. Serve the repository root over **HTTPS** with any static web server (Caddy, nginx, GitHub Pages, …).

- Local files and the standalone tools work with no further setup.
- **Google Drive sign-in is optional** and needs your own back end: a Google Cloud OAuth *Web application* client plus a small token relay that exchanges and refreshes tokens (the official site uses a Cloudflare Worker at `/oauth/*`). The client ID in the built bundle belongs to the official site; to host your own copy with Drive support you would need to build the app from source with your own client ID. Without it, simply use local files.
- The extension and its content script are bound to `https://vault.xuts.net/`. For your own domain, change `VAULT_URL` in `extension/background.js` and the `matches` in `extension/manifest.json`.

## Standalone decryption

Every value is a string like `zt3.<iterations>.<salt>.<iv>.<ciphertext>` (last three parts base64url, no padding):

```
key       = PBKDF2-HMAC-SHA256(NFC(password) as UTF-8, salt, iterations, 32 bytes)
plaintext = AES-256-GCM-decrypt(key, iv, ciphertext || tag), no AAD, UTF-8
```

```bash
pip install cryptography
python tools/decrypt.py zt3.1000000.<salt>.<iv>.<ciphertext>   # prompts for the key (no echo)
```

Or open `tools/decrypt.html` in a browser (works offline).

## Browser extension

[`extension/`](extension/) is the source of *GC VAULT Quick Save*. It requests only `activeTab`, `scripting`, `contextMenus` and `storage`, has no host permissions, never touches the master key, and reads a field only at the moment you trigger it. Captured text is held in browser memory for at most 10 minutes. Install it from the [Chrome Web Store](https://chromewebstore.google.com/detail/gc-vault-quick-save/lbekpaeomkihcjiggejlagcnjiicnibb), or load the `extension/` folder as an unpacked extension in developer mode.

## Security

- If you find a vulnerability, please report it privately through GitHub's **Security → Report a vulnerability** on this repository rather than a public issue.
- Because the bundle is minified, a technical review is easier against the documented format and the standalone tools than against the bundle itself.

## Privacy

See [privacy.html](privacy.html) and [terms.html](terms.html). In short: no analytics, no tracking, no accounts; vault contents and master keys never reach any server.

## License

[MIT](LICENSE) © 2026 xu-tiansong. The Montserrat font is distributed under the SIL Open Font License 1.1 (see [`licenses/`](licenses/)).

---

<a id="中文"></a>

# GC VAULT(中文)

[English](#gc-vault) · **中文**

一个完全在浏览器里运行的个人加密保险箱。把账号、密码、恢复码、卡号、授权码等保存在由你自己掌控的单个加密文件(`.xgcv`)里。

在线使用:**https://vault.xuts.net**

> **GC = Guardian & Crypto(守护 + 密码学)**:Guardian 守护你的私密信息,Crypto 是它的手段。

## 特点

- **加密在你的浏览器里完成。** 主密钥和明文不会离开页面,也不会发送给任何服务器。
- **数据始终在你手里。** 保险箱就是一个 `.xgcv` 文件,可以放在电脑、手机,或你自己的 Google Drive。应用本身不保存你的任何文件。
- **只有一个主密钥。** 没有账号、没有注册、没有找回密码,也没有后门。丢了密钥,保险箱就无法恢复。
- **只用标准密码学。** 使用浏览器内置的 Web Crypto:PBKDF2-SHA256(默认 100 万次迭代)从主密钥派生密钥,再用 AES-256-GCM 逐条加密;每个文件有独立随机盐,每条密文有独立随机 nonce。
- **不依赖本应用也能还原。** 只需要一条值的密文加上主密钥,就能用 [`tools/`](tools/) 里的独立工具解密,即使网站不在了也可以。
- **可选的 Google Drive 同步。** 只申请 `drive.file` 权限,应用只能看到它自己创建的文件;上传前已经加密。
- **无统计、无广告、无第三方脚本。** 连字体都由本站自己提供。
- **可安装的 PWA**,支持离线使用,界面有中文和英文。
- **浏览器扩展**(Chrome / Edge 桌面版):在任意网页输入后按 `Alt+Shift+V`,即可把刚输入的内容存入保险箱。

它**不能**做的事:名称、标签和(未开启"加密备注"时的)备注是明文;它不是团队共享工具;也不会自动备份你的文件。

## 仓库内容

本仓库是**已构建、可部署的网站**及其配套部分,**不包含**应用的 TypeScript 源码。

| 路径 | 内容 |
|---|---|
| `index.html`、`main.html`、`assets/`、`sw.js`、`manifest.webmanifest`、`icons/` | 构建好的网页应用(已压缩) |
| `about.html`、`privacy.html`、`terms.html` | 使用说明、隐私政策、服务条款 |
| [`extension/`](extension/) | *GC VAULT Quick Save* 浏览器扩展的源码(Manifest V3,纯 JavaScript) |
| [`tools/`](tools/) | `decrypt.html` / `decrypt.py`(独立解密)和 `upgrade.html`(旧格式文件升级) |
| `licenses/` | 第三方许可证(Montserrat 字体,SIL OFL 1.1) |

## 自己部署

网站是纯静态的。用任意静态服务器(Caddy、nginx、GitHub Pages 等)通过 **HTTPS** 提供仓库根目录即可。

- 本地文件和独立工具无需任何额外配置就能使用。
- **Google Drive 登录是可选的**,需要你自己的后端:一个 Google Cloud 的 OAuth *Web 应用*客户端,加一个负责交换和刷新令牌的小型中转服务(官方站点用的是 `/oauth/*` 路径下的 Cloudflare Worker)。构建产物里的客户端 ID 属于官方站点;如果想在自己的副本里支持 Drive,需要用你自己的客户端 ID 从源码重新构建。不需要 Drive 的话,直接使用本地文件即可。
- 扩展及其内容脚本绑定在 `https://vault.xuts.net/`。若使用自己的域名,请修改 `extension/background.js` 中的 `VAULT_URL` 和 `extension/manifest.json` 中的 `matches`。

## 独立解密

每个值都是这样的字符串:`zt3.<迭代次数>.<salt>.<iv>.<密文>`(后三段为 base64url,无填充):

```
key  = PBKDF2-HMAC-SHA256(NFC(密钥) 的 UTF-8, salt, 迭代次数, 32 字节)
明文 = AES-256-GCM 解密(key, iv, 密文 || tag),无 AAD,UTF-8
```

```bash
pip install cryptography
python tools/decrypt.py zt3.1000000.<salt>.<iv>.<密文>   # 会提示输入密钥(不回显)
```

也可以直接在浏览器里打开 `tools/decrypt.html`(可离线使用)。

## 浏览器扩展

[`extension/`](extension/) 是 *GC VAULT Quick Save* 的源码。它只申请 `activeTab`、`scripting`、`contextMenus`、`storage` 四项权限,没有任何网站访问权限,从不接触主密钥,只在你触发的那一刻读取输入框。读取到的内容最多只在浏览器内存中保留 10 分钟。你可以从 [Chrome 应用商店](https://chromewebstore.google.com/detail/gc-vault-quick-save/lbekpaeomkihcjiggejlagcnjiicnibb)安装,也可以在开发者模式下把 `extension/` 文件夹作为"已解压的扩展程序"加载。

## 安全

- 如果你发现了漏洞,请通过本仓库 GitHub 的 **Security → Report a vulnerability** 私下报告,不要公开提 issue。
- 由于网页应用的构建产物经过压缩,对照已公开的文件格式和独立工具来审查,会比直接读构建产物更容易。

## 隐私

见 [privacy.html](privacy.html) 和 [terms.html](terms.html)。简而言之:没有统计、没有跟踪、没有账号;保险箱内容和主密钥不会到达任何服务器。

## 许可证

[MIT](LICENSE) © 2026 xu-tiansong。Montserrat 字体按 SIL Open Font License 1.1 分发(见 [`licenses/`](licenses/))。
