// ============================================================
// 도트 그래픽 모음
// 글자 하나가 점 하나예요. '.' 은 빈칸.
// ============================================================
(function () {
  "use strict";

  // 단색 아이콘 (글자색을 따라가요)
  const ICONS = {
    date: [
      ".XX..XX.",
      ".XX..XX.",
      "........",
      "XXXXXXXX",
      "XXX..XXX",
      "XXX..XXX",
      "XXX..XXX",
      "........",
    ],
    travel: [
      "..XXXX..",
      "..X..X..",
      "XXXXXXXX",
      "XXXXXXXX",
      "X.XXXX.X",
      "XXXXXXXX",
      "XXXXXXXX",
      ".X....X.",
    ],
    food: [
      ".X..X...",
      "..X..X..",
      "........",
      "XXXXXXXX",
      "XXXXXXXX",
      ".XXXXXX.",
      "..XXXX..",
      ".XXXXXX.",
    ],
    cafe: [
      ".X.X....",
      "..X.X...",
      "XXXXXX..",
      "XXXXXXXX",
      "XXXXXX.X",
      "XXXXXXXX",
      ".XXXX...",
      "XXXXXX..",
    ],
    anniv: [
      "...XX...",
      "...XX...",
      ".XXXXXX.",
      ".X.XX.X.",
      "XXXXXXXX",
      "X.X..X.X",
      "XXXXXXXX",
      "XXXXXXXX",
    ],
    etc: [
      "........",
      "...XX...",
      "..XXXX..",
      ".XXXXXX.",
      ".XXXXXX.",
      "..XXXX..",
      "...XX...",
      "........",
    ],
    pin: [
      "..XXXX..",
      ".XXXXXX.",
      ".XX..XX.",
      ".XX..XX.",
      ".XXXXXX.",
      "..XXXX..",
      "...XX...",
      "...XX...",
    ],
    calendar: [
      ".X....X.",
      "XXXXXXXX",
      "XXXXXXXX",
      "X......X",
      "X.X.X..X",
      "X......X",
      "X.X.X..X",
      "XXXXXXXX",
    ],
    flag: [
      ".X......",
      ".XXXXXX.",
      ".XXXXXX.",
      ".XXXXXX.",
      ".X......",
      ".X......",
      ".X......",
      "XXX.....",
    ],
    chart: [
      "......XX",
      "......XX",
      "...XX.XX",
      "...XX.XX",
      "XX.XX.XX",
      "XX.XX.XX",
      "XX.XX.XX",
      "XX.XX.XX",
    ],
    search: [
      ".XXXX...",
      "X....X..",
      "X....X..",
      "X....X..",
      ".XXXX...",
      "....XX..",
      ".....XX.",
      "......XX",
    ],
    down: [
      "XX...XX",
      ".XX.XX.",
      "..XXX..",
      "...X...",
    ],
    heart: [
      ".XX...XX.",
      "XXXX.XXXX",
      "XXXXXXXXX",
      "XXXXXXXXX",
      ".XXXXXXX.",
      "..XXXXX..",
      "...XXX...",
      "....X....",
    ],
    home: [
      "...XX...",
      "..XXXX..",
      ".XXXXXX.",
      "XXXXXXXX",
      ".XXXXXX.",
      ".XX..XX.",
      ".XX..XX.",
      ".XX..XX.",
    ],
    book: [
      "XXX..XXX",
      "X..XX..X",
      "X..XX..X",
      "X..XX..X",
      "X..XX..X",
      "XXXXXXXX",
      "...XX...",
      "........",
    ],
    todo: [
      "XXXXXXXX",
      "X......X",
      "X.....XX",
      "X.X..X.X",
      "X..XX..X",
      "X......X",
      "X......X",
      "XXXXXXXX",
    ],
    tick: [
      "......X",
      ".....XX",
      "X...XX.",
      "XX.XX..",
      ".XXX...",
      "..X....",
    ],
    gear: [
      "..X..X..",
      ".XXXXXX.",
      "XXX..XXX",
      ".X....X.",
      ".X....X.",
      "XXX..XXX",
      ".XXXXXX.",
      "..X..X..",
    ],
    camera: [
      "..XXX...",
      "XXXXXXXX",
      "XXX..XXX",
      "XX....XX",
      "XX....XX",
      "XXX..XXX",
      "XXXXXXXX",
    ],
    close: [
      "XX...XX",
      "XXX.XXX",
      ".XXXXX.",
      "..XXX..",
      ".XXXXX.",
      "XXX.XXX",
      "XX...XX",
    ],
    dice: [
      "XXXXXXXX",
      "X......X",
      "X.X..X.X",
      "X......X",
      "X......X",
      "X.X..X.X",
      "X......X",
      "XXXXXXXX",
    ],
    quest: [
      ".XXXXXX.",
      "XX....XX",
      "XX....XX",
      "....XXX.",
      "...XX...",
      "...XX...",
      "........",
      "...XX...",
    ],
    smile: [
      ".XXXXXX.",
      "X......X",
      "X.X..X.X",
      "X......X",
      "X.X..X.X",
      "X..XX..X",
      "X......X",
      ".XXXXXX.",
    ],
    drop: [
      "..X..",
      "..X..",
      ".XXX.",
      "XXXXX",
      "XXXXX",
      ".XXX.",
    ],
    spark: [
      ".X.",
      "XXX",
      ".X.",
    ],
    star: [
      "....X....",
      "...XXX...",
      "...XXX...",
      "XXXXXXXXX",
      ".XXXXXXX.",
      "..XXXXX..",
      ".XXXXXXX.",
      ".XXX.XXX.",
      "XX.....XX",
    ],
  };

  // 여러 색 그림 (캐릭터, 배경)
  const SPRITES = {
    him: {
      colors: { H: "#4a4038", S: "#f7d3b0", E: "#4a3a30", C: "#f4a58a", M: "#c9735f", B: "#7fb2e5", P: "#5c6f9c", K: "#4a3a30" },
      rows: [
        "...HHHHHH...",
        "..HHHHHHHH..",
        "..HHHHHHHH..",
        "..HSSSSSSH..",
        "..SSESSESS..",
        "..SCSSSSCS..",
        "...SSMMSS...",
        "..BBBBBBBB..",
        ".SBBBBBBBBS.",
        ".SBBBBBBBBS.",
        "..BBBBBBBB..",
        "..PPPPPPPP..",
        "..PPP..PPP..",
        "..KKK..KKK..",
      ],
    },
    her: {
      colors: { H: "#7a5440", S: "#f7d3b0", E: "#4a3a30", C: "#f4a58a", M: "#c9735f", G: "#ffd978", D: "#f5b94e", K: "#4a3a30" },
      rows: [
        "...HHHHHH...",
        "..HHHHHHHH..",
        ".HHHHHHHHHH.",
        ".HHSSSSSSHH.",
        ".HSSESSESSH.",
        ".HSCSSSSCSH.",
        ".HHSSMMSSHH.",
        ".HHGGGGGGHH.",
        ".SGGGGGGGGS.",
        ".SGGGGGGGGS.",
        "..GGGGGGGG..",
        ".DDDDDDDDDD.",
        "...SS..SS...",
        "...KK..KK...",
      ],
    },
    cloud: {
      colors: { W: "#ffffff", L: "#e3f1fa" },
      rows: [
        "....WWWW........",
        "..WWWWWWWW.WW...",
        ".WWWWWWWWWWWWW..",
        "WWWWWWWWWWWWWWW.",
        "WWWWWWWWWWWWWWWW",
        ".LLLLLLLLLLLLLL.",
      ],
    },
    cloudSmall: {
      colors: { W: "#ffffff", L: "#e3f1fa" },
      rows: [
        "...WWW....",
        ".WWWWWWW..",
        "WWWWWWWWWW",
        ".LLLLLLLL.",
      ],
    },
    sun: {
      colors: { Y: "#ffd978", O: "#ffc65c" },
      rows: [
        "...YYY...",
        ".YYYYYYY.",
        ".YYYYYYO.",
        "YYYYYYYOO",
        "YYYYYYYOO",
        "YYYYYYOOO",
        ".YYYYOOO.",
        ".YYOOOOO.",
        "...OOO...",
      ],
    },
    moon: {
      colors: { M: "#fff3c4" },
      rows: [
        "...MMM...",
        ".MMMMM...",
        ".MMMM....",
        "MMMM.....",
        "MMMM.....",
        "MMMM....M",
        ".MMMM..MM",
        ".MMMMMMM.",
        "...MMM...",
      ],
    },
    twinkle: {
      colors: { S: "#fff3c4" },
      rows: [".S.", "SSS", ".S."],
    },
    hills: {
      colors: { G: "#c4e8b6" },
      rows: [
        "................................",
        "......GGGGGG....................",
        "...GGGGGGGGGGGG.........GGGG....",
        ".GGGGGGGGGGGGGGGG....GGGGGGGGGG.",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
        "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
      ],
    },
    ground: {
      colors: { D: "#74c178", G: "#95d590", g: "#84cb84" },
      rows: [
        "..D.......D.....",
        "DDDDDDDDDDDDDDDD",
        "GGGGGGGGGGGGGGGG",
        "GGgGGGGGGGGGgGGG",
        "GGGGGGGgGGGGGGGG",
        "GGGGGGGGGGGGGGGG",
      ],
    },
    tree: {
      colors: { L: "#86cc86", D: "#66b46e", T: "#9a785a" },
      rows: [
        "...LLLL...",
        ".LLLLLLLL.",
        "LLLDLLLLLL",
        "LLLLLLLDLL",
        "LLDLLLLLLL",
        "LLLLLLDLLL",
        ".LLLLLLLL.",
        "..LLLLLL..",
        "....TT....",
        "....TT....",
        "....TT....",
        "...TTTT...",
      ],
    },
    heartOn: {
      colors: { P: "#ff86ad", W: "#ffd6e3", D: "#f06796" },
      rows: [
        ".PP...PP.",
        "PWWP.PPPD",
        "PWPPPPPPD",
        "PPPPPPPPD",
        ".PPPPPPD.",
        "..PPPPD..",
        "...PPD...",
        "....D....",
      ],
    },
    // 기분 얼굴 다섯 가지 (1: 최고 ~ 5: 힘듦)
    mood1: {
      colors: { Y: "#ffd978", E: "#5b4638", C: "#f4a58a" },
      rows: [".YYYYYY.", "YYYYYYYY", "YEEYYEEY", "YYYYYYYY", "YCYYYYCY", "YYEEEEYY", "YYYEEYYY", ".YYYYYY."],
    },
    mood2: {
      colors: { Y: "#ffe9ad", E: "#5b4638", C: "#f4a58a" },
      rows: [".YYYYYY.", "YYYYYYYY", "YYEYYEYY", "YYYYYYYY", "YCYYYYCY", "YEYYYYEY", "YYEEEEYY", ".YYYYYY."],
    },
    mood3: {
      colors: { Y: "#e3dacb", E: "#5b4638" },
      rows: [".YYYYYY.", "YYYYYYYY", "YYEYYEYY", "YYYYYYYY", "YYYYYYYY", "YYEEEEYY", "YYYYYYYY", ".YYYYYY."],
    },
    mood4: {
      colors: { Y: "#a9d8f0", E: "#5b4638", T: "#6c9bd1" },
      rows: [".YYYYYY.", "YYYYYYYY", "YYEYYEYY", "YYYYYTYY", "YYYYYTYY", "YYEEEEYY", "YEYYYYEY", ".YYYYYY."],
    },
    mood5: {
      colors: { Y: "#f9c49a", E: "#5b4638" },
      rows: [".YYYYYY.", "YEYYYYEY", "YYEYYEYY", "YYYYYYYY", "YYYYYYYY", "YYEEEEYY", "YEYYYYEY", ".YYYYYY."],
    },
    // 같이 키우는 식물 (0: 씨앗 ~ 4: 꽃나무)
    plant0: { colors: { B: "#9a785a" }, rows: ["..BB..", ".BBBB.", "......"] },
    plant1: { colors: { G: "#66b46e", L: "#86cc86" }, rows: ["L..L", "GLLG", ".GG.", ".GG.", ".GG."] },
    plant2: {
      colors: { G: "#66b46e", L: "#86cc86" },
      rows: ["..LL..", ".LLLL.", "LLGLLL", ".LLLL.", "..GG..", "L.GG.L", "LLGGLL", "..GG..", "..GG.."],
    },
    plant3: {
      colors: { G: "#66b46e", L: "#86cc86", Y: "#ffd978", O: "#f5a56b" },
      rows: [".YYY..", "YYOYY.", ".YYY..", "..G...", "L.G.LL", "LLGLL.", ".LGL..", "..G...", "..G...", "..G..."],
    },
    plant4: {
      colors: { G: "#66b46e", L: "#86cc86", Y: "#ffd978", O: "#f5a56b", W: "#ffffff", T: "#9a785a" },
      rows: [
        "..LLLL..",
        ".LYLLWL.",
        "LLLLLLLL",
        "LWLLYLLL",
        "LLLLLLWL",
        ".LYLLLL.",
        "..LLLL..",
        "...TT...",
        "...TT...",
        "..TTTT..",
      ],
    },
    leaf: { colors: { O: "#f5a56b", Y: "#ffc65c" }, rows: [".OO", "OYO", "OO."] },
    snow: { colors: { W: "#ffffff" }, rows: [".W.", "WWW", ".W."] },
    petal: { colors: { P: "#ffd6e3" }, rows: ["PP.", "PPP", ".PP"] },
    firefly: { colors: { Y: "#fff3a0" }, rows: ["YY", "YY"] },
    flowerA: { colors: { P: "#ffffff", O: "#ffc65c", S: "#66b46e" }, rows: [".P.", "POP", ".P.", ".S.", ".S."] },
    flowerB: { colors: { P: "#ffe08f", O: "#f5a56b", S: "#66b46e" }, rows: [".P.", "POP", ".P.", ".S.", ".S."] },
    flowerC: { colors: { P: "#cdbdee", O: "#ffffff", S: "#66b46e" }, rows: [".P.", "POP", ".P.", ".S.", ".S."] },
  };

  // rows → <svg> 문자열. 같은 색이 이어지면 한 칸으로 묶어요.
  function toSvg(rows, colors, scale, cls) {
    const h = rows.length;
    const w = rows[0].length;
    let rects = "";
    for (let y = 0; y < h; y++) {
      let x = 0;
      while (x < w) {
        const c = rows[y][x];
        if (c === ".") { x++; continue; }
        let run = 1;
        while (x + run < w && rows[y][x + run] === c) run++;
        const fill = colors ? colors[c] : "currentColor";
        rects += `<rect${colors ? ` class="c-${c}"` : ""} x="${x}" y="${y}" width="${run}" height="1" fill="${fill}"/>`;
        x += run;
      }
    }
    return `<svg class="${cls || "px"}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * scale}" height="${h * scale}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
  }

  window.PIXEL = {
    icon(name, scale) {
      const rows = ICONS[name] || ICONS.etc;
      return toSvg(rows, null, scale || 2, "px px-icon");
    },
    sprite(name, scale) {
      const s = SPRITES[name];
      return s ? toSvg(s.rows, s.colors, scale || 4, "px px-sprite") : "";
    },
    // CSS 배경으로 쓸 수 있는 주소로 바꿔요. (옆으로 반복되는 언덕, 잔디)
    dataUri(name, scale) {
      const sp = SPRITES[name];
      if (!sp) return "";
      return `url("data:image/svg+xml,${encodeURIComponent(toSvg(sp.rows, sp.colors, scale || 3, "px"))}")`;
    },
    // data-icon / data-sprite / data-bg 속성이 있는 자리를 그림으로 채워요.
    fill(root) {
      (root || document).querySelectorAll("[data-icon]").forEach((el) => {
        el.innerHTML = this.icon(el.dataset.icon, Number(el.dataset.scale) || 2);
      });
      (root || document).querySelectorAll("[data-sprite]").forEach((el) => {
        el.innerHTML = this.sprite(el.dataset.sprite, Number(el.dataset.scale) || 4);
      });
      (root || document).querySelectorAll("[data-bg]").forEach((el) => {
        el.style.backgroundImage = this.dataUri(el.dataset.bg, Number(el.dataset.scale) || 3);
      });
    },
  };
})();
