// ============================================================
// 우리 이야기: 두 사람이 기록하고, 할 일을 정하고, 해내고, 일기를 쓸 때마다
// 그 내용에 맞는 짧은 이야기가 펼쳐져요. 가끔은 커플 동물 잠옷을 선물로 받아요.
// - 이야기는 저장된 기록에서 계산해요. 그래서 두 폰이 늘 같은 이야기와 같은 잠옷을 가져요.
// - 이 폰에서 아직 못 본 이야기는 알림으로 띄워요. (상대가 기록한 이야기도요)
// ============================================================
(function () {
  "use strict";

  const cfg = typeof DIARY_CONFIG !== "undefined" ? DIARY_CONFIG : {};
  const NAME = { him: cfg.him || "석영", her: cfg.her || "예은" };
  const SEEN = "hsd.seen";
  const S = () => window.FSprites;

  function batchim(s) { const c = String(s).charCodeAt(String(s).length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0; }
  const call = (w) => (batchim(NAME[w]) ? NAME[w] + "이" : NAME[w]);
  const ga = (w) => call(w) + "가";
  const eul = (s) => s + (batchim(s) ? "을" : "를");
  const eseo = (s) => s + "에서";
  const other = (w) => (w === "him" ? "her" : "him");
  function cut(s, n) { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n) + "…" : s; }
  function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  const pick = (list, seed) => list[hash(seed) % list.length];
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }

  // ---------- 잠옷 선물 규칙 (내용에 어울리게) ----------
  const GIFTS = [
    { id: "bunny", when: (c) => c.date === 1, why: "첫 데이트 기록" },
    { id: "pig", when: (c) => c.food === 1, why: "첫 맛집 기록" },
    { id: "cat", when: (c) => c.cafe === 1, why: "첫 카페 기록" },
    { id: "fox", when: (c) => c.travel === 1, why: "첫 여행 기록" },
    { id: "bear", when: (c) => c.anniv === 1, why: "첫 기념일 기록" },
    { id: "chick", when: (c) => c.diary === 1, why: "첫 일기" },
    { id: "frog", when: (c) => c.plan === 1, why: "첫 할 일" },
    { id: "deer", when: (c) => c.done === 1, why: "처음 해낸 할 일" },
    { id: "koala", when: (c) => c.cafe === 3, why: "카페 기록 3개" },
    { id: "hippo", when: (c) => c.food === 3, why: "맛집 기록 3개" },
    { id: "penguin", when: (c) => c.travel === 2, why: "여행 기록 2개" },
    { id: "sheep", when: (c) => c.rec === 5, why: "기록 5개" },
    { id: "panda", when: (c) => c.diary === 3, why: "일기 3개" },
    { id: "dino", when: (c) => c.done === 3, why: "해낸 할 일 3개" },
    { id: "tiger", when: (c) => c.rec === 10, why: "기록 10개" },
    { id: "puppy", when: (c) => c.rec === 20, why: "기록 20개" },
  ];

  // ---------- 기록 → 이야기 장면 ----------
  // 줄: [누가(him/her/n), 말]
  function entryLines(e, by) {
    const o = other(by);
    const place = cut(e.place, 14), title = cut(e.title, 18), memo = cut(e.memo, 30);
    const at = place || title || "그곳";
    const T = {
      date: [
        [by, pick([`${eseo(at)} 보낸 하루, 계속 생각나.`, `오늘 ${title || "데이트"}, 진짜 좋았다.`, `${eseo(at)} 같이 걸었던 거 기억할 거야.`], e.id)],
        [o, pick(["나도! 다음에 또 가자.", "오늘 웃은 거 다 적어 둘래.", "너랑 있으면 시간이 너무 빨라."], e.id + "o")],
      ],
      food: [
        [by, pick([`${place ? place + "의 " : ""}${title || "그 메뉴"}, 진짜 맛있었지?`, `${eseo(at)} 먹은 거 또 생각나.`, `오늘 먹은 ${title || "거"} 내 인생 맛집 후보야.`], e.id)],
        [o, pick(["배불러서 굴러갈 뻔했어.", "다음엔 다른 메뉴도 먹어 보자!", "같이 먹으니까 더 맛있었어."], e.id + "o")],
      ],
      cafe: [
        [by, pick([`${eseo(at)} 마신 커피 향이 아직 남아 있어.`, `${at} 분위기 너무 좋았다.`, `${eseo(at)} 수다 떤 거 재밌었어.`], e.id)],
        [o, pick(["다음엔 디저트도 먹어 보자.", "창가 자리 최고였어.", "너랑 마시는 커피가 제일 맛있어."], e.id + "o")],
      ],
      travel: [
        [by, pick([`${at} 여행! 사진 보면 또 가고 싶어.`, `${eseo(at)} 본 풍경 잊지 못할 거야.`, `${at}, 우리 둘만의 여행지가 됐다.`], e.id)],
        [o, pick(["다음 여행은 어디로 갈까?", "또 짐 싸서 떠나자!", "같이 걸은 길 다 기억나."], e.id + "o")],
      ],
      anniv: [
        [by, `${title || "우리 기념일"}, 축하해!`],
        [o, pick(["앞으로도 계속 같이 기념하자.", "고마워, 늘 옆에 있어 줘서.", "다음 기념일도 기대돼."], e.id + "o")],
      ],
      etc: [
        [by, `${title ? `"${title}"` : "오늘 일"} 적어 뒀어.`],
        [o, pick(["이런 것도 우리 이야기지.", "작은 일도 같이 남기니까 좋다.", "읽으니까 또 웃음 나."], e.id + "o")],
      ],
    };
    const L = (T[e.category] || T.etc).slice();
    if (memo) L.splice(1, 0, ["n", `메모에는 "${memo}" 라고 적혀 있어요.`]);
    return L;
  }
  const CAT_NAME = { date: "데이트", food: "맛집", cafe: "카페", travel: "여행", anniv: "기념일", etc: "기록" };

  function beats() {
    const St = window.Store;
    if (!St) return [];
    const out = [];
    St.list("entries").forEach((e) => {
      if (!e.c) return;
      const by = e.by === "her" ? "her" : e.by === "him" ? "him" : "him";
      out.push({ id: "e:" + e.id, at: e.c, by, kind: e.category || "etc", head: `${ga(by)} ${eul(CAT_NAME[e.category] || "기록")} 남겼어요`, lines: entryLines(e, by) });
    });
    St.list("plans").forEach((p) => {
      const title = cut(p.title, 18) || "할 일";
      if (p.c) {
        const by = p.by === "her" ? "her" : "him";
        out.push({ id: "p:" + p.id, at: p.c, by, kind: "plan", head: `${ga(by)} 할 일을 정했어요`, lines: [[by, `할 거에 "${title}" 넣었어! 꼭 같이 하자.`], [other(by), pick(["좋아, 약속!", "벌써 기대돼.", "언제 할지 정하자!"], p.id)]] });
      }
      if (p.done && p.dn) {
        const by = p.dby === "her" ? "her" : "him";
        out.push({ id: "pd:" + p.id, at: p.dn, by, kind: "done", head: `할 일 하나를 해냈어요`, lines: [[by, `"${title}" 해냈다!`], [other(by), pick(["하나씩 이뤄 가는 거 너무 좋아.", "우리 최고야!", "다음 것도 같이 하자."], p.id + "d")]] });
      }
    });
    St.list("diary").forEach((d) => {
      if (!d.c) return;
      const by = d.author === "her" ? "her" : "him";
      out.push({ id: "d:" + d.id, at: d.c, by, kind: "diary", head: `${ga(by)} 일기를 썼어요`, lines: [["n", `${call(by)}의 일기: "${cut(d.text || "사진 한 장", 34)}"`], [other(by), pick(["읽었어. 고마워.", "나도 같은 마음이야.", "이 일기 오래 간직할래."], d.id)]] });
    });
    St.list("cal").forEach((e) => {
      if (!e.c) return;
      const by = e.by === "her" ? "her" : "him";
      const d = /^(\d{4})-(\d{2})-(\d{2})/.exec(e.date || "");
      const when = d ? `${+d[2]}월 ${+d[3]}일` : "";
      out.push({ id: "c:" + e.id, at: e.c, by, kind: "cal", head: `${ga(by)} 일정을 적었어요`, lines: [[by, `${when}에 "${cut(e.title, 18)}" 적어 뒀어${e.who === "both" ? ". 같이 하자!" : "."}`], [other(by), pick(["알겠어, 기억할게!", "그날 기대된다.", "달력에 표시해 둘게."], e.id)]] });
    });
    out.sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : 1));
    // 선물 계산
    const c = { date: 0, food: 0, cafe: 0, travel: 0, anniv: 0, etc: 0, rec: 0, diary: 0, plan: 0, done: 0 };
    const given = {};
    let extra = 0;
    out.forEach((b) => {
      if (b.id[0] === "e") { c[b.kind] = (c[b.kind] || 0) + 1; c.rec++; }
      else if (b.kind === "plan") c.plan++;
      else if (b.kind === "done") c.done++;
      else if (b.kind === "diary") c.diary++;
      // 선물은 꾸미기(js/deco.js)의 해금 규칙이 따로 챙겨요
    });
    return out;
  }
  function owned() { return window.Deco ? Deco.ownedPajamas() : []; }

  // ---------- 본 이야기 ----------
  function seenSet() { try { return JSON.parse(localStorage.getItem(SEEN) || "null"); } catch (e) { return null; } }
  function saveSeen(set) { try { localStorage.setItem(SEEN, JSON.stringify(set)); } catch (e) { /* 그냥 둬요 */ } }
  function unseen() {
    let set = seenSet();
    const all = beats();
    if (!set) {
      // 이 폰에서 처음이면 사흘 넘은 이야기는 본 걸로 해요
      set = {};
      const old = Date.now() - 3 * 86400000;
      all.forEach((b) => { if (b.at < old) set[b.id] = 1; });
      saveSeen(set);
    }
    return all.filter((b) => !set[b.id]);
  }
  function markSeen(ids) { const set = seenSet() || {}; ids.forEach((i) => { set[i] = 1; }); saveSeen(set); }

  // ---------- 지금 입은 잠옷 ----------
  function wearOf(who) {
    const St = window.Store;
    const v = St && St.pair("wear", who);
    return v && (window.Deco ? Deco.ownedPajamas() : owned()).indexOf(v) >= 0 ? v : "";
  }
  let wearCache = { t: 0, v: {} };
  window.HSWear = (who) => {
    const now = Date.now();
    if (now - wearCache.t > 1500) { wearCache = { t: now, v: { him: wearOf("him"), her: wearOf("her") } }; }
    return wearCache.v[who] || "";
  };
  function setWear(id) {
    const me = window.Store && Store.me();
    if (!me) return;
    Store.setPair("wear", me, id || "");
    wearCache.t = 0;
  }
  const pjName = (id) => { const p = S() && S().PJ[id]; return p ? p.name + " 잠옷" : ""; };

  // ---------- 화면 ----------
  let root = null, queue = [], cur = null, li = 0, typing = 0, onDone = null;
  function ensure() {
    if (root) return root;
    root = document.createElement("div");
    root.className = "tale";
    root.hidden = true;
    root.innerHTML = `<div class="tale-dim"></div>
      <div class="tale-box" role="dialog" aria-live="polite">
        <div class="tale-head" id="taleHead"></div>
        <div class="tale-body">
          <span class="tale-face"><img class="px" alt="" id="taleFace"></span>
          <div class="tale-text"><b class="tale-name" id="taleName"></b><p id="taleLine"></p></div>
        </div>
        <div class="tale-gift" id="taleGift" hidden></div>
        <div class="tale-btns" id="taleBtns"></div>
        <i class="tale-more" id="taleMore">▼</i>
      </div>`;
    document.body.appendChild(root);
    root.addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-tale]");
      if (b) { ev.stopPropagation(); onBtn(b.dataset.tale, b.dataset.k); return; }
      if (root.classList.contains("closet")) { if (ev.target.closest(".tale-dim")) close(); return; }
      if (ev.target.closest(".tale-box") || ev.target.closest(".tale-dim")) next();
    });
    return root;
  }
  const $ = (id) => document.getElementById(id);
  function typeLine(text) {
    clearInterval(typing);
    const p = $("taleLine");
    let i = 0;
    p.textContent = "";
    p.dataset.full = text;
    typing = setInterval(() => {
      i += 2;
      p.textContent = text.slice(0, i);
      if (i >= text.length) { clearInterval(typing); typing = 0; }
    }, 28);
  }
  function showLine() {
    const [who, text] = cur.lines[li];
    const face = $("taleFace");
    if (who === "n") { face.parentNode.hidden = true; $("taleName").textContent = ""; }
    else {
      face.parentNode.hidden = false;
      face.src = S().charImg(who, "down", 0, "", li % 2 ? "happy" : "");
      $("taleName").textContent = NAME[who];
    }
    $("taleGift").hidden = true;
    $("taleBtns").innerHTML = "";
    $("taleMore").hidden = false;
    typeLine(text);
    const ca = window.CharAnim;
    if (ca && ca.play && li === 0) ca.play(cur.kind === "anniv" || cur.kind === "done" ? "hug" : cur.kind === "travel" ? "dance" : cur.kind === "diary" ? "look" : "wave");
  }
  function showGift() {
    const id = cur.gift, P = S().PJ[id];
    $("taleFace").parentNode.hidden = true;
    $("taleName").textContent = "";
    typeLine(`선물이 도착했어요! 두 사람의 커플 ${P.name} 잠옷이에요.`);
    $("taleGift").hidden = false;
    $("taleGift").innerHTML = `<img class="px" alt="" src="${S().charImg("him", "down", 0, "wave1", "happy", id)}"><img class="px" alt="" src="${S().charImg("her", "down", 0, "wave1", "happy", id)}">`;
    $("taleBtns").innerHTML = `<button class="btn" data-tale="later">다음에</button><button class="btn primary" data-tale="wear" data-k="${id}">지금 입기</button>`;
    $("taleMore").hidden = true;
    const h = window.HSD;
    if (h && h.burst) { const r = $("taleGift").getBoundingClientRect(); h.burst(r.left + r.width / 2, r.top + r.height / 2, 14, "heart"); }
  }
  function openBeat(b) {
    cur = b; li = 0;
    $("taleHead").textContent = b.head;
    showLine();
  }
  function next() {
    if (!cur) return;
    if (typing) { clearInterval(typing); typing = 0; $("taleLine").textContent = $("taleLine").dataset.full; return; }
    if (!$("taleGift").hidden) return;
    if (li < cur.lines.length - 1) { li++; showLine(); return; }
    if (cur.gift && $("taleGift").hidden && !cur._gifted) { cur._gifted = 1; showGift(); return; }
    advance();
  }
  function advance() {
    markSeen([cur.id]);
    if (queue.length) { openBeat(queue.shift()); return; }
    close();
  }
  function onBtn(k, v) {
    if (k === "wear") { setWear(v); const h = window.HSD; if (h && h.toast) h.toast(`${pjName(v)}을 입었어요`); refreshArt(); }
    if (k === "later" || k === "wear") { advance(); return; }
    if (k === "ask-yes" || k === "ask-no") { const f = askFn; askFn = null; close(); if (f) f(k === "ask-yes"); return; }
  }
  function refreshArt() { wearCache.t = 0; document.dispatchEvent(new CustomEvent("hsd:wear")); }
  function close() {
    clearInterval(typing); typing = 0;
    // 뒤로 가기로 닫아도, 내가 방금 남긴 이야기는 본 걸로 해요 (안 그러면 닫자마자 다시 떠요)
    if (cur) { const who = window.Store && Store.me(); markSeen([cur.id].concat(queue.filter((b) => b.by === who).map((b) => b.id))); queue = []; }
    if (root) { root.classList.add("closing"); setTimeout(() => { root.hidden = true; root.classList.remove("closing", "closet"); }, 160); }
    cur = null;
    askFn = null;
    hideBanner();
    setTimeout(() => document.dispatchEvent(new Event("hsd:layer")), 170);
    const f = onDone; onDone = null; if (f) f();
  }
  const layer = () => document.dispatchEvent(new Event("hsd:layer"));
  function play(list) {
    if (!list.length) return;
    ensure();
    queue = list.slice(1);
    root.hidden = false;
    root.classList.remove("closet");
    openBeat(list[0]);
    layer();
  }

  // ---------- 알림 (못 본 이야기) ----------
  let banner = null;
  function hideBanner() { if (banner) banner.hidden = true; }
  function notify() {
    const me = window.Store && Store.me();
    if (!me || (root && !root.hidden)) return;
    if (document.querySelector(".modal:not([hidden])") || document.body.classList.contains("game-open")) return;
    const mineCal = unseen().filter((b) => b.kind === "cal" && b.by === me).map((b) => b.id);
    if (mineCal.length) markSeen(mineCal);
    const list = unseen();
    if (!list.length) { hideBanner(); return; }
    const mine = list.filter((b) => b.by === me && Date.now() - b.at < 60000);
    if (mine.length === list.length) { play(list); return; }
    if (!banner) {
      banner = document.createElement("button");
      banner.className = "tale-banner";
      banner.addEventListener("click", () => { hideBanner(); play(unseen()); });
      document.body.appendChild(banner);
    }
    const fromPartner = list.find((b) => b.by !== me);
    const gift = list.some((b) => b.gift);
    banner.innerHTML = `<b>새 이야기 ${list.length}개</b><span>${esc(fromPartner ? `${ga(fromPartner.by)} 남긴 이야기가 도착했어요` : "우리 이야기가 이어졌어요")}${gift ? " · 선물도 있어요" : ""}</span>`;
    banner.hidden = false;
  }

  // ---------- 물어보기 (새 폰 허락 같은 것) ----------
  let askFn = null;
  function ask(text, yes, no, fn) {
    ensure();
    askFn = fn;
    root.hidden = false;
    layer();
    root.classList.add("closet");
    cur = null;
    $("taleHead").textContent = "알림";
    $("taleFace").parentNode.hidden = true;
    $("taleName").textContent = "";
    $("taleLine").textContent = text;
    $("taleMore").hidden = true;
    $("taleGift").hidden = true;
    $("taleBtns").innerHTML = `<button class="btn" data-tale="ask-no">${esc(no)}</button><button class="btn primary" data-tale="ask-yes">${esc(yes)}</button>`;
  }

  // 옷장은 꾸미기 창(js/deco.js)에 있어요
  function closet() { if (window.Deco) Deco.open("pj"); }

  window.Tale = { back: () => close(), ask, beats, owned, unseen, markSeen, notify, play, closet, wearOf, setWear, GIFTS, isOpen: () => !!(root && !root.hidden && !root.classList.contains("closing")) };
})();
