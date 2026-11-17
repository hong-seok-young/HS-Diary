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

  // 여러 색 캐릭터
  const SPRITES = {
    him: {
      colors: { H: "#333c57", S: "#f2c9a0", E: "#1a1c2c", B: "#3b5dc9", P: "#29366f", K: "#1a1c2c" },
      rows: [
        "...HHHHHH...",
        "..HHHHHHHH..",
        "..HHHHHHHH..",
        "..HSSSSSSH..",
        "..SSESSESS..",
        "..SSSSSSSS..",
        "...SSSSSS...",
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
      colors: { H: "#5a3a2e", S: "#f2c9a0", E: "#1a1c2c", G: "#38b764", K: "#1a1c2c" },
      rows: [
        "...HHHHHH...",
        "..HHHHHHHH..",
        ".HHHHHHHHHH.",
        ".HHSSSSSSHH.",
        ".HSSESSESSH.",
        ".HSSSSSSSSH.",
        ".HHSSSSSSHH.",
        ".HHGGGGGGHH.",
        ".SGGGGGGGGS.",
        ".SGGGGGGGGS.",
        "..GGGGGGGG..",
        ".GGGGGGGGGG.",
        "...SS..SS...",
        "...KK..KK...",
      ],
    },
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
        rects += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${fill}"/>`;
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
    // data-icon / data-sprite 속성이 있는 자리를 그림으로 채워요.
    fill(root) {
      (root || document).querySelectorAll("[data-icon]").forEach((el) => {
        el.innerHTML = this.icon(el.dataset.icon, Number(el.dataset.scale) || 2);
      });
      (root || document).querySelectorAll("[data-sprite]").forEach((el) => {
        el.innerHTML = this.sprite(el.dataset.sprite, Number(el.dataset.scale) || 4);
      });
    },
  };
})();
