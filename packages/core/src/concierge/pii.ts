import { createHash } from "node:crypto";

/**
 * Redact obvious PII before logging or sending free text to the LLM.
 * RGPD/LGPD data minimization: the model never needs the tourist's phone
 * number or email to recommend a café.
 */
const PHONE = /\+?\d[\d\s().-]{7,}\d/g;
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

export function redactPII(input: string): string {
  return input.replace(EMAIL, "[email]").replace(PHONE, "[phone]");
}

/** One-way pseudonymous id for analytics/audit without storing the raw number. */
export function pseudonymize(phone: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${phone}`).digest("hex").slice(0, 32);
}
