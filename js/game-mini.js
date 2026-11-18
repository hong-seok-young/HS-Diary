// ============================================================
// 같이 키우기: 놀이 네 가지
// 하트 받기, 벌레 잡기, 물주기 박자, 짝 맞추기
// 모두 화면 주사율에 맞춰 돌고, 끝나면 점수를 돌려줘요.
// ============================================================
(function () {
  "use strict";

  const rand = (a, b) => a + Math.random() * (b - a);
  function img(name, scale) {
    const uri = PIXEL.dataUri(name, scale);
    const i = new Image();
    i.src = uri.slice(5, -2);
    return i;
  }
  function hud(root, title) {
    root.innerHTML = `<div class="mg-hud"><span class="mg-title">${title}</span><span class="mg-score">0점</span><span class="mg-time"></span></div><div class="mg-stage"></div>`;
    return { score: root.querySelector(".mg-score"), time: root.querySelector(".mg-time"), stage: root.querySelector(".mg-stage") };
  }
  function bump(el) {
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  }

  // ---------- 하트 받기 ----------
  function catchGame(root, done) {
    const ui = hud(root, "하트 받기");
    const cv = document.createElement("canvas");
    cv.className = "mg-canvas";
    ui.stage.appendChild(cv);
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const W = Math.min(ui.stage.clientWidth || 320, 420), H = 360;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px";
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    const sp = { heart: img("heartOn", 3), gold: img("goldHeart", 4), bug: img("bug", 4), basket: img("basketBig", 4) };
    let x = W / 2, score = 0, t = 25, acc = 0, shake = 0, raf = 0, last = 0, over = false;
    const items = [];
    const pops = [];
    function move(e) {
      const r = cv.getBoundingClientRect();
      const cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      x = Math.max(22, Math.min(W - 22, cx));
    }
    cv.addEventListener("pointermove", move);
    cv.addEventListener("pointerdown", move);
    cv.addEventListener("touchmove", (e) => { move(e); e.preventDefault(); }, { passive: false });
    function frame(ts) {
      raf = requestAnimationFrame(frame);
      const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016;
      last = ts;
      t -= dt;
      const speed = 1 + (25 - t) / 14;
      acc += dt * (1.4 + (25 - t) / 9);
      while (acc >= 1) {
        acc--;
        const r = Math.random();
        items.push({ kind: r < 0.08 ? "gold" : r < 0.3 ? "bug" : "heart", x: rand(16, W - 16), y: -16, vy: rand(90, 140) * speed, sway: rand(0, 6) });
      }
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      if (shake > 0) { shake -= dt; ctx.translate(rand(-3, 3), rand(-2, 2)); }
      ctx.fillStyle = "#e9f6fd"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#b8e2b0"; ctx.fillRect(0, H - 18, W, 18);
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        it.y += it.vy * dt; it.sway += dt * 3;
        const ix = it.x + Math.sin(it.sway) * 8;
        const s = sp[it.kind];
        if (s.complete) ctx.drawImage(s, Math.round(ix - s.width / 2), Math.round(it.y - s.height / 2));
        if (it.y > H - 46 && it.y < H - 20 && Math.abs(ix - x) < 30) {
          items.splice(i, 1);
          const d = it.kind === "gold" ? 5 : it.kind === "heart" ? 1 : -3;
          score = Math.max(0, score + d);
          pops.push({ x: ix, y: H - 50, text: (d > 0 ? "+" : "") + d, life: 0.8, bad: d < 0 });
          if (d < 0) shake = 0.3;
          ui.score.textContent = score + "점";
          bump(ui.score);
        } else if (it.y > H + 20) items.splice(i, 1);
      }
      if (sp.basket.complete) ctx.drawImage(sp.basket, Math.round(x - sp.basket.width / 2), H - 40);
      ctx.font = "16px NeoDunggeunmo, monospace";
      ctx.textAlign = "center";
      for (let i = pops.length - 1; i >= 0; i--) {
        const p = pops[i];
        p.life -= dt; p.y -= 40 * dt;
        ctx.globalAlpha = Math.max(0, p.life / 0.8);
        ctx.fillStyle = p.bad ? "#d9695f" : "#ee9453";
        ctx.fillText(p.text, p.x, p.y);
        ctx.globalAlpha = 1;
        if (p.life <= 0) pops.splice(i, 1);
      }
      ctx.restore();
      ui.time.textContent = Math.max(0, Math.ceil(t)) + "초";
      if (t <= 0 && !over) { over = true; cancelAnimationFrame(raf); done(score); }
    }
    raf = requestAnimationFrame(frame);
    return () => { over = true; cancelAnimationFrame(raf); };
  }

  // ---------- 벌레 잡기 ----------
  function whackGame(root, done) {
    const ui = hud(root, "벌레 잡기");
    ui.stage.innerHTML = `<div class="mg-holes">${Array.from({ length: 9 }, (_, i) => `<button class="mg-hole" data-i="${i}"><span class="mg-dirt"></span><span class="mg-pop"></span></button>`).join("")}</div>`;
    const holes = Array.from(ui.stage.querySelectorAll(".mg-hole"));
    const bug = PIXEL.sprite("bug", 6), sprout = PIXEL.draw(["G.G", ".G.", ".T."], { G: "#86cc86", T: "#66b46e" }, 7);
    let score = 0, t = 25, next = 0.6, raf = 0, last = 0, over = false;
    const live = new Map(); // 구멍 → { kind, until }
    holes.forEach((h, i) => h.addEventListener("pointerdown", () => {
      const c = live.get(i);
      if (!c) return;
      live.delete(i);
      h.classList.remove("up");
      h.classList.add(c.kind === "bug" ? "hit" : "oops");
      setTimeout(() => h.classList.remove("hit", "oops"), 300);
      score = Math.max(0, score + (c.kind === "bug" ? 2 : -3));
      ui.score.textContent = score + "점";
      bump(ui.score);
    }));
    function frame(ts) {
      raf = requestAnimationFrame(frame);
      const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016;
      last = ts;
      t -= dt; next -= dt;
      const now = performance.now();
      if (next <= 0) {
        next = Math.max(0.35, 0.9 - (25 - t) / 40);
        const free = holes.map((_, i) => i).filter((i) => !live.has(i));
        if (free.length) {
          const i = free[Math.floor(Math.random() * free.length)];
          const kind = Math.random() < 0.2 ? "sprout" : "bug";
          live.set(i, { kind, until: now + Math.max(550, 1000 - (25 - t) * 18) });
          holes[i].querySelector(".mg-pop").innerHTML = kind === "bug" ? bug : sprout;
          holes[i].classList.add("up");
        }
      }
      live.forEach((c, i) => { if (now > c.until) { live.delete(i); holes[i].classList.remove("up"); } });
      ui.time.textContent = Math.max(0, Math.ceil(t)) + "초";
      if (t <= 0 && !over) { over = true; cancelAnimationFrame(raf); done(score); }
    }
    raf = requestAnimationFrame(frame);
    return () => { over = true; cancelAnimationFrame(raf); };
  }

  // ---------- 물주기 박자 ----------
  function rhythmGame(root, done) {
    const ui = hud(root, "물주기 박자");
    ui.stage.innerHTML = `
      <div class="mg-rhythm">
        <div class="mg-bar"><span class="mg-zone"></span><span class="mg-zone good"></span><span class="mg-drop">${PIXEL.icon("drop", 4)}</span></div>
        <div class="mg-pot">${GameCore.plantSvg("sunflower", 1, { scale: 4 })}</div>
        <p class="mg-judge">눌러요!</p>
        <button class="btn primary mg-tap">물 주기</button>
      </div>`;
    const drop = ui.stage.querySelector(".mg-drop");
    const bar = ui.stage.querySelector(".mg-bar");
    const pot = ui.stage.querySelector(".mg-pot");
    const judge = ui.stage.querySelector(".mg-judge");
    let pos = 0, dir = 1, speed = 0.55, round = 0, score = 0, raf = 0, last = 0, over = false, wait = 0;
    const ROUNDS = 12;
    function tap() {
      if (over || wait > 0) return;
      const d = Math.abs(pos - 0.5);
      let pts = 0, txt = "아깝다";
      if (d < 0.05) { pts = 3; txt = "완벽해!"; } else if (d < 0.12) { pts = 1; txt = "좋아"; }
      score += pts; round++;
      judge.textContent = txt;
      judge.className = "mg-judge " + (pts === 3 ? "perfect" : pts ? "good" : "miss");
      bump(judge);
      ui.score.textContent = score + "점";
      if (pts) { bump(pot); pot.innerHTML = GameCore.plantSvg("sunflower", Math.min(5, 1 + Math.floor(score / 7)), { scale: 4 }); }
      speed *= 1.09;
      wait = 0.35;
      if (round >= ROUNDS) { over = true; cancelAnimationFrame(raf); setTimeout(() => done(score), 500); }
    }
    ui.stage.querySelector(".mg-tap").addEventListener("pointerdown", tap);
    bar.addEventListener("pointerdown", tap);
    function frame(ts) {
      raf = requestAnimationFrame(frame);
      const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016;
      last = ts;
      if (wait > 0) { wait -= dt; return; }
      pos += dir * speed * dt;
      if (pos > 1) { pos = 1; dir = -1; }
      if (pos < 0) { pos = 0; dir = 1; }
      drop.style.left = (pos * 100).toFixed(2) + "%";
      ui.time.textContent = `${Math.min(round + 1, ROUNDS)}/${ROUNDS}`;
    }
    raf = requestAnimationFrame(frame);
    return () => { over = true; cancelAnimationFrame(raf); };
  }

  // ---------- 짝 맞추기 ----------
  function memoryGame(root, done) {
    const ui = hud(root, "짝 맞추기");
    const faces = ["heartOn", "sun", "kite", "cat1", "flowerB", "bug"];
    const deck = faces.concat(faces).map((f, i) => ({ f, i, k: Math.random() })).sort((a, b) => a.k - b.k);
    ui.stage.innerHTML = `<div class="mg-cards">${deck.map((c, i) => `<button class="mg-card" data-i="${i}"><span class="mg-back">${PIXEL.icon("heart", 3)}</span><span class="mg-face">${PIXEL.sprite(c.f, 3)}</span></button>`).join("")}</div>`;
    const cards = Array.from(ui.stage.querySelectorAll(".mg-card"));
    let open = [], moves = 0, found = 0, t0 = performance.now(), raf = 0, over = false, lock = false;
    function scoreNow() {
      const sec = (performance.now() - t0) / 1000;
      return Math.max(3, 30 - Math.max(0, moves - 6) * 2 - Math.floor(sec / 5));
    }
    cards.forEach((el, i) => el.addEventListener("click", () => {
      if (lock || over || el.classList.contains("open") || el.classList.contains("done")) return;
      el.classList.add("open");
      open.push(i);
      if (open.length === 2) {
        moves++;
        const [a, b] = open;
        open = [];
        if (deck[a].f === deck[b].f) {
          setTimeout(() => { cards[a].classList.add("done"); cards[b].classList.add("done"); }, 250);
          found++;
          if (found === faces.length) { over = true; cancelAnimationFrame(raf); setTimeout(() => done(scoreNow()), 700); }
        } else {
          lock = true;
          setTimeout(() => { cards[a].classList.remove("open"); cards[b].classList.remove("open"); lock = false; }, 650);
        }
        ui.score.textContent = scoreNow() + "점";
      }
    }));
    function frame() {
      raf = requestAnimationFrame(frame);
      ui.time.textContent = Math.floor((performance.now() - t0) / 1000) + "초";
      if (!over && moves) ui.score.textContent = scoreNow() + "점";
    }
    raf = requestAnimationFrame(frame);
    return () => { over = true; cancelAnimationFrame(raf); };
  }

  window.GameMini = { catch: catchGame, whack: whackGame, rhythm: rhythmGame, memory: memoryGame };
})();
