import pg from "pg";
import session from "express-session";
export const authPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL, max: 5,
  connectionTimeoutMillis: 3000, statement_timeout: 5000,
});
authPool.on("error", () => console.error("[Auth] Database connection unavailable"));
export class PostgresSessionStore extends session.Store {
  constructor(private pool = authPool) { super(); }
  get(sid: string, cb: (error: any, data?: session.SessionData | null) => void) {
    this.pool.query("SELECT data FROM auth_sessions WHERE sid=$1 AND expires_at > now()", [sid])
      .then(r => cb(null, r.rows[0]?.data ?? null), () => cb(new Error("Session storage unavailable")));
  }
  set(sid: string, data: session.SessionData, cb?: (error?: any) => void) {
    this.pool.query(`INSERT INTO auth_sessions(sid,data,expires_at) VALUES($1,$2,$3)
      ON CONFLICT(sid) DO UPDATE SET data=$2,expires_at=$3`, [sid, JSON.stringify(data), data.cookie.expires])
      .then(() => cb?.(), () => cb?.(new Error("Session storage unavailable")));
  }
  destroy(sid: string, cb?: (error?: any) => void) {
    this.pool.query("DELETE FROM auth_sessions WHERE sid=$1", [sid])
      .then(() => cb?.(), () => cb?.(new Error("Session storage unavailable")));
  }
}
