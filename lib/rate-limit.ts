/**
 * In-memory rate limiter.
 * WARNING: This resets on process restart and is NOT shared across serverless
 * instances. For multi-instance / Vercel production deployments, replace the
 * `store` Map with a Redis-backed counter (e.g. Upstash @upstash/ratelimit).
 */

type Entry = { count: number; resetAt: number }

const store = new Map<string, Entry>()

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  let entry = store.get(key)

  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowMs }
    store.set(key, entry)
  }

  entry.count++
  const remaining = Math.max(0, limit - entry.count)
  const allowed = entry.count <= limit

  return { allowed, remaining, resetAt: entry.resetAt }
}

export function resetRateLimit(key: string): void {
  store.delete(key)
}

// Extracts client IP from Next.js / Vercel request headers.
export function getIp(
  headers: Headers | Record<string, string | string[] | undefined>,
): string {
  if (headers instanceof Headers) {
    return headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  }
  const fwd = headers['x-forwarded-for']
  if (Array.isArray(fwd)) return fwd[0]?.trim() ?? 'unknown'
  return fwd?.split(',')[0]?.trim() ?? 'unknown'
}
