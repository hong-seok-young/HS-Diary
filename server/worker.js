// ============================================================
// 석영이와 예은이: 두 사람 전용 저장 서버 (Cloudflare Worker + Durable Object)
// - 기록(db)과 사진을 두 사람 폰만 읽고 쓸 수 있어요.
// - 폰마다 "기기 열쇠"를 서버가 알아서 나눠 줘요. 사람이 넣을 건 없어요.
//   · 사람마다 첫 폰은 바로 들어와요.
//   · 그다음 새 폰은 이미 쓰고 있는 폰에서 "허락"을 눌러야 들어와요.
// ============================================================
import { DurableObject } from "cloudflare:workers";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Admin, X-Ver",
  "Access-Control-Max-Age": "86400",
};
const json = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: Object.assign({ "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }, CORS) });

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    const stub = env.COUPLE.get(env.COUPLE.idFromName("couple"));
    return stub.fetch(req);
  },
};

// ---------- 폰 알림 (Web Push) ----------
// 한 사람이 무언가 남기면, 그 폰이 "상대에게 알릴 말"을 같이 올려요. 서버는 상대 폰들에 그대로 전해요.
// 알림 내용은 폰만 풀 수 있게 잠가서 보내요 (RFC 8291, aes128gcm). 보내는 쪽 증명은 VAPID (RFC 8292).
const b64u = (buf) => { const a = new Uint8Array(buf); let s = ""; for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
const unb64u = (str) => { const s = atob(String(str).replace(/-/g, "+").replace(/_/g, "/")); const a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; };
const cat = (...xs) => { const n = xs.reduce((m, x) => m + x.length, 0), o = new Uint8Array(n); let p = 0; xs.forEach((x) => { o.set(x, p); p += x.length; }); return o; };
const utf8 = (s) => new TextEncoder().encode(s);
async function hmac(key, data) { const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); return new Uint8Array(await crypto.subtle.sign("HMAC", k, data)); }
// 알림 내용 잠그기. opts.salt, opts.key(보내는 쪽 임시 열쇠 쌍)는 시험할 때만 넣어요.
export async function encryptPush(payload, p256dh, auth, opts) {
  const ua = unb64u(p256dh), secret = unb64u(auth);
  const pair = (opts && opts.key) || (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]));
  const as = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", ua, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, pair.privateKey, 256));
  const ikm = await hmac(await hmac(secret, ecdh), cat(utf8("WebPush: info\0"), ua, as, new Uint8Array([1])));
  const salt = (opts && opts.salt) || crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmac(salt, ikm);
  const cek = (await hmac(prk, cat(utf8("Content-Encoding: aes128gcm\0"), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hmac(prk, cat(utf8("Content-Encoding: nonce\0"), new Uint8Array([1])))).slice(0, 12);
  const key = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const body = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, cat(payload, new Uint8Array([2]))));
  return cat(salt, new Uint8Array([0, 0, 16, 0, as.length]), as, body);
}
// 보내는 쪽 증명 (ES256 으로 서명한 짧은 표)
export async function vapidAuth(endpoint, jwk, sub) {
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const head = b64u(utf8(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const body = b64u(utf8(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub })));
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, utf8(head + "." + body)));
  const pub = b64u(cat(new Uint8Array([4]), unb64u(jwk.x), unb64u(jwk.y)));
  return `vapid t=${head}.${body}.${b64u(sig)}, k=${pub}`;
}

