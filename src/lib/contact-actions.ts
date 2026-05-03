'use server';

import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import { logError } from '@/lib/log';
import { getClientIp } from '@/lib/request-meta';

const MIN_DWELL_MS = 2_000;

const ContactSchema = z.object({
    message: z.string().trim().min(1, 'Message is required.').max(5_000, 'Message is too long.'),
    preferredContact: z.string().trim().max(200, 'Contact info is too long.').optional().default(''),
    // Honeypot — must be empty. Real users never see this field.
    website: z.string().max(0).optional().default(''),
    // Form mount timestamp from the client; checked against server clock for
    // a minimum dwell time. Spoofable in principle, but catches naive bots
    // that submit instantly.
    formMountedAt: z.number().int().nonnegative().optional(),
});

export type ContactSubmissionResult = { ok: true } | { ok: false; error: string };

export async function submitContactMessage(input: {
    message: string;
    preferredContact?: string;
    website?: string;
    formMountedAt?: number;
}): Promise<ContactSubmissionResult> {
    // Per-IP throttle.
    const ip = await getClientIp();
    {
        const { allowed } = rateLimit(`contact-ip:${ip}`, 5, 60 * 60 * 1000);
        if (!allowed) {
            return { ok: false, error: 'Too many submissions from this network. Please try again later.' };
        }
    }
    // Global throttle — bounds total writes even if IPs rotate.
    {
        const { allowed } = rateLimit('contact-global', 100, 60 * 60 * 1000);
        if (!allowed) {
            return { ok: false, error: 'Too many submissions right now. Please try again later.' };
        }
    }

    const parsed = ContactSchema.safeParse(input);
    if (!parsed.success) {
        // Honeypot trips the .max(0) check on `website`. Don't reveal the
        // trap — return a generic success so bots don't learn the bypass.
        if (parsed.error.issues.some(i => i.path[0] === 'website')) {
            return { ok: true };
        }
        return { ok: false, error: parsed.error.issues.map(e => e.message).join(' ') };
    }

    // Dwell-time check. Treat absent timestamp as too-fast (a real form
    // always sends one). Same silent-success policy as the honeypot.
    const mountedAt = parsed.data.formMountedAt;
    if (typeof mountedAt !== 'number' || Date.now() - mountedAt < MIN_DWELL_MS) {
        return { ok: true };
    }

    const { message } = parsed.data;
    // Strip CR/LF/tabs from preferredContact: prevents header injection if
    // this value is ever placed in a line-delimited context (email header,
    // log line, etc.) and keeps it sensible as a single-line reply hint.
    const preferredContact = parsed.data.preferredContact.replace(/[\r\n\t]+/g, ' ').trim();

    try {
        const { error } = await supabaseAdmin.from('ContactMessages').insert({
            message,
            preferred_contact: preferredContact ? preferredContact : null,
        });
        if (error) throw error;
    } catch (error) {
        logError('submitContactMessage: insert failed', error);
        return { ok: false, error: 'Could not send your message. Please try again.' };
    }

    return { ok: true };
}
