// ============================================================
// 저장 담당
// - 모든 내용은 먼저 이 폰(localStorage)에 저장돼요.
// - 두 사람 전용 서버(data/config.js 의 api)와 맞춰요. 폰마다 서버가 기기 열쇠를 알아서 줘요.
//   두 폰이 동시에 고쳐도, 항목마다 더 나중에 고친 쪽이 남아요.
// - 사진은 올리기 전까지 이 폰(IndexedDB)에 잠깐 보관해요.
// ============================================================
(function () {
  "use strict";

  const KEY = { db: "hsd.db", dev: "hsd.dev", join: "hsd.join", me: "hsd.me", old: "hs-diary-local-entries" };
  const COLS = ["entries", "plans", "diary", "garden", "cal", "notes"];
  const cfg = typeof DIARY_CONFIG !== "undefined" ? DIARY_CONFIG : {};

  const API = String(cfg.api || "").replace(/\/+$/, "");

  // ---------- 작은 도구 ----------
  function ls(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      if (val === null) localStorage.removeItem(key);
      else localStorage.setItem(key, val);
    } catch (e) { /* 저장 공간이 막혀 있어도 화면은 떠야 해요 */ }
    return null;
  }
  function emptyDb() {
    return { v: 1, entries: {}, plans: {}, diary: {}, garden: {}, cal: {}, notes: {}, pairs: {} };
  }
  function normalize(db) {
    const out = emptyDb();
    if (!db || typeof db !== "object") return out;
    COLS.concat("pairs").forEach((c) => {
      if (db[c] && typeof db[c] === "object" && !Array.isArray(db[c])) out[c] = db[c];
    });
    return out;
  }
  function sorted(v) {
    if (Array.isArray(v)) return v.map(sorted);
    if (v && typeof v === "object") {
      const o = {};
      Object.keys(v).sort().forEach((k) => { o[k] = sorted(v[k]); });
      return o;
    }
    return v;
  }
  function same(a, b) {
    return JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));
  }
  // 두 묶음을 합쳐요. 항목마다 고친 시각(t)이 더 늦은 쪽이 이겨요.
  function merge(a, b) {
    a = normalize(a);
    b = normalize(b);
    const out = emptyDb();
    COLS.forEach((c) => {
      new Set(Object.keys(a[c]).concat(Object.keys(b[c]))).forEach((id) => {
        const x = a[c][id];
        const y = b[c][id];
        out[c][id] = !x ? y : !y ? x : (y.t || 0) > (x.t || 0) ? y : x;
      });
    });
    // 하트, 기분, 답변처럼 두 사람이 따로 적는 값은 사람별로 따로 합쳐요.
    new Set(Object.keys(a.pairs).concat(Object.keys(b.pairs))).forEach((k) => {
      const x = a.pairs[k] || {};
      const y = b.pairs[k] || {};
      const o = {};
      ["him", "her"].forEach((who) => {
        const p = x[who];
        const q = y[who];
        const pick = !p ? q : !q ? p : newer(p, q);
        if (pick) o[who] = pick;
      });
      out.pairs[k] = o;
    });
    return out;
  }
  // 게임 기록처럼 계속 쌓이기만 하는 값은 "더 많이 진행된 쪽"이 이겨요.
  // 새 폰에서 빈 기록이 먼저 저장돼도 서버의 진행 상황을 덮어쓰지 않게.
  function progress(v) {
    if (!v || typeof v !== "object" || typeof v.tp !== "number") return -1;
    return (v.tp || 0) + (v.hvn || 0) + (v.od || 0) + Object.keys(v.q || {}).length + ((v.pe || 0) + (v.ps || 0)) / 1e12;
  }
  function newer(p, q) {
    const a = progress(p[0]), b = progress(q[0]);
    if (a >= 0 && b >= 0 && a !== b) return b > a ? q : p;
    return (q[1] || 0) > (p[1] || 0) ? q : p;
  }
  function uid(prefix) {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }
  function utf8ToB64(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function b64ToUtf8(b64) {
    const bin = atob(String(b64 || "").replace(/\s/g, ""));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function blobToB64(blob) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result).split(",")[1] || "");
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(blob);
    });
  }

  // ---------- 이 폰에 있는 내용 ----------
  let db = emptyDb();
  try {
    db = normalize(JSON.parse(ls(KEY.db) || "null"));
  } catch (e) {
    db = emptyDb();
  }
  migrateOld();

  // 예전 방식(브라우저 임시 기록)으로 적어 둔 게 있으면 옮겨 와요.
  function migrateOld() {
    let old;
    try {
      old = JSON.parse(ls(KEY.old) || "null");
    } catch (e) {
      old = null;
    }
    if (!Array.isArray(old)) return;
    const seedIds = { "file-0": "seed-0717", "file-1": "seed-0710" };
    const now = Date.now();
    old.forEach((e) => {
      if (!e || !e._id) return;
      const id = seedIds[e._id] || e._id;
      if (e._deleted) {
        db.entries[id] = { id, del: true, t: now };
        return;
      }
      db.entries[id] = {
        id, date: e.date || "", category: e.category || "etc", title: e.title || "", place: e.place || "",
        map: e.map || "", memo: e.memo || "", tags: e.tags || [], photos: e.photo ? [e.photo] : [], t: now,
      };
    });
    ls(KEY.old, null);
    ls(KEY.db, JSON.stringify(db));
  }

  const listeners = [];
  const statusListeners = [];
  let status = { state: "idle", msg: "", at: 0 };
  function saveLocal() {
    ls(KEY.db, JSON.stringify(db));
  }
  function emit() {
    listeners.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
  }
  function setStatus(state, msg) {
    status = { state, msg: msg || "", at: Date.now() };
    statusListeners.forEach((fn) => { try { fn(status); } catch (e) { console.error(e); } });
  }
  function token() {
    return ls(KEY.dev) || "";
  }

  // ---------- 사진: 올리기 전까지 폰에 보관 ----------
  const photoUrls = new Map(); // 이름 → 이 폰에서 바로 보여 줄 주소
  let idb = null;
  function openIdb() {
    return new Promise((resolve) => {
      if (!window.indexedDB) return resolve(null);
      let req;
      try {
        req = indexedDB.open("hsd", 1);
      } catch (e) {
        return resolve(null);
      }
      req.onupgradeneeded = () => req.result.createObjectStore("photos", { keyPath: "name" });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  }
  function idbAll() {
    return new Promise((resolve) => {
      if (!idb) return resolve([]);
      const req = idb.transaction("photos").objectStore("photos").getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }
  function idbPut(rec) {
    return new Promise((resolve) => {
      if (!idb) return resolve();
      const tx = idb.transaction("photos", "readwrite");
      tx.objectStore("photos").put(rec);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }
  function idbDelete(name) {
    return new Promise((resolve) => {
      if (!idb) return resolve();
      const tx = idb.transaction("photos", "readwrite");
      tx.objectStore("photos").delete(name);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }
  const pendingPhotos = new Map(); // 아직 저장소에 안 올라간 사진
  const ready = openIdb().then(async (h) => {
    idb = h;
    (await idbAll()).forEach((rec) => {
      pendingPhotos.set(rec.name, rec.blob);
      photoUrls.set(rec.name, URL.createObjectURL(rec.blob));
    });
    if (pendingPhotos.size) emit();
  });

  // ---------- 서버와 맞추기 ----------
  const auth = () => ({ Authorization: "Bearer " + token() });
  const authErr = () => Object.assign(new Error("auth"), { auth: true });
  // 이 폰을 서버에 들여요. 사람마다 첫 폰은 바로, 그다음 폰은 상대 폰의 허락을 받아요.
  async function ensureDevice() {
    if (token()) return true;
    const me = window.Store && Store.me();
    if (!API || !me) return false;
    const waitId = ls(KEY.join);
    if (waitId) {
      const r = await fetch(`${API}/join/${encodeURIComponent(waitId)}`, { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (j.tok) { ls(KEY.dev, j.tok); ls(KEY.join, null); return true; }
      if (r.status === 404 || j.status === "no") ls(KEY.join, null);
      else return false;
    }
    const r = await fetch(`${API}/join`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ who: me, ua: (navigator.userAgent || "").replace(/\s+/g, " ").slice(0, 80) }) });
    const j = await r.json().catch(() => ({}));
    if (j.tok) { ls(KEY.dev, j.tok); return true; }
    if (j.wait) ls(KEY.join, j.wait);
    return false;
  }
  async function fetchRemote() {
    const res = await fetch(`${API}/db?t=${Date.now()}`, { headers: auth(), cache: "no-store" });
    if (res.status === 401) throw authErr();
    if (!res.ok) throw new Error("read " + res.status);
    const j = await res.json();
    return { db: normalize(j.db || {}), v: j.v || 0 };
  }
  async function putDb(data, v) {
    return fetch(`${API}/db`, { method: "PUT", headers: Object.assign({ "Content-Type": "application/json" }, auth()), body: JSON.stringify({ db: data, v }) });
  }
  async function uploadPending() {
    for (const [name, blob] of Array.from(pendingPhotos.entries())) {
      const res = await fetch(`${API}/photo/${encodeURIComponent(name)}`, { method: "PUT", headers: Object.assign({ "Content-Type": blob.type || "image/jpeg" }, auth()), body: blob });
      if (res.ok) {
        pendingPhotos.delete(name);
        await idbDelete(name);
      } else if (res.status === 401) throw authErr();
      else throw new Error("photo " + res.status);
    }
  }
  // 새 폰이 들어오려고 하면 허락을 물어봐요
  let pendingJoins = [];
  async function checkPending() {
    try {
      const r = await fetch(`${API}/pending`, { headers: auth(), cache: "no-store" });
      const j = r.ok ? await r.json() : { list: [] };
      const before = JSON.stringify(pendingJoins);
      pendingJoins = j.list || [];
      if (JSON.stringify(pendingJoins) !== before) setStatus(status.state, status.msg);
    } catch (e) { /* 다음에 다시 봐요 */ }
  }

  // ---------- 실시간 ----------
  // 서버와 줄을 하나 이어 두고, 상대 폰이 저장하면 바로 받아 와요. 줄이 끊기면 알아서 다시 이어요.
  let ws = null, wsTimer = 0, wsWait = 1000, lastV = -1;
  function live() {
    if (!API || !token() || ws || document.visibilityState !== "visible") return;
    let sock;
    try { sock = new WebSocket(API.replace(/^http/, "ws") + "/live?k=" + encodeURIComponent(token())); } catch (e) { return; }
    ws = sock;
    sock.onopen = () => { wsWait = 1000; };
    sock.onmessage = (ev) => { const v = Number(ev.data); if (!(v === lastV)) schedule(0); };
    sock.onclose = sock.onerror = () => {
      if (ws === sock) ws = null;
      clearTimeout(wsTimer);
      wsTimer = setTimeout(live, wsWait);
      wsWait = Math.min(30000, wsWait * 2);
    };
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") live();
    else if (ws) { const s0 = ws; ws = null; try { s0.close(); } catch (e) { /* 이미 닫힘 */ } }
  });

  let syncing = false;
  let again = false;
  let timer = null;
  async function sync() {
    if (!API) return;
    if (syncing) { again = true; return; }
    syncing = true;
    setStatus("syncing");
    try {
      await ready;
      if (!(await ensureDevice())) {
        setStatus(ls(KEY.join) ? "wait" : "local");
        if (ls(KEY.join)) schedule(6000);
        return;
      }
      for (let attempt = 0; attempt < 4; attempt++) {
        const remote = await fetchRemote();
        lastV = remote.v;
        const merged = merge(remote.db, db);
        if (!same(merged, db)) {
          db = merged;
          saveLocal();
          emit();
        }
        await uploadPending();
        if (same(merged, remote.db)) break;
        const res = await putDb(sorted(merged), remote.v);
        if (res.ok) { lastV = remote.v + 1; break; }
        if (res.status === 401) throw authErr();
        // 409: 그사이 다른 폰이 먼저 저장함 → 다시 받아서 합쳐요.
        if (res.status !== 409) throw new Error("write " + res.status);
        if (attempt === 3) throw new Error("conflict");
      }
      await checkPending();
      setStatus("ok");
      live();
    } catch (e) {
      if (e && e.auth) { ls(KEY.dev, null); setStatus("local"); schedule(3000); }
      else if (!navigator.onLine) setStatus("offline");
      else setStatus("error", String((e && e.message) || e));
      // 잠깐 끊긴 거라면 조금 있다가 알아서 다시 해 봐요.
      if (!(e && e.auth)) schedule(15000);
    } finally {
      syncing = false;
      if (again) { again = false; schedule(300); }
    }
  }
  // 더 빨리 잡혀 있는 예약이 있으면 그걸 그대로 둬요. (늦은 예약이 빠른 예약을 밀어내지 않게)
  let due = 0;
  function schedule(ms) {
    ms = ms == null ? 500 : ms;
    const at = Date.now() + ms;
    if (due && due <= at) return;
    clearTimeout(timer);
    due = at;
    timer = setTimeout(() => { due = 0; sync(); }, ms);
  }
  function changed() {
    clearTimeout(saveTimer);
    saveLocal();
    emit();
    schedule();
  }
  // 게임처럼 아주 자주 바뀌는 값: 화면은 바로, 폰 저장은 잠깐 모았다가, 올리기는 10초마다.
  let saveTimer = 0;
  function changedFast() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveLocal, 400);
    schedule(10000);
  }
  function flushFast() {
    if (!saveTimer) return;
    clearTimeout(saveTimer);
    saveTimer = 0;
    saveLocal();
  }
  window.addEventListener("pagehide", () => { flushFast(); });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushFast();
      if (token() && due) schedule(0);
    }
  });

  // 화면에 다시 돌아왔거나 인터넷이 다시 붙으면 맞춰 봐요.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && Date.now() - status.at > 20000) schedule(200);
  });
  window.addEventListener("online", () => schedule(200));
  setInterval(() => {
    if (document.visibilityState === "visible" && token() && !ws) schedule(0);
  }, 15000);

  // ---------- 밖에서 쓰는 기능 ----------
  window.Store = {
    list(col) {
      return Object.values(db[col] || {}).filter((r) => r && !r.del);
    },
    // 지운 것까지 모두 (선물은 지운 기록 몫도 그대로 남겨요)
    listAll(col) {
      return Object.values(db[col] || {}).filter((r) => r);
    },
    get(col, id) {
      const r = (db[col] || {})[id];
      return r && !r.del ? r : null;
    },
    // soft: 저장소에 같은 항목이 이미 있으면 그쪽이 이기게 해요. (자동으로 만드는 기본값용)
    put(col, rec, opts) {
      const id = rec.id || uid(col[0]);
      if (opts && opts.soft && db[col][id]) return db[col][id];
      const prev = db[col][id];
      const fresh = !prev || prev.del;
      db[col][id] = Object.assign({}, rec, { id, t: opts && opts.soft ? 1 : Date.now() });
      // 처음 만든 때와 만든 사람 (이야기가 이걸 보고 진행돼요)
      if (fresh && !(opts && opts.soft)) { db[col][id].c = rec.c || Date.now(); if (!rec.by && this.me()) db[col][id].by = this.me(); }
      else if (prev && prev.c) { db[col][id].c = prev.c; if (prev.by) db[col][id].by = prev.by; }
      delete db[col][id].del;
      changed();
      return db[col][id];
    },
    remove(col, id) {
      const prev = db[col][id];
      db[col][id] = { id, del: true, t: Date.now() };
      // 처음 만든 때와 만든 사람은 남겨요 (이 기록으로 받은 선물이 사라지지 않게)
      if (prev && prev.c) { db[col][id].c = prev.c; if (prev.by) db[col][id].by = prev.by; if (prev.from) db[col][id].from = prev.from; if (prev.dn) { db[col][id].dn = prev.dn; db[col][id].dby = prev.dby; } }
      changed();
    },
    // 두 사람이 따로 적는 값 (하트, 기분, 답변, 보낸 하트 수)
    pair(key, who) {
      const p = (db.pairs[key] || {})[who];
      return p ? p[0] : null;
    },
    setPair(key, who, value) {
      if (!db.pairs[key]) db.pairs[key] = {};
      db.pairs[key][who] = [value, Date.now()];
      changed();
    },
    // 화면을 다시 그리지 않고 조용히 저장해요. (게임 손놀림용)
    setPairFast(key, who, value) {
      if (!db.pairs[key]) db.pairs[key] = {};
      db.pairs[key][who] = [value, Date.now()];
      changedFast();
    },
    pairTime(key, who) {
      const p = (db.pairs[key] || {})[who];
      return p ? p[1] : 0;
    },
    pairKeys(prefix) {
      return Object.keys(db.pairs).filter((k) => k.indexOf(prefix) === 0);
    },
    // 사진
    async addPhoto(blob) {
      await ready;
      const name = uid("ph") + ".jpg";
      pendingPhotos.set(name, blob);
      photoUrls.set(name, URL.createObjectURL(blob));
      await idbPut({ name, blob });
      schedule();
      return name;
    },
    photoUrl(name) {
      if (!name) return "";
      if (photoUrls.has(name)) return photoUrls.get(name);
      if (/^(https?:|data:|blob:|\/|\.\/|photos\/)/.test(name)) return name;
      return `${API}/photo/${encodeURIComponent(name)}?k=${encodeURIComponent(token())}`;
    },
    pendingPhotoCount() {
      return pendingPhotos.size;
    },
    // 연결
    token,
    // 새 폰 허락
    pendingJoins() { return pendingJoins.slice(); },
    async approve(id, ok) {
      await fetch(`${API}/approve`, { method: "POST", headers: Object.assign({ "Content-Type": "application/json" }, auth()), body: JSON.stringify({ id, ok: !!ok }) }).catch(() => {});
      pendingJoins = pendingJoins.filter((r) => r.id !== id);
      setStatus(status.state, status.msg);
    },
    me() {
      const v = ls(KEY.me);
      return v === "him" || v === "her" ? v : "";
    },
    // 한 번 정하면 바꿀 수 없어요
    setMe(v) {
      if (this.me() || (v !== "him" && v !== "her")) return;
      ls(KEY.me, v);
      schedule(0);
      emit();
    },
    sync,
    syncSoon() { schedule(600); },
    status() {
      return status;
    },
    onChange(fn) {
      listeners.push(fn);
    },
    onStatus(fn) {
      statusListeners.push(fn);
    },
    exportJson() {
      return JSON.stringify(sorted(db), null, 1);
    },
    clearLocal() {
      db = emptyDb();
      saveLocal();
      emit();
      schedule(0);
    },
    _merge: merge, // 테스트용
    progress,
  };

  setStatus(token() ? "idle" : "local");
  schedule(0);
})();
