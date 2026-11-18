// ============================================================
// 꽃마루 정원: 화면
// 누를 때는 바뀐 칸만 고쳐요. (화면 전체를 다시 그리지 않아서 깜빡이지 않아요)
// 화면: 정원 · 씨앗 · 큰 봉오리 · 이야기 · 장 · 일기 · 지도 · 작업실(도구, 땅과 건물, 연구, 부엌, 장식)
//       도감 · 꽃 · 친구들 · 친구 · 주문 · 놀이 · 놀이 중 · 축제 · 업적 · 기록 · 가방 · 더보기
// ============================================================
(function () {
  "use strict";

  const D = window.GData;
  const C = window.GCore;
  const ST = window.GStory;
  const A = window.GArt;
  const SP = D.SPECIES;
  const NA = D.AREAS.length;
  const cfg = typeof DIARY_CONFIG !== "undefined" ? DIARY_CONFIG : {};
  const NAME = { him: cfg.him || "석영", her: cfg.her || "예은" };
  const $ = (id) => document.getElementById(id);
  const TOOLS = D.CARES.map((c) => c.key);
  const KEY = "G3";

  let H = null; // 앱이 넘겨준 도구들
  let root, main, fxl, cv, cx;
  let who = "", mine = null, W = null, myT = 0;
  const stack = [];
  let stopMini = null;
  let tool = "water";
  let combo = 0;
  const wants = {};
  let sparkleIn = 30;
  let sceneQ = [];
  let sceneOn = false;
  let tickTimer = 0;
  let workTab = "tool";
  let bookTab = 0;
  let lastQuestId = "";

  // ---------- 글자 ----------
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function batchim(s) { const c = s.charCodeAt(s.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0; }
  function callName(n) { return batchim(n) ? n + "이" : n; }
  function fill(t) {
    return String(t).replace(/\{h\}/g, callName(NAME.him)).replace(/\{e\}/g, callName(NAME.her)).replace(/\{H\}/g, NAME.him).replace(/\{E\}/g, NAME.her);
  }
  function fmt(n) {
    n = Math.floor(n || 0);
    if (n < 1000) return String(n);
    if (n < 10000) return Math.floor(n / 1000) + "," + String(n % 1000).padStart(3, "0");
    const units = [[1e16, "경"], [1e12, "조"], [1e8, "억"], [1e4, "만"]];
    for (const [v, u] of units) {
      if (n >= v) {
        const x = n / v;
        return (x >= 100 ? String(Math.floor(x)) : (x >= 10 ? x.toFixed(1) : x.toFixed(2)).replace(/\.?0+$/, "")) + u;
      }
    }
    return String(n);
  }

  // ---------- 그림 ----------
  function spImg(sp, stage, v, s, cls) { return A.plantImg(sp, stage, v || 0, s || 3, cls); }
  function npcImg(a, s) { return A.critterImg(D.AREAS[a].kind, s || 3); }
  function ico(n, s) { return PIXEL.icon(n, s || 2); }
  function spr(n, s) { return PIXEL.sprite(n, s || 2); }
  const PETAL = () => spr("petal", 2);
  const HEART = () => spr("heartOn", 1);
  const SHARD = () => `<span class="g-star">${ico("star", 2)}</span>`;
  function careIcon(k, s) {
    if (k === "water") return `<span class="ci ci-water">${ico("drop", s || 2)}</span>`;
    if (k === "pet") return `<span class="ci ci-pet">${ico("hand", s || 2)}</span>`;
    if (k === "sing") return `<span class="ci ci-sing">${spr("note", s || 2)}</span>`;
    return `<span class="ci ci-sun">${ico("wsun", s || 2)}</span>`;
  }
  const GRANDMA = { H: "#e8e2dc", G: "#c7a6e8", D: "#a98bd0" };
  const GRANDPA = { H: "#d8d2cc", B: "#9bbf8a", P: "#7a6a5c" };
  function faceOf(name) {
    if (name === "달래") return A.pixImg("her", 4, GRANDMA);
    if (name === "바우") return A.pixImg("him", 4, GRANDPA);
    if (name === "우편냥") return A.critterImg("cat", 4);
    const a = D.AREAS.findIndex((x) => x.npc === name);
    if (a >= 0) return npcImg(a, 4);
    return "";
  }
  function money(kind, n) {
    const icon = kind === "petal" ? PETAL() : kind === "heart" ? HEART() : kind === "shard" ? SHARD() : spr("flowerB", 2);
    return `<span class="g-cost ${kind}">${icon}<b>${fmt(n)}</b></span>`;
  }
  function bar(f, cls) { return `<i class="g-bar ${cls || ""}"><b style="transform:scaleX(${Math.max(0, Math.min(1, f)).toFixed(3)})"></b></i>`; }

  // ---------- 기록장 ----------
  function other() { return who === "him" ? "her" : "him"; }
  function appHearts() {
    let n = 0;
    try {
      ["him", "her"].forEach((w) => {
        Store.pairKeys("a:").forEach((k) => { if (Store.pair(k, w)) n += 3; });
        Store.pairKeys("m:").forEach((k) => { if (Store.pair(k, w)) n += 1; });
        Store.pairKeys("q:").forEach((k) => { if (Store.pair(k, w)) n += 2; });
      });
      n += Store.list("diary").length * 3;
      n += Store.list("entries").length * 2;
    } catch (e) { /* 앱 기록을 못 읽으면 0 */ }
    return n;
  }
  let appH = 0;
  function load() {
    const w = Store.me() || "";
    if (w !== who) { mine = null; myT = 0; }
    who = w;
    if (!who) { mine = null; W = null; return false; }
    const raw = Store.pair(KEY, who);
    const t = Store.pairTime(KEY, who);
    if (!mine || t > myT + 1 || (raw && Store.progress(raw) > Store.progress(mine))) {
      mine = C.normDoc(raw ? JSON.parse(JSON.stringify(raw)) : C.emptyDoc());
      myT = t;
      tool = mine.tool || "water";
    }
    appH = appHearts();
    recompute();
    return true;
  }
  function recompute() {
    if (!mine) return;
    const o = Store.pair(KEY, other());
    const od = o ? o : C.emptyDoc();
    W = C.world(who === "him" ? mine : od, who === "him" ? od : mine, { now: Date.now(), app: { hearts: appH } });
  }
  function save() {
    if (!mine) return;
    Store.setPairFast(KEY, who, mine);
    myT = Store.pairTime(KEY, who);
  }
  function now() { W.now = Date.now(); return W.now; }
  function curArea() { return Math.max(0, Math.min(W.maxArea, mine.area || 0)); }

  // ---------- 틀 ----------
  function ensureRoot() {
    if (root) return;
    root = document.createElement("div");
    root.id = "game";
    root.className = "game";
    root.hidden = true;
    root.innerHTML = `
      <header class="g-head">
        <button class="g-x" data-act="back" aria-label="뒤로">${ico("down", 3)}</button>
        <button class="g-title" data-act="nav" data-to="map" id="gTitle"></button>
        <div class="g-money">
          <span class="g-coin petal" id="gPet">${PETAL()}<b></b></span>
          <span class="g-coin heart" id="gHeart">${HEART()}<b></b></span>
          <span class="g-coin shard" id="gShard">${SHARD()}<b></b></span>
        </div>
      </header>
      <main class="g-main" id="gMain"></main>
      <nav class="g-tabs">
        <button class="g-tab" data-act="tab" data-to="garden">${ico("leaf", 3)}<b>정원</b></button>
        <button class="g-tab" data-act="tab" data-to="story">${ico("book", 3)}<b>이야기</b><i id="gDotStory"></i></button>
        <button class="g-tab" data-act="tab" data-to="work">${ico("gear", 3)}<b>작업실</b></button>
        <button class="g-tab" data-act="tab" data-to="book">${ico("search", 3)}<b>도감</b></button>
        <button class="g-tab" data-act="tab" data-to="more">${ico("dots", 3)}<b>더보기</b><i id="gDotMore"></i></button>
      </nav>
      <canvas class="g-canvas" id="gCanvas"></canvas>
      <div class="g-fx" id="gFx"></div>
      <div class="g-toast" id="gToast"></div>
      <div class="g-scene" id="gScene" hidden></div>`;
    document.body.appendChild(root);
    main = $("gMain");
    fxl = $("gFx");
    cv = $("gCanvas");
    cx = cv.getContext("2d");
    root.addEventListener("click", onClick);
    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("resize", sizeCanvas);
    $("gScene").addEventListener("pointerdown", sceneTap);
    for (let i = 0; i < 18; i++) {
      const el = document.createElement("i");
      el.className = "g-num";
      fxl.appendChild(el);
    }
  }
  function sizeCanvas() {
    if (!cv) return;
    // 입자는 원래 네모난 점이라 1배로 그려도 충분해요. (그리는 양이 4~9배 줄어요)
    cv.width = Math.round(window.innerWidth);
    cv.height = Math.round(window.innerHeight);
  }

  function open(screen, params) {
    ensureRoot();
    root.hidden = false;
    root.classList.remove("closing");
    document.body.classList.add("game-open");
    root.animate([{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: "cubic-bezier(.22,1,.36,1)" });
    sizeCanvas();
    stack.length = 0;
    stack.push({ s: screen && SCREENS[screen] ? screen : "garden", p: params || {} });
    if (!load()) { renderWho(); return; }
    firstRun();
    show("tab");
    startTick();
    queueAutoScenes();
  }
  function close() {
    if (stopMini) { stopMini(); stopMini = null; }
    stopTick();
    if (mine) save();
    root.classList.add("closing");
    setTimeout(() => { root.hidden = true; root.classList.remove("closing"); document.body.classList.remove("game-open"); }, 200);
    if (H && H.onChanged) H.onChanged();
  }
  function renderWho() {
    $("gTitle").textContent = "꽃마루 정원";
    main.innerHTML = `<div class="g-pad">${H.whoAsk()}</div>`;
  }
  function go(s, p) {
    if (stopMini) { stopMini(); stopMini = null; }
    stack.push({ s, p: p || {} });
    show("fwd");
  }
  function back() {
    if (stopMini) { stopMini(); stopMini = null; }
    if (stack.length <= 1) { close(); return; }
    stack.pop();
    show("back");
  }
  function tab(s) {
    if (stopMini) { stopMini(); stopMini = null; }
    stack.length = 0;
    stack.push({ s, p: {} });
    show("tab");
  }
  function top() { return stack[stack.length - 1]; }

  // 화면 바꾸기: 통째로 넣고 살짝 미끄러지게
  function show(dir) {
    if (!W) return;
    now();
    const t = top();
    const sc = SCREENS[t.s] || SCREENS.garden;
    const out = sc(t.p);
    $("gTitle").textContent = out.title;
    main.__html = "";
    main.innerHTML = out.html;
    main.scrollTop = 0;
    const dx = dir === "back" ? -18 : dir === "fwd" ? 18 : 0;
    main.animate([{ opacity: 0.4, transform: `translateX(${dx}px)` }, { opacity: 1, transform: "none" }], { duration: 220, easing: "cubic-bezier(.22,1,.36,1)" });
    root.querySelector(".g-x").classList.toggle("close", stack.length <= 1);
    const tabKey = out.tab || t.s;
    root.querySelectorAll(".g-tab").forEach((b) => b.classList.toggle("active", b.dataset.to === tabKey));
    if (out.mount) out.mount();
    hud(true);
  }
  // 같은 화면을 새 숫자로: 바뀐 곳만
  function refresh() {
    if (!W || !root || root.hidden || stopMini) return;
    now();
    const t = top();
    if (t.s === "garden") { updateGarden(); hud(); return; }
    if (t.s === "boss") { updateBoss(); hud(); return; }
    if (t.s === "play") return;
    const out = (SCREENS[t.s] || SCREENS.garden)(t.p);
    $("gTitle").textContent = out.title;
    MORPH(main, out.html);
    hud();
  }

  // ---------- 머리 숫자, 빨간 점 ----------
  let hudRaf = 0;
  let dotAt = 0;
  const hudLast = {};
  function setText(id, v) {
    if (hudLast[id] === v) return;
    hudLast[id] = v;
    const el = $(id);
    if (el) el.textContent = v;
  }
  function hud(now_) {
    if (hudRaf && !now_) return;
    const run = () => {
      hudRaf = 0;
      if (!W) return;
      root.querySelector("#gPet b").textContent = fmt(Math.max(0, W.petals));
      root.querySelector("#gHeart b").textContent = fmt(Math.max(0, W.hearts));
      root.querySelector("#gShard b").textContent = fmt(Math.max(0, W.shards));
      // 빨간 점 계산은 무거워서 1초에 한 번만
      const t = performance.now();
      if (now_ || t - dotAt > 1000) {
        dotAt = t;
        const q = C.currentQuest(W);
        setText("gDotStory", q && q.done ? "!" : "");
        const more = claimableCount();
        setText("gDotMore", more ? String(more) : "");
      }
    };
    if (now_) run(); else hudRaf = requestAnimationFrame(run);
  }
  function claimableCount() {
    let n = 0;
    C.ACH.forEach((a) => { if (!W.ac[a.id]) { const [c, t] = a.f(W); if (c >= t) n++; } });
    for (let s = 0; s < 3; s++) if (C.canFill(W, C.order(W, s))) n++;
    C.ERRANDS.forEach((list, a) => { if (a <= W.maxArea) list.forEach((e) => { if (!W.q[e.id]) { const [c, t] = e.f(W); if (c >= t) n++; } }); });
    return n;
  }
  function bumpEl(el) {
    if (!el) return;
    el.animate([{ transform: "scale(1.25)" }, { transform: "scale(1)" }], { duration: 280, easing: "cubic-bezier(.34,1.56,.64,1)" });
  }

  // ---------- 효과: 숫자 띄우기 ----------
  let numI = 0;
  function floatNum(x, y, text, cls) {
    const el = fxl.children[numI++ % fxl.children.length];
    el.className = "g-num " + (cls || "");
    el.textContent = text;
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.animate([
      { transform: "translate(-50%, 0) scale(.7)", opacity: 0 },
      { transform: "translate(-50%, -16px) scale(1.1)", opacity: 1, offset: 0.2 },
      { transform: "translate(-50%, -54px) scale(1)", opacity: 0 },
    ], { duration: 820, easing: "cubic-bezier(.22,1,.36,1)" });
  }
  function toast(msg, kind) {
    const t = $("gToast");
    t.textContent = msg;
    t.className = "g-toast on " + (kind || "");
    clearTimeout(toast.tm);
    toast.tm = setTimeout(() => { t.className = "g-toast"; }, 2200);
  }
  function banner(html, kind) {
    const el = document.createElement("div");
    el.className = "g-banner " + (kind || "");
    el.innerHTML = html;
    root.appendChild(el);
    el.animate([
      { transform: "translate(-50%, -50%) scale(.4)", opacity: 0 },
      { transform: "translate(-50%, -50%) scale(1.08)", opacity: 1, offset: 0.25 },
      { transform: "translate(-50%, -50%) scale(1)", opacity: 1, offset: 0.75 },
      { transform: "translate(-50%, -60%) scale(.96)", opacity: 0 },
    ], { duration: 1800, easing: "ease-out" }).onfinish = () => el.remove();
  }

  // ---------- 효과: 점 입자 (캔버스 하나, 있을 때만 돌아요) ----------
  const parts = [];
  let partRaf = 0, partLast = 0;
  const PCOL = {
    water: ["#7cc4f0", "#a9dbfa", "#ffffff"], pet: ["#ff9ab8", "#ffc4d6", "#ffffff"], sing: ["#5b4638", "#9b7ee0", "#ffd35c"],
    sun: ["#ffd35c", "#fff0a0", "#ffb347"], petal: ["#ffb3c7", "#ff8ab0", "#fff0f4"], star: ["#ffe066", "#ffffff", "#ffd35c"],
    gold: ["#ffd34d", "#fff4b0", "#e3a524"], leaf: ["#7cc46e", "#a6dc8f", "#5d9a50"],
  };
  function spawn(x, y, kind, n, opt) {
    const cols = PCOL[kind] || PCOL.star;
    if (parts.length > 160) parts.splice(0, parts.length - 160);
    for (let i = 0; i < n; i++) {
      const a = (opt && opt.up) ? -Math.PI / 2 + (Math.random() - 0.5) * 1.6 : Math.random() * Math.PI * 2;
      const sp = (opt && opt.speed || 120) * (0.4 + Math.random() * 0.8);
      parts.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, g: kind === "water" ? 520 : 260,
        life: 0.6 + Math.random() * 0.5, t: 0, c: cols[i % cols.length], s: kind === "pet" || kind === "petal" ? 4 : 3,
        heart: kind === "pet" && i % 3 === 0, tx: opt && opt.tx, ty: opt && opt.ty,
      });
    }
    if (!partRaf) { partLast = 0; partRaf = requestAnimationFrame(partFrame); }
  }
  const HEART_PTS = [[1, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [1, 2], [2, 2], [3, 2], [2, 3]];
  function drawHeart(x, y, s, c) {
    cx.fillStyle = c;
    const bx = Math.round(x) - 2 * s, by = Math.round(y) - 2 * s;
    for (let i = 0; i < HEART_PTS.length; i++) cx.fillRect(bx + HEART_PTS[i][0] * s, by + HEART_PTS[i][1] * s, s, s);
  }
  function partFrame(ts) {
    const dt = partLast ? Math.min(0.05, (ts - partLast) / 1000) : 0.016;
    partLast = ts;
    cx.clearRect(0, 0, cv.width, cv.height);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t += dt;
      if (p.tx != null) {
        // 지갑 쪽으로 빨려 들어가요
        const k = Math.min(1, p.t / p.life);
        const e = k * k * (3 - 2 * k);
        if (p.sx == null) { p.sx = p.x; p.sy = p.y; }
        p.x = p.sx + (p.tx - p.sx) * e + Math.sin(k * Math.PI) * p.vx * 0.25;
        p.y = p.sy + (p.ty - p.sy) * e + Math.sin(k * Math.PI) * -60;
      } else {
        p.vy += p.g * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
      }
      const a = Math.max(0, 1 - p.t / p.life);
      if (a <= 0) { parts.splice(i, 1); continue; }
      cx.globalAlpha = p.tx != null ? 1 : a;
      if (p.heart) drawHeart(p.x, p.y, 2, p.c);
      else { cx.fillStyle = p.c; cx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s); }
    }
    cx.globalAlpha = 1;
    if (parts.length) partRaf = requestAnimationFrame(partFrame);
    else { partRaf = 0; cx.clearRect(0, 0, cv.width, cv.height); }
  }
  function centerOf(el) { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
  function flyTo(x, y, targetId, kind, n) {
    const t = $(targetId);
    if (!t) return;
    const [tx, ty] = centerOf(t);
    for (let i = 0; i < n; i++) spawn(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 20, kind, 1, { tx, ty });
    setTimeout(() => bumpEl(t), 650);
  }

  // ---------- 처음 ----------
  function firstRun() {
    if (!mine.seen.pro) {
      // 첫 씨앗은 마루가 심어 줘요
      if (!W.pl["0:0"]) { now(); C.plant(W, mine, "0:0", 0); }
      save();
    }
  }
  function queueAutoScenes() {
    if (!mine) return;
    if (!mine.seen.pro) { playScene(ST.PROLOGUE, () => { mine.seen.pro = 1; save(); }); }
    const a = curArea();
    if (mine.seen.pro && !mine.seen["in" + a] && a > 0) playScene(ST.CHAPTERS[a].intro, () => { mine.seen["in" + a] = 1; save(); });
    if (W.finished && !mine.seen.fin) playScene(ST.FINALE, () => { mine.seen.fin = 1; save(); toast("꽃마루 축제가 열렸어요"); });
  }

  // ---------- 대화 ----------
  let sceneLines = [], sceneI = 0, sceneEnd = null, typing = 0, typeFull = "", typeRaf = 0;
  function playScene(lines, onEnd) {
    sceneQ.push([lines, onEnd]);
    if (!sceneOn) nextScene();
  }
  function nextScene() {
    const item = sceneQ.shift();
    if (!item) { sceneOn = false; $("gScene").hidden = true; return; }
    sceneOn = true;
    [sceneLines, sceneEnd] = item;
    sceneI = 0;
    const el = $("gScene");
    el.hidden = false;
    el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
    showLine();
  }
  function showLine() {
    const [name, raw] = sceneLines[sceneI];
    const text = fill(raw);
    const el = $("gScene");
    if (name === "편지") {
      el.innerHTML = `<div class="sc-letter"><p>${esc(text)}</p><i class="sc-next">${ico("down", 2)}</i></div>`;
      el.firstChild.animate([{ transform: "translateY(30px) rotate(-2deg)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 420, easing: "cubic-bezier(.22,1,.36,1)" });
      typing = 0;
      return;
    }
    const face = name ? faceOf(name) : "";
    el.innerHTML = `<div class="sc-box${name ? "" : " narr"}">${face ? `<div class="sc-face">${face}</div>` : ""}<div class="sc-body">${name ? `<b>${esc(name)}</b>` : ""}<p></p></div><i class="sc-next">${ico("down", 2)}</i></div>`;
    const box = el.firstChild;
    box.animate([{ transform: "translateY(16px)", opacity: 0.2 }, { transform: "none", opacity: 1 }], { duration: 240, easing: "cubic-bezier(.22,1,.36,1)" });
    if (face) box.querySelector(".sc-face").animate([{ transform: "translateY(0)" }, { transform: "translateY(-6px)" }, { transform: "translateY(0)" }], { duration: 420, easing: "ease-out" });
    const p = box.querySelector("p");
    typeFull = text;
    typing = 1;
    let shown = 0, last = 0;
    cancelAnimationFrame(typeRaf);
    const step = (ts) => {
      if (!typing) return;
      if (!last) last = ts;
      shown = Math.min(text.length, Math.floor((ts - last) / 28));
      p.textContent = text.slice(0, shown);
      if (shown >= text.length) { typing = 0; return; }
      typeRaf = requestAnimationFrame(step);
    };
    typeRaf = requestAnimationFrame(step);
  }
  function sceneTap(ev) {
    ev.stopPropagation();
    if (typing) {
      typing = 0;
      cancelAnimationFrame(typeRaf);
      const p = $("gScene").querySelector("p");
      if (p) p.textContent = typeFull;
      return;
    }
    sceneI++;
    if (sceneI < sceneLines.length) { showLine(); return; }
    const end = sceneEnd;
    sceneEnd = null;
    if (end) end();
    nextScene();
  }

  // ---------- 원하는 것 ----------
  function wantOf(pk) {
    let w = wants[pk];
    if (!w) {
      w = wants[pk] = { want: TOOLS[(C.hash(pk + Date.now()) >> 3) % 4], left: 4 + Math.floor(Math.random() * 6) };
    }
    return w;
  }
  function rollWant(pk) {
    const w = wantOf(pk);
    let n = w.want;
    while (n === w.want) n = TOOLS[Math.floor(Math.random() * 4)];
    w.want = n;
    w.left = 4 + Math.floor(Math.random() * 6);
  }

  // ============================================================
  // 화면들
  // ============================================================
  const SCREENS = {};

  // ---------- 정원 ----------
  function plotInner(pk) {
    const p = C.plantAt(W, pk);
    if (!p) return `<span class="pl-soil"></span><span class="pl-img"></span><i class="pl-empty">${ico("leaf", 2)}</i>`;
    const w = wantOf(pk);
    return `<span class="pl-soil"></span><span class="pl-img">${spImg(p.sp, p.stage, 0, 3)}</span>
      <i class="pl-want${p.ready ? " off" : ""}">${careIcon(w.want, 2)}</i>
      <i class="pl-bar"><b style="transform:scaleX(${p.frac.toFixed(3)})"></b></i>
      <i class="pl-ready${p.ready ? " on" : ""}">${spr("basket", 2) || ico("basket", 2)}</i>`;
  }
  function decoSlot(a, i) {
    const d = W.deco[`${a}:${i}`];
    const item = d && d[0] ? C.DECOR_MAP[d[0]] : null;
    return `<span class="gd-deco d${i}" data-act="decoslot" data-slot="${i}">${item ? A.pixImg(item.sprite, 3, item.colors) : ""}</span>`;
  }
  function questStrip() {
    const q = C.currentQuest(W);
    if (!q) return `<button class="gd-quest done" data-act="tab" data-to="story">${ico("trophy", 2)}<span>모든 이야기를 끝냈어요</span></button>`;
    const f = Math.min(1, q.cur / q.need);
    const where = q.area !== curArea() ? `<em>${esc(D.AREAS[q.area].name)}</em> ` : "";
    return `<div class="gd-quest${q.done ? " ready" : ""}" data-key="q">
      <button class="gd-q-text" data-act="questline">${npcImg(q.area, 2)}<span>${where}${esc(q.text)}</span></button>
      ${q.done ? `<button class="btn small primary gd-claim" data-act="claimq">받기</button>` : `<span class="gd-q-num">${fmt(q.cur)}/${fmt(q.need)}</span>`}
      ${bar(f, "q")}
    </div>`;
  }
  function toolBar(bossMode) {
    return `<div class="gd-tools">${TOOLS.map((k) => {
      const c = D.CARES.find((x) => x.key === k);
      return `<button class="gd-tool${tool === k ? " on" : ""}" data-act="tool" data-k="${k}">${careIcon(k, 3)}<b>${c.name}</b><i>Lv.${W.toolLv[k]}</i></button>`;
    }).join("")}</div>
    <div class="gd-combo" id="gCombo"><span>연속</span><b>${combo}</b><i class="g-bar c"><b style="transform:scaleX(${(combo / W.comboMax).toFixed(3)})"></b></i></div>`;
  }
  SCREENS.garden = () => {
    const a = curArea();
    const ar = D.AREAS[a];
    const n = W.plots[a] || 1;
    let plots = "";
    for (let i = 0; i < 6; i++) {
      const pk = `${a}:${i}`;
      if (i < n) plots += `<div class="plot" data-tap="plot" data-pk="${pk}">${plotInner(pk)}</div>`;
      else if (i === n) plots += `<button class="plot buy" data-act="buyplot">${ico("lock", 2)}${money("petal", C.plotCost(a, n))}</button>`;
      else plots += `<div class="plot none"></div>`;
    }
    const bossReady = C.bossOpen(W, a) && (W.boss[a] || 0) < C.bossHp(a);
    const html = `<div class="gd" data-area="${a}">
      ${questStrip()}
      <div class="gd-field${ar.dark ? " dark" : ""}" id="gField" style="--sky0:${ar.sky[0]};--sky1:${ar.sky[1]};--ground:${ar.ground};--soil:${ar.soil}">
        <span class="gd-hill"></span>
        ${[0, 1, 2, 3].map((i) => decoSlot(a, i)).join("")}
        <button class="gd-npc" data-tap="npc" aria-label="${esc(ar.npc)}">${npcImg(a, 3)}<i class="gd-aff">${HEART()}${C.affLevel(W.af[a] || 0)}</i></button>
        <div class="gd-say" id="gSay"></div>
        ${bossReady ? `<button class="gd-boss" data-act="nav" data-to="boss">${spImg(SP[a * 8 + 5], 3, 0, 4)}<b>큰 봉오리</b></button>` : ""}
        <div class="gd-plots">${plots}</div>
        <button class="gd-sparkle" id="gSparkle" data-tap="sparkle" hidden>${ico("spark", 3)}</button>
      </div>
      ${toolBar()}
      <div class="gd-row">
        <button class="chip" data-act="harvestall">${spr("basket", 2) || ico("basket", 2)}다 거두기</button>
        <button class="chip${mine.auto ? " active" : ""}" data-act="auto">${ico("tick", 2)}다시 심기</button>
        <button class="chip" data-act="nav" data-to="seeds">${spr("seedBag", 2)}씨앗</button>
        ${W.todayBoth ? `<span class="chip together">${HEART()}함께 +25%</span>` : ""}
      </div>
    </div>`;
    return { title: ar.name, html, mount: mountGarden };
  };
  function mountGarden() {
    const a = curArea();
    if (mine.seen.pro && !mine.seen["in" + a] && a > 0) queueAutoScenes();
    lastQuestId = (C.currentQuest(W) || {}).id || "";
  }
  // 정원 화면: 칸마다 숫자만 고쳐요
  function updatePlot(pk) {
    const el = main.querySelector(`.plot[data-pk="${pk}"]`);
    if (!el) return;
    const p = C.plantAt(W, pk);
    const img = el.querySelector(".pl-img");
    if (!p) {
      if (!el.querySelector(".pl-empty")) el.innerHTML = plotInner(pk);
      return;
    }
    if (!el.querySelector(".pl-bar")) { el.innerHTML = plotInner(pk); return; }
    const k = p.sid + ":" + p.stage;
    if (img.dataset.k !== k) {
      const grew = img.dataset.k && Number(img.dataset.k.split(":")[1]) < p.stage && img.dataset.k.split(":")[0] === String(p.sid);
      img.dataset.k = k;
      img.innerHTML = spImg(p.sp, p.stage, 0, 3);
      if (grew) {
        img.animate([{ transform: "scale(1.3, .7)" }, { transform: "scale(.9, 1.15)" }, { transform: "none" }], { duration: 420, easing: "cubic-bezier(.34,1.56,.64,1)" });
        const [x, y] = centerOf(img);
        spawn(x, y, "leaf", 8);
      }
    }
    el.querySelector(".pl-bar b").style.transform = `scaleX(${p.frac.toFixed(3)})`;
    const want = el.querySelector(".pl-want");
    want.classList.toggle("off", p.ready);
    const w = wantOf(pk);
    if (want.dataset.w !== w.want) { want.dataset.w = w.want; want.innerHTML = careIcon(w.want, 2); }
    want.classList.toggle("match", w.want === tool);
    el.querySelector(".pl-ready").classList.toggle("on", p.ready);
    el.classList.toggle("ready", p.ready);
  }
  function updateGarden() {
    const a = curArea();
    C.plotKeys(W, a).forEach(updatePlot);
    updateQuestStrip(C.currentQuest(W));
    const aff = main.querySelector(".gd-aff");
    if (aff) { const lv = String(C.affLevel(W.af[a] || 0)); if (aff.lastChild.textContent !== lv) aff.lastChild.textContent = lv; }
    root.querySelectorAll(".gd-tool i").forEach((i, k) => { const v = "Lv." + W.toolLv[TOOLS[k]]; if (i.textContent !== v) i.textContent = v; });
  }
  function updateQuestStrip(q) {
    const qEl = main.querySelector(".gd-quest");
    const qid = (q && q.id) + ":" + (q && q.done);
    if (qEl && qEl.dataset.qid !== qid) {
      qEl.dataset.qid = qid;
      const tmp = document.createElement("div");
      tmp.innerHTML = questStrip();
      const nq = tmp.firstElementChild;
      nq.dataset.qid = qid;
      qEl.replaceWith(nq);
      if (q && q.done) bumpEl(nq);
    } else if (qEl && q) {
      const num = qEl.querySelector(".gd-q-num");
      if (num) num.textContent = `${fmt(q.cur)}/${fmt(q.need)}`;
      const b = qEl.querySelector(".g-bar b");
      if (b) b.style.transform = `scaleX(${Math.min(1, q.cur / q.need).toFixed(3)})`;
    }
  }
  function setCombo(c) {
    combo = c;
    const el = $("gCombo");
    if (!el) return;
    el.querySelector("b").textContent = combo;
    el.querySelector(".g-bar b").style.transform = `scaleX(${Math.min(1, combo / W.comboMax).toFixed(3)})`;
    el.classList.toggle("hot", combo >= 10);
  }
  function say(text, ms) {
    const el = $("gSay");
    if (!el) return;
    el.textContent = fill(text);
    el.classList.add("on");
    clearTimeout(say.tm);
    say.tm = setTimeout(() => el.classList.remove("on"), ms || 3600);
  }

  // 꽃 누르기
  function tapPlot(el, ev, care) {
    const pk = el.dataset.pk;
    now();
    const p = C.plantAt(W, pk);
    if (!p) { go("seeds", { pk }); return; }
    if (p.ready) { doHarvest(pk, el); return; }
    const use = care || tool;
    const w = wantOf(pk);
    const r = C.tap(W, mine, pk, use, { want: w.want, combo });
    if (!r) return;
    save();
    const x = ev ? ev.clientX : centerOf(el)[0];
    const y = ev ? ev.clientY : centerOf(el)[1];
    floatNum(x, y - 10, "+" + fmt(r.g), r.match ? "hit" : "");
    spawn(x, y, use, r.match ? 5 : 3, { up: true });
    const img = el.querySelector(".pl-img");
    img.animate([{ transform: "scale(1.12, .88)" }, { transform: "scale(.96, 1.06)" }, { transform: "none" }], { duration: 200, easing: "ease-out" });
    if (r.match) {
      w.left--;
      if (w.left <= 0) rollWant(pk);
    } else if (Math.random() < 0.25) rollWant(pk);
    setCombo(r.combo);
    if (r.combo && r.combo % 10 === 0 && r.match) floatNum(x, y - 40, `연속 ${r.combo}`, "combo");
    updatePlot(pk);
    if (r.ready) { el.animate([{ transform: "scale(1.08)" }, { transform: "none" }], { duration: 300 }); spawn(x, y, "star", 10); }
    sparkleTick();
    afterAction();
  }
  function doHarvest(pk, el) {
    now();
    const r = C.harvest(W, mine, pk);
    if (!r) return;
    save();
    const [x, y] = centerOf(el);
    floatNum(x, y - 30, "+" + fmt(r.petals), "petal");
    flyTo(x, y, "gPet", "petal", Math.min(12, 4 + r.v * 3));
    spawn(x, y, r.v ? "gold" : "petal", 12);
    el.animate([{ transform: "translateY(0)" }, { transform: "translateY(-10px)" }, { transform: "none" }], { duration: 300, easing: "ease-out" });
    if (r.v) banner(`${spImg(r.sp, 4, r.v, 4)}<b>${D.VARIANTS[r.v]} ${esc(r.sp.name)}</b>`, "v" + r.v);
    else if (r.first) banner(`${spImg(r.sp, 4, 0, 4)}<b>새 꽃 ${esc(r.sp.name)}</b>`, "new");
    if (r.star) toast(`${r.sp.name} 숙련 별 ${r.star}개`, "star");
    if (r.tokens) toast(`축제 토큰 +${r.tokens}`);
    updatePlot(pk);
    afterAction();
  }
  function harvestAll() {
    const a = curArea();
    let n = 0;
    C.plotKeys(W, a).forEach((pk) => {
      const p = C.plantAt(W, pk);
      if (p && p.ready) { const el = main.querySelector(`.plot[data-pk="${pk}"]`); if (el) { doHarvest(pk, el); n++; } }
    });
    if (!n) toast("아직 다 자란 꽃이 없어요");
  }
  function petNpc(el, ev) {
    const a = curArea();
    now();
    const before = C.affLevel(W.af[a] || 0);
    const lv = C.pet(W, mine, a, 1);
    save();
    const [x, y] = ev ? [ev.clientX, ev.clientY] : centerOf(el);
    spawn(x, y - 10, "pet", 5, { up: true });
    const im = el.querySelector("img");
    if (im) im.animate([{ transform: "scale(1.1, .9)" }, { transform: "translateY(-6px)" }, { transform: "none" }], { duration: 260, easing: "ease-out" });
    if (lv > before) {
      const aff = main.querySelector(".gd-aff");
      if (aff) aff.lastChild.textContent = String(lv);
      floatNum(x, y - 40, `우정 ${lv}단계`, "combo");
      checkHeartEvent(a, lv);
    } else if (Math.random() < 0.08) {
      const q = C.currentQuest(W);
      if (q && q.area === a) say(q.line);
    }
    afterAction();
  }
  function checkHeartEvent(a, lv) {
    [3, 6, 10].forEach((t, i) => {
      if (lv >= t && !mine.seen[`ht${a}_${i}`]) {
        playScene(ST.CHAPTERS[a].hearts[i], () => { mine.seen[`ht${a}_${i}`] = 1; C.claimFlag(W, mine, `hr${a}_${i}`, { hearts: 3 + i * 2 }); save(); toast(`하트 +${3 + i * 2}`); hud(); });
      }
    });
  }
  function sparkleTick() {
    sparkleIn -= 1;
    if (sparkleIn > 0) return;
    sparkleIn = Math.round((26 + Math.random() * 18) / Math.sqrt(W.mul.sparkle));
    const s = $("gSparkle");
    if (!s || !s.hidden) return;
    s.style.left = (10 + Math.random() * 75) + "%";
    s.style.top = (8 + Math.random() * 40) + "%";
    s.hidden = false;
    s.animate([{ transform: "scale(0) rotate(-90deg)" }, { transform: "scale(1) rotate(0)" }], { duration: 300, easing: "cubic-bezier(.34,1.56,.64,1)" });
    clearTimeout(sparkleTick.tm);
    sparkleTick.tm = setTimeout(() => { s.hidden = true; }, 6000);
  }
  function catchSparkle(el) {
    const a = curArea();
    now();
    const r = C.sparkle(W, mine, a);
    save();
    const [x, y] = centerOf(el);
    el.hidden = true;
    spawn(x, y, "star", 18, { speed: 180 });
    floatNum(x, y, "+" + fmt(r.petals), "petal");
    flyTo(x, y, "gPet", "petal", 5);
    C.plotKeys(W, a).forEach(updatePlot);
    afterAction();
  }

  // 행동이 끝날 때마다: 퀘스트가 끝났는지, 한 장이 끝났는지
  // 누를 때마다가 아니라 한 프레임에 한 번만 화면 숫자를 맞춰요
  let afterRaf = 0;
  function afterAction() {
    hud();
    if (afterRaf) return;
    afterRaf = requestAnimationFrame(() => {
      afterRaf = 0;
      const t = top();
      if (t.s !== "garden") return;
      const q = C.currentQuest(W);
      const qid = (q && q.id) || "";
      if (q && q.done && lastQuestId !== qid + ":done") {
        lastQuestId = qid + ":done";
        say("다 했다! 위에 받기를 눌러 줘");
      }
      updateQuestStrip(q);
    });
  }
  function claimCurrent() {
    const q = C.currentQuest(W);
    if (!q || !q.done) return;
    now();
    if (!C.claimQuest(W, mine, q)) return;
    save();
    const btn = main.querySelector(".gd-claim") || $("gTitle");
    const [x, y] = centerOf(btn);
    spawn(x, y, "star", 16, { speed: 160 });
    if (q.reward.petals) flyTo(x, y, "gPet", "petal", 6);
    if (q.reward.hearts) flyTo(x, y, "gHeart", "pet", 4);
    if (q.reward.shards) flyTo(x, y, "gShard", "star", 4);
    toast(`할 일 끝! ${q.reward.petals ? "꽃잎 +" + fmt(q.reward.petals) : ""}${q.reward.hearts ? " 하트 +" + q.reward.hearts : ""}${q.reward.shards ? " 별조각 +" + q.reward.shards : ""}`);
    if (q.diary != null) {
      const pg = ST.CHAPTERS[q.area].diary[q.diary];
      setTimeout(() => banner(`${ico("book", 4)}<b>달래의 일기 · ${esc(pg.title)}</b>`, "diary"), 400);
    }
    if (q.kind === "build") {
      const line = ST.CHAPTERS[q.area].builds[(W.bld[q.area] || 1) - 1];
      if (line) setTimeout(() => toast(line), 2300);
    }
    if (q.last) {
      const a = q.area;
      playScene(ST.CHAPTERS[a].outro, () => {
        mine.seen["out" + a] = 1;
        if (a + 1 < NA) {
          mine.area = a + 1;
          save();
          tab("garden");
          playScene(ST.CHAPTERS[a + 1].intro, () => { mine.seen["in" + (a + 1)] = 1; save(); });
        } else {
          save();
          playScene(ST.FINALE, () => { mine.seen.fin = 1; save(); });
        }
      });
    }
    const nq = C.currentQuest(W);
    if (nq && !q.last) setTimeout(() => say(nq.line, 5200), 500);
    lastQuestId = (nq && nq.id) || "";
    refresh();
    if (top().s === "garden") updateGarden();
  }

  // ---------- 씨앗 ----------
  SCREENS.seeds = (p) => {
    const a = curArea();
    const list = SP.filter((s) => s.area === a || (s.season && s.month === W.month));
    const rows = list.map((s) => {
      const open = C.speciesOpen(W, s);
      const cost = C.seedCost(s, W);
      const n = W.hc[s.id] || 0;
      const lock = !open ? (s.rare ? `${D.AREAS[a].bld} 2단계` : `앞 꽃을 더 피우면`) : "";
      return `<button class="seed${open ? "" : " locked"}${s.season ? " season" : ""}" data-act="plant" data-sid="${s.id}" ${open ? "" : "disabled"}>
        <span class="seed-img">${open || n ? spImg(s, 4, 0, 2) : `<span class="sil">${spImg(s, 4, 0, 2)}</span>`}</span>
        <b>${esc(s.name)}${s.rare ? '<i class="rare">희귀</i>' : ""}${s.season ? '<i class="season">이달</i>' : ""}</b>
        <span class="seed-meta">${open ? `${money("petal", C.baseValue(s, W))}` : esc(lock)}</span>
        <span class="seed-cost">${open ? (cost ? money("petal", cost) : "무료") : ico("lock", 2)}</span>
      </button>`;
    }).join("");
    return {
      title: "씨앗", tab: "garden",
      html: `<div class="g-pad"><div class="g-tip">${p.pk ? "심을 꽃을 골라요" : "빈 칸에 심을 꽃을 골라요"}</div><div class="seeds">${rows}</div>
      <button class="btn block" data-act="plantall" ${p.pk ? `data-pk="${p.pk}"` : ""}>마지막에 고른 꽃으로 빈 칸 모두</button></div>`,
    };
  };
  function plantSeed(sid, pk) {
    const a = curArea();
    now();
    const targets = pk ? [pk] : C.plotKeys(W, a).filter((k) => !C.plantAt(W, k));
    if (!targets.length) { toast("빈 칸이 없어요"); return; }
    let n = 0;
    targets.forEach((k) => { if (C.plant(W, mine, k, sid)) n++; });
    if (!n) { toast("꽃잎이 모자라요"); return; }
    mine.lastSeed = sid;
    save();
    back();
  }

  // ---------- 큰 봉오리 ----------
  SCREENS.boss = () => {
    const a = curArea();
    const hp = C.bossHp(a);
    const cur = Math.min(hp, W.boss[a] || 0);
    const done = cur >= hp;
    const sp = SP[a * 8 + 5];
    const dh = (W.docs.him.boss[a] || 0), de = (W.docs.her.boss[a] || 0);
    const tot = Math.max(1, dh + de);
    const w = wantOf("boss" + a);
    return {
      title: "큰 봉오리", tab: "garden",
      html: `<div class="boss" data-area="${a}">
        <div class="boss-hp">${bar(cur / hp, "boss")}<span id="gBossNum">${fmt(cur)} / ${fmt(hp)}</span></div>
        <div class="boss-field" style="--sky0:${D.AREAS[a].sky[0]};--sky1:${D.AREAS[a].sky[1]};--ground:${D.AREAS[a].ground}">
          <button class="boss-bud${done ? " bloom" : ""}" data-tap="boss">${spImg(sp, done ? 4 : 3, done ? 2 : 0, 9)}
            <i class="pl-want${done ? " off" : ""}" data-w="${w.want}">${careIcon(w.want, 3)}</i></button>
        </div>
        <div class="boss-who">
          <span class="him">${esc(NAME.him)} ${Math.round((dh / tot) * 100)}%</span>
          <i class="g-bar duo"><b style="transform:scaleX(${(dh / tot).toFixed(3)})"></b></i>
          <span class="her">${Math.round((de / tot) * 100)}% ${esc(NAME.her)}</span>
        </div>
        ${done ? `<p class="g-tip">피었어요! 이야기 할 일을 받아요</p>` : `<p class="g-tip">둘이 같이 누르면 더 빨리 피어요</p>`}
        ${toolBar(true)}
      </div>`,
    };
  };
  function updateBoss() {
    const a = curArea();
    const hp = C.bossHp(a);
    const cur = Math.min(hp, W.boss[a] || 0);
    const b = main.querySelector(".boss-hp .g-bar b");
    if (b) b.style.transform = `scaleX(${(cur / hp).toFixed(3)})`;
    const n = $("gBossNum");
    if (n) n.textContent = `${fmt(cur)} / ${fmt(hp)}`;
  }
  function tapBoss(el, ev) {
    const a = curArea();
    now();
    const w = wantOf("boss" + a);
    const r = C.bossHit(W, mine, a, tool, { want: w.want, combo });
    if (!r) return;
    save();
    floatNum(ev.clientX, ev.clientY - 10, "+" + fmt(r.add), r.match ? "hit" : "");
    spawn(ev.clientX, ev.clientY, tool, r.match ? 8 : 4, { up: true });
    el.querySelector("img").animate([{ transform: "scale(1.06, .94)" }, { transform: "none" }], { duration: 160 });
    if (r.match) { w.left--; if (w.left <= 0) { rollWant("boss" + a); const wi = el.querySelector(".pl-want"); wi.innerHTML = careIcon(wantOf("boss" + a).want, 3); } }
    setCombo(r.combo);
    updateBoss();
    if (r.done) {
      const [x, y] = centerOf(el);
      spawn(x, y, "gold", 40, { speed: 260 });
      banner(`${spImg(SP[a * 8 + 5], 4, 2, 5)}<b>큰 봉오리가 피었어요</b>`, "v2");
      setTimeout(() => { show("tab"); claimCurrent(); }, 900);
    }
    hud();
  }

  // ---------- 이야기 ----------
  SCREENS.story = () => {
    const q = C.currentQuest(W);
    const cards = [];
    for (let a = 0; a <= Math.min(NA - 1, W.maxArea); a++) {
      const ch = ST.CHAPTERS[a];
      const done = C.MAIN[a].filter((m) => W.q[m.id]).length;
      cards.push(`<button class="ch-card${done === 13 ? " done" : ""}" data-act="nav" data-to="chapter" data-a="${a}">
        <span class="ch-npc">${npcImg(a, 3)}</span>
        <span class="ch-name"><i>${a + 1}장</i><b>${esc(ch.area)}</b></span>
        <span class="ch-prog">${done}/13 ${bar(done / 13)}</span>
      </button>`);
    }
    for (let a = W.maxArea + 1; a < NA; a++) cards.push(`<div class="ch-card locked"><span class="ch-npc">${ico("lock", 3)}</span><span class="ch-name"><i>${a + 1}장</i><b>???</b></span></div>`);
    return {
      title: "이야기",
      html: `<div class="g-pad">
        ${q ? `<div class="story-now box">
          <div class="sn-face">${npcImg(q.area, 4)}</div>
          <div class="sn-body"><b>${esc(ST.CHAPTERS[q.area].npc)}</b><p>${esc(fill(q.line))}</p>
            <div class="sn-goal">${esc(q.text)} <i>${fmt(q.cur)}/${fmt(q.need)}</i></div>${bar(q.cur / q.need)}
            ${q.done ? `<button class="btn small primary" data-act="claimq">받기</button>` : ""}
          </div></div>` : `<div class="story-now box"><div class="sn-body"><b>꽃마루 축제</b><p>모든 이야기를 끝냈어요. 정원은 계속 자라요.</p></div></div>`}
        <div class="story-btns">
          <button class="chip" data-act="replay" data-k="pro">${spr("letter", 2)}처음 편지</button>
          <button class="chip" data-act="nav" data-to="diary">${ico("book", 2)}달래의 일기 ${C.diaryCount(W)}/36</button>
          ${W.finished ? `<button class="chip" data-act="replay" data-k="fin">${ico("star", 2)}꽃마루 축제</button>` : ""}
        </div>
        <div class="ch-list">${cards.join("")}</div>
      </div>`,
    };
  };
  SCREENS.chapter = (p) => {
    const a = Number(p.a) || 0;
    const ch = ST.CHAPTERS[a];
    const qs = C.MAIN[a];
    const firstOpen = qs.findIndex((m) => !W.q[m.id]);
    const rows = qs.map((m, i) => {
      const done = !!W.q[m.id];
      const cur = i === firstOpen;
      const [c, n] = m.f(W);
      return `<div class="qrow${done ? " done" : cur ? " cur" : " later"}">
        <span class="q-n">${done ? ico("tick", 2) : i + 1}</span>
        <span class="q-t">${done || cur ? esc(m.text) : "???"}${m.diary != null ? ` <i class="q-diary">${ico("book", 2)}</i>` : ""}</span>
        ${cur ? `<span class="q-c">${fmt(Math.min(c, n))}/${fmt(n)}</span>` : ""}
      </div>`;
    }).join("");
    const errands = C.ERRANDS[a].map((e) => {
      const [c, n] = e.f(W);
      const done = !!W.q[e.id];
      return `<div class="qrow errand${done ? " done" : ""}">
        <span class="q-n">${done ? ico("tick", 2) : ico("heart", 2)}</span>
        <span class="q-t">${esc(e.text)}<i>${esc(e.goal)}</i></span>
        ${done ? "" : c >= n ? `<button class="btn small primary" data-act="claime" data-id="${e.id}">받기</button>` : `<span class="q-c">${fmt(c)}/${fmt(n)}</span>`}
      </div>`;
    }).join("");
    const pages = ch.diary.map((pg, i) => {
      const q = qs.find((m) => m.diary === i);
      const got = W.q[q.id];
      return `<button class="dpage${got ? "" : " locked"}" data-act="${got ? "nav" : ""}" data-to="page" data-a="${a}" data-i="${i}" ${got ? "" : "disabled"}>${ico(got ? "book" : "lock", 2)}<span>${got ? esc(pg.title) : "찢어진 쪽"}</span></button>`;
    }).join("");
    return {
      title: `${a + 1}장 ${ch.area}`, tab: "story",
      html: `<div class="g-pad">
        <div class="ch-head">${npcImg(a, 4)}<div><b>${esc(ch.npc)}</b><p>${esc(fill(ch.intro[0][1]))}</p></div></div>
        <div class="story-btns"><button class="chip" data-act="replay" data-k="in${a}">${ico("book", 2)}처음 이야기</button>${W.q[qs[12].id] ? `<button class="chip" data-act="replay" data-k="out${a}">${ico("star", 2)}끝 이야기</button>` : ""}</div>
        <h3 class="g-h">할 일</h3><div class="qlist">${rows}</div>
        <h3 class="g-h">달래의 일기</h3><div class="dpages">${pages}</div>
        <h3 class="g-h">${esc(ch.npc)}의 부탁</h3><div class="qlist">${errands}</div>
      </div>`,
    };
  };
  function allPages() {
    const out = [];
    for (let a = 0; a < NA; a++) ST.CHAPTERS[a].diary.forEach((pg, i) => {
      const q = C.MAIN[a].find((m) => m.diary === i);
      if (W.q[q.id]) out.push({ a, i, pg });
    });
    return out;
  }
  SCREENS.diary = () => {
    const pages = allPages();
    return {
      title: "달래의 일기", tab: "story",
      html: `<div class="g-pad"><div class="dpages wide">${pages.length ? pages.map((x) => `<button class="dpage" data-act="nav" data-to="page" data-a="${x.a}" data-i="${x.i}">${ico("book", 2)}<span><i>${x.a + 1}장</i> ${esc(x.pg.title)}</span></button>`).join("") : `<p class="g-tip">정원을 되살리면 일기장이 한 쪽씩 돌아와요</p>`}</div></div>`,
    };
  };
  SCREENS.page = (p) => {
    const a = Number(p.a), i = Number(p.i);
    const pages = allPages();
    const idx = pages.findIndex((x) => x.a === a && x.i === i);
    const pg = ST.CHAPTERS[a].diary[i];
    const prev = pages[idx - 1], next = pages[idx + 1];
    return {
      title: "달래의 일기", tab: "story",
      html: `<div class="g-pad"><article class="paper">
        <h2>${esc(pg.title)}</h2><p>${esc(pg.text)}</p><span class="paper-n">${idx + 1} / 36</span>
      </article>
      <div class="paper-nav">
        ${prev ? `<button class="btn" data-act="page" data-a="${prev.a}" data-i="${prev.i}">앞 쪽</button>` : "<span></span>"}
        ${next ? `<button class="btn" data-act="page" data-a="${next.a}" data-i="${next.i}">다음 쪽</button>` : "<span></span>"}
      </div></div>`,
    };
  };

  // ---------- 지도 ----------
  SCREENS.map = () => {
    const tiles = D.AREAS.map((ar, a) => {
      const open = a <= W.maxArea;
      const done = C.MAIN[a].filter((m) => W.q[m.id]).length;
      const ready = open && C.plotKeys(W, a).some((pk) => { const p = C.plantAt(W, pk); return p && p.ready; });
      return `<button class="map-tile${open ? "" : " locked"}${a === curArea() ? " here" : ""}" data-act="${open ? "area" : ""}" data-a="${a}" style="--sky0:${ar.sky[0]};--ground:${ar.ground}" ${open ? "" : "disabled"}>
        <span class="mt-img">${open ? npcImg(a, 3) : ico("lock", 3)}</span>
        <b>${open ? esc(ar.name) : "???"}</b>
        ${open ? `<i>${done}/13</i>` : ""}
        ${ready ? `<em class="mt-ready">${ico("star", 2)}</em>` : ""}
      </button>`;
    }).join("");
    return { title: "지도", tab: "garden", html: `<div class="g-pad"><div class="map">${tiles}</div></div>` };
  };

  // ---------- 작업실 ----------
  function workTabs() {
    const t = [["tool", "도구"], ["land", "땅·건물"], ["rs", "연구"], ["cook", "부엌"], ["deco", "장식"]];
    return `<div class="g-subtabs">${t.map(([k, n]) => `<button class="chip${workTab === k ? " active" : ""}" data-act="worktab" data-k="${k}">${n}</button>`).join("")}</div>`;
  }
  SCREENS.work = () => {
    let body = "";
    const a = curArea();
    if (workTab === "tool") {
      body = D.CARES.map((c) => {
        const lv = W.toolLv[c.key];
        const tier = c.tiers[Math.min(c.tiers.length - 1, Math.floor((lv - 1) / 10))];
        const cost = C.toolCost(lv);
        return `<div class="wrow">
          <span class="w-ico">${careIcon(c.key, 4)}</span>
          <span class="w-t"><b>${esc(tier)}</b><i>${esc(c.verb)} · Lv.${lv} · 힘 ${fmt(C.toolPow(lv) * W.mul.tap * 10)}</i></span>
          <button class="btn small${W.petals >= cost ? " primary" : ""}" data-hold="tool" data-k="${c.key}">${money("petal", cost)}</button>
        </div>`;
      }).join("") + `<p class="g-tip">단추를 꾹 누르고 있으면 계속 올라가요</p>`;
    } else if (workTab === "land") {
      const n = W.plots[a] || 1;
      const s = W.bld[a] || 0;
      const bc = s < 3 ? C.bldCost(a, s) : null;
      const ar = D.AREAS[a];
      const pk = D.PERKS[ar.perk];
      body = `<div class="wrow">
          <span class="w-ico">${ico("leaf", 4)}</span>
          <span class="w-t"><b>${esc(ar.name)} 땅</b><i>${n} / 6칸</i></span>
          ${n < 6 ? `<button class="btn small${W.petals >= C.plotCost(a, n) ? " primary" : ""}" data-act="buyplot">${money("petal", C.plotCost(a, n))}</button>` : `<span class="w-max">다 열었어요</span>`}
        </div>
        <div class="bld box">
          <div class="bld-head"><b>${esc(ar.bld)}</b><i>${s}/3</i></div>
          <div class="bld-steps">${[0, 1, 2].map((i) => `<span class="${i < s ? "on" : ""}">${ico(i < s ? "tick" : "home", 3)}<em>${esc(ST.CHAPTERS[a].builds[i].split(".")[0])}</em></span>`).join("")}</div>
          <p class="g-tip">${esc(pk.name)} +${ar.perk === "combo" || ar.perk === "cap" || ar.perk === "star" ? pk.per : Math.round(pk.per * 100) + "%"} (단계마다)${s >= 1 ? ` · ${esc(ar.npc)}가 꽃을 돌봐 줘요` : ""}</p>
          ${bc ? `<button class="btn block${W.petals >= bc.petals && W.hearts >= bc.hearts ? " primary" : ""}" data-act="build">${money("petal", bc.petals)}${bc.hearts ? money("heart", bc.hearts) : ""} 짓기</button>` : `<p class="g-done">완성!</p>`}
        </div>
        <p class="g-tip">다른 정원의 땅과 건물은 지도에서 그 정원으로 가서 지어요</p>`;
    } else if (workTab === "rs") {
      body = D.RESEARCH.map((r) => {
        const lv = W.rs[r.key] || 0;
        const cost = C.researchCost(lv);
        return `<div class="wrow">
          <span class="w-ico">${ico("spark", 3)}</span>
          <span class="w-t"><b>${esc(r.name)}</b><i>${esc(r.desc)} ${esc(r.per)} · ${lv}/${r.max}</i>${bar(lv / r.max)}</span>
          ${lv < r.max ? `<button class="btn small${W.shards >= cost ? " primary" : ""}" data-act="research" data-k="${r.key}">${money("shard", cost)}</button>` : `<span class="w-max">끝</span>`}
        </div>`;
      }).join("") + `<p class="g-tip">별조각은 꽃 숙련 별, 업적, 놀이, 큰 봉오리에서 모여요</p>`;
    } else if (workTab === "cook") {
      body = C.RECIPE_LIST.filter((r) => r.area <= W.maxArea).map((r) => {
        const can = C.canCook(W, r);
        const have = W.inv["k" + r.id] || 0;
        return `<div class="wrow">
          <span class="w-ico">${A.pixImg(r.sprite, 3)}</span>
          <span class="w-t"><b>${esc(r.name)}${have ? ` <em>${have}개</em>` : ""}</b><i class="ings">${r.needs.map(([sid, n]) => `<span class="${(W.inv["c" + sid] || 0) >= n ? "ok" : "no"}">${spImg(SP[sid], 4, 0, 1)}${(W.inv["c" + sid] || 0)}/${n}</span>`).join("")}</i></span>
          <button class="btn small${can ? " primary" : ""}" data-hold="cook" data-k="${r.id}" ${can ? "" : "disabled"}>만들기</button>
        </div>`;
      }).join("") + `<p class="g-tip">요리는 주문에 쓰거나 친구에게 선물해요</p>`;
    } else {
      const shop = C.DECOR_LIST.filter((d) => (d.area != null && d.area <= W.maxArea) || d.month === W.month);
      body = `<h3 class="g-h">${esc(D.AREAS[a].name)} 꾸미기</h3>
        <div class="deco-slots">${[0, 1, 2, 3].map((i) => {
          const d = W.deco[`${a}:${i}`];
          const item = d && d[0] ? C.DECOR_MAP[d[0]] : null;
          return `<button class="deco-slot" data-act="decoslot" data-slot="${i}">${item ? A.pixImg(item.sprite, 3, item.colors) : ico("leaf", 2)}<i>${item ? esc(item.name) : "빈 자리"}</i></button>`;
        }).join("")}</div>
        <p class="g-tip">아름다움 ${W.beauty} · 꽃잎 +${Math.round(W.beauty / 4)}%</p>
        <h3 class="g-h">가게</h3>
        ${shop.map((d) => {
          const own = W.inv["o" + d.id] || 0;
          return `<div class="wrow">
            <span class="w-ico">${A.pixImg(d.sprite, 3, d.colors)}</span>
            <span class="w-t"><b>${esc(d.name)}${own ? ` <em>${own}개</em>` : ""}</b><i>아름다움 ${d.beauty}${d.month != null ? " · 이달 축제" : ""}</i></span>
            <button class="btn small" data-act="buydeco" data-k="${d.id}">${d.month != null ? money("token", d.tokens) : money("petal", d.cost)}</button>
          </div>`;
        }).join("")}`;
    }
    return { title: "작업실", html: `<div class="g-pad">${workTabs()}${body}</div>` };
  };
  SCREENS.decopick = (p) => {
    const a = curArea();
    const owned = C.DECOR_LIST.filter((d) => (W.inv["o" + d.id] || 0) > 0);
    const k = `${a}:${p.slot}`;
    const cur = W.deco[k] && W.deco[k][0];
    return {
      title: "장식 놓기", tab: "work",
      html: `<div class="g-pad"><div class="seeds">
        <button class="seed" data-act="place" data-slot="${p.slot}" data-k="">${ico("close", 3)}<b>비우기</b></button>
        ${owned.map((d) => {
          const free = (W.inv["o" + d.id] || 0) - C.placedCount(W, d.id) + (cur === d.id ? 1 : 0);
          return `<button class="seed${cur === d.id ? " on" : ""}" data-act="place" data-slot="${p.slot}" data-k="${d.id}" ${free > 0 ? "" : "disabled"}><span class="seed-img">${A.pixImg(d.sprite, 3, d.colors)}</span><b>${esc(d.name)}</b><span class="seed-meta">아름다움 ${d.beauty}</span><span class="seed-cost">${free}개</span></button>`;
        }).join("")}
      </div>${owned.length ? "" : `<p class="g-tip">작업실 장식 가게에서 먼저 사요</p>`}</div>`,
    };
  };

  // ---------- 도감 ----------
  SCREENS.book = () => {
    const tabs = D.AREAS.map((ar, a) => `<button class="chip${bookTab === a ? " active" : ""}" data-act="booktab" data-k="${a}">${a <= W.maxArea ? esc(ar.name) : "???"}</button>`).join("") + `<button class="chip${bookTab === 12 ? " active" : ""}" data-act="booktab" data-k="12">달마다</button>`;
    const list = bookTab === 12 ? SP.filter((s) => s.season) : SP.filter((s) => s.area === bookTab);
    const grid = list.map((s) => {
      const n = W.hc[s.id] || 0;
      const vr = W.vr[s.id] || 0;
      const stars = C.masteryStars(n);
      return `<button class="bk${n ? "" : " unknown"}" data-act="${n ? "nav" : ""}" data-to="species" data-sid="${s.id}">
        <span class="bk-img">${n ? spImg(s, 4, 0, 2) : `<span class="sil">${spImg(s, 4, 0, 2)}</span>`}</span>
        <b>${n ? esc(s.name) : s.season ? `${s.month + 1}월` : "?"}</b>
        <span class="bk-v">${[1, 2, 3].map((v) => `<i class="v${v}${(vr >> v) & 1 ? " on" : ""}"></i>`).join("")}</span>
        <span class="bk-s">${stars ? "★".repeat(stars) : ""}</span>
      </button>`;
    }).join("");
    return {
      title: "도감", html: `<div class="g-pad"><div class="bk-sum">꽃 ${W.discovered}/120 · 숙련 별 ${W.stars}/600 · 은빛 ${W.vc[1]} · 금빛 ${W.vc[2]} · 무지개 ${W.vc[3]}</div>
      <div class="g-subtabs scroll">${tabs}</div><div class="bk-grid">${grid}</div></div>`,
    };
  };
  SCREENS.species = (p) => {
    const s = SP[Number(p.sid)];
    const n = W.hc[s.id] || 0;
    const vr = W.vr[s.id] || 0;
    const T = C.E.mastery;
    return {
      title: s.name, tab: "book",
      html: `<div class="g-pad">
        <div class="sp-hero">${[0, 1, 2, 3].map((v) => `<span class="sp-v${(vr >> v) & 1 ? "" : " no"}">${(vr >> v) & 1 ? spImg(s, 4, v, 4) : `<span class="sil">${spImg(s, 4, 0, 4)}</span>`}<i>${D.VARIANTS[v]}</i></span>`).join("")}</div>
        <div class="sp-grow">${[0, 1, 2, 3, 4].map((st) => spImg(s, st, 0, 2)).join("")}</div>
        <div class="sp-info box">
          <div><span>피운 수</span><b>${fmt(n)}</b></div>
          <div><span>어디서</span><b>${s.season ? `${s.month + 1}월 축제` : esc(D.AREAS[s.area].name)}</b></div>
          <div><span>한 송이</span><b>${money("petal", C.baseValue(s, W))}</b></div>
          <div><span>자라는 데</span><b>${fmt(C.need(s, W))}</b></div>
          <div><span>숙련</span><b>${T.map((t) => `<i class="ms${n >= t ? " on" : ""}">★</i>`).join("")}</b></div>
          <div><span>다음 별</span><b>${T.find((t) => n < t) ? `${fmt(T.find((t) => n < t) - n)}송이 더` : "다 모았어요"}</b></div>
        </div>
      </div>`,
    };
  };

  // ---------- 친구 ----------
  SCREENS.friends = () => {
    const cards = D.AREAS.map((ar, a) => {
      if (a > W.maxArea) return `<div class="fr locked">${ico("lock", 3)}<b>???</b></div>`;
      const pts = W.af[a] || 0;
      const lv = C.affLevel(pts);
      const nx = C.E.affLv[lv + 1];
      const f = nx ? (pts - C.E.affLv[lv]) / (nx - C.E.affLv[lv]) : 1;
      return `<button class="fr" data-act="nav" data-to="friend" data-a="${a}">${npcImg(a, 3)}<b>${esc(ar.npc)}</b><i>${HEART()}${lv}</i>${bar(f)}</button>`;
    }).join("");
    return { title: "친구들", tab: "more", html: `<div class="g-pad"><div class="fr-grid">${cards}</div><p class="g-tip">친구를 쓰다듬거나 요리를 선물하면 우정이 쌓여요. 우정이 깊어지면 이야기를 들려줘요</p></div>` };
  };
  SCREENS.friend = (p) => {
    const a = Number(p.a);
    const ar = D.AREAS[a];
    const pts = W.af[a] || 0;
    const lv = C.affLevel(pts);
    const nx = C.E.affLv[lv + 1];
    const dishes = C.RECIPE_LIST.filter((r) => (W.inv["k" + r.id] || 0) > 0);
    const evs = ST.CHAPTERS[a].hearts.map((h, i) => {
      const t = [3, 6, 10][i];
      const seen = lv >= t;
      return `<button class="chip${seen ? "" : " off"}" data-act="${seen ? "heartev" : ""}" data-a="${a}" data-i="${i}" ${seen ? "" : "disabled"}>${HEART()}${t}단계 이야기</button>`;
    }).join("");
    return {
      title: ar.npc, tab: "more",
      html: `<div class="g-pad">
        <button class="fr-big" data-tap="petbig" data-a="${a}">${npcImg(a, 7)}</button>
        <div class="fr-lv"><b>우정 ${lv}단계</b><i>${nx ? `${fmt(pts)} / ${fmt(nx)}` : "최고"}</i>${bar(nx ? (pts - C.E.affLv[lv]) / (nx - C.E.affLv[lv]) : 1)}</div>
        <p class="g-tip">눌러서 쓰다듬어요</p>
        <div class="story-btns">${evs}</div>
        <h3 class="g-h">선물하기</h3>
        <div class="gift-row">${dishes.length ? dishes.map((r) => `<button class="gift" data-act="give" data-a="${a}" data-k="${r.id}">${A.pixImg(r.sprite, 3)}<i>${W.inv["k" + r.id]}</i><b>${esc(r.name)}</b></button>`).join("") : `<p class="g-tip">부엌에서 요리를 만들면 선물할 수 있어요</p>`}</div>
      </div>`,
    };
  };
  function petBig(el, ev) {
    const a = Number(el.dataset.a);
    now();
    const before = C.affLevel(W.af[a] || 0);
    const lv = C.pet(W, mine, a, 1);
    save();
    spawn(ev.clientX, ev.clientY, "pet", 6, { up: true });
    el.querySelector("img").animate([{ transform: "scale(1.06, .94)" }, { transform: "translateY(-8px)" }, { transform: "none" }], { duration: 240, easing: "ease-out" });
    if (lv > before) { floatNum(ev.clientX, ev.clientY - 30, `우정 ${lv}단계`, "combo"); checkHeartEvent(a, lv); refresh(); }
    else {
      const b = main.querySelector(".fr-lv");
      if (b) {
        const pts = W.af[a];
        const nx = C.E.affLv[lv + 1];
        if (nx) {
          b.querySelector("i").textContent = `${fmt(pts)} / ${fmt(nx)}`;
          b.querySelector(".g-bar b").style.transform = `scaleX(${((pts - C.E.affLv[lv]) / (nx - C.E.affLv[lv])).toFixed(3)})`;
        }
      }
    }
    hud();
  }

  // ---------- 주문 ----------
  SCREENS.orders = () => {
    const line = ST.POST_LINES[(W.od + new Date().getDate()) % ST.POST_LINES.length];
    const cards = [0, 1, 2].map((s) => {
      const o = C.order(W, s);
      const can = C.canFill(W, o);
      return `<div class="order box${can ? " can" : ""}" data-key="o${s}:${o.gen}">
        <div class="od-head"><b>${esc(o.who)}</b><span>${money("petal", o.petals)}${money("heart", o.hearts)}</span></div>
        <div class="od-items">${o.items.map(([k, n]) => {
          const have = W.inv[k] || 0;
          const pic = k[0] === "c" ? spImg(SP[Number(k.slice(1))], 4, 0, 2) : A.pixImg(C.RECIPE_MAP[k.slice(1)].sprite, 2);
          const nm = k[0] === "c" ? SP[Number(k.slice(1))].name : C.RECIPE_MAP[k.slice(1)].name;
          return `<span class="od-it${have >= n ? " ok" : ""}">${pic}<b>${esc(nm)}</b><i>${have}/${n}</i></span>`;
        }).join("")}</div>
        <div class="od-btns"><button class="btn small" data-act="skiporder" data-k="${s}">넘기기</button><button class="btn small${can ? " primary" : ""}" data-act="fillorder" data-k="${s}" ${can ? "" : "disabled"}>배달</button></div>
      </div>`;
    }).join("");
    return {
      title: "주문", tab: "more",
      html: `<div class="g-pad"><div class="post">${A.critterImg("cat", 3)}<p>${esc(line)}</p></div>${cards}<p class="g-tip">끝낸 주문 ${W.od}개</p></div>`,
    };
  };

  // ---------- 놀이 ----------
  SCREENS.games = () => {
    const rows = D.GAMES.map((g) => {
      const best = W.mg[g.key] || 0;
      return `<div class="game-row box">
        <div class="gr-head">${A.pixImg(g.icon === "dice" ? "heartOn" : g.icon, 3)}<b>${esc(g.name)}</b><i>${best}/10</i></div>
        <div class="gr-stages">${Array.from({ length: 10 }, (_, i) => {
          const st = i + 1;
          const open = st <= best + 1;
          return `<button class="stg${st <= best ? " clear" : ""}" data-act="${open ? "playgame" : ""}" data-k="${g.key}" data-s="${st}" ${open ? "" : "disabled"}>${st}</button>`;
        }).join("")}</div>
      </div>`;
    }).join("");
    return { title: "놀이", tab: "more", html: `<div class="g-pad">${rows}<p class="g-tip">처음 깬 단계마다 별조각 하나</p></div>` };
  };
  SCREENS.play = (p) => ({
    title: D.GAMES.find((g) => g.key === p.k).name, tab: "more",
    html: `<div class="g-pad"><div class="mg-root" id="gMini"></div></div>`,
    mount() {
      const el = $("gMini");
      const st = Number(p.s) || 1;
      stopMini = window.GMini[p.k](el, st, (score, cleared) => {
        stopMini = null;
        now();
        const r = C.miniResult(W, mine, p.k, st, cleared);
        save();
        el.innerHTML = `<div class="mg-ready">
          <b class="mg-result">${cleared ? "깼다!" : "아깝다"}</b>
          <p>${score}점 · 꽃잎 +${fmt(r.petals)}${r.first ? " · 별조각 +1" : ""}</p>
          <div class="od-btns"><button class="btn" data-act="playgame" data-k="${p.k}" data-s="${st}">다시</button>${cleared && st < 10 ? `<button class="btn primary" data-act="playgame" data-k="${p.k}" data-s="${st + 1}">다음 단계</button>` : ""}</div>
        </div>`;
        const [x, y] = centerOf(el);
        if (cleared) spawn(x, y, "star", 24, { speed: 200 });
        hud();
      });
    },
  });

  // ---------- 축제 ----------
  SCREENS.fest = () => {
    const m = W.month;
    const f = D.FESTIVALS[m];
    const sps = SP.filter((s) => s.season && s.month === m);
    const fq = C.festQuests(W).map((q) => {
      const [c, n] = q.f(W);
      const done = !!W.q[q.id];
      return `<div class="qrow${done ? " done" : ""}"><span class="q-n">${done ? ico("tick", 2) : ico("flag", 2)}</span><span class="q-t">${esc(q.text)}</span>${done ? "" : c >= n ? `<button class="btn small primary" data-act="claimf" data-id="${q.id}">받기</button>` : `<span class="q-c">${c}/${n}</span>`}</div>`;
    }).join("");
    const deco = C.DECOR_LIST.find((d) => d.month === m);
    return {
      title: f.name, tab: "more",
      html: `<div class="g-pad">
        <div class="fest-head" style="--fc:${f.color}"><b>${m + 1}월 ${esc(f.name)}</b><span>${money("token", W.tokens)}</span></div>
        <div class="fest-sp">${sps.map((s) => `<div class="fest-flower">${spImg(s, 4, 0, 4)}<b>${esc(s.name)}</b><i>${W.hc[s.id] ? `${W.hc[s.id]}송이` : "아직"}</i></div>`).join("")}</div>
        <p class="g-tip">이달 꽃은 어느 정원에서나 심을 수 있어요. 피울 때마다 토큰이 생겨요</p>
        <h3 class="g-h">축제 할 일</h3><div class="qlist">${fq}</div>
        <h3 class="g-h">축제 가게</h3>
        <div class="wrow"><span class="w-ico">${A.pixImg(deco.sprite, 3, deco.colors)}</span><span class="w-t"><b>${esc(deco.name)}</b><i>이달에만 · 아름다움 ${deco.beauty}</i></span><button class="btn small" data-act="buydeco" data-k="${deco.id}">${money("token", deco.tokens)}</button></div>
        <div class="wrow"><span class="w-ico">${spr("heartOn", 3)}</span><span class="w-t"><b>하트 세 개</b><i>토큰 열 개와 바꿔요</i></span><button class="btn small" data-act="festswap">${money("token", 10)}</button></div>
      </div>`,
    };
  };

  // ---------- 업적 ----------
  SCREENS.ach = () => {
    const rows = C.ACH.map((a) => {
      const [c, t] = a.f(W);
      const done = !!W.ac[a.id];
      const can = !done && c >= t;
      return `<div class="qrow${done ? " done" : ""}${can ? " can" : ""}"><span class="q-n">${done ? ico("trophy", 2) : ico("star", 2)}</span>
        <span class="q-t"><b>${esc(a.name)}</b><i>${esc(a.desc)}</i></span>
        ${done ? "" : can ? `<button class="btn small primary" data-act="claima" data-id="${a.id}">${money("shard", a.shards)}</button>` : `<span class="q-c">${fmt(Math.min(c, t))}/${fmt(t)}</span>`}</div>`;
    });
    const can = rows.filter((r) => r.includes('class="qrow can')).length;
    return { title: `업적 ${Object.keys(W.ac).length}/${C.ACH.length}`, tab: "more", html: `<div class="g-pad">${can ? `<button class="btn block primary" data-act="claimallach">모두 받기 (${can})</button>` : ""}<div class="qlist">${rows.join("")}</div></div>` };
  };

  // ---------- 기록 ----------
  SCREENS.stats = () => {
    const h = W.docs.him, e = W.docs.her;
    const sum = (o) => Object.keys(o || {}).reduce((n, k) => n + (Number(o[k]) || 0), 0);
    const rows = [
      ["돌본 횟수", h.tp, e.tp], ["피운 꽃", h.hvn, e.hvn], ["주문", h.od, e.od],
      ["모은 꽃잎", h.pe, e.pe], ["쓰다듬기", (h.tc || {}).pet || 0, (e.tc || {}).pet || 0],
      ["큰 봉오리", sum(h.boss), sum(e.boss)], ["반짝이", h.spk, e.spk], ["밤에 피운 꽃", h.nh, e.nh],
    ].map(([n, a, b]) => {
      const t = Math.max(1, a + b);
      return `<div class="st-row"><span class="st-n">${n}</span><span class="him">${fmt(a)}</span><i class="g-bar duo"><b style="transform:scaleX(${(a / t).toFixed(3)})"></b></i><span class="her">${fmt(b)}</span></div>`;
    }).join("");
    const titles = C.ACH.filter((a) => W.ac[a.id]).map((a) => a.name);
    return {
      title: "기록", tab: "more",
      html: `<div class="g-pad">
        <div class="st-head"><span class="him">${esc(NAME.him)}${h.title ? `<i>${esc(h.title)}</i>` : ""}</span><span class="her">${esc(NAME.her)}${e.title ? `<i>${esc(e.title)}</i>` : ""}</span></div>
        <div class="st-list">${rows}</div>
        <div class="sp-info box">
          <div><span>함께 온 날</span><b>${W.bothDays}일</b></div>
          <div><span>오늘 함께</span><b>${W.todayBoth ? "꽃잎 +25%" : "아직"}</b></div>
          <div><span>아름다움</span><b>${W.beauty}</b></div>
          <div><span>저절로 자라기</span><b>${fmt(W.idlePerMin)}/분 · ${W.capH}시간</b></div>
          <div><span>최고 연속</span><b>${W.mc}</b></div>
        </div>
        <h3 class="g-h">내 칭호</h3>
        <div class="story-btns">${titles.length ? titles.map((t) => `<button class="chip${mine.title === t ? " active" : ""}" data-act="title" data-k="${esc(t)}">${esc(t)}</button>`).join("") : `<p class="g-tip">업적을 받으면 칭호가 생겨요</p>`}</div>
      </div>`,
    };
  };

  // ---------- 가방 ----------
  SCREENS.bag = () => {
    const crops = SP.filter((s) => (W.inv["c" + s.id] || 0) > 0).map((s) => `<span class="bag-it">${spImg(s, 4, 0, 2)}<i>${fmt(W.inv["c" + s.id])}</i></span>`).join("");
    const dishes = C.RECIPE_LIST.filter((r) => (W.inv["k" + r.id] || 0) > 0).map((r) => `<span class="bag-it">${A.pixImg(r.sprite, 2)}<i>${W.inv["k" + r.id]}</i></span>`).join("");
    const decos = C.DECOR_LIST.filter((d) => (W.inv["o" + d.id] || 0) > 0).map((d) => `<span class="bag-it">${A.pixImg(d.sprite, 2, d.colors)}<i>${W.inv["o" + d.id]}</i></span>`).join("");
    return {
      title: "가방", tab: "more",
      html: `<div class="g-pad"><h3 class="g-h">꽃</h3><div class="bag">${crops || '<p class="g-tip">아직 비었어요</p>'}</div>
      <h3 class="g-h">요리</h3><div class="bag">${dishes || '<p class="g-tip">아직 비었어요</p>'}</div>
      <h3 class="g-h">장식</h3><div class="bag">${decos || '<p class="g-tip">아직 비었어요</p>'}</div></div>`,
    };
  };

  // ---------- 더보기 ----------
  SCREENS.more = () => {
    const orderN = [0, 1, 2].filter((s) => C.canFill(W, C.order(W, s))).length;
    const achN = C.ACH.filter((a) => !W.ac[a.id] && a.f(W)[0] >= a.f(W)[1]).length;
    const errN = C.ERRANDS.reduce((n, list, a) => n + (a <= W.maxArea ? list.filter((e) => !W.q[e.id] && e.f(W)[0] >= e.f(W)[1]).length : 0), 0);
    const items = [
      ["orders", "주문", A.critterImg("cat", 2), orderN],
      ["friends", "친구들", npcImg(0, 2), 0],
      ["games", "놀이", spr("heartOn", 2), 0],
      ["fest", D.FESTIVALS[W.month].name, spImg(SP[96 + W.month * 2], 4, 0, 2), 0],
      ["ach", "업적", ico("trophy", 3), achN],
      ["stats", "기록", ico("chart", 3), 0],
      ["bag", "가방", ico("sack", 3), 0],
      ["map", "지도", ico("pin", 3), 0],
      ["story", "부탁", ico("heart", 3), errN],
    ];
    return {
      title: "더보기",
      html: `<div class="g-pad"><div class="more-grid">${items.map(([k, n, ic, dot]) => `<button class="more-it" data-act="nav" data-to="${k}">${ic}<b>${esc(n)}</b>${dot ? `<i>${dot}</i>` : ""}</button>`).join("")}</div></div>`,
    };
  };

  // ============================================================
  // 누르기
  // ============================================================
  let holdTimer = 0, holdEl = null;
  let swipe = null;
  function onDown(ev) {
    if (!W) return;
    const t = ev.target.closest("[data-tap],[data-hold]");
    if (!t || !root.contains(t)) return;
    if (t.dataset.hold) {
      ev.preventDefault();
      holdEl = t;
      doHold(t);
      let wait = 380;
      const rep = () => { if (holdEl !== t) return; doHold(t); wait = Math.max(60, wait * 0.8); holdTimer = setTimeout(rep, wait); };
      holdTimer = setTimeout(rep, wait);
      return;
    }
    const k = t.dataset.tap;
    if (k === "plot") {
      tapPlot(t, ev);
      swipe = { x: ev.clientX, y: ev.clientY, d: 0, pk: t.dataset.pk };
    } else if (k === "npc") petNpc(t, ev);
    else if (k === "sparkle") catchSparkle(t);
    else if (k === "boss") tapBoss(t, ev);
    else if (k === "petbig") petBig(t, ev);
  }
  // 꽃 위를 문지르면 쓰다듬기
  function onMove(ev) {
    if (!swipe) return;
    const dx = ev.clientX - swipe.x, dy = ev.clientY - swipe.y;
    swipe.d += Math.hypot(dx, dy);
    swipe.x = ev.clientX; swipe.y = ev.clientY;
    if (swipe.d < 26) return;
    swipe.d = 0;
    const el = document.elementFromPoint(ev.clientX, ev.clientY);
    const plot = el && el.closest && el.closest(".plot[data-pk]");
    if (plot) { const p = C.plantAt(W, plot.dataset.pk); if (p && !p.ready) tapPlot(plot, ev, "pet"); }
  }
  function onUp() {
    swipe = null;
    if (holdEl) { holdEl = null; clearTimeout(holdTimer); refresh(); }
  }
  function doHold(el) {
    now();
    const k = el.dataset.hold;
    let ok = false;
    if (k === "tool") ok = C.upgradeTool(W, mine, el.dataset.k);
    if (k === "cook") ok = C.cook(W, mine, el.dataset.k);
    if (!ok) {
      el.animate([{ transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "none" }], { duration: 200 });
      holdEl = null; clearTimeout(holdTimer);
      return;
    }
    save();
    const [x, y] = centerOf(el);
    spawn(x, y, k === "tool" ? "star" : "petal", 6);
    if (k === "tool") {
      const row = el.closest(".wrow");
      const c = D.CARES.find((z) => z.key === el.dataset.k);
      const lv = W.toolLv[c.key];
      row.querySelector(".w-t b").textContent = c.tiers[Math.min(c.tiers.length - 1, Math.floor((lv - 1) / 10))];
      row.querySelector(".w-t i").textContent = `${c.verb} · Lv.${lv} · 힘 ${fmt(C.toolPow(lv) * W.mul.tap * 10)}`;
      el.innerHTML = money("petal", C.toolCost(lv));
      floatNum(x, y - 20, "Lv." + lv, "combo");
    } else floatNum(x, y - 20, "+1", "petal");
    hud();
  }

  function onClick(ev) {
    const t = ev.target.closest("[data-act]");
    if (!t || !root.contains(t) || !W) {
      if (!W && ev.target.closest("[data-me]")) setTimeout(() => { if (load()) { firstRun(); show("tab"); startTick(); queueAutoScenes(); } }, 0);
      return;
    }
    const act = t.dataset.act;
    const d = t.dataset;
    now();
    switch (act) {
      case "back": back(); break;
      case "tab": tab(d.to); break;
      case "nav": go(d.to, { a: d.a, i: d.i, sid: d.sid, slot: d.slot }); break;
      case "page": stack.pop(); go("page", { a: d.a, i: d.i }); break;
      case "tool":
        tool = d.k; mine.tool = tool;
        root.querySelectorAll(".gd-tool").forEach((b) => b.classList.toggle("on", b.dataset.k === tool));
        bumpEl(t);
        if (top().s === "garden") C.plotKeys(W, curArea()).forEach(updatePlot);
        break;
      case "questline": { const q = C.currentQuest(W); if (q) { if (q.area !== curArea() && q.area <= W.maxArea) { mine.area = q.area; save(); tab("garden"); } say(q.line, 5200); } break; }
      case "claimq": claimCurrent(); break;
      case "claime": { const e = C.ERRANDS.flat().find((x) => x.id === d.id); if (C.claimQuest(W, mine, e)) { save(); toast(`하트 +${e.reward.hearts} · 우정 +${e.reward.aff}`); spawn(...centerOf(t), "pet", 12); refresh(); } break; }
      case "claimf": { const f = C.festQuests(W).find((x) => x.id === d.id); if (C.claimQuest(W, mine, f)) { save(); toast("축제 선물을 받았어요"); spawn(...centerOf(t), "star", 12); refresh(); } break; }
      case "claima": { const a = C.ACH.find((x) => x.id === d.id); if (C.claimAch(W, mine, a)) { save(); toast(`${a.name} · 별조각 +${a.shards}`); flyTo(...centerOf(t), "gShard", "star", 4); refresh(); } break; }
      case "claimallach": { let n = 0; C.ACH.forEach((a) => { if (C.claimAch(W, mine, a)) n += a.shards; }); save(); toast(`별조각 +${n}`); refresh(); break; }
      case "buyplot": if (C.buyPlot(W, mine, curArea())) { save(); spawn(...centerOf(t), "leaf", 14); top().s === "garden" ? show("tab") : refresh(); } else nope(t, "꽃잎이 모자라요"); break;
      case "build": {
        const a = curArea();
        if (C.build(W, mine, a)) {
          save();
          spawn(...centerOf(t), "star", 30, { speed: 220 });
          banner(`${ico("home", 5)}<b>${esc(ST.CHAPTERS[a].builds[W.bld[a] - 1])}</b>`, "build");
          refresh();
        } else nope(t, "꽃잎이나 하트가 모자라요");
        break;
      }
      case "research": if (C.research(W, mine, d.k)) { save(); spawn(...centerOf(t), "star", 10); refresh(); } else nope(t, "별조각이 모자라요"); break;
      case "worktab": workTab = d.k; refresh(); break;
      case "booktab": bookTab = Number(d.k); refresh(); break;
      case "buydeco": if (C.buyDecor(W, mine, d.k)) { save(); spawn(...centerOf(t), "star", 10); toast("샀어요. 꾸미기 자리에 놓아 봐요"); refresh(); } else nope(t, "모자라요"); break;
      case "decoslot": go("decopick", { slot: d.slot }); break;
      case "place": if (C.placeDecor(W, mine, curArea(), Number(d.slot), d.k)) { save(); back(); } break;
      case "plant": plantSeed(Number(d.sid), top().p.pk); break;
      case "plantall": { const sid = mine.lastSeed != null ? mine.lastSeed : curArea() * 8; plantSeed(sid, null); break; }
      case "harvestall": harvestAll(); break;
      case "auto": mine.auto = mine.auto ? 0 : 1; save(); t.classList.toggle("active", !!mine.auto); toast(mine.auto ? "거두면 같은 꽃을 다시 심어요" : "다시 심기 끔"); break;
      case "area": mine.area = Number(d.a); save(); tab("garden"); break;
      case "fillorder": { const o = C.fillOrder(W, mine, Number(d.k)); if (o) { save(); flyTo(...centerOf(t), "gPet", "petal", 8); flyTo(...centerOf(t), "gHeart", "pet", 3); toast(`배달 끝! 꽃잎 +${fmt(o.petals)}`); refresh(); } break; }
      case "skiporder": C.skipOrder(W, mine, Number(d.k)); save(); refresh(); break;
      case "give": { const pts = C.giveDish(W, mine, Number(d.a), d.k); if (pts) { save(); spawn(...centerOf(t), "pet", 16); toast(`우정 +${pts}`); checkHeartEvent(Number(d.a), C.affLevel(W.af[Number(d.a)])); refresh(); } break; }
      case "heartev": playScene(ST.CHAPTERS[Number(d.a)].hearts[Number(d.i)]); break;
      case "replay": {
        const k = d.k;
        if (k === "pro") playScene(ST.PROLOGUE);
        else if (k === "fin") playScene(ST.FINALE);
        else if (k.startsWith("in")) playScene(ST.CHAPTERS[Number(k.slice(2))].intro);
        else if (k.startsWith("out")) playScene(ST.CHAPTERS[Number(k.slice(3))].outro);
        break;
      }
      case "playgame": { if (top().s === "play") stack.pop(); if (stopMini) { stopMini(); stopMini = null; } go("play", { k: d.k, s: d.s }); const tp = top(); tp.p.k = d.k; tp.p.s = d.s; break; }
      case "festswap": if (C.festSwap(W, mine, "hearts")) { save(); toast("하트 +3"); refresh(); } else nope(t, "토큰이 모자라요"); break;
      case "title": mine.title = mine.title === d.k ? "" : d.k; save(); refresh(); break;
      default: break;
    }
  }
  function nope(el, msg) {
    el.animate([{ transform: "translateX(-5px)" }, { transform: "translateX(5px)" }, { transform: "translateX(-3px)" }, { transform: "none" }], { duration: 260 });
    if (msg) toast(msg);
  }

  // 정원이 열려 있는 동안 1초마다 자라는 모습
  function startTick() {
    stopTick();
    tickTimer = setInterval(() => {
      if (!W || root.hidden || document.hidden) return;
      const s = top().s;
      if (s !== "garden") return;
      now();
      C.plotKeys(W, curArea()).forEach(updatePlot);
    }, 1000);
  }
  function stopTick() { clearInterval(tickTimer); tickTimer = 0; }

  // ============================================================
  // 홈 화면과 이어지는 곳
  // ============================================================
  function ensureW() {
    if (!W) { if (!load()) return false; firstRun(); }
    else { now(); }
    return true;
  }
  window.Garden = {
    bind(helpers) {
      H = helpers;
      ensureRoot();
      document.addEventListener("keydown", (e) => { if (e.key === "Escape" && root && !root.hidden) { if (sceneOn) sceneTap(e); else back(); } });
    },
    open,
    close,
    isOpen() { return !!root && !root.hidden; },
    // 다른 폰에서 바뀐 게 들어왔을 때
    render() {
      if (!root || root.hidden) { W = null; return; }
      if (!W) { if (load()) { firstRun(); show("tab"); startTick(); queueAutoScenes(); } return; }
      load();
      refresh();
    },
    // 홈 풍경 속 화분 세 개
    sceneSvgs() {
      if (!ensureW()) return [];
      const a = curArea();
      return C.plotKeys(W, a).slice(0, 3).map((pk, i) => {
        const p = C.plantAt(W, pk);
        return {
          plot: i,
          html: p ? spImg(p.sp, p.stage, 0, 2) : A.pixImg("pot", 2),
          plant: p ? { stage: p.stage, ready: p.ready, thirsty: false, wilted: false, bugs: [] } : null,
          key: p ? `${p.sid}:${p.stage}:${p.ready}` : "empty",
        };
      });
    },
    badge() {
      if (!ensureW()) return "";
      const q = C.currentQuest(W);
      if (q && q.done) return "할 일!";
      for (let a = 0; a <= W.maxArea; a++) if (C.plotKeys(W, a).some((pk) => { const p = C.plantAt(W, pk); return p && p.ready; })) return "수확!";
      return `${W.maxArea + 1}장`;
    },
    // 홈 화면 정원 카드
    home() {
      if (!ensureW()) return null;
      const a = curArea();
      const q = C.currentQuest(W);
      const plants = C.plotKeys(W, a).map((pk) => C.plantAt(W, pk));
      return {
        area: D.AREAS[a].name, chapter: W.maxArea + 1, npc: npcImg(a, 3),
        quest: q ? { text: q.text, f: Math.min(1, q.cur / q.need), done: q.done } : null,
        plants: plants.map((p) => (p ? { html: spImg(p.sp, p.stage, 0, 2), ready: p.ready, f: p.frac } : null)),
        petals: fmt(W.petals),
      };
    },
    // 홈 화면 카드에서 바로 돌보기 (꽃 하나)
    quickTap(i) {
      if (!ensureW()) return null;
      const a = curArea();
      const pk = `${a}:${i}`;
      const p = C.plantAt(W, pk);
      if (!p) return null;
      if (p.ready) { const r = C.harvest(W, mine, pk); save(); return r ? { harvest: r, petals: r.petals } : null; }
      const w = wantOf(pk);
      const r = C.tap(W, mine, pk, w.want, { want: w.want, combo: Math.min(combo, 5) });
      if (r) { w.left--; if (w.left <= 0) rollWant(pk); save(); }
      return r;
    },
    rain() { /* 비가 오면 저절로 자라는 걸로 충분해요 */ },
    attend() {
      if (!ensureW()) return;
      const k = C.dayKey(Date.now());
      if (!mine.dy[k]) { mine.dy[k] = 1; save(); recompute(); }
    },
    _debug() { return { W, mine }; },
  };
})();
