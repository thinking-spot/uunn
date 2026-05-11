#!/usr/bin/env node
/**
 * Fetch contact-form submissions from Supabase.
 *
 * Usage:
 *   node --env-file=.env.local scripts/fetch-contact-messages.mjs
 *
 * Flags:
 *   --limit=N        Max rows to return (default: 50)
 *   --since=ISO      Only rows created at or after this ISO timestamp
 *                    e.g. --since=2026-05-01
 *   --json           Emit raw JSON instead of the pretty-printed view
 *
 * Reads from the ContactMessages table via the service role key.
 * The table has RLS enabled with no policies, so this script will not
 * work with the anon key — it requires SUPABASE_SERVICE_ROLE_KEY.
 */

import { createClient } from '@supabase/supabase-js';

const args = Object.fromEntries(
    process.argv.slice(2).map((arg) => {
        const m = arg.match(/^--([^=]+)(?:=(.*))?$/);
        return m ? [m[1], m[2] ?? true] : [arg, true];
    })
);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    console.error('Run with: node --env-file=.env.local scripts/fetch-contact-messages.mjs');
    process.exit(1);
}

const limit = Math.min(parseInt(args.limit ?? '50', 10) || 50, 1000);
const since = typeof args.since === 'string' ? args.since : null;

const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

let query = supabase
    .from('ContactMessages')
    .select('id, created_at, message, preferred_contact')
    .order('created_at', { ascending: false })
    .limit(limit);

if (since) query = query.gte('created_at', since);

const { data, error } = await query;

if (error) {
    console.error('Query failed:', error.message);
    process.exit(1);
}

if (args.json) {
    console.log(JSON.stringify(data, null, 2));
    process.exit(0);
}

if (!data || data.length === 0) {
    console.log('No messages found.');
    process.exit(0);
}

const fmt = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
});

console.log(`\n${data.length} message${data.length === 1 ? '' : 's'}:\n`);
for (const row of data) {
    const when = fmt.format(new Date(row.created_at));
    const contact = row.preferred_contact ? row.preferred_contact : '(no contact provided)';
    console.log(`─── ${when} ─── ${row.id}`);
    console.log(`Contact: ${contact}`);
    console.log(`\n${row.message}\n`);
}
