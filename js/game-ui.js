// ============================================================
// 같이 키우기: 화면 담당
// 정원 · 화분 · 씨앗 · 상점 4곳 · 창고 · 도감 · 종 상세 · 미션 · 출석 · 도전 · 레벨 길
// 부엌 · 요리 중 · 요리 상자 · 선물 쓰기 · 선물함 · 선물 열기 · 선물 진열장 · 꾸미기
// 동물 친구 · 데려오기 · 놀이터 · 놀이 4가지 · 날씨 예보 · 정원 일지 · 사진첩 · 더보기 · 도움말
// ============================================================
(function () {
  "use strict";

  const G = window.GameData;
  const C = window.GameCore;
  const cfg = typeof DIARY_CONFIG !== "undefined" ? DIARY_CONFIG : {};
  const WHO = { him: cfg.him || "석영", her: cfg.her || "예은" };
  const $ = (id) => document.getElementById(id);
  let H = null;
  let root, main, fxl;
  const stack = [];
  let stopMini = null;
  let busy = false;
  let shopTab = "tool";
  let storeTab = "item";

  function me() { return Store.me() || ""; }
  function other() { return me() === "her" ? "him" : "her"; }
  function S() { return C.compute(); }
  function esc(s) { return H ? H.esc(s) : String(s); }
  function add(rec) {
    const r = H.silently(() => Store.put("garden", Object.assign({ who: me() || "him", at: Date.now() }, rec)));
    C.invalidate();
    return r;
  }
  function icon(n, s) { return PIXEL.icon(n, s || 2); }
  function spr(n, s) { return PIXEL.sprite(n, s || 3); }
  function coin(n) { return `<span class="gm-coin">${icon("coin")}${n}</span>`; }
  function bar(cls, pct) { return `<div class="bar ${cls}"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></div>`; }
  function itemIcon(key, scale) {
    scale = scale || 3;
    if (key.indexOf("pr:") === 0) return C.plantSvg(key.slice(3), 5, { scale: Math.max(1, scale - 1), pot: false });
    if (key.indexOf("dish:") === 0) { const r = G.RECIPES.find((x) => x.id === key.slice(5)); return r ? spr(r.sprite, scale) : ""; }
    if (key.indexOf("decor:") === 0) { const d = G.DECOR.find((x) => x.id === key.slice(6)); return d ? spr(d.sprite, Math.max(2, scale - 1)) : ""; }
    if (key.indexOf("skin:") === 0) return potSvg(key.slice(5), scale - 1);
    const it = G.ITEMS[key];
    if (!it) return "";
    return it.icon ? icon(it.sprite, scale) : spr(it.sprite, scale);
  }
  function itemName(key) {
    if (key.indexOf("pr:") === 0) return (G.SPECIES[key.slice(3)] || {}).produce || key;
    if (key.indexOf("dish:") === 0) return (G.RECIPES.find((x) => x.id === key.slice(5)) || {}).name || key;
    if (key.indexOf("decor:") === 0) return (G.DECOR.find((x) => x.id === key.slice(6)) || {}).name || key;
    if (key.indexOf("skin:") === 0) return ((G.POTS[key.slice(5)] || {}).name || "") + " 화분";
    return (G.ITEMS[key] || {}).name || key;
  }
  function potSvg(skin, scale) {
    const pot = G.POTS[skin] || G.POTS.basic;
    return PIXEL.draw(C.potRows(skin), { K: "#7a5a40", R: pot.R, O: pot.O, o: pot.o, H: pot.H }, scale || 3);
  }
  function fmtTime(ms) {
    const d = new Date(ms);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  // ---------- 움직임 도구 ----------
  function fxAt(el) {
    const r = el.getBoundingClientRect();
    const rr = root.getBoundingClientRect();
    return { x: r.left - rr.left + r.width / 2, y: r.top - rr.top + r.height / 2 };
  }
  // 물건이 포물선을 그리며 날아가요 (예: 코인이 위쪽 지갑으로)
  function fly(fromEl, toEl, html, n) {
    if (!fromEl || !toEl) return;
    const a = fxAt(fromEl), b = fxAt(toEl);
    for (let i = 0; i < (n || 1); i++) {
      const e = document.createElement("span");
      e.className = "gm-fly";
      e.innerHTML = html;
      e.style.left = a.x + "px";
      e.style.top = a.y + "px";
      e.style.setProperty("--dx", b.x - a.x + "px");
      e.style.setProperty("--dy", b.y - a.y + "px");
      e.style.animationDelay = i * 70 + "ms";
      e.addEventListener("animationend", () => { e.remove(); H.play(toEl, "boing"); });
      fxl.appendChild(e);
    }
  }
  function banner(text, kind) {
    const e = document.createElement("div");
    e.className = "gm-banner " + (kind || "");
    e.textContent = text;
    e.addEventListener("animationend", () => e.remove());
    fxl.appendChild(e);
  }
  function stampOn(el, text) {
    const e = document.createElement("span");
    e.className = "gm-stamp";
    e.innerHTML = `${spr("stamp", 3)}<b>${esc(text || "")}</b>`;
    el.appendChild(e);
    setTimeout(() => e.classList.add("set"), 20);
  }
  function inView(cls, html, ms) {
    const v = $("gpFx");
    if (!v) return null;
    const e = document.createElement("span");
    e.className = cls;
    e.innerHTML = html || "";
    v.appendChild(e);
    setTimeout(() => e.remove(), ms || 1400);
    return e;
  }
  function rainIn(kind, n, spread) {
    const v = $("gpFx");
    if (!v) return;
    for (let i = 0; i < n; i++) {
      const d = document.createElement("i");
      d.className = "gp-" + kind;
      d.style.left = 50 + (Math.random() - 0.5) * (spread || 30) + "%";
      d.style.animationDelay = i * 55 + "ms";
      d.addEventListener("animationend", () => d.remove());
      v.appendChild(d);
    }
  }
  function floatTxt(text, cls) { inView("gp-float " + (cls || ""), text, 1300); }
  function plantEl() { return $("gpPlant"); }

  // ---------- 틀 ----------
  function ensureRoot() {
    if (root) return;
    root = document.createElement("div");
    root.id = "game";
    root.className = "game";
    root.hidden = true;
    root.innerHTML = `
      <header class="gm-head">
        <button class="gm-back" data-act="back" aria-label="뒤로">${icon("down", 3)}</button>
        <h1 class="gm-title" id="gmTitle"></h1>
        <button class="gm-lv" data-act="go" data-to="levels" id="gmLv"></button>
        <button class="gm-wallet" data-act="go" data-to="shop" id="gmCoins"></button>
      </header>
      <main class="gm-main" id="gmMain"></main>
      <nav class="gm-tabs">
        <button class="gm-tab" data-act="tab" data-to="garden">${icon("leaf", 3)}<b>정원</b></button>
        <button class="gm-tab" data-act="tab" data-to="missions">${icon("todo", 3)}<b>미션</b><i id="gmMissionDot"></i></button>
        <button class="gm-tab" data-act="tab" data-to="shop">${icon("coin", 3)}<b>상점</b></button>
        <button class="gm-tab" data-act="tab" data-to="play">${icon("dice", 3)}<b>놀이</b></button>
        <button class="gm-tab" data-act="tab" data-to="more">${icon("dots", 3)}<b>더보기</b><i id="gmMoreDot"></i></button>
      </nav>
      <div class="gm-fxl" id="gmFx"></div>`;
    document.body.appendChild(root);
    main = $("gmMain");
    fxl = $("gmFx");
    root.addEventListener("click", onClick);
    root.addEventListener("submit", onSubmit);
  }
  function open(screen, params) {
    ensureRoot();
    if (!me()) { H.toast("먼저 누구 폰인지 골라 줘요"); }
    ensureSeed();
    stack.length = 0;
    stack.push({ screen: screen || "garden", params: params || {} });
    root.hidden = false;
    root.classList.remove("closing");
    document.body.classList.add("game-open");
    restartAnim(root, "gm-in");
    render();
  }
  function close() {
    if (stopMini) { stopMini(); stopMini = null; }
    root.classList.add("closing");
    setTimeout(() => { root.hidden = true; root.classList.remove("closing"); document.body.classList.remove("game-open"); }, 200);
    if (H.onChanged) H.onChanged();
  }
  function go(screen, params) {
    if (stopMini) { stopMini(); stopMini = null; }
    stack.push({ screen, params: params || {} });
    render("fwd");
  }
  function back() {
    if (stopMini) { stopMini(); stopMini = null; }
    if (stack.length <= 1) { close(); return; }
    stack.pop();
    render("back");
  }
  function tab(screen) {
    if (stopMini) { stopMini(); stopMini = null; }
    stack.length = 0;
    stack.push({ screen, params: {} });
    render("tab");
  }
  function restartAnim(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
  function render(dir) {
    if (!root || root.hidden) return;
    const top = stack[stack.length - 1];
    const fn = SCREENS[top.screen] || SCREENS.garden;
    const s = S();
    const out = fn(s, top.params || {});
    $("gmTitle").textContent = out.title;
    $("gmCoins").innerHTML = `${icon("coin", 2)}<b>${s.coins}</b>`;
    $("gmLv").innerHTML = `<b>Lv.${s.level}</b>`;
    root.querySelector(".gm-back").classList.toggle("close", stack.length <= 1);
    main.innerHTML = out.html;
    main.scrollTop = 0;
    restartAnim(main, dir === "back" ? "gm-from-left" : dir === "tab" ? "gm-fade" : "gm-from-right");
    const tabKey = out.tab || top.screen;
    root.querySelectorAll(".gm-tab").forEach((t) => t.classList.toggle("active", t.dataset.to === tabKey));
    const unopened = s.gifts.filter((g) => g.to === me() && !g.opened).length;
    const claimable = Object.keys(G.LEVEL_REWARDS).filter((lv) => Number(lv) <= s.level && !s.claimed.has(Number(lv))).length;
    $("gmMoreDot").textContent = unopened + claimable ? String(unopened + claimable) : "";
    $("gmMissionDot").textContent = s.today.list.filter((m) => m.done).length + "/" + s.today.list.length;
    $("gmMissionDot").classList.toggle("all", s.today.all);
    if (out.after) out.after(s);
    checkNews(s);
  }
  function refresh() { render("tab"); }

  // 새로 깬 도전, 레벨 오름을 이 폰에서 한 번만 축하해요.
  function checkNews(s) {
    let seen;
    try { seen = JSON.parse(localStorage.getItem("hsd.gnews") || "null"); } catch (e) { seen = null; }
    const now = { lv: s.level, ach: s.ach.filter((a) => a.done).map((a) => a.id), mission: s.today.all ? C.dayKey(Date.now()) : "" };
    if (!seen) { try { localStorage.setItem("hsd.gnews", JSON.stringify(now)); } catch (e) { /* 무시 */ } return; }
    if (now.lv > seen.lv) { banner(`레벨 ${now.lv} · ${s.levelTitle}`, "lv"); H.burst(window.innerWidth / 2, 120, 20); setTimeout(() => H.burst(window.innerWidth / 2, 160, 12, "heart"), 300); }
    const fresh = now.ach.filter((id) => !seen.ach.includes(id));
    if (fresh.length) { const a = s.ach.find((x) => x.id === fresh[0]); setTimeout(() => { banner(`도전 완료: ${a.title} +${a.reward}`, "ach"); H.burst(window.innerWidth / 2, 140, 14); }, now.lv > seen.lv ? 1600 : 0); }
    if (now.mission && now.mission !== seen.mission) setTimeout(() => { banner(`오늘의 미션 모두 완료! +${G.MISSION_BONUS}`, "mission"); H.burst(window.innerWidth / 2, 140, 16, "heart"); }, 400);
    try { localStorage.setItem("hsd.gnews", JSON.stringify(now)); } catch (e) { /* 무시 */ }
  }

  // 첫 씨앗은 자동으로 심어요. 다른 폰에 이미 있으면 그쪽 기록이 이기게 soft 로 넣어요.
  function ensureSeed() {
    const s = S();
    if (s.hasSeed) return;
    H.silently(() => Store.put("garden", { id: "seed-p1", type: "seed", plot: 0, plant: "p1", species: "sunflower", who: me() || "him", at: Date.now() }, { soft: true }));
    C.invalidate();
  }

  // ---------- 화면들 ----------
  const SCREENS = {};

  SCREENS.garden = (s) => {
    const phase = window.Scene && Scene._state ? Scene._state : null;
    const night = phase && phase.dark > 0.55;
    const slots = [];
    for (let i = 0; i < G.DECOR_SLOTS; i++) {
      const id = s.decorSlots[i];
      const d = id && G.DECOR.find((x) => x.id === id);
      slots.push(`<button class="gg-slot${d ? " filled" : ""}" data-act="go" data-to="decorate" data-slot="${i}" style="--i:${i}">${d ? spr(d.sprite, 3) : '<i class="gg-plus">+</i>'}</button>`);
    }
    const pet = s.pet ? `<button class="gg-pet" data-act="go" data-to="pet">${spr(s.pet.def.sprite, 3)}${s.pet.hunger < 30 ? '<i class="gg-need">배고파</i>' : ""}</button>` : "";
    const cells = s.plots.map((pl) => {
      if (!pl.unlocked) return `<button class="gg-plot locked" data-act="lockedPlot" data-plot="${pl.idx}">${icon("lock", 3)}<b>Lv.${pl.need}</b></button>`;
      const p = pl.plant;
      if (!p) return `<button class="gg-plot empty" data-act="go" data-to="seeds" data-plot="${pl.idx}">${potSvg(pl.skin, 2)}<b>심기</b></button>`;
      const flags = [p.ready ? `<i class="gg-flag ready">${icon("star")}</i>` : "", p.wilted ? '<i class="gg-flag wilt">시듦</i>' : p.thirsty ? `<i class="gg-flag thirsty">${icon("drop")}</i>` : "", p.bugs.length ? `<i class="gg-flag bug">${spr("bug", 2)}</i>` : "", p.weeds.length ? `<i class="gg-flag weed">${spr("weed", 2)}</i>` : ""].join("");
      return `<button class="gg-plot${p.ready ? " ready" : ""}${p.wilted ? " wilted" : ""}" data-act="go" data-to="plot" data-plot="${pl.idx}">
        <span class="gg-plant">${C.plantSvg(p.species, p.stage, { thirsty: p.thirsty, wilted: p.wilted, skin: pl.skin, staked: p.staked, scale: 2 })}</span>
        <b>${esc(p.name || p.sp.name)}</b><span class="gg-flags">${flags}</span>
      </button>`;
    }).join("");
    const done = s.today.list.filter((m) => m.done).length;
    const unopened = s.gifts.filter((g) => g.to === me() && !g.opened).length;
    return {
      title: "우리 정원",
      html: `
        <section class="gg-yard${night ? " night" : ""}">
          <div class="gg-sky"></div>
          <span class="gg-sun">${night ? PIXEL.moon(0.3, 2) : spr("sun", 2)}</span>
          <span class="gg-cloud">${spr("cloudSmall", 2)}</span>
          <span class="gg-house">${spr("house2", 2)}</span>
          <div class="gg-hill"></div>
          <div class="gg-fence" style='background-image:${PIXEL.dataUri("fence", 2)}'></div>
          <div class="gg-ground"></div>
          ${slots.join("")}
          ${pet}
          ${unopened ? `<button class="gg-mail" data-act="go" data-to="inbox">${spr("letter", 3)}<i>${unopened}</i></button>` : ""}
        </section>
        <section class="gg-level">
          <span><b>Lv.${s.level}</b> ${esc(s.levelTitle)}</span>
          ${bar("xp", ((s.xp - s.levelFrom) / Math.max(1, s.levelTo - s.levelFrom)) * 100)}
          <span class="gg-xp">${s.xp - s.levelFrom}/${s.levelTo - s.levelFrom}</span>
        </section>
        <section class="gg-plots">${cells}</section>
        <section class="gg-quick">
          <button class="gg-q" data-act="tab" data-to="missions">${icon("todo")}<span>미션 ${done}/3</span></button>
          <button class="gg-q" data-act="go" data-to="attendance">${spr("stamp", 2)}<span>${s.attendToday[me()] ? "출석 완료" : "출석"}</span></button>
          <button class="gg-q" data-act="go" data-to="kitchen">${spr("pot", 2)}<span>부엌</span></button>
          <button class="gg-q" data-act="go" data-to="storage">${icon("basket")}<span>창고</span></button>
        </section>`,
    };
  };

  SCREENS.plot = (s, p0) => {
    const pl = s.plots[p0.plot] || s.plots[0];
    const p = pl.plant;
    if (!p) return SCREENS.seeds(s, { plot: pl.idx });
    const toNext = p.next == null ? 100 : ((p.growth - p.prev) / (p.next - p.prev)) * 100;
    const c = p.counts[C.dayKey(Date.now()) + me()] || { water: 0, care: 0, sing: 0 };
    const fertToday = p.ferts[C.dayKey(Date.now())] || 0;
    const q = p.quality >= 14 ? 3 : p.quality >= 6 ? 2 : 1;
    const inv = s.inv;
    const act = (key, label, ic, extra, disabled, cls) => `<button class="btn gp-act ${cls || ""}" data-act="plant" data-do="${key}" data-plot="${pl.idx}"${disabled ? " disabled" : ""}>${ic}<span>${label}</span>${extra != null ? `<i>${extra}</i>` : ""}</button>`;
    const chips = [p.staked ? `<span class="gp-chip">${spr("stake", 1)}지지대</span>` : "", p.sprayed ? `<span class="gp-chip">${spr("spray", 1)}벌레 막는 중</span>` : "", p.tonic ? `<span class="gp-chip">${spr("bottle", 1)}영양제 효과</span>` : "", p.wilted ? '<span class="gp-chip bad">시들었어요</span>' : ""].join("");
    return {
      title: p.name || p.sp.name,
      tab: "garden",
      html: `
        <section class="gp-top">
          <div class="gp-view${p.wilted ? " wilted" : ""}" id="gpView">
            <div class="gp-sky"></div>
            ${p.name ? `<span class="gp-tag">${spr("tag", 2)}<b>${esc(p.name)}</b></span>` : ""}
            <div class="gp-plant${p.thirsty ? " thirsty" : ""}" id="gpPlant">${C.plantSvg(p.species, p.stage, { thirsty: p.thirsty, wilted: p.wilted, skin: pl.skin, staked: p.staked, scale: 5 })}</div>
            ${p.bugs.map((k, i) => `<button class="gp-bug" data-act="pest" data-kind="bug" data-slot="${k}" data-plot="${pl.idx}" style="--i:${i}">${spr("bug", 4)}</button>`).join("")}
            ${p.weeds.map((k, i) => `<button class="gp-weed" data-act="pest" data-kind="weed" data-slot="${k}" data-plot="${pl.idx}" style="--i:${i}">${spr("weed", 4)}</button>`).join("")}
            ${p.ready ? '<span class="gp-ready">다 컸어요!</span>' : ""}
            <div class="gp-fx" id="gpFx"></div>
          </div>
          <div class="gp-info">
            <p class="gp-name">${esc(p.sp.name)} <i>${G.STAGE_NAMES[p.stage]}</i></p>
            <div class="g-row">${icon("drop")}<span>물</span>${bar("water" + (p.thirsty || p.wilted ? " low" : ""), p.water)}</div>
            <div class="g-row">${icon("heart")}<span>사랑</span>${bar("love", p.love)}</div>
            <div class="g-row">${icon("leaf")}<span>성장</span>${bar("grow", toNext)}</div>
            <div class="g-row">${icon("star")}<span>품질</span><b class="gp-q q${q}">${G.QUALITY[q]}</b></div>
            <div class="gp-chips">${chips}</div>
          </div>
        </section>
        <section class="gp-acts">
          ${act("water", "물", icon("drop"), Math.max(0, 3 - c.water))}
          ${act("care", "쓰담", icon("hand"), Math.max(0, 8 - c.care))}
          ${act("sing", "노래", spr("note", 2), Math.max(0, 4 - c.sing))}
          ${p.ready ? act("harvest", "수확", icon("basket"), null, false, "primary") : act("fert", "비료", icon("sack"), inv.fert || 0, fertToday >= 2)}
          ${act("fert2", "고급", spr("fert2", 2), inv.fert2 || 0, fertToday >= 2 || p.ready)}
          ${act("tonic", "영양제", spr("bottle", 2), inv.tonic || 0)}
          ${act("spray", "살충제", spr("spray", 2), inv.spray || 0, p.sprayed)}
          ${act("stake", "지지대", spr("stake", 2), inv.stake || 0, !p.canStake)}
          ${act("prune", "다듬기", spr("scissors", 2), null, !p.canPrune)}
          ${act("snap", "사진", icon("camera"), null)}
          ${act("name", "이름", spr("tag", 2), null)}
          ${act("skin", "화분", potSvg(pl.skin, 1), null)}
        </section>
        <p class="gp-hint">${p.wilted ? "물이나 영양제로 살려 줘요." : p.thirsty ? "목말라 해요. 물을 줘요." : p.bugs.length ? "벌레를 눌러서 잡아요." : p.ready ? "수확할 때가 됐어요!" : "둘이 같은 날 돌보면 더 빨리 자라요."}</p>
        <form class="gp-name-form" id="gpNameForm" hidden data-plot="${pl.idx}"><input type="text" id="gpNameInput" maxlength="10" placeholder="이름 짓기" value="${esc(p.name)}"><button class="btn primary small" type="submit">정하기</button></form>
        <div class="gp-skins" id="gpSkins" hidden>${Object.keys(G.POTS).map((k) => `<button class="gp-skin${pl.skin === k ? " on" : ""}" data-act="skin" data-skin="${k}" data-plot="${pl.idx}"${s.ownedSkins.has(k) ? "" : " disabled"}>${potSvg(k, 2)}<b>${G.POTS[k].name}</b>${s.ownedSkins.has(k) ? "" : icon("lock")}</button>`).join("")}</div>`,
    };
  };

  SCREENS.seeds = (s, p0) => ({
    title: "씨앗 고르기",
    tab: "garden",
    html: `<p class="gm-sub">${(p0.plot || 0) + 1}번 밭에 심을 씨앗</p>
      <div class="gm-grid4">${G.ORDER.map((k) => {
        const open = s.unlockedSpecies.includes(k);
        const sp = G.SPECIES[k];
        return `<button class="gm-card${open ? "" : " locked"}" data-act="plantSeed" data-species="${k}" data-plot="${p0.plot || 0}"${open ? "" : " disabled"}>
          ${open ? C.plantSvg(k, 4, { scale: 2, pot: false }) : icon("lock", 3)}
          <b>${open ? sp.name : "???"}</b><i>${open ? `빠르기 ${sp.speed <= 0.9 ? "빠름" : sp.speed >= 1.4 ? "느림" : "보통"}` : sp.unlock === "all" ? "도감 완성" : `수확 ${sp.unlock}번`}</i>
        </button>`;
      }).join("")}</div>`,
  });

  function shopHead(active) {
    const t = [["tool", "도구"], ["decor", "꾸미기"], ["skin", "화분"], ["pet", "동물"]];
    return `<div class="gm-seg">${t.map(([k, n]) => `<button class="chip${active === k ? " active" : ""}" data-act="go" data-to="${k === "tool" ? "shop" : "shop" + k[0].toUpperCase() + k.slice(1)}" data-replace="1">${n}</button>`).join("")}</div>`;
  }
  function shopRow(key, name, desc, price, owned, disabled, extra) {
    return `<div class="gm-row">
      <span class="gm-ico">${itemIcon(key, 3)}</span>
      <span class="gm-txt"><b>${esc(name)}</b><i>${esc(desc || "")}</i></span>
      <span class="gm-own">${owned != null ? "×" + owned : ""}</span>
      <button class="btn small primary" data-act="buy" data-item="${key}" data-price="${price}" data-label="${esc(name)}"${disabled ? " disabled" : ""}>${coin(price)}</button>${extra || ""}
    </div>`;
  }
  SCREENS.shop = (s) => ({
    title: "상점 · 도구",
    tab: "shop",
    html: shopHead("tool") + `<div class="gm-list">${Object.keys(G.ITEMS).map((k) => shopRow(k, G.ITEMS[k].name, G.ITEMS[k].desc, G.ITEMS[k].price, s.inv[k] || 0, s.coins < G.ITEMS[k].price)).join("")}</div>`,
  });
  SCREENS.shopDecor = (s) => ({
    title: "상점 · 꾸미기",
    tab: "shop",
    html: shopHead("decor") + `<div class="gm-list">${G.DECOR.map((d) => shopRow("decor:" + d.id, d.name, "정원에 놓을 수 있어요", d.price, s.inv["decor:" + d.id] || 0, s.coins < d.price)).join("")}</div>`,
  });
  SCREENS.shopSkin = (s) => ({
    title: "상점 · 화분",
    tab: "shop",
    html: shopHead("skin") + `<div class="gm-list">${Object.keys(G.POTS).filter((k) => k !== "basic").map((k) => shopRow("skin:" + k, G.POTS[k].name + " 화분", "화분 화면에서 바꿔요", G.POTS[k].price, null, s.ownedSkins.has(k) || s.coins < G.POTS[k].price, s.ownedSkins.has(k) ? '<i class="gm-badge">있음</i>' : "")).join("")}</div>`,
  });
  SCREENS.shopPet = (s) => ({
    title: "상점 · 동물",
    tab: "shop",
    html: shopHead("pet") + `<div class="gm-grid2">${G.PETS.map((p) => {
      const locked = s.level < p.lv;
      const mine = s.pet && s.pet.kind === p.id;
      return `<div class="gm-card big${locked ? " locked" : ""}">
        <span class="gm-pet-ico">${spr(p.sprite, 5)}</span><b>${p.name}</b>
        ${mine ? '<i class="gm-badge">우리 친구</i>' : locked ? `<i>Lv.${p.lv}부터</i>` : `<button class="btn small primary" data-act="go" data-to="adopt" data-kind="${p.id}"${s.coins < p.price ? " disabled" : ""}>${coin(p.price)}</button>`}
      </div>`;
    }).join("")}</div><p class="gm-sub">동물 친구는 한 마리만 함께 살 수 있어요. 새로 데려오면 바뀌어요.</p>`,
  });

  SCREENS.storage = (s) => {
    const tabs = [["item", "도구"], ["produce", "수확물"], ["dish", "요리"], ["decor", "꾸미기"]];
    const keys = Object.keys(s.inv).filter((k) => (s.inv[k] || 0) > 0).filter((k) => {
      if (storeTab === "produce") return k.indexOf("pr:") === 0;
      if (storeTab === "dish") return k.indexOf("dish:") === 0;
      if (storeTab === "decor") return k.indexOf("decor:") === 0;
      return G.ITEMS[k];
    });
    return {
      title: "창고",
      tab: "more",
      html: `<div class="gm-seg">${tabs.map(([k, n]) => `<button class="chip${storeTab === k ? " active" : ""}" data-act="storeTab" data-t="${k}">${n}</button>`).join("")}</div>
        <div class="gm-grid4">${keys.map((k) => `<button class="gm-card" data-act="inspect" data-item="${k}">${itemIcon(k, 3)}<b>${esc(itemName(k))}</b><i>×${s.inv[k]}</i></button>`).join("") || '<p class="gm-empty">비어 있어요</p>'}</div>
        <div class="gm-inspect" id="gmInspect"></div>`,
    };
  };

  SCREENS.book = (s) => ({
    title: "도감",
    tab: "more",
    html: `<p class="gm-sub">모은 식물 ${s.stats.book} / ${G.ORDER.length}</p>
      <div class="gm-grid4">${G.ORDER.map((k) => {
        const b = s.book[k];
        return `<button class="gm-card${b ? "" : " unknown"}" data-act="go" data-to="species" data-species="${k}">
          ${C.plantSvg(k, 5, { scale: 2, pot: false })}<b>${b ? G.SPECIES[k].name : "???"}</b>
          <i>${b ? "×" + b.count + " " + `<span class="q q${b.best}">${G.QUALITY[b.best]}</span>` : ""}</i>
        </button>`;
      }).join("")}</div>`,
  });
  SCREENS.species = (s, p0) => {
    const k = p0.species;
    const sp = G.SPECIES[k];
    const b = s.book[k];
    const hist = s.harvested.filter((h) => h.species === k).slice(-6).reverse();
    return {
      title: b ? sp.name : "???",
      tab: "more",
      html: `<div class="gs-stages">${[0, 1, 2, 3, 4, 5].map((st) => `<div class="gs-stage${b || st < 2 ? "" : " unknown"}">${C.plantSvg(k, st, { scale: 2 })}<i>${G.STAGE_NAMES[st]}</i></div>`).join("")}</div>
        <div class="gm-facts">
          <p>${icon("basket")}수확물: ${b ? esc(sp.produce) : "???"}</p>
          <p>${icon("leaf")}자라는 속도: ${sp.speed <= 0.9 ? "빠름" : sp.speed >= 1.4 ? "느림" : "보통"}</p>
          <p>${icon("star")}최고 품질: ${b ? G.QUALITY[b.best] : "-"}</p>
          <p>${icon("lock")}여는 방법: ${sp.unlock === "all" ? "도감 완성" : sp.unlock ? `수확 ${sp.unlock}번` : "처음부터"}</p>
        </div>
        <p class="gm-sub">수확 기록</p>
        <div class="gm-list">${hist.map((h) => `<div class="gm-row"><span class="gm-ico">${C.plantSvg(k, 5, { scale: 1, pot: false })}</span><span class="gm-txt"><b>${esc(h.name || sp.name)}</b><i>${fmtTime(h.at)} · ${esc(WHO[h.who] || "")}</i></span><span class="q q${h.quality}">${G.QUALITY[h.quality]}</span></div>`).join("") || '<p class="gm-empty">아직 없어요</p>'}</div>`,
    };
  };

  SCREENS.missions = (s) => ({
    title: "미션",
    tab: "missions",
    html: `<p class="gm-sub">오늘의 미션 ${s.today.all ? `· 모두 완료 +${G.MISSION_BONUS}` : ""}</p>
      <div class="gm-list" id="gmToday">${s.today.list.map((m) => `<div class="gm-row mission${m.done ? " done" : ""}"><span class="gm-ico">${m.done ? spr("stamp", 2) : icon("star")}</span><span class="gm-txt"><b>${esc(m.title)}</b>${bar("grow", (m.value / m.target) * 100)}</span><span class="gm-own">${m.value}/${m.target}</span>${coin(m.reward)}</div>`).join("")}</div>
      <p class="gm-sub">이번 주 미션</p>
      <div class="gm-list">${s.week.map((m) => `<div class="gm-row mission${m.done ? " done" : ""}"><span class="gm-ico">${m.done ? spr("stamp", 2) : icon("calendar")}</span><span class="gm-txt"><b>${esc(m.title)}</b>${bar("love", (m.value / m.target) * 100)}</span><span class="gm-own">${m.value}/${m.target}</span>${coin(m.reward)}</div>`).join("")}</div>
      <div class="gm-links"><button class="btn" data-act="go" data-to="attendance">${spr("stamp", 2)}출석</button><button class="btn" data-act="go" data-to="achievements">${icon("trophy")}도전</button><button class="btn" data-act="go" data-to="levels">${icon("star")}레벨 길</button></div>`,
    after(s2) {
      const done = s2.today.list.filter((m) => m.done).length;
      let seen = 0;
      try { seen = Number(localStorage.getItem("hsd.mstamp." + C.dayKey(Date.now())) || 0); } catch (e) { seen = 0; }
      if (done > seen) {
        const rows = main.querySelectorAll("#gmToday .mission.done");
        if (rows[done - 1]) stampOn(rows[done - 1], "완료");
        try { localStorage.setItem("hsd.mstamp." + C.dayKey(Date.now()), String(done)); } catch (e) { /* 무시 */ }
      }
    },
  });

  SCREENS.attendance = (s) => {
    const d = new Date();
    const y = d.getFullYear(), m = d.getMonth();
    const first = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    let cells = "";
    for (let i = 0; i < first; i++) cells += '<span class="ga-cell off"></span>';
    for (let n = 1; n <= days; n++) {
      const k = `${y}-${String(m + 1).padStart(2, "0")}-${String(n).padStart(2, "0")}`;
      const a = s.attend[k] || {};
      const both = a.him && a.her;
      const one = a.him || a.her;
      cells += `<span class="ga-cell${n === d.getDate() ? " today" : ""}${both ? " both" : one ? " one" : ""}"><i>${n}</i>${both ? spr("stamp", 2) : one ? `<b class="who ${a.him ? "him" : "her"}"></b>` : ""}</span>`;
    }
    let streak = 0;
    const t = new Date(); t.setHours(12);
    while (true) { const k = C.dayKey(t.getTime()); const a = s.attend[k]; if (a && a.him && a.her) { streak++; t.setDate(t.getDate() - 1); } else break; }
    return {
      title: "출석 도장",
      tab: "missions",
      html: `<p class="gm-sub">${y}년 ${m + 1}월 · 둘 다 출석하면 하트 도장 · ${streak}일 연속</p>
        <div class="ga-week">${["일", "월", "화", "수", "목", "금", "토"].map((w) => `<i>${w}</i>`).join("")}</div>
        <div class="ga-grid">${cells}</div>
        <div class="gm-facts"><p>${coin(2)} 출석할 때마다, 둘 다 하면 ${coin(3)} 더</p><p>오늘: <span class="who him${s.attendToday.him ? "" : " dim"}">${esc(WHO.him)}</span> <span class="who her${s.attendToday.her ? "" : " dim"}">${esc(WHO.her)}</span></p></div>`,
      after(s2) {
        if (!s2.attendToday[me()]) return;
        let seen = "";
        try { seen = localStorage.getItem("hsd.astamp") || ""; } catch (e) { seen = ""; }
        const k = C.dayKey(Date.now());
        if (seen !== k) { const c = main.querySelector(".ga-cell.today"); if (c) { H.play(c, "stamp-in"); H.burstAt(c, 8, "heart"); } try { localStorage.setItem("hsd.astamp", k); } catch (e) { /* 무시 */ } }
      },
    };
  };

  SCREENS.achievements = (s) => ({
    title: "도전",
    tab: "missions",
    html: `<p class="gm-sub">${s.ach.filter((a) => a.done).length} / ${s.ach.length} 완료</p>
      <div class="gm-list">${s.ach.slice().sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0)).map((a) => `<div class="gm-row${a.done ? " done" : ""}"><span class="gm-ico">${icon(a.done ? "trophy" : "star")}</span><span class="gm-txt"><b>${esc(a.title)}</b>${bar("grow", (a.value / a.target) * 100)}</span><span class="gm-own">${a.done ? "완료" : `${a.value}/${a.target}`}</span>${coin(a.reward)}</div>`).join("")}</div>`,
  });

  SCREENS.levels = (s) => {
    const max = Math.max(15, s.level + 2);
    let rows = "";
    for (let lv = 1; lv <= max; lv++) {
      const r = G.LEVEL_REWARDS[lv];
      const got = s.claimed.has(lv);
      const reach = lv <= s.level;
      rows += `<div class="gl-node${reach ? " reach" : ""}${lv === s.level ? " now" : ""}">
        <span class="gl-dot">${lv}</span>
        <span class="gl-title">${esc(G.LEVEL_TITLES[Math.min(lv, G.LEVEL_TITLES.length - 1)])}${G.PLOT_UNLOCK.includes(lv) && lv > 1 ? ` · 밭 ${G.PLOT_UNLOCK.indexOf(lv) + 1}칸` : ""}</span>
        <span class="gl-rw">${r ? Object.keys(r).map((k) => `<span class="gl-item">${itemIcon(k, 2)}×${r[k]}</span>`).join("") : ""}</span>
        ${r ? (got ? '<i class="gm-badge">받음</i>' : reach ? `<button class="btn small primary" data-act="claim" data-level="${lv}">받기</button>` : "") : ""}
      </div>`;
    }
    return { title: "레벨 길", tab: "more", html: `<p class="gm-sub">경험치 ${s.xp} · 다음 레벨까지 ${s.levelTo - s.xp}</p><div class="gl-road">${rows}</div>`, after() { const n = main.querySelector(".gl-node.now"); if (n) n.scrollIntoView({ block: "center" }); } };
  };

  SCREENS.kitchen = (s) => ({
    title: "부엌",
    tab: "more",
    html: `<p class="gm-sub">수확물로 요리를 만들어요. 만든 요리는 같이 먹거나 선물하거나 동물 친구에게 줘요.</p>
      <div class="gm-list">${G.RECIPES.map((r) => {
        const ok = Object.keys(r.needs).every((k) => (s.inv["pr:" + k] || 0) >= r.needs[k]);
        const known = Object.keys(r.needs).every((k) => s.book[k]);
        return `<div class="gm-row${ok ? "" : " dim"}">
          <span class="gm-ico">${known ? spr(r.sprite, 3) : icon("quest", 3)}</span>
          <span class="gm-txt"><b>${known ? esc(r.name) : "???"}</b><i class="gk-needs">${Object.keys(r.needs).map((k) => `<span class="${(s.inv["pr:" + k] || 0) >= r.needs[k] ? "have" : ""}">${C.plantSvg(k, 5, { scale: 1, pot: false })}${known ? esc(G.SPECIES[k].produce) : "?"} ${s.inv["pr:" + k] || 0}/${r.needs[k]}</span>`).join("")}</i></span>
          <button class="btn small primary" data-act="cook" data-recipe="${r.id}"${ok ? "" : " disabled"}>요리</button>
        </div>`;
      }).join("")}</div>
      <div class="gm-links"><button class="btn" data-act="go" data-to="dishes">${spr("cookie", 2)}요리 상자</button></div>`,
  });
  SCREENS.cooking = (s, p0) => {
    const r = G.RECIPES.find((x) => x.id === p0.recipe);
    return {
      title: "요리 중",
      tab: "more",
      html: `<div class="gc-stage">
          <div class="gc-ings">${Object.keys(r.needs).map((k, i) => `<span class="gc-ing" style="--i:${i}">${C.plantSvg(k, 5, { scale: 2, pot: false })}</span>`).join("")}</div>
          <div class="gc-pot">${spr("pot", 6)}<i class="gc-bub"></i><i class="gc-bub b2"></i><i class="gc-bub b3"></i></div>
          <div class="gc-steam"><i></i><i></i><i></i></div>
          <div class="gc-dish" id="gcDish">${spr(r.sprite, 6)}<b>${esc(r.name)}</b></div>
        </div>
        <p class="gm-sub gc-msg" id="gcMsg">보글보글…</p>
        <div class="gm-links" id="gcBtns" hidden><button class="btn primary" data-act="go" data-to="dishes" data-replace="1">요리 상자 보기</button><button class="btn" data-act="back">부엌으로</button></div>`,
      after() {
        setTimeout(() => { const d = $("gcDish"); if (d) { d.classList.add("show"); H.burstAt(d, 16); $("gcMsg").textContent = `${r.name} 완성! 경험치 +${r.xp}`; $("gcBtns").hidden = false; } }, 2200);
      },
    };
  };
  SCREENS.dishes = (s) => {
    const keys = Object.keys(s.inv).filter((k) => k.indexOf("dish:") === 0 && s.inv[k] > 0);
    return {
      title: "요리 상자",
      tab: "more",
      html: `<div class="gm-list">${keys.map((k) => `<div class="gm-row"><span class="gm-ico">${itemIcon(k, 3)}</span><span class="gm-txt"><b>${esc(itemName(k))}</b><i>×${s.inv[k]}</i></span>
          <button class="btn small primary" data-act="eat" data-item="${k}">같이 먹기</button>
          <button class="btn small" data-act="go" data-to="gift" data-item="${k}">선물</button>
          ${s.pet ? `<button class="btn small" data-act="petfeed" data-item="${k}">${spr(s.pet.def.sprite, 1)}</button>` : ""}
        </div>`).join("") || '<p class="gm-empty">부엌에서 요리를 만들어 봐요</p>'}</div><div class="gm-eat" id="gmEat"></div>`,
    };
  };

  SCREENS.gift = (s, p0) => {
    const keys = Object.keys(s.inv).filter((k) => s.inv[k] > 0 && (k.indexOf("dish:") === 0 || k.indexOf("pr:") === 0 || k.indexOf("decor:") === 0));
    const sel = p0.item && s.inv[p0.item] > 0 ? p0.item : keys[0];
    return {
      title: "선물 보내기",
      tab: "more",
      html: `<p class="gm-sub">${esc(WHO[other()])}에게 보낼 선물</p>
        <div class="gm-grid4 gf-pick">${keys.map((k) => `<button class="gm-card${k === sel ? " on" : ""}" data-act="giftPick" data-item="${k}">${itemIcon(k, 3)}<b>${esc(itemName(k))}</b><i>×${s.inv[k]}</i></button>`).join("") || '<p class="gm-empty">보낼 수 있는 게 없어요. 수확하거나 요리해 봐요.</p>'}</div>
        ${keys.length ? `<form class="gf-form" id="gfForm" data-item="${sel}"><textarea id="gfMsg" rows="2" maxlength="80" placeholder="같이 보낼 말"></textarea><button class="btn primary" type="submit">${spr("gift", 2)}보내기</button></form>` : ""}
        <div class="gf-wrap" id="gfWrap"></div>`,
    };
  };
  SCREENS.inbox = (s) => {
    const mine = s.gifts.filter((g) => g.to === me());
    const sent = s.gifts.filter((g) => g.from === me());
    return {
      title: "선물함",
      tab: "more",
      html: `<p class="gm-sub">받은 선물</p>
        <div class="gm-list">${mine.map((g) => `<div class="gm-row${g.opened ? "" : " new"}"><span class="gm-ico">${g.opened ? itemIcon(g.item, 3) : spr("gift", 3)}</span><span class="gm-txt"><b>${g.opened ? esc(itemName(g.item)) : "포장된 선물"}</b><i>${esc(WHO[g.from] || "")} · ${fmtTime(g.at)}</i></span>${g.opened ? "" : `<button class="btn small primary" data-act="go" data-to="giftOpen" data-gift="${g.id}">열기</button>`}</div>`).join("") || '<p class="gm-empty">아직 받은 선물이 없어요</p>'}</div>
        <p class="gm-sub">보낸 선물</p>
        <div class="gm-list">${sent.map((g) => `<div class="gm-row"><span class="gm-ico">${itemIcon(g.item, 3)}</span><span class="gm-txt"><b>${esc(itemName(g.item))}</b><i>${fmtTime(g.at)} · ${g.opened ? "열어 봤어요" : "아직 안 열었어요"}</i></span></div>`).join("") || '<p class="gm-empty">보낸 선물이 없어요</p>'}</div>
        <div class="gm-links"><button class="btn primary" data-act="go" data-to="gift">${spr("gift", 2)}선물 보내기</button><button class="btn" data-act="go" data-to="shelf">${icon("trophy")}진열장</button></div>`,
    };
  };
  SCREENS.giftOpen = (s, p0) => {
    const g = s.gifts.find((x) => x.id === p0.gift);
    if (!g) return SCREENS.inbox(s);
    return {
      title: "선물 열기",
      tab: "more",
      html: `<div class="go-stage" id="goStage">
          <button class="go-box" id="goBox" data-act="openGift" data-gift="${g.id}">${spr("gift", 10)}<i>눌러서 열기</i></button>
          <div class="go-item" id="goItem">${itemIcon(g.item, 6)}<b>${esc(itemName(g.item))}</b></div>
          <div class="go-letter" id="goLetter">${spr("letter", 3)}<p>${esc(g.msg || "사랑해")}</p><i>${esc(WHO[g.from] || "")}가</i></div>
        </div>
        <div class="gm-links" id="goBtns" hidden><button class="btn primary" data-act="go" data-to="shelf" data-replace="1">진열장에 놓기</button><button class="btn" data-act="back">닫기</button></div>`,
    };
  };
  SCREENS.shelf = (s) => {
    const opened = s.gifts.filter((g) => g.opened);
    return {
      title: "선물 진열장",
      tab: "more",
      html: `<p class="gm-sub">주고받은 선물이 여기에 남아요</p>
        <div class="gsh-shelf">${opened.map((g, i) => `<div class="gsh-item" style="--i:${i}" title="${esc(g.msg)}">${itemIcon(g.item, 3)}<i class="who ${g.from}"></i></div>`).join("") || '<p class="gm-empty">아직 비어 있어요</p>'}</div>`,
    };
  };

  SCREENS.decorate = (s, p0) => {
    const slot = p0.slot == null ? 0 : Number(p0.slot);
    const placed = {};
    Object.values(s.decorSlots).forEach((id) => { if (id) placed[id] = (placed[id] || 0) + 1; });
    const cur = s.decorSlots[slot];
    const owned = G.DECOR.filter((d) => (s.inv["decor:" + d.id] || 0) > 0);
    return {
      title: "정원 꾸미기",
      tab: "garden",
      html: `<p class="gm-sub">${slot + 1}번 자리에 놓을 것</p>
        <div class="gm-seg">${Array.from({ length: G.DECOR_SLOTS }, (_, i) => `<button class="chip${i === slot ? " active" : ""}" data-act="go" data-to="decorate" data-slot="${i}" data-replace="1">${i + 1}</button>`).join("")}</div>
        <div class="gm-grid4">${owned.map((d) => {
          const free = (s.inv["decor:" + d.id] || 0) - (placed[d.id] || 0) + (cur === d.id ? 1 : 0);
          return `<button class="gm-card${cur === d.id ? " on" : ""}" data-act="place" data-slot="${slot}" data-item="${d.id}"${free > 0 ? "" : " disabled"}>${spr(d.sprite, 3)}<b>${d.name}</b><i>${cur === d.id ? "놓여 있음" : "남은 " + Math.max(0, free)}</i></button>`;
        }).join("") || '<p class="gm-empty">상점에서 꾸미기를 사 와요</p>'}</div>
        <div class="gm-links">${cur ? `<button class="btn" data-act="place" data-slot="${slot}" data-item="">치우기</button>` : ""}<button class="btn primary" data-act="go" data-to="shopDecor">${icon("coin")}꾸미기 사러 가기</button></div>`,
    };
  };

  SCREENS.pet = (s) => {
    const p = s.pet;
    if (!p) return {
      title: "동물 친구",
      tab: "more",
      html: `<p class="gm-sub">함께 정원을 지킬 동물 친구를 데려와요</p><div class="gm-grid2">${G.PETS.map((x) => `<div class="gm-card big${s.level < x.lv ? " locked" : ""}"><span class="gm-pet-ico">${spr(x.sprite, 5)}</span><b>${x.name}</b>${s.level < x.lv ? `<i>Lv.${x.lv}부터</i>` : `<button class="btn small primary" data-act="go" data-to="adopt" data-kind="${x.id}"${s.coins < x.price ? " disabled" : ""}>${coin(x.price)}</button>`}</div>`).join("")}</div>`,
    };
    return {
      title: p.name || p.def.name,
      tab: "more",
      html: `<div class="gpet-stage" id="gpetStage">
          <div class="gpet-room"></div>
          <button class="gpet" id="gpet" data-act="petpat">${spr(p.def.sprite, 7)}</button>
          ${p.hunger < 30 ? '<span class="gpet-say">배고파…</span>' : p.happy > 70 ? '<span class="gpet-say">행복해!</span>' : ""}
          <div class="gp-fx" id="gpFx"></div>
        </div>
        <div class="gpet-info">
          <p><b>Lv.${p.level}</b> ${esc(p.def.name)} ${bar("xp", ((p.xp - p.lvFrom) / 30) * 100)}</p>
          <div class="g-row">${spr("bowlPet", 1)}<span>배</span>${bar("water" + (p.hunger < 30 ? " low" : ""), p.hunger)}</div>
          <div class="g-row">${icon("heart")}<span>기분</span>${bar("love", p.happy)}</div>
        </div>
        <section class="gp-acts">
          <button class="btn gp-act" data-act="petfeed" data-item="petfood">${spr("bowlPet", 2)}<span>간식</span><i>${s.inv.petfood || 0}</i></button>
          <button class="btn gp-act" data-act="petplay">${spr("ball", 3)}<span>공놀이</span></button>
          <button class="btn gp-act" data-act="petpat">${icon("hand")}<span>쓰다듬기</span></button>
          <button class="btn gp-act" data-act="go" data-to="dishes">${spr("cookie", 2)}<span>요리 주기</span></button>
        </section>`,
    };
  };
  SCREENS.adopt = (s, p0) => {
    const x = G.PETS.find((k) => k.id === p0.kind) || G.PETS[0];
    return {
      title: x.name + " 데려오기",
      tab: "more",
      html: `<div class="gad-stage">${spr(x.sprite, 8)}</div>
        <form class="gp-name-form" id="adoptForm" data-kind="${x.id}" data-price="${x.price}"><input type="text" id="adoptName" maxlength="8" placeholder="이름" required><button class="btn primary" type="submit">${coin(x.price)} 데려오기</button></form>
        ${s.pet ? `<p class="gm-sub">지금 함께 사는 ${esc(s.pet.name || s.pet.def.name)}는 떠나요.</p>` : ""}`,
    };
  };

  SCREENS.play = (s) => ({
    title: "놀이터",
    tab: "play",
    html: `<p class="gm-sub">놀이마다 하루 첫 판은 점수만큼 코인을 받아요</p>
      <div class="gm-list">${G.MINIGAMES.map((m) => {
        const r = s.minis[m.id] || { best: 0, counted: {} };
        const todayDone = r.counted && r.counted[C.dayKey(Date.now()) + me()];
        return `<button class="gm-row gm-game" data-act="go" data-to="mini" data-game="${m.id}"><span class="gm-ico">${spr({ catch: "basketBig", whack: "bug", rhythm: "can", memory: "emoQ" }[m.id], 3)}</span><span class="gm-txt"><b>${m.name}</b><i>${esc(m.desc)}</i></span><span class="gm-own">최고 ${r.best}</span><i class="gm-badge${todayDone ? " dim" : ""}">${todayDone ? "오늘 받음" : "코인"}</i></button>`;
      }).join("")}</div>`,
  });
  SCREENS.mini = (s, p0) => {
    const m = G.MINIGAMES.find((x) => x.id === p0.game) || G.MINIGAMES[0];
    return {
      title: m.name,
      tab: "play",
      html: `<div class="mg-root" id="mgRoot"><div class="mg-ready"><p>${esc(m.desc)}</p><button class="btn primary" data-act="startMini" data-game="${m.id}">시작</button></div></div>`,
    };
  };

  SCREENS.forecast = (s) => ({
    title: "날씨 예보",
    tab: "more",
    html: `<div class="gw-now" id="gwNow"></div><div class="gw-days" id="gwDays"><p class="gm-empty">불러오는 중…</p></div>
      <div class="gm-facts"><p>${icon("wrain")}비가 오면 정원에 저절로 물이 줘져요.</p><p>${icon("wsun")}날씨는 홈 풍경에도 그대로 보여요.</p></div>`,
    after() { loadForecast(); },
  });
  SCREENS.log = (s) => ({
    title: "정원 일지",
    tab: "more",
    html: `<div class="gm-list">${s.log.map((l) => `<div class="gm-row log"><span class="who ${l.who === "sky" ? "" : l.who}">${l.who === "sky" ? "하늘" : esc(WHO[l.who] || "")}</span><span class="gm-txt"><b>${esc(l.text)}</b><i>${fmtTime(l.at)}</i></span></div>`).join("") || '<p class="gm-empty">아직 기록이 없어요</p>'}</div>`,
  });
  SCREENS.album = (s) => ({
    title: "정원 사진첩",
    tab: "more",
    html: `<div class="gal-grid">${s.snaps.map((p, i) => `<div class="gal-photo" style="--r:${(i % 5) - 2}deg"><div class="gal-pic">${C.plantSvg(p.species, p.stage, { scale: 3, skin: p.skin })}</div><b>${esc(p.name || G.SPECIES[p.species].name)}</b><i>${fmtTime(p.at)} · ${esc(WHO[p.who] || "")}</i></div>`).join("") || '<p class="gm-empty">화분 화면에서 사진을 찍어 봐요</p>'}</div>`,
  });
  SCREENS.more = (s) => {
    const unopened = s.gifts.filter((g) => g.to === me() && !g.opened).length;
    const claimable = Object.keys(G.LEVEL_REWARDS).filter((lv) => Number(lv) <= s.level && !s.claimed.has(Number(lv))).length;
    const items = [
      ["storage", icon("basket", 3), "창고"], ["book", icon("book", 3), "도감"], ["kitchen", spr("pot", 2), "부엌"], ["dishes", spr("cookie", 2), "요리 상자"],
      ["inbox", spr("letter", 2), "선물함", unopened], ["gift", spr("gift", 2), "선물 보내기"], ["shelf", icon("trophy", 3), "진열장"], ["decorate", spr("bench", 1), "꾸미기"],
      ["pet", spr(s.pet ? s.pet.def.sprite : "petDog", 2), "동물 친구"], ["levels", icon("star", 3), "레벨 길", claimable], ["achievements", icon("trophy", 3), "도전"], ["attendance", spr("stamp", 2), "출석"],
      ["forecast", icon("wsun", 3), "날씨 예보"], ["log", icon("todo", 3), "정원 일지"], ["album", icon("camera", 3), "사진첩"], ["help", icon("quest", 3), "도움말"],
    ];
    return {
      title: "더보기",
      tab: "more",
      html: `<div class="gm-grid4 gm-menu">${items.map(([k, ic, n, badge]) => `<button class="gm-card" data-act="go" data-to="${k}">${ic}<b>${n}</b>${badge ? `<i class="gm-dot">${badge}</i>` : ""}</button>`).join("")}</div>`,
    };
  };
  SCREENS.help = () => ({
    title: "도움말",
    tab: "more",
    html: `<div class="gm-help">
      <p><b>키우기</b> 물은 하루 3번, 쓰다듬기 8번, 노래 4번까지 효과가 있어요. 둘이 같은 날 돌보면 보너스.</p>
      <p><b>시듦</b> 물을 이틀 넘게 못 받으면 시들어요. 물이나 영양제로 살려요. 시든 적이 있으면 품질이 내려가요.</p>
      <p><b>품질</b> 같이 돌본 날, 벌레와 잡초 치우기, 쓰다듬기, 지지대, 다듬기가 품질을 올려요. 금빛이면 수확물 3개.</p>
      <p><b>밭</b> 커플 레벨이 오르면 밭이 9칸까지 열려요.</p>
      <p><b>코인</b> 기록, 일기, 질문, 하트, 출석, 미션, 수확, 놀이, 선물로 모여요.</p>
      <p><b>요리</b> 수확물로 요리를 만들고 같이 먹거나 선물하거나 동물 친구에게 줘요.</p>
      <p><b>선물</b> 상대 폰의 선물함에 포장된 상자로 도착해요. 열면 진열장에 남아요.</p>
    </div>`,
  });

  // ---------- 날씨 예보 ----------
  async function loadForecast() {
    const box = $("gwDays");
    if (!box) return;
    let loc;
    try { loc = JSON.parse(localStorage.getItem("hsd.loc") || "null"); } catch (e) { loc = null; }
    loc = loc || { lat: 37.5665, lon: 126.978, place: "서울" };
    const w = window.Scene ? Scene.weather() : null;
    if (w && $("gwNow")) $("gwNow").innerHTML = `${icon({ clear: "wsun", partly: "wcloud", cloudy: "wcloud", fog: "wfog", drizzle: "wrain", rain: "wrain", heavy: "wrain", snow: "wsnow", heavysnow: "wsnow", thunder: "wthunder" }[w.kind] || "wsun", 5)}<b>${w.temp == null ? "" : Math.round(w.temp) + "°"}</b><i>${esc(loc.place || "지금 있는 곳")}</i>`;
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat.toFixed(3)}&longitude=${loc.lon.toFixed(3)}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=4`;
      const res = await fetch(url, { cache: "no-store" });
      const j = await res.json();
      const d = j.daily;
      const kind = (c) => (c <= 1 ? "wsun" : c <= 3 ? "wcloud" : c <= 48 ? "wfog" : c >= 95 ? "wthunder" : (c >= 71 && c <= 77) || c >= 85 ? "wsnow" : "wrain");
      const names = ["오늘", "내일", "모레", "글피"];
      if ($("gwDays")) $("gwDays").innerHTML = d.time.map((t, i) => `<div class="gw-day" style="--i:${i}"><b>${names[i]}</b>${icon(kind(d.weather_code[i]), 4)}<span>${Math.round(d.temperature_2m_max[i])}° / ${Math.round(d.temperature_2m_min[i])}°</span><i>비 ${d.precipitation_probability_max[i] == null ? "-" : d.precipitation_probability_max[i] + "%"}</i></div>`).join("");
    } catch (e) {
      if ($("gwDays")) $("gwDays").innerHTML = '<p class="gm-empty">인터넷이 없어서 예보를 못 불러왔어요</p>';
    }
  }

  // ---------- 누르기 ----------
  function onClick(ev) {
    const t = ev.target.closest("[data-act]");
    if (!t || t.disabled || !root.contains(t)) return;
    const d = t.dataset;
    const A = ACTIONS[d.act];
    if (A) A(t, d, ev);
  }
  function onSubmit(ev) {
    ev.preventDefault();
    const f = ev.target;
    if (f.id === "gpNameForm") {
      const s = S();
      const p = s.plots[Number(f.dataset.plot)].plant;
      if (!p) return;
      const name = $("gpNameInput").value.trim();
      add({ id: "name-" + p.id, type: "name", plant: p.id, name });
      refresh();
      setTimeout(() => { const tg = root.querySelector(".gp-tag"); if (tg) H.play(tg, "tag-in"); }, 30);
      H.toast(name ? `이름을 ${name}(으)로 지었어요` : "이름을 지웠어요");
    }
    if (f.id === "gfForm") {
      const item = f.dataset.item;
      const msg = $("gfMsg").value.trim();
      if (!me()) { H.toast("먼저 누구 폰인지 골라 줘요"); return; }
      const wrap = $("gfWrap");
      wrap.innerHTML = `<span class="gf-box">${itemIcon(item, 4)}</span>`;
      setTimeout(() => { wrap.innerHTML = `<span class="gf-box wrapped">${spr("gift", 6)}</span>`; }, 600);
      add({ id: "gift" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), type: "gift", item, to: other(), msg });
      setTimeout(() => { H.toast(`${WHO[other()]}에게 선물을 보냈어요`); H.burstAt(wrap, 10, "heart"); tab("garden"); }, 1500);
    }
    if (f.id === "adoptForm") {
      const s = S();
      const price = Number(f.dataset.price);
      if (s.coins < price) { H.toast("코인이 모자라요"); return; }
      const name = $("adoptName").value.trim() || (G.PETS.find((x) => x.id === f.dataset.kind) || {}).name;
      add({ type: "buy", item: "pet:" + f.dataset.kind, cost: price, label: name });
      add({ id: "pet", type: "adopt", kind: f.dataset.kind, name });
      banner(`${name} 데려왔어요!`, "lv");
      stack.length = 0; stack.push({ screen: "pet", params: {} });
      render("fwd");
      H.burst(window.innerWidth / 2, 220, 16, "heart");
    }
  }

  const ACTIONS = {
    back: () => back(),
    tab: (t, d) => tab(d.to),
    go: (t, d) => {
      const params = Object.assign({}, d);
      delete params.act; delete params.to;
      if (d.replace) stack.pop();
      go(d.to, params);
    },
    lockedPlot: (t, d) => { H.play(t, "shake-x"); H.toast(`Lv.${G.PLOT_UNLOCK[d.plot]}에 열려요`); },
    storeTab: (t, d) => { storeTab = d.t; render("tab"); },
    inspect: (t, d) => {
      const box = $("gmInspect");
      const k = d.item;
      const it = G.ITEMS[k];
      box.innerHTML = `<div class="gm-row big">${itemIcon(k, 4)}<span class="gm-txt"><b>${esc(itemName(k))}</b><i>${esc(it ? it.desc : k.indexOf("pr:") === 0 ? "부엌에서 요리에 써요" : k.indexOf("dish:") === 0 ? "같이 먹거나 선물해요" : "정원에 놓아요")}</i></span></div>`;
      H.play(box, "pop-in");
    },
    giftPick: (t, d) => {
      root.querySelectorAll(".gf-pick .gm-card").forEach((c) => c.classList.toggle("on", c === t));
      const f = $("gfForm");
      if (f) f.dataset.item = d.item;
      H.play(t, "boing");
    },
    buy: (t, d) => {
      const s = S();
      const price = Number(d.price);
      if (s.coins < price) { H.toast("코인이 모자라요"); H.play($("gmCoins"), "shake-x"); return; }
      add({ type: "buy", item: d.item, cost: price, qty: 1, label: d.label });
      fly($("gmCoins"), t, `${icon("coin", 2)}`, 4);
      setTimeout(() => { H.play(t.closest(".gm-row") || t, "bought"); render("tab"); H.toast(`${d.label} 샀어요`); }, 450);
    },
    claim: (t, d) => {
      add({ id: "lv-" + d.level, type: "claim", level: Number(d.level) });
      const row = t.closest(".gl-node");
      H.burstAt(t, 14);
      if (row) row.querySelectorAll(".gl-item").forEach((it) => fly(it, $("gmCoins"), it.innerHTML, 1));
      setTimeout(() => { render("tab"); H.toast(`레벨 ${d.level} 선물을 받았어요`); }, 600);
    },
    plantSeed: (t, d) => {
      const s = S();
      const pl = s.plots[Number(d.plot)];
      if (!pl || pl.plant || !pl.unlocked) return;
      t.classList.add("chosen");
      add({ id: "seed-" + pl.nextId, type: "seed", plot: pl.idx, plant: pl.nextId, species: d.species });
      stack.pop();
      go("plot", { plot: String(pl.idx) });
      setTimeout(() => {
        inView("gp-seedbag", spr("seedBag", 5), 1200);
        rainIn("seed", 3, 10);
        setTimeout(() => { const p = plantEl(); if (p) H.play(p, "sprout"); floatTxt("심었어요!"); }, 700);
      }, 60);
      H.toast(`${G.SPECIES[d.species].name} 씨앗을 심었어요`);
    },
    pest: (t, d) => {
      const s = S();
      const p = s.plots[Number(d.plot)].plant;
      if (!p) return;
      const slot = Number(d.slot);
      add({ id: `${d.kind}-${p.id}-${slot}`, type: d.kind, plant: p.id, slot });
      t.classList.add(d.kind === "bug" ? "squash" : "pull");
      H.burstAt(t, 6);
      fly(t, $("gmCoins"), icon("coin", 2), 2);
      setTimeout(() => { refresh(); floatTxt(d.kind === "bug" ? "+3" : "+2"); }, 350);
    },
    plant: (t, d) => plantAction(t, d),
    skin: (t, d) => {
      const s = S();
      if (!s.ownedSkins.has(d.skin)) return;
      add({ id: "skin-" + d.plot, type: "skin", plot: Number(d.plot), item: d.skin });
      refresh();
      setTimeout(() => { const p = plantEl(); if (p) H.play(p, "pot-spin"); }, 30);
    },
    place: (t, d) => {
      add({ id: "decor-" + d.slot, type: "decor", slot: Number(d.slot), item: d.item || "" });
      H.toast(d.item ? "놓았어요" : "치웠어요");
      stack.length = 0; stack.push({ screen: "garden", params: {} });
      render("back");
      setTimeout(() => { const sl = root.querySelector(`.gg-slot[data-slot="${d.slot}"]`); if (sl) { H.play(sl, "drop-in"); H.burstAt(sl, 8); } }, 40);
    },
    cook: (t, d) => {
      add({ type: "cook", recipe: d.recipe });
      go("cooking", { recipe: d.recipe });
    },
    eat: (t, d) => {
      add({ type: "eat", item: d.item });
      const box = $("gmEat");
      if (box) {
        box.innerHTML = `<div class="ge-scene"><span class="ge-him">${spr("him", 4)}</span><span class="ge-dish">${itemIcon(d.item, 4)}</span><span class="ge-her">${spr("her", 4)}</span></div>`;
        H.play(box, "pop-in");
        setTimeout(() => { H.burstAt(box, 14, "heart"); }, 700);
      }
      setTimeout(() => { render("tab"); H.toast("같이 맛있게 먹었어요 +5"); }, 1600);
    },
    openGift: (t, d) => {
      if (t.classList.contains("opening")) return;
      t.classList.add("opening");
      setTimeout(() => {
        add({ id: "open-" + d.gift, type: "open", gift: d.gift });
        t.classList.add("opened");
        $("goItem").classList.add("show");
        H.burstAt($("goItem"), 18);
        H.burstAt($("goItem"), 10, "heart");
        setTimeout(() => { $("goLetter").classList.add("show"); $("goBtns").hidden = false; }, 700);
      }, 900);
    },
    petfeed: (t, d) => {
      const s = S();
      if (!s.pet) return;
      if ((s.inv[d.item] || 0) <= 0) { H.toast("간식이 없어요. 상점에서 사 와요"); return; }
      add({ type: "petfeed", item: d.item });
      if (stack[stack.length - 1].screen !== "pet") { H.toast("동물 친구가 맛있게 먹었어요"); render("tab"); return; }
      inView("gpet-bowl", spr("bowlPet", 4), 1600);
      setTimeout(() => { const pet = $("gpet"); if (pet) H.play(pet, "munch"); floatTxt("냠냠"); }, 400);
      setTimeout(() => refresh(), 1500);
    },
    petplay: () => {
      add({ type: "petplay" });
      inView("gpet-ball", spr("ball", 4), 1600);
      setTimeout(() => { const pet = $("gpet"); if (pet) H.play(pet, "pet-jump"); }, 500);
      setTimeout(() => refresh(), 1500);
    },
    petpat: () => {
      add({ type: "petpat" });
      const pet = $("gpet");
      if (pet) { H.play(pet, "squish"); H.burstAt(pet, 6, "heart"); }
      setTimeout(() => refresh(), 900);
    },
    startMini: (t, d) => {
      const box = $("mgRoot");
      const game = d.game;
      const before = S();
      const fn = window.GameMini[game];
      stopMini = fn(box, (score) => {
        stopMini = null;
        add({ type: "mini", game, score });
        const after = S();
        const gain = after.coins - before.coins;
        const best = (after.minis[game] || {}).best || score;
        box.innerHTML += `<div class="mg-result"><b>${score}점</b><p>최고 ${best}점${score >= best && score > 0 ? " · 새 기록!" : ""}</p><p>${gain > 0 ? `코인 +${gain}` : "오늘 코인은 이미 받았어요"}</p><div class="gm-links"><button class="btn primary" data-act="go" data-to="mini" data-game="${game}" data-replace="1">한 판 더</button><button class="btn" data-act="tab" data-to="play">놀이터</button></div></div>`;
        if (score >= best && score > 0) H.burst(window.innerWidth / 2, 240, 18);
      });
    },
  };

  // 화분 화면의 행동들
  function plantAction(t, d) {
    if (busy) return;
    const s = S();
    const plot = Number(d.plot);
    const p = s.plots[plot].plant;
    if (!p) return;
    const kind = d.do;
    const before = p.growth;
    const stageBefore = p.stage;
    const lvBefore = s.level;
    const need = { fert: "fert", fert2: "fert2", tonic: "tonic", spray: "spray", stake: "stake" }[kind];
    if (need && (s.inv[need] || 0) <= 0) { H.toast(`${G.ITEMS[need].name}가 없어요. 상점으로 가요`); go("shop"); return; }
    if (kind === "name") { const f = $("gpNameForm"); f.hidden = !f.hidden; if (!f.hidden) $("gpNameInput").focus(); return; }
    if (kind === "skin") { const k = $("gpSkins"); k.hidden = !k.hidden; if (!k.hidden) H.play(k, "pop-in"); return; }
    H.play(t, "boing");
    const pe = plantEl();
    let wait = 900;
    if (kind === "water") {
      inView("gp-can", spr("can", 4), 1100);
      rainIn("drop", 9, 26);
      setTimeout(() => { const v = $("gpView"); if (v) H.play(v, "wet"); }, 500);
    } else if (kind === "care") {
      inView("gp-hand", icon("hand", 4), 900);
      if (pe) H.play(pe, "wiggle");
      H.burstAt(pe || t, 6, "heart");
    } else if (kind === "sing") {
      for (let i = 0; i < 5; i++) setTimeout(() => inView("gp-note n" + (i % 3), spr("note", 3), 1600), i * 160);
      if (pe) H.play(pe, "sway");
      wait = 1200;
    } else if (kind === "fert") {
      inView("gp-sack", icon("sack", 5), 1000);
      rainIn("grain", 12, 30);
      H.burstAt(pe || t, 8);
    } else if (kind === "fert2") {
      inView("gp-sack", spr("fert2", 4), 1000);
      rainIn("glitter", 16, 40);
      setTimeout(() => { if (pe) H.play(pe, "glow"); }, 400);
    } else if (kind === "tonic") {
      inView("gp-bottle", spr("bottle", 5), 1200);
      rainIn("tonic", 6, 12);
      setTimeout(() => { if (pe) H.play(pe, "perk"); }, 700);
      wait = 1100;
    } else if (kind === "spray") {
      inView("gp-spray", spr("spray", 5), 1200);
      for (let i = 0; i < 6; i++) setTimeout(() => inView("gp-mist", "", 900), i * 90);
      root.querySelectorAll(".gp-bug").forEach((b) => b.classList.add("flee"));
      wait = 1100;
    } else if (kind === "stake") {
      inView("gp-stake", spr("stake", 5), 1200);
      setTimeout(() => inView("gp-hammer", spr("hammer", 4), 700), 400);
      setTimeout(() => { const v = $("gpView"); if (v) H.play(v, "thud"); }, 800);
      wait = 1200;
    } else if (kind === "prune") {
      inView("gp-scissors", spr("scissors", 4), 1000);
      setTimeout(() => rainIn("leafbit", 6, 30), 400);
      wait = 1000;
    } else if (kind === "snap") {
      const v = $("gpView");
      const fl = document.createElement("span");
      fl.className = "gp-flash";
      v.appendChild(fl);
      setTimeout(() => fl.remove(), 600);
      const pol = document.createElement("span");
      pol.className = "gp-polaroid";
      pol.innerHTML = C.plantSvg(p.species, p.stage, { scale: 2, skin: s.plots[plot].skin });
      v.appendChild(pol);
      setTimeout(() => pol.remove(), 1700);
      add({ id: "snap" + Date.now().toString(36), type: "snap", plant: p.id, species: p.species, stage: p.stage, skin: s.plots[plot].skin, name: p.name, plot });
      H.toast("사진첩에 담았어요");
      return;
    } else if (kind === "harvest") {
      if (pe) H.play(pe, "harvest");
      add({ id: "harvest-" + p.id, type: "harvest", plant: p.id });
      const after = S();
      const h = after.harvested[after.harvested.length - 1];
      busy = true;
      setTimeout(() => {
        for (let i = 0; i < h.quality; i++) inView("gp-produce p" + i, C.plantSvg(p.species, 5, { scale: 2, pot: false }), 1500);
        H.burstAt($("gpView"), 22);
        H.burstAt($("gpView"), 10, "heart");
        banner(`${G.QUALITY[h.quality]} ${p.sp.name} 수확! +${20 + (h.quality === 3 ? 20 : h.quality === 2 ? 10 : 0)}`, h.quality === 3 ? "gold" : "lv");
      }, 600);
      setTimeout(() => { busy = false; stack.pop(); go("seeds", { plot: String(plot) }); }, 2300);
      return;
    }
    add({ type: kind, plant: p.id });
    const after = S();
    const p2 = after.plots[plot].plant;
    const gain = p2 ? p2.growth - before : 0;
    busy = true;
    setTimeout(() => {
      busy = false;
      refresh();
      const pe2 = plantEl();
      if (p2 && p2.stage > stageBefore) {
        if (pe2) H.play(pe2, "stage-up");
        H.burstAt(pe2 || $("gpView"), 18);
        banner(`쑥! ${G.STAGE_NAMES[p2.stage]}이 됐어요`, "grow");
        floatTxt("쑥!", "big");
      } else {
        floatTxt(gain > 0 ? `+${gain}` : { water: "오늘은 충분해요", care: "좋아해요", sing: "콧노래~", tonic: "생기가 돌아요", spray: "벌레야 가라", prune: "깔끔!" }[kind] || "고마워", gain > 0 ? "" : "soft");
      }
      if (after.level > lvBefore) setTimeout(() => H.burst(window.innerWidth / 2, 120, 20), 300);
    }, wait);
  }

  window.Garden = {
    bind(helpers) {
      H = helpers;
      ensureRoot();
      ensureSeed();
      document.addEventListener("keydown", (e) => { if (e.key === "Escape" && root && !root.hidden) back(); });
    },
    open,
    close,
    isOpen() { return !!root && !root.hidden; },
    compute: S,
    render() { if (root && !root.hidden && !busy && !stopMini) render("tab"); },
    plantSvg: C.plantSvg,
    // 홈 풍경에 놓을 화분들 (앞의 세 칸)
    sceneSvgs() {
      const s = S();
      return s.plots.slice(0, 3).filter((pl) => pl.unlocked).map((pl) => {
        const p = pl.plant;
        return {
          plot: pl.idx,
          html: p ? C.plantSvg(p.species, p.stage, { thirsty: p.thirsty, wilted: p.wilted, skin: pl.skin, staked: p.staked, scale: 2 }) : potSvg(pl.skin, 2),
          plant: p,
          key: p ? [p.species, p.stage, p.thirsty, p.wilted, pl.skin, p.bugs.length, p.ready, p.staked].join(":") : "empty:" + pl.skin,
        };
      });
    },
    badge() {
      const s = S();
      const live = s.plots.filter((pl) => pl.plant).map((pl) => pl.plant);
      if (live.some((p) => p.ready)) return "수확!";
      if (live.some((p) => p.wilted)) return "시듦!";
      if (live.some((p) => p.thirsty)) return "물!";
      if (live.some((p) => p.bugs.length)) return "벌레!";
      if (s.gifts.some((g) => g.to === me() && !g.opened)) return "선물!";
      if (!s.today.all) return `미션 ${s.today.list.filter((m) => m.done).length}/3`;
      return "Lv." + s.level;
    },
    rain() {
      if (!H) return;
      const s = S();
      const d = new Date();
      s.plots.forEach((pl) => {
        const p = pl.plant;
        if (!p) return;
        const id = `rain-${p.id}-${C.dayKey(d.getTime())}-${d.getHours()}`;
        if (Store.get("garden", id)) return;
        H.silently(() => Store.put("garden", { id, type: "water", who: "sky", plant: p.id, at: Date.now() }));
      });
      C.invalidate();
    },
    // 앱을 열 때마다 출석 도장
    attend() {
      const who = me();
      if (!who) return;
      const k = "a:" + C.dayKey(Date.now());
      if (Store.pair(k, who)) return;
      H.silently(() => Store.setPair(k, who, 1));
      C.invalidate();
    },
  };
})();
