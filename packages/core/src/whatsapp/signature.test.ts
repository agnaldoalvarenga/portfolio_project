import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { verifyMetaSignature } from "./signature";

const SECRET = "test_app_secret_at_least_16_chars";
const sign = (body: string) => "sha256=" + createHmac("sha256", SECRET).update(body).digest("hex");

describe("verifyMetaSignature", () => {
  it("accepts a valid signature", () => {
    const body = JSON.stringify({ a: 1 });
    expect(verifyMetaSignature(body, sign(body), SECRET)).toBe(true);
  });
  it("rejects a tampered body (replay/forgery)", () => {
    const sig = sign(JSON.stringify({ a: 1 }));
    expect(verifyMetaSignature(JSON.stringify({ a: 2 }), sig, SECRET)).toBe(false);
  });
  it("rejects missing/malformed header", () => {
    expect(verifyMetaSignature("{}", null, SECRET)).toBe(false);
    expect(verifyMetaSignature("{}", "deadbeef", SECRET)).toBe(false);
  });
});
