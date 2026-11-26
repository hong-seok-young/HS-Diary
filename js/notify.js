// ============================================================
// 알림: 상대가 무언가 남기거나 바꾸면 알려 줘요. (선물은 알리지 않아요)
// - 알리는 것: 쪽지, 기록·일기·일정·할 일(남김, 고침, 지움), 할 일 해냄, 댓글과 반응, 오늘의 질문 답, 오늘의 기분, 하트
// - 앱이 켜져 있으면 화면 아래 알림 글로, 꺼져 있으면 폰 알림으로 와요.
//   폰 알림은 내 폰이 "상대에게 알릴 말"을 저장할 때 같이 올리면 서버가 상대 폰에 보내 줘요 (server/worker.js).
// - 폰 알림을 받으려면 알림을 허용해야 해요. 아이폰은 홈 화면에 설치한 앱에서만 돼요.
// ============================================================
(function () {
  "use strict";
  const cfg = typeof DIARY_CONFIG !== "undefined" ? DIARY_CONFIG : {};
  const NAME = { him: cfg.him || "석영", her: cfg.her || "예은" };
  const batchim = (s) => { const c = String(s).charCodeAt(String(s).length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0; };
  const subj = (w) => NAME[w] + (batchim(NAME[w]) ? "이가" : "가");
  const me = () => (window.Store && Store.me()) || "";
  const other = (w) => (w === "him" ? "her" : "him");
  const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { /* 그냥 둬요 */ } return null; };
  const cut = (s, n) => { const t = String(s || "").replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n) + "…" : t; };
  const LAB = { entries: ["기록을", "log"], plans: ["할 일을", "plans"], diary: ["일기를", "diary"], cal: ["일정을", "home"] };
  const headOf = (col, r) => (col === "diary" ? cut(r.text, 60) : col === "cal" ? cut(r.title, 40) + (r.date ? ` · ${String(r.date).slice(5).replace("-", ".")}` : "") : cut(r.title || r.place || r.text, 50));

  // (who)가 (since) 뒤에 한 일들
  function events(who, since) {
    const St = window.Store, out = [];
    if (!St || !who) return out;
    const all = (c) => (St.listAll ? St.listAll(c) : St.list(c));
    const S = subj(who);
    Object.keys(LAB).forEach((col) => all(col).forEach((r) => {
      const lab = LAB[col][0], url = LAB[col][1];
      if (r.del) { if (r.u === who && r.t > since) out.push({ t: r.t, k: "del", title: `${S} ${lab} 지웠어요`, body: r.ti || "", tag: col + r.id, url }); return; }
      const made = r.c > since && (r.by || r.author) === who;
      if (made) out.push({ t: r.c, k: "new", title: `${S} ${lab} ${col === "cal" ? "등록했어요" : col === "diary" ? "썼어요" : col === "plans" ? "적었어요" : "남겼어요"}`, body: headOf(col, r), tag: col + r.id, url });
      if (col === "plans" && r.dn > since && r.dby === who && r.done) out.push({ t: r.dn, k: "done", title: `${S} 할 일을 해냈어요`, body: cut(r.title, 50), tag: "done" + r.id, url });
      else if (!made && r.u === who && r.t > since && r.t - (r.c || 0) > 3000 && !(col === "plans" && r.dn > since)) out.push({ t: r.t, k: "edit", title: `${S} ${lab} 고쳤어요`, body: headOf(col, r), tag: col + r.id, url });
    }));
    all("notes").forEach((r) => { if (!r.del && r.c > since && r.from === who) out.push({ t: r.c, k: "note", title: `${S} 쪽지를 보냈어요`, body: cut(r.text, 80), tag: "note" + r.id, url: "mail" }); });
    const pt = (k) => St.pairTime(k, who);
    St.pairKeys("m:").forEach((k) => { const v = St.pair(k, who); if (v && pt(k) > since) out.push({ t: pt(k), k: "mood", title: `${NAME[who]}의 오늘 기분`, body: window.Moods ? Moods.FEEL[Moods.feel(v)] || "" : "", tag: "mood", url: "home" }); });
    St.pairKeys("q:").forEach((k) => { if (St.pair(k, who) && pt(k) > since) out.push({ t: pt(k), k: "q", title: `${S} 오늘의 질문에 답했어요`, body: "나도 답하면 볼 수 있어요", tag: "q", url: "mail" }); });
    St.pairKeys("p:").forEach((k) => { const v = Number(St.pair(k, who)) || 0; if (v && pt(k) > since) out.push({ t: pt(k), k: "heart", title: `${S} 하트를 보냈어요`, body: `오늘 ${v}개째`, tag: "heart", url: "home" }); });
    const where = (id) => (St.get("entries", id) ? ["기록", "log"] : ["일기", "diary"]);
    St.pairKeys("dr:").forEach((k) => { if (St.pair(k, who) && pt(k) > since) { const w = where(k.slice(3)); out.push({ t: pt(k), k: "react", title: `${S} ${w[0]}에 반응을 남겼어요`, body: window.Moods ? Moods.name(St.pair(k, who)) : "", tag: "dr" + k, url: w[1] }); } });
    St.pairKeys("dc:").forEach((k) => { const v = St.pair(k, who); if (Array.isArray(v)) v.forEach((c) => { if (c && !c.d && c.t > since) { const w = where(k.slice(3)); out.push({ t: c.t, k: "cmt", title: `${S} ${w[0]}에 댓글을 달았어요`, body: cut(c.x, 80), tag: "dc" + c.i, url: w[1] }); } }); });
    out.sort((a, b) => a.t - b.t);
    return out;
  }

  // ---------- 앱이 켜져 있을 때: 상대가 한 일을 알림 글로 ----------
  let seenT = Number(ls("hsd.nseen")) || Date.now();
  let timer = 0;
  function check() {
    const w = me();
    if (!w) return;
    const evs = events(other(w), seenT);
    if (!evs.length) return;
    seenT = Math.max(seenT, evs[evs.length - 1].t);
    ls("hsd.nseen", String(seenT));
    if (document.hidden) return; // 안 보고 있을 때는 폰 알림이 대신 와요
    // 쪽지는 비행기가 날아와서 따로 알려 주고, 댓글과 반응은 단추의 점과 함께 여기서 알려요
    const show = evs.filter((e) => e.k !== "note");
    if (!show.length) return;
    const last = show[show.length - 1];
    const H = window.HSD || {};
    if (H.toast) H.toast(last.title + (last.body && last.k !== "q" ? `: ${cut(last.body, 24)}` : "") + (show.length > 1 ? ` (외 ${show.length - 1}건)` : ""));
  }
  if (window.Store) Store.onChange(() => { clearTimeout(timer); timer = setTimeout(check, 500); });

  // ---------- 내가 한 일을 상대 폰에 알리기 (저장할 때 같이 올려요) ----------
  let pushedT = Number(ls("hsd.npush")) || Date.now(), takenT = 0, heartAt = 0;
  if (!ls("hsd.npush")) ls("hsd.npush", String(pushedT));
  const outbox = {
    take() {
      const w = me();
      if (!w) return [];
      let evs = events(w, pushedT);
      takenT = evs.length ? evs[evs.length - 1].t : 0;
      // 하트는 연달아 눌러도 2분에 한 번만
      evs = evs.filter((e) => { if (e.k !== "heart") return true; if (Date.now() - heartAt < 120000) return false; return true; });
      // 같은 것(같은 tag)은 마지막 것만
      const by = {};
      evs.forEach((e) => { by[e.tag] = e; });
      return Object.keys(by).map((k) => by[k]).sort((a, b) => a.t - b.t).slice(-4).map((e) => ({ title: e.title, body: e.body, tag: e.tag, url: e.url, k: e.k }));
    },
    done() {
      if (!takenT) return;
      const w = me();
      if (events(w, pushedT).some((e) => e.k === "heart")) heartAt = Date.now();
      pushedT = Math.max(pushedT, takenT);
      ls("hsd.npush", String(pushedT));
    },
  };
  if (window.Store && Store.setOutbox) Store.setOutbox(outbox);

  // ---------- 폰 알림 받기 등록 ----------
  const b64ToBytes = (s) => { const t = atob(String(s).replace(/-/g, "+").replace(/_/g, "/")); const a = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) a[i] = t.charCodeAt(i); return a; };
  let pushOn = false, subbing = false;
  async function subscribe() {
    if (subbing || !me() || !("serviceWorker" in navigator) || !("PushManager" in window) || !window.Notification || Notification.permission !== "granted") return;
    subbing = true;
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const k = await Store.call("/push/key");
        if (!k || !k.key) return; // 서버가 아직 알림을 못 보내요
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(k.key) });
      }
      const j = sub.toJSON();
      const r = await Store.call("/push/sub", { method: "POST", body: { endpoint: j.endpoint, keys: j.keys } });
      pushOn = !!(r && r.ok);
      window.__pushOn = pushOn;
      if (window.Phones) Phones.report(false);
    } catch (e) { pushOn = false; } finally { subbing = false; }
  }
  // 알림 허용을 아직 안 정했으면, 앱을 처음 누를 때 한 번 물어봐요 (폰은 누르는 순간에만 물어볼 수 있어요)
  function ask() {
    try {
      if (!window.Notification || Notification.permission !== "default" || !me()) return;
      const p = Notification.requestPermission();
      if (p && p.then) p.then(() => subscribe());
    } catch (e) { /* 지원하지 않는 폰 */ }
  }
  let asked = false;
  document.addEventListener("click", () => { if (asked) return; if (!me()) return; asked = true; ask(); }, true);
  const boot = () => setTimeout(subscribe, 2500);
  if (document.readyState === "complete") boot(); else window.addEventListener("load", boot);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { setTimeout(subscribe, 1200); setTimeout(check, 800); } });
  if (window.Store && Store.onStatus) Store.onStatus(() => { if (!pushOn && Store.status && Store.status().state === "ok") subscribe(); });
  window.Notify = { events, subscribe, ask, pushOn: () => pushOn, outbox };
})();
