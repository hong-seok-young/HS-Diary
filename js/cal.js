// ============================================================
// 우리 달력: 홈 화면의 달력 한 장에 둘이 각자 일정을 적어요.
// - 날짜를 누르면 그날 일정이 자세히 보이고, 바로 적거나 고칠 수 있어요.
// - 일정마다 기간(며칠부터 며칠까지), 종일 또는 시간, 반복(매주, 매달, 매년), 메모를 적어요.
// - 석영은 파랑, 예은은 분홍, 같이 하는 일정은 노랑. 여러 날 일정은 달력에 긴 줄로 보여요.
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
  const days = (a, b) => Math.round((b - a) / 86400000);
  const DOW = ["일", "월", "화", "수", "목", "금", "토"];
  const REP = { "": "한 번", w: "매주", m: "매달", y: "매년" };

  let H = {};
  const now0 = new Date();
  let ym = { y: now0.getFullYear(), m: now0.getMonth() };
  let sel = keyOf(now0);
  let form = null; // 열려 있는 입력칸: { id, who, rep, all }

  // ---------- 기념일 (날짜 → 이름들) ----------
  function special(d) {
    const out = [];
    const start = parse(cfg.startDate);
    if (start) {
      const n = days(start, d) + 1;
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

  // ---------- 일정이 그날에 걸리는지 ----------
  // 돌려주는 값: 걸리지 않으면 -1, 걸리면 그 일정의 며칠째인지(0부터)
  function dayIndex(e, d) {
    const s = parse(e.date);
    if (!s) return -1;
    const span = Math.max(0, e.end ? days(s, parse(e.end) || s) : 0);
    const diff = days(s, d);
    if (diff < 0) return -1;
    if (!e.rep) return diff <= span ? diff : -1;
    if (e.rep === "w") { const k = diff % 7; return k <= Math.min(span, 6) ? k : -1; }
    for (let off = 0; off <= Math.min(span, 27); off++) {
      const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() - off);
      if (x < s) break;
      if (x.getDate() === s.getDate() && (e.rep === "m" || x.getMonth() === s.getMonth())) return off;
    }
    return -1;
  }
  const spanOf = (e) => { const s = parse(e.date); return Math.max(0, e.end && s ? days(s, parse(e.end) || s) : 0); };
  const sortKey = (e) => (e.all || !e.time ? "00:00" : e.time);
  function eventsOn(key) {
    const d = parse(key);
    if (!d) return [];
    return Store.list("cal").map((e) => ({ e, i: dayIndex(e, d) })).filter((x) => x.i >= 0)
      .sort((a, b) => (spanOf(b.e) - spanOf(a.e)) || (sortKey(a.e) < sortKey(b.e) ? -1 : sortKey(a.e) > sortKey(b.e) ? 1 : (a.e.c || 0) - (b.e.c || 0)));
  }
  function timeText(t) { if (!t) return ""; const [h, m] = t.split(":").map(Number); return `${h < 12 ? "오전" : "오후"} ${h % 12 || 12}${m ? ":" + pad(m) : "시"}`; }
  function whenText(e) {
    if (e.all || !e.time) return "종일";
    return timeText(e.time) + (e.time2 ? " ~ " + timeText(e.time2) : "");
  }
  const md = (d) => `${d.getMonth() + 1}.${d.getDate()}`;
  function rangeText(e) {
    const s = parse(e.date), span = spanOf(e);
    if (!s) return "";
    const one = `${md(s)}(${DOW[s.getDay()]})`;
    const r = span ? `${one} ~ ${md(parse(e.end))}(${DOW[parse(e.end).getDay()]}) · ${span + 1}일` : one;
    return e.rep === "w" ? `매주 ${DOW[s.getDay()]}요일${span ? ` (${span + 1}일씩)` : ""}` : e.rep === "m" ? `매달 ${s.getDate()}일${span ? ` (${span + 1}일씩)` : ""}` : e.rep === "y" ? `매년 ${s.getMonth() + 1}월 ${s.getDate()}일${span ? ` (${span + 1}일씩)` : ""}` : r;
  }

  // ---------- 달력 그리기 ----------
  function render() {
    const el = $("homeCal");
    if (!el) return;
    const first = new Date(ym.y, ym.m, 1);
    const lead = first.getDay();
    const dim = new Date(ym.y, ym.m + 1, 0).getDate();
    const rows = Math.ceil((lead + dim) / 7);
    const today = keyOf(new Date());
    const list = Store.list("cal");
    let cells = "";
    for (let i = 0; i < rows * 7; i++) {
      const d = new Date(ym.y, ym.m, 1 - lead + i);
      const k = keyOf(d);
      const out = d.getMonth() !== ym.m;
      const sp = special(d);
      const on = list.map((e) => ({ e, i: dayIndex(e, d) })).filter((x) => x.i >= 0);
      const single = on.filter((x) => !spanOf(x.e)), multi = on.filter((x) => spanOf(x.e));
      const has = { him: single.some((x) => x.e.who === "him"), her: single.some((x) => x.e.who === "her"), both: single.some((x) => x.e.who === "both") };
      const bars = multi.slice(0, 2).map((x) => `<u class="${esc(x.e.who)}${x.i === 0 ? " s" : ""}${x.i === spanOf(x.e) ? " e" : ""}"></u>`).join("");
      const lab = sp[0] || (on[0] && (on[0].i === 0 || d.getDay() === 0 || d.getDate() === 1 ? on[0].e.title : "")) || "";
      cells += `<button class="cal-d${out ? " out" : ""}${k === today ? " today" : ""}${k === sel ? " sel" : ""}${d.getDay() === 0 ? " sun" : d.getDay() === 6 ? " sat" : ""}${sp.length ? " ann" : ""}" data-d="${k}"><b>${d.getDate()}</b><span class="cal-dots">${sp.length ? '<i class="star"></i>' : ""}${has.him ? '<i class="him"></i>' : ""}${has.her ? '<i class="her"></i>' : ""}${has.both ? '<i class="both"></i>' : ""}</span><small class="${sp.length ? "sp" : on[0] ? esc(on[0].e.who) : ""}">${esc(lab)}</small><span class="cal-bars">${bars}</span></button>`;
    }
    const html = `<div class="cal-head"><button class="cal-nav" data-cal="prev" aria-label="이전 달"><i class="l"></i></button><b class="cal-title">${ym.y}년 ${ym.m + 1}월</b><button class="cal-nav" data-cal="next" aria-label="다음 달"><i class="r"></i></button><span class="cal-legend"><i class="him"></i>${esc(NAME.him)}<i class="her"></i>${esc(NAME.her)}<i class="both"></i>같이</span><button class="cal-today" data-cal="today">오늘</button></div>
      <div class="cal-week">${DOW.map((w, i) => `<i class="${i === 0 ? "sun" : i === 6 ? "sat" : ""}">${w}</i>`).join("")}</div>
      <div class="cal-grid" style="grid-template-rows:repeat(${rows},minmax(0,1fr))">${cells}</div>`;
    if (window.MORPH) MORPH(el, html); else el.innerHTML = html;
    if (H.panel && H.panel() === "day" && !form) renderDay();
    const nx = $("banNext");
    if (nx) { const line = nextLine(); if (nx.textContent !== line) nx.textContent = line; nx.hidden = !line; }
  }

  // ---------- 그날 일정 ----------
  function renderDay() {
    const d = parse(sel);
    if (!d || !$("dayTitle")) return;
    const me = Store.me();
    const left = days(parse(keyOf(new Date())), d);
    $("dayTitle").innerHTML = `${d.getMonth() + 1}월 ${d.getDate()}일 <em>${DOW[d.getDay()]}요일</em><i>${left === 0 ? "오늘" : left > 0 ? `D-${left}` : `${-left}일 전`}</i>`;
    const sp = special(d), ev = eventsOn(sel);
    const list = sp.map((n) => `<div class="day-it sp"><i class="bar"></i><div class="day-main"><b>${esc(n)}</b><small>기념일</small></div></div>`).join("") +
      ev.map(({ e, i }) => {
        const span = spanOf(e);
        const sub = [whenText(e), rangeText(e) + (span ? ` 중 ${i + 1}일째` : ""), NAME[e.who] || ""].filter(Boolean).join(" · ");
        return `<button class="day-it ${esc(e.who)}" data-edit="${esc(e.id)}"><i class="bar"></i><div class="day-main"><b>${esc(e.title)}</b><small>${esc(sub)}</small>${e.memo ? `<p>${esc(e.memo)}</p>` : ""}</div><i class="day-go"></i></button>`;
      }).join("") + (!sp.length && !ev.length ? `<p class="day-empty">아직 일정이 없어요</p>` : "");
    $("dayList").innerHTML = list;
    $("dayList").hidden = !!form;
    $("dayAdd").hidden = !!form || !me;
    const f = $("dayForm");
    f.hidden = !form;
    if (!form) return;
    $("dayFormTitle").textContent = form.id ? "일정 고치기" : "새 일정";
    $("dayDel").hidden = !form.id;
    $("dayTimes").hidden = form.all;
    f.querySelectorAll("[data-all]").forEach((b) => b.classList.toggle("on", (b.dataset.all === "1") === form.all));
    f.querySelectorAll("[data-w]").forEach((b) => { b.classList.toggle("on", b.dataset.w === form.who); if (b.dataset.w === "me") b.textContent = NAME[me] || "나"; });
    f.querySelectorAll("[data-r]").forEach((b) => b.classList.toggle("on", b.dataset.r === form.rep));
  }
  function openForm(e) {
    const me = Store.me();
    form = e ? { id: e.id, who: e.who === "both" ? "both" : "me", rep: e.rep || "", all: !!e.all || !e.time, owner: e.who === "both" ? me : e.who } : { id: "", who: "me", rep: "", all: true, owner: me };
    $("dayText").value = e ? e.title || "" : "";
    $("dayFrom").value = e ? e.date : sel;
    $("dayTo").value = e ? e.end || e.date : sel;
    $("dayTime").value = e && !form.all ? e.time || "" : "";
    $("dayTime2").value = e && !form.all ? e.time2 || "" : "";
    $("dayMemo").value = e ? e.memo || "" : "";
    renderDay();
    if (!e) setTimeout(() => $("dayText").focus(), 60);
  }
  function closeForm() { form = null; renderDay(); }
  function save() {
    const me = Store.me();
    const title = $("dayText").value.trim();
    if (!me || !form) return;
    if (!title) { $("dayText").focus(); return; }
    const from = $("dayFrom").value || sel;
    let to = $("dayTo").value || from;
    if (to < from) to = from;
    const old = form.id ? Store.get("cal", form.id) : null;
    const rec = Object.assign({}, old || {}, {
      id: form.id || undefined, date: from, end: to > from ? to : "", all: form.all, time: form.all ? "" : $("dayTime").value || "", time2: form.all ? "" : $("dayTime2").value || "",
      rep: form.rep, title, memo: $("dayMemo").value.trim(), who: form.who === "both" ? "both" : form.owner || me,
    });
    if (!rec.all && !rec.time) rec.all = true;
    H.silently(() => Store.put("cal", rec));
    sel = from;
    const d = parse(from);
    if (d) ym = { y: d.getFullYear(), m: d.getMonth() };
    form = null;
    render();
    renderDay();
    if (H.toast) H.toast(old ? "고쳤어요" : "달력에 적었어요");
  }
  function pickDay(k, open) {
    sel = k;
    form = null;
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
    $("dayAdd").addEventListener("click", () => openForm(null));
    $("dayList").addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-edit]");
      if (b) { const e = Store.get("cal", b.dataset.edit); if (e) openForm(e); }
    });
    const f = $("dayForm");
    f.addEventListener("submit", (ev) => { ev.preventDefault(); save(); });
    f.addEventListener("click", (ev) => {
      const t = ev.target;
      if (!form) return;
      const a = t.closest("[data-all]"), w = t.closest("[data-w]"), r = t.closest("[data-r]");
      if (a) { form.all = a.dataset.all === "1"; renderDay(); if (!form.all && !$("dayTime").value) $("dayTime").value = "19:00"; return; }
      if (w) { form.who = w.dataset.w; renderDay(); return; }
      if (r) { form.rep = r.dataset.r; renderDay(); return; }
      if (t.closest("#dayCancel")) { closeForm(); return; }
      if (t.closest("#dayDel")) {
        H.silently(() => Store.remove("cal", form.id));
        form = null;
        render();
        renderDay();
        if (H.toast) H.toast("지웠어요");
      }
    });
    $("dayFrom").addEventListener("change", () => { if ($("dayTo").value < $("dayFrom").value) $("dayTo").value = $("dayFrom").value; });
  }

  // ---------- 그림과 말풍선에 띄울 한 줄 ----------
  function todayLine() {
    const today = keyOf(new Date());
    const sp = special(parse(today));
    if (sp.length) return `오늘은 ${sp[0]}!`;
    const ev = eventsOn(today);
    if (!ev.length) return "";
    const e = ev[0].e;
    return `오늘 일정: ${e.all || !e.time ? "" : timeText(e.time) + " "}${e.title}${ev.length > 1 ? ` 외 ${ev.length - 1}개` : ""}`;
  }
  // 오늘 일정이 있으면 오늘, 없으면 가장 가까운 일정까지 남은 날
  function nextLine() {
    const t0 = parse(keyOf(new Date()));
    const ev = eventsOn(keyOf(t0));
    if (ev.length) {
      const { e, i } = ev[0], span = spanOf(e);
      return span ? `${e.title} ${i + 1}일째${i === span ? " (마지막 날)" : ""}` : `오늘은 ${e.title}${ev.length > 1 ? ` 외 ${ev.length - 1}개` : ""}!`;
    }
    const sp = special(t0);
    if (sp.length) return `오늘은 ${sp[0]}!`;
    const list = Store.list("cal");
    if (!list.length) return "";
    for (let n = 1; n <= 200; n++) {
      const d = new Date(t0.getFullYear(), t0.getMonth(), t0.getDate() + n);
      const hit = list.filter((e) => dayIndex(e, d) === 0).sort((a, b) => (sortKey(a) < sortKey(b) ? -1 : 1))[0];
      if (hit) return n === 1 ? `내일은 ${hit.title}` : `${hit.title}까지 ${n}일`;
    }
    return "";
  }

  window.Cal = { bind, render, renderDay, todayLine, nextLine, special, timeText, sel: () => sel, pick: (k) => pickDay(k, true) };
})();
