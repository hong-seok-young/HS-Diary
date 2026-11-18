// ============================================================
// 꽃마루 정원: 놀이 다섯 가지, 단계 10개씩
// 하트 받기 · 벌레 잡기 · 물주기 박자 · 짝 맞추기 · 꽃 노래 따라 하기
// 모두 화면 주사율에 맞춰 돌고, 끝나면 (점수, 깼는지) 를 돌려줘요.
// ============================================================
(function () {
  "use strict";

  const rand = (a, b) => a + Math.random() * (b - a);
  function pngImg(r) { const i = new Image(); i.src = r.uri; return i; }
  function hud(root, title, stage, goal) {
    root.innerHTML = `<div class="mg-hud"><span class="mg-title">${title} <i>${stage}단계</i></span><span class="mg-score">0</span><span class="mg-goal">/ ${goal}</span><span class="mg-time"></span></div><div class="mg-stage"></div>`;
    return { score: root.querySelector(".mg-score"), time: root.querySelector(".mg-time"), stage: root.querySelector(".mg-stage") };
  }
  function bump(el) { el.animate([{ transform: "scale(1.35)" }, { transform: "scale(1)" }], { duration: 260, easing: "cubic-bezier(.34,1.56,.64,1)" }); }
  const SP = () => window.GData.SPECIES;

  const GOALS = {
    catch: (s) => 10 + s * 4,
    whack: (s) => 12 + s * 4,
    rhythm: (s) => 12 + Math.round(s * 1.5),
    memory: (s) => 4 + Math.floor(s / 2),
    simon: (s) => 2 + s,
  };

  // ---------- 하트 받기 ----------
  function catchGame(root, stage, done) {
    const goal = GOALS.catch(stage);
    const ui = hud(root, "하트 받기", stage, goal);
    const cv = document.createElement("canvas");
    cv.className = "mg-canvas";
    ui.stage.appendChild(cv);
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const W = Math.min(ui.stage.clientWidth || 320, 420), H = 340;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px";
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    const A = window.GArt;
    const sp = {
      heart: pngImg(A.fromPixel("heartOn")), gold: pngImg(A.fromPixel("goldHeart")),
      bug: pngImg(A.fromPixel("bug")), basket: pngImg(A.fromPixel("basketBig")),
      flower: pngImg(A.plant(SP()[stage % 8], 4, 0)),
    };
    let x = W / 2, score = 0, t = 22, acc = 0, shake = 0, raf = 0, last = 0, over = false;
    const items = [], pops = [];
    function move(e) {
      const r = cv.getBoundingClientRect();
      x = Math.max(22, Math.min(W - 22, e.clientX - r.left));
    }
    cv.addEventListener("pointermove", move);
    cv.addEventListener("pointerdown", move);
    function draw(img, cx, cy, s) {
      if (!img.complete || !img.width) return;
      const w = img.width * s, h = img.height * s;
      ctx.drawImage(img, Math.round(cx - w / 2), Math.round(cy - h / 2), w, h);
    }
    function frame(ts) {
      raf = requestAnimationFrame(frame);
      const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016;
      last = ts;
      t -= dt;
      const speed = (1 + (22 - t) / 16) * (1 + stage * 0.08);
      acc += dt * (1.3 + (22 - t) / 10) * (1 + stage * 0.12);
      while (acc >= 1) {
        acc--;
        const r = Math.random();
        const bugP = 0.2 + stage * 0.025;
        items.push({ kind: r < 0.07 ? "gold" : r < 0.07 + bugP ? "bug" : r < 0.5 ? "flower" : "heart", x: rand(16, W - 16), y: -16, vy: rand(90, 140) * speed, sway: rand(0, 6) });
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
        draw(sp[it.kind], ix, it.y, it.kind === "flower" ? 1.5 : 3);
        if (it.y > H - 46 && it.y < H - 20 && Math.abs(ix - x) < 30) {
          items.splice(i, 1);
          const d = it.kind === "gold" ? 5 : it.kind === "bug" ? -3 : 1;
          score = Math.max(0, score + d);
          pops.push({ x: ix, y: H - 50, text: (d > 0 ? "+" : "") + d, life: 0.8, bad: d < 0 });
          if (d < 0) shake = 0.3;
          ui.score.textContent = score;
          bump(ui.score);
        } else if (it.y > H + 20) items.splice(i, 1);
      }
      draw(sp.basket, x, H - 28, 4);
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
      if (t <= 0 && !over) { over = true; cancelAnimationFrame(raf); done(score, score >= goal); }
    }
    raf = requestAnimationFrame(frame);
    return () => { over = true; cancelAnimationFrame(raf); };
  }

  // ---------- 벌레 잡기 ----------
  function whackGame(root, stage, done) {
    const goal = GOALS.whack(stage);
    const ui = hud(root, "벌레 잡기", stage, goal);
    const n = stage >= 6 ? 12 : 9;
    ui.stage.innerHTML = `<div class="mg-holes${n === 12 ? " wide" : ""}">${Array.from({ length: n }, (_, i) => `<button class="mg-hole" data-i="${i}"><span class="mg-dirt"></span><span class="mg-pop"></span></button>`).join("")}</div>`;
    const holes = Array.from(ui.stage.querySelectorAll(".mg-hole"));
    const A = window.GArt;
    const bug = A.pixImg("bug", 6), sprout = A.plantImg(SP()[stage % 6], 2, 0, 3);
    let score = 0, t = 22, next = 0.6, raf = 0, last = 0, over = false;
    const live = new Map();
    holes.forEach((h, i) => h.addEventListener("pointerdown", () => {
      const c = live.get(i);
      if (!c) return;
      live.delete(i);
      h.classList.remove("up");
      h.classList.add(c.kind === "bug" ? "hit" : "oops");
      setTimeout(() => h.classList.remove("hit", "oops"), 300);
      score = Math.max(0, score + (c.kind === "bug" ? 2 : -3));
      ui.score.textContent = score;
      bump(ui.score);
    }));
    function frame(ts) {
      raf = requestAnimationFrame(frame);
      const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016;
      last = ts;
      t -= dt; next -= dt;
      const now = performance.now();
      if (next <= 0) {
        next = Math.max(0.28, (0.85 - (22 - t) / 40) * (1 - stage * 0.04));
        const free = holes.map((_, i) => i).filter((i) => !live.has(i));
        if (free.length) {
          const i = free[Math.floor(Math.random() * free.length)];
          const kind = Math.random() < 0.15 + stage * 0.02 ? "sprout" : "bug";
          live.set(i, { kind, until: now + Math.max(480, (1050 - (22 - t) * 16) * (1 - stage * 0.035)) });
          holes[i].querySelector(".mg-pop").innerHTML = kind === "bug" ? bug : sprout;
          holes[i].classList.add("up");
        }
      }
      live.forEach((c, i) => { if (now > c.until) { live.delete(i); holes[i].classList.remove("up"); } });
      ui.time.textContent = Math.max(0, Math.ceil(t)) + "초";
      if (t <= 0 && !over) { over = true; cancelAnimationFrame(raf); done(score, score >= goal); }
    }
    raf = requestAnimationFrame(frame);
    return () => { over = true; cancelAnimationFrame(raf); };
  }

  // ---------- 물주기 박자 ----------
  function rhythmGame(root, stage, done) {
    const goal = GOALS.rhythm(stage);
    const ui = hud(root, "물주기 박자", stage, goal);
    const sp = SP()[4];
    const A = window.GArt;
    ui.stage.innerHTML = `
      <div class="mg-rhythm">
        <div class="mg-bar"><span class="mg-zone"></span><span class="mg-zone good"></span><span class="mg-drop">${PIXEL.icon("drop", 4)}</span></div>
        <div class="mg-pot">${A.plantImg(sp, 1, 0, 4)}</div>
        <p class="mg-judge">눌러요</p>
        <button class="btn primary mg-tap">물 주기</button>
      </div>`;
    const drop = ui.stage.querySelector(".mg-drop");
    const bar = ui.stage.querySelector(".mg-bar");
    const pot = ui.stage.querySelector(".mg-pot");
    const judge = ui.stage.querySelector(".mg-judge");
    let pos = 0, dir = 1, speed = 0.5 + stage * 0.07, round = 0, score = 0, raf = 0, last = 0, over = false, wait = 0;
    const ROUNDS = 10;
    function tap() {
      if (over || wait > 0) return;
      const d = Math.abs(pos - 0.5);
      let pts = 0, txt = "아깝다";
      if (d < 0.05) { pts = 3; txt = "완벽해"; } else if (d < 0.12) { pts = 1; txt = "좋아"; }
      score += pts; round++;
      judge.textContent = txt;
      judge.className = "mg-judge " + (pts === 3 ? "perfect" : pts ? "good" : "miss");
      bump(judge);
      ui.score.textContent = score;
      if (pts) { bump(pot); pot.innerHTML = A.plantImg(sp, Math.min(4, 1 + Math.floor(score / 7)), 0, 4); }
      speed *= 1.07;
      wait = 0.35;
      if (round >= ROUNDS) { over = true; cancelAnimationFrame(raf); setTimeout(() => done(score, score >= goal), 500); }
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
      drop.style.transform = `translateX(${(pos * (bar.clientWidth - 24)).toFixed(1)}px)`;
      ui.time.textContent = `${Math.min(round + 1, ROUNDS)}/${ROUNDS}`;
    }
    raf = requestAnimationFrame(frame);
    return () => { over = true; cancelAnimationFrame(raf); };
  }

  // ---------- 짝 맞추기 ----------
  function memoryGame(root, stage, done) {
    const pairs = GOALS.memory(stage);
    const limit = 20 + pairs * 5 - stage;
    const ui = hud(root, "짝 맞추기", stage, pairs);
    const A = window.GArt;
    const pool = SP().slice(0, 48).sort(() => Math.random() - 0.5).slice(0, pairs);
    const deck = pool.concat(pool).map((s, i) => ({ s, i, k: Math.random() })).sort((a, b) => a.k - b.k);
    const cols = deck.length > 12 ? 5 : 4;
    ui.stage.innerHTML = `<div class="mg-cards" style="--cols:${cols}">${deck.map((c, i) => `<button class="mg-card" data-i="${i}"><span class="mg-back">${PIXEL.icon("heart", 3)}</span><span class="mg-face">${A.plantImg(c.s, 4, 0, 2)}</span></button>`).join("")}</div>`;
    const cards = Array.from(ui.stage.querySelectorAll(".mg-card"));
    let open = [], found = 0, t0 = performance.now(), raf = 0, over = false, lock = false;
    cards.forEach((el, i) => el.addEventListener("click", () => {
      if (lock || over || el.classList.contains("open") || el.classList.contains("done")) return;
      el.classList.add("open");
      open.push(i);
      if (open.length === 2) {
        const [a, b] = open;
        open = [];
        if (deck[a].s.id === deck[b].s.id) {
          setTimeout(() => { cards[a].classList.add("done"); cards[b].classList.add("done"); }, 250);
          found++;
          ui.score.textContent = found;
          bump(ui.score);
          if (found === pairs) { over = true; cancelAnimationFrame(raf); setTimeout(() => done(found, true), 700); }
        } else {
          lock = true;
          setTimeout(() => { cards[a].classList.remove("open"); cards[b].classList.remove("open"); lock = false; }, 650);
        }
      }
    }));
    function frame() {
      raf = requestAnimationFrame(frame);
      const left = limit - (performance.now() - t0) / 1000;
      ui.time.textContent = Math.max(0, Math.ceil(left)) + "초";
      if (left <= 0 && !over) { over = true; cancelAnimationFrame(raf); done(found, false); }
    }
    raf = requestAnimationFrame(frame);
    return () => { over = true; cancelAnimationFrame(raf); };
  }

  // ---------- 꽃 노래 따라 하기 ----------
  function simonGame(root, stage, done) {
    const goal = GOALS.simon(stage);
    const ui = hud(root, "꽃 노래 따라 하기", stage, goal);
    const A = window.GArt;
    const pads = [SP()[0], SP()[2], SP()[3], SP()[4]];
    const notes = [523, 587, 659, 784];
    ui.stage.innerHTML = `<div class="mg-simon">${pads.map((s, i) => `<button class="mg-pad p${i}" data-i="${i}">${A.plantImg(s, 4, 0, 3)}</button>`).join("")}</div><p class="mg-judge">잘 들어 봐요</p>`;
    const els = Array.from(ui.stage.querySelectorAll(".mg-pad"));
    const judge = ui.stage.querySelector(".mg-judge");
    const seq = [];
    let pos = 0, listening = false, over = false;
    const timers = [];
    let actx = null;
    function beep(i) {
      try {
        actx = actx || new (window.AudioContext || window.webkitAudioContext)();
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = "square"; o.frequency.value = notes[i];
        g.gain.setValueAtTime(0.04, actx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.25);
        o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + 0.26);
      } catch (e) { /* 소리 없이 */ }
    }
    function flash(i) {
      els[i].classList.remove("lit"); void els[i].offsetWidth; els[i].classList.add("lit");
      beep(i);
    }
    function playSeq() {
      listening = false;
      judge.textContent = "잘 들어 봐요";
      const gap = Math.max(260, 620 - stage * 30);
      seq.forEach((v, k) => timers.push(setTimeout(() => flash(v), 500 + k * gap)));
      timers.push(setTimeout(() => { listening = true; pos = 0; judge.textContent = "따라 해요"; }, 500 + seq.length * gap));
    }
    function grow() {
      seq.push(Math.floor(Math.random() * 4));
      ui.time.textContent = `${seq.length}/${goal}`;
      playSeq();
    }
    els.forEach((el, i) => el.addEventListener("pointerdown", () => {
      if (!listening || over) return;
      flash(i);
      if (seq[pos] !== i) {
        over = true;
        judge.textContent = "아깝다";
        judge.className = "mg-judge miss";
        setTimeout(() => done(seq.length - 1, false), 600);
        return;
      }
      pos++;
      if (pos === seq.length) {
        ui.score.textContent = seq.length;
        bump(ui.score);
        if (seq.length >= goal) { over = true; judge.textContent = "완벽해"; setTimeout(() => done(seq.length, true), 600); return; }
        listening = false;
        timers.push(setTimeout(grow, 500));
      }
    }));
    for (let k = 0; k < 1; k++) seq.push(Math.floor(Math.random() * 4));
    grow();
    return () => { over = true; timers.forEach(clearTimeout); };
  }

  window.GMini = { catch: catchGame, whack: whackGame, rhythm: rhythmGame, memory: memoryGame, simon: simonGame, GOALS };
})();
