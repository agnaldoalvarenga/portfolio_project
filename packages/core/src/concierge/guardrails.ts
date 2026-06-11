import { redactPII } from "./pii";

/**
 * Sanitize inbound free text before it reaches the LLM or logs:
 * replace control characters with spaces, cap length, redact PII.
 * Implemented with codePointAt (not a regex control-char class) to keep the
 * source free of raw control bytes.
 */
export function prepareUserText(input: string | null): string | null {
  if (input == null) return null;
  let out = "";
  for (const ch of input) {
    const code = ch.codePointAt(0)!;
    out += code < 0x20 || code === 0x7f ? " " : ch;
  }
  const cleaned = out.trim().slice(0, 500);
  return cleaned ? redactPII(cleaned) : null;
}
