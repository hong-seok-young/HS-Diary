// ============================================================
// 꾸미기: 잠옷, 그림 속 동물, 이름표
// - 무엇이 열렸는지는 저장된 기록에서 계산해요. 그래서 두 폰이 늘 같고, 한 사람이 열면 둘 다 가져요.
// - 선물은 한 번 할 때마다 하나예요 (출석, 기분, 질문 답, 하트, 쪽지, 기록, 할 일, 일기, 일정). 하루 한도는 없어요.
// - 열릴 때는 누가 무엇을 해서 받았는지 알려 줘요.
// - 열릴 때는 검은 그림자와 대화가 먼저 나오고, 누르면 폭죽과 함께 모습이 드러나요.
// - 고른 것(입은 잠옷, 그림에 둔 동물, 이름표)은 상대 폰에도 바로 보여요.
// ============================================================
(function () {
  "use strict";

  const cfg = typeof DIARY_CONFIG !== "undefined" ? DIARY_CONFIG : {};
  const NAME = { him: cfg.him || "석영", her: cfg.her || "예은" };
  const Z = window.Zoo || { LIST: [], BY: {} };
  const S = () => window.FSprites;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const me = () => (window.Store && Store.me()) || "";
  const pad = (n) => String(n).padStart(2, "0");
  const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const batchim = (s) => { const c = String(s).charCodeAt(String(s).length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0; };
  const call = (w) => (batchim(NAME[w]) ? NAME[w] + "이" : NAME[w]);

  // ---------- 순서 (늘 같은 순서로 섞어요) ----------
  function shuffled(list, seed) {
    const a = list.slice();
    let s = seed >>> 0;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  const FIRST_PJ = ["bunny", "bear", "cat", "fox", "pig", "chick", "frog", "deer", "koala", "hippo", "penguin", "sheep", "panda", "dino", "tiger", "puppy"];
  const FIRST_PET = ["hippo", "sheep", "cat", "puppy"];
  const ids = Z.LIST.map((s) => s.id);
  const PJS = FIRST_PJ.concat(shuffled(ids.filter((id) => FIRST_PJ.indexOf(id) < 0), 20260717));
  const IT0 = window.Items ? Items.LIST.map((x) => x.id) : [];
  const FIRST_IT = ["cake0", "e_gr1", "h_bow0", "n_scarf12", "cone7", "h_crown8", "e_sun15", "boba10"].filter((id) => IT0.indexOf(id) >= 0);
  const ITEMS = FIRST_IT.concat(shuffled(IT0.filter((id) => FIRST_IT.indexOf(id) < 0), 19930811));
  // 기분 얼굴: 처음엔 하나도 없고, 500개 모두 하나씩 열려요. 자주 쓰는 마음이 먼저 나와요.
  const MD = window.Moods;
  const MD0 = [];
  if (MD) for (let n = 1; n <= MD.COUNT; n++) MD0.push(n);
  const FIRST_MD = MD ? [[0, 2], [0, 4], [0, 1], [0, 3], [2, 7], [0, 5], [0, 16], [3, 8], [0, 11], [0, 6], [1, 19], [0, 7], [5, 12], [0, 17], [11, 20], [0, 10]].map(([b, f]) => MD.idOf(b, f)) : [];
  const MOODS = FIRST_MD.concat(shuffled(MD0.filter((n) => FIRST_MD.indexOf(n) < 0), 20260710));
  const PETS = FIRST_PET.concat(shuffled(ids.filter((id) => FIRST_PET.indexOf(id) < 0), 19970929));

  // ---------- 무엇이 열렸나 ----------
  // 선물은 "한 번 할 때마다 하나"예요. 하루 한도가 없어서, 많이 쓰면 많이 받아요.
  //   출석, 오늘의 기분 고르기, 오늘의 질문 답, 하트 보내기 (사람마다 하루 한 번씩)
  //   쪽지, 기록, 할 일, 할 일 해내기, 일기, 일정 (할 때마다)
  // 무엇을 받는지는 차례로 돌아가요 (장식품이 가장 많아서 두 번에 한 번꼴).
  // T0 전의 것은 예전 규칙(하루에 종류마다 하나)으로 셈해서, 이미 받은 것은 그대로예요.
  const T0 = 1795692000000; // 2026-11-26 20:20 (한국 시간)
  const PATTERN = ["item", "pet", "mood", "item", "pj", "ban"];
  const ACTS = "출석, 기분 고르기, 질문 답, 하트, 쪽지, 기록, 할 일, 일기, 일정";
  const cut = (t0) => { const t = String(t0 || "").trim(); return t.length > 10 ? t.slice(0, 10) + "…" : t; };
  let cache = null, kNow = 0, needCache = null, giftCount = 0;
  const homeLevel = () => { unlocks(); return window.Home ? Home.levelOf(giftCount) : 0; };
  // 옷장 맨 위에 보이는 우리 집 한 줄
  function homeLine() {
    if (!window.Home) return "";
    const lv = homeLevel(), nx = Home.next(lv);
    return `우리 집: ${Home.name(lv)}` + (nx ? ` · ${nx[0]}까지 ${nx[1] - giftCount}번` : " · 끝까지 다 지었어요");
  }
  function unlocks() {
    if (cache) return cache;
    const St = window.Store;
    if (!St) return [];
    const all = (col) => (St.listAll ? St.listAll(col) : St.list(col));
    const SRC = { pet: PETS, pj: PJS, ban: BAN, item: ITEMS, mood: MOODS };
    const n = { pet: 0, pj: 0, ban: 1, item: 0, mood: 0 };
    const out = [];
    const give = (cat, at, who, why, lid) => {
      if (n[cat] >= SRC[cat].length) return false;
      const item = cat === "ban" ? n.ban : SRC[cat][n[cat]];
      n[cat]++;
      out.push({ id: `${cat}:${item}`, lid: lid || "", at, day: dayKey(new Date(at)), cat, item, who: who || "", why });
      return true;
    };
    // 1) 예전 규칙 (T0 전)
    const days = {};
    const day = (d) => (days[d] = days[d] || {});
    St.pairKeys("a:").forEach((k) => { ["him", "her"].forEach((w) => { const t = St.pairTime(k, w) || 1; if (St.pair(k, w) && t < T0) { const o = day(k.slice(2)); o["a_" + w] = t; if (!o.m || t < o.m) { o.m = t; o.mw = w; } } }); });
    St.pairKeys("q:").concat(St.pairKeys("p:")).forEach((k) => { ["him", "her"].forEach((w) => { const t = St.pairTime(k, w) || 1; if (St.pair(k, w) && t < T0) { const o = day(k.slice(2)); if (!o.q || t < o.q) { o.q = t; o.qk = k[0]; o.qw = w; } } }); });
    ["entries", "plans", "diary", "cal"].forEach((col) => St.list(col).forEach((r) => { if (!r.c || r.c >= T0) return; const o = day(dayKey(new Date(r.c))); if (!o.r || r.c < o.r) { o.r = r.c; o.rw = r.by || ""; } }));
    Object.keys(days).sort().forEach((d) => {
      const o = days[d];
      if (o.a_him) give("pet", o.a_him, "him", "출석해서", `u:${d}:a_him`);
      if (o.a_her) give("pj", o.a_her, "her", "출석해서", `u:${d}:a_her`);
      if (o.q) give("ban", o.q, o.qw, o.qk === "p" ? "하트를 보내서" : "오늘의 질문에 답해서", `u:${d}:q`);
      if (o.r) give("item", o.r, o.rw, "기록을 남겨서", `u:${d}:r`);
      if (o.m) give("mood", o.m, o.mw, "그날 처음 출석해서", `u:${d}:m`);
    });
    // 2) 새 규칙 (T0 부터): 한 번 할 때마다 하나
    const acts = [];
    const PAIR = { "a:": "출석해서", "m:": "오늘의 기분을 골라서", "q:": "오늘의 질문에 답해서", "p:": "하트를 보내서" };
    Object.keys(PAIR).forEach((pre) => St.pairKeys(pre).forEach((k) => ["him", "her"].forEach((w) => { const t = St.pairTime(k, w); if (St.pair(k, w) && t >= T0) acts.push({ t, k: k + w, who: w, why: PAIR[pre] }); })));
    const REC = {
      notes: (r) => "쪽지를 보내서",
      entries: (r) => (r.title || r.place ? `'${cut(r.title || r.place)}' 기록을 남겨서` : "기록을 남겨서"),
      plans: (r) => (r.title ? `'${cut(r.title)}' 할 일을 적어서` : "할 일을 적어서"),
      diary: (r) => "일기를 써서",
      cal: (r) => (r.title ? `'${cut(r.title)}' 일정을 적어서` : "일정을 적어서"),
    };
    Object.keys(REC).forEach((col) => all(col).forEach((r) => {
      if (r.c && r.c >= T0) acts.push({ t: r.c, k: col + r.id, who: r.from || r.by || "", why: REC[col](r) });
      if (col === "plans" && r.dn && r.dn >= T0) acts.push({ t: r.dn, k: "done" + r.id, who: r.dby || "", why: r.title ? `'${cut(r.title)}' 할 일을 해내서` : "할 일을 해내서" });
    }));
    acts.sort((a, b) => a.t - b.t || (a.k < b.k ? -1 : 1));
    let k = 0;
    acts.forEach((a) => {
      for (let tries = 0; tries < PATTERN.length; tries++) { const cat = PATTERN[k % PATTERN.length]; k++; if (give(cat, a.t, a.who, a.why)) break; }
    });
    kNow = k;
    needCache = null;
    out.sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : 1));
    // 우리 집: 선물을 받은 수가 차면 집이 한 단계씩 좋아져요 (그 선물 바로 다음에 축하)
    giftCount = out.length;
    if (window.Home) {
      const marks = [];
      Home.LEVELS.forEach((L, i) => { if (i > 0 && giftCount >= L[1]) { const u = out[L[1] - 1]; marks.push({ id: `home:${i}`, lid: "", at: u.at + 1, day: u.day, cat: "home", item: i, who: u.who, why: u.why }); } });
      marks.forEach((m) => out.push(m));
      out.sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : 1));
    }
    cache = out;
    return out;
  }
  // 아직 못 받은 것까지 몇 번 남았나: need(cat)[i] = 그 종류의 i번째 다음 선물까지 해야 하는 횟수
  function need(cat) {
    unlocks();
    if (!needCache) {
      needCache = { pet: [], pj: [], ban: [], item: [], mood: [] };
      for (let i = 0; i < 4200; i++) needCache[PATTERN[(kNow + i) % PATTERN.length]].push(i + 1);
    }
    return needCache[cat] || [];
  }
  const whyLocked = (cat, nth) => { const v = need(cat)[nth]; return `무엇이든 ${v || "여러"}번 더 하면 받아요. (${ACTS} · 하루에 몇 번을 해도 그때마다 선물이 하나씩 와요)`; };
  const ownedItems = () => unlocks().filter((u) => u.cat === "item").map((u) => u.item);
  const ownedMoods = () => unlocks().filter((u) => u.cat === "mood").map((u) => u.item);
  // 손에 든 것 (사람마다 따로 골라요)
  // 사람마다 손, 눈, 머리, 목에 하나씩 골라요
  const KINDS = ["hand", "eye", "hat", "neck"];
  function accOf(w) {
    const v = (window.Store && Store.pair("acc", w)) || {};
    const own = ownedItems(), out = {};
    KINDS.forEach((k) => { const id = k === "hand" && v.hand === undefined ? Store.pair("hold", w) : v[k]; out[k] = id && own.indexOf(id) >= 0 && Items.BY[id] && Items.BY[id].kind === k ? id : ""; });
    return out;
  }
  const holdOf = (w) => accOf(w).hand;
  let accCache = { t: 0, v: {} };
  window.HSAcc = (who) => {
    const now = Date.now();
    if (now - accCache.t > 1500) accCache = { t: now, v: { him: accOf("him"), her: accOf("her") } };
    return accCache.v[who] || {};
  };
  function setAcc(kind, id) {
    const w = me();
    if (!w) return;
    const cur = accOf(w);
    cur[kind] = id || "";
    Store.setPair("acc", w, cur);
    accCache.t = 0;
    applyHold();
    document.dispatchEvent(new CustomEvent("hsd:wear"));
  }
  function applyHold() {
    if (!window.Items) return;
    ["him", "her"].forEach((w) => {
      const bob = document.querySelector(`.bob[data-who="${w}"]`);
      if (!bob) return;
      let el = bob.querySelector(".prop-hand");
      const id = holdOf(w);
      if (!id) { if (el) el.remove(); return; }
      if (!el) { el = document.createElement("i"); el.className = "prop-hand"; el.innerHTML = '<img class="px" alt="">'; bob.appendChild(el); }
      if (el.dataset.k !== id) { const r = Items.img(id); el.dataset.k = id; el.firstChild.src = r.uri; el.firstChild.style.width = r.w * 2 + "px"; }
    });
  }
  const ownedPets = () => unlocks().filter((u) => u.cat === "pet").map((u) => u.item);
  const ownedPajamas = () => unlocks().filter((u) => u.cat === "pj").map((u) => u.item);
  const bannerCount = () => 1 + unlocks().filter((u) => u.cat === "ban").length;
  // 출석 찍기 (하루 한 번)
  function attend() {
    const w = me();
    if (!w) return;
    const k = "a:" + dayKey(new Date());
    if (!Store.pair(k, w)) Store.setPair(k, w, 1);
  }

  // ---------- 그림에 둔 동물 ----------
  const MAXP = 3;
  function placedOf(w) {
    const v = window.Store && Store.pair("pets", w);
    const own = ownedPets();
    return Array.isArray(v) ? v.filter((id) => own.indexOf(id) >= 0).slice(0, MAXP) : null;
  }
  function placed() {
    const a = placedOf("him"), b = placedOf("her");
    if (!a && !b) return ownedPets().slice(0, MAXP); // 아직 아무도 안 골랐으면 먼저 온 친구들
    const out = [];
    (a || []).concat(b || []).forEach((id) => { if (out.indexOf(id) < 0) out.push(id); });
    return out;
  }

  // ---------- 이름표 ----------
  const SHAPES = ["네모", "리본", "팻말", "구름", "하트", "깃발", "겹테", "티켓", "말풍선", "전구", "테이프", "두루마리"];
  const PALS = [
    ["크림", "#fff8e6", "#5b4638", "#c9735f"], ["딸기우유", "#ffe0ea", "#8a3a56", "#ff7aa8"], ["민트초코", "#d6f5e6", "#3a5a48", "#6a4630"], ["하늘", "#dff1ff", "#34587a", "#5a9ad8"],
    ["레몬", "#fff6b8", "#6a5a14", "#f0b52e"], ["라벤더", "#ece4ff", "#4e3e7a", "#9a7ae0"], ["복숭아", "#ffe6d6", "#7a4a30", "#ff9a6a"], ["밤하늘", "#2e2e5a", "#ffe86a", "#8ad0f6"],
    ["초코", "#6a4630", "#fff0d8", "#ffc83a"], ["숲", "#3a6a4a", "#f0ffe0", "#ffd83a"], ["벚꽃", "#fff0f6", "#a8507a", "#ff9ac0"], ["노을", "#ffb07a", "#5a2a3a", "#fff0b8"],
    ["바다", "#3a8ac8", "#ffffff", "#ffe86a"], ["모래", "#f0dcb0", "#6a5030", "#c8843a"], ["먹", "#3a3a40", "#ffffff", "#ff7a7a"], ["눈", "#ffffff", "#5a7a9a", "#8ac8f0"],
    ["자두", "#7a3a6a", "#ffe6f6", "#ffb0e0"], ["말차", "#c8dc9a", "#3e5a1e", "#7a9a3a"], ["살구", "#ffd0a0", "#7a4a14", "#f08a3a"], ["체리", "#e8364a", "#ffffff", "#ffd0d8"],
    ["청포도", "#e0f6b0", "#4a6a14", "#8ac83a"], ["블루베리", "#5a6ad8", "#ffffff", "#c8d0ff"], ["꿀", "#ffc83a", "#5a3a0a", "#fff0b0"], ["장미", "#ff8aa8", "#ffffff", "#8a1a3a"],
    ["안개", "#e6e8ee", "#4a5060", "#8a94a8"], ["호박", "#ff9a3a", "#4a2a0a", "#fff0c0"], ["옥", "#a8e6d0", "#1e5a4a", "#3ac8a0"], ["포도", "#9b6fd0", "#ffffff", "#f0d0ff"],
    ["흑백", "#ffffff", "#24242a", "#24242a"], ["금", "#f6d86a", "#5a4010", "#ffffff"],
    ["솜사탕", "#ffd6ec", "#5a6ab8", "#8ad0f6"], ["수박", "#ff6a7a", "#ffffff", "#3a8a4a"], ["귤", "#ffb347", "#6a3a0a", "#ffffff"], ["가지", "#5a3a7a", "#f6e6ff", "#c8a0f0"],
    ["우유", "#fffdf6", "#7a6a5a", "#ffc8d8"], ["커피", "#8a6244", "#fff6e6", "#f0c890"], ["새벽", "#b7c7ee", "#34406a", "#f6d6c8"], ["봄", "#e6f6c8", "#5a7a3a", "#ff9ac0"],
    ["여름", "#8ad8f0", "#1e4a6a", "#fff07a"], ["가을", "#e8a060", "#4a2a14", "#ffe0a0"], ["겨울", "#e6f0fa", "#3a5a8a", "#ffffff"], ["무지개", "#fff6f0", "#7a5ab8", "#ff8a8a"],
  ];
  const BANNERS = [];
  // 모양과 색을 번갈아 섞어서, 새로 받을 때마다 느낌이 달라져요
  for (let r = 0; r < SHAPES.length; r++) for (let p = 0; p < PALS.length; p++) { const s = (p * 5 + r) % SHAPES.length; BANNERS.push({ s, p, name: `${PALS[p][0]} ${SHAPES[s]}` }); }
  const BAN = BANNERS;
  const defTitle = () => cfg.title || `${call("him")}와 ${call("her")}`;
  const MODES = ["며칠째 · 주년", "며칠째만", "몇 주", "몇 개월", "몇 시간"];
  function ban() {
    let v = null, t = -1;
    ["him", "her"].forEach((w) => { const x = Store.pair("ban", w), at = Store.pairTime("ban", w); if (x && at > t) { v = x; t = at; } });
    v = v && typeof v === "object" ? v : {};
    const di = Math.min(Math.max(0, Number(v.d) || 0), BAN.length - 1);
    const title = typeof v.t === "string" && v.t.trim() ? v.t : defTitle();
    const x = typeof v.x === "number" ? Math.min(0.95, Math.max(0.05, v.x)) : 0.5, y = typeof v.y === "number" ? Math.min(0.8, Math.max(0, v.y)) : 0.03;
    return { d: di < bannerCount() ? di : 0, t: title, m: Number(v.m) || 0, x, y };
  }
  function setBan(patch) {
    const w = me();
    if (!w) return;
    const b = ban();
    const cur = { d: b.d, t: b.t, m: b.m, x: b.x, y: b.y };
    Store.setPair("ban", w, Object.assign(cur, patch));
    apply();
  }
  function styleOf(idx) { const b = BAN[idx] || BAN[0], p = PALS[b.p]; return { cls: "bn-s" + b.s, vars: `--b1:${p[1]};--b2:${p[2]};--b3:${p[3]}` }; }
  function apply() {
    applyHold();
    const el = $("banner");
    if (!el || !window.Store) return;
    const b = ban(), st = styleOf(b.d);
    el.className = "sc-banner " + st.cls;
    if (!dragging) el.setAttribute("style", `${st.vars};left:${(b.x * 100).toFixed(1)}%;top:${(b.y * 100).toFixed(1)}%`);
    const t = $("diaryTitle");
    if (t && t.textContent !== b.t) t.textContent = b.t;
    document.dispatchEvent(new CustomEvent("hsd:ban", { detail: b }));
  }

  // 이름표는 끌어서 옮겨요. 살짝 누르기만 하면 이름표 꾸미기가 열려요.
  let dragging = false;
  function bindDrag() {
    const el = $("banner"), scene = $("scene");
    if (!el || !scene || el.dataset.drag) return;
    el.dataset.drag = "1";
    let sx = 0, sy = 0, ox = 0, oy = 0, on = false, moved = false;
    el.addEventListener("pointerdown", (ev) => {
      const r = el.getBoundingClientRect(), sr = scene.getBoundingClientRect();
      sx = ev.clientX; sy = ev.clientY; ox = r.left + r.width / 2 - sr.left; oy = r.top - sr.top; on = true; moved = false;
      try { el.setPointerCapture(ev.pointerId); } catch (e) { /* 괜찮아요 */ }
    });
    el.addEventListener("pointermove", (ev) => {
      if (!on) return;
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (!moved && Math.abs(dx) + Math.abs(dy) < 8) return;
      moved = true; dragging = true;
      const sr = scene.getBoundingClientRect();
      const x = Math.min(0.95, Math.max(0.05, (ox + dx) / sr.width)), y = Math.min(0.8, Math.max(0, (oy + dy) / sr.height));
      el.style.left = (x * 100).toFixed(1) + "%"; el.style.top = (y * 100).toFixed(1) + "%";
      el.dataset.x = String(x); el.dataset.y = String(y);
      ev.preventDefault();
    });
    const end = () => {
      if (!on) return;
      on = false;
      if (moved) { dragging = false; el.dataset.moved = String(Date.now()); setBan({ x: Number(el.dataset.x), y: Number(el.dataset.y) }); }
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  }

  // ---------- 꾸미기 창 ----------
  let root = null, tab = "pj", solo = false, closetTab = "pj";
  function ensure() {
    if (root) return;
    root = document.createElement("div");
    root.className = "deco";
    root.hidden = true;
    root.innerHTML = `<div class="deco-dim" data-d="close"></div><div class="deco-box"><h2 class="deco-title" id="decoTitle"></h2><div class="deco-tabs" id="decoTabs" hidden></div><p class="deco-tip" id="decoTip"></p><div class="deco-body" id="decoBody"></div></div>`;
    document.body.appendChild(root);
    root.addEventListener("click", onClick);
    root.addEventListener("submit", (ev) => { ev.preventDefault(); const v = $("decoText").value.trim().slice(0, 14); if (v) { setBan({ t: v }); render(); if (window.HSD && HSD.toast) HSD.toast("이름표를 바꿨어요"); } });
  }
  const layer = () => document.dispatchEvent(new Event("hsd:layer"));
  function open(t) {
    if (!me()) return;
    ensure();
    // 이름표를 눌러 열면 이름표만, 옷장 단추로 열면 잠옷과 동물만 보여요
    // 이름표, 옷장, 동물 집을 눌러 열면 저마다 그것만 보여요
    solo = true;
    tab = t === "pj" ? closetTab : t || "pj";
    root.hidden = false;
    root.classList.remove("closing");
    hidePop();
    render();
    layer();
  }
  function close() {
    if (!root || root.hidden) return;
    root.classList.add("closing");
    setTimeout(() => { root.hidden = true; root.classList.remove("closing"); layer(); }, 160);
    layer();
  }
  function onClick(ev) {
    const b = ev.target.closest("[data-d]");
    hidePop();
    if (!b) return;
    if (b.dataset.d === "why") { showPop(b, b.dataset.v); return; }
    const k = b.dataset.d, v = b.dataset.v, w = me();
    if (k === "close") { history.back(); return; }
    if (k === "tab") { tab = v; render(); $("decoBody").scrollTop = 0; return; }
    if (k === "acc") { setAcc(b.dataset.kind, v); render(); return; }
    if (k === "ctab") { tab = closetTab = v; render(); $("decoBody").scrollTop = 0; return; }
    if (k === "wear") { if (window.Tale) Tale.setWear(v); document.dispatchEvent(new CustomEvent("hsd:wear")); render(); return; }
    if (k === "pet") {
      let list = placedOf(w) || [];
      if (list.indexOf(v) >= 0) list = list.filter((x) => x !== v);
      else { if (list.length >= MAXP) list = list.slice(1); list = list.concat(v); }
      Store.setPair("pets", w, list);
      document.dispatchEvent(new CustomEvent("hsd:pets"));
      render();
      return;
    }
    if (k === "ban") { setBan({ d: Number(v) }); render(); return; }
    if (k === "mode") { setBan({ m: Number(v) }); render(); return; }
  }
  if (window.Store) Store.onChange(() => { cache = null; });
  // 그림은 화면에 보일 때 그려요 (수백 개를 한꺼번에 그리지 않게)
  let io = null;
  function srcOf(k) {
    const [kind, id] = k.split("|");
    if (kind === "item") { const it = Items.BY[id]; if (it && it.kind !== "hand") { const a = {}; a[it.kind] = id; return S().charImg(me() || "him", "down", 0, "", "", "", a); } return Items.uri(id); }
    return kind === "pet" ? S().petImg(id, "stand", "") : S().charImg(me() || "him", "down", 0, "", "", id);
  }
  // 얻는 방법 글상자: 잠깐 떴다가 사라지고, 다른 곳을 눌러도 사라져요
  let popT = 0;
  function hidePop() { clearTimeout(popT); const p = root && root.querySelector(".deco-pop"); if (p) p.remove(); }
  function showPop(tile, text) {
    const box = root.querySelector(".deco-box");
    const p = document.createElement("div");
    p.className = "deco-pop";
    p.textContent = text;
    box.appendChild(p);
    const br = box.getBoundingClientRect(), tr = tile.getBoundingClientRect();
    const w = Math.min(240, br.width - 16);
    p.style.width = w + "px";
    p.style.left = Math.max(8, Math.min(br.width - w - 8, tr.left - br.left + tr.width / 2 - w / 2)) + "px";
    const above = tr.top - br.top > 90;
    p.style.top = above ? tr.top - br.top - p.offsetHeight - 8 + "px" : tr.bottom - br.top + 8 + "px";
    popT = setTimeout(hidePop, 3600);
  }
  function lazy() {
    const body = $("decoBody");
    if (!window.IntersectionObserver) { body.querySelectorAll("img[data-k]").forEach((im) => { im.src = srcOf(im.dataset.k); }); return; }
    if (io) io.disconnect();
    io = new IntersectionObserver((list) => { list.forEach((e) => { if (e.isIntersecting) { const im = e.target; im.src = srcOf(im.dataset.k); io.unobserve(im); } }); }, { root: body, rootMargin: "200px" });
    body.querySelectorAll("img[data-k]").forEach((im) => io.observe(im));
  }
  const BLANK = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
  function render() {
    const w = me();
    const closet = tab === "pj" || KINDS.indexOf(tab) >= 0;
    $("decoTitle").textContent = closet ? "옷장" : tab === "pet" ? "동물 친구들" : "이름표";
    // 옷장 안에는 잠옷과 손에 드는 것이 있어요
    $("decoTabs").hidden = !closet;
    $("decoTabs").innerHTML = closet ? [["pj", "잠옷"], ["hand", "손"], ["eye", "눈"], ["hat", "머리"], ["neck", "목"]].map(([k, n]) => `<button class="chip${tab === k ? " active" : ""}" data-d="ctab" data-v="${k}">${n}</button>`).join("") : "";
    let html = "", tip = "";
    // 아직 못 얻은 것도 검은 그림자로 다 보여요. 이름은 ???, 아래에 얻는 방법.
    // 누르면 얻는 방법이 글상자로 잠깐 떠요
    const why = { pj: (k) => whyLocked("pj", k), pet: (k) => whyLocked("pet", k), ban: (k) => whyLocked("ban", k), item: (k) => whyLocked("item", k) };
    const locked = (kind, id, left) => `<button class="deco-it lock${kind === "pet" ? " pet" : kind === "item" && Items.BY[id].kind === "hand" ? " item" : ""}" data-d="why" data-v="${esc(why[kind](left))}"><img class="px" alt="" data-k="${kind}|${id}" src="${BLANK}"><small>???</small></button>`;
    if (tab === "pj") {
      const own = ownedPajamas(), on = window.Tale ? Tale.wearOf(w) : "";
      tip = `잠옷 ${own.length}벌 / ${PJS.length}벌 · 무엇이든 할 때마다 선물이 하나씩 와요`;
      html = `<div class="deco-grid"><button class="deco-it${on ? "" : " on"}" data-d="wear" data-v=""><img class="px" alt="" src="${S().charImg(w, "down", 0, "", "", "")}"><small>평소 옷</small></button>` +
        own.slice().reverse().map((id) => `<button class="deco-it${on === id ? " on" : ""}" data-d="wear" data-v="${id}"><img class="px" alt="" data-k="pj|${id}" src="${BLANK}"><small>${esc(Z.BY[id].name)}</small></button>`).join("") +
        PJS.slice(own.length).map((id, k) => locked("pj", id, k)).join("") + `</div>`;
    } else if (KINDS.indexOf(tab) >= 0) {
      const KN = { hand: "손에 드는 것", eye: "눈 장식", hat: "머리 장식", neck: "목 장식" };
      const ownAll = ownedItems(), own = ownAll.filter((id) => Items.BY[id].kind === tab), on = accOf(w)[tab];
      const rest = ITEMS.slice(ownAll.length);
      const total = ITEMS.filter((id) => Items.BY[id].kind === tab).length;
      tip = `${KN[tab]} ${own.length}개 / ${total}개 · 장식품은 모두 ${ITEMS.length}개. 무엇이든 할 때마다 선물이 하나씩 와요` + (tab === "hat" ? " · 동물 잠옷을 입으면 머리 장식은 후드에 가려져요" : "");
      const cls = tab === "hand" ? " item" : "";
      html = `<div class="deco-grid"><button class="deco-it${cls}${on ? "" : " on"}" data-d="acc" data-kind="${tab}" data-v=""><i class="empty-hand"></i><small>없음</small></button>` +
        own.slice().reverse().map((id) => `<button class="deco-it${cls}${on === id ? " on" : ""}" data-d="acc" data-kind="${tab}" data-v="${id}"><img class="px" alt="" data-k="item|${id}" src="${BLANK}"><small>${esc(Items.BY[id].name)}</small></button>`).join("") +
        rest.map((id, k) => (Items.BY[id].kind === tab ? locked("item", id, k) : "")).join("") + `</div>`;
    } else if (tab === "pet") {
      const own = ownedPets(), mine = placedOf(w) || [], all = placed();
      tip = `동물 ${own.length}마리 / ${PETS.length}마리 · 무엇이든 할 때마다 선물이 하나씩 와요. 그림에 둘 친구를 ${MAXP}마리까지 골라요`;
      html = `<div class="deco-grid">` + own.slice().reverse().map((id) => `<button class="deco-it pet${mine.indexOf(id) >= 0 ? " on" : all.indexOf(id) >= 0 ? " other" : ""}" data-d="pet" data-v="${id}"><img class="px" alt="" data-k="pet|${id}" src="${BLANK}"><small>${esc(Z.BY[id].name)}</small></button>`).join("") +
        PETS.slice(own.length).map((id, k) => locked("pet", id, k)).join("") + `</div>`;
    } else {
      const n = bannerCount(), b = ban();
      tip = `이름표 ${n}개 / ${BAN.length}개 · 무엇이든 할 때마다 선물이 하나씩 와요`;
      html = `<form class="deco-form"><input type="text" id="decoText" maxlength="14" placeholder="이름표에 쓸 글자" value="${esc(b.t)}" autocomplete="off"><button class="btn small primary" type="submit">바꾸기</button></form>
        <p class="deco-tip">이름표를 끌면 그림 안 어디로든 옮길 수 있어요</p>
        <div class="deco-row">${MODES.map((t, i) => `<button class="chip${b.m === i ? " active" : ""}" data-d="mode" data-v="${i}">${t}</button>`).join("")}</div>
        <div class="deco-grid ban">` + BAN.map((x, i) => {
          const st = styleOf(i);
          return i < n
            ? `<button class="deco-it bn${b.d === i ? " on" : ""}" data-d="ban" data-v="${i}"><span class="sc-banner mini ${st.cls}" style="${st.vars}"><b>${esc(NAME.him)} ♥ ${esc(NAME.her)}</b></span><small>${esc(x.name)}</small></button>`
            : `<button class="deco-it bn lock" data-d="why" data-v="${esc(why.ban(i - n))}"><span class="sc-banner mini ${st.cls}" style="${st.vars}"><b>${esc(NAME.him)} ♥ ${esc(NAME.her)}</b></span><small>???</small></button>`;
        }).join("") + `</div>`;
    }
    $("decoTip").textContent = (closet ? homeLine() + "\n" : "") + tip;
    const body = $("decoBody"), top = body.scrollTop;
    body.innerHTML = html;
    body.scrollTop = top;
    lazy();
  }

  // ---------- 새로 열릴 때: 그림자, 대화, 폭죽 ----------
  // 본 선물은 "종류:물건"으로 적어 둬요. 선물마다 연출은 딱 한 번만 나와요.
  const SEEN_OLD = "hsd.useen", SEEN = "hsd.useen3";
  function seenSet() { try { return JSON.parse(localStorage.getItem(SEEN) || "{}") || {}; } catch (e) { return {}; } }
  function markSeen(id) { const s0 = seenSet(); s0[id] = 1; try { localStorage.setItem(SEEN, JSON.stringify(s0)); } catch (e) { /* 그냥 둬요 */ } }
  function unseen() {
    let raw = null;
    try { raw = localStorage.getItem(SEEN); } catch (e) { /* 없으면 처음 */ }
    if (raw === null) {
      // 처음 한 번: 예전 표시를 옮겨요. 이 폰이 처음이면 오늘보다 전에 열린 것은 이미 본 걸로 해요 (가진 건 그대로예요).
      let old = null;
      try { old = JSON.parse(localStorage.getItem(SEEN_OLD) || "null"); } catch (e) { old = null; }
      const today = dayKey(new Date());
      const s1 = {};
      unlocks().forEach((u) => { if (old ? (u.lid && old[u.lid]) || (u.cat === "mood" && u.lid && u.day < today) : u.day < today) s1[u.id] = 1; });
      try { localStorage.setItem(SEEN, JSON.stringify(s1)); } catch (e) { /* 그냥 둬요 */ }
    }
    // 우리 집이 처음 생긴 폰: 지난 단계들은 건너뛰고 지금 집만 한 번 보여 줘요
    let hm = "1";
    try { hm = localStorage.getItem(SEEN + ".home"); } catch (e) { /* 그냥 둬요 */ }
    if (!hm) {
      const s2 = seenSet(), lv = homeLevel();
      unlocks().forEach((u) => { if (u.cat === "home" && u.item < lv) s2[u.id] = 1; });
      try { localStorage.setItem(SEEN, JSON.stringify(s2)); localStorage.setItem(SEEN + ".home", "1"); } catch (e) { /* 그냥 둬요 */ }
    }
    const s0 = seenSet();
    return unlocks().filter((u) => !s0[u.id]);
  }
  const TALK = {
    home: [["땅이 쿵쿵 울려.", "우리 집에 무슨 일이 생겼나 봐!"], ["뚝딱뚝딱 소리가 나.", "누가 집을 고치고 있어?"], ["집 쪽이 환해졌어.", "얼른 가 보자!"]],
    item: [["어디서 달콤한 냄새가 나.", "누가 간식을 두고 갔나 봐!"], ["탁자 위에 뭐가 놓여 있어.", "우리 주려고 둔 걸까?"], ["봉지가 바스락거려.", "뭐가 들었는지 볼까?"], ["반짝이는 포장지다.", "손에 들면 귀엽겠다!"]],
    pet: [["어? 풀숲이 바스락거려.", "무언가가 우리를 찾아왔나 봐!"], ["저기 그림자 보여?", "누가 놀러 온 것 같아."], ["작은 발자국이 있어.", "살금살금 따라가 볼까?"], ["쉿, 무슨 소리 들리지?", "새 친구일지도 몰라!"], ["연못 쪽에 누가 있어.", "가까이 가 보자."]],
    pj: [["문 앞에 상자가 놓여 있어.", "뭐가 들어 있을까?"], ["폭신한 게 만져져.", "얼른 열어 보자!"], ["리본 묶인 꾸러미다.", "우리 거 맞지?"], ["옷장에서 부스럭 소리가 나.", "새 잠옷일까?"], ["택배가 왔어!", "둘이 같이 뜯자."]],
    mood: [["머리 위에 뭐가 동동 떠 있어.", "새 표정일까?"], ["마음이 간질간질해.", "이 기분, 이름이 뭘까?"], ["거울 속 얼굴이 좀 달라 보여.", "자세히 볼까?"], ["어디서 작은 얼굴이 굴러왔어.", "우리 기분을 닮았네?"]],
    ban: [["바람에 뭔가 날아왔어.", "어디에 달면 예쁠까?"], ["반짝이는 게 떨어져 있어.", "주워 볼까?"], ["하늘에서 뭐가 내려와.", "우리 이름이 적혀 있네?"], ["누가 선물을 두고 갔어.", "펼쳐 보자!"]],
  };
  const KIND = { home: "우리 집", pet: "새 친구", pj: "새 잠옷", ban: "새 이름표", item: "새 장식품", mood: "새 기분" };
  let uroot = null, uq = [], ucur = null, ustep = 0, utype = 0, utotal = 0;
  function uensure() {
    if (uroot) return;
    uroot = document.createElement("div");
    uroot.className = "unlock";
    uroot.hidden = true;
    uroot.innerHTML = `<div class="ul-flash"></div><div class="ul-stage" id="ulStage"><i class="ul-count" id="ulCount"></i><div class="ul-rays"></div><div class="ul-glow"></div><i class="ul-new" id="ulNew">NEW!</i><div class="ul-art" id="ulArt"></div><b class="ul-name" id="ulName"></b><p class="ul-why" id="ulWhy"></p><i class="ul-hint" id="ulHint"></i></div>
      <div class="tale-box ul-box"><div class="tale-head" id="ulHead"></div><div class="tale-body"><span class="tale-face"><img class="px" alt="" id="ulFace"></span><div class="tale-text"><b class="tale-name" id="ulWho"></b><p id="ulLine"></p></div></div><div class="tale-btns" id="ulBtns"></div></div>`;
    document.body.appendChild(uroot);
    uroot.addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-u]");
      if (b) { uact(b.dataset.u); return; }
      unext();
    });
  }
  function utypeLine(text) {
    clearInterval(utype);
    const p = $("ulLine");
    let i = 0;
    p.textContent = ""; p.dataset.full = text;
    utype = setInterval(() => { i += 2; p.textContent = text.slice(0, i); if (i >= text.length) { clearInterval(utype); utype = 0; } }, 30);
  }
  function artOf(u) {
    if (u.cat === "home") { const r = Home.img(u.item); return `<img class="px ul-img home" alt="" src="${r.day}" style="width:${r.w * 4}px">`; }
    if (u.cat === "mood") return `<img class="px ul-img mood" alt="" src="${MD.uri(u.item)}">`;
    if (u.cat === "pet") return `<img class="px ul-img pet" alt="" src="${S().petImg(u.item, "stand", "happy")}">`;
    if (u.cat === "pj") return `<img class="px ul-img pj" alt="" src="${S().charImg(me() || "him", "down", 0, "wave1", "happy", u.item)}">`;
    if (u.cat === "item") { const it = Items.BY[u.item]; if (it.kind === "hand") return `<img class="px ul-img item" alt="" src="${Items.uri(u.item)}">`; const a = {}; a[it.kind] = u.item; return `<img class="px ul-img pj" alt="" src="${S().charImg(me() || "him", "down", 0, "wave1", "happy", "", a)}">`; }
    const st = styleOf(u.item);
    return `<span class="sc-banner mini big ${st.cls}" style="${st.vars}"><b>${esc(NAME.him)} ♥ ${esc(NAME.her)}</b></span>`;
  }
  const nameOf = (u) => (u.cat === "home" ? Home.name(u.item) : u.cat === "mood" ? MD.name(u.item) : u.cat === "item" ? Items.BY[u.item].name : u.cat === "ban" ? BAN[u.item].name + " 이름표" : Z.BY[u.item].name + (u.cat === "pj" ? " 잠옷" : ""));
  // 누가 무엇을 해서 받았는지
  function whyOf(u) {
    const d = new Date(u.at), today = dayKey(new Date());
    const when = u.day === today ? "" : `${d.getMonth() + 1}월 ${d.getDate()}일에 `;
    const who = u.who === "him" || u.who === "her" ? `${call(u.who)}가 ` : "";
    return `${when}${who}${u.why}`;
  }
  // 축하 연출: 번쩍, 고리, 불꽃, 파티 폭죽(색종이와 리본), 쏘아 올리는 불꽃, 색종이 비
  let uTimer = 0;
  const artCenter = () => { const r = $("ulArt").getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, r]; };
  function tease() {
    clearInterval(uTimer);
    const F = window.FX;
    if (!F) return;
    const go = () => { if (!ucur || ustep !== 1) { clearInterval(uTimer); return; } const c = artCenter(); F.gather(c[0], c[1], 0.9); F.ring(c[0], c[1], "#b9a6ff", 150, 0, 0.8); };
    go();
    uTimer = setInterval(go, 900);
  }
  function party(u) {
    clearInterval(uTimer);
    const F = window.FX;
    const st = $("ulStage");
    uroot.classList.remove("boom"); void uroot.offsetWidth; uroot.classList.add("boom");
    if (!F) return;
    F.clear();
    const c = artCenter(), cx = c[0], cy = c[1], sz = F.size(), w = sz.w, h = sz.h, pal = F.PALETTE, pk = F.pick, rnd = F.rnd;
    const pat = { home: "willow", pet: "star", pj: "peony", ban: "ring", item: "double", mood: "heart" }[u.cat] || "peony";
    F.flash(cx, cy, "#fff6c8", 70, 760);
    F.ring(cx, cy, "#fff27a", 340); F.ring(cx, cy, "#ffffff", 230, 0.08, 0.5); F.ring(cx, cy, pk(pal), 460, 0.16, 0.9);
    F.explode(cx, cy, pat, [pk(pal), pk(pal)], 1);
    F.explode(cx, cy, "pixel", pal, 0.7, 0.1);
    // 양쪽 아래에서 파티 폭죽
    F.popper(-8, h * 0.74, -Math.PI * 0.3, 0.12);
    F.popper(w + 8, h * 0.74, -Math.PI * 0.7, 0.22);
    // 쏘아 올리는 불꽃
    const pats = ["peony", "star", "ring", "willow", "crossette", "double", "heart"];
    for (let i = 0; i < 4; i++) F.rocket(rnd(w * 0.2, w * 0.8), h + 10, rnd(w * 0.12, w * 0.88), rnd(h * 0.08, h * 0.32), pk(pats), [pk(pal), pk(pal)], 0.4 + i * 0.3, 0.8);
    F.confettiRain(34, 0.7);
    if (u.cat === "mood" || u.cat === "pj") F.hearts(cx, cy, 10, 120, 0.25);
    if (u.cat === "pet") F.fountain(cx, c[2].bottom + 6, 0.9, 0.1);
    if (u.cat === "home") { F.balloons(8, 0.3); F.fountain(cx - 70, c[2].bottom, 1.2, 0.2); F.fountain(cx + 70, c[2].bottom, 1.2, 0.35); }
    if (u.cat === "ban") F.ribbons(cx, cy, -Math.PI / 2, 1.2, 8, [300, 560], 0.1);
    if (st) { st.classList.remove("shake"); void st.offsetWidth; st.classList.add("shake"); }
  }
  function ushow() {
    const u = ucur;
    const talk = TALK[u.cat][(u.at + u.item.toString().length) % TALK[u.cat].length];
    const first = u.who === "her" ? "her" : "him";
    const who = ustep === 0 ? first : first === "him" ? "her" : "him";
    $("ulCount").textContent = utotal > 1 ? `${utotal - uq.length} / ${utotal}` : "";
    $("ulHead").textContent = whyOf(u);
    uroot.dataset.step = String(ustep);
    uroot.dataset.cat = u.cat;
    if (ustep < 2) {
      uroot.classList.remove("boom");
      $("ulArt").innerHTML = artOf(u);
      $("ulName").textContent = "";
      $("ulWhy").textContent = "";
      $("ulHint").textContent = ustep === 1 ? "눌러서 확인하기" : "";
      $("ulFace").parentNode.hidden = false;
      $("ulFace").src = S().charImg(who, "down", 0, "", ustep ? "happy" : "");
      $("ulWho").textContent = NAME[who];
      $("ulBtns").innerHTML = "";
      utypeLine(talk[ustep]);
      if (ustep === 1) tease(); else clearInterval(uTimer);
    } else {
      // 짜잔
      $("ulHint").textContent = "";
      // 이름은 한 글자씩 통통 떨어져요
      $("ulName").innerHTML = Array.from(nameOf(u)).map((ch, i) => `<span style="animation-delay:${(0.25 + i * 0.045).toFixed(3)}s">${ch === " " ? "&nbsp;" : esc(ch)}</span>`).join("");
      $("ulFace").parentNode.hidden = true;
      $("ulWho").textContent = "";
      $("ulWhy").textContent = u.cat === "home" ? `둘이 함께 ${Home.LEVELS[u.item][1]}번을 채워서` : `${whyOf(u)} 받은 선물`;
      utypeLine(u.cat === "home" ? (u.item === 1 ? `황무지에 ${nameOf(u)}${batchim(nameOf(u)) ? "이" : "가"} 생겼어요!` : `우리 집이 ${nameOf(u)}${batchim(nameOf(u)) ? "이" : "가"} 됐어요!`) : `${KIND[u.cat]}: ${nameOf(u)}${u.cat === "pet" ? "가 우리를 찾아왔어요!" : (batchim(nameOf(u)) ? "을" : "를") + " 받았어요!"}`);
      const actName = u.cat === "mood" ? "오늘 기분으로" : u.cat === "pet" ? "그림에 두기" : u.cat === "pj" ? "지금 입기" : u.cat === "item" ? (Items.BY[u.item].kind === "hand" ? "손에 들기" : "지금 하기") : "달기";
      $("ulBtns").innerHTML = u.cat === "home" ? `<button class="btn primary" data-u="next">${uq.length ? "다음" : "좋아"}</button>` : `<button class="btn" data-u="next">${uq.length ? "다음" : "좋아"}</button><button class="btn primary" data-u="use">${actName}</button>`;
      party(u);
    }
  }
  function unext() {
    if (!ucur) return;
    if (utype) { clearInterval(utype); utype = 0; $("ulLine").textContent = $("ulLine").dataset.full; return; }
    if (ustep < 2) { ustep++; ushow(); }
  }
  function uact(k) {
    const u = ucur, w = me();
    if (!u) return;
    if (k === "use") {
      if (u.cat === "mood") { Store.setPair("m:" + dayKey(new Date()), w, u.item); document.dispatchEvent(new CustomEvent("hsd:mood")); }
      else if (u.cat === "pet") { let list = placedOf(w) || placed().slice(0, MAXP - 1); list = list.filter((x) => x !== u.item); if (list.length >= MAXP) list = list.slice(1); Store.setPair("pets", w, list.concat(u.item)); document.dispatchEvent(new CustomEvent("hsd:pets")); }
      else if (u.cat === "pj") { if (window.Tale) Tale.setWear(u.item); document.dispatchEvent(new CustomEvent("hsd:wear")); }
      else if (u.cat === "item") setAcc(Items.BY[u.item].kind, u.item);
      else setBan({ d: u.item });
    }
    markSeen(u.id);
    clearInterval(uTimer);
    if (window.FX) FX.clear();
    if (uq.length) { ucur = uq.shift(); ustep = 0; ushow(); return; }
    ucur = null;
    uroot.classList.remove("boom");
    uroot.classList.add("closing");
    setTimeout(() => { uroot.hidden = true; uroot.classList.remove("closing"); layer(); }, 180);
    document.dispatchEvent(new CustomEvent("hsd:pets"));
  }
  // 아직 못 본 선물이 있으면 맨 먼저 보여 줘요
  function celebrate() {
    if (!me() || !S() || (uroot && !uroot.hidden)) return false;
    const list = unseen();
    if (!list.length) return false;
    uensure();
    uq = list.slice(1); utotal = list.length;
    ucur = list[0]; ustep = 0;
    uroot.hidden = false;
    ushow();
    layer();
    return true;
  }

  window.Deco = {
    open, back: close, isOpen: () => !!(root && !root.hidden && !root.classList.contains("closing")),
    bindDrag, justDragged: () => { const el = $("banner"); return !!(el && Date.now() - Number(el.dataset.moved || 0) < 400); }, tab: () => tab,
    celebrate, celebrating: () => !!(uroot && !uroot.hidden), attend, unlocks, whyLocked, need, homeLevel, homeLine, gifts: () => { unlocks(); return giftCount; }, ownedMoods, MOODS, ownedPets, ownedPajamas, ownedItems, holdOf, accOf, setAcc, applyHold, ITEMS, placed, ban, apply, bannerCount, setBan, PETS, PJS, BAN, styleOf, MAXP,
  };
})();
