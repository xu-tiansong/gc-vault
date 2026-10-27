// 注入到用户当前页面（所有 frame）里执行，读取"刚才在输入的那个框"。必须是自包含的函数（会被序列化后送进页面）。
// 返回 null 表示这个 frame 里没有可读的内容；否则返回 { kind, value, selected, label, type, host, frameUrl, title, shadow }。
// 取值依据 document.activeElement：点工具栏图标 / 按快捷键 / 右键菜单时，页面里的焦点元素并不会变。
function gcvCapture() {
  const SKIP = new Set(['checkbox', 'radio', 'button', 'submit', 'reset', 'file', 'image', 'hidden', 'range', 'color']);

  // 沿着 Shadow DOM（open 模式）一层层往里找真正的焦点元素
  let el = document.activeElement;
  let depth = 0;
  while (el && el.shadowRoot && el.shadowRoot.activeElement && depth++ < 20) el = el.shadowRoot.activeElement;
  const inShadow = depth > 0;

  const base = { host: location.hostname, frameUrl: location.href, title: document.title, shadow: inShadow };
  const labelOf = (e) => {
    const parts = [];
    try { if (e.labels && e.labels[0]) parts.push(e.labels[0].innerText); } catch (_) { /* ignore */ }
    for (const a of ['aria-label', 'placeholder', 'name', 'autocomplete', 'title']) { const v = e.getAttribute && e.getAttribute(a); if (v) parts.push(v); }
    return parts.map(s => String(s).trim()).filter(Boolean)[0] || '';
  };

  const sel = (() => { try { return String(window.getSelection() || ''); } catch (_) { return ''; } })();

  if (el && el !== document.body && el !== document.documentElement && el.tagName !== 'IFRAME' && el.tagName !== 'FRAME') {
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      const type = tag === 'TEXTAREA' ? 'textarea' : (el.type || 'text').toLowerCase();
      if (!SKIP.has(type)) {
        let value = el.value || '';
        let selected = false;
        try { if (el.selectionStart != null && el.selectionEnd != null && el.selectionStart !== el.selectionEnd) { value = value.slice(el.selectionStart, el.selectionEnd); selected = true; } } catch (_) { /* 有些类型不支持选区 */ }
        if (value) return { ...base, kind: 'field', type, value, selected, label: labelOf(el) };
      }
    } else if (el.isContentEditable) {
      const value = sel || el.innerText || '';
      if (value.trim()) return { ...base, kind: 'editable', type: 'contenteditable', value: value.trim(), selected: !!sel, label: labelOf(el) };
    }
  }
  if (sel.trim()) return { ...base, kind: 'selection', type: 'selection', value: sel.trim(), selected: true, label: '' };
  return null;
}
