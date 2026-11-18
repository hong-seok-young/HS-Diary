// ============================================================
// 같이 키우기: 계산 담당
// 모든 행동은 저장소의 garden 묶음에 "일어난 일" 한 줄씩 쌓여요.
// 게임 상태는 그 기록을 시간 순서대로 처음부터 다시 계산해서 구해요.
// 그래서 두 폰이 동시에 눌러도 서로 지워지지 않아요.
// ============================================================
(function () {
  "use strict";

  const G = window.GameData;
  const HOUR = 3600000;
  const DAY = 86400000;
  const cfg = typeof DIARY_CONFIG !== "undefined" ? DIARY_CONFIG : {};

  // ---------- 그림: 식물 ----------
  function plantRows(sp, stage) {
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
      return g.map((r) => r.join(""));
    }
    switch (sp.shape) {
      case "bush": {
        const h = [0, 0, 3, 4, 5, 6][stage];
        for (let y = 0; y < h; y++) {
          const half = Math.min(6, 2 + Math.floor(y * 1.2));
          for (let x = -half; x <= half; x++) set(cx + x, base - (h - 1 - y), (x + y) % 4 === 0 ? "D" : "G");
        }
        set(cx, base, "T");
        const dots = [[-3, -3], [2, -4], [4, -2], [-5, -1], [0, -2], [-1, -5], [3, -1]];
        if (stage === 3) dots.slice(0, 3).forEach(([x, y]) => set(cx + x, base + y, "Q"));
        if (stage >= 4) dots.slice(0, stage === 5 ? 3 : 5).forEach(([x, y]) => set(cx + x, base + y, "P"));
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
        blob(cx, cy, r, "G", "D");
        if (stage >= 4) {
          for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
            if ((x * 7 + y * 5 + 40) % 5 === 0 && g[cy + y] && g[cy + y][cx + x] && g[cy + y][cx + x] !== ".") set(cx + x, cy + y, stage === 5 && (x + y) % 2 ? "F" : "P");
          }
        }
        break;
      }
      default: {
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
    return g.map((r) => r.join(""));
  }
  function potRows(skin) {
    const deco = { heart: ["...OOOHOHOOO...", "...OOOOHOOOO..."], gold: ["...OOHOOOHOO...", "...OOOOOOOOO..."], sky: ["...OHOOOOOHO...", "...OOOOHOOOO..."], mint: ["...OOHOOOHOO...", "...OHOOHOOHO..."] }[skin] || ["...OOOOOOOOO...", "...OOOOOOOOO..."];
    return ["...KKKKKKKKK...", "..RRRRRRRRRRR..", "..OOOOOOOOOOO..", deco[0], deco[1], "....ooooooo...."];
  }
  function plantSvg(speciesKey, stage, opts) {
    opts = opts || {};
    const sp = G.SPECIES[speciesKey] || G.SPECIES.sunflower;
    let rows = plantRows(sp, stage);
    if (opts.thirsty || opts.wilted) rows = rows.map((r, y) => (y < 9 ? "." + r.slice(0, -1) : r));
    if (speciesKey === "rainbow" && stage >= 4) {
      const bands = ["P", "Q", "C", "F"];
      rows = rows.map((r, y) => r.replace(/[PQ]/g, () => bands[y % 4]));
    }
    if (opts.staked && stage >= 2) rows = rows.map((r, y) => (y >= 8 && r[11] === "." ? r.slice(0, 11) + "X" + r.slice(12) : r));
    if (opts.pot !== false) rows = rows.concat(potRows(opts.skin));
    const pot = G.POTS[opts.skin] || G.POTS.basic;
    const wilt = opts.wilted;
    const thirsty = opts.thirsty;
    const colors = {
      T: wilt ? "#a38c5a" : thirsty ? "#a8b86a" : "#66b46e",
      G: wilt ? "#c9b47a" : thirsty ? "#b8c96a" : "#86cc86",
      D: wilt ? "#a8935e" : thirsty ? "#9aab55" : "#5fae6a",
      B: "#9a785a", S: "#9a785a", s: "#c99a6e", W: "#ffffff", X: "#c99a6e",
      P: wilt ? "#c9a58a" : sp.P, Q: wilt ? "#b8957a" : sp.Q, C: sp.C, F: sp.F,
      K: "#7a5a40", R: pot.R, O: pot.O, o: pot.o, H: pot.H,
    };
    return PIXEL.draw(rows, colors, opts.scale || 3, "px px-sprite plant-svg");
  }

  // ---------- 도구 ----------
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function dayKey(ms) {
    const d = new Date(ms);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  function weekKey(ms) {
    const d = new Date(ms);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // 월요일
    return dayKey(d.getTime());
  }
  function levelOf(xp) {
    return Math.max(1, Math.floor((1 + Math.sqrt(1 + xp / 5)) / 2));
  }
  function xpFor(level) {
    return 20 * level * (level - 1);
  }
  function plantIdFor(plot, n) {
    return plot === 0 ? "p" + n : `P${plot}-${n}`;
  }
  function missionsFor(day) {
    const pool = G.MISSIONS.slice();
    const out = [];
    let h = hash("m:" + day);
    while (out.length < 3 && pool.length) {
      const i = h % pool.length;
      out.push(pool.splice(i, 1)[0]);
      h = hash(String(h));
    }
    return out;
  }
  function weeklyFor(week) {
    const pool = G.WEEKLY.slice();
    const out = [];
    let h = hash("w:" + week);
    while (out.length < 3 && pool.length) {
      out.push(pool.splice(h % pool.length, 1)[0]);
      h = hash(String(h));
    }
    return out;
  }

  // ---------- 다시 계산하기 ----------
  let cache = { key: "", state: null };
  function compute(nowMs) {
    const now = nowMs || Date.now();
    const evs = Store.list("garden").slice().sort((a, b) => (a.at || 0) - (b.at || 0) || String(a.id).localeCompare(String(b.id)));
    const key = evs.length + ":" + (evs.length ? evs[evs.length - 1].t + evs[evs.length - 1].id : "") + ":" + Math.floor(now / 60000) + ":" + Store.list("entries").length + ":" + Store.list("diary").length + ":" + Store.pairKeys("").length + ":" + Store.list("plans").filter((p) => p.done).length;
    if (cache.key === key && cache.state) return cache.state;

    const inv = Object.assign({}, G.STARTER);
    const add = (k, n) => { inv[k] = (inv[k] || 0) + n; };
    const has = (k, n) => (inv[k] || 0) >= (n || 1);
    const plots = [];
    for (let i = 0; i < 9; i++) plots.push({ idx: i, plant: null, skin: "basic", harvests: 0 });
    const plants = {};
    const harvested = [];
    const ownedSkins = new Set(["basic"]);
    const decorSlots = {};
    const gifts = {};
    const snaps = [];
    const log = [];
    const claimed = new Set();
    let spent = 0;
    let pet = null;
    const minis = {};
    const dayStats = {};
    const st = { water: 0, care: 0, sing: 0, bugs: 0, weeds: 0, growth: 0, cooks: 0, recipeSet: new Set(), gifts: 0, minis: 0, miniBest: 0, snaps: 0, eats: 0, gold: 0 };
    const DS = (day) => (dayStats[day] = dayStats[day] || { water: 0, care: 0, sing: 0, pest: 0, mini: 0, pet: 0, cook: 0, gift: 0, acted: {} });
    let earnedGame = 0;

    function newPlant(ev, plot) {
      const sp = G.SPECIES[ev.species] ? ev.species : "sunflower";
      return {
        id: ev.plant, plot, species: sp, at: ev.at, growth: 0, lastWater: ev.at - 7.5 * HOUR,
        counts: {}, lastCare: {}, lastSing: {}, ferts: {}, caught: new Set(), pulled: new Set(), sprays: [], tonicUntil: 0,
        staked: false, pruned: new Set(), name: "", careCount: 0, together: new Set(), wilts: 0, thirsts: 0, acts: {},
      };
    }
    function rate(p, t) { return t < p.tonicUntil ? 2 : 4; }
    function levelAt(p, t) { return Math.max(0, Math.min(100, 100 - ((t - p.lastWater) / HOUR) * rate(p, t))); }
    function wiltedAt(p, t) { return t - p.lastWater >= (t < p.tonicUntil ? 98 : 49) * HOUR; }
    function stageOf(p) {
      const steps = G.STEPS.map((x) => Math.round(x * G.SPECIES[p.species].speed));
      let s = 0;
      steps.forEach((need, i) => { if (p.growth >= need) s = i; });
      return s;
    }
    function acted(p, who, day) {
      if (who !== "him" && who !== "her") return 0;
      const a = (p.acts[day] = p.acts[day] || {});
      let bonus = 0;
      if (!a[who]) {
        a[who] = true;
        if (a.him && a.her && !p.together.has(day)) { p.together.add(day); bonus = 10; }
      }
      DS(day).acted[who] = true;
      return bonus;
    }
    function logIt(ev, text) {
      log.push({ at: ev.at, who: ev.who, text });
    }

    for (const ev of evs) {
      const day = dayKey(ev.at || 0);
      const who = ev.who;
      switch (ev.type) {
        case "buy": {
          spent += Number(ev.cost) || 0;
          const k = ev.item;
          if (!k) break;
          if (k.indexOf("skin:") === 0) ownedSkins.add(k.slice(5));
          else if (k.indexOf("pet:") === 0) { /* 동물 친구는 adopt 로 정해요 */ }
          else add(k, Number(ev.qty) || 1);
          logIt(ev, `${ev.label || k} 샀어요`);
          continue;
        }
        case "claim": {
          const r = G.LEVEL_REWARDS[ev.level];
          if (!r || claimed.has(ev.level)) continue;
          claimed.add(ev.level);
          Object.keys(r).forEach((k) => { if (k.indexOf("skin:") === 0) ownedSkins.add(k.slice(5)); else add(k, r[k]); });
          logIt(ev, `레벨 ${ev.level} 선물 받았어요`);
          continue;
        }
        case "skin": {
          if (ownedSkins.has(ev.item) && plots[ev.plot]) plots[ev.plot].skin = ev.item;
          continue;
        }
        case "decor": {
          decorSlots[ev.slot] = ev.item || "";
          continue;
        }
        case "adopt": {
          pet = { kind: ev.kind, name: ev.name || "", at: ev.at, lastFeed: ev.at, feeds: 0, plays: [], pats: [], xp: 0 };
          logIt(ev, `${ev.name || "동물 친구"}를 데려왔어요`);
          continue;
        }
        case "petfeed": case "petplay": case "petpat": {
          if (!pet) continue;
          if (ev.type === "petfeed") {
            const item = ev.item || "petfood";
            if (!has(item)) continue;
            add(item, -1);
            pet.lastFeed = ev.at; pet.feeds++; pet.xp += item === "petfood" ? 5 : 12;
          } else if (ev.type === "petplay") {
            if (pet.plays.length && ev.at - pet.plays[pet.plays.length - 1] < 20 * 60000) continue;
            pet.plays.push(ev.at); pet.xp += 3;
          } else {
            if (pet.pats.length && ev.at - pet.pats[pet.pats.length - 1] < 5 * 60000) continue;
            pet.pats.push(ev.at); pet.xp += 1;
          }
          DS(day).pet++;
          continue;
        }
        case "cook": {
          const r = G.RECIPES.find((x) => x.id === ev.recipe);
          if (!r) continue;
          const ok = Object.keys(r.needs).every((k) => has("pr:" + k, r.needs[k]));
          if (!ok) continue;
          Object.keys(r.needs).forEach((k) => add("pr:" + k, -r.needs[k]));
          add("dish:" + r.id, 1);
          st.cooks++; st.recipeSet.add(r.id); st.growth += r.xp;
          DS(day).cook++;
          logIt(ev, `${r.name} 만들었어요`);
          continue;
        }
        case "eat": {
          if (!has(ev.item)) continue;
          add(ev.item, -1);
          st.eats++; earnedGame += 5; st.growth += 8;
          logIt(ev, `같이 먹었어요`);
          continue;
        }
        case "gift": {
          if (!has(ev.item)) continue;
          add(ev.item, -1);
          gifts[ev.id] = { id: ev.id, from: who, to: ev.to, item: ev.item, msg: ev.msg || "", at: ev.at, opened: false };
          st.gifts++; DS(day).gift++;
          logIt(ev, `선물을 보냈어요`);
          continue;
        }
        case "open": {
          const g = gifts[ev.gift];
          if (!g || g.opened) continue;
          g.opened = true; g.openedAt = ev.at;
          earnedGame += 5; st.growth += 10;
          continue;
        }
        case "mini": {
          const m = (minis[ev.game] = minis[ev.game] || { best: 0, plays: 0, counted: {} });
          const score = Math.max(0, Number(ev.score) || 0);
          m.best = Math.max(m.best, score); m.plays++;
          st.minis++; st.miniBest = Math.max(st.miniBest, score);
          DS(day).mini++;
          const ck = day + who;
          if (!m.counted[ck]) {
            m.counted[ck] = true;
            const cap = (G.MINIGAMES.find((x) => x.id === ev.game) || { cap: 25 }).cap;
            earnedGame += Math.min(cap, Math.floor(score / 2));
          }
          logIt(ev, `${(G.MINIGAMES.find((x) => x.id === ev.game) || {}).name || "놀이"} ${score}점`);
          continue;
        }
        case "snap": {
          snaps.push({ id: ev.id, at: ev.at, who, species: ev.species, stage: ev.stage, skin: ev.skin, name: ev.name || "", plot: ev.plot });
          st.snaps++;
          continue;
        }
        case "seed": {
          const plot = Number(ev.plot) || 0;
          if (plots[plot] && !plots[plot].plant) {
            const p = newPlant(ev, plot);
            plots[plot].plant = p;
            plants[p.id] = p;
            logIt(ev, `${G.SPECIES[p.species].name} 씨앗을 심었어요`);
          }
          continue;
        }
      }
      // 식물에게 하는 행동
      const p = plants[ev.plant];
      if (!p || plots[p.plot].plant !== p) continue;
      const cnt = (p.counts[day + who] = p.counts[day + who] || { water: 0, care: 0, sing: 0 });
      const level = levelAt(p, ev.at);
      const wilted = wiltedAt(p, ev.at);
      const stage = stageOf(p);
      let gain = 0;
      let counted = false;
      switch (ev.type) {
        case "water":
          if (ev.at - p.lastWater > 25 * HOUR) p.thirsts++;
          if (wilted) p.wilts++;
          if (who === "sky") gain = 2;
          else if (cnt.water < 3) { cnt.water++; gain = wilted ? 2 : level < 85 ? 6 : 1; counted = true; st.water++; DS(day).water++; }
          p.lastWater = ev.at;
          if (counted) logIt(ev, `${G.SPECIES[p.species].name}에 물을 줬어요`);
          break;
        case "care": {
          const last = p.lastCare[who] || 0;
          if (cnt.care < 8 && ev.at - last >= 30 * 60000) { cnt.care++; gain = wilted ? 0 : level < 20 ? 1 : 3; counted = true; st.care++; p.careCount++; p.lastCare[who] = ev.at; DS(day).care++; }
          break;
        }
        case "sing": {
          const last = p.lastSing[who] || 0;
          if (cnt.sing < 4 && ev.at - last >= 60 * 60000) { cnt.sing++; gain = wilted ? 0 : 2; counted = true; st.sing++; p.careCount++; p.lastSing[who] = ev.at; DS(day).sing++; logIt(ev, `노래를 불러 줬어요`); }
          break;
        }
        case "fert": case "fert2": {
          if (!has(ev.type)) break;
          add(ev.type, -1);
          p.ferts[day] = (p.ferts[day] || 0) + 1;
          if (p.ferts[day] <= 2) gain = (ev.type === "fert2" ? 45 : 25) * (wilted ? 0.5 : 1);
          counted = true;
          logIt(ev, `${G.ITEMS[ev.type].name}를 줬어요`);
          break;
        }
        case "tonic":
          if (!has("tonic")) break;
          add("tonic", -1);
          p.lastWater = ev.at; p.tonicUntil = ev.at + DAY; counted = true; gain = 2;
          logIt(ev, `영양제를 줬어요`);
          break;
        case "spray":
          if (!has("spray")) break;
          add("spray", -1);
          p.sprays.push(ev.at); counted = true;
          logIt(ev, `살충제를 뿌렸어요`);
          break;
        case "stake":
          if (p.staked || stage < 2 || !has("stake")) break;
          add("stake", -1);
          p.staked = true; gain = 5; counted = true;
          logIt(ev, `지지대를 세웠어요`);
          break;
        case "prune":
          if (stage < 3 || p.pruned.has(stage)) break;
          p.pruned.add(stage); gain = 3; counted = true;
          logIt(ev, `가지를 다듬었어요`);
          break;
        case "bug":
          if (!p.caught.has(ev.slot)) { p.caught.add(ev.slot); gain = 2; st.bugs++; counted = true; DS(day).pest++; }
          break;
        case "weed":
          if (!p.pulled.has(ev.slot)) { p.pulled.add(ev.slot); gain = 2; st.weeds++; counted = true; DS(day).pest++; }
          break;
        case "name":
          p.name = String(ev.name || "").slice(0, 10);
          break;
        case "harvest": {
          if (stage < 5) break;
          const score = p.together.size * 2 + p.caught.size + p.pulled.size + Math.floor(p.careCount / 2) + (p.staked ? 2 : 0) + p.pruned.size * 2 - p.wilts * 5 - p.thirsts * 2;
          const quality = score >= 14 ? 3 : score >= 6 ? 2 : 1;
          harvested.push({ id: p.id, species: p.species, quality, plot: p.plot, at: ev.at, who, name: p.name });
          add("pr:" + p.species, quality);
          earnedGame += 20 + (quality === 3 ? 20 : quality === 2 ? 10 : 0);
          if (quality === 3) st.gold++;
          plots[p.plot].plant = null;
          plots[p.plot].harvests++;
          logIt(ev, `${G.SPECIES[p.species].name}를 ${G.QUALITY[quality]} 품질로 수확했어요`);
          continue;
        }
      }
      if (counted) gain += acted(p, who, day);
      p.growth += gain;
      st.growth += gain;
    }

    // ---------- 지금 모습 ----------
    const book = {};
    harvested.forEach((h) => {
      const b = (book[h.species] = book[h.species] || { count: 0, best: 0, first: h.at });
      b.count++; b.best = Math.max(b.best, h.quality);
    });
    plots.forEach((pl) => {
      const p = pl.plant;
      if (!p) return;
      const sp = G.SPECIES[p.species];
      const steps = G.STEPS.map((x) => Math.round(x * sp.speed));
      p.sp = sp;
      p.steps = steps;
      p.stage = stageOf(p);
      p.prev = steps[p.stage];
      p.next = steps[p.stage + 1] == null ? null : steps[p.stage + 1];
      p.water = Math.round(levelAt(p, now));
      p.wilted = wiltedAt(p, now);
      p.thirsty = !p.wilted && p.water < 30;
      p.ready = p.stage === 5;
      const bugs = [], weeds = [];
      if (p.stage >= 1) {
        const maxSlot = Math.floor((now - p.at) / (6 * HOUR));
        for (let k = Math.max(1, maxSlot - 3); k <= maxSlot; k++) {
          const t = p.at + k * 6 * HOUR;
          const sprayed = p.sprays.some((s) => t >= s && t < s + DAY);
          if (!sprayed && hash(p.id + ":b" + k) % 10 < 4 && !p.caught.has(k)) bugs.push(k);
        }
        const maxDay = Math.floor((now - p.at) / DAY);
        for (let k = Math.max(1, maxDay - 2); k <= maxDay; k++) {
          if (hash(p.id + ":w" + k) % 10 < 4 && !p.pulled.has(k)) weeds.push(k);
        }
      }
      p.bugs = bugs.slice(-3);
      p.weeds = weeds.slice(-2);
      const cares24 = Object.values(p.lastCare).filter((t) => now - t < DAY).length + Object.values(p.lastSing).filter((t) => now - t < DAY).length;
      const today = p.acts[dayKey(now)] || {};
      p.love = Math.min(100, cares24 * 20 + (today.him && today.her ? 30 : 0) + (p.water > 30 ? 10 : 0));
      p.quality = p.together.size * 2 + p.caught.size + p.pulled.size + Math.floor(p.careCount / 2) + (p.staked ? 2 : 0) + p.pruned.size * 2 - p.wilts * 5 - p.thirsts * 2;
      p.canStake = !p.staked && p.stage >= 2;
      p.canPrune = p.stage >= 3 && !p.pruned.has(p.stage);
      p.sprayed = p.sprays.some((s) => now >= s && now < s + DAY);
      p.tonic = now < p.tonicUntil;
    });

    // 동물 친구
    if (pet) {
      const P = G.PETS.find((x) => x.id === pet.kind) || G.PETS[0];
      pet.def = P;
      pet.hunger = Math.max(0, Math.min(100, Math.round(100 - ((now - pet.lastFeed) / HOUR) * 5)));
      const plays24 = pet.plays.filter((t) => now - t < DAY).length;
      const pats24 = pet.pats.filter((t) => now - t < DAY).length;
      pet.happy = Math.min(100, plays24 * 20 + pats24 * 8 + (pet.hunger > 40 ? 20 : 0));
      pet.level = 1 + Math.floor(pet.xp / 30);
      pet.lvFrom = (pet.level - 1) * 30;
    }

    // 다른 화면의 기록들
    const entries = Store.list("entries");
    const diary = Store.list("diary");
    const plansDone = Store.list("plans").filter((p) => p.done);
    let answers = 0, questBoth = 0, hearts = 0;
    const qDays = {}, mDays = {}, hDays = {}, aDays = {};
    Store.pairKeys("q:").forEach((k) => { const a = Store.pair(k, "him"), b = Store.pair(k, "her"); answers += (a ? 1 : 0) + (b ? 1 : 0); if (a && b) { questBoth++; qDays[k.slice(2)] = true; } });
    Store.pairKeys("m:").forEach((k) => { if (Store.pair(k, "him") && Store.pair(k, "her")) mDays[k.slice(2)] = true; });
    Store.pairKeys("p:").forEach((k) => { const n = (Number(Store.pair(k, "him")) || 0) + (Number(Store.pair(k, "her")) || 0); hearts += n; hDays[k.slice(2)] = n; });
    Store.pairKeys("a:").forEach((k) => { aDays[k.slice(2)] = { him: !!Store.pair(k, "him"), her: !!Store.pair(k, "her") }; });
    const recDays = {}, diaDays = {}, planDays = {};
    entries.forEach((e) => { recDays[e.date] = true; });
    diary.forEach((d) => { diaDays[d.date] = true; });
    plansDone.forEach((p) => { planDays[dayKey(p.t || 0)] = true; });

    // 출석
    let attendCoins = 0, attendBoth = 0;
    Object.keys(aDays).forEach((d) => { const a = aDays[d]; attendCoins += (a.him ? 2 : 0) + (a.her ? 2 : 0) + (a.him && a.her ? 3 : 0); if (a.him && a.her) attendBoth++; });

    // 오늘의 미션 (모든 날을 다시 따져서 코인을 셈)
    const allDays = new Set([...Object.keys(dayStats), ...Object.keys(qDays), ...Object.keys(mDays), ...Object.keys(hDays), ...Object.keys(recDays), ...Object.keys(diaDays), ...Object.keys(planDays), dayKey(now)]);
    function missionDone(id, d) {
      const s = dayStats[d] || { water: 0, care: 0, sing: 0, pest: 0, mini: 0, pet: 0, cook: 0, acted: {} };
      switch (id) {
        case "water2": return [Math.min(2, s.water), 2];
        case "care2": return [Math.min(2, s.care), 2];
        case "sing": return [Math.min(1, s.sing), 1];
        case "heart5": return [Math.min(5, hDays[d] || 0), 5];
        case "quest": return [qDays[d] ? 1 : 0, 1];
        case "mood": return [mDays[d] ? 1 : 0, 1];
        case "record": return [recDays[d] ? 1 : 0, 1];
        case "diary": return [diaDays[d] ? 1 : 0, 1];
        case "pest": return [Math.min(1, s.pest), 1];
        case "together": return [(s.acted.him ? 1 : 0) + (s.acted.her ? 1 : 0), 2];
        case "mini": return [Math.min(1, s.mini), 1];
        case "pet": return [Math.min(1, s.pet), 1];
        case "cook": return [Math.min(1, s.cook), 1];
      }
      return [0, 1];
    }
    let missionCoins = 0, missionDays = 0;
    let today = null;
    allDays.forEach((d) => {
      const list = missionsFor(d).map((m) => { const [v, t] = missionDone(m.id, d); return Object.assign({}, m, { value: v, target: t, done: v >= t }); });
      const all = list.every((m) => m.done);
      list.forEach((m) => { if (m.done) missionCoins += m.reward; });
      if (all) { missionCoins += G.MISSION_BONUS; missionDays++; }
      if (d === dayKey(now)) today = { list, all };
    });
    // 이번 주 미션
    const wk = weekKey(now);
    const inWeek = (d) => weekKey(new Date(d + "T12:00:00").getTime()) === wk;
    const weekSum = (f) => Object.keys(dayStats).filter(inWeek).reduce((a, d) => a + f(dayStats[d], d), 0);
    const weekVal = {
      "w-water": weekSum((s) => s.water),
      "w-together": weekSum((s) => (s.acted.him && s.acted.her ? 1 : 0)),
      "w-mini": weekSum((s) => s.mini),
      "w-cook": weekSum((s) => s.cook),
      "w-gift": weekSum((s) => s.gift),
      "w-attend": Object.keys(aDays).filter(inWeek).filter((d) => aDays[d].him && aDays[d].her).length,
    };
    // 지난 주들 것도 코인에 넣어요
    const weeks = new Set([...Object.keys(dayStats), ...Object.keys(aDays)].map((d) => weekKey(new Date(d + "T12:00:00").getTime())));
    weeks.add(wk);
    let weeklyCoins = 0;
    let week = null;
    weeks.forEach((w) => {
      const inW = (d) => weekKey(new Date(d + "T12:00:00").getTime()) === w;
      const sum = (f) => Object.keys(dayStats).filter(inW).reduce((a, d) => a + f(dayStats[d]), 0);
      const vals = {
        "w-water": sum((s) => s.water), "w-together": sum((s) => (s.acted.him && s.acted.her ? 1 : 0)), "w-mini": sum((s) => s.mini),
        "w-cook": sum((s) => s.cook), "w-gift": sum((s) => s.gift), "w-attend": Object.keys(aDays).filter(inW).filter((d) => aDays[d].him && aDays[d].her).length,
      };
      const list = weeklyFor(w).map((m) => Object.assign({}, m, { value: Math.min(vals[m.id], m.target), done: vals[m.id] >= m.target }));
      list.forEach((m) => { if (m.done) weeklyCoins += m.reward; });
      if (w === wk) week = list;
    });
    void weekVal;

    const placedDecor = Object.values(decorSlots).filter(Boolean).length;
    const unlockedPlots = G.PLOT_UNLOCK.filter((lv, i) => i === 0 || lv <= 999).length; // 아래에서 레벨로 다시 정해요
    void unlockedPlots;
    const stats = {
      water: st.water, care: st.care, sing: st.sing, bugs: st.bugs, weeds: st.weeds, harvests: harvested.length, gold: st.gold, book: Object.keys(book).length,
      together: new Set(Object.keys(dayStats).filter((d) => dayStats[d].acted.him && dayStats[d].acted.her)).size,
      cooks: st.cooks, recipes: st.recipeSet.size, gifts: st.gifts, decor: placedDecor, petLevel: pet ? pet.level : 0, miniBest: st.miniBest, minis: st.minis,
      attendBoth, missionDays, entries: entries.length, diary: diary.length, hearts, snaps: st.snaps, questBoth, plansDone: plansDone.length, plots: 0,
    };
    const baseCoins = 50 + entries.length * 5 + diary.length * 5 + plansDone.length * 3 + answers * 2 + Math.floor(hearts / 10) + st.bugs * 3 + st.weeds * 2;
    // 레벨이 밭 수와 도전에 영향을 주고, 도전 보상이 다시 레벨에 들어가요. 두 번 돌려서 맞춰요.
    let level = 1, earned = 0, ach = [];
    for (let pass = 0; pass < 2; pass++) {
      stats.plots = G.PLOT_UNLOCK.filter((lv) => lv <= level).length;
      ach = G.ACHIEVEMENTS.map((a) => { const v = stats[a.stat] || 0; return Object.assign({}, a, { value: Math.min(v, a.target), done: v >= a.target }); });
      const achCoins = ach.filter((a) => a.done).reduce((s, a) => s + a.reward, 0);
      earned = baseCoins + earnedGame + missionCoins + weeklyCoins + attendCoins + achCoins;
      level = levelOf(st.growth + earned);
    }
    const xp = st.growth + earned;
    plots.forEach((pl, i) => { pl.unlocked = G.PLOT_UNLOCK[i] <= level; pl.need = G.PLOT_UNLOCK[i]; pl.nextId = plantIdFor(i, pl.harvests + 1); });

    const unlockedSpecies = G.ORDER.filter((k) => {
      const u = G.SPECIES[k].unlock;
      if (u === "all") return G.ORDER.filter((x) => x !== "rainbow").every((x) => book[x]);
      return harvested.length >= u;
    });
    const myDay = dayKey(now);
    const state = {
      now, plots, harvested, book, inv, coins: Math.max(0, earned - spent), earned, spent, xp, level,
      levelTitle: G.LEVEL_TITLES[Math.min(level, G.LEVEL_TITLES.length - 1)], levelFrom: xpFor(level), levelTo: xpFor(level + 1),
      stats, ach, today: today || { list: [], all: false }, week: week || [], attend: aDays, attendToday: aDays[myDay] || {},
      pet, decorSlots, gifts: Object.values(gifts).sort((a, b) => b.at - a.at), snaps: snaps.reverse(), log: log.slice(-80).reverse(),
      minis, claimed, ownedSkins, unlockedSpecies, dayStats, hasSeed: evs.some((e) => e.type === "seed"),
    };
    cache = { key, state };
    return state;
  }

  window.GameCore = { compute, plantSvg, plantRows, potRows, dayKey, weekKey, hash, plantIdFor, levelOf, xpFor, invalidate() { cache.key = ""; } };
})();
// 저장소 내용이 바뀌면 다시 계산하게 해요.
if (window.Store) Store.onChange(() => { if (window.GameCore) window.GameCore.invalidate(); });
