// ============================================================
// 축하 효과: 화면 전체를 덮는 캔버스 하나에 불꽃놀이, 색종이, 리본, 하트, 풍선을 그려요.
// - 효과가 있을 때만 돌고(다 사라지면 멈춤), 누르는 데 걸리지 않아요.
// - 느린 폰에서는 저절로 가볍게: 가루부터 줄이고, 그래도 느리면 해상도를 낮춰요.
// ============================================================
(function () {
  "use strict";
  const PALETTE = ["#ff4d8d", "#ffc35c", "#6f8fff", "#7ee2a8", "#c58bff", "#ff8a3d", "#5ce1ff", "#fff27a", "#ff6b6b"];
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (xs) => xs[Math.floor(Math.random() * xs.length)];
  const MAX = 1400, MIN_CAP = 220;
  const HEART = ["0110110", "1111111", "1111111", "0111110", "0011100", "0001000"];
  const reduced = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };

  let cv = null, ctx = null, ps = [], raf = 0, last = 0, dpr = 1, W = 0, H = 0, ft = 16, quality = 1, lowRes = false;
  const glow = new Map(), heartPics = new Map(), buckets = new Map();

  function size() {
    if (!cv) return;
    dpr = lowRes ? 1 : Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  }
  function mount() {
    if (cv) return;
    cv = document.createElement("canvas");
    cv.className = "fx-canvas";
    cv.setAttribute("aria-hidden", "true");
    document.body.appendChild(cv);
    ctx = cv.getContext("2d");
    size();
    window.addEventListener("resize", size);
  }
  function add(p) {
    if (reduced()) return;
    mount();
    const keep = Math.min(1, quality / 0.6);
    if (ps.length >= MIN_CAP + (MAX - MIN_CAP) * keep) return;
    // 끊길 때는 꾸밈 가루부터 솎아요. 터지는 씨앗, 풍선, 번쩍임, 고리, 리본은 그대로
    if (keep < 1 && !p.end && !p.emit && p.shape !== "balloon" && p.shape !== "flash" && p.shape !== "ring" && p.shape !== "ribbon" && Math.random() > keep) return;
    ps.push(Object.assign({ vx: 0, vy: 0, g: 0, drag: 1, life: 0, max: 1, size: 3, color: "#fff", shape: "dot", rot: 0, vrot: 0, add: true, delay: 0 }, p));
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  }
  function glowOf(color) {
    let c = glow.get(color);
    if (!c) {
      c = document.createElement("canvas"); c.width = c.height = 32;
      const x = c.getContext("2d");
      const gr = x.createRadialGradient(16, 16, 0, 16, 16, 16);
      gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.25, color); gr.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = gr; x.fillRect(0, 0, 32, 32);
      glow.set(color, c);
    }
    return c;
  }
  function heartOf(color, u) {
    const k = color + "|" + u;
    let c = heartPics.get(k);
    if (!c) {
      c = document.createElement("canvas"); c.width = 7 * u; c.height = 6 * u;
      const x = c.getContext("2d");
      x.fillStyle = color;
      for (let y = 0; y < HEART.length; y++) for (let i = 0; i < 7; i++) if (HEART[y][i] === "1") x.fillRect(i * u, y * u, u, u);
      x.fillStyle = "rgba(255,255,255,0.7)"; x.fillRect(u, u, u, u);
      heartPics.set(k, c);
    }
    return c;
  }
  function tick(t) {
    const raw = t - last;
    const dt = Math.min(0.05, raw / 1000);
    last = t;
    ft = ft * 0.85 + Math.min(raw, 250) * 0.15;
    const want = Math.max(0.2, Math.min(1, 1 - (ft - 22) / 28));
    quality = want < quality ? want : quality + (want - quality) * 0.04;
    if (!lowRes && quality < 0.4) { lowRes = true; size(); }
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const cur = ps;
    ps = [];
    for (const p of cur) {
      if (p.delay > 0) { p.delay -= dt; ps.push(p); continue; }
      p.life += dt;
      if (p.life >= p.max) { if (p.end) p.end(p); continue; }
      const k = Math.pow(p.drag, dt);
      p.vx *= k;
      p.vy = p.vy * k + p.g * dt;
      if (p.sway) p.vx += Math.sin(p.life * 3 + p.rot) * p.sway * dt;
      if (p.trailLen) {
        const tr = p.trail || (p.trail = []);
        tr.push(p.x, p.y);
        if (tr.length > p.trailLen * 2) tr.splice(0, tr.length - p.trailLen * 2);
      }
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vrot * dt;
      if (p.emit) p.emit(p, dt);
      ps.push(p);
    }
    draw();
    if (ps.length) raf = requestAnimationFrame(tick);
    else {
      raf = 0;
      ctx.clearRect(0, 0, W, H);
      ft = 16; quality = 1;
      if (lowRes) { lowRes = false; size(); }
    }
  }
  // 불똥 꼬리는 색, 굵기, 밝기가 같은 것끼리 한 번에 그어요 (가볍게)
  function drawSparks() {
    for (const b of buckets.values()) b.xs.length = 0;
    const lite = quality < 0.45;
    for (const p of ps) {
      if (p.shape !== "spark" || !p.add || p.delay > 0) continue;
      const r = p.life / p.max;
      let a = r < 0.7 ? 1 : 1 - (r - 0.7) / 0.3;
      if (p.twinkle && r > 0.45) a *= Math.random() < 0.5 ? 0.25 : 1;
      if (a <= 0.02) continue;
      const qa = Math.ceil(a * 4) / 4, w = Math.round(p.size * 2) / 2;
      const k = p.color + "|" + w + "|" + qa;
      let b = buckets.get(k);
      if (!b) buckets.set(k, (b = { color: p.color, w, a: qa, xs: [] }));
      const tr = p.trail;
      if (tr && tr.length >= 2) b.xs.push(tr[0], tr[1], p.x, p.y);
      else b.xs.push(p.x - p.vx * 0.02, p.y - p.vy * 0.02, p.x, p.y);
    }
    ctx.lineCap = "round";
    for (const b of buckets.values()) {
      if (!b.xs.length) continue;
      ctx.globalAlpha = b.a; ctx.strokeStyle = b.color; ctx.lineWidth = b.w;
      ctx.beginPath();
      const xs = b.xs;
      for (let i = 0; i < xs.length; i += 4) { ctx.moveTo(xs[i], xs[i + 1]); ctx.lineTo(xs[i + 2], xs[i + 3]); }
      ctx.stroke();
      if (lite) continue;
      const g = glowOf(b.color), s = b.w * 3.2;
      for (let i = 0; i < xs.length; i += 4) ctx.drawImage(g, xs[i + 2] - s / 2, xs[i + 3] - s / 2, s, s);
    }
    if (buckets.size > 400) buckets.clear();
  }
  function draw() {
    for (const pass of [false, true]) {
      ctx.globalCompositeOperation = pass ? "lighter" : "source-over";
      if (pass) drawSparks();
      for (const p of ps) {
        if (p.add !== pass || p.delay > 0 || p.shape === "none" || p.shape === "spark") continue;
        const r = p.life / p.max;
        let a = r < 0.7 ? 1 : 1 - (r - 0.7) / 0.3;
        if (p.twinkle && r > 0.45) a *= Math.random() < 0.5 ? 0.25 : 1;
        if (a <= 0.02) continue;
        ctx.globalAlpha = a;
        if (p.shape === "dot") {
          const s = p.size * 4;
          ctx.drawImage(glowOf(p.color), p.x - s / 2, p.y - s / 2, s, s);
        } else if (p.shape === "square") {
          // 도트 느낌: 3px 칸에 맞춰 네모로
          const s = Math.max(2, Math.round(p.size));
          ctx.fillStyle = p.color;
          ctx.fillRect(Math.round(p.x / 3) * 3 - s / 2, Math.round(p.y / 3) * 3 - s / 2, s, s);
        } else if (p.shape === "star") {
          // 도트 별: 십자 + 가운데 밝은 칸
          const u = Math.max(2, Math.round(p.size / 3)), x = Math.round(p.x / u) * u, y = Math.round(p.y / u) * u;
          ctx.fillStyle = p.color;
          ctx.fillRect(x - u * 1.5, y - u / 2, u * 3, u); ctx.fillRect(x - u / 2, y - u * 1.5, u, u * 3);
          ctx.fillStyle = "#ffffff"; ctx.fillRect(x - u / 2, y - u / 2, u, u);
        } else if (p.shape === "confetti") {
          const d = dpr, c = Math.cos(p.rot), sn = Math.sin(p.rot), sy = Math.cos(p.life * (p.flutter || 8));
          ctx.setTransform(d * c, d * sn, -d * sn * sy, d * c * sy, d * p.x, d * p.y);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size * 0.35, p.size, p.size * 0.7);
          ctx.setTransform(d, 0, 0, d, 0, 0);
        } else if (p.shape === "ribbon") {
          // 리본 테이프: 지나온 길을 따라 구불구불 이어 그려요
          const tr = p.trail;
          if (tr && tr.length >= 6) {
            ctx.lineCap = "round"; ctx.lineJoin = "round";
            const n = tr.length / 2;
            for (let pass2 = 0; pass2 < 2; pass2++) {
              ctx.strokeStyle = pass2 ? p.color : "rgba(60,40,30,.35)";
              ctx.lineWidth = pass2 ? p.size : p.size + 2;
              ctx.beginPath();
              for (let i = 0; i < n; i++) {
                const wob = Math.sin(i * 0.9 + p.rot + p.life * 9) * p.size * 1.1 * (i / n);
                const x = tr[i * 2] + wob, y = tr[i * 2 + 1] + (pass2 ? 0 : 1);
                if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
              }
              ctx.stroke();
            }
          }
        } else if (p.shape === "heart") {
          const u = Math.max(1, Math.round(p.size / 7));
          ctx.drawImage(heartOf(p.color, u), Math.round(p.x - 3.5 * u), Math.round(p.y - 3 * u));
        } else if (p.shape === "balloon") {
          const s = p.size;
          ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(p.x, p.y + s * 1.1);
          ctx.quadraticCurveTo(p.x + Math.sin(p.life * 4) * 6, p.y + s * 1.9, p.x, p.y + s * 2.8); ctx.stroke();
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.ellipse(p.x, p.y, s * 0.82, s, 0, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.moveTo(p.x - s * 0.15, p.y + s * 1.12); ctx.lineTo(p.x + s * 0.15, p.y + s * 1.12); ctx.lineTo(p.x, p.y + s * 0.95); ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,0.55)";
          ctx.beginPath(); ctx.ellipse(p.x - s * 0.3, p.y - s * 0.35, s * 0.16, s * 0.28, -0.5, 0, Math.PI * 2); ctx.fill();
        } else if (p.shape === "flash") {
          const s = p.size + (p.grow || 0) * p.life;
          ctx.globalAlpha = a * (1 - r);
          ctx.drawImage(glowOf(p.color), p.x - s / 2, p.y - s / 2, s, s);
        } else if (p.shape === "ring") {
          const s = p.size + (p.grow || 0) * p.life;
          ctx.globalAlpha = 1 - r;
          ctx.strokeStyle = p.color; ctx.lineWidth = 3 * (1 - r) + 1;
          ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, Math.PI * 2); ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  // ---------------- 효과 ----------------
  function flash(x, y, color, sz, grow, delay) { add({ x, y, shape: "flash", color, size: sz || 30, grow: grow || 260, max: 0.45, delay: delay || 0 }); }
  function ring(x, y, color, grow, delay, max) { add({ x, y, shape: "ring", color, size: 6, grow: grow || 260, max: max || 0.7, delay: delay || 0, add: false }); }
  // 불꽃 하나가 터져요. pattern: ring, peony, double, willow, heart, star, crossette, pixel
  function explode(x, y, pattern, colors, scale, delay) {
    scale = scale || 1; delay = delay || 0;
    const c1 = colors[0], c2 = colors[1] || colors[0];
    flash(x, y, c1, 26 * scale, 300 * scale, delay);
    const sp = (s) => s * scale;
    if (pattern === "ring" || pattern === "peony" || pattern === "double") {
      const n = pattern === "ring" ? 46 : 72;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + (pattern === "ring" ? 0 : rnd(-0.08, 0.08));
        const v = pattern === "ring" ? sp(190) : sp(rnd(120, 210));
        add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 70, drag: 0.32, max: rnd(1.1, 1.6), size: 2, color: i % 2 ? c1 : c2, shape: "spark", trailLen: 4, twinkle: true, delay });
      }
      if (pattern === "double") for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        add({ x, y, vx: Math.cos(a) * sp(90), vy: Math.sin(a) * sp(90), g: 60, drag: 0.3, max: 1.3, size: 2.4, color: "#ffffff", shape: "dot", twinkle: true, delay });
      }
    } else if (pattern === "willow") {
      for (let i = 0; i < 64; i++) {
        const a = (i / 64) * Math.PI * 2, v = sp(rnd(110, 160));
        add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 55, drag: 0.42, max: rnd(2.2, 3), size: 1.6, color: "#ffd27a", shape: "spark", trailLen: 9, twinkle: true, delay });
      }
    } else if (pattern === "heart") {
      for (let i = 0; i < 64; i++) {
        const t = (i / 64) * Math.PI * 2;
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        add({ x, y, vx: hx * sp(9), vy: hy * sp(9), g: 30, drag: 0.25, max: 1.6, size: 2.2, color: i % 3 ? "#ff4d8d" : "#ffd1e3", shape: "spark", trailLen: 3, twinkle: true, delay });
      }
    } else if (pattern === "star") {
      for (let i = 0; i < 80; i++) {
        const t = (i / 80) * Math.PI * 2, k = 0.55 + 0.45 * Math.cos(5 * t);
        add({ x, y, vx: Math.cos(t - Math.PI / 2) * sp(200) * k, vy: Math.sin(t - Math.PI / 2) * sp(200) * k, g: 50, drag: 0.3, max: 1.5, size: 2, color: i % 2 ? c1 : "#fff6b0", shape: "spark", trailLen: 3, twinkle: true, delay });
      }
    } else if (pattern === "crossette") {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        add({
          x, y, vx: Math.cos(a) * sp(150), vy: Math.sin(a) * sp(150), g: 50, drag: 0.4, max: 0.55, size: 2.6, color: c1, shape: "spark", trailLen: 5, delay,
          end: (p) => { for (let j = 0; j < 4; j++) { const b = (j / 4) * Math.PI * 2 + Math.PI / 4; add({ x: p.x, y: p.y, vx: Math.cos(b) * sp(110), vy: Math.sin(b) * sp(110), g: 60, drag: 0.35, max: 0.9, size: 1.8, color: c2, shape: "spark", trailLen: 4, twinkle: true }); } },
        });
      }
    } else if (pattern === "pixel") {
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2, v = sp(rnd(90, 190));
        add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 140, drag: 0.4, max: rnd(0.9, 1.4), size: rnd(4, 7), color: pick(colors.length > 1 ? colors : PALETTE), shape: "square", add: false, delay });
      }
    }
    // 끝에 반짝이 가루
    for (let i = 0; i < 18; i++) add({ x: x + rnd(-60, 60) * scale, y: y + rnd(-50, 60) * scale, vy: 20, g: 20, max: rnd(0.6, 1.2), size: 1.4, color: "#ffffff", shape: "dot", twinkle: true, delay: delay + rnd(0.5, 0.9) });
  }
  // 아래에서 쏘아 올려 그 자리에서 터져요
  function rocket(x0, y0, x1, y1, pattern, colors, delay, scale) {
    const T = rnd(0.7, 1);
    add({
      x: x0, y: y0, vx: (x1 - x0) / T, vy: (y1 - y0) / T, max: T, size: 2.4, color: "#ffe9a8", shape: "spark", trailLen: 6, delay: delay || 0,
      emit: (p) => { if (Math.random() < 0.7) add({ x: p.x, y: p.y, vx: rnd(-20, 20), vy: rnd(10, 40), g: 120, max: rnd(0.3, 0.6), size: 1.4, color: "#ffb84d", shape: "dot" }); },
      end: (p) => explode(p.x, p.y, pattern, colors, scale || 1),
    });
  }
  // 색종이: 한 점에서 각도 범위로
  function confetti(x, y, angle, spread, n, speed, delay, colors) {
    for (let i = 0; i < n; i++) {
      const a = angle + rnd(-spread, spread), v = rnd(speed[0], speed[1]);
      add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 380, drag: 0.18, max: rnd(2.2, 3.4), size: rnd(6, 10), color: pick(colors || PALETTE), shape: "confetti", rot: rnd(0, 6), vrot: rnd(-8, 8), flutter: rnd(6, 14), sway: 40, add: false, delay: (delay || 0) + rnd(0, 0.08) });
    }
  }
  function confettiRain(n, delay) {
    for (let i = 0; i < n; i++) add({ x: rnd(0, W), y: rnd(-80, -10), vx: rnd(-30, 30), vy: rnd(60, 160), g: 60, drag: 0.6, max: rnd(3, 4.5), size: rnd(6, 10), color: pick(PALETTE), shape: "confetti", rot: rnd(0, 6), vrot: rnd(-6, 6), flutter: rnd(6, 12), sway: 60, add: false, delay: (delay || 0) + rnd(0, 1.2) });
  }
  // 리본 테이프: 한 점에서 쏘아 올려 구불구불 떨어져요
  function ribbons(x, y, angle, spread, n, speed, delay, colors) {
    for (let i = 0; i < n; i++) {
      const a = angle + rnd(-spread, spread), v = rnd(speed[0], speed[1]);
      add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 300, drag: 0.22, max: rnd(2.2, 3.2), size: rnd(3, 4.5), color: pick(colors || PALETTE), shape: "ribbon", rot: rnd(0, 6), trailLen: 16, sway: 70, add: false, delay: (delay || 0) + rnd(0, 0.1) });
    }
  }
  // 파티 폭죽: 색종이 + 리본 + 반짝이를 한 번에 팡
  function popper(x, y, angle, delay) {
    delay = delay || 0;
    flash(x, y, "#fff6c8", 20, 220, delay);
    confetti(x, y, angle, 0.5, 46, [320, 760], delay);
    ribbons(x, y, angle, 0.42, 7, [420, 780], delay);
    for (let i = 0; i < 16; i++) { const a = angle + rnd(-0.6, 0.6), v = rnd(200, 560); add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 260, drag: 0.3, max: rnd(0.8, 1.5), size: rnd(5, 8), color: pick(["#fff27a", "#ffffff", "#ffc35c"]), shape: "star", add: false, delay: delay + rnd(0, 0.06) }); }
  }
  function hearts(x, y, n, spread, delay) {
    for (let i = 0; i < n; i++) {
      const a = rnd(-Math.PI * 0.95, -Math.PI * 0.05), v = rnd(60, (spread || 120) * 1.6);
      add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: -20, drag: 0.35, max: rnd(1.2, 2), size: rnd(9, 16), color: pick(["#ff4d8d", "#ff6b9e", "#ff9ec4", "#e83a6f", "#ffb3d1"]), shape: "heart", sway: 30, add: false, delay: (delay || 0) + rnd(0, 0.15) });
    }
  }
  function heartRain(n, delay) {
    for (let i = 0; i < n; i++) add({ x: rnd(0, W), y: rnd(-60, -10), vy: rnd(70, 140), g: 20, drag: 0.8, max: rnd(3, 4.5), size: rnd(10, 18), color: pick(["#ff4d8d", "#ff6b9e", "#ff9ec4", "#e83a6f"]), shape: "heart", sway: 50, add: false, delay: (delay || 0) + rnd(0, 1.4) });
  }
  function balloons(n, delay) {
    for (let i = 0; i < n; i++) add({ x: rnd(20, W - 20), y: H + rnd(20, 60), vx: rnd(-10, 10), vy: rnd(-150, -100), max: rnd(4.5, 6), size: rnd(13, 19), color: pick(PALETTE), shape: "balloon", sway: 25, add: false, rot: rnd(0, 6), delay: (delay || 0) + rnd(0, 0.6) });
  }
  // 위로 솟는 금빛 분수
  function fountain(x, y, dur, delay) {
    add({ x, y, shape: "none", max: dur || 1.2, delay: delay || 0, emit: (p) => { for (let i = 0; i < 4; i++) { const a = -Math.PI / 2 + rnd(-0.45, 0.45), v = rnd(180, 320); add({ x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 420, drag: 0.6, max: rnd(0.6, 1.1), size: 1.6, color: pick(["#ffd27a", "#fff2b8", "#ffb347"]), shape: "spark", trailLen: 3, twinkle: true }); } } });
  }
  // 한 점으로 빛가루가 모여들어요 (무언가 나타나기 직전)
  function gather(x, y, dur, color) {
    add({ x, y, shape: "none", max: dur || 1.2, emit: (p) => { for (let i = 0; i < 2; i++) { const a = rnd(0, Math.PI * 2), d = rnd(90, 170), T = rnd(0.45, 0.7); add({ x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, vx: (-Math.cos(a) * d) / T, vy: (-Math.sin(a) * d) / T, max: T, size: rnd(1.4, 2.2), color: color || pick(["#fff2b8", "#c8b8ff", "#ffffff"]), shape: "dot", twinkle: true }); } } });
  }
  // ---------- 귀여운 쪽 (도트 하트, 별, 네모가 통통. 빛나는 불꽃 대신 이걸 써요) ----------
  const PASTEL = ["#ff9ab8", "#ffcf6a", "#8ecbff", "#9fe0ae", "#c9aaff", "#ffb08a", "#fff08a", "#ff8f8f"];
  // 한 점에서 하트, 별, 네모가 톡 터져서 둥실 떨어져요
  function cutePop(x, y, scale, delay) {
    scale = scale || 1; delay = delay || 0;
    const n = Math.round(18 * scale);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rnd(-0.25, 0.25), v = rnd(90, 230) * scale;
      const shape = i % 3 === 0 ? "heart" : i % 3 === 1 ? "star" : "square";
      add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60 * scale, g: 260, drag: 0.16, max: rnd(0.9, 1.5), size: shape === "heart" ? rnd(10, 16) : shape === "star" ? rnd(7, 11) : rnd(4, 7), color: shape === "heart" ? pick(["#ff7aa8", "#ff9ab8", "#ffb3c8"]) : pick(PASTEL), shape, sway: 20, add: false, delay: delay + rnd(0, 0.05) });
    }
    // 톡 하고 퍼지는 작은 고리 둘 (도트 네모로)
    for (let k = 0; k < 2; k++) for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, v = (k ? 150 : 90) * scale; add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 0.05, max: 0.42, size: 4, color: k ? "#ffffff" : "#ffe27a", shape: "square", add: false, delay: delay + k * 0.06 }); }
  }
  // 위에서 하트와 별이 살랑살랑 내려와요
  function sprinkle(n, delay) {
    mount();
    for (let i = 0; i < n; i++) { const heart = i % 2 === 0; add({ x: rnd(0, W), y: rnd(-60, -10), vx: rnd(-14, 14), vy: rnd(50, 110), g: 16, drag: 0.8, max: rnd(3, 4.6), size: heart ? rnd(9, 15) : rnd(6, 10), color: heart ? pick(["#ff7aa8", "#ff9ab8", "#ffb3c8"]) : pick(PASTEL), shape: heart ? "heart" : "star", sway: 46, add: false, delay: (delay || 0) + rnd(0, 1.4) }); }
  }
  // 귀여운 파티 폭죽: 파스텔 색종이와 가는 리본 조금, 별 몇 개
  function cutePopper(x, y, angle, delay) {
    delay = delay || 0;
    confetti(x, y, angle, 0.5, 30, [280, 640], delay, PASTEL);
    ribbons(x, y, angle, 0.4, 4, [380, 660], delay, PASTEL);
    for (let i = 0; i < 8; i++) { const a = angle + rnd(-0.5, 0.5), v = rnd(220, 520); add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 280, drag: 0.3, max: rnd(0.9, 1.5), size: rnd(7, 10), color: pick(["#fff08a", "#ffffff", "#ffcf6a"]), shape: "star", add: false, delay: delay + rnd(0, 0.06) }); }
  }
  // 한 점으로 작은 하트와 별이 모여들어요 (무언가 나타나기 직전)
  function cuteGather(x, y, dur) {
    add({ x, y, shape: "none", max: dur || 1, emit: (p) => { if (Math.random() < 0.5) return; const a = rnd(0, Math.PI * 2), d = rnd(80, 150), T = rnd(0.5, 0.8); add({ x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, vx: (-Math.cos(a) * d) / T, vy: (-Math.sin(a) * d) / T, max: T, size: rnd(5, 8), color: pick(PASTEL), shape: Math.random() < 0.5 ? "star" : "square", add: false }); } });
  }
  function pastelBalloons(n, delay) { for (let i = 0; i < n; i++) add({ x: rnd(20, W - 20), y: H + rnd(20, 60), vx: rnd(-10, 10), vy: rnd(-140, -90), max: rnd(4.5, 6), size: rnd(12, 17), color: pick(PASTEL), shape: "balloon", sway: 25, add: false, rot: rnd(0, 6), delay: (delay || 0) + rnd(0, 0.8) }); }
  function clear() { ps = []; }

  window.FX = { PASTEL, cutePop, sprinkle, cutePopper, cuteGather, pastelBalloons, PALETTE, pick, rnd, flash, ring, explode, rocket, confetti, confettiRain, ribbons, popper, hearts, heartRain, balloons, fountain, gather, clear, size: () => { mount(); return { w: W, h: H }; } };
})();
