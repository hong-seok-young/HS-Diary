// ============================================================
// 우리 달력: 홈 화면의 달력 한 장에 둘이 각자 일정을 적어요.
// - 날짜를 누르면 그날 일정이 아래에서 올라오고, 바로 적을 수 있어요.
// - 석영은 파랑, 예은은 분홍, 같이 하는 일정은 노랑 하트.
// - 100일 단위, 주년, 생일, 처음 만난 날도 달력에 별로 표시돼요.
// ============================================================
(function () {
  "use strict";

  const cfg = typeof DIARY_CONFIG !== "undefined" ? DIARY_CONFIG : {};
  const NAME = { him: cfg.him || "석영", her: cfg.her || "예은", both: "같이" };
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const pad = (n) => String(n).padStart(2, "0");
  const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ""); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
  const DOW = ["일", "월", "화", "수", "목", "금", "토"];

  let H = {};
  const now0 = new Date();
  let ym = { y: now0.getFullYear(), m: now0.getMonth() };
  let sel = keyOf(now0);
  let who = "me"; // 새 일정: 나 / 같이

  // ---------- 기념일 (날짜 → 이름들) ----------
  function special(d) {
    const out = [];
    const start = parse(cfg.startDate);
    if (start) {
      const n = Math.round((d - start) / 86400000) + 1;
      if (n >= 100 && n % 100 === 0) out.push(`${n}일`);
      if (d.getMonth() === start.getMonth() && d.getDate() === start.getDate()) {
        const y = d.getFullYear() - start.getFullYear();
        out.push(y > 0 ? `${y}주년` : y === 0 ? "우리 1일" : "");
      }
    }
    const met = parse(cfg.firstMet);
    if (met && d.getMonth() === met.getMonth() && d.getDate() === met.getDate() && d.getFullYear() >= met.getFullYear()) out.push("처음 만난 날");
    [["himBirthday", "him"], ["herBirthday", "her"]].forEach(([k, w]) => {
      const b = parse(cfg[k]);
      if (b && d.getMonth() === b.getMonth() && d.getDate() === b.getDate()) out.push(`${NAME[w]} 생일`);
    });
    return out.filter(Boolean);
  }
  function eventsOn(key) {
    return Store.list("cal").filter((e) => e.date === key).sort((a, b) => (a.time || "99") < (b.time || "99") ? -1 : (a.time || "99") > (b.time || "99") ? 1 : (a.c || 0) - (b.c || 0));
  }
  function byDate() {
    const map = {};
    Store.list("cal").forEach((e) => { (map[e.date] = map[e.date] || []).push(e); });
    return map;
  }
  const timeText = (t) => { if (!t) return ""; const [h, m] = t.split(":").map(Number); return `${h < 12 ? "오전" : "오후"} ${h % 12 || 12}${m ? ":" + pad(m) : "시"}`; };

  // ---------- 달력 그리기 ----------
  function render() {
    const el = $("homeCal");
    if (!el) return;
    const first = new Date(ym.y, ym.m, 1);
    const lead = first.getDay();
    const days = new Date(ym.y, ym.m + 1, 0).getDate();
    const rows = Math.ceil((lead + days) / 7);
    const today = keyOf(new Date());
    const map = byDate();
    let cells = "";
    for (let i = 0; i < rows * 7; i++) {
      const d = new Date(ym.y, ym.m, 1 - lead + i);
      const k = keyOf(d);
      const out = d.getMonth() !== ym.m;
      const ev = map[k] || [];
      const sp = special(d);
      const has = { him: ev.some((e) => e.who === "him"), her: ev.some((e) => e.who === "her"), both: ev.some((e) => e.who === "both") };
      const label = sp[0] || (ev[0] && ev[0].title) || "";
      cells += `<button class="cal-d${out ? " out" : ""}${k === today ? " today" : ""}${k === sel ? " sel" : ""}${d.getDay() === 0 ? " sun" : d.getDay() === 6 ? " sat" : ""}${sp.length ? " ann" : ""}" data-d="${k}"><b>${d.getDate()}</b><span class="cal-dots">${sp.length ? '<i class="star"></i>' : ""}${has.him ? '<i class="him"></i>' : ""}${has.her ? '<i class="her"></i>' : ""}${has.both ? '<i class="both"></i>' : ""}</span><small class="${sp.length ? "sp" : ev[0] ? ev[0].who : ""}">${esc(label)}</small></button>`;
    }
    const html = `<div class="cal-head"><button class="cal-nav" data-cal="prev" aria-label="이전 달"><i class="l"></i></button><b class="cal-title">${ym.y}년 ${ym.m + 1}월</b><button class="cal-nav" data-cal="next" aria-label="다음 달"><i class="r"></i></button><span class="cal-legend"><i class="him"></i>${esc(NAME.him)}<i class="her"></i>${esc(NAME.her)}<i class="both"></i>같이</span><button class="cal-today" data-cal="today">오늘</button></div>
      <div class="cal-week">${DOW.map((w, i) => `<i class="${i === 0 ? "sun" : i === 6 ? "sat" : ""}">${w}</i>`).join("")}</div>
      <div class="cal-grid" style="grid-template-rows:repeat(${rows},minmax(0,1fr))">${cells}</div>`;
    if (window.MORPH) MORPH(el, html); else el.innerHTML = html;
    if (H.panel && H.panel() === "day") renderDay();
  }

  // ---------- 그날 일정 ----------
  function renderDay() {
    const d = parse(sel);
    if (!d || !$("dayTitle")) return;
    const me = Store.me();
    const left = Math.round((d - parse(keyOf(new Date()))) / 86400000);
    $("dayTitle").innerHTML = `${d.getMonth() + 1}월 ${d.getDate()}일 <em>${DOW[d.getDay()]}요일</em><i>${left === 0 ? "오늘" : left > 0 ? `D-${left}` : `${-left}일 전`}</i>`;
    const sp = special(d), ev = eventsOn(sel);
    const html = sp.map((n) => `<div class="day-it sp"><i class="bar"></i><span class="n">${esc(n)}</span><em>기념일</em></div>`).join("") +
      ev.map((e) => `<div class="day-it ${esc(e.who)}"><i class="bar"></i>${e.time ? `<span class="t">${esc(timeText(e.time))}</span>` : ""}<span class="n">${esc(e.title)}</span><em>${esc(NAME[e.who] || "")}</em><button class="day-del" data-del="${esc(e.id)}" aria-label="지우기"></button></div>`).join("") +
      (!sp.length && !ev.length ? `<p class="day-empty">아직 일정이 없어요</p>` : "");
    if (window.MORPH) MORPH($("dayList"), html); else $("dayList").innerHTML = html;
    $("dayWho").innerHTML = `<button type="button" class="chip${who === "me" ? " active" : ""}" data-w="me">${esc(NAME[me] || "나")} 일정</button><button type="button" class="chip${who === "both" ? " active" : ""}" data-w="both">같이 하는 일정</button>`;
  }
  function pickDay(k, open) {
    sel = k;
    const d = parse(k);
    if (d && (d.getMonth() !== ym.m || d.getFullYear() !== ym.y)) ym = { y: d.getFullYear(), m: d.getMonth() };
    render();
    if (open && H.setPanel) { H.setPanel("day"); renderDay(); }
  }
  function move(n) {
    const d = new Date(ym.y, ym.m + n, 1);
    ym = { y: d.getFullYear(), m: d.getMonth() };
    const el = $("homeCal");
    render();
    const g = el && el.querySelector(".cal-grid");
    if (g && g.animate) g.animate([{ transform: `translateX(${n > 0 ? 18 : -18}px)`, opacity: 0.3 }, { transform: "none", opacity: 1 }], { duration: 180, easing: "ease-out" });
  }
  function add() {
    const me = Store.me();
    const title = $("dayText").value.trim();
    if (!me || !title) { $("dayText").focus(); return; }
    H.silently(() => Store.put("cal", { date: sel, time: $("dayTime").value || "", title, who: who === "both" ? "both" : me }));
    $("dayText").value = "";
    $("dayTime").value = "";
    render();
    renderDay();
    if (H.toast) H.toast("달력에 적었어요");
  }
  function bind(h) {
    H = h || {};
    const el = $("homeCal");
    if (!el) return;
    el.addEventListener("click", (ev) => {
      const nav = ev.target.closest("[data-cal]");
      if (nav) {
        if (nav.dataset.cal === "prev") move(-1);
        else if (nav.dataset.cal === "next") move(1);
        else { const t = new Date(); ym = { y: t.getFullYear(), m: t.getMonth() }; sel = keyOf(t); render(); }
        return;
      }
      const d = ev.target.closest(".cal-d");
      if (d) pickDay(d.dataset.d, true);
    });
    // 옆으로 쓸어서 달 넘기기
    let sx = 0, sy = 0, st = 0;
    el.addEventListener("touchstart", (ev) => { const t = ev.touches[0]; sx = t.clientX; sy = t.clientY; st = Date.now(); }, { passive: true });
    el.addEventListener("touchend", (ev) => {
      const t = ev.changedTouches[0];
      const dx = t.clientX - sx, dy = t.clientY - sy;
      if (Date.now() - st < 500 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.8) move(dx < 0 ? 1 : -1);
    }, { passive: true });
    $("dayForm").addEventListener("submit", (ev) => { ev.preventDefault(); add(); });
    $("dayWho").addEventListener("click", (ev) => { const b = ev.target.closest("[data-w]"); if (b) { who = b.dataset.w; renderDay(); } });
    $("dayList").addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-del]");
      if (!b) return;
      H.silently(() => Store.remove("cal", b.dataset.del));
      render();
      renderDay();
      if (H.toast) H.toast("지웠어요");
    });
  }
  // 오늘 일정 한 줄 (홈 말풍선용)
  function todayLine() {
    const ev = eventsOn(keyOf(new Date()));
    const sp = special(parse(keyOf(new Date())));
    if (sp.length) return `오늘은 ${sp[0]}!`;
    if (!ev.length) return "";
    return `오늘 일정: ${ev[0].time ? timeText(ev[0].time) + " " : ""}${ev[0].title}${ev.length > 1 ? ` 외 ${ev.length - 1}개` : ""}`;
  }

  window.Cal = { bind, render, renderDay, todayLine, special, timeText };
})();
