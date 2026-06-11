/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@ostentaculus/core",
    "@ostentaculus/db",
    "@ostentaculus/security",
    "@ostentaculus/ai",
    "@ostentaculus/api",
  ],
  // Security headers (CSP/HSTS). Tighten CSP per real asset origins before prod.
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Content-Security-Policy", value: "default-src 'self'; frame-ancestors 'none'; base-uri 'self'" },
      ],
    }];
  },
};
export default nextConfig;
