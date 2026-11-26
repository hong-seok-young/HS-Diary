// ============================================================
// 꾸미기: 잠옷, 그림 속 동물, 이름표
// - 무엇이 열렸는지는 저장된 기록에서 계산해요. 그래서 두 폰이 늘 같고, 한 사람이 열면 둘 다 가져요.
// - 하루에 많아야 네 개가 열려요.
//   · 석영이 출석: 동물 한 마리 / 예은이 출석: 잠옷 한 벌
//   · 오늘의 질문에 답하거나 하트를 보내면: 이름표 하나
//   · 그날 처음 기록, 할 일, 일기, 일정을 남기면: 동물, 잠옷, 이름표 중 하나 (날마다 번갈아)
// - 열릴 때는 검은 그림자와 대화가 먼저 나오고, 누르면 폭죽과 함께 모습이 드러나요.
// - 고른 것(입은 잠옷, 그림에 둔 동물, 이름표)은 상대 폰에도 바로 보여요.
// ============================================================
(function () {
  "use strict";

  const cfg = typeof DIARY_CONFIG !== "undefined" ? DIARY_CONFIG : {};
  const NAME = { him: cfg.him || "석영", her: cfg.her || "예은" };
  const Z = window.Zoo || { LIST: [], BY: {} };
  const S = () => window.FSprites;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const me = () => (window.Store && Store.me()) || "";
  const pad = (n) => String(n).padStart(2, "0");
  const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const batchim = (s) => { const c = String(s).charCodeAt(String(s).length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0; };
  const call = (w) => (batchim(NAME[w]) ? NAME[w] + "이" : NAME[w]);

  // ---------- 순서 (늘 같은 순서로 섞어요) ----------
  function shuffled(list, seed) {
    const a = list.slice();
    let s = seed >>> 0;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  const FIRST_PJ = ["bunny", "bear", "cat", "fox", "pig", "chick", "frog", "deer", "koala", "hippo", "penguin", "sheep", "panda", "dino", "tiger", "puppy"];
  const FIRST_PET = ["hippo", "sheep", "cat", "puppy"];
  const ids = Z.LIST.map((s) => s.id);
  const PJS = FIRST_PJ.concat(shuffled(ids.filter((id) => FIRST_PJ.indexOf(id) < 0), 20260717));
  const PETS = FIRST_PET.concat(shuffled(ids.filter((id) => FIRST_PET.indexOf(id) < 0), 19970929));

  // ---------- 무엇이 열렸나 ----------
  let cache = null;
  function unlocks() {
    if (cache) return cache;
    const St = window.Store;
    if (!St) return [];
    const days = {};
    const day = (d) => (days[d] = days[d] || {});
    St.pairKeys("a:").forEach((k) => { ["him", "her"].forEach((w) => { if (St.pair(k, w)) day(k.slice(2))["a_" + w] = St.pairTime(k, w) || 1; }); });
    St.pairKeys("q:").concat(St.pairKeys("p:")).forEach((k) => { ["him", "her"].forEach((w) => { if (St.pair(k, w)) { const o = day(k.slice(2)), t = St.pairTime(k, w) || 1; if (!o.q || t < o.q) { o.q = t; o.qk = k[0]; } } }); });
    ["entries", "plans", "diary", "cal"].forEach((col) => St.list(col).forEach((r) => { if (!r.c) return; const o = day(dayKey(new Date(r.c))); if (!o.r || r.c < o.r) o.r = r.c; }));
    const n = { pet: 0, pj: 0, ban: 1 };
    const src = { pet: PETS, pj: PJS, ban: null };
    const out = [];
    Object.keys(days).sort().forEach((d) => {
      const o = days[d];
      const rot = ["pet", "pj", "ban"][Math.floor(new Date(d + "T00:00:00").getTime() / 86400000) % 3 | 0] || "pet";
      [["a_him", "pet", "출석 선물"], ["a_her", "pj", "출석 선물"], ["q", "ban", o.qk === "p" ? "하트 선물" : "질문 선물"], ["r", rot, "기록 선물"]].forEach(([slot, cat, why]) => {
        if (!o[slot]) return;
        const item = cat === "ban" ? (n.ban < BAN.length ? n.ban : -1) : src[cat][n[cat]];
        if (item === undefined || item === -1) return;
        n[cat]++;
        out.push({ id: `u:${d}:${slot}`, at: o[slot], cat, item, why });
      });
    });
    out.sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : 1));
    cache = out;
    return out;
  }
  const ownedPets = () => unlocks().filter((u) => u.cat === "pet").map((u) => u.item);
  const ownedPajamas = () => unlocks().filter((u) => u.cat === "pj").map((u) => u.item);
  const bannerCount = () => 1 + unlocks().filter((u) => u.cat === "ban").length;
  // 출석 찍기 (하루 한 번)
  function attend() {
    const w = me();
    if (!w) return;
    const k = "a:" + dayKey(new Date());
    if (!Store.pair(k, w)) Store.setPair(k, w, 1);
  }

  // ---------- 그림에 둔 동물 ----------
  const MAXP = 3;
  function placedOf(w) {
    const v = window.Store && Store.pair("pets", w);
    const own = ownedPets();
    return Array.isArray(v) ? v.filter((id) => own.indexOf(id) >= 0).slice(0, MAXP) : null;
  }
  function placed() {
    const a = placedOf("him"), b = placedOf("her");
    if (!a && !b) return ownedPets().slice(0, MAXP); // 아직 아무도 안 골랐으면 먼저 온 친구들
    const out = [];
    (a || []).concat(b || []).forEach((id) => { if (out.indexOf(id) < 0) out.push(id); });
    return out;
  }

  // ---------- 이름표 ----------
  const SHAPES = ["네모", "리본", "팻말", "구름", "하트", "깃발", "겹테", "티켓", "말풍선", "전구", "테이프", "두루마리"];
  const PALS = [
    ["크림", "#fff8e6", "#5b4638", "#c9735f"], ["딸기우유", "#ffe0ea", "#8a3a56", "#ff7aa8"], ["민트초코", "#d6f5e6", "#3a5a48", "#6a4630"], ["하늘", "#dff1ff", "#34587a", "#5a9ad8"],
    ["레몬", "#fff6b8", "#6a5a14", "#f0b52e"], ["라벤더", "#ece4ff", "#4e3e7a", "#9a7ae0"], ["복숭아", "#ffe6d6", "#7a4a30", "#ff9a6a"], ["밤하늘", "#2e2e5a", "#ffe86a", "#8ad0f6"],
    ["초코", "#6a4630", "#fff0d8", "#ffc83a"], ["숲", "#3a6a4a", "#f0ffe0", "#ffd83a"], ["벚꽃", "#fff0f6", "#a8507a", "#ff9ac0"], ["노을", "#ffb07a", "#5a2a3a", "#fff0b8"],
    ["바다", "#3a8ac8", "#ffffff", "#ffe86a"], ["모래", "#f0dcb0", "#6a5030", "#c8843a"], ["먹", "#3a3a40", "#ffffff", "#ff7a7a"], ["눈", "#ffffff", "#5a7a9a", "#8ac8f0"],
    ["자두", "#7a3a6a", "#ffe6f6", "#ffb0e0"], ["말차", "#c8dc9a", "#3e5a1e", "#7a9a3a"], ["살구", "#ffd0a0", "#7a4a14", "#f08a3a"], ["체리", "#e8364a", "#ffffff", "#ffd0d8"],
    ["청포도", "#e0f6b0", "#4a6a14", "#8ac83a"], ["블루베리", "#5a6ad8", "#ffffff", "#c8d0ff"], ["꿀", "#ffc83a", "#5a3a0a", "#fff0b0"], ["장미", "#ff8aa8", "#ffffff", "#8a1a3a"],
    ["안개", "#e6e8ee", "#4a5060", "#8a94a8"], ["호박", "#ff9a3a", "#4a2a0a", "#fff0c0"], ["옥", "#a8e6d0", "#1e5a4a", "#3ac8a0"], ["포도", "#9b6fd0", "#ffffff", "#f0d0ff"],
    ["흑백", "#ffffff", "#24242a", "#24242a"], ["금", "#f6d86a", "#5a4010", "#ffffff"],
    ["솜사탕", "#ffd6ec", "#5a6ab8", "#8ad0f6"], ["수박", "#ff6a7a", "#ffffff", "#3a8a4a"], ["귤", "#ffb347", "#6a3a0a", "#ffffff"], ["가지", "#5a3a7a", "#f6e6ff", "#c8a0f0"],
    ["우유", "#fffdf6", "#7a6a5a", "#ffc8d8"], ["커피", "#8a6244", "#fff6e6", "#f0c890"], ["새벽", "#b7c7ee", "#34406a", "#f6d6c8"], ["봄", "#e6f6c8", "#5a7a3a", "#ff9ac0"],
    ["여름", "#8ad8f0", "#1e4a6a", "#fff07a"], ["가을", "#e8a060", "#4a2a14", "#ffe0a0"], ["겨울", "#e6f0fa", "#3a5a8a", "#ffffff"], ["무지개", "#fff6f0", "#7a5ab8", "#ff8a8a"],
  ];
  const BANNERS = [];
  // 모양과 색을 번갈아 섞어서, 새로 받을 때마다 느낌이 달라져요
  for (let r = 0; r < SHAPES.length; r++) for (let p = 0; p < PALS.length; p++) { const s = (p * 5 + r) % SHAPES.length; BANNERS.push({ s, p, name: `${PALS[p][0]} ${SHAPES[s]}` }); }
  const BAN = BANNERS;
  const TITLES = () => [cfg.title || `${call("him")}와 ${call("her")}`, `${NAME.him} ♥ ${NAME.her}`, `${call("her")}와 ${call("him")}`, "우리 둘", "오늘도 좋아해", `${NAME.him}이랑 ${NAME.her}이랑`];
  const MODES = ["며칠째 · 주년", "며칠째만", "몇 주", "몇 개월", "몇 시간"];
  function ban() {
    let v = null, t = -1;
    ["him", "her"].forEach((w) => { const x = Store.pair("ban", w), at = Store.pairTime("ban", w); if (x && at > t) { v = x; t = at; } });
    v = v && typeof v === "object" ? v : {};
    const di = Math.min(Math.max(0, Number(v.d) || 0), BAN.length - 1);
    const ti = typeof v.t === "string" ? -1 : Math.min(Math.max(0, Number(v.t) || 0), TITLES().length - 1);
    return { d: di < bannerCount() ? di : 0, t: ti < 0 ? v.t : TITLES()[ti], ti, m: Number(v.m) || 0 };
  }
  function setBan(patch) {
    const w = me();
    if (!w) return;
    const b = ban();
    const cur = { d: b.d, t: b.ti < 0 ? b.t : b.ti, m: b.m };
    Store.setPair("ban", w, Object.assign(cur, patch));
    apply();
  }
  function styleOf(idx) { const b = BAN[idx] || BAN[0], p = PALS[b.p]; return { cls: "bn-s" + b.s, vars: `--b1:${p[1]};--b2:${p[2]};--b3:${p[3]}` }; }
  function apply() {
    const el = $("banner");
    if (!el || !window.Store) return;
    const b = ban(), st = styleOf(b.d);
    el.className = "sc-banner " + st.cls;
    el.setAttribute("style", st.vars);
    const t = $("diaryTitle");
    if (t && t.textContent !== b.t) t.textContent = b.t;
    document.dispatchEvent(new CustomEvent("hsd:ban", { detail: b }));
  }

  // ---------- 꾸미기 창 ----------
  let root = null, tab = "pj";
  function ensure() {
    if (root) return;
    root = document.createElement("div");
    root.className = "deco";
    root.hidden = true;
    root.innerHTML = `<div class="deco-dim" data-d="close"></div><div class="deco-box"><div class="deco-tabs" id="decoTabs"></div><p class="deco-tip" id="decoTip"></p><div class="deco-body" id="decoBody"></div></div>`;
    document.body.appendChild(root);
    root.addEventListener("click", onClick);
    root.addEventListener("submit", (ev) => { ev.preventDefault(); const v = $("decoText").value.trim().slice(0, 14); if (v) { setBan({ t: v }); render(); } });
  }
  const layer = () => document.dispatchEvent(new Event("hsd:layer"));
  function open(t) {
    if (!me()) return;
    ensure();
    tab = t || tab;
    root.hidden = false;
    root.classList.remove("closing");
    render();
    layer();
  }
  function close() {
    if (!root || root.hidden) return;
    root.classList.add("closing");
    setTimeout(() => { root.hidden = true; root.classList.remove("closing"); layer(); }, 160);
    layer();
  }
  function onClick(ev) {
    const b = ev.target.closest("[data-d]");
    if (!b) return;
    const k = b.dataset.d, v = b.dataset.v, w = me();
    if (k === "close") { history.back(); return; }
    if (k === "tab") { tab = v; render(); $("decoBody").scrollTop = 0; return; }
    if (k === "wear") { if (window.Tale) Tale.setWear(v); document.dispatchEvent(new CustomEvent("hsd:wear")); render(); return; }
    if (k === "pet") {
      let list = placedOf(w) || [];
      if (list.indexOf(v) >= 0) list = list.filter((x) => x !== v);
      else { if (list.length >= MAXP) list = list.slice(1); list = list.concat(v); }
      Store.setPair("pets", w, list);
      document.dispatchEvent(new CustomEvent("hsd:pets"));
      render();
      return;
    }
    if (k === "ban") { setBan({ d: Number(v) }); render(); return; }
    if (k === "title") { setBan({ t: Number(v) }); render(); return; }
    if (k === "mode") { setBan({ m: Number(v) }); render(); return; }
  }
  if (window.Store) Store.onChange(() => { cache = null; });
  function lockTiles(n, total, how) { return n < total ? `<span class="deco-it lock wide"><b>+${total - n}</b><small>${how}</small></span>` : ""; }
  function render() {
    const w = me();
    $("decoTabs").innerHTML = [["pj", "잠옷"], ["pet", "동물"], ["ban", "이름표"]].map(([k, n]) => `<button class="chip${tab === k ? " active" : ""}" data-d="tab" data-v="${k}">${n}</button>`).join("");
    let html = "", tip = "";
    if (tab === "pj") {
      const own = ownedPajamas(), on = window.Tale ? Tale.wearOf(w) : "";
      tip = `잠옷 ${own.length}벌 / ${PJS.length}벌 · ${call("her")}가 출석하거나 기록을 남기면 생겨요`;
      html = `<div class="deco-grid"><button class="deco-it${on ? "" : " on"}" data-d="wear" data-v=""><img class="px" alt="" src="${S().charImg(w, "down", 0, "", "", "")}"><small>평소 옷</small></button>` +
        own.slice().reverse().map((id) => `<button class="deco-it${on === id ? " on" : ""}" data-d="wear" data-v="${id}"><img class="px" alt="" loading="lazy" src="${S().charImg(w, "down", 0, "", "", id)}"><small>${esc(Z.BY[id].name)}</small></button>`).join("") + lockTiles(own.length, Z.LIST.length, "아직 못 만난 잠옷") + `</div>`;
    } else if (tab === "pet") {
      const own = ownedPets(), mine = placedOf(w) || [], all = placed();
      tip = `동물 ${own.length}마리 / ${PETS.length}마리 · ${call("him")}가 출석하거나 기록을 남기면 와요. 그림에 둘 친구를 ${MAXP}마리까지 골라요`;
      html = `<div class="deco-grid">` + own.slice().reverse().map((id) => `<button class="deco-it pet${mine.indexOf(id) >= 0 ? " on" : all.indexOf(id) >= 0 ? " other" : ""}" data-d="pet" data-v="${id}"><img class="px" alt="" loading="lazy" src="${S().petImg(id, "stand", mine.indexOf(id) >= 0 ? "happy" : "")}"><small>${esc(Z.BY[id].name)}</small></button>`).join("") + (own.length ? "" : `<p class="deco-empty">아직 아무도 안 왔어요. 곧 첫 친구가 찾아와요</p>`) + lockTiles(own.length, PETS.length, "아직 못 만난 친구") + `</div>`;
    } else {
      const n = bannerCount(), b = ban();
      tip = `이름표 ${n}개 / ${BAN.length}개 · 오늘의 질문에 답하거나 하트를 보내면 하루 하나씩 생겨요`;
      html = `<div class="deco-row">${TITLES().map((t, i) => `<button class="chip${b.ti === i ? " active" : ""}" data-d="title" data-v="${i}">${esc(t)}</button>`).join("")}</div>
        <form class="deco-form"><input type="text" id="decoText" maxlength="14" placeholder="직접 쓰기" value="${b.ti < 0 ? esc(b.t) : ""}" autocomplete="off"><button class="btn small primary" type="submit">쓰기</button></form>
        <div class="deco-row">${MODES.map((t, i) => `<button class="chip${b.m === i ? " active" : ""}" data-d="mode" data-v="${i}">${t}</button>`).join("")}</div>
        <div class="deco-grid ban">` + BAN.slice(0, n).map((x, i) => { const st = styleOf(i); return `<button class="deco-it bn${b.d === i ? " on" : ""}" data-d="ban" data-v="${i}"><span class="sc-banner mini ${st.cls}" style="${st.vars}"><b>${esc(NAME.him)} ♥ ${esc(NAME.her)}</b></span><small>${esc(x.name)}</small></button>`; }).join("") + lockTiles(n, BAN.length, "아직 못 받은 이름표") + `</div>`;
    }
    $("decoTip").textContent = tip;
    $("decoBody").innerHTML = html;
  }

  // ---------- 새로 열릴 때: 그림자, 대화, 폭죽 ----------
  const SEEN = "hsd.useen";
  function seenSet() { try { return JSON.parse(localStorage.getItem(SEEN) || "{}") || {}; } catch (e) { return {}; } }
  function markSeen(id) { const s0 = seenSet(); s0[id] = 1; try { localStorage.setItem(SEEN, JSON.stringify(s0)); } catch (e) { /* 그냥 둬요 */ } }
  function unseen() {
    let raw = null;
    try { raw = localStorage.getItem(SEEN); } catch (e) { /* 없으면 처음 */ }
    if (raw === null) {
      // 이 폰에서 처음이면, 오늘보다 전에 열린 것들은 이미 본 걸로 해요 (가진 건 그대로예요)
      const today = "u:" + dayKey(new Date());
      const s1 = {};
      unlocks().forEach((u) => { if (u.id.slice(0, today.length) < today) s1[u.id] = 1; });
      try { localStorage.setItem(SEEN, JSON.stringify(s1)); } catch (e) { /* 그냥 둬요 */ }
    }
    const s0 = seenSet();
    return unlocks().filter((u) => !s0[u.id]);
  }
  const TALK = {
    pet: [["어? 풀숲이 바스락거려.", "무언가가 우리를 찾아왔나 봐!"], ["저기 그림자 보여?", "누가 놀러 온 것 같아."], ["작은 발자국이 있어.", "살금살금 따라가 볼까?"], ["쉿, 무슨 소리 들리지?", "새 친구일지도 몰라!"], ["연못 쪽에 누가 있어.", "가까이 가 보자."]],
    pj: [["문 앞에 상자가 놓여 있어.", "뭐가 들어 있을까?"], ["폭신한 게 만져져.", "얼른 열어 보자!"], ["리본 묶인 꾸러미다.", "우리 거 맞지?"], ["옷장에서 부스럭 소리가 나.", "새 잠옷일까?"], ["택배가 왔어!", "둘이 같이 뜯자."]],
    ban: [["바람에 뭔가 날아왔어.", "어디에 달면 예쁠까?"], ["반짝이는 게 떨어져 있어.", "주워 볼까?"], ["하늘에서 뭐가 내려와.", "우리 이름이 적혀 있네?"], ["누가 선물을 두고 갔어.", "펼쳐 보자!"]],
  };
  const KIND = { pet: "새 친구", pj: "새 잠옷", ban: "새 이름표" };
  let uroot = null, uq = [], ucur = null, ustep = 0, utype = 0, utotal = 0;
  function uensure() {
    if (uroot) return;
    uroot = document.createElement("div");
    uroot.className = "unlock";
    uroot.hidden = true;
    uroot.innerHTML = `<div class="ul-stage"><i class="ul-count" id="ulCount"></i><div class="ul-glow"></div><div class="ul-art" id="ulArt"></div><b class="ul-name" id="ulName"></b><i class="ul-hint" id="ulHint"></i></div>
      <div class="tale-box ul-box"><div class="tale-head" id="ulHead"></div><div class="tale-body"><span class="tale-face"><img class="px" alt="" id="ulFace"></span><div class="tale-text"><b class="tale-name" id="ulWho"></b><p id="ulLine"></p></div></div><div class="tale-btns" id="ulBtns"></div></div>`;
    document.body.appendChild(uroot);
    uroot.addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-u]");
      if (b) { uact(b.dataset.u); return; }
      unext();
    });
  }
  function utypeLine(text) {
    clearInterval(utype);
    const p = $("ulLine");
    let i = 0;
    p.textContent = ""; p.dataset.full = text;
    utype = setInterval(() => { i += 2; p.textContent = text.slice(0, i); if (i >= text.length) { clearInterval(utype); utype = 0; } }, 30);
  }
  function artOf(u) {
    if (u.cat === "pet") return `<img class="px ul-img pet" alt="" src="${S().petImg(u.item, "stand", "happy")}">`;
    if (u.cat === "pj") return `<img class="px ul-img pj" alt="" src="${S().charImg(me() || "him", "down", 0, "wave1", "happy", u.item)}">`;
    const st = styleOf(u.item);
    return `<span class="sc-banner mini big ${st.cls}" style="${st.vars}"><b>${esc(NAME.him)} ♥ ${esc(NAME.her)}</b></span>`;
  }
  const nameOf = (u) => (u.cat === "ban" ? BAN[u.item].name + " 이름표" : Z.BY[u.item].name + (u.cat === "pj" ? " 잠옷" : ""));
  function ushow() {
    const u = ucur;
    const talk = TALK[u.cat][(u.at + u.item.toString().length) % TALK[u.cat].length];
    const first = u.id.indexOf(":a_her") > 0 ? "her" : "him";
    const who = ustep === 0 ? first : first === "him" ? "her" : "him";
    $("ulCount").textContent = utotal > 1 ? `${utotal - uq.length} / ${utotal}` : "";
    $("ulHead").textContent = u.why;
    uroot.dataset.step = String(ustep);
    if (ustep < 2) {
      $("ulArt").innerHTML = artOf(u);
      $("ulName").textContent = "";
      $("ulHint").textContent = ustep === 1 ? "눌러서 확인하기" : "";
      $("ulFace").parentNode.hidden = false;
      $("ulFace").src = S().charImg(who, "down", 0, "", ustep ? "happy" : "");
      $("ulWho").textContent = NAME[who];
      $("ulBtns").innerHTML = "";
      utypeLine(talk[ustep]);
    } else {
      // 짜잔
      $("ulHint").textContent = "";
      $("ulName").textContent = nameOf(u);
      $("ulFace").parentNode.hidden = true;
      $("ulWho").textContent = "";
      utypeLine(`${KIND[u.cat]}: ${nameOf(u)}${u.cat === "pet" ? "가 우리를 찾아왔어요!" : u.cat === "pj" ? "을 받았어요!" : "를 받았어요!"}`);
      const actName = u.cat === "pet" ? "그림에 두기" : u.cat === "pj" ? "지금 입기" : "달기";
      $("ulBtns").innerHTML = `<button class="btn" data-u="next">${uq.length ? "다음" : "좋아"}</button><button class="btn primary" data-u="use">${actName}</button>`;
      const h = window.HSD;
      if (h && h.burst) {
        const r = $("ulArt").getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        h.burst(cx, cy, 22, "spark");
        setTimeout(() => h.burst(cx - 70, cy - 40, 12, "heart"), 160);
        setTimeout(() => h.burst(cx + 70, cy - 50, 12, "spark"), 300);
        setTimeout(() => h.burst(cx, cy - 90, 14, "spark"), 460);
      }
    }
  }
  function unext() {
    if (!ucur) return;
    if (utype) { clearInterval(utype); utype = 0; $("ulLine").textContent = $("ulLine").dataset.full; return; }
    if (ustep < 2) { ustep++; ushow(); }
  }
  function uact(k) {
    const u = ucur, w = me();
    if (!u) return;
    if (k === "use") {
      if (u.cat === "pet") { let list = placedOf(w) || placed().slice(0, MAXP - 1); list = list.filter((x) => x !== u.item); if (list.length >= MAXP) list = list.slice(1); Store.setPair("pets", w, list.concat(u.item)); document.dispatchEvent(new CustomEvent("hsd:pets")); }
      else if (u.cat === "pj") { if (window.Tale) Tale.setWear(u.item); document.dispatchEvent(new CustomEvent("hsd:wear")); }
      else setBan({ d: u.item });
    }
    markSeen(u.id);
    if (uq.length) { ucur = uq.shift(); ustep = 0; ushow(); return; }
    ucur = null;
    uroot.classList.add("closing");
    setTimeout(() => { uroot.hidden = true; uroot.classList.remove("closing"); layer(); }, 180);
    document.dispatchEvent(new CustomEvent("hsd:pets"));
  }
  // 아직 못 본 선물이 있으면 맨 먼저 보여 줘요
  function celebrate() {
    if (!me() || !S() || (uroot && !uroot.hidden)) return false;
    const list = unseen();
    if (!list.length) return false;
    uensure();
    uq = list.slice(1); utotal = list.length;
    ucur = list[0]; ustep = 0;
    uroot.hidden = false;
    ushow();
    layer();
    return true;
  }

  window.Deco = {
    open, back: close, isOpen: () => !!(root && !root.hidden && !root.classList.contains("closing")),
    celebrate, celebrating: () => !!(uroot && !uroot.hidden), attend, unlocks, ownedPets, ownedPajamas, placed, ban, apply, bannerCount, setBan, PETS, PJS, BAN, styleOf, MAXP,
  };
})();
