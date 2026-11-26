// ============================================================
// 우리 집: 그림 속 배경에 있는 집. 황무지에서 시작해서, 둘이 이것저것 할수록 점점 좋은 집이 돼요.
// - 단계는 지금까지 받은 선물 수(= 한 일의 수)로 정해요. 두 폰이 늘 같아요.
// - 집을 누르면 옷장이 열려요. 집이 바뀔 때는 선물처럼 축하 연출이 나와요 (js/deco.js).
// ============================================================
(function () {
  "use strict";
  // [이름, 필요한 횟수]
  const LEVELS = [
    ["황무지", 0], ["움집", 3], ["초가집", 10], ["통나무집", 25], ["기와집", 50], ["벽돌집", 90], ["이층집", 150],
    ["정원 딸린 집", 230], ["저택", 350], ["작은 성", 500], ["큰 성", 750], ["궁전", 1050], ["하늘 성", 1400],
  ];
  const levelOf = (n) => { let l = 0; for (let i = 0; i < LEVELS.length; i++) if (n >= LEVELS[i][1]) l = i; return l; };

  // ---------- 그리기 도구 ----------
  function grid(w, h) { const g = []; for (let y = 0; y < h; y++) g.push(new Array(w).fill(".")); return g; }
  const put = (g, x, y, c) => { if (g[y] && x >= 0 && x < g[0].length) g[y][x] = c; };
  const rect = (g, x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(g, x + i, y + j, c); };
  const row = (g, a, b, y, c) => { for (let x = a; x <= b; x++) put(g, x, y, c); };
  // 사다리꼴 지붕: 맨 윗줄 [a, b]에서 한 줄에 step 칸씩 넓어져요. 마지막 줄은 그늘.
  function roof(g, a, b, y, n, c, sh, step) {
    step = step || 1;
    for (let j = 0; j < n; j++) row(g, a - j * step, b + j * step, y + j, j === n - 1 ? sh : c);
    for (let x = a + 1; x <= b - 1; x += 2) put(g, x, y, sh === c ? c : c); // 자리만
  }
  // 창문: 틀 F, 유리 G (밤에는 불빛)
  function win(g, x, y, w, h) { rect(g, x - 1, y - 1, w + 2, h + 2, "F"); rect(g, x, y, w, h, "G"); }
  function door(g, x, y, w, h) { rect(g, x, y, w, h, "D"); row(g, x, x + w - 1, y, "d"); put(g, x + w - 1, y + Math.floor(h / 2), "Y"); }
  // 성벽 위 톱니
  function teeth(g, a, b, y, c) { for (let x = a; x <= b; x++) if ((x - a) % 2 === 0) put(g, x, y, c); }
  // 뾰족 지붕 (탑)
  function cone(g, cx, y, n, c, sh) { for (let j = 0; j < n; j++) { row(g, cx - j, cx + 1 + j, y + j, c); put(g, cx + 1 + j, y + j, sh); } }
  function flag(g, x, y, c) { put(g, x, y, "K"); put(g, x, y + 1, "K"); put(g, x, y + 2, "K"); put(g, x + 1, y, c); put(g, x + 2, y, c); put(g, x + 1, y + 1, c); }
  function bush(g, x, y, fl) { row(g, x + 1, x + 3, y, "L"); row(g, x, x + 4, y + 1, "L"); row(g, x, x + 4, y + 2, "l"); if (fl) { put(g, x + 1, y, fl); put(g, x + 3, y + 1, fl); } }
  function ground(g, c, c2) { const h = g.length, w = g[0].length; row(g, 1, w - 2, h - 1, c); for (let x = 3; x < w - 2; x += 4) put(g, x, h - 1, c2 || c); }

  // ---------- 단계마다 그림 ----------
  const BASE = { o: "#4a3428", G: "#9cc8e6", F: "#fff8ea", D: "#9a6a44", d: "#6e4a2e", Y: "#ffd34d", K: "#7a5236", k: "#5a3c26", L: "#6cbf6c", l: "#4c9a56", P: "#ff86ad", E: "#d8b88a", e: "#b8966a", S: "#b9bcc6", s: "#8e929e" };
  const DRAW = [
    // 0 황무지: 마른 땅, 돌멩이, 마른 가지, 팻말
    () => {
      const g = grid(24, 10);
      row(g, 3, 20, 8, "E"); row(g, 1, 22, 9, "E"); [[5, 9], [12, 9], [18, 8], [9, 8]].forEach(([x, y]) => put(g, x, y, "e"));
      rect(g, 3, 6, 3, 2, "S"); put(g, 3, 6, "."); put(g, 5, 7, "s"); put(g, 20, 7, "S"); put(g, 21, 7, "s");
      [[16, 7], [16, 6], [16, 5], [15, 4], [17, 4], [14, 3], [18, 3]].forEach(([x, y]) => put(g, x, y, "k"));
      rect(g, 7, 2, 7, 3, "N"); row(g, 7, 13, 4, "n"); put(g, 9, 3, "k"); put(g, 10, 3, "k"); put(g, 12, 3, "k"); rect(g, 10, 5, 1, 3, "K");
      return { g, c: { N: "#e8cfa0", n: "#c8a878" } };
    },
    // 1 움집: 땅 위에 바로 얹은 짚 고깔
    () => {
      const g = grid(22, 12);
      for (let j = 0; j < 9; j++) row(g, 10 - j, 11 + j, 2 + j, j % 2 ? "t" : "T");
      for (let j = 0; j < 9; j += 2) for (let x = 10 - j + 1; x <= 11 + j; x += 3) put(g, x, 2 + j, "t");
      put(g, 9, 1, "K"); put(g, 8, 0, "K"); put(g, 12, 1, "K"); put(g, 13, 0, "K");
      rect(g, 9, 7, 4, 4, "d"); put(g, 9, 7, "T"); put(g, 12, 7, "T");
      ground(g, "E", "e");
      return { g, c: { T: "#e6c878", t: "#c8a455" } };
    },
    // 2 초가집: 흙벽에 둥근 짚 지붕
    () => {
      const g = grid(26, 16);
      [[8, 17], [6, 19], [4, 21], [3, 22], [2, 23], [1, 24]].forEach(([a, b], j) => row(g, a, b, 2 + j, j === 5 ? "t" : "T"));
      for (let x = 5; x <= 20; x += 3) { put(g, x, 5, "t"); put(g, x + 1, 3, "t"); }
      rect(g, 4, 8, 18, 7, "W"); row(g, 4, 21, 8, "w"); rect(g, 4, 8, 1, 7, "K"); rect(g, 21, 8, 1, 7, "K");
      door(g, 10, 10, 4, 5); win(g, 16, 11, 3, 2);
      ground(g, "E", "e");
      return { g, c: { T: "#ecd088", t: "#c9a558", W: "#f1e2c4", w: "#d6c29c" } };
    },
    // 3 통나무집
    () => {
      const g = grid(26, 18);
      roof(g, 6, 19, 3, 6, "R", "r"); for (let x = 3; x <= 22; x += 3) put(g, x, 7, "r");
      rect(g, 17, 1, 3, 4, "S"); row(g, 17, 19, 1, "s");
      rect(g, 3, 9, 20, 8, "B"); for (let y = 10; y < 17; y += 2) row(g, 3, 22, y, "b"); rect(g, 3, 9, 1, 8, "k"); rect(g, 22, 9, 1, 8, "k");
      door(g, 11, 12, 4, 5); win(g, 6, 12, 3, 3); win(g, 17, 12, 3, 3);
      ground(g, "L", "l");
      return { g, c: { R: "#8a5a3c", r: "#6a4028", B: "#c58f5c", b: "#a06f40" }, smoke: [18, 0] };
    },
    // 4 기와집: 끝이 살짝 들린 기와지붕
    () => {
      const g = grid(30, 18);
      row(g, 7, 22, 2, "r"); [[6, 23], [4, 25], [3, 26], [1, 28]].forEach(([a, b], j) => row(g, a, b, 3 + j, "R")); row(g, 1, 28, 7, "r");
      put(g, 0, 6, "R"); put(g, 29, 6, "R"); put(g, 0, 5, "r"); put(g, 29, 5, "r");
      for (let x = 5; x <= 24; x += 2) { put(g, x, 4, "r"); put(g, x, 6, "r"); }
      rect(g, 4, 8, 22, 8, "W"); [4, 10, 19, 25].forEach((x) => rect(g, x, 8, 1, 8, "K")); row(g, 4, 25, 8, "K");
      rect(g, 12, 10, 6, 6, "D"); rect(g, 13, 11, 1, 4, "N"); rect(g, 16, 11, 1, 4, "N"); row(g, 12, 17, 13, "d");
      rect(g, 6, 10, 3, 4, "G"); rect(g, 21, 10, 3, 4, "G"); put(g, 7, 10, "K"); put(g, 7, 12, "K"); put(g, 22, 10, "K"); put(g, 22, 12, "K");
      row(g, 3, 26, 16, "S"); ground(g, "L", "l");
      return { g, c: { R: "#55627a", r: "#3c4658", W: "#fbf4e6", N: "#f6e6c0", G: "#f6edc8" } };
    },
    // 5 벽돌집
    () => {
      const g = grid(28, 20);
      roof(g, 7, 20, 3, 6, "R", "r"); rect(g, 18, 0, 3, 5, "S"); row(g, 17, 21, 0, "s");
      rect(g, 3, 9, 22, 10, "B"); for (let y = 10; y < 19; y += 2) for (let x = 4 + (y % 4 ? 0 : 2); x < 25; x += 4) put(g, x, y, "b");
      door(g, 12, 13, 4, 6); row(g, 11, 16, 12, "F");
      win(g, 5, 12, 4, 4); win(g, 19, 12, 4, 4); [[7, 12], [21, 12]].forEach(([x, y]) => { rect(g, x - 1, y + 1, 1, 1, "G"); rect(g, x - 0, y, 1, 4, "F"); }); row(g, 5, 8, 14, "F"); row(g, 19, 22, 14, "F");
      ground(g, "L", "l");
      return { g, c: { R: "#e8704f", r: "#b84e34", B: "#d98566", b: "#b96648" }, smoke: [19, -1] };
    },
    // 6 이층집
    () => {
      const g = grid(28, 26);
      roof(g, 7, 20, 2, 6, "R", "r"); rect(g, 19, 0, 3, 4, "S");
      rect(g, 3, 8, 22, 17, "W"); row(g, 3, 24, 16, "w"); rect(g, 3, 8, 1, 17, "w"); rect(g, 24, 8, 1, 17, "w");
      win(g, 6, 11, 4, 3); win(g, 18, 11, 4, 3); win(g, 13, 10, 2, 2);
      row(g, 9, 18, 15, "K"); for (let x = 9; x <= 18; x += 3) put(g, x, 14, "K");
      door(g, 12, 19, 4, 6); win(g, 6, 19, 4, 4); win(g, 18, 19, 4, 4);
      ground(g, "L", "l");
      return { g, c: { R: "#5f8fd8", r: "#3f68ac", W: "#fff6e2", w: "#e2d2b0" }, smoke: [20, -1] };
    },
    // 7 정원 딸린 집: 이층집 + 울타리, 꽃덤불, 나무
    () => {
      const g = grid(40, 26);
      const ox = 6;
      roof(g, ox + 7, ox + 20, 2, 6, "R", "r"); rect(g, ox + 19, 0, 3, 4, "S");
      rect(g, ox + 3, 8, 22, 17, "W"); row(g, ox + 3, ox + 24, 16, "w"); rect(g, ox + 3, 8, 1, 17, "w"); rect(g, ox + 24, 8, 1, 17, "w");
      win(g, ox + 6, 11, 4, 3); win(g, ox + 18, 11, 4, 3); win(g, ox + 13, 10, 2, 2);
      row(g, ox + 9, ox + 18, 15, "K"); for (let x = ox + 9; x <= ox + 18; x += 3) put(g, x, 14, "K");
      door(g, ox + 12, 19, 4, 6); win(g, ox + 6, 19, 4, 4); win(g, ox + 18, 19, 4, 4);
      // 울타리
      [[0, 8], [31, 39]].forEach(([a, b]) => { row(g, a, b, 22, "F"); for (let x = a; x <= b; x += 2) rect(g, x, 20, 1, 5, "F"); });
      bush(g, 1, 22, "P"); bush(g, 34, 22, "Y");
      // 나무
      rect(g, 35, 14, 1, 7, "K"); rect(g, 32, 8, 7, 6, "L"); row(g, 33, 37, 7, "L"); row(g, 32, 38, 13, "l"); put(g, 34, 10, "P"); put(g, 37, 11, "P"); put(g, 32, 8, "."); put(g, 38, 8, ".");
      ground(g, "L", "l");
      return { g, c: { R: "#ff8fa8", r: "#d8607c", W: "#fff6e2", w: "#e2d2b0" }, smoke: [ox + 20, -1] };
    },
    // 8 저택: 가운데 박공과 기둥, 창이 많은 넓은 집
    () => {
      const g = grid(40, 28);
      roof(g, 5, 34, 7, 4, "R", "r");
      for (let j = 0; j < 7; j++) row(g, 19 - j * 1 - 1, 20 + j * 1 + 1, 2 + j, j === 6 ? "r" : "R"); put(g, 19, 5, "Y"); put(g, 20, 5, "Y");
      rect(g, 6, 0, 3, 7, "S"); rect(g, 31, 0, 3, 7, "S");
      rect(g, 2, 11, 36, 16, "W"); row(g, 2, 37, 11, "w"); row(g, 2, 37, 18, "w");
      [13, 17, 22, 26].forEach((x) => rect(g, x, 11, 1, 16, "F")); rect(g, 12, 9, 16, 2, "F");
      door(g, 18, 20, 4, 7); put(g, 19, 23, "Y");
      [4, 8, 29, 33].forEach((x) => { win(g, x, 13, 2, 3); win(g, x, 21, 2, 4); }); win(g, 19, 13, 2, 3);
      row(g, 0, 39, 27, "S");
      return { g, c: { R: "#6a7ad0", r: "#4654a4", W: "#fffaf0", w: "#e6dcc6" }, smoke: [7, -1] };
    },
    // 9 작은 성: 탑 둘과 성문
    () => {
      const g = grid(34, 30);
      rect(g, 8, 13, 18, 16, "S"); teeth(g, 8, 25, 12, "S");
      [[2, 8], [24, 30]].forEach(([a, b]) => { rect(g, a, 9, 8, 20, "S"); rect(g, b + 1, 9, 1, 20, "s"); teeth(g, a - 1, b + 2, 8, "S"); row(g, a - 1, b + 2, 9, "S"); cone(g, a + 3, 2, 6, "R", "r"); win(g, a + 3, 13, 2, 3); });
      flag(g, 6, -1 + 1, "P"); flag(g, 28, 0, "P");
      rect(g, 13, 19, 8, 10, "d"); row(g, 14, 19, 18, "d"); rect(g, 14, 20, 6, 9, "D"); rect(g, 16, 20, 1, 9, "d"); put(g, 18, 24, "Y");
      win(g, 12, 15, 2, 2); win(g, 20, 15, 2, 2);
      for (let y = 15; y < 29; y += 3) for (let x = 9 + (y % 2) * 2; x < 25; x += 5) put(g, x, y, "s");
      ground(g, "L", "l");
      return { g, c: { R: "#e8504f", r: "#b03438" } };
    },
    // 10 큰 성: 가운데 높은 탑이 더 생겨요
    () => {
      const g = grid(42, 32);
      rect(g, 8, 17, 26, 14, "S"); teeth(g, 8, 33, 16, "S");
      [[1, 8], [33, 40]].forEach(([a, b]) => { rect(g, a, 13, 8, 18, "S"); rect(g, b, 13, 1, 18, "s"); teeth(g, a - 1, b + 1, 12, "S"); row(g, a - 1, b + 1, 13, "S"); cone(g, a + 3, 6, 6, "R", "r"); win(g, a + 3, 17, 2, 3); });
      rect(g, 15, 9, 12, 22, "S"); rect(g, 26, 9, 1, 22, "s"); teeth(g, 14, 27, 8, "S"); row(g, 14, 27, 9, "S"); cone(g, 20, 1, 7, "R", "r");
      flag(g, 21, 0, "Y"); flag(g, 5, 4, "P"); flag(g, 37, 4, "P");
      win(g, 18, 12, 2, 3); win(g, 22, 12, 2, 3); win(g, 20, 17, 2, 2);
      rect(g, 17, 22, 8, 9, "d"); row(g, 18, 23, 21, "d"); rect(g, 18, 23, 6, 8, "D"); rect(g, 20, 23, 1, 8, "d"); rect(g, 21, 23, 1, 8, "d");
      win(g, 11, 20, 2, 2); win(g, 29, 20, 2, 2);
      for (let y = 19; y < 31; y += 3) for (let x = 9 + (y % 2) * 2; x < 33; x += 6) put(g, x, y, "s");
      ground(g, "L", "l");
      return { g, c: { R: "#5f8fd8", r: "#3f68ac" } };
    },
    // 11 궁전: 흰 벽에 금빛 둥근 지붕
    () => {
      const g = grid(44, 32);
      const dome = (cx, y, r) => { for (let j = 0; j < r; j++) { const half = Math.round(Math.sqrt(r * r - (r - 1 - j) * (r - 1 - j))); row(g, cx - half, cx + 1 + half, y + j, "Y"); put(g, cx + 1 + half, y + j, "y"); } put(g, cx, y - 1, "Y"); put(g, cx + 1, y - 1, "Y"); put(g, cx, y - 2, "P"); };
      rect(g, 3, 16, 38, 15, "W"); row(g, 3, 40, 16, "w"); row(g, 2, 41, 15, "R"); row(g, 2, 41, 14, "R"); teeth(g, 2, 41, 13, "R");
      rect(g, 15, 9, 14, 7, "W"); row(g, 14, 29, 8, "R");
      dome(21, 2, 6); dome(7, 8, 4); dome(35, 8, 4);
      rect(g, 3, 12, 10, 4, "W"); rect(g, 31, 12, 10, 4, "W");
      [5, 10, 33, 38].forEach((x) => win(g, x, 20, 2, 5)); win(g, 20, 11, 4, 3);
      rect(g, 18, 20, 8, 11, "R"); rect(g, 19, 21, 6, 10, "D"); row(g, 20, 23, 20, "R"); rect(g, 21, 21, 2, 10, "d"); put(g, 20, 26, "Y"); put(g, 23, 26, "Y");
      [14, 16, 27, 29].forEach((x) => rect(g, x, 17, 1, 14, "F"));
      row(g, 1, 42, 31, "S");
      return { g, c: { W: "#fffdf6", w: "#e8e0d0", R: "#6fb6e8", Y: "#ffd34d", y: "#e0a82a" } };
    },
    // 12 하늘 성: 구름 위에 뜬 무지갯빛 성
    () => {
      const g = grid(46, 34);
      rect(g, 10, 14, 26, 13, "W"); teeth(g, 10, 35, 13, "W");
      [[5, 12], [33, 40]].forEach(([a, b], i) => { rect(g, a, 10, 8, 17, "W"); rect(g, b, 10, 1, 17, "w"); teeth(g, a - 1, b + 1, 9, "W"); row(g, a - 1, b + 1, 10, "W"); cone(g, a + 3, 3, 6, i ? "V" : "R", i ? "v" : "r"); win(g, a + 3, 14, 2, 3); });
      rect(g, 17, 7, 12, 20, "W"); rect(g, 28, 7, 1, 20, "w"); teeth(g, 16, 29, 6, "W"); row(g, 16, 29, 7, "W"); cone(g, 22, 0, 6, "Y", "y");
      put(g, 22, -0, "Y");
      win(g, 20, 10, 2, 3); win(g, 24, 10, 2, 3);
      rect(g, 19, 18, 8, 9, "V"); rect(g, 20, 19, 6, 8, "D"); row(g, 21, 24, 17, "V"); rect(g, 22, 19, 2, 8, "d");
      win(g, 13, 17, 2, 2); win(g, 31, 17, 2, 2);
      // 무지개 띠
      row(g, 10, 35, 25, "R"); row(g, 10, 35, 26, "Y");
      // 구름
      [[6, 39, 27], [3, 42, 28], [1, 44, 29], [0, 45, 30], [2, 43, 31], [5, 40, 32]].forEach(([a, b, y]) => row(g, a, b, y, y >= 31 ? "c" : "C"));
      [[8, 26], [9, 26], [20, 33], [21, 33], [22, 33], [34, 26], [35, 26], [36, 26]].forEach(([x, y]) => put(g, x, y, y > 30 ? "c" : "C"));
      // 별
      [[2, 5], [43, 8], [12, 2], [38, 1]].forEach(([x, y]) => { put(g, x, y, "Y"); });
      return { g, c: { W: "#fff6fb", w: "#ead6e6", R: "#ff8fb4", r: "#d8608c", V: "#b79cf0", v: "#8a6ad0", Y: "#ffd34d", y: "#e0a82a", C: "#ffffff", c: "#d6e6f6", G: "#aee4f6" } };
    },
  ];

  function outline(g) {
    const h = g.length, w = g[0].length;
    const o = [];
    for (let y = 0; y < h + 2; y++) o.push(new Array(w + 2).fill("."));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) o[y + 1][x + 1] = g[y][x];
    const add = [];
    for (let y = 0; y < h + 2; y++) for (let x = 0; x < w + 2; x++) {
      if (o[y][x] !== ".") continue;
      if ([[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(([a, b]) => o[b] && o[b][a] && o[b][a] !== ".")) add.push([x, y]);
    }
    add.forEach(([x, y]) => { o[y][x] = "o"; });
    return o.map((r) => r.join(""));
  }
  const cache = {};
  // { day, nite, w, h, smoke } (크기는 도트 칸 수)
  function img(level) {
    level = Math.max(0, Math.min(LEVELS.length - 1, level | 0));
    if (cache[level]) return cache[level];
    if (!window.GArt) return null;
    const d = DRAW[level]();
    const rows = outline(d.g);
    const pal = Object.assign({}, BASE, d.c || {});
    const day = GArt.fromRows("home|" + level, rows, pal);
    const nite = GArt.fromRows("homeN|" + level, rows, Object.assign({}, pal, { G: "#ffe08f" }));
    cache[level] = { day: day.uri, nite: nite.uri, w: day.w, h: day.h, smoke: d.smoke ? [d.smoke[0] + 1, d.smoke[1] + 1] : null };
    return cache[level];
  }
  // 그림 속 집을 지금 단계로 바꿔요
  const SCALE = 2;
  function apply() {
    const el = document.getElementById("home");
    if (!el || !window.Deco || !Deco.homeLevel) return;
    const lv = Deco.homeLevel();
    if (el.dataset.lv === String(lv)) return;
    const r = img(lv);
    if (!r) return;
    const was = el.dataset.lv;
    el.dataset.lv = String(lv);
    const w = r.w * SCALE, h = r.h * SCALE;
    el.style.width = w + "px"; el.style.height = h + "px"; el.style.marginLeft = -Math.round(w / 2) + "px";
    el.setAttribute("aria-label", "우리 집: " + LEVELS[lv][0]);
    el.innerHTML = `<img class="px day" alt="" src="${r.day}" width="${w}" height="${h}" draggable="false"><img class="px nite" alt="" src="${r.nite}" width="${w}" height="${h}" draggable="false">` +
      (r.smoke ? `<i class="smoke" style="left:${r.smoke[0] * SCALE}px;top:${r.smoke[1] * SCALE - 20}px"><b></b><b></b><b></b></i>` : "");
    if (was !== undefined) { el.classList.remove("grow"); void el.offsetWidth; el.classList.add("grow"); }
  }
  let t = 0;
  const soon = () => { clearTimeout(t); t = setTimeout(apply, 120); };
  if (window.Store) Store.onChange(soon);
  document.addEventListener("DOMContentLoaded", soon);
  window.Home = { LEVELS, levelOf, img, apply, soon, name: (l) => (LEVELS[l] || LEVELS[0])[0], next: (l) => (LEVELS[l + 1] ? LEVELS[l + 1] : null) };
})();
