// ============================================================
// 장식품 1140가지: 손에 드는 것 580, 눈 장식 160, 머리 장식 280, 목 장식 120.
// 손에 드는 것: 간식과 소품. 모양 29가지 × 맛(색) 20가지 = 580가지.
// 눈, 머리, 목 장식은 캐릭터 그림 위에 직접 그려요 (js/f/sprites.js 의 drawAcc).
// A 주색, a 그늘, B 포인트, W 흰색, C 크림, K 갈색(콘, 막대), G 초록
// ============================================================
(function () {
  "use strict";
  const SHAPES = [
    ["cake", "조각 케이크", ["...BB......", "..WWWWW....", ".WWWWWWWW..", "AAAAAAAAAA.", "CCCCCCCCCC.", "AAAAAAAAAA.", "CCCCCCCCCC.", "aaaaaaaaaa."]],
    ["cupcake", "컵케이크", ["....B....", "...AAA...", "..AAAAA..", ".AAWAAAA.", ".AAAAAAA.", "KKKKKKKKK", ".KCKCKCK.", ".KCKCKCK.", "..KKKKK.."]],
    ["cone", "아이스크림", ["..AAA..", ".AAAAA.", "AAWAAAA", "AAAAAAA", "aAAAAAa", "KKKKKKK", ".KCKCK.", ".KKCKK.", "..KCK..", "..KKK..", "...K..."]],
    ["pop", "막대 아이스크림", [".AAAAA.", "AAWAAAA", "AAWAAAA", "AAAAAAA", "AAAAAAA", "AAAAAAA", "aAAAAAa", ".aaaaa.", "...C...", "...C...", "...C..."]],
    ["donut", "도넛", ["..AAAAA..", ".AABAAWA.", "AAAAAAAAA", "AAA...AAB", "ABA...AAA", "aAAAAAAAa", ".CaaaaaC.", "..CCCCC.."]],
    ["cookie", "쿠키", ["..CCCCC..", ".CCACCCC.", "CCCCCCACC", "CACCCCCCC", "CCCCACCCC", "CCCCCCCAC", "CCACCCCCC", ".CCCCACC.", "..CCCCC.."]],
    ["lolli", "막대사탕", ["..AAA..", ".AWAAA.", "AWAABAA", "AABBAAA", "AAABBAA", ".AAAAA.", "..aaa..", "...W...", "...W...", "...W...", "...W..."]],
    ["candy", "사탕", ["A...AAA...A", "AA.AWAAA.AA", "AAAAABAAAAA", "AA.AAAAa.AA", "A...aaa...A"]],
    ["drink", "음료수", ["....K..", "....K..", "CCCCKCC", "WAAAKAW", "WAAAAAW", "WAAWAAW", "WAAAAAW", ".WAAAW.", ".WaaaW.", "..WWW.."]],
    ["boba", "버블티", ["....K..", "....K..", "CCCCKCC", "WAAAAAW", "WAAAAAW", "WAAAAAW", "WAKAAKW", ".WAKAW.", ".WKAKW.", "..WWW.."]],
    ["mug", "머그컵", [".W.W.....", "..W.W....", "AAAAAAA..", "AWAAAAAAA", "AWAAAAA.A", "AAAAAAAAA", "aAAAAAa..", ".aaaaa..."]],
    ["macaron", "마카롱", ["..AAAAA..", ".AAWAAAA.", "AAAAAAAAA", "CCCCCCCCC", "AAAAAAAAA", ".aAAAAAa.", "..aaaaa.."]],
    ["pudding", "푸딩", ["...BBB...", "..BBBBB..", "..AAAAA..", ".AAWAAAA.", ".AAAAAAA.", "AAAAAAAAA", "aAAAAAAAa", "WWWWWWWWW", ".WWWWWWW."]],
    ["balloon", "풍선", ["..AAA..", ".AWAAA.", "AWAAAAA", "AAAAAAA", "AAAAAAa", ".AAAAa.", "..aaa..", "...a...", "...W...", "..W....", "...W..."]],
    ["flower", "꽃 한 송이", ["...A.A...", "..AAAAA..", ".AAABAAA.", "..AAAAA..", "...A.A...", "....G....", "..G.G....", "...GG....", "....G....", "....G...."]],
    ["bouquet", "꽃다발", [".A..B..A.", "AAA.A.AAA", ".AGBABGA.", "..GAGAG..", "..CGGGC..", "..CCCCC..", "...CCC...", "...CAC...", "...CCC...", "....C...."]],
    ["wand", "별 요술봉", ["....A....", "...AAA...", "AAAAWAAAA", ".AAAAAAA.", "..AAAAA..", ".AAA.AAA.", ".A..K..A.", "....K....", "....K....", "....K...."]],
    ["heart", "하트", [".AA...AA.", "AWAA.AAAA", "AWAAAAAAA", "AAAAAAAAA", ".AAAAAAA.", "..AAAAa..", "...AAa...", "....a...."]],
    ["gift", "선물 상자", ["..BB.BB..", "...BBB...", "AAAABAAAA", "AAAABAAAA", "BBBBBBBBB", "AAAABAAAA", "AAAABAAAA", "aaaaBaaaa"]],
    ["floss", "솜사탕", ["..AAAAA..", ".AAWAAAA.", "AAWAAAAAA", "AAAAAAAAA", "AAAAAAAAa", ".AAAAAAa.", "..aaaaa..", "....C....", "....C....", "....C...."]],
    ["bungeo", "붕어빵", ["..AAAAA...A", ".AAWAAAA.AA", "AKAAAaAAAAA", "AAAAaAaAAAA", ".AAAAaAA.AA", "..aaaaa...A"]],
    ["skewer", "꼬치", ["..C..", ".AAA.", ".AWA.", ".BBB.", ".BWB.", ".AAA.", ".AaA.", "..C..", "..C..", "..C.."]],
    ["crepe", "크레페", [".WWBWW...", "WWBWWBW..", "CCCCCCCC.", ".CACACAC.", ".CCCCCCC.", "..CACAC..", "..CCCCC..", "...CAC...", "...CCC...", "....C...."]],
    ["bingsu", "빙수", ["...BB....", "..WWWW...", ".WWAWWW..", ".WAAAWAW.", "WWWWWWWWW", "AAAAAAAAA", ".AAAAAAA.", "..aaaaa..", "...aaa..."]],
    ["pinwheel", "바람개비", ["AAAA.....", "AAA.BBBB.", "AA.WBBB..", "...WW.BB.", ".BB.WW...", "..BBBW.AA", ".BBBB.AAA", ".....AAAA", "....K....", "....K....", "....K...."]],
    ["flag", "깃발", ["KAAAAAA..", "KAAWAAAA.", "KAAAAAAAA", "KAAAAAAA.", "KaaaaaA..", "K........", "K........", "K........", "K........", "K........"]],
    ["teddy", "곰 인형", [".AA...AA.", "AABAAABAA", ".AAAAAAA.", ".AKAAAKA.", ".AACCCAA.", "..ACKCA..", ".AAAAAAA.", "AAACCCAAA", ".AACCCAA.", ".AA...AA."]],
    ["umbrella", "우산", ["....A....", "..AAAAA..", ".AAWAAAA.", "AAWAAAAAA", "AAAAAAAAA", "A.A.K.A.A", "....K....", "....K....", "....K....", "..K.K....", "...K....."]],
    ["book", "책", ["AAAAAAAA.", "AWWWWWWAA", "AWBBBBWAA", "AWWWWWWAA", "AWBBBWWAA", "AWWWWWWAA", "AAAAAAAAA", ".aaaaaaaa"]],
  ];
  const FLAVORS = [
    ["딸기", "#ff8fa8", "#e8364a"], ["초코", "#8a5a3a", "#5a3418"], ["말차", "#a8cc6a", "#6a9a3a"], ["바닐라", "#fff0c0", "#f0c860"], ["블루베리", "#7a8ae8", "#4a52b8"],
    ["망고", "#ffc04a", "#f08a2a"], ["복숭아", "#ffc0a8", "#ff8a7a"], ["민트", "#a0e8d0", "#4ac0a0"], ["레몬", "#fff07a", "#f0c82a"], ["포도", "#b08ae0", "#7a4ab8"],
    ["카라멜", "#e0a060", "#a8642a"], ["우유", "#fffaf0", "#ffd0dc"], ["체리", "#e8364a", "#8a1a2a"], ["오렌지", "#ff9a3a", "#e06a14"], ["라즈베리", "#e85a8a", "#a82a5a"],
    ["흑임자", "#9a9aa2", "#5a5a62"], ["고구마", "#b06a9a", "#ffd87a"], ["솜사탕", "#ffc8e6", "#8ad0f6"], ["하늘", "#8ad0f6", "#4a8ad8"], ["장미", "#ff7a9a", "#ffd0dc"],
  ];
  const shade = (hex, k) => {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(v * (1 + k))));
    return "#" + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map((v) => v.toString(16).padStart(2, "0")).join("");
  };
  const LIST = [], BY = {};
  SHAPES.forEach(([sid, sname, rows], si) => FLAVORS.forEach(([fname, A, B], fi) => {
    const it = { id: `${sid}${fi}`, kind: "hand", name: `${fname} ${sname}`, rows, c: { A, a: shade(A, -0.2), B, W: "#ffffff", C: "#fff3dc", K: "#a8743e", G: "#5fae5f" }, si, fi };
    LIST.push(it); BY[it.id] = it;
  }));
  // 몸에 걸치는 장식: [아이디, 이름]. 모양은 sprites.js 가 그려요.
  const WEAR = {
    eye: [["gr", "둥근 안경"], ["gs", "네모 안경"], ["sun", "선글라스"], ["half", "반테 안경"], ["mono", "외알 안경"], ["patch", "안대"], ["gem", "볼 보석"], ["shadow", "아이섀도"]],
    hat: [["bow", "리본"], ["band", "머리띠"], ["crown", "왕관"], ["beret", "베레모"], ["cap", "야구모자"], ["straw", "밀짚모자"], ["beanie", "비니"], ["pin", "꽃핀"], ["cone", "고깔모자"], ["phone", "헤드폰"], ["bunny", "토끼 머리띠"], ["cat", "고양이 머리띠"], ["sprout", "새싹"], ["star", "별 핀"]],
    neck: [["scarf", "목도리"], ["bowtie", "나비넥타이"], ["lace", "목걸이"], ["tie", "넥타이"], ["kerchief", "스카프"], ["bell", "방울 목줄"]],
  };
  Object.keys(WEAR).forEach((kind) => WEAR[kind].forEach(([sid, sname]) => FLAVORS.forEach(([fname, A, B], fi) => {
    const it = { id: `${kind[0]}_${sid}${fi}`, kind, shape: sid, name: `${fname} ${sname}`, c: [A, shade(A, -0.22), B], fi };
    LIST.push(it); BY[it.id] = it;
  })));
  const cache = {};
  function img(id) {
    const it = BY[id];
    if (!it || !window.GArt) return "";
    if (cache[id]) return cache[id];
    const w = Math.max.apply(null, it.rows.map((r) => r.length));
    const g = it.rows.map((r) => ("." + r.padEnd(w, ".") + ".").split(""));
    g.unshift(new Array(w + 2).fill(".")); g.push(new Array(w + 2).fill("."));
    const add = [];
    for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) {
      if (g[y][x] !== ".") continue;
      if ([[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(([a, b]) => g[b] && g[b][a] && g[b][a] !== "." && g[b][a] !== "o")) add.push([x, y]);
    }
    add.forEach(([x, y]) => { g[y][x] = "o"; });
    const r = GArt.fromRows("item|" + id, g.map((x) => x.join("")), Object.assign({ o: "#4a3428" }, it.c));
    cache[id] = { uri: r.uri, w: r.w, h: r.h };
    return cache[id];
  }
  window.Items = { LIST, BY, img, uri: (id) => { const r = img(id); return r ? r.uri : ""; } };
})();
