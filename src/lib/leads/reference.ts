import { randomInt } from "node:crypto";

// No 0/O/1/I/L to avoid confusion when read out over the phone.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** Human-friendly lead reference, e.g. "MVQ-7K3P9Q". */
export function generateLeadReference(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return `MVQ-${code}`;
}
