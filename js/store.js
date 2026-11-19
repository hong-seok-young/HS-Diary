// ============================================================
// 저장 담당
// - 모든 내용은 먼저 이 폰(localStorage)에 저장돼요.
// - 깃 토큰을 연결하면 저장소의 data 브랜치(db.json, photos/)와 맞춰요.
//   두 폰이 동시에 고쳐도, 항목마다 더 나중에 고친 쪽이 남아요.
// - 사진은 올리기 전까지 이 폰(IndexedDB)에 잠깐 보관해요.
// ============================================================
(function () {
  "use strict";

  const KEY = { db: "hsd.db", token: "hsd.token", me: "hsd.me", old: "hs-diary-local-entries" };
  const COLS = ["entries", "plans", "diary", "garden"];
  const cfg = typeof DIARY_CONFIG !== "undefined" ? DIARY_CONFIG : {};

  function repo() {
    const r = cfg.repo || {};
    let owner = r.owner || "";
    let name = r.name || "";
    if (!owner && /\.github\.io$/.test(location.hostname)) {
      owner = location.hostname.split(".")[0];
      name = location.pathname.split("/").filter(Boolean)[0] || "";
    }
    return { owner, name, branch: r.branch || "data" };
  }
  const R = repo();
  const API = `https://api.github.com/repos/${R.owner}/${R.name}/contents/`;
  const RAW = `https://raw.githubusercontent.com/${R.owner}/${R.name}/${R.branch}/`;

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
    return { v: 1, entries: {}, plans: {}, diary: {}, garden: {}, pairs: {} };
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
    return ls(KEY.token) || "";
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

  // ---------- 저장소와 맞추기 ----------
  async function fetchRemote() {
    const tk = token();
    if (tk) {
      const res = await fetch(`${API}db.json?ref=${encodeURIComponent(R.branch)}&t=${Date.now()}`, {
        headers: { Authorization: "Bearer " + tk, Accept: "application/vnd.github+json" },
        cache: "no-store",
      });
      if (res.status === 404) return { db: emptyDb(), sha: null };
      if (res.status === 401 || res.status === 403) throw Object.assign(new Error("auth"), { auth: true });
      if (!res.ok) throw new Error("read " + res.status);
      const j = await res.json();
      return { db: normalize(JSON.parse(b64ToUtf8(j.content) || "{}")), sha: j.sha };
    }
    const res = await fetch(`${RAW}db.json?t=${Date.now()}`, { cache: "no-store" });
    if (res.status === 404) return { db: emptyDb(), sha: null };
    if (!res.ok) throw new Error("read " + res.status);
    return { db: normalize(await res.json()), sha: null };
  }
  async function putFile(path, contentB64, message, sha) {
    const body = { message, content: contentB64, branch: R.branch };
    if (sha) body.sha = sha;
    return fetch(API + path, {
      method: "PUT",
      headers: { Authorization: "Bearer " + token(), Accept: "application/vnd.github+json", "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }
  async function uploadPending() {
    for (const [name, blob] of Array.from(pendingPhotos.entries())) {
      const res = await putFile("photos/" + name, await blobToB64(blob), "사진 추가");
      // 422 는 "이미 있는 파일"일 때도 오고 다른 오류일 때도 와서, 정말 올라가 있는지 확인해요.
      let exists = false;
      if (res.status === 422 || res.status === 409) {
        const chk = await fetch(`${API}photos/${encodeURIComponent(name)}?ref=${encodeURIComponent(R.branch)}`, {
          headers: { Authorization: "Bearer " + token(), Accept: "application/vnd.github+json" }, cache: "no-store",
        });
        exists = chk.ok;
      }
      if (res.ok || exists) {
        pendingPhotos.delete(name);
        await idbDelete(name);
      } else if (res.status === 401 || res.status === 403) {
        throw Object.assign(new Error("auth"), { auth: true });
      } else {
        throw new Error("photo " + res.status);
      }
    }
  }

  let syncing = false;
  let again = false;
  let timer = null;
  async function sync() {
    if (!R.owner || !R.name) return;
    if (syncing) { again = true; return; }
    syncing = true;
    setStatus("syncing");
    try {
      await ready;
      for (let attempt = 0; attempt < 4; attempt++) {
        const remote = await fetchRemote();
        const merged = merge(remote.db, db);
        if (!same(merged, db)) {
          db = merged;
          saveLocal();
          emit();
        }
        if (!token()) break;
        await uploadPending();
        if (same(merged, remote.db)) break;
        const res = await putFile("db.json", utf8ToB64(JSON.stringify(sorted(merged), null, 1)), "일지 업데이트", remote.sha);
        if (res.ok) break;
        if (res.status === 401 || res.status === 403) throw Object.assign(new Error("auth"), { auth: true });
        // 409 / 422: 그사이 다른 폰이 먼저 저장함 → 다시 받아서 합쳐요.
        if (res.status !== 409 && res.status !== 422) throw new Error("write " + res.status);
        if (attempt === 3) throw new Error("conflict");
      }
      setStatus(token() ? "ok" : "local");
    } catch (e) {
      if (e && e.auth) setStatus("auth", "토큰을 확인해 주세요");
      else if (!navigator.onLine) setStatus("offline");
      else setStatus("error", String((e && e.message) || e));
      // 잠깐 끊긴 거라면 조금 있다가 알아서 다시 해 봐요.
      if (!(e && e.auth)) schedule(15000);
    } finally {
      syncing = false;
      if (again) { again = false; schedule(300); }
    }
  }
  function schedule(ms) {
    clearTimeout(timer);
    timer = setTimeout(sync, ms == null ? 1500 : ms);
  }
  function changed() {
    clearTimeout(saveTimer);
    saveLocal();
    emit();
    schedule();
  }
  // 게임처럼 아주 자주 바뀌는 값: 화면은 바로, 폰 저장은 잠깐 모았다가, 올리기는 가끔.
  let saveTimer = 0;
  let fastSyncAt = 0;
  function changedFast() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveLocal, 400);
    const now = Date.now();
    if (!fastSyncAt || fastSyncAt < now) {
      fastSyncAt = now + 20000;
      clearTimeout(timer);
      timer = setTimeout(sync, 20000);
    }
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
      if (token() && fastSyncAt > Date.now()) schedule(0);
    }
  });

  // 화면에 다시 돌아왔거나 인터넷이 다시 붙으면 맞춰 봐요.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && Date.now() - status.at > 20000) schedule(200);
  });
  window.addEventListener("online", () => schedule(200));
  setInterval(() => {
    if (document.visibilityState === "visible" && token()) schedule(0);
  }, 60000);

  // ---------- 밖에서 쓰는 기능 ----------
  window.Store = {
    repo: R,
    list(col) {
      return Object.values(db[col] || {}).filter((r) => r && !r.del);
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
      db[col][id] = { id, del: true, t: Date.now() };
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
      return RAW + "photos/" + encodeURIComponent(name);
    },
    pendingPhotoCount() {
      return pendingPhotos.size;
    },
    // 연결
    token,
    setToken(v) {
      ls(KEY.token, v ? String(v).trim() : null);
      schedule(0);
    },
    me() {
      const v = ls(KEY.me);
      return v === "him" || v === "her" ? v : "";
    },
    // 한 번 정하면 바꿀 수 없어요
    setMe(v) {
      if (this.me() || (v !== "him" && v !== "her")) return;
      ls(KEY.me, v);
      emit();
    },
    // 토큰이 이 저장소에 쓸 수 있는지 미리 확인해요.
    async checkToken(tk) {
      try {
        const res = await fetch(`https://api.github.com/repos/${R.owner}/${R.name}`, {
          headers: { Authorization: "Bearer " + tk, Accept: "application/vnd.github+json" },
          cache: "no-store",
        });
        if (res.status === 401) return { ok: false, msg: "토큰이 맞지 않아요" };
        if (!res.ok) return { ok: false, msg: "저장소를 볼 수 없는 토큰이에요" };
        const j = await res.json();
        if (j.permissions && j.permissions.push === false) return { ok: false, msg: "쓰기 권한이 없는 토큰이에요" };
        return { ok: true };
      } catch (e) {
        return { ok: false, msg: "인터넷 연결을 확인해 주세요" };
      }
    },
    sync,
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
