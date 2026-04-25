import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/request-meta';

// Keep in sync with BCRYPT_COST in src/lib/actions.ts.
const BCRYPT_COST = 12;

// User type definition matching our DB
interface User {
    id: string;
    username: string;
    password_hash: string;
    public_key?: string;
}

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ username: z.string(), password: z.string().min(1) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { username, password } = parsedCredentials.data;

                    // Per-IP limit catches "credential stuffing across many usernames"
                    // — a per-username limit alone misses this pattern.
                    const ip = await getClientIp();
                    {
                        const { allowed } = rateLimit(`login-ip:${ip}`, 20, 15 * 60 * 1000);
                        if (!allowed) {
                            throw new Error("Too many login attempts from this network. Please try again later.");
                        }
                    }
                    // Per-username limit: 5 attempts per 15 minutes (unchanged).
                    {
                        const { allowed } = rateLimit(`login:${username}`, 5, 15 * 60 * 1000);
                        if (!allowed) {
                            throw new Error("Too many login attempts. Please try again later.");
                        }
                    }

                    // Query Supabase instead of local DB
                    const { data: user, error } = await supabaseAdmin
                        .from('Users')
                        .select('*')
                        .eq('username', username)
                        .single();

                    if (error || !user) {
                        return null;
                    }

                    const passwordsMatch = await bcrypt.compare(password, user.password_hash);

                    if (passwordsMatch) {
                        // Lazy upgrade: rehash with current cost factor if the stored hash is weaker.
                        try {
                            const stored = bcrypt.getRounds(user.password_hash);
                            if (stored < BCRYPT_COST) {
                                const upgraded = await bcrypt.hash(password, BCRYPT_COST);
                                await supabaseAdmin
                                    .from('Users')
                                    .update({ password_hash: upgraded })
                                    .eq('id', user.id);
                            }
                        } catch {
                            // Don't block login on upgrade failure.
                        }

                        return {
                            id: user.id,
                            name: user.username,
                        };
                    }
                }
                return null;
            },
        }),
    ],
});
