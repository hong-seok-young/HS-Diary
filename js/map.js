// ============================================================
// 우리 지도: 도트 세계지도와 우리나라 지도에 가 본 곳을 핀으로 꽂아요.
// - 가 본 곳: "기록"의 장소나 제목에 그곳 이름이 들어 있으면 저절로 빨간 핀. 여행 계획 화면에서 손으로 찍을 수도 있어요.
// - 갈 곳: 여행 날짜를 정해 두면 노란 핀에 며칠 남았는지 떠요.
// - 아직: 회색 핀에 이름만 흐리게.
// - 지도나 아래 목록에서 핀을 누르면 그곳의 여행 계획 화면(js/trip.js)이 열려요.
// 지형과 여행지 목록은 js/geo.js 에 있어요.
// ============================================================
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const G = window.GEO;
  if (!G) return;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  let mode = "korea";
  try { mode = sessionStorage.getItem("hsd.map") === "world" ? "world" : "korea"; } catch (e) { /* 괜찮아요 */ }
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const dots = (s) => String(s || "").replace(/-/g, ".");
  const daysTo = (k) => { const p = k.split("-").map(Number), t = today().split("-").map(Number); return Math.round((new Date(p[0], p[1] - 1, p[2]) - new Date(t[0], t[1] - 1, t[2])) / 86400000); };

  // ---------- 그곳의 상태 ----------
  // 둘 중 나중에 바꾼 쪽 값
  function latest(key) {
    let v = null, t = -1;
    ["him", "her"].forEach((w) => { const x = Store.pair(key, w), at = Store.pairTime(key, w); if (x != null && at > t) { v = x; t = at; } });
    return v;
  }
  function records(p) {
    const keys = p.keys.map((k) => k.toLowerCase());
    return Store.list("entries").filter((e) => { const s = ((e.place || "") + " " + (e.title || "") + " " + (e.tags || []).join(" ")).toLowerCase(); return keys.some((k) => s.indexOf(k) >= 0); })
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }
  function planOf(id) {
    const v = latest("tp:" + id + ":plan");
    const base = window.TRIPS && TRIPS[id] && TRIPS[id].plan ? TRIPS[id].plan : null; // 미리 짜 둔 계획이 있는 곳 (삿포로)
    const o = v && typeof v === "object" ? v : {};
    return { from: o.from !== undefined ? o.from : base ? base.from : "", to: o.to !== undefined ? o.to : base ? base.to : "", items: Array.isArray(o.items) ? o.items : null };
  }
  // 돌려주는 값: { st: "been" 가 봤어요 | "soon" 갈 거예요 | "none" 아직, when 날짜 글, recs 그곳 기록들, d 남은 날 }
  function state(p) {
    const recs = records(p), mark = latest("mv:" + p.id), plan = planOf(p.id);
    const marked = mark && typeof mark === "object" && mark.v;
    if (plan.from && plan.to && today() > plan.to) return { st: "been", when: dots(plan.from), recs, plan };
    if (recs.length) return { st: "been", when: dots(recs[0].date), recs, plan };
    if (marked) return { st: "been", when: mark.d ? dots(mark.d) : "가 봤어요", recs, plan };
    if (plan.from) { const d = daysTo(plan.from); return { st: "soon", when: d > 0 ? `D-${d}` : d === 0 ? "오늘 출발" : "여행 중", recs, plan, d }; }
    return { st: "none", when: "아직", recs, plan };
  }
  const placesOf = (m) => G.places[m];
  const find = (id) => G.places.korea.concat(G.places.world).find((p) => p.id === id) || null;

  // ---------- 지도 그리기 ----------
  const PIN = { been: [".ooo.", "oRRRo", "oRWRo", "oRRRo", ".oRo.", "..o.."], soon: [".ooo.", "oYYYo", "oYWYo", "oYYYo", ".oYo.", "..o.."], none: [".ooo.", "oGGGo", "oGgGo", ".ooo."] };
  const PAL = { o: "#3b2a20", R: "#e8504f", Y: "#ffc83a", W: "#ffffff", G: "#a09aa8", g: "#6a6472" };
  let spots = []; // 눌렀을 때 찾으려고: [{ id, x, y }]
  function draw() {
    const cv = $("mapCv");
    if (!cv) return;
    const W = G[mode], box = cv.parentNode.clientWidth - 12;
    const PX = Math.max(2, Math.floor(box / W.cols)) || 3;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const w = W.cols * PX, h = W.rows * PX;
    cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + "px"; cv.style.height = h + "px";
    const c = cv.getContext("2d");
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = W.grid, at = (r, q) => (r >= 0 && r < W.rows && q >= 0 && q < W.cols && g[r][q] !== "." ? g[r][q] : "");
    const list = placesOf(mode).map((p) => ({ p, s: state(p) }));
    // 가 본 나라는 분홍으로 (세계 지도)
    const beenCc = {};
    if (mode === "world") {
      list.forEach(({ p, s }) => { if (s.st === "been") beenCc[p.cc] = 1; });
      if (G.places.korea.some((p) => state(p).st === "been")) beenCc.KOR = 1;
      beenCc.KOR = 1; // 우리가 사는 곳
    }
    c.fillStyle = "#a9dcf7"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#c4e8fb";
    for (let r = 0; r < W.rows; r += 3) for (let q = (r * 5) % 7; q < W.cols; q += 7) if (!at(r, q) && !at(r, q + 1)) c.fillRect(q * PX, r * PX, PX * 2, Math.max(1, PX / 2));
    const col = (ch) => (mode === "world" ? (beenCc[W.codes[ch]] ? ["#ffb3c9", "#e9879f"] : ["#efe2bd", "#cdbb8c"]) : ch === "K" ? ["#bfe59a", "#8fc46a"] : ["#e3dcc8", "#c9c0a8"]);
    for (let r = 0; r < W.rows; r++) for (let q = 0; q < W.cols; q++) { const k = at(r, q); if (!k) continue; const cc = col(k); c.fillStyle = at(r + 1, q) ? cc[0] : cc[1]; c.fillRect(q * PX, r * PX, PX, PX); }
    c.fillStyle = "rgba(59,42,32,.55)";
    for (let r = 0; r < W.rows; r++) for (let q = 0; q < W.cols; q++) {
      if (!at(r, q)) continue;
      if (!at(r - 1, q)) c.fillRect(q * PX, r * PX, PX, 1);
      if (!at(r + 1, q)) c.fillRect(q * PX, (r + 1) * PX - 1, PX, 1);
      if (!at(r, q - 1)) c.fillRect(q * PX, r * PX, 1, PX);
      if (!at(r, q + 1)) c.fillRect((q + 1) * PX - 1, r * PX, 1, PX);
    }
    const xy = (p) => (mode === "world"
      ? [(((p.lon - W.lon0) % 360) + 360) % 360 / 360 * w, (W.lat0 - p.lat) / (W.lat0 - W.lat1) * h]
      : [(p.lon - W.lon0) / (W.lon1 - W.lon0) * w, (W.lat0 - p.lat) / (W.lat0 - W.lat1) * h]);
    const s = mode === "world" ? 2 : 3;
    const stamp = (rows, x, y) => rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const ch = row[i]; if (ch === ".") continue; c.fillStyle = PAL[ch]; c.fillRect(Math.round(x - (row.length * s) / 2) + i * s, Math.round(y - rows.length * s) + j * s, s, s); } });
    spots = [];
    // 아직 → 갈 곳 → 가 본 곳 순으로 겹쳐 그려요 (가 본 곳이 맨 위)
    ["none", "soon", "been"].forEach((st) => list.filter((x) => x.s.st === st).forEach(({ p }) => { const [x, y] = xy(p); stamp(PIN[st], x, st === "none" ? y + s * 2 : y); spots.push({ id: p.id, x, y: y - s * 3 }); }));
    // 우리나라 지도에서는 가 본 곳과 갈 곳에 이름표
    if (mode === "korea") {
      c.font = "11px NeoDunggeunmo, monospace"; c.textBaseline = "middle";
      list.filter((x) => x.s.st !== "none").forEach(({ p, s: st }) => {
        const [x, y] = xy(p), t = st.st === "soon" ? `${p.name} ${st.when}` : p.name, tw = c.measureText(t).width + 8;
        const lx = x + 8 + tw + 4 > w ? x - 12 - tw : x + 8;
        c.fillStyle = "#3b2a20"; c.fillRect(lx, y - 22, tw + 4, 18);
        c.fillStyle = st.st === "soon" ? "#ffe9a8" : "#fff8e6"; c.fillRect(lx + 2, y - 20, tw, 14);
        c.fillStyle = "#3b2a20"; c.fillText(t, lx + 6, y - 12.5);
      });
    }
  }
  const pinSvg = (st) => {
    const rows = st === "none" ? [".ooo.", "ooooo", "ooooo", "ooooo", ".ooo.", "..o.."] : PIN[st];
    let r = "";
    rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] !== ".") r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${st === "none" ? "#2a2630" : PAL[row[x]]}"/>`; });
    return `<svg class="map-pin" width="25" height="30" viewBox="0 0 5 6" shape-rendering="crispEdges">${r}</svg>`;
  };

  function render() {
    const view = document.querySelector('.view[data-view="map"]');
    if (!view || !window.Store) return;
    const list = placesOf(mode).map((p) => ({ p, s: state(p) }));
    const been = list.filter((x) => x.s.st === "been").length;
    $("mapTabs").innerHTML = `<button class="chip${mode === "korea" ? " active" : ""}" data-map="korea">우리나라</button><button class="chip${mode === "world" ? " active" : ""}" data-map="world">세계</button>`;
    $("mapCount").textContent = `가 본 곳 ${been} / ${list.length}`;
    const order = { soon: 0, been: 1, none: 2 };
    const html = list.slice().sort((a, b) => order[a.s.st] - order[b.s.st] || (a.s.st === "soon" ? (a.s.d || 0) - (b.s.d || 0) : 0))
      .map(({ p, s }) => `<button class="deco-it map-it ${s.st}" data-place="${esc(p.id)}">${pinSvg(s.st)}<small class="nm">${esc(p.name)}</small><small class="wh">${esc(s.when)}</small></button>`).join("");
    if (window.MORPH) MORPH($("mapList"), html); else $("mapList").innerHTML = html;
    draw();
  }
  function open(id) { if (window.Trip && find(id)) Trip.open(find(id)); }
  function bind() {
    const view = document.querySelector('.view[data-view="map"]');
    if (!view || view.dataset.bound) return;
    view.dataset.bound = "1";
    $("mapTabs").addEventListener("click", (ev) => { const b = ev.target.closest("[data-map]"); if (!b) return; mode = b.dataset.map; try { sessionStorage.setItem("hsd.map", mode); } catch (e) { /* 괜찮아요 */ } render(); });
    $("mapList").addEventListener("click", (ev) => { const b = ev.target.closest("[data-place]"); if (b) open(b.dataset.place); });
    // 지도에서 핀 가까이를 누르면 그곳이 열려요
    $("mapCv").addEventListener("click", (ev) => {
      const r = ev.currentTarget.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top;
      let best = null, bd = 18;
      spots.forEach((s) => { const d = Math.hypot(s.x - x, s.y - y); if (d < bd) { bd = d; best = s; } });
      if (best) open(best.id);
    });
    window.addEventListener("resize", () => { if (view.classList.contains("is-active")) draw(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (view.classList.contains("is-active")) draw(); });
  }
  if (window.Store) Store.onChange(() => { const v = document.querySelector('.view[data-view="map"]'); if (v && v.classList.contains("is-active")) render(); });
  document.addEventListener("DOMContentLoaded", bind);
  window.MapView = { render: () => { bind(); render(); }, state, find, latest, planOf, records, today, dots, daysTo, pinSvg };
})();
