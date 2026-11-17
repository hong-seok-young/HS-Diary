// ============================================================
// 석영이와 예은이
// - data/entries.js 의 기록 + 이 브라우저(localStorage)에 임시 저장한 기록을 합쳐서 보여줘요.
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
  let state = { cat: "all", q: "", sort: "desc" };

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
    const merged = fileEntries.filter((e) => !overridden.has(e._id)).concat(
      localEntries.filter((e) => !e._deleted).map((e) => ({ ...e, _local: true }))
    );
    return merged;
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
  function fmtDate(s) {
    const d = parseDate(s);
    if (!d) return s || "";
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} (${DAYS[d.getDay()]})`;
  }
  function stars(n) {
    n = Math.max(0, Math.min(5, Number(n) || 0));
    let out = "";
    for (let i = 1; i <= 5; i++) out += `<span class="star${i <= n ? " on" : ""}">${PIXEL.icon("star", 2)}</span>`;
    return out;
  }
  function photoSrc(p) {
    if (!p) return "";
    if (/^(https?:|data:|photos\/|\.\/|\/)/.test(p)) return p;
    return "photos/" + p;
  }

  // ---------- header ----------
  function renderHeader() {
    if (config.title) {
      document.title = config.title;
      $("diaryTitle").textContent = config.title;
    }
    const start = parseDate(config.startDate);
    if (start) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const days = Math.round((today - start) / 86400000) + 1; // 사귄 날이 1일
      $("dday").textContent = days > 0 ? `D+${days}` : `D${days - 1}`;
    } else {
      $("dday").hidden = true;
    }
    const bits = [];
    if (parseDate(config.firstMet)) bits.push(`처음 만난 날 ${fmtDate(config.firstMet)}`);
    if (start) bits.push(`사귄 날 ${fmtDate(config.startDate)}`);
    $("since").innerHTML = bits.map((t) => `<span>${esc(t)}</span>`).join("");
  }

  // ---------- 다가오는 기념일 ----------
  function nextYearly(md, today) {
    // md: 기준 날짜(월/일만 사용). 오늘 포함해서 다음에 오는 날짜를 돌려줘요.
    let d = new Date(today.getFullYear(), md.getMonth(), md.getDate());
    if (d < today) d = new Date(today.getFullYear() + 1, md.getMonth(), md.getDate());
    return d;
  }
  function renderUpcoming() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const events = [];
    const start = parseDate(config.startDate);
    if (start) {
      // 다음 100일 단위 (사귄 날이 1일)
      const passed = Math.round((today - start) / 86400000) + 1;
      const nextHundred = Math.max(100, Math.ceil(passed / 100) * 100);
      const hd = new Date(start.getFullYear(), start.getMonth(), start.getDate() + nextHundred - 1);
      events.push({ icon: "star", name: `${nextHundred}일`, date: hd });
      // 다음 N주년
      const ann = nextYearly(start, today);
      const years = ann.getFullYear() - start.getFullYear();
      if (years > 0) events.push({ icon: "flag", name: `${years}주년`, date: ann });
    }
    const hb = parseDate(config.himBirthday);
    if (hb) events.push({ icon: "anniv", name: `${config.him || "석영"} 생일`, date: nextYearly(hb, today) });
    const sb = parseDate(config.herBirthday);
    if (sb) events.push({ icon: "anniv", name: `${config.her || "예은"} 생일`, date: nextYearly(sb, today) });

    if (!events.length) return;
    events.sort((a, b) => a.date - b.date);
    $("upcomingList").innerHTML = events.map((ev) => {
      const left = Math.round((ev.date - today) / 86400000);
      const ds = `${ev.date.getFullYear()}.${String(ev.date.getMonth() + 1).padStart(2, "0")}.${String(ev.date.getDate()).padStart(2, "0")} (${DAYS[ev.date.getDay()]})`;
      return `<div class="up-item">
        <span class="up-icon">${PIXEL.icon(ev.icon, 2)}</span>
        <span class="up-text"><div class="up-name">${esc(ev.name)}</div><div class="up-date">${ds}</div></span>
        <span class="up-dday${left === 0 ? " today" : ""}">${left === 0 ? "오늘" : "D-" + left}</span>
      </div>`;
    }).join("");
    $("upcoming").hidden = false;
  }

  // ---------- stats ----------
  function renderStats(list) {
    $("statTotal").textContent = list.length;
    $("statTravel").textContent = list.filter((e) => e.category === "travel").length;
    $("statFood").textContent = list.filter((e) => e.category === "food" || e.category === "cafe").length;
    $("statPlaces").textContent = new Set(list.map((e) => (e.place || "").trim()).filter(Boolean)).size;
  }

  // ---------- list ----------
  function filtered() {
    const q = state.q.trim().toLowerCase();
    let list = allEntries().filter((e) => {
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

  function render() {
    const all = allEntries();
    renderStats(all);
    const list = filtered();
    const box = $("timeline");
    $("empty").hidden = list.length > 0;

    let html = "";
    let lastMonth = "";
    list.forEach((e) => {
      const d = parseDate(e.date);
      const month = d ? `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}` : "날짜 없음";
      if (state.sort !== "rating" && month !== lastMonth) {
        html += `<div class="month-label"><span>${esc(month)}</span></div>`;
        lastMonth = month;
      }
      const cat = CATS[e.category] ? e.category : "etc";
      const src = photoSrc(e.photo);
      html += `
        <article class="card cat-${cat}" data-id="${esc(e._id)}" tabindex="0" title="눌러서 수정">
          <div class="card-top">
            <span class="badge ${cat}">${PIXEL.icon(cat, 2)}${CATS[cat]}</span>
            ${e._local ? '<span class="badge local">임시</span>' : ""}
            <span class="card-date">${esc(fmtDate(e.date))}</span>
          </div>
          <h3>${esc(e.title)}</h3>
          ${e.place ? `<p class="card-place">${PIXEL.icon("pin", 2)}${esc(e.place)}</p>` : ""}
          <div class="card-rating">${stars(e.rating)}</div>
          ${src ? `<img class="card-photo" src="${esc(src)}" alt="${esc(e.title)}" loading="lazy" onerror="this.remove()">` : ""}
          ${e.memo ? `<p class="card-memo">${esc(e.memo)}</p>` : ""}
          ${(e.tags || []).length ? `<div class="tags">${e.tags.map((t) => `<span class="tag">#${esc(t)}</span>`).join("")}</div>` : ""}
        </article>`;
    });
    box.innerHTML = html;
  }

  // ---------- modal ----------
  let rating = 5;
  function setRating(n) {
    rating = n;
    $("fRating").querySelectorAll("span").forEach((s) => {
      s.innerHTML = PIXEL.icon("star", 3);
      s.classList.toggle("on", Number(s.dataset.v) <= n);
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
      $("fMemo").value = entry.memo || "";
      $("fTags").value = (entry.tags || []).join(", ");
      $("fPhoto").value = entry.photo || "";
      setRating(Number(entry.rating) || 0);
      $("btnDelete").hidden = false;
    } else {
      $("modalTitle").textContent = "새 기록";
      $("fId").value = "";
      const t = new Date();
      $("fDate").value = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
      setRating(5);
      $("btnDelete").hidden = true;
    }
    $("modal").hidden = false;
    $("fTitle").focus();
  }
  function closeModal() {
    $("modal").hidden = true;
  }

  function upsertLocal(entry) {
    const i = localEntries.findIndex((e) => e._id === entry._id);
    if (i >= 0) localEntries[i] = entry;
    else localEntries.push(entry);
    saveLocal();
  }

  // ---------- export ----------
  function exportCode() {
    const list = allEntries()
      .slice()
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .map((e) => ({
        date: e.date || "",
        category: e.category || "etc",
        title: e.title || "",
        place: e.place || "",
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
    $("filters").addEventListener("click", (ev) => {
      const b = ev.target.closest(".chip");
      if (!b) return;
      document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      b.classList.add("active");
      state.cat = b.dataset.cat;
      render();
    });
    $("search").addEventListener("input", (ev) => {
      state.q = ev.target.value;
      render();
    });
    $("sort").addEventListener("change", (ev) => {
      state.sort = ev.target.value;
      render();
    });
    $("btnAdd").addEventListener("click", () => openModal(null));
    $("btnCancel").addEventListener("click", closeModal);
    $("modal").addEventListener("click", (ev) => {
      if (ev.target === $("modal")) closeModal();
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && !$("modal").hidden) closeModal();
    });
    $("fRating").addEventListener("click", (ev) => {
      const s = ev.target.closest("span");
      if (s) setRating(Number(s.dataset.v));
    });

    const openFromCard = (ev) => {
      const card = ev.target.closest(".card");
      if (!card) return;
      const entry = allEntries().find((e) => e._id === card.dataset.id);
      if (entry) openModal(entry);
    };
    $("timeline").addEventListener("click", openFromCard);
    $("timeline").addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") openFromCard(ev);
    });

    $("form").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const entry = {
        _id: $("fId").value || "local-" + Date.now(),
        date: $("fDate").value,
        category: $("fCat").value,
        title: $("fTitle").value.trim(),
        place: $("fPlace").value.trim(),
        rating: rating,
        memo: $("fMemo").value.trim(),
        tags: $("fTags").value.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean),
        photo: $("fPhoto").value.trim(),
      };
      upsertLocal(entry);
      closeModal();
      render();
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
      render();
    });

    $("btnExport").addEventListener("click", async () => {
      const code = exportCode();
      $("exportBox").value = code;
      try {
        await navigator.clipboard.writeText(code);
        $("btnExport").textContent = "복사 완료";
      } catch (e) {
        $("exportBox").select();
        $("btnExport").textContent = "아래 코드 복사";
      }
      setTimeout(() => ($("btnExport").textContent = "코드 복사"), 2000);
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
      render();
    });
  }

  PIXEL.fill(document);
  renderHeader();
  renderUpcoming();
  bind();
  render();
})();
