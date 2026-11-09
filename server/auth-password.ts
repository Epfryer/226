import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
const options = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const scrypt = (password: string, salt: string, length: number, settings: typeof options) =>
  new Promise<Buffer>((resolve, reject) => scryptCallback(password, salt, length, settings, (error, key) => error ? reject(error) : resolve(key)));
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password, salt, 64, options) as Buffer;
  return `scrypt-v1$${salt}$${key.toString("hex")}`;
}
export async function verifyPassword(password: string, hash: string) {
  if (!/^scrypt-v1\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(hash)) {
    // Legacy/plaintext credentials never authenticate; keep comparable hash work.
    await scrypt(password, "00000000000000000000000000000000", 64, options);
    return false;
  }
  const [, salt, stored] = hash.split("$");
  const key = await scrypt(password, salt, 64, options) as Buffer;
  return timingSafeEqual(Buffer.from(stored, "hex"), key);
}
