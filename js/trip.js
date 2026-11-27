// ============================================================
// 여행 계획 화면: 지도에서 핀을 누르면 그곳의 계획 화면이 떠요.
// 구성은 삿포로 여행 안내(따로 만든 누리집)를 따랐어요: 일정 · 맛집 · 볼거리 · 쇼핑 · 가는 길 · 체크 · 더보기.
// - 조사해 둔 자료(맛집, 볼거리, 추천 코스, 가는 법, 예상 비용)는 data/trips/<id>.js 에 있고, 열 때 그 파일만 불러와요.
// - 둘이 같이 쓰는 것: 여행 날짜, 우리 일정, 찜, 할 일과 짐 체크. 한 사람이 바꾸면 상대 폰에도 그대로 보여요.
//   (기록의 pairs 에 "tp:<곳>:plan / star / chk / own", "mv:<곳>" 으로 들어가요)
// ============================================================
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const M = () => window.MapView;
  const me = () => (window.Store && Store.me()) || "";
  const toast = (t) => { if (window.HSD && HSD.toast) HSD.toast(t); };
  window.TRIPS = window.TRIPS || {};
  const TABS = [["plan", "일정"], ["food", "맛집"], ["sight", "볼거리"], ["shop", "쇼핑"], ["way", "가는 길"], ["check", "체크"], ["more", "더보기"]];
  const BASE = {
    todo: ["숙소 예약", "교통편 예매 (기차, 버스, 배, 비행기)", "가고 싶은 맛집 예약과 쉬는 날 확인", "떠나기 전날 날씨 확인"],
    pack: ["신분증", "충전기와 보조 배터리", "세면도구", "상비약", "우산", "편한 신발"],
  };
  // 미리 다 짜 둔 여행(삿포로)은 그 구성 그대로: 일정 · 맛집 · 쇼핑 · 볼거리 · 예약 · 운전 · 체크 · 더보기
  const TABS_C = [["plan", "일정"], ["food", "맛집"], ["shop", "쇼핑"], ["sight", "볼거리"], ["book", "예약"], ["drive", "운전"], ["check", "체크"], ["more", "더보기"]];
  const SUBS = { book: ["flight", "stay", "car", "icn"], drive: ["fuel", "park"], check: ["todo", "pack"], more: ["jp", "cost", "atm", "info", "set"] };
  let root = null, sheet = null, P = null, tab = "plan", loading = {};
  let ui = { day: 0, area: { food: 0, shop: 0, sight: 0 }, kf: "", sub: { book: "flight", drive: "fuel", check: "todo", more: "jp" } };

  // ---------- 둘이 같이 쓰는 값 ----------
  const key = (k) => `tp:${P.id}:${k}`;
  const data = () => TRIPS[P.id] || null;
  function plan() { return M().planOf(P.id); }
  function savePlan(patch) { const p = plan(); Store.setPair(key("plan"), me(), Object.assign({ from: p.from, to: p.to, items: p.items || [] }, patch)); }
  // 찜: 한 사람이라도 찜했으면 별
  function stars() { const o = {}; ["him", "her"].forEach((w) => { const v = Store.pair(key("star"), w); if (v && typeof v === "object") Object.keys(v).forEach((n) => { if (v[n]) o[n] = (o[n] || "") + (w === "him" ? "♂" : "♀"); }); }); return o; }
  function toggleStar(name) { const v = Object.assign({}, Store.pair(key("star"), me()) || {}); if (v[name]) delete v[name]; else v[name] = 1; Store.setPair(key("star"), me(), v); }
  // 체크: 항목마다 나중에 누른 쪽이 이겨요
  function checks() { const o = {}; ["him", "her"].forEach((w) => { const v = Store.pair(key("chk"), w); if (v && typeof v === "object") Object.keys(v).forEach((k) => { const x = v[k]; if (Array.isArray(x) && (!o[k] || x[1] > o[k][1])) o[k] = x; }); }); return o; }
  function setCheck(k, on) { const v = Object.assign({}, Store.pair(key("chk"), me()) || {}); v[k] = [on ? 1 : 0, Date.now()]; Store.setPair(key("chk"), me(), v); }
  function own() { const v = M().latest(key("own")); return v && typeof v === "object" ? { todo: v.todo || [], pack: v.pack || [] } : { todo: [], pack: [] }; }
  function saveOwn(o) { Store.setPair(key("own"), me(), o); }
  const mapUrl = (q) => (P.cc ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q) : "https://map.naver.com/p/search/" + encodeURIComponent(q));
  const won = (n) => Number(n || 0).toLocaleString("ko-KR") + "원";

  // ---------- 틀 ----------
  function ensure() {
    if (root) return;
    root = document.createElement("div");
    root.className = "modal trip"; root.id = "tripPage"; root.hidden = true;
    root.innerHTML = `<div class="trip-card"><header class="trip-head"><div class="trip-ttl"><b id="tripName"></b><small id="tripTag"></small></div><span class="trip-st" id="tripSt"></span></header><nav class="trip-tabs" id="tripTabs"></nav><div class="trip-body" id="tripBody"></div></div>`;
    sheet = document.createElement("div");
    sheet.className = "modal trip-sheet"; sheet.id = "tripSheet"; sheet.hidden = true;
    sheet.innerHTML = `<div class="modal-card box trip-sh" id="tripShBody"></div>`;
    // 뒤로 가기는 문서에서 앞에 있는 창부터 닫아요. 자세히 보기 창이 먼저 닫히게 그것을 앞에 둬요.
    document.body.appendChild(sheet);
    document.body.appendChild(root);
    sheet.addEventListener("click", (ev) => { if (ev.target === sheet) history.back(); });
    root.addEventListener("click", onClick);
    sheet.addEventListener("click", onClick);
    root.addEventListener("change", onChange);
    root.addEventListener("submit", onSubmit);
  }
  const show = (el) => { el.hidden = false; el.classList.remove("closing"); document.body.classList.add("no-scroll"); document.dispatchEvent(new Event("hsd:layer")); };
  function open(place) {
    if (!me()) return;
    ensure();
    P = place; tab = "plan";
    ui = { day: 0, area: { food: 0, shop: 0, sight: 0 }, kf: "", sub: { book: "flight", drive: "fuel", check: "todo", more: "jp" } };
    show(root);
    render();
    // 조사해 둔 자료를 그때 불러와요
    if (!TRIPS[P.id] && !loading[P.id]) {
      loading[P.id] = 1;
      const s = document.createElement("script");
      s.src = `data/trips/${P.id}.js`;
      s.onload = () => { loading[P.id] = 2; if (P && P.id === place.id && !root.hidden) render(); };
      s.onerror = () => { loading[P.id] = 3; if (P && P.id === place.id && !root.hidden) render(); };
      document.head.appendChild(s);
    }
  }

  // ---------- 그리기 ----------
  function render() {
    if (!root || root.hidden || !P) return;
    const d = data(), st = M().state(P);
    $("tripName").textContent = `${P.name} 여행`;
    $("tripTag").textContent = d ? d.tagline || "" : "";
    $("tripSt").className = "trip-st " + st.st;
    $("tripSt").textContent = st.st === "been" ? `가 봤어요 · ${st.when}` : st.st === "soon" ? st.when : "아직 안 가 봤어요";
    const C = d && d.custom;
    const tabs = C ? TABS_C : TABS;
    if (!tabs.some((t) => t[0] === tab)) tab = "plan";
    $("tripTabs").innerHTML = tabs.map(([k, n]) => `<button class="chip${tab === k ? " active" : ""}" data-tt="${k}">${n}</button>`).join("");
    const body = $("tripBody"), top = body.scrollTop;
    const html = C
      ? (tab === "plan" ? cPlan(C) : tab === "food" || tab === "shop" || tab === "sight" ? cCards(C, tab) : cSub(C, tab, st))
      : ({ plan: vPlan, food: vFood, sight: vSight, shop: vShop, way: vWay, check: vCheck, more: vMore })[tab](d, st);
    body.innerHTML = html;
    body.scrollTop = top;
    if (C) post(C);
  }
  const none = (d, what) => `<p class="day-empty">${!d && loading[P.id] === 1 ? "불러오는 중…" : `${what} 자료는 아직 준비 중이에요`}</p>`;
  const sec = (t, x) => `<h3 class="trip-sec">${esc(t)}${x ? `<small>${esc(x)}</small>` : ""}</h3>`;

  // 일정: 여행 날짜, 우리 일정, 추천 코스
  function vPlan(d, st) {
    const p = plan(), items = (p.items || []).slice().sort((a, b) => a.d - b.d || (a.t < b.t ? -1 : 1));
    const nDays = Math.max(1, items.reduce((m, x) => Math.max(m, x.d), 1), p.from && p.to ? M().daysTo(p.to) - M().daysTo(p.from) + 1 : 1);
    let h = sec("여행 날짜", p.from ? (st.st === "soon" ? st.when : "") : "정하면 지도에 노란 핀이 꽂혀요") +
      `<div class="trip-dates"><input type="date" id="tpFrom" value="${esc(p.from)}" aria-label="가는 날"><i>~</i><input type="date" id="tpTo" value="${esc(p.to)}" aria-label="오는 날">${p.from ? `<button class="chip" data-ta="nodate">지우기</button>` : ""}</div>`;
    h += sec("우리 일정", items.length ? `${items.length}곳` : "");
    if (!items.length) h += `<p class="day-empty">아래 추천 코스를 가져오거나, 직접 적어 넣어요</p>`;
    for (let n = 1; n <= nDays; n++) {
      const li = items.filter((x) => x.d === n);
      if (!li.length && items.length === 0) break;
      h += `<div class="trip-day"><b>${n}일차</b>${p.from ? `<small>${M().dots(addDays(p.from, n - 1)).slice(5)}</small>` : ""}</div><ol class="trip-tl">` +
        li.map((x) => `<li><time>${esc(x.t || "")}</time><div><b>${esc(x.name)}</b>${x.note ? `<small>${esc(x.note)}</small>` : ""}</div><button class="trip-x" data-ta="del" data-i="${esc(x.i)}" aria-label="빼기">×</button></li>`).join("") + `</ol>`;
    }
    h += `<form class="trip-add" data-form="item"><select id="tpDay" aria-label="며칠째">${Array.from({ length: Math.max(nDays, 1) + 1 }, (_, i) => `<option value="${i + 1}">${i + 1}일차</option>`).join("")}</select><input type="time" id="tpTime" aria-label="시간"><input type="text" id="tpName" maxlength="40" placeholder="어디서 뭐 하기" autocomplete="off"><button class="btn small primary" type="submit">넣기</button></form>`;
    if (d && d.courses && d.courses.length) {
      h += sec("추천 코스", "조사해서 짜 본 것");
      d.courses.forEach((c, ci) => {
        h += `<div class="trip-box"><div class="trip-box-h"><b>${esc(c.title)}</b><button class="chip" data-ta="take" data-i="${ci}">우리 일정으로</button></div>` +
          c.days.map((dy) => `<div class="trip-day"><b>${esc(dy.title)}</b></div><ol class="trip-tl">${dy.stops.map((s) => `<li><time>${esc(s.t || "")}</time><div><b>${esc(s.name)}</b>${s.note ? `<small>${esc(s.note)}</small>` : ""}</div></li>`).join("")}</ol>`).join("") + `</div>`;
      });
    } else h += none(d, "추천 코스");
    return h;
  }
  function addDays(k, n) { const p = k.split("-").map(Number), x = new Date(p[0], p[1] - 1, p[2] + n); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; }
  // 카드 목록 (맛집, 볼거리, 쇼핑)
  function cards(list, kind, groupOf, sub) {
    const st = stars(), groups = [];
    list.forEach((x, i) => { const g = groupOf(x) || "그 밖에"; let o = groups.find((y) => y.g === g); if (!o) groups.push((o = { g, l: [] })); o.l.push([x, i]); });
    return groups.map((o) => sec(o.g, `${o.l.length}곳`) + `<div class="trip-cards">` + o.l.map(([x, i]) =>
      `<div class="trip-c${st[x.name] ? " on" : ""}"><button class="trip-c-main" data-ta="open" data-k="${kind}" data-i="${i}"><b>${esc(x.name)}</b><small>${esc(sub(x))}</small></button><button class="trip-star" data-ta="star" data-n="${esc(x.name)}" aria-label="찜">${st[x.name] ? "★" : "☆"}</button></div>`).join("") + `</div>`).join("");
  }
  const vFood = (d) => (d && d.food && d.food.length ? cards(d.food, "food", (x) => x.kind, (x) => [x.what, x.area].filter(Boolean).join(" · ")) : none(d, "맛집"));
  const vSight = (d) => (d && d.sights && d.sights.length ? cards(d.sights, "sights", (x) => x.cat, (x) => x.desc || "") : none(d, "볼거리"));
  const vShop = (d) => (d && d.shop && d.shop.length ? cards(d.shop, "shop", () => "살 만한 곳", (x) => x.what || "") : none(d, "쇼핑"));
  function vWay(d) {
    if (!d) return none(d, "가는 길");
    let h = "";
    if (d.getting && d.getting.length) h += sec("가는 법", "서울에서") + d.getting.map((g) => `<div class="trip-box way"><div class="trip-box-h"><b>${esc(g.mode)}</b><span>${esc(g.time || "")}</span></div><p>${esc([g.from && g.to ? `${g.from} → ${g.to}` : g.from || g.to || "", g.cost].filter(Boolean).join(" · "))}</p>${g.note ? `<small>${esc(g.note)}</small>` : ""}</div>`).join("");
    if (d.around && d.around.length) h += sec("가서 다니기") + `<ul class="trip-ul">${d.around.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
    if (d.areas && d.areas.length) h += sec("숙소 잡기 좋은 동네") + d.areas.map((a) => `<div class="trip-box"><b>${esc(a.name)}</b><p>${esc(a.desc || "")}</p></div>`).join("");
    return h || none(d, "가는 길");
  }
  // 체크: 할 일과 짐. 둘이 같이 체크해요.
  function vCheck(d) {
    const ck = checks(), o = own();
    const block = (kind, title) => {
      const base = BASE[kind].concat((d && d[kind]) || []).map((t) => ({ t, k: kind + ":" + t })).concat(o[kind].map((t) => ({ t, k: kind + ":" + t, mine: 1 })));
      const done = base.filter((x) => ck[x.k] && ck[x.k][0]).length;
      return sec(title, `${done} / ${base.length}`) + `<ul class="trip-checks">` + base.map((x) => `<li class="${ck[x.k] && ck[x.k][0] ? "on" : ""}"><button data-ta="chk" data-k="${esc(x.k)}"><i></i><span>${esc(x.t)}</span></button>${x.mine ? `<button class="trip-x" data-ta="delown" data-kind="${kind}" data-t="${esc(x.t)}" aria-label="빼기">×</button>` : ""}</li>`).join("") + `</ul>` +
        `<form class="trip-add" data-form="${kind}"><input type="text" maxlength="40" placeholder="${kind === "todo" ? "할 일 더하기" : "챙길 것 더하기"}" autocomplete="off"><button class="btn small" type="submit">더하기</button></form>`;
    };
    return block("todo", "할 일") + block("pack", "짐");
  }
  function vMore(d, st) {
    let h = "";
    if (d && (d.best || d.stay)) h += sec("가기 좋은 때") + `<div class="trip-box"><p>${esc(d.best || "")}</p>${d.stay ? `<small>${esc(d.stay)}</small>` : ""}</div>`;
    if (d && d.cost && d.cost.length) {
      const sum = d.cost.reduce((s, x) => s + (Number(x.won) || 0), 0);
      h += sec("예상 비용", "둘이서 1박 2일쯤") + `<div class="trip-box"><table class="trip-cost">${d.cost.map((x) => `<tr><td>${esc(x.item)}${x.note ? `<small>${esc(x.note)}</small>` : ""}</td><td>${x.won ? won(x.won) : ""}</td></tr>`).join("")}<tr class="sum"><td>모두</td><td>약 ${won(sum)}</td></tr></table></div>`;
    }
    if (d && d.phones && d.phones.length) h += sec("연락처") + `<div class="trip-box">${d.phones.map((x) => `<a class="trip-tel" href="tel:${esc(String(x.tel).replace(/[^0-9+]/g, ""))}"><b>${esc(x.name)}</b><span>${esc(x.tel)}</span></a>`).join("")}</div>`;
    h += sec("우리 기록", st.recs.length ? `${st.recs.length}개` : "");
    h += st.recs.length ? `<div class="trip-box">${st.recs.map((e) => `<div class="trip-rec"><time>${esc(M().dots(e.date))}</time><b>${esc(e.title || e.place || "")}</b></div>`).join("")}</div>` : `<p class="day-empty">여기서 남긴 기록이 아직 없어요. 기록의 장소에 "${esc(P.name)}"${/[가-힣]$/.test(P.name) && (P.name.charCodeAt(P.name.length - 1) - 44032) % 28 ? "이" : "가"} 들어가면 저절로 핀이 꽂혀요</p>`;
    const mark = M().latest("mv:" + P.id), marked = mark && mark.v;
    h += `<div class="trip-row"><button class="chip${marked ? " active" : ""}" data-ta="mark">${marked ? "가 봤다고 찍어 뒀어요 (누르면 취소)" : "여긴 가 봤어요 (손으로 찍기)"}</button></div>`;
    if (d) h += `<p class="trip-src">조사한 날 ${esc(M().dots(d.checked || ""))} · 가게 시간과 값은 바뀔 수 있어요. 가기 전에 한 번 더 확인해요.</p>`;
    return h;
  }
  // ---------- 미리 짜 둔 여행 (삿포로) ----------
  const wiki = (f, w) => `https://upload.wikimedia.org/wikipedia/commons/thumb/${f}/${w || 500}px-${f.split("/").pop()}`;
  const priv = () => { const v = M().latest(key("set")); return v && typeof v === "object" ? v : {}; };
  // 일정: 날짜를 고르면 그날의 시간표
  function cPlan(C) {
    const n = Math.min(ui.day, C.hero.length - 1), h = C.hero[n], day = C.days.find((x) => x.day === n + 1) || { stops: [] };
    return `<div class="trip-days">${C.hero.map((x, i) => `<button class="chip${i === n ? " active" : ""}" data-ta="day" data-i="${i}"><b>${esc(x.d)}</b> ${esc(x.w)}</button>`).join("")}</div>` +
      `<div class="trip-hero"><img alt="" src="${esc(h.img)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()"><div><small>${esc(h.mood || "")}</small><b>${esc(h.title)}</b><span>${esc(h.sub || "")}</span></div></div>` +
      `<ol class="trip-tl sp">` + day.stops.map((s) => `<li class="${s.opt ? "opt" : ""}"><time>${esc(s.t)}</time><div><b>${s.ic ? `<i class="ic">${esc(s.ic)}</i>` : ""}${s.title}</b>${s.note ? `<small>${s.note}</small>` : ""}` +
        (s.tiles.length ? `<div class="trip-tiles">${s.tiles.map((t) => `<div class="trip-tile">${t.img ? `<button class="ti" data-src="${esc(t.img)}" data-cap="${esc(t.cap || t.name)}"><img alt="" loading="lazy" referrerpolicy="no-referrer" src="${esc(t.img)}" onerror="this.parentNode.remove()"></button>` : ""}<b>${esc(t.name)}</b>${t.tx ? `<small>${esc(t.tx)}</small>` : ""}<div class="ta">${t.map ? `<a class="map" href="${esc(t.map)}" target="_blank" rel="noopener">지도</a>` : ""}${t.ads.map((a) => `<button data-ad="${esc(a.ad)}" data-n="${esc(a.n)}">${esc(a.n === "일본어 주소" ? "JP" : a.n === "영어 주소" ? "EN" : "주소")}</button>`).join("")}${t.tel ? `<button class="tel" data-c="${esc(t.tel[0])}">${esc(t.tel[1])}</button>` : ""}</div></div>`).join("")}</div>` : "") +
        (s.extra || "") + `</div></li>`).join("") + `</ol>`;
  }
  // 맛집, 쇼핑, 볼거리: 동네를 고르고 카드 목록
  function cCards(C, kind) {
    const areas = C.groups[kind] || [], n = Math.min(ui.area[kind], areas.length - 1), a = areas[n] || { blocks: [] }, st = stars();
    let h = `<div class="trip-days">${areas.map((x, i) => `<button class="chip${i === n ? " active" : ""}" data-ta="area" data-i="${i}">${esc(x.area)}</button>`).join("")}</div>`;
    if (kind === "food") h += `<div class="trip-days kf">${[["", "전체"], ["meal", "식사"], ["drink", "술"], ["sweet", "디저트·카페"]].map(([k, t]) => `<button class="chip${ui.kf === k ? " active" : ""}" data-ta="kf" data-k="${k}">${t}</button>`).join("")}</div>`;
    a.blocks.forEach((b) => {
      if (b.html) { h += `<div class="sp trip-box">${b.html}</div>`; return; }
      const items = b.items.filter((it) => kind !== "food" || !ui.kf || it.k === ui.kf);
      if (!items.length) return;
      if (b.h) h += sec(b.h, `${items.length}곳`);
      h += `<div class="trip-cards">` + items.map((it) => {
        const c = C.cards[it.i] || {};
        const rate = [c.tb ? `타베로그 ${c.tb[0]}` : "", c.g ? `구글 ${c.g[0]}` : ""].filter(Boolean).join(" · ");
        return `<div class="trip-c pic${st[c.n] ? " on" : ""}"><button class="trip-c-main" data-ta="copen" data-i="${it.i}" data-img="${esc(it.img || "")}">${it.img ? `<img alt="" loading="lazy" referrerpolicy="no-referrer" src="${esc(it.img)}" onerror="this.remove()">` : ""}<span><b>${esc(c.n || "")}</b><small>${esc(it.meta || c.cat || "")}</small>${rate ? `<small class="rt">${esc(rate)}</small>` : ""}${it.badge.length ? `<small class="bd">${it.badge.map(esc).join(" · ")}</small>` : ""}</span></button><button class="trip-star" data-ta="star" data-n="${esc(c.n || "")}" aria-label="찜">${st[c.n] ? "★" : "☆"}</button></div>`;
      }).join("") + `</div>`;
    });
    return h;
  }
  // 예약, 운전, 체크, 더보기: 작은 갈래를 고르면 그 내용
  function cSub(C, group, st) {
    const list = SUBS[group].filter((k) => k === "set" || C.subs[k]);
    const cur = list.indexOf(ui.sub[group]) >= 0 ? ui.sub[group] : list[0];
    let h = `<div class="trip-days">${list.map((k) => `<button class="chip${k === cur ? " active" : ""}" data-ta="sub" data-g="${group}" data-k="${k}">${esc(k === "set" ? "내 정보" : C.subs[k].label.replace(/^[^가-힣A-Za-z]+/, ""))}</button>`).join("")}</div>`;
    if (cur === "set") {
      const v = priv();
      h += `<p class="trip-src">예약번호 같은 내 정보예요. 여기에 적으면 예약 화면의 빈칸에 채워져요. 둘이 쓰는 기록에만 저장되고, 누구나 볼 수 있는 곳에는 올라가지 않아요.</p><div class="trip-set">` +
        C.fields.map((f) => `<label><span>${esc(f.label)}</span><input type="text" data-set="${esc(f.k)}" value="${esc(v[f.k] || "")}" placeholder="${esc(f.ph || "")}" autocomplete="off"></label>`).join("") + `</div>`;
      h += sec("우리 기록", st.recs.length ? `${st.recs.length}개` : "") + (st.recs.length ? `<div class="trip-box">${st.recs.map((e) => `<div class="trip-rec"><time>${esc(M().dots(e.date))}</time><b>${esc(e.title || e.place || "")}</b></div>`).join("")}</div>` : `<p class="day-empty">다녀와서 기록을 남기면 여기에 모여요</p>`);
    } else h += `<div class="sp" data-sp="${cur}">${C.subs[cur].html}</div>`;
    return h;
  }
  // 그린 뒤에 채우는 것: 내 정보 빈칸, 체크 표시
  function post(C) {
    const body = $("tripBody"), v = priv(), ck = checks();
    body.querySelectorAll(".sv[data-k]").forEach((el) => { const x = v[el.dataset.k]; el.textContent = x || "—"; el.dataset.c = x || ""; });
    body.querySelectorAll('.checks input[type="checkbox"]').forEach((el) => { const c = ck["sp:" + el.id]; el.checked = !!(c && c[0]); });
    body.querySelectorAll("ul.checks").forEach((ul) => { const all = ul.querySelectorAll("input").length, on = ul.querySelectorAll("input:checked").length, hd = ul.previousElementSibling; if (hd && hd.classList.contains("sec")) { let s = hd.querySelector(".cnt"); if (!s) { s = document.createElement("small"); s.className = "cnt"; hd.appendChild(s); } s.textContent = ` ${on} / ${all}`; } });
  }
  function copy(text, what) {
    if (!text) return;
    const done = () => toast(`${what || "글"}을 복사했어요`);
    try { navigator.clipboard.writeText(text).then(done, () => {}); } catch (e) { /* 복사를 못 하는 곳도 있어요 */ }
  }
  function openImage(src, cap) {
    $("tripShBody").innerHTML = `<img class="trip-ph big" alt="" referrerpolicy="no-referrer" src="${esc(src)}"><p class="trip-what">${esc(cap || "")}</p>`;
    sheet.dataset.k = ""; show(sheet);
  }
  function openCard(i, img) {
    const C = data().custom, c = C.cards[i];
    if (!c) return;
    const st = stars();
    const pics = (img ? [img] : []).concat(c.rp || []).filter((x, k, a) => a.indexOf(x) === k).slice(0, 5).map((u) => ({ u, l: "" })).concat((c.ph || []).map((x) => ({ u: wiki(x.f), l: x.l })));
    const rows = [["하는 시간", c.ht], ["가는 길", c.drv], ["미슐랭", c.mi]].filter((r) => r[1]);
    $("tripShBody").innerHTML = (pics.length ? `<div class="trip-pics">${pics.map((x) => `<figure><img alt="" loading="lazy" referrerpolicy="no-referrer" src="${esc(x.u)}" onerror="this.parentNode.remove()">${x.l ? `<figcaption>${esc(x.l)}</figcaption>` : ""}</figure>`).join("")}</div>` : "") +
      `<h2>${esc(c.n)}</h2>${c.ja ? `<p class="trip-ja">${esc(c.ja)}</p>` : ""}<p class="trip-what">${esc(c.cat || "")}</p>` +
      ((c.tb || c.g) ? `<p class="trip-rate">${c.tb ? `<a href="${esc(c.tb[2] || "#")}" target="_blank" rel="noopener">타베로그 ${esc(c.tb[0])} (${Number(c.tb[1]).toLocaleString("ko-KR")})</a>` : ""}${c.g ? `<span>구글 ${esc(c.g[0])} (${Number(c.g[1]).toLocaleString("ko-KR")})</span>` : ""}</p>` : "") +
      (c.badges && c.badges.length ? `<p class="trip-bds">${c.badges.map((x) => `<i>${esc(Array.isArray(x) ? x[1] : x)}</i>`).join("")}</p>` : "") +
      (rows.length ? `<dl class="trip-dl">${rows.map((r) => `<dt>${r[0]}</dt><dd>${esc(r[1])}</dd>`).join("")}</dl>` : "") +
      (c.items && c.items.length ? `<ul class="trip-ul">${c.items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : "") +
      (c.tip ? `<p class="trip-tip">${esc(c.tip)}</p>` : "") +
      (c.rv && c.rv.length ? `<ul class="trip-ul rv">${c.rv.map((r) => `<li>${esc(r[0])}${r[1] ? ` <a href="${esc(r[1])}" target="_blank" rel="noopener">글 보기</a>` : ""}</li>`).join("")}</ul>` : "") +
      `<div class="trip-acts">${c.q ? `<a class="btn small primary" href="${esc(c.q)}" target="_blank" rel="noopener">지도</a>` : ""}${c.tel ? `<a class="btn small" href="tel:${esc(String(c.tel).replace(/[^0-9+]/g, ""))}">전화 ${esc(c.tel)}</a>` : ""}<button class="btn small" data-ta="star" data-n="${esc(c.n)}">${st[c.n] ? "★ 찜했어요" : "☆ 찜"}</button></div>` +
      (c.credit ? `<p class="trip-src">사진·자료: ${esc(c.credit)}</p>` : "");
    sheet.dataset.k = "card"; sheet.dataset.i = String(i); sheet.dataset.img = img || "";
    show(sheet);
  }

  // 자세히 보기
  function openSheet(kind, i) {
    const d = data(), x = d && d[kind] && d[kind][i];
    if (!x) return;
    const st = stars();
    const rows = [["하는 시간", x.hours], ["쉬는 날", x.closed], ["입장료", x.fee], ["동네", x.area], ["살 만한 것", kind === "shop" ? x.what : ""]].filter((r) => r[1]);
    const list = x.menu || x.todo || [];
    $("tripShBody").innerHTML = (x.img ? `<img class="trip-ph" alt="" loading="lazy" src="https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(x.img)}?width=640" onerror="this.remove()">` : "") +
      `<h2>${esc(x.name)}</h2><p class="trip-what">${esc(x.what && kind !== "shop" ? x.what : x.desc || "")}</p>` +
      (rows.length ? `<dl class="trip-dl">${rows.map((r) => `<dt>${r[0]}</dt><dd>${esc(r[1])}</dd>`).join("")}</dl>` : "") +
      (list.length ? `<ul class="trip-ul">${list.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : "") +
      (x.tip ? `<p class="trip-tip">${esc(x.tip)}</p>` : "") +
      `<div class="trip-acts"><a class="btn small primary" href="${esc(mapUrl(x.map || x.name + " " + P.name))}" target="_blank" rel="noopener">지도</a>` +
      (x.phone ? `<a class="btn small" href="tel:${esc(String(x.phone).replace(/[^0-9+]/g, ""))}">전화 ${esc(x.phone)}</a>` : "") +
      `<button class="btn small" data-ta="star" data-n="${esc(x.name)}">${st[x.name] ? "★ 찜했어요" : "☆ 찜"}</button>` +
      `<button class="btn small" data-ta="toplan" data-n="${esc(x.name)}">일정에 넣기</button></div>` +
      (x.src ? `<a class="trip-srcl" href="${esc(x.src)}" target="_blank" rel="noopener">알아본 곳 보기</a>` : "");
    sheet.dataset.k = kind; sheet.dataset.i = String(i);
    show(sheet);
  }

  // ---------- 누르기 ----------
  function onClick(ev) {
    const t = ev.target.closest("[data-tt]");
    if (t) { tab = t.dataset.tt; render(); $("tripBody").scrollTop = 0; return; }
    // 옮겨 온 내용 안의 단추들: 주소 복사, 전화, 사진 크게, 문장 복사, 내 정보 복사
    const ad = ev.target.closest("[data-ad]");
    if (ad) { copy(ad.dataset.ad, ad.dataset.n || "주소"); return; }
    const tel = ev.target.closest("button.tel[data-c]");
    if (tel) { location.href = "tel:" + String(tel.dataset.c).replace(/[^0-9+]/g, ""); return; }
    const ti = ev.target.closest(".ti[data-src]");
    if (ti) { openImage(ti.dataset.src, ti.dataset.cap); return; }
    const tk = ev.target.closest(".sp .tk-img img");
    if (tk) { openImage(tk.src, ""); return; }
    const jp = ev.target.closest(".sp .jp button");
    if (jp) { const t = jp.parentNode.querySelector("b"); copy(t ? t.textContent : "", "문장"); return; }
    const sv = ev.target.closest(".sv.copyable");
    if (sv) { copy(sv.dataset.c, "번호"); return; }
    const b = ev.target.closest("[data-ta]");
    if (!b || !P) return;
    const a = b.dataset.ta;
    if (a === "day") { ui.day = Number(b.dataset.i); render(); $("tripBody").scrollTop = 0; return; }
    if (a === "area") { ui.area[tab] = Number(b.dataset.i); render(); $("tripBody").scrollTop = 0; return; }
    if (a === "kf") { ui.kf = b.dataset.k; render(); return; }
    if (a === "sub") { ui.sub[b.dataset.g] = b.dataset.k; render(); $("tripBody").scrollTop = 0; return; }
    if (a === "copen") return openCard(Number(b.dataset.i), b.dataset.img);
    if (a === "open") return openSheet(b.dataset.k, Number(b.dataset.i));
    if (a === "star") { toggleStar(b.dataset.n); if (!sheet.hidden) { if (sheet.dataset.k === "card") openCard(Number(sheet.dataset.i), sheet.dataset.img); else openSheet(sheet.dataset.k, Number(sheet.dataset.i)); } render(); return; }
    if (a === "chk") { const k = b.dataset.k, c = checks(); setCheck(k, !(c[k] && c[k][0])); render(); return; }
    if (a === "delown") { const o = own(); o[b.dataset.kind] = o[b.dataset.kind].filter((x) => x !== b.dataset.t); saveOwn(o); render(); return; }
    if (a === "del") { savePlan({ items: (plan().items || []).filter((x) => String(x.i) !== b.dataset.i) }); render(); return; }
    if (a === "nodate") { savePlan({ from: "", to: "" }); render(); return; }
    if (a === "take") {
      const c = data().courses[Number(b.dataset.i)], items = [];
      c.days.forEach((dy, di) => dy.stops.forEach((s, si) => items.push({ i: `${Date.now()}${di}${si}`, d: di + 1, t: s.t || "", name: s.name, note: s.note || "" })));
      savePlan({ items }); toast("추천 코스를 우리 일정으로 가져왔어요"); render(); $("tripBody").scrollTop = 0; return;
    }
    if (a === "toplan") { const p = plan(); savePlan({ items: (p.items || []).concat({ i: String(Date.now()), d: 1, t: "", name: b.dataset.n, note: "" }) }); toast("1일차 일정에 넣었어요"); history.back(); setTimeout(render, 250); return; }
    if (a === "mark") { const m = M().latest("mv:" + P.id); Store.setPair("mv:" + P.id, me(), m && m.v ? { v: 0 } : { v: 1, d: M().today() }); render(); return; }
  }
  function onChange(ev) {
    if (!P) return;
    // 옮겨 온 체크 목록, 내 정보 칸
    if (ev.target.matches('.checks input[type="checkbox"]')) { setCheck("sp:" + ev.target.id, ev.target.checked); post(data().custom); return; }
    if (ev.target.dataset.set) { const v = Object.assign({}, priv()); v[ev.target.dataset.set] = ev.target.value.trim(); Store.setPair(key("set"), me(), v); toast("적어 뒀어요"); return; }
    if (ev.target.id === "tpFrom" || ev.target.id === "tpTo") {
      let from = $("tpFrom").value, to = $("tpTo").value;
      if (from && (!to || to < from)) to = from;
      savePlan({ from, to }); render();
    }
  }
  function onSubmit(ev) {
    ev.preventDefault();
    if (!P) return;
    const f = ev.target, kind = f.dataset.form;
    if (kind === "item") {
      const name = $("tpName").value.trim();
      if (!name) return;
      savePlan({ items: (plan().items || []).concat({ i: String(Date.now()), d: Number($("tpDay").value) || 1, t: $("tpTime").value || "", name, note: "" }) });
    } else {
      const inp = f.querySelector("input"), v = inp.value.trim();
      if (!v) return;
      const o = own(); if (o[kind].indexOf(v) < 0) o[kind] = o[kind].concat(v); saveOwn(o);
    }
    render();
  }
  if (window.Store) Store.onChange(() => { if (root && !root.hidden && P) { const a = document.activeElement; if (a && root.contains(a) && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName) && a.type !== "date") return; render(); } });
  window.Trip = { open, isOpen: () => !!(root && !root.hidden) };
})();
