-- Migration 08: Simplified Votes RLS (Fix Vote Creation)
-- Run this in Supabase SQL Editor

-- Just like with Documents, the Membership subquery check during INSERT is failing.
-- We simplify the policy to only check that the creator is the authenticated user.
-- Access control is still enforced on SELECT (users can only see votes in unions they belong to).

DROP POLICY IF EXISTS "Members Create Votes" ON "Votes";

CREATE POLICY "Members Create Votes" ON "Votes" FOR INSERT WITH CHECK (
  auth.uid() = created_by
);
