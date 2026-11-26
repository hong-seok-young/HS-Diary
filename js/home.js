// ============================================================
// 우리 동네: 황무지에서 시작해서, 둘이 이것저것 할수록 동네 전체가 조금씩 자라요.
// - 한 단계에 딱 하나씩 바뀌어요. 집만 바뀌는 게 아니라 땅에 풀이 돋고, 새싹이 나무가 되고,
//   울타리와 가로등이 생기고, 연못에 연꽃이 피고, 하늘에 열기구가 떠요. 집도 그 사이사이에
//   살림을 들이고, 지붕을 새로 칠하고, 공사를 해서 다음 집이 돼요.
// - 무엇이 바뀌었는지는 그 자리에 말풍선으로 알려 줘요 (다른 폰에서 바뀐 것도 앱을 열 때).
// - 단계는 지금까지 받은 선물 수(= 한 일의 수)로 정해요. 두 폰이 늘 같아요.
// - 집을 누르면 동네 이야기(지금까지 생긴 것과 앞으로 생길 것)를 볼 수 있어요. 옷장은 빨랫줄이에요.
// ============================================================
(function () {
  "use strict";
  // ---------- 그리기 도구 ----------
  const GW = 46, GH = 34, GY = 31, CX = 23; // 칸 크기, 땅 높이, 가운데
  function grid() { const g = []; for (let y = 0; y < GH; y++) g.push(new Array(GW).fill(".")); return g; }
  const put = (g, x, y, c) => { if (g[y] && x >= 0 && x < GW) g[y][x] = c; };
  const rect = (g, x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(g, x + i, y + j, c); };
  const row = (g, a, b, y, c) => { for (let x = a; x <= b; x++) put(g, x, y, c); };
  const dots = (g, list, c) => list.forEach(([x, y]) => put(g, x, y, c));
  // 둥근 지붕: 가운데 cx, 맨 아랫줄 y, 반폭 hw, 높이 h. 위쪽에 밝은 띠, 맨 아래는 그늘.
  function dome(g, cx, y, hw, h, c, sh, hi) {
    for (let j = 0; j < h; j++) {
      const k = (j + 0.5) / h, half = Math.max(1, Math.round(hw * Math.sqrt(1 - (1 - k) * (1 - k))));
      const yy = y - h + 1 + j;
      row(g, cx - half, cx + half - 1, yy, j === h - 1 ? sh : c);
      if (hi && j === 1 && half > 3) row(g, cx - half + 2, cx - half + 2 + Math.max(1, Math.floor(half / 2)), yy, hi);
    }
  }
  // 사다리꼴 지붕: 아랫줄이 물결 모양
  function trap(g, cx, y, hw, h, c, sh, hi) {
    for (let j = 0; j < h; j++) { const half = hw - (h - 1 - j); const yy = y - h + 1 + j; row(g, cx - half, cx + half - 1, yy, c); if (hi && j === 1) row(g, cx - half + 1, cx - 2, yy, hi); }
    for (let x = cx - hw; x < cx + hw; x++) if ((x - cx + 100) % 3 !== 0) put(g, x, y, sh); else put(g, x, y, c);
    for (let x = cx - hw + 1; x < cx + hw; x += 3) put(g, x, y + 1, sh);
  }
  // 뾰족 지붕 (탑)
  function cone(g, cx, y, hw, c, sh, hi) { for (let j = 0; j < hw + 1; j++) { const half = Math.max(1, j); row(g, cx - half, cx + half - 1, y - hw + j, j === hw ? sh : c); if (hi && j > 1 && j < hw) put(g, cx - half + 1, y - hw + j, hi); } }
  // 둥근 문
  function door(g, x, w, h, c, d) { rect(g, x, GY - h, w, h, c || "D"); put(g, x, GY - h, d || "W"); put(g, x + w - 1, GY - h, d || "W"); for (let j = 1; j < h; j++) put(g, x, GY - j, "d"); put(g, x + w - 2, GY - Math.floor(h / 2), "Y"); }
  // 창문: 흰 틀에 유리, 가운데 십자
  function win(g, x, y) { rect(g, x, y, 4, 4, "F"); rect(g, x + 1, y + 1, 2, 2, "G"); }
  function ground(g, a, b) { row(g, a, b, GY, "L"); row(g, a + 1, b - 1, GY + 1, "l"); for (let x = a + 2; x < b; x += 5) put(g, x, GY, "M"); }

  // ---------- 집 종류 ----------
  // 그린 뒤 돌려주는 것: l, r (벽 왼쪽·오른쪽), eave (처마 높이), top ([x, y] 지붕 꼭대기), dx (문 왼쪽), wins ([[x, y], …]), chim ([x, y] 굴뚝 자리)
  const C_STONE = { W: "#d9dbe6", w: "#b4b8c8", R: "#8fb4f0", r: "#6890d4", H: "#bcd6ff" };
  const TIERS = [
    { name: "빈터", feats: ["weed", "sign", "fire"], c: {}, draw: (g, s) => {
      row(g, 9, 36, GY, "E"); row(g, 11, 34, GY + 1, "e"); dots(g, [[13, GY], [21, GY], [30, GY]], "e");
      if (s < 1) { rect(g, 12, GY - 2, 3, 2, "S"); put(g, 12, GY - 2, "."); put(g, 14, GY - 1, "s"); dots(g, [[31, GY - 1], [31, GY - 2], [31, GY - 3], [30, GY - 4], [32, GY - 4], [29, GY - 5], [33, GY - 5]], "k"); put(g, 34, GY - 1, "S"); }
      else { dots(g, [[12, GY - 1], [13, GY - 2], [14, GY - 1], [32, GY - 1], [33, GY - 2], [34, GY - 1]], "L"); put(g, 13, GY - 1, "l"); put(g, 33, GY - 1, "l"); }
      return { l: 19, r: 27, eave: GY - 6, top: null, dx: 22, wins: [], chim: null };
    } },
    { name: "텐트", feats: ["mat", "fire", "pot", "flag", "lamp"], c: { R: "#ffb86b", r: "#e8904a", H: "#ffd9a6", V: "#fff6e2" }, draw: (g) => {
      ground(g, 6, 39);
      for (let j = 0; j < 12; j++) { row(g, CX - j, CX + j - 1, GY - 12 + j, "R"); if (j > 1) { put(g, CX - j + 1, GY - 12 + j, "H"); put(g, CX + j - 1, GY - 12 + j, "r"); } }
      for (let j = 3; j < 12; j += 3) row(g, CX - j + 2, CX + j - 3, GY - 12 + j, "V");
      for (let j = 0; j < 6; j++) row(g, CX - 1 - Math.floor(j / 2), CX + Math.floor(j / 2), GY - 6 + j, "d");
      put(g, CX - 1, GY - 13, "K"); put(g, CX, GY - 13, "K");
      return { l: 12, r: 34, eave: GY - 9, top: [CX, GY - 13], dx: 22, wins: [], chim: null };
    } },
    { name: "움집", feats: ["mat", "path", "pot", "fire", "fenceL", "bush", "flowerbed", "tree", "lamp"], c: { R: "#ecd088", r: "#c9a558", H: "#fbe8b0" }, draw: (g) => {
      ground(g, 5, 40);
      dome(g, CX, GY - 1, 11, 12, "R", "r", "H");
      for (let y = GY - 10; y < GY - 1; y += 2) for (let x = CX - 8 + (y % 4); x < CX + 9; x += 4) if (g[y][x] === "R") put(g, x, y, "r");
      rect(g, CX - 2, GY - 6, 4, 6, "d"); put(g, CX - 2, GY - 6, "R"); put(g, CX + 1, GY - 6, "R");
      dots(g, [[CX - 1, GY - 13], [CX - 2, GY - 14], [CX, GY - 13], [CX + 1, GY - 14]], "K");
      return { l: 12, r: 34, eave: GY - 6, top: [CX, GY - 13], dx: 21, wins: [], chim: null };
    } },
    { name: "초가집", c: { W: "#fbeed2", w: "#e6d2a8", R: "#f0d48c", r: "#cda95c", H: "#fdebb6" }, draw: (g) => {
      ground(g, 4, 41);
      rect(g, 14, GY - 9, 18, 9, "W"); row(g, 14, 31, GY - 9, "w"); rect(g, 14, GY - 9, 1, 9, "K"); rect(g, 31, GY - 9, 1, 9, "K");
      dome(g, CX, GY - 9, 12, 8, "R", "r", "H");
      for (let x = 13; x < 33; x += 3) put(g, x, GY - 11, "r");
      door(g, 21, 4, 6);
      return { l: 14, r: 31, eave: GY - 9, top: [CX, GY - 17], dx: 21, wins: [[16, GY - 7], [27, GY - 7]], chim: [28, GY - 17] };
    } },
    { name: "통나무집", c: { W: "#d9a36c", w: "#b47e4a", R: "#a8704a", r: "#84522e", H: "#c89068" }, draw: (g) => {
      ground(g, 4, 41);
      rect(g, 13, GY - 10, 20, 10, "W"); for (let y = GY - 9; y < GY; y += 2) row(g, 13, 32, y, "w"); rect(g, 13, GY - 10, 1, 10, "k"); rect(g, 32, GY - 10, 1, 10, "k");
      trap(g, CX, GY - 11, 13, 7, "R", "r", "H");
      door(g, 21, 4, 6);
      return { l: 13, r: 32, eave: GY - 10, top: [CX, GY - 18], dx: 21, wins: [[15, GY - 8], [27, GY - 8]], chim: [27, GY - 19] };
    } },
    { name: "버섯집", c: { W: "#fff6e6", w: "#ecdcc0", R: "#ff7a7a", r: "#e0525e", H: "#ffa8a0" }, draw: (g) => {
      ground(g, 4, 41);
      rect(g, 15, GY - 9, 16, 9, "W"); rect(g, 15, GY - 9, 1, 9, "w"); rect(g, 30, GY - 9, 1, 9, "w"); put(g, 15, GY - 1, "."); put(g, 30, GY - 1, ".");
      dome(g, CX, GY - 9, 14, 10, "R", "r", "H");
      [[13, GY - 12], [18, GY - 15], [24, GY - 16], [29, GY - 13], [33, GY - 11], [21, GY - 12]].forEach(([x, y]) => { rect(g, x, y, 2, 2, "F"); });
      door(g, 21, 4, 6);
      return { l: 15, r: 30, eave: GY - 9, top: [CX, GY - 19], dx: 21, wins: [[16, GY - 7], [26, GY - 7]], chim: [29, GY - 19] };
    } },
    { name: "기와집", c: { W: "#fffaf0", w: "#e8dcc4", R: "#6e83a8", r: "#4e6184", H: "#93a6c8" }, draw: (g) => {
      ground(g, 3, 42);
      rect(g, 12, GY - 9, 22, 9, "W"); [12, 18, 27, 33].forEach((x) => rect(g, x, GY - 9, 1, 9, "K")); row(g, 12, 33, GY - 9, "K");
      trap(g, CX, GY - 10, 14, 6, "R", "r", "H"); put(g, CX - 15, GY - 11, "R"); put(g, CX + 14, GY - 11, "R"); put(g, CX - 15, GY - 12, "r"); put(g, CX + 14, GY - 12, "r"); row(g, CX - 8, CX + 7, GY - 16, "r");
      rect(g, 20, GY - 7, 6, 7, "D"); rect(g, 22, GY - 7, 2, 7, "d"); row(g, 20, 25, GY - 7, "K");
      return { l: 12, r: 33, eave: GY - 9, top: [CX, GY - 17], dx: 20, wins: [[14, GY - 7], [28, GY - 7]], chim: null };
    } },
    { name: "벽돌집", c: { W: "#f2a184", w: "#d67e62", R: "#ff9a4a", r: "#e0762a", H: "#ffc08a" }, draw: (g) => {
      ground(g, 3, 42);
      rect(g, 12, GY - 11, 22, 11, "W"); for (let y = GY - 10; y < GY; y += 2) for (let x = 13 + (y % 4 ? 0 : 2); x < 33; x += 4) put(g, x, y, "w");
      trap(g, CX, GY - 12, 14, 7, "R", "r", "H");
      door(g, 21, 4, 7); row(g, 20, 25, GY - 8, "F");
      return { l: 12, r: 33, eave: GY - 11, top: [CX, GY - 19], dx: 21, wins: [[14, GY - 8], [28, GY - 8]], chim: [28, GY - 21] };
    } },
    { name: "이층집", c: { W: "#fff6e2", w: "#ead8b4", R: "#ff9ab4", r: "#e2708e", H: "#ffc4d4" }, draw: (g) => {
      ground(g, 3, 42);
      rect(g, 13, GY - 17, 20, 17, "W"); row(g, 13, 32, GY - 9, "w"); rect(g, 13, GY - 17, 1, 17, "w"); rect(g, 32, GY - 17, 1, 17, "w");
      trap(g, CX, GY - 18, 13, 7, "R", "r", "H");
      door(g, 21, 4, 7);
      win(g, 15, GY - 15); win(g, 27, GY - 15); rect(g, 21, GY - 15, 4, 4, "F"); rect(g, 22, GY - 14, 2, 3, "G"); put(g, 21, GY - 15, "W"); put(g, 24, GY - 15, "W");
      row(g, 19, 26, GY - 10, "K"); for (let x = 19; x <= 26; x += 2) put(g, x, GY - 11, "K");
      return { l: 13, r: 32, eave: GY - 17, top: [CX, GY - 25], dx: 21, wins: [[15, GY - 7], [27, GY - 7]], chim: [27, GY - 26] };
    } },
    { name: "과자집", c: { W: "#d99a5c", w: "#b87a3e", R: "#fff6fb", r: "#ffc6dc", H: "#ffffff" }, draw: (g) => {
      ground(g, 3, 42);
      rect(g, 13, GY - 12, 20, 12, "W"); rect(g, 13, GY - 12, 1, 12, "w"); rect(g, 32, GY - 12, 1, 12, "w");
      for (let x = 14; x < 32; x += 3) { put(g, x, GY - 12, "F"); put(g, x + 1, GY - 12, "F"); put(g, x, GY - 11, "F"); }
      trap(g, CX, GY - 13, 13, 8, "R", "r", "H");
      [[14, GY - 16, "P"], [19, GY - 18, "A"], [26, GY - 18, "y"], [31, GY - 16, "M"], [22, GY - 16, "N"]].forEach(([x, y, c]) => rect(g, x, y, 2, 2, c));
      door(g, 21, 4, 7, "N", "W"); put(g, 22, GY - 5, "F"); put(g, 23, GY - 3, "F");
      dots(g, [[16, GY - 2], [29, GY - 2], [18, GY - 4], [28, GY - 4]], "P");
      return { l: 13, r: 32, eave: GY - 12, top: [CX, GY - 21], dx: 21, wins: [[15, GY - 9], [27, GY - 9]], chim: [27, GY - 22] };
    } },
    { name: "시계탑 집", c: { W: "#e6f2ff", w: "#c2d6ee", R: "#7fd0c0", r: "#56ac9c", H: "#b4ecdc" }, draw: (g) => {
      ground(g, 3, 42);
      rect(g, 11, GY - 11, 16, 11, "W"); rect(g, 11, GY - 11, 1, 11, "w");
      trap(g, 19, GY - 12, 10, 6, "R", "r", "H");
      rect(g, 26, GY - 20, 9, 20, "W"); rect(g, 34, GY - 20, 1, 20, "w"); cone(g, 30, GY - 21, 6, "R", "r", "H");
      rect(g, 28, GY - 18, 5, 5, "F"); rect(g, 29, GY - 17, 3, 3, "y"); put(g, 30, GY - 17, "K"); put(g, 30, GY - 16, "K"); put(g, 31, GY - 16, "K");
      door(g, 28, 4, 7); win(g, 28, GY - 12);
      return { l: 11, r: 34, eave: GY - 11, top: [30, GY - 28], dx: 28, wins: [[13, GY - 8], [20, GY - 8]], chim: [14, GY - 19] };
    } },
    { name: "저택", c: { W: "#fffaf2", w: "#e8dcc8", R: "#9aa4f0", r: "#727cd0", H: "#c4caff" }, draw: (g) => {
      ground(g, 1, 44);
      rect(g, 7, GY - 13, 32, 13, "W"); row(g, 7, 38, GY - 7, "w"); rect(g, 7, GY - 13, 1, 13, "w"); rect(g, 38, GY - 13, 1, 13, "w");
      trap(g, CX, GY - 14, 18, 5, "R", "r", "H");
      rect(g, 17, GY - 19, 12, 6, "W"); cone(g, CX, GY - 20, 8, "R", "r", "H"); rect(g, 21, GY - 18, 4, 4, "F"); rect(g, 22, GY - 17, 2, 2, "G");
      [18, 27].forEach((x) => rect(g, x, GY - 13, 1, 13, "F"));
      rect(g, 20, GY - 8, 6, 8, "D"); rect(g, 22, GY - 8, 2, 8, "d"); put(g, 20, GY - 8, "W"); put(g, 25, GY - 8, "W"); put(g, 21, GY - 4, "Y"); put(g, 24, GY - 4, "Y");
      win(g, 9, GY - 12); win(g, 33, GY - 12);
      return { l: 7, r: 38, eave: GY - 13, top: [CX, GY - 29], dx: 21, wins: [[9, GY - 6], [33, GY - 6], [13, GY - 12], [29, GY - 12]], chim: [33, GY - 21] };
    } },
    { name: "작은 성", c: C_STONE, draw: (g) => {
      ground(g, 2, 43);
      rect(g, 15, GY - 12, 16, 12, "W"); for (let x = 15; x < 31; x += 2) put(g, x, GY - 13, "W");
      [[9, 15], [30, 36]].forEach(([a, b]) => { rect(g, a, GY - 17, 7, 17, "W"); rect(g, b, GY - 17, 1, 17, "w"); cone(g, a + 4, GY - 18, 5, "R", "r", "H"); rect(g, a + 2, GY - 14, 3, 4, "F"); rect(g, a + 3, GY - 13, 1, 3, "G"); });
      rect(g, 20, GY - 8, 6, 8, "D"); rect(g, 22, GY - 8, 2, 8, "d"); put(g, 20, GY - 8, "W"); put(g, 25, GY - 8, "W");
      dots(g, [[17, GY - 4], [28, GY - 6], [11, GY - 5], [33, GY - 7], [18, GY - 9]], "w");
      return { l: 9, r: 36, eave: GY - 12, top: [13, GY - 24], dx: 21, wins: [[16, GY - 10], [26, GY - 10]], chim: null };
    } },
    { name: "큰 성", c: { W: "#e4dcf2", w: "#bfb2d8", R: "#ff9ab4", r: "#e2708e", H: "#ffc4d4" }, draw: (g) => {
      ground(g, 1, 44);
      rect(g, 11, GY - 11, 24, 11, "W"); for (let x = 11; x < 35; x += 2) put(g, x, GY - 12, "W");
      [[5, 11], [34, 40]].forEach(([a, b]) => { rect(g, a, GY - 16, 7, 16, "W"); rect(g, b, GY - 16, 1, 16, "w"); cone(g, a + 4, GY - 17, 5, "R", "r", "H"); rect(g, a + 2, GY - 13, 3, 4, "F"); rect(g, a + 3, GY - 12, 1, 3, "G"); });
      rect(g, 18, GY - 21, 10, 21, "W"); rect(g, 27, GY - 21, 1, 21, "w"); for (let x = 17; x < 29; x += 2) put(g, x, GY - 22, "W"); row(g, 17, 28, GY - 21, "W"); cone(g, CX, GY - 23, 6, "R", "r", "H");
      rect(g, 21, GY - 19, 4, 5, "F"); rect(g, 22, GY - 18, 2, 4, "G");
      rect(g, 20, GY - 8, 6, 8, "D"); rect(g, 22, GY - 8, 2, 8, "d"); put(g, 20, GY - 8, "W"); put(g, 25, GY - 8, "W");
      dots(g, [[14, GY - 4], [31, GY - 6], [7, GY - 5], [37, GY - 7]], "w");
      return { l: 5, r: 40, eave: GY - 11, top: [CX, GY - 30], dx: 21, wins: [[13, GY - 9], [29, GY - 9]], chim: null };
    } },
    { name: "구름 성", c: { W: "#fff6fb", w: "#ecd8ea", R: "#b79cf0", r: "#9478d8", H: "#d8c6ff" }, draw: (g) => {
      // 구름
      [[8, 37, GY - 2], [4, 41, GY - 1], [2, 43, GY], [5, 40, GY + 1]].forEach(([a, b, y]) => row(g, a, b, y, y > GY ? "c" : "C"));
      dots(g, [[6, GY - 3], [7, GY - 3], [38, GY - 3], [39, GY - 3], [40, GY - 2]], "C");
      const B = GY - 3;
      rect(g, 13, B - 10, 20, 10, "W"); for (let x = 13; x < 33; x += 2) put(g, x, B - 11, "W");
      [[8, 14], [31, 37]].forEach(([a, b], i) => { rect(g, a, B - 15, 7, 15, "W"); rect(g, b, B - 15, 1, 15, "w"); cone(g, a + 4, B - 16, 5, i ? "R" : "P", i ? "r" : "p", i ? "H" : "F"); rect(g, a + 2, B - 12, 3, 4, "F"); rect(g, a + 3, B - 11, 1, 3, "G"); });
      rect(g, 18, B - 19, 10, 19, "W"); rect(g, 27, B - 19, 1, 19, "w"); row(g, 17, 28, B - 19, "W"); cone(g, CX, B - 20, 6, "y", "Y", "F");
      rect(g, 21, B - 17, 4, 5, "F"); rect(g, 22, B - 16, 2, 4, "G");
      rect(g, 20, B - 7, 6, 7, "R"); rect(g, 21, B - 6, 4, 6, "D"); put(g, 20, B - 7, "W"); put(g, 25, B - 7, "W");
      row(g, 13, 32, B - 1, "P"); row(g, 13, 32, B, "y");
      return { l: 8, r: 37, eave: B - 10, top: [CX, B - 27], dx: 21, wins: [[14, B - 8], [28, B - 8]], chim: null, cloud: true };
    } },
  ];
  // ---------- 꾸밈 (한 단계에 하나씩) ----------
  // [이름(앞에 붙는 말), 그리기(g, A)] : 그릴 자리가 없으면 false 를 돌려줘요
  const yard = (A) => (A.cloud ? GY - 3 : GY);
  const FEATS = {
    weed: ["풀 뽑은", () => true],
    sign: ["팻말 세운", (g) => { rect(g, 19, GY - 7, 8, 4, "n"); rect(g, 19, GY - 7, 8, 3, "T"); dots(g, [[21, GY - 6], [22, GY - 6], [24, GY - 6]], "k"); rect(g, 22, GY - 3, 2, 3, "K"); return true; }],
    fire: ["모닥불 피운", (g, A) => { const x = A.wins.length ? A.r + 4 : 30, y = yard(A); row(g, x - 1, x + 3, y - 1, "K"); put(g, x, y - 2, "N"); put(g, x + 1, y - 2, "y"); put(g, x + 2, y - 2, "N"); put(g, x + 1, y - 3, "N"); put(g, x + 1, y - 4, "y"); return true; }],
    mat: ["돗자리 깐", (g, A) => { const y = yard(A); for (let x = 9; x < 16; x++) put(g, x, y, x % 2 ? "P" : "F"); for (let x = 10; x < 15; x++) put(g, x, y - 1, x % 2 ? "F" : "P"); return true; }],
    flag: ["깃발 꽂은", (g, A) => { if (!A.top) return false; const [x, y] = A.top; rect(g, x, y - 5, 1, 5, "K"); rect(g, x + 1, y - 5, 3, 2, "P"); put(g, x + 1, y - 3, "P"); return true; }],
    win0: ["창문 낸", (g, A) => { if (!A.wins[0]) return false; win(g, A.wins[0][0], A.wins[0][1]); return true; }],
    win1: ["창문이 둘인", (g, A) => { if (!A.wins[1]) return false; win(g, A.wins[1][0], A.wins[1][1]); if (A.wins[2]) { win(g, A.wins[2][0], A.wins[2][1]); win(g, A.wins[3][0], A.wins[3][1]); } return true; }],
    path: ["디딤돌 놓은", (g, A) => { const y = yard(A); row(g, A.dx, A.dx + 3, y, "S"); put(g, A.dx + 1, y + 1, "S"); put(g, A.dx + 2, y + 1, "s"); return true; }],
    pot: ["화분 놓은", (g, A) => { const x = A.dx - 3, y = yard(A); rect(g, x, y - 2, 2, 2, "N"); put(g, x, y - 3, "L"); put(g, x + 1, y - 3, "L"); put(g, x, y - 4, "P"); put(g, x + 1, y - 4, "l"); return true; }],
    chimney: ["굴뚝 올린", (g, A) => { if (!A.chim) return false; const [x, y] = A.chim; rect(g, x, y, 3, 5, "S"); rect(g, x - 1, y, 5, 1, "s"); return true; }],
    box: ["창가에 꽃 핀", (g, A) => { if (!A.wins[0]) return false; A.wins.slice(0, 2).forEach(([x, y], i) => { if (i && g[y][x] !== "F") return; row(g, x, x + 3, y + 4, "K"); dots(g, [[x, y + 3], [x + 2, y + 3]], "P"); dots(g, [[x + 1, y + 3], [x + 3, y + 3]], "y"); }); return true; }],
    fenceL: ["울타리 친", (g, A) => { const y = yard(A), b = A.l - 2, a = Math.max(1, b - 8); row(g, a, b, y - 2, "F"); for (let x = a; x <= b; x += 2) rect(g, x, y - 3, 1, 3, "F"); return true; }],
    fenceR: ["울타리 두른", (g, A) => { const y = yard(A), a = A.r + 2, b = Math.min(GW - 2, a + 8); row(g, a, b, y - 2, "F"); for (let x = a; x <= b; x += 2) rect(g, x, y - 3, 1, 3, "F"); return true; }],
    bush: ["덤불 심은", (g, A) => { const y = yard(A), x = Math.max(1, A.l - 7); row(g, x + 1, x + 3, y - 3, "L"); row(g, x, x + 4, y - 2, "L"); row(g, x, x + 4, y - 1, "l"); put(g, x + 1, y - 3, "M"); return true; }],
    flowerbed: ["꽃밭 가꾼", (g, A) => { const y = yard(A), x0 = Math.min(GW - 9, A.r + 2); ["P", "y", "V", "P", "y", "V", "P"].forEach((c, i) => { put(g, x0 + i, y - 1 - (i % 2), c); if (i % 2) put(g, x0 + i, y - 1, "l"); }); return true; }],
    heart: ["지붕에 하트 단", (g, A) => { if (!A.top) return false; const [x, y] = A.top; dots(g, [[x - 2, y - 3], [x + 1, y - 3], [x - 2, y - 2], [x - 1, y - 2], [x, y - 2], [x + 1, y - 2], [x - 1, y - 1], [x, y - 1]], "P"); put(g, x - 2, y - 3, "F"); return true; }],
    tree: ["나무 심은", (g, A) => { const y = yard(A), x = 1; rect(g, x + 3, y - 6, 2, 6, "K"); [[x + 2, x + 5, y - 12], [x + 1, x + 6, y - 11], [x, x + 7, y - 10], [x, x + 7, y - 9], [x, x + 7, y - 8], [x + 1, x + 6, y - 7]].forEach(([a, b, yy]) => row(g, a, b, yy, yy > y - 9 ? "l" : "L")); dots(g, [[x + 2, y - 11], [x + 3, y - 11], [x + 1, y - 10]], "M"); A.tree = [x, y - 12]; return true; }],
    lamp: ["가로등 세운", (g, A) => { const y = yard(A), x = Math.min(GW - 3, A.r + 9); rect(g, x, y - 7, 1, 7, "K"); rect(g, x - 1, y - 9, 3, 2, "y"); row(g, x - 1, x + 1, y - 10, "K"); A.lamp = [x, y - 10]; return true; }],
    bench: ["벤치 놓은", (g, A) => { const y = yard(A), x = Math.max(9, A.l - 1) ; const bx = A.dx + 6 <= A.r - 5 ? A.dx + 6 : x; row(g, bx, bx + 4, y - 2, "K"); row(g, bx, bx + 4, y - 4, "K"); put(g, bx, y - 1, "k"); put(g, bx + 4, y - 1, "k"); put(g, bx, y - 3, "k"); put(g, bx + 4, y - 3, "k"); return true; }],
    garland: ["가랜드 건", (g, A) => { const y = A.eave + 1, cs = ["P", "y", "M", "A", "V"]; for (let i = 0, x = A.l + 1; x < A.r; x += 2, i++) { put(g, x, y + (i % 2), cs[i % 5]); put(g, x + 1, y, "F"); } return true; }],
    birdhouse: ["새집 단", (g, A) => { const y = yard(A), x = Math.max(9, A.l - 11) + 0; const px = A.tree ? 10 : x; rect(g, px, y - 8, 1, 8, "K"); rect(g, px - 1, y - 11, 3, 3, "F"); put(g, px, y - 10, "k"); row(g, px - 2, px + 2, y - 12, "A"); put(g, px, y - 13, "A"); return true; }],
    apples: ["사과 열린", (g, A) => { if (!A.tree) return false; const [x, y] = A.tree; dots(g, [[x + 2, y + 2], [x + 5, y + 3], [x + 1, y + 4], [x + 6, y + 1], [x + 4, y + 5]], "N"); return true; }],
    vane: ["풍향계 단", (g, A) => { if (!A.top) return false; const [x, y] = A.top; const yy = y - 4; rect(g, x + 3, yy - 3, 1, 4, "K"); row(g, x + 1, x + 5, yy - 3, "Y"); put(g, x + 5, yy - 4, "Y"); put(g, x + 5, yy - 2, "Y"); return true; }],
    sparkle: ["반짝반짝", (g, A) => { const t = A.top || [CX, GY - 14]; [[t[0] - 9, t[1] + 1], [t[0] + 9, t[1] - 1], [A.l - 3, A.eave - 3], [A.r + 3, A.eave - 5], [t[0] + 5, t[1] - 6]].forEach(([x, y]) => { put(g, x, y, "Y"); put(g, x - 1, y, "y"); put(g, x + 1, y, "y"); put(g, x, y - 1, "y"); put(g, x, y + 1, "y"); }); return true; }],
  };
  // ---------- 집의 모습 ----------
  // spec: { tier, feats: [...], roof: 색 번호(-1 은 원래 색), build: 공사 중 }
  const ROOFS = [["분홍", "#ff9ab4", "#e2708e", "#ffc4d4"], ["하늘색", "#8fc4f6", "#64a0dc", "#bfe0ff"], ["민트색", "#7fd6c0", "#56b29c", "#b4ecdc"], ["노란색", "#ffd36a", "#e8b040", "#ffe8a0"], ["보라색", "#b79cf0", "#9478d8", "#d8c6ff"], ["주황색", "#ffa860", "#e88838", "#ffcc98"], ["빨간색", "#ff7a7a", "#e0525e", "#ffa8a0"], ["풀색", "#9fd67a", "#74b458", "#c6eea6"]];
  const BASE = { o: "#7a5a48", G: "#a8d8f0", F: "#ffffff", D: "#b07a4e", d: "#8a5a36", Y: "#ffc83a", y: "#ffe27a", K: "#9a6a44", k: "#74502e", L: "#8fd67a", l: "#62b45e", M: "#b6ea96", P: "#ff8fb0", p: "#e2708e", V: "#b79cf0", A: "#7cc6f6", N: "#ff7a6a", n: "#c8a878", T: "#f0dcb0", E: "#e0c090", e: "#c4a070", S: "#cfd2dc", s: "#a8acba", C: "#ffffff", c: "#d8e8f8", W: "#fbeed2", R: "#ff7a7a" };
  function outline(g) {
    const h = g.length, w = g[0].length, add = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (g[y][x] !== ".") continue;
      if ([[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(([a, b]) => g[b] && g[b][a] && g[b][a] !== "." && g[b][a] !== "o")) add.push([x, y]);
    }
    add.forEach(([x, y]) => { g[y][x] = "o"; });
    let x0 = w, x1 = 0, y0 = h, y1 = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g[y][x] !== ".") { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return g.slice(y0, y1 + 1).map((r) => r.slice(x0, x1 + 1).join(""));
  }
  const hcache = {};
  function houseImg(spec) {
    const key = [spec.tier, (spec.feats || []).join("+"), spec.roof == null ? -1 : spec.roof, spec.build ? 1 : 0].join("|");
    if (hcache[key]) return hcache[key];
    if (!window.GArt) return null;
    const T = TIERS[spec.tier];
    const g = grid();
    const A = T.draw(g, (spec.feats || []).indexOf("weed") >= 0 ? 1 : 0);
    (spec.feats || []).forEach((k) => { if (FEATS[k][1](g, A) === false && ALT[k]) FEATS[ALT[k]][1](g, A); });
    let smoke = null;
    if (A.chim && (spec.feats || []).indexOf("chimney") >= 0) smoke = [A.chim[0] + 1, A.chim[1]];
    if (spec.build) {
      // 공사 중: 사다리, 발판, 벽돌 더미
      const y = A.cloud ? GY - 3 : GY, x = Math.min(GW - 4, A.r + 2), top = Math.max(2, A.eave - 4);
      for (let yy = top; yy < y; yy++) { put(g, x, yy, "K"); put(g, x + 2, yy, "K"); if ((y - yy) % 2 === 0) put(g, x + 1, yy, "k"); }
      row(g, Math.max(0, A.l - 2), A.r + 1, A.eave + 2, "K"); rect(g, Math.max(0, A.l - 2), A.eave + 3, 1, y - A.eave - 3, "k");
      const bx = Math.max(1, A.l - 8); rect(g, bx, y - 2, 5, 2, "N"); rect(g, bx + 1, y - 4, 3, 2, "N"); dots(g, [[bx + 2, y - 1], [bx + 1, y - 3], [bx + 3, y - 2]], "p");
    }
    const pal = Object.assign({}, BASE, T.c || {});
    if (spec.roof != null && spec.roof >= 0) { const r = ROOFS[spec.roof % ROOFS.length]; pal.R = r[1]; pal.r = r[2]; pal.H = r[3]; }
    // 문 자리(도트 칸)도 같이 돌려줘요: 길을 놓을 때 써요
    let x0 = GW;
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (g[y][x] !== "." && x < x0) x0 = x;
    let y0 = GH;
    for (let y = 0; y < GH; y++) if (g[y].some((c) => c !== ".") && y < y0) y0 = y;
    const rows = outline(g);
    const day = GArt.fromRows("house|" + key, rows, pal);
    const nite = GArt.fromRows("houseN|" + key, rows, Object.assign({}, pal, { G: "#ffe08f" }));
    hcache[key] = { day: day.uri, nite: nite.uri, w: day.w, h: day.h, smoke: smoke ? [smoke[0] - x0 + 1, smoke[1] - y0 + 1] : null };
    return hcache[key];
  }
  const ALT = { chimney: "flag", win0: "mat", win1: "fire", box: "mat", heart: "flag", vane: "flag" };

  // ---------- 작은 그림들 (나무 새싹, 횃불, 연잎 …) ----------
  const ART = {
    grass: ["..L...L..", ".LlL.LlL.", "LLlLLLlLL"],
    sprout: ["..L.L.", "..LLL.", "...l..", "...l..", ".EEEEE"],
    sapling: ["...LL...", "..LLLL..", ".LLMLLL.", ".LLLLLl.", "..lLLl..", "...KK...", "...K....", "...K....", "..EKEE.."],
    birdhouse: ["..A..", ".AAA.", "AAAAA", ".FFF.", ".FkF.", ".FFF."],
    swing: ["K....K", "K....K", "K....K", "K....K", "K....K", "PPPPPP"],
    treehouse: ["...NNNN...", "..NNNNNN..", ".NNNNNNNN.", "..TTTTTT..", "..TGGTDT..", "..TGGTDT..", ".KKKKKKKK.", "......K.K.", "......KKK.", "......K.K.", "......KKK."],
    apples: ["..N.....", "......N.", ".N...N..", "....N..."],
    lights: ["y...P...A.", ".k.k.k.k.k", "..M...y..."],
    torch: [".N.", "NyN", ".y.", "KKK", ".K.", ".K.", ".K.", ".K."],
    lily: [".LLL...LL.", "LLlLL.LLlL", ".LLL...LL."],
    lotus: [".P.P.", "PPyPP", ".PPP."],
    duck: ["..yy...", ".yyky..", ".yyyNN.", "yyyyy..", "yyyyyy.", ".yyyy.."],
    balloon: ["...NNNN...", "..NNyyNN..", ".NNyyyyNN.", ".NyyNNyyN.", ".NyyNNyyN.", ".NNyyyyNN.", "..NNyyNN..", "...NyyN...", "....kk....", "...k..k...", "...KKKK...", "...KKKK..."],
    stones: ["SS....ss..", "sS..SS....", "....sS..SS", "........sS"],
    flowerpath: ["SSP...ssy.", "sS..SSV...", ".P..sS..SS", "....y...sS"],
    stake: ["K....K....K", "K....K....K", "K....K....K"],
    vine: ["P...y...V...", "lL.Ll.lL.Ll."],
    flower: [".P.", "PyP", ".P.", ".l.", "ll."],
  };
  const acache = {};
  function art(name, noOutline) {
    const k = name + (noOutline ? "|n" : "");
    if (acache[k]) return acache[k];
    if (!window.GArt) return null;
    let rows = ART[name];
    if (name === "rainbow") {
      rows = [];
      for (let y = 0; y < 11; y++) { let r = ""; for (let x = 0; x < 22; x++) { const d = Math.hypot(x + 0.5 - 11, y + 0.5 - 11); r += d >= 10 && d < 11 ? "N" : d >= 9 && d < 10 ? "y" : d >= 8 && d < 9 ? "L" : d >= 7 && d < 8 ? "A" : d >= 6 && d < 7 ? "V" : "."; } rows.push(r); }
      noOutline = true;
    }
    if (!rows && window.PIXEL && PIXEL.rows(name)) { const p = PIXEL.rows(name); acache[k] = GArt.fromRows("tw|" + k, p.rows, p.colors); return acache[k]; }
    if (!rows) return null;
    const w = Math.max.apply(null, rows.map((r) => r.length));
    let g = rows.map((r) => r.padEnd(w, "."));
    if (!noOutline) { const gg = g.map((r) => ("." + r + ".").split("")); gg.unshift(new Array(w + 2).fill(".")); gg.push(new Array(w + 2).fill(".")); g = outline(gg); }
    acache[k] = GArt.fromRows("tw|" + k, g, BASE);
    return acache[k];
  }

  // ---------- 단계 목록 ----------
  // 집 단계
  const HS = [];
  const H = (tier, feats, name, msg, more) => HS.push(Object.assign({ kind: "house", spec: { tier, feats, roof: -1, build: false }, name, msg }, more || {}));
  H(0, ["weed", "sign"], "집터 팻말", "집터에 팻말을 세웠어요");
  H(0, ["weed", "sign", "fire"], "모닥불", "빈터에 모닥불을 피웠어요");
  H(1, [], "텐트", "빈터에 텐트를 쳤어요", { first: true });
  H(1, ["mat", "fire"], "돗자리 깐 텐트", "텐트 앞에 돗자리를 깔고 모닥불을 피웠어요");
  H(1, ["mat", "fire", "flag", "pot"], "깃발 꽂은 텐트", "텐트에 깃발을 꽂고 화분을 놓았어요");
  H(2, [], "움집", "짚을 엮어 움집을 지었어요", { first: true });
  H(2, ["mat", "path", "pot"], "살림 차린 움집", "움집 앞에 디딤돌과 화분을 놓았어요");
  H(2, ["mat", "path", "pot", "bush", "flowerbed"], "꽃 심은 움집", "움집 둘레에 덤불과 꽃을 심었어요");
  HS.push({ kind: "house", spec: { tier: 2, feats: ["mat", "path", "pot", "bush", "flowerbed"], roof: -1, build: true }, name: "공사 중인 움집", msg: "새 집을 지으려고 공사를 시작했어요" });
  const BA = ["win0", "win1", "chimney", "path"], BB = ["pot", "box", "bush", "flowerbed"], BC = ["heart", "garland", "vane"];
  const josa = (w, a, b) => { const c = w.charCodeAt(w.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0 ? a : b; };
  for (let t = 3; t < TIERS.length; t++) {
    const n = TIERS[t].name, r1 = (t * 3 + 1) % ROOFS.length, r2 = (t * 5 + 4) % ROOFS.length;
    const sp = (feats, roof, build) => ({ tier: t, feats, roof, build: !!build });
    HS.push({ kind: "house", spec: sp([], -1), name: n, msg: `우리 집이 ${n}${josa(n, "이", "가")} 됐어요`, first: true });
    HS.push({ kind: "house", spec: sp(BA, -1), name: `살림 들인 ${n}`, msg: "창문을 내고 굴뚝을 올렸어요" });
    HS.push({ kind: "house", spec: sp(BA, r1), name: `${ROOFS[r1][0]} 지붕 ${n}`, msg: `지붕을 ${ROOFS[r1][0]}으로 새로 칠했어요` });
    HS.push({ kind: "house", spec: sp(BA.concat(BB), r1), name: `마당 가꾼 ${n}`, msg: "화분과 꽃밭으로 마당을 가꿨어요" });
    HS.push({ kind: "house", spec: sp(BA.concat(BB), r2), name: `${ROOFS[r2][0]} 지붕 ${n}`, msg: `지붕을 ${ROOFS[r2][0]}으로 새로 칠했어요` });
    HS.push({ kind: "house", spec: sp(BA.concat(BB, BC), r2), name: `한껏 꾸민 ${n}`, msg: "지붕에 하트와 가랜드를 달았어요" });
    if (t < TIERS.length - 1) HS.push({ kind: "house", spec: sp(BA.concat(BB, BC), r2, true), name: `공사 중인 ${n}`, msg: "더 좋은 집을 지으려고 공사를 시작했어요" });
  }
  // 동네 단계 (자리마다 차례가 있어요)
  const SC = {
    land: [[1, "돋아난 풀", "황무지에 풀이 돋아났어요", "grass"], [2, "풀밭", "황무지가 푸른 풀밭이 됐어요", "grass"]],
    t1: [[1, "나무 새싹", "나무 새싹이 올라왔어요", "sprout"], [2, "어린 나무", "새싹이 어린 나무로 자랐어요", "sapling"], [3, "작은 나무", "어린 나무가 제법 나무다워졌어요", "tree"], [4, "큰 나무", "나무가 크게 자랐어요", "tree"], [5, "새집 단 나무", "나무에 새집을 달았어요", "birdhouse"], [6, "그네 단 나무", "나무에 그네를 달았어요", "swing"], [7, "나무 위 오두막", "나무 위에 오두막을 지었어요", "treehouse"]],
    t2: [[1, "둘째 새싹", "오른쪽에도 새싹이 올라왔어요", "sprout"], [2, "둘째 어린 나무", "오른쪽 새싹이 어린 나무가 됐어요", "sapling"], [3, "둘째 나무", "오른쪽 나무가 다 자랐어요", "tree"], [4, "사과나무", "오른쪽 나무에 사과가 열렸어요", "apples"], [5, "꼬마전구 나무", "나무에 꼬마전구를 둘렀어요", "lights"]],
    fl: [[1, "첫 꽃", "첫 꽃이 피었어요", "flower"], [2, "꽃 두 송이", "꽃이 한 송이 더 피었어요", "flower"]],
    fence: [[1, "울타리 말뚝", "울타리 말뚝을 박았어요", "stake"], [2, "나무 울타리", "울타리를 다 둘렀어요", "fence"], [3, "흰 울타리", "울타리를 하얗게 칠했어요", "fence"], [4, "꽃 넝쿨 울타리", "울타리에 꽃 넝쿨이 올라왔어요", "vine"]],
    lamp: [[1, "횃불", "길가에 횃불을 세웠어요", "torch"], [2, "가로등", "횃불 자리에 가로등이 생겼어요", "lamp"]],
    pond: [[1, "연잎", "연못에 연잎이 떴어요", "lily"], [2, "연꽃", "연못에 연꽃이 피었어요", "lotus"], [3, "오리 인형", "연못에 오리 인형을 띄웠어요", "duck"]],
    path: [[1, "디딤돌 길", "집 앞에 디딤돌 길을 놓았어요", "stones"], [2, "꽃길", "디딤돌 길에 꽃이 피었어요", "flowerpath"]],
    sky: [[1, "열기구", "하늘에 열기구가 떠다녀요", "balloon"], [2, "무지개", "언덕 너머에 무지개가 걸렸어요", "rainbow"]],
  };
  const QS = {};
  Object.keys(SC).forEach((k) => { QS[k] = SC[k].map(([v, name, msg, icon]) => ({ kind: "town", spot: k, v, name, msg, icon })); });
  // 차례: 앞부분은 하나하나 정하고, 뒤는 집 사이사이에 동네 것이 돌아가며 끼어요
  const LEVELS = [{ kind: "start", name: "황무지", msg: "", need: 0, tier: 0, spec: { tier: 0, feats: [], roof: -1, build: false } }];
  const take = (k) => { const x = k === "H" ? HS.shift() : QS[k].shift(); if (x) LEVELS.push(x); return !!x; };
  ["land", "H", "t1", "H", "H", "fl", "land", "H", "fence", "t1", "H", "lamp", "H", "fence", "t2", "H", "H", "H", "pond", "t1", "H", "fl", "path", "H", "t2", "lamp", "H", "H", "t1", "sky", "H", "pond", "H", "fence", "H"].forEach(take);
  const ROT = ["t2", "t1", "pond", "path", "fence", "sky", "t1", "t2", "t1"], PAT = ["H", "H", "S", "H", "H", "H", "S", "H", "S", "H", "H"];
  for (let i = 0, r = 0, guard = 0; (HS.length || ROT.some((k) => QS[k].length)) && guard < 2000; i++, guard++) {
    if (PAT[i % PAT.length] === "H") { if (!take("H")) { for (let j = 0; j < ROT.length; j++) if (take(ROT[(r + j) % ROT.length])) { r += j + 1; break; } } }
    else { let ok = false; for (let j = 0; j < ROT.length && !ok; j++) if (take(ROT[(r + j) % ROT.length])) { r += j + 1; ok = true; } if (!ok) take("H"); }
  }
  // 필요한 횟수, 그리고 그때의 집 모습과 동네 모습
  (function () {
    let spec = LEVELS[0].spec; const st = { land: 0, t1: 0, t2: 0, fl: 0, fence: 0, lamp: 0, pond: 0, path: 0, sky: 0 };
    LEVELS.forEach((L, i) => {
      L.need = Math.round(3.6 * i + 0.155 * i * i);
      if (L.kind === "house") spec = L.spec; else if (L.kind === "town") st[L.spot] = L.v;
      L.spec = spec; L.tier = spec.tier; L.first = !!L.first; L.st = Object.assign({}, st);
    });
  })();
  const levelOf = (n) => { let l = 0; for (let i = 0; i < LEVELS.length; i++) { if (n >= LEVELS[i].need) l = i; else break; } return l; };
  // 그 단계의 집 그림 (축하 화면용), 그 단계에서 생긴 것의 작은 그림 (목록용)
  const img = (level) => houseImg(LEVELS[Math.max(0, Math.min(LEVELS.length - 1, level | 0))].spec);
  function icon(level) {
    const L = LEVELS[Math.max(0, Math.min(LEVELS.length - 1, level | 0))];
    if (L.kind !== "town") { const r = houseImg(L.spec); return r ? { uri: r.day, w: r.w, h: r.h } : null; }
    return art(L.icon);
  }

  // ---------- 그림 속에 놓기 ----------
  const SCALE = 2, SEEN = "hsd.town.seen";
  const $ = (id) => document.getElementById(id);
  let layer = null;
  function ensureLayer(scene) {
    if (layer && layer.isConnected) return layer;
    layer = document.createElement("div");
    layer.className = "sc-town";
    const ground = scene.querySelector(".sc-ground");
    scene.insertBefore(layer, ground ? ground.nextSibling : null);
    return layer;
  }
  // 작은 그림 하나를 (없으면 만들어) 보이거나 숨겨요
  function piece(parent, cls, name, show, noOutline) {
    let el = parent.querySelector("." + cls);
    if (!show) { if (el) el.remove(); return null; }
    const a = art(name, noOutline);
    if (!a) return null;
    if (!el) { el = document.createElement("i"); el.className = "tw " + cls; parent.appendChild(el); }
    if (el.dataset.a !== name) { el.dataset.a = name; el.innerHTML = `<img class="px" alt="" src="${a.uri}" width="${a.w * SCALE}" height="${a.h * SCALE}" draggable="false">`; el.style.width = a.w * SCALE + "px"; el.style.height = a.h * SCALE + "px"; }
    return el;
  }
  // 다른 것(나무) 위에 얹기: 그 자리의 가운데 위를 기준으로
  function over(el, target, scene, dx, dy) {
    if (!el || !target) return;
    const r = target.getBoundingClientRect(), s = scene.getBoundingClientRect();
    if (!r.width) return;
    el.style.left = Math.round(r.left - s.left + r.width / 2 - el.offsetWidth / 2 + dx) + "px";
    el.style.bottom = Math.round(s.bottom - r.top + dy) + "px";
  }
  let shown = -1;
  function apply() {
    const scene = $("scene"), home = $("home");
    if (!scene || !home || !window.Deco || !Deco.homeLevel) return;
    const lv = Deco.homeLevel(), L = LEVELS[lv], st = L.st;
    const lay = ensureLayer(scene);
    // 땅, 울타리
    scene.dataset.land = String(st.land); scene.dataset.fence = String(st.fence);
    // 나무: 새싹 → 어린 나무 → 작은 나무 → 큰 나무, 그 위에 새집·그네·오두막
    const t1 = scene.querySelector(".sc-tree.t1"), t2 = scene.querySelector(".sc-tree.t2");
    if (t1) { t1.classList.toggle("tw-off", st.t1 < 3); t1.classList.toggle("tw-small", st.t1 === 3); }
    if (t2) { t2.classList.toggle("tw-off", st.t2 < 3); }
    piece(lay, "tw-t1", st.t1 === 1 ? "sprout" : "sapling", st.t1 === 1 || st.t1 === 2);
    piece(lay, "tw-t2", st.t2 === 1 ? "sprout" : "sapling", st.t2 === 1 || st.t2 === 2);
    over(piece(lay, "tw-bird", "birdhouse", st.t1 === 5), t1, scene, 14, -22);
    over(piece(lay, "tw-swing", "swing", st.t1 === 6), t1, scene, 0, -44);
    over(piece(lay, "tw-thouse", "treehouse", st.t1 >= 7), t1, scene, 0, -26);
    over(piece(lay, "tw-apples", "apples", st.t2 >= 4, true), t2, scene, 0, -14);
    over(piece(lay, "tw-lights", "lights", st.t2 >= 5, true), t2, scene, 0, -16);
    // 꽃, 가로등
    const fs = scene.querySelectorAll(".sc-flower");
    fs.forEach((f, i) => f.classList.toggle("tw-off", i >= st.fl));
    const lamp = scene.querySelector(".sc-lamp"), glow = scene.querySelector(".sc-glow");
    if (lamp) lamp.classList.toggle("tw-off", st.lamp < 2);
    if (glow) glow.classList.toggle("tw-off", st.lamp < 2);
    piece(lay, "tw-torch", "torch", st.lamp === 1);
    if (st.fence >= 4 && !scene.style.getPropertyValue("--vine")) { const v = art("vine", true); if (v) scene.style.setProperty("--vine", `url(${v.uri})`); }
    scene.classList.toggle("tw-vines", st.fence >= 4);
    // 길, 하늘
    piece(lay, "tw-path", st.path >= 2 ? "flowerpath" : "stones", st.path >= 1, true);
    piece(lay, "tw-balloon", "balloon", st.sky >= 1);
    piece(lay, "tw-rainbow", "rainbow", st.sky >= 2, true);
    // 연못 위
    const pond = scene.querySelector(".pal-pond");
    if (pond) { piece(pond, "tw-lily", "lily", st.pond >= 1, true); piece(pond, "tw-lotus", "lotus", st.pond >= 2); piece(pond, "tw-duck", "duck", st.pond >= 3); }
    // 집
    const r = houseImg(L.spec);
    if (r && home.dataset.k !== r.day) {
      home.dataset.k = r.day; home.dataset.lv = String(lv);
      const w = r.w * SCALE, h = r.h * SCALE;
      home.style.width = w + "px"; home.style.height = h + "px"; home.style.marginLeft = -Math.round(w / 2) + "px";
      home.innerHTML = `<img class="px day" alt="" src="${r.day}" width="${w}" height="${h}" draggable="false"><img class="px nite" alt="" src="${r.nite}" width="${w}" height="${h}" draggable="false">` +
        (r.smoke ? `<i class="tw-smoke" style="left:${r.smoke[0] * SCALE}px;top:${r.smoke[1] * SCALE - 22}px"><b></b><b></b><b></b></i>` : "");
    }
    home.dataset.lv = String(lv);
    home.setAttribute("aria-label", "우리 집: " + L.name);
    announce(lv, scene);
    shown = lv;
  }
  // ---------- 새로 생긴 것 알리기: 그 자리가 통통 튀고, 말풍선이 떠요 ----------
  const queue = [];
  let busy = false;
  function targetOf(L, scene) {
    if (L.kind === "house") return $("home");
    const q = { land: ".sc-ground", fl: ".sc-flower:not(.tw-off)", fence: ".sc-fence", path: ".tw-path", pond: ".pal-pond" }[L.spot];
    if (L.spot === "t1") return scene.querySelector(L.v <= 2 ? ".tw-t1" : ".sc-tree.t1");
    if (L.spot === "t2") return scene.querySelector(L.v <= 2 ? ".tw-t2" : ".sc-tree.t2");
    if (L.spot === "lamp") return scene.querySelector(L.v === 1 ? ".tw-torch" : ".sc-lamp");
    if (L.spot === "sky") return scene.querySelector(L.v === 1 ? ".tw-balloon" : ".tw-rainbow");
    if (L.spot === "fl") { const a = scene.querySelectorAll(q); return a[a.length - 1] || null; }
    return scene.querySelector(q);
  }
  function announce(lv, scene) {
    let seen = null;
    try { seen = localStorage.getItem(SEEN); } catch (e) { /* 그냥 둬요 */ }
    try { localStorage.setItem(SEEN, String(lv)); } catch (e) { /* 그냥 둬요 */ }
    if (seen === null || lv <= Number(seen)) return;
    const from = Math.max(Number(seen) + 1, lv - 3); // 한꺼번에 많이 바뀌었으면 마지막 넷만
    for (let i = from; i <= lv; i++) queue.push(i);
    pump(scene);
  }
  function pump(scene) {
    if (busy || !queue.length) return;
    // 선물 화면이 떠 있으면 닫힌 뒤에
    if ((window.Deco && Deco.celebrating && Deco.celebrating()) || (window.Notes && Notes.busy && Notes.busy() > 0)) { setTimeout(() => pump(scene), 800); return; }
    busy = true;
    const i = queue.shift(), L = LEVELS[i];
    const done = () => { busy = false; setTimeout(() => pump(scene), 500); };
    if (L.first) { done(); return; } // 집 종류가 바뀔 때는 큰 축하가 따로 나와요
    const t = targetOf(L, scene);
    const s = scene.getBoundingClientRect(), r = t && t.getBoundingClientRect().width ? t.getBoundingClientRect() : null;
    const cx = r ? (L.spot === "land" || L.spot === "fence" ? s.left + s.width * 0.5 : r.left + r.width / 2) : s.left + s.width / 2;
    const cy = r ? r.top : s.top + s.height * 0.6;
    if (t && L.spot !== "land" && L.spot !== "fence") { t.classList.remove("tw-new"); void t.offsetWidth; t.classList.add("tw-new"); setTimeout(() => t.classList.remove("tw-new"), 1200); }
    if (L.spot === "land" || L.spot === "fence") { scene.classList.remove("tw-wave"); void scene.offsetWidth; scene.classList.add("tw-wave"); setTimeout(() => scene.classList.remove("tw-wave"), 1600); }
    if (window.FX && FX.cutePop) FX.cutePop(cx, r ? r.top + r.height / 2 : cy, 0.55);
    const b = document.createElement("div");
    b.className = "tw-call";
    b.innerHTML = `<em>새로 생겼어요</em><span>${L.msg}</span>`;
    scene.querySelectorAll(".tw-call").forEach((x) => x.remove());
    scene.appendChild(b);
    const bw = b.offsetWidth, x = Math.max(6, Math.min(s.width - bw - 6, cx - s.left - bw / 2));
    b.style.left = x + "px";
    b.style.top = Math.max(4, cy - s.top - b.offsetHeight - 10) + "px";
    b.style.setProperty("--ax", Math.max(10, Math.min(bw - 10, cx - s.left - x)) + "px");
    setTimeout(() => { b.classList.add("out"); setTimeout(() => { b.remove(); done(); }, 320); }, 3600);
  }
  // 빨랫줄 (누르면 옷장)
  let lineUri = "";
  function lineImg() {
    if (lineUri || !window.GArt) return lineUri;
    const rows = ["K....................K", "Kk..................kK", "K.kkkk..........kkkk.K", "K.FPPPF.kkkkkkkk.F.F.K", "K.PPPPP..F..F.F..yy..K", "K..PPP...AAAAA...yy..K", "K..PWP...AAAAA...yyy.K", "K..PPP...AA.AA.......K", "K........AA.AA.......K", "K....................K", "K....................K"];
    const gg = rows.map((r) => ("." + r + ".").split("")); gg.unshift(new Array(24).fill(".")); gg.push(new Array(24).fill("."));
    lineUri = GArt.fromRows("clothesline", outline(gg), Object.assign({}, BASE, { W: "#ffffff" })).uri;
    return lineUri;
  }
  function applyLine() { const el = $("closet"); if (el && !el.firstChild && lineImg()) el.innerHTML = `<img class="px" alt="" src="${lineUri}" width="48" height="26" draggable="false">`; }
  let t = 0;
  const soon = () => { clearTimeout(t); t = setTimeout(() => { apply(); applyLine(); }, 150); };
  if (window.Store) Store.onChange(soon);
  document.addEventListener("DOMContentLoaded", soon);
  window.addEventListener("resize", soon);
  window.Home = { LEVELS, TIERS, levelOf, img, icon, apply, soon, name: (l) => (LEVELS[l] || LEVELS[0]).name, next: (l) => LEVELS[l + 1] || null };
})();
