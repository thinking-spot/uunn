/**
 * Server-side error logging with PII scrubbing.
 *
 * Vercel logs are visible to project collaborators, and Supabase error objects
 * commonly include the failing row's payload (encrypted blobs, IVs, user ids).
 * Use these helpers instead of `console.error("...", error)` to keep logs free
 * of user content.
 */

interface SafeError {
    code?: string;
    name?: string;
    message?: string;
}

/**
 * Reduce an error to a non-sensitive shape. Drops `details`, `hint`, stacks,
 * and any other field that may contain row data.
 */
function safe(err: unknown): SafeError {
    if (!err || typeof err !== 'object') return { message: 'unknown' };
    const e = err as Record<string, unknown>;
    return {
        code: typeof e.code === 'string' ? e.code : undefined,
        name: typeof e.name === 'string' ? e.name : undefined,
        // Supabase `message` is a generic phrase; safe to log. Truncate as defense.
        message: typeof e.message === 'string' ? e.message.slice(0, 200) : undefined,
    };
}

export function logError(label: string, err?: unknown) {
    if (err === undefined) {
        console.error(`[uunn] ${label}`);
        return;
    }
    console.error(`[uunn] ${label}`, safe(err));
}
