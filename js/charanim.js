// ============================================================
// 홈 풍경 속 두 사람: 도트 프레임 애니메이션
// 가만히 서 있지 않아요. 서로 쳐다보고, 손 흔들고, 꼭 안고, 춤추고, 하이파이브하고,
// 연못의 하마를 가리키고, 잠깐 산책하고, 쪼그려 앉아 고양이를 불러요.
// 산책할 땐 다리를 번갈아 걷고, 누르면 활짝 웃으며 손을 흔들어요. 잘 땐 눈을 감아요.
// ============================================================
(function () {
  "use strict";

  const S = window.FSprites;
  if (!S) return;
  const state = {};
  let timer = 0;
  let act = null; // 지금 하는 동작
  let nextAt = performance.now() + 4000;

  function setup() {
    document.querySelectorAll(".couple .bob").forEach((b) => {
      const who = b.dataset.who;
      let wrap = b.querySelector(".ch-wrap");
      if (!wrap) {
        const old = b.querySelector("span[data-sprite]");
        wrap = document.createElement("span");
        wrap.className = "ch-wrap";
        wrap.innerHTML = '<img class="px ch" alt="" draggable="false">';
        if (old) old.replaceWith(wrap); else b.appendChild(wrap);
      }
      state[who] = { el: b, wrap, img: wrap.firstChild, blinkAt: performance.now() + 1500 + Math.random() * 3000, blinkTo: 0, lookAt: performance.now() + 6000 + Math.random() * 8000, lookTo: 0, waveTo: 0, src: "", dx: 0 };
    });
  }
  const H = () => window.HSD || {};
  function burstAt(el, n, kind) {
    const h = H();
    if (!h.burst || !el) return;
    const r = el.getBoundingClientRect();
    h.burst(r.left + r.width / 2, r.top + r.height * 0.3, n, kind);
  }
  function hop(st, px) {
    st.wrap.animate([{ transform: "translateY(0)" }, { transform: `translateY(${-(px || 10)}px)` }, { transform: "translateY(0)" }], { duration: 420, easing: "cubic-bezier(.3,.7,.4,1)" });
  }
  // 동작 목록: 길이(ms)와 사람마다 프레임 정하기
  const ACTS = {
    look: { dur: 2200, f: (who, t) => ({ dir: "side", flip: who === "her", face: t % 1600 < 150 ? "blink" : "" }) },
    wave: { dur: 1400, who: "one", f: (who, t, a) => (who === a.one ? { face: "happy", pose: Math.floor(t / 170) % 2 ? "wave1" : "wave2" } : { dir: "side", flip: who === "her", face: "happy" }) },
    hug: { dur: 2400, start: (a) => { const h = H(); if (h.burst) setTimeout(() => burstAt(document.getElementById("couple"), 6, "heart"), 500); if (Math.random() < 0.5 && h.bubble) h.bubble(pick(["꼭 안아 줘", "따뜻하다", "좋아"]), pick(["him", "her"])); }, f: (who, t) => ({ dir: "side", flip: who === "her", face: "happy", dx: (who === "him" ? 1 : -1) * Math.min(8, t / 40) * (t > 2000 ? (2400 - t) / 400 : 1) }) },
    dance: { dur: 2600, f: (who, t) => ({ face: "happy", pose: Math.floor(t / 220 + (who === "her" ? 1 : 0)) % 2 ? "wave1" : "wave2", hop: Math.floor(t / 440) !== Math.floor((t - 70) / 440) ? 6 : 0 }) },
    highfive: { dur: 1300, start: () => setTimeout(() => burstAt(document.getElementById("couple"), 5, "spark"), 420), f: (who, t) => ({ face: "happy", pose: t > 250 && t < 900 ? "raise" : "", dir: t < 250 ? "side" : "down", flip: who === "her", dx: (who === "him" ? 1 : -1) * (t > 250 && t < 900 ? 4 : 0) }) },
    jump: { dur: 900, who: "one", start: (a) => { const st = state[a.one]; if (st) { hop(st, 14); setTimeout(() => hop(st, 9), 430); } }, f: (who, t, a) => (who === a.one ? { face: "happy" } : { dir: "side", flip: who === "her" }) },
    point: { dur: 2400, start: () => { const h = H(); if (h.bubble && Math.random() < 0.6) h.bubble(pick(["하마 봐!", "하마 귀여워", "저기 양이다", "고양이 다리 짧아"]), pick(["him", "her"])); }, f: (who, t) => ({ dir: "side", flip: true, face: t % 1500 < 140 ? "blink" : "" }) },
    // 혼자 몇 걸음 산책: 거리, 빠르기, 쉬는 시간이 매번 달라요
    stroll: { dur: 2600, who: "one", start: (a) => { a.dist = 8 + Math.random() * 26; a.go = 500 + a.dist * 28 * (0.8 + Math.random() * 0.6); a.wait = 300 + Math.random() * 1500; a.back = 500 + a.dist * 28 * (0.8 + Math.random() * 0.6); a.dur = a.go + a.wait + a.back; }, f: (who, t, a) => {
      if (who !== a.one) return { dir: "side", flip: who === "her" };
      const away = who === "him" ? -1 : 1;
      const going = t < a.go, back = t > a.go + a.wait;
      const c = Math.floor(t / 160) % 4;
      const fr = (going || back) ? (c === 1 ? 1 : c === 3 ? 2 : 0) : 0;
      const p = going ? t / a.go : back ? 1 - (t - a.go - a.wait) / a.back : 1;
      const ease = p * p * (3 - 2 * p);
      return { dir: (going || back) ? "side" : (t % 1400 < 700 ? "down" : "side"), flip: going ? away < 0 : back ? away > 0 : away > 0, frame: fr, dx: away * a.dist * ease };
    } },
    crouch: { dur: 2200, who: "one", f: (who, t, a) => (who === a.one ? { pose: "crouch", face: t > 600 ? "happy" : "" } : { face: t % 1700 < 140 ? "blink" : "" }) },
    stretch2: { dur: 1600, f: (who, t) => ({ pose: Math.floor(t / 400) % 2 ? "raise" : "", face: "happy" }) },
    sky: { dur: 2000, f: (who, t) => ({ dir: "up" }) },
  };
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function startAct(now) {
    const keys = Object.keys(ACTS);
    const weights = { look: 3, wave: 2, hug: 2, dance: 1, highfive: 1, jump: 2, point: 2, stroll: 2, crouch: 1, stretch2: 1, sky: 1 };
    const pool = [];
    keys.forEach((k) => { for (let i = 0; i < (weights[k] || 1); i++) pool.push(k); });
    const k = pick(pool);
    act = { key: k, at: now, one: pick(["him", "her"]) };
    if (ACTS[k].start) ACTS[k].start(act);
  }
  function frame(now) {
    const scene = document.getElementById("scene");
    const couple = document.getElementById("couple");
    if (!scene || !couple) return;
    const walking = couple.classList.contains("walking");
    const left = couple.classList.contains("face-left");
    const sleeping = scene.classList.contains("sleeping") || scene.classList.contains("sleepy");
    const stretch = scene.classList.contains("stretch");
    // 특별한 할 일(잠, 산책, 체조)이 없을 때만 자유롭게 움직여요
    const free = !walking && !sleeping && !stretch;
    if (free && !act && now > nextAt) startAct(now);
    if (act && (!free || now - act.at > (act.dur || ACTS[act.key].dur))) { act = null; nextAt = now + 3500 + Math.random() * 6000; }
    for (const who in state) {
      const st = state[who];
      if (st.el.classList.contains("jump") && st.waveTo < now) st.waveTo = now + 1100;
      let dir = "down", fr = 0, pose = "", face = "", flip = false, dx = 0;
      if (st.waveTo > now) {
        face = "happy";
        pose = Math.floor((st.waveTo - now) / 160) % 2 ? "wave1" : "wave2";
      } else if (sleeping) {
        face = "blink";
      } else if (walking) {
        dir = "side"; flip = left;
        const c = Math.floor(now / 150) % 4;
        fr = c === 1 ? 1 : c === 3 ? 2 : 0;
      } else if (stretch) {
        pose = Math.floor(now / 550) % 2 ? "raise" : "";
        face = pose ? "happy" : "";
      } else if (act) {
        const o = ACTS[act.key].f(who, now - act.at, act) || {};
        dir = o.dir || "down"; flip = !!o.flip; pose = o.pose || ""; face = o.face || ""; fr = o.frame || 0; dx = o.dx || 0;
        if (o.hop) hop(st, o.hop);
      } else {
        if (now > st.lookAt) { st.lookTo = now + 1400 + Math.random() * 900; st.lookAt = now + 8000 + Math.random() * 9000; }
        if (st.lookTo > now) { dir = "side"; flip = who === "her"; }
        if (now > st.blinkAt) { st.blinkTo = now + 140; st.blinkAt = now + 2600 + Math.random() * 3600; }
        if (st.blinkTo > now) face = "blink";
      }
      const src = S.charImg(who, dir, fr, pose, face);
      if (src !== st.src) { st.img.src = src; st.src = src; }
      st.img.classList.toggle("flip", flip);
      if (Math.abs(dx - st.dx) > 0.2) { st.dx = dx; st.el.style.translate = `${dx.toFixed(1)}px 0`; }
    }
  }
  function loop() {
    if (document.hidden || document.body.classList.contains("game-open")) return;
    const home = document.querySelector('.view[data-view="home"].is-active');
    if (!home) return;
    frame(performance.now());
  }
  function start() {
    setup();
    frame(performance.now());
    clearInterval(timer);
    timer = setInterval(loop, 60);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
  window.CharAnim = { start, act: () => act, play(k) { if (!ACTS[k]) return; act = { key: k, at: performance.now(), one: pick(["him", "her"]) }; if (ACTS[k].start) ACTS[k].start(act); } };
})();
