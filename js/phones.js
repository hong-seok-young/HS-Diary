// ============================================================
// 폰 소식: 두 사람의 폰이 지금 어떤 상태인지 서로 볼 수 있어요. (우체통 → "폰" 칸)
// - 누구 폰으로 골랐는지, 무슨 폰·무슨 브라우저인지, 홈 화면에 설치해서 쓰는지,
//   알림을 허용했는지, 처음 연 때와 마지막으로 연 때를 적어 둬요.
// - 숨기는 것 없이 둘 다 같은 화면을 봐요. 상대 폰에 새 소식이 생기면 알려 줘요.
// - 폰이 스스로 알려 주는 것만 적어요 (게임이나 다른 앱은 보지 않아요).
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
  function look() {
    const ua = navigator.userAgent || "";
    const ipad = /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    const pf = /iPhone/.test(ua) ? "아이폰" : ipad ? "아이패드" : /Android/.test(ua) ? "안드로이드 폰" : /Windows/.test(ua) ? "윈도우 컴퓨터" : /Macintosh/.test(ua) ? "맥" : "기타";
    let os = "";
    const mi = /OS (\d+)[_.](\d+)/.exec(ua), ma = /Android (\d+(?:\.\d+)?)/.exec(ua);
    if ((pf === "아이폰" || pf === "아이패드") && mi) os = `iOS ${mi[1]}.${mi[2]}`;
    else if (ma) os = `안드로이드 ${ma[1]}`;
    const br = /KAKAOTALK/i.test(ua) ? "카카오톡 안 브라우저" : /NAVER/i.test(ua) ? "네이버 앱" : /SamsungBrowser/.test(ua) ? "삼성 인터넷" : /CriOS|Chrome/.test(ua) && !/Edg/.test(ua) ? "크롬" : /Edg/.test(ua) ? "엣지" : /Safari/.test(ua) ? "사파리" : "기타";
    let pwa = false;
    try { pwa = navigator.standalone === true || matchMedia("(display-mode: standalone)").matches || matchMedia("(display-mode: fullscreen)").matches; } catch (e) { /* 모르면 아님 */ }
    let noti = "none";
    try { if (window.Notification) noti = Notification.permission; } catch (e) { /* 지원하지 않음 */ }
    return { pf, os, br, pwa, noti };
  }
  const key = () => "st:" + did();
  // 바뀐 게 있거나 마지막으로 적은 지 10분이 지났으면 적어요
  function report(force) {
    const w = me();
    if (!w || !window.Store) return;
    const now = Date.now(), cur = look();
    const old = Store.pair(key(), w) || null;
    const v = Object.assign({ first: now, n: 0 }, old || {}, cur);
    if (cur.pwa && !(old && old.pwaAt)) v.pwaAt = now;
    if (!old || old.noti !== cur.noti) { v.notiAt = now; }
    const changed = !old || old.pwa !== cur.pwa || old.noti !== cur.noti || old.br !== cur.br || old.pf !== cur.pf || old.os !== cur.os;
    if (!changed && !force && now - (old.seen || 0) < 600000) return;
    if (force || !old || now - (old.seen || 0) > 600000) v.n = (old ? old.n || 0 : 0) + 1;
    v.seen = now;
    Store.setPair(key(), w, v);
  }
  // ---------- 모아 보기 ----------
  function devices() {
    const out = [];
    if (!window.Store) return out;
    Store.pairKeys("st:").forEach((k) => ["him", "her"].forEach((w) => { const v = Store.pair(k, w); if (v && typeof v === "object") out.push(Object.assign({ id: k.slice(3), who: w, mine: k === key() && w === me() }, v)); }));
    out.sort((a, b) => (a.who === b.who ? (b.seen || 0) - (a.seen || 0) : a.who === "him" ? -1 : 1));
    return out;
  }
  const NOTI = { granted: "알림 허용함", denied: "알림 막아 둠", default: "알림 아직 안 정함", none: "이 브라우저는 알림을 못 써요" };
  const pad = (n) => String(n).padStart(2, "0");
  function when(t) {
    if (!t) return "";
    const d = new Date(t), n = new Date();
    const same = d.toDateString() === n.toDateString();
    return (same ? "오늘 " : `${d.getMonth() + 1}월 ${d.getDate()}일 `) + `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  function ago(t) {
    const m = Math.round((Date.now() - t) / 60000);
    return m < 2 ? "방금" : m < 60 ? `${m}분 전` : m < 1440 ? `${Math.round(m / 60)}시간 전` : `${Math.round(m / 1440)}일 전`;
  }
  // 일어난 일을 시간 순서로
  function events() {
    const ev = [];
    devices().forEach((d) => {
      const who = NAME[d.who], dev = `${d.pf}${d.os ? " " + d.os : ""} · ${d.br}`;
      ev.push({ t: d.first, who: d.who, id: d.id + ":first", text: `${who} 폰으로 고르고 앱을 처음 열었어요`, sub: dev });
      if (d.pwaAt) ev.push({ t: d.pwaAt, who: d.who, id: d.id + ":pwa", text: `${who} 폰이 홈 화면에 설치한 앱으로 열렸어요`, sub: dev });
      if (d.notiAt && d.noti !== "default" && d.noti !== "none") ev.push({ t: d.notiAt, who: d.who, id: d.id + ":noti:" + d.noti, text: d.noti === "granted" ? `${who} 폰이 알림을 허용했어요` : `${who} 폰이 알림을 막아 뒀어요`, sub: dev });
    });
    ev.sort((a, b) => b.t - a.t);
    return ev;
  }
  // 걱정되는 것 (같은 사람으로 고른 폰이 둘, 아직 안 들어온 사람)
  function warnings() {
    const ds = devices(), out = [];
    ["him", "her"].forEach((w) => {
      const mine = ds.filter((d) => d.who === w);
      if (!mine.length) out.push(`${NAME[w]} 폰은 아직 한 번도 안 들어왔어요.`);
      const phones = mine.filter((d) => d.pf === "아이폰" || d.pf === "안드로이드 폰");
      if (phones.length > 1) out.push(`${NAME[w]}으로 고른 폰이 ${phones.length}대예요. 한 사람이 잘못 골랐을 수 있어요.`);
    });
    return out;
  }
  function html() {
    const ds = devices(), ev = events(), warn = warnings();
    const card = (d) => `<div class="ph-card ${d.who}"><b>${esc(NAME[d.who])}${d.mine ? " (이 폰)" : ""}</b><span>${esc(d.pf)}${d.os ? " · " + esc(d.os) : ""} · ${esc(d.br)}</span>` +
      `<ul><li class="${d.pwa ? "ok" : "no"}">${d.pwa ? "홈 화면에 설치해서 쓰는 중" : d.pwaAt ? "설치는 했는데, 지금은 브라우저로 열었어요" : "홈 화면에 설치 안 함 (브라우저로 여는 중)"}</li>` +
      `<li class="${d.noti === "granted" ? "ok" : "no"}">${NOTI[d.noti] || NOTI.none}</li>` +
      `<li>처음 연 때 ${when(d.first)}</li><li>마지막으로 연 때 ${when(d.seen)} (${ago(d.seen)}) · ${d.n || 1}번째</li></ul></div>`;
    return (warn.length ? `<div class="ph-warn">${warn.map(esc).join("<br>")}</div>` : "") +
      (ds.length ? ds.map(card).join("") : `<p class="day-empty">아직 적힌 폰이 없어요</p>`) +
      (ev.length ? `<p class="ph-sub">일어난 일 (최근 것부터)</p>` + ev.map((e) => `<div class="ph-ev ${e.who}"><p>${esc(e.text)}</p><small>${when(e.t)} · ${esc(e.sub)}</small></div>`).join("") : "") +
      `<p class="ph-note">두 사람 모두 이 화면을 똑같이 볼 수 있어요. 폰이 스스로 알려 주는 것만 적혀요.</p>`;
  }
  // ---------- 상대 폰에 새 소식이 생기면 알려 줘요 ----------
  function seenSet() { try { return JSON.parse(ls("hsd.phseen") || "{}") || {}; } catch (e) { return {}; } }
  function fresh() { const s = seenSet(), w = me(); return events().filter((e) => e.who !== w && !s[e.id]); }
  function markSeen() { const s = seenSet(); events().forEach((e) => { s[e.id] = 1; }); ls("hsd.phseen", JSON.stringify(s)); }
  let told = {};
  function ping() {
    if (!me()) return;
    const f = fresh().filter((e) => !told[e.id]);
    if (!f.length) return;
    f.forEach((e) => { told[e.id] = 1; });
    const H = window.HSD || {};
    if (H.toast) H.toast(f[0].text + (f.length > 1 ? ` 외 ${f.length - 1}건` : ""));
    document.dispatchEvent(new CustomEvent("hsd:phones"));
  }
  let t = 0;
  function soon() { clearTimeout(t); t = setTimeout(() => { report(false); ping(); }, 900); }
  if (window.Store) Store.onChange(() => { clearTimeout(t); t = setTimeout(() => { const w = me(); if (w && !Store.pair(key(), w)) report(true); ping(); }, 600); });
  document.addEventListener("hsd:phones", () => { if (window.Notes && Notes.renderScene) Notes.renderScene(); });
  document.addEventListener("DOMContentLoaded", soon);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) soon(); });
  document.addEventListener("hsd:me", () => setTimeout(() => report(true), 300));
  // 알림 허용이 바뀌었는지 가끔 살펴요 (물어보는 창에 답한 직후를 잡으려고)
  setInterval(() => { if (!document.hidden) report(false); }, 20000);
  window.Phones = { report, devices, events, warnings, html, fresh, markSeen };
})();
