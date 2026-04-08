import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';

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

                    // Rate limit: 5 attempts per username per 15 minutes
                    const { allowed } = rateLimit(`login:${username}`, 5, 15 * 60 * 1000);
                    if (!allowed) {
                        throw new Error("Too many login attempts. Please try again later.");
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
