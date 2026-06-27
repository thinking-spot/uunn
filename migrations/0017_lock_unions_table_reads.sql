-- Migration: Lock Unions table reads to authenticated users
--
-- The v1 schema shipped `Public Read Unions USING (true)`, which lets
-- anyone with the shipped NEXT_PUBLIC_SUPABASE_ANON_KEY enumerate every
-- row in the Unions table via the Supabase REST API. Because the row
-- carries `invite_code` directly, that's an enumeration of every
-- union's name + invite credential — for an organizing platform, "a
-- union called Workers at $Company exists" is itself sensitive.
--
-- The hardening migration (0006) tightened Users, Memberships, and
-- UnionInvites but never closed Unions. Close it now.
--
-- In-app discovery + invite-code lookup go through server actions that
-- use supabaseAdmin (which bypasses RLS), so this is purely a defense
-- against direct REST API enumeration by an unauthenticated caller.

DROP POLICY IF EXISTS "Public Read Unions" ON "Unions";

CREATE POLICY "Authenticated Read Unions" ON "Unions" FOR SELECT USING (
    auth.uid() IS NOT NULL
);
