// ============================================================
// 우리 농장: 도트 그래픽 세트 (2등신 두 사람, 아기 하마·양·고양이·강아지)
// 캐릭터(걷기, 괭이질, 물 주기, 쪼그려 앉기, 들어 올리기), 도구, 나무, 울타리,
// 게임 창 틀(나무 틀, 양피지, 아이템 칸, 말풍선, 팻말)을 점 하나하나 그려요.
// ============================================================
(function () {
  "use strict";

  const A = window.GArt;
  const OUT = "#3b2a20";

  // ---------- 점판 ----------
  function blank(w, h) { const g = []; for (let y = 0; y < h; y++) g.push(new Array(w).fill(".")); return g; }
  function put(g, x, y, c) { if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c; }
  function rect(g, x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(g, x + i, y + j, c); }
  function stamp(g, rows, x, y) { rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== ".") put(g, x + i, y + j, r[i]); }); }
  function outline(g) {
    const h = g.length, w = g[0].length, add = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (g[y][x] !== ".") continue;
      const n = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
      if (n.some(([a, b]) => b >= 0 && b < h && a >= 0 && a < w && g[b][a] !== "." && g[b][a] !== "o")) add.push([x, y]);
    }
    add.forEach(([x, y]) => { g[y][x] = "o"; });
    return g;
  }
  function rows(g) { return g.map((r) => r.join("")); }

  // ---------- 사람 (머리가 큰 2등신) ----------
  const PEOPLE = {
    him: { H: "#4a4038", h: "#6e5e52", S: "#f7d3b0", s: "#e8b890", E: "#2e221c", W: "#ffffff", C: "#f7a5a0", m: "#e0907a", M: "#c9735f", T: "#7fb2e5", t: "#5f8fc5", P: "#5c6f9c", p: "#46577f", K: "#4a3a30" },
    her: { H: "#7a5440", h: "#a07458", S: "#f7d3b0", s: "#e8b890", E: "#2e221c", W: "#ffffff", C: "#f7a0a8", m: "#e0907a", M: "#c9735f", T: "#ffd978", t: "#f0b54a", P: "#f7d3b0", p: "#e8b890", K: "#c96a52", R: "#ff7aa8", r: "#e05a88" },
  };
  const HEADS = {
    him: {
      down: ["....HHHHHH....", "..HHHHHHHHHH..", ".HHHhhHHHHHHH.", "HHHhHHHHHHHHHH", "HHSHHHHSHHHSHH", "HSSSSSSSSSSSSH", "HSSWESSSSWESSH", "HSSEESSSSEESSH", "HSCCSSSSSSCCSH", ".SSSSSmmSSSSS.", "..SSSSSSSSSS.."],
      side: ["...HHHHHHH....", "..HHHHHHHHHH..", ".HHHHhhHHHHHH.", "HHHhhHHHHHHHHH", "HHHHHHHHSHHSHH", "HHHHHSSSSSSSSS", "HHHHsSSSSWESSS", "HHHHsSSSSEESSS", ".HHHSSSSSCCSS.", ".HHSSSSSSSmSS.", "..HSSSSSSSSS.."],
      up: ["....HHHHHH....", "..HHHHHHHHHH..", ".HHHhhHHHHHHH.", "HHHhHHHHHHHHHH", "HHHHHHHHHHHHHH", "HHHHHHhHHHHHHH", "HHHHHHHHHHHHHH", "sHHHHHHHHHHHHs", "HHHHHHHHHHHHHH", ".HHHHHHHHHHHH.", "..SSSSSSSSSS.."],
    },
    her: {
      down: ["....HHHHHH....", "..HHHHHHHHHH..", ".HHHhhHHHHHHH.", "HHhHHHHHHHHHHH", "HHHHHHHHHSHHHH", "HHSSSSSSSSSSHH", "HSSWESSSSWESSH", "HSSEESSSSEESSH", "HSCCSSSSSSCCSH", "HHSSSSmmSSSSHH", "HHHSSSSSSSSHHH"],
      side: ["...HHHHHHH....", "..HHHHHHHHHH..", ".HHHHhhHHHHHH.", "HHHhhHHHHHHHHH", "HHHHHHHHHHHSHH", "HHHHHHSSSSSSSS", "HHHHHsSSSWESSS", "HHHHHsSSSEESSS", "HHHHHSSSSCCSS.", "HHHHSSSSSSmSS.", "HHHHHSSSSSSS.."],
      up: ["....HHHHHH....", "..HHHHHHHHHH..", ".HHHhhHHHHHHH.", "HHhHHHHHHHHHHH", "HHHHHHHHHHHHHH", "HHHHHHhHHHHHHH", "HHHHHHHHHHHHHH", "HHHHHHHHHHHHHH", "HHHHHHHHHHHHHH", "HHHHHHHHHHHHHH", "HHHHHHHHHHHHHH"],
    },
  };
  const CH_W = 18, CH_H = 21, FOOT = 19;
  // who, dir(down/up/side), frame(0 서기, 1·2 걷기), pose('', act 도구 들기, crouch, hold, raise, wave1, wave2)
  function charRows(who, dir, frame, pose, face) {
    const g = blank(CH_W, CH_H);
    const girl = who === "her";
    const crouch = pose === "crouch";
    const oy = 2 + (crouch ? 2 : frame ? 1 : 0);
    const hx = 2;
    const by = oy + 11;
    // 여자 뒷머리 (몸 뒤로 내려와요)
    if (girl) {
      if (dir === "down") { rect(g, hx, by - 1, 2, 3, "H"); rect(g, hx + 12, by - 1, 2, 3, "H"); }
      if (dir === "side") { rect(g, hx, by - 1, 4, 3, "H"); put(g, hx + 1, by + 2, "H"); put(g, hx + 2, by + 2, "H"); }
    }
    // 몸통
    if (girl) {
      if (dir === "side") { rect(g, 6, by, 6, 2, "T"); rect(g, 5, by + 2, 8, 1, "T"); rect(g, 5, by + 3, 8, 1, "t"); }
      else { rect(g, 5, by, 8, 2, "T"); rect(g, 5, by + 2, 8, 1, "T"); rect(g, 4, by + 3, 10, 1, "t"); put(g, 8, by, "W"); put(g, 9, by, "W"); }
    } else {
      if (dir === "side") { rect(g, 6, by, 6, 3, "T"); rect(g, 6, by + 3, 6, 1, "P"); }
      else { rect(g, 5, by, 8, 3, "T"); rect(g, 5, by + 2, 8, 1, "t"); rect(g, 5, by + 3, 8, 1, "P"); if (dir === "down") { put(g, 8, by, "W"); put(g, 9, by, "W"); } }
    }
    // 팔
    const swing = frame === 1 ? -1 : frame === 2 ? 1 : 0;
    const up = pose === "wave1" || pose === "wave2" || pose === "raise" || pose === "hold";
    if (pose === "wave1" || pose === "wave2") {
      rect(g, 4, by, 1, 2, "T"); put(g, 4, by + 2, "S");
    } else if (up) {
      // 머리를 그린 뒤에 올려요
    } else if (dir === "side") {
      if (pose === "act") { rect(g, 10, by + 1, 4, 1, "T"); put(g, 14, by + 1, "S"); }
      else { const ax = 9 + swing; rect(g, ax, by, 1, 2, "t"); put(g, ax, by + 2, "S"); }
    } else if (pose === "act") {
      rect(g, 4, by, 1, 2, "T"); rect(g, 13, by, 1, 2, "T");
      rect(g, 5, by + 2, 2, 1, "S"); rect(g, 11, by + 2, 2, 1, "S");
    } else {
      rect(g, 4, by + Math.max(0, swing), 1, 2, "T"); put(g, 4, by + 2 + swing, "S");
      rect(g, 13, by + Math.max(0, -swing), 1, 2, "T"); put(g, 13, by + 2 - swing, "S");
    }
    // 다리
    const leg = (x, bottom, c) => { const top = by + 4; if (bottom > top) rect(g, x, top, 2, bottom - top, c); rect(g, x, bottom, 2, 1, "K"); };
    if (crouch) {
      rect(g, 4, FOOT - 1, 2, 1, "P"); rect(g, 12, FOOT - 1, 2, 1, "P");
      rect(g, 4, FOOT, 2, 1, "K"); rect(g, 12, FOOT, 2, 1, "K");
    } else if (dir === "side") {
      if (frame === 1) { leg(10, FOOT, "P"); leg(6, FOOT - 1, "p"); }
      else if (frame === 2) { leg(6, FOOT, "P"); leg(10, FOOT - 1, "p"); }
      else { leg(7, FOOT, "p"); leg(9, FOOT, "P"); }
    } else {
      leg(6, FOOT - (frame === 1 ? 1 : 0), "P"); leg(10, FOOT - (frame === 2 ? 1 : 0), "P");
    }
    // 머리
    stamp(g, HEADS[girl ? "her" : "him"][dir], hx, oy);
    if (girl && dir === "up") rect(g, 5, by, 8, 2, "H");
    // 리본
    if (girl) {
      const rx = dir === "side" ? hx + 3 : hx + 10;
      put(g, rx, oy, "R"); put(g, rx + 2, oy, "R"); put(g, rx + 1, oy + 1, "r"); put(g, rx, oy + 1, "R"); put(g, rx + 2, oy + 1, "R"); put(g, rx + 1, oy, "r");
    }
    // 머리 위로 올린 팔 (머리보다 앞에)
    if (pose === "wave1") { rect(g, 16, oy + 4, 1, by - oy - 3, "T"); rect(g, 16, oy + 2, 2, 2, "S"); }
    if (pose === "wave2") { rect(g, 16, oy + 6, 1, by - oy - 5, "T"); put(g, 17, oy + 5, "T"); rect(g, 17, oy + 3, 1, 2, "S"); }
    if (pose === "raise" || pose === "hold") {
      rect(g, 1, oy + 1, 1, by - oy, "T"); rect(g, 16, oy + 1, 1, by - oy, "T");
      rect(g, 0, oy - 1, 2, 2, "S"); rect(g, 16, oy - 1, 2, 2, "S");
    }
    // 표정
    if (dir !== "up" && (face === "blink" || face === "happy")) {
      const eyes = dir === "side" ? [hx + 9] : [hx + 3, hx + 9];
      eyes.forEach((x) => { rect(g, x, oy + 6, 2, 2, "S"); });
      if (face === "blink") eyes.forEach((x) => rect(g, x, oy + 7, 2, 1, "E"));
      else eyes.forEach((x) => { rect(g, x, oy + 6, 2, 1, "E"); put(g, x - 1, oy + 7, "E"); put(g, x + 2, oy + 7, "E"); });
      if (face === "happy") { if (dir === "down") { put(g, hx + 6, oy + 9, "M"); put(g, hx + 7, oy + 9, "M"); } else put(g, hx + 10, oy + 9, "M"); }
    }
    return rows(outline(g));
  }
  function charImg(who, dir, frame, pose, face) {
    const key = `ch2|${who}|${dir}|${frame}|${pose || ""}|${face || ""}`;
    return A.fromRows(key, charRows(who, dir, frame, pose || "", face || ""), Object.assign({ o: OUT }, PEOPLE[who] || PEOPLE.him)).uri;
  }

  function ell(g, cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
      const dx = (x - cx) / (rx + 0.35), dy = (y - cy) / (ry + 0.35);
      if (dx * dx + dy * dy <= 1) put(g, x, y, c);
    }
  }
  // 동글동글한 덩어리에 위쪽 빛과 아래쪽 그늘을 같이 칠해요
  function blob(g, cx, cy, rx, ry, c, lt, dk) {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
      const dx = (x - cx) / (rx + 0.35), dy = (y - cy) / (ry + 0.35);
      const d = dx * dx + dy * dy;
      if (d > 1) continue;
      let col = c;
      if (dk && dy > 0.5 && d > 0.42) col = dk;
      else if (lt && -dx * 0.45 - dy * 0.95 > 0.66 && d > 0.5) col = lt;
      put(g, x, y, col);
    }
  }
  // 반짝이는 큰 눈 (2x2, 왼쪽 위에 하얀 빛)
  function eye(g, x, y, face, c) {
    if (face === "blink" || face === "sleep") { rect(g, x, y + 1, 2, 1, "K"); return; }
    if (face === "happy") { rect(g, x, y, 2, 1, "K"); put(g, x - 1, y + 1, "K"); put(g, x + 2, y + 1, "K"); return; }
    rect(g, x, y, 2, 2, c || "K"); put(g, x, y, "W");
  }

  // ---------- 아기 하마 (몸은 옆, 얼굴은 앞을 봐요) ----------
  // frame: stand, walk1, walk2, lie / face: "", blink, happy, yawn, sleep, sweat
  const HIPPO_HEAD = [
    "..Hh......hH..",
    ".HPHh....hHPH.",
    "..HHHHHHHHHH..",
    ".HsHHHHHHHHHh.",
    ".HHHHHHHHHHHh.",
    ".HHHHHHHHHHHh.",
    ".HHHHHHHHHHHh.",
    ".CCHLLLLLLHCC.",
    "LLLLNLLLLNLLLL",
    "LvvLLLLLLLLLLL",
    "LvLLLuLLuLLLLL",
    ".uLLLLuuLLLLu.",
    "..uuuuuuuuuu..",
  ];
  const HIPPO_BODY = [
    "....HHHHHHHH....",
    "..HHllHHHHHHHH..",
    ".HlHHHHHHHHHHHH.",
    ".HHHHHHHHHHHHHHH",
    "HHHHHHHHHHHHHHHH",
    "HHHHHHHHHHHHHHHH",
    "hHHHHHHHHHHHHHHH",
    "hhHHHHHHHHHHHHHH",
    ".hhHHbbbbbbbHHHH",
    "..hhhhbbbbbhhhh.",
    "....hhhhhhhhh...",
  ];
  const HIPPO_SWIM = 10; // 헤엄칠 때 물 위로 보이는 줄 수 (귀, 눈, 콧구멍)
  function hippoRows(frame, face) {
    const g = blank(27, 18);
    const lie = frame === "lie";
    const bx = 1, by = lie ? 6 : 4, hx = 11, hy = lie ? 3 : 1;
    // 다리 (몸 뒤에서 먼저)
    if (!lie) {
      const lift = frame === "walk1" ? [1, 0, 0, 1] : frame === "walk2" ? [0, 1, 1, 0] : [0, 0, 0, 0];
      [3, 7, 12, 17].forEach((x, i) => { rect(g, x, 13 - lift[i], 3, 2, i === 1 || i === 2 ? "h" : "H"); rect(g, x, 15 - lift[i], 3, 1, "d"); put(g, x + 1, 15 - lift[i], "D"); });
    }
    stamp(g, HIPPO_BODY, bx, by);
    // 꼬리
    put(g, bx - 1, by + 4, "h"); put(g, bx - 1, by + 5, "H");
    if (lie) { rect(g, 12, 16, 3, 1, "H"); rect(g, 18, 16, 3, 1, "H"); }
    stamp(g, HIPPO_HEAD, hx, hy);
    // 눈
    const ef = face === "yawn" ? "blink" : face;
    eye(g, hx + 3, hy + 5, ef); eye(g, hx + 9, hy + 5, ef);
    // 입
    if (face === "yawn") {
      rect(g, hx + 3, hy + 9, 8, 3, "M"); rect(g, hx + 5, hy + 11, 4, 1, "T");
      put(g, hx + 3, hy + 9, "W"); put(g, hx + 10, hy + 9, "W");
      rect(g, hx + 2, hy + 12, 10, 1, "u");
    } else if (face === "happy") {
      put(g, hx + 5, hy + 10, "M"); put(g, hx + 8, hy + 10, "M"); put(g, hx + 6, hy + 11, "M"); put(g, hx + 7, hy + 11, "M");
    }
    if (face === "sweat") { put(g, hx + 13, hy + 1, "B"); put(g, hx + 13, hy + 2, "B"); put(g, hx + 12, hy + 2, "B"); }
    return rows(outline(g));
  }
  function hippoImg(frame, face) {
    return A.fromRows(`hip3|${frame}|${face || ""}`, hippoRows(frame, face || ""), { o: "#4a3550", s: "#f4eeff", H: "#c3b1e0", l: "#dccff0", h: "#a593c9", b: "#e6d6ee", d: "#9180b8", D: "#7a68a3", P: "#ff9ab8", L: "#f6d3e4", v: "#fff0f6", u: "#e3aecb", N: "#8a5a7a", C: "#ff9ab8", K: "#2e221c", W: "#ffffff", M: "#c0506a", T: "#ff8a9a", B: "#7fc4f0" }).uri;
  }

  // ---------- 아기 양 ----------
  // frame: stand, walk1, walk2, eat, lie / face: "", blink, happy, baa, sleep
  const SHEEP_WOOL = [
    "....xWW..xWW....",
    "..xWWWWWxWWWWW..",
    ".xWWWwWWWWWWwWW.",
    ".WWWWWwWWWWWWwW.",
    "xWWwWWWWWwWWWWWW",
    "WWWWwWWWWWwWWWWW",
    "WWWWWWWWWWWWWWWW",
    ".WWWWWWwWWWWWwW.",
    ".wWWwWWWWWwWWWw.",
    "..wwwwwwwwwwww..",
    "...ww.www.www...",
  ];
  const SHEEP_HEAD = [
    "...xWxWW....",
    "..WWWWWWWW..",
    "..WFWWWWFW..",
    "..FFFFFFFF..",
    "FEFFFFFFFFEF",
    "ffFFFFFFFFff",
    "..CFFNNFFC..",
    "..FFFffFFF..",
    "...ffffff...",
  ];
  function sheepRows(frame, face) {
    const g = blank(25, 18);
    const lie = frame === "lie";
    const bx = 1, by = lie ? 7 : 4;
    const hx = 12, hy = frame === "eat" ? 7 : lie ? 6 : 2;
    if (!lie) {
      const lift = frame === "walk1" ? [1, 0, 0, 1] : frame === "walk2" ? [0, 1, 1, 0] : [0, 0, 0, 0];
      [4, 7, 11, 14].forEach((x, i) => { rect(g, x, 14 - lift[i], 2, 2, i === 1 || i === 2 ? "g" : "G"); rect(g, x, 16 - lift[i], 2, 1, "k"); });
    }
    stamp(g, SHEEP_WOOL, bx, by);
    put(g, 0, by + 5, "W"); put(g, 0, by + 6, "w");
    stamp(g, SHEEP_HEAD, hx, hy);
    eye(g, hx + 3, hy + 4, face); eye(g, hx + 7, hy + 4, face);
    if (face === "baa") { rect(g, hx + 5, hy + 7, 2, 2, "M"); }
    if (frame === "eat") { put(g, hx + 5, 16, "q"); put(g, hx + 6, 16, "q"); put(g, hx + 7, 15, "q"); put(g, hx + 4, 15, "q"); }
    return rows(outline(g));
  }
  function sheepImg(frame, face, wet) {
    return A.fromRows(`shp3|${frame}|${face || ""}|${wet ? 1 : 0}`, sheepRows(frame, face || ""), { o: "#5a4a48", W: wet ? "#e2e9f0" : "#ffffff", x: wet ? "#f2f6fa" : "#fffdf6", w: wet ? "#c2cfdc" : "#e8e0f0", F: "#fbe8d6", f: "#efcfb4", E: "#f6a8b8", N: "#f08aa0", C: "#ffb0c4", K: "#2e221c", G: "#7a6458", g: "#665248", k: "#4a3a34", M: "#c0506a", q: "#5fae5f" }).uri;
  }

  // ---------- 먼치킨 브리티시 숏헤어 (다리 짧은 통통 회색 고양이, 구릿빛 동그란 눈) ----------
  // frame: stand, walk1, walk2, loaf, stretch, groom / face: "", blink, happy, glow, grump, sleep
  const CAT_HEAD = [
    ".B.........B.",
    ".BPB.....BPB.",
    ".BBBBBBBBBBB.",
    "BBllBBBBBBBBB",
    "BlBBBBBBBBBBb",
    "BBBKKBBBKKBBb",
    "BBBYYBBBYYBBb",
    "BCCBBwPwBBCCB",
    "BBBBwbwbwBBBB",
    ".BBBBwwwBBBB.",
    "..bbbbbbbbb..",
  ];
  const CAT_BODY = [
    "...BBBBBBBBB...",
    ".BBllllBBBBBBB.",
    "BBlBBBBBBBBBBBB",
    "BBBBBBBBBBBBBBB",
    "BBBBBBBBBBBBBBB",
    "bBBBBBBBBBBBBBb",
    ".bbbbBBBBBBbbb.",
  ];
  function catRows(frame, face, tail) {
    const g = blank(25, 16);
    const loaf = frame === "loaf" || frame === "groom";
    const st = frame === "stretch";
    const bx = 2, by = st ? 5 : loaf ? 7 : 6;
    const hx = 11, hy = st ? 4 : loaf ? 2 : 1;
    // 굵고 동그란 꼬리
    if (tail) { [[2, 2], [1, 3], [2, 3], [1, 4], [2, 4], [1, 5], [2, 5], [2, 6], [3, 6], [3, 7]].forEach(([x, y]) => put(g, x, y + by - 6, "B")); put(g, 2, by - 4, "l"); put(g, 1, by - 1, "b"); }
    else { rect(g, 0, by + 4, 3, 2, "B"); put(g, 0, by + 5, "b"); }
    // 짧은 다리
    if (st) {
      rect(g, 4, 12, 2, 1, "B"); rect(g, 8, 12, 2, 1, "B"); rect(g, 4, 13, 2, 1, "w"); rect(g, 8, 13, 2, 1, "w");
      rect(g, 15, 13, 7, 1, "B"); rect(g, 21, 13, 2, 1, "w"); rect(g, 19, 13, 1, 1, "w");
    } else if (!loaf) {
      const lift = frame === "walk1" ? [1, 0, 0, 1] : frame === "walk2" ? [0, 1, 1, 0] : [0, 0, 0, 0];
      [4, 7, 12, 15].forEach((x, i) => { rect(g, x, 12 - lift[i], 2, 1, i === 1 || i === 2 ? "b" : "B"); rect(g, x, 13 - lift[i], 2, 1, "w"); });
    }
    stamp(g, CAT_BODY, bx, by);
    if (loaf) { rect(g, 13, 14, 3, 1, "w"); if (!tail) { rect(g, 3, 14, 9, 1, "B"); } }
    stamp(g, CAT_HEAD, hx, hy);
    // 눈 (구릿빛)
    [hx + 3, hx + 8].forEach((x, i) => {
      const y = hy + 5;
      rect(g, x, y, 2, 2, "B");
      if (face === "blink" || face === "sleep") { rect(g, x, y + 1, 2, 1, "K"); return; }
      if (face === "happy") { rect(g, x, y, 2, 1, "K"); put(g, x - 1, y + 1, "K"); put(g, x + 2, y + 1, "K"); return; }
      if (face === "glow") { rect(g, x, y, 2, 2, "L"); put(g, x + (i ? 0 : 1), y + 1, "Y"); return; }
      if (face === "grump") { rect(g, x, y, 2, 1, "b"); rect(g, x, y + 1, 2, 1, "Y"); put(g, x + (i ? 0 : 1), y + 1, "K"); return; }
      rect(g, x, y, 2, 1, "K"); put(g, x, y, "W"); rect(g, x, y + 1, 2, 1, "Y"); put(g, x + (i ? 0 : 1), y + 1, "K");
    });
    if (frame === "groom") { rect(g, hx + 8, hy + 8, 2, 3, "B"); rect(g, hx + 8, hy + 8, 2, 1, "w"); put(g, hx + 7, hy + 8, "P"); }
    return rows(outline(g));
  }
  function catImg(frame, face, tail) {
    return A.fromRows(`cat3|${frame}|${face || ""}|${tail ? 1 : 0}`, catRows(frame, face || "", tail), { o: "#3a3a4a", B: "#98a3b5", l: "#b8c0ce", b: "#7b879c", w: "#dde2ea", P: "#f2a0b4", Y: "#f0a030", K: "#2e221c", W: "#ffffff", C: "#f7a8b8", L: "#fff6a0" }).uri;
  }

  // ---------- 강아지 (몸은 옆, 얼굴은 앞을 봐요. 귀가 축 처진 크림색 아기 강아지) ----------
  const DOG_HEAD = [
    "...BBBBBB...",
    "..BlBBBBBB..",
    ".DBlBBBBBBD.",
    "DDBBBBBBBBDD",
    "DDBBBBBBBBDD",
    "DDBBBBBBBBDD",
    ".DCBWWWWBCD.",
    "..BWWNNWWB..",
    "...WWWWWW...",
    "....WWWW....",
  ];
  const DOG_BODY = [
    "..BBBBBBBB..",
    ".BlllBBBBBB.",
    "BBBBBBBBBBBB",
    "BBBBBBBBBBBB",
    "DBBBWWWWBBBD",
    ".DDDDDDDDDD.",
  ];
  const DOG_W = 22, DOG_H = 15;
  // frame: stand, walk1, walk2, sit / tail: 0 위, 1 옆 / face: "", happy
  function dogRows(frame, tail, face) {
    const g = blank(DOG_W, DOG_H);
    const sit = frame === "sit";
    const bx = sit ? 3 : 1, by = sit ? 7 : 6, hx = 9, hy = sit ? 1 : 0;
    // 꼬리
    if (tail) { put(g, bx - 1, by + 1, "B"); put(g, bx - 2, by + 1, "B"); put(g, bx - 2, by, "l"); }
    else { put(g, bx, by - 1, "B"); put(g, bx - 1, by - 2, "B"); put(g, bx - 1, by - 3, "l"); }
    // 다리
    if (sit) {
      rect(g, bx, 12, 4, 1, "B"); rect(g, bx, 13, 4, 1, "W");
      rect(g, 11, 11, 2, 2, "B"); rect(g, 14, 11, 2, 2, "B"); rect(g, 11, 13, 2, 1, "W"); rect(g, 14, 13, 2, 1, "W");
    } else {
      const lift = frame === "walk1" ? [1, 0, 0, 1] : frame === "walk2" ? [0, 1, 1, 0] : [0, 0, 0, 0];
      [2, 5, 9, 12].forEach((x, i) => { rect(g, x, 11 - lift[i], 2, 2, i === 1 || i === 2 ? "D" : "B"); rect(g, x, 13 - lift[i], 2, 1, "W"); });
    }
    stamp(g, sit ? DOG_BODY.slice(0, 5) : DOG_BODY, bx, by);
    stamp(g, DOG_HEAD, hx, hy);
    eye(g, hx + 3, hy + 4, face === "happy" ? "happy" : "");
    eye(g, hx + 7, hy + 4, face === "happy" ? "happy" : "");
    if (face === "happy") { rect(g, hx + 5, hy + 8, 2, 2, "R"); put(g, hx + 5, hy + 8, "M"); put(g, hx + 6, hy + 8, "M"); }
    return rows(outline(g));
  }
  function dogImg(frame, tail, face) {
    const key = `dog2|${frame}|${tail ? 1 : 0}|${face || ""}`;
    return A.fromRows(key, dogRows(frame, tail, face), { o: "#4a3428", B: "#f2d1a4", l: "#fbe6c6", D: "#d9a46c", W: "#fff6e6", N: "#3b2a20", C: "#ffa8a8", K: "#2e221c", R: "#ff8aa0", M: "#c0506a" }).uri;
  }
  // ---------- 닭 ----------
  const HEN = {
    stand: ["...R.....", "..RWW....", ".YWEW....", "..WWWWWWW", "..WWWWWW.", "...WWWWW.", "....Y.Y.."],
    peck: [".........", "....WWWWW", "...WWWWWW", ".RWWWWWWW", "YWEWWWWW.", ".WW.WWW..", "....Y.Y.."],
    walk: ["...R.....", "..RWW....", ".YWEW....", "..WWWWWWW", "..WWWWWW.", "...WWWWW.", "...Y...Y."],
  };
  function henImg(frame) {
    const g = blank(11, 8);
    stamp(g, HEN[frame] || HEN.stand, 1, 1);
    return A.fromRows("hen|" + frame, rows(outline(g)), { o: OUT, R: "#e8504f", W: "#ffffff", E: "#2e221c", Y: "#f5b94e" }).uri;
  }

  // ---------- 도구와 물건 ----------
  const TOOL = {
    hoe: [["........MMM.", ".......MLMM.", "........WM..", ".......W....", "......W.....", ".....W......", "....W.......", "...W........", "..W.........", ".W.........."], { M: "#9aa1ab", L: "#dfe6ee", W: "#a97b55" }],
    hoeV: [["MMMMM.", "MLLMM.", "MMMMM.", "..W...", "..W...", "..W...", "..W...", "..W...", "..W...", "..W...", "..W...", "..W..."], { M: "#9aa1ab", L: "#dfe6ee", W: "#a97b55" }],
    can: [["............", "..BBBB......", ".B....B.....", "BBBBBBBB...N", "BLBBBBBB..N.", "BBBBBBBBNN..", "BBBBBBBB....", ".BBBBBB....."], { B: "#5f9fd8", L: "#bfe3ff", N: "#4f86c0" }],
    sickle: [["...MMMM.....", "..M....M....", ".M......M...", ".M..........", "..M.........", "...W........", "....W.......", ".....W......", "......W....."], { M: "#6a7a8c", W: "#8a5f3f" }],
    seed: [[".KKKKKK.", "KWWWWWWK", "KWGGWWWK", "KWGRGWWK", "KWWGWWWK", "KWWWWWWK", "KKKKKKKK"], { K: "#9a785a", W: "#f3e4bc", G: "#7cc46e", R: "#ff7a6a" }],
    fert: [["..KK..", ".KBBK.", "KBBBBK", "KBDDBK", "KBBBBK", ".KKKK."], { K: "#6a5a4a", B: "#c99a6e", D: "#7a5a3a" }],
    spr: [["...B...", "..BLB..", ".BSSSB.", "BLSDSLB", ".BSSSB.", "..BLB..", "...B..."], { B: "#7fb2e5", L: "#dff3ff", S: "#c9cdd4", D: "#6a7a9c" }],
    coin: [[".YYYY.", "YLYYYY", "YYDDYY", "YYDDYY", "YYYYDY", ".YYYY."], { Y: "#ffd34d", L: "#fff4b0", D: "#e3a524" }],
    clock: [[".WWWW.", "WWWKWW", "WWWKWW", "WWKKWW", "WWWWWW", ".WWWW."], { W: "#fff3dc", K: "#5b4638" }],
    sun: [["..Y..Y..", "...YY...", "Y.YYYY.Y", ".YYYYYY.", ".YYYYYY.", "Y.YYYY.Y", "...YY...", "..Y..Y.."], { Y: "#ffc93c" }],
    cloud: [["..WWW...", ".WWWWW..", "WWWWWWWW", "WWWWWWWW", ".GGGGGG."], { W: "#ffffff", G: "#d6e2ee" }],
    rain: [["..WWW...", ".WWWWW..", "WWWWWWWW", ".GGGGGG.", "B..B..B.", ".B..B..B"], { W: "#e6eef6", G: "#b8c8d8", B: "#5f9fd8" }],
    snow: [["..WWW...", ".WWWWW..", "WWWWWWWW", ".GGGGGG.", "W..W..W.", ".W..W..W"], { W: "#ffffff", G: "#c8d4e0" }],
    leaf: [["....GG", "..GGLG", ".GGLGG", "GGLGG.", "GLG...", "G....."], { G: "#7cc46e", L: "#a6dc8f" }],
    check: [["......K", ".....KK", "K...KK.", "KK.KK..", ".KKK...", "..K...."], { K: "#4e9a5c" }],
    box: [["KKKKKK", "K....K", "K....K", "K....K", "K....K", "KKKKKK"], { K: "#9a785a" }],
  };
  function toolImg(n, s, cls) { const t = TOOL[n]; return t ? A.rowsImg("tl_" + n, t[0], t[1], s || 3, cls) : ""; }
  function toolUri(n) { const t = TOOL[n]; return t ? A.fromRows("tl_" + n, t[0], t[1]).uri : ""; }

  // 숲 가장자리 나무, 덤불, 울타리
  const DECO = {
    pine: [["......G......", ".....GGG.....", "....GgGGG....", "...GGGGgGG...", "....GGGGG....", "...GgGGGGG...", "..GGGGgGGGG..", "...GGGGGGG...", "..GGgGGGGgG..", ".GGGGGGGGGGG.", "GGGGGgGGGGGGG", ".....TT......", ".....TT......"], { G: "#4f9a5c", g: "#7cc46e", T: "#7a5236" }],
    oak: [["....GGGGG....", "..GGGgGGGGG..", ".GGgGGGGGgGG.", "GGGGGGGgGGGGG", "GGgGGGGGGGGGG", "GGGGGgGGGgGGG", ".GGGGGGGGGGG.", "..GGGGTGGGG..", "......TT.....", ".....TTT.....", "....TTTTT...."], { G: "#5fae5f", g: "#8fd16b", T: "#8a5f3f" }],
    bush: [["..GGGG...", ".GGgGGG..", "GGGGGgGG.", "GgGGGGGGG", ".GGGGGGG."], { G: "#5fae5f", g: "#8fd16b" }],
    flower: [[".P.", "PYP", ".P.", ".G."], { P: "#ff9ab8", Y: "#ffe066", G: "#5fae5f" }],
    fence: [["P.........", "PP........", "PPWWWWWWWW", "PPDDDDDDDD", "PP........", "PPWWWWWWWW", "PPDDDDDDDD", "PP........", "PP........"], { P: "#a97b55", W: "#d9a66e", D: "#8a5f3f" }],
    tuft: [["..g...", ".gGg.g", "gGgGgG"], { g: "#7cc46e", G: "#5d9a50" }],
    daisy: [[".W.", "WYW", ".W.", ".G."], { W: "#ffffff", Y: "#ffe066", G: "#5fae5f" }],
    rose: [[".R.", "RrR", ".G.", "GG."], { R: "#ff7a8a", r: "#ffb3c0", G: "#5fae5f" }],
    stone: [[".SSS.", "SLSSS", "SSSSD", ".SDD."], { S: "#c9c2b6", L: "#ece6dc", D: "#9a9284" }],
  };
  function decoImg(n, s, cls) { const t = DECO[n]; return t ? A.rowsImg("dc_" + n, t[0], t[1], s || 3, cls) : ""; }
  function decoUri(n) { const t = DECO[n]; return t ? A.fromRows("dc_" + n, t[0], t[1]).uri : ""; }

  // ---------- 게임 창 틀 (9칸 나누기) ----------
  function svgFrame(rowsArr, colors) {
    const h = rowsArr.length, w = rowsArr[0].length;
    let r = "";
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = rowsArr[y][x]; if (c !== ".") r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${colors[c]}"/>`; }
    return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' shape-rendering='crispEdges'>${r}</svg>`)}")`;
  }
  const FR = {
    // 나무 틀 + 양피지 속
    paper: [["..DDDDDDDD..", ".DWWWWWWWWD.", "DWHHHHHHHHMD", "DWHFFFFFFSMD", "DWHFFFFFFSMD", "DWHFFFFFFSMD", "DWHFFFFFFSMD", "DWHFFFFFFSMD", "DWHFFFFFFSMD", "DWSSSSSSSSMD", ".DMMMMMMMMD.", "..DDDDDDDD.."], { D: "#4a2c18", W: "#d08a4a", H: "#f2b878", M: "#9a5a2e", S: "#ead2a0", F: "#fbefcf" }],
    // 통나무 판 (도구 칸 바탕, 이름표)
    wood: [["..DDDDDDDD..", ".DHHHHHHHHD.", "DHWWWWWWWWMD", "DHWWWWWWWWMD", "DHWWwWWWWWMD", "DHWWWWWWwWMD", "DHWWWWWWWWMD", "DHWwWWWWWWMD", "DHWWWWWwWWMD", "DHWWWWWWWWMD", ".DMMMMMMMMD.", "..DDDDDDDD.."], { D: "#4a2c18", H: "#e0a060", W: "#b8743c", w: "#a0622e", M: "#8a4f26" }],
    // 아이템 칸 (안으로 파인 칸)
    slot: [["DDDDDDDDDDDD", "DKKKKKKKKKKD", "DKffffffffLD", "DKfFFFFFFfLD", "DKfFFFFFFfLD", "DKfFFFFFFfLD", "DKfFFFFFFfLD", "DKfFFFFFFfLD", "DKfFFFFFFfLD", "DKffffffffLD", "DLLLLLLLLLLD", "DDDDDDDDDDDD"], { D: "#4a2c18", K: "#8a5530", L: "#f2c890", f: "#e8c48a", F: "#f3d6a0" }],
    slotOn: [["RRRRRRRRRRRR", "RYYYYYYYYYYR", "RYffffffffYR", "RYfFFFFFFfYR", "RYfFFFFFFfYR", "RYfFFFFFFfYR", "RYfFFFFFFfYR", "RYfFFFFFFfYR", "RYfFFFFFFfYR", "RYffffffffYR", "RYYYYYYYYYYR", "RRRRRRRRRRRR"], { R: "#c0392b", Y: "#ff8a4a", f: "#ffe0a0", F: "#fff0c8" }],
    // 나무 단추
    btn: [["..DDDDDDDD..", ".DHHHHHHHHD.", "DHYYYYYYYYMD", "DHYYYYYYYYMD", "DHYYYYYYYYMD", "DHYYYYYYYYMD", "DHYYYYYYYYMD", "DHYYYYYYYYMD", "DMMMMMMMMMMD", "DMMMMMMMMMMD", ".DMMMMMMMMD.", "..DDDDDDDD.."], { D: "#4a2c18", H: "#ffe9a8", Y: "#ffd06a", M: "#c98a2e" }],
    btnDim: [["..DDDDDDDD..", ".DHHHHHHHHD.", "DHYYYYYYYYMD", "DHYYYYYYYYMD", "DHYYYYYYYYMD", "DHYYYYYYYYMD", "DHYYYYYYYYMD", "DHYYYYYYYYMD", "DMMMMMMMMMMD", "DMMMMMMMMMMD", ".DMMMMMMMMD.", "..DDDDDDDD.."], { D: "#4a2c18", H: "#fff6e0", Y: "#f3e2bc", M: "#c9a46e" }],
    // 말풍선
    bubble: [["..KKKKKKKK..", ".KWWWWWWWWK.", "KWWWWWWWWWWK", "KWWWWWWWWWWK", "KWWWWWWWWWWK", "KWWWWWWWWWWK", "KWWWWWWWWWWK", "KWWWWWWWWWWK", "KWWWWWWWWWWK", "KGGGGGGGGGGK", ".KGGGGGGGGK.", "..KKKKKKKK.."], { K: "#3b2a20", W: "#ffffff", G: "#e6ddd0" }],
    // 어두운 알림판
    dark: [["..KKKKKKKK..", ".KDDDDDDDDK.", "KDDDDDDDDDDK", "KDDDDDDDDDDK", "KDDDDDDDDDDK", "KDDDDDDDDDDK", "KDDDDDDDDDDK", "KDDDDDDDDDDK", "KDDDDDDDDDDK", "KDDDDDDDDDDK", ".KDDDDDDDDK.", "..KKKKKKKK.."], { K: "#2a1c14", D: "#5b4030" }],
  };
  function frames() {
    const o = {};
    for (const k in FR) o["--fr-" + k] = svgFrame(FR[k][0], FR[k][1]);
    return o;
  }

  window.FSprites = { CH_W, CH_H, HIPPO_SWIM, DOG_W, DOG_H, charImg, charRows, dogImg, henImg, hippoImg, sheepImg, catImg, toolImg, toolUri, decoImg, decoUri, frames, PEOPLE };
})();