function rid(n) {
  const a = new Uint8Array(n || 24);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

export class Couple extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.env = env;
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT)`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS devices (tok TEXT PRIMARY KEY, who TEXT, at INTEGER, seen INTEGER)`);
    // 기기 목록에 보여 줄 것: 어떤 폰인지(ua), 누가 허락했는지(by), 폰이 스스로 붙인 번호(did)
    ["ua", "okby", "did"].forEach((c) => { try { this.sql.exec(`ALTER TABLE devices ADD COLUMN ${c} TEXT`); } catch (e) { /* 이미 있어요 */ } });
    this.sql.exec(`CREATE TABLE IF NOT EXISTS photos (name TEXT PRIMARY KEY, type TEXT, data BLOB)`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS reqs (id TEXT PRIMARY KEY, who TEXT, at INTEGER, status TEXT, tok TEXT, ua TEXT)`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS subs (endpoint TEXT PRIMARY KEY, who TEXT, p256dh TEXT, auth TEXT, at INTEGER, ok INTEGER, fail TEXT)`);
  }
  // 폰이 보낸 짧은 소식(장난 시작, 잡고 흔들기 같은 것)을 이어져 있는 다른 폰들에 바로 전해요. 기록에는 남기지 않아요.
  webSocketMessage(ws, msg) {
    if (typeof msg !== "string" || msg.length > 2000 || msg[0] !== "{") return;
    this.ctx.getWebSockets().forEach((w) => { if (w !== ws) { try { w.send(msg); } catch (e) { /* 끊긴 줄 */ } } });
  }
  webSocketClose(ws) { try { ws.close(); } catch (e) { /* 이미 닫힘 */ } }
  webSocketError() { /* 다시 이으면 돼요 */ }
  get(k) { const r = this.sql.exec(`SELECT v FROM kv WHERE k = ?`, k).toArray()[0]; return r ? r.v : null; }
  set(k, v) { this.sql.exec(`INSERT INTO kv (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v`, k, v); }
  device(req, url) {
    const h = req.headers.get("Authorization") || "";
    const tok = h.startsWith("Bearer ") ? h.slice(7) : url.searchParams.get("k") || "";
    if (!tok) return null;
    const r = this.sql.exec(`SELECT who FROM devices WHERE tok = ?`, tok).toArray()[0];
    if (!r) return null;
    this.sql.exec(`UPDATE devices SET seen = ? WHERE tok = ?`, Date.now(), tok);
    return { tok, who: r.who };
  }
  // (보낸 사람) 말고 다른 사람의 폰들에 알림을 보내요
  async pushOthers(from, list) {
    let jwk = null;
    try { jwk = JSON.parse(this.env.VAPID_JWK || "null"); } catch (e) { jwk = null; }
    if (!jwk) return;
    const subs = this.sql.exec(`SELECT endpoint, p256dh, auth FROM subs WHERE who != ?`, from).toArray();
    const msgs = list.slice(-4).map((m) => ({ title: String(m.title || "").slice(0, 60), body: String(m.body || "").slice(0, 180), tag: String(m.tag || "").slice(0, 40), url: String(m.url || "").slice(0, 40) }));
    for (const s of subs) {
      for (const m of msgs) {
        try {
          const body = await encryptPush(utf8(JSON.stringify(m)), s.p256dh, s.auth);
          const res = await fetch(s.endpoint, { method: "POST", headers: { "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", TTL: "86400", Urgency: "high", Authorization: await vapidAuth(s.endpoint, jwk, this.env.VAPID_SUB || "https://hong-seok-young.github.io/HS-Diary/") }, body });
          if (res.status === 404 || res.status === 410) { this.sql.exec(`DELETE FROM subs WHERE endpoint = ?`, s.endpoint); break; }
          if (res.ok) this.sql.exec(`UPDATE subs SET ok = ?, fail = '' WHERE endpoint = ?`, Date.now(), s.endpoint);
          else this.sql.exec(`UPDATE subs SET fail = ? WHERE endpoint = ?`, `${res.status} ${(await res.text()).slice(0, 80)}`, s.endpoint);
        } catch (e) { this.sql.exec(`UPDATE subs SET fail = ? WHERE endpoint = ?`, String(e && e.message).slice(0, 80), s.endpoint); }
      }
    }
  }
  newDevice(who, ua, by) {
    const tok = rid(24);
    this.sql.exec(`INSERT INTO devices (tok, who, at, seen, ua, okby, did) VALUES (?, ?, ?, ?, ?, ?, '')`, tok, who, Date.now(), Date.now(), String(ua || "").slice(0, 80), by || "first");
    return tok;
  }
  async fetch(req) {
    const url = new URL(req.url);
    const p = url.pathname.replace(/\/+$/, "") || "/";
    const admin = this.env.ADMIN && req.headers.get("X-Admin") === this.env.ADMIN;

    if (p === "/" ) return json({ ok: true, name: "hs-diary" });

    // ---- 기기 들이기 ----
    if (p === "/join" && req.method === "POST") {
      const b = await req.json().catch(() => ({}));
      const who = b.who === "her" ? "her" : b.who === "him" ? "him" : "";
      if (!who) return json({ error: "who" }, 400);
      const has = this.sql.exec(`SELECT COUNT(*) AS n FROM devices WHERE who = ?`, who).toArray()[0].n;
      if (!has) return json({ tok: this.newDevice(who, b.ua, "first") });
      // 이미 그 사람 폰이 있으면 허락을 기다려요
      const id = rid(12);
      this.sql.exec(`INSERT INTO reqs (id, who, at, status, tok, ua) VALUES (?, ?, ?, 'wait', '', ?)`, id, who, Date.now(), String(b.ua || "").slice(0, 80));
      return json({ wait: id });
    }
    if (p.startsWith("/join/") && req.method === "GET") {
      const id = p.slice(6);
      const r = this.sql.exec(`SELECT status, tok FROM reqs WHERE id = ?`, id).toArray()[0];
      if (!r) return json({ status: "gone" }, 404);
      if (r.status === "ok") { this.sql.exec(`DELETE FROM reqs WHERE id = ?`, id); return json({ tok: r.tok }); }
      return json({ status: r.status });
    }

    const dev = this.device(req, url);
    if (!dev && !admin) return json({ error: "auth" }, 401);

    // ---- 실시간: 누가 저장하면 이어져 있는 폰들에 바로 알려요 ----
    if (p === "/live") {
      if (req.headers.get("Upgrade") !== "websocket") return json({ error: "upgrade" }, 426);
      const pair = new WebSocketPair();
      this.ctx.acceptWebSocket(pair[1]);
      return new Response(null, { status: 101, webSocket: pair[0] });
    }

    // ---- 기기 목록 ----
    // 폰이 열릴 때마다 자기가 어떤 폰인지 한 줄 알려 줘요
    if (p === "/hello" && req.method === "POST" && dev) {
      const b = await req.json().catch(() => ({}));
      this.sql.exec(`UPDATE devices SET ua = ?, did = ? WHERE tok = ?`, String(b.ua || "").slice(0, 80), String(b.did || "").slice(0, 40), dev.tok);
      return json({ ok: true });
    }
    // 석영이 폰에서만 볼 수 있어요. 열쇠(tok)는 절대 내보내지 않아요.
    if (p === "/mydevices" && req.method === "GET") {
      if (!admin && !(dev && dev.who === "him")) return json({ error: "forbidden" }, 403);
      const list = this.sql.exec(`SELECT rowid AS id, who, at, seen, ua, okby, did, tok FROM devices ORDER BY at`).toArray().map((r) => ({ id: r.id, who: r.who, at: r.at, seen: r.seen, ua: r.ua || "", by: r.okby || "", did: r.did || "", me: !!dev && r.tok === dev.tok }));
      return json({ list });
    }

    // ---- 허락 ----
    if (p === "/pending" && req.method === "GET") {
      const since = Date.now() - 3 * 86400000;
      this.sql.exec(`DELETE FROM reqs WHERE at < ?`, since);
      return json({ list: this.sql.exec(`SELECT id, who, at, ua FROM reqs WHERE status = 'wait' ORDER BY at`).toArray() });
    }
    if (p === "/approve" && req.method === "POST") {
      const b = await req.json().catch(() => ({}));
      const r = this.sql.exec(`SELECT who, status, ua FROM reqs WHERE id = ?`, String(b.id || "")).toArray()[0];
      if (!r || r.status !== "wait") return json({ error: "gone" }, 404);
      if (b.ok) this.sql.exec(`UPDATE reqs SET status = 'ok', tok = ? WHERE id = ?`, this.newDevice(r.who, r.ua, dev ? dev.who : "admin"), String(b.id));
      else this.sql.exec(`UPDATE reqs SET status = 'no' WHERE id = ?`, String(b.id));
      return json({ ok: true });
    }

    // ---- 기록 ----
    if (p === "/db" && req.method === "GET") {
      return json({ db: JSON.parse(this.get("db") || "null"), v: Number(this.get("v") || 0) });
    }
    if (p === "/db" && req.method === "PUT") {
      const b = await req.json().catch(() => null);
      if (!b || typeof b.db !== "object") return json({ error: "body" }, 400);
      const v = Number(this.get("v") || 0);
      if (!admin && Number(b.v) !== v) return json({ error: "conflict", v }, 409);
      const text = JSON.stringify(b.db);
      if (text.length > 1900000) return json({ error: "too big" }, 413);
      this.set("db", text);
      this.set("v", String(v + 1));
      this.ctx.getWebSockets().forEach((w) => { try { w.send(String(v + 1)); } catch (e) { /* 끊긴 줄 */ } });
      // 상대에게 알릴 말이 같이 왔으면 상대 폰들에 알림을 보내요 (답은 기다리지 않고 먼저 돌려줘요)
      if (dev && Array.isArray(b.push) && b.push.length) this.ctx.waitUntil(this.pushOthers(dev.who, b.push));
      return json({ v: v + 1 });
    }

    // ---- 폰 알림 받기 등록 ----
    if (p === "/push/key" && req.method === "GET") {
      let jwk = null;
      try { jwk = JSON.parse(this.env.VAPID_JWK || "null"); } catch (e) { jwk = null; }
      return json({ key: jwk ? b64u(cat(new Uint8Array([4]), unb64u(jwk.x), unb64u(jwk.y))) : "" });
    }
    if (p === "/push/sub" && req.method === "POST" && dev) {
      const b = await req.json().catch(() => ({}));
      const k = b.keys || {};
      if (!/^https:\/\//.test(String(b.endpoint || "")) || !k.p256dh || !k.auth) return json({ error: "body" }, 400);
      this.sql.exec(`INSERT INTO subs (endpoint, who, p256dh, auth, at, ok, fail) VALUES (?, ?, ?, ?, ?, 0, '') ON CONFLICT(endpoint) DO UPDATE SET who = excluded.who, p256dh = excluded.p256dh, auth = excluded.auth`, String(b.endpoint), dev.who, String(k.p256dh), String(k.auth), Date.now());
      return json({ ok: true });
    }
    if (p === "/push/unsub" && req.method === "POST" && dev) {
      const b = await req.json().catch(() => ({}));
      this.sql.exec(`DELETE FROM subs WHERE endpoint = ?`, String(b.endpoint || ""));
      return json({ ok: true });
    }
    // 시험: 내 폰들에 알림 한 번 보내 보기
    if (p === "/push/test" && req.method === "POST" && dev) {
      await this.pushOthers(dev.who === "him" ? "her" : "him", [{ title: "알림 시험", body: "이 알림이 보이면 잘 되는 거예요", tag: "test" }]);
      return json({ ok: true, subs: this.sql.exec(`SELECT who, ok, fail FROM subs`).toArray() });
    }

    // ---- 사진 ----
    if (p.startsWith("/photo/")) {
      const name = decodeURIComponent(p.slice(7));
      if (!/^[\w.-]{1,80}$/.test(name)) return json({ error: "name" }, 400);
      if (req.method === "GET") {
        const r = this.sql.exec(`SELECT type, data FROM photos WHERE name = ?`, name).toArray()[0];
        if (!r) return json({ error: "none" }, 404);
        return new Response(r.data, { headers: Object.assign({ "Content-Type": r.type || "image/jpeg", "Cache-Control": "private, max-age=31536000, immutable" }, CORS) });
      }
      if (req.method === "PUT") {
        const buf = await req.arrayBuffer();
        if (buf.byteLength > 1900000) return json({ error: "too big" }, 413);
        this.sql.exec(`INSERT INTO photos (name, type, data) VALUES (?, ?, ?) ON CONFLICT(name) DO NOTHING`, name, req.headers.get("Content-Type") || "image/jpeg", buf);
        return json({ ok: true });
      }
    }
    // 관리용: 다 비우기 (시험 서버에서만 써요)
    if (p === "/reset" && admin && req.method === "POST") {
      ["kv", "devices", "photos", "reqs", "subs"].forEach((t) => this.sql.exec(`DELETE FROM ${t}`));
      return json({ ok: true });
    }
    if (p === "/devices" && admin) {
      return json({ list: this.sql.exec(`SELECT who, at, seen FROM devices`).toArray(), reqs: this.sql.exec(`SELECT id, who, at, status FROM reqs`).toArray(), v: this.get("v"), photos: this.sql.exec(`SELECT COUNT(*) AS n FROM photos`).toArray()[0].n, subs: this.sql.exec(`SELECT who, at, ok, fail, substr(endpoint, 9, 28) AS host FROM subs`).toArray() });
    }
    return json({ error: "not found" }, 404);
  }
}
