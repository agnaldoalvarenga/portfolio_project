import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, resetRateLimits } from "./rate-limit";

describe("fixed-window rate limit", () => {
  beforeEach(() => resetRateLimits());

  it("allows up to the limit then blocks within the window", () => {
    const now = 1_000_000;
    for (let i = 0; i < 3; i++) {
      expect(rateLimit("k", 3, 1000, now).allowed).toBe(true);
    }
    expect(rateLimit("k", 3, 1000, now).allowed).toBe(false);
  });

  it("resets after the window elapses", () => {
    const now = 1_000_000;
    rateLimit("k", 1, 1000, now);
    expect(rateLimit("k", 1, 1000, now).allowed).toBe(false);
    expect(rateLimit("k", 1, 1000, now + 1001).allowed).toBe(true);
  });

  it("isolates keys", () => {
    const now = 1_000_000;
    rateLimit("a", 1, 1000, now);
    expect(rateLimit("b", 1, 1000, now).allowed).toBe(true);
  });
});
