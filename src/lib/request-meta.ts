import { headers } from 'next/headers';

/**
 * Extract the requesting client's IP address from request headers.
 *
 * Vercel sets `x-forwarded-for` and `x-real-ip` on the platform; we honor
 * `x-forwarded-for`'s leftmost entry (the original client) first.
 *
 * IMPORTANT: this is used for rate-limit key generation, NOT for security
 * decisions. Behind a proxy, headers are attacker-controllable; never use
 * the result to gate authorization. For enumeration / brute-force slowing
 * against most clients (who don't manipulate headers), the value is good
 * enough — and when an attacker spoofs headers to defeat per-IP limits,
 * they hit per-username and overall server limits anyway.
 */
export async function getClientIp(): Promise<string> {
    try {
        const h = await headers();
        const xff = h.get('x-forwarded-for');
        if (xff) {
            const first = xff.split(',')[0]?.trim();
            if (first) return first;
        }
        const xri = h.get('x-real-ip');
        if (xri) return xri.trim();
    } catch {
        // headers() unavailable in some contexts (e.g. unit tests).
    }
    return 'unknown';
}
