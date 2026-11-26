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

  // 종이비행기 도트 그림 (오른쪽을 봐요)
  const PLANE = ["WW...........", ".WWWW........", "..WWWWWWW....", "...WWWWWWWWWW", "....GGGGGWW..", ".....GGG.....", "......G......"];
  let planeSrc = "";
  function planeImg() {
    if (planeSrc || !window.GArt) return planeSrc;
    const g = PLANE.map((r) => ("." + r + ".").split(""));
    g.unshift(new Array(g[0].length).fill(".")); g.push(new Array(g[0].length).fill("."));
    const add = [];
    for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) {
      if (g[y][x] !== ".") continue;
      if ([[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(([a, b]) => g[b] && g[b][a] && g[b][a] !== "." && g[b][a] !== "o")) add.push([x, y]);
    }
    add.forEach(([x, y]) => { g[y][x] = "o"; });
    planeSrc = GArt.fromRows("paperplane", g.map((r) => r.join("")), { o: "#5b6b80", W: "#ffffff", G: "#cfd8e4" }).uri;
    return planeSrc;
  }
  const planeHtml = () => `<span><img class="px" alt="" src="${planeImg()}" draggable="false"></span>`;
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
    if (!plane.firstChild.firstChild) plane.innerHTML = planeHtml();
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
  function arrive(n, count) {
    const box = $("mailbox"), scene = $("scene");
    if (!box || !scene) return;
    // 종이비행기가 우체통으로 날아와요
    const f = document.createElement("i");
    f.className = "sc-plane fly";
    f.innerHTML = planeHtml();
    scene.appendChild(f);
    const sr = scene.getBoundingClientRect(), br = box.getBoundingClientRect();
    const tx = br.left - sr.left, ty = br.top - sr.top;
    f.animate([{ transform: `translate(${sr.width + 20}px, 10px) rotate(-8deg)` }, { transform: `translate(${tx + 60}px, ${ty - 46}px) rotate(8deg)`, offset: 0.6 }, { transform: `translate(${tx + 2}px, ${ty - 2}px) rotate(40deg) scale(.5)`, opacity: 0.2 }], { duration: 1500, easing: "ease-in-out" }).onfinish = () => {
      f.remove();
      box.animate([{ transform: "scale(1.25, .8)" }, { transform: "scale(.9, 1.15)" }, { transform: "none" }], { duration: 320 });
      if (H.burstAt) H.burstAt(box, 6, "heart");
    };
    const text = n.q ? `${call(n.from)}가 오늘의 질문에 답했어요` : count > 1 ? `${call(n.from)}가 쪽지 ${count}개를 보냈어요` : `${call(n.from)}의 쪽지가 왔어요`;
    if (H.bubble) H.bubble(n.q ? "답장이 왔어!" : "쪽지가 왔어!", me());
    if (H.toast) H.toast(text);
    // 다른 앱을 보고 있어도 알려 줘요 (알림을 허락했을 때)
    try {
      if (document.hidden && window.Notification && Notification.permission === "granted") {
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
    H.silently(() => Store.put("notes", { from: w, to: other(w), text: text.slice(0, 300) }));
    ta.value = "";
    askNotify();
    if (H.setPanel) H.setPanel(null);
    // 종이비행기가 상대에게 날아가요
    const plane = $("plane"), scene = $("scene");
    const target = document.querySelector(`.bob[data-who="${other(w)}"]`);
    if (plane && scene && target) {
      const sr = scene.getBoundingClientRect(), pr = plane.getBoundingClientRect(), tr = target.getBoundingClientRect();
      const f = document.createElement("i");
      f.className = "sc-plane fly";
      f.innerHTML = planeHtml();
      scene.appendChild(f);
      const x0 = pr.left - sr.left, y0 = pr.top - sr.top, x1 = tr.left - sr.left + tr.width / 2 - 10, y1 = tr.top - sr.top;
      plane.style.visibility = "hidden";
      f.animate([{ transform: `translate(${x0}px, ${y0}px)` }, { transform: `translate(${(x0 + x1) / 2}px, ${Math.min(y0, y1) - 30}px) rotate(-14deg)`, offset: 0.5 }, { transform: `translate(${x1}px, ${y1}px) rotate(30deg) scale(.6)`, opacity: 0.3 }], { duration: 1100, easing: "ease-in-out" }).onfinish = () => {
        f.remove();
        plane.style.visibility = "";
        if (H.burstAt) H.burstAt(target, 7, "heart");
        if (H.play) H.play(target, "jump");
      };
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

  window.Notes = { bind, renderScene, renderMail, renderWrite, unread: () => unread().length, tab: () => tab, open(t) { tab = t || "q"; H.setPanel("mail"); renderMail(); } };
})();
