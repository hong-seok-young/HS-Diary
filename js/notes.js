// ============================================================
// 쪽지: 그림 속을 날아다니는 종이비행기를 누르면 상대에게 쪽지를 보내요.
// - 보낸 쪽지는 상대의 우체통으로 날아가요. 우체통은 새 쪽지가 오면 깃발을 올리고 알려 줘요.
// - 우체통을 누르면 받은 쪽지와 보낸 쪽지를 볼 수 있어요. 상대가 읽으면 "읽음"이 떠요.
// - 오늘의 질문도 우체통으로 와요. 상대가 답하면 알려 주지만, 나도 답해야 상대의 답을 볼 수 있어요.
// ============================================================
(function () {
  "use strict";

  const cfg = typeof DIARY_CONFIG !== "undefined" ? DIARY_CONFIG : {};
  const NAME = { him: cfg.him || "석영", her: cfg.her || "예은" };
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const me = () => (window.Store && Store.me()) || "";
  const other = (w) => (w === "him" ? "her" : "him");
  const batchim = (s) => { const c = String(s).charCodeAt(String(s).length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0; };
  const call = (w) => (batchim(NAME[w]) ? NAME[w] + "이" : NAME[w]);

  // ---------- 종이비행기 도트 그림 ----------
  // 옆에서 본 종이비행기 (살짝 위에서 내려다봐서 건너편 날개 끝이 조금 보여요).
  // 날아가는 방향(16방향)마다 따로 그려요. 왼쪽으로 날 때는 뒤집어서, 접힌 배(용골)가 늘 아래로 가요.
  const DIRS = 16, PS = 13;
  const planeCache = {};
  function planeImg(dir) {
    dir = ((dir % DIRS) + DIRS) % DIRS;
    if (planeCache[dir] || !window.GArt) return planeCache[dir] || "";
    const th = (dir / DIRS) * Math.PI * 2; // 0 = 오른쪽, 시계 방향
    const f = Math.cos(th) >= -1e-6 ? 1 : -1;
    const ph = Math.atan2(Math.sin(th), Math.abs(Math.cos(th))); // 코가 들리고 숙여지는 각도
    const rot = ([x, y]) => [PS / 2 + f * (x * Math.cos(ph) - y * Math.sin(ph)), PS / 2 + x * Math.sin(ph) + y * Math.cos(ph)];
    // 오른쪽을 보는 모양: 코, 날개 뒤 끝(위), 접힌 선의 뒤 끝, 배 아래 끝, 건너편 날개 끝
    const nose = rot([6.2, 0.3]), wing = rot([-5.8, -1.7]), fold = rot([-5.2, 0.1]), keel = rot([-3.2, 2.5]), far = rot([-4.4, -3]);
    const inTri = (p, a, b, c) => {
      const d = (u, v, w) => (u[0] - w[0]) * (v[1] - w[1]) - (v[0] - w[0]) * (u[1] - w[1]);
      const d1 = d(p, a, b), d2 = d(p, b, c), d3 = d(p, c, a);
      return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
    };
    const g = [];
    for (let y = 0; y < PS; y++) { const r = []; for (let x = 0; x < PS; x++) { const p = [x + 0.5, y + 0.5]; r.push(inTri(p, nose, wing, fold) ? "W" : inTri(p, nose, fold, keel) ? "G" : inTri(p, nose, far, wing) ? "D" : "."); } g.push(r); }
    const add = [];
    for (let y = 0; y < PS; y++) for (let x = 0; x < PS; x++) {
      if (g[y][x] !== ".") continue;
      if ([[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(([a, b]) => g[b] && g[b][a] && g[b][a] !== "." && g[b][a] !== "o")) add.push([x, y]);
    }
    add.forEach(([x, y]) => { g[y][x] = "o"; });
    planeCache[dir] = GArt.fromRows("paperplane3|" + dir, g.map((r) => r.join("")), { o: "#4f5d70", W: "#ffffff", G: "#c3cedc", D: "#e4eaf2" }).uri;
    return planeCache[dir];
  }
  const dirOf = (vx, vy) => Math.round((Math.atan2(vy, vx) / (Math.PI * 2)) * DIRS);
  const planeHtml = (dir) => `<span><img class="px" alt="" src="${planeImg(dir || 0)}" draggable="false"></span>`;
  // 오른쪽에서 나타나 천천히 활공하며 왼쪽으로 사라지고, 잠시 뒤 다시 오른쪽에서 나와요.
  // 지날 때마다 높이, 빠르기, 오르내림이 조금씩 달라요.
  let flyRaf = 0, flyLast = 0, flyDir = -1;
  const fl = { x: null, base: 0, amp: 0, k: 0, ph: 0, sp: 0, wait: 0 };
  function newPass(w, h) {
    fl.x = w + 24;
    fl.base = 58 + Math.random() * Math.max(10, h * 0.4 - 58);
    fl.amp = 6 + Math.random() * 9;
    fl.k = (Math.PI * 2) / (150 + Math.random() * 120);
    fl.ph = Math.random() * 6.28;
    fl.sp = 11 + Math.random() * 6;
    fl.wait = 1.5 + Math.random() * 3;
  }
  function fly(ts) {
    flyRaf = requestAnimationFrame(fly);
    const plane = $("plane"), scene = $("scene");
    if (!plane || plane.hidden || document.hidden || !scene || !scene.offsetWidth) { flyLast = 0; return; }
    const dt = flyLast ? Math.min(0.1, (ts - flyLast) / 1000) : 0.016;
    flyLast = ts;
    const w = scene.clientWidth, h = scene.clientHeight;
    if (fl.x === null) { newPass(w, h); fl.x = w * (0.3 + Math.random() * 0.5); fl.wait = 0; }
    if (fl.wait > 0) { fl.wait -= dt; plane.style.visibility = "hidden"; return; }
    plane.style.visibility = "";
    fl.x -= fl.sp * dt;
    if (fl.x < -PS * 2 - 6) { newPass(w, h); return; }
    const y = fl.base + fl.amp * Math.sin(fl.ph + fl.x * fl.k);
    const vy = -fl.sp * fl.amp * fl.k * Math.cos(fl.ph + fl.x * fl.k);
    plane.style.transform = `translate(${fl.x.toFixed(1)}px, ${(y - PS).toFixed(1)}px)`;
    // 오르내릴 때 코가 살짝 들리고 숙여져요 (기울기를 조금 크게 보여 줘요)
    const d = dirOf(-fl.sp, vy * 2.2);
    if (d !== flyDir) { flyDir = d; const im = plane.querySelector("img"); if (im) im.src = planeImg(d); }
  }
  let H = {}, tab = "q", known = null, knownQ = null;
  const qKey = () => "q:" + (H.todayKey ? H.todayKey() : "");
  const myAnswer = () => Store.pair(qKey(), me());
  const theirAnswer = () => Store.pair(qKey(), other(me()));
  const all = () => Store.list("notes").sort((a, b) => (b.c || 0) - (a.c || 0));
  const inbox = () => all().filter((n) => n.to === me());
  const sent = () => all().filter((n) => n.from === me());
  const unread = () => inbox().filter((n) => !n.r);

  function when(t) {
    const d = new Date(t), now = new Date();
    const same = d.toDateString() === now.toDateString();
    const hm = `${d.getHours() < 12 ? "오전" : "오후"} ${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")}`;
    return same ? hm : `${d.getMonth() + 1}월 ${d.getDate()}일 ${hm}`;
  }

  // ---------- 그림 속: 종이비행기와 우체통 ----------
  function renderScene() {
    const box = $("mailbox"), plane = $("plane");
    if (!box || !plane) return;
    const w = me();
    box.hidden = plane.hidden = !w;
    if (!w) return;
    if (!plane.firstChild.firstChild) plane.innerHTML = planeHtml(0);
    if (!flyRaf) flyRaf = requestAnimationFrame(fly);
    const n = unread().length + (myAnswer() ? 0 : 1);
    box.classList.toggle("has", n > 0);
    box.dataset.n = n > 9 ? "9+" : n ? String(n) : "";
    box.setAttribute("aria-label", n ? `우체통, 새 쪽지 ${n}개` : "우체통");
    // 새 쪽지가 방금 도착했으면 알려 줘요
    const ids = unread().map((x) => x.id);
    if (known) {
      const fresh = unread().filter((x) => known.indexOf(x.id) < 0);
      if (fresh.length) arrive(fresh[0], fresh.length);
    }
    known = ids;
    // 상대가 오늘의 질문에 답했을 때도 알려 줘요 (답은 나도 답해야 보여요)
    const qs = qKey() + (theirAnswer() ? "|y" : "|n");
    if (knownQ && knownQ !== qs && theirAnswer() && knownQ.slice(0, -2) === qKey()) arrive({ from: other(w), text: myAnswer() ? String(theirAnswer()) : "나도 답하면 볼 수 있어요", q: 1 }, 1);
    knownQ = qs;
  }
  // 종이비행기가 (who)의 머리에 날아가 콕 꽂혀요. 맞은 사람은 머리를 부여잡고 엉엉 울어요.
  // 비행기가 날아가 꽂히고 엉엉 우는 동안은 선물 화면이 끼어들지 않게 해요
  let busyUntil = 0;
  const SHOW = 1000 + 4300 + 300; // 날아가는 시간 + 우는 연출 + 여유
  function hitHead(who, fromX, fromY, done) {
    const scene = $("scene"), bob = document.querySelector(`.bob[data-who="${who}"]`);
    if (!scene || !bob) { if (done) done(); return; }
    busyUntil = Date.now() + SHOW;
    const sr = scene.getBoundingClientRect(), tr = bob.getBoundingClientRect();
    const x1 = tr.left - sr.left + tr.width / 2 - PS, y1 = tr.top - sr.top - PS * 1.2;
    const f = document.createElement("i");
    f.className = "sc-plane fly";
    f.innerHTML = planeHtml(dirOf(x1 - fromX, y1 - fromY));
    scene.appendChild(f);
    const midY = Math.min(fromY, y1) - 34;
    const im = f.querySelector("img");
    const an = f.animate([{ transform: `translate(${fromX}px, ${fromY}px)` }, { transform: `translate(${(fromX + x1) / 2}px, ${midY}px)`, offset: 0.55 }, { transform: `translate(${x1}px, ${y1}px)` }], { duration: 1000, easing: "cubic-bezier(.4,0,.8,.6)" });
    // 내려꽂힐 때는 코가 아래를 봐요
    setTimeout(() => { if (im) im.src = planeImg(dirOf((x1 - fromX) * 0.25, 30)); }, 560);
    an.onfinish = () => {
      f.remove();
      // 머리에 꽂힌 비행기 (코가 박혀서 꼬리만 파르르)
      const stuck = document.createElement("i");
      stuck.className = "stuck-plane";
      stuck.innerHTML = `<img class="px" alt="" src="${planeImg(4)}">`;
      bob.appendChild(stuck);
      if (H.burstAt) H.burstAt(bob, 9, "spark");
      if (window.CharAnim && CharAnim.play) CharAnim.play("ouch", who);
      // 눈물이 뚝뚝
      let n = 0;
      const drip = setInterval(() => {
        if (++n > 16) { clearInterval(drip); return; }
        const d = document.createElement("i");
        d.className = "tear-drop";
        const r = bob.getBoundingClientRect();
        d.style.left = r.left - sr.left + r.width * (n % 2 ? 0.28 : 0.72) + "px";
        d.style.top = r.top - sr.top + r.height * 0.45 + "px";
        scene.appendChild(d);
        d.animate([{ transform: "translate(0,0)", opacity: 1 }, { transform: `translate(${n % 2 ? -10 : 10}px, ${r.height * 0.55}px)`, opacity: 0.2 }], { duration: 520, easing: "ease-in" }).onfinish = () => d.remove();
      }, 190);
      setTimeout(() => { stuck.classList.add("out"); setTimeout(() => stuck.remove(), 360); if (done) done(); }, 3600);
    };
  }
  function arrive(n, count) {
    const box = $("mailbox"), scene = $("scene");
    if (!box || !scene) return;
    const sr = scene.getBoundingClientRect(), br = box.getBoundingClientRect();
    const pop = () => { box.animate([{ transform: "scale(1.25, .8)" }, { transform: "scale(.9, 1.15)" }, { transform: "none" }], { duration: 320 }); if (H.burstAt) H.burstAt(box, 6, "heart"); };
    if (!n.q) hitHead(me(), sr.width + 20, 12, pop);
    else {
      // 답장은 우체통으로 쏙
      const f = document.createElement("i");
      f.className = "sc-plane fly";
      const tx = br.left - sr.left, ty = br.top - sr.top;
      f.innerHTML = planeHtml(dirOf(tx - sr.width, ty - 10));
      scene.appendChild(f);
      f.animate([{ transform: `translate(${sr.width + 20}px, 10px)` }, { transform: `translate(${tx + 60}px, ${ty - 46}px)`, offset: 0.6 }, { transform: `translate(${tx + 2}px, ${ty - 2}px) scale(.5)`, opacity: 0.2 }], { duration: 1500, easing: "ease-in-out" }).onfinish = () => { f.remove(); pop(); };
    }
    const text = n.q ? `${call(n.from)}가 오늘의 질문에 답했어요` : count > 1 ? `${call(n.from)}가 쪽지 ${count}개를 보냈어요` : `${call(n.from)}의 쪽지가 왔어요`;
    if (H.bubble && n.q) H.bubble("답장이 왔어!", me());
    if (H.toast) H.toast(text);
    // 다른 앱을 보고 있어도 알려 줘요 (알림을 허락했을 때)
    try {
      if (document.hidden && window.Notification && Notification.permission === "granted" && !(window.Notify && Notify.pushOn())) {
        const body = String(n.text || "").slice(0, 60);
        if (navigator.serviceWorker && navigator.serviceWorker.ready) navigator.serviceWorker.ready.then((reg) => reg.showNotification(text, { body, icon: "icons/icon-192.png", tag: "hsd-note" })).catch(() => {});
        else new Notification(text, { body, icon: "icons/icon-192.png", tag: "hsd-note" });
      }
    } catch (e) { /* 알림을 못 띄워도 우체통에는 들어 있어요 */ }
  }
  function askNotify() {
    try { if (window.Notification && Notification.permission === "default") Notification.requestPermission(); } catch (e) { /* 지원하지 않는 폰 */ }
  }

  // ---------- 쪽지 쓰기 ----------
  function renderWrite() {
    const w = me();
    $("noteTo").textContent = `${call(other(w))}에게`;
    const last = sent()[0];
    $("noteLast").textContent = last ? `마지막으로 보낸 쪽지: ${when(last.c)}${last.r ? " · 읽음" : ""}` : "";
  }
  function send() {
    const w = me(), ta = $("noteText");
    const text = ta.value.trim();
    if (!w || !text) { ta.focus(); return; }
    busyUntil = Date.now() + SHOW + 400;
    H.silently(() => Store.put("notes", { from: w, to: other(w), text: text.slice(0, 300) }));
    ta.value = "";
    askNotify();
    if (H.setPanel) H.setPanel(null);
    // 종이비행기가 날아가서 상대 머리에 콕
    const plane = $("plane"), scene = $("scene");
    if (plane && scene) {
      const sr = scene.getBoundingClientRect(), pr = plane.getBoundingClientRect();
      const vis = plane.style.visibility !== "hidden" && pr.left > sr.left - 30 && pr.left < sr.right;
      fl.wait = 2; fl.x = sr.width + 24;
      hitHead(other(w), vis ? pr.left - sr.left : -30, vis ? pr.top - sr.top : 40);
    }
    if (H.toast) H.toast(`${call(other(w))}의 우체통으로 보냈어요`);
  }

  // ---------- 우체통 ----------
  function renderMail() {
    const w = me();
    const inn = inbox(), out = sent();
    const qNew = !myAnswer();
    $("mailTabs").innerHTML = `<button class="chip${tab === "q" ? " active" : ""}${qNew ? " dot" : ""}" data-mt="q">오늘의 질문</button><button class="chip${tab === "in" ? " active" : ""}${unread().length ? " dot" : ""}" data-mt="in">받은 쪽지 ${inn.length}</button><button class="chip${tab === "out" ? " active" : ""}" data-mt="out">보낸 쪽지 ${out.length}</button>`;
    $("mailQuest").hidden = tab !== "q";
    $("mailList").hidden = tab === "q";
    $("mailWrite").hidden = tab === "q";
    if (tab === "q") { if (H.renderQuest) H.renderQuest(); return; }
    const list = tab === "in" ? inn : out;
    const html = list.length
      ? list.map((n) => `<div class="mail-it ${esc(n.from)}${tab === "in" && !n.r ? " new" : ""}"><p>${esc(n.text).replace(/\n/g, "<br>")}</p><small>${tab === "in" ? esc(NAME[n.from]) : `${esc(call(n.to))}에게`} · ${when(n.c)}${tab === "out" ? (n.r ? " · 읽음" : " · 아직 안 읽음") : !n.r ? " · 새 쪽지" : ""}</small><button class="day-del" data-ndel="${esc(n.id)}" aria-label="지우기"></button></div>`).join("")
      : `<p class="day-empty">${tab === "in" ? "아직 받은 쪽지가 없어요" : "종이비행기를 눌러 첫 쪽지를 보내 봐요"}</p>`;
    if (window.MORPH) MORPH($("mailList"), html); else $("mailList").innerHTML = html;
    // 받은 쪽지는 열어 본 순간 읽음으로 (상대 폰에 "읽음"이 떠요)
    if (tab === "in") {
      const un = inn.filter((n) => !n.r);
      if (un.length) setTimeout(() => {
        if (!H.panel || H.panel() !== "mail") return;
        H.silently(() => un.forEach((n) => Store.put("notes", Object.assign({}, n, { r: Date.now() }))));
        known = unread().map((x) => x.id);
        renderScene();
      }, 900);
    }
  }

  function bind(h) {
    H = h || {};
    const scene = $("scene");
    if (!scene) return;
    scene.addEventListener("click", (ev) => {
      if (ev.target.closest("#plane")) { ev.stopPropagation(); if (H.play) H.play($("plane"), "boing"); H.setPanel("note"); renderWrite(); setTimeout(() => $("noteText").focus(), 250); return; }
      if (ev.target.closest("#mailbox")) { ev.stopPropagation(); if (H.play) H.play($("mailbox"), "boing"); tab = unread().length ? "in" : "q"; H.setPanel("mail"); renderMail(); askNotify(); }
    });
    $("noteForm").addEventListener("submit", (ev) => { ev.preventDefault(); send(); });
    $("mailTabs").addEventListener("click", (ev) => { const b = ev.target.closest("[data-mt]"); if (b) { tab = b.dataset.mt; renderMail(); } });
    $("mailList").addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-ndel]");
      if (!b) return;
      H.silently(() => Store.remove("notes", b.dataset.ndel));
      renderMail();
      renderScene();
    });
    $("mailWrite").addEventListener("click", () => { H.setPanel("note"); renderWrite(); setTimeout(() => $("noteText").focus(), 250); });
  }

  window.Notes = { busy: () => Math.max(0, busyUntil - Date.now()), bind, renderScene, renderMail, renderWrite, unread: () => unread().length, tab: () => tab, open(t) { tab = t || "q"; H.setPanel("mail"); renderMail(); } };
})();
