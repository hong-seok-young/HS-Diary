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
    share: [
      "...XX...",
      "..XXXX..",
      ".X.XX.X.",
      "...XX...",
      "XX.XX.XX",
      "X......X",
      "X......X",
      "XXXXXXXX",
    ],
    dots: [
      "XX",
      "XX",
      "..",
      "XX",
      "XX",
      "..",
      "XX",
      "XX",
    ],
    leaf: [
      "....XXX",
      "..XXXXX",
      ".XXX.XX",
      "XXX.XXX",
      "XX.XXX.",
      "X.XXX..",
      ".X.....",
    ],
    coin: [
      ".XXXX.",
      "XX..XX",
      "X.XX.X",
      "X.XX.X",
      "XX..XX",
      ".XXXX.",
    ],
    hand: [
      "..X.X.X.",
      "..X.X.X.",
      ".XX.X.X.",
      "XXXXXXX.",
      "XXXXXXX.",
      ".XXXXX..",
      "..XXX...",
    ],
    sack: [
      "..XXXX..",
      "...XX...",
      "..XXXX..",
      ".XXXXXX.",
      "XXX..XXX",
      "XX.XX.XX",
      "XXXXXXXX",
      ".XXXXXX.",
    ],
    basket: [
      "..XXXX..",
      ".X....X.",
      "XXXXXXXX",
      "X.X.X.XX",
      "XX.X.X.X",
      ".XXXXXX.",
    ],
    trophy: [
      "XXXXXXXX",
      "XXXXXXXX",
      ".XXXXXX.",
      "..XXXX..",
      "...XX...",
      "..XXXX..",
    ],
    lock: [
      "..XXX..",
      ".X...X.",
      ".X...X.",
      "XXXXXXX",
      "XXX.XXX",
      "XXX.XXX",
      "XXXXXXX",
    ],
    wsun: [
      "...X...",
      ".X...X.",
      "..XXX..",
      "X.XXX.X",
      "..XXX..",
      ".X...X.",
      "...X...",
    ],
    wmoon: [
      "..XXX..",
      ".XX....",
      "XX.....",
      "XX.....",
      "XX....X",
      ".XX..XX",
      "..XXXX.",
    ],
    wcloud: [
      "...XX...",
      ".XXXXXX.",
      "XXXXXXXX",
      "XXXXXXXX",
    ],
    wrain: [
      "...XX...",
      ".XXXXXX.",
      "XXXXXXXX",
      "........",
      ".X..X..X",
      "X..X..X.",
    ],
    wsnow: [
      "...XX...",
      ".XXXXXX.",
      "XXXXXXXX",
      "........",
      ".X..X..X",
      "........",
      "X..X..X.",
    ],
    wthunder: [
      "...XX...",
      ".XXXXXX.",
      "XXXXXXXX",
      "....X...",
      "...XX...",
      "..XX....",
      "..X.....",
    ],
    wfog: [
      "XXXXXX..",
      "........",
      "..XXXXXX",
      "........",
      "XXXXXX..",
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
    // ---- 풍경 소품 ----
    umbrella: {
      colors: { P: "#ff9ec0", D: "#f06796", W: "#ffe3ec", H: "#8d6748" },
      rows: [
        "......PPPP......",
        "...PPPPPPPPPP...",
        "..PWWPPPPPPPPP..",
        ".PWPPPPPPPPPPPD.",
        "PPPPPPPPPPPPPPDD",
        "D.DD.DDD.DDD.DD.",
        ".......H........",
        ".......H........",
        ".......H........",
        ".......H........",
        ".......H........",
        "......HH........",
      ],
    },
    bowl: {
      colors: { W: "#ffffff", R: "#e86a6a", D: "#c9504f" },
      rows: ["..WWWW..", ".WWWWWW.", "RRRRRRRR", ".RRRRRR.", "..DDDD.."],
    },
    mug: {
      colors: { M: "#ffffff", C: "#9a785a", S: "#e3dacb" },
      rows: ["MCCCM..", "MMMMMMM", "MMMMM.M", "MMMMMMM", "MMMMM..", ".SSS..."],
    },
    mat: {
      colors: { R: "#f28c8c", W: "#fff6ee" },
      rows: ["RRWWRRWWRRWWRRWWRRWWRRWW", "WWRRWWRRWWRRWWRRWWRRWWRR", "RRWWRRWWRRWWRRWWRRWWRRWW"],
    },
    table: {
      colors: { T: "#c99a6e", L: "#9a785a" },
      rows: [
        "TTTTTTTTTTTTTTTTTTTT",
        "LLLLLLLLLLLLLLLLLLLL",
        ".L................L.",
        ".L................L.",
        ".L................L.",
      ],
    },
    pot: {
      colors: { P: "#5b4638", S: "#ee9453", W: "#ffffff" },
      rows: ["..PPPPPP..", "PPSSWSSSPP", ".PSSSSSSP.", ".PPPPPPPP."],
    },
    fire1: {
      colors: { R: "#f0603a", O: "#ffa34a", Y: "#fff07a", W: "#9a785a", D: "#6e5340" },
      rows: [
        "....Y.....",
        "...YOY....",
        "..YOOOY...",
        "..ORRRO.Y.",
        ".OORRROOO.",
        ".ORRRRRRO.",
        "WDWWDWWDWW",
        ".WWDWWDWW.",
      ],
    },
    fire2: {
      colors: { R: "#f0603a", O: "#ffa34a", Y: "#fff07a", W: "#9a785a", D: "#6e5340" },
      rows: [
        ".....Y....",
        "....YOY...",
        "..YOOOOY..",
        ".Y.ORRRO..",
        ".OOORRROO.",
        ".ORRRRRRO.",
        "WDWWDWWDWW",
        ".WWDWWDWW.",
      ],
    },
    cake: {
      colors: { C: "#ffffff", P: "#ff9ec0", B: "#f9c49a", Y: "#fff07a", R: "#e86a6a" },
      rows: ["...Y..Y...", "...R..R...", ".CCCCCCCC.", ".PCPPCPPP.", ".BBBBBBBB.", ".PPPPPPPP.", ".BBBBBBBB."],
    },
    balloonP: {
      colors: { B: "#ff86ad", W: "#ffd6e3", S: "#a38c78" },
      rows: [".BBB.", "BWBBB", "BBBBB", "BBBBB", ".BBB.", "..B..", "..S..", "...S.", "..S..", ".S...", "..S..", "..S.."],
    },
    balloonB: {
      colors: { B: "#7fb2e5", W: "#d6ecff", S: "#a38c78" },
      rows: [".BBB.", "BWBBB", "BBBBB", "BBBBB", ".BBB.", "..B..", "..S..", ".S...", "..S..", "...S.", "..S..", "..S.."],
    },
    balloonY: {
      colors: { B: "#ffd978", W: "#fff6d6", S: "#a38c78" },
      rows: [".BBB.", "BWBBB", "BBBBB", "BBBBB", ".BBB.", "..B..", "..S..", "...S.", "..S..", "..S..", ".S...", "..S.."],
    },
    partyHat: {
      colors: { Y: "#ffd978", P: "#ff86ad", W: "#ffffff" },
      rows: ["..W..", "..Y..", ".YPY.", ".PYY.", "YYPYP"],
    },
    santaHat: {
      colors: { R: "#e3504b", W: "#ffffff" },
      rows: [".....WW", "...RRRW", "..RRRR.", ".RRRRR.", "WWWWWWW"],
    },
    nightCap: {
      colors: { B: "#7fb2e5", W: "#ffffff" },
      rows: ["......W", "....BBB", "..BBBB.", ".BBBBB.", "WWWWWWW"],
    },
    xtree: {
      colors: { G: "#4e9a5c", Y: "#ffd978", R: "#e3504b", B: "#7fb2e5", T: "#8d6748" },
      rows: [
        "....Y....",
        "...GGG...",
        "..GRGGG..",
        "...GGG...",
        "..GGBGG..",
        ".GGGGGGG.",
        "..GGGYG..",
        ".GRGGGGG.",
        "GGGGGGBGG",
        "....T....",
        "...TTT...",
      ],
    },
    pumpkin: {
      colors: { O: "#f5a56b", D: "#e0823f", G: "#66b46e", E: "#5b4638" },
      rows: ["....G...", "..OODOO.", ".OEODOEO", "OOOODOOO", "OOEEEEOO", ".OOOOOO.", "..OOOO.."],
    },
    gift: {
      colors: { R: "#ff86ad", Y: "#ffd978" },
      rows: ["..Y.Y..", "...Y...", "RRRYRRR", "RRRYRRR", "YYYYYYY", "RRRYRRR", "RRRYRRR"],
    },
    snowman: {
      colors: { W: "#ffffff", S: "#dfe9f3", E: "#5b4638", O: "#f5a56b", R: "#e3504b" },
      rows: [
        "...WWW...",
        "..WEWEW..",
        "..WWOWW..",
        "...WWW...",
        "..RRRRR..",
        ".WWWEWWW.",
        "WWWWWWWWW",
        "WWWWEWWWS",
        "WWWWWWWWS",
        ".SWWWWWS.",
      ],
    },
    kite: {
      colors: { P: "#ff86ad", Y: "#ffd978" },
      rows: ["...P...", "..PPP..", ".PPYPP.", "PPYYYPP", ".PPYPP.", "..PPP..", "...P...", "..Y.Y..", "...Y..."],
    },
    icecream: {
      colors: { P: "#ffb9cf", W: "#fff6ee", C: "#e0b07a", D: "#c99a6e" },
      rows: [".PPP.", "PPWPP", "PPPPP", "CDCDC", ".CDC.", ".DCD.", "..C.."],
    },
    bungeo: {
      colors: { B: "#e0a45f", D: "#b9813f" },
      rows: ["..BBBB..B", ".BDBBBBBB", "BBBBDBBB.", ".BBBBBBBB", "..BBBB..B"],
    },
    lights: {
      colors: { L: "#8d6748", R: "#ff86ad", Y: "#ffd978", B: "#7fb2e5", G: "#86cc86" },
      rows: [
        "LL......................LL",
        "..LL..................LL..",
        "..R.LLL..............LLY..",
        ".....Y.LLLL....LLLLB......",
        "...........LLLL.....G.....",
        "........B.......R.........",
      ],
    },
    cat1: {
      colors: { C: "#f5a56b", D: "#e0823f", E: "#5b4638", P: "#ff9ec0" },
      rows: ["C...C.......", "CC.CC.......", "CECEC......C", "CCPCC.....C.", ".CCCCCCCCCC.", ".CDCCDCCDCC.", ".C.C....C.C."],
    },
    cat2: {
      colors: { C: "#f5a56b", D: "#e0823f", E: "#5b4638", P: "#ff9ec0" },
      rows: ["C...C.......", "CC.CC......C", "CECEC.....C.", "CCPCC.....C.", ".CCCCCCCCCC.", ".CDCCDCCDCC.", "..C.C..C.C.."],
    },
    catSit: {
      colors: { C: "#f5a56b", D: "#e0823f", E: "#5b4638", P: "#ff9ec0" },
      rows: ["C...C...", "CC.CC...", "CECEC...", "CCPCC...", ".CCCC...", ".CDCCC.C", ".CCCCCC.", ".C.C.CC."],
    },
    bird1: { colors: { X: "#5b4638" }, rows: ["X...X", ".X.X.", "..X.."] },
    bird2: { colors: { X: "#5b4638" }, rows: [".....", "XX.XX", "..X.."] },
    fly1: { colors: { P: "#ffb9cf", B: "#5b4638" }, rows: ["P.B.P", "PPBPP", ".PBP."] },
    fly2: { colors: { P: "#ffb9cf", B: "#5b4638" }, rows: ["..B..", ".PBP.", ".PBP."] },
    dfly: { colors: { R: "#e3504b", W: "#dff3ff" }, rows: ["W.W.W", ".RRRR", "W.W.."] },
    bug: { colors: { G: "#86cc86", D: "#4e9a5c", E: "#5b4638" }, rows: ["....GE", "GDGDGG", ".G.G.."] },
    weed: { colors: { G: "#66b46e", L: "#9bd68f" }, rows: ["L.L.L", ".LGL.", "L.G.L", "..G.."] },
    can: {
      colors: { B: "#7fb2e5", D: "#5f8fc0", W: "#ffffff" },
      rows: [
        "..BBB.......",
        ".B...B......",
        "BBBBBBB....B",
        "BWBBBBBB..B.",
        "BBBBBBBBBB..",
        "BDBBBBBB....",
        ".BBBBBB.....",
      ],
    },
    zzz: { colors: { Z: "#ffffff" }, rows: ["ZZZ", "..Z", ".Z.", "Z..", "ZZZ"] },
    puff: { colors: { W: "#ffffff" }, rows: [".W.", "WWW", ".W."] },
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

  // 달 모양: 0 ~ 1 (0, 1 은 그믐, 0.5 는 보름)
  function moonRows(phase) {
    const n = 11, r = 5, c = 5;
    const lit = Math.cos(phase * 2 * Math.PI); // 1 → 어두움, -1 → 밝음
    const rows = [];
    for (let y = 0; y < n; y++) {
      let row = "";
      for (let x = 0; x < n; x++) {
        const dx = x - c, dy = y - c;
        if (dx * dx + dy * dy > r * r + 2) { row += "."; continue; }
        const half = Math.sqrt(Math.max(0, r * r - dy * dy)) || 1;
        const k = dx / half; // -1 ~ 1
        const waxing = phase < 0.5;
        const edge = lit; // 그림자 경계
        const bright = waxing ? k > edge : k < -edge;
        row += bright ? "M" : "S";
      }
      rows.push(row);
    }
    return rows;
  }

  window.PIXEL = {
    draw(rows, colors, scale, cls) {
      return toSvg(rows, colors, scale || 3, cls || "px px-sprite");
    },
    moon(phase, scale) {
      return toSvg(moonRows(phase), { M: "#fff3c4", S: "rgba(255,243,196,.16)" }, scale || 3, "px px-sprite");
    },
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
