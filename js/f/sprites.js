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

  // ---------- 사람 (머리가 큰 2등신, 동물 잠옷을 입을 수 있어요) ----------
  const PEOPLE = {
    him: { H: "#4a4038", h: "#6e5e52", S: "#fbdcc0", s: "#ecc0a0", E: "#2e221c", W: "#ffffff", C: "#ffaaa8", m: "#e0907a", M: "#c9735f", T: "#8cc0ee", t: "#6a9fd4", P: "#5c6f9c", K: "#4a3a30" },
    her: { H: "#7a5440", h: "#a07458", S: "#fbdcc0", s: "#ecc0a0", E: "#2e221c", W: "#ffffff", C: "#ffaaa8", m: "#e0907a", M: "#c9735f", T: "#ffd978", t: "#f0b54a", P: "#fbdcc0", K: "#c96a52", R: "#ff7aa8", r: "#e05a88" },
  };
  // 동물 잠옷: U 바탕, u 그늘, b 배, i 귀 안쪽, f 발, 그 밖의 색은 무늬
  const PAJAMAS = [
    { id: "bear", name: "곰돌이 잠옷", ear: "round", tail: "puff", c: { U: "#b98a62", u: "#9a6e4c", b: "#ecd2b0", i: "#f2b8a0", f: "#8a6044" } },
    { id: "bunny", name: "토끼 잠옷", ear: "long", tail: "puff", c: { U: "#fff8f0", u: "#e8dcd6", b: "#ffd8e2", i: "#ffb0c8", f: "#f2c0cc" } },
    { id: "cat", name: "고양이 잠옷", ear: "point", tail: "long", c: { U: "#98a3b5", u: "#7b879c", b: "#dde2ea", i: "#f2a0b4", f: "#dde2ea" } },
    { id: "sheep", name: "아기 양 잠옷", ear: "floppy", tail: "puff", top: "wool", c: { U: "#f4ece0", u: "#dcd0c4", b: "#fbe6d2", i: "#f6a8b8", f: "#8a7062", w: "#ffffff" } },
    { id: "hippo", name: "아기 하마 잠옷", ear: "tiny", tail: "nub", c: { U: "#c9b6e6", u: "#a896cf", b: "#f8d6e6", i: "#ff9ab8", f: "#a896cf" } },
    { id: "puppy", name: "강아지 잠옷", ear: "floppy", tail: "up", c: { U: "#f2d1a4", u: "#d9a46c", b: "#fff6e6", i: "#d9a46c", f: "#d9a46c" } },
    { id: "frog", name: "개구리 잠옷", ear: "frog", tail: "", c: { U: "#8cd47a", u: "#68b05a", b: "#d8f2b8", i: "#ffffff", f: "#68b05a" } },
    { id: "chick", name: "병아리 잠옷", ear: "tuft", tail: "", beak: 1, c: { U: "#ffe066", u: "#f0c040", b: "#fff2b0", i: "#ffe066", f: "#ff9a3c", B: "#ff9a3c" } },
    { id: "panda", name: "판다 잠옷", ear: "round", tail: "puff", limbs: "k", c: { U: "#ffffff", u: "#e2e2ea", b: "#ffffff", i: "#3a3a44", f: "#3a3a44", k: "#3a3a44" }, earC: "k" },
    { id: "fox", name: "여우 잠옷", ear: "point", tail: "bushy", c: { U: "#f29a4a", u: "#d07a30", b: "#fff4e6", i: "#fff4e6", f: "#4a3428", k: "#4a3428" } },
    { id: "tiger", name: "호랑이 잠옷", ear: "round", tail: "long", stripes: 1, c: { U: "#ffb04a", u: "#e08a28", b: "#fff4e6", i: "#fff4e6", f: "#fff4e6", x: "#5a3a28" } },
    { id: "penguin", name: "펭귄 잠옷", ear: "", tail: "", beak: 1, c: { U: "#3e4a5e", u: "#2e3848", b: "#ffffff", i: "#3e4a5e", f: "#ff9a3c", B: "#ff9a3c" } },
    { id: "dino", name: "공룡 잠옷", ear: "spikes", tail: "dino", c: { U: "#7cc46e", u: "#5a9e50", b: "#fff2b0", i: "#ffe066", f: "#5a9e50", g: "#ffd34d" } },
    { id: "pig", name: "아기 돼지 잠옷", ear: "point", tail: "curl", snout: 1, c: { U: "#ffc0cc", u: "#f09aac", b: "#ffe0e6", i: "#ff8aa0", f: "#f09aac", n: "#ff8aa0", q: "#b84a64" } },
    { id: "koala", name: "코알라 잠옷", ear: "koala", tail: "", c: { U: "#a8b0bc", u: "#8a929e", b: "#e6e8ee", i: "#ffffff", f: "#8a929e", k: "#3a3a44" } },
    { id: "deer", name: "아기 사슴 잠옷", ear: "deer", tail: "puff", spots: 1, c: { U: "#c98a5a", u: "#a86c40", b: "#fff4e6", i: "#f2b8a0", f: "#6a4a36", A: "#e8c890", W: "#ffffff" } },
  ];
  const PJ = {};
  PAJAMAS.forEach((p) => { PJ[p.id] = p; });
  const HEADS = {
    him: {
      down: [".....HHHHHH.....", "...HHHHHHHHHH...", "..HHHhhHHHHHHH..", ".HHHhHHHHHHHHHH.", ".HHHHHHHHHHHHHH.", ".HHSHHHHSHHHSHH.", ".HSSSSSSSSSSSSH.", ".HSSWESSSSWESSH.", ".SSSEESSSSEESSS.", ".SCCSSSmmSSSCCS.", "..SSSSSSSSSSSS..", "....SSSSSSSS...."],
      side: ["....HHHHHH......", "..HHHHHHHHHH....", ".HHHHhhHHHHHH...", "HHHhhHHHHHHHHH..", "HHHHHHHHHHHHHHH.", "HHHHHHHHHSHHSHH.", "HHHHHHSSSSSSSSS.", "HHHHHsSSSSWESSSS", "HHHHHsSSSSEESSSS", ".HHHHSSSSSSCCSS.", ".HHHSSSSSSSSmS..", "...HSSSSSSSSS..."],
      up: [".....HHHHHH.....", "...HHHHHHHHHH...", "..HHHhhHHHHHHH..", ".HHHhHHHHHHHHHH.", ".HHHHHHHHHHHHHH.", ".HHHHHHhHHHHHHH.", ".HHHHHHHHHHHHHH.", ".HHHHHHHHHHHHHH.", "sHHHHHHHHHHHHHHs", ".HHHHHHHHHHHHHH.", "..HHHHHHHHHHHH..", "....SSSSSSSS...."],
    },
    her: {
      down: [".....HHHHHH.....", "...HHHHHHHHHH...", "..HHHhhHHHHHHH..", ".HHHhHHHHHHHHHH.", ".HHHHHHHHHHHHHH.", "HHHHHHHHHSHHHHHH", "HHSSSSSSSSSSSSHH", "HHSSWESSSSWESSHH", "HSSSEESSSSEESSSH", "HSCCSSSmmSSSCCSH", "HHSSSSSSSSSSSSHH", "HHHHSSSSSSSSHHHH"],
      side: ["....HHHHHH......", "..HHHHHHHHHH....", ".HHHHhhHHHHHH...", "HHHhhHHHHHHHHH..", "HHHHHHHHHHHHHHH.", "HHHHHHHHHHHHSHH.", "HHHHHHSSSSSSSSS.", "HHHHHsSSSSWESSSS", "HHHHHsSSSSEESSSS", "HHHHHSSSSSSCCSS.", "HHHHSSSSSSSSmS..", "HHHHHSSSSSSSS..."],
      up: [".....HHHHHH.....", "...HHHHHHHHHH...", "..HHHhhHHHHHHH..", ".HHHhHHHHHHHHHH.", ".HHHHHHHHHHHHHH.", "HHHHHHhHHHHHHHHH", "HHHHHHHHHHHHHHHH", "HHHHHHHHHHHHHHHH", "HHHHHHHHHHHHHHHH", "HHHHHHHHHHHHHHHH", "HHHHHHHHHHHHHHHH", "HHHHHHHHHHHHHHHH"],
    },
  };
  // 후드가 덮는 곳과 얼굴이 보이는 창
  const HOOD_ROWS = [[4, 11], [2, 13], [1, 14], [0, 15], [0, 15], [0, 15], [0, 15], [0, 15], [0, 15], [0, 15], [0, 15], [1, 14]];
  function faceWin(dir, x, y) {
    if (dir === "up") return false;
    if (dir === "down") return (y >= 5 && y <= 10 && x >= 2 && x <= 13) || (y === 11 && x >= 4 && x <= 11);
    return (y >= 5 && y <= 10 && x >= 6 && x <= 15) || (y === 11 && x >= 5 && x <= 12);
  }
  const CH_W = 18, CH_H = 23, TOP = 3, FOOT = 21, HX = 1;
  // 귀 모양 (왼쪽 귀, 머리 왼쪽 위 기준. 오른쪽은 거울로)
  const EARS = {
    round: { at: [1, -2], rows: [".UU.", "UiiU", "UiiU"] },
    long: { at: [3, -5], rows: ["UU.", "UiU", "UiU", "UiU", "UiU", "UUU"] },
    point: { at: [1, -2], rows: ["U..", "UU.", "UiU", "UiiU"] },
    tiny: { at: [3, -1], rows: ["UU", "Ui"] },
    frog: { at: [1, -3], rows: [".UUU.", "UiiiU", "UiEiU", "UUUUU"] },
    koala: { at: [-1, -1], rows: [".UUU.", "UiiiU", "UiiiU", ".UUU."] },
    deer: { at: [2, -4], rows: ["A.A.", "AAA.", ".A..", ".A.."] },
  };
  function charRows(who, dir, frame, pose, face, pj) {
    const g = blank(CH_W, CH_H);
    const girl = who === "her";
    const P = pj && PJ[pj];
    const crouch = pose === "crouch";
    const oy = TOP + (crouch ? 2 : frame ? 1 : 0);
    const by = oy + 12;
    const H = (x, y, c) => put(g, HX + x, oy + y, c);
    // 잠옷 꼬리 (몸 뒤)
    if (P && P.tail) {
      if (dir === "side") {
        const tx = 5, ty = by + 2;
        if (P.tail === "puff") { rect(g, tx - 2, ty, 2, 2, "U"); }
        else if (P.tail === "long") { put(g, tx - 1, ty + 1, "U"); put(g, tx - 2, ty, "U"); put(g, tx - 3, ty - 1, "U"); put(g, tx - 3, ty - 2, P.stripes ? "x" : "U"); }
        else if (P.tail === "bushy") { rect(g, tx - 3, ty - 1, 3, 3, "U"); put(g, tx - 3, ty - 1, "b"); put(g, tx - 4, ty, "b"); }
        else if (P.tail === "dino") { rect(g, tx - 3, ty + 1, 3, 2, "U"); put(g, tx - 4, ty + 2, "U"); put(g, tx - 2, ty, "g"); }
        else if (P.tail === "curl") { put(g, tx - 1, ty, "U"); put(g, tx - 2, ty - 1, "U"); put(g, tx - 1, ty - 2, "U"); }
        else if (P.tail === "up") { put(g, tx - 1, ty, "U"); put(g, tx - 2, ty - 1, "U"); put(g, tx - 2, ty - 2, "U"); }
        else if (P.tail === "nub") put(g, tx - 1, ty + 1, "U");
      }
    }
    // 여자 뒷머리 (잠옷을 입으면 후드 속에 들어가요)
    if (girl && !P) {
      if (dir === "down") { rect(g, HX, by - 1, 2, 3, "H"); rect(g, HX + 14, by - 1, 2, 3, "H"); }
      if (dir === "side") { rect(g, HX, by - 1, 5, 3, "H"); rect(g, HX + 1, by + 2, 3, 1, "H"); }
    }
    // 몸통
    const bodyC = P ? "U" : "T", lowC = P ? "U" : "P";
    if (P) {
      if (dir === "side") { rect(g, 6, by, 6, 4, "U"); rect(g, 6, by + 3, 6, 1, "u"); rect(g, 9, by + 1, 3, 2, "b"); }
      else { rect(g, 5, by, 8, 4, "U"); rect(g, 5, by + 3, 8, 1, "u"); if (dir === "down") rect(g, 7, by + 1, 4, 2, "b"); else if (P.tail) rect(g, 8, by + 2, 2, 2, P.tail === "bushy" || P.tail === "puff" ? "b" : "U"); }
    } else if (girl) {
      if (dir === "side") { rect(g, 6, by, 6, 2, "T"); rect(g, 5, by + 2, 8, 1, "T"); rect(g, 5, by + 3, 8, 1, "t"); }
      else { rect(g, 5, by, 8, 3, "T"); rect(g, 4, by + 3, 10, 1, "t"); if (dir === "down") { put(g, 8, by, "W"); put(g, 9, by, "W"); } }
    } else {
      if (dir === "side") { rect(g, 6, by, 6, 3, "T"); rect(g, 6, by + 3, 6, 1, "P"); }
      else { rect(g, 5, by, 8, 3, "T"); rect(g, 5, by + 2, 8, 1, "t"); rect(g, 5, by + 3, 8, 1, "P"); if (dir === "down") { put(g, 8, by, "W"); put(g, 9, by, "W"); } }
    }
    const armC = P ? (P.limbs || "U") : bodyC;
    // 팔
    const swing = frame === 1 ? -1 : frame === 2 ? 1 : 0;
    const up = pose === "wave1" || pose === "wave2" || pose === "raise" || pose === "hold";
    if (pose === "wave1" || pose === "wave2") {
      rect(g, 4, by, 1, 2, armC); put(g, 4, by + 2, "S");
    } else if (up) {
      // 머리를 그린 뒤에 올려요
    } else if (dir === "side") {
      if (pose === "act") { rect(g, 10, by + 1, 4, 1, armC); put(g, 14, by + 1, "S"); }
      else { const ax = 9 + swing; rect(g, ax, by, 1, 2, P ? (P.limbs || "u") : "t"); put(g, ax, by + 2, "S"); }
    } else if (pose === "act") {
      rect(g, 4, by, 1, 2, armC); rect(g, 13, by, 1, 2, armC);
      rect(g, 5, by + 2, 2, 1, "S"); rect(g, 11, by + 2, 2, 1, "S");
    } else {
      rect(g, 4, by + Math.max(0, swing), 1, 2, armC); put(g, 4, by + 2 + swing, "S");
      rect(g, 13, by + Math.max(0, -swing), 1, 2, armC); put(g, 13, by + 2 - swing, "S");
    }
    // 다리
    const legC = P ? (P.limbs || "U") : lowC, footC = P ? "f" : "K";
    const leg = (x, bottom, c) => { const top = by + 4; if (bottom > top) rect(g, x, top, 2, bottom - top, c); rect(g, x, bottom, 2, 1, footC); };
    if (crouch) {
      rect(g, 4, FOOT - 1, 2, 1, legC); rect(g, 12, FOOT - 1, 2, 1, legC);
      rect(g, 4, FOOT, 2, 1, footC); rect(g, 12, FOOT, 2, 1, footC);
    } else if (dir === "side") {
      const back = P ? (P.limbs || "u") : (girl ? "s" : "P");
      if (frame === 1) { leg(10, FOOT, legC); leg(6, FOOT - 1, back); }
      else if (frame === 2) { leg(6, FOOT, legC); leg(10, FOOT - 1, back); }
      else { leg(7, FOOT, back); leg(9, FOOT, legC); }
    } else {
      leg(6, FOOT - (frame === 1 ? 1 : 0), legC); leg(10, FOOT - (frame === 2 ? 1 : 0), legC);
    }
    // 머리
    const base = HEADS[girl ? "her" : "him"][dir];
    if (!P) stamp(g, base, HX, oy);
    else {
      HOOD_ROWS.forEach(([a, b], y) => { for (let x = a; x <= b; x++) {
        if (faceWin(dir, x, y)) { const c = base[y][x]; H(x, y, c === "." ? "S" : c === "H" || c === "h" ? (y === 5 ? "H" : "S") : c); }
        else H(x, y, "U");
      } });
      // 후드 테두리
      HOOD_ROWS.forEach(([a, b], y) => { for (let x = a; x <= b; x++) {
        if (faceWin(dir, x, y)) continue;
        if (faceWin(dir, x - 1, y) || faceWin(dir, x + 1, y) || faceWin(dir, x, y - 1) || faceWin(dir, x, y + 1)) H(x, y, "u");
      } });
      // 귀
      const mirror = (rs) => rs.map((r) => r.split("").reverse().join(""));
      const earC = (c) => (c === "U" && P.earC ? P.earC : c === "i" && P.earC ? "k" : c);
      const drawEar = (rs, x0, y0) => rs.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== ".") H(x0 + i, y0 + j, earC(r[i])); });
      if (P.ear === "floppy") {
        const fl = ["UU", "Uu", "uU", "uu"];
        if (dir === "down" || dir === "up") { drawEar(fl, -1, 3); drawEar(fl, 15, 3); }
        else drawEar(fl, 2, 3);
      } else if (P.ear === "tuft") { H(7, -1, "U"); H(8, -2, "U"); H(8, -1, "U"); H(9, -2, "U"); }
      else if (P.ear === "spikes") { const sp = dir === "side" ? [[2, 1], [4, 0], [7, -1], [10, 0]] : [[4, 0], [7, -1], [8, -1], [11, 0]]; sp.forEach(([x, y]) => { H(x, y, "g"); H(x, y + 1, "g"); }); }
      else if (EARS[P.ear]) {
        const e = EARS[P.ear];
        if (dir === "side") { drawEar(e.rows, e.at[0] + 2, e.at[1]); if (P.ear !== "koala") drawEar(mirror(e.rows), 15 - e.at[0] - e.rows[0].length + 1 - 2, e.at[1] + 1); }
        else { drawEar(e.rows, e.at[0], e.at[1]); drawEar(mirror(e.rows), 16 - e.at[0] - e.rows[0].length, e.at[1]); }
      }
      if (P.top === "wool") [[3, 1], [6, 0], [9, 0], [12, 1], [5, 2], [10, 2]].forEach(([x, y]) => H(x, y, "w"));
      if (P.stripes && dir !== "side") { [[7, 1], [7, 2], [8, 1], [8, 2], [0, 6], [1, 6], [15, 6], [14, 6]].forEach(([x, y]) => H(x, y, "x")); }
      if (P.stripes && dir === "side") { [[4, 1], [4, 2], [1, 6], [2, 6]].forEach(([x, y]) => H(x, y, "x")); }
      if (P.spots) { (dir === "side" ? [[2, 4], [4, 7]] : [[2, 3], [13, 3]]).forEach(([x, y]) => H(x, y, "W")); }
      if (P.beak && dir === "down") { H(7, 4, "B"); H(8, 4, "B"); }
      if (P.beak && dir === "side") { H(14, 4, "B"); H(15, 4, "B"); }
      if (P.snout && dir === "down") { rect(g, HX + 6, oy + 2, 4, 2, "n"); H(7, 3, "q"); H(8, 3, "q"); }
      if (P.snout && dir === "side") { rect(g, HX + 12, oy + 2, 3, 2, "n"); H(13, 3, "q"); }
      if (P.ear === "koala" && dir === "down") { H(7, 3, "k"); H(8, 3, "k"); }
      // 예은이는 후드 사이로 머리카락이 살짝 보여요
      if (girl && dir === "down") { for (let y = 6; y <= 10; y++) { H(2, y, "H"); H(13, y, "H"); } H(3, 6, "H"); H(12, 6, "H"); }
      if (girl && dir === "side") { for (let y = 6; y <= 10; y++) H(6, y, "H"); H(7, 6, "H"); }
    }
    // 리본 (잠옷이 아닐 때)
    if (girl && !P) {
      const rx = HX + (dir === "side" ? 3 : 10);
      put(g, rx, oy, "R"); put(g, rx + 2, oy, "R"); put(g, rx + 1, oy, "r"); put(g, rx, oy + 1, "R"); put(g, rx + 1, oy + 1, "r"); put(g, rx + 2, oy + 1, "R");
    }
    // 머리 위로 올린 팔 (머리보다 앞에)
    if (pose === "wave1") { rect(g, 16, oy + 4, 1, by - oy - 3, armC); rect(g, 16, oy + 2, 2, 2, "S"); }
    if (pose === "wave2") { rect(g, 16, oy + 6, 1, by - oy - 5, armC); put(g, 17, oy + 5, armC); rect(g, 17, oy + 3, 1, 2, "S"); }
    if (pose === "raise" || pose === "hold") {
      rect(g, 0, oy + 1, 1, by - oy, armC); rect(g, 17, oy + 1, 1, by - oy, armC);
      rect(g, 0, oy - 1, 1, 2, "S"); rect(g, 17, oy - 1, 1, 2, "S");
    }
    // 표정
    if (dir !== "up" && (face === "blink" || face === "happy")) {
      const eyes = dir === "side" ? [HX + 10] : [HX + 4, HX + 10];
      const ey = oy + 7;
      eyes.forEach((x) => { rect(g, x, ey, 2, 2, "S"); });
      if (face === "blink") eyes.forEach((x) => rect(g, x, ey + 1, 2, 1, "E"));
      else eyes.forEach((x) => { rect(g, x, ey, 2, 1, "E"); put(g, x - 1, ey + 1, "E"); put(g, x + 2, ey + 1, "E"); });
      if (face === "happy") { if (dir === "down") { put(g, HX + 7, oy + 9, "M"); put(g, HX + 8, oy + 9, "M"); } else put(g, HX + 12, oy + 10, "M"); }
    }
    return rows(outline(g));
  }
  // 지금 입은 잠옷은 바깥(옷장)에서 알려 줘요
  function wearing(who) { try { return (window.HSWear && window.HSWear(who)) || ""; } catch (e) { return ""; } }
  function charImg(who, dir, frame, pose, face, pj) {
    if (pj === undefined) pj = wearing(who);
    const P = pj && PJ[pj];
    const key = `ch3|${who}|${dir}|${frame}|${pose || ""}|${face || ""}|${P ? pj : ""}`;
    return A.fromRows(key, charRows(who, dir, frame, pose || "", face || "", P ? pj : ""), Object.assign({ o: OUT }, PEOPLE[who] || PEOPLE.him, P ? P.c : {})).uri;
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

  // ---------- 아기 하마 (찹쌀떡처럼 동그랗게, 앞을 봐요) ----------
  // frame: stand, walk1, walk2, lie / face: "", blink, happy, yawn, sleep, sweat
  const mir = (half) => half.map((r) => r + r.split("").reverse().join(""));
  const HIPPO_BALL = mir(["..hH.....", ".hPHh..HH", "..HHHHHHH", ".HsHHHHHH", "HsHHHHHHH", "HHHHHHHHH", "HHHHHHHHH", "HHHHHHHHH", "HCCHLLLLL", "HHLLLLLLL", "HHLLLLLLL", "HHLLLLLuu", "hHHuuuuuu", "hHHHHHHHH", ".hhHHbbbb", "..hhhhhhh"]);
  const HIPPO_SWIM = 11; // 헤엄칠 때 물 위로 보이는 줄 수 (귀, 눈, 콧구멍)
  function hippoRows(frame, face) {
    const g = blank(20, 19);
    const lie = frame === "lie";
    const walk = frame === "walk1" || frame === "walk2";
    const look = walk ? 1 : 0; // 걸을 땐 가는 쪽을 봐요
    const body = lie ? HIPPO_BALL.filter((r, i) => i !== 5 && i !== 13) : HIPPO_BALL;
    const oy = 1 + (lie ? 2 : 0);
    // 발
    if (!lie) {
      const fl = frame === "walk1" ? 1 : 0, fr = frame === "walk2" ? 1 : 0;
      rect(g, 3, 16 - fl, 3, 1, "d"); rect(g, 14, 16 - fr, 3, 1, "d");
      rect(g, 3, 17 - fl, 3, 1, "D"); rect(g, 14, 17 - fr, 3, 1, "D");
    } else { rect(g, 2, 16, 3, 1, "d"); rect(g, 15, 16, 3, 1, "d"); }
    stamp(g, body, 1, oy);
    // 눈, 콧구멍
    const ef = face === "yawn" ? "blink" : face;
    eye(g, 3 + look, oy + 6, ef); eye(g, 15 + look, oy + 6, ef);
    if (face !== "yawn") { put(g, 7 + look, oy + 9, "N"); put(g, 12 + look, oy + 9, "N"); }
    // 입
    if (face === "yawn") { rect(g, 7, oy + 9, 6, 3, "M"); rect(g, 8, oy + 11, 4, 1, "T"); put(g, 7, oy + 9, "W"); put(g, 12, oy + 9, "W"); }
    else if (face === "happy") { put(g, 8 + look, oy + 11, "M"); put(g, 11 + look, oy + 11, "M"); put(g, 9 + look, oy + 12, "M"); put(g, 10 + look, oy + 12, "M"); }
    else { put(g, 9 + look, oy + 11, "u"); put(g, 10 + look, oy + 11, "u"); }
    if (face === "sweat") { put(g, 18, oy + 2, "B"); put(g, 18, oy + 3, "B"); put(g, 17, oy + 3, "B"); }
    return rows(outline(g));
  }
  function hippoImg(frame, face) {
    return A.fromRows(`hip4|${frame}|${face || ""}`, hippoRows(frame, face || ""), { o: "#4a3550", s: "#f4eeff", H: "#c9b6e6", h: "#a896cf", b: "#eadcf2", d: "#9a88c0", D: "#7a68a3", P: "#ff9ab8", L: "#f8d6e6", u: "#e3aecb", N: "#8a5a7a", C: "#ff9ab8", K: "#2e221c", W: "#ffffff", M: "#c0506a", T: "#ff8a9a", B: "#7fc4f0" }).uri;
  }

  // ---------- 아기 양 (앞을 보고 앉은 솜뭉치) ----------
  // frame: stand, walk1, walk2, eat, lie / face: "", blink, happy, baa, sleep
  const SHEEP_BALL = mir(["...WW.WWW", "..WWWWWWW", ".WWWwWWWW", "WWWWWWFFF", "WWWEFFFFF", "WwEEFFFFF", "WWWFFFFFF", "WWWFFFFFF", "WwWCFFFFF", "WWWFFFFff", "WWWWffWWW", "WwWWWWWWW", "WWWWWwWWW", ".wWWWWWWW", "..www.www"]);
  function sheepRows(frame, face) {
    const g = blank(20, 18);
    const lie = frame === "lie", eat = frame === "eat";
    const walk = frame === "walk1" || frame === "walk2";
    const look = walk ? 1 : 0;
    const body = lie ? SHEEP_BALL.filter((r, i) => i !== 11 && i !== 12) : SHEEP_BALL;
    const oy = 1 + (lie ? 2 : 0);
    if (!lie) {
      const fl = frame === "walk1" ? 1 : 0, fr = frame === "walk2" ? 1 : 0;
      rect(g, 4, 16 - fl, 2, 1, "G"); rect(g, 14, 16 - fr, 2, 1, "G");
      rect(g, 8, 16, 1, 1, "G"); rect(g, 11, 16, 1, 1, "G");
    }
    stamp(g, body, 1, oy);
    // 얼굴 (풀 먹을 땐 고개를 숙여요)
    const fy = oy + (eat ? 1 : 0);
    if (eat) { for (let x = 5; x <= 14; x++) if (g[oy + 3][x] === "F") g[oy + 3][x] = "W"; }
    eye(g, 5 + look, fy + 6, face); eye(g, 13 + look, fy + 6, face);
    put(g, 9 + look, fy + 8, "N"); put(g, 10 + look, fy + 8, "N");
    if (face === "baa") rect(g, 9 + look, fy + 9, 2, 2, "M");
    if (eat) { put(g, 9, 16, "q"); put(g, 10, 16, "q"); put(g, 8, 15, "q"); put(g, 11, 15, "q"); }
    return rows(outline(g));
  }
  function sheepImg(frame, face, wet) {
    return A.fromRows(`shp4|${frame}|${face || ""}|${wet ? 1 : 0}`, sheepRows(frame, face || ""), { o: "#5a4a48", W: wet ? "#e2e9f0" : "#ffffff", w: wet ? "#c2cfdc" : "#e9e2f2", F: "#fbe6d2", f: "#eccaae", E: "#f6a8b8", N: "#f08aa0", C: "#ffb0c4", K: "#2e221c", G: "#8a7062", M: "#c0506a", q: "#5fae5f" }).uri;
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

  window.FSprites = { PAJAMAS, PJ, CH_W, CH_H, HIPPO_SWIM, DOG_W, DOG_H, charImg, charRows, dogImg, henImg, hippoImg, sheepImg, catImg, toolImg, toolUri, decoImg, decoUri, frames, PEOPLE };
})();
