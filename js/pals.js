// ============================================================
// 홈 풍경 속 친구들: 연못의 아기 하마, 아기 양, 먼치킨 고양이
// 각자 성격대로 돌아다니고, 날씨와 밤낮에 따라 하는 일이 달라요.
// 누르는 횟수에 따라 반응도 달라요. (한 번, 두 번, 여러 번, 아주 많이)
// ============================================================
(function () {
  "use strict";

  const SP = window.FSprites;
  if (!SP) return;
  const $ = (id) => document.getElementById(id);
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const SC = 2; // 도트 한 칸 = 2px

  let scene, layer, pondEl, W = 360, H = 200;
  let pond = { x0: 14, x1: 102, b: 2, water: 12 };
  const ents = [];
  let raf = 0, last = 0;

  // ---------- 날씨, 시간 ----------
  function env() {
    const S = window.Scene;
    const w = S && S.weather ? S.weather() : { kind: "clear" };
    const dark = S && S.dark ? S.dark() : 0;
    return { wet: !!w.wet, snowy: !!w.snowy, cold: w.temp != null && w.temp <= 2, hot: w.temp != null && w.temp >= 27, night: dark > 0.6, dusk: dark > 0.3 && dark <= 0.6, sunny: !w.wet && !w.snowy && (w.kind === "clear" || w.kind === "partly") && dark < 0.3, windy: (w.wind || 0) > 25 };
  }

  // ---------- 연못 그림 ----------
  function pondImg(frozen) {
    const w = 46, h = 11;
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const c = cv.getContext("2d");
    const cx = w / 2, cy = h / 2 + 0.5, rx = w / 2 - 0.5, ry = h / 2 - 0.5;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = dx * dx + dy * dy;
      if (d > 1) continue;
      let col = frozen ? "#cfe6f2" : "#5fb0e0";
      if (d > 0.78) col = "#8a7a62";
      else if (d > 0.62) col = frozen ? "#b8d6e8" : "#4f9bd0";
      else if (y < 4 && (x + y * 3) % 11 === 0) col = frozen ? "#ffffff" : "#bfe6ff";
      c.fillStyle = col; c.fillRect(x, y, 1, 1);
    }
    // 돌과 연잎
    [[3, 4, "#b8b2a8"], [4, 4, "#e2ddd4"], [41, 7, "#b8b2a8"], [42, 6, "#9a9284"]].forEach(([x, y, col]) => { c.fillStyle = col; c.fillRect(x, y, 1, 1); });
    if (!frozen) { c.fillStyle = "#6fbf5f"; c.fillRect(30, 3, 3, 2); c.fillRect(31, 2, 2, 1); c.fillStyle = "#ff9ab8"; c.fillRect(31, 3, 1, 1); }
    return cv.toDataURL();
  }

  // ---------- 만들기 ----------
  function setup() {
    scene = $("scene");
    if (!scene || scene.querySelector(".sc-pals")) return !!scene;
    layer = document.createElement("div");
    layer.className = "sc-pals";
    layer.innerHTML = `<span class="pal-pond"><img class="px" alt=""><i class="pal-ripple"></i><i class="pal-ripple r2"></i></span>`;
    scene.insertBefore(layer, $("couple"));
    pondEl = layer.querySelector(".pal-pond");
    pondEl.firstChild.src = pondImg(false);
    layout(true);
    sync();
    return true;
  }
  // 그림에 둔 동물들 (꾸미기에서 고른 친구들). 물을 좋아하면 연못에서, 고양이 같으면 고양이처럼, 나머지는 양처럼 지내요.
  // ---------- 같이 보기: 한 사람이 동물을 누르거나 던지면 상대 폰에서도 똑같이 일어나요 ----------
  // 서버에 "방금 일어난 일"을 짧게 올리면, 열려 있는 상대 폰이 바로 받아서 따라 해요 (보통 1초 안).
  const Live = (() => {
    const fns = {};
    let last = -1, sentAt = 0;
    const who = () => (window.Store && Store.me()) || "";
    function send(k, d) {
      const w = who();
      if (!w || !Store.live) return;
      const now = Date.now();
      if (k === "tap" && now - sentAt < 200) return; // 연타는 조금 솎아서
      sentAt = now;
      // 줄이 이어져 있으면 그걸로 바로 (훨씬 빨라요). 아니면 기록에 잠깐 적어서 전해요.
      if (Store.cast && Store.cast({ k, d, w, t: now })) return;
      if (k === "pdrag") return; // 잡고 흔드는 건 줄로만 보내요
      const cur = Store.pair("ev", w);
      const list = (cur && Array.isArray(cur.list) ? cur.list.filter((x) => now - x.t < 5000) : []).slice(-5);
      list.push({ i: now + Math.random(), k, d, t: now });
      Store.live("ev", w, { list });
    }
    function recv() {
      const w = who();
      if (!w) return;
      const v = Store.pair("ev", w === "him" ? "her" : "him");
      const list = v && Array.isArray(v.list) ? v.list : [];
      if (last < 0) { last = list.reduce((m, x) => Math.max(m, x.i), 0); return; } // 앱을 열기 전에 있던 일은 따라 하지 않아요
      list.forEach((x) => {
        if (x.i <= last) return;
        last = x.i;
        if (Math.abs(Date.now() - x.t) > 15000) return;
        const f = fns[x.k];
        if (f) { try { f(x.d || {}); } catch (e) { console.error(e); } }
      });
    }
    if (window.Store) { Store.onChange(recv); setTimeout(recv, 0); }
    if (window.Store && Store.onCast) Store.onCast((m) => { if (!m || !m.k || Math.abs(Date.now() - (m.t || 0)) > 15000) return; const f = fns[m.k]; if (f) { try { f(m.d || {}, m); } catch (e) { console.error(e); } } });
    return { send, on: (k, f) => { fns[k] = f; } };
  })();
  window.Live = Live;
  Live.on("grab", (d) => { const e = ents.find((x) => x.id === d.id); if (e && !e.held) { say(e, pick(["어어?", "들렸다!", "으앗"])); e.el.animate([{ scale: "1" }, { scale: "1.15 .9" }, { scale: "1" }], { duration: 240 }); } });
  Live.on("throw", (d) => {
    const e = ents.find((x) => x.id === d.id);
    if (!e || e.held) return;
    endWarp(e);
    e.swim = false; e.lift = 0; e.rot = 0; e.scale = 1; e.sx = 1; e.sy = 1; e.tx = 0; e.jig = null;
    e.x = Math.max(8, Math.min(W - 8, d.x * W)); e.b = Math.max(0, Math.min(H - 26, d.b * H));
    e.thrown = { vx: d.vx * W, vy: d.vy * H, t: 0 };
    if (Math.hypot(e.thrown.vx, e.thrown.vy) > 250) say(e, pick(["으아아!", "날아간다~", "슈우웅", "꺄아"]));
    kick();
  });
  Live.on("tap", (d) => { const e = ents.find((x) => x.id === d.id); if (e && !e.held && !e.thrown) tap(e); });

  // ---------- 자라는 친구들 ----------
  // 새로 온 친구는 알이나 아기로 와서, 둘이 이것저것 할수록 자라요 (그 친구가 온 뒤로 받은 선물 수로 셈해요).
  // 병아리는 닭이 되고, 올챙이는 개구리가, 애벌레는 번데기를 거쳐 나비가 돼요.
  const AGES = [0, 6, 18, 40];
  const CHAIN = {
    chick: ["egg", "chick", "chick", "fm21"], jp43: ["egg", "jp43", "jp43", "fm21"], fm21: ["egg", "chick", "fm21"], fm22: ["egg", "chick", "fm22"],
    frog: ["egg", "rp24", "frog"], jp44: ["egg", "rp24", "jp44"], rp24: ["egg", "rp24", "rp24", "frog"],
    bg10: ["egg", "bg10", "cocoon", "bg04"], bg04: ["egg", "bg10", "cocoon", "bg04"], bg05: ["egg", "bg10", "cocoon", "bg05"], bg06: ["egg", "bg10", "cocoon", "bg06"], bg07: ["egg", "bg10", "cocoon", "bg07"], bg08: ["egg", "bg10", "cocoon", "bg08"],
  };
  const LAYS = (id) => /^(bd|dn|rp|bg)/.test(id) || ["penguin", "dino", "my04", "my07", "my08", "my11"].indexOf(id) >= 0;
  function growth(id) {
    const age = window.Deco && Deco.petAge ? Deco.petAge(id) : 999;
    let st = 0;
    for (let i = 0; i < AGES.length; i++) if (age >= AGES[i]) st = i;
    const chain = CHAIN[id] || (LAYS(id) ? ["egg", id, id] : [id, id, id]);
    const i = Math.min(st, chain.length - 1), form = chain[i];
    const done = i === chain.length - 1;
    // 같은 모습이 이어지면 처음엔 작게, 다음엔 조금 더 크게
    const size = form === "egg" || form === "cocoon" ? 1 : done ? 1 : SP.PJ[form] && form !== id ? 0.8 : chain[i - 1] === form || i === 0 ? (i === 0 ? 0.68 : 0.84) : 0.68;
    const label = form === "egg" ? "알" : form === "cocoon" ? "번데기" : done ? "" : form !== id ? SP.PJ[form].name : "아기";
    return { form, size, label, done, next: done ? 0 : AGES[i + 1] - age };
  }
  const eggCache = {};
  function eggImg(id, form) {
    const k = form + "|" + id;
    if (eggCache[k]) return eggCache[k];
    const sp = SP.PJ[id], Z = window.Zoo;
    const lite = Z && Z.shade ? Z.shade(sp.c.U.slice(1), 0.6) : "#fff6e6";
    const rows = form === "cocoon"
      ? ["...kk...", "..UUUU..", ".UUxUUU.", ".UUUUxU.", ".UxUUUU.", ".UUUUUU.", ".UUxUUu.", ".UUUUuu.", "..Uuuu..", "...uu..."]
      : ["...UUUU...", "..UUUUUU..", ".UUUxUUUU.", ".UUUUUUxU.", "UUUUUUUUUU", "UxUUUUUUUU", "UUUUUxUUUU", "UUUUUUUUUu", ".UUUUUUuu.", "..uuuuuu.."];
    const g = rows.map((r) => ("." + r + ".").split(""));
    g.unshift(new Array(g[0].length).fill(".")); g.push(new Array(g[0].length).fill("."));
    const add = [];
    for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) { if (g[y][x] !== ".") continue; if ([[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(([a, b]) => g[b] && g[b][a] && g[b][a] !== "." && g[b][a] !== "o")) add.push([x, y]); }
    add.forEach(([x, y]) => { g[y][x] = "o"; });
    const pal = form === "cocoon" ? { o: "#5a4a30", U: "#b8c878", u: "#8a9a50", x: "#dce8a0", k: "#7a5236" } : { o: "#6a5a4a", U: lite, u: Z.shade(lite.slice(1), -0.14), x: sp.c.U };
    eggCache[k] = window.GArt.fromRows("egg|" + k, g.map((r) => r.join("")), pal).uri;
    return eggCache[k];
  }
  function make(id) {
    if (!SP.PJ[id]) return null;
    const gr = growth(id);
    const still = gr.form === "egg" || gr.form === "cocoon";
    const look = still ? id : gr.form; // 지금 모습의 종
    const sp = SP.PJ[look];
    const swimmer = !still && sp.fam === "w" && !ents.some((x) => x.kind === "hippo");
    // 새와 날개 달린 친구는 하늘을 날아요 (타조, 키위처럼 못 나는 새는 빼고). 아기 때는 아직 못 날아요.
    const flyer = !still && gr.size >= 1 && sp.fam !== "w" && (sp.m.indexOf("i") >= 0 || (/^bd/.test(look) && ["bd54", "bd55", "bd56", "bd62"].indexOf(look) < 0));
    const kind = still ? "egg" : flyer ? "bird" : swimmer ? "hippo" : sp.fam === "c" ? "cat" : "sheep";
    const el = document.createElement("button");
    el.className = "pal pal-" + kind;
    el.setAttribute("aria-label", SP.PJ[id].name + (gr.label ? " (" + gr.label + ")" : ""));
    el.innerHTML = `<span class="pal-clip"><img class="px" alt="" draggable="false"></span><i class="pal-say" hidden></i>`;
    layer.appendChild(el);
    const e = { kind, id, gkey: gr.form + "|" + gr.size, form: gr.form, size: gr.size, grow: gr, sp: look, el, img: el.querySelector("img"), clip: el.querySelector(".pal-clip"), say: el.querySelector(".pal-say"), x: 0, b: 6, flip: false, st: "", t: 0, frame: "stand", face: "", tail: 1, taps: [], src: "", fx: {}, acc: 0, blinkAt: 0, swim: false, rot: 0, lift: 0, scale: 1, tx: 0, sayT: 0 };
    // 살짝 누르면 반응하고, 끌면 들려 올라가고, 휙 놓으면 날아가요
    el.addEventListener("pointerdown", (ev) => {
      ev.stopPropagation();
      e.grab = { x0: ev.clientX, y0: ev.clientY, px: ev.clientX, py: ev.clientY, pt: performance.now(), vx: 0, vy: 0, moved: false };
      try { el.setPointerCapture(ev.pointerId); } catch (err) { /* 괜찮아요 */ }
    });
    el.addEventListener("pointermove", (ev) => {
      const g = e.grab;
      if (!g) return;
      if (!g.moved && Math.hypot(ev.clientX - g.x0, ev.clientY - g.y0) < 8) return;
      if (!g.moved) { Live.send("grab", { id: e.id }); g.moved = true; e.held = true; e.thrown = null; e.swim = false; e.lift = 0; e.rot = 0; e.scale = 1; e.sx = 1; e.sy = 1; e.tx = 0; el.classList.add("held"); say(e, pick(["어어?", "들렸다!", "으앗"])); }
      const now = performance.now(), dt = Math.max(8, now - g.pt) / 1000;
      g.vx = g.vx * 0.5 + ((ev.clientX - g.px) / dt) * 0.5; g.vy = g.vy * 0.5 + ((ev.clientY - g.py) / dt) * 0.5;
      g.px = ev.clientX; g.py = ev.clientY; g.pt = now;
      const sr = scene.getBoundingClientRect();
      e.x = Math.max(8, Math.min(W - 8, ev.clientX - sr.left));
      e.b = Math.max(0, Math.min(H - 26, sr.bottom - ev.clientY - 16));
      ev.preventDefault();
    });
    const drop = (ev) => {
      const g = e.grab;
      if (!g) return;
      e.grab = null;
      if (!g.moved) { if (ev.type === "pointerup") { tap(e); Live.send("tap", { id: e.id }); } return; }
      e.held = false;
      el.classList.remove("held");
      const stale = performance.now() - g.pt > 120; // 멈췄다 놓으면 그냥 툭 떨어져요
      const cl = (v, m) => Math.max(-m, Math.min(m, v));
      e.thrown = { vx: stale ? 0 : cl(g.vx, 900), vy: stale ? 0 : cl(-g.vy, 1000), t: 0 };
      Live.send("throw", { id: e.id, x: e.x / W, b: e.b / H, vx: e.thrown.vx / W, vy: e.thrown.vy / H });
      if (Math.hypot(e.thrown.vx, e.thrown.vy) > 250) say(e, pick(["으아아!", "날아간다~", "슈우웅", "꺄아"]));
    };
    el.addEventListener("pointerup", drop);
    el.addEventListener("pointercancel", drop);
    el.addEventListener("click", (ev) => ev.stopPropagation());
    if (kind === "hippo") { e.x = (pond.x0 + pond.x1) / 2; e.swim = true; e.st = "swim"; e.t = rand(4, 9); }
    if (kind === "sheep") { e.x = W * rand(0.55, 0.9); e.b = rand(5, 10); e.st = "graze"; e.t = rand(2, 4); }
    if (kind === "cat") { e.x = W * rand(0.45, 0.85); e.b = rand(2, 6); e.st = "loaf"; e.t = rand(2, 4); }
    if (kind === "bird") { e.x = W * rand(0.15, 0.85); e.b = H * rand(0.42, 0.7); e.st = "hover"; e.t = rand(0.5, 2); e.fx.tx = e.x; e.fx.tb = e.b; e.vx = 0; e.vb = 0; }
    if (kind === "egg") { e.x = W * rand(0.5, 0.86); e.b = rand(4, 9); e.st = "sit"; e.t = rand(2, 5); }
    return e;
  }
  function sync() {
    if (!layer) return;
    const want = window.Deco ? Deco.placed() : [];
    // 그림에서 뺀 친구는 내보내고, 자라서 모습이 바뀐 친구는 새 모습으로 다시 불러요
    for (let i = ents.length - 1; i >= 0; i--) {
      const e = ents[i], g = want.indexOf(e.id) >= 0 ? growth(e.id) : null;
      if (!g || g.form + "|" + g.size !== e.gkey) {
        if (g && !e.held && !e.thrown) { const n = make(e.id); if (n) { if (n.kind !== "hippo" && n.kind !== "bird") { n.x = e.x; } ents.splice(i, 1, n); e.el.remove(); if (e.cv) e.cv.remove(); hearts(n, 5); say(n, g.form === "cocoon" ? "…번데기가 됐어" : e.form === "egg" ? "빠직! 안녕?" : g.done ? "다 컸어!" : "쑥쑥 컸어!", 2400); continue; } }
        if (!g) { e.el.remove(); if (e.cv) e.cv.remove(); ents.splice(i, 1); }
      }
    }
    want.forEach((id) => { if (!ents.some((e) => e.id === id)) { const e = make(id); if (e) ents.push(e); } });
  }
  function layout(first) {
    W = scene.clientWidth; H = scene.clientHeight;
    const pw = 46 * SC;
    pond = { x0: Math.max(6, Math.round(W * 0.03)), x1: Math.max(6, Math.round(W * 0.03)) + pw, b: 1, water: 13 };
    pondEl.style.left = pond.x0 + "px";
    pondEl.style.width = pw + "px";
  }

  // ---------- 말풍선, 효과 ----------
  const OWN = { hippo: 1, sheep: 1, cat: 1 };
  function say(e, text, ms) {
    // 손으로 그린 세 친구 말고는 저마다 "뀨" 하고 울어요
    if (!OWN[e.sp]) text = String(text).replace(/음…메…|메에…|메에!|메에/g, "뀨").replace(/냐옹|야옹|냥!|냥|냐\?/g, "뀨").replace("뿌우~", "뀨우~").replace("골골골", "뀨르르");
    e.say.textContent = text;
    e.say.hidden = false;
    e.sayT = (ms || 1800) / 1000;
    e.say.animate([{ opacity: 0, translate: "-50% 4px" }, { opacity: 1, translate: "-50% 0" }], { duration: 200 });
  }
  function center(e) {
    const r = e.el.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 3];
  }
  function hearts(e, n, kind) {
    if (window.HSD && HSD.burst) { const [x, y] = center(e); HSD.burst(x, y, n, kind || "heart"); }
  }
  // 물방울: 작은 네모 점이 포물선으로
  function drops(x, b, n, spread, color) {
    for (let i = 0; i < n; i++) {
      const d = document.createElement("i");
      d.className = "pal-drop";
      d.style.left = x + "px"; d.style.bottom = b + "px";
      if (color) d.style.background = color;
      layer.appendChild(d);
      const vx = rand(-spread, spread), up = rand(14, 34);
      d.animate([{ transform: "translate(0,0)" }, { transform: `translate(${vx / 2}px, ${-up}px)`, offset: 0.45 }, { transform: `translate(${vx}px, 6px)`, opacity: 0 }], { duration: rand(500, 800), easing: "ease-out" }).onfinish = () => d.remove();
    }
  }
  function ring(x) {
    const r = document.createElement("i");
    r.className = "pal-ring";
    r.style.left = x + "px"; r.style.bottom = pond.b + 6 + "px";
    layer.appendChild(r);
    r.animate([{ transform: "translate(-50%, 0) scale(.3)", opacity: 1 }, { transform: "translate(-50%, 0) scale(1.4)", opacity: 0 }], { duration: 700, easing: "ease-out" }).onfinish = () => r.remove();
  }
  function zzz(e) {
    const z = document.createElement("i");
    z.className = "pal-z"; z.textContent = "z";
    z.style.left = e.x + 8 + "px"; z.style.bottom = e.b + 24 + "px";
    layer.appendChild(z);
    z.animate([{ transform: "translate(0,0) scale(.6)", opacity: 0 }, { opacity: 1, offset: 0.2 }, { transform: "translate(10px,-18px) scale(1.1)", opacity: 0 }], { duration: 1800 }).onfinish = () => z.remove();
  }
  function setState(e, st, t) { e.st = st; e.t = t; e.acc = 0; }
  function walkFrame(e, dt, speed) {
    e.acc += dt * speed / 10;
    const c = Math.floor(e.acc / 0.5) % 4;
    return c === 1 ? "walk1" : c === 3 ? "walk2" : "stand";
  }
  function moveTo(e, tx, speed, dt) {
    const dx = tx - e.x;
    if (Math.abs(dx) < 1) { e.x = tx; return true; }
    e.flip = dx < 0;
    e.x += Math.sign(dx) * Math.min(Math.abs(dx), speed * dt);
    return false;
  }
  function landRange(e) {
    const left = pond.x1 + 14, right = W - 18;
    return [left, right];
  }
  function blink(e, dt) {
    e.blinkAt -= dt;
    if (e.blinkAt < 0) { e.blinkAt = rand(2.4, 5); e.blinkT = 0.14; }
    if (e.blinkT > 0) { e.blinkT -= dt; return true; }
    return false;
  }
  function couplePos() {
    const c = $("couple");
    if (!c) return W / 2;
    const r = c.getBoundingClientRect(), sr = scene.getBoundingClientRect();
    return r.left - sr.left + r.width / 2;
  }

  // ============================================================
  // 아기 하마: 연못에서 둥둥, 가끔 뭍으로 올라와 하품하고 낮잠
  // ============================================================
  function toPond(e) {
    e.fx.fromX = 0; e.fx.target = 0;
    if (e.x > pond.x1 + 30 || e.x < pond.x0 - 20) setState(e, "walkpond", 60);
    else setState(e, "climbin", 0.8);
  }
  function hippo(e, dt, E) {
    e.t -= dt;
    const mid = (pond.x0 + pond.x1) / 2;
    if (E.night && e.st !== "sleepswim" && e.st !== "dive" && !e.busy) {
      if (e.swim) setState(e, "sleepswim", 6);
      else if (e.st !== "walkpond") toPond(e); // 밤이면 걸어서 연못으로 돌아가요
    }
    switch (e.st) {
      case "swim": {
        e.frame = "stand";
        e.face = blink(e, dt) ? "blink" : "";
        if (!e.fx.target || Math.abs(e.x - e.fx.target) < 1) e.fx.target = rand(pond.x0 + 18, pond.x1 - 18);
        moveTo(e, e.fx.target, 7, dt);
        e.fx.spout = (e.fx.spout || rand(4, 9)) - dt;
        if (e.fx.spout < 0) { e.fx.spout = E.wet ? rand(2, 4) : rand(6, 12); drops(e.x + (e.flip ? -12 : 12), pond.b + 14, E.wet ? 6 : 4, 10, "#bfe6ff"); }
        if (E.cold && Math.random() < dt * 0.4) say(e, pick(["추워…", "부르르"]));
        if (E.wet && Math.random() < dt * 0.05) say(e, pick(["비다! 좋아", "첨벙첨벙"]));
        if (e.t < 0) {
          // 날이 좋으면 뭍으로, 추우면 그대로
          if (!E.wet && !E.cold && !E.hot && Math.random() < 0.55) setState(e, "climbout", 0.7);
          else if (Math.random() < 0.4) setState(e, "dive", 2.2);
          else e.t = rand(5, 10);
        }
        break;
      }
      case "dive": {
        // 쏙 들어갔다가 다른 자리에서 뽀글뽀글 올라와요
        const p = 1 - e.t / 2.2;
        e.fx.sink = p < 0.2 ? p / 0.2 : p > 0.75 ? Math.max(0, 1 - (p - 0.75) / 0.25) : 1;
        if (!e.fx.moved && p > 0.4) { e.fx.moved = true; e.x = rand(pond.x0 + 18, pond.x1 - 18); e.flip = Math.random() < 0.5; }
        if (p > 0.2 && p < 0.75 && Math.random() < dt * 8) drops(e.x + rand(-6, 6), pond.b + 9, 1, 2, "#dff3ff");
        if (e.t < 0) { e.fx.sink = 0; e.fx.moved = false; ring(e.x); setState(e, "swim", rand(5, 10)); }
        break;
      }
      case "climbout": {
        const p = 1 - e.t / 0.7;
        const tx = pond.x1 + 22;
        e.x = (e.fx.fromX = e.fx.fromX || e.x) + (tx - e.fx.fromX) * p;
        e.flip = false;
        e.lift = Math.sin(p * Math.PI) * 14;
        if (p > 0.3) e.swim = false;
        if (e.t < 0) { e.fx.fromX = 0; e.lift = 0; e.swim = false; e.b = 7; drops(pond.x1 - 4, pond.b + 6, 6, 12, "#bfe6ff"); setState(e, "land", rand(10, 20)); }
        break;
      }
      case "walkpond": {
        // 멀리 있으면 뒤뚱뒤뚱 걸어서 연못가까지
        const tx = e.x > mid ? pond.x1 + 18 : Math.max(8, pond.x0 - 14);
        if (moveTo(e, tx, 17, dt)) setState(e, "climbin", 0.8);
        else { e.frame = walkFrame(e, dt, 17); e.face = ""; if (Math.random() < dt * 0.25) say(e, pick(["물 보고 싶어", "영차 영차", "연못 어디야"])); }
        break;
      }
      case "land": {
        if (e.x < pond.x1 - 4) { toPond(e); break; } // 연못 안이나 왼쪽에 떨어졌으면 물로
        const [l, r] = [pond.x1 + 14, Math.min(W - 30, pond.x1 + 90)];
        if (!e.fx.target || Math.abs(e.x - e.fx.target) < 1) {
          e.fx.idle = (e.fx.idle || 0) - dt;
          if (e.fx.idle <= 0) {
            const r2 = Math.random();
            if (r2 < 0.25) { e.fx.yawn = 1.4; }
            else if (r2 < 0.45 && E.sunny) { e.fx.nap = rand(4, 7); }
            e.fx.target = rand(l, r); e.fx.idle = rand(1.5, 4);
          }
        }
        if (e.fx.yawn > 0) { e.fx.yawn -= dt; e.frame = "stand"; e.face = "yawn"; if (e.fx.yawn > 1.3 && e.fx.yawn - dt <= 1.3) say(e, "하아암"); }
        else if (e.fx.nap > 0) { e.fx.nap -= dt; e.frame = "lie"; e.face = "sleep"; if (Math.random() < dt * 0.7) zzz(e); }
        else if (!moveTo(e, e.fx.target, 11, dt)) { e.frame = walkFrame(e, dt, 11); e.face = ""; }
        else { e.frame = "stand"; e.face = blink(e, dt) ? "blink" : ""; }
        if (e.t < 0 || E.wet || E.cold) toPond(e);
        break;
      }
      case "climbin": {
        const p = 1 - e.t / 0.8;
        const tx = rand(pond.x0 + 30, pond.x1 - 20);
        if (!e.fx.fromX) { e.fx.fromX = e.x; e.fx.toX = tx; }
        e.flip = e.fx.toX < e.fx.fromX;
        e.x = e.fx.fromX + (e.fx.toX - e.fx.fromX) * p;
        e.lift = Math.sin(p * Math.PI) * 18;
        e.frame = "stand"; e.face = "happy";
        if (p > 0.75) e.swim = true;
        if (e.t < 0) { e.fx.fromX = 0; e.lift = 0; e.swim = true; ring(e.x); drops(e.x, pond.b + 8, 10, 22, "#bfe6ff"); setState(e, "swim", rand(6, 12)); }
        break;
      }
      case "sleepswim": {
        e.frame = "stand"; e.face = "sleep";
        e.fx.z = (e.fx.z || 0) - dt;
        if (e.fx.z < 0) { e.fx.z = 1.6; zzz(e); drops(e.x + 12, pond.b + 10, 1, 1, "#dff3ff"); }
        if (!E.night && e.t < 0) setState(e, "swim", 4);
        break;
      }
      case "jump": {
        // 여러 번 누르면: 물 밖으로 펄쩍 뛰었다가 첨벙
        const p = 1 - e.t / 1.0;
        e.lift = Math.sin(p * Math.PI) * 34;
        e.rot = (e.flip ? -1 : 1) * p * 20;
        e.frame = "walk1"; e.face = "happy";
        e.swim = p < 0.12 || p > 0.88;
        if (e.t < 0) { e.lift = 0; e.rot = 0; e.swim = true; ring(e.x); drops(e.x, pond.b + 8, 16, 30, "#bfe6ff"); say(e, "첨벙!"); setState(e, "swim", rand(6, 10)); }
        break;
      }
      case "dance": {
        const p = 1 - e.t / 2.4;
        e.flip = Math.floor(p * 10) % 2 === 1;
        e.lift = Math.abs(Math.sin(p * Math.PI * 5)) * 8;
        e.face = "happy"; e.frame = Math.floor(p * 10) % 2 ? "walk1" : "walk2";
        if (Math.random() < dt * 4) hearts(e, 1);
        if (e.t < 0) { e.lift = 0; say(e, "졸려…"); if (e.swim) setState(e, "swim", 8); else setState(e, "land", 8); e.fx.nap = 3; }
        break;
      }
      default: setState(e, "swim", 4);
    }
  }

  // ============================================================
  // 아기 양: 풀 뜯고, 깡총 뛰고, 비 오면 털을 털어요
  // ============================================================
  // ---------- 던져졌을 때: 빙글빙글 날아가서 벽과 바닥에 튕기다 멈춰요 ----------
  // ---------- 말랑한 몸: 벽에 부딪히면 닿은 면이 넓게 퍼지고, 반대쪽은 눌려 들어와요 ----------
  // 라켓에 맞은 공을 느리게 본 것처럼: 닿는 순간 푹 눌렸다가(닿은 쪽이 넓적), 탄성으로 되돌아오며 튕겨 나가고, 잠깐 출렁여요.
  // 그림을 한 줄씩(벽과 나란한 줄) 잘라 다시 그려서, 폭만 줄이는 게 아니라 모양 자체가 찌그러져요.
  const bbCache = new Map();
  function bodyBox(img) {
    const k = img.src;
    let b = bbCache.get(k);
    if (b) return b;
    const w = img.naturalWidth, h = img.naturalHeight;
    if (!w) return null;
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const x = c.getContext("2d");
    x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, w, h).data;
    let x0 = w, x1 = 0, y0 = h, y1 = 0;
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) if (d[(yy * w + xx) * 4 + 3] > 20) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
    b = { x0, x1, y0, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 };
    if (bbCache.size > 300) bbCache.clear();
    bbCache.set(k, b);
    return b;
  }
  // c: 눌린 정도 (0 = 그대로, 1 = 아주 납작, 음수 = 벽에서 떨어지며 길쭉). sag: 흘러내리며 처지는 정도
  function drawWarp(e, side, c, sag) {
    const bb = bodyBox(e.img);
    if (!bb) return false;
    if (!e.cv) { e.cv = document.createElement("canvas"); e.cv.className = "pal-warp"; layer.appendChild(e.cv); }
    const S = SC * (e.size || 1), bw = bb.w * S, bh = bb.h * S;
    const cw = Math.ceil(bw * 2.6), ch = Math.ceil(bh * 2.6);
    const cv = e.cv;
    if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; cv.style.width = cw + "px"; cv.style.height = ch + "px"; }
    const g = cv.getContext("2d");
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, cw, ch);
    g.imageSmoothingEnabled = false;
    const cc = Math.max(-0.5, Math.min(0.85, c));
    const thick = (side === "left" || side === "right" ? bw : bh) * (1 - 0.7 * cc); // 벽에서 얼마나 튀어나와 있나
    const pw = 1 + 0.7 * Math.max(0, cc); // 벽 쪽 줄일수록 더 얇게 눌려요
    const spread = (u) => 1 + cc * (1.4 * Math.pow(1 - u, 1.6) - 0.2); // 벽에 가까울수록 넓게 퍼져요
    const vert = side === "left" || side === "right";
    const n = vert ? bb.w : bb.h;
    if (vert) {
      for (let i = 0; i < n; i++) {
        const u0 = i / n, u1 = (i + 1) / n, um = (u0 + u1) / 2;
        const d0 = thick * Math.pow(u0, pw), d1 = thick * Math.pow(u1, pw);
        const dh = bh * spread(um), dy = ch / 2 - dh / 2 + sag * um * um * bh * 0.5;
        const sx = side === "left" ? (e.flip ? bb.x1 - i : bb.x0 + i) : (e.flip ? bb.x0 + i : bb.x1 - i);
        const dx = side === "left" ? d0 : cw - d1;
        g.drawImage(e.img, sx, bb.y0, 1, bb.h, dx, dy, Math.max(0.6, d1 - d0) + 0.6, dh);
      }
      cv.style.left = (side === "left" ? 0 : W - cw) + "px";
      cv.style.top = (H - (e.b + bh / 2) - ch / 2).toFixed(1) + "px";
    } else {
      if (e.flip) g.setTransform(-1, 0, 0, 1, cw, 0);
      for (let i = 0; i < n; i++) {
        const u0 = i / n, u1 = (i + 1) / n, um = (u0 + u1) / 2;
        const d0 = thick * Math.pow(u0, pw), d1 = thick * Math.pow(u1, pw);
        const dw = bw * spread(um), dx = cw / 2 - dw / 2;
        const sy = side === "top" ? bb.y0 + i : bb.y1 - i;
        const dy = side === "top" ? d0 + sag * 6 : ch - d1;
        g.drawImage(e.img, bb.x0, sy, bb.w, 1, dx, dy, dw, Math.max(0.6, d1 - d0) + 0.6);
      }
      cv.style.left = (e.x - cw / 2).toFixed(1) + "px";
      cv.style.top = (side === "top" ? 0 : H - e.b - ch) + "px";
    }
    cv.hidden = false;
    e.warping = true;
    return true;
  }
  function endWarp(e) { if (e.cv) e.cv.hidden = true; e.warping = false; }
  // 떨어져 나온 뒤 잠깐 출렁출렁 (늘었다 줄었다 하며 잦아들어요)
  function jiggle(e, amp, axis) { e.jig = { t: 0, amp, axis }; }
  function jiggleStep(e, dt) {
    const j = e.jig;
    if (!j) return;
    j.t += dt;
    const k = j.amp * Math.exp(-6.5 * j.t) * Math.sin(21 * j.t);
    const a = 1 + k, o = 1 / a;
    if (j.axis === "x") { e.sx = a; e.sy = o; } else { e.sy = a; e.sx = o; }
    if (j.t > 0.9) { e.jig = null; e.sx = 1; e.sy = 1; }
  }

  // ---------- 던져졌을 때: 빙글빙글 날아가서 벽과 바닥에 부딪혀요 ----------
  // 세게 부딪히면 찰싹 붙어서 흘러내리기도 하고(열에 여섯 번쯤), 아니면 푹 눌렸다가 튕겨 나와요.
  function flung(e, dt) {
    const t = e.thrown;
    t.t += dt;
    const bird = e.kind === "bird";
    const bb = bodyBox(e.img), S = SC * (e.size || 1);
    const hw = bb ? (bb.w * S) / 2 : 12, bh = bb ? bb.h * S : 30;
    if (t.hit) {
      const h = t.hit;
      h.t += dt;
      e.rot = 0; e.frame = "stand"; e.sx = 1; e.sy = 1; e.jig = null;
      let c = 0, sag = 0, leave = false;
      if (!h.stick) {
        // 튕길 때: 푹 눌렸다가 되돌아오는 한 번의 출렁임
        const k = h.t / h.dur;
        c = h.amp * Math.sin(Math.PI * Math.min(1, k)) * (k < 0.5 ? 1 : 0.9);
        e.face = "sweat";
        leave = k >= 1;
      } else {
        // 붙을 때: 철썩 눌리고 → 젤리처럼 부르르 → 처지며 흘러내리고 → 쭉 늘어났다가 톡 떨어져요
        const rest = h.amp * 0.62, peel = 0.26, hold = h.dur - peel;
        const peak = Math.min(0.85, h.amp * 1.25); // 닿는 순간에는 더 푹 눌렸다가
        if (h.t < 0.09) c = peak * (1 - Math.pow(1 - h.t / 0.09, 2));
        else if (h.t < hold) { const q = h.t - 0.09; c = rest + (peak - rest) * Math.exp(-5.5 * q) * Math.cos(19 * q); }
        else { const q = Math.min(1, (h.t - hold) / peel); c = rest * (1 - q) - 0.32 * Math.sin(q * Math.PI); }
        const slide = Math.max(0, (h.t - 0.5) / Math.max(0.2, hold - 0.5));
        sag = Math.min(1, slide) * 0.9;
        if (h.side !== "top" && h.t > 0.5) e.b = Math.max(4, e.b - dt * (10 + 46 * slide * slide));
        e.face = h.t < 0.6 ? "sweat" : "blink";
        leave = h.t >= h.dur || (h.side !== "top" && e.b <= 4.5 && h.t > 0.7);
      }
      if (!leave && drawWarp(e, h.side, c, sag)) return;
      // 벽에서 떨어져 나가요
      endWarp(e);
      t.hit = null;
      const out = h.stick ? 60 : h.speed * (h.side === "bottom" ? 0.45 : 0.6);
      if (h.side === "left") { e.x = hw; t.vx = out; if (h.stick) t.vy = 0; }
      else if (h.side === "right") { e.x = W - hw; t.vx = -out; if (h.stick) t.vy = 0; }
      else if (h.side === "top") { e.b = H - bh - 2; t.vy = -out * 0.6; }
      else { t.vy = out; t.vx *= 0.7; }
      jiggle(e, Math.min(0.5, h.amp * (h.stick ? 0.7 : 0.6)), h.side === "left" || h.side === "right" ? "x" : "y");
      if (h.stick) say(e, pick(["떼굴", "휴…", "말랑", "뽁!"]));
      return;
    }
    const hit = (side, speed) => {
      const amp = Math.max(0.2, Math.min(0.8, speed / 1050));
      const stick = side !== "bottom" && speed > 380 && Math.random() < 0.58;
      t.hit = { side, t: 0, amp: stick ? Math.max(0.55, amp) : amp, speed, stick, dur: stick ? rand(1.5, 2.8) : 0.17 + amp * 0.16 };
      if (stick) { say(e, pick(["철썩!", "찰싹", "쭈욱…", "납작"])); }
      if (speed > 300 && window.FX && FX.cutePop) { const sr = scene.getBoundingClientRect(); FX.cutePop(sr.left + (side === "left" ? 2 : side === "right" ? W - 2 : e.x), sr.top + (side === "top" ? 2 : side === "bottom" ? H - e.b : H - e.b - bh / 2), 0.3); }
      if (side === "bottom") drops(e.x, 6, 4, 10, "#d8c8a0");
    };
    t.vy -= (bird ? 500 : 1500) * dt;
    e.x += t.vx * dt; e.b += t.vy * dt;
    e.rot = (e.rot + t.vx * dt * 1.4) % 360;
    e.frame = bird ? (Math.floor(t.t * 14) % 2 ? "fly1" : "fly2") : "stand";
    e.face = "sweat";
    if (e.x < hw && t.vx < 0) { e.x = hw; if (Math.abs(t.vx) > 120) { hit("left", Math.abs(t.vx)); return; } t.vx = Math.abs(t.vx) * 0.5; }
    if (e.x > W - hw && t.vx > 0) { e.x = W - hw; if (Math.abs(t.vx) > 120) { hit("right", Math.abs(t.vx)); return; } t.vx = -Math.abs(t.vx) * 0.5; }
    if (e.b > H - bh - 2 && t.vy > 0) { e.b = H - bh - 2; if (t.vy > 160) { hit("top", t.vy); return; } t.vy = -Math.abs(t.vy) * 0.4; }
    const floor = bird ? 30 : 4;
    const done = () => {
      e.thrown = null; e.rot = 0; e.lift = 0; e.face = ""; e.taps = [];
      endWarp(e);
      if (bird) { e.fx.tx = e.x; e.fx.tb = Math.max(e.b, H * 0.4); e.vx = 0; e.vb = 0; setState(e, "hover", 1.5); return; }
      if (e.kind === "egg") { e.b = 5; setState(e, "sit", 3); e.fx.wob = 0.8; say(e, pick(["데굴데굴", "…!", "어지러워"])); return; }
      e.b = e.kind === "cat" ? 4 : 6;
      if (e.kind === "hippo") {
        if (e.x > pond.x0 + 8 && e.x < pond.x1 - 8) { e.swim = true; ring(e.x); drops(e.x, pond.b + 8, 14, 26, "#bfe6ff"); say(e, "첨벙!"); setState(e, "swim", rand(4, 8)); }
        else setState(e, "land", 6);
      } else if (e.kind === "cat") setState(e, "loaf", 2.5);
      else setState(e, "idle", 2);
      if (!e.swim) { if (!e.jig) jiggle(e, 0.22, "y"); say(e, pick(["휴…", "어질어질", "또 던져 줘!"])); }
    };
    if (bird && (t.t > 1.4 || Math.hypot(t.vx, t.vy) < 70)) { done(); return; }
    if (e.b <= floor && t.vy < 0) {
      e.b = floor;
      if (!bird && Math.abs(t.vy) > 220) hit("bottom", Math.abs(t.vy));
      else if (bird) { t.vy = Math.abs(t.vy) * 0.5; }
      else done();
    }
  }

  // ---------- 날아다니는 친구 ----------
  // 종류마다 나는 버릇이 달라요.
  //   새: 날갯짓으로 올라가고, 날개를 편 채 미끄러지고, 지붕이나 우체통에 내려앉아 쉬어요.
  //   나비, 벌 같은 벌레: 낮게 팔랑팔랑, 꽃이나 머리 위를 맴돌아요.
  //   박쥐: 낮에는 높은 데서 자고 밤에 날아요.  용, 페가수스: 크게 원을 그리며 느긋하게.
  const flyType = (e) => (/^bg/.test(e.sp) ? "bug" : /^wb2[56]$/.test(e.sp) ? "bat" : /^(my|dn)/.test(e.sp) ? "big" : "bird");
  const CALLS = { bug: ["붕붕", "팔랑", "윙~"], bat: ["끼익", "찍"], big: ["크앙", "후웅", "슈우"], bird: ["짹!", "삐약", "휘익", "짹짹"] };
  function perches() {
    const sr = scene.getBoundingClientRect(), out = [];
    ["home", "mailbox", "kennel", "closet"].forEach((id) => { const el = $(id); if (!el || el.hidden || !el.offsetWidth) return; const r = el.getBoundingClientRect(); out.push([r.left - sr.left + r.width * (id === "closet" ? 0.04 : 0.5), sr.bottom - r.top - 5]); });
    return out;
  }
  function bird(e, dt, E) {
    e.t -= dt;
    e.acc += dt;
    const type = flyType(e);
    if (e.vx == null) { e.vx = 0; e.vb = 0; }
    const lo = type === "bug" ? 16 : H * 0.36, hi = type === "bug" ? Math.max(40, H * 0.5) : Math.max(H * 0.36 + 10, H - 84);
    // 목표로 부드럽게: 속도를 조금씩 바꿔서, 가까워지면 느려져요
    const steer = (speed, acc) => {
      const dx = e.fx.tx - e.x, db = e.fx.tb - e.b, d = Math.hypot(dx, db) || 1;
      const want = Math.min(speed, d * 2.4), k = Math.min(1, (acc || 2.4) * dt);
      e.vx += ((dx / d) * want - e.vx) * k; e.vb += ((db / d) * want - e.vb) * k;
      e.x += e.vx * dt; e.b += e.vb * dt;
      if (Math.abs(e.vx) > 4) e.flip = e.vx < 0;
      e.rot = Math.max(-16, Math.min(16, -e.vb * 0.22)) * (e.flip ? -1 : 1);
      return d < 5;
    };
    const flapAt = (hz) => (Math.floor(e.acc * hz) % 2 ? "fly1" : "fly2");
    const pickSpot = () => { e.fx.tx = rand(24, W - 24); e.fx.tb = rand(lo, hi); };
    const next = () => {
      const r = Math.random();
      e.rot = 0;
      if (type === "bug") {
        if (r < 0.5) { e.fx.ax = rand(30, W - 30); e.fx.ab = rand(lo, hi); e.fx.n = 6 + Math.floor(rand(0, 6)); e.fx.tx = e.fx.ax; e.fx.tb = e.fx.ab; setState(e, "flutter", 0.5); }
        else if (r < 0.75) { e.fx.tx = couplePos() + rand(-22, 22); e.fx.tb = rand(58, 70); setState(e, "visit", 7); }
        else { pickSpot(); setState(e, "fly", 6); }
      } else if (r < 0.28 && type !== "big") {
        const ps = perches();
        if (ps.length) { const p = pick(ps); e.fx.tx = p[0]; e.fx.tb = p[1]; setState(e, "toperch", 8); } else { pickSpot(); setState(e, "fly", 6); }
      } else if (r < 0.5) { e.fx.tx = e.x < W / 2 ? rand(W * 0.6, W - 24) : rand(24, W * 0.4); e.fx.tb = Math.max(lo, e.b - rand(20, 50)); setState(e, "glide", 6); }
      else if (r < 0.66) { e.fx.cx = rand(W * 0.3, W * 0.7); e.fx.cb = rand(lo + 16, hi - 6); e.fx.r = type === "big" ? rand(34, 52) : rand(18, 30); e.fx.a = Math.atan2(e.b - e.fx.cb, e.x - e.fx.cx); e.fx.dir = Math.random() < 0.5 ? 1 : -1; setState(e, "circle", rand(4, 7)); }
      else if (r < 0.8 && type !== "big") { e.fx.sx0 = e.x; e.fx.sb0 = e.b; e.fx.sx1 = e.x < W / 2 ? Math.min(W - 24, e.x + rand(70, 130)) : Math.max(24, e.x - rand(70, 130)); e.fx.dip = Math.max(0, e.b - rand(26, 40)); setState(e, "swoop", 1.8); }
      else { pickSpot(); setState(e, "fly", 6); }
    };
    // 밤: 박쥐는 깨어나고, 나머지는 지붕 높이로 내려와 졸아요
    const sleepy = type === "bat" ? !E.night : E.night;
    if (sleepy && e.st !== "roost" && !e.busy) { e.fx.tx = rand(W * 0.2, W * 0.8); e.fx.tb = type === "bat" ? H - 34 : rand(34, 52); setState(e, "roost", 0); }
    if (!sleepy && e.st === "roost") { e.rot = 0; pickSpot(); setState(e, "fly", 6); }
    switch (e.st) {
      case "roost": {
        const there = steer(30);
        e.frame = there ? "lie" : flapAt(7); e.face = there ? "sleep" : "";
        if (there) { e.vx = 0; e.vb = 0; e.rot = type === "bat" ? 180 : 0; }
        e.lift = there ? Math.sin(e.acc * 1.4) * 1 : 0;
        if (there && Math.random() < dt * 0.12) zzz(e);
        break;
      }
      case "hover": {
        e.frame = flapAt(type === "bug" ? 12 : 7); e.face = Math.floor(e.acc * 2) % 7 === 0 ? "blink" : "";
        e.vx *= 0.9; e.vb *= 0.9; e.rot *= 0.9;
        e.lift = Math.sin(e.acc * 3) * 3;
        if (e.t < 0) next();
        break;
      }
      case "glide": {
        // 날개를 편 채 스르르 미끄러져요. 가끔 한두 번만 퍼덕.
        e.frame = Math.floor(e.acc * 1.2) % 4 === 3 ? flapAt(8) : "fly1"; e.face = "happy";
        e.lift = 0;
        if (steer(type === "big" ? 30 : 38, 1.4) || e.t < 0) setState(e, "hover", rand(1, 3));
        break;
      }
      case "circle": {
        e.fx.a += e.fx.dir * dt * (type === "big" ? 0.9 : 1.5);
        e.fx.tx = e.fx.cx + Math.cos(e.fx.a) * e.fx.r; e.fx.tb = e.fx.cb + Math.sin(e.fx.a) * e.fx.r * 0.45;
        e.frame = flapAt(type === "bug" ? 12 : 6); e.face = "";
        steer(60, 4);
        if (e.t < 0) setState(e, "hover", rand(1, 2.5));
        break;
      }
      case "swoop": {
        // 아래로 휙 내려갔다가 다시 올라와요
        const k = 1 - Math.max(0, e.t) / 1.8, px = e.x, pb = e.b;
        e.x = e.fx.sx0 + (e.fx.sx1 - e.fx.sx0) * k;
        e.b = e.fx.sb0 - Math.sin(k * Math.PI) * (e.fx.sb0 - e.fx.dip);
        e.flip = e.fx.sx1 < e.fx.sx0;
        e.vx = (e.x - px) / dt; e.vb = (e.b - pb) / dt;
        e.rot = Math.max(-28, Math.min(28, -e.vb * 0.3)) * (e.flip ? -1 : 1);
        e.frame = k < 0.5 ? "fly1" : flapAt(12); e.face = "happy"; e.lift = 0;
        if (e.t < 0) { e.rot = 0; setState(e, "hover", rand(1, 2)); }
        break;
      }
      case "toperch": {
        e.frame = flapAt(8); e.face = ""; e.lift = 0;
        if (steer(40, 2)) { e.vx = 0; e.vb = 0; e.rot = 0; e.x = e.fx.tx; e.b = e.fx.tb; setState(e, "perch", rand(5, 11)); e.fx.hop = rand(1, 3); }
        else if (e.t < 0) setState(e, "hover", 1);
        break;
      }
      case "perch": {
        // 내려앉아 쉬어요. 두리번거리고, 콩콩 뛰고, 가끔 지저귀어요.
        e.frame = "stand"; e.face = blink(e, dt) ? "blink" : "";
        e.fx.hop -= dt;
        if (e.fx.hop < 0) { e.fx.hop = rand(1.2, 3.5); const r2 = Math.random(); if (r2 < 0.4) e.flip = !e.flip; else if (r2 < 0.75) e.fx.jump = 0.3; else { say(e, pick(CALLS[type])); hearts(e, 1, "note"); } }
        if (e.fx.jump > 0) { e.fx.jump -= dt; e.lift = Math.sin((1 - e.fx.jump / 0.3) * Math.PI) * 5; } else e.lift = 0;
        if (e.t < 0) { e.lift = 0; pickSpot(); e.fx.tb = Math.max(e.fx.tb, e.b + 20); setState(e, "fly", 6); }
        break;
      }
      case "flutter": {
        // 팔랑팔랑: 한 자리 둘레를 이리저리 짧게 옮겨 다녀요
        e.frame = flapAt(13); e.face = "";
        e.lift = Math.sin(e.acc * 9) * 2;
        steer(34, 5);
        if (e.t < 0) { if (--e.fx.n > 0) { e.fx.tx = Math.max(16, Math.min(W - 16, e.fx.ax + rand(-34, 34))); e.fx.tb = Math.max(lo, Math.min(hi, e.fx.ab + rand(-16, 16))); e.t = rand(0.35, 0.9); } else setState(e, "hover", rand(0.8, 2)); }
        break;
      }
      case "visit": {
        // 둘의 머리 위를 맴돌아요
        e.frame = flapAt(13); e.face = "happy";
        e.lift = Math.sin(e.acc * 8) * 2;
        if (steer(30, 3) && Math.random() < dt * 1.2) { e.fx.tx = couplePos() + rand(-26, 26); e.fx.tb = rand(56, 72); if (Math.random() < 0.3) hearts(e, 1); }
        if (e.t < 0) setState(e, "hover", rand(0.8, 2));
        break;
      }
      case "loop": {
        // 한 바퀴 빙글
        const k = 1 - Math.max(0, e.t) / 1.1;
        e.frame = flapAt(10); e.face = "happy"; e.rot = (e.flip ? -1 : 1) * k * 360; e.lift = Math.sin(k * Math.PI) * 16;
        if (e.t < 0) { e.rot = 0; e.lift = 0; setState(e, "hover", 1.2); }
        break;
      }
      case "dash": {
        e.frame = flapAt(14); e.face = "happy";
        if (steer(170, 6)) { if (--e.fx.n > 0) { e.fx.tx = e.fx.tx < W / 2 ? W - 20 : 20; e.fx.tb = rand(lo, hi); } else setState(e, "hover", 1.5); }
        break;
      }
      default: {
        // 날갯짓하며 다음 자리로. 올라갈 때는 더 열심히 퍼덕여요.
        e.frame = flapAt(e.vb > 8 ? 11 : type === "bug" ? 12 : 7); e.face = "";
        e.lift = Math.sin(e.acc * 2.2) * 2;
        if (steer(E.windy ? 46 : type === "big" ? 28 : 34) || e.t < 0) setState(e, "hover", rand(1.2, 4));
      }
    }
  }

  // ---------- 알과 번데기: 가만히 있다가 가끔 꿈틀 ----------
  function egg(e, dt) {
    e.t -= dt;
    e.frame = "stand"; e.face = "";
    if (e.fx.wob > 0) { e.fx.wob -= dt; e.rot = Math.sin(e.fx.wob * 26) * 11 * Math.min(1, e.fx.wob * 2); }
    else e.rot = 0;
    if (e.t < 0) { e.t = e.grow.next <= 2 ? rand(1.2, 3) : rand(3, 8); e.fx.wob = e.grow.next <= 2 ? 0.9 : 0.5; if (Math.random() < 0.3) say(e, e.form === "cocoon" ? pick(["…", "꿈틀"]) : e.grow.next <= 2 ? pick(["톡톡", "곧 나갈게!", "빠직?"]) : pick(["…", "꿈틀", "따뜻해"])); }
  }

  function sheep(e, dt, E) {
    e.t -= dt;
    const [l, r] = landRange(e);
    if (E.night && e.st !== "sleep" && !e.busy) setState(e, "sleep", 8);
    switch (e.st) {
      case "walk": {
        if (!e.fx.target) e.fx.target = rand(l, r);
        if (moveTo(e, e.fx.target, E.windy ? 8 : 13, dt)) { e.fx.target = 0; setState(e, pick(["graze", "graze", "idle", "baa", "pronk"]), rand(2, 5)); }
        else e.frame = walkFrame(e, dt, 13);
        e.face = "";
        break;
      }
      case "graze": {
        e.frame = Math.floor(e.t * 2.5) % 2 ? "eat" : "stand";
        e.face = "";
        if (e.t < 0) setState(e, pick(["walk", "walk", "idle", "baa"]), rand(2, 4));
        break;
      }
      case "idle": {
        e.frame = "stand"; e.face = blink(e, dt) ? "blink" : "";
        if (E.wet && Math.random() < dt * 0.3) { setState(e, "shake", 0.8); break; }
        if (e.t < 0) setState(e, pick(["walk", "graze"]), rand(2, 4));
        break;
      }
      case "baa": {
        e.frame = "stand"; e.face = "baa";
        if (!e.fx.said) { e.fx.said = true; say(e, E.wet ? "메에… 젖었어" : E.snowy ? "메에! 눈이다" : pick(["메에~", "메에에", "음메"])); }
        if (e.t < 0) { e.fx.said = false; setState(e, "walk", 3); }
        break;
      }
      case "pronk": {
        // 네 발로 통통 뛰기
        const p = 1 - e.t / 1.2;
        e.lift = Math.abs(Math.sin(p * Math.PI * 3)) * 9;
        e.frame = "walk1"; e.face = "happy";
        if (e.t < 0) { e.lift = 0; setState(e, "walk", 3); }
        break;
      }
      case "shake": {
        e.tx = Math.sin(e.t * 60) * 1.6;
        e.frame = "stand"; e.face = "blink";
        if (Math.random() < dt * 20) drops(e.x, e.b + 14, 1, 12, "#bfe6ff");
        if (e.t < 0) { e.tx = 0; setState(e, "idle", 2); }
        break;
      }
      case "sleep": {
        e.frame = "lie"; e.face = "sleep";
        e.fx.z = (e.fx.z || 0) - dt;
        if (e.fx.z < 0) { e.fx.z = 2; zzz(e); }
        if (!E.night) setState(e, "idle", 2);
        break;
      }
      case "puff": {
        e.scale = 1 + 0.18 * Math.sin(Math.min(1, (2 - e.t) / 0.3) * Math.PI / 2);
        e.face = "happy"; e.frame = "stand";
        if (e.t < 0) { e.scale = 1; setState(e, "idle", 1); }
        break;
      }
      case "roll": {
        // 데굴데굴 털 뭉치
        e.rot += dt * 720 * (e.flip ? -1 : 1);
        e.x += (e.flip ? -1 : 1) * 40 * dt;
        if (e.x < l || e.x > r) e.flip = !e.flip;
        e.face = "happy"; e.frame = "lie";
        if (e.t < 0) { e.rot = 0; setState(e, "idle", 1.5); }
        break;
      }
      case "cloud": {
        // 구름처럼 둥실
        const p = 1 - e.t / 3.4;
        e.lift = Math.sin(Math.min(1, p * 1.3) * Math.PI / 2) * 34 * (1 - Math.max(0, p - 0.75) * 4);
        e.tx = Math.sin(p * Math.PI * 4) * 6;
        e.scale = 1.15; e.face = "happy"; e.frame = "lie";
        if (Math.random() < dt * 6) hearts(e, 1, "spark");
        if (e.t < 0) { e.lift = 0; e.tx = 0; e.scale = 1; setState(e, "idle", 2); }
        break;
      }
      default: setState(e, "walk", 3);
    }
  }

  // ============================================================
  // 먼치킨 고양이: 짧은 다리로 아장아장, 식빵 굽고, 그루밍, 우다다
  // ============================================================
  function cat(e, dt, E) {
    e.t -= dt;
    const [l, r] = landRange(e);
    const cx = couplePos();
    e.fx.tail = (e.fx.tail || 0) - dt;
    if (e.fx.tail < 0) { e.fx.tail = rand(0.3, 1.2); e.tail = e.tail ? 0 : 1; }
    // 비, 눈 오면 두 사람 발치로 와서 식빵
    if ((E.wet || E.snowy) && !e.busy && e.st !== "shelter" && e.st !== "goshelter") setState(e, "goshelter", 20);
    switch (e.st) {
      case "walk": {
        if (!e.fx.target) e.fx.target = rand(l, r);
        if (moveTo(e, e.fx.target, 15, dt)) {
          e.fx.target = 0;
          const opts = E.night ? ["hunt", "loaf", "sit"] : E.sunny ? ["loaf", "nap", "groom", "stretch", "rub", "sit"] : ["loaf", "groom", "stretch", "rub", "sit"];
          setState(e, pick(opts), rand(2.5, 5));
        } else e.frame = walkFrame(e, dt, 15);
        e.face = E.night ? "glow" : "";
        break;
      }
      case "sit": case "loaf": {
        e.frame = e.st === "sit" ? "stand" : "loaf";
        e.face = blink(e, dt) ? "blink" : E.night ? "glow" : "";
        if (e.t < 0) setState(e, "walk", 3);
        break;
      }
      case "nap": {
        e.frame = "loaf"; e.face = "blink";
        e.fx.z = (e.fx.z || 0) - dt;
        if (e.fx.z < 0) { e.fx.z = 2.2; zzz(e); }
        if (e.t < 0) setState(e, "stretch", 1.2);
        break;
      }
      case "groom": {
        e.frame = Math.floor(e.t * 3) % 2 ? "groom" : "loaf";
        e.face = "blink";
        if (e.t < 0) setState(e, "walk", 3);
        break;
      }
      case "stretch": {
        e.frame = "stretch"; e.face = "happy";
        if (e.t < 0) setState(e, "walk", 3);
        break;
      }
      case "rub": {
        // 두 사람 발치에 몸 비비기
        const tx = cx + (e.fx.side || (e.fx.side = Math.random() < 0.5 ? -26 : 26));
        if (!moveTo(e, tx, 18, dt)) { e.frame = walkFrame(e, dt, 18); e.face = ""; break; }
        e.frame = "stand"; e.face = "happy";
        e.tx = Math.sin(e.t * 9) * 2.5;
        if (Math.random() < dt * 1.2) hearts(e, 1);
        if (e.t < 0) { e.tx = 0; e.fx.side = 0; setState(e, "walk", 3); }
        break;
      }
      case "hunt": {
        // 밤에는 눈이 반짝, 반딧불을 노려요
        e.frame = "loaf"; e.face = "glow";
        e.tx = Math.sin(e.t * 20) * 0.6;
        if (e.t < 0) { e.tx = 0; setState(e, "pounce", 0.6); }
        break;
      }
      case "pounce": {
        const p = 1 - e.t / 0.6;
        e.lift = Math.sin(p * Math.PI) * 16;
        e.x += (e.flip ? -1 : 1) * 40 * dt;
        e.frame = "stretch"; e.face = E.night ? "glow" : "happy";
        if (e.t < 0) { e.lift = 0; setState(e, "sit", 2); }
        break;
      }
      case "goshelter": {
        const tx = cx + 34;
        if (moveTo(e, tx, 20, dt)) setState(e, "shelter", 30);
        else e.frame = walkFrame(e, dt, 20);
        e.face = "grump";
        break;
      }
      case "shelter": {
        e.frame = "loaf"; e.face = blink(e, dt) ? "blink" : "grump";
        if (Math.random() < dt * 0.04) say(e, E.snowy ? "발 시려…" : "비 싫어…");
        if (!E.wet && !E.snowy) setState(e, "stretch", 1.2);
        break;
      }
      case "belly": {
        e.rot = 180; e.frame = "stand"; e.face = "happy";
        if (Math.random() < dt * 2) hearts(e, 1);
        if (e.t < 0) { e.rot = 0; setState(e, "sit", 1.5); }
        break;
      }
      case "zoomies": {
        // 우다다다
        e.frame = walkFrame(e, dt * 3, 40); e.face = "happy";
        if (moveTo(e, e.fx.target || (e.fx.target = e.x < W / 2 ? W - 20 : 20), 150, dt)) e.fx.target = e.x < W / 2 ? W - 20 : 20;
        if (Math.random() < dt * 10) drops(e.x, e.b + 2, 1, 6, "#c9b28a");
        if (e.t < 0) { e.fx.target = 0; setState(e, "loaf", 2.5); say(e, "헥헥"); }
        break;
      }
      case "head": {
        // 머리 위에 올라가 식빵
        const bobs = document.querySelectorAll(".couple .bob");
        const bob = bobs[e.fx.who || 0];
        if (bob) {
          const br = bob.getBoundingClientRect(), sr = scene.getBoundingClientRect();
          e.x = br.left - sr.left + br.width / 2;
          e.b = H - (br.top - sr.top) - 2;
        }
        e.frame = "loaf"; e.face = blink(e, dt) ? "blink" : "happy";
        if (e.t < 0) { e.b = 4; e.lift = 0; drops(e.x, 10, 3, 10, "#c9b28a"); setState(e, "sit", 2); say(e, "냥!"); }
        break;
      }
      default: setState(e, "walk", 3);
    }
  }

  // ---------- 누르기: 횟수마다 다른 반응 ----------
  function tap(e) {
    const now = performance.now();
    e.taps = e.taps.filter((t) => now - t < 1400);
    e.taps.push(now);
    const n = e.taps.length;
    const E = env();
    e.el.animate([{ scale: "1" }, { scale: "1.12 .9" }, { scale: "1" }], { duration: 220, composite: "add" });
    if (e.kind === "egg") {
      e.fx.wob = 0.9;
      say(e, e.form === "cocoon" ? pick(["자는 중…", "곧 날개가 생겨"]) : e.grow.next <= 2 ? pick(["곧 나갈게!", "톡톡톡"]) : pick(["아직이야", "따뜻해", `${e.grow.next}번 뒤에 만나`]));
      if (n >= 3) hearts(e, 2);
      return;
    }
    if (e.kind === "bird") {
      if (e.st === "roost") { say(e, "쿨…"); return; }
      const calls = CALLS[flyType(e)];
      e.rot = 0;
      if (n === 1) { setState(e, "loop", 1.1); say(e, pick(calls)); }
      else if (n === 2) { hearts(e, 4); setState(e, "hover", 1.6); say(e, pick(calls)); }
      else { e.fx.n = 3; e.fx.tx = e.x < W / 2 ? W - 20 : 20; e.fx.tb = e.b; setState(e, "dash", 0); say(e, "슈웅!"); e.taps = []; }
      return;
    }
    if (e.kind === "hippo") {
      if (e.st === "sleepswim") { say(e, n > 2 ? "zzz… 5분만…" : "음냐…"); drops(e.x + 12, pond.b + 10, 2, 2, "#dff3ff"); return; }
      if (n === 1) { if (e.swim) { setState(e, "dive", 2.2); say(e, "뽀글"); } else { e.fx.yawn = 1.4; say(e, "하아암"); } }
      else if (n === 2) { hearts(e, 3); say(e, "뿌우~"); drops(e.x + (e.flip ? -12 : 12), pond.b + 14, 8, 14, "#bfe6ff"); }
      else if (n <= 5) { if (e.swim) { setState(e, "jump", 1.0); } else { toPond(e); say(e, "첨벙 갈래!"); } }
      else { setState(e, "dance", 2.4); say(e, "신난다!"); e.taps = []; }
    }
    if (e.kind === "sheep") {
      if (e.st === "sleep") { say(e, "음…메…"); return; }
      if (n === 1) { setState(e, "pronk", 1.2); say(e, E.snowy ? "눈 좋아!" : "메에"); }
      else if (n === 2) { setState(e, "puff", 2); say(e, "폭신!"); hearts(e, 3); }
      else if (n <= 5) { setState(e, "roll", 2.4); say(e, "데굴데굴"); }
      else { setState(e, "cloud", 3.4); say(e, "둥실~ 구름이 됐어"); e.taps = []; }
    }
    if (e.kind === "cat") {
      if (n === 1) { e.tail = e.tail ? 0 : 1; say(e, E.night ? "냐?" : pick(["냐옹", "야옹", "냥"])); if (e.st === "walk") setState(e, "sit", 2); }
      else if (n === 2) { setState(e, "belly", 2.4); say(e, "골골골"); }
      else if (n <= 5) { if (e.st !== "zoomies") { setState(e, "zoomies", 3); say(e, "우다다다!"); } }
      else { e.fx.who = Math.random() < 0.5 ? 0 : 1; setState(e, "head", 4.5); say(e, "여기 내 자리야"); hearts(e, 4); e.taps = []; }
    }
  }

  // ---------- 그리기 ----------
  function render(e) {
    let src;
    src = e.kind === "egg" ? eggImg(e.id, e.form) : SP.petImg(e.sp, e.frame, e.face, env().wet, e.tail);
    if (src !== e.src) { e.img.src = src; e.src = src; }
    e.img.style.visibility = e.warping ? "hidden" : "";
    const iw = e.img.naturalWidth * SC || 50;
    e.img.style.width = iw + "px";
    let b = e.kind === "hippo" && e.swim ? pond.b + pond.water - 2 : e.b;
    b += e.lift;
    const sz = e.size || 1;
    if (sz < 1) b -= (1 - sz) * (e.img.naturalHeight * SC || 40) * 0.3; // 작게 그려도 발이 땅에 닿게
    e.el.style.left = (e.x - iw / 2 + (e.tx || 0)).toFixed(1) + "px";
    e.el.style.bottom = b.toFixed(1) + "px";
    e.el.style.width = iw + "px";
    const sc = (e.scale || 1) * sz;
    e.img.style.transform = `scaleX(${e.flip ? -1 : 1}) rotate(${e.rot || 0}deg) scale(${(sc * (e.sx || 1)).toFixed(3)}, ${(sc * (e.sy || 1)).toFixed(3)})`;
    // 헤엄칠 땐 물 위로 머리만
    const sw = e.sp === "hippo" ? SP.HIPPO_SWIM || 8 : 15;
    const swimH = Math.round(sw * SC + (e.fx.sink ? -e.fx.sink * sw * SC : 0));
    e.clip.style.height = e.kind === "hippo" && e.swim ? Math.max(0, swimH) + "px" : "";
    e.el.classList.toggle("swim", e.kind === "hippo" && e.swim);
    e.el.style.zIndex = e.zz ? String(e.zz) : e.kind === "cat" && e.st === "head" ? "8" : e.b > 8 ? "4" : "6";
    if (e.sayT > 0) {
      e.sayT -= 1 / 60;
      if (e.sayT <= 0) e.say.hidden = true;
    }
  }

  function frame(ts) {
    raf = 0;
    if (!visible()) return;
    const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016;
    last = ts;
    if (scene.clientWidth !== W) layout(false);
    const E = env();
    pondEl.classList.toggle("frozen", E.snowy && E.cold);
    if (window.Play && Play.tick) Play.tick(dt);
    ents.forEach((e) => {
      e.busy = ["loop", "dash", "jump", "dance", "dive", "climbin", "climbout", "puff", "roll", "cloud", "belly", "zoomies", "head", "pounce", "swoop", "toperch", "walkpond"].includes(e.st);
      if (e.held) { e.frame = e.kind === "bird" ? (Math.floor(ts / 90) % 2 ? "fly1" : "fly2") : "stand"; e.face = "sweat"; e.jig = null; endWarp(e); render(e); return; }
      jiggleStep(e, dt);
      if (e.thrown) { flung(e, dt); render(e); return; }
      // 놀이(js/play.js)가 이 친구를 데리고 있는 동안은 제 버릇대로 움직이지 않아요
      if (e.script) { e.busy = true; if (e.sayT == null) e.sayT = 0; render(e); return; }
      if (e.kind === "hippo") hippo(e, dt, E);
      if (e.kind === "sheep") sheep(e, dt, E);
      if (e.kind === "cat") cat(e, dt, E);
      if (e.kind === "bird") bird(e, dt, E);
      if (e.kind === "egg") egg(e, dt);
      render(e);
    });
    raf = requestAnimationFrame(frame);
  }
  function visible() {
    if (!scene || document.hidden || document.body.classList.contains("game-open")) return false;
    return !!document.querySelector('.view[data-view="home"].is-active');
  }
  function kick() {
    if (!scene && !setup()) return;
    if (!raf && visible()) { last = 0; raf = requestAnimationFrame(frame); }
  }
  function start() {
    setup();
    setInterval(kick, 600);
    document.addEventListener("visibilitychange", kick);
    kick();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(start, 300));
  else setTimeout(start, 300);
  document.addEventListener("hsd:pets", sync);
  // 선물을 받을 때마다 자랐는지 살펴요
  let growT = 0;
  if (window.Store) Store.onChange(() => { clearTimeout(growT); growT = setTimeout(sync, 400); });
  if (window.Store) Store.onChange(() => setTimeout(sync, 50));
  // 놀이가 끝나면 제 버릇으로 돌려보내요
  function release(e) {
    e.script = null; e.zz = 0; e.rot = 0; e.lift = 0; e.tx = 0; e.scale = 1; e.sx = 1; e.sy = 1; e.face = ""; e.fx.target = 0;
    if (e.thrown || e.held) return;
    // 공중에 있던 친구는 툭 옮기지 않고 제 무게로 떨어지게 해요
    if (e.kind !== "bird" && !e.swim && e.b > 14) { e.thrown = { vx: 0, vy: 0, t: 0 }; return; }
    if (e.kind === "bird") { e.fx.tx = e.x; e.fx.tb = Math.max(e.b, H * 0.4); e.vx = 0; e.vb = 0; setState(e, "hover", 1.2); }
    else if (e.kind === "hippo") { if (e.swim || (e.x > pond.x0 + 6 && e.x < pond.x1 - 6 && e.b < 16)) { e.swim = true; setState(e, "swim", rand(3, 6)); } else { e.b = 6; toPond(e); } }
    else if (e.kind === "egg") { e.b = 5; setState(e, "sit", 3); }
    else if (e.kind === "cat") { e.b = 4; setState(e, "sit", 2); }
    else { e.b = 6; setState(e, "idle", 2); }
  }
  function throwEnt(e, vx, vy) { endWarp(e); e.swim = false; e.lift = 0; e.rot = 0; e.scale = 1; e.sx = 1; e.sy = 1; e.tx = 0; e.jig = null; e.thrown = { vx, vy, t: 0 }; }
  window.Pals = { growth, ents, tap, env, sync, say, hearts, drops, ring, zzz, release, throwEnt, flyType, CALLS, kick, geo: () => ({ W, H, pond, scene, layer }) };
})();
