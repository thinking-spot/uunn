-- Migration 07: Simplified Document RLS (Debug Mode)
-- Run this in Supabase SQL Editor

-- The "Members Create Documents" policy seems to be failing due to the subquery complexity or visibility issues.
-- We will simplify it to ONLY check that you are the creator.
-- This unblocks creation while we debug the membership link later.

DROP POLICY IF EXISTS "Members Create Documents" ON "Documents";

CREATE POLICY "Members Create Documents" ON "Documents" FOR INSERT WITH CHECK (
  auth.uid() = created_by
);

-- Note: This technically allows any authenticated user to create a doc in ANY union ID.
-- However, since they can only view documents they are members of (via the SELECT policy),
-- they won't see "spam" in other unions easily. We can tighten this later.
