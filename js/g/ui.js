// ============================================================
// 꽃마루 정원: 화면
// 게임은 정원 한 화면에서만 해요. 메뉴를 파고들지 않아요.
// 정원 안의 물건(건물, 냄비, 우편함, 추억 나무, 장식, 큰 봉오리)을 누르거나
// 이야기와 이벤트가 알아서 떠서 다음 할 일로 데려가요.
// 창은 언제나 한 겹만 뜨고, 닫으면 정원이에요.
// 누를 때는 바뀐 칸만 고쳐요. (화면 전체를 다시 그리지 않아서 깜빡이지 않아요)
// ============================================================
(function () {
  "use strict";

  const D = window.GData;
  const C = window.GCore;
  const ST = window.GStory;
  const A = window.GArt;
  const M = window.GMemory;
  const SP = D.SPECIES;
  const NA = D.AREAS.length;
  const cfg = typeof DIARY_CONFIG !== "undefined" ? DIARY_CONFIG : {};
  const NAME = { him: cfg.him || "석영", her: cfg.her || "예은" };
  const $ = (id) => document.getElementById(id);
  const TOOLS = D.CARES.map((c) => c.key);
  const KEY = "G3";

  let H = null;
  let root, main, fxl, cv, cx;
  let who = "", mine = null, W = null, myT = 0;
  let stopMini = null;
  let tool = "water";
  let combo = 0;
  const wants = {};
  let sparkleIn = 30;
  let inviteIn = 140;
  let tickTimer = 0;
  let lastQuestId = "";
  let sheet = null; // { k, p }

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
    if (n < 0) return "-" + fmt(-n);
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
    if (name === NAME.him) return A.pixImg("him", 4);
    if (name === NAME.her) return A.pixImg("her", 4);
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
  let appH = 0, memList = [], memStage = 0;
  function readApp() {
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
    appH = n;
    memList = M.memories();
    memStage = M.treeStage(memList.length);
  }
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
    readApp();
    recompute();
    return true;
  }
  function recompute() {
    if (!mine) return;
    const o = Store.pair(KEY, other());
    const od = o ? o : C.emptyDoc();
    W = C.world(who === "him" ? mine : od, who === "him" ? od : mine, { now: Date.now(), app: { hearts: appH, mem: memStage } });
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
        <button class="g-x close" data-act="close" aria-label="닫기">${ico("close", 3)}</button>
        <button class="g-title" data-act="sheet" data-k="map" id="gTitle"></button>
        <div class="g-money">
          <span class="g-coin petal" id="gPet">${PETAL()}<b></b></span>
          <span class="g-coin heart" id="gHeart">${HEART()}<b></b></span>
          <button class="g-coin shard" id="gShard" data-act="sheet" data-k="research">${SHARD()}<b></b></button>
        </div>
      </header>
      <main class="g-main" id="gMain"></main>
      <div class="g-sheet" id="gSheet" hidden>
        <div class="gs-dim" data-act="sheetclose"></div>
        <section class="gs-box"><header class="gs-head"><b id="gsTitle"></b><button class="gs-x" data-act="sheetclose" aria-label="닫기">${ico("close", 3)}</button></header><div class="gs-body" id="gsBody"></div></section>
      </div>
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
    cv.width = Math.round(window.innerWidth);
    cv.height = Math.round(window.innerHeight);
  }

  function open(screen, params) {
    ensureRoot();
    root.hidden = false;
    root.classList.remove("closing");
    document.body.classList.add("game-open");
    if (window.Scene) Scene.setActive(false);
    root.animate([{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: "cubic-bezier(.22,1,.36,1)" });
    sizeCanvas();
    if (!load()) { renderWho(); return; }
    firstRun();
    drawGarden();
    startTick();
    queueAutoEvents();
    if (screen && SHEETS[screen]) openSheet(screen, params || {});
  }
  function close() {
    if (stopMini) { stopMini(); stopMini = null; }
    stopTick();
    if (mine) save();
    closeSheet(true);
    root.classList.add("closing");
    setTimeout(() => {
      root.hidden = true; root.classList.remove("closing"); document.body.classList.remove("game-open");
      if (window.Scene && document.querySelector('.view[data-view="home"].is-active')) Scene.setActive(true);
    }, 200);
    if (H && H.onChanged) H.onChanged();
  }
  function renderWho() {
    $("gTitle").textContent = "꽃마루 정원";
    main.innerHTML = `<div class="g-pad">${H.whoAsk()}</div>`;
  }

  // ---------- 창 (한 겹) ----------
  function openSheet(k, p) {
    if (stopMini) { stopMini(); stopMini = null; }
    const was = !!sheet;
    sheet = { k, p: p || {} };
    const el = $("gSheet");
    const out = SHEETS[k](sheet.p);
    $("gsTitle").textContent = out.title;
    const body = $("gsBody");
    body.__html = "";
    body.innerHTML = out.html;
    body.scrollTop = 0;
    el.className = "g-sheet" + (out.tall ? " tall" : "");
    el.hidden = false;
    if (!was) {
      el.querySelector(".gs-box").animate([{ transform: "translateY(100%)" }, { transform: "none" }], { duration: 300, easing: "cubic-bezier(.22,1,.36,1)" });
      el.querySelector(".gs-dim").animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220 });
    } else body.animate([{ opacity: 0.5 }, { opacity: 1 }], { duration: 160 });
    if (out.mount) out.mount();
    hud();
  }
  // 같은 창 안에서 내용만 바꾸기 (탭, 자세히 보기)
  function setSheet(p) {
    if (!sheet) return;
    Object.assign(sheet.p, p);
    const out = SHEETS[sheet.k](sheet.p);
    $("gsTitle").textContent = out.title;
    const body = $("gsBody");
    MORPH(body, out.html);
    if (p && (p.sid != null || p.page != null || p.tab != null)) body.scrollTop = 0;
  }
  function refreshSheet() {
    if (!sheet || stopMini || sheet.k === "play") return;
    if (sheet.k === "boss") { updateBoss(); return; }
    const out = SHEETS[sheet.k](sheet.p);
    $("gsTitle").textContent = out.title;
    MORPH($("gsBody"), out.html);
  }
  function closeSheet(instant) {
    if (!sheet) return;
    if (stopMini) { stopMini(); stopMini = null; }
    const was = sheet.k;
    sheet = null;
    const el = $("gSheet");
    if (instant) { el.hidden = true; return; }
    const box = el.querySelector(".gs-box");
    box.animate([{ transform: "none" }, { transform: "translateY(100%)" }], { duration: 200, easing: "ease-in" }).onfinish = () => { if (!sheet) el.hidden = true; };
    el.querySelector(".gs-dim").animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 });
    if (was === "boss" || was === "seeds" || was === "build" || was === "decor" || was === "map") drawGarden(); else updateGarden();
    queueAutoEvents();
  }

  // ---------- 머리 숫자 ----------
  let hudRaf = 0;
  let signAt = 0;
  function hud(now_) {
    if (hudRaf && !now_) return;
    const run = () => {
      hudRaf = 0;
      if (!W) return;
      root.querySelector("#gPet b").textContent = fmt(Math.max(0, W.petals));
      root.querySelector("#gHeart b").textContent = fmt(Math.max(0, W.hearts));
      root.querySelector("#gShard b").textContent = fmt(Math.max(0, W.shards));
      const t = performance.now();
      if (now_ || t - signAt > 900) { signAt = t; signs(); }
    };
    if (now_) run(); else hudRaf = requestAnimationFrame(run);
  }
  // 정원 물건 위의 작은 알림 (무거워서 1초에 한 번만)
  function signs() {
    const canRs = D.RESEARCH.some((r) => (W.rs[r.key] || 0) < r.max && W.shards >= C.researchCost(W.rs[r.key] || 0));
    $("gShard").classList.toggle("glow", canRs);
    if (!main) return;
    const a = curArea();
    const s = W.bld[a] || 0;
    const bc = s < 3 ? C.bldCost(a, s) : null;
    toggleSign("gBld", bc && W.petals >= bc.petals && W.hearts >= bc.hearts);
    toggleSign("gPot", C.RECIPE_LIST.some((r) => r.area <= W.maxArea && C.canCook(W, r) && !(W.ck[r.id] > 0)));
    const fill = [0, 1, 2].filter((sl) => C.canFill(W, C.order(W, sl))).length;
    toggleSign("gMail", fill > 0, fill);
    autoClaims();
  }
  function toggleSign(id, on, n) {
    const el = $(id);
    if (!el) return;
    const b = el.querySelector(".obj-sign");
    if (!b) return;
    b.classList.toggle("on", !!on);
    if (n != null) b.textContent = on ? String(n) : "";
  }
  function bumpEl(el) {
    if (!el) return;
    el.animate([{ transform: "scale(1.25)" }, { transform: "scale(1)" }], { duration: 280, easing: "cubic-bezier(.34,1.56,.64,1)" });
  }
  function pulse(el) {
    if (!el) return;
    el.animate([{ transform: "scale(1)" }, { transform: "scale(1.18)" }, { transform: "scale(1)" }, { transform: "scale(1.12)" }, { transform: "scale(1)" }], { duration: 900, easing: "ease-in-out" });
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
    toast.tm = setTimeout(() => { t.className = "g-toast"; }, 2400);
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

  // ============================================================
  // 이야기와 이벤트
  // ============================================================
  function firstRun() {
    if (!mine.seen.pro) {
      if (!W.pl["0:0"]) { now(); C.plant(W, mine, "0:0", 0); }
      save();
    }
  }
  let evQ = [];
  let sceneOn = false;
  // 열 때, 창을 닫을 때, 기록이 새로 들어왔을 때 차례대로 떠요.
  function queueAutoEvents() {
    if (!mine || sheet || sceneOn) return;
    const a = curArea();
    const npc = ST.CHAPTERS[a].npc;
    const ev = [];
    if (!mine.seen.pro) ev.push([ST.PROLOGUE, () => { mine.seen.pro = 1; }]);
    const ourWill = mine.seen.our || mine.seen.pro || ev.length > 0;
    if (!mine.seen.our) {
      ev.push([ourIntro(), () => {
        mine.seen.our = 1;
        memList.forEach((m) => { if (/^e:seed-/.test(m.id)) mine.seen["mm:" + m.id] = 1; });
        mine.memSeen = memStage;
      }]);
    }
    if (!mine.seen["in" + a] && a > 0) ev.push([ST.CHAPTERS[a].intro, () => { mine.seen["in" + a] = 1; }]);
    if (W.finished && !mine.seen.fin) ev.push([ST.FINALE.concat(ourFinale()), () => { mine.seen.fin = 1; }]);
    // 기념 순간: 가장 최근 것 하나만 보여 주고, 지난 것은 조용히 넘겨요
    const ms = M.milestones(Date.now()).filter((m) => !mine.seen[m.id]);
    if (ms.length && ourWill) {
      const last = ms[ms.length - 1];
      ev.push([M.milestoneScene(last, npc, M.stats(memList)), () => {
        ms.forEach((m) => { mine.seen[m.id] = 1; });
        C.claimFlag(W, mine, `${last.id}:${who}`, { hearts: 10, shards: 2 });
        toast("기념 선물 하트 +10 · 별조각 +2");
      }]);
    }
    // 새 추억: 세 개까지는 하나씩, 나머지는 한꺼번에
    if (ourWill) {
      const fresh = memList.filter((m) => !mine.seen["mm:" + m.id] && !/^e:seed-/.test(m.id));
      fresh.slice(0, 3).forEach((m) => {
        ev.push([M.scene(m, npc), () => {
          mine.seen["mm:" + m.id] = 1;
          memReward(1);
        }]);
      });
      if (fresh.length > 3) {
        const rest = fresh.slice(3);
        ev.push([[["우편냥", `추억 편지가 ${rest.length}통 더 있다냥. 추억 나무에 다 걸어 뒀다냥.`]], () => {
          rest.forEach((m) => { mine.seen["mm:" + m.id] = 1; });
          memReward(rest.length);
        }]);
      }
      if (memStage > (mine.memSeen || 0)) {
        ev.push([treeScene(memStage, npc), () => { mine.memSeen = memStage; }]);
      }
    }
    ev.forEach(([lines, end]) => playScene(lines, () => { end(); save(); hud(true); if (top()) drawGarden(); }));
  }
  function top() { return main && main.querySelector(".gd"); }
  function memReward(n) {
    now();
    const pet = Math.round(C.baseValue(SP[W.maxArea * 8], W) * 3 * n);
    mine.he += 2 * n; W.hearts += 2 * n;
    mine.pe += pet; W.petals += pet;
    toast(`추억 선물 하트 +${2 * n} · 꽃잎 +${fmt(pet)}`);
  }
  function ourIntro() {
    const md = M.md;
    const lines = [
      ["마루", "참, 너희도 이야기가 있지?"],
      ["마루", `${md(cfg.firstMet)}, ${cfg.firstPlace || "어느 곳"}에서 처음 만났다며! 그리고 ${md(cfg.startDate)}에 1일.`],
      ["마루", "할머니 일기장처럼, 너희 이야기도 이 정원에 같이 적어 두자. 앱에 추억을 남기면 우편냥이 편지로 가져올 거야."],
      ["", "두 사람이 남긴 기록은 추억 나무를 키우고, 정원 친구들이 하나씩 읽어 줘요."],
    ];
    return lines;
  }
  function ourFinale() {
    const s = M.stats(memList);
    return [
      ["달래", `{h}, {e}. 너희 추억 나무도 봤어. 추억이 ${s.total}개나 걸려 있더구나.`],
      ["달래", "우리 일기는 여기서 끝나지만, 너희 일기는 이제 시작이야."],
    ];
  }
  function treeScene(stage, npc) {
    const name = M.TREE_NAME[stage];
    return [["", `추억 나무가 자랐어요. ${name}.`], [npc, stage >= 7 ? "이 나무는 너희가 같이 보낸 날들로 자란 거야. 할머니 정원 어디에도 이렇게 큰 나무는 없었어." : "너희가 추억을 적을 때마다 나무가 쑥쑥 커. 신기하지?"], ["", `꽃잎 +${stage * 4}% · 저절로 자라기 +${stage * 5}%`]];
  }

  // ---------- 대화 ----------
  let sceneLines = [], sceneI = 0, sceneEnd = null, typing = 0, typeFull = "", typeRaf = 0;
  function playScene(lines, onEnd) {
    evQ.push([lines, onEnd]);
    if (!sceneOn) nextScene();
  }
  function nextScene() {
    const item = evQ.shift();
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
    let last = 0;
    cancelAnimationFrame(typeRaf);
    const step = (ts) => {
      if (!typing) return;
      if (!last) last = ts;
      const shown = Math.min(text.length, Math.floor((ts - last) / 28));
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
    if (!w) w = wants[pk] = { want: TOOLS[(C.hash(pk + Date.now()) >> 3) % 4], left: 4 + Math.floor(Math.random() * 6) };
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
  // 정원 (단 하나의 화면)
  // ============================================================
  function plotInner(pk) {
    const p = C.plantAt(W, pk);
    if (!p) return `<span class="pl-soil"></span><span class="pl-img"></span><i class="pl-empty">${ico("leaf", 2)}</i>`;
    const w = wantOf(pk);
    return `<span class="pl-soil"></span><span class="pl-img">${spImg(p.sp, p.stage, 0, 3)}</span>
      <i class="pl-want${p.ready ? " off" : ""}">${careIcon(w.want, 2)}</i>
      <i class="pl-bar"><b style="transform:scaleX(${p.frac.toFixed(3)})"></b></i>
      <i class="pl-ready${p.ready ? " on" : ""}">${ico("basket", 2)}</i>`;
  }
  function decoSlot(a, i) {
    const d = W.deco[`${a}:${i}`];
    const item = d && d[0] ? C.DECOR_MAP[d[0]] : null;
    return item ? `<button class="gd-deco d${i}" data-act="sheet" data-k="decor" data-slot="${i}">${A.pixImg(item.sprite, 3, item.colors)}</button>` : "";
  }
  // 할 일에 맞는 "하러 가기"
  function questGo(q) {
    if (!q) return null;
    const k = q.kind;
    if (k === "plot") return ["땅 사기", "buyplot"];
    if (k === "build") return ["짓기", "sheet:build"];
    if (k === "cook") return ["요리", "sheet:kitchen"];
    if (k === "orders") return ["주문", "sheet:orders"];
    if (k === "boss") return ["봉오리", "sheet:boss"];
    if (k === "tool") return ["도구", "hint:tool"];
    if (k === "pet") return ["쓰다듬기", "hint:npc"];
    if (k === "special") {
      const a = q.area;
      if (a === 1 || a === 9) return a === 1 ? ["연구", "sheet:research"] : ["씨앗", "sheet:seeds"];
      if (a === 2) return ["놀이", "play:catch"];
      if (a === 4) return ["요리", "sheet:kitchen"];
      if (a === 5) return ["꾸미기", "sheet:build"];
      if (a === 6) return ["쓰다듬기", "hint:npc"];
      return null;
    }
    return ["씨앗", "sheet:seeds"];
  }
  function questStrip() {
    const q = C.currentQuest(W);
    if (!q) return `<div class="gd-quest done"><button class="gd-q-text" data-act="sheet" data-k="book" data-tab="our">${ico("trophy", 2)}<span>모든 이야기를 끝냈어요. 이제 너희 이야기</span></button></div>`;
    const f = Math.min(1, q.cur / q.need);
    const where = q.area !== curArea() ? `<em>${esc(D.AREAS[q.area].name)}</em> ` : "";
    const go = questGo(q);
    return `<div class="gd-quest${q.done ? " ready" : ""}">
      <button class="gd-q-text" data-act="questline">${npcImg(q.area, 2)}<span>${where}${esc(q.text)}</span></button>
      ${q.done ? `<button class="btn small primary gd-claim" data-act="claimq">받기</button>`
        : `<span class="gd-q-num">${fmt(q.cur)}/${fmt(q.need)}</span>${go ? `<button class="chip gd-go" data-act="go" data-go="${go[1]}">${esc(go[0])}</button>` : ""}`}
      ${bar(f, "q")}
    </div>`;
  }
  function toolsHtml() {
    return `<div class="gd-tools">${TOOLS.map((k) => {
      const c = D.CARES.find((x) => x.key === k);
      return `<button class="gd-tool${tool === k ? " on" : ""}" data-act="tool" data-k="${k}">${careIcon(k, 3)}<b>${c.name}</b><i>Lv.${W.toolLv[k]}</i></button>`;
    }).join("")}</div>
    <div class="gd-ups">${TOOLS.map((k) => {
      const cost = C.toolCost(W.toolLv[k]);
      return `<button class="gd-up${W.petals >= cost ? " can" : ""}" data-hold="tool" data-k="${k}">${ico("down", 1)}${money("petal", cost)}</button>`;
    }).join("")}</div>
    <div class="gd-combo" id="gCombo"><span>연속</span><b>${combo}</b><i class="g-bar c"><b style="transform:scaleX(${(combo / W.comboMax).toFixed(3)})"></b></i></div>`;
  }
  function treeImg() {
    const tr = SP[3 * 8 + 2]; // 벚나무 모양
    const st = memStage;
    const stage = st === 0 ? 0 : st === 1 ? 1 : st <= 3 ? 2 : st <= 5 ? 3 : 4;
    const scale = st >= 6 ? 4 : 3;
    return spImg(tr, stage, st >= 9 ? 2 : 0, scale);
  }
  function drawGarden() {
    if (!W || !main) return;
    now();
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
    const s = W.bld[a] || 0;
    const fest = SP.some((x) => x.season && x.month === W.month);
    $("gTitle").innerHTML = `${esc(ar.name)} <span class="g-title-dn">${ico("down", 2)}</span>${W.todayBoth ? `<span class="g-together">${HEART()}함께</span>` : ""}`;
    main.innerHTML = `<div class="gd" data-area="${a}">
      ${questStrip()}
      <div class="gd-field${ar.dark ? " dark" : ""}" id="gField" style="--sky0:${ar.sky[0]};--sky1:${ar.sky[1]};--ground:${ar.ground};--soil:${ar.soil}">
        <span class="gd-hill"></span>
        <button class="gd-obj gd-tree" data-act="sheet" data-k="book" data-tab="our" aria-label="추억 나무">${treeImg()}<i class="obj-name">추억 ${memList.length}</i></button>
        ${[0, 1, 2, 3].map((i) => decoSlot(a, i)).join("")}
        <button class="gd-obj gd-pot" id="gPot" data-act="sheet" data-k="kitchen" aria-label="부엌">${A.pixImg("bowl", 3) || A.pixImg("pot", 3)}<i class="obj-sign"></i></button>
        <button class="gd-obj gd-mail" id="gMail" data-act="sheet" data-k="orders" aria-label="우편함">${A.pixImg("mailbox", 3)}<i class="obj-sign num"></i></button>
        <button class="gd-obj gd-bld s${s}" id="gBld" data-act="sheet" data-k="build" aria-label="${esc(ar.bld)}">${A.pixImg(s >= 2 ? "house2" : "house", 3)}<i class="obj-name">${esc(ar.bld)} ${s}/3</i><i class="obj-sign">${ico("tick", 1)}</i></button>
        <button class="gd-npc" data-tap="npc" aria-label="${esc(ar.npc)}">${npcImg(a, 3)}<i class="gd-aff">${HEART()}${C.affLevel(W.af[a] || 0)}</i></button>
        <div class="gd-say" id="gSay"></div>
        ${fest ? `<button class="gd-flag" data-act="sheet" data-k="fest">${spImg(SP[96 + W.month * 2], 4, 0, 1)}<b>${esc(D.FESTIVALS[W.month].name)}</b></button>` : ""}
        ${bossReady ? `<button class="gd-boss" data-act="sheet" data-k="boss">${spImg(SP[a * 8 + 5], 3, 0, 3)}<b>큰 봉오리</b></button>` : ""}
        <button class="gd-invite" id="gInvite" hidden></button>
        <div class="gd-plots">${plots}</div>
        <button class="gd-sparkle" id="gSparkle" data-tap="sparkle" hidden>${ico("spark", 3)}</button>
      </div>
      ${toolsHtml()}
      <div class="gd-row">
        <button class="chip" data-act="harvestall">${ico("basket", 2)}다 거두기</button>
        <button class="chip${mine.auto ? " active" : ""}" data-act="auto">${ico("tick", 2)}다시 심기</button>
        <button class="chip" data-act="sheet" data-k="seeds">${spr("seedBag", 2)}씨앗</button>
        <button class="chip" data-act="sheet" data-k="book">${ico("book", 2)}일기장</button>
      </div>
    </div>`;
    lastQuestId = (C.currentQuest(W) || {}).id || "";
    hud(true);
    if (stuckInvite()) showInvite("catch", true);
  }
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
    if (!top()) return;
    now();
    const a = curArea();
    C.plotKeys(W, a).forEach(updatePlot);
    updateQuestStrip(C.currentQuest(W));
    const aff = main.querySelector(".gd-aff");
    if (aff) { const lv = String(C.affLevel(W.af[a] || 0)); if (aff.lastChild.textContent !== lv) aff.lastChild.textContent = lv; }
    updateTools();
  }
  function updateTools() {
    main.querySelectorAll(".gd-tool i").forEach((i, k) => { const v = "Lv." + W.toolLv[TOOLS[k]]; if (i.textContent !== v) i.textContent = v; });
    main.querySelectorAll(".gd-up").forEach((b, k) => {
      const cost = C.toolCost(W.toolLv[TOOLS[k]]);
      const t = fmt(cost);
      const bb = b.querySelector(".g-cost b");
      if (bb && bb.textContent !== t) bb.textContent = t;
      b.classList.toggle("can", W.petals >= cost);
    });
  }
  function updateQuestStrip(q) {
    const qEl = main.querySelector(".gd-quest");
    if (!qEl) return;
    const qid = (q && q.id) + ":" + (q && q.done);
    if (qEl.dataset.qid !== qid) {
      const tmp = document.createElement("div");
      tmp.innerHTML = questStrip();
      const nq = tmp.firstElementChild;
      nq.dataset.qid = qid;
      qEl.replaceWith(nq);
      if (q && q.done) bumpEl(nq);
    } else if (q) {
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
    if (!p) { openSheet("seeds", { pk }); return; }
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
    el.querySelector(".pl-img").animate([{ transform: "scale(1.12, .88)" }, { transform: "scale(.96, 1.06)" }, { transform: "none" }], { duration: 200, easing: "ease-out" });
    if (r.match) { w.left--; if (w.left <= 0) rollWant(pk); } else if (Math.random() < 0.25) rollWant(pk);
    setCombo(r.combo);
    if (r.combo && r.combo % 10 === 0 && r.match) floatNum(x, y - 40, `연속 ${r.combo}`, "combo");
    updatePlot(pk);
    if (r.ready) { el.animate([{ transform: "scale(1.08)" }, { transform: "none" }], { duration: 300 }); spawn(x, y, "star", 10); }
    sparkleTick();
    inviteTick();
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
    let n = 0;
    C.plotKeys(W, curArea()).forEach((pk) => {
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
    } else if (Math.random() < 0.06) {
      const r = M.remark(ST.CHAPTERS[a].npc, Date.now());
      if (r) say(r, 4200);
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
    s.style.top = (8 + Math.random() * 22) + "%";
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

  // 놀이는 이벤트로 찾아와요: 벌레가 나타나거나, 하트 비가 오거나
  const INVITES = {
    catch: ["하트 비가 내려요", "heartOn"],
    whack: ["벌레가 나타났어요", "bug"],
    rhythm: ["꽃이 목말라해요", "can"],
    memory: ["꽃잎이 뒤섞였어요", "petal"],
    simon: ["새가 노래를 불러요", "note"],
  };
  function stuckInvite() {
    const q = C.currentQuest(W);
    return q && q.kind === "special" && q.area === 2 && !q.done;
  }
  function inviteTick() {
    inviteIn -= 1;
    if (inviteIn > 0) return;
    inviteIn = 140 + Math.floor(Math.random() * 120);
    const keys = Object.keys(INVITES);
    const k = keys[(mine.inv_i = ((mine.inv_i || 0) + 1)) % keys.length];
    showInvite(k);
  }
  function showInvite(k, stay) {
    const b = $("gInvite");
    if (!b) return;
    const best = W.mg[k] || 0;
    const st = Math.min(10, best + 1);
    b.dataset.k = k; b.dataset.s = st;
    b.dataset.act = "play";
    b.innerHTML = `${A.pixImg(INVITES[k][1], 2) || spr(INVITES[k][1], 2)}<b>${INVITES[k][0]}</b><i>${st}단계</i>`;
    b.hidden = false;
    b.animate([{ transform: "translateY(-20px) scale(.6)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 360, easing: "cubic-bezier(.34,1.56,.64,1)" });
    clearTimeout(showInvite.tm);
    if (!stay) showInvite.tm = setTimeout(() => { b.hidden = true; }, 14000);
  }

  // 행동이 끝날 때마다 (한 프레임에 한 번)
  let afterRaf = 0;
  function afterAction() {
    hud();
    if (afterRaf) return;
    afterRaf = requestAnimationFrame(() => {
      afterRaf = 0;
      if (!top()) return;
      const q = C.currentQuest(W);
      const qid = (q && q.id) || "";
      if (q && q.done && lastQuestId !== qid + ":done") {
        lastQuestId = qid + ":done";
        say("다 했다! 위에 받기를 눌러 줘");
      }
      updateQuestStrip(q);
      updateTools();
    });
  }
  // 업적과 친구 부탁은 다 하면 알아서 받아요
  function autoClaims() {
    if (!W || sceneOn) return;
    let shards = 0;
    const names = [];
    C.ACH.forEach((a) => { if (C.claimAch(W, mine, a)) { shards += a.shards; names.push(a.name); } });
    if (names.length) { save(); toast(`업적 ${names[0]}${names.length > 1 ? ` 외 ${names.length - 1}개` : ""} · 별조각 +${shards}`, "star"); }
    for (let a = 0; a <= W.maxArea; a++) {
      for (const e of C.ERRANDS[a]) {
        if (W.q[e.id]) continue;
        const [c, n] = e.f(W);
        if (c < n) continue;
        if (C.claimQuest(W, mine, e)) {
          save();
          playScene([[ST.CHAPTERS[a].npc, `부탁한 "${e.text}", 해 줬구나! 고마워.`]], () => toast(`하트 +${e.reward.hearts} · 우정 +${e.reward.aff}`));
          return;
        }
      }
    }
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
    const npc = ST.CHAPTERS[q.area].npc;
    const nq = C.currentQuest(W);
    const lines = [];
    if (q.kind === "build") {
      const line = ST.CHAPTERS[q.area].builds[(W.bld[q.area] || 1) - 1];
      if (line) lines.push(["", line]);
    }
    if (q.diary != null) {
      const pg = ST.CHAPTERS[q.area].diary[q.diary];
      lines.push([npc, "어? 일기장 한 쪽을 찾았어!"]);
      lines.push(["편지", `달래의 일기 · ${pg.title}\n\n${pg.text}`]);
    }
    if (q.last) {
      const a = q.area;
      lines.push(...ST.CHAPTERS[a].outro);
      const rem = M.remark(npc, "out" + a);
      if (rem) lines.push([npc, "참, " + rem]);
      playScene(lines, () => {
        mine.seen["out" + a] = 1;
        if (a + 1 < NA) {
          mine.area = a + 1;
          save();
          drawGarden();
          playScene(ST.CHAPTERS[a + 1].intro, () => { mine.seen["in" + (a + 1)] = 1; save(); });
        } else {
          save();
          playScene(ST.FINALE.concat(ourFinale()), () => { mine.seen.fin = 1; save(); });
        }
      });
    } else {
      if (nq) {
        lines.push([ST.CHAPTERS[nq.area].npc, nq.line]);
        if (Math.random() < 0.3) { const rem = M.remark(npc, nq.id); if (rem) lines.push([npc, "참, " + rem]); }
      }
      playScene(lines, () => { save(); });
    }
    lastQuestId = (nq && nq.id) || "";
    updateGarden();
    if (nq && nq.area !== curArea() && nq.area <= W.maxArea) { mine.area = nq.area; save(); drawGarden(); }
  }
  // 할 일 옆 단추: 필요한 곳으로 바로 데려가요
  function doGo(g) {
    const [kind, arg] = g.split(":");
    if (kind === "sheet") { openSheet(arg, {}); return; }
    if (kind === "play") { openSheet("play", { k: arg, s: Math.min(10, (W.mg[arg] || 0) + 1) }); return; }
    if (kind === "hint") {
      if (arg === "tool") { main.querySelectorAll(".gd-up").forEach(pulse); say("아래 화살표를 누르면 도구가 좋아져. 꾹 누르고 있으면 계속!"); }
      if (arg === "npc") { pulse(main.querySelector(".gd-npc")); say("나를 눌러서 쓰다듬어 줘!"); }
      return;
    }
    if (kind === "buyplot") { buyPlot(main.querySelector(".plot.buy")); }
  }
  function buyPlot(el) {
    if (C.buyPlot(W, mine, curArea())) {
      save();
      if (el) spawn(...centerOf(el), "leaf", 14);
      drawGarden();
    } else nope(el, "꽃잎이 모자라요");
  }

  // ============================================================
  // 창 내용들 (모두 한 겹)
  // ============================================================
  const SHEETS = {};

  SHEETS.seeds = (p) => {
    const a = curArea();
    const list = SP.filter((s) => s.area === a || (s.season && s.month === W.month));
    const rows = list.map((s) => {
      const open = C.speciesOpen(W, s);
      const cost = C.seedCost(s, W);
      const n = W.hc[s.id] || 0;
      const lock = !open ? (s.rare ? `${D.AREAS[a].bld} 2단계` : "앞 꽃을 더 피우면") : "";
      return `<button class="seed${open ? "" : " locked"}${s.season ? " season" : ""}" data-act="plant" data-sid="${s.id}" ${open ? "" : "disabled"}>
        <span class="seed-img">${open || n ? spImg(s, 4, 0, 2) : `<span class="sil">${spImg(s, 4, 0, 2)}</span>`}</span>
        <b>${esc(s.name)}${s.rare ? '<i class="rare">희귀</i>' : ""}${s.season ? '<i class="season">이달</i>' : ""}</b>
        <span class="seed-meta">${open ? money("petal", C.baseValue(s, W)) : esc(lock)}</span>
        <span class="seed-cost">${open ? (cost ? money("petal", cost) : "무료") : ico("lock", 2)}</span>
      </button>`;
    }).join("");
    return { title: p.pk ? "씨앗 심기" : "빈 칸에 심기", html: `<div class="seeds">${rows}</div>` };
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
    closeSheet();
  }

  // 건물: 땅, 건물, 꾸미기 가게
  SHEETS.build = () => {
    const a = curArea();
    const ar = D.AREAS[a];
    const n = W.plots[a] || 1;
    const s = W.bld[a] || 0;
    const bc = s < 3 ? C.bldCost(a, s) : null;
    const pk = D.PERKS[ar.perk];
    const shop = C.DECOR_LIST.filter((d) => d.area != null && d.area <= W.maxArea);
    return {
      title: ar.bld,
      html: `<div class="bld box">
          <div class="bld-head"><b>${esc(ar.bld)}</b><i>${s}/3</i></div>
          <div class="bld-steps">${[0, 1, 2].map((i) => `<span class="${i < s ? "on" : ""}">${ico(i < s ? "tick" : "home", 3)}<em>${esc(ST.CHAPTERS[a].builds[i].split(".")[0])}</em></span>`).join("")}</div>
          <p class="g-tip">${esc(pk.name)} +${["combo", "cap", "star"].includes(ar.perk) ? pk.per : Math.round(pk.per * 100) + "%"} (단계마다)${s >= 1 ? ` · ${esc(ar.npc)}가 꽃을 돌봐 줘요` : ""}</p>
          ${bc ? `<button class="btn block${W.petals >= bc.petals && W.hearts >= bc.hearts ? " primary" : ""}" data-act="build">${money("petal", bc.petals)}${bc.hearts ? money("heart", bc.hearts) : ""} 짓기</button>` : `<p class="g-done">완성!</p>`}
        </div>
        <div class="wrow">
          <span class="w-ico">${ico("leaf", 4)}</span>
          <span class="w-t"><b>땅 넓히기</b><i>${n} / 6칸</i></span>
          ${n < 6 ? `<button class="btn small${W.petals >= C.plotCost(a, n) ? " primary" : ""}" data-act="buyplot">${money("petal", C.plotCost(a, n))}</button>` : `<span class="w-max">다 열었어요</span>`}
        </div>
        <h3 class="g-h">꾸미기 가게 · 아름다움 ${W.beauty} (꽃잎 +${Math.round(W.beauty / 4)}%)</h3>
        ${shop.map((d) => {
          const own = W.inv["o" + d.id] || 0;
          return `<div class="wrow">
            <span class="w-ico">${A.pixImg(d.sprite, 3, d.colors)}</span>
            <span class="w-t"><b>${esc(d.name)}${own ? ` <em>${own}개</em>` : ""}</b><i>아름다움 ${d.beauty}</i></span>
            <button class="btn small" data-act="buydeco" data-k="${d.id}">${money("petal", d.cost)}</button>
          </div>`;
        }).join("")}
        <p class="g-tip">산 장식은 정원 빈자리에 바로 놓여요. 정원에서 장식을 누르면 바꿀 수 있어요</p>`,
    };
  };
  // 산 장식을 빈자리에 놓기
  function autoPlace(id) {
    const a = curArea();
    for (let i = 0; i < 4; i++) {
      const d = W.deco[`${a}:${i}`];
      if (!d || !d[0]) { C.placeDecor(W, mine, a, i, id); return true; }
    }
    return false;
  }
  SHEETS.decor = (p) => {
    const a = curArea();
    const k = `${a}:${p.slot}`;
    const cur = W.deco[k] && W.deco[k][0];
    const owned = C.DECOR_LIST.filter((d) => (W.inv["o" + d.id] || 0) > 0);
    return {
      title: "장식 바꾸기",
      html: `<div class="seeds">
        <button class="seed" data-act="place" data-slot="${p.slot}" data-k="">${ico("close", 3)}<b>치우기</b></button>
        ${owned.map((d) => {
          const free = (W.inv["o" + d.id] || 0) - C.placedCount(W, d.id) + (cur === d.id ? 1 : 0);
          return `<button class="seed${cur === d.id ? " on" : ""}" data-act="place" data-slot="${p.slot}" data-k="${d.id}" ${free > 0 ? "" : "disabled"}><span class="seed-img">${A.pixImg(d.sprite, 3, d.colors)}</span><b>${esc(d.name)}</b><span class="seed-meta">아름다움 ${d.beauty}</span><span class="seed-cost">${free}개</span></button>`;
        }).join("")}
      </div>`,
    };
  };

  // 부엌: 요리하고, 친구에게 선물
  SHEETS.kitchen = () => {
    const a = curArea();
    const npc = ST.CHAPTERS[a].npc;
    const rows = C.RECIPE_LIST.filter((r) => r.area <= W.maxArea).map((r) => {
      const can = C.canCook(W, r);
      const have = W.inv["k" + r.id] || 0;
      return `<div class="wrow${can ? "" : " dim"}">
        <span class="w-ico">${A.pixImg(r.sprite, 3)}</span>
        <span class="w-t"><b>${esc(r.name)}${have ? ` <em>${have}개</em>` : ""}</b><i class="ings">${r.needs.map(([sid, n]) => `<span class="${(W.inv["c" + sid] || 0) >= n ? "ok" : "no"}">${spImg(SP[sid], 4, 0, 1)}${(W.inv["c" + sid] || 0)}/${n}</span>`).join("")}</i></span>
        <span class="w-btns">
          <button class="btn small${can ? " primary" : ""}" data-hold="cook" data-k="${r.id}" ${can ? "" : "disabled"}>만들기</button>
          ${have ? `<button class="btn small" data-act="give" data-k="${r.id}">${HEART()}${esc(npc)}</button>` : ""}
        </span>
      </div>`;
    }).join("");
    return { title: "부엌", html: `<p class="g-tip">요리는 주문에 쓰거나 ${esc(npc)}에게 선물해요. 선물하면 우정이 쑥 올라요</p>${rows}` };
  };

  // 우편함: 주문
  SHEETS.orders = () => {
    const line = ST.POST_LINES[(W.od + new Date().getDate()) % ST.POST_LINES.length];
    const cards = [0, 1, 2].map((s) => {
      const o = C.order(W, s);
      const can = C.canFill(W, o);
      const cookable = !can && o.items.every(([k, n]) => (W.inv[k] || 0) >= n || (k[0] === "k" && C.canCook(W, C.RECIPE_MAP[k.slice(1)])));
      return `<div class="order box${can ? " can" : ""}" data-key="o${s}:${o.gen}">
        <div class="od-head"><b>${esc(o.who)}</b><span>${money("petal", o.petals)}${money("heart", o.hearts)}</span></div>
        <div class="od-items">${o.items.map(([k, n]) => {
          const have = W.inv[k] || 0;
          const pic = k[0] === "c" ? spImg(SP[Number(k.slice(1))], 4, 0, 2) : A.pixImg(C.RECIPE_MAP[k.slice(1)].sprite, 2);
          const nm = k[0] === "c" ? SP[Number(k.slice(1))].name : C.RECIPE_MAP[k.slice(1)].name;
          return `<span class="od-it${have >= n ? " ok" : ""}">${pic}<b>${esc(nm)}</b><i>${have}/${n}</i></span>`;
        }).join("")}</div>
        <div class="od-btns"><button class="btn small" data-act="skiporder" data-k="${s}">넘기기</button><button class="btn small${can || cookable ? " primary" : ""}" data-act="fillorder" data-k="${s}" ${can || cookable ? "" : "disabled"}>${cookable ? "요리해서 배달" : "배달"}</button></div>
      </div>`;
    }).join("");
    return { title: "우편함", html: `<div class="post">${A.critterImg("cat", 3)}<p>${esc(line)}</p></div>${cards}<p class="g-tip">끝낸 주문 ${W.od}개</p>` };
  };

  // 연구 (별조각)
  SHEETS.research = () => ({
    title: "별 연구",
    html: D.RESEARCH.map((r) => {
      const lv = W.rs[r.key] || 0;
      const cost = C.researchCost(lv);
      return `<div class="wrow">
        <span class="w-ico">${ico("spark", 3)}</span>
        <span class="w-t"><b>${esc(r.name)}</b><i>${esc(r.desc)} ${esc(r.per)} · ${lv}/${r.max}</i>${bar(lv / r.max)}</span>
        ${lv < r.max ? `<button class="btn small${W.shards >= cost ? " primary" : ""}" data-act="research" data-k="${r.key}">${money("shard", cost)}</button>` : `<span class="w-max">끝</span>`}
      </div>`;
    }).join("") + `<p class="g-tip">별조각은 꽃 숙련 별, 업적, 놀이, 큰 봉오리, 기념일에서 모여요</p>`,
  });

  // 큰 봉오리
  SHEETS.boss = () => {
    const a = curArea();
    const hp = C.bossHp(a);
    const cur = Math.min(hp, W.boss[a] || 0);
    const done = cur >= hp;
    const sp = SP[a * 8 + 5];
    const dh = (W.docs.him.boss[a] || 0), de = (W.docs.her.boss[a] || 0);
    const tot = Math.max(1, dh + de);
    const w = wantOf("boss" + a);
    return {
      title: "큰 봉오리", tall: true,
      html: `<div class="boss" data-area="${a}">
        <div class="boss-hp">${bar(cur / hp, "boss")}<span id="gBossNum">${fmt(cur)} / ${fmt(hp)}</span></div>
        <div class="boss-field" style="--sky0:${D.AREAS[a].sky[0]};--sky1:${D.AREAS[a].sky[1]};--ground:${D.AREAS[a].ground}">
          <button class="boss-bud${done ? " bloom" : ""}" data-tap="boss">${spImg(sp, done ? 4 : 3, done ? 2 : 0, 8)}
            <i class="pl-want${done ? " off" : ""}">${careIcon(w.want, 3)}</i></button>
        </div>
        <div class="boss-who">
          <span class="him">${esc(NAME.him)} ${Math.round((dh / tot) * 100)}%</span>
          <i class="g-bar duo"><b style="transform:scaleX(${(dh / tot).toFixed(3)})"></b></i>
          <span class="her">${Math.round((de / tot) * 100)}% ${esc(NAME.her)}</span>
        </div>
        <p class="g-tip">${done ? "피었어요!" : "봉오리가 원하는 걸 골라서 눌러요. 둘이 같이 누르면 더 빨리 피어요"}</p>
        <div class="gd-tools">${TOOLS.map((k) => `<button class="gd-tool${tool === k ? " on" : ""}" data-act="tool" data-k="${k}">${careIcon(k, 3)}<i>Lv.${W.toolLv[k]}</i></button>`).join("")}</div>
      </div>`,
    };
  };
  function updateBoss() {
    const a = curArea();
    const hp = C.bossHp(a);
    const cur = Math.min(hp, W.boss[a] || 0);
    const b = $("gsBody").querySelector(".boss-hp .g-bar b");
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
    spawn(ev.clientX, ev.clientY, tool, r.match ? 6 : 3, { up: true });
    el.querySelector("img").animate([{ transform: "scale(1.06, .94)" }, { transform: "none" }], { duration: 160 });
    if (r.match) { w.left--; if (w.left <= 0) { rollWant("boss" + a); el.querySelector(".pl-want").innerHTML = careIcon(wantOf("boss" + a).want, 3); } }
    combo = r.combo;
    updateBoss();
    if (r.done) {
      const [x, y] = centerOf(el);
      spawn(x, y, "gold", 40, { speed: 260 });
      banner(`${spImg(SP[a * 8 + 5], 4, 2, 5)}<b>큰 봉오리가 피었어요</b>`, "v2");
      setTimeout(() => { closeSheet(); setTimeout(claimCurrent, 300); }, 900);
    }
    hud();
  }

  // 놀이
  SHEETS.play = (p) => ({
    title: D.GAMES.find((g) => g.key === p.k).name, tall: true,
    html: `<div class="mg-root" id="gMini"></div>`,
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
          <div class="od-btns"><button class="btn" data-act="play" data-k="${p.k}" data-s="${st}">다시</button>${cleared && st < 10 ? `<button class="btn primary" data-act="play" data-k="${p.k}" data-s="${st + 1}">다음 단계</button>` : ""}<button class="btn" data-act="sheetclose">정원으로</button></div>
        </div>`;
        const [x, y] = centerOf(el);
        if (cleared) spawn(x, y, "star", 24, { speed: 200 });
        if (cleared) { const b = $("gInvite"); if (b && b.dataset.k === p.k) b.hidden = true; }
        hud();
      });
    },
  });

  // 축제
  SHEETS.fest = () => {
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
      title: `${m + 1}월 ${f.name}`,
      html: `<div class="fest-head" style="--fc:${f.color}"><b>이달의 꽃</b><span>${money("token", W.tokens)}</span></div>
        <div class="fest-sp">${sps.map((s) => `<div class="fest-flower">${spImg(s, 4, 0, 4)}<b>${esc(s.name)}</b><i>${W.hc[s.id] ? `${W.hc[s.id]}송이` : "아직"}</i></div>`).join("")}</div>
        <p class="g-tip">이달 꽃은 씨앗에서 심어요. 피울 때마다 토큰이 생겨요</p>
        <div class="qlist">${fq}</div>
        <div class="wrow"><span class="w-ico">${A.pixImg(deco.sprite, 3, deco.colors)}</span><span class="w-t"><b>${esc(deco.name)}</b><i>이달에만 · 아름다움 ${deco.beauty}</i></span><button class="btn small" data-act="buydeco" data-k="${deco.id}">${money("token", deco.tokens)}</button></div>
        <div class="wrow"><span class="w-ico">${spr("heartOn", 3)}</span><span class="w-t"><b>하트 세 개</b><i>토큰 열 개와 바꿔요</i></span><button class="btn small" data-act="festswap">${money("token", 10)}</button></div>`,
    };
  };

  // 지도: 정원 옮기기
  SHEETS.map = () => ({
    title: "꽃마루 지도",
    html: `<div class="map">${D.AREAS.map((ar, a) => {
      const open = a <= W.maxArea;
      const done = C.MAIN[a].filter((m) => W.q[m.id]).length;
      const ready = open && C.plotKeys(W, a).some((pk) => { const p = C.plantAt(W, pk); return p && p.ready; });
      return `<button class="map-tile${open ? "" : " locked"}${a === curArea() ? " here" : ""}" data-act="${open ? "area" : ""}" data-a="${a}" style="--sky0:${ar.sky[0]};--ground:${ar.ground}" ${open ? "" : "disabled"}>
        <span class="mt-img">${open ? npcImg(a, 3) : ico("lock", 3)}</span>
        <b>${open ? esc(ar.name) : "???"}</b>
        ${open ? `<i>${done}/13</i>` : ""}
        ${ready ? `<em class="mt-ready">${ico("star", 2)}</em>` : ""}
      </button>`;
    }).join("")}</div>`,
  });

  // 일기장: 우리 이야기 · 달래의 일기 · 도감 · 업적 · 기록 (한 창 안의 탭)
  SHEETS.book = (p) => {
    const tab = p.tab || "our";
    const tabs = [["our", "우리 이야기"], ["dal", "달래의 일기"], ["flower", "도감"], ["ach", "업적"], ["stats", "기록"]];
    const head = `<div class="g-subtabs">${tabs.map(([k, n]) => `<button class="chip${tab === k ? " active" : ""}" data-act="btab" data-k="${k}">${n}</button>`).join("")}</div>`;
    return { title: "일기장", tall: true, html: head + BOOK[tab](p) };
  };
  const BOOK = {};
  BOOK.our = (p) => {
    const pages = M.monthPages(Date.now()).reverse();
    const st = memStage;
    const nx = M.TREE[st + 1];
    const s = M.stats(memList);
    const sel = p.page ? pages.find((x) => x.key === p.page) : null;
    const recent = memList.slice(-12).reverse();
    return `${sel ? `<article class="paper"><h2>${esc(sel.title)}</h2>${sel.photo ? `<img class="paper-photo" src="${esc(Store.photoUrl(sel.photo))}" alt="">` : ""}<p>${esc(sel.text)}</p><button class="chip paper-close" data-act="bset" data-page="">닫기</button></article>` : ""}
      <div class="tree-card box">
        <span class="tc-img">${treeImg()}</span>
        <span class="tc-t"><b>추억 나무 · ${esc(M.TREE_NAME[st])}</b><i>추억 ${s.total}개${nx ? ` · 다음까지 ${nx - s.total}개` : ""}</i>${bar(nx ? (s.total - M.TREE[st]) / (nx - M.TREE[st]) : 1)}<i>꽃잎 +${st * 4}% · 저절로 자라기 +${st * 5}%</i></span>
      </div>
      <p class="g-tip">앱에 데이트, 맛집, 일기, 질문 답을 남기면 추억이 되고 나무가 자라요</p>
      <h3 class="g-h">우리의 일기</h3>
      <div class="dpages wide">${pages.map((pg) => `<button class="dpage" data-act="bset" data-page="${pg.key}">${ico("book", 2)}<span>${esc(pg.title)}<i> 추억 ${pg.count}</i></span></button>`).join("")}</div>
      ${recent.length ? `<h3 class="g-h">최근 추억</h3><div class="qlist">${recent.map((m) => `<div class="qrow"><span class="q-n">${ico(m.kind === "diary" ? "book" : m.kind === "plan" ? "tick" : m.kind === "answer" ? "quest" : m.cat || "etc", 2)}</span><span class="q-t">${esc(m.title || (m.text || "").slice(0, 30) || "오늘의 질문")}<i>${esc(m.date || "")}${m.place ? " · " + esc(m.place) : ""}</i></span></div>`).join("")}</div>` : ""}`;
  };
  BOOK.dal = (p) => {
    let sel = "";
    if (p.dal) {
      const [a, i] = p.dal.split(":").map(Number);
      const pg = ST.CHAPTERS[a].diary[i];
      sel = `<article class="paper"><h2>${esc(pg.title)}</h2><p>${esc(pg.text)}</p><span class="paper-n">${a + 1}장</span><button class="chip paper-close" data-act="bset" data-dal="">닫기</button></article>`;
    }
    const chapters = [];
    for (let a = 0; a <= W.maxArea; a++) {
      const ch = ST.CHAPTERS[a];
      const done = C.MAIN[a].filter((m) => W.q[m.id]).length;
      const pages = ch.diary.map((pg, i) => {
        const q = C.MAIN[a].find((m) => m.diary === i);
        const got = W.q[q.id];
        return `<button class="dpage${got ? "" : " locked"}" data-act="${got ? "bset" : ""}" data-dal="${a}:${i}" ${got ? "" : "disabled"}>${ico(got ? "book" : "lock", 2)}<span>${got ? esc(pg.title) : "찢어진 쪽"}</span></button>`;
      }).join("");
      const lv = C.affLevel(W.af[a] || 0);
      chapters.push(`<div class="ch-block">
        <div class="ch-head">${npcImg(a, 3)}<div><b>${a + 1}장 ${esc(ch.area)}</b><i>할 일 ${done}/13 · ${esc(ch.npc)} 우정 ${lv}단계</i></div></div>
        <div class="dpages">${pages}</div>
        <div class="story-btns"><button class="chip" data-act="replay" data-k="in${a}">처음 이야기</button>${W.q[C.MAIN[a][12].id] ? `<button class="chip" data-act="replay" data-k="out${a}">끝 이야기</button>` : ""}${[3, 6, 10].map((t, i) => lv >= t ? `<button class="chip" data-act="replay" data-k="h${a}_${i}">${HEART()}${t}</button>` : "").join("")}</div>
      </div>`);
    }
    return `${sel}<div class="story-btns"><button class="chip" data-act="replay" data-k="pro">${spr("letter", 2)}처음 편지</button><button class="chip" data-act="replay" data-k="our">우리 이야기 시작</button>${W.finished ? `<button class="chip" data-act="replay" data-k="fin">꽃마루 축제</button>` : ""}</div>${chapters.join("")}`;
  };
  BOOK.flower = (p) => {
    const ft = p.ft == null ? curArea() : Number(p.ft);
    const tabs = D.AREAS.map((ar, a) => `<button class="chip${ft === a ? " active" : ""}" data-act="bset" data-ft="${a}">${a <= W.maxArea ? esc(ar.name) : "???"}</button>`).join("") + `<button class="chip${ft === 12 ? " active" : ""}" data-act="bset" data-ft="12">달마다</button>`;
    const list = ft === 12 ? SP.filter((s) => s.season) : SP.filter((s) => s.area === ft);
    let det = "";
    if (p.sid != null && p.sid !== "") {
      const s = SP[Number(p.sid)];
      const n = W.hc[s.id] || 0;
      const vr = W.vr[s.id] || 0;
      const T = C.E.mastery;
      det = `<div class="sp-detail box">
        <div class="sp-hero">${[0, 1, 2, 3].map((v) => `<span class="sp-v${(vr >> v) & 1 ? "" : " no"}">${(vr >> v) & 1 ? spImg(s, 4, v, 3) : `<span class="sil">${spImg(s, 4, 0, 3)}</span>`}<i>${D.VARIANTS[v]}</i></span>`).join("")}</div>
        <div class="sp-info"><div><span>${esc(s.name)}</span><b>${fmt(n)}송이</b></div>
        <div><span>숙련</span><b>${T.map((t) => `<i class="ms${n >= t ? " on" : ""}">★</i>`).join("")}</b></div>
        <div><span>한 송이</span><b>${money("petal", C.baseValue(s, W))}</b></div></div>
        <button class="chip paper-close" data-act="bset" data-sid="">닫기</button>
      </div>`;
    }
    const grid = list.map((s) => {
      const n = W.hc[s.id] || 0;
      const vr = W.vr[s.id] || 0;
      const stars = C.masteryStars(n);
      return `<button class="bk${n ? "" : " unknown"}" data-act="${n ? "bset" : ""}" data-sid="${s.id}">
        <span class="bk-img">${n ? spImg(s, 4, 0, 2) : `<span class="sil">${spImg(s, 4, 0, 2)}</span>`}</span>
        <b>${n ? esc(s.name) : s.season ? `${s.month + 1}월` : "?"}</b>
        <span class="bk-v">${[1, 2, 3].map((v) => `<i class="v${v}${(vr >> v) & 1 ? " on" : ""}"></i>`).join("")}</span>
        <span class="bk-s">${stars ? "★".repeat(stars) : ""}</span>
      </button>`;
    }).join("");
    return `<div class="bk-sum">꽃 ${W.discovered}/120 · 숙련 별 ${W.stars}/600 · 은빛 ${W.vc[1]} · 금빛 ${W.vc[2]} · 무지개 ${W.vc[3]}</div>${det}<div class="g-subtabs scroll">${tabs}</div><div class="bk-grid">${grid}</div>`;
  };
  BOOK.ach = () => {
    const rows = C.ACH.map((a) => {
      const [c, t] = a.f(W);
      const done = !!W.ac[a.id];
      return `<div class="qrow${done ? " done" : ""}"><span class="q-n">${done ? ico("trophy", 2) : ico("star", 2)}</span>
        <span class="q-t"><b>${esc(a.name)}</b><i>${esc(a.desc)}</i></span>${done ? "" : `<span class="q-c">${fmt(Math.min(c, t))}/${fmt(t)}</span>`}</div>`;
    }).join("");
    return `<p class="g-tip">업적은 이루면 저절로 받아요 · ${Object.keys(W.ac).length}/${C.ACH.length}</p><div class="qlist">${rows}</div>`;
  };
  BOOK.stats = () => {
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
    return `<div class="st-head"><span class="him">${esc(NAME.him)}${h.title ? `<i>${esc(h.title)}</i>` : ""}</span><span class="her">${esc(NAME.her)}${e.title ? `<i>${esc(e.title)}</i>` : ""}</span></div>
      <div class="st-list">${rows}</div>
      <div class="sp-info box">
        <div><span>함께 온 날</span><b>${W.bothDays}일</b></div>
        <div><span>오늘 함께</span><b>${W.todayBoth ? "꽃잎 +25%" : "아직"}</b></div>
        <div><span>아름다움</span><b>${W.beauty}</b></div>
        <div><span>저절로 자라기</span><b>${fmt(W.idlePerMin)}/분 · ${W.capH}시간</b></div>
        <div><span>최고 연속</span><b>${W.mc}</b></div>
      </div>
      <h3 class="g-h">내 칭호</h3>
      <div class="story-btns">${titles.length ? titles.map((t) => `<button class="chip${mine.title === t ? " active" : ""}" data-act="title" data-k="${esc(t)}">${esc(t)}</button>`).join("") : `<p class="g-tip">업적을 이루면 칭호가 생겨요</p>`}</div>`;
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
    if (k === "plot") { tapPlot(t, ev); swipe = { x: ev.clientX, y: ev.clientY, d: 0 }; }
    else if (k === "npc") petNpc(t, ev);
    else if (k === "sparkle") catchSparkle(t);
    else if (k === "boss") tapBoss(t, ev);
  }
  // 꽃 위를 문지르면 쓰다듬기
  function onMove(ev) {
    if (!swipe) return;
    swipe.d += Math.hypot(ev.clientX - swipe.x, ev.clientY - swipe.y);
    swipe.x = ev.clientX; swipe.y = ev.clientY;
    if (swipe.d < 26) return;
    swipe.d = 0;
    const el = document.elementFromPoint(ev.clientX, ev.clientY);
    const plot = el && el.closest && el.closest(".plot[data-pk]");
    if (plot) { const p = C.plantAt(W, plot.dataset.pk); if (p && !p.ready) tapPlot(plot, ev, "pet"); }
  }
  function onUp() {
    swipe = null;
    if (holdEl) { holdEl = null; clearTimeout(holdTimer); refreshSheet(); if (top()) updateTools(); }
  }
  function doHold(el) {
    now();
    const k = el.dataset.hold;
    let ok = false;
    if (k === "tool") ok = C.upgradeTool(W, mine, el.dataset.k);
    if (k === "cook") ok = C.cook(W, mine, el.dataset.k);
    if (!ok) {
      nope(el, k === "tool" ? "꽃잎이 모자라요" : "");
      holdEl = null; clearTimeout(holdTimer);
      return;
    }
    save();
    const [x, y] = centerOf(el);
    spawn(x, y, k === "tool" ? "star" : "petal", 6);
    if (k === "tool") {
      const lv = W.toolLv[el.dataset.k];
      floatNum(x, y - 20, "Lv." + lv, "combo");
      if ((lv - 1) % 10 === 0) { const c = D.CARES.find((z) => z.key === el.dataset.k); toast(`새 도구: ${c.tiers[Math.min(9, Math.floor((lv - 1) / 10))]}`); }
      updateTools();
      updateQuestStrip(C.currentQuest(W));
    } else { floatNum(x, y - 20, "+1", "petal"); refreshSheet(); }
    hud();
  }

  function onClick(ev) {
    const t = ev.target.closest("[data-act]");
    if (!t || !root.contains(t) || !W) {
      if (!W && ev.target.closest("[data-me]")) setTimeout(() => { if (load()) { firstRun(); drawGarden(); startTick(); queueAutoEvents(); } }, 0);
      return;
    }
    const act = t.dataset.act;
    const d = t.dataset;
    now();
    switch (act) {
      case "close": close(); break;
      case "sheet": openSheet(d.k, { slot: d.slot, tab: d.tab }); break;
      case "sheetclose": closeSheet(); break;
      case "btab": setSheet({ tab: d.k, page: null, dal: null, sid: null }); break;
      case "bset": {
        const p = {};
        ["page", "dal", "sid", "ft"].forEach((k) => { if (d[k] != null) p[k] = d[k]; });
        if (p.ft != null) p.sid = "";
        setSheet(p);
        break;
      }
      case "go": doGo(d.go); break;
      case "tool":
        tool = d.k; mine.tool = tool;
        root.querySelectorAll(".gd-tool").forEach((b) => b.classList.toggle("on", b.dataset.k === tool));
        bumpEl(t);
        if (top()) C.plotKeys(W, curArea()).forEach(updatePlot);
        break;
      case "questline": {
        const q = C.currentQuest(W);
        if (!q) break;
        if (q.area !== curArea() && q.area <= W.maxArea) { mine.area = q.area; save(); drawGarden(); }
        const npc = ST.CHAPTERS[q.area].npc;
        const lines = [[npc, q.line]];
        const rem = Math.random() < 0.35 ? M.remark(npc, q.id + Date.now()) : "";
        if (rem) lines.push([npc, "참, " + rem]);
        playScene(lines);
        break;
      }
      case "claimq": claimCurrent(); break;
      case "claimf": { const f = C.festQuests(W).find((x) => x.id === d.id); if (C.claimQuest(W, mine, f)) { save(); toast("축제 선물을 받았어요"); spawn(...centerOf(t), "star", 12); refreshSheet(); } break; }
      case "buyplot": {
        if (C.buyPlot(W, mine, curArea())) { save(); spawn(...centerOf(t), "leaf", 14); if (sheet) refreshSheet(); else drawGarden(); }
        else nope(t, "꽃잎이 모자라요");
        break;
      }
      case "build": {
        const a = curArea();
        if (C.build(W, mine, a)) {
          save();
          spawn(...centerOf(t), "star", 30, { speed: 220 });
          banner(`${ico("home", 5)}<b>${esc(ST.CHAPTERS[a].builds[W.bld[a] - 1])}</b>`, "build");
          refreshSheet();
        } else nope(t, "꽃잎이나 하트가 모자라요");
        break;
      }
      case "research": if (C.research(W, mine, d.k)) { save(); spawn(...centerOf(t), "star", 10); refreshSheet(); } else nope(t, "별조각이 모자라요"); break;
      case "buydeco": {
        if (C.buyDecor(W, mine, d.k)) {
          save();
          spawn(...centerOf(t), "star", 10);
          toast(autoPlace(d.k) ? "정원에 놓았어요" : "샀어요. 정원 장식을 눌러 바꿀 수 있어요");
          save();
          refreshSheet();
        } else nope(t, "모자라요");
        break;
      }
      case "place": if (C.placeDecor(W, mine, curArea(), Number(d.slot), d.k)) { save(); closeSheet(); drawGarden(); } break;
      case "plant": plantSeed(Number(d.sid), sheet && sheet.p.pk); break;
      case "harvestall": harvestAll(); break;
      case "auto": mine.auto = mine.auto ? 0 : 1; save(); t.classList.toggle("active", !!mine.auto); toast(mine.auto ? "거두면 같은 꽃을 다시 심어요" : "다시 심기 끔"); break;
      case "area": mine.area = Number(d.a); save(); closeSheet(); drawGarden(); queueAutoEvents(); break;
      case "fillorder": {
        const s = Number(d.k);
        const o0 = C.order(W, s);
        o0.items.forEach(([k, n]) => { if (k[0] === "k") while ((W.inv[k] || 0) < n && C.cook(W, mine, k.slice(1))); });
        const o = C.fillOrder(W, mine, s);
        if (o) { save(); flyTo(...centerOf(t), "gPet", "petal", 8); flyTo(...centerOf(t), "gHeart", "pet", 3); toast(`배달 끝! 꽃잎 +${fmt(o.petals)}`); refreshSheet(); }
        break;
      }
      case "skiporder": C.skipOrder(W, mine, Number(d.k)); save(); refreshSheet(); break;
      case "give": {
        const a = curArea();
        const pts = C.giveDish(W, mine, a, d.k);
        if (pts) { save(); spawn(...centerOf(t), "pet", 16); toast(`${ST.CHAPTERS[a].npc} 우정 +${pts}`); checkHeartEvent(a, C.affLevel(W.af[a])); refreshSheet(); }
        break;
      }
      case "replay": {
        const k = d.k;
        if (k === "pro") playScene(ST.PROLOGUE);
        else if (k === "our") playScene(ourIntro());
        else if (k === "fin") playScene(ST.FINALE.concat(ourFinale()));
        else if (k.startsWith("in")) playScene(ST.CHAPTERS[Number(k.slice(2))].intro);
        else if (k.startsWith("out")) playScene(ST.CHAPTERS[Number(k.slice(3))].outro);
        else if (k.startsWith("h")) { const [a, i] = k.slice(1).split("_").map(Number); playScene(ST.CHAPTERS[a].hearts[i]); }
        break;
      }
      case "play": openSheet("play", { k: d.k, s: d.s }); break;
      case "festswap": if (C.festSwap(W, mine, "hearts")) { save(); toast("하트 +3"); refreshSheet(); } else nope(t, "토큰이 모자라요"); break;
      case "title": mine.title = mine.title === d.k ? "" : d.k; save(); refreshSheet(); break;
      default: break;
    }
    hud();
  }
  function nope(el, msg) {
    if (el) el.animate([{ transform: "translateX(-5px)" }, { transform: "translateX(5px)" }, { transform: "translateX(-3px)" }, { transform: "none" }], { duration: 260 });
    if (msg) toast(msg);
  }

  // 정원이 열려 있는 동안 1초마다 자라는 모습
  function startTick() {
    stopTick();
    tickTimer = setInterval(() => {
      if (!W || root.hidden || document.hidden || !top()) return;
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
    else now();
    return true;
  }
  window.Garden = {
    bind(helpers) {
      H = helpers;
      ensureRoot();
      document.addEventListener("keydown", (e) => {
        if (e.key !== "Escape" || !root || root.hidden) return;
        if (sceneOn) sceneTap(e); else if (sheet) closeSheet(); else close();
      });
    },
    open,
    close,
    isOpen() { return !!root && !root.hidden; },
    // 다른 폰에서 바뀐 게 들어왔거나 앱에 새 기록이 생겼을 때
    render() {
      if (!root || root.hidden) { W = null; return; }
      if (!W) { if (load()) { firstRun(); drawGarden(); startTick(); queueAutoEvents(); } return; }
      load();
      if (top()) updateGarden();
      refreshSheet();
      hud(true);
      queueAutoEvents();
    },
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
      const fresh = mine.seen.our ? memList.filter((m) => !mine.seen["mm:" + m.id]).length : 0;
      if (fresh) return "편지!";
      const q = C.currentQuest(W);
      if (q && q.done) return "할 일!";
      for (let a = 0; a <= W.maxArea; a++) if (C.plotKeys(W, a).some((pk) => { const p = C.plantAt(W, pk); return p && p.ready; })) return "수확!";
      return `${W.maxArea + 1}장`;
    },
    home() {
      if (!ensureW()) return null;
      const a = curArea();
      const q = C.currentQuest(W);
      const fresh = mine.seen.our ? memList.filter((m) => !mine.seen["mm:" + m.id]).length : 0;
      return {
        area: D.AREAS[a].name, chapter: W.maxArea + 1, npc: npcImg(a, 3),
        quest: fresh ? { text: `우편냥이 추억 편지 ${fresh}통을 가져왔어요`, f: 1, done: true, letter: true } : q ? { text: q.text, f: Math.min(1, q.cur / q.need), done: q.done } : null,
        plants: C.plotKeys(W, a).map((pk) => C.plantAt(W, pk)).map((p) => (p ? { html: spImg(p.sp, p.stage, 0, 2), ready: p.ready, f: p.frac } : null)),
        petals: fmt(W.petals),
      };
    },
    quickTap(i) {
      if (!ensureW()) return null;
      const pk = `${curArea()}:${i}`;
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
    _debug() { return { W, mine, memList, memStage }; },
  };
})();
