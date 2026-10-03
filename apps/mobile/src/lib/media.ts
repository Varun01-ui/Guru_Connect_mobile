import { API_BASE_URL } from './api';

const LOOPBACK = /^(https?:\/\/)(localhost|127\.0\.0\.1|10\.0\.2\.2)(:\d+)?(?=[/?#]|$)/i;

// A backend running on a dev machine may build URLs with "localhost", which a
// phone can't reach (localhost is the phone itself). When a URL points at a
// loopback host, send it to the host the API is reached on instead. Real CDN or
// storage URLs (R2, S3) never match, so they pass through untouched.
export function rewriteLoopbackHost(url: string, apiBaseUrl: string): string {
  const origin = apiBaseUrl.match(/^https?:\/\/[^/]+/i)?.[0];
  if (!origin || !LOOPBACK.test(url)) return url;
  return url.replace(LOOPBACK, origin);
}

// Use for every image URL the server hands us (avatars, logos, banners).
export function mediaUrl(url: string | null | undefined): string | null {
  return url ? rewriteLoopbackHost(url, API_BASE_URL) : null;
}
