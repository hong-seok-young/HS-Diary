// ============================================================
// 우리 텃밭: 가만히 둬도 자라는 방치형 게임
// - 밭 9칸. 작물은 저절로 자라고 코인이 쌓여요. 자리를 비운 동안에도 쌓여요.
// - 코인으로 밭을 키우면 5단계마다 새 작물로 바뀌어요.
// - 동물 친구: 하마(빨리 자라요), 양(오래 쌓여요), 고양이(톡톡 누르면 더 많이).
// - 두 사람이 같은 텃밭을 키워요. 둘 다 들르면 "함께" 보너스.
// 저장: 사람마다 내가 번 코인과 내가 올린 단계만 적어요. 텃밭 = 두 사람 것을 더한 것.
// ============================================================
(function () {
  "use strict";

  const A = window.GArt, S = window.FSprites;
  if (!A || !S) return;
  const cfg = typeof DIARY_CONFIG !== "undefined" ? DIARY_CONFIG : {};
  const NAME = { him: cfg.him || "석영", her: cfg.her || "예은" };
  const KEY = "I1";
  const N = 9, MAXL = 100;
  const UNLOCK = [0, 60, 400, 2500, 15000, 90000, 600000, 4e6, 3e7];
  const CROPS = [
    ["무", "root", "#f8f4ec"], ["당근", "root", "#ff9a3c"], ["감자", "root", "#d9a066"], ["딸기", "fruitbush", "#ff4f5e", "#ffe066", { seeds: 1 }],
    ["방울토마토", "fruitbush", "#ff5a3c"], ["옥수수", "grass", "#ffd84a"], ["가지", "fruitbush", "#7a4fa8"], ["블루베리", "bush", "#5b6fd8", null, { dot: 1 }],
    ["해바라기", "sunflower", "#ffd23f", "#8a5a36", { tall: 1 }], ["포도", "vine", "#9b6fd0", null, { grape: 1 }], ["수박", "fruitbush", "#4fae5a", null, { big: 1 }], ["호박", "fruitbush", "#ff9a3c", null, { big: 1 }],
  ].map((r, i) => ({ id: "i" + i, name: r[0], a: r[1], p: r[2], c: r[3] || undefined, o: r[4] || {}, k: i % 8 }));
  const HELP = [
    { id: "hippo", name: "하마", does: "빨리 자라요", base: 300, mul: 3.2, max: 15, img: () => S.hippoImg("stand", "happy") },
    { id: "sheep", name: "양", does: "오래 쌓여요", base: 500, mul: 2.6, max: 11, img: () => S.sheepImg("stand", "happy") },
    { id: "cat", name: "고양이", does: "톡톡이 세져요", base: 800, mul: 3, max: 10, img: () => S.catImg("stand", "happy", 1) },
  ];

  // ---------- 규칙 ----------
  const tierOf = (L) => Math.min(CROPS.length - 1, Math.floor((Math.max(1, L) - 1) / 5));
  const income = (L) => (L <= 0 ? 0 : 0.5 * L * Math.pow(2, Math.floor((L - 1) / 5)));
  const lvCost = (L) => Math.round(8 * Math.pow(1.35, L - 1));
  const hCost = (h, lv) => Math.round(HELP[h].base * Math.pow(HELP[h].mul, lv));
  const speedOf = (lv) => 1 + 0.2 * lv;
  const capHours = (lv) => 2 + 2 * lv;
  const tapSecs = (lv) => 2 + lv;

  function norm(d) {
    d = d && typeof d === "object" ? d : {};
    const pl = Array.isArray(d.pl) ? d.pl.slice(0, N) : [];
    while (pl.length < N) pl.push(0);
    const h = Array.isArray(d.h) ? d.h.slice(0, 3) : [];
    while (h.length < 3) h.push(0);
    return { tp: Number(d.tp) || 0, e: Number(d.e) || 0, pl: pl.map((x) => Math.max(0, Number(x) || 0)), h: h.map((x) => Math.max(0, Number(x) || 0)), last: Number(d.last) || 0, seen: Number(d.seen) || 0 };
  }
  const me = () => (window.Store && Store.me()) || "";
  const other = (w) => (w === "him" ? "her" : "him");
  let mine = null; // 이 폰에서 고치는 내 기록
  function load() {
    const w = me();
    if (!w) { mine = norm(null); return; }
    const d = norm(Store.pair(KEY, w));
    if (!mine || d.tp > mine.tp) mine = d;
  }
  function save(now) {
    const w = me();
    if (!w) return;
    mine.tp++;
    Store.setPairFast(KEY, w, mine);
    if (now && Store.syncSoon) Store.syncSoon();
  }
  let rainUntil = 0;
  const spentCache = { k: "", v: 0 };
  let wCache = null, wAt = 0, wRev = -1;
  function world(now) {
    const t = now || Date.now();
    if (wCache && wRev === (mine ? mine.tp : -1) && t - wAt < 250 && wE === (mine ? mine.e : 0)) return wCache;
    const W = world0(t);
    wCache = W; wAt = t; wRev = mine.tp; wE = mine.e;
    return W;
  }
  let wE = 0;
  function world0(now) {
    load();
    const w = me();
    const o = w ? norm(Store.pair(KEY, other(w))) : norm(null);
    const L = mine.pl.map((x, i) => Math.min(MAXL, x + o.pl[i] + (i === 0 ? 1 : 0)));
    const H = mine.h.map((x, i) => Math.min(HELP[i].max, x + o.h[i]));
    const k = L.join(",") + "|" + H.join(",");
    if (spentCache.k !== k) {
      let s = 0;
      L.forEach((l, i) => { if (l >= 1) { s += UNLOCK[i]; for (let j = 1; j < l; j++) s += lvCost(j); } });
      H.forEach((lv, h) => { for (let j = 0; j < lv; j++) s += hCost(h, j); });
      spentCache.k = k; spentCache.v = s;
    }
    now = now || Date.now();
    const together = o.seen && now - o.seen < 86400000;
    const rain = rainUntil > now;
    const mult = speedOf(H[0]) * (together ? 1.5 : 1) * (rain ? 1.3 : 1);
    let base = 0;
    L.forEach((l) => { base += income(l); });
    return { L, H, coins: Math.max(0, mine.e + o.e - spentCache.v), rate: base * mult, mult, together, rain, last: Math.max(mine.last, o.last), cap: capHours(H[1]) * 3600000, speed: speedOf(H[0]), tap: tapSecs(H[2]) };
  }
  // 자리를 비운 동안 쌓인 코인
  function pending(W, now) {
    if (!W.last) return { coins: 0, ms: 0 };
    const ms = Math.max(0, now - W.last);
    return { coins: Math.floor((W.rate * Math.min(ms, W.cap)) / 1000), ms, full: ms >= W.cap };
  }
  function nextCost(W, i) {
    const l = W.L[i];
    if (l >= MAXL) return Infinity;
    return l < 1 ? UNLOCK[i] : lvCost(l);
  }
  function buyPlot(i) {
    const W = world();
    const c = nextCost(W, i);
    if (!(c <= W.coins)) return false;
    if (i > 0 && W.L[i] < 1 && W.L[i - 1] < 1) return false;
    mine.pl[i]++;
    save(true);
    return true;
  }
  function buyHelp(h) {
    const W = world();
    if (W.H[h] >= HELP[h].max) return false;
    if (!(hCost(h, W.H[h]) <= W.coins)) return false;
    mine.h[h]++;
    save(true);
    return true;
  }

  // ---------- 숫자 ----------
  function fmt(n) {
    n = Math.floor(Math.max(0, n));
    if (n < 10000) return n.toLocaleString("ko-KR");
    const u = [[1e16, "경"], [1e12, "조"], [1e8, "억"], [1e4, "만"]].find((x) => n >= x[0]);
    const v = n / u[0];
    return (v >= 100 ? Math.floor(v).toLocaleString("ko-KR") : v.toFixed(v >= 10 ? 1 : 2).replace(/\.?0+$/, "")) + u[1];
  }
  function fmtRate(r) { return r < 10 ? r.toFixed(1) : fmt(r); }
  function fmtDur(ms) {
    const m = Math.floor(ms / 60000);
    if (m < 60) return `${Math.max(1, m)}분`;
    const h = Math.floor(m / 60);
    return h < 24 ? `${h}시간 ${m % 60 ? (m % 60) + "분" : ""}`.trim() : `${Math.floor(h / 24)}일 ${h % 24}시간`;
  }
  const cropImg = (L, stage) => A.uri(CROPS[tierOf(L)], stage, L > 90 ? 3 : L > 60 ? 2 : 0);
  const coinImg = () => S.toolUri("coin");
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // ---------- 화면 ----------
  let H = {}, root = null, sel = 0, raf = 0, lastTick = 0, shown = 0, phases = [], ents = [], helpKey = "";
  const $ = (id) => document.getElementById(id);
  function build() {
    if (root) return;
    root = document.createElement("div");
    root.className = "idle";
    root.id = "idle";
    root.hidden = true;
    root.innerHTML = `
      <div class="id-sky" id="idSky"><i class="id-sun"></i><i class="id-cloud c1"></i><i class="id-cloud c2"></i><div class="id-trees" id="idTrees"></div></div>
      <header class="id-hud">
        <div class="id-coin"><img class="px" alt="" src="${coinImg()}"><b id="idCoins">0</b></div>
        <div class="id-rate" id="idRate"></div>
      </header>
      <div class="id-chips" id="idChips"></div>
      <main class="id-field">
        <div class="id-fence"></div>
        <div class="id-gridwrap"><div class="id-grid" id="idGrid">${Array.from({ length: N }, (_, i) => `<button class="id-plot" data-a="plot" data-i="${i}"><span class="pl-soil"></span><img class="px pl-crop" alt=""><i class="pl-bar"><b></b></i><em class="pl-lv"></em><i class="pl-up"></i><span class="pl-lock"><img class="px" alt="" src="${coinImg()}"><b></b></span></button>`).join("")}</div></div>
        <div class="id-yard" id="idYard"></div>
        <div class="id-fx" id="idFx"></div>
      </main>
      <footer class="id-panel">
        <div class="id-sel" id="idSel"></div>
        <div class="id-helpers" id="idHelpers"></div>
      </footer>
      <div class="id-basket" id="idBasket" hidden></div>`;
    document.body.appendChild(root);
    $("idTrees").innerHTML = ["pine", "oak", "bush", "pine", "oak", "pine", "bush", "oak", "pine"].map((n, i) => S.decoImg(n, 3, "tr" + (i % 3))).join("");
    const fr = S.frames();
    for (const k in fr) root.style.setProperty(k, fr[k]);
    root.style.setProperty("--tuft", `url("${S.decoUri("tuft")}")`);
    root.style.setProperty("--fence", `url("${S.decoUri("fence")}")`);
    root.style.setProperty("--flower", `url("${S.decoUri("flower")}")`);
    root.style.setProperty("--daisy", `url("${S.decoUri("daisy")}")`);
    root.addEventListener("click", onClick);
    // 꾹 누르면 계속 키워요
    let hold = 0, rep = 0;
    const stop = () => { clearTimeout(hold); clearInterval(rep); };
    root.addEventListener("pointerdown", (ev) => {
      const b = ev.target.closest('[data-a="up"], [data-a="help"]');
      if (!b) return;
      stop();
      hold = setTimeout(() => { rep = setInterval(() => { if (!act(b)) stop(); }, 90); }, 380);
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach((e) => root.addEventListener(e, stop));
  }
  function act(b) {
    const a = b.dataset.a;
    if (a === "up") {
      const i = Number(b.dataset.i);
      const before = world().L[i];
      if (!buyPlot(i)) { shake(b); return false; }
      const W = world();
      const el = plotEl(i);
      pop(el, before < 1 ? "새 밭!" : tierOf(W.L[i]) !== tierOf(before) ? CROPS[tierOf(W.L[i])].name + "!" : "+1", "up");
      if (before < 1 || tierOf(W.L[i]) !== tierOf(before)) { burst(el, 12); if (H.toast) H.toast(before < 1 ? "새 밭을 열었어요" : `${CROPS[tierOf(W.L[i])].name} 밭이 됐어요`); }
      bounce(el);
      render();
      return true;
    }
    if (a === "help") {
      const h = Number(b.dataset.h);
      if (!buyHelp(h)) { shake(b); return false; }
      burst(b, 8);
      if (H.toast && world().H[h] === 1) H.toast(`${HELP[h].name}가 텃밭에 놀러 왔어요`);
      render();
      return true;
    }
    return false;
  }
  function onClick(ev) {
    const b = ev.target.closest("[data-a]");
    if (!b) return;
    const a = b.dataset.a;
    if (a === "close") { history.back(); return; }
    if (a === "up" || a === "help") { act(b); return; }
    if (a === "collect") { collect(); return; }
    if (a === "ent") { tapEnt(b); return; }
    if (a === "plot") {
      const i = Number(b.dataset.i);
      const W = world();
      sel = i;
      if (W.L[i] >= 1) {
        // 톡톡: 조금 더 얻어요
        const gain = income(W.L[i]) * W.mult * W.tap;
        mine.e += gain; save();
        pop(b, "+" + fmt(Math.max(1, gain)), "coin");
        bounce(b);
      }
      render();
    }
  }
  const plotEl = (i) => root.querySelector(`.id-plot[data-i="${i}"]`);
  function bounce(el) { if (el && el.animate) el.animate([{ transform: "scale(1.08, .92)" }, { transform: "scale(.96, 1.06)" }, { transform: "none" }], { duration: 240, easing: "ease-out" }); }
  function shake(el) { if (el && el.animate) el.animate([{ transform: "translateX(-3px)" }, { transform: "translateX(3px)" }, { transform: "none" }], { duration: 160 }); }
  function burst(el, n) { if (!H.burst || !el) return; const r = el.getBoundingClientRect(); H.burst(r.left + r.width / 2, r.top + r.height / 2, n, "spark"); }
  function pop(el, text, kind) {
    const fx = $("idFx");
    if (!fx || !el) return;
    const r = el.getBoundingClientRect(), fr = fx.getBoundingClientRect();
    const d = document.createElement("i");
    d.className = "id-pop " + (kind || "");
    d.textContent = text;
    d.style.left = r.left - fr.left + r.width / 2 + "px";
    d.style.top = r.top - fr.top + r.height * 0.3 + "px";
    fx.appendChild(d);
    d.animate([{ transform: "translate(-50%, 0) scale(.7)", opacity: 0 }, { transform: "translate(-50%, -10px) scale(1.1)", opacity: 1, offset: 0.2 }, { transform: "translate(-50%, -34px)", opacity: 0 }], { duration: 900, easing: "ease-out" }).onfinish = () => d.remove();
  }

  function render() {
    if (!root || root.hidden) return;
    const now = Date.now();
    const W = world(now);
    // 밭
    for (let i = 0; i < N; i++) {
      const el = plotEl(i), l = W.L[i];
      const open = l >= 1;
      const can = nextCost(W, i) <= W.coins && (open || i === 0 || W.L[i - 1] >= 1);
      const cls = "id-plot" + (open ? "" : " locked") + (!open && i > 0 && W.L[i - 1] < 1 ? " far" : "") + (sel === i ? " sel" : "") + (can ? " can" : "") + (l > 60 ? " gold" : "");
      if (el.className !== cls) el.className = cls;
      const lv = el.querySelector(".pl-lv");
      const t = open ? String(l) : "";
      if (lv.textContent !== t) lv.textContent = t;
      if (!open) { const b = el.querySelector(".pl-lock b"); const c = fmt(UNLOCK[i]); if (b.textContent !== c) b.textContent = c; }
    }
    // 고른 밭
    const i = sel, l = W.L[i], c = nextCost(W, i);
    const reach = l >= 1 || i === 0 || W.L[i - 1] >= 1;
    let html;
    if (l < 1) {
      html = `<span class="sel-ico lock"><img class="px" alt="" src="${A.uri(CROPS[0], 1, 0)}"></span><div class="sel-text"><b>빈 땅</b><small>${reach ? "열면 무부터 자라요" : "앞의 밭을 먼저 열어요"}</small></div>
        <button class="id-btn${reach && c <= W.coins ? "" : " dim"}" data-a="up" data-i="${i}"><small>밭 열기</small><span><img class="px" alt="" src="${coinImg()}">${fmt(c)}</span></button>`;
    } else {
      const crop = CROPS[tierOf(l)], step = (l - 1) % 5, nextCrop = CROPS[tierOf(l) + 1];
      html = `<span class="sel-ico"><img class="px" alt="" src="${cropImg(l, 4)}"></span><div class="sel-text"><b>${esc(crop.name)} <em>${l}단계</em></b><small>초당 +${fmtRate(income(l) * W.mult)}${nextCrop ? ` · ${esc(nextCrop.name)}까지 ${5 - step}번` : ""}</small><i class="sel-pips">${[0, 1, 2, 3, 4].map((k) => `<u class="${k <= step ? "on" : ""}"></u>`).join("")}</i></div>
        ${l >= MAXL ? `<span class="id-btn dim"><small>끝까지</small><span>키웠어요</span></span>` : `<button class="id-btn${c <= W.coins ? "" : " dim"}" data-a="up" data-i="${i}"><small>키우기</small><span><img class="px" alt="" src="${coinImg()}">${fmt(c)}</span></button>`}`;
    }
    if (window.MORPH) MORPH($("idSel"), html); else $("idSel").innerHTML = html;
    // 동물 친구
    const hh = HELP.map((h, k) => {
      const lv = W.H[k], cost = hCost(k, lv), max = lv >= h.max;
      const now2 = k === 0 ? `×${speedOf(lv).toFixed(1)}` : k === 1 ? `${capHours(lv)}시간` : `${tapSecs(lv)}초치`;
      return `<button class="id-help${!max && cost <= W.coins ? "" : " dim"}${lv ? "" : " none"}" data-a="help" data-h="${k}"><span class="hp-ico"><img class="px" alt="" src="${h.img()}"></span><b>${h.name}${lv ? ` <em>${lv}</em>` : ""}</b><small>${h.does} ${lv ? now2 : ""}</small><span class="hp-cost">${max ? "최고" : `<img class="px" alt="" src="${coinImg()}">${fmt(cost)}`}</span></button>`;
    }).join("");
    if (window.MORPH) MORPH($("idHelpers"), hh); else $("idHelpers").innerHTML = hh;
    // 위쪽
    $("idRate").textContent = `초당 +${fmtRate(W.rate)}`;
    const chips = (W.together ? `<span class="chip-h">함께 ×1.5</span>` : `<span class="chip-off">${esc(NAME[other(me())] || "")}도 오면 ×1.5</span>`) + (W.rain ? `<span class="chip-r">비 ×1.3</span>` : "");
    if ($("idChips").innerHTML !== chips) $("idChips").innerHTML = chips;
    syncEnts(W);
    if (H.onChanged) H.onChanged();
  }

  // ---------- 텃밭 마당: 두 사람과 동물 친구 ----------
  function syncEnts(W) {
    const k = W.H.map((x) => (x ? 1 : 0)).join("") + me() + (window.HSWear ? HSWear("him") + HSWear("her") : "");
    if (k === helpKey) return;
    helpKey = k;
    const yard = $("idYard");
    yard.innerHTML = "";
    ents = [];
    const add = (kind, who) => {
      const el = document.createElement("button");
      el.className = "id-ent " + kind;
      el.dataset.a = "ent";
      el.dataset.k = kind + (who || "");
      el.innerHTML = `<img class="px" alt="">`;
      yard.appendChild(el);
      ents.push({ kind, who, el, img: el.firstChild, x: 0.1 + Math.random() * 0.8, tx: Math.random(), rest: Math.random() * 3, sp: kind === "ch" ? 0.05 : kind === "cat" ? 0.07 : 0.04, flip: false, src: "", y: Math.random() });
    };
    add("ch", "him"); add("ch", "her"); add("dog");
    if (W.H[0]) add("hippo");
    if (W.H[1]) add("sheep");
    if (W.H[2]) add("cat");
  }
  function stepEnts(dt, t) {
    ents.forEach((e) => {
      let moving = false;
      if (e.rest > 0) e.rest -= dt;
      else {
        const d = e.tx - e.x;
        const st = e.sp * dt;
        if (Math.abs(d) <= st) { e.x = e.tx; e.rest = 1 + Math.random() * 5; e.tx = Math.max(0.04, Math.min(0.96, Math.random() < 0.5 ? Math.random() : e.x + (Math.random() - 0.5) * 0.3)); e.sp = (e.kind === "cat" ? 0.07 : 0.045) * (0.7 + Math.random() * 0.7); }
        else { e.x += Math.sign(d) * st; e.flip = d < 0; moving = true; }
      }
      const f = moving ? (Math.floor(t * 6) % 2 ? "walk1" : "walk2") : "stand";
      const blink = Math.floor(t * 2 + e.y * 7) % 9 === 0;
      let src;
      if (e.kind === "ch") src = S.charImg(e.who, moving ? "side" : "down", moving ? (Math.floor(t * 6) % 4 === 1 ? 1 : Math.floor(t * 6) % 4 === 3 ? 2 : 0) : 0, e.wave > t ? (Math.floor(t * 6) % 2 ? "wave1" : "wave2") : "", e.wave > t ? "happy" : blink ? "blink" : "");
      else if (e.kind === "dog") src = S.dogImg(moving ? f : "sit", Math.floor(t * 3) % 2, e.wave > t ? "happy" : "", "cream");
      else if (e.kind === "hippo") src = S.hippoImg(f, e.wave > t ? "happy" : blink ? "blink" : "");
      else if (e.kind === "sheep") src = S.sheepImg(f, e.wave > t ? "happy" : blink ? "blink" : "");
      else src = S.catImg(moving ? f : "loaf", e.wave > t ? "happy" : blink ? "blink" : "", 1);
      if (src !== e.src) { e.img.src = src; e.src = src; }
      e.el.style.left = (e.x * 100).toFixed(2) + "%";
      e.el.style.bottom = (6 + e.y * 26).toFixed(0) + "%";
      e.el.style.zIndex = String(10 - Math.round(e.y * 8));
      e.img.style.transform = e.flip ? "scaleX(-1)" : "";
    });
  }
  function tapEnt(b) {
    const e = ents.find((x) => x.kind + (x.who || "") === b.dataset.k);
    if (!e) return;
    e.wave = performance.now() / 1000 + 1.4;
    e.rest = 1.6;
    bounce(b);
    if (H.burst) { const r = b.getBoundingClientRect(); H.burst(r.left + r.width / 2, r.top + r.height * 0.3, 5, "heart"); }
    pop(b, e.kind === "ch" ? pick(["같이 키우자", "쑥쑥 자라라", "오늘도 풍년"]) : e.kind === "dog" ? "멍!" : e.kind === "hippo" ? "물 줄게" : e.kind === "sheep" ? "메에" : "냐옹", "say");
  }
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  // ---------- 돌리기 ----------
  function frame(ts) {
    raf = requestAnimationFrame(frame);
    if (!root || root.hidden || document.hidden) return;
    const now = Date.now(), t = ts / 1000;
    const dt = Math.min(0.1, lastTick ? t - lastTick : 0.016);
    lastTick = t;
    const W = world(now);
    // 작물이 자라는 모습 (한 바퀴 돌면 코인이 톡)
    const T = Math.max(1.6, 8 / W.speed);
    for (let i = 0; i < N; i++) {
      const l = W.L[i];
      if (l < 1) continue;
      const ph = ((now / 1000 + i * 0.37 * T) % T) / T;
      const el = plotEl(i), img = el.querySelector(".pl-crop");
      const st = ph < 0.18 ? 1 : ph < 0.42 ? 2 : ph < 0.68 ? 3 : 4;
      const src = cropImg(l, st);
      if (img.dataset.s !== src) { img.dataset.s = src; img.src = src; if (st === 4) img.animate([{ transform: "scale(1.15, .9)" }, { transform: "none" }], { duration: 200 }); }
      el.querySelector(".pl-bar b").style.transform = `scaleX(${ph.toFixed(3)})`;
      if (phases[i] !== undefined && ph < phases[i]) pop(el, "+" + fmt(Math.max(1, income(l) * W.mult * T)), "coin");
      phases[i] = ph;
    }
    stepEnts(dt, t);
    // 코인 숫자는 부드럽게 올라가요
    const target = W.coins;
    shown += (target - shown) * Math.min(1, dt * 8);
    if (Math.abs(target - shown) < 0.6) shown = target;
    const txt = fmt(shown);
    const c = $("idCoins");
    if (c.textContent !== txt) c.textContent = txt;
  }
  let bankAt = 0, slow = 0;
  function bank() {
    if (!root || root.hidden || document.hidden || !me()) return;
    if (!$("idBasket").hidden) return;
    const now = Date.now();
    const W = world(now);
    const dt = bankAt ? now - bankAt : 0;
    bankAt = now;
    if (dt > 0 && dt < 6000) { mine.e += (W.rate * dt) / 1000; mine.last = now; mine.seen = now; save(); }
    else if (dt >= 6000) openBasket();
    if (++slow % 3 === 0) render();
  }
  function openBasket() {
    const now = Date.now();
    const W = world(now);
    if (!W.last) { mine.last = now; mine.seen = now; save(); bankAt = now; return; }
    const p = pending(W, now);
    if (p.ms < 60000 || p.coins < 1) { mine.e += p.coins; mine.last = now; mine.seen = now; save(); bankAt = now; return; }
    const b = $("idBasket");
    b.hidden = false;
    b.innerHTML = `<div class="bk-card"><div class="bk-art"><img class="px" alt="" src="${cropImg(Math.max.apply(null, W.L), 4)}"><img class="px" alt="" src="${cropImg(W.L[0], 4)}"><img class="px" alt="" src="${cropImg(Math.max.apply(null, W.L), 4)}"></div>
      <h2>잘 다녀왔어요</h2><p>${fmtDur(p.ms)} 동안 텃밭이 알아서 자랐어요${p.full ? `<br><small>양이 지켜 주는 ${capHours(W.H[1])}시간까지만 쌓여요</small>` : ""}</p>
      <div class="bk-coins"><img class="px" alt="" src="${coinImg()}"><b>+${fmt(p.coins)}</b></div>
      <button class="id-btn big" data-a="collect"><span>받기</span></button></div>`;
    b.dataset.c = String(p.coins);
  }
  function collect() {
    const b = $("idBasket");
    const c = Number(b.dataset.c) || 0;
    const now = Date.now();
    mine.e += c; mine.last = now; mine.seen = now; save(true);
    bankAt = now;
    if (H.burst) { const r = b.querySelector(".bk-coins").getBoundingClientRect(); H.burst(r.left + r.width / 2, r.top + r.height / 2, 18, "spark"); }
    b.hidden = true;
    render();
  }

  function skyClass() {
    const h = new Date().getHours();
    return h >= 20 || h < 5 ? "night" : h >= 17 ? "dusk" : h < 7 ? "dawn" : "day";
  }
  function open() {
    if (!me()) return;
    build();
    const W = world();
    // 처음엔 살 수 있는 가장 싼 밭을 골라 둬요
    let best = 0, bc = Infinity;
    for (let i = 0; i < N; i++) { const c = nextCost(W, i); if ((W.L[i] >= 1 || i === 0 || W.L[i - 1] >= 1) && c < bc) { bc = c; best = i; } }
    sel = best;
    root.hidden = false;
    root.classList.remove("closing");
    $("idSky").className = "id-sky " + skyClass();
    document.body.classList.add("game-open");
    document.dispatchEvent(new Event("hsd:layer"));
    shown = W.coins;
    phases = [];
    helpKey = "";
    bankAt = 0;
    openBasket();
    bankAt = Date.now();
    render();
    cancelAnimationFrame(raf);
    lastTick = 0;
    raf = requestAnimationFrame(frame);
  }
  function close() {
    if (!root || root.hidden) return;
    bank();
    cancelAnimationFrame(raf);
    root.classList.add("closing");
    setTimeout(() => { root.hidden = true; root.classList.remove("closing"); }, 180);
    document.body.classList.remove("game-open");
    document.dispatchEvent(new Event("hsd:layer"));
    if (H.onChanged) H.onChanged();
  }
  setInterval(bank, 1000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && root && !root.hidden) bank(); });

  window.Garden = {
    bind(h) { H = h || {}; },
    open, close, render,
    isOpen: () => !!(root && !root.hidden),
    // 앱을 열 때: 다녀갔다고 적어 둬요 (함께 보너스)
    attend() {
      if (!me()) return;
      load();
      const now = Date.now();
      if (now - mine.seen > 3600000) { mine.seen = now; if (!mine.last) mine.last = now; save(); }
    },
    rain() { rainUntil = Date.now() + 30 * 60000; },
    // 홈 타일에 띄울 한마디
    badge() {
      if (!me()) return "";
      const now = Date.now(), W = world(now), p = pending(W, now);
      return p.ms > 600000 && p.coins >= 1 ? "받기" : "";
    },
    // 홈 풍경 속 화분: 가장 잘 키운 작물
    pot() {
      const W = world();
      const l = Math.max.apply(null, W.L);
      return { key: "p" + tierOf(l) + (l > 60 ? "g" : ""), html: `<img class="px" alt="" src="${cropImg(l, 4)}" width="36" height="52">` };
    },
    _debug: () => ({ W: world(), mine, pending: pending(world(), Date.now()) }),
    _give(n) { load(); mine.e += n; save(); render(); },
  };
})();
