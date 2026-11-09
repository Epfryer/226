import { authPool } from "../server/auth-store";
export async function setupAuth() {
  const client = await authPool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(802727)");
    await client.query(`CREATE TABLE IF NOT EXISTS users (
      id serial PRIMARY KEY, username text UNIQUE NOT NULL, password text NOT NULL)`);
    const audit = await client.query(`SELECT count(*)::int AS total,
      count(*) FILTER (WHERE password ~ '^scrypt-v1\\$[a-f0-9]{32}\\$[a-f0-9]{128}$')::int AS recognized_hashes
      FROM users`);
    console.log("[Auth setup] Aggregate credential audit (no usernames or passwords):", audit.rows[0]);
    const collisions = await client.query(`SELECT count(*)::int AS count FROM
      (SELECT lower(btrim(username)) FROM users GROUP BY lower(btrim(username)) HAVING count(*)>1) duplicates`);
    if (collisions.rows[0].count) throw new Error("Normalized username collisions exist. Resolve them explicitly before setup.");
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'visitor'`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_version integer NOT NULL DEFAULT 1`);
    await client.query(`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='users_auth_role_check') THEN
        ALTER TABLE users ADD CONSTRAINT users_auth_role_check CHECK (role IN ('visitor','owner'));
      END IF;
    END $$`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS users_username_normalized_unique ON users(lower(btrim(username)))`);
    await client.query(`CREATE TABLE IF NOT EXISTS auth_sessions (
      sid text PRIMARY KEY, data jsonb NOT NULL, expires_at timestamptz NOT NULL)`);
    await client.query("CREATE INDEX IF NOT EXISTS auth_sessions_expiry ON auth_sessions(expires_at)");
    await client.query(`CREATE TABLE IF NOT EXISTS auth_rate_limits (
      key text PRIMARY KEY, window_id integer NOT NULL, count integer NOT NULL)`);
    await client.query("COMMIT");
    console.log("[Auth setup] Ready. Existing passwords and permissions were not upgraded automatically.");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}
if (process.argv[1]?.endsWith("auth-setup.ts")) {
  setupAuth().catch(() => { console.error("[Auth setup] Failed. Check database access or normalized username collisions."); process.exitCode = 1; })
    .finally(() => authPool.end());
}
