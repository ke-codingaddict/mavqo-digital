import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

/**
 * Authenticated encryption (AES-256-GCM) for secrets stored in the database,
 * such as the mail provider's API key. Format: v1.<iv>.<tag>.<ciphertext>
 * (base64url). The key is derived from SETTINGS_ENCRYPTION_KEY, so a database
 * dump alone doesn't reveal the secrets.
 */

const VERSION = "v1";

function deriveKey(secret: string): Buffer {
  return Buffer.from(hkdfSync("sha256", secret, "mavqo-settings", "settings-encryption-v1", 32));
}

export function encryptSecret(plaintext: string, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(secret), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return [VERSION, iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), ct.toString("base64url")].join(".");
}

/** Returns null when the value is malformed, was tampered with, or the key changed. */
export function decryptSecret(sealed: string, secret: string): string | null {
  const [version, iv, tag, ct] = sealed.split(".");
  if (version !== VERSION || !iv || !tag || ct === undefined) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", deriveKey(secret), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(ct, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/** Shows enough of a secret to recognise it, never enough to use it. */
export function maskSecret(value: string): string {
  return value.length <= 8 ? "••••" : `${value.slice(0, 3)}••••${value.slice(-4)}`;
}
