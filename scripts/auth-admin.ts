import { authPool } from "../server/auth-store";
import { hashPassword } from "../server/auth-password";
// Only an operator with direct database access may run this command.
async function main() {
  const [action, username] = process.argv.slice(2);
  if (!["owner", "reset-password"].includes(action) || !username) throw new Error("Usage: npm run auth:admin -- owner|reset-password EXISTING_USERNAME");
  const client = await authPool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query("SELECT id,password FROM users WHERE lower(btrim(username))=$1 FOR UPDATE", [username.trim().toLowerCase()]);
    if (result.rows.length !== 1) throw new Error("Choose exactly one existing account.");
    const account = result.rows[0];
    if (action === "owner") {
      if (!/^scrypt-v1\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(account.password)) throw new Error("Reset this legacy account's password first.");
      await client.query("UPDATE users SET role='owner',auth_version=auth_version+1 WHERE id=$1", [account.id]);
    } else {
      if (process.stdin.isTTY) throw new Error("Read the password privately and pipe it over standard input; never pass it as an argument.");
      let input = "";
      for await (const chunk of process.stdin) {
        input += chunk.toString();
        if (Buffer.byteLength(input) > 1024) throw new Error("Password input too long.");
      }
      const password = input.replace(/\r?\n$/, "");
      if (password.length < 12 || password.length > 128) throw new Error("Password must have 12–128 characters.");
      await client.query("UPDATE users SET password=$2,auth_version=auth_version+1 WHERE id=$1", [account.id, await hashPassword(password)]);
    }
    await client.query("DELETE FROM auth_sessions WHERE data->>'accountId'=$1", [String(account.id)]);
    await client.query("COMMIT");
    console.log("Account updated. All previous sessions invalidated.");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Account update failed"); process.exitCode = 1; }).finally(() => authPool.end());
