// ============================================================
// 오늘의 기분 500가지: 마음 20가지 × 얼굴 모양 25가지.
// - 번호 n = 모양 × 20 + 마음(1~20). 1~20번은 기본 얼굴이에요.
// - 처음엔 하나도 없고, 500개 모두 출석한 날마다 하나씩 열려요 (js/deco.js).
// - 마음마다 캐릭터 표정이 하나씩 있어요 (js/f/sprites.js 의 moodFace).
// ============================================================
(function () {
  "use strict";
  const FEEL = ["", "최고", "좋아", "그냥", "슬퍼", "힘들어", "설레", "사랑해", "신나", "뿌듯", "편안", "졸려", "배고파", "심심", "걱정", "긴장", "화나", "삐짐", "아파", "피곤", "놀라"];
  const ADJ = ["", "최고인", "기분 좋은", "그냥 그런", "슬픈", "힘든", "설레는", "사랑에 빠진", "신난", "뿌듯한", "편안한", "졸린", "배고픈", "심심한", "걱정하는", "긴장한", "화난", "삐진", "아픈", "피곤한", "놀란"];
  const M = ".YYYYYYYY.", T = "..YYYYYY..";
  // [이름, 바탕색, 덧색, 그림 10줄] 얼굴(눈, 입)은 가운데 8×8 칸에 올려요.
  const BODIES = [
    ["얼굴", "", {}, null],
    ["곰", "#dba36a", { a: "#f8dcb4" }, [".YY....YY.", ".YaY..YaY.", M, M, M, M, M, M, M, T]],
    ["고양이", "#c4cbd8", { a: "#f7a8b8" }, [".Y......Y.", ".YY....YY.", ".YaYYYYaY.", M, M, M, M, M, M, T]],
    ["토끼", "#fff1f4", { a: "#ffb6c8" }, [".YY....YY.", ".Ya....aY.", ".YaYYYYaY.", M, M, M, M, M, M, T]],
    ["강아지", "#f6e6c8", { a: "#c58a55" }, ["..........", T, "aaYYYYYYaa", "aaYYYYYYaa", "aYYYYYYYYa", M, M, M, M, T]],
    ["병아리", "#ffe36a", {}, ["....Y.Y...", ".....Y....", T, M, M, M, M, M, M, T]],
    ["개구리", "#a4dc74", {}, [".YY....YY.", "YYYY..YYYY", M, M, M, M, M, M, M, T]],
    ["돼지", "#ffc4d0", { a: "#ff93ab" }, [".a......a.", ".aY....Ya.", M, M, M, M, M, M, M, T]],
    ["펭귄", "#fbfbff", { a: "#4a5878" }, ["..aaaaaa..", ".aaaaaaaa.", "aaaYYYYaaa", "aaYYYYYYaa", "aYYYYYYYYa", "aYYYYYYYYa", "aYYYYYYYYa", "aYYYYYYYYa", ".aYYYYYYa.", "..aaaaaa.."]],
    ["판다", "#f6f6f6", { a: "#3a3a44" }, [".aa....aa.", ".aaa..aaa.", ".aYYYYYYa.", M, M, M, M, M, M, T]],
    ["여우", "#ff9d4a", { a: "#fff3dc" }, ["Y........Y", "YY......YY", "YaYYYYYYaY", M, M, M, M, M, M, T]],
    ["유령", "#f1edff", {}, ["..........", "...YYYY...", T, M, M, M, M, M, M, ".YY.YY.YY."]],
    ["구름", "#e4f2ff", {}, ["..........", "..YY..YY..", M, "YYYYYYYYYY", "YYYYYYYYYY", "YYYYYYYYYY", "YYYYYYYYYY", "YYYYYYYYYY", M, T]],
    ["꽃", "#fff3b0", { a: "#ff9ac0" }, ["..aa..aa..", ".aaaaaaaa.", ".aYYYYYYa.", "aaYYYYYYaa", "aYYYYYYYYa", "aYYYYYYYYa", "aYYYYYYYYa", "aaYYYYYYaa", ".aYYYYYYa.", ".aaaaaaaa."]],
    ["해", "#ffd24a", { a: "#ff9a3a" }, ["....aa....", ".a..aa..a.", T, M, M, "aYYYYYYYYa", "aYYYYYYYYa", M, M, T]],
    ["달", "#fff1b8", { a: "#e6d48a", b: "#ffd24a" }, ["........b.", ".......bbb", "..YYYYYYb.", M, ".aYYYYYYY.", M, M, M, ".YYYYYYYa.", T]],
    ["눈사람", "#f4f9ff", { a: "#4a4a5a", b: "#e8504f" }, ["..aaaaaa..", "..bbbbbb..", "aaaaaaaaaa", M, M, M, M, M, M, T]],
    ["호박", "#ffa23a", { a: "#5fae5f" }, ["....aa....", "...aa.....", T, M, "YYYYYYYYYY", "YYYYYYYYYY", "YYYYYYYYYY", "YYYYYYYYYY", M, T]],
    ["딸기", "#ff8a9a", { a: "#5fae5f" }, ["...aaaa...", ".aaaaaaaa.", "..aYYYYa..", M, M, M, M, M, T, "...YYYY..."]],
    ["외계인", "#b4f0a0", { a: "#6ac85a" }, [".a......a.", "..a....a..", T, M, M, M, M, M, T, "...YYYY..."]],
    ["로봇", "#cfd8e4", { a: "#ff6a6a", b: "#8a98ac" }, ["....a.....", "....b.....", M, M, "bYYYYYYYYb", "bYYYYYYYYb", M, M, M, M]],
    ["악마", "#cdb0f4", { a: "#e8504f" }, ["a........a", "aa......aa", ".aYYYYYYa.", M, M, M, M, M, M, T]],
    ["천사", "#fff7dc", { a: "#ffd24a" }, ["..aaaaaa..", "..........", T, M, M, M, M, M, M, T]],
    ["떡", "#fff8ee", { a: "#ecd8bc" }, ["..........", "..........", "...YYYY...", M, "YYYYYYYYYY", "YYYYYYYYYY", "YYYYYYYYYY", "YYYYYYYYYY", "YYYYYYYYYY", "aaaaaaaaaa"]],
    ["물방울", "#a8dcf8", { a: "#ffffff" }, ["....YY....", "...YYYY...", T, ".YaYYYYYY.", ".YaYYYYYY.", M, M, M, M, T]],
  ];
  const NF = 20, NB = BODIES.length, COUNT = NF * NB;
  const feel = (n) => { n = Number(n) || 0; return n >= 1 && n <= COUNT ? ((n - 1) % NF) + 1 : 0; };
  const body = (n) => { n = Number(n) || 0; return n >= 1 && n <= COUNT ? Math.floor((n - 1) / NF) : 0; };
  const idOf = (b, f) => b * NF + f;
  const name = (n) => { const f = feel(n), b = body(n); return !f ? "" : b ? `${ADJ[f]} ${BODIES[b][0]}` : FEEL[f]; };
  const shade = (hex, k) => {
    const v = parseInt(hex.slice(1), 16);
    const c = (x) => Math.max(0, Math.min(255, Math.round(x * (1 + k))));
    return "#" + [c(v >> 16), c((v >> 8) & 255), c(v & 255)].map((x) => x.toString(16).padStart(2, "0")).join("");
  };
  const cache = {};
  function img(n) {
    const f = feel(n), b = body(n);
    if (!f || !window.GArt || !window.PIXEL) return null;
    if (cache[n]) return cache[n];
    const face = PIXEL.rows("mood" + f);
    if (!face) return null;
    let r;
    if (!b) r = GArt.fromRows("mood|" + n, face.rows, face.colors);
    else {
      const B = BODIES[b];
      // 테두리 한 칸을 두르려고 12×12 로 그려요
      const g = [];
      for (let y = 0; y < 12; y++) g.push(new Array(12).fill("."));
      B[3].forEach((row, y) => { for (let x = 0; x < 10; x++) if (row[x] !== ".") g[y + 1][x + 1] = row[x]; });
      face.rows.forEach((row, y) => { for (let x = 0; x < 8; x++) { const c = row[x]; if (c !== "." && c !== "Y") g[y + 3][x + 2] = c; } });
      const add = [];
      for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) {
        if (g[y][x] !== ".") continue;
        if ([[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(([p, q]) => g[q] && g[q][p] && g[q][p] !== ".")) add.push([x, y]);
      }
      add.forEach(([x, y]) => { g[y][x] = "o"; });
      r = GArt.fromRows("mood|" + n, g.map((x) => x.join("")), Object.assign({}, face.colors, B[2], { Y: B[1], o: shade(B[1], -0.45) }));
    }
    cache[n] = { uri: r.uri, w: r.w, h: r.h };
    return cache[n];
  }
  // 기본 얼굴(8칸)과 모양 얼굴(12칸)이 비슷한 크기로 보이게 맞춰요
  const size = (n, big) => (body(n) ? (big ? 36 : 24) : big ? 32 : 16);
  function html(n, big) {
    const r = img(n);
    if (!r) return "";
    const s = size(n, big);
    return `<img class="px mood-img" alt="" src="${r.uri}" style="width:${s}px;height:${s}px">`;
  }
  window.Moods = { FEEL, COUNT, NF, NB, BODIES, feel, body, idOf, name, img, html, size, uri: (n) => { const r = img(n); return r ? r.uri : ""; } };
})();
