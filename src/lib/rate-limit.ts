/**
 * Simple in-memory rate limiter for server actions.
 * Uses a sliding window approach per key (userId or IP).
 *
 * Note: In a multi-instance deployment, replace with Redis-backed rate limiting.
 */

interface RateLimitEntry {
    timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        entry.timestamps = entry.timestamps.filter(t => now - t < 900_000); // 15 min max window
        if (entry.timestamps.length === 0) store.delete(key);
    }
}, 300_000);

/**
 * Check if a request should be rate limited.
 * @param key - Unique identifier (e.g., userId, "login:username")
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns { allowed: boolean, retryAfterMs?: number }
 */
export function rateLimit(
    key: string,
    maxRequests: number,
    windowMs: number
): { allowed: boolean; retryAfterMs?: number } {
    const now = Date.now();
    let entry = store.get(key);

    if (!entry) {
        entry = { timestamps: [] };
        store.set(key, entry);
    }

    // Remove timestamps outside the window
    entry.timestamps = entry.timestamps.filter(t => now - t < windowMs);

    if (entry.timestamps.length >= maxRequests) {
        const oldest = entry.timestamps[0];
        const retryAfterMs = windowMs - (now - oldest);
        return { allowed: false, retryAfterMs };
    }

    entry.timestamps.push(now);
    return { allowed: true };
}
