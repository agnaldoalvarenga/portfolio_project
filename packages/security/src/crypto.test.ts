import { describe, it, expect, beforeAll } from "vitest";
import { randomBytes } from "node:crypto";
import { encryptField, decryptField } from "./crypto";

beforeAll(() => { process.env.FIELD_ENCRYPTION_KEY = randomBytes(32).toString("base64"); });

describe("AES-256-GCM field crypto", () => {
  it("round-trips and produces unique ciphertexts (random IV)", () => {
    const pt = "+34 600 123 456";
    const a = encryptField(pt), b = encryptField(pt);
    expect(a).not.toBe(b);
    expect(decryptField(a)).toBe(pt);
  });
  it("rejects tampered ciphertext (GCM auth)", () => {
    const env = encryptField("secret");
    const bad = Buffer.from(env, "base64"); bad[28] ^= 1;
    expect(() => decryptField(bad.toString("base64"))).toThrow();
  });
});
