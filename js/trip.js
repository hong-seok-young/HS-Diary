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
  let root = null, sheet = null, P = null, tab = "plan", loading = {};

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
    document.body.appendChild(root);
    sheet = document.createElement("div");
    sheet.className = "modal trip-sheet"; sheet.id = "tripSheet"; sheet.hidden = true;
    sheet.innerHTML = `<div class="modal-card box trip-sh" id="tripShBody"></div>`;
    document.body.appendChild(sheet);
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
    $("tripTabs").innerHTML = TABS.map(([k, n]) => `<button class="chip${tab === k ? " active" : ""}" data-tt="${k}">${n}</button>`).join("");
    const body = $("tripBody"), top = body.scrollTop;
    const html = ({ plan: vPlan, food: vFood, sight: vSight, shop: vShop, way: vWay, check: vCheck, more: vMore })[tab](d, st);
    if (window.MORPH) MORPH(body, html); else body.innerHTML = html;
    body.scrollTop = top;
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
    const b = ev.target.closest("[data-ta]");
    if (!b || !P) return;
    const a = b.dataset.ta;
    if (a === "open") return openSheet(b.dataset.k, Number(b.dataset.i));
    if (a === "star") { toggleStar(b.dataset.n); if (!sheet.hidden) openSheet(sheet.dataset.k, Number(sheet.dataset.i)); render(); return; }
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
