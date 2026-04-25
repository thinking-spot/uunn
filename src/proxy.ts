import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from './auth.config';

const { auth } = NextAuth(authConfig);

/**
 * Content-Security-Policy emitted on every response.
 *
 * NOTE on H1 (strict nonce-based CSP): an earlier version of this file
 * emitted a per-request `'nonce-X' 'strict-dynamic'` policy. That breaks
 * statically-prerendered pages on Vercel — the prerendered HTML carries no
 * matching nonces in its <script> tags, modern browsers ignore the
 * `'unsafe-inline'` fallback when a nonce is present, and every inline
 * script is blocked → blank pages.
 *
 * Implementing strict CSP correctly requires switching the affected routes
 * to dynamic rendering (`export const dynamic = 'force-dynamic'`) so Next.js
 * stamps the request-time nonce into the served HTML. That's its own
 * architectural change. For now we ship a permissive `'unsafe-inline'`
 * policy — same posture as before the audit — and leave H1 as a tracked
 * follow-up. The other H1-adjacent gains (COOP, CORP, object-src 'none',
 * upgrade-insecure-requests, drop X-XSS-Protection) are kept.
 */
function buildCsp(_isDev: boolean): string {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    // 'unsafe-eval' matches the policy that was in place before the audit.
    // Some libraries (Sentry integrations, certain bundle paths) use eval at
    // runtime; dropping it caused enough uncertainty that we keep parity with
    // pre-audit behavior here. Removing 'unsafe-eval' belongs in the same
    // follow-up PR that introduces strict nonces (deferred H1).
    const scriptSrc = [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
    ].join(' ');

    return [
        "default-src 'self'",
        `script-src ${scriptSrc}`,
        `connect-src 'self' ${supabaseUrl} wss://*.supabase.co *.sentry.io`,
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
        "upgrade-insecure-requests",
    ].join('; ');
}

// Next.js 16 renamed the "middleware" file convention to "proxy" (file lives
// at src/proxy.ts). Functionally identical — runs at the edge before the
// route handler. We wrap NextAuth's middleware so it (a) enforces the
// `authorized` callback from auth.config.ts (this PR is the first time edge
// gating actually runs — see PR description) and (b) emits a single
// consistent CSP across all routes.
export default auth(() => {
    const isDev = process.env.NODE_ENV === 'development';
    const csp = buildCsp(isDev);

    const res = NextResponse.next();
    res.headers.set('Content-Security-Policy', csp);
    return res;
});

export const config = {
    // Skip API routes (NextAuth's session endpoints handle their own headers),
    // static assets, and image optimizer output.
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
