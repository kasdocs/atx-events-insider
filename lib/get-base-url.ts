import { headers } from 'next/headers';

export async function getBaseUrl() {
  // Prefer explicit env (works in prod + previews + local if you set it)
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL;

  if (explicit) return explicit.replace(/\/$/, '');

  // Vercel provides the hostname without protocol
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  // Fallback: infer from request headers (works in server components / route handlers)
  const h = await headers();
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host = h.get('x-forwarded-host') ?? h.get('host');

  if (host) return `${proto}://${host}`;

  // Final fallback
  return 'http://localhost:3000';
}
