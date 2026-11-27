// ============================================================
// 놀이: 사람과 동물이 서로 치고받고, 던지고, 흩어졌다 다시 붙는 만화 같은 장난들.
// - 이 파일은 "엔진"이에요: 움직임 조각(걷기, 뛰기, 눌리기, 날아가기), 효과(별, 먼지, 글자),
//   사람 끌어서 던지기, 머리만 쏙 빠지기, 벽에 부딪혀 여섯 조각으로 흩어졌다가 스스로 모여 붙기.
// - 장난 하나하나의 순서는 js/plays.js 에 있어요.
// - 사람은 js/charanim.js 의 그림을, 동물은 js/pals.js 의 그림을 그대로 빌려 써요.
// - 좌표: x 는 그림 왼쪽에서부터, b 는 그림 바닥에서부터 (px).
// ============================================================
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const S = window.FSprites, GA = window.GArt;
  if (!S || !GA) return;
  const PL = () => window.Pals, CA = () => window.CharAnim;
  // 저절로 시작한 장난은 씨앗 하나로 갈래(누가 이기나, 어떻게 되갚나)를 정해요. 그래야 두 폰에서 똑같이 흘러가요.
  // 프레임마다 도는 자잘한 효과(먼지, 떨림)는 폰마다 달라도 돼서 그냥 주사위를 굴려요.
  let frameCtx = 0;
  function h01(seed, tag, n) {
    let h = (seed ^ 0x9e3779b9) >>> 0;
    const t = tag + ":" + n;
    for (let i = 0; i < t.length; i++) { h = Math.imul(h ^ t.charCodeAt(i), 2654435761) >>> 0; h ^= h >>> 15; }
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) >>> 0; h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
  }
  // 이름표가 붙은 갈림길: 같은 씨앗이면 어느 폰에서나 같은 값
  function dec(tag) {
    if (!cur || cur.seed == null) return Math.random();
    cur.cnt[tag] = (cur.cnt[tag] || 0) + 1;
    return h01(cur.seed, tag, cur.cnt[tag]);
  }
  const dpick = (tag, a) => a[Math.floor(dec(tag) * a.length)];
  function rnd() { return cur && cur.seed != null && !frameCtx ? dec("r") : Math.random(); }
  const rand = (a, b) => a + rnd() * (b - a);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // 움직임의 빠르기 곡선
  const E = {
    lin: (t) => t, out: (t) => 1 - (1 - t) * (1 - t), in: (t) => t * t, io: (t) => t * t * (3 - 2 * t),
    back: (t) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    el: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -9 * t) * Math.sin((t * 10 - 0.75) * 2.094) + 1),
  };
  const GY = 12, CW = 60, CH = 78; // 사람이 서는 높이, 사람 그림판 크기
  let scene = null, layer = null, couple = null, W = 360, H = 200, pond = { x0: 14, x1: 106 };
  const runs = [], gfx = [], flyers = [];
  let cur = null, nextAt = 8, clock = 0, dragAt = 0, busyAt = -99, paused = false, cOff = 0;
  // 누운 몸이 땅에 반쯤 묻히지 않게: 발을 축으로 기울수록 조금 들어 올려요
  const lieUp = (rot) => { const s = Math.abs(Math.sin((rot * Math.PI) / 180)); return 20 * Math.max(0, (s - 0.35) / 0.65); };
  const PIV = { feet: 0, mid: 31, head: 48 };
  function readOff() { if (couple && scene) cOff = couple.getBoundingClientRect().left - scene.getBoundingClientRect().left; return cOff; }
  const hist = [];

  // ---------- 순서 조각 (제너레이터) ----------
  function* wait(sec, fn) { let t = 0; while (t < sec) { const dt = yield; t += dt; if (fn) { frameCtx++; try { fn(Math.min(1, t / sec), dt, t); } finally { frameCtx--; } } } }
  function* tween(o, to, sec, ease) { const from = {}; Object.keys(to).forEach((k) => { from[k] = o[k] || 0; }); const f = ease || E.io; yield* wait(sec, (k) => { const q = f(k); Object.keys(to).forEach((key) => { o[key] = from[key] + (to[key] - from[key]) * q; }); }); }
  function* all() { let live = Array.prototype.slice.call(arguments).filter(Boolean); live = live.filter((g) => !g.next(0).done); while (live.length) { const dt = yield; live = live.filter((g) => !g.next(dt).done); } }
  function* until(fn, max) { let t = 0; while (!fn() && t < (max || 8)) t += yield; }
  const fork = (g) => { if (cur && !g.next(0).done) cur.forks.push(g); };
  const inPond = (x) => x > pond.x0 + 10 && x < pond.x1 - 10;
  const landX = (x) => clamp(x, pond.x1 + 26, W - 26);

  // ---------- 작은 그림들 ----------
  const SPR = {
    eye: [[".ooo.", "oWWWo", "oWKWo", "oWWWo", ".ooo."], { o: "#3b2a20", W: "#ffffff", K: "#2e221c" }],
    bump: [["..ooo..", ".oPPPo.", "oPpPPPo", "oPPPPPo"], { o: "#8a3a4a", P: "#ff8fa0", p: "#ffd9de" }],
    hammer: [["ooooooooo", "oRRYRYRRo", "oRRYRYRRo", "oRRYRYRRo", "ooooHoooo", "...oHo...", "...oHo...", "...oHo...", "...oHo...", "...ooo..."], { o: "#3b2a20", R: "#ff5a6a", Y: "#ffd24a", H: "#f0c890" }],
    sling: [["oo...oo", "oBo.oBo", "oBo.oBo", ".oBoBo.", "..oBo..", "..oBo..", "..oBo..", "..ooo.."], { o: "#3b2a20", B: "#a8703c" }],
    stone: [[".oo.", "oGGo", "oGgo", ".oo."], { o: "#3b2a20", G: "#aab0ba", g: "#7c828c" }],
    feather: [["..o", ".oF", "oFo", "oF.", "o.."], { o: "#6a5a4a", F: "#ffffff" }],
    splat: [["..ooo..", ".oWWWo.", "oWWWWWo", "oWoWoWo", ".o.o.o."], { o: "#8a8f98", W: "#ffffff" }],
    scratch: [["..N.N.N", ".N.N.N.", "N.N.N.."], { N: "#e8504f" }],
    snow: [[".ooo.", "oWWWo", "oWWWo", "oWWWo", ".ooo."], { o: "#7a9ab8", W: "#ffffff" }],
    anger: [[".N.N.", "NN.NN", ".....", "NN.NN", ".N.N."], { N: "#e8504f" }],
    fist: [[".ooo.", "oSSSo", "oSSSo", ".ooo."], { o: "#3b2a20", S: "#ffd9b8" }],
    fish: [["o...ooo.", "oo.oBBBo", "oBoBBKBo", "oo.oBBBo", "o...ooo."], { o: "#2e4a6a", B: "#7ab8e8", K: "#1c2a3a" }],
  };
  // 싸움 구름: 몽실몽실한 먼지 덩어리
  (function () {
    const w = 22, h = 15, g = [];
    for (let y = 0; y < h; y++) g.push(new Array(w).fill("."));
    [[6, 8, 5.2, 4.6], [12, 6, 6, 5], [16, 9, 4.6, 4], [10, 10, 6, 3.6], [4, 10, 3.4, 3], [18, 6, 3, 2.6]].forEach(([cx, cy, rx, ry]) => {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = (x - cx) / rx, dy = (y - cy) / ry; if (dx * dx + dy * dy <= 1) g[y][x] = dy < -0.35 ? "w" : "C"; }
    });
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g[y][x] === "." && [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(([a, b]) => g[b] && g[b][a] && g[b][a] !== "." && g[b][a] !== "o")) g[y][x] = "o";
    SPR.cloud = [g.map((r) => r.join("")), { o: "#8a7a6a", C: "#efe6d8", w: "#ffffff" }];
  })();
  const sprCache = {};
  function spr(name, pal) {
    const k = name + (pal ? JSON.stringify(pal) : "");
    if (!sprCache[k]) { const d = SPR[name]; sprCache[k] = GA.fromRows("play|" + k, d[0], Object.assign({}, d[1], pal || {})); }
    return sprCache[k];
  }

  // ---------- 무대 ----------
  function ensure() {
    const P = PL();
    if (!P || !P.geo) return false;
    const g = P.geo();
    if (!g.scene) return false;
    scene = g.scene; W = g.W; H = g.H; pond = g.pond;
    couple = $("couple");
    if (!couple) return false;
    if (!layer || !layer.isConnected) {
      layer = document.createElement("div");
      layer.className = "sc-play";
      scene.appendChild(layer);
      ["him", "her"].forEach((w) => { if (!people[w]) { const el = couple.querySelector(`.bob[data-who="${w}"]`); if (el) { people[w] = new Person(w, el); bindDrag(people[w]); } } });
    }
    return true;
  }

  // ---------- 효과 ----------
  function pow(x, b, text, o) {
    o = o || {};
    const el = document.createElement("i");
    el.className = "play-pow" + (o.big ? " big" : "") + (o.cls ? " " + o.cls : "");
    el.textContent = text;
    el.style.left = clamp(x, 16, W - 16).toFixed(0) + "px"; el.style.bottom = clamp(b, 4, H - 18).toFixed(0) + "px";
    layer.appendChild(el);
    const r = o.rot == null ? rand(-14, 14) : o.rot;
    el.animate([{ transform: `translate(-50%,0) scale(.2) rotate(${r}deg)`, opacity: 0 }, { transform: `translate(-50%,-4px) scale(1.3) rotate(${r}deg)`, opacity: 1, offset: 0.22 }, { transform: `translate(-50%,-6px) scale(1) rotate(${r}deg)`, opacity: 1, offset: 0.7 }, { transform: `translate(-50%,-16px) scale(.9) rotate(${r}deg)`, opacity: 0 }], { duration: o.ms || 700, easing: "ease-out" }).onfinish = () => el.remove();
  }
  // 작은 조각들이 사방으로 튀어요. o: { c 색, s 크기, ch 글자, sp 퍼지는 세기, up 솟는 세기, ms, fall 떨어지는 깊이, dir 한쪽으로 }
  function puff(x, b, n, o) {
    o = o || {};
    for (let i = 0; i < n; i++) {
      const el = document.createElement("i");
      el.className = "play-bit" + (o.ch ? " ch" : "");
      if (o.ch) { el.textContent = o.ch; el.style.color = o.c || "#ffd83a"; }
      else { el.style.background = o.c || "#fff"; const s = o.s || 3; el.style.width = s + "px"; el.style.height = s + "px"; }
      el.style.left = x.toFixed(0) + "px"; el.style.bottom = b.toFixed(0) + "px";
      layer.appendChild(el);
      const sp = o.sp == null ? 26 : o.sp, vx = rand(-sp, sp) + (o.dir || 0) * sp, up = rand(0.4, 1) * (o.up == null ? 26 : o.up), fall = o.fall == null ? 10 : o.fall, rot = rand(-260, 260);
      el.animate([{ transform: "translate(-50%,0) rotate(0deg)", opacity: 1 }, { transform: `translate(calc(-50% + ${vx * 0.55}px), ${-up}px) rotate(${rot * 0.5}deg)`, opacity: 1, offset: 0.4 }, { transform: `translate(calc(-50% + ${vx}px), ${fall}px) rotate(${rot}deg)`, opacity: 0 }], { duration: (o.ms || 620) * rand(0.8, 1.2), easing: "ease-out" }).onfinish = () => el.remove();
    }
  }
  const stars = (x, b, n) => puff(x, b, n || 5, { ch: "★", c: "#ffd83a", sp: 34, up: 30 });
  const dust = (x, b, n) => puff(x, b, n || 5, { c: "#d8c8a0", s: 3, sp: 18, up: 12, fall: 2, ms: 480 });
  const sweat = (x, b, n) => puff(x, b, n || 3, { c: "#bfe6ff", s: 2, sp: 16, up: 18 });
  // 깃털: 살랑살랑 천천히 떨어져요
  function feathers(x, b, n, color) {
    const r = spr("feather", color ? { F: color } : null);
    for (let i = 0; i < n; i++) {
      const el = document.createElement("img");
      el.className = "play-prop"; el.src = r.uri; el.style.width = r.w * 2 + "px";
      el.style.left = (x + rand(-10, 10)).toFixed(0) + "px"; el.style.bottom = (b + rand(-6, 8)).toFixed(0) + "px";
      layer.appendChild(el);
      const dx = rand(-34, 34), fall = Math.max(20, b - 6);
      el.animate([{ transform: "translate(0,0) rotate(0deg)" }, { transform: `translate(${dx * 0.5}px, ${-rand(8, 22)}px) rotate(${rand(-80, 80)}deg)`, offset: 0.15 }, { transform: `translate(${dx * 0.3}px, ${fall * 0.45}px) rotate(${rand(-60, 60)}deg)`, offset: 0.55 }, { transform: `translate(${dx}px, ${fall}px) rotate(${rand(-120, 120)}deg)`, opacity: 0.9, offset: 0.9 }, { transform: `translate(${dx}px, ${fall}px)`, opacity: 0 }], { duration: rand(1500, 2300), easing: "ease-in-out" }).onfinish = () => el.remove();
    }
  }
  function quake(amp) {
    if (!scene || !scene.animate) return;
    const a = amp || 2;
    scene.animate([{ translate: "0 0" }, { translate: `${a}px ${-a}px` }, { translate: `${-a}px ${a * 0.6}px` }, { translate: `${a * 0.5}px 0` }, { translate: "0 0" }], { duration: 170 });
  }
  // 머리 위치 (사람, 동물, 조각 모두)
  function headPos(t) {
    if (t instanceof Person) {
      if (!t.on) return { x: t.x, b: GY + 42 };
      const th = (t.rot * Math.PI) / 180, h = PIV[t.pivot] || 0, up = t.pivot === "feet" ? lieUp(t.rot) : 0, v = 42 - h;
      return { x: t.x + v * Math.sin(th), b: t.b + up + h + v * Math.cos(th) };
    }
    if (t instanceof Part) return { x: t.x, b: t.b };
    const ih = (t.img && t.img.naturalHeight ? t.img.naturalHeight * 2 : 30) * (t.size || 1);
    return { x: t.x, b: t.b + (t.lift || 0) + ih * 0.62 };
  }
  // 머리 위를 빙글빙글 도는 별
  function orbit(target, sec, n) {
    const els = [];
    for (let i = 0; i < (n || 3); i++) { const el = document.createElement("i"); el.className = "play-bit ch"; el.textContent = "★"; el.style.color = i % 2 ? "#fff3a0" : "#ffd83a"; layer.appendChild(el); els.push(el); }
    const fx = { t: 0, update(dt) { fx.t += dt; const h = headPos(target), up = target instanceof Person ? 22 : 14; els.forEach((el, i) => { const a = fx.t * 5.2 + (i * Math.PI * 2) / els.length; el.style.left = (h.x + Math.cos(a) * 15 - 4).toFixed(1) + "px"; el.style.bottom = (h.b + up + Math.sin(a) * 4).toFixed(1) + "px"; el.style.zIndex = Math.sin(a) > 0 ? "4" : "12"; el.style.opacity = fx.t > sec - 0.3 ? "0.4" : "1"; }); return fx.t < sec; }, end() { els.forEach((el) => el.remove()); } };
    gfx.push(fx);
    return fx;
  }
  // 따라다니는 말풍선
  function bubble(target, text, ms) {
    if (target && !(target instanceof Person) && !(target instanceof Part) && target.el && PL()) { PL().say(target, text, ms); return; }
    const el = document.createElement("i");
    el.className = "pal-say play-say"; el.textContent = text;
    layer.appendChild(el);
    el.animate([{ opacity: 0, translate: "-50% 4px" }, { opacity: 1, translate: "-50% 0" }], { duration: 160 });
    const sec = (ms || 1500) / 1000;
    if (target._say) target._say.t = 99;
    const fx = { t: 0, update(dt) { fx.t += dt; const h = headPos(target), up = target instanceof Person ? 26 : 24; el.style.left = clamp(h.x, 30, W - 30).toFixed(1) + "px"; el.style.bottom = clamp(h.b + up, 20, H - 20).toFixed(1) + "px"; return fx.t < sec; }, end() { el.remove(); if (target._say === fx) target._say = null; } };
    target._say = fx;
    gfx.push(fx);
  }
  // 사람 몸에 붙는 것 (혹, 새똥, 할퀸 자국). 몸을 따라 같이 움직이고, 시간이 지나면 사라져요.
  function stick(p, name, o) {
    o = o || {};
    const r = spr(name), sc = o.scale || 2;
    const el = document.createElement("img");
    el.className = "play-stick"; el.src = r.uri; el.style.width = r.w * sc + "px";
    el.style.marginLeft = ((o.dx || 0) - (r.w * sc) / 2).toFixed(0) + "px"; el.style.bottom = (o.db == null ? 56 : o.db) + "px";
    p.el.appendChild(el);
    el.animate([{ scale: "0 0" }, { scale: "1.35 1.35", offset: 0.6 }, { scale: "1 1" }], { duration: 260, easing: "ease-out" });
    setTimeout(() => { if (el.isConnected) el.animate([{ scale: "1 1", opacity: 1 }, { scale: "0 0", opacity: 0 }], { duration: 300 }).onfinish = () => el.remove(); }, (o.sec || 5) * 1000);
    return el;
  }

  // ---------- 소품: 손에 드는 것, 날아가는 것 ----------
  function Prop(name, scale, pal) {
    const r = spr(name, pal);
    this.w = r.w * (scale || 2); this.h = r.h * (scale || 2);
    this.el = document.createElement("img");
    this.el.className = "play-prop"; this.el.src = r.uri; this.el.style.width = this.w + "px";
    this.x = 0; this.b = 0; this.rot = 0; this.sx = 1; this.sy = 1; this.z = 9; this.hide = false; this.pivot = "50% 50%";
    layer.appendChild(this.el);
    if (cur) cur.props.push(this);
  }
  Prop.prototype.apply = function () {
    const s = this.el.style;
    s.left = (this.x - this.w / 2).toFixed(1) + "px"; s.bottom = this.b.toFixed(1) + "px";
    s.transform = `rotate(${this.rot.toFixed(1)}deg) scale(${this.sx.toFixed(3)}, ${this.sy.toFixed(3)})`;
    s.transformOrigin = this.pivot; s.zIndex = String(this.z); s.visibility = this.hide ? "hidden" : "";
  };
  Prop.prototype.remove = function () { this.el.remove(); this.dead = true; };
  // 포물선으로 날아가요
  Prop.prototype.arc = function* (tx, tb, h, sec, spin) {
    const x0 = this.x, b0 = this.b, r0 = this.rot;
    yield* wait(sec, (k) => { this.x = x0 + (tx - x0) * k; this.b = b0 + (tb - b0) * k + Math.sin(k * Math.PI) * h; this.rot = r0 + (spin || 0) * k; });
  };
  // 통통 튀다가 굴러서 멈춰요 (눈알, 돌멩이)
  Prop.prototype.bounce = function* (vx, vy, floor) {
    const f = floor == null ? 4 : floor;
    let n = 0;
    for (;;) {
      const dt = yield;
      vy -= 1300 * dt; this.x += vx * dt; this.b += vy * dt; this.rot += vx * dt * 5;
      if (this.x < 8) { this.x = 8; vx = Math.abs(vx) * 0.6; } if (this.x > W - 8) { this.x = W - 8; vx = -Math.abs(vx) * 0.6; }
      if (this.b <= f && vy < 0) { this.b = f; if (-vy < 90 || n > 4) break; vy = -vy * 0.55; vx *= 0.75; n++; dust(this.x, f, 2); }
    }
    yield* wait(0.5, (k) => { this.x += vx * (1 - k) * 0.016; this.rot += vx * (1 - k) * 0.08; });
  };

  // ---------- 사람 ----------
  const people = {};
  function Person(who, el) { this.who = who; this.el = el; this.on = false; this.owner = null; this.h0 = 0; this.x = 0; this.reset(); }
  // 집 자리: 두 사람 묶음이 산책으로 움직이면 같이 움직여요
  Object.defineProperty(Person.prototype, "home", { get() { return this.h0 + cOff; } });
  Person.prototype.reset = function () { this.y = 0; this.rot = 0; this.sx = 1; this.sy = 1; this.dir = "down"; this.flip = false; this.frame = 0; this.pose = ""; this.face = ""; this.cut = ""; this.clip = 0; this.pivot = "feet"; this.z = ""; this.hide = false; };
  Object.defineProperty(Person.prototype, "b", { get() { return GY + this.y; } });
  Person.prototype.measure = function () {
    const sr = scene.getBoundingClientRect();
    readOff();
    if (!this.on) {
      // 평소: 그림 속 자리 그대로 (제 동작으로 살짝 옮겨 있던 만큼은 빼요)
      const r = this.el.getBoundingClientRect(), st = CA() && CA().state(this.who);
      this.h0 = r.left - sr.left + r.width / 2 - ((st && st.dx) || 0) - cOff;
      return this.home;
    }
    const s = this.el.style, keep = [s.translate, s.rotate, s.scale];
    s.translate = ""; s.rotate = ""; s.scale = "";
    const r = this.el.getBoundingClientRect();
    this.h0 = r.left - sr.left + r.width / 2 - cOff;
    s.translate = keep[0]; s.rotate = keep[1]; s.scale = keep[2];
    return this.home;
  };
  // 축을 바꿔도 몸이 그 자리에 그대로 있게 (발, 몸 가운데, 머리)
  Person.prototype.setPivot = function (to) {
    const from = this.pivot;
    if (from === to) return this;
    const th = (this.rot * Math.PI) / 180, hA = PIV[from], hB = PIV[to];
    const cA = from === "feet" ? lieUp(this.rot) : 0, cB = to === "feet" ? lieUp(this.rot) : 0;
    this.x += (hB - hA) * Math.sin(th);
    this.y = this.y + cA + hA + (hB - hA) * Math.cos(th) - hB - cB;
    this.pivot = to;
    return this;
  };
  // 돌아간 각도를 -180~180 으로 (보이는 건 그대로)
  Person.prototype.norm = function () { this.rot = ((((this.rot + 180) % 360) + 360) % 360) - 180; return this; };
  Person.prototype.take = function () {
    if (!this.on) { this.measure(); const st = CA() && CA().state(this.who); this.x = this.home + ((st && st.dx) || 0); this.reset(); this.on = true; this.el.classList.add("puppet"); if (CA()) CA().ctl(this.who, this); }
    this.owner = cur;
    if (cur && cur.people.indexOf(this) < 0) cur.people.push(this);
    // 조각 그림을 미리 준비해 둬요 (흩어지는 첫 순간에 빈 그림이 뜨지 않게)
    if (!this.pre) { this.pre = Object.keys(PARTS).concat("body").map((n) => { const im = new Image(); im.src = S.charCut(this.who, "down", 0, "", n === "head" ? "hit" : "", n); return im; }); setTimeout(() => { this.pre = null; }, 20000); }
    return this;
  };
  Person.prototype.drop = function () {
    this.on = false; this.owner = null; this.reset();
    const s = this.el.style;
    s.translate = ""; s.rotate = ""; s.scale = ""; s.transformOrigin = ""; s.clipPath = ""; s.zIndex = ""; s.visibility = "";
    this.el.classList.remove("puppet", "nohead");
    if (CA()) CA().ctl(this.who, null);
  };
  Person.prototype.apply = function () {
    if (!this.on) return;
    const s = this.el.style;
    s.translate = `${(this.x - this.home).toFixed(1)}px ${(-this.y - (this.pivot === "feet" ? lieUp(this.rot) : 0)).toFixed(1)}px`;
    s.rotate = this.rot ? this.rot.toFixed(1) + "deg" : "";
    s.scale = this.sx !== 1 || this.sy !== 1 ? `${this.sx.toFixed(3)} ${this.sy.toFixed(3)}` : "";
    s.transformOrigin = this.pivot === "mid" ? "50% 55%" : this.pivot === "head" ? "50% 30%" : "50% 100%";
    s.clipPath = this.clip ? `inset(-60px -60px ${this.clip.toFixed(0)}px -60px)` : "";
    s.zIndex = this.z === "" ? "" : String(this.z);
    s.visibility = this.hide ? "hidden" : "";
    this.el.classList.toggle("nohead", this.cut === "body" || this.hide);
    couple.style.zIndex = "8";
    if (CA()) CA().paint(this.who);
  };
  Person.prototype.say = function (text, ms) { bubble(this, text, ms); };
  Person.prototype.look = function (x) { this.dir = "side"; this.flip = (typeof x === "number" ? x : x.x) < this.x; this.frame = 0; return this; };
  Person.prototype.front = function () { this.dir = "down"; this.flip = false; this.frame = 0; this.pose = ""; return this; };
  Person.prototype.fwd = function () { return this.flip ? -1 : 1; }; // 옆을 볼 때 보는 쪽
  // 걷기. o: { back 뒷걸음, pose, hop 깡충, sneak 살금살금 }
  Person.prototype.walk = function* (tx, speed, o) {
    o = o || {};
    tx = clamp(tx, 18, W - 18);
    const d = Math.sign(tx - this.x) || 1, sp = speed || 46;
    this.dir = "side"; this.flip = o.back ? d > 0 : d < 0;
    if (o.pose !== undefined) this.pose = o.pose;
    let t = 0;
    while (Math.abs(tx - this.x) > 0.6) {
      const dt = yield;
      t += dt;
      const go = o.sneak ? (Math.floor(t / 0.34) % 2 ? 0 : 1) : 1; // 살금살금: 한 발 떼고 멈칫
      this.x += d * Math.min(Math.abs(tx - this.x), sp * dt * go);
      const c = Math.floor(t / (o.sneak ? 0.17 : clamp(7.2 / sp, 0.07, 0.2))) % 4;
      this.frame = c === 1 ? 1 : c === 3 ? 2 : 0;
      this.y = o.hop ? Math.abs(Math.sin(t * 9)) * o.hop : 0;
    }
    this.frame = 0; this.y = 0;
  };
  // 제자리 뛰기: 웅크렸다가, 뛰고, 닿을 때 살짝 눌려요
  Person.prototype.hop = function* (h, sec) {
    yield* tween(this, { sy: 0.88, sx: 1.08 }, 0.07, E.out);
    this.sx = 0.95; this.sy = 1.07;
    yield* wait(sec || 0.34, (k) => { this.y = Math.sin(k * Math.PI) * h; if (k > 0.5) { this.sx = 1; this.sy = 1; } });
    this.y = 0; this.sx = 1.1; this.sy = 0.86;
    yield* tween(this, { sx: 1, sy: 1 }, 0.12, E.back);
  };
  // 한 번 눌렸다가 탱 하고 돌아와요
  Person.prototype.squash = function* (sx, sy, sec) { yield* tween(this, { sx, sy }, 0.05, E.out); yield* wait(sec || 0.08); yield* tween(this, { sx: 1, sy: 1 }, 0.3, E.el); };
  Person.prototype.jitter = function* (sec, amp, hz) { const x0 = this.x; yield* wait(sec, (k, dt, t) => { this.x = x0 + (Math.floor(t * (hz || 22)) % 2 ? 1 : -1) * (amp || 1.5); }); this.x = x0; };
  Person.prototype.lean = function* (deg, sec, ease) { yield* tween(this, { rot: deg }, sec || 0.12, ease || E.out); };
  // 뱅글뱅글 눈에 별이 돌아요
  Person.prototype.dizzy = function* (sec, sway) {
    orbit(this, sec);
    yield* wait(sec, (k, dt, t) => { this.face = "dz" + ((Math.floor(t * 9) % 4) + 1); if (sway) this.rot = Math.sin(t * 5) * 6; });
    this.rot = sway ? 0 : this.rot; this.face = "";
  };
  // 엉엉: 머리를 부여잡고 눈물이 뚝뚝
  Person.prototype.cry = function* (sec) {
    this.front(); this.pose = "clutch";
    const x0 = this.x;
    yield* wait(sec, (k, dt, t) => { this.face = Math.floor(t * 6) % 2 ? "cry1" : "cry2"; this.x = x0 + (Math.floor(t * 11) % 2 ? 1 : -1); if (Math.random() < dt * 7 && PL()) PL().drops(this.x + pick([-12, 12]), this.b + 36, 1, 8, "#bfe6ff"); });
    this.x = x0; this.pose = ""; this.face = "blink";
  };
  // 깔깔: 배를 잡고 들썩들썩
  Person.prototype.laugh = function* (sec) {
    this.pose = ""; this.face = "happy";
    yield* wait(sec, (k, dt, t) => { this.y = Math.abs(Math.sin(t * 13)) * 3; this.rot = Math.sin(t * 13) * 3; if (Math.random() < dt * 3) pow(this.x + rand(-14, 14), this.b + 66, pick(["ㅋ", "ㅋㅋ", "푸핫"]), { ms: 500 }); });
    this.y = 0; this.rot = 0;
  };
  // 부들부들 화내기
  Person.prototype.angry = function* (sec) {
    this.front(); this.face = "m16";
    stick(this, "anger", { dx: 14, db: 58, sec: sec + 0.4, scale: 2 });
    yield* wait(sec, (k, dt, t) => { this.y = Math.floor(t * 7) % 2 ? 2 : 0; this.pose = Math.floor(t * 3.5) % 2 ? "raise" : ""; });
    this.y = 0; this.pose = "";
  };
  // 뒤로 벌러덩 (또는 앞으로 철퍼덕)
  Person.prototype.fall = function* (dirn) {
    this.setPivot("feet");
    yield* tween(this, { rot: 90 * dirn }, 0.26, E.in);
    dust(this.x + 26 * dirn, GY, 6); quake(2);
    yield* tween(this, { sx: 1.08 }, 0.05); yield* tween(this, { sx: 1 }, 0.12, E.back);
  };
  // 누워 있다가 영차 일어나기
  Person.prototype.getUp = function* () {
    this.setPivot("feet").norm();
    this.sx = 1; this.sy = 1;
    if (Math.abs(this.rot) < 20) { if (this.rot || this.y) yield* tween(this, { rot: 0, y: 0 }, 0.12, E.out); this.rot = 0; this.y = 0; return; }
    if (Math.abs(this.rot) > 135) yield* tween(this, { rot: this.rot > 0 ? 90 : -90, y: 0 }, 0.2, E.io); // 거꾸로 서 있었으면 먼저 옆으로 눕고
    this.face = "blink"; this.pose = "";
    yield* tween(this, { rot: this.rot * 0.82, y: 0 }, 0.12, E.out);
    yield* tween(this, { rot: 0 }, 0.3, E.back);
    this.rot = 0;
    this.front();
    yield* this.squash(1.06, 0.94, 0.04);
  };
  // 공중에서 돌던 몸을 바로 세워 발로 딛기
  Person.prototype.upright = function* () {
    this.setPivot("mid");
    const r = Math.round(this.rot / 360) * 360;
    if (Math.abs(this.rot - r) > 1 || this.y) yield* tween(this, { rot: r, y: 0 }, 0.09, E.out);
    this.rot = 0; this.setPivot("feet"); this.y = 0;
  };
  // 고개를 도리도리 털기
  Person.prototype.shakeHead = function* (n) { for (let i = 0; i < (n || 4); i++) { this.dir = "side"; this.flip = i % 2 === 0; yield* wait(0.07); } this.front(); };
  // 날아가기: 벽과 바닥에 부딪혀요. o: { brk 벽에 세게 부딪히면 흩어짐, spin, noLand }
  Person.prototype.launch = function* (vx, vy, o) {
    o = o || {};
    const p = this, f = { vx, vy, src: p, hit: [] };
    p.setPivot("mid"); p.dir = "down"; p.frame = 0; p.pose = o.pose == null ? "raise" : o.pose; p.face = o.face || "hit"; p.z = 9; p.sx = 1; p.sy = 1; p.clip = 0;
    flyers.push(f);
    let n = 0, t = 0, res = "land";
    try {
      for (;;) {
        const dt = yield;
        t += dt;
        f.vy -= 1500 * dt; p.x += f.vx * dt; p.y += f.vy * dt; p.rot += (f.vx * 1.25 + (o.spin || 0)) * dt;
        if (t > 0.5) p.face = Math.floor(t * 8) % 2 ? "hit" : "ko";
        const hw = 18;
        if ((p.x < hw && f.vx < 0) || (p.x > W - hw && f.vx > 0)) {
          const side = p.x < hw ? -1 : 1, sp = Math.abs(f.vx);
          p.x = side < 0 ? hw : W - hw;
          if (o.brk && sp > 330) { yield* shatter(p, side, sp); return "broken"; }
          f.vx = -side * sp * 0.42;
          if (sp > 150) { pow(p.x - side * 8, p.b + 44, pick(["쿵!", "퍽!", "꽝!"]), { big: sp > 400 }); stars(p.x, p.b + 40, 4); quake(sp > 400 ? 3 : 1.5); p.sx = 0.7; p.sy = 1.2; fork(tween(p, { sx: 1, sy: 1 }, 0.3, E.el)); }
        }
        if (p.y > H - 78 && f.vy > 0) { p.y = H - 78; f.vy = -f.vy * 0.4; pow(p.x, H - 22, "쿵!"); }
        if (p.y <= 0 && f.vy < 0) {
          if (inPond(p.x)) { res = "pond"; break; }
          p.y = 0;
          if (-f.vy > 300 && n < 2) { n++; f.vy = -f.vy * 0.36; f.vx *= 0.65; dust(p.x, GY, 6); quake(1.5); if (n === 1) pow(p.x, GY + 30, pick(["쿠당", "털썩", "철퍼덕"])); }
          else break;
        }
      }
    } finally { const i = flyers.indexOf(f); if (i >= 0) flyers.splice(i, 1); }
    if (res === "pond") { yield* splashIn(p); return res; }
    if (o.noLand) return res;
    // 바닥에 대자로 뻗어요: 돌던 방향 그대로 가장 가까운 누운 각도까지 마저 돌아요
    const lie = Math.round((p.rot - 90) / 180) * 180 + 90;
    p.pose = ""; p.face = "ko";
    dust(p.x, GY, 5);
    yield* tween(p, { rot: lie, y: -11 }, 0.1, E.out);
    p.x = clamp(p.x, 46, W - 46);
    p.setPivot("feet").norm(); p.y = 0;
    yield* tween(p, { sx: 1.08 }, 0.05); yield* tween(p, { sx: 1 }, 0.14, E.back);
    return res;
  };
  // 연못에 풍덩
  function* splashIn(p) {
    const P = PL();
    p.sx = 1; p.sy = 1; p.front(); p.face = "hit"; p.pose = "raise"; p.z = "";
    P.ring(p.x); P.drops(p.x, 14, 18, 34, "#bfe6ff"); pow(p.x, 40, "풍덩!", { big: true });
    // 물보라 속에서 몸을 바로 하며 가라앉아요
    p.setPivot("mid"); p.clip = 30;
    yield* tween(p, { rot: Math.round(p.rot / 360) * 360, y: -26, x: clamp(p.x, pond.x0 + 24, pond.x1 - 16) }, 0.14, E.out);
    p.rot = 0; p.setPivot("feet"); p.y = -26;
    const hip = P.ents.find((e) => e.kind === "hippo" && e.swim && !e.held && !e.thrown);
    if (hip) P.say(hip, pick(["뿌?!", "누구야!", "내 연못인데…"]));
    yield* wait(0.5, (k) => { p.y = -26 - Math.sin(k * Math.PI) * 10; });
    yield* wait(0.9, (k, dt, t) => { p.y = -26 + Math.sin(t * 7) * 2; p.face = "blink"; p.pose = ""; });
    // 물을 푸우 뿜어요
    p.face = "hit"; p.say(pick(["푸우!", "어푸어푸", "차가워!"]));
    for (let i = 0; i < 5; i++) { P.drops(p.x, p.b + 46, 3, 10, "#bfe6ff"); yield* wait(0.07); }
    yield* climbOut(p);
  }
  // 물가로 헤엄쳐 나와서 부르르 털어요
  function* climbOut(p) {
    const P = PL();
    const out = pond.x1 + 22;
    p.dir = "side"; p.flip = false;
    yield* wait(Math.abs(out - 14 - p.x) / 30, (k, dt, t) => { p.x += Math.min(30 * dt, Math.max(0, out - 14 - p.x)); p.y = -26 + Math.sin(t * 9) * 2; p.frame = Math.floor(t * 5) % 2 ? 1 : 2; if (Math.random() < dt * 4) P.ring(p.x - 8); });
    const x0 = p.x;
    p.clip = 0; p.pose = "raise";
    yield* wait(0.36, (k) => { p.x = x0 + (out - x0) * k; p.y = -26 * (1 - k) + Math.sin(k * Math.PI) * 22; });
    p.y = 0; p.x = out; p.pose = "";
    P.drops(p.x, GY + 4, 8, 16, "#bfe6ff");
    yield* p.squash(1.12, 0.86, 0.04);
    // 부르르 털기
    p.front(); p.face = "blink";
    fork(wait(0.7, (k, dt) => { if (Math.random() < dt * 26) P.drops(p.x + rand(-14, 14), p.b + rand(20, 50), 1, 16, "#bfe6ff"); }));
    yield* p.jitter(0.7, 2, 26);
    p.face = "hit"; p.say("에취!");
    yield* p.hop(5, 0.2);
    p.face = "";
  }

  // ---------- 조각: 머리, 몸통, 팔, 다리 ----------
  const PARTS = { head: [30, 36, 21], torso: [30, 60, 7], armL: [15, 60, 6], armR: [45, 60, 6], legL: [24, 72, 6], legR: [36, 72, 6] };
  function Part(who, name, face) {
    const d = PARTS[name];
    this.who = who; this.name = name; this.cx = d[0]; this.cy = d[1]; this.r = d[2];
    this.x = 0; this.b = 0; this.rot = 0; this.sx = 1; this.sy = 1; this.vx = 0; this.vy = 0; this.vr = 0; this.z = name === "head" ? 10 : 9; this.dir = "down"; this.face = face || ""; this.flip = false;
    this.el = document.createElement("img");
    this.el.className = "play-part"; this.el.style.width = CW + "px"; this.el.style.transformOrigin = `${this.cx}px ${this.cy}px`;
    layer.appendChild(this.el);
    if (cur) cur.props.push(this);
  }
  Part.prototype.rest = function () { return GY + (this.name === "head" ? 18 : 6); };
  // 사람이 (ax, ab)에 서 있을 때 이 조각이 있어야 할 자리
  Part.prototype.at = function (ax, ab) { return { x: ax - 30 + this.cx, b: ab + CH - this.cy }; };
  Part.prototype.apply = function () {
    const src = S.charCut(this.who, this.dir, 0, "", this.face, this.name);
    if (src !== this.src) { this.el.src = src; this.src = src; }
    const s = this.el.style;
    s.left = (this.x - this.cx).toFixed(1) + "px"; s.bottom = (this.b - (CH - this.cy)).toFixed(1) + "px";
    s.transform = `rotate(${this.rot.toFixed(1)}deg) scale(${(this.sx * (this.flip ? -1 : 1)).toFixed(3)}, ${this.sy.toFixed(3)})`;
    s.zIndex = String(this.z);
  };
  Part.prototype.remove = function () { this.el.remove(); this.dead = true; };
  Part.prototype.say = function (t, ms) { bubble(this, t, ms); };
  // 공처럼 날아가 튀고 구르다 멈춰요
  Part.prototype.fly = function* (o) {
    o = o || {};
    const k = this, rest = k.rest(), bnc = o.bounce == null ? 0.42 : o.bounce;
    const f = k.name === "head" ? { vx: k.vx, vy: k.vy, src: k, hit: [] } : null;
    if (f) flyers.push(f);
    let n = 0;
    try {
      for (;;) {
        const dt = yield;
        if (f) { k.vx = f.vx; }
        k.vy -= 1500 * dt; k.x += k.vx * dt; k.b += k.vy * dt; k.rot += k.vr * dt;
        if (k.x < k.r) { k.x = k.r; if (Math.abs(k.vx) > 200) { pow(k.x + 8, k.b, "통!"); stars(k.x, k.b, 2); } k.vx = Math.abs(k.vx) * 0.5; k.vr = -k.vr * 0.6; }
        if (k.x > W - k.r) { k.x = W - k.r; if (Math.abs(k.vx) > 200) { pow(k.x - 8, k.b, "통!"); stars(k.x, k.b, 2); } k.vx = -Math.abs(k.vx) * 0.5; k.vr = -k.vr * 0.6; }
        if (k.b > H - k.r) { k.b = H - k.r; k.vy = -Math.abs(k.vy) * 0.4; }
        if (f) { f.vx = k.vx; f.vy = k.vy; }
        if (k.b <= rest && k.vy < 0) {
          k.b = rest;
          if (-k.vy < 110 || n > 5) break;
          k.vy = -k.vy * bnc; k.vx *= 0.72; k.vr = k.vx * (360 / (2 * Math.PI * k.r)); n++;
          dust(k.x, GY, 2);
          k.sy = 0.8; k.sx = 1.15;
        }
        k.sx += (1 - k.sx) * Math.min(1, dt * 14); k.sy += (1 - k.sy) * Math.min(1, dt * 14);
      }
    } finally { if (f) { const i = flyers.indexOf(f); if (i >= 0) flyers.splice(i, 1); } }
    k.sx = 1; k.sy = 1;
    // 데굴데굴 구르다 멈춰요
    let v = k.vx;
    while (Math.abs(v) > 6) { const dt = yield; v *= Math.pow(0.08, dt); k.x = clamp(k.x + v * dt, k.r, W - k.r); k.rot += v * dt * (360 / (2 * Math.PI * k.r)); }
    k.vx = 0; k.vy = 0; k.vr = 0;
  };
  // 조각이 제 발로 가요: 다리는 종종걸음, 몸통과 팔은 자벌레처럼, 머리는 데굴데굴
  Part.prototype.go = function* (tx, speed) {
    const k = this, d = Math.sign(tx - k.x) || 1, rest = k.rest();
    let t = 0;
    const leg = k.name === "legL" || k.name === "legR", head = k.name === "head";
    while (Math.abs(tx - k.x) > 1) {
      const dt = yield;
      t += dt;
      if (head) { const st = d * Math.min(Math.abs(tx - k.x), speed * dt); k.x += st; k.rot += st * (360 / (2 * Math.PI * k.r)); k.b = rest; }
      else if (leg) { k.x += d * Math.min(Math.abs(tx - k.x), speed * dt); k.rot = Math.sin(t * 22) * 13; k.b = rest + Math.abs(Math.sin(t * 22)) * 3; }
      else { const ph = (t * 4.5) % 1, go = ph < 0.5; k.sx = 1 + Math.sin(ph * Math.PI * 2) * 0.22; k.sy = 1 - Math.sin(ph * Math.PI * 2) * 0.14; if (go) k.x += d * Math.min(Math.abs(tx - k.x), speed * 2 * dt); k.b = rest + 2; k.rot += (0 - k.rot) * Math.min(1, dt * 8); }
    }
    k.x = tx; k.sx = 1; k.sy = 1; if (!head) k.rot = 0;
  };
  // 폴짝 뛰어서 제자리에 착
  Part.prototype.jump = function* (tx, tb, h, sec) {
    const k = this, x0 = k.x, b0 = k.b, r0 = k.rot % 360;
    yield* tween(k, { sy: 0.75, sx: 1.2 }, 0.08, E.out);
    k.sx = 0.9; k.sy = 1.15;
    yield* wait(sec || 0.3, (q) => { k.x = x0 + (tx - x0) * q; k.b = b0 + (tb - b0) * q + Math.sin(q * Math.PI) * h; k.rot = r0 * (1 - E.out(q)); });
    k.x = tx; k.b = tb; k.rot = 0; k.sx = 1.18; k.sy = 0.82;
    yield* tween(k, { sx: 1, sy: 1 }, 0.16, E.back);
  };
  // 사람을 여섯 조각으로
  function burst(p, dirn, speed, o) {
    o = o || {};
    const parts = {};
    Object.keys(PARTS).forEach((n) => {
      const k = new Part(p.who, n, n === "head" ? "hit" : "");
      const a = k.at(0, 0), th = (p.rot * Math.PI) / 180, vx = a.x, vb = a.b - PIV[p.pivot] - (p.pivot === "feet" ? 0 : 0);
      const px = p.x, pb = p.b + PIV[p.pivot] + (p.pivot === "feet" ? lieUp(p.rot) : 0);
      k.x = clamp(px + vx * Math.cos(th) + vb * Math.sin(th), k.r + 2, W - k.r - 2); k.b = Math.max(pb - vx * Math.sin(th) + vb * Math.cos(th), k.rest()); k.rot = p.rot;
      k.vx = -dirn * rand(30, 150) + rand(-40, 40); k.vy = rand(160, 400) + (n === "head" ? 80 : 0); k.vr = rand(-720, 720);
      parts[n] = k;
    });
    p.hide = true;
    return parts;
  }
  // 흩어진 조각들이 스스로 모여서 다시 한 사람이 돼요
  function* assemble(p, parts, G) {
    const head = parts.head, legs = [parts.legL, parts.legR], arms = [parts.armL, parts.armR], torso = parts.torso;
    G = landX(G);
    const tgt = (k) => k.at(G, GY);
    // 1) 머리가 먼저 정신을 차려요
    head.face = "ko";
    yield* wait(0.45);
    yield* tween(head, { rot: Math.round(head.rot / 360) * 360 }, 0.25, E.back);
    head.rot = 0; head.face = "hit";
    head.say(pick(["어…? 내 몸!", "다 흩어졌네", "팔다리 모여!", "어디 갔어 내 다리"]), 1400);
    fork((function* () { for (let i = 0; i < 4; i++) { head.flip = i % 2 === 0; head.dir = "side"; yield* wait(0.22); } head.dir = "down"; head.flip = false; })());
    yield* wait(0.5);
    if (Math.abs(head.x - G) < 48) { const sd = G + 56 < W - 24 ? 1 : -1; head.face = "blink"; yield* head.go(G + sd * 56, 110); head.rot = 0; head.face = "hit"; }
    // 2) 다리 둘이 벌떡 일어나 종종걸음으로 오고, 그동안 몸통과 팔도 꿈틀꿈틀 가까이 기어와요
    const near = (k, gap) => { const t = tgt(k).x, d = Math.sign(k.x - t) || (k.name === "armL" ? -1 : 1); return landX(t + d * gap); };
    const crawl = all(torso.go(near(torso, 20), 70), arms[0].go(near(arms[0], 30), 80), arms[1].go(near(arms[1], 30), 80));
    let crawled = false;
    fork((function* () { yield* crawl; crawled = true; })());
    yield* all.apply(null, legs.map((k, i) => (function* () {
      yield* wait(i * 0.14);
      yield* k.jump(k.x, k.rest(), 12, 0.2);
      yield* k.go(tgt(k).x, 120);
      yield* k.jump(tgt(k).x, tgt(k).b, 6, 0.18);
      dust(k.x, GY, 2);
    })()));
    pow(G, GY + 16, "착!", { ms: 420 });
    yield* until(() => crawled, 6);
    // 3) 몸통이 다리 위로 폴짝
    yield* torso.jump(tgt(torso).x, tgt(torso).b, 26, 0.28);
    pow(G, GY + 30, "철컥", { ms: 420 });
    legs.forEach((k) => { k.sy = 0.8; fork(tween(k, { sy: 1 }, 0.25, E.el)); });
    // 4) 팔이 하나씩 어깨에 착, 착
    for (let i = 0; i < 2; i++) {
      const k = arms[i], side = i ? 1 : -1;
      yield* k.jump(tgt(k).x, tgt(k).b, 18, 0.2);
      pow(G + side * 16, GY + 34, "착", { ms: 320 });
      torso.rot = -side * 7; fork(tween(torso, { rot: 0 }, 0.2, E.el));
    }
    // 5) 머리가 데굴데굴 굴러와서 크게 뛰어올라 톡
    const side = head.x < G ? -1 : 1;
    head.face = "happy";
    yield* head.go(G + side * 30, 120);
    head.rot = 0; head.face = "";
    yield* wait(0.12);
    const backwards = dec("backw") < 0.4;
    if (backwards) head.dir = "up";
    yield* head.jump(tgt(head).x, tgt(head).b, 46, 0.42);
    [torso].concat(legs, arms).forEach((k) => { k.sy = 0.86; fork(tween(k, { sy: 1 }, 0.3, E.el)); });
    pow(G, GY + 76, "뿅!", { big: true });
    if (backwards) {
      // 앗, 거꾸로 붙었다: 팔이 머리를 더듬더니 휙 돌려요
      yield* wait(0.5);
      head.say(pick(["어? 앞이 안 보여", "거꾸로 붙었다!"]), 1000);
      yield* wait(0.7);
      yield* tween(head, { sx: 0.1 }, 0.1); head.dir = "down"; head.face = "ko"; yield* tween(head, { sx: 1 }, 0.1);
      pow(G, GY + 76, "휙", { ms: 300 });
      yield* wait(0.2);
    }
    // 6) 짠, 다시 한 사람
    stars(G, GY + 44, 7);
    Object.keys(parts).forEach((n) => parts[n].remove());
    p.hide = false; p.reset(); p.x = G; p.z = 9;
    p.face = "happy";
    yield* p.squash(1.14, 0.84, 0.05);
    p.say(pick(["휴, 다 붙었다", "하나도 안 아파!", "다시 조립 완료", "팔이 좀 헐거운데…"]), 1500);
    yield* p.hop(8, 0.26);
    p.face = "";
  }
  // 벽에 세게 부딪혀서 와장창
  function* shatter(p, dirn, speed) {
    p.x = clamp(p.x, 22, W - 22);
    const parts = burst(p, dirn, speed);
    pow(p.x - dirn * 10, clamp(p.b + 46, 30, H - 30), "와장창!", { big: true });
    stars(p.x, p.b + 40, 8); quake(4);
    yield* all.apply(null, Object.keys(parts).map((n) => parts[n].fly()));
    const xs = Object.keys(parts).map((n) => parts[n].x);
    yield* assemble(p, parts, xs.reduce((a, b) => a + b, 0) / xs.length);
  }
  // 머리만 쏙 빼기 / 다시 얹기
  function headOff(p) {
    const head = new Part(p.who, "head", p.face || "hit");
    const a = head.at(p.x, p.b);
    head.x = a.x; head.b = a.b; head.dir = p.dir === "up" ? "up" : "down";
    p.cut = "body";
    return head;
  }
  function headOn(p, head) { head.remove(); p.cut = ""; }
  // 머리 없는 몸이 허둥지둥
  function* panic(p, stop) {
    p.pose = "raise"; p.dir = "side";
    let d = Math.random() < 0.5 ? -1 : 1, t = 0, x1 = clamp(p.x + d * rand(40, 70), 26, W - 26);
    while (!stop()) {
      const dt = yield;
      t += dt;
      p.flip = d < 0; p.x += d * 95 * dt;
      const c = Math.floor(t / 0.07) % 4; p.frame = c === 1 ? 1 : c === 3 ? 2 : 0;
      p.pose = Math.floor(t * 8) % 2 ? "raise" : "wave1";
      if ((d > 0 && p.x >= x1) || (d < 0 && p.x <= x1)) { d = -d; x1 = clamp(p.x + d * rand(40, 90), 26, W - 26); dust(p.x, GY, 2); }
    }
    p.frame = 0; p.pose = "";
  }
  // 몸이 더듬더듬 머리를 찾아가서 주워 얹어요
  function* reunite(p, head) {
    head.face = "dz1";
    const gx = landX(head.x);
    if (Math.abs(gx - head.x) > 2) { head.face = "hit"; yield* head.go(gx, 60); head.rot = 0; }
    head.dir = "down"; head.rot = Math.round(head.rot / 360) * 360; head.face = "blink";
    head.say(pick(["여기야 여기!", "나 여기 있어…", "몸아 이리 와"]), 1300);
    p.pose = "act"; p.front();
    yield* wait(0.3);
    // 더듬더듬: 처음엔 엉뚱한 쪽으로 몇 걸음
    if (dec("wrong") < 0.5) { yield* p.walk(p.x - Math.sign(head.x - p.x || 1) * 16, 26, { pose: "act" }); yield* wait(0.25); pow(p.x, p.b + 50, "?", { ms: 400 }); }
    const side = p.x < head.x ? -1 : 1;
    yield* p.walk(head.x + side * 24, 44, { pose: "act" });
    p.look(head.x); p.pose = "crouch";
    yield* wait(0.25);
    p.pose = "hold"; p.front();
    const a = head.at(p.x, p.b);
    yield* head.jump(a.x, a.b + 14, 10, 0.24);
    head.face = "happy";
    yield* wait(0.18);
    yield* tween(head, { b: a.b }, 0.1, E.in);
    pow(p.x, p.b + 76, "뿅!", { big: true }); stars(p.x, p.b + 56, 5);
    headOn(p, head);
    p.pose = ""; p.face = "happy";
    yield* p.squash(1.1, 0.86, 0.05);
    yield* p.shakeHead(4);
    p.say(pick(["휴 살았다", "목이 좀 돌아간 것 같은데", "다신 뽑지 마!"]), 1400);
    p.face = "";
  }

  // ---------- 동물 다루기 ----------
  const gb = (e) => (e.kind === "cat" ? 4 : 6);
  const ah = (e) => (e.img && e.img.naturalHeight ? e.img.naturalHeight * 2 : 30) * (e.size || 1);
  const aw = (e) => (e.img && e.img.naturalWidth ? e.img.naturalWidth * 2 : 36) * (e.size || 1);
  function hold(e) {
    if (!e.script) { e.script = true; e.tx = 0; e.rot = 0; e.lift = 0; e.sx = 1; e.sy = 1; e.scale = 1; e.face = ""; e.frame = e.kind === "bird" ? "fly1" : "stand"; if (e.kind !== "bird" && e.kind !== "hippo") e.b = gb(e); }
    if (cur && cur.pets.indexOf(e) < 0) cur.pets.push(e);
    return e;
  }
  const A = {
    // 걷기 (새는 날기). o: { fast 달리기 발놀림, back 뒷걸음 }
    move: function* (e, tx, speed, o) {
      o = o || {};
      tx = clamp(tx, 14, W - 14);
      const d = Math.sign(tx - e.x) || 1;
      e.flip = o.back ? d > 0 : d < 0;
      let t = 0;
      while (Math.abs(tx - e.x) > 0.8) {
        const dt = yield;
        t += dt;
        e.x += d * Math.min(Math.abs(tx - e.x), speed * dt);
        if (e.kind === "bird") e.frame = Math.floor(t * 12) % 2 ? "fly1" : "fly2";
        else { const c = Math.floor(t / clamp(5 / speed, 0.06, 0.2)) % 4; e.frame = c === 1 ? "walk1" : c === 3 ? "walk2" : "stand"; }
      }
      if (e.kind !== "bird") e.frame = "stand";
    },
    // 날아서 가기 (새)
    fly: function* (e, tx, tb, speed) {
      const x0 = e.x, b0 = e.b, d = Math.hypot(tx - x0, tb - b0), sec = Math.max(0.12, d / speed);
      e.flip = tx < x0;
      yield* wait(sec, (k, dt, t) => { const q = E.io(k); e.x = x0 + (tx - x0) * q; e.b = b0 + (tb - b0) * q; e.frame = Math.floor(t * 13) % 2 ? "fly1" : "fly2"; e.rot = clamp(-(tb - b0) / sec * 0.12, -24, 24) * (e.flip ? -1 : 1) * Math.sin(k * Math.PI); });
      e.rot = 0;
    },
    hover: function* (e, sec) { const b0 = e.b; yield* wait(sec, (k, dt, t) => { e.frame = Math.floor(t * 12) % 2 ? "fly1" : "fly2"; e.b = b0 + Math.sin(t * 6) * 2; }); e.b = b0; },
    hop: function* (e, h, sec) {
      yield* tween(e, { sy: 0.82, sx: 1.12 }, 0.07, E.out);
      e.sx = 0.94; e.sy = 1.1;
      yield* wait(sec || 0.3, (k) => { e.lift = Math.sin(k * Math.PI) * h; if (k > 0.5) { e.sx = 1; e.sy = 1; } });
      e.lift = 0; e.sx = 1.14; e.sy = 0.84;
      yield* tween(e, { sx: 1, sy: 1 }, 0.14, E.back);
    },
    // 포물선으로 뛰어 옮겨 가기
    leap: function* (e, tx, tb, h, sec) {
      const x0 = e.x, b0 = e.b;
      e.flip = tx < x0;
      yield* tween(e, { sy: 0.8, sx: 1.14 }, 0.09, E.out);
      e.sx = 0.92; e.sy = 1.12; if (e.kind !== "bird") e.frame = "walk1";
      yield* wait(sec || 0.36, (k) => { e.x = x0 + (tx - x0) * k; e.b = b0 + (tb - b0) * k + Math.sin(k * Math.PI) * h; });
      e.x = tx; e.b = tb; e.sx = 1.14; e.sy = 0.84; if (e.kind !== "bird") e.frame = "stand";
      yield* tween(e, { sx: 1, sy: 1 }, 0.14, E.back);
    },
    squash: function* (e, sx, sy, sec) { yield* tween(e, { sx, sy }, 0.05, E.out); yield* wait(sec || 0.08); yield* tween(e, { sx: 1, sy: 1 }, 0.3, E.el); },
    jitter: function* (e, sec, amp, hz) { yield* wait(sec, (k, dt, t) => { e.tx = (Math.floor(t * (hz || 24)) % 2 ? 1 : -1) * (amp || 1.5); }); e.tx = 0; },
    dizzy: function* (e, sec) { orbit(e, sec); yield* wait(sec, (k, dt, t) => { e.face = Math.floor(t * 5) % 2 ? "sweat" : "blink"; e.rot = Math.sin(t * 6) * 8; }); e.rot = 0; e.face = ""; },
    // 던지기: 동물의 말랑한 몸 물리를 그대로 써요 (벽에 철썩 붙기도 해요)
    toss: function* (e, vx, vy) { PL().throwEnt(e, vx, vy); yield* until(() => !e.thrown, 9); e.script = true; e.face = ""; },
    say: (e, t, ms) => PL().say(e, t, ms),
    top: (e) => e.b + (e.lift || 0) + ah(e),
    h: ah, w: aw, gb,
  };

  // ---------- 장난 돌리기 ----------
  function startRun(gen, o) {
    o = o || {};
    const run = { gen: null, forks: [], props: [], people: [], pets: [], auto: !!o.auto, key: o.key || "", t: 0, seed: o.seed == null ? null : o.seed, cnt: {} };
    runs.push(run);
    const prev = cur;
    cur = run;
    try { run.gen = gen(run); if (run.gen.next(0).done) run.gen = null; } catch (err) { console.error(err); run.gen = null; run.bad = true; }
    cur = prev;
    return run;
  }
  function endRun(run, hard) {
    const i = runs.indexOf(run);
    if (i >= 0) runs.splice(i, 1);
    run.props.forEach((k) => { if (!k.dead) k.remove(); });
    run.pets.forEach((e) => { if (e.script) PL().release(e); });
    run.people.forEach((p) => {
      if (p.owner !== run) return;
      if (hard || (Math.abs(p.x - p.home) < 2 && !p.rot && !p.y && !p.hide && !p.cut)) { p.drop(); return; }
      // 아직 집 밖이면 걸어서 돌아가요
      startRun(function* () { p.take(); yield* goHome(p); }, { key: "home" });
    });
    if (!runs.length && couple) couple.style.zIndex = "";
    if (run.auto) nextAt = clock + rand(8, 16); // 한 장난이 끝나면 한숨 돌려요
  }
  function* goHome(p) {
    p.sx = 1; p.sy = 1; p.z = ""; p.hide = false; p.cut = ""; p.clip = 0;
    if (p.y < -8 && Math.abs(p.rot) < 20) yield* tween(p, { y: 0 }, 0.2, E.out); // 연못 속이었다면 올라와요
    yield* p.getUp();
    p.pose = ""; p.face = "";
    p.measure();
    p.dir = "side";
    let t = 0;
    while (Math.abs(p.home - p.x) > 1) {
      const dt = yield;
      t += dt;
      const d = p.home > p.x ? 1 : -1;
      p.flip = d < 0;
      p.x += d * Math.min(Math.abs(p.home - p.x), 60 * dt);
      const c = Math.floor(t / 0.12) % 4; p.frame = c === 1 ? 1 : c === 3 ? 2 : 0;
      if (p.y) p.y += (0 - p.y) * Math.min(1, dt * 10);
    }
    p.x = p.home; p.y = 0; p.front();
  }
  // 하던 장난을 그만두기: 사람은 있던 자리에서 걸어서 돌아오고(순간이동하지 않아요), 동물은 제 버릇으로
  function soften(run, keep) {
    const i = runs.indexOf(run);
    if (i >= 0) runs.splice(i, 1);
    run.props.forEach((k) => { if (!k.dead) k.remove(); });
    run.pets.forEach((e) => { if (e.script) PL().release(e); });
    run.people.forEach((p) => {
      if (p.owner !== run) return;
      p.hide = false; p.cut = ""; p.owner = null;
      if (p === keep) return;
      startRun(function* () { p.take(); yield* goHome(p); }, { key: "home" });
    });
    if (run.auto) nextAt = clock + rand(8, 16);
  }
  function abort(only) {
    runs.slice().forEach((r) => { if (!only || only(r)) endRun(r, true); });
    if (!runs.length) { gfx.slice().forEach((f) => f.end && f.end()); gfx.length = 0; }
  }
  // 그림이 다른 일(산책, 잠, 체조, 선물, 이야기)로 바쁘면 장난은 쉬어요
  function sceneFree() {
    if (!scene || !couple) return false;
    if (couple.classList.contains("walking") || scene.classList.contains("sleeping") || scene.classList.contains("sleepy") || scene.classList.contains("stretch")) return false;
    if (window.Deco && Deco.celebrating && Deco.celebrating()) return false;
    if (window.Tale && Tale.isOpen && Tale.isOpen()) return false;
    if (window.Notes && Notes.busy && Notes.busy()) return false;
    return true;
  }
  function stepRun(run, dt) {
    cur = run;
    try {
      run.t += dt;
      if (run.gen && run.gen.next(dt).done) run.gen = null;
      run.forks = run.forks.filter((g) => !g.next(dt).done);
      if (!run.gen && (!run.forks.length || (run.tEnd = (run.tEnd || 0) + dt) > 6)) endRun(run, false);
      else if (run.t > 70) endRun(run, true);
    } catch (err) { console.error(err); endRun(run, true); }
    cur = null;
  }
  // 날아가는 것에 맞으면 같이 날아가요 (볼링처럼)
  function collide() {
    const P = PL();
    const knockP = (p, vx) => { startRun(function* () { p.take(); pow(p.x, p.b + 50, pick(["퍽!", "쾅!", "뻑!"]), { big: true }); stars(p.x, p.b + 40, 5); quake(2.5); yield* p.launch(vx, rand(300, 420), {}); yield* p.dizzy(0.9); }, { key: "knock" }); };
    flyers.forEach((f) => {
      const sp = Math.hypot(f.vx, f.vy);
      if (sp < 240) return;
      const s = f.src, sx = s.x, sb = s instanceof Person ? s.b + 34 : s.b;
      Object.keys(people).forEach((w) => {
        const p = people[w];
        if (p === s || p.on || f.hit.indexOf(p) >= 0) return;
        p.measure();
        if (Math.abs(sx - p.home) < 26 && Math.abs(sb - (GY + 34)) < 38) { f.hit.push(p); knockP(p, f.vx * 0.55); f.vx *= -0.3; }
      });
      P.ents.forEach((e) => {
        if (e.held || e.thrown || e.script || e.swim || f.hit.indexOf(e) >= 0) return;
        if (Math.abs(sx - e.x) < 22 && Math.abs(sb - (e.b + 14)) < 30) { f.hit.push(e); P.throwEnt(e, f.vx * 0.6, rand(260, 380)); pow(e.x, e.b + 30, pick(["퍽!", "통!"])); stars(e.x, e.b + 20, 4); f.vx *= -0.3; }
      });
    });
    // 손으로 던진 동물에 사람이 맞았을 때
    P.ents.forEach((e) => {
      const t = e.thrown;
      if (!t || t.hit || t.hitP || Math.hypot(t.vx, t.vy) < 280) return;
      Object.keys(people).forEach((w) => {
        const p = people[w];
        if (p.on || t.hitP) return;
        p.measure();
        if (Math.abs(e.x - p.home) < 24 && e.b > GY - 4 && e.b < GY + 62) { t.hitP = true; knockP(p, t.vx * 0.5); t.vx *= -0.35; t.vy = Math.abs(t.vy) * 0.5 + 120; }
      });
    });
  }
  function tick(dt) {
    if (!ensure()) return;
    clock += dt;
    if (people.him && (people.him.on || people.her.on)) readOff();
    const free = sceneFree();
    if (!free) { runs.slice().forEach((r) => { if (r.auto) soften(r); }); busyAt = clock; }
    runs.slice().forEach((r) => stepRun(r, dt));
    collide();
    Object.keys(people).forEach((w) => people[w].apply());
    runs.forEach((r) => r.props.forEach((k) => { if (!k.dead) k.apply(); }));
    tryPending();
    for (let i = gfx.length - 1; i >= 0; i--) if (!gfx[i].update(dt)) { if (gfx[i].end) gfx[i].end(); gfx.splice(i, 1); }
    // 가끔 저절로 장난이 시작돼요
    if (free && !paused && !runs.length && clock > nextAt && clock - busyAt > 12 && CA() && CA().free() && !document.body.classList.contains("sheet-open")) {
      nextAt = clock + rand(9, 17);
      auto();
    }
  }

  // ---------- 장난 목록 ----------
  const DEFS = [], BY = {};
  function def(d) { DEFS.push(d); BY[d.id] = d; }
  function cast() {
    const P = PL(), E2 = P.env ? P.env() : {};
    const ok = (e) => !e.held && !e.thrown && !e.script && e.kind !== "egg" && !e.busy;
    const pets = P.ents.filter(ok);
    return {
      env: E2, him: people.him, her: people.her,
      ground: pets.filter((e) => (e.kind === "sheep" || e.kind === "cat") && !(e.st === "sleep" || e.st === "nap")),
      birds: pets.filter((e) => e.kind === "bird" && e.st !== "roost"),
      hippo: pets.find((e) => e.kind === "hippo" && e.swim) || null,
      cats: pets.filter((e) => e.kind === "cat"),
    };
  }
  function play(id, o) {
    if (!ensure()) return false;
    const d = BY[id];
    if (!d) return false;
    abort();
    const c = cast();
    const args = d.pick(c, o || {});
    if (!args) return false;
    begin(d, args, o && o.seed != null ? o.seed : Math.floor(Math.random() * 2147483647));
    return true;
  }
  // 누가 나오는지 적어 보내기 / 받아서 다시 찾기
  function pack(args) {
    const o = {};
    Object.keys(args).forEach((k) => { const v = args[k]; if (v instanceof Person) o[k] = "P:" + v.who; else if (v && v.el && v.id && v.kind) o[k] = "E:" + v.id; else if (Array.isArray(v)) o[k] = v.map((e) => "E:" + e.id); });
    return o;
  }
  function unpack(o) {
    const args = { o: {} };
    const ent = (t) => PL().ents.find((e) => "E:" + e.id === t && !e.held && !e.thrown && !e.script && e.kind !== "egg") || null;
    for (const k of Object.keys(o || {})) {
      const v = o[k];
      if (Array.isArray(v)) { const l = v.map(ent); if (l.some((e) => !e)) return null; args[k] = l; }
      else if (/^P:/.test(v)) { const p = people[v.slice(2)]; if (!p || p.on) return null; args[k] = p; }
      else if (/^E:/.test(v)) { const e = ent(v); if (!e) return null; args[k] = e; }
    }
    return args;
  }
  function begin(d, args, seed) {
    hist.push(d.id); if (hist.length > Math.min(14, Math.max(2, DEFS.length - 3))) hist.shift();
    startRun(function* () { yield* d.run(args, cast()); const ps = cur.people.slice(); yield* all.apply(null, ps.map((p) => goHome(p))); }, { auto: true, key: d.id, seed });
  }
  function auto() {
    const c = cast();
    const pool = [];
    DEFS.forEach((d) => { if (hist.indexOf(d.id) >= 0) return; if (c.env.night && !d.night) return; for (let i = 0; i < (d.w || 2); i++) pool.push(d); });
    for (let tries = 0; tries < 8 && pool.length; tries++) {
      const d = pool[Math.floor(Math.random() * pool.length)], args = d.pick(c, {});
      if (!args) continue;
      const seed = Math.floor(Math.random() * 2147483647);
      if (window.Live) Live.send("prank", { id: d.id, seed, cast: pack(args) });
      begin(d, args, seed);
      return;
    }
    hist.length = 0;
  }
  // 상대 폰에서 장난이 시작됐어요: 같은 장난을 같은 씨앗으로 따라 해요
  let pending = null;
  const myWho = () => (window.Store && Store.me && Store.me()) || "";
  function remotePrank(m, meta) {
    if (!ensure() || !BY[m.id] || !sceneFree()) return;
    if (runs.some((r) => !r.auto && r.key !== "home")) return; // 손으로 던지고 노는 중이면 그게 먼저예요
    const mine = runs.find((r) => r.auto);
    // 거의 동시에 서로 다른 장난을 시작했다면 석영 폰 것을 따라요
    if (mine && mine.t < 2.5 && myWho() === "him" && !(meta && meta.w === "him")) return;
    runs.slice().forEach((r) => { if (r.auto) soften(r); });
    pending = { m, until: clock + 5 };
  }
  function tryPending() {
    if (!pending) return;
    if (clock > pending.until) { pending = null; return; }
    if (runs.length) return; // 사람들이 제자리로 돌아올 때까지 잠깐 기다려요
    const m = pending.m, d = BY[m.id];
    pending = null;
    const args = unpack(m.cast);
    if (!args || (d.chk && !d.chk(args))) return;
    begin(d, args, m.seed);
  }
  if (window.Live) Live.on("prank", remotePrank);

  // ---------- 사람을 손으로 끌어서 던지기 ----------
  function bindDrag(p) {
    const el = p.el;
    let g = null;
    el.addEventListener("pointerdown", (ev) => {
      if (!ensure()) return;
      const r = el.getBoundingClientRect();
      g = { x0: ev.clientX, y0: ev.clientY, px: ev.clientX, py: ev.clientY, pt: performance.now(), vx: 0, vy: 0, moved: false, headZone: ev.clientY - r.top < r.height * 0.5, id: ev.pointerId };
    });
    el.addEventListener("pointermove", (ev) => {
      if (!g) return;
      if (!g.moved) {
        if (Math.hypot(ev.clientX - g.x0, ev.clientY - g.y0) < 10) return;
        if (!grab(p, g)) { g = null; return; }
        g.moved = true;
        try { el.setPointerCapture(g.id); } catch (e) { /* 괜찮아요 */ }
      }
      const now = performance.now(), dt = Math.max(8, now - g.pt) / 1000;
      g.vx = g.vx * 0.5 + ((ev.clientX - g.px) / dt) * 0.5; g.vy = g.vy * 0.5 + ((ev.clientY - g.py) / dt) * 0.5;
      g.px = ev.clientX; g.py = ev.clientY; g.pt = now;
      const sr = scene.getBoundingClientRect();
      g.tx = clamp(ev.clientX - sr.left, 14, W - 14); g.tb = clamp(sr.bottom - ev.clientY, 0, H - 8);
      ev.preventDefault();
    });
    const up = (ev) => {
      if (!g) return;
      const h = g; g = null;
      if (!h.moved) return;
      dragAt = Date.now();
      const stale = performance.now() - h.pt > 130;
      h.done = { vx: stale ? 0 : clamp(h.vx, -950, 950), vy: stale ? 0 : clamp(-h.vy, -700, 1050) };
    };
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  }
  const rheld = {}; // 상대 폰에서 잡고 있는 사람
  function grab(p, g) {
    if (window.Deco && Deco.celebrating && Deco.celebrating()) return false;
    if (window.Notes && Notes.busy && Notes.busy()) return false;
    runs.slice().forEach((r) => { if (r.auto || r.key === "home") soften(r, p); });
    if (p.on && p.owner) return false; // 이미 날아가는 중이거나 조립 중이면 건드리지 않아요
    g.pop = g.headZone && Math.random() < 0.35; // 머리 쪽을 잡으면 가끔 머리만 쏙
    if (window.Live) Live.send("pgrab", { who: p.who, pop: g.pop });
    held(p, g, false);
    return true;
  }
  // 잡혀서 대롱대롱 → 놓으면 날아가기. remote 면 상대 폰이 보내 주는 손가락 자리를 따라가요.
  function held(p, g, remote) {
    const other = people[p.who === "him" ? "her" : "him"];
    if (window.HSD && HSD.bubble && other && !other.on) HSD.bubble(pick(["어어, 어디 가!", "내려놔~", "살살 해", "ㅋㅋㅋ 들렸다"]), other.who);
    startRun(function* () {
      p.take();
      p.setPivot("feet").norm();
      if (Math.abs(p.rot) > 1) yield* tween(p, { rot: 0 }, 0.08, E.out);
      p.rot = 0; p.sx = 1; p.sy = 1; p.clip = 0;
      p.front(); p.face = "hit"; p.z = 20; p.setPivot("head");
      if (g.tx == null) { g.tx = p.x; g.tb = p.b + 46; }
      // 손가락을 향해 스르륵 딸려 올라가요 (툭 튀지 않게)
      let pull = 0, sent = 0;
      p.say(pick(["으아 내려 줘!", "어어어?", "높아 높아!", "살살…!"]), 1200);
      let th = 0, om = 0, t = 0, head = null;
      while (!g.done) {
        const dt = yield;
        t += dt;
        if (remote && clock - g.last > 2.5) { g.done = { vx: 0, vy: 0 }; break; } // 소식이 끊기면 그냥 내려놔요
        if (!remote && t - sent > 0.08 && window.Live) { sent = t; Live.send("pdrag", { who: p.who, x: g.tx / W, b: g.tb / H, vx: (g.vx || 0) / W }); }
        if (!head) {
          // 머리를 잡혀 대롱대롱: 몸이 추처럼 흔들리고 다리를 버둥거려요
          pull = Math.min(1, pull + dt * 7);
          const k = Math.min(1, dt * (remote ? 14 : 8 + 40 * pull));
          const tx = p.x + (g.tx - p.x) * k, ty = p.y + (Math.max(-4, g.tb - 46 - GY) - p.y) * k;
          const ax = (tx - p.x) / Math.max(dt, 0.008);
          p.x = tx; p.y = ty;
          om += (-th * 70 - om * 6 - ax * 0.9) * dt; th = clamp(th + om * dt, -50, 50);
          p.rot = th;
          p.frame = Math.floor(t * 9) % 2 ? 1 : 2;
          p.pose = Math.floor(t * 5) % 2 ? "raise" : "";
          if (t > 1.6) p.face = Math.floor(t * 6) % 2 ? "cry1" : "cry2";
          if (g.pop && t > 0.16 && p.y > 14) {
            // 쭈욱… 뽁! 머리만 빠졌어요
            head = headOff(p);
            pow(p.x, p.b + 60, "뽁!", { big: true }); stars(p.x, p.b + 50, 5);
            const bx = landX(p.x);
            p.setPivot("feet"); p.z = 9; p.frame = 0;
            fork(tween(p, { rot: 0 }, 0.12, E.out));
            fork((function* () { const y0 = p.y; yield* wait(0.25, (k) => { p.y = y0 * (1 - k * k); p.x += (bx - p.x) * k; }); p.y = 0; p.x = bx; dust(p.x, GY, 4); yield* p.squash(1.15, 0.8, 0.05); yield* panic(p, () => !!head.landed); })());
            head.say(pick(["어? 몸이 없어!", "내 몸 어디 갔어!", "머리만 왔네…"]), 1300);
          }
        } else {
          { const k = Math.min(1, dt * (remote ? 16 : 40)); head.x += (g.tx - head.x) * k; head.b += (clamp(g.tb, head.rest(), H - 20) - head.b) * k; } head.z = 20;
          head.rot = clamp((g.vx || 0) * 0.03, -30, 30);
          head.face = Math.floor(t * 7) % 2 ? "cry1" : "hit";
        }
      }
      if (rheld[p.who] === g) delete rheld[p.who];
      const v = g.done;
      const brk = remote ? !!g.brk : Math.random() < 0.6;
      if (!remote && window.Live) Live.send("pthrow", { who: p.who, x: (head ? head.x : p.x) / W, b: (head ? head.b : p.y) / H, vx: v.vx / W, vy: v.vy / H, head: !!head, brk });
      if (Math.hypot(v.vx, v.vy) > 260) (head || p).say(pick(["으아아아!", "날아간다~", "꺄아아", "살려 줘!"]), 1000);
      if (head) yield* thrownHead(p, head, v.vx, v.vy);
      else yield* thrownBody(p, v.vx, v.vy, brk);
    }, { key: "held" });
  }
  // 상대 폰에서 잡았어요 / 흔들고 있어요
  function remoteGrab(d) {
    if (!ensure()) return;
    const p = people[d.who === "her" ? "her" : "him"];
    if (!p) return;
    if (window.Deco && Deco.celebrating && Deco.celebrating()) return;
    runs.slice().forEach((r) => { if (r.auto || r.key === "home") soften(r, p); });
    if (p.on && p.owner) return;
    const g = { pop: !!d.pop, last: clock, vx: 0 };
    rheld[p.who] = g;
    held(p, g, true);
    if (PL().kick) PL().kick();
  }
  function remoteDrag(d) {
    const g = rheld[d.who === "her" ? "her" : "him"];
    if (!g) return;
    g.tx = clamp(d.x * W, 14, W - 14); g.tb = clamp(d.b * H, 0, H - 8); g.vx = (d.vx || 0) * W; g.last = clock;
  }
  if (window.Live) { Live.on("pgrab", remoteGrab); Live.on("pdrag", remoteDrag); }
  function* thrownBody(p, vx, vy, brk) {
    const res = yield* p.launch(vx, vy, { brk });
    if (res === "land") { yield* p.dizzy(1.1); yield* p.getUp(); yield* p.shakeHead(4); p.say(pick(["어질어질…", "또 던져 봐!", "누가 던졌어!", "세상이 돈다"]), 1300); yield* wait(0.5); }
    else yield* wait(0.4);
  }
  function* thrownHead(p, head, vx, vy) {
    head.vx = vx; head.vy = vy; head.vr = vx * 2.2; head.z = 10; head.face = "hit";
    yield* head.fly({ bounce: 0.55 });
    head.landed = true;
    yield* wait(0.3);
    yield* reunite(p, head);
    yield* wait(0.4);
  }
  // 상대 폰에서 던진 것을 그대로 따라 해요
  function remoteThrow(d) {
    if (!ensure()) return;
    const p = people[d.who === "her" ? "her" : "him"];
    if (!p) return;
    const hg = rheld[p.who];
    if (hg && !hg.done) { hg.brk = !!d.brk; if (!!d.head !== !!hg.pop) hg.pop = false; hg.done = { vx: d.vx * W, vy: d.vy * H }; return; }
    runs.slice().forEach((r) => { if (r.auto || r.key === "home") soften(r, p); });
    if (p.on && p.owner) return;
    startRun(function* () {
      p.take(); p.z = 9;
      p.setPivot("feet").norm(); p.sx = 1; p.sy = 1; p.clip = 0; p.front(); p.face = "hit"; p.pose = "raise";
      if (d.head) {
        const head = headOff(p);
        pow(p.x, p.b + 60, "뽁!", { big: true });
        fork((function* () { yield* tween(p, { rot: 0, y: 0 }, 0.12, E.out); yield* panic(p, () => !!head.landed); })());
        yield* tween(head, { x: clamp(d.x * W, 20, W - 20), b: clamp(d.b * H, head.rest(), H - 20) }, 0.22, E.out);
        yield* thrownHead(p, head, d.vx * W, d.vy * H);
      } else {
        yield* tween(p, { x: clamp(d.x * W, 20, W - 20), y: clamp(d.b * H, 0, H - 80), rot: 0 }, 0.22, E.out);
        yield* thrownBody(p, d.vx * W, d.vy * H, !!d.brk);
      }
    }, { key: "held" });
    if (PL().kick) PL().kick();
  }
  if (window.Live) Live.on("pthrow", remoteThrow);

  window.Play = {
    tick, abort: () => abort((r) => r.auto), soft: () => runs.slice().forEach((r) => { if (r.auto) soften(r); }), play, def, ids: () => DEFS.map((d) => d.id), count: () => DEFS.reduce((n, d) => n + (d.n || 1), 0),
    remote: remoteThrow, testAuto: () => auto(), clock: () => clock, pause: (v) => { paused = !!v; }, dragged: () => Date.now() - dragAt < 400, busy: () => runs.length > 0, people, runs,
    // js/plays.js 가 쓰는 도구들
    kit: { E, rand, pick, rnd, dec, dpick, clamp, wait, tween, all, until, fork, pow, puff, stars, dust, sweat, feathers, quake, orbit, bubble, stick, Prop, Part, A, hold, headOff, headOn, panic, reunite, burst, assemble, shatter, splashIn, climbOut, inPond, landX, headPos, geo: () => ({ W, H, pond, GY }), spr },
  };
})();
