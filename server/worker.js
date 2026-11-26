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
    this.sql.exec(`CREATE TABLE IF NOT EXISTS photos (name TEXT PRIMARY KEY, type TEXT, data BLOB)`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS reqs (id TEXT PRIMARY KEY, who TEXT, at INTEGER, status TEXT, tok TEXT, ua TEXT)`);
  }
  webSocketMessage() { /* 폰은 듣기만 해요 */ }
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
  newDevice(who) {
    const tok = rid(24);
    this.sql.exec(`INSERT INTO devices (tok, who, at, seen) VALUES (?, ?, ?, ?)`, tok, who, Date.now(), Date.now());
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
      if (!has) return json({ tok: this.newDevice(who) });
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

    // ---- 허락 ----
    if (p === "/pending" && req.method === "GET") {
      const since = Date.now() - 3 * 86400000;
      this.sql.exec(`DELETE FROM reqs WHERE at < ?`, since);
      return json({ list: this.sql.exec(`SELECT id, who, at, ua FROM reqs WHERE status = 'wait' ORDER BY at`).toArray() });
    }
    if (p === "/approve" && req.method === "POST") {
      const b = await req.json().catch(() => ({}));
      const r = this.sql.exec(`SELECT who, status FROM reqs WHERE id = ?`, String(b.id || "")).toArray()[0];
      if (!r || r.status !== "wait") return json({ error: "gone" }, 404);
      if (b.ok) this.sql.exec(`UPDATE reqs SET status = 'ok', tok = ? WHERE id = ?`, this.newDevice(r.who), String(b.id));
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
      return json({ v: v + 1 });
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
      ["kv", "devices", "photos", "reqs"].forEach((t) => this.sql.exec(`DELETE FROM ${t}`));
      return json({ ok: true });
    }
    if (p === "/devices" && admin) {
      return json({ list: this.sql.exec(`SELECT who, at, seen FROM devices`).toArray(), reqs: this.sql.exec(`SELECT id, who, at, status FROM reqs`).toArray(), v: this.get("v"), photos: this.sql.exec(`SELECT COUNT(*) AS n FROM photos`).toArray()[0].n });
    }
    return json({ error: "not found" }, 404);
  }
}
