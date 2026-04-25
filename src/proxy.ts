import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from './auth.config';

const { auth } = NextAuth(authConfig);

/**
 * Build a per-request strict CSP with a nonce-only script-src.
 *
 * - 'nonce-<value>' — only inline scripts carrying the matching nonce run
 * - 'strict-dynamic' — propagates trust transitively, so we don't have to
 *   list every JS chunk URL
 * - 'unsafe-inline' is kept as a CSP-Level-2 fallback. Browsers that
 *   understand CSP3 nonces (every modern browser) ignore 'unsafe-inline'
 *   when a nonce is present, so the effective policy is strict.
 * - 'unsafe-eval' is dropped in production. Dev mode keeps it because
 *   Turbopack's HMR client uses eval; we never ship that to users.
 */
function buildCsp(nonce: string, isDev: boolean): string {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const scriptSrc = [
        "'self'",
        `'nonce-${nonce}'`,
        "'strict-dynamic'",
        "'unsafe-inline'",
        ...(isDev ? ["'unsafe-eval'"] : []),
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

function generateNonce(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
}

// Next.js 16 renamed the "middleware" file convention to "proxy" (file lives
// at src/proxy.ts). Functionally identical — runs at the edge before the
// route handler. We wrap NextAuth's middleware so it (a) enforces the
// `authorized` callback from auth.config.ts and (b) attaches a per-request
// CSP nonce on every response.
export default auth((req) => {
    const nonce = generateNonce();
    const isDev = process.env.NODE_ENV === 'development';
    const csp = buildCsp(nonce, isDev);

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-nonce', nonce);

    const res = NextResponse.next({ request: { headers: requestHeaders } });
    res.headers.set('Content-Security-Policy', csp);
    return res;
});

export const config = {
    // Skip API routes (NextAuth's session endpoints handle their own headers),
    // static assets, and image optimizer output.
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
