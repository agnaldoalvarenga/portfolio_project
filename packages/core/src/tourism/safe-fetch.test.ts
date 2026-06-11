import { describe, it, expect } from "vitest";
import { ALLOWED_HOSTS, isPrivateHost } from "./safe-fetch";

describe("connector SSRF allowlist", () => {
  it("allows known public-data hosts", () => {
    expect(ALLOWED_HOSTS.has("servicios.ine.es")).toBe(true);
    expect(ALLOWED_HOSTS.has("analyticsdata.googleapis.com")).toBe(true);
  });
  it("does not allowlist arbitrary hosts", () => {
    expect(ALLOWED_HOSTS.has("evil.example.com")).toBe(false);
    expect(ALLOWED_HOSTS.has("169.254.169.254")).toBe(false);
  });
  it("flags private / link-local hosts", () => {
    for (const h of ["localhost", "127.0.0.1", "10.0.0.5", "192.168.1.1", "169.254.169.254", "::1"]) {
      expect(isPrivateHost(h)).toBe(true);
    }
    expect(isPrivateHost("servicios.ine.es")).toBe(false);
  });
});
