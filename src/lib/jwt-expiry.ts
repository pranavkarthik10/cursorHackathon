import { Buffer } from "node:buffer";

/**
 * Best-effort JWT shape check (three base64url segments). Does not verify the signature.
 */
export function looksLikeJwt(token: string): boolean {
  const parts = token.split(".");
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

function base64UrlToUtf8(segment: string): string {
  const pad = segment.length % 4;
  const base64 =
    segment.replace(/-/g, "+").replace(/_/g, "/") + (pad ? "=".repeat(4 - pad) : "");
  return Buffer.from(base64, "base64").toString("utf8");
}

function readJwtExpSeconds(token: string): number | null {
  if (!looksLikeJwt(token)) return null;
  try {
    const payload = JSON.parse(base64UrlToUtf8(token.split(".")[1]!)) as {
      exp?: unknown;
    };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

/** True when the JWT has an exp claim and it is in the past (with small clock skew). */
export function isJwtExpired(token: string, skewSeconds = 30): boolean {
  const exp = readJwtExpSeconds(token);
  if (exp == null) return false;
  return Date.now() / 1000 >= exp - skewSeconds;
}

export function jwtExpiryIsoDate(token: string): string | null {
  const exp = readJwtExpSeconds(token);
  if (exp == null) return null;
  try {
    return new Date(exp * 1000).toISOString();
  } catch {
    return null;
  }
}
