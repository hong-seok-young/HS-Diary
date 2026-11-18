// ============================================================
// 꽃마루 정원: 자료
// 정원 12곳, 꽃 120종(정원마다 8종 + 달마다 2종), 요리 36가지, 장식 48가지,
// 도구 4가지, 연구 10가지, 축제 12개, 친구 13명
// ============================================================
(function () {
  "use strict";

  // [이름, 모양, 꽃잎색, 가운데색, 옵션]
  const AREA_SPECIES = [
    [
      ["민들레", "daisy", "#ffd84a", "#f0a830", { r: 2.6, short: 1 }],
      ["데이지", "daisy", "#ffffff", "#ffd35c"],
      ["튤립", "tulip", "#ff7a8a"],
      ["팬지", "pansy", "#b49cf0", "#3b2c25"],
      ["해바라기", "sunflower", "#ffd23f", "#8a5a36", { tall: 1 }],
      ["제비꽃", "orchid", "#8f6fd8", "#ffe066", { short: 1 }],
      ["금잔화", "camellia", "#ffa733", "#d9661f"],
      ["네잎클로버", "clover", "#ffffff", "#ffe066", { four: 1 }],
    ],
    [
      ["선인장", "cactus", "#ff8fb1", "#ffe066"],
      ["다육이", "succulent", "#ffb36b", "#ffe066", null, "#9fd3a8"],
      ["히비스커스", "camellia", "#ff5d6c", "#ffe066"],
      ["난초", "orchid", "#f5b8e8", "#ffd35c"],
      ["베고니아", "cup", "#ff8a7a", "#ffe066"],
      ["칼라", "trumpet", "#fffaf0", "#ffd35c", { tall: 1 }],
      ["극락조화", "bird", "#ff9a3c", "#5a7de0"],
      ["파리지옥", "trap", "#9fd96b", "#fff8ec", { short: 1 }],
    ],
    [
      ["연꽃", "lotus", "#ffb3c7", "#ffe066", { short: 1, lowLeaves: 1 }],
      ["수련", "lotus", "#fffaf0", "#ffe066", { short: 1, lowLeaves: 1 }],
      ["부들", "grass", "#8a5a36", "#ffe066", { cattail: 1 }],
      ["붓꽃", "orchid", "#6f7fe0", "#ffd35c", { tall: 1 }],
      ["물망초", "daisy", "#8ec9ff", "#ffe066", { r: 2.2, twin: 1 }],
      ["창포", "spike", "#9d7be0", "#ffe066", { tall: 1 }],
      ["물옥잠", "spike", "#a7b6ff", "#ffe066"],
      ["가시연꽃", "lotus", "#d96fd0", "#ffe066", { short: 1, lowLeaves: 1 }],
    ],
    [
      ["사과나무", "tree", "#ff5a5a"],
      ["복숭아나무", "tree", "#ffa4a4"],
      ["벚나무", "tree", "#ffc0d4", "#ffe066", { blossom: 1 }],
      ["귤나무", "tree", "#ffa630"],
      ["배나무", "tree", "#e8e070"],
      ["포도", "vine", "#9b6fd0", "#ffe066", { grape: 1 }],
      ["무화과", "tree", "#9a5a8a"],
      ["황금사과", "tree", "#ffd700"],
    ],
    [
      ["딸기", "fruitbush", "#ff4f5e", "#ffe066", { seeds: 1 }],
      ["토마토", "fruitbush", "#ff6040"],
      ["당근", "root", "#ff9a3c"],
      ["무", "root", "#f8f4ec"],
      ["바질", "herb", "#ffffff"],
      ["민트", "herb", "#c7b6ff", "#ffe066", null, "#8fe0b0"],
      ["호박", "fruitbush", "#ff9a3c", "#ffe066", { big: 1 }],
      ["라벤더", "spike", "#a68be8", "#ffe066", { tall: 1 }],
    ],
    [
      ["빨간 장미", "rose", "#ff4d5e"],
      ["분홍 장미", "rose", "#ff9ab8"],
      ["노란 장미", "rose", "#ffd84a"],
      ["흰 장미", "rose", "#fffaf0"],
      ["덩굴장미", "vine", "#ff6f8a", "#ffe066"],
      ["작약", "ball", "#ffb3c7", "#ffe066", { r: 4 }],
      ["파란 장미", "rose", "#6f9bff"],
      ["검은 장미", "rose", "#5a3a5e"],
    ],
    [
      ["은방울꽃", "bell", "#ffffff"],
      ["블루벨", "bell", "#7b9bff"],
      ["디기탈리스", "spike", "#e88ad8", "#ffe066", { tall: 1 }],
      ["고사리", "fern", "#b7e07a"],
      ["버섯", "mushroom", "#ff6b5e", "#ffffff"],
      ["산딸기", "bush", "#ff5d6c", "#ffe066", { dot: 1 }],
      ["요정버섯", "mushroom", "#a68be8", "#fff07a", { glow: 1 }],
      ["반딧불꽃", "bell", "#fff07a"],
    ],
    [
      ["달맞이꽃", "cup", "#fff07a", "#ffe066"],
      ["박꽃", "trumpet", "#ffffff"],
      ["재스민", "star", "#fffaf0", "#ffe066", { r: 3.5 }],
      ["분꽃", "trumpet", "#ff6fb0"],
      ["월하미인", "lily", "#fffaf0", "#ffe066", { tall: 1 }],
      ["은방초", "spike", "#dfe7f2"],
      ["달빛장미", "rose", "#cfd8ff"],
      ["초승달꽃", "moon", "#fff3a0", "#ffffff"],
    ],
    [
      ["목화", "grass", "#ffffff", "#ffe066", { cotton: 1 }],
      ["안개꽃", "bush", "#ffffff", "#ffe066", { dot: 1 }],
      ["수국", "ball", "#8fb8ff"],
      ["코스모스", "daisy", "#ff9ac8", "#ffd35c", { r: 3.4, tall: 1 }],
      ["갈대", "grass", "#e8d5a8"],
      ["메밀꽃", "bush", "#fffaf0"],
      ["구름꽃", "cloud", "#ffffff"],
      ["솜사탕꽃", "cloud", "#ffc0e0"],
    ],
    [
      ["별꽃", "star", "#fff3a0"],
      ["은하수꽃", "ball", "#9b8cff"],
      ["수정꽃", "crystal", "#9fe8ff"],
      ["오로라꽃", "lily", "#8fffd0", "#c7a6ff"],
      ["혜성초", "flame", "#a6c8ff", "#ffffff"],
      ["별사탕꽃", "star", "#ffb3d9", "#fff3a0"],
      ["북극성꽃", "star", "#ffffff", "#9fe8ff", { r: 5 }],
      ["유성화", "flame", "#ffd84a", "#ff8a3c"],
    ],
    [
      ["무지개꽃", "daisy", "#ff9a6b", "#7bd88f", { r: 3.4 }],
      ["물보라꽃", "ball", "#bfe8ff"],
      ["칠색초", "spike", "#7bd88f"],
      ["프리즘꽃", "crystal", "#e8b3ff"],
      ["빛방울꽃", "bell", "#fff07a"],
      ["물안개꽃", "cloud", "#dfefff"],
      ["쌍무지개꽃", "daisy", "#ff7aa0", "#ffe066", { twin: 1 }],
      ["하늘꽃", "lily", "#7bc8ff"],
    ],
    [
      ["시계꽃", "passion", "#b9a6ff", "#6f5ad0"],
      ["모래시계꽃", "tulip", "#f5d9a0"],
      ["영원화", "daisy", "#ffd0e8", "#ff9ab8", { r: 3.2 }],
      ["추억꽃", "camellia", "#f0b3a0", "#ffe066"],
      ["약속꽃", "heart", "#ff8ab0"],
      ["기다림꽃", "bell", "#c7b6ff"],
      ["백년화", "clock", "#fff3c4", "#f5d9a0"],
      ["사랑초", "heart", "#ff5d8f", "#ffe066", { twin: 1 }],
    ],
  ];

  // 달마다 피는 꽃 (그 달에만 심을 수 있어요)
  const SEASONAL = [
    [["동백", "camellia", "#e8304a", "#ffd35c"], ["설강화", "bell", "#ffffff"]],
    [["매화", "tree", "#ffd0dc", "#ffe066", { blossom: 1 }], ["초코코스모스", "daisy", "#6b3a2e", "#3b2c25"]],
    [["벚꽃", "tree", "#ffc0d4", "#ffe066", { blossom: 1 }], ["개나리", "bush", "#ffd84a"]],
    [["진달래", "bush", "#f07ac0"], ["무스카리", "spike", "#5a6fe0"]],
    [["카네이션", "ball", "#ff6f8a", "#ffe066", { r: 3 }], ["아카시아", "bell", "#fffaf0"]],
    [["산수국", "ball", "#b3a6ff"], ["치자꽃", "camellia", "#fffaf0", "#ffe066"]],
    [["능소화", "trumpet", "#ff8a3c"], ["백합", "lily", "#ffffff", "#ffb347", { tall: 1 }]],
    [["무궁화", "camellia", "#f58ad0", "#c0306a"], ["봉숭아", "orchid", "#ff5d8f"]],
    [["구절초", "daisy", "#ffffff", "#ffd35c", { r: 3.4 }], ["꽃무릇", "lily", "#ff3d4a", "#ff3d4a", { tall: 1 }]],
    [["단풍나무", "tree", "#ff7a3c", "#ffe066", { canopy: "p", canopy2: "d" }], ["억새", "grass", "#f3e6c8"]],
    [["국화", "ball", "#ffd84a", "#ffe066", { r: 3.6 }], ["산국", "daisy", "#ffe066", "#f0a830", { twin: 1 }]],
    [["포인세티아", "star", "#e8304a", "#ffd35c"], ["호랑가시나무", "bush", "#e8304a", "#ffe066", { dot: 1 }]],
  ];

  const AREAS = [
    { name: "앞마당", npc: "마루", kind: "dog", bld: "오두막", sky: ["#bfe6ff", "#e8f6ff"], ground: "#9fd88a", soil: "#a97b55", perk: "tap" },
    { name: "유리 온실", npc: "단비", kind: "rabbit", bld: "온실", sky: ["#d8f3ee", "#f2fbf7"], ground: "#a6dcb0", soil: "#9c7656", perk: "idle" },
    { name: "연못", npc: "여울", kind: "frog", bld: "나무다리", sky: ["#bde4f5", "#e2f5fb"], ground: "#8fd0a0", soil: "#8d6b4e", perk: "combo" },
    { name: "과수원", npc: "솔", kind: "squirrel", bld: "사과 창고", sky: ["#ffe9c6", "#fff6e6"], ground: "#b5d97a", soil: "#a97b55", perk: "petal" },
    { name: "텃밭", npc: "꿀곰", kind: "bear", bld: "부엌 오두막", sky: ["#e4f2c8", "#f6fbe8"], ground: "#a8d27c", soil: "#8a5f3f", perk: "order" },
    { name: "장미 정원", npc: "라온", kind: "fox", bld: "장미 아치", sky: ["#ffdfe6", "#fff1f3"], ground: "#9fd18f", soil: "#a37355", perk: "beauty" },
    { name: "숲속 빈터", npc: "도토", kind: "mole", bld: "나무 위 오두막", sky: ["#cfe8c4", "#eaf5e2"], ground: "#7fbf78", soil: "#7a5a40", perk: "sparkle" },
    { name: "달빛 정원", npc: "별이", kind: "owl", bld: "달 정자", sky: ["#3e4a7e", "#7b80b8"], ground: "#5f8f7a", soil: "#5e4a3e", perk: "night", dark: 1 },
    { name: "구름 언덕", npc: "몽실", kind: "sheep", bld: "풍차", sky: ["#dfe9ff", "#f6f8ff"], ground: "#c4e3a8", soil: "#b08a68", perk: "cap" },
    { name: "별빛 온실", npc: "초롱", kind: "firefly", bld: "천문대", sky: ["#2b2f5e", "#5b5394"], ground: "#4f7f78", soil: "#5a4a48", perk: "star", dark: 1 },
    { name: "무지개 폭포", npc: "무지", kind: "bird", bld: "물레방아", sky: ["#c8ecff", "#fff1fb"], ground: "#8fd6a8", soil: "#8d6b4e", perk: "luck" },
    { name: "시간의 정원", npc: "느루", kind: "turtle", bld: "약속의 나무", sky: ["#f3e3ff", "#fff6e8"], ground: "#b6d89a", soil: "#9c7656", perk: "all" },
  ];

  const PERKS = {
    tap: { name: "손길 힘", per: 0.15 },
    idle: { name: "저절로 자라기", per: 0.25 },
    combo: { name: "연속 최대", per: 3 },
    petal: { name: "꽃잎", per: 0.12 },
    order: { name: "주문 보상", per: 0.2 },
    beauty: { name: "아름다움", per: 0.15 },
    sparkle: { name: "반짝이 보상", per: 0.3 },
    night: { name: "밤 꽃잎", per: 0.25 },
    cap: { name: "모아 두는 시간", per: 2 },
    star: { name: "별조각", per: 1 },
    luck: { name: "변종 행운", per: 0.15 },
    all: { name: "모든 것", per: 0.08 },
  };

  // 꽃 목록 만들기: id 0..95 정원 꽃, 96..119 달마다 꽃
  const SPECIES = [];
  AREA_SPECIES.forEach((list, a) => {
    list.forEach((s, k) => {
      SPECIES.push({ id: SPECIES.length, name: s[0], a: s[1], p: s[2], c: s[3], o: s[4] || {}, l: s[5], area: a, k, rare: k >= 6 });
    });
  });
  SEASONAL.forEach((pair, m) => {
    pair.forEach((s, k) => {
      SPECIES.push({ id: SPECIES.length, name: s[0], a: s[1], p: s[2], c: s[3], o: s[4] || {}, l: s[5], area: -1, month: m, k, season: true });
    });
  });

  // 도구 네 가지: 꽃이 원하는 것
  const CARES = [
    { key: "water", name: "물", verb: "물 주기", icon: "drop", tiers: ["낡은 물뿌리개", "나무 물뿌리개", "구리 물뿌리개", "은 물뿌리개", "금 물뿌리개", "무지개 물뿌리개", "구름 물뿌리개", "별빛 물뿌리개", "달래의 물뿌리개", "약속의 물뿌리개"] },
    { key: "pet", name: "쓰다듬기", verb: "쓰다듬기", icon: "hand", tiers: ["맨손", "면장갑", "털장갑", "꽃장갑", "비단장갑", "구름장갑", "햇살장갑", "별빛장갑", "바우의 장갑", "약속의 손"] },
    { key: "sing", name: "노래", verb: "노래하기", icon: "note", tiers: ["콧노래", "휘파람", "작은 오카리나", "피리", "하모니카", "우쿨렐레", "아코디언", "오르골", "바우의 노래", "둘의 노래"] },
    { key: "sun", name: "햇살", verb: "햇살 비추기", icon: "wsun", tiers: ["손거울", "작은 거울", "동그란 거울", "반짝 거울", "햇살 렌즈", "무지개 렌즈", "프리즘", "별빛 등", "달래의 등불", "약속의 해"] },
  ];

  // 연구: 별조각으로 올려요 (단계마다 비용 = 단계 + 1)
  const RESEARCH = [
    { key: "tap", name: "손길 연구", desc: "누를 때 자라는 힘", per: "+25%", max: 15 },
    { key: "petal", name: "꽃잎 연구", desc: "수확 꽃잎", per: "+15%", max: 15 },
    { key: "idle", name: "햇빛 연구", desc: "저절로 자라는 속도", per: "+30%", max: 15 },
    { key: "cap", name: "흙 연구", desc: "자리를 비워도 자라는 시간", per: "+2시간", max: 10 },
    { key: "luck", name: "변종 연구", desc: "은빛, 금빛, 무지개 꽃 확률", per: "+12%", max: 15 },
    { key: "combo", name: "박자 연구", desc: "연속 최대", per: "+4", max: 10 },
    { key: "sparkle", name: "반짝이 연구", desc: "반짝이가 더 자주, 더 크게", per: "+20%", max: 10 },
    { key: "splash", name: "물보라 연구", desc: "누르면 옆 꽃도 조금 자라요", per: "+8%", max: 10 },
    { key: "order", name: "배달 연구", desc: "주문 보상", per: "+15%", max: 10 },
    { key: "boss", name: "봉오리 연구", desc: "큰 봉오리에 주는 힘", per: "+30%", max: 10 },
  ];

  // 요리: 정원마다 세 가지. 재료는 [정원 안 꽃 번호, 개수]
  const RECIPES = [
    [["민들레차", "tea", [[0, 2]]], ["꽃다발", "bouquet", [[1, 1], [2, 1], [3, 1]]], ["해바라기씨 쿠키", "cookie", [[4, 2], [0, 1]]]],
    [["선인장 주스", "mug", [[0, 2]]], ["히비스커스 차", "tea", [[2, 2], [1, 1]]], ["난초 향수", "bottle", [[3, 2], [5, 1]]]],
    [["연잎밥", "ricecake", [[0, 2]]], ["수련 향초", "lantern", [[1, 2], [2, 1]]], ["물망초 책갈피", "note", [[4, 2], [5, 1]]]],
    [["사과파이", "pie", [[0, 2]]], ["복숭아 잼", "jam", [[1, 2], [2, 1]]], ["과일 타르트", "cake", [[3, 1], [4, 1], [5, 1]]]],
    [["딸기 케이크", "cake", [[0, 3]]], ["토마토 파스타", "pasta", [[1, 2], [4, 1]]], ["허브 샐러드", "bowl", [[2, 1], [3, 1], [5, 1]]]],
    [["장미잼", "jam", [[0, 2]]], ["장미 향수", "bottle", [[1, 2], [3, 1]]], ["화관", "charm", [[2, 1], [4, 1], [5, 1]]]],
    [["버섯 수프", "bowl", [[4, 3]]], ["산딸기 머핀", "cookie", [[5, 2], [0, 1]]], ["숲 꽃다발", "bouquet", [[1, 1], [2, 1], [3, 1]]]],
    [["재스민 차", "tea", [[2, 2]]], ["달빛 쿠키", "cookie", [[0, 2], [5, 1]]], ["야광 화분", "lantern", [[1, 1], [3, 1], [4, 1]]]],
    [["솜사탕", "icecream", [[0, 2]]], ["안개꽃 부케", "bouquet", [[1, 2], [3, 1]]], ["목화 쿠션", "mat", [[0, 2], [4, 2]]]],
    [["별사탕", "popcorn", [[0, 2], [5, 1]]], ["은하수 젤리", "jam", [[1, 2], [4, 1]]], ["수정 오르골", "charm", [[2, 2], [3, 1]]]],
    [["무지개 케이크", "rainbowCake", [[0, 2], [2, 1]]], ["물방울 젤리", "jam", [[1, 2], [5, 1]]], ["프리즘 펜던트", "charm", [[3, 2], [4, 1]]]],
    [["추억 앨범", "book2", [[3, 2], [0, 1]]], ["약속 반지", "charm", [[4, 2], [2, 1]]], ["백년 차", "tea", [[1, 2], [5, 2]]]],
  ];

  // 장식: [이름, 그림, 아름다움, 색 바꾸기]
  const DECOR = [
    [["벤치", "bench", 4], ["우체통", "mailbox", 4], ["푯말", "signpost", 3]],
    [["꽃 화단", "flowerbed", 5], ["작은 등불", "lantern", 5], ["파라솔", "umbrella", 5]],
    [["분수", "fountain", 8], ["새집", "birdhouse", 6], ["개구리 돌", "frog", 6]],
    [["그네", "swing", 9], ["큰 바구니", "basketBig", 7], ["나무 탁자", "table", 7]],
    [["풍차 모형", "windmill", 10], ["돗자리", "mat", 8], ["화분 선반", "cafeTable", 9]],
    [["꽃 우산", "umbrella", 12, { R: "#ff8ab0" }], ["하트 풍선", "balloonP", 11], ["장미 등불", "lantern", 12, { Y: "#ffb3c7" }]],
    [["버섯 의자", "table", 13, { B: "#ff6b5e" }], ["반딧불 병", "bottle", 13], ["나무 푯말", "signpost", 12]],
    [["달 망원경", "telescope", 16], ["밤 등불", "lamp", 15], ["별 풍선", "balloonY", 15]],
    [["구름 벤치", "bench", 18, { B: "#dfe9ff" }], ["연", "kite", 17], ["파란 풍선", "balloonB", 17]],
    [["별빛 전구", "lights", 20], ["별 망원경", "telescope", 21, { B: "#9b8cff" }], ["반짝 분수", "fountain", 21, { W: "#c7d8ff" }]],
    [["무지개 연", "kite", 24], ["물레 모형", "windmill", 25, { W: "#bfe8ff" }], ["무지개 그네", "swing", 25]],
    [["모래시계 탁자", "cafeTable", 28], ["약속 우체통", "mailbox", 28, { R: "#ff8ab0" }], ["시간 등불", "lamp", 30]],
  ];
  // 축제 한정 장식 (달마다 하나)
  const FEST_DECOR = [
    ["눈사람", "snowman", 20], ["초콜릿 상자", "gift", 20], ["벚꽃 우산", "umbrella", 20, { R: "#ffc0d4" }],
    ["튤립 화단", "flowerbed", 20], ["장미 풍선", "balloonP", 20], ["수국 등불", "lantern", 20, { Y: "#b3a6ff" }],
    ["반딧불 등", "lamp", 20], ["해바라기 연", "kite", 20], ["달맞이 떡상", "table", 20],
    ["호박 등", "pumpkin", 20], ["국화 화단", "flowerbed", 20, { P: "#ffd84a" }], ["별빛 트리", "xtree", 20],
  ];

  const FESTIVALS = [
    { name: "눈꽃 축제", color: "#bfe0ff" }, { name: "초콜릿 축제", color: "#c99a7a" }, { name: "벚꽃 축제", color: "#ffc0d4" },
    { name: "튤립 축제", color: "#ff9aa8" }, { name: "장미 축제", color: "#ff8ab0" }, { name: "수국 축제", color: "#b3a6ff" },
    { name: "반딧불이 축제", color: "#fff07a" }, { name: "해바라기 축제", color: "#ffd23f" }, { name: "달맞이 축제", color: "#fff3a0" },
    { name: "단풍 축제", color: "#ff9a5c" }, { name: "국화 축제", color: "#ffd84a" }, { name: "별빛 축제", color: "#9fd0ff" },
  ];

  // 놀이 다섯 가지, 단계 10개씩
  const GAMES = [
    { key: "catch", name: "하트 받기", icon: "heartOn" },
    { key: "whack", name: "벌레 잡기", icon: "bug" },
    { key: "rhythm", name: "물주기 박자", icon: "can" },
    { key: "memory", name: "짝 맞추기", icon: "dice" },
    { key: "simon", name: "꽃 노래 따라 하기", icon: "note" },
  ];

  const VARIANTS = ["보통", "은빛", "금빛", "무지개"];
  const VARIANT_MULT = [1, 3, 10, 40];

  // 친구 13명 (정원 12 + 우편냥)
  const POSTCAT = { name: "우편냥", kind: "cat" };

  window.GData = { SPECIES, AREAS, PERKS, CARES, RESEARCH, RECIPES, DECOR, FEST_DECOR, FESTIVALS, GAMES, VARIANTS, VARIANT_MULT, POSTCAT, SEASONAL_START: 96 };
})();
