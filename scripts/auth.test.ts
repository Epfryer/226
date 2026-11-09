import { test, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import type { Server } from "node:http";
import { authPool, PostgresSessionStore } from "../server/auth-store";
import { createAuth } from "../server/auth";
import { registerRoutes } from "../server/routes";
import { hashPassword, verifyPassword } from "../server/auth-password";
import { setupAuth } from "./auth-setup";
import { renderPublicResponse } from "../server/public-render";
import { safeReturnTo } from "../client/src/lib/auth";
import { readFileSync } from "node:fs";
import { serveStatic } from "../server/vite";
import { privateResponse } from "../server/auth";
import { Client } from "@replit/object-storage";
import { uploadPdf, deletePdf } from "../server/storage";
import { spawn } from "node:child_process";

if (process.env.NODE_ENV === "production") throw new Error("Authentication tests require a development database.");

const secret = `test-only-${randomUUID()}`;
const origin = "https://ethanfryer.com";
const prefix = `auth_${randomUUID().slice(0, 8)}_`;
const names: string[] = [];
const sids = new Set<string>();
const servers: Server[] = [];
const password = "Test-only strong password 948!";
const username = () => { const name = prefix + names.length; names.push(name); return name; };
after(async () => {
  for (const server of servers) { server.closeAllConnections(); await new Promise<void>(r => server.close(() => r())); }
  await authPool.query("DELETE FROM auth_sessions WHERE sid=ANY($1::text[])", [[...sids]]);
  await authPool.query("DELETE FROM users WHERE username=ANY($1::text[])", [names]);
  await authPool.end();
});
async function fixture(options: Parameters<typeof createAuth>[0] = {}) {
  const app = express();
  app.use(express.json());
  let uploaded: Record<string, string> | undefined;
  let deletes = 0;
  const service = createAuth({ secret, production: false, ...options });
  const server = registerRoutes(app, {
    uploadPdf: async (_bytes, _filename, metadata) => { uploaded = metadata; return { success: true }; },
    deletePdf: async () => { deletes++; return true; },
  }, service);
  app.use((error: any, _req: any, res: any, _next: any) => res.status(500).json({ error: "Unexpected test error" }));
  server.listen(0, "127.0.0.1"); servers.push(server);
  await once(server, "listening");
  const address = server.address() as { port: number };
  const base = `http://127.0.0.1:${address.port}`;
  let cookie = "";
  let token = "";
  async function request(path: string, options: { method?: string; body?: any; headers?: Record<string, string>; raw?: BodyInit; cookie?: string } = {}) {
    if (options.cookie !== undefined) cookie = options.cookie;
    const response = await fetch(base + path, {
      method: options.method ?? "GET",
      headers: { Origin: origin, Cookie: options.cookie ?? cookie, ...(options.body ? { "Content-Type": "application/json" } : {}),
        "X-CSRF-Token": token, ...options.headers },
      body: options.raw ?? (options.body ? JSON.stringify(options.body) : undefined),
    });
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      cookie = setCookie.split(";")[0];
      const sid = decodeURIComponent(cookie.split("=")[1] || "").replace(/^s:/, "").split(".")[0];
      if (sid) sids.add(sid);
    }
    const data = await response.json();
    if (data.csrfToken) token = data.csrfToken;
    return { response, data };
  }
  return { request, get cookie() { return cookie; }, get token() { return token; }, get uploaded() { return uploaded; }, get deletes() { return deletes; } };
}
const authPath = "/api/auth/";
test("password accounts, persistent sessions and publication authorization", async t => {
  await setupAuth();
  const f = await fixture();
  const name = username();
  let visitorCookie = "";
  let visitorId = 0;
  await t.test("anonymous status is explicit, private, and authorization precedes multipart parsing", async () => {
    const me = await f.request(authPath + "me");
    assert.equal(me.data.user, null);
    assert.match(me.response.headers.get("cache-control")!, /no-store/);
    assert.match(me.response.headers.get("x-robots-tag")!, /noindex/);
    const cookie = me.response.headers.get("set-cookie")!;
    assert.match(cookie, /HttpOnly/); assert.match(cookie, /SameSite=Lax/); assert.match(cookie, /Expires=/);
    const result = await f.request("/api/publications/upload", { method: "POST", raw: "not a multipart file", headers: { "Content-Type": "multipart/form-data" } });
    assert.equal(result.response.status, 401);
    assert.equal((await f.request("/api/publications/book.pdf", { method: "DELETE" })).response.status, 401);
  });
  await t.test("CSRF and origin checks protect registration; roles cannot be supplied", async () => {
    assert.equal((await f.request(authPath + "register", { method: "POST", body: { username: name, password }, headers: { "X-CSRF-Token": "" } })).response.status, 403);
    assert.equal((await f.request(authPath + "register", { method: "POST", body: { username: name, password }, headers: { Origin: "https://evil.example" } })).response.status, 403);
    assert.equal((await f.request(authPath + "register", { method: "POST", body: { username: name, password, role: "owner" } })).response.status, 400);
    assert.equal((await f.request(authPath + "register", { method: "POST", body: { username: name, password: "short" } })).response.status, 400);
  });
  await t.test("registration stores salted hashes, returns only safe fields, rotates session IDs", async () => {
    const before = f.cookie;
    const result = await f.request(authPath + "register", { method: "POST", body: { username: name.toUpperCase(), password } });
    assert.equal(result.response.status, 201);
    assert.equal(result.data.user.username, name);
    assert.equal(result.data.user.role, "visitor");
    assert.deepEqual(Object.keys(result.data.user).sort(), ["id", "role", "username"]);
    assert.notEqual(f.cookie, before);
    assert.equal((await f.request(authPath + "me", { cookie: before })).data.user, null);
    visitorCookie = f.cookie;
    // Restore authenticated cookie: the old-cookie request created an anonymous session.
    const login = await f.request(authPath + "login", { method: "POST", body: { username: name, password } });
    assert.equal(login.response.status, 200);
    visitorCookie = f.cookie;
    visitorId = result.data.user.id;
    const row = (await authPool.query("SELECT password FROM users WHERE id=$1", [visitorId])).rows[0];
    assert.notEqual(row.password, password);
    assert.equal(await verifyPassword(password, row.password), true);
    assert.equal(await verifyPassword("incorrect password", row.password), false);
    assert.notEqual(await hashPassword(password), row.password);
    assert.equal(await verifyPassword(password, password), false);
  });
  await t.test("normalized duplicate registrations are race-safe", async () => {
    const a = await fixture(), b = await fixture();
    await a.request(authPath + "me"); await b.request(authPath + "me");
    const raceName = username();
    const results = await Promise.all([a, b].map((client, i) => client.request(authPath + "register", { method: "POST", body: { username: i ? raceName.toUpperCase() : raceName, password } })));
    assert.deepEqual(results.map(r => r.response.status).sort(), [201, 409]);
  });
  await t.test("sessions survive a new server/store instance and roles are read from the database", async () => {
    const restarted = await fixture({ store: new PostgresSessionStore() });
    const result = await restarted.request(authPath + "me", { cookie: visitorCookie });
    assert.equal(result.data.user.id, visitorId);
    assert.equal((await f.request("/api/publications/book.pdf", { method: "DELETE", body: { role: "owner" }, cookie: visitorCookie })).response.status, 403);
    const upload = await f.request("/api/publications/upload", { method: "POST", raw: "invalid multipart", headers: { "Content-Type": "multipart/form-data" }, cookie: visitorCookie });
    assert.equal(upload.response.status, 403);
    assert.equal(f.uploaded, undefined); assert.equal(f.deletes, 0);
    await authPool.query(`UPDATE auth_sessions SET data=jsonb_set(data,'{role}','"owner"')
      WHERE data->>'accountId'=$1`, [String(visitorId)]);
    assert.equal((await f.request("/api/publications/book.pdf", { method: "DELETE", cookie: visitorCookie })).response.status, 403);
    const tampered = visitorCookie.replace(/.$/, visitorCookie.endsWith("a") ? "b" : "a");
    assert.equal((await f.request("/api/publications/book.pdf", { method: "DELETE", cookie: tampered })).response.status, 401);
  });
  await t.test("only a trusted role change enables owner mutations, still requiring CSRF", async () => {
    await authPool.query("UPDATE users SET role='owner' WHERE id=$1", [visitorId]);
    await f.request(authPath + "me", { cookie: visitorCookie });
    assert.equal((await f.request("/api/publications/book.pdf", { method: "DELETE", headers: { "X-CSRF-Token": "0".repeat(64) } })).response.status, 403);
    const form = new FormData();
    form.append("pdf", new Blob(["%PDF-test"], { type: "application/pdf" }), "fixture.pdf");
    form.append("uploadedBy", "attacker");
    const result = await f.request("/api/publications/upload", { method: "POST", raw: form });
    assert.equal(result.response.status, 200);
    assert.equal(f.uploaded?.uploadedBy, String(visitorId));
    assert.equal((await f.request("/api/publications/book.pdf", { method: "DELETE" })).response.status, 200);
    assert.equal(f.deletes, 1);
    await authPool.query("UPDATE users SET role='visitor' WHERE id=$1", [visitorId]);
    assert.equal((await f.request("/api/publications/book.pdf", { method: "DELETE" })).response.status, 403);
  });
  await t.test("logout invalidates the session including a replayed cookie", async () => {
    const old = f.cookie;
    assert.equal((await f.request(authPath + "logout", { method: "POST", body: {} })).response.status, 200);
    assert.equal((await f.request(authPath + "me", { cookie: old })).data.user, null);
  });
  await t.test("HTTP expiry and password-reset version changes invalidate previously valid sessions", async () => {
    const b = await fixture();
    await b.request(authPath + "me");
    const registration = await b.request(authPath + "register", { method: "POST", body: { username: username(), password } });
    assert.equal(registration.response.status, 201);
    const id = registration.data.user.id;
    assert.equal((await b.request(authPath + "me")).data.user.id, id);
    await authPool.query("UPDATE users SET auth_version=auth_version+1 WHERE id=$1", [id]);
    assert.equal((await b.request(authPath + "me")).data.user, null);
    const login = await b.request(authPath + "login", { method: "POST", body: { username: registration.data.user.username, password } });
    assert.equal(login.response.status, 200);
    await authPool.query("UPDATE auth_sessions SET expires_at=now()-interval '1 second' WHERE data->>'accountId'=$1", [String(id)]);
    assert.equal((await b.request(authPath + "me")).data.user, null);
  });
  await t.test("invalid login is generic, legacy passwords do not authenticate, rate limits are shared", async () => {
    await f.request(authPath + "me");
    const invalid = await f.request(authPath + "login", { method: "POST", body: { username: name, password: "incorrect password" } });
    const missing = await f.request(authPath + "login", { method: "POST", body: { username: username(), password } });
    assert.equal(invalid.response.status, 401); assert.deepEqual(invalid.data, missing.data);
    const legacy = username();
    await authPool.query("INSERT INTO users(username,password) VALUES($1,$2)", [legacy, password]);
    assert.equal((await f.request(authPath + "login", { method: "POST", body: { username: legacy, password } })).response.status, 401);
    // Independent instance shares the username limiter even with a fresh session.
    const b = await fixture(); await b.request(authPath + "me");
    let limited;
    for (let i = 0; i < 17; i++) {
      limited = await (i % 2 ? b : f).request(authPath + "login", { method: "POST", body: { username: name, password: "incorrect password" } });
      if (limited.response.status === 429) break;
    }
    assert.equal(limited?.response.status, 429);
    assert.ok(limited?.response.headers.get("retry-after"));
  });
  await t.test("store expiry prevents loading a stale record", async () => {
    const sid = randomUUID(); sids.add(sid);
    const data = { cookie: { originalMaxAge: 604800000, expires: new Date(Date.now() + 86400000).toISOString(), httpOnly: true, path: "/" }, accountId: visitorId, accountVersion: 1, csrfToken: "a".repeat(64) };
    const store = new PostgresSessionStore();
    await new Promise<void>((resolve, reject) => store.set(sid, data as any, e => e ? reject(e) : resolve()));
    await authPool.query("UPDATE auth_sessions SET expires_at=now()-interval '1 second' WHERE sid=$1", [sid]);
    const loaded = await new Promise((resolve, reject) => store.get(sid, (e, value) => e ? reject(e) : resolve(value)));
    assert.equal(loaded, null);
  });
  await t.test("unavailable configuration or storage fails closed but public endpoints stay available", async () => {
    const brokenPool = { query: async () => { throw new Error("private database diagnostic"); } } as any;
    const unavailable = await fixture({ pool: brokenPool });
    const failure = await unavailable.request(authPath + "me");
    assert.equal(failure.response.status, 503);
    assert.doesNotMatch(JSON.stringify(failure.data), /private database diagnostic/);
    assert.equal((await unavailable.request("/api/publications/book.pdf", { method: "DELETE" })).response.status, 503);
    assert.equal((await unavailable.request("/api/paypal/status")).response.status, 200);
    const missingSecret = await fixture({ secret: "" });
    assert.equal((await missingSecret.request(authPath + "me")).response.status, 503);
    assert.equal((await missingSecret.request("/api/paypal/status")).response.status, 200);
  });
  await t.test("production cookies are Secure behind the trusted HTTPS proxy", async () => {
    const app = express();
    app.set("trust proxy", 1);
    const service = createAuth({ secret, production: true });
    service.register(app);
    const server = app.listen(0, "127.0.0.1"); servers.push(server);
    await once(server, "listening");
    const port = (server.address() as { port: number }).port;
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/me`, { headers: { "X-Forwarded-Proto": "https" } });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("set-cookie")!, /; Secure/);
    const cookie = response.headers.get("set-cookie")!.split(";")[0];
    sids.add(decodeURIComponent(cookie.split("=")[1]).replace(/^s:/, "").split(".")[0]);
  });
});
test("private routes render directly without private data, indexing or unsafe returns", async () => {
  const template = readFileSync("client/index.html", "utf8");
  for (const path of ["/login", "/register", "/account"]) {
    const result = await renderPublicResponse(template, path);
    assert.equal(result.status, 200);
    assert.match(result.html, /noindex/);
    assert.doesNotMatch(result.html, /Page Not Found|accountVersion|csrfToken/);
    assert.match(result.html, /<div id="root"><\/div>/);
  }
  for (const value of ["https://evil.test", "//evil.test", "/\\evil", "/login", "/register", "/\n/evil"]) assert.equal(safeReturnTo(value), "/account");
  assert.equal(safeReturnTo("/studio?x=1"), "/studio?x=1");
});
test("production static fallback recognizes private URLs and preserves no-store headers", async () => {
  const app = express();
  app.use(["/login", "/register", "/account"], privateResponse);
  serveStatic(app, "dist/public");
  const server = app.listen(0, "127.0.0.1"); servers.push(server);
  await once(server, "listening");
  const port = (server.address() as { port: number }).port;
  for (const path of ["/login", "/register", "/account", "/account/"]) {
    const response = await fetch(`http://127.0.0.1:${port}${path}`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("cache-control")!, /no-store/);
    assert.match(await response.text(), /noindex/);
  }
});
test("upload attribution is actually persisted; partial failures are explicit", async () => {
  const originalUpload = Client.prototype.uploadFromBytes;
  const originalText = Client.prototype.uploadFromText;
  const originalDelete = Client.prototype.delete;
  const writes: { name: string; text: string }[] = [];
  const removals: string[] = [];
  try {
    Client.prototype.uploadFromBytes = async () => ({ ok: true, value: null }) as any;
    Client.prototype.uploadFromText = async (name, text) => { writes.push({ name, text }); return { ok: true, value: null } as any; };
    Client.prototype.delete = async name => { removals.push(name); return { ok: true, value: null } as any; };
    const result = await uploadPdf(Buffer.from("%PDF-test"), "fixture.pdf", { uploadedBy: "42", title: "Fixture" });
    assert.equal(result.success, true);
    assert.equal(result.uploadedBy, "42");
    assert.equal(writes[0].name, ".publication-metadata/fixture.pdf.json");
    assert.equal(JSON.parse(writes[0].text).uploadedBy, "42");
    assert.equal(await deletePdf("fixture.pdf"), true);
    assert.deepEqual(removals, ["fixture.pdf", ".publication-metadata/fixture.pdf.json"]);
    Client.prototype.uploadFromText = async () => ({ ok: false, error: { message: "storage unavailable" } }) as any;
    const failed = await uploadPdf(Buffer.from("%PDF-test"), "fixture.pdf", { uploadedBy: "42" });
    assert.equal(failed.success, false);
    assert.match(failed.error!, /PDF uploaded, but its attribution could not be recorded/);
  } finally {
    Client.prototype.uploadFromBytes = originalUpload;
    Client.prototype.uploadFromText = originalText;
    Client.prototype.delete = originalDelete;
  }
});
test("trusted owner provisioning and password recovery invalidate sessions without creating accounts", async () => {
  const name = username();
  const result = await authPool.query("INSERT INTO users(username,password) VALUES($1,$2) RETURNING id", [name, await hashPassword(password)]);
  const id = result.rows[0].id;
  async function command(action: string, input?: string, target = name) {
    const child = spawn(process.execPath, ["--import", "tsx", "scripts/auth-admin.ts", action, target], { stdio: ["pipe", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", data => { output += data.toString(); });
    child.stderr.on("data", data => { output += data.toString(); });
    child.stdin.end(input);
    const [code] = await once(child, "close");
    assert.doesNotMatch(output, new RegExp(password));
    return code;
  }
  const sid = randomUUID(); sids.add(sid);
  await authPool.query("INSERT INTO auth_sessions(sid,data,expires_at) VALUES($1,$2,now()+interval '1 day')", [sid, JSON.stringify({ accountId: id })]);
  assert.equal(await command("owner"), 0);
  let row = (await authPool.query("SELECT role,auth_version,password FROM users WHERE id=$1", [id])).rows[0];
  assert.equal(row.role, "owner"); assert.equal(row.auth_version, 2);
  assert.equal((await authPool.query("SELECT sid FROM auth_sessions WHERE sid=$1", [sid])).rowCount, 0);
  const nextPassword = "Another test-only password 83746!";
  assert.equal(await command("reset-password", nextPassword), 0);
  row = (await authPool.query("SELECT role,auth_version,password FROM users WHERE id=$1", [id])).rows[0];
  assert.equal(row.role, "owner"); assert.equal(row.auth_version, 3);
  assert.equal(await verifyPassword(nextPassword, row.password), true);
  assert.equal(await verifyPassword(password, row.password), false);
  assert.notEqual(await command("owner", undefined, username()), 0);
});
