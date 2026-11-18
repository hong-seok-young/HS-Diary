// ============================================================
// 우리 농장: 규칙
// 실제 시간으로 자라요. 물을 주면 그 칸은 하루(24시간) 촉촉하고, 촉촉한 동안만 자라요.
// 마른 채로 하루가 더 지나면 시들기 시작하고, 사흘을 넘기면 죽어요.
// 두 사람은 각자 자기 기록장(doc)만 고치고, 농장은 두 기록장을 합쳐서 그려요.
// 화면을 몰라서 노드에서도 돌아가요.
// ============================================================
(function (root) {
  "use strict";

  const F = root.FCrops;
  const COLS = 10, ROWS = 12, FIELD0 = 3;
  const H = 3600000;
  const WET = 24, WILT = 24, DEAD = 72;

  // ---------- 시간 ----------
  function pad(n) { return String(n).padStart(2, "0"); }
  function dayKey(t) { const d = new Date(t - 6 * H); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
  function dayStart(t) { const d = new Date(t - 6 * H); d.setHours(6, 0, 0, 0); return d.getTime(); }
  function seasonOf(t) { const m = new Date(t).getMonth(); return m >= 2 && m <= 4 ? 0 : m >= 5 && m <= 7 ? 1 : m >= 8 && m <= 10 ? 2 : 3; }
  function seasonEnd(t) {
    const d = new Date(t); const m = d.getMonth();
    const endM = [4, 4, 4, 7, 7, 7, 10, 10, 10, 1, 1, 1][(m + 10) % 12];
    let y = d.getFullYear();
    if (m === 11) y++;
    return new Date(y, endM + 1, 0, 23, 59).getTime();
  }
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  // ---------- 땅 ----------
  function key(c, r) { return c + "_" + r; }
  function parseKey(k) { const [c, r] = k.split("_").map(Number); return [c, r]; }
  function isField(k) { const [, r] = parseKey(k); return r >= FIELD0; }
  function openRows(W) { return F.LAND[Math.min(F.LAND.length - 1, W.up.land || 0)].rows; }
  function isOpen(W, k) { const [, r] = parseKey(k); return r >= FIELD0 && r < FIELD0 + openRows(W); }
  // 처음 농장에 있던 풀과 돌
  function debrisAt(k) {
    if (!isField(k)) return "";
    const h = hash("deb" + k) % 100;
    return h < 26 ? "weed" : h < 36 ? "stone" : "";
  }

  // ---------- 기록장 ----------
  function emptyDoc() {
    return {
      v: 1, tp: 0, spend: 0, earn: {}, inv: {}, xp: 0,
      till: {}, plant: {}, fert: {}, wat: {}, harv: {}, clr: {}, deb: {}, obj: {},
      up: {}, hens: {}, henFed: {}, henPet: {}, eggs: {}, dogBowl: {}, dogPet: {},
      rain: [], shipped: {}, st: {}, seen: {}, sel: "hoe", seed: "", fertSel: "", objSel: "", water: 30, pos: [], lastDay: "", lastAct: 0,
    };
  }
  function normDoc(d) {
    const e = emptyDoc();
    if (!d || typeof d !== "object") return e;
    Object.keys(e).forEach((k) => {
      const a = d[k], b = e[k];
      if (a == null || typeof a !== typeof b || Array.isArray(a) !== Array.isArray(b)) d[k] = b;
    });
    return d;
  }
  function add(o, k, n) { o[k] = (o[k] || 0) + n; }

  // ---------- 합치기 ----------
  function world(him, her, now) {
    const A = normDoc(him), B = normDoc(her);
    const W = { now: now || Date.now(), docs: { him: A, her: B } };
    const both = [A, B];
    const maxMap = (f) => { const o = {}; both.forEach((d) => { for (const k in d[f]) o[k] = Math.max(o[k] || 0, d[f][k]); }); return o; };
    const lww = (f) => { const o = {}; both.forEach((d) => { for (const k in d[f]) { const v = d[f][k]; if (Array.isArray(v) && (!o[k] || v[1] > o[k][1])) o[k] = v; } }); return o; };
    const sum = (f) => { const o = {}; both.forEach((d) => { for (const k in d[f]) o[k] = (o[k] || 0) + (Number(d[f][k]) || 0); }); return o; };
    W.till = maxMap("till");
    W.clr = maxMap("clr");
    W.plant = lww("plant");
    W.fert = lww("fert");
    W.obj = lww("obj");
    W.hens = lww("hens");
    W.up = maxMap("up");
    W.deb = {}; both.forEach((d) => { for (const k in d.deb) W.deb[k] = 1; });
    W.inv = sum("inv");
    W.shipped = sum("shipped");
    W.st = sum("st");
    // 물: 누가 줬는지도 기억해요 (둘이 같이 키운 작물)
    W.wat = {};
    ["him", "her"].forEach((w) => {
      const d = W.docs[w];
      for (const k in d.wat) (d.wat[k] || []).forEach((t) => { (W.wat[k] = W.wat[k] || []).push([t, w]); });
    });
    for (const k in W.wat) W.wat[k].sort((a, b) => a[0] - b[0]);
    W.harv = {};
    both.forEach((d) => { for (const k in d.harv) (d.harv[k] || []).forEach((t) => { (W.harv[k] = W.harv[k] || []).push(t); }); });
    for (const k in W.harv) W.harv[k] = Array.from(new Set(W.harv[k])).sort((a, b) => a - b);
    W.rain = Array.from(new Set(A.rain.concat(B.rain))).sort((a, b) => a - b);
    // 돈: 출하한 돈은 다음 날 아침 6시에 들어와요
    W.goldIn = 0; W.goldWait = 0;
    const today = dayKey(W.now);
    both.forEach((d) => { for (const dk in d.earn) { if (dk < today) W.goldIn += d.earn[dk]; else W.goldWait += d.earn[dk]; } });
    W.gold = 500 + W.goldIn - (A.spend + B.spend);
    W.xp = (A.xp || 0) + (B.xp || 0);
    W.level = 1;
    F.LEVELS.forEach((x, i) => { if (W.xp >= x) W.level = i + 1; });
    W.tp = (A.tp || 0) + (B.tp || 0);
    W.season = seasonOf(W.now);
    W.today = today;
    // 하루 일
    const dayU = (f) => { const o = {}; both.forEach((d) => { for (const k in d[f]) o[k] = 1; }); return o; };
    W.dogBowl = dayU("dogBowl");
    W.dogPetDays = dayU("dogPet");
    W.dogPts = 0;
    both.forEach((d) => { W.dogPts += Object.keys(d.dogPet).length * 2 + Object.keys(d.dogBowl).length; });
    W.dogHearts = Math.min(10, Math.floor(W.dogPts / 8));
    W.henFed = {}; W.henPet = {}; W.eggs = {};
    both.forEach((d) => {
      ["henFed", "henPet", "eggs"].forEach((f) => { for (const id in d[f]) { W[f][id] = W[f][id] || {}; for (const dk in d[f][id]) W[f][id][dk] = 1; } });
    });
    W.cache = {};
    return W;
  }

  // ---------- 한 칸의 모습 ----------
  // 젖은 시간 구간들 (물, 비, 스프링클러)
  function wetEvents(W, k, from) {
    const ev = [];
    (W.wat[k] || []).forEach(([t]) => { if (t >= from - 48 * H) ev.push(t); });
    W.rain.forEach((t) => { if (t >= from - 48 * H) ev.push(t); });
    // 스프링클러: 놓은 다음 날 아침부터 매일 6시
    const [c, r] = parseKey(k);
    for (const ok in W.obj) {
      const [type, t] = W.obj[ok];
      const def = F.OBJS[type];
      if (!def) continue;
      const [oc, or] = parseKey(ok);
      if (!def.cover.some(([dx, dy]) => oc + dx === c && or + dy === r)) continue;
      const first = dayStart(t) + 24 * H;
      let d = Math.max(first, dayStart(from - 48 * H));
      for (; d <= W.now; d += 24 * H) ev.push(d);
    }
    return ev.sort((a, b) => a - b);
  }
  function tile(W, k) {
    if (W.cache[k]) return W.cache[k];
    const T = { k, open: isOpen(W, k), field: isField(k) };
    const deb = debrisAt(k);
    T.debris = deb && !W.deb[k] && !W.till[k] ? deb : "";
    T.tilled = !!W.till[k] && !T.debris;
    const ob = W.obj[k];
    T.obj = ob && ob[0] ? ob[0] : "";
    const fe = W.fert[k];
    T.fert = fe && fe[0] && (!W.plant[k] || fe[1] > (W.clr[k] || 0)) ? fe[0] : "";
    const wetDur = (F.FERT[T.fert] && F.FERT[T.fert].wet || WET) * H;
    // 지금 젖었는지 (작물이 없어도)
    const evAll = wetEvents(W, k, W.now - 72 * H);
    const lastEv = evAll.length ? evAll[evAll.length - 1] : 0;
    T.wet = T.tilled && lastEv && W.now < lastEv + wetDur;
    T.wetLeft = T.wet ? lastEv + wetDur - W.now : 0;
    const p = W.plant[k];
    if (p && p[1] > (W.clr[k] || 0) && T.tilled) {
      const crop = F.BY_ID[p[0]];
      const P = p[1];
      const hs = (W.harv[k] || []).filter((t) => t > P);
      if (crop && !(hs.length && !crop.regrow)) {
        const S = hs.length ? hs[hs.length - 1] : P;
        const need = (hs.length ? crop.regrow : crop.hours) * (1 - (F.FERT[T.fert] && F.FERT[T.fert].speed || 0)) * H;
        const ev = wetEvents(W, k, P).filter((t) => t > P - wetDur);
        // 젖은 구간을 합쳐서 S 부터 쌓아요
        let acc = 0, cur = S, matureAt = 0, deadAt = 0, maxGap = 0, gapStart = S;
        const iv = [];
        ev.forEach((t) => {
          const a = Math.max(t, S), b = t + wetDur;
          if (b <= S) return;
          if (iv.length && a <= iv[iv.length - 1][1]) iv[iv.length - 1][1] = Math.max(iv[iv.length - 1][1], b);
          else iv.push([a, b]);
        });
        for (const [a, b] of iv) {
          if (a > W.now) break;
          // 마른 틈
          if (a > cur) {
            const gap = a - cur;
            if (gap > DEAD * H && !matureAt) { deadAt = cur + DEAD * H; break; }
            maxGap = Math.max(maxGap, gap);
          }
          const end = Math.min(b, W.now);
          const span = end - Math.max(a, cur);
          if (span > 0) {
            if (acc + span >= need && !matureAt) matureAt = Math.max(a, cur) + (need - acc);
            acc += span;
          }
          cur = Math.max(cur, end);
          gapStart = cur;
        }
        if (!deadAt && !matureAt && W.now - cur > DEAD * H) deadAt = cur + DEAD * H;
        // 계절이 바뀌면 그 계절 작물이 아닌 건 죽어요
        const season = seasonOf(W.now);
        if (!crop.seasons.includes(season)) {
          const se = seasonEnd(P);
          if (W.now > se && !deadAt) deadAt = se;
        }
        T.crop = crop;
        T.planted = P;
        T.by = (W.plant[k][2]) || "";
        T.harvests = hs.length;
        T.need = need;
        T.grown = Math.min(acc, need);
        T.frac = Math.min(1, acc / need);
        T.ready = !deadAt && T.frac >= 1;
        T.dead = !!deadAt;
        T.dryFor = T.wet ? 0 : W.now - Math.max(gapStart, S);
        T.wilting = !T.dead && !T.ready && T.dryFor > WILT * H;
        T.thirsty = !T.dead && !T.ready && !T.wet;
        T.stage = T.dead ? -1 : T.ready ? 4 : hs.length ? 3 : T.frac < 0.12 ? 0 : T.frac < 0.4 ? 1 : T.frac < 0.75 ? 2 : 3;
        // 둘이 같이 키웠나 (둘 다 물을 줬나)
        const ws = (W.wat[k] || []).filter(([t]) => t >= P - wetDur);
        T.byHim = ws.some(([, w]) => w === "him");
        T.byHer = ws.some(([, w]) => w === "her");
        T.together = T.byHim && T.byHer;
        T.left = T.ready ? 0 : Math.max(0, need - acc);
      }
    }
    W.cache[k] = T;
    return T;
  }
  function allTiles(W) {
    const out = [];
    for (let r = FIELD0; r < ROWS; r++) for (let c = 0; c < COLS; c++) out.push(tile(W, key(c, r)));
    return out;
  }
  function invalidate(W, k) { if (k) delete W.cache[k]; else W.cache = {}; }

  // ---------- 행동 (내 기록장만 고쳐요) ----------
  function touch(W, me) { me.tp++; W.tp++; me.lastAct = W.now; }
  function spend(W, me, g) { if (W.gold < g) return false; me.spend += g; W.gold -= g; return true; }
  function invAdd(W, me, item, n) { add(me.inv, item, n); add(W.inv, item, n); }
  function stat(W, me, k, n) { add(me.st, k, n || 1); add(W.st, k, n || 1); }

  function hoe(W, me, k) {
    const T = tile(W, k);
    if (!T.open || T.obj) return null;
    if (T.debris) return { fail: "debris" };
    if (T.tilled) return null;
    me.till[k] = W.now; W.till[k] = W.now;
    touch(W, me); stat(W, me, "till");
    invalidate(W, k);
    return { ok: "till" };
  }
  function clear(W, me, k) {
    const T = tile(W, k);
    if (!T.open) return null;
    if (T.debris) {
      me.deb[k] = 1; W.deb[k] = 1;
      touch(W, me); stat(W, me, T.debris);
      invAdd(W, me, T.debris === "weed" ? "fiber" : "stone", 1);
      invalidate(W, k);
      return { ok: "debris", kind: T.debris };
    }
    if (T.obj) {
      const type = T.obj;
      me.obj[k] = ["", W.now]; W.obj[k] = ["", W.now];
      invAdd(W, me, type, 1);
      W.cache = {};
      return { ok: "pickup", type };
    }
    if (T.crop && T.dead) {
      me.clr[k] = W.now; W.clr[k] = W.now;
      touch(W, me); stat(W, me, "dead");
      invalidate(W, k);
      return { ok: "dead" };
    }
    return null;
  }
  function plant(W, me, k, cropId, who) {
    const T = tile(W, k);
    const crop = F.BY_ID[cropId];
    if (!crop || !T.tilled || T.crop || T.obj) return null;
    if (!crop.seasons.includes(W.season)) return { fail: "season" };
    if ((W.inv["seed:" + cropId] || 0) < 1) return { fail: "noseed" };
    invAdd(W, me, "seed:" + cropId, -1);
    let t = W.now;
    if (W.plant[k] && W.plant[k][1] >= t) t = W.plant[k][1] + 1;
    me.plant[k] = [cropId, t, who]; W.plant[k] = [cropId, t, who];
    touch(W, me); stat(W, me, "plant");
    prune(W, me, k);
    invalidate(W, k);
    return { ok: "plant" };
  }
  function water(W, me, k, who) {
    const T = tile(W, k);
    if (!T.tilled) return null;
    if (me.water <= 0) return { fail: "empty" };
    me.water--;
    (me.wat[k] = me.wat[k] || []).push(W.now);
    if (me.wat[k].length > 12) me.wat[k] = me.wat[k].slice(-12);
    (W.wat[k] = W.wat[k] || []).push([W.now, who]);
    touch(W, me); stat(W, me, "water");
    invalidate(W, k);
    return { ok: "water", revived: T.wilting };
  }
  function refill(W, me) {
    const cap = F.CAN[Math.min(F.CAN.length - 1, W.up.can || 0)].cap;
    me.water = cap;
    return cap;
  }
  function canCap(W) { return F.CAN[Math.min(F.CAN.length - 1, W.up.can || 0)].cap; }
  function fertilize(W, me, k, type) {
    const T = tile(W, k);
    if (!T.tilled || T.fert || T.obj) return null;
    if ((W.inv["fert:" + type] || 0) < 1) return { fail: "nofert" };
    invAdd(W, me, "fert:" + type, -1);
    me.fert[k] = [type, W.now]; W.fert[k] = [type, W.now];
    touch(W, me);
    invalidate(W, k);
    return { ok: "fert" };
  }
  // 품질: 0 보통, 1 은빛, 2 금빛 (+ 둘이 키우면 하트)
  function rollQuality(W, T, rnd) {
    const q = F.FERT[T.fert] && F.FERT[T.fert].quality || 0;
    const gold = 0.02 + W.level * 0.012 + q * 0.08 + (q === 2 ? 0.1 : 0);
    const silver = gold + 0.1 + W.level * 0.02 + q * 0.12;
    const r = rnd();
    return r < gold ? 2 : r < silver ? 1 : 0;
  }
  function price(W, crop, q, heart) {
    return Math.round(crop.sell * [1, 1.25, 1.5][q] * (heart ? 1.25 : 1) * (1 + 0.02 * (W.memStage || 0)));
  }
  function harvest(W, me, k, rnd) {
    const T = tile(W, k);
    if (!T.ready) return null;
    const crop = T.crop;
    const q = rollQuality(W, T, rnd || Math.random);
    const n = crop.yield + (crop.id === "c4" && (rnd || Math.random)() < 0.2 ? 1 : 0);
    const item = `crop:${crop.id}:${q}${T.together ? "h" : ""}`;
    invAdd(W, me, item, n);
    (me.harv[k] = me.harv[k] || []).push(W.now);
    (W.harv[k] = W.harv[k] || []).push(W.now);
    const xp = Math.max(2, Math.round(crop.sell / 6));
    me.xp += xp; W.xp += xp;
    const lv0 = W.level;
    F.LEVELS.forEach((x, i) => { if (W.xp >= x) W.level = i + 1; });
    touch(W, me); stat(W, me, "harvest", n);
    if (T.together) stat(W, me, "together", 1);
    if (q === 2) stat(W, me, "goldq", 1);
    invalidate(W, k);
    return { ok: "harvest", crop, q, n, heart: T.together, item, xp, levelUp: W.level > lv0 ? W.level : 0, regrow: !!crop.regrow, by: T.by, byHim: T.byHim, byHer: T.byHer };
  }
  function itemInfo(item) {
    const [kind, id, qq] = item.split(":");
    if (kind === "crop") {
      const crop = F.BY_ID[id];
      const q = Number(String(qq).replace("h", ""));
      return { kind, crop, q, heart: String(qq).includes("h"), name: crop.name };
    }
    if (kind === "egg") return { kind, big: id === "big", name: id === "big" ? F.BIG_EGG.name : F.EGG.name };
    if (kind === "seed") return { kind, crop: F.BY_ID[id], name: F.BY_ID[id].name + " 씨앗" };
    if (kind === "fert") return { kind, f: F.FERT[id], name: F.FERT[id].name };
    if (F.OBJS[kind]) return { kind: "obj", o: F.OBJS[kind], name: F.OBJS[kind].name };
    if (kind === "fiber") return { kind, name: "풀" };
    if (kind === "stone") return { kind, name: "돌" };
    return { kind, name: item };
  }
  function sellPrice(W, item) {
    const it = itemInfo(item);
    if (it.kind === "crop") return price(W, it.crop, it.q, it.heart);
    if (it.kind === "egg") return it.big ? F.BIG_EGG.sell : F.EGG.sell;
    if (it.kind === "fiber") return 1;
    if (it.kind === "stone") return 2;
    return 0;
  }
  // 출하: 돈은 내일 아침 6시에
  function ship(W, me, item, n) {
    if ((W.inv[item] || 0) < n || n <= 0) return null;
    const g = sellPrice(W, item) * n;
    invAdd(W, me, item, -n);
    add(me.earn, W.today, g);
    W.goldWait += g;
    const it = itemInfo(item);
    if (it.kind === "crop") { add(me.shipped, it.crop.id, n); add(W.shipped, it.crop.id, n); }
    stat(W, me, "ship", n);
    return { g };
  }
  function buy(W, me, item, n) {
    let unit = 0;
    const [kind, id] = item.split(":");
    if (kind === "seed") { const c = F.BY_ID[id]; if (!c || !c.seasons.includes(W.season)) return null; unit = c.seed; }
    else if (kind === "fert") { const f = F.FERT[id]; if (!f || W.level < f.lv) return null; unit = f.price; }
    else if (F.OBJS[kind]) { if (W.level < F.OBJS[kind].lv) return null; unit = F.OBJS[kind].price; }
    else return null;
    if (!spend(W, me, unit * n)) return { fail: "gold" };
    invAdd(W, me, item, n);
    return { ok: true, g: unit * n };
  }
  function place(W, me, k, type) {
    const T = tile(W, k);
    if (!T.open || T.debris || T.crop || T.obj) return null;
    if ((W.inv[type] || 0) < 1) return { fail: "none" };
    invAdd(W, me, type, -1);
    me.obj[k] = [type, W.now]; W.obj[k] = [type, W.now];
    W.cache = {};
    return { ok: "place" };
  }
  function upgrade(W, me, what) {
    const cur = W.up[what] || 0;
    let cost = 0;
    if (what === "can") { if (cur + 1 >= F.CAN.length) return null; cost = F.CAN[cur + 1].price; }
    else if (what === "land") { if (cur + 1 >= F.LAND.length) return null; cost = F.LAND[cur + 1].price; }
    else if (what === "coop") { if (cur) return null; cost = F.COOP; }
    else return null;
    if (!spend(W, me, cost)) return { fail: "gold" };
    me.up[what] = cur + 1; W.up[what] = cur + 1;
    W.cache = {};
    return { ok: true };
  }
  // ---------- 닭과 강아지 ----------
  function hensList(W) {
    return Object.keys(W.hens).filter((id) => W.hens[id][0]).map((id) => {
      const fed = W.henFed[id] || {}, pet = W.henPet[id] || {};
      const pts = Object.keys(fed).length + Object.keys(pet).length * 2;
      const hearts = Math.min(10, Math.floor(pts / 6));
      const born = W.hens[id][2] || W.hens[id][1];
      // 어제 먹이를 먹었으면 오늘 아침 달걀 (사흘까지 쌓여요)
      const eggs = [];
      for (let i = 0; i < 3; i++) {
        const dk = dayKey(W.now - i * 24 * H);
        const prev = dayKey(W.now - (i + 1) * 24 * H);
        if (fed[prev] && !(W.eggs[id] || {})[dk] && dayStart(W.now - i * 24 * H) > born) eggs.push(dk);
      }
      return { id, name: W.hens[id][0], hearts, fedToday: !!fed[W.today], petToday: !!pet[W.today], eggs, big: hearts >= 5 };
    });
  }
  function buyHen(W, me, name) {
    if (!W.up.coop) return null;
    if (hensList(W).length >= F.MAX_HENS) return { fail: "full" };
    if (!spend(W, me, F.HEN)) return { fail: "gold" };
    const id = "h" + W.now.toString(36);
    me.hens[id] = [name || "꼬꼬", W.now, W.now]; W.hens[id] = me.hens[id];
    return { ok: true, id };
  }
  function renameHen(W, me, id, name) {
    if (!W.hens[id]) return null;
    const born = W.hens[id][2] || W.hens[id][1];
    let t = W.now; if (W.hens[id][1] >= t) t = W.hens[id][1] + 1;
    me.hens[id] = [name, t, born]; W.hens[id] = me.hens[id];
    return { ok: true };
  }
  function dayMark(W, me, field, id) {
    if (id) {
      me[field][id] = me[field][id] || {};
      if (me[field][id][W.today]) return false;
      me[field][id][W.today] = 1;
      W[field][id] = W[field][id] || {}; W[field][id][W.today] = 1;
      return true;
    }
    if (me[field][W.today]) return false;
    me[field][W.today] = 1;
    return true;
  }
  function feedHen(W, me, id) { const ok = dayMark(W, me, "henFed", id); if (ok) touch(W, me); return ok; }
  function petHen(W, me, id) { const ok = dayMark(W, me, "henPet", id); if (ok) touch(W, me); return ok; }
  function collectEggs(W, me) {
    let n = 0, big = 0;
    hensList(W).forEach((h) => {
      h.eggs.forEach((dk) => {
        me.eggs[h.id] = me.eggs[h.id] || {}; me.eggs[h.id][dk] = 1;
        W.eggs[h.id] = W.eggs[h.id] || {}; W.eggs[h.id][dk] = 1;
        if (h.big) big++; else n++;
      });
    });
    if (n) invAdd(W, me, "egg:small", n);
    if (big) invAdd(W, me, "egg:big", big);
    if (n + big) { stat(W, me, "egg", n + big); const xp = (n + big) * 5; me.xp += xp; W.xp += xp; touch(W, me); }
    return { n, big };
  }
  function dogBowl(W, me) {
    if (W.dogBowl[W.today]) return false;
    me.dogBowl[W.today] = 1; W.dogBowl[W.today] = 1; W.dogPts += 1;
    touch(W, me);
    W.dogHearts = Math.min(10, Math.floor(W.dogPts / 8));
    return true;
  }
  function dogPet(W, me) {
    if (me.dogPet[W.today]) return false;
    me.dogPet[W.today] = 1; W.dogPetDays[W.today] = 1; W.dogPts += 2;
    touch(W, me);
    W.dogHearts = Math.min(10, Math.floor(W.dogPts / 8));
    return true;
  }
  // 비가 오면 바깥 밭이 다 젖어요
  function rain(W, me) {
    const last = W.rain[W.rain.length - 1] || 0;
    if (W.now - last < 3 * H) return false;
    me.rain.push(W.now);
    me.rain = me.rain.filter((t) => W.now - t < 5 * 24 * H);
    W.rain.push(W.now);
    W.cache = {};
    return true;
  }
  // 지난 작물의 물 기록은 지워서 가볍게
  function prune(W, me, k) {
    const p = W.plant[k];
    if (me.wat[k] && p) me.wat[k] = me.wat[k].filter((t) => t > p[1] - 48 * H);
    if (me.harv[k] && p) me.harv[k] = me.harv[k].filter((t) => t > p[1]);
  }

  // ---------- 오늘 할 일 ----------
  function todayList(W, who) {
    const tiles = allTiles(W).filter((t) => t.crop && !t.dead);
    const dry = tiles.filter((t) => t.thirsty).length;
    const ready = tiles.filter((t) => t.ready).length;
    const hens = hensList(W);
    const me = W.docs[who] || emptyDoc();
    const list = [
      { k: "water", text: dry ? `물 줄 작물 ${dry}개` : tiles.length ? "작물이 다 촉촉해요" : "씨앗 심기", done: tiles.length > 0 && dry === 0 },
      { k: "bowl", text: "마루 물그릇 채우기", done: !!W.dogBowl[W.today] },
      { k: "pet", text: "마루 쓰다듬기", done: !!me.dogPet[W.today] },
    ];
    if (hens.length) list.push({ k: "hens", text: `닭 모이 ${hens.filter((h) => h.fedToday).length}/${hens.length}`, done: hens.every((h) => h.fedToday) });
    if (ready) list.push({ k: "harvest", text: `거둘 작물 ${ready}개`, done: false });
    return list;
  }

  // ---------- 달래의 일기가 돌아오는 순간 36가지 ----------
  const MILE = [
    ["처음 밭을 갈았어요", (W) => (W.st.till || 0) >= 1],
    ["처음 씨앗을 심었어요", (W) => (W.st.plant || 0) >= 1],
    ["처음 물을 줬어요", (W) => (W.st.water || 0) >= 1],
    ["처음 거뒀어요", (W) => (W.st.harvest || 0) >= 1],
    ["처음 출하한 돈이 들어왔어요", (W) => W.goldIn > 0],
    ["마루 물그릇을 채웠어요", (W) => Object.keys(W.dogBowl).length >= 1],
    ["열 번 거뒀어요", (W) => (W.st.harvest || 0) >= 10],
    ["작물 다섯 가지를 출하했어요", (W) => Object.keys(W.shipped).length >= 5],
    ["농사 2단계", (W) => W.level >= 2],
    ["비가 밭을 적셨어요", (W) => W.rain.length >= 1],
    ["처음 비료를 줬어요", (W) => Object.keys(W.fert).length >= 1],
    ["마루와 하트 셋", (W) => W.dogHearts >= 3],
    ["스프링클러를 놓았어요", (W) => Object.values(W.obj).some((o) => o[0])],
    ["쉰 번 거뒀어요", (W) => (W.st.harvest || 0) >= 50],
    ["금빛 작물", (W) => (W.st.goldq || 0) >= 1],
    ["둘이 같이 키운 작물", (W) => (W.st.together || 0) >= 1],
    ["농사 4단계", (W) => W.level >= 4],
    ["닭장을 지었어요", (W) => !!W.up.coop],
    ["첫 닭", (W) => Object.keys(W.hens).length >= 1],
    ["첫 달걀", (W) => (W.st.egg || 0) >= 1],
    ["작물 열 가지", (W) => Object.keys(W.shipped).length >= 10],
    ["땅을 넓혔어요", (W) => (W.up.land || 0) >= 1],
    ["백오십 번 거뒀어요", (W) => (W.st.harvest || 0) >= 150],
    ["물뿌리개를 바꿨어요", (W) => (W.up.can || 0) >= 1],
    ["농사 6단계", (W) => W.level >= 6],
    ["두 계절을 보냈어요", (W) => seasonsPlayed(W) >= 2],
    ["달걀 서른 개", (W) => (W.st.egg || 0) >= 30],
    ["모은 돈 오만", (W) => W.goldIn >= 50000],
    ["작물 스무 가지", (W) => Object.keys(W.shipped).length >= 20],
    ["마루와 하트 열", (W) => W.dogHearts >= 10],
    ["사백 번 거뒀어요", (W) => (W.st.harvest || 0) >= 400],
    ["농사 8단계", (W) => W.level >= 8],
    ["세 계절을 보냈어요", (W) => seasonsPlayed(W) >= 3],
    ["둘이 키운 작물 백 개", (W) => (W.st.together || 0) >= 100],
    ["작물 서른 가지 모두", (W) => Object.keys(W.shipped).length >= 30],
    ["농사 10단계", (W) => W.level >= 10],
  ];
  function seasonsPlayed(W) {
    const s = new Set();
    for (const k in W.plant) s.add(seasonOf(W.plant[k][1]));
    return s.size;
  }
  function milestones(W) { return MILE.map(([text, f], i) => ({ i, text, done: !!f(W) })); }

  root.FFarm = {
    COLS, ROWS, FIELD0, H, WET, WILT, DEAD,
    dayKey, dayStart, seasonOf, seasonEnd, key, parseKey, isField, isOpen, openRows, debrisAt,
    emptyDoc, normDoc, world, tile, allTiles, invalidate,
    hoe, clear, plant, water, refill, canCap, fertilize, harvest, ship, buy, place, upgrade, itemInfo, sellPrice,
    hensList, buyHen, renameHen, feedHen, petHen, collectEggs, dogBowl, dogPet, rain, todayList, milestones, MILE,
  };
})(typeof window !== "undefined" ? window : globalThis);
