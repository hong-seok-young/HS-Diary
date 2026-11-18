// ============================================================
// 바뀐 곳만 고쳐 그리기
// innerHTML 을 통째로 갈아 끼우면 그림이 깜빡이고 애니메이션이 처음부터 다시 돌아요.
// 같은 자리의 같은 칸은 그대로 두고, 글자나 속성만 바꿔요.
// ============================================================
(function () {
  "use strict";

  const SVG = "http://www.w3.org/2000/svg";
  function keyOf(n) {
    if (n.nodeType !== 1) return "";
    const k = n.getAttribute("data-key") || n.getAttribute("data-id");
    return k ? n.nodeName + "#" + k : "";
  }
  function syncAttrs(x, y) {
    const ya = y.attributes;
    for (let i = 0; i < ya.length; i++) {
      const a = ya[i];
      if (x.getAttribute(a.name) !== a.value) x.setAttribute(a.name, a.value);
    }
    const xa = x.attributes;
    for (let i = xa.length - 1; i >= 0; i--) {
      const name = xa[i].name;
      if (!y.hasAttribute(name)) x.removeAttribute(name);
    }
  }
  function patchNode(x, y) {
    if (x.nodeType !== y.nodeType || x.nodeName !== y.nodeName) {
      x.replaceWith(y);
      return y;
    }
    if (x.nodeType !== 1) {
      if (x.nodeValue !== y.nodeValue) x.nodeValue = y.nodeValue;
      return x;
    }
    if (x.isEqualNode(y)) return x;
    // 도트 그림은 통째로 바꾸는 게 더 빨라요.
    if (x.namespaceURI === SVG) {
      x.replaceWith(y);
      return y;
    }
    // 지금 글을 쓰고 있는 칸은 건드리지 않아요.
    if (x === document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(x.nodeName)) return x;
    syncAttrs(x, y);
    if (x.nodeName === "INPUT" && x.value !== (y.getAttribute("value") || "") && x.type !== "file") x.value = y.getAttribute("value") || "";
    patchChildren(x, y);
    return x;
  }
  function patchChildren(a, b) {
    const old = Array.prototype.slice.call(a.childNodes);
    const news = Array.prototype.slice.call(b.childNodes);
    const keyed = new Map();
    old.forEach((n) => {
      const k = keyOf(n);
      if (k && !keyed.has(k)) keyed.set(k, n);
    });
    const used = new Set();
    let oi = 0;
    let ref = a.firstChild;
    for (let i = 0; i < news.length; i++) {
      const y = news[i];
      const k = keyOf(y);
      let x = null;
      if (k) {
        x = keyed.get(k) || null;
        if (x && used.has(x)) x = null;
      } else {
        while (oi < old.length && (used.has(old[oi]) || keyOf(old[oi]))) oi++;
        if (oi < old.length) x = old[oi++];
      }
      if (x) {
        used.add(x);
        if (x !== ref) a.insertBefore(x, ref);
        const r = patchNode(x, y);
        ref = r.nextSibling;
      } else {
        a.insertBefore(y, ref);
      }
    }
    old.forEach((n) => {
      if (!used.has(n) && n.parentNode === a) a.removeChild(n);
    });
  }
  const tpl = document.createElement("template");
  function morph(el, html) {
    if (!el) return;
    html = String(html == null ? "" : html);
    if (el.__html === html && el.childNodes.length) return;
    el.__html = html;
    if (!el.firstChild) {
      el.innerHTML = html;
      return;
    }
    tpl.innerHTML = html;
    patchChildren(el, tpl.content);
    tpl.innerHTML = "";
  }
  window.MORPH = morph;
})();
