export const RATE_LIMIT = 20;
export const RATE_WINDOW_MS = 60_000;

/* Best-effort limiter per client address. Each serverless instance keeps its own counts. */
export function createLimiter(limit = RATE_LIMIT, windowMs = RATE_WINDOW_MS): (key: string, now: number) => boolean {
  const hits = new Map<string, number[]>();
  return (key, now) => {
    const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
    const allowed = recent.length < limit;
    if (allowed) {
      recent.push(now);
    }
    hits.set(key, recent);
    return allowed;
  };
}
