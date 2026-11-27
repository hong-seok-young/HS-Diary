// ============================================================
// 폰을 눕히면 가로 그림: 폰의 "자동 회전"이 꺼져 있어도, 홈 화면에서 폰을 가로로 눕히면 그림이 화면 가득 가로로 떠요.
// - 폰이 스스로 돌려 주면(자동 회전이 켜져 있으면) 아무것도 안 해요. css 가 알아서 가로 그림으로 바꿔요.
// - 자동 회전이 꺼져 있으면: 폰의 기울기를 보고, 가로로 눕힌 채 잠깐 있으면 화면을 가로로 돌려 달라고 폰에 부탁해요.
//   세우면 다시 풀어요. (안드로이드에서 홈 화면에 깐 앱일 때만 돼요. 아이폰은 앱이 화면을 돌릴 수 없어요.)
// - 글을 쓰는 중이거나 창이 떠 있을 때, 홈이 아닌 화면에서는 건드리지 않아요.
// ============================================================
(function () {
  "use strict";
  const so = window.screen && screen.orientation;
  if (!so || typeof so.lock !== "function" || !("ondevicemotion" in window)) return;
  let phys = "", since = 0, locked = false, failAt = 0, busy = false;
  const landscapeNow = () => { try { return matchMedia("(orientation: landscape)").matches; } catch (e) { return false; } };
  // 홈 그림만 보고 있을 때만 돌려요
  function homeOk() {
    if (!document.querySelector('.view[data-view="home"].is-active')) return false;
    if (document.body.classList.contains("sheet-open") || document.body.classList.contains("game-open")) return false;
    const a = document.activeElement;
    if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return false;
    if (window.Deco && Deco.celebrating && Deco.celebrating()) return false;
    if (window.Tale && Tale.isOpen && Tale.isOpen()) return false;
    return !document.querySelector(".deco:not([hidden]), .modal.is-open, .lightbox.is-open");
  }
  function decide(p) {
    const now = Date.now();
    if (busy) return;
    if (p === "land" && !locked && !landscapeNow() && now - failAt > 6000 && homeOk()) {
      busy = true;
      Promise.resolve().then(() => so.lock("landscape")).then(() => { locked = true; }).catch(() => { failAt = Date.now(); }).then(() => { busy = false; });
    } else if (p === "port" && locked) {
      locked = false;
      try { so.unlock(); } catch (e) { /* 풀 게 없어요 */ }
    }
  }
  window.addEventListener("devicemotion", (ev) => {
    const g = ev.accelerationIncludingGravity;
    if (!g || g.x == null || g.y == null || document.hidden) return;
    const ax = Math.abs(g.x), ay = Math.abs(g.y);
    const now = ax > 6.5 && ay < 4.5 ? "land" : ay > 6.5 && ax < 4.5 ? "port" : ""; // 평평하게 눕혀 둔 건 그대로 둬요
    if (!now) return;
    if (now !== phys) { phys = now; since = performance.now(); return; }
    if (performance.now() - since > 450) decide(now);
  });
  // 앱을 나갔다 오면 폰이 알아서 풀었을 수 있어요
  document.addEventListener("visibilitychange", () => { if (document.hidden && locked) { locked = false; try { so.unlock(); } catch (e) { /* 괜찮아요 */ } } });
  window.Tilt = { state: () => ({ phys, locked }) };
})();
