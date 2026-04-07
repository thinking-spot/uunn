import { describe, it, expect, beforeEach, vi } from 'vitest';

// Use dynamic import to get a fresh module for each test
async function getFreshRateLimit() {
  // Reset modules to get a fresh store
  vi.resetModules();
  const mod = await import('@/lib/rate-limit');
  return mod.rateLimit;
}

describe('Rate Limiter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('allows requests under the limit', async () => {
    const rateLimit = await getFreshRateLimit();
    const result = rateLimit('test-user-1', 5, 60_000);
    expect(result.allowed).toBe(true);
  });

  it('allows exactly maxRequests', async () => {
    const rateLimit = await getFreshRateLimit();
    for (let i = 0; i < 5; i++) {
      const result = rateLimit('test-user-2', 5, 60_000);
      expect(result.allowed).toBe(true);
    }
  });

  it('blocks requests over the limit', async () => {
    const rateLimit = await getFreshRateLimit();
    // Use up the limit
    for (let i = 0; i < 5; i++) {
      rateLimit('test-user-3', 5, 60_000);
    }
    // 6th request should be blocked
    const result = rateLimit('test-user-3', 5, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it('tracks separate keys independently', async () => {
    const rateLimit = await getFreshRateLimit();
    // Max out key A
    for (let i = 0; i < 3; i++) {
      rateLimit('key-a', 3, 60_000);
    }
    expect(rateLimit('key-a', 3, 60_000).allowed).toBe(false);

    // Key B should still be allowed
    expect(rateLimit('key-b', 3, 60_000).allowed).toBe(true);
  });

  it('allows requests after window expires', async () => {
    const rateLimit = await getFreshRateLimit();
    const now = Date.now();

    // Mock Date.now to control time
    vi.spyOn(Date, 'now').mockReturnValue(now);

    // Max out the limit
    for (let i = 0; i < 3; i++) {
      rateLimit('time-test', 3, 1_000); // 1 second window
    }
    expect(rateLimit('time-test', 3, 1_000).allowed).toBe(false);

    // Advance time past the window
    vi.spyOn(Date, 'now').mockReturnValue(now + 1_001);

    // Should be allowed again
    expect(rateLimit('time-test', 3, 1_000).allowed).toBe(true);
  });
});
