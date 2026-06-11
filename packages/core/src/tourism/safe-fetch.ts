const ALLOWED_HOSTS = new Set([
  "servicios.ine.es", "www.ine.es", "ine.es",
  "travelbi.turismodeportugal.pt",
  "www.hosteltur.com", "hosteltur.com",
  "analyticsdata.googleapis.com",
]);

function isPrivateHost(host: string): boolean {
  return /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|::1|0\.0\.0\.0)/i.test(host);
}

/** Allowlisted, https-only, no-redirect JSON fetch for public data connectors. */
export async function safeFetchJson(url: string, init?: RequestInit): Promise<unknown> {
  const u = new URL(url);
  if (u.protocol !== "https:") throw new Error("Only https is allowed");
  if (isPrivateHost(u.hostname) || !ALLOWED_HOSTS.has(u.hostname)) {
    throw new Error(`Host not allowlisted: ${u.hostname}`);
  }
  const res = await fetch(u, { ...init, redirect: "manual" });
  if (res.status >= 300 && res.status < 400) throw new Error("Redirects are not allowed for connectors");
  if (!res.ok) throw new Error(`Connector fetch failed: ${res.status}`);
  return res.json();
}

export { ALLOWED_HOSTS, isPrivateHost };
