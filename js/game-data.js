// ============================================================
// 같이 키우기: 정해진 값 모음
// 식물, 물건, 요리법, 꾸미기, 동물 친구, 미션, 도전, 레벨 보상
// ============================================================
(function () {
  "use strict";

  const SPECIES = {
    sunflower: { name: "해바라기", shape: "flower", P: "#ffd978", Q: "#f5b94e", C: "#9a6a3f", F: "#6e5340", speed: 1, unlock: 0, produce: "해바라기씨" },
    tulip: { name: "튤립", shape: "tulip", P: "#ff86ad", Q: "#f06796", C: "#ffd978", F: "#ff86ad", speed: 0.9, unlock: 0, produce: "튤립" },
    strawberry: { name: "딸기", shape: "bush", P: "#ffffff", Q: "#ffe9ad", C: "#ffd978", F: "#e8505b", speed: 1.1, unlock: 1, produce: "딸기" },
    tomato: { name: "토마토", shape: "bush", P: "#ffd978", Q: "#f5b94e", C: "#f5b94e", F: "#e8604b", speed: 1.2, unlock: 2, produce: "토마토" },
    rose: { name: "장미", shape: "rose", P: "#e8505b", Q: "#b83a46", C: "#f06796", F: "#e8505b", speed: 1.3, unlock: 3, produce: "장미" },
    cactus: { name: "선인장", shape: "cactus", P: "#ff9ec0", Q: "#f06796", C: "#ffd978", F: "#ff9ec0", speed: 1, unlock: 4, produce: "선인장 꽃" },
    clover: { name: "네잎클로버", shape: "clover", P: "#ffffff", Q: "#e3f3dc", C: "#86cc86", F: "#5fae6a", speed: 0.8, unlock: 5, produce: "네잎클로버" },
    cherry: { name: "벚꽃나무", shape: "tree", P: "#ffc4d6", Q: "#ff9ec0", C: "#ffd6e3", F: "#e8505b", speed: 1.5, unlock: 6, produce: "버찌" },
    apple: { name: "사과나무", shape: "tree", P: "#ffffff", Q: "#ffd6e3", C: "#ffe9ad", F: "#e8505b", speed: 1.6, unlock: 7, produce: "사과" },
    rainbow: { name: "무지개꽃", shape: "rainbow", P: "#ff86ad", Q: "#7fb2e5", C: "#ffd978", F: "#b39ddb", speed: 1.4, unlock: "all", produce: "무지개 꽃잎" },
  };
  const ORDER = Object.keys(SPECIES);
  const STAGE_NAMES = ["씨앗", "새싹", "떡잎", "꽃봉오리", "꽃", "열매"];
  const STEPS = [0, 12, 36, 75, 130, 200];
  const QUALITY = ["", "보통", "은빛", "금빛"];

  // 상점에서 사서 쓰는 물건
  const ITEMS = {
    fert: { name: "비료", price: 10, sprite: "sack", icon: true, desc: "성장 +25" },
    fert2: { name: "고급 비료", price: 25, sprite: "fert2", desc: "성장 +45" },
    tonic: { name: "영양제", price: 20, sprite: "bottle", desc: "시든 식물을 살리고 하루 동안 물이 천천히 말라요" },
    spray: { name: "살충제", price: 15, sprite: "spray", desc: "하루 동안 벌레가 안 생겨요" },
    stake: { name: "지지대", price: 12, sprite: "stake", desc: "떡잎부터 꽂을 수 있어요. 성장 +5, 품질 +2" },
    petfood: { name: "동물 간식", price: 8, sprite: "bowlPet", desc: "동물 친구 배를 채워요" },
  };
  const STARTER = { fert: 3, fert2: 1, spray: 1, tonic: 1, petfood: 3, stake: 1 };

  // 요리법: 수확물로 만들어요
  const RECIPES = [
    { id: "cookie", name: "해바라기씨 쿠키", sprite: "cookie", needs: { sunflower: 1 }, xp: 10 },
    { id: "bouquet", name: "튤립 꽃다발", sprite: "bouquet", needs: { tulip: 2 }, xp: 14 },
    { id: "jam", name: "딸기잼", sprite: "jam", needs: { strawberry: 2 }, xp: 16 },
    { id: "pasta", name: "토마토 파스타", sprite: "pasta", needs: { tomato: 2 }, xp: 18 },
    { id: "tea", name: "장미 꽃차", sprite: "tea", needs: { rose: 1 }, xp: 14 },
    { id: "cactusGift", name: "선인장 꽃 화분", sprite: "cactusGift", needs: { cactus: 1 }, xp: 12 },
    { id: "charm", name: "행운 부적", sprite: "charm", needs: { clover: 1 }, xp: 20 },
    { id: "ricecake", name: "벚꽃 떡", sprite: "ricecake", needs: { cherry: 1, strawberry: 1 }, xp: 24 },
    { id: "pie", name: "사과파이", sprite: "pie", needs: { apple: 2 }, xp: 26 },
    { id: "rainbowCake", name: "무지개 케이크", sprite: "rainbowCake", needs: { rainbow: 1, sunflower: 1, tulip: 1 }, xp: 50 },
  ];

  // 정원 꾸미기
  const DECOR = [
    { id: "bench", name: "벤치", sprite: "bench", price: 30, scale: 3 },
    { id: "flowerbed", name: "꽃밭", sprite: "flowerbed", price: 25, scale: 3 },
    { id: "lantern", name: "등불", sprite: "lantern", price: 20, scale: 3 },
    { id: "mailbox", name: "우체통", sprite: "mailbox", price: 35, scale: 3 },
    { id: "birdhouse", name: "새집", sprite: "birdhouse", price: 40, scale: 3 },
    { id: "signpost", name: "표지판", sprite: "signpost", price: 15, scale: 3 },
    { id: "swing", name: "그네", sprite: "swing", price: 60, scale: 3 },
    { id: "fountain", name: "분수", sprite: "fountain", price: 80, scale: 3 },
    { id: "windmill", name: "풍차", sprite: "windmill", price: 70, scale: 3 },
  ];
  const DECOR_SLOTS = 6;

  const POTS = {
    basic: { name: "기본", price: 0, O: "#d9875a", o: "#b96b44", R: "#ec9f73", H: "#d9875a" },
    sky: { name: "하늘", price: 20, O: "#8ec5ee", o: "#6aa6d4", R: "#b5dbf7", H: "#ffffff" },
    heart: { name: "하트", price: 30, O: "#ff9ec0", o: "#f06796", R: "#ffc4d6", H: "#ffffff" },
    mint: { name: "민트", price: 30, O: "#9bd6b8", o: "#6fb894", R: "#c4ecd8", H: "#ffffff" },
    gold: { name: "금빛", price: 60, O: "#ffd978", o: "#e0b040", R: "#fff0b0", H: "#ffffff" },
  };

  // 동물 친구
  const PETS = [
    { id: "dog", name: "강아지", sprite: "petDog", price: 50, lv: 2 },
    { id: "cat", name: "고양이", sprite: "petCat", price: 50, lv: 2 },
    { id: "rabbit", name: "토끼", sprite: "rabbit", price: 70, lv: 4 },
    { id: "hamster", name: "햄스터", sprite: "hamster", price: 40, lv: 3 },
  ];

  // 밭은 커플 레벨이 오르면 하나씩 열려요.
  const PLOT_UNLOCK = [1, 2, 3, 4, 5, 6, 8, 10, 12];

  // 오늘의 미션: 날짜마다 세 개를 골라요. (두 폰에서 똑같이)
  const MISSIONS = [
    { id: "water2", title: "물 2번 주기", reward: 5 },
    { id: "care2", title: "쓰다듬기 2번", reward: 5 },
    { id: "sing", title: "노래 불러 주기", reward: 5 },
    { id: "heart5", title: "하트 5개 보내기", reward: 5 },
    { id: "quest", title: "오늘의 질문 둘 다 답하기", reward: 8 },
    { id: "mood", title: "둘 다 기분 남기기", reward: 5 },
    { id: "record", title: "기록 1개 남기기", reward: 8 },
    { id: "diary", title: "일기 쓰기", reward: 8 },
    { id: "pest", title: "벌레나 잡초 치우기", reward: 5 },
    { id: "together", title: "둘 다 정원 돌보기", reward: 8 },
    { id: "mini", title: "놀이 한 판 하기", reward: 5 },
    { id: "pet", title: "동물 친구 돌보기", reward: 5 },
    { id: "cook", title: "요리 하나 만들기", reward: 8 },
  ];
  const MISSION_BONUS = 10;
  const WEEKLY = [
    { id: "w-water", title: "이번 주 물 15번", target: 15, reward: 20 },
    { id: "w-together", title: "같이 돌본 날 3일", target: 3, reward: 25 },
    { id: "w-mini", title: "놀이 5판", target: 5, reward: 20 },
    { id: "w-cook", title: "요리 2번", target: 2, reward: 20 },
    { id: "w-gift", title: "선물 1번 보내기", target: 1, reward: 15 },
    { id: "w-attend", title: "둘 다 출석 5일", target: 5, reward: 25 },
  ];

  const ACHIEVEMENTS = [
    { id: "water10", title: "물 10번 주기", stat: "water", target: 10, reward: 10 },
    { id: "water100", title: "물 100번 주기", stat: "water", target: 100, reward: 50 },
    { id: "care20", title: "쓰다듬기 20번", stat: "care", target: 20, reward: 15 },
    { id: "sing10", title: "노래 10번", stat: "sing", target: 10, reward: 15 },
    { id: "together3", title: "같이 돌본 날 3일", stat: "together", target: 3, reward: 20 },
    { id: "together14", title: "같이 돌본 날 14일", stat: "together", target: 14, reward: 60 },
    { id: "bug5", title: "벌레 5마리 잡기", stat: "bugs", target: 5, reward: 15 },
    { id: "weed5", title: "잡초 5개 뽑기", stat: "weeds", target: 5, reward: 10 },
    { id: "harvest1", title: "첫 수확", stat: "harvests", target: 1, reward: 20 },
    { id: "harvest10", title: "10번 수확", stat: "harvests", target: 10, reward: 80 },
    { id: "gold1", title: "금빛 수확", stat: "gold", target: 1, reward: 30 },
    { id: "book3", title: "도감 3종", stat: "book", target: 3, reward: 30 },
    { id: "book10", title: "도감 완성", stat: "book", target: 10, reward: 200 },
    { id: "cook3", title: "요리 3번", stat: "cooks", target: 3, reward: 20 },
    { id: "recipes5", title: "요리법 5가지", stat: "recipes", target: 5, reward: 50 },
    { id: "gift3", title: "선물 3번 주고받기", stat: "gifts", target: 3, reward: 25 },
    { id: "decor3", title: "꾸미기 3개 놓기", stat: "decor", target: 3, reward: 20 },
    { id: "petlv5", title: "동물 친구 레벨 5", stat: "petLevel", target: 5, reward: 40 },
    { id: "mini30", title: "놀이 최고 점수 30점", stat: "miniBest", target: 30, reward: 20 },
    { id: "mini20", title: "놀이 20판", stat: "minis", target: 20, reward: 30 },
    { id: "attend7", title: "둘 다 출석 7일", stat: "attendBoth", target: 7, reward: 30 },
    { id: "mission10", title: "오늘의 미션 다 깬 날 10일", stat: "missionDays", target: 10, reward: 50 },
    { id: "plots4", title: "밭 4칸 열기", stat: "plots", target: 4, reward: 20 },
    { id: "record10", title: "기록 10개", stat: "entries", target: 10, reward: 30 },
    { id: "diary7", title: "일기 7개", stat: "diary", target: 7, reward: 25 },
    { id: "heart100", title: "하트 100개 보내기", stat: "hearts", target: 100, reward: 20 },
    { id: "photo5", title: "정원 사진 5장", stat: "snaps", target: 5, reward: 15 },
  ];

  // 레벨마다 받는 선물
  const LEVEL_REWARDS = {
    2: { fert: 2, petfood: 2 }, 3: { spray: 2, stake: 1 }, 4: { fert2: 1, tonic: 1 }, 5: { "decor:signpost": 1, fert: 3 },
    6: { "skin:mint": 1, fert2: 1 }, 7: { "decor:lantern": 1, spray: 2 }, 8: { fert2: 2, petfood: 5 }, 9: { "decor:bench": 1 },
    10: { "skin:gold": 1, fert2: 2 }, 11: { tonic: 3 }, 12: { "decor:fountain": 1 }, 13: { fert2: 3 }, 14: { "decor:windmill": 1 }, 15: { "decor:swing": 1, fert2: 3 },
  };
  const LEVEL_TITLES = ["", "씨앗 커플", "새싹 커플", "떡잎 커플", "꽃봉오리 커플", "꽃 커플", "열매 커플", "나무 커플", "숲 커플", "무지개 커플", "별빛 커플", "달빛 커플", "은하수 커플", "우주 커플", "전설의 커플", "영원한 커플"];

  const MINIGAMES = [
    { id: "catch", name: "하트 받기", desc: "바구니를 움직여 떨어지는 하트를 받아요. 벌레는 피해요.", cap: 30 },
    { id: "whack", name: "벌레 잡기", desc: "구멍에서 나오는 벌레를 빨리 눌러요. 새싹은 누르면 안 돼요.", cap: 30 },
    { id: "rhythm", name: "물주기 박자", desc: "물방울이 화분 위에 왔을 때 눌러요.", cap: 25 },
    { id: "memory", name: "짝 맞추기", desc: "같은 그림 두 장을 찾아요. 빨리 찾을수록 점수가 높아요.", cap: 25 },
  ];

  window.GameData = {
    SPECIES, ORDER, STAGE_NAMES, STEPS, QUALITY, ITEMS, STARTER, RECIPES, DECOR, DECOR_SLOTS, POTS, PETS,
    PLOT_UNLOCK, MISSIONS, MISSION_BONUS, WEEKLY, ACHIEVEMENTS, LEVEL_REWARDS, LEVEL_TITLES, MINIGAMES,
  };
})();
