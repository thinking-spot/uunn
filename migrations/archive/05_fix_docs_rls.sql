-- Migration 05: Fix Document RLS Policy
-- Run this in Supabase SQL Editor

-- The previous policy used "Documents".union_id which might NOT resolve correctly in an INSERT check.
-- We will replace it with a cleaner version.

DROP POLICY IF EXISTS "Members Create Documents" ON "Documents";

CREATE POLICY "Members Create Documents" ON "Documents" FOR INSERT WITH CHECK (
  -- Ensure the creator is the current user
  auth.uid() = created_by 
  AND
  -- Ensure the user is a member of the target union
  EXISTS (
    SELECT 1 FROM "Memberships" m
    WHERE m.union_id = union_id  -- 'union_id' refers to the NEW row in Documents
    AND m.user_id = auth.uid()
  )
);
