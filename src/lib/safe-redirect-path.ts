/**
 * Returns a path-only redirect target on the same origin.
 * Blocks open redirects from absolute URLs and protocol-relative URLs (`//evil.com`).
 */
export function safeRedirectPath(raw: string | null | undefined, fallback = "/"): string {
  const trimmed = raw?.trim();
  if (!trimmed) return fallback;
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;
  return trimmed;
}
