// ============================================================
// 우리 농장: 화면
// 한 화면짜리 농장. 위는 마당(집, 우편함, 상점, 마루, 출하함, 닭장, 우물), 아래는 밭.
// 도구를 고르고 밭을 누르면 캐릭터가 걸어가서 해요. 손가락으로 쓸면 여러 칸을 한 번에.
// 창은 한 겹만 뜨고 닫으면 농장이에요.
// ============================================================
(function () {
  "use strict";

  const F = window.FFarm;
  const CR = window.FCrops;
  const ST = window.GStory;
  const A = window.GArt;
  const M = window.GMemory;
  const cfg = typeof DIARY_CONFIG !== "undefined" ? DIARY_CONFIG : {};
  const NAME = { him: cfg.him || "석영", her: cfg.her || "예은" };
  const $ = (id) => document.getElementById(id);
  const KEY = "F1";
  const COLS = F.COLS, ROWS = F.ROWS;

  let H = null;
  let root, main, fxl, cv, cx, mapEl;
  let who = "", mine = null, W = null, myT = 0;
  let sheet = null;
  let tickTimer = 0;
  let sel = null; // 정보창에 보여 줄 칸
  let memList = [], memStage = 0;

  // ---------- 글자 ----------
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function batchim(s) { const c = s.charCodeAt(s.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0; }
  function callName(n) { return batchim(n) ? n + "이" : n; }
  function fill(t) { return String(t).replace(/\{h\}/g, callName(NAME.him)).replace(/\{e\}/g, callName(NAME.her)).replace(/\{H\}/g, NAME.him).replace(/\{E\}/g, NAME.her); }
  function fmt(n) { n = Math.floor(n || 0); return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  function hrs(ms) { const h = ms / 3600000; return h >= 24 ? `${Math.round(h / 24 * 10) / 10}일` : h >= 1 ? `${Math.round(h)}시간` : `${Math.max(1, Math.round(h * 60))}분`; }
  function ago(t) { const m = (Date.now() - t) / 60000; return m < 1 ? "방금" : m < 60 ? `${Math.round(m)}분 전` : `${Math.round(m / 60)}시간 전`; }
  const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

  // ---------- 그림 ----------
  function ico(n, s) { return PIXEL.icon(n, s || 2); }
  function spr(n, s) { return PIXEL.sprite(n, s || 2); }
  function cropImg(c, stage, cls) { return A.plantImg(c, Math.max(0, stage), 0, 2, cls); }
  function cropIcon(c, s) { return A.plantImg(c, 4, 0, s || 2); }
  const ROWS_ART = {
    weed: [["..g.g...", ".gGg.g..", "gGgGgGg.", ".GgGgG..", "..ggg..."], { g: "#7cc46e", G: "#5d9a50" }],
    stone: [["..SSSS..", ".SLLSSS.", "SLSSSSDS", "SSSSSDDS", ".SSDDDS."], { S: "#b8b2a8", L: "#e2ddd4", D: "#8f887d" }],
    spr1: [["...B...", "..BLB..", ".BSSSB.", "BLSDSLB", ".BSSSB.", "..BLB..", "...B..."], { B: "#7fb2e5", L: "#dff3ff", S: "#c9cdd4", D: "#6a7a9c" }],
    spr2: [["B..B..B", ".BLBLB.", "BLSSSLB", ".SSDSS.", "BLSSSLB", ".BLBLB.", "B..B..B"], { B: "#7fb2e5", L: "#dff3ff", S: "#e8c86a", D: "#8a6a2a" }],
    spr3: [["Y.B.B.Y", ".BLBLB.", "BLSSSLB", ".SSDSS.", "BLSSSLB", ".BLBLB.", "Y.B.B.Y"], { B: "#b3a6ff", L: "#ffffff", S: "#9b8cff", D: "#5a4fb0", Y: "#ffe066" }],
    hen: [["...R.....", "..RWW....", ".YWEW....", "..WWWWWWW", "..WWWWWW.", "...WWWWW.", "....Y.Y.."], { R: "#e8504f", W: "#ffffff", E: "#3b2c25", Y: "#f5b94e" }],
    well: [["..RRRRRR..", ".RRRRRRRR.", "RRRRRRRRRR", "..T....T..", "..T.SS.T..", "..T.SS.T..", ".GGGGGGGG.", ".GBBBBBBG.", ".GLBBBBBG.", ".GGGGGGGG."], { R: "#c96a52", T: "#9a785a", S: "#c99a6e", G: "#b8b2a8", B: "#7fb2e5", L: "#dff3ff" }],
    bin: [["KKKKKKKKKK", "KWWWWWWWWK", "KKKKKKKKKK", "KWWWWWWWWK", "KWKKKKKKWK", "KWWWWWWWWK", "KKKKKKKKKK"], { W: "#d9a066", K: "#9a6a44" }],
    bowl: [["B......B", "BWWWWWWB", ".BBBBBB."], { B: "#e86a6a", W: "#e8e0d4" }],
    bowlFull: [["B......B", "BLWWWWLB", ".BBBBBB."], { B: "#e86a6a", W: "#7fb2e5", L: "#dff3ff" }],
    egg: [[".WW.", "WWLW", "WWWW", ".WW."], { W: "#fff3dc", L: "#ffffff" }],
    eggBig: [[".WW.", "WWLW", "WWWW", ".WW."], { W: "#f5d9a0", L: "#ffffff" }],
    fiber: [["g.g.g", ".ggg.", "..g.."], { g: "#7cc46e" }],
    rock: [[".SS.", "SLSS", "SSSD"], { S: "#b8b2a8", L: "#e2ddd4", D: "#8f887d" }],
    bag: [[".KK.", "KSSK", "SSSS", "SSSS", ".SS."], { K: "#9a785a", S: "#e8c890" }],
    fert: [[".KK.", "KBBK", "BBBB", "BDDB", ".BB."], { K: "#6a5a4a", B: "#a98b6a", D: "#7a5a3a" }],
  };
  function art(n, s, cls) { const r = ROWS_ART[n]; return r ? A.rowsImg(n, r[0], r[1], s || 3, cls) : ""; }
  // 집 (3칸 x 3칸)
  function houseRows() {
    const w = 24, rows = [];
    for (let y = 0; y < 9; y++) {
      let row = "";
      for (let x = 0; x < w; x++) row += Math.abs(x - 11.5) <= y * 1.35 + 1 ? (y === 8 ? "D" : (x + y) % 5 === 0 ? "D" : "R") : ".";
      rows.push(row);
    }
    for (let y = 0; y < 11; y++) {
      let row = "";
      for (let x = 0; x < w; x++) {
        if (x < 2 || x > 21) row += ".";
        else if (x === 2 || x === 21 || y === 10) row += "B";
        else if (x >= 10 && x <= 13 && y >= 4) row += y === 4 ? "B" : x === 13 && y === 7 ? "Y" : "C";
        else if (((x >= 4 && x <= 7) || (x >= 16 && x <= 19)) && y >= 2 && y <= 5) row += y === 2 || y === 5 || x === 4 || x === 7 || x === 16 || x === 19 ? "B" : (x === 5 || x === 17) && y === 3 ? "L" : "G";
        else row += "W";
      }
      rows.push(row);
    }
    return rows;
  }
  const MEM_TREE = { id: "memtree", a: "tree", p: "#ffc0d4", c: "#ffe066", o: { blossom: 1 }, k: 0 };
  const HOUSE_COL = { R: "#e3846a", D: "#c96a52", W: "#f3ead6", B: "#9a785a", G: "#9fd0f0", L: "#ffffff", C: "#a97b55", Y: "#ffd35c" };
  const COOP_COL = { R: "#d9b46a", D: "#b8924a", W: "#fff6e6", B: "#9a785a", G: "#3b2c25", L: "#5b4638", C: "#8d6748", Y: "#ffd35c" };

  // 바닥 무늬 (계절마다 풀색이 달라요)
  const GRASS = [["#9fd88a", "#86c66f", "#b8e6a0"], ["#8fcf6f", "#76b85c", "#a8dc8a"], ["#c9c86a", "#b0a855", "#ddd98a"], ["#e6eee8", "#cdd8d0", "#ffffff"]];
  function tex(kind, season) {
    return A.texture(kind + season, 16, (c, n) => {
      const pal = kind === "grass" ? GRASS[season] : kind === "soil" ? ["#c08a5c", "#a97448", "#d09a6a"] : kind === "wet" ? ["#7f5638", "#6a462c", "#946746"] : ["#ead6a6", "#d9c08a", "#f3e4bc"];
      c.fillStyle = pal[0]; c.fillRect(0, 0, n, n);
      for (let i = 0; i < 22; i++) {
        const x = (i * 7 + 3) % n, y = (i * 11 + 5) % n;
        c.fillStyle = i % 3 ? pal[1] : pal[2];
        c.fillRect(x, y, kind === "grass" ? 1 : 2, kind === "grass" ? 2 : 1);
      }
      if (kind === "soil" || kind === "wet") { c.fillStyle = pal[1]; c.fillRect(0, 4, n, 1); c.fillRect(0, 11, n, 1); }
    }).uri;
  }

  // ---------- 기록장 ----------
  function other() { return who === "him" ? "her" : "him"; }
  function load() {
    const w = Store.me() || "";
    if (w !== who) { mine = null; myT = 0; }
    who = w;
    if (!who) { mine = null; W = null; return false; }
    const raw = Store.pair(KEY, who);
    const t = Store.pairTime(KEY, who);
    if (!mine || t > myT + 1 || (raw && Store.progress(raw) > Store.progress(mine))) {
      mine = F.normDoc(raw ? JSON.parse(JSON.stringify(raw)) : F.emptyDoc());
      myT = t;
    }
    memList = M.memories();
    memStage = M.treeStage(memList.length);
    recompute();
    return true;
  }
  function recompute() {
    if (!mine) return;
    const o = Store.pair(KEY, other());
    const od = o ? o : F.emptyDoc();
    W = F.world(who === "him" ? mine : od, who === "him" ? od : mine, Date.now());
    W.memStage = memStage;
  }
  function save() {
    if (!mine) return;
    Store.setPairFast(KEY, who, mine);
    myT = Store.pairTime(KEY, who);
  }
  // 시간이 많이 지났을 때만 칸 계산을 새로 해요 (누를 때마다 다 다시 계산하면 느려요)
  let cacheAt = 0;
  function now() {
    W.now = Date.now();
    if (W.now - cacheAt > 20000) { W.cache = {}; cacheAt = W.now; }
    return W.now;
  }

  // ---------- 틀 ----------
  function ensureRoot() {
    if (root) return;
    root = document.createElement("div");
    root.id = "game";
    root.className = "game farm";
    root.hidden = true;
    root.innerHTML = `
      <header class="f-head">
        <button class="g-x close" data-act="close" aria-label="닫기">${ico("close", 3)}</button>
        <div class="f-date" id="farmDate"></div>
        <div class="f-lv" id="farmLv"></div>
        <div class="f-gold" id="farmGold"></div>
      </header>
      <main class="f-main" id="farmMain"></main>
      <nav class="f-bar" id="farmBar"></nav>
      <div class="g-sheet" id="gSheet" hidden>
        <div class="gs-dim" data-act="sheetclose"></div>
        <section class="gs-box"><header class="gs-head"><b id="gsTitle"></b><button class="gs-x" data-act="sheetclose" aria-label="닫기">${ico("close", 3)}</button></header><div class="gs-body" id="gsBody"></div></section>
      </div>
      <canvas class="g-canvas" id="gCanvas"></canvas>
      <div class="g-fx" id="gFx"></div>
      <div class="g-toast" id="gToast"></div>
      <div class="g-scene" id="gScene" hidden></div>`;
    document.body.appendChild(root);
    main = $("farmMain");
    fxl = $("gFx");
    cv = $("gCanvas");
    cx = cv.getContext("2d");
    root.addEventListener("click", onClick);
    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("resize", () => { if (root && !root.hidden) { sizeCanvas(); layout(); } });
    $("gScene").addEventListener("pointerdown", sceneTap);
    for (let i = 0; i < 18; i++) { const el = document.createElement("i"); el.className = "g-num"; fxl.appendChild(el); }
  }
  function sizeCanvas() { cv.width = Math.round(window.innerWidth); cv.height = Math.round(window.innerHeight); }

  function open(screen, params) {
    ensureRoot();
    root.hidden = false;
    root.classList.remove("closing");
    document.body.classList.add("game-open");
    if (window.Scene) Scene.setActive(false);
    root.animate([{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: "cubic-bezier(.22,1,.36,1)" });
    sizeCanvas();
    if (!load()) { main.innerHTML = `<div class="g-pad">${H.whoAsk()}</div>`; return; }
    build();
    startTick();
    autoEvents();
    if (screen && SHEETS[screen]) openSheet(screen, params || {});
  }
  function close() {
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

  // ---------- 농장 그리기 ----------
  let T = 36;
  function layout() {
    if (!mapEl) return;
    const wrap = main.querySelector(".f-mapwrap");
    const avW = main.clientWidth - 8;
    const avH = wrap.clientHeight - 4;
    T = Math.max(22, Math.floor(Math.min(avW / COLS, avH / ROWS)));
    mapEl.style.setProperty("--t", T + "px");
    mapEl.style.width = T * COLS + "px";
    mapEl.style.height = T * ROWS + "px";
    placeChars(true);
  }
  function at(c, r, w, h) { return `left:calc(var(--t) * ${c});top:calc(var(--t) * ${r});width:calc(var(--t) * ${w || 1});height:calc(var(--t) * ${h || 1})`; }
  function build() {
    now();
    const s = W.season;
    main.innerHTML = `
      <div class="f-today" id="farmToday"></div>
      <div class="f-mapwrap"><div class="f-map s${s}" id="farmMap" style="--grass:url(${tex("grass", s)});--soil:url(${tex("soil", 0)});--wet:url(${tex("wet", 0)});--path:url(${tex("path", 0)})">
        <div class="f-yard"></div>
        <div class="f-fieldbg"></div>
        <button class="f-obj f-house" data-act="sheet" data-k="house" style="${at(0, 0, 3, 3)}">${A.rowsImg("house3", houseRows(), HOUSE_COL, 1)}<i class="f-tag">우리 집</i></button>
        <button class="f-obj f-tree" data-act="sheet" data-k="house" data-tab="our" style="${at(3, 0, 1, 2)}" id="farmTree"></button>
        <button class="f-obj f-mail" data-act="mail" style="${at(3, 2)}" id="farmMail">${spr("mailbox", 3)}<i class="f-flag"></i></button>
        <button class="f-obj f-shop" data-act="sheet" data-k="shop" style="${at(4, 0, 2, 1)}">${spr("signpost", 3)}<i class="f-tag">상점</i></button>
        <button class="f-obj f-bowl" data-act="bowl" style="${at(5, 2)}" id="farmBowl"></button>
        <button class="f-obj f-bin" data-act="sheet" data-k="bin" style="${at(6, 2)}">${art("bin", 3)}<i class="f-tag">출하</i></button>
        <button class="f-obj f-coop" data-act="sheet" data-k="coop" style="${at(7, 0, 3, 2)}" id="farmCoop"></button>
        <button class="f-obj f-well" data-act="well" style="${at(9, 2)}">${art("well", 3)}</button>
        <div class="f-tiles" id="farmTiles"></div>
        <button class="f-land" id="farmLand" data-act="sheet" data-k="shop" data-tab="farm"></button>
        <button class="f-dog" id="farmDog" data-act="dog">${A.critterImg("dog", 2)}</button>
        <div class="f-hens" id="farmHens"></div>
        <div class="f-char partner" id="farmPartner" hidden></div>
        <div class="f-char me" id="farmMe">${A.pixImg(who, 2)}</div>
        <div class="f-rain" id="farmRain" hidden></div>
        <div class="f-night" id="farmNight"></div>
      </div></div>
      <div class="f-info" id="farmInfo"></div>`;
    mapEl = $("farmMap");
    let tiles = "";
    for (let r = F.FIELD0; r < ROWS; r++) for (let c = 0; c < COLS; c++) tiles += `<div class="ft" data-tap="tile" data-k="${F.key(c, r)}" style="${at(c, r)}"></div>`;
    $("farmTiles").innerHTML = tiles;
    drawBar();
    requestAnimationFrame(() => { layout(); updateAll(); });
  }
  // 한 칸 그리기: 모습이 바뀐 칸만 고쳐요
  function tileSig(t) {
    return [t.open, t.debris, t.tilled, t.wet, t.fert, t.obj, t.crop ? t.crop.id : "", t.stage, t.ready, t.wilting, t.dead, t.together].join("|");
  }
  function updateTile(k) {
    const el = mapEl && mapEl.querySelector(`.ft[data-k="${k}"]`);
    if (!el) return;
    const t = F.tile(W, k);
    const sig = tileSig(t);
    if (el.__sig === sig) return;
    const grew = el.__stage != null && t.crop && t.stage > el.__stage;
    el.__sig = sig;
    el.__stage = t.crop ? t.stage : null;
    el.className = "ft" + (t.open ? "" : " locked") + (t.tilled ? " soil" : "") + (t.wet ? " wet" : "") + (t.fert ? " fert " + t.fert : "") + (t.ready ? " ready" : "") + (t.wilting ? " wilt" : "") + (t.dead ? " dead" : "") + (sel === k ? " sel" : "");
    let inner = "";
    if (t.debris) inner = `<span class="ft-deb">${art(t.debris, 2)}</span>`;
    else if (t.obj) inner = `<span class="ft-obj">${art(t.obj, 3)}</span>`;
    else if (t.crop) inner = `<span class="ft-crop">${cropImg(t.crop, t.dead ? 2 : t.stage)}</span>${t.ready ? `<i class="ft-star"></i>` : t.wilting ? `<i class="ft-drop">${ico("drop", 1)}</i>` : ""}${t.together && t.ready ? `<i class="ft-heart">${spr("heartOn", 1)}</i>` : ""}`;
    el.innerHTML = inner;
    if (grew) {
      const im = el.querySelector("img");
      if (im) im.animate([{ transform: "scale(1.3, .7)" }, { transform: "scale(.9, 1.15)" }, { transform: "none" }], { duration: 420, easing: "cubic-bezier(.34,1.56,.64,1)" });
    }
  }
  function updateAll() {
    if (!mapEl) return;
    for (let r = F.FIELD0; r < ROWS; r++) for (let c = 0; c < COLS; c++) updateTile(F.key(c, r));
    drawYard();
    drawToday();
    drawInfo();
    hud();
  }
  function drawYard() {
    const st = memStage;
    $("farmTree").innerHTML = `${A.plantImg(MEM_TREE, st === 0 ? 1 : st <= 2 ? 2 : st <= 4 ? 3 : 4, st >= 9 ? 2 : 0, 2)}<i class="f-tag">추억 ${memList.length}</i>`;
    $("farmBowl").innerHTML = art(W.dogBowl[W.today] ? "bowlFull" : "bowl", 3) + (W.dogBowl[W.today] ? "" : `<i class="f-flag on"></i>`);
    const unread = letters().length;
    const mf = $("farmMail").querySelector(".f-flag");
    mf.classList.toggle("on", unread > 0);
    mf.textContent = unread ? String(unread) : "";
    const hens = F.hensList(W);
    $("farmCoop").innerHTML = W.up.coop
      ? `${A.rowsImg("coop3", houseRows(), COOP_COL, 1)}<i class="f-tag">닭장${hens.some((h) => h.eggs.length) ? " · 달걀!" : ""}</i>`
      : `<span class="f-lot">${ico("lock", 2)}<b>닭장 터</b></span>`;
    $("farmHens").innerHTML = hens.map((h, i) => `<span class="f-hen" style="--i:${i};left:calc(var(--t) * ${7 + (i % 3) * 0.9});top:calc(var(--t) * ${1.9 + Math.floor(i / 3) * 0.4})">${art("hen", 2)}</span>`).join("");
    const openR = F.openRows(W);
    const land = $("farmLand");
    if (F.FIELD0 + openR < ROWS) {
      land.hidden = false;
      land.setAttribute("style", at(0, F.FIELD0 + openR, COLS, ROWS - F.FIELD0 - openR));
      land.innerHTML = `<span>${ico("lock", 2)} 땅 넓히기 ${fmt(CR.LAND[(W.up.land || 0) + 1].price)}G</span>`;
    } else land.hidden = true;
    const wx = window.Scene && Scene.weather ? Scene.weather() : null;
    $("farmRain").hidden = !(wx && wx.wet);
    const h = new Date().getHours();
    $("farmNight").className = "f-night" + (h >= 20 || h < 5 ? " on" : h >= 18 ? " dusk" : "");
    placePartner();
  }
  function drawToday() {
    const list = F.todayList(W, who);
    const tips = tip();
    MORPH($("farmToday"), `${list.map((x) => `<span class="ftd${x.done ? " done" : ""}">${x.done ? ico("tick", 1) : "·"}${esc(x.text)}</span>`).join("")}${tips ? `<span class="ftd tip">${esc(tips)}</span>` : ""}`);
  }
  // 마루가 알려 주는 다음 할 일 (처음엔 차근차근)
  function tip() {
    const st = W.st;
    const tiles = F.allTiles(W);
    if (!st.till) return "괭이를 골라 풀 없는 땅을 눌러 밭을 갈아요";
    if (!st.plant && !Object.keys(W.inv).some((k) => k.startsWith("seed:") && W.inv[k] > 0)) return "상점에서 씨앗을 사 와요";
    if (!st.plant) return "씨앗을 골라 갈아 둔 밭에 심어요";
    if (!st.water) return "물뿌리개로 물을 줘요. 촉촉한 동안만 자라요";
    if (tiles.some((t) => t.ready)) return "다 자랐어요! 눌러서 거둬요";
    if (!st.harvest) return "물만 잘 주면 하루쯤 뒤에 싹이 보여요";
    if (Object.keys(W.inv).some((k) => k.startsWith("crop:") && W.inv[k] > 0) && !st.ship) return "거둔 건 출하함에 넣으면 내일 아침 돈이 들어와요";
    if (tiles.some((t) => t.wilting)) return "시드는 작물이 있어요. 물을 줘요";
    if (tiles.some((t) => t.dead)) return "죽은 작물은 손으로 치워요";
    return "";
  }
  function drawInfo() {
    const el = $("farmInfo");
    if (!el) return;
    if (!sel) {
      const se = CR.SEASONS[W.season];
      const end = new Date(F.seasonEnd(W.now));
      MORPH(el, `<div class="fi-row"><span class="fi-ico">${A.critterImg("dog", 2)}</span><span class="fi-t"><b>마루</b><i>${esc(W.dogHearts >= 10 ? "너희랑 사는 게 제일 좋아" : `${se} 작물은 ${end.getMonth() + 1}월 ${end.getDate()}일까지 자라. 밭을 누르면 자세히 알려 줄게`)}</i></span></div>`);
      return;
    }
    const t = F.tile(W, sel);
    let html = "";
    if (!t.open) html = `<span class="fi-t"><b>아직 못 쓰는 땅</b><i>상점에서 땅을 넓혀요</i></span>`;
    else if (t.debris) html = `<span class="fi-ico">${art(t.debris, 3)}</span><span class="fi-t"><b>${t.debris === "weed" ? "풀" : "돌"}</b><i>손으로 치워요</i></span>`;
    else if (t.obj) html = `<span class="fi-ico">${art(t.obj, 3)}</span><span class="fi-t"><b>${esc(CR.OBJS[t.obj].name)}</b><i>매일 아침 6시에 ${esc(CR.OBJS[t.obj].desc)}에 물을 줘요 · 손으로 거둬요</i></span>`;
    else if (t.crop) {
      const c = t.crop;
      const status = t.dead ? "죽었어요. 손으로 치워요" : t.ready ? "다 자랐어요! 눌러서 거둬요" : t.wilting ? `시들고 있어요. ${hrs(F.DEAD * 3600000 - t.dryFor)} 안에 물을 줘요` : t.wet ? `촉촉해요 · ${hrs(t.wetLeft)} 더` : "말랐어요. 물을 줘요";
      const who2 = t.together ? `둘이 같이 키우는 중 ${spr("heartOn", 1)}` : t.byHim || t.byHer ? `${t.byHim ? NAME.him : NAME.her}가 물 줌` : "";
      html = `<span class="fi-ico">${cropIcon(c, 3)}</span><span class="fi-t"><b>${esc(c.name)}${t.by ? ` <em>${esc(NAME[t.by] || "")} 심음</em>` : ""}</b>
        <i>${esc(status)}</i>${!t.dead && !t.ready ? `<i class="fi-bar"><b style="transform:scaleX(${t.frac.toFixed(3)})"></b></i><i>다 자라기까지 촉촉한 시간 ${hrs(t.left)}${c.regrow ? ` · 거둔 뒤 ${c.regrow}시간마다 또 열려요` : ""}</i>` : ""}${who2 ? `<i class="fi-love">${who2}</i>` : ""}</span>`;
    } else if (t.tilled) html = `<span class="fi-t"><b>갈아 둔 밭${t.fert ? ` · ${esc(CR.FERT[t.fert].name)}` : ""}</b><i>${t.wet ? `촉촉해요 · ${hrs(t.wetLeft)} 더` : "씨앗을 심어요"}</i></span>`;
    else html = `<span class="fi-t"><b>풀밭</b><i>괭이로 갈면 밭이 돼요</i></span>`;
    MORPH(el, `<div class="fi-row">${html}</div>`);
  }
  function hud() {
    if (!W) return;
    const d = new Date();
    const h = d.getHours(), m = d.getMinutes();
    const wx = window.Scene && Scene.weather ? Scene.weather() : null;
    MORPH($("farmDate"), `<b>${d.getMonth() + 1}월 ${d.getDate()}일 ${DAYS[d.getDay()]} · ${CR.SEASONS[W.season]}</b><i>${h < 12 ? "오전" : "오후"} ${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")}${wx ? " · " + ({ clear: "맑음", partly: "구름 조금", cloudy: "흐림", fog: "안개", drizzle: "이슬비", rain: "비", heavy: "큰비", snow: "눈", heavysnow: "큰눈", thunder: "천둥" }[wx.kind] || "") + (wx.temp != null ? ` ${Math.round(wx.temp)}°` : "") : ""}</i>`);
    const lvNext = CR.LEVELS[W.level] || CR.LEVELS[CR.LEVELS.length - 1];
    const lvPrev = CR.LEVELS[W.level - 1] || 0;
    MORPH($("farmLv"), `<b>농사 ${W.level}</b><i class="f-xp"><b style="transform:scaleX(${W.level >= 10 ? 1 : ((W.xp - lvPrev) / (lvNext - lvPrev)).toFixed(3)})"></b></i>`);
    MORPH($("farmGold"), `<b>${fmt(W.gold)}G</b>${W.goldWait ? `<i>내일 +${fmt(W.goldWait)}</i>` : ""}`);
    drawBar();
  }

  // ---------- 도구 칸 ----------
  const TOOLS = [["hoe", "괭이"], ["can", "물뿌리개"], ["hand", "손"], ["seed", "씨앗"], ["fert", "비료"], ["obj", "놓기"]];
  function toolIcon(k) {
    if (k === "hoe") return spr("shovel", 3);
    if (k === "can") return spr("can", 2);
    if (k === "hand") return `<span class="tl-hand">${ico("hand", 3)}</span>`;
    if (k === "seed") return mine.seed && CR.BY_ID[mine.seed] ? cropIcon(CR.BY_ID[mine.seed], 1) : art("bag", 4);
    if (k === "fert") return art("fert", 4);
    if (k === "obj") return mine.objSel ? art(mine.objSel, 3) : art("spr1", 3);
    return "";
  }
  function drawBar() {
    if (!mine) return;
    const cap = F.canCap(W);
    MORPH($("farmBar"), TOOLS.map(([k, n]) => {
      let sub = "";
      if (k === "can") sub = `<i class="tl-water"><b style="transform:scaleX(${Math.min(1, mine.water / cap).toFixed(3)})"></b></i>`;
      if (k === "seed") sub = `<i class="tl-n">${mine.seed ? (W.inv["seed:" + mine.seed] || 0) : ""}</i>`;
      if (k === "fert") sub = `<i class="tl-n">${mine.fertSel ? (W.inv["fert:" + mine.fertSel] || 0) : ""}</i>`;
      if (k === "obj") sub = `<i class="tl-n">${mine.objSel ? (W.inv[mine.objSel] || 0) : ""}</i>`;
      return `<button class="tl${mine.sel === k ? " on" : ""}" data-act="tool" data-k="${k}">${toolIcon(k)}<b>${k === "seed" && mine.seed && CR.BY_ID[mine.seed] ? esc(CR.BY_ID[mine.seed].name) : n}</b>${sub}</button>`;
    }).join(""));
  }

  // ---------- 캐릭터 ----------
  function placeChars(instant) {
    const me = $("farmMe");
    if (!me) return;
    const p = mine.pos && mine.pos.length ? mine.pos : [4, 2.4];
    me.style.transition = instant ? "none" : "";
    me.style.transform = `translate(calc(var(--t) * ${p[0]}), calc(var(--t) * ${p[1] - 0.45}))`;
    placePartner();
  }
  function placePartner() {
    const el = $("farmPartner");
    if (!el) return;
    const o = W.docs[other()];
    const recent = o && o.pos && o.pos.length && o.lastAct && Date.now() - o.lastAct < 3 * 3600000;
    el.hidden = !recent;
    if (!recent) return;
    if (!el.firstChild) el.innerHTML = `${A.pixImg(other(), 2)}<i class="f-ptag"></i>`;
    el.querySelector(".f-ptag").textContent = `${NAME[other()]} · ${ago(o.lastAct)}`;
    el.style.transform = `translate(calc(var(--t) * ${o.pos[0]}), calc(var(--t) * ${o.pos[1] - 0.45}))`;
  }
  let lastWalk = 0;
  function walkTo(c, r) {
    const me = $("farmMe");
    const prev = mine.pos && mine.pos.length ? mine.pos : [4, 2.4];
    mine.pos = [c, r + 0.2];
    me.classList.toggle("left", c < prev[0]);
    const t = performance.now();
    me.style.transition = t - lastWalk < 120 ? "transform .12s linear" : "transform .2s cubic-bezier(.22,1,.36,1)";
    lastWalk = t;
    me.style.transform = `translate(calc(var(--t) * ${c}), calc(var(--t) * ${r + 0.2 - 0.45}))`;
    me.querySelector("img").animate([{ transform: "translateY(0)" }, { transform: "translateY(-3px)" }, { transform: "none" }], { duration: 200 });
  }

  // ============================================================
  // 효과
  // ============================================================
  let numI = 0;
  function floatNum(x, y, text, cls) {
    const el = fxl.children[numI++ % fxl.children.length];
    el.className = "g-num " + (cls || "");
    el.textContent = text;
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.animate([{ transform: "translate(-50%, 0) scale(.7)", opacity: 0 }, { transform: "translate(-50%, -16px) scale(1.1)", opacity: 1, offset: 0.2 }, { transform: "translate(-50%, -54px) scale(1)", opacity: 0 }], { duration: 900, easing: "cubic-bezier(.22,1,.36,1)" });
  }
  function toast(msg) {
    const t = $("gToast");
    t.textContent = msg;
    t.className = "g-toast on";
    clearTimeout(toast.tm);
    toast.tm = setTimeout(() => { t.className = "g-toast"; }, 2400);
  }
  function banner(html, kind) {
    const el = document.createElement("div");
    el.className = "g-banner " + (kind || "");
    el.innerHTML = html;
    root.appendChild(el);
    el.animate([{ transform: "translate(-50%, -50%) scale(.4)", opacity: 0 }, { transform: "translate(-50%, -50%) scale(1.08)", opacity: 1, offset: 0.25 }, { transform: "translate(-50%, -50%) scale(1)", opacity: 1, offset: 0.75 }, { transform: "translate(-50%, -60%) scale(.96)", opacity: 0 }], { duration: 1800, easing: "ease-out" }).onfinish = () => el.remove();
  }
  const parts = [];
  let partRaf = 0, partLast = 0;
  const PCOL = {
    water: ["#7cc4f0", "#a9dbfa", "#ffffff"], dirt: ["#a97448", "#c08a5c", "#8a5a36"], leaf: ["#7cc46e", "#a6dc8f", "#5d9a50"],
    star: ["#ffe066", "#ffffff", "#ffd35c"], heart: ["#ff9ab8", "#ffc4d6", "#ffffff"], gold: ["#ffd34d", "#fff4b0", "#e3a524"], stone: ["#b8b2a8", "#e2ddd4", "#8f887d"],
  };
  function spawn(x, y, kind, n, opt) {
    const cols = PCOL[kind] || PCOL.star;
    if (parts.length > 160) parts.splice(0, parts.length - 160);
    for (let i = 0; i < n; i++) {
      const a = (opt && opt.up) ? -Math.PI / 2 + (Math.random() - 0.5) * 1.6 : Math.random() * Math.PI * 2;
      const sp = (opt && opt.speed || 110) * (0.4 + Math.random() * 0.8);
      parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, g: kind === "water" ? 520 : 300, life: 0.5 + Math.random() * 0.5, t: 0, c: cols[i % cols.length], s: 3, tx: opt && opt.tx, ty: opt && opt.ty });
    }
    if (!partRaf) { partLast = 0; partRaf = requestAnimationFrame(partFrame); }
  }
  function partFrame(ts) {
    const dt = partLast ? Math.min(0.05, (ts - partLast) / 1000) : 0.016;
    partLast = ts;
    cx.clearRect(0, 0, cv.width, cv.height);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t += dt;
      if (p.tx != null) {
        const k = Math.min(1, p.t / p.life), e = k * k * (3 - 2 * k);
        if (p.sx == null) { p.sx = p.x; p.sy = p.y; }
        p.x = p.sx + (p.tx - p.sx) * e; p.y = p.sy + (p.ty - p.sy) * e + Math.sin(k * Math.PI) * -50;
      } else { p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
      const a = Math.max(0, 1 - p.t / p.life);
      if (a <= 0) { parts.splice(i, 1); continue; }
      cx.globalAlpha = p.tx != null ? 1 : a;
      cx.fillStyle = p.c; cx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
    }
    cx.globalAlpha = 1;
    if (parts.length) partRaf = requestAnimationFrame(partFrame);
    else { partRaf = 0; cx.clearRect(0, 0, cv.width, cv.height); }
  }
  function centerOf(el) { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
  function flyTo(x, y, id, kind, n) {
    const t = $(id);
    if (!t) return;
    const [tx, ty] = centerOf(t);
    for (let i = 0; i < n; i++) spawn(x + (Math.random() - 0.5) * 24, y, kind, 1, { tx, ty });
    setTimeout(() => t.animate([{ transform: "scale(1.2)" }, { transform: "none" }], { duration: 260 }), 600);
  }
  function nope(el, msg) {
    if (el) el.animate([{ transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "none" }], { duration: 220 });
    if (msg) toast(msg);
  }

  // ============================================================
  // 밭 누르기
  // ============================================================
  function act(k, el, ev, drag) {
    now();
    const t = F.tile(W, k);
    const [c, r] = F.parseKey(k);
    const [x, y] = ev && ev.clientX ? [ev.clientX, ev.clientY] : centerOf(el);
    const prevSel = sel;
    sel = k;
    if (!t.open) { if (!drag) { toast("아직 못 쓰는 땅이에요. 상점에서 넓혀요"); drawInfo(); markSel(prevSel); } return; }
    let res = null;
    const tool = mine.sel;
    // 다 자란 건 어떤 도구로든 거둬요
    if (t.ready) {
      res = F.harvest(W, mine, k);
      if (res) {
        walkTo(c, r);
        const q = ["", "은빛 ", "금빛 "][res.q];
        floatNum(x, y - 20, `${q}${res.crop.name}${res.n > 1 ? " x" + res.n : ""}`, res.q === 2 ? "gold" : "petal");
        spawn(x, y, res.heart ? "heart" : "leaf", 10, { up: true });
        if (res.heart && !drag) toast(`둘이 같이 키운 ${res.crop.name} ${"♥"}`);
        if (res.levelUp) banner(`${ico("star", 4)}<b>농사 ${res.levelUp}단계!</b>`, "v2");
        if (!(W.st.harvest > 1) && !drag) firstHarvest(res);
      }
    } else if (tool === "hoe") {
      res = F.hoe(W, mine, k);
      if (res && res.fail === "debris") { if (!drag) toast("풀이나 돌은 손으로 먼저 치워요"); res = null; }
      if (res) { walkTo(c, r); spawn(x, y, "dirt", 8, { up: true }); }
    } else if (tool === "can") {
      res = F.water(W, mine, k, who);
      if (res && res.fail === "empty") { if (!drag) { toast("물이 없어요. 우물을 눌러 채워요"); pulseEl(mapEl.querySelector(".f-well")); } res = null; }
      if (res) { walkTo(c, r); spawn(x, y - 6, "water", 8); if (res.revived) floatNum(x, y - 20, "다시 살아났어요", "hit"); }
      else if (!drag && !t.tilled) toast("갈아 둔 밭에만 물을 줘요");
    } else if (tool === "hand") {
      res = F.clear(W, mine, k);
      if (res) { walkTo(c, r); spawn(x, y, res.kind === "stone" ? "stone" : "leaf", 8, { up: true }); if (res.ok === "pickup") toast("다시 주웠어요"); }
    } else if (tool === "seed") {
      if (!mine.seed) { openSheet("seeds", {}); return; }
      res = F.plant(W, mine, k, mine.seed, who);
      if (res && res.fail) { if (!drag) toast(res.fail === "season" ? "지금 계절에는 못 심어요" : "씨앗이 없어요. 상점에서 사요"); res = null; }
      else if (!res && !drag) toast(t.tilled ? "이미 뭔가 있어요" : "괭이로 먼저 갈아요");
      if (res) { walkTo(c, r); spawn(x, y, "leaf", 5, { up: true }); }
    } else if (tool === "fert") {
      if (!mine.fertSel) { openSheet("ferts", {}); return; }
      res = F.fertilize(W, mine, k, mine.fertSel);
      if (res && res.fail) { if (!drag) toast("비료가 없어요. 상점에서 사요"); res = null; }
      if (res) { walkTo(c, r); spawn(x, y, "dirt", 6); }
    } else if (tool === "obj") {
      if (!mine.objSel) { openSheet("objs", {}); return; }
      res = F.place(W, mine, k, mine.objSel);
      if (res && res.fail) { if (!drag) toast("놓을 게 없어요. 상점에서 사요"); res = null; }
      if (res) { walkTo(c, r); spawn(x, y, "water", 8); W.cache = {}; updateAll(); }
    }
    if (res) save();
    if (res && el) el.animate([{ transform: "scale(.9)" }, { transform: "none" }], { duration: 160 });
    updateTile(k);
    markSel(prevSel);
    drawInfo();
    afterAct();
  }
  function markSel(prev) {
    if (prev && prev !== sel) { const p = mapEl.querySelector(`.ft[data-k="${prev}"]`); if (p) p.classList.remove("sel"); }
    const e = mapEl.querySelector(`.ft[data-k="${sel}"]`);
    if (e) e.classList.add("sel");
  }
  let afterRaf = 0;
  function afterAct() {
    if (afterRaf) return;
    afterRaf = requestAnimationFrame(() => { afterRaf = 0; drawToday(); hud(); drawYard(); });
  }
  function pulseEl(el) { if (el) el.animate([{ transform: "scale(1)" }, { transform: "scale(1.2)" }, { transform: "scale(1)" }, { transform: "scale(1.15)" }, { transform: "scale(1)" }], { duration: 900 }); }
  function firstHarvest(res) {
    const by = res.byHim && res.byHer ? "둘이 같이 물 준" : res.byHim ? `${NAME.him}가 물 준` : res.byHer ? `${NAME.her}가 물 준` : "";
    playScene([["마루", `첫 수확이다! ${res.by ? (NAME[res.by] || "") + "가 심고 " : ""}${by} ${res.crop.name}. 멍멍!`], ["마루", "거둔 건 출하함에 넣어 봐. 내일 아침이면 돈이 들어와."]]);
  }

  // ============================================================
  // 이야기와 편지
  // ============================================================
  const PAGES = [];
  ST.CHAPTERS.forEach((ch) => ch.diary.forEach((pg) => PAGES.push(pg)));
  function letters() {
    if (!mine) return [];
    const out = [];
    F.milestones(W).forEach((m) => { if (m.done && !mine.seen["dp" + m.i]) out.push({ kind: "diary", m }); });
    if (mine.seen.our) memList.forEach((m) => { if (!mine.seen["mm:" + m.id] && !/^e:seed-/.test(m.id)) out.push({ kind: "mem", m }); });
    return out;
  }
  function readMail() {
    const list = letters();
    if (!list.length) { playScene([["우편냥", "오늘은 편지가 없다냥. 내일 또 올게냥."]]); return; }
    list.slice(0, 4).forEach((l) => {
      if (l.kind === "diary") {
        const pg = PAGES[l.m.i];
        playScene([["우편냥", `편지 왔다냥! "${l.m.text}" 축하 편지랑, 달래 할머니 일기장 한 쪽이다냥.`], ["편지", `달래의 일기 · ${pg.title}\n\n${pg.text}`]], () => {
          mine.seen["dp" + l.m.i] = 1;
          const g = 100 + l.m.i * 50;
          mine.earn["0gift"] = (mine.earn["0gift"] || 0) + g; W.gold += g;
          save(); toast(`선물 ${fmt(g)}G`); drawYard(); hud();
          if (l.m.i === PAGES.length - 1) playScene(ST.FINALE.concat([["달래", "우리 일기는 여기서 끝나지만, 너희 일기는 이제 시작이야."]]));
        });
      } else {
        playScene(M.scene(l.m, "마루"), () => { mine.seen["mm:" + l.m.id] = 1; mine.earn["0gift"] = (mine.earn["0gift"] || 0) + 50; W.gold += 50; save(); drawYard(); hud(); });
      }
    });
    if (list.length > 4) toast(`편지가 ${list.length - 4}통 더 있어요`);
  }
  // 열 때: 처음 이야기, 아침 소식
  function autoEvents() {
    if (!mine.seen.pro) {
      const pro = ST.PROLOGUE.slice(0, -1).concat([["마루", "그래도 땅은 아직 따뜻해. 괭이로 밭부터 갈아 보자. 씨앗 심고 물 주면, 내일이면 싹이 날 거야!"]]);
      playScene(pro, () => {
        mine.seen.pro = 1;
        if (!Object.keys(mine.inv).length && !W.st.plant) {
          const c = CR.CROPS.filter((x) => x.seasons.includes(W.season) && !x.regrow).sort((x, y) => x.hours - y.hours)[0];
          mine.inv["seed:" + c.id] = (mine.inv["seed:" + c.id] || 0) + 6; W.inv["seed:" + c.id] = (W.inv["seed:" + c.id] || 0) + 6;
          mine.seed = c.id;
          toast(`${c.name} 씨앗 6개를 받았어요`);
        }
        save(); updateAll();
      });
      playScene([
        ["마루", "참, 너희도 이야기가 있지?"],
        ["마루", `${M.md(cfg.firstMet)}, ${cfg.firstPlace || "어느 곳"}에서 처음 만났다며! 그리고 ${M.md(cfg.startDate)}에 1일.`],
        ["마루", "너희가 앱에 추억을 남기면 우편냥이 편지로 가져올 거야. 우편함을 봐 줘."],
      ], () => { mine.seen.our = 1; save(); drawYard(); });
      mine.lastDay = W.today;
      return;
    }
    if (mine.lastDay && mine.lastDay !== W.today) morning();
    mine.lastDay = W.today;
    save();
  }
  function morning() {
    const lines = [["", `좋은 아침이에요. ${new Date().getMonth() + 1}월 ${new Date().getDate()}일, ${CR.SEASONS[W.season]}.`]];
    let paid = 0;
    ["him", "her"].forEach((w) => { const d = W.docs[w]; for (const dk in d.earn) if (dk >= mine.lastDay && dk < W.today && dk !== "0gift") paid += d.earn[dk]; });
    if (paid) lines.push(["우편냥", `어제 출하한 값 ${fmt(paid)}G 넣어 뒀다냥.`]);
    const tiles = F.allTiles(W);
    const ready = tiles.filter((t) => t.ready).length, wilt = tiles.filter((t) => t.wilting).length, dead = tiles.filter((t) => t.dead).length, dry = tiles.filter((t) => t.thirsty).length;
    const wx = window.Scene && Scene.weather ? Scene.weather() : null;
    if (wx && wx.wet) lines.push(["마루", "비가 와서 밭이 다 촉촉해. 오늘은 물 안 줘도 돼!"]);
    else if (dry) lines.push(["마루", `물 줄 작물이 ${dry}개 있어.${wilt ? ` 그중 ${wilt}개는 시들고 있어!` : ""}`]);
    if (ready) lines.push(["마루", `다 자란 작물이 ${ready}개야. 거두자!`]);
    if (dead) lines.push(["마루", `물을 못 받아서 ${dead}개가 죽었어... 손으로 치워 주자.`]);
    const eggs = F.hensList(W).reduce((n, h) => n + h.eggs.length, 0);
    if (eggs) lines.push(["마루", `닭장에 달걀이 ${eggs}개 있어!`]);
    const n = letters().length;
    if (n) lines.push(["우편냥", `우편함에 편지 ${n}통 넣어 뒀다냥.`]);
    playScene(lines);
  }

  // ---------- 대화 ----------
  let evQ = [], sceneOn = false, sceneLines = [], sceneI = 0, sceneEnd = null, typing = 0, typeFull = "", typeRaf = 0;
  const GRANDMA = { H: "#e8e2dc", G: "#c7a6e8", D: "#a98bd0" };
  const GRANDPA = { H: "#d8d2cc", B: "#9bbf8a", P: "#7a6a5c" };
  function faceOf(name) {
    if (name === "달래") return A.pixImg("her", 4, GRANDMA);
    if (name === "바우") return A.pixImg("him", 4, GRANDPA);
    if (name === "우편냥") return A.critterImg("cat", 4);
    if (name === "마루") return A.critterImg("dog", 4);
    return "";
  }
  function playScene(lines, onEnd) { evQ.push([lines, onEnd]); if (!sceneOn) nextScene(); }
  function nextScene() {
    const item = evQ.shift();
    if (!item) { sceneOn = false; $("gScene").hidden = true; return; }
    sceneOn = true;
    [sceneLines, sceneEnd] = item;
    sceneI = 0;
    $("gScene").hidden = false;
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
    el.firstChild.animate([{ transform: "translateY(16px)", opacity: 0.2 }, { transform: "none", opacity: 1 }], { duration: 240, easing: "cubic-bezier(.22,1,.36,1)" });
    const p = el.querySelector("p");
    typeFull = text; typing = 1;
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
    if (typing) { typing = 0; cancelAnimationFrame(typeRaf); const p = $("gScene").querySelector("p"); if (p) p.textContent = typeFull; return; }
    sceneI++;
    if (sceneI < sceneLines.length) { showLine(); return; }
    const end = sceneEnd; sceneEnd = null;
    if (end) end();
    nextScene();
  }

  // ============================================================
  // 창 (한 겹)
  // ============================================================
  function openSheet(k, p) {
    const was = !!sheet;
    sheet = { k, p: p || {} };
    const out = SHEETS[k](sheet.p);
    $("gsTitle").textContent = out.title;
    const body = $("gsBody");
    body.__html = "";
    body.innerHTML = out.html;
    body.scrollTop = 0;
    const el = $("gSheet");
    el.className = "g-sheet" + (out.tall ? " tall" : "");
    el.hidden = false;
    if (!was) {
      el.querySelector(".gs-box").animate([{ transform: "translateY(100%)" }, { transform: "none" }], { duration: 300, easing: "cubic-bezier(.22,1,.36,1)" });
      el.querySelector(".gs-dim").animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220 });
    }
  }
  function setSheet(p) {
    if (!sheet) return;
    Object.assign(sheet.p, p);
    const out = SHEETS[sheet.k](sheet.p);
    $("gsTitle").textContent = out.title;
    MORPH($("gsBody"), out.html);
  }
  function refreshSheet() { if (sheet) setSheet({}); }
  function closeSheet(instant) {
    if (!sheet) return;
    sheet = null;
    const el = $("gSheet");
    if (instant) { el.hidden = true; return; }
    el.querySelector(".gs-box").animate([{ transform: "none" }, { transform: "translateY(100%)" }], { duration: 200, easing: "ease-in" }).onfinish = () => { if (!sheet) el.hidden = true; };
    el.querySelector(".gs-dim").animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 });
    updateAll();
  }
  function tabs(list, cur) { return `<div class="g-subtabs">${list.map(([k, n]) => `<button class="chip${cur === k ? " active" : ""}" data-act="stab" data-k="${k}">${n}</button>`).join("")}</div>`; }
  const SHEETS = {};

  // 상점
  SHEETS.shop = (p) => {
    const tab = p.tab || "seed";
    let body = "";
    if (tab === "seed") {
      const list = CR.CROPS.filter((c) => c.seasons.includes(W.season));
      const nextS = (W.season + 1) % 4;
      body = list.map((c) => `<div class="wrow">
          <span class="w-ico">${cropIcon(c, 2)}</span>
          <span class="w-t"><b>${esc(c.name)} <em>${W.inv["seed:" + c.id] || 0}개</em></b><i>${Math.round(c.hours / 24 * 10) / 10}일 · ${c.sell}G${c.regrow ? ` · 다시 열림 ${Math.round(c.regrow / 24 * 10) / 10}일` : ""}${c.yield > 1 ? ` · ${c.yield}개씩` : ""}${c.seasons.length > 1 ? " · " + c.seasons.map((s) => CR.SEASONS[s]).join("·") : ""}</i></span>
          <button class="btn small${W.gold >= c.seed ? " primary" : ""}" data-hold="buy" data-k="seed:${c.id}">${c.seed}G</button>
        </div>`).join("") + `<p class="g-tip">꾹 누르면 여러 개 사요 · 다음 계절(${CR.SEASONS[nextS]})엔 ${CR.CROPS.filter((c) => c.seasons.includes(nextS)).map((c) => c.name).slice(0, 4).join(", ")}…</p>`;
    } else if (tab === "goods") {
      body = Object.keys(CR.FERT).map((id) => {
        const f = CR.FERT[id];
        const ok = W.level >= f.lv;
        return `<div class="wrow${ok ? "" : " dim"}"><span class="w-ico">${art("fert", 5)}</span><span class="w-t"><b>${esc(f.name)} <em>${W.inv["fert:" + id] || 0}개</em></b><i>${esc(f.desc)}${ok ? "" : ` · 농사 ${f.lv}단계부터`}</i></span>
          <button class="btn small" data-hold="buy" data-k="fert:${id}" ${ok ? "" : "disabled"}>${f.price}G</button></div>`;
      }).join("") + Object.keys(CR.OBJS).map((id) => {
        const o = CR.OBJS[id];
        const ok = W.level >= o.lv;
        return `<div class="wrow${ok ? "" : " dim"}"><span class="w-ico">${art(id, 3)}</span><span class="w-t"><b>${esc(o.name)} <em>${W.inv[id] || 0}개</em></b><i>매일 아침 ${esc(o.desc)}에 물${ok ? "" : ` · 농사 ${o.lv}단계부터`}</i></span>
          <button class="btn small" data-hold="buy" data-k="${id}" ${ok ? "" : "disabled"}>${fmt(o.price)}G</button></div>`;
      }).join("");
    } else {
      const can = W.up.can || 0, land = W.up.land || 0;
      const nextCan = CR.CAN[can + 1], nextLand = CR.LAND[land + 1];
      body = `<div class="wrow"><span class="w-ico">${spr("can", 3)}</span><span class="w-t"><b>${esc(CR.CAN[can].name)}</b><i>물 ${CR.CAN[can].cap}번${nextCan ? ` → ${esc(nextCan.name)} ${nextCan.cap}번` : ""}</i></span>${nextCan ? `<button class="btn small" data-act="up" data-k="can">${fmt(nextCan.price)}G</button>` : `<span class="w-max">최고</span>`}</div>
        <div class="wrow"><span class="w-ico">${ico("leaf", 4)}</span><span class="w-t"><b>밭 넓히기</b><i>지금 ${CR.LAND[land].rows}줄${nextLand ? ` → ${nextLand.rows}줄` : ""}</i></span>${nextLand ? `<button class="btn small" data-act="up" data-k="land">${fmt(nextLand.price)}G</button>` : `<span class="w-max">다 열었어요</span>`}</div>
        <div class="wrow"><span class="w-ico">${art("hen", 3)}</span><span class="w-t"><b>닭장</b><i>닭을 키우면 매일 달걀을 낳아요</i></span>${W.up.coop ? `<span class="w-max">있어요</span>` : `<button class="btn small" data-act="up" data-k="coop">${fmt(CR.COOP)}G</button>`}</div>`;
    }
    return { title: "마을 상점", html: tabs([["seed", "씨앗"], ["goods", "비료·물건"], ["farm", "농장"]], tab) + body };
  };
  // 씨앗, 비료, 물건 고르기 (가방)
  function pickList(prefix, cur, act, empty) {
    const items = Object.keys(W.inv).filter((k) => k.startsWith(prefix) && W.inv[k] > 0);
    return items.length ? `<div class="seeds">${items.map((k) => {
      const id = k.slice(prefix.length);
      const it = F.itemInfo(k);
      const pic = it.crop ? cropIcon(it.crop, 2) : it.kind === "fert" ? art("fert", 5) : art(id, 3);
      return `<button class="seed${cur === id ? " on" : ""}" data-act="${act}" data-k="${id}"><span class="seed-img">${pic}</span><b>${esc(it.name)}</b><span class="seed-cost">${W.inv[k]}개</span></button>`;
    }).join("")}</div>` : `<p class="g-tip">${empty}</p>`;
  }
  SHEETS.seeds = () => ({ title: "씨앗 고르기", html: pickList("seed:", mine.seed, "pickseed", "씨앗이 없어요") + `<button class="btn block" data-act="sheet" data-k="shop">상점 가기</button>` });
  SHEETS.ferts = () => ({ title: "비료 고르기", html: pickList("fert:", mine.fertSel, "pickfert", "비료가 없어요. 농사 2단계부터 상점에서 팔아요") + `<button class="btn block" data-act="sheet" data-k="shop" data-tab="goods">상점 가기</button>` });
  SHEETS.objs = () => {
    const items = Object.keys(CR.OBJS).filter((k) => (W.inv[k] || 0) > 0);
    return { title: "놓을 물건", html: (items.length ? `<div class="seeds">${items.map((id) => `<button class="seed${mine.objSel === id ? " on" : ""}" data-act="pickobj" data-k="${id}"><span class="seed-img">${art(id, 3)}</span><b>${esc(CR.OBJS[id].name)}</b><span class="seed-cost">${W.inv[id]}개</span></button>`).join("")}</div>` : `<p class="g-tip">스프링클러는 농사 3단계부터 상점에서 팔아요</p>`) + `<button class="btn block" data-act="sheet" data-k="shop" data-tab="goods">상점 가기</button>` };
  };
  // 출하함
  SHEETS.bin = () => {
    const items = Object.keys(W.inv).filter((k) => W.inv[k] > 0 && F.sellPrice(W, k) > 0 && !k.startsWith("seed:") && !k.startsWith("fert:"));
    items.sort((a, b) => F.sellPrice(W, b) - F.sellPrice(W, a));
    const tot = items.reduce((n, k) => n + F.sellPrice(W, k) * W.inv[k], 0);
    const rows = items.map((k) => {
      const it = F.itemInfo(k);
      const pic = it.kind === "crop" ? cropIcon(it.crop, 2) : it.kind === "egg" ? art(it.big ? "eggBig" : "egg", 5) : art(it.kind === "fiber" ? "fiber" : "rock", 5);
      const tag = it.kind === "crop" ? `${["", "은빛 ", "금빛 "][it.q]}${it.heart ? "♥ " : ""}` : "";
      return `<button class="bin-it q${it.q || 0}${it.heart ? " love" : ""}" data-hold="ship" data-k="${k}"><span>${pic}</span><b>${esc(tag + it.name)}</b><i>${W.inv[k]}개 · ${F.sellPrice(W, k)}G</i></button>`;
    }).join("");
    return {
      title: "출하함",
      html: `<p class="g-tip">넣은 건 내일 아침 6시에 돈이 돼요${W.goldWait ? ` · 지금까지 ${fmt(W.goldWait)}G` : ""}</p>
        ${items.length ? `<div class="bin-grid">${rows}</div><button class="btn block primary" data-act="shipall">모두 넣기 (${fmt(tot)}G)</button>` : `<p class="g-tip">거둔 작물이 없어요</p>`}
        <p class="g-tip">♥ 표시는 둘이 같이 물을 준 작물이에요. 값이 더 나가요</p>`,
    };
  };
  // 닭장
  SHEETS.coop = () => {
    if (!W.up.coop) return { title: "닭장 터", html: `<p class="g-tip">닭장을 지으면 닭을 키울 수 있어요. 매일 모이를 주면 다음 날 아침 달걀을 낳아요</p><button class="btn block${W.gold >= CR.COOP ? " primary" : ""}" data-act="up" data-k="coop">닭장 짓기 ${fmt(CR.COOP)}G</button>` };
    const hens = F.hensList(W);
    const eggs = hens.reduce((n, h) => n + h.eggs.length, 0);
    return {
      title: "닭장",
      html: `${eggs ? `<button class="btn block primary" data-act="eggs">${art("egg", 4)} 달걀 ${eggs}개 줍기</button>` : `<p class="g-tip">오늘 모이를 주면 내일 아침 달걀을 낳아요</p>`}
        <div class="hens">${hens.map((h) => `<div class="hen box">
          <span class="hen-img">${art("hen", 5)}</span>
          <span class="w-t"><b>${esc(h.name)}</b><i>${"♥".repeat(Math.ceil(h.hearts / 2)) || "♡"} ${h.big ? "· 큰 달걀" : ""}</i></span>
          <span class="w-btns">
            <button class="btn small${h.fedToday ? "" : " primary"}" data-act="feed" data-k="${h.id}" ${h.fedToday ? "disabled" : ""}>${h.fedToday ? "먹었어요" : "모이 주기"}</button>
            <button class="btn small" data-act="henpet" data-k="${h.id}" ${h.petToday ? "disabled" : ""}>${h.petToday ? "좋아해요" : "쓰다듬기"}</button>
            <button class="chip" data-act="rename" data-k="${h.id}">이름</button>
          </span>
        </div>`).join("")}</div>
        ${hens.length < CR.MAX_HENS ? `<button class="btn block" data-act="buyhen">닭 데려오기 ${fmt(CR.HEN)}G</button>` : ""}`,
    };
  };
  // 우리 집: 일기장, 우리 이야기, 모은 작물, 기록
  SHEETS.house = (p) => {
    const tab = p.tab || "dal";
    let body = "";
    if (tab === "dal") {
      const ms = F.milestones(W);
      const sel2 = p.page != null && p.page !== "" ? PAGES[Number(p.page)] : null;
      body = `${sel2 ? `<article class="paper"><h2>${esc(sel2.title)}</h2><p>${esc(sel2.text)}</p><button class="chip paper-close" data-act="hset" data-page="">닫기</button></article>` : ""}
        <div class="story-btns"><button class="chip" data-act="replay" data-k="pro">${spr("letter", 2)}처음 편지</button></div>
        <div class="qlist">${ms.map((m) => {
          const got = mine.seen["dp" + m.i] || W.docs[other()].seen["dp" + m.i];
          return `<div class="qrow${got ? " done" : m.done ? " can" : ""}"><span class="q-n">${got ? ico("book", 2) : m.done ? ico("letter", 2) || "!" : m.i + 1}</span>
            <span class="q-t">${got ? `<b>${esc(PAGES[m.i].title)}</b>` : "<b>찢어진 쪽</b>"}<i>${esc(m.text)}${m.done && !got ? " · 우편함에 와 있어요" : ""}</i></span>
            ${got ? `<button class="chip" data-act="hset" data-page="${m.i}">읽기</button>` : ""}</div>`;
        }).join("")}</div>`;
    } else if (tab === "our") {
      const pages = M.monthPages(Date.now()).reverse();
      const sp = p.mp ? pages.find((x) => x.key === p.mp) : null;
      const st = memStage, nx = M.TREE[st + 1];
      body = `${sp ? `<article class="paper"><h2>${esc(sp.title)}</h2>${sp.photo ? `<img class="paper-photo" src="${esc(Store.photoUrl(sp.photo))}" alt="">` : ""}<p>${esc(sp.text)}</p><button class="chip paper-close" data-act="hset" data-mp="">닫기</button></article>` : ""}
        <div class="tree-card box"><span class="tc-t"><b>추억 나무 · ${esc(M.TREE_NAME[st])}</b><i>추억 ${memList.length}개${nx ? ` · 다음까지 ${nx - memList.length}개` : ""} · 작물 값 +${st * 2}%</i></span></div>
        <p class="g-tip">앱에 데이트, 맛집, 일기, 질문 답을 남기면 추억이 되고 나무가 자라요</p>
        <div class="dpages wide">${pages.map((pg) => `<button class="dpage" data-act="hset" data-mp="${pg.key}">${ico("book", 2)}<span>${esc(pg.title)}<i> 추억 ${pg.count}</i></span></button>`).join("")}</div>`;
    } else if (tab === "col") {
      body = `<p class="g-tip">출하한 작물 ${Object.keys(W.shipped).length}/${CR.CROPS.length}</p><div class="bk-grid">${CR.CROPS.map((c) => {
        const n = W.shipped[c.id] || 0;
        return `<div class="bk${n ? "" : " unknown"}"><span class="bk-img">${n ? cropIcon(c, 2) : `<span class="sil">${cropIcon(c, 2)}</span>`}</span><b>${n ? esc(c.name) : CR.SEASONS[c.seasons[0]]}</b><span class="bk-s">${n ? n + "개" : ""}</span></div>`;
      }).join("")}</div>`;
    } else {
      const h = W.docs.him.st, e = W.docs.her.st;
      const rows = [["밭 갈기", "till"], ["씨앗 심기", "plant"], ["물 주기", "water"], ["거두기", "harvest"], ["출하", "ship"], ["둘이 키운 작물", "together"], ["달걀", "egg"]].map(([n, k]) => {
        const a = h[k] || 0, b = e[k] || 0, t = Math.max(1, a + b);
        return `<div class="st-row"><span class="st-n">${n}</span><span class="him">${fmt(a)}</span><i class="g-bar duo"><b style="transform:scaleX(${(a / t).toFixed(3)})"></b></i><span class="her">${fmt(b)}</span></div>`;
      }).join("");
      body = `<div class="st-head"><span class="him">${esc(NAME.him)}</span><span class="her">${esc(NAME.her)}</span></div><div class="st-list">${rows}</div>
        <div class="sp-info box"><div><span>농사</span><b>${W.level}단계 · ${fmt(W.xp)}</b></div><div><span>모은 돈</span><b>${fmt(W.goldIn)}G</b></div><div><span>마루</span><b>하트 ${W.dogHearts}/10</b></div></div>`;
    }
    return { title: "우리 집", tall: true, html: tabs([["dal", "달래의 일기"], ["our", "우리 이야기"], ["col", "모은 작물"], ["stats", "기록"]], tab) + body };
  };

  // ============================================================
  // 누르기
  // ============================================================
  let drag = null, holdTimer = 0, holdEl = null;
  function onDown(ev) {
    if (!W) return;
    const t = ev.target.closest("[data-tap],[data-hold]");
    if (!t || !root.contains(t)) return;
    if (t.dataset.hold) {
      ev.preventDefault();
      holdEl = t;
      doHold(t);
      let wait = 380;
      const rep = () => { if (holdEl !== t) return; doHold(t); wait = Math.max(70, wait * 0.8); holdTimer = setTimeout(rep, wait); };
      holdTimer = setTimeout(rep, wait);
      return;
    }
    if (t.dataset.tap === "tile") {
      drag = { done: new Set([t.dataset.k]) };
      act(t.dataset.k, t, ev, false);
    }
  }
  // 손가락으로 쓸면 지나간 칸마다 같은 일을 해요
  function onMove(ev) {
    if (!drag) return;
    const el = document.elementFromPoint(ev.clientX, ev.clientY);
    const ft = el && el.closest && el.closest(".ft[data-k]");
    if (!ft || drag.done.has(ft.dataset.k)) return;
    drag.done.add(ft.dataset.k);
    act(ft.dataset.k, ft, ev, true);
  }
  function onUp() {
    drag = null;
    if (holdEl) { holdEl = null; clearTimeout(holdTimer); refreshSheet(); hud(); }
  }
  function doHold(el) {
    now();
    const k = el.dataset.hold, id = el.dataset.k;
    let ok = null;
    if (k === "buy") { ok = F.buy(W, mine, id, 1); if (ok && ok.fail) { nope(el, "돈이 모자라요"); ok = null; } }
    if (k === "ship") { ok = F.ship(W, mine, id, 1); }
    if (!ok) { holdEl = null; clearTimeout(holdTimer); return; }
    save();
    const [x, y] = centerOf(el);
    if (k === "buy") {
      floatNum(x, y - 20, "+1", "petal");
      if (id.startsWith("seed:") && !mine.seed) mine.seed = id.slice(5);
      if (id.startsWith("fert:") && !mine.fertSel) mine.fertSel = id.slice(5);
      if (CR.OBJS[id] && !mine.objSel) mine.objSel = id;
    } else { floatNum(x, y - 20, `+${ok.g}G`, "gold"); spawn(x, y, "gold", 4, { up: true }); }
    refreshSheet();
    hud();
  }
  function onClick(ev) {
    const t = ev.target.closest("[data-act]");
    if (!t || !root.contains(t) || !W) {
      if (!W && ev.target.closest("[data-me]")) setTimeout(() => { if (load()) { build(); startTick(); autoEvents(); } }, 0);
      return;
    }
    const d = t.dataset;
    now();
    switch (d.act) {
      case "close": close(); break;
      case "sheet": openSheet(d.k, { tab: d.tab }); break;
      case "sheetclose": closeSheet(); break;
      case "stab": setSheet({ tab: d.k, page: "", mp: "" }); break;
      case "hset": { const p = {}; if (d.page != null) p.page = d.page; if (d.mp != null) p.mp = d.mp; setSheet(p); $("gsBody").scrollTop = 0; break; }
      case "tool": {
        const k = d.k;
        if (mine.sel === k && (k === "seed" || k === "fert" || k === "obj")) { openSheet(k === "seed" ? "seeds" : k === "fert" ? "ferts" : "objs", {}); break; }
        mine.sel = k; save(); drawBar();
        if (k === "seed" && !mine.seed) openSheet("seeds", {});
        if (k === "fert" && !mine.fertSel) openSheet("ferts", {});
        if (k === "obj" && !mine.objSel) openSheet("objs", {});
        break;
      }
      case "pickseed": mine.seed = d.k; mine.sel = "seed"; save(); closeSheet(); drawBar(); break;
      case "pickfert": mine.fertSel = d.k; mine.sel = "fert"; save(); closeSheet(); drawBar(); break;
      case "pickobj": mine.objSel = d.k; mine.sel = "obj"; save(); closeSheet(); drawBar(); break;
      case "well": {
        const cap = F.refill(W, mine); save();
        spawn(...centerOf(t), "water", 14, { up: true });
        floatNum(...centerOf(t), `물 ${cap}`, "");
        mine.sel = "can"; drawBar();
        break;
      }
      case "bowl": {
        if (F.dogBowl(W, mine)) { save(); spawn(...centerOf(t), "water", 10, { up: true }); toast("마루 물그릇을 채웠어요"); dogHop(); }
        else toast("오늘은 이미 채웠어요");
        updateAll();
        break;
      }
      case "dog": {
        const before = W.dogHearts;
        const ok = F.dogPet(W, mine);
        if (ok) save();
        spawn(...centerOf(t), "heart", ok ? 10 : 4, { up: true });
        dogHop();
        if (ok) toast(`마루가 좋아해요 · 하트 ${W.dogHearts}`);
        else toast(["멍!", "꼬리를 흔들어요", "오늘도 고마워 멍"][Math.floor(Math.random() * 3)]);
        [3, 6, 10].forEach((h, i) => { if (W.dogHearts >= h && before < h) playScene(ST.CHAPTERS[0].hearts[i]); });
        updateAll();
        break;
      }
      case "mail": readMail(); break;
      case "up": {
        const r = F.upgrade(W, mine, d.k);
        if (!r || r.fail) { nope(t, "돈이 모자라요"); break; }
        save();
        spawn(...centerOf(t), "star", 20, { speed: 200 });
        banner(`${ico("star", 4)}<b>${d.k === "can" ? CR.CAN[W.up.can].name : d.k === "land" ? "밭이 넓어졌어요" : "닭장을 지었어요"}</b>`, "v2");
        if (d.k === "can") F.refill(W, mine);
        save();
        refreshSheet(); updateAll();
        break;
      }
      case "shipall": {
        let g = 0;
        Object.keys(W.inv).forEach((k) => { if (W.inv[k] > 0 && F.sellPrice(W, k) > 0 && !k.startsWith("seed:") && !k.startsWith("fert:")) { const r = F.ship(W, mine, k, W.inv[k]); if (r) g += r.g; } });
        save();
        spawn(...centerOf(t), "gold", 16, { up: true });
        toast(`내일 아침 ${fmt(g)}G가 들어와요`);
        refreshSheet(); hud();
        break;
      }
      case "eggs": { const r = F.collectEggs(W, mine); save(); toast(`달걀 ${r.n + r.big}개`); spawn(...centerOf(t), "star", 12); refreshSheet(); drawYard(); break; }
      case "feed": if (F.feedHen(W, mine, d.k)) { save(); spawn(...centerOf(t), "leaf", 8); refreshSheet(); drawToday(); } break;
      case "henpet": if (F.petHen(W, mine, d.k)) { save(); spawn(...centerOf(t), "heart", 10, { up: true }); refreshSheet(); } break;
      case "rename": {
        const h = W.hens[d.k];
        const n = window.prompt("닭 이름", h ? h[0] : "");
        if (n && n.trim()) { F.renameHen(W, mine, d.k, n.trim().slice(0, 8)); save(); refreshSheet(); }
        break;
      }
      case "buyhen": {
        const n = window.prompt("새 닭 이름", ["꼬꼬", "보리", "콩이", "노른자"][F.hensList(W).length] || "꼬꼬");
        if (n == null) break;
        const r = F.buyHen(W, mine, (n.trim() || "꼬꼬").slice(0, 8));
        if (!r || r.fail) { nope(t, r && r.fail === "full" ? "닭장이 꽉 찼어요" : "돈이 모자라요"); break; }
        save(); toast("닭이 왔어요. 오늘 모이를 주면 내일 달걀을 낳아요"); refreshSheet(); drawYard(); hud();
        break;
      }
      case "replay": if (d.k === "pro") playScene(ST.PROLOGUE); break;
      default: break;
    }
  }
  function dogHop() {
    const dg = $("farmDog");
    if (dg) dg.animate([{ transform: dg.style.transform || "none" }, { transform: (dg.style.transform || "") + " translateY(-10px)" }, { transform: dg.style.transform || "none" }], { duration: 360 });
  }
  // 마루와 닭이 마당을 돌아다녀요
  function wander() {
    const dg = $("farmDog");
    if (!dg) return;
    const x = 4 + Math.random() * 2.2, y = 1 + Math.random() * 1.1;
    dg.style.transform = `translate(calc(var(--t) * ${x.toFixed(2)}), calc(var(--t) * ${y.toFixed(2)}))`;
    dg.classList.toggle("left", Math.random() < 0.5);
  }

  function startTick() {
    stopTick();
    wander();
    let n = 0;
    tickTimer = setInterval(() => {
      if (!W || root.hidden || document.hidden) return;
      n++;
      if (n % 4 === 0) wander();
      if (n % 15 === 0) { now(); updateAll(); }
      else hud();
    }, 2000);
  }
  function stopTick() { clearInterval(tickTimer); tickTimer = 0; }

  // ============================================================
  // 홈 화면과 이어지는 곳
  // ============================================================
  function ensureW() {
    if (!W) return load();
    now();
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
    render() {
      if (!root || root.hidden) { W = null; return; }
      if (!W) { if (load()) { build(); startTick(); autoEvents(); } return; }
      load();
      updateAll();
      if (sheet) refreshSheet();
    },
    sceneSvgs() {
      if (!ensureW()) return [];
      return F.allTiles(W).filter((t) => t.crop && !t.dead).slice(0, 3).map((t, i) => ({
        plot: i, html: cropImg(t.crop, t.stage), plant: { stage: t.stage, ready: t.ready, thirsty: t.thirsty, wilted: t.wilting, bugs: [] }, key: `${t.crop.id}:${t.stage}:${t.ready}:${t.thirsty}`,
      }));
    },
    badge() {
      if (!ensureW()) return "";
      const tiles = F.allTiles(W);
      if (tiles.some((t) => t.wilting)) return "시듦!";
      if (tiles.some((t) => t.ready)) return "수확!";
      if (tiles.some((t) => t.thirsty)) return "물!";
      if (letters().length) return "편지!";
      return `농사 ${W.level}`;
    },
    home() {
      if (!ensureW()) return null;
      const tiles = F.allTiles(W).filter((t) => t.crop && !t.dead);
      const dry = tiles.filter((t) => t.thirsty).length, ready = tiles.filter((t) => t.ready).length;
      const text = !tiles.length ? "밭이 비었어요. 씨앗을 심어요" : ready ? `다 자란 작물 ${ready}개` : dry ? `물 줄 작물 ${dry}개` : "모두 촉촉하게 자라는 중";
      return {
        area: "우리 농장", npc: A.critterImg("dog", 3), petals: fmt(W.gold) + "G",
        quest: { text, f: tiles.length ? tiles.reduce((n, t) => n + t.frac, 0) / tiles.length : 0, done: !!ready, letter: true },
        plants: tiles.slice(0, 6).map((t) => ({ html: cropImg(t.crop, t.stage), ready: t.ready, f: t.frac })),
      };
    },
    quickTap() { open("garden"); return null; },
    rain() {
      if (!ensureW()) return;
      if (F.rain(W, mine)) save();
    },
    attend() { ensureW(); },
    _debug() { return { W, mine, F }; },
  };
})();
