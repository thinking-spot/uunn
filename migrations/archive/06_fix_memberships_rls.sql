-- Migration 06: Fix Memberships Visibility & Document Creation
-- Run this in Supabase SQL Editor

-- CRITICAL FIX: The "Check Membership" logic in other policies fails if the user
-- cannot SELECT the membership row itself due to RLS on the "Memberships" table.

-- 1. Ensure Memberships are readable by the owner
-- First, drop if it exists to avoid duplication errors (though ON CONFLICT not supported in policies readily)
DROP POLICY IF EXISTS "Users View Own Memberships" ON "Memberships";

CREATE POLICY "Users View Own Memberships" ON "Memberships" FOR SELECT USING (
  auth.uid() = user_id
);

-- 2. Re-apply the Documents Creation Policy with explicit table references
DROP POLICY IF EXISTS "Members Create Documents" ON "Documents";

CREATE POLICY "Members Create Documents" ON "Documents" FOR INSERT WITH CHECK (
  auth.uid() = created_by 
  AND
  EXISTS (
    SELECT 1 FROM "Memberships" m
    WHERE m.union_id = "Documents".union_id
    AND m.user_id = auth.uid()
  )
);
