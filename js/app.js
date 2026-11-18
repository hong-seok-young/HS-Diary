// ============================================================
// 석영이와 예은이
// - data/entries.js 의 기록 + 이 브라우저(localStorage)에 임시 저장한 기록을 합쳐서 보여줘요.
// - 정보는 접어 두고, 누르면 펼쳐지고 다른 곳을 누르면 닫혀요.
// ============================================================
(function () {
  "use strict";

  const LS_KEY = "hs-diary-local-entries";
  const CATS = {
    date: "데이트",
    travel: "여행",
    food: "맛집",
    cafe: "카페",
    anniv: "기념일",
    etc: "기타",
  };
  const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

  const config = typeof DIARY_CONFIG !== "undefined" ? DIARY_CONFIG : {};
  const fileEntries = (typeof DIARY_ENTRIES !== "undefined" ? DIARY_ENTRIES : []).map((e, i) => ({
    ...e,
    _id: "file-" + i,
    _local: false,
  }));

  let localEntries = loadLocal();
  const state = {
    cat: "all",
    q: "",
    sort: "desc",
    openCard: null,   // 펼쳐진 기록
    openPanel: null,  // 펼쳐진 메뉴 칸
    folded: new Set(), // 접어 둔 달
  };

  const $ = (id) => document.getElementById(id);

  // ---------- storage ----------
  function loadLocal() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }
  function saveLocal() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(localEntries));
    } catch (e) {
      alert("브라우저 저장에 실패했어요");
    }
  }

  // 파일 기록을 수정/삭제하면 같은 _id 의 로컬 기록이 덮어써요.
  function allEntries() {
    const overridden = new Set(localEntries.map((e) => e._id));
    return fileEntries.filter((e) => !overridden.has(e._id)).concat(
      localEntries.filter((e) => !e._deleted).map((e) => ({ ...e, _local: true }))
    );
  }

  // ---------- helpers ----------
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }
  function parseDate(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function pad(n) {
    return String(n).padStart(2, "0");
  }
  function fmt(d) {
    return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} (${DAYS[d.getDay()]})`;
  }
  function fmtDate(s) {
    const d = parseDate(s);
    return d ? fmt(d) : s || "";
  }
  function today0() {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }
  function stars(n, scale) {
    n = Math.max(0, Math.min(5, Number(n) || 0));
    let out = "";
    for (let i = 1; i <= 5; i++) out += `<span class="star${i <= n ? " on" : ""}">${PIXEL.icon("star", scale || 2)}</span>`;
    return out;
  }
  // 네이버 지도 링크: 정확한 링크(map)가 있으면 그걸 쓰고, 없으면 장소 이름으로 검색해요.
  function naverSearchUrl(place) {
    return "https://map.naver.com/p/search/" + encodeURIComponent(place);
  }
  function mapUrl(e) {
    if (e.map && /^https?:\/\//i.test(e.map)) return e.map;
    return naverSearchUrl((e.place || "").trim());
  }
  function photoSrc(p) {
    if (!p) return "";
    if (/^(https?:|data:|photos\/|\.\/|\/)/.test(p)) return p;
    return "photos/" + p;
  }
  function isOpen(el) {
    return el.classList.contains("is-open");
  }
  function setOpen(el, open) {
    el.classList.toggle("is-open", open);
  }
  function restart(el, cls) {
    // 같은 움직임을 처음부터 다시 틀어요.
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  // ---------- 날짜 계산 ----------
  function daysTogether() {
    const start = parseDate(config.startDate);
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
    const start = parseDate(config.startDate);
    if (start) {
      const passed = Math.round((today - start) / 86400000) + 1;
      const nextHundred = Math.max(100, Math.ceil(passed / 100) * 100);
      const hd = new Date(start.getFullYear(), start.getMonth(), start.getDate() + nextHundred - 1);
      events.push({ icon: "star", name: `${nextHundred}일`, date: hd });
      const ann = nextYearly(start, today);
      const years = ann.getFullYear() - start.getFullYear();
      if (years > 0) events.push({ icon: "flag", name: `${years}주년`, date: ann });
    }
    const hb = parseDate(config.himBirthday);
    if (hb) events.push({ icon: "anniv", name: `${config.him || "석영"} 생일`, date: nextYearly(hb, today) });
    const sb = parseDate(config.herBirthday);
    if (sb) events.push({ icon: "anniv", name: `${config.her || "예은"} 생일`, date: nextYearly(sb, today) });
    events.forEach((ev) => { ev.left = Math.round((ev.date - today) / 86400000); });
    events.sort((a, b) => a.date - b.date);
    return events;
  }

  // ---------- 반짝이 / 알림 ----------
  const SPARK_COLORS = ["#ffd978", "#ee9453", "#a9d8f0", "#b4e2b8", "#ffffff"];
  function burst(x, y, n) {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (let i = 0; i < (n || 6); i++) {
      const el = document.createElement("span");
      el.className = "spark";
      el.innerHTML = PIXEL.icon(i % 2 ? "spark" : "star", i % 2 ? 3 : 1);
      const ang = (Math.PI * 2 * i) / (n || 6) + Math.random() * 0.8;
      const dist = 26 + Math.random() * 26;
      el.style.left = x + "px";
      el.style.top = y + "px";
      el.style.color = SPARK_COLORS[i % SPARK_COLORS.length];
      el.style.setProperty("--dx", Math.round(Math.cos(ang) * dist) + "px");
      el.style.setProperty("--dy", Math.round(Math.sin(ang) * dist - 14) + "px");
      el.addEventListener("animationend", () => el.remove());
      fxLayer().appendChild(el);
    }
  }
  // 반짝이는 화면 밖으로 넘치지 않게 전용 칸 안에서만 날려요.
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
  function burstAt(el, n) {
    const r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, n);
  }
  let toastTimer = null;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    setOpen(t, true);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => setOpen(t, false), 2200);
  }

  // ---------- 머리: 제목, D+ ----------
  function renderHeader() {
    if (config.title) {
      document.title = config.title;
      $("diaryTitle").textContent = config.title;
    }
    const days = daysTogether();
    if (days == null) {
      $("dday").hidden = true;
    } else {
      $("dday").textContent = days > 0 ? `D+${days}` : `D${days - 1}`;
    }
    const rows = [];
    if (parseDate(config.firstMet)) rows.push(["처음 만난 날", fmtDate(config.firstMet)]);
    if (parseDate(config.startDate)) rows.push(["사귄 날", fmtDate(config.startDate)]);
    $("sinceBox").innerHTML = rows.map((r) => `<div><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>`).join("");
  }
  function setSince(open) {
    setOpen($("since"), open);
    $("dday").setAttribute("aria-expanded", String(open));
  }

  // ---------- 풍경: 말풍선과 장난 ----------
  let bubbleIdx = 0;
  let bubbleTimer = null;
  function bubbleLines() {
    const lines = [];
    const days = daysTogether();
    if (days > 0) lines.push(`오늘로 ${days}일째야`);
    const ev = upcomingEvents()[0];
    if (ev) lines.push(ev.left === 0 ? `오늘은 ${ev.name}!` : `${ev.name}까지 ${ev.left}일 남았어`);
    const all = allEntries();
    if (all.length) {
      lines.push(`기록이 ${all.length}개 쌓였어`);
      const places = [...new Set(all.map((e) => (e.place || "").trim()).filter(Boolean))];
      if (places.length) {
        const p = places[Math.floor(Math.random() * places.length)];
        lines.push(`${p.length > 9 ? p.slice(0, 9) + "…" : p} 또 가자`);
      }
    } else {
      lines.push("첫 기록을 남겨 볼까");
    }
    const met = parseDate(config.firstMet);
    if (met) lines.push(`처음 만난 건 ${met.getMonth() + 1}월 ${met.getDate()}일`);
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
  function onAnimEnd(el, cls) {
    el.addEventListener("animationend", function done(ev) {
      if (ev.target !== el && ev.target.parentNode !== el) return;
      el.classList.remove(cls);
      el.removeEventListener("animationend", done);
    });
  }
  function play(el, cls) {
    restart(el, cls);
    onAnimEnd(el, cls);
  }
  function bindScene() {
    $("scene").addEventListener("click", (ev) => {
      const who = ev.target.closest(".bob");
      if (who) {
        play(who, "jump");
        burstAt(who, 6);
        const lines = bubbleLines();
        showBubble(lines[bubbleIdx % lines.length], who.dataset.who);
        bubbleIdx++;
        return;
      }
      const t = ev.target.closest(".tap");
      if (!t) return;
      if (t.classList.contains("sc-sun") || t.classList.contains("sc-moon")) {
        document.body.classList.toggle("night");
        burstAt(t, 8);
      } else if (t.classList.contains("sc-tree")) {
        play(t, "shake");
        burstAt(t, 4);
      } else if (t.classList.contains("sc-flower")) {
        play(t, "boing");
      } else if (t.classList.contains("sc-cloud")) {
        play(t, "puff");
      }
    });
  }

  // ---------- 메뉴 칸 ----------
  function setPanel(name) {
    state.openPanel = name;
    document.querySelectorAll(".menu-btn").forEach((b) => {
      const on = b.dataset.panel === name;
      b.classList.toggle("active", on);
      b.setAttribute("aria-expanded", String(on));
    });
    document.querySelectorAll(".panel").forEach((p) => setOpen(p, p.id === "panel-" + name));
    if (name === "stats") renderStats(true);
    if (name !== "stats") setPlaces(false);
  }

  function renderUpcoming() {
    const events = upcomingEvents();
    $("upcomingList").innerHTML = events.map((ev) => `<div class="up-item">
        <span class="up-icon">${PIXEL.icon(ev.icon, 2)}</span>
        <span class="up-text"><div class="up-name">${esc(ev.name)}</div><div class="up-date">${fmt(ev.date)}</div></span>
        <span class="up-dday${ev.left === 0 ? " today" : ""}">${ev.left === 0 ? "오늘" : "D-" + ev.left}</span>
      </div>`).join("");
    document.querySelector('.menu-btn[data-panel="upcoming"]').hidden = events.length === 0;
  }

  function countUp(el, to) {
    // 화면 주사율에 맞춰 숫자가 올라가요.
    if (to <= 1) { el.textContent = to; return; }
    const dur = 500;
    let t0 = null;
    el.textContent = 0;
    function tick(now) {
      if (t0 === null) t0 = now;
      const k = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  function placeList() {
    const counts = new Map();
    allEntries().forEach((e) => {
      const p = (e.place || "").trim();
      if (p) counts.set(p, (counts.get(p) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }
  function renderStats(animate) {
    const list = allEntries();
    const vals = {
      statTotal: list.length,
      statTravel: list.filter((e) => e.category === "travel").length,
      statFood: list.filter((e) => e.category === "food" || e.category === "cafe").length,
      statPlaces: placeList().length,
    };
    Object.keys(vals).forEach((id) => {
      if (animate) countUp($(id), vals[id]);
      else $(id).textContent = vals[id];
    });
  }
  function setPlaces(open) {
    const box = $("placesList");
    const btn = document.querySelector('.stat[data-stat="places"]');
    if (open) {
      const places = placeList();
      box.innerHTML = places.length
        ? places.map(([p, n]) => `<button class="place" data-place="${esc(p)}">${PIXEL.icon("pin", 2)}${esc(p)}<i>${n}</i></button>`).join("")
        : `<span class="muted">아직 장소가 없어요</span>`;
    }
    setOpen($("places"), open);
    btn.classList.toggle("active", open);
    btn.setAttribute("aria-expanded", String(open));
  }

  // ---------- 필터 ----------
  function setFilter(patch) {
    Object.assign(state, patch);
    document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c.dataset.cat === state.cat));
    if ($("search").value !== state.q) $("search").value = state.q;
    const parts = [];
    if (state.cat !== "all") parts.push(CATS[state.cat] || state.cat);
    if (state.q.trim()) parts.push(`"${state.q.trim()}"`);
    $("activeFilterText").textContent = parts.join(" · ");
    $("activeFilter").hidden = parts.length === 0;
    renderTimeline();
  }

  function filtered() {
    const q = state.q.trim().toLowerCase();
    const list = allEntries().filter((e) => {
      if (state.cat !== "all" && e.category !== state.cat) return false;
      if (!q) return true;
      const hay = [e.title, e.place, e.memo, (e.tags || []).join(" ")].join(" ").toLowerCase();
      return hay.includes(q);
    });
    list.sort((a, b) => {
      if (state.sort === "rating") {
        return (b.rating || 0) - (a.rating || 0) || String(b.date).localeCompare(String(a.date));
      }
      const c = String(a.date).localeCompare(String(b.date));
      return state.sort === "asc" ? c : -c;
    });
    return list;
  }

  // ---------- 기록 목록 ----------
  function cardHtml(e, i) {
    const cat = CATS[e.category] ? e.category : "etc";
    const d = parseDate(e.date);
    const day = d ? `${pad(d.getMonth() + 1)}.${pad(d.getDate())}` : "";
    const src = photoSrc(e.photo);
    const open = state.openCard === e._id;
    return `
      <article class="card cat-${cat}${open ? " open" : ""}" data-id="${esc(e._id)}" style="--i:${Math.min(i || 0, 8)}">
        <button class="card-head" aria-expanded="${open}">
          <span class="cat-ico ${cat}">${PIXEL.icon(cat, 2)}</span>
          <span class="card-title">${esc(e.title)}</span>
          <span class="card-day">${day}</span>
          <span class="chev">${PIXEL.icon("down", 2)}</span>
        </button>
        <div class="card-body fold${open ? " is-open" : ""}"><div class="fold-in"><div class="card-detail">
          <p class="card-meta">${esc(CATS[cat])} · ${esc(fmtDate(e.date))}${e._local ? ' · <span class="muted">임시</span>' : ""}</p>
          ${e.place ? `<a class="card-place" href="${esc(mapUrl(e))}" target="_blank" rel="noopener">${PIXEL.icon("pin", 2)}<span class="place-name">${esc(e.place)}</span><span class="map-go">지도</span></a>` : ""}
          <div class="card-rating">${stars(e.rating)}</div>
          ${src ? `<img class="card-photo" src="${esc(src)}" alt="${esc(e.title)}" loading="lazy" onerror="this.remove()">` : ""}
          ${e.memo ? `<p class="card-memo">${esc(e.memo)}</p>` : ""}
          ${(e.tags || []).length ? `<div class="tags">${e.tags.map((t) => `<button class="tag" data-tag="${esc(t)}">#${esc(t)}</button>`).join("")}</div>` : ""}
          <div class="card-actions"><button class="btn small" data-edit>수정</button></div>
        </div></div></div>
      </article>`;
  }

  function renderTimeline() {
    const list = filtered();
    $("empty").hidden = list.length > 0;
    let html = "";
    if (state.sort === "rating") {
      html = `<div class="month-items"><div class="fold-in">${list.map(cardHtml).join("")}</div></div>`;
    } else {
      // 달마다 묶어서, 달 이름을 누르면 접혀요.
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

  function setOpenCard(id) {
    const prev = document.querySelector(".card.open");
    if (prev && prev.dataset.id !== id) {
      prev.classList.remove("open");
      setOpen(prev.querySelector(".card-body"), false);
      prev.querySelector(".card-head").setAttribute("aria-expanded", "false");
    }
    state.openCard = id;
    if (!id) return;
    const card = [...document.querySelectorAll(".card")].find((c) => c.dataset.id === id);
    if (!card) return;
    card.classList.add("open");
    setOpen(card.querySelector(".card-body"), true);
    card.querySelector(".card-head").setAttribute("aria-expanded", "true");
  }

  function renderAll() {
    renderStats(false);
    renderUpcoming();
    renderTimeline();
    if (isOpen($("places"))) setPlaces(true);
  }

  // ---------- 입력창 ----------
  let rating = 5;
  function setRating(n, pop) {
    rating = n;
    $("fRating").querySelectorAll("span").forEach((s) => {
      s.innerHTML = PIXEL.icon("star", 3);
      const on = Number(s.dataset.v) <= n;
      s.classList.toggle("on", on);
      if (pop && on) play(s, "boing");
    });
  }
  function openModal(entry) {
    $("form").reset();
    if (entry) {
      $("modalTitle").textContent = "기록 수정";
      $("fId").value = entry._id;
      $("fDate").value = entry.date || "";
      $("fCat").value = CATS[entry.category] ? entry.category : "etc";
      $("fTitle").value = entry.title || "";
      $("fPlace").value = entry.place || "";
      $("fMap").value = entry.map || "";
      $("fMemo").value = entry.memo || "";
      $("fTags").value = (entry.tags || []).join(", ");
      $("fPhoto").value = entry.photo || "";
      setRating(Number(entry.rating) || 0);
      $("btnDelete").hidden = false;
    } else {
      $("modalTitle").textContent = "새 기록";
      $("fId").value = "";
      const t = new Date();
      $("fDate").value = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
      setRating(5);
      $("btnDelete").hidden = true;
    }
    $("modal").classList.remove("closing");
    $("modal").hidden = false;
    $("fTitle").focus();
  }
  function closeModal() {
    const m = $("modal");
    if (m.hidden || m.classList.contains("closing")) return;
    m.classList.add("closing");
    setTimeout(() => {
      m.hidden = true;
      m.classList.remove("closing");
    }, 160);
  }
  function upsertLocal(entry) {
    const i = localEntries.findIndex((e) => e._id === entry._id);
    if (i >= 0) localEntries[i] = entry;
    else localEntries.push(entry);
    saveLocal();
  }

  // ---------- 내보내기 ----------
  function exportCode() {
    const list = allEntries()
      .slice()
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .map((e) => ({
        date: e.date || "",
        category: e.category || "etc",
        title: e.title || "",
        place: e.place || "",
        map: e.map || "",
        rating: Number(e.rating) || 0,
        memo: e.memo || "",
        tags: e.tags || [],
        photo: e.photo || "",
      }));
    return "const DIARY_ENTRIES = " + JSON.stringify(list, null, 2) + ";\n";
  }
  function fullFile() {
    return (
      "// 석영이와 예은이 일지 데이터 (사이트에서 내보낸 파일)\n" +
      "// category: date / travel / food / cafe / anniv / etc, rating: 1~5\n\n" +
      "const DIARY_CONFIG = " + JSON.stringify(config, null, 2) + ";\n\n" +
      exportCode()
    );
  }

  // ---------- events ----------
  function bind() {
    // 바깥을 누르면 펼쳐진 것들이 닫혀요. (다른 처리보다 먼저 돌아요)
    document.addEventListener("click", (ev) => {
      const t = ev.target;
      if (!t.closest) return;
      if (t.closest(".modal") || t.closest(".toast")) return;
      if (!t.closest(".couple")) hideBubble();
      if (!t.closest("#dday") && !t.closest("#since")) setSince(false);
      if (state.openPanel && !t.closest("#menu") && !t.closest("#panels")) setPanel(null);
      if (state.openCard && !t.closest(".card")) setOpenCard(null);
    }, true);
    document.addEventListener("keydown", (ev) => {
      if (ev.key !== "Escape") return;
      if (!$("modal").hidden) { closeModal(); return; }
      hideBubble();
      setSince(false);
      setPanel(null);
      setOpenCard(null);
    });

    bindScene();

    $("dday").addEventListener("click", () => {
      const open = !isOpen($("since"));
      setSince(open);
      if (open) burstAt($("dday"), 8);
    });

    $("menu").addEventListener("click", (ev) => {
      const b = ev.target.closest(".menu-btn");
      if (!b) return;
      setPanel(state.openPanel === b.dataset.panel ? null : b.dataset.panel);
    });

    // 통계 칸: 숫자를 누르면 그 종류만 보여요.
    $("panel-stats").addEventListener("click", (ev) => {
      const place = ev.target.closest(".place");
      if (place) {
        setFilter({ cat: "all", q: place.dataset.place });
        toast(`"${place.dataset.place}" 기록만 보는 중`);
        return;
      }
      const s = ev.target.closest(".stat");
      if (!s) return;
      play(s, "boing");
      const kind = s.dataset.stat;
      if (kind === "places") {
        setPlaces(!isOpen($("places")));
        return;
      }
      setPlaces(false);
      setFilter({ cat: kind, q: "" });
      toast(kind === "all" ? "전체 기록 보는 중" : `${CATS[kind]} 기록만 보는 중`);
    });

    $("filters").addEventListener("click", (ev) => {
      const b = ev.target.closest(".chip");
      if (!b) return;
      play(b, "boing");
      setFilter({ cat: b.dataset.cat });
    });
    $("search").addEventListener("input", (ev) => setFilter({ q: ev.target.value }));
    $("sort").addEventListener("change", (ev) => setFilter({ sort: ev.target.value }));
    $("btnClearFilter").addEventListener("click", () => setFilter({ cat: "all", q: "" }));

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
        const entry = allEntries().find((e) => e._id === card.dataset.id);
        if (entry) openModal(entry);
        return;
      }
      const tag = ev.target.closest(".tag");
      if (tag) {
        setFilter({ cat: "all", q: tag.dataset.tag });
        toast(`#${tag.dataset.tag} 기록만 보는 중`);
        return;
      }
      if (ev.target.closest(".card-head")) {
        setOpenCard(state.openCard === card.dataset.id ? null : card.dataset.id);
      }
    });

    $("btnAdd").addEventListener("click", () => {
      play($("btnAdd"), "boing");
      openModal(null);
    });
    $("btnCancel").addEventListener("click", closeModal);
    $("modal").addEventListener("click", (ev) => {
      if (ev.target === $("modal")) closeModal();
    });
    // 입력창의 "찾기": 적어 둔 장소 이름으로 네이버 지도를 열어요.
    $("btnFindMap").addEventListener("click", (ev) => {
      const place = $("fPlace").value.trim();
      if (!place) {
        ev.preventDefault();
        toast("장소를 먼저 적어 주세요");
        $("fPlace").focus();
        return;
      }
      $("btnFindMap").href = naverSearchUrl(place);
    });
    $("fRating").addEventListener("click", (ev) => {
      const s = ev.target.closest("span[data-v]");
      if (s) setRating(Number(s.dataset.v), true);
    });

    $("form").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const isNew = !$("fId").value;
      const entry = {
        _id: $("fId").value || "local-" + Date.now(),
        date: $("fDate").value,
        category: $("fCat").value,
        title: $("fTitle").value.trim(),
        place: $("fPlace").value.trim(),
        map: $("fMap").value.trim(),
        rating: rating,
        memo: $("fMemo").value.trim(),
        tags: $("fTags").value.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean),
        photo: $("fPhoto").value.trim(),
      };
      upsertLocal(entry);
      closeModal();
      state.openCard = entry._id;
      renderAll();
      const card = document.querySelector(".card.open");
      if (card) burstAt(card.querySelector(".cat-ico"), 8);
      toast(isNew ? "기록을 남겼어요" : "고쳤어요");
    });

    $("btnDelete").addEventListener("click", () => {
      const id = $("fId").value;
      if (!id || !confirm("이 기록을 지울까요?")) return;
      if (id.startsWith("file-")) {
        // 파일에 있는 기록은 "삭제 표시"만 해 두고, 내보내기 때 빠지게 해요.
        upsertLocal({ _id: id, _deleted: true });
      } else {
        localEntries = localEntries.filter((e) => e._id !== id);
        saveLocal();
      }
      closeModal();
      state.openCard = null;
      renderAll();
      toast("지웠어요");
    });

    $("btnExport").addEventListener("click", async () => {
      const code = exportCode();
      $("exportBox").value = code;
      try {
        await navigator.clipboard.writeText(code);
        toast("코드를 복사했어요");
      } catch (e) {
        $("exportBox").select();
        toast("아래 코드를 복사해 주세요");
      }
    });
    $("btnDownload").addEventListener("click", () => {
      const blob = new Blob([fullFile()], { type: "text/javascript;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "entries.js";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    $("btnClearLocal").addEventListener("click", () => {
      if (!confirm("이 브라우저에만 저장된 기록과 수정 내용을 모두 지울까요?\n(깃에 올린 data/entries.js 기록은 그대로예요)")) return;
      localEntries = [];
      saveLocal();
      state.openCard = null;
      renderAll();
      toast("임시 기록을 비웠어요");
    });
  }

  // 저녁 7시부터 아침 6시까지는 밤 풍경
  const hour = new Date().getHours();
  if (hour >= 19 || hour < 6) document.body.classList.add("night");

  PIXEL.fill(document);
  renderHeader();
  bind();
  renderAll();

  // 처음 한 번, 눌러 볼 수 있다는 걸 알려 줘요.
  setTimeout(() => {
    if (!isOpen($("bubble")) && bubbleIdx === 0) showBubble("우리를 눌러 봐", "her");
  }, 1200);
})();
