// ============================================================
// 같이 키우기 게임
// - 물 주기, 쓰다듬기, 비료, 벌레 잡기, 잡초 뽑기, 수확, 도감, 도전, 화분 꾸미기
// - 모든 행동은 저장소의 garden 묶음에 "일어난 일" 한 줄씩 쌓여요.
//   식물 상태는 그 기록을 처음부터 다시 계산해서 구해요. 그래서 두 폰이 동시에 눌러도 서로 안 지워져요.
// - 하트 코인은 기록, 일기, 할 거, 질문, 하트, 게임으로 모이고 비료와 화분에 써요.
// ============================================================
(function () {
  "use strict";

  const cfg = typeof DIARY_CONFIG !== "undefined" ? DIARY_CONFIG : {};
  const WHO = { him: cfg.him || "석영", her: cfg.her || "예은" };
  const HOUR = 3600000;
  const DAY = 86400000;
  const $ = (id) => document.getElementById(id);

  // ---------- 식물 종류 ----------
  const SPECIES = {
    sunflower: { name: "해바라기", shape: "flower", P: "#ffd978", Q: "#f5b94e", C: "#9a6a3f", F: "#6e5340", speed: 1, unlock: 0 },
    tulip: { name: "튤립", shape: "tulip", P: "#ff86ad", Q: "#f06796", C: "#ffd978", F: "#ff86ad", speed: 0.9, unlock: 0 },
    strawberry: { name: "딸기", shape: "bush", P: "#ffffff", Q: "#ffe9ad", C: "#ffd978", F: "#e8505b", speed: 1.1, unlock: 1 },
    tomato: { name: "토마토", shape: "bush", P: "#ffd978", Q: "#f5b94e", C: "#f5b94e", F: "#e8604b", speed: 1.2, unlock: 2 },
    rose: { name: "장미", shape: "rose", P: "#e8505b", Q: "#b83a46", C: "#f06796", F: "#e8505b", speed: 1.3, unlock: 3 },
    cactus: { name: "선인장", shape: "cactus", P: "#ff9ec0", Q: "#f06796", C: "#ffd978", F: "#ff9ec0", speed: 1, unlock: 4 },
    clover: { name: "네잎클로버", shape: "clover", P: "#ffffff", Q: "#e3f3dc", C: "#86cc86", F: "#5fae6a", speed: 0.8, unlock: 5 },
    cherry: { name: "벚꽃나무", shape: "tree", P: "#ffc4d6", Q: "#ff9ec0", C: "#ffd6e3", F: "#e8505b", speed: 1.5, unlock: 6 },
    apple: { name: "사과나무", shape: "tree", P: "#ffffff", Q: "#ffd6e3", C: "#ffe9ad", F: "#e8505b", speed: 1.6, unlock: 7 },
    rainbow: { name: "무지개꽃", shape: "rainbow", P: "#ff86ad", Q: "#7fb2e5", C: "#ffd978", F: "#b39ddb", speed: 1.4, unlock: "all" },
  };
  const ORDER = Object.keys(SPECIES);
  const STAGE_NAMES = ["씨앗", "새싹", "떡잎", "꽃봉오리", "꽃", "열매"];
  const STEPS = [0, 12, 36, 75, 130, 200];
  const POTS = {
    basic: { name: "기본", price: 0, O: "#d9875a", o: "#b96b44", R: "#ec9f73", H: "#d9875a" },
    sky: { name: "하늘", price: 20, O: "#8ec5ee", o: "#6aa6d4", R: "#b5dbf7", H: "#ffffff" },
    heart: { name: "하트", price: 30, O: "#ff9ec0", o: "#f06796", R: "#ffc4d6", H: "#ffffff" },
    gold: { name: "금빛", price: 60, O: "#ffd978", o: "#e0b040", R: "#fff0b0", H: "#ffffff" },
  };
  const LEVEL_TITLES = ["", "씨앗 커플", "새싹 커플", "떡잎 커플", "꽃봉오리 커플", "꽃 커플", "열매 커플", "나무 커플", "숲 커플", "무지개 커플"];
  const LIMIT = { water: 3, care: 8, careGap: 30 * 60000, fert: 2, fertCost: 10 };

  // ---------- 그림: 식물 ----------
  function plantRows(sp, stage, thirsty) {
    const W = 15, H = 17;
    const g = [];
    for (let y = 0; y < H; y++) g.push(new Array(W).fill("."));
    const set = (x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = c; };
    const cx = 7;
    const base = H - 1;
    const stem = (h, x) => { for (let i = 0; i < h; i++) set(x == null ? cx : x, base - i, "T"); return base - h + 1; };
    const leafPair = (y, wide) => {
      set(cx - 1, y, "G"); set(cx + 1, y, "G");
      if (wide) { set(cx - 2, y - 1, "G"); set(cx + 2, y - 1, "G"); set(cx - 2, y, "D"); set(cx + 2, y, "D"); }
    };
    const blob = (x0, y0, r, c, c2) => {
      for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
        if (x * x + y * y <= r * r + r * 0.6) set(x0 + x, y0 + y, c2 && (x + y) % 3 === 0 ? c2 : c);
      }
    };
    const flowerHead = (x, y, big) => {
      const r = big ? 3 : 2;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const d = Math.abs(dx) + Math.abs(dy);
        if (d <= r + (big ? 1 : 0) && !(Math.abs(dx) === r && Math.abs(dy) === r)) set(x + dx, y + dy, (dx + dy) % 2 ? "Q" : "P");
      }
      blob(x, y, big ? 1 : 0, "C");
    };
    if (stage === 0) {
      set(cx, base, "S"); set(cx - 1, base, "S"); set(cx + 1, base, "s"); set(cx, base - 1, "s");
      return g.map((r) => r.join(""));
    }
    if (stage === 1) {
      const top = stem(2);
      set(cx - 1, top, "G"); set(cx - 2, top - 1, "G"); set(cx + 1, top, "G"); set(cx + 2, top - 1, "G");
      return finish(g, thirsty, 0);
    }
    switch (sp.shape) {
      case "bush": {
        const h = [0, 0, 3, 4, 5, 6][stage];
        for (let y = 0; y < h; y++) {
          const half = Math.min(6, 2 + Math.floor(y * 1.2));
          for (let x = -half; x <= half; x++) set(cx + x, base - (h - 1 - y) - 0, (x + y) % 4 === 0 ? "D" : "G");
        }
        set(cx, base, "T");
        const dots = [[-3, -3], [2, -4], [4, -2], [-5, -1], [0, -2], [-1, -5], [3, -1]];
        if (stage === 3) dots.slice(0, 3).forEach(([x, y]) => set(cx + x, base + y, "Q"));
        if (stage >= 4) dots.slice(0, stage === 5 ? 3 : 5).forEach(([x, y]) => { set(cx + x, base + y, "P"); });
        if (stage === 5) dots.slice(2).forEach(([x, y]) => { set(cx + x, base + y, "F"); set(cx + x + 1, base + y, "F"); set(cx + x, base + y - 1, "D"); });
        break;
      }
      case "cactus": {
        const h = [0, 0, 5, 8, 9, 10][stage];
        for (let i = 0; i < h; i++) { set(cx - 1, base - i, "G"); set(cx, base - i, "D"); set(cx + 1, base - i, "G"); }
        if (stage >= 3) { for (let i = 0; i < 3; i++) { set(cx - 3, base - 3 - i, "G"); set(cx + 3, base - 5 - i, "G"); } set(cx - 2, base - 3, "G"); set(cx + 2, base - 5, "G"); }
        for (let i = 1; i < h; i += 2) { set(cx - 2, base - i, "W"); set(cx + 2, base - i - 1, "W"); }
        const top = base - h;
        if (stage === 3) set(cx, top, "Q");
        if (stage >= 4) { set(cx, top, "C"); set(cx - 1, top, "P"); set(cx + 1, top, "P"); set(cx, top - 1, "P"); }
        if (stage === 5) { set(cx - 3, base - 6, "P"); set(cx + 3, base - 8, "P"); set(cx + 3, base - 9, "C"); }
        break;
      }
      case "clover": {
        const spots = stage === 2 ? [[0, -3]] : stage === 3 ? [[-3, -3], [2, -4]] : [[-4, -3], [0, -5], [4, -3], [-2, -1]];
        spots.forEach(([x, y], i) => {
          set(cx + x, base, "T"); for (let k = 0; k > y; k--) set(cx + x, base + k, "T");
          const four = stage === 5 && i === 1;
          set(cx + x - 1, base + y, "G"); set(cx + x + 1, base + y, "G"); set(cx + x, base + y - 1, "G");
          if (four) { set(cx + x, base + y + 1, "G"); set(cx + x, base + y, "W"); } else set(cx + x, base + y, "D");
        });
        if (stage >= 4) { set(cx + 2, base - 7, "P"); set(cx + 3, base - 7, "Q"); set(cx + 2, base - 8, "Q"); set(cx + 3, base - 8, "P"); for (let k = 1; k < 7; k++) set(cx + 2, base - k, "T"); }
        break;
      }
      case "tree": {
        const trunk = [0, 0, 4, 6, 7, 7][stage];
        for (let i = 0; i < trunk; i++) { set(cx, base - i, "B"); if (stage >= 4) set(cx + 1, base - i, "B"); }
        const r = [0, 0, 2, 3, 5, 5][stage];
        const cy = base - trunk - r + 1;
        blob(cx + (stage >= 4 ? 0.5 : 0) | 0, cy, r, "G", "D");
        if (stage >= 4) {
          for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
            if ((x * 7 + y * 5 + 40) % 5 === 0 && g[cy + y] && g[cy + y][cx + x] && g[cy + y][cx + x] !== ".") set(cx + x, cy + y, stage === 5 && (x + y) % 2 ? "F" : "P");
          }
        }
        break;
      }
      default: {
        // flower, tulip, rose, rainbow
        const h = [0, 0, 5, 8, 10, 10][stage];
        const top = stem(h);
        leafPair(base - 2, stage >= 3);
        if (stage >= 3) leafPair(base - 5, false);
        if (sp.shape === "rose") { set(cx + 1, base - 3, "W"); set(cx - 1, base - 6, "W"); }
        if (stage === 2) { set(cx - 1, top, "G"); set(cx + 1, top, "G"); }
        if (stage === 3) { set(cx, top - 1, "Q"); set(cx - 1, top, "G"); set(cx + 1, top, "G"); set(cx, top - 2, "P"); }
        if (stage >= 4) {
          if (sp.shape === "tulip") {
            for (let y = 0; y < 3; y++) for (let x = -2; x <= 2; x++) set(cx + x, top - 1 - y, (x === 0 && y === 2) || (Math.abs(x) === 2 && y === 0) ? "." : (x + y) % 2 ? "Q" : "P");
            set(cx - 1, top - 4, "P"); set(cx + 1, top - 4, "P");
          } else if (sp.shape === "rose") {
            blob(cx, top - 2, 2, "P", "Q");
            set(cx, top - 2, "C"); set(cx - 1, top - 3, "Q");
          } else {
            flowerHead(cx, top - 3, sp.shape === "flower");
          }
          if (stage === 5) {
            if (sp.shape === "flower") { blob(cx, top - 3, 1, "F"); set(cx, top - 3, "C"); }
            else {
              for (let i = 0; i < 6; i++) set(cx + 4, base - i, "T");
              set(cx + 3, base - 3, "G");
              if (sp.shape === "tulip") { set(cx + 3, base - 7, "P"); set(cx + 4, base - 7, "Q"); set(cx + 5, base - 7, "P"); set(cx + 4, base - 6, "P"); }
              else { set(cx + 3, base - 7, "P"); set(cx + 4, base - 7, "C"); set(cx + 5, base - 7, "P"); set(cx + 4, base - 8, "Q"); set(cx + 4, base - 6, "P"); }
            }
          }
        }
      }
    }
    return finish(g, thirsty, 0);
  }
  function finish(g, thirsty) {
    let rows = g.map((r) => r.join(""));
    if (thirsty) {
      // 목마르면 윗부분이 한쪽으로 처져요.
      rows = rows.map((r, y) => (y < 9 ? "." + r.slice(0, -1) : r));
    }
    return rows;
  }
  function potRows(skin) {
    const heart = skin === "heart";
    const gold = skin === "gold";
    const sky = skin === "sky";
    return [
      "...KKKKKKKKK...",
      "..RRRRRRRRRRR..",
      "..OOOOOOOOOOO..",
      heart ? "...OOOHOHOOO..." : gold ? "...OOHOOOHOO..." : sky ? "...OHOOOOOHO..." : "...OOOOOOOOO...",
      heart ? "...OOOOHOOOO..." : sky ? "...OOOOHOOOO..." : "...OOOOOOOOO...",
      "....ooooooo....",
    ];
  }
  function plantColors(sp, thirsty, skin) {
    const pot = POTS[skin] || POTS.basic;
    const c = {
      T: thirsty ? "#a8b86a" : "#66b46e",
      G: thirsty ? "#b8c96a" : "#86cc86",
      D: thirsty ? "#9aab55" : "#5fae6a",
      B: "#9a785a",
      S: "#9a785a", s: "#c99a6e",
      W: "#ffffff",
      P: sp.P, Q: sp.Q, C: sp.C, F: sp.F,
      K: "#7a5a40", R: pot.R, O: pot.O, o: pot.o, H: pot.H,
    };
    return c;
  }
  function plantSvg(speciesKey, stage, opts) {
    opts = opts || {};
    const sp = SPECIES[speciesKey] || SPECIES.sunflower;
    let rows = plantRows(sp, stage, opts.thirsty);
    if (speciesKey === "rainbow" && stage >= 4) {
      // 무지개꽃은 꽃잎 색을 줄마다 바꿔요.
      const bands = ["P", "Q", "C", "F"];
      rows = rows.map((r, y) => r.replace(/[PQ]/g, () => bands[y % 4]));
    }
    if (opts.pot !== false) rows = rows.concat(potRows(opts.skin));
    return PIXEL.draw(rows, plantColors(sp, opts.thirsty, opts.skin), opts.scale || 3, "px px-sprite plant-svg");
  }

  // ---------- 계산 ----------
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function dayKey(ms) {
    const d = new Date(ms);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  function levelOf(xp) {
    return Math.max(1, Math.floor((1 + Math.sqrt(1 + xp / 5)) / 2));
  }
  function xpFor(level) {
    return 20 * level * (level - 1);
  }
  function stepsFor(sp) {
    return STEPS.map((x) => Math.round(x * sp.speed));
  }

  // 모든 기록을 처음부터 다시 계산해요.
  function compute(nowMs) {
    const now = nowMs || Date.now();
    const evs = Store.list("garden").slice().sort((a, b) => (a.at || 0) - (b.at || 0) || String(a.id).localeCompare(String(b.id)));
    const harvested = [];
    let plant = null;
    let skin = "basic";
    const ownedPots = new Set(["basic"]);
    let spent = 0;
    const st = { water: 0, care: 0, bugs: 0, weeds: 0, growth: 0, togetherDays: new Set(), actedDays: new Set() };
    const dayActs = {}; // 날짜 → { him, her }
    function newPlant(ev) {
      const sp = SPECIES[ev.species] ? ev.species : "sunflower";
      return {
        id: ev.plant, species: sp, at: ev.at, growth: 0, lastWater: ev.at - 7.5 * HOUR,
        counts: {}, lastCare: {}, ferts: {}, caught: new Set(), pulled: new Set(), acted: {},
      };
    }
    for (const ev of evs) {
      if (ev.type === "spend") { spent += Number(ev.amount) || 0; if (String(ev.item || "").indexOf("pot:") === 0) ownedPots.add(ev.item.slice(4)); continue; }
      if (ev.type === "pot") { if (POTS[ev.item]) skin = ev.item; continue; }
      if (ev.type === "seed") { if (!plant) plant = newPlant(ev); continue; }
      if (!plant || ev.plant !== plant.id) continue;
      if (ev.type === "harvest") { harvested.push({ species: plant.species, at: ev.at, id: plant.id }); st.growth += 0; plant = null; continue; }
      const day = dayKey(ev.at);
      const who = ev.who;
      const cnt = (plant.counts[day + who] = plant.counts[day + who] || { water: 0, care: 0 });
      const level = Math.max(0, Math.min(100, 100 - ((ev.at - plant.lastWater) / HOUR) * 4));
      let gain = 0;
      let counted = false;
      if (ev.type === "water") {
        if (who === "sky") gain = 2;
        else if (cnt.water < LIMIT.water) { cnt.water++; gain = level < 85 ? 6 : 1; counted = true; st.water++; }
        plant.lastWater = ev.at;
      } else if (ev.type === "care") {
        const lastC = plant.lastCare[who] || 0;
        if (cnt.care < LIMIT.care && ev.at - lastC >= LIMIT.careGap) { cnt.care++; gain = level < 20 ? 1 : 3; counted = true; st.care++; plant.lastCare[who] = ev.at; }
      } else if (ev.type === "fert") {
        plant.ferts[day] = (plant.ferts[day] || 0) + 1;
        if (plant.ferts[day] <= LIMIT.fert) gain = 25;
        counted = true;
      } else if (ev.type === "bug") {
        if (!plant.caught.has(ev.slot)) { plant.caught.add(ev.slot); gain = 2; st.bugs++; counted = true; }
      } else if (ev.type === "weed") {
        if (!plant.pulled.has(ev.slot)) { plant.pulled.add(ev.slot); gain = 2; st.weeds++; counted = true; }
      }
      if (counted && (who === "him" || who === "her")) {
        const a = (dayActs[day] = dayActs[day] || {});
        if (!a[who]) {
          a[who] = true;
          if (a.him && a.her) { st.togetherDays.add(day); gain += 10; }
        }
        st.actedDays.add(day);
      }
      plant.growth += gain;
      st.growth += gain;
    }
    // 처음 들어온 적이 없다면 첫 씨앗을 기다리는 중이에요.
    let cur = null;
    if (plant) {
      const sp = SPECIES[plant.species];
      const steps = stepsFor(sp);
      let stage = 0;
      steps.forEach((need, i) => { if (plant.growth >= need) stage = i; });
      const water = Math.max(0, Math.min(100, Math.round(100 - ((now - plant.lastWater) / HOUR) * 4)));
      // 벌레: 6시간마다, 잡초: 하루마다 나올 수 있어요. 두 폰에서 똑같이 보이게 정해진 규칙으로 정해요.
      const bugs = [];
      const weeds = [];
      if (stage >= 1) {
        const maxSlot = Math.floor((now - plant.at) / (6 * HOUR));
        for (let k = Math.max(1, maxSlot - 3); k <= maxSlot; k++) {
          if (hash(plant.id + ":b" + k) % 10 < 4 && !plant.caught.has(k)) bugs.push(k);
        }
        const maxDay = Math.floor((now - plant.at) / DAY);
        for (let k = Math.max(1, maxDay - 2); k <= maxDay; k++) {
          if (hash(plant.id + ":w" + k) % 10 < 4 && !plant.pulled.has(k)) weeds.push(k);
        }
      }
      const cares24 = Object.keys(plant.lastCare).length ? Store.list("garden").filter((e) => e.plant === plant.id && e.type === "care" && now - e.at < DAY).length : 0;
      const today = dayActs[dayKey(now)] || {};
      const love = Math.min(100, cares24 * 15 + (today.him && today.her ? 25 : 0) + (water > 30 ? 10 : 0));
      cur = {
        id: plant.id, species: plant.species, sp, growth: plant.growth, stage, steps,
        next: steps[stage + 1] == null ? null : steps[stage + 1],
        prev: steps[stage],
        water, thirsty: water < 30, love, bugs: bugs.slice(-3), weeds: weeds.slice(-2),
        ready: stage === 5,
        counts: plant.counts, ferts: plant.ferts, lastCare: plant.lastCare,
      };
    }
    // 하트 코인
    const entries = Store.list("entries").length;
    const diary = Store.list("diary").length;
    const plansDone = Store.list("plans").filter((p) => p.done).length;
    let answers = 0;
    let questBoth = 0;
    Store.pairKeys("q:").forEach((k) => {
      const a = Store.pair(k, "him"), b = Store.pair(k, "her");
      answers += (a ? 1 : 0) + (b ? 1 : 0);
      if (a && b) questBoth++;
    });
    let hearts = 0;
    Store.pairKeys("p:").forEach((k) => { hearts += (Number(Store.pair(k, "him")) || 0) + (Number(Store.pair(k, "her")) || 0); });
    const book = {};
    harvested.forEach((h) => { book[h.species] = (book[h.species] || 0) + 1; });
    const stats = {
      water: st.water, care: st.care, bugs: st.bugs, weeds: st.weeds, harvests: harvested.length, book: Object.keys(book).length,
      together: st.togetherDays.size, entries, diary, questBoth, hearts, plansDone,
    };
    const ach = ACHIEVEMENTS.map((a) => {
      const v = stats[a.stat] || 0;
      return { id: a.id, title: a.title, target: a.target, value: Math.min(v, a.target), done: v >= a.target, reward: a.reward };
    });
    const achCoins = ach.filter((a) => a.done).reduce((s, a) => s + a.reward, 0);
    const earned = entries * 5 + diary * 5 + plansDone * 3 + answers * 2 + Math.floor(hearts / 10) + st.bugs * 3 + st.weeds * 2 + harvested.length * 20 + achCoins;
    const xp = st.growth + earned;
    const level = levelOf(xp);
    // 연속으로 같이 돌본 날
    let streak = 0;
    const d = new Date(now);
    d.setHours(12, 0, 0, 0);
    if (!st.togetherDays.has(dayKey(d.getTime()))) d.setDate(d.getDate() - 1);
    while (st.togetherDays.has(dayKey(d.getTime()))) { streak++; d.setDate(d.getDate() - 1); }
    const unlocked = ORDER.filter((k) => {
      const u = SPECIES[k].unlock;
      if (u === "all") return ORDER.filter((x) => x !== "rainbow").every((x) => book[x]);
      return harvested.length >= u;
    });
    return {
      plant: cur, harvested, book, skin, ownedPots, coins: earned - spent, earned, spent, xp, level,
      levelTitle: LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length - 1)] || "전설의 커플",
      levelFrom: xpFor(level), levelTo: xpFor(level + 1), stats, ach, streak, today: dayActs[dayKey(now)] || {},
      unlocked, nextPlantId: "p" + (harvested.length + 1), hasSeed: evs.some((e) => e.type === "seed"),
    };
  }

  const ACHIEVEMENTS = [
    { id: "water10", title: "물 10번 주기", stat: "water", target: 10, reward: 10 },
    { id: "care20", title: "쓰다듬기 20번", stat: "care", target: 20, reward: 15 },
    { id: "together3", title: "같이 돌본 날 3일", stat: "together", target: 3, reward: 20 },
    { id: "bug5", title: "벌레 5마리 잡기", stat: "bugs", target: 5, reward: 15 },
    { id: "weed5", title: "잡초 5개 뽑기", stat: "weeds", target: 5, reward: 10 },
    { id: "harvest1", title: "첫 수확", stat: "harvests", target: 1, reward: 20 },
    { id: "record10", title: "기록 10개", stat: "entries", target: 10, reward: 30 },
    { id: "diary7", title: "일기 7개", stat: "diary", target: 7, reward: 25 },
    { id: "quest7", title: "질문 둘 다 답한 날 7일", stat: "questBoth", target: 7, reward: 30 },
    { id: "heart100", title: "하트 100개 보내기", stat: "hearts", target: 100, reward: 20 },
    { id: "plans5", title: "할 거 5개 해내기", stat: "plansDone", target: 5, reward: 20 },
    { id: "water50", title: "물 50번 주기", stat: "water", target: 50, reward: 30 },
    { id: "together14", title: "같이 돌본 날 14일", stat: "together", target: 14, reward: 60 },
    { id: "book3", title: "도감 3종 모으기", stat: "book", target: 3, reward: 30 },
    { id: "harvest5", title: "5번 수확", stat: "harvests", target: 5, reward: 50 },
    { id: "book10", title: "도감 완성", stat: "book", target: 10, reward: 200 },
  ];

  // ---------- 화면 ----------
  let H = null; // app.js 가 넘겨주는 도구 (toast, burstAt, play, silently, whoAsk, esc, onChanged)
  let tab = "care";
  let lastState = null;
  let busy = false;

  function me() {
    return Store.me();
  }
  function ensureSeed() {
    const s = compute();
    if (!s.hasSeed) H.silently(() => Store.put("garden", { id: "seed-p1", type: "seed", plant: "p1", species: "sunflower", who: me() || "him", at: Date.now() }));
  }
  function add(rec) {
    return H.silently(() => Store.put("garden", Object.assign({ who: me(), at: Date.now() }, rec)));
  }
  function bar(cls, pct) {
    return `<div class="bar ${cls}"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></div>`;
  }
  function mark(who, s) {
    return `<span class="who ${who}${s.today[who] ? " done" : ""}">${H.esc(WHO[who])}${s.today[who] ? PIXEL.icon("tick", 2) : ""}</span>`;
  }
  function myCount(s, kind) {
    const p = s.plant;
    if (!p) return 0;
    const c = p.counts[dayKey(Date.now()) + me()];
    return c ? c[kind] : 0;
  }

  function renderCare(s) {
    const p = s.plant;
    if (!p) return renderSeedPick(s);
    const toNext = p.next == null ? 100 : ((p.growth - p.prev) / (p.next - p.prev)) * 100;
    const waterLeft = LIMIT.water - myCount(s, "water");
    const fertToday = p.ferts[dayKey(Date.now())] || 0;
    return `
      <div class="g-main">
        <div class="g-view" id="gView">
          <div class="g-sun"></div>
          <div class="g-plant${p.thirsty ? " thirsty" : ""}" id="gPlant">${plantSvg(p.species, p.stage, { thirsty: p.thirsty, skin: s.skin, scale: 5 })}</div>
          ${p.bugs.map((k, i) => `<button class="g-bug" data-bug="${k}" style="--i:${i}" aria-label="벌레 잡기">${PIXEL.sprite("bug", 4)}</button>`).join("")}
          ${p.weeds.map((k, i) => `<button class="g-weed" data-weed="${k}" style="--i:${i}" aria-label="잡초 뽑기">${PIXEL.sprite("weed", 4)}</button>`).join("")}
          ${p.ready ? '<span class="g-ready">다 컸어요!</span>' : ""}
          <div class="g-fx" id="gFx"></div>
        </div>
        <div class="g-stats">
          <p class="g-name">${H.esc(p.sp.name)} <i>${STAGE_NAMES[p.stage]}</i></p>
          <div class="g-row">${PIXEL.icon("drop", 2)}<span>물</span>${bar("water" + (p.thirsty ? " low" : ""), p.water)}</div>
          <div class="g-row">${PIXEL.icon("heart", 2)}<span>사랑</span>${bar("love", p.love)}</div>
          <div class="g-row">${PIXEL.icon("leaf", 2)}<span>성장</span>${bar("grow", toNext)}</div>
          <p class="g-tog">${mark("him", s)}${mark("her", s)}${s.streak ? `<i>${s.streak}일 연속</i>` : ""}</p>
        </div>
      </div>
      <div class="g-actions">
        <button class="btn g-act" data-g="water">${PIXEL.icon("drop", 2)}물 <i>${Math.max(0, waterLeft)}</i></button>
        <button class="btn g-act" data-g="care">${PIXEL.icon("hand", 2)}쓰담</button>
        ${p.ready
          ? `<button class="btn g-act primary" data-g="harvest">${PIXEL.icon("basket", 2)}수확</button>`
          : `<button class="btn g-act" data-g="fert"${s.coins < LIMIT.fertCost || fertToday >= LIMIT.fert ? " disabled" : ""}>${PIXEL.icon("sack", 2)}비료 <i>${LIMIT.fertCost}</i></button>`}
      </div>`;
  }
  function renderSeedPick(s) {
    return `<p class="g-pick-title">다음에 심을 씨앗을 골라요</p>
      <div class="g-seeds">${ORDER.map((k) => {
        const open = s.unlocked.includes(k);
        return `<button class="g-seed${open ? "" : " locked"}" data-seed="${k}"${open ? "" : " disabled"}>
          ${open ? plantSvg(k, 4, { scale: 2, pot: false }) : PIXEL.icon("lock", 3)}
          <b>${open ? H.esc(SPECIES[k].name) : "???"}</b>
          ${open ? "" : `<i>${SPECIES[k].unlock === "all" ? "도감 완성" : `수확 ${SPECIES[k].unlock}번`}</i>`}
        </button>`;
      }).join("")}</div>`;
  }
  function renderBook(s) {
    return `<div class="g-book">${ORDER.map((k) => {
      const n = s.book[k] || 0;
      return `<div class="g-card${n ? "" : " unknown"}">
        ${plantSvg(k, 5, { scale: 2, pot: false })}
        <b>${n ? H.esc(SPECIES[k].name) : "???"}</b><i>${n ? "×" + n : ""}</i>
      </div>`;
    }).join("")}</div>
    <p class="g-sub">도감 ${s.stats.book} / ${ORDER.length}</p>`;
  }
  function renderGoal(s) {
    const pots = Object.keys(POTS).map((k) => {
      const owned = s.ownedPots.has(k);
      const on = s.skin === k;
      return `<button class="g-pot${on ? " on" : ""}" data-pot="${k}"${!owned && s.coins < POTS[k].price ? " disabled" : ""}>
        ${PIXEL.draw(potRows(k), plantColors(SPECIES.sunflower, false, k), 3)}
        <b>${POTS[k].name}</b><i>${on ? "사용 중" : owned ? "고르기" : PIXEL.icon("coin", 2) + POTS[k].price}</i>
      </button>`;
    }).join("");
    const list = s.ach.slice().sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0)).map((a) => `
      <div class="g-ach${a.done ? " done" : ""}">
        <span class="g-ach-ico">${PIXEL.icon(a.done ? "trophy" : "star", 2)}</span>
        <span class="g-ach-t">${H.esc(a.title)}</span>
        <span class="g-ach-v">${a.done ? "완료" : `${a.value}/${a.target}`}</span>
        <span class="g-ach-r">${PIXEL.icon("coin", 2)}${a.reward}</span>
      </div>`).join("");
    return `<p class="g-sub">화분 꾸미기</p><div class="g-pots">${pots}</div><p class="g-sub">도전</p><div class="g-achs">${list}</div>`;
  }

  function render() {
    const body = $("gardenBody");
    if (!body || !H) return;
    if (!me()) { body.innerHTML = H.whoAsk(); return; }
    ensureSeed();
    const s = compute();
    lastState = s;
    const head = `<div class="g-top">
        <span class="g-lv"><b>Lv.${s.level}</b> ${H.esc(s.levelTitle)}</span>
        <span class="g-coins">${PIXEL.icon("coin", 2)}<b id="gCoins">${s.coins}</b></span>
      </div>${bar("xp", ((s.xp - s.levelFrom) / Math.max(1, s.levelTo - s.levelFrom)) * 100)}`;
    body.innerHTML = head + (tab === "book" ? renderBook(s) : tab === "goal" ? renderGoal(s) : renderCare(s));
    document.querySelectorAll("#gardenTabs .chip").forEach((c) => c.classList.toggle("active", c.dataset.gtab === tab));
    checkAchievements(s);
  }

  // 새로 끝낸 도전은 이 폰에서 한 번만 축하해요.
  function checkAchievements(s) {
    let seen;
    try { seen = JSON.parse(localStorage.getItem("hsd.ach") || "null"); } catch (e) { seen = null; }
    const done = s.ach.filter((a) => a.done).map((a) => a.id);
    if (!seen) { try { localStorage.setItem("hsd.ach", JSON.stringify(done)); } catch (e) { /* 무시 */ } return; }
    const fresh = done.filter((id) => !seen.includes(id));
    if (!fresh.length) return;
    const a = s.ach.find((x) => x.id === fresh[0]);
    H.toast(`도전 완료: ${a.title} +${a.reward}`);
    H.burstAt($("gardenBody"), 12);
    try { localStorage.setItem("hsd.ach", JSON.stringify(done)); } catch (e) { /* 무시 */ }
  }

  function floatText(text, cls) {
    const fx = $("gFx");
    if (!fx) return;
    const el = document.createElement("span");
    el.className = "g-float " + (cls || "");
    el.innerHTML = text;
    el.addEventListener("animationend", () => el.remove());
    fx.appendChild(el);
  }
  function rain(fx, kind, n) {
    if (!fx) return;
    for (let i = 0; i < n; i++) {
      const d = document.createElement("i");
      d.className = "g-" + kind;
      d.style.left = 40 + Math.random() * 20 + "%";
      d.style.animationDelay = i * 60 + "ms";
      d.addEventListener("animationend", () => d.remove());
      fx.appendChild(d);
    }
  }
  function afterAction(before, msgUp) {
    const after = compute();
    const p0 = before.plant, p1 = after.plant;
    render();
    const plantEl = $("gPlant");
    if (p0 && p1 && p1.stage > p0.stage) {
      if (plantEl) H.play(plantEl, "stage-up");
      H.burstAt(plantEl || $("gardenBody"), 16);
      H.toast(`쑥 자라서 ${STAGE_NAMES[p1.stage]}이 됐어요`);
      floatText("쑥!", "big");
    } else if (plantEl && msgUp) {
      H.play(plantEl, "boing");
    }
    if (after.level > before.level) {
      setTimeout(() => { H.toast(`Lv.${after.level} ${after.levelTitle} 달성!`); H.burstAt($("gardenBody"), 14, "heart"); }, 600);
    }
    if (H.onChanged) H.onChanged();
  }

  function act(kind, btn) {
    if (busy) return;
    const s = compute();
    const p = s.plant;
    if (!p && kind !== "seed") return;
    const fx = $("gFx");
    if (kind === "water") {
      const before = s;
      add({ type: "water", plant: p.id });
      const after = compute().plant;
      const gain = after.growth - p.growth;
      const can = document.createElement("span");
      can.className = "g-can";
      can.innerHTML = PIXEL.sprite("can", 4);
      fx.appendChild(can);
      can.addEventListener("animationend", () => can.remove());
      rain(fx, "drop", 8);
      busy = true;
      setTimeout(() => {
        busy = false;
        afterAction(before, true);
        floatText(gain > 0 ? `+${gain}` : myCount(compute(), "water") >= LIMIT.water && gain === 0 ? "오늘은 충분해요" : "배불러요", gain > 0 ? "" : "soft");
      }, 700);
      return;
    }
    if (kind === "care") {
      const before = s;
      add({ type: "care", plant: p.id });
      const gain = compute().plant.growth - p.growth;
      const plantEl = $("gPlant");
      if (plantEl) H.play(plantEl, "wiggle");
      const hand = document.createElement("span");
      hand.className = "g-hand";
      hand.innerHTML = PIXEL.icon("hand", 4);
      fx.appendChild(hand);
      hand.addEventListener("animationend", () => hand.remove());
      H.burstAt(plantEl || btn, 6, "heart");
      busy = true;
      setTimeout(() => {
        busy = false;
        afterAction(before, false);
        floatText(gain > 0 ? `+${gain}` : "좋아해요", gain > 0 ? "" : "soft");
      }, 650);
      return;
    }
    if (kind === "fert") {
      if (s.coins < LIMIT.fertCost) { H.toast("코인이 모자라요"); return; }
      const before = s;
      add({ type: "spend", amount: LIMIT.fertCost, item: "fert" });
      add({ type: "fert", plant: p.id });
      rain(fx, "grain", 10);
      H.burstAt($("gPlant") || btn, 10);
      busy = true;
      setTimeout(() => { busy = false; afterAction(before, true); floatText("+25"); }, 600);
      return;
    }
    if (kind === "harvest") {
      const plantEl = $("gPlant");
      if (plantEl) H.play(plantEl, "harvest");
      add({ id: "harvest-" + p.id, type: "harvest", plant: p.id, species: p.species });
      H.burstAt(plantEl || btn, 20);
      H.burstAt(plantEl || btn, 10, "heart");
      H.toast(`${p.sp.name} 수확! 도감에 담았어요 +20`);
      busy = true;
      setTimeout(() => { busy = false; render(); if (H.onChanged) H.onChanged(); }, 800);
    }
  }

  function bind(helpers) {
    H = helpers;
    ensureSeed();
    const panel = $("panel-garden");
    if (!panel) return;
    panel.addEventListener("click", (ev) => {
      const t = ev.target;
      const tabBtn = t.closest("[data-gtab]");
      if (tabBtn) { tab = tabBtn.dataset.gtab; render(); return; }
      const a = t.closest("[data-g]");
      if (a && !a.disabled) { H.play(a, "boing"); act(a.dataset.g, a); return; }
      const bug = t.closest("[data-bug]");
      if (bug) {
        const s = compute();
        if (!s.plant) return;
        const slot = Number(bug.dataset.bug);
        add({ id: `bug-${s.plant.id}-${slot}`, type: "bug", plant: s.plant.id, slot });
        bug.classList.add("squash");
        H.burstAt(bug, 6);
        setTimeout(() => { afterAction(s, false); floatText(`${PIXEL.icon("coin", 2)}+3`); }, 280);
        return;
      }
      const weed = t.closest("[data-weed]");
      if (weed) {
        const s = compute();
        if (!s.plant) return;
        const slot = Number(weed.dataset.weed);
        add({ id: `weed-${s.plant.id}-${slot}`, type: "weed", plant: s.plant.id, slot });
        weed.classList.add("pull");
        setTimeout(() => { afterAction(s, false); floatText(`${PIXEL.icon("coin", 2)}+2`); }, 320);
        return;
      }
      const seed = t.closest("[data-seed]");
      if (seed && !seed.disabled) {
        const s = compute();
        if (s.plant) return;
        add({ id: "seed-" + s.nextPlantId, type: "seed", plant: s.nextPlantId, species: seed.dataset.seed });
        tab = "care";
        render();
        H.burstAt($("gPlant") || seed, 10);
        H.toast(`${SPECIES[seed.dataset.seed].name} 씨앗을 심었어요`);
        if (H.onChanged) H.onChanged();
        return;
      }
      const pot = t.closest("[data-pot]");
      if (pot && !pot.disabled) {
        const s = compute();
        const k = pot.dataset.pot;
        if (!s.ownedPots.has(k)) {
          if (s.coins < POTS[k].price) { H.toast("코인이 모자라요"); return; }
          add({ type: "spend", amount: POTS[k].price, item: "pot:" + k });
          H.toast(`${POTS[k].name} 화분을 샀어요`);
        }
        add({ id: "pot", type: "pot", item: k });
        render();
        H.burstAt(pot, 8);
        if (H.onChanged) H.onChanged();
      }
    });
  }

  window.Garden = {
    bind,
    render,
    compute,
    plantSvg,
    setTab(t) { tab = t; },
    // 홈 화면 풍경에 넣을 작은 식물
    sceneSvg() {
      const s = compute();
      if (!s.plant) return { html: plantSvg("sunflower", 0, { scale: 2, skin: s.skin }), state: s };
      return { html: plantSvg(s.plant.species, s.plant.stage, { thirsty: s.plant.thirsty, skin: s.skin, scale: 2 }), state: s };
    },
    badge() {
      const s = lastState || compute();
      const p = s.plant;
      if (!p) return "씨앗";
      if (p.ready) return "수확!";
      if (p.thirsty) return "물!";
      if (p.bugs.length) return "벌레!";
      return "Lv." + s.level;
    },
    // 진짜 비가 오면 한 시간에 한 번 저절로 물을 줘요. (두 폰이 같이 줘도 하나로 합쳐져요)
    rain() {
      if (!H) return;
      const s = compute();
      if (!s.plant) return;
      const d = new Date();
      const id = `rain-${s.plant.id}-${dayKey(d.getTime())}-${d.getHours()}`;
      if (Store.get("garden", id)) return;
      H.silently(() => Store.put("garden", { id, type: "water", who: "sky", plant: s.plant.id, at: Date.now() }));
    },
    SPECIES,
  };
})();
