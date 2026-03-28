import { supabase } from '@/lib/supabase';

const usernameCache = new Map<string, string>();

export async function resolveUsername(userId: string): Promise<string> {
    const cached = usernameCache.get(userId);
    if (cached) return cached;

    const { data: user } = await supabase.from('Users').select('username').eq('id', userId).single();
    const name = user?.username || "Unknown";
    usernameCache.set(userId, name);
    return name;
}

export function cacheUsername(userId: string, username: string): void {
    usernameCache.set(userId, username);
}
