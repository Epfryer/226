import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import session from "express-session";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { authPool, PostgresSessionStore } from "./auth-store";
import { hashPassword, verifyPassword } from "./auth-password";
import { trustedOrigins } from "./request-origin";

declare module "express-session" {
  interface SessionData { accountId?: number; accountVersion?: number; csrfToken?: string; }
}
declare global {
  namespace Express { interface Request { account?: { id: number; username: string; role: "visitor" | "owner" }; } }
}
const credentials = z.object({
  username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/, "Use 3–32 letters, numbers, underscores or hyphens.").transform(s => s.toLowerCase()),
  password: z.string().min(12, "Use a password with at least 12 characters.").max(128, "Use at most 128 characters."),
}).strict();
const publicAccount = z.object({ id: z.number().int().positive(), username: z.string(), role: z.enum(["visitor", "owner"]) });
const unavailable = (res: Response) => res.status(503).json({ error: "Accounts are temporarily unavailable. Please try again later." });
const route = (fn: (req: Request, res: Response) => Promise<unknown>): RequestHandler => (req, res) => {
  void fn(req, res).catch(() => { if (!res.headersSent) unavailable(res); });
};
const save = (req: Request) => new Promise<void>((resolve, reject) => req.session.save(e => e ? reject(e) : resolve()));
const regenerate = (req: Request) => new Promise<void>((resolve, reject) => req.session.regenerate(e => e ? reject(e) : resolve()));
const destroy = (req: Request) => new Promise<void>((resolve, reject) => req.session.destroy(e => e ? reject(e) : resolve()));
export const privateResponse: RequestHandler = (_req, res, next) => {
  res.set({ "Cache-Control": "no-store, private", "X-Robots-Tag": "noindex, nofollow" }); next();
};
export const csrfProtection: RequestHandler = (req, res, next) => {
  const provided = req.get("X-CSRF-Token") || "";
  const token = req.session?.csrfToken;
  if (!trustedOrigins().has(req.get("Origin") || "") || req.get("Sec-Fetch-Site") === "cross-site" ||
      !token || !/^[a-f0-9]{64}$/.test(token) || !/^[a-f0-9]{64}$/.test(provided) || !timingSafeEqual(Buffer.from(provided), Buffer.from(token))) {
    res.status(403).json({ error: "Your request could not be verified. Refresh this page and try again." }); return;
  }
  next();
};
export function createAuth(options: { secret?: string; store?: session.Store; pool?: typeof authPool; production?: boolean } = {}) {
  const pool = options.pool ?? authPool;
  const secret = options.secret ?? process.env.SESSION_SECRET;
  const production = options.production ?? process.env.NODE_ENV === "production";
  const sessions = secret && secret.length >= 32 ? session({
    name: "def_session", secret, store: options.store ?? new PostgresSessionStore(pool),
    resave: false, saveUninitialized: false, rolling: false,
    cookie: { httpOnly: true, sameSite: "lax", secure: production, maxAge: 7 * 86400000, path: "/" },
  }) : null;
  const load: RequestHandler = (req, res, next) => {
    if (!sessions || !process.env.DATABASE_URL) { unavailable(res); return; }
    sessions(req, res, error => { if (error) unavailable(res); else next(); });
  };
  const account: RequestHandler = (req, res, next) => {
    if (!req.session.accountId) { next(); return; }
    pool.query("SELECT id,username,role,auth_version FROM users WHERE id=$1", [req.session.accountId]).then(async r => {
      const row = r.rows[0];
      if (row && row.auth_version === req.session.accountVersion && ["visitor", "owner"].includes(row.role)) {
        req.account = publicAccount.parse(row);
      } else {
        await regenerate(req);
      }
      next();
    }).catch(() => unavailable(res));
  };
  const owner: RequestHandler = (req, res, next) => {
    if (!req.account) { res.status(401).json({ error: "Please sign in." }); return; }
    if (req.account.role !== "owner") { res.status(403).json({ error: "Only the site owner can manage publications." }); return; }
    next();
  };
  let activeHashes = 0;
  const limited: RequestHandler = (req, res, next) => {
    const now = Math.floor(Date.now() / 900000);
    const username = typeof req.body?.username === "string" ? req.body.username.trim().toLowerCase().slice(0, 32) : "";
    const keys = [`ip:${req.ip}`, `name:${username}`].map(k => createHmac("sha256", secret!).update(k).digest("hex"));
    const increment = (bucketKeys: string[]) => pool.query(`INSERT INTO auth_rate_limits(key,window_id,count) SELECT unnest($1::text[]),$2,1
      ON CONFLICT(key) DO UPDATE SET window_id=$2,count=CASE WHEN auth_rate_limits.window_id=$2 THEN auth_rate_limits.count+1 ELSE 1 END
      RETURNING key,count`, [bucketKeys, now]);
    const reject = () => { res.set("Retry-After", "900").status(429).json({ error: "Too many attempts. Please try again in 15 minutes." }); };
    // Bound table growth and expensive hash work across all deployed instances.
    const globalKey = createHmac("sha256", secret!).update("global").digest("hex");
    void increment([globalKey]).then(async global => {
      if (global.rows[0].count > 1000) { reject(); return; }
      const r = await increment(keys);
      if (r.rows.some(row => row.count > (row.key === keys[0] ? 30 : 15)) || activeHashes >= 4) {
        reject(); return;
      }
      activeHashes++;
      res.once("close", () => { activeHashes--; });
      next();
    }).catch(() => unavailable(res));
  };
  function register(app: Express) {
    app.use("/api/auth", privateResponse, load, account);
    app.get("/api/auth/me", route(async (req, res) => {
      req.session.csrfToken ||= randomBytes(32).toString("hex");
      await save(req);
      res.json({ user: req.account ?? null, csrfToken: req.session.csrfToken });
    }));
    for (const action of ["register", "login"] as const) {
      app.post(`/api/auth/${action}`, csrfProtection, limited, route(async (req, res) => {
        const parsed = credentials.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ error: action === "login" ? "Invalid username or password." : parsed.error.issues[0].message });
        const { username, password } = parsed.data;
        let row;
        if (action === "register") {
          const hash = await hashPassword(password);
          const result = await pool.query(`INSERT INTO users(username,password,role) VALUES($1,$2,'visitor')
            ON CONFLICT DO NOTHING RETURNING id,username,role,auth_version`, [username, hash]);
          row = result.rows[0];
          if (!row) return res.status(409).json({ error: "That username is unavailable. Please choose another." });
        } else {
          row = (await pool.query("SELECT id,username,password,role,auth_version FROM users WHERE lower(btrim(username))=$1", [username])).rows[0];
          if (!await verifyPassword(password, row?.password ?? "")) return res.status(401).json({ error: "Invalid username or password." });
        }
        await regenerate(req);
        req.session.accountId = row.id;
        req.session.accountVersion = row.auth_version;
        req.session.csrfToken = randomBytes(32).toString("hex");
        await save(req);
        res.status(action === "register" ? 201 : 200).json({
          user: publicAccount.parse(row), csrfToken: req.session.csrfToken,
        });
      }));
    }
    app.post("/api/auth/logout", csrfProtection, route(async (req, res) => {
      await destroy(req);
      res.clearCookie("def_session", { httpOnly: true, sameSite: "lax", secure: production, path: "/" });
      res.json({ user: null, csrfToken: "" });
    }));
    app.use("/api/auth", (_req, res) => res.status(404).json({ error: "Account endpoint not found." }));
  }
  return { register, ownerGuard: [privateResponse, load, account, owner, csrfProtection],
    ownerReadGuard: [privateResponse, load, account, owner] };
}
export const auth = createAuth();
