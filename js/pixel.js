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
    // ---- 배경 ----
    treeBare: {
      colors: { T: "#8d6748", W: "#ffffff" },
      rows: [
        "..W..W.W..",
        "..T.WT.T..",
        "W.T.T..T.W",
        "T..TT.T..T",
        ".T.TTT..T.",
        "..T.TTTT..",
        "...TTT....",
        "....TT....",
        "....TT....",
        "....TT....",
        "....TT....",
        "...TTTT...",
      ],
    },
    mountains: {
      colors: { M: "#9fb6cf", D: "#8aa3bf", S: "#ffffff" },
      rows: [
        "..........MM..................................",
        ".........MMMM.....................M...........",
        "........MMMDMM...................MMM..........",
        ".......MMMMDDMM.................MMMMM.........",
        "......MMMMMMDDMM.......M.......MMMMDMM........",
        ".....MMMMMMMMDDMM.....MMM.....MMMMMMDMM.......",
        "....MMMMMMMMMMDDMM...MMMMM...MMMMMMMMDMM......",
        "...MMMMMMMMMMMMMDMM.MMMMMMM.MMMMMMMMMMDMM.....",
        "..MMMMMMMMMMMMMMMDMMMMMMMMMMMMMMMMMMMMMDMMM...",
        ".MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM.",
        "MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM",
      ],
    },
    mountainsSnow: {
      colors: { M: "#a8b8cc", D: "#93a6be", S: "#ffffff" },
      rows: [
        "..........SS..................................",
        ".........SSSS.....................S...........",
        "........SSSDSS...................SSS..........",
        ".......MSMMDDMM.................SSSSS.........",
        "......MMMMMMDDMM.......S.......MMSMDMM........",
        ".....MMMMMMMMDDMM.....SSS.....MMMMMMDMM.......",
        "....MMMMMMMMMMDDMM...MMSMM...MMMMMMMMDMM......",
        "...MMMMMMMMMMMMMDMM.MMMMMMM.MMMMMMMMMMDMM.....",
        "..MMMMMMMMMMMMMMMDMMMMMMMMMMMMMMMMMMMMMDMMM...",
        ".MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM.",
        "MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM",
      ],
    },
    house: {
      colors: { R: "#e3846a", D: "#c96a52", W: "#f3ead6", B: "#9a785a", G: "#6a7a9c", C: "#8d6748" },
      rows: [
        "..........CC....",
        "....RRRRRRCCR...",
        "...RRRRRRRRRRR..",
        "..RRRRRRRRRRRRR.",
        ".DDDDDDDDDDDDDDD",
        "..WWWWWWWWWWWW..",
        "..WGGWWWWWWGGW..",
        "..WGGWWBBWWGGW..",
        "..WWWWWBBWWWWW..",
        "..WWWWWBBWWWWW..",
      ],
    },
    house2: {
      colors: { R: "#7fa3c9", D: "#6a8cb2", W: "#fff6e6", B: "#9a785a", G: "#6a7a9c", C: "#8d6748" },
      rows: [
        "....CC......",
        "..RRCCRR....",
        ".RRRRRRRR...",
        "RRRRRRRRRR..",
        "DDDDDDDDDDD.",
        ".WWWWWWWWW..",
        ".WGGWWWGGW..",
        ".WGGWBWGGW..",
        ".WWWWBWWWW..",
      ],
    },
    lamp: {
      colors: { L: "#5b4638", Y: "#fff3a0", G: "#e3dacb" },
      rows: [
        ".LLL.",
        "LGYGL",
        "LYYYL",
        ".LLL.",
        "..L..",
        "..L..",
        "..L..",
        "..L..",
        "..L..",
        "..L..",
        "..L..",
        "..L..",
        "..L..",
        "..L..",
        "..L..",
        ".LLL.",
      ],
    },
    fence: {
      colors: { F: "#d9b98f", D: "#b9946a" },
      rows: [".F......F...", "FFF....FFF..", "FFFFFFFFFFFF", ".F......F...", "FFFFFFFFFFFF", ".F......F...", ".D......D..."],
    },
    // ---- 동물 ----
    squirrel: {
      colors: { S: "#c97a3c", T: "#e0a45f", E: "#5b4638", W: "#fff6ee" },
      rows: ["TT......", "TTT.SS..", "TTT.SES.", ".TTSSSSS", "..SSSSW.", "..SSSS..", "..S..S.."],
    },
    owl: {
      colors: { O: "#9a785a", D: "#6e5340", Y: "#ffd978", E: "#5b4638", B: "#f5a56b" },
      rows: ["O.....O", "OOOOOOO", "OYEOYEO", "OOOBOOO", "ODOOODO", "ODDODDO", ".OOOOO.", "..B.B.."],
    },
    bat1: { colors: { B: "#3d3550" }, rows: ["B.....B", "BB.B.BB", ".BBBBB.", "...B..."] },
    bat2: { colors: { B: "#3d3550" }, rows: [".......", "...B...", "BBBBBBB", "B..B..B"] },
    frog: {
      colors: { G: "#6cc07a", D: "#4e9a5c", E: "#5b4638", W: "#ffffff" },
      rows: [".W..W.", "GEGGEG", "GGGGGG", "DGGGGD", "D.DD.D"],
    },
    snail: {
      colors: { S: "#c99a6e", D: "#9a785a", B: "#e3dacb", E: "#5b4638" },
      rows: ["..SSS..", ".SDDSS.", "E.SDSS.", "EBBBBBB"],
    },
    dog1: {
      colors: { D: "#e0b07a", B: "#b9813f", E: "#5b4638", P: "#ff9ec0" },
      rows: ["BB.........", "BDD.......D", "DEDD.....D.", "DDDDDDDDDD.", ".PDDDDDDDD.", "..DDBDDBDD.", "..D.D..D.D."],
    },
    dog2: {
      colors: { D: "#e0b07a", B: "#b9813f", E: "#5b4638", P: "#ff9ec0" },
      rows: ["BB.........", "BDD......D.", "DEDD.....D.", "DDDDDDDDDD.", ".PDDDDDDDD.", "..DDBDDBDD.", ".D.D....D.D"],
    },
    // ---- 할 일 소품 ----
    book: { colors: { R: "#e86a6a", W: "#fff6ee", D: "#c9504f" }, rows: ["RRRWRRR", "RWWWWWR", "RWWWWWR", "DDDDDDD"] },
    book2: { colors: { R: "#7fb2e5", W: "#fff6ee", D: "#5f8fc0" }, rows: ["RRRWRRR", "RWWWWWR", "RWWWWWR", "DDDDDDD"] },
    popcorn: { colors: { W: "#fff6ee", Y: "#ffe08f", R: "#e86a6a" }, rows: [".WYW.", "WYWYW", "RWRWR", "RWRWR", ".RWR."] },
    screen: {
      colors: { F: "#5b4638", S: "#cfe6ff", L: "#ffffff", B: "#7fb2e5" },
      rows: ["FFFFFFFFFFFF", "FSSSSLSSSSSF", "FSBBSSSSBBSF", "FSSSSSSSSSSF", "FSSBBBBBBSSF", "FFFFFFFFFFFF", ".....FF.....", "....FFFF...."],
    },
    telescope: {
      colors: { T: "#7fb2e5", D: "#5f8fc0", L: "#5b4638" },
      rows: ["......TT", ".....TTD", "....TTD.", "...TTD..", "..TTD...", "...L....", "..L.L...", ".L...L..", "L.....L."],
    },
    cafeTable: { colors: { T: "#ffffff", L: "#9a785a", C: "#ff9ec0" }, rows: ["..C...C..", "TTTTTTTTT", "....L....", "....L....", "...LLL..."] },
    // ---- 감정 표시 ----
    emoHeart: { colors: { P: "#ff86ad" }, rows: [".P.P.", "PPPPP", ".PPP.", "..P.."] },
    emoNote: { colors: { N: "#5b4638" }, rows: ["..NNN", "..N.N", "..N.N", "NNN.N", "NN..."] },
    emoSweat: { colors: { B: "#7fb2e5", W: "#dff3ff" }, rows: ["..B..", ".BWB.", "BWBBB", ".BBB."] },
    emoQ: { colors: { Q: "#ee9453" }, rows: [".QQQ.", "Q...Q", "...Q.", "..Q..", ".....", "..Q.."] },
    emoBang: { colors: { Q: "#e3504b" }, rows: ["Q", "Q", "Q", ".", "Q"] },
    emoDots: { colors: { D: "#5b4638" }, rows: ["D.D.D"] },
    emoStar: { colors: { Y: "#ffd978" }, rows: ["..Y..", "YYYYY", ".YYY.", "Y.Y.Y"] },
    // ---- 게임 ----
    spray: { colors: { G: "#86cc86", D: "#4e9a5c", W: "#ffffff", R: "#e3504b" }, rows: ["..RR.", ".W...", "GGGG.", "GWWG.", "GGGG.", "GDDG.", "GGGG."] },
    fert2: { colors: { P: "#b39ddb", D: "#8e7cc3", Y: "#ffd978" }, rows: ["..PP..", "...P..", "..PPP.", ".PYYPP", "PPYYPP", "PPPPPP", ".PPPP."] },
    basketBig: { colors: { B: "#c99a6e", D: "#9a785a", P: "#ff86ad" }, rows: ["..P..P..P..", "BDBDBDBDBDB", "BBBBBBBBBBB", ".BDBDBDBDB.", "..BBBBBBB.."] },
    goldHeart: { colors: { Y: "#ffd978", O: "#f5b94e", W: "#fff6d6" }, rows: [".YY.YY.", "YWYYYYO", "YYYYYYO", ".YYYYO.", "..YYO..", "...O..."] },
    stamp: { colors: { P: "#ff86ad", D: "#f06796" }, rows: [".PP.PP.", "PPPPPPD", "PPPPPPD", ".PPPPD.", "..PPD..", "...D..."] },
    // ---- 게임: 동물 친구 ----
    rabbit: {
      colors: { W: "#ffffff", P: "#ffb9cf", E: "#5b4638", G: "#e3dacb" },
      rows: [".W..W...", ".WP.WP..", ".WP.WP..", "WWWWWW..", "WEWWEW..", "WWPPWW.W", ".WWWWWWW", ".WGWWGW.", ".W..W..."],
    },
    hamster: {
      colors: { O: "#f5c08a", W: "#fff6ee", E: "#5b4638", P: "#ff9ec0" },
      rows: [".O....O.", "OOOOOOOO", "OEOOOOEO", "OOWPPWOO", "OWWWWWWO", "OWWWWWWO", ".OO..OO."],
    },
    petDog: {
      colors: { D: "#e0b07a", B: "#b9813f", E: "#5b4638", P: "#ff9ec0", W: "#fff6ee" },
      rows: ["B......B", "BDDDDDDB", "BDEDDEDB", ".DDWWDD.", ".DWEEWD.", ".DDPPDD.", ".DDDDDD.", ".D.DD.D."],
    },
    petCat: {
      colors: { C: "#f5a56b", D: "#e0823f", E: "#5b4638", P: "#ff9ec0", W: "#fff6ee" },
      rows: ["C......C", "CC....CC", "CCCCCCCC", "CECCCCEC", "CCWPPWCC", ".CCCCCC.", ".CDCCDC.", ".C.CC.C."],
    },
    // ---- 게임: 도구 ----
    scissors: { colors: { S: "#c9cdd4", R: "#e86a6a", D: "#9aa1ab" }, rows: ["S.....S", ".S...S.", "..S.S..", "...D...", "..R.R..", ".R...R.", ".RR.RR."] },
    stake: { colors: { W: "#c99a6e", D: "#9a785a", G: "#86cc86" }, rows: ["WW", "WD", "WD", "WD", "WD", "WD", "WD", "WD", ".D"] },
    hammer: { colors: { H: "#8d9aaa", W: "#c99a6e" }, rows: ["HHHHH", "HHHHH", "..W..", "..W..", "..W..", "..W.."] },
    bottle: { colors: { G: "#86cc86", L: "#c9f0c9", C: "#c99a6e", W: "#ffffff" }, rows: [".CC.", ".GG.", "GLWG", "GLGG", "GGGG", "GGGG"] },
    note: { colors: { N: "#5b4638" }, rows: ["..NN", "..NN", "..N.", "..N.", "NNN.", "NN.."] },
    tag: { colors: { T: "#ffe9ad", D: "#e0b040", S: "#a38c78" }, rows: ["S.......", ".TTTTTT.", "TTTTTTTD", "TTTTTTTD", ".DDDDDD."] },
    letter: { colors: { W: "#fff6ee", P: "#ff86ad", L: "#e3dacb" }, rows: ["WWWWWWWWW", "WPWWWWWPW", "WWPWWWPWW", "WWWPPPWWW", "WWWWWWWWW", "LLLLLLLLL"] },
    bowlPet: { colors: { B: "#7fb2e5", D: "#5f8fc0", F: "#c99a6e" }, rows: [".FFFFF.", "BBBBBBB", ".BDDDB.", "..BBB.."] },
    ball: { colors: { R: "#e86a6a", W: "#ffffff" }, rows: [".RR.", "RWRR", "RRRW", ".RR."] },
    shovel: { colors: { S: "#c9cdd4", W: "#c99a6e" }, rows: ["..W..", "..W..", "..W..", ".SSS.", "SSSSS", ".SSS.", "..S.."] },
    // ---- 게임: 요리 ----
    cookie: { colors: { C: "#e0b07a", D: "#9a6a3f" }, rows: [".CCCC.", "CCDCCC", "CDCCDC", "CCCDCC", ".CCCC."] },
    jam: { colors: { G: "#ffffff", R: "#e8505b", L: "#ff9ec0", C: "#f5f0e6" }, rows: [".CCCC.", "GGGGGG", "GRRRRG", "GRLRRG", "GRRRRG", ".GGGG."] },
    pasta: { colors: { P: "#ffe08f", R: "#e8604b", W: "#ffffff", G: "#86cc86" }, rows: ["..RGR...", ".PRPPRP.", "WPPPPPPW", "WWWWWWWW", ".WWWWWW."] },
    tea: { colors: { W: "#ffffff", R: "#e8505b", P: "#ff9ec0" }, rows: ["..P....", "WWWWW..", "WRRRWWW", "WRRRW.W", "WWWWWWW", ".WWW..."] },
    bouquet: { colors: { P: "#ff86ad", Y: "#ffd978", W: "#ffffff", G: "#66b46e", R: "#e8505b" }, rows: [".PYP.", "YPWPY", ".RPY.", "..G..", ".GGG.", ".GGG.", "..G.."] },
    ricecake: { colors: { W: "#ffffff", P: "#ffc4d6", G: "#86cc86" }, rows: ["..G...", ".PPPP.", "PPWPPP", "PPPPPP", ".PPPP."] },
    pie: { colors: { C: "#e0b07a", D: "#b9813f", R: "#e8505b" }, rows: [".CDCDC.", "CRCRCRC", "CCCCCCC", ".DDDDD."] },
    charm: { colors: { G: "#66b46e", L: "#86cc86", Y: "#ffd978", R: "#e86a6a" }, rows: ["..R..", ".LYL.", "LLGLL", ".LGL.", "..G.."] },
    cactusGift: { colors: { G: "#66b46e", W: "#ffffff", P: "#ff9ec0", O: "#d9875a" }, rows: ["..P..", ".GGG.", "GWGWG", ".GGG.", "OOOOO", ".OOO."] },
    rainbowCake: { colors: { R: "#ff86ad", O: "#f5a56b", Y: "#ffd978", G: "#86cc86", B: "#7fb2e5", W: "#ffffff" }, rows: ["..W.W..", "WWWWWWW", "RRRRRRR", "OOOOOOO", "YYYYYYY", "GGGGGGG", "BBBBBBB"] },
    seedBag: { colors: { B: "#e0b07a", D: "#b9813f", G: "#86cc86" }, rows: ["..DD..", ".BBBB.", "BBGBBB", "BGGGBB", "BBGBBB", ".BBBB."] },
    // ---- 게임: 꾸미기 ----
    bench: { colors: { W: "#c99a6e", D: "#9a785a" }, rows: ["WWWWWWWWWWWW", "............", "WWWWWWWWWWWW", "DDDDDDDDDDDD", ".D........D.", ".D........D."] },
    fountain: { colors: { B: "#7fb2e5", L: "#dff3ff", S: "#c9cdd4", D: "#9aa1ab" }, rows: ["....L....", "...LBL...", "....B....", "..SSSSS..", ".SBBBBBS.", "SSSSSSSSS", ".DDDDDDD."] },
    windmill: { colors: { W: "#fff6ee", R: "#e3846a", B: "#c99a6e", D: "#9a785a" }, rows: ["W...W", ".W.W.", "..R..", ".W.W.", "W.B.W", "..B..", ".BBB.", ".BDB.", ".BBB."] },
    mailbox: { colors: { R: "#e86a6a", D: "#c9504f", W: "#c99a6e", Y: "#ffd978" }, rows: [".RRRR.", "RRRRRY", "RDDDRY", "RRRRR.", "..W...", "..W...", "..W..."] },
    birdhouse: { colors: { R: "#7fb2e5", W: "#f3ead6", E: "#5b4638", P: "#c99a6e" }, rows: ["..RR..", ".RRRR.", "RRRRRR", ".WWWW.", ".WEEW.", ".WWWW.", "..P...", "..P..."] },
    lantern: { colors: { R: "#e86a6a", Y: "#ffd978", D: "#5b4638" }, rows: ["..D..", ".RRR.", "RYYYR", "RYYYR", ".RRR.", "..D.."] },
    swing: { colors: { W: "#c99a6e", R: "#a38c78", S: "#ff9ec0" }, rows: ["WWWWWWWWW", "W.R...R.W", "W.R...R.W", "W.R...R.W", "W.SSSSS.W", "W.......W", "W.......W"] },
    signpost: { colors: { W: "#c99a6e", D: "#9a785a", T: "#fff6ee" }, rows: ["WWWWWWW", "WTTTTTW", "WWWWWWW", "...D...", "...D...", "...D..."] },
    flowerbed: { colors: { P: "#ff86ad", Y: "#ffd978", B: "#b39ddb", G: "#66b46e", O: "#c99a6e" }, rows: [".P.Y.B.P.", "PGYGBGPGY", ".G.G.G.G.", "OOOOOOOOO"] },
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
    // 그림 원본 (색을 바꿔 다시 그릴 때 써요)
    rows(name) {
      const s = SPRITES[name];
      return s ? { rows: s.rows.slice(), colors: Object.assign({}, s.colors) } : null;
    },
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
    dataUri(name, scale, colors) {
      const sp = SPRITES[name];
      if (!sp) return "";
      return `url("data:image/svg+xml,${encodeURIComponent(toSvg(sp.rows, Object.assign({}, sp.colors, colors || {}), scale || 3, "px"))}")`;
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
