// ============================================================
// 폰 상태 기록: 화면에는 보이지 않고, 서버에만 적어 둬요. (만든 사람이 물어보면 확인하는 용도)
// - 누구 폰으로 골랐는지, 무슨 폰·무슨 브라우저인지, 홈 화면에 설치해서 쓰는지,
//   알림을 허용했는지, 처음 연 때와 마지막으로 연 때, 몇 번째 접속인지.
// - 폰이 스스로 알려 주는 것만 적어요. 위치나 다른 앱은 보지 않아요.
// - 서버 기록의 pairs 에 "st:<기기 번호>" 로 들어가요.
// ============================================================
(function () {
  "use strict";
  const cfg = typeof DIARY_CONFIG !== "undefined" ? DIARY_CONFIG : {};
  const NAME = { him: cfg.him || "석영", her: cfg.her || "예은" };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const me = () => (window.Store && Store.me()) || "";
  const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { /* 그냥 둬요 */ } return null; };
  function did() {
    let d = ls("hsd.did");
    if (!d) { d = Date.now().toString(36) + Math.random().toString(36).slice(2, 8); ls("hsd.did", d); }
    return d;
  }
  // ---------- 이 폰이 스스로 아는 것 ----------
  function look(given) {
    const ua = given || navigator.userAgent || "";
    const ipad = /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    const pf = /iPhone/.test(ua) ? "아이폰" : ipad ? "아이패드" : /Android/.test(ua) ? "안드로이드 폰" : /Windows/.test(ua) ? "윈도우 컴퓨터" : /Macintosh/.test(ua) ? "맥" : "기타";
    let os = "";
    const mi = /OS (\d+)[_.](\d+)/.exec(ua), ma = /Android (\d+(?:\.\d+)?)/.exec(ua);
    if ((pf === "아이폰" || pf === "아이패드") && mi) os = `iOS ${mi[1]}.${mi[2]}`;
    else if (ma) os = `안드로이드 ${ma[1]}`;
    const br = /KAKAOTALK/i.test(ua) ? "카카오톡 안 브라우저" : /NAVER/i.test(ua) ? "네이버 앱" : /SamsungBrowser/.test(ua) ? "삼성 인터넷" : /CriOS|Chrome/.test(ua) && !/Edg/.test(ua) ? "크롬" : /Edg/.test(ua) ? "엣지" : /Safari/.test(ua) ? "사파리" : "기타";
    if (given) return { pf, os, br };
    let pwa = false;
    try { pwa = navigator.standalone === true || matchMedia("(display-mode: standalone)").matches || matchMedia("(display-mode: fullscreen)").matches; } catch (e) { /* 모르면 아님 */ }
    let noti = "none";
    try { if (window.Notification) noti = Notification.permission; } catch (e) { /* 지원하지 않음 */ }
    return { pf, os, br, pwa, noti, push: !!window.__pushOn };
  }
  const key = () => "st:" + did();
  const label = (c) => [c.pf, c.os, c.br, c.pwa ? "홈 화면 앱" : ""].filter(Boolean).join(" · ");
  // 서버의 기기 목록에 "어떤 폰인지" 한 줄 알려 둬요 (석영이의 기기 목록 화면에 보여요)
  let helloed = "";
  function hello() {
    if (!window.Store || !Store.call) return;
    const l = label(look());
    if (helloed === l) return;
    Promise.resolve(Store.call("/hello", { method: "POST", body: { ua: l, did: did() } })).then((r) => { if (r && r.ok) helloed = l; }).catch(() => {});
  }
  // 바뀐 게 있거나 마지막으로 적은 지 10분이 지났으면 적어요
  function report(force) {
    const w = me();
    if (!w || !window.Store) return;
    hello();
    const now = Date.now(), cur = look();
    const old = Store.pair(key(), w) || null;
    const v = Object.assign({ first: now, n: 0 }, old || {}, cur);
    if (cur.pwa && !(old && old.pwaAt)) v.pwaAt = now;
    if (!old || old.noti !== cur.noti) { v.notiAt = now; }
    const changed = !old || old.pwa !== cur.pwa || old.noti !== cur.noti || !!old.push !== cur.push || old.br !== cur.br || old.pf !== cur.pf || old.os !== cur.os;
    if (!changed && !force && now - (old.seen || 0) < 600000) return;
    if (force || !old || now - (old.seen || 0) > 600000) v.n = (old ? old.n || 0 : 0) + 1;
    v.seen = now;
    Store.setPair(key(), w, v);
  }
  let t = 0;
  function soon() { clearTimeout(t); t = setTimeout(() => report(false), 900); }
  if (window.Store) Store.onChange(() => { clearTimeout(t); t = setTimeout(() => { const w = me(); if (w && !Store.pair(key(), w)) report(true); }, 600); });
  document.addEventListener("DOMContentLoaded", soon);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) soon(); });
  // 알림 허용이 바뀌었는지 가끔 살펴요 (물어보는 창에 답한 직후를 잡으려고)
  setInterval(() => { if (!document.hidden) report(false); }, 20000);
  window.Phones = { report, did, label, ofUa: (ua) => look(ua) };
})();
