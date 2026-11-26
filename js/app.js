// ============================================================
// 석영이와 예은이 — 화면 담당
// 저장은 js/store.js 가 맡고, 여기서는 그리고 누르는 것만 다뤄요.
// 정보는 접어 두고, 누르면 펼쳐지고 다른 곳을 누르면 닫혀요.
// ============================================================
(function () {
  "use strict";

  const cfg = typeof DIARY_CONFIG !== "undefined" ? DIARY_CONFIG : {};
  const QUESTIONS = typeof DIARY_QUESTIONS !== "undefined" ? DIARY_QUESTIONS : [];
  const WHO = { him: cfg.him || "석영", her: cfg.her || "예은" };
  const CATS = { date: "데이트", food: "맛집", cafe: "카페", travel: "여행", anniv: "기념일", etc: "기타" };
  const PLAN_CATS = ["date", "food", "cafe", "travel", "etc"];
  const MOODS = ["", "최고", "좋아", "그냥", "슬퍼", "힘들어"];
  const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
  // 할 거가 비어 있을 때 뽑기에서 대신 나오는 것들
  const IDEAS = {
    date: ["한강 산책", "영화 보기", "보드게임 카페", "전시 보러 가기", "노래방", "자전거 타기", "사진 찍으러 가기", "서점 구경"],
    food: ["떡볶이", "파스타", "삼겹살", "초밥", "마라탕", "칼국수", "피자", "닭갈비"],
    cafe: ["디저트 카페", "루프탑 카페", "북카페", "빵집 투어", "빙수 먹기"],
    travel: ["강릉 바다", "전주 한옥마을", "속초", "경주", "부산", "가평 드라이브"],
    etc: ["같이 요리하기", "집에서 영화", "퍼즐 맞추기", "산책하기", "플레이리스트 만들기"],
  };

  const state = {
    view: "home",
    cat: "all", q: "", sort: "desc",
    planCat: "all",
    openCard: null,
    openPanel: null,
    folded: new Set(),
    ddayMode: 0,
  };
  let quiet = 0; // 화면에서 직접 고친 직후에는 전체를 다시 그리지 않아요.

  const $ = (id) => document.getElementById(id);

  // ---------- 작은 도구 ----------
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }
  function pad(n) {
    return String(n).padStart(2, "0");
  }
  function parseDate(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function keyOf(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  function today0() {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }
  function todayKey() {
    return keyOf(today0());
  }
  function fmt(d) {
    return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} (${DAYS[d.getDay()]})`;
  }
  function fmtDate(s) {
    const d = parseDate(s);
    return d ? fmt(d) : s || "";
  }
  function isOpen(el) {
    return el.classList.contains("is-open");
  }
  function setOpen(el, open) {
    el.classList.toggle("is-open", open);
  }
  function restart(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }
  function play(el, cls) {
    restart(el, cls);
    el.addEventListener("animationend", function done(ev) {
      if (ev.animationName !== cls) return; // 움직임 이름과 클래스 이름이 같아요
      el.classList.remove(cls);
      el.removeEventListener("animationend", done);
    });
  }
  function silently(fn) {
    quiet++;
    try { return fn(); } finally { quiet--; if (typeof talePing === "function") talePing(); }
  }
  function naverSearchUrl(place) {
    return "https://map.naver.com/p/search/" + encodeURIComponent(place);
  }
  function mapUrl(e) {
    if (e.map && /^https?:\/\//i.test(e.map)) return e.map;
    return naverSearchUrl((e.place || "").trim());
  }
  function reduced() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  // ---------- 반짝이 / 알림 ----------
  const SPARK_COLORS = ["#ffd978", "#ee9453", "#a9d8f0", "#b4e2b8", "#ffffff"];
  function fxLayer() {
    let fx = $("fx");
    if (!fx) {
      fx = document.createElement("div");
      fx.id = "fx";
      fx.className = "fx";
      fx.setAttribute("aria-hidden", "true");
      document.body.appendChild(fx);
    }
    return fx;
  }
  // kind: "spark"(별 반짝이) | "heart"(핑크 하트)
  function burst(x, y, n, kind) {
    if (reduced()) return;
    n = n || 6;
    for (let i = 0; i < n; i++) {
      const el = document.createElement("span");
      el.className = "spark";
      const ang = (Math.PI * 2 * i) / n + Math.random() * 0.8;
      const dist = 26 + Math.random() * 30;
      if (kind === "heart") {
        el.innerHTML = PIXEL.sprite("heartOn", i % 2 ? 2 : 1);
        el.style.setProperty("--dx", Math.round(Math.cos(ang) * dist * 0.8) + "px");
        el.style.setProperty("--dy", Math.round(-30 - Math.random() * 46) + "px");
      } else {
        el.innerHTML = PIXEL.icon(i % 2 ? "spark" : "star", i % 2 ? 3 : 1);
        el.style.color = SPARK_COLORS[i % SPARK_COLORS.length];
        el.style.setProperty("--dx", Math.round(Math.cos(ang) * dist) + "px");
        el.style.setProperty("--dy", Math.round(Math.sin(ang) * dist - 14) + "px");
      }
      el.style.left = x + "px";
      el.style.top = y + "px";
      el.addEventListener("animationend", () => el.remove());
      fxLayer().appendChild(el);
    }
  }
  function burstAt(el, n, kind) {
    const r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, n, kind);
  }
  let toastTimer = null;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    setOpen(t, true);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => setOpen(t, false), 2200);
  }

  // ---------- 하트 (석영 / 예은 따로) ----------
  function heartVal(key, who) {
    return Number(Store.pair(key, who)) || 0;
  }
  function avgHearts(id) {
    const vals = ["him", "her"].map((w) => heartVal("h:" + id, w)).filter((v) => v > 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }
  function heartsRow(who, value, attrs) {
    let btns = "";
    for (let i = 1; i <= 5; i++) {
      btns += `<button type="button" class="heart${i <= value ? " on" : ""}" data-v="${i}" aria-label="${WHO[who]} 하트 ${i}개"><span class="h-off">${PIXEL.icon("heart", 3)}</span><span class="h-on">${PIXEL.sprite("heartOn", 3)}</span></button>`;
    }
    return `<div class="hearts" data-who="${who}" ${attrs}><span class="who ${who}">${esc(WHO[who])}</span>${btns}</div>`;
  }
  function heartsBlock(key) {
    return ["him", "her"].map((w) => heartsRow(w, heartVal(key, w), `data-key="${esc(key)}"`)).join("");
  }
  const draftHearts = { him: 0, her: 0 }; // 입력창 안의 하트
  function renderDraftHearts() {
    MORPH($("fHearts"), ["him", "her"].map((w) => heartsRow(w, draftHearts[w], "data-draft")).join(""));
  }
  function paintHearts(row, value) {
    row.querySelectorAll(".heart").forEach((b) => {
      const on = Number(b.dataset.v) <= value;
      if (on && !b.classList.contains("on")) play(b, "boing");
      b.classList.toggle("on", on);
    });
  }
  function onHeartTap(btn) {
    const row = btn.closest(".hearts");
    const who = row.dataset.who;
    const n = Number(btn.dataset.v);
    let value;
    if (row.hasAttribute("data-draft")) {
      value = draftHearts[who] === n ? 0 : n;
      draftHearts[who] = value;
    } else {
      const key = row.dataset.key;
      value = heartVal(key, who) === n ? 0 : n;
      silently(() => Store.setPair(key, who, value));
      const card = row.closest(".card");
      if (card) paintMiniHeart(card);
    }
    paintHearts(row, value);
    if (value) burstAt(btn, 5, "heart");
  }
  function miniHeartHtml(id) {
    const avg = avgHearts(id);
    return avg ? `${PIXEL.sprite("heartOn", 2)}${avg % 1 ? avg.toFixed(1) : avg}` : "";
  }
  function paintMiniHeart(card) {
    const el = card.querySelector(".mini-heart");
    if (el) MORPH(el, miniHeartHtml(card.dataset.id));
  }

  // ---------- 사진 ----------
  async function shrink(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = url;
      });
      const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.naturalWidth * k));
      c.height = Math.max(1, Math.round(img.naturalHeight * k));
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      return await new Promise((resolve) => c.toBlob(resolve, "image/jpeg", 0.84));
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  // 입력창 안의 사진 고르기 칸
  let picker = null; // { el, photos }
  function setPicker(el, photos) {
    picker = { el, photos: (photos || []).slice() };
    renderPicker();
  }
  function renderPicker() {
    if (!picker) return;
    picker.el.innerHTML =
      picker.photos.map((name, i) => `<div class="thumb"><img src="${esc(Store.photoUrl(name))}" alt=""><button type="button" data-rm="${i}" aria-label="사진 빼기">${PIXEL.icon("close", 2)}</button></div>`).join("") +
      `<button type="button" class="thumb add" data-add>${PIXEL.icon("camera", 3)}<b>추가</b></button>`;
  }
  async function onFiles(files) {
    if (!picker || !files.length) return;
    toast("사진 준비 중");
    for (const f of Array.from(files)) {
      try {
        const blob = await shrink(f);
        if (blob) picker.photos.push(await Store.addPhoto(blob));
      } catch (e) {
        toast("못 읽는 사진이 있어요");
      }
      renderPicker();
    }
    toast(`사진 ${picker.photos.length}장`);
  }
  function galleryHtml(photos, alt) {
    photos = (photos || []).filter(Boolean);
    if (!photos.length) return "";
    const imgs = photos.map((name, i) => `<img src="${esc(Store.photoUrl(name))}" alt="${esc(alt || "")}" data-i="${i}" loading="lazy" onerror="this.classList.add('broken')">`).join("");
    const many = photos.length > 1;
    return `<div class="gallery" data-photos="${esc(JSON.stringify(photos))}">
      <div class="gallery-track">${imgs}</div>
      ${many ? `<span class="gallery-count">1/${photos.length}</span><div class="gallery-dots">${photos.map((_, i) => `<i${i ? "" : ' class="on"'}></i>`).join("")}</div>` : ""}
    </div>`;
  }
  let galleryRaf = 0;
  function onGalleryScroll(track) {
    cancelAnimationFrame(galleryRaf);
    galleryRaf = requestAnimationFrame(() => {
      const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      const n = track.children.length;
      const box = track.parentNode;
      const count = box.querySelector(".gallery-count");
      if (count) count.textContent = `${Math.min(n, i + 1)}/${n}`;
      box.querySelectorAll(".gallery-dots i").forEach((d, k) => d.classList.toggle("on", k === i));
    });
  }
  function openLightbox(photos, index) {
    const lb = $("lightbox");
    $("lightboxTrack").innerHTML = photos.map((name) => `<img src="${esc(Store.photoUrl(name))}" alt="">`).join("");
    $("lightboxCount").textContent = `${index + 1}/${photos.length}`;
    $("lightboxCount").hidden = photos.length < 2;
    lb.hidden = false;
    document.body.classList.add("no-scroll");
    Nav.sync();
    const track = $("lightboxTrack");
    track.scrollLeft = track.clientWidth * index;
  }
  function closeLightbox() {
    $("lightbox").hidden = true;
    document.body.classList.remove("no-scroll");
    Nav.sync();
  }

  // ---------- 날짜 계산 ----------
  function daysTogether() {
    const start = parseDate(cfg.startDate);
    if (!start) return null;
    return Math.round((today0() - start) / 86400000) + 1; // 사귄 날이 1일
  }
  function nextYearly(md, today) {
    let d = new Date(today.getFullYear(), md.getMonth(), md.getDate());
    if (d < today) d = new Date(today.getFullYear() + 1, md.getMonth(), md.getDate());
    return d;
  }
  function upcomingEvents() {
    const today = today0();
    const events = [];
    const start = parseDate(cfg.startDate);
    if (start) {
      const passed = Math.round((today - start) / 86400000) + 1;
      const nextHundred = Math.max(100, Math.ceil(passed / 100) * 100);
      events.push({ icon: "star", name: `${nextHundred}일`, date: new Date(start.getFullYear(), start.getMonth(), start.getDate() + nextHundred - 1) });
      const ann = nextYearly(start, today);
      const years = ann.getFullYear() - start.getFullYear();
      if (years > 0) events.push({ icon: "flag", name: `${years}주년`, date: ann });
    }
    const hb = parseDate(cfg.himBirthday);
    if (hb) events.push({ icon: "anniv", name: `${WHO.him} 생일`, date: nextYearly(hb, today) });
    const sb = parseDate(cfg.herBirthday);
    if (sb) events.push({ icon: "anniv", name: `${WHO.her} 생일`, date: nextYearly(sb, today) });
    events.forEach((ev) => { ev.left = Math.round((ev.date - today) / 86400000); });
    events.sort((a, b) => a.date - b.date);
    return events;
  }
  // D+ 숫자를 누를 때마다 다른 단위로 보여 줘요.
  function ddayText() {
    const days = daysTogether();
    if (days == null) return "";
    if (days <= 0) return `D${days - 1}`;
    const start = parseDate(cfg.startDate);
    const now = today0();
    switch (state.ddayMode % 4) {
      case 1: return `${Math.floor(days / 7)}주 ${days % 7}일`;
      case 2: {
        let months = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth();
        if (now.getDate() < start.getDate()) months--;
        const anchor = new Date(start.getFullYear(), start.getMonth() + months, start.getDate());
        return `${months}개월 ${Math.round((now - anchor) / 86400000)}일`;
      }
      case 3: return `${(days * 24).toLocaleString("ko-KR")}시간`;
      default: return `D+${days}`;
    }
  }

  // ---------- 머리 ----------
  function renderHeader() {
    if (cfg.title) {
      document.title = cfg.title;
    }
    // 이름표: 며칠째인지와 다음 주년까지 남은 날
    const start = parseDate(cfg.startDate);
    let nx = "";
    if (start) {
      const ann = nextYearly(start, today0());
      const years = ann.getFullYear() - start.getFullYear();
      const left = Math.round((ann - today0()) / 86400000);
      if (years > 0) nx = left === 0 ? `오늘 ${years}주년!` : `${years}주년 D-${left}`;
    }
    const bm = window.Deco ? Deco.ban().m : 0;
    state.ddayMode = [0, 0, 1, 2, 3][bm] || 0;
    const text = ddayText();
    const html = `<i>${esc(text)}</i>` + (nx && bm === 0 ? `<i>${esc(nx)}</i>` : "");
    if (window.Deco) Deco.apply();
    if ($("dday").innerHTML !== html) $("dday").innerHTML = html;
  }

  // ---------- 풍경 ----------
  let bubbleIdx = 0;
  let bubbleTimer = null;
  function partnerOf(who) {
    return who === "him" ? "her" : "him";
  }
  function bubbleLines(who) {
    const lines = window.Scene ? Scene.lines().slice(0, 3) : [];
    const days = daysTogether();
    if (days > 0) lines.push(`오늘로 ${days}일째야`);
    const sent = Number(Store.pair("p:" + todayKey(), who)) || 0;
    if (sent) lines.push(`오늘 하트 ${sent}개 보냈어`);
    const mood = Number(Store.pair("m:" + todayKey(), who)) || 0;
    if (mood) lines.push(`오늘 기분은 ${MOODS[mood]}`);
    const ev = upcomingEvents()[0];
    if (ev) lines.push(ev.left === 0 ? `오늘은 ${ev.name}!` : `${ev.name}까지 ${ev.left}일 남았어`);
    const todo = Store.list("plans").filter((p) => !p.done);
    if (todo.length) {
      const p = todo[Math.floor(Math.random() * todo.length)];
      lines.push(`${p.title.length > 9 ? p.title.slice(0, 9) + "…" : p.title} 어때`);
    }
    const all = Store.list("entries");
    if (all.length) {
      const places = [...new Set(all.map((e) => (e.place || "").trim()).filter(Boolean))];
      if (places.length) {
        const pl = places[Math.floor(Math.random() * places.length)];
        lines.push(`${pl.length > 9 ? pl.slice(0, 9) + "…" : pl} 또 가자`);
      }
    } else {
      lines.push("첫 기록을 남겨 볼까");
    }
    lines.push("다음엔 어디 갈까");
    return lines;
  }
  function showBubble(text, who) {
    const b = $("bubble");
    b.textContent = text;
    b.className = "bubble from-" + who;
    void b.offsetWidth;
    setOpen(b, true);
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(hideBubble, 4000);
  }
  function hideBubble() {
    clearTimeout(bubbleTimer);
    setOpen($("bubble"), false);
  }
  function renderMoodTags() {
    const me = Store.me();
    ["him", "her"].forEach((w) => {
      const el = $(w === "him" ? "moodHim" : "moodHer");
      const m = Number(Store.pair("m:" + todayKey(), w)) || 0;
      const k = String(m) + (w === me ? "me" : "");
      if (el.dataset.m !== k) {
        el.dataset.m = k;
        el.innerHTML = m ? PIXEL.sprite("mood" + m, 2) : w === me ? '<u class="mood-add">?</u>' : "";
        el.classList.toggle("mine", w === me);
        if (m) play(el, "boing");
      }
    });
  }
  // 풍경 속 화분(텃밭), 물음표 팻말(오늘의 질문)
  function renderScenePlant() {
    if (!window.Garden) return;
    const el = $("plant");
    const g = Garden.pot();
    const badge = Garden.badge();
    const k = g.key + badge;
    if (el.dataset.k !== k) {
      el.dataset.k = k;
      el.innerHTML = g.html + (badge ? `<i class="plant-alert">${PIXEL.icon("coin", 2)}</i>` : "");
    }
  }
  function renderSceneBits() {
    if (window.Notes) Notes.renderScene();
    renderScenePlant();
  }

  // 상대가 보낸 하트가 새로 오면 풍경에서 날아와요.
  function checkLove() {
    const me = Store.me();
    if (!me || !window.Scene || state.view !== "home") return;
    const other = partnerOf(me);
    const key = todayKey();
    const n = Number(Store.pair("p:" + key, other)) || 0;
    let seen = null;
    try { seen = JSON.parse(localStorage.getItem("hsd.seenLove") || "null"); } catch (e) { seen = null; }
    const before = seen && seen.day === key ? seen.n : 0;
    if (n > before) {
      setTimeout(() => {
        Scene.loveFlight(other, n - before, () => {
          const el = document.querySelector(`.bob[data-who="${me}"]`);
          if (el) play(el, "jump");
          showBubble(`${WHO[other]}가 하트 ${n - before}개 보냈어`, me);
        });
      }, 600);
    }
    try { localStorage.setItem("hsd.seenLove", JSON.stringify({ day: key, n })); } catch (e) { /* 무시 */ }
  }
  function bindScene() {
    $("scene").addEventListener("click", (ev) => {
      const me = Store.me();
      const tag = ev.target.closest(".mood-tag");
      if (tag && tag.classList.contains("mine")) { play(tag, "boing"); setPanel("mood"); return; }
      const who = ev.target.closest(".bob");
      if (who) {
        // 상대를 누르면 하트, 나를 누르면 한마디
        if (me && who.dataset.who !== me) { sendHeart(who); return; }
        play(who, "jump");
        burstAt(who, 6);
        const lines = bubbleLines(who.dataset.who);
        showBubble(lines[bubbleIdx % lines.length], who.dataset.who);
        bubbleIdx++;
        return;
      }
      if (ev.target.closest(".house")) { if (window.Deco) Deco.open("pj"); return; } // 집을 누르면 옷장
      if (ev.target.closest("#kennel")) { play($("kennel"), "boing"); if (window.Deco) Deco.open("pet"); return; }
      const pot = ev.target.closest(".sc-plant");
      if (pot) { play(pot, "boing"); if (window.Garden) Garden.open(); }
    });
  }
  // ---------- 뒤로 가기 ----------
  // 창, 화면, 게임을 열 때마다 방문 기록을 하나 쌓아요. 뒤로 가기는 맨 위 것 하나만 닫아요.
  // 홈에서는 두 번 눌러야 앱이 꺼져요. 아이폰용 뒤로 단추는 늘 왼쪽 위 같은 자리.
  const Nav = (() => {
    let depth = 0, skip = 0, lastBack = 0;
    const modals = () => document.querySelectorAll(".modal:not([hidden]):not(.closing):not(#hello)").length;
    function layers() {
      return (state.view !== "home" ? 1 : 0) + (state.openPanel ? 1 : 0) + (window.Garden && Garden.isOpen() ? 1 : 0) + modals() + (window.Tale && Tale.isOpen() ? 1 : 0) + (window.Deco && Deco.isOpen() ? 1 : 0) + ($("lightbox").hidden ? 0 : 1);
    }
    function closeTop() {
      if (!$("lightbox").hidden) return closeLightbox();
      if (window.Tale && Tale.isOpen()) return Tale.back();
      if (window.Deco && Deco.isOpen()) return Deco.back();
      const m = document.querySelector(".modal:not([hidden]):not(.closing):not(#hello)");
      if (m) return closeModal(m);
      if (window.Garden && Garden.isOpen()) return Garden.close();
      if (state.openPanel) return setPanel(null);
      if (state.view !== "home") return go("home");
    }
    function sync() {
      const n = layers();
      if (n > depth) { for (; depth < n; depth++) history.pushState({ hsd: depth + 1 }, ""); }
      else if (n < depth) { const d = depth - n; depth = n; skip++; history.go(-d); }
      $("backBtn").hidden = n === 0;
      saveUi();
    }
    // 새로고침 전에, 쌓아 둔 방문 기록을 걷어 내요
    function unwind(cb) {
      if (depth > 0) { const d = depth; depth = 0; skip++; history.go(-d); setTimeout(cb, 150); } else cb();
    }
    window.addEventListener("popstate", () => {
      if (skip) { skip--; return; }
      if (depth > 0) { depth--; closeTop(); $("backBtn").hidden = layers() === 0; return; }
      // 홈에서: 한 번 더 누르면 꺼져요
      const now = Date.now();
      if (now - lastBack < 2000) { history.back(); return; }
      lastBack = now;
      history.pushState({ hsd: 0 }, "");
      toast("한 번 더 누르면 앱이 꺼져요");
    });
    try {
      const st0 = history.state;
      // 새로고침으로 다시 열렸으면 예전에 쌓인 기록 위에 서 있어요. 바닥으로 내려가요.
      if (st0 && typeof st0.hsd === "number" && st0.hsd > 0) { skip++; history.go(-st0.hsd); }
      else if (!(st0 && st0.hsd === 0)) { history.replaceState({ hsd: "base" }, ""); history.pushState({ hsd: 0 }, ""); }
    } catch (e) { /* 방문 기록을 못 쓰는 곳에서도 앱은 돌아가요 */ }
    document.addEventListener("hsd:layer", () => sync());
    return { sync, layers, unwind, back: () => history.back() };
  })();

  // ---------- 새로고침: 당겨서, 그리고 새 버전이 올라오면 저절로 ----------
  // 새로고침해도 보고 있던 화면과 창, 쓰던 글이 그대로 돌아와요.
  const UI_KEY = "hsd.ui", KEEP = ["noteText", "dayText", "dayTime", "planTitle", "questInput", "decoText"];
  function saveUi() {
    try {
      const drafts = {};
      KEEP.forEach((id) => { const el = $(id); if (el && el.value) drafts[id] = el.value; });
      sessionStorage.setItem(UI_KEY, JSON.stringify({
        t: Date.now(), view: state.view, panel: state.openPanel, game: !!(window.Garden && Garden.isOpen()),
        deco: window.Deco && Deco.isOpen() ? Deco.tab() : "", day: window.Cal ? Cal.sel() : "", mail: window.Notes ? Notes.tab() : "", drafts,
      }));
    } catch (e) { /* 못 적어도 괜찮아요 */ }
  }
  function restoreUi() {
    let u = null;
    try { u = JSON.parse(sessionStorage.getItem(UI_KEY) || "null"); } catch (e) { u = null; }
    if (!u || Date.now() - u.t > 15 * 60000 || !Store.me()) return;
    if (u.view && u.view !== "home") go(u.view);
    if (u.panel === "day" && window.Cal && u.day) Cal.pick(u.day);
    else if (u.panel === "mail" && window.Notes) Notes.open(u.mail);
    else if (u.panel === "note" && window.Notes) { setPanel("note"); Notes.renderWrite(); }
    else if (u.panel) setPanel(u.panel);
    if (u.game && window.Garden) Garden.open();
    if (u.deco && window.Deco) Deco.open(u.deco);
    setTimeout(() => { Object.keys(u.drafts || {}).forEach((id) => { const el = $(id); if (el && !el.value) el.value = u.drafts[id]; }); }, 350);
  }
  function reloadNow() {
    saveUi();
    Nav.unwind(() => location.reload());
  }
  window.addEventListener("pagehide", saveUi);
  // 새 버전이 올라오면 저절로 바꿔요 (글을 쓰는 중이면 끝날 때까지 기다려요)
  let ver = "";
  async function checkVersion() {
    try {
      const r = await fetch("sw.js?t=" + Date.now(), { cache: "no-store" });
      const m = /hsd-v(\d+)/.exec(await r.text());
      if (!m) return;
      if (!ver) { ver = m[1]; return; }
      if (m[1] !== ver) autoReload();
    } catch (e) { /* 인터넷이 없으면 다음에 */ }
  }
  let autoT = 0;
  function autoReload() {
    clearTimeout(autoT);
    const a = document.activeElement;
    const typing = a && /INPUT|TEXTAREA/.test(a.tagName) && a.value;
    if (typing || openModalEl() || (window.Deco && Deco.celebrating()) || (window.Tale && Tale.isOpen())) { autoT = setTimeout(autoReload, 4000); return; }
    toast("새 버전으로 바꿀게요");
    setTimeout(reloadNow, 600);
  }
  setInterval(() => { if (!document.hidden) checkVersion(); }, 60000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) checkVersion(); });
  checkVersion();
  // 아래로 당기면 새로고침
  (function bindPull() {
    const el = document.createElement("div");
    el.className = "ptr";
    el.innerHTML = "<i></i><b>당겨서 새로고침</b>";
    document.body.appendChild(el);
    let y0 = 0, x0 = 0, on = false, d = 0;
    const NEED = 120;
    document.addEventListener("touchstart", (ev) => {
      on = false; d = 0;
      if (ev.touches.length !== 1 || window.scrollY > 0) return;
      const t = ev.target;
      if (!t.closest || t.closest("#banner, .idle, .unlock, .lightbox, input, textarea, select")) return;
      for (let n = t; n && n !== document.body; n = n.parentNode) if (n.scrollTop > 0) return;
      y0 = ev.touches[0].clientY; x0 = ev.touches[0].clientX; on = true;
    }, { passive: true });
    document.addEventListener("touchmove", (ev) => {
      if (!on) return;
      const dy = ev.touches[0].clientY - y0, dx = ev.touches[0].clientX - x0;
      if (d === 0 && (dy < 12 || Math.abs(dx) > dy)) { if (dy < -6 || Math.abs(dx) > 14) on = false; return; }
      d = Math.max(0, dy);
      el.classList.add("on");
      el.classList.toggle("ready", d > NEED);
      el.style.transform = `translate(-50%, ${Math.min(76, d * 0.5).toFixed(0)}px)`;
      el.lastChild.textContent = d > NEED ? "놓으면 새로고침" : "당겨서 새로고침";
    }, { passive: true });
    const end = () => {
      if (!on) return;
      on = false;
      if (d > NEED) {
        el.lastChild.textContent = "새로고침하는 중";
        el.classList.add("spin");
        if (Store.token()) Store.sync();
        setTimeout(reloadNow, 450);
      } else { el.classList.remove("on", "ready"); el.style.transform = ""; }
      d = 0;
    };
    document.addEventListener("touchend", end, { passive: true });
    document.addEventListener("touchcancel", end, { passive: true });
  })();

  function lockScroll() {
    document.documentElement.classList.toggle("lock", state.view === "home");
  }
  function go(view) {
    if (!document.querySelector(`.view[data-view="${view}"]`)) return;
    state.view = view;
    lockScroll();
    document.querySelectorAll(".view").forEach((v) => {
      const on = v.dataset.view === view;
      v.classList.toggle("is-active", on);
      if (on) restart(v, "view-in");
    });
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.go === view));
    $("btnAdd").hidden = !(view === "log" || view === "diary");
    setPanel(null);
    hideBubble();
    window.scrollTo(0, 0);
    if (window.Scene) Scene.setActive(view === "home");
    renderView();
    Nav.sync();
  }

  // ---------- 홈: 타일과 칸 ----------
  function setPanel(name) {
    state.openPanel = name;
    document.querySelectorAll(".panel").forEach((p) => setOpen(p, p.id === "panel-" + name));
    document.body.classList.toggle("sheet-open", !!name);
    if (name === "mood") renderMood();
    if (name === "mail" && window.Notes) Notes.renderMail();
    if (name === "day" && window.Cal) Cal.renderDay();
    Nav.sync();
  }
  function whoAsk() {
    return `<div class="who-ask"><p>이 폰은 누구 거야?</p><div class="who-pick"><button class="chip" data-me="him">${esc(WHO.him)}</button><button class="chip" data-me="her">${esc(WHO.her)}</button></div></div>`;
  }

  function renderMood() {
    const key = "m:" + todayKey();
    MORPH($("moodNow"), ["him", "her"].map((w) => {
      const m = Number(Store.pair(key, w)) || 0;
      return `<div class="mood-card"><span class="mood-face">${m ? PIXEL.sprite("mood" + m, 5) : '<i class="mood-none">?</i>'}</span><b>${esc(WHO[w])}</b><i>${m ? MOODS[m] : "아직"}</i></div>`;
    }).join(""));
    const me = Store.me();
    if (!me) {
      MORPH($("moodPick"), whoAsk());
      return;
    }
    const mine = Number(Store.pair(key, me)) || 0;
    MORPH($("moodPick"), `<div class="mood-pick">${[1, 2, 3, 4, 5].map((n) => `<button class="mood-btn${mine === n ? " active" : ""}" data-mood="${n}" aria-label="${MOODS[n]}">${PIXEL.sprite("mood" + n, 4)}<b>${MOODS[n]}</b></button>`).join("")}</div>`);
  }

  // 하트 보내기: 그림 속 상대를 눌러요
  function sendHeart(target) {
    const me = Store.me();
    if (!me) return;
    const key = "p:" + todayKey();
    const n = (Number(Store.pair(key, me)) || 0) + 1;
    silently(() => Store.setPair(key, me, n));
    play(target, "jump");
    burstAt(target, 7, "heart");
    if (window.Scene) Scene.loveFlight(me, 1);
    showBubble(n === 1 ? `${WHO[partnerOf(me)]}에게 하트!` : `오늘 하트 ${n}개째`, me);
  }

  function questIndex() {
    const base = parseDate(cfg.startDate) || new Date(2026, 0, 1);
    const n = Math.round((today0() - base) / 86400000);
    return QUESTIONS.length ? ((n % QUESTIONS.length) + QUESTIONS.length) % QUESTIONS.length : 0;
  }
  function questStreak() {
    // 둘 다 답한 날이 며칠째 이어지는지
    let n = 0;
    const d = today0();
    if (!(Store.pair("q:" + keyOf(d), "him") && Store.pair("q:" + keyOf(d), "her"))) d.setDate(d.getDate() - 1);
    while (Store.pair("q:" + keyOf(d), "him") && Store.pair("q:" + keyOf(d), "her")) {
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }
  let questEditing = false;
  function renderQuest() {
    const key = "q:" + todayKey();
    $("questText").textContent = QUESTIONS[questIndex()] || "오늘은 질문이 없어요";
    const streak = questStreak();
    $("streak").textContent = streak ? `${streak}일째` : "";
    const me = Store.me();
    if (!me) {
      MORPH($("questBody"), whoAsk());
      return;
    }
    const mine = Store.pair(key, me) || "";
    const other = partnerOf(me);
    const theirs = Store.pair(key, other) || "";
    const myBox = mine && !questEditing
      ? `<div class="answer mine"><b class="who ${me}">${esc(WHO[me])}</b><p>${esc(mine)}</p><button class="link" data-quest-edit>고치기</button></div>`
      : `<form class="answer-form" id="questForm"><textarea id="questInput" rows="2" maxlength="200" placeholder="내 답">${esc(mine)}</textarea><button class="btn primary small" type="submit">답하기</button></form>`;
    const theirBox = !mine
      ? `<div class="answer locked"><b class="who ${other}">${esc(WHO[other])}</b><p>내가 답하면 보여요</p></div>`
      : `<div class="answer"><b class="who ${other}">${esc(WHO[other])}</b><p>${theirs ? esc(theirs) : "아직 답하지 않았어요"}</p></div>`;
    MORPH($("questBody"), myBox + theirBox);
  }

  function renderSync() {
    const st = Store.status();
    const pend = Store.pendingPhotoCount();
    let text;
    let cls = st.state;
    if (st.state === "syncing") text = "저장 중";
    else if (st.state === "wait") { text = "쓰던 폰에서 허락을 기다리는 중"; cls = "syncing"; }
    else if (st.state === "offline") text = "인터넷이 없어요 · 이 폰에 저장됨";
    else if (st.state === "error") text = "저장 실패 · 눌러서 다시 시도";
    else if (!Store.token()) { text = "이 폰에 저장됨"; cls = "local"; }
    else text = "둘이 같이 저장됨";
    if (pend && Store.token() && st.state !== "syncing") text += ` · 사진 ${pend}장 대기`;
    const dot = $("syncDot");
    dot.className = "sync-dot " + cls;
    dot.title = text;
    dot.hidden = cls === "ok" || cls === "syncing";
  }

  // 못 본 이야기가 있으면 알려 줘요 (창이 다 닫힌 뒤에)
  let taleT = 0;
  function talePing() {
    clearTimeout(taleT);
    taleT = setTimeout(() => {
      if (window.Deco) Deco.bindDrag();
      if (!Store.me() || !$("hello").hidden) return;
      // 새로 열린 선물이 있으면 그것부터, 그다음에 이야기
      if (window.Deco && (Deco.celebrating() || (Nav.layers() === 0 && Deco.celebrate()))) return;
      if (window.Tale) Tale.notify();
    }, 450);
  }
  function renderHome() {
    talePing();
    renderHeader();
    renderMoodTags();
    renderSceneBits();
    if (window.Cal) Cal.render();
    renderSync();
    checkLove();
    const qk = "q:" + todayKey();
    $("couple").classList.toggle("blessed", !!(Store.pair(qk, "him") && Store.pair(qk, "her")));
    if (state.openPanel === "mood") renderMood();
    if (state.openPanel === "mail" && window.Notes && !questEditing && !(document.activeElement && document.activeElement.id === "questInput")) Notes.renderMail();
    if (window.Garden && Garden.isOpen() && !quiet) Garden.render();
  }

  // ---------- 기록 ----------
  function catTabs(cats, active, attr) {
    return ["all"].concat(cats).map((c) => `<button class="chip${active === c ? " active" : ""}" ${attr}="${c}">${c === "all" ? "전체" : PIXEL.icon(c, 2) + CATS[c]}</button>`).join("");
  }
  function setFilter(patch) {
    Object.assign(state, patch);
    if ($("search").value !== state.q) $("search").value = state.q;
    renderLog();
  }
  function filteredEntries() {
    const q = state.q.trim().toLowerCase();
    const list = Store.list("entries").filter((e) => {
      if (state.cat !== "all" && e.category !== state.cat) return false;
      if (!q) return true;
      return [e.title, e.place, e.memo, (e.tags || []).join(" ")].join(" ").toLowerCase().includes(q);
    });
    list.sort((a, b) => {
      if (state.sort === "rating") return avgHearts(b.id) - avgHearts(a.id) || String(b.date).localeCompare(String(a.date));
      const c = String(a.date).localeCompare(String(b.date));
      return state.sort === "asc" ? c : -c;
    });
    return list;
  }
  function cardHtml(e, i) {
    const cat = CATS[e.category] ? e.category : "etc";
    const d = parseDate(e.date);
    const day = d ? `${pad(d.getMonth() + 1)}.${pad(d.getDate())}` : "";
    const open = state.openCard === e.id;
    return `
      <article class="card cat-${cat}${open ? " open" : ""}" data-id="${esc(e.id)}" style="--i:${Math.min(i || 0, 8)}">
        <button class="card-head" aria-expanded="${open}">
          <span class="cat-ico ${cat}">${PIXEL.icon(cat, 2)}</span>
          <span class="card-title">${esc(e.title)}</span>
          <span class="mini-heart">${miniHeartHtml(e.id)}</span>
          <span class="card-day">${day}</span>
          <span class="chev">${PIXEL.icon("down", 2)}</span>
        </button>
        <div class="card-body fold${open ? " is-open" : ""}"><div class="fold-in">${open ? entryDetail(e) : ""}</div></div>
      </article>`;
  }
  // 카드 속 내용은 펼칠 때 만들어요. (기록이 많아도 목록이 가볍게 떠요)
  function entryDetail(e) {
    const cat = CATS[e.category] ? e.category : "etc";
    return `<div class="card-detail">
          <p class="card-meta">${esc(CATS[cat])} · ${esc(fmtDate(e.date))}</p>
          ${e.place ? `<a class="card-place" href="${esc(mapUrl(e))}" target="_blank" rel="noopener">${PIXEL.icon("pin", 2)}<span class="place-name">${esc(e.place)}</span><span class="map-go">지도</span></a>` : ""}
          <div class="hearts-box">${heartsBlock("h:" + e.id)}</div>
          ${galleryHtml(e.photos, e.title)}
          ${e.memo ? `<p class="card-memo">${esc(e.memo)}</p>` : ""}
          ${(e.tags || []).length ? `<div class="tags">${e.tags.map((t) => `<button class="tag" data-tag="${esc(t)}">#${esc(t)}</button>`).join("")}</div>` : ""}
          <div class="card-actions"><button class="btn small" data-edit>수정</button></div>
        </div>`;
  }
  function renderLog() {
    talePing();
    $("logTabs").innerHTML = catTabs(Object.keys(CATS), state.cat, "data-cat");
    const parts = [];
    if (state.q.trim()) parts.push(`"${state.q.trim()}"`);
    $("activeFilterText").textContent = parts.join(" · ");
    $("activeFilter").hidden = parts.length === 0;
    const list = filteredEntries();
    $("empty").hidden = list.length > 0;
    let html = "";
    if (state.sort === "rating") {
      html = `<div class="month-items"><div class="fold-in">${list.map(cardHtml).join("")}</div></div>`;
    } else {
      const groups = [];
      list.forEach((e) => {
        const d = parseDate(e.date);
        const key = d ? `${d.getFullYear()}.${pad(d.getMonth() + 1)}` : "날짜 없음";
        if (!groups.length || groups[groups.length - 1].key !== key) groups.push({ key, items: [] });
        groups[groups.length - 1].items.push(e);
      });
      html = groups.map((g) => {
        const folded = state.folded.has(g.key);
        return `<div class="month${folded ? " folded" : ""}" data-month="${esc(g.key)}">
          <button class="month-label" aria-expanded="${!folded}"><span>${esc(g.key)}<i>${g.items.length}</i></span></button>
          <div class="month-items fold${folded ? "" : " is-open"}"><div class="fold-in">${g.items.map(cardHtml).join("")}</div></div>
        </div>`;
      }).join("");
    }
    $("timeline").innerHTML = html;
  }

  // 기록, 할 거 카드를 펼치고 접어요. (한 번에 하나만)
  function setOpenCard(id) {
    const prev = document.querySelector(".card.open");
    if (prev && prev.dataset.id !== id) {
      prev.classList.remove("open");
      setOpen(prev.querySelector(".card-body"), false);
      prev.querySelector(".card-head").setAttribute("aria-expanded", "false");
    }
    state.openCard = id;
    if (!id) return;
    const card = [...document.querySelectorAll(".view.is-active .card")].find((c) => c.dataset.id === id);
    if (!card) return;
    const inner = card.querySelector(".fold-in");
    if (!inner.firstElementChild) {
      const isPlan = card.classList.contains("plan");
      const rec = Store.get(isPlan ? "plans" : "entries", id);
      if (rec) inner.innerHTML = isPlan ? planDetail(rec) : entryDetail(rec);
      void inner.offsetHeight; // 내용을 넣은 다음 프레임부터 펼쳐지게 해요.
    }
    card.classList.add("open");
    setOpen(card.querySelector(".card-body"), true);
    card.querySelector(".card-head").setAttribute("aria-expanded", "true");
  }

  // ---------- 주말에 할 거 ----------
  function planHtml(p, i) {
    const cat = CATS[p.category] ? p.category : "etc";
    const open = state.openCard === p.id;
    return `
      <article class="card plan cat-${cat}${p.done ? " done" : ""}${open ? " open" : ""}" data-id="${esc(p.id)}" style="--i:${Math.min(i || 0, 8)}">
        <div class="plan-row">
          <button class="check${p.done ? " on" : ""}" data-check aria-label="${p.done ? "다시 하기" : "해냈어요"}">${PIXEL.icon("tick", 2)}</button>
          <button class="card-head" aria-expanded="${open}">
            <span class="cat-ico ${cat}">${PIXEL.icon(cat, 2)}</span>
            <span class="card-title">${esc(p.title)}</span>
            <span class="mini-heart">${miniHeartHtml(p.id)}</span>
            <span class="chev">${PIXEL.icon("down", 2)}</span>
          </button>
        </div>
        <div class="card-body fold${open ? " is-open" : ""}"><div class="fold-in">${open ? planDetail(p) : ""}</div></div>
      </article>`;
  }
  function planDetail(p) {
    const cat = CATS[p.category] ? p.category : "etc";
    return `<div class="card-detail">
          <p class="card-meta">${esc(CATS[cat])}</p>
          ${p.place ? `<a class="card-place" href="${esc(mapUrl(p))}" target="_blank" rel="noopener">${PIXEL.icon("pin", 2)}<span class="place-name">${esc(p.place)}</span><span class="map-go">지도</span></a>` : ""}
          <div class="hearts-box">${heartsBlock("h:" + p.id)}</div>
          <div class="card-actions"><button class="btn small" data-plan-edit>고치기</button><button class="btn small primary" data-plan-log>기록으로</button></div>
        </div>`;
  }
  function renderPlans() {
    talePing();
    $("planTabs").innerHTML = catTabs(PLAN_CATS, state.planCat, "data-plan-cat");
    const list = Store.list("plans")
      .filter((p) => state.planCat === "all" || p.category === state.planCat)
      .sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0) || (b.t || 0) - (a.t || 0));
    $("planList").innerHTML = list.map(planHtml).join("");
    $("planEmpty").hidden = list.length > 0;
  }

  // ---------- 일기장 ----------
  function sortedPosts() {
    return Store.list("diary").sort((a, b) => String(b.date).localeCompare(String(a.date)) || (b.t || 0) - (a.t || 0));
  }
  function postHtml(p, i) {
    const who = p.author === "her" ? "her" : "him";
    const long = (p.text || "").length > 120 || (p.text || "").split("\n").length > 4;
    return `
      <article class="post box" data-id="${esc(p.id)}" style="--i:${Math.min(i || 0, 8)}">
        <header class="post-head">
          <span class="who ${who}">${esc(WHO[who])}</span>
          <span class="post-date">${esc(fmtDate(p.date))}</span>
          <button class="link" data-post-edit>수정</button>
        </header>
        ${galleryHtml(p.photos, "일기 사진")}
        ${p.text ? `<p class="post-text${long ? " clamp" : ""}">${esc(p.text)}</p>${long ? '<button class="link more" data-more>더 보기</button>' : ""}` : ""}
      </article>`;
  }
  function renderDiary() {
    talePing();
    const list = sortedPosts();
    $("postList").innerHTML = list.map(postHtml).join("");
    $("postEmpty").hidden = list.length > 0;
  }

  function renderView() {
    if (state.view === "home") renderHome();
    else if (state.view === "log") renderLog();
    else if (state.view === "plans") renderPlans();
    else if (state.view === "diary") renderDiary();
  }

  // ---------- 입력창 공통 ----------
  function openModal(el) {
    el.classList.remove("closing");
    el.hidden = false;
    document.body.classList.add("no-scroll");
    Nav.sync();
  }
  function closeModal(el) {
    if (!el || el.hidden || el.classList.contains("closing")) return;
    el.classList.add("closing");
    Nav.sync();
    setTimeout(() => {
      el.hidden = true;
      el.classList.remove("closing");
      if (!document.querySelector(".modal:not([hidden])") && $("lightbox").hidden) document.body.classList.remove("no-scroll");
    }, 160);
  }
  function openModalEl() {
    return document.querySelector(".modal:not([hidden]):not(.closing)");
  }
  function fillCatSelect(sel, cats) {
    sel.innerHTML = cats.map((c) => `<option value="${c}">${CATS[c]}</option>`).join("");
  }
  function todayInput() {
    return todayKey();
  }

  // 기록
  function openRecord(entry, prefill) {
    $("form").reset();
    fillCatSelect($("fCat"), Object.keys(CATS));
    const src = entry || prefill || {};
    $("modalTitle").textContent = entry ? "기록 수정" : "새 기록";
    $("fId").value = entry ? entry.id : "";
    $("fPlanId").value = prefill && prefill.planId ? prefill.planId : "";
    $("fDate").value = src.date || todayInput();
    $("fCat").value = CATS[src.category] ? src.category : state.cat !== "all" ? state.cat : "date";
    $("fTitle").value = src.title || "";
    $("fPlace").value = src.place || "";
    $("fMap").value = src.map || "";
    $("fMemo").value = src.memo || "";
    $("fTags").value = (src.tags || []).join(", ");
    const heartKey = entry ? "h:" + entry.id : prefill && prefill.planId ? "h:" + prefill.planId : null;
    draftHearts.him = heartKey ? heartVal(heartKey, "him") : 0;
    draftHearts.her = heartKey ? heartVal(heartKey, "her") : 0;
    renderDraftHearts();
    setPicker($("fPhotos"), src.photos);
    $("btnDelete").hidden = !entry;
    openModal($("modal"));
    if (!entry) $("fTitle").focus();
  }
  function saveRecord() {
    const id = $("fId").value;
    const planId = $("fPlanId").value;
    const old = id ? Store.get("entries", id) : null;
    const rec = silently(() => Store.put("entries", Object.assign({}, old || {}, {
      id: id || undefined,
      date: $("fDate").value,
      category: $("fCat").value,
      title: $("fTitle").value.trim(),
      place: $("fPlace").value.trim(),
      map: $("fMap").value.trim(),
      memo: $("fMemo").value.trim(),
      tags: $("fTags").value.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean),
      photos: picker ? picker.photos.slice() : [],
    })));
    silently(() => {
      ["him", "her"].forEach((w) => {
        if (heartVal("h:" + rec.id, w) !== draftHearts[w]) Store.setPair("h:" + rec.id, w, draftHearts[w]);
      });
      if (planId) Store.remove("plans", planId);
    });
    closeModal($("modal"));
    state.openCard = rec.id;
    if (state.view !== "log") go("log");
    else renderLog();
    const card = document.querySelector(".view.is-active .card.open");
    if (card) burstAt(card.querySelector(".cat-ico"), 8);
    toast(id ? "고쳤어요" : "기록을 남겼어요");
    renderScenePlant();
  }

  // 할 거
  function openPlan(p) {
    fillCatSelect($("pCat"), PLAN_CATS);
    $("pId").value = p.id;
    $("pCat").value = PLAN_CATS.includes(p.category) ? p.category : "etc";
    $("pTitle").value = p.title || "";
    $("pPlace").value = p.place || "";
    $("pMap").value = p.map || "";
    openModal($("planModal"));
  }

  // 일기
  let postWho = "him";
  function setPostWho(w) {
    postWho = w;
    $("dWho").querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c.dataset.who === w));
  }
  function openPost(post) {
    $("postForm").reset();
    $("postModalTitle").textContent = post ? "일기 고치기" : "일기 쓰기";
    $("dId").value = post ? post.id : "";
    $("dDate").value = post ? post.date : todayInput();
    $("dText").value = post ? post.text || "" : "";
    setPostWho(post ? (post.author === "her" ? "her" : "him") : Store.me() || "him");
    setPicker($("dPhotos"), post ? post.photos : []);
    $("btnPostDelete").hidden = !post;
    openModal($("postModal"));
    if (!post) $("dText").focus();
  }

  // ---------- 처음 한 번: 누구 폰인지 ----------
  let helloPick = "";
  function helloStep(id) { ["helloWho", "helloSure"].forEach((k) => { $(k).hidden = k !== id; }); }
  function openHello(step) {
    $("helloHimName").textContent = WHO.him; $("helloHerName").textContent = WHO.her;
    if (window.FSprites) { $("helloHim").src = FSprites.charImg("him", "down", 0, "wave1", "happy"); $("helloHer").src = FSprites.charImg("her", "down", 0, "wave1", "happy"); }
    helloStep(step);
    openModal($("hello"));
  }
  function startHello() {
    if (!Store.me()) openHello("helloWho");
  }

  // ---------- 누르기 ----------
  function bind() {
    // 바깥을 누르면 펼쳐진 것들이 닫혀요. (다른 처리보다 먼저 돌아요)
    document.addEventListener("click", (ev) => {
      const t = ev.target;
      if (!t.closest) return;
      if (t.closest(".modal") || t.closest(".toast") || t.closest(".lightbox") || t.closest(".nav")) return;
      if (t.closest(".game")) return;
      if (!t.closest(".couple") && !t.closest(".sc-plant")) hideBubble();
      if (state.openPanel && !t.closest("#menu") && !t.closest("#panels")) setPanel(null);
      if (state.openCard && !t.closest(".card")) setOpenCard(null);
    }, true);

    document.addEventListener("keydown", (ev) => {
      if (ev.key !== "Escape") return;
      if (Nav.layers() > 0) { Nav.back(); return; }
      hideBubble();
      setOpenCard(null);
    });

    // 사진 넘길 때 몇 번째인지 표시 (scroll 은 위로 전달되지 않아서 잡아채요)
    document.addEventListener("scroll", (ev) => {
      const t = ev.target;
      if (!t.classList || !t.classList.contains("gallery-track")) return;
      if (t.id === "lightboxTrack") {
        const i = Math.round(t.scrollLeft / Math.max(1, t.clientWidth));
        $("lightboxCount").textContent = `${Math.min(t.children.length, i + 1)}/${t.children.length}`;
      } else {
        onGalleryScroll(t);
      }
    }, { capture: true, passive: true });

    // 어디서나 통하는 누르기: 하트, 사진, 닫기, 화면 넘기기, 누구 폰인지
    document.addEventListener("click", (ev) => {
      const t = ev.target;
      if (!t.closest) return;
      const heart = t.closest(".heart");
      if (heart) { onHeartTap(heart); return; }
      const img = t.closest(".gallery-track img");
      if (img && !t.closest(".lightbox")) {
        const box = img.closest(".gallery");
        try { openLightbox(JSON.parse(box.dataset.photos), Number(img.dataset.i) || 0); } catch (e) { /* 사진 목록이 깨졌으면 그냥 둬요 */ }
        return;
      }
      const close = t.closest("[data-close]");
      if (close) { closeModal(close.closest(".modal")); return; }
      if (t.classList.contains("modal") && t.id !== "hello") { closeModal(t); return; }
      const goBtn = t.closest("[data-go]");
      if (goBtn) { go(goBtn.dataset.go); return; }
      const me = t.closest("[data-me]");
      if (me && Store.me()) return;
      if (me) {
        silently(() => Store.setMe(me.dataset.me));
        if (window.Garden) Garden.attend();
        toast(`${WHO[me.dataset.me]} 폰으로 기억할게요`);
        renderHome();
        if (state.openPanel) setPanel(state.openPanel);
        return;
      }
      const add = t.closest("[data-add]");
      if (add) { $("filePick").click(); return; }
      const rm = t.closest("[data-rm]");
      if (rm && picker) {
        picker.photos.splice(Number(rm.dataset.rm), 1);
        renderPicker();
      }
    });
    $("filePick").addEventListener("change", (ev) => {
      const files = ev.target.files;
      onFiles(files).then(() => { ev.target.value = ""; });
    });
    $("lightboxClose").addEventListener("click", closeLightbox);
    $("lightbox").addEventListener("click", (ev) => {
      if (ev.target === $("lightbox")) closeLightbox();
    });

    bindScene();

    $("banner").addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (window.Deco && Deco.justDragged()) return;
      play($("banner"), "boing");
      if (window.Deco) Deco.open("ban");
    });
    $("backBtn").addEventListener("click", () => Nav.back());

    $("panels").addEventListener("click", (ev) => {
      const t = ev.target;
      const mood = t.closest("[data-mood]");
      if (mood) {
        const me = Store.me();
        const n = Number(mood.dataset.mood);
        silently(() => Store.setPair("m:" + todayKey(), me, n));
        renderMood();
        renderMoodTags();
        renderSceneBits();
        const face = document.querySelector(`.mood-btn[data-mood="${n}"]`);
        if (face) { play(face, "boing"); burstAt(face, 6); }
        return;
      }
      if (t.closest("[data-quest-edit]")) { questEditing = true; renderQuest(); $("questInput").focus(); return; }
    });
    $("panels").addEventListener("submit", (ev) => {
      if (ev.target.id !== "questForm") return;
      ev.preventDefault();
      const text = $("questInput").value.trim();
      if (!text) return;
      questEditing = false;
      silently(() => Store.setPair("q:" + todayKey(), Store.me(), text));
      if (window.Notes) Notes.renderMail(); else renderQuest();
      renderSceneBits();
      renderScenePlant();
      burstAt($("questText"), 8);
      toast("답했어요");
    });

    // 기록
    $("logTabs").addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-cat]");
      if (b) setFilter({ cat: b.dataset.cat });
    });
    $("btnSearch").addEventListener("click", () => {
      const open = !isOpen($("searchFold"));
      setOpen($("searchFold"), open);
      $("btnSearch").setAttribute("aria-expanded", String(open));
      $("btnSearch").classList.toggle("primary", open);
      if (open) $("search").focus();
    });
    $("search").addEventListener("input", (ev) => setFilter({ q: ev.target.value }));
    $("sort").addEventListener("change", (ev) => setFilter({ sort: ev.target.value }));
    $("btnClearFilter").addEventListener("click", () => setFilter({ q: "" }));
    $("timeline").addEventListener("click", (ev) => {
      const month = ev.target.closest(".month-label");
      if (month) {
        const key = month.parentNode.dataset.month;
        const fold = !state.folded.has(key);
        if (fold) state.folded.add(key);
        else state.folded.delete(key);
        month.parentNode.classList.toggle("folded", fold);
        month.setAttribute("aria-expanded", String(!fold));
        setOpen(month.parentNode.querySelector(".month-items"), !fold);
        return;
      }
      const card = ev.target.closest(".card");
      if (!card) return;
      if (ev.target.closest("[data-edit]")) {
        const entry = Store.get("entries", card.dataset.id);
        if (entry) openRecord(entry);
        return;
      }
      const tag = ev.target.closest(".tag");
      if (tag) {
        setFilter({ cat: "all", q: tag.dataset.tag });
        toast(`#${tag.dataset.tag} 기록만 보는 중`);
        return;
      }
      if (ev.target.closest(".card-head")) setOpenCard(state.openCard === card.dataset.id ? null : card.dataset.id);
    });

    // 할 거
    $("planTabs").addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-plan-cat]");
      if (!b) return;
      state.planCat = b.dataset.planCat;
      renderPlans();
    });
    $("planForm").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const title = $("planTitle").value.trim();
      if (!title) { $("planTitle").focus(); return; }
      silently(() => Store.put("plans", { title, category: state.planCat === "all" ? "date" : state.planCat, place: "", map: "", done: false }));
      $("planTitle").value = "";
      renderPlans();
      const first = document.querySelector("#planList .card");
      if (first) burstAt(first.querySelector(".cat-ico"), 6);
    });
    $("planList").addEventListener("click", (ev) => {
      const card = ev.target.closest(".card");
      if (!card) return;
      const p = Store.get("plans", card.dataset.id);
      if (!p) return;
      const check = ev.target.closest("[data-check]");
      if (check) {
        const done = !p.done;
        silently(() => Store.put("plans", Object.assign({}, p, { done }, done && !p.dn ? { dn: Date.now(), dby: Store.me() } : {})));
        check.classList.toggle("on", done);
        card.classList.toggle("done", done);
        play(check, "boing");
        if (done) {
          burstAt(check, 10);
          toast("해냈어요");
        }
        talePing();
        renderScenePlant();
        return;
      }
      if (ev.target.closest("[data-plan-edit]")) { openPlan(p); return; }
      if (ev.target.closest("[data-plan-log]")) {
        openRecord(null, { planId: p.id, title: p.title, category: p.category, place: p.place, map: p.map });
        return;
      }
      if (ev.target.closest(".card-head")) setOpenCard(state.openCard === card.dataset.id ? null : card.dataset.id);
    });
    $("planEditForm").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const p = Store.get("plans", $("pId").value);
      if (!p) return;
      silently(() => Store.put("plans", Object.assign({}, p, {
        category: $("pCat").value, title: $("pTitle").value.trim(), place: $("pPlace").value.trim(), map: $("pMap").value.trim(),
      })));
      closeModal($("planModal"));
      renderPlans();
      toast("고쳤어요");
    });
    $("btnPlanDelete").addEventListener("click", () => {
      if (!confirm("이 할 거를 지울까요?")) return;
      silently(() => Store.remove("plans", $("pId").value));
      closeModal($("planModal"));
      state.openCard = null;
      renderPlans();
      toast("지웠어요");
    });

    // 일기
    $("postList").addEventListener("click", (ev) => {
      const post = ev.target.closest(".post");
      if (!post) return;
      if (ev.target.closest("[data-post-edit]")) {
        const p = Store.get("diary", post.dataset.id);
        if (p) openPost(p);
        return;
      }
      const more = ev.target.closest("[data-more]");
      if (more) {
        const text = post.querySelector(".post-text");
        const clamp = text.classList.toggle("clamp");
        more.textContent = clamp ? "더 보기" : "접기";
      }
    });
    $("dWho").addEventListener("click", (ev) => {
      const c = ev.target.closest("[data-who]");
      if (c) setPostWho(c.dataset.who);
    });
    $("postForm").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const id = $("dId").value;
      const photos = picker ? picker.photos.slice() : [];
      const text = $("dText").value.trim();
      if (!text && !photos.length) { toast("내용이나 사진을 넣어 줘요"); return; }
      const old = id ? Store.get("diary", id) : null;
      silently(() => Store.put("diary", Object.assign({}, old || {}, { id: id || undefined, date: $("dDate").value, author: postWho, text, photos })));
      closeModal($("postModal"));
      renderDiary();
      const first = document.querySelector("#postList .post");
      if (first && !id) burstAt(first.querySelector(".who"), 8, "heart");
      toast(id ? "고쳤어요" : "일기를 썼어요");
      renderScenePlant();
    });
    $("btnPostDelete").addEventListener("click", () => {
      if (!confirm("이 일기를 지울까요?")) return;
      silently(() => Store.remove("diary", $("dId").value));
      closeModal($("postModal"));
      renderDiary();
      toast("지웠어요");
    });

    // 추가 버튼
    $("btnAdd").addEventListener("click", () => {
      play($("btnAdd"), "boing");
      if (state.view === "diary") openPost(null);
      else openRecord(null);
    });

    // 기록 입력창
    function bindFind(btnId, placeId) {
      $(btnId).addEventListener("click", (ev) => {
        const place = $(placeId).value.trim();
        if (!place) {
          ev.preventDefault();
          toast("장소를 먼저 적어 주세요");
          $(placeId).focus();
          return;
        }
        $(btnId).href = naverSearchUrl(place);
      });
    }
    bindFind("btnFindMap", "fPlace");
    bindFind("btnFindPlanMap", "pPlace");
    $("form").addEventListener("submit", (ev) => {
      ev.preventDefault();
      saveRecord();
    });
    $("btnDelete").addEventListener("click", () => {
      const id = $("fId").value;
      if (!id || !confirm("이 기록을 지울까요?")) return;
      silently(() => Store.remove("entries", id));
      closeModal($("modal"));
      state.openCard = null;
      renderLog();
      toast("지웠어요");
    });

    // 처음 화면
    $("hello").addEventListener("click", (ev) => {
      const w = ev.target.closest("[data-hello]");
      if (!w) return;
      helloPick = w.dataset.hello;
      $("helloSureText").textContent = `${WHO[helloPick]} 폰으로 할까요?`;
      helloStep("helloSure");
    });
    $("helloBack").addEventListener("click", () => helloStep("helloWho"));
    $("helloYes").addEventListener("click", () => {
      if (!helloPick || Store.me()) return;
      silently(() => Store.setMe(helloPick));
      if (window.Garden) Garden.attend();
      renderHome();
      closeModal($("hello"));
      toast(`안녕, ${WHO[helloPick]}!`);
      if (window.Deco) Deco.attend();
      talePing();
    });
  }

  // ---------- 홈 화면에 앱으로 설치 ----------
  // 웹 브라우저로 들어오면 매번 설치 안내를 띄워요. 설치한 앱으로 열면 안 떠요.
  function bindInstall() {
    const bar = $("installBar");
    const sheet = $("installSheet");
    const ua = navigator.userAgent || "";
    const standalone = navigator.standalone === true || (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
    const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const android = /Android/i.test(ua);
    // 카카오톡, 네이버 앱 같은 앱 속 브라우저에서는 홈 화면에 추가를 못 해요.
    const inApp = /KAKAOTALK|NAVER\(inapp|Instagram|FBAN|FBAV|FB_IAB|Line\/|DaumApps/i.test(ua);
    let deferred = null;   // 크롬이 준비해 준 설치 창
    let installed = false; // 이미 깔려 있는지 (안드로이드 크롬만 알 수 있어요)

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
    }
    if (standalone) return;

    function step(html) {
      return `<li><span>${html}</span></li>`;
    }
    function render() {
      let lead = "홈 화면에 하트 아이콘이 생기고, 앱처럼 바로 열려요.";
      let steps = "";
      let action = ""; // 버튼 글자. 비어 있으면 버튼을 숨겨요.
      if (installed) {
        lead = "이미 깔려 있어요. 홈 화면의 하트 아이콘으로 열어 주세요.";
      } else if (ios && inApp) {
        steps = step("화면의 메뉴에서 <b>Safari로 열기</b>를 눌러요") + step(`Safari 아래쪽의 공유 버튼 ${PIXEL.icon("share", 2)} 을 눌러요`) + step("<b>홈 화면에 추가</b>를 눌러요");
      } else if (ios) {
        steps = step(`화면 아래쪽의 공유 버튼 ${PIXEL.icon("share", 2)} 을 눌러요`) + step("목록을 내려서 <b>홈 화면에 추가</b>를 눌러요") + step("오른쪽 위 <b>추가</b>를 눌러요");
      } else if (android && inApp) {
        steps = step(`오른쪽 위 메뉴 ${PIXEL.icon("dots", 2)} 를 눌러요`) + step("<b>다른 브라우저로 열기</b>로 Chrome에서 열어요") + step("거기서 다시 설치 안내를 따라 해요");
      } else if (deferred) {
        lead = "아래 설치 버튼을 누르면 바로 깔려요.";
        action = "설치";
      } else if (android) {
        steps = step(`브라우저 메뉴 ${PIXEL.icon("dots", 2)} 를 눌러요`) + step("<b>홈 화면에 추가</b> 또는 <b>앱 설치</b>를 눌러요");
      } else {
        steps = step("주소창 오른쪽의 설치 아이콘을 눌러요");
      }
      $("installLead").textContent = lead;
      $("installSteps").innerHTML = steps;
      $("installSteps").hidden = !steps;
      $("btnInstallSheet").hidden = !action;
      $("btnInstallSheet").textContent = action || "설치";
      $("installText").textContent = installed ? "홈 화면의 하트 아이콘으로 열어요" : "앱으로 깔면 더 편해요";
      $("btnInstall").hidden = installed;
      $("btnInstall").textContent = deferred ? "설치" : "방법";
      bar.hidden = false;
    }
    async function doInstall(btn) {
      if (!deferred) {
        openModal(sheet);
        return;
      }
      play(btn, "boing");
      const ev = deferred;
      deferred = null;
      ev.prompt();
      try {
        const choice = await ev.userChoice;
        if (choice && choice.outcome === "accepted") {
          closeModal(sheet);
          bar.hidden = true;
          return;
        }
      } catch (e) { /* 창이 그냥 닫힌 경우 */ }
      render();
    }

    window.addEventListener("beforeinstallprompt", (ev) => {
      ev.preventDefault();
      deferred = ev;
      render();
    });
    window.addEventListener("appinstalled", () => {
      installed = true;
      closeModal(sheet);
      render();
      toast("홈 화면에 깔았어요");
      burstAt($("dday"), 10, "heart");
    });
    $("btnInstall").addEventListener("click", () => doInstall($("btnInstall")));
    $("btnInstallSheet").addEventListener("click", () => doInstall($("btnInstallSheet")));

    render();
    if (navigator.getInstalledRelatedApps) {
      navigator.getInstalledRelatedApps().then((apps) => {
        if (apps && apps.length) {
          installed = true;
          closeModal(sheet);
          render();
        }
      }).catch(() => {});
    }
    // 폰에서는 들어올 때마다 안내를 띄워요.
    if (ios || android) {
      setTimeout(() => {
        if (!installed && !openModalEl() && $("lightbox").hidden) openModal(sheet);
      }, 1500);
    }
  }

  // ---------- 시작 ----------
  // 풍경과 게임이 쓰는 공용 도구
  window.HSD = { toast, burst, bubble: showBubble, setPanel, mood: (who) => Number(Store.pair("m:" + todayKey(), who)) || 0 };
  PIXEL.fill(document);
  bind();
  bindInstall();
  if (window.Garden) {
    Garden.bind({ toast, burst, onChanged() { renderScenePlant(); } });
    Garden.attend();
  }
  if (window.Deco) Deco.attend();
  document.addEventListener("hsd:ban", () => {});
  if (window.Notes) Notes.bind({ toast, silently, setPanel, play, burstAt, bubble: showBubble, panel: () => state.openPanel, todayKey, renderQuest });
  if (window.Cal) Cal.bind({ toast, silently, setPanel, panel: () => state.openPanel });
  if (window.Scene) Scene.init();
  lockScroll();
  renderView();
  startHello();
  restoreUi();
  talePing();
  document.addEventListener("hsd:wear", () => talePing());
  document.addEventListener("hsd:layer", () => talePing());
  document.addEventListener("visibilitychange", () => { if (!document.hidden) talePing(); });

  // 다른 폰에서 고친 내용이 들어오면 다시 그려요.
  Store.onChange(() => {
    if (quiet) return;
    if (openModalEl()) { renderSync(); return; }
    renderView();
    if (state.view !== "home") { renderMoodTags(); renderScenePlant(); }
    talePing();
  });
  let asking = "", waitTold = false;
  Store.onStatus(() => {
    renderSync();
    if (Store.status().state === "wait" && !waitTold) { waitTold = true; toast("새 폰이에요. 쓰던 폰에서 허락을 눌러 주세요"); }
    const reqs = Store.pendingJoins();
    if (reqs.length && window.Tale && !asking && !Tale.isOpen() && !openModalEl()) {
      const r = reqs[0];
      asking = r.id;
      Tale.ask(`새 폰이 "${WHO[r.who]}"(으)로 들어오려고 해요. 우리 폰이 맞으면 허락해 주세요.`, "허락", "아니야", (ok) => { Store.approve(r.id, ok).then(() => { asking = ""; toast(ok ? "새 폰을 허락했어요" : "막았어요"); }); });
    }

  });

  // 처음 한 번, 눌러 볼 수 있다는 걸 알려 줘요.
  setTimeout(() => {
    if (state.view !== "home" || isOpen($("bubble")) || bubbleIdx !== 0) return;
    const line = window.Cal ? Cal.todayLine() : "";
    showBubble(line || "우리를 눌러 봐", "her");
  }, 1200);
})();
