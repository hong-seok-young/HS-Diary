// ============================================================
// 장난 목록 1: 사람끼리, 그리고 혼자 하는 동작
// - 엔진(js/play.js)의 도구로 한 동작 한 동작을 차례대로 적어요.
// - 때리는 장난은 "준비 → 휘두르기 → 맞는 순간 멈칫 → 눌렸다 튕기기 → 반응" 순서를 지켜요.
// - 맞은 쪽은 울거나, 화내며 되갚거나, 쫓아가 뒤엉켜 싸우거나, 삐져요. 그래서 같은 장난도 전개가 여러 갈래예요.
// - 피는 안 나요. 혹이 나고, 별이 돌고, 눈알이 띠용 튀어나왔다가 다시 들어가는 만화식이에요.
// ============================================================
(function () {
  "use strict";
  if (!window.Play) return;
  const K = Play.kit;
  const { E, rand, pick, clamp, wait, tween, all, until, fork, pow, puff, stars, dust, quake, orbit, stick, Prop, A, headOff, headOn, panic, splashIn, landX, geo } = K;
  const PL = () => window.Pals;
  const dirTo = (a, b) => ((typeof b === "number" ? b : b.x) >= a.x ? 1 : -1);
  const two = (c, o) => {
    if (!c.him || !c.her || c.him.on || c.her.on) return null;
    const a = o && o.a ? c[o.a] : pick([c.him, c.her]);
    return { a, b: a === c.him ? c.her : c.him, o: o || {} };
  };
  const one = (c, o) => {
    if (!c.him || !c.her || c.him.on || c.her.on) return null;
    const a = o && o.a ? c[o.a] : pick([c.him, c.her]);
    return { a, b: a === c.him ? c.her : c.him, o: o || {} };
  };
  // a 가 b 앞 gap 만큼 떨어진 곳까지 걸어가 마주 봐요
  function* approach(a, b, gap, speed, o) { const side = a.x <= b.x ? -1 : 1; a.z = 5; b.z = 1; yield* a.walk(b.x + side * Math.max(gap, 38), speed || 50, o); a.look(b); }
  // 맞는 순간: 글자, 별, 흔들림
  const impact = (x, b, word, big) => { pow(x, b, word, { big: big !== false }); stars(x, b - 6, big === false ? 3 : 6); quake(big === false ? 1.5 : 3); };
  const tears = (p) => { if (PL()) PL().drops(p.x + pick([-12, 12]), p.b + 36, 2, 8, "#bfe6ff"); };

  // ---------- 맞은 뒤의 반응 ----------
  const MEAN = [];
  // 미안해, 쓰담쓰담
  function* comfort(a, b) {
    yield* approach(a, b, 30, 44);
    a.face = "m14"; a.say(pick(["미안 미안", "많이 아파?", "호~ 해 줄게"]), 1200);
    for (let i = 0; i < 4; i++) { a.pose = i % 2 ? "" : "act"; b.sy = i % 2 ? 1 : 0.96; yield* wait(0.16); }
    a.pose = ""; b.sy = 1; b.front(); b.face = "m17";
    yield* wait(0.4);
    b.face = "happy"; a.face = "happy";
    if (window.HSD && HSD.burst) { const r = b.el.getBoundingClientRect(); HSD.burst(r.left + r.width / 2, r.top + 10, 5, "heart"); }
    yield* all(a.hop(6, 0.22), b.hop(6, 0.22));
  }
  // 쫓고 쫓기다 뒤엉켜 싸움 구름
  function* chaseFight(b, a) {
    const g = geo();
    yield* b.angry(0.7);
    b.say(pick(["거기 서!", "가만 안 둬!", "너 이리 와!"]), 1100); a.face = "hit"; a.say(pick(["으악 도망가!", "잘못했어!"]), 1000);
    const lo = g.pond.x1 + 30, hi = g.W - 28;
    for (let i = 0; i < 2; i++) {
      const tx = i % 2 ? lo : hi;
      yield* all(a.walk(tx, 150, { pose: "raise" }), (function* () { yield* wait(0.18); yield* b.walk(tx + (i % 2 ? 26 : -26), 160, { pose: "punch" }); })());
    }
    yield* cloud([a, b], 2.2);
  }
  // 싸움 구름: 먼지 속에서 주먹과 별이 튀어나와요
  function* cloud(list, sec) {
    const g = geo();
    const mx = clamp(list.reduce((s, t) => s + t.x, 0) / list.length, 40, g.W - 40);
    const isP = (t) => t instanceof Play.people.him.constructor;
    yield* all.apply(null, list.map((t) => (isP(t) ? t.walk(mx + (t.x < mx ? -6 : 6), 190) : A.move(t, mx + (t.x < mx ? -6 : 6), 190))));
    list.forEach((t) => { if (isP(t)) t.hide = true; else { t.scale = 0.001; } });
    const cl = new Prop("cloud", 4); cl.x = mx; cl.b = 6; cl.z = 11; cl.pivot = "50% 80%"; cl.sx = 0.2; cl.sy = 0.2;
    yield* tween(cl, { sx: 1, sy: 1 }, 0.14, E.back);
    const words = ["퍽!", "뻑!", "팍!", "콱!", "아야!", "으악!", "이얍!", "냐악!", "쿵!", "뿅!"];
    let acc = 0, acc2 = 0;
    yield* wait(sec, (k, dt, t) => {
      cl.sx = 1 + Math.sin(t * 23) * 0.09; cl.sy = 1 + Math.cos(t * 19) * 0.09; cl.rot = Math.sin(t * 11) * 5; cl.x = mx + Math.sin(t * 3.1) * 14;
      acc += dt; acc2 += dt;
      if (acc > 0.16) { acc = 0; pow(cl.x + rand(-34, 34), 20 + rand(10, 50), pick(words), { ms: 420, big: Math.random() < 0.3 }); }
      if (acc2 > 0.22) {
        acc2 = 0;
        const ang = rand(0, Math.PI), r = 34;
        // 구름 밖으로 주먹이 쑥 나왔다 들어가요
        const f = new Prop("fist", 2); f.x = cl.x + Math.cos(ang) * 10; f.b = 26 + Math.sin(ang) * 6; f.z = 10;
        fork((function* () { yield* tween(f, { x: cl.x + Math.cos(ang) * r, b: 26 + Math.sin(ang) * r * 0.8 }, 0.08, E.out); yield* wait(0.06); yield* tween(f, { x: cl.x + Math.cos(ang) * 8, b: 26 }, 0.08, E.in); f.remove(); })());
        stars(cl.x + rand(-26, 26), 30 + rand(0, 30), 1); dust(cl.x + rand(-30, 30), 8, 2);
      }
    });
    // 펑, 구름이 걷히면
    yield* tween(cl, { sx: 1.5, sy: 1.5 }, 0.12, E.out);
    cl.remove(); puff(mx, 30, 12, { c: "#efe6d8", s: 4, sp: 50, up: 30, fall: 6 });
    const loser = pick(list);
    list.forEach((t, i) => {
      const off = (i - (list.length - 1) / 2) * 44;
      t.x = clamp(mx + off, 24, g.W - 24);
      if (isP(t)) { t.hide = false; t.rot = 0; t.pose = ""; t.front(); } else { t.scale = 1; t.rot = 0; }
    });
    // 진 쪽은 대자로 뻗고, 이긴 쪽도 너덜너덜
    yield* all.apply(null, list.map((t) => (function* () {
      if (isP(t)) {
        stick(t, "bump", { db: 58, sec: 6 });
        if (t === loser) { t.face = "ko"; yield* t.fall(t.x < mx ? -1 : 1); yield* t.dizzy(1.3); yield* t.getUp(); }
        else { stick(t, "scratch", { db: 30, sec: 5, scale: 3 }); t.face = "m19"; yield* t.jitter(0.3, 1.5); t.pose = "raise"; t.say(pick(["이겼다…", "헥헥… 내가 이김", "덤벼 봐 또"]), 1300); yield* wait(1.0); t.pose = ""; yield* t.dizzy(0.6, true); }
      } else if (t === loser) { t.rot = 180; t.face = "sweat"; orbit(t, 1.4); yield* wait(1.4); t.rot = 0; yield* A.hop(t, 6, 0.2); }
      else { t.face = "happy"; yield* A.hop(t, 10, 0.24); A.say(t, pick(["메에!", "냐옹", "뿌우~"])); yield* wait(0.9); }
    })()));
  }
  // 맞은 쪽(b)이 어떻게 나오나. depth 는 되갚기를 한 번만 하려고.
  function* react(a, b, depth, self) {
    const r = Math.random();
    b.pose = ""; a.pose = "";
    if (depth >= 1 || r < 0.26) {
      // 엉엉 울고, 때린 쪽은 깔깔 → 가끔은 미안하다고 쓰담
      a.look(b);
      yield* all(b.cry(1.7), a.laugh(1.3));
      if (Math.random() < 0.55) yield* comfort(a, b);
      else { b.face = "m17"; b.look(b.x + (b.x < a.x ? -30 : 30)); b.say(pick(["흥!", "너랑 안 놀아", "두고 봐…"]), 1200); yield* wait(0.9); }
    } else if (r < 0.66) {
      // 부들부들 화내고 그대로 되갚아요
      yield* b.angry(0.9);
      b.say(pick(["너도 맞아 봐!", "가만 안 둬!", "이번엔 내 차례야", "복수다!"]), 1200);
      a.face = "hit"; a.front();
      yield* wait(0.3);
      const v = pick(MEAN.filter((m) => m !== self && !m.long));
      yield* v(b, a, depth + 1);
    } else if (r < 0.86) {
      yield* chaseFight(b, a);
    } else {
      // 아무렇지 않은 척하다가 뒤늦게 픽
      b.front(); b.face = "m3"; b.say(pick(["…하나도 안 아파", "간지럽네", "그게 다야?"]), 1200);
      yield* wait(1.0);
      b.face = "ko"; yield* b.fall(b.x < a.x ? -1 : 1);
      a.look(b); yield* a.laugh(1.0);
      yield* b.getUp();
    }
  }
  const mean = (id, name, fn, o) => {
    o = o || {};
    if (o.long || o.ok) fn.long = true; // 길거나 날씨를 타는 장난은 되갚기로는 안 써요
    MEAN.push(fn);
    // 전개 수: 누가 하느냐(2) × (울기·삐짐·쫓기·시치미 4 + 되갚기 갈래)
    Play.def({ id: "pp:" + id, name, w: o.w || 2, mean: true, pick: (c, q) => (o.ok && !o.ok(c) ? null : two(c, q)), n: 2 * (4 + 12), run: function* (v) { v.a.take(); v.b.take(); yield* fn(v.a, v.b, 0); } });
  };

  // ============================================================
  // 사람 → 사람 (a 가 하고 b 가 당해요)
  // ============================================================
  // 꿀밤
  mean("bonk", "꿀밤", function* bonk(a, b, depth) {
    const d = dirTo(a, b);
    a.look(b); a.face = "m9";
    yield* wait(0.3);
    yield* approach(a, b, 30, 44);
    b.front();
    // 준비: 주먹을 번쩍 들고 몸을 뒤로 젖혀요
    a.pose = "raise";
    yield* all(a.lean(-12 * d, 0.22), tween(a, { y: 3 }, 0.22, E.out));
    b.face = "hit";
    yield* wait(0.14);
    // 내려치기
    a.pose = "punch";
    yield* all(a.lean(14 * d, 0.06, E.in), tween(a, { y: 0 }, 0.06));
    impact(b.x, b.b + 76, "딱!");
    b.sy = 0.74; b.sx = 1.2; b.face = "ko";
    yield* wait(0.09); // 맞는 순간 멈칫
    stick(b, "bump", { db: 58, sec: 7 });
    yield* all(tween(b, { sx: 1, sy: 1 }, 0.35, E.el), (function* () { yield* wait(0.2); a.pose = ""; yield* a.lean(0, 0.15); })());
    yield* b.dizzy(0.7, true);
    yield* react(a, b, depth, bonk);
  });
  // 주먹 한 방: 맞고 저 멀리 날아가요
  mean("punch", "주먹 한 방", function* punch(a, b, depth) {
    const d = dirTo(a, b);
    yield* approach(a, b, 34, 50);
    b.front(); a.face = "m16";
    // 준비: 주먹을 뒤로 쭉 당기며 한 발 물러나요
    a.pose = "back";
    const ax = a.x;
    yield* all(a.lean(-14 * d, 0.26), tween(a, { x: ax - 6 * d }, 0.26, E.out));
    b.face = "hit";
    yield* wait(0.1);
    // 뻗기
    a.pose = "punch";
    yield* all(a.lean(12 * d, 0.06, E.in), tween(a, { x: ax + 14 * d }, 0.06));
    impact(b.x - 8 * d, b.b + 42, "퍽!");
    b.sx = 0.76; b.sy = 1.1; b.rot = 8 * d; b.face = "ko";
    yield* wait(0.09);
    b.sx = 1; b.sy = 1;
    // 때린 쪽은 주먹을 후 불어요
    fork((function* () { yield* wait(0.3); yield* a.lean(0, 0.15); a.pose = "act"; a.face = "m9"; a.say("후~", 800); yield* wait(0.8); a.pose = ""; })());
    const res = yield* b.launch(330 * d, 400, {});
    if (res === "land") { yield* b.dizzy(0.9); yield* b.getUp(); }
    yield* react(a, b, depth, punch);
  });
  // 발차기: 하늘 높이 떴다가 머리부터 콱
  mean("kick", "발차기", function* kick(a, b, depth) {
    const d = dirTo(a, b);
    yield* approach(a, b, 56, 50);
    b.front(); a.face = "m16";
    yield* a.walk(a.x - 10 * d, 30, { back: true }); // 한 발 물러났다가
    yield* a.walk(b.x - 30 * d, 130); // 다다다 달려와서
    a.look(b); a.pose = "kick";
    yield* a.lean(-16 * d, 0.07);
    impact(b.x - 6 * d, b.b + 26, "뻥!");
    b.sy = 0.8; b.face = "ko";
    yield* wait(0.09);
    b.sy = 1;
    fork((function* () { yield* wait(0.32); a.pose = ""; yield* a.lean(0, 0.14); a.dir = "up"; })()); // 날아가는 걸 올려다봐요
    const res = yield* b.launch(90 * d, 720, { noLand: true, spin: 420 * d });
    if (res === "land") {
      // 머리부터 땅에 콱 박혀서 다리만 버둥버둥
      b.pose = ""; b.face = "ko";
      yield* tween(b, { rot: Math.round((b.rot - 180) / 360) * 360 + 180, y: 10 }, 0.08, E.in);
      b.rot = 180;
      pow(b.x, 34, "콱!", { big: true }); dust(b.x, 12, 8); quake(3.5);
      yield* wait(1.1, (k, dt, t) => { b.rot = 180 + Math.sin(t * 19) * 7; b.frame = Math.floor(t * 9) % 2 ? 1 : 2; });
      // 뽁! 하고 빠져나와요
      pow(b.x, 50, "뽁!"); b.frame = 0;
      yield* wait(0.36, (k) => { b.rot = 180 + 180 * E.out(k); b.y = 10 + Math.sin(k * Math.PI) * 30 - 10 * k; });
      b.rot = 0; b.y = 0; b.setPivot("feet"); b.y = 0;
      yield* b.squash(1.14, 0.84, 0.04);
      yield* b.dizzy(1.0, true);
    }
    yield* react(a, b, depth, kick);
  });
  // 박치기: 둘 다 별을 봐요
  mean("butt", "박치기", function* butt(a, b, depth) {
    const d = dirTo(a, b);
    a.look(b); b.look(a); a.face = "m16"; b.face = "m16";
    yield* wait(0.3);
    // 뒤로 물러나 발을 굴러요
    yield* all(a.walk(a.x - 16 * d, 40, { back: true }), b.walk(b.x + 16 * d, 40, { back: true }));
    for (let i = 0; i < 2; i++) { dust(a.x - 8 * d, 12, 2); dust(b.x + 8 * d, 12, 2); yield* all(a.lean(-8 * d, 0.1), b.lean(8 * d, 0.1)); yield* all(a.lean(0, 0.08), b.lean(0, 0.08)); }
    // 머리를 내밀고 돌진
    const m = (a.x + b.x) / 2;
    a.rot = 16 * d; b.rot = -16 * d;
    yield* all(a.walk(m - 15 * d, 190), b.walk(m + 15 * d, 190));
    impact(m, a.b + 52, "쾅!");
    a.face = "ko"; b.face = "ko"; a.sx = 0.8; b.sx = 0.8;
    yield* wait(0.11);
    yield* all(tween(a, { x: a.x - 22 * d, rot: 0, sx: 1 }, 0.25, E.out), tween(b, { x: b.x + 22 * d, rot: 0, sx: 1 }, 0.25, E.out));
    stick(a, "bump", { db: 58, sec: 6 }); stick(b, "bump", { db: 58, sec: 6 });
    a.front(); b.front();
    yield* all(a.dizzy(1.1, true), b.dizzy(1.1, true));
    // 둘 다 벌러덩
    a.face = "ko"; b.face = "ko";
    yield* all(a.fall(-d), b.fall(d));
    yield* wait(0.8);
    yield* all(a.getUp(), b.getUp());
    if (depth < 1 && Math.random() < 0.5) yield* react(a, b, 1, butt);
    else { a.face = "happy"; b.face = "happy"; yield* all(a.laugh(0.9), b.laugh(0.9)); }
  });
  // 눈 찌르기: 눈알이 띠용 튀어나와 굴러가요
  mean("eyes", "눈 찌르기", function* eyes(a, b, depth) {
    const d = dirTo(a, b), g = geo();
    yield* approach(a, b, 30, 44);
    b.front(); a.face = "m9";
    a.pose = "back";
    yield* a.lean(-8 * d, 0.2);
    yield* wait(0.08);
    a.pose = "punch";
    yield* a.lean(8 * d, 0.05, E.in);
    pow(b.x, b.b + 50, "푹!", { big: true }); quake(2);
    b.face = "noeye"; b.sy = 1.08;
    const ev = [-9, 9].map((dx) => { const e = new Prop("eye", 2); e.x = b.x + dx; e.b = b.b + 34; e.z = 11; return e; });
    yield* wait(0.09);
    b.sy = 1;
    let rolled = 0;
    ev.forEach((e, i) => fork((function* () { yield* e.bounce(i ? rand(60, 150) : rand(-50, 50), rand(240, 330), 6); if (e.x < g.pond.x1 + 20) { if (PL()) PL().ring(e.x); yield* e.arc(g.pond.x1 + 24 + rand(0, 20), 6, 30, 0.4, 720); } rolled++; })()));
    fork((function* () { a.pose = ""; yield* a.lean(0, 0.12); a.front(); yield* a.laugh(1.8); })());
    // 내 눈! 더듬더듬
    b.pose = "act"; b.say(pick(["내 눈! 내 눈!", "앞이 안 보여!", "눈알 어디 갔어!"]), 1500);
    yield* b.jitter(0.5, 2);
    yield* b.walk(b.x - 16 * d, 22, { pose: "act" }); // 엉뚱한 쪽으로 몇 걸음
    pow(b.x, b.b + 74, "?", { ms: 500 });
    yield* until(() => rolled >= 2, 4);
    // 고양이가 있으면 눈알 하나를 앞발로 톡톡 굴려요
    const cat = PL().ents.find((e) => e.kind === "cat" && !e.held && !e.thrown && !e.script);
    if (cat && Math.random() < 0.7) {
      K.hold(cat);
      yield* A.move(cat, ev[1].x - 16, 70);
      for (let i = 0; i < 3; i++) { cat.frame = "walk1"; yield* wait(0.1); cat.frame = "stand"; pow(ev[1].x, 20, "톡", { ms: 300 }); yield* ev[1].arc(clamp(ev[1].x + 14, 30, g.W - 20), 6, 10, 0.22, 360); yield* A.move(cat, ev[1].x - 16, 80); }
      A.say(cat, "냐옹"); cat.face = "happy";
    }
    // 하나씩 주워서 쏙
    for (let i = 0; i < 2; i++) {
      const e = ev[i], s = b.x < e.x ? -1 : 1;
      yield* b.walk(e.x + s * 18, 42, { pose: "act" });
      b.look(e.x); b.pose = "crouch";
      yield* wait(0.25);
      pow(b.x, b.b + 70, i ? "여기도!" : "찾았다!", { ms: 500 });
      b.front(); b.pose = "hold";
      yield* e.arc(b.x + (i ? 9 : -9), b.b + 34, 24, 0.26, 360);
      e.remove();
      b.face = i === 0 ? "noR" : "cross";
      pow(b.x, b.b + 50, "쏙!", { ms: 400 });
      yield* b.squash(1.06, 0.94, 0.03);
      b.pose = "";
    }
    // 어? 반대로 꼈다
    b.say(pick(["어? 가운데만 보여", "눈이 몰렸는데…", "좌우가 바뀐 것 같아"]), 1300);
    yield* wait(0.9);
    yield* b.shakeHead(4);
    b.face = "blink"; yield* wait(0.15); b.face = "";
    yield* react(a, b, depth, eyes);
  }, { long: true });
  // 뿅망치: 종잇장처럼 납작해졌다가 슉슉 부풀어요
  mean("hammer", "뿅망치", function* hammer(a, b, depth) {
    const d = dirTo(a, b);
    yield* approach(a, b, 36, 46);
    b.front(); a.face = "m9"; a.pose = "raise";
    const h = new Prop("hammer", 2);
    h.pivot = "50% 100%"; h.x = a.x + 10 * d; h.b = a.b + 50; h.sx = 0; h.sy = 0; h.z = 11;
    yield* tween(h, { sx: 1, sy: 1 }, 0.16, E.back);
    b.face = "hit";
    const flat = [[1.2, 0.62], [1.42, 0.4], [1.62, 0.22]];
    for (let i = 0; i < 3; i++) {
      // 뒤로 한껏 젖혔다가
      yield* all(tween(h, { rot: -75 * d, x: a.x - 6 * d, b: a.b + 54 }, 0.2, E.out), a.lean(-10 * d, 0.2));
      yield* wait(0.07);
      // 내리쳐요
      const top = b.b + 60 * b.sy;
      yield* all(tween(h, { rot: 84 * d, x: b.x - 20 * d, b: top - 2 }, 0.07, E.in), a.lean(10 * d, 0.07));
      impact(b.x, top + 14, "뿅!", i === 2);
      b.sx = flat[i][0] + 0.12; b.sy = flat[i][1] - 0.08; b.face = "ko";
      h.b = b.b + 60 * b.sy - 2;
      yield* wait(0.09);
      yield* tween(b, { sx: flat[i][0], sy: flat[i][1] }, 0.12, E.back);
    }
    yield* all(tween(h, { sx: 0, sy: 0 }, 0.14), a.lean(0, 0.14));
    h.remove(); a.pose = "";
    fork((function* () { a.front(); yield* a.laugh(1.6); })());
    // 납작해진 채로 뒤뚱뒤뚱
    b.say(pick(["납작…", "세상이 높아 보여", "나 왜 이렇게 작아"]), 1300);
    yield* wait(1.2, (k, dt, t) => { b.x = clamp(b.x - d * 12 * dt, 24, geo().W - 24); b.rot = Math.sin(t * 11) * 6; });
    b.rot = 0;
    // 슉, 슉, 슉 바람을 넣어 원래대로
    const steps = [0.5, 0.38, 0.74, 0.6, 1.14, 1];
    for (let i = 0; i < steps.length; i++) { if (steps[i] > (steps[i - 1] || 0)) pow(b.x + 16, b.b + 20 + 50 * steps[i], "슉", { ms: 300 }); yield* tween(b, { sy: steps[i], sx: 1 + (1 - Math.min(1, steps[i])) * 0.5 }, 0.11, E.out); }
    pow(b.x, b.b + 76, "뽕!"); b.face = "blink";
    yield* b.shakeHead(4);
    yield* react(a, b, depth, hammer);
  });
  // 번쩍 들어 던지기: 벽에 부딪혀 와장창 흩어졌다가 스스로 모여요
  mean("throw", "들어서 던지기", function* toss(a, b, depth) {
    const d = dirTo(a, b), g = geo();
    yield* approach(a, b, 26, 50);
    b.front(); a.pose = "crouch";
    yield* wait(0.25);
    b.face = "hit"; b.say(pick(["어어?", "뭐 하는 거야!", "내려놔!"]), 1000);
    // 번쩍
    a.front(); a.pose = "hold";
    b.pivot = "mid"; b.z = 10;
    yield* tween(b, { x: a.x, y: 47, rot: 90 * d }, 0.3, E.back);
    // 벽 쪽으로 몇 걸음 (위에서 버둥버둥)
    const td = a.x < g.W * 0.55 ? 1 : -1;
    let carry = true;
    fork((function* () { let t = 0; while (carry) { t += yield; b.x = a.x; b.rot = 90 * d + Math.sin(t * 20) * 5; b.frame = Math.floor(t * 9) % 2 ? 1 : 2; b.face = Math.floor(t * 5) % 2 ? "hit" : "cry1"; } })());
    yield* a.walk(a.x + td * 22, 34);
    // 영차: 뒤로 젖혔다가
    a.look(a.x + td * 50);
    yield* a.lean(-15 * td, 0.24);
    pow(a.x, a.b + 96, "영차!", { ms: 500 });
    yield* wait(0.08);
    carry = false; a.pose = "punch";
    fork((function* () { yield* a.lean(14 * td, 0.07, E.in); yield* wait(0.5); yield* a.lean(0, 0.15); a.pose = "act"; a.front(); a.say(pick(["손 좀 털고", "가볍네", "나이스 샷"]), 1100); yield* wait(1.2); a.pose = ""; a.look(b); })());
    b.frame = 0;
    const res = yield* b.launch(660 * td, 200, { brk: true });
    if (res === "land") { yield* b.dizzy(0.9); yield* b.getUp(); }
    yield* react(a, b, depth, toss);
  }, { long: true });
  // 머리 뽑기: 뽁! 머리로 공놀이를 하다가 거꾸로 얹어 줘요
  mean("head", "머리 뽑기", function* headpull(a, b, depth) {
    const d = dirTo(a, b);
    yield* approach(a, b, 28, 46);
    b.front(); a.pose = "raise"; a.face = "m9";
    yield* wait(0.2);
    const head = headOff(b);
    head.face = "hit";
    const hb = head.b;
    pow(b.x, b.b + 84, "쭈욱…", { ms: 700 });
    // 쭈욱 당기면 몸이 따라 늘어나요
    yield* wait(0.6, (k, dt, t) => { head.b = hb + 12 * E.out(k) + Math.sin(t * 40) * 0.8; b.sy = 1 + 0.16 * E.out(k); });
    impact(b.x, b.b + 70, "뽁!");
    fork(tween(b, { sy: 1 }, 0.3, E.el));
    a.front(); a.pose = "hold";
    yield* head.jump(a.x, a.b + 82, 22, 0.26);
    // 몸은 허둥지둥
    let done = false;
    fork(panic(b, () => done));
    head.say(pick(["내 몸 어디 가!", "어어 높다", "돌려줘!"]), 1200);
    // 머리로 통, 통, 공놀이
    const top = head.b;
    for (let i = 0; i < 2; i++) {
      head.face = "dz" + (1 + i);
      a.pose = "act";
      yield* tween(head, { b: head.rest(), rot: head.rot + 180 * d }, 0.2, E.in);
      head.sy = 0.72; head.sx = 1.2; pow(head.x, 20, "통!", { ms: 320 }); dust(head.x, 12, 3);
      yield* wait(0.05);
      head.sy = 1; head.sx = 1; a.pose = "hold";
      yield* tween(head, { b: top, rot: head.rot + 180 * d }, 0.22, E.out);
    }
    // 발로 뻥 차올렸다 받아요
    a.look(a.x + d); a.pose = "kick"; head.face = "ko";
    yield* tween(head, { b: a.b + 20, x: a.x + 14 * d }, 0.14, E.in);
    pow(head.x, 40, "뻥!");
    a.pose = "";
    yield* wait(0.5, (k) => { head.b = a.b + 20 + Math.sin(k * Math.PI) * 80 + (top - a.b - 20) * k; head.x = a.x + 14 * d * (1 - k); head.rot += 14; });
    a.front(); a.pose = "hold"; head.rot = 0; head.face = "dz3";
    head.say(pick(["어지러워… 그만…", "세상이 돌아", "토할 것 같아"]), 1300);
    yield* wait(0.9);
    // 이제 돌려줄게: 몸이 더듬더듬 와요
    done = true;
    yield* wait(0.05);
    yield* b.walk(a.x + 32 * d, 60, { pose: "act" });
    b.front(); b.pose = "";
    const t = head.at(b.x, b.b);
    head.dir = "up"; // 거꾸로 얹어 버려요
    yield* head.jump(t.x, t.b, 28, 0.34);
    pow(b.x, b.b + 78, "턱", { ms: 400 });
    fork((function* () { a.pose = ""; a.look(b); yield* a.laugh(1.4); })());
    head.say(pick(["앞이 안 보여!", "왜 깜깜해?", "뒤통수가 앞이야!"]), 1200);
    for (let i = 0; i < 4; i++) { b.pose = i % 2 ? "raise" : "clutch"; yield* wait(0.2); }
    // 휙 돌려서 제자리로
    yield* tween(head, { sx: 0.1 }, 0.09); head.dir = "down"; head.face = "ko"; yield* tween(head, { sx: 1 }, 0.09);
    pow(b.x, b.b + 78, "휙", { ms: 300 });
    headOn(b, head);
    b.pose = ""; b.face = "blink";
    yield* b.shakeHead(4);
    yield* react(a, b, depth, headpull);
  }, { long: true });
  // 뒤에서 왁!: 하늘까지 뛰어올랐다가 다리가 풀려요
  mean("scare", "뒤에서 놀래키기", function* scare(a, b, depth) {
    const d = dirTo(a, b);
    b.front(); b.face = ""; a.face = "m9";
    // 살금살금 뒤로 돌아가요
    yield* a.walk(b.x + 30 * d, 26, { sneak: true, pose: "crouch" });
    a.look(b);
    yield* wait(0.3);
    a.pose = "raise"; a.say("왁!!", 700);
    pow(a.x, a.b + 84, "왁!!", { big: true });
    fork(a.hop(10, 0.2));
    // 깜짝! 머리카락이 쭈뼛, 하늘로 발사
    b.face = "hit"; b.sy = 1.18; b.sx = 0.9;
    yield* wait(0.1);
    b.sy = 1; b.sx = 1;
    yield* b.launch(0, 800, { noLand: true, pose: "raise" });
    yield* b.upright();
    b.front(); b.face = "hit"; b.pose = "";
    dust(b.x, 12, 6);
    yield* b.squash(1.2, 0.76, 0.06);
    // 다리가 후들후들 풀려서 털썩
    yield* b.jitter(0.7, 1.5, 30);
    b.face = "ko";
    fork((function* () { a.pose = ""; yield* a.laugh(1.5); })());
    yield* b.fall(-d);
    yield* wait(0.7);
    yield* b.getUp();
    yield* react(a, b, depth, scare);
  });
  // 연못으로 밀기: 끝에서 버티다가 손가락 하나에 풍덩
  mean("pond", "연못에 빠뜨리기", function* pondpush(a, b, depth) {
    const g = geo(), edge = g.pond.x1 + 16;
    // 연못 반대쪽으로 돌아가서
    b.front();
    yield* a.walk(b.x + 30, 60);
    a.look(b); a.face = "m9"; a.pose = "back";
    yield* a.lean(10, 0.2);
    a.pose = "punch";
    yield* a.lean(-10, 0.06, E.in);
    impact(b.x + 10, b.b + 40, "밀어!", false);
    // 주르륵 미끄러져요 (뒤로 젖힌 채 발로 버팀)
    b.look(g.W); b.face = "hit"; b.pose = "raise";
    const x0 = b.x;
    yield* wait(0.55, (k, dt) => { b.x = x0 + (edge - x0) * E.out(k); b.rot = 14 * (1 - k); if (Math.random() < dt * 30) dust(b.x - 10, 12, 1); });
    fork((function* () { a.pose = ""; yield* a.lean(0, 0.1); yield* a.walk(edge + 30, 70); a.look(b); })());
    // 끝에서 아슬아슬 버둥버둥
    b.say(pick(["어어어어어", "안 돼 안 돼", "빠진다!"]), 1100);
    yield* wait(1.0, (k, dt, t) => { b.rot = -10 - Math.sin(t * 9) * 9; b.pose = Math.floor(t * 9) % 2 ? "wave1" : "wave2"; });
    // 휴… 하는 순간 손가락으로 톡
    b.rot = 0; b.pose = ""; b.face = "blink";
    yield* wait(0.35);
    a.pose = "act";
    pow(a.x - 16, a.b + 40, "톡", { ms: 400 });
    b.face = "hit";
    yield* wait(0.1);
    yield* tween(b, { rot: -50 }, 0.22, E.in);
    { const x0 = b.x, x1 = g.pond.x1 - 20; b.setPivot("mid"); const y0 = b.y, r0 = b.rot; yield* wait(0.3, (k) => { b.x = x0 + (x1 - x0) * k; b.y = y0 + Math.sin(k * Math.PI) * 14 - 22 * k * k; b.rot = r0 - 130 * k; }); }
    fork((function* () { a.pose = ""; a.front(); yield* a.laugh(2.2); })());
    yield* splashIn(b);
    yield* react(a, b, depth, pondpush);
  }, { long: true });
  // 가위바위보 딱밤: 진 사람 이마에 딱!
  mean("flick", "가위바위보 딱밤", function* flick(a, b, depth) {
    // 누가 이길지는 몰라요
    yield* all(approach(a, b, 24, 46), wait(0.1));
    b.look(a);
    for (const w of ["가위", "바위", "보!"]) { pow((a.x + b.x) / 2, a.b + 80, w, { ms: 360, rot: 0 }); a.pose = "act"; b.pose = "act"; yield* all(tween(a, { y: 5 }, 0.09, E.out), tween(b, { y: 5 }, 0.09, E.out)); yield* all(tween(a, { y: 0 }, 0.09, E.in), tween(b, { y: 0 }, 0.09, E.in)); yield* wait(0.14); }
    const win = Math.random() < 0.5 ? a : b, lose = win === a ? b : a, d = dirTo(win, lose);
    win.pose = "raise"; win.face = "happy"; lose.face = "hit"; lose.pose = "";
    win.say(pick(["이겼다!", "아싸!", "이마 대!"]), 1000);
    yield* win.hop(8, 0.24);
    // 진 쪽은 눈을 질끈, 덜덜
    lose.face = "blink"; lose.say("살살…", 900);
    fork(lose.jitter(1.1, 1, 30));
    // 손가락에 힘을 모으는 긴 준비
    win.pose = "back"; win.face = "m9";
    yield* win.lean(-10 * d, 0.5);
    lose.face = "hit"; // 실눈
    yield* wait(0.25);
    lose.face = "blink";
    win.pose = "punch";
    yield* win.lean(8 * d, 0.05, E.in);
    impact(lose.x - 8 * d, lose.b + 46, "딱!!");
    lose.face = "ko"; lose.rot = 20 * d;
    yield* wait(0.1);
    yield* all(tween(lose, { rot: 0, x: lose.x + 12 * d }, 0.3, E.el), (function* () { yield* wait(0.15); win.pose = ""; yield* win.lean(0, 0.12); })());
    stick(lose, "bump", { db: 44, dx: -4 * d, sec: 6, scale: 1.5 });
    yield* react(win, lose, depth, flick);
  });
  // 업어치기 한판
  mean("judo", "업어치기", function* judo(a, b, depth) {
    const d = dirTo(a, b);
    yield* approach(a, b, 22, 56);
    b.front(); a.face = "m16"; a.pose = "act";
    b.face = "hit";
    yield* wait(0.18);
    // 등을 돌려 받치고
    a.look(a.x - d); a.pose = "crouch";
    yield* wait(0.16);
    a.pose = "hold";
    pow(a.x, a.b + 90, "이얍!", { ms: 500 });
    // 어깨 위로 크게 넘겨요
    b.pivot = "mid"; b.z = 10;
    const ax = a.x, x0 = b.x;
    yield* wait(0.34, (k) => { const th = Math.PI * E.in(k); b.x = ax + Math.cos(th) * (x0 - ax); b.y = Math.sin(th) * 58 - 11 * k; b.rot = -d * 270 * k; });
    b.x = ax - (x0 - ax); b.y = -11; b.rot = -270 * d; b.face = "ko";
    impact(b.x, 34, "쿵!!"); dust(b.x, 12, 9); quake(4);
    b.rot = 90 * d;
    yield* tween(b, { sx: 1.12 }, 0.05); yield* tween(b, { sx: 1 }, 0.2, E.el);
    // 한판!
    a.front(); a.pose = "raise"; a.face = "happy"; a.say("한판!", 1000);
    yield* a.hop(8, 0.24);
    a.pose = "";
    yield* b.dizzy(1.1);
    yield* b.getUp();
    yield* react(a, b, depth, judo);
  });
  // 똥침
  mean("poke", "똥침", function* poke(a, b, depth) {
    const d = dirTo(a, b);
    b.front(); a.face = "m9";
    yield* a.walk(b.x - 26 * d, 26, { sneak: true, pose: "crouch" });
    a.look(b); a.pose = "act";
    // 두 손을 모으고 낮게 준비
    yield* all(a.lean(-8 * d, 0.3), tween(a, { sy: 0.9 }, 0.3));
    yield* wait(0.15);
    a.pose = "punch"; a.sy = 1;
    yield* a.lean(10 * d, 0.05, E.in);
    impact(b.x - 6 * d, b.b + 18, "푹!");
    b.face = "hit"; b.sy = 1.2; b.sx = 0.88;
    yield* wait(0.1);
    b.sy = 1; b.sx = 1;
    fork((function* () { a.pose = ""; yield* a.lean(0, 0.1); a.front(); yield* a.laugh(1.8); })());
    // 로켓처럼 솟았다가
    yield* b.launch(30 * d, 660, { noLand: true, pose: "raise" });
    yield* b.upright();
    b.front();
    // 엉덩이를 잡고 팔짝팔짝
    b.say(pick(["아야야야야!", "누구야!!", "엉덩이에 불났어"]), 1300);
    for (let i = 0; i < 4; i++) { b.pose = "crouch"; b.face = i % 2 ? "cry1" : "cry2"; const x0 = b.x, tx = clamp(x0 + (i % 2 ? -1 : 1) * 16, 30, geo().W - 30); yield* wait(0.24, (k) => { b.x = x0 + (tx - x0) * k; b.y = Math.sin(k * Math.PI) * 14; }); b.y = 0; dust(b.x, 12, 2); }
    b.pose = "";
    yield* react(a, b, depth, poke);
  });
  // 볼 꼬집기: 쭈우욱 늘어났다가 철썩
  mean("pinch", "볼 꼬집기", function* pinch(a, b, depth) {
    const d = dirTo(a, b);
    yield* approach(a, b, 30, 46);
    b.front(); a.face = "m9"; a.pose = "punch";
    b.face = "hit";
    yield* wait(0.15);
    pow(b.x - 14 * d, b.b + 48, "꼬집", { ms: 500 });
    // 뒤로 물러나며 볼을 쭈욱
    const ax = a.x, bx = b.x;
    yield* wait(0.7, (k, dt, t) => { const q = E.out(k); a.x = ax - 14 * d * q; b.sx = 1 + 0.42 * q; b.x = bx - 11 * d * q; b.face = Math.floor(t * 8) % 2 ? "cry1" : "hit"; });
    b.say("아아아 늘어나!", 900);
    yield* wait(0.35, (k, dt, t) => { b.sx = 1.42 + Math.sin(t * 40) * 0.03; });
    // 놓으면 철썩
    a.pose = "";
    impact(b.x, b.b + 44, "철썩!", false);
    yield* all(tween(b, { sx: 1, x: bx }, 0.4, E.el), tween(a, { x: ax }, 0.2));
    b.face = "m18";
    yield* b.jitter(0.3, 1.5);
    yield* react(a, b, depth, pinch);
  });
  // 눈싸움 (눈 오는 날만)
  mean("snow", "눈싸움", function* snow(a, b, depth) {
    const d = dirTo(a, b);
    a.look(b); a.pose = "crouch";
    yield* wait(0.4); // 눈을 뭉쳐요
    const s = new Prop("snow", 2); s.x = a.x + 10 * d; s.b = a.b + 10; s.z = 11;
    a.pose = "back";
    yield* all(a.lean(-12 * d, 0.22), tween(s, { x: a.x - 12 * d, b: a.b + 44 }, 0.22));
    a.pose = "punch";
    fork((function* () { yield* a.lean(12 * d, 0.06, E.in); yield* wait(0.3); a.pose = ""; yield* a.lean(0, 0.12); })());
    b.front();
    yield* s.arc(b.x, b.b + 36, 26, 0.3, 720 * d);
    s.remove();
    impact(b.x, b.b + 46, "퍽!", false);
    puff(b.x, b.b + 40, 10, { c: "#ffffff", s: 3, sp: 30, up: 20 });
    stick(b, "snow", { db: 30, sec: 2.2, scale: 4 });
    b.face = "ko"; b.rot = 10 * d;
    yield* tween(b, { rot: 0 }, 0.3, E.el);
    yield* wait(0.6);
    yield* b.shakeHead(6);
    yield* react(a, b, depth, snow);
  }, { ok: (c) => !!c.env.snowy, w: 4 });

  // ============================================================
  // 사이좋은 장난 (사람 → 사람)
  // ============================================================
  const nice = (id, name, fn, o) => Play.def({ id: "pp:" + id, name, w: (o && o.w) || 1, pick: two, n: 2, run: function* (v) { v.a.take(); v.b.take(); yield* fn(v.a, v.b); } });
  // 간지럽히기
  nice("tickle", "간지럽히기", function* (a, b) {
    const d = dirTo(a, b);
    b.front();
    yield* a.walk(b.x - 24 * d, 30, { sneak: true });
    a.look(b); a.face = "m9";
    b.say(pick(["아하하하 그만!", "간지러워 ㅋㅋㅋ", "항복 항복!"]), 1600);
    yield* wait(1.8, (k, dt, t) => { a.pose = Math.floor(t * 12) % 2 ? "act" : "punch"; b.face = "happy"; b.rot = Math.sin(t * 22) * 8; b.y = Math.abs(Math.sin(t * 17)) * 4; b.pose = Math.floor(t * 7) % 2 ? "raise" : "wave1"; });
    b.rot = 0; b.y = 0; b.pose = ""; a.pose = "";
    // 웃다가 데굴데굴
    yield* b.fall(d);
    yield* wait(0.9, (k, dt, t) => { b.rot = 90 * d + Math.sin(t * 16) * 8; b.face = "happy"; });
    yield* all(b.getUp(), a.laugh(0.6));
  });
  // 볼 뽀뽀: 받은 쪽이 녹아내려요
  nice("kiss", "볼 뽀뽀", function* (a, b) {
    const d = dirTo(a, b);
    yield* approach(a, b, 26, 40);
    b.front(); a.face = "m6";
    yield* wait(0.3);
    yield* all(a.lean(14 * d, 0.2), tween(a, { x: a.x + 5 * d }, 0.2));
    pow(b.x - 12 * d, b.b + 52, "쪽!", { ms: 600 });
    if (window.HSD && HSD.burst) { const r = b.el.getBoundingClientRect(); HSD.burst(r.left + r.width / 2, r.top + 16, 6, "heart"); }
    b.face = "hit";
    yield* wait(0.25);
    yield* all(a.lean(0, 0.15), tween(a, { x: a.x - 5 * d }, 0.15));
    a.front(); a.face = "happy";
    // 얼굴이 빨개지더니 흐물흐물 녹아요
    b.face = "m7";
    yield* b.jitter(0.5, 1, 26);
    yield* tween(b, { sy: 0.5, sx: 1.3 }, 0.6, E.io);
    b.say(pick(["녹는다…", "심장아 나대지 마", "한 번 더…"]), 1300);
    yield* wait(0.9);
    yield* tween(b, { sy: 1, sx: 1 }, 0.4, E.el);
    yield* all(a.hop(6, 0.22), b.hop(10, 0.26));
  }, { w: 2 });
  // 어부바: 몇 걸음 가다가 납작
  nice("piggy", "어부바", function* (a, b) {
    const d = dirTo(a, b), g = geo();
    yield* approach(a, b, 34, 50);
    b.look(b.x + d); b.pose = "crouch";
    a.say(pick(["업어 줘!", "어부바~"]), 900);
    yield* wait(0.3);
    // 폴짝 올라타요
    a.z = 10;
    const ax = a.x;
    yield* wait(0.3, (k) => { a.x = ax + (b.x - 6 * d - ax) * k; a.y = Math.sin(k * Math.PI) * 26 + 20 * k; });
    b.pose = ""; b.sy = 0.9; b.face = "hit";
    yield* tween(b, { sy: 0.96 }, 0.2, E.el);
    a.face = "happy"; a.pose = "raise";
    let ride = true;
    fork((function* () { let t = 0; while (ride) { t += yield; a.x = b.x - 6 * b.fwd(); a.flip = b.flip; a.dir = "side"; a.y = 20 + Math.abs(Math.sin(t * 9)) * 2; } })());
    // 낑낑 몇 걸음
    b.face = "m5";
    yield* b.walk(clamp(b.x + d * 46, g.pond.x1 + 30, g.W - 30), 24);
    b.say(pick(["무, 무거워…", "다리가 후들…"]), 1000);
    yield* b.jitter(0.6, 1.5, 30);
    // 풀썩
    ride = false;
    b.face = "ko";
    yield* all(tween(b, { sy: 0.3, sx: 1.4 }, 0.16, E.in), tween(a, { y: 0 }, 0.16, E.in));
    impact(b.x, 30, "풀썩", false); dust(b.x, 12, 8);
    a.pose = ""; a.front();
    { const x0 = a.x, x1 = clamp(b.x - 34 * d, 24, g.W - 24); yield* wait(0.26, (k) => { a.x = x0 + (x1 - x0) * k; a.y = Math.sin(k * Math.PI) * 12; }); a.y = 0; dust(a.x, 12, 2); }
    yield* wait(0.5);
    yield* tween(b, { sy: 1, sx: 1 }, 0.4, E.el);
    b.front();
    yield* all(a.laugh(0.8), b.dizzy(0.8, true));
  });
  // 쓰담쓰담
  nice("pat", "쓰담쓰담", function* (a, b) {
    yield* approach(a, b, 30, 40);
    b.front(); a.face = "happy";
    for (let i = 0; i < 6; i++) { a.pose = i % 2 ? "" : "raise"; b.sy = i % 2 ? 1 : 0.95; b.face = "happy"; yield* wait(0.16); }
    a.pose = ""; b.sy = 1;
    if (window.HSD && HSD.burst) { const r = b.el.getBoundingClientRect(); HSD.burst(r.left + r.width / 2, r.top + 10, 4, "heart"); }
    yield* b.hop(7, 0.24);
  });

  // ============================================================
  // 혼자 하는 동작 (다른 한 사람은 구경해요)
  // ============================================================
  const solo = (id, name, fn, o) => Play.def({ id: "solo:" + id, name, w: (o && o.w) || 1, pick: one, n: 2, run: function* (v) { v.a.take(); v.b.take(); v.b.look(v.a); yield* fn(v.a, v.b); } });
  const clap = function* (b, sec) { b.face = "happy"; yield* wait(sec, (k, dt, t) => { b.pose = Math.floor(t * 8) % 2 ? "act" : ""; b.front(); }); b.pose = ""; };
  // 옆돌기
  solo("cartwheel", "옆돌기", function* (a, b) {
    const g = geo(), d = a.x < g.W * 0.6 ? 1 : -1, x0 = a.x, x1 = clamp(x0 + d * 80, g.pond.x1 + 30, g.W - 30);
    a.front(); a.pose = "raise"; a.face = "happy";
    yield* a.squash(1.08, 0.9, 0.08);
    a.pivot = "mid";
    for (let i = 0; i < 2; i++) { const s = a.x, e = x0 + ((x1 - x0) * (i + 1)) / 2; yield* wait(0.5, (k) => { a.x = s + (e - s) * k; a.rot = d * 360 * (i + k); a.y = Math.abs(Math.sin(k * Math.PI * 2)) * 5; }); }
    a.rot = 0; a.pivot = "feet"; a.y = 0;
    yield* a.squash(1.1, 0.88, 0.04);
    a.say("짠!", 800);
    yield* all(wait(0.8), clap(b, 0.8));
    a.pose = "";
  });
  // 물구나무: 버티다가 와르르
  solo("handstand", "물구나무", function* (a, b) {
    a.front(); a.pose = "raise"; a.face = "m15";
    yield* a.squash(1.08, 0.88, 0.1);
    a.pivot = "mid";
    yield* wait(0.4, (k) => { a.rot = 180 * E.back(k); a.y = 10 * k; });
    a.say("봐 봐!", 800);
    fork(clap(b, 1.2));
    // 점점 크게 흔들리다가
    yield* wait(1.6, (k, dt, t) => { a.rot = 180 + Math.sin(t * 6) * (3 + 16 * k); a.face = k > 0.6 ? "hit" : "m15"; });
    const d = pick([-1, 1]);
    yield* tween(a, { rot: 180 + 90 * d, y: -11 }, 0.22, E.in);
    a.rot = 90 * d * -1 + 0; a.face = "ko";
    impact(a.x + 20 * d, 34, "쿠당", false); dust(a.x, 12, 7);
    b.look(a); fork(b.laugh(1.2));
    yield* a.dizzy(1.0);
    yield* a.getUp();
  });
  // 공중제비: 가끔은 머리로 떨어져요
  solo("flip", "공중제비", function* (a, b) {
    a.front(); a.face = "m15";
    yield* tween(a, { sy: 0.8, sx: 1.14 }, 0.22, E.out); // 웅크려 힘을 모으고
    a.sx = 0.94; a.sy = 1.1; a.pose = "raise"; a.pivot = "mid";
    const fail = Math.random() < 0.4;
    yield* wait(0.62, (k) => { a.y = Math.sin(k * Math.PI) * 52; a.rot = -(fail ? 540 : 360) * E.io(k); a.sx = 1; a.sy = 1; });
    if (!fail) {
      a.rot = 0; a.pivot = "feet"; a.y = 0; a.face = "happy";
      yield* a.squash(1.18, 0.8, 0.06);
      a.say("완벽 착지!", 900);
      yield* all(wait(0.9), clap(b, 0.9));
      a.pose = "";
    } else {
      a.rot = 180; a.pose = ""; a.face = "ko";
      yield* tween(a, { y: 10 }, 0.05, E.in);
      impact(a.x, 34, "쿵!"); dust(a.x, 12, 7);
      b.face = "hit";
      yield* wait(0.7, (k, dt, t) => { a.rot = 180 + Math.sin(t * 16) * 5; a.frame = Math.floor(t * 8) % 2 ? 1 : 2; });
      a.frame = 0;
      yield* tween(a, { rot: 270, y: -11 }, 0.25, E.in);
      a.rot = -90; dust(a.x, 12, 5);
      stick(a, "bump", { db: 58, sec: 6 });
      fork(b.laugh(1.2));
      yield* a.dizzy(1.0);
      yield* a.getUp();
    }
  }, { w: 2 });
  // 문워크
  solo("moon", "문워크", function* (a, b) {
    const g = geo(), d = a.x < g.W * 0.6 ? 1 : -1;
    a.face = "m9"; a.look(a.x - d);
    a.say("뒤로 간다~", 900);
    yield* a.walk(clamp(a.x + d * 60, g.pond.x1 + 30, g.W - 30), 26, { back: true });
    // 빙글 돌고 포즈
    for (let i = 0; i < 6; i++) { a.dir = ["down", "side", "up", "side"][i % 4]; a.flip = i % 4 === 3; yield* wait(0.07); }
    a.front(); a.pose = "wave1"; a.face = "happy";
    pow(a.x, a.b + 84, "뽀잉", { ms: 500 });
    yield* all(a.lean(-8 * d, 0.2), clap(b, 0.9));
    a.rot = 0; a.pose = "";
  });
  // 재채기: 에… 에… 취!!
  solo("sneeze", "재채기", function* (a, b) {
    const d = a.x < b.x ? 1 : -1;
    a.look(b); a.face = "m18";
    for (let i = 0; i < 2; i++) { pow(a.x, a.b + 84, "에…", { ms: 400 }); yield* a.lean(-(8 + i * 8) * d, 0.3, E.out); yield* wait(0.12); yield* a.lean(-3 * d, 0.1); }
    yield* a.lean(-22 * d, 0.35, E.out);
    a.face = "ko";
    yield* wait(0.1);
    yield* a.lean(18 * d, 0.06, E.in);
    impact(a.x + 18 * d, a.b + 44, "취!!");
    if (PL()) PL().drops(a.x + 16 * d, a.b + 44, 10, 26, "#dff3ff");
    // 재채기 바람에 뒤로 주르륵, 앞사람은 침 범벅
    const x0 = a.x;
    yield* all(wait(0.3, (k) => { a.x = x0 - 16 * d * E.out(k); a.rot = 18 * d * (1 - k); }), (function* () { b.front(); b.face = "hit"; yield* b.squash(0.9, 1.06, 0.05); b.face = "m17"; })());
    a.rot = 0; a.front(); a.face = "m14"; a.say("미안…", 800);
    yield* b.shakeHead(4);
    yield* wait(0.4);
  });
  // 빙글빙글 돌다가 어질
  solo("spin", "빙글빙글", function* (a, b) {
    a.face = "happy"; a.pose = "raise";
    let gap = 0.12;
    for (let i = 0; i < 18; i++) { a.dir = ["down", "side", "up", "side"][i % 4]; a.flip = i % 4 === 3; gap = Math.max(0.04, gap - 0.006); yield* wait(gap); }
    a.front(); a.pose = "";
    yield* a.dizzy(1.2, true);
    a.face = "ko";
    b.look(a); fork(b.laugh(1.0));
    yield* a.fall(pick([-1, 1]));
    yield* wait(0.6);
    yield* a.getUp();
  });
  // 걷다가 꽈당
  solo("trip", "꽈당", function* (a, b) {
    const g = geo(), d = a.x < g.W * 0.6 ? 1 : -1;
    a.face = "happy"; pow(a.x, a.b + 84, "♪", { ms: 600 });
    yield* a.walk(clamp(a.x + d * 40, g.pond.x1 + 30, g.W - 40), 46);
    // 발이 걸렸다!
    a.face = "hit"; a.pose = "raise";
    pow(a.x, 24, "앗", { ms: 300 });
    const x0 = a.x;
    yield* wait(0.28, (k) => { a.rot = 90 * d * E.in(k); a.x = x0 + 12 * d * k; });
    impact(a.x + 24 * d, 30, "철퍼덕"); dust(a.x + 24 * d, 12, 8);
    // 얼굴로 주르륵
    yield* wait(0.4, (k, dt) => { a.x = clamp(a.x + d * 50 * (1 - k) * dt, 24, g.W - 24); if (Math.random() < dt * 20) dust(a.x + 28 * d, 12, 1); });
    a.face = "ko"; a.pose = "";
    b.look(a); b.face = "hit";
    yield* wait(0.7);
    stick(a, "bump", { db: 58, sec: 6 });
    yield* a.getUp();
    a.face = "m17"; a.say(pick(["아무도 못 봤지?", "…돌이 있었어"]), 1200);
    yield* b.laugh(1.0);
  }, { w: 2 });
  // 혼자 권투: 쉭 쉭 하다가 제 발에 걸려요
  solo("box", "혼자 권투", function* (a, b) {
    const d = a.x < b.x ? -1 : 1;
    a.look(a.x + d); a.face = "m16";
    for (let i = 0; i < 4; i++) {
      a.pose = "back"; yield* a.lean(-6 * d, 0.09);
      a.pose = "punch"; yield* a.lean(8 * d, 0.05, E.in);
      pow(a.x + 26 * d, a.b + 40, "쉭", { ms: 260 });
      yield* wait(0.1);
    }
    a.pose = "kick";
    yield* a.lean(-16 * d, 0.08);
    pow(a.x + 26 * d, a.b + 22, "얍!", { ms: 400 });
    yield* wait(0.25);
    // 너무 세게 차서 빙글 돌아 넘어져요
    a.pivot = "mid";
    yield* wait(0.4, (k) => { a.rot = -16 * d - 344 * d * E.io(k); a.y = Math.sin(k * Math.PI) * 14; });
    a.pivot = "feet"; a.rot = 0; a.y = 0; a.pose = ""; a.face = "ko";
    yield* a.fall(-d);
    b.look(a); yield* b.laugh(1.0);
    yield* a.getUp();
  });
  // 낮잠 자는 얼굴에 낙서
  solo("nap", "낮잠과 낙서", function* (a, b) {
    const d = a.x < b.x ? -1 : 1;
    a.front(); a.face = "m11";
    pow(a.x, a.b + 84, "하암…", { ms: 700 });
    yield* tween(a, { sy: 1.06 }, 0.4); yield* tween(a, { sy: 1 }, 0.2);
    a.face = "blink";
    yield* tween(a, { rot: 90 * d }, 0.5, E.io);
    dust(a.x + 24 * d, 12, 3);
    fork((function* () { for (let i = 0; i < 5; i++) { pow(a.x + 30 * d, 40 + i * 2, "z", { ms: 800, rot: 0 }); yield* wait(0.6); } })());
    yield* wait(0.8);
    // 살금살금 다가와서 쓱쓱
    b.face = "m9";
    yield* b.walk(a.x + 40 * d, 26, { sneak: true });
    b.pose = "crouch"; b.look(a);
    for (let i = 0; i < 4; i++) { pow(a.x + 34 * d, 30, pick(["쓱", "쓱쓱"]), { ms: 300 }); b.pose = i % 2 ? "crouch" : "act"; yield* wait(0.25); }
    stick(a, "scratch", { db: 34, sec: 6, scale: 3 });
    b.pose = ""; yield* b.laugh(0.8);
    // 벌떡! 누가 그랬어
    a.face = "hit";
    yield* a.getUp();
    yield* a.angry(0.9);
    a.say(pick(["내 얼굴에 뭐 했어!", "지워 줘!!"]), 1100);
    b.face = "hit";
    yield* all(b.walk(clamp(b.x + 50 * d, 30, geo().W - 30), 140, { pose: "raise" }), (function* () { yield* wait(0.2); yield* a.walk(a.x + 30 * d, 120, { pose: "punch" }); })());
  });
})();
