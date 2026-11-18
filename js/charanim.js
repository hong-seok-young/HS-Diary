// ============================================================
// 홈 풍경 속 두 사람: 도트 프레임 애니메이션
// 가만히 있을 때도 숨 쉬듯 깜빡이고, 가끔 서로를 쳐다봐요.
// 산책할 땐 다리를 번갈아 걷고, 누르면 활짝 웃으며 손을 흔들어요. 잘 땐 눈을 감아요.
// ============================================================
(function () {
  "use strict";

  const S = window.FSprites;
  if (!S) return;
  const state = {};
  let timer = 0;

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
      state[who] = { el: b, img: wrap.firstChild, blinkAt: performance.now() + 1500 + Math.random() * 3000, blinkTo: 0, lookAt: performance.now() + 6000 + Math.random() * 8000, lookTo: 0, waveTo: 0, src: "" };
    });
  }
  function frame(now) {
    const scene = document.getElementById("scene");
    const couple = document.getElementById("couple");
    if (!scene || !couple) return;
    const walking = couple.classList.contains("walking");
    const left = couple.classList.contains("face-left");
    const sleeping = scene.classList.contains("sleeping") || scene.classList.contains("sleepy");
    const stretch = scene.classList.contains("stretch");
    for (const who in state) {
      const st = state[who];
      // 누르면 (jump 클래스) 손 흔들기
      if (st.el.classList.contains("jump") && st.waveTo < now) st.waveTo = now + 1100;
      let dir = "down", fr = 0, pose = "", face = "", flip = false;
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
      } else {
        if (now > st.lookAt) { st.lookTo = now + 1400 + Math.random() * 900; st.lookAt = now + 8000 + Math.random() * 9000; }
        if (st.lookTo > now) { dir = "side"; flip = who === "her"; }
        if (now > st.blinkAt) { st.blinkTo = now + 140; st.blinkAt = now + 2600 + Math.random() * 3600; }
        if (st.blinkTo > now) face = "blink";
      }
      const src = S.charImg(who, dir, fr, pose, face);
      if (src !== st.src) { st.img.src = src; st.src = src; }
      st.img.classList.toggle("flip", flip);
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
    timer = setInterval(loop, 70);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
  window.CharAnim = { start };
})();
