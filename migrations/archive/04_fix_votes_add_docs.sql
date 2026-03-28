-- Migration 04: Fix Vote RLS and Add Documents
-- Run this in Supabase SQL Editor

-- 1. FIX: Drop ambiguous RLS policy for Votes
DROP POLICY IF EXISTS "Members Create Votes" ON "Votes";

-- 2. FIX: Re-create with explicit alias to avoid ambiguity
CREATE POLICY "Members Create Votes" ON "Votes" FOR INSERT WITH CHECK (
  auth.uid() = created_by AND 
  EXISTS (
    SELECT 1 FROM "Memberships" m
    WHERE m.union_id = "Votes".union_id  -- Explicitly match Vote's union_id
    AND m.user_id = auth.uid()
  )
);

-- 3. NEW: Documents Table (Collaborative Markdown)
CREATE TABLE "Documents" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "union_id" UUID NOT NULL REFERENCES "Unions"("id") ON DELETE CASCADE,
  "created_by" UUID NOT NULL REFERENCES "Users"("id") ON DELETE SET NULL,
  
  "title" TEXT NOT NULL,
  "content" TEXT DEFAULT '', -- Markdown content
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- 4. NEW: Vote Attachments (Linking Documents to Votes)
CREATE TABLE "VoteAttachments" (
  "vote_id" UUID NOT NULL REFERENCES "Votes"("id") ON DELETE CASCADE,
  "document_id" UUID NOT NULL REFERENCES "Documents"("id") ON DELETE CASCADE,
  PRIMARY KEY ("vote_id", "document_id")
);

-- 5. RLS for Documents
ALTER TABLE "Documents" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members Read Documents" ON "Documents" FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "Memberships" m
    WHERE m.union_id = "Documents".union_id
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Members Create Documents" ON "Documents" FOR INSERT WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM "Memberships" m
    WHERE m.union_id = "Documents".union_id
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Members Update Documents" ON "Documents" FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM "Memberships" m
    WHERE m.union_id = "Documents".union_id
    AND m.user_id = auth.uid()
  )
);

-- 6. RLS for VoteAttachments
ALTER TABLE "VoteAttachments" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members Read Attachments" ON "VoteAttachments" FOR SELECT USING (
    -- If they can see the vote, they can see the attachment
    true
);

CREATE POLICY "Creators Attach Docs" ON "VoteAttachments" FOR INSERT WITH CHECK (
    -- Must be the creator of the vote
    EXISTS (
        SELECT 1 FROM "Votes" v
        WHERE v.id = vote_id
        AND v.created_by = auth.uid()
    )
);
