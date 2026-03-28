import { z } from 'zod';

/**
 * Environment variable validation.
 * Validates at import time — missing vars cause a clear error on startup.
 *
 * Client-side vars (NEXT_PUBLIC_*) are validated separately since they're
 * inlined at build time and available in the browser.
 */

const serverSchema = z.object({
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
    AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
    GEMINI_API_KEY: z.string().optional(),
    VAPID_PRIVATE_KEY: z.string().optional(),
});

const clientSchema = z.object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
});

function validateEnv() {
    // Skip validation during build (env vars may not be present)
    if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
        return null;
    }

    const client = clientSchema.safeParse({
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    });

    if (!client.success) {
        const message = client.error.issues.map(e => `  - ${e.path}: ${e.message}`).join('\n');
        console.error(`\n❌ Missing or invalid environment variables:\n${message}\n`);
        if (typeof window === 'undefined') {
            throw new Error(`Environment validation failed:\n${message}`);
        }
    }

    // Server-only validation (skip in browser)
    if (typeof window === 'undefined') {
        const server = serverSchema.safeParse({
            SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
            AUTH_SECRET: process.env.AUTH_SECRET,
            GEMINI_API_KEY: process.env.GEMINI_API_KEY,
            VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
        });

        if (!server.success) {
            const message = server.error.issues.map(e => `  - ${e.path}: ${e.message}`).join('\n');
            console.error(`\n❌ Missing or invalid server environment variables:\n${message}\n`);
            throw new Error(`Server environment validation failed:\n${message}`);
        }

        return { ...client.data!, ...server.data };
    }

    return client.data;
}

export const env = validateEnv();
