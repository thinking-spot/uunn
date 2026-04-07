import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  output: "standalone",
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
        ...(!isDev ? [{
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            `connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL || ''} wss://*.supabase.co *.sentry.io`,
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "font-src 'self'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
          ].join("; "),
        }] : []),
      ],
    },
  ],
};

export default withSentryConfig(nextConfig, {
  // Suppress source map upload warnings when SENTRY_AUTH_TOKEN is not set
  silent: true,

  // Disable source map upload (enable later with SENTRY_AUTH_TOKEN)
  sourcemaps: {
    disable: true,
  },
});
