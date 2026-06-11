import { describe, it, expect } from "vitest";
import { formatChapters, sanitizeTags, buildPinnedComment } from "./seo";

describe("youtube seo helpers", () => {
  it("formats chapters as m:ss labels", () => {
    expect(formatChapters([{ seconds: 0, label: "Intro" }, { seconds: 95, label: "La masa" }]))
      .toBe("0:00 Intro\n1:35 La masa");
  });
  it("dedupes, trims and caps tags", () => {
    const out = sanitizeTags(["  Barcelona ", "barcelona", "café", "café"]);
    expect(out).toEqual(["Barcelona", "café"]);
  });
  it("respects the total tag budget", () => {
    const many = Array.from({ length: 100 }, (_, i) => `tag${i}`);
    const joined = sanitizeTags(many).join(",");
    expect(joined.length).toBeLessThanOrEqual(480);
  });
  it("builds an https pinned comment and rejects non-https", () => {
    expect(buildPinnedComment("Guía gratis:", "https://ostentaculus.com/g")).toContain("https://ostentaculus.com/g");
    expect(() => buildPinnedComment("x", "http://insecure.com")).toThrow();
  });
});
