/**
 * Allow only loopback HTTP URLs so the browser cannot redirect tokens to arbitrary hosts.
 */
export function safeCliCallbackUrl(raw: string | null | undefined): URL | null {
  if (!raw?.trim()) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase();
  if (host !== "127.0.0.1" && host !== "localhost") return null;
  return url;
}
