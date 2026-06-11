import { describe, it, expect } from "vitest";
import { toPublicCard } from "./dto";

describe("public DTO whitelist", () => {
  it("emits only safe fields and drops PII/POS/internal columns", () => {
    const row = {
      id: "est_1", name: "Café Niu", category: "cafe", city: "Barcelona",
      country: "ES", latitude: 41.39, longitude: 2.16, youtubeVideoId: "dQw4w9WgXcQ",
      // hostile extras that must never leak:
      pos_connected: "true", owner_email: "owner@x.com", avg_ticket: 12.5, contact_enc: "secret",
    };
    const card = toPublicCard(row);
    expect(Object.keys(card).sort()).toEqual(
      ["category", "city", "country", "id", "latitude", "longitude", "name", "youtubeVideoId"],
    );
    expect(JSON.stringify(card)).not.toMatch(/owner@x|secret|avg_ticket|pos_connected/);
  });
  it("normalizes a missing video id to null", () => {
    const card = toPublicCard({ id: "1", name: "a", category: "c", city: "x", country: "ES", latitude: 0, longitude: 0 });
    expect(card.youtubeVideoId).toBeNull();
  });
});
