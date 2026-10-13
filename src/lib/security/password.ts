import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

/**
 * Password hashing with Node's built-in scrypt (memory-hard KDF).
 * Format: scrypt$N$r$p$salt$hash (base64url), so parameters can be raised later.
 */
const PARAMS = { N: 2 ** 15, r: 8, p: 1, keylen: 64 };

function derive(password: string, salt: Buffer, opts: ScryptOptions & { keylen: number }) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(password.normalize("NFKC"), salt, opts.keylen, { N: opts.N, r: opts.r, p: opts.p, maxmem: 128 * opts.N! * opts.r! * 2 }, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, PARAMS);
  return ["scrypt", PARAMS.N, PARAMS.r, PARAMS.p, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64url");
  const key = await derive(password, Buffer.from(saltB64, "base64url"), {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    keylen: expected.length,
  });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** Used when an account doesn't exist, so response time doesn't reveal which emails are registered. */
export const DUMMY_HASH =
  "scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 12) return "Password must be at least 12 characters.";
  if (!/[a-z]/i.test(password) || !/\d/.test(password)) return "Password must include letters and numbers.";
  return null;
}
