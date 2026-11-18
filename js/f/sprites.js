// ============================================================
// 우리 농장: 도트 그래픽 세트
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

  // ---------- 사람 ----------
  const PEOPLE = {
    him: { H: "#4a4038", h: "#6e5e52", S: "#f7d3b0", s: "#e8b890", E: "#2e221c", C: "#f4a58a", T: "#7fb2e5", t: "#5f8fc5", P: "#5c6f9c", p: "#46577f", K: "#4a3a30", W: "#ffffff" },
    her: { H: "#7a5440", h: "#9e7258", S: "#f7d3b0", s: "#e8b890", E: "#2e221c", C: "#f4a58a", T: "#ffd978", t: "#f0b54a", P: "#f7d3b0", p: "#e8b890", K: "#c96a52", R: "#ff8ab0", W: "#ffffff" },
  };
  const HEAD = {
    down: ["...HHHHHH...", ".HHHHHHHHHH.", "HHHhhHHHHHHH", "HHSSSSSSSSHH", "HSSSSSSSSSSH", "HSSESSSSESSH", "HSSESSSSESSH", "HSCSSSSSSCSH", ".SSSSSSSSSS.", "..SSSSSSSS.."],
    up: ["...HHHHHH...", ".HHHHHHHHHH.", "HHHhhHHHHHHH", "HHHHHhHHHHHH", "HHHHHHHHHHHH", "HHHHHHHHHHHH", "HHHHHHHHHHHH", "HHHHHHHHHHHH", ".HHHHHHHHHH.", "..SSSSSSSS.."],
    side: ["..HHHHHHH...", ".HHHHHHHHH..", "HHHHhhHHHHH.", "HHHHHHSSSSS.", "HHHHHSSSSSSS", "HHHHSSSSSESS", "HHHHSSSSSESS", ".HHHSSSSSSCS", "..HHSSSSSSS.", "...SSSSSSS.."],
  };
  // who, dir(down/up/side), frame(0 서기, 1·2 걷기), pose('', act 도구 들기, crouch 쪼그리기, hold 들어 올리기)
  function charRows(who, dir, frame, pose, face) {
    const g = blank(16, 23);
    const girl = who === "her";
    const oy = pose === "crouch" ? 3 : frame ? 1 : 0;
    // 여자 뒷머리 (몸보다 먼저 그려서 뒤에 깔려요)
    if (girl) {
      if (dir === "down") { rect(g, 2, oy + 4, 1, 8, "H"); rect(g, 13, oy + 4, 1, 8, "H"); }
      if (dir === "up") rect(g, 3, oy + 8, 10, 4, "H");
      if (dir === "side") rect(g, 2, oy + 6, 4, 6, "H");
    }
    // 몸통
    const by = oy + 10;
    if (girl) {
      const widths = dir === "side" ? [[5, 6], [5, 6], [4, 8], [4, 8], [4, 8], [3, 9]] : [[5, 6], [4, 8], [4, 8], [3, 10], [3, 10], [2, 12]];
      widths.forEach(([x, w], j) => rect(g, x, by + j, w, 1, j === widths.length - 1 ? "t" : "T"));
    } else {
      if (dir === "side") { rect(g, 5, by, 6, 5, "T"); rect(g, 5, by + 5, 6, 1, "t"); }
      else { rect(g, 4, by, 8, 5, "T"); rect(g, 4, by + 5, 8, 1, "t"); }
    }
    // 팔
    const swing = frame === 1 ? -1 : frame === 2 ? 1 : 0;
    const late = pose === "wave1" || pose === "wave2" || pose === "raise" || pose === "hold";
    if (pose === "wave1" || pose === "wave2") {
      rect(g, 3, by + 1, 1, 3, "T"); put(g, 3, by + 4, "S");
    } else if (late) {
      // 팔은 머리를 그린 뒤에 위로 올려요
    } else if (dir === "side") {
      if (pose === "act") { rect(g, 8, by + 1, 4, 1, "T"); put(g, 12, by + 1, "S"); }
      else { const ax = 8 + swing; rect(g, ax, by + 1, 1, 3, "T"); put(g, ax, by + 4, "S"); }
    } else if (pose === "act") {
      rect(g, 3, by + 1, 1, 2, "T"); rect(g, 12, by + 1, 1, 2, "T");
      rect(g, 4, by + 3, 2, 1, "S"); rect(g, 10, by + 3, 2, 1, "S");
    } else {
      rect(g, 3, by + 1 + swing, 1, 3, "T"); put(g, 3, by + 4 + swing, "S");
      rect(g, 12, by + 1 - swing, 1, 3, "T"); put(g, 12, by + 4 - swing, "S");
    }
    // 다리
    const ly = by + 6;
    const foot = 22;
    const leg = (x, top, bottom, c) => { rect(g, x, top, 2, Math.max(1, bottom - top), c); rect(g, x, bottom, 2, 1, "K"); };
    if (pose === "crouch") {
      leg(4, ly, foot, girl ? "P" : "P"); leg(10, ly, foot, "P");
    } else if (dir === "side") {
      if (frame === 1) { leg(9, ly, foot, "P"); leg(5, ly, foot - 1, "p"); }
      else if (frame === 2) { leg(5, ly, foot, "P"); leg(9, ly, foot - 1, "p"); }
      else { leg(6, ly, foot, "p"); leg(8, ly, foot, "P"); }
    } else {
      const lUp = frame === 1 ? 1 : 0, rUp = frame === 2 ? 1 : 0;
      leg(5, ly, foot - lUp, "P"); leg(9, ly, foot - rUp, "P");
    }
    // 머리
    stamp(g, HEAD[dir], 2, oy);
    // 머리 위로 올린 팔 (머리보다 앞에)
    if (pose === "wave1") { rect(g, 13, oy + 3, 1, 8, "T"); rect(g, 13, oy + 1, 2, 2, "S"); }
    if (pose === "wave2") { rect(g, 13, oy + 5, 1, 6, "T"); put(g, 14, oy + 4, "T"); rect(g, 14, oy + 2, 2, 2, "S"); }
    if (pose === "raise" || pose === "hold") {
      rect(g, 1, oy + 1, 1, by - oy, "T"); rect(g, 14, oy + 1, 1, by - oy, "T");
      rect(g, 1, oy - 1, 2, 2, "S"); rect(g, 13, oy - 1, 2, 2, "S");
    }
    // 표정: 눈 감기(깜빡임, 잠), 웃는 눈
    if (dir !== "up" && (face === "blink" || face === "happy")) {
      const eyes = dir === "side" ? [11] : [5, 10];
      eyes.forEach((x) => { put(g, x, oy + 5, "S"); put(g, x, oy + 6, "S"); });
      if (face === "blink") eyes.forEach((x) => { put(g, x, oy + 6, "E"); if (dir !== "side") put(g, x - 1, oy + 6, "E"); });
      else eyes.forEach((x) => { put(g, x, oy + 5, "E"); put(g, x - 1, oy + 6, "E"); put(g, x + 1, oy + 6, "E"); });
      if (face === "happy" && dir === "down") { put(g, 7, oy + 8, "M"); put(g, 8, oy + 8, "M"); }
    }
    if (girl && dir !== "up") put(g, dir === "side" ? 5 : 11, oy + 1, "R"), put(g, dir === "side" ? 6 : 12, oy + 1, "R");
    if (girl && dir === "up") { put(g, 11, oy + 1, "R"); put(g, 12, oy + 1, "R"); }
    return rows(outline(g));
  }
  function charImg(who, dir, frame, pose, face) {
    const key = `ch|${who}|${dir}|${frame}|${pose || ""}|${face || ""}`;
    return A.fromRows(key, charRows(who, dir, frame, pose || "", face || ""), Object.assign({ o: OUT, M: "#c9735f" }, PEOPLE[who] || PEOPLE.him)).uri;
  }

  // ---------- 강아지 (옆모습, 오른쪽을 봐요) ----------
  const DOG_BASE = [
    "...........DD.....",
    "..........DBBD....",
    "..........BBBBB...",
    ".........BBEBBBK..",
    ".........BBBBBBB..",
    ".........WBBBB....",
    "....BBBBBBWWBB....",
    "...BBBBBBBBBBB....",
    "...BBBBBBBBBBB....",
  ];
  // frame: stand, walk1, walk2, sit / tail: 0 위, 1 옆
  function dogRows(frame, tail, face) {
    const g = blank(18, 13);
    stamp(g, DOG_BASE, 0, frame === "sit" ? 2 : 0);
    const oy = frame === "sit" ? 2 : 0;
    // 꼬리
    if (tail) { put(g, 2, oy + 6, "B"); put(g, 1, oy + 6, "B"); put(g, 1, oy + 5, "B"); }
    else { put(g, 3, oy + 5, "B"); put(g, 2, oy + 4, "B"); put(g, 2, oy + 3, "B"); }
    // 다리
    const legs = frame === "walk1" ? [[3, 9, 2], [5, 9, 1], [11, 9, 1], [13, 9, 2]]
      : frame === "walk2" ? [[4, 9, 1], [6, 9, 2], [10, 9, 2], [12, 9, 1]]
      : frame === "sit" ? [[4, 11, 1], [11, 11, 2], [12, 11, 2]]
      : [[4, 9, 2], [5, 9, 2], [11, 9, 2], [12, 9, 2]];
    legs.forEach(([x, y, h]) => { rect(g, x, y, 1, h + 1, "B"); put(g, x, y + h + 1, "D"); });
    if (face === "happy") { put(g, 11, oy + 3, "B"); put(g, 11, oy + 4, "E"); put(g, 12, oy + 5, "R"); }
    return rows(outline(g));
  }
  function dogImg(frame, tail, face) {
    const key = `dog|${frame}|${tail ? 1 : 0}|${face || ""}`;
    return A.fromRows(key, dogRows(frame, tail, face), { o: OUT, B: "#f2d1a4", D: "#c9925e", E: "#2e221c", K: "#2e221c", W: "#fff3dc", R: "#ff8ab0" }).uri;
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

  window.FSprites = { charImg, charRows, dogImg, henImg, toolImg, toolUri, decoImg, decoUri, frames, PEOPLE };
})();
