// ============================================================
// 장난 목록 2: 사람과 동물, 동물끼리
// - 새총으로 새 맞히기, 연못에 들어가 하마 던지기, 꼬리 밟았다가 얼굴 할퀴이기,
//   엉덩이 물리기, 새가 눈알 물어 가기, 동물끼리 박치기·짓밟기·물대포·싸움 구름 …
// - 동물은 맞으면 그냥 안 넘어가요. 새는 머리를 쪼고, 양은 들이받고, 고양이는 할퀴어요.
// ============================================================
(function () {
  "use strict";
  if (!window.Play) return;
  const K = Play.kit;
  const { E, rand, pick, clamp, wait, tween, all, until, fork, pow, puff, stars, dust, feathers, quake, orbit, stick, Prop, A, hold, climbOut, landX, geo } = K;
  const PL = () => window.Pals;
  const dirTo = (a, b) => ((typeof b === "number" ? b : b.x) >= a.x ? 1 : -1);
  const impact = (x, b, word, big) => { pow(x, b, word, { big: big !== false }); stars(x, b - 6, big === false ? 3 : 6); quake(big === false ? 1.5 : 3); };
  const who = (c, o) => { if (!c.him || !c.her || c.him.on || c.her.on) return null; return o && o.a ? c[o.a] : pick([c.him, c.her]); };
  const other = (c, p) => (p === c.him ? c.her : c.him);
  const hearts = (e, n) => PL().hearts(e, n || 4);
  const color = (e) => { const sp = window.FSprites.PJ[e.sp]; return (sp && sp.c && sp.c.U) || "#ffffff"; };
  const near = (list, p) => list.slice().sort((x, y) => Math.abs(x.x - p.x) - Math.abs(y.x - p.x))[0];
  // 동물이 사람 몸에 붙어 따라다니게
  const follow = (e, p, dx, db, on) => (function* () { let t = 0; while (on()) { t += yield; e.x = p.x + dx() ; e.b = p.b + db; } })();
  const reg = (id, name, pickFn, run, o) => Play.def(Object.assign({ id, name, w: 2, n: 2, pick: pickFn, run }, o || {}));
  // 동물이 맞고 대자로 뻗었다가 일어나요
  function* aKO(e, sec) { e.face = "sweat"; e.frame = "stand"; yield* tween(e, { rot: Math.round((e.rot - 180) / 360) * 360 + 180 }, 0.14, E.out); e.rot = 180; orbit(e, sec); yield* wait(sec, (k, dt, t) => { e.tx = Math.sin(t * 9) * 1; }); e.tx = 0; yield* all(tween(e, { rot: 360 }, 0.2, E.back), wait(0.2, (k) => { e.lift = Math.sin(k * Math.PI) * 8; })); e.rot = 0; e.lift = 0; }
  // 사람이 맞고 날아갔다 일어나요
  function* pFly(p, vx, vy) { const res = yield* p.launch(vx, vy, {}); if (res === "land") { yield* p.dizzy(1.0); yield* p.getUp(); } }

  // ============================================================
  // 사람 → 동물
  // ============================================================
  // 새총: 명중! 그런데 새가 가만있지 않아요
  reg("pa:sling", "새총 쏘기", (c, o) => { const p = who(c, o); return p && c.birds.length ? { p, e: pick(c.birds) } : null; }, function* (v) {
    const p = v.p.take(), e = hold(v.e), g = geo();
    const d = p.x < g.W * 0.55 ? 1 : -1;
    // 새는 아무것도 모르고 날아와 떠 있어요
    let shot = false;
    const tx = clamp(p.x + d * 78, 30, g.W - 30), tb = Math.min(g.H - 50, 118);
    fork((function* () { yield* A.fly(e, tx, tb, 90); while (!shot) { const dt = yield; e._t = (e._t || 0) + dt; e.frame = Math.floor(e._t * 12) % 2 ? "fly1" : "fly2"; e.b = tb + Math.sin(e._t * 5) * 2; } })());
    p.look(tx); p.face = "m9";
    p.say(pick(["저 새 맞혀 볼까", "쉿… 조용히", "새총 실력 봐라"]), 1200);
    yield* wait(0.6);
    // 새총을 꺼내 들고
    const s = new Prop("sling", 2); s.pivot = "50% 100%"; s.x = p.x + 16 * d; s.b = p.b + 28; s.sx = 0; s.sy = 0; s.z = 12;
    const st = new Prop("stone", 2); st.x = s.x; st.b = s.b + 12; st.z = 13; st.hide = true;
    p.pose = "act";
    yield* tween(s, { sx: 1, sy: 1 }, 0.16, E.back);
    yield* until(() => Math.abs(e.x - tx) < 3, 3);
    // 겨누기: 몸을 뒤로 젖히고 고무줄을 끼이익 당겨요
    st.hide = false;
    pow(p.x, p.b + 88, "끼이익…", { ms: 800, rot: 0 });
    yield* all(p.lean(-12 * d, 0.6, E.out), tween(s, { rot: -24 * d }, 0.6, E.out), wait(0.6, (k, dt, t) => { st.x = s.x - 12 * d * E.out(k) + Math.sin(t * 50) * 0.6; st.b = s.b + 12 - 4 * k; }));
    yield* wait(0.25); // 숨 참고
    // 발사
    shot = true;
    pow(s.x, s.b + 24, "탕!", { ms: 300 });
    fork((function* () { yield* all(tween(s, { rot: 18 * d }, 0.06), p.lean(6 * d, 0.06)); yield* tween(s, { rot: 0 }, 0.2, E.el); })());
    const x0 = st.x, b0 = st.b;
    yield* wait(0.15, (k) => { st.x = x0 + (e.x - x0) * k; st.b = b0 + (e.b + 8 - b0) * k; });
    st.remove();
    impact(e.x, e.b + 16, "딱!");
    feathers(e.x, e.b + 8, 8, color(e));
    e.face = "sweat"; e.sx = 1.25; e.sy = 0.75; e.frame = "fly1";
    yield* wait(0.1); // 멈칫
    e.sx = 1; e.sy = 1;
    // 사람은 만세
    fork((function* () { yield* p.lean(0, 0.1); yield* tween(s, { sx: 0, sy: 0 }, 0.12); s.remove(); p.front(); p.pose = "raise"; p.face = "happy"; p.say(pick(["명중!", "나이스!", "백발백중"]), 1100); yield* p.hop(10, 0.26); yield* p.hop(8, 0.24); p.pose = ""; })());
    // 새는 빙글빙글 떨어져서 바닥에 통
    let vb = 60;
    while (e.b > 8) { const dt = yield; vb -= 900 * dt; e.b = Math.max(8, e.b + vb * dt); e.rot += 760 * dt; e.x = clamp(e.x + 26 * d * dt, 20, g.W - 20); }
    dust(e.x, 8, 4); pow(e.x, 26, "통", { ms: 320 });
    yield* wait(0.22, (k) => { e.b = 8 + Math.sin(k * Math.PI) * 12; e.rot += 12; });
    e.b = 8;
    yield* aKO(e, 1.2);
    // 벌떡! 화가 머리끝까지
    yield* A.jitter(e, 0.4, 2);
    A.say(e, pick(["짹!!", "삐약!!", "끼익!"])); e.face = "baa";
    p.look(e); p.face = "hit"; p.say(pick(["어… 화났다", "미, 미안!"]), 1000);
    yield* A.fly(e, p.x, p.b + 92, 190);
    // 머리를 콕 콕 콕 콕
    for (let i = 0; i < 4; i++) {
      yield* tween(e, { b: p.b + 66 }, 0.06, E.in);
      pow(p.x + rand(-10, 10), p.b + 80, "콕!", { ms: 300 }); p.sy = 0.93; p.face = i % 2 ? "cry1" : "hit";
      yield* tween(e, { b: p.b + 90 }, 0.09, E.out);
      p.sy = 1;
    }
    stick(p, "bump", { db: 58, sec: 6 });
    // 머리를 감싸고 도망, 새는 끝까지 쫓아와요
    p.pose = "clutch";
    let run = true;
    fork((function* () { let t = 0; while (run) { t += yield; e.x = p.x; e.flip = p.flip; e.frame = Math.floor(t * 12) % 2 ? "fly1" : "fly2"; e.b = p.b + 84 - Math.abs(Math.sin(t * 9)) * 16; if (Math.abs(Math.sin(t * 9)) > 0.97 && Math.random() < 0.3) pow(p.x, p.b + 82, "콕", { ms: 240 }); } })());
    for (let i = 0; i < 3; i++) yield* p.walk(i % 2 ? g.W - 30 : g.pond.x1 + 30, 135, { pose: "clutch" });
    run = false;
    A.say(e, pick(["짹짹!", "삐약삐약"])); e.face = "happy";
    yield* A.fly(e, clamp(p.x + 90, 30, g.W - 30), g.H * 0.62, 150);
    yield* p.cry(1.2);
  }, { n: 4, w: 3 });

  // 하마 던지기: 연못에 들어가 번쩍 들어서 휙
  reg("pa:hippo", "하마 던지기", (c, o) => { const p = who(c, o); return p && c.hippo ? { p, e: c.hippo } : null; }, function* (v) {
    const p = v.p.take(), e = hold(v.e), g = geo(), P = PL();
    p.look(0); p.face = "m9";
    p.say(pick(["하마 좀 들어 볼까", "저 하마 무게가 궁금해"]), 1200);
    yield* p.walk(g.pond.x1 + 18, 60);
    // 웅크렸다가 풍덩 뛰어들어요
    yield* tween(p, { sy: 0.84, sx: 1.1 }, 0.16, E.out);
    p.sx = 1; p.sy = 1; p.pose = "raise";
    const x0 = p.x, tx = clamp(e.x + 22, g.pond.x0 + 26, g.pond.x1 - 14);
    yield* wait(0.42, (k) => { p.x = x0 + (tx - x0) * k; p.y = -26 * k + Math.sin(k * Math.PI) * 30; if (k > 0.82) p.clip = 30; });
    p.y = -26; p.clip = 30; p.pose = "";
    P.ring(p.x); P.drops(p.x, 14, 16, 30, "#bfe6ff"); pow(p.x, 44, "첨벙!", { big: true });
    e.face = "sweat"; A.say(e, "뿌?");
    yield* wait(0.4, (k) => { p.y = -26 - Math.sin(k * Math.PI) * 6; });
    // 물속을 저벅저벅 다가가서
    p.look(e);
    yield* wait(0.5, (k, dt, t) => { p.x += (e.x + 16 - p.x) * Math.min(1, dt * 4); p.y = -26 + Math.sin(t * 9) * 1.5; if (Math.random() < dt * 5) P.ring(p.x); });
    // 영차… 번쩍!
    p.pose = "crouch"; p.y = -30;
    yield* wait(0.3);
    pow(p.x, 60, "영차!", { ms: 500 });
    p.front(); p.pose = "hold"; p.y = -26;
    e.swim = false; e.zz = 12; e.b = 12; e.x = e.x;
    const ex = e.x;
    yield* wait(0.3, (k) => { const q = E.back(k); e.x = ex + (p.x - ex) * q; e.b = 12 + (p.b + 58 - 12) * q; if (Math.random() < 0.5) P.drops(e.x + rand(-12, 12), e.b, 1, 6, "#bfe6ff"); });
    A.say(e, pick(["뿌우?!", "어어 내려놔!"]));
    // 머리 위에서 버둥버둥
    yield* wait(0.7, (k, dt, t) => { e.frame = Math.floor(t * 10) % 2 ? "walk1" : "walk2"; e.tx = Math.sin(t * 30) * 1.5; p.sy = 1 - Math.abs(Math.sin(t * 12)) * 0.03; if (Math.random() < dt * 8) P.drops(e.x + rand(-12, 12), e.b, 1, 6, "#bfe6ff"); });
    e.tx = 0; p.sy = 1;
    // 뒤로 젖혔다가
    p.look(g.W);
    yield* all(p.lean(-14, 0.26, E.out), tween(e, { x: p.x - 12 }, 0.26, E.out));
    yield* wait(0.08);
    // 던져요!
    p.pose = "punch";
    fork((function* () { yield* p.lean(12, 0.06, E.in); yield* wait(0.4); yield* p.lean(0, 0.15); p.front(); p.pose = "act"; p.say(pick(["생각보다 가볍네", "잘 난다~"]), 1100); yield* wait(1.0); p.pose = ""; })());
    pow(p.x + 20, p.b + 90, "휙!", { ms: 400 });
    e.zz = 0;
    yield* A.toss(e, 640, 330);
    yield* wait(0.3);
    // 물 밖으로 나오고, 하마는 씩씩대며 돌아와 들이받아요
    yield* climbOut(p);
    e.face = "baa"; A.say(e, pick(["뿌우!!", "가만 안 둬"]));
    e.b = 6;
    const d = dirTo(e, p);
    yield* A.move(e, e.x - 12 * d, 30, { back: true });
    for (let i = 0; i < 2; i++) { dust(e.x - 10 * d, 6, 2); yield* A.squash(e, 1.1, 0.9, 0.04); }
    p.look(e); p.face = "hit"; p.say("어… 잠깐!", 800);
    yield* A.move(e, p.x - 22 * d, 220);
    impact(p.x - 8 * d, p.b + 24, "쾅!");
    yield* all(pFly(p, 300 * d, 460), (function* () { e.face = "happy"; yield* A.hop(e, 8, 0.22); A.say(e, "뿌우~"); yield* wait(0.6); })());
  }, { n: 2, w: 4 });

  // 공처럼 뻥 차기 → 씩씩대며 돌아와 들이받아요
  reg("pa:kick", "동물 뻥 차기", (c, o) => { const p = who(c, o); return p && c.ground.length ? { p, e: near(c.ground, p) } : null; }, function* (v) {
    const p = v.p.take(), e = hold(v.e), g = geo();
    const d = dirTo(p, e);
    p.look(e); p.face = "m9";
    yield* p.walk(e.x - 62 * d, 60);
    yield* p.walk(p.x - 10 * d, 30, { back: true });
    e.face = ""; e.flip = d < 0;
    yield* p.walk(e.x - 30 * d, 140);
    p.look(e); p.pose = "kick";
    yield* p.lean(-16 * d, 0.07);
    impact(e.x - 8 * d, e.b + 14, "뻥!");
    e.face = "sweat"; e.sx = 0.7; e.sy = 1.2;
    yield* wait(0.09);
    fork((function* () { yield* wait(0.3); p.pose = ""; yield* p.lean(0, 0.14); p.front(); p.face = "happy"; p.say(pick(["골인!", "멀리 간다~"]), 1000); })());
    yield* A.toss(e, 430 * d, 400);
    // 돌아와서 복수
    yield* A.jitter(e, 0.4, 2);
    e.face = "baa"; A.say(e, pick(["메에!!", "냐악!"]));
    const d2 = dirTo(e, p);
    yield* A.move(e, clamp(p.x - 70 * d2, 20, g.W - 20), 90);
    e.flip = d2 < 0;
    for (let i = 0; i < 3; i++) { dust(e.x - 10 * d2, 6, 2); yield* tween(e, { tx: -4 * d2 }, 0.1); yield* tween(e, { tx: 0 }, 0.08); }
    p.look(e); p.face = "hit";
    yield* A.move(e, p.x - 20 * d2, 230);
    impact(p.x - 8 * d2, p.b + 20, "쾅!");
    yield* all(pFly(p, 280 * d2, 480), (function* () { e.face = "happy"; yield* A.hop(e, 10, 0.24); yield* A.hop(e, 8, 0.22); })());
  }, { n: 4 });

  // 꼬리를 밟았다가 얼굴을 할퀴여요
  reg("pa:tail", "꼬리 밟기", (c, o) => { const p = who(c, o); return p && c.cats.length ? { p, e: near(c.cats, p) } : null; }, function* (v) {
    const p = v.p.take(), e = hold(v.e), g = geo();
    const d = dirTo(p, e);
    e.flip = d < 0; e.face = ""; // 등을 돌리고 앉아 있어요
    p.face = "happy"; pow(p.x, p.b + 84, "♪", { ms: 600 });
    yield* p.walk(e.x - 20 * d, 46);
    // 꾹
    impact(e.x - 12 * d, 14, "꾹", false);
    e.face = "baa"; e.sx = 1.3; e.sy = 1.3;
    A.say(e, "냐아아악!!");
    yield* wait(0.3, (k) => { e.lift = Math.sin(k * Math.PI) * 26; e.tx = Math.sin(k * 60) * 2; });
    e.lift = 0; e.tx = 0; e.sx = 1; e.sy = 1;
    p.front(); p.face = "hit"; p.say("앗, 미안!", 800);
    // 얼굴로 날아들어 박박박
    e.zz = 12;
    yield* A.leap(e, p.x, p.b + 30, 26, 0.26);
    let on = true;
    fork((function* () { let t = 0, acc = 0; while (on) { const dt = yield; t += dt; acc += dt; e.x = p.x; e.b = p.b + 30; e.rot = Math.sin(t * 44) * 24; if (acc > 0.11) { acc = 0; pow(p.x + rand(-18, 18), p.b + 40 + rand(-10, 16), pick(["박!", "북!", "찍!"]), { ms: 260 }); puff(p.x, p.b + 40, 2, { c: "#e8504f", s: 2, sp: 26, up: 14 }); } } })());
    p.pose = "raise";
    for (let i = 0; i < 3; i++) yield* p.walk(clamp(p.x + (i % 2 ? -1 : 1) * rand(26, 44), g.pond.x1 + 30, g.W - 30), 90, { pose: i % 2 ? "raise" : "wave1" });
    on = false; e.rot = 0;
    yield* A.leap(e, clamp(p.x + 44 * d, 20, g.W - 20), 4, 20, 0.3);
    e.zz = 0; e.face = "happy"; e.frame = "stand";
    A.say(e, pick(["흥", "냥."]));
    stick(p, "scratch", { db: 30, sec: 6, scale: 3 });
    p.front();
    yield* p.cry(1.6);
  }, { n: 2 });

  // 저글링: 잘하다가 한눈팔면 머리에 쿵
  reg("pa:juggle", "동물 저글링", (c, o) => { const p = who(c, o); return p && c.ground.length ? { p, e: near(c.ground, p) } : null; }, function* (v) {
    const p = v.p.take(), e = hold(v.e);
    const d = dirTo(p, e);
    yield* p.walk(e.x - 26 * d, 54);
    p.look(e); p.pose = "crouch";
    yield* wait(0.25);
    p.front(); p.pose = "hold"; e.zz = 12; e.face = "sweat";
    const hb = p.b + 58;
    yield* A.leap(e, p.x, hb, 14, 0.24);
    A.say(e, pick(["메?", "냐?", "어어?"]));
    // 휙, 휙, 휙 점점 높이
    const hs = [34, 58, 88];
    for (let i = 0; i < 3; i++) {
      yield* tween(p, { sy: 0.9 }, 0.07); p.sy = 1.04;
      pow(p.x + 18, hb + 10, "휙", { ms: 260 });
      yield* wait(0.3 + i * 0.1, (k) => { e.b = hb + Math.sin(k * Math.PI) * Math.min(hs[i], geo().H - hb - 40); e.rot = 360 * (i + 1) * k; p.sy = 1; });
      e.rot = 0; e.b = hb; pow(p.x, hb + 4, "착", { ms: 240 });
      yield* p.squash(1.06, 0.92, 0.02);
    }
    // 봤지? 하고 한눈을 파는 사이
    yield* tween(p, { sy: 0.9 }, 0.07); p.sy = 1;
    fork(wait(0.7, (k) => { e.b = hb + Math.sin(k * Math.PI) * Math.min(96, geo().H - hb - 40); e.rot = 720 * k; }));
    p.pose = "wave1"; p.face = "happy"; p.say(pick(["나 잘하지?", "봤어 봤어?"]), 900);
    yield* wait(0.7);
    e.rot = 0; e.b = hb;
    impact(p.x, hb + 10, "쿵!");
    p.sy = 0.66; p.sx = 1.25; p.face = "ko"; p.pose = "";
    yield* wait(0.1);
    yield* all(tween(p, { sy: 1, sx: 1 }, 0.35, E.el), tween(e, { b: hb }, 0.2, E.back));
    stick(p, "bump", { db: 58, sec: 6 });
    // 머리 위에 떡하니 앉아서 의기양양
    e.face = "happy"; A.say(e, pick(["메에~", "냐옹~"]));
    orbit(p, 1.4);
    yield* wait(1.4, (k, dt, t) => { p.face = "dz" + ((Math.floor(t * 9) % 4) + 1); p.rot = Math.sin(t * 5) * 6; e.x = p.x + Math.sin(t * 5) * 5; });
    p.rot = 0;
    yield* A.leap(e, clamp(p.x + 40 * d, 20, geo().W - 20), A.gb(e), 16, 0.3);
    e.zz = 0;
    p.face = "ko";
    yield* p.fall(-d);
    yield* wait(0.5);
    yield* p.getUp();
  }, { n: 2 });

  // 로데오: 올라탔다가 내동댕이
  reg("pa:ride", "올라타기", (c, o) => { const p = who(c, o); const big = c.ground.filter((e) => (e.size || 1) >= 0.9); return p && big.length ? { p, e: near(big, p) } : null; }, function* (v) {
    const p = v.p.take(), e = hold(v.e), g = geo();
    const d = dirTo(p, e);
    yield* p.walk(e.x - 30 * d, 54);
    p.say(pick(["이랴!", "태워 줘~"]), 900);
    const seat = () => A.top(e) - GYs - 26;
    const GYs = 12;
    const x0 = p.x;
    p.z = 10; p.pose = "raise";
    yield* wait(0.3, (k) => { p.x = x0 + (e.x - x0) * k; p.y = seat() * k + Math.sin(k * Math.PI) * 24; });
    e.sy = 0.8; e.face = "sweat";
    yield* tween(e, { sy: 1 }, 0.25, E.el);
    p.look(e.x + (e.flip ? -1 : 1)); p.flip = e.flip; p.face = "happy";
    // 싫다고 날뛰어요: 점점 세게
    A.say(e, pick(["메에에!", "내려!"]));
    for (let i = 0; i < 4; i++) {
      const h = 8 + i * 6;
      yield* tween(e, { sy: 0.8 }, 0.07);
      e.sy = 1;
      yield* wait(0.26, (k) => { e.lift = Math.sin(k * Math.PI) * h; e.rot = Math.sin(k * Math.PI * 2) * (10 + i * 4); p.y = seat() + e.lift + (k > 0.5 ? Math.sin((k - 0.5) * 2 * Math.PI) * (4 + i * 3) : 0); p.rot = -e.rot * 0.6; p.face = i > 1 ? "hit" : "happy"; });
      e.lift = 0; e.rot = 0; dust(e.x, 6, 3);
    }
    // 휙! 내동댕이
    pow(p.x, p.b + 80, "휙!", { ms: 400 });
    p.rot = 0;
    const td = p.x < g.W * 0.55 ? 1 : -1;
    yield* all(pFly(p, 240 * td, 500), (function* () { e.face = "happy"; yield* A.hop(e, 8, 0.22); A.say(e, "메에~"); yield* wait(0.5); })());
  }, { n: 2 });

  // 털 뽑기: 홀쭉해져서 덜덜 떨다가 퐁 하고 다시 부풀어요
  reg("pa:pluck", "털 뽑기", (c, o) => { const p = who(c, o); const l = c.ground.filter((e) => e.kind === "sheep"); return p && l.length ? { p, e: near(l, p) } : null; }, function* (v) {
    const p = v.p.take(), e = hold(v.e);
    const d = dirTo(p, e);
    yield* p.walk(e.x - 30 * d, 50);
    p.look(e); p.face = "m9";
    const col = color(e);
    for (let i = 0; i < 4; i++) {
      p.pose = "back"; yield* p.lean(-6 * d, 0.1);
      p.pose = "punch"; yield* p.lean(8 * d, 0.05, E.in);
      pow(e.x, e.b + 30, "뽁", { ms: 260 });
      puff(e.x - 6 * d, e.b + 16, 5, { c: col, s: 4, sp: 22, up: 22, fall: 14, ms: 800 });
      e.scale = 1 - 0.07 * (i + 1); e.face = "sweat"; e.tx = 2 * d;
      yield* wait(0.1); e.tx = 0;
    }
    p.pose = ""; yield* p.lean(0, 0.1);
    // 뽑은 털을 머리에 얹어 봐요
    p.front(); p.face = "happy"; p.say(pick(["폭신폭신", "내 털모자 어때"]), 1100);
    puff(p.x, p.b + 66, 6, { c: col, s: 4, sp: 10, up: 6, fall: 0, ms: 1400 });
    // 홀쭉해진 동물은 덜덜
    A.say(e, pick(["추, 추워…", "메에… 덜덜"]));
    yield* A.jitter(e, 1.2, 1.5, 30);
    // 에… 에취! 하면 퐁
    e.face = "baa";
    yield* tween(e, { sy: 1.15 }, 0.3);
    e.sy = 1;
    impact(e.x, e.b + 26, "퐁!", false);
    puff(e.x, e.b + 14, 12, { c: col, s: 4, sp: 34, up: 26 });
    e.scale = 1.25;
    yield* tween(e, { scale: 1 }, 0.4, E.el);
    e.face = "happy";
    p.look(e); p.face = "hit";
    yield* A.hop(e, 8, 0.24);
  }, { n: 2, w: 1 });

  // 쓰담쓰담 (사이좋게)
  reg("pa:pet", "동물 쓰다듬기", (c, o) => { const p = who(c, o); return p && c.ground.length ? { p, e: near(c.ground, p) } : null; }, function* (v) {
    const p = v.p.take(), e = hold(v.e);
    const d = dirTo(p, e);
    yield* p.walk(e.x - 28 * d, 46);
    p.look(e); p.pose = "crouch"; p.face = "happy";
    e.flip = d > 0; e.face = "happy";
    for (let i = 0; i < 6; i++) { e.sy = i % 2 ? 1 : 0.9; e.sx = i % 2 ? 1 : 1.08; p.pose = i % 2 ? "crouch" : "act"; yield* wait(0.17); }
    e.sy = 1; e.sx = 1;
    hearts(e, 5);
    yield* A.hop(e, 10, 0.26); yield* A.hop(e, 7, 0.22);
    p.pose = "";
  }, { n: 2, w: 1 });

  // 간식 던져 주기: 폴짝 뛰어 받아먹어요
  reg("pa:feed", "간식 주기", (c, o) => { const p = who(c, o); return p && c.ground.length ? { p, e: near(c.ground, p) } : null; }, function* (v) {
    const p = v.p.take(), e = hold(v.e), g = geo();
    const d = dirTo(p, e);
    const tx = clamp(p.x + d * 70, g.pond.x1 + 20, g.W - 20);
    if (Math.abs(e.x - tx) > 12) yield* A.move(e, tx, 70);
    e.flip = d > 0;
    p.look(e); p.face = "happy";
    const f = new Prop("fish", 2); f.x = p.x + 14 * d; f.b = p.b + 34; f.z = 12; f.sx = 0; f.sy = 0;
    yield* tween(f, { sx: 1, sy: 1 }, 0.14, E.back);
    p.pose = "act"; p.say(pick(["먹을래?", "자, 받아!"]), 900);
    // 살랑살랑 흔들어 약 올리다가
    yield* wait(0.8, (k, dt, t) => { f.b = p.b + 34 + Math.sin(t * 10) * 4; e.lift = Math.abs(Math.sin(t * 7)) * 4; e.face = "baa"; });
    e.lift = 0;
    p.pose = "back"; yield* p.lean(-8 * d, 0.14);
    p.pose = "punch";
    fork((function* () { yield* p.lean(8 * d, 0.06, E.in); yield* wait(0.3); p.pose = ""; yield* p.lean(0, 0.1); })());
    // 간식이 포물선으로, 동물은 타이밍 맞춰 폴짝
    const mx = (p.x + e.x) / 2 + 10 * d, mb = 64;
    fork(f.arc(mx, mb, 26, 0.34, 540 * d));
    yield* wait(0.12);
    yield* A.leap(e, mx, mb - 12, 10, 0.22);
    f.remove(); pow(mx, mb + 14, "냠!", { ms: 400 });
    e.face = "happy";
    yield* A.leap(e, clamp(mx + 6 * d, 20, g.W - 20), A.gb(e), 6, 0.22);
    for (let i = 0; i < 4; i++) { e.frame = i % 2 ? "eat" : "stand"; yield* wait(0.14); }
    e.frame = "stand";
    hearts(e, 4);
    yield* A.hop(e, 8, 0.22);
  }, { n: 2, w: 1 });

  // ============================================================
  // 동물 → 사람
  // ============================================================
  // 엉덩이 앙!: 매달린 채로 뛰어다녀요
  reg("ap:bite", "엉덩이 물기", (c, o) => { const p = who(c, o); return p && c.ground.length ? { p, e: near(c.ground, p) } : null; }, function* (v) {
    const p = v.p.take(), e = hold(v.e), g = geo();
    p.front(); pow(p.x, p.b + 84, "♪", { ms: 600 });
    const d = dirTo(e, p);
    // 살금살금 뒤로
    yield* A.move(e, p.x - 34 * d, 30);
    e.flip = d < 0;
    yield* A.squash(e, 1.15, 0.8, 0.3); // 엉덩이를 씰룩씰룩
    yield* A.jitter(e, 0.3, 1.5);
    e.zz = 12; e.face = "baa";
    yield* A.leap(e, p.x - 12 * d, p.b + 12, 14, 0.16);
    impact(p.x - 6 * d, p.b + 22, "앙!");
    p.face = "hit"; p.sy = 1.15; p.sx = 0.9;
    yield* wait(0.1);
    p.sy = 1; p.sx = 1;
    let on = true, t0 = 0;
    fork((function* () { while (on) { const dt = yield; t0 += dt; const tx = p.x - 14 * (p.dir === "side" ? p.fwd() : d), k = Math.min(1, dt * 22); e.x += (tx - e.x) * k; e.b += (p.b + 12 - e.b) * k; e.flip = p.dir === "side" ? p.flip : d < 0; e.rot = Math.sin(t0 * 16) * 14; } })());
    // 펄쩍 뛰고 이리저리 달려요
    p.pose = "raise";
    yield* p.hop(34, 0.4);
    p.say(pick(["아야야야! 떼 줘!", "엉덩이! 내 엉덩이!"]), 1500);
    for (let i = 0; i < 3; i++) yield* p.walk(i % 2 ? g.pond.x1 + 30 : g.W - 30, 150, { pose: "raise" });
    // 빙글빙글 돌아서 떼어 내요
    for (let i = 0; i < 8; i++) { p.dir = ["down", "side", "up", "side"][i % 4]; p.flip = i % 4 === 3; yield* wait(0.06); }
    on = false; e.rot = 0; e.zz = 0;
    p.front(); p.pose = "";
    yield* A.toss(e, 200 * (p.x < g.W / 2 ? 1 : -1), 260);
    e.face = "happy"; A.say(e, pick(["냠", "메에~"]));
    // 엉덩이를 잡고 팔짝팔짝
    for (let i = 0; i < 3; i++) { p.pose = "crouch"; p.face = i % 2 ? "cry1" : "cry2"; yield* wait(0.22, (k) => { p.y = Math.sin(k * Math.PI) * 12; }); p.y = 0; }
    p.pose = "";
    yield* p.cry(1.0);
  }, { n: 2 });

  // 새가 눈알을 쏙 뽑아 물고 달아나요
  reg("ap:eye", "눈알 물어 가기", (c, o) => { const p = who(c, o); return p && c.birds.length ? { p, e: pick(c.birds) } : null; }, function* (v) {
    const p = v.p.take(), e = hold(v.e), g = geo();
    p.front();
    const sd = e.x < p.x ? -1 : 1;
    yield* A.fly(e, p.x + 22 * sd, p.b + 40, 170);
    e.flip = sd > 0;
    p.face = "hit"; p.say("어? 뭐야 너", 700);
    yield* A.hover(e, 0.3);
    // 쪽! 물고는 쭈욱 잡아당겨요
    yield* tween(e, { x: p.x + 14 * sd }, 0.06, E.in);
    pow(p.x + 8 * sd, p.b + 46, "쪽!", { ms: 400 });
    const eye = new Prop("eye", 2); eye.x = p.x + 9 * sd; eye.b = p.b + 31; eye.z = 13; eye.pivot = sd > 0 ? "0% 50%" : "100% 50%";
    p.face = sd > 0 ? "noR" : "noL";
    yield* wait(0.5, (k, dt, t) => { const q = E.out(k); e.x = p.x + (14 + 14 * q) * sd; e.frame = Math.floor(t * 14) % 2 ? "fly1" : "fly2"; eye.sx = 1 + 1.4 * q; p.rot = 6 * sd * q; });
    impact(p.x + 20 * sd, p.b + 44, "뽁!", false);
    eye.sx = 1; eye.pivot = "50% 50%";
    p.rot = 0;
    // 눈알을 물고 달아나요
    let carry = true;
    fork((function* () { while (carry) { yield; eye.x = e.x + (e.flip ? -8 : 8); eye.b = e.b + 2; } })());
    p.say(pick(["내 눈! 돌려줘!", "야!! 그거 내 거야"]), 1300);
    fork((function* () { yield* A.fly(e, clamp(p.x + 80 * sd, 30, g.W - 30), 110, 150); yield* A.fly(e, clamp(p.x - 60 * sd, g.pond.x1 + 30, g.W - 30), 120, 120); })());
    // 폴짝폴짝 뛰며 쫓아가요
    for (let i = 0; i < 4; i++) { const tx = clamp(e.x, g.pond.x1 + 30, g.W - 30), x0 = p.x; p.pose = "raise"; p.look(tx); yield* wait(0.36, (k) => { p.x = x0 + (tx - x0) * 0.6 * k; p.y = Math.sin(k * Math.PI) * 26; }); p.y = 0; dust(p.x, 12, 2); }
    // 새가 눈알을 툭 떨어뜨리고 웃으며 가 버려요
    carry = false;
    A.say(e, pick(["짹짹짹!", "삐약~"])); e.face = "happy";
    fork(eye.bounce(rand(-40, 40), 60, 6));
    fork((function* () { e.rot = 0; yield* wait(0.5, (k) => { e.rot = 360 * k * (e.flip ? -1 : 1); }); e.rot = 0; yield* A.fly(e, clamp(e.x + 60 * sd, 30, g.W - 30), g.H * 0.66, 120); })());
    yield* wait(1.1);
    if (eye.x < g.pond.x1 + 20) { PL().ring(eye.x); yield* eye.arc(g.pond.x1 + 30, 6, 30, 0.4, 720); }
    p.pose = "act";
    yield* p.walk(eye.x + (p.x < eye.x ? -18 : 18), 50, { pose: "act" });
    p.look(eye.x); p.pose = "crouch";
    yield* wait(0.25);
    p.front(); p.pose = "hold";
    yield* eye.arc(p.x + 9 * sd, p.b + 34, 24, 0.26, 360);
    eye.remove();
    p.face = "cross"; pow(p.x, p.b + 50, "쏙!", { ms: 400 });
    yield* p.squash(1.06, 0.94, 0.03);
    p.pose = "";
    yield* wait(0.6);
    yield* p.shakeHead(4);
    p.face = "m17"; p.say(pick(["먼지 묻었잖아…", "눈이 좀 따가워"]), 1200);
    yield* wait(0.9);
  }, { n: 4, w: 3 });

  // 새똥
  reg("ap:poop", "새똥", (c, o) => { const p = who(c, o); return p && c.birds.length ? { p, e: pick(c.birds) } : null; }, function* (v) {
    const p = v.p.take(), e = hold(v.e), g = geo();
    p.front(); p.face = "happy";
    yield* A.fly(e, p.x, Math.min(g.H - 44, p.b + 130), 130);
    // 끙… 하고 힘을 주더니
    pow(e.x, e.b + 26, "끙…", { ms: 600, rot: 0 });
    yield* wait(0.6, (k, dt, t) => { e.frame = Math.floor(t * 14) % 2 ? "fly1" : "fly2"; e.tx = Math.sin(t * 50) * 1; e.sy = 1 - 0.12 * k; });
    e.tx = 0; e.sy = 1.1;
    const s = new Prop("splat", 2); s.x = e.x; s.b = e.b - 4; s.sx = 0.5; s.sy = 1.3; s.z = 12;
    fork(tween(e, { sy: 1 }, 0.2, E.el));
    const b0 = s.b, tb = p.b + 58;
    yield* wait(0.3, (k) => { s.b = b0 + (tb - b0) * k * k; });
    s.remove();
    impact(p.x, p.b + 70, "철퍽", false);
    puff(p.x, p.b + 62, 6, { c: "#ffffff", s: 3, sp: 22, up: 12 });
    stick(p, "splat", { db: 56, sec: 7 });
    p.sy = 0.94; p.face = "hit";
    yield* tween(p, { sy: 1 }, 0.2, E.el);
    // 천천히 올려다봐요
    yield* wait(0.5);
    p.dir = "up";
    yield* wait(0.6);
    fork((function* () { A.say(e, pick(["짹짹짹!", "삐약삐약~"])); e.face = "happy"; yield* wait(0.6, (k) => { e.rot = 360 * k; e.b += Math.sin(k * Math.PI * 2) * 1.5; }); e.rot = 0; yield* A.fly(e, clamp(e.x + 80, 30, g.W - 30), g.H * 0.66, 100); })());
    yield* p.angry(1.3);
    p.say(pick(["거기 서!!", "내 머리에!!"]), 1100);
    yield* wait(0.6);
  }, { n: 2 });

  // 냥펀치 연타
  reg("ap:paw", "냥펀치 연타", (c, o) => { const p = who(c, o); return p && c.cats.length ? { p, e: near(c.cats, p) } : null; }, function* (v) {
    const p = v.p.take(), e = hold(v.e);
    const d = dirTo(e, p);
    yield* A.move(e, p.x - 34 * d, 60);
    e.flip = d < 0;
    p.look(e); p.pose = "crouch"; p.face = "happy"; p.say(pick(["우쭈쭈~", "이리 와 봐"]), 900);
    yield* wait(0.5);
    // 꼬리를 탁 탁 치더니
    e.face = "baa";
    yield* A.jitter(e, 0.3, 1);
    e.zz = 12;
    yield* A.leap(e, p.x - 22 * d, p.b + 22, 10, 0.16);
    // 파바바바박
    const f = new Prop("fist", 2, { S: color(e) }); f.z = 13;
    for (let i = 0; i < 8; i++) {
      const s = i % 2 ? 1 : -1;
      f.x = e.x + 10 * d; f.b = e.b + 12 + s * 5;
      yield* tween(f, { x: p.x - 14 * d }, 0.035, E.in);
      pow(p.x + rand(-8, 8), p.b + 42 + rand(-8, 10), pick(["팍", "탁", "냥!"]), { ms: 220 });
      p.rot = (4 + i) * d * (i % 2 ? 1 : 0.4); p.face = i % 2 ? "ko" : "hit"; e.tx = 3 * d;
      yield* wait(0.045);
      e.tx = 0;
    }
    f.remove();
    impact(p.x - 6 * d, p.b + 44, "퍽!");
    p.pose = "";
    yield* A.leap(e, e.x - 20 * d, A.gb(e), 10, 0.2);
    e.zz = 0; e.face = "happy"; A.say(e, "냥.");
    yield* tween(p, { rot: 0 }, 0.3, E.el);
    p.front();
    yield* p.dizzy(1.1, true);
    p.face = "ko";
    yield* p.fall(d);
    yield* wait(0.5);
    yield* p.getUp();
  }, { n: 2 });

  // 하마 물대포
  reg("ap:spit", "하마 물대포", (c, o) => { const p = who(c, o); return p && c.hippo ? { p, e: c.hippo } : null; }, function* (v) {
    const p = v.p.take(), e = hold(v.e), P = PL();
    p.front(); p.face = "happy";
    e.flip = false; e.face = "baa";
    A.say(e, "뿌…");
    // 볼을 빵빵하게 부풀려요
    yield* tween(e, { sx: 1.25, sy: 1.15 }, 0.7, E.out);
    yield* wait(0.2);
    e.sx = 0.9; e.sy = 1;
    pow(e.x + 16, 40, "푸우우!", { big: true });
    fork(tween(e, { sx: 1 }, 0.3, E.el));
    // 물줄기가 포물선으로 날아가요
    const x0 = e.x + 14, b0 = 24, x1 = p.x, b1 = p.b + 40;
    let wet = false;
    fork((function* () {
      for (let i = 0; i < 26; i++) {
        const el = new Prop("stone", 2, { G: "#8fd0ff", g: "#bfe6ff", o: "#5aa8e0" }); el.z = 11;
        fork((function* () { el.x = x0; el.b = b0; yield* el.arc(x1 + rand(-8, 8), b1 + rand(-10, 10), 46, 0.42, 0); el.remove(); wet = true; P.drops(x1, b1, 2, 14, "#bfe6ff"); })());
        yield* wait(0.045);
      }
    })());
    yield* until(() => wet, 1.5);
    // 흠뻑: 뒤로 밀려나며 버텨요
    p.look(e); p.face = "hit"; p.pose = "raise";
    const px = p.x;
    yield* wait(1.1, (k, dt, t) => { p.x = px + 22 * E.out(k); p.rot = 12 - Math.sin(t * 30) * 2; p.face = Math.floor(t * 8) % 2 ? "hit" : "ko"; });
    p.rot = 0; p.pose = ""; p.front(); p.face = "blink";
    fork(wait(0.8, (k, dt) => { if (Math.random() < dt * 24) P.drops(p.x + rand(-14, 14), p.b + rand(20, 50), 1, 14, "#bfe6ff"); }));
    yield* p.jitter(0.8, 2, 26);
    e.face = "happy"; A.say(e, "뿌우~");
    p.face = "hit"; p.say("에취!", 700);
    yield* p.hop(5, 0.2);
    yield* p.angry(0.9);
  }, { n: 2 });

  // 들이받기 기습
  reg("ap:ram", "들이받기", (c, o) => { const p = who(c, o); return p && c.ground.length ? { p, e: pick(c.ground) } : null; }, function* (v) {
    const p = v.p.take(), e = hold(v.e), g = geo();
    p.front(); p.face = "happy"; pow(p.x, p.b + 84, "♪", { ms: 600 });
    const d = dirTo(e, p);
    yield* A.move(e, clamp(p.x - 96 * d, 20, g.W - 20), 80);
    e.flip = d < 0; e.face = "baa";
    // 발을 벅벅 긁으며 콧김을 뿜어요
    for (let i = 0; i < 3; i++) { dust(e.x - 10 * d, 6, 3); yield* tween(e, { tx: -5 * d, sy: 0.92 }, 0.11); yield* tween(e, { tx: 0, sy: 1 }, 0.09); }
    puff(e.x + 10 * d, e.b + 16, 3, { c: "#ffffff", s: 3, sp: 6, up: 6, dir: d, ms: 400 });
    p.look(e); p.face = "hit"; p.say(pick(["어? 왜 그런 눈으로…", "잠깐 잠깐"]), 900);
    yield* wait(0.2);
    yield* A.move(e, p.x - 20 * d, 250);
    impact(p.x - 8 * d, p.b + 20, "쾅!");
    e.sx = 0.8;
    fork(tween(e, { sx: 1 }, 0.3, E.el));
    yield* all(pFly(p, 300 * d, 500), (function* () { yield* wait(0.3); e.face = "happy"; yield* A.hop(e, 10, 0.24); A.say(e, pick(["메에!", "냐옹"])); yield* wait(0.5); })());
  }, { n: 2 });

  // 새가 머리에 앉아 둥지인 줄 알아요 (사이좋게)
  reg("ap:perch", "머리 위 둥지", (c, o) => { const p = who(c, o); return p && c.birds.length ? { p, e: pick(c.birds) } : null; }, function* (v) {
    const p = v.p.take(), e = hold(v.e), g = geo();
    p.front();
    yield* A.fly(e, p.x, p.b + 84, 120);
    yield* tween(e, { b: p.b + 58 }, 0.2, E.in);
    e.frame = "stand"; e.zz = 12;
    p.sy = 0.96; yield* tween(p, { sy: 1 }, 0.2, E.el);
    p.face = "hit";
    A.say(e, pick(["짹", "삐약"]));
    // 눈만 위로 굴려 보다가 가만히 있어 줘요
    yield* wait(0.5); p.dir = "up"; yield* wait(0.5); p.front(); p.face = "happy";
    for (let i = 0; i < 3; i++) { pow(e.x + rand(-10, 10), e.b + 26, "♪", { ms: 600 }); yield* A.hop(e, 4, 0.18); yield* wait(0.3); }
    hearts(e, 4);
    e.zz = 0;
    yield* A.fly(e, clamp(p.x + 70, 30, g.W - 30), g.H * 0.62, 110);
  }, { n: 2, w: 1 });

  // ============================================================
  // 동물 ↔ 동물
  // ============================================================
  const pair = (c) => { if (c.ground.length < 2) return null; const l = c.ground.slice().sort(() => Math.random() - 0.5); return { a: l[0], b: l[1] }; };
  // 서로 박치기
  reg("aa:butt", "동물 박치기", pair, function* (v) {
    const a = hold(v.a), b = hold(v.b), g = geo();
    const m = clamp((a.x + b.x) / 2, g.pond.x1 + 70, g.W - 70), d = a.x <= b.x ? 1 : -1;
    yield* all(A.move(a, m - 56 * d, 80), A.move(b, m + 56 * d, 80));
    a.flip = d < 0; b.flip = d > 0; a.face = "baa"; b.face = "baa";
    for (let i = 0; i < 2; i++) { dust(a.x - 8 * d, 6, 2); dust(b.x + 8 * d, 6, 2); yield* all(tween(a, { tx: -4 * d }, 0.1), tween(b, { tx: 4 * d }, 0.1)); yield* all(tween(a, { tx: 0 }, 0.08), tween(b, { tx: 0 }, 0.08)); }
    yield* all(A.move(a, m - 14 * d, 230), A.move(b, m + 14 * d, 230));
    impact(m, 30, "쾅!");
    a.sx = 0.75; b.sx = 0.75;
    yield* wait(0.1);
    a.sx = 1; b.sx = 1;
    PL().throwEnt(a, -220 * d, 300); PL().throwEnt(b, 220 * d, 300);
    yield* until(() => !a.thrown && !b.thrown, 8);
    a.script = true; b.script = true;
    yield* all(A.dizzy(a, 1.2), A.dizzy(b, 1.2));
  }, { n: 1 });
  // 폴짝 뛰어 짓밟기: 납작해졌다가 뿅
  reg("aa:stomp", "짓밟기", pair, function* (v) {
    const a = hold(v.a), b = hold(v.b), g = geo();
    const d = dirTo(a, b);
    yield* A.move(a, clamp(b.x - 46 * d, 20, g.W - 20), 80);
    a.face = "happy";
    yield* A.squash(a, 1.15, 0.8, 0.2);
    a.zz = 12;
    const bx = b.x;
    yield* A.leap(a, bx, A.gb(b) + A.h(b) * 0.25, 46, 0.4);
    impact(bx, 26, "납작!");
    b.sy = 0.25; b.sx = 1.5; b.face = "sweat";
    yield* wait(0.5, (k) => { a.b = A.gb(b) + A.h(b) * 0.25 + Math.abs(Math.sin(k * Math.PI * 2)) * 6; });
    yield* A.leap(a, clamp(bx + 44 * d, 20, g.W - 20), A.gb(a), 26, 0.34);
    a.zz = 0;
    yield* wait(0.3);
    pow(bx, 30, "뿅", { ms: 400 });
    yield* tween(b, { sy: 1, sx: 1 }, 0.4, E.el);
    b.face = "baa"; A.say(b, pick(["메에!!", "냐악!"]));
    // 쫓아가요
    a.face = "sweat";
    const far = a.x < g.W / 2 ? g.W - 20 : g.pond.x1 + 30;
    yield* all(A.move(a, far, 190), (function* () { yield* wait(0.15); yield* A.move(b, far + (far > a.x ? -30 : 30), 200); })());
  }, { n: 2 });
  // 달려와서 뻥
  reg("aa:kick", "동물끼리 뻥", pair, function* (v) {
    const a = hold(v.a), b = hold(v.b), g = geo();
    const d = dirTo(a, b);
    yield* A.move(a, clamp(b.x - 70 * d, 20, g.W - 20), 80);
    a.flip = d < 0; a.face = "baa";
    yield* tween(a, { tx: -6 * d, sy: 0.9 }, 0.2); a.tx = 0; a.sy = 1;
    yield* A.move(a, b.x - 22 * d, 240);
    a.rot = -20 * d;
    impact(b.x - 6 * d, 20, "뻥!");
    b.sx = 0.7; b.face = "sweat";
    yield* wait(0.09);
    fork((function* () { yield* tween(a, { rot: 0 }, 0.2, E.el); a.face = "happy"; yield* A.hop(a, 10, 0.24); })());
    yield* A.toss(b, 420 * d, 380);
    yield* A.dizzy(b, 0.9);
  }, { n: 2 });
  // 싸움 구름
  reg("aa:fight", "뒤엉켜 싸우기", pair, function* (v) {
    const a = hold(v.a), b = hold(v.b), g = geo();
    const d = a.x <= b.x ? 1 : -1;
    a.flip = d < 0; b.flip = d > 0; a.face = "baa"; b.face = "baa";
    A.say(a, pick(["메에!", "냐악!"])); yield* wait(0.4); A.say(b, pick(["메에에!!", "하악!"]));
    yield* wait(0.5);
    const m = clamp((a.x + b.x) / 2, g.pond.x1 + 50, g.W - 50);
    yield* all(A.move(a, m - 8 * d, 200), A.move(b, m + 8 * d, 200));
    a.scale = 0.001; b.scale = 0.001;
    const cl = new Prop("cloud", 3); cl.x = m; cl.b = 2; cl.z = 11; cl.pivot = "50% 80%"; cl.sx = 0.2; cl.sy = 0.2;
    yield* tween(cl, { sx: 1, sy: 1 }, 0.14, E.back);
    let acc = 0;
    yield* wait(2.0, (k, dt, t) => {
      cl.sx = 1 + Math.sin(t * 23) * 0.1; cl.sy = 1 + Math.cos(t * 19) * 0.1; cl.rot = Math.sin(t * 11) * 6; cl.x = m + Math.sin(t * 3.4) * 12;
      acc += dt;
      if (acc > 0.15) { acc = 0; pow(cl.x + rand(-28, 28), 14 + rand(8, 40), pick(["퍽!", "냐악!", "메에!", "콱!", "팍!", "하악!"]), { ms: 380, big: Math.random() < 0.25 }); stars(cl.x + rand(-20, 20), 20 + rand(0, 20), 1); puff(cl.x, 16, 1, { c: Math.random() < 0.5 ? color(a) : color(b), s: 4, sp: 40, up: 30, fall: 12, ms: 800 }); }
    });
    yield* tween(cl, { sx: 1.5, sy: 1.5 }, 0.12, E.out);
    cl.remove(); puff(m, 20, 10, { c: "#efe6d8", s: 4, sp: 44, up: 26, fall: 6 });
    a.scale = 1; b.scale = 1; a.x = m - 22 * d; b.x = m + 22 * d;
    const lose = pick([a, b]), win = lose === a ? b : a;
    yield* all(aKO(lose, 1.4), (function* () { win.face = "happy"; yield* A.hop(win, 10, 0.24); A.say(win, pick(["메에~", "냥."])); yield* wait(0.6); })());
  }, { n: 2, w: 3 });
  // 땅 친구가 낮게 나는 새를 낚아채요
  reg("aa:pounce", "새 낚아채기", (c) => (c.ground.length && c.birds.length ? { a: pick(c.ground), b: pick(c.birds) } : null), function* (v) {
    const a = hold(v.a), b = hold(v.b), g = geo();
    // 새가 낮게 지나가요
    const d = a.x < g.W * 0.55 ? 1 : -1;
    const y = 54;
    fork((function* () { yield* A.fly(b, clamp(a.x + 60 * d, 30, g.W - 30), y, 120); })());
    a.flip = d < 0; a.face = "";
    // 엉덩이를 낮추고 씰룩씰룩
    yield* tween(a, { sy: 0.78, sx: 1.15 }, 0.3, E.out);
    yield* A.jitter(a, 0.5, 1.5, 20);
    yield* until(() => Math.abs(b.x - (a.x + 60 * d)) < 6, 3);
    a.sx = 1; a.sy = 1; a.zz = 12;
    // 펄쩍!
    yield* A.leap(a, b.x - 6 * d, b.b - 10, 16, 0.2);
    impact(b.x, b.b + 10, "덥석!");
    feathers(b.x, b.b, 7, color(b));
    b.face = "sweat"; A.say(b, pick(["삐약?!", "짹!!"]));
    // 둘이 엉켜서 데굴데굴 떨어져요
    const x0 = a.x, b0 = a.b;
    yield* wait(0.4, (k) => { a.x = x0 + 18 * d * k; a.b = b0 + (A.gb(a) - b0) * k * k; a.rot = 540 * k * d; b.x = a.x + 8 * d; b.b = a.b + 10; b.rot = -a.rot; });
    a.rot = 0; b.rot = 0; a.b = A.gb(a); dust(a.x, 6, 6); quake(2);
    // 새가 빠져나와 달아나고, 땅 친구는 깃털만 퉤
    yield* A.jitter(b, 0.3, 2);
    a.zz = 0;
    fork(A.fly(b, clamp(b.x + 50 * d, 30, g.W - 30), g.H * 0.68, 200));
    a.face = "baa";
    yield* wait(0.4);
    pow(a.x + 10 * d, a.b + 26, "퉤", { ms: 400 });
    feathers(a.x + 10 * d, a.b + 16, 2, color(b));
    a.face = "happy";
    yield* A.hop(a, 6, 0.2);
    yield* wait(0.5);
  }, { n: 2 });
  // 새가 엉덩이를 콕콕, 잡으려다 철퍼덕
  reg("aa:peck", "엉덩이 쪼기", (c) => (c.ground.length && c.birds.length ? { a: pick(c.birds), b: pick(c.ground) } : null), function* (v) {
    const a = hold(v.a), b = hold(v.b), g = geo();
    const d = b.flip ? 1 : -1; // 엉덩이 쪽
    for (let i = 0; i < 3; i++) {
      yield* A.fly(a, b.x + 22 * d, b.b + 22, 190);
      a.flip = d > 0;
      yield* tween(a, { x: b.x + 14 * d }, 0.05, E.in);
      pow(b.x + 10 * d, b.b + 26, "콕!", { ms: 300 });
      b.face = "baa";
      fork(A.hop(b, 12 + i * 4, 0.24));
      yield* A.fly(a, b.x + 40 * d, b.b + 50, 200);
      yield* wait(0.2);
      b.flip = !b.flip; // 휙 돌아보지만 이미 없어요
      yield* wait(0.25);
      b.flip = !b.flip;
    }
    // 이번엔 잡는다! → 헛발질, 철퍼덕
    b.face = "baa"; b.flip = d < 0;
    b.zz = 12;
    fork(A.fly(a, a.x, a.b + 40, 240));
    const x0 = b.x, tx = clamp(b.x + 30 * d, 20, g.W - 20);
    yield* wait(0.34, (k) => { b.x = x0 + (tx - x0) * k; b.lift = Math.sin(k * Math.PI) * 30; b.rot = 90 * d * k; });
    b.lift = 0; b.zz = 0;
    impact(b.x, 20, "철퍼덕", false); dust(b.x, 6, 6);
    b.face = "sweat";
    yield* wait(0.5);
    // 새가 등에 내려앉아 한 곡조
    yield* A.fly(a, b.x, b.b + 18, 120);
    a.frame = "stand"; a.zz = 12; a.face = "happy";
    for (let i = 0; i < 3; i++) { pow(a.x + rand(-8, 8), a.b + 24, "♪", { ms: 600 }); yield* A.hop(a, 3, 0.16); yield* wait(0.25); }
    a.zz = 0;
    yield* A.fly(a, clamp(b.x + 60, 30, g.W - 30), g.H * 0.64, 120);
    b.rot = 0;
    yield* A.hop(b, 5, 0.2);
  }, { n: 2 });
  // 하마 물대포에 주르륵 밀려나요
  reg("aa:cannon", "하마 물대포 (동물)", (c) => (c.hippo && c.ground.length ? { a: c.hippo, b: near(c.ground, { x: 0 }) } : null), function* (v) {
    const a = hold(v.a), b = hold(v.b), g = geo(), P = PL();
    yield* A.move(b, clamp(g.pond.x1 + 50, 20, g.W - 20), 70);
    b.flip = true; b.face = "happy";
    a.flip = false; a.face = "baa";
    yield* tween(a, { sx: 1.25, sy: 1.15 }, 0.6, E.out);
    a.sx = 0.9; a.sy = 1;
    pow(a.x + 16, 40, "푸우!", { big: true });
    fork(tween(a, { sx: 1 }, 0.3, E.el));
    fork((function* () { for (let i = 0; i < 20; i++) { const el = new Prop("stone", 2, { G: "#8fd0ff", g: "#bfe6ff", o: "#5aa8e0" }); el.z = 11; fork((function* () { el.x = a.x + 14; el.b = 22; yield* el.arc(b.x + rand(-6, 6), b.b + 14 + rand(-6, 6), 30, 0.34, 0); el.remove(); P.drops(b.x, b.b + 14, 1, 12, "#bfe6ff"); })()); yield* wait(0.045); } })());
    yield* wait(0.34);
    b.face = "sweat";
    const x0 = b.x;
    yield* wait(0.9, (k, dt) => { b.x = clamp(x0 + 50 * E.out(k), 20, g.W - 20); b.rot = 10; b.tx = Math.sin(k * 80) * 1; if (Math.random() < dt * 20) dust(b.x - 8, 6, 1); });
    b.rot = 0; b.tx = 0;
    yield* A.jitter(b, 0.8, 2, 26);
    fork(wait(0.1, () => P.drops(b.x, b.b + 14, 8, 20, "#bfe6ff")));
    A.say(b, pick(["메에… 젖었어", "냐…"])); a.face = "happy"; A.say(a, "뿌우~");
    yield* wait(0.8);
  }, { n: 1 });
  // 꼬리 물고 늘어지기
  reg("aa:tail", "꼬리 잡아당기기", pair, function* (v) {
    const a = hold(v.a), b = hold(v.b), g = geo();
    const d = dirTo(a, b);
    b.flip = d < 0; // 등을 보이고
    yield* A.move(a, b.x - 26 * d, 50);
    a.face = "baa";
    pow(b.x - 14 * d, b.b + 20, "앙", { ms: 400 });
    b.face = "sweat"; A.say(b, pick(["메?!", "냐?!"]));
    // b 는 달아나려 하고 a 는 버텨요: 몸이 쭈욱 늘어나요
    const bx = b.x, ax = a.x;
    yield* wait(1.0, (k, dt, t) => { const q = E.out(k); b.sx = 1 + 0.5 * q; b.x = bx + 12 * d * q; a.x = ax + 3 * d * q + Math.sin(t * 40) * 0.6; b.frame = Math.floor(t * 12) % 2 ? "walk1" : "walk2"; if (Math.random() < dt * 14) dust(b.x + 8 * d, 6, 1); });
    // 탁! 놓치면 앞으로 튕겨 나가고 뒤로 벌러덩
    impact((a.x + b.x) / 2, 24, "탁!", false);
    b.sx = 1;
    PL().throwEnt(b, 380 * d, 220);
    fork((function* () { const x0 = a.x; yield* wait(0.4, (k) => { a.x = clamp(x0 - 26 * d * E.out(k), 20, g.W - 20); a.rot = -360 * d * k; a.lift = Math.sin(k * Math.PI) * 10; }); a.rot = 0; a.lift = 0; dust(a.x, 6, 4); })());
    yield* until(() => !b.thrown, 8);
    b.script = true;
    yield* all(A.dizzy(a, 0.9), A.dizzy(b, 0.9));
  }, { n: 2 });
  // 코 인사 (사이좋게)
  reg("aa:boop", "코 인사", pair, function* (v) {
    const a = hold(v.a), b = hold(v.b), g = geo();
    const m = clamp((a.x + b.x) / 2, g.pond.x1 + 40, g.W - 40), d = a.x <= b.x ? 1 : -1;
    yield* all(A.move(a, m - 22 * d, 50), A.move(b, m + 22 * d, 50));
    a.flip = d < 0; b.flip = d > 0;
    yield* wait(0.3);
    yield* all(tween(a, { tx: 5 * d }, 0.2, E.io), tween(b, { tx: -5 * d }, 0.2, E.io));
    pow(m, 34, "콩", { ms: 500 });
    a.face = "happy"; b.face = "happy";
    hearts(a, 3);
    yield* wait(0.3);
    yield* all(tween(a, { tx: 0 }, 0.15), tween(b, { tx: 0 }, 0.15));
    yield* all(A.hop(a, 9, 0.24), (function* () { yield* wait(0.1); yield* A.hop(b, 9, 0.24); })());
  }, { n: 1, w: 1 });
  // 등 짚고 넘기 (사이좋게)
  reg("aa:leap", "등 짚고 넘기", pair, function* (v) {
    const a = hold(v.a), b = hold(v.b), g = geo();
    for (let i = 0; i < 3; i++) {
      const j = i % 2 ? b : a, s = i % 2 ? a : b, d = dirTo(j, s);
      s.frame = "stand"; s.sy = 0.85;
      yield* A.move(j, clamp(s.x - 36 * d, 20, g.W - 20), 110);
      j.zz = 12; j.face = "happy";
      yield* A.leap(j, clamp(s.x + 36 * d, 20, g.W - 20), A.gb(j), 40, 0.4);
      j.zz = 0; s.sy = 1;
      pow(s.x, s.b + 40, pick(["폴짝", "휙"]), { ms: 320 });
    }
    yield* all(A.hop(a, 8, 0.22), A.hop(b, 8, 0.22));
  }, { n: 1, w: 1 });
  // 동물 탑: 차곡차곡 쌓였다가 와르르
  reg("aa:tower", "동물 탑", (c) => (c.ground.length >= 2 ? { l: c.ground.slice(0, 4) } : null), function* (v) {
    const l = v.l.map((e) => hold(e)), g = geo();
    const base = l[0];
    const bx = clamp(base.x, g.pond.x1 + 50, g.W - 50);
    yield* A.move(base, bx, 70);
    base.frame = "stand";
    let top = A.gb(base) + A.h(base) * 0.7;
    const hs = [A.gb(base)];
    for (let i = 1; i < l.length; i++) {
      const e = l[i], d = dirTo(e, base);
      yield* A.move(e, bx - 40 * d, 110);
      e.zz = 12 + i; e.face = "happy";
      yield* A.leap(e, bx, top, 30 + i * 8, 0.36);
      pow(bx + 20, top + 10, "착", { ms: 300 });
      l.slice(0, i).forEach((u) => { u.sy = 0.88; fork(tween(u, { sy: 1 }, 0.25, E.el)); });
      hs.push(top);
      top += A.h(e) * 0.7;
    }
    A.say(l[l.length - 1], pick(["메에~ 높다", "냐옹~"]));
    // 점점 크게 흔들흔들
    yield* wait(1.6, (k, dt, t) => { l.forEach((e, i) => { e.tx = Math.sin(t * 5) * i * (2 + 9 * k); e.face = k > 0.6 && i ? "sweat" : e.face; }); });
    // 와르르
    impact(bx, top - 10, "와르르!");
    l.forEach((e, i) => { const x = e.x + (e.tx || 0); e.zz = 0; if (i) { PL().throwEnt(e, rand(-200, 200), 160 + i * 60); e.x = x; } else e.tx = 0; });
    base.sy = 0.6; base.face = "sweat";
    yield* tween(base, { sy: 1 }, 0.4, E.el);
    yield* until(() => l.every((e) => !e.thrown), 8);
    l.forEach((e) => { e.script = true; });
    yield* all.apply(null, l.map((e) => A.dizzy(e, 0.9)));
  }, { n: 3 });
})();
