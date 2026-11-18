// ============================================================
// 꽃마루 정원: 규칙
// 두 사람은 각자 자기 기록장(doc)만 고쳐요. 정원 모습은 두 기록장을 합쳐서 계산해요.
// 그래서 동시에 눌러도 서로 덮어쓰지 않아요.
// 이 파일은 화면을 모르고, 노드에서도 돌아가요. (밸런스 시험용)
// ============================================================
(function (root) {
  "use strict";

  const D = root.GData;
  const ST = root.GStory;
  const SP = D.SPECIES;
  const NA = D.AREAS.length;
  const CARE_KEYS = D.CARES.map((c) => c.key);

  // ---------- 경제 숫자 (sim.js 로 맞춘 값) ----------
  const E = {
    needBase: 20, grow: 3.2, needK: 0.22, needRare: 2.2,
    valBase: 4, valK: 0.24, valRare: 2.6,
    seedFrac: 0.2,
    toolBase: 6, toolGrow: 1.3, toolPow: 1.12,
    costGrow: 5.2, plotBase: 25, plotGrow: 2,
    bldBase: 450, bldStage: [1, 3, 8],
    bossMul: 40,
    idleBase: 0.5, idleHelper: 0.45, idleAff: 0.04, capBase: 4,
    want: 3, comboStep: 0.08, comboBase: 10,
    silver: 0.1, gold: 0.022, rainbow: 0.006,
    mastery: [1, 5, 20, 60, 150], masteryBonus: 0.005,
    together: 1.25,
    affLv: [0, 10, 30, 60, 100, 150, 220, 300, 400, 520, 666],
  };

  // 정원 a 의 k 번째 꽃 기준값
  function areaPow(a) { return Math.pow(E.grow, a); }
  function spArea(sp, W) { return sp.area >= 0 ? sp.area : seasonArea(W); }
  function need(sp, W) {
    return Math.round(E.needBase * areaPow(spArea(sp, W)) * (1 + E.needK * sp.k) * (sp.rare ? E.needRare : 1) * (sp.season ? 1.4 : 1));
  }
  function baseValue(sp, W) {
    return Math.round(E.valBase * areaPow(spArea(sp, W)) * (1 + E.valK * sp.k) * (sp.rare ? E.valRare : 1) * (sp.season ? 1.6 : 1));
  }
  function seedCost(sp, W) {
    if (sp.area === 0 && sp.k <= 1) return 0;
    return Math.round(baseValue(sp, W) * (sp.rare ? 0.4 : E.seedFrac));
  }
  function seasonArea(W) { return W ? Math.max(0, W.maxArea) : 0; }
  function toolPow(lv) { return Math.pow(E.toolPow, lv - 1); }
  function toolCost(lv) { return Math.round(E.toolBase * Math.pow(E.toolGrow, lv - 1)); }
  function costPow(a) { return Math.pow(E.costGrow, a); }
  function plotCost(a, n) { return Math.round(E.plotBase * costPow(a) * Math.pow(E.plotGrow, n - 1)); }
  function bldCost(a, s) {
    return { petals: Math.round(E.bldBase * costPow(a) * E.bldStage[s]), hearts: s === 2 ? 10 + a * 6 : s === 1 ? 2 + a : 0 };
  }
  function bossHp(a) { return Math.round(E.needBase * areaPow(a) * (1 + E.needK * 5) * E.bossMul); }
  function researchCost(lv) { return 1 + lv * 2; }
  function affLevel(n) {
    let lv = 0;
    for (let i = 0; i < E.affLv.length; i++) if (n >= E.affLv[i]) lv = i;
    return lv;
  }
  function masteryStars(n) { return E.mastery.filter((t) => n >= t).length; }

  // ---------- 시간 ----------
  function pad(n) { return String(n).padStart(2, "0"); }
  function dayKey(t) { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
  function monthKey(t) { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; }
  function isNight(t) { const h = new Date(t).getHours(); return h >= 20 || h < 5; }

  // ---------- 작은 난수 (주문처럼 두 폰이 같은 결과를 봐야 할 때) ----------
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    let s = hash(String(seed)) || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }

  // ---------- 기록장 ----------
  function emptyDoc() {
    return {
      v: 3, pe: 0, ps: 0, he: 0, hs: 0, se: 0, ss: 0,
      tl: {}, rs: {}, pl: {}, gr: {}, hv: {}, hc: {}, vr: {}, vc: [0, 0, 0, 0], inv: {}, ck: {},
      plots: {}, bld: {}, boss: {}, af: {}, od: 0, og: {}, q: {}, ac: {}, deco: {}, mg: {}, ft: {}, fs: {},
      dy: {}, tp: 0, tc: {}, spk: 0, nh: 0, mc: 0, hvn: 0,
      seen: {}, area: 0, tool: "water", auto: 1, title: "",
    };
  }
  function normDoc(d) {
    const e = emptyDoc();
    if (!d || typeof d !== "object") return e;
    Object.keys(e).forEach((k) => { if (d[k] == null || typeof d[k] !== typeof e[k] || Array.isArray(e[k]) !== Array.isArray(d[k])) d[k] = e[k]; });
    return d;
  }
  function addTo(obj, k, n) { obj[k] = (obj[k] || 0) + n; }
  function sumMaps(a, b) { const o = {}; [a, b].forEach((m) => { for (const k in m) o[k] = (o[k] || 0) + (Number(m[k]) || 0); }); return o; }
  function maxMaps(a, b) { const o = {}; [a, b].forEach((m) => { for (const k in m) o[k] = Math.max(o[k] || 0, Number(m[k]) || 0); }); return o; }
  function orMaps(a, b) { const o = {}; [a, b].forEach((m) => { for (const k in m) o[k] = (o[k] || 0) | (Number(m[k]) || 0); }); return o; }
  function unionMaps(a, b) { const o = {}; [a, b].forEach((m) => { for (const k in m) if (m[k]) o[k] = m[k]; }); return o; }
  function lwwMaps(a, b, idx) { const o = {}; [a, b].forEach((m) => { for (const k in m) { const v = m[k]; if (Array.isArray(v) && (!o[k] || v[idx] > o[k][idx])) o[k] = v; } }); return o; }

  // ---------- 세상 (두 기록장 합치기) ----------
  // ctx: { him, her, me, now, app: {hearts}, }
  function world(him, her, opts) {
    const A = normDoc(him), B = normDoc(her);
    const now = (opts && opts.now) || Date.now();
    const W = { now, docs: { him: A, her: B } };
    W.tl = sumMaps(A.tl, B.tl);
    W.rs = sumMaps(A.rs, B.rs);
    W.pl = lwwMaps(A.pl, B.pl, 1);
    W.gr = sumMaps(A.gr, B.gr);
    W.hv = unionMaps(A.hv, B.hv);
    W.hc = sumMaps(A.hc, B.hc);
    W.vr = orMaps(A.vr, B.vr);
    W.vc = [0, 1, 2, 3].map((i) => (A.vc[i] || 0) + (B.vc[i] || 0));
    W.inv = sumMaps(A.inv, B.inv);
    W.ck = sumMaps(A.ck, B.ck);
    W.plots = maxMaps(A.plots, B.plots);
    W.bld = maxMaps(A.bld, B.bld);
    W.boss = sumMaps(A.boss, B.boss);
    W.af = sumMaps(A.af, B.af);
    W.od = (A.od || 0) + (B.od || 0);
    W.og = sumMaps(A.og, B.og);
    W.q = unionMaps(A.q, B.q);
    W.ac = unionMaps(A.ac, B.ac);
    W.deco = lwwMaps(A.deco, B.deco, 1);
    W.mg = maxMaps(A.mg, B.mg);
    W.ft = sumMaps(A.ft, B.ft);
    W.fs = sumMaps(A.fs, B.fs);
    W.tp = (A.tp || 0) + (B.tp || 0);
    W.tc = sumMaps(A.tc, B.tc);
    W.spk = (A.spk || 0) + (B.spk || 0);
    W.nh = (A.nh || 0) + (B.nh || 0);
    W.hvn = (A.hvn || 0) + (B.hvn || 0);
    W.mc = Math.max(A.mc || 0, B.mc || 0);
    // 함께한 날: 두 사람 다 정원에 온 날
    W.bothDays = Object.keys(A.dy).filter((k) => B.dy[k]).length;
    W.todayBoth = !!(A.dy[dayKey(now)] && B.dy[dayKey(now)]);
    // 열린 정원: 앞 장을 끝내면 다음 정원이 열려요
    W.maxArea = 0;
    for (let a = 0; a < NA - 1; a++) if (W.q[`m${a}_13`]) W.maxArea = a + 1;
    W.finished = !!W.q[`m${NA - 1}_13`];
    for (let a = 0; a <= W.maxArea; a++) W.plots[a] = Math.max(1, W.plots[a] || 0);
    // 숙련 별
    W.stars = 0;
    W.discovered = 0;
    SP.forEach((s) => { const n = W.hc[s.id] || 0; if (n) W.discovered++; W.stars += masteryStars(n); });
    // 친구 (건물 1단계부터 도와줘요)
    W.helpers = 0;
    W.affLvSum = 0;
    for (let a = 0; a < NA; a++) {
      if ((W.bld[a] || 0) >= 1) W.helpers++;
      W.affLvSum += affLevel(W.af[a] || 0);
    }
    // 건물 덤
    W.perk = {};
    for (let a = 0; a < NA; a++) {
      const s = W.bld[a] || 0;
      if (!s) continue;
      const pk = D.AREAS[a].perk;
      W.perk[pk] = (W.perk[pk] || 0) + D.PERKS[pk].per * s;
    }
    const all = 1 + (W.perk.all || 0);
    // 지갑
    const app = (opts && opts.app) || { hearts: 0 };
    const mgStages = Object.keys(W.mg).reduce((n, k) => n + (W.mg[k] || 0), 0);
    W.mgStages = mgStages;
    W.petals = (A.pe + B.pe) - (A.ps + B.ps);
    W.hearts = (A.he + B.he) - (A.hs + B.hs) + (app.hearts || 0);
    W.shards = (A.se + B.se) - (A.ss + B.ss) + W.stars + mgStages + Math.floor((W.perk.star || 0) * 0);
    // 배수
    W.mul = {
      tap: (1 + 0.25 * (W.rs.tap || 0)) * (1 + (W.perk.tap || 0)) * all,
      petal: (1 + 0.15 * (W.rs.petal || 0)) * (1 + (W.perk.petal || 0)) * (1 + E.masteryBonus * W.stars) * all * (W.todayBoth ? E.together : 1),
      idle: (1 + 0.3 * (W.rs.idle || 0)) * (1 + (W.perk.idle || 0)) * all,
      luck: (1 + 0.12 * (W.rs.luck || 0)) * (1 + (W.perk.luck || 0)) * all,
      order: (1 + 0.15 * (W.rs.order || 0)) * (1 + (W.perk.order || 0)) * all,
      boss: (1 + 0.3 * (W.rs.boss || 0)) * all,
      sparkle: (1 + 0.2 * (W.rs.sparkle || 0)) * (1 + (W.perk.sparkle || 0)),
      splash: 0.08 * (W.rs.splash || 0),
    };
    W.comboMax = E.comboBase + 4 * (W.rs.combo || 0) + (W.perk.combo || 0);
    W.capH = E.capBase + 2 * (W.rs.cap || 0) + (W.perk.cap || 0);
    W.toolLv = {};
    CARE_KEYS.forEach((k) => { W.toolLv[k] = 1 + (W.tl[k] || 0); });
    W.toolSum = CARE_KEYS.reduce((n, k) => n + W.toolLv[k], 0);
    W.avgPow = CARE_KEYS.reduce((n, k) => n + toolPow(W.toolLv[k]), 0) / 4;
    W.idlePerMin = (E.idleBase + E.idleHelper * W.helpers + E.idleAff * W.affLvSum) * W.avgPow * W.mul.tap * W.mul.idle;
    // 아름다움
    W.beauty = 0;
    for (const k in W.deco) {
      const d = decorById(W.deco[k][0]);
      if (d) W.beauty += d.beauty;
    }
    W.beauty = Math.round(W.beauty * (1 + (W.perk.beauty || 0)));
    W.mul.petal *= 1 + W.beauty / 400;
    W.month = new Date(now).getMonth();
    W.mkey = monthKey(now);
    W.tokens = (W.ft[W.mkey] || 0) - (W.fs[W.mkey] || 0);
    return W;
  }

  // ---------- 장식, 요리 목록 ----------
  const DECOR_LIST = [];
  D.DECOR.forEach((list, a) => list.forEach((d, i) => DECOR_LIST.push({ id: `d${a}_${i}`, name: d[0], sprite: d[1], beauty: d[2], colors: d[3], area: a, cost: Math.round(60 * costPow(a) * (1 + i * 0.5)) })));
  D.FEST_DECOR.forEach((d, m) => DECOR_LIST.push({ id: `f${m}`, name: d[0], sprite: d[1], beauty: d[2], colors: d[3], month: m, tokens: 30 }));
  const DECOR_MAP = {};
  DECOR_LIST.forEach((d) => { DECOR_MAP[d.id] = d; });
  function decorById(id) { return DECOR_MAP[id]; }

  const RECIPE_LIST = [];
  D.RECIPES.forEach((list, a) => list.forEach((r, i) => RECIPE_LIST.push({
    id: `r${a}_${i}`, name: r[0], sprite: r[1], area: a, idx: i,
    needs: r[2].map(([k, n]) => [a * 8 + k, n]),
  })));
  const RECIPE_MAP = {};
  RECIPE_LIST.forEach((r) => { RECIPE_MAP[r.id] = r; });

  // ---------- 화분 ----------
  function plotKeys(W, a) {
    const n = W.plots[a] || 0;
    const out = [];
    for (let i = 0; i < n; i++) out.push(`${a}:${i}`);
    return out;
  }
  function plantAt(W, pk) {
    const rec = W.pl[pk];
    if (!rec) return null;
    const [sid, t] = rec;
    const key = `${pk}:${t}`;
    if (W.hv[key]) return null;
    const sp = SP[sid];
    if (!sp) return null;
    const nd = need(sp, W);
    const idleMs = Math.max(0, Math.min(W.now - t, W.capH * 3600000));
    const idle = (W.idlePerMin * idleMs) / 60000;
    const tapG = W.gr[key] || 0;
    const g = Math.min(nd, tapG + idle);
    const frac = g / nd;
    const stage = frac >= 1 ? 4 : frac >= 0.66 ? 3 : frac >= 0.33 ? 2 : frac >= 0.08 ? 1 : 0;
    return { pk, key, sid, sp, t, need: nd, g, frac, stage, ready: frac >= 1, idle };
  }

  // ---------- 할 일 (이야기 퀘스트) ----------
  const TOOL_T = [8, 24, 44, 64, 84, 104, 124, 144, 164, 184, 204, 224];
  const ORDER_T = [2, 5, 9, 14, 20, 27, 35, 44, 54, 65, 77, 90];
  function areaHarvest(W, a) { let n = 0; for (let k = 0; k < 8; k++) n += W.hc[a * 8 + k] || 0; return n; }
  function areaKinds(W, a) { let n = 0; for (let k = 0; k < 8; k++) if (W.hc[a * 8 + k]) n++; return n; }
  function areaVariant(W, a, min) { for (let k = 0; k < 8; k++) if ((W.vr[a * 8 + k] || 0) >> min) return 1; return 0; }
  function anyVariant(W, v) { for (const k in W.vr) if ((W.vr[k] >> v) & 1) return 1; return 0; }
  function totalHarvest(W) { let n = 0; for (const k in W.hc) n += W.hc[k]; return n; }
  function distinctCooked(W) { return Object.keys(W.ck).filter((k) => W.ck[k] > 0).length; }
  function rsTotal(W) { let n = 0; for (const k in W.rs) n += W.rs[k]; return n; }
  function maxAff(W) { let m = 0; for (let a = 0; a < NA; a++) m = Math.max(m, affLevel(W.af[a] || 0)); return m; }

  const SPECIAL = [
    { text: "꽃 스무 송이 피우기", f: (W) => [totalHarvest(W), 20] },
    { text: "연구 1단계 올리기", f: (W) => [rsTotal(W), 1] },
    { text: "하트 받기 3단계 깨기", f: (W) => [W.mg.catch || 0, 3] },
    { text: "숙련 별 여섯 개", f: (W) => [W.stars, 6] },
    { text: "서로 다른 요리 다섯 가지", f: (W) => [distinctCooked(W), 5] },
    { text: "아름다움 30", f: (W) => [W.beauty, 30] },
    { text: "친구 하나와 우정 5단계", f: (W) => [maxAff(W), 5] },
    { text: "밤에 꽃 열 송이 피우기", f: (W) => [W.nh, 10] },
    { text: "금빛 꽃 피우기", f: (W) => [anyVariant(W, 2) || anyVariant(W, 3), 1] },
    { text: "숙련 별 마흔 개", f: (W) => [W.stars, 40] },
    { text: "무지개 꽃 피우기", f: (W) => [anyVariant(W, 3), 1] },
    { text: "둘이 같은 날 온 날 7일", f: (W) => [W.bothDays, 7] },
  ];

  function mainQuests(a) {
    const ch = ST.CHAPTERS[a];
    const sp0 = SP[a * 8];
    const rec = RECIPE_LIST[a * 3];
    const q = [
      { kind: "harvest", text: `${sp0.name} 세 송이 피우기`, f: (W) => [W.hc[sp0.id] || 0, 3] },
      { kind: "plot", text: "땅 한 칸 더 일구기", f: (W) => [W.plots[a] || 1, 2] },
      { kind: "tool", text: `도구 단계 합 ${TOOL_T[a]}`, f: (W) => [W.toolSum, TOOL_T[a]], diary: 0 },
      { kind: "kinds", text: `${D.AREAS[a].name} 꽃 네 가지 피우기`, f: (W) => [areaKinds(W, a), 4] },
      { kind: "pet", text: `${ch.npc} 쓰다듬기 서른 번`, f: (W) => [W.af[a] || 0, 30] },
      { kind: "build", text: `${D.AREAS[a].bld} 1단계`, f: (W) => [W.bld[a] || 0, 1] },
      { kind: "cook", text: `${rec.name} 만들기`, f: (W) => [W.ck[rec.id] || 0, 1], diary: 1 },
      { kind: "variant", text: `${D.AREAS[a].name}에서 은빛 이상 꽃 피우기`, f: (W) => [areaVariant(W, a, 1), 1] },
      { kind: "build", text: `${D.AREAS[a].bld} 2단계`, f: (W) => [W.bld[a] || 0, 2] },
      { kind: "special", text: SPECIAL[a].text, f: SPECIAL[a].f },
      { kind: "orders", text: `주문 ${ORDER_T[a]}개 끝내기`, f: (W) => [W.od, ORDER_T[a]] },
      { kind: "boss", text: "큰 봉오리 피우기", f: (W) => [Math.min(W.boss[a] || 0, bossHp(a)), bossHp(a)], boss: true },
      { kind: "build", text: `${D.AREAS[a].bld} 완성`, f: (W) => [W.bld[a] || 0, 3], diary: 2, last: true },
    ];
    return q.map((x, i) => Object.assign(x, {
      id: `m${a}_${i + 1}`, area: a, n: i + 1, line: ch.quests[i],
      reward: { petals: Math.round(E.valBase * areaPow(a) * (6 + i * 2)), hearts: i % 3 === 2 ? 2 + a : 0, shards: x.last ? 5 : x.boss ? 3 + Math.floor(a / 2) : 0 },
    }));
  }
  const MAIN = [];
  for (let a = 0; a < NA; a++) MAIN.push(mainQuests(a));

  // 지금 해야 할 이야기 할 일 (차례대로 하나씩)
  function currentQuest(W) {
    for (let a = 0; a < NA; a++) {
      for (const q of MAIN[a]) {
        if (!W.q[q.id]) {
          const [cur, need] = q.f(W);
          return Object.assign({}, q, { cur, need, done: cur >= need });
        }
      }
    }
    return null;
  }

  // 곁 이야기: 친구 부탁 세 개씩
  const ERRANDS = [];
  for (let a = 0; a < NA; a++) {
    const names = ST.ERRANDS[a];
    const sp4 = SP[a * 8 + 4];
    const rec2 = RECIPE_LIST[a * 3 + 2];
    ERRANDS.push([
      { id: `e${a}_1`, area: a, text: names[0], goal: `${D.AREAS[a].name} 꽃 ${15 + a * 3}송이`, f: (W) => [areaHarvest(W, a), 15 + a * 3] },
      { id: `e${a}_2`, area: a, text: names[1], goal: `${sp4.name} ${6 + a}송이`, f: (W) => [W.hc[sp4.id] || 0, 6 + a] },
      { id: `e${a}_3`, area: a, text: names[2], goal: `${rec2.name} 두 번 만들기`, f: (W) => [W.ck[rec2.id] || 0, 2] },
    ].map((e, i) => Object.assign(e, { reward: { hearts: 3 + a, aff: 25, petals: Math.round(E.valBase * areaPow(a) * (8 + i * 4)) } })));
  }

  // ---------- 업적 ----------
  const ACH = [];
  function ach(group, name, desc, list, f, shards) {
    list.forEach((t, i) => ACH.push({ id: `${group}${i}`, group, name: name[i] || name[name.length - 1], desc: desc(t), f: (W) => [f(W), t], shards: shards ? shards(i) : 1 + i }));
  }
  function fmtK(n) { return n >= 10000 ? n / 10000 + "만" : n >= 1000 ? n / 1000 + "천" : String(n); }
  ach("tp", ["톡톡", "손가락 요정", "부지런한 손", "정원의 손", "멈추지 않는 손", "전설의 손가락", "백만 번의 손길"], (t) => `${fmtK(t)}번 돌보기`, [100, 1000, 10000, 50000, 100000, 500000, 1000000], (W) => W.tp);
  ach("hv", ["첫 꽃", "꽃 백 송이", "꽃밭 주인", "꽃 천 송이", "꽃의 바다", "만 송이 정원"], (t) => `꽃 ${fmtK(t)}송이 피우기`, [10, 100, 500, 1000, 3000, 10000], (W) => totalHarvest(W));
  ach("dc", ["새싹 수집가", "꽃 이름 박사", "도감 반", "꽃 사전", "정원 백과", "모든 꽃을 아는 둘"], (t) => `꽃 ${t}종 피우기`, [8, 24, 48, 72, 96, 120], (W) => W.discovered);
  ach("vs", ["은빛 손님", "은빛 수집", "은빛 정원", "은하수"], (t) => `은빛 꽃 ${t}송이`, [1, 10, 50, 200], (W) => W.vc[1]);
  ach("vg", ["금빛 손님", "금빛 수집", "황금 정원"], (t) => `금빛 꽃 ${t}송이`, [1, 10, 50], (W) => W.vc[2], (i) => 2 + i * 2);
  ach("vr", ["무지개를 본 날", "무지개 수집", "무지개 정원"], (t) => `무지개 꽃 ${t}송이`, [1, 5, 20], (W) => W.vc[3], (i) => 3 + i * 3);
  ach("st", ["첫 별", "별 쉰 개", "별 백오십", "별 삼백", "별의 정원"], (t) => `숙련 별 ${t}개`, [10, 50, 150, 300, 600], (W) => W.stars);
  ach("od", ["꽃 배달부", "단골 가게", "동네 꽃집", "꽃마루 꽃집"], (t) => `주문 ${t}개`, [10, 50, 200, 500], (W) => W.od);
  ach("ck", ["첫 요리", "부엌 단골", "요리사"], (t) => `요리 ${t}번`, [10, 50, 200], (W) => Object.keys(W.ck).reduce((n, k) => n + W.ck[k], 0));
  ach("cr", ["레시피 완성"], () => "모든 요리 한 번씩", [RECIPE_LIST.length], (W) => distinctCooked(W), () => 6);
  ach("bd", ["목수", "건축가", "정원 재건"], (t) => `건물 ${t}단계`, [4, 18, 36], (W) => Object.keys(W.bld).reduce((n, k) => n + W.bld[k], 0), (i) => 2 + i * 2);
  ach("bs", ["첫 봉오리", "봉오리 넷", "봉오리 여덟", "봉오리 열둘"], (t) => `큰 봉오리 ${t}개`, [1, 4, 8, 12], (W) => MAIN.filter((m, a) => (W.boss[a] || 0) >= bossHp(a)).length, (i) => 2 + i);
  ach("be", ["꾸미기 시작", "예쁜 정원", "그림 같은 정원"], (t) => `아름다움 ${t}`, [50, 150, 300], (W) => W.beauty);
  ach("af", ["단짝", "친구 넷", "친구 여덟", "모두의 친구"], (t) => `우정 10단계 친구 ${t}명`, [1, 4, 8, 12], (W) => { let n = 0; for (let a = 0; a < NA; a++) if (affLevel(W.af[a] || 0) >= 10) n++; return n; }, (i) => 2 + i);
  ach("mg", ["놀이 시작", "놀이 고수", "놀이 달인"], (t) => `놀이 단계 ${t}개`, [10, 25, 50], (W) => W.mgStages);
  ach("fe", ["첫 축제", "축제 셋", "축제 여섯", "일 년 축제"], (t) => `축제 ${t}번 참여`, [1, 3, 6, 12], (W) => Object.keys(W.ft).filter((k) => W.ft[k] >= 10).length, (i) => 2 + i);
  ach("tg", ["같이 온 날", "일주일", "한 달", "백 일", "이백 일", "일 년"], (t) => `둘이 같은 날 온 날 ${t}일`, [3, 7, 30, 100, 200, 365], (W) => W.bothDays, (i) => 1 + i);
  ach("dr", ["첫 쪽", "일기 열두 쪽", "일기 스물넷", "달래의 일기 전부"], (t) => `일기 ${t}쪽 찾기`, [3, 12, 24, 36], (W) => diaryCount(W), (i) => 2 + i);
  ach("sk", ["반짝", "반짝반짝", "별똥별 사냥꾼"], (t) => `반짝이 ${fmtK(t)}개 잡기`, [10, 100, 1000], (W) => W.spk);
  ach("cb", ["리듬", "박자 장인", "끝없는 연속"], (t) => `연속 ${t}`, [20, 40, 60], (W) => W.mc);
  ach("pt", ["쓰담쓰담", "쓰다듬기 장인", "손길 전문가"], (t) => `쓰다듬기 ${fmtK(t)}번`, [1000, 10000, 100000], (W) => W.tc.pet || 0);
  ach("rs", ["연구 시작", "연구원", "박사"], (t) => `연구 ${t}단계`, [10, 50, 100], (W) => rsTotal(W), (i) => 2 + i);
  ach("tl", ["도구 손질", "도구 장인", "전설의 도구"], (t) => `도구 단계 합 ${t}`, [50, 150, 300], (W) => W.toolSum);
  ach("nt", ["밤 정원사", "올빼미 정원사"], (t) => `밤에 꽃 ${t}송이`, [50, 500], (W) => W.nh);

  function diaryCount(W) {
    let n = 0;
    for (let a = 0; a < NA; a++) MAIN[a].forEach((q) => { if (q.diary != null && W.q[q.id]) n++; });
    return n;
  }

  // ---------- 주문 ----------
  function order(W, slot) {
    const gen = W.og[slot] || 0;
    const r = rng(`o${slot}:${gen}`);
    const pool = SP.filter((s) => !s.season && s.area <= W.maxArea && (W.hc[s.id] || 0) > 0);
    if (!pool.length) pool.push(SP[0]);
    // 새 정원 꽃이 더 자주 나와요
    pool.sort((a, b) => b.area - a.area || a.k - b.k);
    const lines = 1 + Math.floor(r() * Math.min(3, pool.length));
    const used = new Set();
    const items = [];
    for (let i = 0; i < lines; i++) {
      const idx = Math.floor(Math.pow(r(), 1.6) * pool.length);
      const sp = pool[idx];
      if (used.has(sp.id)) continue;
      used.add(sp.id);
      items.push([`c${sp.id}`, 1 + Math.floor(r() * (2 + Math.min(4, sp.area)))]);
    }
    const cooked = RECIPE_LIST.filter((rc) => rc.area <= W.maxArea && (W.ck[rc.id] || 0) > 0);
    if (cooked.length && r() < 0.25) items.push([`k${cooked[Math.floor(r() * cooked.length)].id}`, 1]);
    let val = 0;
    items.forEach(([k, n]) => {
      if (k[0] === "c") val += baseValue(SP[Number(k.slice(1))], W) * n;
      else val += RECIPE_MAP[k.slice(1)].needs.reduce((s, [sid, m]) => s + baseValue(SP[sid], W) * m, 0) * 2;
    });
    const who = ["우편냥", "이웃 할머니", "꽃집 주인", "옆 마을 아이", "결혼식 손님", "카페 사장님", "학교 선생님", "등대지기", "제빵사", "산책하는 강아지"][Math.floor(r() * 10)];
    return { slot, gen, items, who, petals: Math.round(val * 2.2 * W.mul.order), hearts: 1 + Math.floor(items.length / 2) + (r() < 0.2 ? 1 : 0) };
  }
  function canFill(W, o) { return o.items.every(([k, n]) => (W.inv[k] || 0) >= n); }

  // ---------- 행동 ----------
  // 모든 행동은 내 기록장 mine 만 고치고, 바뀐 걸 바로 W 에도 반영해요.
  function spend(W, mine, petals) {
    if (W.petals < petals) return false;
    mine.ps += petals; W.petals -= petals;
    return true;
  }
  function gainPetals(W, mine, n) { mine.pe += n; W.petals += n; }
  function gainHearts(W, mine, n) { mine.he += n; W.hearts += n; }
  function gainShards(W, mine, n) { mine.se += n; W.shards += n; }
  function invAdd(W, mine, k, n) { addTo(mine.inv, k, n); addTo(W.inv, k, n); }

  function markDay(W, mine, n) {
    const k = dayKey(W.now);
    mine.dy[k] = (mine.dy[k] || 0) + (n || 1);
  }

  // 누르기: 성장 g 만큼. 원하는 걸 맞추면 3배, 연속이면 더.
  function tap(W, mine, pk, care, state) {
    const p = plantAt(W, pk);
    if (!p || p.ready) return null;
    const lv = W.toolLv[care] || 1;
    let g = toolPow(lv) * W.mul.tap;
    const match = state && state.want === care;
    let combo = (state && state.combo) || 0;
    if (match) { combo = Math.min(W.comboMax, combo + 1); g *= E.want * (1 + combo * E.comboStep); }
    else combo = Math.max(0, combo - 3);
    g = Math.max(1, g);
    const add = Math.min(g, p.need - p.g);
    addTo(mine.gr, p.key, add); addTo(W.gr, p.key, add);
    mine.tp++; W.tp++;
    addTo(mine.tc, care, 1); addTo(W.tc, care, 1);
    if (combo > mine.mc) mine.mc = combo;
    if (combo > W.mc) W.mc = combo;
    markDay(W, mine, 1);
    // 물보라: 같은 정원 다른 꽃도 조금
    if (W.mul.splash > 0) {
      const a = Number(pk.split(":")[0]);
      plotKeys(W, a).forEach((k2) => {
        if (k2 === pk) return;
        const q = plantAt(W, k2);
        if (!q || q.ready) return;
        const s = Math.min(g * W.mul.splash, q.need - q.g);
        addTo(mine.gr, q.key, s); addTo(W.gr, q.key, s);
      });
    }
    const after = plantAt(W, pk);
    return { g: add, match, combo, stage: after.stage, before: p.stage, ready: after.ready, frac: after.frac };
  }

  function rollVariant(W, rnd) {
    const r = rnd();
    const L = W.mul.luck;
    if (r < E.rainbow * L) return 3;
    if (r < (E.rainbow + E.gold) * L) return 2;
    if (r < (E.rainbow + E.gold + E.silver) * L) return 1;
    return 0;
  }

  function harvest(W, mine, pk, rnd) {
    const p = plantAt(W, pk);
    if (!p || !p.ready) return null;
    const v = rollVariant(W, rnd || Math.random);
    mine.hv[p.key] = 1; W.hv[p.key] = 1;
    const sid = p.sid;
    const beforeStars = masteryStars(W.hc[sid] || 0);
    const first = !(W.hc[sid] || 0);
    addTo(mine.hc, sid, 1); addTo(W.hc, sid, 1);
    mine.vr[sid] = (mine.vr[sid] || 0) | (1 << v); W.vr[sid] = (W.vr[sid] || 0) | (1 << v);
    mine.vc[v] = (mine.vc[v] || 0) + 1; W.vc[v]++;
    mine.hvn++; W.hvn++;
    const night = isNight(W.now);
    if (night) { mine.nh++; W.nh++; }
    let petals = baseValue(p.sp, W) * D.VARIANT_MULT[v] * W.mul.petal * (night ? 1 + (W.perk.night || 0) : 1);
    petals = Math.round(petals);
    gainPetals(W, mine, petals);
    invAdd(W, mine, `c${sid}`, 1);
    let tokens = 0;
    if (p.sp.season) {
      tokens = 1 + v;
      addTo(mine.ft, W.mkey, tokens); addTo(W.ft, W.mkey, tokens);
      W.tokens += tokens;
    }
    const afterStars = masteryStars(W.hc[sid]);
    if (afterStars > beforeStars) { W.stars += afterStars - beforeStars; W.shards += afterStars - beforeStars; }
    if (first) W.discovered++;
    // 다시 심기
    let replanted = false;
    if (mine.auto && canPlant(W, p.sp)) {
      const c = seedCost(p.sp, W);
      if (W.petals >= c) { plant(W, mine, pk, sid); replanted = true; }
    }
    return { sid, sp: p.sp, v, petals, first, star: afterStars > beforeStars ? afterStars : 0, tokens, replanted, night };
  }

  function canPlant(W, sp) {
    if (sp.season) return sp.month === W.month;
    if (sp.area > W.maxArea) return false;
    return speciesOpen(W, sp);
  }
  // 정원 안에서 꽃이 하나씩 열려요: 앞 꽃을 몇 번 피우면 다음 꽃
  function speciesOpen(W, sp) {
    if (sp.season) return sp.month === W.month;
    if (sp.area > W.maxArea) return false;
    if (sp.rare) return (W.bld[sp.area] || 0) >= 2;
    if (sp.k === 0) return true;
    const prev = SP[sp.area * 8 + sp.k - 1];
    return (W.hc[prev.id] || 0) >= Math.min(3, 1 + Math.floor(sp.k / 2));
  }

  function plant(W, mine, pk, sid) {
    const sp = SP[sid];
    if (!sp || !canPlant(W, sp)) return false;
    const cur = plantAt(W, pk);
    if (cur) return false;
    const c = seedCost(sp, W);
    if (!spend(W, mine, c)) return false;
    // 같은 밀리초에 두 번 심어도 열쇠가 겹치지 않게
    let t = W.now;
    const old = W.pl[pk];
    if (old && old[1] >= t) t = old[1] + 1;
    mine.pl[pk] = [sid, t]; W.pl[pk] = [sid, t];
    pruneMine(W, mine);
    return true;
  }
  // 지난 꽃들의 기록은 지워서 기록장을 가볍게
  function pruneMine(W, mine) {
    const live = new Set();
    for (const pk in W.pl) live.add(`${pk}:${W.pl[pk][1]}`);
    for (const k in mine.gr) if (!live.has(k)) delete mine.gr[k];
    for (const k in mine.hv) if (!live.has(k)) delete mine.hv[k];
  }

  function buyPlot(W, mine, a) {
    const n = W.plots[a] || 1;
    if (n >= 6 || a > W.maxArea) return false;
    if (!spend(W, mine, plotCost(a, n))) return false;
    mine.plots[a] = n + 1; W.plots[a] = n + 1;
    return true;
  }
  function upgradeTool(W, mine, care) {
    const lv = W.toolLv[care];
    if (!spend(W, mine, toolCost(lv))) return false;
    addTo(mine.tl, care, 1); addTo(W.tl, care, 1);
    W.toolLv[care]++; W.toolSum++;
    return true;
  }
  function build(W, mine, a) {
    const s = W.bld[a] || 0;
    if (s >= 3 || a > W.maxArea) return false;
    const c = bldCost(a, s);
    if (W.petals < c.petals || W.hearts < c.hearts) return false;
    spend(W, mine, c.petals);
    mine.hs += c.hearts; W.hearts -= c.hearts;
    mine.bld[a] = s + 1; W.bld[a] = s + 1;
    return true;
  }
  function research(W, mine, key) {
    const r = D.RESEARCH.find((x) => x.key === key);
    const lv = W.rs[key] || 0;
    if (!r || lv >= r.max) return false;
    const c = researchCost(lv);
    if (W.shards < c) return false;
    mine.ss += c; W.shards -= c;
    addTo(mine.rs, key, 1); addTo(W.rs, key, 1);
    return true;
  }
  function canCook(W, rc) { return rc.area <= W.maxArea && rc.needs.every(([sid, n]) => (W.inv[`c${sid}`] || 0) >= n); }
  function cook(W, mine, rid) {
    const rc = RECIPE_MAP[rid];
    if (!rc || !canCook(W, rc)) return false;
    rc.needs.forEach(([sid, n]) => invAdd(W, mine, `c${sid}`, -n));
    invAdd(W, mine, `k${rid}`, 1);
    addTo(mine.ck, rid, 1); addTo(W.ck, rid, 1);
    return true;
  }
  // 요리를 친구에게 주면 우정이 쑥
  function giveDish(W, mine, a, rid) {
    if ((W.inv[`k${rid}`] || 0) < 1) return false;
    invAdd(W, mine, `k${rid}`, -1);
    const rc = RECIPE_MAP[rid];
    const pts = rc.area === a ? 30 : 15;
    addTo(mine.af, a, pts); addTo(W.af, a, pts);
    gainHearts(W, mine, 1);
    return pts;
  }
  function pet(W, mine, a, n) {
    addTo(mine.af, a, n || 1); addTo(W.af, a, n || 1);
    addTo(mine.tc, "pet", n || 1); addTo(W.tc, "pet", n || 1);
    mine.tp += n || 1; W.tp += n || 1;
    markDay(W, mine, n || 1);
    return affLevel(W.af[a]);
  }
  function bossHit(W, mine, a, care, state) {
    const hp = bossHp(a);
    const cur = W.boss[a] || 0;
    if (cur >= hp) return null;
    let g = toolPow(W.toolLv[care] || 1) * W.mul.tap * W.mul.boss;
    const match = state && state.want === care;
    let combo = (state && state.combo) || 0;
    if (match) { combo = Math.min(W.comboMax, combo + 1); g *= E.want * (1 + combo * E.comboStep); } else combo = Math.max(0, combo - 3);
    const add = Math.min(Math.max(1, g), hp - cur);
    addTo(mine.boss, a, add); addTo(W.boss, a, add);
    mine.tp++; W.tp++;
    addTo(mine.tc, care, 1); addTo(W.tc, care, 1);
    markDay(W, mine, 1);
    return { add, hp, cur: cur + add, done: cur + add >= hp, match, combo };
  }
  function bossOpen(W, a) {
    return a <= W.maxArea && MAIN[a].slice(0, 11).every((q) => W.q[q.id]);
  }
  function fillOrder(W, mine, slot) {
    const o = order(W, slot);
    if (!canFill(W, o)) return null;
    o.items.forEach(([k, n]) => invAdd(W, mine, k[0] === "c" ? k : k, -n));
    gainPetals(W, mine, o.petals);
    gainHearts(W, mine, o.hearts);
    mine.od++; W.od++;
    addTo(mine.og, slot, 1); addTo(W.og, slot, 1);
    return o;
  }
  function skipOrder(W, mine, slot) {
    addTo(mine.og, slot, 1); addTo(W.og, slot, 1);
    return true;
  }
  function giveReward(W, mine, r) {
    if (!r) return;
    if (r.petals) gainPetals(W, mine, r.petals);
    if (r.hearts) gainHearts(W, mine, r.hearts);
    if (r.shards) gainShards(W, mine, r.shards);
  }
  function claimQuest(W, mine, q) {
    if (!q || W.q[q.id]) return false;
    const [cur, need] = q.f(W);
    if (cur < need) return false;
    mine.q[q.id] = 1; W.q[q.id] = 1;
    giveReward(W, mine, q.reward);
    if (q.reward && q.reward.aff) { addTo(mine.af, q.area, q.reward.aff); addTo(W.af, q.area, q.reward.aff); }
    if (q.last) {
      const before = W.maxArea;
      W.maxArea = Math.max(W.maxArea, Math.min(NA - 1, q.area + 1));
      if (W.maxArea > before) W.plots[W.maxArea] = Math.max(1, W.plots[W.maxArea] || 0);
      if (q.area === NA - 1) W.finished = true;
    }
    return true;
  }
  // 이야기를 처음 열 때 받는 덤 (꽃잎 조금, 첫 장)
  function claimFlag(W, mine, id, r) {
    if (W.q[id]) return false;
    mine.q[id] = 1; W.q[id] = 1;
    giveReward(W, mine, r);
    return true;
  }
  function claimAch(W, mine, a) {
    if (W.ac[a.id]) return false;
    const [cur, t] = a.f(W);
    if (cur < t) return false;
    mine.ac[a.id] = 1; W.ac[a.id] = 1;
    gainShards(W, mine, a.shards);
    return true;
  }
  function buyDecor(W, mine, id) {
    const d = DECOR_MAP[id];
    if (!d) return false;
    if (d.month != null) {
      if (d.month !== W.month || W.tokens < d.tokens) return false;
      addTo(mine.fs, W.mkey, d.tokens); addTo(W.fs, W.mkey, d.tokens); W.tokens -= d.tokens;
    } else {
      if (d.area > W.maxArea) return false;
      if (!spend(W, mine, d.cost)) return false;
    }
    invAdd(W, mine, `o${id}`, 1);
    return true;
  }
  function placedCount(W, id) { let n = 0; for (const k in W.deco) if (W.deco[k][0] === id) n++; return n; }
  function placeDecor(W, mine, a, slot, id) {
    const k = `${a}:${slot}`;
    if (id) {
      const owned = W.inv[`o${id}`] || 0;
      const cur = W.deco[k] && W.deco[k][0] === id ? 1 : 0;
      if (owned - placedCount(W, id) + cur < 1) return false;
    }
    let t = W.now;
    if (W.deco[k] && W.deco[k][1] >= t) t = W.deco[k][1] + 1;
    mine.deco[k] = [id || "", t]; W.deco[k] = [id || "", t];
    return true;
  }
  function sparkle(W, mine, a) {
    const n = plotKeys(W, a).length;
    let total = 0;
    plotKeys(W, a).forEach((pk) => {
      const p = plantAt(W, pk);
      if (!p || p.ready) return;
      const g = Math.min(W.avgPow * W.mul.tap * 8 * W.mul.sparkle, p.need - p.g);
      addTo(mine.gr, p.key, g); addTo(W.gr, p.key, g);
      total += g;
    });
    const petals = Math.round(baseValue(SP[a * 8], W) * 0.5 * W.mul.sparkle * W.mul.petal);
    gainPetals(W, mine, petals);
    mine.spk++; W.spk++;
    return { petals, total, n };
  }
  // 놀이 결과: 단계 깨면 기록, 꽃잎은 매번
  function miniResult(W, mine, game, stage, cleared) {
    const best = W.mg[game] || 0;
    let first = false;
    if (cleared && stage > best) {
      mine.mg[game] = stage; W.mg[game] = stage; W.mgStages += stage - best; W.shards += stage - best;
      first = true;
    }
    const petals = Math.round(baseValue(SP[W.maxArea * 8], W) * (cleared ? 2 + stage : 1));
    gainPetals(W, mine, petals);
    return { petals, first };
  }
  function festSwap(W, mine, kind) {
    // 축제 토큰 10개 → 하트 3개
    if (kind === "hearts" && W.tokens >= 10) {
      addTo(mine.fs, W.mkey, 10); addTo(W.fs, W.mkey, 10); W.tokens -= 10;
      gainHearts(W, mine, 3);
      return true;
    }
    return false;
  }
  const FEST_STEPS = [
    { n: 5, text: "축제 꽃 토큰 5개", reward: { hearts: 5 } },
    { n: 20, text: "축제 꽃 토큰 20개", reward: { shards: 3 } },
    { n: 50, text: "축제 꽃 토큰 50개", reward: { hearts: 10 } },
    { n: 100, text: "축제 꽃 토큰 100개", reward: { shards: 8 } },
  ];
  function festQuests(W) {
    return FEST_STEPS.map((s, i) => ({ id: `f${W.mkey}_${i}`, text: s.text, reward: s.reward, f: (W2) => [W2.ft[W2.mkey] || 0, s.n] }));
  }

  root.GCore = {
    E, world, emptyDoc, normDoc, dayKey, monthKey, isNight, hash, rng,
    need, baseValue, seedCost, toolPow, toolCost, plotCost, bldCost, bossHp, researchCost, affLevel, masteryStars,
    plotKeys, plantAt, currentQuest, MAIN, ERRANDS, ACH, DECOR_LIST, DECOR_MAP, RECIPE_LIST, RECIPE_MAP,
    order, canFill, canPlant, speciesOpen, canCook, bossOpen, placedCount, festQuests, diaryCount, areaHarvest, areaKinds, totalHarvest,
    tap, harvest, plant, buyPlot, upgradeTool, build, research, cook, giveDish, pet, bossHit, fillOrder, skipOrder,
    claimQuest, claimFlag, claimAch, buyDecor, placeDecor, sparkle, miniResult, festSwap, markDay,
  };
})(typeof window !== "undefined" ? window : globalThis);
