import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
        // Route NextAuth errors back to the login page rather than the default
        // /api/auth/error page (which can leak NextAuth version/diagnostics).
        error: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const protectedPrefixes = [
                '/dashboard',
                '/unions',
                '/messages',
                '/votes',
                '/documents',
                '/members',
                '/settings',
            ];
            const isProtected = protectedPrefixes.some(p => nextUrl.pathname.startsWith(p));

            if (isProtected) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            }
            return true;
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
                session.user.name = token.name;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id;
                token.name = user.name;
            }
            return token;
        }
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
