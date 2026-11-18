// ============================================================
// 꽃마루 정원: 우리 이야기
// 두 사람이 앱에 남긴 기록(데이트, 맛집, 여행, 일기, 질문 답, 해낸 할 일)을
// 정원 친구들이 읽고 이야기로 들려줘요. 기록이 쌓일수록 추억 나무가 자라요.
// ============================================================
(function () {
  "use strict";

  const cfg = typeof DIARY_CONFIG !== "undefined" ? DIARY_CONFIG : {};
  const NAME = { him: cfg.him || "석영", her: cfg.her || "예은" };
  function batchim(s) { const c = String(s).charCodeAt(String(s).length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0; }
  function call(w) { const n = NAME[w] || ""; return batchim(n) ? n + "이" : n; }
  function eul(s) { return s + (batchim(s) ? "을" : "를"); }
  function wa(s) { return s + (batchim(s) ? "과" : "와"); }
  function pad(n) { return String(n).padStart(2, "0"); }
  function parse(s) { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ""); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
  function md(s) { const d = parse(s); return d ? `${d.getMonth() + 1}월 ${d.getDate()}일` : ""; }
  function cut(s, n) { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n) + "…" : s; }
  function pick(list, seed) { let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0; return list[h % list.length]; }
  const MOOD = ["", "최고", "좋아", "그냥", "슬퍼", "힘들어"];

  // 기록 종류별 친구 반응
  const REACT = {
    date: [
      "{t}! 둘이 데이트한 날은 정원 꽃도 더 잘 펴.",
      "{p}에서 데이트했다며? 손 꼭 잡고 다녔어?",
      "{t}. 그날 하늘은 어땠어? 나중에 꼭 얘기해 줘.",
    ],
    food: [
      "{p}의 {t}! 맛있었어? 냄새만이라도 맡고 싶다.",
      "{t} 먹으러 갔다며. 다음엔 나도 데려가 줘.",
      "맛있는 건 둘이 먹을 때 두 배로 맛있대. {t}도 그랬지?",
    ],
    cafe: [
      "{p}에서 커피 마셨다며. 둘이 무슨 얘기 했어?",
      "{t}. 창가 자리였어? 할머니도 창가를 좋아했어.",
    ],
    travel: [
      "{p}까지 여행을 갔다고? 할머니 할아버지가 못 간 곳을 너희가 가는구나.",
      "{t}! 지도에 꽃 스티커 하나 붙여 둘게.",
      "여행 가서 찍은 사진, 정원 오두막 벽에 걸어 두자.",
    ],
    anniv: [
      "{t}! 축하해. 오늘은 정원도 잔치야.",
      "{t}. 이런 날은 꽃 한 송이씩 같이 심는 거래.",
    ],
    etc: [
      "{t}. 그날도 잘 적어 뒀구나.",
      "작은 하루도 적어 두면 나중에 큰 이야기가 돼. {t}처럼.",
    ],
  };
  const REACT_LOVE = "둘 다 하트를 잔뜩 줬네. 진짜 좋았나 보다.";

  function entryLine(e) {
    const list = REACT[e.category] || REACT.etc;
    const p = e.place || e.title || "거기";
    return pick(list, e.id).replace(/\{t\}/g, e.title || "그날").replace(/\{p\}/g, p);
  }

  // 모든 기록을 날짜순 추억으로
  function memories() {
    if (!window.Store) return [];
    const out = [];
    try {
      Store.list("entries").forEach((e) => {
        if (!e.title && !e.place) return;
        const hh = Number(Store.pair("h:" + e.id, "him")) || 0, he = Number(Store.pair("h:" + e.id, "her")) || 0;
        out.push({ id: "e:" + e.id, kind: "entry", cat: e.category || "etc", date: e.date || "", title: e.title || e.place, place: e.place || "", love: hh >= 4 && he >= 4, photo: (e.photos || [])[0] || "", raw: e });
      });
      Store.list("diary").forEach((d) => {
        out.push({ id: "d:" + d.id, kind: "diary", date: d.date || "", author: d.author || "", text: d.text || "", photo: (d.photos || [])[0] || "", raw: d });
      });
      Store.list("plans").forEach((p) => {
        if (p.done) out.push({ id: "p:" + p.id, kind: "plan", cat: p.category || "etc", date: "", title: p.title || "", raw: p });
      });
      Store.pairKeys("q:").forEach((k) => {
        const a = Store.pair(k, "him"), b = Store.pair(k, "her");
        if (a && b) out.push({ id: k, kind: "answer", date: k.slice(2), a, b });
      });
    } catch (e) { /* 기록을 못 읽으면 빈 이야기 */ }
    out.sort((x, y) => (x.date || "9999").localeCompare(y.date || "9999"));
    return out;
  }

  // 추억 하나를 대화로 (말하는 사람은 지금 정원의 친구)
  function scene(m, npc) {
    if (m.kind === "entry") {
      const head = m.cat === "anniv" ? "기념일 기록이 왔다냥!" : "새 추억이 도착했다냥!";
      const lines = [["우편냥", `${head} ${md(m.date) ? md(m.date) + ", " : ""}${m.place && !String(m.title).includes(m.place) ? m.place + "에서 " : ""}${m.title}.`], [npc, entryLine(m.raw)]];
      if (m.love) lines.push([npc, REACT_LOVE]);
      return lines;
    }
    if (m.kind === "diary") {
      const who = m.author === "her" || m.author === "him" ? call(m.author) + "가" : "누군가";
      const txt = cut(m.text, 60) || "사진 한 장";
      return [["우편냥", `${who} 일기를 썼다냥.`], ["편지", `${md(m.date)}\n\n${txt}`], [npc, pick(["예쁜 하루였구나.", "이 일기, 달래 할머니 일기장 옆에 꽂아 둘게.", "읽으니까 마음이 따뜻해져.", "둘이 이렇게 하루를 적는 거, 정원이 제일 좋아하는 거야."], m.id)]];
    }
    if (m.kind === "plan") {
      return [["우편냥", `하고 싶던 걸 해냈다냥! "${m.title}".`], [npc, pick(["하고 싶은 걸 하나씩 지워 가는 거, 할머니도 좋아했어.", `${m.title}! 다음엔 뭘 할 거야?`, "약속을 지킨 날엔 꽃이 하나 더 펴."], m.id)]];
    }
    if (m.kind === "answer") {
      const qs = window.DIARY_QUESTIONS || [];
      const d = parse(m.date);
      const q = d && qs.length ? qs[Math.floor(d.getTime() / 86400000) % qs.length] : "";
      return [["우편냥", `둘 다 오늘의 질문에 답했다냥.${q ? ` "${q}"` : ""}`], ["편지", `${NAME.him}: ${cut(m.a, 50)}\n\n${NAME.her}: ${cut(m.b, 50)}`], [npc, "서로의 답을 아는 것도 정원 가꾸기랑 비슷해. 천천히, 자주."]];
    }
    return [[npc, "새 추억이 왔어."]];
  }

  // 지나온 기념 순간 (100일마다, 1년마다, 생일, 처음 만난 날)
  function milestones(now) {
    const out = [];
    const start = parse(cfg.startDate), met = parse(cfg.firstMet);
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    if (start) {
      for (let n = 100; n <= 3650; n += 100) {
        const d = new Date(start.getTime() + (n - 1) * 86400000);
        if (d > today) break;
        out.push({ id: `ms:d${n}`, date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, title: `${n}일`, kind: "days", n });
      }
      for (let y = 1; y <= 10; y++) {
        const d = new Date(start); d.setFullYear(start.getFullYear() + y);
        if (d > today) break;
        out.push({ id: `ms:y${y}`, date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, title: `${y}주년`, kind: "year", n: y });
      }
    }
    [["him", cfg.himBirthday], ["her", cfg.herBirthday]].forEach(([w, b]) => {
      const bd = parse(b);
      if (!bd || !start) return;
      for (let y = start.getFullYear(); y <= today.getFullYear(); y++) {
        const d = new Date(y, bd.getMonth(), bd.getDate());
        if (d < start || d > today) continue;
        out.push({ id: `ms:b${w}${y}`, date: `${y}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, title: `${NAME[w]} 생일`, kind: "birthday", who: w });
      }
    });
    if (met) {
      for (let y = 1; y <= 10; y++) {
        const d = new Date(met); d.setFullYear(met.getFullYear() + y);
        if (d > today) break;
        out.push({ id: `ms:m${y}`, date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, title: `처음 만난 지 ${y}년`, kind: "met", n: y });
      }
    }
    return out.sort((a, b) => a.date.localeCompare(b.date));
  }
  function milestoneScene(ms, npc, stats) {
    if (ms.kind === "birthday") {
      return [["", `오늘은 ${NAME[ms.who]} 생일이에요.`], [npc, `${call(ms.who)}, 생일 축하해! 정원 친구들이 꽃다발을 만들었어.`], ["우편냥", "생일 편지는 내가 직접 배달했다냥. 오늘은 무료다냥."]];
    }
    if (ms.kind === "met") {
      return [["", `처음 만난 지 ${ms.n}년이 됐어요.`], [npc, `${md(cfg.firstMet)}, ${cfg.firstPlace || "그곳"}에서 처음 만났다며. 그날 첫마디 기억나?`]];
    }
    const lines = [["", `${ms.kind === "year" ? `사귄 지 ${ms.n}년` : `함께한 지 ${ms.n}일`}이 됐어요.`]];
    lines.push([npc, `벌써 ${ms.title}! 정원 친구들이 다 같이 축하하러 왔어.`]);
    if (stats.total) lines.push([npc, `그동안 적은 추억이 ${stats.total}개래. ${stats.topCat ? `제일 많은 건 ${stats.topCat} ${stats.topN}번.` : ""}`]);
    if (stats.lastPlace) lines.push([npc, `마지막으로 간 곳은 ${stats.lastPlace}였지? 다음엔 어디 갈 거야?`]);
    return lines;
  }

  const CAT_NAME = { date: "데이트", food: "맛집", cafe: "카페", travel: "여행", anniv: "기념일", etc: "기록" };
  function stats(list) {
    const ent = list.filter((m) => m.kind === "entry");
    const by = {};
    ent.forEach((m) => { by[m.cat] = (by[m.cat] || 0) + 1; });
    const top = Object.keys(by).sort((a, b) => by[b] - by[a])[0];
    const last = ent.filter((m) => m.place).slice(-1)[0];
    return { total: list.length, entries: ent.length, topCat: top ? CAT_NAME[top] : "", topN: top ? by[top] : 0, lastPlace: last ? last.place : "" };
  }

  // 추억 나무: 기록이 쌓일수록 자라요
  const TREE = [0, 1, 4, 10, 20, 35, 60, 100, 160, 250];
  const TREE_NAME = ["씨앗", "새싹", "어린 나무", "작은 나무", "나무", "꽃 핀 나무", "큰 나무", "추억 나무", "오래된 추억 나무", "약속의 추억 나무"];
  function treeStage(n) { let s = 0; TREE.forEach((t, i) => { if (n >= t) s = i; }); return s; }

  // 달마다 "우리의 일기" 한 쪽
  function monthPages(now) {
    const list = memories();
    const start = parse(cfg.firstMet) || parse(cfg.startDate);
    if (!start) return [];
    const pages = [];
    const end = new Date(now);
    for (let d = new Date(start.getFullYear(), start.getMonth(), 1); d <= end; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
      const inM = list.filter((m) => (m.date || "").startsWith(key));
      const lines = [];
      if (cfg.firstMet && cfg.firstMet.startsWith(key)) lines.push(`${md(cfg.firstMet)}, ${cfg.firstPlace || "어느 곳"}에서 처음 만났다.`);
      if (cfg.startDate && cfg.startDate.startsWith(key)) lines.push(`${md(cfg.startDate)}, 우리 1일.`);
      const ent = inM.filter((m) => m.kind === "entry" && !/^seed-/.test(m.raw.id));
      const by = {};
      ent.forEach((m) => { (by[m.cat] = by[m.cat] || []).push(m); });
      const parts = Object.keys(by).map((c) => {
        const names = by[c].map((m) => m.place || m.title).filter(Boolean).slice(0, 3);
        return `${CAT_NAME[c]} ${by[c].length}번${names.length ? `(${names.join(", ")})` : ""}`;
      });
      if (parts.length) lines.push(`이번 달엔 ${parts.join(", ")}.`);
      const diaries = inM.filter((m) => m.kind === "diary");
      if (diaries.length) lines.push(`일기 ${diaries.length}편. 그중 한 줄: "${cut(diaries[0].text, 40) || "사진 한 장"}"`);
      const answers = inM.filter((m) => m.kind === "answer");
      if (answers.length) lines.push(`둘이 같이 답한 질문 ${answers.length}개.`);
      try {
        ["him", "her"].forEach((w) => {
          const ms = Store.pairKeys("m:" + key).map((k) => Number(Store.pair(k, w)) || 0).filter(Boolean);
          if (ms.length) {
            const cnt = {}; ms.forEach((v) => { cnt[v] = (cnt[v] || 0) + 1; });
            const top = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0];
            lines.push(`${NAME[w]} 기분은 대체로 '${MOOD[top]}'.`);
          }
        });
      } catch (e) { /* 기분 없음 */ }
      const photo = inM.map((m) => m.photo).filter(Boolean)[0] || "";
      pages.push({ key, title: `${d.getFullYear()}년 ${d.getMonth() + 1}월`, text: lines.length ? lines.join("\n") : "조용한 달. 정원에서 꽃을 돌봤다.", photo, count: inM.length });
    }
    return pages;
  }

  // 정원 친구가 대화 중에 가끔 꺼내는 추억 한마디
  function remark(npc, seed) {
    const list = memories().filter((m) => m.kind === "entry" && m.title);
    if (!list.length) return "";
    const m = pick(list, String(seed));
    return entryLine(m.raw);
  }

  window.GMemory = { memories, scene, milestones, milestoneScene, stats, treeStage, TREE, TREE_NAME, monthPages, remark, call, eul, wa, md };
})();
