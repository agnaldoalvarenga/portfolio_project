import { describe, it, expect, beforeAll } from "vitest";

// getEnv() validates the whole schema, so provide a complete valid env.
beforeAll(() => {
  Object.assign(process.env, {
    WHATSAPP_VERIFY_TOKEN: "verify_token_min_16ch",
    WHATSAPP_APP_SECRET: "app_secret_min_16chars",
    WHATSAPP_ACCESS_TOKEN: "access_token_min_20_characters",
    WHATSAPP_PHONE_NUMBER_ID: "123456",
    N8N_INBOUND_WEBHOOK_URL: "https://n8n.example/webhook",
    N8N_SHARED_SECRET: "n8n_shared_secret_min_32_characters_xx",
    CONCIERGE_SERVICE_TOKEN: "service_token_min_32_characters_xxxxxx",
    ANTHROPIC_API_KEY: "sk-ant-test",
    LEAD_PSEUDONYM_SALT: "pseudonym_salt_16",
    FIELD_ENCRYPTION_KEY: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    DATABASE_URL: "postgres://u:p@localhost:5432/db",
    YOUTUBE_API_KEY: "test_youtube_api_key_1234567890",
  });
});

describe("youtube client url builder", () => {
  it("pins the official host and attaches the key + params", async () => {
    const { buildApiUrl, YOUTUBE_API_HOST } = await import("./client");
    const url = new URL(buildApiUrl("search", { q: "café barcelona", part: "snippet" }));
    expect(url.hostname).toBe(YOUTUBE_API_HOST);
    expect(url.pathname).toBe("/youtube/v3/search");
    expect(url.searchParams.get("q")).toBe("café barcelona");
    expect(url.searchParams.get("key")).toBe("test_youtube_api_key_1234567890");
  });
});
