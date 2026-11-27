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
    him: { H: "#4a4038", h: "#6e5e52", S: "#fbdcc0", s: "#ecc0a0", E: "#2e221c", W: "#ffffff", C: "#ffaaa8", m: "#e0907a", M: "#c9735f", D: "#6fc0f5", T: "#8cc0ee", t: "#6a9fd4", P: "#5c6f9c", K: "#4a3a30" },
    her: { H: "#7a5440", h: "#a07458", S: "#fbdcc0", s: "#ecc0a0", E: "#2e221c", W: "#ffffff", C: "#ffaaa8", m: "#e0907a", M: "#c9735f", D: "#6fc0f5", T: "#ffd978", t: "#f0b54a", P: "#fbdcc0", K: "#c96a52", R: "#ff7aa8", r: "#e05a88" },
  };
  // 동물 잠옷: 동물 도감(js/zoo.js)의 종마다 한 벌. U 바탕, u 그늘, b 배, i 귀 안쪽, f 발, x 포인트
  const Z = window.Zoo || { LIST: [], BY: {} };
  const PAJAMAS = Z.LIST, PJ = Z.BY;
  const pjCache = {};
  function pjView(sp) {
    if (pjCache[sp.id]) return pjCache[sp.id];
    const m = sp.m, has = (c) => m.indexOf(c) >= 0;
    return (pjCache[sp.id] = {
      id: sp.id, name: sp.name, c: sp.c, ear: sp.ear, tail: sp.tail === "ring" ? "long" : sp.tail,
      top: has("w") ? "wool" : "", stripes: has("s") || sp.tail === "ring", spots: has("d"), beak: has("k"), snout: has("o"), limbs: has("l") ? "k" : "", earC: has("e") ? "k" : "",
      mask: has("m"), mane: has("g"), blaze: has("v"), crest: has("c"), horns: has("h"), fin: has("f"), teeth: has("t"), eyes: has("y"), shell: has("q"), wings: has("i"), patch: has("p"),
    });
  }
  const HEADS = {
    him: {
      down: ["...HHHHHHHHHH...", "..HHHHhhHHHHHH..", ".HHHHhHHHHHHHHH.", ".HHHHHHHHHHHHHH.", ".HHHHHHHHHHHHHH.", ".HHSHHHSHHHSHHH.", ".HSSSSSSSSSSSSH.", ".HSSWESSSSWESSH.", ".SSSEESSSSEESSS.", ".SCCSSSmmSSSCCS.", "..SSSSSSSSSSSS..", "...SSSSSSSSSS..."],
      side: ["...HHHHHHHHHH...", "..HHHHHhhHHHHH..", ".HHHHHhHHHHHHHH.", ".HHHHHHHHHHHHHH.", ".HHHHHHHHHHHHHH.", ".HHHHHSHHHSHHSH.", ".HHHSSSSSSSSSSH.", ".HHsSSSWESSSWES.", ".HHsSSSEESSSEES.", ".HHSSCCSSSmmSCS.", "..HSSSSSSSSSSSS.", "...HSSSSSSSSSS.."],
      up: ["...HHHHHHHHHH...", "..HHHHhhHHHHHH..", ".HHHHhHHHHHHHHH.", ".HHHHHHHHHHHHHH.", ".HHHHHHHHHHHHHH.", ".HHHHHHhHHHHHHH.", ".HHHHHHHHHHHHHH.", ".HHHHHHHHHHHHHH.", "sHHHHHHHHHHHHHHs", ".HHHHHHHHHHHHHH.", ".HHHHHHHHHHHHHH.", "...SSSSSSSSSS..."],
    },
    her: {
      down: ["...HHHHHHHHHH...", "..HHHHhhHHHHHH..", ".HHHHhHHHHHHHHH.", "HHHHHHHHHHHHHHHH", "HHHHHHHHHHHHHHHH", "HHHHHHHHHSHHHHHH", "HHSSSSSSSSSSSSHH", "HHSSWESSSSWESSHH", "HSSSEESSSSEESSSH", "HSCCSSSmmSSSCCSH", "HSSSSSSSSSSSSSSH", "HHHSSSSSSSSSSHHH"],
      side: ["...HHHHHHHHHH...", "..HHHHHhhHHHHH..", ".HHHHHhHHHHHHHH.", "HHHHHHHHHHHHHHHH", "HHHHHHHHHHHHHHH.", "HHHHHHHHHHSHHHH.", "HHHHSSSSSSSSSSHH", "HHHsSSSWESSSWESH", "HHHsSSSEESSSEESH", "HHHSSCCSSSmmSCSH", "HHHHSSSSSSSSSSHH", "HHHHHSSSSSSSSHHH"],
      up: ["...HHHHHHHHHH...", "..HHHHhhHHHHHH..", ".HHHHhHHHHHHHHH.", "HHHHHHHHHHHHHHHH", "HHHHHHHHHHHHHHHH", "HHHHHHhHHHHHHHHH", "HHHHHHHHHHHHHHHH", "HHHHHHHHHHHHHHHH", "HHHHHHHHHHHHHHHH", "HHHHHHHHHHHHHHHH", "HHHHHHHHHHHHHHHH", "HHHHHHHHHHHHHHHH"],
    },
  };
  // 후드가 덮는 곳과 얼굴이 보이는 창
  const HOOD_ROWS = [[4, 11], [2, 13], [1, 14], [0, 15], [0, 15], [0, 15], [0, 15], [0, 15], [0, 15], [0, 15], [0, 15], [1, 14]];
  function faceWin(dir, x, y) {
    if (dir === "up") return false;
    if (dir === "down") return (y >= 5 && y <= 10 && x >= 2 && x <= 13) || (y === 11 && x >= 4 && x <= 11);
    return (y >= 5 && y <= 10 && x >= 4 && x <= 14) || (y === 11 && x >= 5 && x <= 12);
  }
  // 머리 위로 6칸을 비워 둬요: 토끼 귀(5칸)와 테두리 한 칸까지 잘리지 않게
  const CH_W = 18, CH_H = 26, TOP = 6, FOOT = 24, HX = 1, CH_FULL = 20; // 그릴 땐 18칸, 내보낼 땐 좌우 여백을 더해 20칸
  // 귀 모양 (왼쪽 귀, 머리 왼쪽 위 기준. 오른쪽은 거울로)
  const EARS = {
    round: { at: [1, -2], rows: [".UU.", "UiiU", "UiiU"] },
    long: { at: [2, -5], rows: [".UU.", "UiiU", "UiiU", "UiiU", "UiiU", "UUUU"] },
    point: { at: [1, -2], rows: ["U..", "UU.", "UiU", "UiiU"] },
    tiny: { at: [3, -1], rows: ["UU", "Ui"] },
    frog: { at: [1, -3], rows: [".UUU.", "UiiiU", "UiEiU", "UUUUU"] },
    koala: { at: [-1, -1], rows: [".UUU.", "UiiiU", "UiiiU", ".UUU."] },
    big: { at: [-1, -2], rows: ["UUUU", "UiiU", "UiiU", ".UUU"] },
    horn: { at: [3, -2], rows: ["w.", "ww"] },
    antenna: { at: [4, -3], rows: ["k.", ".k", ".k"] },
    deer: { at: [2, -4], rows: ["A.A.", "AAA.", ".A..", ".A.."] },
  };
  // ---------- 장식 (눈, 머리, 목) ----------
  // 색 글자: 눈 1 2 3, 머리 4 5 6, 목 7 8 9 (주색, 그늘, 포인트)
  function drawAcc(g, acc, dir, oy, by, hasHood) {
    const X = (x, y, c) => put(g, HX + x, oy + y, c);
    const list = (pts, c, sx) => pts.forEach(([x, y]) => X(x + (sx || 0), y, c));
    const sx = dir === "side" ? 1 : 0;
    // 목
    const nk = acc.neck;
    if (nk) {
      const B = (x, y, c) => put(g, x, by + y, c);
      const row = (a, b, y, c) => { for (let x = a; x <= b; x++) B(x, y, c); };
      if (nk === "scarf") { row(5, 12, 0, "7"); if (dir !== "up") { B(6, 1, "7"); B(6, 2, "7"); B(6, 3, "8"); } else row(5, 12, 1, "8"); }
      else if (nk === "kerchief") { row(5, 12, 0, "7"); row(7, 10, 1, "7"); row(8, 9, 2, "8"); }
      else if (nk === "bell") { row(5, 12, 0, "7"); if (dir !== "up") { B(8, 1, "9"); B(9, 1, "9"); } }
      else if (dir !== "up") {
        if (nk === "bowtie") { B(7, 0, "7"); B(10, 0, "7"); B(8, 0, "8"); B(9, 0, "8"); B(7, 1, "7"); B(10, 1, "7"); }
        else if (nk === "lace") { B(6, 0, "9"); B(11, 0, "9"); B(7, 1, "9"); B(10, 1, "9"); B(8, 1, "7"); B(9, 1, "7"); B(8, 2, "7"); B(9, 2, "8"); }
        else if (nk === "tie") { B(8, 0, "8"); B(9, 0, "8"); B(8, 1, "7"); B(9, 1, "7"); B(8, 2, "7"); B(9, 2, "7"); B(8, 3, "8"); B(9, 3, "8"); }
      }
    }
    // 눈
    const ey = acc.eye;
    if (ey && dir !== "up") {
      const E = dir === "side" ? [7, 12] : [4, 10];
      const frame = (x, square) => { list([[x, 6], [x + 1, 6], [x, 9], [x + 1, 9], [x - 1, 7], [x - 1, 8], [x + 2, 7], [x + 2, 8]], "1"); if (square) list([[x - 1, 6], [x + 2, 6], [x - 1, 9], [x + 2, 9]], "1"); };
      const bridge = () => { for (let x = E[0] + 3; x <= E[1] - 2; x++) X(x, 7, "1"); };
      if (ey === "gr" || ey === "gs") { E.forEach((x) => frame(x, ey === "gs")); bridge(); }
      else if (ey === "sun") { E.forEach((x) => { for (let i = -1; i <= 2; i++) { X(x + i, 7, "1"); X(x + i, 8, "2"); } X(x - 1, 7, "3"); }); bridge(); }
      else if (ey === "half") { E.forEach((x) => list([[x - 1, 6], [x, 6], [x + 1, 6], [x + 2, 6], [x - 1, 7], [x + 2, 7]], "1")); bridge(); }
      else if (ey === "mono") { frame(E[1], false); list([[E[1] + 2, 9], [E[1] + 3, 10], [E[1] + 3, 11]], "3"); }
      else if (ey === "patch") { const x = E[0]; for (let j = 6; j <= 9; j++) for (let i = -1; i <= 2; i++) X(x + i, j, j === 9 || i === 2 ? "2" : "1"); for (let i = 0; i <= 15; i++) if (i < x - 1 || i > x + 2) X(i, 5, "2"); }
      else if (ey === "gem") { const x = dir === "side" ? 13 : 12; list([[x, 9], [x + 1, 9], [x, 10], [x + 1, 10]], "1"); X(x, 9, "3"); }
      else if (ey === "shadow") { E.forEach((x) => list([[x - 1, 6], [x, 6], [x + 1, 6], [x + 2, 6]], "1")); }
    }
    // 머리 (동물 잠옷 후드를 썼을 땐 후드가 머리 장식이에요)
    const ht = acc.hat;
    if (ht && !hasHood) {
      const row = (a, b, y, c) => { for (let x = a; x <= b; x++) X(x + sx, y, c); };
      if (ht === "bow") { list([[5, -2], [6, -2], [9, -2], [10, -2], [5, 0], [6, 0], [9, 0], [10, 0]], "4", sx); row(5, 10, -1, "4"); list([[7, -1], [8, -1]], "5", sx); }
      else if (ht === "band") { row(1, 14, 2, "4"); list([[4, 2], [5, 2]], "6", sx); }
      else if (ht === "crown") { list([[4, -3], [7, -3], [8, -3], [11, -3]], "4", sx); row(4, 11, -2, "4"); row(4, 11, -1, "5"); list([[6, -2], [9, -2]], "6", sx); }
      else if (ht === "beret") { X(8 + sx, -3, "5"); row(5, 10, -2, "4"); row(3, 12, -1, "4"); row(2, 13, 0, "4"); row(2, 13, 1, "5"); }
      else if (ht === "cap") { row(4, 11, -1, "4"); row(2, 13, 0, "4"); row(1, 14, 1, "4"); row(9, 16, 2, "5"); X(8 + sx, -2, "6"); }
      else if (ht === "straw") { row(5, 10, -2, "4"); row(4, 11, -1, "4"); row(4, 11, 0, "6"); row(0, 15, 1, "4"); row(1, 14, 2, "5"); }
      else if (ht === "beanie") { list([[7, -3], [8, -3]], "6", sx); row(5, 10, -2, "4"); row(3, 12, -1, "4"); row(2, 13, 0, "4"); row(1, 14, 1, "5"); }
      else if (ht === "pin") { list([[3, 0], [2, 1], [4, 1], [3, 2]], "4", sx); X(3 + sx, 1, "6"); }
      else if (ht === "cone") { X(8 + sx, -3, "6"); row(7, 8, -2, "4"); row(6, 9, -1, "5"); row(5, 10, 0, "4"); }
      else if (ht === "phone") { row(3, 12, -1, "4"); list([[2, 0], [13, 0], [1, 1], [14, 1], [1, 2], [14, 2], [1, 3], [14, 3]], "4", sx); for (let y = 4; y <= 8; y++) { X(0 + sx, y, "5"); X(1 + sx, y, "4"); X(14 + sx, y, "4"); X(15 + sx, y, "5"); } }
      else if (ht === "bunny") { [4, 10].forEach((x) => { list([[x, -3], [x + 1, -3], [x, -2], [x + 1, -2], [x, -1], [x + 1, -1]], "4", sx); X(x + (x === 4 ? 1 : 0) + sx, -2, "6"); }); row(3, 12, 0, "5"); }
      else if (ht === "cat") { list([[3, -2], [3, -1], [4, -1], [12, -2], [12, -1], [11, -1]], "4", sx); list([[4, -1], [11, -1]], "6", sx); row(3, 12, 0, "5"); }
      else if (ht === "sprout") { list([[8, -1], [8, -2]], "5", sx); list([[6, -3], [7, -3], [9, -3], [10, -3], [7, -2], [9, -2]], "4", sx); }
      else if (ht === "star") { list([[12, 0], [11, 1], [13, 1], [12, 2]], "4", sx); X(12 + sx, 1, "6"); }
    }
  }
  function charRows(who, dir, frame, pose, face, pj, acc) {
    const g = blank(CH_W, CH_H);
    const girl = who === "her";
    const P = pj && PJ[pj] ? pjView(PJ[pj]) : null;
    const crouch = pose === "crouch";
    const oy = TOP + (crouch ? 2 : frame ? 1 : 0);
    const by = oy + 12;
    const H = (x, y, c) => put(g, HX + x, oy + y, c);
    // 잠옷 꼬리 (몸 뒤)
    if (P && P.tail) {
      if (dir === "side") {
        const tx = 5, ty = by + 2; // 몸 왼쪽 뒤
        if (P.tail === "puff") { rect(g, tx - 2, ty, 2, 2, "U"); }
        else if (P.tail === "long") { put(g, tx - 1, ty + 1, "U"); put(g, tx - 2, ty, "U"); put(g, tx - 3, ty - 1, "U"); put(g, tx - 3, ty - 2, P.stripes ? "x" : "U"); }
        else if (P.tail === "bushy") { rect(g, tx - 3, ty - 1, 3, 3, "U"); put(g, tx - 3, ty - 1, "b"); put(g, tx - 4, ty, "b"); }
        else if (P.tail === "dino") { rect(g, tx - 3, ty + 1, 3, 2, "U"); put(g, tx - 4, ty + 2, "U"); put(g, tx - 2, ty, "g"); }
        else if (P.tail === "curl") { put(g, tx - 1, ty, "U"); put(g, tx - 2, ty - 1, "U"); put(g, tx - 1, ty - 2, "U"); }
        else if (P.tail === "up") { put(g, tx - 1, ty, "U"); put(g, tx - 2, ty - 1, "U"); put(g, tx - 2, ty - 2, "U"); }
        else if (P.tail === "nub") put(g, tx - 1, ty + 1, "U");
        else if (P.tail === "fish") { put(g, tx - 1, ty + 1, "U"); put(g, tx - 2, ty, "U"); put(g, tx - 2, ty + 2, "U"); put(g, tx - 3, ty - 1, "u"); put(g, tx - 3, ty + 3, "u"); }
      }
    }
    // 여자 뒷머리 (잠옷을 입으면 후드 속에 들어가요)
    if (girl && !P) {
      if (dir === "down") { rect(g, HX, by - 1, 2, 3, "H"); rect(g, HX + 14, by - 1, 2, 3, "H"); }
      if (dir === "side") { rect(g, HX, by - 1, 4, 3, "H"); rect(g, HX + 14, by - 1, 1, 2, "H"); put(g, HX + 1, by + 2, "H"); put(g, HX + 2, by + 2, "H"); }
    }
    // 몸통
    const bodyC = P ? "U" : "T", lowC = P ? "U" : "P";
    if (P) {
      if (dir === "side") { rect(g, 5, by, 8, 4, "U"); rect(g, 5, by + 3, 8, 1, "u"); rect(g, 8, by + 1, 4, 2, "b"); rect(g, 5, by, 1, 3, "u"); }
      else { rect(g, 5, by, 8, 4, "U"); rect(g, 5, by + 3, 8, 1, "u"); if (dir === "down") rect(g, 7, by + 1, 4, 2, "b"); else if (P.tail) rect(g, 8, by + 2, 2, 2, P.tail === "bushy" || P.tail === "puff" ? "b" : "U"); }
    } else if (girl) {
      if (dir === "side") { rect(g, 5, by, 8, 3, "T"); rect(g, 4, by + 3, 10, 1, "t"); rect(g, 5, by, 1, 3, "t"); put(g, 9, by, "W"); put(g, 10, by, "W"); }
      else { rect(g, 5, by, 8, 3, "T"); rect(g, 4, by + 3, 10, 1, "t"); if (dir === "down") { put(g, 8, by, "W"); put(g, 9, by, "W"); } }
    } else {
      if (dir === "side") { rect(g, 5, by, 8, 3, "T"); rect(g, 5, by, 1, 3, "t"); rect(g, 5, by + 3, 8, 1, "P"); put(g, 9, by, "W"); put(g, 10, by, "W"); }
      else { rect(g, 5, by, 8, 3, "T"); rect(g, 5, by + 2, 8, 1, "t"); rect(g, 5, by + 3, 8, 1, "P"); if (dir === "down") { put(g, 8, by, "W"); put(g, 9, by, "W"); } }
    }
    const armC = P ? (P.limbs || "U") : bodyC;
    // 팔
    const swing = frame === 1 ? -1 : frame === 2 ? 1 : 0;
    const up = pose === "wave1" || pose === "wave2" || pose === "raise" || pose === "hold" || pose === "clutch";
    if (pose === "wave1" || pose === "wave2") {
      rect(g, 4, by, 1, 2, armC); put(g, 4, by + 2, "S");
    } else if (up) {
      // 머리를 그린 뒤에 올려요
    } else if (dir === "side") {
      if (pose === "act") { rect(g, 10, by + 1, 4, 1, armC); put(g, 14, by + 1, "S"); }
      else if (pose === "punch") { rect(g, 4, by, 1, 2, P ? (P.limbs || "u") : "t"); put(g, 4, by + 2, "S"); rect(g, 11, by + 1, 4, 1, armC); rect(g, 15, by, 2, 2, "S"); }
      else if (pose === "back") { rect(g, 13, by, 1, 2, armC); put(g, 13, by + 2, "S"); rect(g, 2, by, 3, 1, P ? (P.limbs || "u") : "t"); rect(g, 1, by - 1, 1, 2, "S"); }
      else { rect(g, 4, by, 1, 2, P ? (P.limbs || "u") : "t"); put(g, 4, by + 2 - (swing > 0 ? 1 : 0), "S"); rect(g, 13, by, 1, 2, armC); put(g, 13 + (swing < 0 ? 1 : 0), by + 2, "S"); }
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
    } else if (dir === "side" && pose === "kick") {
      // 발차기: 뒷다리로 서고 앞다리를 쭉 뻗어요
      leg(6, FOOT, legC); put(g, 8, FOOT, footC);
      rect(g, 10, by + 4, 4, 2, legC); rect(g, 14, by + 3, 2, 3, footC);
    } else if (dir === "side") {
      if (frame === 1) { leg(6, FOOT, legC); leg(11, FOOT - 1, legC); put(g, 13, FOOT - 1, footC); }
      else if (frame === 2) { leg(10, FOOT, legC); leg(6, FOOT - 1, legC); put(g, 8, FOOT - 1, footC); }
      else { leg(6, FOOT, legC); leg(10, FOOT, legC); }
      if (frame !== 1) put(g, 12, FOOT, footC);
      if (frame !== 2) put(g, 8, FOOT, footC);
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
        if (faceWin(dir, x - 1, y) || faceWin(dir, x + 1, y) || faceWin(dir, x, y - 1) || faceWin(dir, x, y + 1)) H(x, y, P.mane ? "g" : "u");
      } });
      // 귀
      const mirror = (rs) => rs.map((r) => r.split("").reverse().join(""));
      const earC = (c) => (c === "U" && P.earC ? P.earC : c === "i" && P.earC ? "k" : c);
      const drawEar = (rs, x0, y0) => rs.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== ".") H(x0 + i, y0 + j, earC(r[i])); });
      if (P.ear === "floppy") {
        const fl = ["UU", "Uu", "uU", "uu"];
        if (dir === "down" || dir === "up") { drawEar(fl, -1, 3); drawEar(fl, 15, 3); }
        else { drawEar(fl, -1, 3); drawEar(fl, 15, 4); }
      } else if (P.ear === "tuft") { H(7, -1, "U"); H(8, -2, "U"); H(8, -1, "U"); H(9, -2, "U"); }
      else if (P.ear === "spikes") { const sp = dir === "side" ? [[3, 1], [5, 0], [8, -1], [9, -1], [12, 0]] : [[4, 0], [7, -1], [8, -1], [11, 0]]; sp.forEach(([x, y]) => { H(x, y, "g"); H(x, y + 1, "g"); }); }
      else if (EARS[P.ear]) {
        const e = EARS[P.ear];
        if (dir === "side") { drawEar(e.rows, e.at[0] + 1, e.at[1] + 1); drawEar(mirror(e.rows), 16 - e.at[0] - e.rows[0].length + 1, e.at[1]); }
        else { drawEar(e.rows, e.at[0], e.at[1]); drawEar(mirror(e.rows), 16 - e.at[0] - e.rows[0].length, e.at[1]); }
      }
      if (P.top === "wool") [[3, 1], [6, 0], [9, 0], [12, 1], [5, 2], [10, 2]].forEach(([x, y]) => H(x, y, "w"));
      if (P.stripes && dir !== "side") { [[7, 1], [7, 2], [8, 1], [8, 2], [0, 6], [1, 6], [15, 6], [14, 6]].forEach(([x, y]) => H(x, y, "x")); }
      if (P.stripes && dir === "side") { [[8, 1], [8, 2], [9, 1], [9, 2], [0, 6], [1, 6], [15, 5]].forEach(([x, y]) => H(x, y, "x")); }
      if (P.spots) { (dir === "side" ? [[1, 4], [2, 8], [13, 3], [5, 1]] : dir === "up" ? [[2, 3], [13, 3], [5, 6], [10, 7], [7, 9], [3, 8], [12, 5]] : [[2, 3], [13, 3], [5, 1], [10, 2]]).forEach(([x, y]) => H(x, y, "x")); }
      const sx = dir === "side" ? 1 : 0;
      if (P.patch) { [[2, 1], [3, 1], [2, 2], [3, 2], [4, 2], [1, 3], [2, 3], [12, 0], [13, 1]].forEach(([x, y]) => H(x, y, "x")); if (dir === "up") [[9, 6], [10, 6], [10, 7], [11, 7], [4, 9], [5, 9]].forEach(([x, y]) => H(x, y, "x")); }
      if (P.blaze && dir !== "up") [[7, 0], [8, 0], [7, 1], [8, 1], [7, 2], [8, 2], [7, 3], [8, 3]].forEach(([x, y]) => H(x + sx, y, "W"));
      if (P.crest) [[7, -1], [8, -1], [8, -2], [9, -1], [9, -2]].forEach(([x, y]) => H(x + sx, y, "x"));
      if (P.horns && P.ear !== "horn") [[5, -1], [5, -2], [10, -1], [10, -2]].forEach(([x, y]) => H(x + sx, y, "w"));
      if (P.fin) [[7, -1], [8, -1], [9, -1], [8, -2], [9, -2], [9, -3]].forEach(([x, y]) => H(x + sx, y, "u"));
      if (P.teeth && dir !== "up") (dir === "side" ? [[6, 4], [8, 4], [11, 4], [13, 4]] : [[4, 4], [6, 4], [9, 4], [11, 4]]).forEach(([x, y]) => H(x, y, "w"));
      if (P.eyes && dir !== "up" && P.ear !== "frog") { const ex = dir === "side" ? [5, 11] : [4, 10]; ex.forEach((x) => { H(x, 1, "w"); H(x + 1, 1, "w"); H(x, 2, "w"); H(x + 1, 2, "E"); }); }
      if (P.shell && dir !== "down") { rect(g, dir === "up" ? 6 : 5, by, dir === "up" ? 6 : 3, 3, "x"); put(g, dir === "up" ? 8 : 6, by + 1, "q"); put(g, dir === "up" ? 9 : 6, by + 1, "q"); }
      if (P.wings && dir !== "down") { rect(g, 3, by, 2, 2, "w"); put(g, 2, by, "w"); if (dir === "up") { rect(g, 13, by, 2, 2, "w"); put(g, 15, by, "w"); } }
      if (P.beak && dir === "down") { H(7, 4, "B"); H(8, 4, "B"); }
      if (P.beak && dir === "side") { H(9, 4, "B"); H(10, 4, "B"); }
      if (P.snout && dir === "down") { rect(g, HX + 6, oy + 2, 4, 2, "n"); H(7, 3, "q"); H(8, 3, "q"); }
      if (P.snout && dir === "side") { rect(g, HX + 8, oy + 2, 4, 2, "n"); H(9, 3, "q"); H(10, 3, "q"); }
      if (P.ear === "koala" && dir === "down") { H(7, 3, "k"); H(8, 3, "k"); }
      // 예은이는 후드 사이로 머리카락이 살짝 보여요
      if (P.mask && dir === "down") { H(4, 6, "k"); H(11, 6, "k"); }
      if (girl && dir === "down") { for (let y = 6; y <= 10; y++) { H(2, y, "H"); H(13, y, "H"); } H(3, 6, "H"); H(12, 6, "H"); }
      if (girl && dir === "side") { for (let y = 6; y <= 10; y++) { H(4, y, "H"); H(14, y, "H"); } H(5, 6, "H"); }
    }
    // 리본 (잠옷이 아닐 때)
    if (girl && !P && !(acc && acc.hat)) {
      const rx = HX + (dir === "side" ? 3 : 10);
      put(g, rx, oy, "R"); put(g, rx + 2, oy, "R"); put(g, rx + 1, oy, "r"); put(g, rx, oy + 1, "R"); put(g, rx + 1, oy + 1, "r"); put(g, rx + 2, oy + 1, "R");
    }
    // 머리 위로 올린 팔 (머리보다 앞에)
    // 팔은 어깨에서부터 이어져요. 손은 볼 옆에 딱 붙어서, 닿은 볼이 발그레하게 눌려요.
    const dots = (list, c) => list.forEach(([x, y]) => put(g, x, y, c));
    if (pose === "wave1") { dots([[13, by], [14, by - 1], [15, by - 2], [16, by - 3]], armC); dots([[16, by - 4], [16, by - 5]], "S"); }
    if (pose === "wave2") { dots([[13, by], [14, by - 1], [15, by - 1]], armC); dots([[16, by - 2], [16, by - 3]], "S"); }
    if (pose === "raise" || pose === "hold") {
      // 만세: 두 팔을 비스듬히 올려 볼 옆에 주먹
      dots([[4, by], [3, by - 1], [2, by - 2], [13, by], [14, by - 1], [15, by - 2]], armC);
      dots([[1, by - 3], [1, by - 4], [16, by - 3], [16, by - 4]], "S");
      if (dir === "down") dots([[2, by - 4], [3, by - 4], [14, by - 4], [15, by - 4]], "C");
    }
    if (pose === "clutch") {
      // 머리 부여잡기: 팔이 머리 옆을 타고 올라가 정수리를 꼭 눌러요. 눌린 볼이 풍선처럼 볼록.
      dots([[4, by], [3, by - 1], [2, by - 2], [13, by], [14, by - 1], [15, by - 2]], armC);
      for (let y = oy + 4; y <= by - 3; y++) { put(g, 1, y, armC); put(g, 16, y, armC); }
      dots([[1, oy + 3], [2, oy + 2], [16, oy + 3], [15, oy + 2]], armC);
      dots([[3, oy + 1], [4, oy + 1], [3, oy + 2], [4, oy + 2], [13, oy + 1], [14, oy + 1], [13, oy + 2], [14, oy + 2]], "S");
      if (dir === "down") { dots([[2, oy + 8], [3, oy + 8], [4, oy + 8], [13, oy + 8], [14, oy + 8], [15, oy + 8], [2, oy + 9], [15, oy + 9]], "C"); dots([[0, oy + 8], [0, oy + 9], [17, oy + 8], [17, oy + 9]], "S"); }
    }
    // 표정
    const accLate = () => { if (acc && (acc.eye || acc.hat || acc.neck)) drawAcc(g, acc, dir, oy, by, !!P); };
    if (dir !== "up" && (face === "cry1" || face === "cry2" || face === "hit")) {
      const eyes = dir === "side" ? [HX + 7, HX + 12] : [HX + 4, HX + 10];
      const ey = oy + 7, mx = dir === "side" ? HX + 10 : HX + 7;
      eyes.forEach((x) => { rect(g, x, ey, 2, 2, "S"); });
      if (face === "hit") {
        // 깜짝: 흰 눈에 점 눈동자, 벌어진 입
        eyes.forEach((x) => { rect(g, x, ey - 1, 2, 3, "W"); put(g, x + 1, ey, "E"); });
        rect(g, mx, oy + 9, 2, 2, "M");
      } else {
        // 엉엉: 질끈 감은 눈(> <), 줄줄 흐르는 눈물, 크게 벌린 입
        eyes.forEach((x, k) => {
          const a = k === 0 && dir !== "side" ? 1 : 0;
          put(g, x + (a ? 0 : 1), ey - 1, "E"); put(g, x + (a ? 1 : 0), ey, "E"); put(g, x + (a ? 0 : 1), ey + 1, "E");
          const t = face === "cry1" ? [2, 3, 5] : [2, 4, 5];
          t.forEach((d) => put(g, x + (k === 0 ? -1 : 2), ey + d - 1, "D"));
          put(g, x + (k === 0 ? 0 : 1), ey + (face === "cry1" ? 2 : 3), "D");
        });
        rect(g, mx - 1, oy + 9, 4, 1, "M"); rect(g, mx, oy + 10, 2, 1, "M"); put(g, mx, oy + 9, "W"); put(g, mx + 1, oy + 9, "W");
      }
    }
    if (dir !== "up" && (face === "blink" || face === "happy")) {
      const eyes = dir === "side" ? [HX + 7, HX + 12] : [HX + 4, HX + 10];
      const ey = oy + 7;
      eyes.forEach((x) => { rect(g, x, ey, 2, 2, "S"); });
      if (face === "blink") eyes.forEach((x) => rect(g, x, ey + 1, 2, 1, "E"));
      else eyes.forEach((x) => { rect(g, x, ey, 2, 1, "E"); put(g, x - 1, ey + 1, "E"); put(g, x + 2, ey + 1, "E"); });
      if (face === "happy") { if (dir === "down") { put(g, HX + 7, oy + 9, "M"); put(g, HX + 8, oy + 9, "M"); } else { put(g, HX + 10, oy + 9, "M"); put(g, HX + 11, oy + 9, "M"); } }
    }
    if (dir !== "up" && /^(noeye|noL|noR|dz[1-4]|ko|cross)$/.test(face)) {
      const eyes = dir === "side" ? [HX + 7, HX + 12] : [HX + 4, HX + 10];
      const ey = oy + 7, mx = dir === "side" ? HX + 10 : HX + 7;
      eyes.forEach((x, k) => {
        rect(g, x, ey, 2, 2, "S");
        if (face === "noeye" || (face === "noL" && k === 0) || (face === "noR" && k === 1)) { rect(g, x, ey, 2, 2, "M"); put(g, x, ey, "E"); } // 눈 자리가 휑하니 비었어요
        else if (face === "noL" || face === "noR") { rect(g, x, ey - 1, 2, 3, "W"); put(g, x + (k ? 0 : 1), ey, "E"); }
        else if (face === "ko") { const a = k === 0 && dir !== "side" ? 1 : 0; put(g, x + (a ? 0 : 1), ey - 1, "E"); put(g, x + (a ? 1 : 0), ey, "E"); put(g, x + (a ? 0 : 1), ey + 1, "E"); }
        else if (face === "cross") { rect(g, x, ey, 2, 2, "W"); put(g, x + (k === 0 ? 1 : 0), ey + 1, "E"); }
        else { const q = (Number(face[2]) - 1 + k * 2) % 4; rect(g, x, ey, 2, 2, "W"); put(g, x + (q === 1 || q === 2 ? 1 : 0), ey + (q >= 2 ? 1 : 0), "E"); } // 눈동자가 뱅글뱅글
      });
      if (face === "noeye" || face === "noL" || face === "noR") { rect(g, mx, oy + 9, 2, 2, "M"); }
      else if (face === "ko") { put(g, mx - 1, oy + 10, "M"); put(g, mx, oy + 9, "M"); put(g, mx + 1, oy + 10, "M"); put(g, mx + 2, oy + 9, "M"); }
      else { rect(g, mx, oy + 9, 2, 1, "M"); }
    }
    if (dir !== "up" && /^m\d+$/.test(face)) moodFace(g, Number(face.slice(1)), dir, oy);
    accLate();
    // 좌우로 한 칸씩 여백을 둬요: 옆으로 처진 귀나 큰 귀의 테두리가 잘리지 않게
    g.forEach((r) => { r.unshift("."); r.push("."); });
    return rows(outline(g));
  }
  // ---------- 오늘의 기분 표정 (마음 20가지) ----------
  // 새 색: V 사랑 분홍, Q 반짝 노랑, N 화 빨강, X 다크서클
  function moodFace(g, n, dir, oy) {
    const side = dir === "side";
    const L = HX + (side ? 7 : 4), R = HX + (side ? 12 : 10), ey = oy + 7, mx = HX + (side ? 10 : 7), my = oy + 9;
    const eyes = [L, R];
    const P = (x, y, c) => put(g, x, y, c);
    const clearE = () => eyes.forEach((x) => rect(g, x, ey, 2, 2, "S"));
    const clearM = () => rect(g, mx, my, 2, 1, "S");
    const arcs = () => { clearE(); eyes.forEach((x) => { rect(g, x, ey, 2, 1, "E"); P(x - 1, ey + 1, "E"); P(x + 2, ey + 1, "E"); }); }; // ^ ^
    const cups = () => { clearE(); eyes.forEach((x) => { P(x - 1, ey, "E"); P(x + 2, ey, "E"); rect(g, x, ey + 1, 2, 1, "E"); }); }; // u u
    const shut = () => { clearE(); eyes.forEach((x) => rect(g, x, ey + 1, 2, 1, "E")); }; // - -
    const squeeze = () => { clearE(); eyes.forEach((x, k) => { const a = k === 0 && !side; P(x + (a ? 0 : 1), ey - 1, "E"); P(x + (a ? 1 : 0), ey, "E"); P(x + (a ? 0 : 1), ey + 1, "E"); }); }; // > <
    const lids = (px) => { clearE(); eyes.forEach((x) => { rect(g, x, ey, 2, 1, "E"); P(x + px, ey + 1, "E"); P(x + 1 - px, ey + 1, "W"); }); }; // 반쯤 감은 눈
    const worry = () => { P(L + 2, ey - 1, "h"); P(R - 1, ey - 1, "h"); }; // 안쪽이 올라간 눈썹
    const smile = () => { clearM(); P(mx - 1, my, "M"); P(mx, my + 1, "M"); P(mx + 1, my + 1, "M"); P(mx + 2, my, "M"); };
    const grin = () => { rect(g, mx - 1, my, 4, 1, "M"); P(mx, my, "W"); P(mx + 1, my, "W"); rect(g, mx, my + 1, 2, 1, "M"); };
    const open = () => { rect(g, mx, my, 2, 2, "M"); };
    const flat = () => { rect(g, mx - 1, my, 4, 1, "M"); };
    const frown = () => { rect(g, mx, my, 2, 1, "M"); P(mx - 1, my + 1, "M"); P(mx + 2, my + 1, "M"); };
    const wavy = () => { clearM(); P(mx - 1, my + 1, "M"); P(mx, my, "M"); P(mx + 1, my + 1, "M"); P(mx + 2, my, "M"); };
    const sweat = () => { P(R + 3, ey - 2, "D"); P(R + 3, ey - 1, "D"); };
    const cheeks = (c) => (side ? [HX + 5, HX + 6, HX + 13] : [HX + 2, HX + 3, HX + 12, HX + 13]).forEach((x) => P(x, my, c));
    switch (n) {
      case 1: arcs(); grin(); break; // 최고
      case 2: smile(); break; // 좋아
      case 3: flat(); break; // 그냥
      case 4: worry(); frown(); P(R + 1, ey + 2, "D"); P(R + 1, ey + 3, "D"); break; // 슬퍼
      case 5: squeeze(); wavy(); sweat(); break; // 힘들어
      case 6: eyes.forEach((x) => { rect(g, x, ey - 1, 2, 3, "E"); P(x, ey - 1, "W"); P(x + 1, ey + 1, "W"); }); cheeks("V"); smile(); break; // 설레
      case 7: // 사랑해
        clearE();
        eyes.forEach((x, k) => { const a = x - (k === 0 || side ? 1 : 0); P(a, ey - 1, "V"); P(a + 2, ey - 1, "V"); rect(g, a, ey, 3, 1, "V"); P(a + 1, ey + 1, "V"); });
        cheeks("V"); smile();
        break;
      case 8: arcs(); rect(g, mx - 1, my, 4, 1, "M"); rect(g, mx, my + 1, 2, 1, "M"); P(L - 2, ey - 1, "Q"); P(R + 3, ey - 1, "Q"); break; // 신나
      case 9: cups(); smile(); break; // 뿌듯
      case 10: shut(); smile(); break; // 편안
      case 11: // 졸려
        shut(); rect(g, mx, my, 2, 1, "M");
        rect(g, mx + 2, my - 1, 2, 2, "D"); P(mx + 2, my - 1, "W"); // 콧방울
        break;
      case 12: worry(); open(); P(mx + 2, my + 1, "D"); P(mx + 2, my + 2, "D"); break; // 배고파
      case 13: lids(1); clearM(); rect(g, mx, my, 3, 1, "M"); break; // 심심
      case 14: worry(); wavy(); sweat(); break; // 걱정
      case 15: clearE(); eyes.forEach((x) => { rect(g, x, ey, 2, 2, "W"); P(x, ey + 1, "E"); }); rect(g, mx - 1, my, 4, 1, "M"); P(mx, my, "W"); P(mx + 2, my, "W"); sweat(); break; // 긴장
      case 16: // 화나
        clearE();
        eyes.forEach((x, k) => { rect(g, x, ey - 1, 2, 1, "E"); P(k === 0 ? x + 2 : x - 1, ey, "E"); rect(g, x, ey + 1, 2, 1, "E"); });
        frown();
        [[13, -2], [15, -2], [14, -1], [13, 0], [15, 0]].forEach(([x, y]) => P(HX + x, oy + y, "N"));
        break;
      case 17: // 삐짐
        shut(); clearM(); P(mx, my + 1, "M"); P(mx + 1, my, "M"); P(mx + 2, my + 1, "M");
        (side ? [HX + 5, HX + 6] : [HX + 2, HX + 3, HX + 12, HX + 13]).forEach((x) => { P(x, my - 1, "C"); P(x, my, "C"); });
        break;
      case 18: // 아파
        clearE();
        P(L, ey + 1, "E"); P(L + 1, ey, "E"); P(R, ey, "E"); P(R + 1, ey + 1, "E");
        clearM(); P(mx, my, "M"); P(mx + 1, my, "W"); P(mx + 2, my, "W"); P(mx + 3, my, "N");
        cheeks("V");
        break;
      case 19: shut(); eyes.forEach((x) => rect(g, x, ey + 2, 2, 1, "X")); rect(g, mx, my, 2, 1, "M"); break; // 피곤
      case 20: clearE(); eyes.forEach((x) => { rect(g, x, ey - 1, 2, 3, "W"); P(x + 1, ey, "E"); }); open(); break; // 놀라
      default: break;
    }
  }
  // 지금 입은 잠옷은 바깥(옷장)에서 알려 줘요
  function wearing(who) { try { return (window.HSWear && window.HSWear(who)) || ""; } catch (e) { return ""; } }
  // 지금 건 장식(눈, 머리, 목)도 바깥(옷장)에서 알려 줘요
  function accOf(who) { try { return (window.HSAcc && window.HSAcc(who)) || {}; } catch (e) { return {}; } }
  function charImg(who, dir, frame, pose, face, pj, acc, cut) {
    if (pj === undefined) pj = wearing(who);
    if (acc === undefined) acc = accOf(who);
    const P = pj && PJ[pj];
    const IT = window.Items ? Items.BY : {};
    const pal = Object.assign({ o: OUT, V: "#ff6a8e", Z: "#8a7ad0", Q: "#ffc83a", N: "#e8504f", X: "#c9a4b6" }, PEOPLE[who] || PEOPLE.him, P ? P.c : {});
    const shapes = {};
    [["eye", "1", "2", "3"], ["hat", "4", "5", "6"], ["neck", "7", "8", "9"]].forEach(([k, a, b, c]) => {
      const it = acc && acc[k] && IT[acc[k]];
      if (!it || it.kind !== k) return;
      shapes[k] = it.shape; pal[a] = it.c[0]; pal[b] = it.c[1]; pal[c] = k === "neck" && it.shape !== "lace" ? "#ffd34d" : it.c[2];
    });
    const key = `ch12|${who}|${dir}|${frame}|${pose || ""}|${face || ""}|${P ? pj : ""}|${(acc && acc.eye) || ""}|${(acc && acc.hat) || ""}|${(acc && acc.neck) || ""}`;
    const ck = key + "|" + (cut || "");
    if (URI[ck]) return URI[ck];
    const uri = build();
    URI[ck] = uri;
    return uri;
    function build() {
    const full = charRows(who, dir, frame, pose || "", face || "", P ? pj : "", shapes);
    if (!cut) return A.fromRows(key, full, pal).uri;
    // 한 조각만 남겨요 (머리, 머리 없는 몸, 몸통, 팔, 다리). 그림판 크기는 그대로라 제자리에 포개면 다시 한 사람이 돼요.
    const by = TOP + (pose === "crouch" ? 2 : frame ? 1 : 0) + 12;
    const head = (x, y) => y < by || ((x <= 3 || x >= 16) && y < by + 3);
    const IN = {
      head, body: (x, y) => !head(x, y),
      torso: (x, y) => !head(x, y) && x >= 6 && x <= 13 && y < by + 4,
      armL: (x, y) => !head(x, y) && x <= 5 && y < by + 4, armR: (x, y) => !head(x, y) && x >= 14 && y < by + 4,
      legL: (x, y) => y >= by + 4 && x <= 9, legR: (x, y) => y >= by + 4 && x >= 10,
    }[cut];
    const g = full.map((r, y) => r.split("").map((c, x) => (c !== "o" && IN(x, y) ? c : ".")));
    return A.fromRows(key + "|" + cut, rows(outline(g)), pal).uri;
    }
  }
  const URI = {};
  // 조각 하나의 그림 (part: head, body, torso, armL, armR, legL, legR)
  const charCut = (who, dir, frame, pose, face, part) => charImg(who, dir, frame, pose, face, undefined, undefined, part);

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

  // ---------- 그림 속 동물 (도감의 모든 종): 찹쌀떡처럼 동그란 몸에 종마다 귀, 꼬리, 무늬 ----------
  // frame: stand, walk1, walk2, lie, eat, loaf, stretch, groom / face: "", blink, happy, sleep, yawn, baa, glow, grump, sweat
  const PET_BALL = mir([".....UUUU", "...UUUUUU", "..UUUUUUU", ".UUUUUUUU", ".UUUUUUUU", "UUUUUUUUU", "UUUUUUUUU", "UUUUUUUUU", "UUUUUUUUU", "UUUUUUUUU", "UUUUUbbbb", "uUUUbbbbb", "uUUUbbbbb", ".uUUUbbbb", "..uuuuuuu"]);
  const PET_EARS = {
    round: [[1, -1], [".UU.", "UiiU", "UiiU"]], long: [[3, -5], ["UU.", "UiU", "UiU", "UiU", "UiU", "UUU"]], point: [[1, -2], ["U..", "UU.", "UiU", "UiiU"]], tiny: [[3, 0], ["UU", "Ui"]],
    frog: [[2, -2], [".UUU.", "UwwwU", "UwEwU", "UUUUU"]], koala: [[-1, 0], [".UUU.", "UiiiU", "UiiiU", ".UUU."]], deer: [[2, -4], ["x.x.", "xxx.", ".x..", ".x.."]],
    big: [[-1, -2], ["UUUU", "UiiU", "UiiU", ".UUU"]], horn: [[3, -2], ["w.", "ww", "ww"]], antenna: [[5, -3], ["x.", ".x", ".x"]],
  };
  const PET_W = 26, PET_H = 23;
  function petRows(sp, frame, face) {
    const g = blank(PET_W, PET_H);
    const m = sp.m, has = (c) => m.indexOf(c) >= 0;
    const low = frame === "lie" || frame === "loaf" || frame === "groom";
    const walk = frame === "walk1" || frame === "walk2";
    const look = walk ? 1 : 0;
    const body = low ? PET_BALL.filter((r, i) => i !== 6 && i !== 12) : PET_BALL;
    const ox = 4, oy = 6 + (low ? 2 : 0) + (frame === "eat" ? 1 : 0);
    const P = (x, y, c) => put(g, ox + x, oy + y, c);
    const flipRows = (rs) => rs.map((r) => r.split("").reverse().join(""));
    const st = (rs, x, y) => rs.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== ".") P(x + i, y + j, r[i] === "U" && has("e") ? "x" : r[i]); });
    // 꼬리 (몸 뒤, 오른쪽 아래)
    const ty = body.length - 6;
    if (sp.tail === "puff") { P(17, ty + 1, "U"); P(18, ty + 1, "U"); P(18, ty, "U"); P(17, ty + 2, "u"); }
    else if (sp.tail === "long" || sp.tail === "ring") { [[17, ty + 3], [18, ty + 2], [19, ty + 1], [19, ty], [19, ty - 1], [18, ty - 2]].forEach(([x, y], k) => P(x, y, sp.tail === "ring" && k % 2 ? "x" : "U")); }
    else if (sp.tail === "bushy") { [[17, ty + 2], [18, ty + 1], [18, ty + 2], [19, ty], [19, ty + 1], [18, ty], [19, ty - 1], [18, ty - 1]].forEach(([x, y]) => P(x, y, "U")); P(19, ty - 1, "b"); P(18, ty - 1, "b"); }
    else if (sp.tail === "dino") { [[17, ty + 3], [18, ty + 3], [19, ty + 2], [18, ty + 2], [20, ty + 1]].forEach(([x, y]) => P(x, y, "U")); P(19, ty + 1, "x"); }
    else if (sp.tail === "curl") { P(17, ty + 2, "U"); P(18, ty + 1, "U"); P(18, ty, "U"); P(17, ty, "U"); }
    else if (sp.tail === "up") { P(17, ty + 2, "U"); P(18, ty + 1, "U"); P(18, ty, "U"); P(18, ty - 1, "U"); }
    else if (sp.tail === "nub") { P(17, ty + 2, "U"); P(18, ty + 2, "u"); }
    else if (sp.tail === "fish") { [[17, ty + 1], [18, ty], [18, ty + 2], [19, ty - 1], [19, ty + 3], [18, ty + 1]].forEach(([x, y]) => P(x, y, "U")); P(19, ty - 1, "u"); P(19, ty + 3, "u"); }
    // 날개, 갈기 (몸 뒤)
    const flying = frame === "fly1" || frame === "fly2";
    const wingC = has("i") && !has("k") ? "w" : "u";
    if (flying) {
      // 날갯짓: 위로 한 번, 아래로 한 번
      const wing = frame === "fly1" ? [[-1, 4], [-1, 5], [-2, 3], [-2, 4], [-3, 2], [-3, 3], [-4, 2]] : [[-1, 6], [-1, 7], [-2, 7], [-2, 8], [-3, 8], [-3, 9], [-4, 9]];
      wing.forEach(([x, y]) => { P(x, y, wingC); P(17 - x, y, wingC); });
    } else if (has("i")) { [[-1, 5], [-2, 4], [-2, 5], [-1, 6], [-2, 6], [18, 5], [19, 4], [19, 5], [18, 6], [19, 6]].forEach(([x, y]) => P(x, y, wingC)); }
    if (has("g")) { for (let a = 0; a < 16; a++) { const t = (a / 16) * Math.PI * 2; P(Math.round(8.5 + Math.cos(t) * 9.6), Math.round(5.5 + Math.sin(t) * 7.2), "x"); P(Math.round(8.5 + Math.cos(t) * 8.8), Math.round(5.5 + Math.sin(t) * 6.6), "x"); } }
    // 발
    const last = oy + body.length;
    if (!low && !flying) {
      const fl = frame === "walk1" ? 1 : 0, fr = frame === "walk2" ? 1 : 0;
      rect(g, ox + 3, last - fl, 3, 1, "f"); rect(g, ox + 12, last - fr, 3, 1, "f");
    }
    stamp(g, body, ox, oy);
    // 귀
    if (sp.ear === "floppy") { st(["UU", "Uu", "uU", "uu"], -1, 3); st(["UU", "uU", "Uu", "uu"], 17, 3); }
    else if (sp.ear === "tuft") { [[7, -1], [8, -2], [8, -1], [9, -2], [9, -1]].forEach(([x, y]) => P(x, y, "U")); }
    else if (sp.ear === "spikes") { [[3, 0], [6, -1], [8, -2], [9, -2], [11, -1], [14, 0]].forEach(([x, y]) => { P(x, y, "x"); P(x, y + 1, "x"); }); }
    else if (PET_EARS[sp.ear]) { const [at, rs] = PET_EARS[sp.ear]; st(rs, at[0], at[1]); st(flipRows(rs), 18 - at[0] - rs[0].length, at[1]); }
    // 무늬
    if (has("w")) { [[3, 1], [6, 0], [9, 0], [12, 1], [14, 2], [2, 3], [5, 2], [11, 2], [8, 1]].forEach(([x, y]) => P(x, y, "w")); [[1, 9], [16, 9], [3, 12], [14, 12]].forEach(([x, y]) => P(x, y, "w")); }
    if (has("s")) { [[8, 0], [9, 0], [8, 1], [9, 1], [1, 5], [2, 5], [16, 5], [15, 5], [0, 8], [1, 8], [17, 8], [16, 8], [5, 2], [12, 2]].forEach(([x, y]) => P(x, y, "x")); }
    if (has("d")) { [[3, 2], [13, 3], [6, 1], [1, 7], [16, 6], [15, 10], [2, 11], [10, 2]].forEach(([x, y]) => P(x, y, "x")); }
    if (has("p")) { [[2, 2], [3, 2], [4, 2], [2, 3], [3, 3], [1, 4], [2, 4], [3, 1], [13, 9], [14, 9], [15, 9], [14, 10], [15, 10], [15, 8], [11, 1], [12, 1]].forEach(([x, y]) => P(x, y, "x")); }
    if (has("v")) { [[8, 0], [9, 0], [8, 1], [9, 1], [8, 2], [9, 2], [8, 3], [9, 3], [8, 4], [9, 4]].forEach(([x, y]) => P(x, y, "W")); }
    if (has("q")) { for (let y = 1; y <= 4; y++) for (let x = 5; x <= 12; x++) if ((x + y) % 2 === 0 && !(y === 4 && (x < 6 || x > 11))) P(x, y, "x"); }
    if (has("c")) { [[7, -1], [8, -1], [9, -1], [10, -1], [8, -2], [9, -2], [9, -3]].forEach(([x, y]) => P(x, y, "x")); }
    if (has("h") && sp.ear !== "horn") { [[5, -1], [5, -2], [12, -1], [12, -2]].forEach(([x, y]) => P(x, y, "w")); }
    if (has("f")) { [[8, -1], [9, -1], [10, -1], [9, -2], [10, -2], [10, -3]].forEach(([x, y]) => P(x, y, "u")); }
    // 얼굴
    const ey = low ? 5 : 6;
    if (has("m")) { rect(g, ox + 2 + look, oy + ey - 1, 4, 4, "x"); rect(g, ox + 12 + look, oy + ey - 1, 4, 4, "x"); }
    if (has("z")) { rect(g, ox + 6 + look, oy + ey + 1, 6, 3, "b"); rect(g, ox + 7 + look, oy + ey + 4, 4, 1, "b"); }
    const f = face === "sleep" || face === "yawn" || face === "grump" ? "blink" : face === "baa" || face === "glow" || face === "sweat" ? "" : face;
    const big = has("y");
    [3, 13].forEach((x) => {
      const X = ox + x + look, Y = oy + ey;
      if (big && f === "") { rect(g, X - 1, Y - 1, 3, 3, "W"); rect(g, X, Y, 2, 2, "K"); put(g, X, Y, "W"); }
      else eye(g, X, Y, f);
    });
    P(1 + look, ey + 2, "C"); P(16 + look, ey + 2, "C");
    const nx = ox + 8 + look, ny = oy + ey + 2;
    if (has("k")) { rect(g, nx - 1, ny - 1, 4, 1, "B"); rect(g, nx, ny, 2, 1, "B"); if (face === "baa" || face === "yawn" || face === "happy") rect(g, nx, ny + 1, 2, 1, "M"); }
    else if (has("o")) { rect(g, nx - 1, ny - 1, 4, 2, "n"); put(g, nx, ny - 1, "q"); put(g, nx + 1, ny - 1, "q"); }
    else {
      if (has("n")) { put(g, nx, ny - 1, "N"); put(g, nx + 1, ny - 1, "N"); }
      if (face === "baa" || face === "yawn") rect(g, nx, ny, 2, 2, "M");
      else if (face === "happy") { put(g, nx - 1, ny, "M"); put(g, nx + 2, ny, "M"); put(g, nx, ny + 1, "M"); put(g, nx + 1, ny + 1, "M"); }
      else { put(g, nx - 1, ny + 1, "N"); put(g, nx + 2, ny + 1, "N"); }
    }
    if (has("t")) { put(g, nx - 2, ny + 1, "W"); put(g, nx + 3, ny + 1, "W"); }
    if (face === "sweat") { put(g, ox + 18, oy + 2, "D"); put(g, ox + 18, oy + 3, "D"); put(g, ox + 17, oy + 3, "D"); }
    if (frame === "eat") { put(g, nx, last, "G"); put(g, nx + 1, last, "G"); put(g, nx - 1, last - 1, "G"); put(g, nx + 2, last - 1, "G"); }
    return rows(outline(g));
  }
  const PET_HAND = { hippo: (f, c) => hippoImg(f === "eat" || f === "loaf" || f === "groom" || f === "stretch" ? "stand" : f, c), sheep: (f, c, w) => sheepImg(f === "loaf" || f === "groom" || f === "stretch" ? "lie" : f, c, w), cat: (f, c, w, t) => catImg(f === "eat" ? "stand" : f === "lie" ? "loaf" : f, c, t) };
  function petImg(id, frame, face, wet, tail) {
    if (PET_HAND[id]) return PET_HAND[id](frame || "stand", face || "", wet, tail == null ? 1 : tail);
    const sp = PJ[id];
    if (!sp) return "";
    const fr = frame === "stretch" ? "stand" : frame || "stand";
    return A.fromRows(`pet2|${id}|${fr}|${face || ""}`, petRows(sp, fr, face || ""), Object.assign({ o: Z.shade ? Z.shade(sp.c.U.slice(1), -0.62) : OUT, K: "#2e221c", W: "#ffffff", C: "#ff9ab8", M: "#c0506a", N: Z.shade ? Z.shade(sp.c.U.slice(1), -0.55) : "#3b2a20", D: "#7fc4f0", G: "#5fae5f", E: "#2e221c" }, sp.c)).uri;
  }

  // ---------- 강아지 (찹쌀떡처럼 동그랗게 앞을 봐요) ----------
  // cream: 귀가 축 처진 크림볼 (농장 마루) / bichon: 하얀 솜사탕 비숑 (홈 산책)
  const DOGS = {
    cream: { body: mir(["....BBBBB", "..lBBBBBB", ".DlBBBBBB", "DDBBBBBBB", "DDBBBBBBB", "DDBBBBBBB", "DDBBBBBBB", "DDCBBWWWW", ".DBBWWWWN", "..BBWWWWK", "..BBBWWKT", ".BBBBBBBB", "BBBBBBWWW", "BBBBBBWWW", "dBBBBBBBB", ".dWWdddWW"]), base: "B", tail: "B", eye: [3, 5],
      pal: { o: "#5a3e2c", B: "#f6dcb4", l: "#fff0d8", D: "#e0b07a", d: "#c8955c", W: "#fffaf0", N: "#3b2a20", K: "#2e221c", C: "#ffaaa8", T: "#ff8aa0", M: "#c0506a" } },
    bichon: { body: mir(["...wWWwWW", ".wWWWWWWW", "wWWWWWWWW", "WWWWWWWWW", "WwWWWWWWW", "WWWWWWWWW", "WWWWWWWWW", "wWCWWWWWW", "WWWWWWWWN", "wWWWWWWWK", ".wWWWWWKT", "..wwRRRRR", ".wWWWWWWW", "wWWWwWWWW", ".wwWWwwWW", "..www.www"]), base: "W", tail: "W", eye: [3, 5],
      pal: { o: "#5a4a54", W: "#ffffff", w: "#ece4ee", K: "#2e221c", N: "#2e221c", C: "#ffb0c4", T: "#ff8aa0", R: "#ff7aa8", M: "#c0506a" } },
  };
  const DOG_W = 22, DOG_H = 18;
  // frame: stand, walk1, walk2, sit / tail: 0 왼쪽, 1 오른쪽 (살랑살랑) / face: "", happy
  function dogRows(frame, tail, face, breed) {
    const D = DOGS[breed] || DOGS.cream;
    const g = blank(DOG_W, DOG_H);
    const sit = frame === "sit";
    const walk = frame === "walk1" || frame === "walk2";
    const look = walk ? 1 : 0;
    let body = D.body.slice();
    if (sit) body = body.filter((r, i) => i !== 12);
    const oy = 1 + (sit ? 1 : 0), ox = 2;
    // 꼬리 (몸 뒤에서 살랑)
    const tx = tail ? ox + 17 : ox - 2, ty = oy + 9;
    put(g, tx, ty, D.tail); put(g, tx + (tail ? 1 : 1), ty - 1, D.tail); put(g, tail ? tx + 1 : tx, ty - 2, D.tail);
    stamp(g, body, ox, oy);
    // 걸을 땐 한쪽 발씩 들어요
    const last = oy + body.length - 1;
    if (frame === "walk1") for (let x = ox; x < ox + 9; x++) g[last][x] = ".";
    if (frame === "walk2") for (let x = ox + 9; x < ox + 18; x++) g[last][x] = ".";
    // 눈
    const [ex, ey] = D.eye;
    [ox + ex, ox + 17 - ex - 1].forEach((x) => { rect(g, x, oy + ey, 2, 2, D.base); });
    const f = face === "happy" ? "happy" : "";
    eye(g, ox + ex + look, oy + ey, f); eye(g, ox + 17 - ex - 1 + look, oy + ey, f);
    if (face === "happy") { put(g, ox + 8, oy + 11, "T"); put(g, ox + 9, oy + 11, "T"); }
    return rows(outline(g));
  }
  function dogImg(frame, tail, face, breed) {
    const b = DOGS[breed] ? breed : "cream";
    const key = `dog3|${b}|${frame}|${tail ? 1 : 0}|${face || ""}`;
    return A.fromRows(key, dogRows(frame, tail, face, b), DOGS[b].pal).uri;
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

  // 지금 입은 잠옷의 귀가 머리 위로 몇 칸 솟는지 (기분 표시를 그만큼 올려 달려고)
  function earRise(who) {
    const P = PJ[wearing(who)];
    return !P ? 0 : P.ear === "long" ? 3 : P.ear === "deer" ? 2 : 0;
  }
  window.FSprites = { earRise, charCut, TOP, petImg, PAJAMAS, PJ, CH_W: CH_FULL, CH_H, HIPPO_SWIM, DOG_W, DOG_H, charImg, charRows, dogImg, henImg, hippoImg, sheepImg, catImg, toolImg, toolUri, decoImg, decoUri, frames, PEOPLE };
})();
