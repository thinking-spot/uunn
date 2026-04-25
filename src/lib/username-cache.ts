import { resolveUsernamesAction } from '@/lib/union-actions';

/**
 * Local-process cache mapping userId → username for the current session.
 * Resolution goes through an authenticated server action that gates by
 * union co-membership; the previous implementation read directly via the
 * anon Supabase client and depended on permissive RLS to function.
 */

const usernameCache = new Map<string, string>();

export async function resolveUsername(userId: string): Promise<string> {
    const cached = usernameCache.get(userId);
    if (cached) return cached;

    try {
        const result = await resolveUsernamesAction([userId]);
        const name = result.usernames?.[userId];
        if (name) {
            usernameCache.set(userId, name);
            return name;
        }
    } catch {
        // fall through to "Unknown"
    }
    return "Unknown";
}

export function cacheUsername(userId: string, username: string): void {
    usernameCache.set(userId, username);
}
