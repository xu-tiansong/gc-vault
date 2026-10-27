// 隐私政策 / 服务条款 / 关于 页面的中英文切换。单独成文件：网站的 CSP 不允许页面内联脚本。
// 默认英文；选择记在 localStorage 的 gcv.lang，和应用本体共用（在应用里切换过语言，这些页面也跟着变）。
(function () {
  var KEY = 'gcv.lang';
  var root = document.documentElement;
  var buttons = document.querySelectorAll('#langSwitch button');
  var titleEl = document.querySelector('title');
  var origTitle = titleEl ? titleEl.textContent : '';   // 形如 "隐私政策 / Privacy Policy — GC VAULT"

  function saved() {
    try { return localStorage.getItem(KEY) === 'zh' ? 'zh' : 'en'; } catch (e) { return 'en'; }
  }
  function apply(lang) {
    root.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en');
    for (var i = 0; i < buttons.length; i++) buttons[i].setAttribute('aria-pressed', String(buttons[i].getAttribute('data-lang') === lang));
    var parts = origTitle.split(' / ');
    if (titleEl && parts.length === 2) titleEl.textContent = (lang === 'zh' ? parts[0] : parts[1].split(' — ')[0]) + ' — GC VAULT';
  }
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', function (e) {
      var lang = e.currentTarget.getAttribute('data-lang') === 'zh' ? 'zh' : 'en';
      try { localStorage.setItem(KEY, lang); } catch (err) { /* 写不进去也不影响显示 */ }
      apply(lang);
      scrollToAnchor();
    });
  }
  function scrollToAnchor() {
    var name = location.hash.replace(/^#/, '');
    if (!name) return;
    var els = document.querySelectorAll('[data-anchor="' + name + '"]');
    for (var i = 0; i < els.length; i++) { if (els[i].offsetParent !== null) { els[i].scrollIntoView(); return; } }
  }
  apply(saved());
  scrollToAnchor();
})();
